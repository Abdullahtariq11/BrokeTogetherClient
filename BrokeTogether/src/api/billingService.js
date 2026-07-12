import client from './client';

const billingService = {
  getStatus: async () => {
    const response = await client.get('/billing/status');
    return response.data;
  },

  createCheckoutSession: async () => {
    const response = await client.post('/billing/checkout');
    return response.data;
  },

  createPortalSession: async () => {
    const response = await client.post('/billing/portal');
    return response.data;
  },
};

export default billingService;
