// ☁️ Firebase Centralized Cloud Database & Real-Time Sync Engine
import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, doc, setDoc, getDoc, getDocs,
  onSnapshot, query, where, updateDoc
} from 'firebase/firestore';

// Firebase configuration — FOLK SadhnaSync (plk-sadhnasync)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDpjDerrN3vAbWOZNyg61vBW7zgQYq3Agk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "plk-sadhnasync.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "plk-sadhnasync",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "plk-sadhnasync.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID || "244943643208",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:244943643208:web:d52ffa9e6ebae97427ae7d",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-BQZX3Y0WSX"
};

let db = null;
let isCloudActive = false;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  isCloudActive = true;
  console.log("☁️ Firebase Cloud Database initialized successfully!");
} catch (err) {
  console.warn("⚠️ Running in hybrid cloud mode:", err.message);
}

// 7. Global Notifications & Broadcasts Sync
export const cloudSaveNotification = async (notification) => {
  if (isCloudActive && db) {
    try {
      await setDoc(doc(db, 'notifications', notification.id), notification);
    } catch (e) {
      console.error("Cloud Notification Save Error:", e);
    }
  }
};

export const cloudFetchNotifications = async () => {
  if (isCloudActive && db) {
    try {
      const querySnapshot = await getDocs(collection(db, 'notifications'));
      const cloudNotifs = [];
      querySnapshot.forEach((doc) => {
        cloudNotifs.push(doc.data());
      });
      if (cloudNotifs.length > 0) {
        localStorage.setItem('sadhana_notifications', JSON.stringify(cloudNotifs));
        return cloudNotifs;
      }
    } catch (e) {
      console.warn("Using cached notifications:", e);
    }
  }
  return JSON.parse(localStorage.getItem('sadhana_notifications') || '[]');
};

export { db, isCloudActive };

// --- 🌐 CLOUD DATA SYNC API FUNCTIONS ---

// 1. Central User Accounts Sync
export const cloudSaveUser = async (userObj) => {
  if (!userObj || !userObj.email) return;
  // Always update local cache
  const localUsers = JSON.parse(localStorage.getItem('sadhana_users') || '[]');
  const idx = localUsers.findIndex(u => u.email === userObj.email);
  if (idx >= 0) localUsers[idx] = userObj;
  else localUsers.push(userObj);
  localStorage.setItem('sadhana_users', JSON.stringify(localUsers));

  // Sync to Firestore Cloud DB
  if (isCloudActive && db) {
    try {
      const docRef = doc(db, 'users', userObj.email);
      await setDoc(docRef, userObj, { merge: true });
    } catch (e) {
      console.error("Cloud User Sync Error:", e);
    }
  }
};

export const cloudFetchAllUsers = async () => {
  if (isCloudActive && db) {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const cloudUsers = [];
      querySnapshot.forEach((doc) => {
        cloudUsers.push(doc.data());
      });
      if (cloudUsers.length > 0) {
        // Merge: Cloud wins for existing, but preserve local-only accounts (like Admin or offline registrations)
        const localUsers = JSON.parse(localStorage.getItem('sadhana_users') || '[]');
        const merged = [...cloudUsers];
        localUsers.forEach(lu => {
          if (!merged.find(u => u.email === lu.email)) {
            merged.push(lu);
          }
        });
        localStorage.setItem('sadhana_users', JSON.stringify(merged));
        return merged;
      }
    } catch (e) {
      console.warn("Using cached users due to cloud fetch:", e);
    }
  }
  return JSON.parse(localStorage.getItem('sadhana_users') || '[]');
};

// 2. Central Sādhana History Log Sync
export const cloudSaveSadhanaLog = async (email, logEntry) => {
  if (!email || !logEntry || !logEntry.date) return;
  
  // Update local cache
  const historyKey = `sadhana_history_${email}`;
  const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
  const idx = history.findIndex(h => h.date === logEntry.date);
  if (idx >= 0) history[idx] = logEntry;
  else history.push(logEntry);
  localStorage.setItem(historyKey, JSON.stringify(history));

  // Sync to Firestore Cloud DB
  if (isCloudActive && db) {
    try {
      const docId = `${email}_${logEntry.date}`;
      const docRef = doc(db, 'sadhana_history', docId);
      await setDoc(docRef, { ...logEntry, user_email: email }, { merge: true });
    } catch (e) {
      console.error("Cloud Sādhana Log Sync Error:", e);
    }
  }
};

export const cloudFetchSadhanaHistory = async (email) => {
  if (!email) return [];
  if (isCloudActive && db) {
    try {
      const q = query(collection(db, 'sadhana_history'), where("user_email", "==", email));
      const querySnapshot = await getDocs(q);
      const cloudHistory = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        delete data.user_email;
        cloudHistory.push(data);
      });
      if (cloudHistory.length > 0) {
        localStorage.setItem(`sadhana_history_${email}`, JSON.stringify(cloudHistory));
        return cloudHistory;
      }
    } catch (e) {
      console.warn("Using cached sadhana history:", e);
    }
  }
  return JSON.parse(localStorage.getItem(`sadhana_history_${email}`) || '[]');
};

// 3. Central Campaign Sync
export const cloudSaveCampaign = async (campaignObj) => {
  if (!campaignObj || !campaignObj.id) return;
  
  // Local cache
  const globalCamps = JSON.parse(localStorage.getItem('sadhana_campaigns') || '[]');
  const idx = globalCamps.findIndex(c => c.id === campaignObj.id);
  if (idx >= 0) globalCamps[idx] = campaignObj;
  else globalCamps.push(campaignObj);
  localStorage.setItem('sadhana_campaigns', JSON.stringify(globalCamps));

  if (campaignObj.guideEmail) {
    const key = `guide_campaigns_${campaignObj.guideEmail}`;
    const myCamps = JSON.parse(localStorage.getItem(key) || '[]');
    const gIdx = myCamps.findIndex(c => c.id === campaignObj.id);
    if (gIdx >= 0) myCamps[gIdx] = campaignObj;
    else myCamps.push(campaignObj);
    localStorage.setItem(key, JSON.stringify(myCamps));
  }

  // Cloud Sync
  if (isCloudActive && db) {
    try {
      const docRef = doc(db, 'campaigns', campaignObj.id);
      await setDoc(docRef, campaignObj, { merge: true });
    } catch (e) {
      console.error("Cloud Campaign Sync Error:", e);
    }
  }
};

export const cloudFetchCampaigns = async () => {
  if (isCloudActive && db) {
    try {
      const querySnapshot = await getDocs(collection(db, 'campaigns'));
      const cloudCamps = [];
      querySnapshot.forEach((doc) => {
        cloudCamps.push(doc.data());
      });
      if (cloudCamps.length > 0) {
        localStorage.setItem('sadhana_campaigns', JSON.stringify(cloudCamps));
        return cloudCamps;
      }
    } catch (e) {
      console.warn("Using cached campaigns:", e);
    }
  }
  return JSON.parse(localStorage.getItem('sadhana_campaigns') || '[]');
};

// 4. Real-Time Listener Hook for Live Smartphone Sync
export const subscribeToCloudUpdates = (collectionName, onUpdate) => {
  if (!isCloudActive || !db) return () => {};
  try {
    const unsubscribe = onSnapshot(collection(db, collectionName), (snapshot) => {
      const items = [];
      snapshot.forEach((doc) => items.push(doc.data()));
      onUpdate(items);
    });
    return unsubscribe;
  } catch (e) {
    console.warn(`Real-time subscription warning for ${collectionName}:`, e);
    return () => {};
  }
};
