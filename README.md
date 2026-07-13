# macOS iMessage UI Clone for a Stealth AI Chat Interface

A beautiful, pixel-perfect macOS iMessage clone for interacting with stealth AI models (`GPT-4o`, `Claude 3.5 Sonnet`, `Gemini 1.5 Pro`, and `Llama 3.1`). Built with React 18, Tailwind CSS, Lucide React, and Python FastAPI.

---

## 🚀 Features

- **macOS iMessage Visual Replica**:
  - Translucent light-gray Sidebar (300px) with custom styling.
  - Search bar to filter AI models/contacts.
  - Sidebar listing contacts (different AI models) with status & timestamps.
  - macOS blue background highlight for the active chat contact.
  - White main chat area with contact info header.
  - Custom pill input bar with circular up-arrow send button.
  - iMessage-styled bubbles: User (Right, macOS Blue `#007AFF`, white text), AI (Left, light gray `#E9E9EB`, black text) with matching border-radii.
  - System font matching Apple platforms.
- **FastAPI Streaming Backend**:
  - Streams responses using HTTP Streaming Response.
  - Connected with Python SDKs for OpenAI, Anthropic (Claude), and Google (Gemini).
  - Graceful fallback simulator when API keys are not specified, allowing immediate testing of the UI.

---

## 🛠️ Project Structure

```
stealth-chat/
├── client/          # React Vite Frontend
│   └── src/
│       ├── App.tsx  # Main iMessage client app
│       └── index.css# Tailwind directives & overrides
└── server/          # FastAPI Python Backend
    ├── main.py      # App endpoints and streaming routes
    └── .env         # API Keys configuration
```

---

## 🚦 Getting Started

### 1. Start the FastAPI Backend

1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Activate virtual environment:
   ```bash
   source venv/bin/activate
   ```
3. (Optional) Edit `.env` file with your API keys:
   ```bash
   nano .env
   ```
4. Run the Uvicorn dev server:
   ```bash
   python3 main.py
   ```
   The backend will start at `http://localhost:8000`.

### 2. Start the React Frontend

1. Navigate to the client folder:
   ```bash
   cd client
   ```
2. Run Vite dev server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.
