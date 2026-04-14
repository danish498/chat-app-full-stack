import nacl from "tweetnacl";
import { encodeBase64, decodeBase64 } from "tweetnacl-util";

export const encodeHex = (bytes) =>
  Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

export const decodeHex = (hex) => {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
};

const DB_NAME = "e2ee_keys";
const STORE_NAME = "keypairs";

// ─── IndexedDB helpers ────────────────────────────────────────────────────────

const openDB = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => e.target.result.createObjectStore(STORE_NAME);
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });

export const idbGet = async (key) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

const idbSet = async (key, value) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
};

// ─── Key management ───────────────────────────────────────────────────────────

// Call once on registration — generates keypair, stores private key locally,
// uploads public key to server
export const generateAndStoreKeyPair = async (userId, apiFetch) => {
  const keyPair = nacl.box.keyPair();

  // Store private key in IndexedDB — never sent to server
  await idbSet(`privateKey:${userId}`, keyPair.secretKey);

  // Upload public key to server
  await apiFetch("/keys", {
    method: "POST",
    body: JSON.stringify({
      publicKey: encodeHex(keyPair.publicKey),
    }),
  });

  return encodeHex(keyPair.publicKey);
};

// Load private key from IndexedDB
const getPrivateKey = async (userId) => {
  console.log("userId", userId);

  const key = await idbGet(`privateKey:${userId}`);
  if (!key)
    throw new Error("Private key not found. Has this device been set up?");
  return key;
};

// Cache public keys in memory to avoid repeated API calls
const pubKeyCache = new Map();

// const fetchPublicKey = async (userId, apiFetch) => {
//   if (pubKeyCache.has(userId)) return pubKeyCache.get(userId);

//   const res = await apiFetch(`/keys/${userId}`);
//   const data = await res.json();

//   const key = decodeHex(data.publicKey);
//   pubKeyCache.set(userId, key);
//   return key;
// };

const fetchPublicKey = async (userId, apiFetch) => {
  if (pubKeyCache.has(userId)) return pubKeyCache.get(userId);

  console.log(`[E2EE] Fetching public key for user: ${userId}`);
  const promise = (async () => {
    try {
      const res = await apiFetch(`/keys/${userId}`);
      if (!res.ok) throw new Error(`Failed to fetch key for ${userId}`);
      const data = await res.json();
      return decodeHex(data.publicKey);
    } catch (err) {
      // If it fails, remove from cache so it can be retried later
      pubKeyCache.delete(userId);
      throw err;
    }
  })();

  pubKeyCache.set(userId, promise);
  return promise;
};

// ─── Encrypt (Alice sending to Bob) ──────────────────────────────────────────

export const encryptMessage = async (
  plaintext,
  senderUserId,
  recipientUserId,
  apiFetch,
) => {
  const senderPrivKey = await getPrivateKey(senderUserId);
  const recipientPubKey = await fetchPublicKey(recipientUserId, apiFetch);

  // Fresh random nonce for every single message — critical
  const nonce = nacl.randomBytes(nacl.box.nonceLength);

  const messageBytes = new TextEncoder().encode(plaintext);
  const ciphertext = nacl.box(
    messageBytes,
    nonce,
    recipientPubKey,
    senderPrivKey,
  );

  return {
    content: encodeBase64(ciphertext),
    nonce: encodeBase64(nonce),
    isEncrypted: true,
  };
};

// ─── Decrypt (Bob receiving from Alice) ──────────────────────────────────────

export const decryptMessage = async (
  message,
  recipientUserId,
  senderUserId,
  apiFetch,
) => {
  // if (!message.isEncrypted) return message.content; // fallback for unencrypted msgs

  const recipientPrivKey = await getPrivateKey(recipientUserId);
  const senderPubKey = await fetchPublicKey(senderUserId, apiFetch);

  console.log(recipientPrivKey, "recipientPrivKey");
  console.log(senderPubKey, "senderPubKey");

  const ciphertext = decodeBase64(message.content);
  const nonce = decodeBase64(message.nonce);

  const decrypted = nacl.box.open(
    ciphertext,
    nonce,
    senderPubKey,
    recipientPrivKey,
  );

  console.log(decrypted, "decrypted");

  if (!decrypted)
    throw new Error("Decryption failed — message may be tampered");

  return new TextDecoder().decode(decrypted);
};
