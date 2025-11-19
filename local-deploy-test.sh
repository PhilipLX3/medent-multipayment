#!/bin/bash

# ---------------------------------------------
# Script: local-deploy-test.sh
# Purpose: Rebuild Docker images from scratch and simulate a clean deployment.
# For development purpose ONLY! — if this fails, it’s likely the deployment will fail on AWS too.
#
# To run this script:
#   Option 1: bash local-deploy-test.sh
#   Option 2:
#     chmod +x local-deploy-test.sh
#     ./local-deploy-test.sh
#
# Note:
# - Ensure you're at the project root.
# - Update IMAGE_NAME below if your Docker image name changes / not the same.
# ---------------------------------------------

IMAGE_NAME="medent-multipayment-nextjs"

echo "🧹 Cleaning up stopped containers using image: $IMAGE_NAME"
CONTAINER_IDS=$(docker ps -a -q --filter ancestor="$IMAGE_NAME")

if [ -n "$CONTAINER_IDS" ]; then
  echo "Removing containers: $CONTAINER_IDS"
  docker rm -f $CONTAINER_IDS
fi

echo "Removing image: $IMAGE_NAME (if exists)"
docker rmi -f "$IMAGE_NAME" 2>/dev/null || echo "Image not found or already removed."

echo "🔨 Rebuilding image with no cache..."
docker-compose build --no-cache

echo "Starting containers..."
docker-compose up