
import { GoogleGenAI, Type } from "@google/genai";
import { SimulationState } from "../types";

export interface OptimizationResult {
  directive: string;
  buffType: 'COHERENCE_BOOST' | 'FIELD_CLEAR' | 'ENERGY_REFILL' | 'SPEED_SYNC';
  message: string;
}

export const optimizeQuantumField = async (state: SimulationState): Promise<OptimizationResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Adjusted prompt to use existing state properties: aiIntegrity and corruptionLevel instead of lastCoherence/entropy
  const prompt = `As a Quantum AI Observer, analyze this live combat state:
    Score: ${state.score}
    Integrity: ${state.aiIntegrity.toFixed(2)}
    Corruption: ${state.corruptionLevel.toFixed(2)}
    Weapon: ${state.weapon}
    
    Choose ONE optimization buff:
    1. FIELD_CLEAR: Disintegrate nearby threats.
    2. ENERGY_REFILL: Instant Special Attack charge.
    3. COHERENCE_BOOST: Temporary infinite coherence.
    4. SPEED_SYNC: Optimize thrust/turn velocity.
    
    Return a directive (short command) and a brief scientific message.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            directive: { type: Type.STRING },
            buffType: { 
              type: Type.STRING, 
              enum: ['COHERENCE_BOOST', 'FIELD_CLEAR', 'ENERGY_REFILL', 'SPEED_SYNC'] 
            },
            message: { type: Type.STRING }
          },
          required: ["directive", "buffType", "message"]
        }
      }
    });

    // Access the text property directly from the response object
    const jsonStr = response.text?.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Optimization failed:", error);
    return {
      directive: "EMERGENCY_STABILIZATION",
      buffType: 'COHERENCE_BOOST',
      message: "Neural bridge unstable. Manual coherence override engaged."
    };
  }
};
