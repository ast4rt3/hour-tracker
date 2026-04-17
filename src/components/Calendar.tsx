import { useState, useMemo, useRef, useCallback } from 'react'
import HourSelector from './HourSelector'
export interface CalendarProps {
  /** Record of date strings (format: "YYYY-M-D") to hour values */
  selectedHours: Record<string, number>
  /** Callback fired when a day cell is clicked */
  onDayClick: (date: Date) => void
  /** Currently selected hour from HourSelector (pending assignment) */
  selectedHour: number | null
  /** Callback fired when an hour is selected */
  onHourSelect?: (hour: number) => void
}

const HOUR_COLORS: Record<number, string> = {
  6: '#3B82F6',
  7: '#10B981',
  8: '#F59E0B',
  9: '#F97316',
  10: '#EF4444',
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

function formatDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}-${month}-${day}`
}

function generateGridDays(year: number, month: number): number[] {
  const daysInMonth = getDaysInMonth(year, month)
  const firstDayOfMonth = getFirstDayOfMonth(year, month)
  const grid: number[] = []
  
  for (let i = 0; i < firstDayOfMonth; i++) {
    grid.push(0)
  }
  
  for (let day = 1; day <= daysInMonth; day++) {
    grid.push(day)
  }
  
  const remaining = 42 - grid.length
  for (let i = 0; i < remaining; i++) {
    grid.push(0)
  }
  
  return grid
}

interface MonthData {
  year: number
  month: number
  gridDays: number[]
}

export function Calendar({ selectedHours, onDayClick, selectedHour, onHourSelect }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  // sliding state: -1 (going prev), 0 (center), 1 (going next)
  const [slideDir, setSlideDir] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // drag / swipe state
  const dragStartX = useRef<number | null>(null)
  const dragDeltaX = useRef(0)
  const [dragOffset, setDragOffset] = useState(0)
  const isDragging = useRef(false)

  const centerDate = useMemo(() => ({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth(),
  }), [currentDate])

  const months = useMemo<MonthData[]>(() => {
    const { year, month } = centerDate
    return [
      { year, month: month - 1, gridDays: generateGridDays(year, month - 1) },
      { year, month, gridDays: generateGridDays(year, month) },
      { year, month: month + 1, gridDays: generateGridDays(year, month + 1) },
    ]
  }, [centerDate])

  const navigate = useCallback((dir: -1 | 1) => {
    if (isAnimating) return
    setIsAnimating(true)
    setSlideDir(dir)
    setTimeout(() => {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + dir, 1))
      setSlideDir(0)
      setIsAnimating(false)
    }, 320)
  }, [isAnimating])

  const prevMonth = () => navigate(-1)
  const nextMonth = () => navigate(1)

  // -- Pointer / touch drag helpers --
  const onDragStart = (clientX: number) => {
    dragStartX.current = clientX
    dragDeltaX.current = 0
    isDragging.current = true
  }

  const onDragMove = (clientX: number) => {
    if (!isDragging.current || dragStartX.current === null) return
    const delta = clientX - dragStartX.current
    dragDeltaX.current = delta
    setDragOffset(delta)
  }

  const onDragEnd = () => {
    if (!isDragging.current) return
    isDragging.current = false
    const threshold = 60
    if (dragDeltaX.current < -threshold) {
      setDragOffset(0)
      navigate(1)
    } else if (dragDeltaX.current > threshold) {
      setDragOffset(0)
      navigate(-1)
    } else {
      // snap back
      setDragOffset(0)
    }
    dragStartX.current = null
    dragDeltaX.current = 0
  }

  const handleDayClick = (year: number, month: number, day: number) => {
    // ignore click if it was a drag
    if (Math.abs(dragDeltaX.current) > 5) return
    const clickedDate = new Date(year, month, day)
    setSelectedDate(clickedDate)
    onDayClick(clickedDate)
  }

  function getHourColor(hour: number): string | undefined {
    return HOUR_COLORS[hour]
  }

  const renderMonth = (monthData: MonthData) => {
    const { year, month, gridDays } = monthData
    const adjustedYear = month < 0 ? year - 1 : month > 11 ? year + 1 : year
    const adjustedMonth = ((month % 12) + 12) % 12

    return (
      <div className="calendar-month">
        <div className="calendar-month-header">
          {MONTH_NAMES[adjustedMonth]} {adjustedYear}
        </div>
        
        <div className="calendar-weekdays">
          {DAY_NAMES.map(name => (
            <div key={name} className="calendar-weekday">
              {name}
            </div>
          ))}
        </div>

        <div className="calendar-grid">
          {gridDays.map((day, index) => {
            if (day === 0) {
              return <div key={`empty-${index}`} className="calendar-day calendar-day--empty" />
            }

            const date = new Date(adjustedYear, adjustedMonth, day)
            const dateKey = formatDateKey(date)
            const hourAssigned = selectedHours[dateKey]
            const bgColor = hourAssigned !== undefined ? getHourColor(hourAssigned) : undefined
            const isSelected = selectedDate !== null && (
              selectedDate.getFullYear() === adjustedYear &&
              selectedDate.getMonth() === adjustedMonth &&
              selectedDate.getDate() === day
            )

            return (
              <button
                key={`day-${day}-${index}`}
                className={`calendar-day ${isSelected ? 'calendar-day--selected' : ''}`}
                style={{
                  backgroundColor: bgColor,
                  ...(isSelected ? {
                    outline: '3px solid #F97316',
                    outlineOffset: '2px',
                  } : {})
                }}
                onClick={() => handleDayClick(adjustedYear, adjustedMonth, day)}
                aria-label={`${MONTH_NAMES[adjustedMonth]} ${day}, ${adjustedYear}`}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // slide animation: translate strip by one full panel width
  const slideTranslate = slideDir !== 0
    ? `translateX(${slideDir === -1 ? '33.333%' : '-33.333%'})`
    : dragOffset !== 0
    ? `translateX(${dragOffset}px)`
    : 'translateX(0)'

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button
          className="calendar-nav-btn"
          onClick={prevMonth}
          aria-label="Previous month"
        >
          ←
        </button>

        {onHourSelect && (
          <HourSelector 
            selectedHour={selectedHour} 
            onHourSelect={onHourSelect} 
          />
        )}
        <button
          className="calendar-nav-btn"
          onClick={nextMonth}
          aria-label="Next month"
        >
          →
        </button>
      </div>

      {/* Swipe / drag container */}
      <div
        className="calendar-slider-viewport"
        onPointerDown={e => onDragStart(e.clientX)}
        onPointerMove={e => onDragMove(e.clientX)}
        onPointerUp={() => onDragEnd()}
        onPointerCancel={() => onDragEnd()}
      >
        <div
          className="calendar-months-container"
          style={{
            transform: slideTranslate,
            transition: slideDir !== 0
              ? 'transform 320ms cubic-bezier(0.4, 0, 0.2, 1)'
              : dragOffset !== 0
              ? 'none'
              : 'transform 220ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {months.map((monthData, index) => (
            <div key={index} className={`calendar-month-wrapper ${index === 1 ? 'calendar-month-wrapper--center' : ''}`}>
              {renderMonth(monthData)}
            </div>
          ))}
        </div>
      </div>

      <div className="calendar-legend">
        <span className="calendar-legend-title">Hours:</span>
        {Object.entries(HOUR_COLORS).map(([hour, color]) => (
          <span key={hour} className="calendar-legend-item">
            <span
              className="calendar-legend-color"
              style={{ backgroundColor: color }}
            />
            {hour}h
          </span>
        ))}
      </div>
    </div>
  )
}

export default Calendar