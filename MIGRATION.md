# Migration Guide: From Remix to React Router

This guide will help you migrate from `@scandinavianairlines/remix-azure-functions` v2.x (Remix) to `@scandinavianairlines/react-router-azure-functions` v3.x (React Router v7).

## Overview

React Router v7 is the successor to Remix v2. The frameworks have merged, with React Router becoming the unified solution. This adapter has been updated to support React Router v7 while maintaining API compatibility with minimal breaking changes.

## Prerequisites

Before migrating this adapter, you should first migrate your application from Remix to React Router v7. Follow the [official React Router upgrade guide](https://reactrouter.com/upgrading/remix) to complete your application migration.

## Migration Steps

### 1. Update Dependencies

Uninstall the old package:

```bash
npm uninstall @scandinavianairlines/remix-azure-functions
```

Install the new package:

```bash
npm install @scandinavianairlines/react-router-azure-functions
```

Or with yarn:

```bash
yarn remove @scandinavianairlines/remix-azure-functions
yarn add @scandinavianairlines/react-router-azure-functions
```

### 2. Update Import Statements

Update your imports from the old package name to the new one:

**Before (v2.x - Remix):**

```javascript
import { createRequestHandler } from '@scandinavianairlines/remix-azure-functions';
```

**After (v3.x - React Router):**

```javascript
import { createRequestHandler } from '@scandinavianairlines/react-router-azure-functions';
```

### 3. Update Your Azure Function Handler

The API remains the same, but you'll be pointing to your React Router build instead of your Remix build.

**Before (v2.x - Remix):**

```javascript
import { app } from '@azure/functions';
import { createRequestHandler } from '@scandinavianairlines/remix-azure-functions';

import * as build from './build/server/index.js';

app.http('ssr', {
  methods: ['GET', 'POST', 'DELETE', 'HEAD', 'PATCH', 'PUT', 'OPTIONS'],
  authLevel: 'function',
  handler: createRequestHandler({ build }),
});
```

**After (v3.x - React Router):**

```javascript
import { app } from '@azure/functions';
import { createRequestHandler } from '@scandinavianairlines/react-router-azure-functions';

import * as build from './build/server/index.js';

app.http('ssr', {
  methods: ['GET', 'POST', 'DELETE', 'HEAD', 'PATCH', 'PUT', 'OPTIONS'],
  authLevel: 'function',
  handler: createRequestHandler({ build }),
});
```

### 4. Update Load Context (if used)

The load context functionality remains the same, with improved TypeScript types for React Router's middleware support.

**Before (v2.x - Remix):**

```javascript
app.http('ssr', {
  methods: ['GET', 'POST', 'DELETE', 'HEAD', 'PATCH', 'PUT', 'OPTIONS'],
  authLevel: 'function',
  handler: createRequestHandler({
    build: () => import('./build/server/index.js'),
    getLoadContext: async (request, context) => {
      return {
        invocationId: context.invocationId,
        // Your custom context
      };
    },
  }),
});
```

**After (v3.x - React Router):**

```javascript
app.http('ssr', {
  methods: ['GET', 'POST', 'DELETE', 'HEAD', 'PATCH', 'PUT', 'OPTIONS'],
  authLevel: 'function',
  handler: createRequestHandler({
    build: () => import('./build/server/index.js'),
    getLoadContext: async (request, context) => {
      return {
        invocationId: context.invocationId,
        // Your custom context
      };
    },
  }),
});
```

## What's Changed

### Package Changes

- **Package name**: `@scandinavianairlines/remix-azure-functions` → `@scandinavianairlines/react-router-azure-functions`
- **Peer dependency**: `@remix-run/node` → `react-router`
- **Framework**: Remix v2 → React Router v7

### What Stayed the Same

The adapter API is **100% compatible**. The following features work exactly as before:

- ✅ `createRequestHandler` function signature
- ✅ `build` option (static or dynamic import)
- ✅ `getLoadContext` option
- ✅ `urlParser` option
- ✅ `mode` option
- ✅ Streaming support (SSE, large files, etc.)
- ✅ Azure Static Web Apps configuration
- ✅ Azure Functions v4 support

### Enhanced Features

- **Better TypeScript types**: Load context now supports both `AppLoadContext` and `RouterContextProvider` types for React Router's middleware system
- **Performance**: React Router v7 brings improved performance and bundle size optimizations
- **Future-proof**: React Router is the actively maintained successor to Remix

## Configuration Files

No changes are needed to your Azure Functions or Azure Static Web Apps configuration files. Your existing `staticwebapp.config.json` and function configurations will continue to work.

## Troubleshooting

### Build Path Issues

Make sure your React Router build output matches the import path in your handler. The default React Router v7 build output is `./build/server/index.js`, but verify this matches your configuration.

### TypeScript Errors

If you encounter TypeScript errors related to load context, ensure you've updated your React Router types:

```bash
npm install --save-dev react-router@latest @types/react@latest
```

### Streaming Not Working

Ensure you have enabled HTTP streaming in your Azure Functions setup:

```javascript
import { app } from '@azure/functions';

app.setup({ enableHttpStream: true });
```

## Need Help?

- **React Router Documentation**: [https://reactrouter.com](https://reactrouter.com)
- **React Router Upgrade Guide**: [https://reactrouter.com/upgrading/remix](https://reactrouter.com/upgrading/remix)
- **Report Issues**: [https://github.com/scandinavianairlines/react-router-azure-functions/issues](https://github.com/scandinavianairlines/react-router-azure-functions/issues)

## Summary

The migration from Remix to React Router with this adapter is straightforward:

1. Migrate your app to React Router v7 first
2. Update the package name
3. Update import statements
4. Everything else stays the same!

The adapter maintains full backward compatibility with your existing Azure Functions setup while leveraging the improved React Router v7 framework.
