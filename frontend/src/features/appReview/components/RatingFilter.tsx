interface RatingFilterProps {
  value: number | null;
  onChange: (value: number | null) => void;
  allLabel: string;
  className?: string;
}

export const RatingFilter = ({ value, onChange, allLabel, className }: RatingFilterProps) => {
  return (
    <select
      value={value ?? ''}
      onChange={(event) => {
        const rawValue = event.target.value.trim();
        onChange(rawValue ? Number(rawValue) : null);
      }}
      className={`rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 ${
        className ?? ''
      }`}
    >
      <option value="">{allLabel}</option>
      <option value="5">5 stars</option>
      <option value="4">4 stars</option>
      <option value="3">3 stars</option>
      <option value="2">2 stars</option>
      <option value="1">1 star</option>
    </select>
  );
};
