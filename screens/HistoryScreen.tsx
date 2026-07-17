import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getScreeningSessions, getPatientById, Patient, ScreeningSession } from '../database/database';
import { useAppNavigation } from '../navigation/NavigationContext';
import { ChevronLeft, WifiOff, FileText, ChevronRight, ClipboardList } from 'lucide-react-native';

interface HistoryScreenProps {
  params: { patientId: number };
  isActive: boolean;
}

export default function HistoryScreen({ params, isActive }: HistoryScreenProps) {
  const { navigate } = useAppNavigation();
  const { patientId } = params;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [sessions, setSessions] = useState<ScreeningSession[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const p = await getPatientById(patientId);
      if (p) {
        setPatient(p);
        const data = await getScreeningSessions(patientId);
        setSessions(data);
      } else {
        Alert.alert('Error', 'Pasien tidak ditemukan.');
        navigate('Home');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Gagal memuat riwayat skrining.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isActive) {
      loadData();
    }
  }, [isActive, patientId]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) + ' WIB';
    } catch {
      return dateStr;
    }
  };

  const exportPdfReport = async (session: ScreeningSession) => {
    if (!patient) return;

    try {
      let answersList = [];
      try {
        if (session.jawaban_kuesioner) {
          answersList = JSON.parse(session.jawaban_kuesioner);
        }
      } catch (e) {
        console.error(e);
      }

      const formattedAnswers = answersList.map((ans: any, idx: number) => `
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
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Gagal PDF", "Gagal memproses dokumen PDF: " + e.message);
    }
  };

  const getStatusBadgeConfig = (risk: string) => {
    switch (risk) {
      case 'tinggi':
        return { bg: '#FEE2E2', text: '#E53E3E', label: 'Anemia Berat' };
      case 'sedang':
        return { bg: '#FEF9C3', text: '#CA8A04', label: 'Anemia Ringan' };
      case 'rendah':
      default:
        return { bg: '#DCFCE7', text: '#16A34A', label: 'Normal' };
    }
  };

  const renderSessionItem = ({ item }: { item: ScreeningSession }) => {
    const status = getStatusBadgeConfig(item.level_risiko);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
            <Text style={styles.cardAge}>Usia Pemeriksaan: {item.usia_tahun} Thn {item.usia_bulan} Bln</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: status.bg }]}>
            <Text style={[styles.badgeText, { color: status.text }]}>
              {status.label}
            </Text>
          </View>
        </View>

        <Text style={styles.cardSummary} numberOfLines={2}>
          {item.analisis_gabungan}
        </Text>

        <View style={styles.divider} />

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.pdfBtn}
            onPress={() => exportPdfReport(item)}
          >
            <FileText size={14} color="#1b5be8" strokeWidth={2.5} style={{ marginRight: 6 }} />
            <Text style={styles.pdfBtnText}>Cetak PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.detailBtn}
            onPress={() => navigate('Results', { sessionId: item.id })}
          >
            <Text style={styles.detailBtnText}>Lihat Detail</Text>
            <ChevronRight size={14} color="#5a6b7e" strokeWidth={2.5} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading || !patient) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1b5be8" />
        <Text style={styles.loadingText}>Memuat riwayat...</Text>
      </View>
    );
  }

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

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigate('Home')}>
          <ChevronLeft size={22} color="#1A2332" strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>Riwayat Skrining</Text>
          <Text style={styles.subtitle}>Pasien: {patient.nama_pasien}</Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      {sessions.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconBg}>
            <ClipboardList size={32} color="#8a9ab0" strokeWidth={2} />
          </View>
          <Text style={styles.emptyTitle}>Belum Ada Riwayat</Text>
          <Text style={styles.emptySubtitle}>
            Anak ini belum pernah melakukan pemeriksaan.
          </Text>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => navigate('Questionnaire', { patientId })}
          >
            <Text style={styles.startBtnText}>Mulai Skrining Sekarang</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderSessionItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
  header: {
    height: 64,
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
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a2332',
  },
  subtitle: {
    fontSize: 12,
    color: '#5a6b7e',
    fontWeight: '600',
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(26, 35, 50, 0.08)',
    padding: 16,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a2332',
  },
  cardAge: {
    fontSize: 11,
    color: '#5a6b7e',
    fontWeight: '500',
    marginTop: 3,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardSummary: {
    fontSize: 12,
    color: '#5a6b7e',
    marginTop: 10,
    lineHeight: 18,
    fontWeight: '500',
  },
  divider: {
    height: 1.5,
    backgroundColor: 'rgba(26, 35, 50, 0.08)',
    marginVertical: 12,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pdfBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#e8f0fd',
  },
  pdfBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1b5be8',
  },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#f0f4f8',
  },
  detailBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5a6b7e',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  loadingText: {
    fontSize: 13,
    color: '#5a6b7e',
    fontWeight: '500',
    marginTop: 10,
  },
  emptyIconBg: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#f0f4f8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a2332',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#5a6b7e',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    fontWeight: '500',
    marginBottom: 20,
  },
  startBtn: {
    backgroundColor: '#1b5be8',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  startBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
});
