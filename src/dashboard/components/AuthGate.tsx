import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { centralSupabase } from '../../supabase/central-client';
import { testUserSupabaseConnection } from '../../supabase/user-client';
import { USER_PROJECT_SCHEMA_SQL } from '../../supabase/user-project-schema';
import { userSupabaseConfigRepository } from '../../storage/repositories/user-supabase-config-repository';

interface AuthGateProps {
  children: ReactNode;
}

type AuthMode = 'login' | 'register';

const CENTRAL_PROJECT_URL = 'https://zfobbtitwwejzqmqgcmi.supabase.co';

function normalizeProjectUrl(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

function isMissingSchemaError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return message.includes('script_batches') || message.includes('schema cache') || message.includes('row-level security') || message.includes('unauthorized');
}

export function AuthGate({ children }: AuthGateProps) {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registrationProjectUrl, setRegistrationProjectUrl] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [hasProjectConfig, setHasProjectConfig] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [schemaSql, setSchemaSql] = useState('');

  const canRegister = normalizeProjectUrl(registrationProjectUrl) === CENTRAL_PROJECT_URL;

  const loadProjectConfig = useCallback(async (currentUser: User) => {
    const [remoteConfig, cachedConfig] = await Promise.all([
      userSupabaseConfigRepository.getRemote(currentUser.id).catch(() => null),
      userSupabaseConfigRepository.getCached(),
    ]);
    const config = remoteConfig ?? cachedConfig;
    setProjectUrl(config?.projectUrl ?? '');
    setAnonKey(config?.anonKey ?? '');
    setHasProjectConfig(Boolean(config?.projectUrl && config?.anonKey));
  }, []);

  useEffect(() => {
    let mounted = true;
    void centralSupabase.auth.getUser().then(async ({ data }) => {
      if (!mounted) {
        return;
      }
      setUser(data.user);
      if (data.user) {
        await loadProjectConfig(data.user);
      } else {
        const cachedConfig = await userSupabaseConfigRepository.getCached();
        setProjectUrl(cachedConfig?.projectUrl ?? '');
        setAnonKey(cachedConfig?.anonKey ?? '');
        setHasProjectConfig(Boolean(cachedConfig?.projectUrl && cachedConfig?.anonKey));
      }
      setLoading(false);
    });

    const { data: listener } = centralSupabase.auth.onAuthStateChange((_event, session) => {
      void (async () => {
        if (!mounted) {
          return;
        }
        setUser(session?.user ?? null);
        setMessage('');
        if (session?.user) {
          await loadProjectConfig(session.user);
        } else {
          const cachedConfig = await userSupabaseConfigRepository.getCached();
          setProjectUrl(cachedConfig?.projectUrl ?? '');
          setAnonKey(cachedConfig?.anonKey ?? '');
          setHasProjectConfig(Boolean(cachedConfig?.projectUrl && cachedConfig?.anonKey));
        }
      })();
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProjectConfig]);

  const submitAuth = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setMessage('');
    if (authMode === 'register' && !canRegister) {
      setSaving(false);
      setMessage(`Registration is only available when the project URL is ${CENTRAL_PROJECT_URL}.`);
      return;
    }

    const authAction = authMode === 'login'
      ? centralSupabase.auth.signInWithPassword({ email: email.trim(), password })
      : centralSupabase.auth.signUp({ email: email.trim(), password });
    const { data, error } = await authAction;
    setSaving(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (data.user) {
      setUser(data.user);
      await loadProjectConfig(data.user);
    }
    setMessage(authMode === 'login' ? 'Logged in successfully.' : 'Account created. Check email confirmation settings if login is not immediate.');
  };

  const saveProjectConfig = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) {
      return;
    }
    setSaving(true);
    setMessage('');
    setSchemaSql('');
    try {
      const config = { projectUrl: normalizeProjectUrl(projectUrl), anonKey: anonKey.trim() };
      await testUserSupabaseConnection(config);
      await userSupabaseConfigRepository.setCached(config);
      try {
        await userSupabaseConfigRepository.saveRemote(user.id, config);
        setMessage('Supabase project config saved.');
      } catch (remoteError) {
        setMessage(remoteError instanceof Error
          ? `Supabase project config saved locally. Central config table is not ready yet: ${remoteError.message}`
          : 'Supabase project config saved locally. Central config table is not ready yet.');
      }
      setHasProjectConfig(true);
    } catch (error) {
      if (isMissingSchemaError(error)) {
        setSchemaSql(USER_PROJECT_SCHEMA_SQL);
        setMessage('This Supabase project is reachable, but required extension tables are missing. Copy the SQL below, run it in Supabase SQL Editor, then try saving again.');
      } else {
        setMessage(error instanceof Error ? error.message : 'Unable to save Supabase project config.');
      }
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    await centralSupabase.auth.signOut();
    await userSupabaseConfigRepository.setCached(null);
  };

  if (loading) {
    return <div className="shell"><section className="panel card">Loading authentication...</section></div>;
  }

  if (!user) {
    return (
      <div className="shell">
        <section className="panel card" style={{ maxWidth: 520, margin: '40px auto', display: 'grid', gap: 18 }}>
          <div>
            <span className="badge">Supabase Auth</span>
            <h1 style={{ margin: '14px 0 6px', fontSize: 28 }}>{authMode === 'login' ? 'Login' : 'Create account'}</h1>
            <p className="section-subtitle">Sign in before opening Gemini Gem Auto Flow.</p>
          </div>
          <form onSubmit={submitAuth} style={{ display: 'grid', gap: 14 }}>
            {authMode === 'register' && (
              <div className="field">
                <label htmlFor="registration-project-url">Central project URL</label>
                <input id="registration-project-url" value={registrationProjectUrl} onChange={(event) => setRegistrationProjectUrl(event.target.value)} placeholder={CENTRAL_PROJECT_URL} required />
                <p className="section-subtitle" style={{ margin: '6px 0 0' }}>Registration is only enabled for the official central project URL.</p>
              </div>
            )}
            <div className="field">
              <label htmlFor="auth-email">Email</label>
              <input id="auth-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="auth-password">Password</label>
              <input id="auth-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
            </div>
            {message && <p className="section-subtitle" style={{ margin: 0 }}>{message}</p>}
            <button className="button" type="submit" disabled={saving || (authMode === 'register' && !canRegister)}>{saving ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Create account'}</button>
          </form>
          <button className="button secondary" type="button" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setMessage(''); }}>
            {authMode === 'login' ? 'Register with central project URL' : 'Already have an account? Login'}
          </button>
        </section>
      </div>
    );
  }

  if (!hasProjectConfig) {
    return (
      <div className="shell">
        <section className="panel card" style={{ maxWidth: 680, margin: '40px auto', display: 'grid', gap: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
            <div>
              <span className="badge">User Supabase Database</span>
              <h1 style={{ margin: '14px 0 6px', fontSize: 28 }}>Configure your Supabase project</h1>
              <p className="section-subtitle">This extension will store scripts, Google Sheet configs, runs, results, and run calendar in your own Supabase project.</p>
            </div>
            <button className="button secondary" type="button" onClick={signOut}>Logout</button>
          </div>
          <form onSubmit={saveProjectConfig} style={{ display: 'grid', gap: 14 }}>
            <div className="field">
              <label htmlFor="project-url">Project URL</label>
              <input id="project-url" value={projectUrl} onChange={(event) => setProjectUrl(event.target.value)} placeholder="https://your-project.supabase.co" required />
            </div>
            <div className="field">
              <label htmlFor="anon-key">Anon key</label>
              <input id="anon-key" type="password" value={anonKey} onChange={(event) => setAnonKey(event.target.value)} required />
            </div>
            {message && <p className="section-subtitle" style={{ margin: 0 }}>{message}</p>}
            {schemaSql && (
              <div className="field">
                <label htmlFor="schema-sql">Required SQL setup</label>
                <textarea id="schema-sql" value={schemaSql} readOnly rows={18} style={{ width: '100%', fontFamily: 'monospace' }} />
                <button className="button secondary" type="button" onClick={() => void navigator.clipboard.writeText(schemaSql)}>Copy SQL</button>
              </div>
            )}
            <button className="button" type="submit" disabled={saving}>{saving ? 'Testing and saving...' : 'Test connection and save'}</button>
          </form>
        </section>
      </div>
    );
  }

  return <>{children}</>;
}
