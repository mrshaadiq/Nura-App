import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
  StatusBar,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPatientById, Patient } from '../database/database';
import { useAppNavigation } from '../navigation/NavigationContext';
import { getAiMode } from '../ai/aiSettings';
import { generateQuestionsOnline } from '../ai/onlineRunner';
import { ChevronLeft, WifiOff, Scale, Info, Cpu } from 'lucide-react-native';

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

interface QuestionnaireScreenProps {
  params: { patientId: number };
  isActive: boolean;
}

interface Question {
  id: number;
  text: string;
  answer: number; // -1: unanswered, 0: No, 1: Yes
}

export default function QuestionnaireScreen({ params, isActive }: QuestionnaireScreenProps) {
  const { navigate } = useAppNavigation();
  const { patientId } = params;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [ageYears, setAgeYears] = useState(0);
  const [ageMonths, setAgeMonths] = useState(0);
  const [ageCategory, setAgeCategory] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [parentalNotes, setParentalNotes] = useState('');

  // Flow wizard steps
  const [wizardStep, setWizardStep] = useState(1); // 1: Measurements, 2: Questionnaire

  // Measurements state
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [bmi, setBmi] = useState<number | null>(null);
  const [stuntingStatus, setStuntingStatus] = useState<string>('—');

  const calculateAge = (dobString: string) => {
    const dob = new Date(dobString);
    const today = new Date();
    
    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();
    
    if (months < 0 || (months === 0 && today.getDate() < dob.getDate())) {
      years--;
      months = 12 + months;
    }
    
    if (today.getDate() < dob.getDate()) {
      months--;
    }
    
    return { years, months };
  };

  // WHO stunting thresholds based on age (in months) and height (in cm)
  const evaluateStunting = (monthsTotal: number, hCm: number, isFemale: boolean) => {
    if (hCm <= 0) return '—';

    // Approximate WHO -2 SD Height Thresholds
    let minNormalHeight = 0;
    
    if (isFemale) {
      if (monthsTotal <= 3) minNormalHeight = 55.6;
      else if (monthsTotal <= 6) minNormalHeight = 61.2;
      else if (monthsTotal <= 12) minNormalHeight = 68.9;
      else if (monthsTotal <= 18) minNormalHeight = 74.9;
      else if (monthsTotal <= 24) minNormalHeight = 80.0;
      else if (monthsTotal <= 36) minNormalHeight = 87.4;
      else if (monthsTotal <= 48) minNormalHeight = 94.1;
      else if (monthsTotal <= 60) minNormalHeight = 99.9;
      else minNormalHeight = monthsTotal * 0.5 + 68;
    } else {
      if (monthsTotal <= 3) minNormalHeight = 57.3;
      else if (monthsTotal <= 6) minNormalHeight = 63.3;
      else if (monthsTotal <= 12) minNormalHeight = 71.0;
      else if (monthsTotal <= 18) minNormalHeight = 76.9;
      else if (monthsTotal <= 24) minNormalHeight = 81.7;
      else if (monthsTotal <= 36) minNormalHeight = 88.7;
      else if (monthsTotal <= 48) minNormalHeight = 94.9;
      else if (monthsTotal <= 60) minNormalHeight = 100.7;
      else minNormalHeight = monthsTotal * 0.5 + 70;
    }

    if (hCm < minNormalHeight - 5) {
      return 'Sangat Pendek';
    } else if (hCm < minNormalHeight) {
      return 'Pendek (Risiko Stunting)';
    } else {
      return 'Normal';
    }
  };

  // Recalculate BMI and WHO stunting status when weight or height changes
  useEffect(() => {
    const wVal = parseFloat(weight);
    const hVal = parseFloat(height);

    if (wVal > 0 && hVal > 0) {
      const calculatedBmi = wVal / ((hVal / 100) * (hVal / 100));
      setBmi(calculatedBmi);

      const totalMonths = (ageYears * 12) + ageMonths;
      const stunting = evaluateStunting(totalMonths, hVal, patient?.jenis_kelamin === 'P');
      setStuntingStatus(stunting);
    } else {
      setBmi(null);
      setStuntingStatus('—');
    }
  }, [weight, height, ageYears, ageMonths, patient]);

  const loadPatientData = async () => {
    try {
      setLoading(true);
      const p = await getPatientById(patientId);
      if (p) {
        setPatient(p);
        const { years, months } = calculateAge(p.tanggal_lahir);
        setAgeYears(years);
        setAgeMonths(months);

        // Determine category and load appropriate questions
        let cat = '';
        let qList: string[] = [];

        if (years < 2) {
          cat = 'Balita (0 - 2 Tahun)';
          qList = [
            "Apakah berat badan anak tidak naik/turun di KMS dalam 2 bulan terakhir?",
            "Apakah anak terlihat lemas, lesu, dan kurang aktif bergerak?",
            "Apakah anak menolak atau kesulitan saat diberi makan/menyusu?",
            "Apakah anak kesulitan menatap mata orang tua atau tidak merespons suara?"
          ];
        } else if (years <= 5) {
          cat = 'Prasekolah (3 - 5 Tahun)';
          qList = [
            "Apakah nafsu makan anak sangat rendah dan menolak makan sayur/protein?",
            "Apakah anak sering mengalami tantrum parah atau ketakutan berlebihan?",
            "Apakah anak sering mengamuk atau melukai dirinya sendiri/orang lain?",
            "Apakah anak belum lancar mengucapkan kata/kalimat sederhana?"
          ];
        } else if (years <= 12) {
          cat = 'Anak Sekolah (6 - 12 Tahun)';
          qList = [
            "Apakah anak sering murung, menyendiri, dan menarik diri dari teman bermain?",
            "Apakah anak sering mengeluhkan pusing, sakit perut, atau lelah berlebihan?",
            "Apakah anak kesulitan fokus belajar dan nilainya menurun drastis?",
            "Apakah anak sering terbangun di malam hari karena mimpi buruk?"
          ];
        } else {
          cat = 'Remaja / Dewasa (>12 Tahun)';
          qList = [
            "Apakah Anda sering merasa sangat lemas, cepat lelah, lemas, atau mengantuk sepanjang hari?",
            "Apakah Anda mengalami penurunan berat badan drastis secara tidak sehat dalam beberapa bulan terakhir?",
            "Apakah Anda sering melewatkan makan utama atau sangat jarang mengonsumsi makanan kaya zat besi/protein (seperti daging, telur, sayur hijau)?",
            "Apakah Anda sering mengalami pusing, mata berkunang-kunang, atau kulit/wajah terlihat pucat?"
          ];
        }

        setAgeCategory(cat);

        if (getAiMode() === 'online') {
          try {
            console.log("[Questionnaire] Online mode active. Fetching custom questions from AI...");
            const aiQuestions = await generateQuestionsOnline(p.nama_pasien, years, months);
            qList = aiQuestions;
          } catch (e: any) {
            console.warn("[Questionnaire] Failed to fetch custom AI questions, falling back to static questions.", e.message);
            Alert.alert(
              "Server AI Online Bermasalah",
              "Gagal menghubungi server AI (Groq/Gemini). Aplikasi otomatis beralih menggunakan kuesioner bawaan.\n\nDetail: " + cleanErrorMessage(e.message)
            );
          }
        }

        setQuestions(
          qList.map((qText, idx) => ({
            id: idx + 1,
            text: qText,
            answer: -1
          }))
        );
      } else {
        Alert.alert('Error', 'Data pasien tidak ditemukan.');
        navigate('Home');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal memuat data pasien.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isActive) {
      loadPatientData();
      setWizardStep(1); // Reset to Step 1
      setWeight('');
      setHeight('');
    }
  }, [isActive, patientId]);

  const handleAnswerSelect = (qId: number, answerVal: number) => {
    setQuestions(prev =>
      prev.map(q => (q.id === qId ? { ...q, answer: answerVal } : q))
    );
  };

  const handleProceed = () => {
    if (wizardStep === 1) {
      // Validate measurements
      const wVal = parseFloat(weight);
      const hVal = parseFloat(height);
      if (isNaN(wVal) || wVal <= 0 || isNaN(hVal) || hVal <= 0) {
        Alert.alert('Input Tidak Valid', 'Silakan masukkan berat badan dan tinggi badan yang valid.');
        return;
      }
      setWizardStep(2); // Go to questions step
    } else {
      // Validate questionnaire
      const unanswered = questions.some(q => q.answer === -1);
      if (unanswered) {
        Alert.alert('Data Belum Lengkap', 'Silakan jawab semua pertanyaan kuesioner sebelum melanjutkan.');
        return;
      }

      const totalScore = questions.reduce((sum, q) => sum + (q.answer === 1 ? 1 : 0), 0);
      const answersList = questions.map(q => ({
        question: q.text,
        score: q.answer === 1 ? 1 : 0
      }));

      // Serialize physical parameters in parentalNotes to keep DB backward-compatible
      const serializedNotes = `[FISIK] BB: ${weight} kg, TB: ${height} cm, BMI: ${bmi?.toFixed(1)}, Status: ${stuntingStatus}. ${parentalNotes.trim()}`;

      navigate('Scanner', {
        patientId,
        usiaTahun: ageYears,
        usiaBulan: ageMonths,
        score: totalScore,
        answersJson: JSON.stringify(answersList),
        parentalNotes: serializedNotes
      });
    }
  };

  const handleBack = () => {
    if (wizardStep === 2) {
      setWizardStep(1);
    } else {
      navigate('Home');
    }
  };

  if (loading || !patient) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1b5be8" />
        <Text style={styles.loadingText}>Memuat data...</Text>
      </View>
    );
  }

  const totalAgeMonths = (ageYears * 12) + ageMonths;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Simulation Status Bar Area */}
      <View style={styles.statusBarSim}>
        <Text style={styles.timeSim}>9:41</Text>
        <View style={styles.offlineBadge}>
          <WifiOff size={13} color="#2D6B66" strokeWidth={2.5} />
          <Text style={styles.offlineText}>Offline</Text>
        </View>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <ChevronLeft size={22} color="#1A2332" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {wizardStep === 1 ? 'Berat & Tinggi Badan' : 'Kuesioner Kesehatan'}
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {wizardStep === 1 ? (
          /* STEP 1: Measurements (Berat & Tinggi Badan) */
          <View style={styles.stepContainer}>
            {/* Input Berat Badan */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Berat Badan (kg)</Text>
              <TextInput
                style={styles.input}
                placeholder="mis. 12.5"
                placeholderTextColor="#A0AEC0"
                keyboardType="numeric"
                value={weight}
                onChangeText={setWeight}
              />
            </View>

            {/* Input Tinggi Badan */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tinggi Badan (cm)</Text>
              <TextInput
                style={styles.input}
                placeholder="mis. 87"
                placeholderTextColor="#A0AEC0"
                keyboardType="numeric"
                value={height}
                onChangeText={setHeight}
              />
            </View>

            {/* BMI & Stunting Display Card */}
            <View style={styles.bmiDisplayCard}>
              <View style={styles.bmiCol}>
                <Text style={styles.bmiCardLabel}>Indeks Massa Tubuh (BMI)</Text>
                <Text style={styles.bmiCardValue}>
                  {bmi ? bmi.toFixed(1) : '—'}
                </Text>
                
                {bmi && (
                  <View style={[
                    styles.stuntingBadge,
                    stuntingStatus === 'Normal' ? styles.stuntingBadgeGreen : styles.stuntingBadgeAmber
                  ]}>
                    <Text style={[
                      styles.stuntingBadgeText,
                      stuntingStatus === 'Normal' ? styles.stuntingBadgeGreenText : styles.stuntingBadgeAmberText
                    ]}>
                      Status Tinggi: {stuntingStatus}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.scaleIconBg}>
                <Scale size={24} color="#8a9ab0" strokeWidth={2.5} />
              </View>
            </View>

            {/* Security/Local Notice Banner */}
            <View style={styles.localNotice}>
              <Cpu size={16} color="#00A49A" strokeWidth={2.5} style={{ marginRight: 8 }} />
              <Text style={styles.localNoticeText}>Tersimpan di memori perangkat</Text>
            </View>

            {/* Lanjut Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!weight || !height) && styles.submitBtnDisabled
              ]}
              onPress={handleProceed}
              activeOpacity={0.8}
            >
              <Text style={styles.submitBtnText}>Lanjut  {'>'}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* STEP 2: Behavior Questionnaire */
          <View style={styles.stepContainer}>
            {/* Child Info Banner */}
            <View style={styles.patientBanner}>
              <View style={styles.avatarMini}>
                <Text style={styles.avatarMiniText}>
                  {patient.nama_pasien.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.bannerInfo}>
                <Text style={styles.bannerName}>{patient.nama_pasien}</Text>
                <Text style={styles.bannerMeta}>{totalAgeMonths} bulan • {ageCategory}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Indikator Perilaku & Kondisi Umum</Text>
            <Text style={styles.sectionSubtitle}>
              Jawablah sesuai observasi langsung dalam beberapa minggu terakhir.
            </Text>

            {/* Questions List */}
            {questions.map((q, idx) => (
              <View key={q.id} style={styles.qCard}>
                <Text style={styles.qText}>{idx + 1}. {q.text}</Text>
                <View style={styles.optionContainer}>
                  <TouchableOpacity
                    style={[
                      styles.optionBtn,
                      q.answer === 0 && styles.optionNoSelected
                    ]}
                    onPress={() => handleAnswerSelect(q.id, 0)}
                  >
                    <Text style={[styles.optionBtnText, q.answer === 0 && styles.optionTextNoSelected]}>
                      Tidak (Normal)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.optionBtn,
                      q.answer === 1 && styles.optionYesSelected
                    ]}
                    onPress={() => handleAnswerSelect(q.id, 1)}
                  >
                    <Text style={[styles.optionBtnText, q.answer === 1 && styles.optionTextYesSelected]}>
                      Ya (Anomali)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Parental Notes textarea */}
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Catatan Tambahan Orang Tua / Pengamat</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Masukkan riwayat gizi, alergi, atau catatan perkembangan anak di sini (Opsional)..."
                placeholderTextColor="#A0AEC0"
                multiline
                numberOfLines={4}
                value={parentalNotes}
                onChangeText={setParentalNotes}
                textAlignVertical="top"
              />
            </View>

            {/* Lanjut Button */}
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleProceed}
              activeOpacity={0.8}
            >
              <Text style={styles.submitBtnText}>Lanjut  {'>'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Bottom Nav Dots Simulator */}
      <View style={styles.navDotsContainer}>
        {[...Array(9)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.navDot,
              (wizardStep === 1 && i === 2) || (wizardStep === 2 && i === 3)
                ? styles.navDotActive
                : styles.navDotInactive
            ]}
          />
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
  scrollContent: {
    paddingBottom: 60,
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f0f4f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a2332',
    textAlign: 'center',
  },
  stepContainer: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a2332',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#f0f4f8',
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1a2332',
    fontWeight: '600',
  },
  bmiDisplayCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(26, 35, 50, 0.08)',
    padding: 20,
    marginBottom: 20,
    marginTop: 8,
  },
  bmiCol: {
    flex: 1,
  },
  bmiCardLabel: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
    color: '#8a9ab0',
    marginBottom: 6,
  },
  bmiCardValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a2332',
    letterSpacing: -1,
  },
  stuntingBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
  },
  stuntingBadgeGreen: {
    backgroundColor: '#dcfce7',
  },
  stuntingBadgeAmber: {
    backgroundColor: '#fef9c3',
  },
  stuntingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stuntingBadgeGreenText: {
    color: '#16a34a',
  },
  stuntingBadgeAmberText: {
    color: '#ca8a04',
  },
  scaleIconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f0f4f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  localNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f4f3',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
  },
  localNoticeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2d6b66',
  },
  submitBtn: {
    backgroundColor: '#1b5be8',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#cbd5e0',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  patientBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: 'rgba(26, 35, 50, 0.08)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8f0fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarMiniText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1b5be8',
  },
  bannerInfo: {
    flex: 1,
  },
  bannerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a2332',
  },
  bannerMeta: {
    fontSize: 12,
    color: '#5a6b7e',
    fontWeight: '500',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1a2332',
    marginTop: 6,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#5a6b7e',
    fontWeight: '500',
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 16,
  },
  qCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(26, 35, 50, 0.08)',
    padding: 16,
    marginBottom: 14,
  },
  qText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a2332',
    lineHeight: 20,
    marginBottom: 12,
  },
  optionContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  optionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f0f4f8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5a6b7e',
  },
  optionNoSelected: {
    borderColor: '#22c55e',
    backgroundColor: '#dcfce7',
  },
  optionTextNoSelected: {
    color: '#16a34a',
  },
  optionYesSelected: {
    borderColor: '#e8635a',
    backgroundColor: '#fee2e2',
  },
  optionTextYesSelected: {
    color: '#e53e3e',
  },
  notesContainer: {
    marginBottom: 24,
  },
  notesLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a2332',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#f0f4f8',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1a2332',
    fontWeight: '600',
    minHeight: 80,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 13,
    color: '#5a6b7e',
    fontWeight: '500',
    marginTop: 10,
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
});
