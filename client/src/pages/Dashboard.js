import React from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Welcome to your Dashboard, {user?.firstName}!</h1>
      <p>This is a placeholder dashboard. The full dashboard with progress tracking and analytics will be implemented next.</p>
    </div>
  );
};

export default Dashboard;