jest.mock('../client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

import client from '../client';
import billingService from '../billingService';

describe('billingService', () => {
  afterEach(() => jest.clearAllMocks());

  it('getStatus fetches the billing status', async () => {
    client.get.mockResolvedValue({ data: { plan: 'premium', active: true } });

    const result = await billingService.getStatus();

    expect(client.get).toHaveBeenCalledWith('/billing/status');
    expect(result).toEqual({ plan: 'premium', active: true });
  });
});
