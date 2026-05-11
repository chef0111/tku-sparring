import * as React from 'react';

const DEVICE_ID_STORAGE_KEY = 'tku-device-id';

type DeviceIdStorage = Pick<Storage, 'getItem' | 'setItem'>;
type DeviceIdCrypto = Pick<Crypto, 'randomUUID'>;

const listeners = new Set<() => void>();
let currentDeviceId: string | undefined;
let hasHydrated = false;

export function getOrCreateStoredDeviceId(
  storage: DeviceIdStorage,
  crypto: DeviceIdCrypto
) {
  const existingDeviceId = storage.getItem(DEVICE_ID_STORAGE_KEY);

  if (existingDeviceId) {
    return existingDeviceId;
  }

  const nextDeviceId = crypto.randomUUID();

  try {
    storage.setItem(DEVICE_ID_STORAGE_KEY, nextDeviceId);
  } catch {
    // localStorage can be unavailable or blocked; keep the generated id in memory.
  }

  return nextDeviceId;
}

function readFromStorage() {
  if (typeof window === 'undefined') {
    return undefined;
  }

  try {
    return getOrCreateStoredDeviceId(window.localStorage, window.crypto);
  } catch {
    return undefined;
  }
}

function hydrateOnce() {
  if (hasHydrated || typeof window === 'undefined') {
    return;
  }

  hasHydrated = true;
  currentDeviceId = readFromStorage();
}

function subscribe(listener: () => void) {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  hydrateOnce();
  return currentDeviceId;
}

function getServerSnapshot() {
  return undefined;
}

export function useDeviceId() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
