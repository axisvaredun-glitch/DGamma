/**
 * Admin gate for the artwork preview switcher.
 * Enable later with: localStorage.setItem('isAdmin', 'true')
 * Disable with: localStorage.removeItem('isAdmin')
 */
export const ADMIN_FLAG_KEY = 'isAdmin';

export function isAdmin() {
  try {
    const value = String(localStorage.getItem(ADMIN_FLAG_KEY) || '')
      .trim()
      .toLowerCase();
    return value === '1' || value === 'true' || value === 'yes';
  } catch {
    return false;
  }
}
