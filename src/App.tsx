import { useEffect, useState } from 'react'
import { useAuthStore } from './store/authStore'
import { useDataStore } from './store/dataStore'
import LoginPage from './components/LoginPage'
import Sidebar from './components/Sidebar'
import DashboardPage from './pages/DashboardPage'
import RetailersPage from './pages/RetailersPage'
import ContractsPage from './pages/ContractsPage'
import NewContractPage from './pages/NewContractPage'
import UsersPage from './pages/UsersPage'
import { Retailer } from './store/dataStore'

type Page = 'dashboard' | 'retailers' | 'contracts' | 'new-contract' | 'users'

function App() {
  const { isAuthenticated, user } = useAuthStore()
  const { initializeDemoData } = useDataStore()
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [pageData, setPageData] = useState<{ prefillRetailer?: Retailer | null } | null>(null)

  useEffect(() => {
    initializeDemoData()
  }, [initializeDemoData])

  const handleNavigate = (page: string, data?: unknown) => {
    setCurrentPage(page as Page)
    if (data && typeof data === 'object') {
      setPageData(data as { prefillRetailer?: Retailer | null })
    } else {
      setPageData(null)
    }
  }

  if (!isAuthenticated || !user) {
    return <LoginPage />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />
      case 'retailers':
        return <RetailersPage onNavigate={handleNavigate} />
      case 'contracts':
        return <ContractsPage onNavigate={handleNavigate} />
      case 'new-contract':
        return (
          <NewContractPage
            onNavigate={handleNavigate}
            prefillRetailer={pageData?.prefillRetailer}
          />
        )
      case 'users':
        return user.role === 'ADMIN' ? <UsersPage /> : <DashboardPage onNavigate={handleNavigate} />
      default:
        return <DashboardPage onNavigate={handleNavigate} />
    }
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#f8f9fb' }}>
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
      <main className="flex-1 min-h-screen overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  )
}

export default App
