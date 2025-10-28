import { useEffect, useMemo, useState } from 'react';
import { useProgressStore } from '@core/state';

const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

export const useSessionDuration = () => {
  const session = useProgressStore((state) => state.session);
  const { markReminderShown } = useProgressStore((state) => state.actions);
  const [now, setNow] = useState(() => Date.now());
  const [reminderActive, setReminderActive] = useState(false);

  useEffect(() => {
    if (session.status !== 'active') {
      setNow(Date.now());
      return;
    }
    setNow(Date.now());
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [session.status]);

  const elapsedMs = useMemo(() => {
    if (session.status === 'active' && session.startedAt) {
      return session.elapsedMs + Math.max(0, now - session.startedAt);
    }
    return session.elapsedMs;
  }, [session.elapsedMs, session.startedAt, session.status, now]);

  useEffect(() => {
    if (elapsedMs >= FIFTEEN_MINUTES_MS && !session.reminderShown) {
      setReminderActive(true);
      markReminderShown();
    }
  }, [elapsedMs, markReminderShown, session.reminderShown]);

  useEffect(() => {
    if (session.status !== 'active') {
      setReminderActive(false);
    }
  }, [session.status]);

  const dismissReminder = () => setReminderActive(false);

  return {
    elapsedMs,
    reminderActive,
    dismissReminder
  };
};
