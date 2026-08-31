from ..validators import _split_docs, consistency_validator, eligibility_validator, document_validator, workflow_validator
from ....graph.state import WorkflowState


def test_split_docs():
    assert _split_docs("ID; Income") == ["ID", "Income"]


def test_consistency_validator_basic():
    state = WorkflowState()
    # minimal planner and selected
    class P: pass
    p = P(); p.selected_scheme_ids = ["s1"]
    state.planner_output = p
    class Sel: pass
    sel = Sel(); sel.scheme_id = "s1"
    state.selected_scheme = sel
    state.ranked_schemes = []
    state.candidate_schemes = []
    report = consistency_validator(state)
    assert report.planner_references_selected_scheme is True


def test_document_validator_basic():
    state = WorkflowState()
    class S: pass
    s = S(); s.slug = "s1"; s.documents = "ID;Income"
    state.candidate_schemes = [s]
    class Sel: pass
    sel = Sel(); sel.scheme_id = "s1"; sel.scheme_name = "A"
    state.selected_scheme = sel
    # no planner meta
    report = document_validator(state)
    assert "ID" in report.required_documents_listed
