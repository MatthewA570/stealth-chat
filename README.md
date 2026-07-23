# Stealth Chat (macOS iMessage Desktop App)

A beautiful, pixel-perfect macOS iMessage desktop client replica built to interact securely with frontier Gemini models (`Gemini 3.5 Flash`, `Gemini 3.1 Pro`, and `Gemini 3.1 Flash-Lite`). 

The application is built inside a **Tauri v2** native desktop container with a borderless, transparent frame supporting native macOS traffic light window controls and sidebar vibrancy. The Python FastAPI backend runs as a packaged **compiled sidecar binary**, requiring no local Python installation on the user's system.

---

## 🏗️ Architecture Design

```mermaid
graph TD
    A[macOS Desktop Container (Tauri + Rust)] --> B[WebView Frontend (React 19)]
    A --> C[Python FastAPI Sidecar (PyInstaller Binary)]
    B -- Chat & SSE Streams (X-Gemini-API-Key header) --> C
    C -- Gemini API Calls --> D[Google Generative AI Services]
```

---

## ✨ Features

- **iMessage Visual Replica**:
  - Translucent Sidebar (300px) with custom macOS backdrop-blur.
  - Sidebar header with Settings, centralized app title, and compose button.
  - Integrated, rounded search bar matching the macOS look.
  - Active state contact highlight using system blue (`#007AFF`) with white text and smooth pill layout.
- **Letter Initials Avatars**:
  - Clean, minimalist letter avatar icons with tailored solid colors/gradients (no messy emojis or placeholder images).
- **Bubble Geometry & Tails**:
  - Pixel-perfect bubble corner rounding: `20px` standard rounding.
  - Tail behavior matching macOS iMessage: the last message in a consecutive group gets a sharp tail (`rounded-br-[5px]` for sent right bubbles, `rounded-bl-[5px]` for received left bubbles).
  - Sent bubbles use system green (`#34C759`) for SMS threads and system blue (`#007AFF`) for standard AI models.
  - Received bubbles use dark neutral gray (`#262628`).
- **Clean Input Bar**:
  - Plus attachment icon on the far left.
  - Pill-shaped input field with inner border and clean input action.
  - Smile and AudioLines (microphone replacement) icons placed inside the input field.
  - Dynamic send button appearing only when text is entered.
- **Borderless & Translucent Window**:
  - Titlebar-less window rendering with native traffic lights (close, minimize, maximize buttons) preserved.
  - Integrates native macOS system vibrancy (`NSVisualEffectMaterial::Sidebar`) for a sleek, premium desktop app look.
- **Dynamic API Key Config (Zero Server Leaks)**:
  - Users are prompted to enter their Google AI Studio API key on first run.
  - Keys are stored locally inside the WebView sandbox (`localStorage`) and sent to the loopback server (`127.0.0.1:8000`) dynamically in request headers.
  - Completely stateless backend, ensuring no API keys are logged, hardcoded, or pushed to GitHub.
- **PACKAGED Python Backend**:
  - The FastAPI backend is compiled into a single binary using PyInstaller.
  - Tauri handles launching the sidecar automatically on app startup and terminating it on shutdown.

---

## 🚦 Running in Development

Ensure you have Node.js and Rust installed on your machine.

1. **Install dependencies**:
   ```bash
   npm install && npm install --prefix client
   ```
2. **Build the Python sidecar binary** (Required for Tauri wrapper):
   ```bash
   cd server
   python3 -m venv venv
   source venv/bin/activate
   pip install fastapi uvicorn google-generativeai pydantic sse-starlette pyinstaller
   
   # Compile sidecar
   pyinstaller --onefile --name server main.py
   
   # Copy compiled sidecar to Tauri binaries folder with your target triple
   mkdir -p ../src-tauri/binaries
   cp dist/server ../src-tauri/binaries/server-aarch64-apple-darwin # Use your host target triple
   ```
3. **Start Tauri Dev Server**:
   Navigate back to the project root and run:
   ```bash
   npm run dev
   ```
   *This starts the frontend compiler, launches the FastAPI sidecar backend, and opens the native macOS app window.*

---

## 📦 Building Standalone Installer (`.dmg` / `.app`)

Compile both client assets and Rust bundle wrapper into a single standalone installer:
```bash
npm run build
```
The output will be generated inside the release folder:
- **macOS Executable**: `src-tauri/target/release/bundle/macos/StealthChat.app`
- **Installer DMG**: `src-tauri/target/release/bundle/dmg/StealthChat_0.1.0_aarch64.dmg`

---

## 🔒 Security Principles

- **No Hardcoded Keys**: The repository contains no `.env` credentials or API keys.
- **Loopback Binding**: The sidecar API binds strictly to `127.0.0.1` preventing remote access.
- **Sandboxed LocalStorage**: Keys never touch external servers other than directly querying Google's Gemini endpoint.
