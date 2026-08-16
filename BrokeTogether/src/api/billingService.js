import client from './client';

const billingService = {
  getStatus: async () => {
    const response = await client.get('/billing/status');
    return response.data;
  },

  getPortalUrl: async () => {
    const response = await client.post('/billing/portal');
    return response.data; // returns the Stripe portal URL string
  },
};

export default billingService;
