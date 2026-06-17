/**
 * Unit tests for App.jsx root component
 * Tests component rendering
 */

import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the Dashboard component
jest.mock('./components/Dashboard', () => {
  return function MockDashboard() {
    return <div data-testid="mock-dashboard">Dashboard Component</div>;
  };
});

describe('App component', () => {
  it('should render Dashboard component', () => {
    render(<App />);

    const dashboard = screen.getByTestId('mock-dashboard');
    expect(dashboard).toBeInTheDocument();
  });

  it('should render without crashing', () => {
    const { container } = render(<App />);

    expect(container).toBeTruthy();
  });

  it('should only render Dashboard and nothing else at root level', () => {
    const { container } = render(<App />);

    // App should return only the Dashboard component
    expect(container.firstChild).toHaveAttribute('data-testid', 'mock-dashboard');
  });

  it('should pass no props to Dashboard', () => {
    const MockDashboard = jest.fn(() => <div>Dashboard</div>);
    jest.doMock('./components/Dashboard', () => MockDashboard);

    jest.isolateModules(() => {
      const App = require('./App').default;
      const { render } = require('@testing-library/react');

      render(<App />);

      expect(MockDashboard).toHaveBeenCalledWith({}, {});
    });
  });
});
