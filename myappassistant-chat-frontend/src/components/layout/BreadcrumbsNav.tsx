"use client";

import React from "react";
import MuiBreadcrumbs from "@mui/material/Breadcrumbs";
import Link from "next/link";
import Typography from "@mui/material/Typography";
import { usePathname } from "next/navigation";
import { useTheme } from "@mui/material/styles";
import NavigateNextIcon from '@mui/icons-material/NavigateNext';

const PATH_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  settings: "Ustawienia",
  ocr: "OCR",
  pantry: "Spiżarnia",
  promotions: "Promocje",
  analytics: "Analityka",
  rag: "RAG",
};

export function BreadcrumbsNav() {
  const pathname = usePathname() || "";
  const theme = useTheme();
  const pathParts = pathname.split("/").filter(Boolean);

  if (pathParts.length === 0) return null;

  const linkColor = theme.palette.mode === 'dark' ? '#007AFF' : '#1976d2';
  const textColor = theme.palette.text.primary;

  let href = "";
  return (
    <MuiBreadcrumbs 
      separator={<NavigateNextIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />} 
      aria-label="breadcrumbs" 
      sx={{ mb: 2 }}
    >
      <Link 
        href="/dashboard" 
        style={{ 
          textDecoration: "none", 
          color: linkColor, 
          fontWeight: 600,
        }}
      >
        Dashboard
      </Link>
      {pathParts.map((part, idx) => {
        href += `/${part}`;
        const isLast = idx === pathParts.length - 1;
        const label = PATH_LABELS[part] || part;
        
        return isLast ? (
          <Typography 
            key={href} 
            color={textColor} 
            fontWeight={600}
          >
            {label}
          </Typography>
        ) : (
          <Link 
            key={href} 
            href={href} 
            style={{ 
              textDecoration: "none", 
              color: linkColor,
            }}
          >
            {label}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
} 