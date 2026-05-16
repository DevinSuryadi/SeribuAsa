import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import * as fc from 'fast-check';

// Mock navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock the supabase client
const mockOnAuthStateChange = vi.fn();
const mockUpdateUser = vi.fn();
const mockResetPasswordForEmail = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
      resetPasswordForEmail: (...args: unknown[]) => mockResetPasswordForEmail(...args),
    },
  },
}));

// Also mock the relative path import used by the current unfixed component
vi.mock('../../../integrations/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      updateUser: (...args: unknown[]) => mockUpdateUser(...args),
      resetPasswordForEmail: (...args: unknown[]) => mockResetPasswordForEmail(...args),
    },
  },
}));

// Mock logo import
vi.mock('@/assets/logo.svg', () => ({ default: 'logo.svg' }));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import ResetPassword from '../ResetPassword';
import LupaSandi from '../LupaSandi';

function renderLupaSandi() {
  return render(
    <BrowserRouter>
      <LupaSandi />
    </BrowserRouter>
  );
}

describe('Property 2: Preservation - Existing Reset Flow Behavior Unchanged', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * Validates: Requirements 3.2, 3.3
   *
   * For all valid password strings, verify updateUser is called with the password
   * and success state renders identically (CheckCircle, "Kata Sandi Diperbarui!", redirect after 3s)
   */
  it('should call updateUser with password and show success state with CheckCircle, success text, and redirect after 3s', { timeout: 30000 }, async () => {
    // Generate valid password strings (any non-empty string works on unfixed code since it only checks minLength=6)
    const validPasswords = fc.sample(
      fc.string({ minLength: 6, maxLength: 50 }).filter(s => s.trim().length >= 6),
      5
    );

    for (const password of validPasswords) {
      vi.clearAllMocks();
      mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
      mockUpdateUser.mockResolvedValue({ data: {}, error: null });

      const { unmount, container } = render(
        <BrowserRouter>
          <ResetPassword />
        </BrowserRouter>
      );

      // Fill in the password
      const passwordInputs = container.querySelectorAll('input[type="password"]');
      const passwordInput = passwordInputs[0] as HTMLInputElement;
      const confirmPasswordInput = passwordInputs[1] as HTMLInputElement;
      expect(passwordInput).not.toBeNull();

      await act(async () => {
        fireEvent.change(passwordInput!, { target: { value: password } });
      });

      // Fill in the confirmation password (must match for submission)
      if (confirmPasswordInput) {
        await act(async () => {
          fireEvent.change(confirmPasswordInput!, { target: { value: password } });
        });
      }

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /perbarui kata sandi/i });
      await act(async () => {
        fireEvent.click(submitButton);
      });

      // Verify updateUser was called with the password
      expect(mockUpdateUser).toHaveBeenCalledWith({ password });

      // Verify success state renders with CheckCircle (green) and correct text
      const successText = screen.getByText('Kata Sandi Diperbarui!');
      expect(successText).toBeInTheDocument();

      // CheckCircle should be rendered (it's an SVG with the lucide class)
      const checkCircleSvg = container.querySelector('.text-green-600');
      expect(checkCircleSvg).toBeInTheDocument();

      // Verify redirect after 3 seconds
      expect(mockNavigate).not.toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(mockNavigate).toHaveBeenCalledWith('/login');

      unmount();
    }
  });

  /**
   * Validates: Requirements 3.4
   *
   * For all error message strings returned by Supabase, verify the error is displayed in red <p> element
   */
  it('should display Supabase error messages in red text when updateUser fails', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
        async (errorMessage: string) => {
          vi.clearAllMocks();
          mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
          mockUpdateUser.mockResolvedValue({ data: null, error: { message: errorMessage } });

          const { unmount, container } = render(
            <BrowserRouter>
              <ResetPassword />
            </BrowserRouter>
          );

          // Fill in a password (any valid length)
          const passwordInputs = container.querySelectorAll('input[type="password"]');
          const passwordInput = passwordInputs[0] as HTMLInputElement;
          const confirmPasswordInput = passwordInputs[1] as HTMLInputElement;

          await act(async () => {
            fireEvent.change(passwordInput!, { target: { value: 'anypassword123' } });
          });

          // Fill in the confirmation password (must match for submission)
          if (confirmPasswordInput) {
            await act(async () => {
              fireEvent.change(confirmPasswordInput!, { target: { value: 'anypassword123' } });
            });
          }

          // Submit the form (use container-scoped query to avoid multiple element issues)
          const submitButton = container.querySelector('button[type="submit"]') as HTMLButtonElement;
          await act(async () => {
            fireEvent.click(submitButton);
          });

          // Verify error message is displayed
          const errorElement = container.querySelector('.text-red-500');
          expect(errorElement).not.toBeNull();
          expect(errorElement!.textContent).toBe(errorMessage);

          // Verify it's in a red-colored <p> element
          expect(errorElement!.tagName.toLowerCase()).toBe('p');
          expect(errorElement!.className).toContain('text-red');

          unmount();
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Validates: Requirements 3.5
   *
   * For any form submission, verify loading state shows spinner and disables button
   */
  it('should show Loader2 spinner and disable submit button during form submission', async () => {
    vi.useRealTimers();

    // Use a deferred promise so we can observe the loading state
    let resolveUpdate!: (value: unknown) => void;
    mockUpdateUser.mockImplementation(() => new Promise((resolve) => {
      resolveUpdate = resolve;
    }));

    const { container } = render(
      <BrowserRouter>
        <ResetPassword />
      </BrowserRouter>
    );

    // Fill in a password
    const passwordInputs = container.querySelectorAll('input[type="password"]');
    const passwordInput = passwordInputs[0] as HTMLInputElement;
    const confirmPasswordInput = passwordInputs[1] as HTMLInputElement;
    fireEvent.change(passwordInput!, { target: { value: 'testpassword' } });

    // Fill in the confirmation password (must match for submission)
    if (confirmPasswordInput) {
      fireEvent.change(confirmPasswordInput!, { target: { value: 'testpassword' } });
    }

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /perbarui kata sandi/i });

    // Before submission, button should be enabled
    expect(submitButton).not.toBeDisabled();

    // Start submission
    await act(async () => {
      fireEvent.click(submitButton);
      // Allow microtask to process the setLoading(true) before the await
      await Promise.resolve();
    });

    // During submission, button should be disabled
    expect(submitButton).toBeDisabled();

    // Loader2 spinner should be visible (it has animate-spin class)
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();

    // Resolve to clean up
    await act(async () => {
      resolveUpdate({ data: {}, error: null });
    });

    vi.useFakeTimers();
  });

  /**
   * Validates: Requirements 3.1
   *
   * LupaSandi.tsx calls resetPasswordForEmail with correct redirectTo and shows success confirmation
   */
  it('LupaSandi should call resetPasswordForEmail with correct redirectTo and show success confirmation', async () => {
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

    const { container } = renderLupaSandi();

    // Fill in email
    const emailInput = container.querySelector('input[type="email"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(emailInput!, { target: { value: 'test@example.com' } });
    });

    // Submit the form
    const submitButton = screen.getByRole('button', { name: /kirim tautan reset/i });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Verify resetPasswordForEmail was called with correct redirectTo
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith('test@example.com', {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    // Verify success confirmation is shown
    const successText = screen.getByText('Email Terkirim!');
    expect(successText).toBeInTheDocument();

    // Verify CheckCircle is rendered (green)
    const checkCircle = container.querySelector('.text-green-600');
    expect(checkCircle).toBeInTheDocument();

    // Verify link back to login exists
    const loginLink = screen.getByText(/kembali ke masuk/i);
    expect(loginLink).toBeInTheDocument();
  });
});
