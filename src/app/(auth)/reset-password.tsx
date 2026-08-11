import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AuthShell from '@/components/auth-shell';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  return (
    <AuthShell>
      <View style={styles.top}>
        <Text style={styles.title}>إعادة تعيين كلمة المرور</Text>
        <Text style={styles.subtitle}>أدخل كلمة مرور جديدة لتأمين حسابك.</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="كلمة المرور الجديدة"
          placeholderTextColor="#8f7c70"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="تأكيد كلمة المرور"
          placeholderTextColor="#8f7c70"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
        />

        <TouchableOpacity style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>حفظ التغيير</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Link href="/login" style={styles.footerLink}>
          <Text style={styles.footerLinkText}>العودة إلى تسجيل الدخول</Text>
        </Link>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  top: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#f8ede0',
    fontSize: 36,
    fontWeight: '900',
    marginBottom: 12,
  },
  subtitle: {
    color: '#cbb9a0',
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 320,
  },
  form: {
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    backgroundColor: '#24161f',
    borderColor: '#442b3d',
    borderWidth: 1,
    borderRadius: 20,
    color: '#f3e5d8',
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: '#d9a46b',
    borderRadius: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#150b14',
    fontWeight: '800',
    fontSize: 16,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  footerLink: {
    backgroundColor: '#38212d',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  footerLinkText: {
    color: '#f3e5d8',
    fontWeight: '700',
  },
});
