import { useEffect, useState } from 'react'
import {
  saveApplicationFile,
  getApplicationFile,
  deleteApplicationFile,
  deleteApplicationFiles,
} from './utils/fileStorage'
import './App.css'
import Login from './components/Login'
import ApplicationForm from './components/ApplicationForm'
import KanbanBoard from './components/KanbanBoard'
import Dashboard from './components/Dashboard'
import ApplicationsTable from './components/ApplicationsTable'
import FollowUpCalendar from './components/FollowUpCalendar'

import {
  createApplication,
  updateApplication,
  deleteApplication,
  uploadApplicationFiles,
  uploadAttachment,
  deleteAttachment,
  downloadFile,
  getFollowUps,
  createFollowUp,
  updateFollowUp,
  deleteFollowUp,
  syncNotifications,
  markNotificationRead,
  markNotificationUnread,
} from './services/api'


import {
  toApiApplication,
  fromApiApplication,
} from './utils/applicationMapper'
import { useApplications } from './hooks/useApplications'
import useAuth from './hooks/useAuth'
import {
  getTodayISODate,
  formatDateToISO,
  validateFile,
} from './utils/applicationHelpers'

const applicationStatuses = [
  'Applied',
  'Interview',
  'Offer',
  'Rejected',
]



function App() {
  const {
    authenticated,
    currentUsername,
    handleLoginSuccess: authLoginSuccess,
    handleLogout: authLogout,
  } = useAuth()
    // Backend Notifications
  const [notifications, setNotifications] = useState([])
  const [notificationError, setNotificationError] = useState('')
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)
  const {
    applications,
    setApplications,
    isDataReady,
    setIsDataReady,
    syncError,
    setSyncError,
    setSyncAttempt,
  } = useApplications(authenticated, currentUsername)
  useEffect(() => {
    if (!authenticated || !currentUsername || !isDataReady) {
      return
    }

    localStorage.setItem(
      `hiretrack-applications-${currentUsername}`,
      JSON.stringify(applications)
    )
  }, [
    applications,
    authenticated,
    currentUsername,
    isDataReady,
  ])
    // Backend Fetch and LocalStorage Migration

  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  )

  const [selectedCalendarDate, setSelectedCalendarDate] = useState(
  getTodayISODate()
  )

  const [notificationPermission, setNotificationPermission] = useState(
  () =>
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported'
  )
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  // Actual files selected by the user
  const [selectedResumeFile, setSelectedResumeFile] = useState(null)
  const [selectedCoverLetterFile, setSelectedCoverLetterFile] = useState(null)
  const [selectedOtherFiles, setSelectedOtherFiles] = useState([])
  const [pendingAttachmentDeletes, setPendingAttachmentDeletes] = useState([])
  const [fileError, setFileError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showNotificationPanel, setShowNotificationPanel] = useState(false)
  const [form, setForm] = useState({
  company: '',
  role: '',
  jobUrl: '',
  jobLocation: '',
  jobType: 'Full-time',
  salaryRange: '',
  applicationSource: 'LinkedIn',
  candidateName: '',
  candidateEmail: '',
  candidatePhone: '',
  resumeVersion: 'Version 1',
  resumeName: '',
  resumeSize: '',
  coverLetterName: '',
  coverLetterSize: '',
  otherAttachments: [],
  status: 'Applied',
  date: getTodayISODate(),
  followUpDate: '',
  notes: '',
})
function handleEdit(application) {
  setPendingAttachmentDeletes([])
  setSelectedResumeFile(null)
  setSelectedCoverLetterFile(null)
  setSelectedOtherFiles([])
  setFileError('')
  setEditingId(application.id)

  setForm({
    company: application.company,
    role: application.role,
    jobUrl: application.jobUrl || '',
    jobLocation: application.jobLocation || '',
    jobType: application.jobType || 'Full-time',
    salaryRange: application.salaryRange || '',
    applicationSource: application.applicationSource || 'LinkedIn',
    candidateName: application.candidateName || '',
    candidateEmail: application.candidateEmail || '',
    candidatePhone: application.candidatePhone || '',
    resumeVersion: application.resumeVersion || 'Version 1',
    resumeName: application.resumeName || '',
    resumeSize: application.resumeSize || '',
    coverLetterName: application.coverLetterName || '',
    coverLetterSize: application.coverLetterSize || '',
    otherAttachments: application.otherAttachments || [],
    status: application.status,
    date: application.date
    ? new Date(application.date).toISOString().slice(0, 10)
    : getTodayISODate(),
    followUpDate: application.followUpDate || '',
    notes: application.notes || '',
  })

  setShowForm(true)
}
function handleChange(event) {
    const { name, value } = event.target
    setForm((previous) => ({ ...previous, [name]: value }))
  }


async function handleDownloadFile(fileId) {
  try {
    const application = applications.find(
      (item) => String(item.id) === String(editingId)
    )

    if (!application) {
      setFileError('Application not found.')
      return
    }

    let downloadPath = ''
    let fileName = ''
    let localFileId = fileId

    if (fileId.endsWith(':resume')) {
      fileName = application.resumeName || 'resume'
      downloadPath = application.backendId
        ? `/applications/${application.backendId}/download-resume/`
        : ''
    } else if (fileId.endsWith(':coverLetter')) {
      fileName = application.coverLetterName || 'cover-letter'
      downloadPath = application.backendId
        ? `/applications/${application.backendId}/download-cover-letter/`
        : ''
    } else if (fileId.includes(':attachment:')) {
      const attachmentId = fileId.split(':attachment:').pop()

      const attachment = application.otherAttachments?.find(
        (item) => String(item.id) === String(attachmentId)
      )

      fileName = attachment?.name || 'attachment'

      const backendAttachmentId =
        attachment?.backendId || attachment?.id

      if (attachment?.storage === 'backend' && backendAttachmentId) {
        downloadPath = `/attachments/${backendAttachmentId}/download/`
      }
    }

    let fileBlob = null

    // Download Backend files using JWT authentication
    if (downloadPath) {
      try {
        fileBlob = await downloadFile(downloadPath)
      } catch (error) {
        console.error('Backend file download error:', error)

        // Only use IndexedDB fallback when the Backend file is missing.
        if (error.status !== 404) {
          throw error
        }
      }
    }

    // Fallback to IndexedDB for locally stored files
    if (!fileBlob) {
      const record = await getApplicationFile(localFileId)

      if (!record || !record.file) {
        setFileError('File not found. Please upload it again.')
        return
      }

      fileBlob = record.file
      fileName = record.name || fileName
    }

    const objectUrl = URL.createObjectURL(fileBlob)

    const link = document.createElement('a')
    link.href = objectUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    setTimeout(() => {
      URL.revokeObjectURL(objectUrl)
    }, 1000)

    setFileError('')
  } catch (error) {
    console.error('File download error:', error)
    setFileError('Unable to download file. Please try again.')
  }
}


function handleRemoveAttachment(attachment) {

  const isNewFile = selectedOtherFiles.some(
    (file) => file.id === attachment.id
  )

  // Track Backend and IndexedDB IDs separately
  if (editingId !== null && !isNewFile) {
    setPendingAttachmentDeletes((previous) =>
      previous.some((item) => item.localId === attachment.id)
        ? previous
        : [
            ...previous,
            {
              backendId: attachment.backendId ?? null,
              localId: attachment.id,
            },
          ]
    )
  }

  setSelectedOtherFiles((previous) =>
    previous.filter((file) => file.id !== attachment.id)
  )

  setForm((previousForm) => ({
    ...previousForm,
    otherAttachments: previousForm.otherAttachments.filter(
      (item) => item.id !== attachment.id
    ),
  }))

  setFileError('')
}



async function handleSubmit(event) {
  event.preventDefault()

  if (isSaving) return

  setIsSaving(true)
  setFileError('')

  const applicationId = editingId !== null
    ? editingId
    : Date.now()

  const existingApplication = editingId !== null
    ? applications.find(
        (item) => String(item.id) === String(editingId)
      )
    : null

  const applicationData = {
    company: form.company.trim(),
    role: form.role.trim(),
    date: new Date(`${form.date}T12:00:00`).toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }),
    status: form.status,
    jobUrl: form.jobUrl.trim(),
    jobLocation: form.jobLocation.trim(),
    jobType: form.jobType,
    salaryRange: form.salaryRange.trim(),
    applicationSource: form.applicationSource,
    candidateName: form.candidateName.trim(),
    candidateEmail: form.candidateEmail.trim(),
    candidatePhone: form.candidatePhone.trim(),
    resumeVersion: form.resumeVersion,
    resumeName: selectedResumeFile?.name || form.resumeName.trim(),
    resumeSize: selectedResumeFile?.size || form.resumeSize,
    coverLetterName: selectedCoverLetterFile?.name || form.coverLetterName.trim(),
    coverLetterSize: selectedCoverLetterFile?.size || form.coverLetterSize,
    otherAttachments: form.otherAttachments,
    followUpDate: form.followUpDate,
    notes: form.notes.trim(),
  }

  try {
    if (editingId !== null && !existingApplication?.backendId) {
      throw new Error('Backend application ID not found. Please reload and try again.')
    }

    const apiData = toApiApplication({
      ...applicationData,
      id: applicationId,
      legacyId: existingApplication?.legacyId ?? applicationId,
    })

    // Save application to Django Backend
    let serverRecord = editingId !== null
      ? await updateApplication(existingApplication.backendId, apiData)
      : await createApplication(apiData)

    // Upload Resume and Cover Letter to Django Backend
    if (selectedResumeFile || selectedCoverLetterFile) {
      serverRecord = await uploadApplicationFiles(serverRecord.id, {
        resumeFile: selectedResumeFile,
        coverLetterFile: selectedCoverLetterFile,
      })
    }

    // Upload other attachments and preserve Backend IDs
    const uploadedAttachmentRecords = []

    for (const attachment of selectedOtherFiles) {
      const uploaded = await uploadAttachment(
        serverRecord.id,
        attachment.file
      )

      uploadedAttachmentRecords.push({
        localId: attachment.id,
        backendId: uploaded.id,
        fileUrl: uploaded.file || '',
        name: uploaded.original_name || attachment.file.name,
        size: `${(Number(uploaded.file_size || attachment.file.size) / 1024).toFixed(2)} KB`,
        storage: 'backend',
      })
    }

    // Delete removed Backend attachments

    for (const attachment of pendingAttachmentDeletes) {
      if (attachment.backendId !== null) {
        await deleteAttachment(attachment.backendId)
      }
    }

    const mappedApplication = fromApiApplication(serverRecord)

    const savedApplication = {
      ...mappedApplication,
      ...applicationData,
      id: applicationId,
      backendId: serverRecord.id,
      legacyId: serverRecord.legacy_id || String(applicationId),
      otherAttachments: (applicationData.otherAttachments || []).map(
        (item) => {
          const uploaded = uploadedAttachmentRecords.find(
            (record) => record.localId === item.id
          )

          return uploaded
            ? {
                ...item,
                backendId: uploaded.backendId,
                fileUrl: uploaded.fileUrl,
                storage: uploaded.storage,
              }
            : item
        }
      ),
    }

    // Update React state after successful API response
    if (editingId !== null) {
      setApplications((previous) =>
        previous.map((item) =>
          String(item.id) === String(editingId)
            ? savedApplication
            : item
        )
      )
    } else {
      setApplications((previous) => [
        savedApplication,
        ...previous,
      ])
    }


    // Synchronize Follow-up with Django Backend
    try {

      const followUpResponse = await getFollowUps()

      const backendFollowUps = Array.isArray(followUpResponse)
        ? followUpResponse
        : followUpResponse?.results || []

      const existingFollowUps = backendFollowUps.filter(
        (item) =>
          String(item.application) === String(serverRecord.id)
      )

      if (applicationData.followUpDate) {
        if (existingFollowUps.length > 0) {
          // Update the existing Follow-up
          const existingFollowUp = existingFollowUps[0]

          await updateFollowUp(existingFollowUp.id, {
            follow_up_date: applicationData.followUpDate,
          })

          // Remove accidental duplicates, if any
          for (const duplicate of existingFollowUps.slice(1)) {
            await deleteFollowUp(duplicate.id)
          }
        } else {
          // Create a new Follow-up
          await createFollowUp({
            application: serverRecord.id,
            follow_up_date: applicationData.followUpDate,
            notes: '',
          })
        }
      } else {
        // Delete Follow-ups when the date is cleared
        for (const followUp of existingFollowUps) {
          await deleteFollowUp(followUp.id)
        }
      }
    } catch (followUpError) {
      console.error('Follow-up synchronization error:', followUpError)

      setFileError(
        'Application saved, but Follow-up synchronization failed. Please retry.'
      )
    }


    // Save selected files locally in IndexedDB
    try {
      if (selectedResumeFile) {
        await saveApplicationFile({
          id: `${applicationId}:resume`,
          applicationId,
          type: 'resume',
          file: selectedResumeFile,
          name: selectedResumeFile.name,
          size: selectedResumeFile.size,
          mimeType: selectedResumeFile.type,
          updatedAt: new Date().toISOString(),
        })
      }

      if (selectedCoverLetterFile) {
        await saveApplicationFile({
          id: `${applicationId}:coverLetter`,
          applicationId,
          type: 'coverLetter',
          file: selectedCoverLetterFile,
          name: selectedCoverLetterFile.name,
          size: selectedCoverLetterFile.size,
          mimeType: selectedCoverLetterFile.type,
          updatedAt: new Date().toISOString(),
        })
      }

      for (const attachment of selectedOtherFiles) {
        await saveApplicationFile({
          id: `${applicationId}:attachment:${attachment.id}`,
          applicationId,
          type: 'attachment',
          file: attachment.file,
          name: attachment.file.name,
          size: attachment.file.size,
          mimeType: attachment.file.type,
          updatedAt: new Date().toISOString(),
        })
      }
      // Delete previously saved IndexedDB attachments
      for (const attachment of pendingAttachmentDeletes) {
        await deleteApplicationFile(
          `${applicationId}:attachment:${attachment.localId}`
        )
      }

        // Clear pending deletion list after successful cleanup
      setPendingAttachmentDeletes([])
    } catch (fileError) {
      console.error('ATTACHMENT UPLOAD ERROR:', fileError)
      console.error('Local file storage error:', fileError)
      setFileError(
        'Application saved to server, but a local file could not be saved.'
      )

    }

    // Reset form
    setEditingId(null)

    setForm({
      company: '',
      role: '',
      jobUrl: '',
      jobLocation: '',
      jobType: 'Full-time',
      salaryRange: '',
      applicationSource: 'LinkedIn',
      candidateName: '',
      candidateEmail: '',
      candidatePhone: '',
      resumeVersion: 'Version 1',
      resumeName: '',
      resumeSize: '',
      coverLetterName: '',
      coverLetterSize: '',
      otherAttachments: [],
      status: 'Applied',
      date: getTodayISODate(),
      followUpDate: '',
      notes: '',
    })

    setSelectedResumeFile(null)
    setSelectedCoverLetterFile(null)
    setSelectedOtherFiles([])
    setShowForm(false)

  } catch (error) {
    console.error('Application API error:', error)
    setFileError(error.message || 'Unable to save application. Please try again.')
  } finally {
    setIsSaving(false)
  }
}


async function handleDelete(id) {
  const confirmDelete = window.confirm(
    'Are you sure you want to delete this application?'
  )

  if (!confirmDelete) return

  const application = applications.find(
    (item) => String(item.id) === String(id)
  )

  if (!application?.backendId) {
    setFileError('Backend application ID not found. Please reload and try again.')
    return
  }

  try {
    // First delete from Django Backend
    await deleteApplication(application.backendId)

    // Remove from React state after successful API deletion
    setApplications((previous) =>
      previous.filter(
        (item) => String(item.id) !== String(id)
      )
    )

    // Then delete local IndexedDB files
    try {
      await deleteApplicationFiles(id)
      setFileError('')
    } catch (fileError) {
      console.error('Local file deletion error:', fileError)
      setFileError(
        'Application deleted from server, but some local files could not be deleted.'
      )
    }

  } catch (error) {
    console.error('Application delete error:', error)
    setFileError(
      error.message || 'Unable to delete application. Please try again.'
    )
  }
}


function handleCancel() {
  setShowForm(false)
  setEditingId(null)
  setPendingAttachmentDeletes([])
  setSelectedResumeFile(null)
  setSelectedCoverLetterFile(null)
  setSelectedOtherFiles([])
  setFileError('')
}


async function handleDrop(event, nextStatus) {
  event.preventDefault()

  const draggedId = event.dataTransfer.getData('text/plain')
  if (!draggedId) return

  const application = applications.find(
    (item) => String(item.id) === draggedId
  )

  event.dataTransfer.clearData()

  if (!application || application.status === nextStatus) return

  if (!application.backendId) {
    setFileError('Backend application ID not found. Please reload and try again.')
    return
  }

  try {
    // Save new status to Django Backend
    await updateApplication(application.backendId, {
      status: nextStatus,
    })

    // Update React state after successful API response
    setApplications((previous) =>
      previous.map((item) =>
        String(item.id) === draggedId
          ? { ...item, status: nextStatus }
          : item
      )
    )

    setFileError('')
  } catch (error) {
    console.error('Drag and drop status update error:', error)
    setFileError(
      error.message || 'Unable to update application status.'
    )
  }
}



async function handleStatusChange(id, nextStatus) {
  const application = applications.find(
    (item) => String(item.id) === String(id)
  )

  if (!application) return

  if (!application.backendId) {
    setFileError('Backend application ID not found. Please reload and try again.')
    return
  }

  try {
    // Save status to Django Backend
    await updateApplication(application.backendId, {
      status: nextStatus,
    })

    // Update React state after successful API response
    setApplications((previous) =>
      previous.map((item) =>
        String(item.id) === String(id)
          ? { ...item, status: nextStatus }
          : item
      )
    )

    setFileError('')
  } catch (error) {
    console.error('Status update error:', error)
    setFileError(
      error.message || 'Unable to update application status.'
    )
  }
}

async function handleToggleFollowUpCompleted(application) {
  if (!application.followUpId) {
    setFileError(
      'Follow-up ID not found. Please reload and try again.'
    )
    return
  }

  const nextCompleted = !application.followUpCompleted

  try {
    // Save Completed status to Django Backend
    const updatedFollowUp = await updateFollowUp(
      application.followUpId,
      {
        completed: nextCompleted,
      }
    )

    // Update React state after successful API response
    setApplications((previous) =>
      previous.map((item) =>
        String(item.id) === String(application.id)
          ? {
              ...item,
              followUpCompleted:
                updatedFollowUp?.completed ?? nextCompleted,
            }
          : item
      )
    )

    setFileError('')
  } catch (error) {
    console.error('Follow-up completion update error:', error)

    setFileError(
      error.message || 'Unable to update follow-up completion.'
    )
  }
}

const interviewCount = applications.filter((item) => item.status === 'Interview').length
const offerCount = applications.filter((item) => item.status === 'Offer').length

const localToday = getTodayISODate()

const upcomingFollowUps = applications.filter(
  (item) =>
    item.followUpDate &&
    item.followUpDate >= localToday &&
    !item.followUpCompleted
)

const overdueFollowUps = applications.filter(
  (item) =>
    item.followUpDate &&
    item.followUpDate < localToday &&
    !item.followUpCompleted
)

const completedFollowUps = applications.filter(
  (item) =>
    item.followUpDate &&
    item.followUpCompleted
)

  const followUpCount = upcomingFollowUps.length
  const overdueFollowUpCount = overdueFollowUps.length

  const calendarDays = Array.from({ length: 42 }, (_, index) => {
  const firstDay = calendarMonth.getDay()

  const date = new Date(
    calendarMonth.getFullYear(),
    calendarMonth.getMonth(),
    index - firstDay + 1
  )

  const dateISO = formatDateToISO(date)

  return {
    date,
    dateISO,
    isCurrentMonth: date.getMonth() === calendarMonth.getMonth(),
    isToday: dateISO === localToday,
    followUps: applications.filter(
      (item) => item.followUpDate === dateISO
    ),
  }
})

  const selectedDateFollowUps = applications.filter(
  (item) => item.followUpDate === selectedCalendarDate
  )

function handlePreviousMonth() {
  setCalendarMonth(
    (previous) =>
      new Date(
        previous.getFullYear(),
        previous.getMonth() - 1,
        1
      )
  )
}

function handleNextMonth() {
  setCalendarMonth(
    (previous) =>
      new Date(
        previous.getFullYear(),
        previous.getMonth() + 1,
        1
      )
  )
}

async function handleEnableNotifications() {
  if (!('Notification' in window)) {
    setNotificationPermission('unsupported')
    return
  }

  const permission = await Notification.requestPermission()

  setNotificationPermission(permission)
}
  useEffect(() => {
  if (
    notificationPermission !== 'granted' ||
    !('Notification' in window)
  ) {
    return undefined
  }

  function checkDueFollowUps() {
    const today = getTodayISODate()

    const dueFollowUps = applications.filter(
      (item) => item.followUpDate === today
    )

    dueFollowUps.forEach((item) => {
      const notificationKey =
        `hiretrack-notified-${today}-${item.id}`

      if (localStorage.getItem(notificationKey)) {
        return
      }

      new Notification('HireTrack Follow-up Reminder', {
        body: `Today: Follow up with ${item.company} regarding ${item.role}.`,
      })

      localStorage.setItem(notificationKey, 'true')
    })
  }

  checkDueFollowUps()

  const intervalId = window.setInterval(
    checkDueFollowUps,
    60000
  )

  return () => window.clearInterval(intervalId)
}, [applications, notificationPermission])

  useEffect(() => {
    if (!authenticated || !currentUsername || !isDataReady) {
      return undefined
    }

    let isActive = true

    async function loadNotifications() {
      setIsLoadingNotifications(true)
      setNotificationError('')

      try {
        const data = await syncNotifications()

        if (isActive) {
          setNotifications(Array.isArray(data) ? data : [])
        }
      } catch (error) {
        console.error('Notification sync error:', error)

        if (isActive) {
          setNotificationError(
            error.message || 'Unable to load notifications.'
          )
        }
      } finally {
        if (isActive) {
          setIsLoadingNotifications(false)
        }
      }
    }

    loadNotifications()

    return () => {
      isActive = false
    }
  }, [authenticated, currentUsername, isDataReady, applications])

  async function handleMarkNotificationRead(notification) {
    try {
      const updated = await markNotificationRead(notification.id)

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notification.id ? updated : item
        )
      )

      setNotificationError('')
    } catch (error) {
      console.error('Mark notification read error:', error)
      setNotificationError(
        error.message || 'Unable to mark notification as read.'
      )
    }
  }

  async function handleMarkNotificationUnread(notification) {
    try {
      const updated = await markNotificationUnread(notification.id)

      setNotifications((previous) =>
        previous.map((item) =>
          item.id === notification.id ? updated : item
        )
      )

      setNotificationError('')
    } catch (error) {
      console.error('Mark notification unread error:', error)
      setNotificationError(
        error.message || 'Unable to mark notification as unread.'
      )
    }
  }
  const unreadNotificationCount = notifications.filter(
  (notification) => !notification.is_read
).length

 const handleLoginSuccess = () => {
  setIsDataReady(false)
  setSyncError('')
  authLoginSuccess()
}

const handleLogout = () => {
  authLogout()

  setIsDataReady(false)
  setSyncError('')
  setSyncAttempt(0)
  setApplications([])
}

  if (!authenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />
  }
  if (!isDataReady) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h2>
            {syncError
              ? 'Synchronization Failed'
              : 'Loading HireTrack...'}
          </h2>

          {syncError ? (
            <>
              <p className="login-error">{syncError}</p>

              <button
                type="button"
                onClick={() => {
                  setIsDataReady(false)
                  setSyncError('')
                  setSyncAttempt((previous) => previous + 1)
                }}
              >
                Retry Sync
              </button>

              <button
                type="button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <p>Loading your applications from the server...</p>
          )}
        </div>
      </div>
    )
  }
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2 className="brand">HireTrack<span>.</span></h2>
        <p className="menu-label">WORKSPACE</p>
        <nav className="navigation">
          <a className="nav-link active" href="#dashboard">{"\u25A6"} Dashboard</a>
          <a className="nav-link" href="#applications">{"\u25A4"} Applications</a>
          <a className="nav-link" href="#followups">{"\u2027"} Follow-ups</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="avatar">
            {currentUsername.charAt(0).toUpperCase()}
          </div>

          <div className="workspace-info">
            <strong>{currentUsername}</strong>
            <p>Job Seeker</p>
            <button
              className="logout-button"
              type="button"
              onClick={handleLogout}
            >
             <span>{"\u21AA"}</span> Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content" id="dashboard">
      <header className="topbar">
        <div>
          <p className="eyebrow">YOUR CAREER WORKSPACE</p>
          <h1>Dashboard</h1>
        </div>

        <div className="topbar-actions">
          <button
            className="notification-bell"
            type="button"
            aria-label={`Notifications: ${unreadNotificationCount} unread`}
            aria-expanded={showNotificationPanel}
            onClick={() =>
            setShowNotificationPanel((previous) => !previous)
            }
          >
            <span aria-hidden="true">🔔</span>

            {unreadNotificationCount > 0 && (
              <span className="notification-badge">
                {unreadNotificationCount > 99
                ? '99+'
                : unreadNotificationCount}
              </span>
            )}
          </button>

          <button className="profile-button" type="button">AK</button>
        </div>

      </header>

      {showNotificationPanel && (
        <section className="notification-panel">
          <div className="notification-panel-header">
            <h2>Notifications</h2>
            <span>{unreadNotificationCount} unread</span>
          </div>

          {isLoadingNotifications && (
            <p>Loading notifications...</p>
          )}

          {notificationError && (
            <p className="notification-error">
              {notificationError}
            </p>
          )}

          {!isLoadingNotifications && notifications.length === 0 && (
            <p className="notification-empty">
              No notifications yet.
            </p>
          )}

          <div className="notification-list">
            {notifications.map((notification) => (
              <article
                className={`notification-item ${
                  notification.is_read ? 'read' : 'unread'
                }`}
                key={notification.id}
              >
                <div className="notification-item-content">
                  <strong>{notification.title}</strong>

                  <p>{notification.message}</p>

                  <small>
                    {notification.company} — {notification.role}
                  </small>

                  <small>
                    Follow-up: {notification.follow_up_date}
                  </small>
                </div>

                <div className="notification-item-actions">
                  {notification.is_read ? (
                    <button
                      type="button"
                      onClick={() =>
                        handleMarkNotificationUnread(notification)
                      }
                    >
                      Mark Unread
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        handleMarkNotificationRead(notification)
                      }
                    >
                      Mark Read
                    </button>
                  )}

                  <a
                    href="#applications"
                    onClick={() => setShowNotificationPanel(false)}
                  >
                    View Application
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <Dashboard

          applications={applications}
          interviewCount={interviewCount}
          offerCount={offerCount}
          followUpCount={followUpCount}
          upcomingFollowUps={upcomingFollowUps}
          overdueFollowUps={overdueFollowUps}
          overdueFollowUpCount={overdueFollowUpCount}
          completedFollowUps={completedFollowUps}
          onToggleFollowUpCompleted={handleToggleFollowUpCompleted}
          today={localToday}
        />


        <KanbanBoard
          applications={applications}
          applicationStatuses={applicationStatuses}
          handleDrop={handleDrop}
          handleStatusChange={handleStatusChange}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />

        <ApplicationsTable
          applications={applications}
          onAddApplication={() => {
          setPendingAttachmentDeletes([])
          setSelectedResumeFile(null)
          setSelectedCoverLetterFile(null)
          setSelectedOtherFiles([])
          setEditingId(null)
            setForm({
              company: '',
              role: '',
              jobUrl: '',
              jobLocation: '',
              jobType: 'Full-time',
              salaryRange: '',
              applicationSource: 'LinkedIn',
              candidateName: '',
              candidateEmail: '',
              candidatePhone: '',
              resumeVersion: 'Version 1',
              resumeName: '',
              resumeSize: '',
              coverLetterName: '',
              coverLetterSize: '',
              otherAttachments: [],
              status: 'Applied',
              date: new Date().toISOString().slice(0, 10),
              followUpDate: '',
              notes: '',
            })
            setShowForm(true)
          }}
          handleEdit={handleEdit}
          handleDelete={handleDelete}
        />



        <FollowUpCalendar
          notificationPermission={notificationPermission}
          handleEnableNotifications={handleEnableNotifications}
          calendarMonth={calendarMonth}
          handlePreviousMonth={handlePreviousMonth}
          handleNextMonth={handleNextMonth}
          calendarDays={calendarDays}
          selectedCalendarDate={selectedCalendarDate}
          setSelectedCalendarDate={setSelectedCalendarDate}
          selectedDateFollowUps={selectedDateFollowUps}
          upcomingFollowUps={upcomingFollowUps}
        />

        <footer className="footer">
          HireTrack {"\u00B7"} Job Application Pipeline &amp; Career CRM
        </footer>
      </main>

      <ApplicationForm
        showForm={showForm}
        form={form}
        setForm={setForm}
        editingId={editingId}
        fileError={fileError}
        isSaving={isSaving}
        setSelectedResumeFile={setSelectedResumeFile}
        setSelectedCoverLetterFile={setSelectedCoverLetterFile}
        selectedOtherFiles={selectedOtherFiles}
        setSelectedOtherFiles={setSelectedOtherFiles}
        handleChange={handleChange}
        handleSubmit={handleSubmit}
        handleCancel={handleCancel}
        handleDownloadFile={handleDownloadFile}
        handleRemoveAttachment={handleRemoveAttachment}
        validateFile={validateFile}
        setFileError={setFileError}
      />    </div>
  )
}

export default App
