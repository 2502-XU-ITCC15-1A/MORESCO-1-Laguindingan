import { useEffect, useState } from 'react'
import IconButton from '@mui/material/IconButton'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import NavBar from '../../components/NavBar/NavBar.jsx'
import { accessAPI } from '../../api/client.js'
import { canManageUserAccess } from '../../utils/roles.js'
import './UserAccess.css'

const ROLE_OPTIONS = ['HR Admin', 'Company Nurse', 'IT Manager']
const STATUS_OPTIONS = ['active', 'inactive']
const PROTECTED_DEFAULT_EMAILS = new Set(['itmanager@moresco.local'])

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}')
  } catch {
    return {}
  }
}

function createEmptyForm() {
  return {
    username: '',
    email: '',
    password: '',
    role: 'Company Nurse',
    accessStatus: 'active',
  }
}

function isProtectedDefaultUser(user) {
  return PROTECTED_DEFAULT_EMAILS.has(String(user?.email || '').trim().toLowerCase())
}

function formatDateTime(value) {
  if (!value) return 'Not yet'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Not yet' : date.toLocaleString()
}

function UserAccess() {
  const currentUser = getCurrentUser()
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(createEmptyForm())
  const [editingUserId, setEditingUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [workingUserId, setWorkingUserId] = useState(null)
  const [menuAnchorEl, setMenuAnchorEl] = useState(null)
  const [menuUser, setMenuUser] = useState(null)
  const editingProtectedUser = users.find(user => user.id === editingUserId && isProtectedDefaultUser(user))
  const menuUserProtected = isProtectedDefaultUser(menuUser)

  const isAllowed = canManageUserAccess(currentUser.role)

  async function loadUsers() {
    if (!isAllowed) return

    setLoading(true)
    setError('')
    try {
      const data = await accessAPI.getUsers()
      setUsers(data)
    } catch (err) {
      setError(err.message || 'Unable to load users.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAllowed) {
      setLoading(false)
      return
    }

    loadUsers()
  }, [isAllowed])

  function handleFieldChange(field, value) {
    setForm(current => ({ ...current, [field]: value }))
  }

  function resetForm() {
    setForm(createEmptyForm())
    setEditingUserId(null)
  }

  function openMenu(event, user) {
    setMenuAnchorEl(event.currentTarget)
    setMenuUser(user)
  }

  function closeMenu() {
    setMenuAnchorEl(null)
    setMenuUser(null)
  }

  function handleEditUser() {
    if (!menuUser) return

    setForm({
      username: menuUser.username || '',
      email: menuUser.email || '',
      password: '',
      role: menuUser.role || 'Company Nurse',
      accessStatus: menuUser.accessStatus || 'active',
    })
    setEditingUserId(menuUser.id)
    setMessage('')
    setError('')
    closeMenu()
  }

  async function handleDeleteUser() {
    if (!menuUser) return
    const selectedUser = menuUser
    closeMenu()

    if (isProtectedDefaultUser(selectedUser)) {
      setError('The default IT Manager account cannot be deleted.')
      return
    }

    if (!window.confirm(`Delete the account for ${selectedUser.username}?`)) {
      return
    }

    setWorkingUserId(selectedUser.id)
    setError('')
    setMessage('')

    try {
      const result = await accessAPI.deleteUser(selectedUser.id)
      setMessage(result.message || 'User deleted successfully.')
      if (editingUserId === selectedUser.id) resetForm()
      await loadUsers()
    } catch (err) {
      setError(err.message || 'Unable to delete user.')
    } finally {
      setWorkingUserId(null)
    }
  }

  async function handleToggleStatus() {
    if (!menuUser) return
    const selectedUser = menuUser
    closeMenu()

    if (isProtectedDefaultUser(selectedUser)) {
      setError('The default IT Manager account must remain active.')
      return
    }

    const nextStatus = selectedUser.accessStatus === 'active' ? 'inactive' : 'active'
    setWorkingUserId(selectedUser.id)
    setError('')
    setMessage('')

    try {
      const result = await accessAPI.updateUser(selectedUser.id, {
        username: selectedUser.username,
        email: selectedUser.email,
        role: selectedUser.role,
        accessStatus: nextStatus,
        password: '',
      })
      setMessage(result.message || 'User access updated successfully.')
      await loadUsers()
    } catch (err) {
      setError(err.message || 'Unable to update user access.')
    } finally {
      setWorkingUserId(null)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    setMessage('')

    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
        accessStatus: form.accessStatus,
      }

      const result = editingUserId
        ? await accessAPI.updateUser(editingUserId, payload)
        : await accessAPI.createUser(payload)

      setMessage(result.message || (editingUserId ? 'User updated.' : 'User created.'))
      resetForm()
      await loadUsers()
    } catch (err) {
      setError(err.message || 'Unable to save the user account.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAllowed) {
    return (
      <div className="user-access-shell">
        <NavBar showDrawer={false} />
        <main className="user-access-page">
          <section className="user-access-card">
            <h1>User Access</h1>
            <p>Only the IT Manager can manage account access.</p>
          </section>
        </main>
      </div>
    )
  }

  return (
    <div className="user-access-shell">
      <NavBar showDrawer={false} />
      <main className="user-access-page">
        <section className="user-access-card user-access-intro">
          <p className="user-access-eyebrow">IT Manager</p>
          <h1>User Access</h1>
          <p className="user-access-copy">
            Create user accounts directly, adjust their roles, and disable or delete access when needed.
          </p>
        </section>

        <section className="user-access-card">
          <div className="user-access-form-head">
            <div>
              <h2>{editingUserId ? 'Edit Account' : 'Create Account'}</h2>
              <p>
                {editingUserId
                  ? 'Update the account details below. Leave password blank if you do not want to change it.'
                  : 'The IT Manager creates the account directly and shares the username and password with the assigned user.'}
              </p>
            </div>
            {editingUserId && (
              <button type="button" className="ghost-btn" onClick={resetForm}>
                Cancel Edit
              </button>
            )}
          </div>

          <form className="user-access-form" onSubmit={handleSubmit}>
            <label className="user-access-field">
              <span>Username</span>
              <input
                type="text"
                placeholder="employee.username"
                value={form.username}
                onChange={event => handleFieldChange('username', event.target.value)}
                required
              />
            </label>

            <label className="user-access-field">
              <span>Email address</span>
              <input
                type="email"
                placeholder="employee@email.com"
                value={form.email}
                onChange={event => handleFieldChange('email', event.target.value)}
                required
              />
            </label>

            <label className="user-access-field">
              <span>{editingUserId ? 'New password' : 'Password'}</span>
              <input
                type="password"
                placeholder={editingUserId ? 'Leave blank to keep current password' : 'At least 8 characters'}
                value={form.password}
                onChange={event => handleFieldChange('password', event.target.value)}
                required={!editingUserId}
              />
            </label>

            <label className="user-access-field">
              <span>Role</span>
              <select value={form.role} onChange={event => handleFieldChange('role', event.target.value)}>
                {ROLE_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="user-access-field">
              <span>Status</span>
              <select
                value={form.accessStatus}
                onChange={event => handleFieldChange('accessStatus', event.target.value)}
                disabled={Boolean(editingProtectedUser)}
              >
                {(editingProtectedUser ? ['active'] : STATUS_OPTIONS).map(option => (
                  <option key={option} value={option}>
                    {option === 'active' ? 'Active' : 'Inactive'}
                  </option>
                ))}
              </select>
            </label>

            <button type="submit" className="primary-btn" disabled={submitting}>
              {submitting ? 'Saving...' : editingUserId ? 'Save Changes' : 'Create Account'}
            </button>
          </form>

          {message && <p className="user-access-message success">{message}</p>}
          {error && <p className="user-access-message error">{error}</p>}
        </section>

        <section className="user-access-card">
          <div className="user-access-table-head">
            <h2>System Users</h2>
            <button type="button" className="primary-btn compact" onClick={loadUsers}>
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="user-access-empty">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="user-access-empty">No users found.</div>
          ) : (
            <div className="user-access-table">
              <div className="user-access-row header">
                <span>Account</span>
                <span>Role</span>
                <span>Status</span>
                <span>Created</span>
                <span>Last Updated</span>
                <span>Action</span>
              </div>

              {users.map(user => (
                <div className="user-access-row" key={user.id}>
                  <span className="user-access-identity">
                    <strong>{user.email || user.username}</strong>
                    <small>{user.username}</small>
                  </span>
                  <span>{user.role}</span>
                  <span className={`status-${String(user.accessStatus || '').toLowerCase()}`}>
                    {user.accessStatus}
                  </span>
                  <span>{formatDateTime(user.createdAt)}</span>
                  <span>{formatDateTime(user.updatedAt)}</span>
                  <span className="user-access-actions">
                    <IconButton
                      aria-label={`Actions for ${user.username}`}
                      className="user-access-menu-btn"
                      onClick={event => openMenu(event, user)}
                      disabled={workingUserId === user.id}
                    >
                      <span className="user-access-menu-dots">...</span>
                    </IconButton>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={closeMenu}>
          <MenuItem onClick={handleEditUser}>Edit account</MenuItem>
          {!menuUserProtected && (
            <MenuItem onClick={handleToggleStatus}>
              {menuUser?.accessStatus === 'active' ? 'Set inactive' : 'Set active'}
            </MenuItem>
          )}
          {!menuUserProtected && (
            <MenuItem
              onClick={handleDeleteUser}
              sx={{ color: '#b23434' }}
              disabled={menuUser?.id === currentUser.id}
            >
              Delete account
            </MenuItem>
          )}
        </Menu>
      </main>
    </div>
  )
}

export default UserAccess
