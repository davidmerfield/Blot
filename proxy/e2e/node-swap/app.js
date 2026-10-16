// Stand-in for the Blot app, wired like app/index.js + app/server.js, but it
// uses the REAL app/helper/drain.js (mounted at /app/helper/drain.js; its two
// deps come from ./fake via NODE_PATH=/fake:/app). Plain node, no dependencies.
const http = require("http");
const drain = require("helper/drain");

const BOOT_DELAY_MS = parseInt(process.env.BOOT_DELAY_MS ?? "3000", 10);

// Like app/index.js: installed before setup so SIGTERM during boot exits cleanly
drain.install();

const server = http.createServer((req, res) => {
  const url = new URL(req.url, "http://x");
  // app/server.js: /health is 503 while draining
  if (url.pathname === "/health") {
    res.statusCode = drain.isDraining() ? 503 : 200;
    return res.end(drain.isDraining() ? "Draining" : "OK");
  }
  // app/server.js: tell keep-alive clients (nginx) to close once draining
  if (drain.isDraining()) res.setHeader("Connection", "close");

  let bodyBytes = 0;
  req.on("data", (chunk) => (bodyBytes += chunk.length));
  req.on("end", () => {
    // keep requests in flight so there are always some at SIGTERM
    setTimeout(() => {
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          name: process.env.NAME,
          method: req.method,
          path: url.pathname,
          bodyBytes,
        })
      );
    }, 30);
  });
});

// app/index.js: setup() (Redis, templates, ...) runs before listen
setTimeout(() => {
  drain.setServer(server);
  server.listen(8080, "0.0.0.0", () => console.log(`${process.env.NAME} listening`));
  server.keepAliveTimeout = 65000;
}, BOOT_DELAY_MS);
