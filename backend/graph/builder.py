"""LangGraph StateGraph assembly — router → specialist nodes."""

from langgraph.graph import END, StateGraph

from graph.state import GraphState
from graph.nodes.router import router_node
from graph.nodes.qa import qa_node
from graph.nodes.jd_analyzer import jd_analyzer_node
from graph.nodes.cover_letter import cover_letter_node
from graph.nodes.session_summary import session_summary_node


def _route_by_intent(state: GraphState) -> str:
    """Conditional edge: dispatch to specialist node based on intent."""
    intent_map = {
        "chat": "qa",
        "jd_analysis": "jd_analyzer",
        "cover_letter": "cover_letter",
        "session_summary": "session_summary",
    }
    return intent_map.get(state.intent, "qa")


def build_graph() -> StateGraph:
    """Build and compile the resume assistant graph."""
    graph = StateGraph(GraphState)

    # Add nodes
    graph.add_node("router", router_node)
    graph.add_node("qa", qa_node)
    graph.add_node("jd_analyzer", jd_analyzer_node)
    graph.add_node("cover_letter", cover_letter_node)
    graph.add_node("session_summary", session_summary_node)

    # Entry point
    graph.set_entry_point("router")

    # Conditional routing from router to specialists
    graph.add_conditional_edges(
        "router",
        _route_by_intent,
        {
            "qa": "qa",
            "jd_analyzer": "jd_analyzer",
            "cover_letter": "cover_letter",
            "session_summary": "session_summary",
        },
    )

    # All specialists end the graph
    graph.add_edge("qa", END)
    graph.add_edge("jd_analyzer", END)
    graph.add_edge("cover_letter", END)
    graph.add_edge("session_summary", END)

    return graph.compile()


# Singleton compiled graph
app_graph = build_graph()
