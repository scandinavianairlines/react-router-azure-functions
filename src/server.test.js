import { HttpRequest } from '@azure/functions';
import { createRequestHandler as createReactRouterRequestHandler } from 'react-router';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { createRequestHandler } from './server.js';

vi.mock('react-router', () => ({
  createRequestHandler: vi.fn(),
}));

describe('server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('return a Azure function handler', () => {
    const handler = createRequestHandler({ build: {} });

    expect(handler).toBeInstanceOf(Function);
  });

  test('return a Azure function response init object', async () => {
    const mockHandler = vi.fn().mockResolvedValue(new Response());
    const mockHttpRequest = new HttpRequest({
      method: 'GET',
      headers: { 'x-forwarded-host': 'test.com' },
      params: undefined,
      url: 'https://test.com',
    });
    createReactRouterRequestHandler.mockReturnValue(mockHandler);
    const handler = createRequestHandler({
      build: {},
    });
    const response = await handler(mockHttpRequest, {});

    expect(createReactRouterRequestHandler).toHaveBeenCalled();
    expect(mockHandler).toHaveBeenCalledWith(expect.any(Request), undefined);
    expect(response).toEqual(
      expect.objectContaining({
        body: null,
        headers: expect.any(Object),
        status: expect.any(Number),
      })
    );
  });

  test('return a Azure function response init object with body', async () => {
    const mockHandler = vi.fn().mockResolvedValue(new Response('body'));
    const mockHttpRequest = new HttpRequest({
      method: 'HEAD',
      headers: { 'x-forwarded-host': 'test.com' },
      params: undefined,
      url: 'https://test.com',
    });
    createReactRouterRequestHandler.mockReturnValue(mockHandler);
    const handler = createRequestHandler({
      build: {},
    });
    const response = await handler(mockHttpRequest, {});

    expect(createReactRouterRequestHandler).toHaveBeenCalled();
    expect(mockHandler).toHaveBeenCalledWith(expect.any(Request), undefined);
    expect(response).toEqual(
      expect.objectContaining({
        body: expect.any(ReadableStream),
        headers: {
          'content-type': 'text/plain;charset=UTF-8',
        },
        status: expect.any(Number),
      })
    );
  });

  test('transform a binary type to string body response', async () => {
    const mockHandler = vi
      .fn()
      .mockResolvedValue(new Response(new ReadableStream(), { headers: { 'Content-Type': 'image/png' } }));
    const mockHttpRequest = new HttpRequest({
      method: 'GET',
      headers: { 'x-forwarded-host': 'test.com' },
      params: undefined,
      url: 'https://test.com',
    });
    createReactRouterRequestHandler.mockReturnValue(mockHandler);
    const handler = createRequestHandler({
      build: {},
    });
    const response = await handler(mockHttpRequest, {});

    expect(createReactRouterRequestHandler).toHaveBeenCalled();
    expect(mockHandler).toHaveBeenCalledWith(expect.any(Request), undefined);
    expect(response).toEqual(
      expect.objectContaining({
        body: expect.any(ReadableStream),
        headers: {
          'content-type': 'image/png',
        },
        status: expect.any(Number),
      })
    );
  });

  test('calls the given getLoadContext function', async () => {
    const mockHandler = vi.fn().mockResolvedValue(new Response());
    const mockHttpRequest = new HttpRequest({
      method: 'GET',
      headers: { 'x-forwarded-host': 'test.com' },
      params: undefined,
      url: 'https://test.com',
    });
    const mockGetLoadContext = vi.fn().mockResolvedValue({});
    const mockAzureContext = { log: vi.fn() };
    createReactRouterRequestHandler.mockReturnValue(mockHandler);
    const handler = createRequestHandler({
      build: {},
      getLoadContext: mockGetLoadContext,
    });

    await handler(mockHttpRequest, mockAzureContext);

    expect(mockGetLoadContext).toHaveBeenCalledWith(expect.any(Request), mockAzureContext);
  });

  test('calls the given urlParser function', async () => {
    const mockHandler = vi.fn().mockResolvedValue(new Response());
    const mockHttpRequest = new HttpRequest({
      method: 'GET',
      headers: { 'x-forwarded-host': 'test.com' },
      params: undefined,
      url: 'https://test.com',
    });
    const mockUrlParser = vi.fn().mockReturnValue(new URL('https://test.com'));
    createReactRouterRequestHandler.mockReturnValue(mockHandler);
    const handler = createRequestHandler({
      build: {},
      urlParser: mockUrlParser,
    });

    await handler(mockHttpRequest, {});

    expect(mockUrlParser).toHaveBeenCalledWith(mockHttpRequest);
  });

  test('parses the host from the `host` header', async () => {
    const mockHandler = vi.fn().mockResolvedValue(new Response());
    const mockHttpRequest = new HttpRequest({
      method: 'GET',
      headers: { host: 'test-host.com' },
      params: undefined,
      url: 'https://test.com',
    });

    createReactRouterRequestHandler.mockReturnValue(mockHandler);
    const handler = createRequestHandler({
      build: {},
    });

    await handler(mockHttpRequest, {});

    expect(mockHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://test-host.com/',
      }),
      undefined
    );
  });

  test('parses the original url from the `x-ms-original-url` header', async () => {
    const mockHandler = vi.fn().mockResolvedValue(new Response());
    const mockHttpRequest = new HttpRequest({
      method: 'GET',
      headers: { host: 'test.com', 'x-ms-original-url': '/route-1' },
      params: undefined,
      url: 'https://test.com',
    });

    createReactRouterRequestHandler.mockReturnValue(mockHandler);
    const handler = createRequestHandler({
      build: {},
    });

    await handler(mockHttpRequest, {});

    expect(mockHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://test.com/route-1',
      }),
      undefined
    );
  });

  test('parses the original url from the `x-original-url` header', async () => {
    const mockHandler = vi.fn().mockResolvedValue(new Response());
    const mockHttpRequest = new HttpRequest({
      method: 'GET',
      headers: { host: 'test.com', 'x-original-url': '/route-1' },
      params: undefined,
      url: 'https://test.com',
    });

    createReactRouterRequestHandler.mockReturnValue(mockHandler);
    const handler = createRequestHandler({
      build: {},
    });

    await handler(mockHttpRequest, {});

    expect(mockHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://test.com/route-1',
      }),
      undefined
    );
  });

  test('parses the original url from the path parameter', async () => {
    const mockHandler = vi.fn().mockResolvedValue(new Response());
    const mockHttpRequest = new HttpRequest({
      method: 'GET',
      headers: { host: 'test-path.com' },
      params: { path: '/route-1' },
      url: 'https://test.com',
    });

    createReactRouterRequestHandler.mockReturnValue(mockHandler);
    const handler = createRequestHandler({
      build: {},
    });

    await handler(mockHttpRequest, {});

    expect(mockHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://test-path.com/route-1',
      }),
      undefined
    );
  });

  test('parses the request protocal from the `x-forwarded-proto` header', async () => {
    const mockHandler = vi.fn().mockResolvedValue(new Response());
    const mockHttpRequest = new HttpRequest({
      method: 'GET',
      headers: { host: 'test-forwarded.com', 'x-forwarded-proto': 'http' },
      params: undefined,
      url: 'https://test-forwarded.com',
    });

    createReactRouterRequestHandler.mockReturnValue(mockHandler);
    const handler = createRequestHandler({
      build: {},
    });

    await handler(mockHttpRequest, {});

    expect(mockHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'http://test-forwarded.com/',
      }),
      undefined
    );
  });

  test('body should be `null` when incoming request is a GET or HEAD', async () => {
    const mockHandler = vi.fn().mockResolvedValue(new Response());
    const mockHttpRequest = new HttpRequest({
      method: 'GET',
      headers: { host: 'test.com' },
      params: undefined,
      url: 'https://test.com',
    });

    createReactRouterRequestHandler.mockReturnValue(mockHandler);
    const handler = createRequestHandler({
      build: {},
    });

    await handler(mockHttpRequest, {});

    expect(mockHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        body: null,
      }),
      undefined
    );
  });

  test('body should not be null when incoming request is not a GET or HEAD', async () => {
    const mockHandler = vi.fn().mockResolvedValue(new Response('incoming-body'));
    const mockHttpRequest = new HttpRequest({
      body: { string: 'incoming-body' },
      method: 'POST',
      headers: { host: 'test.com' },
      params: undefined,
      url: 'https://test.com',
    });

    createReactRouterRequestHandler.mockReturnValue(mockHandler);
    const handler = createRequestHandler({
      build: {},
    });

    const response = await handler(mockHttpRequest, {});
    expect(response.body).toBeInstanceOf(ReadableStream);

    expect(mockHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.any(Object),
      }),
      undefined
    );
  });

  test('accepts build as a function', async () => {
    const mockBuild = { routes: {} };
    const buildFn = vi.fn().mockResolvedValue(mockBuild);
    const mockHandler = vi.fn().mockResolvedValue(new Response());

    createReactRouterRequestHandler.mockReturnValue(mockHandler);

    const handler = createRequestHandler({
      build: buildFn,
    });

    const mockHttpRequest = new HttpRequest({
      method: 'GET',
      headers: { 'x-forwarded-host': 'test.com' },
      params: undefined,
      url: 'https://test.com',
    });

    await handler(mockHttpRequest, {});

    expect(createReactRouterRequestHandler).toHaveBeenCalledWith(buildFn, expect.any(String));
  });

  test('supports streaming responses with ReadableStream', async () => {
    const streamContent = 'streaming data chunk';
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(streamContent));
        controller.close();
      },
    });

    const mockHandler = vi.fn().mockResolvedValue(
      new Response(stream, {
        headers: { 'Content-Type': 'text/plain' },
      })
    );

    const mockHttpRequest = new HttpRequest({
      method: 'GET',
      headers: { 'x-forwarded-host': 'test.com' },
      params: undefined,
      url: 'https://test.com',
    });

    createReactRouterRequestHandler.mockReturnValue(mockHandler);
    const handler = createRequestHandler({
      build: {},
    });

    const response = await handler(mockHttpRequest, {});

    expect(response.body).toBeInstanceOf(ReadableStream);
    expect(response.headers).toEqual({ 'content-type': 'text/plain' });
    expect(response.status).toBe(200);

    // Verify stream is readable (not consumed)
    const reader = response.body.getReader();
    const { done, value } = await reader.read();
    expect(done).toBe(false);
    expect(new TextDecoder().decode(value)).toBe(streamContent);
  });

  test('supports large streaming responses without buffering', async () => {
    const chunks = ['chunk1', 'chunk2', 'chunk3'];
    const stream = new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(new TextEncoder().encode(chunk));
        }
        controller.close();
      },
    });

    const mockHandler = vi.fn().mockResolvedValue(
      new Response(stream, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
      })
    );

    const mockHttpRequest = new HttpRequest({
      method: 'GET',
      headers: { 'x-forwarded-host': 'test.com' },
      params: undefined,
      url: 'https://test.com/events',
    });

    createReactRouterRequestHandler.mockReturnValue(mockHandler);
    const handler = createRequestHandler({
      build: {},
    });

    const response = await handler(mockHttpRequest, {});

    expect(response.body).toBeInstanceOf(ReadableStream);
    expect(response.headers['content-type']).toBe('text/event-stream');

    // Verify all chunks are streamable
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const receivedChunks = [];

    let result = await reader.read();
    while (!result.done) {
      receivedChunks.push(decoder.decode(result.value));
      result = await reader.read();
    }

    expect(receivedChunks).toEqual(chunks);
  });

  test('preserves streaming headers for Server-Sent Events', async () => {
    const sseStream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: hello\n\n'));
        controller.close();
      },
    });

    const mockHandler = vi.fn().mockResolvedValue(
      new Response(sseStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    );

    const mockHttpRequest = new HttpRequest({
      method: 'GET',
      headers: { 'x-forwarded-host': 'test.com' },
      params: undefined,
      url: 'https://test.com/sse',
    });

    createReactRouterRequestHandler.mockReturnValue(mockHandler);
    const handler = createRequestHandler({
      build: {},
    });

    const response = await handler(mockHttpRequest, {});

    expect(response.body).toBeInstanceOf(ReadableStream);
    expect(response.headers).toEqual({
      'cache-control': 'no-cache',
      connection: 'keep-alive',
      'content-type': 'text/event-stream',
    });
    expect(response.status).toBe(200);
  });
});
