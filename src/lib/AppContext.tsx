import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

// ── Single-device session helper ───────────────────────────
const DEVICE_KEY = 'tq_device_id';
function getDeviceId(): string {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

// ── Types ──────────────────────────────────────────────────
export type Subject  = Tables<'subjects'>;
export type Profile  = Tables<'profiles'>;
export type CartItem = Subject;

export type ViewKey =
  | 'home' | 'my-courses' | 'cart' | 'subject-detail' | 'exam' | 'profile' | 'news'
  | 'admin-dashboard' | 'admin-subjects' | 'admin-exams'
  | 'admin-theory' | 'admin-announcements' | 'admin-orders'
  | 'admin-coupons' | 'admin-users' | 'admin-settings' | 'admin-news';

interface AppContextValue {
  // Auth
  profile:            Profile | null;
  isAdmin:            boolean;
  authLoading:        boolean;
  emailVerified:      boolean;
  userEmail:          string | null;
  passwordRecovery:   boolean;
  clearPasswordRecovery: () => void;
  mustChangePassword: boolean;
  clearMustChangePassword: () => void;
  refreshAuthUser:    () => Promise<void>;
  signOut:            () => Promise<void>;

  // Navigation
  currentView:        ViewKey;
  setCurrentView:     (v: ViewKey) => void;
  searchQuery:        string;
  setSearchQuery:     (q: string) => void;
  selectedSubjectId:  string | null;
  setSelectedSubjectId: (id: string | null) => void;
  selectedExamId:     string | null;
  setSelectedExamId:  (id: string | null) => void;
  examMode:           'practice' | 'exam' | null;
  setExamMode:        (m: 'practice' | 'exam' | null) => void;

  // Cart (local only — subjects not yet paid)
  cart:         CartItem[];
  addToCart:    (s: Subject) => void;
  removeFromCart: (id: string) => void;
  clearCart:    () => void;
  isInCart:     (id: string) => boolean;

  // Purchased subjects
  purchasedIds:    string[];
  isPurchased:     (id: string) => boolean;
  refreshPurchased: () => Promise<void>;

  // Admin Notifications
  pendingOrdersCount: number;
  refreshPendingOrdersCount: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [profile,     setProfile]    = useState<Profile | null>(null);
  const [isAdmin,     setIsAdmin]    = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [passwordRecovery, setPasswordRecovery] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [currentView,        setCurrentView]        = useState<ViewKey>(() => (localStorage.getItem('currentView') as ViewKey) || 'home');
  const [selectedSubjectId,  setSelectedSubjectId]  = useState<string | null>(() => localStorage.getItem('selectedSubjectId'));
  const [selectedExamId,     setSelectedExamId]     = useState<string | null>(() => localStorage.getItem('selectedExamId'));
  const [examMode,           setExamMode]           = useState<'practice' | 'exam' | null>(() => localStorage.getItem('examMode') as any);

  const [cart,          setCart]          = useState<CartItem[]>([]);
  const [purchasedIds,  setPurchasedIds]  = useState<string[]>([]);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  useEffect(() => { localStorage.setItem('currentView', currentView); }, [currentView]);
  useEffect(() => { if (selectedSubjectId) localStorage.setItem('selectedSubjectId', selectedSubjectId); else localStorage.removeItem('selectedSubjectId'); }, [selectedSubjectId]);
  useEffect(() => { if (selectedExamId) localStorage.setItem('selectedExamId', selectedExamId); else localStorage.removeItem('selectedExamId'); }, [selectedExamId]);
  useEffect(() => { if (examMode) localStorage.setItem('examMode', examMode); else localStorage.removeItem('examMode'); }, [examMode]);

  // ── Load profile + role ──────────────────────────────────
  const loadProfileAndRole = useCallback(async (userId: string) => {
    try {
      const [profileRes, roleRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', userId),
      ]);
      if (profileRes.data) setProfile(profileRes.data);
      else if (profileRes.error) console.error('profile load error:', profileRes.error);
      if (roleRes.data) setIsAdmin(roleRes.data.some(r => r.role === 'admin'));
      else if (roleRes.error) console.error('role load error:', roleRes.error);
    } catch (e) {
      console.error('loadProfileAndRole exception:', e);
    }
  }, []);

  // ── Load purchased subjects ──────────────────────────────
  const refreshPurchased = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setPurchasedIds([]); return; }
      const { data, error } = await supabase
        .from('user_subjects')
        .select('subject_id')
        .eq('user_id', user.id);
      if (error) console.error('purchased load error:', error);
      setPurchasedIds((data ?? []).map(r => r.subject_id));
    } catch (e) {
      console.error('refreshPurchased exception:', e);
    }
  }, []);

  // ── Load pending orders count (Admin) ───────────────────
  const refreshPendingOrdersCount = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (!error) setPendingOrdersCount(count ?? 0);
    } catch (e) {
      console.error('refreshPendingOrdersCount exception:', e);
    }
  }, []);

  // ── Single-device enforcement ────────────────────────────
  const sessionChannelRef = useRef<any>(null);
  const enforceSingleSession = useCallback(async (userId: string) => {
    const deviceId = getDeviceId();
    try {
      // Claim this device as the active one (latest login wins)
      await (supabase.from('active_sessions' as any) as any).upsert({
        user_id: userId,
        session_id: deviceId,
        user_agent: navigator.userAgent,
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error('enforceSingleSession upsert error:', e);
    }

    // Subscribe to changes; if another device claims the account, sign out here
    if (sessionChannelRef.current) {
      supabase.removeChannel(sessionChannelRef.current);
      sessionChannelRef.current = null;
    }
    const ch = supabase
      .channel(`active-session-${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'active_sessions', filter: `user_id=eq.${userId}` },
        (payload) => {
          const newSid = (payload.new as any)?.session_id;
          if (newSid && newSid !== getDeviceId()) {
            toast.error('Tài khoản của bạn vừa đăng nhập trên một thiết bị khác. Bạn đã bị đăng xuất.', { duration: 8000 });
            supabase.auth.signOut();
          }
        }
      )
      .subscribe();
    sessionChannelRef.current = ch;
  }, []);

  // ── Auth listener ────────────────────────────────────────
  useEffect(() => {

    let mounted = true;

    // Safety: never stay loading forever
    const safety = setTimeout(() => {
      if (mounted) setAuthLoading(false);
    }, 5000);

    supabase.auth.getSession()
      .then(async ({ data: { session } }) => {
        if (session?.user) {
          setEmailVerified(!!session.user.email_confirmed_at);
          setUserEmail(session.user.email ?? null);
          setMustChangePassword(!!session.user.user_metadata?.must_change_password);
          if (session.user.email_confirmed_at) {
            await loadProfileAndRole(session.user.id);
            await refreshPurchased();
            enforceSingleSession(session.user.id);
            const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id);
            if (roleData?.some(r => r.role === 'admin')) {
              await refreshPendingOrdersCount();
            }
          }
        }
      })
      .catch(e => console.error('getSession error:', e))
      .finally(() => {
        if (mounted) setAuthLoading(false);
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setPasswordRecovery(true);
      }
      // Run async work without blocking the callback (avoid Supabase deadlocks)
      setTimeout(async () => {
        if (session?.user) {
          setEmailVerified(!!session.user.email_confirmed_at);
          setUserEmail(session.user.email ?? null);
          setMustChangePassword(!!session.user.user_metadata?.must_change_password);
          if (session.user.email_confirmed_at) {
            await loadProfileAndRole(session.user.id);
            await refreshPurchased();
            if (event === 'SIGNED_IN') {
              enforceSingleSession(session.user.id);
              setSearchQuery('');
              if (!localStorage.getItem('currentView')) setCurrentView('home');
            }
          }
        } else {
          if (sessionChannelRef.current) {
            supabase.removeChannel(sessionChannelRef.current);
            sessionChannelRef.current = null;
          }
          setEmailVerified(false);
          setUserEmail(null);
          setMustChangePassword(false);
          setProfile(null);
          setIsAdmin(false);
          setPurchasedIds([]);
          setCart([]);
          setSearchQuery('');
          setCurrentView('home');
        }
      }, 0);
    });


    // Real-time subscription for orders (only if admin)
    let ordersSubscription: any = null;
    if (isAdmin) {
      ordersSubscription = supabase
        .channel('admin-orders-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          refreshPendingOrdersCount();
        })
        .subscribe();
    }

    return () => {
      mounted = false;
      clearTimeout(safety);
      subscription.unsubscribe();
      if (ordersSubscription) ordersSubscription.unsubscribe();
    };
  }, [loadProfileAndRole, refreshPurchased, isAdmin, refreshPendingOrdersCount, enforceSingleSession]);

  // ── Cart helpers ─────────────────────────────────────────
  const addToCart    = (s: Subject) => setCart(c => c.find(i => i.id === s.id) ? c : [...c, s]);
  const removeFromCart = (id: string) => setCart(c => c.filter(i => i.id !== id));
  const clearCart    = () => setCart([]);
  const isInCart     = (id: string) => cart.some(i => i.id === id);
  const isPurchased  = (id: string) => purchasedIds.includes(id);

  // ── Sign out ─────────────────────────────────────────────
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // ── Refresh auth user (used after email verification) ────
  const refreshAuthUser = useCallback(async () => {
    await supabase.auth.refreshSession();
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      setEmailVerified(!!data.user.email_confirmed_at);
      setUserEmail(data.user.email ?? null);
      if (data.user.email_confirmed_at) {
        await loadProfileAndRole(data.user.id);
        await refreshPurchased();
      }
    }
  }, [loadProfileAndRole, refreshPurchased]);

  // ── Admin view guard ─────────────────────────────────────
  // If user is not admin but somehow lands on admin view, redirect
  // Only redirect after auth is fully loaded and we're sure user is not admin
  useEffect(() => {
    if (!authLoading && profile && !isAdmin && currentView.startsWith('admin-')) {
      setCurrentView('home');
    }
  }, [authLoading, profile, isAdmin, currentView]);

  const [searchQuery,       setSearchQuery]       = useState('');

  const value: AppContextValue = {
    profile, isAdmin, authLoading, emailVerified, userEmail,
    passwordRecovery, clearPasswordRecovery: () => setPasswordRecovery(false),
    mustChangePassword, clearMustChangePassword: () => setMustChangePassword(false),
    refreshAuthUser, signOut,
    currentView, setCurrentView,
    searchQuery, setSearchQuery,
    selectedSubjectId, setSelectedSubjectId,
    selectedExamId, setSelectedExamId,
    examMode, setExamMode,
    cart, addToCart, removeFromCart, clearCart, isInCart,
    purchasedIds, isPurchased, refreshPurchased,
    pendingOrdersCount, refreshPendingOrdersCount,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
