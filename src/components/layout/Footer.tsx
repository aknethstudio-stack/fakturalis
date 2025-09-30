import Link from 'next/link';

export default function Footer() {
  return (
    <footer className='footer'>
      <div className='footer__container'>
        <div className='footer__grid'>
          {/* Logo */}
          <div>
            <div className='footer__logo'>
              <div className='footer__logo-icon'>IF</div>
              <span className='footer__logo-text'>InvoiceForge</span>
            </div>
            <p className='footer__description'>System fakturowania dla polskich firm.</p>
          </div>

          {/* Links */}
          <div>
            <h3 className='footer__section-title'>Funkcje</h3>
            <ul className='footer__links'>
              <li>
                <Link href='/invoices' className='footer__link'>
                  Faktury
                </Link>
              </li>
              <li>
                <Link href='/clients' className='footer__link'>
                  Klienci
                </Link>
              </li>
              <li>
                <Link href='/products' className='footer__link'>
                  Produkty
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className='footer__section-title'>Kontakt</h3>
            <ul className='footer__links'>
              <li>
                <a href='mailto:kontakt@invoiceforge.pl' className='footer__link'>
                  kontakt@invoiceforge.pl
                </a>
              </li>
              <li>
                <Link href='/help' className='footer__link'>
                  Pomoc
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className='footer__copyright'>
          <p>© {new Date().getFullYear()} InvoiceForge. Wszystkie prawa zastrzeżone.</p>
        </div>
      </div>
    </footer>
  );
}
