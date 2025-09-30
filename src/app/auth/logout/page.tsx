'use client';

import { useAuth } from '@/hooks/use-supabase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { BsBoxArrowRight as LogOut } from 'react-icons/bs';

export default function LogoutPage() {
  const router = useRouter();
  const { signOut } = useAuth();

  useEffect(() => {
    const handleLogout = async () => {
      try {
        await signOut();
        router.push('/auth/login?message=Zostałeś wylogowany');
      } catch (error) {
        console.error('Logout error:', error);
        router.push('/auth/login?error=logout_error');
      }
    };

    handleLogout();
  }, [router, signOut]);

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50'>
      <div className='text-center'>
        <LogOut className='mx-auto h-16 w-16 animate-pulse text-blue-600' />
        <h2 className='mt-4 text-xl font-semibold text-gray-900'>Wylogowywanie...</h2>
        <p className='mt-2 text-gray-600'>Proszę czekać</p>
      </div>
    </div>
  );
}
