/**
 * Unit tests for Dashboard.jsx component
 * Tests rendering, structure, and child component integration
 */

import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';

// Mock child components
jest.mock('./UserList', () => {
  return function MockUserList() {
    return <div data-testid="mock-userlist">UserList Component</div>;
  };
});

jest.mock('./FileUpload', () => {
  return function MockFileUpload({ onUploaded }) {
    return (
      <div data-testid="mock-fileupload">
        FileUpload Component
        <button onClick={() => onUploaded?.({ key: 'test', cdnUrl: 'url' })}>
          Trigger Upload
        </button>
      </div>
    );
  };
});

// Mock console.log to test the callback
const originalConsoleLog = console.log;

describe('Dashboard component', () => {
  beforeEach(() => {
    console.log = jest.fn();
  });

  afterEach(() => {
    console.log = originalConsoleLog;
  });

  describe('Rendering', () => {
    it('should render main heading', () => {
      render(<Dashboard />);

      const heading = screen.getByRole('heading', { name: 'Infra App Dashboard', level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('should render Users section heading', () => {
      render(<Dashboard />);

      const usersHeading = screen.getByRole('heading', { name: 'Users', level: 2 });
      expect(usersHeading).toBeInTheDocument();
    });

    it('should render File Upload section heading', () => {
      render(<Dashboard />);

      const uploadHeading = screen.getByRole('heading', { name: 'File Upload', level: 2 });
      expect(uploadHeading).toBeInTheDocument();
    });

    it('should render UserList component', () => {
      render(<Dashboard />);

      const userList = screen.getByTestId('mock-userlist');
      expect(userList).toBeInTheDocument();
    });

    it('should render FileUpload component', () => {
      render(<Dashboard />);

      const fileUpload = screen.getByTestId('mock-fileupload');
      expect(fileUpload).toBeInTheDocument();
    });

    it('should render with correct semantic HTML structure', () => {
      const { container } = render(<Dashboard />);

      const main = container.querySelector('main');
      expect(main).toBeInTheDocument();

      const sections = container.querySelectorAll('section');
      expect(sections).toHaveLength(2);
    });

    it('should render sections in correct order', () => {
      const { container } = render(<Dashboard />);

      const sections = container.querySelectorAll('section');
      const firstSectionHeading = sections[0].querySelector('h2');
      const secondSectionHeading = sections[1].querySelector('h2');

      expect(firstSectionHeading).toHaveTextContent('Users');
      expect(secondSectionHeading).toHaveTextContent('File Upload');
    });
  });

  describe('FileUpload onUploaded callback', () => {
    it('should pass onUploaded callback to FileUpload component', () => {
      render(<Dashboard />);

      const triggerButton = screen.getByText('Trigger Upload');
      triggerButton.click();

      expect(console.log).toHaveBeenCalledWith('Uploaded:', { key: 'test', cdnUrl: 'url' });
    });

    it('should log correct file information when upload completes', () => {
      render(<Dashboard />);

      const fileData = { key: 'uploads/image.jpg', cdnUrl: 'https://cdn.example.com/image.jpg' };

      // Simulate the callback being invoked
      const MockFileUpload = jest.fn(({ onUploaded }) => {
        // Trigger callback immediately
        onUploaded?.(fileData);
        return <div>FileUpload</div>;
      });

      jest.doMock('./FileUpload', () => MockFileUpload);

      jest.isolateModules(() => {
        const Dashboard = require('./Dashboard').default;
        const { render } = require('@testing-library/react');

        render(<Dashboard />);

        expect(console.log).toHaveBeenCalledWith('Uploaded:', fileData);
      });
    });

    it('should handle undefined parameter in onUploaded callback', () => {
      render(<Dashboard />);

      const MockFileUpload = jest.fn(({ onUploaded }) => {
        onUploaded?.(undefined);
        return <div>FileUpload</div>;
      });

      jest.doMock('./FileUpload', () => MockFileUpload);

      jest.isolateModules(() => {
        const Dashboard = require('./Dashboard').default;
        const { render } = require('@testing-library/react');

        render(<Dashboard />);

        expect(console.log).toHaveBeenCalledWith('Uploaded:', undefined);
      });
    });

    it('should handle null parameter in onUploaded callback', () => {
      render(<Dashboard />);

      const MockFileUpload = jest.fn(({ onUploaded }) => {
        onUploaded?.(null);
        return <div>FileUpload</div>;
      });

      jest.doMock('./FileUpload', () => MockFileUpload);

      jest.isolateModules(() => {
        const Dashboard = require('./Dashboard').default;
        const { render } = require('@testing-library/react');

        render(<Dashboard />);

        expect(console.log).toHaveBeenCalledWith('Uploaded:', null);
      });
    });
  });

  describe('Component integration', () => {
    it('should render both UserList and FileUpload in same view', () => {
      render(<Dashboard />);

      const userList = screen.getByTestId('mock-userlist');
      const fileUpload = screen.getByTestId('mock-fileupload');

      expect(userList).toBeInTheDocument();
      expect(fileUpload).toBeInTheDocument();
    });

    it('should not pass any props to UserList', () => {
      const MockUserList = jest.fn(() => <div>UserList</div>);
      jest.doMock('./UserList', () => MockUserList);

      jest.isolateModules(() => {
        const Dashboard = require('./Dashboard').default;
        const { render } = require('@testing-library/react');

        render(<Dashboard />);

        expect(MockUserList).toHaveBeenCalledWith({}, {});
      });
    });

    it('should pass only onUploaded prop to FileUpload', () => {
      const MockFileUpload = jest.fn(() => <div>FileUpload</div>);
      jest.doMock('./FileUpload', () => MockFileUpload);

      jest.isolateModules(() => {
        const Dashboard = require('./Dashboard').default;
        const { render } = require('@testing-library/react');

        render(<Dashboard />);

        const calls = MockFileUpload.mock.calls[0][0];
        expect(Object.keys(calls)).toEqual(['onUploaded']);
        expect(typeof calls.onUploaded).toBe('function');
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      const { container } = render(<Dashboard />);

      const h1 = container.querySelector('h1');
      const h2s = container.querySelectorAll('h2');

      expect(h1).toBeInTheDocument();
      expect(h2s).toHaveLength(2);
    });

    it('should use semantic main element', () => {
      const { container } = render(<Dashboard />);

      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('should use semantic section elements', () => {
      const { container } = render(<Dashboard />);

      const sections = container.querySelectorAll('section');
      expect(sections.length).toBeGreaterThan(0);
    });
  });
});
