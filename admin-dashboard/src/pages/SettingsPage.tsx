import { Box, Button, Divider, FormControlLabel, Paper, Stack, Switch, TextField } from '@mui/material';
import PageShell from '../components/PageShell';

export default function SettingsPage() {
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
    </PageShell>
  );
}
