import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useUserData } from './hooks/useUserData';
import AuthForm from './components/AuthForm';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import CheckIn from './components/CheckIn';
import TeamSync from './components/TeamSync';
import Settings from './components/Settings';
import History from './components/History';
import Journal from './components/Journal';
import MentoAI from './components/MentoAI';
import Navigation from './components/Navigation';

function App() {
  const { user: authUser, loading: authLoading, signOut } = useAuth();
  const { user, loading: userLoading, updateUser, addCheckIn, addJournalEntry, updateJournalEntry, deleteJournalEntry } = useUserData(authUser);
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'checkin' | 'team' | 'settings' | 'history' | 'journal' | 'mento'>('landing');

  const navigateTo = (view: 'landing' | 'dashboard' | 'checkin' | 'team' | 'settings' | 'history' | 'journal' | 'mento') => {
    setCurrentView(view);
  };

  const handleSignOut = async () => {
    await signOut();
    setCurrentView('landing');
  };

  // Show loading screen while checking authentication
  if (authLoading || (authUser && userLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F6F9FC] to-[#E6F0FF] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#A5E3D8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-inter text-[#334155]/70">Loading your mind sync...</p>
        </div>
      </div>
    );
  }

  // Show auth form if not authenticated
  if (!authUser) {
    return <AuthForm />;
  }

  // Show landing page if user data is not loaded yet
  if (!user) {
    return <LandingPage onNavigate={navigateTo} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'landing':
        return <LandingPage onNavigate={navigateTo} />;
      case 'dashboard':
        return <Dashboard user={user} />;
      case 'checkin':
        return <CheckIn user={user} onCheckIn={addCheckIn} onNavigate={navigateTo} />;
      case 'team':
        return <TeamSync onNavigate={navigateTo} />;
      case 'settings':
        return <Settings user={user} updateUser={updateUser} onNavigate={navigateTo} onSignOut={handleSignOut} />;
      case 'history':
        return <History user={user} onNavigate={navigateTo} />;
      case 'journal':
        return <Journal 
          user={user} 
          onAddEntry={addJournalEntry}
          onUpdateEntry={updateJournalEntry}
          onDeleteEntry={deleteJournalEntry}
          onNavigate={navigateTo} 
        />;
      case 'mento':
        return <MentoAI user={user} onNavigate={navigateTo} />;
      default:
        return <Dashboard user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F6F9FC] to-[#E6F0FF] relative overflow-hidden">
      {currentView !== 'landing' && (
        <Navigation 
          currentView={currentView} 
          onNavigate={navigateTo} 
          userMode={user.mode}
        />
      )}
      {renderView()}
    </div>
  );
}

export default App;