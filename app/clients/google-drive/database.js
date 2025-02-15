const promisify = require("util").promisify;
const client = require("models/client");
const set = promisify(client.set).bind(client);
const get = promisify(client.get).bind(client);
const del = promisify(client.del).bind(client);
const hset = promisify(client.hset).bind(client);
const hget = promisify(client.hget).bind(client);
const hdel = promisify(client.hdel).bind(client);
const hscan = promisify(client.hscan).bind(client);
const sadd = promisify(client.sadd).bind(client);
const srem = promisify(client.srem).bind(client);
const smembers = promisify(client.smembers).bind(client);
const sscan = promisify(client.sscan).bind(client);

const keys = {
  // Used to renew webhooks for all connected Google Drives
  allAccounts: "clients:google-drive:all-accounts",

  account: function (blogID) {
    return "blog:" + blogID + ":google-drive:account";
  },

  // These are the service accounts that users share their site folders with
  serviceAccount: function (serviceAccountId) {
    return `clients:google-drive:${serviceAccountId}:service-account`;
  },

  // We need to list all accounts to refresh the storage usage for each
  // service account. They are typically allocated 15GB and it remains
  // unclear if this can be increased.
  allServiceAccounts: "clients:google-drive:all-service-accounts",

  // We need to list all channels to renew the webhook for each
  // account. The channel will expire after 7 days.
  allChannels: "clients:google-drive:all-channels",

  allChannelsForBlog: function (blogID) {
    return `clients:google-drive:${blogID}:all-channels`;
  },

  channelByFileId: function (blogID, fileId) {
    return `clients:google-drive:blog:${blogID}:file:${fileId}`;
  },

  channel: function (channelId) {
    return `clients:google-drive:channel:${channelId}`;
  }
};

const allAccounts = function (callback) {
  client.smembers(keys.allAccounts, (err, blogIDs) => {
    if (err) return callback(err);
    if (!blogIDs || !blogIDs.length) return callback(null, []);
    client.mget(blogIDs.map(keys.account), (err, accounts) => {
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
};

const getAccount = function (blogID, callback) {
  const key = keys.account(blogID);
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
      return callback(e);
    }

    callback(null, account);
  });
}

const setAccount = function (blogID, changes, callback) {
  const key = keys.account(blogID);

  getAccount(blogID, (err, account) => {
    account = account || {};

    const multi = client.multi();

    for (var i in changes) {
      account[i] = changes[i];
    }

    multi
      .sadd(keys.allAccounts, blogID)
      .set(key, JSON.stringify(account));

    multi.exec(callback);
  });
}


const dropAccount = function (blogID, callback) {
  getAccount(blogID, (err, account) => {
    const multi = client.multi();

    multi.del(keys.account(blogID)).srem(keys.allAccounts, blogID);

    if (account && account.folderId) {
      multi
        .del(folder(account.folderId).key)
        .del(folder(account.folderId).tokenKey);
    }

    multi.exec(callback);
  });
}


const serviceAccount = {
  get: async function (client_id) {
    const account = await get(keys.serviceAccount(client_id));
    if (!account) return null;
    return JSON.parse(account);
  },
  set: async function (client_id, changes) {
    const serviceAccountString = await get(keys.serviceAccount(client_id));
    const serviceAccount = serviceAccountString ? JSON.parse(serviceAccountString) : {};

    for (var i in changes) {
      serviceAccount[i] = changes[i];
    }

    await set(
      keys.serviceAccount(client_id),
      JSON.stringify(serviceAccount)
    );

    await sadd(keys.allServiceAccounts, client_id);
  },
  all: async function () {
    const client_ids = await smembers(keys.allServiceAccounts);
  
    if (!client_ids || !client_ids.length) return [];
  
    const serviceAccounts = await Promise.all(
      client_ids.map(async (id) => {
        const account = await serviceAccount.get(id);
        return { ...account, client_id: id }; // Ensure client_id is included
      })
    );
  
    return serviceAccounts;
  }
};

const channel = {
  get: async function (channelId) {
    if (typeof channelId !== "string") throw new Error("channelId must be a string");

    const channel = await get(keys.channel(channelId));
    if (!channel) return null;
    return JSON.parse(channel);
  },
  getByFileId: async function (blogID, fileId) {
    if (typeof fileId !== "string") throw new Error("fileId must be a string");

    const channelId = await get(keys.channelByFileId(blogID, fileId));

    if (!channelId) return null;

    return await channel.get(channelId);
  },
  set: async function (channelId, changes) {
    if (typeof channelId !== "string") throw new Error("channelId must be a string");
    if (typeof changes !== "object") throw new Error("changes must be an object");

    const key = keys.channel(channelId);

    const channelString = await get(key);
    const channel = channelString ? JSON.parse(channelString) : {};

    if (channel.fileId && channel.blogID && changes.fileId && channel.fileId !== changes.fileId) {
      await del(keys.channelByFileId(channel.blogID, channel.fileId));
    }

    if (channel.blogID && changes.blogID && channel.blogID !== changes.blogID) {
      await srem(keys.allChannelsForBlog(channel.blogID), key);
    }

    for (var i in changes) {
      channel[i] = changes[i];
    }

    if (channel.fileId && channel.blogID) {
      await set(keys.channelByFileId(channel.blogID, channel.fileId), channelId);
    }

    if (channel.blogID) {
      await sadd(keys.allChannelsForBlog(changes.blogID), key);
    }

    await set(key, JSON.stringify(channel));

    await sadd(keys.allChannels, key);
  },
  drop: async function (channelId) {
    if (typeof channelId !== "string") throw new Error("channelId must be a string");
    const key = keys.channel(channelId);
    const channelString = await get(key) || "{}";
    const channel = JSON.parse(channelString);

    if (channel.fileId && channel.blogID) {
      await del(keys.channelByFileId(channel.blogID, channel.fileId));
    }

    if (channel.blogID) {
      await srem(keys.allChannelsForBlog(channel.blogID), key);
    }

    await del(key);
    await srem(keys.allChannels, key);
  },
  processAll: async function (callback, batchSize = 100) {
    if (typeof callback !== "function") throw new Error("callback must be a function");

    let cursor = "0"; // Start with the initial cursor.
    do {
      // Perform an SSCAN operation to fetch a batch of channel IDs.
      const [newCursor, channelKeys] = await sscan(keys.allChannels, cursor, "COUNT", batchSize);
      cursor = newCursor;

      // For each resource ID, fetch the channel data and process it.
      for (let key of channelKeys) {
        const channelDataString = await get(key);
        const channelData = JSON.parse(channelDataString);
        await callback(channelData); // Call the callback with the channel data.
      }
    } while (cursor !== "0"); // Continue until the cursor loops back to "0" (no more data).
  }
};


function folder (folderId) {
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
};

module.exports = {
  serviceAccount: serviceAccount,
  folder: folder,
  channel: channel,
  getAccount: promisify(getAccount),
  setAccount: promisify(setAccount),
  dropAccount: promisify(dropAccount),
  allAccounts: promisify(allAccounts),
}
