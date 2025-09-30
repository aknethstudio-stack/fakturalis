# Polityka bezpieczeństwa (SECURITY.md)

Dziękujemy za zainteresowanie bezpieczeństwem projektu InvoiceForge. Poniższa polityka opisuje, jak
odpowiedzialnie zgłaszać podatności, czego oczekiwać po naszej stronie oraz dobre praktyki w trakcie
testów.

— Preferowane języki: PL / EN

## Zakres

- Ten dokument dotyczy kodu i pakietów w repozytorium InvoiceForge oraz oficjalnych wdrożeń
  utrzymywanych przez właścicieli projektu.
- Nie testuj i nie atakuj instancji należących do osób trzecich.
- Jeśli podejrzewasz lukę w zależnej bibliotece, rozważ równoległe zgłoszenie do jej autorów
  (upstream).

## Wspierane wersje

- Wsparcie bezpieczeństwa otrzymuje:
  - gałąź `main` (bieżący stan),
  - ostatnie stabilne wydanie (jeśli występuje).
- Starsze wydania mogą nie otrzymać poprawek; zalecamy aktualizację do najnowszej wersji.

## Jak zgłaszać podatności (Responsible Disclosure)

Prosimy o prywatny kontakt jednym z kanałów:

- e‑mail: akneth.studio@gmail.com
- formularz: https://akneth-studio.vercel.app/contact

W zgłoszeniu dołącz:

- szczegółowy opis problemu i potencjalny wpływ (CIA: poufność, integralność, dostępność),
- minimalne kroki reprodukcji (PoC) i oczekiwany/aktualny rezultat,
- informację o środowisku (wersje przeglądarki/Node/OS, commit SHA, wersja aplikacji),
- logi/błędy (z zachowaniem higieny danych – nie przesyłaj danych wrażliwych).

Szyfrowanie: na życzenie możemy uzgodnić zaszyfrowany kanał wymiany informacji (podaj preferencje w
pierwszej wiadomości).

Prosimy NIE:

- publikować zgłoszenia publicznie (issues/PR/blog) przed uzgodnioną datą ujawnienia,
- wykorzystywać luki do uzyskania dostępu do danych prawdziwych użytkowników,
- przeprowadzać ataków DoS/DDoS, fuzzingu o wysokiej intensywności, inżynierii społecznej, skanów
  destrukcyjnych,
- naruszać prawa lub regulaminy dostawców infrastruktury (np. Vercel) lub usług pośrednich.

Preferowane testy:

- korzystaj z własnych testowych kont i przykładowych danych,
- ograniczaj się do niezbędnego minimalnego zakresu technicznego, by wykazać podatność.

## Harmonogram i koordynacja ujawnienia

Po otrzymaniu zgłoszenia dążymy do:

- potwierdzenia odbioru: do 3 dni roboczych,
- triage/oceny ważności: do 7 dni,
- opracowania i udostępnienia poprawki lub obejścia: zwykle w ciągu 30–90 dni (w zależności od
  złożoności i wpływu).

Model ujawnienia:

- Koordynowane ujawnienie (Coordinated Disclosure): wspólnie uzgadniamy termin ogłoszenia po
  dostępności poprawki/patche’i.
- Atrybucja: chętnie dziękujemy w notatkach wydania (o ile wyrazisz zgodę i przekażesz preferowaną
  formę nazwiska/nicku). Jeśli wolisz anonimowość, daj znać.

Uwaga: termin może się zmienić przy podatnościach w bibliotekach zewnętrznych (konieczna współpraca
z maintainerami upstream).

## Safe Harbor (dobre praktyki i ochrona)

Zakładamy działanie w dobrej wierze:

- Nie podejmujemy działań prawnych wobec osób, które:
  - działają odpowiedzialnie i w granicach prawa,
  - testują wyłącznie w zakresie niezbędnym do potwierdzenia luki,
  - nie naruszają prywatności i nie eskalują ponad konieczność,
  - zgłaszają problem poufnie i nie ujawniają go przed ustaleniem terminu.
- Szanuj prywatność: nie kopiuj/nie przechowuj danych osobowych poza minimum techniczne do PoC i
  usuń je po testach.

## Poza zakresem (przykłady)

- Brak/luzne nagłówki bezpieczeństwa na środowiskach deweloperskich/preview bez wykazanego wpływu.
- Problemy SPF/DMARC/odbijania e‑maili bez realnego wektora nadużycia.
- Ataki DoS/DDoS, brute‑force o dużej skali, skanowanie portów na infrastrukturze dostawcy.
- Ostrzeżenia narzędzi skanujących bez dowodu możliwości nadużycia (false‑positive’y).
- Luka wyłącznie w zewnętrznym komponencie bez możliwości obejścia/wykorzystania w kontekście
  aplikacji.

## Program nagród

Aktualnie nie prowadzimy formalnego programu bug bounty. Wdzięczność i atrybucja (za zgodą) będą
odnotowane w changelogu/relase notes.

## Postępowanie z danymi i poufność

- Wszelkie informacje ze zgłoszenia traktujemy jako poufne i wykorzystujemy wyłącznie do celów
  triage i naprawy.
- Dane testowe/usługowe przechowujemy tylko przez czas niezbędny do analizy i naprawy.

## Kontakt

- Bezpieczeństwo / zgłoszenia: akneth.studio@gmail.com
- Formularz: https://akneth-studio.vercel.app/contact

Dziękujemy za pomoc w utrzymaniu bezpieczeństwa InvoiceForge!

---

Security policy (short EN note):

- Private reporting via akneth.studio@gmail.com or https://akneth-studio.vercel.app/contact
- We follow Coordinated Disclosure; acknowledgement in 3 business days; triage within 7 days;
  typical fix within 30–90 days.
- Safe harbor for good-faith research. No public disclosure before an agreed date. No testing on
  third‑party instances or DoS/SE.
