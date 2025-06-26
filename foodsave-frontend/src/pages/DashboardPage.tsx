import React from 'react';
import ChatContainer from '../components/chat/ChatContainer';
import PageHeader from '../components/layout/PageHeader';
import PageFooter from '../components/layout/PageFooter';

export default function DashboardPage() {
  return (
    <div className="h-full flex flex-col">
      <PageHeader 
        title="Czat AI" 
        subtitle="Inteligentny asystent do zarządzania produktami i planowania posiłków"
      />

      {/* Chat Container */}
      <div className="flex-1 p-6">
        <div className="h-full max-w-4xl mx-auto">
          <ChatContainer />
        </div>
      </div>

      <PageFooter />
    </div>
  );
} 