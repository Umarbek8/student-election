import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  increment,
} from "firebase/firestore";

// ---------------------------------------------------------------------------
// 1. Paste your own Firebase project config below (Project settings > General
//    > Your apps > SDK setup and configuration in the Firebase console).
//    Using Vite env vars keeps real keys out of source control -- create a
//    .env.local file with the VITE_FIREBASE_* values shown in the README.
// ---------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const LOCAL_STORAGE_PREFIX = "student-leadership-election";
const LOCAL_SYNC_EVENT = "student-leadership-election:sync";

function hasRequiredFirebaseConfig() {
  return Object.values(firebaseConfig).every((value) => value && String(value).trim() !== "");
}

function getLocalStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch (error) {
    console.warn("Local storage unavailable; continuing without persistence.", error);
    return null;
  }
}

function readLocalStorage(key, fallbackValue) {
  const storage = getLocalStorage();
  if (!storage) return fallbackValue;

  try {
    const raw = storage.getItem(key);
    if (!raw) return fallbackValue;
    const parsed = JSON.parse(raw);
    return parsed ?? fallbackValue;
  } catch (error) {
    console.warn(`Failed to read local storage key ${key}.`, error);
    return fallbackValue;
  }
}

function writeLocalStorage(key, value) {
  const storage = getLocalStorage();
  if (!storage) return false;

  try {
    storage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn(`Failed to write local storage key ${key}.`, error);
    return false;
  }
}

function notifyLocalStorageSync() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(LOCAL_SYNC_EVENT));
  }
}

function createLocalTimestamp() {
  const date = new Date();
  return {
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: (date.getTime() % 1000) * 1_000_000,
    toDate: () => new Date(date),
  };
}

function getLocalVotes() {
  return readLocalStorage(`${LOCAL_STORAGE_PREFIX}:votes`, []);
}

function getLocalVoteCounts() {
  return readLocalStorage(`${LOCAL_STORAGE_PREFIX}:voteCounts`, {});
}

function recountLocalVoteCounts(votes) {
  const nextCounts = {};
  for (const vote of votes) {
    if (!vote?.candidateId) continue;
    nextCounts[vote.candidateId] = (nextCounts[vote.candidateId] || 0) + 1;
  }
  return nextCounts;
}

function getLocalElectionStatus() {
  return readLocalStorage(`${LOCAL_STORAGE_PREFIX}:electionStatus`, true);
}

function subscribeLocalVoteCounts(onChange) {
  const emit = () => {
    onChange(getLocalVoteCounts());
  };

  emit();

  if (typeof window === "undefined") {
    return () => {};
  }

  const handleLocalUpdate = () => emit();
  window.addEventListener(LOCAL_SYNC_EVENT, handleLocalUpdate);
  window.addEventListener("storage", handleLocalUpdate);

  return () => {
    window.removeEventListener(LOCAL_SYNC_EVENT, handleLocalUpdate);
    window.removeEventListener("storage", handleLocalUpdate);
  };
}

function subscribeLocalAuditLog(onChange, rowLimit = 200) {
  const emit = () => {
    const entries = [...getLocalVotes()].sort((a, b) => {
      const aTime = a.timestamp?.seconds ?? 0;
      const bTime = b.timestamp?.seconds ?? 0;
      return bTime - aTime;
    });
    onChange(entries.slice(0, rowLimit));
  };

  emit();

  if (typeof window === "undefined") {
    return () => {};
  }

  const handleLocalUpdate = () => emit();
  window.addEventListener(LOCAL_SYNC_EVENT, handleLocalUpdate);
  window.addEventListener("storage", handleLocalUpdate);

  return () => {
    window.removeEventListener(LOCAL_SYNC_EVENT, handleLocalUpdate);
    window.removeEventListener("storage", handleLocalUpdate);
  };
}

function subscribeLocalElectionStatus(onChange) {
  const emit = () => {
    onChange(getLocalElectionStatus());
  };

  emit();

  if (typeof window === "undefined") {
    return () => {};
  }

  const handleLocalUpdate = () => emit();
  window.addEventListener(LOCAL_SYNC_EVENT, handleLocalUpdate);
  window.addEventListener("storage", handleLocalUpdate);

  return () => {
    window.removeEventListener(LOCAL_SYNC_EVENT, handleLocalUpdate);
    window.removeEventListener("storage", handleLocalUpdate);
  };
}

let app = null;
export let db = null;
let firebaseReady = false;

if (hasRequiredFirebaseConfig()) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    firebaseReady = true;
  } catch (error) {
    console.warn("Firebase initialization failed. Falling back to LocalStorage.", error);
    firebaseReady = false;
  }
} else {
  console.warn("Firebase environment variables are missing. Falling back to LocalStorage.");
}

const VOTES_COLLECTION = "votes";
const META_DOC = firebaseReady && db ? doc(db, "meta", "voteCounts") : null;
const ELECTION_STATUS_DOC = firebaseReady && db ? doc(db, "meta", "electionStatus") : null;

function localHasAlreadyVoted(fullName, grade) {
  const normalizedName = fullName.trim().toLowerCase();
  return getLocalVotes().some(
    (vote) =>
      vote.studentName?.trim().toLowerCase() === normalizedName &&
      String(vote.grade) === String(grade)
  );
}

/**
 * Checks whether a student (matched by full name + grade) has already voted.
 * This is a soft client-side guard only -- since these are shared devices,
 * it stops accidental double taps for the same student, not deliberate
 * ballot stuffing. For real integrity, pair this with Firestore security
 * rules and, ideally, a per-student login.
 */
export async function hasAlreadyVoted(fullName, grade) {
  if (!firebaseReady || !db) {
    return localHasAlreadyVoted(fullName, grade);
  }

  try {
    const q = query(
      collection(db, VOTES_COLLECTION),
      where("studentName", "==", fullName.trim()),
      where("grade", "==", grade),
      limit(1)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.warn("Firestore lookup failed; using LocalStorage fallback.", error);
    return localHasAlreadyVoted(fullName, grade);
  }
}

/**
 * Records a single vote: writes an audit-log entry with the student's name,
 * grade, chosen candidate, and a server timestamp, then increments that
 * candidate's running total in meta/voteCounts.
 */
export async function castVote({ studentName, grade, candidateId, candidateName }) {
  const normalizedVote = {
    studentName: studentName.trim(),
    grade,
    candidateId,
    candidateName,
    timestamp: createLocalTimestamp(),
  };

  if (!firebaseReady || !db || !META_DOC) {
    const votes = getLocalVotes();
    const nextVote = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, ...normalizedVote };
    votes.push(nextVote);
    writeLocalStorage(`${LOCAL_STORAGE_PREFIX}:votes`, votes);

    const counts = recountLocalVoteCounts(votes);
    writeLocalStorage(`${LOCAL_STORAGE_PREFIX}:voteCounts`, counts);
    notifyLocalStorageSync();
    return nextVote;
  }

  try {
    await addDoc(collection(db, VOTES_COLLECTION), {
      studentName: studentName.trim(),
      grade,
      candidateId,
      candidateName,
      timestamp: serverTimestamp(),
    });

    await setDoc(
      META_DOC,
      { [candidateId]: increment(1) },
      { merge: true }
    );
  } catch (error) {
    console.warn("Firestore write failed; saving vote locally instead.", error);
    const votes = getLocalVotes();
    const nextVote = { id: `${Date.now()}-${Math.random().toString(16).slice(2)}`, ...normalizedVote };
    votes.push(nextVote);
    writeLocalStorage(`${LOCAL_STORAGE_PREFIX}:votes`, votes);

    const counts = recountLocalVoteCounts(votes);
    writeLocalStorage(`${LOCAL_STORAGE_PREFIX}:voteCounts`, counts);
    notifyLocalStorageSync();
    return nextVote;
  }
}

export async function deleteVote(voteId, candidateId) {
  if (!voteId) return false;

  if (!firebaseReady || !db || !META_DOC) {
    const votes = getLocalVotes().filter((vote) => vote.id !== voteId);
    writeLocalStorage(`${LOCAL_STORAGE_PREFIX}:votes`, votes);

    const counts = recountLocalVoteCounts(votes);
    writeLocalStorage(`${LOCAL_STORAGE_PREFIX}:voteCounts`, counts);
    notifyLocalStorageSync();
    return true;
  }

  try {
    await deleteDoc(doc(db, VOTES_COLLECTION, voteId));
    if (candidateId) {
      await setDoc(
        META_DOC,
        { [candidateId]: increment(-1) },
        { merge: true }
      );
    }
    return true;
  } catch (error) {
    console.warn("Firestore delete failed; removing vote locally instead.", error);
    const votes = getLocalVotes().filter((vote) => vote.id !== voteId);
    writeLocalStorage(`${LOCAL_STORAGE_PREFIX}:votes`, votes);

    const counts = recountLocalVoteCounts(votes);
    writeLocalStorage(`${LOCAL_STORAGE_PREFIX}:voteCounts`, counts);
    notifyLocalStorageSync();
    return true;
  }
}

/** Subscribes to live vote totals, keyed by candidate id. Returns an unsubscribe fn. */
export function subscribeToVoteCounts(onChange) {
  if (!firebaseReady || !db || !META_DOC) {
    return subscribeLocalVoteCounts(onChange);
  }

  let activeUnsubscribe = () => {};

  try {
    activeUnsubscribe = onSnapshot(
      META_DOC,
      (snap) => {
        onChange(snap.exists() ? snap.data() : {});
      },
      (error) => {
        console.warn("Vote count subscription failed; switching to LocalStorage fallback.", error);
        activeUnsubscribe = subscribeLocalVoteCounts(onChange);
      }
    );
  } catch (error) {
    console.warn("Vote count subscription setup failed; using LocalStorage fallback.", error);
    activeUnsubscribe = subscribeLocalVoteCounts(onChange);
  }

  return () => activeUnsubscribe();
}

/** Subscribes to the live voter audit log, newest first. Returns an unsubscribe fn. */
export function subscribeToAuditLog(onChange, rowLimit = 200) {
  if (!firebaseReady || !db) {
    return subscribeLocalAuditLog(onChange, rowLimit);
  }

  let activeUnsubscribe = () => {};

  try {
    const q = query(
      collection(db, VOTES_COLLECTION),
      orderBy("timestamp", "desc"),
      limit(rowLimit)
    );

    activeUnsubscribe = onSnapshot(
      q,
      (snap) => {
        onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (error) => {
        console.warn("Audit log subscription failed; switching to LocalStorage fallback.", error);
        activeUnsubscribe = subscribeLocalAuditLog(onChange, rowLimit);
      }
    );
  } catch (error) {
    console.warn("Audit log subscription setup failed; using LocalStorage fallback.", error);
    activeUnsubscribe = subscribeLocalAuditLog(onChange, rowLimit);
  }

  return () => activeUnsubscribe();
}

/**
 * Subscribes to whether the election is currently open. Defaults to `true`
 * (open) until the document exists, so voting works out of the box before
 * an administrator has ever touched the lock toggle.
 */
export function subscribeToElectionStatus(onChange) {
  if (!firebaseReady || !db || !ELECTION_STATUS_DOC) {
    return subscribeLocalElectionStatus(onChange);
  }

  let activeUnsubscribe = () => {};

  try {
    activeUnsubscribe = onSnapshot(
      ELECTION_STATUS_DOC,
      (snap) => {
        onChange(snap.exists() ? snap.data().open !== false : true);
      },
      (error) => {
        console.warn("Election status subscription failed; switching to LocalStorage fallback.", error);
        activeUnsubscribe = subscribeLocalElectionStatus(onChange);
      }
    );
  } catch (error) {
    console.warn("Election status subscription setup failed; using LocalStorage fallback.", error);
    activeUnsubscribe = subscribeLocalElectionStatus(onChange);
  }

  return () => activeUnsubscribe();
}

/** Opens or closes the election system-wide. Called from the executive dashboard. */
export async function setElectionOpen(isOpen) {
  if (!firebaseReady || !db || !ELECTION_STATUS_DOC) {
    writeLocalStorage(`${LOCAL_STORAGE_PREFIX}:electionStatus`, isOpen);
    notifyLocalStorageSync();
    return;
  }

  try {
    await setDoc(ELECTION_STATUS_DOC, { open: isOpen }, { merge: true });
  } catch (error) {
    console.warn("Firestore status update failed; saving election status locally.", error);
    writeLocalStorage(`${LOCAL_STORAGE_PREFIX}:electionStatus`, isOpen);
    notifyLocalStorageSync();
  }
}
