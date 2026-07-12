jest.mock('../client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

import client from '../client';
import recurringExpenseService from '../recurringExpenseService';

describe('recurringExpenseService', () => {
  afterEach(() => jest.clearAllMocks());

  it('getByHome fetches recurring expenses for a home', async () => {
    client.get.mockResolvedValue({ data: [{ id: 1, description: 'Rent' }] });

    const result = await recurringExpenseService.getByHome(42);

    expect(client.get).toHaveBeenCalledWith('/expenses/recurring/home/42');
    expect(result).toEqual([{ id: 1, description: 'Rent' }]);
  });

  it('create posts the recurring expense data as-is', async () => {
    client.post.mockResolvedValue({ data: { id: 2 } });
    const data = {
      homeId: 42,
      description: 'Rent',
      amount: 1200,
      category: 'Housing',
      frequency: 'MONTHLY',
    };

    const result = await recurringExpenseService.create(data);

    expect(client.post).toHaveBeenCalledWith('/expenses/recurring', data);
    expect(result).toEqual({ id: 2 });
  });

  it('deactivate deletes the recurring expense by id', async () => {
    client.delete.mockResolvedValue({ data: { success: true } });

    const result = await recurringExpenseService.deactivate(2);

    expect(client.delete).toHaveBeenCalledWith('/expenses/recurring/2');
    expect(result).toEqual({ success: true });
  });
});
