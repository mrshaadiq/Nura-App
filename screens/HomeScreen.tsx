import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Modal,
  Platform,
  Dimensions,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { getPatients, Patient } from '../database/database';
import { useAppNavigation } from '../navigation/NavigationContext';
import { getAiMode, setAiMode, AiMode } from '../ai/aiSettings';
import NuraLogo from '../components/NuraLogo';
import {
  WifiOff,
  Camera,
  ChevronRight,
  BookOpen,
  MapPin,
  Plus,
  Search,
  Baby,
  Smile,
  X
} from 'lucide-react-native';

const { width: screenWidth } = Dimensions.get('window');

interface HomeScreenProps {
  isActive: boolean;
}

export default function HomeScreen({ isActive }: HomeScreenProps) {
  const { navigate } = useAppNavigation();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [aiMode, setAiModeState] = useState<AiMode>(getAiMode());
  const [showSelectModal, setShowSelectModal] = useState(false);

  const cycleAiMode = () => {
    let nextMode: AiMode = 'online';
    if (aiMode === 'online') {
      nextMode = 'offline';
    } else if (aiMode === 'offline') {
      nextMode = 'simulasi';
    } else {
      nextMode = 'online';
    }
    setAiMode(nextMode);
    setAiModeState(nextMode);
  };

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
      setAiModeState(getAiMode());
    }
  }, [isActive]);

  const filteredPatients = patients.filter(p =>
    p.nama_pasien.toLowerCase().includes(search.toLowerCase())
  );

  // Dynamic calculations for stats
  const totalScreeningsCount = patients.filter(p => p.last_scan_date).length;
  const followUpRequiredCount = patients.filter(
    p => p.last_risk_level === 'tinggi' || p.last_risk_level === 'sedang'
  ).length;

  const getIndonesianDate = () => {
    const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    const months = [
      'JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI',
      'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'
    ];
    const today = new Date();
    const dayName = days[today.getDay()];
    const date = today.getDate();
    const monthName = months[today.getMonth()];
    return `${dayName}, ${date} ${monthName}`;
  };

  const calculateAgeMonths = (dobStr: string) => {
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
    return (years * 12) + months;
  };

  const getStatusConfig = (risk?: 'rendah' | 'sedang' | 'tinggi') => {
    switch (risk) {
      case 'tinggi':
        return { bg: '#FEE2E2', text: '#E53E3E', label: 'Anemia Berat', avatarBg: '#FFF1F2' };
      case 'sedang':
        return { bg: '#FEF9C3', text: '#CA8A04', label: 'Anemia Ringan', avatarBg: '#FEFCE8' };
      case 'rendah':
        return { bg: '#DCFCE7', text: '#16A34A', label: 'Normal', avatarBg: '#F0FDF4' };
      default:
        return { bg: '#F1F5F9', text: '#64748B', label: 'Belum Skrining', avatarBg: '#F8FAFC' };
    }
  };

  const handleStartScreening = (patientId: number) => {
    setShowSelectModal(false);
    navigate('Questionnaire', { patientId });
  };

  const renderPatientCard = ({ item }: { item: Patient }) => {
    const status = getStatusConfig(item.last_risk_level);
    const ageMonths = calculateAgeMonths(item.tanggal_lahir);
    
    let formattedDate = '-';
    if (item.last_scan_date) {
      try {
        const d = new Date(item.last_scan_date);
        formattedDate = d.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      } catch {
        formattedDate = item.last_scan_date;
      }
    }

    return (
      <TouchableOpacity
        style={styles.patientCard}
        onPress={() => navigate('History', { patientId: item.id })}
      >
        <View style={styles.cardInfo}>
          {/* Avatar Container with baby face */}
          <View style={[styles.avatarCircle, { backgroundColor: status.avatarBg }]}>
            <Baby size={22} color={status.text} strokeWidth={2.5} />
          </View>

          <View style={styles.patientDetails}>
            <Text style={styles.patientName}>{item.nama_pasien}</Text>
            <Text style={styles.patientSubtext}>
              {ageMonths} bln • {formattedDate}
            </Text>
          </View>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusBadgeText, { color: status.text }]}>
            {status.label}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Simulation Status Bar Area */}
      <View style={styles.statusBarSim}>
        <Text style={styles.timeSim}>9:41</Text>
        <TouchableOpacity 
          style={[
            styles.aiModeBtn,
            aiMode === 'online' && { backgroundColor: '#DEF2FE', borderColor: '#0284C7' },
            aiMode === 'offline' && { backgroundColor: '#DEF7EC', borderColor: '#059669' },
            aiMode === 'simulasi' && { backgroundColor: '#F1F5F9', borderColor: '#64748B' },
            { marginLeft: 'auto', marginRight: 0, paddingVertical: 4, paddingHorizontal: 10 }
          ]}
          onPress={cycleAiMode}
        >
          <Text style={[
            styles.aiModeBtnText,
            aiMode === 'online' && { color: '#0284C7' },
            aiMode === 'offline' && { color: '#059669' },
            aiMode === 'simulasi' && { color: '#64748B' }
          ]}>
            {aiMode === 'online' ? '🌐 Online' : aiMode === 'offline' ? '💾 Offline' : '🖥️ Simulasi'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Greeting Card */}
        <LinearGradient
          colors={['#1b5be8', '#0f3fa3']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.greetingCard}
        >
          <View style={styles.greetingHeader}>
            <View>
              <Text style={styles.dateLabel}>{getIndonesianDate()}</Text>
              <Text style={styles.greetingTitle}>Halo, Orang Tua! 👋</Text>
              <Text style={styles.greetingSubtitle}>Pantau kesehatan si kecil hari ini</Text>
            </View>
            <View style={styles.logoCircleWrapper}>
              <NuraLogo size={42} />
            </View>
          </View>

          {/* Stats Row inside greeting card */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{totalScreeningsCount}</Text>
              <Text style={styles.statLabel}>Riwayat</Text>
            </View>

            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{followUpRequiredCount}</Text>
              <Text style={styles.statLabel}>Perlu Tindak Lanjut</Text>
            </View>

            <View style={[styles.statBox, styles.statBoxOffline]}>
              <WifiOff size={20} color="rgba(255, 255, 255, 0.8)" strokeWidth={2.5} />
              <Text style={styles.statLabelOffline}>Offline</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Screening Kesehatan Anak CTA */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setShowSelectModal(true)}
        >
          <LinearGradient
            colors={['#1b5be8', '#00a49a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.screeningCTA}
          >
            <View style={styles.screeningIconWrapper}>
              <Camera size={26} color="#ffffff" strokeWidth={2.5} />
            </View>
            <View style={styles.screeningTextCol}>
              <Text style={styles.screeningTitle}>Skrining Kesehatan Anak</Text>
              <Text style={styles.screeningSubtitle}>Fisik • Gizi • Mental</Text>
              <Text style={styles.screeningDesc}>Analisis visual & gizi terintegrasi</Text>
            </View>
            <ChevronRight size={24} color="#ffffff" strokeWidth={2.5} />
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick Access Grid Section */}
        <View style={styles.gridSection}>
          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigate('Education')}
          >
            <View style={[styles.gridIconBg, { backgroundColor: '#e8f0fd' }]}>
              <BookOpen size={24} color="#1b5be8" strokeWidth={2.5} />
            </View>
            <Text style={[styles.gridTitle, { color: '#1b5be8' }]}>Edukasi & Literasi</Text>
            <Text style={styles.gridSubtitle}>Materi gizi & mental</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridCard}
            onPress={() => navigate('Faskes')}
          >
            <View style={[styles.gridIconBg, { backgroundColor: '#e8f5f4' }]}>
              <MapPin size={24} color="#00a49a" strokeWidth={2.5} />
            </View>
            <Text style={[styles.gridTitle, { color: '#00a49a' }]}>Faskes Terdekat</Text>
            <Text style={styles.gridSubtitle}>Rekomendasi klinik & RS</Text>
          </TouchableOpacity>
        </View>

        {/* Riwayat Pemeriksaan Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Riwayat Pemeriksaan</Text>
          <TouchableOpacity onPress={() => setSearch(search ? '' : ' ')}>
            <Text style={styles.seeAllText}>Cari Pasien</Text>
          </TouchableOpacity>
        </View>

        {/* Search bar inside Home screen */}
        {search !== '' && (
          <View style={styles.searchContainer}>
            <Search size={18} color="#94A3B8" strokeWidth={2.5} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari nama anak..."
              placeholderTextColor="#94A3B8"
              value={search.trim()}
              onChangeText={setSearch}
              autoFocus
            />
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={18} color="#94A3B8" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#1b5be8" />
            <Text style={styles.loadingText}>Memuat data...</Text>
          </View>
        ) : filteredPatients.length === 0 ? (
          <View style={styles.centerContainer}>
            <Smile size={32} color="#CBD5E1" strokeWidth={2} />
            <Text style={styles.emptyTitle}>Belum ada profil anak</Text>
            <Text style={styles.emptySubtitle}>
              {search ? 'Nama tidak ditemukan.' : 'Daftarkan profil anak Anda untuk mulai memantau gizi dan risiko stunting.'}
            </Text>
            {!search && (
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigate('Profile')}
              >
                <Text style={styles.emptyBtnText}>Tambah Profil Anak</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredPatients}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderPatientCard}
            scrollEnabled={false} // integrated into parent ScrollView
            style={styles.list}
          />
        )}
      </ScrollView>

      {/* Floating Add Profile Button */}
      {patients.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigate('Profile')}
        >
          <Plus size={28} color="#FFFFFF" strokeWidth={3} />
        </TouchableOpacity>
      )}

      {/* Select Patient Modal (Bottom Sheet style) */}
      <Modal
        visible={showSelectModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSelectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pilih Anak</Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowSelectModal(false)}
              >
                <X size={20} color="#1A2332" strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDesc}>
              Pilih profil anak yang ingin diperiksa, atau daftarkan profil baru.
            </Text>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {patients.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.modalPatientCard}
                  onPress={() => handleStartScreening(p.id)}
                >
                  <View style={styles.modalPatientAvatar}>
                    <Baby size={20} color="#1b5be8" strokeWidth={2.5} />
                  </View>
                  <Text style={styles.modalPatientName}>{p.nama_pasien}</Text>
                  <ChevronRight size={18} color="#8a9ab0" strokeWidth={2.5} />
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[styles.modalPatientCard, styles.modalAddCard]}
                onPress={() => {
                  setShowSelectModal(false);
                  navigate('Profile');
                }}
              >
                <View style={[styles.modalPatientAvatar, styles.modalAddAvatar]}>
                  <Plus size={20} color="#00a49a" strokeWidth={3} />
                </View>
                <Text style={[styles.modalPatientName, styles.modalAddText]}>
                  Daftarkan Anak Baru
                </Text>
                <ChevronRight size={18} color="#00a49a" strokeWidth={2.5} />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 110,
  },
  greetingCard: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 24, // 3xl
    padding: 20,
  },
  greetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 1,
  },
  greetingTitle: {
    fontSize: 22, // H2 scale
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 6,
    letterSpacing: -0.5,
  },
  greetingSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 3,
    fontWeight: '500',
  },
  logoCircleWrapper: {
    width: 52,
    height: 52,
    borderRadius: 9999,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statBoxOffline: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
    textAlign: 'center',
  },
  statLabelOffline: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    textAlign: 'center',
  },
  screeningCTA: {
    marginHorizontal: 20,
    marginTop: 16,
    borderRadius: 24, // 3xl
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  screeningIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  screeningTextCol: {
    flex: 1,
  },
  screeningTitle: {
    fontSize: 16, // H3
    fontWeight: '800',
    color: '#ffffff',
  },
  screeningSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  screeningDesc: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  gridSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20, // 2xl
    borderWidth: 1.5,
    borderColor: 'rgba(26, 35, 50, 0.08)',
    padding: 16,
    minHeight: 100,
  },
  gridIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  gridSubtitle: {
    fontSize: 11,
    color: '#5a6b7e',
    fontWeight: '500',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1a2332',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1b5be8',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1a2332',
    fontWeight: '600',
  },
  list: {
    paddingHorizontal: 20,
  },
  patientCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(26, 35, 50, 0.08)',
    padding: 14,
    marginBottom: 10,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  patientDetails: {
    flex: 1,
  },
  patientName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1a2332',
  },
  patientSubtext: {
    fontSize: 12,
    color: '#5a6b7e',
    fontWeight: '500',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 13,
    color: '#5a6b7e',
    fontWeight: '500',
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a2332',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#5a6b7e',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    fontWeight: '500',
  },
  emptyBtn: {
    backgroundColor: '#1b5be8',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 16,
  },
  emptyBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1b5be8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1b5be8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(26, 35, 50, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1A2332',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#f0f4f8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDesc: {
    fontSize: 13,
    color: '#5a6b7e',
    lineHeight: 18,
    marginBottom: 16,
    fontWeight: '500',
  },
  modalScroll: {
    maxHeight: 300,
  },
  modalPatientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(26, 35, 50, 0.05)',
  },
  modalPatientAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e8f0fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalPatientName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1a2332',
  },
  modalAddCard: {
    backgroundColor: '#ffffff',
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: '#00a49a',
  },
  modalAddAvatar: {
    backgroundColor: '#e8f5f4',
  },
  modalAddText: {
    color: '#00a49a',
  },
  aiModeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  aiModeBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
