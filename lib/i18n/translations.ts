export type TranslationKey = keyof typeof translations.en

export const translations = {
  en: {
    // Sidebar
    overview: "Overview",
    contracts: "Contracts",
    newContract: "New contract",
    users: "Users",
    profileSettings: "Profile Settings",
    workspace: "Workspace",
    contractManager: "Contract Manager",
    universalService: "Universal Service 2006",
    
    // Header
    signOut: "Sign out",
    
    // Dashboard
    welcomeBack: "Welcome back",
    dashboardOverview: "Overview of retailer contracts in your scope.",
    totalRetailers: "Total retailers",
    signedContracts: "Signed contracts",
    pendingContracts: "Pending contracts",
    generated: "Generated",
    recentContracts: "Recent Contracts",
    viewAll: "View all",
    
    // Common
    branch: "Branch",
    role: "Role",
    status: "Status",
    date: "Date",
    actions: "Actions",
    search: "Search",
    loading: "Loading...",
    allStatuses: "All statuses",
    company: "Company",
    shop: "Shop",
    city: "City",
    zone: "Zone",
    created: "Created",
    open: "Open",
    delete: "Delete",
    confirmDelete: "Delete contract for {name}? This cannot be undone.",
    noContractsFound: "No contracts match your filters.",
    searchPlaceholder: "Search company, shop, city, email",
    deleteSuccess: "Contract deleted",
    deleteError: "Error deleting contract",
    
    // Users
    staffMember: "Staff Member",
    roleAndAccess: "Role & Access",
    assignments: "Assignments",
    accountStatus: "Account Status",
    unassigned: "UNASSIGNED",
    noStaffFound: "No staff members found",
    userDeleted: "User deleted successfully",
    resetLinkSent: "Reset link sent to {email}",
    tempPasswordGenerated: "Temporary password generated for {name}",
    copiedToClipboard: "Copied to clipboard",
    confirmDeleteUser: "Are you sure you want to delete {name}? This action cannot be undone.",
    edit: "Edit",
    sendResetEmail: "Send Reset Email",
    setTempPassword: "Set Temporary Password",
    northRegion: "NORTH REGION",
    southRegion: "SOUTH REGION",
    italy: "ITALY",
    
    // Auth
    login: "Login",
    email: "Email",
    password: "Password",
    forgotPassword: "Forgot password?",
    
    // Roles
    admin: "ADMIN",
    manager: "MANAGER",
    agent: "AGENT",
  },
  it: {
    // Sidebar
    overview: "Panoramica",
    contracts: "Contratti",
    newContract: "Nuovo contratto",
    users: "Utenti",
    profileSettings: "Impostazioni Profilo",
    workspace: "Area di lavoro",
    contractManager: "Gestore Contratti",
    universalService: "Servizio Universale 2006",
    
    // Header
    signOut: "Esci",
    
    // Dashboard
    welcomeBack: "Bentornato",
    dashboardOverview: "Panoramica dei contratti dei rivenditori nel tuo ambito.",
    totalRetailers: "Rivenditori totali",
    signedContracts: "Contratti firmati",
    pendingContracts: "Contratti in attesa",
    generated: "Generati",
    recentContracts: "Contratti Recenti",
    viewAll: "Mostra tutto",
    
    // Common
    branch: "Filiale",
    role: "Ruolo",
    status: "Stato",
    date: "Data",
    actions: "Azioni",
    search: "Cerca",
    loading: "Caricamento...",
    allStatuses: "Tutti gli stati",
    company: "Azienda",
    shop: "Negozio",
    city: "Città",
    zone: "Zona",
    created: "Creato il",
    open: "Apri",
    delete: "Elimina",
    confirmDelete: "Eliminare il contratto per {name}? L'azione è irreversibile.",
    noContractsFound: "Nessun contratto corrisponde ai filtri.",
    searchPlaceholder: "Cerca azienda, negozio, città, email",
    deleteSuccess: "Contratto eliminato",
    deleteError: "Errore durante l'eliminazione del contratto",
    
    // Users
    staffMember: "Membro dello Staff",
    roleAndAccess: "Ruolo e Accesso",
    assignments: "Assegnazioni",
    accountStatus: "Stato Account",
    unassigned: "NON ASSEGNATO",
    noStaffFound: "Nessun membro dello staff trovato",
    userDeleted: "Utente eliminato con successo",
    resetLinkSent: "Link di ripristino inviato a {email}",
    tempPasswordGenerated: "Password temporanea generata per {name}",
    copiedToClipboard: "Copiato negli appunti",
    confirmDeleteUser: "Sei sicuro di voler eliminare {name}? L'azione è irreversibile.",
    edit: "Modifica",
    sendResetEmail: "Invia Email di Ripristino",
    setTempPassword: "Imposta Password Temporanea",
    northRegion: "REGIONE NORD",
    southRegion: "REGIONE SUD",
    italy: "ITALIA",
    
    // Auth
    login: "Accedi",
    email: "Email",
    password: "Password",
    forgotPassword: "Password dimenticata?",
    
    // Roles
    admin: "AMMINISTRATORE",
    manager: "MANAGER",
    agent: "AGENTE",
  },
} as const
