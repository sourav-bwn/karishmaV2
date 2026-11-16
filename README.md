# karishmaV2

A small hackathon MVP built from the supplied Karishma frontend. The original React screens, styles, mascot and artwork are retained. The original project, databases and Git history are not included or changed.

## Working scope

- Original responsive interface, guest entry, pink/blue and light/dark themes.
- Text chat through one server-configured OpenAI-compatible model, with streamed replies and cancellation.
- Browser-local conversation history, reload, conversation removal and JSON export.
- Memory category cards now open a real editor: add, edit or remove up to 30 notes, 500 characters each. With memory on, those notes are included in model requests. With it off, they are not.
- Browser data export and a confirmed clear-memory action.
- Local Ollama and configurable compatible API modes. Provider secrets stay on the server.

## Honest MVP limits

An unconfigured deployment shows a configuration error, never a pretend AI answer. The approved hosted demo uses Groq Free with `openai/gpt-oss-20b` in explicit public mode, described below. Real Groq text chat and saved-memory context have been tested in addition to the mocked transport tests. Gemini backup is not connected.

The other original screens remain to preserve the requested exact UI. Agents, Studio, Files, Projects and Explore contain sample/preview content, not connected services. The model picker is a visual preview; change the actual model in the server environment. Some deterministic local tools are retained, but they are not a general AI tool suite. File/image AI, cloud accounts, social login, cross-device sync, MFA, encryption and automatic source-code repair are **not implemented**. Unsupported actions show that limit instead of simulating success.

History and memory use this browser's local storage. They are not encrypted. Clearing site data, using another browser/device or changing the site's origin loses access to that browser's data. Notes and the recent chat context are sent to the configured model while chatting. The model's behavior and privacy depend on that provider. Do not store secrets in chat or memory. Fonts load from Google Fonts, as in the supplied UI.

## Run locally with Ollama

Prerequisites: Node.js 22, npm, and Ollama installed on the same computer that will run this backend. A phone opening a remote demo cannot reach its owner's laptop through the server's localhost.

```sh
npm ci --ignore-scripts
cp .env.example .env
ollama pull llama3.2
npm run build
npm start
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`. Start Ollama using its normal application/service first. Open `http://127.0.0.1:3000`, choose **Continue as Guest**, add a note in **Memory > Preferences**, then send a text chat. A model download needs disk space and enough RAM; no download or real-model run is part of the included test proof.

Default `.env` settings:

```dotenv
AI_MODE=ollama
AI_BASE_URL=http://127.0.0.1:11434/v1
AI_MODEL=llama3.2
HOST=127.0.0.1
PORT=3000
```

For frontend development, run `npm start` in one terminal and `npm run dev` in another. The Vite dev server proxies `/api` to port 3000. Run a production build again to update the site served by `npm start`.

## Use a compatible API instead

Set `AI_MODE=openai`, the provider's exact `AI_BASE_URL` ending in `/v1`, its exact `AI_MODEL` identifier and `AI_API_KEY` in the **server** `.env`. Do not put keys in frontend files, browser storage, a commit, or chat. Compatible is a protocol, not a promise that any particular provider is free or that every provider feature works. No paid provider has been chosen or activated.

For a private hosted deployment, set a long random `APP_ACCESS_TOKEN` before exposing a configured model endpoint to other people. The separate approved public Groq demo mode below deliberately does not use this token. In the site's **Settings > MVP Connection**, enter only that app token, not the provider key. The app token stays in the current tab's session storage. A non-loopback local server refuses to start without the token. Use HTTPS for any remote deployment. This is a personal demonstration gate, not a multi-user authentication system. The in-memory rate limit is per process, not a distributed quota or billing cap.

## Vercel deployment

`vercel.json` builds the Vite frontend and routes API calls through `api/index.mjs`. The hosted adapter defaults to disconnected API mode, so it does not try the server's localhost as if it were a visitor's laptop. Deploy this as a **new project**, not over the original site.

For a private hosted model, add `AI_MODE`, `AI_BASE_URL`, `AI_MODEL`, `AI_API_KEY` and `APP_ACCESS_TOKEN` in that new project's server environment and redeploy. For the approved open Groq demo, use the public-mode settings below instead. Do not add `VITE_` before secret variable names. Model requests have a 55-second hosted deadline. No backend database is required. Hosting limits, provider availability and costs must be checked before activation; this repo does not authorize spending or contest submission.

## Check the build

```sh
npm run check
npm test
npm run build
npm run test:browser
```

The browser check requires an installed Chrome/Chromium executable. Default on Linux is `/usr/bin/google-chrome`; set `CHROME_PATH` to your executable on another machine. It launches a temporary loopback server with a mocked AI transport. It does not call a real model or use provider credentials. Screenshots go to `/tmp` by default; set `ARTIFACT_DIR` to an existing folder on Windows. Visual comparison uses the supplied current UI, not the archive's older cream README screenshots. The build may warn about the large original frontend chunk; this is a performance warning, not a build failure.

## Source and attribution

The supplied original project credits **Soumyajit Ghosh**. That credit and the supplied `LICENSE` are retained. This is a reduced derivative MVP, not a claim of original authorship of the supplied UI or assets. See `NOTICE.md` for the archive's license inconsistency and the exact retained/omitted scope.

Setup references:
- https://docs.ollama.com/quickstart
- https://docs.ollama.com/api/openai-compatibility
- https://vercel.com/docs/functions/runtimes/node-js
- https://vercel.com/docs/project-configuration#rewrites

## Approved public Groq demo mode

`PUBLIC_DEMO=true` explicitly permits visitors to chat without an app token, only when `AI_BASE_URL=https://api.groq.com/openai/v1`. Set `AI_MODE=openai`, `AI_MODEL=openai/gpt-oss-20b`, and a dedicated `AI_API_KEY` as a server secret. Do not set `APP_ACCESS_TOKEN` for this open demo. There is no client-side shared secret. Gemini fallback is not connected or automatically enabled.

The UI shows a Groq privacy/limits notice. Chat, recent context, and enabled memory notes go to Groq; local history and notes remain unencrypted in the visitor's browser. Do not enter personal, sensitive or confidential data. Groq's Free plan is limited, not unlimited. Current account limits verified November 16, 2026: 30 requests/minute, 1,000/day, 8,000 tokens/minute and 200,000/day, shared with the account's other projects. Limits can change.

Public mode caps each new message at 2,000 characters, combined messages+memory at 10,000 characters, output at 600 tokens, and per-process traffic at 5 requests/IP/minute, 15 requests/minute, 150 requests/24h and 2 concurrent requests. These in-memory limits reset on a cold start and are NOT a distributed quota, authentication system, or spending cap. The verified provider Free plan is the billing backstop: never upgrade or add a payment method without separate approval. Provider 429 returns an honest wait message, never a paid fallback. Public traffic can exhaust quota and make the demo unavailable.

Groq terms allow end-user applications subject to its agreement, acceptable-use policy and model terms. Account holder must be 18+. This prototype is not medical or professional advice and does not offer safety-critical guarantees. Sources: https://console.groq.com/docs/legal/services-agreement , https://console.groq.com/docs/your-data , https://console.groq.com/docs/rate-limits .
