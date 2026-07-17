import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  Alert
} from 'react-native';
import { getPatientById, Patient } from '../database/database';
import { useAppNavigation } from '../navigation/NavigationContext';
import { getAiMode } from '../ai/aiSettings';
import { generateQuestionsOnline } from '../ai/onlineRunner';

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
    }
  }, [isActive, patientId]);

  const handleAnswerSelect = (qId: number, answerVal: number) => {
    setQuestions(prev =>
      prev.map(q => (q.id === qId ? { ...q, answer: answerVal } : q))
    );
  };

  const handleProceed = () => {
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

    navigate('Scanner', {
      patientId,
      usiaTahun: ageYears,
      usiaBulan: ageMonths,
      score: totalScore,
      answersJson: JSON.stringify(answersList),
      parentalNotes: parentalNotes.trim()
    });
  };

  if (loading || !patient) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Memuat kuesioner...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigate('Home')}>
            <Text style={styles.backBtnText}>← Batal</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Kuesioner Kesehatan</Text>
          
          <View style={styles.patientBanner}>
            <View style={styles.patientInfoCol}>
              <Text style={styles.patientName}>{patient.nama_pasien}</Text>
              <Text style={styles.patientCategory}>Kategori: {ageCategory}</Text>
            </View>
            <View style={styles.ageBadge}>
              <Text style={styles.ageBadgeText}>{ageYears} Thn {ageMonths} Bln</Text>
            </View>
          </View>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Indikator Perilaku & Kondisi Umum</Text>
          <Text style={styles.sectionSubtitle}>Jawablah sesuai observasi langsung dalam beberapa minggu terakhir.</Text>

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

          {/* Parental Notes / Notes Text Area (Column 7) */}
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>Catatan Tambahan Orang Tua / Pengamat</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Masukkan riwayat gizi, alergi, atau catatan perkembangan anak di sini (Opsional)..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              value={parentalNotes}
              onChangeText={setParentalNotes}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleProceed}>
            <Text style={styles.submitBtnText}>Lanjutkan ke Pemindaian AI →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backBtn: {
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  patientBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  patientInfoCol: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  patientCategory: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  ageBadge: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  ageBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  formContainer: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 16,
  },
  qCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  qText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 20,
  },
  optionContainer: {
    flexDirection: 'row',
    marginTop: 14,
  },
  optionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    marginRight: 6,
  },
  optionNoSelected: {
    borderColor: '#10B981',
    backgroundColor: '#DEF7EC',
  },
  optionYesSelected: {
    borderColor: '#10B981',
    backgroundColor: '#DEF7EC',
  },
  optionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  optionTextNoSelected: {
    color: '#03543F',
  },
  optionTextYesSelected: {
    color: '#03543F',
  },
  notesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 100,
  },
  submitBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
});
