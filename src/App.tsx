import { useState, useMemo } from 'react'
import { Calendar, type CalendarProps } from './components'
import HourSelector from './components/HourSelector'
import { HOUR_COLORS, HourEntry } from './types'

function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}-${month}-${day}`
}

function getTodayKey(): string {
  return formatDateKey(new Date())
}

export default function App() {
  const [selectedHours, setSelectedHours] = useState<HourEntry>({})
  const [pendingHour, setPendingHour] = useState<number | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const stats = useMemo(() => {
    const entries = Object.entries(selectedHours)
    const totalHours = entries.reduce((sum, [, hour]) => sum + hour, 0)
    const daysTracked = entries.length
    const todayHour = selectedHours[getTodayKey()]
    return { totalHours, daysTracked, todayHour }
  }, [selectedHours])

   const handleHourSelect = (hour: number) => {
     if (pendingHour === hour) {
       setPendingHour(null)
     } else {
       setPendingHour(hour)
     }
     setMessage(null)
   }

   const handleDayClick: CalendarProps['onDayClick'] = (date) => {
     const dateKey = formatDateKey(date)
     const existingHour = selectedHours[dateKey]

     if (pendingHour === null) {
       if (existingHour !== undefined) {
         setMessage(`${dateKey}: ${existingHour}h assigned`)
       } else {
         setMessage('Select an hour first')
       }
     } else {
       if (existingHour === pendingHour) {
         const newEntries = { ...selectedHours }
         delete newEntries[dateKey]
         setSelectedHours(newEntries)
         setMessage(`Removed ${pendingHour}h from ${dateKey}`)
       } else {
         setSelectedHours({ ...selectedHours, [dateKey]: pendingHour })
         setMessage(`Assigned ${pendingHour}h to ${dateKey}`)
       }
     }
   }

  const handleClearAll = () => {
    if (confirm('Clear all tracked hours?')) {
      setSelectedHours({})
      setMessage('All entries cleared')
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Hour Tracker</h1>
        {message && <p className="app-message">{message}</p>}
      </header>

      <div className="app-layout">
        <aside className="app-sidebar">
          <div className="panel">
            <HourSelector 
              selectedHour={pendingHour} 
              onHourSelect={handleHourSelect} 
            />
          </div>

          <div className="panel stats-panel">
            <h2>Statistics</h2>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{stats.totalHours}</span>
                <span className="stat-label">Total Hours</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{stats.daysTracked}</span>
                <span className="stat-label">Days Tracked</span>
              </div>
              <div className="stat-item">
                <span 
                  className="stat-value"
                  style={{ 
                    color: stats.todayHour ? HOUR_COLORS[stats.todayHour] : undefined 
                  }}
                >
                  {stats.todayHour ? `${stats.todayHour}h` : '—'}
                </span>
                <span className="stat-label">Today</span>
              </div>
            </div>
          </div>

          {Object.keys(selectedHours).length > 0 && (
            <button className="clear-btn" onClick={handleClearAll}>
              Clear All
            </button>
          )}
        </aside>

        <main className="app-main">
          <div className="panel">
            <Calendar
              selectedHours={selectedHours}
              selectedHour={pendingHour}
              onDayClick={handleDayClick}
            />
          </div>
        </main>
      </div>
    </div>
  )
}