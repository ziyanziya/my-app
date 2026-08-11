import { useState } from 'react';
import { Box, Button, Chip, FormControlLabel, Paper, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import PageShell from '../components/PageShell';

const initialLevels = [
  { id: 1, name: 'مبتدئ', description: 'نقطة انطلاق الرحلة', icon: '⭐', color: '#6c5ce7', min_light: 0, is_active: true },
  { id: 2, name: 'مستوى التقدم', description: 'أنت تمشي بثبات', icon: '🌙', color: '#fdcb6e', min_light: 1000, is_active: true },
];

export default function LevelsPage() {
  const [levels, setLevels] = useState(initialLevels);
  const [selected, setSelected] = useState(initialLevels[0]);

  const updateField = (field: string, value: string | number | boolean) => {
    setSelected((prev) => ({ ...prev, [field]: value }));
  };

  const saveLevel = () => {
    setLevels((current) => current.map((level) => (level.id === selected.id ? selected : level)));
  };

  return (
    <PageShell title="Levels" subtitle="Manage level names, icons and minimum light requirements">
      <Paper sx={{ p: 3, mb: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Min Light</TableCell>
                <TableCell>Icon</TableCell>
                <TableCell>Color</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {levels.map((level) => (
                <TableRow key={level.id} hover onClick={() => setSelected(level)} sx={{ cursor: 'pointer' }}>
                  <TableCell>{level.name}</TableCell>
                  <TableCell>{level.min_light}</TableCell>
                  <TableCell>{level.icon}</TableCell>
                  <TableCell>
                    <Box sx={{ bgcolor: level.color, width: 24, height: 24, borderRadius: 1 }} />
                  </TableCell>
                  <TableCell>
                    <Chip label={level.is_active ? 'Active' : 'Inactive'} size="small" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          Edit selected level
        </Typography>
        {selected ? (
          <Stack spacing={2}>
            <TextField label="Name" value={selected.name} onChange={(e) => updateField('name', e.target.value)} fullWidth />
            <TextField label="Description" value={selected.description} onChange={(e) => updateField('description', e.target.value)} fullWidth multiline rows={2} />
            <TextField label="Icon" value={selected.icon} onChange={(e) => updateField('icon', e.target.value)} fullWidth />
            <TextField label="Color" value={selected.color} onChange={(e) => updateField('color', e.target.value)} fullWidth />
            <TextField label="Minimum Light" value={selected.min_light} onChange={(e) => updateField('min_light', Number(e.target.value))} fullWidth />
            <FormControlLabel control={<Switch checked={selected.is_active} onChange={(e) => updateField('is_active', e.target.checked)} />} label="Active" />
            <Button variant="contained" onClick={saveLevel}>
              Save Level
            </Button>
          </Stack>
        ) : null}
      </Paper>
    </PageShell>
  );
}
