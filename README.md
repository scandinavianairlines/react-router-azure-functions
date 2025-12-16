# React Router Adapter for Azure Functions

[![js-standard-style](https://img.shields.io/badge/standard-javascript-fdbe15.svg?logo=javascript&logoColor=fdbe15&logoWidth=20&style=flat-square)](https://github.com/feross/standard) [![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?logo=prettier&style=flat-square)](https://github.com/prettier/prettier) [![npm](https://img.shields.io/npm/v/@scandinavianairlines/react-router-azure-functions?logo=npm&style=flat-square)](https://www.npmjs.com/package/@scandinavianairlines/react-router-azure-functions)

- [React Router Adapter for Azure Functions](#react-router-adapter-for-azure-functions)
  - [Usage](#usage)
    - [Azure Static Web Apps](#azure-static-web-apps)
    - [Azure Functions](#azure-functions)
    - [Custom usage](#custom-usage)
  - [Migrating from v2 (Remix)](#migrating-from-v2-remix)
  - [Issues](#issues)
  - [Contributing](#contributing)
  - [License](#license)

An adapter that allows Azure Functions to work as a custom server for [React Router v7][react-router]. This adapter package is designed to be used with [Azure Static Web Apps][azure-staticwebapp] and [Azure Functions][azure-functions] using the new [Node.js][nodejs] [**v4 programming model**][model].

## Usage

The package is available as an npm package and can be installed as follows:

```bash
yarn add @scandinavianairlines/react-router-azure-functions
```

Once installed, you can use the adapter in your Azure Functions as follows:

```javascript
import { app } from '@azure/functions';
import { createRequestHandler } from '@scandinavianairlines/react-router-azure-functions';

import * as build from './build/server/index.js';

app.http('ssr', {
  methods: ['GET', 'POST', 'DELETE', 'HEAD', 'PATCH', 'PUT', 'OPTIONS', 'TRACE', 'CONNECT'],
  authLevel: 'function',
  handler: createRequestHandler({ build }),
});
```

React Router v7 also supports providing the build as a function, which can be useful for dynamic imports:

```javascript
import { app } from '@azure/functions';
import { createRequestHandler } from '@scandinavianairlines/react-router-azure-functions';

app.http('ssr', {
  methods: ['GET', 'POST', 'DELETE', 'HEAD', 'PATCH', 'PUT', 'OPTIONS', 'TRACE', 'CONNECT'],
  authLevel: 'function',
  handler: createRequestHandler({
    build: () => import('./build/server/index.js'),
  }),
});
```

### Load Context

The adapter supports custom load context via the `getLoadContext` function. The load context is passed to your React Router loaders and actions.

**Note:** React Router's handler accepts either `AppLoadContext` or `RouterContextProvider` as the load context type, depending on your middleware configuration. The adapter supports both by allowing `getLoadContext` to return any type. In most scenarios without middleware, this will be `AppLoadContext`.

```javascript
import { app } from '@azure/functions';
import { createRequestHandler } from '@scandinavianairlines/react-router-azure-functions';

app.http('ssr', {
  methods: ['GET', 'POST', 'DELETE', 'HEAD', 'PATCH', 'PUT', 'OPTIONS'],
  authLevel: 'function',
  handler: createRequestHandler({
    build: () => import('./build/server/index.js'),
    getLoadContext: async (request, context) => {
      // Return your custom load context
      // This can be AppLoadContext or RouterContextProvider
      return {
        invocationId: context.invocationId,
        customData: 'example',
      };
    },
  }),
});
```

It is important to note that the _Azure Functions_ runtime will index the handler based on the `package.json` `main` property, so make sure that you have set it to the function handler file.

### Azure Static Web Apps

When using the adapter with Azure Static Web Apps, you need to make sure that you have set a rewrite route to proxy all requests to the Azure Functions. This should be defined in the `routes` property inside the `staticwebapp.config.json` file.

```json
{
  "platform": {
    "apiRuntime": "node:18"
  },
  "routes": [
    {
      "route": "/favicon.ico"
    },
    {
      "route": "/build/*"
    },
    {
      "route": "/*",
      "rewrite": "/api/ssr"
    }
  ],
  "navigationFallback": {
    "rewrite": "/api/ssr"
  },
  "trailingSlash": "never"
}
```

### Azure Functions

When using the adapter with Azure Functions, you need to make sure that you have set the `route` property in your registered HTTP trigger to `/{*path}`. This is used to know which route to render when using the adapter.

### Custom usage

The adapter supports an optional `urlParser` function that can be used to parse a `URL` instance from the incoming request. This can be useful if you are using a custom routing solution in your Azure Functions or if you would like to parse the URL from a specific header.

```javascript
import { createRequestHandler } from '@scandinavianairlines/react-router-azure-functions';

import * as build from './build/server/index.js';

const handler = createRequestHandler({
  build,
  urlParser: request => new URL(request.headers.get('x-forwarded-url')),
});
```

### Streaming Support

**Important:** React Router responses are always streams (`ReadableStream`) by default, even for simple JSON or HTML responses. The adapter passes all response streams through to Azure Functions without consuming or buffering them, ensuring optimal performance for all response types.

#### Azure Functions Configuration

To fully support streaming in Azure Functions, you **must** enable HTTP streaming in your function app:

```javascript
import { app } from '@azure/functions';

// Enable HTTP streaming support
app.setup({ enableHttpStream: true });
```

**Note:** Add this configuration before registering your HTTP handlers. Without this setting, Azure Functions may buffer responses instead of streaming them.

For more information, see the [Azure Functions HTTP Streams announcement](https://techcommunity.microsoft.com/blog/appsonazureblog/azure-functions-support-for-http-streams-in-node-js-is-now-in-preview/4066575).

This zero-overhead approach works seamlessly for:

- **Regular responses** - JSON, HTML, etc. (streamed efficiently)
- **Server-Sent Events (SSE)** - Real-time event streams
- **Large file downloads** - No memory buffering
- **Real-time data** - Live updates and streaming APIs

#### Example: Server-Sent Events

```javascript
// First, enable streaming in your Azure Functions setup
import { app } from '@azure/functions';
import { createRequestHandler } from '@scandinavianairlines/react-router-azure-functions';

app.setup({ enableHttpStream: true });

app.http('ssr', {
  methods: ['GET', 'POST', 'DELETE', 'HEAD', 'PATCH', 'PUT', 'OPTIONS'],
  authLevel: 'function',
  handler: createRequestHandler({
    build: () => import('./build/server/index.js'),
  }),
});

// Then, in your React Router routes:
// app/routes/events.tsx
export async function loader() {
  const stream = new ReadableStream({
    start(controller) {
      const interval = setInterval(() => {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ time: Date.now() })}\n\n`));
      }, 1000);

      // Clean up after 10 seconds
      setTimeout(() => {
        clearInterval(interval);
        controller.close();
      }, 10000);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
```

#### Example: Large File Streaming

```javascript
// app/routes/download.tsx
export async function loader() {
  const fileStream = await fetch('https://example.com/large-file.zip');

  return new Response(fileStream.body, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': 'attachment; filename="large-file.zip"',
    },
  });
}
```

Since all React Router responses are streams by default, the adapter's pass-through design ensures maximum efficiency without any additional overhead, regardless of response size or type.

## Migrating from v2 (Remix)

Version 3.0 updates the adapter to work with React Router v7 (the successor to Remix v2). See [MIGRATION.md](./MIGRATION.md) for detailed upgrade instructions.

**Quick summary:**

1. First, migrate your application from Remix to React Router v7 following the [official React Router upgrade guide](https://reactrouter.com/upgrading/remix)
2. Uninstall the old package: `npm uninstall @scandinavianairlines/remix-azure-functions`
3. Install the new package: `npm install @scandinavianairlines/react-router-azure-functions`
4. Update imports in your code from `@scandinavianairlines/remix-azure-functions` to `@scandinavianairlines/react-router-azure-functions`

The adapter API remains unchanged - only the framework dependency and package name have changed.

## Issues

If you encounter any non-security-related bug or unexpected behavior, please [file an issue][bug]
using the bug report template.

[bug]: https://github.com/scandinavianairlines/react-router-azure-functions/issues/new?labels=bug

## Contributing

We welcome contributions to this project. Please read our [contributing guidelines](.github/CONTRIBUTING.md).

## License

[MIT](./LICENSE).

---

Created by the [Airline Digitalization Team](mailto:airlinedigitalization@flysas.com).

![SAS](https://user-images.githubusercontent.com/850110/180438296-f79396e1-cb77-4f82-93e0-1d5bf5bea6a1.svg 'SAS')

[azure-functions]: https://learn.microsoft.com/en-us/azure/azure-functions/
[azure-staticwebapp]: https://docs.microsoft.com/en-us/azure/static-web-apps/overview
[nodejs]: https://nodejs.org
[model]: https://techcommunity.microsoft.com/t5/apps-on-azure-blog/azure-functions-node-js-v4-programming-model-is-generally/ba-p/3929217
[react-router]: https://reactrouter.com
