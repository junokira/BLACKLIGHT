import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Settings crash:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-sm bg-amber-100 border border-amber-300">
          <div className="font-semibold mb-1">Settings failed to render.</div>
          <div className="opacity-80">{String(this.state.error?.message || this.state.error)}</div>
        </div>
      );
    }
    return this.props.children;
  }
}


