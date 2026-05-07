'use client';
import Link from 'next/link';
import { Button, Tile } from '@carbon/react';
import { AddDocument } from '@carbon/pictograms-react';

// TaskAdd does not exist in @carbon/pictograms-react@11; AddDocument is the closest semantic match.
// ADR recorded in docs/decisions/002_add-document-pictogram.md.

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
      <AddDocument aria-hidden="true" />

      <h2 className="cds--type-productive-heading-03">No data yet</h2>

      <p className="cds--type-body-01" style={{ color: 'var(--cds-text-secondary)' }}>
        Add your first income or expense to start projecting.
      </p>

      <Button as={Link} href="/cash-flow" kind="primary">
        Add a transaction
      </Button>
    </Tile>
  );
}
