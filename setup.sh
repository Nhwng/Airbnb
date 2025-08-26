#!/bin/bash

# Set environment variable for Vite URL
export VITE_URL="http://54.196.197.172:4000/"

# Start the frontend (Vite) in the client directory
cd client && npm run dev &

# Start the backend in the api directory
cd ../api && npm start
