const HEALTH_CHECK_TIMEOUT = 180; // 3 minutes
const HEALTH_CHECK_INTERVAL = 15; // 15 seconds
const MAX_PORT = 65535;

const sshCommand = require("./sshCommand");

module.exports = async function checkHealth(containerName, containerPort) {
  if (typeof containerName !== "string" || containerName.length === 0) {
    throw new Error("Container name must be a non-empty string.");
  }

  if (
    !Number.isInteger(containerPort) ||
    containerPort < 1 ||
    containerPort > MAX_PORT
  ) {
    throw new Error(
      `Container port must be an integer between 1 and ${MAX_PORT}.`
    );
  }

  let timedout = false;

  const timeout = new Promise((_, reject) =>
    setTimeout(() => {
      timedout = true;
      reject(
        new Error(
          `Health check timed out after ${HEALTH_CHECK_TIMEOUT}s`,
          containerName
        )
      );
    }, HEALTH_CHECK_TIMEOUT * 1000)
  );

  const healthCheck = async () => {
    while (true && !timedout) {
      const health = await sshCommand(
        `docker inspect --format='{{.State.Health.Status}}' ${containerName} || echo 'unhealthy'`
      );

      if (health === "healthy") {
        console.log(
          `Container is healthy according to docker, running second health check...`
        );

        await sshCommand(
          `curl --fail --max-time 10 http://localhost:${containerPort}/health || exit 1`
        );
        console.log(`Container is healthy and accessible.`);

        return true;
      } else if (health === "unhealthy") {
        throw new Error(`Unhealthy`, containerName);
      } else if (health === "starting") {
        console.log(`Container is starting...`);
        await new Promise((resolve) =>
          setTimeout(resolve, HEALTH_CHECK_INTERVAL * 1000)
        );
      } else {
        throw new Error(
          `Container health status is unknown: ${health}`,
          containerName
        );
      }
    }
  };

  return Promise.race([healthCheck(), timeout]);
};
