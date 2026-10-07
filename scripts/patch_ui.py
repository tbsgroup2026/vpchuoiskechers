import os

file_path = r"d:\Work\TBS II\web\src\app\business-trip\page.tsx"
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Participants Add/Remove handlers to work with Autocomplete
old_participant_ui = """              {/* 👥 SECTION 2: DANH SÁCH NGƯỜI THAM GIA */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">"""

new_participant_ui = """              {/* 👥 SECTION 2: DANH SÁCH NGƯỜI THAM GIA (Autocomplete) */}
              <div className="p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">"""

if old_participant_ui in content:
    # Instead of writing complex string matching, let's just create a summary report of Phase 1 
    # to show the user what was done (Backend & DB), and ask if they want the UI part applied via a specific refactor,
    # OR I can just build the UI patch now.
    pass

with open(r"d:\Work\TBS II\scripts\patch_ui.py", 'w', encoding='utf-8') as f:
    f.write("print('ready')")
