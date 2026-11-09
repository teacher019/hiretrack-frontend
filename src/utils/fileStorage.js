const DB_NAME = 'hiretrack-files'
const DB_VERSION = 1
const STORE_NAME = 'applicationFiles'

let dbPromise = null

function openDatabase() {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, {
          keyPath: 'id',
        })
      }
    }

    request.onsuccess = () => resolve(request.result)

    request.onerror = () => {
      dbPromise = null
      reject(request.error)
    }
  })

  return dbPromise
}

export async function saveApplicationFile(record) {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      STORE_NAME,
      'readwrite'
    )

    transaction.objectStore(STORE_NAME).put(record)

    transaction.oncomplete = () => resolve(record)
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

export async function getApplicationFile(id) {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      STORE_NAME,
      'readonly'
    )

    const request = transaction.objectStore(STORE_NAME).get(id)

    request.onsuccess = () => resolve(request.result || null)
    request.onerror = () => reject(request.error)
  })
}

export async function deleteApplicationFile(id) {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      STORE_NAME,
      'readwrite'
    )

    transaction.objectStore(STORE_NAME).delete(id)

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

export async function deleteApplicationFiles(applicationId) {
  const database = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      STORE_NAME,
      'readwrite'
    )

    const store = transaction.objectStore(STORE_NAME)
    const request = store.openCursor()

    request.onsuccess = () => {
      const cursor = request.result

      if (cursor) {
        if (cursor.value.applicationId === applicationId) {
          cursor.delete()
        }

        cursor.continue()
      }
    }

    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}
