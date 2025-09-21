import React from 'react'

interface HeaderProps {
  currentView: 'store' | 'workspace'
  onViewChange: (view: 'store' | 'workspace') => void
  installedCount: number
}

const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, installedCount }) => {
  return (
    <header style={{
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      padding: '1rem 2rem',
      borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <h1 style={{ 
          color: 'white', 
          fontSize: '24px', 
          fontWeight: '700',
          margin: 0 
        }}>
          🎯 模块化求职平台
        </h1>
        <p style={{ 
          color: 'rgba(255, 255, 255, 0.8)', 
          fontSize: '14px',
          margin: '4px 0 0 0' 
        }}>
          像组装电脑一样管理你的求职工具
        </p>
      </div>

      <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <button
          className={`btn ${currentView === 'store' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => onViewChange('store')}
          style={{ fontSize: '14px' }}
        >
          🏪 模块商店
        </button>
        
        <button
          className={`btn ${currentView === 'workspace' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => onViewChange('workspace')}
          style={{ 
            fontSize: '14px',
            position: 'relative'
          }}
        >
          🔧 我的工作台
          {installedCount > 0 && (
            <span style={{
              background: '#ff4757',
              color: 'white',
              borderRadius: '10px',
              padding: '2px 6px',
              fontSize: '10px',
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              minWidth: '18px',
              textAlign: 'center'
            }}>
              {installedCount}
            </span>
          )}
        </button>
      </nav>
    </header>
  )
}

export default Header