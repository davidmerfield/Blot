// Summarises the [folder-asset] log lines app/blog/routes/assets.js writes for
// every blog-folder file it serves (to find links that still reach the origin
// instead of the CDN):
//
//   [folder-asset] blog=<id> handle=<h> served=origin|cdn-redirect
//     path=<path> referer=<host><path>|- same_site=1|0
//
// served=origin: the app sent the file itself. served=cdn-redirect: it 302'd
// a large file to the CDN. referer is the page that linked to the file
// ("-" if none); same_site=1 when that page is one of the blog's own hosts.
//
// Dependency-free: reads log text on stdin, so it runs locally on piped
// output or on the production host. One container:
//
//   ssh blot "docker logs --since 24h blot-container-blue 2>&1" \
//     | node scripts/folder-links/analyze-logs.js
//
// All three containers:
//
//   for c in blue green yellow; do
//     ssh blot "docker logs --since 24h blot-container-$c 2>&1"
//   done | node scripts/folder-links/analyze-logs.js --top 30
//
// Flags: --top N (rows per table, default 10), --json (machine-readable).
//
// Containers only keep logs back to their last deploy/restart, so --since
// can't reach further back than that.

const MARKER = "[folder-asset] ";

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch (e) {
    return value;
  }
}

function parseFields(text) {
  const fields = {};
  for (const token of text.trim().split(/\s+/)) {
    const equals = token.indexOf("=");
    if (equals > 0) fields[token.slice(0, equals)] = token.slice(equals + 1);
  }
  return fields;
}

// Returns null for any line that isn't one of ours.
function parseLine(line) {
  const index = line.indexOf(MARKER);
  if (index === -1) return null;

  const fields = parseFields(line.slice(index + MARKER.length));
  if (!fields.blog || !fields.path) return null;

  const path = safeDecode(fields.path);
  const referer =
    !fields.referer || fields.referer === "-" ? "" : safeDecode(fields.referer);
  const base = path.split(/[?#]/)[0].split("/").pop();
  const dot = base.lastIndexOf(".");

  return {
    blog: fields.blog,
    handle: fields.handle || "",
    served: fields.served || "unknown",
    path,
    referer,
    sameSite: fields.same_site === "1",
    ext: dot > 0 ? base.slice(dot).toLowerCase() : "(none)",
  };
}

function bump(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

function top(map, n) {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

function aggregate(records, topN = 10) {
  const served = new Map();
  const blogs = new Map();
  const handles = new Map();
  const paths = new Map();
  const referers = new Map();
  const exts = new Map();
  let sameSite = 0;
  let withReferer = 0;

  for (const record of records) {
    bump(served, record.served);
    handles.set(record.blog, record.handle);
    bump(blogs, record.blog);
    bump(paths, `${record.handle || record.blog}${record.path.split("?")[0]}`);
    bump(exts, record.ext);

    if (record.referer) {
      withReferer++;
      bump(referers, record.referer);
    }

    if (record.sameSite) sameSite++;
  }

  const total = records.length;

  return {
    total,
    served: Object.fromEntries(served),
    sameSite: { count: sameSite, share: total ? sameSite / total : 0 },
    withReferer: { count: withReferer, share: total ? withReferer / total : 0 },
    topBlogs: top(blogs, topN).map(([blog, n]) => ({
      blog,
      handle: handles.get(blog) || "",
      n,
    })),
    topPaths: top(paths, topN).map(([path, n]) => ({ path, n })),
    topReferers: top(referers, topN).map(([referer, n]) => ({ referer, n })),
    topExtensions: top(exts, topN).map(([ext, n]) => ({ ext, n })),
  };
}

function percent(n, total) {
  return total ? `${((100 * n) / total).toFixed(1)}%` : "0%";
}

function table(title, rows, total) {
  const lines = [`\n${title}`];
  if (!rows.length) lines.push("  (none)");
  for (const [count, label] of rows) {
    lines.push(
      `  ${String(count).padStart(8)}  ${percent(count, total).padStart(6)}  ${label}`
    );
  }
  return lines.join("\n");
}

function format(report) {
  const { total } = report;
  return (
    [
      "[folder-asset] blog-folder files served by the app",
      `  lines:        ${total}`,
      `  same_site:    ${percent(report.sameSite.count, total)} (referer is one of the blog's own hosts)`,
      `  with referer: ${percent(report.withReferer.count, total)}`,
      table(
        "By served",
        Object.entries(report.served)
          .sort((a, b) => b[1] - a[1])
          .map(([name, n]) => [n, name]),
        total
      ),
      table(
        "Top blogs",
        report.topBlogs.map((b) => [b.n, `${b.handle || "?"} (${b.blog})`]),
        total
      ),
      table(
        "Top paths",
        report.topPaths.map((p) => [p.n, p.path]),
        total
      ),
      table(
        "Top referer pages",
        report.topReferers.map((r) => [r.n, r.referer]),
        total
      ),
      table(
        "Top file extensions",
        report.topExtensions.map((e) => [e.n, e.ext]),
        total
      ),
    ].join("\n") + "\n"
  );
}

function main() {
  const args = process.argv.slice(2);
  const json = args.includes("--json");
  const topIndex = args.indexOf("--top");
  const topN = topIndex === -1 ? 10 : Number(args[topIndex + 1]) || 10;

  const readline = require("readline");
  const records = [];
  readline
    .createInterface({ input: process.stdin, crlfDelay: Infinity })
    .on("line", (line) => {
      const record = parseLine(line);
      if (record) records.push(record);
    })
    .on("close", () => {
      const report = aggregate(records, topN);
      process.stdout.write(
        json ? JSON.stringify(report, null, 2) + "\n" : format(report)
      );
    });
}

main();
