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

const FIXED_HOLIDAYS: Record<string, string> = {
  '1-1': "New Year's Day",
  '2-25': "EDSA Revolution Anniversary",
  '4-9': "Araw ng Kagitingan",
  '5-1': "Labor Day",
  '6-12': "Independence Day",
  '8-21': "Ninoy Aquino Day",
  '11-1': "All Saints' Day",
  '11-30': "Bonifacio Day",
  '12-8': "Feast of the Immaculate Conception",
  '12-25': "Christmas Day",
  '12-30': "Rizal Day",
  '12-31': "Last Day of the Year",
}

const VARIABLE_HOLIDAYS_2026: Record<string, string> = {
  '2026-2-17': "Chinese New Year",
  '2026-3-20': "Eid'l Fitr",
  '2026-4-2': "Maundy Thursday",
  '2026-4-3': "Good Friday",
  '2026-4-4': "Black Saturday",
  '2026-5-27': "Eid'l Adha",
  '2026-8-31': "National Heroes Day",
}

interface SpecialDate {
  title: string
  className: string
}

const SPECIAL_DATES: Record<string, SpecialDate> = {
  '3-16': { title: 'Flexible work arrangement', className: 'calendar-special-green' },
  '2-23': { title: 'Batch 1', className: 'calendar-special-green' },
  '2-24': { title: 'Batch 2', className: 'calendar-special-green' },
}

function getHolidayName(year: number, month: number, day: number): string | null {
  const fixedKey = `${month}-${day}`;
  if (FIXED_HOLIDAYS[fixedKey]) return FIXED_HOLIDAYS[fixedKey];

  const variableKey = `${year}-${month}-${day}`;
  if (VARIABLE_HOLIDAYS_2026[variableKey]) return VARIABLE_HOLIDAYS_2026[variableKey];

  return null;
}

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
  const containerRef = useRef<HTMLDivElement>(null)
  const dragStartX = useRef<number | null>(null)
  const dragDeltaX = useRef(0)
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

    // clear inline transform from drag so class transform fully takes over
    if (containerRef.current) {
      containerRef.current.style.transform = ''
    }

    setTimeout(() => {
      setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + dir, 1))
      setSlideDir(0)
      setIsAnimating(false)
    }, 250) // snappier animation
  }, [isAnimating])

  const prevMonth = () => navigate(-1)
  const nextMonth = () => navigate(1)

  // -- Pointer / touch drag helpers --
  const onDragStart = (clientX: number) => {
    if (isAnimating) return
    dragStartX.current = clientX
    dragDeltaX.current = 0
    isDragging.current = true
    if (containerRef.current) {
      containerRef.current.style.transition = 'none'
    }
  }

  const onDragMove = (clientX: number) => {
    if (!isDragging.current || dragStartX.current === null) return
    const delta = clientX - dragStartX.current
    dragDeltaX.current = delta
    if (containerRef.current) {
      containerRef.current.style.transform = `translateX(${delta}px)`
    }
  }

  const onDragEnd = () => {
    if (!isDragging.current) return
    isDragging.current = false
    const threshold = 60

    if (containerRef.current) {
      containerRef.current.style.transition = ''
    }

    if (dragDeltaX.current < -threshold) {
      navigate(1)
    } else if (dragDeltaX.current > threshold) {
      navigate(-1)
    } else {
      // snap back
      if (containerRef.current) {
        containerRef.current.style.transform = 'translateX(0)'
      }
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
          {DAY_NAMES.map((name, index) => (
            <div key={name} className={`calendar-weekday ${index === 0 || index === 6 ? 'calendar-weekend' : ''}`}>
              {name}
            </div>
          ))}
        </div>

        <div className="calendar-grid">
          {gridDays.map((day, index) => {
            if (day === 0) {
              return <div key={`empty-${index}`} className="calendar-day calendar-day--empty" />
            }
            //sdads
            const date = new Date(adjustedYear, adjustedMonth, day)
            const dateKey = formatDateKey(date)
            const hourAssigned = selectedHours[dateKey]
            const bgColor = hourAssigned !== undefined ? getHourColor(hourAssigned) : undefined
            const isSelected = selectedDate !== null && (
              selectedDate.getFullYear() === adjustedYear &&
              selectedDate.getMonth() === adjustedMonth &&
              selectedDate.getDate() === day
            )

            const isWeekend = index % 7 === 0 || index % 7 === 6
            const holiday = getHolidayName(adjustedYear, adjustedMonth + 1, day)
            const specialDateKey = `${adjustedMonth + 1}-${day}`
            const specialDate = SPECIAL_DATES[specialDateKey]

            const title = specialDate ? specialDate.title : holiday || undefined

            return (
              <button
                key={`day-${day}-${index}`}
                className={`calendar-day ${isSelected ? 'calendar-day--selected' : ''} ${isWeekend ? 'calendar-weekend' : ''} ${holiday ? 'calendar-holiday' : ''} ${specialDate ? specialDate.className : ''}`}
                style={{
                  backgroundColor: bgColor,
                  ...(isSelected ? {
                    outline: '3px solid #F97316',
                    outlineOffset: '2px',
                  } : {})
                }}
                disabled={isWeekend}
                title={title}
                onClick={() => handleDayClick(adjustedYear, adjustedMonth, day)}
                aria-label={title ? `${title} (${MONTH_NAMES[adjustedMonth]} ${day}, ${adjustedYear})` : `${MONTH_NAMES[adjustedMonth]} ${day}, ${adjustedYear}`}
              >
                {day}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // class-based slide animation for navigation actions
  const slideTranslate = slideDir !== 0
    ? `translateX(${slideDir === -1 ? '33.333%' : '-33.333%'})`
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
          ref={containerRef}
          className="calendar-months-container"
          style={{
            transform: slideTranslate,
            transition: slideDir !== 0
              ? 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)'
              : 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)',
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