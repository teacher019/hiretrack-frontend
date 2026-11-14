
function Dashboard({
  applications,
  interviewCount,
  offerCount,
  followUpCount,
  upcomingFollowUps = [],
  overdueFollowUps = [],
  overdueFollowUpCount,
  completedFollowUps = [],
  onToggleFollowUpCompleted,
  today,
}) {
  const sortedFollowUps = [...upcomingFollowUps].sort((a, b) =>
    a.followUpDate.localeCompare(b.followUpDate)
  )

  function formatFollowUpDate(date) {
    if (!date) return ''

    return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }
  const sortedOverdueFollowUps = [...overdueFollowUps].sort(
    (a, b) => a.followUpDate.localeCompare(b.followUpDate)
  )
  const sortedCompletedFollowUps = [...completedFollowUps].sort(
  (a, b) => b.followUpDate.localeCompare(a.followUpDate)
)
  return (
    <>
      <section className="welcome">
        <div>
          <p className="eyebrow light">CAREER OVERVIEW</p>
          <h2>Keep your career moving forward.</h2>
          <p>Track your job applications and never miss a follow-up.</p>
        </div>
        <span className="welcome-icon">{"\u2192"}</span>
      </section>

      <section className="summary-grid">
        <article className="summary-card">
          <p>Total Applications</p>
          <h2>{applications.length}</h2>
          <span>All tracked opportunities</span>
        </article>

        <article className="summary-card">
          <p>Interviews</p>
          <h2>{interviewCount}</h2>
          <span>Interview stage</span>
        </article>

        <article className="summary-card">
          <p>Offers</p>
          <h2>{offerCount}</h2>
          <span>Potential opportunities</span>
        </article>

        <article className="summary-card">
          <p>Follow-ups</p>
          <h2>{followUpCount}</h2>
          <span>Need your attention</span>
        </article>
      </section>

      {overdueFollowUpCount > 0 && (
        <section className="overdue-alert">
          <div className="overdue-alert-heading">
            <div>
              <h2>Overdue Follow-ups</h2>
              <p>
                You have {overdueFollowUpCount} follow-up
                {overdueFollowUpCount > 1 ? 's' : ''} that need your attention.
              </p>
            </div>

            <span className="overdue-alert-count">
              {overdueFollowUpCount}
            </span>
          </div>

          <div className="overdue-followups-list">
            {sortedOverdueFollowUps.map((item) => (
              <article
                className="overdue-followup-item"
                key={item.backendId || item.id}
              >
                <div>
                  <h3>{item.company}</h3>
                  <p>{item.role}</p>
                </div>

                <div className="overdue-followup-date">
                  <span>Overdue</span>
                  <strong>{formatFollowUpDate(item.followUpDate)}</strong>

                  <button
                    type="button"
                    className="followup-completion-button"
                    onClick={() => onToggleFollowUpCompleted(item)}
                  >
                    Mark Completed
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="upcoming-followups">
        <div className="upcoming-followups-heading">
          <div>
            <h2>Upcoming Follow-ups</h2>
            <p>Keep track of your next follow-up dates.</p>
          </div>
          <span className="upcoming-followups-count">
            {sortedFollowUps.length}
          </span>
        </div>

        {sortedFollowUps.length === 0 ? (
          <p className="no-followups">
            No upcoming follow-ups. Add a follow-up date to an application.
          </p>
        ) : (
          <div className="upcoming-followups-list">
            {sortedFollowUps.map((item) => (
              <article
                className="upcoming-followup-item"
                key={item.backendId || item.id}
              >
                <div className="upcoming-followup-info">
                  <h3>{item.company}</h3>
                  <p>{item.role}</p>
                </div>

                <div className="upcoming-followup-date">
                  {item.followUpDate === today && (
                    <span className="today-label">Today</span>
                  )}

                  <span>{formatFollowUpDate(item.followUpDate)}</span>

                  <button
                    type="button"
                    className="followup-completion-button"
                    onClick={() => onToggleFollowUpCompleted(item)}
                  >
                    Mark Completed
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="completed-followups">
        <div className="completed-followups-heading">
          <div>
            <h2>Completed Follow-ups</h2>
            <p>Follow-ups you have successfully completed.</p>
          </div>

          <span className="completed-followups-count">
            {sortedCompletedFollowUps.length}
          </span>
        </div>

        {sortedCompletedFollowUps.length === 0 ? (
          <p className="no-followups">
            No completed follow-ups yet.
          </p>
          ) : (
            <div className="completed-followups-list">
              {sortedCompletedFollowUps.map((item) => (
                 <article
                    className="completed-followup-item"
                    key={item.backendId || item.id}
                  >
                    <div className="completed-followup-info">
                      <h3>{item.company}</h3>
                      <p>{item.role}</p>
                    </div>

                    <div className="completed-followup-date">
                      <span>{formatFollowUpDate(item.followUpDate)}</span>

                      <button
                        type="button"
                        className="followup-completion-button"
                        onClick={() => onToggleFollowUpCompleted(item)}
                      >
                        Mark Incomplete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
          </>
        )
      }

      export default Dashboard
