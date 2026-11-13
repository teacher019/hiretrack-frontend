const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'

const ACCESS_TOKEN_KEY = 'hiretrack-access-token'
const REFRESH_TOKEN_KEY = 'hiretrack-refresh-token'
const USERNAME_KEY = 'hiretrack-username'

let refreshPromise = null

// Read API response
async function readResponse(response) {
  if (response.status === 204) return null

  const contentType = response.headers.get('content-type') || ''

  const data = contentType.includes('application/json')
    ? await response.json()
    : await response.text()

  if (!response.ok) {
    const message =
      typeof data === 'string'
        ? data
        : data.detail || JSON.stringify(data)

    throw new Error(message || `API Error: ${response.status}`)
  }

  return data
}

// JWT Login
export async function login(username, password) {
  const response = await fetch(`${API_BASE_URL}/token/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  })

  const data = await readResponse(response)

  localStorage.setItem(ACCESS_TOKEN_KEY, data.access)
  localStorage.setItem(USERNAME_KEY, username.trim())
  localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh)

  return data
}

// JWT Token Refresh
// JWT Token Refresh (Single Request)
export function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise
  }

  const refresh = localStorage.getItem(REFRESH_TOKEN_KEY)

  if (!refresh) return Promise.resolve(null)

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh }),
      })

      const data = await readResponse(response)

      localStorage.setItem(ACCESS_TOKEN_KEY, data.access)

      if (data.refresh) {
        localStorage.setItem(REFRESH_TOKEN_KEY, data.refresh)
      }

      return data.access
    } catch {
      logout()
      return null
    } finally {
      refreshPromise = null
    }
  })()

  return refreshPromise
}

// Logout
export function logout() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USERNAME_KEY)
}

// Check Login
export function getUsername() {
  return localStorage.getItem(USERNAME_KEY) || ''
}

export function isLoggedIn() {
  return Boolean(localStorage.getItem(ACCESS_TOKEN_KEY))
}

// Authenticated API Request
export async function apiRequest(path, options = {}) {
  const sendRequest = async (token) => {
    const headers = { ...options.headers }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    let body = options.body

    if (body && !(body instanceof FormData) && typeof body !== 'string') {
      headers['Content-Type'] = 'application/json'
      body = JSON.stringify(body)
    }

    if (body instanceof FormData) {
      delete headers['Content-Type']
    }

    return fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      body,
    })
  }

  let token = localStorage.getItem(ACCESS_TOKEN_KEY)
  let response = await sendRequest(token)

  if (response.status === 401 && token) {
    const newToken = await refreshAccessToken()

    if (newToken) {
      response = await sendRequest(newToken)
    }
  }

  return readResponse(response)
}

// Application APIs
export function getApplications() {
  return apiRequest('/applications/')
}

export function createApplication(data) {
  return apiRequest('/applications/', {
    method: 'POST',
    body: data,
  })
}

export function updateApplication(id, data) {
  return apiRequest(`/applications/${id}/`, {
    method: 'PATCH',
    body: data,
  })
}

export function deleteApplication(id) {
  return apiRequest(`/applications/${id}/`, {
    method: 'DELETE',
  })
}

// Application Resume and Cover Letter Upload
export function uploadApplicationFiles(id, files) {
  const formData = new FormData()

  if (files.resumeFile) {
    formData.append('resume_file', files.resumeFile)
  }

  if (files.coverLetterFile) {
    formData.append('cover_letter_file', files.coverLetterFile)
  }

  return apiRequest(`/applications/${id}/`, {
    method: 'PATCH',
    body: formData,
  })
}

// Other Attachment APIs
export function getAttachments() {
  return apiRequest('/attachments/')
}

export function uploadAttachment(applicationId, file) {
  const formData = new FormData()

  formData.append('application', applicationId)
  formData.append('file', file)
  formData.append('original_name', file.name)

  return apiRequest('/attachments/', {
    method: 'POST',
    body: formData,
  })
}

export function deleteAttachment(id) {
  return apiRequest(`/attachments/${id}/`, {
    method: 'DELETE',
  })
}

// Follow-up APIs
export function getFollowUps() {
  return apiRequest('/followups/')
}

export function createFollowUp(data) {
  return apiRequest('/followups/', {
    method: 'POST',
    body: data,
  })
}

export function updateFollowUp(id, data) {
  return apiRequest(`/followups/${id}/`, {
    method: 'PATCH',
    body: data,
  })
}

export function deleteFollowUp(id) {
  return apiRequest(`/followups/${id}/`, {
    method: 'DELETE',
  })
}


// Notification APIs
export function getNotifications() {
  return apiRequest('/notifications/')
}

export function syncNotifications() {
  return apiRequest('/notifications/sync/', {
    method: 'POST',
  })
}

export function markNotificationRead(id) {
  return apiRequest(`/notifications/${id}/read/`, {
    method: 'PATCH',
    body: {
      is_read: true,
    },
  })
}

export function markNotificationUnread(id) {
  return apiRequest(`/notifications/${id}/read/`, {
    method: 'PATCH',
    body: {
      is_read: false,
    },
  })
}
