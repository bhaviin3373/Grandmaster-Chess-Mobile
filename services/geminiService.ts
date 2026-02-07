import { GoogleGenAI } from "@google/genai";
import { AnalysisResult } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API_KEY is not set");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const analyzeBoard = async (fen: string, turn: 'w' | 'b'): Promise<AnalysisResult> => {
  const ai = getClient();
  if (!ai) {
    return {
      evaluation: "Error",
      explanation: "API Key missing. Cannot analyze.",
    };
  }

  const turnColor = turn === 'w' ? 'White' : 'Black';
  
  const prompt = `
    You are a Chess Grandmaster engine. Analyze this board position given in FEN notation.
    FEN: ${fen}
    
    The current turn is: ${turnColor}.
    
    Provide a structured JSON response with the following fields:
    1. evaluation: A short string (e.g., "White is winning", "Equal", "Black has advantage").
    2. bestMove: The single best move in Standard Algebraic Notation (SAN) for the current player (e.g., "Nf3", "O-O").
    3. explanation: A concise (max 2 sentences) strategic explanation of why this move is best or the current state of the game.
    
    Do not use Markdown code blocks. Just return the raw JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");

    const result = JSON.parse(text);
    return {
      evaluation: result.evaluation || "Unknown",
      bestMove: result.bestMove,
      explanation: result.explanation || "No explanation provided."
    };

  } catch (error) {
    console.error("Gemini analysis error:", error);
    return {
      evaluation: "Analysis Failed",
      explanation: "Could not analyze position at this time."
    };
  }
};

export const getCoachTip = async (fen: string, lastMove: string): Promise<string> => {
  const ai = getClient();
  if (!ai) return "Coach unavailable.";

  try {
     const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The chess game is in state FEN: ${fen}. The last move was ${lastMove}. Give a very short, witty, 1-sentence comment about that move as if you are a spectator.`,
    });
    return response.text || "";
  } catch (e) {
    return "";
  }
};
