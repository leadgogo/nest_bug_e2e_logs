#!/bin/bash
WHICH=$([ "$CI" == "true" ] && echo 'ci' || echo 'dev')
cd $(dirname "$0")
env-cmd dotenv -- docker-compose -f docker-compose.yaml -f docker-compose.$WHICH.yaml "$@"
