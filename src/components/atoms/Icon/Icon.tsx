import type { SVGProps } from 'react';
import { cx } from '@/utils/cx';
import { icons } from './icons';
import type { IconName } from './icon-names';
import './Icon.css';

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;

const SIZE_MAP: Record<Exclude<IconSize, number>, number> = {
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'stroke' | 'name'> {
  /** Icon glyph name. */
  name: IconName;
  /** Named size token or explicit pixel number. */
  size?: IconSize;
  /** Color override. Defaults to `currentColor`. */
  color?: string;
  /** Stroke width for stroke-mode icons. */
  strokeWidth?: number;
  /** Render as a filled glyph rather than stroked. */
  filled?: boolean;
  /** Continuously rotate the glyph (for `loader`/`refresh` as an inline spinner). */
  spin?: boolean;
  /** Accessible label. When omitted the icon is treated as decorative (aria-hidden). */
  title?: string;
}

export function Icon({
  name,
  size = 'md',
  color,
  strokeWidth = 2,
  filled = false,
  spin = false,
  title,
  className,
  style,
  ...rest
}: IconProps) {
  const px = typeof size === 'number' ? size : SIZE_MAP[size];
  const decorative = !title;
  // Brand logos (logo-*) are filled marks (mono paths use currentColor; Google carries its own
  // colors) — always render them filled with no stroke, so they never pick up the stroke-mode
  // currentColor outline and match the Figma plugin's logo rendering exactly.
  const isLogo = name.startsWith('logo-');
  const asFilled = filled || isLogo;

  return (
    <svg
      className={cx('tds-icon', className)}
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill={asFilled ? 'currentColor' : 'none'}
      stroke={asFilled ? 'none' : 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={title}
      data-size={typeof size === 'string' ? size : undefined}
      data-mode={filled ? 'filled' : 'stroke'}
      data-spin={spin || undefined}
      style={color ? { color, ...style } : style}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {icons[name]}
    </svg>
  );
}

export type { IconName } from './icon-names';
