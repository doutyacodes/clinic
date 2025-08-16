'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Auth state shape
const initialState = {
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
  initialized: false,
};

// Auth actions
const authActions = {
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  SET_ERROR: 'SET_ERROR',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_INITIALIZED: 'SET_INITIALIZED',
};

// Auth reducer
function authReducer(state, action) {
  switch (action.type) {
    case authActions.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
        error: null,
      };
    
    case authActions.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
        error: null,
        initialized: true,
      };
    
    case authActions.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        initialized: true,
      };
    
    case authActions.LOGOUT:
      return {
        ...initialState,
        isLoading: false,
        initialized: true,
      };
    
    case authActions.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    case authActions.SET_INITIALIZED:
      return {
        ...state,
        initialized: true,
        isLoading: false,
      };
    
    default:
      return state;
  }
}

// Create context
const AuthContext = createContext(null);

// Auth provider component
export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  // Load user data on mount
  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      try {
        console.log('Initializing authentication...');
        dispatch({ type: authActions.SET_LOADING, payload: true });

        // Try to verify authentication with the server
        // Don't check for client-side token since we use httpOnly cookies
        console.log('Verifying authentication with server...');
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
          },
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('User authenticated successfully:', data.user?.email);
          if (mounted) {
            dispatch({ type: authActions.SET_USER, payload: data.user });
          }
        } else {
          console.log('Auth verification failed:', response.status);
          if (mounted) {
            dispatch({ type: authActions.SET_USER, payload: null });
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          // Handle different types of errors appropriately
          if (error.name === 'TypeError' && error.message.includes('fetch')) {
            console.log('Network error during auth initialization, will retry on next user action');
            dispatch({ type: authActions.SET_USER, payload: null });
          } else {
            console.log('Other error during auth initialization:', error.message);
            dispatch({ type: authActions.SET_USER, payload: null });
          }
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const clearAuthData = useCallback(() => {
    console.log('Clearing auth data');
    // Clear any client-side storage (though we primarily use httpOnly cookies)
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.clear();
    }
  }, []);

  // Login function
  const login = async (email, password, rememberMe = false) => {
    try {
      console.log('Attempting login for:', email);
      dispatch({ type: authActions.SET_LOADING, payload: true });
      dispatch({ type: authActions.CLEAR_ERROR });

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Login successful for:', data.user?.email);
        dispatch({ type: authActions.SET_USER, payload: data.user });
        return { success: true, user: data.user };
      } else {
        console.log('Login failed:', data.error);
        dispatch({ type: authActions.SET_ERROR, payload: data.error || 'Login failed' });
        return { success: false, error: data.error, errors: data.errors };
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = 'Network error. Please try again.';
      dispatch({ type: authActions.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Signup function
  const signup = async (userData) => {
    try {
      console.log('Attempting signup for:', userData.email);
      dispatch({ type: authActions.SET_LOADING, payload: true });
      dispatch({ type: authActions.CLEAR_ERROR });

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('Signup successful for:', data.user?.email);
        dispatch({ type: authActions.SET_USER, payload: data.user });
        return { success: true, user: data.user };
      } else {
        console.log('Signup failed:', data.error);
        dispatch({ type: authActions.SET_ERROR, payload: data.error || 'Signup failed' });
        return { success: false, error: data.error, errors: data.errors };
      }
    } catch (error) {
      console.error('Signup error:', error);
      const errorMessage = 'Network error. Please try again.';
      dispatch({ type: authActions.SET_ERROR, payload: errorMessage });
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      console.log('Logging out user');
      // Call logout API
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout API error:', error);
    }

    try {
      clearAuthData();
      dispatch({ type: authActions.LOGOUT });
      
      // Use Next.js router for navigation
      router.push('/');
      router.refresh();
      
    } catch (error) {
      console.error('Logout cleanup error:', error);
      // Fallback to full page refresh if router fails
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: authActions.CLEAR_ERROR });
  }, []);

  // Update user data
  const updateUser = useCallback((userData) => {
    console.log('Updating user data');
    dispatch({ type: authActions.SET_USER, payload: userData });
  }, []);

  // Reload user data
  const loadUser = useCallback(async () => {
    try {
      console.log('Reloading user data...');
      
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        dispatch({ type: authActions.SET_USER, payload: data.user });
      } else {
        if (response.status === 401 || response.status === 403) {
          clearAuthData();
        }
        dispatch({ type: authActions.SET_USER, payload: null });
      }
    } catch (error) {
      console.error('Load user error:', error);
      dispatch({ type: authActions.SET_ERROR, payload: 'Failed to load user data' });
    }
  }, [clearAuthData]);

  const value = {
    ...state,
    login,
    signup,
    logout,
    clearError,
    updateUser,
    loadUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

// HOC to protect components
export function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const { isAuthenticated, isLoading, user, initialized } = useAuth();
    
    if (!initialized || isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sky-500"></div>
        </div>
      );
    }
    
    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return null;
    }
    
    return <Component {...props} user={user} />;
  };
}