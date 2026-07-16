import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Linking,
  Alert
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getScreeningSessionById, getPatientById, Patient, ScreeningSession } from '../database/database';

interface ResultsScreenProps {
  navigate: (screen: string, params?: any) => void;
  params: { sessionId: number };
  isActive: boolean;
}

interface QuestionAnswer {
  question: string;
  score: number;
}

export default function ResultsScreen({ navigate, params, isActive }: ResultsScreenProps) {
  const { sessionId } = params;
  const [session, setSession] = useState<ScreeningSession | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState<QuestionAnswer[]>([]);

  const loadData = async () => {
    try {
      setLoading(true);
      const s = await getScreeningSessionById(sessionId);
      if (s) {
        setSession(s);
        const p = await getPatientById(s.patient_id);
        setPatient(p);

        // Parse answers
        try {
          if (s.jawaban_kuesioner) {
            const parsed = JSON.parse(s.jawaban_kuesioner);
            setAnswers(parsed);
          }
        } catch (e) {
          console.error("Failed to parse answers JSON", e);
        }
      } else {
        Alert.alert('Error', 'Sesi skrining tidak ditemukan.');
        navigate('Home');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal memuat hasil pemeriksaan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isActive) {
      loadData();
    }
  }, [isActive, sessionId]);

  const openReferralMap = async () => {
    const url = "https://www.google.com/maps/search/Puskesmas+terdekat";
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Gagal Membuka Peta", "Aplikasi browser atau Google Maps tidak tersedia.");
    }
  };

  const exportPdfReport = async () => {
    if (!patient || !session) return;

    try {
      const formattedAnswers = answers.map((ans, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px; font-size: 11px;">${idx + 1}. ${ans.question}</td>
          <td style="padding: 8px; font-size: 11px; font-weight: bold; text-align: right; color: ${ans.score === 1 ? '#ef4444' : '#10b981'};">
            ${ans.score === 1 ? 'Ya (Anomali)' : 'Tidak (Normal)'}
          </td>
        </tr>
      `).join('');

      const riskColor = session.level_risiko === 'tinggi' ? '#ef4444' : session.level_risiko === 'sedang' ? '#f59e0b' : '#10b981';
      const riskBg = session.level_risiko === 'tinggi' ? '#fee2e2' : session.level_risiko === 'sedang' ? '#fef3c7' : '#def7ec';
      const formattedDate = new Date(session.created_at).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; padding: 25px; line-height: 1.5; }
              .header { border-bottom: 3px solid #4f46e5; padding-bottom: 15px; margin-bottom: 20px; }
              .app-logo { font-size: 14px; font-weight: bold; color: #4f46e5; text-transform: uppercase; margin-bottom: 5px; }
              .title { font-size: 20px; font-weight: 800; color: #0f172a; margin: 0; }
              .date { font-size: 11px; color: #64748b; margin-top: 4px; }
              .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; margin-top: 25px; margin-bottom: 12px; }
              .table { width: 100%; border-collapse: collapse; margin-top: 8px; }
              .table th { background: #f1f5f9; text-align: left; font-weight: bold; color: #475569; }
              .table th, .table td { border: 1px solid #e2e8f0; padding: 10px; font-size: 12px; }
              .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px; }
              .meta-item { font-size: 12px; }
              .meta-label { font-weight: bold; color: #64748b; }
              .badge { padding: 6px 12px; border-radius: 6px; font-weight: bold; display: inline-block; font-size: 11px; text-transform: uppercase; }
              .recommendation-box { background: #f8fafc; border-left: 4px solid #4f46e5; padding: 12px; border-radius: 0 8px 8px 0; font-size: 11px; color: #334155; white-space: pre-line; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="app-logo">Nura-App Local AI Visual Scanner</div>
              <div class="title">LAPORAN HASIL SKRINING GIZI & STUNTING</div>
              <div class="date">Waktu Pemeriksaan: ${formattedDate} | ID: #NS-${session.id}</div>
            </div>

            <div class="meta-grid">
              <div class="meta-item">
                <span class="meta-label">Nama Lengkap:</span> ${patient.nama_pasien}<br/>
                <span class="meta-label">Jenis Kelamin:</span> ${patient.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}<br/>
                <span class="meta-label">Tanggal Lahir:</span> ${patient.tanggal_lahir}
              </div>
              <div class="meta-item">
                <span class="meta-label">Usia Skrining:</span> ${session.usia_tahun} Tahun ${session.usia_bulan} Bulan<br/>
                <span class="meta-label">Tingkat Risiko:</span> 
                <span class="badge" style="background-color: ${riskBg}; color: ${riskColor};">${session.level_risiko}</span>
              </div>
            </div>

            <div class="section-title">Hasil Pemeriksaan Visual AI</div>
            <table class="table">
              <thead>
                <tr>
                  <th style="width: 30%;">Kanal Sensoris</th>
                  <th style="width: 70%;">Hasil Analisis AI</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-weight: bold;">Mata (Konjungtiva)</td>
                  <td>${session.analisis_mata}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold;">Kuku Jari</td>
                  <td>${session.analisis_kuku}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold;">Wajah & Kulit</td>
                  <td>${session.analisis_muka}</td>
                </tr>
              </tbody>
            </table>

            <div class="section-title">Jawaban Kuesioner Anomali</div>
            <table style="width: 100%; border-collapse: collapse;">
              ${formattedAnswers}
            </table>

            <div class="section-title">Sintesis Diagnosis & Rekomendasi Nutrisi</div>
            <div class="recommendation-box">
              <strong>Kesimpulan:</strong>
              ${session.analisis_gabungan}

              <strong>Rekomendasi Tindakan:</strong>
              ${session.rekomendasi}
            </div>
            
            <div style="margin-top: 40px; font-size: 10px; color: #94a3b8; text-align: center; border-top: 1px dashed #e2e8f0; padding-top: 10px;">
              Dokumen ini dihasilkan secara lokal oleh Nura App Mobile AI. Tidak memerlukan koneksi internet.
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Bagikan Laporan Kesehatan Nura' });
    } catch (e: any) {
      console.error(e);
      Alert.alert("Gagal PDF", "Gagal memproses dokumen PDF: " + e.message);
    }
  };

  if (loading || !session || !patient) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Membuat ringkasan diagnosis...</Text>
      </View>
    );
  }

  // Set card colors depending on risk
  const isHigh = session.level_risiko === 'tinggi';
  const isMed = session.level_risiko === 'sedang';

  const riskColor = isHigh ? '#EF4444' : isMed ? '#F59E0B' : '#10B981';
  const riskBg = isHigh ? '#FEE2E2' : isMed ? '#FEF3C7' : '#DEF7EC';
  const textContrast = isHigh ? '#7F1D1D' : isMed ? '#78350F' : '#046C4E';

  const anomalyCount = answers.filter(a => a.score === 1).length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>Hasil Skrining</Text>
          <Text style={styles.dateText}>
            Dibuat pada: {new Date(session.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
          </Text>
        </View>

        <View style={styles.main}>
          {/* Risk Level Badge Card */}
          <View style={[styles.riskCard, { backgroundColor: riskBg, borderColor: riskColor }]}>
            <Text style={[styles.riskBadgeLabel, { color: riskColor }]}>
              RISIKO {session.level_risiko.toUpperCase()}
            </Text>
            <Text style={[styles.riskSummary, { color: textContrast }]}>
              {session.analisis_gabungan}
            </Text>
          </View>

          {/* Patient summary */}
          <View style={styles.patientBox}>
            <Text style={styles.patientBoxTitle}>Profil Pasien</Text>
            <View style={styles.patientBoxRow}>
              <Text style={styles.patientBoxLabel}>Nama Lengkap</Text>
              <Text style={styles.patientBoxValue}>{patient.nama_pasien}</Text>
            </View>
            <View style={styles.patientBoxRow}>
              <Text style={styles.patientBoxLabel}>Jenis Kelamin</Text>
              <Text style={styles.patientBoxValue}>{patient.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</Text>
            </View>
            <View style={styles.patientBoxRow}>
              <Text style={styles.patientBoxLabel}>Usia Pemeriksaan</Text>
              <Text style={styles.patientBoxValue}>{session.usia_tahun} Tahun {session.usia_bulan} Bulan</Text>
            </View>
          </View>

          {/* AI Scanner Breakdown */}
          <Text style={styles.sectionHeader}>Hasil Pemindaian AI & Sensor</Text>

          <View style={styles.indicatorCard}>
            <View style={styles.indicatorRow}>
              <Text style={styles.indicatorEmoji}>👁️</Text>
              <View style={styles.indicatorDetails}>
                <Text style={styles.indicatorTitle}>Sensori Konjungtiva Mata</Text>
                <Text style={styles.indicatorValue}>{session.analisis_mata}</Text>
              </View>
            </View>

            <View style={styles.indicatorDivider} />

            <View style={styles.indicatorRow}>
              <Text style={styles.indicatorEmoji}>💅</Text>
              <View style={styles.indicatorDetails}>
                <Text style={styles.indicatorTitle}>Sensori Kuku Jari</Text>
                <Text style={styles.indicatorValue}>{session.analisis_kuku}</Text>
              </View>
            </View>

            <View style={styles.indicatorDivider} />

            <View style={styles.indicatorRow}>
              <Text style={styles.indicatorEmoji}>👤</Text>
              <View style={styles.indicatorDetails}>
                <Text style={styles.indicatorTitle}>Sensori Wajah & Kulit</Text>
                <Text style={styles.indicatorValue}>{session.analisis_muka}</Text>
              </View>
            </View>
          </View>

          {/* Questionnaire count */}
          <View style={styles.questionnaireSummaryCard}>
            <View style={styles.questionnaireRow}>
              <View style={styles.questionnaireTexts}>
                <Text style={styles.questionnaireTitle}>Kuesioner Observasi</Text>
                <Text style={styles.questionnaireSub}>
                  {anomalyCount > 0 ? `${anomalyCount} indikasi anomali perilaku terdeteksi` : "Tidak ada indikasi anomali perilaku"}
                </Text>
              </View>
              <View style={[styles.qScoreBadge, { backgroundColor: anomalyCount > 0 ? '#FEE2E2' : '#DEF7EC' }]}>
                <Text style={[styles.qScoreBadgeText, { color: anomalyCount > 0 ? '#EF4444' : '#10B981' }]}>
                  {anomalyCount}
                </Text>
              </View>
            </View>
            
            {anomalyCount > 0 && (
              <View style={styles.flaggedQuestionsContainer}>
                <Text style={styles.flaggedTitle}>Indikator Terflagged:</Text>
                {answers.filter(a => a.score === 1).map((ans, index) => (
                  <Text key={index} style={styles.flaggedQuestionText}>
                    • {ans.question}
                  </Text>
                ))}
              </View>
            )}
          </View>

          {/* Diet Recommendations */}
          <Text style={styles.sectionHeader}>Rekomendasi Tindakan & Gizi</Text>
          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationText}>{session.rekomendasi}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionBtnsContainer}>
            {/* Share PDF Report */}
            <TouchableOpacity style={styles.pdfBtn} onPress={exportPdfReport}>
              <Text style={styles.pdfBtnText}>📄 Bagikan Laporan Resmi (PDF)</Text>
            </TouchableOpacity>

            {/* Faskes Terdekat Map */}
            {(isHigh || isMed) && (
              <TouchableOpacity style={styles.mapBtn} onPress={openReferralMap}>
                <Text style={styles.mapBtnText}>🏥 Temukan Puskesmas Terdekat</Text>
              </TouchableOpacity>
            )}

            {/* Back Home */}
            <TouchableOpacity style={styles.homeBtn} onPress={() => navigate('Home')}>
              <Text style={styles.homeBtnText}>Kembali ke Beranda</Text>
            </TouchableOpacity>
          </View>
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
  headerTitleContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  main: {
    paddingHorizontal: 20,
    marginTop: 12,
  },
  riskCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  riskBadgeLabel: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  riskSummary: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  patientBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  patientBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 12,
  },
  patientBoxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  patientBoxLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  patientBoxValue: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '700',
  },
  sectionHeader: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 12,
    marginTop: 8,
  },
  indicatorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  indicatorEmoji: {
    fontSize: 28,
    marginRight: 14,
  },
  indicatorDetails: {
    flex: 1,
  },
  indicatorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  indicatorValue: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  indicatorDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  questionnaireSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  questionnaireRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionnaireTexts: {
    flex: 1,
  },
  questionnaireTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  questionnaireSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  qScoreBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qScoreBadgeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  flaggedQuestionsContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  flaggedTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  flaggedQuestionText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 4,
  },
  recommendationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  recommendationText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  actionBtnsContainer: {
    marginTop: 8,
  },
  pdfBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  pdfBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  mapBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  mapBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  homeBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeBtnText: {
    color: '#475569',
    fontSize: 15,
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
