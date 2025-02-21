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

    // Ensure data is an object
    if (typeof data !== "object" || data === null) {
      throw new Error("Data must be a non-null object");
    }

    // Serialize each field of the data object as a JSON string
    for (const [field, value] of Object.entries(data)) {
      const serializedValue = JSON.stringify(value); // Serialize value
      await hsetAsync(key, field, serializedValue);
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
    if (!result) {
      return null;
    }

    // Deserialize each field from a JSON string back to its original value
    const deserializedResult = {};
    for (const [field, value] of Object.entries(result)) {
      try {
        deserializedResult[field] = JSON.parse(value); // Deserialize value
      } catch (e) {
        // If deserialization fails, return the raw value (fallback)
        deserializedResult[field] = value;
      }
    }

    return deserializedResult;
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
