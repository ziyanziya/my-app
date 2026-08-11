import { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import {
  AddRounded,
  DeleteRounded,
  DragIndicatorRounded,
  EditRounded,
  OpenInFullRounded,
  SaveRounded,
} from '@mui/icons-material';
import PageShell from '../components/PageShell';
import { apiFetch, apiUrl } from '../api/client';
import { useAuth } from '../auth/AuthContext';

type Worship = { id: number; title: string; };
type TheorySection = {
  id: number;
  worship_id: number;
  title: string;
  content: string;
  reward_points: number;
  order_index: number;
};
type PracticalStep = {
  id: number;
  worship_id: number;
  title: string;
  description: string;
  video_url: string | null;
  reward_points: number;
  order_index: number;
  media?: PracticalStepMedia[];
};
type PracticalStepMedia = {
  id: number;
  media_type: 'upload' | 'external_link';
  url: string;
  original_name: string | null;
  title: string | null;
};
type ContentMode = 'theory' | 'practical';
type DescriptionEditor = { target: 'new' | 'edit'; value: string };

const initialSection = { title: '', content: '', reward_points: 0 };
const initialStep = { title: '', description: '', video_url: '', reward_points: 0 };

export default function ContentPage() {
  const { session } = useAuth();
  const [worships, setWorships] = useState<Worship[]>([]);
  const [sections, setSections] = useState<TheorySection[]>([]);
  const [practicalSteps, setPracticalSteps] = useState<PracticalStep[]>([]);
  const [selectedWorshipId, setSelectedWorshipId] = useState<number | null>(null);
  const [mode, setMode] = useState<ContentMode>('theory');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [totalItems, setTotalItems] = useState(0);
  const [newSection, setNewSection] = useState(initialSection);
  const [newStep, setNewStep] = useState(initialStep);
  const [newStepVideoFile, setNewStepVideoFile] = useState<File | null>(null);
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [editingStep, setEditingStep] = useState<number | null>(null);
  const [editSectionValues, setEditSectionValues] = useState({ title: '', content: '', reward_points: 0 });
  const [editStepValues, setEditStepValues] = useState({ title: '', description: '', video_url: '', reward_points: 0 });
  const [descriptionEditor, setDescriptionEditor] = useState<DescriptionEditor | null>(null);

  const openDescriptionEditor = (target: DescriptionEditor['target'], value: string) => {
    setDescriptionEditor({ target, value });
  };

  const applyDescriptionEditor = () => {
    if (!descriptionEditor) return;
    const { target, value } = descriptionEditor;

    if (target === 'new') {
      if (mode === 'theory') setNewSection((current) => ({ ...current, content: value }));
      else setNewStep((current) => ({ ...current, description: value }));
    } else if (mode === 'theory') {
      setEditSectionValues((current) => ({ ...current, content: value }));
    } else {
      setEditStepValues((current) => ({ ...current, description: value }));
    }

    setDescriptionEditor(null);
  };

  const loadWorships = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch<{ data: Worship[] }>('/worships', {}, session?.accessToken);
      setWorships(res.data);
      if (res.data.length > 0) {
        setSelectedWorshipId((current) => current || res.data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل العبادة.');
    } finally {
      setLoading(false);
    }
  };

  const loadCounts = async (worshipsList: Worship[]) => {
    try {
      const sectionPromises = worshipsList.map((worship) => apiFetch<{ data: TheorySection[] }>(`/theory-sections/worship/${worship.id}`, {}, session?.accessToken));
      const stepPromises = worshipsList.map((worship) => apiFetch<{ data: PracticalStep[] }>(`/practical-steps/worship/${worship.id}`, {}, session?.accessToken));
      const [sectionsResponses, stepsResponses] = await Promise.all([Promise.all(sectionPromises), Promise.all(stepPromises)]);
      setTotalItems(sectionsResponses.flatMap((res) => res.data).length + stepsResponses.flatMap((res) => res.data).length);
    } catch {
      // ignore if counts fail
    }
  };

  const loadContent = async (worshipId: number | null) => {
    if (!worshipId) return;
    setLoading(true);
    setError('');
    try {
      if (mode === 'theory') {
        const sectionsRes = await apiFetch<{ data: TheorySection[] }>(`/theory-sections/worship/${worshipId}`, {}, session?.accessToken);
        setSections(sectionsRes.data.sort((a, b) => a.order_index - b.order_index));
      } else {
        const stepsRes = await apiFetch<{ data: PracticalStep[] }>(`/practical-steps/worship/${worshipId}`, {}, session?.accessToken);
        setPracticalSteps(stepsRes.data.sort((a, b) => a.order_index - b.order_index));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحميل المحتوى العلمي.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!session?.accessToken) return;
    loadWorships();
  }, [session?.accessToken]);

  useEffect(() => {
    if (!session?.accessToken || worships.length === 0) return;
    loadCounts(worships);
  }, [session?.accessToken, worships]);

  useEffect(() => {
    if (selectedWorshipId) loadContent(selectedWorshipId);
  }, [selectedWorshipId, session?.accessToken, mode]);

  useEffect(() => {
    setEditingSection(null);
    setEditingStep(null);
    setNewSection(initialSection);
    setNewStep(initialStep);
    setNewStepVideoFile(null);
  }, [mode]);

  const selectedWorship = useMemo(
    () => worships.find((item) => item.id === selectedWorshipId) || null,
    [worships, selectedWorshipId],
  );

  const handleReorder = <T extends { order_index: number }>(items: T[], setItems: (items: T[]) => void, from: number, to: number) => {
    const updated = [...items];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setItems(updated.map((item, index) => ({ ...item, order_index: index + 1 })));
  };

  const saveOrder = async () => {
    setSaving(true);
    setError('');
    try {
      const endpoint = mode === 'theory' ? '/theory-sections/reorder' : '/practical-steps/reorder';
      const payload = mode === 'theory'
        ? sections.map((item) => ({ id: item.id, order_index: item.order_index }))
        : practicalSteps.map((item) => ({ id: item.id, order_index: item.order_index }));
      await apiFetch(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
      }, session?.accessToken);
      if (selectedWorshipId) await loadContent(selectedWorshipId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل حفظ الترتيب.');
    } finally {
      setSaving(false);
    }
  };

  const createSection = async () => {
    if (!selectedWorshipId) return;
    setSaving(true);
    setError('');
    try {
      await apiFetch('/theory-sections', {
        method: 'POST',
        body: JSON.stringify({ ...newSection, worship_id: selectedWorshipId, order_index: sections.length + 1 }),
      }, session?.accessToken);
      setNewSection(initialSection);
      await loadContent(selectedWorshipId);
      await loadCounts(worships);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل إضافة القسم.');
    } finally {
      setSaving(false);
    }
  };

  const createStep = async () => {
    if (!selectedWorshipId) return;
    setSaving(true);
    setError('');
    try {
      const created = await apiFetch<{ data: PracticalStep }>('/practical-steps', {
        method: 'POST',
        body: JSON.stringify({
          worship_id: selectedWorshipId,
          title: newStep.title,
          description: newStep.description,
          reward_points: newStep.reward_points,
          order_index: practicalSteps.length + 1,
        }),
      }, session?.accessToken);
      if (newStep.video_url.trim()) {
        await apiFetch(`/practical-steps/${created.data.id}/media/link`, {
          method: 'POST',
          body: JSON.stringify({ url: newStep.video_url.trim() }),
        }, session?.accessToken);
      }
      if (newStepVideoFile) {
        const formData = new FormData();
        formData.append('video', newStepVideoFile);
        await apiFetch(`/practical-steps/${created.data.id}/media/upload`, {
          method: 'POST',
          body: formData,
        }, session?.accessToken);
      }
      setNewStep(initialStep);
      setNewStepVideoFile(null);
      await loadContent(selectedWorshipId);
      await loadCounts(worships);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل إضافة الخطوة.');
    } finally {
      setSaving(false);
    }
  };

  const updateSection = async (section: TheorySection) => {
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/theory-sections/${section.id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: section.title, content: section.content, reward_points: section.reward_points }),
      }, session?.accessToken);
      setEditingSection(null);
      await loadContent(selectedWorshipId!);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحديث القسم.');
    } finally {
      setSaving(false);
    }
  };

  const updateStep = async (step: PracticalStep) => {
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/practical-steps/${step.id}`, {
        method: 'PUT',
        body: JSON.stringify({ title: step.title, description: step.description, reward_points: step.reward_points }),
      }, session?.accessToken);
      if (step.video_url?.trim()) {
        await apiFetch(`/practical-steps/${step.id}/media/link`, {
          method: 'POST',
          body: JSON.stringify({ url: step.video_url.trim() }),
        }, session?.accessToken);
      }
      setEditingStep(null);
      await loadContent(selectedWorshipId!);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تحديث الخطوة.');
    } finally {
      setSaving(false);
    }
  };

  const deleteSection = async (id: number) => {
    if (!window.confirm('هل تريد حذف هذا القسم؟')) return;
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/theory-sections/${id}`, { method: 'DELETE' }, session?.accessToken);
      await loadContent(selectedWorshipId!);
      await loadCounts(worships);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل حذف القسم.');
    } finally {
      setSaving(false);
    }
  };

  const deleteStep = async (id: number) => {
    if (!window.confirm('هل تريد حذف هذه الخطوة؟')) return;
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/practical-steps/${id}`, { method: 'DELETE' }, session?.accessToken);
      await loadContent(selectedWorshipId!);
      await loadCounts(worships);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل حذف الخطوة.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell title="المحتوى العلمي" subtitle="إدارة العبادات، الأقسام النظرية والخطوات التطبيقية بأسلوب الصراط الفاخر">
      <Stack spacing={3}>
        <Paper sx={{ p: 3, borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top right, rgba(212,165,116,0.14), transparent 35%)' }} />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ position: 'relative', zIndex: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>مؤشرات المحتوى</Typography>
              <Typography color="text.secondary">عدد العبادات والمحتوى المرتبط بالجانب النظري والتطبيقي.</Typography>
            </Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
              <Paper sx={{ flex: 1, p: 2, bgcolor: 'rgba(255,255,255,0.04)' }}>
                <Typography variant="h6" sx={{ color: '#d4a574' }}>العبادات</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>{worships.length}</Typography>
              </Paper>
              <Paper sx={{ flex: 1, p: 2, bgcolor: 'rgba(255,255,255,0.04)' }}>
                <Typography variant="h6" sx={{ color: '#d4a574' }}>العناصر</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>{totalItems}</Typography>
              </Paper>
            </Stack>
          </Stack>
        </Paper>

        <Paper sx={{ width: '100%', p: { xs: 1.5, sm: 2.5, md: 3.5 }, borderRadius: { xs: 2.5, sm: 4 }, bgcolor: 'rgba(26,13,20,0.92)' }}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <TextField
              select
              label="اختر العبادة"
              value={selectedWorshipId ?? ''}
              onChange={(event) => setSelectedWorshipId(Number(event.target.value))}
              sx={{ minWidth: 220, bgcolor: 'rgba(255,255,255,0.04)' }}
            >
              {worships.map((item) => (
                <MenuItem key={item.id} value={item.id}>{item.title}</MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="اختر الجانب"
              value={mode}
              onChange={(event) => setMode(event.target.value as ContentMode)}
              sx={{ minWidth: 220, bgcolor: 'rgba(255,255,255,0.04)' }}
            >
              <MenuItem value="theory">الجانب النظري</MenuItem>
              <MenuItem value="practical">الجانب التطبيقي</MenuItem>
            </TextField>
          </Stack>

          {loading ? (
            <Stack sx={{ py: 8, alignItems: 'center' }}><CircularProgress color="secondary" /></Stack>
          ) : (
            <Stack spacing={3} sx={{ mt: 3 }}>
              {error ? <Typography color="error">{error}</Typography> : null}
              {!selectedWorship ? (
                <Typography color="text.secondary">اختر عبادة لتحرير المحتوى العلمي.</Typography>
              ) : (
                <Stack spacing={3}>
                  <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.04)' }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                      إضافة {mode === 'theory' ? 'قسم نظري جديد' : 'قسم تطبيقي جديد'}
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: 'repeat(2, minmax(0, 1fr))', lg: mode === 'practical' ? 'repeat(5, minmax(0, 1fr))' : 'minmax(220px, 1fr) minmax(260px, 1.35fr) minmax(150px, .45fr) auto' }, gap: 2, alignItems: 'start' }}>
                      <TextField
                        label="عنوان القسم"
                        value={mode === 'theory' ? newSection.title : newStep.title}
                        onChange={(e) => mode === 'theory'
                          ? setNewSection((current) => ({ ...current, title: e.target.value }))
                          : setNewStep((current) => ({ ...current, title: e.target.value }))
                        }
                      />
                      <TextField
                        multiline
                        minRows={3}
                        label="وصف القسم"
                        value={mode === 'theory' ? newSection.content : newStep.description}
                        onClick={() => openDescriptionEditor('new', mode === 'theory' ? newSection.content : newStep.description)}
                        slotProps={{ htmlInput: { readOnly: true } }}
                        helperText="اضغط لفتح محرر الوصف الموسّع"
                      />
                      {mode === 'practical' && (
                        <Stack direction="column" spacing={1.25} sx={{ minWidth: 0 }}>
                          <TextField
                            fullWidth
                            label="رابط الفيديو"
                            placeholder="https://example.com/video"
                            value={newStep.video_url}
                            onChange={(e) => setNewStep((current) => ({ ...current, video_url: e.target.value }))}
                            helperText="يمكنك لصق رابط أو رفع ملف فيديو"
                          />
                          <Button variant="outlined" component="label" sx={{ width: '100%', minHeight: 48 }}>
                            {newStepVideoFile ? `الفيديو المختار: ${newStepVideoFile.name}` : 'رفع فيديو'}
                            <input
                              hidden
                              accept="video/*"
                              type="file"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setNewStepVideoFile(file);
                              }}
                            />
                          </Button>
                        </Stack>
                      )}
                      <TextField
                        type="number"
                        label="قيمة النور"
                        value={mode === 'theory' ? newSection.reward_points : newStep.reward_points}
                        onChange={(e) => mode === 'theory'
                          ? setNewSection((current) => ({ ...current, reward_points: Number(e.target.value) }))
                          : setNewStep((current) => ({ ...current, reward_points: Number(e.target.value) }))
                        }
                        sx={{ minWidth: 0 }}
                      />
                      <Button
                        variant="contained"
                        startIcon={<AddRounded />}
                        onClick={mode === 'theory' ? createSection : createStep}
                        disabled={saving || (mode === 'theory' ? !newSection.title.trim() || !newSection.content.trim() : !newStep.title.trim() || !newStep.description.trim())}
                      >
                        إضافة
                      </Button>
                    </Box>
                  </Paper>
                  <Paper sx={{ overflow: 'hidden' }}>
                    <TableContainer>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>سحب</TableCell>
                          <TableCell>عنوان القسم</TableCell>
                          {mode === 'practical' ? <TableCell>فيديو / رابط</TableCell> : <TableCell>وصف القسم</TableCell>}
                          <TableCell>قيمة النور</TableCell>
                            <TableCell>الترتيب</TableCell>
                            <TableCell align="right">الإجراءات</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {(mode === 'theory' ? sections : practicalSteps).map((item, index) => {
                            const isEditing = mode === 'theory' ? editingSection === item.id : editingStep === item.id;
                            return (
                              <TableRow
                                key={item.id}
                                draggable
                                onDragStart={(event) => event.dataTransfer.setData('text/plain', String(index))}
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={(event) => {
                                  event.preventDefault();
                                  const sourceIndex = Number(event.dataTransfer.getData('text/plain'));
                                  if (mode === 'theory') handleReorder(sections, setSections, sourceIndex, index);
                                  else handleReorder(practicalSteps, setPracticalSteps, sourceIndex, index);
                                }}
                                sx={{ cursor: 'grab' }}
                              >
                                <TableCell><DragIndicatorRounded sx={{ color: '#d4a574' }} /></TableCell>
                                <TableCell>
                                  {isEditing ? (
                                    <TextField
                                      fullWidth
                                      size="small"
                                      value={mode === 'theory' ? editSectionValues.title : editStepValues.title}
                                      onChange={(event) => mode === 'theory'
                                        ? setEditSectionValues((prev) => ({ ...prev, title: event.target.value }))
                                        : setEditStepValues((prev) => ({ ...prev, title: event.target.value }))
                                      }
                                    />
                                  ) : (
                                    item.title
                                  )}
                                </TableCell>
                                <TableCell>
                                  {isEditing ? (
                                    <TextField
                                      fullWidth
                                      size="small"
                                      multiline
                                      minRows={2}
                                      value={mode === 'theory' ? editSectionValues.content : editStepValues.description}
                                      onClick={() => openDescriptionEditor('edit', mode === 'theory' ? editSectionValues.content : editStepValues.description)}
                                      slotProps={{ htmlInput: { readOnly: true } }}
                                    />
                                  ) : (
                                    <Stack spacing={0.5} sx={{ minWidth: 220, maxWidth: 360 }}>
                                      <Typography sx={{ whiteSpace: 'pre-wrap', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                        {mode === 'theory' ? (item as TheorySection).content : (item as PracticalStep).description}
                                      </Typography>
                                      {(mode === 'theory' ? (item as TheorySection).content : (item as PracticalStep).description).length > 120 ? (
                                        <Button
                                          size="small"
                                          variant="text"
                                          startIcon={<OpenInFullRounded fontSize="small" />}
                                          sx={{ alignSelf: 'flex-start' }}
                                          onClick={() => {
                                            if (mode === 'theory') {
                                              setEditingSection(item.id);
                                              setEditSectionValues({ title: item.title, content: (item as TheorySection).content, reward_points: item.reward_points });
                                              openDescriptionEditor('edit', (item as TheorySection).content);
                                            } else {
                                              setEditingStep(item.id);
                                              setEditStepValues({ title: item.title, description: (item as PracticalStep).description, video_url: (item as PracticalStep).video_url || '', reward_points: item.reward_points });
                                              openDescriptionEditor('edit', (item as PracticalStep).description);
                                            }
                                          }}
                                        >
                                          عرض وتعديل الوصف
                                        </Button>
                                      ) : null}
                                    </Stack>
                                  )}
                                </TableCell>
                                {mode === 'practical' ? (
                                  <TableCell>
                                    {isEditing ? (
                                      <TextField
                                        fullWidth
                                        size="small"
                                        value={editStepValues.video_url}
                                        onChange={(event) => setEditStepValues((prev) => ({ ...prev, video_url: event.target.value }))}
                                      />
                                    ) : (
                                      (item as PracticalStep).media?.length ? (
                                        <Stack spacing={0.75}>
                                          {(item as PracticalStep).media?.map((media, mediaIndex) => (
                                            <a key={media.id} href={media.url.startsWith('/') ? `${apiUrl.replace(/\/api\/v1$/, '')}${media.url}` : media.url} target="_blank" rel="noreferrer">
                                              {media.title || media.original_name || `فيديو ${mediaIndex + 1}`}
                                            </a>
                                          ))}
                                        </Stack>
                                      ) : '-'
                                    )}
                                  </TableCell>
                                ) : null}
                                <TableCell>
                                  {isEditing ? (
                                    <TextField
                                      size="small"
                                      type="number"
                                      sx={{ width: 120 }}
                                      value={mode === 'theory' ? editSectionValues.reward_points : editStepValues.reward_points}
                                      onChange={(event) => mode === 'theory'
                                        ? setEditSectionValues((prev) => ({ ...prev, reward_points: Number(event.target.value) }))
                                        : setEditStepValues((prev) => ({ ...prev, reward_points: Number(event.target.value) }))
                                      }
                                    />
                                  ) : (
                                    item.reward_points
                                  )}
                                </TableCell>
                                <TableCell>{item.order_index}</TableCell>
                                <TableCell align="right">
                                  {isEditing ? (
                                    <Button
                                      variant="contained"
                                      size="small"
                                      startIcon={<SaveRounded />}
                                      onClick={() => mode === 'theory'
                                        ? updateSection({ ...(item as TheorySection), ...editSectionValues })
                                        : updateStep({ ...(item as PracticalStep), ...editStepValues })
                                      }
                                      sx={{ ml: 1 }}
                                    >
                                      حفظ
                                    </Button>
                                  ) : (
                                    <IconButton
                                      size="small"
                                      color="secondary"
                                      onClick={() => {
                                        if (mode === 'theory') {
                                          setEditingSection(item.id);
                                          setEditSectionValues({
                                            title: item.title,
                                            content: (item as TheorySection).content,
                                            reward_points: item.reward_points,
                                          });
                                        } else {
                                          setEditingStep(item.id);
                                          setEditStepValues({
                                            title: item.title,
                                            description: (item as PracticalStep).description,
                                            video_url: (item as PracticalStep).video_url || '',
                                            reward_points: item.reward_points,
                                          });
                                        }
                                      }}
                                    >
                                      <EditRounded />
                                    </IconButton>
                                  )}
                                  <IconButton size="small" color="error" onClick={() => mode === 'theory' ? deleteSection(item.id) : deleteStep(item.id)}>
                                    <DeleteRounded />
                                  </IconButton>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                  <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
                    <Button variant="contained" onClick={saveOrder} disabled={saving || loading} startIcon={<SaveRounded />}>
                      حفظ الترتيب
                    </Button>
                    <Button variant="outlined" onClick={() => selectedWorshipId && loadContent(selectedWorshipId)} disabled={loading}>
                      إعادة التحميل
                    </Button>
                  </Stack>
                </Stack>
              )}
            </Stack>
          )}
        </Paper>
      </Stack>
      <Dialog
        open={Boolean(descriptionEditor)}
        onClose={() => setDescriptionEditor(null)}
        fullWidth
        maxWidth="md"
        slotProps={{ paper: { sx: { minHeight: '70vh' } } }}
      >
        <DialogTitle>محرر وصف القسم</DialogTitle>
        <DialogContent sx={{ pt: '16px !important', display: 'flex' }}>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={18}
            label={mode === 'theory' ? 'وصف الجانب النظري' : 'وصف الجانب التطبيقي'}
            value={descriptionEditor?.value ?? ''}
            onChange={(event) => setDescriptionEditor((current) => current ? { ...current, value: event.target.value } : current)}
            placeholder="اكتب الوصف هنا، ثم راجعه وصحح الأخطاء قبل الحفظ."
            sx={{ '& .MuiInputBase-root': { alignItems: 'flex-start' } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDescriptionEditor(null)}>إلغاء</Button>
          <Button variant="contained" startIcon={<SaveRounded />} onClick={applyDescriptionEditor}>تطبيق الوصف</Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  );
}
