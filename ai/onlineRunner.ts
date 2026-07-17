import * as FileSystem from 'expo-file-system/legacy';

import { GEMINI_API_KEY, GROQ_API_KEY } from './env';
const GEMINI_MODEL = 'gemini-2.0-flash';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const GROQ_VISION_MODEL = 'llama-3.2-90b-vision-preview';

async function fetchGemini(base64Image: string, prompt: string): Promise<string> {
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
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
  try {
    console.log(`[onlineRunner] Attempting Groq Vision fallback using ${GROQ_VISION_MODEL}...`);
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_VISION_MODEL,
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
    return (resJson.choices?.[0]?.message?.content || '').trim();
  } catch (e: any) {
    console.error(`[onlineRunner] Groq Vision failed:`, e.message);
    throw e;
  }
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
      prompt = 'Analyze this eye (lower eyelid conjunctiva) photo. Detect if it looks pale/yellowish (indicating potential anemia or malnutrition) or normal healthy pink. Respond with a concise 1-sentence verdict in Indonesian. Format must start with "Mata (Konjungtiva): " followed by the result (e.g. "Mata (Konjungtiva): Pucat/Anomali..." or "Mata (Konjungtiva): Merah Muda/Normal...").';
    } else if (type === 'nails') {
      prompt = 'Analyze this nail photo. Detect if it looks spoon-shaped/koilonychia, pale, or normal pink and healthy. Respond with a concise 1-sentence verdict in Indonesian. Format must start with "Kuku: " followed by the result (e.g. "Kuku: Cekung/Koilonychia..." or "Kuku: Normal...").';
    } else {
      prompt = 'Analyze this face photo. Detect signs of wasting, severe thinness, or normal. Respond with a concise 1-sentence verdict in Indonesian. Format must start with "Wajah: " followed by the result (e.g. "Wajah: Pucat dan Kurus..." or "Wajah: Normal...").';
    }

    // Try Gemini first
    try {
      return await fetchGemini(base64, prompt);
    } catch (geminiError: any) {
      console.warn(`[onlineRunner] Gemini failed, falling back to Groq Vision:`, geminiError.message);
      // Fallback to Groq Vision
      return await fetchGroqVision(base64, prompt);
    }
  } catch (error: any) {
    console.error(`[onlineRunner] All online image analysis pipelines failed:`, error.message);
    throw error;
  }
}

export async function generateQuestionsOnline(patientName: string, ageYears: number, ageMonths: number): Promise<string[]> {
  const prompt = `Hasilkan 4 pertanyaan kuesioner medis singkat (Yes/No) untuk menskrining gejala kurang gizi, anemia, stunting, atau masalah tumbuh kembang pada pasien bernama "${patientName}" berusia ${ageYears} tahun ${ageMonths} bulan.
Pertanyaan harus relevan dengan usia tersebut dan ditulis dalam Bahasa Indonesia yang sopan dan mudah dipahami orang tua.
Format keluaran HARUS berupa JSON array string sederhana berisi tepat 4 pertanyaan teks saja, contoh:
["Pertanyaan 1...", "Pertanyaan 2...", "Pertanyaan 3...", "Pertanyaan 4..."]
Jangan sertakan kata pengantar, penjelasan, atau markdown selain format JSON array tersebut.`;

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
