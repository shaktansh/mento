import * as React from 'react';
import { ArrowLeft, TrendingUp, Heart, UserPlus, Copy, Users, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTeams } from '../hooks/useTeams';
import FloatingBlobs from './FloatingBlobs';

interface TeamSyncProps {
  onNavigate: (view: 'dashboard') => void;
}

const TeamSync: React.FC<TeamSyncProps> = ({ onNavigate }) => {
  const { user: authUser } = useAuth();
  const { teams, currentTeam, loading, setCurrentTeam, leaveTeam } = useTeams(authUser);
  const [showInviteModal, setShowInviteModal] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const getMoodEmoji = (mood: number) => {
    if (mood >= 8) return '😊';
    if (mood >= 6) return '🙂';
    if (mood >= 4) return '😐';
    if (mood >= 2) return '😕';
    return '😔';
  };

  const copyRoomCode = async () => {
    if (!currentTeam) return;
    
    try {
      await navigator.clipboard.writeText(currentTeam.room_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy room code:', error);
    }
  };

  const handleLeaveTeam = async () => {
    if (!currentTeam) return;
    
    if (confirm('Are you sure you want to leave this team?')) {
      try {
        await leaveTeam(currentTeam.id);
        if (teams.length > 1) {
          setCurrentTeam(teams.find(t => t.id !== currentTeam.id) || null);
        } else {
          onNavigate('dashboard');
        }
      } catch (error) {
        console.error('Error leaving team:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen lg:pl-72">
        <FloatingBlobs />
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-[#A5E3D8] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="font-inter text-[#334155]/70">Loading your teams...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentTeam) {
    return (
      <div className="relative min-h-screen lg:pl-72">
        <FloatingBlobs />
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="bg-white/20 backdrop-blur-sm p-12 rounded-3xl border border-white/30 shadow-xl text-center max-w-md mx-auto">
            <div className="text-6xl mb-6">🤝</div>
            <h2 className="font-sora font-semibold text-2xl text-[#334155] mb-4">
              No Teams Yet
            </h2>
            <p className="font-inter text-lg text-[#334155]/80 mb-6">
              Create or join a team to start collaborating on wellness together.
            </p>
            <button 
              onClick={() => onNavigate('dashboard')}
              className="bg-[#A5E3D8] text-[#334155] px-6 py-3 rounded-2xl font-inter font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-[#8DD3C7] hover:scale-105"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mock team member data with mood/energy for demo
  const mockMembers = currentTeam.members.map((member, index) => ({
    ...member,
    mood: 7 + (index % 3),
    energy: 6 + (index % 4),
    status: ['focused', 'calm', 'energized', 'burnout'][index % 4]
  }));

  const avgMood = Math.round(mockMembers.reduce((sum, member) => sum + member.mood, 0) / mockMembers.length);
  const energySync = Math.round((mockMembers.filter(m => m.energy >= 6).length / mockMembers.length) * 100);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'calm': return 'bg-[#C2E7FF]/20 border-[#C2E7FF]/30';
      case 'focused': return 'bg-[#D2F8D2]/20 border-[#D2F8D2]/30';
      case 'burnout': return 'bg-[#FFDBD3]/20 border-[#FFDBD3]/30';
      case 'energized': return 'bg-[#FFF6B3]/20 border-[#FFF6B3]/30';
      default: return 'bg-white/20 border-white/30';
    }
  };

  const isOwner = currentTeam.members.find(m => m.user_id === authUser?.id)?.role === 'owner';

  return (
    <div className="relative min-h-screen lg:pl-72">
      <FloatingBlobs />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 lg:pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button 
              onClick={() => onNavigate('dashboard')}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-105 mr-4 lg:hidden"
            >
              <ArrowLeft className="w-5 h-5 text-[#334155]" />
            </button>
            <div>
              <h1 className="font-sora font-semibold text-3xl text-[#334155] mb-2">
                Team Pulse – {currentTeam.name}
              </h1>
              <p className="font-inter text-lg text-[#334155]/70">
                Stay connected with your team's wellbeing
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="font-mono text-xs text-[#334155]/60 block">Room Code:</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg bg-white/40 px-3 py-1 rounded-lg text-[#334155] tracking-widest select-all">
                  {currentTeam.room_code}
                </span>
                <button
                  onClick={copyRoomCode}
                  className="p-2 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 hover:bg-white/30 transition-all duration-300"
                  title="Copy room code"
                >
                  <Copy className="w-4 h-4 text-[#334155]" />
                </button>
              </div>
              {copied && <span className="text-xs text-green-600">Copied!</span>}
            </div>
          </div>
        </div>

        {/* Team Selection */}
        {teams.length > 1 && (
          <div className="bg-white/20 backdrop-blur-sm p-6 rounded-3xl border border-white/30 shadow-lg mb-8">
            <h3 className="font-sora font-semibold text-lg text-[#334155] mb-4">Your Teams</h3>
            <div className="flex flex-wrap gap-3">
              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => setCurrentTeam(team)}
                  className={`px-4 py-2 rounded-2xl font-inter font-medium transition-all duration-300 ${
                    currentTeam.id === team.id
                      ? 'bg-[#A5E3D8] text-[#334155] shadow-md'
                      : 'bg-white/30 text-[#334155]/70 hover:bg-white/50'
                  }`}
                >
                  {team.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Key Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/20 backdrop-blur-sm p-6 rounded-3xl border border-white/30 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🌡️</span>
              <h3 className="font-sora font-semibold text-lg text-[#334155]">Avg Team Mood</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-3xl">{getMoodEmoji(avgMood)}</span>
              <span className="text-2xl font-sora font-bold text-[#A5E3D8]">{avgMood}/10</span>
            </div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm p-6 rounded-3xl border border-white/30 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">⚡</span>
              <h3 className="font-sora font-semibold text-lg text-[#334155]">Energy Sync</h3>
            </div>
            <div className="text-2xl font-sora font-bold text-[#A5E3D8]">{energySync}%</div>
          </div>

          <div className="bg-white/20 backdrop-blur-sm p-6 rounded-3xl border border-white/30 shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-6 h-6 text-[#A5E3D8]" />
              <h3 className="font-sora font-semibold text-lg text-[#334155]">Team Size</h3>
            </div>
            <div className="text-2xl font-sora font-bold text-[#A5E3D8]">{currentTeam.members.length}</div>
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-white/20 backdrop-blur-sm p-8 rounded-3xl border border-white/30 shadow-lg mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-sora font-semibold text-xl text-[#334155]">Team Vibe</h3>
            <button
              onClick={() => setShowInviteModal(true)}
              className="group bg-[#A5E3D8] text-[#334155] px-4 py-2 rounded-2xl font-inter font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-[#8DD3C7] hover:scale-105 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Invite
            </button>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {mockMembers.map((member, index) => (
              <div key={member.id} className={`p-4 rounded-2xl border backdrop-blur-sm ${getStatusColor(member.status)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-inter font-medium text-[#334155]">{member.user.name}</h4>
                      {member.role === 'owner' && (
                        <span className="text-xs bg-[#A5E3D8]/30 text-[#334155] px-2 py-1 rounded-full">Owner</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#334155]/70">
                      <span>Mood: {getMoodEmoji(member.mood)} {member.mood}</span>
                      <span>•</span>
                      <span>Energy: ⚡ {member.energy}</span>
                    </div>
                  </div>
                  <div className="capitalize text-sm px-3 py-1 bg-white/30 rounded-full font-inter">
                    {member.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team Actions */}
        <div className="bg-[#C2E7FF]/20 backdrop-blur-sm p-8 rounded-3xl border border-[#C2E7FF]/30 shadow-lg mb-8">
          <h3 className="font-sora font-semibold text-xl text-[#334155] mb-4">Team Nudge</h3>
          <p className="font-inter text-lg text-[#334155] mb-6">
            {energySync < 50 
              ? "Low energy detected. Consider a team break or async check-in."
              : "Team energy is good! Great time for collaboration."
            }
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="group bg-[#A5E3D8] text-[#334155] px-6 py-3 rounded-2xl font-inter font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-[#8DD3C7] hover:scale-105 flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Send Gratitude
            </button>
            
            {!isOwner && (
              <button
                onClick={handleLeaveTeam}
                className="group bg-white/30 text-[#334155] px-6 py-3 rounded-2xl font-inter font-medium border border-white/30 hover:bg-white/50 transition-all duration-300 hover:scale-105 flex items-center gap-2"
              >
                Leave Team
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md flex flex-col gap-4">
            <h4 className="font-sora font-semibold text-lg text-[#334155]">Invite to {currentTeam.name}</h4>
            <p className="text-sm text-[#334155]/70">
              Share this room code with your team members:
            </p>
            <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
              <span className="font-mono text-lg tracking-widest flex-1 text-center">
                {currentTeam.room_code}
              </span>
              <button
                onClick={copyRoomCode}
                className="p-2 bg-[#A5E3D8] text-[#334155] rounded-lg hover:bg-[#8DD3C7] transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#334155]/60">
              Team members can join by entering this code in "Join a Team Space"
            </p>
            <button
              className="bg-[#A5E3D8] text-[#334155] px-4 py-2 rounded-lg font-inter font-medium hover:bg-[#8DD3C7]"
              onClick={() => setShowInviteModal(false)}
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamSync;