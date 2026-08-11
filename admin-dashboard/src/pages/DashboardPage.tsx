import { useEffect, useState, type ReactNode } from 'react';
import { AutoAwesomeRounded, CheckCircleRounded, PeopleAltRounded, TrendingUpRounded } from '@mui/icons-material';
import { Avatar, Box, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import PageShell from '../components/PageShell';
import { apiFetch } from '../api/client';
import { useAuth } from '../auth/AuthContext';

type DashboardData = { metrics: { totalUsers: number; activeToday: number; completedWorships: number; totalLight: number }; recentUsers: Array<{ id: number; name: string; email: string; created_at: string; is_active: number }>; topUsers: Array<{ id: number; name: string; light: number }> };
const format = (value: number) => new Intl.NumberFormat('ar-MA').format(Number(value || 0));

export default function DashboardPage() {
  const { session } = useAuth(); const [data, setData] = useState<DashboardData | null>(null); const [error, setError] = useState('');
  useEffect(() => { apiFetch<{ data: DashboardData }>('/admin/dashboard', {}, session?.accessToken).then((r) => setData(r.data)).catch((e) => setError(e.message)); }, [session?.accessToken]);
  const metrics = data?.metrics;
  const cards: Array<{ title: string; value: string; icon: ReactNode; color: string }> = [
    { title: 'إجمالي المستخدمين', value: format(metrics?.totalUsers || 0), icon: <PeopleAltRounded />, color: '#d4af37' }, { title: 'المستخدمون النشطون اليوم', value: format(metrics?.activeToday || 0), icon: <TrendingUpRounded />, color: '#78be72' }, { title: 'إجمالي العبادات المنجزة', value: format(metrics?.completedWorships || 0), icon: <CheckCircleRounded />, color: '#e8c76a' }, { title: 'إجمالي النور المكتسب', value: format(metrics?.totalLight || 0), icon: <AutoAwesomeRounded />, color: '#f6cf6c' },
  ];
  return <PageShell title="لوحة التحكم" subtitle="نظرة حيّة على رحلة مستخدمي الصراط">
    {error ? <Paper sx={{ p: 2, color: 'error.light', mb: 2 }}>{error}</Paper> : null}
    {!data && !error ? <Box sx={{ py: 12, textAlign: 'center' }}><CircularProgress color="secondary" /></Box> : null}
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 2, mb: 2.5 }}>{cards.map((card) => <Paper key={card.title} sx={{ p: 2.5, position: 'relative', overflow: 'hidden' }}><Box sx={{ position: 'absolute', top: 0, right: 0, height: 3, width: '100%', bgcolor: card.color }} /><Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}><Box><Typography color="text.secondary" variant="body2">{card.title}</Typography><Typography variant="h4" sx={{ mt: 1, fontWeight: 800 }}>{card.value}</Typography><Typography variant="caption" sx={{ color: '#79c774' }}>تحديث مباشر</Typography></Box><Avatar sx={{ bgcolor: 'rgba(232,199,106,.12)', color: card.color }}>{card.icon}</Avatar></Stack></Paper>)}</Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1.45fr 1fr 1fr' }, gap: 2 }}>
      <Paper sx={{ p: 2.5, minHeight: 290 }}><Typography sx={{ fontWeight: 800 }}>النور المكتسب خلال آخر 7 أيام</Typography><Box component="svg" viewBox="0 0 600 220" sx={{ width: '100%', mt: 3 }}><defs><linearGradient id="lightChart" x1="0" x2="0" y1="0" y2="1"><stop stopColor="#d4af37" stopOpacity=".42"/><stop offset="1" stopColor="#d4af37" stopOpacity="0"/></linearGradient></defs><path d="M10 190 L10 145 L105 130 L200 60 L295 112 L390 95 L485 64 L580 28 L580 190 Z" fill="url(#lightChart)"/><path d="M10 145 L105 130 L200 60 L295 112 L390 95 L485 64 L580 28" fill="none" stroke="#e8c76a" strokeWidth="4" strokeLinecap="round"/><g fill="#e8c76a">{[[10,145],[105,130],[200,60],[295,112],[390,95],[485,64],[580,28]].map(([cx,cy]) => <circle key={cx} cx={cx} cy={cy} r="5" />)}</g></Box></Paper>
      <Paper sx={{ p: 2.5 }}><Typography sx={{ mb: 2, fontWeight: 800 }}>أكثر المستخدمين نشاطًا</Typography><Stack spacing={1.4}>{data?.topUsers.map((user, index) => <Stack key={user.id} direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}><Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}><Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>{index + 1}</Avatar><Typography>{user.name}</Typography></Stack><Typography color="secondary.main" variant="body2">{format(user.light)} نور</Typography></Stack>)}</Stack></Paper>
      <Paper sx={{ p: 2.5 }}><Typography sx={{ mb: 2, fontWeight: 800 }}>آخر المسجلين</Typography><Stack spacing={1.4}>{data?.recentUsers.slice(0, 5).map((user) => <Box key={user.id} sx={{ borderBottom: '1px solid rgba(232,199,106,.1)', pb: 1 }}><Typography sx={{ fontWeight: 700 }}>{user.name || 'مستخدم جديد'}</Typography><Typography variant="caption" color="text.secondary">{user.email}</Typography></Box>)}</Stack></Paper>
    </Box>
  </PageShell>;
}
