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

// Helper to handle localStorage quota exceeded errors, specifically for large images in sadhana_users
export const safeSetItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Failed to save ${key} to localStorage (QuotaExceededError). Attempting compression...`, e);
    // If it's the users array, strip photos to recover session stability
    if (key === 'sadhana_users' && Array.isArray(value)) {
      try {
        const stripped = value.map(u => ({ ...u, photo: null }));
        localStorage.setItem(key, JSON.stringify(stripped));
        console.log(`Successfully saved ${key} after stripping photos.`);
      } catch (e2) {
        console.error(`Still failed to save ${key} even after stripping photos.`, e2);
      }
    } else if (value && typeof value === 'object' && value.photo) {
      try {
        const stripped = { ...value, photo: null };
        localStorage.setItem(key, JSON.stringify(stripped));
        console.log(`Successfully saved ${key} after stripping photo.`);
      } catch (e2) {
        console.error(`Still failed to save ${key} even after stripping photo.`, e2);
      }
    }
  }
};

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
        safeSetItem('sadhana_notifications', cloudNotifs);
        return cloudNotifs;
      }
    } catch (e) {
      console.warn("Using cached notifications:", e);
    }
  }
  return JSON.parse(localStorage.getItem('sadhana_notifications') || '[]');
};

// 8. Residencies Sync
export const cloudSaveResidency = async (residency) => {
  if (isCloudActive && db) {
    try {
      await setDoc(doc(db, 'residencies', residency.id), residency);
    } catch (e) {
      console.error("Cloud Residency Save Error:", e);
    }
  }
};

export const cloudFetchResidencies = async () => {
  if (isCloudActive && db) {
    try {
      const querySnapshot = await getDocs(collection(db, 'residencies'));
      const cloudRes = [];
      querySnapshot.forEach((doc) => {
        cloudRes.push(doc.data());
      });
      if (cloudRes.length > 0) {
        safeSetItem('sadhana_residencies', cloudRes);
        return cloudRes;
      }
    } catch (e) {
      console.warn("Using cached residencies:", e);
    }
  }
  return JSON.parse(localStorage.getItem('sadhana_residencies') || '[]');
};

export { db, isCloudActive };

// --- 🌐 CLOUD DATA SYNC API FUNCTIONS ---

// 1. Central User Accounts Sync
export const cloudSaveUser = async (userObj) => {
  if (!userObj || !userObj.email) return;
  // Always update local cache
  const localUsers = JSON.parse(localStorage.getItem('sadhana_users') || '[]').filter(Boolean);
  const idx = localUsers.findIndex(u => u.email === userObj.email);
  if (idx >= 0) localUsers[idx] = userObj;
  else localUsers.push(userObj);
  safeSetItem('sadhana_users', localUsers);

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
        const localUsers = JSON.parse(localStorage.getItem('sadhana_users') || '[]').filter(Boolean);
        const merged = [...cloudUsers];
        localUsers.forEach(lu => {
          if (!merged.find(u => u.email === lu.email)) {
            merged.push(lu);
          }
        });
        safeSetItem('sadhana_users', merged);
        return merged;
      }
    } catch (e) {
      console.warn("Using cached users due to cloud fetch:", e);
    }
  }
  const localUsers = JSON.parse(localStorage.getItem('sadhana_users') || '[]').filter(Boolean);
  return localUsers;
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
  safeSetItem(historyKey, history);

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
        safeSetItem(`sadhana_history_${email}`, cloudHistory);
        return cloudHistory;
      }
    } catch (e) {
      console.warn("Using cached sadhana history:", e);
    }
  }
  return JSON.parse(localStorage.getItem(`sadhana_history_${email}`) || '[]');
};

export const cloudFetchAllSadhanaHistories = async () => {
  if (isCloudActive && db) {
    try {
      const querySnapshot = await getDocs(collection(db, 'sadhana_history'));
      const groupedHistory = {};
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const email = data.user_email;
        if (!email) return;
        
        if (!groupedHistory[email]) {
          groupedHistory[email] = [];
        }
        delete data.user_email;
        groupedHistory[email].push(data);
      });
      
      const updatedEmails = Object.keys(groupedHistory);
      if (updatedEmails.length > 0) {
        updatedEmails.forEach(email => {
          safeSetItem(`sadhana_history_${email}`, groupedHistory[email]);
        });
        
        // Dispatch an event so components like GuideDashboard know data has been refreshed
        window.dispatchEvent(new Event('sadhana_history_synced'));
        return groupedHistory;
      }
    } catch (e) {
      console.error("Cloud All Histories Sync Error:", e);
    }
  }
};

// 3. Central Campaign Sync
export const cloudSaveCampaign = async (campaignObj) => {
  if (!campaignObj || !campaignObj.id) return;
  
  // Local cache
  const globalCamps = JSON.parse(localStorage.getItem('sadhana_campaigns') || '[]');
  const idx = globalCamps.findIndex(c => c.id === campaignObj.id);
  if (idx >= 0) globalCamps[idx] = campaignObj;
  else globalCamps.push(campaignObj);
  safeSetItem('sadhana_campaigns', globalCamps);

  if (campaignObj.guideEmail) {
    const key = `guide_campaigns_${campaignObj.guideEmail}`;
    const myCamps = JSON.parse(localStorage.getItem(key) || '[]');
    const gIdx = myCamps.findIndex(c => c.id === campaignObj.id);
    if (gIdx >= 0) myCamps[gIdx] = campaignObj;
    else myCamps.push(campaignObj);
    safeSetItem(key, myCamps);
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
        safeSetItem('sadhana_campaigns', cloudCamps);
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
// 9. Bucket List Sync
export const cloudSaveBucketList = async (email, goals) => {
  if (!email || !goals) return;
  const key = `sadhana_bucket_list_${email}`;
  safeSetItem(key, goals);

  if (isCloudActive && db) {
    try {
      const docRef = doc(db, 'bucket_lists', email);
      await setDoc(docRef, { email, goals });
    } catch (e) {
      console.warn("Failed to cloud save bucket list:", e);
    }
  }
};

export const cloudFetchAllBucketLists = async () => {
  if (isCloudActive && db) {
    try {
      const querySnapshot = await getDocs(collection(db, 'bucket_lists'));
      const allLists = [];
      querySnapshot.forEach((doc) => {
        allLists.push(doc.data());
      });
      if (allLists.length > 0) {
        allLists.forEach(list => {
          safeSetItem(`sadhana_bucket_list_${list.email}`, list.goals);
        });
        window.dispatchEvent(new Event('sadhana_bucket_sync'));
        return allLists;
      }
    } catch (e) {
      console.warn("Failed to fetch bucket lists:", e);
    }
  }
};

// EOF
