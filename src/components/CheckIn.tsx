import React, { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';
import { User, CheckInData } from '../types';
import FloatingBlobs from './FloatingBlobs';

interface CheckInProps {
  user: User;
  onCheckIn: (checkInData: CheckInData) => Promise<void>;
  onNavigate: (view: 'dashboard') => void;
}

const CheckIn: React.FC<CheckInProps> = ({ user, onCheckIn, onNavigate }) => {
  const [mood, setMood] = useState<number>(7);
  const [energy, setEnergy] = useState<number>(7);
  const [notes, setNotes] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const moodEmojis = ['😔', '😕', '😐', '🙂', '😊'];
  const tags = ['Work', 'Personal', 'Health', 'Focus', 'Social'];

  const getMoodEmoji = (moodValue: number) => {
    if (moodValue <= 2) return '😔';
    if (moodValue <= 4) return '😕';
    if (moodValue <= 6) return '😐';
    if (moodValue <= 8) return '🙂';
    return '😊';
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const checkInData: CheckInData = {
        mood,
        energy,
        notes: notes.trim() || undefined,
        tags: selectedTags,
        timestamp: new Date()
      };

      await onCheckIn(checkInData);
      setIsSubmitted(true);

      // Auto navigate back after showing success message
      setTimeout(() => {
        onNavigate('dashboard');
      }, 2000);
    } catch (error) {
      console.error('Error submitting check-in:', error);
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="relative min-h-screen lg:pl-72">
        <FloatingBlobs />
        <div className="relative z-10 flex items-center justify-center min-h-screen px-4">
          <div className="bg-white/20 backdrop-blur-sm p-12 rounded-3xl border border-white/30 shadow-xl text-center max-w-md mx-auto animate-pulse">
            <div className="text-6xl mb-6">✨</div>
            <h2 className="font-sora font-semibold text-2xl text-[#334155] mb-4">
              You've synced your mind
            </h2>
            <p className="font-inter text-lg text-[#334155]/80">
              Well done 💙
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen lg:pl-72">
      <FloatingBlobs />
      
      <div className="relative z-10 max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 lg:pb-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button 
            onClick={() => onNavigate('dashboard')}
            className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-105 mr-4 lg:hidden"
          >
            <ArrowLeft className="w-5 h-5 text-[#334155]" />
          </button>
          <div>
            <h1 className="font-sora font-semibold text-3xl text-[#334155] mb-2">
              How's your mind today?
            </h1>
            <p className="font-inter text-[#334155]/70">
              Take a moment to sync with yourself
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Step 1: Mood Selector */}
          <div className="bg-white/20 backdrop-blur-sm p-8 rounded-3xl border border-white/30 shadow-lg">
            <h3 className="font-sora font-semibold text-xl text-[#334155] mb-6">
              1. How are you feeling?
            </h3>
            
            <div className="text-center mb-6">
              <div className="text-8xl mb-4">{getMoodEmoji(mood)}</div>
              <div className="text-2xl font-sora font-bold text-[#A5E3D8]">{mood}/10</div>
            </div>
            
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={mood}
              onChange={(e) => setMood(parseInt(e.target.value))}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-sm text-[#334155]/60 mt-2">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          {/* Step 2: Energy Level */}
          <div className="bg-white/20 backdrop-blur-sm p-8 rounded-3xl border border-white/30 shadow-lg">
            <h3 className="font-sora font-semibold text-xl text-[#334155] mb-6">
              2. Energy level (1–10)
            </h3>
            
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚡</div>
              <div className="text-2xl font-sora font-bold text-[#A5E3D8]">{energy}/10</div>
            </div>
            
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={energy}
              onChange={(e) => setEnergy(parseInt(e.target.value))}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-sm text-[#334155]/60 mt-2">
              <span>Drained</span>
              <span>Energized</span>
            </div>
          </div>

          {/* Step 3: Optional Notes */}
          <div className="bg-white/20 backdrop-blur-sm p-8 rounded-3xl border border-white/30 shadow-lg">
            <h3 className="font-sora font-semibold text-xl text-[#334155] mb-6">
              3. What's on your mind? (optional)
            </h3>
            
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Share any thoughts, feelings, or reflections..."
              className="w-full p-4 bg-white/50 border border-white/30 rounded-2xl font-inter text-[#334155] placeholder-[#334155]/50 focus:outline-none focus:ring-2 focus:ring-[#A5E3D8]/50 resize-none"
              rows={4}
            />
          </div>

          {/* Step 4: Tags */}
          <div className="bg-white/20 backdrop-blur-sm p-8 rounded-3xl border border-white/30 shadow-lg">
            <h3 className="font-sora font-semibold text-xl text-[#334155] mb-6">
              4. Tag this check-in
            </h3>
            
            <div className="flex flex-wrap gap-3">
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-2xl font-inter font-medium transition-all duration-300 ${
                    selectedTags.includes(tag)
                      ? 'bg-[#A5E3D8] text-[#334155] shadow-md'
                      : 'bg-white/30 text-[#334155]/70 hover:bg-white/50'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="group bg-[#A5E3D8] text-[#334155] px-12 py-6 rounded-2xl font-inter font-medium text-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-[#8DD3C7] hover:scale-105 flex items-center gap-3 mx-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Check className="w-6 h-6" />
              {isSubmitting ? 'Syncing...' : 'Sync My State'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckIn;