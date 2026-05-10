# backend/agent/nodes.py
from datetime import datetime, timezone
from langchain_core.messages import SystemMessage, AIMessage, ToolMessage
from langgraph.prebuilt import ToolNode
from backend.agent.state import AgentState

SYSTEM_PROMPT = """You are FlowMind, an AI chief of staff. You help users manage their Google Calendar and Gmail through natural language.

## Your Capabilities
- Read, create, edit, and delete calendar events
- Search, delete, archive, and manage Gmail emails
- Check availability and find free time slots
- Draft email replies

## Rules You Must Always Follow
1. SAFETY FIRST: For destructive actions (delete emails, delete events), ALWAYS call count_emails/get_calendar_events first, show the user what will be affected, then ask for confirmation before proceeding.
2. PERMISSIONS: Check tool responses for "Permission denied" messages — if denied, tell the user how to enable the permission in Settings.
3. DATES: Today is {today}. When the user says "tomorrow", "next week", etc., calculate the exact ISO date.
4. TIMEZONE: Assume IST (UTC+5:30) unless user specifies otherwise.
5. CONCISE: Give clear, concise responses. Use bullet points for lists of events or emails.
6. CONFIRMATION PATTERN: For deletions, say: "I found X items. Are you sure you want to delete them?" — wait for user to confirm before executing.

## Response Format
- Use emoji sparingly: ✅ for success, ⚠️ for warnings, 📅 for calendar, 📧 for email
- Keep responses under 200 words unless showing a list
- Always confirm what action was taken after completing it
"""

async def agent_node(state: AgentState, llm_with_tools) -> AgentState:
    """Main agent node — calls LLM with tools bound"""
    today = datetime.now(timezone.utc).strftime("%A, %B %d, %Y")
    system = SystemMessage(content=SYSTEM_PROMPT.format(today=today))
    
    # Prepend system message if first call
    messages = state["messages"]
    if not any(isinstance(m, SystemMessage) for m in messages):
        messages = [system] + messages
        
    response = await llm_with_tools.ainvoke(messages)
    return {"messages": [response]}

def should_continue(state: AgentState) -> str:
    """Router: decide next node after agent responds"""
    last_message = state["messages"][-1]
    
    # If LLM called tools → go to tools node
    if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
        # Check if any tool call needs confirmation
        for call in last_message.tool_calls:
            if call['name'] in ['delete_calendar_event', 'delete_emails']:
                # Check if confirmed=True was passed
                args = call.get('args', {})
                if not args.get('confirmed', False) and call['name'] == 'delete_emails':
                    return "end"   # Stop and ask for confirmation in chat
        return "tools"
        
    # No tool calls → done
    return "end"
