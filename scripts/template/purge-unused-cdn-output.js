// docker exec -it blot-container-green node scripts/template/purge-unused-cdn-output.js [--apply]
//
// Removes rendered {{#cdn}} output that no template manifest references any more,
// left behind now that template CDN output is served from Redis alone:
//
// 1. Collects every hash in use from the cdn field of each template:*:info hash
// 2. Walks data/cdn/template (the old disk store): purges each unused file's URL
//    from Bunny and deletes its cdn:rendered:<hash> key
// 3. Scans cdn:rendered:* and deletes unused keys with no file on disk (no file
//    name, so no URL to purge; nothing links to them)
//
// A hash is only treated as unused if it is missing from the manifests both
// before and after the scan, so a template saved mid-run keeps its new output.
// Dry run by default; pass --apply to delete and purge.
// Afterwards: rm -rf <data_directory>/cdn/template

const fs = require("fs-extra");
const path = require("path");
const config = require("config");
const client = require("models/client");
const key = require("models/template/key");
const generateCdnUrl = require("models/template/util/generateCdnUrl");
const purgeCdnUrls = require("helper/purgeCdnUrls");
const redisKeys = require("../util/redisKeys");

const APPLY = process.argv.includes("--apply");
const DISK_DIR = path.join(config.data_directory, "cdn", "template");
const HASH = /^[a-f0-9]{32}$/;

async function hashesInUse() {
  const hashes = new Set();

  await redisKeys("template:*:info", async (metadataKey) => {
    let manifest;

    try {
      manifest = JSON.parse((await client.hGet(metadataKey, "cdn")) || "{}");
    } catch (err) {
      return; // not a template metadata hash, or no valid manifest
    }

    for (const target in manifest) {
      if (typeof manifest[target] === "string") hashes.add(manifest[target]);
    }
  });

  return hashes;
}

// Files are stored at <DISK_DIR>/<hash[0:2]>/<hash[2:4]>/<hash[4:]>/<basename>
async function filesOnDisk() {
  const files = [];

  if (!(await fs.pathExists(DISK_DIR))) return files;

  for (const dir1 of await fs.readdir(DISK_DIR)) {
    for (const dir2 of await readdirSafe(path.join(DISK_DIR, dir1))) {
      for (const rest of await readdirSafe(path.join(DISK_DIR, dir1, dir2))) {
        const hash = dir1 + dir2 + rest;
        if (!HASH.test(hash)) continue;

        const dir = path.join(DISK_DIR, dir1, dir2, rest);
        for (const name of await readdirSafe(dir)) {
          const { size } = await fs.stat(path.join(dir, name));
          files.push({ hash, name, size });
        }
      }
    }
  }

  return files;
}

async function readdirSafe(dir) {
  try {
    return await fs.readdir(dir);
  } catch (err) {
    if (err.code === "ENOTDIR" || err.code === "ENOENT") return [];
    throw err;
  }
}

async function main() {
  console.log(APPLY ? "Applying" : "Dry run (pass --apply to delete and purge)");

  const before = await hashesInUse();
  console.log(`Hashes in use: ${before.size}`);

  const files = await filesOnDisk();
  const keys = [];
  await redisKeys("cdn:rendered:*", async (redisKey) => {
    keys.push(redisKey.slice("cdn:rendered:".length));
  });
  console.log(`Files on disk: ${files.length}, cdn:rendered keys: ${keys.length}`);

  const after = await hashesInUse();
  const unused = (hash) => !before.has(hash) && !after.has(hash);

  const unusedFiles = files.filter((file) => unused(file.hash));
  const fileHashes = new Set(files.map((file) => file.hash));
  const unusedKeys = keys.filter((hash) => unused(hash) && !fileHashes.has(hash));

  const urls = unusedFiles.map((file) => generateCdnUrl(file.name, file.hash));
  const bytes = unusedFiles.reduce((total, file) => total + file.size, 0);

  console.log(
    `Unused files: ${unusedFiles.length} (${(bytes / 1024 / 1024).toFixed(1)}MB), ` +
      `URLs to purge: ${urls.length}`
  );
  console.log(`Unused keys with no file: ${unusedKeys.length}`);
  urls.slice(0, 10).forEach((url) => console.log(`  ${url}`));

  if (!APPLY) return;

  const deleteHashes = new Set(unusedFiles.map((file) => file.hash).concat(unusedKeys));
  const hashes = Array.from(deleteHashes);

  for (let i = 0; i < hashes.length; i += 500) {
    await client.del(hashes.slice(i, i + 500).map((hash) => key.renderedOutput(hash)));
  }
  console.log(`Deleted ${hashes.length} cdn:rendered keys`);

  console.log(`Purging ${urls.length} URLs from Bunny...`);
  await purgeCdnUrls(urls);
  console.log(`Done. Now remove ${DISK_DIR}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
