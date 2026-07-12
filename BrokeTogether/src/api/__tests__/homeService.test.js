jest.mock('../client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

import client from '../client';
import homeService from '../homeService';

describe('homeService', () => {
  afterEach(() => jest.clearAllMocks());

  it('getMyHomes fetches all homes for the current user', async () => {
    client.get.mockResolvedValue({ data: [{ id: 1, name: 'Casa' }] });

    const result = await homeService.getMyHomes();

    expect(client.get).toHaveBeenCalledWith('/homes/my-homes');
    expect(result).toEqual([{ id: 1, name: 'Casa' }]);
  });

  it('createHome posts the name', async () => {
    client.post.mockResolvedValue({ data: { id: 1, name: 'Casa' } });

    const result = await homeService.createHome('Casa');

    expect(client.post).toHaveBeenCalledWith('/homes', { name: 'Casa' });
    expect(result).toEqual({ id: 1, name: 'Casa' });
  });

  it('getHomeById fetches a single home', async () => {
    client.get.mockResolvedValue({ data: { id: 42, name: 'Casa' } });

    const result = await homeService.getHomeById(42);

    expect(client.get).toHaveBeenCalledWith('/homes/42');
    expect(result).toEqual({ id: 42, name: 'Casa' });
  });

  it('joinHome posts the invite code', async () => {
    client.post.mockResolvedValue({ data: { id: 42, name: 'Casa' } });

    const result = await homeService.joinHome('ABC123');

    expect(client.post).toHaveBeenCalledWith('/homes/join', { inviteCode: 'ABC123' });
    expect(result).toEqual({ id: 42, name: 'Casa' });
  });

  it('removeMember deletes the member from the home', async () => {
    client.delete.mockResolvedValue({ data: { success: true } });

    const result = await homeService.removeMember(42, 7);

    expect(client.delete).toHaveBeenCalledWith('/homes/42/members/7');
    expect(result).toEqual({ success: true });
  });

  it('getMembers fetches members of a home', async () => {
    client.get.mockResolvedValue({ data: [{ id: 1, name: 'Jane' }] });

    const result = await homeService.getMembers(42);

    expect(client.get).toHaveBeenCalledWith('/homes/42/members');
    expect(result).toEqual([{ id: 1, name: 'Jane' }]);
  });

  it('getInviteCode fetches the invite code', async () => {
    client.get.mockResolvedValue({ data: { inviteCode: 'ABC123' } });

    const result = await homeService.getInviteCode(42);

    expect(client.get).toHaveBeenCalledWith('/homes/42/invite-code');
    expect(result).toEqual({ inviteCode: 'ABC123' });
  });

  it('renameHome puts the new name', async () => {
    client.put.mockResolvedValue({ data: { id: 42, name: 'New Name' } });

    const result = await homeService.renameHome(42, 'New Name');

    expect(client.put).toHaveBeenCalledWith('/homes/42', { name: 'New Name' });
    expect(result).toEqual({ id: 42, name: 'New Name' });
  });

  it('leaveHome deletes the membership', async () => {
    client.delete.mockResolvedValue({ data: { success: true } });

    const result = await homeService.leaveHome(42);

    expect(client.delete).toHaveBeenCalledWith('/homes/42/leave');
    expect(result).toEqual({ success: true });
  });

  it('regenerateInviteCode posts to the inviteCode endpoint', async () => {
    client.post.mockResolvedValue({ data: { inviteCode: 'XYZ789' } });

    const result = await homeService.regenerateInviteCode(42);

    expect(client.post).toHaveBeenCalledWith('/homes/inviteCode/42');
    expect(result).toEqual({ inviteCode: 'XYZ789' });
  });
});
