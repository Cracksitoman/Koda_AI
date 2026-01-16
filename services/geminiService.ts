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

// Direct fallback key provided by user to ensure it works on Netlify/Deployments
const DIRECT_API_KEY = "AIzaSyDR8RlVcT-rgAq9o_H6uBAV8BHszhROC20";

let chatSession: Chat | null = null;
let genAI: GoogleGenAI | null = null;

// Helper to safely get API Key
const getApiKey = (): string | undefined => {
  // 1. Try Direct Hardcoded Key (Most reliable for this demo)
  if (DIRECT_API_KEY) return DIRECT_API_KEY;

  // 2. Check the window shim (injected in index.html)
  if (typeof window !== 'undefined' && (window as any).process?.env?.API_KEY) {
    return (window as any).process.env.API_KEY;
  }
  
  // 3. Fallback to standard process.env
  try {
    return process.env.API_KEY;
  } catch (e) {
    return undefined;
  }
};

export const initializeGenAI = () => {
  const key = getApiKey();
  if (!key) {
    console.error("API_KEY is missing.");
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
    throw new Error("Clave API no encontrada. Verifica la configuración.");
  }

  // Initialize chat session if needed
  if (!chatSession) {
    const history = convertHistoryToGemini(previousMessages);
    chatSession = genAI.chats.create({
      model: 'gemini-2.0-flash-exp',
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

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Extract a more meaningful error message for the user
    let errorMessage = "Error desconocido al conectar con la IA.";
    
    if (error.message) {
        if (error.message.includes("403")) errorMessage = "Error 403: Clave API inválida o expirada.";
        else if (error.message.includes("404")) errorMessage = "Error 404: El modelo de IA no está disponible actualmente.";
        else if (error.message.includes("429")) errorMessage = "Error 429: Demasiadas peticiones. Espera un momento.";
        else if (error.message.includes("503")) errorMessage = "Error 503: Servicio de IA sobrecargado.";
        else errorMessage = `Error de API: ${error.message}`;
    }
    
    throw new Error(errorMessage);
  }
};

export const resetChat = () => {
  chatSession = null;
};