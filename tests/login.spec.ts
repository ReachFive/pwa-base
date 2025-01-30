import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  // Expect a title "to contain" a substring.
  await expect(page.locator('text=Hello Extensible React Template!')).toBeVisible();
});

test('try to login with wrong password', async ({ page }) => {
  await page.goto('http://localhost:3000/login');

  // fill email
  await page.getByLabel('Email').fill('some@yopmail.com');
  // fill password
  await page.getByRole('textbox', { name: 'Password' }).fill('wrong-complex-password123!*');

  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page.locator('text=Incorrect username or password, please try again.')).toBeVisible();
});
