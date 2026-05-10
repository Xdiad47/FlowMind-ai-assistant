# backend/agent/llm_router.py
from backend.models.user import ApiProvider
from backend.config.settings import settings

def get_llm(provider: str | None, api_key: str | None, plan: str):
    """
    Returns the correct LangChain LLM instance based on user's provider and plan.
    Defaults to hosted Groq if no key provided (hosted tier).
    """
    from langchain_openai import ChatOpenAI
    from langchain_anthropic import ChatAnthropic
    from langchain_google_genai import ChatGoogleGenerativeAI
    from langchain_groq import ChatGroq
    
    if not api_key:
        if settings.platform_groq_api_key:
            return ChatGroq(
                api_key=settings.platform_groq_api_key,
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                temperature=0,
            )
        raise ValueError("No API key available. Please add your API key in Settings.")
        
    match provider:
        case ApiProvider.OPENAI:
            return ChatOpenAI(
                api_key=api_key,
                model="gpt-4o-mini",
                temperature=0,
            )
        case ApiProvider.ANTHROPIC:
            return ChatAnthropic(
                api_key=api_key,
                model="claude-3-haiku-20240307",
                temperature=0,
            )
        case ApiProvider.GEMINI:
            return ChatGoogleGenerativeAI(
                google_api_key=api_key,
                model="gemini-1.5-flash",
                temperature=0,
            )
        case ApiProvider.GROQ | _:
            return ChatGroq(
                api_key=api_key,
                model="meta-llama/llama-4-scout-17b-16e-instruct",
                temperature=0,
            )
