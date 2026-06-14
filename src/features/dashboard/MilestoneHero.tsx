'use client';
import { Button, SkeletonText, Stack } from '@carbon/react';
import { ArrowRight } from '@carbon/icons-react';

export interface HeroWaypoint {
  /** e.g. "In 10 years (by around 2036)" */
  label: string;
  /** Pre-formatted money string for the mid scenario at this horizon. */
  value: string;
}

interface Props {
  /** True while the projection is still resolving (cfg load); renders skeleton. */
  loading: boolean;
  /** Year-30 mid value, pre-formatted in display currency. */
  yr30Value: string;
  /** Year-30 low / high values for the honesty range, pre-formatted. */
  yr30Low: string;
  yr30High: string;
  /** Calendar year at the 30-year horizon (anchor year + 30). */
  yr30Year: number;
  /** Year-10 and Year-20 mid waypoints, in order. */
  waypoints: HeroWaypoint[];
}

/**
 * The Dashboard's emotional headline: the 30-year mid projection embedded in
 * honest "current pace" prose, with Year-10/20 waypoints and the low-high range.
 *
 * Containerless by design (no Tile, no shadow, no accent chrome) per DESIGN.md's
 * No-Shadow Rule and to avoid the hero-metric card cliché — the number leads as the
 * largest thing on screen (productive-heading-07, light weight), the prose frames it
 * as a projection, never a promise (PRODUCT.md: clear, honest, unhurried). Spacing
 * is via Carbon <Stack> (compiled gaps) since --cds-spacing-* is not a runtime var.
 */
export default function MilestoneHero({
  loading,
  yr30Value,
  yr30Low,
  yr30High,
  yr30Year,
  waypoints,
}: Props) {
  return (
    <section aria-labelledby="milestone-hero-eyebrow" className="flowstate-dashboard-hero">
      <Stack gap={6}>
        <Stack gap={3}>
          <p
            id="milestone-hero-eyebrow"
            className="cds--type-label-01"
            style={{ color: 'var(--cds-text-secondary)' }}
          >
            30-year projection
          </p>

          {loading ? (
            <>
              <SkeletonText width="70%" />
              <SkeletonText width="40%" heading />
              <SkeletonText width="55%" />
            </>
          ) : (
            <>
              <p className="cds--type-body-01" style={{ color: 'var(--cds-text-secondary)' }}>
                At your current pace, your portfolio could reach
              </p>

              <p
                className="cds--type-productive-heading-07"
                style={{ color: 'var(--cds-text-primary)', fontVariantNumeric: 'tabular-nums' }}
              >
                {yr30Value}
              </p>

              <p className="cds--type-body-01" style={{ color: 'var(--cds-text-secondary)' }}>
                by around {yr30Year}, in the mid scenario (17.5% a year).
              </p>

              <p className="cds--type-label-01" style={{ color: 'var(--cds-text-secondary)' }}>
                Could land anywhere from {yr30Low} to {yr30High}, depending on how markets perform.
              </p>
            </>
          )}
        </Stack>

        {!loading && (
          <>
            <Stack gap={3}>
              <p className="cds--type-label-01" style={{ color: 'var(--cds-text-secondary)' }}>
                On the way
              </p>
              <Stack orientation="horizontal" gap={7} style={{ flexWrap: 'wrap' }}>
                {waypoints.map((wp) => (
                  <Stack as="div" gap={2} key={wp.label}>
                    <p
                      className="cds--type-label-01"
                      style={{ color: 'var(--cds-text-secondary)', whiteSpace: 'nowrap' }}
                    >
                      {wp.label}
                    </p>
                    <p
                      className="cds--type-productive-heading-05"
                      style={{ color: 'var(--cds-text-primary)', fontVariantNumeric: 'tabular-nums' }}
                    >
                      {wp.value}
                    </p>
                  </Stack>
                ))}
              </Stack>
            </Stack>

            <Button
              kind="ghost"
              href="/simulation"
              renderIcon={ArrowRight}
              style={{ paddingInlineStart: 0 }}
            >
              See the full projection
            </Button>
          </>
        )}
      </Stack>
    </section>
  );
}
