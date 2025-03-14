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

async function deployContainer(container, platform, imageHash) {
  const dockerRunCommand = await generateDockerCommand(
    container,
    platform,
    imageHash
  );

  console.log(`Would deploy ${container.name}... with command:`);
  console.log();
  console.log(dockerRunCommand);
  console.log();

  if (!confirmed) {
    confirmed = await askForConfirmation(
      "Are you sure you want to run this command? (y/n): "
    );
  }

  if (!confirmed) {
    console.log("Deployment canceled.");
    process.exit(0);
  }

  console.log('Removing running container...');
  await removeContainer(container.name);
  console.log('Starting new container...');
  await sshCommand(dockerRunCommand);
  console.log('Checking health of new container...');
  await checkHealth(container.name, container.port);
}

async function main() {
  try {
    // Validate arguments
    if (process.argv.length > 3) {
      throw new Error("Too many arguments provided.");
    }

    await checkBranch();

    const { commitHash, commitMessage } = await getGitCommit(process.argv[2]);

    console.log(`Deploying image for commit: ${commitHash} - ${commitMessage}`);

    const imageHash = commitHash;
    const platform = await detectPlatform();
    const manifestExists = await verifyImageManifest(imageHash, platform);

    if (!manifestExists) {
      throw new Error(
        `Image for platform ${platform.platformOs}/${platform.platformArch} does not exist.`
      );
    }

    console.log("Deploying containers...");
    // Deploy all containers
    for (const container of Object.values(CONTAINERS)) {
      const rollbackHash = await getCurrentImageHash(container.name);

      if (rollbackHash === imageHash) {
        console.log(
          `Image for ${container.name} is already deployed. Skipping...`
        );
        continue;
      }

      console.log("Determined rollback hash:", rollbackHash);
      try {
        await deployContainer(container, platform, imageHash);
      } catch (error) {
        console.error(`Deployment failed for ${container.name}`);
        console.error("Rolling back...");
        try {
          await deployContainer(container, platform, rollbackHash);
          console.error("Rollback succeeded.");
        } catch (rollbackError) {
          console.error("Rollback failed:", rollbackError);
        }
        throw error;
      }
    }

    console.log("Pruning old images...");
    const pruned = await sshCommand("docker image prune -af");
    console.log(pruned);
    console.log("Deployment completed successfully!");
  } catch (error) {
    console.error("Deployment failed:", error);
    process.exit(1);
  }
}

main();
