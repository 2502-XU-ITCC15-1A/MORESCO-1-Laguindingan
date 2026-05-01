import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../../api/client.js'
import moresco1Logo from '../../assets/logo.png'
import './Login.css'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setError('')

    if (!username || !password) {
      setError('Please enter your username and password.')
      return
    }

    setLoading(true)
    try {
      const { token, user } = await authAPI.login(username.trim(), password)
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      navigate('/patients')
    } catch (err) {
      setError(err.message || 'Invalid username or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-bg">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-wrap">
            <img src={moresco1Logo} alt="Moresco 1 Logo" className="login-logo-img" />
          </div>
          <div className="login-titles">
            <h1 className="login-system-name">MORESCO-1</h1>
            <p className="login-system-sub">Employee Health Information System</p>
          </div>
        </div>

        <div className="login-divider" />

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
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Login
