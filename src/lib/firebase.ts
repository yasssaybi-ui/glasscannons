import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyADyrxIe2SdN5xu32dCjMeCbO3d7-ykHQM",
    authDomain: "glasscannons-db.firebaseapp.com",
    projectId: "glasscannons-db",
    storageBucket: "glasscannons-db.firebasestorage.app",
    messagingSenderId: "208404628203",
    appId: "1:208404628203:web:bd2a1ac81dd930041bb4ae"
};

// Initialize Firebase only if it hasn't been initialized already
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export default app;
