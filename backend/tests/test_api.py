import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"
        assert data["database"]["connected"] is True
        assert data["database"]["record_count"] >= 6000

@pytest.mark.asyncio
async def test_list_records():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/records?page=1&page_size=10")
        assert res.status_code == 200
        data = res.json()
        assert data["total"] >= 6000
        assert len(data["items"]) == 10
        assert "ident" in data["items"][0]

@pytest.mark.asyncio
async def test_get_single_record():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/records/100004")
        assert res.status_code == 200
        data = res.json()
        assert data["ident"] == "100004"
        assert "FOULED" in data["action"]

@pytest.mark.asyncio
async def test_hybrid_search():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/search/hybrid", json={
            "query": "engine idle override killed engine",
            "top_k": 3
        })
        assert res.status_code == 200
        data = res.json()
        assert len(data["results"]) >= 1
        idents = [r["ident"] for r in data["results"]]
        assert any(i in ["100001", "100002", "100003"] for i in idents)

@pytest.mark.asyncio
async def test_chat_turn():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.post("/api/chat", json={
            "query": "What action was taken when fuel servo was replaced?"
        })
        assert res.status_code == 200
        data = res.json()
        assert "answer" in data
        assert len(data["citations"]) > 0
        assert "Decision Support Notice" in data["disclaimer"]

@pytest.mark.asyncio
async def test_analytics_overview():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/analytics/overview")
        assert res.status_code == 200
        data = res.json()
        assert data["total_records"] >= 6000
        assert len(data["top_components"]) > 0

@pytest.mark.asyncio
async def test_model_settings():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Get settings
        res = await ac.get("/api/settings/model")
        assert res.status_code == 200
        data = res.json()
        assert "provider" in data
        assert "model_name" in data

        # Update settings to local
        update_res = await ac.post("/api/settings/model", json={
            "provider": "local",
            "model_name": "HuggingFaceTB/SmolLM2-360M-Instruct",
            "temperature": 0.15
        })
        assert update_res.status_code == 200
        updated = update_res.json()
        assert updated["provider"] == "local"
        assert updated["temperature"] == 0.15

@pytest.mark.asyncio
async def test_safety_alerts_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/analytics/alerts")
        assert res.status_code == 200
        data = res.json()
        assert "total_alerts" in data
        assert data["total_alerts"] > 0
        assert data["critical_count"] > 0
        assert len(data["alerts"]) > 0
        assert data["alerts"][0]["severity"] in ["CRITICAL", "HIGH", "ELEVATED", "ADVISORY"]

@pytest.mark.asyncio
async def test_subsystem_compare_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        res = await ac.get("/api/analytics/compare?components=CYLINDER,BAFFLE,MAGNETO")
        assert res.status_code == 200
        data = res.json()
        assert len(data["comparisons"]) == 3
        comp_names = [c["component"] for c in data["comparisons"]]
        assert "CYLINDER" in comp_names
        assert data["comparisons"][0]["total_records"] > 0


