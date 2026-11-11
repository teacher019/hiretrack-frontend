function Dashboard({
  applications,
  interviewCount,
  offerCount,
  followUpCount,
}) {
  return (
    <>
      <section className="welcome">
        <div>
          <p className="eyebrow light">CAREER OVERVIEW</p>
          <h2>Keep your career moving forward.</h2>
          <p>Track your job applications and never miss a follow-up.</p>
        </div>
        <span className="welcome-icon">â†’</span>
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
    </>
  )
}

export default Dashboard
