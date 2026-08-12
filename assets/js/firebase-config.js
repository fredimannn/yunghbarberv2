import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCb9VlOFAOrwhWgeCp-W46zhXZa4zYhKTA",
    authDomain: "yunghbarber.firebaseapp.com",
    projectId: "yunghbarber",
    storageBucket: "yunghbarber.firebasestorage.app",
    messagingSenderId: "584988565649",
    appId: "1:584988565649:web:d626399346525585f45f30",
    measurementId: "G-62QSLK3PX0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);