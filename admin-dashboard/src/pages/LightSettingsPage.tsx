import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
  Tabs,
  Tab,
  Grid,
  alpha,
  Paper,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  SaveRounded, 
  AutoAwesomeRounded, 
  EventAvailableRounded, 
  TimelineRounded,
  ExpandMoreRounded,
  MenuBookRounded,
  CheckCircleOutlineRounded,
  DarkModeRounded,
  WbSunnyRounded,
  StarRounded,
  FavoriteRounded
} from '@mui/icons-material';
import PageShell from '../components/PageShell';
import { apiFetch } from '../api/client';
import { useAuth } from '../auth/AuthContext';

type LightSettings = {
  streaks: { id?: number; slug: string; name: string; base_amount: number; source_scope?: string }[];
  worshipTree?: {
    id: number;
    name: string;
    icon: string;
    theory_sections: { id: number; worship_id: number; title: string; reward_points: number }[];
    practical_steps: { id: number; worship_id: number; title: string; reward_points: number }[];
  }[];
};

const DEFAULT_STREAKS = [
  { slug: 'daily_checkin', name: 'يومي (بدون سلسلة)', base_amount: 10, source_scope: 'daily_checkin' },
  { slug: 'streak_7_days', name: 'أسبوع (7 أيام)', base_amount: 50, source_scope: 'daily_checkin' },
  { slug: 'streak_30_days', name: 'شهر (30 يوم)', base_amount: 200, source_scope: 'daily_checkin' },
  { slug: 'streak_45_days', name: 'شهر ونصف (45 يوم)', base_amount: 300, source_scope: 'daily_checkin' },
  { slug: 'streak_90_days', name: '3 أشهر (90 يوم)', base_amount: 600, source_scope: 'daily_checkin' },
  { slug: 'streak_180_days', name: '6 أشهر (180 يوم)', base_amount: 1500, source_scope: 'daily_checkin' },
  { slug: 'streak_365_days', name: 'سنة (365 يوم)', base_amount: 5000, source_scope: 'daily_checkin' },
];



interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const getWorshipIcon = (iconName: string) => {
  switch (iconName) {
    case 'moon': return <DarkModeRounded />;
    case 'sun': return <WbSunnyRounded />;
    case 'star': return <StarRounded />;
    case 'heart': return <FavoriteRounded />;
    case 'book': return <MenuBookRounded />;
    default: return <StarRounded />;
  }
};

export default function LightSettingsPage() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [settings, setSettings] = useState<LightSettings>({
    streaks: [], worshipTree: []
  });

  useEffect(() => {
    loadSettings();
  }, [session?.accessToken]);

  const loadSettings = () => {
    setLoading(true);
    setError('');
    apiFetch<{ data: LightSettings }>('/light-settings', {}, session?.accessToken)
      .then((res) => {
        // Merge missing default streaks if they are not in DB
        const dbStreaks = res.data.streaks || [];
        const mergedStreaks = DEFAULT_STREAKS.map(ds => {
          const found = dbStreaks.find(db => db.slug === ds.slug);
          return found ? { ...ds, ...found } : ds;
        });

        setSettings({
          ...res.data,
          streaks: mergedStreaks,
        });
        setLoading(false);
      })
      .catch((e) => {
        setError('فشل في جلب الإعدادات: ' + e.message);
        setLoading(false);
      });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await apiFetch('/light-settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      }, session?.accessToken);
      setSuccess('تم حفظ إعدادات النور بنجاح!');
      setTimeout(() => setSuccess(''), 3000);
      loadSettings(); // Reload to get newly inserted IDs
    } catch (e: any) {
      setError('فشل في حفظ الإعدادات: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (category: keyof LightSettings, index: number, field: string, value: number) => {
    const updated = [...(settings[category] || [])] as any[];
    updated[index] = { ...updated[index], [field]: value };
    setSettings({ ...settings, [category]: updated });
  };

  const handleNestedChange = (worshipIndex: number, type: 'theory_sections' | 'practical_steps', itemIndex: number, value: number) => {
    if (!settings.worshipTree) return;
    const updatedTree = [...settings.worshipTree];
    const updatedItems = [...updatedTree[worshipIndex][type]];
    updatedItems[itemIndex] = { ...updatedItems[itemIndex], reward_points: value };
    updatedTree[worshipIndex] = { ...updatedTree[worshipIndex], [type]: updatedItems as any };
    setSettings({ ...settings, worshipTree: updatedTree });
  };

  if (loading) return (
    <PageShell title="إدارة التلعيب والنور" description="إدارة وتحديد مقادير النور للأنشطة المختلفة">
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress color="secondary" /></Box>
    </PageShell>
  );

  return (
    <PageShell 
      title="إدارة التلعيب والنور" 
      description="إدارة بسيطة ومجمعة لكل إعدادات النور، المستويات، والإنجازات في التطبيق"
      action={
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveRounded />}
          onClick={handleSave}
          disabled={saving}
          size="large"
        >
          حفظ التعديلات
        </Button>
      }
    >
      {error && <Typography color="error" sx={{ mb: 2 }} variant="body1">{error}</Typography>}
      {success && <Typography color="success.main" sx={{ mb: 2 }} variant="body1">{success}</Typography>}

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} textColor="secondary" indicatorColor="secondary" variant="scrollable" scrollButtons="auto">
          <Tab icon={<AutoAwesomeRounded />} iconPosition="start" label="مكافآت العبادات" />
          <Tab icon={<EventAvailableRounded />} iconPosition="start" label="المواظبة" />
        </Tabs>
      </Box>



      {/* الصلوات والمهام */}
      <CustomTabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: alpha('#d4a574', 0.2), color: '#d4a574' }}><AutoAwesomeRounded /></Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>مكافآت العبادات والأقسام</Typography>
              <Typography variant="body2" color="text.secondary">حدد مقدار النور الذي يُمنح عند أداء العبادة، وللأقسام النظرية والعملية التابعة لها.</Typography>
            </Box>
          </Stack>
          <Divider sx={{ mb: 4 }} />
          
          <Stack spacing={3}>
            {settings.worshipTree?.map((worship, i) => (
              <Card key={worship.id} sx={{ border: `1px solid ${alpha('#d4a574', 0.3)}`, overflow: 'visible' }}>
                <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: alpha('#d4a574', 0.05) }}>
                  <Avatar sx={{ bgcolor: alpha('#d4a574', 0.2), color: '#d4a574' }}>
                    {getWorshipIcon(worship.icon)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{worship.name}</Typography>
                  </Box>
                </Box>
                
                {(worship.theory_sections.length > 0 || worship.practical_steps.length > 0) && (
                  <Accordion elevation={0} disableGutters sx={{ bgcolor: 'transparent', '&:before': { display: 'none' } }}>
                    <AccordionSummary expandIcon={<ExpandMoreRounded />} sx={{ borderTop: `1px solid ${alpha('#d4a574', 0.1)}` }}>
                      <Typography variant="subtitle2" color="secondary">عرض الأقسام النظرية والخطوات التطبيقية التابعة</Typography>
                    </AccordionSummary>
                    <AccordionDetails sx={{ pt: 0 }}>
                      <Grid container spacing={4}>
                        {worship.theory_sections.length > 0 && (
                          <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'text.secondary' }}>
                              <MenuBookRounded fontSize="small" /> الأقسام النظرية
                            </Typography>
                            <Stack spacing={2}>
                              {worship.theory_sections.map((ts, j) => (
                                <Box key={ts.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                  <Typography variant="body2" sx={{ flex: 1, fontWeight: 'bold' }}>{ts.title}</Typography>
                                  <TextField
                                    type="number"
                                    size="small"
                                    sx={{ width: 100 }}
                                    value={ts.reward_points}
                                    onChange={(e) => handleNestedChange(i, 'theory_sections', j, parseFloat(e.target.value) || 0)}
                                    slotProps={{ input: { endAdornment: <Typography color="secondary" variant="caption">نور</Typography> } }}
                                  />
                                </Box>
                              ))}
                            </Stack>
                          </Grid>
                        )}
                        
                        {worship.practical_steps.length > 0 && (
                          <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'text.secondary' }}>
                              <CheckCircleOutlineRounded fontSize="small" /> الخطوات التطبيقية
                            </Typography>
                            <Stack spacing={2}>
                              {worship.practical_steps.map((ps, j) => (
                                <Box key={ps.id} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                  <Typography variant="body2" sx={{ flex: 1, fontWeight: 'bold' }}>{ps.title}</Typography>
                                  <TextField
                                    type="number"
                                    size="small"
                                    sx={{ width: 100 }}
                                    value={ps.reward_points}
                                    onChange={(e) => handleNestedChange(i, 'practical_steps', j, parseFloat(e.target.value) || 0)}
                                    slotProps={{ input: { endAdornment: <Typography color="secondary" variant="caption">نور</Typography> } }}
                                  />
                                </Box>
                              ))}
                            </Stack>
                          </Grid>
                        )}
                      </Grid>
                    </AccordionDetails>
                  </Accordion>
                )}
              </Card>
            ))}
            
            {(!settings.worshipTree || settings.worshipTree.length === 0) && (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>لا توجد عبادات مضافة لعرضها.</Typography>
            )}
          </Stack>
        </Paper>
      </CustomTabPanel>



      {/* المواظبة */}
      <CustomTabPanel value={tabValue} index={1}>
        <Paper sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 3 }}>
            <Avatar sx={{ bgcolor: alpha('#6ba584', 0.2), color: '#6ba584' }}><TimelineRounded /></Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>مكافآت الاستمرارية والمواظبة</Typography>
              <Typography variant="body2" color="text.secondary">حدد مقدار النور الذي يُمنح عند تسجيل الدخول وإتمام المهام لأيام متتالية.</Typography>
            </Box>
          </Stack>
          <Divider sx={{ mb: 4 }} />

          <Grid container spacing={3}>
            {settings.streaks.map((streak, i) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={streak.slug}>
                <TextField
                  label={streak.name}
                  type="number"
                  variant="outlined"
                  fullWidth
                  value={streak.base_amount}
                  onChange={(e) => handleChange('streaks', i, 'base_amount', parseFloat(e.target.value) || 0)}
                  slotProps={{ input: { endAdornment: <Typography color="secondary" variant="caption">نور</Typography> } }}
                />
              </Grid>
            ))}
          </Grid>
        </Paper>
      </CustomTabPanel>

    </PageShell>
  );
}
