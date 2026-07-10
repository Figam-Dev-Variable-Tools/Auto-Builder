import styles from './Slider.module.css'

export type SliderProps = {
  label?: string
  value: number
  onChange?: (value: number) => void
  min?: number
  max?: number
  step?: number
  unit?: string
  showValue?: boolean
  disabled?: boolean
}

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  unit = '',
  showValue = true,
  disabled = false,
}: SliderProps) {
  const percent = max === min ? 0 : ((value - min) / (max - min)) * 100
  const className = [styles.slider, disabled ? styles.disabled : ''].filter(Boolean).join(' ')

  return (
    <div className={className}>
      {(label != null || showValue) && (
        <div className={styles.labelRow}>
          {label != null && <span className={styles.label}>{label}</span>}
          {showValue && (
            <span className={styles.value}>
              {value.toLocaleString()}
              {unit}
            </span>
          )}
        </div>
      )}
      <input
        type="range"
        className={styles.range}
        style={{
          background: `linear-gradient(to right, var(--ds-color-primary) ${percent}%, var(--ds-color-border) ${percent}%)`,
        }}
        value={value}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => onChange?.(Number(e.target.value))}
      />
    </div>
  )
}
