import {
  getApplications,
  createApplication,
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

  // Preserve local file metadata and IndexedDB-linked IDs
  const localByLegacyId = new Map(
    localApplications.map((application) => [
      String(application.legacyId ?? application.id),
      application,
    ])
  )

  const mappedApplications = serverApplications.map((application) => {
    const mapped = fromApiApplication(application)
    const local = application.legacy_id
      ? localByLegacyId.get(String(application.legacy_id))
      : null

    if (!local) return mapped

    return {
      ...local,
      ...mapped,
      resumeName: mapped.resumeName || local.resumeName || '',
      resumeSize: local.resumeSize || '',
      coverLetterName:
        mapped.coverLetterName || local.coverLetterName || '',
      coverLetterSize: local.coverLetterSize || '',
      otherAttachments: local.otherAttachments || [],
      followUpDate: local.followUpDate || '',
    }
  })

  return mappedApplications
}
