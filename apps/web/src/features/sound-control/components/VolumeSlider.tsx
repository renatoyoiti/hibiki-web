interface VolumeSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

export default function VolumeSlider({ value, onChange, disabled, className }: VolumeSliderProps) {
  return (
    <input
      type="range"
      min={0}
      max={100}
      step={1}
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(Number(e.target.value))}
      className={[
        'w-full h-1.5 appearance-none rounded-full cursor-pointer',
        'bg-surface-muted accent-primary',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        className ?? '',
      ]
        .join(' ')
        .trim()}
    />
  );
}
