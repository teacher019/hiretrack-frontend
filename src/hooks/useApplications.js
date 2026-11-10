import { useEffect, useState } from 'react'
import { loadAndMigrateApplications } from '../services/applicationSync'

export function useApplications(authenticated, currentUsername) {
  const [applications, setApplications] = useState(() => {
    if (!authenticated || !currentUsername) {
      return []
    }

    try {
      const savedApplications = localStorage.getItem(
        `hiretrack-applications-${currentUsername}`
      )

      return savedApplications ? JSON.parse(savedApplications) : []
    } catch {
      return []
    }
  })

  const [isDataReady, setIsDataReady] = useState(false)
  const [syncError, setSyncError] = useState('')
  const [syncAttempt, setSyncAttempt] = useState(0)

  // Save applications to LocalStorage
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

  // Load applications from backend and migrate local data
    useEffect(() => {
    if (!authenticated || !currentUsername) {
      return
    }
    let isActive = true

    async function syncApplications() {
      try {
        const savedData = localStorage.getItem(
          `hiretrack-applications-${currentUsername}`
        )

        const localApplications = savedData
          ? JSON.parse(savedData)
          : []

        if (!Array.isArray(localApplications)) {
          throw new Error('Invalid local application data.')
        }

        const backendApplications =
          await loadAndMigrateApplications(localApplications)

        if (!isActive) return

        setApplications(backendApplications)
        setIsDataReady(true)
      } catch (error) {
        if (!isActive) return

        console.error('Application sync failed:', error)

        setSyncError(
          error.message || 'Unable to synchronize applications.'
        )
      }
    }

    syncApplications()

    return () => {
      isActive = false
    }
  }, [authenticated, currentUsername, syncAttempt])

  return {
    applications,
    setApplications,
    isDataReady,
    setIsDataReady,
    syncError,
    setSyncError,
    syncAttempt,
    setSyncAttempt,
  }
}
