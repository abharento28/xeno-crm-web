import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

const SignupPage: React.FC = () => {
  const handleGoogleSignup = async () => {
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
    if (error) console.error('Google signup error:', error.message);
  };

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Sign Up</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Enter your information to create an account</p>
      </div>
      <div className="space-y-4">
        <button onClick={handleGoogleSignup} className="button-outline w-full">
          Sign Up with Google
        </button>
      </div>
    </div>
  );
};

export default SignupPage;