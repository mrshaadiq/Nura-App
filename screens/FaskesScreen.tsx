import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Linking,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppNavigation } from '../navigation/NavigationContext';
import { ChevronLeft, WifiOff, MapPin, Navigation, Phone, Star } from 'lucide-react-native';

interface FaskesItem {
  id: string;
  name: string;
  type: 'Puskesmas' | 'Posyandu' | 'Klinik' | 'Rumah Sakit';
  distance: string;
  rating: number; // out of 5
  hours: string;
  phone: string;
  status: 'Buka' | 'Tutup';
}

const FASKES_DATA: FaskesItem[] = [
  {
    id: '1',
    name: 'Puskesmas Sukamaju',
    type: 'Puskesmas',
    distance: '0.8 km',
    rating: 5,
    hours: '07:00 - 14:00',
    phone: '0812-3456-7890',
    status: 'Buka',
  },
  {
    id: '2',
    name: 'Posyandu Melati',
    type: 'Posyandu',
    distance: '1.2 km',
    rating: 5,
    hours: 'Senin & Rabu, 08:00 - 11:00',
    phone: '0813-9876-5432',
    status: 'Buka',
  },
  {
    id: '3',
    name: 'Klinik Pratama Sehat Bersama',
    type: 'Klinik',
    distance: '2.4 km',
    rating: 4,
    hours: '08:00 - 20:00',
    phone: '0857-1234-5678',
    status: 'Buka',
  },
  {
    id: '4',
    name: 'RSUD Kabupaten Ciamis',
    type: 'Rumah Sakit',
    distance: '6.1 km',
    rating: 4,
    hours: '24 jam',
    phone: '0265-123456',
    status: 'Buka',
  }
];

export default function FaskesScreen() {
  const { navigate } = useAppNavigation();

  const handleCall = (phoneNumber: string) => {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    Linking.openURL(`tel:${cleanPhone}`).catch(() => {
      Alert.alert('Gagal Melakukan Panggilan', `Nomor telepon: ${phoneNumber}`);
    });
  };

  const handleNavigate = (name: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Gagal Membuka Peta', 'Aplikasi peta tidak tersedia.');
    });
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={14}
          color={i <= rating ? '#F59E0B' : '#CBD5E1'}
          fill={i <= rating ? '#F59E0B' : 'transparent'}
          style={{ marginRight: 2 }}
        />
      );
    }
    return <View style={styles.starsRow}>{stars}</View>;
  };

  const getTypeBadgeStyle = (type: FaskesItem['type']) => {
    switch (type) {
      case 'Puskesmas':
        return { bg: '#E8F0FD', text: '#1B5BE8' }; // light blue
      case 'Posyandu':
        return { bg: '#E6F4F1', text: '#00A49A' }; // light teal
      case 'Klinik':
        return { bg: '#FFFBEB', text: '#D97706' }; // light amber
      case 'Rumah Sakit':
      default:
        return { bg: '#FEE2E2', text: '#EF4444' }; // light red
    }
  };

  const renderFaskesCard = ({ item }: { item: FaskesItem }) => {
    const badgeColors = getTypeBadgeStyle(item.type);
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleCol}>
            <Text style={styles.faskesName}>{item.name}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: badgeColors.bg }]}>
                <Text style={[styles.badgeText, { color: badgeColors.text }]}>{item.type}</Text>
              </View>
              <View style={[styles.badge, styles.badgeDistance]}>
                <Text style={styles.badgeDistanceText}>• {item.distance}</Text>
              </View>
            </View>
          </View>
          {renderStars(item.rating)}
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>⏱ {item.hours}</Text>
            {item.status === 'Buka' && (
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Buka</Text>
              </View>
            )}
          </View>
          <Text style={styles.phoneText}>📞 {item.phone}</Text>
        </View>

        <View style={styles.cardDivider} />

        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleNavigate(item.name)}>
            <Navigation size={16} color="#00A49A" strokeWidth={2.5} style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnTextTeal}>Navigasi</Text>
          </TouchableOpacity>
          
          <View style={styles.verticalDivider} />

          <TouchableOpacity style={styles.actionBtn} onPress={() => handleCall(item.phone)}>
            <Phone size={16} color="#1B5BE8" strokeWidth={2.5} style={{ marginRight: 6 }} />
            <Text style={styles.actionBtnTextBlue}>Hubungi</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

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
        <Text style={styles.title}>Faskes Terdekat</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Search/Alert Banner */}
      <View style={styles.alertBanner}>
        <View style={styles.alertIconBg}>
          <Navigation size={16} color="#00A49A" strokeWidth={2.5} />
        </View>
        <View style={styles.alertTexts}>
          <Text style={styles.alertTitle}>4 Faskes Ditemukan</Text>
          <Text style={styles.alertSubtitle}>Di sekitar lokasi Anda</Text>
        </View>
      </View>

      {/* Faskes Listing */}
      <FlatList
        data={FASKES_DATA}
        keyExtractor={item => item.id}
        renderItem={renderFaskesCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
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
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e6f4f3',
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    gap: 12,
  },
  alertIconBg: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTexts: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00A49A',
  },
  alertSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5a6b7e',
    marginTop: 1,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(26, 35, 50, 0.08)',
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleCol: {
    flex: 1,
    marginRight: 8,
  },
  faskesName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a2332',
    lineHeight: 20,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeDistance: {
    backgroundColor: 'transparent',
    marginLeft: 6,
  },
  badgeDistanceText: {
    fontSize: 11,
    color: '#5a6b7e',
    fontWeight: '600',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  detailsContainer: {
    marginTop: 12,
    marginBottom: 12,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#5a6b7e',
    fontWeight: '500',
  },
  statusBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16a34a',
  },
  phoneText: {
    fontSize: 12,
    color: '#5a6b7e',
    fontWeight: '500',
  },
  cardDivider: {
    height: 1.5,
    backgroundColor: 'rgba(26, 35, 50, 0.08)',
    marginVertical: 4,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
  },
  actionBtnTextTeal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00A49A',
  },
  actionBtnTextBlue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B5BE8',
  },
  verticalDivider: {
    width: 1.5,
    height: 20,
    backgroundColor: 'rgba(26, 35, 50, 0.08)',
  },
});
