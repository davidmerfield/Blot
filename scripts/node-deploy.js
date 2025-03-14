const { execSync, exec } = require("child_process");
const { promisify } = require("util");
const readline = require("readline");
const execAsync = promisify(exec);

// Constants
const CONTAINERS = {
  BLUE: {
    name: "blot-container-blue",
    port: 8088,
    cpus: 1,
    memory: "1.5g",
    maxOldSpaceSize: 1048,
  },
  GREEN: {
    name: "blot-container-green",
    port: 8089,
    cpus: 1,
    memory: "1.5g",
    maxOldSpaceSize: 1048,
  },
  YELLOW: {
    name: "blot-container-yellow",
    port: 8090,
    cpus: 1,
    memory: "1.5g",
    maxOldSpaceSize: 1048,
  },
  PURPLE: {
    name: "blot-container-purple",
    port: 8091,
    cpus: 1,
    memory: "1.5g",
    maxOldSpaceSize: 1048,
  },
};

const HEALTH_CHECK_TIMEOUT = process.env.HEALTH_CHECK_TIMEOUT || 120;
const HEALTH_CHECK_INTERVAL = 5;

// Utility functions
function execCommand(command) {
  try {
    return execSync(command).toString().trim();
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

async function sshCommand(command) {
  try {
    // console.log(`Running SSH command: ${command}`);
    const { stdout } = await execAsync(`ssh blot "${command}"`);
    // console.log(`SSH command output: ${stdout}`);
    return stdout.trim();
  } catch (error) {
    throw new Error(`SSH command failed: ${command}\n${error.message}`);
  }
}

async function askForConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === "y");
    });
  });
}

// Main deployment functions
async function getGitCommitHash(arg) {
  if (!arg) {
    return execCommand("git rev-parse master");
  }

  if (/^[0-9a-fA-F]{40}$/.test(arg)) {
    return arg;
  }

  if (/^[0-9a-fA-F]+$/.test(arg)) {
    return execCommand(`git rev-parse "${arg}"`);
  }

  throw new Error("Invalid commit hash provided.");
}

async function checkBranch() {
  const currentBranch = execCommand("git rev-parse --abbrev-ref HEAD");
  if (currentBranch !== "master") {
    throw new Error("You must be on the master branch to deploy.");
  }
}

async function detectPlatform() {
  const platformOs = "linux";
  let platformArch = await sshCommand(
    "docker info --format '{{.Architecture}}'"
  );
  if (platformArch === "aarch64") platformArch = "arm64";
  return { platformOs, platformArch };
}

async function verifyImageManifest(commitHash, platform) {
  try {
    const manifest = await sshCommand(
      `docker manifest inspect ghcr.io/davidmerfield/blot:${commitHash} 2>/dev/null`
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
  await sshCommand(
    `docker ps -a --format '{{.Names}}' | grep -q '^${containerName}$' && ` +
      `docker rm -f ${containerName} || true`
  );
}

async function checkHealth(containerName) {
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
}

async function getCurrentImageHash(containerName) {
  try {
    return await sshCommand(
      `docker inspect --format='{{.Config.Image}}' ${containerName} 2>/dev/null | sed 's/.*://'`
    );
  } catch {
    return "";
  }
}

async function deployContainer(container, platform, commitHash, previousHash) {
  const {
    name: containerName,
    port: containerPort,
    cpus,
    memory,
    maxOldSpaceSize,
  } = container;

  // validate all the variables
  if (
    !containerName ||
    !containerPort ||
    !cpus ||
    !memory ||
    !maxOldSpaceSize
  ) {
    throw new Error(
      "Invalid container configuration passed to deployContainer."
    );
  }

  // verify that platform os and arch are in the format of linux/arm64
  if (
    !/^[a-z]+\/[a-z0-9]+$/.test(
      platform.platformOs + "/" + platform.platformArch
    )
  ) {
    throw new Error("Invalid platform string provided.");
  }

  // verify that commitHash is a 40-character hash
  if (!/^[0-9a-fA-F]{40}$/.test(commitHash)) {
    throw new Error("Invalid commit hash provided.");
  }

  // verify that previousHash is a 40-character hash
  if (previousHash && !/^[0-9a-fA-F]{40}$/.test(previousHash)) {
    throw new Error("Invalid previous hash provided.");
  }
  
  // verify that port is a 4-digit number
  if (!/^\d{4}$/.test(containerPort)) {
    throw new Error("Invalid port number provided.");
  }

  // verify that cpus is a number
  if (isNaN(cpus)) {
    throw new Error("Invalid cpus number provided.");
  }

  // verify that memory is a string in the format of 1.5g
  if (!/^\d+(\.\d+)?[mg]$/.test(memory)) {
    throw new Error("Invalid memory string provided.");
  }

  // verify that maxOldSpaceSize is a integer
  if (isNaN(maxOldSpaceSize)) {
    throw new Error("Invalid maxOldSpaceSize number provided.");
  }

  const currentHash = await getCurrentImageHash(containerName);

  if (currentHash === commitHash) {
    console.log(
      `${containerName} already running with desired hash. Skipping.`
    );
    return true;
  }

  await removeContainer(containerName);

  const dockerRunCommand = `docker run --pull=always -d \
    --name ${containerName} \
    --platform ${platform.platformOs}/${platform.platformArch} \
    -p ${containerPort}:8080 \
    --env-file /etc/blot/secrets.env \
    -e CONTAINER_NAME=${containerName} \
    -e NODE_OPTIONS='--max-old-space-size=${maxOldSpaceSize}' \
    -v /var/www/blot/data:/usr/src/app/data \
    --restart unless-stopped \
    --memory=${memory} --cpus=${cpus} \
    ghcr.io/davidmerfield/blot:${commitHash}`;

  console.log(
    `Deploying ${containerName}... with command: ${dockerRunCommand}`
  );

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
    ghcr.io/davidmerfield/blot:${previousHash}`;

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
    const commitHash = await getGitCommitHash(process.argv[2]);

    console.log(`Deploying commit: ${commitHash}`);
    console.log(
      `Commit message: ${execCommand(`git log -1 --pretty=%B ${commitHash}`)}`
    );

    const platform = await detectPlatform();
    const manifestExists = await verifyImageManifest(commitHash, platform);

    if (!manifestExists) {
      throw new Error(
        `Image for platform ${platform.platformOs}/${platform.platformArch} does not exist.`
      );
    }

    const confirmed = await askForConfirmation(
      "Are you sure you want to deploy this commit? (y/n): "
    );
    if (!confirmed) {
      console.log("Deployment canceled.");
      process.exit(0);
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
