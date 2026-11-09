function toISODate(value) {
  if (!value) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  const parsedDate = new Date(value)
  if (Number.isNaN(parsedDate.getTime())) return null

  const year = parsedDate.getFullYear()
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
  const day = String(parsedDate.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function toDisplayDate(value) {
  if (!value) return ''

  const isoDate = toISODate(value)
  if (!isoDate) return ''

  const [year, month, day] = isoDate.split('-').map(Number)

  return new Date(year, month - 1, day, 12).toLocaleDateString(
    'en-US',
    { month: 'short', day: '2-digit', year: 'numeric' }
  )
}

function getFileName(value) {
  if (!value) return ''

  const cleanPath = value.split('?')[0]
  return decodeURIComponent(cleanPath.split('/').pop() || '')
}

export function toApiApplication(application) {
  return {
    legacy_id: String(application.legacyId ?? application.id),
    candidate_name: application.candidateName || '',
    candidate_email: application.candidateEmail || '',
    candidate_phone: application.candidatePhone || '',
    company: application.company,
    role: application.role,
    job_location: application.jobLocation || '',
    job_type: application.jobType || '',
    job_url: application.jobUrl || '',
    salary_range: application.salaryRange || '',
    application_source: application.applicationSource || '',
    application_date: toISODate(application.date),
    status: application.status || 'Applied',
    resume_version: application.resumeVersion || '',
    notes: application.notes || '',
  }
}

export function fromApiApplication(application) {
  const legacyId = application.legacy_id || null

  const frontendId = legacyId
    ? (/^\d+$/.test(legacyId) ? Number(legacyId) : legacyId)
    : application.id

  return {
    id: frontendId,
    backendId: application.id,
    legacyId,
    company: application.company,
    role: application.role,
    date: toDisplayDate(application.application_date),
    status: application.status,
    jobUrl: application.job_url || '',
    jobLocation: application.job_location || '',
    jobType: application.job_type || '',
    salaryRange: application.salary_range || '',
    applicationSource: application.application_source || '',
    candidateName: application.candidate_name || '',
    candidateEmail: application.candidate_email || '',
    candidatePhone: application.candidate_phone || '',
    resumeVersion: application.resume_version || '',
    resumeName: getFileName(application.resume_file),
    resumeSize: '',
    coverLetterName: getFileName(application.cover_letter_file),
    coverLetterSize: '',
    otherAttachments: [],
    followUpDate: '',
    notes: application.notes || '',
  }
}
