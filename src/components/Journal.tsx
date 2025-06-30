import React, { useState } from 'react';
import { ArrowLeft, Plus, Search, Calendar, Tag, Trash2, Edit3 } from 'lucide-react';
import { User, JournalEntry } from '../types';
import FloatingBlobs from './FloatingBlobs';

interface JournalProps {
  user: User;
  onAddEntry: (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => Promise<void>;
  onUpdateEntry: (entryId: string, updates: Partial<JournalEntry>) => Promise<void>;
  onDeleteEntry: (entryId: string) => Promise<void>;
  onNavigate: (view: 'dashboard') => void;
}

const Journal: React.FC<JournalProps> = ({ user, onAddEntry, onUpdateEntry, onDeleteEntry, onNavigate }) => {
  const [isWriting, setIsWriting] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState(7);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableTags = ['Gratitude', 'Reflection', 'Goals', 'Challenges', 'Growth', 'Relationships', 'Work', 'Health'];

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

  const handleSave = async () => {
    if (!title.trim() || !content.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (editingEntry) {
        await onUpdateEntry(editingEntry.id, {
          title: title.trim(),
          content: content.trim(),
          mood,
          tags: selectedTags,
        });
      } else {
        await onAddEntry({
          title: title.trim(),
          content: content.trim(),
          mood,
          tags: selectedTags,
        });
      }

      // Reset form
      setTitle('');
      setContent('');
      setMood(7);
      setSelectedTags([]);
      setIsWriting(false);
      setEditingEntry(null);
    } catch (error) {
      console.error('Error saving journal entry:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setTitle(entry.title);
    setContent(entry.content);
    setMood(entry.mood);
    setSelectedTags(entry.tags);
    setIsWriting(true);
  };

  const handleDelete = async (entryId: string) => {
    if (confirm('Are you sure you want to delete this journal entry?')) {
      try {
        await onDeleteEntry(entryId);
      } catch (error) {
        console.error('Error deleting journal entry:', error);
      }
    }
  };

  const filteredEntries = user.journalEntries.filter(entry =>
    entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isWriting) {
    return (
      <div className="relative min-h-screen lg:pl-72">
        <FloatingBlobs />
        
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-24 lg:pb-8">
          {/* Header */}
          <div className="flex items-center mb-8">
            <button 
              onClick={() => {
                setIsWriting(false);
                setEditingEntry(null);
                setTitle('');
                setContent('');
                setMood(7);
                setSelectedTags([]);
              }}
              className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30 hover:bg-white/30 transition-all duration-300 hover:scale-105 mr-4"
            >
              <ArrowLeft className="w-5 h-5 text-[#334155]" />
            </button>
            <div>
              <h1 className="font-sora font-semibold text-3xl text-[#334155] mb-2">
                {editingEntry ? 'Edit Entry' : 'New Journal Entry'}
              </h1>
              <p className="font-inter text-[#334155]/70">
                Capture your thoughts and reflections
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Title */}
            <div className="bg-white/20 backdrop-blur-sm p-6 rounded-3xl border border-white/30 shadow-lg">
              <label className="block font-inter font-medium text-[#334155] mb-3">Title</label>
              <input 
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's on your mind today?"
                className="w-full p-4 bg-white/50 border border-white/30 rounded-2xl font-inter text-[#334155] placeholder-[#334155]/50 focus:outline-none focus:ring-2 focus:ring-[#A5E3D8]/50"
              />
            </div>

            {/* Mood */}
            <div className="bg-white/20 backdrop-blur-sm p-6 rounded-3xl border border-white/30 shadow-lg">
              <label className="block font-inter font-medium text-[#334155] mb-3">How are you feeling?</label>
              <div className="text-center mb-4">
                <div className="text-6xl mb-2">{getMoodEmoji(mood)}</div>
                <div className="text-xl font-sora font-bold text-[#A5E3D8]">{mood}/10</div>
              </div>
              <input 
                type="range" 
                min="1" 
                max="10" 
                value={mood}
                onChange={(e) => setMood(parseInt(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>

            {/* Content */}
            <div className="bg-white/20 backdrop-blur-sm p-6 rounded-3xl border border-white/30 shadow-lg">
              <label className="block font-inter font-medium text-[#334155] mb-3">Your thoughts</label>
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write about your day, feelings, insights, or anything that comes to mind..."
                className="w-full p-4 bg-white/50 border border-white/30 rounded-2xl font-inter text-[#334155] placeholder-[#334155]/50 focus:outline-none focus:ring-2 focus:ring-[#A5E3D8]/50 resize-none"
                rows={8}
              />
            </div>

            {/* Tags */}
            <div className="bg-white/20 backdrop-blur-sm p-6 rounded-3xl border border-white/30 shadow-lg">
              <label className="block font-inter font-medium text-[#334155] mb-3">Tags</label>
              <div className="flex flex-wrap gap-3">
                {availableTags.map((tag) => (
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

            {/* Save Button */}
            <div className="text-center">
              <button 
                onClick={handleSave}
                disabled={!title.trim() || !content.trim() || isSubmitting}
                className="group bg-[#A5E3D8] text-[#334155] px-12 py-4 rounded-2xl font-inter font-medium text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-[#8DD3C7] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isSubmitting ? 'Saving...' : editingEntry ? '✏️ Update Entry' : '💾 Save Entry'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                Your Journal
              </h1>
              <p className="font-inter text-lg text-[#334155]/70">
                Document your thoughts and track your growth
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => setIsWriting(true)}
            className="group bg-[#A5E3D8] text-[#334155] px-6 py-3 rounded-2xl font-inter font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-[#8DD3C7] hover:scale-105 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Entry
          </button>
        </div>

        {/* Search */}
        <div className="bg-white/20 backdrop-blur-sm p-6 rounded-3xl border border-white/30 shadow-lg mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#334155]/50" />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search your entries..."
              className="w-full pl-12 pr-4 py-4 bg-white/50 border border-white/30 rounded-2xl font-inter text-[#334155] placeholder-[#334155]/50 focus:outline-none focus:ring-2 focus:ring-[#A5E3D8]/50"
            />
          </div>
        </div>

        {/* Entries */}
        <div className="space-y-6">
          {filteredEntries.length === 0 ? (
            <div className="bg-white/20 backdrop-blur-sm p-12 rounded-3xl border border-white/30 shadow-lg text-center">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="font-sora font-semibold text-xl text-[#334155] mb-2">
                {user.journalEntries.length === 0 ? 'Start Your Journey' : 'No entries found'}
              </h3>
              <p className="font-inter text-[#334155]/70 mb-6">
                {user.journalEntries.length === 0 
                  ? 'Begin documenting your thoughts, feelings, and insights.'
                  : 'Try adjusting your search terms.'
                }
              </p>
              {user.journalEntries.length === 0 && (
                <button 
                  onClick={() => setIsWriting(true)}
                  className="bg-[#A5E3D8] text-[#334155] px-8 py-3 rounded-2xl font-inter font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:bg-[#8DD3C7] hover:scale-105"
                >
                  Write First Entry
                </button>
              )}
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div key={entry.id} className="bg-white/20 backdrop-blur-sm p-8 rounded-3xl border border-white/30 shadow-lg hover:bg-white/30 transition-all duration-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-sora font-semibold text-xl text-[#334155] mb-2">
                      {entry.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-[#334155]/70 mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {entry.timestamp.toLocaleDateString('en-US', { 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-lg">{getMoodEmoji(entry.mood)}</span>
                        {entry.mood}/10
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(entry)}
                      className="p-2 bg-white/30 rounded-xl hover:bg-white/50 transition-all duration-300"
                    >
                      <Edit3 className="w-4 h-4 text-[#334155]" />
                    </button>
                    <button 
                      onClick={() => handleDelete(entry.id)}
                      className="p-2 bg-[#FFDBD3]/30 rounded-xl hover:bg-[#FFDBD3]/50 transition-all duration-300"
                    >
                      <Trash2 className="w-4 h-4 text-[#334155]" />
                    </button>
                  </div>
                </div>
                
                <p className="font-inter text-[#334155] leading-relaxed mb-4 line-clamp-3">
                  {entry.content}
                </p>
                
                {entry.tags.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#334155]/50" />
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag) => (
                        <span 
                          key={tag}
                          className="px-3 py-1 bg-[#A5E3D8]/30 text-[#334155] rounded-full text-sm font-inter"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Journal;