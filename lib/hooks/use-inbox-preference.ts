"use client";

import { useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "gigaviz.metaHub.whatsapp.fullInboxDefault";

const emptySubscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function useInboxPreference() {
  const isClient = useSyncExternalStore(emptySubscribe, getClientSnapshot, getServerSnapshot);
  const [fullInboxDefault, setFullInboxDefault] = useState(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "true";
  });

  const toggle = () => {
    const newValue = !fullInboxDefault;
    setFullInboxDefault(newValue);
    if (isClient) {
      localStorage.setItem(STORAGE_KEY, String(newValue));
    }
  };

  return { fullInboxDefault, toggle, isClient };
}
