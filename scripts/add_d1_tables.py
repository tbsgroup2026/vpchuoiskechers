import re

file_path = 'web/src/lib/kaizenDbMigration.ts'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_tables = """      'CREATE TABLE IF NOT EXISTS zalo_bot_chat_history (id TEXT PRIMARY KEY, chat_id TEXT, user_id TEXT, role TEXT, text TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)',
      'CREATE TABLE IF NOT EXISTS zalo_bot_rate_limit (user_id TEXT PRIMARY KEY, count INTEGER DEFAULT 1, reset_at DATETIME)',
      'CREATE TABLE IF NOT EXISTS zalo_bot_allowed_groups (group_id TEXT PRIMARY KEY, name TEXT, is_active INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)',
      'CREATE TABLE IF NOT EXISTS bot_knowledge (id TEXT PRIMARY KEY, question TEXT, answer TEXT, tags TEXT, status TEXT DEFAULT \\'draft\\', source TEXT DEFAULT \\'admin\\', created_by TEXT, approved_by TEXT, hit_count INTEGER DEFAULT 0, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)',
      'CREATE TABLE IF NOT EXISTS bot_unanswered (id TEXT PRIMARY KEY, question_hash TEXT UNIQUE, question_text TEXT, count INTEGER DEFAULT 1, status TEXT DEFAULT \\'new\\', first_seen DATETIME DEFAULT CURRENT_TIMESTAMP, last_seen DATETIME DEFAULT CURRENT_TIMESTAMP)',
"""

if 'zalo_bot_chat_history' not in content:
    # Find the end of the const columns array
    # Look for the last element in the array, e.g., 'CREATE TABLE IF NOT EXISTS ci_kaizen_comments...'
    content = content.replace("    const columns = [", "    const columns = [\n" + new_tables)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
