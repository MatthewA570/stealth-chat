import asyncio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import google.genai as genai


app = FastAPI()


# Add fallback origins for Tauri production environments
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "tauri://localhost",
        "https://tauri.localhost",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatHistoryMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    model: str
    history: list[ChatHistoryMessage] = []

# Maps frontend model IDs to current Google Gemini model names (3.x family, as of 2026)
MODEL_MAP = {
    "gemini-3.5-flash": "gemini-3.5-flash",
    "gemini-3.1-pro": "gemini-3.1-pro",
    "gemini-3.1-flash-lite": "gemini-3.5-flash-lite",
}

async def gemini_stream(prompt: str, model_id: str, history: list[ChatHistoryMessage], api_key: str):
    client = genai.Client(api_key=api_key)
    google_model_name = MODEL_MAP.get(model_id, "gemini-3.5-flash")

    # Format history for Gemini SDK
    contents = []
    for h in history:
        role = "user" if h.role == "user" else "model"
        contents.append({"role": role, "parts": [{"text": h.content}]})
    contents.append({"role": "user", "parts": [{"text": prompt}]})

    try:
        response = await client.aio.models.generate_content_stream(
            model=google_model_name,
            contents=contents,
        )
        async for chunk in response:
            if chunk.text:
                yield chunk.text
    except Exception as e:
        err_msg = str(e)
        if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg or "limit: 0" in err_msg:
            # If the model requested wasn't gemini-3.5-flash, attempt automatic fallback
            if google_model_name != "gemini-3.5-flash":
                try:
                    yield f"⚠️ *Notice: `{google_model_name}` quota exceeded. Falling back to `gemini-3.5-flash`...*\n\n"
                    fallback_resp = await client.aio.models.generate_content_stream(
                        model="gemini-3.5-flash",
                        contents=contents,
                    )
                    async for chunk in fallback_resp:
                        if chunk.text:
                            yield chunk.text
                    return
                except Exception as fb_err:
                    err_msg = str(fb_err)

            yield (
                f"⚠️ **Gemini API Quota Exceeded (429)**\n\n"
                f"Google AI Studio has set the free-tier quota for `{google_model_name}` to 0 for your API key's project.\n\n"
                f"**How to fix:**\n"
                f"1. Make sure your API key was created at [Google AI Studio](https://aistudio.google.com/).\n"
                f"2. Try **Gemini 3.5 Flash** which has a generous free tier.\n"
                f"3. If using Google Cloud project keys, verify billing is enabled."
            )
        elif "API_KEY_INVALID" in err_msg or ("400" in err_msg and "API key" in err_msg):
            yield "⚠️ **Invalid API Key**: The API key provided was not accepted by Google AI Studio. Please verify your key in settings (gear icon)."
        else:
            yield f"⚠️ **Gemini API Error ({google_model_name})**: {err_msg}"

async def fallback_stream(model_name: str, prompt: str):
    reply = (
        f"[Simulated Response from {model_name}]\n"
        f"Query: \"{prompt}\"\n\n"
        f"Backend is ready. To enable live API calls, please configure your API key in the settings panel (gear icon)."
    )
    for word in reply.split(" "):
        yield word + " "
        await asyncio.sleep(0.08)

@app.post("/chat")
async def chat(request: ChatRequest, req: Request):
    model = request.model
    prompt = request.message
    history = request.history

    # Extract API key from custom headers
    api_key = req.headers.get("x-gemini-api-key", "").strip()

    # If key is missing, provide fallback simulation
    if not api_key:
        return StreamingResponse(fallback_stream(model, prompt), media_type="text/plain")

    return StreamingResponse(gemini_stream(prompt, model, history, api_key), media_type="text/plain")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
