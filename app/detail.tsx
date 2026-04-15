import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';

export default function DetailScreen() {
  const params = useLocalSearchParams();

  const patientName = String(params.patient_name || '');
  const uploadDate = String(params.upload_date || '');
  const cobbAngle = String(params.cobb_angle || '');
  const diagnosis = String(params.diagnosis || '');
  const diagnosisColor = String(params.diagnosis_color || '#e67e22');

  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // GÜVENLİK KALKANI: Eğer sayfaya yanlışlıkla (giriş yaparken vb.) verisiz gelinirse,
  // kullanıcıyı anında güvenli bir şekilde Ana Sayfaya (Dashboard) postala!
  useEffect(() => {
    if (!params.patient_name && !params.filename) {
      // Geçmiş yoksa router.back() ÇÖKER. Bu yüzden zorla ana sayfaya yönlendiriyoruz.
      router.replace('/dashboard'); // Ana sayfanızın adı '/' ise burayı '/' yapın
    }
  }, [params]);

  let rawFilename = params.filename;
  if (Array.isArray(rawFilename)) rawFilename = rawFilename[0];
  rawFilename = String(rawFilename || '');

  let imageUrl = '';
  if (rawFilename && rawFilename !== 'undefined') {
    try {
      // .trim() komutu sağdaki/soldaki görünmez boşlukları jilet gibi kesip atar!
      imageUrl = decodeURIComponent(rawFilename).trim(); 
    } catch (e) {
      imageUrl = rawFilename.trim();
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === 'undefined') return 'Tarih Yok';
    const date = new Date(dateString);
    date.setHours(date.getHours() + 3);
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${year}  Saat: ${hours}:${minutes}`;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Detay', headerBackTitle: 'Geri' }} />

      <View style={styles.headerBox}>
        <Text style={styles.title}>Analiz Detayı</Text>
        <Text style={styles.subtitle}>Hasta: <Text style={styles.boldText}>{patientName}</Text></Text>
        <Text style={styles.dateText}>{formatDate(uploadDate)}</Text>
      </View>

      <View style={styles.imageContainer}>
        {imageUrl ? (
          <>
            {imageLoading && !imageError && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#3498db" />
                <Text style={styles.loadingText}>Röntgen Yükleniyor...</Text>
              </View>
            )}

            {imageError ? (
              <View style={styles.placeholderBox}>
                <Text style={styles.errorText}>Resim yüklenemedi!</Text>
                <Text style={styles.debugText}>Sunucudan Gelen Link:</Text>
                <Text style={styles.debugLinkText}>{imageUrl}</Text>
              </View>
            ) : (
              <Image
                source={{ uri: imageUrl }}
                style={styles.previewImage}
                resizeMode="contain"
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
              />
            )}
          </>
        ) : (
          <View style={styles.placeholderBox}>
            <Text style={styles.placeholderText}>Görüntü Bekleniyor...</Text>
          </View>
        )}
      </View>

      {cobbAngle && cobbAngle !== 'undefined' ? (
        <View style={[styles.resultCard, { borderLeftColor: diagnosisColor }]}>
          <Text style={styles.resultTitle}>Ölçüm Sonucu</Text>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Hesaplanan Cobb Açısı:</Text>
            <Text style={styles.resultValue}>{cobbAngle}°</Text>
          </View>
          <View style={styles.resultRow}>
            <Text style={styles.resultLabel}>Durum:</Text>
            <Text style={[styles.resultRisk, { color: diagnosisColor }]}>
              {diagnosis}
            </Text>
          </View>
        </View>
      ) : null}

      {/* GÜNCELLENEN AKILLI GERİ DÖN BUTONU */}
      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={() => {
          try {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/dashboard'); // Çökmek yerine Ana Sayfaya git
            }
          } catch (error) {
            router.replace('/dashboard');
          }
        }}
      >
        <Text style={styles.closeButtonText}>Geri Dön</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#f4f7f6', padding: 20, alignItems: 'center' },
  headerBox: { width: '100%', backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2c3e50', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
  subtitle: { fontSize: 18, color: '#34495e', marginBottom: 5 },
  boldText: { fontWeight: 'bold', color: '#2c3e50' },
  dateText: { fontSize: 14, color: '#7f8c8d', marginTop: 5 },
  imageContainer: { width: '100%', height: 400, backgroundColor: '#ecf0f1', borderRadius: 12, overflow: 'hidden', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#bdc3c7', marginBottom: 20, position: 'relative' },
  previewImage: { width: '100%', height: '100%' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(236, 240, 241, 0.7)', zIndex: 10 },
  loadingText: { marginTop: 10, color: '#2c3e50', fontWeight: 'bold', fontSize: 16 },
  placeholderBox: { alignItems: 'center', padding: 20 },
  placeholderText: { fontSize: 16, color: '#95a5a6' },
  errorText: { fontSize: 18, color: '#e74c3c', fontWeight: 'bold', marginBottom: 10 },
  debugText: { fontSize: 12, color: '#7f8c8d', textAlign: 'center', marginTop: 5 },
  debugLinkText: { fontSize: 10, color: '#3498db', textAlign: 'center', marginTop: 5 },
  resultCard: { width: '100%', backgroundColor: 'white', padding: 20, borderRadius: 12, borderLeftWidth: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, marginBottom: 20 },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  resultLabel: { fontSize: 16, color: '#7f8c8d' },
  resultValue: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
  resultRisk: { fontSize: 18, fontWeight: 'bold' },
  closeButton: { backgroundColor: '#bdc3c7', width: '100%', padding: 18, borderRadius: 10, alignItems: 'center', marginBottom: 30 },
  closeButtonText: { color: '#2c3e50', fontSize: 16, fontWeight: 'bold' }
});