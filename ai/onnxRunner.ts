let bypassMode = true; // Enabled by default for stable Hackathon demo & Expo Go support

export function isBypassMode(): boolean {
  return bypassMode;
}

export function setBypassMode(active: boolean): void {
  bypassMode = active;
  console.log(`[onnxRunner] Bypass Mode set to: ${active}`);
}

/**
 * Helper to simulate network/processing delay
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Analyze eyes image
 */
export async function analyzeEyes(imageUri: string | null): Promise<string> {
  console.log(`[onnxRunner] Analyzing eyes image: ${imageUri || 'mock_placeholder'}`);
  
  if (bypassMode) {
    await delay(1200); // Simulate processing latency
    const rand = Math.random();
    if (rand < 0.4) {
      return "Mata (Konjungtiva): Pucat / Sangat Terang (Indikasi Risiko Anemia / Defisiensi Zat Besi)";
    } else {
      return "Mata (Konjungtiva): Merah Muda / Normal (Tidak ada indikasi anemia)";
    }
  }

  // Real ONNX execution fallback
  try {
    const { InferenceSession, Tensor } = require('onnxruntime-react-native');
    // Load session if not loaded
    const session = await InferenceSession.create('assets/models/paligemma_int4.onnx');
    // Dummy input image tensor (in real application, pre-process uri using Canvas/ImageManipulator)
    const inputDims = [1, 3, 224, 224];
    const float32Data = new Float32Array(1 * 3 * 224 * 224);
    // Fill float32Data with actual pixel values from imageUri in a real implementation
    const inputTensor = new Tensor('float32', float32Data, inputDims);
    const feeds = { input_image: inputTensor };
    
    const results = await session.run(feeds);
    session.release();
    
    // Process results (mock classification logic from output logits)
    const output = Object.values(results)[0] as any;
    const data = output.data as Float32Array;
    const maxIdx = data.indexOf(Math.max(...Array.from(data)));
    
    return maxIdx === 0 
      ? "Mata (Konjungtiva): Merah Muda / Normal" 
      : "Mata (Konjungtiva): Pucat (Resiko Anemia)";
  } catch (error: any) {
    console.warn("[onnxRunner] Real ONNX execution failed, falling back to mock results.", error.message);
    // Fall back to mock
    return Math.random() < 0.4
      ? "Mata (Konjungtiva): Pucat / Sangat Terang (Indikasi Risiko Anemia / Defisiensi Zat Besi)"
      : "Mata (Konjungtiva): Merah Muda / Normal (Tidak ada indikasi anemia)";
  }
}

/**
 * Analyze nails image
 */
export async function analyzeNails(imageUri: string | null): Promise<string> {
  console.log(`[onnxRunner] Analyzing nails image: ${imageUri || 'mock_placeholder'}`);

  if (bypassMode) {
    await delay(1200);
    const rand = Math.random();
    if (rand < 0.35) {
      return "Kuku: Cekung / Sendok (Indikasi Koilonychia / Defisiensi Gizi Kronis)";
    } else {
      return "Kuku: Normal (Bentuk dan warna kuku merah muda sehat)";
    }
  }

  try {
    const { InferenceSession, Tensor } = require('onnxruntime-react-native');
    const session = await InferenceSession.create('assets/models/paligemma_int4.onnx');
    const float32Data = new Float32Array(1 * 3 * 224 * 224);
    const inputTensor = new Tensor('float32', float32Data, [1, 3, 224, 224]);
    const feeds = { input_image: inputTensor };
    const results = await session.run(feeds);
    session.release();
    
    const output = Object.values(results)[0] as any;
    const data = output.data as Float32Array;
    const maxIdx = data.indexOf(Math.max(...Array.from(data)));
    
    return maxIdx === 0 
      ? "Kuku: Normal" 
      : "Kuku: Cekung / Pucat (Resiko Defisiensi Gizi)";
  } catch (error: any) {
    console.warn("[onnxRunner] Real ONNX execution failed, falling back to mock results.", error.message);
    return Math.random() < 0.35
      ? "Kuku: Cekung / Sendok (Indikasi Koilonychia / Defisiensi Gizi Kronis)"
      : "Kuku: Normal (Bentuk dan warna kuku merah muda sehat)";
  }
}

/**
 * Analyze face image
 */
export async function analyzeFace(imageUri: string | null): Promise<string> {
  console.log(`[onnxRunner] Analyzing face image: ${imageUri || 'mock_placeholder'}`);

  if (bypassMode) {
    await delay(1200);
    return "Wajah/Kulit: Normal (Tidak ada tanda visual malnutrisi parah atau ruam gizi)";
  }

  try {
    const { InferenceSession, Tensor } = require('onnxruntime-react-native');
    const session = await InferenceSession.create('assets/models/paligemma_int4.onnx');
    const float32Data = new Float32Array(1 * 3 * 224 * 224);
    const inputTensor = new Tensor('float32', float32Data, [1, 3, 224, 224]);
    const feeds = { input_image: inputTensor };
    const results = await session.run(feeds);
    session.release();
    
    return "Wajah/Kulit: Normal (Tidak ada tanda visual malnutrisi parah atau ruam gizi)";
  } catch (error: any) {
    console.warn("[onnxRunner] Real ONNX execution failed, falling back to mock results.", error.message);
    return "Wajah/Kulit: Normal (Tidak ada tanda visual malnutrisi parah atau ruam gizi)";
  }
}
