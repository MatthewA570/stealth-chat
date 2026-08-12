# Stealth Chat frontend

This directory contains the React and TypeScript interface for Stealth Chat. It runs in Vite during development and is compiled into static assets for the Tauri desktop shell.

For complete setup and packaging instructions, start with the [project README](../README.md). Architecture and request-flow details are documented in [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md).

## Commands

Run these from the repository root:

```bash
npm ci --prefix client
npm run dev --prefix client
npm run build --prefix client
npm run lint --prefix client
```

`dev` starts the frontend at `http://localhost:5173`. It does not start the FastAPI sidecar, so chat requests will fail unless the local service is also running on port 8000. Use `npm run dev` at the repository root for the complete desktop application.

## Source map

- `src/App.tsx` contains the current application state, conversation fixtures, settings dialog, and streaming request logic.
- `src/index.css` defines the Messages-inspired layout, theme, and component styling.
- `public/sf-symbols/` contains rasterized interface symbols.
- `public/contact-photos/` contains sample contact images and their attribution notes.

The frontend has no router or external state store. Chat history is held in React state for the current session, while the Gemini API key is stored in the WebView's `localStorage` under `stealth_gemini_api_key`.
