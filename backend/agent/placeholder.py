# backend/agent/placeholder.py
import asyncio

async def run_agent_placeholder(message: str, user_id: str, conversation_id: str):
    """
    Placeholder async generator yielding StreamEvent dicts.
    Simulates a realistic AI response for demo/testing.
    """
    yield {"type": "tool_start", "tool_name": "get_calendar_events", "tool_label": "📅 Checking your calendar..."}
    
    await asyncio.sleep(1.0)
    
    yield {"type": "tool_end", "result": "Found 3 events"}
    
    response = "I checked your calendar. You have 3 events today: Standup at 9 AM, Lunch with team at 1 PM, and Code review at 4 PM."
    for word in response.split():
        yield {"type": "token", "content": word + " "}
        await asyncio.sleep(0.05)
        
    yield {"type": "done"}
