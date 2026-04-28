import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const navigate = useNavigate()

  function handleLogin(e) {
    e.preventDefault()
    setError('')
    if (!username || !password) {
      setError('Please enter your username and password.')
      return
    }
    setLoading(true)
    // Replace with real API call when backend is ready
    setTimeout(() => {
      setLoading(false)
      navigate('/patients')
    }, 900)
  }

  return (
    <div className="login-bg">
      <div className="login-card">

        {/* Header */}
        <div className="login-header">
          <div className="login-logo-wrap">
            {/* Inline SVG logo matching the M1 circle icon */}
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="32" cy="32" r="32" fill="#0D2B77"/>
              <circle cx="32" cy="32" r="29" stroke="#4a9fff" strokeWidth="1.5" fill="none"/>
              <text x="32" y="40" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">M1</text>
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
              placeholder="Enter username"
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
              placeholder="Enter password"
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <div className="login-btn-wrap">
            <button className="login-btn" type="submit" disabled={loading}>
              {loading ? 'Logging in…' : 'Login'}
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}

export default Login
