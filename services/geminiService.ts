
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { GameState, ImageSize } from "../types";

// Note: process.env.API_KEY is handled externally by the environment.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates the next part of the story using Gemini 2.5 Flash Lite (Low Latency).
 */
export async function generateNextStep(
  theme: string,
  history: { choice: string; story: string }[],
  currentInventory: string[],
  currentQuest: string,
  visualStyle: string
): Promise<GameState> {
  const ai = getAI();
  const historyString = history.map(h => `Action: ${h.choice}\nStory: ${h.story}`).join("\n\n");

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-lite-latest',
    contents: `
      Theme: ${theme}
      Visual Style for consistency: ${visualStyle}
      Current Inventory: ${currentInventory.join(', ')}
      Current Quest: ${currentQuest}
      
      Recent History:
      ${historyString}

      Continue the story based on the player's last action.
      Respond ONLY in JSON format following this schema:
      {
        "storyText": "The narrative text for the current scene.",
        "choices": ["Choice 1", "Choice 2", "Choice 3"],
        "inventory": ["Updated", "Inventory", "List"],
        "currentQuest": "Updated quest description",
        "imageDescription": "A concise visual prompt for this specific scene, respecting the visual style.",
        "isGameOver": false
      }
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          storyText: { type: Type.STRING },
          choices: { type: Type.ARRAY, items: { type: Type.STRING } },
          inventory: { type: Type.ARRAY, items: { type: Type.STRING } },
          currentQuest: { type: Type.STRING },
          imageDescription: { type: Type.STRING },
          isGameOver: { type: Type.BOOLEAN }
        },
        required: ["storyText", "choices", "inventory", "currentQuest", "imageDescription", "isGameOver"]
      }
    }
  });

  const rawJson = response.text.trim();
  const parsed = JSON.parse(rawJson);
  return {
    ...parsed,
    visualStyle
  };
}

/**
 * Generates high-quality images using Gemini 3 Pro Image Preview.
 */
export async function generateSceneImage(
  prompt: string,
  style: string,
  size: ImageSize = '1K'
): Promise<string> {
  const ai = getAI();
  const fullPrompt = `${style}. Scene: ${prompt}`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: fullPrompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: size
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image data returned from Gemini 3 Pro Image.");
}

/**
 * Interactive chat assistant using Gemini 3 Pro for complex help/lore queries.
 */
export async function getChatResponse(
  query: string,
  gameState: GameState,
  chatHistory: { role: 'user' | 'model'; content: string }[]
): Promise<string> {
  const ai = getAI();
  const chat = ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: `You are the Game Master's familiar. You help the player understand the world, inventory, or story. 
      Current Game State:
      Quest: ${gameState.currentQuest}
      Inventory: ${gameState.inventory.join(', ')}
      Last Story Beat: ${gameState.storyText.substring(0, 200)}...
      
      Respond helpfully but keep the immersion.`
    }
  });

  // Sending the message history isn't directly supported by 'chat.sendMessage' as per guidelines, 
  // so we include the context in the query or use it internally if we were building a more complex state.
  // We'll follow the guideline for sendMessage: 'chat.sendMessage only accepts the message parameter'.
  const response = await chat.sendMessage({ message: query });
  return response.text;
}
