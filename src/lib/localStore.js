const DB_KEY = "trade-track.db";
const PROFILE_KEY = "trade-track.profile";
const DB_VERSION = 1;

const createDefaultDb = () => ({
  version: DB_VERSION,
  entities: {
    Trade: [],
    Tag: [],
    WeeklyReview: [],
    BacktestStrategy: [],
    BacktestRecord: [],
  },
});

const createDefaultProfile = () => ({
  id: "owner",
  full_name: "Trade Track Pro Owner",
  email: "owner@tradetrack.local",
  role: "owner",
  plan: "Local Mode",
});

let memoryDb = createDefaultDb();
let memoryProfile = createDefaultProfile();

const clone = (value) => JSON.parse(JSON.stringify(value));

const hasStorage = () => {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
};

const readValue = (key, fallbackValue, memoryValue) => {
  if (!hasStorage()) {
    return clone(memoryValue);
  }

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : clone(fallbackValue);
  } catch {
    return clone(fallbackValue);
  }
};

const writeValue = (key, value, memorySetter) => {
  const safeValue = clone(value);
  memorySetter(safeValue);

  if (!hasStorage()) {
    return safeValue;
  }

  window.localStorage.setItem(key, JSON.stringify(safeValue));
  return safeValue;
};

const ensureDbShape = (db) => ({
  version: DB_VERSION,
  entities: {
    ...createDefaultDb().entities,
    ...(db?.entities || {}),
  },
});

export const getLocalDb = () => {
  const db = ensureDbShape(readValue(DB_KEY, createDefaultDb(), memoryDb));
  memoryDb = clone(db);
  return db;
};

export const saveLocalDb = (db) => {
  const nextDb = ensureDbShape(db);
  return writeValue(DB_KEY, nextDb, (value) => {
    memoryDb = value;
  });
};

export const getLocalProfile = () => {
  const profile = {
    ...createDefaultProfile(),
    ...readValue(PROFILE_KEY, createDefaultProfile(), memoryProfile),
  };
  memoryProfile = clone(profile);
  return profile;
};

export const saveLocalProfile = (profile) => {
  const nextProfile = {
    ...createDefaultProfile(),
    ...profile,
  };

  return writeValue(PROFILE_KEY, nextProfile, (value) => {
    memoryProfile = value;
  });
};

export const resetLocalAppState = () => {
  const nextDb = createDefaultDb();
  const nextProfile = createDefaultProfile();
  saveLocalDb(nextDb);
  saveLocalProfile(nextProfile);
  return {
    db: nextDb,
    profile: nextProfile,
  };
};
