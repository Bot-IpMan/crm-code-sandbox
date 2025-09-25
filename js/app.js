/**
 * ProCRM - Professional CRM System
 * Main JavaScript file containing all CRM functionality
 */

// Global variables and configuration
const FONT_FAMILIES = {
    'Inter': "'Inter', sans-serif",
    'Roboto': "'Roboto', sans-serif",
    'Open Sans': "'Open Sans', sans-serif",
    'Georgia': "'Georgia', serif",
    'Courier New': "'Courier New', monospace"
};

const FONT_SIZES = {
    small: '14px',
    medium: '16px',
    large: '18px',
    extraLarge: '20px'
};

const DEFAULT_FONT_SETTINGS = {
    family: 'Inter',
    size: 'medium'
};

const SUPPORTED_LANGUAGES = {
    en: 'English',
    uk: 'Українська'
};

const SUPPORTED_THEMES = {
    light: 'light',
    dark: 'dark'
};

const TRANSLATIONS = {
    en: {
        'common.loading': 'Loading...',
        'brand.tagline': 'Professional CRM',
        'nav.dashboard': 'Dashboard',
        'nav.contacts': 'Contacts',
        'nav.companies': 'Companies',
        'nav.leads': 'Leads',
        'nav.opportunities': 'Opportunities',
        'nav.sales': 'Sales',
        'nav.marketing': 'Marketing',
        'nav.competitorHub': 'Competitor Hub',
        'nav.tasks': 'Tasks',
        'nav.activities': 'Activities',
        'nav.automation': 'Automation',
        'nav.analytics': 'Analytics & BI',
        'nav.files': 'Files',
        'settings.title': 'Settings',
        'settings.language': 'Language',
        'settings.languageEnglish': 'English',
        'settings.languageUkrainian': 'Ukrainian',
        'settings.theme': 'Theme',
        'settings.themeLight': 'Light',
        'settings.themeDark': 'Dark',
        'settings.font': 'Font',
        'settings.fontSize': 'Font Size',
        'header.searchPlaceholder': 'Search anything...',
        'page.dashboard.title': 'Dashboard',
        'page.dashboard.subtitle': 'Welcome to your CRM dashboard',
        'page.contacts.title': 'Contacts',
        'page.contacts.subtitle': 'Manage your customer contacts',
        'page.companies.title': 'Companies',
        'page.companies.subtitle': 'Manage your business accounts',
        'page.leads.title': 'Leads',
        'page.leads.subtitle': 'Track and manage your sales leads',
        'page.opportunities.title': 'Opportunities',
        'page.opportunities.subtitle': 'Manage your sales opportunities',
        'page.tasks.title': 'Tasks',
        'page.tasks.subtitle': 'Manage your tasks and activities',
        'page.activities.title': 'Activities',
        'page.activities.subtitle': 'Track all your business activities',
        'page.reports.title': 'Analytics & BI',
        'page.reports.subtitle': 'Build interactive dashboards and predictive insights',
        'page.files.title': 'Files',
        'page.files.subtitle': 'Browse and manage your CRM vault',
        'page.automation.title': 'Automation',
        'page.automation.subtitle': 'Automate routine processes with event-driven workflows',
        'page.sales.title': 'Sales',
        'page.sales.subtitle': 'End-to-end pipeline, forecasting and billing',
        'page.marketing.title': 'Marketing Automation',
        'page.marketing.subtitle': 'Segmentation, customer journeys and multichannel campaigns',
        'page.competitorIntel.title': 'Competitor Intelligence Hub',
        'page.competitorIntel.subtitle': 'Monitor rivals, linked clients, and research tasks',
        'dashboard.totalContacts': 'Total Contacts',
        'dashboard.activeLeads': 'Active Leads',
        'dashboard.opportunities': 'Opportunities',
        'dashboard.revenue': 'Revenue',
        'dashboard.vsLastMonth': 'vs last month',
        'dashboard.salesPipeline': 'Sales Pipeline',
        'dashboard.leadSources': 'Lead Sources',
        'dashboard.recentActivities': 'Recent Activities',
        'common.viewAll': 'View all',
        'contacts.heading': 'All Contacts',
        'contacts.searchPlaceholder': 'Search contacts...',
        'contacts.export': 'Export',
        'contacts.addContact': 'Add Contact',
        'contacts.filter.status.all': 'All Statuses',
        'contacts.filter.status.active': 'Active',
        'contacts.filter.status.inactive': 'Inactive',
        'contacts.filter.status.qualified': 'Qualified',
        'contacts.filter.status.customer': 'Customer',
        'contacts.filter.source.all': 'All Sources',
        'contacts.filter.source.website': 'Website',
        'contacts.filter.source.coldCall': 'Cold Call',
        'contacts.filter.source.referral': 'Referral',
        'contacts.filter.source.social': 'Social Media',
        'contacts.table.name': 'Name',
        'contacts.table.company': 'Company',
        'contacts.table.email': 'Email',
        'contacts.table.phone': 'Phone',
        'contacts.table.status': 'Status',
        'contacts.table.actions': 'Actions',
        'contacts.empty': 'No contacts found',
        'contacts.emptyCta': 'Add your first contact',
        'contacts.noTitle': 'No title',
        'contacts.noCompany': 'No company',
        'contacts.noEmail': 'No email',
        'contacts.noPhone': 'No phone',
        'contacts.loadError': 'Failed to load contacts',
        'companies.heading': 'All Companies',
        'companies.searchPlaceholder': 'Search companies...',
        'companies.export': 'Export',
        'companies.addCompany': 'Add Company',
        'companies.filter.status.all': 'All Statuses',
        'companies.filter.status.active': 'Active',
        'companies.filter.status.customer': 'Customer',
        'companies.filter.status.prospect': 'Prospect',
        'companies.filter.status.partner': 'Partner',
        'companies.filter.size.all': 'All Sizes',
        'companies.filter.size.startup': 'Startup',
        'companies.filter.size.small': 'Small (1-50)',
        'companies.filter.size.medium': 'Medium (51-200)',
        'companies.filter.size.large': 'Large (201-1000)',
        'companies.filter.size.enterprise': 'Enterprise (1000+)',
        'companies.table.company': 'Company',
        'companies.table.industry': 'Industry',
        'companies.table.size': 'Size',
        'companies.table.revenue': 'Revenue',
        'companies.table.status': 'Status',
        'companies.table.actions': 'Actions',
        'companies.empty': 'No companies found',
        'companies.emptyCta': 'Add your first company',
        'companies.noWebsite': 'No website',
        'common.notAvailable': 'N/A',
        'companies.loadError': 'Failed to load companies'
    },
    uk: {
        'common.loading': 'Завантаження...',
        'brand.tagline': 'Професійна CRM',
        'nav.dashboard': 'Панель',
        'nav.contacts': 'Контакти',
        'nav.companies': 'Компанії',
        'nav.leads': 'Ліди',
        'nav.opportunities': 'Угоди',
        'nav.sales': 'Продажі',
        'nav.marketing': 'Маркетинг',
        'nav.competitorHub': 'Конкуренти',
        'nav.tasks': 'Завдання',
        'nav.activities': 'Активності',
        'nav.automation': 'Автоматизація',
        'nav.analytics': 'Аналітика та BI',
        'nav.files': 'Файли',
        'settings.title': 'Налаштування',
        'settings.language': 'Мова',
        'settings.languageEnglish': 'Англійська',
        'settings.languageUkrainian': 'Українська',
        'settings.theme': 'Тема',
        'settings.themeLight': 'Світла',
        'settings.themeDark': 'Темна',
        'settings.font': 'Шрифт',
        'settings.fontSize': 'Розмір шрифту',
        'header.searchPlaceholder': 'Пошук...',
        'page.dashboard.title': 'Панель керування',
        'page.dashboard.subtitle': 'Ласкаво просимо до CRM-панелі',
        'page.contacts.title': 'Контакти',
        'page.contacts.subtitle': 'Керуйте контактами клієнтів',
        'page.companies.title': 'Компанії',
        'page.companies.subtitle': 'Керуйте обліковими записами компаній',
        'page.leads.title': 'Ліди',
        'page.leads.subtitle': 'Відстежуйте та керуйте потенційними клієнтами',
        'page.opportunities.title': 'Угоди',
        'page.opportunities.subtitle': 'Керуйте можливостями продажів',
        'page.tasks.title': 'Завдання',
        'page.tasks.subtitle': 'Керуйте завданнями та активностями',
        'page.activities.title': 'Активності',
        'page.activities.subtitle': 'Відстежуйте всі ділові активності',
        'page.reports.title': 'Аналітика та BI',
        'page.reports.subtitle': 'Створюйте інтерактивні дашборди та прогнози',
        'page.files.title': 'Файли',
        'page.files.subtitle': 'Переглядайте та керуйте CRM-сховищем',
        'page.automation.title': 'Автоматизація',
        'page.automation.subtitle': 'Автоматизуйте процеси за допомогою подієвих сценаріїв',
        'page.sales.title': 'Продажі',
        'page.sales.subtitle': 'Повний цикл продажів, прогнозування та білінг',
        'page.marketing.title': 'Маркетинг',
        'page.marketing.subtitle': 'Сегментація, клієнтські сценарії та мультиканальні кампанії',
        'page.competitorIntel.title': 'Конкурентний хаб',
        'page.competitorIntel.subtitle': 'Відстежуйте конкурентів, пов’язаних клієнтів і дослідження',
        'dashboard.totalContacts': 'Усього контактів',
        'dashboard.activeLeads': 'Активні ліди',
        'dashboard.opportunities': 'Угоди',
        'dashboard.revenue': 'Дохід',
        'dashboard.vsLastMonth': 'порівняно з минулим місяцем',
        'dashboard.salesPipeline': 'Воронка продажів',
        'dashboard.leadSources': 'Джерела лідів',
        'dashboard.recentActivities': 'Останні активності',
        'common.viewAll': 'Переглянути всі',
        'contacts.heading': 'Усі контакти',
        'contacts.searchPlaceholder': 'Пошук контактів...',
        'contacts.export': 'Експорт',
        'contacts.addContact': 'Додати контакт',
        'contacts.filter.status.all': 'Усі статуси',
        'contacts.filter.status.active': 'Активний',
        'contacts.filter.status.inactive': 'Неактивний',
        'contacts.filter.status.qualified': 'Кваліфікований',
        'contacts.filter.status.customer': 'Клієнт',
        'contacts.filter.source.all': 'Усі джерела',
        'contacts.filter.source.website': 'Сайт',
        'contacts.filter.source.coldCall': 'Холодний дзвінок',
        'contacts.filter.source.referral': 'Рекомендація',
        'contacts.filter.source.social': 'Соціальні мережі',
        'contacts.table.name': 'Ім’я',
        'contacts.table.company': 'Компанія',
        'contacts.table.email': 'Email',
        'contacts.table.phone': 'Телефон',
        'contacts.table.status': 'Статус',
        'contacts.table.actions': 'Дії',
        'contacts.empty': 'Контактів не знайдено',
        'contacts.emptyCta': 'Додайте перший контакт',
        'contacts.noTitle': 'Без посади',
        'contacts.noCompany': 'Без компанії',
        'contacts.noEmail': 'Без email',
        'contacts.noPhone': 'Без телефону',
        'contacts.loadError': 'Не вдалося завантажити контакти',
        'companies.heading': 'Усі компанії',
        'companies.searchPlaceholder': 'Пошук компаній...',
        'companies.export': 'Експорт',
        'companies.addCompany': 'Додати компанію',
        'companies.filter.status.all': 'Усі статуси',
        'companies.filter.status.active': 'Активна',
        'companies.filter.status.customer': 'Клієнт',
        'companies.filter.status.prospect': 'Потенційний клієнт',
        'companies.filter.status.partner': 'Партнер',
        'companies.filter.size.all': 'Усі розміри',
        'companies.filter.size.startup': 'Стартап',
        'companies.filter.size.small': 'Малий (1-50)',
        'companies.filter.size.medium': 'Середній (51-200)',
        'companies.filter.size.large': 'Великий (201-1000)',
        'companies.filter.size.enterprise': 'Корпорація (1000+)',
        'companies.table.company': 'Компанія',
        'companies.table.industry': 'Індустрія',
        'companies.table.size': 'Розмір',
        'companies.table.revenue': 'Дохід',
        'companies.table.status': 'Статус',
        'companies.table.actions': 'Дії',
        'companies.empty': 'Компанії не знайдені',
        'companies.emptyCta': 'Додайте першу компанію',
        'companies.noWebsite': 'Без сайту',
        'common.notAvailable': 'Н/Д',
        'companies.loadError': 'Не вдалося завантажити компанії'
    }
};

const PAGE_HEADERS = {
    dashboard: { title: 'page.dashboard.title', subtitle: 'page.dashboard.subtitle' },
    contacts: { title: 'page.contacts.title', subtitle: 'page.contacts.subtitle' },
    companies: { title: 'page.companies.title', subtitle: 'page.companies.subtitle' },
    leads: { title: 'page.leads.title', subtitle: 'page.leads.subtitle' },
    opportunities: { title: 'page.opportunities.title', subtitle: 'page.opportunities.subtitle' },
    tasks: { title: 'page.tasks.title', subtitle: 'page.tasks.subtitle' },
    activities: { title: 'page.activities.title', subtitle: 'page.activities.subtitle' },
    reports: { title: 'page.reports.title', subtitle: 'page.reports.subtitle' },
    files: { title: 'page.files.title', subtitle: 'page.files.subtitle' },
    automation: { title: 'page.automation.title', subtitle: 'page.automation.subtitle' },
    sales: { title: 'page.sales.title', subtitle: 'page.sales.subtitle' },
    marketing: { title: 'page.marketing.title', subtitle: 'page.marketing.subtitle' },
    competitorIntel: { title: 'page.competitorIntel.title', subtitle: 'page.competitorIntel.subtitle' }
};

const DEFAULT_LANGUAGE = 'en';
const DEFAULT_THEME = 'light';
const FONT_FAMILY_STORAGE_KEY = 'appFontFamily';
const FONT_SIZE_STORAGE_KEY = 'appFontSize';
const LANGUAGE_STORAGE_KEY = 'appLanguage';
const THEME_STORAGE_KEY = 'appTheme';

let currentLanguage = DEFAULT_LANGUAGE;
let currentTheme = DEFAULT_THEME;
let currentView = 'dashboard';
let currentUser = 'Admin User';
let charts = {};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('Initializing ProCRM...');

    // Setup event listeners
    setupEventListeners();

    // Initialize mobile menu
    initializeMobileMenu();

    // Initialize UI settings
    initializeSettingsPanel();

    // Load dashboard by default
    showDashboard();

    // Setup global search
    setupGlobalSearch();

    console.log('ProCRM initialized successfully');
}

function translate(key) {
    const languageMap = TRANSLATIONS[currentLanguage] || {};
    if (languageMap[key]) {
        return languageMap[key];
    }

    const fallbackMap = TRANSLATIONS[DEFAULT_LANGUAGE] || {};
    return fallbackMap[key] || key;
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.dataset.i18n;
        if (!key) {
            return;
        }

        const translatedValue = translate(key);
        const attribute = element.dataset.i18nAttr;

        if (attribute) {
            element.setAttribute(attribute, translatedValue);
        } else {
            element.textContent = translatedValue;
        }
    });
}

function setLanguage(language) {
    const normalizedLanguage = SUPPORTED_LANGUAGES[language] ? language : DEFAULT_LANGUAGE;
    currentLanguage = normalizedLanguage;

    document.documentElement.lang = normalizedLanguage;
    setStoredPreference(LANGUAGE_STORAGE_KEY, normalizedLanguage);

    const languageSelect = document.getElementById('languageSelect');
    if (languageSelect && languageSelect.value !== normalizedLanguage) {
        languageSelect.value = normalizedLanguage;
    }

    applyTranslations();
    setPageHeader(currentView);
}

function applyTheme(theme) {
    const normalizedTheme = SUPPORTED_THEMES[theme] ? theme : DEFAULT_THEME;
    const previousTheme = currentTheme;
    currentTheme = normalizedTheme;

    if (document.body) {
        document.body.classList.remove('theme-light', 'theme-dark');
        document.body.classList.add(`theme-${normalizedTheme}`);
    }

    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect && themeSelect.value !== normalizedTheme) {
        themeSelect.value = normalizedTheme;
    }

    if (previousTheme !== normalizedTheme) {
        setStoredPreference(THEME_STORAGE_KEY, normalizedTheme);
    }
}

function setPageHeader(viewKey) {
    const headerConfig = PAGE_HEADERS[viewKey];
    if (!headerConfig) {
        document.title = 'ProCRM';
        return;
    }

    const title = translate(headerConfig.title);
    const subtitle = translate(headerConfig.subtitle);

    updatePageHeader(title, subtitle);
    document.title = `${title} · ProCRM`;
}

function setupEventListeners() {
    // Modal close on overlay click
    document.getElementById('modalOverlay').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

function initializeMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    const lgBreakpoint = 1024;

    if (!mobileMenuBtn || !sidebar) {
        return;
    }

    const syncSidebarWithViewport = () => {
        if (window.innerWidth < lgBreakpoint) {
            sidebar.classList.add('-translate-x-full');
        } else {
            sidebar.classList.remove('-translate-x-full');
        }
    };

    // Ensure the sidebar visibility matches the current viewport size
    syncSidebarWithViewport();
    window.addEventListener('resize', syncSidebarWithViewport);

    mobileMenuBtn.addEventListener('click', function(event) {
        event.stopPropagation();
        sidebar.classList.toggle('-translate-x-full');
    });

    // Close mobile menu when clicking outside, only on mobile viewports
    document.addEventListener('click', function(e) {
        if (window.innerWidth >= lgBreakpoint) {
            return;
        }
        if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            sidebar.classList.add('-translate-x-full');
        }
    });
}

function setupGlobalSearch() {
    const searchInput = document.getElementById('globalSearch');
    if (!searchInput) {
        console.warn('Global search input element not found. Skipping global search setup.');
        return;
    }
    let searchTimeout;

    searchInput.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performGlobalSearch(e.target.value);
        }, 300);
    });
}

function initializeSettingsPanel() {
    const fontFamilySelect = document.getElementById('fontFamilySelect');
    const fontSizeSelect = document.getElementById('fontSizeSelect');
    const languageSelect = document.getElementById('languageSelect');
    const themeSelect = document.getElementById('themeSelect');

    const savedLanguage = getStoredPreference(LANGUAGE_STORAGE_KEY);
    const initialLanguage = SUPPORTED_LANGUAGES[savedLanguage] ? savedLanguage : DEFAULT_LANGUAGE;
    setLanguage(initialLanguage);
    if (languageSelect) {
        languageSelect.value = initialLanguage;
        languageSelect.addEventListener('change', event => {
            setLanguage(event.target.value);
        });
    }

    const savedTheme = getStoredPreference(THEME_STORAGE_KEY);
    const initialTheme = SUPPORTED_THEMES[savedTheme] ? savedTheme : DEFAULT_THEME;
    applyTheme(initialTheme);
    if (themeSelect) {
        themeSelect.value = initialTheme;
        themeSelect.addEventListener('change', event => {
            applyTheme(event.target.value);
        });
    }

    if (fontFamilySelect && fontSizeSelect) {
        const savedFontFamily = getStoredPreference(FONT_FAMILY_STORAGE_KEY);
        const savedFontSize = getStoredPreference(FONT_SIZE_STORAGE_KEY);

        const initialFontFamily = (savedFontFamily && FONT_FAMILIES[savedFontFamily]) ? savedFontFamily : DEFAULT_FONT_SETTINGS.family;
        const initialFontSize = (savedFontSize && FONT_SIZES[savedFontSize]) ? savedFontSize : DEFAULT_FONT_SETTINGS.size;

        applyFontSettings(initialFontFamily, initialFontSize);

        fontFamilySelect.value = initialFontFamily;
        fontSizeSelect.value = initialFontSize;

        setStoredPreference(FONT_FAMILY_STORAGE_KEY, initialFontFamily);
        setStoredPreference(FONT_SIZE_STORAGE_KEY, initialFontSize);

        fontFamilySelect.addEventListener('change', event => {
            const newFontFamily = event.target.value;
            applyFontSettings(newFontFamily, fontSizeSelect.value);
            setStoredPreference(FONT_FAMILY_STORAGE_KEY, newFontFamily);
        });

        fontSizeSelect.addEventListener('change', event => {
            const newFontSize = event.target.value;
            applyFontSettings(fontFamilySelect.value, newFontSize);
            setStoredPreference(FONT_SIZE_STORAGE_KEY, newFontSize);
        });
    } else {
        applyFontSettings(DEFAULT_FONT_SETTINGS.family, DEFAULT_FONT_SETTINGS.size);
    }
}

function applyFontSettings(fontFamilyKey, fontSizeKey) {
    setAppFontFamily(fontFamilyKey);
    setAppFontSize(fontSizeKey);
}

function setAppFontFamily(fontFamilyKey) {
    const fontFamily = FONT_FAMILIES[fontFamilyKey] || FONT_FAMILIES[DEFAULT_FONT_SETTINGS.family];
    document.documentElement.style.setProperty('--app-font-family', fontFamily);
}

function setAppFontSize(fontSizeKey) {
    const fontSize = FONT_SIZES[fontSizeKey] || FONT_SIZES[DEFAULT_FONT_SETTINGS.size];
    document.documentElement.style.setProperty('--app-font-size', fontSize);
}

function getStoredPreference(key) {
    try {
        return localStorage.getItem(key);
    } catch (error) {
        console.warn('Unable to read preference', key, error);
        return null;
    }
}

function setStoredPreference(key, value) {
    try {
        localStorage.setItem(key, value);
    } catch (error) {
        console.warn('Unable to save preference', key, error);
    }
}

async function performGlobalSearch(query) {
    if (!query.trim()) return;
    
    showLoading();
    try {
        // Search across all entities
        const searchPromises = [
            searchEntity('contacts', query),
            searchEntity('companies', query),
            searchEntity('leads', query),
            searchEntity('opportunities', query)
        ];
        
        const results = await Promise.all(searchPromises);
        displaySearchResults(results, query);
    } catch (error) {
        console.error('Search error:', error);
        showToast('Search failed. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

async function searchEntity(entity, query) {
    const response = await fetch(`tables/${entity}?search=${encodeURIComponent(query)}&limit=5`);
    const data = await response.json();
    return { entity, data: data.data };
}

function displaySearchResults(results, query) {
    // Implementation would show search results in a dropdown or modal
    console.log('Search results for:', query, results);
}

// Navigation functions
function showView(viewName) {
    // Hide all views
    document.querySelectorAll('.view-content').forEach(view => {
        view.classList.add('hidden');
    });
    
    // Show selected view
    const targetView = document.getElementById(viewName + 'View');
    if (targetView) {
        targetView.classList.remove('hidden');
    }

    // Update navigation
    updateNavigation(viewName);
    currentView = viewName;

    // Ensure the current theme is applied consistently across all views
    applyTheme(currentTheme);
}

function updateNavigation(activeView) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('bg-blue-50', 'text-blue-600', 'font-semibold');
        item.classList.add('text-gray-700');
    });

    const activeNavItem = document.querySelector(`.nav-item[data-view="${activeView}"]`);
    if (activeNavItem) {
        activeNavItem.classList.add('bg-blue-50', 'text-blue-600', 'font-semibold');
        activeNavItem.classList.remove('text-gray-700');
    }
}

function updatePageHeader(title, subtitle) {
    document.getElementById('pageTitle').textContent = title;
    document.getElementById('pageSubtitle').textContent = subtitle;
}

// Dashboard functions
async function showDashboard() {
    showView('dashboard');
    setPageHeader('dashboard');

    await loadDashboardData();
    initializeDashboardCharts();
}

async function loadDashboardData() {
    showLoading();
    try {
        // Load statistics
        const [contacts, leads, opportunities] = await Promise.all([
            fetch('tables/contacts').then(r => r.json()),
            fetch('tables/leads').then(r => r.json()),
            fetch('tables/opportunities').then(r => r.json())
        ]);
        
        // Update dashboard stats
        document.getElementById('totalContacts').textContent = contacts.total || 0;
        document.getElementById('activeLeads').textContent = leads.data?.filter(l => ['New', 'Contacted', 'Qualified'].includes(l.status)).length || 0;
        document.getElementById('totalOpportunities').textContent = opportunities.total || 0;
        
        // Calculate total revenue from won opportunities
        const wonOpportunities = opportunities.data?.filter(o => o.stage === 'Closed Won') || [];
        const totalRevenue = wonOpportunities.reduce((sum, opp) => sum + (opp.value || 0), 0);
        document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
        
        // Load recent activities
        await loadRecentActivities();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        showToast('Failed to load dashboard data', 'error');
    } finally {
        hideLoading();
    }
}

async function loadRecentActivities() {
    try {
        const response = await fetch('tables/activities?limit=5&sort=date');
        const data = await response.json();
        
        const container = document.getElementById('recentActivities');
        
        if (data.data && data.data.length > 0) {
            container.innerHTML = data.data.map(activity => `
                <div class="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <i class="fas fa-${getActivityIcon(activity.type)} text-blue-600"></i>
                    </div>
                    <div class="flex-1">
                        <p class="font-medium text-gray-800">${activity.subject || activity.type}</p>
                        <p class="text-sm text-gray-600">${activity.description || 'No description'}</p>
                        <p class="text-xs text-gray-500 mt-1">${formatDate(activity.date)}</p>
                    </div>
                    <div class="text-sm text-gray-500">
                        ${activity.assigned_to || 'Unassigned'}
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-clock text-4xl mb-4"></i>
                    <p>No recent activities</p>
                    <button onclick="showActivities()" class="mt-2 text-blue-600 hover:text-blue-700">Add your first activity</button>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading activities:', error);
    }
}

function initializeDashboardCharts() {
    // Initialize pipeline chart
    const pipelineCanvas = document.getElementById('pipelineChart');
    if (pipelineCanvas) {
        if (charts.pipeline) {
            charts.pipeline.destroy();
        }

        const pipelineCtx = pipelineCanvas.getContext('2d');
        charts.pipeline = new Chart(pipelineCtx, {
            type: 'bar',
            data: {
                labels: ['Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
                datasets: [{
                    label: 'Opportunities',
                    data: [12, 8, 6, 4, 15, 3],
                    backgroundColor: [
                        '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#059669', '#6b7280'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { precision: 0 }
                    }
                }
            }
        });
    }

    // Initialize lead source chart
    const leadSourceCanvas = document.getElementById('leadSourceChart');
    if (leadSourceCanvas) {
        if (charts.leadSource) {
            charts.leadSource.destroy();
        }

        const leadSourceCtx = leadSourceCanvas.getContext('2d');
        charts.leadSource = new Chart(leadSourceCtx, {
            type: 'doughnut',
            data: {
                labels: ['Website', 'Cold Call', 'Email Campaign', 'Referral', 'Social Media', 'Trade Show'],
                datasets: [{
                    data: [35, 20, 15, 12, 10, 8],
                    backgroundColor: [
                        '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
}

// Contacts functions
async function showContacts() {
    showView('contacts');
    setPageHeader('contacts');
    
    const contactsView = document.getElementById('contactsView');
    contactsView.innerHTML = `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center space-x-4">
                    <h3 class="text-lg font-semibold text-gray-800" data-i18n="contacts.heading">All Contacts</h3>
                    <div class="relative">
                        <input type="text" id="contactSearch" placeholder="Search contacts..." data-i18n="contacts.searchPlaceholder" data-i18n-attr="placeholder"
                               class="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    <button onclick="exportContacts()" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <i class="fas fa-download mr-2"></i><span data-i18n="contacts.export">Export</span>
                    </button>
                    <button onclick="showContactForm()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-plus mr-2"></i><span data-i18n="contacts.addContact">Add Contact</span>
                    </button>
                </div>
            </div>

            <!-- Filters -->
            <div class="flex items-center space-x-4 mb-6">
                <select id="statusFilter" class="border border-gray-300 rounded-lg px-3 py-2">
                    <option value="" data-i18n="contacts.filter.status.all">All Statuses</option>
                    <option value="Active" data-i18n="contacts.filter.status.active">Active</option>
                    <option value="Inactive" data-i18n="contacts.filter.status.inactive">Inactive</option>
                    <option value="Qualified" data-i18n="contacts.filter.status.qualified">Qualified</option>
                    <option value="Customer" data-i18n="contacts.filter.status.customer">Customer</option>
                </select>
                <select id="sourceFilter" class="border border-gray-300 rounded-lg px-3 py-2">
                    <option value="" data-i18n="contacts.filter.source.all">All Sources</option>
                    <option value="Website" data-i18n="contacts.filter.source.website">Website</option>
                    <option value="Cold Call" data-i18n="contacts.filter.source.coldCall">Cold Call</option>
                    <option value="Referral" data-i18n="contacts.filter.source.referral">Referral</option>
                    <option value="Social Media" data-i18n="contacts.filter.source.social">Social Media</option>
                </select>
            </div>

            <!-- Contacts table -->
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="text-left p-3 font-medium text-gray-600" data-i18n="contacts.table.name">Name</th>
                            <th class="text-left p-3 font-medium text-gray-600" data-i18n="contacts.table.company">Company</th>
                            <th class="text-left p-3 font-medium text-gray-600" data-i18n="contacts.table.email">Email</th>
                            <th class="text-left p-3 font-medium text-gray-600" data-i18n="contacts.table.phone">Phone</th>
                            <th class="text-left p-3 font-medium text-gray-600" data-i18n="contacts.table.status">Status</th>
                            <th class="text-left p-3 font-medium text-gray-600" data-i18n="contacts.table.actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="contactsTableBody">
                        <!-- Contacts will be loaded here -->
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <div id="contactsPagination" class="mt-6 flex items-center justify-between">
                <!-- Pagination will be added here -->
            </div>
        </div>
    `;

    applyTranslations();

    await loadContacts();
    setupContactFilters();
}

async function loadContacts(page = 1, search, status, source) {
    showLoading();
    try {
        const searchInput = document.getElementById('contactSearch');
        const statusSelect = document.getElementById('statusFilter');
        const sourceSelect = document.getElementById('sourceFilter');

        const searchValue = search !== undefined ? search : (searchInput?.value ?? '');
        const statusValue = status !== undefined ? status : (statusSelect?.value ?? '');
        const sourceValue = source !== undefined ? source : (sourceSelect?.value ?? '');

        const params = new URLSearchParams({
            page: String(page),
            limit: '20'
        });

        if (searchValue.trim()) params.append('search', searchValue.trim());
        if (statusValue) params.append('status', statusValue);
        if (sourceValue) params.append('source', sourceValue);

        const response = await fetch(`tables/contacts?${params.toString()}`);
        const data = await response.json();
        
        displayContacts(data.data || []);
        displayPagination('contacts', data, page);

    } catch (error) {
        console.error('Error loading contacts:', error);
        showToast(translate('contacts.loadError'), 'error');
    } finally {
        hideLoading();
    }
}

function displayContacts(contacts) {
    const tbody = document.getElementById('contactsTableBody');
    
    if (contacts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-8 text-gray-500">
                    <i class="fas fa-users text-4xl mb-4"></i>
                    <p data-i18n="contacts.empty">No contacts found</p>
                    <button onclick="showContactForm()" class="mt-2 text-blue-600 hover:text-blue-700" data-i18n="contacts.emptyCta">Add your first contact</button>
                </td>
            </tr>
        `;
        applyTranslations();
        return;
    }

    tbody.innerHTML = contacts.map(contact => `
        <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="p-3">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span class="text-blue-600 font-semibold">${getInitials(contact.first_name, contact.last_name)}</span>
                    </div>
                    <div>
                        <p class="font-medium text-gray-800">${contact.first_name} ${contact.last_name}</p>
                        <p class="text-sm text-gray-600">${contact.title || `<span data-i18n="contacts.noTitle">${translate('contacts.noTitle')}</span>`}</p>
                    </div>
                </div>
            </td>
            <td class="p-3 text-gray-600">${contact.company_name || `<span data-i18n="contacts.noCompany">${translate('contacts.noCompany')}</span>`}</td>
            <td class="p-3 text-gray-600">${contact.email || `<span data-i18n="contacts.noEmail">${translate('contacts.noEmail')}</span>`}</td>
            <td class="p-3 text-gray-600">${contact.phone || `<span data-i18n="contacts.noPhone">${translate('contacts.noPhone')}</span>`}</td>
            <td class="p-3">
                <span class="px-2 py-1 text-xs rounded-full ${getStatusClass(contact.status)}" ${getStatusI18nAttribute(contact.status)}>${translate(getStatusTranslationKey(contact.status))}</span>
            </td>
            <td class="p-3">
                <div class="flex items-center space-x-2">
                    <button onclick="viewContact('${contact.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editContact('${contact.id}')" class="p-2 text-green-600 hover:bg-green-50 rounded">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteContact('${contact.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    applyTranslations();
}

function getStatusTranslationKey(status) {
    const normalized = (status || 'Active').toLowerCase();
    switch (normalized) {
        case 'active':
            return 'contacts.filter.status.active';
        case 'inactive':
            return 'contacts.filter.status.inactive';
        case 'qualified':
            return 'contacts.filter.status.qualified';
        case 'customer':
            return 'contacts.filter.status.customer';
        default:
            return 'contacts.filter.status.active';
    }
}

function getStatusI18nAttribute(status) {
    const key = getStatusTranslationKey(status);
    return `data-i18n="${key}"`;
}

function setupContactFilters() {
    const searchInput = document.getElementById('contactSearch');
    const statusFilter = document.getElementById('statusFilter');
    const sourceFilter = document.getElementById('sourceFilter');
    
    let filterTimeout;
    
    const applyFilters = () => {
        clearTimeout(filterTimeout);
        filterTimeout = setTimeout(() => {
            loadContacts(1, searchInput.value, statusFilter.value, sourceFilter.value);
        }, 300);
    };
    
    searchInput.addEventListener('input', applyFilters);
    statusFilter.addEventListener('change', applyFilters);
    sourceFilter.addEventListener('change', applyFilters);
}

async function showContactForm(contactId = null) {
    const isEdit = contactId !== null;
    let contact = {};
    
    if (isEdit) {
        try {
            const response = await fetch(`tables/contacts/${contactId}`);
            contact = await response.json();
        } catch (error) {
            showToast('Failed to load contact', 'error');
            return;
        }
    }
    
    showModal(isEdit ? 'Edit Contact' : 'Add New Contact', `
        <form id="contactForm" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                    <input type="text" name="first_name" value="${contact.first_name || ''}" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                    <input type="text" name="last_name" value="${contact.last_name || ''}" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input type="email" name="email" value="${contact.email || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input type="tel" name="phone" value="${contact.phone || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input type="text" name="title" value="${contact.title || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Mobile</label>
                    <input type="tel" name="mobile" value="${contact.mobile || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Company ID</label>
                <input type="text" name="company_id" value="${contact.company_id || ''}"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select name="status" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="Active" ${contact.status === 'Active' ? 'selected' : ''}>Active</option>
                        <option value="Inactive" ${contact.status === 'Inactive' ? 'selected' : ''}>Inactive</option>
                        <option value="Qualified" ${contact.status === 'Qualified' ? 'selected' : ''}>Qualified</option>
                        <option value="Customer" ${contact.status === 'Customer' ? 'selected' : ''}>Customer</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Lead Source</label>
                    <select name="lead_source" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Select source...</option>
                        <option value="Website" ${contact.lead_source === 'Website' ? 'selected' : ''}>Website</option>
                        <option value="Cold Call" ${contact.lead_source === 'Cold Call' ? 'selected' : ''}>Cold Call</option>
                        <option value="Email Campaign" ${contact.lead_source === 'Email Campaign' ? 'selected' : ''}>Email Campaign</option>
                        <option value="Social Media" ${contact.lead_source === 'Social Media' ? 'selected' : ''}>Social Media</option>
                        <option value="Referral" ${contact.lead_source === 'Referral' ? 'selected' : ''}>Referral</option>
                        <option value="Trade Show" ${contact.lead_source === 'Trade Show' ? 'selected' : ''}>Trade Show</option>
                        <option value="Advertisement" ${contact.lead_source === 'Advertisement' ? 'selected' : ''}>Advertisement</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
                    <input type="url" name="linkedin" value="${contact.linkedin || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea name="address" rows="2" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">${contact.address || ''}</textarea>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input type="text" name="city" value="${contact.city || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">State</label>
                    <input type="text" name="state" value="${contact.state || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <input type="text" name="country" value="${contact.country || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                    <input type="text" name="postal_code" value="${contact.postal_code || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
            </div>
            
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea name="notes" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">${contact.notes || ''}</textarea>
            </div>
            
            <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Cancel
                </button>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    ${isEdit ? 'Update Contact' : 'Create Contact'}
                </button>
            </div>
        </form>
    `);
    
    // Setup form submission
    document.getElementById('contactForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        await saveContact(contactId, new FormData(this));
    });
}

async function saveContact(contactId, formData) {
    showLoading();
    try {
        const data = {};
        for (let [key, value] of formData.entries()) {
            if (value.trim()) data[key] = value.trim();
        }
        
        // Add metadata
        data.created_by = currentUser;
        if (!contactId) {
            data.created_at = Date.now();
        }
        data.updated_at = Date.now();
        
        const method = contactId ? 'PUT' : 'POST';
        const url = contactId ? `tables/contacts/${contactId}` : 'tables/contacts';
        
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            showToast(contactId ? 'Contact updated successfully' : 'Contact created successfully', 'success');
            closeModal();
            loadContacts();
        } else {
            throw new Error('Save failed');
        }
        
    } catch (error) {
        console.error('Error saving contact:', error);
        showToast('Failed to save contact', 'error');
    } finally {
        hideLoading();
    }
}

// Companies functions (similar structure to contacts)
async function showCompanies() {
    showView('companies');
    setPageHeader('companies');
    
    // Similar implementation to showContacts()
    // ... (implementation would follow same pattern)
}

// Leads functions
async function showLeads() {
    showView('leads');
    setPageHeader('leads');
    
    // Similar implementation to showContacts()
    // ... (implementation would follow same pattern)
}

// Opportunities functions  
async function showOpportunities() {
    showView('opportunities');
    setPageHeader('opportunities');
    
    // Similar implementation to showContacts()
    // ... (implementation would follow same pattern)
}

// Tasks functions
async function showTasks() {
    showView('tasks');
    setPageHeader('tasks');
    
    // Similar implementation to showContacts()
    // ... (implementation would follow same pattern)
}

// Activities functions
async function showActivities() {
    showView('activities');
    setPageHeader('activities');
    
    // Similar implementation to showContacts()
    // ... (implementation would follow same pattern)
}

// Reports functions
async function showReports() {
    if (typeof renderAnalyticsAndBI === 'function') {
        return renderAnalyticsAndBI();
    }

    showView('reports');
    setPageHeader('reports');
}

// Utility functions
function showModal(title, content) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalContent').innerHTML = content;
    document.getElementById('modalOverlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toastId = 'toast-' + Date.now();
    
    const colors = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        warning: 'bg-yellow-500',
        info: 'bg-blue-500'
    };
    
    const icons = {
        success: 'fa-check',
        error: 'fa-times',
        warning: 'fa-exclamation',
        info: 'fa-info'
    };
    
    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-3 transform translate-x-full transition-transform duration-300`;
    toast.innerHTML = `
        <i class="fas ${icons[type]}"></i>
        <span>${message}</span>
        <button onclick="removeToast('${toastId}')" class="ml-2 text-white hover:text-gray-200">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 100);
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        removeToast(toastId);
    }, 5000);
}

function removeToast(toastId) {
    const toast = document.getElementById(toastId);
    if (toast) {
        toast.classList.add('translate-x-full');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }
}

function formatDate(timestamp) {
    if (!timestamp) return 'No date';
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount || 0);
}

function getInitials(firstName, lastName) {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last;
}

function getStatusClass(status) {
    const statusClasses = {
        'Active': 'bg-green-100 text-green-800',
        'Inactive': 'bg-gray-100 text-gray-800',
        'Qualified': 'bg-blue-100 text-blue-800',
        'Customer': 'bg-purple-100 text-purple-800',
        'Prospect': 'bg-yellow-100 text-yellow-800',
        'Partner': 'bg-indigo-100 text-indigo-800',
        'New': 'bg-blue-100 text-blue-800',
        'Contacted': 'bg-yellow-100 text-yellow-800',
        'Won': 'bg-green-100 text-green-800',
        'Lost': 'bg-red-100 text-red-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
}

function getPriorityClass(priority) {
    const priorityClasses = {
        'Low': 'bg-gray-100 text-gray-800',
        'Medium': 'bg-yellow-100 text-yellow-800',
        'High': 'bg-orange-100 text-orange-800',
        'Critical': 'bg-red-100 text-red-800'
    };
    return priorityClasses[priority] || 'bg-gray-100 text-gray-800';
}

function getActivityIcon(type) {
    const icons = {
        'Call': 'phone',
        'Email': 'envelope',
        'Meeting': 'calendar',
        'Note': 'sticky-note',
        'Task': 'tasks',
        'Appointment': 'clock',
        'Document': 'file-alt'
    };
    return icons[type] || 'circle';
}

function displayPagination(entityType, data, currentPage) {
    const container = document.getElementById(`${entityType}Pagination`);
    const totalPages = Math.ceil(data.total / data.limit);
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let pagination = `
        <div class="flex items-center justify-between">
            <div class="text-sm text-gray-600">
                Showing ${(currentPage - 1) * data.limit + 1} to ${Math.min(currentPage * data.limit, data.total)} of ${data.total} results
            </div>
            <div class="flex space-x-1">
    `;
    
    // Previous button
    if (currentPage > 1) {
        pagination += `<button onclick="loadEntityPage('${entityType}', ${currentPage - 1})" class="px-3 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">Previous</button>`;
    }
    
    // Page numbers
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        const isActive = i === currentPage;
        pagination += `
            <button onclick="loadEntityPage('${entityType}', ${i})" 
                    class="px-3 py-2 ${isActive ? 'bg-blue-600 text-white' : 'text-gray-600 border border-gray-300 hover:bg-gray-50'} rounded">
                ${i}
            </button>
        `;
    }
    
    // Next button
    if (currentPage < totalPages) {
        pagination += `<button onclick="loadEntityPage('${entityType}', ${currentPage + 1})" class="px-3 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50">Next</button>`;
    }
    
    pagination += '</div></div>';
    container.innerHTML = pagination;
}

function loadEntityPage(entityType, page) {
    switch(entityType) {
        case 'contacts':
            loadContacts(page);
            break;
        case 'companies':
            if (typeof loadCompanies === 'function') {
                loadCompanies(page);
            }
            break;
        case 'leads':
            if (typeof loadLeads === 'function') {
                loadLeads(page);
            }
            break;
        case 'tasks':
            if (typeof loadTasks === 'function') {
                loadTasks(page);
            }
            break;
        // Add other entity types
    }
}

// Export functions
async function exportContacts() {
    try {
        const response = await fetch('tables/contacts?limit=10000');
        const data = await response.json();
        
        const csv = convertToCSV(data.data);
        downloadCSV(csv, 'contacts.csv');
        
        showToast('Contacts exported successfully', 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast('Failed to export contacts', 'error');
    }
}

function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => {
        return Object.values(row).map(value => {
            // Handle commas and quotes in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
        }).join(',');
    });
    
    return [headers, ...rows].join('\n');
}

function downloadCSV(csv, filename) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

// View/Edit/Delete functions
async function viewContact(contactId) {
    // Implementation for viewing contact details
    showToast('View contact functionality - to be implemented', 'info');
}

async function editContact(contactId) {
    await showContactForm(contactId);
}

async function deleteContact(contactId) {
    if (confirm('Are you sure you want to delete this contact?')) {
        try {
            const response = await fetch(`tables/contacts/${contactId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showToast('Contact deleted successfully', 'success');
                loadContacts();
            } else {
                throw new Error('Delete failed');
            }
        } catch (error) {
            console.error('Delete error:', error);
            showToast('Failed to delete contact', 'error');
        }
    }
}