import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, ScrollView, Alert, TextInput } from 'react-native';
import { Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../services/supabase'; 
import * as ImageManipulator from 'expo-image-manipulator';

export default function ProcessScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [patientName, setPatientName] = useState(''); 
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{ angle: number; risk: string; riskColor: string } | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Galerinize erişmek için izin vermeniz gerekiyor.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], 
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setResult(null);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Kameranıza erişmek için izin vermeniz gerekiyor.');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: false, 
      quality: 1,           
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setResult(null);
    }
  };

  // --- KESİN ÇÖZÜM: İÇİ DOLU DOSYA OKUYUCU (ArrayBuffer) ---
  // Beyaz ekran (0-Byte) sorununu kökünden çözen fonksiyon
  const getArrayBufferFromUri = async (uri: string): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response as ArrayBuffer);
      };
      xhr.onerror = function () {
        reject(new Error("Fotoğraf okunamadı."));
      };
      xhr.responseType = "arraybuffer"; // BLOB YERİNE ARRAYBUFFER KULLANIYORUZ
      xhr.open("GET", uri, true);
      xhr.send(null);
    });
  };

  const handleAnalyze = async () => {
    if (!image) {
      Alert.alert('Eksik İşlem', 'Lütfen önce bir röntgen görüntüsü seçin.');
      return;
    }

    if (!patientName.trim()) {
      Alert.alert('Eksik Bilgi', 'Lütfen hasta adını giriniz.');
      return;
    }

    setIsAnalyzing(true);

    try {
      
      // 1. Görüntüyü AI modeli ve Supabase için hazırla (Orantılı 512)
      const manipulatedResult = await ImageManipulator.manipulateAsync(
        image,
        // SADECE yüksekliği 512 yapıyoruz. Genişliği orijinal orana göre kendi hesaplayacak.
        [{ resize: { height: 512 } }], 
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      const formData = new FormData();
      formData.append('file', {
        uri: manipulatedResult.uri,
        name: 'xray_512.jpg',
        type: 'image/jpeg',
      } as any);

      // 2. Flask API'ye İstek At
      const apiResponse = await fetch('http://192.168.1.161:5000/api/analyze', {
        method: 'POST',
        body: formData,
      });

      const aiData = await apiResponse.json();

      if (!aiData.success) {
        throw new Error(aiData.error || 'Yapay zeka analizinde hata oluştu.');
      }

      // 3. Oturumu açık olan kullanıcıyı al
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Kullanıcı oturumu bulunamadı.');

      // 4. Görüntüyü Supabase Storage'a Yükle
      // Orijinal image yerine işlenmiş manipulatedResult.uri'yi okuyoruz
      const arrayBuffer = await getArrayBufferFromUri(manipulatedResult.uri);
      // ÇÖZÜM: Dosya ismine rastgele harfler ekleyerek %100 benzersiz yapıyoruz
      const randomString = Math.random().toString(36).substring(2, 8);
      const uniqueFileName = `${user.id}_${Date.now()}_${randomString}.jpg`;

      const { error: storageError } = await supabase.storage
        .from('images') 
        .upload(uniqueFileName, arrayBuffer, {
          contentType: 'image/jpeg'
        });

      if (storageError) throw new Error('Fotoğraf buluta yüklenemedi. Hata: ' + storageError.message);

      // Yüklenen fotoğrafın Public URL'ini al
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(uniqueFileName);

      // 5. Veritabanına Kaydet
      const { error: dbError } = await supabase
        .from('image') 
        .insert({
          filename: publicUrl,
          user_id: user.id,
          patient_name: patientName,
          upload_date: new Date().toISOString(), 
          cobb_angle: parseFloat(Number(aiData.data.cobb_angle).toFixed(1)), 
          diagnosis: aiData.data.diagnosis, 
          diagnosis_color: aiData.data.diagnosis_color 
        });

      if (dbError) {
        throw new Error(`Veritabanı hatası: ${dbError.message}`);
      }

      // 6. Sonuçları Ekranda Göster
      setResult({
        angle: parseFloat(Number(aiData.data.cobb_angle).toFixed(1)), 
        risk: aiData.data.diagnosis,
        riskColor: aiData.data.diagnosis_color,
      });

    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Bir sorun oluştu.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Röntgen Analizi', headerBackTitle: 'Geri' }} />

      <View style={styles.headerBox}>
        <Text style={styles.title}>Yeni Analiz</Text>
        <Text style={styles.subtitle}>
          Hastaya ait Ön-Arka (AP) omurga röntgenini sisteme yükleyin.
        </Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Hasta Adı ve Soyadı"
        value={patientName}
        onChangeText={setPatientName}
        editable={!isAnalyzing}
      />

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

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.actionButton} onPress={takePhoto} disabled={isAnalyzing}>
          <Text style={styles.actionButtonText}> Kamera</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={pickImage} disabled={isAnalyzing}>
          <Text style={styles.actionButtonText}> Galeri</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.analyzeButton, (!image || !patientName.trim()) && styles.analyzeButtonDisabled]} 
        onPress={handleAnalyze}
        disabled={isAnalyzing || !image || !patientName.trim()}
      >
        {isAnalyzing ? (
          <View style={styles.analyzingBox}>
            <ActivityIndicator color="#fff" size="small" />
            <Text style={styles.analyzeButtonText}> Yapay Zeka İşliyor...</Text>
          </View>
        ) : (
          <Text style={styles.analyzeButtonText}> Analiz Et ve Kaydet</Text>
        )}
      </TouchableOpacity>

      {result && (
        <View style={[styles.resultCard, { borderLeftColor: result.riskColor }]}>
          <Text style={styles.resultTitle}>Analiz Sonucu</Text>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Hesaplanan Cobb Açısı:</Text>
            <Text style={styles.resultValue}>{result.angle}°</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Durum:</Text>
            <Text style={[styles.resultRisk, { color: result.riskColor }]}>{result.risk}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f4f7f6', padding: 20, alignItems: 'center' },
  headerBox: { width: '100%', marginBottom: 15 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#7f8c8d', lineHeight: 20 },
  input: { width: '100%', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', padding: 15, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  imageContainer: { width: '100%', height: 350, backgroundColor: 'white', borderRadius: 12, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#bdc3c7', borderStyle: 'dashed', marginBottom: 20 },
  previewImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  placeholderBox: { alignItems: 'center' },
  placeholderText: { fontSize: 18, fontWeight: 'bold', color: '#95a5a6' },
  placeholderSubtext: { fontSize: 14, color: '#bdc3c7', marginTop: 5 },
  buttonRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 20 },
  actionButton: { backgroundColor: 'white', flex: 0.48, padding: 15, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#3498db' },
  actionButtonText: { color: '#3498db', fontWeight: 'bold', fontSize: 16 },
  analyzeButton: { backgroundColor: '#27ae60', width: '100%', padding: 18, borderRadius: 10, alignItems: 'center', shadowColor: '#27ae60', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 4, marginBottom: 20 },
  analyzeButtonDisabled: { backgroundColor: '#95a5a6', shadowOpacity: 0, elevation: 0 },
  analyzingBox: { flexDirection: 'row', alignItems: 'center' },
  analyzeButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  resultCard: { width: '100%', backgroundColor: 'white', padding: 20, borderRadius: 12, borderLeftWidth: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3 },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  resultLabel: { fontSize: 16, color: '#7f8c8d' },
  resultValue: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
  resultRisk: { fontSize: 16, fontWeight: 'bold' },
});