import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { Box, Button, Divider, FormControlLabel, IconButton, List, ListItem, ListItemText, Paper, Stack, Switch, TextField, Typography } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import PageShell from '../components/PageShell';
import { apiFetch } from '../api/client';

type AdhanFile = { name: string; displayName: string; url: string };

export default function AdhanPage() {
  const [files, setFiles] = useState<AdhanFile[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [editingNames, setEditingNames] = useState<Record<string, string>>({});
  const [settings, setSettings] = useState<{ fajrFile: string | null; fajrEnabled: boolean }>({ fajrFile: null, fajrEnabled: false });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  async function load() {
    const res = await apiFetch<{ data: AdhanFile[] }>('/admin/adhan');
    const nextFiles = res.data || [];
    setFiles(nextFiles);
    setEditingNames(Object.fromEntries(nextFiles.map((file) => [file.name, file.displayName || file.name])));
  }

  async function loadSettings() {
    try {
      const res = await apiFetch<{ data: { fajrFile: string | null; fajrEnabled: boolean } }>('/admin/adhan/settings');
      setSettings(res.data || { fajrFile: null, fajrEnabled: false });
    } catch { /* optional legacy setting */ }
  }

  useEffect(() => { load().catch((error) => alert(error.message)); loadSettings(); }, []);
  useEffect(() => () => stopInline(), []);

  async function onUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !displayName.trim()) {
      alert('أدخل اسم المؤذن ثم اختر ملفاً صوتياً.');
      return;
    }
    const form = new FormData();
    form.append('displayName', displayName.trim());
    form.append('file', file);
    setUploading(true);
    try {
      await apiFetch('/admin/adhan', { method: 'POST', body: form });
      setDisplayName('');
      await load();
    } catch (error: any) { alert(error.message || String(error)); }
    finally { setUploading(false); event.currentTarget.value = ''; }
  }

  async function saveFile(file: AdhanFile, replacement?: File) {
    const form = new FormData();
    form.append('displayName', (editingNames[file.name] || file.displayName).trim());
    if (replacement) form.append('file', replacement);
    try {
      await apiFetch(`/admin/adhan/${encodeURIComponent(file.name)}`, { method: 'PUT', body: form });
      await load();
    } catch (error: any) { alert(error.message || String(error)); }
  }

  async function remove(name: string) {
    if (!confirm('هل تريد حذف ملف الأذان؟')) return;
    try { await apiFetch(`/admin/adhan/${encodeURIComponent(name)}`, { method: 'DELETE' }); await load(); await loadSettings(); }
    catch (error: any) { alert(error.message || String(error)); }
  }

  function playInline(url: string) {
    stopInline();
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().then(() => setPlayingUrl(url)).catch((error) => alert(`تعذر تشغيل الملف: ${error.message}`));
    audio.onended = () => { audioRef.current = null; setPlayingUrl(null); };
  }

  function stopInline() {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    audioRef.current = null;
    setPlayingUrl(null);
  }

  async function saveSettings(payload: { fajrFile?: string | null; fajrEnabled?: boolean }) {
    try {
      const response = await apiFetch<{ data: typeof settings }>('/admin/adhan/settings', { method: 'POST', body: JSON.stringify({ ...settings, ...payload }) });
      setSettings(response.data || settings);
    } catch (error: any) { alert(error.message || String(error)); }
  }

  return (
    <PageShell title="إدارة الأذان" subtitle="أضف أسماء المؤذنين وأصواتهم لتظهر مباشرة للمستخدمين">
      <Stack spacing={3}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>إضافة مؤذن جديد</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="اسم المؤذن" value={displayName} onChange={(event) => setDisplayName(event.target.value)} fullWidth />
            <Button component="label" variant="contained" disabled={uploading} sx={{ whiteSpace: 'nowrap' }}>
              {uploading ? 'جارٍ الرفع...' : 'اختيار ملف صوتي'}
              <input hidden type="file" accept="audio/*" onChange={onUpload} />
            </Button>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6">المؤذنون المضافون</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>عدّل الاسم، أو استبدل الملف الصوتي دون أن تفقده من اختيارات المستخدمين.</Typography>
          <List disablePadding>
            {files.map((file) => (
              <ListItem key={file.name} divider sx={{ py: 2, display: 'block' }}>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
                  <Box sx={{ flex: 1 }}>
                    <TextField label="اسم المؤذن" size="small" fullWidth value={editingNames[file.name] ?? ''} onChange={(event) => setEditingNames((current) => ({ ...current, [file.name]: event.target.value }))} />
                    <ListItemText secondary={file.name} sx={{ mt: .5 }} />
                  </Box>
                  <Button startIcon={<SaveOutlinedIcon />} onClick={() => saveFile(file)}>حفظ الاسم</Button>
                  <Button component="label">استبدال الصوت<input hidden type="file" accept="audio/*" onChange={(event) => { const replacement = event.target.files?.[0]; if (replacement) saveFile(file, replacement); event.currentTarget.value = ''; }} /></Button>
                  <IconButton color={playingUrl === file.url ? 'error' : 'primary'} onClick={() => playingUrl === file.url ? stopInline() : playInline(file.url)}>{playingUrl === file.url ? <StopCircleOutlinedIcon /> : <PlayArrowIcon />}</IconButton>
                  <Button color="error" onClick={() => remove(file.name)}>حذف</Button>
                </Stack>
                <FormControlLabel control={<Switch checked={settings.fajrFile === file.name} onChange={(event) => saveSettings({ fajrFile: event.target.checked ? file.name : null })} />} label="اختيار افتراضي للفجر" />
              </ListItem>
            ))}
            {!files.length ? <ListItem><ListItemText primary="لا يوجد مؤذنون مضافون حتى الآن." /></ListItem> : null}
          </List>
          <Divider sx={{ my: 2 }} />
          <FormControlLabel control={<Switch checked={settings.fajrEnabled} onChange={(event) => saveSettings({ fajrEnabled: event.target.checked })} />} label="تفعيل اختيار الفجر الافتراضي" />
        </Paper>
      </Stack>
    </PageShell>
  );
}
