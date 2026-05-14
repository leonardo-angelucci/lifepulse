'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Admin() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [dae, setDae] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'users' | 'dae'>('users');

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push('/login'); return; }
      
      const { data: profile } = await supabase.from('users').select('role').eq('email', session.user.email).single();
      if (profile?.role !== 'admin') { router.push('/'); return; }
      
      await loadData();
    };
    checkAdmin();
  }, [router]);

  const loadData = async () => {
    const { data: usersData } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    const { data: daeData } = await supabase.from('dae_devices').select('*').order('name');
    setUsers(usersData || []);
    setDae(daeData || []);
    setLoading(false);
  };

  const toggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    await supabase.from('users').update({ role: newRole }).eq('id', userId);
    await loadData();
  };

  const toggleResponder = async (userId: string, current: boolean) => {
    await supabase.from('users').update({ is_responder: !current }).eq('id', userId);
    await loadData();
  };

  const updateDaeStatus = async (daeId: string, status: string) => {
    await supabase.from('dae_devices').update({ status }).eq('id', daeId);
    await loadData();
  };

  if (loading) return <div style={{ minHeight: '100vh', background: '#0a0c0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e8ecf0' }}>Caricamento...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0c0f', padding: 16, maxWidth: 900, margin: '0 auto' }}>
      <div style={{ background: '#111318', padding: '12px 16px', borderRadius: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => router.push('/profilo')} style={{ background: 'none', border: 'none', color: '#7a8494', fontSize: 24, cursor: 'pointer' }}>←</button>
        <h1 style={{ fontSize: 18, fontWeight: 800, color: '#e8ecf0', flex: 1 }}>🔧 Dashboard Admin</h1>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button onClick={() => setTab('users')} style={{ flex: 1, padding: 10, background: tab === 'users' ? '#f5a623' : '#181c23', border: 'none', borderRadius: 8, color: tab === 'users' ? '#000' : '#7a8494', fontWeight: 700, cursor: 'pointer' }}>
          Utenti ({users.length})
        </button>
        <button onClick={() => setTab('dae')} style={{ flex: 1, padding: 10, background: tab === 'dae' ? '#22c97a' : '#181c23', border: 'none', borderRadius: 8, color: tab === 'dae' ? '#000' : '#7a8494', fontWeight: 700, cursor: 'pointer' }}>
          DAE ({dae.length})
        </button>
      </div>

      {tab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {users.map(u => (
            <div key={u.id} style={{ background: '#111318', border: '1px solid #252b36', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: u.role === 'admin' ? '#f5a623' : '#3b9eff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#000' }}>
                  {u.full_name?.charAt(0) || 'U'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#e8ecf0' }}>{u.full_name}</div>
                  <div style={{ fontSize: 12, color: '#7a8494' }}>{u.email}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => toggleRole(u.id, u.role)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: u.role === 'admin' ? '#f5a62333' : '#3b9eff33', color: u.role === 'admin' ? '#f5a623' : '#3b9eff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                    {u.role === 'admin' ? 'ADMIN' : 'USER'}
                  </button>
                  <button onClick={() => toggleResponder(u.id, u.is_responder)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 6, background: u.is_responder ? '#22c97a33' : '#25263633', color: u.is_responder ? '#22c97a' : '#7a8494', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                    {u.is_responder ? '✓ Responder' : 'Responder'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'dae' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {dae.map(d => (
            <div key={d.id} style={{ background: '#111318', border: '1px solid #252b36', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#e8ecf0', marginBottom: 4 }}>{d.name}</div>
              <div style={{ fontSize: 12, color: '#7a8494', marginBottom: 8 }}>{d.address}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {['active', 'in_use', 'maintenance'].map(status => (
                  <button
                    key={status}
                    onClick={() => updateDaeStatus(d.id, status)}
                    style={{
                      fontSize: 11, padding: '4px 10px', borderRadius: 6,
                      background: d.status === status ? (status === 'active' ? '#22c97a33' : status === 'in_use' ? '#f5a62333' : '#e6353533') : '#25263633',
                      color: d.status === status ? (status === 'active' ? '#22c97a' : status === 'in_use' ? '#f5a623' : '#e63535') : '#7a8494',
                      border: 'none', fontWeight: 700, cursor: 'pointer'
                    }}
                  >
                    {status === 'active' ? 'Attivo' : status === 'in_use' ? 'In uso' : 'Manutenzione'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}