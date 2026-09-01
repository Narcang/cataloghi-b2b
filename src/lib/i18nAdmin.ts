import type { AppLocale } from '@/lib/locale'

const ruolo: Record<AppLocale, Record<string, string>> = {
  it: {
    all: 'Tutti i ruoli',
    admin: 'Admin',
    manager: 'Manager',
    agenzia: 'Agenzia',
    agente: 'Agente',
    back_office: 'Back-Office',
    rivenditore: 'Rivenditori',
    distributore: 'Venditori',
    partner_dipendente: 'Promoter',
    studio: 'Studio',
    free: 'Free',
  },
  ru: {
    all: 'Все роли',
    admin: 'Админ',
    manager: 'Менеджер',
    agenzia: 'Агентство',
    agente: 'Агент',
    back_office: 'Back-Office',
    rivenditore: 'Дилеры',
    distributore: 'Продавцы',
    partner_dipendente: 'Промоутер',
    studio: 'Студия',
    free: 'Free',
  },
  en: {
    all: 'All roles',
    admin: 'Admin',
    manager: 'Manager',
    agenzia: 'Agency',
    agente: 'Agent',
    back_office: 'Back-Office',
    rivenditore: 'Resellers',
    distributore: 'Sellers',
    partner_dipendente: 'Promoter',
    studio: 'Studio',
    free: 'Free',
  },
}

const catalogRole: Record<AppLocale, Record<string, string>> = {
  it: {
    free: 'Pubblico (ospiti / Free)',
    studio: 'Studio',
    partner_dipendente: 'Promoter',
    distributore: 'Venditori',
    rivenditore: 'Rivenditori',
    agente: 'Agente',
    back_office: 'Back-Office',
    agenzia: 'Agenzia',
    manager: 'Manager',
  },
  ru: {
    free: 'Публичный (гости / Free)',
    studio: 'Студия',
    partner_dipendente: 'Промоутер',
    distributore: 'Продавцы',
    rivenditore: 'Дилеры',
    agente: 'Агент',
    back_office: 'Back-Office',
    agenzia: 'Агентство',
    manager: 'Менеджер',
  },
  en: {
    free: 'Public (guests / Free)',
    studio: 'Studio',
    partner_dipendente: 'Promoter',
    distributore: 'Sellers',
    rivenditore: 'Resellers',
    agente: 'Agent',
    back_office: 'Back-Office',
    agenzia: 'Agency',
    manager: 'Manager',
  },
}

const admin = {
  it: {
    versioneMonitorata: 'Versione monitorata',
    monitoraggioMercato: 'Monitoraggio mercato',
    italia: 'Italia',
    russia: 'Russia',
    english: 'English',
    caricaMercato: 'Caricamento mercato non riuscito',
    salvaMercato: 'Salvataggio non riuscito',
    gestioneUtenti: 'Gestione Utenti',
    gestioneRivenditori: 'Gestione Rivenditori',
    gestioneRivenditoriHelp: 'Aggiorna espositori e box dei rivenditori collegati alla tua agenzia.',
    filtraUtenti: 'Filtra utenti',
    filtraUtentiHelp: 'Filtra per ruolo e/o per nome.',
    cercaNome: 'Cerca per nome',
    placeholderNome: 'Es. Fabio',
    applica: 'Applica',
    struttura: 'Struttura Organizzativa',
    strutturaHelp: 'Scegli il ruolo di partenza e clicca su un profilo per espandere gli associati a cascata.',
    filtraStruttura: 'Filtra struttura per ruolo',
    areaNonIndicata: 'Area non indicata',
    utenteSenzaNome: 'Utente senza nome',
    seguitoDa: 'Seguito da',
    invitaUtenti: 'Invita utenti',
    invitaHelp:
      'Genera un link di registrazione per il ruolo scelto. Il nuovo utente sarà collegato al tuo profilo dopo l’approvazione.',
    gestioneUtentiPanel: 'Gestione utenti',
    gestioneUtentiPanelHelp:
      'Approva le registrazioni, aggiorna i dati o elimina account, associa i contatti visibili nella rubrica.',
    registrazioniAttesa: 'Registrazioni in attesa',
    nessunaAttesa: 'Nessuna registrazione in attesa.',
    utentiAssociati: 'Utenti e operatori associati',
    rivenditoriAssociati: 'Rivenditori associati',
    eliminaUtente: 'Elimina utente',
    eliminazione: 'Eliminazione…',
    gestioneCataloghi: 'Gestione Cataloghi',
    filtraCataloghi: 'Filtra cataloghi',
    filtraCataloghiHelp: 'Cerca per titolo catalogo.',
    cercaCatalogo: 'Cerca per nome catalogo',
    cerca: 'Cerca',
    nuovoCatalogo: 'Nuovo Catalogo',
    nuovoCatalogoHelp: 'Carica il PDF del catalogo e definisci i ruoli e lo stato di pubblicazione.',
    cataloghi: 'Cataloghi',
    tutteLingue: 'Tutte',
    linguaCataloghi: 'Lingua cataloghi',
    enVedeIt:
      'Gli utenti English vedono i PDF italiani se non esiste una versione EN dedicata dello stesso catalogo.',
    pubblicato: 'Pubblicato',
    bozzaNascosto: 'Bozza / Nascosto',
    senzaCategoria: 'Senza categoria',
    statoVisibilita: 'Stato Visibilità',
    salvaStato: 'Salva Stato',
    aggiornaCopertina: 'Aggiorna copertina (A4 verticale)',
    rimuoviCopertina: 'Rimuovi copertina attuale',
    salvaCopertina: 'Salva Copertina',
    chiPuoVedere: 'Chi può vedere questo catalogo',
    salvaVisibilita: 'Salva Visibilità',
    eliminaCatalogo: 'Elimina catalogo (azione irreversibile)',
    eliminaCatalogoBtn: 'Elimina Catalogo',
    nessunCatalogoMercato: 'Nessun catalogo sul mercato',
    nessunCatalogoLingua: 'Nessun catalogo in',
    caricaOppureTutte:
      'Carica un file in questa lingua dalla sezione Nuovo Catalogo, oppure apri la scheda Tutte.',
    nessunFileArchivio: 'Non risulta nessun file in archivio. Puoi caricarne uno dalla sezione Nuovo Catalogo.',
    importRuTitle: 'Cataloghi Russia',
    importRuHelp:
      'Copia PDF e copertine dal progetto Russia in questo database, con lingua ru. I file italiani restano invariati.',
    importRuTrovati: 'Cataloghi trovati sul progetto Russia',
    importRuBtn: 'Importa cataloghi Russia',
    importRuWait: 'Verifica archivio Russia…',
    importRuLoading: 'Copia in corso…',
    titoloCatalogo: 'Titolo Catalogo',
    categoria: 'Categoria',
    selezionaCategoria: 'Seleziona categoria',
    stato: 'Stato',
    bozza: 'Bozza',
    attivo: 'Attivo',
    creaCatalogo: 'Crea Catalogo',
    caricamento: 'Caricamento…',
    almenoUnRuolo: 'Seleziona almeno un ruolo.',
    copertina: 'Copertina (immagine A4 verticale, opzionale)',
    confirmImportRu:
      'Copiare i cataloghi dal progetto Russia a questo sito, come file in lingua russa? I PDF italiani non vengono toccati.',
    russiaEnvHelp:
      'Versione Russia: collegare NEXT_PUBLIC_SUPABASE_URL_RU e SUPABASE_SERVICE_ROLE_KEY_RU su Vercel.',
    configuraRu: 'Configura Supabase RU nelle env',
    headingAgenzie: 'Agenzie',
    headingStudi: 'Studi',
    nestedManager: 'Agenzie / agenti / back-office associati',
    nestedAgenzia: 'Agenti / back-office / rivenditori associati',
    nestedAgente: 'Studi associati',
    nestedRivenditore: 'Venditori / promoter / studi associati',
    nestedDistributore: 'Promoter / studi associati',
    nestedDefault: 'Associati',
    tuoiAssociati: 'I Tuoi Associati',
    strutturaAgenzia: 'Struttura Agenzia',
    descAgente: 'I rivenditori collegati al tuo profilo e i loro associati.',
    descBackOffice: 'I rivenditori collegati al tuo profilo e i loro associati.',
    descRivenditore: 'I venditori, promoter e studi collegati al tuo profilo.',
    descDistributore: 'I promoter e gli studi collegati al tuo profilo.',
    descAgenziaAgent:
      "La tua agenzia: prima gli agenti e il back-office, poi i rivenditori collegati all'agenzia (non sotto il singolo agente).",
    descAgenziaOwner:
      'Gli agenti, il back-office, i rivenditori e i loro associati collegati al tuo profilo.',
    descAssociatiDefault: 'Gli associati collegati al tuo profilo.',
    nessunAssociatoLivello: 'Nessun associato a questo livello.',
    nessunAssociatoProfilo: 'Nessun associato collegato al tuo profilo.',
    nessunUtenteRuolo: 'Nessun utente con ruolo',
    nelFiltroCorrente: 'nel filtro corrente.',
    comprimi: 'Comprimi',
    espandi: 'Espandi',
    nessunCatalogoCategoria: 'Nessun catalogo in questa categoria.',
    nessunaImmagine: 'Nessuna Immagine',
    erroreCaricamento: 'Errore nel caricamento',
    staiMonitorandoRu:
      'Stai monitorando la versione Russia, il cui archivio è separato da quello italiano.',
    cataloghiItaliaSwitch:
      'Sul mercato Italia risultano {n} cataloghi: seleziona Italia nello switcher in alto per vederli.',
    selezionaItalia:
      'Seleziona Italia nello switcher in alto per vedere i cataloghi del portale italiano.',
    placeholderCatalogo: 'Es. Family 15',
    gestioneUtentiPanelHelpAgenzia:
      'Aggiorna espositori e box dei rivenditori collegati alla tua agenzia. Gli altri dati del profilo restano in sola lettura.',
    listaRivenditoriHelp:
      'Elenco dei rivenditori collegati alla tua agenzia (ordine alfabetico). Apri un profilo per aggiornare espositori e box.',
    listaUtentiHelp:
      'Elenco filtrato come il Filtro Manager (area). Scegli un ruolo per vedere solo quegli utenti (ordine alfabetico). Per ogni profilo puoi modificare i dati e spuntare i contatti in rubrica.',
    filtraPerRuolo: 'Filtra utenti per ruolo',
    nessunRivenditoreAgenzia: 'Nessun rivenditore collegato alla tua agenzia.',
    nessunUtenteRuoloFiltro: 'Nessun utente con questo ruolo nel filtro area corrente.',
    inAttesa: 'in attesa',
    areaNonDefinita: 'Area non definita',
    campoNome: 'Nome completo',
    campoEmail: 'Email (profilo)',
    campoTelefono: 'Telefono',
    campoSocieta: 'Società',
    campoArea: 'Area geografica',
    campoRuolo: 'Ruolo',
    placeholderArea: 'Es. MONDO, Emilia Romagna',
    placeholderSeguito: 'Es. nome agente o referente',
    approvaReg: 'Approva registrazione (accesso ai cataloghi secondo ruolo e area)',
    registrazioneApprovata: 'Registrazione approvata',
    salvaConferma: 'Salva e conferma',
    salvaProfilo: 'Salva profilo',
    eliminaConfirm:
      'Eliminare definitivamente questo utente? Verranno rimossi profilo, accesso al portale e collegamenti in rubrica. L’operazione non è annullabile.',
    profiloSolaLettura: 'Profilo in sola lettura.',
    visualizzazioneManager: 'Visualizzazione in sola lettura (ruolo Manager).',
    profiloAdminAccount: 'Profilo admin o il tuo account: modifica da Supabase se necessario.',
    salvaEspositori: 'Salva espositori e box',
    salvaSpecializzazione: 'Salva specializzazione',
    editRivenditoreHelp:
      'Puoi aggiornare espositori e box di questo rivenditore. Gli altri dati del profilo restano in sola lettura.',
    editAgenziaHelp:
      'Puoi aggiornare strumenti lavoro agente, cataloghi, espositori e box. Gli altri dati del profilo restano in sola lettura.',
    associaProfilo: 'Associa profilo',
    senzaNome: 'Senza nome',
    invitaUnUtente: 'Invita un utente',
    invitaFormHelp:
      'Genera un link monouso. Chi si registra tramite questo link ottiene il ruolo selezionato e viene collegato automaticamente al tuo profilo dopo l’approvazione.',
    selezionaRuolo: '— Seleziona ruolo —',
    generaLink: 'Genera link',
    generazione: 'Generazione…',
    linkPermanente: 'Link permanente — può essere usato da più persone (non si disattiva)',
    linkInvito: 'Link di invito',
    copia: 'Copia',
    copiato: 'Copiato!',
    linkPermanenteHint: 'Link permanente: può essere usato da più persone.',
    linkMonousoHint: 'Link monouso: si disattiva dopo la prima registrazione.',
  },
  ru: {
    versioneMonitorata: 'Отслеживаемая версия',
    monitoraggioMercato: 'Мониторинг рынка',
    italia: 'Италия',
    russia: 'Россия',
    english: 'English',
    caricaMercato: 'Не удалось загрузить рынок',
    salvaMercato: 'Не удалось сохранить',
    gestioneUtenti: 'Управление пользователями',
    gestioneRivenditori: 'Управление дилерами',
    gestioneRivenditoriHelp: 'Обновляйте экспозиторы и боксы дилеров вашего агентства.',
    filtraUtenti: 'Фильтр пользователей',
    filtraUtentiHelp: 'Фильтр по роли и/или имени.',
    cercaNome: 'Поиск по имени',
    placeholderNome: 'Напр. Fabio',
    applica: 'Применить',
    struttura: 'Организационная структура',
    strutturaHelp: 'Выберите начальную роль и нажмите на профиль, чтобы раскрыть связанных пользователей.',
    filtraStruttura: 'Фильтр структуры по роли',
    areaNonIndicata: 'Регион не указан',
    utenteSenzaNome: 'Пользователь без имени',
    seguitoDa: 'Сопровождает',
    invitaUtenti: 'Пригласить пользователей',
    invitaHelp: 'Создайте ссылку регистрации для выбранной роли. Новый пользователь будет связан с вашим профилем после одобрения.',
    gestioneUtentiPanel: 'Управление пользователями',
    gestioneUtentiPanelHelp: 'Одобряйте регистрации, обновляйте данные или удаляйте аккаунты.',
    registrazioniAttesa: 'Регистрации в ожидании',
    nessunaAttesa: 'Нет регистраций в ожидании.',
    utentiAssociati: 'Связанные пользователи и операторы',
    rivenditoriAssociati: 'Связанные дилеры',
    eliminaUtente: 'Удалить пользователя',
    eliminazione: 'Удаление…',
    gestioneCataloghi: 'Управление каталогами',
    filtraCataloghi: 'Фильтр каталогов',
    filtraCataloghiHelp: 'Поиск по названию каталога.',
    cercaCatalogo: 'Поиск по названию каталога',
    cerca: 'Искать',
    nuovoCatalogo: 'Новый каталог',
    nuovoCatalogoHelp: 'Загрузите PDF и задайте роли и статус публикации.',
    cataloghi: 'Каталоги',
    tutteLingue: 'Все',
    linguaCataloghi: 'Язык каталогов',
    enVedeIt: 'Пользователи English видят итальянские PDF, если нет отдельной версии EN.',
    pubblicato: 'Опубликован',
    bozzaNascosto: 'Черновик / скрыт',
    senzaCategoria: 'Без категории',
    statoVisibilita: 'Видимость',
    salvaStato: 'Сохранить статус',
    aggiornaCopertina: 'Обновить обложку (A4 вертикальная)',
    rimuoviCopertina: 'Удалить текущую обложку',
    salvaCopertina: 'Сохранить обложку',
    chiPuoVedere: 'Кто может видеть этот каталог',
    salvaVisibilita: 'Сохранить видимость',
    eliminaCatalogo: 'Удалить каталог (необратимо)',
    eliminaCatalogoBtn: 'Удалить каталог',
    nessunCatalogoMercato: 'Нет каталогов на рынке',
    nessunCatalogoLingua: 'Нет каталогов на',
    caricaOppureTutte: 'Загрузите файл на этом языке или откройте вкладку Все.',
    nessunFileArchivio: 'В архиве нет файлов. Загрузите один в разделе Новый каталог.',
    importRuTitle: 'Каталоги России',
    importRuHelp: 'Копирует PDF с проекта Russia в эту базу с языком ru. Итальянские файлы не меняются.',
    importRuTrovati: 'Каталоги на проекте Russia',
    importRuBtn: 'Импортировать каталоги Russia',
    importRuWait: 'Проверка архива Russia…',
    importRuLoading: 'Копирование…',
    titoloCatalogo: 'Название каталога',
    categoria: 'Категория',
    selezionaCategoria: 'Выберите категорию',
    stato: 'Статус',
    bozza: 'Черновик',
    attivo: 'Активен',
    creaCatalogo: 'Создать каталог',
    caricamento: 'Загрузка…',
    almenoUnRuolo: 'Выберите хотя бы одну роль.',
    copertina: 'Обложка (изображение A4 вертикальное, необязательно)',
    confirmImportRu: 'Скопировать каталоги с проекта Russia на этот сайт как русские файлы? Итальянские PDF не изменятся.',
    russiaEnvHelp:
      'Версия Россия: задайте NEXT_PUBLIC_SUPABASE_URL_RU и SUPABASE_SERVICE_ROLE_KEY_RU на Vercel.',
    configuraRu: 'Настройте Supabase RU в переменных окружения',
    headingAgenzie: 'Агентства',
    headingStudi: 'Студии',
    nestedManager: 'Связанные агентства / агенты / back-office',
    nestedAgenzia: 'Связанные агенты / back-office / дилеры',
    nestedAgente: 'Связанные студии',
    nestedRivenditore: 'Связанные продавцы / промоутеры / студии',
    nestedDistributore: 'Связанные промоутеры / студии',
    nestedDefault: 'Связанные',
    tuoiAssociati: 'Ваши связанные пользователи',
    strutturaAgenzia: 'Структура агентства',
    descAgente: 'Дилеры, связанные с вашим профилем, и их контакты.',
    descBackOffice: 'Дилеры, связанные с вашим профилем, и их контакты.',
    descRivenditore: 'Продавцы, промоутеры и студии, связанные с вашим профилем.',
    descDistributore: 'Промоутеры и студии, связанные с вашим профилем.',
    descAgenziaAgent:
      'Ваше агентство: сначала агенты и back-office, затем дилеры агентства (не под отдельным агентом).',
    descAgenziaOwner: 'Агенты, back-office, дилеры и связанные с вашим профилем пользователи.',
    descAssociatiDefault: 'Пользователи, связанные с вашим профилем.',
    nessunAssociatoLivello: 'На этом уровне нет связанных пользователей.',
    nessunAssociatoProfilo: 'К вашему профилю не привязаны пользователи.',
    nessunUtenteRuolo: 'Нет пользователей с ролью',
    nelFiltroCorrente: 'в текущем фильтре.',
    comprimi: 'Свернуть',
    espandi: 'Развернуть',
    nessunCatalogoCategoria: 'В этой категории нет каталогов.',
    nessunaImmagine: 'Нет изображения',
    erroreCaricamento: 'Ошибка загрузки',
    staiMonitorandoRu: 'Вы просматриваете версию Россия: архив отделён от итальянского.',
    cataloghiItaliaSwitch:
      'На рынке Италия {n} каталогов: выберите Италия в переключателе выше, чтобы увидеть их.',
    selezionaItalia: 'Выберите Италия в переключателе выше, чтобы увидеть каталоги итальянского портала.',
    placeholderCatalogo: 'Напр. Family 15',
    gestioneUtentiPanelHelpAgenzia:
      'Обновляйте экспозиторы и боксы дилеров вашего агентства. Остальные данные профиля только для чтения.',
    listaRivenditoriHelp:
      'Список дилеров вашего агентства (по алфавиту). Откройте профиль, чтобы обновить экспозиторы и боксы.',
    listaUtentiHelp:
      'Список по фильтру менеджера (регион). Выберите роль, чтобы видеть только этих пользователей.',
    filtraPerRuolo: 'Фильтр пользователей по роли',
    nessunRivenditoreAgenzia: 'К вашему агентству не привязаны дилеры.',
    nessunUtenteRuoloFiltro: 'Нет пользователей с этой ролью в текущем фильтре региона.',
    inAttesa: 'ожидание',
    areaNonDefinita: 'Регион не указан',
    campoNome: 'Полное имя',
    campoEmail: 'Email (профиль)',
    campoTelefono: 'Телефон',
    campoSocieta: 'Компания',
    campoArea: 'Регион',
    campoRuolo: 'Роль',
    placeholderArea: 'Напр. MONDO, Emilia Romagna',
    placeholderSeguito: 'Напр. имя агента',
    approvaReg: 'Одобрить регистрацию (доступ к каталогам по роли и региону)',
    registrazioneApprovata: 'Регистрация одобрена',
    salvaConferma: 'Сохранить и подтвердить',
    salvaProfilo: 'Сохранить профиль',
    eliminaConfirm:
      'Удалить этого пользователя навсегда? Будут удалены профиль, доступ к порталу и связи. Операцию нельзя отменить.',
    profiloSolaLettura: 'Профиль только для чтения.',
    visualizzazioneManager: 'Только просмотр (роль менеджера).',
    profiloAdminAccount: 'Профиль администратора или ваш аккаунт: при необходимости измените в Supabase.',
    salvaEspositori: 'Сохранить экспозиторы и боксы',
    salvaSpecializzazione: 'Сохранить специализацию',
    editRivenditoreHelp:
      'Можно обновить экспозиторы и боксы этого дилера. Остальные данные профиля только для чтения.',
    editAgenziaHelp:
      'Можно обновить инструменты агента, каталоги, экспозиторы и боксы. Остальные данные только для чтения.',
    associaProfilo: 'Связать профиль',
    senzaNome: 'Без имени',
    invitaUnUtente: 'Пригласить пользователя',
    invitaFormHelp:
      'Создайте одноразовую ссылку. Зарегистрированный пользователь получит выбранную роль и будет связан с вашим профилем после одобрения.',
    selezionaRuolo: '— Выберите роль —',
    generaLink: 'Создать ссылку',
    generazione: 'Создание…',
    linkPermanente: 'Постоянная ссылка — могут использовать несколько человек',
    linkInvito: 'Ссылка-приглашение',
    copia: 'Копировать',
    copiato: 'Скопировано!',
    linkPermanenteHint: 'Постоянная ссылка: могут использовать несколько человек.',
    linkMonousoHint: 'Одноразовая ссылка: отключается после первой регистрации.',
  },
  en: {
    versioneMonitorata: 'Monitored version',
    monitoraggioMercato: 'Market monitoring',
    italia: 'Italy',
    russia: 'Russia',
    english: 'English',
    caricaMercato: 'Could not load monitored version',
    salvaMercato: 'Could not save',
    gestioneUtenti: 'User management',
    gestioneRivenditori: 'Reseller management',
    gestioneRivenditoriHelp: 'Update displays and boxes for resellers linked to your agency.',
    filtraUtenti: 'Filter users',
    filtraUtentiHelp: 'Filter by role and/or name.',
    cercaNome: 'Search by name',
    placeholderNome: 'e.g. Fabio',
    applica: 'Apply',
    struttura: 'Organizational structure',
    strutturaHelp: 'Choose the starting role and click a profile to expand linked associates.',
    filtraStruttura: 'Filter structure by role',
    areaNonIndicata: 'Area not specified',
    utenteSenzaNome: 'Unnamed user',
    seguitoDa: 'Followed by',
    invitaUtenti: 'Invite users',
    invitaHelp:
      'Generate a registration link for the selected role. The new user will be linked to your profile after approval.',
    gestioneUtentiPanel: 'User management',
    gestioneUtentiPanelHelp:
      'Approve registrations, update details or delete accounts, and link contacts visible in the directory.',
    registrazioniAttesa: 'Pending registrations',
    nessunaAttesa: 'No pending registrations.',
    utentiAssociati: 'Linked users and operators',
    rivenditoriAssociati: 'Linked resellers',
    eliminaUtente: 'Delete user',
    eliminazione: 'Deleting…',
    gestioneCataloghi: 'Catalog management',
    filtraCataloghi: 'Filter catalogs',
    filtraCataloghiHelp: 'Search by catalog title.',
    cercaCatalogo: 'Search by catalog name',
    cerca: 'Search',
    nuovoCatalogo: 'New catalog',
    nuovoCatalogoHelp: 'Upload the catalog PDF and set roles and publication status.',
    cataloghi: 'Catalogs',
    tutteLingue: 'All',
    linguaCataloghi: 'Catalog language',
    enVedeIt:
      'English users see Italian PDFs if there is no dedicated EN version of the same catalog.',
    pubblicato: 'Published',
    bozzaNascosto: 'Draft / Hidden',
    senzaCategoria: 'No category',
    statoVisibilita: 'Visibility status',
    salvaStato: 'Save status',
    aggiornaCopertina: 'Update cover (vertical A4)',
    rimuoviCopertina: 'Remove current cover',
    salvaCopertina: 'Save cover',
    chiPuoVedere: 'Who can see this catalog',
    salvaVisibilita: 'Save visibility',
    eliminaCatalogo: 'Delete catalog (cannot be undone)',
    eliminaCatalogoBtn: 'Delete catalog',
    nessunCatalogoMercato: 'No catalogs on market',
    nessunCatalogoLingua: 'No catalogs in',
    caricaOppureTutte: 'Upload a file in this language from New catalog, or open the All tab.',
    nessunFileArchivio: 'No files in the archive. You can upload one from New catalog.',
    importRuTitle: 'Russia catalogs',
    importRuHelp:
      'Copy PDFs and covers from the Russia project into this database, with language ru. Italian files stay unchanged.',
    importRuTrovati: 'Catalogs found on the Russia project',
    importRuBtn: 'Import Russia catalogs',
    importRuWait: 'Checking Russia archive…',
    importRuLoading: 'Copying…',
    titoloCatalogo: 'Catalog title',
    categoria: 'Category',
    selezionaCategoria: 'Select category',
    stato: 'Status',
    bozza: 'Draft',
    attivo: 'Active',
    creaCatalogo: 'Create catalog',
    caricamento: 'Uploading…',
    almenoUnRuolo: 'Select at least one role.',
    copertina: 'Cover (vertical A4 image, optional)',
    confirmImportRu:
      'Copy catalogs from the Russia project to this site as Russian files? Italian PDFs will not be changed.',
    russiaEnvHelp:
      'Russia version: set NEXT_PUBLIC_SUPABASE_URL_RU and SUPABASE_SERVICE_ROLE_KEY_RU on Vercel.',
    configuraRu: 'Configure RU Supabase in env vars',
    headingAgenzie: 'Agencies',
    headingStudi: 'Studios',
    nestedManager: 'Linked agencies / agents / back-office',
    nestedAgenzia: 'Linked agents / back-office / resellers',
    nestedAgente: 'Linked studios',
    nestedRivenditore: 'Linked sellers / promoters / studios',
    nestedDistributore: 'Linked promoters / studios',
    nestedDefault: 'Associates',
    tuoiAssociati: 'Your associates',
    strutturaAgenzia: 'Agency structure',
    descAgente: 'Resellers linked to your profile and their associates.',
    descBackOffice: 'Resellers linked to your profile and their associates.',
    descRivenditore: 'Sellers, promoters and studios linked to your profile.',
    descDistributore: 'Promoters and studios linked to your profile.',
    descAgenziaAgent:
      'Your agency: agents and back-office first, then resellers linked to the agency (not under a single agent).',
    descAgenziaOwner: 'Agents, back-office, resellers and their associates linked to your profile.',
    descAssociatiDefault: 'Associates linked to your profile.',
    nessunAssociatoLivello: 'No associates at this level.',
    nessunAssociatoProfilo: 'No associates linked to your profile.',
    nessunUtenteRuolo: 'No users with role',
    nelFiltroCorrente: 'in the current filter.',
    comprimi: 'Collapse',
    espandi: 'Expand',
    nessunCatalogoCategoria: 'No catalogs in this category.',
    nessunaImmagine: 'No image',
    erroreCaricamento: 'Failed to load',
    staiMonitorandoRu: 'You are monitoring the Russia version, whose archive is separate from the Italian one.',
    cataloghiItaliaSwitch:
      'The Italy market has {n} catalogs: select Italy in the switcher above to see them.',
    selezionaItalia: 'Select Italy in the switcher above to see the Italian portal catalogs.',
    placeholderCatalogo: 'e.g. Family 15',
    gestioneUtentiPanelHelpAgenzia:
      'Update displays and boxes for resellers linked to your agency. Other profile data stays read-only.',
    listaRivenditoriHelp:
      'Resellers linked to your agency (alphabetical). Open a profile to update displays and boxes.',
    listaUtentiHelp:
      'Filtered like the Manager filter (area). Choose a role to see only those users (alphabetical). For each profile you can edit details and tick directory contacts.',
    filtraPerRuolo: 'Filter users by role',
    nessunRivenditoreAgenzia: 'No resellers linked to your agency.',
    nessunUtenteRuoloFiltro: 'No users with this role in the current area filter.',
    inAttesa: 'pending',
    areaNonDefinita: 'Area not specified',
    campoNome: 'Full name',
    campoEmail: 'Email (profile)',
    campoTelefono: 'Phone',
    campoSocieta: 'Company',
    campoArea: 'Geographic area',
    campoRuolo: 'Role',
    placeholderArea: 'e.g. WORLD, Emilia Romagna',
    placeholderSeguito: 'e.g. agent or contact name',
    approvaReg: 'Approve registration (catalog access by role and area)',
    registrazioneApprovata: 'Registration approved',
    salvaConferma: 'Save and confirm',
    salvaProfilo: 'Save profile',
    eliminaConfirm:
      'Permanently delete this user? Profile, portal access and directory links will be removed. This cannot be undone.',
    profiloSolaLettura: 'Read-only profile.',
    visualizzazioneManager: 'Read-only view (Manager role).',
    profiloAdminAccount: 'Admin profile or your own account: edit in Supabase if needed.',
    salvaEspositori: 'Save displays and boxes',
    salvaSpecializzazione: 'Save specialization',
    editRivenditoreHelp:
      'You can update displays and boxes for this reseller. Other profile data stays read-only.',
    editAgenziaHelp:
      'You can update agent tools, catalogs, displays and boxes. Other profile data stays read-only.',
    associaProfilo: 'Link profile',
    senzaNome: 'Unnamed',
    invitaUnUtente: 'Invite a user',
    invitaFormHelp:
      'Generate a one-time link. Anyone who registers with it gets the selected role and is linked to your profile after approval.',
    selezionaRuolo: '— Select role —',
    generaLink: 'Generate link',
    generazione: 'Generating…',
    linkPermanente: 'Permanent link — can be used by more than one person',
    linkInvito: 'Invite link',
    copia: 'Copy',
    copiato: 'Copied!',
    linkPermanenteHint: 'Permanent link: can be used by more than one person.',
    linkMonousoHint: 'One-time link: disabled after the first registration.',
  },
} as const

export function tAdmin(locale: AppLocale) {
  return admin[locale]
}

export function tRuolo(locale: AppLocale, ruoloKey: string): string {
  return ruolo[locale][ruoloKey] ?? ruoloKey
}

export function tCatalogRole(locale: AppLocale, ruoloKey: string): string {
  return catalogRole[locale][ruoloKey] ?? ruoloKey
}

export function tAssociatiCount(locale: AppLocale, count: number): string {
  if (locale === 'en') return count === 1 ? '1 associate' : `${count} associates`
  if (locale === 'ru') return count === 1 ? '1 связанный' : `${count} связанных`
  return count === 1 ? '1 associato' : `${count} associati`
}

export function tHierarchyRootHeading(locale: AppLocale, rootRole: string): string {
  const copy = tAdmin(locale)
  if (rootRole === 'agenzia') return copy.headingAgenzie
  if (rootRole === 'studio') return copy.headingStudi
  return tRuolo(locale, rootRole)
}

export function tNestedAssociati(locale: AppLocale, ruoloKey: string): string | null {
  const copy = tAdmin(locale)
  switch (ruoloKey) {
    case 'manager':
      return copy.nestedManager
    case 'agenzia':
      return copy.nestedAgenzia
    case 'agente':
    case 'back_office':
    case 'partner_dipendente':
      return copy.nestedAgente
    case 'rivenditore':
      return copy.nestedRivenditore
    case 'distributore':
      return copy.nestedDistributore
    default:
      return copy.nestedDefault
  }
}

export function tCatalogCount(locale: AppLocale, count: number): string {
  if (locale === 'en') return count === 1 ? '1 catalog' : `${count} catalogs`
  if (locale === 'ru') return count === 1 ? '1 каталог' : `${count} каталогов`
  return count === 1 ? '1 catalogo' : `${count} cataloghi`
}

export function tRivenditoriCount(locale: AppLocale, count: number): string {
  if (locale === 'en') return count === 1 ? '1 reseller' : `${count} resellers`
  if (locale === 'ru') return count === 1 ? '1 дилер' : `${count} дилеров`
  return count === 1 ? '1 rivenditore' : `${count} rivenditori`
}

export function tVersioneMonitorataValue(
  locale: AppLocale,
  mercato: 'it' | 'ru',
): string {
  const copy = tAdmin(locale)
  if (mercato === 'ru') return copy.russia
  if (locale === 'en') return copy.english
  return copy.italia
}
