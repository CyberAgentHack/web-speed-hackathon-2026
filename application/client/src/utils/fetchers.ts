export class RequestFailError extends Error {
  public readonly status: number;
  public readonly json: object | undefined;

  constructor(response: Response, json: object | undefined) {
    super(`HTTP Error: ${response.status} (${response.statusText}) for ${response.url}`);

    this.status = response.status;
    this.json = json;
  }
}

export async function fetchBinary(url: string): Promise<ArrayBuffer> {
  const fetched = await fetch(url, {
    method: "GET",
  });
  const result = await fetched.bytes();

  if(!fetched.ok) {
    throw new RequestFailError(fetched, undefined);
  }

  return result.buffer;
}

export async function fetchJSON<T>(
  url: string,
  query: Record<string, string | number | undefined> = {},
  signal?: AbortSignal
): Promise<T> {
  // const result = await $.ajax({
  //   async: false,
  //   dataType: "json",
  //   method: "GET",
  //   url,
  // });

  const queryText =  new URLSearchParams( Object.entries(query)
      .filter((obj): obj is [string, string | number] => obj[1] !== undefined)
      .map(([k, v]) => [k, v.toString()])
  );

  const fetched = await fetch(`${url}?${queryText}`, {
    method: "GET",
    signal,
  });
  const result = await fetched.json();

  if(!fetched.ok) {
    console.error(fetched.status, result);
    throw new RequestFailError(fetched, result);
  }

  console.log(url, result);

  return result;
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
  const fetched = await fetch(url, {
    headers: {
      "Content-Type": "application/octet-stream",
    },
    method: "POST",
    body: file,
  });

  const result = await fetched.json();

  console.log("POST", url, fetched.status, result);

  if(!fetched.ok) {
    console.error(fetched.status, result);
    throw new RequestFailError(fetched, result);
  }

  return result;
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
  const fetched = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(data),
  });

  const result = await fetched.json();

  if(!fetched.ok) {
    console.error(fetched.status, result);
    throw new RequestFailError(fetched, result);
  }

  console.log(url, result);

  return result;
}
