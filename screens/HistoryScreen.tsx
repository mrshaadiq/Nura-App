import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Alert
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { getScreeningSessions, getPatientById, Patient, ScreeningSession } from '../database/database';

interface HistoryScreenProps {
  navigate: (screen: string, params?: any) => void;
  params: { patientId: number };
  isActive: boolean;
}

export default function HistoryScreen({ navigate, params, isActive }: HistoryScreenProps) {
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
      await Sharing.shareAsync(uri);
    } catch (e: any) {
      console.error(e);
      Alert.alert("Gagal PDF", "Gagal memproses dokumen PDF: " + e.message);
    }
  };

  const renderSessionItem = ({ item }: { item: ScreeningSession }) => {
    const risk = item.level_risiko;
    let badgeBg = '#E2E8F0';
    let badgeText = '#64748B';
    
    if (risk === 'tinggi') {
      badgeBg = '#FEE2E2';
      badgeText = '#991B1B';
    } else if (risk === 'sedang') {
      badgeBg = '#FEF3C7';
      badgeText = '#92400E';
    } else if (risk === 'rendah') {
      badgeBg = '#DEF7EC';
      badgeText = '#03543F';
    }

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.cardDate}>{formatDate(item.created_at)}</Text>
            <Text style={styles.cardAge}>Usia skrining: {item.usia_tahun} Thn {item.usia_bulan} Bln</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.badgeText, { color: badgeText }]}>
              {risk.toUpperCase()}
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
            <Text style={styles.pdfBtnText}>📄 Cetak PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.detailBtn}
            onPress={() => navigate('Results', { sessionId: item.id })}
          >
            <Text style={styles.detailBtnText}>Lihat Detail →</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading || !patient) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Memuat riwayat...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigate('Home')}>
          <Text style={styles.backBtnText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Riwayat Skrining</Text>
        <Text style={styles.subtitle}>Riwayat pemeriksaan untuk: {patient.nama_pasien}</Text>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>Belum Ada Riwayat</Text>
          <Text style={styles.emptySubtitle}>
            Pasien ini belum pernah melakukan pemeriksaan visual AI.
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    color: '#4F46E5',
    fontWeight: '600',
    fontSize: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  listContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardDate: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  cardAge: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cardSummary: {
    fontSize: 12,
    color: '#475569',
    marginTop: 12,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pdfBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4F46E5',
  },
  detailBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
    marginBottom: 20,
  },
  startBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  startBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
