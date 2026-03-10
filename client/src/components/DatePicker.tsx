import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DatePickerProps {
    value: string; // 'YYYY-MM-DD'
    onChange: (value: string) => void;
    label?: string;
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const pad = (n: number) => String(n).padStart(2, '0');

const DatePicker = ({ value, onChange }: DatePickerProps) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

    const parsed = value ? new Date(value + 'T00:00:00') : today;
    const [viewYear, setViewYear] = useState(parsed.getFullYear());
    const [viewMonth, setViewMonth] = useState(parsed.getMonth());
    const [open, setOpen] = useState(false);
    const [dropUp, setDropUp] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // Auto-position: flip above if not enough space below, and ensure visibility
    useEffect(() => {
        if (!open || !ref.current) return;
        const triggerRect = ref.current.getBoundingClientRect();
        const dropdownHeight = 380; // approximate max height of calendar
        const spaceBelow = window.innerHeight - triggerRect.bottom;
        const spaceAbove = triggerRect.top;
        setDropUp(spaceBelow < dropdownHeight && spaceAbove > spaceBelow);

        // Scroll trigger into view so the calendar is visible
        requestAnimationFrame(() => {
            if (dropdownRef.current) {
                dropdownRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        });
    }, [open]);

    // Sync view when value changes externally
    useEffect(() => {
        if (value) {
            const d = new Date(value + 'T00:00:00');
            setViewYear(d.getFullYear());
            setViewMonth(d.getMonth());
        }
    }, [value]);

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
        else setViewMonth(m => m - 1);
    };
    const isCurrentOrFutureMonth = viewYear > today.getFullYear() || (viewYear === today.getFullYear() && viewMonth >= today.getMonth());

    const nextMonth = () => {
        if (isCurrentOrFutureMonth) return;
        if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
        else setViewMonth(m => m + 1);
    };

    const goToday = () => {
        setViewYear(today.getFullYear());
        setViewMonth(today.getMonth());
        onChange(todayStr);
        setOpen(false);
    };

    // Build calendar grid
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const cells: { day: number; current: boolean; dateStr: string }[] = [];

    // Previous month fill
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        const d = daysInPrevMonth - i;
        const m = viewMonth === 0 ? 11 : viewMonth - 1;
        const y = viewMonth === 0 ? viewYear - 1 : viewYear;
        cells.push({ day: d, current: false, dateStr: `${y}-${pad(m + 1)}-${pad(d)}` });
    }
    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ day: d, current: true, dateStr: `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}` });
    }
    // Next month fill
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
        const m = viewMonth === 11 ? 0 : viewMonth + 1;
        const y = viewMonth === 11 ? viewYear + 1 : viewYear;
        cells.push({ day: d, current: false, dateStr: `${y}-${pad(m + 1)}-${pad(d)}` });
    }

    // Format the display value
    const displayDate = value
        ? new Date(value + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
        : 'Select date';

    return (
        <div className="datepicker-wrapper" ref={ref}>
            <button
                type="button"
                className="datepicker-trigger"
                onClick={() => setOpen(!open)}
            >
                <Calendar size={16} className="datepicker-icon" />
                <span>{displayDate}</span>
            </button>

            {open && (
                <div ref={dropdownRef} className={`datepicker-dropdown${dropUp ? ' datepicker-dropdown--up' : ''}`}>
                    {/* Header */}
                    <div className="datepicker-header">
                        <button type="button" className="datepicker-nav" onClick={prevMonth}>
                            <ChevronLeft size={16} />
                        </button>
                        <span className="datepicker-title">
                            {MONTH_NAMES[viewMonth]} {viewYear}
                        </span>
                        <button type="button" className={`datepicker-nav${isCurrentOrFutureMonth ? ' datepicker-nav--disabled' : ''}`} onClick={nextMonth} disabled={isCurrentOrFutureMonth}>
                            <ChevronRight size={16} />
                        </button>
                    </div>

                    {/* Day labels */}
                    <div className="datepicker-grid datepicker-day-labels">
                        {DAY_LABELS.map(d => (
                            <div key={d} className="datepicker-day-label">{d}</div>
                        ))}
                    </div>

                    {/* Day cells */}
                    <div className="datepicker-grid">
                        {cells.map((c, i) => {
                            const isSelected = c.dateStr === value;
                            const isToday = c.dateStr === todayStr;
                            const isFuture = c.dateStr > todayStr;
                            let cls = 'datepicker-cell';
                            if (!c.current) cls += ' datepicker-cell--outside';
                            if (isFuture) cls += ' datepicker-cell--disabled';
                            if (isSelected && !isFuture) cls += ' datepicker-cell--selected';
                            if (isToday && !isSelected) cls += ' datepicker-cell--today';
                            return (
                                <button
                                    type="button"
                                    key={i}
                                    className={cls}
                                    disabled={isFuture}
                                    onClick={() => {
                                        if (isFuture) return;
                                        if (!c.current) {
                                            const d = new Date(c.dateStr + 'T00:00:00');
                                            setViewYear(d.getFullYear());
                                            setViewMonth(d.getMonth());
                                        }
                                        onChange(c.dateStr);
                                        setOpen(false);
                                    }}
                                >
                                    {c.day}
                                </button>
                            );
                        })}
                    </div>

                    {/* Footer */}
                    <div className="datepicker-footer">
                        <button type="button" className="datepicker-today-btn" onClick={goToday}>
                            Today
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DatePicker;
