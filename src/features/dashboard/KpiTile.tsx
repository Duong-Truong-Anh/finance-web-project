'use client';
import { ClickableTile } from '@carbon/react';
import { ArrowDown } from '@carbon/icons-react';

interface Props {
  label: string;
  value: string;
  sub?: string;
  href: string;
  negative?: boolean;
}

export default function KpiTile({ label, value, sub, href, negative = false }: Props) {
  return (
    <ClickableTile href={href} style={{ height: '100%' }}>
      <p
        className="cds--type-label-01"
        style={{ color: 'var(--cds-text-secondary)', marginBlockEnd: 'var(--cds-spacing-03)' }}
      >
        {label}
      </p>

      <p
        className="cds--type-productive-heading-05"
        style={{
          fontVariantNumeric: 'tabular-nums',
          color: negative ? 'var(--cds-support-error)' : undefined,
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--cds-spacing-02)',
          marginBlockEnd: sub ? 'var(--cds-spacing-03)' : undefined,
        }}
      >
        {negative && <ArrowDown aria-hidden="true" size={20} />}
        {value}
      </p>

      {sub && (
        <p
          className="cds--type-helper-text-01"
          style={{ color: 'var(--cds-text-secondary)' }}
        >
          {sub}
        </p>
      )}
    </ClickableTile>
  );
}
