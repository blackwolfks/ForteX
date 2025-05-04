
import * as React from "react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { de } from "date-fns/locale";

interface DatePickerProps {
  selected?: Date;
  onChange: (date: Date | null) => void;
  locale?: Locale;
}

export function DatePicker({
  selected,
  onChange,
  locale = de
}: DatePickerProps) {
  return (
    <Calendar
      mode="single"
      selected={selected}
      onSelect={onChange}
      locale={locale}
      className="p-3 pointer-events-auto"
    />
  );
}
