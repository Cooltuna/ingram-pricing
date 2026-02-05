// Frontend API client — calls our serverless proxy routes
// This is the module you'd swap/extend when integrating into your dashboard

const api = {
  // Check if the server has credentials configured
  async checkStatus() {
    const res = await fetch('/api/status');
    if (!res.ok) throw new Error('Status check failed');
    return res.json();
  },

  // Get OAuth token via server-side proxy
  async authenticate() {
    const res = await fetch('/api/auth', { method: 'POST' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Auth failed: ${res.status}`);
    }
    return res.json();
  },

  // Fetch pricing via server-side proxy
  async getPricing(accessToken, products) {
    const res = await fetch('/api/pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken, products }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Pricing failed: ${res.status}`);
    }
    return res.json();
  },
};

export default api;
