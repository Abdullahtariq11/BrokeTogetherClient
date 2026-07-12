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

  it('createCheckoutSession posts with no body and returns the session data', async () => {
    client.post.mockResolvedValue({ data: { url: 'https://checkout.example.com' } });

    const result = await billingService.createCheckoutSession();

    expect(client.post).toHaveBeenCalledWith('/billing/checkout');
    expect(result).toEqual({ url: 'https://checkout.example.com' });
  });

  it('createPortalSession posts with no body and returns the session data', async () => {
    client.post.mockResolvedValue({ data: { url: 'https://portal.example.com' } });

    const result = await billingService.createPortalSession();

    expect(client.post).toHaveBeenCalledWith('/billing/portal');
    expect(result).toEqual({ url: 'https://portal.example.com' });
  });
});
