import { Route, Routes, Navigate } from "react-router-dom";
import { ReactFlowProvider } from "reactflow";
import React from "react";
import Layout from "./Layout";
import Dashboard from "./Pages/Dashboard";
import EditorPage from "./Pages/EditorPage";
import HomePage from "./Pages/HomePage";
import Login from "./Pages/Login";
import TempPage from "./TempPage";
import Register from "./Pages/Register";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console for debugging
    console.error('Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md mx-auto text-center p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-red-600 mb-4">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">
              An error occurred while rendering the component. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  Error Details (Development Only)
                </summary>
                <pre className="mt-2 text-xs text-red-500 overflow-auto max-h-32">
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Redirect '/' to '/matflow' */}
          <Route index element={<Navigate to="/matflow" replace />} />
          <Route path="/matflow" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/temp" element={<TempPage />} />
        <Route
          path="/editor"
          element={
            <ReactFlowProvider>
              <EditorPage />
            </ReactFlowProvider>
          }
        />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;
