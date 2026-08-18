import { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import PageShell from '../components/PageShell';
import { apiFetch } from '../api/client';
import { useAuth } from '../auth/AuthContext';

type Achievement = {
  id: number;
  slug: string;
  title: string;
  description: string;
  criteria: any;
  points_reward: number;
  badge_icon?: string;
  is_active: boolean;
};

export default function AchievementsPage() {
  const { session } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [error, setError] = useState('');
  const [openAdd, setOpenAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTarget, setNewTarget] = useState(100);
  const [newReward, setNewReward] = useState(20);

  const load = () => {
    apiFetch<{ data: Achievement[] }>('/achievements', {}, session?.accessToken)
      .then((res) => setAchievements(res.data || []))
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
  }, [session?.accessToken]);

  const handleCreate = async () => {
    try {
      setError('');
      await apiFetch(
        '/achievements',
        {
          method: 'POST',
          body: JSON.stringify({
            slug: newSlug,
            title: newTitle,
            description: newDesc,
            points_reward: newReward,
            criteria: { type: 'cumulative_light', target: newTarget },
            is_active: true,
          }),
        },
        session?.accessToken,
      );
      setOpenAdd(false);
      setNewTitle('');
      setNewSlug('');
      setNewDesc('');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر إضافة الإنجاز');
    }
  };

  return (
    <PageShell title="أوسمة وإنجازات النور (Achievements)" subtitle="مراقبة وإدارة الإنجازات والأوسمة الممنوحة للمستخدمين عند تحقيق مستويات نور معينة">
      {error ? <Typography color="error.light" sx={{ mb: 2 }}>{error}</Typography> : null}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button variant="contained" color="primary" onClick={() => setOpenAdd(true)}>
          + إضافة إنجاز نور جديد
        </Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 2.5 }}>
        {achievements.map((item) => {
          const criteriaObj = typeof item.criteria === 'string' ? JSON.parse(item.criteria || '{}') : item.criteria || {};
          const isLight = criteriaObj.type === 'cumulative_light';

          return (
            <Paper key={item.id} sx={{ p: 3, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 44, height: 44 }}>
                    {isLight ? '🌟' : '🏅'}
                  </Avatar>
                  <Chip
                    size="small"
                    label={isLight ? `هدف: ${criteriaObj.target || 0} نور` : criteriaObj.type || 'إنجاز'}
                    color={isLight ? 'secondary' : 'default'}
                    variant="outlined"
                  />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5 }}>
                  {item.title}
                </Typography>
                <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
                  {item.description}
                </Typography>
              </Box>
              <Box sx={{ pt: 1.5, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  مكافأة إضافية: +{item.points_reward}
                </Typography>
                <Chip size="small" label={item.is_active ? 'مفعل' : 'معطل'} color={item.is_active ? 'success' : 'default'} />
              </Box>
            </Paper>
          );
        })}
      </Box>

      <Dialog open={openAdd} onClose={() => setOpenAdd(false)} maxWidth="sm" fullWidth>
        <DialogTitle>إضافة إنجاز نور جديد</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="عنوان الإنجاز" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} fullWidth />
            <TextField label="المعرف الفريد (Slug)" value={newSlug} onChange={(e) => setNewSlug(e.target.value)} fullWidth />
            <TextField label="الوصف" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} multiline rows={2} fullWidth />
            <TextField
              label="رصيد النور المطلوب لفك القفل"
              type="number"
              value={newTarget}
              onChange={(e) => setNewTarget(Number(e.target.value))}
              fullWidth
            />
            <TextField
              label="مكافأة فتح الإنجاز"
              type="number"
              value={newReward}
              onChange={(e) => setNewReward(Number(e.target.value))}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdd(false)}>إلغاء</Button>
          <Button variant="contained" onClick={handleCreate}>إضافة</Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  );
}
