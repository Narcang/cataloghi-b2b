import type { AppLocale } from '@/lib/locale'

const header = {
  it: {
    menu: 'Menu',
    cataloghi: 'Cataloghi',
    dashboard: 'Dashboard',
    contatti: 'Contatti Diretti',
    doveSiamo: 'Dove Siamo',
    registrazione: 'Registrazione',
    areaRiservata: 'Area Riservata',
    gestioneUtenti: 'Gestione Utenti',
    gestioneCataloghi: 'Gestione Cataloghi',
    esci: 'Esci',
    accedi: 'Accedi',
    installa: 'Installa app',
    lingua: 'Lingua',
    installIos: 'Per installare: tocca Condividi e poi "Aggiungi alla schermata Home".',
    installOther: 'Per installare: apri il menu del browser (⋮) e scegli "Installa app".',
    apriMenuEsci: 'Apri menu per uscire',
  },
  ru: {
    menu: 'Меню',
    cataloghi: 'Каталоги',
    dashboard: 'Панель',
    contatti: 'Прямые контакты',
    doveSiamo: 'Где мы',
    registrazione: 'Регистрация',
    areaRiservata: 'Закрытый раздел',
    gestioneUtenti: 'Управление пользователями',
    gestioneCataloghi: 'Управление каталогами',
    esci: 'Выйти',
    accedi: 'Войти',
    installa: 'Установить приложение',
    lingua: 'Язык',
    installIos: 'Чтобы установить: нажмите «Поделиться», затем «На экран „Домой“».',
    installOther: 'Чтобы установить: откройте меню браузера (⋮) и выберите «Установить приложение».',
    apriMenuEsci: 'Открыть меню выхода',
  },
  en: {
    menu: 'Menu',
    cataloghi: 'Catalogs',
    dashboard: 'Dashboard',
    contatti: 'Direct contacts',
    doveSiamo: 'Where we are',
    registrazione: 'Registration',
    areaRiservata: 'Reserved area',
    gestioneUtenti: 'User management',
    gestioneCataloghi: 'Catalog management',
    esci: 'Sign out',
    accedi: 'Sign in',
    installa: 'Install app',
    lingua: 'Language',
    installIos: 'To install: tap Share, then “Add to Home Screen”.',
    installOther: 'To install: open the browser menu (⋮) and choose “Install app”.',
    apriMenuEsci: 'Open menu to sign out',
  },
  fr: {
    menu: 'Menu',
    cataloghi: 'Catalogues',
    dashboard: 'Tableau de bord',
    contatti: 'Contacts directs',
    doveSiamo: 'Où nous sommes',
    registrazione: 'Inscription',
    areaRiservata: 'Espace réservé',
    gestioneUtenti: 'Gestion des utilisateurs',
    gestioneCataloghi: 'Gestion des catalogues',
    esci: 'Déconnexion',
    accedi: 'Connexion',
    installa: 'Installer l’application',
    lingua: 'Langue',
    installIos: 'Pour installer : appuyez sur Partager, puis « Sur l’écran d’accueil ».',
    installOther: 'Pour installer : ouvrez le menu du navigateur (⋮) et choisissez « Installer l’application ».',
    apriMenuEsci: 'Ouvrir le menu pour se déconnecter',
  },
  de: {
    menu: 'Menü',
    cataloghi: 'Kataloge',
    dashboard: 'Dashboard',
    contatti: 'Direktkontakte',
    doveSiamo: 'Wo wir sind',
    registrazione: 'Registrierung',
    areaRiservata: 'Geschützter Bereich',
    gestioneUtenti: 'Benutzerverwaltung',
    gestioneCataloghi: 'Katalogverwaltung',
    esci: 'Abmelden',
    accedi: 'Anmelden',
    installa: 'App installieren',
    lingua: 'Sprache',
    installIos: 'Zum Installieren: Teilen tippen, dann „Zum Home-Bildschirm“.',
    installOther: 'Zum Installieren: Browser-Menü (⋮) öffnen und „App installieren“ wählen.',
    apriMenuEsci: 'Menü zum Abmelden öffnen',
  },
  el: {
    menu: 'Μενού',
    cataloghi: 'Κατάλογοι',
    dashboard: 'Πίνακας',
    contatti: 'Άμεσες επαφές',
    doveSiamo: 'Πού είμαστε',
    registrazione: 'Εγγραφή',
    areaRiservata: 'Περιοχή μελών',
    gestioneUtenti: 'Διαχείριση χρηστών',
    gestioneCataloghi: 'Διαχείριση καταλόγων',
    esci: 'Αποσύνδεση',
    accedi: 'Σύνδεση',
    installa: 'Εγκατάσταση εφαρμογής',
    lingua: 'Γλώσσα',
    installIos: 'Για εγκατάσταση: πατήστε Κοινή χρήση και μετά «Προσθήκη στην αρχική οθόνη».',
    installOther: 'Για εγκατάσταση: ανοίξτε το μενού του προγράμματος περιήγησης (⋮) και επιλέξτε «Εγκατάσταση εφαρμογής».',
    apriMenuEsci: 'Άνοιγμα μενού αποσύνδεσης',
  },
  pl: {
    menu: 'Menu',
    cataloghi: 'Katalogi',
    dashboard: 'Panel',
    contatti: 'Kontakty bezpośrednie',
    doveSiamo: 'Gdzie jesteśmy',
    registrazione: 'Rejestracja',
    areaRiservata: 'Strefa zastrzeżona',
    gestioneUtenti: 'Zarządzanie użytkownikami',
    gestioneCataloghi: 'Zarządzanie katalogami',
    esci: 'Wyloguj',
    accedi: 'Zaloguj',
    installa: 'Zainstaluj aplikację',
    lingua: 'Język',
    installIos: 'Aby zainstalować: stuknij Udostępnij, potem „Dodaj do ekranu początkowego”.',
    installOther: 'Aby zainstalować: otwórz menu przeglądarki (⋮) i wybierz „Zainstaluj aplikację”.',
    apriMenuEsci: 'Otwórz menu wylogowania',
  },
  uk: {
    menu: 'Меню',
    cataloghi: 'Каталоги',
    dashboard: 'Панель',
    contatti: 'Прямі контакти',
    doveSiamo: 'Де ми',
    registrazione: 'Реєстрація',
    areaRiservata: 'Закритий розділ',
    gestioneUtenti: 'Керування користувачами',
    gestioneCataloghi: 'Керування каталогами',
    esci: 'Вийти',
    accedi: 'Увійти',
    installa: 'Встановити застосунок',
    lingua: 'Мова',
    installIos: 'Щоб встановити: натисніть «Поділитися», потім «На екран «Додому»».',
    installOther: 'Щоб встановити: відкрийте меню браузера (⋮) і виберіть «Встановити застосунок».',
    apriMenuEsci: 'Відкрити меню виходу',
  },
} as const

const home = {
  it: {
    tecnici: 'Cataloghi Tecnici',
    fotografico: 'Catalogo Fotografico',
    privacy: 'Privacy Policy',
    termini: 'Termini e Condizioni',
    cookie: 'Cookie Policy',
    accediPortale: 'Accedi al Portale Agenti →',
    scegliLingua: 'Scegli la lingua',
    scegliLinguaHelp: 'L’interfaccia e i cataloghi cambiano. Il tuo account e i collegamenti restano gli stessi.',
  },
  ru: {
    tecnici: 'Технические каталоги',
    fotografico: 'Фотокаталог',
    privacy: 'Политика конфиденциальности',
    termini: 'Условия использования',
    cookie: 'Политика cookie',
    accediPortale: 'Войти в портал агентов →',
    scegliLingua: 'Выберите язык',
    scegliLinguaHelp: 'Меняются интерфейс и каталоги. Аккаунт и связанные профили остаются теми же.',
  },
  en: {
    tecnici: 'Technical catalogs',
    fotografico: 'Photo catalog',
    privacy: 'Privacy Policy',
    termini: 'Terms and Conditions',
    cookie: 'Cookie Policy',
    accediPortale: 'Agent portal sign in →',
    scegliLingua: 'Choose language',
    scegliLinguaHelp: 'Interface and catalogs change. Your account and connections stay the same.',
  },
  fr: {
    tecnici: 'Catalogues techniques',
    fotografico: 'Catalogue photo',
    privacy: 'Politique de confidentialité',
    termini: 'Conditions générales',
    cookie: 'Politique cookies',
    accediPortale: 'Connexion portail agents →',
    scegliLingua: 'Choisissez la langue',
    scegliLinguaHelp: 'L’interface et les catalogues changent. Le compte et les liens restent les mêmes.',
  },
  de: {
    tecnici: 'Technische Kataloge',
    fotografico: 'Fotokatalog',
    privacy: 'Datenschutz',
    termini: 'Allgemeine Geschäftsbedingungen',
    cookie: 'Cookie-Richtlinie',
    accediPortale: 'Zum Agentenportal →',
    scegliLingua: 'Sprache wählen',
    scegliLinguaHelp: 'Oberfläche und Kataloge ändern sich. Konto und Verknüpfungen bleiben gleich.',
  },
  el: {
    tecnici: 'Τεχνικοί κατάλογοι',
    fotografico: 'Φωτογραφικός κατάλογος',
    privacy: 'Πολιτική απορρήτου',
    termini: 'Όροι χρήσης',
    cookie: 'Πολιτική cookie',
    accediPortale: 'Είσοδος στην πύλη πρακτόρων →',
    scegliLingua: 'Επιλέξτε γλώσσα',
    scegliLinguaHelp: 'Αλλάζουν η διεπαφή και οι κατάλογοι. Ο λογαριασμός και οι συνδέσεις μένουν ίδιοι.',
  },
  pl: {
    tecnici: 'Katalogi techniczne',
    fotografico: 'Katalog zdjęć',
    privacy: 'Polityka prywatności',
    termini: 'Regulamin',
    cookie: 'Polityka plików cookie',
    accediPortale: 'Logowanie do portalu agentów →',
    scegliLingua: 'Wybierz język',
    scegliLinguaHelp: 'Zmieniają się interfejs i katalogi. Konto i powiązania zostają te same.',
  },
  uk: {
    tecnici: 'Технічні каталоги',
    fotografico: 'Фотокаталог',
    privacy: 'Політика конфіденційності',
    termini: 'Умови використання',
    cookie: 'Політика cookie',
    accediPortale: 'Вхід до порталу агентів →',
    scegliLingua: 'Оберіть мову',
    scegliLinguaHelp: 'Змінюються інтерфейс і каталоги. Обліковий запис і зв’язки лишаються тими самими.',
  },
} as const

const catalogAdmin = {
  it: {
    linguaFile: 'Lingua del file',
    linguaHelp: 'Il PDF è visibile in questa lingua. English, se manca un file EN, usa automaticamente i PDF italiani.',
  },
  ru: {
    linguaFile: 'Язык файла',
    linguaHelp: 'PDF будет виден только при выборе этого языка.',
  },
  en: {
    linguaFile: 'File language',
    linguaHelp: 'If no English file exists, English users see the Italian PDF.',
  },
  fr: {
    linguaFile: 'Langue du fichier',
    linguaHelp: 'Pour l’instant les catalogues dédiés n’existent qu’en IT, RU et EN. Les autres langues voient le PDF italien.',
  },
  de: {
    linguaFile: 'Dateisprache',
    linguaHelp: 'Eigene Kataloge gibt es vorerst nur in IT, RU und EN. Andere Sprachen sehen die italienische PDF.',
  },
  el: {
    linguaFile: 'Γλώσσα αρχείου',
    linguaHelp: 'Προς το παρόν υπάρχουν ξεχωριστά αρχεία μόνο σε IT, RU και EN. Οι άλλες γλώσσες βλέπουν το ιταλικό PDF.',
  },
  pl: {
    linguaFile: 'Język pliku',
    linguaHelp: 'Na razie osobne katalogi są tylko w IT, RU i EN. Pozostałe języki widzą włoski PDF.',
  },
  uk: {
    linguaFile: 'Мова файлу',
    linguaHelp: 'Окремі файли поки є лише для IT, RU та EN. Інші мови бачать італійський PDF.',
  },
} as const

const login = {
  it: {
    titolo: 'Accesso Ladiva',
    descrizione: 'Inserisci le tue credenziali per visualizzare i cataloghi B2B e gestire i fornitori.',
    accedi: 'Accedi al Portale',
    registrazione: 'Richiedi registrazione portale',
    recupero: 'Recupera password',
  },
  ru: {
    titolo: 'Вход Ladiva',
    descrizione: 'Введите данные для просмотра каталогов B2B и управления поставщиками.',
    accedi: 'Войти в портал',
    registrazione: 'Запросить регистрацию',
    recupero: 'Восстановить пароль',
  },
  en: {
    titolo: 'Ladiva sign in',
    descrizione: 'Enter your credentials to view B2B catalogs and manage suppliers.',
    accedi: 'Sign in to the portal',
    registrazione: 'Request portal registration',
    recupero: 'Reset password',
  },
  fr: {
    titolo: 'Connexion Ladiva',
    descrizione: 'Saisissez vos identifiants pour voir les catalogues B2B et gérer les fournisseurs.',
    accedi: 'Accéder au portail',
    registrazione: 'Demander l’inscription',
    recupero: 'Réinitialiser le mot de passe',
  },
  de: {
    titolo: 'Ladiva-Anmeldung',
    descrizione: 'Melden Sie sich an, um B2B-Kataloge zu sehen und Lieferanten zu verwalten.',
    accedi: 'Zum Portal anmelden',
    registrazione: 'Registrierung anfragen',
    recupero: 'Passwort zurücksetzen',
  },
  el: {
    titolo: 'Είσοδος Ladiva',
    descrizione: 'Εισαγάγετε τα στοιχεία σας για καταλόγους B2B και διαχείριση προμηθευτών.',
    accedi: 'Είσοδος στην πύλη',
    registrazione: 'Αίτημα εγγραφής',
    recupero: 'Επαναφορά κωδικού',
  },
  pl: {
    titolo: 'Logowanie Ladiva',
    descrizione: 'Wpisz dane, aby zobaczyć katalogi B2B i zarządzać dostawcami.',
    accedi: 'Zaloguj się do portalu',
    registrazione: 'Poproś o rejestrację',
    recupero: 'Resetuj hasło',
  },
  uk: {
    titolo: 'Вхід Ladiva',
    descrizione: 'Введіть дані, щоб переглянути каталоги B2B і керувати постачальниками.',
    accedi: 'Увійти до порталу',
    registrazione: 'Запит на реєстрацію',
    recupero: 'Скинути пароль',
  },
} as const

const dashboard = {
  it: {
    kicker: 'Dashboard Riservata',
    kickerPublic: 'Accesso pubblico',
    titolo: 'La tua Area Riservata',
    titoloPublic: 'Cataloghi e contatti',
    welcomePublic:
      'Sfoglia i cataloghi pubblicati, consulta Dove siamo e i contatti diretti. Per aree riservate agenti/partner accedi al portale.',
    bentornato: 'Bentornato',
    utenteFree: 'Utente Free',
    inAttesa: 'In attesa di approvazione',
    gestione: 'Gestione',
    gestioneHelp: 'Seleziona la sezione che vuoi gestire.',
    gestioneUtenti: 'Gestione Utenti',
    gestioneUtentiHelp:
      'Approva registrazioni, gestisci profili, invita nuovi utenti e consulta gli operatori abilitati.',
    gestioneCataloghi: 'Gestione Cataloghi',
    gestioneCataloghiHelp:
      'Carica nuovi PDF, modifica stato e visibilità, aggiorna copertine ed elimina cataloghi.',
    apri: 'Apri',
    contattiDiretti: 'I Tuoi Contatti Diretti',
    nessunContatto: 'Non hai ancora nessun contatto diretto assegnato in rubrica.',
    assistenzaLadiva: 'Assistenza Ladiva',
    chiama: 'Chiama',
    scrivi: 'Scrivi',
    contattoSenzaNome: 'Contatto Senza Nome',
    tornaHome: '← Torna alla Home Pubblica',
    invitaUtenti: 'Invita utenti',
    invitaHelp:
      'Genera un link di registrazione per il ruolo scelto. Il nuovo utente sarà collegato al tuo profilo dopo l’approvazione.',
    inserisciAgente: 'Inserisci agente manualmente',
    inserisciVenditore: 'Inserisci venditore manualmente',
    inserisciAgenteHelp:
      'Aggiungi manualmente un agente non ancora registrato: comparirà subito nella tua struttura organizzativa.',
    inserisciVenditoreHelp:
      'Aggiungi manualmente un venditore non ancora registrato: comparirà subito nella tua struttura organizzativa.',
    inserisciBackOffice: 'Inserisci back-office manualmente',
    inserisciBackOfficeHelp:
      'Aggiungi manualmente un profilo back-office (stessi poteri dell’agente) non ancora registrato.',
    ilTuoProfilo: 'il tuo profilo',
    portaleBenvenuto: 'Benvenuto',
    portaleTitolo: 'Area Riservata',
    portaleHelp: 'Seleziona la sezione che vuoi consultare',
    elencoAssociati: 'Elenco tutti gli associati',
    elencoAssociatiHelpAgenzia:
      'Vista rapida di agenti, back-office, venditori, rivenditori e studi collegati alla tua agenzia, con il referente di riferimento.',
    elencoAssociatiHelpCompagnia:
      'Vista rapida di agenti, back-office, venditori, rivenditori e studi della tua compagnia, con il referente di riferimento.',
    elencoAssociatiHelpRivenditore:
      'Vista rapida di venditori, promoter e studi collegati al tuo rivenditore, con il referente di riferimento.',
    elencoAssociatiHelpDistributore:
      'Vista rapida di venditori, promoter e studi della tua compagnia rivenditore, con il referente di riferimento.',
    filtraAssociati: 'Filtra associati per categoria',
    nessunAssociatoCategoria: 'Nessun associato in questa categoria al momento.',
    associatoA: 'Associato a',
    associatiFallback: 'Associati',
    tabAgenti: 'Agenti',
    tabBackOffice: 'Back-Office',
    tabVenditori: 'Venditori',
    tabRivenditori: 'Rivenditori',
    tabStudi: 'Studi',
    tabPromoter: 'Promoter',
  },
  ru: {
    kicker: 'Закрытая панель',
    kickerPublic: 'Публичный доступ',
    titolo: 'Ваш закрытый раздел',
    titoloPublic: 'Каталоги и контакты',
    welcomePublic:
      'Просматривайте опубликованные каталоги, раздел «Где мы» и прямые контакты. Для разделов агентов и партнёров войдите в портал.',
    bentornato: 'С возвращением',
    utenteFree: 'Пользователь Free',
    inAttesa: 'Ожидает одобрения',
    gestione: 'Управление',
    gestioneHelp: 'Выберите раздел, которым хотите управлять.',
    gestioneUtenti: 'Управление пользователями',
    gestioneUtentiHelp:
      'Одобряйте регистрации, управляйте профилями, приглашайте пользователей и смотрите назначенных операторов.',
    gestioneCataloghi: 'Управление каталогами',
    gestioneCataloghiHelp:
      'Загружайте PDF, меняйте статус и видимость, обновляйте обложки и удаляйте каталоги.',
    apri: 'Открыть',
    contattiDiretti: 'Ваши прямые контакты',
    nessunContatto: 'В справочнике пока нет назначенных прямых контактов.',
    assistenzaLadiva: 'Поддержка Ladiva',
    chiama: 'Позвонить',
    scrivi: 'Написать',
    contattoSenzaNome: 'Контакт без имени',
    tornaHome: '← На публичную главную',
    invitaUtenti: 'Пригласить пользователей',
    invitaHelp:
      'Создайте ссылку регистрации для выбранной роли. Новый пользователь будет связан с вашим профилем после одобрения.',
    inserisciAgente: 'Добавить агента вручную',
    inserisciVenditore: 'Добавить продавца вручную',
    inserisciAgenteHelp:
      'Добавьте агента, который ещё не зарегистрирован: он сразу появится в вашей структуре.',
    inserisciVenditoreHelp:
      'Добавьте продавца, который ещё не зарегистрирован: он сразу появится в вашей структуре.',
    inserisciBackOffice: 'Добавить back-office вручную',
    inserisciBackOfficeHelp:
      'Добавьте профиль back-office (те же права, что у агента), который ещё не зарегистрирован.',
    ilTuoProfilo: 'ваш профиль',
    portaleBenvenuto: 'Добро пожаловать',
    portaleTitolo: 'Закрытый раздел',
    portaleHelp: 'Выберите раздел для просмотра',
    elencoAssociati: 'Список всех связанных',
    elencoAssociatiHelpAgenzia:
      'Краткий список агентов, back-office, продавцов, дилеров и студий вашего агентства, с указанным куратором.',
    elencoAssociatiHelpCompagnia:
      'Краткий список агентов, back-office, продавцов, дилеров и студий вашей компании, с указанным куратором.',
    elencoAssociatiHelpRivenditore:
      'Краткий список продавцов, промоутеров и студий вашего дилера, с указанным куратором.',
    elencoAssociatiHelpDistributore:
      'Краткий список продавцов, промоутеров и студий вашей дилерской компании, с указанным куратором.',
    filtraAssociati: 'Фильтр связанных по категории',
    nessunAssociatoCategoria: 'В этой категории пока нет связанных пользователей.',
    associatoA: 'Связан с',
    associatiFallback: 'Связанные',
    tabAgenti: 'Агенты',
    tabBackOffice: 'Back-Office',
    tabVenditori: 'Продавцы',
    tabRivenditori: 'Дилеры',
    tabStudi: 'Студии',
    tabPromoter: 'Промоутеры',
  },
  en: {
    kicker: 'Reserved dashboard',
    kickerPublic: 'Public access',
    titolo: 'Your reserved area',
    titoloPublic: 'Catalogs and contacts',
    welcomePublic:
      'Browse published catalogs, Where we are and direct contacts. Sign in to the portal for agent and partner areas.',
    bentornato: 'Welcome back',
    utenteFree: 'Free user',
    inAttesa: 'Pending approval',
    gestione: 'Management',
    gestioneHelp: 'Select the section you want to manage.',
    gestioneUtenti: 'User management',
    gestioneUtentiHelp:
      'Approve registrations, manage profiles, invite new users and view authorized operators.',
    gestioneCataloghi: 'Catalog management',
    gestioneCataloghiHelp:
      'Upload new PDFs, change status and visibility, update covers and delete catalogs.',
    apri: 'Open',
    contattiDiretti: 'Your direct contacts',
    nessunContatto: 'You do not have any direct contacts assigned in the directory yet.',
    assistenzaLadiva: 'Ladiva support',
    chiama: 'Call',
    scrivi: 'Email',
    contattoSenzaNome: 'Unnamed contact',
    tornaHome: '← Back to the public home',
    invitaUtenti: 'Invite users',
    invitaHelp:
      'Generate a registration link for the selected role. The new user will be linked to your profile after approval.',
    inserisciAgente: 'Add an agent manually',
    inserisciVenditore: 'Add a seller manually',
    inserisciAgenteHelp:
      'Manually add an agent who is not registered yet: they will appear immediately in your organization tree.',
    inserisciVenditoreHelp:
      'Manually add a seller who is not registered yet: they will appear immediately in your organization tree.',
    inserisciBackOffice: 'Add back-office manually',
    inserisciBackOfficeHelp:
      'Manually add a back-office profile (same powers as an agent) who is not registered yet.',
    ilTuoProfilo: 'your profile',
    portaleBenvenuto: 'Welcome',
    portaleTitolo: 'Reserved area',
    portaleHelp: 'Select the section you want to open',
    elencoAssociati: 'All associates',
    elencoAssociatiHelpAgenzia:
      'Quick view of agents, back-office, sellers, resellers and studios linked to your agency, with their referent.',
    elencoAssociatiHelpCompagnia:
      'Quick view of agents, back-office, sellers, resellers and studios in your company, with their referent.',
    elencoAssociatiHelpRivenditore:
      'Quick view of sellers, promoters and studios linked to your reseller, with their referent.',
    elencoAssociatiHelpDistributore:
      'Quick view of sellers, promoters and studios in your reseller company, with their referent.',
    filtraAssociati: 'Filter associates by category',
    nessunAssociatoCategoria: 'No associates in this category at the moment.',
    associatoA: 'Linked to',
    associatiFallback: 'Associates',
    tabAgenti: 'Agents',
    tabBackOffice: 'Back-Office',
    tabVenditori: 'Sellers',
    tabRivenditori: 'Resellers',
    tabStudi: 'Studios',
    tabPromoter: 'Promoters',
  },
  fr: {
    kicker: 'Espace réservé',
    kickerPublic: 'Accès public',
    titolo: 'Votre espace réservé',
    titoloPublic: 'Catalogues et contacts',
    welcomePublic:
      'Parcourez les catalogues publiés, Où nous sommes et les contacts directs. Connectez-vous pour les espaces agents et partenaires.',
    bentornato: 'Bon retour',
    utenteFree: 'Utilisateur Free',
    inAttesa: 'En attente d’approbation',
    gestione: 'Gestion',
    gestioneHelp: 'Sélectionnez la section à gérer.',
    gestioneUtenti: 'Gestion des utilisateurs',
    gestioneUtentiHelp:
      'Approuvez les inscriptions, gérez les profils, invitez des utilisateurs et consultez les opérateurs.',
    gestioneCataloghi: 'Gestion des catalogues',
    gestioneCataloghiHelp:
      'Téléchargez des PDF, changez statut et visibilité, mettez à jour les couvertures et supprimez des catalogues.',
    apri: 'Ouvrir',
    contattiDiretti: 'Vos contacts directs',
    nessunContatto: 'Aucun contact direct n’est encore assigné dans l’annuaire.',
    assistenzaLadiva: 'Assistance Ladiva',
    chiama: 'Appeler',
    scrivi: 'Écrire',
    contattoSenzaNome: 'Contact sans nom',
    tornaHome: '← Retour à l’accueil public',
    invitaUtenti: 'Inviter des utilisateurs',
    invitaHelp:
      'Générez un lien d’inscription pour le rôle choisi. Le nouvel utilisateur sera lié à votre profil après approbation.',
    inserisciAgente: 'Ajouter un agent manuellement',
    inserisciVenditore: 'Ajouter un vendeur manuellement',
    inserisciAgenteHelp:
      'Ajoutez un agent pas encore inscrit : il apparaîtra tout de suite dans votre structure.',
    inserisciVenditoreHelp:
      'Ajoutez un vendeur pas encore inscrit : il apparaîtra tout de suite dans votre structure.',
    inserisciBackOffice: 'Ajouter un back-office manuellement',
    inserisciBackOfficeHelp:
      'Ajoutez un profil back-office (mêmes droits qu’un agent) pas encore inscrit.',
    ilTuoProfilo: 'votre profil',
    portaleBenvenuto: 'Bienvenue',
    portaleTitolo: 'Espace réservé',
    portaleHelp: 'Sélectionnez la section à consulter',
    elencoAssociati: 'Tous les associés',
    elencoAssociatiHelpAgenzia:
      'Vue rapide des agents, back-office, vendeurs, revendeurs et studios liés à votre agence, avec le référent.',
    elencoAssociatiHelpCompagnia:
      'Vue rapide des agents, back-office, vendeurs, revendeurs et studios de votre société, avec le référent.',
    elencoAssociatiHelpRivenditore:
      'Vue rapide des vendeurs, promoteurs et studios liés à votre revendeur, avec le référent.',
    elencoAssociatiHelpDistributore:
      'Vue rapide des vendeurs, promoteurs et studios de votre société revendeur, avec le référent.',
    filtraAssociati: 'Filtrer les associés par catégorie',
    nessunAssociatoCategoria: 'Aucun associé dans cette catégorie pour le moment.',
    associatoA: 'Associé à',
    associatiFallback: 'Associés',
    tabAgenti: 'Agents',
    tabBackOffice: 'Back-Office',
    tabVenditori: 'Vendeurs',
    tabRivenditori: 'Revendeurs',
    tabStudi: 'Studios',
    tabPromoter: 'Promoteurs',
  },
  de: {
    kicker: 'Geschütztes Dashboard',
    kickerPublic: 'Öffentlicher Zugang',
    titolo: 'Ihr geschützter Bereich',
    titoloPublic: 'Kataloge und Kontakte',
    welcomePublic:
      'Sehen Sie veröffentlichte Kataloge, Wo wir sind und Direktkontakte. Für Agenten- und Partnerbereiche bitte anmelden.',
    bentornato: 'Willkommen zurück',
    utenteFree: 'Free-Nutzer',
    inAttesa: 'Wartet auf Freigabe',
    gestione: 'Verwaltung',
    gestioneHelp: 'Wählen Sie den Bereich, den Sie verwalten möchten.',
    gestioneUtenti: 'Benutzerverwaltung',
    gestioneUtentiHelp:
      'Registrierungen freigeben, Profile verwalten, Nutzer einladen und Operatoren einsehen.',
    gestioneCataloghi: 'Katalogverwaltung',
    gestioneCataloghiHelp:
      'PDFs hochladen, Status und Sichtbarkeit ändern, Cover aktualisieren und Kataloge löschen.',
    apri: 'Öffnen',
    contattiDiretti: 'Ihre Direktkontakte',
    nessunContatto: 'Im Verzeichnis ist noch kein Direktkontakt zugewiesen.',
    assistenzaLadiva: 'Ladiva-Support',
    chiama: 'Anrufen',
    scrivi: 'Schreiben',
    contattoSenzaNome: 'Kontakt ohne Namen',
    tornaHome: '← Zur öffentlichen Startseite',
    invitaUtenti: 'Nutzer einladen',
    invitaHelp:
      'Erzeugen Sie einen Registrierungslink für die gewählte Rolle. Der neue Nutzer wird nach Freigabe mit Ihrem Profil verknüpft.',
    inserisciAgente: 'Agent manuell hinzufügen',
    inserisciVenditore: 'Verkäufer manuell hinzufügen',
    inserisciAgenteHelp:
      'Fügen Sie einen noch nicht registrierten Agenten hinzu: er erscheint sofort in Ihrer Struktur.',
    inserisciVenditoreHelp:
      'Fügen Sie einen noch nicht registrierten Verkäufer hinzu: er erscheint sofort in Ihrer Struktur.',
    inserisciBackOffice: 'Back-Office manuell hinzufügen',
    inserisciBackOfficeHelp:
      'Fügen Sie ein noch nicht registriertes Back-Office-Profil hinzu (gleiche Rechte wie ein Agent).',
    ilTuoProfilo: 'Ihr Profil',
    portaleBenvenuto: 'Willkommen',
    portaleTitolo: 'Geschützter Bereich',
    portaleHelp: 'Wählen Sie den Bereich, den Sie öffnen möchten',
    elencoAssociati: 'Alle zugeordneten Kontakte',
    elencoAssociatiHelpAgenzia:
      'Schnellübersicht von Agenten, Back-Office, Verkäufern, Händlern und Studios Ihrer Agentur mit Ansprechpartner.',
    elencoAssociatiHelpCompagnia:
      'Schnellübersicht von Agenten, Back-Office, Verkäufern, Händlern und Studios Ihres Unternehmens mit Ansprechpartner.',
    elencoAssociatiHelpRivenditore:
      'Schnellübersicht von Verkäufern, Promotern und Studios Ihres Händlers mit Ansprechpartner.',
    elencoAssociatiHelpDistributore:
      'Schnellübersicht von Verkäufern, Promotern und Studios Ihres Händlerunternehmens mit Ansprechpartner.',
    filtraAssociati: 'Zugeordnete nach Kategorie filtern',
    nessunAssociatoCategoria: 'In dieser Kategorie gibt es derzeit keine zugeordneten Kontakte.',
    associatoA: 'Zugeordnet zu',
    associatiFallback: 'Zugeordnete',
    tabAgenti: 'Agenten',
    tabBackOffice: 'Back-Office',
    tabVenditori: 'Verkäufer',
    tabRivenditori: 'Händler',
    tabStudi: 'Studios',
    tabPromoter: 'Promoter',
  },
  el: {
    kicker: 'Κλειστός πίνακας',
    kickerPublic: 'Δημόσια πρόσβαση',
    titolo: 'Η περιοχή μελών σας',
    titoloPublic: 'Κατάλογοι και επαφές',
    welcomePublic:
      'Δείτε δημοσιευμένους καταλόγους, Πού είμαστε και άμεσες επαφές. Για ενότητες πρακτόρων/συνεργατών συνδεθείτε.',
    bentornato: 'Καλώς ήρθατε ξανά',
    utenteFree: 'Χρήστης Free',
    inAttesa: 'Σε αναμονή έγκρισης',
    gestione: 'Διαχείριση',
    gestioneHelp: 'Επιλέξτε την ενότητα που θέλετε να διαχειριστείτε.',
    gestioneUtenti: 'Διαχείριση χρηστών',
    gestioneUtentiHelp:
      'Εγκρίνετε εγγραφές, διαχειριστείτε προφίλ, προσκαλέστε χρήστες και δείτε τους χειριστές.',
    gestioneCataloghi: 'Διαχείριση καταλόγων',
    gestioneCataloghiHelp:
      'Ανεβάστε PDF, αλλάξτε κατάσταση και ορατότητα, ενημερώστε εξώφυλλα και διαγράψτε καταλόγους.',
    apri: 'Άνοιγμα',
    contattiDiretti: 'Οι άμεσες επαφές σας',
    nessunContatto: 'Δεν έχει οριστεί ακόμη άμεση επαφή στον κατάλογο.',
    assistenzaLadiva: 'Υποστήριξη Ladiva',
    chiama: 'Κλήση',
    scrivi: 'Μήνυμα',
    contattoSenzaNome: 'Επαφή χωρίς όνομα',
    tornaHome: '← Επιστροφή στη δημόσια αρχική',
    invitaUtenti: 'Πρόσκληση χρηστών',
    invitaHelp:
      'Δημιουργήστε σύνδεσμο εγγραφής για τον επιλεγμένο ρόλο. Ο νέος χρήστης θα συνδεθεί στο προφίλ σας μετά την έγκριση.',
    inserisciAgente: 'Προσθήκη πράκτορα χειροκίνητα',
    inserisciVenditore: 'Προσθήκη πωλητή χειροκίνητα',
    inserisciAgenteHelp:
      'Προσθέστε πράκτορα που δεν έχει εγγραφεί ακόμη: θα εμφανιστεί αμέσως στη δομή σας.',
    inserisciVenditoreHelp:
      'Προσθέστε πωλητή που δεν έχει εγγραφεί ακόμη: θα εμφανιστεί αμέσως στη δομή σας.',
    inserisciBackOffice: 'Προσθήκη back-office χειροκίνητα',
    inserisciBackOfficeHelp:
      'Προσθέστε προφίλ back-office (ίδια δικαιώματα με πράκτορα) που δεν έχει εγγραφεί ακόμη.',
    ilTuoProfilo: 'το προφίλ σας',
    portaleBenvenuto: 'Καλώς ήρθατε',
    portaleTitolo: 'Περιοχή μελών',
    portaleHelp: 'Επιλέξτε την ενότητα που θέλετε να ανοίξετε',
    elencoAssociati: 'Όλοι οι συνδεδεμένοι',
    elencoAssociatiHelpAgenzia:
      'Γρήγορη προβολή πρακτόρων, back-office, πωλητών, μεταπωλητών και στούντιο του πρακτορείου σας, με υπεύθυνο.',
    elencoAssociatiHelpCompagnia:
      'Γρήγορη προβολή πρακτόρων, back-office, πωλητών, μεταπωλητών και στούντιο της εταιρείας σας, με υπεύθυνο.',
    elencoAssociatiHelpRivenditore:
      'Γρήγορη προβολή πωλητών, promoter και στούντιο του μεταπωλητή σας, με υπεύθυνο.',
    elencoAssociatiHelpDistributore:
      'Γρήγορη προβολή πωλητών, promoter και στούντιο της εταιρείας μεταπωλητή, με υπεύθυνο.',
    filtraAssociati: 'Φίλτρο συνδεδεμένων ανά κατηγορία',
    nessunAssociatoCategoria: 'Δεν υπάρχουν συνδεδεμένοι σε αυτή την κατηγορία αυτή τη στιγμή.',
    associatoA: 'Συνδεδεμένος με',
    associatiFallback: 'Συνδεδεμένοι',
    tabAgenti: 'Πράκτορες',
    tabBackOffice: 'Back-Office',
    tabVenditori: 'Πωλητές',
    tabRivenditori: 'Μεταπωλητές',
    tabStudi: 'Στούντιο',
    tabPromoter: 'Promoter',
  },
  pl: {
    kicker: 'Panel zastrzeżony',
    kickerPublic: 'Dostęp publiczny',
    titolo: 'Twoja strefa zastrzeżona',
    titoloPublic: 'Katalogi i kontakty',
    welcomePublic:
      'Przeglądaj opublikowane katalogi, Gdzie jesteśmy i kontakty bezpośrednie. Zaloguj się, aby wejść w strefy agentów i partnerów.',
    bentornato: 'Witamy ponownie',
    utenteFree: 'Użytkownik Free',
    inAttesa: 'Oczekuje na zatwierdzenie',
    gestione: 'Zarządzanie',
    gestioneHelp: 'Wybierz sekcję, którą chcesz obsługiwać.',
    gestioneUtenti: 'Zarządzanie użytkownikami',
    gestioneUtentiHelp:
      'Zatwierdzaj rejestracje, zarządzaj profilami, zapraszaj użytkowników i przeglądaj operatorów.',
    gestioneCataloghi: 'Zarządzanie katalogami',
    gestioneCataloghiHelp:
      'Wgrywaj PDF, zmieniaj status i widoczność, aktualizuj okładki i usuwaj katalogi.',
    apri: 'Otwórz',
    contattiDiretti: 'Twoje kontakty bezpośrednie',
    nessunContatto: 'W książce nie ma jeszcze przypisanych kontaktów bezpośrednich.',
    assistenzaLadiva: 'Wsparcie Ladiva',
    chiama: 'Zadzwoń',
    scrivi: 'Napisz',
    contattoSenzaNome: 'Kontakt bez nazwy',
    tornaHome: '← Powrót do strony publicznej',
    invitaUtenti: 'Zaproś użytkowników',
    invitaHelp:
      'Wygeneruj link rejestracji dla wybranej roli. Nowy użytkownik zostanie powiązany z Twoim profilem po zatwierdzeniu.',
    inserisciAgente: 'Dodaj agenta ręcznie',
    inserisciVenditore: 'Dodaj sprzedawcę ręcznie',
    inserisciAgenteHelp:
      'Dodaj agenta, który jeszcze nie jest zarejestrowany: od razu pojawi się w Twojej strukturze.',
    inserisciVenditoreHelp:
      'Dodaj sprzedawcę, który jeszcze nie jest zarejestrowany: od razu pojawi się w Twojej strukturze.',
    inserisciBackOffice: 'Dodaj back-office ręcznie',
    inserisciBackOfficeHelp:
      'Dodaj profil back-office (te same uprawnienia co agent), który jeszcze nie jest zarejestrowany.',
    ilTuoProfilo: 'Twój profil',
    portaleBenvenuto: 'Witamy',
    portaleTitolo: 'Strefa zastrzeżona',
    portaleHelp: 'Wybierz sekcję, którą chcesz otworzyć',
    elencoAssociati: 'Wszyscy powiązani',
    elencoAssociatiHelpAgenzia:
      'Szybki podgląd agentów, back-office, sprzedawców, dystrybutorów i studiów Twojej agencji, z opiekunem.',
    elencoAssociatiHelpCompagnia:
      'Szybki podgląd agentów, back-office, sprzedawców, dystrybutorów i studiów Twojej firmy, z opiekunem.',
    elencoAssociatiHelpRivenditore:
      'Szybki podgląd sprzedawców, promoterów i studiów Twojego dystrybutora, z opiekunem.',
    elencoAssociatiHelpDistributore:
      'Szybki podgląd sprzedawców, promoterów i studiów firmy dystrybutora, z opiekunem.',
    filtraAssociati: 'Filtruj powiązanych według kategorii',
    nessunAssociatoCategoria: 'W tej kategorii nie ma teraz powiązanych użytkowników.',
    associatoA: 'Powiązany z',
    associatiFallback: 'Powiązani',
    tabAgenti: 'Agenci',
    tabBackOffice: 'Back-Office',
    tabVenditori: 'Sprzedawcy',
    tabRivenditori: 'Dystrybutorzy',
    tabStudi: 'Studia',
    tabPromoter: 'Promoterzy',
  },
  uk: {
    kicker: 'Закрита панель',
    kickerPublic: 'Публічний доступ',
    titolo: 'Ваш закритий розділ',
    titoloPublic: 'Каталоги та контакти',
    welcomePublic:
      'Переглядайте опубліковані каталоги, «Де ми» та прямі контакти. Для розділів агентів і партнерів увійдіть у портал.',
    bentornato: 'З поверненням',
    utenteFree: 'Користувач Free',
    inAttesa: 'Очікує схвалення',
    gestione: 'Керування',
    gestioneHelp: 'Оберіть розділ, яким хочете керувати.',
    gestioneUtenti: 'Керування користувачами',
    gestioneUtentiHelp:
      'Схвалюйте реєстрації, керуйте профілями, запрошуйте користувачів і переглядайте операторів.',
    gestioneCataloghi: 'Керування каталогами',
    gestioneCataloghiHelp:
      'Завантажуйте PDF, змінюйте статус і видимість, оновлюйте обкладинки та видаляйте каталоги.',
    apri: 'Відкрити',
    contattiDiretti: 'Ваші прямі контакти',
    nessunContatto: 'У довіднику ще немає призначених прямих контактів.',
    assistenzaLadiva: 'Підтримка Ladiva',
    chiama: 'Зателефонувати',
    scrivi: 'Написати',
    contattoSenzaNome: 'Контакт без імені',
    tornaHome: '← На публічну головну',
    invitaUtenti: 'Запросити користувачів',
    invitaHelp:
      'Створіть посилання реєстрації для обраної ролі. Нового користувача буде пов’язано з вашим профілем після схвалення.',
    inserisciAgente: 'Додати агента вручну',
    inserisciVenditore: 'Додати продавця вручну',
    inserisciAgenteHelp:
      'Додайте агента, який ще не зареєстрований: він одразу з’явиться у вашій структурі.',
    inserisciVenditoreHelp:
      'Додайте продавця, який ще не зареєстрований: він одразу з’явиться у вашій структурі.',
    inserisciBackOffice: 'Додати back-office вручну',
    inserisciBackOfficeHelp:
      'Додайте профіль back-office (ті самі права, що в агента), який ще не зареєстрований.',
    ilTuoProfilo: 'ваш профіль',
    portaleBenvenuto: 'Ласкаво просимо',
    portaleTitolo: 'Закритий розділ',
    portaleHelp: 'Оберіть розділ для перегляду',
    elencoAssociati: 'Усі пов’язані',
    elencoAssociatiHelpAgenzia:
      'Швидкий список агентів, back-office, продавців, дилерів і студій вашого агентства, з куратором.',
    elencoAssociatiHelpCompagnia:
      'Швидкий список агентів, back-office, продавців, дилерів і студій вашої компанії, з куратором.',
    elencoAssociatiHelpRivenditore:
      'Швидкий список продавців, промоутерів і студій вашого дилера, з куратором.',
    elencoAssociatiHelpDistributore:
      'Швидкий список продавців, промоутерів і студій дилерської компанії, з куратором.',
    filtraAssociati: 'Фільтр пов’язаних за категорією',
    nessunAssociatoCategoria: 'У цій категорії зараз немає пов’язаних користувачів.',
    associatoA: 'Пов’язаний з',
    associatiFallback: 'Пов’язані',
    tabAgenti: 'Агенти',
    tabBackOffice: 'Back-Office',
    tabVenditori: 'Продавці',
    tabRivenditori: 'Дилери',
    tabStudi: 'Студії',
    tabPromoter: 'Промоутери',
  },
} as const

export function tHeader(locale: AppLocale) {
  return header[locale]
}

export function tHome(locale: AppLocale) {
  return home[locale]
}

export function tCatalogAdmin(locale: AppLocale) {
  return catalogAdmin[locale]
}

export function tLogin(locale: AppLocale) {
  return login[locale]
}

export function tDashboard(locale: AppLocale) {
  return dashboard[locale]
}

export function tElencoAssociatiHelp(locale: AppLocale, viewerRole: string): string {
  const copy = tDashboard(locale)
  switch (viewerRole) {
    case 'agenzia':
      return copy.elencoAssociatiHelpAgenzia
    case 'agente':
    case 'back_office':
      return copy.elencoAssociatiHelpCompagnia
    case 'rivenditore':
      return copy.elencoAssociatiHelpRivenditore
    case 'distributore':
      return copy.elencoAssociatiHelpDistributore
    default:
      return copy.elencoAssociatiHelpAgenzia
  }
}

export function tElencoAssociatiTab(locale: AppLocale, ruolo: string): string {
  const copy = tDashboard(locale)
  switch (ruolo) {
    case 'agente':
      return copy.tabAgenti
    case 'back_office':
      return copy.tabBackOffice
    case 'distributore':
      return copy.tabVenditori
    case 'rivenditore':
      return copy.tabRivenditori
    case 'studio':
      return copy.tabStudi
    case 'partner_dipendente':
      return copy.tabPromoter
    default:
      return ruolo
  }
}
