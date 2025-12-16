# AGENTS.md - Project Documentation for AI Assistants

This document provides context for AI assistants working on this codebase. It outlines the technical stack, architectural patterns, coding conventions, and project structure.

---

## Project Overview

**Name:** `@scandinavianairlines/react-router-azure-functions`  
**Type:** Server Adapter Library  
**Purpose:** Adapts Azure Functions HTTP requests to work with React Router v7 applications  
**Language:** JavaScript (ES Modules) with JSDoc for type safety  
**Runtime:** Node.js 20+  
**License:** MIT

---

## Technology Stack

### Core Dependencies

- **Runtime Platform:** Azure Functions v4 Programming Model
- **Framework Integration:** React Router v7 (`react-router`)
- **Module System:** ES Modules (`"type": "module"`)
- **Node Version:** >= 20.0.0

### Development Tools

- **Testing:** Vitest with coverage (`@vitest/coverage-v8`)
- **Type Checking:** TypeScript (`tsc --emitDeclarationOnly --checkJs`)
- **Linting:** ESLint with Neostandard config
- **Formatting:** Prettier with import sorting (`@trivago/prettier-plugin-sort-imports`)
- **Git Hooks:** Husky + lint-staged
- **Commit Convention:** Conventional Commits (Commitlint)
- **Package Manager:** Yarn 4.11.0

### Type System

- **Approach:** JSDoc comments in JavaScript files
- **Type Generation:** Automatic via `tsc --emitDeclarationOnly`
- **Output:** TypeScript declaration files (`.d.ts`) in `types/` directory
- **Validation:** `tsc --noEmit --checkJs` for type checking without compilation

---

## Architecture Patterns

### Adapter Pattern

The library implements the **Adapter Pattern** to bridge two incompatible interfaces:

```
Azure Functions HTTP ←→ Web Fetch API ←→ React Router
```

**Key Transformations:**

1. `HttpRequest` (Azure) → `Request` (Web Fetch API)
2. `Response` (Web Fetch API) → `HttpResponseInit` (Azure)
3. URL parsing from Azure-specific headers

### Separation of Concerns

The codebase is organized into distinct responsibilities:

```
┌─────────────────────────────────────────┐
│  Azure Functions HTTP Request           │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  URL Parser (urlParser)                 │
│  - Extracts URL from headers            │
│  - Handles x-forwarded-host, etc.       │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Request Transformer                    │
│  (createRequest)                   │
│  - Creates Web Request object           │
│  - Handles method, headers, body        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Framework Handler                      │
│  (React Router)                         │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Response Transformer                   │
│  (toAzureResponse)                      │
│  - Converts to Azure format             │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Azure Functions HTTP Response          │
└─────────────────────────────────────────┘
```

### Functional Programming

- **Pure Functions:** Most functions are pure (no side effects)
- **Immutability:** No mutation of input parameters
- **Higher-Order Functions:** `createRequestHandler` returns a configured handler function
- **Composition:** Functions are composed to create the request/response pipeline

---

## Coding Conventions

### JavaScript Style

**Module System:**

```javascript
// ✅ Always use ES Modules
import { foo } from './module.js';
export function bar() {}

// ❌ Never use CommonJS
const foo = require('./module');
module.exports = bar;
```

**Function Declarations:**

```javascript
// ✅ Prefer function declarations for exported functions
export function createRequestHandler(options) {
  // ...
}

// ✅ Use arrow functions for callbacks and internal functions
const handler = createReactRouterRequestHandler(options.build, options.mode || process.env.NODE_ENV);
```

**Async/Await:**

```javascript
// ✅ Always use async/await, never raw Promises
async function handleRequest(request, context) {
  const data = await fetchData();
  return processData(data);
}

// ❌ Avoid Promise chains
function handleRequest(request, context) {
  return fetchData().then(processData);
}
```

### Type Safety with JSDoc

**All functions must have complete JSDoc:**

```javascript
/**
 * Brief description of what the function does.
 * @param {Type} paramName - Description of parameter.
 * @param {import('module').Type} [optionalParam] - Optional parameter.
 * @returns {ReturnType} Description of return value.
 */
export function functionName(paramName, optionalParam) {
  // implementation
}
```

**Import types from external modules:**

```javascript
/**
 * @typedef {(request: Request, context: import('@azure/functions').InvocationContext) => Promise<import('react-router').AppLoadContext>} GetLoadContextFn
 */
```

**Use @typedef for complex types:**

```javascript
/**
 * @typedef RequestInit
 * @property {string} method - HTTP method
 * @property {Headers} headers - Request headers
 * @property {AbortSignal} signal - Abort signal
 * @property {BodyInit|null} body - Request body
 * @property {'half'|undefined} duplex - Duplex mode
 */
```

### Naming Conventions

**Variables and Functions:**

- `camelCase` for variables and function names
- Descriptive names over abbreviations
- Boolean variables prefixed with `is`, `has`, `should`

```javascript
// ✅ Good
const isGetOrHead = request => request.method === 'GET' || request.method === 'HEAD';
const hasCustomParser = Boolean(options.urlParser);

// ❌ Avoid
const check = r => r.method === 'GET' || r.method === 'HEAD';
const parser = Boolean(options.urlParser);
```

**Constants:**

```javascript
// ✅ Use UPPER_CASE for true constants
const DEFAULT_PROTOCOL = 'https';

// ✅ Use regular camelCase for derived values
const protocol = request.headers.get('x-forwarded-proto') || DEFAULT_PROTOCOL;
```

### Error Handling

**Defensive programming:**

```javascript
// ✅ Use optional chaining and nullish coalescing
const loadContext = await options.getLoadContext?.(request, context);
const mode = options.mode || process.env.NODE_ENV;

// ✅ Validate inputs at boundaries
function createRequest(request, options = {}) {
  if (!request) {
    throw new TypeError('Request is required');
  }
  // ...
}
```

**Let errors propagate:**

```javascript
// ✅ Don't catch errors unnecessarily - let them bubble up
async function functionHandler(request, context) {
  const request_ = createRemixRequest(request, { urlParser: options.urlParser });
  const response = await handler(remixRequest, loadContext);
  return toAzureResponse(response);
}

// ❌ Avoid swallowing errors
async function functionHandler(request, context) {
  try {
    // ...
  } catch (error) {
    console.log(error); // Silent failure
    return { status: 500 };
  }
}
```

### Comments

**When to comment:**

```javascript
// ✅ Document complex logic or Azure-specific behavior
// Note: Azure Functions v4 expects ReadableStream to be consumed
const body = await streamToString(response.body);

// ✅ Explain "why" not "what"
// Note: No current way to abort these for Azure, but our router expects
// requests to contain a signal so it can detect aborted requests
const controller = new AbortController();

// ❌ Don't state the obvious
// Create a new URL
const url = new URL(originalUrl, `${protocol}://${host}`);
```

**JSDoc over inline comments:**

```javascript
// ✅ Use JSDoc for API documentation
/**
 * Checks if the incoming request is a GET or HEAD request.
 * @param {import('@azure/functions').HttpRequest} request - Azure HTTP request.
 * @returns {boolean} `true` if the request is a GET or HEAD request.
 */
const isGetOrHead = request => request.method === 'GET' || request.method === 'HEAD';

// ❌ Don't use inline comments for public APIs
// Returns true if GET or HEAD
const isGetOrHead = request => request.method === 'GET' || request.method === 'HEAD';
```

---

## Testing Conventions

### Test Organization

**File Structure:**

```
src/
├── server.js          # Implementation
└── server.test.js     # Tests (same name + .test.js)
```

**Test Suite Structure:**

```javascript
import { beforeEach, describe, expect, test, vi } from 'vitest';

describe('module name', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  test('should describe expected behavior', () => {
    // Arrange
    const input = createInput();

    // Act
    const result = functionUnderTest(input);

    // Assert
    expect(result).toEqual(expectedOutput);
  });
});
```

### Mocking Strategy

**Mock external dependencies:**

```javascript
// ✅ Mock framework dependencies
vi.mock('react-router', () => ({
  createRequestHandler: vi.fn(),
}));

// ✅ Use vi.fn() for callbacks
const mockGetLoadContext = vi.fn().mockResolvedValue({});
```

**Test real Azure Function types:**

```javascript
// ✅ Use actual Azure Functions HttpRequest class
import { HttpRequest } from '@azure/functions';

const mockHttpRequest = new HttpRequest({
  method: 'GET',
  headers: { 'x-forwarded-host': 'test.com' },
  url: 'https://test.com',
});
```

### Test Coverage

**Target:** Maintain high coverage (>80%)

```bash
npm test -- --coverage
```

**Focus areas:**

- All public API functions
- Edge cases (null, undefined, empty values)
- Error conditions
- Azure-specific header parsing
- Different HTTP methods (GET, POST, HEAD, etc.)

---

## File Structure

```
react-router-azure-functions/
├── .github/              # GitHub workflows and templates
├── .husky/               # Git hooks
├── coverage/             # Test coverage reports (gitignored)
├── node_modules/         # Dependencies (gitignored)
├── plans/                # Planning documents
├── src/                  # Source code
│   ├── server.js         # Main implementation
│   └── server.test.js    # Tests
├── types/                # Generated TypeScript definitions
│   └── src/
│       └── server.d.ts   # Auto-generated types
├── index.js              # Package entry point (re-exports)
├── package.json          # Package configuration
├── tsconfig.json         # TypeScript config (for type checking)
└── vitest.config.js      # Test configuration
```

---

## Build and Release Process

### Development Workflow

```bash
# Install dependencies
yarn install

# Type checking
yarn types

# Linting
yarn lint

# Testing
yarn test

# Coverage
yarn test --coverage
```

### Pre-publish Steps

```bash
# 1. Generate type definitions
yarn prepublishOnly  # Runs: tsc --emitDeclarationOnly

# 2. Verify package contents
npm pack --dry-run

# 3. Publish
npm publish
```

### Type Generation

**Automatic from JSDoc:**

```javascript
// src/server.js
/**
 * @param {string} name
 * @returns {string}
 */
export function greet(name) {
  return `Hello, ${name}`;
}
```

**Generates:**

```typescript
// types/src/server.d.ts
export function greet(name: string): string;
```

### Versioning

**Follows Semantic Versioning:**

- **Major (3.0.0):** Breaking changes (e.g., dependency updates)
- **Minor (2.1.0):** New features, backward compatible
- **Patch (2.0.1):** Bug fixes

**Automated via Commitlint:**

- `feat:` → Minor version bump
- `fix:` → Patch version bump
- `BREAKING CHANGE:` → Major version bump

---

## Azure Functions Specifics

### URL Parsing Priority

The adapter checks headers in this order:

1. `x-forwarded-host` (preferred)
2. `host` (fallback)

For the original URL:

1. `x-ms-original-url` (Azure Static Web Apps)
2. `x-original-url` (alternative)
3. `params.path` (route parameter)
4. `/` (default)

### Request Headers

**Always preserved:**

- All incoming request headers are passed through
- No header filtering or modification

**Special handling:**

- `x-forwarded-proto` → Protocol (defaults to `https`)
- `x-forwarded-host` → Host
- `x-ms-original-url` → Original request path

### Response Format

**Azure Functions expects:**

```javascript
{
  status: number,           // HTTP status code
  headers: Record<string, string>, // Header object (not Headers instance)
  body: ReadableStream | string | null  // Response body
}
```

**Web Response provides:**

```javascript
{
  status: number,
  headers: Headers,         // Headers instance
  body: ReadableStream | null
}
```

**Adapter transforms:**

```javascript
{
  status: response.status,
  headers: Object.fromEntries(response.headers.entries()), // Convert Headers to object
  body: response.body  // Pass through as-is (always a ReadableStream in React Router)
}
```

### Streaming Architecture

**Important: React Router responses are ALWAYS streams by default.**

React Router returns all responses as `ReadableStream`, including simple JSON or HTML responses. This is a core architectural decision that enables:

- Consistent streaming behavior
- Zero-copy response handling
- Optimal memory efficiency
- Support for large responses

**Azure Functions Configuration Required:**

To fully support streaming, Azure Functions must be configured with HTTP streaming enabled:

```javascript
import { app } from '@azure/functions';

// Enable HTTP streaming support (required for streaming responses)
app.setup({ enableHttpStream: true });

// Then register your handlers
app.http('ssr', {
  methods: ['GET', 'POST', 'DELETE', 'HEAD', 'PATCH', 'PUT', 'OPTIONS'],
  authLevel: 'function',
  handler: createRequestHandler({
    build: () => import('./build/server/index.js'),
  }),
});
```

**Without `enableHttpStream: true`, Azure Functions will buffer responses instead of streaming them.**

Reference: [Azure Functions HTTP Streams announcement](https://techcommunity.microsoft.com/blog/appsonazureblog/azure-functions-support-for-http-streams-in-node-js-is-now-in-preview/4066575)

**The adapter's design is optimized for this:**

```javascript
// React Router ALWAYS returns ReadableStream bodies
async function toAzureResponse(response) {
  const _response = response.clone();
  return {
    body: _response.body, // ReadableStream passed directly to Azure Functions v4
    headers: Object.fromEntries(response.headers.entries()),
    status: response.status,
  };
}
```

**Why this matters:**

1. **No buffering overhead** - Streams are never consumed in the adapter
2. **Memory efficient** - Azure Functions v4 natively supports ReadableStream
3. **Universal streaming** - All responses (JSON, HTML, SSE, files) use the same path
4. **Zero additional cost** - Pass-through design adds no overhead

**All response types stream efficiently:**

- ✅ JSON responses (e.g., `json({ data: '...' })`)
- ✅ HTML responses (e.g., React components)
- ✅ Server-Sent Events (SSE) with `text/event-stream`
- ✅ Large file downloads
- ✅ Real-time data streams
- ✅ Video/audio streaming
- ✅ Chunked transfer encoding

---

## Common Patterns

### Optional Function Parameters

```javascript
// ✅ Provide both static and function patterns
const handler = createRequestHandler(
  options.build, // Can be static object or function returning Promise
  options.mode || process.env.NODE_ENV
);
```

### Handling GET vs POST Requests

```javascript
// ✅ GET and HEAD requests have no body
const init = {
  method: request.method,
  headers: request.headers,
  signal: controller.signal,
  body: isGetOrHead(request) ? null : request.body,
  duplex: isGetOrHead(request) ? undefined : 'half',
};
```

### Cloning Responses

```javascript
// ✅ Clone response before consuming body (Response can only be read once)
async function toAzureResponse(response) {
  const _response = response.clone();
  return {
    body: _response.body,
    headers: Object.fromEntries(response.headers.entries()),
    status: response.status,
  };
}
```

---

## Migration History (Remix → React Router v7)

### Version 3.0.0 Changes

The package was migrated from Remix v2 to React Router v7 in version 3.0.0.

**Import Changes:**

```javascript
// BEFORE (v2)
import { createRequestHandler } from '@remix-run/node';

// AFTER (v3)
import { createRequestHandler } from 'react-router';
```

**Type References:**

```javascript
// BEFORE (v2)
import('remix-run/node').ServerBuild;

// AFTER (v3)
import('react-router').ServerBuild;
```

**API Compatibility:**

- `createRequestHandler` signature remains the same
- `ServerBuild` type structure is identical
- `AppLoadContext` type is compatible
- Only framework dependency changed (core adapter logic unchanged)

For users upgrading from v2, see [MIGRATION.md](./MIGRATION.md).

---

## Best Practices for Contributors

### Before Making Changes

1. **Understand the Web Fetch API** - This adapter bridges Azure to Web standards
2. **Review Azure Functions v4 docs** - Understand the Azure programming model
3. **Check existing tests** - Tests document expected behavior
4. **Run type checking** - Ensure JSDoc types are correct

### When Adding Features

1. **Keep it simple** - This is a thin adapter, not a framework
2. **Maintain backward compatibility** - Don't break existing users
3. **Document with JSDoc** - All public APIs need documentation
4. **Add tests** - Cover happy path and edge cases (including streaming if applicable)
5. **Update documentation** - Show how to use the new feature in README.md
6. **Verify streaming** - Ensure changes don't break streaming response support

### When Fixing Bugs

1. **Write a failing test first** - Reproduce the bug
2. **Fix minimally** - Change only what's necessary
3. **Test thoroughly** - Verify with unit tests and type checking
4. **Document in CHANGELOG** - Explain the fix

---

## Common Pitfalls to Avoid

### ❌ Don't mutate inputs

```javascript
// ❌ Bad
function processRequest(request) {
  request.headers.set('X-Custom', 'value'); // Mutation!
  return request;
}

// ✅ Good
function processRequest(request) {
  const newHeaders = new Headers(request.headers);
  newHeaders.set('X-Custom', 'value');
  return new Request(request, { headers: newHeaders });
}
```

### ❌ Don't assume Node.js environment

```javascript
// ❌ Bad - Azure Functions might use different runtime
const filePath = path.join(__dirname, 'build');

// ✅ Good - Use Web standards
const url = new URL('./build', import.meta.url);
```

### ❌ Don't hardcode Azure specifics in framework code

```javascript
// ❌ Bad - Couples adapter to Azure
const request_ = new Request(url, {
  headers: request.headers,
  'X-Azure-Function': context.invocationId, // Azure-specific!
});

// ✅ Good - Keep Azure logic in adapter layer
const request_ = new Request(url, {
  headers: request.headers,
});
```

### ❌ Don't swallow errors silently

```javascript
// ❌ Bad
try {
  return await handler(request);
} catch (error) {
  return { status: 500, body: 'Error' };
}

// ✅ Good - Let errors propagate (framework will handle)
return await handler(request);
```

### ❌ Don't consume streams unnecessarily

**Critical:** Since React Router responses are ALWAYS streams, never consume them in the adapter.

```javascript
// ❌ WRONG - Consumes the stream and buffers in memory
async function toAzureResponse(response) {
  const body = await response.text(); // BAD: Converts stream to string!
  return {
    body,
    headers: Object.fromEntries(response.headers.entries()),
    status: response.status,
  };
}

// ❌ WRONG - Consumes the stream for JSON
async function toAzureResponse(response) {
  const body = await response.json(); // BAD: Buffers entire response!
  return {
    body: JSON.stringify(body),
    headers: Object.fromEntries(response.headers.entries()),
    status: response.status,
  };
}

// ✅ CORRECT - Pass stream through unchanged
async function toAzureResponse(response) {
  const _response = response.clone();
  return {
    body: _response.body, // GOOD: ReadableStream passed directly
    headers: Object.fromEntries(response.headers.entries()),
    status: response.status,
  };
}
```

**Why this is critical:**

- Consuming the stream defeats React Router's streaming architecture
- Buffers entire response in memory (can cause OOM for large responses)
- Adds unnecessary latency
- Azure Functions v4 natively supports ReadableStream - use it!

---

## Resources

### Documentation

- [Azure Functions v4 Node.js](https://learn.microsoft.com/en-us/azure/azure-functions/functions-reference-node)
- [Azure Functions HTTP Streaming](https://techcommunity.microsoft.com/blog/appsonazureblog/azure-functions-support-for-http-streams-in-node-js-is-now-in-preview/4066575)
- [React Router Documentation](https://reactrouter.com)
- [React Router Upgrading from Remix](https://reactrouter.com/upgrading/remix)
- [Web Fetch API](https://developer.mozilla.org/en-us/docs/Web/API/Fetch_API)

### Related Projects

- [`@react-router/cloudflare`](https://github.com/remix-run/react-router) - Cloudflare adapter
- [`@react-router/express`](https://github.com/remix-run/react-router) - Express adapter
- [`@azure/functions`](https://github.com/Azure/azure-functions-nodejs-library) - Azure Functions SDK

---

## Questions?

For AI assistants: If you encounter a scenario not covered in this document, follow these principles:

1. **Prefer Web standards** over platform-specific APIs
2. **Keep the adapter thin** - don't add framework features
3. **Maintain backward compatibility** - don't break existing users
4. **Document everything** - JSDoc is mandatory
5. **Test thoroughly** - tests are documentation

When in doubt, check the existing code patterns and tests for guidance.
