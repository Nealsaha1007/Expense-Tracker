# Expense Tracker

A full-featured expense tracking application built with React, TypeScript, and Firebase.

## Features

- User authentication (register, login, logout)
- Add, edit, and delete expenses
- Categorize expenses
- Filter and sort expenses
- Currency selection
- Dashboard with charts and statistics
- Firebase integration for backend and database

## Setup

### Prerequisites

- Node.js and npm installed
- A Firebase account

### Installation

1. Clone the repository
2. Install dependencies

```bash
cd expense-tracker
npm install
```

3. Set up Firebase:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project
   - Add a web app to your project
   - Enable Authentication (Email/Password sign-in method)
   - Create a Firestore database
   - Set up Firestore rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /expenses/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
    }
  }
}
```

4. Update Firebase configuration:
   - Copy the Firebase configuration from your Firebase project settings
   - Update the `firebaseConfig` object in `src/firebase/config.ts` with your configuration values

```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

5. Start the application:

```bash
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Database Structure

### Firestore Collections

- **expenses**: Stores all expense data
  - Fields:
    - id: string (auto-generated)
    - description: string
    - amount: number
    - category: string
    - date: string (ISO format)
    - currency: string
    - userId: string (reference to user)

## Deployment

To deploy the application:

1. Build the project:

```bash
npm run build
```

2. Deploy to Firebase Hosting:

```bash
npm install -g firebase-tools
firebase login
firebase init
firebase deploy
```

## License

MIT
