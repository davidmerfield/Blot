// A stand-in for the Blot app: listens on every port the generated proxy
// config expects an upstream on (8088-8091) and echoes what it received so
// the proxy workflow can assert on routing / caching / hardening without a
// real app. Plain node, no dependencies.
const http = require("http");

const PORTS = (process.env.STUB_PORTS || "8088,8089,8090,8091")
  .split(",")
  .map((p) => parseInt(p.trim(), 10));

// 127.0.0.1 by default (every existing caller reaches this over the same
// network namespace or host loopback). proxy/deploy/e2e sets this to
// 0.0.0.0, as production Node containers (published with docker -p) are.
const BIND = process.env.STUB_BIND || "127.0.0.1";

// Requests seen per path, for proxy/e2e/diskcache-checks.js to tell whether
// the proxy asked Node again. Read with /__count?path=/some/path.
const counts = {};

// A deterministic ~3 MB body (not compressible as a type, see /large)
const LARGE = Buffer.alloc(3 * 1024 * 1024, "blot-large-body-");

const handler = (req, res) => {
  const url = new URL(req.url, "http://x");

  if (url.pathname === "/__count") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end(String(counts[url.searchParams.get("path")] || 0));
    return;
  }
  counts[url.pathname] = (counts[url.pathname] || 0) + 1;

  // --- routes for proxy/e2e/diskcache-checks.js ---
  if (url.pathname === "/etag-page") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", ETag: '"node-etag-1"' });
    res.end("<html><body>" + "an etagged page ".repeat(60) + "</body></html>");
    return;
  }
  if (url.pathname === "/redirect-301" || url.pathname === "/redirect-302") {
    // No body and no Content-Type, as Blot's redirects are
    res.writeHead(url.pathname === "/redirect-301" ? 301 : 302, { Location: "/redirect-target" });
    res.end();
    return;
  }
  if (url.pathname.startsWith("/large")) {
    // /large: Content-Length set. /large-chunked: no Content-Length.
    const headers = { "Content-Type": "application/octet-stream" };
    if (!url.pathname.startsWith("/large-chunked")) headers["Content-Length"] = LARGE.length;
    res.writeHead(200, headers);
    res.end(LARGE);
    return;
  }
  if (url.pathname.startsWith("/slow-stream")) {
    // 2 MB with Content-Length, one 100 KB chunk every 200 ms (~4 s)
    const chunk = Buffer.alloc(100 * 1024, "s");
    res.writeHead(200, { "Content-Type": "application/octet-stream", "Content-Length": chunk.length * 20 });
    let sent = 0;
    const timer = setInterval(() => {
      res.write(chunk);
      if (++sent === 20) {
        clearInterval(timer);
        res.end();
      }
    }, 200);
    res.on("close", () => clearInterval(timer));
    return;
  }
  if (url.pathname.startsWith("/echo-range")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ range: req.headers.range || null, pad: "0123456789".repeat(40) }));
    return;
  }

  if (url.pathname === "/slow") {
    setTimeout(() => res.end("slow"), 2000);
    return;
  }
  if (url.pathname === "/unavailable") {
    // What Node answers when it cannot reach Redis (helper/redisUnavailable)
    res.writeHead(503, { "Retry-After": "60", "Cache-Control": "no-store" });
    res.end("temporarily unavailable");
    return;
  }
  if (url.pathname === "/boom") {
    res.writeHead(500);
    res.end("boom");
    return;
  }
  if (url.pathname.startsWith("/notfound")) {
    // A plain Node 404 (unlike the 444/403 paths blocked by nginx itself
    // before reaching an upstream) - proxy_intercept_errors only covers
    // 500/502/504/429, so this passes straight through.
    res.writeHead(404);
    res.end("not found");
    return;
  }
  if (url.pathname.endsWith(".png")) {
    res.writeHead(200, { "Content-Type": "image/png" });
    res.end(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64"));
    return;
  }

  // Long, compressible body so gzip and caching are observable.
  const body = JSON.stringify({
    host: req.headers.host,
    served_by: res.socket.localPort,
    path: url.pathname,
    now: Date.now(),
    filler: "blot ".repeat(512),
  });
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(body);
};

for (const port of PORTS) {
  http.createServer(handler).listen(port, BIND, () => {
    console.log("stub upstream listening on " + BIND + ":" + port);
  });
}
