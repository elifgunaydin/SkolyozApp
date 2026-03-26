import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native'; // EKLENDİ: Hangi cihazda olduğumuzu anlamak için

// app.py dosyanızdaki orijinal Supabase bilgileriniz
const supabaseUrl = 'https://icpkpxgzcagqkzoirsgw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljcGtweGd6Y2FncWt6b2lyc2d3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0OTY5MjcsImV4cCI6MjA4MDA3MjkyN30.GnRHTQfYwvssYVfl0oEUc520yjP0aachF1zmdwwWyAg';

// EKLENDİ: Eğer ortam "web" ise AsyncStorage'ı devre dışı bırak, Supabase kendi web ayarını yapsın
const expoStorage = Platform.OS === 'web' ? undefined : AsyncStorage;

// Mobil uygulama için AsyncStorage ile yapılandırılmış Supabase istemcisi
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: expoStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});