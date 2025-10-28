import { AppProviders } from './AppProviders';
import { SessionProvider } from './session/SessionProvider';
import { AppRouter } from './AppRouter';

export const AppShell = () => (
  <AppProviders>
    <SessionProvider>
      <AppRouter />
    </SessionProvider>
  </AppProviders>
);
