import subprocess
import time

def run(cmd):
    print(f"> {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    print(result.stdout)
    if result.stderr:
        print(result.stderr)
    return result.stdout

print("--- 1. Data Quality Check ---")
run("npx wrangler d1 execute vpchuoiskechers-db-staging --remote --command=\"SELECT legacy_source, is_mock, status, COUNT(*) FROM tasks GROUP BY legacy_source, is_mock, status;\"")

print("--- 2. Re-run Backfill (Idempotency) ---")
run("npx wrangler d1 execute vpchuoiskechers-db-staging --remote --file=scripts/production_backfill.sql")

print("--- 3. Rollback & Reapply ---")
run("npx wrangler d1 execute vpchuoiskechers-db-staging --remote --command=\"DROP TABLE tasks; DROP TABLE projects; DROP TABLE project_members;\"")
run("npx wrangler d1 execute vpchuoiskechers-db-staging --remote --file=migrations/0001_unified_tasks.sql")
run("npx wrangler d1 execute vpchuoiskechers-db-staging --remote --file=scripts/production_backfill.sql")
run("npx wrangler d1 execute vpchuoiskechers-db-staging --remote --command=\"SELECT COUNT(*) FROM tasks;\"")
