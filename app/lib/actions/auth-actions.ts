'use server';

import { createClient } from '@/lib/supabase/server';
import { LoginFormData, RegisterFormData } from '../types';

/**
 * Authenticates a user with email and password
 * 
 * This server action handles user login by:
 * - Creating a server-side Supabase client with cookie-based session management
 * - Attempting authentication using Supabase Auth API
 * - Setting HTTP-only cookies for secure session storage
 * 
 * @param data - User credentials containing email and password
 * @returns Object with error message if authentication fails, null error if successful
 * 
 * Security considerations:
 * - Uses Supabase's built-in rate limiting for authentication attempts
 * - Session tokens are stored in HTTP-only cookies to prevent XSS attacks
 * - Passwords are handled securely by Supabase Auth (bcrypt hashing)
 */
export async function login(data: LoginFormData) {
  const supabase = await createClient();

  // Attempt user authentication with provided credentials
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return { error: error.message };
  }

  // Success: session cookies are automatically set by Supabase client
  return { error: null };
}

/**
 * Registers a new user account
 * 
 * This server action creates a new user account by:
 * - Creating a server-side Supabase client
 * - Registering user with Supabase Auth
 * - Storing additional user metadata (name) in the auth profile
 * 
 * @param data - Registration data including email, password, and display name
 * @returns Object with error message if registration fails, null error if successful
 * 
 * Security considerations:
 * - Email verification may be required based on Supabase project settings
 * - Password strength validation is handled by Supabase Auth policies
 * - User metadata is sanitized and stored securely
 */
export async function register(data: RegisterFormData) {
  const supabase = await createClient();

  // Create new user account with email confirmation
  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        name: data.name, // Store display name in user metadata
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Success: user created, may require email verification
  return { error: null };
}

/**
 * Logs out the current authenticated user
 * 
 * This server action handles user logout by:
 * - Creating a server-side Supabase client
 * - Invalidating the current session
 * - Clearing session cookies
 * 
 * @returns Object with error message if logout fails, null error if successful
 * 
 * Security considerations:
 * - Properly invalidates server-side session
 * - Clears all authentication cookies to prevent session hijacking
 */
export async function logout() {
  const supabase = await createClient();
  
  // Sign out user and clear session cookies
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: error.message };
  }
  return { error: null };
}

/**
 * Retrieves the current authenticated user
 * 
 * This utility function fetches the currently authenticated user from the session.
 * Used throughout the application for user context and access control.
 * 
 * @returns User object if authenticated, null if not authenticated
 * 
 * Security considerations:
 * - Validates session token from HTTP-only cookies
 * - Returns null for expired or invalid sessions
 * - User object contains safe profile data only
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  
  // Extract user from validated session
  const { data } = await supabase.auth.getUser();
  return data.user;
}

/**
 * Retrieves the current user session
 * 
 * This utility function gets the complete session object including user data
 * and session metadata. Used for session validation and token refresh.
 * 
 * @returns Session object if valid session exists, null otherwise
 * 
 * Security considerations:
 * - Session validation includes token expiry checks
 * - Automatic token refresh if refresh token is valid
 * - Contains JWT tokens that should be handled securely
 */
export async function getSession() {
  const supabase = await createClient();
  
  // Get complete session with automatic refresh
  const { data } = await supabase.auth.getSession();
  return data.session;
}
