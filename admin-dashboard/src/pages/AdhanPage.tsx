import { useEffect, useRef, useState } from 'react';
import { Box, Button, Divider, FormControlLabel, List, ListItem, ListItemSecondaryAction, ListItemText, MenuItem, Paper, Select, Stack, Switch, Typography, IconButton } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import PageShell from '../components/PageShell';
import { apiFetch, apiUrl } from '../api/client';

export default function AdhanPage() {
  const [files, setFiles] = useState<Array<{ name: string; url: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [settings, setSettings] = useState<{ fajrFile: string | null; fajrEnabled: boolean }>({ fajrFile: null, fajrEnabled: false });
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  async function load() {
    try {
      const res = await apiFetch<{ data: Array<{ name: string; url: string }> }>('/admin/adhan');
      setFiles(res.data || []);
    } catch (err: any) {
      alert(err.message || String(err));
    }
  }

  async function loadSettings() {
    try {
      const res = await apiFetch<{ data: { fajrFile: string | null; fajrEnabled: boolean } }>('/admin/adhan/settings');
      setSettings(res.data || { fajrFile: null, fajrEnabled: false });
    } catch (err: any) {
      // ignore
    }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { loadSettings(); }, []);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    setUploading(true);
    try {
      await apiFetch('/admin/adhan', { method: 'POST', body: fd });
      await load();
    } catch (err: any) {
      alert(err.message || String(err));
    } finally { setUploading(false); e.currentTarget.value = ''; }
  }

  async function remove(name: string) {
    if (!confirm('حذف ملف الأذان؟')) return;
    try {
      await apiFetch(`/admin/adhan/${encodeURIComponent(name)}`, { method: 'DELETE' });
      await load();
      await loadSettings();
    } catch (err: any) { alert(err.message || String(err)); }
  }

  function playInline(url: string) {
    stopInline();
    const a = new Audio(url);
    audioRef.current = a;
    a.play().then(() => setPlayingUrl(url)).catch((e) => alert('تعذر تشغيل الملف: ' + e.message));
    a.onended = () => { setPlayingUrl(null); audioRef.current = null; };
  }

  function stopInline() {
    if (audioRef.current) {
      try { audioRef.current.pause(); audioRef.current.currentTime = 0; } catch {};
      audioRef.current = null;
      setPlayingUrl(null);
    }
  }

  async function saveSettings(payload: { fajrFile?: string | null; fajrEnabled?: boolean }) {
    try {
      const body = JSON.stringify({ ...settings, ...payload });
      const res = await apiFetch('/admin/adhan/settings', { method: 'POST', body });
      setSettings(res.data || settings);
      alert('تم حفظ الإعدادات');
    } catch (err: any) { alert(err.message || String(err)); }
  }

  return (
    <PageShell title="Adhan" subtitle="إدارة أصوات المؤذن (رفع / حذف)">
      <Paper sx={{ p: 3 }}>
        <Stack spacing={2}>
          <Box>
            <input id="adhan-upload" type="file" accept="audio/*" onChange={onUpload} style={{ display: 'none' }} />
            <label htmlFor="adhan-upload">
              <Button variant="contained" component="span" disabled={uploading}>
                {uploading ? 'جاري الرفع...' : 'رفع صوت مؤذن'}
              </Button>
            </label>
          </Box>
          <Divider />
          <Typography>الملفات المرفوعة</Typography>
          <List>
            {files.map((f) => (
              <ListItem key={f.name} divider sx={{ mb: 2 }}>
                <ListItemText primary={f.name} secondary={f.url} />
                <Box sx={{ mr: 2, display: 'flex', alignItems: 'center', flex: 1 }}>
                  <FormControlLabel control={
                    <Switch checked={settings.fajrFile === f.name} onChange={(e) => {
                      if (e.target.checked) saveSettings({ fajrFile: f.name }); else saveSettings({ fajrFile: null });
                    }} />
                  } label="أذان الفجر" />
                </Box>
                <ListItemSecondaryAction>
                  <IconButton sx={{ mr: 1 }} size="small" onClick={() => playingUrl === f.url ? stopInline() : playInline(f.url)}>
                    {playingUrl === f.url ? <StopIcon /> : <PlayArrowIcon />}
                  </IconButton>
                  <Button color="error" size="small" onClick={() => remove(f.name)}>حذف</Button>
                </ListItemSecondaryAction>
              </ListItem>
            ))}
            {files.length === 0 && <ListItem><ListItemText primary="لا يوجد ملفات" /></ListItem>}
          </List>

          <Divider />
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2, mb: 2 }}>
            <FormControlLabel control={<Switch checked={settings.fajrEnabled} onChange={(e) => saveSettings({ fajrEnabled: e.target.checked })} />} label="تفعيل أذان الفجر" />
          </Box>
        </Stack>
      </Paper>
    </PageShell>
  );
}
