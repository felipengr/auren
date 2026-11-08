import type { Slot } from "../types/api";

export function TimeSlotGrid({
  slots,
  selected,
  onSelect,
}: {
  slots: Slot[];
  selected: string | null;
  onSelect: (time: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 tablet:grid-cols-4">
      {slots.map((slot) => {
        const isSelected = slot.time === selected;
        const style = !slot.available
          ? "bg-disabled text-muted cursor-not-allowed"
          : isSelected
            ? "bg-forest text-white"
            : "border border-line bg-white text-ink hover:border-forest";

        return (
          <button
            key={slot.time}
            type="button"
            disabled={!slot.available}
            onClick={() => onSelect(slot.time)}
            className={`h-12 rounded-control text-sm font-medium transition-colors ${style}`}
          >
            {slot.time}
            {slot.reason === "booked" ? " · ocupado" : ""}
          </button>
        );
      })}
    </div>
  );
}
