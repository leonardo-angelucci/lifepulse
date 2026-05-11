'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Login() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName } }
        });
        if (signUpError) throw signUpError;
        
        // Crea record in users
        await supabase.from('users').insert({
          email, full_name: fullName, role: 'user', is_responder: false
        });
        
        alert('Registrazione completata! Controlla la tua email per confermare.');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0c0f', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#111318', border: '1px solid #252b36', borderRadius: 12, padding: '24px 20px' }}>
        <img src="/logo.jpg" alt="LifePulse" style={{ width: 80, height: 80, margin: '0 auto 16px', display: 'block', borderRadius: 12 }} />
        <h2 style={{ textAlign: 'center', fontSize: 22, fontWeight: 800, color: '#e8ecf0', marginBottom: 8 }}>
          {isSignUp ? 'Registrati' : 'Accedi'}
        </h2>
        <p style={{ textAlign: 'center', fontSize: 13, color: '#7a8494', marginBottom: 24 }}>
          {isSignUp ? 'Crea un account LifePulse' : 'Benvenuto su LifePulse'}
        </p>

        <form onSubmit={handleAuth}>
          {isSignUp && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#7a8494', marginBottom: 6 }}>Nome completo</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{ width: '100%', padding: '10px 12px', background: '#181c23', border: '1px solid #252b36', borderRadius: 8, color: '#e8ecf0', fontSize: 14 }}
              />
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#7a8494', marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 12px', background: '#181c23', border: '1px solid #252b36', borderRadius: 8, color: '#e8ecf0', fontSize: 14 }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, color: '#7a8494', marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '10px 12px', background: '#181c23', border: '1px solid #252b36', borderRadius: 8, color: '#e8ecf0', fontSize: 14 }}
            />
          </div>

          {error && <p style={{ color: '#e63535', fontSize: 12, marginBottom: 12 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: 12, background: '#e63535', border: 'none', borderRadius: 8, color: 'white', fontWeight: 700, fontSize: 14, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Caricamento...' : isSignUp ? 'Registrati' : 'Accedi'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#7a8494', marginTop: 16 }}>
          {isSignUp ? 'Hai già un account?' : 'Non hai un account?'}{' '}
          <span onClick={() => setIsSignUp(!isSignUp)} style={{ color: '#e63535', cursor: 'pointer', fontWeight: 600 }}>
            {isSignUp ? 'Accedi' : 'Registrati'}
          </span>
        </p>
      </div>
    </div>
  );
}