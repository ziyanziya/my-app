import { Box, Avatar, Paper, Typography } from '@mui/material';
import PageShell from '../components/PageShell';

const cards = ['First Week Streak', 'Consistency Master', 'Spiritual Growth'];

export default function AchievementsPage() {
  return (
    <PageShell title="Achievements" subtitle="Reward systems and unlock milestones">
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2 }}>
        {cards.map((item) => (
          <Paper key={item} sx={{ p: 3 }}>
            <Avatar sx={{ bgcolor: 'primary.main', mb: 2 }}>🏅</Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {item}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Auto-awarded to users completing the main challenge.
            </Typography>
          </Paper>
        ))}
      </Box>
    </PageShell>
  );
}
