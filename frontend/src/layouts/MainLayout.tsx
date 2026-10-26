import React from 'react'
import { Outlet } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { BottomNav } from '../components/BottomNav'
import { OfflineBanner } from '../components/OfflineBanner'
import { AppLockModal } from '../components/AppLockModal'
import { useAuth } from '../context/AuthContext'

export const MainLayout: React.FC = () => {
  const { isLocked, isAuthenticated } = useAuth()

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-200">
      <OfflineBanner />
      <Navbar />
      
      {isLocked && isAuthenticated && <AppLockModal />}

      <main className="flex-1 pb-20 md:pb-8">
        <Outlet />
      </main>

      <BottomNav />
    </div>
  )
}
