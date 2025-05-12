/**
 * Supabase configuration utilities
 * 
 * This handles setting the correct site URL for Supabase authentication
 * to prevent redirect to localhost:3000 in production.
 */

// Detect if we're in a production environment
export const isProduction = (): boolean => {
  const hostname = window.location.hostname;
  const isProd = hostname !== 'localhost' && hostname !== '127.0.0.1';
  console.log(`Supabase config - Environment: ${isProd ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  return isProd;
};

// Get the site URL for Supabase - ALWAYS use the current origin
export const getSiteUrl = (): string => {
  const url = window.location.origin;
  console.log(`Supabase config - Site URL: ${url}`);
  return url;
};

// Get the full site URL with protocol
export const getFullSiteUrl = (): string => {
  // Always use the current window origin to ensure redirects work properly
  const url = window.location.origin;
  console.log(`Supabase config - Full Site URL: ${url}`);
  return url;
};

// Create direct redirect URL for OAuth
export const getOAuthRedirectUrl = (): string => {
  const baseUrl = getFullSiteUrl();
  // Add a timestamp to prevent caching issues
  const timestamp = Date.now();
  const redirectUrl = `${baseUrl}?t=${timestamp}`;
  console.log(`Supabase config - OAuth Redirect URL: ${redirectUrl}`);
  return redirectUrl;
};

// Get environment variables safely
export const getSupabaseEnvVars = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase configuration is missing. Authentication will not work.');
  }
  
  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}; 