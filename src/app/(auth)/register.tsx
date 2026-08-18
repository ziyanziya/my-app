import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AuthShell from '@/components/auth-shell';
import { AuthButton, AuthInput, AuthMessage, authTokens } from '@/components/auth-ui';
import { getAuthApiBaseUrl, fetchWithTimeout } from '@/services/auth-api';

const AUTH_TOKEN_KEY = 'authToken';
const emailIsValid = (value: string) => /^\S+@\S+\.\S+$/.test(value.trim());

/** تحويل أي قيمة إلى نص آمن لعرضه في واجهة المستخدم */
const toErrorString = (value: unknown, fallback: string): string => {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (typeof obj.message === 'string' && obj.message.trim()) return obj.message.trim();
    if (typeof obj.error === 'string' && obj.error.trim()) return obj.error.trim();
    if (typeof obj.details === 'string' && obj.details.trim()) return obj.details.trim();
  }
  return fallback;
};

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    setError('');
    setSuccess('');
    if (name.trim().length < 2) return setError('يرجى إدخال الاسم الكامل.');
    if (!emailIsValid(email)) return setError('يرجى إدخال بريد إلكتروني صالح.');
    if (password.length < 8) return setError('يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.');
    if (password !== confirmPassword) return setError('كلمتا المرور غير متطابقتين.');

    setIsSubmitting(true);
    try {
      const response = await fetchWithTimeout(
        `${getAuthApiBaseUrl()}/auth/register`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), email: email.trim(), password }) },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok) return setError(toErrorString(result?.message ?? result?.error, 'تعذر إنشاء الحساب. حاول مرة أخرى.'));

      const token = result?.data?.accessToken || result?.data?.refreshToken || (result?.data?.user?.id ? String(result.data.user.id) : 'dummy-token');
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      await AsyncStorage.setItem('authUserName', name.trim());
      setSuccess('تم إنشاء حسابك بنجاح. مرحبًا بك في الصراط.');
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.replace('/');
    } catch {
      setError('تعذر الاتصال بالخادم. تحقق من تشغيله ثم حاول مجددًا.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell variant="register" title="انضم إلى الصراط" subtitle="ابدأ تنظيم عاداتك يوميًا">
      <View style={styles.form}>
        <AuthInput icon="user" placeholder="الاسم" autoComplete="name" value={name} onChangeText={setName} invalid={Boolean(error && name.trim().length < 2)} />
        <AuthInput icon="email" placeholder="البريد الإلكتروني" keyboardType="email-address" autoCapitalize="none" autoComplete="email" value={email} onChangeText={setEmail} invalid={Boolean(error && !emailIsValid(email))} />
        <AuthInput icon="lock" placeholder="كلمة المرور" secureTextEntry autoComplete="new-password" value={password} onChangeText={setPassword} invalid={Boolean(error && password.length < 8)} />
        <AuthInput icon="lock" placeholder="تأكيد كلمة المرور" secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} invalid={Boolean(error && password !== confirmPassword)} />
        {error ? <AuthMessage type="error">{error}</AuthMessage> : null}
        {success ? <AuthMessage type="success">{success}</AuthMessage> : null}
        <AuthButton label="إنشاء الحساب" loading={isSubmitting} onPress={handleRegister} />
      </View>
      <View style={styles.footer}><Text style={styles.footerText}>لديك حساب بالفعل؟</Text><TouchableOpacity onPress={() => router.push('/login')}><Text style={styles.footerLink}>تسجيل الدخول</Text></TouchableOpacity></View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  form: { width: '100%' },
  footer: { alignItems: 'center', marginTop: 28 },
  footerText: { color: authTokens.colors.ivory, fontSize: 14, marginBottom: 9 },
  footerLink: { color: authTokens.colors.accent, fontSize: 16, fontWeight: '800' },
});
