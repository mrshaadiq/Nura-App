import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getScreeningSessionById, getPatientById, Patient, ScreeningSession } from '../database/database';
import { useAppNavigation } from '../navigation/NavigationContext';
import {
  WifiOff,
  AlertTriangle,
  CheckCircle,
  Eye,
  Hand,
  Check,
  MapPin,
  Share2,
  RefreshCw
} from 'lucide-react-native';

interface ResultsScreenProps {
  params: { sessionId: number };
  isActive: boolean;
}

interface QuestionAnswer {
  question: string;
  score: number;
}

export default function ResultsScreen({ params, isActive }: ResultsScreenProps) {
  const { navigate } = useAppNavigation();
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

  const parsePhysicalData = (recomText: string) => {
    if (!recomText) return null;
    const match = recomText.match(/\[FISIK\] BB:\s*([0-9.]+)\s*kg,\s*TB:\s*([0-9.]+)\s*cm,\s*BMI:\s*([0-9.]+),\s*Status:\s*([^.]+)/);
    if (match) {
      return {
        weight: match[1],
        height: match[2],
        bmi: match[3],
        status: match[4]
      };
    }
    return null;
  };

  const exportPdfReport = async () => {
    if (!patient || !session) return;

    try {
      const formattedAnswers = answers.map((ans, idx) => `
        <tr>
          <td style="padding: 6px 0; border-bottom: 1px solid #f1f5f9; color: #334155;">${idx + 1}. ${ans.question}</td>
          <td style="padding: 6px 0; border-bottom: 1px solid #f1f5f9; font-weight: bold; text-align: right; color: ${ans.score === 1 ? '#ef4444' : '#10b981'};">
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
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #1e293b; padding: 30px; line-height: 1.6; font-size: 12px; }
              .header { border-bottom: 4px solid #4f46e5; padding-bottom: 15px; margin-bottom: 20px; }
              .app-logo { font-size: 12px; font-weight: 800; color: #4f46e5; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
              .title { font-size: 20px; font-weight: 900; color: #0f172a; margin: 0; }
              .date { font-size: 11px; color: #64748b; margin-top: 4px; }
              .section-title { font-size: 13px; font-weight: bold; text-transform: uppercase; color: #1e293b; letter-spacing: 0.5px; border-bottom: 2px solid #cbd5e1; padding-bottom: 5px; margin-top: 25px; margin-bottom: 12px; }
              .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
              .meta-table td { padding: 4px 0; vertical-align: top; }
              .meta-label { font-weight: bold; color: #475569; width: 140px; }
              .meta-value { color: #1e293b; }
              .badge { padding: 4px 10px; border-radius: 12px; font-weight: bold; display: inline-block; font-size: 10px; text-transform: uppercase; }
              .table { width: 100%; border-collapse: collapse; margin-top: 8px; }
              .table th { background: #f1f5f9; text-align: left; font-weight: bold; color: #475569; border: 1px solid #e2e8f0; padding: 8px 10px; }
              .table td { border: 1px solid #e2e8f0; padding: 8px 10px; vertical-align: top; }
              .recommendation-card { background: #f8fafc; border-left: 4px solid #4f46e5; padding: 12px; border-radius: 0 8px 8px 0; font-size: 12px; color: #334155; white-space: pre-line; }
              .disclaimer-card { background-color: #fff5f5; border: 1px solid #feb2b2; border-radius: 8px; padding: 12px; margin-top: 25px; color: #c53030; font-size: 10px; }
              .disclaimer-title { font-weight: bold; margin-bottom: 3px; text-transform: uppercase; letter-spacing: 0.5px; }
              .footer-note { margin-top: 40px; font-size: 9px; color: #94a3b8; text-align: center; border-top: 1px dashed #e2e8f0; padding-top: 12px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="app-logo">GiziKu App Scanner</div>
              <div class="title">LAPORAN HASIL SKRINING GIZI & STUNTING</div>
              <div class="date">Waktu Pemeriksaan: ${formattedDate} WIB | ID Laporan: #NS-${session.id}</div>
            </div>

            <table class="meta-table">
              <tr>
                <td class="meta-label">Nama Lengkap Pasien</td>
                <td class="meta-value">: ${patient.nama_pasien}</td>
                <td class="meta-label" style="text-align: right; width: 160px;">Status Urgensi Gizi</td>
                <td class="meta-value" style="text-align: right; width: 120px;">
                  : <span class="badge" style="background-color: ${riskBg}; color: ${riskColor};">${session.level_risiko === 'tinggi' ? 'Anemia Berat' : session.level_risiko === 'sedang' ? 'Anemia Ringan' : 'Normal'}</span>
                </td>
              </tr>
              <tr>
                <td class="meta-label">Jenis Kelamin</td>
                <td class="meta-value">: ${patient.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                <td class="meta-label" style="text-align: right;">Usia Saat Skrining</td>
                <td class="meta-value" style="text-align: right;">: ${session.usia_tahun} Tahun ${session.usia_bulan} Bulan</td>
              </tr>
              <tr>
                <td class="meta-label">Tanggal Lahir</td>
                <td class="meta-value">: ${patient.tanggal_lahir}</td>
                <td></td>
                <td></td>
              </tr>
            </table>

            <div class="section-title">Hasil Pemeriksaan Visual</div>
            <table class="table">
              <thead>
                <tr>
                  <th style="width: 30%;">Bagian Pemindaian</th>
                  <th style="width: 70%;">Hasil Analisis</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="font-weight: bold;">👁️ Kelopak Mata</td>
                  <td>${session.analisis_mata}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold;">💅 Kuku Jari</td>
                  <td>${session.analisis_kuku}</td>
                </tr>
                <tr>
                  <td style="font-weight: bold;">👤 Wajah & Kulit</td>
                  <td>${session.analisis_muka}</td>
                </tr>
              </tbody>
            </table>

            <div class="section-title">Hasil Evaluasi Perilaku & Kondisi Umum</div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 5px;">
              ${formattedAnswers}
            </table>

            <div class="section-title">Rekomendasi Nutrisi Lokal</div>
            <div class="recommendation-card">
              <span>${session.rekomendasi}</span>
            </div>

            <div class="disclaimer-card">
              <div class="disclaimer-title">⚠️ Disclaimer Medis Penting</div>
              Laporan ini dihasilkan secara otomatis oleh aplikasi GiziKu. Hasil pemeriksaan di atas bersifat sebagai langkah skrining awal untuk mendeteksi risiko stunting dan anemia. Dokumen ini BUKAN merupakan diagnosis medis formal. Konsultasikan hasil ini dengan dokter anak, bidan, atau petugas Puskesmas setempat untuk pemeriksaan klinis lebih lanjut.
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Bagikan Laporan Kesehatan GiziKu' });
    } catch (e: any) {
      console.error(e);
      Alert.alert("Gagal PDF", "Gagal memproses dokumen PDF: " + e.message);
    }
  };

  if (loading || !session || !patient) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1b5be8" />
        <Text style={styles.loadingText}>Membuat ringkasan diagnosis...</Text>
      </View>
    );
  }

  // Parse physical dimensions (weight, height, BMI)
  const physicalData = parsePhysicalData(session.rekomendasi);

  // Set alert banner properties based on risk
  const isHigh = session.level_risiko === 'tinggi';
  const isMed = session.level_risiko === 'sedang';

  let bannerTitle = 'Kondisi Normal Terpantau';
  let bannerBg = '#dcfce7'; // green
  let bannerBorder = '#86efac';
  let bannerColor = '#16a34a';
  let bannerIcon = CheckCircle;

  if (isHigh) {
    bannerTitle = 'Tindakan Diperlukan: Tanda Anemia Berat Terdeteksi';
    bannerBg = '#fee2e2'; // red
    bannerBorder = '#fca5a5';
    bannerColor = '#e53e3e';
    bannerIcon = AlertTriangle;
  } else if (isMed) {
    bannerTitle = 'Tindakan Diperlukan: Tanda Anemia Ringan Terdeteksi';
    bannerBg = '#fffbeb'; // amber
    bannerBorder = '#fde68a';
    bannerColor = '#ca8a04';
    bannerIcon = AlertTriangle;
  }

  const BannerIconComponent = bannerIcon;
  const ageMonthsTotal = (session.usia_tahun * 12) + session.usia_bulan;

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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Risk Banner Header */}
        <View style={[styles.banner, { backgroundColor: bannerBg, borderColor: bannerBorder }]}>
          <View style={styles.bannerHeader}>
            <View style={styles.bannerIconWrapper}>
              <BannerIconComponent size={22} color={bannerColor} strokeWidth={2.5} />
            </View>
            <View style={styles.bannerTextCol}>
              <Text style={[styles.bannerTitle, { color: bannerColor }]}>
                {bannerTitle}
              </Text>
              <Text style={styles.bannerSubtitle}>
                {patient.nama_pasien} • {ageMonthsTotal} bulan
              </Text>
            </View>
          </View>
        </View>

        {/* Measurements box (Weight, Height, BMI) if available */}
        {physicalData && (
          <View style={styles.measurementsCard}>
            <Text style={styles.sectionHeadingUpper}>Kondisi Fisik & Stunting</Text>
            <View style={styles.measGrid}>
              <View style={styles.measItem}>
                <Text style={styles.measLabel}>Berat Badan</Text>
                <Text style={styles.measValue}>{physicalData.weight} kg</Text>
              </View>
              <View style={styles.measItem}>
                <Text style={styles.measLabel}>Tinggi Badan</Text>
                <Text style={styles.measValue}>{physicalData.height} cm</Text>
              </View>
              <View style={styles.measItem}>
                <Text style={styles.measLabel}>Status WHO</Text>
                <Text style={[
                  styles.measValue, 
                  { color: physicalData.status.includes('Normal') ? '#16a34a' : '#ca8a04' }
                ]}>
                  {physicalData.status}
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.mainContent}>
          {/* AI DIAGNOSTICS */}
          <Text style={styles.sectionHeadingUpper}>Analisis Visual</Text>
          
          <View style={styles.indicatorCard}>
            {/* Eye row */}
            <View style={styles.indicatorRow}>
              <View style={[styles.indicatorIconBg, { backgroundColor: '#fff7ed' }]}>
                <Eye size={20} color="#ea580c" strokeWidth={2.5} />
              </View>
              <View style={styles.indicatorTexts}>
                <Text style={styles.indicatorTitle}>DIAGNOSTIK KELOPAK MATA</Text>
                <Text style={styles.indicatorDesc}>
                  Konjungtiva: {session.analisis_mata}
                </Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            {/* Nails row */}
            <View style={styles.indicatorRow}>
              <View style={[styles.indicatorIconBg, { backgroundColor: '#f0fdf4' }]}>
                <Hand size={20} color="#16a34a" strokeWidth={2.5} />
              </View>
              <View style={styles.indicatorTexts}>
                <Text style={styles.indicatorTitle}>DIAGNOSTIK BANTALAN KUKU</Text>
                <Text style={styles.indicatorDesc}>
                  Warna Kuku: {session.analisis_kuku}
                </Text>
              </View>
            </View>
          </View>

          {/* LOCAL NUTRITION RECOMMENDATIONS */}
          <Text style={styles.sectionHeadingUpper}>Rekomendasi Nutrisi Lokal</Text>

          <View style={styles.recomGrid}>
            {/* Daun Kelor Card */}
            <View style={styles.recomCard}>
              <View style={[styles.recomIconBg, { backgroundColor: '#f0fdf4' }]}>
                <Text style={styles.recomEmoji}>🌿</Text>
              </View>
              <View style={styles.recomTexts}>
                <Text style={styles.recomTitle}>Daun Kelor (Moringa)</Text>
                <Text style={styles.recomDesc}>Kaya Vitamin A & Zat Besi</Text>
              </View>
            </View>

            {/* Telur Rebus Card */}
            <View style={styles.recomCard}>
              <View style={[styles.recomIconBg, { backgroundColor: '#fffdf5' }]}>
                <Text style={styles.recomEmoji}>🥚</Text>
              </View>
              <View style={styles.recomTexts}>
                <Text style={styles.recomTitle}>Telur Rebus</Text>
                <Text style={styles.recomDesc}>Sumber protein utama tumbuh kembang</Text>
              </View>
            </View>

            {/* Ikan Kembung Card */}
            <View style={styles.recomCard}>
              <View style={[styles.recomIconBg, { backgroundColor: '#eff6ff' }]}>
                <Text style={styles.recomEmoji}>🐟</Text>
              </View>
              <View style={styles.recomTexts}>
                <Text style={styles.recomTitle}>Ikan Kembung (Mackerel)</Text>
                <Text style={styles.recomDesc}>Omega-3 terjangkau sumber lokal</Text>
              </View>
            </View>
          </View>

          {/* ACTION BUTTONS */}
          <View style={styles.actionBtnsContainer}>
            {/* Find clinic nearest */}
            <TouchableOpacity style={styles.clinicBtn} onPress={() => navigate('Faskes')}>
              <MapPin size={18} color="#ffffff" strokeWidth={2.5} style={{ marginRight: 8 }} />
              <Text style={styles.clinicBtnText}>Temukan Klinik Terdekat</Text>
            </TouchableOpacity>

            {/* Print/Share PDF */}
            <TouchableOpacity style={styles.pdfBtn} onPress={exportPdfReport}>
              <Share2 size={18} color="#ffffff" strokeWidth={2.5} style={{ marginRight: 8 }} />
              <Text style={styles.pdfBtnText}>Unduh & Bagikan PDF</Text>
            </TouchableOpacity>

            {/* Redo Check */}
            <TouchableOpacity style={styles.redoBtn} onPress={() => navigate('Home')}>
              <RefreshCw size={16} color="#5a6b7e" strokeWidth={2.5} style={{ marginRight: 8 }} />
              <Text style={styles.redoBtnText}>Pemeriksaan Baru</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Nav Dots Simulator */}
      <View style={styles.navDotsContainer}>
        {[...Array(9)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.navDot,
              i === 6 ? styles.navDotActive : styles.navDotInactive
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
    paddingBottom: 80,
  },
  banner: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
  },
  bannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bannerIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextCol: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  bannerSubtitle: {
    fontSize: 11,
    color: '#5a6b7e',
    fontWeight: '700',
    marginTop: 2,
  },
  measurementsCard: {
    marginHorizontal: 20,
    marginTop: 18,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(26, 35, 50, 0.08)',
    padding: 16,
  },
  measGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  measItem: {
    alignItems: 'center',
    flex: 1,
  },
  measLabel: {
    fontSize: 11,
    color: '#8a9ab0',
    fontWeight: '700',
  },
  measValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1a2332',
    marginTop: 4,
  },
  mainContent: {
    paddingHorizontal: 20,
    marginTop: 18,
  },
  sectionHeadingUpper: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '800',
    color: '#8a9ab0',
    marginBottom: 10,
    marginTop: 8,
  },
  indicatorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(26, 35, 50, 0.08)',
    padding: 16,
    marginBottom: 20,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  indicatorIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indicatorTexts: {
    flex: 1,
  },
  indicatorTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#8a9ab0',
  },
  indicatorDesc: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a2332',
    marginTop: 2,
  },
  cardDivider: {
    height: 1.5,
    backgroundColor: 'rgba(26, 35, 50, 0.08)',
    marginVertical: 12,
  },
  recomGrid: {
    gap: 10,
    marginBottom: 24,
  },
  recomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(26, 35, 50, 0.08)',
    padding: 12,
    gap: 12,
  },
  recomIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recomEmoji: {
    fontSize: 18,
  },
  recomTexts: {
    flex: 1,
  },
  recomTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a2332',
  },
  recomDesc: {
    fontSize: 11,
    color: '#5a6b7e',
    fontWeight: '500',
    marginTop: 1,
  },
  actionBtnsContainer: {
    gap: 12,
  },
  clinicBtn: {
    backgroundColor: '#00a49a',
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clinicBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  pdfBtn: {
    backgroundColor: '#1b5be8',
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  redoBtn: {
    backgroundColor: '#f0f4f8',
    height: 48,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  redoBtnText: {
    color: '#5a6b7e',
    fontSize: 14,
    fontWeight: '700',
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
