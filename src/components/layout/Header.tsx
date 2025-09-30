'use client';

import { useAuth } from '@/hooks/use-supabase';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  BsBox,
  BsChevronDown,
  BsCurrencyDollar,
  BsDoorOpen,
  BsFileEarmarkText,
  BsGear,
  BsPeople,
  BsPerson,
} from 'react-icons/bs';

export default function Header() {
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated: isLoggedIn } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    }

    if (isAccountDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isAccountDropdownOpen]);

  return (
    <header className='header'>
      <div className='header__container'>
        <div className='header__content'>
          {/* Logo */}
          <Link href='/' className='header__logo'>
            <div className='header__logo-icon'>
              <Image src='/invoiceforge.svg' alt='InvoiceForge Logo' width={40} height={40} priority />
            </div>
            <span className='header__logo-text'>InvoiceForge</span>
          </Link>
          nie
          {/* Navigation */}
          <nav className='header__nav'>
            <Link href='/invoices' className='header__nav-link'>
              <BsFileEarmarkText size={16} />
              <span>Faktury</span>
            </Link>
            <Link href='/clients' className='header__nav-link'>
              <BsPeople size={16} />
              <span>Klienci</span>
            </Link>
            <Link href='/products' className='header__nav-link'>
              <BsBox size={16} />
              <span>Produkty</span>
            </Link>
            <Link href='/pricing' className='header__nav-link'>
              <BsCurrencyDollar size={16} />
              <span>Cennik</span>
            </Link>
          </nav>
          {/* User Menu */}
          <div className='header__user-menu'>
            <div className='header__account-dropdown' ref={dropdownRef}>
              <button
                className='header__account-btn'
                onClick={() => {
                  console.log('Dropdown clicked! Current state:', isAccountDropdownOpen);
                  setIsAccountDropdownOpen(!isAccountDropdownOpen);
                }}
                type='button'>
                <BsPerson size={16} />
                <span>Konto</span>
                <BsChevronDown
                  size={12}
                  className={`header__dropdown-icon ${isAccountDropdownOpen ? 'header__dropdown-icon--open' : ''}`}
                />
              </button>

              {isAccountDropdownOpen && (
                <div className='header__dropdown-menu' role='menu' aria-label='Opcje konta użytkownika'>
                  {isLoggedIn ? (
                    // Logged in menu
                    <>
                      <Link
                        href='/dashboard'
                        className='header__dropdown-item'
                        onClick={() => setIsAccountDropdownOpen(false)}
                        role='menuitem'>
                        <BsPerson size={16} />
                        <span>Mój profil</span>
                      </Link>
                      <Link
                        href='/settings'
                        className='header__dropdown-item'
                        onClick={() => setIsAccountDropdownOpen(false)}
                        role='menuitem'>
                        <BsGear size={16} />
                        <span>Ustawienia</span>
                      </Link>
                      <hr className='header__dropdown-separator' />
                      <Link
                        href='/auth/logout'
                        className='header__dropdown-item'
                        onClick={() => setIsAccountDropdownOpen(false)}
                        role='menuitem'>
                        <BsDoorOpen size={16} />
                        <span>Wyloguj się</span>
                      </Link>
                    </>
                  ) : (
                    // Not logged in menu
                    <>
                      <Link
                        href='/auth/login'
                        className='header__dropdown-item'
                        onClick={() => setIsAccountDropdownOpen(false)}
                        role='menuitem'>
                        <BsPerson size={16} />
                        <span>Zaloguj się</span>
                      </Link>
                      <Link
                        href='/auth/signup'
                        className='header__dropdown-item'
                        onClick={() => setIsAccountDropdownOpen(false)}
                        role='menuitem'>
                        <BsPerson size={16} />
                        <span>Zarejestruj się</span>
                      </Link>
                      <hr className='header__dropdown-separator' />
                      <Link
                        href='/auth/reset-password'
                        className='header__dropdown-item'
                        onClick={() => setIsAccountDropdownOpen(false)}
                        role='menuitem'>
                        <BsGear size={16} />
                        <span>Resetuj hasło</span>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
