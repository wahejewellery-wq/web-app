import urllib.request

url = "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2UyZGI3ZGFmYjUzNDQ3ZGJhN2U3YmFiNWI5ODEzNjlkEgsSBxDH1M3UmRIYAZIBIwoKcHJvamVjdF9pZBIVQhM1MjY0MTQyNTIxMzY3NDc2NTE0&filename=&opi=96797242"
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

try:
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as response:
        html = response.read().decode('utf-8')
        with open("dashboard_fetched.html", 'w') as f:
            f.write(html)
        print("Success")
except Exception as e:
    print(f"Failed: {e}")

