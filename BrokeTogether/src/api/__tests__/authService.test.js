jest.mock('../client', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
}));

import client from '../client';
import authService from '../authService';

describe('authService', () => {
  afterEach(() => jest.clearAllMocks());

  describe('login', () => {
    it('posts username/password to auth/login and returns the data', async () => {
      client.post.mockResolvedValue({ data: { token: 'abc', user: { id: 1 } } });

      const result = await authService.login('user@example.com', 'secret');

      expect(client.post).toHaveBeenCalledWith('auth/login', {
        username: 'user@example.com',
        password: 'secret',
      });
      expect(result).toEqual({ token: 'abc', user: { id: 1 } });
    });

    it('throws a locked error with the server message when status is 423', async () => {
      client.post.mockRejectedValue({
        response: { status: 423, data: 'Too many attempts, try later.' },
      });

      let caught;
      try {
        await authService.login('user@example.com', 'secret');
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(Error);
      expect(caught.message).toBe('Too many attempts, try later.');
      expect(caught.isLocked).toBe(true);
    });

    it('falls back to a default message when locked without server data', async () => {
      client.post.mockRejectedValue({ response: { status: 423 } });

      let caught;
      try {
        await authService.login('user@example.com', 'secret');
      } catch (error) {
        caught = error;
      }

      expect(caught.message).toBe('Account temporarily locked.');
      expect(caught.isLocked).toBe(true);
    });

    it.each([400, 401, 403])('throws a generic credentials string for status %d', async (status) => {
      client.post.mockRejectedValue({ response: { status } });

      let caught;
      try {
        await authService.login('user@example.com', 'wrong');
      } catch (error) {
        caught = error;
      }

      expect(caught).toBe(
        'No account found with these credentials. Please check your email and password or create a new account.'
      );
    });

    it('throws the server message for other error statuses', async () => {
      client.post.mockRejectedValue({
        response: { status: 500, data: { message: 'Server exploded' } },
      });

      await expect(authService.login('user@example.com', 'secret')).rejects.toBe(
        'Server exploded'
      );
    });

    it('falls back to a default message when no server message is present', async () => {
      client.post.mockRejectedValue({ response: { status: 500 } });

      await expect(authService.login('user@example.com', 'secret')).rejects.toBe(
        'Login failed. Please check your credentials.'
      );
    });
  });

  describe('register', () => {
    it('posts name/username/password to auth/register and returns the data', async () => {
      client.post.mockResolvedValue({ data: { token: 'xyz' } });

      const result = await authService.register('user@example.com', 'Jane Doe', 'secret');

      expect(client.post).toHaveBeenCalledWith('auth/register', {
        name: 'Jane Doe',
        username: 'user@example.com',
        password: 'secret',
      });
      expect(result).toEqual({ token: 'xyz' });
    });

    it('throws the server message on failure', async () => {
      client.post.mockRejectedValue({ response: { data: { message: 'Email taken' } } });

      await expect(authService.register('user@example.com', 'Jane Doe', 'secret')).rejects.toBe(
        'Email taken'
      );
    });

    it('falls back to a default message on failure', async () => {
      client.post.mockRejectedValue({});

      await expect(authService.register('user@example.com', 'Jane Doe', 'secret')).rejects.toBe(
        'Registration failed.'
      );
    });
  });

  describe('getProfile', () => {
    it('fetches the current user profile', async () => {
      client.get.mockResolvedValue({ data: { id: 1, name: 'Jane' } });

      const result = await authService.getProfile();

      expect(client.get).toHaveBeenCalledWith('/users/me');
      expect(result).toEqual({ id: 1, name: 'Jane' });
    });

    it('throws the server message on failure', async () => {
      client.get.mockRejectedValue({ response: { data: { message: 'Not found' } } });

      await expect(authService.getProfile()).rejects.toBe('Not found');
    });

    it('falls back to a default message on failure', async () => {
      client.get.mockRejectedValue({});

      await expect(authService.getProfile()).rejects.toBe('Could not fetch profile');
    });
  });

  describe('deleteAccount', () => {
    it('deletes the current user', async () => {
      client.delete.mockResolvedValue({ data: { success: true } });

      const result = await authService.deleteAccount();

      expect(client.delete).toHaveBeenCalledWith('/users/me');
      expect(result).toEqual({ success: true });
    });

    it('falls back to a default message on failure', async () => {
      client.delete.mockRejectedValue({});

      await expect(authService.deleteAccount()).rejects.toBe(
        'Could not delete account. Please try again.'
      );
    });
  });

  describe('resetPassword', () => {
    it('posts current/new password to the password-reset endpoint', async () => {
      client.post.mockResolvedValue({ data: {} });

      const result = await authService.resetPassword('old', 'new');

      expect(client.post).toHaveBeenCalledWith('/users/password-reset', {
        currentPassword: 'old',
        newPassword: 'new',
      });
      expect(result).toBeUndefined();
    });

    it('throws an Error using the object message from the server', async () => {
      client.post.mockRejectedValue({ response: { data: { message: 'Wrong password' } } });

      await expect(authService.resetPassword('old', 'new')).rejects.toThrow('Wrong password');
    });

    it('throws an Error using a plain string response body', async () => {
      client.post.mockRejectedValue({ response: { data: 'Bad request' } });

      await expect(authService.resetPassword('old', 'new')).rejects.toThrow('Bad request');
    });

    it('falls back to the raw error message, then a default', async () => {
      client.post.mockRejectedValue({ message: 'Network Error' });

      await expect(authService.resetPassword('old', 'new')).rejects.toThrow('Network Error');

      client.post.mockRejectedValue({});

      await expect(authService.resetPassword('old', 'new')).rejects.toThrow(
        'Failed to reset password. Please try again.'
      );
    });
  });

  describe('editName', () => {
    it('puts the new name and returns the data', async () => {
      client.put.mockResolvedValue({ data: { name: 'New Name' } });

      const result = await authService.editName('New Name');

      expect(client.put).toHaveBeenCalledWith('/users/edit', { name: 'New Name' });
      expect(result).toEqual({ name: 'New Name' });
    });

    it('throws the server message on failure', async () => {
      client.put.mockRejectedValue({ response: { data: { message: 'Invalid name' } } });

      await expect(authService.editName('')).rejects.toBe('Invalid name');
    });
  });

  describe('googleMobileLogin', () => {
    it('posts the access token and returns the data', async () => {
      client.post.mockResolvedValue({ data: { token: 't', username: 'u', name: 'n' } });

      const result = await authService.googleMobileLogin('google-token');

      expect(client.post).toHaveBeenCalledWith('/auth/google/mobile', {
        accessToken: 'google-token',
      });
      expect(result).toEqual({ token: 't', username: 'u', name: 'n' });
    });

    it('throws the server message on failure', async () => {
      client.post.mockRejectedValue({ response: { data: { message: 'Invalid token' } } });

      await expect(authService.googleMobileLogin('bad-token')).rejects.toBe('Invalid token');
    });
  });

  describe('forgotPassword', () => {
    it('posts the email and returns the data', async () => {
      client.post.mockResolvedValue({ data: { success: true } });

      const result = await authService.forgotPassword('user@example.com');

      expect(client.post).toHaveBeenCalledWith('/auth/forgot-password', {
        email: 'user@example.com',
      });
      expect(result).toEqual({ success: true });
    });

    it('falls back to a default message on failure', async () => {
      client.post.mockRejectedValue({});

      await expect(authService.forgotPassword('user@example.com')).rejects.toBe(
        'Something went wrong. Please try again.'
      );
    });
  });

  describe('resetPasswordWithToken', () => {
    it('posts the token and new password and returns the data', async () => {
      client.post.mockResolvedValue({ data: { success: true } });

      const result = await authService.resetPasswordWithToken('reset-token', 'newpass');

      expect(client.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'reset-token',
        newPassword: 'newpass',
      });
      expect(result).toEqual({ success: true });
    });

    it('falls back to a default message on failure', async () => {
      client.post.mockRejectedValue({});

      await expect(authService.resetPasswordWithToken('bad-token', 'newpass')).rejects.toBe(
        'Reset failed. The link may be expired or already used.'
      );
    });
  });
});
