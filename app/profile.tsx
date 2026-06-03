import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { supabase } from '../services/supabase';

export default function ProfileScreen() {
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Giriş yapan kullanıcının mail adresini çekiyoruz
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setEmail(user.email);
      }
    };
    fetchUser();
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* Üstteki "dashboard/profile" yazan barı tamamen özelleştiriyoruz */}
      <Stack.Screen 
        options={{ 
          headerTitle: 'Profilim',
          headerTitleStyle: { color: '#3b82f6' }, // Profilim yazısı mavi
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.replace('/dashboard')} 
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Ionicons name="chevron-back" size={24} color="#3b82f6" />
              <Text style={{ color: '#3b82f6', fontSize: 16 }}>Ana Sayfa</Text>
            </TouchableOpacity>
          ),
          headerStyle: { backgroundColor: '#f8fafc' },
          headerShadowVisible: false,
        }} 
      />

      {/* Mavi Header Bölümü */}
      <View style={styles.headerBackground} />

      <View style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={100} color="#3b82f6" />
        </View>
        <Text style={styles.userName}>Dr. Elif</Text>
        <Text style={styles.userRole}>Radyoloji Uzmanı</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>109</Text>
          <Text style={styles.statLabel}>Toplam Analiz</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Bu Ay</Text>
        </View>
      </View>

      <View style={styles.menuItem}>
        <Ionicons name="mail-outline" size={22} color="#64748b" />
        <Text style={styles.menuText}>{email || 'Yükleniyor...'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerBackground: { 
    backgroundColor: '#3b82f6', 
    height: 100, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30 
  },
  profileCard: { 
    alignItems: 'center', 
    marginTop: -50, 
    backgroundColor: 'white', 
    marginHorizontal: 20, 
    borderRadius: 20, 
    padding: 20, 
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10
  },
  avatarContainer: { marginBottom: 10 },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  userRole: { fontSize: 14, color: '#64748b' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', margin: 20 },
  statBox: { 
    backgroundColor: 'white', 
    padding: 15, 
    borderRadius: 15, 
    width: '45%', 
    alignItems: 'center', 
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05
  },
  statNumber: { fontSize: 20, fontWeight: 'bold', color: '#3b82f6' },
  statLabel: { fontSize: 12, color: '#64748b' },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: 'white', 
    marginHorizontal: 20, 
    borderRadius: 15,
    elevation: 1 
  },
  menuText: { 
    fontSize: 16, 
    color: '#64748b', 
    marginLeft: 12, 
    fontWeight: '500' 
  }
});