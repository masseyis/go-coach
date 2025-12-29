import type { GoMove, Intersection } from "../types/go";

const STORAGE_KEY = "gocoach_game_state";

export type PersistedGoState = {
  board: Intersection[][];
  moves: GoMove[];
  captures: { black: number; white: number };
  turn: "black" | "white";
};

export function saveGoState(state: PersistedGoState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Unable to save Go state", error);
  }
}

export function loadGoState(): PersistedGoState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedGoState;
  } catch (error) {
    console.warn("Unable to load Go state", error);
    return null;
  }
}

export function clearGoState() {
  localStorage.removeItem(STORAGE_KEY);
}
