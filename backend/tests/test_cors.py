def test_cors_allows_production_vercel_origin(client):
    res = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "https://cloudora-one.vercel.app",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "https://cloudora-one.vercel.app"


def test_cors_still_allows_localhost_origin(client):
    res = client.options(
        "/api/v1/auth/login",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "POST",
        },
    )
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "http://localhost:3000"
