// This is a simple test script to check Firebase authentication
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Copy your Firebase config directly here
const firebaseConfig = {
  apiKey: "AIzaSyD4lHP1c86nMl8vozmMcUN9sE9zGFUT7js",
  authDomain: "expense-tracker-7b5a3.firebaseapp.com",
  projectId: "expense-tracker-7b5a3",
  storageBucket: "expense-tracker-7b5a3.appspot.com",
  messagingSenderId: "780907261419",
  appId: "1:780907261419:web:6080d8d1d4855760717dae"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Function to test Firebase auth
export const testFirebaseAuth = async () => {
  try {
    console.log('Testing Firebase authentication...');
    const result = await signInAnonymously(auth);
    console.log('Authentication successful:', result.user.uid);
    return {
      success: true,
      message: 'Authentication successful',
      uid: result.user.uid
    };
  } catch (error) {
    console.error('Authentication error:', error.code, error.message);
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message
      }
    };
  }
};

// Export for use in other components
export { auth }; 