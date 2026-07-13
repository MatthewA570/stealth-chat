import os
import asyncio
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from dotenv import load_dotenv

# Import SDKs
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
import google.generativeai as genai

load_dotenv()

app = FastAPI()

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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

async def gpt_stream(prompt: str, history: list[ChatHistoryMessage]):
    # Read API Key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        yield "⚠️ OpenAI API key is missing in server's .env file."
        return

    client = AsyncOpenAI(api_key=api_key)
    
    # Format messages
    messages = []
    for h in history:
        messages.append({"role": h.role, "content": h.content})
    messages.append({"role": "user", "content": prompt})

    try:
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=messages,
            stream=True
        )
        async for chunk in response:
            content = chunk.choices[0].delta.content
            if content:
                yield content
    except Exception as e:
        yield f"⚠️ OpenAI Error: {str(e)}"

async def claude_stream(prompt: str, history: list[ChatHistoryMessage]):
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        yield "⚠️ Anthropic API key is missing in server's .env file."
        return

    client = AsyncAnthropic(api_key=api_key)
    
    # Anthropic expects user/assistant messages and can handle system messages separately or in normal flow.
    # Note: Anthropic doesn't support the system role in standard messages list if formatted incorrectly.
    # We will filter message roles to user/assistant only.
    messages = []
    for h in history:
        # Anthropic roles are 'user' and 'assistant'
        role = 'assistant' if h.role == 'assistant' else 'user'
        messages.append({"role": role, "content": h.content})
    messages.append({"role": "user", "content": prompt})

    try:
        async with client.messages.stream(
            model="claude-3-5-sonnet-20241022",
            max_tokens=4096,
            messages=messages
        ) as stream:
            async for text in stream.text_stream:
                yield text
    except Exception as e:
        yield f"⚠️ Anthropic Error: {str(e)}"

async def gemini_stream(prompt: str, history: list[ChatHistoryMessage]):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        yield "⚠️ Gemini API key is missing in server's .env file."
        return

    genai.configure(api_key=api_key)
    
    # Format history for Gemini SDK
    # Gemini uses 'user' and 'model' as roles
    contents = []
    for h in history:
        role = 'user' if h.role == 'user' else 'model'
        contents.append({"role": role, "parts": [h.content]})
    contents.append({"role": "user", "parts": [prompt]})

    try:
        # Using Gemini 1.5 Pro
        model = genai.GenerativeModel("gemini-1.5-pro")
        # genai SDK streaming isn't native async-iterable out of the box in the same way, 
        # so we run it in executor or use async loop helpers if needed. 
        # But we can call generate_content_async.
        response = await model.generate_content_async(contents, stream=True)
        async for chunk in response:
            if chunk.text:
                yield chunk.text
    except Exception as e:
        yield f"⚠️ Gemini Error: {str(e)}"

async def fallback_stream(model_name: str, prompt: str):
    # Simulated streaming responses for testing/dev if keys are not present
    reply = f"[Simulated Response from {model_name}]\nReceived: '{prompt}'\nTo enable live responses, please configure your API keys in the `.env` file inside the `server/` directory."
    for word in reply.split(" "):
        yield word + " "
        await asyncio.sleep(0.08)

@app.post("/chat")
async def chat(request: ChatRequest):
    model = request.model
    prompt = request.message
    history = request.history

    # If key is missing for the model, provide the simulated output explaining this,
    # rather than just crashing immediately, to make local testing easier.
    if model == "gpt-4o":
        if not os.getenv("OPENAI_API_KEY"):
            return StreamingResponse(fallback_stream("GPT-4o", prompt), media_type="text/plain")
        return StreamingResponse(gpt_stream(prompt, history), media_type="text/plain")
        
    elif model == "claude-3-5-sonnet":
        if not os.getenv("ANTHROPIC_API_KEY"):
            return StreamingResponse(fallback_stream("Claude 3.5 Sonnet", prompt), media_type="text/plain")
        return StreamingResponse(claude_stream(prompt, history), media_type="text/plain")
        
    elif model == "gemini-1-5-pro":
        if not os.getenv("GEMINI_API_KEY"):
            return StreamingResponse(fallback_stream("Gemini 1.5 Pro", prompt), media_type="text/plain")
        return StreamingResponse(gemini_stream(prompt, history), media_type="text/plain")
        
    else:
        # Llama 3.1 fallback/simulation
        return StreamingResponse(fallback_stream(f"Llama 3.1 (config: {model})", prompt), media_type="text/plain")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
