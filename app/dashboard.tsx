import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { router, Stack } from 'expo-router';
import { supabase } from '../services/supabase';

export default function DashboardScreen() {
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  // Sayfa açıldığında kullanıcının bilgilerini çekiyoruz
  useEffect(() => {
    async function getUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Kayıt olurken girdiğimiz full_name bilgisini alıyoruz
        setUserName(user.user_metadata?.full_name || 'Kullanıcı');
      }
      setLoading(false);
    }
    getUserData();
  }, []);

  // Çıkış Yapma Fonksiyonu
  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/'); // Giriş ekranına geri yolla
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* headerLeft: () => null özelliği iOS'taki "Geri" tuşunu gizler. 
        Çünkü giriş yapmış biri geri tuşuyla Login ekranına dönmemelidir. 
      */}
      <Stack.Screen 
        options={{ 
          title: 'Ana Sayfa',
          headerLeft: () => null,
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Çıkış</Text>
            </TouchableOpacity>
          )
        }} 
      />

      <View style={styles.headerBox}>
        <Text style={styles.welcomeText}>Hoş Geldiniz,</Text>
        <Text style={styles.nameText}>{userName}</Text>
      </View>

      <TouchableOpacity 
        style={styles.newAnalysisButton}
        onPress={() => router.push('/process')} // Yakında yapacağımız analiz sayfasına gider
      >
        <Text style={styles.newAnalysisButtonText}>+ Yeni Röntgen Analizi Yap</Text>
      </TouchableOpacity>

      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Geçmiş Analizleriniz</Text>
        
        {/* Şimdilik boş görünecek, burayı ileride veritabanına bağlayacağız */}
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Henüz bir analiz bulunmuyor.</Text>
        </View>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f7f6',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f7f6',
  },
  logoutButton: {
    padding: 5,
  },
  logoutText: {
    color: '#e74c3c', // Kırmızı çıkış rengi
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerBox: {
    marginTop: 10,
    marginBottom: 30,
  },
  welcomeText: {
    fontSize: 18,
    color: '#7f8c8d',
  },
  nameText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginTop: 5,
  },
  newAnalysisButton: {
    backgroundColor: '#27ae60', // Medikal yeşil - güven verir
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 30,
  },
  newAnalysisButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  historyContainer: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 10,
    alignItems: 'center',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#bdc3c7',
  },
  emptyStateText: {
    color: '#95a5a6',
    fontSize: 15,
  },
});