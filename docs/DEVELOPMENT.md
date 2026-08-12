# Development guide

This guide covers local setup, validation, packaging, and common failures for Stealth Chat contributors. The commands assume macOS and a shell opened at the repository root unless noted otherwise.

## Toolchain

Install the following before working on the full desktop app:

- Xcode Command Line Tools
- Rust 1.77.2 or later with Cargo
- Node.js 20.19 or later with npm
- Python 3.10 or later with `venv`

Confirm the tools are available:

```bash
xcode-select -p
rustc --version
node --version
npm --version
python3 --version
```

## Install dependencies

The repository has separate root and frontend lockfiles. Install both with `npm ci` to reproduce the locked dependency graph:

```bash
npm ci
npm ci --prefix client
```

Create a local Python environment for the sidecar:

```bash
cd server
python3 -m venv venv
source venv/bin/activate
python -m pip install fastapi uvicorn google-genai pydantic pyinstaller
cd ..
```

The Python dependencies are not pinned in this repository yet. If you change backend dependencies, verify both direct Python execution and the frozen sidecar before opening a pull request.

## Build the sidecar

Tauri requires the executable name to end with the Rust host target triple:

```bash
cd server
source venv/bin/activate
pyinstaller --clean --onefile --name server main.py
cd ..

mkdir -p src-tauri/binaries
cp server/dist/server "src-tauri/binaries/server-$(rustc -vV | sed -n 's|host: ||p')"
```

PyInstaller builds for the active operating system and architecture. Build an Apple silicon sidecar with an arm64 Python and an Intel sidecar with an x86-64 Python; do not rename one architecture's executable and assume it is portable.

Rebuild the sidecar whenever `server/main.py` or its Python dependencies change.

## Run locally

Start the complete desktop development environment:

```bash
npm run dev
```

Tauri runs Vite through `beforeDevCommand`, starts the packaged sidecar, and opens the native window.

To work on the interface in a browser:

```bash
npm run dev --prefix client
```

Browser mode is useful for layout work, but the sidecar must still be available for live chat. You can start the unfrozen API in another terminal:

```bash
cd server
source venv/bin/activate
python main.py
```

## Validate changes

Run the checks that match the area you changed:

```bash
npm run lint --prefix client
npm run build --prefix client
cargo check --manifest-path src-tauri/Cargo.toml
python -m py_compile server/main.py
```

There is no automated test suite yet. For user-facing changes, also perform a short manual check:

1. launch the Tauri app;
2. search for and switch between conversations;
3. hide and restore the sidebar;
4. save a valid API key and send a prompt in each model conversation;
5. confirm text appears incrementally and the completed response remains in history; and
6. restart the app and confirm that only the API key persists, not message history.

## Build a release bundle

With the correct sidecar in `src-tauri/binaries`, run:

```bash
npm run build
```

Artifacts are written below `src-tauri/target/release/bundle/`. A local build is not automatically ready for public distribution: signing, notarization, update delivery, and release automation are outside the current repository configuration.

## Common issues

### Tauri cannot find `binaries/server-*`

The sidecar is missing or its suffix does not match the Rust host triple. Compare these values:

```bash
rustc -vV
ls -l src-tauri/binaries
```

Rebuild and copy the executable using the command in [Build the sidecar](#build-the-sidecar).

### Chat returns a connection error

Confirm the sidecar is running and port 8000 is free:

```bash
lsof -nP -iTCP:8000 -sTCP:LISTEN
```

In browser-only frontend development, start `python main.py` manually. In Tauri development, inspect the terminal for sidecar spawn or import errors.

### The API key is rejected

Create or inspect the key in [Google AI Studio](https://aistudio.google.com/), confirm it is allowed to call the Gemini API, and check the project's quota. Keys should be treated like passwords and restricted to the APIs they need.

### A model returns a quota notice

Quotas and model availability are controlled by Google and can differ by project. The backend attempts to fall back to Gemini 3.5 Flash for quota-related failures. If both calls fail, review the key's project and quota in Google AI Studio.

### Port 5173 is already in use

Stop the other Vite process before running the root development command. The backend CORS list and Tauri `devUrl` currently expect port 5173, so using Vite's automatic fallback port will not produce a working desktop session without configuration changes.
