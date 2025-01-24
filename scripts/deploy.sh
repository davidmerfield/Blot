#!/bin/bash

# Exit immediately if any command fails
set -e

# Get the most recent full git hash of the current master branch
GIT_COMMIT_HASH=$(git rev-parse master)

# Print the commit message and commit hash
echo "Deploying commit: $GIT_COMMIT_HASH"
echo "Commit message: $(git log -1 --pretty=%B)"

# Check that a multi-architecture image is available for the commit hash
echo "Checking for multi-architecture image..."
if ! docker manifest inspect ghcr.io/davidmerfield/blot:$GIT_COMMIT_HASH > /dev/null 2>&1; then
  echo "Error: Multi-architecture image for commit $GIT_COMMIT_HASH does not exist."
  exit 1
else
  echo "Multi-architecture image found."
fi

# Define container names and ports
BLUE_CONTAINER="blot-container-blue"
GREEN_CONTAINER="blot-container-green"
BLUE_CONTAINER_PORT=8088
GREEN_CONTAINER_PORT=8089

# Define the docker run command template with placeholders
DOCKER_RUN_COMMAND="docker run --pull=always -d \
  --name {{CONTAINER_NAME}} \
  -p {{CONTAINER_PORT}}:8080 \
  --env-file /etc/blot/secrets.env \
  -v /var/www/blot/data:/usr/src/app/data \
  --restart unless-stopped \
  --memory=1g --cpus=1 \
  ghcr.io/davidmerfield/blot:$GIT_COMMIT_HASH"

# Configurable health check timeout
timeout=${HEALTH_CHECK_TIMEOUT:-30}  # Default to 30 seconds
interval=2  # Interval between health checks

# Function to run a command over SSH
ssh_blot() {
  ssh blot "$@" || { echo "SSH command failed: $@"; exit 1; }
}

# Function to remove a container if it exists
remove_container_if_exists() {
  local container_name=$1
  echo "Checking if $container_name exists..."
  ssh_blot "docker ps -a --format '{{.Names}}' | grep -q '^$container_name$' && docker rm -f $container_name || true"
}

# Function to check the health of a container
check_health() {
  local container_name=$1
  echo "Waiting for $container_name to become healthy..."
  elapsed=0

  while [[ $elapsed -lt $timeout ]]; do
    health_status=$(ssh_blot "docker inspect --format='{{.State.Health.Status}}' $container_name || echo 'unhealthy'")
    if [[ $health_status == "healthy" ]]; then
      echo "$container_name is healthy."
      return 0
    fi
    echo "Still waiting for $container_name to become healthy (elapsed: $elapsed seconds)..."
    sleep $interval
    elapsed=$((elapsed + interval))
  done

  echo "Health check failed for $container_name after $timeout seconds."
  return 1
}

# Function to replace placeholders in the docker run command
replace_placeholders() {
  local template=$1
  local container_name=$2
  local container_port=$3
  echo "$template" | sed "s/{{CONTAINER_NAME}}/$container_name/g" | sed "s/{{CONTAINER_PORT}}/$container_port/g"
}

# Function to deploy a container
deploy_container() {
  local container_name=$1
  local container_port=$2
  echo "Starting deployment for $container_name on port $container_port..."
  remove_container_if_exists $container_name

  # Replace placeholders
  local run_command=$(replace_placeholders "$DOCKER_RUN_COMMAND" "$container_name" "$container_port")

  echo "Running the following command on the server:"
  echo "$run_command"

  # Run the container via SSH
  ssh_blot "$run_command"
  check_health $container_name
}

# Deploy the blue container
deploy_container $BLUE_CONTAINER $BLUE_CONTAINER_PORT

# If blue is healthy, deploy the green container
if [[ $? -eq 0 ]]; then
  echo "$BLUE_CONTAINER is healthy. Proceeding to replace $GREEN_CONTAINER on port $GREEN_CONTAINER_PORT..."
  deploy_container $GREEN_CONTAINER $GREEN_CONTAINER_PORT

  if [[ $? -ne 0 ]]; then
    echo "Deployment failed. $GREEN_CONTAINER did not become healthy. Blue container is running."
    exit 1
  fi
else
  echo "Deployment failed. $BLUE_CONTAINER did not become healthy."
  exit 1
fi

echo "Blue-Green deployment completed successfully!"