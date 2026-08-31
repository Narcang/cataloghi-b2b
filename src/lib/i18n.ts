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
    linguaHelp: 'Il PDF sarà visibile solo quando l’utente seleziona questa lingua.',
  },
  ru: {
    linguaFile: 'Язык файла',
    linguaHelp: 'PDF будет виден только при выборе этого языка.',
  },
  en: {
    linguaFile: 'File language',
    linguaHelp: 'This PDF shows only when the user selects this language.',
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
