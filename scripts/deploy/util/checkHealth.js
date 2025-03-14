const HEALTH_CHECK_TIMEOUT = 90; // 90 seconds
const HEALTH_CHECK_INTERVAL = 15; // 15 seconds

const sshCommand = require("./sshCommand");

module.exports = async function checkHealth(containerName, containerPort) {
  // if the container name is not a string or is empty, throw an error
  if (typeof containerName !== "string" || containerName.length === 0) {
    throw new Error("Container name must be a non-empty string.");
  }

  // if the container port is not a number or is less than 1, throw an error
  if (typeof containerPort !== "number" || containerPort < 1) {
    throw new Error("Container port must be a number greater than 0.");
  }

  const startTime = Date.now();
  const endTime = startTime + HEALTH_CHECK_TIMEOUT * 1000;

  while (Date.now() < endTime) {
    try {
      console.log(`Checking health of ${containerName}...`);

      const health = await sshCommand(
        `docker inspect --format='{{.State.Health.Status}}' ${containerName} || echo 'unhealthy'`
      );

      if (health === "healthy") {
        console.log(
          `Container is healthy according to docker, running second health check...`
        );

        // run the second health check which runs curl on the container port
        // we ran into an issue where the docker health check which runs internally
        // was healthy but the container itself was inaccessible. This should catch
        // the case where the container is running but not actually serving traffic
        await sshCommand(
          `curl --fail http://localhost:${containerPort}/health || exit 1`
        );
        console.log(`Container is healthy and accessible.`);

        return true;
      } else if (health === "unhealthy") {
        throw new Error(`Container is unhealthy.`);
      } else {
        throw new Error(`Container health status is unknown: ${health}`);
      }
    } catch (error) {
      if (Date.now() >= endTime) {
        console.log(`Health check timed out for ${containerName}`);
        throw error;
      }
      console.log(`Container is not yet healthy (retrying): ${error.message}`);
      await new Promise((resolve) =>
        setTimeout(resolve, HEALTH_CHECK_INTERVAL * 1000)
      );
    }
  }

  throw new Error(
    `Health check timed out for ${containerName} after ${HEALTH_CHECK_TIMEOUT}s`
  );
};
