const { promisify } = require("util");

// Redis client setup
const client = require("models/client");
const hsetAsync = promisify(client.hset).bind(client);
const hgetallAsync = promisify(client.hgetall).bind(client);
const delAsync = promisify(client.del).bind(client);
const saddAsync = promisify(client.sadd).bind(client);
const sremAsync = promisify(client.srem).bind(client);
const smembersAsync = promisify(client.smembers).bind(client);

const PREFIX = require("./prefix");

// Service account operations
const serviceAccount = {
  // Generate Redis keys for service accounts
  _key(serviceAccountId) {
    return `${PREFIX}service-accounts:${serviceAccountId}`;
  },
  _globalSetKey() {
    return `${PREFIX}service-accounts`;
  },
  _blogsKey(serviceAccountId) {
    return `${PREFIX}service-accounts:${serviceAccountId}:blogs`;
  },

  async store(serviceAccountId, data) {
    const key = this._key(serviceAccountId);
    const globalSetKey = this._globalSetKey();
  
    // Store each field of the data object in the Redis hash
    for (const [field, value] of Object.entries(data)) {
      await hsetAsync(key, field, value); // Ensure value is a string
    }
  
    // Track the service account in the global set
    await saddAsync(globalSetKey, serviceAccountId);
  },
  
  async get(serviceAccountId) {
    const key = this._key(serviceAccountId);
    return await hgetallAsync(key);
  },

  async delete(serviceAccountId) {
    const key = this._key(serviceAccountId);
    const globalSetKey = this._globalSetKey();
    await delAsync(key);
    await sremAsync(globalSetKey, serviceAccountId); // Remove from global service accounts set
  },

  async list() {
    const globalSetKey = this._globalSetKey();
    return await smembersAsync(globalSetKey); // Fetch all service accounts from the set
  },

  async listBlogs(serviceAccountId) {
    const blogsKey = this._blogsKey(serviceAccountId);
    return await smembersAsync(blogsKey); // Fetch all blogs associated with the service account
  },
};

module.exports = serviceAccount;
