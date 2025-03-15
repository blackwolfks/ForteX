
import React, { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  currentUser: any | null;
  isAdmin: boolean;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAdmin: false,
  checkSession: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const checkSession = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      setCurrentUser(data.session.user);
      
      // Check if user has admin role via user_subscriptions
      // This is a simplified implementation using an existing table
      const { data: subscriptionData } = await supabase
        .from('user_subscriptions')
        .select('subscription_tier')
        .eq('user_id', data.session.user.id)
        .maybeSingle();
        
      // Consider users with 'pro' subscription as admins for now
      // You may need to create a proper user_roles table for a real implementation
      setIsAdmin(subscriptionData?.subscription_tier === 'pro');
    } else {
      setCurrentUser(null);
      setIsAdmin(false);
    }
  }, []);

  const value = {
    currentUser,
    isAdmin,
    checkSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
