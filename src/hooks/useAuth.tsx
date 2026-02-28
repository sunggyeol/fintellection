"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import type { ProfileRow } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import { ensureAnonymousId } from "@/lib/db";
import {
  actorFromAuth,
  clearIndexedDbData,
  ensureProfile,
  getProfile,
  migrateAnonymousDataToUser,
  syncServerToLocalCache,
  type DataMode,
} from "@/lib/data/unified";

interface AuthContextValue {
  supabase: SupabaseClient;
  session: Session | null;
  user: User | null;
  profile: ProfileRow | null;
  mode: DataMode;
  isReady: boolean;
  dataVersion: number;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  refreshServerCache: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getSessionUserId(session: Session | null): string | null {
  return session?.user?.id ?? null;
}

function getDisplayNameFromUser(user: User) {
  const metadata = user.user_metadata as
    | {
        full_name?: string;
        name?: string;
      }
    | undefined;
  return metadata?.full_name ?? metadata?.name ?? null;
}

function getAvatarUrlFromUser(user: User) {
  const metadata = user.user_metadata as
    | {
        avatar_url?: string;
        picture?: string;
      }
    | undefined;
  return metadata?.avatar_url ?? metadata?.picture ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [authResolved, setAuthResolved] = useState(false);
  const [initializingUser, setInitializingUser] = useState(false);
  const [dataVersion, setDataVersion] = useState(0);
  const user = session?.user ?? null;
  const userId = user?.id ?? null;

  useEffect(() => {
    ensureAnonymousId();

    let mounted = true;
    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session ?? null);
      })
      .finally(() => {
        if (!mounted) return;
        setAuthResolved(true);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession((prev) => {
        const prevUserId = getSessionUserId(prev);
        const nextUserId = getSessionUserId(nextSession ?? null);
        return prevUserId === nextUserId ? prev : (nextSession ?? null);
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!authResolved) return;

    let cancelled = false;

    const initializeAuthenticatedUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser || !userId) {
        setProfile(null);
        setInitializingUser(false);
        setDataVersion((v) => v + 1);
        return;
      }

      setInitializingUser(true);
      const actor = actorFromAuth({ id: userId }, supabase);

      try {
        await ensureProfile(actor, {
          id: currentUser.id,
          email: currentUser.email ?? null,
          displayName: getDisplayNameFromUser(currentUser),
          avatarUrl: getAvatarUrlFromUser(currentUser),
        });

        await migrateAnonymousDataToUser(actor);
        await syncServerToLocalCache(actor);

        const nextProfile = await getProfile(actor);
        if (!cancelled) {
          setProfile(nextProfile);
        }
      } catch {
        if (!cancelled) {
          setProfile(null);
        }
      } finally {
        if (!cancelled) {
          setInitializingUser(false);
          setDataVersion((v) => v + 1);
        }
      }
    };

    void initializeAuthenticatedUser();

    return () => {
      cancelled = true;
    };
  }, [authResolved, userId, supabase]);

  const signInWithGoogle = useCallback(async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });
    if (error) throw error;
  }, [supabase]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    setProfile(null);
    setDataVersion((v) => v + 1);
  }, [supabase]);

  const deleteAccount = useCallback(async () => {
    if (!userId) {
      throw new Error("Must be signed in to delete account");
    }

    const { error } = await supabase.rpc("delete_my_account");
    if (error) throw error;

    await clearIndexedDbData();
    await supabase.auth.signOut();

    setSession(null);
    setProfile(null);
    setDataVersion((v) => v + 1);
  }, [userId, supabase]);

  const refreshServerCache = useCallback(async () => {
    if (!userId) return;

    const actor = actorFromAuth({ id: userId }, supabase);
    await syncServerToLocalCache(actor);
    const nextProfile = await getProfile(actor);
    setProfile(nextProfile);
    setDataVersion((v) => v + 1);
  }, [userId, supabase]);

  const value = useMemo<AuthContextValue>(() => {
    const mode: DataMode = session?.user ? "authenticated" : "anonymous";
    return {
      supabase,
      session,
      user,
      profile,
      mode,
      isReady: authResolved && !initializingUser,
      dataVersion,
      signInWithGoogle,
      signOut,
      deleteAccount,
      refreshServerCache,
    };
  }, [
    supabase,
    session,
    user,
    profile,
    authResolved,
    initializingUser,
    dataVersion,
    signInWithGoogle,
    signOut,
    deleteAccount,
    refreshServerCache,
  ]);

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
