export interface HourSelectorProps {
  selectedHour: number | null
  onHourSelect: (hour: number) => void
}

export interface CalendarProps {
  selectedHours: Record<string, number>
  onDayClick: (date: Date) => void
  selectedHour: number | null
}

export type HourEntry = Record<string, number>

export const HOUR_COLORS: Record<number, string> = {
  6: '#3B82F6',
  7: '#10B981',
  8: '#F59E0B',
  9: '#F97316',
  10: '#EF4444',
}