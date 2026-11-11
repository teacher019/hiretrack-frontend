
function FollowUpCalendar({
  notificationPermission,
  handleEnableNotifications,
  calendarMonth,
  handlePreviousMonth,
  handleNextMonth,
  calendarDays,
  selectedCalendarDate,
  setSelectedCalendarDate,
  selectedDateFollowUps,
  upcomingFollowUps,
}) {
  return (
    <section className="content-card followup-card" id="followups">
      <div className="section-heading">
        <div>
          <h2>Follow-up Calendar</h2>
          <p>Track your upcoming employer follow-ups.</p>
        </div>

        <button
          type="button"
          onClick={handleEnableNotifications}
          disabled={notificationPermission === 'granted'}
        >
          {notificationPermission === 'granted'
            ? 'Notifications Enabled'
            : 'Enable Notifications'}
        </button>
      </div>

      {notificationPermission === 'denied' && (
        <p className="empty-message">
          Notifications are blocked. Allow them in browser settings.
        </p>
      )}

      {notificationPermission === 'unsupported' && (
        <p className="empty-message">
          This browser does not support notifications.
        </p>
      )}

      <div className="calendar-header">
        <button type="button" onClick={handlePreviousMonth}>
          Previous
        </button>

        <h3>
          {calendarMonth.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })}
        </h3>

        <button type="button" onClick={handleNextMonth}>
          Next
        </button>
      </div>

      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
          (day) => (
            <div className="calendar-weekday" key={day}>
              {day}
            </div>
          )
        )}

        {calendarDays.map((day) => (
          <button
            type="button"
            key={day.dateISO}
            className={[
              'calendar-day',
              !day.isCurrentMonth ? 'other-month' : '',
              day.isToday ? 'today' : '',
              selectedCalendarDate === day.dateISO
                ? 'selected'
                : '',
            ].filter(Boolean).join(' ')}
            onClick={() => setSelectedCalendarDate(day.dateISO)}
          >
            <span>{day.date.getDate()}</span>

            {day.followUps.length > 0 && (
              <span className="calendar-event-count">
                {day.followUps.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="selected-date-followups">
        <h3>
          Follow-ups on{' '}
          {new Date(`${selectedCalendarDate}T12:00:00`)
            .toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
        </h3>

        {selectedDateFollowUps.length > 0 ? (
          selectedDateFollowUps.map((item) => (
            <div className="followup-item" key={item.id}>
              <div className="followup-details">
                <strong>{item.company}</strong>
                <p>Follow up regarding {item.role}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-message">
            No follow-ups scheduled for this date.
          </p>
        )}
      </div>

      <div className="upcoming-followups">
        <h3>Upcoming Follow-ups</h3>

        {upcomingFollowUps.length > 0 ? (
          upcomingFollowUps.map((item) => (
            <div className="followup-item" key={item.id}>
              <div className="followup-details">
                <strong>{item.company}</strong>
                <p>Follow up regarding {item.role}</p>
              </div>

              <span className="followup-date">
                {new Date(`${item.followUpDate}T12:00:00`)
                  .toLocaleDateString('en-US', {
                    month: 'short',
                    day: '2-digit',
                  })}
              </span>
            </div>
          ))
        ) : (
          <p className="empty-message">
            No upcoming follow-ups. Add a follow-up date to an application.
          </p>
        )}
      </div>
    </section>
  )
}

export default FollowUpCalendar
