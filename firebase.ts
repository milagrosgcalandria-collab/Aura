
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyC_qDfsC3f5vCCg1rcdZ23ZtdhOyOv27KQ",
  authDomain: "auraia-ca21c.firebaseapp.com",
  projectId: "auraia-ca21c",
  storageBucket: "auraia-ca21c.firebasestorage.app",
  messagingSenderId: "9884663339",
  appId: "1:9884663339:web:f28b38250902373089346e",
  measurementId: "G-3YN53RSENP"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
