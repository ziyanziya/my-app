import { useEffect, useMemo, useState } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Stack,
  Button,
  MenuItem,
  Typography,
} from '@mui/material';
import { ArrowUpward, ArrowDownward, Save } from '@mui/icons-material';
import PageShell from '../components/PageShell';
import { apiFetch } from '../api/client';
import { useAuth } from '../auth/AuthContext';

type ActivityRow = {
  id: number;
  label: string;
  anchor_key: string;
  offset_minutes: number;
  duration_minutes: number;
  sort_order: number;
  [key: string]: any;
};

const prayerReferenceLabels: Record<string, string> = {
  fajr: 'الفجر',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
  sunrise: 'الشروق',
  isha_fajr_midpoint: 'منتصف الفترة بين العشاء والفجر',
};

export default function ActivitiesPage() {
  const { session } = useAuth();
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [savedRows, setSavedRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch<{ data: ActivityRow[] }>('/prayer-wheel-events', {}, session?.accessToken);
      const items = res.data.map((row, index) => ({ ...row, sort_order: row.sort_order ?? index + 1 }));
      setRows(items);
      setSavedRows(items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [session?.accessToken]);

  const isDirty = useMemo(() => {
    const comparable = (items: ActivityRow[]) => items.map(({ id, label, anchor_key, offset_minutes, duration_minutes, sort_order }) => ({ id, label, anchor_key, offset_minutes, duration_minutes, sort_order }));
    return JSON.stringify(comparable(rows)) !== JSON.stringify(comparable(savedRows));
  }, [rows, savedRows]);

  const referenceLabels = useMemo(() => ({
    ...prayerReferenceLabels,
    ...Object.fromEntries(rows.map((row) => [row.slug, row.label])),
  }), [rows]);

  const updateRow = (index: number, patch: Partial<ActivityRow>) => {
    setRows((current) => current.map((r, i) => i === index ? { ...r, ...patch } : r));
  };

  const move = (index: number, dir: -1 | 1) => {
    setRows((current) => {
      const arr = [...current];
      const to = index + dir;
      if (to < 0 || to >= arr.length) return arr;
      const tmp = arr[to];
      arr[to] = arr[index];
      arr[index] = tmp;
      // Keep a compact, persistent order for all non-prayer wheel events.
      return arr.map((r, i) => ({ ...r, sort_order: i + 1 }));
    });
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      await Promise.all(rows.map((r) => apiFetch(`/prayer-wheel-events/${r.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          label: r.label,
          anchor_key: r.anchor_key,
          offset_minutes: Number(r.offset_minutes),
          duration_minutes: Number(r.duration_minutes),
        }),
      }, session?.accessToken)));
      await apiFetch('/prayer-wheel-events/reorder', {
        method: 'POST',
        body: JSON.stringify(rows.map((r) => ({ id: r.id, sort_order: r.sort_order }))),
      }, session?.accessToken);
      await load();
    } catch (e) {
      console.error(e);
      alert(e instanceof Error ? e.message : 'Failed to save activities');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell title="الأنشطة" subtitle="إدارة شرائح العجلة؛ الصلوات الخمس تُحسب تلقائيًا ولا تظهر هنا.">
      <Stack spacing={2}>
        <Typography variant="body2" color="text.secondary">حرّر نص الشريحة ومرجعها وإزاحتها وترتيبها؛ الصلوات الخمس تبقى خارج هذا الجدول.</Typography>
        <Paper sx={{ overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>الترتيب</TableCell>
                  <TableCell>العنوان</TableCell>
                  <TableCell>المرجع</TableCell>
                  <TableCell>الإزاحة (دقيقة)</TableCell>
                  <TableCell>المدة (دقيقة)</TableCell>
                  <TableCell align="right">الإجراءات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, idx) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.sort_order}</TableCell>
                    <TableCell>
                      <TextField fullWidth size="small" value={row.label || ''} onChange={(e) => updateRow(idx, { label: e.target.value })} />
                    </TableCell>
                    <TableCell>
                      <TextField
                        select
                        size="small"
                        value={row.anchor_key || ''}
                        onChange={(e) => updateRow(idx, { anchor_key: e.target.value })}
                        sx={{ minWidth: 190 }}
                      >
                        {(Object.entries(referenceLabels) as Array<[string, string]>).map(([key, label]) => (
                          <MenuItem key={key} value={key}>{label}</MenuItem>
                        ))}
                        {!referenceLabels[row.anchor_key] && <MenuItem value={row.anchor_key}>{row.anchor_key}</MenuItem>}
                      </TextField>
                    </TableCell>
                    <TableCell>
                      <TextField size="small" type="number" value={row.offset_minutes} onChange={(e) => updateRow(idx, { offset_minutes: Number(e.target.value) })} />
                    </TableCell>
                    <TableCell>
                      <TextField size="small" type="number" slotProps={{ htmlInput: { min: 1 } }} value={row.duration_minutes} onChange={(e) => updateRow(idx, { duration_minutes: Number(e.target.value) })} />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => move(idx, -1)} disabled={idx === 0}><ArrowUpward fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => move(idx, 1)} disabled={idx === rows.length - 1}><ArrowDownward fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
        <Stack direction="row" spacing={1}>
          {isDirty && <Button variant="contained" startIcon={<Save />} onClick={saveAll} disabled={saving || loading}>حفظ الكل</Button>}
          <Button variant="outlined" onClick={load} disabled={loading}>إعادة التحميل</Button>
        </Stack>
      </Stack>
    </PageShell>
  );
}
