// Utility functions
const sshCommand = require("./util/sshCommand");
const askForConfirmation = require("./util/askForConfirmation");
const checkBranch = require("./util/checkBranch");
const getGitCommit = require("./util/getGitCommit");
const checkHealth = require("./util/checkHealth");
const generateDockerCommand = require("./util/generateDockerCommand");

const constants = require("./constants");

const { CONTAINERS } = constants;
const { REGISTRY_URL, PLATFORM_OS } = constants;

let confirmed = false;

async function detectPlatform() {
  console.log("Detecting server platform...");
  const platformOs = PLATFORM_OS;
  let platformArch = await sshCommand(
    "docker info --format '{{.Architecture}}'"
  );
  if (platformArch === "aarch64") platformArch = "arm64";
  return { platformOs, platformArch };
}

async function verifyImageManifest(commitHash, platform) {
  try {
    console.log("Checking that an image exists...");
    const manifest = await sshCommand(
      `docker manifest inspect ${REGISTRY_URL}:${commitHash} 2>/dev/null`
    );
    const manifestData = JSON.parse(manifest);
    return manifestData.manifests.some(
      (m) =>
        m.platform.architecture === platform.platformArch &&
        m.platform.os === platform.platformOs
    );
  } catch {
    return false;
  }
}

async function removeContainer(containerName) {
  console.log(`Removing container ${containerName}...`);
  await sshCommand(
    `docker ps -a --format '{{.Names}}' | grep -q '^${containerName}$' && ` +
      `docker rm -f ${containerName} || true`
  );
}

async function getCurrentImageHash(containerName) {
  try {
    console.log(`Getting current image hash for ${containerName}...`);
    return await sshCommand(
      `docker inspect --format='{{.Config.Image}}' ${containerName} 2>/dev/null | sed 's/.*://'`
    );
  } catch {
    return "";
  }
}

async function deployContainer(container, platform, commitHash, previousHash) {
  const { name: containerName, port: containerPort } = container;

  if (previousHash && !/^[0-9a-fA-F]{40}$/.test(previousHash)) {
    throw new Error("Invalid previous hash provided.");
  }

  const currentHash = await getCurrentImageHash(containerName);

  if (currentHash === commitHash) {
    console.log(
      `${containerName} already running with desired hash. Skipping.`
    );
    return true;
  }

  const dockerRunCommand = await generateDockerCommand(
    container,
    platform,
    commitHash
  );

  console.log(
    `Would deploy ${containerName}... with command: ${dockerRunCommand}`
  );

  if (!confirmed) {
    confirmed = await askForConfirmation(
      "Are you sure you want to run this command? (y/n): "
    );
  }

  if (!confirmed) {
    console.log("Deployment canceled.");
    process.exit(0);
  }

  await removeContainer(containerName);

  try {
    await sshCommand(dockerRunCommand);
    if (await checkHealth(containerName)) {
      return true;
    }
    await rollbackContainer(
      containerName,
      containerPort,
      previousHash,
      platform
    );
    return false;
  } catch (error) {
    console.error(`Deployment failed for ${containerName}:`, error);
    await rollbackContainer(
      containerName,
      containerPort,
      previousHash,
      platform
    );
    return false;
  }
}

async function rollbackContainer(
  containerName,
  containerPort,
  previousHash,
  platform
) {
  if (!previousHash) return false;

  console.log(`Rolling back ${containerName} to ${previousHash}...`);
  await removeContainer(containerName);

  const rollbackCommand = `docker run --pull=always -d \
    --name ${containerName} \
    --platform ${platform.platformOs}/${platform.platformArch} \
    -p ${containerPort}:8080 \
    --env-file /etc/blot/secrets.env \
    -e CONTAINER_NAME=${containerName} \
    -e NODE_OPTIONS='--max-old-space-size=1048' \
    -v /var/www/blot/data:/usr/src/app/data \
    --restart unless-stopped \
    --memory=1.5g --cpus=1 \
    ${REGISTRY_URL}:${previousHash}`;

  await sshCommand(rollbackCommand);
  return await checkHealth(containerName);
}

async function main() {
  try {
    // Validate arguments
    if (process.argv.length > 3) {
      throw new Error("Too many arguments provided.");
    }

    await checkBranch();

    const { commitHash, commitMessage } = await getGitCommit(process.argv[2]);

    console.log(`Deploying commit: ${commitHash} - ${commitMessage}`);

    const platform = await detectPlatform();
    const manifestExists = await verifyImageManifest(commitHash, platform);

    if (!manifestExists) {
      throw new Error(
        `Image for platform ${platform.platformOs}/${platform.platformArch} does not exist.`
      );
    }

    const rollbackHash = await getCurrentImageHash(CONTAINERS.GREEN.name);

    console.log("Using rollback hash:", rollbackHash);
    console.log("Deploying containers...");

    // Deploy all containers
    for (const container of Object.values(CONTAINERS)) {
      if (
        !(await deployContainer(container, platform, commitHash, rollbackHash))
      ) {
        throw new Error(`Deployment failed for ${container.name}`);
      }
    }

    console.log("Pruning old images...");
    const pruned = await sshCommand("docker image prune -af");
    console.log(pruned);
    console.log("Blue-Green-Yellow-Purple deployment completed successfully!");
  } catch (error) {
    console.error("Deployment failed:", error.message);
    process.exit(1);
  }
}

main();
