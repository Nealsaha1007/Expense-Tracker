#!/bin/bash

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
  echo "Firebase CLI is not installed. Would you like to install it? (y/n)"
  read -r answer
  if [ "$answer" = "y" ]; then
    npm install -g firebase-tools
  else
    echo "Please install Firebase CLI manually and try again."
    exit 1
  fi
fi

# Login to Firebase if not already logged in
firebase login

# Deploy Firestore rules
echo "Deploying Firestore rules..."
firebase deploy --only firestore:rules

echo "Rules deployment complete!"
echo "Your income modal should now work properly." 