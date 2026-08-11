import { ReactNode, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TextInputProps, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Defs, Path, Polygon, RadialGradient, Rect, Stop } from 'react-native-svg';

export const authTokens = {
  colors: {
    primary: '#5A1230',
    background: '#2B0916',
    accent: '#C9A15A',
    ivory: '#F0D9B5',
    text: '#FFFFFF',
    input: 'rgba(245,245,245,0.10)',
    inputBorder: 'rgba(240,217,181,0.20)',
    error: '#F28B82',
    success: '#83D49A',
  },
  spacing: { xs: 8, s: 16, m: 24, l: 32, xl: 48 },
  typography: { brand: 48, title: 25, body: 15, button: 18, label: 14 },
} as const;

type IconName = 'user' | 'email' | 'lock' | 'eye';

export function AuthIcon({ name, color = authTokens.colors.ivory }: { name: IconName; color?: string }) {
  const common = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'user') return <Svg width={22} height={22} viewBox="0 0 24 24"><Circle cx="12" cy="8" r="3.5" {...common} /><Path d="M4.5 20c.9-4 3.3-6 7.5-6s6.6 2 7.5 6" {...common} /></Svg>;
  if (name === 'email') return <Svg width={22} height={22} viewBox="0 0 24 24"><Rect x="3.5" y="5.5" width="17" height="13" rx="2" {...common} fill="none" /><Path d="m4.5 7 7.5 5.5L19.5 7" {...common} /></Svg>;
  if (name === 'eye') return <Svg width={22} height={22} viewBox="0 0 24 24"><Path d="M2.8 12s3.2-5 9.2-5 9.2 5 9.2 5-3.2 5-9.2 5-9.2-5-9.2-5Z" {...common} /><Circle cx="12" cy="12" r="2.1" {...common} /></Svg>;
  return <Svg width={22} height={22} viewBox="0 0 24 24"><Rect x="5" y="10" width="14" height="10" rx="2" {...common} fill="none" /><Path d="M8 10V7.5a4 4 0 0 1 8 0V10" {...common} /></Svg>;
}

export function AuthBackground() {
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice">
      <Defs>
        <RadialGradient id="authGlow" cx="50%" cy="14%" r="82%">
          <Stop offset="0%" stopColor="#7C2044" stopOpacity="1" />
          <Stop offset="52%" stopColor="#4A1028" stopOpacity="0.7" />
          <Stop offset="100%" stopColor="#2B0916" stopOpacity="1" />
        </RadialGradient>
      </Defs>
      <Rect width="390" height="844" fill="#2B0916" />
      <Rect width="390" height="844" fill="url(#authGlow)" />
      {[35, 105, 175, 245, 315].map((x) => (
        <Path key={`top-${x}`} d={`M${x} 0l25 25-25 25-25-25zM${x} 50l25 25-25 25-25-25z`} fill="none" stroke="#F0D9B5" strokeWidth="0.75" opacity="0.11" />
      ))}
      {[35, 105, 175, 245, 315].map((x) => (
        <Path key={`bottom-${x}`} d={`M${x} 730l31 31-31 31-31-31zM${x} 792l31 31-31 31-31-31z`} fill="none" stroke="#F0D9B5" strokeWidth="0.8" opacity="0.12" />
      ))}
      <Circle cx="195" cy="145" r="105" fill="none" stroke="#C9A15A" strokeWidth="1" opacity="0.11" />
      <Polygon points="195,45 207,115 277,127 207,139 195,209 183,139 113,127 183,115" fill="none" stroke="#C9A15A" strokeWidth="0.8" opacity="0.16" />
    </Svg>
  );
}

export function AuthInput({ icon, invalid, style: inputStyle, ...props }: TextInputProps & { icon: IconName; invalid?: boolean }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = props.secureTextEntry;
  return (
    <View style={[styles.inputContainer, invalid && styles.inputInvalid]}>
      <AuthIcon name={icon} />
      <TextInput
        {...props}
        style={[styles.input, inputStyle]}
        placeholderTextColor="rgba(240,217,181,0.60)"
        textAlign="right"
        secureTextEntry={isPassword && !showPassword}
      />
      {isPassword ? (
        <TouchableOpacity onPress={() => setShowPassword((value) => !value)} accessibilityLabel="إظهار كلمة المرور">
          <AuthIcon name="eye" color="rgba(240,217,181,0.75)" />
        </TouchableOpacity>
      ) : <View style={styles.iconSpacer} />}
    </View>
  );
}

export function AuthMessage({ type, children }: { type: 'error' | 'success'; children: ReactNode }) {
  return <View style={[styles.message, type === 'error' ? styles.errorMessage : styles.successMessage]}><Text style={styles.messageIcon}>{type === 'error' ? '!' : '✓'}</Text><Text style={[styles.messageText, type === 'error' ? styles.errorText : styles.successText]}>{children}</Text></View>;
}

export function AuthButton({ label, loading, onPress }: { label: string; loading?: boolean; onPress: () => void }) {
  return <TouchableOpacity disabled={loading} activeOpacity={0.82} onPress={onPress} style={[styles.primaryButton, loading && styles.primaryButtonLoading]}>{loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>{label}</Text>}</TouchableOpacity>;
}

export function SocialButton({ label, symbol }: { label: string; symbol: string }) {
  return <TouchableOpacity activeOpacity={0.75} style={styles.socialButton} accessibilityLabel={label}><Text style={styles.socialSymbol}>{symbol}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  inputContainer: { minHeight: 58, flexDirection: 'row-reverse', alignItems: 'center', gap: 10, borderRadius: 20, backgroundColor: authTokens.colors.input, borderWidth: 1, borderColor: authTokens.colors.inputBorder, paddingHorizontal: 16, marginBottom: 12 },
  inputInvalid: { borderColor: authTokens.colors.error, backgroundColor: 'rgba(242,139,130,0.10)' },
  input: { flex: 1, color: authTokens.colors.text, fontSize: 15, paddingVertical: 0 },
  iconSpacer: { width: 22 },
  message: { flexDirection: 'row-reverse', gap: 8, alignItems: 'center', borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 14 },
  errorMessage: { backgroundColor: 'rgba(242,139,130,0.11)', borderColor: 'rgba(242,139,130,0.42)' },
  successMessage: { backgroundColor: 'rgba(131,212,154,0.11)', borderColor: 'rgba(131,212,154,0.42)' },
  messageIcon: { fontSize: 15, fontWeight: '900' },
  messageText: { flex: 1, textAlign: 'right', writingDirection: 'rtl', fontSize: 13 },
  errorText: { color: authTokens.colors.error },
  successText: { color: authTokens.colors.success },
  primaryButton: { minHeight: 58, borderRadius: 24, backgroundColor: authTokens.colors.accent, alignItems: 'center', justifyContent: 'center', shadowColor: '#C9A15A', shadowOpacity: 0.42, shadowRadius: 15, shadowOffset: { width: 0, height: 6 }, elevation: 7 },
  primaryButtonLoading: { opacity: 0.86 },
  primaryButtonText: { color: '#FFFFFF', fontSize: authTokens.typography.button, fontWeight: '800' },
  socialButton: { flex: 1, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(245,245,245,0.09)', borderWidth: 1, borderColor: 'rgba(240,217,181,0.15)' },
  socialSymbol: { color: authTokens.colors.ivory, fontSize: 24, fontWeight: '700' },
});
