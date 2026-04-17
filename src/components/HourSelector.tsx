
export interface HourSelectorProps {
  selectedHour: number | null
  onHourSelect: (hour: number) => void
}

const HOURS = [
  { hour: 6, color: '#3B82F6', bgLight: 'rgba(59, 130, 246, 0.1)', label: '6 hours' },
  { hour: 7, color: '#10B981', bgLight: 'rgba(16, 185, 129, 0.1)', label: '7 hours' },
  { hour: 8, color: '#F59E0B', bgLight: 'rgba(245, 158, 11, 0.1)', label: '8 hours' },
  { hour: 9, color: '#F97316', bgLight: 'rgba(249, 115, 22, 0.1)', label: '9 hours' },
  { hour: 10, color: '#EF4444', bgLight: 'rgba(239, 68, 68, 0.1)', label: '10 hours' },
]

export function HourSelector({ selectedHour, onHourSelect }: HourSelectorProps) {
  return (
    <div className="hour-selector">
      <div className="hour-selector-buttons">
        {HOURS.map(({ hour, color, bgLight, label }) => {
          const isSelected = selectedHour === hour
          return (
            <button
              key={hour}
              onClick={() => onHourSelect(hour)}
              className={`hour-btn ${isSelected ? 'hour-btn--selected' : ''}`}
              style={{
                '--hour-color': color,
                '--hour-bg': bgLight,
              } as React.CSSProperties}
            >
              <span className="hour-dot" style={{ backgroundColor: color }} />
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default HourSelector
