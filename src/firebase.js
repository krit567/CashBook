// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAIS5kIzKmT70HSnbycm4RS8Figz8erBts",
  authDomain: "cashbook-43c48.firebaseapp.com",
  projectId: "cashbook-43c48",
  storageBucket: "cashbook-43c48.firebasestorage.app",
  messagingSenderId: "50429223026",
  appId: "1:50429223026:web:42ad8aecbc783fda8d62eb",
  measurementId: "G-B4DFN0CMV7"
};

// 3. เริ่มต้นระบบ
const app = initializeApp(firebaseConfig);

// 4. เปิดใช้งาน Authentication (ระบบ Login) และ Firestore (ฐานข้อมูล)
const auth = getAuth(app);
const db = getFirestore(app);

// 5. ส่งออกเครื่องมือไปให้ไฟล์อื่นใช้งานได้
export { auth, db };