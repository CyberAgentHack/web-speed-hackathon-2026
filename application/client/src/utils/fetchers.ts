export async function fetchBinary(url: string): Promise<ArrayBuffer> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch binary: ${response.statusText}`);
    }
    return response.arrayBuffer();
}

export async function fetchJSON<T>(url: string): Promise<T> {
    const response = await fetch(url);
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw { responseJSON: errorBody };
    }
    return response.json();
}

export async function sendFile<T>(url: string, file: File): Promise<T> {
    const response = await fetch(url, {
        method: "POST",
        body: file,
        headers: {
            "Content-Type": "application/octet-stream",
        },
    });
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw { responseJSON: errorBody };
    }
    return response.json();
}

export async function sendJSON<T>(url: string, data: object): Promise<T> {
    const jsonString = JSON.stringify(data);

    const response = await fetch(url, {
        method: "POST",
        body: jsonString,
        headers: {
            "Content-Type": "application/json",
        },
    });
    if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw { responseJSON: errorBody };
    }
    return response.json();
}
