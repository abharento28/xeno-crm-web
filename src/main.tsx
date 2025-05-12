// Import the redirect fixer first, so it runs before anything else
import './utils/fixRedirects';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { handleOAuthRedirect } from './utils/authRedirect.ts';
import { fixLocalhostRedirects } from './utils/fixRedirects';

console.log('Application initializing...');
console.log('Current URL:', window.location.href);

// First, check for any broken localhost redirects
if (window.location.href.includes('localhost:3000') && window.location.hostname !== 'localhost') {
  console.log('Direct localhost fix running...');
  const fixed = fixLocalhostRedirects();
  
  if (fixed) {
    console.log('Localhost URL fixed, waiting for navigation...');
    // Exit early since we're redirecting
    throw new Error('Redirecting to fix localhost URL');
  }
}

// Then, try to handle any OAuth redirects before rendering the app
// This fixes the localhost redirect issue on Vercel
try {
  console.log('Checking for OAuth redirects...');
  const redirectHandled = handleOAuthRedirect();
  console.log('Redirect handled:', redirectHandled);

  // Only proceed with rendering if we didn't need to redirect
  if (!redirectHandled) {
    console.log('No redirect needed, proceeding with app initialization');
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
  } else {
    console.log('Redirect handled, waiting for navigation to complete...');
  }
} catch (error) {
  console.error('Error during OAuth redirect handling:', error);
  // Attempt to render the app anyway
  const rootElement = document.getElementById('root');
  if (rootElement) {
    try {
      const root = createRoot(rootElement);
      root.render(
        <StrictMode>
          <App />
        </StrictMode>
      );
      console.log('Application mounted after error recovery');
    } catch (renderError) {
      console.error('Failed to render app after redirect error:', renderError);
      rootElement.innerHTML = '<div style="color: red; padding: 20px;">Authentication error. Please try again or contact support.</div>';
    }
  }
}
