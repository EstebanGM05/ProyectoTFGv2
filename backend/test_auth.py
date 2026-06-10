import requests

s = requests.Session()

# 1. Login
res = s.post("http://localhost:5000/api/auth/login", json={"username": "testuser", "password": "password"})
print("LOGIN:", res.status_code, res.text)

if res.status_code != 200:
    # Try register
    res = s.post("http://localhost:5000/api/auth/register", json={"username": "testuser", "password": "password"})
    print("REGISTER:", res.status_code, res.text)
    res = s.post("http://localhost:5000/api/auth/login", json={"username": "testuser", "password": "password"})
    print("LOGIN 2:", res.status_code, res.text)

# 2. Test LFG
res = s.post("http://localhost:5000/api/lfg", json={"role": "TOP", "message": "Test"})
print("LFG:", res.status_code, res.text)

# 3. Test Teams
res = s.post("http://localhost:5000/api/teams", json={"name": "TestTeam", "tag": "TEST"})
print("TEAMS:", res.status_code, res.text)
