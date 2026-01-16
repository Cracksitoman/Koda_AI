import { Message } from "../types";

// PROMPT DE "ENTRENAMIENTO" SIMPLIFICADO PARA MODELOS MÁS PEQUEÑOS
const SYSTEM_INSTRUCTION = `
You are an HTML5 Game Generator Bot.
YOUR GOAL: Create valid, playable, single-file HTML5 games.

STRICT RULES:
1. OUTPUT: Start immediately with \`\`\`html. Do not chat.
2. FILE: Combine HTML, CSS (in <style>), and JS (in <script>).
3. MOBILE: You MUST implement 'touchstart' and 'touchend' listeners.
   - Map Left-side touch -> Move.
   - Map Right-side touch -> Action.
4. GAME LOOP: Use requestAnimationFrame.
5. CANVAS: Set canvas.width = window.innerWidth.
`;

export const sendMessageToPollinations = async (
  message: string, 
  previousMessages: Message[] = [], 
  model: 'pollinations' | 'mistral' = 'pollinations',
  currentCode: string | null = null
): Promise<{ text: string; code: string | null }> => {
  try {
    // Construct messages
    const messages = [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      ...previousMessages.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : 'user', 
        content: msg.text
      }))
    ];

    // INJECT CODE CONTEXT:
    // If we have existing code, we send it along with the new user request.
    // This ensures the AI edits the existing file instead of creating a new one.
    let userPrompt = message;
    if (currentCode) {
        userPrompt = `PREVIOUS CODE (Modify this):\n\`\`\`html\n${currentCode}\n\`\`\`\n\nREQUEST: ${message}\n\nTask: Return FULL updated code only.`;
    } else {
        userPrompt = `Create a game: ${message}`;
    }

    messages.push({ role: 'user', content: userPrompt });

    // Map internal model name to Pollinations API model string
    // 'pollinations' maps to 'openai' (default generic)
    // 'mistral' maps to 'mistral'
    const apiModel = model === 'mistral' ? 'mistral' : 'openai';

    const response = await fetch('https://text.pollinations.ai/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: messages,
        model: apiModel, 
        seed: Math.floor(Math.random() * 1000),
        jsonMode: false
      }),
    });

    if (!response.ok) {
      throw new Error(`Pollinations Error: ${response.statusText}`);
    }

    let responseText = await response.text();

    // 1. Clean JSON if accidentally returned
    try {
      const trimmed = responseText.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const json = JSON.parse(trimmed);
        if (json.content) responseText = json.content;
      }
    } catch (e) { /* Ignore */ }

    // 2. Extract Code
    let extractedCode = null;
    let cleanText = responseText;

    const codeBlockRegex = /```(?:html|xml)?\s*([\s\S]*?)```/i;
    const match = responseText.match(codeBlockRegex);

    if (match && match[1]) {
      extractedCode = match[1].trim();
      cleanText = responseText.replace(match[0], '').trim();
    } else {
      // Fallback extraction
      const startIdx = responseText.indexOf("<!DOCTYPE html>");
      const endIdx = responseText.lastIndexOf("</html>");
      
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        extractedCode = responseText.substring(startIdx, endIdx + 7);
        cleanText = "Code generated successfully.";
      }
    }

    // 3. Validation
    if (extractedCode && !extractedCode.includes("<!DOCTYPE html>")) {
      extractedCode = null;
    }

    if (!cleanText.trim()) {
      cleanText = "¡Juego actualizado!";
    }

    return {
      text: cleanText,
      code: extractedCode
    };

  } catch (error: any) {
    console.error("Pollinations API Error:", error);
    throw new Error(`Error con el modelo ${model}. Intenta cambiar a Gemini.`);
  }
};