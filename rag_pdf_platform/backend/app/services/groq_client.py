from openai import OpenAI

from app.config import settings


def get_client(api_key: str) -> OpenAI:
    return OpenAI(api_key=api_key, base_url=settings.groq_base_url)


def chat_completion(api_key: str, messages: list[dict], temperature: float = 0.2) -> str:
    client = get_client(api_key)
    resp = client.chat.completions.create(
        model=settings.groq_chat_model,
        messages=messages,
        temperature=temperature,
    )
    choice = resp.choices[0]
    return (choice.message.content or "").strip()
