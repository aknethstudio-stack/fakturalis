import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { BsBox, BsCurrencyDollar, BsFileEarmarkText, BsGrid3X3Gap, BsPeople } from 'react-icons/bs';
import AccountDropdown from './AccountDropdown';
import MobileMenu from './MobileMenu';

const NAV_LINKS: {
  href: string;
  label: string;
  icon: ReactNode;
}[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: <BsGrid3X3Gap size={16} />,
  },
  {
    href: '/invoices',
    label: 'Faktury',
    icon: <BsFileEarmarkText size={16} />,
  },
  {
    href: '/clients',
    label: 'Klienci',
    icon: <BsPeople size={16} />,
  },
  {
    href: '/products',
    label: 'Produkty',
    icon: <BsBox size={16} />,
  },
  {
    href: '/pricing',
    label: 'Cennik',
    icon: <BsCurrencyDollar size={16} />,
  },
];

export default function Header() {
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

          {/* Desktop Navigation */}
          <nav className='header__nav'>
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className='header__nav-link'>
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* Desktop User Menu */}
          <div className='header__user-menu'>
            <AccountDropdown />
          </div>

          {/* Mobile Menu */}
          <div className='header__mobile-container'>
            <MobileMenu>
              <nav className='header__mobile-nav'>
                {NAV_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} className='header__nav-link'>
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                ))}
              </nav>
              <div className='header__mobile-user'>
                <AccountDropdown />
              </div>
            </MobileMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
