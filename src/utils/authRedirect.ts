/**
 * Utility functions to handle Supabase OAuth redirects
 * This solves the issue of localhost redirects on Vercel deployments
 */

// Check if running on Vercel or similar production environment
export const isProduction = (): boolean => {
  return window.location.hostname !== 'localhost' && 
         window.location.hostname !== '127.0.0.1';
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
  
  // Check if we've got an access token but potential localhost redirect issue
  if (hash && hash.includes('access_token') && hash.includes('localhost:3000') && isProduction()) {
    console.log('Detected localhost redirect on production deployment, fixing...');
    // Replace localhost with actual domain in the hash
    const fixedHash = hash.replace(
      /localhost:3000/g, 
      window.location.host
    );
    
    // Store the fixed hash for auth processing
    sessionStorage.setItem('supabase_auth_hash', fixedHash.substring(1)); // Remove # at start
    
    // Redirect to home page to process the auth
    window.location.href = window.location.origin;
    return true;
  }
  
  // Check if we need to restore a previously fixed hash
  const savedHash = sessionStorage.getItem('supabase_auth_hash');
  if (savedHash && !hash) {
    console.log('Restoring fixed auth parameters');
    // Apply the saved hash
    window.location.hash = savedHash;
    // Clean up
    sessionStorage.removeItem('supabase_auth_hash');
    return true;
  }
  
  return false;
}; 