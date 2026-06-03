import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import ProcessScreen from '../app/process';
import { Alert } from 'react-native';

// 1. Alert'i izlemek için spy koyalım
jest.spyOn(Alert, 'alert');

jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  router: { replace: jest.fn(), push: jest.fn() }
}));

// Supabase'i tamamen etkisiz hale getirelim (Hata fırlatmasın)
jest.mock('../services/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: '123' } } }) },
    storage: { 
      from: () => ({ 
        upload: jest.fn().mockResolvedValue({ data: { path: 'test.jpg' }, error: null }), 
        getPublicUrl: () => ({ data: { publicUrl: 'https://test.com/img.jpg' } }) 
      }) 
    },
    from: () => ({ 
      insert: jest.fn().mockResolvedValue({ data: null, error: null }) 
    })
  }
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'file://test.jpg', width: 100, height: 100 }]
  })
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn().mockResolvedValue({ uri: 'file://compressed.jpg' }),
  SaveFormat: { JPEG: 'jpeg' }
}));

global.fetch = jest.fn();

describe('ProcessScreen Testleri', () => {
  it('Analiz akışını zorla tamamla', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          cobb_angle: 35,
          diagnosis: "Orta Derece Skolyoz",
          diagnosis_color: "#e67e22",
          analyzed_image_url: "data:image/png;base64,abc",
          segmented_image_url: "data:image/png;base64,def"
        }
      })
    });

    const { getByPlaceholderText, getByText, findByText } = render(<ProcessScreen />);

    // Resim ve İsim Girişi
    fireEvent.press(getByText('Galeri'));
    fireEvent.changeText(getByPlaceholderText('Hasta Adı ve Soyadı'), 'Ahmet Yılmaz');

    // Analiz Butonu
    const btn = getByText(/Analiz Et ve Kaydet/i);
    fireEvent.press(btn);

    // DEBUG: Eğer buton basıldıktan sonra ekran değişmiyorsa terminale bas
    // screen.debug(); 

    // 35 sayısını içeren herhangi bir metni bekle
    const angleText = await findByText(/35/i, {}, { timeout: 10000 });
    expect(angleText).toBeTruthy();
  }, 25000);
});