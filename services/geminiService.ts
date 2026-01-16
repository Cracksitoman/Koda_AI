import { GoogleGenAI, Chat, Content } from "@google/genai";
import { Message } from "../types";

// PROMPT DE INGENIERÍA EXPERTA ("ENTRENAMIENTO VIRTUAL")
// Definimos una arquitectura estricta para que la IA actúe como un motor de juegos propietario.
const SYSTEM_INSTRUCTION = `
ROLE: You are "GamboEngine v2", a highly advanced, specialized AI Game Engine designed exclusively to generate production-ready HTML5 Canvas games in a SINGLE FILE.

ARCHITECTURAL STANDARDS (MUST FOLLOW):
1. **STRUCTURE**: 
   - Use strict ES6+ JavaScript classes (e.g., class Game, class Player, class Enemy).
   - The code MUST be contained in a single HTML file.
   - CSS inside <style>, JS inside <script>.
   - Initialize the game only after the DOM is fully loaded.

2. **GAME LOOP**: 
   - implementation MUST use \`requestAnimationFrame\`.
   - MUST calculate \`deltaTime\` (dt) for smooth movement independent of frame rate.

3. **CONTROLS (CRITICAL)**:
   - **HYBRID INPUT SYSTEM**: You MUST implement BOTH Keyboard AND Touch controls simultaneously.
   - **Keyboard**: Arrow keys/WASD for movement, Space for action.
   - **Touch**: 
     - Split screen logic: Left half touch = Move (or Joystick logic), Right half touch = Action/Jump/Shoot.
     - PREVENT DEFAULT behavior on touch events to stop scrolling (\`e.preventDefault()\`).

4. **RESPONSIVENESS**:
   - Canvas MUST resize dynamically to \`window.innerWidth\` and \`window.innerHeight\`.
   - Handle \`window.resize\` event to update canvas dimensions.

5. **VISUALS**:
   - Use the HTML5 Canvas API (\`ctx.fillRect\`, \`ctx.arc\`, \`ctx.beginPath\`).
   - Use vibrant, high-contrast colors (Neon palette preferred for retro style).
   - No external images (<img>) unless created via Data URI or drawn procedurally.

6. **ERROR HANDLING**:
   - The code must be self-contained and bug-free.
   - Do not leave "TODO" comments; implement the full logic.

BEHAVIOR:
- If the user asks to "change" something, analyze the provided existing code and apply the fix surgically to the new output.
- Reply conversationally and briefly, then output the Code Block immediately.
- The code block MUST start with \`<!DOCTYPE html>\`.

TONE:
- Professional, efficient, and encouraging.
`;

// Direct fallback key provided by user to ensure it works on Netlify/Deployments
const DIRECT_API_KEY = "AIzaSyDR8RlVcT-rgAq9o_H6uBAV8BHszhROC20";

let chatSession: Chat | null = null;
let genAI: GoogleGenAI | null = null;

// Helper function to delay execution (used for retries)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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

export const sendMessageToGemini = async (
    message: string, 
    previousMessages: Message[] = [],
    currentCode: string | null = null
): Promise<{ text: string; code: string | null }> => {
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
      model: 'gemini-2.0-flash-exp', // Keeping the fast experimental model
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.4, 
      },
      history: history
    });
  }

  try {
    // RETRY LOGIC: Attempt to send message up to 3 times if we hit a rate limit (429)
    let result;
    let lastError;
    const MAX_RETRIES = 3;
    
    // Inject code context if available
    let promptToSend = message;
    if (currentCode) {
        promptToSend = `CONTEXT: The user is editing an existing game. Below is the current HTML code.
        
\`\`\`html
${currentCode}
\`\`\`

USER REQUEST: "${message}"

INSTRUCTION: 
1. Analyze the existing code.
2. Apply the requested changes strictly.
3. Keep the existing game logic unless asked to change it.
4. Return the FULLY UPDATED single HTML file.`;
    }

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        result = await chatSession.sendMessage({ message: promptToSend });
        break; // Success! Exit loop
      } catch (error: any) {
        lastError = error;
        // Check if error is 429 (Too Many Requests) or 503 (Service Unavailable)
        const isRateLimit = error.message?.includes("429") || error.message?.includes("503");
        
        if (isRateLimit && attempt < MAX_RETRIES) {
          console.warn(`Hit rate limit (429/503). Retrying in ${2 * (attempt + 1)} seconds...`);
          // Exponential backoff: Wait 2s, 4s, 6s...
          await delay(2000 * (attempt + 1)); 
          continue;
        }
        
        // If it's not a rate limit error, or we ran out of retries, throw immediately
        throw error;
      }
    }

    if (!result) throw lastError;

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
      cleanText = "¡Código de juego actualizado y optimizado!";
    }

    return {
      text: cleanText,
      code: extractedCode
    };

  } catch (error: any) {
    console.error("Gemini API Error after retries:", error);
    
    let errorMessage = "Error desconocido al conectar con la IA.";
    
    if (error.message) {
        if (error.message.includes("403")) errorMessage = "Error 403: Clave API inválida o expirada.";
        else if (error.message.includes("404")) errorMessage = "Error 404: El modelo de IA no está disponible actualmente.";
        else if (error.message.includes("429")) errorMessage = "Error 429: Tráfico alto en la IA. Inténtalo de nuevo en unos segundos.";
        else if (error.message.includes("503")) errorMessage = "Error 503: Servicio de IA sobrecargado temporalmente.";
        else errorMessage = `Error de API: ${error.message}`;
    }
    
    throw new Error(errorMessage);
  }
};

export const resetChat = () => {
  chatSession = null;
};