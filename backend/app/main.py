from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, conversations, chat

app = FastAPI(title="Chat App API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(conversations.router, prefix="/conversations", tags=["conversations"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])


@app.get("/health")
async def health():
    return {"status": "ok"}
