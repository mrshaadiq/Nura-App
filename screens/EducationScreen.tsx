import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppNavigation } from '../navigation/NavigationContext';
import { ChevronLeft, WifiOff, BookOpen, Brain, Heart, Utensils, Smile } from 'lucide-react-native';

interface Article {
  id: string;
  category: 'Gizi' | 'Kesehatan Mental';
  readTime: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  iconBg: string;
  iconColor: string;
}

const ARTICLES_DATA: Article[] = [
  {
    id: '1',
    category: 'Gizi',
    readTime: '5 menit',
    title: 'Makanan Kaya Zat Besi untuk Mencegah Anemia',
    description: 'Kenali sumber zat besi dari bahan pangan lokal yang mudah dijangkau dan terjangkau.',
    icon: Utensils,
    iconBg: '#DCFCE7', // pastel green
    iconColor: '#16A34A',
  },
  {
    id: '2',
    category: 'Kesehatan Mental',
    readTime: '7 menit',
    title: 'Tanda Stunting dan Dampaknya pada Tumbuh Kembang',
    description: 'Memahami perbedaan stunting dan wasting serta cara deteksi dini di rumah.',
    icon: Brain,
    iconBg: '#F3E8FF', // pastel purple
    iconColor: '#9333EA',
  },
  {
    id: '3',
    category: 'Gizi',
    readTime: '8 menit',
    title: 'Panduan Pemberian ASI Eksklusif 0–6 Bulan',
    description: 'Manfaat, posisi, dan cara menyimpan ASI yang benar untuk ibu dan bayi.',
    icon: Heart,
    iconBg: '#FEE2E2', // pastel red
    iconColor: '#EF4444',
  },
  {
    id: '4',
    category: 'Kesehatan Mental',
    readTime: '6 menit',
    title: 'Stimulasi Tumbuh Kembang Anak Usia 1–3 Tahun',
    description: 'Aktivitas sederhana untuk mendukung perkembangan motorik dan kognitif anak.',
    icon: Smile,
    iconBg: '#E0F2FE', // pastel blue
    iconColor: '#0284C7',
  },
  {
    id: '5',
    category: 'Gizi',
    readTime: '4 menit',
    title: 'Menu Sehat Bergizi Seimbang untuk Balita',
    description: 'Inspirasi menu harian untuk memenuhi kebutuhan gizi anak usia 1–5 tahun.',
    icon: Utensils,
    iconBg: '#FEF9C3', // pastel yellow
    iconColor: '#CA8A04',
  }
];

export default function EducationScreen() {
  const { navigate } = useAppNavigation();
  const [selectedCategory, setSelectedCategory] = useState<'Semua' | 'Gizi' | 'Kesehatan Mental'>('Semua');

  const filteredArticles = ARTICLES_DATA.filter(article => {
    if (selectedCategory === 'Semua') return true;
    return article.category === selectedCategory;
  });

  const renderArticleCard = ({ item }: { item: Article }) => {
    const IconComponent = item.icon;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          {/* Circular Icon on the Left */}
          <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
            <IconComponent size={20} color={item.iconColor} strokeWidth={2.5} />
          </View>
          
          <View style={styles.headerDetails}>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, item.category === 'Gizi' ? styles.badgeGizi : styles.badgeMental]}>
                <Text style={[styles.badgeText, item.category === 'Gizi' ? styles.badgeGiziText : styles.badgeMentalText]}>
                  {item.category}
                </Text>
              </View>
              <Text style={styles.readTimeText}>• {item.readTime}</Text>
            </View>
            <Text style={styles.articleTitle}>{item.title}</Text>
          </View>
        </View>

        <Text style={styles.articleDesc}>{item.description}</Text>

        <View style={styles.cardDivider} />

        <View style={styles.cardFooter}>
          <Text style={styles.offlineAvailable}>Materi offline tersedia</Text>
          <TouchableOpacity style={styles.readBtn}>
            <Text style={styles.readBtnText}>Baca</Text>
            <Text style={styles.readBtnChevron}> {'>'}</Text>
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
        <Text style={styles.title}>Edukasi & Literasi</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Category Filter Tabs */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterChip, selectedCategory === 'Semua' && styles.filterChipActive]}
          onPress={() => setSelectedCategory('Semua')}
        >
          <Text style={[styles.filterText, selectedCategory === 'Semua' && styles.filterTextActive]}>
            Semua
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, selectedCategory === 'Gizi' && styles.filterChipActive]}
          onPress={() => setSelectedCategory('Gizi')}
        >
          <Text style={[styles.filterText, selectedCategory === 'Gizi' && styles.filterTextActive]}>
            Gizi
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, selectedCategory === 'Kesehatan Mental' && styles.filterChipActive]}
          onPress={() => setSelectedCategory('Kesehatan Mental')}
        >
          <Text style={[styles.filterText, selectedCategory === 'Kesehatan Mental' && styles.filterTextActive]}>
            Kesehatan Mental
          </Text>
        </TouchableOpacity>
      </View>

      {/* Articles Listing */}
      <FlatList
        data={filteredArticles}
        keyExtractor={item => item.id}
        renderItem={renderArticleCard}
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#f0f4f8',
  },
  filterChipActive: {
    backgroundColor: '#1b5be8',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5a6b7e',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20, // 2xl (16-20px)
    borderWidth: 1.5,
    borderColor: 'rgba(26, 35, 50, 0.08)',
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerDetails: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  badgeGizi: {
    backgroundColor: '#DCFCE7',
  },
  badgeMental: {
    backgroundColor: '#F3E8FF',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  badgeGiziText: {
    color: '#16A34A',
  },
  badgeMentalText: {
    color: '#9333EA',
  },
  readTimeText: {
    fontSize: 11,
    color: '#5a6b7e',
    fontWeight: '500',
    marginLeft: 6,
  },
  articleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a2332',
    lineHeight: 20,
  },
  articleDesc: {
    fontSize: 13,
    color: '#5a6b7e',
    lineHeight: 18,
    marginTop: 10,
    marginBottom: 12,
    paddingLeft: 0,
  },
  cardDivider: {
    height: 1.5,
    backgroundColor: 'rgba(26, 35, 50, 0.08)',
    marginVertical: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
  },
  offlineAvailable: {
    fontSize: 12,
    fontWeight: '500',
    color: '#8a9ab0',
  },
  readBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1b5be8',
  },
  readBtnChevron: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1b5be8',
  },
});
