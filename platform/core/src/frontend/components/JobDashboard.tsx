import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ProgressRecord {
  id: string
  type: 'applied' | 'status_update' | 'follow_up' | 'interview' | 'offer' | 'rejection' | 'note'
  date: string
  fromStatus?: string
  toStatus?: string
  note?: string
  operator?: string
  attachments?: string[]
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
  status: 'applied' | 'screening' | 'interview' | 'offer' | 'offered' | 'rejected'
  rejectedAt?: string // Which stage the job was rejected at
  jobUrl?: string
  notes?: string
  files?: JobFile[]
  appliedAt?: string
  createdAt: string
  updatedAt: string
  progressRecords?: ProgressRecord[]
  statusHistory?: {
    status: string
    date: string
    operator?: string
    note?: string
  }[]
}

interface JobFile {
  id: string
  name: string
  type: 'resume' | 'cover-letter' | 'portfolio' | 'job-description' | 'transcript' | 'other'
  mimeType: string
  size: number
  url: string
  uploadedAt: string
  uploadProgress?: number
  uploadStatus?: 'uploading' | 'completed' | 'failed'
  error?: string
}

interface FileUploadState {
  isDragOver: boolean
  uploadingFiles: Set<string>
  failedFiles: Set<string>
}

interface Module {
  id: string
  name: string
  displayName: string
  isInstalled: boolean
}

interface PreviewState {
  file: JobFile | null
  position: { x: number; y: number } | null
  triggerElement: HTMLElement | null
}

interface JobDashboardProps {
  onNavigateToSettings?: () => void
}

const JobDashboard: React.FC<JobDashboardProps> = ({ onNavigateToSettings }) => {
  const [jobs, setJobs] = useState<Job[]>([])
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [hoveredFile, setHoveredFile] = useState<string | null>(null)
  const [hoveredDescription, setHoveredDescription] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [deleteConfirmStep, setDeleteConfirmStep] = useState<1 | 2>(1)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState<Job | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [detailViewExpanded, setDetailViewExpanded] = useState(false)
  const [previouslyFocusedJob, setPreviouslyFocusedJob] = useState<string | null>(null)
  const [hoveredDocument, setHoveredDocument] = useState<string | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [newJobForm, setNewJobForm] = useState<Job | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [fileUploadState, setFileUploadState] = useState<FileUploadState>({
    isDragOver: false,
    uploadingFiles: new Set(),
    failedFiles: new Set()
  })
  const [editingFileName, setEditingFileName] = useState<string | null>(null)
  const [editingFileNameValue, setEditingFileNameValue] = useState<string>('')
  const [uploadProgressMap, setUploadProgressMap] = useState<{[fileId: string]: number}>({})

  // Preview system state
  const [previewState, setPreviewState] = useState<PreviewState>({
    file: null,
    position: null,
    triggerElement: null
  })
  const [thumbnailCache, setThumbnailCache] = useState<{[fileId: string]: string}>({})
  const [loadingThumbnails, setLoadingThumbnails] = useState<Set<string>>(new Set())
  const [isMobileDevice, setIsMobileDevice] = useState(false)

  const previewTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const hideTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const detailTitleRef = React.useRef<HTMLHeadingElement>(null)
  const jobRefs = React.useRef<{[key: string]: HTMLDivElement | null}>({})

  const modules: Module[] = [
    {
      id: 'job-tracker',
      name: 'Job Tracker',
      displayName: 'Job Tracker',
      isInstalled: true
    },
    {
      id: 'jd-resume-match',
      name: 'JD-Resume Match',
      displayName: 'JD-Resume Match',
      isInstalled: false
    },
    {
      id: 'ocr-scanner',
      name: 'OCR Scanner',
      displayName: 'OCR Scanner',
      isInstalled: false
    }
  ]

  const statusOrder = ['applied', 'screening', 'interview', 'offered', 'rejected']
  const statusLabels = {
    applied: 'Applied',
    screening: 'Screening',
    interview: 'Interview',
    offered: 'Offered',
    rejected: 'Rejected'
  }

  // Mock data for demo
  const mockJobs: Job[] = [
    {
      _id: '1',
      title: 'Software Engineer',
      company: 'Google',
      location: 'Mountain View, CA',
      jobDescription: 'We are looking for a talented software engineer to join our team. You will be responsible for developing and maintaining web applications using modern technologies. This role requires strong problem-solving skills and experience with JavaScript frameworks.',
      status: 'interview',
      appliedAt: '2023-10-28',
      createdAt: '2023-10-25',
      updatedAt: '2023-10-28',
      files: [
        {
          id: '1',
          name: 'resume.pdf',
          type: 'resume',
          mimeType: 'application/pdf',
          size: 245760,
          url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          uploadedAt: '2023-10-25'
        },
        {
          id: '1b',
          name: 'cover_letter.pdf',
          type: 'cover-letter',
          mimeType: 'application/pdf',
          size: 156789,
          url: 'https://www.adobe.com/support/products/enterprise/knowledgecenter/media/c4611_sample_explain.pdf',
          uploadedAt: '2023-10-25'
        },
        {
          id: '1c',
          name: 'portfolio_screenshot.png',
          type: 'portfolio',
          mimeType: 'image/png',
          size: 256000,
          url: 'https://picsum.photos/800/600?random=1',
          uploadedAt: '2023-10-25'
        },
        {
          id: '1d',
          name: 'design_mockup.jpg',
          type: 'portfolio',
          mimeType: 'image/jpeg',
          size: 312000,
          url: 'https://picsum.photos/1200/800?random=2',
          uploadedAt: '2023-10-26'
        }
      ],
      notes: 'Follow up call Nov 1, Follow with recruiter Nov 8',
      progressRecords: [
        {
          id: 'p1',
          type: 'applied',
          date: '2023-10-25',
          note: 'Applied through company website',
          operator: 'Self'
        },
        {
          id: 'p2',
          type: 'status_update',
          date: '2023-10-27',
          fromStatus: 'applied',
          toStatus: 'screening',
          note: 'Recruiter reached out for phone screening',
          operator: 'HR Team'
        },
        {
          id: 'p3',
          type: 'status_update',
          date: '2023-10-28',
          fromStatus: 'screening',
          toStatus: 'interview',
          note: 'Passed phone screening, scheduled technical interview',
          operator: 'Hiring Manager'
        }
      ],
      statusHistory: [
        { status: 'applied', date: '2023-10-25', operator: 'Self', note: 'Applied through company website' },
        { status: 'screening', date: '2023-10-27', operator: 'HR Team', note: 'Phone screening scheduled' },
        { status: 'interview', date: '2023-10-28', operator: 'Hiring Manager', note: 'Technical interview scheduled' }
      ]
    },
    {
      _id: '2',
      title: 'Frontend Developer',
      company: 'Meta',
      location: 'Menlo Park, CA',
      jobDescription: 'Join our frontend team to build cutting-edge user interfaces for billions of users. We use React, TypeScript, and modern CSS frameworks.',
      status: 'applied',
      appliedAt: '2023-10-26',
      createdAt: '2023-10-26',
      updatedAt: '2023-10-26',
      files: [
        {
          id: '2',
          name: 'resume_meta.pdf',
          type: 'resume',
          mimeType: 'application/pdf',
          size: 198432,
          url: '/files/resume_meta.pdf',
          uploadedAt: '2023-10-26'
        }
      ],
      progressRecords: [
        {
          id: 'p4',
          type: 'applied',
          date: '2023-10-26',
          note: 'Applied via LinkedIn',
          operator: 'Self'
        }
      ],
      statusHistory: [
        { status: 'applied', date: '2023-10-26', operator: 'Self', note: 'Applied via LinkedIn' }
      ]
    },
    {
      _id: '3',
      title: 'Full Stack Engineer',
      company: 'Netflix',
      location: 'Los Gatos, CA',
      jobDescription: 'Build and scale backend services and frontend applications that power Netflix experiences for millions of users worldwide.',
      status: 'offered',
      appliedAt: '2023-10-20',
      createdAt: '2023-10-20',
      updatedAt: '2023-10-30',
      files: [
        {
          id: '3',
          name: 'netflix_resume.pdf',
          type: 'resume',
          mimeType: 'application/pdf',
          size: 267890,
          url: '/files/netflix_resume.pdf',
          uploadedAt: '2023-10-20'
        }
      ],
      progressRecords: [
        {
          id: 'p5',
          type: 'applied',
          date: '2023-10-20',
          note: 'Applied directly through Netflix careers page',
          operator: 'Self'
        },
        {
          id: 'p6',
          type: 'status_update',
          date: '2023-10-30',
          fromStatus: 'interview',
          toStatus: 'offer',
          note: 'Received offer after successful technical rounds',
          operator: 'Hiring Manager'
        }
      ],
      statusHistory: [
        { status: 'applied', date: '2023-10-20', operator: 'Self' },
        { status: 'screening', date: '2023-10-22', operator: 'HR Team' },
        { status: 'interview', date: '2023-10-25', operator: 'Technical Team' },
        { status: 'offer', date: '2023-10-30', operator: 'Hiring Manager', note: 'Offer extended' }
      ]
    },
    {
      _id: '4',
      title: 'Senior Backend Engineer',
      company: 'Stripe',
      location: 'San Francisco, CA',
      jobDescription: 'Build robust and scalable payment infrastructure that serves millions of businesses worldwide.',
      status: 'rejected',
      rejectedAt: 'screening',
      appliedAt: '2023-10-15',
      createdAt: '2023-10-15',
      updatedAt: '2023-10-22',
      files: [
        {
          id: '4',
          name: 'stripe_resume.pdf',
          type: 'resume',
          mimeType: 'application/pdf',
          size: 234567,
          url: '/files/stripe_resume.pdf',
          uploadedAt: '2023-10-15'
        }
      ],
      notes: 'Rejected after phone screening - lacking distributed systems experience',
      progressRecords: [
        {
          id: 'p7',
          type: 'applied',
          date: '2023-10-15',
          note: 'Applied directly on company website',
          operator: 'Self'
        },
        {
          id: 'p8',
          type: 'status_update',
          date: '2023-10-18',
          fromStatus: 'applied',
          toStatus: 'screening',
          note: 'Phone screening scheduled',
          operator: 'HR Team'
        },
        {
          id: 'p9',
          type: 'rejection',
          date: '2023-10-22',
          fromStatus: 'screening',
          toStatus: 'rejected',
          note: 'Rejected after phone screening - lacking distributed systems experience',
          operator: 'Technical Lead'
        }
      ],
      statusHistory: [
        { status: 'applied', date: '2023-10-15', operator: 'Self' },
        { status: 'screening', date: '2023-10-18', operator: 'HR Team' },
        { status: 'rejected', date: '2023-10-22', operator: 'Technical Lead', note: 'Lacking distributed systems experience' }
      ]
    }
  ]

  const handleDeleteJob = async (jobId: string) => {
    if (deleteConfirmStep === 1) {
      setDeleteConfirmStep(2)
      return
    }

    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      return // Don't proceed if confirmation text is incorrect
    }

    try {
      // API call would go here
      setJobs(jobs.filter(job => job._id !== jobId))
      if (selectedJob?._id === jobId) {
        setSelectedJob(jobs.length > 1 ? jobs.find(j => j._id !== jobId) || null : null)
      }
      setShowDeleteConfirm(null)
      setDeleteConfirmStep(1)
      setDeleteConfirmText('')
    } catch (error) {
      console.error('Failed to delete job:', error)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteConfirm(null)
    setDeleteConfirmStep(1)
    setDeleteConfirmText('')
  }

  const handleEditJob = () => {
    if (selectedJob) {
      setEditForm({ ...selectedJob })
      setIsEditing(true)
      setHasUnsavedChanges(false)
      setValidationErrors([])
    }
  }

  const handleSaveEdit = async () => {
    if (!editForm) return

    const errors = validateJobForm(editForm)
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    try {
      // API call would go here
      const updatedJobs = jobs.map(job =>
        job._id === editForm._id ? editForm : job
      )
      setJobs(updatedJobs)
      setSelectedJob(editForm)
      setIsEditing(false)
      setEditForm(null)
      setHasUnsavedChanges(false)
      setValidationErrors([])
    } catch (error) {
      console.error('Failed to save job:', error)
    }
  }

  const handleCancelEdit = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedDialog(true)
    } else {
      confirmCancelEdit()
    }
  }

  const confirmCancelEdit = () => {
    setIsEditing(false)
    setEditForm(null)
    setHasUnsavedChanges(false)
    setShowUnsavedDialog(false)
  }

  // New Application Handlers
  const handleNewApplication = () => {
    const newJob: Job = {
      _id: `new-${Date.now()}`,
      title: '',
      company: '',
      location: '',
      jobDescription: '',
      status: 'applied',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      appliedAt: new Date().toISOString(),
      files: [],
      statusHistory: [{
        status: 'applied',
        date: new Date().toISOString(),
        operator: 'User',
        note: 'Application started'
      }]
    }

    setNewJobForm(newJob)
    setIsCreatingNew(true)
    setSelectedJob(newJob)
    setValidationErrors([])
  }

  const validateJobForm = (job: Job): string[] => {
    const errors: string[] = []

    if (!job.title.trim()) {
      errors.push('Position is required')
    }
    if (!job.company.trim()) {
      errors.push('Company is required')
    }
    if (!job.location.trim()) {
      errors.push('Location is required')
    }
    if (!job.jobDescription?.trim()) {
      errors.push('Job Description is required')
    }
    if (!job.statusHistory || job.statusHistory.length === 0) {
      errors.push('At least one progress date is required')
    }

    return errors
  }

  const handleSaveNewApplication = async () => {
    if (!newJobForm) return

    const errors = validateJobForm(newJobForm)
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    try {
      // API call would go here
      const finalJob = {
        ...newJobForm,
        _id: `job-${Date.now()}`, // Replace temporary ID with real one
        updatedAt: new Date().toISOString()
      }

      setJobs([finalJob, ...jobs])
      setSelectedJob(finalJob)
      setIsCreatingNew(false)
      setNewJobForm(null)
      setValidationErrors([])
    } catch (error) {
      console.error('Failed to create job:', error)
    }
  }

  const handleCancelNewApplication = () => {
    setIsCreatingNew(false)
    setNewJobForm(null)
    setSelectedJob(null)
    setValidationErrors([])
  }

  const handleNewJobFormChange = (field: keyof Job, value: any) => {
    if (!newJobForm) return

    const updatedForm = {
      ...newJobForm,
      [field]: value,
      updatedAt: new Date().toISOString()
    }

    // Handle status changes in new job form
    if (field === 'status' && value !== newJobForm.status) {
      const currentTime = new Date().toISOString()
      const newHistoryEntry = {
        status: value,
        date: currentTime,
        operator: 'User',
        note: `Status set to ${statusLabels[value as keyof typeof statusLabels]}`
      }

      updatedForm.statusHistory = [...(newJobForm.statusHistory || []), newHistoryEntry]
    }

    setNewJobForm(updatedForm)
    setSelectedJob(updatedForm) // Update selected job to reflect changes in UI

    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([])
    }
  }

  const handleFormChange = (field: keyof Job, value: any) => {
    if (!editForm) return

    // Update the draft form only - no immediate save to live data
    const updatedForm = {
      ...editForm,
      [field]: value,
      updatedAt: new Date().toISOString()
    }

    // Handle status changes in draft - update statusHistory in draft
    if (field === 'status' && value !== editForm.status) {
      const currentTime = new Date().toISOString()
      const newHistoryEntry = {
        status: value,
        date: currentTime,
        operator: 'User',
        note: `Status changed via edit form to ${statusLabels[value as keyof typeof statusLabels]}`
      }

      // Handle rejection status in draft
      let rejectedAt = editForm.rejectedAt
      if (value === 'rejected') {
        rejectedAt = editForm.status // Store which stage the job was rejected at
      } else if (editForm.status === 'rejected' && value !== 'rejected') {
        rejectedAt = undefined // Clear rejection if moving away from rejected
      }

      updatedForm.statusHistory = [...(editForm.statusHistory || []), newHistoryEntry]
      updatedForm.rejectedAt = rejectedAt
    }

    setEditForm(updatedForm)
    setHasUnsavedChanges(true)

    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([])
    }
  }

  const handleAddDocument = () => {
    if (!editForm) return

    const newFile: JobFile = {
      id: Date.now().toString(),
      name: 'New Document.pdf',
      type: 'other',
      mimeType: 'application/pdf',
      size: 0,
      url: '/files/new-document.pdf',
      uploadedAt: new Date().toISOString()
    }

    setEditForm({
      ...editForm,
      files: [...(editForm.files || []), newFile],
      updatedAt: new Date().toISOString()
    })
    setHasUnsavedChanges(true)
  }

  const handleRemoveDocument = (fileId: string) => {
    if (!editForm) return

    setEditForm({
      ...editForm,
      files: editForm.files?.filter(file => file.id !== fileId) || [],
      updatedAt: new Date().toISOString()
    })
    setHasUnsavedChanges(true)
  }

  const handleDocumentChange = (fileId: string, field: keyof JobFile, value: any) => {
    if (!editForm) return

    const updatedFiles = editForm.files?.map(file =>
      file.id === fileId ? { ...file, [field]: value } : file
    ) || []

    setEditForm({
      ...editForm,
      files: updatedFiles,
      updatedAt: new Date().toISOString()
    })
    setHasUnsavedChanges(true)
  }

  // File Upload Utilities
  const validateFile = (file: File): string | null => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'text/plain',
      'text/markdown'
    ]

    if (!allowedTypes.includes(file.type)) {
      return 'File type not supported'
    }

    if (file.size > 25 * 1024 * 1024) { // 25MB limit
      return 'File exceeds 25MB size limit'
    }

    return null
  }

  const simulateFileUpload = async (file: File, onProgress?: (progress: number) => void): Promise<JobFile> => {
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create initial file object with uploading status
    const uploadingFile: JobFile = {
      id: fileId,
      name: file.name,
      type: 'other', // Default type, can be changed by user
      mimeType: file.type,
      size: file.size,
      url: URL.createObjectURL(file), // Temporary URL for preview
      uploadedAt: new Date().toISOString(),
      uploadProgress: 0,
      uploadStatus: 'uploading'
    }

    // Simulate upload progress
    return new Promise((resolve, reject) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 25 + 5 // 5-30% increments
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)

          // Update progress one final time
          setUploadProgressMap(prev => ({
            ...prev,
            [fileId]: 100
          }))

          // Create the final file object
          const uploadedFile: JobFile = {
            ...uploadingFile,
            uploadProgress: 100,
            uploadStatus: 'completed'
          }

          // Clean up progress tracking after a short delay
          setTimeout(() => {
            setUploadProgressMap(prev => {
              const newMap = { ...prev }
              delete newMap[fileId]
              return newMap
            })
          }, 1000)

          resolve(uploadedFile)
        } else {
          // Update progress
          setUploadProgressMap(prev => ({
            ...prev,
            [fileId]: Math.round(progress)
          }))
          onProgress?.(Math.round(progress))
        }
      }, 150) // Slightly faster updates for smoother progress
    })
  }

  // File Upload Handlers
  const handleFilesUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)

    for (const file of fileArray) {
      const error = validateFile(file)
      if (error) {
        // Show error for this file
        console.error(`File ${file.name}: ${error}`)
        continue
      }

      try {
        setFileUploadState(prev => ({
          ...prev,
          uploadingFiles: new Set([...prev.uploadingFiles, file.name])
        }))

        // Create initial uploading file object
        const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        const uploadingFile: JobFile = {
          id: fileId,
          name: file.name,
          type: 'other',
          mimeType: file.type,
          size: file.size,
          url: URL.createObjectURL(file),
          uploadedAt: new Date().toISOString(),
          uploadProgress: 0,
          uploadStatus: 'uploading'
        }

        // Add uploading file immediately to UI
        if (isCreatingNew && newJobForm) {
          setNewJobForm({
            ...newJobForm,
            files: [...(newJobForm.files || []), uploadingFile],
            updatedAt: new Date().toISOString()
          })
          setSelectedJob({
            ...newJobForm,
            files: [...(newJobForm.files || []), uploadingFile],
            updatedAt: new Date().toISOString()
          })
        } else if (isEditing && editForm) {
          setEditForm({
            ...editForm,
            files: [...(editForm.files || []), uploadingFile],
            updatedAt: new Date().toISOString()
          })
          setHasUnsavedChanges(true)
        } else if (selectedJob && !isCreatingNew && !isEditing) {
          // Direct upload to existing job (detail view)
          const updatedJob = {
            ...selectedJob,
            files: [...(selectedJob.files || []), uploadingFile],
            updatedAt: new Date().toISOString()
          }
          setSelectedJob(updatedJob)
          // Also update the job in the jobs list
          setJobs(prevJobs => prevJobs.map(job =>
            job._id === selectedJob._id ? updatedJob : job
          ))
        }

        // Start upload simulation
        const uploadedFile = await simulateFileUpload(file)

        // Update file to completed status
        if (isCreatingNew && newJobForm) {
          setNewJobForm(prev => {
            if (!prev) return prev
            return {
              ...prev,
              files: prev.files?.map(f => f.id === fileId ? uploadedFile : f) || [],
              updatedAt: new Date().toISOString()
            }
          })
          setSelectedJob(prev => {
            if (!prev) return prev
            return {
              ...prev,
              files: prev.files?.map(f => f.id === fileId ? uploadedFile : f) || [],
              updatedAt: new Date().toISOString()
            }
          })
        } else if (isEditing && editForm) {
          setEditForm(prev => {
            if (!prev) return prev
            return {
              ...prev,
              files: prev.files?.map(f => f.id === fileId ? uploadedFile : f) || [],
              updatedAt: new Date().toISOString()
            }
          })
          setHasUnsavedChanges(true)
        } else if (selectedJob && !isCreatingNew && !isEditing) {
          // Update completed file in detail view
          const updatedJob = {
            ...selectedJob,
            files: selectedJob.files?.map(f => f.id === fileId ? uploadedFile : f) || [],
            updatedAt: new Date().toISOString()
          }
          setSelectedJob(updatedJob)
          // Also update the job in the jobs list
          setJobs(prevJobs => prevJobs.map(job =>
            job._id === selectedJob._id ? updatedJob : job
          ))
        }

        setFileUploadState(prev => ({
          ...prev,
          uploadingFiles: new Set([...prev.uploadingFiles].filter(f => f !== file.name))
        }))

      } catch (error) {
        console.error(`Upload failed for ${file.name}:`, error)
        setFileUploadState(prev => ({
          ...prev,
          uploadingFiles: new Set([...prev.uploadingFiles].filter(f => f !== file.name)),
          failedFiles: new Set([...prev.failedFiles, file.name])
        }))
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setFileUploadState(prev => ({ ...prev, isDragOver: true }))
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setFileUploadState(prev => ({ ...prev, isDragOver: false }))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setFileUploadState(prev => ({ ...prev, isDragOver: false }))

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFilesUpload(files)
    }
  }


  const handleFileRename = (fileId: string, newName: string) => {
    if (isCreatingNew && newJobForm) {
      const updatedFiles = newJobForm.files?.map(file =>
        file.id === fileId ? { ...file, name: newName } : file
      ) || []

      setNewJobForm({
        ...newJobForm,
        files: updatedFiles,
        updatedAt: new Date().toISOString()
      })
      setSelectedJob({
        ...newJobForm,
        files: updatedFiles,
        updatedAt: new Date().toISOString()
      })
    } else if (isEditing && editForm) {
      handleDocumentChange(fileId, 'name', newName)
    }
    setEditingFileName(null)
  }

  const handleFileDelete = (fileId: string) => {
    if (isCreatingNew && newJobForm) {
      const updatedFiles = newJobForm.files?.filter(file => file.id !== fileId) || []
      setNewJobForm({
        ...newJobForm,
        files: updatedFiles,
        updatedAt: new Date().toISOString()
      })
      setSelectedJob({
        ...newJobForm,
        files: updatedFiles,
        updatedAt: new Date().toISOString()
      })
    } else if (isEditing && editForm) {
      handleRemoveDocument(fileId)
    }
  }

  // Unified Status Management Functions
  const updateJobStatus = (jobId: string, newStatus: string, note?: string, operator?: string) => {
    const job = jobs.find(j => j._id === jobId)
    if (!job) return

    const currentTime = new Date().toISOString()
    const currentStatus = job.status

    // Create new status history entry
    const newHistoryEntry = {
      status: newStatus,
      date: currentTime,
      operator: operator || 'User',
      note: note || `Status changed from ${statusLabels[currentStatus as keyof typeof statusLabels]} to ${statusLabels[newStatus as keyof typeof statusLabels]}`
    }

    // Create new progress record
    const newProgressRecord: ProgressRecord = {
      id: Date.now().toString(),
      type: 'status_update',
      date: currentTime,
      fromStatus: currentStatus,
      toStatus: newStatus,
      note: note,
      operator: operator || 'User'
    }

    // Handle rejection status
    let rejectedAt = job.rejectedAt
    if (newStatus === 'rejected') {
      rejectedAt = currentStatus // Store which stage the job was rejected at
      newProgressRecord.type = 'rejection'
    }

    // Update job object
    const updatedJob: Job = {
      ...job,
      status: newStatus as any,
      rejectedAt,
      updatedAt: currentTime,
      statusHistory: [...(job.statusHistory || []), newHistoryEntry],
      progressRecords: [...(job.progressRecords || []), newProgressRecord]
    }

    // Update jobs state
    const updatedJobs = jobs.map(j => j._id === jobId ? updatedJob : j)
    setJobs(updatedJobs)

    // Update selected job if it's the one being updated
    if (selectedJob?._id === jobId) {
      setSelectedJob(updatedJob)
    }

    // Update edit form if it's the same job
    if (editForm?._id === jobId) {
      setEditForm(updatedJob)
    }
  }

  const editStatusHistoryEntry = (jobId: string, historyIndex: number, patch: Partial<any>) => {
    const job = jobs.find(j => j._id === jobId)
    if (!job || !job.statusHistory) return

    const updatedStatusHistory = [...job.statusHistory]
    updatedStatusHistory[historyIndex] = { ...updatedStatusHistory[historyIndex], ...patch }

    // Recalculate current status from the latest history entry
    const latestEntry = updatedStatusHistory[updatedStatusHistory.length - 1]
    const newCurrentStatus = latestEntry.status

    // Update rejection status
    let rejectedAt = undefined
    const rejectionEntry = updatedStatusHistory.find(entry => entry.status === 'rejected')
    if (rejectionEntry && newCurrentStatus === 'rejected') {
      // Find the previous status before rejection
      const rejectionIndex = updatedStatusHistory.findIndex(entry => entry.status === 'rejected')
      rejectedAt = rejectionIndex > 0 ? updatedStatusHistory[rejectionIndex - 1].status : 'applied'
    }

    // Update the job
    const updatedJob: Job = {
      ...job,
      status: newCurrentStatus as any,
      rejectedAt,
      updatedAt: new Date().toISOString(),
      statusHistory: updatedStatusHistory
    }

    // Update jobs state
    const updatedJobs = jobs.map(j => j._id === jobId ? updatedJob : j)
    setJobs(updatedJobs)

    // Update selected job if it's the one being updated
    if (selectedJob?._id === jobId) {
      setSelectedJob(updatedJob)
    }

    // Update edit form if it's the same job
    if (editForm?._id === jobId) {
      setEditForm(updatedJob)
    }
  }

  const deleteStatusHistoryEntry = (jobId: string, historyIndex: number) => {
    const job = jobs.find(j => j._id === jobId)
    if (!job || !job.statusHistory) return

    const updatedStatusHistory = [...job.statusHistory]
    updatedStatusHistory.splice(historyIndex, 1)

    // Recalculate current status from the latest remaining entry
    const latestEntry = updatedStatusHistory[updatedStatusHistory.length - 1]
    const newCurrentStatus = latestEntry?.status || 'applied'

    // Update rejection status
    let rejectedAt = undefined
    const rejectionEntry = updatedStatusHistory.find(entry => entry.status === 'rejected')
    if (rejectionEntry && newCurrentStatus === 'rejected') {
      const rejectionIndex = updatedStatusHistory.findIndex(entry => entry.status === 'rejected')
      rejectedAt = rejectionIndex > 0 ? updatedStatusHistory[rejectionIndex - 1].status : 'applied'
    }

    // Update the job
    const updatedJob: Job = {
      ...job,
      status: newCurrentStatus as any,
      rejectedAt,
      updatedAt: new Date().toISOString(),
      statusHistory: updatedStatusHistory
    }

    // Update jobs state
    const updatedJobs = jobs.map(j => j._id === jobId ? updatedJob : j)
    setJobs(updatedJobs)

    // Update selected job if it's the one being updated
    if (selectedJob?._id === jobId) {
      setSelectedJob(updatedJob)
    }

    // Update edit form if it's the same job
    if (editForm?._id === jobId) {
      setEditForm(updatedJob)
    }
  }

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setJobs(mockJobs)
      // Start with no selection
      setSelectedJob(null)
      setLoading(false)
    }, 500)

    // Detect mobile device
    const checkMobileDevice = () => {
      setIsMobileDevice('ontouchstart' in window || navigator.maxTouchPoints > 0)
    }
    checkMobileDevice()
    window.addEventListener('resize', checkMobileDevice)

    return () => {
      window.removeEventListener('resize', checkMobileDevice)
    }
  }, [])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Close preview first if open
        if (previewState.file) {
          setPreviewState({
            file: null,
            position: null,
            triggerElement: null
          })
        } else if (selectedJob) {
          setSelectedJob(null)
          setDetailViewExpanded(false)
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedJob, previewState.file])

  // Handle job selection toggle
  const handleJobClick = (job: Job) => {
    if (selectedJob?._id === job._id) {
      // Toggle off if same job clicked
      setSelectedJob(null)
      setDetailViewExpanded(false)
    } else {
      // Select new job
      setSelectedJob(job)
    }
  }

  // Handle keyboard selection
  const handleJobKeyDown = (e: React.KeyboardEvent, job: Job) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleJobClick(job)
    }
  }

  const truncateText = (text: string, maxLength: number = 80) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const getCurrentStatusIndex = (status: string) => {
    return statusOrder.indexOf(status)
  }

  const getStatusStats = () => {
    const stats = {
      applied: 0,
      screening: 0,
      interview: 0,
      offered: 0,
      rejected: 0
    }

    jobs.forEach(job => {
      // Map status aliases to standard 5-category enum
      let mappedStatus = job.status

      // Consolidate all offer-related statuses to 'offered'
      if (['offer', 'offer_made', 'pending_offer'].includes(job.status)) {
        mappedStatus = 'offered'
      }

      // Default unknown statuses to 'applied'
      if (!stats.hasOwnProperty(mappedStatus)) {
        mappedStatus = 'applied'
      }

      stats[mappedStatus as keyof typeof stats]++
    })

    return stats
  }

  const getGeneralStats = () => {
    const totalApplications = jobs.length
    const activeApplications = jobs.filter(job => ['applied', 'screening', 'interview'].includes(job.status) ||
      ['offer', 'offer_made', 'pending_offer'].includes(job.status)).length
    const hired = jobs.filter(job => job.status === 'offered' ||
      ['offer', 'offer_made', 'pending_offer'].includes(job.status)).length
    const rejected = jobs.filter(job => job.status === 'rejected').length

    return {
      total: totalApplications,
      active: activeApplications,
      hired,
      rejected
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5',
        color: '#000000',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        Loading...
      </div>
    )
  }

  const statusStats = getStatusStats()
  const generalStats = getGeneralStats()

  const getFileTypeLabel = (type: string) => {
    switch(type) {
      case 'resume': return 'Resume'
      case 'cover-letter': return 'Cover Letter'
      case 'portfolio': return 'Portfolio'
      case 'transcript': return 'Transcript'
      case 'job-description': return 'Job Description'
      case 'other': return 'Other'
      default: return 'Unknown'
    }
  }

  // Preview utility functions
  const isPreviewableFile = (file: JobFile) => {
    return file.mimeType.includes('image') || file.mimeType.includes('pdf')
  }

  const generateThumbnailUrl = (file: JobFile) => {
    if (file.mimeType.includes('image')) {
      // For images, we can use the original URL as thumbnail
      return file.url
    } else if (file.mimeType.includes('pdf')) {
      // For PDFs, we can use different approaches:
      // 1. Backend thumbnail service (preferred for production)
      // 2. PDF.js iframe preview (works for accessible PDFs)
      // 3. Third-party preview service

      // For demo purposes, we'll use a PDF iframe preview if available
      // In production, replace with your backend thumbnail API
      return file.url
    }
    return null
  }

  const getPositionForPreview = (triggerElement: HTMLElement) => {
    const rect = triggerElement.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const previewWidth = 320
    const previewHeight = 240

    let x = rect.right + 16
    let y = rect.top

    // If preview would go off right edge, show on left
    if (x + previewWidth > viewportWidth) {
      x = rect.left - previewWidth - 16
    }

    // If preview would go off bottom edge, move up
    if (y + previewHeight > viewportHeight) {
      y = Math.max(16, viewportHeight - previewHeight - 16)
    }

    // If preview would go off top edge, move down
    if (y < 16) {
      y = 16
    }

    return { x, y }
  }

  const handleFileHover = (file: JobFile, triggerElement: HTMLElement) => {
    if (isMobileDevice) return

    // Clear any existing timeouts
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current)
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
    }

    // Set preview after delay to prevent flickering
    previewTimeoutRef.current = setTimeout(() => {
      if (isPreviewableFile(file)) {
        const position = getPositionForPreview(triggerElement)
        setPreviewState({
          file,
          position,
          triggerElement
        })

        // Start loading thumbnail if not cached
        if (!thumbnailCache[file.id] && !loadingThumbnails.has(file.id)) {
          const thumbnailUrl = generateThumbnailUrl(file)
          if (thumbnailUrl) {
            setLoadingThumbnails(prev => new Set([...prev, file.id]))
            // Simulate thumbnail loading (in real app, this would be an API call)
            setTimeout(() => {
              setThumbnailCache(prev => ({ ...prev, [file.id]: thumbnailUrl }))
              setLoadingThumbnails(prev => {
                const newSet = new Set(prev)
                newSet.delete(file.id)
                return newSet
              })
            }, 300)
          }
        }
      } else {
        // Show info card for non-previewable files
        const position = getPositionForPreview(triggerElement)
        setPreviewState({
          file,
          position,
          triggerElement
        })
      }
    }, 150)
  }

  const handleFileHoverEnd = () => {
    if (isMobileDevice) return

    // Clear preview timeout if still pending
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current)
      previewTimeoutRef.current = null
    }

    // Hide preview after delay to prevent flickering when moving between elements
    hideTimeoutRef.current = setTimeout(() => {
      setPreviewState({
        file: null,
        position: null,
        triggerElement: null
      })
    }, 120)
  }

  const handleMobilePreview = (file: JobFile, triggerElement: HTMLElement) => {
    if (!isMobileDevice) return

    const position = getPositionForPreview(triggerElement)
    setPreviewState({
      file,
      position,
      triggerElement
    })
  }

  const closeMobilePreview = () => {
    setPreviewState({
      file: null,
      position: null,
      triggerElement: null
    })
  }

  // Preview Popover Component
  const PreviewPopover: React.FC = () => {
    if (!previewState.file || !previewState.position) return null

    const file = previewState.file
    const isPreviewable = isPreviewableFile(file)
    const thumbnailUrl = thumbnailCache[file.id] || generateThumbnailUrl(file)
    const isLoading = loadingThumbnails.has(file.id)

    return createPortal(
      <div
        role="tooltip"
        aria-label={`Preview of ${file.name}`}
        style={{
          position: 'fixed',
          left: previewState.position.x,
          top: previewState.position.y,
          width: isPreviewable ? '320px' : '280px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.08)',
          zIndex: 10000,
          padding: '12px',
          overflow: 'hidden',
          cursor: 'default',
          maxHeight: '320px'
        }}
        onClick={(e) => {
          e.stopPropagation()
          if (isMobileDevice) {
            closeMobilePreview()
          }
        }}
        onMouseEnter={() => {
          if (hideTimeoutRef.current) {
            clearTimeout(hideTimeoutRef.current)
            hideTimeoutRef.current = null
          }
        }}
        onMouseLeave={() => {
          if (!isMobileDevice) {
            handleFileHoverEnd()
          }
        }}
      >
        {isPreviewable ? (
          <>
            {/* Thumbnail area */}
            <div style={{
              height: '200px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {isLoading ? (
                <div style={{
                  width: '100%',
                  height: '100%',
                  backgroundColor: '#e9ecef',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }}>
                  <div style={{
                    fontSize: '13px',
                    color: '#6b7280',
                    fontWeight: '500'
                  }}>
                    Loading preview...
                  </div>
                </div>
              ) : thumbnailUrl ? (
                file.mimeType.includes('pdf') ? (
                  // PDF preview using iframe with embedded viewer
                  <iframe
                    src={`${thumbnailUrl}#view=FitH&toolbar=0&navpanes=0&scrollbar=0&page=1&zoom=page-width`}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      borderRadius: '4px',
                      backgroundColor: '#ffffff'
                    }}
                    title={`Preview of ${file.name}`}
                    onLoad={() => {
                      console.log('PDF loaded successfully')
                    }}
                    onError={() => {
                      console.log('PDF preview failed')
                    }}
                  />
                ) : (
                  // Image preview
                  <img
                    src={thumbnailUrl}
                    alt={file.name}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain',
                      borderRadius: '4px'
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                      const placeholder = document.createElement('div')
                      placeholder.innerHTML = `
                        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #6b7280; font-size: 13px; font-weight: 500;">
                          Preview not available
                        </div>
                      `
                      e.target.parentNode?.appendChild(placeholder)
                    }}
                  />
                )
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#6b7280',
                  fontSize: '13px',
                  fontWeight: '500',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{
                    fontSize: '32px',
                    opacity: 0.3,
                    color: '#9ca3af'
                  }}>
                    {file.mimeType.includes('pdf') ? 'PDF' : 'IMG'}
                  </div>
                  <div>Preview not available</div>
                </div>
              )}
            </div>

            {/* File info */}
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '4px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {file.name}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span>{getFileTypeLabel(file.type)}</span>
                <span>{Math.round(file.size / 1024)}KB</span>
              </div>
            </div>
          </>
        ) : (
          // Info card for non-previewable files
          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '12px',
              gap: '12px'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280'
              }}>
                DOC
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#111827',
                  marginBottom: '2px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {file.name}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280'
                }}>
                  {getFileTypeLabel(file.type)}
                </div>
              </div>
            </div>

            <div style={{
              fontSize: '12px',
              color: '#6b7280',
              paddingTop: '8px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span>Size: {Math.round(file.size / 1024)}KB</span>
              <span>Uploaded: {new Date(file.uploadedAt).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </div>,
      document.body
    )
  }

  return (
    <>
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: '#f5f5f5',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#000000'
    }}>
      {/* Left Sidebar - Modules */}
      <div style={{
        width: '200px',
        backgroundColor: '#ffffff',
        borderRight: '1px solid #e0e0e0',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ marginBottom: '30px' }}>
          {modules.map(module => (
            <div
              key={module.id}
              style={{
                padding: '12px 16px',
                marginBottom: '8px',
                borderRadius: '4px',
                backgroundColor: module.isInstalled ? '#000000' : '#ffffff',
                color: module.isInstalled ? '#ffffff' : '#666666',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: module.isInstalled ? '500' : '400',
                border: module.isInstalled ? 'none' : '1px solid #e0e0e0',
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
              {module.displayName}
            </div>
          ))}
        </div>

        <button
          onClick={handleNewApplication}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#000000',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            marginTop: 'auto'
          }}
        >
          New Application
        </button>
      </div>

      {/* Center Content - Job Applications */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        margin: '20px',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#ffffff'
        }}>
          <h2 style={{
            margin: 0,
            fontSize: '18px',
            fontWeight: '600',
            color: '#000000'
          }}>
            Modular Job Tracking Platform
          </h2>
        </div>

        {/* Job List */}
        <div
          style={{
            flex: selectedJob ? (detailViewExpanded ? '0 0 15%' : '0 0 35%') : 1,
            overflow: 'auto',
            padding: '16px 24px',
            transition: 'flex 0.3s ease'
          }}
          onClick={(e) => {
            // Close detail view if clicking in empty space
            if (e.target === e.currentTarget && selectedJob) {
              setSelectedJob(null)
              setDetailViewExpanded(false)
            }
          }}
        >
          {(isCreatingNew && newJobForm ? [newJobForm, ...jobs] : jobs).map(job => {
            const isPlaceholder = job._id.startsWith('new-')
            return (
              <div
                key={job._id}
                onClick={() => handleJobClick(job)}
                onKeyDown={(e) => handleJobKeyDown(e, job)}
                tabIndex={0}
                role="button"
                aria-selected={selectedJob?._id === job._id}
                style={{
                  padding: selectedJob && !detailViewExpanded ? '12px 16px' : '16px',
                  marginBottom: selectedJob && !detailViewExpanded ? '6px' : '8px',
                  border: selectedJob?._id === job._id ? '2px solid #000000' : (isPlaceholder ? '2px dashed #666666' : '1px solid #e0e0e0'),
                  borderRadius: '4px',
                  backgroundColor: selectedJob?._id === job._id ? '#f8f9fa' : (isPlaceholder ? '#f0f8ff' : '#ffffff'),
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  outline: 'none'
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
                {/* Consistent Two-Column Layout */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 220px',
                  gap: '12px',
                  alignItems: 'center'
                }}>
                  {/* Left Column - Job Info */}
                  <div>
                    <h3 style={{
                      margin: '0 0 4px 0',
                      fontSize: selectedJob ? '14px' : '15px',
                      fontWeight: '600',
                      color: isPlaceholder ? '#666666' : '#000000',
                      lineHeight: '1.3',
                      fontStyle: isPlaceholder ? 'italic' : 'normal'
                    }}>
                      {job.title || (isPlaceholder ? 'New Application' : 'Untitled')}
                    </h3>
                    <div style={{
                      fontSize: selectedJob ? '12px' : '13px',
                      color: '#666666',
                      lineHeight: '1.2',
                      fontStyle: isPlaceholder && (!job.company || !job.location) ? 'italic' : 'normal'
                    }}>
                      {(job.company || (isPlaceholder ? 'Company' : 'No Company')) + ' • ' + (job.location || (isPlaceholder ? 'Location' : 'No Location'))}
                    </div>
                  </div>

                  {/* Right Column - Compact Status Bar */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    justifyContent: 'flex-end'
                  }}>
                    {statusOrder.map((status, index) => {
                      const isActive = getCurrentStatusIndex(job.status) >= index
                      const isCurrent = job.status === status
                      const isRejected = job.status === 'rejected' && job.rejectedAt === status

                      return (
                        <React.Fragment key={status}>
                          <div
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: isRejected ? '#ff4444' : (isActive ? '#000000' : '#e0e0e0'),
                              border: isCurrent ? '2px solid #000000' : 'none',
                              boxSizing: 'border-box',
                              position: 'relative'
                            }}
                            title={`${statusLabels[status as keyof typeof statusLabels]}${isRejected ? ' (Rejected)' : ''}`}
                          />

                          {index < statusOrder.length - 1 && (
                            <div style={{
                              width: '12px',
                              height: '2px',
                              backgroundColor: (getCurrentStatusIndex(job.status) > index && job.status !== 'rejected') ? '#000000' : '#e0e0e0'
                            }} />
                          )}
                        </React.Fragment>
                      )
                    })}

                    {/* Compact Status Label */}
                    <div style={{
                      display: 'inline-block',
                      padding: '2px 6px',
                      backgroundColor: job.status === 'rejected' ? '#ff4444' : '#000000',
                      color: '#ffffff',
                      borderRadius: '10px',
                      fontSize: '9px',
                      fontWeight: '500',
                      marginLeft: '6px'
                    }}>
                      {job.status === 'rejected' && job.rejectedAt
                        ? `Rejected`
                        : statusLabels[job.status as keyof typeof statusLabels]
                      }
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Detail View */}
        {(selectedJob || isCreatingNew) && (
          <div
            style={{
              flex: detailViewExpanded ? '0 0 85%' : '0 0 65%',
              borderTop: '1px solid #e0e0e0',
              padding: '24px',
              backgroundColor: '#f8f9fa',
              overflow: 'auto',
              transition: 'flex 0.3s ease',
              opacity: 1,
              transform: 'translateY(0)'
            }}
            role="region"
            aria-live="polite"
            aria-label="Job details"
          >
            <div style={{
              backgroundColor: '#ffffff',
              padding: '20px',
              position: 'relative'
            }}>
              {/* Header with Edit/Delete Controls */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '16px'
              }}>
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#000000'
                    }}
                    tabIndex={0}
                  >
                    {isCreatingNew ? 'New Application' : `${selectedJob.title} - ${selectedJob.company}`}
                  </h3>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '8px',
                  flexWrap: 'wrap'
                }}>
                  {isCreatingNew ? (
                    <>
                      <button
                        onClick={handleSaveNewApplication}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#000000',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Save Application
                      </button>
                      <button
                        onClick={handleCancelNewApplication}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#ffffff',
                          color: '#666666',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setDetailViewExpanded(!detailViewExpanded)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: detailViewExpanded ? '#000000' : '#ffffff',
                          border: '1px solid #000000',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: detailViewExpanded ? '#ffffff' : '#000000',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {detailViewExpanded ? 'Collapse' : 'Expand'}
                      </button>
                      <button
                        onClick={handleEditJob}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #000000',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: '#000000',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#000000'
                          e.currentTarget.style.color = '#ffffff'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#ffffff'
                          e.currentTarget.style.color = '#000000'
                        }}
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => setShowDeleteConfirm(selectedJob._id)}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #ff4444',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          color: '#ff4444',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#ff4444'
                          e.currentTarget.style.color = '#ffffff'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#ffffff'
                          e.currentTarget.style.color = '#ff4444'
                        }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Delete Confirmation Modal - Two Step */}
              {showDeleteConfirm === selectedJob._id && (
                <div style={{
                  position: 'absolute',
                  top: '0',
                  left: '0',
                  right: '0',
                  bottom: '0',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: '6px',
                  zIndex: 1000
                }}>
                  <div style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e0e0e0',
                    borderRadius: '6px',
                    padding: '24px',
                    maxWidth: '400px',
                    textAlign: 'center'
                  }}>
                    {deleteConfirmStep === 1 ? (
                      <>
                        <h4 style={{
                          margin: '0 0 12px 0',
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#000000'
                        }}>
                          Confirm Deletion
                        </h4>
                        <p style={{
                          margin: '0 0 20px 0',
                          fontSize: '14px',
                          color: '#666666',
                          lineHeight: '1.4'
                        }}>
                          Are you sure you want to delete the application for <strong>{selectedJob.title}</strong> at <strong>{selectedJob.company}</strong>?
                        </p>
                        <div style={{
                          display: 'flex',
                          gap: '12px',
                          justifyContent: 'center'
                        }}>
                          <button
                            onClick={handleCancelDelete}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e0e0e0',
                              borderRadius: '4px',
                              fontSize: '14px',
                              color: '#666666',
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDeleteJob(selectedJob._id)}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#ff4444',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '14px',
                              color: '#ffffff',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            Yes, Delete
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <h4 style={{
                          margin: '0 0 12px 0',
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#ff4444'
                        }}>
                          Final Confirmation
                        </h4>
                        <p style={{
                          margin: '0 0 16px 0',
                          fontSize: '14px',
                          color: '#666666',
                          lineHeight: '1.4'
                        }}>
                          This action cannot be undone. Type <strong>DELETE</strong> to confirm:
                        </p>
                        <input
                          type="text"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="Type DELETE"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '1px solid #e0e0e0',
                            borderRadius: '4px',
                            fontSize: '14px',
                            marginBottom: '16px',
                            textAlign: 'center'
                          }}
                          autoFocus
                        />
                        <div style={{
                          display: 'flex',
                          gap: '12px',
                          justifyContent: 'center'
                        }}>
                          <button
                            onClick={handleCancelDelete}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e0e0e0',
                              borderRadius: '4px',
                              fontSize: '14px',
                              color: '#666666',
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDeleteJob(selectedJob._id)}
                            disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE'}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: deleteConfirmText.trim().toUpperCase() === 'DELETE' ? '#ff4444' : '#cccccc',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '14px',
                              color: '#ffffff',
                              cursor: deleteConfirmText.trim().toUpperCase() === 'DELETE' ? 'pointer' : 'not-allowed',
                              fontWeight: '500'
                            }}
                          >
                            Delete Permanently
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '4px',
                  padding: '12px',
                  marginBottom: '16px'
                }}>
                  <h4 style={{
                    margin: '0 0 8px 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#dc2626'
                  }}>
                    Please fix the following errors:
                  </h4>
                  <ul style={{
                    margin: 0,
                    paddingLeft: '20px',
                    fontSize: '13px',
                    color: '#dc2626'
                  }}>
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* New Application Form */}
              {isCreatingNew && newJobForm ? (
                <div style={{
                  backgroundColor: '#f0f8ff',
                  border: '2px solid #2563eb',
                  borderRadius: '8px',
                  padding: '24px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px'
                  }}>
                    <h4 style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#1e40af'
                    }}>
                      New Job Application
                    </h4>
                  </div>

                  {/* Basic Information */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#1e40af',
                        marginBottom: '4px'
                      }}>
                        Position *
                      </label>
                      <input
                        type="text"
                        value={newJobForm.title}
                        onChange={(e) => handleNewJobFormChange('title', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                        placeholder="e.g., Software Engineer"
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#1e40af',
                        marginBottom: '4px'
                      }}>
                        Company *
                      </label>
                      <input
                        type="text"
                        value={newJobForm.company}
                        onChange={(e) => handleNewJobFormChange('company', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                        placeholder="e.g., Google"
                      />
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#1e40af',
                        marginBottom: '4px'
                      }}>
                        Location *
                      </label>
                      <input
                        type="text"
                        value={newJobForm.location}
                        onChange={(e) => handleNewJobFormChange('location', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                        placeholder="e.g., Mountain View, CA"
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#1e40af',
                        marginBottom: '4px'
                      }}>
                        Status
                      </label>
                      <select
                        value={newJobForm.status}
                        onChange={(e) => handleNewJobFormChange('status', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      >
                        <option value="applied">Applied</option>
                        <option value="screening">Screening</option>
                        <option value="interview">Interview</option>
                        <option value="offered">Offered</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  {/* Job Description */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#1e40af',
                      marginBottom: '4px'
                    }}>
                      Job Description *
                    </label>
                    <textarea
                      value={newJobForm.jobDescription || ''}
                      onChange={(e) => handleNewJobFormChange('jobDescription', e.target.value)}
                      rows={6}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        fontSize: '14px',
                        resize: 'vertical'
                      }}
                      placeholder="Describe the job requirements, responsibilities, and qualifications..."
                    />
                  </div>

                  {/* Notes */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#1e40af',
                      marginBottom: '4px'
                    }}>
                      Notes & Follow-up Deadlines
                    </label>
                    <textarea
                      value={newJobForm.notes || ''}
                      onChange={(e) => handleNewJobFormChange('notes', e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        fontSize: '14px',
                        resize: 'vertical'
                      }}
                      placeholder="Add any notes or follow-up deadlines..."
                    />
                  </div>

                  {/* Related Documents with Drag & Drop */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#000000',
                      marginBottom: '8px',
                      display: 'block'
                    }}>
                      Related Documents
                    </label>

                    <div style={{
                      maxWidth: '600px',
                      width: 'fit-content'
                    }}>
                      {/* File Upload Area */}
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        style={{
                          border: fileUploadState.isDragOver
                            ? '2px dashed #2563eb'
                            : '2px dashed #d1d5db',
                          borderRadius: '8px',
                          padding: '24px',
                          textAlign: 'center',
                          backgroundColor: fileUploadState.isDragOver
                            ? '#eff6ff'
                            : '#f9fafb',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                          marginBottom: newJobForm.files && newJobForm.files.length > 0 ? '16px' : '0'
                        }}
                        onClick={() => {
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.multiple = true
                          input.accept = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt,.md'
                          input.onchange = (e) => {
                            const files = (e.target as HTMLInputElement).files
                            if (files) {
                              handleFilesUpload(files)
                            }
                          }
                          input.click()
                        }}
                      >
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#374151',
                          marginBottom: '4px'
                        }}>
                          {fileUploadState.isDragOver ? 'Drop files here' : 'Drop files or click to upload'}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280'
                        }}>
                          PDF, DOC, Images up to 25MB
                        </div>
                      </div>

                      {/* File List */}
                      {newJobForm.files && newJobForm.files.length > 0 && (
                        <div>
                          {newJobForm.files.map((file, index) => (
                            <div
                              key={file.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '8px 0',
                                cursor: 'pointer',
                                position: 'relative',
                                transition: 'background-color 0.15s ease',
                                borderRadius: '4px',
                                margin: '0 -8px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f9fafb'
                                setHoveredDocument(file.id)
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                                setHoveredDocument(null)
                              }}
                            >
                              <div style={{
                                width: '140px',
                                textAlign: 'right',
                                paddingRight: '16px',
                                flexShrink: 0
                              }}>
                                {editingFileName === file.id ? (
                                  <input
                                    type="text"
                                    value={editingFileNameValue}
                                    onChange={(e) => setEditingFileNameValue(e.target.value)}
                                    onBlur={() => {
                                      handleFileRename(file.id, editingFileNameValue + (file.name.match(/\.[^/.]+$/) || [''])[0])
                                      setEditingFileName(null)
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleFileRename(file.id, editingFileNameValue + (file.name.match(/\.[^/.]+$/) || [''])[0])
                                        setEditingFileName(null)
                                      } else if (e.key === 'Escape') {
                                        setEditingFileName(null)
                                      }
                                    }}
                                    style={{
                                      fontSize: '13px',
                                      padding: '2px 4px',
                                      border: '1px solid #2563eb',
                                      borderRadius: '2px',
                                      width: '120px'
                                    }}
                                    autoFocus
                                  />
                                ) : (
                                  <div style={{ position: 'relative' }}>
                                    <span
                                      style={{
                                        fontWeight: '500',
                                        fontSize: '13px',
                                        color: file.uploadStatus === 'uploading' ? '#666666' : '#374151',
                                        lineHeight: '1.2',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        display: 'block',
                                        cursor: 'text',
                                        opacity: file.uploadStatus === 'uploading' ? 0.7 : 1
                                      }}
                                      onClick={(e) => {
                                        if (file.uploadStatus !== 'uploading') {
                                          e.stopPropagation()
                                          setEditingFileName(file.id)
                                          setEditingFileNameValue(file.name.replace(/\.[^/.]+$/, ""))
                                        }
                                      }}
                                    >
                                      {file.name}
                                      {file.uploadStatus === 'uploading' && (
                                        <span style={{
                                          marginLeft: '8px',
                                          fontSize: '11px',
                                          color: '#666666'
                                        }}>
                                          ({uploadProgressMap[file.id] || 0}%)
                                        </span>
                                      )}
                                    </span>

                                    {/* Progress bar for uploading files */}
                                    {file.uploadStatus === 'uploading' && (
                                      <div style={{
                                        position: 'absolute',
                                        bottom: '-2px',
                                        left: 0,
                                        right: 0,
                                        height: '2px',
                                        backgroundColor: '#e5e7eb',
                                        borderRadius: '1px',
                                        overflow: 'hidden'
                                      }}>
                                        <div style={{
                                          height: '100%',
                                          backgroundColor: '#2563eb',
                                          width: `${uploadProgressMap[file.id] || 0}%`,
                                          transition: 'width 0.3s ease-out',
                                          borderRadius: '1px'
                                        }} />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div style={{
                                flex: 1,
                                paddingLeft: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                <select
                                  disabled={file.uploadStatus === 'uploading'}
                                  value={file.type}
                                  onChange={(e) => {
                                    if (isCreatingNew && newJobForm) {
                                      const updatedFiles = newJobForm.files?.map(f =>
                                        f.id === file.id ? { ...f, type: e.target.value as any } : f
                                      ) || []
                                      setNewJobForm({
                                        ...newJobForm,
                                        files: updatedFiles,
                                        updatedAt: new Date().toISOString()
                                      })
                                      setSelectedJob({
                                        ...newJobForm,
                                        files: updatedFiles,
                                        updatedAt: new Date().toISOString()
                                      })
                                    }
                                  }}
                                  style={{
                                    fontSize: '13px',
                                    padding: '2px 4px',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '3px',
                                    backgroundColor: file.uploadStatus === 'uploading' ? '#f9f9f9' : '#ffffff',
                                    opacity: file.uploadStatus === 'uploading' ? 0.6 : 1,
                                    cursor: file.uploadStatus === 'uploading' ? 'not-allowed' : 'default'
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <option value="resume">Resume</option>
                                  <option value="cover-letter">Cover Letter</option>
                                  <option value="portfolio">Portfolio</option>
                                  <option value="transcript">Transcript</option>
                                  <option value="job-description">Job Description</option>
                                  <option value="other">Other</option>
                                </select>

                                <button
                                  disabled={file.uploadStatus === 'uploading'}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (file.uploadStatus !== 'uploading' && window.confirm('Delete this file?')) {
                                      handleFileDelete(file.id)
                                    }
                                  }}
                                  style={{
                                    fontSize: '11px',
                                    padding: '2px 6px',
                                    backgroundColor: file.uploadStatus === 'uploading' ? '#f9f9f9' : '#ffffff',
                                    color: file.uploadStatus === 'uploading' ? '#9ca3af' : '#dc2626',
                                    border: `1px solid ${file.uploadStatus === 'uploading' ? '#d1d5db' : '#dc2626'}`,
                                    cursor: file.uploadStatus === 'uploading' ? 'not-allowed' : 'pointer',
                                    opacity: file.uploadStatus === 'uploading' ? 0.6 : 1,
                                    borderRadius: '3px'
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : isEditing && editForm ? (
                <div style={{
                  backgroundColor: '#f8f9fa',
                  border: '2px solid #000000',
                  borderRadius: '8px',
                  padding: '24px',
                  marginBottom: '16px'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px'
                  }}>
                    <h4 style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#000000'
                    }}>
                      Edit Job Application
                    </h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={handleSaveEdit}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#000000',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Save Changes
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#ffffff',
                          color: '#666666',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>

                  {/* Basic Information */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#000000',
                        marginBottom: '4px'
                      }}>
                        Job Title
                      </label>
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => handleFormChange('title', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#000000',
                        marginBottom: '4px'
                      }}>
                        Company
                      </label>
                      <input
                        type="text"
                        value={editForm.company}
                        onChange={(e) => handleFormChange('company', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '16px',
                    marginBottom: '16px'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#000000',
                        marginBottom: '4px'
                      }}>
                        Location
                      </label>
                      <input
                        type="text"
                        value={editForm.location}
                        onChange={(e) => handleFormChange('location', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{
                        display: 'block',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#000000',
                        marginBottom: '4px'
                      }}>
                        Status
                      </label>
                      <select
                        value={editForm.status}
                        onChange={(e) => handleFormChange('status', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          fontSize: '14px'
                        }}
                      >
                        <option value="applied">Applied</option>
                        <option value="screening">Screening</option>
                        <option value="interview">Interview</option>
                        <option value="offered">Offered</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>

                  {/* Job Description */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#000000',
                      marginBottom: '4px'
                    }}>
                      Job Description
                    </label>
                    <textarea
                      value={editForm.jobDescription || ''}
                      onChange={(e) => handleFormChange('jobDescription', e.target.value)}
                      rows={6}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        fontSize: '14px',
                        resize: 'vertical'
                      }}
                      placeholder="Enter job description..."
                    />
                  </div>

                  {/* Notes */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#000000',
                      marginBottom: '4px'
                    }}>
                      Notes & Follow-up Deadlines
                    </label>
                    <textarea
                      value={editForm.notes || ''}
                      onChange={(e) => handleFormChange('notes', e.target.value)}
                      rows={3}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        border: '1px solid #e0e0e0',
                        borderRadius: '4px',
                        fontSize: '14px',
                        resize: 'vertical'
                      }}
                      placeholder="Enter notes and follow-up deadlines..."
                    />
                  </div>

                  {/* Related Documents */}
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#000000',
                      marginBottom: '8px',
                      display: 'block'
                    }}>
                      Related Documents
                    </label>
                    <div style={{
                      maxWidth: '600px',
                      width: 'fit-content'
                    }}>
                      {/* File Upload Area */}
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        style={{
                          border: fileUploadState.isDragOver
                            ? '2px dashed #2563eb'
                            : '2px dashed #d1d5db',
                          borderRadius: '8px',
                          padding: '24px',
                          textAlign: 'center',
                          backgroundColor: fileUploadState.isDragOver
                            ? '#eff6ff'
                            : '#f9fafb',
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                          marginBottom: editForm.files && editForm.files.length > 0 ? '16px' : '0'
                        }}
                        onClick={() => {
                          const input = document.createElement('input')
                          input.type = 'file'
                          input.multiple = true
                          input.accept = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt,.md'
                          input.onchange = (e) => {
                            const files = (e.target as HTMLInputElement).files
                            if (files) {
                              handleFilesUpload(files)
                            }
                          }
                          input.click()
                        }}
                      >
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#374151',
                          marginBottom: '4px'
                        }}>
                          {fileUploadState.isDragOver ? 'Drop files here' : 'Drop files or click to upload'}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280'
                        }}>
                          PDF, DOC, Images up to 25MB
                        </div>
                      </div>

                      {/* File List */}
                      {editForm.files && editForm.files.length > 0 && (
                        <div>
                          {editForm.files.map((file, index) => (
                            <div
                              key={file.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                padding: '8px 0',
                                cursor: 'pointer',
                                position: 'relative',
                                transition: 'background-color 0.15s ease',
                                borderRadius: '4px',
                                margin: '0 -8px'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f9fafb'
                                setHoveredDocument(file.id)
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent'
                                setHoveredDocument(null)
                              }}
                            >
                              <div style={{
                                width: '140px',
                                textAlign: 'right',
                                paddingRight: '16px',
                                flexShrink: 0
                              }}>
                                {editingFileName === file.id ? (
                                  <input
                                    type="text"
                                    value={editingFileNameValue}
                                    onChange={(e) => setEditingFileNameValue(e.target.value)}
                                    onBlur={() => {
                                      handleFileRename(file.id, editingFileNameValue + (file.name.match(/\.[^/.]+$/) || [''])[0])
                                      setEditingFileName(null)
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleFileRename(file.id, editingFileNameValue + (file.name.match(/\.[^/.]+$/) || [''])[0])
                                        setEditingFileName(null)
                                      } else if (e.key === 'Escape') {
                                        setEditingFileName(null)
                                      }
                                    }}
                                    style={{
                                      fontSize: '13px',
                                      padding: '2px 4px',
                                      border: '1px solid #2563eb',
                                      borderRadius: '2px',
                                      width: '120px'
                                    }}
                                    autoFocus
                                  />
                                ) : (
                                  <div style={{ position: 'relative' }}>
                                    <span
                                      style={{
                                        fontWeight: '500',
                                        fontSize: '13px',
                                        color: file.uploadStatus === 'uploading' ? '#666666' : '#374151',
                                        lineHeight: '1.2',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        display: 'block',
                                        cursor: 'text',
                                        opacity: file.uploadStatus === 'uploading' ? 0.7 : 1
                                      }}
                                      onClick={(e) => {
                                        if (file.uploadStatus !== 'uploading') {
                                          e.stopPropagation()
                                          setEditingFileName(file.id)
                                          setEditingFileNameValue(file.name.replace(/\.[^/.]+$/, ""))
                                        }
                                      }}
                                    >
                                      {file.name}
                                      {file.uploadStatus === 'uploading' && (
                                        <span style={{
                                          marginLeft: '8px',
                                          fontSize: '11px',
                                          color: '#666666'
                                        }}>
                                          ({uploadProgressMap[file.id] || 0}%)
                                        </span>
                                      )}
                                    </span>

                                    {/* Progress bar for uploading files */}
                                    {file.uploadStatus === 'uploading' && (
                                      <div style={{
                                        position: 'absolute',
                                        bottom: '-2px',
                                        left: 0,
                                        right: 0,
                                        height: '2px',
                                        backgroundColor: '#e5e7eb',
                                        borderRadius: '1px',
                                        overflow: 'hidden'
                                      }}>
                                        <div style={{
                                          height: '100%',
                                          backgroundColor: '#2563eb',
                                          width: `${uploadProgressMap[file.id] || 0}%`,
                                          transition: 'width 0.3s ease-out',
                                          borderRadius: '1px'
                                        }} />
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div style={{
                                flex: 1,
                                paddingLeft: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                <select
                                  disabled={file.uploadStatus === 'uploading'}
                                  value={file.type}
                                  onChange={(e) => {
                                    if (isEditing && editForm) {
                                      const updatedFiles = editForm.files?.map(f =>
                                        f.id === file.id ? { ...f, type: e.target.value as any } : f
                                      ) || []
                                      setEditForm({
                                        ...editForm,
                                        files: updatedFiles,
                                        updatedAt: new Date().toISOString()
                                      })
                                      setHasUnsavedChanges(true)
                                    }
                                  }}
                                  style={{
                                    fontSize: '13px',
                                    padding: '2px 4px',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '3px',
                                    backgroundColor: file.uploadStatus === 'uploading' ? '#f9f9f9' : '#ffffff',
                                    opacity: file.uploadStatus === 'uploading' ? 0.6 : 1,
                                    cursor: file.uploadStatus === 'uploading' ? 'not-allowed' : 'default'
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <option value="resume">Resume</option>
                                  <option value="cover-letter">Cover Letter</option>
                                  <option value="portfolio">Portfolio</option>
                                  <option value="transcript">Transcript</option>
                                  <option value="job-description">Job Description</option>
                                  <option value="other">Other</option>
                                </select>

                                <button
                                  disabled={file.uploadStatus === 'uploading'}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (file.uploadStatus !== 'uploading' && window.confirm('Delete this file?')) {
                                      handleFileDelete(file.id)
                                    }
                                  }}
                                  style={{
                                    fontSize: '11px',
                                    padding: '2px 6px',
                                    backgroundColor: file.uploadStatus === 'uploading' ? '#f9f9f9' : '#ffffff',
                                    color: file.uploadStatus === 'uploading' ? '#9ca3af' : '#dc2626',
                                    border: `1px solid ${file.uploadStatus === 'uploading' ? '#d1d5db' : '#dc2626'}`,
                                    cursor: file.uploadStatus === 'uploading' ? 'not-allowed' : 'pointer',
                                    opacity: file.uploadStatus === 'uploading' ? 0.6 : 1,
                                    borderRadius: '3px'
                                  }}
                                >
                                  Delete
                                </button>
                              </div>

                              <div style={{
                                width: '100px',
                                textAlign: 'right',
                                paddingLeft: '8px',
                                flexShrink: 0
                              }}>
                                <span style={{
                                  fontSize: '11px',
                                  color: '#666666',
                                  fontWeight: '500',
                                  padding: '2px 6px',
                                  backgroundColor: '#f3f4f6',
                                  borderRadius: '3px',
                                  border: '1px solid #e5e7eb'
                                }}>
                                  {getFileTypeLabel(file.type)}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Unsaved Changes Confirmation Dialog */}
                  {showUnsavedDialog && (
                    <div style={{
                      position: 'absolute',
                      top: '0',
                      left: '0',
                      right: '0',
                      bottom: '0',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderRadius: '8px',
                      zIndex: 2000
                    }}>
                      <div style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #e0e0e0',
                        borderRadius: '6px',
                        padding: '24px',
                        maxWidth: '400px',
                        textAlign: 'center'
                      }}>
                        <h4 style={{
                          margin: '0 0 12px 0',
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#000000'
                        }}>
                          Unsaved Changes
                        </h4>
                        <p style={{
                          margin: '0 0 20px 0',
                          fontSize: '14px',
                          color: '#666666',
                          lineHeight: '1.4'
                        }}>
                          You have unsaved changes. Are you sure you want to cancel and lose your changes?
                        </p>
                        <div style={{
                          display: 'flex',
                          gap: '12px',
                          justifyContent: 'center'
                        }}>
                          <button
                            onClick={() => setShowUnsavedDialog(false)}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e0e0e0',
                              borderRadius: '4px',
                              fontSize: '14px',
                              color: '#666666',
                              cursor: 'pointer'
                            }}
                          >
                            Keep Editing
                          </button>
                          <button
                            onClick={confirmCancelEdit}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#ff4444',
                              border: 'none',
                              borderRadius: '4px',
                              fontSize: '14px',
                              color: '#ffffff',
                              cursor: 'pointer',
                              fontWeight: '500'
                            }}
                          >
                            Discard Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {/* Job Description */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{
                  margin: '0 0 8px 0',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#000000'
                }}>
                  Job Description
                </h4>
                <div
                  style={{
                    fontSize: '13px',
                    lineHeight: '1.5',
                    color: '#333333',
                    cursor: selectedJob.jobDescription && selectedJob.jobDescription.length > 200 ? 'help' : 'default',
                    position: 'relative'
                  }}
                  onMouseEnter={() => setHoveredDescription(selectedJob._id)}
                  onMouseLeave={() => setHoveredDescription(null)}
                >
                  {selectedJob.jobDescription
                    ? truncateText(selectedJob.jobDescription, 200)
                    : 'No description available'
                  }

                  {hoveredDescription === selectedJob._id && selectedJob.jobDescription && selectedJob.jobDescription.length > 200 && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      left: '0',
                      right: '0',
                      backgroundColor: '#ffffff',
                      border: '1px solid #000000',
                      borderRadius: '4px',
                      padding: '12px',
                      fontSize: '12px',
                      color: '#000000',
                      zIndex: 1000,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                      marginTop: '8px',
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      <strong>Full Job Description:</strong>
                      <br />
                      <br />
                      {selectedJob.jobDescription}
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Dates - v6 Two Column Layout - Synced with Status History */}
              {selectedJob.statusHistory && selectedJob.statusHistory.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{
                    margin: '0 0 12px 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#000000'
                  }}>
                    Progress Dates
                  </h4>

                  <div style={{
                    maxWidth: '600px',
                    width: 'fit-content'
                  }}>
                    {selectedJob.statusHistory
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((historyEntry, index) => {
                        const isRejection = historyEntry.status === 'rejected'
                        const getStatusText = (entry: any) => {
                          if (entry.status === 'rejected') {
                            return `Rejection: ${statusLabels[selectedJob.rejectedAt as keyof typeof statusLabels]} → Rejected`
                          }
                          return `Status: ${statusLabels[entry.status as keyof typeof statusLabels]}`
                        }

                        const hasTooltipContent = historyEntry.note || historyEntry.operator

                        return (
                          <div
                            key={`${historyEntry.status}-${historyEntry.date}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '8px 0',
                              cursor: hasTooltipContent ? 'help' : 'default',
                              position: 'relative',
                              transition: 'background-color 0.15s ease',
                              borderRadius: '4px',
                              margin: '0 -8px'
                            }}
                            title={hasTooltipContent ?
                              `${historyEntry.note ? historyEntry.note : ''}${historyEntry.note && historyEntry.operator ? ' • ' : ''}${historyEntry.operator ? `by ${historyEntry.operator}` : ''}`
                              : undefined
                            }
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = isRejection ? '#fef2f2' : '#f9fafb'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            <div style={{
                              width: '140px',
                              textAlign: 'right',
                              paddingRight: '16px',
                              flexShrink: 0
                            }}>
                              <span style={{
                                fontWeight: '500',
                                fontSize: '13px',
                                color: isRejection ? '#dc2626' : '#374151',
                                lineHeight: '1.2'
                              }}>
                                {new Date(historyEntry.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>

                            <div style={{
                              flex: 1,
                              paddingLeft: '8px'
                            }}>
                              <span style={{
                                fontSize: '13px',
                                color: isRejection ? '#dc2626' : '#374151',
                                fontWeight: isRejection ? '600' : '400',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block',
                                lineHeight: '1.2'
                              }}>
                                {getStatusText(historyEntry)}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}

              {/* Notes & Follow-up */}
              {selectedJob.notes && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{
                    margin: '0 0 8px 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#000000'
                  }}>
                    Notes & Follow-up Deadlines
                  </h4>
                  <p style={{
                    margin: 0,
                    fontSize: '13px',
                    color: '#333333'
                  }}>
                    {selectedJob.notes}
                  </p>
                </div>
              )}

              {/* Related Documents */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px'
                }}>
                  <h4 style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#000000'
                  }}>
                    Related Documents
                  </h4>
                  <button
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.multiple = true
                      input.accept = '.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt,.md'
                      input.onchange = (e) => {
                        const files = (e.target as HTMLInputElement).files
                        if (files) {
                          handleFilesUpload(files)
                        }
                      }
                      input.click()
                    }}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#000000',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Add Files
                  </button>
                </div>

                {selectedJob.files && selectedJob.files.length > 0 ? (
                  <div style={{
                    maxWidth: '600px',
                    width: 'fit-content'
                  }}>
                    {/* Resume files first (highest priority) */}
                    {selectedJob.files
                      .filter(file => file.type === 'resume')
                      .concat(selectedJob.files.filter(file => file.type !== 'resume'))
                      .map((file, index) => {
                        const isPreviewable = file.mimeType.includes('pdf') || file.mimeType.includes('image')

                        return (
                          <div
                            key={file.id}
                            tabIndex={0}
                            role="button"
                            aria-label={`${file.name} - ${getFileTypeLabel(file.type)}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '8px 0',
                              cursor: 'pointer',
                              position: 'relative',
                              transition: 'background-color 0.15s ease',
                              borderRadius: '4px',
                              margin: '0 -8px',
                              outline: 'none'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#f9fafb'
                              setHoveredDocument(file.id)
                              handleFileHover(file, e.currentTarget)
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                              setHoveredDocument(null)
                              handleFileHoverEnd()
                            }}
                            onFocus={(e) => {
                              e.currentTarget.style.backgroundColor = '#f9fafb'
                              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.5)'
                              setHoveredDocument(file.id)
                              handleFileHover(file, e.currentTarget)
                            }}
                            onBlur={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                              e.currentTarget.style.boxShadow = 'none'
                              setHoveredDocument(null)
                              handleFileHoverEnd()
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                if (isMobileDevice) {
                                  handleMobilePreview(file, e.currentTarget)
                                } else {
                                  window.open(file.url, '_blank')
                                }
                              }
                            }}
                            onClick={(e) => {
                              if (isMobileDevice) {
                                e.preventDefault()
                                handleMobilePreview(file, e.currentTarget)
                              } else {
                                window.open(file.url, '_blank')
                              }
                            }}
                          >
                            <div style={{
                              width: '140px',
                              textAlign: 'right',
                              paddingRight: '16px',
                              flexShrink: 0
                            }}>
                              <span style={{
                                fontWeight: '500',
                                fontSize: '13px',
                                color: '#374151',
                                lineHeight: '1.2',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block'
                              }}>
                                {file.name}
                              </span>
                            </div>

                            <div style={{
                              flex: 1,
                              paddingLeft: '8px'
                            }}>
                              <span style={{
                                fontSize: '13px',
                                color: '#374151',
                                fontWeight: '400',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                display: 'block',
                                lineHeight: '1.2'
                              }}>
                                {getFileTypeLabel(file.type)}
                              </span>
                            </div>

                          </div>
                        )
                      })}
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '24px',
                    color: '#6b7280',
                    fontSize: '13px',
                    border: '1px dashed #d1d5db',
                    borderRadius: '8px',
                    backgroundColor: '#f9fafb'
                  }}>
                    No documents uploaded yet. Click "Add Files" to get started.
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div>
                <h4 style={{
                  margin: '0 0 12px 0',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#000000'
                }}>
                  Timeline
                </h4>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  position: 'relative'
                }}>
                  {statusOrder.map((status, index) => {
                    const isActive = getCurrentStatusIndex(selectedJob.status) >= index
                    const isCurrent = selectedJob.status === status
                    const isRejected = selectedJob.status === 'rejected' && selectedJob.rejectedAt === status

                    // Find the corresponding date from statusHistory
                    const statusHistory = selectedJob.statusHistory?.find(h => h.status === status)
                    const hasDate = statusHistory && isActive

                    return (
                      <React.Fragment key={status}>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            minWidth: '60px',
                            position: 'relative',
                            cursor: !isEditing ? 'pointer' : 'default'
                          }}
                          title={!isEditing ?
                            `Click to set status to ${statusLabels[status as keyof typeof statusLabels]}` :
                            (hasDate ? `${statusLabels[status as keyof typeof statusLabels]} on ${new Date(statusHistory.date).toLocaleDateString()}` : undefined)
                          }
                          onClick={(e) => {
                            e.stopPropagation()
                            if (isEditing && editForm) {
                              // In edit mode, update the draft timeline
                              handleFormChange('status', status)
                            } else if (!isEditing && selectedJob) {
                              // Outside edit mode, apply immediately
                              updateJobStatus(selectedJob._id, status, `Status manually set to ${statusLabels[status as keyof typeof statusLabels]}`)
                            }
                          }}
                          onMouseEnter={(e) => {
                            if (!isEditing) {
                              e.currentTarget.style.transform = 'scale(1.05)'
                              e.currentTarget.style.opacity = '0.8'
                            } else if (hasDate) {
                              e.currentTarget.style.transform = 'scale(1.05)'
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)'
                            e.currentTarget.style.opacity = '1'
                          }}
                        >
                          <div style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            backgroundColor: isRejected ? '#ff4444' : (isActive ? '#000000' : '#ffffff'),
                            border: `2px solid ${isRejected ? '#ff4444' : '#000000'}`,
                            marginBottom: '8px',
                            position: 'relative',
                            transition: 'all 0.2s ease'
                          }}>
                            {isActive && !isRejected && (
                              <div style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: '#ffffff',
                                margin: '3px'
                              }} />
                            )}
                            {isRejected && (
                              <div style={{
                                width: '8px',
                                height: '8px',
                                color: '#ffffff',
                                fontSize: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '2px',
                                fontWeight: 'bold'
                              }}>
                                X
                              </div>
                            )}
                          </div>
                          <div style={{
                            fontSize: '10px',
                            textAlign: 'center',
                            fontWeight: (isCurrent || isRejected) ? '600' : '400',
                            color: isRejected ? '#ff4444' : (isCurrent ? '#000000' : '#666666'),
                            marginBottom: '4px'
                          }}>
                            {statusLabels[status as keyof typeof statusLabels]}
                            {isRejected && (
                              <div style={{
                                fontSize: '8px',
                                color: '#ff4444',
                                marginTop: '2px',
                                fontWeight: '600'
                              }}>
                                Rejected @ {statusLabels[status as keyof typeof statusLabels]}
                              </div>
                            )}
                          </div>

                          {/* Show date if reached */}
                          {hasDate && (
                            <div style={{
                              fontSize: '8px',
                              color: isRejected ? '#ff4444' : '#666666',
                              textAlign: 'center',
                              fontWeight: '500'
                            }}>
                              {new Date(statusHistory.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                          )}

                          {/* Hover tooltip for detailed info */}
                          {hasDate && (
                            <div
                              style={{
                                position: 'absolute',
                                top: '-80px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: '180px',
                                backgroundColor: '#000000',
                                color: '#ffffff',
                                padding: '8px 10px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                textAlign: 'center',
                                zIndex: 1000,
                                opacity: 0,
                                pointerEvents: 'none',
                                transition: 'opacity 0.2s ease'
                              }}
                              className={`timeline-tooltip-${status}`}
                            >
                              <div style={{ fontWeight: '600', marginBottom: '2px' }}>
                                {statusLabels[status as keyof typeof statusLabels]}
                              </div>
                              <div style={{ fontSize: '10px', marginBottom: '2px' }}>
                                {new Date(statusHistory.date).toLocaleDateString('en-US', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })}
                              </div>
                              {statusHistory.operator && (
                                <div style={{ fontSize: '9px', color: '#cccccc' }}>
                                  by {statusHistory.operator}
                                </div>
                              )}
                              {statusHistory.note && (
                                <div style={{
                                  fontSize: '9px',
                                  color: '#cccccc',
                                  fontStyle: 'italic',
                                  marginTop: '2px',
                                  borderTop: '1px solid #333333',
                                  paddingTop: '2px'
                                }}>
                                  {statusHistory.note}
                                </div>
                              )}
                              {/* Arrow pointing down */}
                              <div style={{
                                position: 'absolute',
                                bottom: '-4px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: 0,
                                height: 0,
                                borderLeft: '4px solid transparent',
                                borderRight: '4px solid transparent',
                                borderTop: '4px solid #000000'
                              }} />
                            </div>
                          )}
                        </div>

                        {index < statusOrder.length - 1 && (
                          <div style={{
                            flex: 1,
                            height: '2px',
                            backgroundColor: (getCurrentStatusIndex(selectedJob.status) > index && selectedJob.status !== 'rejected') ? '#000000' : '#e0e0e0',
                            marginBottom: '24px'
                          }} />
                        )}
                      </React.Fragment>
                    )
                  })}
                </div>
              </div>

              {/* CSS for timeline hover effects */}
              <style>{`
                .timeline-tooltip-applied:hover,
                .timeline-tooltip-screening:hover,
                .timeline-tooltip-interview:hover,
                .timeline-tooltip-offer:hover,
                .timeline-tooltip-rejected:hover {
                  opacity: 1 !important;
                }
              `}</style>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Statistics */}
      <div style={{
        width: '280px',
        backgroundColor: '#ffffff',
        borderLeft: '1px solid #e0e0e0',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        overflowX: 'hidden'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '16px',
            fontWeight: '600',
            color: '#000000'
          }}>
            Application Statistics
          </h3>
          {onNavigateToSettings && (
            <button
              onClick={onNavigateToSettings}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                color: '#6b7280',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#374151'
                e.currentTarget.style.backgroundColor = '#f3f4f6'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#6b7280'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
              title="Database Settings"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1m15.5-6.5L19 6.5m-7 7L5.5 19.5M1 12.5L6.5 7m7 7l5.5 5.5"/>
              </svg>
            </button>
          )}
        </div>

        {/* Bar Chart - 5 Categories Only */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{
            maxWidth: '240px',
            margin: '0',
            padding: '8px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'end',
              gap: '6px',
              height: '120px'
            }}>
              {statusOrder.map((status) => {
                const count = statusStats[status as keyof typeof statusStats] || 0
                const maxCount = Math.max(...Object.values(statusStats))
                const height = maxCount > 0 ? (count / maxCount) * 100 : 0

                return (
                  <div
                    key={status}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      flex: 1,
                      minWidth: '32px'
                    }}
                  >
                    <div style={{
                      fontSize: '11px',
                      marginBottom: '4px',
                      fontWeight: '500',
                      color: '#000000'
                    }}>
                      {count}
                    </div>
                    <div style={{
                      width: '100%',
                      height: `${height}%`,
                      backgroundColor: status === 'rejected' ? '#dc2626' :
                                     status === 'offered' ? '#059669' : '#000000',
                      minHeight: count > 0 ? '6px' : '2px',
                      borderRadius: '2px'
                    }} />
                    <div style={{
                      fontSize: '9px',
                      marginTop: '4px',
                      color: '#666666',
                      textAlign: 'center',
                      lineHeight: '1.2',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      width: '100%'
                    }}>
                      {statusLabels[status as keyof typeof statusLabels]}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Pie Chart - 5 Categories */}
        <div style={{ marginBottom: '30px' }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: jobs.length > 0 ? (() => {
              let cumulativePercent = 0
              let gradientParts: string[] = []
              const colors = {
                applied: '#000000',
                screening: '#333333',
                interview: '#666666',
                offered: '#059669',
                rejected: '#dc2626'
              }

              statusOrder.forEach((status) => {
                const count = statusStats[status as keyof typeof statusStats] || 0
                const percent = (count / jobs.length) * 360
                if (percent > 0) {
                  const nextPercent = cumulativePercent + percent
                  gradientParts.push(`${colors[status as keyof typeof colors]} ${cumulativePercent}deg ${nextPercent}deg`)
                  cumulativePercent = nextPercent
                }
              })

              return gradientParts.length > 0 ? `conic-gradient(${gradientParts.join(', ')})` : '#e5e7eb'
            })() : '#e5e7eb',
            margin: '0 auto 15px auto'
          }} />

          <div style={{
            fontSize: '10px',
            color: '#666666',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}>
            {statusOrder.map((status) => {
              const count = statusStats[status as keyof typeof statusStats] || 0
              const percent = jobs.length > 0 ? Math.round((count / jobs.length) * 100) : 0
              // Only show non-zero percentages to avoid clutter
              if (percent > 0) {
                return (
                  <div key={status} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>{statusLabels[status as keyof typeof statusLabels]}</span>
                    <span>{percent}%</span>
                  </div>
                )
              }
              return null
            })}
          </div>
        </div>

        {/* Summary Counters */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '16px',
            border: '1px solid #e0e0e0',
            borderRadius: '6px'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#000000'
            }}>
              {generalStats.total}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#666666'
            }}>
              Total Applications
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '16px',
            border: '1px solid #e0e0e0',
            borderRadius: '6px'
          }}>
            <div style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#000000'
            }}>
              {generalStats.active}
            </div>
            <div style={{
              fontSize: '12px',
              color: '#666666'
            }}>
              Active Applications
            </div>
          </div>

          <div style={{
            fontSize: '14px',
            color: '#666666'
          }}>
            {generalStats.hired} Hired / {generalStats.rejected} Rejected
          </div>
        </div>
      </div>
    </div>


    {/* Preview Popover */}
    <PreviewPopover />

    {/* Mobile overlay for closing preview */}
    {isMobileDevice && previewState.file && (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'transparent',
          zIndex: 9999
        }}
        onClick={closeMobilePreview}
      />
    )}
    </>
  )
}

export default JobDashboard