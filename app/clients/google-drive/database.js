const client = require("models/client");
const promisify = require("util").promisify;
const set = promisify(client.set).bind(client);
const get = promisify(client.get).bind(client);
const del = promisify(client.del).bind(client);
const hset = promisify(client.hset).bind(client);
const hget = promisify(client.hget).bind(client);
const hdel = promisify(client.hdel).bind(client);
const hscan = promisify(client.hscan).bind(client);

const INVALID_ACCOUNT_STRING =
  "Google Drive client: Error decoding JSON for account of blog ";

const database = {
  keys: {
    // Used to renew webhooks for all connected Google Drives
    allAccounts: "clients:google-drive:all-accounts",

    // Used to determine if another blog is connected to a
    // given Google Drive account during the disconnection process
    allBlogs: function (permissionId) {
      return "clients:google-drive:" + permissionId + ":blogs";
    },

    account: function (blogID) {
      return "blog:" + blogID + ":google-drive:account";
    },
  },

  allAccounts: function (callback) {
    client.smembers(this.keys.allAccounts, (err, blogIDs) => {
      if (err) return callback(err);
      if (!blogIDs || !blogIDs.length) return callback(null, []);
      client.mget(blogIDs.map(this.keys.account), (err, accounts) => {
        if (err) return callback(err);
        if (!accounts || !accounts.length) return callback(null, []);
        accounts = accounts
          .map((serializedAccount, index) => {
            if (!serializedAccount) return null;
            try {
              const account = JSON.parse(serializedAccount);
              account.blogID = blogIDs[index];
              return account;
            } catch (e) {}
            return null;
          })
          .filter((account) => !!account);

        callback(null, accounts);
      });
    });
  },

  getAccount: function (blogID, callback) {
    const key = this.keys.account(blogID);
    client.get(key, (err, account) => {
      if (err) {
        return callback(err);
      }

      if (!account) {
        return callback(null, null);
      }

      try {
        account = JSON.parse(account);
      } catch (e) {
        return callback(new Error(INVALID_ACCOUNT_STRING + blogID));
      }

      callback(null, account);
    });
  },

  // During account disconnection from Google Drive
  // on Blot's folder settings page we need to determine
  // whether or not to revoke the credentials, which
  // unfortunately has global effects and would tank
  // other blogs also connected to this Google Drive account.
  canRevoke: function (permissionId, callback) {
    let canRevokeCredentials;

    if (!permissionId) {
      canRevokeCredentials = true;
      return callback(null, canRevokeCredentials);
    }

    client.smembers(this.keys.allBlogs(permissionId), (err, blogs) => {
      canRevokeCredentials = !blogs || blogs.length < 2;
      callback(null, canRevokeCredentials);
    });
  },

  setAccount: function (blogID, changes, callback) {
    const key = this.keys.account(blogID);

    this.getAccount(blogID, (err, account) => {
      account = account || {};

      const multi = client.multi();

      if (changes.permissionId)
        multi.sadd(this.keys.allBlogs(changes.permissionId), blogID);

      // Clean up if the permissionId for a blog changes
      if (
        changes.permissionId &&
        account.permissionId &&
        changes.permissionId !== account.permissionId
      ) {
        multi.srem(this.keys.allBlogs(account.permissionId), blogID);
      }

      for (var i in changes) {
        account[i] = changes[i];
      }

      multi
        .sadd(this.keys.allAccounts, blogID)
        .set(key, JSON.stringify(account));

      multi.exec(callback);
    });
  },

  dropAccount: function (blogID, callback) {
    this.getAccount(blogID, (err, account) => {
      const multi = client.multi();

      multi.del(this.keys.account(blogID)).srem(this.keys.allAccounts, blogID);

      if (account && account.permissionId) {
        multi.srem(this.keys.allBlogs(account.permissionId), blogID);
      }

      if (account && account.folderId) {
        multi
          .del(this.folder(account.folderId).key)
          .del(this.folder(account.folderId).tokenKey);
      }

      multi.exec(callback);
    });
  },

  folder: function (folderId) {
    this.key = `clients:google-drive:${folderId}:folder`;
    this.tokenKey = `clients:google-drive:${folderId}:pageToken`;

    this.set = async (id, path) => {
      await hset(this.key, id, path);
    };

    this.get = async (id) => {
      if (id === undefined || id === null) return null;
      return await hget(this.key, id);
    };

    this.getByPath = async (path) => {
      const START_CURSOR = "0";
      let cursor = START_CURSOR;
      let fileId, results;

      const match = (el, index) =>
        index % 2 === 0 && results[index + 1] === path;

      do {
        [cursor, results] = await hscan(this.key, cursor);
        fileId = results.find(match);
      } while (!fileId && cursor !== START_CURSOR);

      return fileId || null;
    };

    this.move = async (id, to) => {
      const START_CURSOR = "0";
      const from = await this.get(id);

      let movedPaths = [];

      if (from === "/" || to === "/")
        throw new Error("Attempt to move to/from root");

      let [cursor, results] = await hscan(this.key, START_CURSOR);

      do {
        const changes = results
          .map((el, i) => {
            if (i % 2 !== 0) return null;
            const path = results[i + 1];
            const modifiedPath =
              path === from || path.indexOf(from + "/") === 0
                ? to + path.slice(from.length)
                : path;
            if (path === modifiedPath) return null;
            movedPaths.push(path);
            movedPaths.push(modifiedPath);
            return { id: el, path: modifiedPath };
          })
          .filter((i) => !!i);

        for (const { id, path } of changes) await this.set(id, path);

        [cursor, results] = await hscan(this.key, cursor);
      } while (cursor !== START_CURSOR);

      return movedPaths;
    };

    this.remove = async (id) => {
      const START_CURSOR = "0";
      const from = await this.get(id);

      if (from === null || from === undefined) return [];

      let removedPaths = [];

      let [cursor, results] = await hscan(this.key, START_CURSOR);

      do {
        const ids = results
          .map((el, i) => {
            if (i % 2 !== 0) return null;

            const path = results[i + 1];

            if (path === from) {
              removedPaths.push(path);
              return el;
            }

            if (from === "/") {
              removedPaths.push(path);
              return el;
            }

            if (path.indexOf(from + "/") === 0) {
              removedPaths.push(path);
              return el;
            }

            return null;
          })
          .filter((i) => i !== null);

        await hdel(this.key, ids);

        [cursor, results] = await hscan(this.key, cursor);
      } while (cursor !== START_CURSOR);

      return removedPaths;
    };

    this.reset = async () => {
      await del(this.key);
      await del(this.tokenKey);
    };

    this.setPageToken = async (token) => {
      await set(this.tokenKey, token);
    };

    this.getPageToken = async () => {
      return await get(this.tokenKey);
    };

    return this;
  },
};

for (const property in database) {
  if (property === "keys") continue;

  if (property === "folder") {
    module.exports.folder = database.folder;
    continue;
  }

  module.exports[property] = promisify(database[property]).bind(database);
}
