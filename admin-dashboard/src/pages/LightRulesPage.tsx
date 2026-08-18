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
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import PageShell from '../components/PageShell';
import { apiFetch } from '../api/client';
import { useAuth } from '../auth/AuthContext';

type Rule = {
  id: number;
  slug: string;
  name: string;
  description?: string;
  source_scope: string;
  source_key?: string;
  base_amount: number;
  multiplier: number;
  daily_limit?: number;
  is_active: boolean;
};

const scopeLabels: Record<string, string> = {
  prayer: 'صلاة / عبادة',
  theory: 'قسم نظري',
  practical: 'خطوة تطبيقية',
  daily_checkin: 'نشاط يومي',
  all_worships: 'إتمام عبادات اليوم',
  activity: 'نشاط إضافي',
  wheel: 'عجلة الوقت',
  achievement: 'إنجاز',
  manual: 'إداري',
  system: 'نظامي',
};

const defaultNewRule: Partial<Rule> = {
  slug: '',
  name: '',
  description: '',
  source_scope: 'prayer',
  source_key: '',
  base_amount: 15,
  multiplier: 1,
  daily_limit: undefined,
  is_active: true,
};

export default function LightRulesPage() {
  const { session } = useAuth();
  const [rules, setRules] = useState<Rule[]>([]);
  const [selected, setSelected] = useState<Rule | null>(null);
  const [tab, setTab] = useState<string>('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openAddModal, setOpenAddModal] = useState(false);
  const [newRule, setNewRule] = useState<Partial<Rule>>(defaultNewRule);

  const load = () => {
    setError('');
    apiFetch<{ data: Rule[] }>('/light/rules', {}, session?.accessToken)
      .then((r) => {
        setRules(r.data);
        setSelected((current) => (current ? r.data.find((item) => item.id === current.id) || null : r.data[0] || null));
      })
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
  }, [session?.accessToken]);

  const setField = <K extends keyof Rule>(key: K, value: Rule[K]) =>
    setSelected((current) => (current ? { ...current, [key]: value } : current));

  const save = async () => {
    if (!selected) return;
    try {
      setError('');
      setSuccess('');
      await apiFetch(`/light/rules/${selected.id}`, { method: 'PUT', body: JSON.stringify(selected) }, session?.accessToken);
      setSuccess('تم حفظ تعديلات القاعدة بنجاح.');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر حفظ القاعدة.');
    }
  };

  const handleCreate = async () => {
    try {
      setError('');
      if (!newRule.slug || !newRule.name) {
        setError('يرجى كتابة الاسم والمعرّف الفريد للقاعدة.');
        return;
      }
      await apiFetch('/light/rules', { method: 'POST', body: JSON.stringify(newRule) }, session?.accessToken);
      setOpenAddModal(false);
      setNewRule(defaultNewRule);
      setSuccess('تم إنشاء قاعدة النور بنجاح.');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر إنشاء القاعدة.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه القاعدة؟')) return;
    try {
      await apiFetch(`/light/rules/${id}`, { method: 'DELETE' }, session?.accessToken);
      setSuccess('تم حذف القاعدة بنجاح.');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر حذف القاعدة.');
    }
  };

  const filteredRules = rules.filter((rule) => {
    if (tab === 'all') return true;
    if (tab === 'prayer') return rule.source_scope === 'prayer';
    if (tab === 'theory') return rule.source_scope === 'theory';
    if (tab === 'practical') return rule.source_scope === 'practical';
    if (tab === 'daily') return rule.source_scope === 'daily_checkin' || rule.source_scope === 'all_worships';
    return true;
  });

  return (
    <PageShell title="نظام النور والمكافآت" subtitle="إدارة والتحكم في قيم النور والمضاعفات والحدود اليومية لكافة العبادات والأقسام">
      {error ? <Typography color="error.light" sx={{ mb: 2 }}>{error}</Typography> : null}
      {success ? <Typography color="success.main" sx={{ mb: 2 }}>{success}</Typography> : null}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} textColor="secondary" indicatorColor="secondary">
          <Tab value="all" label="الكل" />
          <Tab value="prayer" label="الصلوات والعبادات" />
          <Tab value="theory" label="الأقسام النظرية" />
          <Tab value="practical" label="الخطوات التطبيقية" />
          <Tab value="daily" label="المكافآت اليومية" />
        </Tabs>
        <Button variant="contained" color="primary" onClick={() => setOpenAddModal(true)}>
          + إضافة قاعدة نور جديدة
        </Button>
      </Box>

      <Paper sx={{ p: 2.5, mb: 2.5 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>القاعدة</TableCell>
                <TableCell>المجال (Scope)</TableCell>
                <TableCell>قيمة النور الأساسية</TableCell>
                <TableCell>المضاعف</TableCell>
                <TableCell>الحد اليومي</TableCell>
                <TableCell>الحالة</TableCell>
                <TableCell align="center">الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRules.map((rule) => (
                <TableRow
                  key={rule.id}
                  hover
                  onClick={() => setSelected(rule)}
                  selected={selected?.id === rule.id}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Typography sx={{ fontWeight: 700 }}>{rule.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{rule.slug}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip size="small" variant="outlined" label={scopeLabels[rule.source_scope] || rule.source_scope} />
                  </TableCell>
                  <TableCell sx={{ color: 'secondary.main', fontWeight: 800 }}>
                    {rule.base_amount} نور
                  </TableCell>
                  <TableCell>×{rule.multiplier || 1}</TableCell>
                  <TableCell>{rule.daily_limit ? `${rule.daily_limit} نور` : '—'}</TableCell>
                  <TableCell>
                    <Chip size="small" label={rule.is_active ? 'مفعلة' : 'معطلة'} color={rule.is_active ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell align="center">
                    <Button size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(rule.id); }}>
                      حذف
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {selected ? (
        <Paper sx={{ p: 3, maxWidth: 760 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>
            تعديل قاعدة النور: {selected.name}
          </Typography>
          <Stack spacing={2}>
            <TextField label="اسم القاعدة" value={selected.name} onChange={(e) => setField('name', e.target.value)} />
            <TextField label="المعرّف الفريد (Slug)" value={selected.slug} onChange={(e) => setField('slug', e.target.value)} />
            <TextField
              label="قيمة النور الأساسية (Base Light)"
              type="number"
              value={selected.base_amount}
              onChange={(e) => setField('base_amount', Number(e.target.value))}
            />
            <TextField
              label="المضاعف (Multiplier)"
              type="number"
              value={selected.multiplier}
              onChange={(e) => setField('multiplier', Number(e.target.value))}
            />
            <TextField
              label="الحد اليومي المكتسب (Daily Limit)"
              type="number"
              value={selected.daily_limit ?? ''}
              onChange={(e) => setField('daily_limit', Number(e.target.value) || undefined)}
            />
            <FormControlLabel
              control={<Switch checked={selected.is_active} onChange={(e) => setField('is_active', e.target.checked)} />}
              label="القاعدة مفعلة ونشطة"
            />
            <Button variant="contained" color="secondary" onClick={save}>
              حفظ التغييرات
            </Button>
          </Stack>
        </Paper>
      ) : null}

      <Dialog open={openAddModal} onClose={() => setOpenAddModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>إضافة قاعدة نور جديدة</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="اسم القاعدة بالعربية"
              value={newRule.name}
              onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="المعرّف (Slug)"
              placeholder="مثال: worship_custom"
              value={newRule.slug}
              onChange={(e) => setNewRule({ ...newRule, slug: e.target.value })}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>المجال (Scope)</InputLabel>
              <Select
                value={newRule.source_scope}
                label="المجال (Scope)"
                onChange={(e) => setNewRule({ ...newRule, source_scope: e.target.value })}
              >
                <MenuItem value="prayer">صلاة / عبادة (prayer)</MenuItem>
                <MenuItem value="theory">قسم نظري (theory)</MenuItem>
                <MenuItem value="practical">خطوة تطبيقية (practical)</MenuItem>
                <MenuItem value="daily_checkin">نشاط يومي (daily_checkin)</MenuItem>
                <MenuItem value="all_worships">إتمام عبادات اليوم (all_worships)</MenuItem>
                <MenuItem value="activity">نشاط عام (activity)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="قيمة النور الممنوح"
              type="number"
              value={newRule.base_amount}
              onChange={(e) => setNewRule({ ...newRule, base_amount: Number(e.target.value) })}
              fullWidth
            />
            <TextField
              label="الحد اليومي (اختياري)"
              type="number"
              value={newRule.daily_limit || ''}
              onChange={(e) => setNewRule({ ...newRule, daily_limit: Number(e.target.value) || undefined })}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  checked={newRule.is_active}
                  onChange={(e) => setNewRule({ ...newRule, is_active: e.target.checked })}
                />
              }
              label="تفعيل القاعدة مباشرة"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddModal(false)}>إلغاء</Button>
          <Button variant="contained" onClick={handleCreate}>إضافة القاعدة</Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  );
}
