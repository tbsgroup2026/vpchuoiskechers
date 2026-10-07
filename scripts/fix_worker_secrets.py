file_path = 'web/public/_worker.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

signOld = 'const strToSign = sortedParams + env.CLOUDINARY_API_SECRET;'
signNew = """if (!env.CLOUDINARY_API_SECRET || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_CLOUD_NAME) {
          console.error('MISSING CLOUDINARY SECRETS');
          return new Response(JSON.stringify({ success: false, error: 'Server chưa cấu hình CLOUDINARY_API_SECRET/KEY' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
        const strToSign = sortedParams + env.CLOUDINARY_API_SECRET;"""

content = content.replace(signOld, signNew)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
