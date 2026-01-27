#!/bin/bash
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=851725282348

IMAGE_BASE="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/simuladores-innovacion-qa"
NETWORK_NAME="general-ebc-network"

BACKEND_APP="simuladores-inn-backend"
BACKEND_IMAGE="$IMAGE_BASE:backend-latest"

FRONTEND_APP="simuladores-inn-frontend"
FRONTEND_IMAGE="$IMAGE_BASE:frontend-latest"

echo "Login to ECR"
aws ecr get-login-password --region $AWS_REGION docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

echo "Pull backend image"
docker pull "$BACKEND_IMAGE"

echo "Run backend"
docker run -d \
  --name "$BACKEND_APP" \
  --network "$NETWORK_NAME" \
  --restart unless-stopped \
  -p 3000:3000 \
  --memory 2048m \
  --cpus 1.0 \
  --env-file .env_qa_backend \
  "$BACKEND_IMAGE"

sleep 5

echo "Pull frontend image"
docker pull "$FRONTEND_IMAGE"

echo "Run frontend"
docker run -d \
  --name "$FRONTEND_APP" \
  --network "$NETWORK_NAME" \
  --restart unless-stopped \
  -p 80:80 \
  --memory 1024m \
  --cpus 0.5 \
  "$FRONTEND_IMAGE"

sleep 5

echo "Application started successfully"
