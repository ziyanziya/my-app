import { Box, Button, Divider, FormControlLabel, IconButton, MenuItem, Paper, Select, Stack, Switch, TextField } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '../api/client';
import PageShell from '../components/PageShell';

export default function SettingsPage() {
  const [files, setFiles] = useState<Array<{ name: string; url: string }>>([]);
  const [fajrFile, setFajrFile] = useState<string | null>(null);
  const [fajrEnabled, setFajrEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  async function loadFiles() {
    try {
      const res = await apiFetch<{ data?: any[] }>('/admin/adhan');
      setFiles(res.data || []);
    } catch (e) {
      // ignore
    }
  }

  async function loadSettings() {
    try {
      const res = await apiFetch<{ data?: { fajrFile?: string; fajrEnabled?: boolean } }>('/admin/adhan/settings');
      setFajrFile(res.data?.fajrFile || null);
      setFajrEnabled(!!res.data?.fajrEnabled);
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => { loadFiles(); loadSettings(); }, []);

  function play(url: string) {
    stop();
    const a = new Audio(url);
    audioRef.current = a;
    a.play().then(() => setPlayingUrl(url)).catch(() => alert('تعذر تشغيل الملف'));
    a.onended = () => { setPlayingUrl(null); audioRef.current = null; };
  }

  function stop() {
    if (audioRef.current) {
      try { audioRef.current.pause(); audioRef.current.currentTime = 0; } catch {};
      audioRef.current = null;
      setPlayingUrl(null);
    }
  }

  async function saveFajrSettings(next: { fajrFile?: string | null; fajrEnabled?: boolean }) {
    try {
      await apiFetch('/admin/adhan/settings', { method: 'POST', body: JSON.stringify({ fajrFile: next.fajrFile ?? fajrFile, fajrEnabled: next.fajrEnabled ?? fajrEnabled }) });
      await loadSettings();
      alert('تم حفظ إعدادات أذان الفجر');
    } catch (err: any) { alert(err.message || String(err)); }
  }
  return (
    <PageShell title="Settings" subtitle="Fine-tune app behavior and permissions">
      <Paper sx={{ p: 3 }}>
        <Stack spacing={3}>
          <FormControlLabel control={<Switch defaultChecked />} label="Enable push notifications" />
          <FormControlLabel control={<Switch defaultChecked />} label="Allow daily reminders" />
          <Divider />
          <TextField label="Admin email" defaultValue="admin@sirat.app" fullWidth />
          <TextField label="Support URL" defaultValue="https://sirat.app/support" fullWidth />
          <Box>
            <Button variant="contained">Save Changes</Button>
          </Box>
        
        </Stack>
      </Paper>
      
      <Box sx={{ height: 24 }} />
      <Paper sx={{ p: 3, mt: 2 }}>
        <Stack spacing={2}>
          <Box sx={{ mb: 1 }}>
            <strong>أذان الفجر (الصلاة خير من النوم)</strong>
          </Box>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
            <Select value={fajrFile || ''} onChange={(e) => setFajrFile(e.target.value || null)} sx={{ minWidth: 300 }}>
              <MenuItem value="">-- اختر ملف --</MenuItem>
              {files.map((f) => <MenuItem key={f.name} value={f.name}>{f.name}</MenuItem>)}
            </Select>
            <Button variant="outlined" onClick={() => saveFajrSettings({ fajrFile })}>حفظ الملف</Button>
            <FormControlLabel control={<Switch checked={fajrEnabled} onChange={(e) => { setFajrEnabled(e.target.checked); saveFajrSettings({ fajrEnabled: e.target.checked }); }} />} label="تفعيل أذان الفجر الخاص" />
          </Box>
          <Box sx={{ mt: 1 }}>
            {fajrFile ? (
              (() => {
                const file = files.find((x) => x.name === fajrFile);
                if (!file) return <div>الملف غير متوفر</div>;
                return (
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <IconButton onClick={() => playingUrl === file.url ? stop() : play(file.url)}>
                      {playingUrl === file.url ? <StopIcon /> : <PlayArrowIcon />}
                    </IconButton>
                    <span>{file.name}</span>
                  </Box>
                );
              })()
            ) : <div>لم يتم اختيار ملف</div>}
          </Box>
        </Stack>
      </Paper>
    </PageShell>
  );
}
