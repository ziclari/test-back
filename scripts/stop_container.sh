#!/bin/bash
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=851725282348

IMAGE_BASE="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/simuladores-innovacion-qa"

BACKEND_APP="simuladores-inn-backend"
BACKEND_TAG="backend-latest"
BACKEND_IMAGE="$IMAGE_BASE:$BACKEND_TAG"

FRONTEND_APP="simuladores-inn-frontend"
FRONTEND_TAG="frontend-latest"
FRONTEND_IMAGE="$IMAGE_BASE:$FRONTEND_TAG"

echo "Stopping backend if exists..."
if docker ps -a --format '{{.Names}}' | grep -q "^${BACKEND_APP}$"; then
  docker stop "$BACKEND_APP"
  docker rm -f "$BACKEND_APP"
else
  echo "Backend container not found"
fi

echo "Removing backend image if exists..."
if docker images "$BACKEND_IMAGE" -q | grep -q .; then
  docker rmi -f "$BACKEND_IMAGE"
else
  echo "Backend image not present locally"
fi

echo "Stopping frontend if exists..."
if docker ps -a --format '{{.Names}}' | grep -q "^${FRONTEND_APP}$"; then
  docker stop "$FRONTEND_APP"
  docker rm -f "$FRONTEND_APP"
else
  echo "Frontend container not found"
fi

echo "Removing frontend image if exists..."
if docker images "$FRONTEND_IMAGE" -q | grep -q .; then
  docker rmi -f "$FRONTEND_IMAGE"
else
  echo "Frontend image not present locally"
fi

echo "Stop phase completed"
