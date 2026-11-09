export default function ApplicationForm({
  showForm,
  form,
  setForm,
  editingId,
  fileError,
  isSaving,
  setSelectedResumeFile,
  setSelectedCoverLetterFile,
  selectedOtherFiles,
  setSelectedOtherFiles,
  handleChange,
  handleSubmit,
  handleCancel,
  handleDownloadFile,
  handleRemoveAttachment,
  validateFile,
  setFileError,
}) {
  if (!showForm) return null

  return (
        <div className="modal-backdrop" onClick={handleCancel}>
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
                onClick={handleCancel}
              >
                Ã—
              </button>
            </div>

            <form className="application-form" onSubmit={handleSubmit}>
              {fileError && (
                <p className="error-message" role="alert">
                  {fileError}
                </p>
              )}
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

                    if (!file) return

                    const error = validateFile(file, [
                      'pdf',
                      'doc',
                      'docx',
                    ])

                    if (error) {
                      setFileError(`Resume: ${error}`)
                      event.target.value = ''
                      return
                    }

                    setFileError('')
                    setSelectedResumeFile(file)

                    setForm((previousForm) => ({
                    ...previousForm,
                    resumeName: file.name,
                    resumeSize: `${(file.size / 1024).toFixed(2)} KB`,
                    }))
                  }}
                  />

                  <small>Accepted formats: PDF, DOC, DOCX</small>

                  {form.resumeName && (
                    <div className="file-info">
                      <p>
                        Selected File: {form.resumeName}
                        {form.resumeSize && ` â€” ${form.resumeSize}`}
                      </p>

                      {editingId !== null && (
                        <button
                          type="button"
                          className="secondary-button"
                          onClick={() =>
                            handleDownloadFile(`${editingId}:resume`)
                          }
                        >
                          Download Resume
                        </button>
                      )}
                    </div>
                  )}
                </div>

              <div className="form-group">
                <label>Upload Cover Letter</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(event) => {
                    const file = event.target.files[0]

                    if (!file) return

                    const error = validateFile(file, [
                    'pdf',
                    'doc',
                    'docx',
                    ])

                    if (error) {
                      setFileError(`Cover Letter: ${error}`)
                      event.target.value = ''
                      return
                    }

                    setFileError('')
                    setSelectedCoverLetterFile(file)

                    setForm((previousForm) => ({
                    ...previousForm,
                    coverLetterName: file.name,
                    coverLetterSize: `${(file.size / 1024).toFixed(2)} KB`,
                    }))
                  }}
                />

                <small>Accepted formats: PDF, DOC, DOCX</small>
              </div>

              {form.coverLetterName && (
                <div className="file-info">
                  <p>
                    Selected File: {form.coverLetterName}
                    {form.coverLetterSize && ` â€” ${form.coverLetterSize}`}
                  </p>

                  {editingId !== null && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        handleDownloadFile(`${editingId}:coverLetter`)
                      }
                    >
                      Download Cover Letter
                    </button>
                  )}
                </div>
              )}

              <div className="form-group">
                <label>Other Attachments</label>

                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    onChange={(event) => {
                    const files = Array.from(event.target.files)

                    if (files.length === 0) return

                      const allowedExtensions = [
                        'pdf',
                        'doc',
                        'docx',
                        'jpg',
                        'jpeg',
                        'png',
                      ]

                      const invalidFile = files.find((file) =>
                      validateFile(file, allowedExtensions)
                      )

                      if (invalidFile) {
                        setFileError(
                          `${invalidFile.name}: ${validateFile(
                          invalidFile,
                          allowedExtensions
                          )}`
                        )
                        event.target.value = ''
                        return
                      }

                      setFileError('')

                      const newAttachments = files.map((file, index) => ({
                        id: `${Date.now()}-${index}`,
                        name: file.name,
                        size: `${(file.size / 1024).toFixed(2)} KB`,
                      }))

                      setSelectedOtherFiles((previous) => [
                        ...previous,
                        ...newAttachments.map((attachment, index) => ({
                        id: attachment.id,
                        file: files[index],
                      })),
                    ])

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
                      <p>
                        <strong>Selected Attachments:</strong>
                      </p>

                      {form.otherAttachments.map((file) => {
                        const isNewFile = selectedOtherFiles.some(
                          (item) => item.id === file.id
                        )

                        return (
                            <div className="attachment-item" key={file.id}>
                              <span>
                                {file.name} â€” {file.size}
                              </span>

                              <div className="file-actions">
                                {editingId !== null && !isNewFile && (
                                  <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() =>
                                      handleDownloadFile(
                                      `${editingId}:attachment:${file.id}`
                                      )
                                    }
                                  >
                                    Download
                                  </button>
                                )}

                                <button
                                  type="button"
                                  className="delete-button"
                                  onClick={() => handleRemoveAttachment(file)}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          )
                      })}
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
                <button
                  className="primary-button"
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving
                  ? 'Saving...'
                  : editingId !== null
                  ? 'Save Changes'
                  : 'Save Application'}
                </button>
              </div>
            </form>
          </section>
        </div>
  )
}

