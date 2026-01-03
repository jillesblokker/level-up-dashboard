# E2E Test Specifications

This document defines the end-to-end test scenarios for critical user flows.
These can be implemented with Playwright, Cypress, or any E2E testing framework.

## Setup Requirements

```bash
# Install Playwright (when npm works)
npm init playwright@latest

# Or Cypress
npm install -D cypress
```

---

## Critical Test Flows

### 1. Kingdom Property Placement Flow

**Description:** Verify that placing a property updates inventory correctly.

```typescript
// kingdom-property-placement.spec.ts
test('placing a property decreases inventory by 1', async ({ page }) => {
  // 1. Navigate to kingdom page
  await page.goto('/kingdom');
  
  // 2. Wait for grid to load
  await page.waitForSelector('[aria-label="thrivehaven-grid"]');
  
  // 3. Open properties panel
  await page.click('button[aria-label="Open properties panel"]');
  
  // 4. Note initial quantity of a property (e.g., "House")
  const initialQuantity = await page.textContent('[data-testid="house-quantity"]');
  
  // 5. Click on the property to select it
  await page.click('[data-testid="property-house"]');
  
  // 6. Click on a vacant tile to place
  await page.click('[data-testid="tile-vacant-5-5"]');
  
  // 7. Verify success toast appears
  await expect(page.locator('.toast-success')).toBeVisible();
  
  // 8. Verify quantity decreased
  await page.click('button[aria-label="Open properties panel"]');
  const newQuantity = await page.textContent('[data-testid="house-quantity"]');
  expect(parseInt(newQuantity)).toBe(parseInt(initialQuantity) - 1);
});
```

### 2. Character Stats Persistence

**Description:** Verify that gold earned is saved and persists after refresh.

```typescript
// character-stats-persistence.spec.ts
test('gold earned persists after page refresh', async ({ page }) => {
  // 1. Navigate to kingdom
  await page.goto('/kingdom');
  
  // 2. Note initial gold amount
  const initialGold = await page.textContent('[aria-label="gold-display"]');
  
  // 3. Click on a ready building to collect gold
  await page.click('[data-testid="ready-building"]');
  
  // 4. Wait for gold animation/update
  await page.waitForTimeout(1000);
  
  // 5. Note new gold amount
  const newGold = await page.textContent('[aria-label="gold-display"]');
  expect(parseInt(newGold)).toBeGreaterThan(parseInt(initialGold));
  
  // 6. Refresh page
  await page.reload();
  await page.waitForSelector('[aria-label="gold-display"]');
  
  // 7. Verify gold persisted
  const persistedGold = await page.textContent('[aria-label="gold-display"]');
  expect(parseInt(persistedGold)).toBe(parseInt(newGold));
});
```

### 3. Quest Completion Flow

**Description:** Verify completing a quest awards correct rewards.

```typescript
// quest-completion.spec.ts
test('completing a quest awards gold and experience', async ({ page }) => {
  // 1. Navigate to quests page
  await page.goto('/quests');
  
  // 2. Note initial gold and XP
  const initialGold = await page.textContent('[aria-label="gold-display"]');
  const initialXp = await page.textContent('[aria-label="xp-display"]');
  
  // 3. Find a completable quest
  const quest = page.locator('[data-testid="quest-card"]').first();
  
  // 4. Complete the quest
  await quest.locator('button:has-text("Complete")').click();
  
  // 5. Verify reward modal appears
  await expect(page.locator('[data-testid="reward-modal"]')).toBeVisible();
  
  // 6. Close modal
  await page.click('[data-testid="close-modal"]');
  
  // 7. Verify gold/XP increased
  const newGold = await page.textContent('[aria-label="gold-display"]');
  const newXp = await page.textContent('[aria-label="xp-display"]');
  expect(parseInt(newGold)).toBeGreaterThan(parseInt(initialGold));
  expect(parseInt(newXp)).toBeGreaterThan(parseInt(initialXp));
});
```

### 4. Realm Grid Navigation

**Description:** Verify realm grid tiles are clickable and reveal content.

```typescript
// realm-navigation.spec.ts
test('clicking realm tile reveals it and navigates', async ({ page }) => {
  // 1. Navigate to realm
  await page.goto('/realm');
  
  // 2. Wait for grid
  await page.waitForSelector('[aria-label="realm-grid"]');
  
  // 3. Click on an unrevealed adjacent tile
  await page.click('[data-testid="tile-unrevealed"]');
  
  // 4. Verify tile becomes revealed
  await expect(page.locator('[data-testid="tile-revealed"]')).toBeVisible();
});
```

### 5. Error Recovery Flow

**Description:** Verify error boundary catches errors and allows recovery.

```typescript
// error-recovery.spec.ts
test('error boundary allows retry after failure', async ({ page }) => {
  // 1. Simulate an error (e.g., by blocking API)
  await page.route('/api/kingdom-grid', route => route.abort());
  
  // 2. Navigate to kingdom
  await page.goto('/kingdom');
  
  // 3. Verify error boundary is shown
  await expect(page.locator('text=Something went wrong')).toBeVisible();
  
  // 4. Unblock API
  await page.unroute('/api/kingdom-grid');
  
  // 5. Click retry
  await page.click('button:has-text("Try Again")');
  
  // 6. Verify page recovers
  await expect(page.locator('[aria-label="thrivehaven-grid"]')).toBeVisible();
});
```

---

## Data Attributes Required

To make E2E tests reliable, add these `data-testid` attributes:

| Element | Attribute |
|---------|-----------|
| Property cards | `data-testid="property-{id}"` |
| Property quantity | `data-testid="{id}-quantity"` |
| Grid tiles | `data-testid="tile-{type}-{x}-{y}"` |
| Quest cards | `data-testid="quest-card-{id}"` |
| Gold display | `aria-label="gold-display"` |
| XP display | `aria-label="xp-display"` |
| Reward modal | `data-testid="reward-modal"` |

---

## CI Integration

```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright
        run: npx playwright install --with-deps
      - name: Build app
        run: npm run build
      - name: Run E2E tests
        run: npm run test:e2e
```
