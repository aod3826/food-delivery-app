const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyAKu35YXHRMiAEcfEJ_e2haLIV5d8czNDI",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "gen-lang-client-0326253424.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "gen-lang-client-0326253424",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "gen-lang-client-0326253424.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "1059377978488",
  appId: process.env.FIREBASE_APP_ID || "1:1059377978488:web:b4d0d2bf9f1949dbbba18d"
};

const firestoreBaseUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;

const buildUrl = (path = "") => {
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const separator = cleanPath ? "/" : "";
  return `${firestoreBaseUrl}${separator}${cleanPath}?key=${firebaseConfig.apiKey}`;
};

const encodeValue = (value) => {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }

  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(encodeValue) } };
  }

  if (typeof value === "object") {
    return { mapValue: { fields: encodeFields(value) } };
  }

  if (typeof value === "boolean") {
    return { booleanValue: value };
  }

  if (typeof value === "number") {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }

  return { stringValue: String(value) };
};

const encodeFields = (data) => Object.entries(data).reduce((fields, [key, value]) => {
  fields[key] = encodeValue(value);
  return fields;
}, {});

const decodeValue = (value) => {
  if ("stringValue" in value) return value.stringValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return Number(value.doubleValue);
  if ("booleanValue" in value) return value.booleanValue;
  if ("nullValue" in value) return null;
  if ("timestampValue" in value) return value.timestampValue;

  if ("arrayValue" in value) {
    return (value.arrayValue.values || []).map(decodeValue);
  }

  if ("mapValue" in value) {
    return decodeFields(value.mapValue.fields || {});
  }

  return undefined;
};

const decodeFields = (fields = {}) => Object.entries(fields).reduce((data, [key, value]) => {
  data[key] = decodeValue(value);
  return data;
}, {});

const mapDocument = (document) => ({
  _id: document.name.split("/").pop(),
  ...decodeFields(document.fields)
});

const requestFirestore = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Firestore request failed (${response.status}): ${message}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const collectionPath = (collectionName) => encodeURIComponent(collectionName);
const documentPath = (collectionName, id) => `${collectionPath(collectionName)}/${encodeURIComponent(id)}`;

export const addDocument = async (collectionName, data) => {
  const document = await requestFirestore(buildUrl(collectionPath(collectionName)), {
    method: "POST",
    body: JSON.stringify({ fields: encodeFields(data) })
  });

  return mapDocument(document);
};

export const getCollection = async (collectionName) => {
  const response = await requestFirestore(buildUrl(collectionPath(collectionName)));
  return (response.documents || []).map(mapDocument);
};

export const getDocument = async (collectionName, id) => {
  try {
    const document = await requestFirestore(buildUrl(documentPath(collectionName, id)));
    return mapDocument(document);
  } catch (error) {
    if (error.message.includes("(404)")) {
      return null;
    }
    throw error;
  }
};

export const updateDocument = async (collectionName, id, data) => {
  const params = new URLSearchParams({ key: firebaseConfig.apiKey });

  Object.keys(data).forEach((fieldPath) => {
    params.append("updateMask.fieldPaths", fieldPath);
  });

  const url = `${firestoreBaseUrl}/${documentPath(collectionName, id)}?${params.toString()}`;
  const document = await requestFirestore(url, {
    method: "PATCH",
    body: JSON.stringify({ fields: encodeFields(data) })
  });

  return mapDocument(document);
};

export const deleteDocument = async (collectionName, id) => {
  await requestFirestore(buildUrl(documentPath(collectionName, id)), { method: "DELETE" });
};

export const queryCollection = async (collectionName, fieldPath, operator, value) => {
  const response = await requestFirestore(`${firestoreBaseUrl}:runQuery?key=${firebaseConfig.apiKey}`, {
    method: "POST",
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: collectionName }],
        where: {
          fieldFilter: {
            field: { fieldPath },
            op: operator,
            value: encodeValue(value)
          }
        }
      }
    })
  });

  return response.filter((result) => result.document).map((result) => mapDocument(result.document));
};

export const ConnectDB = async () => {
  try {
    console.log(`Firebase Firestore connected: ${firebaseConfig.projectId}`);
  } catch (error) {
    console.error("Firebase Firestore connection failed:", error);
    process.exit(1);
  }
};
