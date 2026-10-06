'use client';

import { useEffect, type RefObject } from 'react';

/**
 * Closes a popover on outside pointer-down or Escape. On Escape focus returns to
 * `triggerRef` so keyboard users don't lose their place.
 */
export function useDismiss(
  open: boolean,
  rootRef: RefObject<HTMLElement | null>,
  onClose: () => void,
  triggerRef?: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) onClose();
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.stopPropagation();
      onClose();
      triggerRef?.current?.focus();
    }

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, rootRef, onClose, triggerRef]);
}

/** Arrow / Home / End navigation between `[role^=menuitem]` children of a menu. */
export function handleMenuKeyDown(event: React.KeyboardEvent<HTMLElement>) {
  const items = Array.from(
    event.currentTarget.querySelectorAll<HTMLElement>(
      '[role="menuitem"]:not([disabled]),[role="menuitemradio"]:not([disabled]),[role="option"]:not([disabled])',
    ),
  );
  if (items.length === 0) return;
  const index = items.indexOf(document.activeElement as HTMLElement);
  let next = -1;
  if (event.key === 'ArrowDown') next = index < 0 ? 0 : (index + 1) % items.length;
  else if (event.key === 'ArrowUp') next = index <= 0 ? items.length - 1 : index - 1;
  else if (event.key === 'Home') next = 0;
  else if (event.key === 'End') next = items.length - 1;
  if (next < 0) return;
  event.preventDefault();
  items[next]?.focus();
}
