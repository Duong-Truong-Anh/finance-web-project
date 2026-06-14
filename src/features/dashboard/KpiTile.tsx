'use client';
import type { ReactNode } from 'react';
import { ClickableTile, Stack } from '@carbon/react';
// gap value: Carbon $spacing-02. --cds-spacing-* is not a runtime var here (ADR 002),
// so the icon/value gap uses the token's literal rem; it is static and theme-portable.
const ICON_VALUE_GAP = '0.25rem';
import { ArrowDown, ArrowUp } from '@carbon/icons-react';

interface Props {
  label: string;
  value: string;
  sub?: string;
  href: string;
  /**
   * Signal Rule: pairs a status color with an icon (never color alone).
   * 'negative' → support-error + ArrowDown; 'positive' → support-success + ArrowUp.
   */
  status?: 'positive' | 'negative';
  /** Optional slot below the sub-line (e.g. a ProgressBar or a relationship line). */
  children?: ReactNode;
}

export default function KpiTile({ label, value, sub, href, status, children }: Props) {
  const valueColor =
    status === 'negative'
      ? 'var(--cds-support-error)'
      : status === 'positive'
        ? 'var(--cds-support-success)'
        : undefined;

  return (
    <ClickableTile href={href} style={{ blockSize: '100%' }}>
      <Stack gap={3}>
        <p className="cds--type-label-01" style={{ color: 'var(--cds-text-secondary)' }}>
          {label}
        </p>

        <p
          className="cds--type-productive-heading-05"
          style={{
            fontVariantNumeric: 'tabular-nums',
            color: valueColor,
            display: 'flex',
            alignItems: 'center',
            gap: ICON_VALUE_GAP,
          }}
        >
          {status === 'negative' && <ArrowDown aria-hidden="true" size={20} />}
          {status === 'positive' && <ArrowUp aria-hidden="true" size={20} />}
          {value}
        </p>

        {sub && (
          <p className="cds--type-helper-text-01" style={{ color: 'var(--cds-text-secondary)' }}>
            {sub}
          </p>
        )}

        {children}
      </Stack>
    </ClickableTile>
  );
}
