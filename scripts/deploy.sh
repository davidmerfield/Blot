#!/bin/bash

# Exit immediately if any command fails
set -e

# Exit with an error if we're not on the master branch
if [[ $(git rev-parse --abbrev-ref HEAD) != "master" ]]; then
  echo "Error: You must be on the master branch to deploy."
  echo "Please switch to the master branch and try again."
  exit 1
fi

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
  -e CONTAINER_NAME={{CONTAINER_NAME}} \
  -v /var/www/blot/data:/usr/src/app/data \
  --restart unless-stopped \
  --memory=2g --cpus=1.5 \
  ghcr.io/davidmerfield/blot:$GIT_COMMIT_HASH"

# Configurable health check timeout
timeout=${HEALTH_CHECK_TIMEOUT:-60}  # Default to 60 seconds
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

# Function to get the currently running image hash for a container
get_current_image_hash() {
  local container_name=$1
  ssh_blot "docker inspect --format='{{.Config.Image}}' $container_name 2>/dev/null | sed 's/.*://'" || echo ""
}

# Function to check if the container is already running with the desired hash
is_already_deployed() {
  local container_name=$1
  local current_hash=$(get_current_image_hash $container_name)
  if [[ $current_hash == "$GIT_COMMIT_HASH" ]]; then
    echo "$container_name is already running with the desired hash ($GIT_COMMIT_HASH). Skipping deployment."
    return 0
  fi
  return 1
}

# Function to deploy a container
deploy_container() {
  local container_name=$1
  local container_port=$2
  local previous_image_hash=$3

  # Check if the container is already running with the desired hash
  if is_already_deployed $container_name; then
    return 0
  fi

  echo "Starting deployment for $container_name on port $container_port..."
  remove_container_if_exists $container_name

  # Replace placeholders
  local run_command=$(replace_placeholders "$DOCKER_RUN_COMMAND" "$container_name" "$container_port")

  echo "Running the following command on the server:"
  echo "$run_command"

  # Run the container via SSH
  if ! ssh_blot "$run_command"; then
    echo "Failed to start $container_name. Attempting rollback..."
    rollback_container $container_name $container_port $previous_image_hash
    return 1
  fi

  # Check health of the new container
  if ! check_health $container_name; then
    echo "$container_name health check failed. Attempting rollback..."
    rollback_container $container_name $container_port $previous_image_hash
    return 1
  fi

  echo "$container_name successfully deployed and healthy."
  return 0
}

# Function to rollback a container to the previous image
rollback_container() {
  local container_name=$1
  local container_port=$2
  local previous_image_hash=$3

  echo "Rolling back $container_name to previous image: $previous_image_hash..."
  remove_container_if_exists $container_name

  local rollback_command=$(echo "$DOCKER_RUN_COMMAND" | sed "s/$GIT_COMMIT_HASH/$previous_image_hash/g")
  rollback_command=$(replace_placeholders "$rollback_command" "$container_name" "$container_port")

  echo "Running rollback command on the server:"
  echo "$rollback_command"

  ssh_blot "$rollback_command"
  check_health $container_name
}

# Get the currently running image hashes for rollback purposes
blue_previous_image=$(get_current_image_hash $BLUE_CONTAINER)
green_previous_image=$(get_current_image_hash $GREEN_CONTAINER)

# Deploy the blue container
if ! deploy_container $BLUE_CONTAINER $BLUE_CONTAINER_PORT $blue_previous_image; then
  echo "Deployment failed. $BLUE_CONTAINER rollback completed. Exiting."
  exit 1
fi

# Deploy the green container
if ! deploy_container $GREEN_CONTAINER $GREEN_CONTAINER_PORT $green_previous_image; then
  echo "Deployment failed. $GREEN_CONTAINER rollback completed. Exiting."
  exit 1
fi

echo "Both blue and green containers are healthy."

# Prune the old images to save disk space 
echo "Pruning old images..."
ssh_blot "docker image prune -af"
echo "Pruned old images."

echo "Blue-Green deployment completed successfully!"