from ..graph.retrieval_engine import RetrievalEngine
from ..models.scheme import Scheme


class MockRepo:
    def __init__(self, schemes):
        self._schemes = schemes

    def load_all(self):
        return self._schemes


def sample_scheme(name, slug, category, tags, level, details="", benefits="", eligibility="", application="", documents=""):
    return Scheme(scheme_name=name, slug=slug, details=details, benefits=benefits, eligibility=eligibility, application=application, documents=documents, level=level, scheme_category=category, tags=tags)


def test_weighted_scoring_and_filtering():
    s1 = sample_scheme("Student Scholarship A", "s1", "Education & Learning", ["student", "scholarship"], "national", details="This scholarship for students")
    s2 = sample_scheme("Farmer Support", "s2", "Agriculture", ["farmer"], "state", details="Crop support for farmers")
    repo = MockRepo([s1, s2])

    engine = RetrievalEngine(repo)

    expanded_query = {
        "weighted_keywords": [{"keyword": "student", "weight": 1.0}, {"keyword": "scholarship", "weight": 0.9}],
        "categories": ["education & learning"],
        "tags": ["student"],
        "levels": ["national"],
    }

    collection = engine.retrieve(expanded_query)
    assert collection.total_candidates >= 1
    # top candidate should be s1
    assert collection.candidate_schemes[0].scheme.slug == "s1"
