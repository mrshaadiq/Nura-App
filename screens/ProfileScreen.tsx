import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from 'react-native';
import { addPatient } from '../database/database';
import { useAppNavigation } from '../navigation/NavigationContext';

export default function ProfileScreen() {
  const { navigate } = useAppNavigation();
  const [nama, setNama] = useState('');
  const [gender, setGender] = useState<'L' | 'P' | null>(null);
  
  // Custom Date Selectors
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const months = [
    { label: 'Januari', val: '01' },
    { label: 'Februari', val: '02' },
    { label: 'Maret', val: '03' },
    { label: 'April', val: '04' },
    { label: 'Mei', val: '05' },
    { label: 'Juni', val: '06' },
    { label: 'Juli', val: '07' },
    { label: 'Agustus', val: '08' },
    { label: 'September', val: '09' },
    { label: 'Oktober', val: '10' },
    { label: 'November', val: '11' },
    { label: 'Desember', val: '12' }
  ];

  const handleRegister = async () => {
    if (!nama.trim()) {
      Alert.alert('Data Belum Lengkap', 'Silakan masukkan nama lengkap pasien.');
      return;
    }
    if (!gender) {
      Alert.alert('Data Belum Lengkap', 'Silakan pilih jenis kelamin.');
      return;
    }
    
    // Date validation
    const dInt = parseInt(day);
    const mInt = parseInt(month);
    const yInt = parseInt(year);
    
    if (isNaN(dInt) || dInt < 1 || dInt > 31) {
      Alert.alert('Format Salah', 'Silakan masukkan tanggal lahir (1-31) yang valid.');
      return;
    }
    if (isNaN(mInt) || mInt < 1 || mInt > 12) {
      Alert.alert('Format Salah', 'Silakan masukkan bulan lahir yang valid.');
      return;
    }
    const currentYear = new Date().getFullYear();
    if (isNaN(yInt) || yInt < 1900 || yInt > currentYear) {
      Alert.alert('Format Salah', `Silakan masukkan tahun lahir yang valid (1900 - ${currentYear}).`);
      return;
    }

    const formattedDay = day.padStart(2, '0');
    const formattedMonth = month.padStart(2, '0');
    const dob = `${year}-${formattedMonth}-${formattedDay}`;

    // Verify date is valid calendar date
    const parsedDate = new Date(dob);
    if (isNaN(parsedDate.getTime())) {
      Alert.alert('Tanggal Tidak Valid', 'Silakan periksa kembali kombinasi hari, bulan, dan tahun lahir.');
      return;
    }

    try {
      const patientId = await addPatient(nama.trim(), dob, gender);
      console.log("Patient registered with ID:", patientId);
      // Navigate to the questionnaire directly
      navigate('Questionnaire', { patientId });
    } catch (error) {
      console.error("Failed to register patient:", error);
      Alert.alert('Error', 'Gagal mendaftarkan pasien ke database.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => navigate('Home')}>
              <Text style={styles.backBtnText}>← Kembali</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Registrasi Pasien</Text>
            <Text style={styles.subtitle}>Masukkan biodata dasar pasien sebelum memulai skrining.</Text>
          </View>

          <View style={styles.form}>
            {/* Nama Lengkap */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nama Lengkap Pasien</Text>
              <TextInput
                style={styles.input}
                placeholder="Contoh: Muhammad Budi"
                placeholderTextColor="#94A3B8"
                value={nama}
                onChangeText={setNama}
              />
            </View>

            {/* Jenis Kelamin */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Jenis Kelamin</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[
                    styles.genderCard,
                    gender === 'L' && styles.genderCardSelected,
                    { marginRight: 8 }
                  ]}
                  onPress={() => setGender('L')}
                >
                  <Text style={[styles.genderEmoji, gender === 'L' && styles.textSelected]}>👦</Text>
                  <Text style={[styles.genderLabel, gender === 'L' && styles.textSelected]}>Laki-laki</Text>
                  <Text style={[styles.genderSub, gender === 'L' && styles.textMutedSelected]}>L</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.genderCard,
                    gender === 'P' && styles.genderCardSelected,
                    { marginLeft: 8 }
                  ]}
                  onPress={() => setGender('P')}
                >
                  <Text style={[styles.genderEmoji, gender === 'P' && styles.textSelected]}>👧</Text>
                  <Text style={[styles.genderLabel, gender === 'P' && styles.textSelected]}>Perempuan</Text>
                  <Text style={[styles.genderSub, gender === 'P' && styles.textMutedSelected]}>P</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Tanggal Lahir (DOB) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tanggal Lahir</Text>
              <View style={styles.dateInputsContainer}>
                {/* Hari */}
                <View style={[styles.dateInputWrapper, { flex: 1.2 }]}>
                  <Text style={styles.dateSubLabel}>Hari (DD)</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="25"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={day}
                    onChangeText={setDay}
                  />
                </View>

                {/* Bulan */}
                <View style={[styles.dateInputWrapper, { flex: 1.5, marginHorizontal: 8 }]}>
                  <Text style={styles.dateSubLabel}>Bulan (MM)</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="12"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={2}
                    value={month}
                    onChangeText={setMonth}
                  />
                </View>

                {/* Tahun */}
                <View style={[styles.dateInputWrapper, { flex: 1.8 }]}>
                  <Text style={styles.dateSubLabel}>Tahun (YYYY)</Text>
                  <TextInput
                    style={styles.dateInput}
                    placeholder="2024"
                    placeholderTextColor="#94A3B8"
                    keyboardType="number-pad"
                    maxLength={4}
                    value={year}
                    onChangeText={setYear}
                  />
                </View>
              </View>
              <Text style={styles.dobHint}>Contoh: Hari: 12, Bulan: 08, Tahun: 2024</Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity style={styles.submitBtn} onPress={handleRegister}>
              <Text style={styles.submitBtnText}>Daftarkan Pasien & Mulai</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingBottom: 12,
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
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    lineHeight: 20,
  },
  form: {
    paddingHorizontal: 20,
    marginTop: 8,
  },
  inputGroup: {
    marginBottom: 22,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 15,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  genderContainer: {
    flexDirection: 'row',
  },
  genderCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  genderCardSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  genderEmoji: {
    fontSize: 24,
    marginBottom: 6,
  },
  genderLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  genderSub: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  textSelected: {
    color: '#4F46E5',
  },
  textMutedSelected: {
    color: '#818CF8',
  },
  dateInputsContainer: {
    flexDirection: 'row',
  },
  dateInputWrapper: {
    justifyContent: 'center',
  },
  dateSubLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '600',
  },
  dateInput: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    textAlign: 'center',
    borderRadius: 12,
    fontSize: 15,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dobHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
    fontStyle: 'italic',
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
    marginTop: 10,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
