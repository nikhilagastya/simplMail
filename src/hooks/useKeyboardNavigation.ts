import { useEffect, useCallback } from 'react';

interface KeyboardNavigationOptions {
  onArrowUp: () => void;
  onArrowDown: () => void;
  onSummary: () => void;
  onReminder: () => void;
  isEnabled?: boolean;
}

export const useKeyboardNavigation = ({
  onArrowUp,
  onArrowDown,
  onSummary,
  onReminder,
  isEnabled = true,
}: KeyboardNavigationOptions) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isEnabled) return;

    // Prevent navigation when user is typing in inputs
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLSelectElement
    ) {
      return;
    }

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        onArrowUp();
        break;
      case 'ArrowDown':
        event.preventDefault();
        onArrowDown();
        break;
      case 's':
      case 'S':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          onSummary();
        }
        break;
      case 'r':
      case 'R':
        if (!event.ctrlKey && !event.metaKey) {
          event.preventDefault();
          onReminder();
        }
        break;
    }
  }, [onArrowUp, onArrowDown, onSummary, onReminder, isEnabled]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
};