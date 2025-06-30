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
      const { data: teamMemberships, error: membershipError } = await supabase
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

      if (membershipError) {
        console.error('Error loading team memberships:', membershipError);
        setLoading(false);
        return;
      }

      if (teamMemberships && teamMemberships.length > 0) {
        const teamsWithMembers = await Promise.all(
          teamMemberships.map(async (membership) => {
            const team = membership.teams;
            
            // Load all members for this team
            const { data: members, error: membersError } = await supabase
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

            if (membersError) {
              console.error('Error loading team members:', membersError);
              return {
                ...team,
                members: []
              };
            }

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
      } else {
        setTeams([]);
        setCurrentTeam(null);
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
      const { data: codeResult, error: codeError } = await supabase
        .rpc('generate_room_code');

      if (codeError || !codeResult) {
        console.error('Error generating room code:', codeError);
        throw new Error('Failed to generate room code');
      }

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

      if (teamError) {
        console.error('Error creating team:', teamError);
        throw teamError;
      }

      // Add creator as owner
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: team.id,
          user_id: authUser.id,
          role: 'owner'
        });

      if (memberError) {
        console.error('Error adding team owner:', memberError);
        throw memberError;
      }

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
      const cleanRoomCode = roomCode.trim().toUpperCase();
      
      if (!cleanRoomCode) {
        throw new Error('Please enter a valid room code');
      }

      // Find team by room code with better error handling
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('id, name, room_code, created_by')
        .eq('room_code', cleanRoomCode)
        .maybeSingle();

      if (teamError) {
        console.error('Error finding team:', teamError);
        throw new Error('Error searching for team. Please try again.');
      }

      if (!teamData) {
        throw new Error('Invalid room code. Please check the code and try again.');
      }

      // Check if user is already a member
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamData.id)
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (memberCheckError) {
        console.error('Error checking membership:', memberCheckError);
        throw new Error('Error checking team membership');
      }

      if (existingMember) {
        throw new Error('You are already a member of this team');
      }

      // Add user as member
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamData.id,
          user_id: authUser.id,
          role: 'member'
        });

      if (memberError) {
        console.error('Error joining team:', memberError);
        throw new Error('Failed to join team. Please try again.');
      }

      // Reload teams
      await loadUserTeams();

      return teamData;
    } catch (error) {
      console.error('Error joining team:', error);
      throw error;
    }
  };

  const joinTeamByInvite = async (teamId: string) => {
    if (!authUser) throw new Error('User not authenticated');

    try {
      // Verify team exists
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('id, name, room_code, created_by')
        .eq('id', teamId)
        .single();

      if (teamError || !teamData) {
        throw new Error('Invalid invite link or team no longer exists');
      }

      // Check if user is already a member
      const { data: existingMember, error: memberCheckError } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamData.id)
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (memberCheckError) {
        console.error('Error checking membership:', memberCheckError);
        throw new Error('Error checking team membership');
      }

      if (existingMember) {
        throw new Error('You are already a member of this team');
      }

      // Add user as member
      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamData.id,
          user_id: authUser.id,
          role: 'member'
        });

      if (memberError) {
        console.error('Error joining team:', memberError);
        throw new Error('Failed to join team. Please try again.');
      }

      // Reload teams
      await loadUserTeams();

      return teamData;
    } catch (error) {
      console.error('Error joining team by invite:', error);
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

      if (error) {
        console.error('Error leaving team:', error);
        throw error;
      }

      // Reload teams
      await loadUserTeams();
    } catch (error) {
      console.error('Error leaving team:', error);
      throw error;
    }
  };

  const generateInviteLink = (teamId: string) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/invite/${teamId}`;
  };

  return {
    teams,
    currentTeam,
    loading,
    createTeam,
    joinTeam,
    joinTeamByInvite,
    leaveTeam,
    refreshTeams: loadUserTeams,
    setCurrentTeam,
    generateInviteLink
  };
}