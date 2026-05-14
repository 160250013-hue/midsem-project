#!/bin/bash
set -o errexit

# Build frontend
echo "Building frontend..."
cd frontend
npm install
npm run build
cd ..

# Go to backend
cd backend
npm install
npm run db:init || true
echo "Build complete!"
