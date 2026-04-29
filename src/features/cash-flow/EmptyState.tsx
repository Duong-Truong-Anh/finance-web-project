'use client';
import { Tile } from '@carbon/react';
// TaskAdd does not exist in @carbon/pictograms-react v11; OptimizeCashFlow_01 is the closest semantic match.
import { OptimizeCashFlow_01 as CashFlowPictogram } from '@carbon/pictograms-react';

export default function EmptyState() {
  return (
    <Tile
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 'var(--cds-spacing-05)',
        padding: 'var(--cds-spacing-09)',
      }}
    >
      <CashFlowPictogram
        aria-hidden="true"
        style={{
          width: '64px',
          height: '64px',
          color: 'var(--cds-text-secondary)',
        }}
      />
      <h2 className="cds--type-productive-heading-03">No transactions yet</h2>
      <p className="cds--type-body-01">
        Add your first income or expense to start projecting.
      </p>
    </Tile>
  );
}
