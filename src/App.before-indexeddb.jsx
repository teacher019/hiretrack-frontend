import { useEffect, useState } from 'react'
import './App.css'

const initialApplications = [
  { id: 1, company: 'ABC Technologies', role: 'Frontend Developer', date: 'Oct 24, 2026', status: 'Interview' },
  { id: 2, company: 'XYZ Solutions', role: 'Python Developer', date: 'Oct 22, 2026', status: 'Applied' },
  { id: 3, company: 'Bright Future Ltd.', role: 'React Developer', date: 'Oct 20, 2026', status: 'Rejected' },
]

const applicationStatuses = [
  'Applied',
  'Interview',
  'Offer',
  'Rejected',
]

function getTodayISODate() {
  const today = new Date()

  const localToday = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
  )

  return localToday.toISOString().slice(0, 10)
}

function App() {
  const [applications, setApplications] = useState(() => {
  const savedApplications = localStorage.getItem('hiretrack-applications')

  return savedApplications
    ? JSON.parse(savedApplications)
    : initialApplications
})
  useEffect(() => {
  localStorage.setItem(
    'hiretrack-applications',
    JSON.stringify(applications)
  )
}, [applications])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
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
  
function handleSubmit(event) {
  event.preventDefault()
  console.log('Current Form Data:', form)
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
    resumeName: form.resumeName.trim(),
    resumeSize: form.resumeSize,
    coverLetterName: form.coverLetterName.trim(),
    coverLetterSize: form.coverLetterSize,
    otherAttachments: form.otherAttachments,
    followUpDate: form.followUpDate,
    notes: form.notes.trim(),
  }

  if (editingId !== null) {
    setApplications((previous) =>
      previous.map((item) =>
        item.id === editingId
          ? { ...item, ...applicationData }
          : item
      )
    )
  } else {
    setApplications((previous) => [
      { id: Date.now(), ...applicationData },
      ...previous,
    ])
  }

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

  setShowForm(false)
}
function handleDelete(id) {
  const confirmDelete = window.confirm(
    'Are you sure you want to delete this application?'
  )

  if (confirmDelete) {
    setApplications((previous) =>
      previous.filter((item) => item.id !== id)
    )
  }
}
function handleCancel() {
  setShowForm(false)
  setEditingId(null)
}

function handleDrop(event, nextStatus) {
  event.preventDefault()

  const draggedId = event.dataTransfer.getData('text/plain')

  if (!draggedId) return

  setApplications((previous) =>
    previous.map((application) =>
      String(application.id) === draggedId
        ? { ...application, status: nextStatus }
        : application
    )
  )

  event.dataTransfer.clearData()
}

function handleStatusChange(id, nextStatus) {
  setApplications((previous) =>
    previous.map((application) =>
      application.id === id
        ? { ...application, status: nextStatus }
        : application
    )
  )
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

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2 className="brand">HireTrack<span>.</span></h2>
        <p className="menu-label">WORKSPACE</p>
        <nav className="navigation">
          <a className="nav-link active" href="#dashboard">▦ Dashboard</a>
          <a className="nav-link" href="#applications">▤ Applications</a>
          <a className="nav-link" href="#followups">◷ Follow-ups</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="avatar">AK</div>
          <div>
            <strong>My Workspace</strong>
            <p>Job Seeker</p>
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

        <section className="welcome">
          <div>
            <p className="eyebrow light">CAREER OVERVIEW</p>
            <h2>Keep your career moving forward.</h2>
            <p>Track your job applications and never miss a follow-up.</p>
          </div>
          <span className="welcome-icon">↗</span>
        </section>

        <section className="summary-grid">
          <article className="summary-card">
            <p>Total Applications</p>
            <h2>{applications.length}</h2>
            <span>All tracked opportunities</span>
          </article>
          <article className="summary-card">
            <p>Interviews</p>
            <h2>{interviewCount}</h2>
            <span>Interview stage</span>
          </article>
          <article className="summary-card">
            <p>Offers</p>
            <h2>{offerCount}</h2>
            <span>Potential opportunities</span>
          </article>
          <article className="summary-card">
            <p>Follow-ups</p>
            <h2>{followUpCount}</h2>
            <span>Need your attention</span>
          </article>
        </section>

        <section className="kanban-section">
          <div className="section-heading">
            <div>
              <h2>Application Pipeline</h2>
              <p>Drag applications between stages to update their status.</p>
            </div>
            <span className="kanban-total">
            {applications.length} Applications
            </span>
          </div>

          <div className="kanban-board">
            {applicationStatuses.map((status) => {
            const columnApplications = applications.filter(
            (application) => application.status === status
            )

            return (
            <div
              className={`kanban-column ${status.toLowerCase()}`}
              key={status}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => handleDrop(event, status)}
            >
            <div className="kanban-column-header">
              <h3>{status}</h3>
              <span>{columnApplications.length}</span>
            </div>

            <div className="kanban-cards">
              {columnApplications.length > 0 ? (
                columnApplications.map((application) => (
                  <article
                    className="kanban-card"
                    key={application.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData(
                        'text/plain',
                        String(application.id)
                        )
                      event.dataTransfer.effectAllowed = 'move'
                    }}
                  >
                  <div className="kanban-card-top">
                    <strong>{application.company}</strong>
                    <span className="drag-indicator">⠿</span>
                  </div>

                  <p>{application.role}</p>

                  <small>
                    Applied: {application.date}
                  </small>

                  <label className="kanban-status-label">
                    Change status
                    <select
                      value={application.status}
                      onChange={(event) =>
                        handleStatusChange(
                          application.id,
                          event.target.value
                        )
                      }
                      onClick={(event) => event.stopPropagation()}
                    >
                      {applicationStatuses.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="kanban-card-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => handleEdit(application)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => handleDelete(application.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
                ))
              ) : (
              <p className="kanban-empty">
                Drop applications here
              </p>
              )}
            </div>
            </div>
          )
        })}
        </div>
        </section>

        <section className="content-card" id="applications">
          <div className="section-heading">
            <div>
              <h2>Recent Applications</h2>
              <p>Keep track of your latest opportunities.</p>
            </div>
            <button
              className="primary-button"
              type="button"
              onClick={() => {
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
            >
              + Add Application
            </button>
          </div>

          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>COMPANY &amp; ROLE</th>
                  <th>APPLIED DATE</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td>
                      <strong>{application.company}</strong>
                      <span className="role-name">{application.role}</span>
                    </td>
                    <td>{application.date}</td>
                    <td>
                      <span className={`status ${application.status.toLowerCase()}`}>
                        {application.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="secondary-button"
                        type="button"
                        onClick={() => handleEdit(application)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete-button"
                        type="button"
                        onClick={() => handleDelete(application.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="content-card followup-card" id="followups">
          <div className="section-heading">
            <div>
              <h2>Upcoming Follow-ups</h2>
              <p>Remember to follow up with employers.</p>
            </div>
          </div>
        {upcomingFollowUps.length > 0 ? (
          upcomingFollowUps.map((item) => (
          <div className="followup-item" key={item.id}>
          <div className="calendar-icon">◷</div>

          <div className="followup-details">
            <strong>{item.company}</strong>
            <p>Follow up regarding {item.role}</p>
          </div>

          <span className="followup-date">
            {new Date(
            `${item.followUpDate}T12:00:00`
            ).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            })}
          </span>
        </div>
        ))
        ) : (
          <p className="empty-message">
              No upcoming follow-ups. Add a follow-up date to an application.
          </p>
          )}
        </section>

        <footer className="footer">
          HireTrack · Job Application Pipeline &amp; Career CRM
        </footer>
      </main>

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <section
            className="application-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="form-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <p className="eyebrow">CAREER WORKSPACE</p>
                <h2 id="form-title">
                  {editingId !== null ? 'Edit Application' : 'Add Application'}
              </h2>
                <p>Enter the details of a job opportunity.</p>
              </div>
              <button
                className="close-button"
                type="button"
                aria-label="Close form"
                onClick={() => setShowForm(false)}
              >
                ×
              </button>
            </div>

            <form className="application-form" onSubmit={handleSubmit}>
              <label>
                Company Name *
                <input name="company" value={form.company} onChange={handleChange} required />
              </label>

              <label>
                Candidate Name
                <input
                  name="candidateName"
                  type="text"
                  value={form.candidateName}
                  onChange={handleChange}
                  placeholder="Enter candidate name"
                />
              </label>

              <label>
                Candidate Email
                <input
                  name="candidateEmail"
                  type="email"
                  value={form.candidateEmail}
                  onChange={handleChange}
                  placeholder="candidate@example.com"
                />
              </label>

              <label>
                Candidate Phone
                <input
                  name="candidatePhone"
                  type="tel"
                  value={form.candidatePhone}
                  onChange={handleChange}
                  placeholder="+8801XXXXXXXXX"
                />
              </label>

              <label>
                Job Title *
                <input name="role" value={form.role} onChange={handleChange} required />
              </label>

              <label>
                Job URL
                <input name="jobUrl" type="url" value={form.jobUrl} onChange={handleChange} placeholder="https://example.com/job" />
              </label>

              <label>
                Job Location
                <input
                name="jobLocation"
                type="text"
                value={form.jobLocation}
                onChange={handleChange}
                placeholder="e.g. Dhaka, Bangladesh or Remote"
                />
              </label>

              <label>
                Job Type
                <select
                  name="jobType"
                  value={form.jobType}
                  onChange={handleChange}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Remote">Remote</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </label>

              <label>
                Salary Range
                <input
                  name="salaryRange"
                  type="text"
                  value={form.salaryRange}
                  onChange={handleChange}
                  placeholder="e.g. $40,000 - $60,000"
                />
              </label>

              <label>
                Application Source
                <select
                name="applicationSource"
                value={form.applicationSource}
                onChange={handleChange}
                >
                  <option value="LinkedIn">LinkedIn</option>
                  <option value="Indeed">Indeed</option>
                  <option value="Bdjobs">Bdjobs</option>
                  <option value="Company Website">Company Website</option>
                  <option value="Referral">Referral</option>
                  <option value="Other">Other</option>
                </select>
              </label>

              <div className="form-group">
                <label>Resume Version</label>
                  <select
                    value={form.resumeVersion}
                    onChange={(event) =>
                    setForm({ ...form, resumeVersion: event.target.value })
                    }
                  >
                    <option value="Version 1">Version 1</option>
                    <option value="Version 2">Version 2</option>
                    <option value="Version 3">Version 3</option>
                    <option value="Custom">Custom</option>
                  </select>
              </div>

              <div className="form-group">
                <label>Resume File Name</label>
                  <input
                    type="text"
                    value={form.resumeName}
                    onChange={(event) =>
                    setForm({ ...form, resumeName: event.target.value })
                    }
                    placeholder="e.g. Abdul_Khalek_CV.pdf"
                  />
              </div>

              <div className="form-group">
                <label>Upload Resume / CV</label>

                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(event) => {
                      const file = event.target.files[0]

                      if (file) {
                        const fileSize = (file.size / 1024).toFixed(2)

                        setForm((previousForm) => ({
                        ...previousForm,
                        resumeName: file.name,
                        resumeSize: `${fileSize} KB`,
                        }))
                      }
                    }}
                  />

                  <small>Accepted formats: PDF, DOC, DOCX</small>

                  {form.resumeName && (
                  <p>
                    Selected File: {form.resumeName}
                    {form.resumeSize && ` — ${form.resumeSize}`}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label>Upload Cover Letter</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(event) => {
                    const file = event.target.files[0]

                    if (file) {
                      const fileSize = (file.size / 1024).toFixed(2)

                      setForm((previousForm) => ({
                        ...previousForm,
                        coverLetterName: file.name,
                        coverLetterSize: `${fileSize} KB`,
                      }))
                    }
                  }}
                />

                <small>Accepted formats: PDF, DOC, DOCX</small>

                {form.coverLetterName && (
                  <p>
                    Selected File: {form.coverLetterName}
                    {form.coverLetterSize && ` — ${form.coverLetterSize}`}
                  </p>
                )}
              </div>

              <div className="form-group">
                <label>Other Attachments</label>

                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(event) => {
                    const files = Array.from(event.target.files)

                    const newAttachments = files.map((file, index) => ({
                      id: `${Date.now()}-${index}`,
                      name: file.name,
                      size: `${(file.size / 1024).toFixed(2)} KB`,
                    }))

                    setForm((previousForm) => ({
                    ...previousForm,
                    otherAttachments: [
                    ...previousForm.otherAttachments,
                    ...newAttachments,
                    ],
                    }))

                    event.target.value = ''
                    }}
                  />

                  <small>
                    Accepted formats: PDF, DOC, DOCX, JPG, JPEG, PNG. Multiple files allowed.
                  </small>

                  {form.otherAttachments.length > 0 && (
                  <div className="attachment-list">
                      <p><strong>Selected Attachments:</strong></p>

                      {form.otherAttachments.map((file) => (
                      <div className="attachment-item" key={file.id}>
                        <span>
                          {file.name} — {file.size}
                        </span>

                        <button
                            type="button"
                            className="delete-button"
                            onClick={() => {
                            setForm((previousForm) => ({
                            ...previousForm,
                            otherAttachments: previousForm.otherAttachments.filter(
                            (item) => item.id !== file.id
                            ),
                            }))
                          }}
                        >
                          Remove
                        </button>
                      </div>
                      ))}
                    </div>
                    )}
                  </div>

                  <div className="form-row">
                  <label>
                    Status
                    <select name="status" value={form.status} onChange={handleChange}>
                    <option>Applied</option>
                    <option>Interview</option>
                    <option>Offer</option>
                    <option>Rejected</option>
                  </select>
                </label>

                <label>
                  Applied Date *
                  <input name="date" type="date" value={form.date} onChange={handleChange} required />
                </label>
                <label>
                  Follow-up Date
                  <input
                  name="followUpDate"
                  type="date"
                  value={form.followUpDate}
                  onChange={handleChange}
                  />
                </label>
              </div>

              <label>
                Notes
                <textarea name="notes" value={form.notes} onChange={handleChange} rows="3" placeholder="Add any useful details..." />
              </label>

              <div className="form-actions">
                <button className="secondary-button"
                  type="button"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
                <button className="primary-button" type="submit">
                  {editingId !== null ? 'Save Changes' : 'Save Application'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

export default App
