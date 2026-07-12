jest.mock('../client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

import client from '../client';
import expenseService from '../expenseService';

describe('expenseService', () => {
  afterEach(() => jest.clearAllMocks());

  it('createExpense posts the expense data as-is', async () => {
    client.post.mockResolvedValue({ data: { id: 1 } });
    const expenseData = { amount: 10, description: 'Pizza', homeId: 42 };

    const result = await expenseService.createExpense(expenseData);

    expect(client.post).toHaveBeenCalledWith('/expenses', expenseData);
    expect(result).toEqual({ id: 1 });
  });

  it('createSelectiveExpense posts to the selective endpoint', async () => {
    client.post.mockResolvedValue({ data: { id: 2 } });
    const expenseData = { amount: 20, description: 'Snacks', homeId: 42, userId: [1, 2, 3] };

    const result = await expenseService.createSelectiveExpense(expenseData);

    expect(client.post).toHaveBeenCalledWith('/expenses/selective', expenseData);
    expect(result).toEqual({ id: 2 });
  });

  it('settleDebt parses the amount to a float and posts the settlement', async () => {
    client.post.mockResolvedValue({ data: { settled: true } });

    await expenseService.settleDebt(42, 7, '15.75');

    expect(client.post).toHaveBeenCalledWith('/expenses/settle', {
      homeId: 42,
      payeeId: 7,
      amount: 15.75,
    });
  });

  it('getHomeExpenses defaults to page 0 and size 20', async () => {
    client.get.mockResolvedValue({ data: { expenses: [], hasMore: false, page: 0 } });

    const result = await expenseService.getHomeExpenses(42);

    expect(client.get).toHaveBeenCalledWith('/expenses/home/42/history?page=0&size=20');
    expect(result).toEqual({ expenses: [], hasMore: false, page: 0 });
  });

  it('getHomeExpenses uses a custom page and size when provided', async () => {
    client.get.mockResolvedValue({ data: { expenses: [{ id: 1 }], hasMore: true, page: 2 } });

    await expenseService.getHomeExpenses(42, 2, 10);

    expect(client.get).toHaveBeenCalledWith('/expenses/home/42/history?page=2&size=10');
  });

  it('getExpenseById fetches a single expense', async () => {
    client.get.mockResolvedValue({ data: { id: 5, amount: 12.5 } });

    const result = await expenseService.getExpenseById(5);

    expect(client.get).toHaveBeenCalledWith('/expenses/expense/5');
    expect(result).toEqual({ id: 5, amount: 12.5 });
  });

  it('deleteExpense deletes by id and returns the data', async () => {
    client.delete.mockResolvedValue({ data: { success: true } });

    const result = await expenseService.deleteExpense(5);

    expect(client.delete).toHaveBeenCalledWith('/expenses/5');
    expect(result).toEqual({ success: true });
  });

  it('getHomeBalances fetches the balances map', async () => {
    client.get.mockResolvedValue({ data: { '1': 15.5, '4': -10 } });

    const result = await expenseService.getHomeBalances(42);

    expect(client.get).toHaveBeenCalledWith('/expenses/home/42/balances');
    expect(result).toEqual({ '1': 15.5, '4': -10 });
  });

  it('getSettlements fetches simplified debt pairs', async () => {
    client.get.mockResolvedValue({ data: [{ debtorId: 1, creditorId: 2, amount: 5 }] });

    const result = await expenseService.getSettlements(42);

    expect(client.get).toHaveBeenCalledWith('/expenses/home/42/settlements');
    expect(result).toEqual([{ debtorId: 1, creditorId: 2, amount: 5 }]);
  });

  it('getAnalytics fetches analytics for a home', async () => {
    client.get.mockResolvedValue({ data: { totalSpent: 100 } });

    const result = await expenseService.getAnalytics(42);

    expect(client.get).toHaveBeenCalledWith('/expenses/home/42/analytics');
    expect(result).toEqual({ totalSpent: 100 });
  });

  it('exportReport requests a blob with the given format as a query param', async () => {
    const blob = { size: 123, type: 'application/pdf' };
    client.get.mockResolvedValue({ data: blob });

    const result = await expenseService.exportReport(42, 'pdf');

    expect(client.get).toHaveBeenCalledWith('/expenses/home/42/export?format=pdf', {
      responseType: 'blob',
    });
    expect(result).toBe(blob);
  });
});
