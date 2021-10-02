const client = require("client");
const colors = require("colors/safe");

const key = (folderId) => `gdrive:${folderId}:id->path`;

const set = (folderId, id, path) => {
  return new Promise((resolve, reject) => {
    console.log(colors.dim("Storing path `", path, "` against id `", id, "`"));
    client.hset(key(folderId), id, path, (err) =>
      err ? reject(err) : resolve()
    );
  });
};

const print = (folderId) => {
  return new Promise(async (resolve, reject) => {
    client.hgetall(key(folderId), (err, res) => {
      if (err) return reject(err);
      if (!res) return resolve();

      const paths = Object.keys(res)
        .map((key) => res[key])
        .sort();

      console.log();
      console.log("Folder contents:");
      console.log(
        paths
          .filter((path) => path !== "/")
          .map((path) => (path[0] === "/" ? "- " + path.slice(1) : path))
          .map((path, i, arr) => {
            const previousPath = arr[i - 1];
            if (!previousPath) return path;
            const previousPathDirs = previousPath.split("/");
            return path
              .split("/")
              .map((dir, i) => {
                if (previousPathDirs[i] === dir) return colors.dim(dir);
                return dir;
              })
              .join(colors.dim("/"));
          })
          .join("\n")
      );
      console.log();
      resolve();
    });
  });
};

const del = (folderId, id) => {
  return new Promise(async (resolve, reject) => {
    const START_CURSOR = "0";
    const from = await get(folderId, id);

    console.log(colors.dim("Deleting id `", id, "`"));

    if (from === "/") {
      return client.del(key(folderId), (err) =>
        err ? reject(err) : resolve()
      );
    }

    const then = async (err, [cursor, results]) => {
      if (err) return reject(err);
      const ids = results
        .map((el, i) => {
          if (i % 2 !== 0) return null;
          const path = results[i + 1];
          if (path !== from && path.indexOf(from + "/") !== 0) return null;
          return el;
        })
        .filter((i) => !!i);

      client.hdel(key(folderId), ids, (err) => {
        if (err) return reject(err);
        if (START_CURSOR === cursor) return resolve();
        client.hscan(key(folderId), cursor, then);
      });
    };
    client.hscan(key(folderId), START_CURSOR, then);
  });
};

const move = (folderId, id, to) => {
  return new Promise(async (resolve, reject) => {
    const START_CURSOR = "0";
    const from = await get(folderId, id);

    console.log(colors.dim("Deleting id `", id, "` to `", to, "`"));

    if (from === "/" || to === "/")
      return reject(new Error("Attempt to move to/from root"));

    const then = async (err, [cursor, results]) => {
      if (err) return reject(err);
      const changes = results
        .map((el, i) => {
          if (i % 2 !== 0) return null;
          const path = results[i + 1];
          const modifiedPath =
            path === from || path.indexOf(from + "/") === 0
              ? to + path.slice(from.length)
              : path;
          if (path === modifiedPath) return null;
          return { id: el, path: modifiedPath };
        })
        .filter((i) => !!i);

      for (const { id, path } of changes) await set(folderId, id, path);

      if (START_CURSOR === cursor) {
        resolve();
      } else {
        client.hscan(key(folderId), cursor, then);
      }
    };

    client.hscan(key(folderId), START_CURSOR, then);
  });
};

const get = (folderId, id) => {
  return new Promise((resolve, reject) => {
    if (id === undefined || id === null) return resolve(null);
    client.hget(key(folderId), id, (err, path) =>
      err ? reject(err) : resolve(path || null)
    );
  });
};

const setPageToken = (folderId, token) => {
  return new Promise((resolve, reject) => {
    console.log(colors.dim("Storing page token"), token);
    client.set(
      "gdrive:" + folderId + ":changes:pageToken",
      token,
      async (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
};

const getPageToken = (folderId, drive) => {
  return new Promise((resolve, reject) => {
    client.get(
      "gdrive:" + folderId + ":changes:pageToken",
      async (err, pageToken) => {
        if (err) return reject(err);

        if (pageToken) {
          console.log(colors.dim("Got page token from DB"), pageToken);
          return resolve(pageToken);
        }

        const { data } = await drive.changes.getStartPageToken({
          // Whether the user is acknowledging the risk of downloading known malware or other abusive files.
          // The ID for the file in question.
          supportsAllDrives: true,
          includeDeleted: true,
          includeCorpusRemovals: true,
          includeItemsFromAllDrives: true,
        });

        console.log(colors.dim("Got page token from API"), data.startPageToken);
        return resolve(data.startPageToken);
      }
    );
  });
};

module.exports = {
  get,
  set,
  del,
  move,
  print,
  getPageToken,
  setPageToken,
};
