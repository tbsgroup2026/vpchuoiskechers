#!/usr/bin/env bash
# ==============================================================================
# TBS Work Board Hub - CI Guard: Chặn Fallback Quyền Cố Định (202608001 / SUPER_ADMIN)
# ==============================================================================
set -euo pipefail

echo "==> [CI Guard] Đang quét kiểm tra fallback xác thực cố định trong API routes..."

EXIT_CODE=0

# 1. Kiểm tra pattern fallback session thành SUPER_ADMIN khi thiếu token
if grep -rnE "session\s*=\s*\{[^\}]*roleCode\s*:\s*['\"]SUPER_ADMIN['\"][^\}]*empCode\s*:\s*['\"]202608001['\"]" web/src/app/api; then
  echo "❌ LỖI: Phát hiện pattern fallback gán SUPER_ADMIN ngầm trong web/src/app/api!"
  EXIT_CODE=1
fi

# 2. Kiểm tra header spoofing fallback x-user-emp-code
if grep -rnE "x-user-emp-code.*202608001" web/src/app/api --exclude-dir=__tests__; then
  echo "❌ LỖI: Phát hiện pattern fallback theo header x-user-emp-code trong web/src/app/api!"
  EXIT_CODE=1
fi

# 3. Kiểm tra fallback || '202608001' khi thiếu session
if grep -rnE "session\??\.empCode\s*\|\|\s*['\"]202608001['\"]" web/src/app/api --exclude-dir=__tests__; then
  echo "❌ LỖI: Phát hiện fallback session?.empCode || '202608001' trong web/src/app/api!"
  EXIT_CODE=1
fi

if [ $EXIT_CODE -eq 0 ]; then
  echo "✅ [CI Guard PASSED] Không phát hiện bất kỳ fallback xác thực ngầm nào trong API routes."
else
  echo "🚫 [CI Guard FAILED] Vui lòng loại bỏ các mẫu fallback trên trước khi deploy."
  exit 1
fi
