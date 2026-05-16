import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import * as fc from 'fast-check';

// Mock the supabase client
const mockOnAuthStateChange = vi.fn();
const mockUpdateUser = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
    },
  },
}));

// Also mock the relative path import used by the current unfixed component
vi.mock('../../../integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
    },
  },
}));

// Mock logo import
vi.mock('@/assets/logo.svg', () => ({ default: 'logo.svg' }));

import ResetPassword from '../ResetPassword';

function renderResetPassword() {
  return render(
    <BrowserRouter>
      <ResetPassword />
    </BrowserRouter>
  );
}

describe('Property 1: Bug Condition - Reset Password Form Missing Security Controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
  });

  /**
   * Test 1: Confirmation password field must exist
   * Validates: Requirements 2.1
   *
   * The fixed component should have a confirmation password input.
   * On unfixed code, this will FAIL because no confirmation field exists.
   */
  it('should render a confirmation password input field', () => {
    renderResetPassword();

    // Also check for any second password input
    const passwordTypeInputs = document.querySelectorAll('input[type="password"]');

    // There should be at least 2 password inputs (password + confirmation)
    expect(passwordTypeInputs.length).toBeGreaterThanOrEqual(2);
  });

  /**
   * Test 2: Weak passwords should be rejected with real-time feedback
   * Validates: Requirements 2.2
   *
   * Uses fast-check to generate passwords that fail strength requirements.
   * On unfixed code, this will FAIL because only HTML minLength=6 is enforced.
   */
  it('should reject weak passwords with real-time validation feedback', () => {
    // Generate passwords that are weak (missing uppercase, number, or special char)
    const weakPasswords = [
      'abc123',          // no uppercase, no special char
      'short',           // too short, no number, no special char
      'nouppercase1!',   // no uppercase
      'NOLOWERCASE1!',   // technically strong but let's test others
      'NoSpecial1',      // no special character
      'No1!',            // too short
      'abcdefgh',        // no uppercase, no number, no special
      'ABCDEFGH',        // no lowercase, no number, no special
      '12345678',        // no letters, no special
    ];

    fc.assert(
      fc.property(
        fc.constantFrom(...weakPasswords),
        (weakPassword: string) => {
          // Re-render for each test case
          const { unmount, container } = render(
            <BrowserRouter>
              <ResetPassword />
            </BrowserRouter>
          );

          // Type the weak password
          const passwordInput = container.querySelector('input[type="password"]');
          if (passwordInput) {
            // Simulate input change
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype, 'value'
            )?.set;
            nativeInputValueSetter?.call(passwordInput, weakPassword);
            passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
            passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
          }

          // The component should show real-time validation feedback
          // Look for strength indicators, error messages, or validation checklist
          const validationFeedback =
            screen.queryByText(/uppercase/i) ||
            screen.queryByText(/huruf besar/i) ||
            screen.queryByText(/karakter khusus/i) ||
            screen.queryByText(/special/i) ||
            screen.queryByText(/angka/i) ||
            screen.queryByText(/min.*8/i) ||
            container.querySelector('[data-testid="password-strength"]') ||
            container.querySelector('[role="alert"]');

          unmount();

          // There should be real-time validation feedback for weak passwords
          return validationFeedback !== null;
        }
      ),
      { numRuns: 5 }
    );
  });

  /**
   * Test 3: Form should NOT display without a valid recovery token/session
   * Validates: Requirements 2.3
   *
   * On unfixed code, this will FAIL because the form always renders regardless of token.
   */
  it('should not display the form without a recovery token and should show error with link to /lupa-sandi', () => {
    // Render without any recovery token (no PASSWORD_RECOVERY event will fire)
    // The mock onAuthStateChange won't trigger PASSWORD_RECOVERY
    renderResetPassword();

    // The form should NOT be displayed when there's no valid recovery session
    const form = screen.queryByRole('button', { name: /perbarui kata sandi/i });
    const passwordInput = document.querySelector('input[type="password"]');

    // Without a valid token, the form should be hidden
    expect(form).not.toBeInTheDocument();
    expect(passwordInput).not.toBeInTheDocument();

    // Should show an error message with a link to request a new reset
    const errorLink = screen.queryByRole('link', { name: /lupa.sandi|tautan baru|minta/i }) ||
      document.querySelector('a[href="/lupa-sandi"]');

    expect(errorLink).toBeInTheDocument();
  });

  /**
   * Test 4: supabase.auth.onAuthStateChange should be called on mount
   * Validates: Requirements 2.4
   *
   * On unfixed code, this will FAIL because the current useEffect only checks URL hash.
   */
  it('should call supabase.auth.onAuthStateChange on mount', () => {
    renderResetPassword();

    // The component should subscribe to auth state changes
    expect(mockOnAuthStateChange).toHaveBeenCalled();
  });
});
