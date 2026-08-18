import { useState, type FormEvent } from 'react';
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material';
import { LockRounded, MosqueRounded } from '@mui/icons-material';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const { session, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (session) {
    return <Navigate to="/" replace />;
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/', { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر تسجيل الدخول.');
    } finally {
      setLoading(false);
    }
  };

  return <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3, background: 'radial-gradient(circle at top right, #5b1e2d 0%, #1a0c12 46%, #10070b 100%)' }}>
    <Paper component="form" onSubmit={submit} sx={{ width: '100%', maxWidth: 440, p: { xs: 3, sm: 5 }, border: '1px solid rgba(232,199,106,.28)', bgcolor: 'rgba(38,15,24,.92)', borderRadius: 5, textAlign: 'right' }}>
      <Stack spacing={2.5}>
        <Box sx={{ color: 'secondary.main', display: 'flex', gap: 1, alignItems: 'center' }}><MosqueRounded /><Typography variant="h4" sx={{ fontWeight: 800 }}>الصراط</Typography></Box>
        <Box><Typography variant="h5" sx={{ fontWeight: 800 }}>منصة الإدارة</Typography><Typography color="text.secondary">سجّل الدخول لإدارة رحلة المستخدمين.</Typography></Box>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <TextField label="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required fullWidth autoFocus />
        <TextField label="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required fullWidth />
        <Button type="submit" variant="contained" size="large" disabled={loading} startIcon={<LockRounded />}>{loading ? 'جارٍ التحقق...' : 'دخول آمن'}</Button>
      </Stack>
    </Paper>
  </Box>;
}
