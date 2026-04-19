# 14 — Network Interception & API Mocking

[← Previous: Authentication](../phase-3-intermediate/13-authentication.md) | [Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md) | [Next: API Testing →](./15-api-testing.md)

---

## What You Will Learn

- How to intercept, modify, and mock network requests
- How to block resources for faster tests
- How to simulate error states and edge cases
- How to record and replay HAR files

---

## Intercepting Requests with `page.route()`

`page.route()` intercepts HTTP requests matching a URL pattern and lets you modify or mock the response.

### Mock an API response

```javascript
test('show products from mocked API', async ({ page }) => {
  await page.route('**/api/products', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, name: 'Mock Product', price: '$9.99' },
        { id: 2, name: 'Another Mock', price: '$19.99' },
      ]),
    });
  });

  await page.goto('/products');
  await expect(page.getByText('Mock Product')).toBeVisible();
});
```

### Simulate a server error

```javascript
test('show error message when API fails', async ({ page }) => {
  await page.route('**/api/products', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal Server Error' }),
    });
  });

  await page.goto('/products');
  await expect(page.getByText('Something went wrong')).toBeVisible();
});
```

### Simulate network timeout / slow response

```javascript
test('show loading spinner during slow API', async ({ page }) => {
  await page.route('**/api/products', async (route) => {
    await new Promise(resolve => setTimeout(resolve, 5000)); // 5s delay
    await route.fulfill({
      status: 200,
      body: JSON.stringify([]),
    });
  });

  await page.goto('/products');
  await expect(page.getByText('Loading...')).toBeVisible();
});
```

### Modify a real response

```javascript
test('modify API response on the fly', async ({ page }) => {
  await page.route('**/api/products', async (route) => {
    const response = await route.fetch();           // Make the real request
    const json = await response.json();             // Get original data

    json[0].price = '$0.01';                        // Modify it

    await route.fulfill({ response, json });        // Return modified data
  });

  await page.goto('/products');
  await expect(page.getByText('$0.01')).toBeVisible();
});
```

---

## Blocking Resources (Speed Up Tests)

```javascript
test('fast test without images', async ({ page }) => {
  // Block images
  await page.route('**/*.{png,jpg,jpeg,gif,svg}', route => route.abort());

  // Block CSS (test logic only)
  await page.route('**/*.css', route => route.abort());

  // Block analytics/tracking
  await page.route('**/google-analytics.com/**', route => route.abort());
  await page.route('**/facebook.com/**', route => route.abort());

  // Block fonts
  await page.route('**/*.{woff,woff2,ttf}', route => route.abort());

  await page.goto('/');
});
```

### Block by resource type (in context)

```javascript
test('block media resources', async ({ context, page }) => {
  await context.route('**/*', async (route) => {
    const resourceType = route.request().resourceType();
    if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
      await route.abort();
    } else {
      await route.continue();
    }
  });

  await page.goto('/');
});
```

---

## Monitoring Network Requests

### Wait for a specific request

```javascript
test('verify API called on button click', async ({ page }) => {
  await page.goto('/');

  const requestPromise = page.waitForRequest('**/api/add-to-cart');
  await page.locator('#add-to-cart').click();
  const request = await requestPromise;

  expect(request.method()).toBe('POST');
  expect(request.postDataJSON()).toEqual({ productId: 1, quantity: 1 });
});
```

### Wait for a specific response

```javascript
test('verify API response', async ({ page }) => {
  await page.goto('/');

  const responsePromise = page.waitForResponse(
    response => response.url().includes('/api/products') && response.status() === 200
  );
  await page.locator('#load-products').click();
  const response = await responsePromise;

  const data = await response.json();
  expect(data.length).toBeGreaterThan(0);
});
```

### Log all requests

```javascript
test('log network activity', async ({ page }) => {
  page.on('request', request => {
    console.log(`>> ${request.method()} ${request.url()}`);
  });

  page.on('response', response => {
    console.log(`<< ${response.status()} ${response.url()}`);
  });

  await page.goto('/');
});
```

---

## HAR File Recording and Replay

HAR (HTTP Archive) files capture all network traffic, allowing you to replay it later.

### Record a HAR file

```javascript
test('record network traffic', async ({ page }) => {
  await page.routeFromHAR('tests/data/saucedemo.har', {
    update: true,  // Record mode
  });

  await page.goto('https://www.saucedemo.com');
  // ... interact with the app
  // HAR file is saved when the context closes
});
```

### Replay from a HAR file

```javascript
test('replay from HAR (no network needed)', async ({ page }) => {
  await page.routeFromHAR('tests/data/saucedemo.har', {
    update: false,  // Replay mode
    url: '**/api/**',
  });

  await page.goto('https://www.saucedemo.com');
  // All API responses come from the HAR file
});
```

---

## Route URL Patterns

| Pattern | Matches |
|---|---|
| `'**/api/products'` | Any URL ending in `/api/products` |
| `'**/api/**'` | Any URL containing `/api/` |
| `'**/*.png'` | Any PNG file |
| `'https://www.saucedemo.com/**'` | Any URL on this domain |
| RegExp: `/\/api\/products\?page=\d+/` | Regex pattern matching |

---

## `route` Methods Reference

| Method | Description |
|---|---|
| `route.fulfill(options)` | Return a custom response (mock) |
| `route.abort()` | Block the request entirely |
| `route.continue()` | Let the request proceed normally |
| `route.fetch()` | Make the real request and get the response |
| `route.fallback()` | Pass to next route handler |
| `route.request()` | Access the intercepted request object |

---

## Practice Exercises

1. Write a test that mocks an API to return an empty product list and verify "No products found" message
2. Block all images on SauceDemo and compare test speed with and without blocking
3. Write a test that intercepts a POST request on checkout and verifies the request body
4. Record a HAR file for the full purchase flow and replay it offline
5. Write a test that simulates a 503 Service Unavailable error and verifies the error UI

---

[Next: API Testing with Playwright →](./15-api-testing.md)
