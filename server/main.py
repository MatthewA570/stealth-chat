import os
import asyncio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import google.generativeai as genai


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

async def gemini_stream(prompt: str, model_id: str, history: list[ChatHistoryMessage], api_key: str):
    genai.configure(api_key=api_key)
    
    # Map friendly frontend name to official Google model tags
    google_model_name = "gemini-3.5-flash"
    if model_id == "gemini-3.1-pro":
        google_model_name = "gemini-3.1-pro"
    elif model_id == "gemini-3.1-flash-lite":
        google_model_name = "gemini-3.1-flash-lite"

    # Format history for Gemini SDK (user and model roles)
    contents = []
    for h in history:
        role = 'user' if h.role == 'user' else 'model'
        contents.append({"role": role, "parts": [h.content]})
    contents.append({"role": "user", "parts": [prompt]})

    try:
        model = genai.GenerativeModel(google_model_name)
        response = await model.generate_content_async(contents, stream=True)
        async for chunk in response:
            if chunk.text:
                yield chunk.text
    except Exception as e:
        yield f"⚠️ Gemini SDK Error ({google_model_name}): {str(e)}"

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
    api_key = req.headers.get("x-gemini-api-key")

    # If key is missing, provide fallback simulation
    if not api_key or api_key.strip() == "":
        return StreamingResponse(fallback_stream(model, prompt), media_type="text/plain")

    return StreamingResponse(gemini_stream(prompt, model, history, api_key), media_type="text/plain")


if __name__ == "__main__":
    import uvicorn
    # When packaged as a sidecar, running with reload=True is not compatible with pyinstaller binary compilation,
    # so we set it to False and pass the app object directly to prevent import errors under frozen binaries.
    uvicorn.run(app, host="127.0.0.1", port=8000)

