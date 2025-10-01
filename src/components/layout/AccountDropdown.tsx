'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { BsChevronDown, BsPerson } from 'react-icons/bs';

export default function AccountDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
          <Link href='/auth/login' className='header__dropdown-item'>
            Zaloguj się
          </Link>
          <Link href='/auth/signup' className='header__dropdown-item'>
            Zarejestruj się
          </Link>
        </div>
      )}
    </div>
  );
}
