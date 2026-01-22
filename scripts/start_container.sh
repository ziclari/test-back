#!/bin/bash

# Configuración AWS
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=851725282348

# URIs
BACKEND_ECR_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/simuladores-inn-backend:latest
FRONTEND_ECR_URI=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/simuladores-inn-frontend:latest

# Nombres de los contenedores
BACKEND_CONTAINER="simuladores-inn-backend"
FRONTEND_CONTAINER="simuladores-inn-frontend"

# Nombre de la red Docker
NETWORK_NAME="general-ebc-network"

# Login a ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Pull imágenes desde ECR
docker pull $BACKEND_ECR_URI
docker pull $FRONTEND_ECR_URI

# Iniciar contenedor de backend
docker run -d \
    --name $BACKEND_CONTAINER \
    --network $NETWORK_NAME \
    --restart unless-stopped \
    -p 3000:3000 \
    --memory "2048m" \
    --cpus "1.0" \
    --env-file .env_qa_backend \
    $BACKEND_ECR_URI

# Esperar a que el backend esté listo
sleep 5

# Verificar que el backend esté corriendo
if [ "$(docker ps -q -f name=$BACKEND_CONTAINER)" ]; then
    echo "Backend is running"
else
    echo "Backend failed to start"
    exit 1
fi

# Iniciar contenedor de frontend
docker run -d \
    --name $FRONTEND_CONTAINER \
    --network $NETWORK_NAME \
    --restart unless-stopped \
    -p 80:80 \
    --memory "1024m" \
    --cpus "0.5" \
    $FRONTEND_ECR_URI

# Esperar a que el frontend esté listo
sleep 5

# Verificar que el frontend esté corriendo
if [ "$(docker ps -q -f name=$FRONTEND_CONTAINER)" ]; then
    echo "Frontend is running"
else
    echo "Frontend failed to start"
    exit 1
fi