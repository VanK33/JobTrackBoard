import React, { useState, useEffect } from 'react'

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

interface JobFile {
  id: string
  name: string
  type: 'resume' | 'cover-letter' | 'portfolio' | 'job-description' | 'other'
  mimeType: string
  size: number
  url: string
  uploadedAt: string
}

interface Module {
  id: string
  name: string
  displayName: string
  description: string
  version: string
  isInstalled: boolean
}

const MinimalistWorkspace: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [hoveredFile, setHoveredFile] = useState<string | null>(null)

  const modules: Module[] = [
    {
      id: 'job-tracker-basic',
      name: 'job-tracker-basic',
      displayName: '基础求职追踪器',
      description: '求职申请管理系统',
      version: '1.0.0',
      isInstalled: true
    },
    {
      id: 'jd-resume-compare',
      name: 'jd-resume-compare',
      displayName: 'JD-简历对比分析',
      description: 'AI驱动的职位匹配分析',
      version: '1.0.0',
      isInstalled: false
    },
    {
      id: 'ocr-scanner',
      name: 'ocr-scanner',
      displayName: 'OCR智能扫描',
      description: '图片文字识别工具',
      version: '1.0.0',
      isInstalled: false
    }
  ]

  const statusOrder = ['interested', 'applied', 'interviewing', 'offered', 'rejected']
  const statusLabels = {
    interested: '有兴趣',
    applied: '已申请',
    interviewing: '面试中',
    offered: '已获得Offer',
    rejected: '已拒绝'
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const fetchJobs = async () => {
    try {
      const response = await fetch('/api/jobs')
      if (response.ok) {
        const data = await response.json()
        setJobs(data.data || [])
        if ((data.data || []).length > 0) {
          setSelectedJob(data.data[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setLoading(false)
    }
  }

  const truncateText = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const getCurrentStatusIndex = (status: string) => {
    return statusOrder.indexOf(status)
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#ffffff',
        color: '#000000',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        加载中...
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#000000'
    }}>
      {/* Left Sidebar - Available Modules */}
      <div style={{
        width: '280px',
        backgroundColor: '#f8f9fa',
        borderRight: '1px solid #e9ecef',
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          marginBottom: '24px'
        }}>
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#000000'
          }}>
            可用模块
          </h2>
          <p style={{
            margin: 0,
            fontSize: '12px',
            color: '#6c757d'
          }}>
            版本增强器 v1.0.0
          </p>
        </div>

        <div style={{ flex: 1 }}>
          {modules.map(module => (
            <div
              key={module.id}
              style={{
                padding: '16px',
                marginBottom: '12px',
                border: '1px solid #e9ecef',
                borderRadius: '4px',
                backgroundColor: module.isInstalled ? '#000000' : '#ffffff',
                color: module.isInstalled ? '#ffffff' : '#000000',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!module.isInstalled) {
                  e.currentTarget.style.backgroundColor = '#f8f9fa'
                }
              }}
              onMouseLeave={(e) => {
                if (!module.isInstalled) {
                  e.currentTarget.style.backgroundColor = '#ffffff'
                }
              }}
            >
              <div style={{
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '4px'
              }}>
                {module.displayName}
              </div>
              <div style={{
                fontSize: '12px',
                opacity: 0.7
              }}>
                {module.description}
              </div>
              <div style={{
                fontSize: '11px',
                marginTop: '8px',
                opacity: 0.6
              }}>
                v{module.version}
              </div>
            </div>
          ))}
        </div>

        <button style={{
          width: '100%',
          padding: '12px',
          backgroundColor: '#000000',
          color: '#ffffff',
          border: 'none',
          borderRadius: '4px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer'
        }}>
          打擦工作
        </button>
      </div>

      {/* Center Content - Job Information */}
      <div style={{
        flex: 1,
        padding: '24px 32px',
        overflow: 'auto'
      }}>
        {selectedJob ? (
          <div>
            {/* Header */}
            <div style={{
              borderBottom: '2px solid #000000',
              paddingBottom: '16px',
              marginBottom: '32px'
            }}>
              <h1 style={{
                margin: '0 0 8px 0',
                fontSize: '28px',
                fontWeight: '700',
                color: '#000000'
              }}>
                {selectedJob.title}
              </h1>
              <div style={{
                fontSize: '18px',
                color: '#000000',
                marginBottom: '4px'
              }}>
                {selectedJob.company}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6c757d'
              }}>
                {selectedJob.location}
              </div>
            </div>

            {/* Job Description */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#000000',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Job Description
              </h3>
              <div
                style={{
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#000000',
                  cursor: selectedJob.jobDescription && selectedJob.jobDescription.length > 120 ? 'pointer' : 'default'
                }}
                title={selectedJob.jobDescription}
              >
                {selectedJob.jobDescription
                  ? truncateText(selectedJob.jobDescription)
                  : 'No description available'
                }
              </div>
            </div>

            {/* Requirements & Responsibilities */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '32px',
              marginBottom: '32px'
            }}>
              {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                <div>
                  <h3 style={{
                    margin: '0 0 12px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#000000',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Requirements
                  </h3>
                  <ul style={{
                    margin: 0,
                    paddingLeft: '16px',
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}>
                    {selectedJob.requirements.map((req, index) => (
                      <li key={index} style={{ marginBottom: '4px' }}>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedJob.responsibilities && selectedJob.responsibilities.length > 0 && (
                <div>
                  <h3 style={{
                    margin: '0 0 12px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#000000',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Responsibilities
                  </h3>
                  <ul style={{
                    margin: 0,
                    paddingLeft: '16px',
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}>
                    {selectedJob.responsibilities.map((resp, index) => (
                      <li key={index} style={{ marginBottom: '4px' }}>
                        {resp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Files Section */}
            {selectedJob.files && selectedJob.files.length > 0 && (
              <div style={{ marginBottom: '32px' }}>
                <h3 style={{
                  margin: '0 0 12px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#000000',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Attached Files
                </h3>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}>
                  {selectedJob.files.map(file => (
                    <div
                      key={file.id}
                      style={{
                        position: 'relative',
                        padding: '8px 12px',
                        border: '1px solid #000000',
                        borderRadius: '4px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        backgroundColor: hoveredFile === file.id ? '#000000' : '#ffffff',
                        color: hoveredFile === file.id ? '#ffffff' : '#000000',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={() => setHoveredFile(file.id)}
                      onMouseLeave={() => setHoveredFile(null)}
                    >
                      {file.name}
                      {file.type === 'resume' && (
                        <span style={{ marginLeft: '4px', fontSize: '10px' }}>
                          (Resume)
                        </span>
                      )}

                      {/* Hover thumbnail placeholder */}
                      {hoveredFile === file.id && file.type === 'resume' && (
                        <div style={{
                          position: 'absolute',
                          top: '-120px',
                          left: '0',
                          width: '200px',
                          height: '100px',
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #000000',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          color: '#000000',
                          zIndex: 1000,
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                        }}>
                          Resume Preview
                          <br />
                          {file.name}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Status Progress */}
            <div style={{ marginBottom: '32px' }}>
              <h3 style={{
                margin: '0 0 16px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: '#000000',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Application Progress
              </h3>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                {statusOrder.map((status, index) => {
                  const isActive = getCurrentStatusIndex(selectedJob.status) >= index
                  const isCurrent = selectedJob.status === status

                  return (
                    <React.Fragment key={status}>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        minWidth: '80px'
                      }}>
                        <div style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          backgroundColor: isActive ? '#000000' : '#ffffff',
                          border: '2px solid #000000',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '8px'
                        }}>
                          {isActive && (
                            <div style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#ffffff'
                            }} />
                          )}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          textAlign: 'center',
                          fontWeight: isCurrent ? '600' : '400',
                          color: isCurrent ? '#000000' : '#6c757d'
                        }}>
                          {statusLabels[status as keyof typeof statusLabels]}
                        </div>
                      </div>

                      {index < statusOrder.length - 1 && (
                        <div style={{
                          flex: 1,
                          height: '2px',
                          backgroundColor: getCurrentStatusIndex(selectedJob.status) > index ? '#000000' : '#e9ecef',
                          marginBottom: '32px'
                        }} />
                      )}
                    </React.Fragment>
                  )
                })}
              </div>
            </div>

            {/* Additional Information */}
            <div style={{
              borderTop: '1px solid #e9ecef',
              paddingTop: '16px',
              fontSize: '12px',
              color: '#6c757d'
            }}>
              <div style={{ marginBottom: '4px' }}>
                Created: {new Date(selectedJob.createdAt).toLocaleDateString()}
              </div>
              {selectedJob.appliedAt && (
                <div style={{ marginBottom: '4px' }}>
                  Applied: {new Date(selectedJob.appliedAt).toLocaleDateString()}
                </div>
              )}
              {selectedJob.jobUrl && (
                <div>
                  <a
                    href={selectedJob.jobUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: '#000000',
                      textDecoration: 'underline'
                    }}
                  >
                    View Original Posting
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            color: '#6c757d'
          }}>
            <div style={{
              fontSize: '18px',
              marginBottom: '8px'
            }}>
              No jobs available
            </div>
            <div style={{
              fontSize: '14px'
            }}>
              Add your first job application to get started
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Job List */}
      <div style={{
        width: '320px',
        backgroundColor: '#f8f9fa',
        borderLeft: '1px solid #e9ecef',
        padding: '24px 16px',
        overflow: 'auto'
      }}>
        <h3 style={{
          margin: '0 0 16px 0',
          fontSize: '16px',
          fontWeight: '600',
          color: '#000000'
        }}>
          Job Applications
        </h3>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}>
          {jobs.map(job => (
            <div
              key={job._id}
              onClick={() => setSelectedJob(job)}
              style={{
                padding: '12px',
                border: '1px solid #e9ecef',
                borderRadius: '4px',
                backgroundColor: selectedJob?._id === job._id ? '#000000' : '#ffffff',
                color: selectedJob?._id === job._id ? '#ffffff' : '#000000',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (selectedJob?._id !== job._id) {
                  e.currentTarget.style.backgroundColor = '#f8f9fa'
                }
              }}
              onMouseLeave={(e) => {
                if (selectedJob?._id !== job._id) {
                  e.currentTarget.style.backgroundColor = '#ffffff'
                }
              }}
            >
              <div style={{
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '4px'
              }}>
                {job.title}
              </div>
              <div style={{
                fontSize: '12px',
                opacity: 0.7,
                marginBottom: '4px'
              }}>
                {job.company}
              </div>
              <div style={{
                fontSize: '11px',
                opacity: 0.6
              }}>
                {statusLabels[job.status as keyof typeof statusLabels]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default MinimalistWorkspace