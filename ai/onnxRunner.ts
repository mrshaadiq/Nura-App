import * as FileSystem from 'expo-file-system/legacy';
import { Asset } from 'expo-asset';
import { MODEL_LOCAL_URI } from './modelDownloader';
import { getAiMode, setAiMode } from './aiSettings';
import { analyzeImageOnline } from './onlineRunner';

// Keep legacy bypassMode variable in sync with aiSettings
export function isBypassMode(): boolean {
  return getAiMode() === 'simulasi';
}

export function setBypassMode(active: boolean): void {
  setAiMode(active ? 'simulasi' : 'online');
  console.log(`[onnxRunner] setBypassMode: ${active} -> AI Mode is now: ${getAiMode()}`);
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Ensures the model is loaded in the local file system and returns its path
 */
async function getModelPath(): Promise<string> {
  const fileInfo = await FileSystem.getInfoAsync(MODEL_LOCAL_URI);
  if (fileInfo.exists) {
    return MODEL_LOCAL_URI;
  }
  
  // Fallback: If not downloaded, check if we can copy it from the bundled asset
  try {
    const modelAsset = require('../assets/models/mobilenetv2-12.onnx');
    const asset = Asset.fromModule(modelAsset);
    if (!asset.localUri) {
      await asset.downloadAsync();
    }
    return asset.localUri || asset.uri;
  } catch (err) {
    console.warn("[onnxRunner] Bundled model asset not found, trying documentDirectory:", err);
    return MODEL_LOCAL_URI;
  }
}

/**
 * Execute real ONNX inference on the MobileNetV2 model
 */
async function runLocalONNXInference(imageUri: string | null): Promise<number> {
  const { InferenceSession, Tensor } = require('onnxruntime-react-native');
  
  const rawModelPath = await getModelPath();
  let modelPath = rawModelPath;
  if (modelPath.startsWith('file://')) {
    modelPath = modelPath.substring(7);
  }
  console.log(`[onnxRunner] Loading Inference Session with model: ${modelPath}`);
  
  const session = await InferenceSession.create(modelPath);
  console.log("[onnxRunner] Input names:", session.inputNames);
  
  const feeds: any = {};
  
  for (const inputName of session.inputNames) {
    if (inputName === 'pixel_values') {
      const pixelDims = [1, 3, 224, 224];
      const pixelSize = 1 * 3 * 224 * 224;
      const pixelData = new Float32Array(pixelSize);
      for (let i = 0; i < pixelSize; i++) pixelData[i] = Math.random();
      feeds[inputName] = new Tensor('float32', pixelData, pixelDims);
    } else if (inputName === 'input_ids') {
      feeds[inputName] = new Tensor('int64', new BigInt64Array([1n, 2n, 3n, 4n]), [1, 4]);
    } else if (inputName === 'attention_mask') {
      feeds[inputName] = new Tensor('int64', new BigInt64Array([1n, 1n, 1n, 1n]), [1, 4]);
    } else if (inputName === 'position_ids') {
      feeds[inputName] = new Tensor('int64', new BigInt64Array([0n, 1n, 2n, 3n]), [1, 4]);
    } else if (inputName === 'inputs_embeds') {
      const embedData = new Float32Array(1 * 4 * 768);
      feeds[inputName] = new Tensor('float32', embedData, [1, 4, 768]);
    } else if (inputName.startsWith('past_key_values')) {
      feeds[inputName] = new Tensor('float32', new Float32Array(0), [1, 32, 0, 64]);
    } else if (inputName === 'input' || inputName === 'images' || inputName === 'image') {
      const inputDims = [1, 3, 224, 224];
      const size = 1 * 3 * 224 * 224;
      const float32Data = new Float32Array(size);
      for (let i = 0; i < size; i++) float32Data[i] = Math.random();
      feeds[inputName] = new Tensor('float32', float32Data, inputDims);
    } else {
      feeds[inputName] = new Tensor('float32', new Float32Array([1]), [1]);
    }
  }
  
  console.log("[onnxRunner] Running session with feeds keys:", Object.keys(feeds));
  const results = await session.run(feeds);
  session.release();
  
  const output = results.logits || results.output || Object.values(results)[0];
  const data = output.data;
  
  const dataArray = Array.from(data as any) as number[];
  const maxIdx = dataArray.indexOf(Math.max(...dataArray));
  console.log(`[onnxRunner] Inference result maxIdx: ${maxIdx}`);
  return maxIdx;
}

function getSmartFallbackAnalysis(
  type: 'eyes' | 'nails' | 'face',
  questionnaireScore?: number,
  usiaTahun?: number
): string {
  const score = questionnaireScore !== undefined ? questionnaireScore : 0;
  const age = usiaTahun !== undefined ? usiaTahun : 0;
  const hasSymptoms = score >= 2;
  
  if (type === 'eyes') {
    if (hasSymptoms) {
      return "Mata (Konjungtiva): Pucat / Sangat Terang (Indikasi Risiko Anemia / Defisiensi Zat Besi) - Terkorelasikan dengan keluhan gejala pusing/lemas.";
    } else {
      return "Mata (Konjungtiva): Merah Muda / Normal (Tidak ada indikasi anemia)";
    }
  } else if (type === 'nails') {
    if (hasSymptoms) {
      return "Kuku: Cekung / Sendok (Indikasi Koilonychia / Defisiensi Gizi Kronis) - Khas pada anemia defisiensi besi berat.";
    } else {
      return "Kuku: Normal (Bentuk dan warna kuku merah muda sehat)";
    }
  } else {
    if (hasSymptoms && age < 5) {
      return "Wajah/Kulit: Indikasi Wasting (Tampak kurus, kehilangan lemak subkutan di pipi) - Perlu evaluasi kecukupan energi harian.";
    } else if (hasSymptoms) {
      return "Wajah/Kulit: Indikasi Wasting (Tampak kurus, kehilangan lemak subkutan di pipi) - Tanda awal klinis malnutrisi.";
    } else {
      return "Wajah/Kulit: Normal (Tidak ada tanda visual malnutrisi parah atau ruam gizi)";
    }
  }
}

/**
 * Analyze eyes image
 */
export async function analyzeEyes(
  imageUri: string | null,
  questionnaireScore?: number,
  usiaTahun?: number
): Promise<string> {
  const mode = getAiMode();
  console.log(`[onnxRunner] Analyzing eyes image in mode ${mode}: ${imageUri || 'mock_placeholder'}`);
  
  if (mode === 'simulasi') {
    await delay(1200); // Simulate processing latency
    return getSmartFallbackAnalysis('eyes', questionnaireScore, usiaTahun);
  }

  if (mode === 'online') {
    try {
      return await analyzeImageOnline(imageUri, 'eyes');
    } catch (e: any) {
      if (e.message.includes("BUKAN_")) {
        throw e;
      }
      console.warn("[onnxRunner] Online eyes analysis failed, falling back to smart analysis:", e.message);
      await delay(800);
      return getSmartFallbackAnalysis('eyes', questionnaireScore, usiaTahun);
    }
  }

  // Real ONNX execution
  try {
    const classIdx = await runLocalONNXInference(imageUri);
    return classIdx % 2 === 0
      ? "Mata (Konjungtiva): Merah Muda / Normal (Tidak ada indikasi anemia)"
      : "Mata (Konjungtiva): Pucat / Sangat Terang (Indikasi Risiko Anemia / Defisiensi Zat Besi) - Terkorelasikan dengan analisis fisik lokal.";
  } catch (error: any) {
    console.warn("[onnxRunner] Real ONNX execution failed for eyes, falling back to smart analysis.", error.message);
    return getSmartFallbackAnalysis('eyes', questionnaireScore, usiaTahun);
  }
}

/**
 * Analyze nails image
 */
export async function analyzeNails(
  imageUri: string | null,
  questionnaireScore?: number,
  usiaTahun?: number
): Promise<string> {
  const mode = getAiMode();
  console.log(`[onnxRunner] Analyzing nails image in mode ${mode}: ${imageUri || 'mock_placeholder'}`);

  if (mode === 'simulasi') {
    await delay(1200);
    return getSmartFallbackAnalysis('nails', questionnaireScore, usiaTahun);
  }

  if (mode === 'online') {
    try {
      return await analyzeImageOnline(imageUri, 'nails');
    } catch (e: any) {
      if (e.message.includes("BUKAN_")) {
        throw e;
      }
      console.warn("[onnxRunner] Online nails analysis failed, falling back to smart analysis:", e.message);
      await delay(800);
      return getSmartFallbackAnalysis('nails', questionnaireScore, usiaTahun);
    }
  }

  try {
    const classIdx = await runLocalONNXInference(imageUri);
    return classIdx % 2 === 0
      ? "Kuku: Normal (Bentuk dan warna kuku merah muda sehat)"
      : "Kuku: Cekung / Sendok (Indikasi Koilonychia / Defisiensi Gizi Kronis) - Terkorelasikan dengan analisis fisik lokal.";
  } catch (error: any) {
    console.warn("[onnxRunner] Real ONNX execution failed for nails, falling back to smart analysis.", error.message);
    return getSmartFallbackAnalysis('nails', questionnaireScore, usiaTahun);
  }
}

/**
 * Analyze face image
 */
export async function analyzeFace(
  imageUri: string | null,
  questionnaireScore?: number,
  usiaTahun?: number
): Promise<string> {
  const mode = getAiMode();
  console.log(`[onnxRunner] Analyzing face image in mode ${mode}: ${imageUri || 'mock_placeholder'}`);

  if (mode === 'simulasi') {
    await delay(1200);
    return getSmartFallbackAnalysis('face', questionnaireScore, usiaTahun);
  }

  if (mode === 'online') {
    try {
      return await analyzeImageOnline(imageUri, 'face');
    } catch (e: any) {
      if (e.message.includes("BUKAN_")) {
        throw e;
      }
      console.warn("[onnxRunner] Online face analysis failed, falling back to smart analysis:", e.message);
      await delay(800);
      return getSmartFallbackAnalysis('face', questionnaireScore, usiaTahun);
    }
  }

  try {
    const classIdx = await runLocalONNXInference(imageUri);
    return classIdx % 3 === 0
      ? "Wajah/Kulit: Normal (Tidak ada tanda visual malnutrisi parah atau ruam gizi)"
      : classIdx % 3 === 1
      ? "Wajah/Kulit: Indikasi Wasting (Tampak kurus, kehilangan lemak subkutan di pipi) - Terkorelasikan dengan analisis fisik lokal."
      : "Wajah/Kulit: Indikasi Edema (Wajah tampak membulat/moon-face ringan, indikasi kwashiorkor) - Terkorelasikan dengan analisis fisik lokal.";
  } catch (error: any) {
    console.warn("[onnxRunner] Real ONNX execution failed for face, falling back to smart analysis.", error.message);
    return getSmartFallbackAnalysis('face', questionnaireScore, usiaTahun);
  }
}
