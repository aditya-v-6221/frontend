/**
 * Unit tests for FileUpload.jsx component
 * Tests file upload workflow, state management, and error handling
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FileUpload from './FileUpload';
import { api } from '../services/api';

// Mock the API module
jest.mock('../services/api', () => ({
  api: {
    presignUpload: jest.fn(),
    registerFile: jest.fn(),
  },
}));

// Mock global fetch for S3 upload
global.fetch = jest.fn();

const originalConsoleError = console.error;

describe('FileUpload component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('Initial render', () => {
    it('should render file input', () => {
      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      expect(fileInput).toBeInTheDocument();
    });

    it('should have file input enabled initially', () => {
      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      expect(fileInput).not.toBeDisabled();
    });

    it('should not display any status messages initially', () => {
      render(<FileUpload />);

      expect(screen.queryByText(/Uploading/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Uploaded!/)).not.toBeInTheDocument();
      expect(screen.queryByText(/Upload failed/)).not.toBeInTheDocument();
    });

    it('should render without onUploaded callback', () => {
      const { container } = render(<FileUpload />);

      expect(container.querySelector('.file-upload')).toBeInTheDocument();
    });

    it('should render with onUploaded callback', () => {
      const mockCallback = jest.fn();
      const { container } = render(<FileUpload onUploaded={mockCallback} />);

      expect(container.querySelector('.file-upload')).toBeInTheDocument();
    });
  });

  describe('File selection without upload', () => {
    it('should not trigger upload when no file selected', async () => {
      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await userEvent.upload(fileInput, []);

      expect(api.presignUpload).not.toHaveBeenCalled();
    });

    it('should not trigger upload when file input is changed to empty', async () => {
      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });

      // Simulate change event with no files
      Object.defineProperty(fileInput, 'files', {
        value: [],
        writable: true,
      });

      await userEvent.click(fileInput);

      expect(api.presignUpload).not.toHaveBeenCalled();
    });
  });

  describe('Successful upload flow', () => {
    const mockFile = new File(['file content'], 'test.txt', { type: 'text/plain' });
    const mockPresignResponse = {
      uploadUrl: 'https://s3.amazonaws.com/bucket/presigned-url',
      cdnUrl: 'https://cdn.example.com/test.txt',
      key: 'uploads/test.txt',
    };

    it('should display uploading status when file is selected', async () => {
      api.presignUpload.mockResolvedValue(mockPresignResponse);
      fetch.mockResolvedValue({ ok: true });
      api.registerFile.mockResolvedValue({});

      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await userEvent.upload(fileInput, mockFile);

      expect(screen.getByText('Uploading to S3…')).toBeInTheDocument();
    });

    it('should disable file input during upload', async () => {
      api.presignUpload.mockResolvedValue(mockPresignResponse);
      fetch.mockResolvedValue({ ok: true });
      api.registerFile.mockResolvedValue({});

      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await userEvent.upload(fileInput, mockFile);

      expect(fileInput).toBeDisabled();
    });

    it('should call presignUpload with correct parameters', async () => {
      api.presignUpload.mockResolvedValue(mockPresignResponse);
      fetch.mockResolvedValue({ ok: true });
      api.registerFile.mockResolvedValue({});

      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await userEvent.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(api.presignUpload).toHaveBeenCalledWith('test.txt', 'text/plain');
      });
    });

    it('should upload file to S3 with PUT request', async () => {
      api.presignUpload.mockResolvedValue(mockPresignResponse);
      fetch.mockResolvedValue({ ok: true });
      api.registerFile.mockResolvedValue({});

      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await userEvent.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          'https://s3.amazonaws.com/bucket/presigned-url',
          {
            method: 'PUT',
            body: mockFile,
            headers: { 'Content-Type': 'text/plain' },
          }
        );
      });
    });

    it('should call registerFile with correct metadata', async () => {
      api.presignUpload.mockResolvedValue(mockPresignResponse);
      fetch.mockResolvedValue({ ok: true });
      api.registerFile.mockResolvedValue({});

      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await userEvent.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(api.registerFile).toHaveBeenCalledWith({
          key: 'uploads/test.txt',
          filename: 'test.txt',
          contentType: 'text/plain',
          size: mockFile.size,
        });
      });
    });

    it('should display success message after upload completes', async () => {
      api.presignUpload.mockResolvedValue(mockPresignResponse);
      fetch.mockResolvedValue({ ok: true });
      api.registerFile.mockResolvedValue({});

      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await userEvent.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(screen.getByText(/Uploaded!/)).toBeInTheDocument();
      });
    });

    it('should display CDN URL after successful upload', async () => {
      api.presignUpload.mockResolvedValue(mockPresignResponse);
      fetch.mockResolvedValue({ ok: true });
      api.registerFile.mockResolvedValue({});

      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await userEvent.upload(fileInput, mockFile);

      await waitFor(() => {
        const link = screen.getByRole('link', { name: mockPresignResponse.cdnUrl });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', mockPresignResponse.cdnUrl);
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noreferrer');
      });
    });

    it('should call onUploaded callback after successful upload', async () => {
      const mockCallback = jest.fn();
      api.presignUpload.mockResolvedValue(mockPresignResponse);
      fetch.mockResolvedValue({ ok: true });
      api.registerFile.mockResolvedValue({});

      render(<FileUpload onUploaded={mockCallback} />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await userEvent.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(mockCallback).toHaveBeenCalledWith({
          key: 'uploads/test.txt',
          cdnUrl: 'https://cdn.example.com/test.txt',
        });
      });
    });

    it('should not call onUploaded if callback is undefined', async () => {
      api.presignUpload.mockResolvedValue(mockPresignResponse);
      fetch.mockResolvedValue({ ok: true });
      api.registerFile.mockResolvedValue({});

      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await userEvent.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(screen.getByText(/Uploaded!/)).toBeInTheDocument();
      });
      // No error should be thrown
    });

    it('should re-enable file input after successful upload', async () => {
      api.presignUpload.mockResolvedValue(mockPresignResponse);
      fetch.mockResolvedValue({ ok: true });
      api.registerFile.mockResolvedValue({});

      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await userEvent.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(fileInput).not.toBeDisabled();
      });
    });
  });

  describe('Upload error handling', () => {
    const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });

    it('should display error when presignUpload fails', async () => {
      api.presignUpload.mockRejectedValue(new Error('Presign failed'));

      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await userEvent.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(screen.getByText('Upload failed — check console')).toBeInTheDocument();
      });
    });

    it('should display error when S3 upload fails', async () => {
      api.presignUpload.mockResolvedValue({
        uploadUrl: 'https://s3.example.com/url',
        cdnUrl: 'https://cdn.example.com/test.txt',
        key: 'key',
      });
      fetch.mockRejectedValue(new Error('S3 upload failed'));

      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await userEvent.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(screen.getByText('Upload failed — check console')).toBeInTheDocument();
      });
    });

    it('should display error when registerFile fails', async () => {
      api.presignUpload.mockResolvedValue({
        uploadUrl: 'https://s3.example.com/url',
        cdnUrl: 'https://cdn.example.com/test.txt',
        key: 'key',
      });
      fetch.mockResolvedValue({ ok: true });
      api.registerFile.mockRejectedValue(new Error('Register failed'));

      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await userEvent.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(screen.getByText('Upload failed — check console')).toBeInTheDocument();
      });
    });

    it('should apply error class to error message', async () => {
      api.presignUpload.mockRejectedValue(new Error('Failed'));

      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await userEvent.upload(fileInput, mockFile);

      await waitFor(() => {
        const errorElement = screen.getByText('Upload failed — check console');
        expect(errorElement).toHaveClass('error');
      });
    });

    it('should log error to console when upload fails', async () => {
      const error = new Error('Upload failed');
      api.presignUpload.mockRejectedValue(error);

      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await userEvent.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Upload failed:', error);
      });
    });

    it('should re-enable file input after error', async () => {
      api.presignUpload.mockRejectedValue(new Error('Failed'));

      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await userEvent.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(fileInput).not.toBeDisabled();
      });
    });

    it('should not call onUploaded callback when upload fails', async () => {
      const mockCallback = jest.fn();
      api.presignUpload.mockRejectedValue(new Error('Failed'));

      render(<FileUpload onUploaded={mockCallback} />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await userEvent.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(screen.getByText('Upload failed — check console')).toBeInTheDocument();
      });

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('Different file types', () => {
    const mockPresignResponse = {
      uploadUrl: 'https://s3.example.com/url',
      cdnUrl: 'https://cdn.example.com/file',
      key: 'key',
    };

    beforeEach(() => {
      api.presignUpload.mockResolvedValue(mockPresignResponse);
      fetch.mockResolvedValue({ ok: true });
      api.registerFile.mockResolvedValue({});
    });

    it('should handle image file upload', async () => {
      const imageFile = new File(['image'], 'photo.jpg', { type: 'image/jpeg' });

      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await userEvent.upload(fileInput, imageFile);

      await waitFor(() => {
        expect(api.presignUpload).toHaveBeenCalledWith('photo.jpg', 'image/jpeg');
      });
    });

    it('should handle PDF file upload', async () => {
      const pdfFile = new File(['pdf'], 'document.pdf', { type: 'application/pdf' });

      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await userEvent.upload(fileInput, pdfFile);

      await waitFor(() => {
        expect(api.presignUpload).toHaveBeenCalledWith('document.pdf', 'application/pdf');
      });
    });

    it('should handle file with no extension', async () => {
      const file = new File(['content'], 'README', { type: 'text/plain' });

      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(api.presignUpload).toHaveBeenCalledWith('README', 'text/plain');
      });
    });

    it('should handle file with special characters in name', async () => {
      const file = new File(['content'], 'file name (1) [test].txt', { type: 'text/plain' });

      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(api.presignUpload).toHaveBeenCalledWith('file name (1) [test].txt', 'text/plain');
      });
    });

    it('should handle very long filename', async () => {
      const longName = 'a'.repeat(200) + '.txt';
      const file = new File(['content'], longName, { type: 'text/plain' });

      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await userEvent.upload(fileInput, file);

      await waitFor(() => {
        expect(api.presignUpload).toHaveBeenCalledWith(longName, 'text/plain');
      });
    });

    it('should handle empty file', async () => {
      const emptyFile = new File([], 'empty.txt', { type: 'text/plain' });

      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await userEvent.upload(fileInput, emptyFile);

      await waitFor(() => {
        expect(api.registerFile).toHaveBeenCalledWith(
          expect.objectContaining({ size: 0 })
        );
      });
    });

    it('should handle large file', async () => {
      const largeContent = 'x'.repeat(10 * 1024 * 1024); // 10MB
      const largeFile = new File([largeContent], 'large.txt', { type: 'text/plain' });

      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await userEvent.upload(fileInput, largeFile);

      await waitFor(() => {
        expect(api.registerFile).toHaveBeenCalledWith(
          expect.objectContaining({ size: largeFile.size })
        );
      });
    });
  });

  describe('Multiple upload attempts', () => {
    const mockFile1 = new File(['content1'], 'file1.txt', { type: 'text/plain' });
    const mockFile2 = new File(['content2'], 'file2.txt', { type: 'text/plain' });

    const mockPresignResponse = {
      uploadUrl: 'https://s3.example.com/url',
      cdnUrl: 'https://cdn.example.com/file',
      key: 'key',
    };

    it('should allow uploading another file after success', async () => {
      api.presignUpload.mockResolvedValue(mockPresignResponse);
      fetch.mockResolvedValue({ ok: true });
      api.registerFile.mockResolvedValue({});

      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });

      // First upload
      await userEvent.upload(fileInput, mockFile1);
      await waitFor(() => {
        expect(screen.getByText(/Uploaded!/)).toBeInTheDocument();
      });

      // Second upload
      await userEvent.upload(fileInput, mockFile2);
      await waitFor(() => {
        expect(api.presignUpload).toHaveBeenCalledWith('file2.txt', 'text/plain');
      });
    });

    it('should allow retry after error', async () => {
      api.presignUpload.mockRejectedValueOnce(new Error('Failed'));
      api.presignUpload.mockResolvedValueOnce(mockPresignResponse);
      fetch.mockResolvedValue({ ok: true });
      api.registerFile.mockResolvedValue({});

      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });

      // First attempt fails
      await userEvent.upload(fileInput, mockFile1);
      await waitFor(() => {
        expect(screen.getByText('Upload failed — check console')).toBeInTheDocument();
      });

      // Retry succeeds
      await userEvent.upload(fileInput, mockFile1);
      await waitFor(() => {
        expect(screen.getByText(/Uploaded!/)).toBeInTheDocument();
      });
    });

    it('should update CDN URL for each successful upload', async () => {
      const mockCallback = jest.fn();

      api.presignUpload
        .mockResolvedValueOnce({ ...mockPresignResponse, cdnUrl: 'https://cdn.example.com/file1' })
        .mockResolvedValueOnce({ ...mockPresignResponse, cdnUrl: 'https://cdn.example.com/file2' });
      fetch.mockResolvedValue({ ok: true });
      api.registerFile.mockResolvedValue({});

      render(<FileUpload onUploaded={mockCallback} />);

      const fileInput = screen.getByRole('textbox', { hidden: true });

      await userEvent.upload(fileInput, mockFile1);
      await waitFor(() => {
        expect(screen.getByText('https://cdn.example.com/file1')).toBeInTheDocument();
      });

      await userEvent.upload(fileInput, mockFile2);
      await waitFor(() => {
        expect(screen.getByText('https://cdn.example.com/file2')).toBeInTheDocument();
      });

      expect(mockCallback).toHaveBeenCalledTimes(2);
    });
  });

  describe('Status transitions', () => {
    const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    const mockPresignResponse = {
      uploadUrl: 'https://s3.example.com/url',
      cdnUrl: 'https://cdn.example.com/test.txt',
      key: 'key',
    };

    it('should transition from idle to uploading to done', async () => {
      api.presignUpload.mockResolvedValue(mockPresignResponse);
      fetch.mockResolvedValue({ ok: true });
      api.registerFile.mockResolvedValue({});

      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });

      // Initially idle
      expect(screen.queryByText(/Uploading/)).not.toBeInTheDocument();

      // Uploading
      await userEvent.upload(fileInput, mockFile);
      expect(screen.getByText('Uploading to S3…')).toBeInTheDocument();

      // Done
      await waitFor(() => {
        expect(screen.queryByText('Uploading to S3…')).not.toBeInTheDocument();
        expect(screen.getByText(/Uploaded!/)).toBeInTheDocument();
      });
    });

    it('should transition from idle to uploading to error', async () => {
      api.presignUpload.mockRejectedValue(new Error('Failed'));

      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });

      // Initially idle
      expect(screen.queryByText(/Upload failed/)).not.toBeInTheDocument();

      // Uploading
      await userEvent.upload(fileInput, mockFile);
      expect(screen.getByText('Uploading to S3…')).toBeInTheDocument();

      // Error
      await waitFor(() => {
        expect(screen.queryByText('Uploading to S3…')).not.toBeInTheDocument();
        expect(screen.getByText('Upload failed — check console')).toBeInTheDocument();
      });
    });

    it('should not show uploading message after completion', async () => {
      api.presignUpload.mockResolvedValue(mockPresignResponse);
      fetch.mockResolvedValue({ ok: true });
      api.registerFile.mockResolvedValue({});

      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await userEvent.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(screen.getByText(/Uploaded!/)).toBeInTheDocument();
      });

      expect(screen.queryByText('Uploading to S3…')).not.toBeInTheDocument();
    });

    it('should not show done message when in error state', async () => {
      api.presignUpload.mockRejectedValue(new Error('Failed'));

      render(<FileUpload />);

      const fileInput = screen.getByRole('textbox', { hidden: true });
      await userEvent.upload(fileInput, mockFile);

      await waitFor(() => {
        expect(screen.getByText('Upload failed — check console')).toBeInTheDocument();
      });

      expect(screen.queryByText(/Uploaded!/)).not.toBeInTheDocument();
    });
  });
});
