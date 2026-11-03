export async function onRequestGet({ request, env }) {
  if (!env.VISITOR_DB) return Response.json({error:"Counter not configured"}, {status:503});
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/stash_visitor=([a-z0-9-]+)/i);
  const id = match ? match[1] : crypto.randomUUID();
  try {
    await env.VISITOR_DB.prepare("INSERT OR IGNORE INTO visitors (id, first_seen) VALUES (?, datetime('now'))").bind(id).run();
    const row = await env.VISITOR_DB.prepare("SELECT COUNT(*) AS count FROM visitors").first();
    const headers = {"Cache-Control":"no-store"};
    if (!match) headers["Set-Cookie"] = "stash_visitor=" + id + "; Max-Age=31536000; Path=/; Secure; HttpOnly; SameSite=Lax";
    return Response.json({count:row.count}, {headers});
  } catch {
    return Response.json({error:"Count unavailable"}, {status:503});
  }
}