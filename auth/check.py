import json

with open('realm-export.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

users = data.get('users', [])
for u in users:
    print(f"User: {u.get('username')} - Roles: {u.get('realmRoles')}")
