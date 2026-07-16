import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { getPatients, Patient } from '../database/database';

interface HomeScreenProps {
  navigate: (screen: string, params?: any) => void;
  isActive: boolean;
}

export default function HomeScreen({ navigate, isActive }: HomeScreenProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPatientList = async () => {
    try {
      setLoading(true);
      const data = await getPatients();
      setPatients(data);
    } catch (error) {
      console.error("Error loading patients:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isActive) {
      fetchPatientList();
    }
  }, [isActive]);

  const filteredPatients = patients.filter(p =>
    p.nama_pasien.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const renderPatientCard = ({ item }: { item: Patient }) => {
    const risk = item.last_risk_level || 'belum';
    let badgeBg = '#E2E8F0';
    let badgeText = '#64748B';
    let badgeLabel = 'Belum Skrining';

    if (risk === 'tinggi') {
      badgeBg = '#FEE2E2';
      badgeText = '#991B1B';
      badgeLabel = 'Risiko Tinggi';
    } else if (risk === 'sedang') {
      badgeBg = '#FEF3C7';
      badgeText = '#92400E';
      badgeLabel = 'Risiko Sedang';
    } else if (risk === 'rendah') {
      badgeBg = '#DEF7EC';
      badgeText = '#03543F';
      badgeLabel = 'Risiko Rendah';
    }

    // Calculate age displays
    const calculateCategory = (dobStr: string) => {
      const dob = new Date(dobStr);
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

      if (years < 2) return `Balita (${years}th ${months}bln)`;
      if (years <= 5) return `Prasekolah (${years}th ${months}bln)`;
      if (years <= 12) return `Anak Sekolah (${years}th ${months}bln)`;
      return `Remaja/Dewasa (${years}th)`;
    };

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.nama_pasien.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.patientDetails}>
            <Text style={styles.patientName}>{item.nama_pasien}</Text>
            <Text style={styles.patientMeta}>
              {item.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'} • {calculateCategory(item.tanggal_lahir)}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: badgeBg }]}>
            <Text style={[styles.badgeText, { color: badgeText }]}>{badgeLabel}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => navigate('History', { patientId: item.id })}
          >
            <Text style={styles.historyBtnText}>Riwayat Skrining</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.scanBtn}
            onPress={() => navigate('Questionnaire', { patientId: item.id })}
          >
            <Text style={styles.scanBtnText}>Mulai Skrining</Text>
          </TouchableOpacity>
        </View>

        {item.last_scan_date && (
          <Text style={styles.lastScanDate}>
            Skrining terakhir: {formatDate(item.last_scan_date)}
          </Text>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <View style={styles.header}>
        <Text style={styles.title}>Nura App</Text>
        <Text style={styles.subtitle}>Deteksi Dini Kesehatan Gizi & Stunting</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama pasien..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Memuat pasien...</Text>
        </View>
      ) : filteredPatients.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>Belum ada pasien</Text>
          <Text style={styles.emptySubtitle}>
            {search ? 'Nama tidak ditemukan' : 'Daftarkan pasien pertama untuk mulai melakukan pemindaian AI.'}
          </Text>
          {!search && (
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => navigate('Profile')}
            >
              <Text style={styles.emptyBtnText}>Tambah Pasien</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredPatients}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderPatientCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {patients.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigate('Profile')}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
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
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginVertical: 12,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 15,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4F46E5',
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  patientMeta: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
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
  historyBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  historyBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  scanBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
  },
  scanBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  lastScanDate: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  fabText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '300',
    lineHeight: 32,
  },
});
