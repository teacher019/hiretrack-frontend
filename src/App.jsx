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
  isLoggedIn,
  logout,
  getUsername,
  createApplication,
  updateApplication,
  deleteApplication,
} from './services/api'

import {
  toApiApplication,
  fromApiApplication,
} from './utils/applicationMapper'
import { useApplications } from './hooks/useApplications'
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
    const [authenticated, setAuthenticated] = useState(
    () => isLoggedIn() && Boolean(getUsername())
  )

  const [currentUsername, setCurrentUsername] = useState(getUsername)
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
    const record = await getApplicationFile(fileId)

    if (!record || !record.file) {
      setFileError('File not found. Please upload it again.')
      return
    }

    const objectUrl = URL.createObjectURL(record.file)

    const link = document.createElement('a')
    link.href = objectUrl
    link.download = record.name
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

  // Mark only previously saved files for deletion.
  if (editingId !== null && !isNewFile) {
    setPendingAttachmentDeletes((previous) =>
      previous.includes(attachment.id)
        ? previous
        : [...previous, attachment.id]
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
    const serverRecord = editingId !== null
      ? await updateApplication(existingApplication.backendId, apiData)
      : await createApplication(apiData)

    const mappedApplication = fromApiApplication(serverRecord)

    const savedApplication = {
      ...mappedApplication,
      ...applicationData,
      id: applicationId,
      backendId: serverRecord.id,
      legacyId: serverRecord.legacy_id || String(applicationId),
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
      // Delete previously saved attachments removed during editing
      for (const attachmentId of pendingAttachmentDeletes) {
        await deleteApplicationFile(
          `${applicationId}:attachment:${attachmentId}`
        )
      }

        // Clear pending deletion list after successful cleanup
      setPendingAttachmentDeletes([])
    } catch (fileError) {
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


  const interviewCount = applications.filter((item) => item.status === 'Interview').length
  const offerCount = applications.filter((item) => item.status === 'Offer').length
  const localToday = getTodayISODate()

  const upcomingFollowUps = applications.filter(
  (item) =>
    item.followUpDate &&
    item.followUpDate >= localToday
  )

  const followUpCount = upcomingFollowUps.length
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
  const handleLoginSuccess = () => {
    const username = getUsername()

    if (!username) return

    setIsDataReady(false)
    setSyncError('')
    setCurrentUsername(username)
    setAuthenticated(true)
  }

  const handleLogout = () => {
    logout()

    setIsDataReady(false)
    setSyncError('')
    setSyncAttempt(0)

    setAuthenticated(false)
    setCurrentUsername('')
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
          <a className="nav-link active" href="#dashboard">â–¦ Dashboard</a>
          <a className="nav-link" href="#applications">â–¤ Applications</a>
          <a className="nav-link" href="#followups">â—· Follow-ups</a>
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
              <span>↪</span> Logout
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
          <button className="profile-button" type="button">AK</button>
        </header>

        <Dashboard
          applications={applications}
          interviewCount={interviewCount}
          offerCount={offerCount}
          followUpCount={followUpCount}
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
          HireTrack Â· Job Application Pipeline &amp; Career CRM
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