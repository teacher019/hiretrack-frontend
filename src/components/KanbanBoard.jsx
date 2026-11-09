export default function KanbanBoard({
  applications,
  applicationStatuses,
  handleDrop,
  handleStatusChange,
  handleEdit,
  handleDelete,
}) {
  return (
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
                    <span className="drag-indicator">â ¿</span>
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

  )
}

