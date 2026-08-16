import logging
from pathlib import Path

from app.graph.state import WorkflowState
from app.graph.context import ExecutionContext
from app.graph.repository_retrieval_node import RepositoryRetrievalNode
from app.graph.conditional_router import ConditionalRouter
from app.repositories.scheme_repository import SchemeRepository


def test_repository_retrieval_sets_next_node() -> None:
    """Bounded regression test: retrieval returns candidates and advances to recommendation.

    - Does not call any LLM/OpenRouter code.
    - Uses the real CSV-backed repository but only exercises the retrieval node.
    """
    logger = logging.getLogger("test_retrieval")

    state = WorkflowState()
    # provide a basic expanded keyword likely to match some records
    state.repository_query.expanded_keywords = ["incentive"]

    # locate the dataset relative to the repository root
    csv_path = Path(__file__).parents[3] / "data" / "schemes.csv"
    repo = SchemeRepository(csv_path)

    ctx = ExecutionContext(state=state, repository=repo, logger=logger)

    node = RepositoryRetrievalNode(ctx)
    updated = node.execute(state)

    # retrieval produced candidates
    assert len(updated.candidate_schemes) > 0

    # node now explicitly advances to recommendation
    assert updated.next_node == "recommendation"

    # router should honor that and return recommendation
    router = ConditionalRouter({})
    next_node, trace = router.decide(updated)
    assert next_node == "recommendation"
