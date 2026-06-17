'use client';
import Link from 'next/link';
import { Button, Tile } from '@carbon/react';
import { AddDocument } from '@carbon/pictograms-react';

// Reuses the Dashboard's pictogram (ADR 005) for empty-state language consistency across pages.

export default function SimulationEmptyState() {
  return (
    <Tile
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '1rem' /* --cds-spacing-05 */,
        padding: '3rem' /* --cds-spacing-09 */,
      }}
    >
      <AddDocument aria-hidden="true" />

      <h2 className="cds--type-productive-heading-03">No data yet</h2>

      <p className="cds--type-body-01" style={{ color: 'var(--cds-text-secondary)' }}>
        Add a transaction to start your 30-year projection.
      </p>

      <Button as={Link} href="/cash-flow" kind="primary">
        Add your first transaction
      </Button>
    </Tile>
  );
}
