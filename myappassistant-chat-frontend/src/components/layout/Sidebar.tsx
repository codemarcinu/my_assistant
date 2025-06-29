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

const drawerWidth = 240;

const menuItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Dashboard,
    description: 'Główna',
  },
  {
    id: 'ocr',
    label: 'OCR',
    icon: CameraAlt,
    description: 'Analiza paragonów',
  },
  {
    id: 'pantry',
    label: 'Pantry',
    icon: Kitchen,
    description: 'Zarządzanie spiżarnią',
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: Analytics,
    description: 'Analityka wydatków',
  },
  {
    id: 'rag',
    label: 'RAG Management',
    icon: LibraryBooks,
    description: 'Baza wiedzy',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    description: 'Ustawienia systemowe',
  },
];

interface SidebarProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

export function Sidebar({ activeSection = 'dashboard', onSectionChange }: SidebarProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleSectionChange = (section: string) => {
    onSectionChange?.(section);
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
          const isActive = activeSection === item.id;
          
          return (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                onClick={() => handleSectionChange(item.id)}
                sx={{
                  mx: 1,
                  mb: 0.5,
                  borderRadius: 2,
                  background: isActive
                    ? 'linear-gradient(45deg, rgba(0, 122, 255, 0.2) 30%, rgba(88, 86, 214, 0.2) 90%)'
                    : 'transparent',
                  border: isActive ? '1px solid rgba(0, 122, 255, 0.3)' : 'none',
                  '&:hover': {
                    background: isActive
                      ? 'linear-gradient(45deg, rgba(0, 122, 255, 0.3) 30%, rgba(88, 86, 214, 0.3) 90%)'
                      : 'rgba(255, 255, 255, 0.05)',
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