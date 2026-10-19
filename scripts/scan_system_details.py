import re
import sys
import os

sys.stdout.reconfigure(encoding='utf-8')

def extract_routes():
    with open('web/public/_worker.js', 'r', encoding='utf-8', errors='ignore') as f:
        worker_code = f.read()

    routes = set()
    for m in re.finditer(r'url\.pathname\.startsWith\([\'"]([^\'"]+)[\'"]\)', worker_code):
        routes.add(m.group(1))
    for m in re.finditer(r'url\.pathname\s*===\s*[\'"]([^\'"]+)[\'"]', worker_code):
        routes.add(m.group(1))

    print(f"Worker API routes count: {len(routes)}")
    for r in sorted(routes):
        print(f"  {r}")

    api_routes = []
    for root, dirs, files in os.walk('web/src/app/api'):
        for f in files:
            if f in ('route.ts', 'route.js'):
                rel = os.path.relpath(root, 'web/src/app')
                api_routes.append('/' + rel.replace('\\', '/'))

    print(f"\nNext.js API routes count: {len(api_routes)}")
    for r in sorted(api_routes):
        print(f"  {r}")

if __name__ == '__main__':
    extract_routes()
