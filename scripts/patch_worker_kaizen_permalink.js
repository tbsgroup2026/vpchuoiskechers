const fs = require('fs');
const path = require('path');

const targetPath = path.join('d:/Work/TBS II/web/worker/index.js');
let code = fs.readFileSync(targetPath, 'utf8');

const anchor = 'if (url.pathname.startsWith("/api/")) {';
if (!code.includes('KAIZEN PERMALINK INTERCEPTOR FOR OG TAGS')) {
  const replacement = `    // KAIZEN PERMALINK INTERCEPTOR FOR OG TAGS
    if (request.method === "GET" && url.pathname.match(/^\\/work\\/kaizen\\/([A-Za-z0-9_-]+)$/)) {
      const match = url.pathname.match(/^\\/work\\/kaizen\\/([A-Za-z0-9_-]+)$/);
      const code = match[1];
      const assetsFetcher = env && (env.ASSET_BINDING || env.ASSETS);
      if (assetsFetcher) {
        try {
          // Fetch the kaizen data from DB
          let kaizen = null;
          try {
            const stmt = env.DB.prepare(\`SELECT * FROM kaizen_proposals WHERE code = ? OR id = ? LIMIT 1\`);
            kaizen = await stmt.bind(code, code).first();
          } catch(err) {
            console.error("Error fetching kaizen for OG tags:", err);
          }
          
          let indexReq = new Request(url.origin + "/index.html", request);
          let indexRes = await assetsFetcher.fetch(indexReq);
          
          if (indexRes && indexRes.status === 200) {
            if (kaizen) {
              const title = (kaizen.title || "Chi tiết Kaizen") + " - Cải tiến Kaizen";
              const desc = (kaizen.before_description || "Xem chi tiết sáng kiến cải tiến Kaizen").slice(0, 150) + "...";
              let img = kaizen.before_image_url || kaizen.after_image_url || "https://res.cloudinary.com/dwl2xtbqa/image/upload/v1727763618/vpchuoiskechers/kaizen_placeholder.jpg";
              if (img && img.startsWith("/")) img = url.origin + img;
              
              class MetaRewriter {
                element(element) {
                  const prop = element.getAttribute("property") || element.getAttribute("name");
                  if (prop === "og:title" || prop === "title") element.setAttribute("content", title);
                  if (prop === "og:description" || prop === "description") element.setAttribute("content", desc);
                  if (prop === "og:image") element.setAttribute("content", img);
                }
              }
              class TitleRewriter {
                text(text) {
                  if (!text.lastInTextNode) {
                    text.replace(title);
                  } else {
                    text.replace("");
                  }
                }
              }
              
              const rewriter = new HTMLRewriter()
                .on('meta[property="og:title"], meta[property="og:description"], meta[property="og:image"], meta[name="title"], meta[name="description"]', new MetaRewriter())
                .on('title', new TitleRewriter());
              
              let newRes = rewriter.transform(indexRes);
              return new Response(newRes.body, { headers: indexRes.headers });
            } else {
              class NotFoundRewriter {
                element(element) {
                  if (element.getAttribute("property") === "og:title") element.setAttribute("content", "Kaizen Không Tồn Tại");
                }
              }
              let newRes = new HTMLRewriter().on('meta[property="og:title"]', new NotFoundRewriter()).transform(indexRes);
              return new Response(newRes.body, { headers: indexRes.headers, status: 404 });
            }
          }
        } catch(e) {
          console.error("Kaizen permalink intercept error:", e);
        }
      }
    }

    if (url.pathname.startsWith("/api/")) {`;
  code = code.replace(anchor, replacement);
  fs.writeFileSync(targetPath, code);
  console.log("Worker updated with OG tags interceptor.");
} else {
  console.log("Worker already has the OG tags interceptor.");
}
