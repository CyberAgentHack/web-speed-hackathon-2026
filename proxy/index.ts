export default {
  async fetch(request) {
    const url = new URL(request.url);
    url.hostname = "pr-4-web-speed-hackathon-2026.fly.dev";
    
    const newRequest = new Request(url, request);
    newRequest.headers.set("Host", "pr-4-web-speed-hackathon-2026.fly.dev");
    
    return fetch(newRequest);
  },
};
