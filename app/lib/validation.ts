export function validateLogin(email: string, password: string): string | null {
  if (!email.trim() && !password.trim()) {
    return 'Email and password are required.';
  }

  if (!email.trim()) {
    return 'Please enter your email address.';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address.';
  }

  if (!password.trim()) {
    return 'Please enter your password.';
  }

  return null; // No error
}
