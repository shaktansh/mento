import React from 'react';
import { TrendingUp, Lightbulb, Leaf, Target, Calendar, Zap, Brain, Heart } from 'lucide-react';
import { User } from '../types';
import FloatingBlobs from './FloatingBlobs';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const getMoodEmoji = (mood: number) => {
    if (mood >= 8) return '😊';
    if (mood >= 6) return '🙂';
    if (mood >= 4) return '😐';
    if (mood >= 2) return '😕';
    return '😔';
  };

  const getWeeklyAverage = (data: any[], key: string) => {
    const recent = data.slice(-7);
    if (recent.length === 0) return 0;
    const avg = recent.reduce((sum, entry) => sum + entry[key], 0) / recent.length;
    return Math.round(avg * 10) / 10;
  };

  const getTrend = (data: any[], key: string) => {
    if (data.length < 4) return 'stable';
    
    const recent = data.slice(-3);
    const earlier = data.slice(-6, -3);
    
    if (recent.length === 0 || earlier.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((acc, entry) => acc + entry[key], 0) / recent.length;
    const earlierAvg = earlier.reduce((acc, entry) => acc + entry[key], 0) / earlier.length;
    
    if (recentAvg > earlierAvg + 0.5) return 'improving';
    if (recentAvg < earlierAvg - 0.5) return 'declining';
    return 'stable';
  };

  const getStreakDays = () => {
    if (user.moodHistory.length === 0) return 0;
    
    const today = new Date().toISOString().split('T')[0];
    let streak = 0;
    
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const hasEntry = user.moodHistory.some(entry => entry.date === dateStr);
      if (hasEntry) {
        streak++;
      } else if (dateStr !== today) {
        break;
      }
    }
    
    return streak;
  };

  const weeklyMoodAvg = getWeeklyAverage(user.moodHistory, 'mood');
  const weeklyEnergyAvg = getWeeklyAverage(user.energyHistory, 'energy');
  const moodTrend = getTrend(user.moodHistory, 'mood');
  const energyTrend = getTrend(user.energyHistory, 'energy');
  const streakDays = getStreakDays();

  const getInsightMessage = () => {
    if (user.moodHistory.length === 0 && user.energyHistory.length === 0) {
      return "Welcome to Mento! Start by doing your first check-in to begin tracking your mental wellness journey.";
    }
    
    const avgMood = weeklyMoodAvg;
    const avgEnergy = weeklyEnergyAvg;
    
    if (avgMood >= 8 && avgEnergy >= 8) {
      return "You're in an excellent flow state! Keep protecting your energy and mood patterns.";
    } else if (avgMood >= 7 && avgEnergy >= 7) {
      return "You're maintaining good balance. Consider what's working well for you.";
    } else if (avgMood < 6 || avgEnergy < 6) {
      return "Your patterns suggest you might benefit from some gentle self-care practices.";
    } else {
      return "You're doing well overall. Small adjustments could help optimize your wellbeing.";
    }
  };

  const getNudgeMessage = () => {
    if (user.moodHistory.length === 0) {
      return "Take your first check-in to start understanding your mental wellness patterns.";
    }
    
    const recentMood = user.lastCheckIn?.mood || weeklyMoodAvg;
    const recentEnergy = user.lastCheckIn?.energy || weeklyEnergyAvg;
    
    if (recentEnergy < 5) {
      return "Your energy seems low. Try a 5-minute walk or some deep breathing.";
    } else if (recentMood < 6) {
      return "Take a moment to acknowledge something you're grateful for today.";
    } else if (streakDays >= 7) {
      return "Amazing consistency! You've been checking in regularly. Keep it up!";
    } else {
      return "Consider setting aside 10 minutes for mindful reflection today.";
    }
  };

  const hasData = user.moodHistory.length > 0 || user.energyHistory.length > 0;

  return (
    <div className="relative min-h-screen lg:pl-72">
      <FloatingBlobs />
      
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 lg:pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-sora font-semibold text-3xl sm:text-4xl text-[#334155] mb-2">
            Welcome back, {user.name} 👋
          </h1>
          <p className="font-inter text-lg text-[#334155]/70">
            {hasData ? "Here's how your mind has been syncing lately" : "Ready to start your mental wellness journey?"}
          </p>
        </div>
        
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Current Mood */}
          <div className="bg-white/20 backdrop-blur-sm p-6 rounded-3xl border border-white/30 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <Brain className="w-6 h-6 text-[#A5E3D8]" />
              <div className="text-2xl">
                {hasData ? getMoodEmoji(user.lastCheckIn?.mood || weeklyMoodAvg) : '🤔'}
              </div>
            </div>
            <div className="text-2xl font-sora font-bold text-[#334155] mb-1">
              {hasData ? `${user.lastCheckIn?.mood || Math.round(weeklyMoodAvg)}/10` : '--'}
            </div>
            <p className="font-inter text-sm text-[#334155]/70">Current Mood</p>
          </div>
          
          {/* Energy Level */}
          <div className="bg-white/20 backdrop-blur-sm p-6 rounded-3xl border border-white/30 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <Zap className="w-6 h-6 text-[#FFF6B3]" />
              <div className="text-2xl">⚡</div>
            </div>
            <div className="text-2xl font-sora font-bold text-[#334155] mb-1">
              {hasData ? `${user.lastCheckIn?.energy || Math.round(weeklyEnergyAvg)}/10` : '--'}
            </div>
            <p className="font-inter text-sm text-[#334155]/70">Energy Level</p>
          </div>
          
          {/* Check-in Streak */}
          <div className="bg-white/20 backdrop-blur-sm p-6 rounded-3xl border border-white/30 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <Target className="w-6 h-6 text-[#D2F8D2]" />
              <div className="text-2xl">🔥</div>
            </div>
            <div className="text-2xl font-sora font-bold text-[#334155] mb-1">
              {streakDays}
            </div>
            <p className="font-inter text-sm text-[#334155]/70">Day Streak</p>
          </div>
          
          {/* Journal Entries */}
          <div className="bg-white/20 backdrop-blur-sm p-6 rounded-3xl border border-white/30 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <Calendar className="w-6 h-6 text-[#C2E7FF]" />
              <div className="text-2xl">📝</div>
            </div>
            <div className="text-2xl font-sora font-bold text-[#334155] mb-1">
              {user.journalEntries.length}
            </div>
            <p className="font-inter text-sm text-[#334155]/70">Journal Entries</p>
          </div>
        </div>

        {hasData ? (
          <>
            {/* Weekly Analysis */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Mood Analysis */}
              <div className="bg-white/20 backdrop-blur-sm p-8 rounded-3xl border border-white/30 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <Brain className="w-6 h-6 text-[#A5E3D8]" />
                  <h3 className="font-sora font-semibold text-xl text-[#334155]">Mood Analysis</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-inter text-[#334155]/70">7-day average</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{getMoodEmoji(weeklyMoodAvg)}</span>
                      <span className="font-sora font-bold text-[#A5E3D8]">{weeklyMoodAvg}/10</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-inter text-[#334155]/70">Trend</span>
                    <div className="flex items-center gap-2">
                      {moodTrend === 'improving' && <span className="text-green-500">📈 Improving</span>}
                      {moodTrend === 'declining' && <span className="text-orange-500">📉 Needs attention</span>}
                      {moodTrend === 'stable' && <span className="text-blue-500">➡️ Stable</span>}
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                    <div 
                      className="bg-gradient-to-r from-[#A5E3D8] to-[#8DD3C7] h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(weeklyMoodAvg / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Energy Analysis */}
              <div className="bg-white/20 backdrop-blur-sm p-8 rounded-3xl border border-white/30 shadow-lg">
                <div className="flex items-center gap-3 mb-6">
                  <Zap className="w-6 h-6 text-[#FFF6B3]" />
                  <h3 className="font-sora font-semibold text-xl text-[#334155]">Energy Analysis</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-inter text-[#334155]/70">7-day average</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">⚡</span>
                      <span className="font-sora font-bold text-[#F59E0B]">{weeklyEnergyAvg}/10</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-inter text-[#334155]/70">Trend</span>
                    <div className="flex items-center gap-2">
                      {energyTrend === 'improving' && <span className="text-green-500">📈 Improving</span>}
                      {energyTrend === 'declining' && <span className="text-orange-500">📉 Needs attention</span>}
                      {energyTrend === 'stable' && <span className="text-blue-500">➡️ Stable</span>}
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                    <div 
                      className="bg-gradient-to-r from-[#FFF6B3] to-[#F59E0B] h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(weeklyEnergyAvg / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Getting Started Section */
          <div className="bg-white/20 backdrop-blur-sm p-8 rounded-3xl border border-white/30 shadow-lg mb-8 text-center">
            <div className="text-6xl mb-6">🌱</div>
            <h3 className="font-sora font-semibold text-2xl text-[#334155] mb-4">
              Ready to start your journey?
            </h3>
            <p className="font-inter text-lg text-[#334155]/70 mb-6">
              Take your first check-in to begin understanding your mental wellness patterns and get personalized insights from Mento AI.
            </p>
          </div>
        )}
        
        {/* Insights & Recommendations */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* AI Insight */}
          <div className="bg-[#FFF6B3]/20 backdrop-blur-sm p-8 rounded-3xl border border-[#FFF6B3]/30 shadow-lg">
            <div className="flex items-start gap-3 mb-4">
              <Lightbulb className="w-6 h-6 text-[#F59E0B] mt-1" />
              <h3 className="font-sora font-semibold text-xl text-[#334155]">💡 {hasData ? 'Weekly Insight' : 'Getting Started'}</h3>
            </div>
            <p className="font-inter text-lg text-[#334155] leading-relaxed">
              {getInsightMessage()}
            </p>
          </div>
          
          {/* Gentle Nudge */}
          <div className="bg-[#D2F8D2]/20 backdrop-blur-sm p-8 rounded-3xl border border-[#D2F8D2]/30 shadow-lg">
            <div className="flex items-start gap-3 mb-4">
              <Heart className="w-6 h-6 text-[#22C55E] mt-1" />
              <h3 className="font-sora font-semibold text-xl text-[#334155]">🌱 Gentle Nudge</h3>
            </div>
            <p className="font-inter text-lg text-[#334155] leading-relaxed">
              {getNudgeMessage()}
            </p>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/20 backdrop-blur-sm p-8 rounded-3xl border border-white/30 shadow-lg">
          <h3 className="font-sora font-semibold text-xl text-[#334155] mb-6">📊 Recent Activity</h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Last Check-in */}
            <div className="text-center">
              <div className="text-3xl mb-2">
                {user.lastCheckIn ? getMoodEmoji(user.lastCheckIn.mood) : '🤔'}
              </div>
              <h4 className="font-sora font-semibold text-[#334155] mb-1">Last Check-in</h4>
              <p className="font-inter text-sm text-[#334155]/70">
                {user.lastCheckIn 
                  ? `${user.lastCheckIn.mood}/10 mood, ${user.lastCheckIn.energy}/10 energy`
                  : 'No check-ins yet'
                }
              </p>
            </div>
            
            {/* Recent Journal */}
            <div className="text-center">
              <div className="text-3xl mb-2">📖</div>
              <h4 className="font-sora font-semibold text-[#334155] mb-1">Latest Journal</h4>
              <p className="font-inter text-sm text-[#334155]/70">
                {user.journalEntries.length > 0 
                  ? user.journalEntries[0].title.substring(0, 30) + '...'
                  : 'No journal entries yet'
                }
              </p>
            </div>
            
            {/* Consistency */}
            <div className="text-center">
              <div className="text-3xl mb-2">🎯</div>
              <h4 className="font-sora font-semibold text-[#334155] mb-1">Consistency</h4>
              <p className="font-inter text-sm text-[#334155]/70">
                {streakDays > 0 
                  ? `${streakDays} day${streakDays > 1 ? 's' : ''} streak`
                  : 'Start your journey today'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;