import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { addPatient } from '../database/database';
import { useAppNavigation } from '../navigation/NavigationContext';
import { ChevronLeft, WifiOff } from 'lucide-react-native';

export default function ProfileScreen() {
  const { navigate } = useAppNavigation();
  const [nama, setNama] = useState('');
  const [gender, setGender] = useState<'L' | 'P' | null>(null);
  const [dobText, setDobText] = useState(''); // dd/mm/yyyy

  // Active state for focus rings
  const [nameFocused, setNameFocused] = useState(false);
  const [dobFocused, setDobFocused] = useState(false);

  // Auto-format dates as the user types (dd/mm/yyyy)
  const handleDobChange = (text: string) => {
    // Keep only numbers
    const clean = text.replace(/[^0-9]/g, '');
    let formatted = '';
    
    if (clean.length > 0) {
      formatted = clean.substring(0, 2);
    }
    if (clean.length > 2) {
      formatted += '/' + clean.substring(2, 4);
    }
    if (clean.length > 4) {
      formatted += '/' + clean.substring(4, 8);
    }
    setDobText(formatted);
  };

  const handleRegister = async () => {
    if (!nama.trim()) {
      Alert.alert('Data Belum Lengkap', 'Silakan masukkan nama lengkap anak.');
      return;
    }
    if (!gender) {
      Alert.alert('Data Belum Lengkap', 'Silakan pilih jenis kelamin.');
      return;
    }
    if (dobText.length < 10) {
      Alert.alert('Format Salah', 'Silakan masukkan tanggal lahir lengkap dengan format dd/mm/yyyy.');
      return;
    }

    const parts = dobText.split('/');
    if (parts.length !== 3) {
      Alert.alert('Format Salah', 'Silakan gunakan format dd/mm/yyyy.');
      return;
    }

    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);

    if (isNaN(day) || day < 1 || day > 31) {
      Alert.alert('Tanggal Salah', 'Masukkan tanggal lahir yang valid (01 - 31).');
      return;
    }
    if (isNaN(month) || month < 1 || month > 12) {
      Alert.alert('Bulan Salah', 'Masukkan bulan lahir yang valid (01 - 12).');
      return;
    }

    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1990 || year > currentYear) {
      Alert.alert('Tahun Salah', `Masukkan tahun lahir yang valid (1990 - ${currentYear}).`);
      return;
    }

    const formattedDay = parts[0].padStart(2, '0');
    const formattedMonth = parts[1].padStart(2, '0');
    const dob = `${year}-${formattedMonth}-${formattedDay}`;

    // Validate if it is a real calendar date
    const testDate = new Date(dob);
    if (isNaN(testDate.getTime())) {
      Alert.alert('Tanggal Tidak Valid', 'Silakan periksa kembali kombinasi tanggal, bulan, dan tahun lahir.');
      return;
    }

    try {
      const patientId = await addPatient(nama.trim(), dob, gender);
      console.log("[Profile] Child registered with ID:", patientId);
      // Navigate to the Questionnaire/Measurements screen
      navigate('Questionnaire', { patientId });
    } catch (error) {
      console.error("[Profile] Failed to register child:", error);
      Alert.alert('Error', 'Gagal mendaftarkan profil anak ke database.');
    }
  };

  const isFormValid = nama.trim() && gender && dobText.length === 10;

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

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigate('Home')}>
              <ChevronLeft size={22} color="#1A2332" strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={styles.title}>Profil Anak</Text>
            <View style={{ width: 44 }} />
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Nama Lengkap */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Anak</Text>
              <TextInput
                style={[styles.input, nameFocused && styles.inputFocused]}
                placeholder="eve"
                placeholderTextColor="#A0AEC0"
                value={nama}
                onChangeText={setNama}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
              />
            </View>

            {/* Tanggal Lahir */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Masukkan Tanggal Lahir</Text>
              <TextInput
                style={[styles.input, dobFocused && styles.inputFocused]}
                placeholder="dd/mm/yyyy"
                placeholderTextColor="#A0AEC0"
                keyboardType="number-pad"
                maxLength={10}
                value={dobText}
                onChangeText={handleDobChange}
                onFocus={() => setDobFocused(true)}
                onBlur={() => setDobFocused(false)}
              />
            </View>

            {/* Jenis Kelamin */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Jenis Kelamin</Text>
              <View style={styles.genderRow}>
                <TouchableOpacity
                  style={[
                    styles.genderCard,
                    gender === 'L' ? styles.genderCardActive : styles.genderCardInactive
                  ]}
                  onPress={() => setGender('L')}
                >
                  <Text style={[styles.genderText, gender === 'L' ? styles.genderTextActive : styles.genderTextInactive]}>
                    👦 Laki-laki
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.genderCard,
                    gender === 'P' ? styles.genderCardActive : styles.genderCardInactive
                  ]}
                  onPress={() => setGender('P')}
                >
                  <Text style={[styles.genderText, gender === 'P' ? styles.genderTextActive : styles.genderTextInactive]}>
                    👧 Perempuan
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, !isFormValid && styles.submitBtnDisabled]}
              onPress={handleRegister}
              activeOpacity={0.8}
            >
              <Text style={styles.submitBtnText}>Lanjut  {'>'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Nav Dots Simulator */}
      <View style={styles.navDotsContainer}>
        {[...Array(9)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.navDot,
              i === 1 ? styles.navDotActive : styles.navDotInactive
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
  form: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  inputGroup: {
    marginBottom: 24,
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
    borderRadius: 12, // xl
    paddingHorizontal: 16,
    fontSize: 16, // prevent auto-zoom in iOS
    color: '#1a2332',
    fontWeight: '600',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: '#1b5be8',
    backgroundColor: '#f0f4f8',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 12,
  },
  genderCard: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  genderCardActive: {
    backgroundColor: '#1b5be8',
    borderColor: '#1b5be8',
  },
  genderCardInactive: {
    backgroundColor: '#f0f4f8',
    borderColor: 'transparent',
  },
  genderText: {
    fontSize: 14,
    fontWeight: '700',
  },
  genderTextActive: {
    color: '#ffffff',
  },
  genderTextInactive: {
    color: '#5a6b7e',
  },
  submitBtn: {
    backgroundColor: '#1b5be8',
    height: 56,
    borderRadius: 16, // 2xl
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitBtnDisabled: {
    backgroundColor: '#a0aec0',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
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
