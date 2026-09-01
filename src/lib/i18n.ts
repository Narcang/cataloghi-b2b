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
