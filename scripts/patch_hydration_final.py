import os
import re

file_path = 'web/src/app/rooms/page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. State hooks for date
state_search = "const [searchQuery, setSearchQuery] = useState(\"\");"
state_insert = """const [searchQuery, setSearchQuery] = useState("");
  
  // Hydration-safe Date States
  const [todayVnStr, setTodayVnStr] = useState<string>("01/01/2026");
  const [todayIsoStr, setTodayIsoStr] = useState<string>("2026-01-01");
  
  useEffect(() => {
    setTodayVnStr(getTodayVnDate());
    setTodayIsoStr(getTodayIsoDate());
  }, []);
"""
if "const [todayVnStr, setTodayVnStr]" not in content:
    content = content.replace(state_search, state_insert)

# 2. Fix state initializers
content = content.replace('bookingDate: getTodayIsoDate(),', 'bookingDate: "",')
content = content.replace('visitDate: getTodayIsoDate(),', 'visitDate: "",')

# 3. Replace in render variables (only specific exact instances!)
content = content.replace('const todayStr = getTodayVnDate();', 'const todayStr = todayVnStr;')
content = content.replace('const todayVn = getTodayVnDate();', 'const todayVn = todayVnStr;')
content = content.replace('const todayIso = getTodayIsoDate();', 'const todayIso = todayIsoStr;')

# 4. Replace min attribute in inputs (using regex to only catch min={getTodayIsoDate()})
content = re.sub(r'min=\{getTodayIsoDate\(\)\}', 'min={todayIsoStr}', content)

# 5. Replace inside JSX filter
content = content.replace('b.bookingDate === getTodayVnDate()', 'b.bookingDate === todayVnStr')

# 6. Fix parseVnDate fallback
content = content.replace('return new Date();\n  };', 'return new Date(2026, 0, 1);\n  };')

# 7. Check for missing setBookingForm on mount to populate today date since it's empty now
# In useEffect for loading, we should set it if it's empty. Wait, better to leave it empty, the inputs will just show no date selected. It's actually better UX for booking form anyway. But if we need it to default to today, we can just let `todayIsoStr` be used as default value for inputs? No, if we want default, we set it in the useEffect we just added!

# Let's add it to the useEffect:
setup_effect_old = """useEffect(() => {
    setTodayVnStr(getTodayVnDate());
    setTodayIsoStr(getTodayIsoDate());
  }, []);"""
setup_effect_new = """useEffect(() => {
    const vn = getTodayVnDate();
    const iso = getTodayIsoDate();
    setTodayVnStr(vn);
    setTodayIsoStr(iso);
    
    // Set initial dates for forms after mount
    setBookingForm(prev => prev.bookingDate ? prev : { ...prev, bookingDate: iso });
    setVisitorForm(prev => prev.visitDate ? prev : { ...prev, visitDate: iso });
  }, []);"""
content = content.replace(setup_effect_old, setup_effect_new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Hydration patching complete!")
