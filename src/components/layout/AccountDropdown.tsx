'use client';

import { useAuth } from '@/hooks/use-supabase';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { BsBoxArrowRight, BsChevronDown, BsGear, BsPerson, BsShield } from 'react-icons/bs';

export default function AccountDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useAuth();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsOpen(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (!isMounted) {
    return (
      <div className='header__account-dropdown' onClick={(e) => e.stopPropagation()}>
        <button className='header__account-btn'>
          <BsPerson size={16} />
          <span>Konto</span>
          <BsChevronDown size={12} className='header__dropdown-icon' />
        </button>
      </div>
    );
  }

  return (
    <div className='header__account-dropdown' ref={dropdownRef} onClick={(e) => e.stopPropagation()}>
      <button className='header__account-btn' onClick={() => setIsOpen(!isOpen)}>
        <BsPerson size={16} />
        <span>Konto</span>
        <BsChevronDown size={12} className={`header__dropdown-icon ${isOpen ? 'header__dropdown-icon--open' : ''}`} />
      </button>

      {isOpen && (
        <div className='header__dropdown-menu'>
          {user ? (
            // Authenticated user menu
            <>
              <div className='header__dropdown-header'>
                <span className='text-sm text-gray-600'>{user.email}</span>
              </div>
              <div className='header__dropdown-divider'></div>
              <Link href='/settings/profile' className='header__dropdown-item'>
                <BsPerson size={14} />
                <span>Profil</span>
              </Link>
              <Link href='/settings/ksef' className='header__dropdown-item'>
                <BsShield size={14} />
                <span>KSeF</span>
              </Link>
              <Link href='/settings' className='header__dropdown-item'>
                <BsGear size={14} />
                <span>Ustawienia</span>
              </Link>
              <div className='header__dropdown-divider'></div>
              <button onClick={handleSignOut} className='header__dropdown-item header__dropdown-item--button'>
                <BsBoxArrowRight size={14} />
                <span>Wyloguj się</span>
              </button>
            </>
          ) : (
            // Guest user menu
            <>
              <Link href='/auth/login' className='header__dropdown-item'>
                Zaloguj się
              </Link>
              <Link href='/auth/signup' className='header__dropdown-item'>
                Zarejestruj się
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
