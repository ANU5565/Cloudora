import pytest


def get_auth_token(client, email="folder_user@cloudora.io"):
    client.post("/api/v1/auth/register", json={
        "email": email,
        "full_name": "Folder Tester",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "terms_accepted": True
    })
    res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "Password123!"
    })
    return res.json()["access_token"]


def test_folder_hierarchy_and_cycles(client):
    token = get_auth_token(client)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create root folder "Projects"
    f1_res = client.post("/api/v1/folders", headers=headers, json={"name": "Projects"})
    assert f1_res.status_code == 200
    f1 = f1_res.json()

    # 2. Create subfolder "Cloudora" inside "Projects"
    f2_res = client.post("/api/v1/folders", headers=headers, json={
        "name": "Cloudora",
        "parent_id": f1["id"]
    })
    assert f2_res.status_code == 200
    f2 = f2_res.json()

    # 3. Create subfolder "Design" inside "Cloudora"
    f3_res = client.post("/api/v1/folders", headers=headers, json={
        "name": "Design",
        "parent_id": f2["id"]
    })
    assert f3_res.status_code == 200
    f3 = f3_res.json()

    # 4. Check folder contents & breadcrumbs
    contents_res = client.get(f"/api/v1/folders/{f3['id']}/contents", headers=headers)
    assert contents_res.status_code == 200
    data = contents_res.json()
    crumbs = [c["name"] for c in data["breadcrumbs"]]
    assert crumbs == ["All Files", "Projects", "Cloudora", "Design"]

    # 5. Cycle test: Attempting to move "Projects" (f1) inside "Design" (f3) must be rejected!
    cycle_res = client.patch(f"/api/v1/folders/{f1['id']}", headers=headers, json={
        "parent_id": f3["id"]
    })
    assert cycle_res.status_code == 400
    assert "FOLDER_CYCLE" in cycle_res.text or "subfolder" in cycle_res.text.lower()

    # 6. Attempting to move "Projects" inside itself must be rejected!
    self_cycle = client.patch(f"/api/v1/folders/{f1['id']}", headers=headers, json={
        "parent_id": f1["id"]
    })
    assert self_cycle.status_code == 400

    # 7. Trashing "Projects" should soft-delete all children
    del_res = client.delete(f"/api/v1/folders/{f1['id']}", headers=headers)
    assert del_res.status_code == 200

    # Active folders query should be empty
    active_folders = client.get("/api/v1/folders", headers=headers).json()
    assert len(active_folders) == 0
