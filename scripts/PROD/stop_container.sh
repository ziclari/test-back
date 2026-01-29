#!/bin/bash
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=851725282348

IMAGE_BASE="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/simuladores-innovacion-prod"


BACKEND_APP="simuladores-inn-backend"
BACKEND_TAG="backend-latest"
BACKEND_IMAGE="$IMAGE_BASE:$BACKEND_TAG"

FRONTEND_APP="simuladores-inn-frontend"
FRONTEND_TAG="frontend-latest"
FRONTEND_IMAGE="$IMAGE_BASE:$FRONTEND_TAG"

echo "Stopping backend if exists..."
docker stop "$BACKEND_APP"
docker rm -f "$BACKEND_APP"

echo "Removing backend image if exists..."
docker rmi -f "$BACKEND_IMAGE"


echo "Stopping frontend if exists..."
docker stop "$FRONTEND_APP"
docker rm -f "$FRONTEND_APP"

echo "Removing frontend image if exists..."
docker rmi -f "$FRONTEND_IMAGE"

echo "Stop phase completed"
