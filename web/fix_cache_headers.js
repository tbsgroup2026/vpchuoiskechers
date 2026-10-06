const fs = require('fs');

const filePath = 'public/_worker.js';
let content = fs.readFileSync(filePath, 'utf-8');

const oldFunc = `function withCacheHeaders(response, isHtml = false, pathname = "") {
  if (!response) return response;
  const h = new Headers(response.headers);
  if (isHtml || pathname === "/sw.js" || pathname === "/manifest.json" || pathname.startsWith("/api/") || pathname.startsWith("/work/kaizen")) {
    h.set("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0");
    h.set("Pragma", "no-cache");
    h.set("Expires", "0");
  } else if (
    pathname.startsWith("/_next/static/") ||
    pathname === "/compiled-tailwind.css" ||
    pathname.startsWith("/images/")
  ) {
    h.set("Cache-Control", "public, max-age=31536000, immutable");
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: h,
  });
}`;

const newFunc = `function withCacheHeaders(response, isHtml = false, pathname = "") {
  if (!response) return response;
  const isBodyForbidden = response.status === 204 || response.status === 304 || response.status === 101;
  const h = new Headers(response.headers);
  if (isHtml || pathname === "/sw.js" || pathname === "/manifest.json" || pathname.startsWith("/api/") || pathname.startsWith("/work/kaizen")) {
    h.set("Cache-Control", "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0");
    h.set("Pragma", "no-cache");
    h.set("Expires", "0");
  } else if (
    pathname.startsWith("/_next/static/") ||
    pathname === "/compiled-tailwind.css" ||
    pathname.startsWith("/images/")
  ) {
    h.set("Cache-Control", "public, max-age=31536000, immutable");
  }
  try {
    return new Response(isBodyForbidden ? null : response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: h,
    });
  } catch (e) {
    return response;
  }
}`;

if (content.includes(oldFunc)) {
  content = content.replace(oldFunc, newFunc);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Successfully updated withCacheHeaders in public/_worker.js!');
} else {
  console.error('oldFunc not found in public/_worker.js');
}
