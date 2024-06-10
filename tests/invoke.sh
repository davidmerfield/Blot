#!/bin/bash

# Set the optional test path
TEST_PATH=$1

echo "Running tests in path: $TEST_PATH"

# Run the tests in the specified path using docker-compose
TEST_PATH=$TEST_PATH docker-compose  -f docker-compose-tests.yml up --build --abort-on-container-exit