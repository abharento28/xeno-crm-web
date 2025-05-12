/**
 * Utility functions to handle Supabase OAuth redirects
 * This solves the issue of localhost redirects on Vercel deployments
 */

// Check if running on Vercel or similar production environment
export const isProduction = (): boolean => {
  const hostname = window.location.hostname;
  const isProd = hostname !== 'localhost' && 
         hostname !== '127.0.0.1';
  console.log(`Environment check: hostname=${hostname}, isProduction=${isProd}`);
  return isProd;
};

// Get the correct site URL for redirects
export const getSiteUrl = (): string => {
  if (isProduction()) {
    return window.location.origin; // Use actual deployment URL
  } else {
    return 'http://localhost:3000'; // Use localhost in development
  }
};

// Handle OAuth redirect after login
export const handleOAuthRedirect = (): boolean => {
  const hash = window.location.hash;
  const isHostnameProduction = isProduction();
  const currentUrl = window.location.href;
  
  // Prevent redirect loops by checking if we're already processing a redirect
  if (sessionStorage.getItem('processing_redirect') === 'true') {
    console.log('Already processing a redirect, clearing flag');
    sessionStorage.removeItem('processing_redirect');
    return false;
  }
  
  console.log('Checking redirect URL:', currentUrl);
  console.log('Hash fragment:', hash);
  console.log('isProduction:', isHostnameProduction);
  
  // Special case: Handle the specific URL format from the user's example
  if (hash && 
      hash.includes('access_token=') && 
      currentUrl.startsWith('http://localhost:3000/') && 
      isHostnameProduction) {
    
    console.log('FIXING: Detected exact localhost:3000 OAuth callback pattern');
    
    // Get the current hostname and protocol
    const currentHost = window.location.host;
    const protocol = window.location.protocol;
    
    // Create a fixed URL with the current hostname (no extra slash)
    const fixedUrl = `${protocol}//${currentHost}${hash}`;
    console.log('Redirecting to fixed URL:', fixedUrl);
    
    // Store the hash for later processing
    sessionStorage.setItem('supabase_auth_hash', hash.substring(1));
    sessionStorage.setItem('processing_redirect', 'true');
    
    // Redirect to the fixed URL
    window.location.replace(fixedUrl);
    return true;
  }
  
  // Check if we've got an auth hash that contains localhost:3000 while on production
  if (hash && 
      hash.includes('access_token') && 
      hash.includes('localhost:3000') && 
      isHostnameProduction) {
    
    console.log('FIXING: Detected localhost redirect on production deployment');
    
    // Replace localhost with actual domain in the hash
    const fixedHash = hash.replace(
      /localhost:3000/g, 
      window.location.host
    );
    
    // Create the fixed URL
    const fixedUrl = `${window.location.origin}${fixedHash}`;
    console.log('Redirecting to fixed URL:', fixedUrl);
    
    // Store the fixed hash for auth processing
    sessionStorage.setItem('supabase_auth_callbackUrl', window.location.href);
    sessionStorage.setItem('supabase_auth_hash', fixedHash.substring(1)); // Remove # at start
    sessionStorage.setItem('processing_redirect', 'true');
    
    // Redirect to fixed URL
    window.location.replace(fixedUrl);
    return true;
  }
  
  // Check if we need to restore a previously fixed hash
  const savedHash = sessionStorage.getItem('supabase_auth_hash');
  if (savedHash) {
    console.log('Restoring fixed auth parameters from session storage');
    
    // Apply the saved hash if we don't already have one
    if (!hash || !hash.includes('access_token')) {
      console.log('Setting hash to:', savedHash);
      window.location.hash = savedHash;
    }
    
    // Clean up
    sessionStorage.removeItem('supabase_auth_hash');
    sessionStorage.removeItem('supabase_auth_callbackUrl');
    sessionStorage.removeItem('processing_redirect');
    return true;
  }
  
  // Check directly for localhost:3000 in the URL (fallback detection)
  if (isHostnameProduction && currentUrl.includes('localhost:3000')) {
    console.log('FIXING: Detected localhost in URL on production deployment');
    const fixedUrl = currentUrl.replace(
      /localhost:3000/g,
      window.location.host
    );
    console.log('Redirecting to:', fixedUrl);
    sessionStorage.setItem('processing_redirect', 'true');
    window.location.replace(fixedUrl);
    return true;
  }
  
  console.log('No redirect needed');
  return false;
}; 