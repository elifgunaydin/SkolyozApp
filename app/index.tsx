import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { Link, router, Stack } from 'expo-router';
import { supabase } from '../services/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen e-posta ve şifrenizi girin.');
      return;
    }

    setLoading(true);
    
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      Alert.alert('Giriş Başarısız', error.message);
    } else {
      router.replace('/dashboard');
    }
    
    setLoading(false);
  }

  // Ekran içeriğini bir değişkene atıyoruz
  const screenContent = (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Giriş' }} />

      <View style={styles.formBox}>
        <Text style={styles.title}>SkolyozAI Giriş</Text>
        <Text style={styles.subtitle}>Sisteme erişmek için bilgilerinizi girin.</Text>

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

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleLogin} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Giriş Yap</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Hesabınız yok mu? </Text>
          <Link href="/register" asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>Kayıt Ol</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );

  // EĞER WEB TARAYICISIYSA normal halini göster (Tıklama sorunu çözülür)
  if (Platform.OS === 'web') {
    return screenContent;
  }

  // EĞER MOBİL UYGULAMAYSA klavyeyi kapatma özelliğiyle sar
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      {screenContent}
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    marginBottom: 30,
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
    // HATA ÇÖZÜMÜ: 'as any' ekleyerek VS Code'un hata vermesini susturduk
    outlineStyle: 'none' as any, 
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