def test_keyword_search_endpoint(client):
    response = client.get("/schemes/search", params={"keyword": "odisha"})

    assert response.status_code == 200
    body = response.json()
    assert body["success"] is True
    assert len(body["data"]) == 2


def test_case_insensitive_and_partial_search(client):
    response = client.get("/schemes/search", params={"keyword": "PASS"})

    assert response.status_code == 200
    body = response.json()
    assert len(body["data"]) == 1
    assert body["data"][0]["slug"] == "scholarship-for-students"


def test_tag_search_endpoint(client):
    response = client.get("/schemes/search", params={"tag": "schol"})

    assert response.status_code == 200
    body = response.json()
    assert len(body["data"]) == 1
    assert body["data"][0]["scheme_name"] == "Scholarship for Students"


def test_combined_filters_endpoint(client):
    response = client.get(
        "/schemes/search",
        params={
            "keyword": "student",
            "level": "state",
            "scheme_category": "education",
            "tag": "Scholarship",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body["data"]) == 1
    assert body["data"][0]["slug"] == "scholarship-for-students"


def test_no_results_endpoint(client):
    response = client.get("/schemes/search", params={"keyword": "banana"})

    assert response.status_code == 200
    body = response.json()
    assert body["data"] == []


def test_invalid_parameter_rejected(client):
    response = client.get("/schemes/search", params={"state": "Kerala"})

    assert response.status_code == 422
