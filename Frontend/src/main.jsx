import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import CheckAuth  from "@/lib/CheakAuth.jsx"
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Home from './Pages/Home.jsx'
import Login from './Pages/Login.jsx'
import Signup from './Pages/Signup.jsx'
import Dasktop from './Pages/Dasktop.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google'

createRoot(document.getElementById('root')).render(
  <StrictMode>
     <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
    <BrowserRouter>
    <Routes>
     <Route
          path="/"
          element={
            <CheckAuth requireAuth={false}>
              <Home />
            </CheckAuth>
          }
        />
        <Route
          path="/login"
          element={
            <CheckAuth requireAuth={false}>
              <Login />
            </CheckAuth>
          }
        />
        <Route
          path="/signup"
          element={
            <CheckAuth requireAuth={false}>
              <Signup />
            </CheckAuth>
          }
        />
        <Route
          path="/dashboard"
          element={
            <CheckAuth requireAuth={false}>
              <Dasktop />
            </CheckAuth>
          }
        />
    </Routes>
    </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>,
)
