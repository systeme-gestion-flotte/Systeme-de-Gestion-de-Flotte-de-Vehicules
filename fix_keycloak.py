import urllib.request
import urllib.parse
import json
import sys

# Configuration
KEYCLOAK_URL = "http://localhost:9080"
ADMIN_USER = "admin"
ADMIN_PASSWORD = "admin"
REALM = "fleet-management"

def make_request(url, method="GET", headers=None, data=None):
    if headers is None:
        headers = {}
    
    if data:
        if isinstance(data, dict) or isinstance(data, list):
            data = json.dumps(data).encode("utf-8")
            headers["Content-Type"] = "application/json"
        
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 204:
                return None
            return json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"HTTP Error {e.code}: {e.read().decode()}")
        raise

def get_token():
    url = f"{KEYCLOAK_URL}/realms/master/protocol/openid-connect/token"
    params = {
        "client_id": "admin-cli",
        "username": ADMIN_USER,
        "password": ADMIN_PASSWORD,
        "grant_type": "password"
    }
    data = urllib.parse.urlencode(params).encode("utf-8")
    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    return make_request(url, method="POST", headers=headers, data=data)["access_token"]

def update_user(token, username, password, roles):
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Get user ID
    url = f"{KEYCLOAK_URL}/admin/realms/{REALM}/users"
    params = urllib.parse.urlencode({"username": username, "exact": "true"})
    users = make_request(f"{url}?{params}", headers=headers)
    
    if not users:
        print(f"User {username} not found. Creating...")
        user_data = {
            "username": username,
            "enabled": True,
            "credentials": [{"type": "password", "value": password, "temporary": False}]
        }
        make_request(url, method="POST", headers=headers, data=user_data)
        users = make_request(f"{url}?{params}", headers=headers)
        user_id = users[0]["id"]
    else:
        user_id = users[0]["id"]
        # Update password
        url_pwd = f"{url}/{user_id}/reset-password"
        pwd_data = {"type": "password", "value": password, "temporary": False}
        make_request(url_pwd, method="PUT", headers=headers, data=pwd_data)
        print(f"Updated password for {username}")

    # 2. Get available roles
    url_roles = f"{KEYCLOAK_URL}/admin/realms/{REALM}/roles"
    all_roles = make_request(url_roles, headers=headers)
    
    # 3. Map role names to role objects
    target_roles = [r for r in all_roles if r["name"] in roles]
    
    # 4. Assign roles
    url_assign = f"{url}/{user_id}/role-mappings/realm"
    make_request(url_assign, method="POST", headers=headers, data=target_roles)
    print(f"Assigned roles {roles} to {username}")

try:
    print("Getting token...")
    token = get_token()
    
    # Target Roles (ensure they exist)
    # The realm import should have created: admin, manager, technicien, utilisateur
    
    updates = [
        ("admin-fleet", "Admin1234!", ["admin"]),
        ("manager-fleet", "manager1234!", ["manager", "admin"]),
        ("technicien-fleet", "technicien1234!", ["technicien"]),
        ("conducteur-fleet", "conducteur1234!", ["utilisateur"])
    ]
    
    for user, pwd, roles in updates:
        update_user(token, user, pwd, roles)
        
    print("\nSUCCESS: All users and roles updated successfully.")
except Exception as e:
    print(f"ERROR: {e}")
    sys.exit(1)
