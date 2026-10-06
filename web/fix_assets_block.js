const fs = require('fs');

const filePath = 'public/_worker.js';
let content = fs.readFileSync(filePath, 'utf-8');

const oldAssetsBlock = `    // Default Fallback: Serve Next.js Static Export Assets with HTML extension resolution
    if (env && env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) {
        return withCacheHeaders(assetResponse, assetResponse.headers.get("content-type")?.includes("text/html") || !url.pathname.includes("."), url.pathname);
      }

      if (request.method === "GET" && !url.pathname.includes(".")) {
        const cleanPath = (url.pathname.endsWith("/") && url.pathname.length > 1) ? url.pathname.slice(0, -1) : url.pathname;
        const fallbackPaths = [
          \`\${cleanPath}.html\`,
          \`\${cleanPath}/index.html\`,
        ];

        if (cleanPath.startsWith("/work/kaizen")) {
          fallbackPaths.push("/work/kaizen.html", "/work/kaizen/index.html");
        }
        if (cleanPath.startsWith("/work/gemba")) {
          fallbackPaths.push("/work/gemba.html", "/work/gemba/index.html");
        }
        if (cleanPath.startsWith("/work/ci") || cleanPath.startsWith("/work/cn-ci")) {
          fallbackPaths.push("/work/cn-ci.html", "/work.html");
        }
        if (cleanPath.startsWith("/work")) {
          fallbackPaths.push("/work.html", "/work/index.html");
        }
        if (cleanPath.startsWith("/finance")) {
          fallbackPaths.push("/finance.html", "/finance/index.html");
        }
        if (cleanPath.startsWith("/maintenance")) {
          fallbackPaths.push("/maintenance.html", "/maintenance/index.html");
        }
        fallbackPaths.push("/login.html", "/index.html");

        for (const fPath of fallbackPaths) {
          try {
            const fUrl = new URL(request.url);
            fUrl.pathname = fPath;
            fUrl.search = "";
            const fRes = await env.ASSETS.fetch(new Request(fUrl.toString(), request));
            if (fRes.status === 200) {
              return withCacheHeaders(fRes, true, url.pathname);
            }
          } catch (e) {}
        }
      }

      return withCacheHeaders(assetResponse, false, url.pathname);
    }`;

const newAssetsBlock = `    // Default Fallback: Serve Next.js Static Export Assets with HTML extension resolution
    if (env && env.ASSETS) {
      try {
        let assetResponse = await env.ASSETS.fetch(request).catch(() => null);
        if (assetResponse && assetResponse.status !== 404) {
          return withCacheHeaders(assetResponse, assetResponse.headers.get("content-type")?.includes("text/html") || !url.pathname.includes("."), url.pathname);
        }

        if (request.method === "GET" && !url.pathname.includes(".")) {
          const cleanPath = (url.pathname.endsWith("/") && url.pathname.length > 1) ? url.pathname.slice(0, -1) : url.pathname;
          const fallbackPaths = [
            \`\${cleanPath}.html\`,
            \`\${cleanPath}/index.html\`,
          ];

          if (cleanPath.startsWith("/work/kaizen")) {
            fallbackPaths.push("/work/kaizen.html", "/work/kaizen/index.html");
          }
          if (cleanPath.startsWith("/work/gemba")) {
            fallbackPaths.push("/work/gemba.html", "/work/gemba/index.html");
          }
          if (cleanPath.startsWith("/work/ci") || cleanPath.startsWith("/work/cn-ci")) {
            fallbackPaths.push("/work/cn-ci.html", "/work.html");
          }
          if (cleanPath.startsWith("/work")) {
            fallbackPaths.push("/work.html", "/work/index.html");
          }
          if (cleanPath.startsWith("/finance")) {
            fallbackPaths.push("/finance.html", "/finance/index.html");
          }
          if (cleanPath.startsWith("/maintenance")) {
            fallbackPaths.push("/maintenance.html", "/maintenance/index.html");
          }
          fallbackPaths.push("/login.html", "/index.html");

          for (const fPath of fallbackPaths) {
            try {
              const fUrl = new URL(request.url);
              fUrl.pathname = fPath;
              fUrl.search = "";
              const fRes = await env.ASSETS.fetch(fUrl.toString()).catch(() => null);
              if (fRes && fRes.status === 200) {
                return withCacheHeaders(fRes, true, url.pathname);
              }
            } catch (e) {}
          }
        }

        if (assetResponse) {
          return withCacheHeaders(assetResponse, false, url.pathname);
        }
      } catch (assetErr) {
        console.error("[Assets Error]", assetErr);
      }
    }`;

if (content.includes(oldAssetsBlock)) {
  content = content.replace(oldAssetsBlock, newAssetsBlock);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Successfully updated ASSETS block in public/_worker.js!');
} else {
  console.error('oldAssetsBlock not found in public/_worker.js');
}
