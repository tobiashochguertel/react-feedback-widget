#!/usr/bin/env bun
/**
 * Debug script to examine the feedback example app
 */

import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Navigating to example app...');
  await page.goto('http://localhost:3002');
  await page.waitForLoadState('networkidle');

  console.log('\nPage title:', await page.title());

  // Click the select element button
  console.log('\nClicking Select Element button...');
  const selectBtn = page.getByRole('button', { name: /Select Element/i });
  await selectBtn.click();

  await page.waitForTimeout(1000);

  // Check for overlay elements
  const overlays = await page.locator('[data-feedback-overlay]').all();
  console.log(`Found ${overlays.length} elements with data-feedback-overlay`);
  for (const overlay of overlays) {
    const value = await overlay.getAttribute('data-feedback-overlay');
    console.log(`  data-feedback-overlay="${value}"`);
  }

  // Press Escape to close
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Open modal via Alt+A
  console.log('\nPressing Alt+A keyboard shortcut...');
  await page.keyboard.press('Alt+a');
  await page.waitForTimeout(1000);

  // Check for close buttons in the modal
  const closeButtons = await page.locator('button').filter({ hasText: /close|x|×/i }).all();
  console.log(`\nFound ${closeButtons.length} close-like buttons`);

  // Check for all buttons in the dialog
  const dialogButtons = await page.locator('[role="dialog"] button').all();
  console.log(`\nButtons inside dialog: ${dialogButtons.length}`);
  for (let i = 0; i < dialogButtons.length; i++) {
    const btn = dialogButtons[i];
    const text = await btn.textContent();
    const aria = await btn.getAttribute('aria-label');
    console.log(`  Button ${i}: text="${text?.trim()}", aria-label="${aria}"`);
  }

  // Check all buttons with X or close
  const allButtons = await page.locator('button').all();
  console.log(`\nAll buttons on page: ${allButtons.length}`);
  for (let i = 0; i < allButtons.length; i++) {
    const btn = allButtons[i];
    const html = await btn.innerHTML();
    const aria = await btn.getAttribute('aria-label');
    const title = await btn.getAttribute('title');
    if (html.includes('svg') || aria?.toLowerCase().includes('close') || title?.toLowerCase().includes('close')) {
      console.log(`  Button ${i}: aria-label="${aria}", title="${title}", has SVG: ${html.includes('svg')}`);
    }
  }

  // Keep browser open for manual inspection
  console.log('\nBrowser will close in 30 seconds...');
  await page.waitForTimeout(30000);

  await browser.close();
}

main().catch(console.error);
