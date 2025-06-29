"use client";

import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard,
  CameraAlt,
  Kitchen,
  Analytics,
  LibraryBooks,
  Settings,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useRouter, usePathname } from 'next/navigation';

const drawerWidth = 240;

export function Sidebar() {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const router = useRouter();
  const pathname = usePathname();

  const menuItems = [
    {
      id: 'dashboard',
      path: '/dashboard',
      label: t('sidebar.dashboard'),
      icon: Dashboard,
      description: t('sidebar.dashboard_desc'),
    },
    {
      id: 'ocr',
      path: '/ocr',
      label: t('sidebar.ocr'),
      icon: CameraAlt,
      description: t('sidebar.ocr_desc'),
    },
    {
      id: 'pantry',
      path: '/pantry',
      label: t('sidebar.pantry'),
      icon: Kitchen,
      description: t('sidebar.pantry_desc'),
    },
    {
      id: 'analytics',
      path: '/analytics',
      label: t('sidebar.analytics'),
      icon: Analytics,
      description: t('sidebar.analytics_desc'),
    },
    {
      id: 'rag',
      path: '/rag',
      label: t('sidebar.rag'),
      icon: LibraryBooks,
      description: t('sidebar.rag_desc'),
    },
    {
      id: 'settings',
      path: '/settings',
      label: t('sidebar.settings'),
      icon: Settings,
      description: t('sidebar.settings_desc'),
    },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo sekcja */}
      <Box
        sx={{
          p: 3,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: { xs: 'none', md: 'block' },
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            textAlign: 'center',
          }}
        >
          Nawigacja
        </Typography>
      </Box>

      {/* Menu items */}
      <List sx={{ flex: 1, pt: 2 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  mx: 1,
                  mb: 0.5,
                  borderRadius: 2,
                  background: isActive
                    ? 'linear-gradient(90deg, #007AFF22 0%, #5856D622 100%)'
                    : 'transparent',
                  border: isActive ? '2px solid #007AFF' : 'none',
                  boxShadow: isActive ? '0 2px 8px 0 #007AFF33' : 'none',
                  transition: 'all 0.25s cubic-bezier(.4,2,.6,1)',
                  '&:hover': {
                    background: isActive
                      ? 'linear-gradient(90deg, #007AFF33 0%, #5856D633 100%)'
                      : 'rgba(255, 255, 255, 0.07)',
                    boxShadow: isActive ? '0 4px 16px 0 #007AFF44' : '0 2px 8px 0 #007AFF11',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? '#007AFF' : 'text.secondary',
                    minWidth: 40,
                  }}
                >
                  <Icon />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  secondary={item.description}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'text.primary' : 'text.primary',
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.75rem',
                    color: 'text.secondary',
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Status bar */}
      <Box
        sx={{
          p: 2,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(28, 28, 30, 0.5)',
        }}
      >
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            textAlign: 'center',
            display: 'block',
          }}
        >
          FoodSave AI v1.0
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: '#34C759',
            textAlign: 'center',
            display: 'block',
            mt: 0.5,
          }}
        >
          System Online
        </Typography>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: 'rgba(28, 28, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          background: 'rgba(28, 28, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
} 