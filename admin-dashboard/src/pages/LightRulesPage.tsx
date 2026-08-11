import { useEffect, useState } from 'react';
import { Button, Chip, FormControlLabel, Paper, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import PageShell from '../components/PageShell';
import { apiFetch } from '../api/client';
import { useAuth } from '../auth/AuthContext';

type Rule = { id: number; slug: string; name: string; source_scope: string; source_key?: string; base_amount: number; multiplier: number; daily_limit?: number; is_active: boolean };
export default function LightRulesPage() {
  const { session } = useAuth(); const [rules, setRules] = useState<Rule[]>([]); const [selected, setSelected] = useState<Rule | null>(null); const [error, setError] = useState('');
  const load = () => apiFetch<{ data: Rule[] }>('/light/rules', {}, session?.accessToken).then((r) => { setRules(r.data); setSelected((current) => current ? r.data.find((item) => item.id === current.id) || null : r.data[0] || null); }).catch((e) => setError(e.message));
  useEffect(() => { load(); }, [session?.accessToken]);
  const setField = <K extends keyof Rule>(key: K, value: Rule[K]) => setSelected((current) => current ? { ...current, [key]: value } : current);
  const save = async () => { if (!selected) return; try { await apiFetch(`/light/rules/${selected.id}`, { method: 'PUT', body: JSON.stringify(selected) }, session?.accessToken); load(); } catch (e) { setError(e instanceof Error ? e.message : 'تعذر حفظ القاعدة.'); } };
  return <PageShell title="نظام النور" subtitle="إدارة قيمة النور والمضاعفات والحدود لكل عبادة">
    {error ? <Typography color="error.light" sx={{ mb: 2 }}>{error}</Typography> : null}
    <Paper sx={{ p: 2.5, mb: 2.5 }}><TableContainer><Table><TableHead><TableRow><TableCell>القاعدة</TableCell><TableCell>المصدر</TableCell><TableCell>القيمة</TableCell><TableCell>الحد اليومي</TableCell><TableCell>الحالة</TableCell></TableRow></TableHead><TableBody>{rules.map((rule) => <TableRow key={rule.id} hover onClick={() => setSelected(rule)} selected={selected?.id === rule.id} sx={{ cursor: 'pointer' }}><TableCell><Typography sx={{ fontWeight: 700 }}>{rule.name}</Typography><Typography variant="caption" color="text.secondary">{rule.slug}</Typography></TableCell><TableCell>{rule.source_scope}</TableCell><TableCell sx={{ color: 'secondary.main' }}>{rule.base_amount} نور</TableCell><TableCell>{rule.daily_limit ?? '—'}</TableCell><TableCell><Chip size="small" label={rule.is_active ? 'مفعلة' : 'معطلة'} color={rule.is_active ? 'success' : 'default'} /></TableCell></TableRow>)}</TableBody></Table></TableContainer></Paper>
    {selected ? <Paper sx={{ p: 3, maxWidth: 760 }}><Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>تعديل القاعدة: {selected.name}</Typography><Stack spacing={2}><TextField label="الاسم" value={selected.name} onChange={(e) => setField('name', e.target.value)} /><TextField label="قيمة النور" type="number" value={selected.base_amount} onChange={(e) => setField('base_amount', Number(e.target.value))} /><TextField label="المضاعف" type="number" value={selected.multiplier} onChange={(e) => setField('multiplier', Number(e.target.value))} /><TextField label="الحد اليومي" type="number" value={selected.daily_limit ?? ''} onChange={(e) => setField('daily_limit', Number(e.target.value) || undefined)} /><FormControlLabel control={<Switch checked={selected.is_active} onChange={(e) => setField('is_active', e.target.checked)} />} label="القاعدة مفعلة" /><Button variant="contained" onClick={save}>حفظ التغييرات</Button></Stack></Paper> : null}
  </PageShell>;
}
