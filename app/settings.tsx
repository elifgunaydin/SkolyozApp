import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { supabase } from '../services/supabase';

// --- ÇEVİRİ SÖZLÜĞÜ ---
const translations = {
  tr: {
    title: 'Ayarlar',
    back: 'Ana Sayfa',
    appSettings: 'Uygulama Ayarları',
    notifications: 'Bildirimler',
    language: 'Dil Seçeneği',
    backup: 'Otomatik Yedekleme',
    support: 'Destek & Bilgi',
    privacy: 'Gizlilik Politikası',
    terms: 'Kullanım Koşulları',
    help: 'Yardım Merkezi',
    logout: 'Güvenli Çıkış Yap',
    logoutConfirm: 'Hesabınızdan çıkış yapmak istediğinize emin misiniz?',
    cancel: 'Vazgeç',
    logoutTitle: 'Güvenli Çıkış'
  },
  en: {
    title: 'Settings',
    back: 'Home',
    appSettings: 'App Settings',
    notifications: 'Notifications',
    language: 'Language Selection',
    backup: 'Auto Backup',
    support: 'Support & Info',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    help: 'Help Center',
    logout: 'Secure Logout',
    logoutConfirm: 'Are you sure you want to log out?',
    cancel: 'Cancel',
    logoutTitle: 'Logout'
  }
};

export default function SettingsScreen() {
  const [isNotificationsEnabled, setNotifications] = useState(true);
  const [lang, setLang] = useState<'tr' | 'en'>('tr'); // Dil durumu

  const t = translations[lang]; // Seçili dile göre metinleri al

  const handleSignOut = async () => {
    Alert.alert(
      t.logoutTitle,
      t.logoutConfirm,
      [
        { text: t.cancel, style: "cancel" },
        { 
          text: t.logout, 
          style: "destructive", 
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/'); 
          } 
        }
      ]
    );
  };

  const toggleLanguage = () => {
    setLang(lang === 'tr' ? 'en' : 'tr');
  };

  const SettingItem = ({ icon, title, value, type = 'arrow', onPress, subText }: any) => (
    <TouchableOpacity 
      style={styles.item} 
      onPress={onPress} 
      disabled={type === 'switch'}
    >
      <View style={styles.itemLeft}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={22} color="#3b82f6" />
        </View>
        <View>
          <Text style={styles.itemTitle}>{title}</Text>
          {subText && <Text style={styles.subText}>{subText}</Text>}
        </View>
      </View>
      
      {type === 'arrow' && <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />}
      {type === 'switch' && (
        <Switch 
          value={isNotificationsEnabled} 
          onValueChange={setNotifications}
          trackColor={{ false: "#cbd5e1", true: "#93c5fd" }}
          thumbColor={isNotificationsEnabled ? "#3b82f6" : "#f4f3f4"}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Üst Bar Düzenlemesi */}
      <Stack.Screen 
        options={{ 
          headerTitle: '', // Settings yazısını sildik
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.replace('/dashboard')} 
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Ionicons name="chevron-back" size={24} color="#3b82f6" />
              <Text style={{ color: '#3b82f6', fontSize: 16 }}>{t.back}</Text>
            </TouchableOpacity>
          ),
          headerStyle: { backgroundColor: '#f8fafc' },
          headerShadowVisible: false,
        }} 
      />

      <View style={styles.headerTitleRow}>
        <Text style={styles.mainTitle}>{t.title}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>{t.appSettings}</Text>
        <View style={styles.section}>
          <SettingItem icon="notifications-outline" title={t.notifications} type="switch" />
          <SettingItem 
            icon="language-outline" 
            title={t.language} 
            subText={lang === 'tr' ? 'Türkçe' : 'English'}
            onPress={toggleLanguage} 
          />
          <SettingItem icon="cloud-upload-outline" title={t.backup} />
        </View>

        <Text style={styles.sectionTitle}>{t.support}</Text>
        <View style={styles.section}>
          <SettingItem icon="shield-checkmark-outline" title={t.privacy} />
          <SettingItem icon="document-text-outline" title={t.terms} />
          <SettingItem icon="help-circle-outline" title={t.help} />
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text style={styles.logoutText}>{t.logout}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerTitleRow: { paddingHorizontal: 25, paddingVertical: 10 },
  mainTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  scrollContent: { padding: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#64748b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  section: { backgroundColor: 'white', borderRadius: 15, marginBottom: 25, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOpacity: 0.05 },
  item: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  itemLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  itemTitle: { fontSize: 16, color: '#334155', fontWeight: '500' },
  subText: { fontSize: 12, color: '#3b82f6', marginTop: 2 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef2f2', padding: 16, borderRadius: 15, marginTop: 10, borderWidth: 1, borderColor: '#fee2e2' },
  logoutText: { color: '#ef4444', fontWeight: 'bold', marginLeft: 10, fontSize: 16 },
});