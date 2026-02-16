import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBvkCHeq6hLa2byAjIb5_V-QVerO_kJxtQ",
  authDomain: "mercadinho-acai-do-rapha.firebaseapp.com",
  projectId: "mercadinho-acai-do-rapha",
  storageBucket: "mercadinho-acai-do-rapha.firebasestorage.app",
  messagingSenderId: "367279694301",
  appId: "1:367279694301:web:68313c560ca117b7f1d634"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
