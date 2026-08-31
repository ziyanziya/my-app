import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { AddRounded, DeleteRounded, PauseRounded, PlayArrowRounded } from '@mui/icons-material';
import PageShell from '../components/PageShell';
import { apiFetch } from '../api/client';
import { useAuth } from '../auth/AuthContext';

type AdminNotification = {
  id: number;
  title: string;
  body: string;
  audience_type: string;
  type: string;
  status: string;
  start_at: string | null;
  end_at: string | null;
  recurrence: { frequency: string } | null;
  created_at: string;
};

export default function NotificationsPage() {
  const { session } = useAuth();
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [audienceType, setAudienceType] = useState('all_users');
  const [type, setType] = useState('system');
  const [timing, setTiming] = useState('now');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [recurrence, setRecurrence] = useState('');

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: { items: AdminNotification[], total: number } }>(
        '/admin/notifications',
        {},
        session?.accessToken
      );
      setItems(res.data.items || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadNotifications();
  }, [session?.accessToken]);

  const handleCreate = async () => {
    try {
      let status = 'draft';
      let finalStart = null;
      if (timing === 'now') {
        status = 'active';
      } else if (timing === 'scheduled' || timing === 'recurring') {
        status = 'scheduled';
        finalStart = startAt;
      }

      await apiFetch(
        '/admin/notifications',
        {
          method: 'POST',
          body: JSON.stringify({
            title,
            body,
            audience_type: audienceType,
            type,
            status,
            start_at: finalStart ? new Date(finalStart).toISOString() : null,
            end_at: endAt ? new Date(endAt).toISOString() : null,
            recurrence: timing === 'recurring' && recurrence ? { frequency: recurrence } : undefined,
          }),
        },
        session?.accessToken
      );
      setOpenModal(false);
      loadNotifications();
    } catch (e) {
      alert('حدث خطأ أثناء الإنشاء');
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await apiFetch(
        `/admin/notifications/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: newStatus }),
        },
        session?.accessToken
      );
      loadNotifications();
    } catch (e) {
      alert('حدث خطأ');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإشعار نهائياً؟')) return;
    try {
      await apiFetch(
        `/admin/notifications/${id}`,
        { method: 'DELETE' },
        session?.accessToken
      );
      loadNotifications();
    } catch (e) {
      alert('حدث خطأ');
    }
  };

  return (
    <PageShell title="إدارة الإشعارات" subtitle="إنشاء وجدولة الإشعارات للمستخدمين">
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<AddRounded />}
          onClick={() => setOpenModal(true)}
        >
          إنشاء إشعار جديد
        </Button>
      </Box>

      {/* Stats Summary */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="primary">{items.length}</Typography>
            <Typography variant="body2" color="text.secondary">إجمالي الإشعارات</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="success.main">
              {items.filter(i => i.status === 'active').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">نشط الآن</Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h4" color="warning.main">
              {items.filter(i => i.status === 'scheduled').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">مجدول</Typography>
          </Paper>
        </Grid>
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>العنوان</TableCell>
              <TableCell>النوع</TableCell>
              <TableCell>الجمهور</TableCell>
              <TableCell>الحالة</TableCell>
              <TableCell>الجدولة</TableCell>
              <TableCell align="center">الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Typography sx={{ fontWeight: 700 }}>{row.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{row.body.substring(0, 30)}...</Typography>
                </TableCell>
                <TableCell>{row.type}</TableCell>
                <TableCell>{row.audience_type}</TableCell>
                <TableCell>
                  <Chip
                    label={row.status}
                    color={
                      row.status === 'active' ? 'success' :
                      row.status === 'scheduled' ? 'warning' :
                      row.status === 'draft' ? 'default' : 'error'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {row.recurrence?.frequency ? <Chip label={`تكرار: ${row.recurrence.frequency}`} size="small" variant="outlined"/> : 
                   row.start_at ? new Date(row.start_at).toLocaleDateString() : 'فوري'}
                </TableCell>
                <TableCell align="center">
                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
                    {row.status === 'active' ? (
                      <Button size="small" color="warning" onClick={() => handleUpdateStatus(row.id, 'paused')}><PauseRounded fontSize="small" /></Button>
                    ) : (
                      <Button size="small" color="success" onClick={() => handleUpdateStatus(row.id, 'active')}><PlayArrowRounded fontSize="small" /></Button>
                    )}
                    <Button size="small" color="error" onClick={() => handleDelete(row.id)}><DeleteRounded fontSize="small" /></Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && !loading && (
              <TableRow><TableCell colSpan={6} align="center">لا توجد إشعارات</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>إنشاء إشعار جديد</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField label="العنوان" fullWidth value={title} onChange={e => setTitle(e.target.value)} />
            <TextField label="نص الإشعار" fullWidth multiline rows={3} value={body} onChange={e => setBody(e.target.value)} />
            
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>الجمهور</InputLabel>
                  <Select value={audienceType} label="الجمهور" onChange={e => setAudienceType(e.target.value)}>
                    <MenuItem value="all_users">جميع المستخدمين</MenuItem>
                    <MenuItem value="specific_users">مستخدمين محددين</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FormControl fullWidth>
                  <InputLabel>نوع الإشعار</InputLabel>
                  <Select value={type} label="نوع الإشعار" onChange={e => setType(e.target.value)}>
                    <MenuItem value="system">نظام</MenuItem>
                    <MenuItem value="announcement">إعلان</MenuItem>
                    <MenuItem value="maintenance">صيانة</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <FormControl fullWidth>
              <InputLabel>توقيت الإرسال</InputLabel>
              <Select value={timing} label="توقيت الإرسال" onChange={e => setTiming(e.target.value)}>
                <MenuItem value="now">إرسال الآن</MenuItem>
                <MenuItem value="scheduled">جدولة لمرة واحدة</MenuItem>
                <MenuItem value="recurring">إشعار متكرر</MenuItem>
              </Select>
            </FormControl>

            {timing !== 'now' && (
              <TextField 
                label="تاريخ ووقت البدء" 
                type="datetime-local" 
                fullWidth 
                slotProps={{ inputLabel: { shrink: true } }}
                value={startAt}
                onChange={e => setStartAt(e.target.value)}
              />
            )}
            {timing === 'recurring' && (
              <TextField label="تاريخ الانتهاء (اختياري)" type="datetime-local" fullWidth slotProps={{ inputLabel: { shrink: true } }} value={endAt} onChange={e => setEndAt(e.target.value)} />
            )}
            
            {timing === 'recurring' && (
              <TextField 
                label="قاعدة التكرار (مثال: daily)" 
                fullWidth 
                value={recurrence}
                onChange={e => setRecurrence(e.target.value)}
              />
            )}

            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid rgba(255,255,255,0.1)' }}>
              <Typography variant="caption" color="text.secondary">معاينة الإشعار على الهاتف:</Typography>
              <Typography sx={{ fontWeight: 700, mt: 1 }}>🔔 {title || 'عنوان الإشعار'}</Typography>
              <Typography variant="body2">{body || 'تفاصيل الإشعار تظهر هنا...'}</Typography>
            </Box>

          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)} color="inherit">إلغاء</Button>
          <Button onClick={handleCreate} variant="contained" disabled={!title || !body}>إنشاء</Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  );
}
