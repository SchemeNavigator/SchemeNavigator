from datetime import datetime, timezone

from app.api.routes.recommendations import get_recommendation_service
from app.services.recommendation_service import RecommendationPayload
from app.graph.state import WorkflowState


def test_create_recommendation_route_with_override(client):
    class DummyRecommendationService:
        async def recommend(self, survey, request_id: str, correlation_id=None):
            return RecommendationPayload(
                success=True,
                message='OK',
                version='v1',
                workflow_id='test-wf',
                request_id=request_id,
                correlation_id=correlation_id,
                timestamp=datetime.now(timezone.utc).isoformat(),
                execution_time_ms=1,
                data={'recommendations': []},
            )

    def override_recommendation_service(request):
        return DummyRecommendationService()

    client.app.dependency_overrides[get_recommendation_service] = override_recommendation_service
    try:
        payload = {
            'citizen_id': '123',
            'age': 30,
            'state': 'Odisha',
            'category': 'Education',
        }
        response = client.post('/api/v1/recommendations', json=payload)

        assert response.status_code == 200
        body = response.json()
        assert body['success'] is True
        assert body['data']['workflow_id'] == 'test-wf'
        assert body['data']['request_id'] is not None
    finally:
        client.app.dependency_overrides.clear()


def test_ai_health_route_returns_json(client):
    response = client.get('/api/v1/ai/health')

    assert response.status_code == 200
    body = response.json()
    assert body['success'] is True
    assert 'workflow' in body['data']
    assert 'llm' in body['data']
    assert 'repository' in body['data']


def test_workflow_debug_route_returns_not_found_and_found(client):
    response = client.get('/api/v1/workflow/nonexistent')
    assert response.status_code == 404

    stored_state = WorkflowState()
    stored_state.metadata.workflow_id = 'stored-wf'
    stored_state.workflow_status = 'completed'
    stored_state.current_node = 'end'
    client.app.state.workflow_store.save('stored-wf', stored_state)

    response = client.get('/api/v1/workflow/stored-wf')
    assert response.status_code == 200
    body = response.json()
    assert body['success'] is True
    assert body['data']['execution_metadata']['workflow_status'] == 'completed'
    assert body['data']['execution_metadata']['current_node'] == 'end'
