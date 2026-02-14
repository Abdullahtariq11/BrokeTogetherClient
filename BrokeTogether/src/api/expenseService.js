// src/api/expenseService.js
import client from './client';

const expenseService = {
    // Global split (original)
    createExpense: async (expenseData) => {
        const response = await client.post('/expenses', expenseData);
        return response.data;
    },

    // Selective split (The one you just shared!)
    createSelectiveExpense: async (expenseData) => {
        // expenseData should include: { amount, description, category, homeId, userId: [1, 2, 3] }
        const response = await client.post('/expenses/selective', expenseData);
        return response.data;
    },


    // src/api/expenseService.js
    settleDebt: async (homeId, payeeId, amount) => {
        // Matches SettlementRequest: { homeId, payeeId, amount }
        const response = await client.post('/expenses/settle', {
            homeId,
            payeeId,
            amount: parseFloat(amount)
        });
        return response.data;
    },
    /**
     * Fetches all expense history for the home list.
     */
    getHomeExpenses: async (homeId) => {
        const response = await client.get(`/expenses/home/${homeId}/history`);
        return response.data;
    },

    // Returns: { "1": 15.50, "4": -10.00 }
    getHomeBalances: async (homeId) => {
        const response = await client.get(`/expenses/home/${homeId}/balances`);
        return response.data;
    },
};

export default expenseService;