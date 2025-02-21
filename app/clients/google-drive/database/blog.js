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

const blog = {
  // Generate a Redis key for a specific blog
  _key(blogID) {
    return `${PREFIX}blogs:${blogID}`;
  },

  _globalSetKey() {
    return `${PREFIX}blogs`;
  },

  // Store account information and add the blog ID to the global set
  async store(blogID, data) {
    const key = this._key(blogID);

    // if data is not an object, throw an error
    if (typeof data !== "object") {
      throw new Error("Data must be an object");
    }
    
    // Store each field of the data object in the Redis hash
    for (const [field, value] of Object.entries(data)) {
      await hsetAsync(key, field, value); // Ensure value is a string
    }

    // Add the blog ID to the global set
    await saddAsync(this._globalSetKey(), blogID);
  },

  // Retrieve account information for a blog
  async get(blogID) {
    const key = this._key(blogID);

    // Retrieve all fields from the hash
    const result = await hgetallAsync(key);

    // Redis returns null if the key does not exist
    return result || null;
  },

  // Delete account information and remove the blog ID from the global set
  async delete(blogID) {
    const key = this._key(blogID);

    // Remove the Redis hash for this blog
    await delAsync(key);

    // Remove the blog ID from the global set
    await sremAsync(this._globalSetKey(), blogID);
  },

  // List all blog IDs from the global set
  async list() {
    // Retrieve all blog IDs in the global set
    return await smembersAsync(this._globalSetKey());
  },

  // Iterate through all blogs and apply a callback
  async iterate(callback) {
    // Retrieve all blog IDs from the global set
    const blogIDs = await this.list();

    // Iterate over each blog ID and apply the callback
    for (const blogID of blogIDs) {
      const blogData = await this.get(blogID); // Fetch blog data
      if (blogData) {
        await callback(blogID, blogData); // Pass blog ID and data to the callback
      }
    }
  },
};

module.exports = blog;
