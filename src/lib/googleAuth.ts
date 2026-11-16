// Web Google sign-in through Google Identity Services (token popup flow).
// The account chooser and consent run entirely on accounts.google.com; only
// the resulting short-lived token reaches this app, and the server verifies
// it with Google before creating a session. Chat history and memory stay in
// this browser; there is no cloud sync.
declare global {
  interface Window {
    google?: any;
  }
}

let cachedClientId: string | null = null;
export const googleClientId = "";

export const getGoogleClientId = async (): Promise<string> => {
  if (cachedClientId !== null) return cachedClientId;
  try {
    const res = await fetch("/api/auth/config");
    const data = res.ok ? await res.json() : null;
    cachedClientId =
      data?.googleEnabled && typeof data.googleClientId === "string"
        ? data.googleClientId
        : "";
  } catch {
    cachedClientId = "";
  }
  return cachedClientId;
};

export const isNativePlatform = () => false;
// The button stays visible; the real configuration check happens when the
// user chooses Google, so a slow config request never hides the option.
export const isGoogleAuthAvailable = () => true;

export interface GoogleAuthPayload {
  idToken: string;
  accessToken?: string;
}

let gisPromise: Promise<void> | null = null;
function loadGis(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (!gisPromise) {
    gisPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        gisPromise = null;
        reject(
          new Error(
            "Could not load Google sign-in. Check your connection and try again."
          )
        );
      };
      document.head.appendChild(script);
    });
  }
  return gisPromise;
}

export async function prepareGoogleSignIn() { await Promise.all([getGoogleClientId(), loadGis()]); }

export async function signInWithGoogle(
  onSuccess: (data: { credential?: string; accessToken?: string }) => void,
  onError?: (message: string) => void
): Promise<void> {
  const fail = (message: string) => {
    if (onError) onError(message);
  };
  try {
    const clientId = await getGoogleClientId();
    if (!clientId) {
      fail("Google sign-in is not configured yet. Use Continue as Guest.");
      return;
    }
    await loadGis();
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "openid email profile",
      callback: (response: any) => {
        if (response?.error) {
          fail("Google sign-in was cancelled or failed. Please try again.");
          return;
        }
        if (response?.access_token) {
          onSuccess({ accessToken: response.access_token });
          return;
        }
        fail("Google did not return a sign-in token. Please try again.");
      },
      error_callback: (err: any) => {
        fail(
          err?.type === "popup_closed"
            ? "The Google sign-in window was closed before finishing."
            : "Google sign-in could not open. Allow pop-ups for this site and try again."
        );
      },
    });
    client.requestAccessToken({ prompt: "" });
  } catch (err: any) {
    fail(err?.message || "Google sign-in failed. Please try again.");
  }
}

export async function renderGoogleButton(..._args: any[]): Promise<any> {
  return false;
}
export async function nativeGoogleIdToken(): Promise<string> {
  throw new Error("Native Google sign-in is only available in the Android app.");
}
export async function promptGoogleSignIn(...args: any[]): Promise<any> {
  return signInWithGoogle(...(args as [any, any]));
}
export async function nativeGoogleSignOut(): Promise<void> {}
