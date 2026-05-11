'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Profilo() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      
      setUser(session.user);
      const { data } = await supabase.from('users').select('*').eq('email', session.user.email).single();
      setProfile(data);
      setLoading(false);
    };
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) return <div style={{ minHeight: '100vh', background: '#0a0c0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e8ecf0' }}>Caricamento...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0c0f', padding: 16, maxWidth: 480, margin: '0 auto' }}>
      <div style={{ background: '#111318', padding: '12px 16px', borderRadius: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/')} style={{ background: 'none', border: 'none', color: '#7a8494', fontSize: 24, cursor: 'pointer' }}>←</button>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#e8ecf0', flex: 1 }}>Profilo</h1>
      </div>

      <div style={{ background: '#111318', border: '1px solid #252b36', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#e63535', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: 'white', margin: '0 auto 12px' }}>
          {profile?.full_name?.charAt(0) || 'U'}
        </div>
        <h2 style={{ textAlign: 'center', fontSize: 18, fontWeight: 800, color: '#e8ecf0', marginBottom: 4 }}>{profile?.full_name}</h2>
        <p style={{ textAlign: 'center', fontSize: 13, color: '#7a8494', marginBottom: 16 }}>{user?.email}</p>
        
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: profile?.role === 'admin' ? '#f5a62333' : '#3b9eff33', color: profile?.role === 'admin' ? '#f5a623' : '#3b9eff', fontWeight: 700 }}>
            {profile?.role === 'admin' ? 'ADMIN' : 'UTENTE'}
          </span>
          {profile?.is_responder && (
            <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: '#22c97a33', color: '#22c97a', fontWeight: 700 }}>FIRST RESPONDER</span>
          )}
        </div>
      </div>

      {profile?.role === 'admin' && (
        <button
          onClick={() => router.push('/admin')}
          style={{ width: '100%', padding: 12, background: '#f5a623', border: 'none', borderRadius: 8, color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer', marginBottom: 12 }}
        >
          🔧 Dashboard Admin
        </button>
      )}

      <button
        onClick={handleLogout}
        style={{ width: '100%', padding: 12, background: 'none', border: '1px solid #e63535', borderRadius: 8, color: '#e63535', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
      >
        Esci
      </button>
    </div>
  );
}