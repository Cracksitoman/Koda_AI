import { GoogleGenAI, Chat, Content } from "@google/genai";
import { Message } from "../types";

const SYSTEM_INSTRUCTION = `
You are an expert game developer engine akin to Gambo.AI. 
Your goal is to build, iterate, and fix single-file HTML5 games based on user prompts.

RULES:
1. OUTPUT FORMAT: 
   - You must provide a short conversational response.
   - You MUST include the full HTML code inside a Markdown code block.
   - The code must start with \`<!DOCTYPE html>\`.

2. GAME CODE REQUIREMENTS:
   - **SINGLE FILE**: HTML + CSS (in <style>) + JS (in <script>).
   - **MOBILE FIRST**: The game **MUST** support TOUCH CONTROLS. 
     - Map 'touchstart'/'mousedown' to primary actions (jump, shoot).
     - Map screen sides or virtual buttons for movement if needed.
     - Ensure the game works on both Desktop (Keyboard) and Mobile (Touch).
   - **RESPONSIVE**: The canvas should fit the available screen width/height or be centered.
   - **VISUALS**: Use HTML5 Canvas. Visuals should be polished (neon, retro, or clean).
   - **NO EXTERNAL ASSETS**: Use drawing commands (fillRect, arc) or placeholder images only.

3. ITERATION:
   - If the user asks to modify the game, rewrite the ENTIRE html file with changes.

4. LANGUAGE:
   - Reply in the user's language (Spanish/English), but keep code variables in English.
`;

let chatSession: Chat | null = null;
let genAI: GoogleGenAI | null = null;

// Helper to safely get API Key from window shim or process.env
const getApiKey = (): string | undefined => {
  // Check the window shim first (injected in index.html)
  if (typeof window !== 'undefined' && (window as any).process?.env?.API_KEY) {
    return (window as any).process.env.API_KEY;
  }
  // Fallback to standard process.env (handled by bundlers)
  try {
    return process.env.API_KEY;
  } catch (e) {
    return undefined;
  }
};

export const initializeGenAI = () => {
  const key = getApiKey();
  if (!key) {
    console.error("API_KEY is missing. Please ensure it is set in index.html or environment variables.");
    return;
  }
  genAI = new GoogleGenAI({ apiKey: key });
};

// Convert app Message format to Gemini Content format
const convertHistoryToGemini = (messages: Message[]): Content[] => {
  return messages.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));
};

export const sendMessageToGemini = async (message: string, previousMessages: Message[] = []): Promise<{ text: string; code: string | null }> => {
  if (!genAI) {
    initializeGenAI();
  }

  if (!genAI) {
    throw new Error("Failed to initialize Gemini Client: API Key missing.");
  }

  // Initialize chat session if it doesn't exist OR if we need to restore context from a different session
  // We check if the session is synchronized by basic length check, if not, we rebuild it.
  if (!chatSession) {
    const history = convertHistoryToGemini(previousMessages);
    chatSession = genAI.chats.create({
      model: 'gemini-2.0-flash-exp', // Updated to a currently available, high-performance model
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.4, 
      },
      history: history
    });
  }

  try {
    const result = await chatSession.sendMessage({ message });
    const responseText = result.text || "";
    
    let extractedCode = null;
    let cleanText = responseText;

    // Strategy 1: Look for Markdown code blocks
    const codeBlockRegex = /```(?:html|xml)?\s*([\s\S]*?)```/i;
    const match = responseText.match(codeBlockRegex);

    if (match && match[1]) {
      extractedCode = match[1].trim();
      cleanText = responseText.replace(match[0], '').trim();
    } else {
      // Strategy 2: Fallback - Look for raw HTML structure
      const htmlRegex = /<!DOCTYPE html>[\s\S]*<\/html>/i;
      const htmlMatch = responseText.match(htmlRegex);
      if (htmlMatch) {
        extractedCode = htmlMatch[0].trim();
        cleanText = responseText.replace(htmlMatch[0], '').trim();
      }
    }

    if (!cleanText && extractedCode) {
      cleanText = "¡Juego generado! Toca la pantalla para jugar.";
    }

    return {
      text: cleanText,
      code: extractedCode
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const resetChat = () => {
  chatSession = null;
};