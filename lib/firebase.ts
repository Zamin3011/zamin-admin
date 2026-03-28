import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAokXbquOviYZAYxQU5_qssNvR61eSS9Jo",
  authDomain: "zaminvoice-fc412.firebaseapp.com",
  projectId: "zaminvoice-fc412",
  storageBucket: "zaminvoice-fc412.firebasestorage.app",
  messagingSenderId: "925224255556",
  appId: "1:925224255556:web:c909cc9c35a77a0ae6fc11"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);