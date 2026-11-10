
function ApplicationsTable({
  applications,
  onAddApplication,
  handleEdit,
  handleDelete,
}) {
  return (
    <section className="content-card" id="applications">
      <div className="section-heading">
        <div>
          <h2>Recent Applications</h2>
          <p>Keep track of your latest opportunities.</p>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={onAddApplication}
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
  )
}

export default ApplicationsTable
