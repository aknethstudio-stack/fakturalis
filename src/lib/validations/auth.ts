import { z } from 'zod';

/**
 * Schema walidacji dla logowania
 */
export const loginSchema = z.object({
  email: z.string().min(1, 'Email jest wymagany').email('Nieprawidłowy format email'),
  password: z.string().min(1, 'Hasło jest wymagane').min(6, 'Hasło musi mieć co najmniej 6 znaków'),
});

/**
 * Schema walidacji dla rejestracji
 */
export const signupSchema = z
  .object({
    email: z.string().min(1, 'Email jest wymagany').email('Nieprawidłowy format email'),
    password: z
      .string()
      .min(8, 'Hasło musi mieć co najmniej 8 znaków')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Hasło musi zawierać małą literę, dużą literę i cyfrę'),
    confirmPassword: z.string().min(1, 'Potwierdź hasło'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Hasła nie są identyczne',
    path: ['confirmPassword'],
  });

/**
 * Schema walidacji dla resetowania hasła
 */
export const resetPasswordSchema = z.object({
  email: z.string().min(1, 'Email jest wymagany').email('Nieprawidłowy format email'),
});

/**
 * Schema walidacji dla nowego hasła
 */
export const newPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Hasło musi mieć co najmniej 8 znaków')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Hasło musi zawierać małą literę, dużą literę i cyfrę'),
    confirmPassword: z.string().min(1, 'Potwierdź hasło'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Hasła nie są identyczne',
    path: ['confirmPassword'],
  });

// Export types
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type NewPasswordFormData = z.infer<typeof newPasswordSchema>;
