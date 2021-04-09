#!/bin/bash

set -e

# export COMPOSE_DOCKER_CLI_BUILD=1
# export DOCKER_BUILDKIT=1

START=$(date +%s)
./compose.sh up --build --detach

# wait for sql migrations to run successfully
MIGRATIONS_CONTAINER_NAME="${COMPOSE_PROJECT_NAME}_sql-migrations_1"
docker logs --follow --since $START $MIGRATIONS_CONTAINER_NAME
RESULT=$(docker wait $MIGRATIONS_CONTAINER_NAME)
if [ $RESULT -ne 0 ]; then
  exit $RESULT;
fi

ttsc -b tsconfig.test-e2e.json

# jest ./suites/features/domain-events.e2e-spec.ts
# jest ./suites/auth.e2e-spec.ts
jest
