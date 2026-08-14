import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthApiBaseUrl } from '../services/auth-api';

type AdhanFile = { name: string; displayName?: string; url: string };

export function UserAdhanUploader({ displayName, onUploaded }: { displayName: string; onUploaded: (file: AdhanFile) => void }) {
  const [uploading, setUploading] = useState(false);

  const pickAndUpload = async () => {
    if (!displayName.trim()) {
      Alert.alert('اسم المؤذن مطلوب', 'اكتب اسم المؤذن قبل اختيار الملف الصوتي.');
      return;
    }
    try {
      const selection = await DocumentPicker.getDocumentAsync({ type: 'audio/*', copyToCacheDirectory: true, multiple: false });
      if (selection.canceled || !selection.assets?.[0]) return;
      const asset = selection.assets[0];
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('تسجيل الدخول مطلوب', 'سجّل دخولك أولاً لرفع ملف الأذان.');
        return;
      }
      const body = new FormData();
      body.append('displayName', displayName.trim());
      body.append('file', { uri: asset.uri, name: asset.name || 'adhan.mp3', type: asset.mimeType || 'audio/mpeg' } as any);
      setUploading(true);
      const response = await fetch(`${getAuthApiBaseUrl()}/adhan/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message || 'تعذر رفع الملف الصوتي.');
      onUploaded(result.data);
      Alert.alert('تمت الإضافة', 'تم رفع صوت المؤذن وإضافته إلى قائمتك.');
    } catch (error: any) {
      Alert.alert('تعذر الرفع', error.message || 'حدث خطأ أثناء رفع الملف الصوتي.');
    } finally {
      setUploading(false);
    }
  };

  return <Pressable style={[styles.button, uploading && styles.disabled]} onPress={pickAndUpload} disabled={uploading}><Text style={styles.text}>{uploading ? 'جارٍ الرفع...' : 'رفع ملف الأذان'}</Text></Pressable>;
}

const styles = StyleSheet.create({ button: { alignSelf: 'stretch', alignItems: 'center', padding: 12, borderRadius: 10, backgroundColor: '#dcb575', marginTop: 10 }, disabled: { opacity: .65 }, text: { color: '#26131b', fontWeight: '800' } });
