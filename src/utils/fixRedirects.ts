/**
 * Utility to fix Supabase auth redirect issues
 * 
 * This addresses a specific issue where Supabase sometimes redirects to localhost:3000
 * even in production environments. It directly injects a fix into the page.
 */

// This will be called directly when loaded - immediately fixing any localhost:3000 redirects
(() => {
  try {
    // Only run in browser environment
    if (typeof window === 'undefined') return;
    
    // Check if we're in production
    const isProduction = window.location.hostname !== 'localhost' && 
                         window.location.hostname !== '127.0.0.1';
    
    console.log(`Redirect fixer: Running in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    
    // Only run in production
    if (!isProduction) return;
    
    // Get the current URL
    const currentUrl = window.location.href;
    
    // Check if it contains "localhost:3000" and access_token
    if (currentUrl.includes('localhost:3000') && currentUrl.includes('access_token=')) {
      console.log('FIXING LOCALHOST REDIRECT: Detected localhost:3000 in URL with access_token');
      
      // Extract the token part
      const hashPart = window.location.hash;
      
      // Create the corrected URL
      const fixedUrl = `${window.location.protocol}//${window.location.host}${hashPart}`;
      
      console.log('Redirecting to fixed URL:', fixedUrl);
      
      // Redirect to the fixed URL
      window.location.replace(fixedUrl);
    }
  } catch (error) {
    console.error('Error in redirect fixer:', error);
  }
})();

// Export a function to be called from other parts of the app if needed
export const fixLocalhostRedirects = () => {
  try {
    // Exit if we're actually on localhost (this is expected behavior)
    if (window.location.hostname === 'localhost') return;
    
    // If the URL contains localhost:3000 and we're not on localhost, fix it
    if (window.location.href.includes('localhost:3000')) {
      console.log('MANUAL FIX: Detected localhost:3000 in URL');
      
      // Replace localhost:3000 with the current host
      const fixedUrl = window.location.href.replace(
        /localhost:3000/g,
        window.location.host
      );
      
      console.log('Redirecting to fixed URL:', fixedUrl);
      
      // Redirect to the fixed URL
      window.location.replace(fixedUrl);
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error fixing redirects:', error);
    return false;
  }
}; 