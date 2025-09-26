import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'operator';
  user_id: string;
  created_at: string;
}

interface AuthContextType {
  user: SupabaseUser | null;
  session: Session | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to defer the async profile fetch
          setTimeout(() => {
            fetchUserProfile(session.user.id, session.user);
          }, 0);
        } else {
          setUserProfile(null);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id, session.user);
      } else {
        setLoading(false);
      }
    };

    checkSession();

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string, currentUser: SupabaseUser) => {
    try {
      // First try to get the profile directly
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        // Create a fallback profile to prevent infinite loading
        setUserProfile({
          id: userId,
          user_id: userId,
          email: currentUser?.email || '',
          name: currentUser?.user_metadata?.name || currentUser?.email || '',
          role: (currentUser?.user_metadata?.role as 'admin' | 'operator') || 'admin',
          created_at: new Date().toISOString()
        });
        return;
      }

      if (data) {
        setUserProfile(data);
      } else {
        // Create profile using the user's metadata role or default to admin
        const userRole = currentUser?.user_metadata?.role || 'admin';
        const userName = currentUser?.user_metadata?.name || currentUser?.email || '';
        
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .insert([{
            user_id: userId,
            email: currentUser?.email || '',
            name: userName,
            role: userRole
          }])
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user profile:', insertError);
          // Even if creation fails, we can still create a temporary profile
          setUserProfile({
            id: userId,
            user_id: userId,
            email: currentUser?.email || '',
            name: userName,
            role: userRole as 'admin' | 'operator',
            created_at: new Date().toISOString()
          });
        } else {
          setUserProfile(newProfile);
        }
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      // Create a fallback profile to prevent infinite loading
      setUserProfile({
        id: userId,
        user_id: userId,
        email: currentUser?.email || '',
        name: currentUser?.user_metadata?.name || currentUser?.email || '',
        role: (currentUser?.user_metadata?.role as 'admin' | 'operator') || 'admin',
        created_at: new Date().toISOString()
      });
    } finally {
      // Always set loading to false after attempting to fetch profile
      setLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserProfile(null);
    navigate('/');
  };

  const value = {
    user,
    session,
    userProfile,
    loading,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};