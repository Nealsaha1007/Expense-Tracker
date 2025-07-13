# Fixing Firebase Permission Error

You're experiencing the error: `services.ts:180 Error getting income: FirebaseError: Missing or insufficient permissions` because your Firebase security rules don't include permissions for the new `userIncome` collection.

## Option 1: Update Rules via Firebase Console (Easiest)

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Firestore Database** in the left sidebar
4. Click on the **Rules** tab
5. Replace your current rules with the following:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Expenses collection rules
    match /expenses/{document=**} {
      allow read: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // User income rules
    match /userIncome/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

6. Click **Publish**

## Option 2: Deploy Rules Using Firebase CLI

If you have the Firebase CLI installed:

1. Make sure you're in the project root directory:
   ```bash
   cd /Users/abhratanusaha/Developer/Project1/expense-tracker
   ```

2. Initialize Firebase (if not already done):
   ```bash
   firebase init
   ```
   - Select **Firestore** when prompted for features
   - Choose to use an existing project
   - Select your Firebase project
   - Accept the default file for Firestore Rules (`firestore.rules`)
   - For Firestore indexes, accept the default or skip

3. The `firestore.rules` file has already been created with the correct rules.

4. Deploy just the Firestore rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

## Explanation of the Rules

The new rules add permissions for the `userIncome` collection:

```
match /userIncome/{userId} {
  allow read: if request.auth != null && request.auth.uid == userId;
  allow write: if request.auth != null && request.auth.uid == userId;
}
```

This means:
- Users can only read their own income data (document ID must match their user ID)
- Users can only write to their own income document

## After Updating Rules

After updating the rules, restart your application. The income modal should now close properly after entering a value, and your income data should persist between sessions. 