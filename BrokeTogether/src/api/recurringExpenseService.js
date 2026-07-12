import client from './client';

const recurringExpenseService = {
  getByHome: async (homeId) => {
    const response = await client.get(`/expenses/recurring/home/${homeId}`);
    return response.data;
  },

  create: async (data) => {
    // data: { homeId, description, amount, category?, frequency }
    const response = await client.post('/expenses/recurring', data);
    return response.data;
  },

  deactivate: async (id) => {
    const response = await client.delete(`/expenses/recurring/${id}`);
    return response.data;
  },
};

export default recurringExpenseService;
