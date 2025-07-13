import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ========================================================================================
// IMPORTANT: Replace the configuration below with your own Firebase project configuration
// Follow these steps to get your configuration:
// 1. Go to https://console.firebase.google.com/ and sign in or create an account
// 2. Create a new project or select your existing project
// 3. Click "Add app" and select the web icon (</>)
// 4. Register your app with a nickname (e.g. "expense-tracker")
// 5. Copy the firebaseConfig object provided and replace the one below
// 6. Go to the Authentication section in Firebase Console and enable Email/Password sign-in
// 7. Go to the Firestore Database section and create a database in test mode
// ========================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyD4lHP1c86nMl8vozmMcUN9sE9zGFUT7js",
  authDomain: "expense-tracker-7b5a3.firebaseapp.com",
  projectId: "expense-tracker-7b5a3",
  storageBucket: "expense-tracker-7b5a3.appspot.com",
  messagingSenderId: "780907261419",
  appId: "1:780907261419:web:6080d8d1d4855760717dae"
};

// Check if default configuration is being used and warn in console
if (firebaseConfig.apiKey === "YOUR_API_KEY") {
  console.error(
    "%c⚠️ Firebase Configuration Error ⚠️",
    "color: red; font-size: 16px; font-weight: bold;"
  );
  console.error(
    "%cYou're using the default Firebase configuration values. Authentication and database features will not work until you replace them with your own Firebase project values in src/firebase/config.ts",
    "color: red; font-size: 14px;"
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app; 