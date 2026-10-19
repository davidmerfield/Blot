---
name: folder-links-review
description: Review which links to files in a Blot blog's folder still reach the origin (served=origin) or get redirected to the CDN (served=cdn-redirect) after the request-time folder-link rewrite was removed, from the [folder-asset] log lines app/blog/routes/assets.js writes, to decide what else needs baking at entry build time or template save time. Pulls the app container logs over ssh, aggregates them with scripts/folder-links/analyze-logs.js by blog, path and referer page, maps each finding to the next piece of work, and appends a short entry to this skill's findings log. Use when asked to review folder links, check which links still hit the origin, or re-run the folder-link log analysis.
---

# Folder-link review

## Background

Links to files in a blog's folder (`/img/a.png`) should point at versioned CDN
URLs rather than the app's origin. Blot used to rewrite them on every page
render (`app/blog/render/replaceFolderLinks`, with a disk lookup per link).
That request-time pass is gone; the work now happens earlier:

- **Entries:** at build time, by `app/build/plugins/folderAssets`: link
  attributes, and entry metadata values (og:image paths and friends).
- **Template views:** at save time, `models/template/util/resolveFolderLinks`
  wraps literal links in `{{#cdn}}`, and the template's CDN manifest
  (`util/updateCdnManifest`) resolves them to versioned folder URLs. A
  dependency index regenerates the manifest when a file changes.
- **Template and view locals** that are folder links (`"logo": "/img/a.png"`)
  are collected into the manifest and swapped at render by
  `app/blog/render/folderManifestUrl.js` (in-memory, no disk). Literal
  `{{#asset}}` sections look the manifest up first, inline `package.json`
  partials are wrapped when loaded, and `{{#folder}}` items carry a versioned
  CDN `url`.
- **Backfills:** `scripts/template/resolve-folder-links.js` (existing template
  views) and `scripts/entry/rebuild-unbaked-folder-links.js` (entries baked
  before folderAssets existed).

Whatever isn't baked keeps its plain path and is served by the origin through
`app/blog/routes/assets.js`, which logs one line per blog-folder file it
serves (pages and extensionless paths are skipped):

```
[folder-asset] blog=<id> handle=<h> served=origin|cdn-redirect path=<path> referer=<host><path>|- same_site=1|0
```

- `served=origin`: the app sent the file itself, so the link wasn't a CDN URL.
- `served=cdn-redirect`: a large file of a safe type was 302'd to the CDN. The
  link still hit the origin first, so it's worth baking, but it costs a
  redirect rather than a download.
- `referer`: the page (host and path) that linked to the file, `-` if the
  browser sent none.
- `same_site=1`: the referer is one of the blog's own hosts, which is the
  strongest sign of an unbaked link on one of the blog's pages. `0` or `-`
  covers hotlinks from other sites, direct visits, feed readers and
  crawlers, which no baking will fix.

Direct requests that are legitimate and expected (a download link the author
wants served at that URL, hotlinks) show up too, so judge by referer and path.

## 1. Check the logging is live

The `[folder-asset]` lines only exist once the PR that removed the request-time
pass is deployed. Check it's merged and deployed before reading anything into
an empty result.

**Always confirm with the user before running anything against production**,
even read-only commands, and stick to read-only commands. The SSH host is
`blot`.

```bash
ssh blot "docker ps --format '{{.Names}}\t{{.Status}}'"
```

Container logs only go back to the last deploy or restart. That uptime
bounds the window: use it as `--since`, and note it in the report. The
containers are `blot-container-blue`, `-green` and `-yellow`, and only the
live one(s) serve renders.

## 2. Collect and aggregate

Pull the logs once into the scratchpad, filtered to the marker, and analyse
locally. The script is plain Node with no dependencies and reads stdin, so it
doesn't need to run on the host. `$SCRATCH` is your scratchpad directory, or
any local temp directory.

```bash
for c in blue green yellow; do
  ssh blot "docker logs --since 24h blot-container-$c 2>&1 | grep -F '[folder-asset]'"
done > "$SCRATCH/folder-asset.log"

node scripts/folder-links/analyze-logs.js --top 20 < "$SCRATCH/folder-asset.log"
node scripts/folder-links/analyze-logs.js --json < "$SCRATCH/folder-asset.log" > "$SCRATCH/folder-asset.json"
```

The report gives totals by `served`, the `same_site` share, and the top blogs,
paths, referer pages and file extensions. Counts are of files served, not of
renders, so compare shares between runs rather than reading them absolutely.

## 3. Interpret

Group by blog, path and referer page, concentrating on `same_site=1` lines.

| Finding | What it means | Work it points to |
|---|---|---|
| Same referer page across many paths | One template or entry with unbaked links | Fetch the page (`curl -s https://<host><referer-path>`), find the link, work out which mechanism should have baked it |
| Link inside an entry body | Entry built before baking existed, or a dependency gap | Run `scripts/entry/rebuild-unbaked-folder-links.js`; if it was already run, check the dependents-key gap (case-sensitive keys, percent-encoded `poster`/`srcset` paths) |
| Link in a template view | View saved before save-time wrapping, an un-wrappable form, or a `{{=` delimiter change | Run `scripts/template/resolve-folder-links.js`; otherwise extend `resolveFolderLinks` |
| Link from a template/view local | Local that isn't a plain folder path, or a manifest miss | `folderManifestUrl.js` / the locals collection in `resolveFolderLinks` |
| Link assembled from variables (`{{blog.url}}/x.jpg`, `{{{url}}}`) | No literal link to wrap | Find the template pattern; decide whether to special-case it or leave it on the origin |
| Entry metadata (`og:image`, `thumbnail`) | Metadata not baked | `bakeMetadata` in `folderAssets` |
| SITE template (many blogs, same path) | SITE templates have no `resolvedContent` | Decide whether SITE views need save-time baking |
| Relative link with a broken page URL | Relative links resolve against the page URL | Fix at the source; list the blog explicitly |
| `served=cdn-redirect` for the same path repeatedly | Large file linked directly | Bake the link so the first request goes to the CDN |
| `same_site=0` / no referer | Hotlinks, direct visits, crawlers | Nothing to bake; ignore unless one path dominates |

To drill into one blog or page, grep the raw lines in the scratch file. It's
local, so no further prod access is needed:

```bash
grep -F 'handle=<handle> ' "$SCRATCH/folder-asset.log" | head
grep -F 'referer=<host><path> ' "$SCRATCH/folder-asset.log" | head
```

## 4. Report

In chat (blog handles, templates and paths are fine there), give:

- the window and containers;
- `served` totals and the `same_site` share;
- the top blogs, paths and referer pages for `same_site=1`, with the link
  found on each;
- file types (extensions) that dominate;
- which piece of work each finding points to, ranked by share of lines.

Then append an entry to the findings log below. Delete the scratch files when
done.

## Findings log

Read this first: earlier runs show the trend and which work has already
landed. Newest entries last.

**Privacy: this file is committed to the repo, so entries must contain no
customer information.** Leave out blog IDs, handles, domains, template IDs,
file names and paths. Describe things generically ("a handful of custom
templates link `/favicon.ico` literally"). Also leave out absolute request,
blog or line counts, because they reveal userbase scale. Use percentages
and shares only.

Entries dated before YYYY-MM-DD (fill in the date the PR removing the
request-time pass deployed) came from the removed `[folder-links]` and
`[folder-asset-origin]` instrumentation, which is why their fields
(rewrites by source, forms, pass hit) don't match the template below.

Entry template (for `[folder-asset]` lines):

```
### <date> — <window, e.g. 24h across blue/green/yellow>
- Served: origin x%, cdn-redirect y%; same_site z%
- Notable: <generic description of the biggest same_site groups>
- File types: <generic, e.g. mostly images, a little audio>
- Since last run: <what baking work landed, how the shares moved>
- Next: <the work the biggest group points to>
```

Template for entries before that date:

```
### <date> — <window, e.g. 24h across blue/green/yellow>
- Pass hit: <share of HTML/CSS renders with a [folder-links] line>
- Rewrites by source: template x%, entry y%, metadata z%, other w%
- Forms: root …, relative …, host …, static …
- Notable: <generic description of the biggest buckets and any relative cases>
- [folder-asset-origin]: <generic summary>
- Since last run: <what migration work landed, how the shares moved>
- Next: <the work the biggest bucket points to>
```

### 2026-10-19 — 7h (since last deploy) across blue/green/yellow; only yellow served renders
- Pass hit: ~98% of HTML/CSS renders logged a line, but ~74% of those rewrote nothing (lookups that all missed). Misses outnumber rewrites ~3.5:1.
- Rewrites by source: template 91%, other 6%, entry 1.4%, metadata 1.1%
- Forms: static 46%, root 43%, host 8%, relative 4%
- Notable: every line came from a blog-owned (custom or copied) template, and no SITE template appeared. Static is almost all one KaTeX `@font-face` block in a few copies of an old bundled theme's CSS view. Template root and host links are mostly favicons, logos and icons. Relative cases are a handful of templates (favicons, social icons). Most misses are links to template views or feeds (`/feed.rss`, `{{cssURL}}`-style `?cache=…&extension=` URLs) and protocol-relative `//` external scripts that get classified as `root`. One blog with a very large folder accounts for ~47% of total pass time (misses fall through to `caseSensitivePath`). ms p50 1, p90 8, p99 69.
- [folder-asset-origin]: small (well under 1% of renders), mostly entry media (audio, images under Pages) on a few blogs
- Since last run: first run. #2035 (template save-time baking) still open.
- Next: skip non-folder targets (view/feed URLs, `//`) before lookup; template save-time baking covers ~91% of rewrites; entry rebuild alone is ~1%.
