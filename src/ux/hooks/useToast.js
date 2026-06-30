/**
 * useToast.js
 * Thin hook for imperatively pushing toasts from any component.
 *
 * Usage:
 *   const { toast } = useToast();
 *   toast.success('Email verified!');
 *   toast.push('New notice', 'Check your dashboard', '/notices');
 *   toast.info('Changes saved');
 *   toast.warning('Something went wrong');
 */

import { useCallback } from 'react';
import { useUX } from '../UXProvider';

export function useToast() {
  const { pushToast } = useUX();

  const success = useCallback((title, body, url) =>
    pushToast({ title, body, url, type: 'success', duration: 4000 }),
  [pushToast]);

  const info = useCallback((title, body, url) =>
    pushToast({ title, body, url, type: 'info', duration: 5000 }),
  [pushToast]);

  const warning = useCallback((title, body, url) =>
    pushToast({ title, body, url, type: 'warning', duration: 6000 }),
  [pushToast]);

  const push = useCallback((title, body, url) =>
    pushToast({ title, body, url, type: 'push', duration: 6000 }),
  [pushToast]);

  return { toast: { success, info, warning, push } };
}
