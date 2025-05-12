import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { handleOAuthRedirect } from './utils/authRedirect.ts';

// First, try to handle any OAuth redirects before rendering the app
// This fixes the localhost redirect issue on Vercel
const redirectHandled = handleOAuthRedirect();

// Only proceed with rendering if we didn't need to redirect
if (!redirectHandled) {
  // Get the root element
  const rootElement = document.getElementById('root');

  // Ensure the root element exists
  if (!rootElement) {
    console.error('Root element not found! Make sure the HTML contains a div with id="root"');
    const errorDiv = document.createElement('div');
    errorDiv.textContent = 'Application Error: Root element not found.';
    document.body.appendChild(errorDiv);
  } else {
    try {
      // Create root and render app
      const root = createRoot(rootElement);
      root.render(
        <StrictMode>
          <App />
        </StrictMode>
      );
      console.log('Application mounted successfully');
    } catch (error) {
      console.error('Error mounting React application:', error);
      rootElement.innerHTML = '<div style="color: red; padding: 20px;">Application failed to initialize. Please check the console for errors.</div>';
    }
  }
}
