"use client";

import { useSyncExternalStore } from "react";
import {
  type BasketLine,
  STORAGE_KEY,
  addLine,
  parseBasket,
  removeLine,
  updateLine,
} from "./basket";

/**
 * A module-level store rather than React context: the header badge and the quote page both need the basket, and
 * they sit in different parts of the tree. `useSyncExternalStore` is also what makes the server render (an empty
 * basket) and the first client render agree, so there is no hydration mismatch and no flash of a wrong count.
 */

const EMPTY: BasketLine[] = [];

let snapshot: BasketLine[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function read(): BasketLine[] {
  try {
    return parseBasket(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Storage can be unavailable (private mode, blocked cookies). The basket then lives for this page only,
    // which is worse than persisting but much better than a crash on a product page.
    return EMPTY;
  }
}

function write(lines: BasketLine[]) {
  snapshot = lines;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // See read(): losing persistence is survivable, throwing here is not.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  // Another tab may change the basket; keeping them in sync avoids a buyer sending half a list.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    snapshot = read();
    listeners.forEach((l) => l());
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Loads from storage on the first client read and caches the result. It has to happen here rather than in
 * `subscribe`: React calls `getSnapshot` before subscribing, so loading later would leave the first render — and
 * every render after it, until something wrote — showing an empty basket on a page the visitor just reloaded.
 *
 * The value is cached because `getSnapshot` must return the identical array until the store actually changes.
 */
function getSnapshot(): BasketLine[] {
  if (!loaded) {
    loaded = true;
    snapshot = read();
  }
  return snapshot;
}

export function useBasket(): BasketLine[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);
}

export const basket = {
  add(line: BasketLine) {
    write(addLine(getSnapshot(), line));
  },
  /** Several lines in one write, so other tabs and subscribers see one change rather than a burst. */
  addAll(lines: BasketLine[]) {
    write(lines.reduce(addLine, getSnapshot()));
  },
  update(id: string, changes: Partial<BasketLine>) {
    write(updateLine(getSnapshot(), id, changes));
  },
  remove(id: string) {
    write(removeLine(getSnapshot(), id));
  },
  clear() {
    write([]);
  },
};
