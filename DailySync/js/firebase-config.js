// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyAOm7HkWshUOhPrYqu1qHIrjLfRrqq3bvc",
  authDomain: "dailysync-f4b76.firebaseapp.com",
  databaseURL: "https://dailysync-f4b76-default-rtdb.firebaseio.com",
  projectId: "dailysync-f4b76",
  storageBucket: "dailysync-f4b76.firebasestorage.app",
  messagingSenderId: "725112099292",
  appId: "1:725112099292:web:e8803bea04e1271b2d3f19"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase Services
const auth = firebase.auth();
const database = firebase.database();

// Auth persistence
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// Make available globally
window.auth = auth;
window.database = database;
