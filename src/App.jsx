import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login/Login.jsx'
import Patients from './pages/Patients/Patients.jsx'
import Profile from './pages/Profile/Profile.jsx'
import UserAccess from './pages/UserAccess/UserAccess.jsx'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/user-access" element={<UserAccess />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
