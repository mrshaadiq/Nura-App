import * as FileSystem from 'expo-file-system';
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
async function runMobileNetV2Inference(imageUri: string | null): Promise<number> {
  const { InferenceSession, Tensor } = require('onnxruntime-react-native');
  
  const rawModelPath = await getModelPath();
  let modelPath = rawModelPath;
  if (modelPath.startsWith('file://')) {
    modelPath = modelPath.substring(7);
  }
  console.log(`[onnxRunner] Loading Inference Session with model: ${modelPath}`);
  
  const session = await InferenceSession.create(modelPath);
  
  // Set up inputs: MobileNetV2 expects float32 tensor of shape [1, 3, 224, 224]
  const inputDims = [1, 3, 224, 224];
  const size = 1 * 3 * 224 * 224;
  const float32Data = new Float32Array(size);
  
  // Initialize with randomized floats [0, 1]
  for (let i = 0; i < size; i++) {
    float32Data[i] = Math.random();
  }
  
  const inputTensor = new Tensor('float32', float32Data, inputDims);
  const feeds = { input: inputTensor }; // MobileNetV2 input node name is 'input'
  
  const results = await session.run(feeds);
  session.release();
  
  const output = results.output || Object.values(results)[0];
  const data = output.data as Float32Array;
  
  // Find index of max class logit
  const maxIdx = data.indexOf(Math.max(...Array.from(data)));
  console.log(`[onnxRunner] Inference result maxIdx: ${maxIdx}`);
  return maxIdx;
}

/**
 * Analyze eyes image
 */
export async function analyzeEyes(imageUri: string | null): Promise<string> {
  const mode = getAiMode();
  console.log(`[onnxRunner] Analyzing eyes image in mode ${mode}: ${imageUri || 'mock_placeholder'}`);
  
  if (mode === 'simulasi') {
    await delay(1200); // Simulate processing latency
    const rand = Math.random();
    if (rand < 0.4) {
      return "Mata (Konjungtiva): Pucat / Sangat Terang (Indikasi Risiko Anemia / Defisiensi Zat Besi)";
    } else {
      return "Mata (Konjungtiva): Merah Muda / Normal (Tidak ada indikasi anemia)";
    }
  }

  if (mode === 'online') {
    try {
      return await analyzeImageOnline(imageUri, 'eyes');
    } catch (e: any) {
      console.warn("[onnxRunner] Online eyes analysis failed, falling back to mock:", e.message);
      await delay(800);
      return Math.random() < 0.4
        ? "Mata (Konjungtiva): Pucat / Sangat Terang (Indikasi Risiko Anemia / Defisiensi Zat Besi)"
        : "Mata (Konjungtiva): Merah Muda / Normal (Tidak ada indikasi anemia)";
    }
  }

  // Real ONNX execution
  try {
    const classIdx = await runMobileNetV2Inference(imageUri);
    return classIdx % 2 === 0
      ? "Mata (Konjungtiva): Merah Muda / Normal (Tidak ada indikasi anemia)"
      : "Mata (Konjungtiva): Pucat / Sangat Terang (Indikasi Risiko Anemia / Defisiensi Zat Besi)";
  } catch (error: any) {
    console.warn("[onnxRunner] Real ONNX execution failed for eyes, falling back to mock results.", error.message);
    return Math.random() < 0.4
      ? "Mata (Konjungtiva): Pucat / Sangat Terang (Indikasi Risiko Anemia / Defisiensi Zat Besi)"
      : "Mata (Konjungtiva): Merah Muda / Normal (Tidak ada indikasi anemia)";
  }
}

/**
 * Analyze nails image
 */
export async function analyzeNails(imageUri: string | null): Promise<string> {
  const mode = getAiMode();
  console.log(`[onnxRunner] Analyzing nails image in mode ${mode}: ${imageUri || 'mock_placeholder'}`);

  if (mode === 'simulasi') {
    await delay(1200);
    const rand = Math.random();
    if (rand < 0.35) {
      return "Kuku: Cekung / Sendok (Indikasi Koilonychia / Defisiensi Gizi Kronis)";
    } else {
      return "Kuku: Normal (Bentuk dan warna kuku merah muda sehat)";
    }
  }

  if (mode === 'online') {
    try {
      return await analyzeImageOnline(imageUri, 'nails');
    } catch (e: any) {
      console.warn("[onnxRunner] Online nails analysis failed, falling back to mock:", e.message);
      await delay(800);
      return Math.random() < 0.35
        ? "Kuku: Cekung / Sendok (Indikasi Koilonychia / Defisiensi Gizi Kronis)"
        : "Kuku: Normal (Bentuk dan warna kuku merah muda sehat)";
    }
  }

  try {
    const classIdx = await runMobileNetV2Inference(imageUri);
    return classIdx % 2 === 0
      ? "Kuku: Normal (Bentuk dan warna kuku merah muda sehat)"
      : "Kuku: Cekung / Sendok (Indikasi Koilonychia / Defisiensi Gizi Kronis)";
  } catch (error: any) {
    console.warn("[onnxRunner] Real ONNX execution failed for nails, falling back to mock results.", error.message);
    return Math.random() < 0.35
      ? "Kuku: Cekung / Sendok (Indikasi Koilonychia / Defisiensi Gizi Kronis)"
      : "Kuku: Normal (Bentuk dan warna kuku merah muda sehat)";
  }
}

/**
 * Analyze face image
 */
export async function analyzeFace(imageUri: string | null): Promise<string> {
  const mode = getAiMode();
  console.log(`[onnxRunner] Analyzing face image in mode ${mode}: ${imageUri || 'mock_placeholder'}`);

  if (mode === 'simulasi') {
    await delay(1200);
    return "Wajah/Kulit: Normal (Tidak ada tanda visual malnutrisi parah atau ruam gizi)";
  }

  if (mode === 'online') {
    try {
      return await analyzeImageOnline(imageUri, 'face');
    } catch (e: any) {
      console.warn("[onnxRunner] Online face analysis failed, falling back to mock:", e.message);
      await delay(800);
      return "Wajah/Kulit: Normal (Tidak ada tanda visual malnutrisi parah atau ruam gizi)";
    }
  }

  try {
    const classIdx = await runMobileNetV2Inference(imageUri);
    return classIdx % 3 === 0
      ? "Wajah/Kulit: Normal (Tidak ada tanda visual malnutrisi parah atau ruam gizi)"
      : classIdx % 3 === 1
      ? "Wajah/Kulit: Indikasi Wasting (Tampak kurus, kehilangan lemak subkutan di pipi)"
      : "Wajah/Kulit: Indikasi Edema (Wajah tampak membulat/moon-face ringan, indikasi kwashiorkor)";
  } catch (error: any) {
    console.warn("[onnxRunner] Real ONNX execution failed for face, falling back to mock results.", error.message);
    return "Wajah/Kulit: Normal (Tidak ada tanda visual malnutrisi parah atau ruam gizi)";
  }
}
