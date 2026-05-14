# backend/agent/graph.py
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from functools import partial
from backend.agent.state import AgentState
from backend.agent.nodes import agent_node, should_continue
from backend.agent.tools.calendar_tools import CALENDAR_TOOLS
from backend.agent.tools.gmail_tools import GMAIL_TOOLS
from backend.agent.tools.microsoft_tools import MICROSOFT_TOOLS

ALL_TOOLS = CALENDAR_TOOLS + GMAIL_TOOLS + MICROSOFT_TOOLS

def build_graph(llm):
    """
    Build and compile the LangGraph agent.
    Call once per request with the user's LLM instance.
    """
    # Bind tools to LLM so it knows what tools are available
    llm_with_tools = llm.bind_tools(ALL_TOOLS)
    
    # Tool execution node
    tool_node = ToolNode(ALL_TOOLS)
    
    # Build graph
    graph = StateGraph(AgentState)
    
    # Add nodes
    graph.add_node("agent", partial(agent_node, llm_with_tools=llm_with_tools))
    graph.add_node("tools", tool_node)
    
    # Set entry point
    graph.set_entry_point("agent")
    
    # Conditional routing after agent
    graph.add_conditional_edges(
        "agent",
        should_continue,
        {
            "tools": "tools",
            "end": END
        }
    )
    
    # After tools always go back to agent
    graph.add_edge("tools", "agent")
    
    return graph.compile()
