const Bottleneck = require("bottleneck");

// Global rate limiter configuration
const limiter = new Bottleneck({
  maxConcurrent: 5, // Maximum concurrent requests
  minTime: 200, // Minimum time (ms) between requests (e.g., 5 requests per second)
});

// Timeout and retry logic using native fetch
const fetchWithRetriesAndTimeout = async (url, options = {}) => {
  // Destructure and set defaults for timeout and retries
  const { timeout = 10000, retries = 3, ...fetchOptions } = options;

  for (let attempt = 1; attempt <= retries; attempt++) {
    // Timeout logic
    const controller = new AbortController();
    const signal = controller.signal;
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { ...fetchOptions, signal });

      clearTimeout(timer); // Clear the timeout if fetch is successful

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} - ${response.statusText}`);
      }

      return response; // Return the successful response
    } catch (error) {
      clearTimeout(timer); // Clear the timeout in case of error

      // Handle timeout or other fetch errors
      if (error.name === "AbortError") {
        console.error(`Request timed out (attempt ${attempt} of ${retries})`);
      } else {
        console.error(`Request failed: ${url} ${error.message} (attempt ${attempt}/${retries})`);
      }

      // If all retries fail, throw the error
      if (attempt === retries) {
        throw new Error(`Request failed after ${retries} retries: ${error.message}`);
      }
    }
  }
};

// Wrap the fetchWithRetriesAndTimeout function with the rate limiter
const rateLimitedFetchWithRetriesAndTimeout = limiter.wrap(fetchWithRetriesAndTimeout);

module.exports = rateLimitedFetchWithRetriesAndTimeout;