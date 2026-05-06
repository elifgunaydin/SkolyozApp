import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, SafeAreaView, Platform, StatusBar, Dimensions } from 'react-native';
import { router, Stack, useFocusEffect } from 'expo-router';
import { supabase } from '../services/supabase';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  const getUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserName(user.user_metadata?.full_name || 'Kullanıcı');
      setUserId(user.id);
    } else {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { getUserData(); }, []));

  useFocusEffect(
    useCallback(() => {
      if (userId) fetchAnalyses(userId);
    }, [userId])
  );

  const fetchAnalyses = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('image')
        .select('*')
        .eq('user_id', userId)
        .order('upload_date', { ascending: false });

      if (error) console.error("Veri Çekme Hatası:", error);
      else if (data) setAnalyses(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Tarih Yok';
    const date = new Date(dateString);
    date.setHours(date.getHours() + 3);
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
    return `${day} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  };

  const handleViewResult = (item: any) => {
    router.push({
      pathname: '/detail',
      params: {
        patient_name: item.patient_name,
        filename: item.filename ? encodeURIComponent(item.filename) : '',
        analyzed_url: item.analyzed_url ? encodeURIComponent(item.analyzed_url) : '',
        segmented_url: item.segmented_url ? encodeURIComponent(item.segmented_url) : '',
        cobb_angle: item.cobb_angle,
        diagnosis: item.diagnosis,
        diagnosis_color: item.diagnosis_color
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // --- SAYFA ÜST KISMI (BİNDİRMELİ TASARIM) ---
  const renderHeader = () => (
    <View style={styles.headerWrapper}>
      {/* Kavisli Arka Plan */}
      <View style={styles.headerBackground}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerGreeting}>İyi Günler,</Text>
            <Text style={styles.headerName}>Dr. {userName.split(' ')[0]}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.avatarContainer}>
            <Ionicons name="person" size={20} color="#2563eb" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Üzerine Binen (Floating) Aksiyon Kartı */}
      <View style={styles.floatingCard}>
        <Text style={styles.floatingCardTitle}>Yeni Analiz Başlat</Text>
        <Text style={styles.floatingCardDesc}>Omurga röntgeni yükleyin ve Cobb açısını anında ölçün.</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/process')} activeOpacity={0.8}>
          <Ionicons name="scan-outline" size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>Röntgen Yükle</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Son Analizler</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>Tümü ({analyses.length})</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#2563eb" />
      <Stack.Screen options={{ headerShown: false }} />

      <FlatList
        data={analyses}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          // Renge göre dinamik zemin rengi ayarlama (Creative Tim tarzı)
          const baseColor = item.diagnosis_color || '#94a3b8';
          const lightBgColor = baseColor + '15'; // Hex sonuna saydamlık ekleme
          
          return (
            <TouchableOpacity style={styles.historyCard} onPress={() => handleViewResult(item)} activeOpacity={0.7}>
              {/* Sol İkon Alanı */}
              <View style={[styles.iconBox, { backgroundColor: lightBgColor }]}>
                <Ionicons name="body-outline" size={24} color={baseColor} />
              </View>

              {/* Orta Metin Alanı */}
              <View style={styles.cardInfo}>
                <Text style={styles.patientName} numberOfLines={1}>{item.patient_name}</Text>
                <Text style={styles.dateText}>{formatDate(item.upload_date)}</Text>
              </View>

              {/* Sağ Sonuç Alanı */}
              <View style={styles.cardResult}>
                <Text style={[styles.angleText, { color: baseColor }]}>{item.cobb_angle}°</Text>
                <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="folder-open-outline" size={40} color="#94a3b8" />
            </View>
            <Text style={styles.emptyStateTitle}>Kayıt Bulunamadı</Text>
            <Text style={styles.emptyStateDesc}>Sisteme yüklediğiniz bir analiz henüz bulunmuyor.</Text>
          </View>
        }
      />

      {/* Alt Gezinme Çubuğu (Bottom Navigation - Görsel Amaçlı) */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#2563eb" />
          <Text style={[styles.navText, { color: '#2563eb' }]}>Ana Sayfa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/process')}>
          <View style={styles.fabButton}>
            <Ionicons name="add" size={32} color="#ffffff" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleLogout}>
          <Ionicons name="settings-outline" size={24} color="#94a3b8" />
          <Text style={styles.navText}>Ayarlar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#f8fafc' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  listContent: { paddingBottom: 100 }, // Alt bar için boşluk
  
  // --- KAVİSLİ ÜST BÖLÜM ---
  headerWrapper: { marginBottom: 10 },
  headerBackground: { backgroundColor: '#2563eb', height: 220, borderBottomLeftRadius: 40, borderBottomRightRadius: 40, paddingHorizontal: 24, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 20 : 60 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerGreeting: { color: '#bfdbfe', fontSize: 16, fontWeight: '500', marginBottom: 4 },
  headerName: { color: '#ffffff', fontSize: 26, fontWeight: '800', letterSpacing: 0.5 },
  avatarContainer: { width: 44, height: 44, backgroundColor: '#ffffff', borderRadius: 22, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },

  // --- ÜZERİNE BİNEN KART (Floating Card) ---
  floatingCard: { backgroundColor: '#ffffff', marginHorizontal: 24, marginTop: -60, borderRadius: 24, padding: 24, shadowColor: '#64748b', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 8 },
  floatingCardTitle: { fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  floatingCardDesc: { fontSize: 14, color: '#64748b', lineHeight: 20, marginBottom: 20 },
  primaryButton: { backgroundColor: '#2563eb', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 16 },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },

  // --- LİSTE BAŞLIĞI ---
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 24, marginTop: 32, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#1e293b' },
  seeAllText: { fontSize: 14, fontWeight: '600', color: '#2563eb' },

  // --- LİSTE ELEMANLARI (Creative Tim Tarzı Kartlar) ---
  historyCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', marginHorizontal: 24, marginBottom: 16, padding: 16, borderRadius: 20, shadowColor: '#94a3b8', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  iconBox: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardInfo: { flex: 1, justifyContent: 'center' },
  patientName: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 },
  dateText: { fontSize: 13, color: '#64748b', fontWeight: '500' },
  cardResult: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  angleText: { fontSize: 18, fontWeight: '800' },

  // --- BOŞ DURUM ---
  emptyState: { alignItems: 'center', marginTop: 40, paddingHorizontal: 40 },
  emptyIconCircle: { width: 80, height: 80, backgroundColor: '#f1f5f9', borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyStateTitle: { fontSize: 18, fontWeight: '700', color: '#475569', marginBottom: 8 },
  emptyStateDesc: { fontSize: 14, color: '#94a3b8', textAlign: 'center', lineHeight: 22 },

  // --- ALT GEZİNME ÇUBUĞU (Bottom Navigation) ---
  bottomNav: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: '#ffffff', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 12, paddingBottom: Platform.OS === 'ios' ? 24 : 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 10 },
  navItem: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  navText: { fontSize: 12, fontWeight: '600', color: '#94a3b8', marginTop: 4 },
  fabButton: { width: 60, height: 60, backgroundColor: '#2563eb', borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginTop: -30, shadowColor: '#2563eb', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 }
});
