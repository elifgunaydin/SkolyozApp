import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, ScrollView, Alert, TextInput, Dimensions } from 'react-native';
import { Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../services/supabase'; 
import * as ImageManipulator from 'expo-image-manipulator';

const screenWidth = Dimensions.get('window').width;
const IMAGE_BOX_WIDTH = screenWidth - 40;

export default function ProcessScreen() {
  const [image, setImage] = useState<string | null>(null);
  const [patientName, setPatientName] = useState(''); 
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{ angle: number; risk: string; riskColor: string; analyzedImg: string; segmentedImg: string; originalImg: string; } | null>(null);

  const getFileExtension = (uri: string) => {
    return uri.split('.').pop()?.toLowerCase() || '';
  };

  const isImageFile = (uri: string) => {
    const ext = getFileExtension(uri);
    return ['jpg', 'jpeg', 'png'].includes(ext);
  };

  const getRecommendationData = (angleValue: number) => {
    if (isNaN(angleValue)) return null;

    if (angleValue < 10) {
      return {
        title: "Normal (< 10°)",
        desc: "Bu grup klinik olarak skolyoz tanısı almaz, ancak omurga sağlığını korumak önemlidir.",
        home: "Core (merkez bölge) kaslarını güçlendiren genel egzersizler, yoga ve düzenli yürüyüş.",
        doctor: "Herhangi bir tıbbi müdahale gerekmez; yıllık rutin duruş kontrolleri yeterlidir.",
        general: "Masa başında uzun süre vakit geçiriyorsan (yazılım projelerinde olduğu gibi) ergonomik koltuk ve dik duruş alışkanlığı edinmelisin.",
        imagePath: null // Normal olanda fotoğraf yok
      };
    } else if (angleValue >= 10 && angleValue < 25) {
      return {
        title: "Hafif (10° – 25°)",
        desc: "Eğriliğin başlangıç aşamasıdır; temel amaç ilerlemeyi durdurmaktır.",
        home: "Sırtüstü yüzme, pilates ve uzman tarafından verilmiş simetrik esneme hareketleri.",
        doctor: "6 ayda bir fiziksel muayene ve radyolojik takip. Skolyoz odaklı fizyoterapi seanslarına başlangıç.",
        general: "Ağır çantaları tek omuzda taşımaktan kaçınmalı ve vücut asimetrisini fark etmeye odaklanmalısın.",
        imagePath: require('../assets/images/hafif.jpeg')
      };
    } else if (angleValue >= 25 && angleValue < 40) {
      return {
        title: "Orta (25° – 40°)",
        desc: "Orta düzeyde eğrilik saptandı.",
        home: "Schroth yöntemi gibi spesifik asimetrik fizyoterapi hareketleri.",
        doctor: "VAKİT KAYBETMEDEN bir Ortopedi uzmanına başvurmanız önerilir. Gerekli görülürse korse tedavisi planlanabilir.",
        general: "Fiziksel aktivitelerde uzman hekimin kısıtlamalarına harfiyen uyulmalıdır.",
        imagePath: require('../assets/images/orta.jpeg')
      };
    } else if (angleValue >= 40 && angleValue < 80) { // Şiddetli aralığı 40-80 olarak sınırlandırıldı
      return {
        title: "Şiddetli (40° – 80°)",
        desc: "Şiddetli düzeyde eğrilik saptandı.",
        home: "Evde kendi başınıza bilinçsiz egzersiz yapmaktan kaçının.",
        doctor: "Cerrahi müdahale seçeneklerinin değerlendirilmesi için DERHAL bir Omurga Cerrahisi uzmanına başvurmanız KESİNLİKLE tavsiye edilir.",
        general: "Sırt ve bel bölgesini zorlayacak her türlü ağır hareketten kaçınılmalıdır.",
        imagePath: require('../assets/images/siddetli.jpeg')
      };
    } else {
      return {
        title: "Çok Şiddetli (≥ 80°)",
        desc: "Yaşam kalitesini ciddi oranda etkileyebilecek, iç organ baskısının arttığı aşamadır.",
        home: "Sadece doktorun izin verdiği çok hafif esneme hareketleri ve derin nefes egzersizleri.",
        doctor: "Genellikle acil cerrahi müdahale ve multidisipliner (kardiyoloji, göğüs hastalıkları ve ortopedi) bir yaklaşım gerektirir.",
        general: "En kısa sürede uzman bir omurga merkezine başvurulmalı ve cerrahi sonrası rehabilitasyon süreci planlanmalıdır.",
        imagePath: null // Çok şiddetli durumda da özel bir fotoğraf yoktur.
      };
    }
  };

  // Kullanıcının cihaz galerisine erişim izni isteyerek, kayıtlı fotoğraflar arasından
  //mevcut bir röntgen görüntüsünün seçilmesini ve sisteme aktarılmasını sağlar.
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Galerinize erişmek için izin vermeniz gerekiyor.');
      return;
    }
    let res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 1 });
    if (!res.canceled) { setImage(res.assets[0].uri); setResult(null); }
  };

  // Kullanıcının cihaz kamerasına erişim izni isteyerek, anlık olarak yeni bir röntgen fotoğrafı çekilmesini ve 
  //uygulamanın analiz arabelleğine alınmasını sağlar.
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Kameranıza erişmek için izin vermeniz gerekiyor.');
      return;
    }
    let res = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 1 });
    if (!res.canceled) { setImage(res.assets[0].uri); setResult(null); }
  };

  const pickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'application/octet-stream', 
        'image/png', 'image/jpeg'], copyToCacheDirectory: true });
      if (!res.canceled && res.assets.length > 0) { setImage(res.assets[0].uri); setResult(null); }
    } catch (err) { Alert.alert('Hata', 'Dosya seçilirken bir sorun oluştu.'); }
  };

  // Cihazın yerel dosya sistemini açarak, E-Nabız veya HBYS gibi sistemlerden indirilmiş PDF, BIN veya standart görüntü
  //uzantılı medikal dosyaların seçilerek uygulamaya yüklenmesini sağlar.
  const getArrayBufferFromUri = async (uri: string): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () { resolve(xhr.response as ArrayBuffer); };
      xhr.onerror = function () { reject(new Error("Dosya okunamadı.")); };
      xhr.responseType = "arraybuffer"; xhr.open("GET", uri, true); xhr.send(null);
    });
  };

  // Mobil istemci, yapay zekâ sunucusu ve bulut veritabanı (Supabase) arasındaki uçtan uca veri iletişimini, hata ayıklama (error handling) ve
  //durum yönetimini (state management) sağlayan ana analiz algoritması.
  const handleAnalyze = async () => {
    if (!image) { Alert.alert('Eksik İşlem', 'Lütfen önce bir röntgen görüntüsü veya dosyası seçin.'); return; }
    if (!patientName.trim()) { Alert.alert('Eksik Bilgi', 'Lütfen hasta adını giriniz.'); return; }

    setIsAnalyzing(true);
    try {
      let finalUri = image;
      let mimeType = 'image/jpeg';
      let uploadFileName = 'xray.jpg';
      const ext = getFileExtension(image);

      if (isImageFile(image)) {
        const manipulatedResult = await ImageManipulator.manipulateAsync(image, [{ resize: { height: 512 } }], 
          { compress: 1, format: ImageManipulator.SaveFormat.JPEG });
        finalUri = manipulatedResult.uri;
      } else {
        mimeType = ext === 'pdf' ? 'application/pdf' : 'application/octet-stream';
        uploadFileName = `document.${ext}`;
      }
      
      const formData = new FormData();
      formData.append('file', { uri: finalUri, name: uploadFileName, type: mimeType } as any);
      const apiResponse = await fetch('http://192.168.1.161:5000/api/analyze', { method: 'POST', body: formData });
      const aiData = await apiResponse.json();

      if (!aiData.success) throw new Error(aiData.error || 'Yapay zeka analizinde hata oluştu.');

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error('Kullanıcı oturumu bulunamadı.');

      const arrayBuffer = await getArrayBufferFromUri(finalUri);
      const randomString = Math.random().toString(36).substring(2, 8);
      const uniqueFileName = `${user.id}_${Date.now()}_${randomString}.${ext || 'jpg'}`;

      const { error: storageError } = await supabase.storage.from('images').upload(uniqueFileName, arrayBuffer, { contentType: mimeType });
      if (storageError) throw new Error('Dosya buluta yüklenemedi. Hata: ' + storageError.message);

      const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(uniqueFileName);

      const analyzedImageUrl = aiData.data.analyzed_image_url || finalUri; 
      const segmentedImageUrl = aiData.data.segmented_image_url || finalUri;

      const { error: dbError } = await supabase.from('image').insert({
          filename: publicUrl, analyzed_url: analyzedImageUrl, segmented_url: segmentedImageUrl, 
          user_id: user.id, patient_name: patientName, upload_date: new Date().toISOString(), 
          cobb_angle: parseFloat(Number(aiData.data.cobb_angle).toFixed(1)), diagnosis: aiData.data.diagnosis, 
          diagnosis_color: aiData.data.diagnosis_color 
      });

      if (dbError) throw new Error(`Veritabanı hatası: ${dbError.message}`);

      setResult({
        angle: parseFloat(Number(aiData.data.cobb_angle).toFixed(1)), risk: aiData.data.diagnosis,
        riskColor: aiData.data.diagnosis_color, analyzedImg: analyzedImageUrl, segmentedImg: segmentedImageUrl, originalImg: publicUrl
      });

    } catch (error: any) { Alert.alert('Hata', error.message || 'Bir sorun oluştu.'); } finally { setIsAnalyzing(false); }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ title: 'Röntgen Analizi', headerBackTitle: 'Geri' }} />
      <View style={styles.headerBox}>
        <Text style={styles.title}>Yeni Analiz</Text>
        <Text style={styles.subtitle}>Hastaya ait Ön-Arka (AP) omurga röntgenini veya dosyasını sisteme yükleyin.</Text>
      </View>
      <TextInput style={styles.input} placeholder="Hasta Adı ve Soyadı" value={patientName} onChangeText={setPatientName} editable={!isAnalyzing} />

      {result ? (
        <View style={styles.carouselWrapper}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.carouselScroll}>
            <View style={styles.slide}><Image source={{ uri: result.analyzedImg }} style={styles.previewImage} resizeMode="contain" /></View>
            <View style={styles.slide}><Image source={{ uri: result.segmentedImg }} style={styles.previewImage} resizeMode="contain" /></View>
            <View style={styles.slide}>
              {isImageFile(result.originalImg) ? ( <Image source={{ uri: result.originalImg }} style={styles.previewImage} resizeMode="contain" /> ) : (
                 <View style={styles.placeholderBox}><Text style={styles.placeholderText}>📄 Dosya Kaydedildi</Text><Text style={styles.placeholderSubtext}>Bu bir belge dosyasıdır.</Text></View>
              )}
            </View>
          </ScrollView>
          <Text style={styles.swipeHint}>💡 Omurga segmentasyonu ve ham görüntü için yana kaydırın 👉</Text>
        </View>
      ) : (
        <View style={styles.imageContainer}>
          {image ? (
            isImageFile(image) ? ( <Image source={{ uri: image }} style={styles.previewImage} resizeMode="contain" /> ) : (
              <View style={styles.placeholderBox}><Text style={styles.placeholderText}>📄 Dosya Seçildi</Text><Text style={styles.placeholderSubtext}>Seçilen dosya sunucuya gönderilmeye hazır.</Text></View>
            )
          ) : (
            <View style={styles.placeholderBox}><Text style={styles.placeholderText}>Görüntü/Dosya Yok</Text><Text style={styles.placeholderSubtext}>Lütfen bir röntgen yükleyin</Text></View>
          )}
        </View>
      )}

      {!result && (
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.actionButton3} onPress={takePhoto} disabled={isAnalyzing}><Text style={styles.actionButtonText}>Kamera</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionButton3} onPress={pickImage} disabled={isAnalyzing}><Text style={styles.actionButtonText}>Galeri</Text></TouchableOpacity>
          <TouchableOpacity style={styles.actionButton3} onPress={pickDocument} disabled={isAnalyzing}><Text style={styles.actionButtonText}>Dosyalar</Text></TouchableOpacity>
        </View>
      )}

      {!result && (
        <TouchableOpacity style={[styles.analyzeButton, (!image || !patientName.trim()) && styles.analyzeButtonDisabled]} onPress={handleAnalyze} disabled={isAnalyzing || !image || !patientName.trim()}>
          {isAnalyzing ? ( <View style={styles.analyzingBox}><ActivityIndicator color="#fff" size="small" /><Text style={styles.analyzeButtonText}> Yapay Zeka İşliyor...</Text></View> ) : ( <Text style={styles.analyzeButtonText}> Analiz Et ve Kaydet</Text> )}
        </TouchableOpacity>
      )}

      {result && (
        <>
          <View style={[styles.resultCard, { borderLeftColor: result.riskColor }]}>
            <Text style={styles.resultTitle}>Analiz Sonucu</Text>
            <View style={styles.resultRow}><Text style={styles.resultLabel}>Hesaplanan Cobb Açısı:</Text><Text style={styles.resultValue}>{result.angle}°</Text></View>
            <View style={styles.resultRow}><Text style={styles.resultLabel}>Durum:</Text><Text style={[styles.resultRisk, { color: result.riskColor }]}>{result.risk}</Text></View>
          </View>
          
          {/* GÜNCELLENMİŞ DİNAMİK TAVSİYE KARTI */}
          {getRecommendationData(result.angle) && (
            <View style={styles.recCard}>
              <Text style={styles.recMainTitle}>{getRecommendationData(result.angle)?.title}</Text>
              <Text style={styles.recDesc}>{getRecommendationData(result.angle)?.desc}</Text>

              <Text style={styles.recSubTitle}>Evde Yapılabilecekler:</Text>
              <Text style={styles.recText}>{getRecommendationData(result.angle)?.home}</Text>

              <Text style={styles.recSubTitle}>Doktor ile Yapılacaklar:</Text>
              <Text style={styles.recText}>{getRecommendationData(result.angle)?.doctor}</Text>

              <Text style={styles.recSubTitle}>Genel Tavsiye:</Text>
              <Text style={styles.recText}>{getRecommendationData(result.angle)?.general}</Text>

              {/* Eğer Kategoriye Özel Fotoğraf Varsa Göster */}
              {getRecommendationData(result.angle)?.imagePath && (
                <Image source={getRecommendationData(result.angle)?.imagePath} style={styles.recImage} resizeMode="contain" />
              )}

              {/* YENİ EKLENEN SABİT TAVSİYE UYARISI */}
              <View style={styles.recWarningBox}>
                <Text style={styles.recWarningText}>
                  Bu öneriler genel bilgilendirme amaçlıdır. Uygulamanın koyduğu derece bir ön analizdir, kesin tedavi planı için lütfen ortopedi uzmanına danışınız.
                </Text>
              </View>
            </View>
          )}
        </>
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
  previewImage: { width: '100%', height: '100%' },
  placeholderBox: { alignItems: 'center', padding: 20 },
  placeholderText: { fontSize: 18, fontWeight: 'bold', color: '#95a5a6', textAlign: 'center' },
  placeholderSubtext: { fontSize: 14, color: '#bdc3c7', marginTop: 5, textAlign: 'center' },
  buttonRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 20 },
  actionButton3: { backgroundColor: 'white', flex: 0.31, paddingVertical: 15, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: '#3498db' },
  actionButtonText: { color: '#3498db', fontWeight: 'bold', fontSize: 15 },
  analyzeButton: { backgroundColor: '#27ae60', width: '100%', padding: 18, borderRadius: 10, alignItems: 'center', shadowColor: '#27ae60', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 4, marginBottom: 20 },
  analyzeButtonDisabled: { backgroundColor: '#95a5a6', shadowOpacity: 0, elevation: 0 },
  analyzingBox: { flexDirection: 'row', alignItems: 'center' },
  analyzeButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  resultCard: { width: '100%', backgroundColor: 'white', padding: 20, borderRadius: 12, borderLeftWidth: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, marginBottom: 15 },
  resultTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 15, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 10 },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  resultLabel: { fontSize: 16, color: '#7f8c8d' },
  resultValue: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50' },
  resultRisk: { fontSize: 16, fontWeight: 'bold' },
  carouselWrapper: { width: '100%', marginBottom: 20 },
  carouselScroll: { width: IMAGE_BOX_WIDTH, height: 350, backgroundColor: 'white', borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: '#27ae60' },
  slide: { width: IMAGE_BOX_WIDTH, height: 350, justifyContent: 'center', alignItems: 'center' },
  swipeHint: { textAlign: 'center', color: '#7f8c8d', fontSize: 12, marginTop: 8, fontStyle: 'italic' },
  
  // YENİ TAVSİYE KARTI STİLLERİ
  recCard: { backgroundColor: '#f0f8ff', borderColor: '#cce7ff', borderWidth: 1, padding: 15, borderRadius: 12, marginBottom: 15, width: '100%' },
  recMainTitle: { fontSize: 18, fontWeight: 'bold', color: '#0056b3', marginBottom: 5 },
  recDesc: { fontSize: 14, color: '#333', marginBottom: 15, fontStyle: 'italic' },
  recSubTitle: { fontSize: 15, fontWeight: 'bold', color: '#004085', marginTop: 10, marginBottom: 3 },
  recText: { fontSize: 14, color: '#444', lineHeight: 20 },
  recImage: { width: '100%', height: 200, borderRadius: 8, marginTop: 15, backgroundColor: 'white' },
  
  // YENİ TAVSİYE UYARISI STİLLERİ
  recWarningBox: { marginTop: 15, padding: 10, backgroundColor: '#ffeeba', borderRadius: 8, borderWidth: 1, borderColor: '#ffdf7e' },
  recWarningText: { fontSize: 12, color: '#856404', fontStyle: 'italic', textAlign: 'center', fontWeight: '500' }
});