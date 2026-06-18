export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
  }
}

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = fetch("/api/auth/refresh", {
    method: "POST",
    credentials: "same-origin",
  }).then((r) => r.ok).catch(() => false).finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}

async function rawFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...init,
  });
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res = await rawFetch(path, init);

  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      res = await rawFetch(path, init);
    }
  }

  if (!res.ok) {
    let message = `Erreur ${res.status}`;
    let code: string | undefined;
    try {
      const body = await res.json();
      if (typeof body?.error === "string") code = body.error;
      if (typeof body?.message === "string") message = body.message;
      else if (code) message = code;
    } catch {
      message = `Erreur ${res.status}`;
    }
    throw new ApiError(res.status, message, code);
  }
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
