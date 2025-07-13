# Troubleshooting Guide

## Firebase Authentication Issues

### Cannot Sign In or Register

If you're having trouble signing in or registering, please check the following:

1. **Firebase Configuration**:
   - Check if you've replaced the default Firebase configuration in `src/firebase/config.ts` with your own project values
   - You can test your Firebase configuration by clicking the "Firebase Configuration Test" link at the bottom of the login page

2. **Authentication Setup**:
   - Make sure you've enabled Email/Password authentication in your Firebase project:
     - Go to the Firebase Console (https://console.firebase.google.com/)
     - Select your project
     - Go to "Authentication" in the left sidebar
     - Click on the "Sign-in method" tab
     - Enable the "Email/Password" provider

3. **Database Setup**:
   - Ensure you've created a Firestore database:
     - Go to the Firebase Console
     - Select your project
     - Go to "Firestore Database" in the left sidebar
     - Click "Create database" if you haven't already
     - Choose "Start in test mode" for development

4. **Security Rules**:
   - Check your Firestore security rules:
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

5. **Console Errors**:
   - Open your browser's developer tools (F12 or right-click > Inspect)
   - Check the Console tab for any error messages
   - Look for errors related to Firebase authentication

### Common Firebase Authentication Errors

| Error | Possible Cause | Solution |
|-------|---------------|----------|
| `auth/email-already-in-use` | The email address is already in use by another account | Try logging in instead of registering, or use a different email |
| `auth/invalid-email` | The email address is not valid | Check the format of your email address |
| `auth/user-not-found` | No user corresponds to the given email | Make sure you've registered first, or check the spelling of your email |
| `auth/wrong-password` | The password is invalid | Double-check your password, or use the password reset feature |
| `auth/weak-password` | The password is too weak | Use a stronger password (at least 6 characters) |
| `auth/operation-not-allowed` | Email/Password sign-in is not enabled | Enable Email/Password authentication in the Firebase Console |
| `auth/network-request-failed` | A network error occurred | Check your internet connection |
| `auth/requires-recent-login` | This operation is sensitive and requires recent authentication | Sign out and sign in again |

## Firestore Database Issues

If you're having issues with saving or retrieving expenses:

1. **Firestore Database Existence**:
   - Make sure you've created a Firestore database in your Firebase project

2. **Security Rules**:
   - Ensure your Firestore security rules allow the necessary operations
   - For development, you can use the rules provided above

3. **Indexes**:
   - Some queries may require composite indexes
   - If you see an error about missing indexes, follow the link provided in the error message to create the required index

## Application Issues

If you're experiencing other application issues:

1. **Console Errors**:
   - Check your browser's developer console for error messages
   - Look for React errors or other JavaScript exceptions

2. **Component Rendering**:
   - If components aren't rendering correctly, check your React component hierarchy
   - Ensure that context providers are wrapping the components that use them

3. **Data Flow**:
   - Verify that data is flowing correctly through your application
   - Use console.log to debug state changes and component rendering

## Getting Further Help

If you're still having issues after trying the above solutions:

1. **Firebase Documentation**:
   - Refer to the [Firebase Authentication documentation](https://firebase.google.com/docs/auth)
   - Check the [Firestore documentation](https://firebase.google.com/docs/firestore)

2. **GitHub Issues**:
   - Check the project's GitHub issues for similar problems and solutions
   - Open a new issue if your problem is unique, providing details about the error and your environment

3. **Community Forums**:
   - Ask for help on Stack Overflow with the `firebase` and `react` tags
   - Join the [Firebase Google Group](https://groups.google.com/g/firebase-talk) for community support 