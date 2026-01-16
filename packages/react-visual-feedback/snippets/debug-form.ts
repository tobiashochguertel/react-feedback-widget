#!/usr/bin/env bun
/**
 * Debug script to analyze the feedback modal form structure.
 *
 * Usage: ./snippets/debug-form.ts
 */

import { chromium } from '@playwright/test';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3002...');
  await page.goto('http://localhost:3002');
  await page.waitForLoadState('networkidle');

  console.log('\n--- Pressing Alt+A to open modal ---');
  await page.keyboard.press('Alt+a');
  await page.waitForTimeout(500);

  // Check if modal is open
  const dialog = page.getByRole('dialog');
  const isVisible = await dialog.isVisible();
  console.log(`\nModal visible: ${isVisible}`);

  if (isVisible) {
    console.log('\n--- Modal Content Analysis ---');

    // Get all input elements
    const inputs = await page.locator('input, textarea').all();
    console.log(`\nFound ${inputs.length} input/textarea elements:`);
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const placeholder = await input.getAttribute('placeholder');
      const name = await input.getAttribute('name');
      const type = await input.getAttribute('type');
      const ariaLabel = await input.getAttribute('aria-label');
      const tagName = await input.evaluate(el => el.tagName.toLowerCase());
      console.log(`  ${i + 1}. <${tagName}> placeholder="${placeholder}" name="${name}" type="${type}" aria-label="${ariaLabel}"`);
    }

    // Get all buttons
    const buttons = await page.getByRole('button').all();
    console.log(`\nFound ${buttons.length} buttons:`);
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const text = await button.textContent();
      const disabled = await button.isDisabled();
      const ariaLabel = await button.getAttribute('aria-label');
      console.log(`  ${i + 1}. "${text?.trim()}" disabled=${disabled} aria-label="${ariaLabel}"`);
    }

    // Get all selects/comboboxes
    const comboboxes = await page.getByRole('combobox').all();
    console.log(`\nFound ${comboboxes.length} combobox elements:`);
    for (let i = 0; i < comboboxes.length; i++) {
      const cb = comboboxes[i];
      const text = await cb.textContent();
      const ariaLabel = await cb.getAttribute('aria-label');
      console.log(`  ${i + 1}. "${text?.trim()}" aria-label="${ariaLabel}"`);
    }

    // Look for select elements
    const selects = await page.locator('select').all();
    console.log(`\nFound ${selects.length} select elements:`);
    for (let i = 0; i < selects.length; i++) {
      const select = selects[i];
      const name = await select.getAttribute('name');
      const ariaLabel = await select.getAttribute('aria-label');
      console.log(`  ${i + 1}. name="${name}" aria-label="${ariaLabel}"`);
    }

    // Look for any label elements
    const labels = await page.locator('label').all();
    console.log(`\nFound ${labels.length} label elements:`);
    for (let i = 0; i < Math.min(labels.length, 10); i++) {
      const label = labels[i];
      const text = await label.textContent();
      console.log(`  ${i + 1}. "${text?.trim().substring(0, 50)}"`);
    }

    // Check for screenshot preview
    const screenshotPreview = await page.locator('[data-testid="screenshot-preview"]').count();
    console.log(`\nScreenshot preview with data-testid: ${screenshotPreview > 0 ? 'found' : 'NOT found'}`);

    // Look for any img elements
    const images = await page.locator('img').all();
    console.log(`\nFound ${images.length} img elements:`);
    for (let i = 0; i < Math.min(images.length, 5); i++) {
      const img = images[i];
      const alt = await img.getAttribute('alt');
      const testId = await img.getAttribute('data-testid');
      const className = await img.getAttribute('class');
      console.log(`  ${i + 1}. alt="${alt}" data-testid="${testId}" class="${className?.substring(0, 50)}"`);
    }

    // Look for screenshot-related elements
    console.log('\n--- Looking for screenshot elements ---');
    const screenshotElements = await page.locator('[class*="screenshot" i], [class*="preview" i], [data-testid*="screenshot" i]').all();
    console.log(`Found ${screenshotElements.length} screenshot-related elements`);

  } else {
    console.log('Modal not found! Something is wrong.');
  }

  await browser.close();
  console.log('\nDone!');
}

main().catch(console.error);
