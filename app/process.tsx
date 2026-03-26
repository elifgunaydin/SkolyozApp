import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

export default function ProcessScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{ angle: number; risk: string } | null>(null);

  // Galeriden Fotoğraf Seçme
  const pickImage = async () => {
    // Önce galeri izni iste
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Galerinize erişmek için izin vermeniz gerekiyor.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // Kullanıcı fotoğrafı kırpabilsin
      quality: 0.8, // Sunucuya hızlı gitsin diye boyutu hafif sıkıştırıyoruz
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setResult(null); // Yeni resim seçilirse eski sonucu temizle
    }
  };

  // Kameradan Fotoğraf Çekme
  const takePhoto = async () => {
    // Önce kamera izni iste
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Kameranıza erişmek için izin vermeniz gerekiyor.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setResult(null);
    }
  };

  // Yapay Zekaya Gönderme Simülasyonu
  const handleAnalyze = () => {
    if (!image) {
      Alert.alert('Eksik İşlem', 'Lütfen önce bir röntgen görüntüsü seçin.');
      return;
    }

    setIsAnalyzing(true);

    // FLASK API ENTEGRASYONU BURAYA GELECEK
    // Şimdilik 2.5 saniye bekleyip sahte bir sonuç üretiyoruz
    setTimeout(() => {
      setIsAnalyzing(false);
      setResult({
        angle: 18.4, // Örnek Cobb açısı
        risk: 'Hafif Derece Skolyoz',
      });
    }, 2500);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Röntgen Analizi', headerBackTitle: 'Geri' }} />

      <View style={styles.headerBox}>
        <Text style={styles.title}>Yeni Analiz</Text>
        <Text style={styles.subtitle}>
          Hastaya ait Ön-Arka (AP) omurga röntgenini sisteme yükleyin. Görüntü net ve dik açıyla çekilmiş olmalıdır.
        </Text>
      </View>

      {/* Görüntü Seçme Alanı */}
      <View style={styles.imageContainer}>
        {image ? (
          <Image source={{ uri: image }} style={styles.previewImage} />
        ) : (
          <View style={styles.placeholderBox}>
            <Text style={styles.placeholderText}>Görüntü Yok</Text>
            <Text style={styles.placeholderSubtext}>Lütfen bir röntgen yükleyin</Text>
          </View>
        )}
      </View>

      {/* Butonlar */}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.actionButton} onPress={takePhoto}>
          <Text style={styles.actionButtonText}>📷 Kamera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
          <Text style={styles.actionButtonText}>🖼️ Galeri</Text>
        </TouchableOpacity>
      </View>

      {/* Analiz Et Butonu */}
      <TouchableOpacity 
        style={[styles.analyzeButton, !image && styles.analyzeButtonDisabled]} 
        onPress={handleAnalyze}
        disabled={isAnalyzing || !image}
      >
        {isAnalyzing ? (
          <View style={styles.analyzingBox}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.analyzeButtonText}> AI İşliyor...</Text>
          </View>
        ) : (
          <Text style={styles.analyzeButtonText}>🤖 Yapay Zeka ile Analiz Et</Text>
        )}
      </TouchableOpacity>

      {/* Sonuç Kartı */}
      {result && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>Analiz Sonucu</Text>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Hesaplanan Cobb Açısı:</Text>
            <Text style={styles.resultValue}>{result.angle}°</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Durum:</Text>
            <Text style={styles.resultRisk}>{result.risk}</Text>
          </View>
        </View>
      )}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f4f7f6',
    padding: 20,
    alignItems: 'center',
  },
  headerBox: {
    width: '100%',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
  },
  imageContainer: {
    width: '100%',
    height: 350,
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#bdc3c7',
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  placeholderBox: {
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#95a5a6',
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#bdc3c7',
    marginTop: 5,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionButton: {
    backgroundColor: 'white',
    flex: 0.48,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3498db',
  },
  actionButtonText: {
    color: '#3498db',
    fontWeight: 'bold',
    fontSize: 16,
  },
  analyzeButton: {
    backgroundColor: '#27ae60', // Medikal yeşil
    width: '100%',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
    marginBottom: 20,
  },
  analyzeButtonDisabled: {
    backgroundColor: '#95a5a6',
    shadowOpacity: 0,
    elevation: 0,
  },
  analyzingBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyzeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultCard: {
    width: '100%',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 5,
    borderLeftColor: '#f1c40f', // Uyarı sarısı
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  resultLabel: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  resultValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  resultRisk: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e67e22',
  },
});