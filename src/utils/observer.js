/**
 * Observe SPA DOM changes and invoke callback (debounced).
 * @param {() => void} onChange
 * @param {number} debounceMs
 * @returns {() => void} disconnect
 */
export function observePageChanges(onChange, debounceMs = 300) {
  let timer = null;

  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      onChange();
    }, debounceMs);
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Also react to history navigations in ADO SPA
  const pushState = history.pushState;
  const replaceState = history.replaceState;

  history.pushState = function (...args) {
    const result = pushState.apply(this, args);
    schedule();
    return result;
  };

  history.replaceState = function (...args) {
    const result = replaceState.apply(this, args);
    schedule();
    return result;
  };

  window.addEventListener("popstate", schedule);

  return () => {
    observer.disconnect();
    if (timer) clearTimeout(timer);
    history.pushState = pushState;
    history.replaceState = replaceState;
    window.removeEventListener("popstate", schedule);
  };
}
