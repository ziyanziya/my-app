import type { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

interface PageShellProps {
  title: string;
  subtitle?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export default function PageShell({ title, subtitle, description, action, children }: PageShellProps) {
  return (
    <Box sx={{ width: '100%', minWidth: 0 }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          <Typography color="text.secondary">{description || subtitle}</Typography>
        </Box>
        {action && <Box>{action}</Box>}
      </Box>
      {children}
    </Box>
  );
}
