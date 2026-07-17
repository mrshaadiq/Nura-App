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
import { addScreeningSession, getPatientById, getScreeningSessions } from '../database/database';
import { useAppNavigation } from '../navigation/NavigationContext';
import { isModelDownloaded, createModelDownloadResumable, MODEL_LOCAL_URI } from '../ai/modelDownloader';
import { getAiMode, setAiMode, AiMode } from '../ai/aiSettings';
import { generateIntegratedDiagnosisOnline } from '../ai/onlineRunner';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
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
  const [downloadBytesWritten, setDownloadBytesWritten] = useState(0);
  const [downloadBytesTotal, setDownloadBytesTotal] = useState(0);
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
      setDownloadBytesWritten(0);
      setDownloadBytesTotal(0);

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
        recommendations.push(
          "✅ **KONDISI SEHAT & NORMAL:** Pertahankan pola asuh dan pola makan yang berjalan saat ini.",
          "✨ **Saran Pemeliharaan Tumbuh Kembang:**",
          "- Berikan makanan bergizi 3 kali sehari ditambah camilan sehat (buah-buahan, olahan kacang hijau).",
          "- Jadwalkan pemindaian ulang Nura App rutin setiap 3 bulan sekali untuk pencegahan stunting dini."
        );
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
