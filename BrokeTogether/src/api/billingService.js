import client from './client';

const billingService = {
  getStatus: async () => {
    const response = await client.get('/billing/status');
    return response.data;
  },
};

export default billingService;
