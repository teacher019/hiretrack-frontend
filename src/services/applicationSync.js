
import {
  getApplications,
  createApplication,
  getAttachments,
  getFollowUps,
  createFollowUp,
} from './api'

import {
  toApiApplication,
  fromApiApplication,
} from '../utils/applicationMapper'

function getApplicationList(response) {
  if (Array.isArray(response)) return response

  if (Array.isArray(response?.results)) {
    return response.results
  }

  throw new Error('Invalid applications API response.')
}

function getAttachmentList(response) {
  if (Array.isArray(response)) return response

  if (Array.isArray(response?.results)) {
    return response.results
  }

  throw new Error('Invalid attachments API response.')
}

function getFollowUpList(response) {
  if (Array.isArray(response)) return response

  if (Array.isArray(response?.results)) {
    return response.results
  }

  throw new Error('Invalid follow-ups API response.')
}

export async function loadAndMigrateApplications(localApplications = []) {
  // Load current user's Backend applications
  let serverApplications = getApplicationList(
    await getApplications()
  )

  // Collect existing legacy IDs to prevent duplicates
  const existingLegacyIds = new Set(
    serverApplications
      .map((application) => application.legacy_id)
      .filter(Boolean)
      .map(String)
  )

  // Migrate only old local records without a Backend ID
  let migratedCount = 0

  for (const localApplication of localApplications) {
    if (localApplication.backendId) continue

    const legacyId = String(
      localApplication.legacyId ?? localApplication.id
    )

    if (!legacyId || existingLegacyIds.has(legacyId)) {
      continue
    }

    await createApplication(
      toApiApplication(localApplication)
    )

    existingLegacyIds.add(legacyId)
    migratedCount += 1
  }

  // Fetch again only when new records were migrated
  if (migratedCount > 0) {
    serverApplications = getApplicationList(
      await getApplications()
    )
  }

  // Load current user's Backend attachments
  const serverAttachments = getAttachmentList(
    await getAttachments()
  )

  // Load current user's Backend follow-ups
  let serverFollowUps = getFollowUpList(
    await getFollowUps()
  )

  // Preserve local file metadata and IndexedDB-linked IDs
  const localByLegacyId = new Map(
    localApplications.map((application) => [
      String(application.legacyId ?? application.id),
      application,
    ])
  )

  // Index existing follow-ups by Backend application ID
  const followUpsByApplication = new Map()

  for (const followUp of serverFollowUps) {
    const applicationKey = String(followUp.application)

    if (!followUpsByApplication.has(applicationKey)) {
      followUpsByApplication.set(applicationKey, [])
    }

    followUpsByApplication.get(applicationKey).push(followUp)
  }

  // Migrate local follow-up dates that do not exist on Backend
  let migratedFollowUpCount = 0

  for (const application of serverApplications) {
    const local = application.legacy_id
      ? localByLegacyId.get(String(application.legacy_id))
      : null

    const existingFollowUps =
      followUpsByApplication.get(String(application.id)) || []

    const localFollowUpDate = local?.followUpDate || ''

    if (
      !localFollowUpDate ||
      existingFollowUps.length > 0
    ) {
      continue
    }

    const createdFollowUp = await createFollowUp({
      application: application.id,
      follow_up_date: localFollowUpDate,
      notes: '',
    })

    followUpsByApplication.set(
      String(application.id),
      [createdFollowUp]
    )

    migratedFollowUpCount += 1
  }

  // Refresh follow-ups after migration
  if (migratedFollowUpCount > 0) {
    serverFollowUps = getFollowUpList(
      await getFollowUps()
    )

    followUpsByApplication.clear()

    for (const followUp of serverFollowUps) {
      const applicationKey = String(followUp.application)

      if (!followUpsByApplication.has(applicationKey)) {
        followUpsByApplication.set(applicationKey, [])
      }

      followUpsByApplication.get(applicationKey).push(followUp)
    }
  }

  // Group Backend attachments by application ID
  const attachmentsByApplication = new Map()

  for (const attachment of serverAttachments) {
    const applicationKey = String(attachment.application)

    if (!attachmentsByApplication.has(applicationKey)) {
      attachmentsByApplication.set(applicationKey, [])
    }

    attachmentsByApplication.get(applicationKey).push({
      id: attachment.id,
      backendId: attachment.id,
      name: attachment.original_name || '',
      size: `${(Number(attachment.file_size || 0) / 1024).toFixed(2)} KB`,
      fileUrl: attachment.file || '',
      storage: 'backend',
    })
  }

  // Map Backend applications to Frontend records
  const mappedApplications = serverApplications.map((application) => {
    const mapped = fromApiApplication(application)

    const local = application.legacy_id
      ? localByLegacyId.get(String(application.legacy_id))
      : null

    const backendAttachments =
      attachmentsByApplication.get(String(application.id)) || []

    const localAttachments = local?.otherAttachments || []

    const unmatchedLocalAttachments = localAttachments.filter(
      (localFile) => !backendAttachments.some(
        (backendFile) => backendFile.name === localFile.name
      )
    )

    const applicationFollowUps =
      followUpsByApplication.get(String(application.id)) || []

    // API orders follow-ups by descending date.
    const latestFollowUp = applicationFollowUps[0]

    return {
      ...local,
      ...mapped,
      resumeName: mapped.resumeName || local?.resumeName || '',
      resumeSize: local?.resumeSize || '',
      coverLetterName:
        mapped.coverLetterName || local?.coverLetterName || '',
      coverLetterSize: local?.coverLetterSize || '',
      otherAttachments: [
        ...backendAttachments,
        ...unmatchedLocalAttachments,
      ],
      followUpDate:
        latestFollowUp?.follow_up_date ||
        local?.followUpDate ||
        '',
      followUpId: latestFollowUp?.id || null,
      followUpCompleted: latestFollowUp?.completed ?? false,
    }
  })

  return mappedApplications
}
