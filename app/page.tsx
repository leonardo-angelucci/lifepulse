'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';

const Mappa = dynamic(() => import('./components/Mappa'), { ssr: false });

function useGeolocation() {
  const [state, setState] = useState({ lat: null as number|null, lng: null as number|null, error: null as string|null, loading: true });
  const watchId = useRef<number|null>(null);
  useEffect(() => {
    if (!navigator.geolocation) { setState(s => ({ ...s, error: 'GPS non supportato', loading: false })); return; }
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => setState({ lat: pos.coords.latitude, lng: pos.coords.longitude, error: null, loading: false }),
      (err) => setState(s => ({ ...s, error: err.message, loading: false })),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    return () => { if (watchId.current) navigator.geolocation.clearWatch(watchId.current); };
  }, []);
  return state;
}

const DAE_LIST = [
  { id: 1, name: 'Farmacia Centrale',  addr: 'Via Roma 12',       dist: 80,  status: 'active' },
  { id: 2, name: 'Palestra Comunale',  addr: 'Via Garibaldi 5',   dist: 145, status: 'in_use' },
  { id: 3, name: 'Stazione FS',        addr: 'Piazza Stazione 1', dist: 310, status: 'active' },
  { id: 4, name: 'Centro Commerciale', addr: 'Via Marconi 88',    dist: 490, status: 'maintenance' },
];

function statusColor(s: string) {
  return s === 'active' ? '#22c97a' : s === 'in_use' ? '#f5a623' : '#e63535';
}
function statusLabel(s: string) {
  return s === 'active' ? 'Attivo' : s === 'in_use' ? 'In Uso' : 'Manutenzione';
}

export default function Home() {
  const router = useRouter();

useEffect(() => {
  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) router.push('/login');
  };
  checkAuth();
}, [router]);
  const { lat, lng, loading } = useGeolocation();
  const [tab, setTab] = useState<'panic'|'dae'|'info'>('panic');
  const [emergency, setEmergency] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [holding, setHolding] = useState(false);
  const holdTimer = useRef<NodeJS.Timeout|null>(null);
  const intervalRef = useRef<NodeJS.Timeout|null>(null);

  useEffect(() => {
    if (emergency) {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setSeconds(0);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
}, []);
  }, [emergency]);

  const fmtTime = (s: number) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const startHold = () => {
    setHolding(true);
    holdTimer.current = setTimeout(() => {
      setEmergency(true);
      setHolding(false);
      if (navigator.vibrate) navigator.vibrate([200, 100, 400]);
    }, 1500);
  };
  const endHold = () => {
    setHolding(false);
    if (holdTimer.current) clearTimeout(holdTimer.current);
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', background: '#0a0c0f', minHeight: '100vh', color: '#e8ecf0', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto' }}>

      {/* TOPBAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#111318', borderBottom: '1px solid #252b36' }}>
        <img src="/logo.jpg" alt="LifePulse" style={{ height: 32, borderRadius: 6 }} />
        <div style={{ fontSize: 11, color: '#22c97a', background: '#0a1f14', border: '1px solid rgba(34,201,122,.3)', borderRadius: 20, padding: '4px 10px' }}>● LIVE</div>
      </div>

      {/* GPS BAR */}
      <div style={{ background: '#111318', padding: '8px 16px', borderBottom: '1px solid #252b36', fontSize: 12, color: '#7a8494' }}>
        {loading ? '📡 Acquisizione GPS...' : `📍 ${lat?.toFixed(5)}, ${lng?.toFixed(5)} — Teramo (TE)`}
      </div>

      {/* NAV */}
      <div style={{ display: 'flex', background: '#111318', borderBottom: '1px solid #252b36' }}>
        {(['panic','dae','info'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '10px 4px', background: tab === t ? '#181c23' : 'none', border: 'none', borderBottom: tab === t ? '2px solid #e63535' : '2px solid transparent', color: tab === t ? '#e8ecf0' : '#7a8494', fontWeight: 700, fontSize: 12, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1 }}>
            {t === 'panic' ? 'Emergenza' : t === 'dae' ? 'Mappa DAE' : 'Guida RCP'}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>

        {/* ===================== TAB EMERGENZA ===================== */}
        {tab === 'panic' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', width: 180, height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 8 }}>
              {(emergency || holding) && (
                <>
                  <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', border: '2px solid #e63535', opacity: 0.3, animation: 'pulse 1.5s infinite' }} />
                  <div style={{ position: 'absolute', width: 140, height: 140, borderRadius: '50%', border: '2px solid #e63535', opacity: 0.5, animation: 'pulse 1.5s infinite 0.3s' }} />
                </>
              )}
              <button
                onPointerDown={startHold}
                onPointerUp={endHold}
                onPointerLeave={endHold}
                style={{ width: 110, height: 110, borderRadius: '50%', background: holding || emergency ? '#c22828' : '#e63535', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2, boxShadow: '0 0 0 6px rgba(230,53,53,0.15)', transition: 'transform 0.1s', transform: holding ? 'scale(0.96)' : 'scale(1)', zIndex: 2 }}
              >
                <div style={{ fontSize: 36, fontWeight: 900, color: 'white', lineHeight: 1 }}>SOS</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', letterSpacing: 1 }}>TIENI PREMUTO</div>
              </button>
            </div>

            <div style={{ fontSize: 12, color: '#7a8494', textAlign: 'center' }}>
              Pressione di 1.5s chiama il 118 e condivide la posizione GPS
            </div>

            {emergency && (
              <div style={{ width: '100%', background: '#2a1010', border: '1px solid rgba(230,53,53,0.5)', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ color: '#e63535', fontWeight: 800, fontSize: 16 }}>⚠ Emergenza Attiva</div>
                  <div style={{ fontFamily: 'monospace', color: '#f5a623', fontSize: 14 }}>{fmtTime(seconds)}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { icon: '✓', text: 'GPS trasmesso al 118', done: true },
                    { icon: '✓', text: 'Chiamata 118 avviata', done: true },
                    { icon: '!', text: 'First responder in arrivo (ETA 2min)', done: false },
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: s.done ? '#22c97a' : '#f5a623', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, color: '#000', flexShrink: 0 }}>{s.icon}</div>
                      <span>{s.text}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => setEmergency(false)} style={{ marginTop: 12, width: '100%', padding: 8, background: 'none', border: '1px solid rgba(230,53,53,0.4)', borderRadius: 6, color: '#e63535', cursor: 'pointer', fontSize: 13 }}>
                  Annulla Emergenza
                </button>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%' }}>
              {[
                { icon: '📞', label: 'Chiama 118', sub: 'Chiamata diretta', action: () => window.location.href = 'tel:118' },
                { icon: '🏥', label: 'DAE Vicini',  sub: `${DAE_LIST.filter(d=>d.status==='active').length} disponibili`, action: () => setTab('dae') },
                { icon: '📋', label: 'Guida RCP',   sub: 'Istruzioni passo-passo', action: () => setTab('info') },
                { icon: '👤', label: 'Profilo', sub: 'First Responder', action: () => window.location.href = '/profilo' },
              ].map((a, i) => (
                <button key={i} onClick={a.action} style={{ background: '#181c23', border: '1px solid #252b36', borderRadius: 10, padding: '12px 14px', cursor: 'pointer', textAlign: 'left', color: '#e8ecf0' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{a.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{a.label}</div>
                  <div style={{ fontSize: 11, color: '#7a8494' }}>{a.sub}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ===================== TAB MAPPA DAE ===================== */}
        {tab === 'dae' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontSize: 13, color: '#7a8494', marginBottom: 4 }}>DAE nelle vicinanze — ordinati per distanza</div>

            {/* MAPPA LEAFLET */}
            {lat && lng && <Mappa lat={lat} lng={lng} />}

            {/* LISTA DAE */}
            {DAE_LIST.map(d => (
              <div key={d.id} style={{ background: '#181c23', border: '1px solid #252b36', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: statusColor(d.status), flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{d.name}</div>
                  <div style={{ fontSize: 12, color: '#7a8494' }}>{d.addr}</div>
                  <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 700, background: `${statusColor(d.status)}20`, color: statusColor(d.status) }}>{statusLabel(d.status)}</span>
                </div>
                <div style={{ fontFamily: 'monospace', color: '#3b9eff', fontSize: 13 }}>{d.dist}m</div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#7a8494', marginTop: 4 }}>
              <span>🟢 Attivo</span><span>🟡 In uso</span><span>🔴 Manutenzione</span>
            </div>
          </div>
        )}

        {/* ===================== TAB GUIDA RCP ===================== */}
{tab === 'info' && (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>

    {/* HEADER */}
    <div style={{ background: '#1a0a0a', border: '1px solid rgba(230,53,53,0.3)', borderRadius: 12, padding: '14px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 28 }}>❤️</div>
      <div style={{ fontWeight: 900, fontSize: 18, color: '#e63535', marginTop: 4 }}>Guida RCP</div>
      <div style={{ fontSize: 12, color: '#7a8494', marginTop: 4 }}>Rianimazione Cardiopolmonare — segui i passi nell'ordine</div>
    </div>

    {/* AVVISO IMPORTANTE */}
    <div style={{ background: '#1f1608', border: '1px solid rgba(245,166,35,0.4)', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ fontSize: 18, flexShrink: 0 }}>⚠️</div>
      <div style={{ fontSize: 12, color: '#f5a623', lineHeight: 1.6 }}>
        Chiama il <strong>118</strong> prima di iniziare. Se siete in due, uno chiama e uno inizia la RCP immediatamente.
      </div>
    </div>

    {/* PASSI RCP */}
    {[
      {
        n: 1, emoji: '📞', color: '#e63535', bg: '#2a1010',
        title: 'Chiama il 118',
        desc: 'Chiama subito o fai chiamare qualcuno. Attiva il vivavoce così puoi parlare e agire contemporaneamente.',
        tag: 'PRIORITÀ ASSOLUTA',
        tagColor: '#e63535',
      },
      {
        n: 2, emoji: '👀', color: '#f5a623', bg: '#1f1608',
        title: 'Verifica la risposta',
        desc: 'Scuoti le spalle e chiedi ad alta voce "Stai bene?". Se non risponde e non respira normalmente, inizia la RCP.',
        tag: 'VALUTAZIONE',
        tagColor: '#f5a623',
      },
      {
        n: 3, emoji: '🙌', color: '#22c97a', bg: '#0a1f14',
        title: '30 compressioni toraciche',
        desc: 'Mani sovrapposte al centro del petto, braccia tese. Spingi verso il basso di 5–6 cm a un ritmo di 100–120 al minuto.',
        tag: '100–120 / MIN',
        tagColor: '#22c97a',
      },
      {
        n: 4, emoji: '💨', color: '#3b9eff', bg: '#0c1f2e',
        title: '2 ventilazioni di soccorso',
        desc: 'Inclina la testa all\'indietro, solleva il mento. Soffia nella bocca per 1 secondo finché il petto si solleva visibilmente.',
        tag: '1 SEC PER SOFFIO',
        tagColor: '#3b9eff',
      },
      {
        n: 5, emoji: '🔁', color: '#a78bfa', bg: '#1a1030',
        title: 'Ripeti il ciclo 30:2',
        desc: 'Continua ad alternare 30 compressioni e 2 ventilazioni senza interrompere finché non arrivano i soccorsi.',
        tag: 'NON FERMARTI',
        tagColor: '#a78bfa',
      },
      {
        n: 6, emoji: '⚡', color: '#22c97a', bg: '#0a1f14',
        title: 'Usa il DAE appena disponibile',
        desc: 'Accendi il DAE e segui le istruzioni vocali. Il dispositivo ti guida passo per passo. Non interrompere la RCP mentre si carica.',
        tag: 'SE DISPONIBILE',
        tagColor: '#22c97a',
      },
    ].map((s, i) => (
      <div key={i} style={{ background: s.bg, border: `1px solid ${s.color}33`, borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        {/* Numero e emoji */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 16, color: '#000' }}>{s.n}</div>
          <div style={{ fontSize: 18 }}>{s.emoji}</div>
        </div>
        {/* Testo */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#e8ecf0' }}>{s.title}</div>
            <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 4, fontWeight: 800, background: `${s.tagColor}22`, color: s.tagColor, letterSpacing: 0.5 }}>{s.tag}</span>
          </div>
          <div style={{ fontSize: 13, color: '#a0aab4', lineHeight: 1.7 }}>{s.desc}</div>
        </div>
      </div>
    ))}

    {/* RITMO VISIVO */}
    <div style={{ background: '#111318', border: '1px solid #252b36', borderRadius: 12, padding: '14px 16px' }}>
      <div style={{ fontWeight: 800, fontSize: 13, color: '#e8ecf0', marginBottom: 10 }}>🎵 Ritmo corretto per le compressioni</div>
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} style={{ width: 14, height: 28, borderRadius: 4, background: i % 2 === 0 ? '#e63535' : '#2a1010', border: '1px solid #e6353533' }} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: '#7a8494', textAlign: 'center', marginTop: 8 }}>
        Pensa alla canzone "Stayin' Alive" dei Bee Gees — 100 BPM perfetti
      </div>
    </div>

    {/* FOOTER */}
    <div style={{ fontSize: 11, color: '#7a8494', textAlign: 'center', padding: '8px 0' }}>
      Queste istruzioni seguono le linee guida ERC 2021 · Non sostituiscono un corso certificato BLS
    </div>

  </div>
)} 
 </div>

      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0.8; }
          100% { transform: scale(1.3); opacity: 0; }
        }
      `}</style>
    </div>
  );
}