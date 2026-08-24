// src/api/expenseService.js
import client from './client';

const expenseService = {
    // Global split (original)
    createExpense: async (expenseData) => {
        const response = await client.post('/expenses', expenseData);
        return response.data;
    },

    // Selective split (legacy)
    createSelectiveExpense: async (expenseData) => {
        const response = await client.post('/expenses/selective', expenseData);
        return response.data;
    },

    // New unified endpoint — EQUAL | PERSONAL | FIXED | CUSTOM
    createSplitExpense: async (expenseData) => {
        const response = await client.post('/expenses/split', expenseData);
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
     * Fetches paginated expense history for a home.
     * @param {number} homeId
     * @param {number} page  - zero-based page index (default 0)
     * @param {number} size  - page size (default 20)
     * @returns {{ expenses, hasMore, page, lastSettledAt }}
     */
    getHomeExpenses: async (homeId, page = 0, size = 20) => {
        const response = await client.get(`/expenses/home/${homeId}/history?page=${page}&size=${size}`);
        return response.data;
    },

    /**
     * Fetches a single expense by ID.
     * @param {number} expenseId
     */
    getExpenseById: async (expenseId) => {
        const response = await client.get(`/expenses/expense/${expenseId}`);
        return response.data;
    },

    /**
     * Deletes an expense (creator/admin only).
     * @param {number} expenseId
     */
    deleteExpense: async (expenseId) => {
        const response = await client.delete(`/expenses/${expenseId}`);
        return response.data;
    },

    // Returns: { "1": 15.50, "4": -10.00 }
    getHomeBalances: async (homeId) => {
        const response = await client.get(`/expenses/home/${homeId}/balances`);
        return response.data;
    },

    /**
     * Returns simplified debt pairs for the Settle Up screen.
     * @returns {Array<{ debtorId, debtorName, creditorId, creditorName, amount }>}
     */
    getSettlements: async (homeId) => {
        const response = await client.get(`/expenses/home/${homeId}/settlements`);
        return response.data;
    },

    /**
     * Returns analytics for a home (premium only).
     */
    getAnalytics: async (homeId) => {
        const response = await client.get(`/expenses/home/${homeId}/analytics`);
        return response.data;
    },

    // Returns a Blob for file download (premium only).
    exportReport: async (homeId, format) => {
        const response = await client.get(`/expenses/home/${homeId}/export?format=${format}`, {
            responseType: 'blob',
        });
        return response.data;
    },
};

export default expenseService;