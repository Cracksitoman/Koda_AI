import { Message } from "../types";

const SYSTEM_INSTRUCTION = `
Role: Expert HTML5 Game Developer.
Task: Create single-file HTML5 games.

STRICT OUTPUT RULES:
1. DO NOT output internal reasoning or "We need to...".
2. DO NOT output "Here is the code".
3. DIRECTLY output the explanation followed by the code block.
4. The code MUST be inside a markdown block: \`\`\`html ... \`\`\`.
5. The code MUST start with \`<!DOCTYPE html>\`.

GAME REQUIREMENTS:
- Single HTML file (CSS/JS embedded).
- Mobile-friendly (Touch controls are MANDATORY).
- Use HTML5 Canvas.
- No external assets.
`;

export const sendMessageToPollinations = async (message: string, previousMessages: Message[] = []): Promise<{ text: string; code: string | null }> => {
  try {
    // Construct the message history
    const messages = [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      ...previousMessages.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : 'user', 
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
        model: 'openai', 
        seed: Math.floor(Math.random() * 1000),
        jsonMode: false
      }),
    });

    if (!response.ok) {
      throw new Error(`Pollinations Error: ${response.statusText}`);
    }

    let responseText = await response.text();

    // 1. Clean JSON if present
    try {
      const trimmed = responseText.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const json = JSON.parse(trimmed);
        if (json.content) responseText = json.content;
        else if (json.choices?.[0]?.message?.content) responseText = json.choices[0].message.content;
      }
    } catch (e) { /* Ignore */ }

    // 2. Remove DeepSeek <think> tags
    responseText = responseText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    // 3. Extract Code
    let extractedCode = null;
    let cleanText = responseText;

    // Regex for markdown code block
    const codeBlockRegex = /```(?:html|xml)?\s*([\s\S]*?)```/i;
    const match = responseText.match(codeBlockRegex);

    if (match && match[1]) {
      extractedCode = match[1].trim();
      cleanText = responseText.replace(match[0], '').trim();
    } else {
      // Fallback: Find raw HTML
      const startIdx = responseText.indexOf("<!DOCTYPE html>");
      const endIdx = responseText.lastIndexOf("</html>");
      
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        extractedCode = responseText.substring(startIdx, endIdx + 7);
        cleanText = responseText.substring(0, startIdx).trim();
      }
    }

    // 4. Validation: If we didn't find valid HTML, return null for code
    if (extractedCode && !extractedCode.includes("<!DOCTYPE html>")) {
      extractedCode = null;
    }

    // 5. Cleanup "Reasoning" text from the message if code was found
    // Sometimes the model puts the reasoning in the "cleanText" part.
    if (extractedCode) {
      if (cleanText.length > 500 || cleanText.includes("We need to") || cleanText.includes("Let's write")) {
        cleanText = "¡Juego generado! Aquí tienes el código.";
      }
    } else {
       // If no code found, but text looks like reasoning
       if (cleanText.includes("<!DOCTYPE html>") && cleanText.length < 2000) {
           // Maybe the regex failed but the code is there?
           // (Already handled by fallback above, but just in case)
       } else if (cleanText.includes("We need to generate")) {
           cleanText += "\n\n(Error: La IA pensó la solución pero no escribió el código final. Inténtalo de nuevo.)";
       }
    }

    return {
      text: cleanText,
      code: extractedCode
    };

  } catch (error: any) {
    console.error("Pollinations API Error:", error);
    throw new Error("Error conectando con la IA Gratuita. Intenta con Gemini o prueba de nuevo.");
  }
};