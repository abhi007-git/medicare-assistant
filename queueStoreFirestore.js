import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc, collection, onSnapshot,
  orderBy, serverTimestamp, runTransaction, updateDoc, deleteDoc, query
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// TODO: Replace with your Firebase project credentials
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
};

let app = null;
let db = null;

export function initFirebase(config = firebaseConfig) {
  if (!app) {
    app = initializeApp(config);
    db = getFirestore(app);
  }
  return db;
}

export async function enqueuePatient(name, symptoms, emergency = false) {
  initFirebase();
  const countersRef = doc(db, "meta", "counters");
  const patientsCol = collection(db, "patients");

  return runTransaction(db, async (tx) => {
    const countersSnap = await tx.get(countersRef);
    const counters = countersSnap.exists() ? countersSnap.data() : { emergency: 1, normal: 1 };

    const tokenNumber = emergency ? counters.emergency : counters.normal;
    const tokenPrefix = emergency ? "E" : "A";
    const token = `${tokenPrefix}-${String(tokenNumber).padStart(2, "0")}`;

    const nextCounters = {
      emergency: emergency ? tokenNumber + 1 : counters.emergency,
      normal: emergency ? counters.normal : tokenNumber + 1,
    };

    tx.set(countersRef, nextCounters);

    const patientRef = doc(patientsCol);
    tx.set(patientRef, {
      token,
      name,
      symptoms,
      emergency,
      status: "waiting",
      timestamp: serverTimestamp(),
      consultingTimestamp: null,
    });

    return { patientId: patientRef.id, token };
  });
}

export async function startConsultation(patientId) {
  initFirebase();
  const ref = doc(db, "patients", patientId);
  await updateDoc(ref, {
    status: "consulting",
    consultingTimestamp: serverTimestamp(),
  });
}

export async function markComplete(patientId) {
  initFirebase();
  const ref = doc(db, "patients", patientId);
  await deleteDoc(ref);
}

export function subscribeQueue(callback) {
  initFirebase();
  const patientsCol = collection(db, "patients");
  const q = query(patientsCol, orderBy("emergency", "desc"), orderBy("timestamp", "asc"));

  return onSnapshot(q, (snap) => {
    const rows = [];
    snap.forEach((d) => rows.push([d.id, d.data()]));
    callback(rows);
  });
}

export function getCurrentServing(queue = []) {
  return queue.find(([, p]) => p.status === "consulting") || null;
}
