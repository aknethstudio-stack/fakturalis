'use client';

import { useEffect, useState } from 'react';
import { BsList, BsX } from 'react-icons/bs';

interface MobileMenuProps {
  children: React.ReactNode;
}

export default function MobileMenu({ children }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setIsMounted(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile menu button */}
      <button
        className='header__mobile-toggle'
        onClick={() => isMounted && setIsOpen(!isOpen)}
        aria-label='Toggle menu'>
        {isMounted && isOpen ? <BsX size={24} /> : <BsList size={24} />}
      </button>

      {/* Mobile menu overlay */}
      {isMounted && isOpen && <div className='header__mobile-overlay' onClick={() => setIsOpen(false)} />}

      {/* Mobile menu */}
      <div className={`header__mobile-menu ${isMounted && isOpen ? 'header__mobile-menu--open' : ''}`}>
        <div className='header__mobile-menu-content' onClick={() => setIsOpen(false)}>
          {isMounted && children}
        </div>
      </div>
    </>
  );
}
