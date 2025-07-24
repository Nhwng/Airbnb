import * as React from 'react';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';

export default function DatePickerWithRange({
  setDateRange,
  disabledDates = [],
}) {
  const [date, setDate] = React.useState({ from: null, to: null });

  const disabledSet = React.useMemo(
    () =>
      new Set(
        disabledDates.map(d => format(new Date(d), 'yyyy-MM-dd'))
      ),
    [disabledDates]
  );

  React.useEffect(() => {
    if (date.from && date.to) {
      // Sử dụng format để giữ ngày local và chuyển sang chuỗi ISO đúng
      const normalizedFrom = format(new Date(date.from), 'yyyy-MM-dd');
      const normalizedTo = format(new Date(date.to), 'yyyy-MM-dd');
      setDateRange({
        from: normalizedFrom,
        to: normalizedTo,
      });
      console.log('Normalized dateRange:', { from: normalizedFrom, to: normalizedTo }); // Debug
    }
  }, [date, setDateRange]);

  return (
    <>
      <style>{`
        button[aria-disabled="true"] {
          color: #ccc !important;
          text-decoration: line-through;
          background-color: transparent !important;
        }
      `}</style>

      <Calendar
        initialFocus
        mode="range"
        defaultMonth={date.from || new Date()}
        selected={date}
        onSelect={setDate}
        numberOfMonths={1}
        disabled={(d) => {
          const key = format(d, 'yyyy-MM-dd');
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          return d < yesterday || disabledSet.has(key);
        }}
      />
    </>
  );
}