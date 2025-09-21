import React, { useState } from 'react'
import { ModuleInfo, InstalledModule } from '../types'
import ModuleCard from './ModuleCard'

interface ModuleStoreProps {
  modules: ModuleInfo[]
  installedModules: InstalledModule[]
  onInstall: (moduleId: string) => void
  onUninstall: (moduleId: string) => void
}

const ModuleStore: React.FC<ModuleStoreProps> = ({ 
  modules, 
  installedModules, 
  onInstall, 
  onUninstall 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // 创建示例模块数据（如果后端还没有数据的话）
  const exampleModules: ModuleInfo[] = modules.length > 0 ? modules : [
    {
      id: 'job-tracker-basic',
      name: 'job-tracker-basic',
      displayName: '基础求职追踪器',
      description: '完整的求职申请管理系统，支持工作状态追踪、公司管理、时间线记录和统计分析',
      version: '1.0.0',
      type: 'core-module',
      category: 'tracking',
      icon: '📋',
      features: [
        '工作申请CRUD管理',
        '申请状态追踪',
        '公司信息管理',
        '时间线记录',
        '统计图表分析',
        '搜索和筛选'
      ],
      author: 'Platform Team',
      rating: 4.8,
      downloadCount: 1200
    },
    {
      id: 'jd-resume-compare',
      name: 'jd-resume-compare',
      displayName: 'JD-简历对比分析',
      description: 'AI驱动的职位描述与简历匹配度分析，帮助识别技能差距和优化简历',
      version: '1.0.0',
      type: 'enhancement-module',
      category: 'analysis',
      icon: '🤖',
      features: [
        'AI技能匹配分析',
        '技能差距识别',
        '简历优化建议',
        '关键词高亮',
        '匹配度评分'
      ],
      author: 'AI Team',
      rating: 4.6,
      downloadCount: 856
    },
    {
      id: 'ocr-scanner',
      name: 'ocr-scanner',
      displayName: 'OCR智能扫描',
      description: '图片文字识别工具，快速提取招聘海报、邮件截图中的职位信息',
      version: '1.0.0',
      type: 'integration-module',
      category: 'automation',
      icon: '📷',
      features: [
        '图片文字识别',
        '智能信息提取',
        '批量处理',
        '多格式支持',
        '结果导出'
      ],
      author: 'Vision Team',
      rating: 4.4,
      downloadCount: 642
    },
    {
      id: 'linkedin-sync',
      name: 'linkedin-sync',
      displayName: 'LinkedIn同步',
      description: '自动同步LinkedIn上的工作申请和联系人信息到平台',
      version: '1.0.0',
      type: 'integration-module',
      category: 'integration',
      icon: '🔗',
      features: [
        'LinkedIn数据同步',
        '联系人管理',
        '自动更新',
        '隐私保护',
        '批量导入'
      ],
      author: 'Integration Team',
      rating: 4.7,
      downloadCount: 934
    }
  ]

  const categories = [
    { id: 'all', name: '全部模块', icon: '📦' },
    { id: 'tracking', name: '追踪管理', icon: '📋' },
    { id: 'analysis', name: '分析工具', icon: '📊' },
    { id: 'automation', name: '自动化', icon: '⚡' },
    { id: 'integration', name: '集成工具', icon: '🔗' }
  ]

  const filteredModules = exampleModules.filter(module => {
    const matchesCategory = selectedCategory === 'all' || module.category === selectedCategory
    const matchesSearch = module.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const isModuleInstalled = (moduleId: string) => {
    return installedModules.some(m => m.id === moduleId)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '24px'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* 现代化标题区域 */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          padding: '32px',
          marginBottom: '32px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.3)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{
                margin: 0,
                fontSize: '32px',
                fontWeight: '800',
                color: '#1f2937',
                letterSpacing: '-0.025em',
                lineHeight: '1.2'
              }}>
                🏪 模块商店
              </h1>
              <p style={{
                margin: '8px 0 0 0',
                fontSize: '16px',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                发现强大的模块，扩展你的求职工具箱
              </p>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '16px',
              padding: '12px 20px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}>
              {filteredModules.length} 个可用模块
            </div>
          </div>

          {/* 搜索栏 */}
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <input
              type="text"
              placeholder="搜索模块名称、功能或描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '16px 20px 16px 52px',
                border: '2px solid rgba(102, 126, 234, 0.1)',
                borderRadius: '16px',
                background: 'rgba(102, 126, 234, 0.05)',
                fontSize: '16px',
                fontWeight: '500',
                color: '#1f2937',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(102, 126, 234, 0.3)'
                e.target.style.background = 'white'
                e.target.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.15)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(102, 126, 234, 0.1)'
                e.target.style.background = 'rgba(102, 126, 234, 0.05)'
                e.target.style.boxShadow = 'none'
              }}
            />
            <div style={{
              position: 'absolute',
              left: '18px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '20px',
              color: '#9ca3af'
            }}>
              🔍
            </div>
          </div>

          {/* 分类筛选 */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {categories.map(category => {
              const isSelected = selectedCategory === category.id
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  style={{
                    background: isSelected
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'rgba(107, 114, 128, 0.1)',
                    color: isSelected ? 'white' : '#6b7280',
                    border: isSelected ? 'none' : '1px solid rgba(107, 114, 128, 0.2)',
                    borderRadius: '12px',
                    padding: '10px 16px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(107, 114, 128, 0.15)'
                      e.currentTarget.style.borderColor = 'rgba(107, 114, 128, 0.3)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(107, 114, 128, 0.1)'
                      e.currentTarget.style.borderColor = 'rgba(107, 114, 128, 0.2)'
                    }
                  }}
                >
                  <span style={{ marginRight: '8px' }}>{category.icon}</span>
                  {category.name}
                </button>
              )
            })}
          </div>
        </div>

        {/* 模块网格 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {filteredModules.map(module => (
            <ModuleCard
              key={module.id}
              module={module}
              isInstalled={isModuleInstalled(module.id)}
              onInstall={onInstall}
              onUninstall={onUninstall}
              isDragMode={true}
            />
          ))}
        </div>

        {/* 空状态 */}
        {filteredModules.length === 0 && (
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            padding: '64px 32px',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🔍</div>
            <h3 style={{
              margin: '0 0 8px 0',
              fontSize: '24px',
              fontWeight: '700',
              color: '#1f2937'
            }}>
              没有找到匹配的模块
            </h3>
            <p style={{
              margin: 0,
              fontSize: '16px',
              color: '#6b7280'
            }}>
              试试调整搜索关键词或选择不同的分类
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ModuleStore