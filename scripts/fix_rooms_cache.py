import os
import re

api_path = r"d:\Work\TBS II\web\src\app\api\rooms\route.ts"
with open(api_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("// export const dynamic = 'force-dynamic';", "export const dynamic = 'force-dynamic';")

# Add caching headers to GET response
old_get_response = """    return NextResponse.json({
      success: true,
      data: {
        rooms: rooms,
        bookings: bookings,
      },
      rooms: rooms,
      bookings: bookings,
    });"""

new_get_response = """    return NextResponse.json({
      success: true,
      data: {
        rooms: rooms,
        bookings: bookings,
      },
      rooms: rooms,
      bookings: bookings,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });"""

content = content.replace(old_get_response, new_get_response)

with open(api_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Fixed cache for GET /api/rooms")
