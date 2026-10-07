import os

api_path = r"d:\Work\TBS II\web\src\app\api\rooms\route.ts"
with open(api_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("export const dynamic = 'force-dynamic';", "// export const dynamic = 'force-dynamic';")

with open(api_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Reverted dynamic=force-dynamic in route.ts")
