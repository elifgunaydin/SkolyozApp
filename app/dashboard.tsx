import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { supabase } from '../services/supabase';

export default function DashboardScreen() {
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState<string | null>(null); // UserId state'e alınır
  const [loading, setLoading] = useState(true);
  const [analyses, setAnalyses] = useState<any[]>([]);

 // 1. İlk girişte kullanıcı bilgilerini al
  useEffect(() => {
    async function getUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserName(user.user_metadata?.full_name || 'Kullanıcı');
        setUserId(user.id);
      } else {
        setLoading(false);
      }
    }
    getUserData();
  }, []);

  // 2. ÇÖZÜM: Sayfa her odaklandığında (Focus) verileri tekrar çek
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        fetchAnalyses(userId);
      }
    }, [userId])
  );

  async function fetchAnalyses(userId: string) {
    try {
      const { data, error } = await supabase
        .from('image')
        .select('*')
        .eq('user_id', userId)
        .order('upload_date', { ascending: false }); 

      if (error) console.error("Supabase Çekme Hatası:", error);
      else if (data) setAnalyses(data);
    } catch (error) {
      console.error('Veri çekme hatası:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/'); 
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Tarih Yok';
    const date = new Date(dateString);
    date.setHours(date.getHours() + 3);
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const handleViewResult = (item: any) => {
    // Güvenli URL gönderimi
    const safeImageUrl = item.filename ? encodeURIComponent(item.filename) : '';

    router.push({
      pathname: '/detail',
      params: {
        patient_name: item.patient_name,
        upload_date: item.upload_date,
        filename: safeImageUrl,
        cobb_angle: item.cobb_angle,
        diagnosis: item.diagnosis,
        diagnosis_color: item.diagnosis_color
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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

      <TouchableOpacity style={styles.newAnalysisButton} onPress={() => router.push('/process')} >
        <Text style={styles.newAnalysisButtonText}>+ Yeni Röntgen Analizi Yap</Text>
      </TouchableOpacity>

      <View style={styles.historyContainer}>
        <Text style={styles.historyTitle}>Geçmiş Analizleriniz</Text>
        
        {analyses.length > 0 ? (
          <FlatList
            data={analyses}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={[styles.historyCard, item.diagnosis_color ? { borderLeftColor: item.diagnosis_color } : null]}>
                
                <View style={styles.historyInfo}>
                  <Text style={styles.historyPatientName}>{item.patient_name}</Text>
                  <Text style={styles.historyDate}>{formatDate(item.upload_date)}</Text>
                </View>

                <TouchableOpacity 
                  style={styles.viewResultButton}
                  onPress={() => handleViewResult(item)}
                >
                  <Text style={styles.viewResultButtonText}>Sonucu Gör</Text>
                </TouchableOpacity>

              </View>
            )}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>Henüz bir analiz bulunmuyor.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f7f6', padding: 20 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f4f7f6' },
  logoutButton: { padding: 5 },
  logoutText: { color: '#e74c3c', fontWeight: 'bold', fontSize: 16 },
  headerBox: { marginTop: 10, marginBottom: 30 },
  welcomeText: { fontSize: 18, color: '#7f8c8d' },
  nameText: { fontSize: 26, fontWeight: 'bold', color: '#2c3e50', marginTop: 5 },
  newAnalysisButton: { backgroundColor: '#27ae60', padding: 20, borderRadius: 12, alignItems: 'center', shadowColor: '#27ae60', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5, marginBottom: 20 },
  newAnalysisButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  historyContainer: { flex: 1 },
  historyTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 15 },
  emptyState: { backgroundColor: 'white', padding: 30, borderRadius: 10, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: '#bdc3c7' },
  emptyStateText: { color: '#95a5a6', fontSize: 15 },
  
  historyCard: { 
    flexDirection: 'row', 
    backgroundColor: 'white', 
    padding: 15, 
    borderRadius: 10, 
    marginBottom: 10, 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 3, 
    elevation: 2,
    borderLeftWidth: 5,
    borderLeftColor: '#bdc3c7', 
  },
  historyInfo: { 
    flex: 1, 
    marginRight: 10 
  },
  historyPatientName: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#2c3e50', 
    marginBottom: 4 
  },
  historyDate: { 
    fontSize: 13, 
    color: '#7f8c8d' 
  },
  viewResultButton: {
    backgroundColor: '#3498db', 
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  viewResultButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },
});