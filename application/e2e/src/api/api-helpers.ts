import type { APIRequestContext, APIResponse } from "@playwright/test";

const BASE = "/api/v1";

export class ApiClient {
  private request: APIRequestContext;
  constructor(request: APIRequestContext) {
    this.request = request;
  }

  // --- Auth ---
  async signup(data: { username: string; name: string; password: string }): Promise<APIResponse> {
    return this.request.post(`${BASE}/signup`, { data });
  }

  async signin(data: { username: string; password: string }): Promise<APIResponse> {
    return this.request.post(`${BASE}/signin`, { data });
  }

  async signout(): Promise<APIResponse> {
    return this.request.post(`${BASE}/signout`);
  }

  async me(): Promise<APIResponse> {
    return this.request.get(`${BASE}/me`);
  }

  // --- Posts ---
  async getPosts(params?: { limit?: number; offset?: number }): Promise<APIResponse> {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set("limit", String(params.limit));
    if (params?.offset != null) q.set("offset", String(params.offset));
    const qs = q.toString();
    return this.request.get(`${BASE}/posts${qs ? `?${qs}` : ""}`);
  }

  async getPost(postId: string): Promise<APIResponse> {
    return this.request.get(`${BASE}/posts/${postId}`);
  }

  async getComments(
    postId: string,
    params?: { limit?: number; offset?: number },
  ): Promise<APIResponse> {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set("limit", String(params.limit));
    if (params?.offset != null) q.set("offset", String(params.offset));
    const qs = q.toString();
    return this.request.get(`${BASE}/posts/${postId}/comments${qs ? `?${qs}` : ""}`);
  }

  // --- Users ---
  async getUser(username: string): Promise<APIResponse> {
    return this.request.get(`${BASE}/users/${username}`);
  }

  async getUserPosts(
    username: string,
    params?: { limit?: number; offset?: number },
  ): Promise<APIResponse> {
    const q = new URLSearchParams();
    if (params?.limit != null) q.set("limit", String(params.limit));
    if (params?.offset != null) q.set("offset", String(params.offset));
    const qs = q.toString();
    return this.request.get(`${BASE}/users/${username}/posts${qs ? `?${qs}` : ""}`);
  }

  async updateMe(data: Record<string, unknown>): Promise<APIResponse> {
    return this.request.put(`${BASE}/me`, { data });
  }

  // --- DM ---
  async getDmList(): Promise<APIResponse> {
    return this.request.get(`${BASE}/dm`);
  }

  async createDm(peerId: string): Promise<APIResponse> {
    return this.request.post(`${BASE}/dm`, { data: { peerId } });
  }

  async getDm(conversationId: string): Promise<APIResponse> {
    return this.request.get(`${BASE}/dm/${conversationId}`);
  }

  async sendDmMessage(conversationId: string, body: string): Promise<APIResponse> {
    return this.request.post(`${BASE}/dm/${conversationId}/messages`, { data: { body } });
  }

  async markDmRead(conversationId: string): Promise<APIResponse> {
    return this.request.post(`${BASE}/dm/${conversationId}/read`);
  }

  async typeDm(conversationId: string): Promise<APIResponse> {
    return this.request.post(`${BASE}/dm/${conversationId}/typing`);
  }

  // --- Search ---
  async search(q: string, params?: { limit?: number; offset?: number }): Promise<APIResponse> {
    const p = new URLSearchParams({ q });
    if (params?.limit != null) p.set("limit", String(params.limit));
    if (params?.offset != null) p.set("offset", String(params.offset));
    return this.request.get(`${BASE}/search?${p}`);
  }

  // --- Crok ---
  async getCrokSuggestions(): Promise<APIResponse> {
    return this.request.get(`${BASE}/crok/suggestions`);
  }

  // --- Initialize ---
  async initialize(): Promise<APIResponse> {
    return this.request.post(`${BASE}/initialize`);
  }
}
