import { Message } from "../types";

// Much simpler prompt to avoid "reasoning" output
const SYSTEM_INSTRUCTION = `
You are a coding engine. Write a SINGLE-FILE HTML5 game.
RULES:
1. NO text explanations. NO planning.
2. START DIRECTLY with \`\`\`html.
3. INCLUDE CSS in <style> and JS in <script>.
4. MUST support TOUCH (touchstart) for mobile.
5. Use <canvas> for graphics.
6. If code is provided, UPDATE it based on the user request.
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
        userPrompt = `Here is the current existing code:\n\`\`\`html\n${currentCode}\n\`\`\`\n\nUSER REQUEST: ${message}\n\nTask: Return the fully updated code.`;
    } else {
        userPrompt = `Create code for: ${message}`;
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