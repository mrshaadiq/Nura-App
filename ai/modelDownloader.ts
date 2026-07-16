import * as FileSystem from 'expo-file-system/legacy';

// Define the model file name and local path
export const MODEL_FILE_NAME = 'paligemma_int4.onnx';
export const MODEL_LOCAL_URI = FileSystem.documentDirectory + MODEL_FILE_NAME;

// Remote URL to download the model from (quantized PaliGemma/MobileNet vision model)
export const MODEL_REMOTE_URL = 'https://huggingface.co/antigravity-ai/paligemma-3b-pt-4bit-onnx/resolve/main/paligemma_int4.onnx';

/**
 * Check if the model file is already downloaded and present in local storage
 */
export async function isModelDownloaded(): Promise<boolean> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(MODEL_LOCAL_URI);
    return fileInfo.exists;
  } catch (error) {
    console.warn("[modelDownloader] Error checking model info:", error);
    return false;
  }
}

/**
 * Creates a resumable download task for the ONNX model
 * @param onProgress Callback to report download progress (0.0 to 1.0)
 */
export function createModelDownloadResumable(
  onProgress: (progress: number) => void
): FileSystem.DownloadResumable {
  const callback = (downloadProgress: any) => {
    if (downloadProgress.totalBytesExpectedToWrite > 0) {
      const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
      onProgress(progress);
    }
  };

  return FileSystem.createDownloadResumable(
    MODEL_REMOTE_URL,
    MODEL_LOCAL_URI,
    {},
    callback
  );
}

/**
 * Delete model file from local storage to free up space
 */
export async function deleteModelFile(): Promise<void> {
  try {
    const exists = await isModelDownloaded();
    if (exists) {
      await FileSystem.deleteAsync(MODEL_LOCAL_URI, { idempotent: true });
      console.log("[modelDownloader] Local model file deleted successfully.");
    }
  } catch (error) {
    console.error("[modelDownloader] Failed to delete model file:", error);
  }
}
