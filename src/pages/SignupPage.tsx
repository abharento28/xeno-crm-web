import { useAuth } from '../context/AuthContext';

const SignupPage: React.FC = () => {
  const { login } = useAuth();
  
  const handleGoogleSignup = async () => {
    login();
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