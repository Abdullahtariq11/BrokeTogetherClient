import client from './client';

const expenseService = {
  // Get all balances/expenses for a specific home
  getHomeBalances: async (homeId) => {
    const response = await client.get(`/expenses/home/${homeId}/balances`);
    return response.data; // Returns Array<ExpenseResponse>
  },

  // Create a standard expense (split equally)
  createExpense: async (expenseData) => {
    // expenseData: { amount, description, category, homeId }
    const response = await client.post('/expenses', expenseData);
    return response.data;
  }
};

export default expenseService;