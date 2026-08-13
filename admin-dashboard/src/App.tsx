import { useEffect, useState } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Slide,
  Stack,
  ThemeProvider,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
  createTheme,
  alpha,
} from '@mui/material';
import {
  AnalyticsRounded,
  AutoAwesomeRounded,
  DarkModeRounded,
  EmojiEventsRounded,
  EventAvailableRounded,
  MenuBookRounded,
  MenuRounded,
  NotificationsRounded,
  PeopleAltRounded,
  SettingsRounded,
  ShieldRounded,
  SpaceDashboardRounded,
  WbSunnyRounded,
  LogoutRounded,
} from '@mui/icons-material';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import ActivitiesPage from './pages/ActivitiesPage';
import ContentPage from './pages/ContentPage';
import LightRulesPage from './pages/LightRulesPage';
import LightTransactionsPage from './pages/LightTransactionsPage';
import AchievementsPage from './pages/AchievementsPage';
import LevelsPage from './pages/LevelsPage';
import StreakRulesPage from './pages/StreakRulesPage';
import NotificationsPage from './pages/NotificationsPage';
import SettingsPage from './pages/SettingsPage';
import AdhanPage from './pages/AdhanPage';
import LoginPage from './pages/LoginPage';
import { AuthProvider, useAuth } from './auth/AuthContext';

const theme = createTheme({
  direction: 'rtl',
  palette: {
    mode: 'dark',
    primary: { main: '#8b3a4d' },
    secondary: { main: '#d4a574' },
    success: { main: '#6ba584' },
    warning: { main: '#d4a574' },
    error: { main: '#a45a5a' },
    background: {
      default: '#0f0609',
      paper: '#1a0d14',
    },
    text: {
      primary: '#f5ede3',
      secondary: '#b89968',
    },
  },
  shape: { borderRadius: 16 },
  typography: {
    fontFamily: 'Amiri, serif',
    h1: { fontWeight: 700, letterSpacing: '-0.5px' },
    h2: { fontWeight: 700, letterSpacing: '-0.3px' },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700, fontSize: '1.5rem' },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    body1: { fontSize: '0.95rem', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', lineHeight: 1.5 },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '*::-webkit-scrollbar-track': {
          background: alpha('#d4a574', 0.08),
        },
        '*::-webkit-scrollbar-thumb': {
          background: alpha('#d4a574', 0.3),
          borderRadius: '4px',
          '&:hover': {
            background: alpha('#d4a574', 0.5),
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: `linear-gradient(135deg, ${alpha('#d4a574', 0.05)} 0%, transparent 50%)`,
          border: `1px solid ${alpha('#d4a574', 0.15)}`,
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: alpha('#d4a574', 0.25),
            boxShadow: `0 8px 32px ${alpha('#8b3a4d', 0.2)}`,
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          fontWeight: 700,
          textTransform: 'none',
          padding: '10px 24px',
          background: `linear-gradient(135deg, #d4a574 0%, #b89968 100%)`,
          color: '#1a0d14',
          border: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            background: `linear-gradient(135deg, #e8b88f 0%, #c9a878 100%)`,
            transform: 'translateY(-2px)',
            boxShadow: `0 12px 24px ${alpha('#d4a574', 0.3)}`,
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        outlined: {
          fontWeight: 600,
          borderColor: alpha('#d4a574', 0.5),
          color: '#d4a574',
          '&:hover': {
            borderColor: '#d4a574',
            backgroundColor: alpha('#d4a574', 0.1),
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: `linear-gradient(90deg, ${alpha('#1a0d14', 0.95)}, ${alpha('#2a1420', 0.95)})`,
          backdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${alpha('#d4a574', 0.12)}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: `linear-gradient(180deg, ${alpha('#8b3a4d', 0.15)} 0%, transparent 50%)`,
          borderLeft: `1px solid ${alpha('#d4a574', 0.12)}`,
          backdropFilter: 'blur(10px)',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          marginBottom: '8px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          color: '#b89968',
          '&:hover': {
            backgroundColor: alpha('#d4a574', 0.12),
            color: '#d4a574',
          },
          '&.Mui-selected': {
            backgroundColor: alpha('#d4a574', 0.2),
            color: '#d4a574',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: alpha('#d4a574', 0.3),
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          color: '#d4a574',
          fontWeight: 700,
          fontSize: '0.875rem',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          borderBottom: `1px solid ${alpha('#d4a574', 0.2)}`,
          padding: '16px 12px',
        },
        body: {
          borderBottom: `1px solid ${alpha('#d4a574', 0.08)}`,
          padding: '14px 12px',
          fontSize: '0.9rem',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.8rem',
        },
      },
    },
  },
});

// MUI mirrors Drawer transition directions in RTL layouts. Keep the drawer
// physically on the right, while always sliding it in from and out to the right.
const RightDrawerSlide = (props: React.ComponentProps<typeof Slide>) => (
  <Slide {...props} direction="left" />
);

const navItems = [
  ['لوحة التحكم', '/', <SpaceDashboardRounded />],
  ['المستخدمون', '/users', <PeopleAltRounded />],
  ['عجلة العبادات', '/activities', <EventAvailableRounded />],
  ['المحتوى العلمي', '/content', <MenuBookRounded />],
  ['نظام النور', '/light-rules', <AutoAwesomeRounded />],
  ['معاملات النور', '/light-transactions', <AnalyticsRounded />],
  ['الإنجازات', '/achievements', <EmojiEventsRounded />],
  ['المستويات', '/levels', <ShieldRounded />],
  ['مكافآت المواظبة', '/streak-rules', <WbSunnyRounded />],
  ['الإشعارات', '/notifications', <NotificationsRounded />],
  ['أصوات الأذان', '/adhan', <NotificationsRounded />],
  ['الإعدادات', '/settings', <SettingsRounded />],
] as const;

function ProtectedLayout() {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { session, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);

  useEffect(() => {
    setDrawerOpen(!isMobile);
  }, [isMobile]);

  if (!session) return <Navigate to="/login" replace />;

  const drawerWidth = 280;

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: 'background.default',
        backgroundImage: `
          radial-gradient(circle at 20% 50%, rgba(139, 58, 77, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(212, 165, 116, 0.08) 0%, transparent 40%)
        `,
      }}
    >
      {/* AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (t) => t.zIndex.drawer + 1,
          borderBottom: `1px solid ${alpha('#d4a574', 0.12)}`,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', py: 1.5 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Avatar
              sx={{
                bgcolor: 'secondary.main',
                color: '#1a0d14',
                fontWeight: 700,
                width: 40,
                height: 40,
                fontSize: '1.1rem',
              }}
            >
              {session.user.name.slice(0, 1)}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>
                {session.user.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                مدير النظام
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
            <Tooltip title={drawerOpen ? 'إخفاء القائمة الجانبية' : 'إظهار القائمة الجانبية'}>
              <IconButton
                color="secondary"
                onClick={() => setDrawerOpen((open) => !open)}
                sx={{ ml: 1, bgcolor: alpha('#d4a574', 0.08), '&:hover': { bgcolor: alpha('#d4a574', 0.15) } }}
              >
                <MenuRounded />
              </IconButton>
            </Tooltip>
            <Tooltip title="الوضع الداكن">
              <IconButton
                color="secondary"
                size="small"
                sx={{
                  '&:hover': { backgroundColor: alpha('#d4a574', 0.15) },
                }}
              >
                <DarkModeRounded fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="الإشعارات">
              <IconButton
                color="secondary"
                size="small"
                sx={{
                  '&:hover': { backgroundColor: alpha('#d4a574', 0.15) },
                }}
              >
                <NotificationsRounded fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="تسجيل الخروج">
              <IconButton
                color="secondary"
                size="small"
                onClick={logout}
                sx={{
                  '&:hover': { backgroundColor: alpha('#a45a5a', 0.15) },
                }}
              >
                <LogoutRounded fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        slots={{ transition: RightDrawerSlide }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            zIndex: (t) => t.zIndex.drawer,
          },
        }}
      >
        <Toolbar /> {/* Space for AppBar */}
        <Box sx={{ p: 3, overflow: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Logo Section */}
          <Box
            sx={{
              mb: 3.5,
              pb: 2.5,
              borderBottom: `1px solid ${alpha('#d4a574', 0.2)}`,
            }}
          >
            <Typography
              variant="h4"
              sx={{
                color: 'secondary.main',
                fontWeight: 800,
                fontSize: '1.75rem',
                letterSpacing: '-0.5px',
                mb: 0.5,
              }}
            >
              الصراط
            </Typography>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: '0.875rem', fontWeight: 500 }}
            >
              منصة الإدارة الروحية
            </Typography>
          </Box>

          {/* Navigation List */}
          <List disablePadding sx={{ flex: 1 }}>
            {navItems.map(([label, path, icon]) => (
              <ListItemButton
                key={path}
                component={Link}
                to={path}
                selected={location.pathname === path}
                sx={{
                  borderRadius: '12px',
                  mb: 1,
                  px: 2,
                  py: 1.5,
                  minHeight: '44px',
                  '&.Mui-selected': {
                    bgcolor: alpha('#d4a574', 0.25),
                    color: 'secondary.main',
                    fontWeight: 600,
                    '& .MuiListItemIcon-root': {
                      color: 'secondary.main',
                    },
                    '&:hover': {
                      bgcolor: alpha('#d4a574', 0.35),
                    },
                  },
                  '&:not(.Mui-selected):hover': {
                    bgcolor: alpha('#d4a574', 0.12),
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                  {icon}
                </ListItemIcon>
                <ListItemText>
                  <Typography component="span" sx={{ fontSize: '0.95rem', fontWeight: 500 }}>{label}</Typography>
                </ListItemText>
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { xs: '100%', md: drawerOpen ? `calc(100% - ${drawerWidth}px)` : '100%' },
          mr: { xs: 0, md: drawerOpen ? `${drawerWidth}px` : 0 },
          p: { xs: 1.5, sm: 2.5, md: 3 },
          minHeight: '100vh',
          transition: (t) => t.transitions.create(['width', 'margin-right'], { duration: t.transitions.duration.standard }),
          minWidth: 0,
          overflow: 'auto',
        }}
      >
        <Toolbar /> {/* Space for AppBar */}
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/content" element={<ContentPage />} />
          <Route path="/light-rules" element={<LightRulesPage />} />
          <Route path="/light-transactions" element={<LightTransactionsPage />} />
          <Route path="/achievements" element={<AchievementsPage />} />
          <Route path="/levels" element={<LevelsPage />} />
          <Route path="/streak-rules" element={<StreakRulesPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/adhan" element={<AdhanPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Box>
    </Box>
  );
}

function Root() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <Root />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
