from ..graph.query_expansion_node import normalize_keyword, dedupe_preserve_order, remove_stopwords, expand_synonyms, QueryExpansionNode
from ..graph.context import ExecutionContext
from ..graph.state import WorkflowState, Intent


def test_normalize_keyword():
    assert normalize_keyword(" Student ") == "student"
    assert normalize_keyword("Scholarship!") == "scholarship"


def test_stopword_removal():
    kws = ["student", "scheme", "government", "scholarship"]
    cleaned, removed = remove_stopwords(kws, set(["scheme", "government"]))
    assert "scheme" in removed
    assert "government" in removed
    assert "student" in cleaned


def test_synonym_expansion():
    synonyms = {"student": ["education", "scholarship"]}
    res = expand_synonyms(["student"], synonyms)
    assert "education" in res and "scholarship" in res


def test_query_expansion_node_basic():
    state = WorkflowState()
    state.intent = Intent(keywords=["Student", "Scholarship"], categories=["education"], tags=["scholarship"], levels=["national"]) 
    ctx = ExecutionContext(state=state)
    node = QueryExpansionNode(ctx)
    new_state = node.execute(state)
    # check repository_query updated
    assert isinstance(new_state.repository_query.expanded_keywords, list)
    assert "student" in new_state.repository_query.expanded_keywords
    assert new_state.repository_query.search_parameters["categories"]
