#!/bin/bash
# Docker build and deployment script with vulnerabilities

# Issue: No error handling - script continues on failures
# Should use: set -e, set -o pipefail

# Issue: Hardcoded values instead of configuration
IMAGE_NAME="vulnerable-nodejs-app"
IMAGE_TAG="latest"
CONTAINER_NAME="app-container"
PORT="3000"
NODE_ENV="development"

# Issue: Credentials hardcoded in script
DB_USER="admin"
DB_PASSWORD="admin123"
DB_HOST="localhost"
API_KEY="sk_test_key_12345"

echo "Building Docker image: $IMAGE_NAME:$IMAGE_TAG"

# Issue: No image tagging for versioning
# Creates 'latest' tag which overwrites previous builds
docker build -t $IMAGE_NAME:$IMAGE_TAG .

# Issue: No checking if build succeeded
# Script continues even if build failed

echo "Image built successfully"

# Issue: Removing containers without checking if it exists
# This will fail but script continues
docker rm -f $CONTAINER_NAME 2>/dev/null || true

echo "Running container..."

# Issue: Exposing credentials as environment variables
# These are visible in docker inspect, logs, etc.
docker run -d \
  --name $CONTAINER_NAME \
  -p $PORT:3000 \
  -e NODE_ENV=$NODE_ENV \
  -e DB_USER=$DB_USER \
  -e DB_PASSWORD=$DB_PASSWORD \
  -e DB_HOST=$DB_HOST \
  -e API_KEY=$API_KEY \
  $IMAGE_NAME:$IMAGE_TAG

# Issue: No verification that container started
sleep 2

echo "Container started"

# Issue: No output of container logs
# No information if container crashed

docker logs $CONTAINER_NAME | head -20

echo "Access application at http://localhost:$PORT"

# Issues in this script:
# - No error handling or validation
# - Hardcoded credentials
# - No version management
# - No cleanup on failure
# - Input validation missing
# - No logging to file
# - No security considerations
# - Environment variables exposed
# - No health checks
# - No resource limits specified
# - Comments expose security issues
