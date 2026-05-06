/**
 * Create a live region for screen reader announcements if it doesn't exist
 */
function createLiveRegion(): HTMLElement {
  const liveRegion = document.createElement('div')
  liveRegion.setAttribute('aria-live', 'polite')
  liveRegion.setAttribute('aria-atomic', 'true')
  liveRegion.className = 'sr-only'
  liveRegion.id = 'live-region'
  document.body.appendChild(liveRegion)
  return liveRegion
}

/**
 * Announce message to screen readers
 */
export const announceToScreenReader = (message: string) => {
  if (typeof document === 'undefined') return

  let liveRegion = document.getElementById('live-region')
  if (!liveRegion) {
    liveRegion = createLiveRegion()
  }
  liveRegion.textContent = message
}
