import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';

const screenWidth = Dimensions.get('window').width;
const IMAGE_BOX_WIDTH = screenWidth - 40; // Ekran genişliği eksi padding

export default function DetailScreen() {
  const params = useLocalSearchParams();

  const patientName = String(params.patient_name || '');
  const uploadDate = String(params.upload_date || '');
  const cobbAngle = String(params.cobb_angle || '');
  const diagnosis = String(params.diagnosis || '');
  const diagnosisColor = String(params.diagnosis_color || '#e67e22');

  const [imageLoading, setImageLoading] = useState(true);

  useEffect(() => {
    if (!params.patient_name && !params.filename) {
      router.replace('/dashboard'); 
    }
  }, [params]);

  // URL'leri güvenli şekilde decode etme fonksiyonu
  const getSafeUrl = (paramValue: any) => {
    let raw = Array.isArray(paramValue) ? paramValue[0] : paramValue;
    raw = String(raw || '');
    if (!raw || raw === 'undefined') return '';
    try {
      return decodeURIComponent(raw).trim();
    } catch (e) {
      return raw.trim();
    }
  };

  // Mevcut Supabase veritabanınızda şimdilik sadece 1 fotoğraf kayıtlı ('filename')
  // İleride veritabanına 'analyzed_url' ve 'segmented_url' eklediğinizde burası otomatik o resimleri çekecektir.
  // API henüz bağlı değilse, uygulamanın boş kalmaması için üç sekmeye de aynı resmi koyar.
  const originalUrl = getSafeUrl(params.filename);
  const analyzedUrl = getSafeUrl(params.analyzed_url) || originalUrl; 
  const segmentedUrl = getSafeUrl(params.segmented_url) || originalUrl;

  const imagesToDisplay = [
<<<<<<< Updated upstream
    { id: 1, uri: analyzedUrl, label: "Cobb Açısı Analizi" },
    { id: 2, uri: segmentedUrl, label: "Omurga Segmentasyonu" },
    { id: 3, uri: originalUrl, label: "Orijinal Görüntü" }
=======
    { id: 1, uri: analyzedUrl, label: "Analizli Görüntü" },
    { id: 2, uri: segmentedUrl, label: "Segmentasyon" },
    { id: 3, uri: originalUrl, label: "Ham Görüntü" }
>>>>>>> Stashed changes
  ];

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

      <View style={styles.carouselWrapper}>
        <ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false}
          style={styles.carouselScroll}
        >
          {imagesToDisplay.map((img) => (
            <View key={img.id} style={styles.slide}>
              {img.uri ? (
                <>
                  {imageLoading && (
                    <View style={styles.loadingOverlay}>
                      <ActivityIndicator size="large" color="#3498db" />
                    </View>
                  )}
                  <Image
                    source={{ uri: img.uri }}
                    style={styles.previewImage}
                    resizeMode="contain" // Kesinlikle contain! Açılar bozulmaz ve kesilmez.
                    onLoadEnd={() => setImageLoading(false)}
                  />
                  <Text style={styles.imageBadge}>{img.label}</Text>
                </>
              ) : (
                <View style={styles.placeholderBox}>
                  <Text style={styles.placeholderText}>Görüntü Bulunamadı</Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
<<<<<<< Updated upstream
        <Text style={styles.swipeHint}>Omurga segmentasyonu ve orijinal görüntü için yana kaydırınız.</Text>
=======
        <Text style={styles.swipeHint}>💡 Omurga segmentasyonu ve ham görüntü için yana kaydırın 👉</Text>
>>>>>>> Stashed changes
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

      <TouchableOpacity 
        style={styles.closeButton} 
        onPress={() => {
          try {
            if (router.canGoBack()) router.back();
            else router.replace('/dashboard');
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
  
  // YENİ EKLENEN CAROUSEL STİLLERİ
  carouselWrapper: { width: '100%', marginBottom: 20 },
  carouselScroll: { width: IMAGE_BOX_WIDTH, height: 400, backgroundColor: '#ecf0f1', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#bdc3c7' },
  slide: { width: IMAGE_BOX_WIDTH, height: 400, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  previewImage: { width: '100%', height: '100%' },
  imageBadge: { position: 'absolute', top: 10, left: 10, backgroundColor: 'rgba(44, 62, 80, 0.8)', color: 'white', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, fontSize: 12, fontWeight: 'bold', overflow: 'hidden' },
  swipeHint: { textAlign: 'center', color: '#7f8c8d', fontSize: 12, marginTop: 8, fontStyle: 'italic' },
  
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(236, 240, 241, 0.7)', zIndex: 10 },
  placeholderBox: { alignItems: 'center', padding: 20 },
  placeholderText: { fontSize: 16, color: '#95a5a6' },
  
  resultCard: { width: '100%', backgroundColor: 'white', padding: 20, borderRadius: 12, borderLeftWidth: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, marginBottom: 20 },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  resultLabel: { fontSize: 16, color: '#7f8c8d' },
  resultValue: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
  resultRisk: { fontSize: 18, fontWeight: 'bold' },
  closeButton: { backgroundColor: '#bdc3c7', width: '100%', padding: 18, borderRadius: 10, alignItems: 'center', marginBottom: 30 },
  closeButtonText: { color: '#2c3e50', fontSize: 16, fontWeight: 'bold' }
});