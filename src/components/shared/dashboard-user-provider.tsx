'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type Profile = {
  full_name: string | null;
  xp: number | null;
  streak: number | null;
  last_practice_date: string | null;
  organization_id: string | null;
  role: string | null;
};

type DashboardUserContextValue = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
};

const DashboardUserContext = createContext<DashboardUserContextValue>({
  user: null,
  profile: null,
  loading: true,
});

export function DashboardUserProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!active) return;

      if (!currentUser) {
        router.push('/login');
        setLoading(false);
        return;
      }

      setUser(currentUser);

      const { data } = await supabase
        .from('profiles')
        .select('full_name, xp, streak, last_practice_date, organization_id, role')
        .eq('id', currentUser.id)
        .maybeSingle();

      if (!active) return;

      setProfile(data);
      setLoading(false);
    };

    loadUser();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <DashboardUserContext.Provider value={{ user, profile, loading }}>
      {children}
    </DashboardUserContext.Provider>
  );
}

export function useDashboardUser() {
  return useContext(DashboardUserContext);
}
