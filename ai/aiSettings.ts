// aiSettings.ts
// Manage the active AI Mode: 'online' (Gemini/Groq API), 'offline' (On-device ONNX), or 'simulasi' (Mock simulation)

export type AiMode = 'online' | 'offline' | 'simulasi';

let activeAiMode: AiMode = 'online'; // Default to online as requested by user

export function getAiMode(): AiMode {
  return activeAiMode;
}

export function setAiMode(mode: AiMode): void {
  activeAiMode = mode;
  console.log(`[aiSettings] Active AI Mode set to: ${mode}`);
}
