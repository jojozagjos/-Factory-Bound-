import { useState } from 'react'
import './LoginScreen.css'

interface LoginScreenProps {
  onLogin: (username: string) => void
}

const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim()) {
      setError('Please enter a username')
      return
    }
    
    if (!password.trim()) {
      setError('Please enter a password')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    // For now, just accept any login
    // In a real implementation, this would validate against a backend
    setError('')
    onLogin(username)
  }

  const handleGuestLogin = () => {
    onLogin('Guest')
  }

  return (
    <div className="login-screen">
      <div className="login-background" />
      
      <div className="login-container">
        <div className="login-header">
          <h1 className="login-title">Factory Bound</h1>
          <p className="login-subtitle">Sign in to save your progress</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button primary">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>

          <button
            type="button"
            className="login-button secondary"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </form>

        <div className="login-divider">
          <span>OR</span>
        </div>

        <button
          type="button"
          className="login-button guest"
          onClick={handleGuestLogin}
        >
          Continue as Guest
        </button>

        <p className="login-note">
          Guest accounts cannot save progress to the cloud.<br/>
          <small>Note: Authentication is currently client-side only for demo purposes.</small>
        </p>
      </div>
    </div>
  )
}

export default LoginScreen
