import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Animated,
  Easing,
  Dimensions,
  Image,
  Alert
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { analyzeEyes, analyzeNails, analyzeFace, isBypassMode, setBypassMode } from '../ai/onnxRunner';
import { addScreeningSession, getPatientById } from '../database/database';
import { useAppNavigation } from '../navigation/NavigationContext';
import { isModelDownloaded, createModelDownloadResumable, MODEL_LOCAL_URI } from '../ai/modelDownloader';
import { getAiMode, setAiMode, AiMode } from '../ai/aiSettings';
import { generateIntegratedDiagnosisOnline } from '../ai/onlineRunner';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const overlaySize = screenWidth * 0.75;

interface ScannerScreenProps {
  params: {
    patientId: number;
    usiaTahun: number;
    usiaBulan: number;
    score: number; // Questionnaire score
    answersJson: string;
    parentalNotes: string;
  };
  isActive: boolean;
}

export default function ScannerScreen({ params, isActive }: ScannerScreenProps) {
  const { navigate } = useAppNavigation();
  const { patientId, usiaTahun, usiaBulan, score: questionnaireScore, answersJson, parentalNotes } = params;
  
  const [permission, requestPermission] = useCameraPermissions();
  const [currentStep, setCurrentStep] = useState(1); // 1: Mata, 2: Kuku, 3: Wajah
  const [processing, setProcessing] = useState(false);
  const [processingText, setProcessingText] = useState('');
  
  // Scanned data state
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
  const [modelReady, setModelReady] = useState(true); // Defaults to true because MobileNetV2 is bundled in the assets
  const cameraRef = useRef<any>(null);

  // Scanning animation
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      // Reset scanning steps
      setCurrentStep(1);
      setProcessing(false);
      setEyePhotoPath(null);
      setNailPhotoPath(null);
      setFacePhotoPath(null);
      
      // Start scanning animation loop
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
        return "Langkah 1/3: Pemindaian Mata";
      case 2:
        return "Langkah 2/3: Pemindaian Kuku";
      case 3:
      default:
        return "Langkah 3/3: Pemindaian Wajah";
    }
  };

  const getStepInstruction = () => {
    switch (currentStep) {
      case 1:
        return "Posisikan mata anak (fokus ke area kelopak mata bawah/konjungtiva) di dalam area kotak pemandu.";
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

      // Copy the picked file to MODEL_LOCAL_URI
      await FileSystem.copyAsync({
        from: pickedUri,
        to: MODEL_LOCAL_URI
      });

      console.log("[Scanner] Model sideloaded successfully to:", MODEL_LOCAL_URI);
      setModelReady(true);
      setBypassMode(false);
      setIsBypass(false);
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

      const downloadTask = createModelDownloadResumable((progress) => {
        setDownloadProgress(progress);
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
  const handleCapture = async () => {
    if (processing) return;

    try {
      setProcessing(true);
      setProcessingText("Mengambil gambar...");

      let photoUri = null;

      if (!isBypass && cameraRef.current) {
        // Take a real photo
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: true
        });
        photoUri = photo.uri;
      } else {
        // Bypass or no camera reference - use a simulated capture
        console.log("[Scanner] Using simulated mock capture");
        photoUri = "simulated_capture.jpg";
      }

      setProcessingText("Mengompresi gambar...");

      // Resize/Compress using ImageManipulator (except for simulated assets)
      let compressedUri = photoUri;
      if (photoUri && photoUri !== "simulated_capture.jpg") {
        try {
          const manipResult = await ImageManipulator.manipulateAsync(
            photoUri,
            [{ resize: { width: 500 } }],
            { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
          );
          compressedUri = manipResult.uri;
          console.log("[Scanner] Compressed image successfully:", compressedUri);
        } catch (manipError) {
          console.warn("[Scanner] Image manipulation failed, falling back to raw photo:", manipError);
        }
      }

      setProcessingText("Menganalisis dengan AI Lokal...");

      if (currentStep === 1) {
        setEyePhotoPath(compressedUri);
        const analysis = await analyzeEyes(compressedUri);
        setEyeAnalysis(analysis);
        setCurrentStep(2);
      } else if (currentStep === 2) {
        setNailPhotoPath(compressedUri);
        const analysis = await analyzeNails(compressedUri);
        setNailAnalysis(analysis);
        setCurrentStep(3);
      } else {
        setFacePhotoPath(compressedUri);
        const analysis = await analyzeFace(compressedUri);
        setFaceAnalysis(analysis);
        
        // Processing final output
        setProcessingText("Menyimpan hasil pemeriksaan...");
        await saveScreeningResult(eyePhotoPath, nailPhotoPath, compressedUri, eyeAnalysis, nailAnalysis, analysis);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error Pemindaian", "Terjadi kesalahan saat memproses gambar.");
    } finally {
      setProcessing(false);
    }
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
      }
    }

    if (!summaryText || !recommendationText) {
      const summaryParts: string[] = [];
      const recommendationParts: string[] = [];

      const hasEyeAnemia = eyeResult.includes("Pucat");
      const hasNailAnomaly = nailResult.includes("Cekung");

      let anomalyPoints = 0;
      if (hasEyeAnemia) anomalyPoints += 2;
      if (hasNailAnomaly) anomalyPoints += 2;
      anomalyPoints += questionnaireScore;

      if (anomalyPoints >= 4) {
        levelRisiko = 'tinggi';
        summaryParts.push("Peringatan: Terdeteksi risiko tinggi malnutrisi kronis (stunting) atau anemia berat.");
        recommendationParts.push(
          "Segera rujuk anak ke Puskesmas atau dokter anak terdekat untuk penanganan medis formal.",
          "Saran Nutrisi Darurat:",
          "- Berikan asupan protein tinggi secara teratur (Telur rebus 2 butir sehari, Ikan kembung, Hati ayam).",
          "- Berikan sayur hijau kaya zat besi seperti daun kelor yang direbus matang.",
          "- Hindari pemberian teh atau kopi karena menghambat penyerapan zat besi."
        );
      } else if (anomalyPoints >= 2) {
        levelRisiko = 'sedang';
        summaryParts.push("Perhatian: Terdeteksi indikasi risiko sedang. Diperlukan perbaikan pola makan dan observasi berkala.");
        recommendationParts.push(
          "Jadwalkan kunjungan ke Posyandu untuk pengukuran tinggi/berat badan berkala.",
          "Saran Gizi Tambahan:",
          "- Berikan lauk pauk padat gizi lokal seperti tempe, telur, dan olahan ikan kelor.",
          "- Pastikan anak mengonsumsi buah kaya vitamin C (jeruk, pepaya) untuk membantu penyerapan zat besi."
        );
      } else {
        levelRisiko = 'rendah';
        summaryParts.push("Kondisi kesehatan fisik anak terpantau normal. Tumbuh kembang terpantau sejalan dengan indikator gizi.");
        recommendationParts.push(
          "Pertahankan pola makan bergizi seimbang 3 kali sehari.",
          "Saran Pemeliharaan:",
          "- Pastikan anak mendapatkan ASI/susu sesuai kebutuhan usianya.",
          "- Lakukan skrining rutin setiap 3 bulan sekali."
        );
      }

      if (parentalNotes) {
        recommendationParts.push(`\nCatatan Tambahan Pengamat: ${parentalNotes}`);
      }

      summaryText = summaryParts.join("\n");
      recommendationText = recommendationParts.join("\n");
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
        sesi_tipe: 'awal',
        sesi_sebelumnya_id: null,
        status_perbandingan: null
      });

      console.log("Saved screening session with ID:", sessionId);
      navigate('Results', { sessionId });
    } catch (e) {
      console.error("Save screening session error:", e);
      Alert.alert("Error", "Gagal menyimpan riwayat pemindaian.");
    }
  };

  // Move scanning line
  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, overlaySize - 4]
  });

  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Meminta izin kamera...</Text>
      </View>
    );
  }

  if (!permission.granted && !isBypass) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionEmoji}>📷</Text>
          <Text style={styles.permissionTitle}>Akses Kamera Diperlukan</Text>
          <Text style={styles.permissionSubtitle}>
            Aplikasi membutuhkan akses kamera untuk memindai tanda visual fisik anak secara offline.
          </Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Izinkan Kamera</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.bypassBtn} onPress={selectAiMode}>
            <Text style={styles.bypassBtnText}>Gunakan Mode Simulasi (Bypass AI)</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigate('Home')}>
          <Text style={styles.backBtnText}>✕ Batal</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{getStepTitle()}</Text>
      </View>

      <View style={styles.cameraWrapper}>
        {!isBypass ? (
          <CameraView style={styles.camera} ref={cameraRef} facing="back" />
        ) : (
          <View style={styles.simulatedCamera}>
            <Text style={styles.simulatedCameraEmoji}>🖥️</Text>
            <Text style={styles.simulatedCameraText}>Mode Simulasi Aktif</Text>
            <Text style={styles.simulatedCameraSub}>Menghasilkan data tangkapan mock</Text>
          </View>
        )}

        {/* Camera overlay guide */}
        <View style={styles.overlayContainer}>
          <View style={styles.overlayMask} />
          <View style={styles.overlayMiddleRow}>
            <View style={styles.overlayMask} />
            <View style={styles.guideBox}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
              
              {/* Scanning animation line */}
              <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} />
            </View>
            <View style={styles.overlayMask} />
          </View>
          <View style={styles.overlayMask} />
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.instructionCard}>
          <Text style={styles.instructionText}>{getStepInstruction()}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.bypassToggle} onPress={selectAiMode}>
            <Text style={styles.bypassToggleText}>
              AI Mode:
            </Text>
            <View style={[
              styles.toggleDotContainer, 
              activeMode === 'online' && { backgroundColor: '#4F46E5', alignItems: 'center' },
              activeMode === 'offline' && { backgroundColor: '#10B981', alignItems: 'center' },
              activeMode === 'simulasi' && { backgroundColor: '#64748B', alignItems: 'center' }
            ]}>
              <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '900', textAlign: 'center' }}>
                {activeMode.toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureBtn} onPress={handleCapture} disabled={processing}>
            <View style={styles.captureBtnInner} />
          </TouchableOpacity>

          {/* Dummy alignment item */}
          <View style={{ width: 80 }} />
        </View>
      </View>

      {/* Processing Loader Overlay */}
      {processing && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={styles.processingTitle}>Pemrosesan AI Lokal</Text>
            <Text style={styles.processingSubtitle}>{processingText}</Text>
          </View>
        </View>
      )}


    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Dark slate background for scanning screen
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  backBtn: {
    marginRight: 16,
  },
  backBtnText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#000',
  },
  camera: {
    ...StyleSheet.absoluteFill,
  },
  simulatedCamera: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  simulatedCameraEmoji: {
    fontSize: 64,
    marginBottom: 12,
  },
  simulatedCameraText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  simulatedCameraSub: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
  },
  overlayContainer: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'space-between',
  },
  overlayMask: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
  },
  overlayMiddleRow: {
    flexDirection: 'row',
    height: overlaySize,
  },
  guideBox: {
    width: overlaySize,
    height: overlaySize,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cornerTL: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 24,
    height: 24,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#4F46E5',
  },
  cornerTR: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 24,
    height: 24,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#4F46E5',
  },
  cornerBL: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 24,
    height: 24,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#4F46E5',
  },
  cornerBR: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#4F46E5',
  },
  scanLine: {
    position: 'absolute',
    left: 2,
    right: 2,
    height: 2,
    backgroundColor: '#00F0FF',
    shadowColor: '#00F0FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },
  footer: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 16,
  },
  instructionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  instructionText: {
    fontSize: 13,
    color: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  bypassToggle: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
  },
  bypassToggleText: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  toggleDotContainer: {
    width: 40,
    height: 22,
    borderRadius: 11,
    padding: 2,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: '#10B981',
    alignItems: 'flex-end',
  },
  toggleInactive: {
    backgroundColor: '#475569',
    alignItems: 'flex-start',
  },
  toggleDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
  },
  captureBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureBtnInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94A3B8',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  permissionEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  permissionSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  permissionBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
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
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  bypassBtnText: {
    color: '#E2E8F0',
    fontWeight: '600',
    fontSize: 14,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  processingCard: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    width: screenWidth * 0.8,
  },
  processingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 16,
  },
  processingSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginTop: 8,
  },
});
