const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'web/src/components/HeaderControls.tsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Change user state initialization
code = code.replace(/const \[user, setUser\] = useState<\s*\{[^}]+\}\s*>\(\{[\s\S]+?\}\);/m, `const [user, setUser] = useState<{
    empCode?: string;
    name: string;
    title: string;
    department: string;
    avatar: string;
    email?: string;
    phone?: string;
    roleCode?: string;
  } | null>(null);`);

// 2. Change loadUser fallback
code = code.replace(/    } else \{\s*\/\/ Fallback default: TRƯƠNG BẢO NGỌC - Lễ Tân[\s\S]+?setUser\(\{[\s\S]+?\}\);\s*\}/m, `    } else {
      setUser(null);
    }`);

// 3. Change rendering of user
const oldRender = `      {/* 3. USER MENU (AVATAR + NAME) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => toggleDropdown("user")}
          className={\`flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full transition-all duration-200 cursor-pointer select-none border shadow-2xs \${
            isDark
              ? "bg-[#0f4133] hover:bg-[#145341] border-[#2fd39a]/50 text-white"
              : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
          }\`}
          aria-expanded={activeDropdown === "user"}
          aria-haspopup="true"
          aria-label={user.name}
          title={user.name}
        >
          <UserAvatar src={user.avatar} name={user.name} size="sm" />
          <div className="hidden md:block text-left max-w-[130px] truncate">
            <div className={\`text-xs font-extrabold leading-none truncate \${
              isDark ? "text-[#f2dc9a]" : "text-slate-900"
            }\`}>
              {user.name}
            </div>
            <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
              {user.title || user.department}
            </div>
          </div>
          <IconChevronDown
            size={13}
            className={\`transition-transform duration-200 \${
              isDark ? "text-[#2fd39a]" : "text-slate-500"
            } \${activeDropdown === "user" ? "rotate-180" : ""}\`}
          />
        </button>

        {/* USER MENU DROPDOWN */}
        {activeDropdown === "user" && (
          <div`;

const newRender = `      {/* 3. USER MENU (AVATAR + NAME) */}
      <div className="relative">
        {user ? (
          <>
            <button
              type="button"
              onClick={() => toggleDropdown("user")}
              className={\`flex items-center gap-2 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full transition-all duration-200 cursor-pointer select-none border shadow-2xs \${
                isDark
                  ? "bg-[#0f4133] hover:bg-[#145341] border-[#2fd39a]/50 text-white"
                  : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
              }\`}
              aria-expanded={activeDropdown === "user"}
              aria-haspopup="true"
              aria-label={user.name}
              title={user.name}
            >
              <UserAvatar src={user.avatar} name={user.name} size="sm" />
              <div className="hidden md:block text-left max-w-[130px] truncate">
                <div className={\`text-xs font-extrabold leading-none truncate \${
                  isDark ? "text-[#f2dc9a]" : "text-slate-900"
                }\`}>
                  {user.name}
                </div>
                <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                  {user.title || user.department}
                </div>
              </div>
              <IconChevronDown
                size={13}
                className={\`transition-transform duration-200 \${
                  isDark ? "text-[#2fd39a]" : "text-slate-500"
                } \${activeDropdown === "user" ? "rotate-180" : ""}\`}
              />
            </button>

            {/* USER MENU DROPDOWN */}
            {activeDropdown === "user" && (
              <div`;

code = code.replace(oldRender, newRender);

// Also close the conditional for user
// The end of USER MENU DROPDOWN looks like this:
//            </div>
//          </div>
//        )}
//      </div>

code = code.replace(/            <\/div>\n          <\/div>\n        \)}\n      <\/div>/, `            </div>
          </div>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => router.push("/login" + (typeof window !== 'undefined' ? "?redirect=" + encodeURIComponent(window.location.pathname + window.location.search) : ""))}
            className={\`px-4 py-1.5 rounded-full text-xs font-bold transition-colors \${
              isDark
                ? "bg-[#2fd39a] text-[#062017] hover:bg-white"
                : "bg-[#006838] text-white hover:bg-emerald-700"
            }\`}
          >
            Đăng nhập
          </button>
        )}
      </div>`);

// Replace occurrences of user.name, user.avatar in error modale and profile form which might crash if user is null
code = code.replace(/<UserAvatar src=\{user\.avatar\} name=\{user\.name\} size="lg" \/>/g, `{user && <UserAvatar src={user.avatar} name={user.name} size="lg" />}`);
code = code.replace(/<UserAvatar src=\{user\.avatar\} name=\{user\.name\} size="xl" \/>/g, `{user && <UserAvatar src={user.avatar} name={user.name} size="xl" />}`);

// Also fix old password form which has `user.name`
code = code.replace(/user\.name/g, `(user?.name || '')`);
code = code.replace(/user\.avatar/g, `(user?.avatar || '')`);
code = code.replace(/user\.empCode/g, `(user?.empCode || '')`);
code = code.replace(/user\.title/g, `(user?.title || '')`);
code = code.replace(/user\.department/g, `(user?.department || '')`);
code = code.replace(/user\.email/g, `(user?.email || '')`);
code = code.replace(/user\.phone/g, `(user?.phone || '')`);

// Wait, the regex replace user.name might break `{user?.name}` if replaced again. 
// Actually, earlier we replaced it with `user?.name`, so it's fine.
// Let's just do it cleanly.

fs.writeFileSync(filePath, code);
console.log('HeaderControls patched successfully.');
