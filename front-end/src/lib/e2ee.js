import nacl from "tweetnacl";
import { encodeBase64, decodeBase64 } from "tweetnacl-util";

/* ================= DEVICE ID ================= */

export const getOrCreateDeviceId = () => {
  if (typeof window === "undefined") return null;

  let deviceId = localStorage.getItem("deviceId");

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("deviceId", deviceId);
  }

  return deviceId;
};

/* ================= IndexedDB ================= */

const DB_NAME = "e2ee_keys";
const STORE_NAME = "keypairs";

const openDB = () =>
  new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      e.target.result.createObjectStore(STORE_NAME);
    };
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

export const idbSet = async (key, value) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
};

/* ================= KEY MANAGEMENT ================= */

export const generateAndStoreKeyPair = async (userId, apiFetch) => {
  const deviceId = getOrCreateDeviceId();

  // Check if we already have a private key for this user on this device
  let privateKey = await idbGet(`privateKey:${userId}`);
  let publicKey;

  if (privateKey) {
    // Derive public key from existing private key
    const keyPair = nacl.box.keyPair.fromSecretKey(privateKey);
    publicKey = keyPair.publicKey;
  } else {
    // Generate new key pair and store private key locally
    const keyPair = nacl.box.keyPair();
    privateKey = keyPair.secretKey;
    publicKey = keyPair.publicKey;
    await idbSet(`privateKey:${userId}`, privateKey);
  }

  // send public key to server
  await apiFetch("/keys/devices", {
    method: "POST",
    body: JSON.stringify({
      deviceId,
      publicKey: encodeBase64(publicKey),
    }),
  });

  return {
    deviceId,
    publicKey: encodeBase64(publicKey),
  };
};

export const getPrivateKey = async (userId) => {
  const key = await idbGet(`privateKey:${userId}`);
  if (!key) throw new Error("Private key not found on this device");
  return key;
};


/* ================= KEY BACKUP ================= */

export const deriveKeyFromPassword = async (password, salt) => {
  const enc = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: decodeBase64(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

export const backupPrivateKey = async (userId, password, apiFetch) => {
  const privateKey = await getPrivateKey(userId);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKeyFromPassword(password, encodeBase64(salt));

  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    privateKey
  );

  const payload = {
    encryptedPrivateKey: encodeBase64(
      new Uint8Array([...iv, ...new Uint8Array(encrypted)])
    ),
    keySalt: encodeBase64(salt),
  };

  await apiFetch("/keys/backup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const restorePrivateKey = async (userId, password, apiFetch) => {
  const res = await apiFetch("/keys/backup");
  if (!res.ok) throw new Error("No backup found");

  const { encryptedPrivateKey, keySalt } = await res.json();

  const key = await deriveKeyFromPassword(password, keySalt);

  const data = decodeBase64(encryptedPrivateKey);

  const iv = data.slice(0, 12);
  const ciphertext = data.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  const privateKey = new Uint8Array(decrypted);

  await idbSet(`privateKey:${userId}`, privateKey);

  return privateKey;
};

/* ================= DEVICE FETCH ================= */


const deviceCache = new Map();

export const fetchUserDevices = async (userId, apiFetch) => {
  if (deviceCache.has(userId)) return deviceCache.get(userId);

  const promise = (async () => {
    const res = await apiFetch(`/keys/${userId}/devices`);
    if (!res.ok) throw new Error("Failed to fetch devices");

    const data = await res.json();

    return data.devices.map((d) => ({
      deviceId: d.deviceId,
      publicKey: decodeBase64(d.publicKey),
    }));
  })();

  deviceCache.set(userId, promise);
  return promise;
};

/* ================= ENCRYPTION ================= */

export const encryptMessage = async ({
  plaintext,
  senderUserId,
  participantUserIds, // 🔥 all users in chat
  apiFetch,
}) => {
  const senderPrivKey = await getPrivateKey(senderUserId);

  const messageBytes = new TextEncoder().encode(plaintext);

  let encryptedPayloads = [];

  for (const userId of participantUserIds) {
    const devices = await fetchUserDevices(userId, apiFetch);

    for (const device of devices) {
      const nonce = nacl.randomBytes(nacl.box.nonceLength);

      const ciphertext = nacl.box(
        messageBytes,
        nonce,
        device.publicKey,
        senderPrivKey,
      );

      encryptedPayloads.push({
        deviceId: device.deviceId,
        ciphertext: encodeBase64(ciphertext),
        nonce: encodeBase64(nonce),
      });
    }
  }

  return {
    encryptedPayloads,
    messageType: "text",
  };
};

/* ================= DECRYPTION ================= */

export const decryptMessage = async ({
  message, // contains ciphertext + nonce
  recipientUserId,
  senderUserId,
  apiFetch,
}) => {
  const recipientPrivKey = await getPrivateKey(recipientUserId);

  // fetch sender devices (we need public key)
  const senderDevices = await fetchUserDevices(senderUserId, apiFetch);

  // ⚠️ for now pick first device (later improve)
  const senderPubKey = senderDevices[0].publicKey;

  const ciphertext = decodeBase64(message.ciphertext);
  const nonce = decodeBase64(message.nonce);

  const decrypted = nacl.box.open(
    ciphertext,
    nonce,
    senderPubKey,
    recipientPrivKey,
  );

  if (!decrypted) {
    throw new Error("Decryption failed — possibly wrong key");
  }

  return new TextDecoder().decode(decrypted);
};
