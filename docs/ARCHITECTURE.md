# Architecture

This document describes how Stealth Chat's desktop shell, frontend, and local sidecar work together. It is intended for contributors changing the request flow, model configuration, or packaging behavior.

## Components

### Desktop shell

`src-tauri/` contains the Tauri v2 application. The Rust setup code:

1. registers the shell plugin;
2. launches the packaged `server` sidecar;
3. forwards sidecar output to the Tauri log; and
4. applies macOS sidebar vibrancy to the main window.

Tauri expects the sidecar at `src-tauri/binaries/server-<target-triple>` when compiling. The file is packaged into the application and launched when the desktop process starts.

### Frontend

`client/` is a React 19 and TypeScript application built with Vite. `App.tsx` currently owns the interface state, including:

- the selected conversation;
- search and sidebar state;
- in-memory message histories;
- the active streaming response; and
- the API-key settings dialog.

Only contacts with `canPrompt` and a `model` value submit chat requests. The remaining contacts are read-only fixtures used to exercise the Messages-style interface.

### Local API

`server/main.py` exposes one FastAPI route:

```http
POST /chat
Content-Type: application/json
X-Gemini-API-Key: <key>
```

The JSON body has this shape:

```json
{
  "message": "Explain this function",
  "model": "gemini-3.5-flash",
  "history": [
    { "role": "user", "content": "Earlier question" },
    { "role": "assistant", "content": "Earlier answer" }
  ]
}
```

The response is a streamed `text/plain` body. It is not a Server-Sent Events stream and does not use SSE framing. The frontend reads chunks from `response.body`, decodes them, and updates the pending message until the stream closes.

The sidecar accepts requests from the Vite development origins and Tauri's production origins. It listens on `127.0.0.1:8000`, not on a public network interface.

## Request lifecycle

1. The user submits text in a prompt-enabled Gemini conversation.
2. The frontend appends the user message to its local history.
3. It posts the prompt, prior history, selected model ID, and API-key header to the sidecar.
4. The sidecar maps the UI model ID to a Gemini API model name.
5. The Google Gen AI SDK streams generated text to FastAPI.
6. FastAPI forwards each text chunk to the frontend.
7. The frontend renders the accumulated response and saves the completed message in React state.

If the selected model returns a quota error, the server attempts a fallback to `gemini-3.5-flash`. Other provider errors are converted to readable text in the conversation.

## Model mapping

The model map lives in `server/main.py`. The frontend identifiers and provider identifiers are deliberately separate so the UI does not need to change when a provider model name changes.

| Frontend ID | Gemini API model |
| --- | --- |
| `gemini-3.5-flash` | `gemini-3.5-flash` |
| `gemini-3.1-pro` | `gemini-3.1-pro` |
| `gemini-3.1-flash-lite` | `gemini-3.5-flash-lite` |

Keep `CONTACTS` in `client/src/App.tsx` and `MODEL_MAP` in `server/main.py` aligned when adding or removing a model.

## State and security boundaries

Chat histories exist only in frontend memory. There is no database, account system, analytics service, or server-side session store.

The API key is stored in the frontend WebView's `localStorage` and attached to each local API request. It is not read from an environment file, persisted by FastAPI, or intentionally logged. The sidecar then sends the key to Google's API as part of normal SDK authentication.

This design prevents a project-owned remote server from holding user keys, but it does not provide hardware-backed or Keychain-backed storage. A production security pass should replace `localStorage`, define a restrictive content security policy, validate request sizes and roles, and avoid returning raw provider exception text to the UI.

## Packaging

There are three build stages:

1. Vite and TypeScript compile the frontend into `client/dist`.
2. PyInstaller freezes FastAPI, Uvicorn, the Google SDK, and Python into one architecture-specific executable.
3. Tauri compiles the Rust shell and bundles both the frontend assets and sidecar.

Generated frontend assets, Python builds, sidecar binaries, and Tauri targets are ignored by Git. See the [development guide](DEVELOPMENT.md) for the commands used at each stage.
