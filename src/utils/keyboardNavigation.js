// Keyboard navigation helpers for inputs

/**
 * Returns a keydown handler that, on Enter, focuses the next/previous
 * input with class "order-qty-input" within the provided container element.
 * - Enter: next
 * - Shift+Enter: previous
 * Selects the value of the focused input for quick overwrite.
 */
export function createEnterKeyHandler(getContainerElement) {
  return function handleKeyDown(event) {
    if (event.key !== 'Enter') return;

    const container = typeof getContainerElement === 'function'
      ? getContainerElement()
      : getContainerElement;
    if (!container) return;

    const inputs = container.querySelectorAll('input.order-qty-input');
    if (!inputs || inputs.length === 0) return;

    event.preventDefault();

    const current = event.currentTarget;
    const list = Array.prototype.slice.call(inputs);
    const index = list.indexOf(current);
    if (index === -1) return;

    const direction = event.shiftKey ? -1 : 1;
    let nextIndex = index + direction;

    while (nextIndex >= 0 && nextIndex < list.length) {
      const nextEl = list[nextIndex];
      if (nextEl && !nextEl.disabled && nextEl.offsetParent !== null) {
        nextEl.focus();
        try { nextEl.select && nextEl.select(); } catch (_) {}
        break;
      }
      nextIndex += direction;
    }
  };
}


