import { Message } from "../types";

const SYSTEM_INSTRUCTION = `
You are an expert game developer engine akin to Gambo.AI. 
Your goal is to build, iterate, and fix single-file HTML5 games based on user prompts.

RULES:
1. OUTPUT FORMAT: 
   - You must provide a short conversational response.
   - You MUST include the full HTML code inside a Markdown code block (e.g., \`\`\`html ... \`\`\`).
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

export const sendMessageToPollinations = async (message: string, previousMessages: Message[] = []): Promise<{ text: string; code: string | null }> => {
  try {
    // Construct the message history for Pollinations (OpenAI format)
    const messages = [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      ...previousMessages.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : 'user', // Pollinations uses 'assistant' instead of 'model'
        content: msg.text
      })),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages,
        model: 'openai', // Maps to GPT-4o-mini or similar lightweight models
        seed: Math.floor(Math.random() * 1000),
        jsonMode: false
      }),
    });

    if (!response.ok) {
      throw new Error(`Pollinations Error: ${response.statusText}`);
    }

    const responseText = await response.text();

    // --- Code Extraction Logic (Same as Gemini) ---
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
      cleanText = "¡Juego generado con Pollinations! Toca para jugar.";
    }

    return {
      text: cleanText,
      code: extractedCode
    };

  } catch (error: any) {
    console.error("Pollinations API Error:", error);
    throw new Error("Error conectando con Pollinations (Free AI). Inténtalo de nuevo.");
  }
};
