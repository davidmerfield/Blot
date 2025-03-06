
const Bottleneck = require("bottleneck");

// Create a map of limiters, one per blogID
const limiters = new Map();

/**
 * Get or create a Bottleneck limiter for a specific blogID.
 * Each blogID gets its own limiter to ensure events are processed sequentially.
 * @param {string} blogID - The blog ID for which to get the limiter.
 * @returns {Bottleneck} The Bottleneck limiter for the blogID.
 */
const getLimiterForBlogID = (blogID) => {
  if (!limiters.has(blogID)) {
    // Create a new limiter for this blogID with concurrency of 1
    const limiter = new Bottleneck({
      maxConcurrent: 1, // Only one task per blogID can run at a time
    });
    limiters.set(blogID, limiter);
  }
  return limiters.get(blogID);
};

const removeLimiterForBlogID = (blogID) => {
  limiters.delete(blogID);
};

module.exports = {
    getLimiterForBlogID,
    removeLimiterForBlogID,
};