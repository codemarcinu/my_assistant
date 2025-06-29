import { Dashboard } from '@/components/dashboard/Dashboard';
import { Suspense } from 'react';
import { Box, CircularProgress } from '@mui/material';

function DashboardLoader() {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #1e1e2e 0%, #262647 100%)',
      }}
    >
      <CircularProgress sx={{ color: '#3b82f6' }} />
    </Box>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoader />}>
      <div className="dashboard-container">
        <Dashboard />
      </div>
    </Suspense>
  );
} 