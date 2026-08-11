import { useState } from 'react';
import { Button, Chip, FormControlLabel, Paper, Stack, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material';
import PageShell from '../components/PageShell';

const initialRules = [
  { id: 1, name: '7 أيام متتالية', condition: 'consecutive_days', threshold: 7, bonus_light: 50, is_active: true },
  { id: 2, name: '30 يوماً متتالياً', condition: 'consecutive_days', threshold: 30, bonus_light: 200, is_active: false },
];

export default function StreakRulesPage() {
  const [rules, setRules] = useState(initialRules);
  const [selected, setSelected] = useState(initialRules[0]);

  const updateField = (field: string, value: string | number | boolean) => {
    setSelected((prev) => ({ ...prev, [field]: value }));
  };

  const saveRule = () => {
    setRules((current) => current.map((rule) => (rule.id === selected.id ? selected : rule)));
  };

  return (
    <PageShell title="Streak Rules" subtitle="Configure streak-based light bonuses">
      <Paper sx={{ p: 3, mb: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Condition</TableCell>
                <TableCell>Threshold</TableCell>
                <TableCell>Bonus</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id} hover onClick={() => setSelected(rule)} sx={{ cursor: 'pointer' }}>
                  <TableCell>{rule.name}</TableCell>
                  <TableCell>{rule.condition}</TableCell>
                  <TableCell>{rule.threshold}</TableCell>
                  <TableCell>{rule.bonus_light}</TableCell>
                  <TableCell>
                    <Chip label={rule.is_active ? 'Active' : 'Inactive'} size="small" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
          Edit selected streak rule
        </Typography>
        {selected ? (
          <Stack spacing={2}>
            <TextField label="Name" value={selected.name} onChange={(e) => updateField('name', e.target.value)} fullWidth />
            <TextField label="Condition" value={selected.condition} onChange={(e) => updateField('condition', e.target.value)} fullWidth />
            <TextField label="Threshold" value={selected.threshold} onChange={(e) => updateField('threshold', Number(e.target.value))} fullWidth />
            <TextField label="Bonus Light" value={selected.bonus_light} onChange={(e) => updateField('bonus_light', Number(e.target.value))} fullWidth />
            <FormControlLabel control={<Switch checked={selected.is_active} onChange={(e) => updateField('is_active', e.target.checked)} />} label="Active" />
            <Button variant="contained" onClick={saveRule}>
              Save Rule
            </Button>
          </Stack>
        ) : null}
      </Paper>
    </PageShell>
  );
}
