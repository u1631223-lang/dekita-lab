import { ReactNode } from 'react';

import './HubLayout.css';

type HubLayoutProps = {
  title: string;
  headerActions?: ReactNode;
  children: ReactNode;
};

export const HubLayout = ({ title, headerActions, children }: HubLayoutProps) => (
  <main className="hub-layout">
    <header className="hub-layout__header">
      <h1>{title}</h1>
      {headerActions ? <div className="hub-layout__actions">{headerActions}</div> : null}
    </header>
    <section className="hub-layout__grid">{children}</section>
  </main>
);
