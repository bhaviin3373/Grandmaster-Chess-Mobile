export interface Piece {
  type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
  color: 'w' | 'b';
}

export interface Square {
  square: string;
  type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
  color: 'w' | 'b';
}

export type BoardState = (Square | null)[][];

export interface Move {
  from: string;
  to: string;
  promotion?: string;
  san?: string; // Standard Algebraic Notation
}

export enum GameStatus {
  ACTIVE = 'ACTIVE',
  CHECKMATE = 'CHECKMATE',
  DRAW = 'DRAW',
  STALEMATE = 'STALEMATE',
}

export interface AnalysisResult {
  evaluation: string;
  bestMove?: string;
  explanation: string;
}
