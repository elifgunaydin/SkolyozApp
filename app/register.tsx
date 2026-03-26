import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { router, Stack } from 'expo-router'; 
import { supabase } from '../services/supabase';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('patient');
  const [doctorCode, setDoctorCode] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!fullName || !email || !password) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm temel alanları doldurun.');
      return;
    }

    if (role === 'doctor' && doctorCode !== 'MED123') {
      Alert.alert('Hata', 'Girdiğiniz Doktor Doğrulama Kodu hatalı!');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });

    // --- GÜÇLENDİRİLMİŞ HATA YAKALAMA SİSTEMİ ---
    if (error) {
      // Supabase bazen doğrudan "User already registered" hatası fırlatır
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        Alert.alert('Kayıtlı E-posta', 'Bu e-posta adresiyle zaten bir hesap bulunuyor. Lütfen giriş yapmayı deneyin.');
      } else {
        Alert.alert('Kayıt Başarısız', error.message);
      }
    } 
    // Supabase hata fırlatmaz ama kullanıcı bilgisini boş veya tanımsız döndürürse:
    else if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
      Alert.alert('Kayıtlı E-posta', 'Bu e-posta adresiyle zaten bir hesap bulunuyor. Lütfen giriş yapmayı deneyin.');
    } 
    // Her şey kusursuzsa ve yepyeni bir hesap açıldıysa:
    else {
      // --- YENİ EKLENEN KISIM: Kendi tablomuz olan 'user' tablosuna kayıt atma ---
      if (data?.user) {
        const { error: dbError } = await supabase
          .from('user') // Supabase'deki tablo adınız (Eğer büyük harfleyse 'User' yapın)
          .insert([
            {
              username: fullName,
              role: role
              // Eğer tablonuzda email sütunu da açtıysanız buraya virgül koyup email: email yazabilirsiniz.
            }
          ]);

        if (dbError) {
          console.log("Tabloya ekleme hatası:", dbError.message);
        }
      }

      Alert.alert('Başarılı!', 'Kayıt işleminiz tamamlandı. Şimdi giriş yapabilirsiniz.');
      router.back(); 
    }

    setLoading(false);
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
    
      <Stack.Screen options={{ title: 'Kayıt Ol', headerBackTitle: 'Giriş' }} />

      <View style={styles.formBox}>
        <Text style={styles.title}>Kayıt Ol</Text>
        <Text style={styles.subtitle}>Sisteme dahil olmak için hesap oluşturun.</Text>

        <TextInput
          style={styles.input}
          placeholder="Adınız ve Soyadınız"
          value={fullName}
          onChangeText={setFullName}
        />

        <TextInput
          style={styles.input}
          placeholder="E-posta Adresi"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Şifre"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={styles.label}>Rolünüzü Seçin:</Text>
        <View style={styles.roleContainer}>
          <TouchableOpacity 
            style={[styles.roleButton, role === 'patient' && styles.roleButtonActive]} 
            onPress={() => setRole('patient')}
          >
            <Text style={[styles.roleText, role === 'patient' && styles.roleTextActive]}>Hasta</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.roleButton, role === 'doctor' && styles.roleButtonActive]} 
            onPress={() => setRole('doctor')}
          >
            <Text style={[styles.roleText, role === 'doctor' && styles.roleTextActive]}>Doktor</Text>
          </TouchableOpacity>
        </View>

        {role === 'doctor' && (
          <View style={styles.doctorCodeContainer}>
            <Text style={styles.doctorCodeLabel}>Doktor Doğrulama Kodu:</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: MED123"
              value={doctorCode}
              onChangeText={setDoctorCode}
            />
          </View>
        )}

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleRegister} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Kayıt Ol</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Zaten üye misiniz? </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.linkText}>Giriş Yap</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#f4f7f6',
    justifyContent: 'center',
    padding: 20,
  },
  formBox: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
    outlineStyle: 'none' as any, // Web tarayıcısı için eklendi
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 10,
    marginTop: 5,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  roleButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: '#f9f9f9',
  },
  roleButtonActive: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  roleText: {
    color: '#666',
    fontWeight: 'bold',
  },
  roleTextActive: {
    color: '#fff',
  },
  doctorCodeContainer: {
    backgroundColor: '#eaf2f8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#bce8f1',
  },
  doctorCodeLabel: {
    fontSize: 13,
    color: '#31708f',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
  },
  footerText: {
    color: '#7f8c8d',
    fontSize: 14,
  },
  linkText: {
    color: '#3498db',
    fontWeight: 'bold',
    fontSize: 14,
  },
});