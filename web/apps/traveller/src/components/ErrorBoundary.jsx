import React from 'react';
import { ErrorState } from '@troublefree/ui';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to monitoring service if needed
    console.error('Unhandled application error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 20px', maxWidth: '600px', margin: '0 auto' }}>
          <ErrorState
            title="Application Error"
            message="Something went wrong while loading this page. Please try refreshing."
            onRetry={this.handleReload}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
