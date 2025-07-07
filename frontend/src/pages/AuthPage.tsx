import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import LoginForm from '../components/LoginForm';
import SignupForm from '../components/SignupForm';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { login, signup, error, clearError } = useAuth();

  const handleLogin = async (email: string, password: string) => {
    try {
      await login(email, password);
      // Redirect will be handled by the app routing
    } catch (err) {
      // Error is handled by the context
    }
  };

  const handleSignup = async (email: string, password: string) => {
    try {
      await signup(email, password);
      // Redirect will be handled by the app routing
    } catch (err) {
      // Error is handled by the context
    }
  };

  const switchToSignup = () => {
    setIsLogin(false);
    clearError();
  };

  const switchToLogin = () => {
    setIsLogin(true);
    clearError();
  };

  return (
    <div>
      {isLogin ? (
        <LoginForm
          onLogin={handleLogin}
          onSwitchToSignup={switchToSignup}
          error={error || undefined}
        />
      ) : (
        <SignupForm
          onSignup={handleSignup}
          onSwitchToLogin={switchToLogin}
          error={error || undefined}
        />
      )}
    </div>
  );
};

export default AuthPage; 