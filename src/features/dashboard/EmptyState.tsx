'use client';
import Link from 'next/link';
import { Button, Tile } from '@carbon/react';
import { AddDocument } from '@carbon/pictograms-react';

// TaskAdd does not exist in @carbon/pictograms-react@11; AddDocument is the closest semantic match.
// ADR recorded in docs/decisions/005_add-document-pictogram.md.

export default function EmptyState() {
  return (
    <Tile
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        // Literal rems equal to Carbon tokens; --cds-spacing-* is not a runtime var
        // (ADR 011). Native flex centering (a horizontal/grid Stack won't center a
        // fixed-width pictogram or stretches the button) — rule 4 permits flex here.
        gap: '1rem' /* --cds-spacing-05 */,
        padding: '3rem' /* --cds-spacing-09 */,
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
