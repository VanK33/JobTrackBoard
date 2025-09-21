import React, { useState, useEffect } from 'react'

interface JobFile {
  id: string
  name: string
  type: 'resume' | 'cover-letter' | 'portfolio' | 'job-description' | 'other'
  mimeType: string
  size: number
  url: string
  uploadedAt: string
}

interface Job {
  _id: string
  title: string
  company: string
  location: string
  jobDescription?: string
  requirements?: string[]
  responsibilities?: string[]
  qualifications?: string[]
  status: 'interested' | 'applied' | 'interviewing' | 'offered' | 'rejected'
  jobUrl?: string
  notes?: string
  files?: JobFile[]
  appliedAt?: string
  createdAt: string
  updatedAt: string
}

interface JobFormData {
  title: string
  company: string
  location: string
  jobDescription: string
  requirements: string
  responsibilities: string
  qualifications: string
  status: 'interested' | 'applied' | 'interviewing' | 'offered' | 'rejected'
  jobUrl: string
  notes: string
}

const JobTrackerModule: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'board' | 'list' | 'stats'>('board')
  const [showForm, setShowForm] = useState(false)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    company: '',
    location: '',
    jobDescription: '',
    requirements: '',
    responsibilities: '',
    qualifications: '',
    status: 'interested',
    jobUrl: '',
    notes: ''
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)

  const statusConfig = {
    interested: { label: '感兴趣', color: '#6b7280', icon: '👀' },
    applied: { label: '已申请', color: '#3b82f6', icon: '📝' },
    interviewing: { label: '面试中', color: '#f59e0b', icon: '🗣️' },
    offered: { label: '收到Offer', color: '#10b981', icon: '🎉' },
    rejected: { label: '被拒绝', color: '#ef4444', icon: '❌' }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs')
      const data = await response.json()
      setJobs(data)
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const method = editingJob ? 'PUT' : 'POST'
      const url = editingJob ? `/api/jobs/${editingJob._id}` : '/api/jobs'

      // 准备提交数据，将文本字段转换为数组
      const submitData = {
        ...formData,
        requirements: formData.requirements.split('\n').filter(r => r.trim()),
        responsibilities: formData.responsibilities.split('\n').filter(r => r.trim()),
        qualifications: formData.qualifications.split('\n').filter(q => q.trim())
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      })

      const result = await response.json()

      // 如果有文件需要上传且Job创建/更新成功
      if (selectedFiles.length > 0 && result.success) {
        const jobId = editingJob ? editingJob._id : result.data.id
        await uploadFiles(jobId)
      }

      await fetchJobs()
      setShowForm(false)
      setEditingJob(null)
      setFormData({
        title: '',
        company: '',
        location: '',
        jobDescription: '',
        requirements: '',
        responsibilities: '',
        qualifications: '',
        status: 'interested',
        jobUrl: '',
        notes: ''
      })
      setSelectedFiles([])
    } catch (error) {
      console.error('Failed to save job:', error)
    }
  }

  const handleEdit = (job: Job) => {
    setEditingJob(job)
    setFormData({
      title: job.title,
      company: job.company,
      location: job.location,
      jobDescription: job.jobDescription || '',
      requirements: job.requirements?.join('\n') || '',
      responsibilities: job.responsibilities?.join('\n') || '',
      qualifications: job.qualifications?.join('\n') || '',
      status: job.status,
      jobUrl: job.jobUrl || '',
      notes: job.notes || ''
    })
    setShowForm(true)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const uploadFiles = async (jobId: string) => {
    if (selectedFiles.length === 0) return

    setUploadingFiles(true)
    try {
      for (const file of selectedFiles) {
        const reader = new FileReader()
        reader.onload = async () => {
          const base64Data = reader.result?.toString().split(',')[1]
          await fetch(`/api/jobs/${jobId}/files`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.name.toLowerCase().includes('resume') ? 'resume' : 'other',
              mimeType: file.type,
              fileData: base64Data
            })
          })
        }
        reader.readAsDataURL(file)
      }
      setSelectedFiles([])
    } catch (error) {
      console.error('Failed to upload files:', error)
    } finally {
      setUploadingFiles(false)
    }
  }

  const handleDelete = async (jobId: string) => {
    if (confirm('确定要删除这个工作申请吗？')) {
      try {
        await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' })
        await fetchJobs()
      } catch (error) {
        console.error('Failed to delete job:', error)
      }
    }
  }

  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      await fetch(`/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      await fetchJobs()
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const groupJobsByStatus = () => {
    const grouped: Record<string, Job[]> = {}
    Object.keys(statusConfig).forEach(status => {
      grouped[status] = jobs.filter(job => job.status === status)
    })
    return grouped
  }

  const getStats = () => {
    return {
      total: jobs.length,
      interested: jobs.filter(j => j.status === 'interested').length,
      applied: jobs.filter(j => j.status === 'applied').length,
      interviewing: jobs.filter(j => j.status === 'interviewing').length,
      offered: jobs.filter(j => j.status === 'offered').length,
      rejected: jobs.filter(j => j.status === 'rejected').length,
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>加载中...</div>
  }

  return (
    <div>
      {/* 头部工具栏 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        padding: '1rem',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px'
      }}>
        <div>
          <h2 style={{ color: 'white', margin: 0, fontSize: '20px' }}>
            📋 求职追踪器
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', margin: '4px 0 0 0' }}>
            管理你的求职申请和面试进程
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* 视图切换 */}
          <div style={{ display: 'flex', gap: '4px' }}>
            {[
              { key: 'board', label: '看板', icon: '📊' },
              { key: 'list', label: '列表', icon: '📝' },
              { key: 'stats', label: '统计', icon: '📈' }
            ].map(viewOption => (
              <button
                key={viewOption.key}
                onClick={() => setView(viewOption.key as any)}
                className={`btn ${view === viewOption.key ? 'btn-primary' : 'btn-secondary'}`}
                style={{ fontSize: '12px', padding: '8px 12px' }}
              >
                {viewOption.icon} {viewOption.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary"
            style={{ fontSize: '14px' }}
          >
            ➕ 添加工作
          </button>
        </div>
      </div>

      {/* 看板视图 */}
      {view === 'board' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem'
        }}>
          {Object.entries(groupJobsByStatus()).map(([status, statusJobs]) => (
            <div key={status} className="card" style={{ padding: '1rem' }}>
              <h3 style={{
                margin: '0 0 1rem 0',
                fontSize: '16px',
                color: statusConfig[status as keyof typeof statusConfig].color,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                {statusConfig[status as keyof typeof statusConfig].icon}
                {statusConfig[status as keyof typeof statusConfig].label}
                <span style={{
                  background: statusConfig[status as keyof typeof statusConfig].color,
                  color: 'white',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {statusJobs.length}
                </span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {statusJobs.map(job => (
                  <div
                    key={job._id}
                    style={{
                      padding: '12px',
                      background: '#f8f9fa',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600' }}>
                          {job.title}
                        </h4>
                        <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#666' }}>
                          {job.company} • {job.location}
                        </p>
                        {job.notes && (
                          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#888' }}>
                            {job.notes.substring(0, 60)}{job.notes.length > 60 ? '...' : ''}
                          </p>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => handleEdit(job)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '12px',
                            opacity: 0.7
                          }}
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(job._id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '12px',
                            opacity: 0.7
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* 状态快速切换 */}
                    <select
                      value={job.status}
                      onChange={(e) => handleStatusChange(job._id, e.target.value)}
                      style={{
                        marginTop: '8px',
                        width: '100%',
                        padding: '4px 8px',
                        fontSize: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                      }}
                    >
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.icon} {config.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 列表视图 */}
      {view === 'list' && (
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e9ecef' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px' }}>职位</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px' }}>公司</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px' }}>地点</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px' }}>状态</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px' }}>操作</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job._id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                    <td style={{ padding: '12px', fontSize: '14px' }}>{job.title}</td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>{job.company}</td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>{job.location}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        background: statusConfig[job.status].color,
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {statusConfig[job.status].icon} {statusConfig[job.status].label}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => handleEdit(job)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: '8px' }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(job._id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 统计视图 */}
      {view === 'stats' && (
        <div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            {Object.entries(getStats()).map(([key, value]) => (
              <div key={key} className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: '700', color: '#333' }}>
                  {value}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                  {key === 'total' ? '总申请数' : statusConfig[key as keyof typeof statusConfig]?.label || key}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 添加/编辑表单模态框 */}
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ padding: '2rem', width: '90%', maxWidth: '500px' }}>
            <h3 style={{ margin: '0 0 1.5rem 0' }}>
              {editingJob ? '编辑工作申请' : '添加新工作申请'}
            </h3>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  职位标题 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  公司名称 *
                </label>
                <input
                  type="text"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  工作地点 *
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  工作描述
                </label>
                <textarea
                  value={formData.jobDescription}
                  onChange={(e) => setFormData({...formData, jobDescription: e.target.value})}
                  rows={4}
                  placeholder="详细的工作描述..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                    岗位要求
                  </label>
                  <textarea
                    value={formData.requirements}
                    onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                    rows={3}
                    placeholder="每行一个要求..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                    工作职责
                  </label>
                  <textarea
                    value={formData.responsibilities}
                    onChange={(e) => setFormData({...formData, responsibilities: e.target.value})}
                    rows={3}
                    placeholder="每行一个职责..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #ddd',
                      borderRadius: '6px',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  资格要求
                </label>
                <textarea
                  value={formData.qualifications}
                  onChange={(e) => setFormData({...formData, qualifications: e.target.value})}
                  rows={2}
                  placeholder="每行一个资格要求..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  状态
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                >
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <option key={key} value={key}>
                      {config.icon} {config.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  职位链接
                </label>
                <input
                  type="url"
                  value={formData.jobUrl}
                  onChange={(e) => setFormData({...formData, jobUrl: e.target.value})}
                  placeholder="https://..."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
              </div>

              {/* 文件上传 */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  📎 附件 (简历、求职信等)
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px'
                  }}
                />
                {selectedFiles.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      已选择 {selectedFiles.length} 个文件:
                    </div>
                    {selectedFiles.map((file, index) => (
                      <div key={index} style={{
                        fontSize: '12px',
                        color: '#333',
                        padding: '2px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <span>📄</span>
                        <span>{file.name}</span>
                        <span style={{ color: '#666' }}>({Math.round(file.size / 1024)}KB)</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
                  备注
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingJob(null)
                    setFormData({
                      title: '',
                      company: '',
                      location: '',
                      jobDescription: '',
                      requirements: '',
                      responsibilities: '',
                      qualifications: '',
                      status: 'interested',
                      jobUrl: '',
                      notes: ''
                    })
                    setSelectedFiles([])
                  }}
                  className="btn btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingJob ? '更新' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default JobTrackerModule