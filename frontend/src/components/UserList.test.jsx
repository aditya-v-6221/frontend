/**
 * Unit tests for UserList.jsx component
 * Tests data fetching, rendering, user interactions, and error handling
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserList from './UserList';
import { api } from '../services/api';

// Mock the API module
jest.mock('../services/api', () => ({
  api: {
    getUsers: jest.fn(),
    deleteUser: jest.fn(),
  },
}));

describe('UserList component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading state', () => {
    it('should display loading message initially', () => {
      api.getUsers.mockReturnValue(new Promise(() => {})); // Never resolves

      render(<UserList />);

      expect(screen.getByText('Loading users from Aurora PostgreSQL…')).toBeInTheDocument();
    });

    it('should not display users while loading', () => {
      api.getUsers.mockReturnValue(new Promise(() => {}));

      render(<UserList />);

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('should not display error while loading', () => {
      api.getUsers.mockReturnValue(new Promise(() => {}));

      render(<UserList />);

      expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
    });
  });

  describe('Successful data fetch', () => {
    const mockUsers = [
      {
        id: 1,
        email: 'alice@example.com',
        name: 'Alice Johnson',
        created_at: '2024-01-15T10:30:00Z',
      },
      {
        id: 2,
        email: 'bob@example.com',
        name: 'Bob Smith',
        created_at: '2024-02-20T14:45:00Z',
      },
    ];

    it('should display users after successful fetch', async () => {
      api.getUsers.mockResolvedValue(mockUsers);

      render(<UserList />);

      await waitFor(() => {
        expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      });

      expect(screen.getByText('alice@example.com')).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      expect(screen.getByText('bob@example.com')).toBeInTheDocument();
    });

    it('should hide loading message after fetch completes', async () => {
      api.getUsers.mockResolvedValue(mockUsers);

      render(<UserList />);

      await waitFor(() => {
        expect(screen.queryByText('Loading users from Aurora PostgreSQL…')).not.toBeInTheDocument();
      });
    });

    it('should render table with correct headers', async () => {
      api.getUsers.mockResolvedValue(mockUsers);

      render(<UserList />);

      await waitFor(() => {
        expect(screen.getByText('ID')).toBeInTheDocument();
      });

      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Created')).toBeInTheDocument();
    });

    it('should display user IDs', async () => {
      api.getUsers.mockResolvedValue(mockUsers);

      render(<UserList />);

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
      });

      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should format created_at dates correctly', async () => {
      api.getUsers.mockResolvedValue([
        { id: 1, email: 'test@example.com', name: 'Test', created_at: '2024-03-15T10:30:00Z' },
      ]);

      render(<UserList />);

      await waitFor(() => {
        const formattedDate = new Date('2024-03-15T10:30:00Z').toLocaleDateString();
        expect(screen.getByText(formattedDate)).toBeInTheDocument();
      });
    });

    it('should render delete button for each user', async () => {
      api.getUsers.mockResolvedValue(mockUsers);

      render(<UserList />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
        expect(deleteButtons).toHaveLength(2);
      });
    });

    it('should call getUsers on mount', async () => {
      api.getUsers.mockResolvedValue([]);

      render(<UserList />);

      await waitFor(() => {
        expect(api.getUsers).toHaveBeenCalledTimes(1);
      });
    });

    it('should call getUsers with no arguments', async () => {
      api.getUsers.mockResolvedValue([]);

      render(<UserList />);

      await waitFor(() => {
        expect(api.getUsers).toHaveBeenCalledWith();
      });
    });
  });

  describe('Empty user list', () => {
    it('should render empty table when no users', async () => {
      api.getUsers.mockResolvedValue([]);

      render(<UserList />);

      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument();
      });

      const rows = screen.queryAllByRole('row');
      expect(rows).toHaveLength(1); // Only header row
    });

    it('should not render any delete buttons when no users', async () => {
      api.getUsers.mockResolvedValue([]);

      render(<UserList />);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
      });
    });
  });

  describe('Error handling', () => {
    it('should display error message when fetch fails', async () => {
      const errorMessage = 'Network error';
      api.getUsers.mockRejectedValue(new Error(errorMessage));

      render(<UserList />);

      await waitFor(() => {
        expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
      });
    });

    it('should not display table when error occurs', async () => {
      api.getUsers.mockRejectedValue(new Error('Failed'));

      render(<UserList />);

      await waitFor(() => {
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
      });
    });

    it('should hide loading message when error occurs', async () => {
      api.getUsers.mockRejectedValue(new Error('Failed'));

      render(<UserList />);

      await waitFor(() => {
        expect(screen.queryByText('Loading users from Aurora PostgreSQL…')).not.toBeInTheDocument();
      });
    });

    it('should apply error class to error message', async () => {
      api.getUsers.mockRejectedValue(new Error('Failed'));

      render(<UserList />);

      await waitFor(() => {
        const errorElement = screen.getByText(/Error:/);
        expect(errorElement).toHaveClass('error');
      });
    });

    it('should handle error without message', async () => {
      api.getUsers.mockRejectedValue(new Error());

      render(<UserList />);

      await waitFor(() => {
        expect(screen.getByText('Error:')).toBeInTheDocument();
      });
    });

    it('should handle non-Error rejection', async () => {
      api.getUsers.mockRejectedValue('String error');

      render(<UserList />);

      await waitFor(() => {
        const errorElement = screen.queryByText(/Error:/);
        expect(errorElement).toBeInTheDocument();
      });
    });
  });

  describe('Delete functionality', () => {
    const mockUsers = [
      { id: 1, email: 'alice@example.com', name: 'Alice', created_at: '2024-01-15T10:30:00Z' },
      { id: 2, email: 'bob@example.com', name: 'Bob', created_at: '2024-02-20T14:45:00Z' },
      { id: 3, email: 'charlie@example.com', name: 'Charlie', created_at: '2024-03-10T09:00:00Z' },
    ];

    it('should call deleteUser API when delete button clicked', async () => {
      api.getUsers.mockResolvedValue(mockUsers);
      api.deleteUser.mockResolvedValue();

      render(<UserList />);

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
      await userEvent.click(deleteButtons[0]);

      expect(api.deleteUser).toHaveBeenCalledWith(1);
    });

    it('should remove user from list after successful delete', async () => {
      api.getUsers.mockResolvedValue(mockUsers);
      api.deleteUser.mockResolvedValue();

      render(<UserList />);

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
      await userEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('Alice')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });

    it('should delete correct user when multiple users present', async () => {
      api.getUsers.mockResolvedValue(mockUsers);
      api.deleteUser.mockResolvedValue();

      render(<UserList />);

      await waitFor(() => {
        expect(screen.getByText('Bob')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
      await userEvent.click(deleteButtons[1]); // Delete Bob

      expect(api.deleteUser).toHaveBeenCalledWith(2);

      await waitFor(() => {
        expect(screen.queryByText('Bob')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Charlie')).toBeInTheDocument();
    });

    it('should delete last user in list', async () => {
      api.getUsers.mockResolvedValue(mockUsers);
      api.deleteUser.mockResolvedValue();

      render(<UserList />);

      await waitFor(() => {
        expect(screen.getByText('Charlie')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
      await userEvent.click(deleteButtons[2]);

      expect(api.deleteUser).toHaveBeenCalledWith(3);

      await waitFor(() => {
        expect(screen.queryByText('Charlie')).not.toBeInTheDocument();
      });
    });

    it('should handle delete of user with ID 0', async () => {
      const usersWithZeroId = [
        { id: 0, email: 'zero@example.com', name: 'Zero User', created_at: '2024-01-01T00:00:00Z' },
      ];
      api.getUsers.mockResolvedValue(usersWithZeroId);
      api.deleteUser.mockResolvedValue();

      render(<UserList />);

      await waitFor(() => {
        expect(screen.getByText('Zero User')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: 'Delete' });
      await userEvent.click(deleteButton);

      expect(api.deleteUser).toHaveBeenCalledWith(0);
    });

    it('should handle multiple rapid delete clicks', async () => {
      api.getUsers.mockResolvedValue(mockUsers);
      api.deleteUser.mockResolvedValue();

      render(<UserList />);

      await waitFor(() => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
      await userEvent.click(deleteButtons[0]);
      await userEvent.click(deleteButtons[1]);

      expect(api.deleteUser).toHaveBeenCalledTimes(2);
      expect(api.deleteUser).toHaveBeenCalledWith(1);
      expect(api.deleteUser).toHaveBeenCalledWith(2);
    });
  });

  describe('Boundary and edge cases', () => {
    it('should handle user with very long email', async () => {
      const longEmail = 'a'.repeat(100) + '@example.com';
      api.getUsers.mockResolvedValue([
        { id: 1, email: longEmail, name: 'Test', created_at: '2024-01-01T00:00:00Z' },
      ]);

      render(<UserList />);

      await waitFor(() => {
        expect(screen.getByText(longEmail)).toBeInTheDocument();
      });
    });

    it('should handle user with very long name', async () => {
      const longName = 'A'.repeat(200);
      api.getUsers.mockResolvedValue([
        { id: 1, email: 'test@example.com', name: longName, created_at: '2024-01-01T00:00:00Z' },
      ]);

      render(<UserList />);

      await waitFor(() => {
        expect(screen.getByText(longName)).toBeInTheDocument();
      });
    });

    it('should handle special characters in email', async () => {
      const specialEmail = 'test+special@example.co.uk';
      api.getUsers.mockResolvedValue([
        { id: 1, email: specialEmail, name: 'Test', created_at: '2024-01-01T00:00:00Z' },
      ]);

      render(<UserList />);

      await waitFor(() => {
        expect(screen.getByText(specialEmail)).toBeInTheDocument();
      });
    });

    it('should handle special characters in name', async () => {
      const specialName = "O'Brien-Smith";
      api.getUsers.mockResolvedValue([
        { id: 1, email: 'test@example.com', name: specialName, created_at: '2024-01-01T00:00:00Z' },
      ]);

      render(<UserList />);

      await waitFor(() => {
        expect(screen.getByText(specialName)).toBeInTheDocument();
      });
    });

    it('should handle large user ID', async () => {
      const largeId = 2147483647; // Max 32-bit integer
      api.getUsers.mockResolvedValue([
        { id: largeId, email: 'test@example.com', name: 'Test', created_at: '2024-01-01T00:00:00Z' },
      ]);

      render(<UserList />);

      await waitFor(() => {
        expect(screen.getByText(String(largeId))).toBeInTheDocument();
      });
    });

    it('should handle date at boundary (Unix epoch)', async () => {
      api.getUsers.mockResolvedValue([
        { id: 1, email: 'test@example.com', name: 'Test', created_at: '1970-01-01T00:00:00Z' },
      ]);

      render(<UserList />);

      await waitFor(() => {
        const formattedDate = new Date('1970-01-01T00:00:00Z').toLocaleDateString();
        expect(screen.getByText(formattedDate)).toBeInTheDocument();
      });
    });

    it('should handle large number of users', async () => {
      const manyUsers = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        email: `user${i}@example.com`,
        name: `User ${i}`,
        created_at: '2024-01-01T00:00:00Z',
      }));

      api.getUsers.mockResolvedValue(manyUsers);

      render(<UserList />);

      await waitFor(() => {
        expect(screen.getByText('User 0')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByRole('button', { name: 'Delete' });
      expect(deleteButtons).toHaveLength(1000);
    });
  });

  describe('Component lifecycle', () => {
    it('should only call getUsers once on mount', async () => {
      api.getUsers.mockResolvedValue([]);

      const { rerender } = render(<UserList />);

      await waitFor(() => {
        expect(api.getUsers).toHaveBeenCalledTimes(1);
      });

      rerender(<UserList />);

      expect(api.getUsers).toHaveBeenCalledTimes(1);
    });

    it('should not refetch users when component rerenders', async () => {
      api.getUsers.mockResolvedValue([]);

      const { rerender } = render(<UserList />);

      await waitFor(() => {
        expect(api.getUsers).toHaveBeenCalledTimes(1);
      });

      rerender(<UserList />);
      rerender(<UserList />);

      expect(api.getUsers).toHaveBeenCalledTimes(1);
    });
  });
});
