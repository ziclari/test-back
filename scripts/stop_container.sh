#!/bin/bash

BACKEND_CONTAINER="simuladores-inn-backend"
FRONTEND_CONTAINER="simuladores-inn-frontend"

echo "===== Stopping and removing containers ====="

for CONTAINER in $BACKEND_CONTAINER $FRONTEND_CONTAINER; do
  if docker ps -aq -f name=^${CONTAINER}$ >/dev/null; then
    echo "Stopping container: $CONTAINER"
    docker stop "$CONTAINER" || true
    docker rm -f "$CONTAINER" || true
  else
    echo "Container $CONTAINER not found, skipping..."
  fi
done

echo "===== Stop completed ====="
