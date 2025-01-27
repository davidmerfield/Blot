#!/bin/bash

# Set the optional test path
TEST_PATH=$1

# Set the optional test seed
TEST_SEED=$2

echo "Running tests in path: $TEST_PATH with seed $TEST_SEED"

# Run the tests in the specified path using docker-compose
TEST_PATH=$TEST_PATH TEST_SEED=$TEST_SEED docker-compose  -f tests/docker-compose.yml up --build --abort-on-container-exit --remove-orphans