import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User as UserType, MoodEntry, EnergyEntry, CheckInData, JournalEntry } from '../types';

export function useUserData(authUser: User | null) {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    loadUserData();
  }, [authUser]);

  const loadUserData = async () => {
    if (!authUser) return;

    try {
      // Load user profile - use limit(1) instead of single() to avoid error when no rows exist
      const { data: profiles } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .limit(1);

      let profile = profiles?.[0];

      // If no profile exists, create a default one
      if (!profile) {
        const defaultName = authUser.email?.split('@')[0] || 'User';
        
        const { data: newProfile, error } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            name: defaultName,
            mode: 'solo',
            daily_reminder_time: '09:00'
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating user profile:', error);
          setLoading(false);
          return;
        }

        profile = newProfile;
      }

      // Load mood history
      const { data: moodEntries } = await supabase
        .from('mood_entries')
        .select('*')
        .eq('user_id', authUser.id)
        .order('date', { ascending: true });

      // Load energy history
      const { data: energyEntries } = await supabase
        .from('energy_entries')
        .select('*')
        .eq('user_id', authUser.id)
        .order('date', { ascending: true });

      // Load latest check-in
      const { data: checkIns } = await supabase
        .from('check_ins')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(1);

      // Load journal entries
      const { data: journalEntries } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });

      const userData: UserType = {
        name: profile.name,
        mode: profile.mode,
        dailyReminderTime: profile.daily_reminder_time,
        lastCheckIn: checkIns?.[0] ? {
          mood: checkIns[0].mood,
          energy: checkIns[0].energy,
          notes: checkIns[0].notes || undefined,
          tags: checkIns[0].tags || [],
          timestamp: new Date(checkIns[0].created_at)
        } : null,
        moodHistory: moodEntries?.map(entry => ({
          date: entry.date,
          mood: entry.mood
        })) || [],
        energyHistory: energyEntries?.map(entry => ({
          date: entry.date,
          energy: entry.energy
        })) || [],
        journalEntries: journalEntries?.map(entry => ({
          id: entry.id,
          title: entry.title,
          content: entry.content,
          mood: entry.mood,
          tags: entry.tags || [],
          timestamp: new Date(entry.created_at)
        })) || []
      };

      setUser(userData);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (updates: Partial<UserType>) => {
    if (!authUser || !user) return;

    try {
      // Update user profile
      if (updates.name || updates.mode || updates.dailyReminderTime) {
        await supabase
          .from('users')
          .update({
            name: updates.name,
            mode: updates.mode,
            daily_reminder_time: updates.dailyReminderTime,
          })
          .eq('id', authUser.id);
      }

      // Update local state
      setUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const addCheckIn = async (checkInData: CheckInData) => {
    if (!authUser) return;

    try {
      const today = new Date().toISOString().split('T')[0];

      // Insert check-in
      await supabase
        .from('check_ins')
        .insert({
          user_id: authUser.id,
          mood: checkInData.mood,
          energy: checkInData.energy,
          notes: checkInData.notes,
          tags: checkInData.tags,
        });

      // Insert or update mood entry for today
      const { data: existingMood } = await supabase
        .from('mood_entries')
        .select('id')
        .eq('user_id', authUser.id)
        .eq('date', today)
        .single();

      if (existingMood) {
        await supabase
          .from('mood_entries')
          .update({ mood: checkInData.mood })
          .eq('id', existingMood.id);
      } else {
        await supabase
          .from('mood_entries')
          .insert({
            user_id: authUser.id,
            mood: checkInData.mood,
            date: today,
          });
      }

      // Insert or update energy entry for today
      const { data: existingEnergy } = await supabase
        .from('energy_entries')
        .select('id')
        .eq('user_id', authUser.id)
        .eq('date', today)
        .single();

      if (existingEnergy) {
        await supabase
          .from('energy_entries')
          .update({ energy: checkInData.energy })
          .eq('id', existingEnergy.id);
      } else {
        await supabase
          .from('energy_entries')
          .insert({
            user_id: authUser.id,
            energy: checkInData.energy,
            date: today,
          });
      }

      // Reload user data
      await loadUserData();
    } catch (error) {
      console.error('Error adding check-in:', error);
    }
  };

  const addJournalEntry = async (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => {
    if (!authUser) return;

    try {
      await supabase
        .from('journal_entries')
        .insert({
          user_id: authUser.id,
          title: entry.title,
          content: entry.content,
          mood: entry.mood,
          tags: entry.tags,
        });

      // Reload user data
      await loadUserData();
    } catch (error) {
      console.error('Error adding journal entry:', error);
    }
  };

  const updateJournalEntry = async (entryId: string, updates: Partial<JournalEntry>) => {
    if (!authUser) return;

    try {
      await supabase
        .from('journal_entries')
        .update({
          title: updates.title,
          content: updates.content,
          mood: updates.mood,
          tags: updates.tags,
        })
        .eq('id', entryId)
        .eq('user_id', authUser.id);

      // Reload user data
      await loadUserData();
    } catch (error) {
      console.error('Error updating journal entry:', error);
    }
  };

  const deleteJournalEntry = async (entryId: string) => {
    if (!authUser) return;

    try {
      await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', authUser.id);

      // Reload user data
      await loadUserData();
    } catch (error) {
      console.error('Error deleting journal entry:', error);
    }
  };

  return {
    user,
    loading,
    updateUser,
    addCheckIn,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    refreshData: loadUserData,
  };
}