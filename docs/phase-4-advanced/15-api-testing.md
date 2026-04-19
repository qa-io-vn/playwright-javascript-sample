# 15 — API Testing with Playwright

[← Previous: Network & Mocking](./14-network-and-mocking.md) | [Back to Main Guide](../../PLAYWRIGHT_EXPERT_GUIDE.md) | [Next: Visual Regression →](./16-visual-regression.md)

---

## What You Will Learn

- How to use Playwright's `request` fixture for pure API testing (no browser)
- How to make GET, POST, PUT, PATCH, DELETE requests
- How to validate response status, headers, and body
- How to combine API + UI tests (hybrid testing)

---

## Why API Testing with Playwright?

- **No extra library needed** — Playwright includes an HTTP client
- **Same framework** for UI + API tests — one config, one report
- **Share authentication** between API and UI tests
- **Faster than Selenium/REST-assured** for hybrid tests

---

## The `request` Fixture

Playwright provides a built-in `request` fixture — a lightweight HTTP client.

### GET Request

```javascript
const { test, expect } = require('@playwright/test');

test('GET /api/products returns 200', async ({ request }) => {
  const response = await request.get('https://api.example.com/products');

  expect(response.ok()).toBeTruthy();         // Status 200-299
  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body).toHaveLength(6);
  expect(body[0]).toHaveProperty('name');
  expect(body[0]).toHaveProperty('price');
});
```

### POST Request

```javascript
test('POST /api/products creates a product', async ({ request }) => {
  const response = await request.post('https://api.example.com/products', {
    data: {
      name: 'Test Product',
      price: 29.99,
      description: 'A test product',
    },
  });

  expect(response.status()).toBe(201);

  const body = await response.json();
  expect(body.id).toBeDefined();
  expect(body.name).toBe('Test Product');
});
```

### PUT Request

```javascript
test('PUT /api/products/:id updates a product', async ({ request }) => {
  const response = await request.put('https://api.example.com/products/1', {
    data: {
      name: 'Updated Product',
      price: 39.99,
    },
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.name).toBe('Updated Product');
});
```

### PATCH Request

```javascript
test('PATCH /api/products/:id partial update', async ({ request }) => {
  const response = await request.patch('https://api.example.com/products/1', {
    data: { price: 49.99 },
  });

  expect(response.status()).toBe(200);
});
```

### DELETE Request

```javascript
test('DELETE /api/products/:id removes a product', async ({ request }) => {
  const response = await request.delete('https://api.example.com/products/1');
  expect(response.status()).toBe(204);
});
```

---

## Request Options

```javascript
const response = await request.post('/api/data', {
  // Request body (automatically serialized to JSON)
  data: { key: 'value' },

  // Custom headers
  headers: {
    'Authorization': 'Bearer my-token',
    'X-Custom-Header': 'value',
  },

  // Query parameters (?page=1&limit=10)
  params: {
    page: 1,
    limit: 10,
  },

  // Form data (multipart)
  multipart: {
    file: {
      name: 'upload.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('file content'),
    },
    field: 'value',
  },

  // Form URL-encoded
  form: {
    username: 'user',
    password: 'pass',
  },

  // Timeout
  timeout: 30000,

  // Ignore HTTPS errors
  ignoreHTTPSErrors: true,
});
```

---

## Response Validation

```javascript
test('comprehensive response validation', async ({ request }) => {
  const response = await request.get('/api/products');

  // Status
  expect(response.ok()).toBeTruthy();
  expect(response.status()).toBe(200);
  expect(response.statusText()).toBe('OK');

  // Headers
  expect(response.headers()['content-type']).toContain('application/json');

  // URL
  expect(response.url()).toContain('/api/products');

  // Body as JSON
  const json = await response.json();
  expect(json).toBeInstanceOf(Array);

  // Body as text
  const text = await response.text();
  expect(text).toContain('Backpack');

  // Body as buffer
  const buffer = await response.body();
  expect(buffer.length).toBeGreaterThan(0);
});
```

---

## Shared API Context with Base URL and Auth

```javascript
// playwright.config.js
module.exports = defineConfig({
  use: {
    baseURL: 'https://api.example.com',
    extraHTTPHeaders: {
      'Authorization': `Bearer ${process.env.API_TOKEN}`,
      'Accept': 'application/json',
    },
  },
});
```

```javascript
// Now all requests use the baseURL and auth header
test('get products', async ({ request }) => {
  const response = await request.get('/api/products');  // Uses baseURL
  expect(response.ok()).toBeTruthy();
});
```

---

## Hybrid Testing: API + UI

The most powerful SDET pattern — use API for setup, UI for verification.

### Set up data via API, verify via UI

```javascript
test('product created via API appears in UI', async ({ request, page }) => {
  // STEP 1: Create product via API (fast, no browser)
  const createResponse = await request.post('/api/products', {
    data: { name: 'API Product', price: 99.99 },
  });
  expect(createResponse.status()).toBe(201);
  const { id } = await createResponse.json();

  // STEP 2: Verify via UI (user perspective)
  await page.goto('/products');
  await expect(page.getByText('API Product')).toBeVisible();
  await expect(page.getByText('$99.99')).toBeVisible();

  // STEP 3: Clean up via API
  await request.delete(`/api/products/${id}`);
});
```

### Login via API, test via UI

```javascript
test('API login + UI test', async ({ request, page }) => {
  // Login via API (instant, no UI)
  const loginResponse = await request.post('/api/auth/login', {
    data: { username: 'admin', password: 'admin' },
  });
  const { token } = await loginResponse.json();

  // Set token in browser context
  await page.goto('/');
  await page.evaluate((t) => {
    localStorage.setItem('auth-token', t);
  }, token);

  // Now test the authenticated UI
  await page.goto('/dashboard');
  await expect(page.getByText('Welcome, admin')).toBeVisible();
});
```

---

## CRUD Test Pattern

```javascript
test.describe('Products API CRUD', () => {
  let productId;

  test('CREATE - POST /api/products', async ({ request }) => {
    const response = await request.post('/api/products', {
      data: { name: 'Test', price: 10 },
    });
    expect(response.status()).toBe(201);
    const body = await response.json();
    productId = body.id;
  });

  test('READ - GET /api/products/:id', async ({ request }) => {
    const response = await request.get(`/api/products/${productId}`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.name).toBe('Test');
  });

  test('UPDATE - PUT /api/products/:id', async ({ request }) => {
    const response = await request.put(`/api/products/${productId}`, {
      data: { name: 'Updated', price: 20 },
    });
    expect(response.status()).toBe(200);
  });

  test('DELETE - DELETE /api/products/:id', async ({ request }) => {
    const response = await request.delete(`/api/products/${productId}`);
    expect(response.status()).toBe(204);
  });
});
```

---

## Practice Exercises

1. Write a test that calls a public API (e.g., `https://jsonplaceholder.typicode.com/posts`) and validates the response
2. Write a CRUD test suite against `https://jsonplaceholder.typicode.com`
3. Create a hybrid test: fetch data from API, then navigate to a page and verify the data appears
4. Write a test that sends a POST with `form` data instead of JSON
5. Write a test that validates response headers (content-type, cache-control)

---

[Next: Visual Regression Testing →](./16-visual-regression.md)
