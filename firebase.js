
import { initializeApp } from
  "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";

import { getAuth } from
  "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

import { getFirestore } from
  "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAyNMX_BTYwij_M5SMNI6TLnDqEYzGNy1U",
  authDomain: "careerlens-c3bae.firebaseapp.com",
  projectId: "careerlens-c3bae",
  storageBucket: "careerlens-c3bae.firebasestorage.app",
  messagingSenderId: "506728302334",
  appId: "1:506728302334:web:cda1652b5813553ff687af",
  measurementId: "G-EXRCYL0XKH"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
