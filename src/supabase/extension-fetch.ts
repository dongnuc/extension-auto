export async function extensionSupabaseFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers ?? (input instanceof Request ? input.headers : undefined));
  headers.delete('x-client-info');
  headers.delete('X-Client-Info');

  return fetch(input, {
    ...init,
    headers,
  });
}
