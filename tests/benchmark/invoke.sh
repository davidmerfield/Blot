#!/bin/bash

echo "Running benchmark"

# Run the tests in the specified path using docker-compose
docker-compose -p blot-benchmark -f tests/benchmark/docker-compose.yml up --build --abort-on-container-exit --remove-orphans