import * as React from 'react';
import { Brain, Users, Zap, Heart, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTeams } from '../hooks/useTeams';
import FloatingBlobs from './FloatingBlobs';

interface LandingPageProps {
  onNavigate: (view: 'dashboard' | 'team') => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { user: authUser } = useAuth();
  const { createTeam, joinTeam, joinTeamByInvite } = useTeams(authUser);
  const [showJoinModal, setShowJoinModal] = React.useState(false);
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [roomCodeInput, setRoomCodeInput] = React.useState('');
  const [teamNameInput, setTeamNameInput] = React.useState('');
  const [joinError, setJoinError] = React.useState('');
  const [createError, setCreateError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);

  // Check for invite link in URL
  React.useEffect(() => {
    const path = window.location.pathname;
    const inviteMatch = path.match(/\/invite\/([a-f0-9-]+)/);
    
    if (inviteMatch && authUser) {
      const teamId = inviteMatch[1];
      handleInviteJoin(teamId);
    }
  }, [authUser]);

  const handleInviteJoin = async (teamId: string) => {
    if (!authUser) return;

    setIsLoading(true);
    try {
      await joinTeamByInvite(teamId);
      // Clear the invite from URL
      window.history.replaceState({}, '', '/');
      onNavigate('team');
    } catch (error: any) {
      console.error('Error joining team via invite:', error);
      alert(error.message || 'Failed to join team via invite link');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!roomCodeInput.trim()) {
      setJoinError('Please enter a room code');
      return;
    }

    setIsLoading(true);
    setJoinError('');

    try {
      await joinTeam(roomCodeInput.trim());
      setShowJoinModal(false);
      setRoomCodeInput('');
      onNavigate('team');
    } catch (error: any) {
      setJoinError(error.message || 'Failed to join team');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!teamNameInput.trim()) {
      setCreateError('Please enter a team name');
      return;
    }

    setIsLoading(true);
    setCreateError('');

    try {
      await createTeam(teamNameInput.trim());
      setShowCreateModal(false);
      setTeamNameInput('');
      onNavigate('team');
    } catch (error: any) {
      setCreateError(error.message || 'Failed to create team');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <FloatingBlobs />
      
      {/* Hero Section */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-12 pt-20 pb-32">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <div className="p-4 bg-white/20 backdrop-blur-sm rounded-full border border-white/30">
              <Brain className="w-12 h-12 text-[#A5E3D8]" />
            </div>
          </div>
          
          <h1 className="font-sora font-semibold text-5xl sm:text-6xl lg:text-7xl text-[#334155] mb-6 tracking-tight leading-tight">
            Your Mind.<br />
            <span className="text-[#A5E3D8]">In Sync.</span>
          </h1>
          
          <p className="font-inter text-xl sm:text-2xl text-[#334155]/80 mb-12 max-w-2xl mx-auto leading-relaxed tracking-wide">
            Mento AI helps you stay emotionally aligned, mentally fit, and productive — solo or as a team.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => onNavigate('dashboard')}
              className="group bg-[#A5E3D8] text-[#334155] px-8 py-4 rounded-2xl font-inter font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-[#8DD3C7] hover:scale-105 flex items-center gap-2"
            >
              🧘 Start Solo
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => setShowCreateModal(true)}
              className="group bg-[#A5E3D8] text-[#334155] px-8 py-4 rounded-2xl font-inter font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-[#8DD3C7] hover:scale-105 flex items-center gap-2"
            >
              🧑‍🤝‍🧑 Create a Team Space
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => setShowJoinModal(true)}
              className="group bg-white/20 backdrop-blur-sm text-[#334155] px-8 py-4 rounded-2xl font-inter font-medium text-lg border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-105 flex items-center gap-2"
            >
              🤝 Join a Team Space
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
        
        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="bg-white/20 backdrop-blur-sm p-8 rounded-3xl border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-105">
            <div className="text-4xl mb-4">💭</div>
            <h3 className="font-sora font-semibold text-xl text-[#334155] mb-3">
              Daily mental check-ins that actually feel good
            </h3>
            <p className="font-inter text-[#334155]/70 leading-relaxed">
              Simple, non-judgmental ways to sync with your inner state
            </p>
          </div>
          
          <div className="bg-white/20 backdrop-blur-sm p-8 rounded-3xl border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-105">
            <div className="text-4xl mb-4">⚡</div>
            <h3 className="font-sora font-semibold text-xl text-[#334155] mb-3">
              Energy tracking without pressure
            </h3>
            <p className="font-inter text-[#334155]/70 leading-relaxed">
              Understand your natural rhythms and work with them
            </p>
          </div>
          
          <div className="bg-white/20 backdrop-blur-sm p-8 rounded-3xl border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-105">
            <div className="text-4xl mb-4">🤝</div>
            <h3 className="font-sora font-semibold text-xl text-[#334155] mb-3">
              Optional team mode to stay emotionally connected
            </h3>
            <p className="font-inter text-[#334155]/70 leading-relaxed">
              Build empathy and support within your team
            </p>
          </div>
        </div>
      </div>

      {/* Join Team Modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md flex flex-col gap-4">
            <h4 className="font-sora font-semibold text-lg text-[#334155]">Join a Team</h4>
            <p className="text-sm text-[#334155]/70">Enter the room code shared by your team</p>
            <input
              type="text"
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#A5E3D8] font-mono tracking-widest uppercase"
              placeholder="Enter room code"
              value={roomCodeInput}
              onChange={e => setRoomCodeInput(e.target.value.toUpperCase())}
              disabled={isLoading}
              maxLength={6}
            />
            {joinError && <div className="text-red-500 text-sm">{joinError}</div>}
            <div className="flex gap-2">
              <button
                className="bg-[#A5E3D8] text-[#334155] px-4 py-2 rounded-lg font-inter font-medium flex-1 hover:bg-[#8DD3C7] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleJoinTeam}
                disabled={isLoading}
              >
                {isLoading ? 'Joining...' : 'Join'}
              </button>
              <button
                className="bg-gray-200 text-[#334155] px-4 py-2 rounded-lg font-inter font-medium flex-1 hover:bg-gray-300 disabled:opacity-50"
                onClick={() => {
                  setShowJoinModal(false);
                  setRoomCodeInput('');
                  setJoinError('');
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md flex flex-col gap-4">
            <h4 className="font-sora font-semibold text-lg text-[#334155]">Create a Team</h4>
            <p className="text-sm text-[#334155]/70">Give your team a name to get started</p>
            <input
              type="text"
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#A5E3D8]"
              placeholder="Enter team name"
              value={teamNameInput}
              onChange={e => setTeamNameInput(e.target.value)}
              disabled={isLoading}
            />
            {createError && <div className="text-red-500 text-sm">{createError}</div>}
            <div className="flex gap-2">
              <button
                className="bg-[#A5E3D8] text-[#334155] px-4 py-2 rounded-lg font-inter font-medium flex-1 hover:bg-[#8DD3C7] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCreateTeam}
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Team'}
              </button>
              <button
                className="bg-gray-200 text-[#334155] px-4 py-2 rounded-lg font-inter font-medium flex-1 hover:bg-gray-300 disabled:opacity-50"
                onClick={() => {
                  setShowCreateModal(false);
                  setTeamNameInput('');
                  setCreateError('');
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;