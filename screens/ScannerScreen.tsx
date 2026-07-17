import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
  Image,
  Alert,
  NativeModules,
  Platform,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { analyzeEyes, analyzeNails, analyzeFace, isBypassMode, setBypassMode } from '../ai/onnxRunner';
import { addScreeningSession, getPatientById, getScreeningSessions } from '../database/database';
import { useAppNavigation } from '../navigation/NavigationContext';
import { isModelDownloaded, createModelDownloadResumable, MODEL_LOCAL_URI } from '../ai/modelDownloader';
import { getAiMode, setAiMode, AiMode } from '../ai/aiSettings';
import { generateIntegratedDiagnosisOnline } from '../ai/onlineRunner';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { ChevronLeft, WifiOff, Check, Cpu, Info, RefreshCw, Camera } from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');
const overlaySize = screenWidth * 0.75;

const cleanErrorMessage = (msg: string): string => {
  if (!msg) return "Terjadi masalah koneksi ke server.";
  const lower = msg.toLowerCase();
  if (lower.includes("fetch failed") || lower.includes("network request failed")) {
    return "Koneksi internet Anda terputus atau server tidak dapat dihubungi.";
  }
  if (lower.includes("api_key_invalid") || lower.includes("key is invalid")) {
    return "Kunci API (API Key) server tidak valid atau sudah kedaluwarsa.";
  }
  if (lower.includes("rate limit") || lower.includes("429") || lower.includes("limit")) {
    return "Server terlalu sibuk (Limit Request terlampaui). Silakan coba beberapa saat lagi.";
  }
  if (lower.includes("500") || lower.includes("503") || lower.includes("internal server error")) {
    return "Server sedang mengalami gangguan internal (Service Unavailable).";
  }
  return msg;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  containerDark: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  statusBarSim: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 0 : 8,
    paddingBottom: 4,
  },
  timeSim: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a2332',
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5f4',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 9999,
    gap: 4,
  },
  offlineText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2d6b66',
  },
  setupHeader: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  backBtnSetup: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f0f4f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a2332',
  },
  setupContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  checkCircleLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#e6f6f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  setupStatusTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1a2332',
  },
  setupStatusSubtitle: {
    fontSize: 14,
    color: '#5a6b7e',
    fontWeight: '500',
    marginTop: 6,
    textAlign: 'center',
  },
  modelStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f4f3',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    width: '100%',
    marginTop: 32,
    marginBottom: 24,
  },
  modelIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modelTexts: {
    flex: 1,
  },
  modelNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2d6b66',
  },
  modelStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5a6b7e',
    marginTop: 2,
  },
  startScanBtn: {
    backgroundColor: '#1b5be8',
    height: 56,
    borderRadius: 16,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  startScanBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    zIndex: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  offlineBadgeDark: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 164, 154, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 4,
  },
  offlineTextDark: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00A49A',
  },
  stepTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#0F172A',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#1b5be8',
  },
  stepCircleCompleted: {
    backgroundColor: '#22c55e',
  },
  stepCircleInactive: {
    backgroundColor: '#334155',
  },
  stepCircleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepCircleTextActive: {
    color: '#ffffff',
  },
  stepCircleTextInactive: {
    color: '#8a9ab0',
  },
  stepConnector: {
    width: 32,
    height: 3,
  },
  stepConnectorActive: {
    backgroundColor: '#22c55e',
  },
  stepConnectorInactive: {
    backgroundColor: '#334155',
  },
  cameraWrapper: {
    flex: 1,
    backgroundColor: '#000000',
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: 'hidden',
  },
  camera: {
    flex: 1,
  },
  simulatedCamera: {
    flex: 1,
    backgroundColor: '#1e293b',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  previewImage: {
    flex: 1,
    resizeMode: 'cover',
  },
  simulatedCapturedImage: {
    flex: 1,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  capturedOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkCircleSmall: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#22c55e',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  photoTakenLabel: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  photoTakenLabelSmall: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
  },
  overlayMask: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  overlayMiddleRow: {
    flexDirection: 'row',
    height: overlaySize,
  },
  guideBox: {
    width: overlaySize,
    height: overlaySize,
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cornerTL: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 24,
    height: 24,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#1b5be8',
  },
  cornerTR: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 24,
    height: 24,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#1b5be8',
  },
  cornerBL: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 24,
    height: 24,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#1b5be8',
  },
  cornerBR: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#1b5be8',
  },
  scanLine: {
    position: 'absolute',
    left: 2,
    right: 2,
    height: 3,
    backgroundColor: '#00A49A',
  },
  footer: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 48,
  },
  instructionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 13,
    color: '#1a2332',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '700',
  },
  warningToast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1.5,
    borderColor: '#fde68a',
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
  },
  warningToastText: {
    flex: 1,
    fontSize: 11,
    color: '#92400e',
    fontWeight: '600',
    lineHeight: 15,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ghostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  ghostBtnHidden: {
    opacity: 0,
  },
  ghostBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  shutterBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 5,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterBtnInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1b5be8',
  },
  confirmBtn: {
    backgroundColor: '#1b5be8',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: '#334155',
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 40,
  },
  permissionEmoji: {
    fontSize: 60,
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1a2332',
    marginBottom: 8,
  },
  permissionSubtitle: {
    fontSize: 13,
    color: '#5a6b7e',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    fontWeight: '500',
  },
  permissionBtn: {
    backgroundColor: '#1b5be8',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  permissionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  bypassBtn: {
    backgroundColor: '#f0f4f8',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  bypassBtnText: {
    color: '#5a6b7e',
    fontWeight: '700',
    fontSize: 14,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  processingCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    width: screenWidth * 0.75,
  },
  processingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a2332',
    marginTop: 12,
  },
  navDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    gap: 6,
  },
  navDotsContainerDark: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    gap: 6,
  },
  navDot: {
    height: 6,
  },
  navDotActive: {
    width: 18,
    borderRadius: 9999,
    backgroundColor: '#1b5be8',
  },
  navDotInactive: {
    width: 6,
    borderRadius: 9999,
    backgroundColor: '#cbd5e0',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#5a6b7e',
    fontWeight: '600',
  },
});

interface ScannerScreenProps {
  params: {
    patientId: number;
    usiaTahun: number;
    usiaBulan: number;
    score: number;
    answersJson: string;
    parentalNotes: string;
  };
  isActive: boolean;
}

export default function ScannerScreen({ params, isActive }: ScannerScreenProps) {
  const { navigate } = useAppNavigation();
  const { patientId, usiaTahun, usiaBulan, score: questionnaireScore, answersJson, parentalNotes } = params;
  
  const [permission, requestPermission] = useCameraPermissions();
  
  // Phase state: 'setup' (Persiapan Sistem) or 'scanning' (Kamera Pemindaian)
  const [currentPhase, setCurrentPhase] = useState<'setup' | 'scanning'>('setup');
  
  const [currentStep, setCurrentStep] = useState(1); // 1: Mata, 2: Kuku, 3: Wajah
  const [processing, setProcessing] = useState(false);
  const [processingText, setProcessingText] = useState('');
  
  // Temporal captured photo path for previewing
  const [tempCapturedPath, setTempCapturedPath] = useState<string | null>(null);

  // Saved step photos paths
  const [eyePhotoPath, setEyePhotoPath] = useState<string | null>(null);
  const [nailPhotoPath, setNailPhotoPath] = useState<string | null>(null);
  const [facePhotoPath, setFacePhotoPath] = useState<string | null>(null);
  
  const [eyeAnalysis, setEyeAnalysis] = useState('');
  const [nailAnalysis, setNailAnalysis] = useState('');
  const [faceAnalysis, setFaceAnalysis] = useState('');
  
  const [activeMode, setActiveMode] = useState<AiMode>(getAiMode());
  const isBypass = activeMode === 'simulasi';
  const [downloadingModel, setDownloadingModel] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadBytesWritten, setDownloadBytesWritten] = useState(0);
  const [downloadBytesTotal, setDownloadBytesTotal] = useState(0);
  const [modelReady, setModelReady] = useState(true); // Defaults to true because MobileNetV2 is bundled in the assets
  const [useSimulatedCamera, setUseSimulatedCamera] = useState(false);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    if (permission?.granted) {
      setUseSimulatedCamera(false);
    }
  }, [permission?.granted]);

  // Scanning animation
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      setCurrentPhase('setup');
      setCurrentStep(1);
      setProcessing(false);
      setTempCapturedPath(null);
      setEyePhotoPath(null);
      setNailPhotoPath(null);
      setFacePhotoPath(null);
      startScanningAnimation();
    }
  }, [isActive]);

  const startScanningAnimation = () => {
    scanLineAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    ).start();
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Ambil Foto Kelopak Mata";
      case 2:
        return "Ambil Foto Kuku Jari";
      case 3:
      default:
        return "Ambil Foto Wajah";
    }
  };

  const getStepInstruction = () => {
    switch (currentStep) {
      case 1:
        return "Tarik perlahan kelopak mata bawah. Tahan dalam cahaya alami.";
      case 2:
        return "Posisikan kuku jari tangan anak di dalam area kotak pemandu.";
      case 3:
      default:
        return "Posisikan seluruh wajah anak secara simetris di dalam area kotak pemandu.";
    }
  };

  const handleImportModel = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        console.log("[Scanner] Model import canceled");
        return;
      }

      const pickedAsset = result.assets[0];
      const pickedUri = pickedAsset.uri;
      const pickedName = pickedAsset.name;

      if (!pickedName.endsWith('.onnx') && !pickedName.endsWith('.ort')) {
        Alert.alert("Berkas Tidak Valid", "Pastikan berkas yang Anda pilih memiliki format .onnx atau .ort");
        return;
      }

      setProcessing(true);
      setProcessingText("Menyalin berkas model ke penyimpanan lokal...");

      if (!FileSystem.documentDirectory) {
        throw new Error("Penyimpanan lokal tidak tersedia.");
      }
      // Ensure target directory exists
      const dirInfo = await FileSystem.getInfoAsync(FileSystem.documentDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory, { intermediates: true });
      }

      // Copy the picked file to MODEL_LOCAL_URI
      await FileSystem.copyAsync({
        from: pickedUri,
        to: MODEL_LOCAL_URI
      });

      console.log("[Scanner] Model sideloaded successfully to:", MODEL_LOCAL_URI);
      setModelReady(true);
      setAiMode('offline');
      setActiveMode('offline');
      Alert.alert("Selesai", "Model AI berhasil diimpor dan siap digunakan secara offline!");
    } catch (e: any) {
      console.error("[Scanner] Sideload failed:", e);
      Alert.alert("Impor Gagal", "Gagal mengimpor berkas model: " + e.message);
    } finally {
      setProcessing(false);
    }
  };

  const selectAiMode = () => {
    Alert.alert(
      "Pilih Mode Kecerdasan Buatan (AI)",
      "Pilih model pemrosesan pemindaian gizi offline/online:",
      [
        {
          text: "Online AI (Gemini & Groq)",
          onPress: () => {
            setAiMode('online');
            setActiveMode('online');
            Alert.alert("Mode Aktif", "Aplikasi menggunakan Online AI (Gemini & Groq).");
          }
        },
        {
          text: "Offline AI (ONNX Lokal)",
          onPress: async () => {
            const downloaded = await isModelDownloaded();
            if (!downloaded) {
              Alert.alert(
                "Model Belum Terunduh",
                "Model visual AI offline belum diunduh ke HP Anda. Ingin mengunduhnya sekarang?",
                [
                  { text: "Batal", style: "cancel" },
                  { text: "Unduh Sekarang", onPress: () => startModelDownload() }
                ]
              );
            } else {
              setAiMode('offline');
              setActiveMode('offline');
              Alert.alert("Mode Aktif", "Aplikasi menggunakan Offline AI (ONNX Lokal).");
            }
          }
        },
        {
          text: "Impor Model AI (.onnx)",
          onPress: () => {
            Alert.alert(
              "Rekomendasi Model AI",
              "Pilih berkas model visual AI berformat .onnx dari penyimpanan HP Anda.\n\n" +
              "Model yang direkomendasikan:\n" +
              "- MobileNetV2 (Sangat ringan, ~45MB)\n" +
              "- MobileNetV4 / EfficientNet-Lite (Efisien untuk deteksi visual)",
              [
                { text: "Batal", style: "cancel" },
                { text: "Pilih Berkas", onPress: () => handleImportModel() }
              ]
            );
          }
        },
        {
          text: "Mode Simulasi (Bypass)",
          onPress: () => {
            setAiMode('simulasi');
            setActiveMode('simulasi');
            Alert.alert("Mode Aktif", "Aplikasi menggunakan Mode Simulasi (Bypass AI).");
          }
        },
        {
          text: "Batal",
          style: "cancel"
        }
      ]
    );
  };

  const startModelDownload = async () => {
    try {
      setDownloadingModel(true);
      setDownloadProgress(0);
      setDownloadBytesWritten(0);
      setDownloadBytesTotal(0);

      if (!FileSystem.documentDirectory) {
        throw new Error("Penyimpanan lokal tidak tersedia.");
      }
      // Ensure target directory exists
      const dirInfo = await FileSystem.getInfoAsync(FileSystem.documentDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory, { intermediates: true });
      }

      const downloadTask = createModelDownloadResumable((progress, written, total) => {
        setDownloadProgress(progress);
        setDownloadBytesWritten(written);
        setDownloadBytesTotal(total);
      });

      console.log("[Scanner] Starting model download...");
      const result = await downloadTask.downloadAsync();
      
      if (result && result.uri) {
        console.log("[Scanner] Model downloaded to:", result.uri);
        setModelReady(true);
        setAiMode('offline');
        setActiveMode('offline');
        Alert.alert("Unduhan Selesai", "Model visual AI berhasil disimpan di penyimpanan lokal dan mode Offline AI aktif.");
      } else {
        throw new Error("Download returned null result");
      }
    } catch (e: any) {
      console.error("[Scanner] Failed to download model:", e);
      Alert.alert("Unduhan Gagal", "Gagal mengunduh model: " + e.message);
      setAiMode('simulasi');
      setActiveMode('simulasi');
    } finally {
      setDownloadingModel(false);
    }
  };

  // Click Shutter Button
  const handleCapture = async () => {
    if (processing || tempCapturedPath) return;

    try {
      setProcessing(true);
      setProcessingText("Mengambil gambar...");

      let photoUri = null;

      if (!useSimulatedCamera && cameraRef.current) {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: true
        });
        photoUri = photo.uri;
      } else {
        console.log("[Scanner] Using simulated mock capture");
        photoUri = "simulated_capture.jpg";
      }

      setProcessingText("Mengompresi gambar...");

      let compressedUri = photoUri;
      if (photoUri && photoUri !== "simulated_capture.jpg") {
        try {
          const saveFormat = (ImageManipulator.SaveFormat as any).WEBP || ImageManipulator.SaveFormat.JPEG;
          console.log("[Scanner] Compressing image with format:", saveFormat);
          const manipResult = await ImageManipulator.manipulateAsync(
            photoUri,
            [{ resize: { width: 600 } }],
            { compress: 0.6, format: saveFormat }
          );
          compressedUri = manipResult.uri;
          console.log("[Scanner] Compressed image successfully to:", compressedUri);
        } catch (manipError) {
          console.warn("[Scanner] Image manipulation failed:", manipError);
        }
      }

      setTempCapturedPath(compressedUri);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Terjadi kesalahan saat memproses gambar.");
    } finally {
      setProcessing(false);
    }
  };

  // Click Lanjut after photo is taken
  const handleConfirmPhoto = async () => {
    if (!tempCapturedPath) return;

    try {
      setProcessing(true);
      setProcessingText("Menganalisis gambar...");

      if (currentStep === 1) {
        const analysis = await analyzeEyes(tempCapturedPath, questionnaireScore, usiaTahun);
        setEyePhotoPath(tempCapturedPath);
        setEyeAnalysis(analysis);
        setTempCapturedPath(null);
        setCurrentStep(2);
      } else if (currentStep === 2) {
        const analysis = await analyzeNails(tempCapturedPath, questionnaireScore, usiaTahun);
        setNailPhotoPath(tempCapturedPath);
        setNailAnalysis(analysis);
        setTempCapturedPath(null);
        setCurrentStep(3);
      } else {
        const analysis = await analyzeFace(tempCapturedPath, questionnaireScore, usiaTahun);
        setFacePhotoPath(tempCapturedPath);
        setFaceAnalysis(analysis);

        setProcessingText("Menyimpan hasil...");
        await saveScreeningResult(eyePhotoPath, nailPhotoPath, tempCapturedPath, eyeAnalysis, nailAnalysis, analysis);
      }
    } catch (error: any) {
      console.error(error);
      const errMsg = error?.message || "";
      if (errMsg.includes("BUKAN_MATA") || errMsg.includes("BUKAN_KUKU") || errMsg.includes("BUKAN_WAJAH")) {
        const displayMsg = errMsg.split(": ").slice(1).join(": ") || errMsg;
        Alert.alert("Gambar Tidak Valid", displayMsg);
      } else {
        Alert.alert("Error Pemindaian", "Terjadi kesalahan saat memproses gambar. Detail: " + errMsg);
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleRetake = () => {
    setTempCapturedPath(null);
  };

  const saveScreeningResult = async (
    eyeImg: string | null,
    nailImg: string | null,
    faceImg: string | null,
    eyeResult: string,
    nailResult: string,
    faceResult: string
  ) => {
    let levelRisiko: 'rendah' | 'sedang' | 'tinggi' = 'rendah';
    let summaryText = '';
    let recommendationText = '';
    let prevSessionId: number | null = null;
    let statusPerbandingan: string | null = null;

    try {
      const history = await getScreeningSessions(patientId);
      if (history && history.length > 0) {
        const prevSession = history[0];
        prevSessionId = prevSession.id;
        
        // Calculate scores to determine progress
        const hasEyeAnemia = eyeResult.toLowerCase().includes("pucat") || eyeResult.toLowerCase().includes("resiko");
        const hasNailAnomaly = nailResult.toLowerCase().includes("cekung") || nailResult.toLowerCase().includes("resiko");
        const hasFaceAnomaly = faceResult.toLowerCase().includes("wasting") || faceResult.toLowerCase().includes("edema");

        let currentScore = 0;
        if (hasEyeAnemia) currentScore += 2;
        if (hasNailAnomaly) currentScore += 2;
        if (hasFaceAnomaly) currentScore += 2;
        currentScore += questionnaireScore;

        const hasPrevEye = prevSession.analisis_mata.toLowerCase().includes("pucat") || prevSession.analisis_mata.toLowerCase().includes("resiko");
        const hasPrevNail = prevSession.analisis_kuku.toLowerCase().includes("cekung") || prevSession.analisis_kuku.toLowerCase().includes("resiko");
        const hasPrevFace = prevSession.analisis_muka.toLowerCase().includes("wasting") || prevSession.analisis_muka.toLowerCase().includes("edema");

        let prevScore = 0;
        if (hasPrevEye) prevScore += 2;
        if (hasPrevNail) prevScore += 2;
        if (hasPrevFace) prevScore += 2;
        try {
          const parsedAnswers = JSON.parse(prevSession.jawaban_kuesioner);
          if (Array.isArray(parsedAnswers)) {
            prevScore += parsedAnswers.filter((a: any) => a.answer === 1).length;
          }
        } catch {}

        if (currentScore < prevScore) {
          statusPerbandingan = 'membaik';
        } else if (currentScore > prevScore) {
          statusPerbandingan = 'memburuk';
        } else {
          statusPerbandingan = 'belum_membaik';
        }
      }
    } catch (err) {
      console.warn("[Scanner] Pre-fetch history check failed:", err);
    }

    if (getAiMode() === 'online') {
      try {
        console.log("[Scanner] Fetching online integrated diagnosis from AI...");
        const patient = await getPatientById(patientId);
        const patientName = patient?.nama_pasien || 'Pasien';
        
        const onlineDiagnosis = await generateIntegratedDiagnosisOnline(
          patientName,
          usiaTahun,
          usiaBulan,
          eyeResult,
          nailResult,
          faceResult,
          answersJson,
          parentalNotes
        );

        levelRisiko = onlineDiagnosis.level;
        summaryText = onlineDiagnosis.summary;
        recommendationText = onlineDiagnosis.recommendation;
      } catch (e: any) {
        console.warn("[Scanner] Online diagnosis failed, falling back to static calculation:", e.message);
        Alert.alert(
          "Server AI Online Bermasalah",
          "Gagal menghubungi server AI (Groq/Gemini). Analisis terintegrasi akan dihitung secara lokal di HP Anda.\n\nDetail: " + cleanErrorMessage(e.message)
        );
      }
    }

    if (!summaryText || !recommendationText) {
      const summaryParts: string[] = [];
      const recommendationParts: string[] = [];

      const hasEyeAnemia = eyeResult.toLowerCase().includes("pucat") || eyeResult.toLowerCase().includes("resiko");
      const hasNailAnomaly = nailResult.toLowerCase().includes("cekung") || nailResult.toLowerCase().includes("resiko");
      const hasFaceAnomaly = faceResult.toLowerCase().includes("wasting") || faceResult.toLowerCase().includes("edema");

      let anomalyPoints = 0;
      if (hasEyeAnemia) anomalyPoints += 2;
      if (hasNailAnomaly) anomalyPoints += 2;
      if (hasFaceAnomaly) anomalyPoints += 2;
      anomalyPoints += questionnaireScore;

      if (anomalyPoints >= 5) {
        levelRisiko = 'tinggi';
      } else if (anomalyPoints >= 2) {
        levelRisiko = 'sedang';
      } else {
        levelRisiko = 'rendah';
      }

      // 1. Dynamic clinical explanation (NOT template) based on combinations of symptoms
      summaryParts.push("### Ringkasan Analisis Klinis AI Lokal (Offline)");
      
      let explanation = "";
      if (hasEyeAnemia && hasNailAnomaly && hasFaceAnomaly) {
        explanation = `Pasien menunjukkan indikasi malnutrisi energi-protein parah beserta anemia defisiensi besi kronis. Konjungtiva pucat berkorelasi kuat dengan kuku cekung (koilonychia) dan kelainan visual wajah. Hal ini menandakan menipisnya cadangan nutrisi dan zat besi tubuh secara sistemik.`;
      } else if (hasEyeAnemia && hasNailAnomaly) {
        explanation = `Terdeteksi indikasi anemia defisiensi besi yang signifikan. Gejala konjungtiva mata pucat yang disertai kuku cekung/sendok menunjukkan tubuh kekurangan mineral zat besi dalam jangka waktu lama (kronis).`;
      } else if (hasEyeAnemia && hasFaceAnomaly) {
        explanation = `Terdeteksi risiko malnutrisi sedang disertai anemia. Perubahan visual kelopak mata bawah yang pucat dan adanya tanda wasting/tipis pada pipi wajah memerlukan perhatian segera.`;
      } else if (hasEyeAnemia) {
        explanation = `Ditemukan indikasi konjungtiva mata yang pucat. Ini adalah tanda fisik awal dari gejala anemia atau kekurangan zat besi harian, namun bentuk kuku dan wajah terpantau dalam batas normal.`;
      } else if (hasNailAnomaly) {
        explanation = `Kelopak mata dan wajah normal, namun terdapat indikasi kuku cekung (sendok). Hal ini merupakan tanda awal klinis dari koilonychia yang dikaitkan dengan defisiensi zat gizi mikro kronis.`;
      } else if (hasFaceAnomaly) {
        explanation = `Ditemukan tanda fisik abnormal pada struktur wajah (indikasi kurus/wasting atau pembengkakan/edema ringan), sementara mata dan kuku normal. Perlu dievaluasi pemenuhan kalori dan protein harian.`;
      } else {
        explanation = `Tidak ditemukan kelainan fisik yang signifikan pada kelopak mata, kuku, maupun wajah. Indikator fisik menunjukkan tanda-tanda gizi seimbang yang sehat.`;
      }

      // Add questionnaire context
      if (questionnaireScore >= 3) {
        explanation += ` Faktor risiko diperberat oleh hasil kuesioner harian yang menunjukkan banyak gejala perilaku/gizi negatif (Skor Kuesioner: ${questionnaireScore}/4).`;
      } else if (questionnaireScore > 0) {
        explanation += ` Kuesioner mencatat beberapa keluhan gizi ringan (Skor Kuesioner: ${questionnaireScore}/4).`;
      } else {
        explanation += ` Hasil kuesioner juga mengonfirmasi tidak ada keluhan gejala/perilaku buruk (Skor Kuesioner: 0/4).`;
      }

      summaryParts.push(explanation);

      // 2. Fetch history database to implement local learning and comparative diagnostics
      let historyText = "";
      if (prevSessionId && statusPerbandingan) {
        try {
          const history = await getScreeningSessions(patientId);
          const totalSessions = history.length + 1;
          
          if (statusPerbandingan === 'membaik') {
            historyText = `🔄 **PEMBELAJARAN AI LOKAL (Tren Positif):**\nBerdasarkan data histori (${totalSessions} pemindaian), kondisi gizi pasien terpantau MEMBAIK dibandingkan pemeriksaan sebelumnya. AI lokal mengamati pemulihan gejala klinis. Pertahankan intervensi nutrisi Anda saat ini!`;
          } else if (statusPerbandingan === 'memburuk') {
            historyText = `🔄 **PEMBELAJARAN AI LOKAL (Peringatan Tren):**\nBerdasarkan data histori (${totalSessions} pemindaian), kondisi gizi pasien terpantau MEMBURUK dibandingkan pemeriksaan sebelumnya. Terjadi peningkatan akumulasi gejala klinis gizi buruk. Evaluasi ketat disarankan!`;
          } else {
            historyText = `🔄 **PEMBELAJARAN AI LOKAL (Tren Stabil/Stagnan):**\nBerdasarkan data histori (${totalSessions} pemindaian), kondisi gizi pasien terpantau STABIL/STAGNAN. Belum terlihat kemajuan signifikan dibandingkan pemeriksaan sebelumnya.`;
          }
        } catch {}
      } else {
        historyText = `🔄 **PEMBELAJARAN AI LOKAL (Pemindaian Awal):**\nIni adalah pemindaian pertama pasien. AI lokal mulai merekam basis data awal (baseline) kondisi gizi pasien guna mempelajari perkembangan tren kesehatan pada pemeriksaan berikutnya.`;
      }

      if (historyText) {
        summaryParts.push(historyText);
      }

      // 3. Dynamic recommendations (NOT template) based on level of risk and patient's age category
      recommendationParts.push("### Rekomendasi Nutrisi & Medis Adaptif");
      
      let recommendations: string[] = [];
      const isInfant = usiaTahun < 2; // Balita
      
      if (levelRisiko === 'tinggi') {
        recommendations.push(
          "🚨 **TINDAKAN DARURAT MEDIS:** Rujuk pasien segera ke Puskesmas, Posyandu, atau dokter spesialis anak untuk penanganan medis formal.",
          "🥛 **Intervensi Nutrisi Utama:**"
        );
        if (isInfant) {
          recommendations.push(
            "- Teruskan pemberian ASI Eksklusif / ASI Lanjutan sesering mungkin.",
            "- Tambahkan MP-ASI Padat Gizi: Berikan bubur tim dengan hati ayam, telur rebus matang (hancurkan), dan ikan kembung cincang.",
            "- Hindari makanan instan atau biskuit manis sebagai makanan utama."
          );
        } else {
          recommendations.push(
            "- Konsumsi protein hewani tinggi setiap hari: Minimal 2 butir telur rebus, daging merah, atau hati ayam secara rutin.",
            "- Berikan sayur kelor rebus atau bayam rebus untuk mendongkrak kadar zat besi harian.",
            "- Batasi pemberian teh, kopi, atau minuman bersoda setelah makan karena menghambat penyerapan zat besi."
          );
        }
        recommendations.push("- Berikan suplemen zat besi dan vitamin A sesuai dosis petunjuk dokter.");
      } else if (levelRisiko === 'sedang') {
        recommendations.push(
          "⚠️ **PEMANTAUAN BERKALA:** Jadwalkan pengukuran tinggi dan berat badan secara rutin di Posyandu terdekat setiap bulan.",
          "🍏 **Saran Modifikasi Diet Gizi Seimbang:**"
        );
        if (isInfant) {
          recommendations.push(
            "- Berikan MP-ASI gizi seimbang kaya protein lokal (tempe lumat, telur puyuh, sup ikan kelor).",
            "- Berikan selingan jus buah segar (pepaya atau jeruk lumat) untuk membantu absorpsi zat besi."
          );
        } else {
          recommendations.push(
            "- Variasikan menu makanan dengan lauk padat gizi (tahu, tempe, telur dadar kelor, ikan lokal).",
            "- Pastikan anak mendapatkan buah kaya vitamin C untuk mengoptimalkan penyerapan zat besi dari sayuran."
          );
        }
      } else {
        if (questionnaireScore > 0) {
          recommendations.push(
            "⚠️ **EVALUASI GEJALA RINGAN:** Kuesioner mencatat adanya keluhan perilaku/gejala gizi (Skor: " + questionnaireScore + "/4). Meskipun pemeriksaan fisik visual mata, kuku, dan wajah terdeteksi normal, keluhan gejala tubuh tidak boleh diabaikan begitu saja.",
            "💡 **Saran Tindakan Mandiri & Pemulihan:**",
            "- **Istirahat Cukup:** Jika anak mengeluh lemas, mengantuk, atau kurang tidur, pastikan waktu tidur malamnya tercukupi (minimal 8-10 jam tergantung usia) dan batasi aktivitas fisik berlebih untuk sementara.",
            "- **Hidrasi & Nutrisi Pemulihan:** Berikan air minum hangat yang cukup dan makanan yang mudah dicerna namun padat gizi (sup ayam, telur rebus, buah segar).",
            "- **Evaluasi Lanjutan:** Pantau kondisi anak selama 2-3 hari ke depan. Apabila rasa lemas/kelelahan berlanjut atau disertai demam, segera konsultasikan ke dokter atau Puskesmas terdekat."
          );
        } else {
          recommendations.push(
            "✅ **KONDISI SEHAT & NORMAL:** Pertahankan pola asuh dan pola makan yang berjalan saat ini.",
            "✨ **Saran Pemeliharaan Tumbuh Kembang:**",
            "- Berikan makanan bergizi 3 kali sehari ditambah camilan sehat (buah-buahan, olahan kacang hijau).",
            "- Jadwalkan pemindaian ulang Nura App rutin setiap 3 bulan sekali untuk pencegahan stunting dini."
          );
        }
      }

      recommendationParts.push(...recommendations);

      if (parentalNotes) {
        recommendationParts.push(`\n**Catatan Tambahan Pengamat:** ${parentalNotes}`);
      }

      summaryText = summaryParts.join("\n\n");
      recommendationText = recommendationParts.join("\n\n");
    }

    try {
      const sessionId = await addScreeningSession({
        patient_id: patientId,
        usia_tahun: usiaTahun,
        usia_bulan: usiaBulan,
        foto_muka_path: faceImg,
        foto_mata_path: eyeImg,
        foto_kuku_path: nailImg,
        analisis_muka: faceResult,
        analisis_mata: eyeResult,
        analisis_kuku: nailResult,
        jawaban_kuesioner: answersJson,
        analisis_gabungan: summaryText,
        rekomendasi: recommendationText,
        level_risiko: levelRisiko,
        sesi_tipe: prevSessionId ? 'tindak_lanjut' : 'awal',
        sesi_sebelumnya_id: prevSessionId,
        status_perbandingan: statusPerbandingan
      });

      console.log("[Scanner] Saved session with ID:", sessionId);
      navigate('Results', { sessionId });
    } catch (e) {
      console.error("[Scanner] Save error:", e);
      Alert.alert("Error", "Gagal menyimpan riwayat pemindaian.");
    }
  };

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, overlaySize - 4]
  });

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1b5be8" />
        <Text style={styles.loadingText}>Meminta izin kamera...</Text>
      </View>
    );
  }

  if (!permission.granted && !useSimulatedCamera) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Simulation Status Bar Area */}
        <View style={styles.statusBarSim}>
          <Text style={styles.timeSim}>9:41</Text>
          <View style={styles.offlineBadge}>
            <WifiOff size={13} color="#2D6B66" strokeWidth={2.5} />
            <Text style={styles.offlineText}>Offline</Text>
          </View>
        </View>
        
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionEmoji}>📷</Text>
          <Text style={styles.permissionTitle}>Akses Kamera Diperlukan</Text>
          <Text style={styles.permissionSubtitle}>
            Aplikasi membutuhkan akses kamera untuk memindai tanda visual fisik anak secara offline.
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Izinkan Kamera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bypassBtn} onPress={() => setUseSimulatedCamera(true)}>
            <Text style={styles.bypassBtnText}>Gunakan Kamera Simulasi (Bypass)</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // PHASE 1: Persiapan Sistem
  if (currentPhase === 'setup') {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.statusBarSim}>
          <Text style={styles.timeSim}>9:41</Text>
          <View style={styles.offlineBadge}>
            <WifiOff size={13} color="#2D6B66" strokeWidth={2.5} />
            <Text style={styles.offlineText}>Offline</Text>
          </View>
        </View>

        <View style={styles.setupHeader}>
          <TouchableOpacity style={styles.backBtnSetup} onPress={() => navigate('Home')}>
            <ChevronLeft size={22} color="#1A2332" strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.setupTitle}>Persiapan Sistem</Text>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.setupContent}>
          <View style={styles.checkCircleLarge}>
            <Check size={48} color="#00A49A" strokeWidth={4} />
          </View>
          
          <Text style={styles.setupStatusTitle}>Sistem Siap</Text>
          <Text style={styles.setupStatusSubtitle}>
            Pemeriksaan visual & gizi terintegrasi
          </Text>

          <View style={[styles.modelStatusCard, { marginTop: 24, marginBottom: 8 }]}>
            <View style={styles.modelIconBg}>
              <Cpu size={20} color="#00A49A" strokeWidth={2.5} />
            </View>
            <View style={styles.modelTexts}>
              <Text style={styles.modelNameText}>NURA-Scanner v2.1 (AI)</Text>
              <Text style={styles.modelStatusText}>
                {isBypass ? "Simulasi (Bypass Mode)" : "ONNX Engine Aktif"}
              </Text>
            </View>
          </View>

          <View style={[styles.modelStatusCard, { marginTop: 0, marginBottom: 24, backgroundColor: useSimulatedCamera ? '#fffbeb' : '#e6f4f3' }]}>
            <View style={styles.modelIconBg}>
              <Camera size={20} color={useSimulatedCamera ? '#d97706' : '#00A49A'} strokeWidth={2.5} />
            </View>
            <View style={styles.modelTexts}>
              <Text style={styles.modelNameText}>Kamera & Sensor Fisik</Text>
              <Text style={styles.modelStatusText}>
                {useSimulatedCamera ? "Simulasi Kamera Aktif" : "Kamera Fisik Siap"}
              </Text>
            </View>
            {/* Allow toggle if permission is granted, otherwise force simulation */}
            {permission?.granted && (
              <TouchableOpacity 
                style={{
                  backgroundColor: '#ffffff',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: '#cbd5e0'
                }}
                onPress={() => setUseSimulatedCamera(!useSimulatedCamera)}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#1a2332' }}>
                  {useSimulatedCamera ? "Gunakan Kamera" : "Gunakan Simulasi"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={styles.startScanBtn}
            onPress={() => setCurrentPhase('scanning')}
          >
            <Camera size={20} color="#ffffff" strokeWidth={2.5} style={{ marginRight: 8 }} />
            <Text style={styles.startScanBtnText}>Mulai Pemeriksaan Fisik</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Nav Dots Simulator */}
        <View style={styles.navDotsContainer}>
          {[...Array(9)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.navDot,
                i === 4 ? styles.navDotActive : styles.navDotInactive
              ]}
            />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  // PHASE 2: Kamera Pemindaian
  return (
    <SafeAreaView style={styles.containerDark}>
      <StatusBar barStyle="light-content" backgroundColor="#0F172A" />

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBackToSetup}>
          <ChevronLeft size={22} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.title}>{getStepTitle()}</Text>
        <View style={styles.offlineBadgeDark}>
          <WifiOff size={12} color="#00A49A" strokeWidth={2.5} />
          <Text style={styles.offlineTextDark}>Offline</Text>
        </View>
      </View>

      {/* Step indicators (Kelopak Mata -> Kuku Jari -> Wajah Penuh) */}
      <View style={styles.stepTabs}>
        {[1, 2, 3].map(step => (
          <React.Fragment key={step}>
            <View style={[
              styles.stepCircle,
              step === currentStep ? styles.stepCircleActive : (step < currentStep ? styles.stepCircleCompleted : styles.stepCircleInactive)
            ]}>
              {step < currentStep ? (
                <Check size={14} color="#ffffff" strokeWidth={3} />
              ) : (
                <Text style={[
                  styles.stepCircleText,
                  step === currentStep ? styles.stepCircleTextActive : styles.stepCircleTextInactive
                ]}>
                  {step}
                </Text>
              )}
            </View>
            {step < 3 && (
              <View style={[
                styles.stepConnector,
                step < currentStep ? styles.stepConnectorActive : styles.stepConnectorInactive
              ]} />
            )}
          </React.Fragment>
        ))}
      </View>

      {/* Camera Viewfinder */}
      <View style={styles.cameraWrapper}>
        {tempCapturedPath ? (
          /* Image Capture Preview */
          <View style={styles.previewContainer}>
            {tempCapturedPath === "simulated_capture.jpg" ? (
              <View style={styles.simulatedCapturedImage}>
                <Check size={52} color="#00A49A" strokeWidth={4} />
                <Text style={styles.photoTakenLabel}>Foto diambil</Text>
              </View>
            ) : (
              <View style={{ flex: 1, position: 'relative' }}>
                <Image source={{ uri: tempCapturedPath }} style={styles.previewImage} />
                <View style={styles.capturedOverlay}>
                  <View style={styles.checkmarkCircleSmall}>
                    <Check size={28} color="#ffffff" strokeWidth={4} />
                  </View>
                  <Text style={styles.photoTakenLabelSmall}>Foto diambil</Text>
                </View>
              </View>
            )}
          </View>
        ) : !useSimulatedCamera ? (
          /* Real Camera Stream */
          <CameraView style={styles.camera} ref={cameraRef} facing="back">
            <View style={styles.overlayContainer}>
              <View style={styles.overlayMask} />
              <View style={styles.overlayMiddleRow}>
                <View style={styles.overlayMask} />
                <View style={styles.guideBox}>
                  <View style={styles.cornerTL} />
                  <View style={styles.cornerTR} />
                  <View style={styles.cornerBL} />
                  <View style={styles.cornerBR} />
                  
                  {/* Scan Line */}
                  <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
                </View>
                <View style={styles.overlayMask} />
              </View>
              <View style={styles.overlayMask} />
            </View>
          </CameraView>
        ) : (
          /* Mock Viewfinder */
          <View style={styles.simulatedCamera}>
            <View style={styles.overlayContainer}>
              <View style={styles.overlayMask} />
              <View style={styles.overlayMiddleRow}>
                <View style={styles.overlayMask} />
                <View style={styles.guideBox}>
                  <View style={styles.cornerTL} />
                  <View style={styles.cornerTR} />
                  <View style={styles.cornerBL} />
                  <View style={styles.cornerBR} />
                  <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
                </View>
                <View style={styles.overlayMask} />
              </View>
              <View style={styles.overlayMask} />
            </View>
          </View>
        )}
      </View>
        {/* Footer Area */}
      <View style={styles.footer}>
        {/* Instruction text Card */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionText}>{getStepInstruction()}</Text>
        </View>

        {/* Warning Toast Banner */}
        <View style={styles.warningToast}>
          <Info size={16} color="#d97706" strokeWidth={2.5} style={{ marginRight: 8 }} />
          <Text style={styles.warningToastText}>
            Pastikan anak berada di dekat cahaya alami untuk analisis yang akurat.
          </Text>
        </View>

        {/* Shutter & Controls Row */}
        <View style={styles.actions}>
          {/* Ulangi button */}
          <TouchableOpacity
            style={[styles.ghostBtn, !tempCapturedPath && styles.ghostBtnHidden]}
            onPress={handleRetake}
            disabled={!tempCapturedPath}
          >
            <RefreshCw size={16} color="#ffffff" strokeWidth={2.5} style={{ marginRight: 6 }} />
            <Text style={styles.ghostBtnText}>Ulangi</Text>
          </TouchableOpacity>

          {/* Shutter Circle */}
          {!tempCapturedPath ? (
            <TouchableOpacity style={styles.shutterBtn} onPress={handleCapture} disabled={processing}>
              <View style={styles.shutterBtnInner} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 64, height: 64 }} />
          )}

          {/* Lanjut button */}
          <TouchableOpacity
            style={[styles.confirmBtn, !tempCapturedPath && styles.confirmBtnDisabled]}
            onPress={handleConfirmPhoto}
            disabled={!tempCapturedPath}
          >
            <Text style={styles.confirmBtnText}>Lanjut  {'>'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Nav Dots Simulator */}
      <View style={styles.navDotsContainerDark}>
        {[...Array(9)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.navDot,
              i === 5 ? styles.navDotActive : styles.navDotInactive
            ]}
          />
        ))}
      </View>

      {/* Processing Loader Overlay */}
      {processing && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color="#1b5be8" />
            <Text style={styles.processingTitle}>{processingText}</Text>
          </View>
        </View>
      )}
      {/* Downloading Model Loader Overlay */}
      {downloadingModel && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.processingTitle}>Mengunduh Model AI Offline</Text>
            <Text style={styles.processingSubtitle}>
              Model visual AI (MobileNetV2) sedang diunduh ke HP Anda.
            </Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${downloadProgress * 100}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {`${(downloadBytesWritten / (1024 * 1024)).toFixed(1)} MB / ${(downloadBytesTotal / (1024 * 1024)).toFixed(1)} MB (${Math.round(downloadProgress * 100)}%)`}
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );

  function handleBackToSetup() {
    if (tempCapturedPath) {
      setTempCapturedPath(null);
    } else {
      setCurrentPhase('setup');
    }
  }
}
