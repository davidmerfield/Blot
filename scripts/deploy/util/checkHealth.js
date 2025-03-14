const HEALTH_CHECK_TIMEOUT = process.env.HEALTH_CHECK_TIMEOUT || 120;
const HEALTH_CHECK_INTERVAL = 5;

const sshCommand = require("./sshCommand");

module.exports = async function checkHealth(containerName) {
  const startTime = Date.now();

  while (Date.now() - startTime < HEALTH_CHECK_TIMEOUT * 1000) {
    const health = await sshCommand(
      `docker inspect --format='{{.State.Health.Status}}' ${containerName} || echo 'unhealthy'`
    );

    if (health === "healthy") return true;

    console.log(`Still waiting for ${containerName} to become healthy...`);
    await new Promise((resolve) =>
      setTimeout(resolve, HEALTH_CHECK_INTERVAL * 1000)
    );
  }

  return false;
};
