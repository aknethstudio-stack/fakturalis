import Image from 'next/image';
import Link from 'next/link';
import { BsBox, BsCurrencyDollar, BsFileEarmarkText, BsGrid3X3Gap, BsPeople } from 'react-icons/bs';
import AccountDropdown from './AccountDropdown';
import MobileMenu from './MobileMenu';

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
            <Link href='/dashboard' className='header__nav-link'>
              <BsGrid3X3Gap size={16} />
              <span>Dashboard</span>
            </Link>
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

          {/* Desktop User Menu */}
          <div className='header__user-menu'>
            <AccountDropdown />
          </div>

          {/* Mobile Menu */}
          <div className='header__mobile-container'>
            <MobileMenu>
              <nav className='header__mobile-nav'>
                <Link href='/dashboard' className='header__nav-link'>
                  <BsGrid3X3Gap size={16} />
                  <span>Dashboard</span>
                </Link>
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
