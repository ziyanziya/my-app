import { useEffect, useState } from 'react';
import { Chip, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import PageShell from '../components/PageShell';
import { apiFetch } from '../api/client';
import { useAuth } from '../auth/AuthContext';

type Notification = { id: number; title: string; body: string; status: string; scheduled_at: string; channel: string };
export default function NotificationsPage() {
  const { session } = useAuth(); const [items, setItems] = useState<Notification[]>([]); const [error, setError] = useState('');
  useEffect(() => { apiFetch<{ data: Notification[] }>('/notifications', {}, session?.accessToken).then((r) => setItems(r.data)).catch((e) => setError(e.message)); }, [session?.accessToken]);
  return <PageShell title="الإشعارات" subtitle="متابعة الرسائل المجدولة والمرسلة للمستخدمين">
    {error ? <Typography color="error.light">{error}</Typography> : null}
    <Paper sx={{ p: 2.5 }}><Stack spacing={1.5}>{!error && !items.length ? <CircularProgress color="secondary" /> : items.map((item) => <Stack key={item.id} direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(232,199,106,.1)', py: 1.2 }}><Stack><Typography sx={{ fontWeight: 800 }}>{item.title}</Typography><Typography variant="body2" color="text.secondary">{item.body}</Typography></Stack><Stack sx={{ alignItems: 'flex-end' }}><Chip size="small" label={item.status} color={item.status === 'sent' ? 'success' : 'warning'} /><Typography variant="caption" color="text.secondary" sx={{ mt: .5 }}>{item.channel}</Typography></Stack></Stack>)}</Stack></Paper>
  </PageShell>;
}
