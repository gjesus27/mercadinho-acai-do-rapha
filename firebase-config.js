// Import do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// Configuração do seu projeto
const firebaseConfig = {
  apiKey: "AIzaSyAvBm2fGc5GEuBKER4AbnWX-sf8_ry5Mpw",
  authDomain: "mercadinho-mari-mar-16377.firebaseapp.com",
  projectId: "mercadinho-mari-mar-16377",
  storageBucket: "mercadinho-mari-mar-16377.firebasestorage.app",
  messagingSenderId: "181386644581",
  appId: "1:181386644581:web:3393752fcae78f12a80a8c"
};

// Inicializa Firebase
export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
