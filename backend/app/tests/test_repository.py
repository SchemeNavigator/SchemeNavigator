from app.repositories.scheme_repository import SchemeRepository


def test_repository_loads_csv(sample_csv_path):
    repository = SchemeRepository(sample_csv_path)

    schemes = repository.load_all()

    assert len(schemes) == 3
    assert schemes[0].scheme_name == "Scholarship for Students"
    assert schemes[0].slug == "scholarship-for-students"
    assert repository.is_loaded() is True


def test_repository_search(sample_csv_path):
    repository = SchemeRepository(sample_csv_path)

    results = repository.search(keyword="passport")

    assert len(results) == 1
    assert results[0].scheme_name == "Scholarship for Students"
