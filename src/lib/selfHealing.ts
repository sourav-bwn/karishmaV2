import { memoryForChat } from "./memory";
import { ensureFirebaseAuth, saveConversationToCloud, deleteConversationFromCloud, SyncChatSession } from "./firebase";

export type ErrorCategory = "chat_api" | "image_api" | "file_upload" | "cloud_sync" | "auth" | "runtime";

export type RecoveryStatus = "auto_recovered" | "retrying" | "unrecoverable" | "fallback_applied";

export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  category: ErrorCategory;
  context: string;
  message: string;
  rootCause: string;
  recoveryAction: string;
  status: RecoveryStatus;
  retryCount: number;
  patchedFile?: string;
  patchDescription?: string;
  verified?: boolean;
}

export function getCustomApiHeaders(): Record<string, string> {
  const token = sessionStorage.getItem("karishma_mvp_access_token");
  return token ? { Authorization: `Bearer ${token}` } : {}; // Never a provider key.
}

type SelfHealingListener = (log: ErrorLogEntry[]) => void;

/* ------------------------------------------------------------------ *
 * Chat call retry/streaming helpers
 * ------------------------------------------------------------------ *
 * The backend answers POST /api/chat either with plain JSON {text,...} or,
 * when {stream:true} was requested, with SSE events:
 *   data: {"type":"start"|"reasoning"|"delta"|"notice"|"error"|"done",...}
 *   data: [DONE]
 * Both content types are accepted by consumeChatResponse below.
 * ------------------------------------------------------------------ */

// Must exceed the backend's slowest single chat request (NVIDIA is capped at
// 120s server-side); this is the whole-request deadline, not per-chunk.
const CHAT_HTTP_TIMEOUT_MS = 120_000;
// Max silence between two stream chunks before the stream is treated as dead.
const CHAT_STREAM_IDLE_TIMEOUT_MS = 45_000;
// Attempts per model for transient failures only (network, 429, 5xx, timeout).
const CHAT_MAX_ATTEMPTS_PER_MODEL = 1;

interface ChatFailure {
  transient: boolean;
  message: string;
}

/**
 * Decide whether a chat failure is worth retrying. Only transient problems
 * (network errors, HTTP 429/5xx, timeouts) are; 4xx responses like 400/401/403
 * fail fast so the user is not left waiting on a guaranteed-to-fail retry.
 */
function classifyChatFailure(err: any): ChatFailure {
  const msg = String(err?.message || err || "");

  if (err?.name === "AbortError") {
    return { transient: false, message: "Generation cancelled by user." };
  }
  // fetch() throws TypeError for network-level failures ("Failed to fetch" in
  // Chrome, "Load failed" in Safari/WebView). Be explicit about the cause so
  // users never see the raw, meaningless browser string again.
  if (err instanceof TypeError || /failed to fetch|load failed|networkerror|network request failed|service unavailable/i.test(msg)) {
    return {
      transient: true,
      message: "Could not reach the Karishma backend (network error). Check your connection and try again.",
    };
  }
  const status = err?.status;
  if (typeof status === "number") {
    if (status === 401 || status === 403) {
      return { transient: false, message: msg || `Access unauthorized or forbidden (HTTP ${status}). Check CORS/API configuration.` };
    }
    if (status === 404) {
      return { transient: false, message: msg || "Endpoint not found (HTTP 404). Check backend routing." };
    }
    if (status === 429 || status >= 500) return { transient: true, message: msg || `HTTP ${status}` };
    return { transient: false, message: msg || `HTTP ${status}` };
  }
  if (/rate limit|too many requests|timed out|timeout|temporarily unavailable|server error|stream (ended|interrupted)/i.test(msg)) {
    return { transient: true, message: msg };
  }
  return { transient: false, message: msg || "Unknown chat error." };
}

/** Exponential backoff with jitter, capped, abortable. */
function backoffSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    if (signal) {
      if (signal.aborted) {
        clearTimeout(timer);
        const abortErr = new Error("Generation cancelled by user.");
        abortErr.name = "AbortError";
        reject(abortErr);
        return;
      }
      signal.addEventListener(
        "abort",
        () => {
          clearTimeout(timer);
          const abortErr = new Error("Generation cancelled by user.");
          abortErr.name = "AbortError";
          reject(abortErr);
        },
        { once: true }
      );
    }
  });
}

/**
 * Combine the caller's AbortSignal (user pressed Stop) with a hard deadline
 * into one signal handed to fetch. Either source aborts the request.
 */
function withRequestDeadline(external: AbortSignal | undefined, timeoutMs: number) {
  const controller = new AbortController();
  let timedOut = false;
  const onExternalAbort = () => controller.abort();
  if (external) {
    if (external.aborted) controller.abort();
    else external.addEventListener("abort", onExternalAbort, { once: true });
  }
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  return {
    signal: controller.signal,
    didTimeOut: () => timedOut,
    cleanup: () => {
      clearTimeout(timer);
      external?.removeEventListener("abort", onExternalAbort);
    },
  };
}

interface ConsumedChatResponse {
  text: string;
  reasoning: string;
  citations: any[];
  generatedImage?: any;
  /** A provider failed after partial content; the partial text is kept. */
  partial: boolean;
  streamError?: string;
}

/**
 * Read one /api/chat response, whether it arrived as SSE or plain JSON.
 * Incremental chunks are forwarded through onStreamDelta. Never retried at
 * this layer once content has arrived -- the caller keeps the partial text.
 */
async function consumeChatResponse(
  response: Response,
  onStreamDelta?: (delta: { text?: string; reasoning?: string }) => void
): Promise<ConsumedChatResponse> {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("text/event-stream") || !response.body) {
    const data = await response.json();
    if (data && typeof data.text === "string" && data.text.trim().length > 0) {
      onStreamDelta?.({ text: data.text });
      return { text: data.text, reasoning: data.reasoning || "", citations: data.citations || [], generatedImage: data.generatedImage, partial: false };
    }
    throw new Error("Received empty text response from server.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let text = "";
  let reasoning = "";
  let citations: any[] = [];
  let generatedImage: any;
  let sawDone = false;
  let streamError: string | undefined;

  const handleEvent = (event: any) => {
    if (!event || typeof event !== "object") return;
    switch (event.type) {
      case "delta":
        if (typeof event.text === "string" && event.text) {
          text += event.text;
          onStreamDelta?.({ text: event.text });
        }
        break;
      case "reasoning":
        if (typeof event.text === "string" && event.text) {
          reasoning += event.text;
          onStreamDelta?.({ reasoning: event.text });
        }
        break;
      case "done":
        sawDone = true;
        if (typeof event.text === "string" && event.text) text = event.text;
        if (Array.isArray(event.citations)) citations = event.citations;
        if (event.generatedImage) generatedImage = event.generatedImage;
        break;
      case "error":
        streamError = String(event.error || "Stream failed.");
        break;
      // "start" and "notice" carry no user-visible content.
      default:
        break;
    }
  };

  try {
    while (true) {
      // Race each read against an idle deadline so a silently stalled stream
      // cannot hang the chat forever.
      const idle = withRequestDeadline(undefined, CHAT_STREAM_IDLE_TIMEOUT_MS);
      let readResult: ReadableStreamReadResult<Uint8Array>;
      try {
        readResult = await Promise.race([
          reader.read(),
          new Promise<never>((_, reject) => {
            idle.signal.addEventListener("abort", () => reject(new Error("Stream stalled: no data received in time.")), { once: true });
          }),
        ]);
      } finally {
        idle.cleanup();
      }

      if (readResult.done) break;
      buffer += decoder.decode(readResult.value, { stream: true });

      let newlineAt: number;
      while ((newlineAt = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineAt).trim();
        buffer = buffer.slice(newlineAt + 1);
        if (!line.startsWith("data:")) continue;
        const payload = line.slice(5).trim();
        if (payload === "[DONE]") {
          sawDone = true;
          continue;
        }
        try {
          handleEvent(JSON.parse(payload));
        } catch {
          // Malformed line: skip, never kill the stream.
        }
      }
    }
  } catch (streamErr: any) {
    // Partial content already streamed: keep it instead of failing the whole
    // message -- retrying would duplicate the visible answer.
    if (text) {
      return { text, reasoning, citations, generatedImage, partial: true, streamError: streamErr?.message };
    }
    throw streamErr;
  } finally {
    try {
      reader.cancel();
    } catch {
      // Already closed.
    }
  }

  if (streamError && !text) {
    throw new Error(streamError);
  }
  if (!text.trim()) {
    throw new Error(sawDone ? "Received empty text response from server." : "Stream ended unexpectedly.");
  }

  return { text, reasoning, citations, generatedImage, partial: Boolean(streamError), streamError };
}

class SelfHealingSystemManager {
  private log: ErrorLogEntry[] = [];
  private listeners: Set<SelfHealingListener> = new Set();
  private activeRetryKeys: Map<string, number> = new Map();

  constructor() {
    this.loadPersistedLogs();
  }

  private loadPersistedLogs() {
    try {
      const stored = sessionStorage.getItem("best_friend_self_healing_logs");
      if (stored) {
        this.log = JSON.parse(stored).slice(0, 50);
      }
    } catch {}
  }

  private persistLogs() {
    try {
      sessionStorage.setItem("best_friend_self_healing_logs", JSON.stringify(this.log.slice(0, 50)));
    } catch {}
  }

  public subscribe(listener: SelfHealingListener): () => void {
    this.listeners.add(listener);
    listener([...this.log]);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.persistLogs();
    const copy = [...this.log];
    this.listeners.forEach((fn) => fn(copy));
  }

  public recordLog(entry: Omit<ErrorLogEntry, "id" | "timestamp">): ErrorLogEntry {
    const fullEntry: ErrorLogEntry = {
      id: "err-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      ...entry,
    };

    // Prepend new entry, keep max 50
    this.log = [fullEntry, ...this.log].slice(0, 50);
    this.notify();
    return fullEntry;
  }

  public getLogs(): ErrorLogEntry[] {
    return [...this.log];
  }

  public clearLogs() {
    this.log = [];
    this.notify();
  }

  // Prevent infinite retry loops per key
  public getRetryCount(key: string): number {
    return this.activeRetryKeys.get(key) || 0;
  }

  public incrementRetryCount(key: string): number {
    const current = (this.activeRetryKeys.get(key) || 0) + 1;
    this.activeRetryKeys.set(key, current);
    return current;
  }

  public resetRetryCount(key: string) {
    this.activeRetryKeys.delete(key);
  }

  /**
   * Trigger Automated Code Repair on the server
   */
  public async triggerCodeAutoRepair(errReq: {
    errorMessage: string;
    stackTrace?: string;
    component?: string;
    category?: ErrorCategory;
    failingOperation?: any;
  }): Promise<{
    success: boolean;
    verified: boolean;
    attemptsCount: number;
    targetFile?: string;
    rootCause?: string;
    patchDescription?: string;
  }> {
    return { success: false, verified: false, attemptsCount: 0, rootCause: "Automatic source-code repair is not included in this MVP." };
  }

  /**
   * Self-Healing wrapper for Chat API calls.
   *
   * Requests streaming ({stream:true}); the server may still answer with plain
   * JSON (fallback providers, early errors) and both shapes are handled.
   *
   * Retry policy: only transient failures (network, 429/5xx, timeout, stalled
   * stream) are retried, per model, with exponential backoff + jitter, capped
   * at CHAT_MAX_ATTEMPTS_PER_MODEL. Once any content chunk has arrived the
   * answer is never re-requested -- the partial text is kept -- so a mid-stream
   * failure can never duplicate the assistant message.
   */
  public async selfHealChatCall(
    messagesPayload: any[],
    selectedModel: string,
    responseMode: string,
    userName: string,
    attachment: any,
    onModelFallback?: (newModel: string) => void,
    signal?: AbortSignal,
    onStreamDelta?: (delta: { text?: string; reasoning?: string }) => void
  ): Promise<{ text: string; citations?: any[]; generatedImage?: any; recoveredByModel?: string; reasoning?: string; partial?: boolean }> {
    const key = `chat-${selectedModel}`;
    this.incrementRetryCount(key);

    // When a user explicitly selects a Gemini or NVIDIA Nemotron model,
    // do NOT silently switch to an unrelated third-party provider.
    const isGeminiSelected = selectedModel.includes("gemini");
    const isNemotronSelected = selectedModel.includes("nemotron") || selectedModel.startsWith("nvidia/");
    const fallbackModels = [selectedModel];

    let lastErrorMsg = "";

    for (let i = 0; i < fallbackModels.length; i++) {
      if (signal?.aborted) {
        const abortErr = new Error("Generation cancelled by user.");
        abortErr.name = "AbortError";
        throw abortErr;
      }

      const currentModelToTry = fallbackModels[i];
      let modelSucceeded = false;

      for (let attempt = 1; attempt <= CHAT_MAX_ATTEMPTS_PER_MODEL && !modelSucceeded; attempt++) {
        if (signal?.aborted) {
          const abortErr = new Error("Generation cancelled by user.");
          abortErr.name = "AbortError";
          throw abortErr;
        }

        const deadline = withRequestDeadline(signal, CHAT_HTTP_TIMEOUT_MS);
        try {
          const response = await fetch("/api/chat", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...getCustomApiHeaders(),
            },
            body: JSON.stringify({
              messages: messagesPayload,
              memory: memoryForChat(),
              model: currentModelToTry,
              responseMode,
              userName,
              attachment,
              stream: true,
            }),
            signal: deadline.signal,
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            const failure: any = new Error(errData.error || `HTTP ${response.status} Error`);
            failure.status = response.status;
            throw failure;
          }

          const consumed = await consumeChatResponse(response, onStreamDelta);

          this.resetRetryCount(key);

          if (currentModelToTry !== selectedModel) {
            this.recordLog({
              category: "chat_api",
              context: `Chat model "${selectedModel}" failed`,
              message: `Switched automatically to "${currentModelToTry}"`,
              rootCause: lastErrorMsg || "Model request timeout or quota limit",
              recoveryAction: `Fallback model "${currentModelToTry}" succeeded and restored chat flow`,
              status: "fallback_applied",
              retryCount: attempt,
            });

            if (onModelFallback) onModelFallback(currentModelToTry);
          }

          if (consumed.partial) {
            this.recordLog({
              category: "chat_api",
              context: `Chat stream with model ${currentModelToTry}`,
              message: consumed.streamError || "Stream disconnected mid-answer",
              rootCause: "Upstream connection dropped after partial content",
              recoveryAction: "Kept the partially received answer instead of retrying (avoids duplicate messages)",
              status: "auto_recovered",
              retryCount: attempt,
            });
          }

          modelSucceeded = true;
          return {
            text: consumed.text,
            citations: consumed.citations,
            generatedImage: consumed.generatedImage,
            recoveredByModel: currentModelToTry !== selectedModel ? currentModelToTry : undefined,
            reasoning: consumed.reasoning || undefined,
            partial: consumed.partial || undefined,
          };
        } catch (err: any) {
          if (err?.name === "AbortError" || signal?.aborted) {
            const abortErr = new Error("Generation cancelled by user.");
            abortErr.name = "AbortError";
            throw abortErr;
          }

          const failure = deadline.didTimeOut()
            ? { transient: true, message: "Karishma took too long to answer (timeout). Please try again." }
            : classifyChatFailure(err);
          lastErrorMsg = failure.message;

          const canRetryThisModel = failure.transient && attempt < CHAT_MAX_ATTEMPTS_PER_MODEL;
          const willTryNextModel = !modelSucceeded && i < fallbackModels.length - 1;

          this.recordLog({
            category: "chat_api",
            context: `Chat request with model ${currentModelToTry}`,
            message: lastErrorMsg,
            rootCause: failure.transient
              ? "Transient network error, rate limit, or timeout"
              : "Request rejected by the server (not retryable)",
            recoveryAction: canRetryThisModel
              ? `Retrying ${currentModelToTry} (attempt ${attempt + 1}/${CHAT_MAX_ATTEMPTS_PER_MODEL}) after backoff`
              : willTryNextModel
                ? `Trying fallback model ${fallbackModels[i + 1]}`
                : "All chat fallbacks exhausted",
            status: canRetryThisModel || willTryNextModel ? "retrying" : "unrecoverable",
            retryCount: attempt,
          });

          if (!canRetryThisModel) break;

          const backoffMs = Math.min(500 * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 250), 8000);
          await backoffSleep(backoffMs, signal);
        } finally {
          deadline.cleanup();
        }
      }
    }

    // If the backend itself is unreachable (network error), there is no point
    // calling /api/self-repair/diagnose-and-fix -- it lives on the same down
    // backend. Skip straight to a clear, actionable error so the user knows to
    // start the server (`npm run dev`) instead of waiting on a doomed
    // If the backend itself is unreachable (network error), there is no point
    // calling /api/self-repair/diagnose-and-fix -- it lives on the same down
    // backend. Skip straight to a clear, actionable error so the user knows to
    // start the server (`npm run dev`) instead of waiting on a doomed
    // self-repair round-trip that will fail with the same network error.
    const isBackendUnreachable = /network error|failed to fetch|connection (refused|failed|reset)/i.test(lastErrorMsg);
    if (isBackendUnreachable) {
      this.recordLog({
        category: "chat_api",
        context: `Chat endpoint (${selectedModel})`,
        message: lastErrorMsg,
        rootCause: "Backend server is not running or not reachable on the expected port",
        recoveryAction: "Build with `npm run build`, then start the backend with `npm start` and confirm http://localhost:3000/api/health responds before sending another message.",
        status: "unrecoverable",
        retryCount: this.getRetryCount(key),
      });
      this.resetRetryCount(key);
      throw new Error(
        `Self-healing chat recovery failed: ${lastErrorMsg}. ` +
        "The Karishma backend is not reachable — start it with `npm run dev` and " +
        "confirm http://localhost:3000/api/health responds before sending another message."
      );
    }

    // Trigger automated code repair engine on the server if all model attempts fail
    const repairResult = await this.triggerCodeAutoRepair({
      errorMessage: lastErrorMsg || "Chat API connection failure",
      stackTrace: `Chat API failed across all fallback models: ${fallbackModels.join(", ")}`,
      component: "ChatEndpoint",
      category: "chat_api",
      failingOperation: { type: "chat_api", payload: { selectedModel } },
    });

    if (repairResult.verified) {
      this.recordLog({
        category: "chat_api",
        context: `Chat endpoint (${selectedModel})`,
        message: lastErrorMsg,
        rootCause: repairResult.rootCause || "API handler exception or rate limit",
        recoveryAction: `Applied verified code patch in ${repairResult.targetFile || "server.ts"}: ${repairResult.patchDescription}`,
        status: "auto_recovered",
        retryCount: repairResult.attemptsCount,
        patchedFile: repairResult.targetFile,
        patchDescription: repairResult.patchDescription,
        verified: true,
      });
    }

    this.resetRetryCount(key);
    throw new Error(`Self-healing chat recovery failed: ${lastErrorMsg || "Service temporarily unavailable. Please try again."}`);
  }

  /**
   * Self-Healing wrapper for Image Generation
   */
  public async selfHealImageCall(prompt: string): Promise<{ url: string; prompt: string }> {
    throw new Error("Image generation is not included in this text-only MVP.");
  }

  /**
   * Self-Healing wrapper for File Upload processing
   */
  public selfHealFile(
    file: File,
    rawResult: string
  ): { name: string; type: string; dataUrl: string; size: number; isImage: boolean } {
    try {
      const isImage = file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif|svg|bmp|heic|heif)$/i.test(file.name);

      // Validate data URL structure
      let dataUrl = rawResult;
      if (!dataUrl.startsWith("data:")) {
        const mime = file.type || (isImage ? "image/jpeg" : "application/octet-stream");
        dataUrl = `data:${mime};base64,${rawResult}`;

        this.recordLog({
          category: "file_upload",
          context: `File upload: ${file.name}`,
          message: "Data URL missing mime header prefix",
          rootCause: "Raw base64 string provided without data URI scheme",
          recoveryAction: "Auto-repaired Data URI header prefix",
          status: "auto_recovered",
          retryCount: 1,
        });
      }

      return {
        name: file.name,
        type: file.type || (isImage ? "image/jpeg" : "application/octet-stream"),
        dataUrl,
        size: file.size,
        isImage,
      };
    } catch (err: any) {
      this.recordLog({
        category: "file_upload",
        context: `File sanitization: ${file.name}`,
        message: err?.message || String(err),
        rootCause: "File reading or base64 structure error",
        recoveryAction: "Fallback to sanitized basic file metadata",
        status: "fallback_applied",
        retryCount: 1,
      });

      return {
        name: file.name,
        type: "application/octet-stream",
        dataUrl: rawResult || "",
        size: file.size,
        isImage: false,
      };
    }
  }

  /**
   * Self-Healing wrapper for Cloud Firestore Conversation Syncing
   */
  public async selfHealSaveToCloud(
    user: any,
    session: SyncChatSession
  ): Promise<boolean> {
    try {
      await ensureFirebaseAuth();
      const ok = await saveConversationToCloud(user, session);
      if (ok) return true;

      this.recordLog({
        category: "cloud_sync",
        context: `Sync conversation ${session.id}`,
        message: "Firestore save offline or pending",
        rootCause: "Temporary network disconnection or pending sync",
        recoveryAction: "Queued operation in offline queue for auto-sync when online",
        status: "auto_recovered",
        retryCount: 1,
      });

      return false;
    } catch (err: any) {
      const errorMsg = err?.message || String(err);

      this.recordLog({
        category: "cloud_sync",
        context: `Sync conversation ${session.id}`,
        message: errorMsg,
        rootCause: "Permission issue or cloud connection failure",
        recoveryAction: "Queued session in persistent offline queue",
        status: "auto_recovered",
        retryCount: 1,
      });

      return false;
    }
  }

  /**
   * Self-Healing wrapper for Cloud Conversation Deletion
   */
  public async selfHealDeleteFromCloud(user: any, conversationId: string): Promise<boolean> {
    try {
      await ensureFirebaseAuth();
      const ok = await deleteConversationFromCloud(user, conversationId);
      if (ok) return true;

      this.recordLog({
        category: "cloud_sync",
        context: `Delete conversation ${conversationId}`,
        message: "Deletion offline or pending",
        rootCause: "Network or Firestore connection issue during deletion",
        recoveryAction: "Handled deletion locally and scheduled background cloud sync queue",
        status: "auto_recovered",
        retryCount: 1,
      });

      return false;
    } catch (err: any) {
      this.recordLog({
        category: "cloud_sync",
        context: `Delete conversation ${conversationId}`,
        message: err?.message || String(err),
        rootCause: "Network or Firestore connection issue during deletion",
        recoveryAction: "Queued delete operation in persistent sync queue",
        status: "auto_recovered",
        retryCount: 1,
      });

      return false;
    }
  }

  /**
   * Run full system diagnostics
   */
  public async runSystemHealthCheck(): Promise<{
    chatOk: boolean;
    imageOk: boolean;
    authOk: boolean;
    storageOk: boolean;
    overallStatus: "healthy" | "degraded" | "error";
    details: Record<string, string>;
  }> {
    const details: Record<string, string> = {};
    let chatOk = false;
    let imageOk = false;
    let authOk = false;
    let storageOk = false;

    // 1. Check Storage
    try {
      localStorage.setItem("best_friend_health_test", "ok");
      const read = localStorage.getItem("best_friend_health_test");
      localStorage.removeItem("best_friend_health_test");
      storageOk = read === "ok";
      details.storage = storageOk ? "Local & Session Storage working normally" : "Storage read mismatch";
    } catch (e: any) {
      details.storage = `Storage error: ${e.message}`;
    }

    // 2. Check Auth
    try {
      const user = await ensureFirebaseAuth();
      authOk = !!user;
      authOk = false; details.auth = "Guest-only MVP. No cloud account authentication is connected.";
    } catch (e: any) {
      details.auth = `Auth error: ${e.message}`;
    }

    // 3. Check Chat API. Uses the cheap /api/health endpoint instead of a real
    // chat completion: connectivity is what matters here, and a real prompt
    // would spend provider credits on every diagnostics run.
    try {
      const res = await fetch("/api/health", { method: "GET" });

      if (res.ok) {
        const data = await res.json();
        chatOk = data?.status === "ok";
        details.chat = chatOk
          ? `Backend reachable (${data?.env || "unknown env"})`
          : "Backend responded but reported an error status";
      } else {
        details.chat = `Chat API HTTP status ${res.status}`;
      }
    } catch (e: any) {
      details.chat = `Chat API error: ${e.message}`;
    }

    // 4. Check Image API
    try {
      imageOk = false; // Not included in this MVP.
      details.image = "Image generation is not included in this MVP.";
    } catch (e: any) {
      details.image = `Image API error: ${e.message}`;
    }

    const overallStatus = chatOk && authOk && storageOk ? "healthy" : (chatOk || storageOk ? "degraded" : "error");

    return {
      chatOk,
      imageOk,
      authOk,
      storageOk,
      overallStatus,
      details,
    };
  }
}

export const selfHealingSystem = new SelfHealingSystemManager();
