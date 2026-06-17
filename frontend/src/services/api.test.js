/**
 * Unit tests for api.js service module
 * Tests HTTP request handling, error cases, and API methods
 */

import { api } from './api';

// Mock global fetch
global.fetch = jest.fn();

describe('api service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.REACT_APP_API_URL;
  });

  describe('request function', () => {
    it('should make GET request with correct options', async () => {
      const mockData = { id: 1, name: 'Test' };
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await api.getUsers();

      expect(fetch).toHaveBeenCalledWith('/api/users', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(mockData);
    });

    it('should make POST request with body', async () => {
      const mockData = { id: 1 };
      const postData = { name: 'New User', email: 'test@example.com' };
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockData,
      });

      const result = await api.createUser(postData);

      expect(fetch).toHaveBeenCalledWith('/api/users', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postData),
      });
      expect(result).toEqual(mockData);
    });

    it('should handle 204 No Content response', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => null,
      });

      const result = await api.deleteUser(1);

      expect(result).toBeNull();
    });

    it('should use BASE_URL from environment variable', async () => {
      process.env.REACT_APP_API_URL = 'https://api.example.com';

      // Re-import to pick up env var
      jest.isolateModules(() => {
        const { api: freshApi } = require('./api');

        fetch.mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ([]),
        });

        freshApi.getUsers();

        expect(fetch).toHaveBeenCalledWith(
          'https://api.example.com/api/users',
          expect.any(Object)
        );
      });
    });

    it('should throw error when response is not ok with JSON error', async () => {
      const errorMessage = 'User not found';
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ error: errorMessage }),
      });

      await expect(api.getUser(999)).rejects.toThrow(errorMessage);
    });

    it('should throw error when response is not ok without JSON error', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      await expect(api.getUsers()).rejects.toThrow('Internal Server Error');
    });

    it('should handle malformed JSON error response', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({}),
      });

      await expect(api.getUsers()).rejects.toThrow('Bad Request');
    });
  });

  describe('User API methods', () => {
    it('should call getUsers with correct endpoint', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      await api.getUsers();

      expect(fetch).toHaveBeenCalledWith('/api/users', expect.any(Object));
    });

    it('should call getUser with user ID', async () => {
      const userId = 42;
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: userId }),
      });

      await api.getUser(userId);

      expect(fetch).toHaveBeenCalledWith(`/api/users/${userId}`, expect.any(Object));
    });

    it('should call createUser with POST method', async () => {
      const userData = { name: 'John', email: 'john@example.com' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, ...userData }),
      });

      await api.createUser(userData);

      expect(fetch).toHaveBeenCalledWith('/api/users', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
    });

    it('should call deleteUser with DELETE method', async () => {
      const userId = 5;
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await api.deleteUser(userId);

      expect(fetch).toHaveBeenCalledWith(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should handle zero as valid user ID', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 0 }),
      });

      await api.getUser(0);

      expect(fetch).toHaveBeenCalledWith('/api/users/0', expect.any(Object));
    });
  });

  describe('File API methods', () => {
    it('should call presignUpload with filename and contentType', async () => {
      const filename = 'test.jpg';
      const contentType = 'image/jpeg';
      const mockResponse = {
        uploadUrl: 'https://s3.amazonaws.com/presigned-url',
        cdnUrl: 'https://cdn.example.com/test.jpg',
        key: 'uploads/test.jpg',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await api.presignUpload(filename, contentType);

      expect(fetch).toHaveBeenCalledWith('/api/files/presign', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, contentType }),
      });
      expect(result).toEqual(mockResponse);
    });

    it('should call registerFile with file metadata', async () => {
      const fileData = {
        key: 'uploads/test.jpg',
        filename: 'test.jpg',
        contentType: 'image/jpeg',
        size: 12345,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, ...fileData }),
      });

      await api.registerFile(fileData);

      expect(fetch).toHaveBeenCalledWith('/api/files', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileData),
      });
    });

    it('should call deleteFile with file ID', async () => {
      const fileId = 10;
      fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      await api.deleteFile(fileId);

      expect(fetch).toHaveBeenCalledWith(`/api/files/${fileId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should handle empty filename', async () => {
      const filename = '';
      const contentType = 'text/plain';

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ uploadUrl: 'url', cdnUrl: 'cdn', key: 'key' }),
      });

      await api.presignUpload(filename, contentType);

      expect(fetch).toHaveBeenCalledWith('/api/files/presign', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: '', contentType }),
      });
    });

    it('should handle special characters in filename', async () => {
      const filename = 'test file (1) [special].txt';
      const contentType = 'text/plain';

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ uploadUrl: 'url', cdnUrl: 'cdn', key: 'key' }),
      });

      await api.presignUpload(filename, contentType);

      expect(fetch).toHaveBeenCalled();
    });
  });

  describe('Health API method', () => {
    it('should call health endpoint', async () => {
      const healthData = { status: 'ok' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => healthData,
      });

      const result = await api.health();

      expect(fetch).toHaveBeenCalledWith('/health', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      expect(result).toEqual(healthData);
    });

    it('should handle health check failure', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => ({ error: 'Service down' }),
      });

      await expect(api.health()).rejects.toThrow('Service down');
    });
  });

  describe('Edge cases and boundary values', () => {
    it('should handle network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(api.getUsers()).rejects.toThrow('Network error');
    });

    it('should handle very large response payloads', async () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => ({ id: i }));
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => largeArray,
      });

      const result = await api.getUsers();

      expect(result).toHaveLength(10000);
    });

    it('should handle empty response body', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => null,
      });

      const result = await api.getUsers();

      expect(result).toBeNull();
    });

    it('should handle undefined body parameter', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await api.getUsers();

      const callArgs = fetch.mock.calls[0][1];
      expect(callArgs.body).toBeUndefined();
    });

    it('should handle null body parameter', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

      await api.getUsers();

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.not.objectContaining({ body: expect.anything() })
      );
    });
  });
});
