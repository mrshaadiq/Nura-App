import * as FileSystem from 'expo-file-system/legacy';

import { GEMINI_API_KEY, GROQ_API_KEY, DEEPSEEK_API_KEY } from './env';
const GEMINI_MODEL = 'gemini-2.0-flash';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

async function fetchGemini(base64Image: string, prompt: string): Promise<string> {
  const models = ['gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError = '';

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: base64Image
                }
              }
            ]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData?.error?.message || `HTTP ${response.status}`);
      }

      const resJson = await response.json();
      const text = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text.trim();
      }
    } catch (e: any) {
      console.warn(`[onlineRunner] Gemini fetch failed for model ${model}:`, e.message);
      lastError = e.message;
    }
  }
  throw new Error(`Gemini failed: ${lastError}`);
}

async function fetchGroqVision(base64Image: string, prompt: string): Promise<string> {
  const models = [GROQ_VISION_MODEL, 'qwen/qwen3.6-27b'];
  let lastError = '';

  for (const model of models) {
    try {
      console.log(`[onlineRunner] Attempting Groq Vision fallback using model: ${model}...`);
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`
                  }
                }
              ]
            }
          ]
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err?.error?.message || `HTTP ${response.status}`);
      }

      const resJson = await response.json();
      const content = (resJson.choices?.[0]?.message?.content || '').trim();
      if (content) {
        return content;
      }
    } catch (e: any) {
      console.warn(`[onlineRunner] Groq Vision model ${model} failed:`, e.message);
      lastError = e.message;
    }
  }
  throw new Error(`All Groq Vision models failed: ${lastError}`);
}

export async function analyzeImageOnline(imageUri: string | null, type: 'eyes' | 'nails' | 'face'): Promise<string> {
  if (!imageUri) {
    return `Analisis ${type} gagal: Foto tidak tersedia.`;
  }

  try {
    console.log(`[onlineRunner] Running online analysis for ${type}...`);
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64
    });

    let prompt = '';
    if (type === 'eyes') {
      prompt = `You are an expert pediatric ophthalmologist and clinical nutritionist. Analyze this photo with extreme precision. 
FIRST, verify if this image contains a human eye. If it is NOT a human eye (e.g. it is a table, floor, chair, phone, wall, or empty space), you MUST respond EXACTLY with the text: "BUKAN_MATA". 

Otherwise, if it is a valid human eye, perform a detailed clinical analysis on the following features:
1. Conjunctiva: Check if it is normal healthy pink, or pale/white (indicating anemia/iron deficiency).
2. Sclera: Check if it is clear white, yellow (indicating jaundice/liver/biliary issues), or bloodshot/red (indicating irritation/allergy/fatigue).
3. Eyelids and Under-eye area: Check for signs of exhaustion/lack of sleep, such as dark circles (lingkaran hitam), eye bags (kantung mata), or droopy/swollen eyelids.
4. Redness/Irritation: Specifically look for redness (mata merah) or signs of infection/allergy.

Provide your final analysis in a detailed, clear 2-sentence clinical verdict in Indonesian, starting exactly with "Mata (Konjungtiva): ". Be highly specific about what you observe (e.g., "Mata (Konjungtiva): Terdeteksi kemerahan pada sklera dan adanya kantung mata serta lingkaran hitam yang menandakan mata lelah akibat kurang tidur, namun kondisi konjungtiva kelopak mata bawah berwarna merah muda normal.").`;
    } else if (type === 'nails') {
      prompt = `You are an expert pediatric dermatologist and clinical nutritionist. Analyze this photo with extreme precision.
FIRST, verify if this image contains a human finger nail. If it is NOT a human nail (e.g. it is a table, floor, chair, phone, wall, or empty space), you MUST respond EXACTLY with the text: "BUKAN_KUKU".

Otherwise, if it is a valid human nail, perform a detailed clinical analysis on the following features:
1. Color: Check if it is healthy pink, pale/white (indicating anemia), or bluish (indicating poor oxygenation).
2. Shape/Texture: Check for spoon-shaped curvature (koilonychia, indicating chronic iron deficiency), ridges, splitting, or clubbing.

Provide your final analysis in a detailed, clear 2-sentence clinical verdict in Indonesian, starting exactly with "Kuku: ". Be highly specific about what you observe.`;
    } else {
      prompt = `You are an expert pediatrician and clinical nutritionist. Analyze this photo with extreme precision.
FIRST, verify if this image contains a human face. If it is NOT a human face (e.g. it is a table, floor, chair, phone, wall, or empty space), you MUST respond EXACTLY with the text: "BUKAN_WAJAH".

Otherwise, if it is a valid human face, perform a detailed clinical analysis on the following features:
1. Nutritional state: Check for signs of wasting, severe thinness (kehilangan lemak subkutan di pipi, pipi kempot), or normal healthy fullness.
2. Swelling/Edema: Check for puffiness, swelling (edema/moon-face, indicating kwashiorkor/protein deficiency).
3. Face expression & fatigue: Check if the child/patient looks highly exhausted, lethargic, weak, or has signs of severe lack of sleep (wajah tampak lelah/sayu/kurang tidur).

Provide your final analysis in a detailed, clear 2-sentence clinical verdict in Indonesian, starting exactly with "Wajah: ". Be highly specific about what you observe.`;
    }

    let result = '';
    // Try Gemini first
    try {
      result = await fetchGemini(base64, prompt);
    } catch (geminiError: any) {
      console.warn(`[onlineRunner] Gemini failed, falling back to Groq Vision:`, geminiError.message);
      // Fallback to Groq Vision
      result = await fetchGroqVision(base64, prompt);
    }

    const cleanResult = result.trim();
    if (cleanResult.includes("BUKAN_MATA")) {
      throw new Error("BUKAN_MATA: Gambar tidak mendeteksi mata manusia. Silakan foto kelopak mata bawah anak secara fokus.");
    }
    if (cleanResult.includes("BUKAN_KUKU")) {
      throw new Error("BUKAN_KUKU: Gambar tidak mendeteksi kuku manusia. Silakan foto jari tangan anak secara fokus.");
    }
    if (cleanResult.includes("BUKAN_WAJAH")) {
      throw new Error("BUKAN_WAJAH: Gambar tidak mendeteksi wajah manusia. Silakan foto wajah anak secara simetris.");
    }

    return cleanResult;
  } catch (error: any) {
    console.error(`[onlineRunner] All online image analysis pipelines failed:`, error.message);
    throw error;
  }
}

async function fetchDeepSeek(prompt: string): Promise<string> {
  console.log("[onlineRunner] Attempting DeepSeek API call...");
  const response = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData?.error?.message || `HTTP ${response.status}`);
  }

  const resJson = await response.json();
  const text = resJson.choices?.[0]?.message?.content;
  if (text) {
    return text.trim();
  }
  throw new Error("No response content from DeepSeek");
}

export async function generateQuestionsOnline(patientName: string, ageYears: number, ageMonths: number): Promise<string[]> {
  const prompt = `Hasikan 4 pertanyaan kuesioner medis singkat (Yes/No) untuk menskrining gejala kurang gizi, anemia, stunting, atau masalah tumbuh kembang pada pasien bernama "${patientName}" berusia ${ageYears} tahun ${ageMonths} bulan.
Pertanyaan harus relevan dengan usia tersebut dan ditulis dalam Bahasa Indonesia yang sopan dan mudah dipahami orang tua.
Format keluaran HARUS berupa JSON array string sederhana berisi tepat 4 pertanyaan teks saja, contoh:
["Pertanyaan 1...", "Pertanyaan 2...", "Pertanyaan 3...", "Pertanyaan 4..."]
Jangan sertakan kata pengantar, penjelasan, atau markdown selain format JSON array tersebut.`;

  // Try DeepSeek first
  try {
    const reply = await fetchDeepSeek(prompt);
    const cleanReply = reply.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanReply);
    if (Array.isArray(parsed) && parsed.length === 4) {
      console.log("[onlineRunner] Custom questions generated successfully using DeepSeek.");
      return parsed;
    }
    throw new Error("Invalid array size from DeepSeek");
  } catch (deepseekErr: any) {
    console.warn("[onlineRunner] DeepSeek question generation failed, falling back to Groq:", deepseekErr.message);
  }

  try {
    console.log(`[onlineRunner] Generating questions from Groq for ${patientName}, age ${ageYears}y ${ageMonths}m...`);
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`Groq HTTP ${response.status}`);
    }

    const resJson = await response.json();
    let reply = resJson.choices?.[0]?.message?.content || '';
    
    // Clean JSON markdown if present
    reply = reply.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(reply);
    if (Array.isArray(parsed) && parsed.length === 4) {
      return parsed;
    }
    throw new Error("Invalid array size from Groq");
  } catch (e: any) {
    console.warn("[onlineRunner] Groq question generation failed, falling back to Gemini:", e.message);
    // Fallback to Gemini
    try {
      const geminiPrompt = `${prompt} (Format output: JSON array string)`;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: geminiPrompt }] }]
        })
      });
      if (response.ok) {
        const resJson = await response.json();
        let text = resJson.candidates?.[0]?.content?.parts?.[0]?.text || '';
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length === 4) {
          return parsed;
        }
      }
    } catch (geminiError: any) {
      console.warn("[onlineRunner] Gemini question generation fallback failed:", geminiError.message);
    }
    throw e;
  }
}

export async function generateIntegratedDiagnosisOnline(
  patientName: string,
  ageYears: number,
  ageMonths: number,
  eyeResult: string,
  nailResult: string,
  faceResult: string,
  answersJson: string,
  parentNotes: string
): Promise<{ summary: string; recommendation: string; level: 'rendah' | 'sedang' | 'tinggi' }> {
  const prompt = `Lakukan analisis klinis gizi terintegrasi untuk pasien:
Nama: ${patientName}
Usia: ${ageYears} tahun ${ageMonths} bulan
Hasil pemindaian mata: ${eyeResult}
Hasil pemindaian kuku: ${nailResult}
Hasil pemindaian wajah: ${faceResult}
Hasil kuesioner perilaku/gejala: ${answersJson}
Catatan tambahan orang tua: ${parentNotes}

Berdasarkan data di atas, tentukan tingkat risiko malnutrisi/anemia/stunting (rendah, sedang, atau tinggi), buat ringkasan singkat dalam Bahasa Indonesia, dan berikan rekomendasi gizi/medis terperinci.
Format keluaran HARUS berupa JSON objek sederhana dengan properti "summary" (string), "recommendation" (string), dan "level" (harus bernilai salah satu dari: "rendah", "sedang", atau "tinggi").
Contoh format output JSON:
{
  "summary": "Ringkasan analisis terintegrasi...",
  "recommendation": "Rekomendasi tindakan...",
  "level": "sedang"
}
Jangan sertakan kata pengantar, penjelasan, atau markdown selain format JSON tersebut.`;

  // Try DeepSeek first
  try {
    const reply = await fetchDeepSeek(prompt);
    const cleanReply = reply.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleanReply);
    if (parsed.summary && parsed.recommendation && (parsed.level === 'rendah' || parsed.level === 'sedang' || parsed.level === 'tinggi')) {
      console.log("[onlineRunner] Integrated diagnosis generated successfully using DeepSeek.");
      return parsed;
    }
    throw new Error("Invalid properties in JSON response from DeepSeek");
  } catch (deepseekErr: any) {
    console.warn("[onlineRunner] DeepSeek diagnosis generation failed, falling back to Groq:", deepseekErr.message);
  }

  try {
    console.log(`[onlineRunner] Generating integrated diagnosis from Groq...`);
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3
      })
    });

    if (!response.ok) {
      throw new Error(`Groq HTTP ${response.status}`);
    }

    const resJson = await response.json();
    let reply = resJson.choices?.[0]?.message?.content || '';
    
    reply = reply.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(reply);
    
    if (parsed.summary && parsed.recommendation && (parsed.level === 'rendah' || parsed.level === 'sedang' || parsed.level === 'tinggi')) {
      return parsed;
    }
    throw new Error("Invalid properties in JSON response from Groq");
  } catch (e: any) {
    console.warn("[onlineRunner] Groq diagnosis failed, falling back to Gemini:", e.message);
    try {
      const geminiPrompt = `${prompt} (Format output: JSON object)`;
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: geminiPrompt }] }]
        })
      });
      if (response.ok) {
        const resJson = await response.json();
        let text = resJson.candidates?.[0]?.content?.parts?.[0]?.text || '';
        text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(text);
        if (parsed.summary && parsed.recommendation && (parsed.level === 'rendah' || parsed.level === 'sedang' || parsed.level === 'tinggi')) {
          return parsed;
        }
      }
    } catch (geminiError: any) {
      console.warn("[onlineRunner] Gemini diagnosis fallback failed:", geminiError.message);
    }
    
    // Default fallback if all APIs fail
    return {
      summary: "Analisis gagal dimuat secara online. Menggunakan estimasi klinis dasar.",
      recommendation: "Silakan konsultasikan ke tenaga medis lokal secara langsung.",
      level: "sedang"
    };
  }
}
