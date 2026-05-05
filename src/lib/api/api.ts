

const API_URL = process.env.NEXT_PUBLIC_API_URL as string;

export function getApiUrl() {
  return API_URL;
}

interface FetchOptions extends RequestInit {
  token?: string;

  cache?: "force-cache" | "no-store";

  next?: {
    revalidate?: false | 0 | number;
    tags?: string[];
  };
}

export async function apiClient<T>(
  endpoint: string,
  options: FetchOptions = {}
): Promise<T> {
  const fetchOptions  = options;

  const headers: Record<string, string> = {
    ...(fetchOptions.headers as Record<string, string>),
  };

  const token = process.env.NEXT_PUBLIC_TOKEN_ as string;

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  if (!(fetchOptions.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch("https://citgisnext.sitbus.com.br:9998/citgis-service-bhz/citgis/linha/findByFilterValid", {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({
      error: "Erro HTTP: " + response.status,
    }));
    throw new Error(error.error || "Erro requisição");
  }

  return response.json();
}
