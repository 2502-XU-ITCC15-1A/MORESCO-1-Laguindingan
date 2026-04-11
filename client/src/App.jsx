import { useState } from 'react';
 
const LOGO_SVG = (
  <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="30" cy="30" r="28" fill="#0a1a6e" stroke="#4a9eff" strokeWidth="2"/>
    <circle cx="30" cy="30" r="22" fill="#0d2280" stroke="#3a7fd4" strokeWidth="1"/>
    <text x="30" y="36" textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="Georgia, serif">M</text>
    <text x="44" y="24" textAnchor="middle" fill="#4a9eff" fontSize="10" fontWeight="bold" fontFamily="Georgia, serif">1</text>
  </svg>
);
 
const AVATAR_SVG = (
  <svg viewBox="0 0 80 90" fill="none" xmlns="http://www.w3.org/2000/svg" style={{width:'100%',height:'100%'}}>
    <circle cx="40" cy="28" r="18" fill="#5a7ab5"/>
    <path d="M5 85 Q5 55 40 55 Q75 55 75 85" fill="#5a7ab5"/>
  </svg>
);
 
function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
 
  function handleLogin(e) {
    e.preventDefault();
    setError('');
    if (!username || !password) { setError('Please enter username and password.'); return; }
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(username); }, 800);
  }
 
  return (
    <div style={s.loginBg}>
      <div style={s.loginCard}>
        {/* Header */}
        <div style={s.loginHeader}>
          <div style={s.loginLogoWrap}>{LOGO_SVG}</div>
          <div style={s.loginTitles}>
            <h1 style={s.loginTitle}>MORESCO-1</h1>
            <p style={s.loginSubtitle}>Employee Health Information System</p>
          </div>
        </div>
 
        <div style={s.loginDivider}/>
 
        {/* Form */}
        <form onSubmit={handleLogin} style={s.loginForm}>
          <div style={s.loginRow}>
            <label style={s.loginLabel}>Username:</label>
            <input
              style={s.loginInput}
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div style={s.loginRow}>
            <label style={s.loginLabel}>Password:</label>
            <input
              type="password"
              style={s.loginInput}
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {error && <p style={s.loginError}>{error}</p>}
          <div style={{textAlign:'center', marginTop: '2rem'}}>
            <button type="submit" style={s.loginBtn} disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
 
function PatientsPage({ username, onLogout }) {
  const dummyPatients = Array(12).fill({ name: 'Mine Galve', id: '202328521814', role: 'Electric Specialist' });
 
  return (
    <div style={s.appBg}>
      {/* Top Nav */}
      <div style={s.navbar}>
        <div style={s.navLeft}>
          <div style={s.navLogo}>{LOGO_SVG}</div>
          <div>
            <div style={s.navBrand}>Moresco 1</div>
            <div style={s.navBrandSub}>Employee Health Record System</div>
          </div>
        </div>
        <div style={s.navCenter}>
          <button style={s.navTab}>Patients</button>
        </div>
        <div style={s.navRight}>
          <div>
            <div style={s.navUser}>{username || 'Andrei Valdez'}</div>
            <div style={s.navUserRole}>CEO of Nursing</div>
          </div>
          <button onClick={onLogout} style={s.logoutBtn}>Logout</button>
        </div>
      </div>
 
      {/* Content */}
      <div style={s.pageContent}>
        {/* Search & Sort */}
        <div style={s.toolbar}>
          <input placeholder="Search" style={s.searchInput}/>
          <button style={s.sortBtn}>Sort ▼</button>
        </div>
 
        {/* Patient Grid */}
        <div style={s.patientGrid}>
          {dummyPatients.map((p, i) => (
            <div key={i} style={s.patientCard}>
              <div style={s.patientAvatar}>{AVATAR_SVG}</div>
              <div style={s.patientName}>{p.name}</div>
              <div style={s.patientId}>{p.id}</div>
              <div style={s.patientRole}>{p.role}</div>
            </div>
          ))}
        </div>
 
        {/* Pagination */}
        <div style={s.pagination}>
          <span style={s.pageBtn}>{'<'}</span>
          {[1,2,3,4,'...',10].map((n,i) => (
            <span key={i} style={n===1 ? {...s.pageBtn,...s.pageBtnActive} : s.pageBtn}>{n}</span>
          ))}
          <span style={s.pageBtn}>{'>'}</span>
        </div>
      </div>
 
      {/* FAB */}
      <button style={s.fab}>+</button>
    </div>
  );
}
 
export default function App() {
  const [user, setUser] = useState(null);
  if (!user) return <LoginPage onLogin={setUser}/>;
  return <PatientsPage username={user} onLogout={() => setUser(null)}/>;
}
 
// ── Styles ───────────────────────────────────────────────────────
const NAVY   = '#0a1565';
const NAVY2  = '#0d1f8c';
const NAVY3  = '#0a1245';
const BLUE   = '#1a2fa0';
const ACCENT = '#4a7fd4';
const WHITE  = '#ffffff';
const LIGHT  = '#c8d8f0';
 
const s = {
  // Login
  loginBg: {
    minHeight: '100vh', background: '#1a1a2e',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Georgia', serif",
  },
  loginCard: {
    background: `linear-gradient(160deg, ${NAVY2} 0%, ${NAVY3} 100%)`,
    border: `1px solid ${ACCENT}44`,
    borderRadius: 4, padding: '2.5rem 3rem', width: 480,
    boxShadow: '0 8px 40px rgba(0,0,50,0.6)',
  },
  loginHeader: { display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1rem' },
  loginLogoWrap: { flexShrink: 0 },
  loginTitles: {},
  loginTitle: { margin: 0, color: WHITE, fontSize: '1.8rem', fontWeight: 'bold', letterSpacing: 2 },
  loginSubtitle: { margin: '4px 0 0', color: LIGHT, fontSize: '0.85rem', fontWeight: 'normal' },
  loginDivider: { height: 1, background: `${ACCENT}55`, margin: '1.2rem 0 1.8rem' },
  loginForm: {},
  loginRow: { display: 'flex', alignItems: 'center', marginBottom: '1.1rem', gap: '1rem' },
  loginLabel: { color: WHITE, fontSize: '0.95rem', width: 90, textAlign: 'right', flexShrink: 0 },
  loginInput: {
    flex: 1, padding: '6px 10px', background: WHITE,
    border: 'none', borderRadius: 2, fontSize: '0.95rem', outline: 'none',
  },
  loginError: { color: '#ff8888', fontSize: '0.85rem', textAlign: 'center', margin: '0.5rem 0 0' },
  loginBtn: {
    background: WHITE, color: NAVY3, border: 'none', borderRadius: 3,
    padding: '10px 60px', fontSize: '1rem', fontWeight: 'bold',
    cursor: 'pointer', fontFamily: 'Georgia, serif', letterSpacing: 1,
  },
 
  // App shell
  appBg: {
    minHeight: '100vh', background: '#1a1a2e',
    fontFamily: "'Georgia', serif", position: 'relative',
  },
 
  // Navbar
  navbar: {
    background: `linear-gradient(90deg, ${NAVY3} 0%, ${NAVY2} 100%)`,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0.6rem 1.5rem', borderBottom: `2px solid ${ACCENT}44`,
    boxShadow: '0 2px 12px rgba(0,0,50,0.5)',
  },
  navLeft: { display: 'flex', alignItems: 'center', gap: '0.8rem' },
  navLogo: {},
  navBrand: { color: WHITE, fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: 1 },
  navBrandSub: { color: LIGHT, fontSize: '0.7rem' },
  navCenter: { flex: 1, display: 'flex', justifyContent: 'center' },
  navTab: {
    background: ACCENT, color: WHITE, border: 'none',
    padding: '8px 32px', borderRadius: 2, fontSize: '0.95rem',
    cursor: 'pointer', fontFamily: 'Georgia, serif',
  },
  navRight: { display: 'flex', alignItems: 'center', gap: '1rem' },
  navUser: { color: WHITE, fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'right' },
  navUserRole: { color: LIGHT, fontSize: '0.7rem', textAlign: 'right' },
  logoutBtn: {
    background: 'transparent', color: LIGHT, border: `1px solid ${ACCENT}66`,
    padding: '4px 12px', borderRadius: 2, cursor: 'pointer', fontSize: '0.8rem',
  },
 
  // Page
  pageContent: { padding: '1.2rem 1.5rem' },
  toolbar: { display: 'flex', gap: '0.5rem', marginBottom: '1rem' },
  searchInput: {
    padding: '5px 10px', borderRadius: 2, border: '1px solid #ccc',
    fontSize: '0.9rem', width: 180,
  },
  sortBtn: {
    background: BLUE, color: WHITE, border: 'none',
    padding: '5px 14px', borderRadius: 2, cursor: 'pointer', fontSize: '0.85rem',
  },
 
  // Grid
  patientGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: '0.8rem',
    background: `linear-gradient(160deg, ${NAVY2} 0%, ${NAVY3} 100%)`,
    border: `1px solid ${ACCENT}33`, borderRadius: 4, padding: '1rem',
  },
  patientCard: {
    background: BLUE, borderRadius: 3, padding: '0.8rem 0.5rem',
    textAlign: 'center', cursor: 'pointer',
    transition: 'transform 0.15s',
  },
  patientAvatar: {
    width: 60, height: 68, margin: '0 auto 0.5rem',
    background: '#2a3f80', borderRadius: 3, overflow: 'hidden',
  },
  patientName: { color: WHITE, fontSize: '0.8rem', fontWeight: 'bold' },
  patientId: { color: LIGHT, fontSize: '0.65rem', margin: '2px 0' },
  patientRole: { color: LIGHT, fontSize: '0.65rem' },
 
  // Pagination
  pagination: {
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    gap: '0.3rem', marginTop: '1rem',
  },
  pageBtn: {
    color: LIGHT, padding: '4px 10px', cursor: 'pointer',
    fontSize: '0.85rem', borderRadius: 2,
  },
  pageBtnActive: { background: ACCENT, color: WHITE },
 
  // FAB
  fab: {
    position: 'fixed', bottom: '2rem', right: '2rem',
    width: 48, height: 48, borderRadius: '50%',
    background: ACCENT, color: WHITE, border: 'none',
    fontSize: '1.8rem', cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0,0,80,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
};
 