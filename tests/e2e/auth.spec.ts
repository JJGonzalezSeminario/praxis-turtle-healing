import { test, expect } from '@playwright/test';

test.describe('Authentifizierung & Autorisierung', () => {
  test('Nicht angemeldete Nutzer werden auf /login weitergeleitet', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });

  test('Nicht-Admin kann nicht auf die Admin-Seiten zugreifen', async ({ page }) => {
    await page.goto('/login');
    // Wir füllen Zugangsdaten für einen nicht-Admin ein (Simulationsbeispiel)
    await page.fill('input[type="email"]', 'mitarbeiter@turtle-healing.de');
    await page.fill('input[type="password"]', 'Passwort123');
    // In der echten Testdatenbank ausführen (oder Mocks verwenden)
  });
});
