import { Column, Grid } from '@carbon/react';
import { SettingsPage } from '@/src/features/settings/SettingsPage';

export default function SettingsRoute() {
  return (
    <Grid>
      <Column sm={4} md={8} lg={{ span: 8, offset: 4 }}>
        <SettingsPage />
      </Column>
    </Grid>
  );
}
