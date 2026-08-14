import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AuthShell from '@/components/auth-shell';
import { AuthButton, AuthInput, AuthMessage, authTokens, SocialButton } from '@/components/auth-ui';
import { getAuthApiBaseUrl } from '@/services/auth-api';

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

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    setError('');
    setSuccess('');
    if (!emailIsValid(email)) return setError('يرجى إدخال بريد إلكتروني صالح.');
    if (!password) return setError('يرجى إدخال كلمة المرور.');

    setIsSubmitting(true);
    try {
      const response = await fetch(`${getAuthApiBaseUrl()}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ identifier: email.trim(), password }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) return setError(toErrorString(result?.message ?? result?.error, 'تعذر تسجيل الدخول. حاول مرة أخرى.'));

      const token = result?.data?.accessToken || result?.data?.refreshToken || 'dummy-token';
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
      const name = result?.data?.user?.name;
      if (name) await AsyncStorage.setItem('authUserName', name);
      else await AsyncStorage.removeItem('authUserName');
      setSuccess('تم تسجيل الدخول بنجاح. أهلاً بعودتك.');
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.replace('/');
    } catch {
      setError('تعذر الاتصال بالخادم. تحقق من تشغيله ثم حاول مجددًا.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell variant="login" title="أهلاً بعودتك" subtitle="واصل رحلتك الروحية معنا">
      <View style={styles.form}>
        <AuthInput icon="email" placeholder="البريد الإلكتروني" keyboardType="email-address" autoCapitalize="none" autoComplete="email" value={email} onChangeText={setEmail} invalid={Boolean(error && !emailIsValid(email))} />
        <AuthInput icon="lock" placeholder="كلمة المرور" secureTextEntry autoComplete="password" value={password} onChangeText={setPassword} invalid={Boolean(error && !password)} />
        <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}><Text style={styles.forgotLink}>نسيت كلمة المرور؟</Text></TouchableOpacity>
        {error ? <AuthMessage type="error">{error}</AuthMessage> : null}
        {success ? <AuthMessage type="success">{success}</AuthMessage> : null}
        <AuthButton label="تسجيل الدخول" loading={isSubmitting} onPress={handleLogin} />
        <View style={styles.divider}><View style={styles.dividerLine} /><Text style={styles.dividerText}>أو</Text><View style={styles.dividerLine} /></View>
        <View style={styles.socialRow}><SocialButton label="المتابعة باستخدام Google" symbol="G" /><SocialButton label="المتابعة باستخدام Apple" symbol="●" /></View>
      </View>
      <View style={styles.footer}><Text style={styles.footerText}>لا تملك حسابًا؟</Text><TouchableOpacity onPress={() => router.push('/register')}><Text style={styles.footerLink}>سجّل الآن</Text></TouchableOpacity></View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  form: { width: '100%' },
  forgotLink: { color: authTokens.colors.accent, textAlign: 'right', writingDirection: 'rtl', fontWeight: '700', marginBottom: 17, fontSize: 14 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(240,217,181,0.26)' },
  dividerText: { color: authTokens.colors.ivory, fontSize: 14 },
  socialRow: { flexDirection: 'row', gap: 12 },
  footer: { alignItems: 'center', marginTop: 28 },
  footerText: { color: authTokens.colors.ivory, fontSize: 14, marginBottom: 9 },
  footerLink: { color: authTokens.colors.accent, fontSize: 16, fontWeight: '800' },
});
