import React, { ChangeEvent, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuthApiBaseUrl } from '../services/auth-api';

type AdhanFile = { name: string; displayName?: string; url: string };

export function UserAdhanUploader({ displayName, onUploaded }: { displayName: string; onUploaded: (file: AdhanFile) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const chooseFile = () => {
    if (!displayName.trim()) return alert('أدخل اسم المؤذن أولاً.');
    inputRef.current?.click();
  };

  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    const token = await AsyncStorage.getItem('authToken');
    if (!token) return alert('يرجى تسجيل الدخول أولاً.');
    const body = new FormData();
    body.append('displayName', displayName.trim());
    body.append('file', file);
    setUploading(true);
    try {
      const response = await fetch(`${getAuthApiBaseUrl()}/adhan/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body });
      const result = await response.json().catch(() => null);
      if (response.status === 401) throw new Error('انتهت جلسة تسجيل الدخول. سجّل الدخول مجدداً ثم أعد الرفع.');
      if (!response.ok) throw new Error(result?.error?.message || result?.message || `تعذر رفع الملف الصوتي (${response.status}).`);
      onUploaded(result.data);
      alert('تم رفع ملف الأذان بنجاح.');
    } catch (error: any) {
      alert(error.message || 'تعذر رفع الملف الصوتي.');
    } finally {
      setUploading(false);
      input.value = '';
    }
  };

  return <><input ref={inputRef} type="file" accept="audio/*" style={{ display: 'none' }} onChange={upload} /><Pressable style={[styles.button, uploading && styles.disabled]} onPress={chooseFile} disabled={uploading}><Text style={styles.text}>{uploading ? 'جارٍ الرفع...' : 'رفع ملف الأذان'}</Text></Pressable></>;
}

const styles = StyleSheet.create({ button: { alignSelf: 'stretch', alignItems: 'center', padding: 12, borderRadius: 10, backgroundColor: '#dcb575', marginTop: 10 }, disabled: { opacity: .65 }, text: { color: '#26131b', fontWeight: '800' } });
