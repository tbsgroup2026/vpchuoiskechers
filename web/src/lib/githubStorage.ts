export async function uploadToGithub(
  base64Data: string,
  roomId: string,
  filename: string,
  githubToken?: string
): Promise<string | null> {
  // Extract base64 content
  const base64Content = base64Data.split(",")[1] || base64Data;

  const owner = "tbsgroup2026";
  const repo = "vpchuoiskechers";
  const branch = "main";
  const path = `web/public/images/rooms/${roomId}/${filename}`;

  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  const token = githubToken || (process.env as any).GITHUB_TOKEN || (globalThis as any).GITHUB_TOKEN;

  if (!token) {
    console.error("Missing GITHUB_TOKEN environment variable.");
    return null;
  }

  try {
    // 1. Check if file already exists to get its SHA (required for updating)
    let sha = undefined;
    const getRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "TBS-Group-App",
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (getRes.ok) {
      const getJson = await getRes.json();
      sha = getJson.sha;
    }

    // 2. Upload/Update file
    const body = {
      message: `Upload room image ${roomId}/${filename} via Web UI`,
      content: base64Content,
      branch: branch,
      ...(sha ? { sha } : {}),
    };

    const putRes = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "User-Agent": "TBS-Group-App",
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!putRes.ok) {
      const err = await putRes.text();
      console.error("Failed to upload to GitHub:", putRes.status, err);
      return null;
    }

    // Return the relative URL so it can be served statically
    return `/images/rooms/${roomId}/${filename}`;
  } catch (error) {
    console.error("Error uploading to GitHub:", error);
    return null;
  }
}
