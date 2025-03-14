module.exports = ({
  reverse_proxies,
  requestsPerSecond = 1,
  maxHostsPerPurge = 10,
}) => {
  let queue = [];
  let isProcessing = false;
  let lastRequestTime = 0;
  let currentBatchResolvers = [];

  async function add(hosts) {
    return new Promise((resolve, reject) => {
      queue.push(...hosts);
      currentBatchResolvers.push({ resolve, reject });
      process();
    });
  }

  async function process() {
    if (isProcessing) return;

    isProcessing = true;

    while (queue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      const minimumGap = 1000 / requestsPerSecond;

      if (timeSinceLastRequest < minimumGap) {
        await new Promise((resolve) =>
          setTimeout(resolve, minimumGap - timeSinceLastRequest)
        );
      }

      const hostsBatch = queue.splice(0, maxHostsPerPurge);

      try {
        await flushHosts(hostsBatch);

        if (queue.length === 0) {
          // Resolve all promises when the entire queue is processed
          currentBatchResolvers.forEach(({ resolve }) => resolve());
          currentBatchResolvers = [];
        }
      } catch (error) {
        // Reject all promises if there's an error
        currentBatchResolvers.forEach(({ reject }) => reject(error));
        currentBatchResolvers = [];
        queue = [];
      }

      lastRequestTime = Date.now();
    }

    isProcessing = false;
  }

  async function flushHosts(hosts) {
    for (const reverse_proxy_url of reverse_proxies) {
      try {
        const url = `${reverse_proxy_url}/purge?${hosts
          .filter((host, index, self) => self.indexOf(host) === index)
          .map((host) => `host=${encodeURIComponent(host)}`)
          .join("&")}`;

        console.log("calling flushCache on", url);
        const res = await fetch(url);

        if (res.ok) {
          console.log(
            `proxy: ${reverse_proxy_url} flushed: ${hosts.join(",")}`
          );
        } else {
          throw new Error(
            `Failed to flush proxy ${reverse_proxy_url}: ${res.status} ${res.statusText}`
          );
        }
      } catch (error) {
        console.error(`Error flushing proxy ${reverse_proxy_url}:`, error);
        throw error;
      }
    }
  }

  return async (hosts) => {
    // if the host is a string, convert it to an array
    if (typeof hosts === "string") {
      hosts = [hosts];
    }

    // ensure the hosts are an array
    if (!Array.isArray(hosts)) {
      throw new Error("hosts must be a string or an array of strings");
    }

    // Add to queue and wait for completion
    await add(hosts);
  };
};
