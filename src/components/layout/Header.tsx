import Link from 'next/link';
import styles from '@/styles/components.module.css';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.header__container}>
        <div className={styles.header__content}>
          {/* Logo */}
          <Link href='/' className={styles.header__logo}>
            <div className={styles.header__logo_icon}>IF</div>
            <span className={styles.header__logo_text}>InvoiceForge</span>
          </Link>

          {/* Navigation */}
          <nav className='header__nav'>
            <Link href='/invoices' className='header__nav-link'>
              Faktury
            </Link>
            <Link href='/clients' className='header__nav-link'>
              Klienci
            </Link>
            <Link href='/products' className='header__nav-link'>
              Produkty
            </Link>
          </nav>

          {/* User Menu */}
          <div className='header__user-menu'>
            <button className='header__account-btn'>Konto</button>
          </div>
        </div>
      </div>
    </header>
  );
}
