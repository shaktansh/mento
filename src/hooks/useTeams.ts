import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface Team {
  id: string;
  name: string;
  room_code: string;
  created_by: string;
  created_at: string;
  members: TeamMember[];
}

export interface TeamMember {
  id: string;
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
  user: {
    name: string;
  };
}

export function useTeams(authUser: User | null) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authUser) {
      setTeams([]);
      setCurrentTeam(null);
      setLoading(false);
      return;
    }

    loadUserTeams();
  }, [authUser]);

  const loadUserTeams = async () => {
    if (!authUser) return;

    try {
      // Load teams where user is a member
      const { data: teamMemberships } = await supabase
        .from('team_members')
        .select(`
          team_id,
          role,
          joined_at,
          teams!inner (
            id,
            name,
            room_code,
            created_by,
            created_at
          )
        `)
        .eq('user_id', authUser.id);

      if (teamMemberships) {
        const teamsWithMembers = await Promise.all(
          teamMemberships.map(async (membership) => {
            const team = membership.teams;
            
            // Load all members for this team
            const { data: members } = await supabase
              .from('team_members')
              .select(`
                id,
                user_id,
                role,
                joined_at,
                users!inner (
                  name
                )
              `)
              .eq('team_id', team.id);

            return {
              ...team,
              members: members?.map(member => ({
                id: member.id,
                user_id: member.user_id,
                role: member.role,
                joined_at: member.joined_at,
                user: {
                  name: member.users.name
                }
              })) || []
            };
          })
        );

        setTeams(teamsWithMembers);
        
        // Set current team to the first one if exists
        if (teamsWithMembers.length > 0) {
          setCurrentTeam(teamsWithMembers[0]);
        }
      }
    } catch (error) {
      console.error('Error loading teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async (teamName: string) => {
    if (!authUser) throw new Error('User not authenticated');

    try {
      // Generate room code using the database function
      const { data: codeResult } = await supabase
        .rpc('generate_room_code');

      if (!codeResult) throw new Error('Failed to generate room code');

      // Create team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: teamName,
          room_code: codeResult,
          created_by: authUser.id
        })
        .select()
        .single();

      if (teamError) throw teamError;

      // Add creator as owner
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: authUser.id,
          role: 'owner'
        });

      if (memberError) throw memberError;

      // Reload teams
      await loadUserTeams();

      return team;
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  };

  const joinTeam = async (roomCode: string) => {
    if (!authUser) throw new Error('User not authenticated');

    try {
      // Find team by room code
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('id, name')
        .eq('room_code', roomCode.toUpperCase())
        .single();

      if (teamError || !team) {
        throw new Error('Invalid room code');
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', team.id)
        .eq('user_id', authUser.id)
        .single();

      if (existingMember) {
        throw new Error('You are already a member of this team');
      }

      // Add user as member
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: authUser.id,
          role: 'member'
        });

      if (memberError) throw memberError;

      // Reload teams
      await loadUserTeams();

      return team;
    } catch (error) {
      console.error('Error joining team:', error);
      throw error;
    }
  };

  const leaveTeam = async (teamId: string) => {
    if (!authUser) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', authUser.id);

      if (error) throw error;

      // Reload teams
      await loadUserTeams();
    } catch (error) {
      console.error('Error leaving team:', error);
      throw error;
    }
  };

  return {
    teams,
    currentTeam,
    loading,
    createTeam,
    joinTeam,
    leaveTeam,
    refreshTeams: loadUserTeams,
    setCurrentTeam
  };
}