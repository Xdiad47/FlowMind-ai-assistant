# backend/agent/runner.py
import traceback
from langchain_core.messages import HumanMessage, AIMessage
from backend.agent.graph import build_graph
from backend.agent.llm_router import get_llm
from backend.agent.tools.base_tool import set_tool_context
from backend.agent.state import AgentState
from backend.services.auth_service import get_user_api_key

from firebase_admin import firestore as admin_firestore

async def fetch_history(uid: str, conv_id: str) -> list:
    try:
        db = admin_firestore.client()
        doc = db.collection('users').document(uid)\
                 .collection('conversations').document(conv_id).get()
        if doc.exists:
            data = doc.to_dict()
            return data.get('messages', [])
    except Exception:
        pass
    return []

async def run_agent(
    message: str,
    user_id: str,
    conversation_id: str,
    access_token: str,
    permissions: dict,
    plan: str,
    conversation_history: list,
    ms_access_token: str = "",
):
    """
    Async generator that yields SSE-formatted dicts.
    Called by routers/chat.py and results are streamed via EventSourceResponse.
    Flow:
    1. Set tool context (access_token, user_id, permissions) via ContextVar
    2. Get user's LLM via get_user_api_key() + get_llm()
    3. Build LangGraph graph via build_graph(llm)
    4. Construct initial AgentState with conversation history + new message
    5. Stream graph execution via graph.astream_events()
    6. Yield StreamEvent dicts for each relevant event:
    Event mapping from LangGraph astream_events:
      - event "on_chat_model_stream" + chunk.content →
          yield { type: "token", content: chunk }
      - event "on_tool_start" + tool name →
          yield { type: "tool_start", tool_name: name, tool_label: TOOL_LABELS[name] }
      - event "on_tool_end" →
          yield { type: "tool_end", result: str(output) }
      - graph finishes →
          yield { type: "done" }
      - any exception →
          yield { type: "error", content: str(exception) }
    """
    TOOL_LABELS = {
        "get_calendar_events": "📅 Checking Google Calendar...",
        "create_calendar_event": "📅 Creating event...",
        "delete_calendar_event": "📅 Removing event...",
        "get_availability": "📅 Checking availability...",
        "search_emails": "📧 Searching Gmail...",
        "count_emails": "📧 Counting emails...",
        "delete_emails": "🗑️ Preparing to delete emails...",
        "archive_emails": "📦 Archiving emails...",
        "mark_emails_as_read": "✅ Marking as read...",
        "draft_email_reply": "✍️ Drafting reply...",
        "get_ms_calendar_events": "📅 Checking Microsoft Calendar...",
        "search_outlook_emails": "📧 Searching Outlook...",
    }
    
    try:
        # 1. Set tool context via ContextVar
        set_tool_context(access_token, user_id, permissions, ms_access_token)
        
        # 2. Get LLM for this user
        key_result = await get_user_api_key(user_id)
        provider, api_key = key_result if key_result else (None, None)
        llm = get_llm(provider, api_key, plan)
        
        # 3. Build graph
        graph = build_graph(llm)
        
        # 4. Build initial state
        # Convert conversation_history (list of {role, content} dicts) to LangChain messages
        history_messages = []
        for msg in conversation_history[-10:]:  # last 10 messages for context window
            if msg['role'] == 'user':
                history_messages.append(HumanMessage(content=msg['content']))
            elif msg['role'] == 'assistant':
                history_messages.append(AIMessage(content=msg['content']))
                
        initial_state = AgentState(
            messages=history_messages + [HumanMessage(content=message)],
            user_id=user_id,
            conversation_id=conversation_id,
            access_token=access_token,
            ms_access_token=ms_access_token,
            permissions=permissions,
            plan=plan,
            pending_confirmation=None,
            awaiting_confirmation=False,
            actions_taken=[]
        )
        
        # 5. Stream graph events
        async for event in graph.astream_events(initial_state, version="v2"):
            event_name = event.get("event", "")
            event_data = event.get("data", {})
            
            # Stream LLM tokens
            if event_name == "on_chat_model_stream":
                chunk = event_data.get("chunk")
                if chunk and hasattr(chunk, 'content') and chunk.content:
                    yield {"type": "token", "content": chunk.content}
                    
            # Tool started
            elif event_name == "on_tool_start":
                tool_name = event.get("name", "")
                yield {
                    "type": "tool_start",
                    "tool_name": tool_name,
                    "tool_label": TOOL_LABELS.get(tool_name, f"🔧 Running {tool_name}...")
                }
                
            # Tool finished
            elif event_name == "on_tool_end":
                output = event_data.get("output", "")
                yield {"type": "tool_end", "result": str(output)[:200]}
                
        yield {"type": "done"}
        
    except ValueError as e:
        print(f"[runner] ValueError: {e}")
        traceback.print_exc()
        yield {"type": "error", "content": str(e)}
    except Exception as e:
        print(f"[runner] Exception: {type(e).__name__}: {e}")
        traceback.print_exc()
        yield {"type": "error", "content": f"Agent error: {type(e).__name__}: {e}"}
