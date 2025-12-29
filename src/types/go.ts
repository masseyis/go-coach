export type StoneColor = "black" | "white";

export type Intersection = StoneColor | null;

export type GoMove = {
  moveNumber: number;
  color: StoneColor;
  coordinate: string;
  captures: number;
  boardSnapshot: Intersection[][];
};

export type GoCoachRequest = {
  boardSize: number;
  boardAscii: string;
  moveHistory: Array<{ moveNumber: number; color: StoneColor; coordinate: string; captures: number }>;
  captures: { black: number; white: number };
  lastMove?: { color: StoneColor; coordinate: string };
  nextPlayer: StoneColor;
  territoryEstimate: { black: number; white: number };
};

export type GoCoachResponse = {
  comment: string;
  focus: string;
  suggestion?: string;
};
