const client = require("client");
const promisify = require("util").promisify;
const set = promisify(client.set).bind(client);
const get = promisify(client.get).bind(client);
const del = promisify(client.del).bind(client);
const hset = promisify(client.hset).bind(client);
const hgetall = promisify(client.hgetall).bind(client);
const hget = promisify(client.hget).bind(client);
const hdel = promisify(client.hdel).bind(client);
const hscan = promisify(client.hscan).bind(client);

const INVALID_ACCOUNT_STRING =
  "Google Drive client: Error decoding JSON for account of blog ";

const database = {
  keys: {
    allAccounts: function () {
      return "clients:google-drive:all-accounts";
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

  setAccount: function (blogID, changes, callback) {
    const key = this.keys.account(blogID);

    this.getAccount(blogID, (err, account) => {
      account = account || {};

      for (var i in changes) {
        account[i] = changes[i];
      }

      client
        .multi()
        .sadd(this.keys.allAccounts, blogID)
        .set(key, JSON.stringify(account))
        .exec(callback);
    });
  },

  dropAccount: function (blogID, callback) {    
    client
      .multi()
      .del(this.keys.account(blogID))
      .srem(this.keys.allAccounts, blogID)
      .exec(callback);
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

    this.move = async (id, to) => {
      const START_CURSOR = "0";
      const from = await this.get(id);

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
            return { id: el, path: modifiedPath };
          })
          .filter((i) => !!i);

        for (const { id, path } of changes) await this.set(id, path);

        [cursor, results] = await hscan(this.key, cursor);
      } while (cursor !== START_CURSOR);
    };

    this.remove = async (id) => {
      const START_CURSOR = "0";
      const from = await this.get(id);

      if (from === "/") return await del(this.key);

      let [cursor, results] = await hscan(this.key, START_CURSOR);

      do {
        const ids = results
          .map((el, i) => {
            if (i % 2 !== 0) return null;
            const path = results[i + 1];
            if (path !== from && path.indexOf(from + "/") !== 0) return null;
            return el;
          })
          .filter((i) => !!i);

        await hdel(this.key, ids);

        [cursor, results] = await hscan(this.key, cursor);
      } while (cursor !== START_CURSOR);
    };

    this.all = async () => {
      const res = await hgetall(this.key);
      const paths = Object.keys(res)
        .map((key) => res[key])
        .sort();
      return paths;
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
