import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function handleLogin(e) {
    e.preventDefault()
    setError('')

    if (!username || !password) {
      setError('Please enter your username and password.')
      return
    }

    setLoading(true)
    // Placeholder — replace with real API call later
    setTimeout(() => {
      setLoading(false)
      navigate('/patients')
    }, 800)
  }

  return (
    <div className="login-bg">
      <div className="login-card">

        {/* Header */}
        <div className="login-header">
          <div className="login-logo">
            <svg width="58" height="58" viewBox="0 0 58 58" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="29" cy="29" r="27" fill="#0a1a6e" stroke="#4a9eff" strokeWidth="2"/>
              <circle cx="29" cy="29" r="21" fill="#0d2280" stroke="#3a7fd4" strokeWidth="1"/>
              <text x="29" y="35" textAnchor="middle" fill="white" fontSize="17" fontWeight="bold" fontFamily="Georgia, serif">M</text>
              <text x="42" y="23" textAnchor="middle" fill="#4a9eff" fontSize="10" fontWeight="bold" fontFamily="Georgia, serif">1</text>
            </svg>
          </div>
          <div className="login-titles">
            <h1 className="login-system-name">MORESCO-1</h1>
            <p className="login-system-sub">Employee Health Information System</p>
          </div>
        </div>

        <div className="login-divider" />

        {/* Form */}
        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-field">
            <label className="login-label">Username:</label>
            <input
              className="login-input"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="login-field">
            <label className="login-label">Password:</label>
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <div className="login-btn-wrap">
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

export default Login
