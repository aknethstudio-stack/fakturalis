'use client';

import { useMemo } from 'react';

interface PasswordStrengthProps {
  password: string;
  show: boolean;
}

export default function PasswordStrength({ password, show }: PasswordStrengthProps) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '', feedback: [] };

    let score = 0;
    const feedback: string[] = [];

    if (password.length >= 8) {
      score += 1;
    } else {
      feedback.push('Co najmniej 8 znaków');
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Mała litera');
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Wielka litera');
    }

    if (/\d/.test(password)) {
      score += 1;
    } else {
      feedback.push('Cyfra');
    }

    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      score += 1;
    } else {
      feedback.push('Znak specjalny');
    }

    let label = '';
    let color = '';

    if (score === 0) {
      label = '';
      color = '';
    } else if (score <= 2) {
      label = 'Słabe';
      color = 'bg-red-500';
    } else if (score <= 3) {
      label = 'Średnie';
      color = 'bg-yellow-500';
    } else if (score <= 4) {
      label = 'Dobre';
      color = 'bg-blue-500';
    } else {
      label = 'Bardzo silne';
      color = 'bg-green-500';
    }

    return { score, label, color, feedback };
  }, [password]);

  if (!show || !password) return null;

  return (
    <div className='mt-2 space-y-2'>
      {/* Strength bar */}
      <div className='flex space-x-1'>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded transition-colors duration-300 ${
              i < strength.score ? strength.color : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Strength label */}
      {strength.label && (
        <div className='flex items-center justify-between'>
          <span className='text-xs text-gray-600'>Siła hasła: {strength.label}</span>
        </div>
      )}

      {/* Feedback */}
      {strength.feedback.length > 0 && (
        <div className='text-xs text-gray-500'>Brakuje: {strength.feedback.join(', ')}</div>
      )}
    </div>
  );
}
