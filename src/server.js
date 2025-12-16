import { createRequestHandler as createReactRouterRequestHandler } from 'react-router';

/**
 * @typedef {(request: Request, context: import('@azure/functions').InvocationContext) => Promise<import('react-router').UNSAFE_MiddlewareEnabled extends true ? import('react-router').RouterContextProvider : import('react-router').AppLoadContext>} GetLoadContextFn
 */
/**
 * Checks if the incoming request is a GET or HEAD request.
 * @param {import('@azure/functions').HttpRequest} request Azure HTTP request.
 * @returns {boolean} `true` if the request is a GET or HEAD request. Otherwise, `false`.
 */
const isGetOrHead = request => request.method === 'GET' || request.method === 'HEAD';

/**
 * Parses the incoming request to a URL object.
 * @param {import('@azure/functions').HttpRequest} request Azure HTTP request.
 * @returns {URL} An instance of `URL`.
 */
function urlParser(request) {
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const originalUrl =
    request.headers.get('x-ms-original-url') || request.headers.get('x-original-url') || request.params.path || '/';
  const protocol = request.headers.get('x-forwarded-proto') || 'https';

  return new URL(originalUrl, `${protocol}://${host}`);
}

/**
 * Creates a response object compatible with Azure Function.
 * This function passes the stream through to Azure Functions without consuming or buffering, enabling
 * efficient handling of all response types, including large files and streaming data.
 * The response is cloned to preserve the original stream for Azure Functions v4, which
 * natively supports ReadableStream bodies.
 * @param {Response} response A React Router `Response` to the incoming request (always contains a ReadableStream body).
 * @returns {Promise<import('@azure/functions').HttpResponseInit>} A Azure function `response init` object.
 */
async function toAzureResponse(response) {
  const _response = response.clone();
  return {
    body: _response.body,
    headers: Object.fromEntries(response.headers.entries()),
    status: response.status,
  };
}

/**
 * Creates a new instance of React Router `Request` based on the incoming Azure HTTP request object.
 * @param {import('@azure/functions').HttpRequest} request Azure HTTP request object.
 * @param {object} [options] The options object.
 * @param {typeof urlParser} [options.urlParser] Function to parse the incoming request to a URL object.
 * @returns {Request} An instance of React Router `Request`.
 */
function createRemixRequest(request, options = {}) {
  const url = options.urlParser?.(request) || urlParser(request);
  // Note: No current way to abort these for Azure, but our router expects
  // requests to contain a signal so it can detect aborted requests
  const controller = new AbortController();

  /** @type {RequestInit} */
  const init = {
    method: request.method,
    headers: request.headers,
    signal: controller.signal,
    // eslint-disable-next-line unicorn/no-null -- Request init expects a `null` value.
    body: isGetOrHead(request) ? null : request.body,
    duplex: isGetOrHead(request) ? undefined : 'half',
  };

  return new Request(url.href, init);
}

/**
 * Returns a request handler for Azure Function that serves the response using React Router.
 * @param {object} options The options object.
 * @param {import('react-router').ServerBuild | (() => Promise<import('react-router').ServerBuild>)} options.build The React Router server build (or a function that returns it).
 * @param {GetLoadContextFn} [options.getLoadContext] A function that returns the React Router load context (AppLoadContext or RouterContextProvider).
 * @param {(request: import('@azure/functions').HttpRequest) => URL} [options.urlParser] A function that parses the incoming request to a URL object.
 * @param {string} [options.mode] The mode of the React Router server build. Defaults to `process.env.NODE_ENV`.
 * @returns {import('@azure/functions').HttpHandler} A Azure function handler.
 */
export function createRequestHandler(options) {
  const handler = createReactRouterRequestHandler(options.build, options.mode || process.env.NODE_ENV);

  /**
   * The main function handler for Azure Functions.
   * Creates the React Router load context, transform the incoming request to a React Router `Request` object and
   * generates a React Router `Response` object based on the incoming request. Finally, it transforms the
   * React Router `Response` object to a Azure function `response` object.
   * @param {import('@azure/functions').HttpRequest} request Azure HTTP request.
   * @param {import('@azure/functions').InvocationContext} context Azure function invocation context.
   * @returns {Promise<import('@azure/functions').HttpResponseInit>} A Azure Function `http response init` object.
   */
  async function functionHandler(request, context) {
    const remixRequest = createRemixRequest(request, { urlParser: options.urlParser });
    const loadContext = await options.getLoadContext?.(remixRequest, context);
    const remixResponse = await handler(remixRequest, loadContext);

    return toAzureResponse(remixResponse);
  }

  return functionHandler;
}
