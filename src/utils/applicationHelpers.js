
const MAX_FILE_SIZE = 5 * 1024 * 1024

export function getTodayISODate() {
  const today = new Date()

  const localToday = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
  )

  return localToday.toISOString().slice(0, 10)
}

export function formatDateToISO(date) {
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  )

  return localDate.toISOString().slice(0, 10)
}

export function validateFile(file, allowedExtensions) {
  const extension = file.name
    .split('.')
    .pop()
    .toLowerCase()

  if (!allowedExtensions.includes(extension)) {
    return 'Invalid file format.'
  }

  if (file.size > MAX_FILE_SIZE) {
    return 'File size must not exceed 5 MB.'
  }

  return ''
}
