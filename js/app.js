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

const SUPPORTED_DENSITIES = {
    compact: 'compact',
    comfortable: 'comfortable'
};

const entityDirectories = {
    companies: {
        list: [],
        byId: new Map(),
        byName: new Map()
    },
    contacts: {
        list: [],
        byId: new Map(),
        byEmail: new Map(),
        byName: new Map()
    }
};

const opportunityModalState = {
    currentId: null,
    reopenAfterForm: false
};

window.opportunityModalState = opportunityModalState;

function sanitizeText(value) {
    if (value === undefined || value === null) {
        return '';
    }
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function normalizeDictionaryEntry(entry) {
    if (!entry) {
        return null;
    }
    if (typeof entry === 'string') {
        const value = entry.trim();
        if (!value) {
            return null;
        }
        return { value, label: value, i18nKey: null };
    }
    if (typeof entry === 'object') {
        const rawValue = entry.value ?? entry.id ?? entry.key;
        if (!rawValue) {
            return null;
        }
        const value = String(rawValue).trim();
        if (!value) {
            return null;
        }
        const labelSource = entry.label ?? entry.name ?? value;
        const label = String(labelSource).trim() || value;
        const i18nKey = entry.i18nKey || entry.i18n || null;
        return { value, label, i18nKey };
    }
    return null;
}

function getDictionaryEntries(entity, key, fallback = []) {
    const fallbackEntries = Array.isArray(fallback)
        ? fallback.map(normalizeDictionaryEntry).filter(Boolean)
        : [];

    if (entity && key && window.crmConfig && typeof window.crmConfig.getDictionary === 'function') {
        const resolved = window.crmConfig.getDictionary(entity, key);
        if (Array.isArray(resolved) && resolved.length) {
            return resolved.map(normalizeDictionaryEntry).filter(Boolean);
        }
    }

    return fallbackEntries;
}

function getDictionaryValues(entity, key, fallback = []) {
    const entries = getDictionaryEntries(entity, key, fallback);
    return entries.map(entry => entry.value);
}

function renderSelectOptions(entries, selectedValue = '', options = {}) {
    const {
        includeBlank = false,
        blankLabel = '',
        blankValue = '',
        blankI18nKey
    } = options;

    const normalizedSelected = selectedValue === undefined || selectedValue === null
        ? ''
        : String(selectedValue);

    const html = [];
    if (includeBlank) {
        const blankText = blankI18nKey ? translate(blankI18nKey) : blankLabel;
        const attributes = [
            `value="${sanitizeText(blankValue)}"`
        ];
        if (blankI18nKey) {
            attributes.push(`data-i18n="${blankI18nKey}"`);
        }
        if (!normalizedSelected) {
            attributes.push('selected');
        }
        html.push(`<option ${attributes.join(' ')}>${sanitizeText(blankText)}</option>`);
    }

    const seen = new Set();
    entries.forEach(entry => {
        const normalized = normalizeDictionaryEntry(entry);
        if (!normalized) {
            return;
        }
        const value = normalized.value;
        if (seen.has(value)) {
            return;
        }
        seen.add(value);
        const attributes = [`value="${sanitizeText(value)}"`];
        if (normalized.i18nKey) {
            attributes.push(`data-i18n="${normalized.i18nKey}"`);
        }
        if (normalizedSelected && value === normalizedSelected) {
            attributes.push('selected');
        }
        const label = normalized.i18nKey
            ? translate(normalized.i18nKey)
            : normalized.label || value;
        html.push(`<option ${attributes.join(' ')}>${sanitizeText(label)}</option>`);
    });

    if (normalizedSelected && !seen.has(normalizedSelected)) {
        html.push(`<option value="${sanitizeText(normalizedSelected)}" selected>${sanitizeText(normalizedSelected)}</option>`);
    }

    return html.join('');
}

function applyDictionaryToSelect(selectElement, entity, dictionary, options = {}) {
    if (!selectElement) {
        return;
    }
    const {
        includeBlank = false,
        blankLabel = '',
        blankValue = '',
        blankI18nKey,
        selectedValue
    } = options || {};

    const currentValue = selectedValue !== undefined ? selectedValue : selectElement.value;
    const html = renderSelectOptions(
        getDictionaryEntries(entity, dictionary),
        currentValue,
        { includeBlank, blankLabel, blankValue, blankI18nKey }
    );
    selectElement.innerHTML = html;
}

function updateCompanyDirectory(companies = [], options = {}) {
    const { merge = false } = options;
    const directory = entityDirectories.companies;
    const combined = merge ? [...directory.list, ...companies] : [...companies];
    const normalized = new Map();
    combined.forEach(company => {
        if (!company || !company.id) {
            return;
        }
        normalized.set(company.id, company);
    });

    directory.list = Array.from(normalized.values());
    directory.byId.clear();
    directory.byName.clear();
    directory.list.forEach(company => {
        directory.byId.set(company.id, company);
        if (company.name) {
            directory.byName.set(company.name.trim().toLowerCase(), company);
        }
    });
}

function updateContactDirectory(contacts = [], options = {}) {
    const { merge = false } = options;
    const directory = entityDirectories.contacts;
    const combined = merge ? [...directory.list, ...contacts] : [...contacts];
    const normalized = new Map();
    combined.forEach(contact => {
        if (!contact || !contact.id) {
            return;
        }
        normalized.set(contact.id, contact);
    });

    directory.list = Array.from(normalized.values());
    directory.byId.clear();
    directory.byEmail.clear();
    directory.byName.clear();
    directory.list.forEach(contact => {
        directory.byId.set(contact.id, contact);
        if (contact.email) {
            directory.byEmail.set(contact.email.trim().toLowerCase(), contact);
        }
        const fullName = [contact.first_name, contact.last_name]
            .filter(Boolean)
            .join(' ')
            .trim()
            .toLowerCase();
        if (fullName) {
            directory.byName.set(fullName, contact);
        }
    });
}

async function ensureCompanyAssociation(options = {}) {
    const {
        selectedId,
        companyName,
        newCompany = {}
    } = options;

    const trimmedSelectedId = selectedId ? String(selectedId).trim() : '';
    const trimmedCompanyName = companyName ? companyName.trim() : '';
    const trimmedNewName = newCompany.name ? newCompany.name.trim() : '';

    if (trimmedSelectedId) {
        const cached = entityDirectories.companies.byId.get(trimmedSelectedId);
        if (cached) {
            return { company_id: cached.id, company_name: cached.name || trimmedCompanyName || trimmedNewName };
        }
        try {
            const response = await fetch(`tables/companies/${encodeURIComponent(trimmedSelectedId)}`);
            if (response.ok) {
                const record = await response.json();
                updateCompanyDirectory([record], { merge: true });
                return { company_id: record.id, company_name: record.name || trimmedCompanyName || trimmedNewName };
            }
        } catch (error) {
            console.warn('Unable to fetch company by id:', error);
        }
    }

    const normalizedName = trimmedNewName || trimmedCompanyName;
    if (normalizedName) {
        const cachedByName = entityDirectories.companies.byName.get(normalizedName.toLowerCase());
        if (cachedByName) {
            return { company_id: cachedByName.id, company_name: cachedByName.name || normalizedName };
        }
    }

    if (trimmedNewName) {
        const payload = {
            name: trimmedNewName,
            status: newCompany.status || 'Prospect',
            industry: newCompany.industry || undefined,
            website: newCompany.website || undefined,
            size: newCompany.size || undefined,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        Object.keys(payload).forEach(key => {
            if (payload[key] === undefined || payload[key] === '') {
                delete payload[key];
            }
        });

        try {
            const response = await fetch('tables/companies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                throw new Error('Failed to create company');
            }
            const record = await response.json();
            updateCompanyDirectory([record], { merge: true });
            return { company_id: record.id, company_name: record.name };
        } catch (error) {
            console.error('Error creating company from inline form:', error);
            throw error;
        }
    }

    if (normalizedName) {
        return { company_name: normalizedName };
    }

    return null;
}

async function ensureEntityDirectoryData(entity) {
    const directory = entityDirectories[entity];
    if (!directory || (Array.isArray(directory.list) && directory.list.length)) {
        return directory ? directory.list : [];
    }

    let endpoint = '';
    let updater = null;
    switch (entity) {
        case 'contacts':
            endpoint = 'tables/contacts?limit=1000';
            updater = updateContactDirectory;
            break;
        case 'companies':
            endpoint = 'tables/companies?limit=1000';
            updater = updateCompanyDirectory;
            break;
        default:
            return directory?.list || [];
    }

    try {
        const response = await fetch(endpoint);
        if (response.ok) {
            const payload = await response.json();
            const records = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
            if (typeof updater === 'function') {
                updater(records, { merge: true });
            }
            return records;
        }
    } catch (error) {
        console.warn('Unable to populate directory for', entity, error);
    }

    return directory?.list || [];
}

async function ensureContactAssociation(options = {}) {
    const {
        selectedId,
        newContact = {},
        companyLink,
        defaultStatus = 'Active',
        originLeadId
    } = options;

    const trimmedSelectedId = selectedId ? String(selectedId).trim() : '';
    const normalizedOriginId = originLeadId ? String(originLeadId).trim() : '';

    const attachLeadOrigin = async contact => {
        if (!normalizedOriginId || !contact?.id) {
            return contact;
        }
        const alreadyLinked = contact.lead_origin_id && String(contact.lead_origin_id).trim() === normalizedOriginId;
        if (alreadyLinked) {
            return contact;
        }
        try {
            const response = await fetch(`tables/contacts/${encodeURIComponent(contact.id)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lead_origin_id: normalizedOriginId,
                    updated_at: new Date().toISOString()
                })
            });
            if (response.ok) {
                const updated = await response.json();
                updateContactDirectory([updated], { merge: true });
                return updated;
            }
        } catch (error) {
            console.warn('Unable to attach lead origin to contact:', error);
        }
        return contact;
    };

    if (trimmedSelectedId) {
        const cached = entityDirectories.contacts.byId.get(trimmedSelectedId);
        if (cached) {
            const enriched = await attachLeadOrigin(cached);
            return { contact_id: enriched.id, contact: enriched };
        }
        try {
            const response = await fetch(`tables/contacts/${encodeURIComponent(trimmedSelectedId)}`);
            if (response.ok) {
                const record = await response.json();
                updateContactDirectory([record], { merge: true });
                const enriched = await attachLeadOrigin(record);
                return { contact_id: enriched.id, contact: enriched };
            }
        } catch (error) {
            console.warn('Unable to fetch contact by id:', error);
        }
    }

    const hasNewContactData = Boolean(
        (newContact.firstName && newContact.firstName.trim()) ||
        (newContact.lastName && newContact.lastName.trim()) ||
        (newContact.email && newContact.email.trim()) ||
        (newContact.phone && newContact.phone.trim())
    );

    if (!hasNewContactData) {
        return null;
    }

    const normalizedEmail = newContact.email ? newContact.email.trim().toLowerCase() : '';
    if (normalizedEmail) {
        const existing = entityDirectories.contacts.byEmail.get(normalizedEmail);
        if (existing) {
            const enriched = await attachLeadOrigin(existing);
            return { contact_id: enriched.id, contact: enriched };
        }
    }

    const nowIso = new Date().toISOString();
    const payload = {
        first_name: newContact.firstName?.trim() || '',
        last_name: newContact.lastName?.trim() || '',
        email: newContact.email?.trim() || undefined,
        phone: newContact.phone?.trim() || undefined,
        status: newContact.status || defaultStatus,
        created_at: nowIso,
        updated_at: nowIso
    };

    if (companyLink?.company_id) {
        payload.company_id = companyLink.company_id;
        payload.company_name = companyLink.company_name;
    }

    if (normalizedOriginId) {
        payload.lead_origin_id = normalizedOriginId;
        if (!payload.lead_source) {
            payload.lead_source = 'Lead Conversion';
        }
    }

    Object.keys(payload).forEach(key => {
        if (payload[key] === undefined || payload[key] === '') {
            delete payload[key];
        }
    });

    try {
        const response = await fetch('tables/contacts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error('Failed to create contact');
        }
        const record = await response.json();
        updateContactDirectory([record], { merge: true });
        return { contact_id: record.id, contact: record };
    } catch (error) {
        console.error('Error creating contact from inline form:', error);
        throw error;
    }
}

window.updateCompanyDirectory = updateCompanyDirectory;
window.updateContactDirectory = updateContactDirectory;
window.ensureCompanyAssociation = ensureCompanyAssociation;
window.ensureContactAssociation = ensureContactAssociation;

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
        'settings.density': 'Density',
        'settings.densityCompact': 'Compact',
        'settings.densityComfortable': 'Comfortable',
        'header.searchPlaceholder': 'Search anything...',
        'header.quickActionsButton': 'Quick actions',
        'header.quickCreateSection': 'Quick create',
        'header.globalAddDescription': 'Create new records without leaving your current view.',
        'header.globalLinkSection': 'Link records',
        'header.globalLinkDescription': 'Connect contacts and companies across modules.',
        'header.quickLinkContactCompany': 'Link contact to company',
        'header.selectContactLabel': 'Choose contact',
        'header.selectCompanyLabel': 'Choose company',
        'header.selectContactPlaceholder': 'Select a contact',
        'header.selectCompanyPlaceholder': 'Select a company',
        'header.linkContactSubmit': 'Link contact',
        'header.launchOpportunityFromContact': 'Create opportunity from contact',
        'header.linkInstructions': 'We\'ll update the contact with the selected account immediately.',
        'header.quickOpportunityHint': 'Use the selected contact and company to start a deal in Opportunities.',
        'header.linkNoCompanyOption': 'Keep unlinked',
        'page.dashboard.title': 'Dashboard',
        'page.dashboard.subtitle': 'Welcome to your CRM dashboard',
        'page.contacts.title': 'Contacts',
        'page.contacts.subtitle': 'Manage your customer contacts',
        'page.companies.title': 'Companies',
        'page.companies.subtitle': 'Manage your business accounts',
        'page.leads.title': 'Leads',
        'page.leads.subtitle': 'Track and manage your sales leads',
        'leads.heading': 'All Leads',
        'leads.searchPlaceholder': 'Search leads...',
        'leads.addLead': 'Add Lead',
        'leads.filter.status.all': 'All Statuses',
        'leads.filter.status.new': 'New',
        'leads.filter.status.contacted': 'Contacted',
        'leads.filter.status.qualified': 'Qualified',
        'leads.filter.status.proposal': 'Proposal',
        'leads.filter.status.negotiation': 'Negotiation',
        'leads.filter.status.won': 'Won',
        'leads.filter.status.lost': 'Lost',
        'leads.filter.priority.all': 'All Priorities',
        'leads.filter.priority.low': 'Low',
        'leads.filter.priority.medium': 'Medium',
        'leads.filter.priority.high': 'High',
        'leads.filter.priority.critical': 'Critical',
        'leads.table.title': 'Lead Title',
        'leads.table.value': 'Value',
        'leads.table.status': 'Status',
        'leads.table.priority': 'Priority',
        'leads.table.expectedClose': 'Expected Close',
        'leads.table.assignedTo': 'Assigned To',
        'leads.table.actions': 'Actions',
        'leads.empty': 'No leads found',
        'leads.emptyCta': 'Add your first lead',
        'opportunities.addOpportunity': 'Add Opportunity',
        'leads.noDescription': 'No description',
        'leads.notSet': 'Not set',
        'leads.unassigned': 'Unassigned',
        'leads.board.title': 'Lead Pipeline',
        'leads.board.subtitle': 'Drag and drop leads between stages or update them inline.',
        'leads.board.emptyColumn': 'No leads in this stage yet',
        'leads.board.convertPrompt': 'This lead is now qualified. Would you like to convert it?',
        'leads.loadError': 'Failed to load leads',
        'leads.status.new': 'New',
        'leads.status.contacted': 'Contacted',
        'leads.status.qualified': 'Qualified',
        'leads.status.proposal': 'Proposal',
        'leads.status.negotiation': 'Negotiation',
        'leads.status.won': 'Won',
        'leads.status.lost': 'Lost',
        'leads.priority.low': 'Low',
        'leads.priority.medium': 'Medium',
        'leads.priority.high': 'High',
        'leads.priority.critical': 'Critical',
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
        'settings.density': 'Щільність',
        'settings.densityCompact': 'Компактний',
        'settings.densityComfortable': 'Комфортний',
        'header.searchPlaceholder': 'Пошук...',
        'header.quickActionsButton': 'Швидкі дії',
        'header.quickCreateSection': 'Швидке створення',
        'header.globalAddDescription': 'Створюйте записи, не залишаючи поточного розділу.',
        'header.globalLinkSection': 'Пов’язати записи',
        'header.globalLinkDescription': 'З’єднуйте контакти й компанії між модулями.',
        'header.quickLinkContactCompany': 'Пов’язати контакт з компанією',
        'header.selectContactLabel': 'Оберіть контакт',
        'header.selectCompanyLabel': 'Оберіть компанію',
        'header.selectContactPlaceholder': 'Виберіть контакт',
        'header.selectCompanyPlaceholder': 'Виберіть компанію',
        'header.linkContactSubmit': 'Пов’язати контакт',
        'header.launchOpportunityFromContact': 'Створити угоду з контакту',
        'header.linkInstructions': 'Ми миттєво оновимо контакт обраним акаунтом.',
        'header.quickOpportunityHint': 'Скористайтеся вибраними контактами й компанією, щоб створити угоду.',
        'header.linkNoCompanyOption': 'Залишити без прив’язки',
        'page.dashboard.title': 'Панель керування',
        'page.dashboard.subtitle': 'Ласкаво просимо до CRM-панелі',
        'page.contacts.title': 'Контакти',
        'page.contacts.subtitle': 'Керуйте контактами клієнтів',
        'page.companies.title': 'Компанії',
        'page.companies.subtitle': 'Керуйте обліковими записами компаній',
        'page.leads.title': 'Ліди',
        'page.leads.subtitle': 'Відстежуйте та керуйте потенційними клієнтами',
        'leads.heading': 'Усі ліди',
        'leads.searchPlaceholder': 'Пошук лідів...',
        'leads.addLead': 'Додати лід',
        'leads.filter.status.all': 'Усі статуси',
        'leads.filter.status.new': 'Новий',
        'leads.filter.status.contacted': 'На зв’язку',
        'leads.filter.status.qualified': 'Кваліфікований',
        'leads.filter.status.proposal': 'Пропозиція',
        'leads.filter.status.negotiation': 'Перемовини',
        'leads.filter.status.won': 'Успішний',
        'leads.filter.status.lost': 'Втрачений',
        'leads.filter.priority.all': 'Усі пріоритети',
        'leads.filter.priority.low': 'Низький',
        'leads.filter.priority.medium': 'Середній',
        'leads.filter.priority.high': 'Високий',
        'leads.filter.priority.critical': 'Критичний',
        'leads.table.title': 'Назва ліда',
        'leads.table.value': 'Вартість',
        'leads.table.status': 'Статус',
        'leads.table.priority': 'Пріоритет',
        'leads.table.expectedClose': 'Очікуване закриття',
        'leads.table.assignedTo': 'Відповідальний',
        'leads.table.actions': 'Дії',
        'leads.empty': 'Лідів не знайдено',
        'leads.emptyCta': 'Додайте перший лід',
        'leads.noDescription': 'Без опису',
        'leads.notSet': 'Не вказано',
        'leads.unassigned': 'Не призначено',
        'leads.board.title': 'Канбан лідів',
        'leads.board.subtitle': 'Перетягайте ліди між етапами або змінюйте статус у списку.',
        'leads.board.emptyColumn': 'У цьому етапі поки немає лідів',
        'leads.board.convertPrompt': 'Лід став кваліфікованим. Конвертувати його зараз?',
        'leads.loadError': 'Не вдалося завантажити ліди',
        'leads.status.new': 'Новий',
        'leads.status.contacted': 'На зв’язку',
        'leads.status.qualified': 'Кваліфікований',
        'leads.status.proposal': 'Пропозиція',
        'leads.status.negotiation': 'Перемовини',
        'leads.status.won': 'Успішний',
        'leads.status.lost': 'Втрачений',
        'leads.priority.low': 'Низький',
        'leads.priority.medium': 'Середній',
        'leads.priority.high': 'Високий',
        'leads.priority.critical': 'Критичний',
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
        'opportunities.addOpportunity': 'Додати угоду',
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
const DEFAULT_DENSITY = 'compact';
const FONT_FAMILY_STORAGE_KEY = 'appFontFamily';
const FONT_SIZE_STORAGE_KEY = 'appFontSize';
const LANGUAGE_STORAGE_KEY = 'appLanguage';
const THEME_STORAGE_KEY = 'appTheme';
const DENSITY_STORAGE_KEY = 'appDensity';

let currentLanguage = DEFAULT_LANGUAGE;
let currentTheme = DEFAULT_THEME;
let currentDensity = DEFAULT_DENSITY;
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

function applyDensity(density) {
    const normalizedDensity = SUPPORTED_DENSITIES[density] ? density : DEFAULT_DENSITY;
    const previousDensity = currentDensity;
    currentDensity = normalizedDensity;

    if (document.body) {
        document.body.classList.remove('density-compact', 'density-comfortable');
        document.body.classList.add(`density-${normalizedDensity}`);
    }

    const densitySelect = document.getElementById('densitySelect');
    if (densitySelect && densitySelect.value !== normalizedDensity) {
        densitySelect.value = normalizedDensity;
    }

    if (previousDensity !== normalizedDensity) {
        setStoredPreference(DENSITY_STORAGE_KEY, normalizedDensity);
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
            closeGlobalActionsMenu();
            closeModal();
        }
    });

    const globalActionsWrapper = document.getElementById('globalActionsWrapper');
    const globalActionsButton = document.getElementById('globalActionsButton');
    const globalActionsMenu = document.getElementById('globalActionsMenu');

    if (globalActionsWrapper && globalActionsButton && globalActionsMenu) {
        globalActionsButton.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            toggleGlobalActionsMenu();
        });

        globalActionsMenu.addEventListener('click', event => {
            const actionButton = event.target.closest('[data-global-action]');
            if (!actionButton) {
                return;
            }
            const action = actionButton.getAttribute('data-global-action');
            if (action) {
                handleGlobalAction(action);
            }
        });

        document.addEventListener('click', event => {
            if (!globalActionsWrapper.contains(event.target)) {
                closeGlobalActionsMenu();
            }
        });
    }
}

function toggleGlobalActionsMenu(forceState) {
    const menu = document.getElementById('globalActionsMenu');
    const button = document.getElementById('globalActionsButton');
    if (!menu || !button) {
        return;
    }

    let shouldOpen = forceState;
    if (typeof shouldOpen !== 'boolean') {
        shouldOpen = menu.classList.contains('hidden');
    }

    if (shouldOpen) {
        menu.classList.remove('hidden');
        button.setAttribute('aria-expanded', 'true');
    } else {
        menu.classList.add('hidden');
        button.setAttribute('aria-expanded', 'false');
    }
}

function closeGlobalActionsMenu() {
    const menu = document.getElementById('globalActionsMenu');
    const button = document.getElementById('globalActionsButton');
    if (!menu) {
        return false;
    }
    if (!menu.classList.contains('hidden')) {
        menu.classList.add('hidden');
        if (button) {
            button.setAttribute('aria-expanded', 'false');
        }
        return true;
    }
    return false;
}

async function handleGlobalAction(action) {
    closeGlobalActionsMenu();

    switch (action) {
        case 'add-contact':
            showContactForm();
            break;
        case 'add-company':
            if (typeof showCompanyForm === 'function') {
                showCompanyForm();
            } else {
                showToast('Company form is not available right now.', 'warning');
            }
            break;
        case 'add-lead':
            if (typeof showLeadForm === 'function') {
                showLeadForm();
            } else {
                showToast('Lead form is not available right now.', 'warning');
            }
            break;
        case 'add-opportunity':
            if (typeof showOpportunityForm === 'function') {
                showOpportunityForm();
            } else {
                showToast('Opportunity form is not available right now.', 'warning');
            }
            break;
        case 'link-records':
            await showLinkRecordsModal();
            break;
        default:
            console.warn('Unhandled global action:', action);
            break;
    }
}

async function showLinkRecordsModal(defaults = {}) {
    await Promise.all([
        ensureEntityDirectoryData('contacts'),
        ensureEntityDirectoryData('companies')
    ]);

    const defaultContactId = defaults.contactId ? String(defaults.contactId).trim() : '';
    const defaultCompanyId = defaults.companyId ? String(defaults.companyId).trim() : '';

    if (defaultContactId && !entityDirectories.contacts.byId.has(defaultContactId)) {
        await resolveContactRecord(defaultContactId);
    }

    if (defaultCompanyId && !entityDirectories.companies.byId.has(defaultCompanyId)) {
        await resolveCompanyRecord(defaultCompanyId);
    }

    const contacts = [...(entityDirectories.contacts.list || [])]
        .filter(contact => contact && contact.id)
        .sort((a, b) => getContactDisplayName(a).localeCompare(getContactDisplayName(b), undefined, { sensitivity: 'base' }));

    const companies = [...(entityDirectories.companies.list || [])]
        .filter(company => company && company.id)
        .sort((a, b) => getCompanyDisplayName(a).localeCompare(getCompanyDisplayName(b), undefined, { sensitivity: 'base' }));

    const contactOptions = contacts.map(contact => `
        <option value="${sanitizeText(contact.id)}" ${defaultContactId && contact.id === defaultContactId ? 'selected' : ''}>
            ${sanitizeText(getContactDisplayName(contact))}
        </option>
    `).join('');

    const companyOptions = companies.map(company => `
        <option value="${sanitizeText(company.id)}" ${defaultCompanyId && company.id === defaultCompanyId ? 'selected' : ''}>
            ${sanitizeText(getCompanyDisplayName(company))}
        </option>
    `).join('');

    showModal(translate('header.globalLinkSection'), `
        <div class="space-y-6">
            <div>
                <h4 class="text-sm font-semibold text-gray-700" data-i18n="header.quickLinkContactCompany">Link contact to company</h4>
                <p class="text-xs text-gray-500 mt-1" data-i18n="header.linkInstructions">We'll update the contact with the selected account immediately.</p>
                <form id="linkContactCompanyForm" class="mt-4 space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1" data-i18n="header.selectContactLabel">Choose contact</label>
                        <select name="contact_id" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="" data-i18n="header.selectContactPlaceholder">Select a contact</option>
                            ${contactOptions}
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1" data-i18n="header.selectCompanyLabel">Choose company</label>
                        <select name="company_id" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="" data-i18n="header.linkNoCompanyOption">Keep unlinked</option>
                            ${companyOptions}
                        </select>
                    </div>
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <p class="text-xs text-gray-500" data-i18n="header.quickOpportunityHint">Use the selected contact and company to start a deal in Opportunities.</p>
                        <div class="flex flex-col sm:flex-row gap-2">
                            <button type="button" data-link-action="launch-opportunity" class="inline-flex items-center justify-center px-4 py-2 border border-purple-200 text-purple-600 rounded-lg hover:bg-purple-50">
                                <i class="fas fa-rocket mr-2"></i>
                                <span data-i18n="header.launchOpportunityFromContact">Create opportunity from contact</span>
                            </button>
                            <button type="submit" class="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                <i class="fas fa-link mr-2"></i>
                                <span data-i18n="header.linkContactSubmit">Link contact</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `);

    applyTranslations();

    const form = document.getElementById('linkContactCompanyForm');
    if (!form) {
        return;
    }

    const contactSelect = form.querySelector('select[name="contact_id"]');
    const companySelect = form.querySelector('select[name="company_id"]');
    const opportunityButton = form.querySelector('[data-link-action="launch-opportunity"]');

    const syncCompanySelection = () => {
        if (!contactSelect || !companySelect) {
            return;
        }
        const selectedContactId = contactSelect.value;
        if (!selectedContactId) {
            return;
        }
        const contact = entityDirectories.contacts.byId.get(selectedContactId);
        if (contact?.company_id && entityDirectories.companies.byId.has(String(contact.company_id))) {
            companySelect.value = String(contact.company_id);
        } else if (contact?.company_id && !companySelect.value) {
            companySelect.value = String(contact.company_id);
        } else if (!contact?.company_id) {
            companySelect.value = '';
        }
    };

    contactSelect?.addEventListener('change', () => {
        syncCompanySelection();
    });

    form.addEventListener('submit', async event => {
        event.preventDefault();
        const contactId = contactSelect?.value || '';
        const companyId = companySelect?.value || '';
        await linkContactToCompany(contactId, companyId);
        syncCompanySelection();
    });

    opportunityButton?.addEventListener('click', async event => {
        event.preventDefault();
        const contactId = contactSelect?.value || '';
        const companyId = companySelect?.value || '';
        await launchOpportunityFromLink(contactId, companyId);
    });

    if (contactSelect && !contactSelect.value && defaultContactId) {
        contactSelect.value = defaultContactId;
        syncCompanySelection();
    }

    if (companySelect && !companySelect.value && defaultCompanyId) {
        companySelect.value = defaultCompanyId;
    }

    contactSelect?.focus();
}

async function linkContactToCompany(contactId, companyId) {
    const normalizedContactId = contactId ? String(contactId).trim() : '';
    const normalizedCompanyId = companyId ? String(companyId).trim() : '';

    if (!normalizedContactId) {
        showToast(translate('header.selectContactPlaceholder'), 'warning');
        return;
    }

    showLoading();
    try {
        const contact = await resolveContactRecord(normalizedContactId);
        if (!contact) {
            throw new Error('Contact not found');
        }

        let company = null;
        if (normalizedCompanyId) {
            company = await resolveCompanyRecord(normalizedCompanyId);
            if (!company) {
                throw new Error('Company not found');
            }
        }

        const payload = {
            company_id: normalizedCompanyId || null,
            company_name: company ? getCompanyDisplayName(company) : (normalizedCompanyId ? contact.company_name || '' : null),
            updated_at: new Date().toISOString()
        };

        if (!payload.company_name) {
            delete payload.company_name;
        }

        const response = await fetch(`tables/contacts/${encodeURIComponent(normalizedContactId)}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error('Failed to link contact');
        }

        const updated = await response.json();
        updateContactDirectory([updated], { merge: true });

        if (currentView === 'contacts') {
            await loadContacts();
        } else if (currentView === 'companies' && typeof loadCompanies === 'function') {
            await loadCompanies();
        }

        showToast(normalizedCompanyId ? 'Contact linked to company' : 'Contact link removed', 'success');
    } catch (error) {
        console.error('Error linking contact and company:', error);
        showToast('Unable to update contact link. Please try again.', 'error');
    } finally {
        hideLoading();
    }
}

async function launchOpportunityFromLink(contactId, companyId) {
    const normalizedContactId = contactId ? String(contactId).trim() : '';
    if (!normalizedContactId) {
        showToast(translate('header.selectContactPlaceholder'), 'warning');
        return;
    }

    const contact = await resolveContactRecord(normalizedContactId);
    if (!contact) {
        showToast('Unable to locate contact details.', 'error');
        return;
    }

    let normalizedCompanyId = companyId ? String(companyId).trim() : '';
    if (!normalizedCompanyId && contact.company_id) {
        normalizedCompanyId = String(contact.company_id);
    }

    let companyName = contact.company_name || '';
    if (normalizedCompanyId) {
        const company = await resolveCompanyRecord(normalizedCompanyId);
        if (company) {
            companyName = getCompanyDisplayName(company);
        }
    }

    closeModal();

    if (typeof showOpportunityForm === 'function') {
        showOpportunityForm(null, {
            defaultContactId: normalizedContactId,
            defaultContactName: getContactDisplayName(contact),
            defaultCompanyId: normalizedCompanyId || '',
            defaultCompanyName: companyName
        });
    } else {
        showToast('Opportunity form is not available right now.', 'warning');
    }
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
    const densitySelect = document.getElementById('densitySelect');

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

    const savedDensity = getStoredPreference(DENSITY_STORAGE_KEY);
    const initialDensity = SUPPORTED_DENSITIES[savedDensity] ? savedDensity : DEFAULT_DENSITY;
    applyDensity(initialDensity);
    if (densitySelect) {
        densitySelect.value = initialDensity;
        densitySelect.addEventListener('change', event => {
            applyDensity(event.target.value);
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

    const statusFilterOptions = renderSelectOptions(
        getDictionaryEntries('contacts', 'statuses'),
        '',
        {
            includeBlank: true,
            blankLabel: translate('contacts.filter.status.all'),
            blankI18nKey: 'contacts.filter.status.all'
        }
    );

    const sourceFilterOptions = renderSelectOptions(
        getDictionaryEntries('contacts', 'leadSources'),
        '',
        {
            includeBlank: true,
            blankLabel: translate('contacts.filter.source.all'),
            blankI18nKey: 'contacts.filter.source.all'
        }
    );

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
                    ${statusFilterOptions}
                </select>
                <select id="sourceFilter" class="border border-gray-300 rounded-lg px-3 py-2">
                    ${sourceFilterOptions}
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
        const records = Array.isArray(data?.data) ? data.data : [];

        displayContacts(records);
        if (typeof updateContactDirectory === 'function') {
            updateContactDirectory(records, { merge: true });
        }
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

async function showContactForm(contactId = null, options = {}) {
    const isEdit = contactId !== null;
    const {
        defaultCompanyId = '',
        defaultCompanyName = ''
    } = options || {};
    let contact = {};

    if (isEdit) {
        try {
            const response = await fetch(`tables/contacts/${contactId}`);
            if (!response.ok) {
                throw new Error('Not found');
            }
            contact = await response.json();
        } catch (error) {
            console.error('Error loading contact details:', error);
            showToast('Failed to load contact', 'error');
            return;
        }
    }

    if (!isEdit) {
        if (defaultCompanyId) {
            contact.company_id = defaultCompanyId;
        }
        if (defaultCompanyName) {
            contact.company_name = defaultCompanyName;
        }
    }

    let companies = [];
    try {
        const response = await fetch('tables/companies?limit=1000');
        if (response.ok) {
            const payload = await response.json();
            companies = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
        }
    } catch (error) {
        console.warn('Unable to load companies for contact form:', error);
    }

    if (typeof updateCompanyDirectory === 'function') {
        updateCompanyDirectory(companies, { merge: true });
    }

    const selectedCompanyId = contact.company_id || '';
    let hasCurrentCompany = false;
    const companyOptionsHtml = companies.map(company => {
        if (!company || !company.id) {
            return '';
        }
        const isSelected = selectedCompanyId && company.id === selectedCompanyId;
        if (isSelected) {
            hasCurrentCompany = true;
        }
        const optionLabel = sanitizeText(company.name || company.website || company.id);
        return `<option value="${sanitizeText(company.id)}" ${isSelected ? 'selected' : ''}>${optionLabel}</option>`;
    }).join('');

    const fallbackCompanyOption = !hasCurrentCompany && selectedCompanyId && contact.company_name
        ? `<option value="${sanitizeText(selectedCompanyId)}" selected>${sanitizeText(contact.company_name)}</option>`
        : '';

    const hiddenCompanyName = sanitizeText(contact.company_name || '');
    const normalizedContactNote = normalizeVaultPath(contact.obsidian_note || '');
    const contactNoteHref = normalizedContactNote ? `vault/${encodeURI(normalizedContactNote)}` : '';
    const contactNoteValue = sanitizeText(contact.obsidian_note || '');

    const contactStatusOptions = renderSelectOptions(
        getDictionaryEntries('contacts', 'statuses'),
        contact.status || 'Active'
    );

    const contactLeadSourceOptions = renderSelectOptions(
        getDictionaryEntries('contacts', 'leadSources'),
        contact.lead_source || '',
        {
            includeBlank: true,
            blankLabel: 'Select source...'
        }
    );

    const newCompanyStatusOptions = renderSelectOptions(
        getDictionaryEntries('companies', 'statuses'),
        'Prospect'
    );

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
                <label class="block text-sm font-medium text-gray-700 mb-2">Company</label>
                <select id="contactCompanySelect" name="company_id"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Not linked</option>
                    ${fallbackCompanyOption}
                    ${companyOptionsHtml}
                </select>
                <input type="hidden" name="company_name" id="contactCompanyName" value="${hiddenCompanyName}">
                <p class="mt-1 text-xs text-gray-500">Link this person to an account now or leave unlinked and connect later.</p>
                <button type="button" id="contactNewCompanyToggle" data-label-create="Create new company" data-label-cancel="Use existing company"
                        class="mt-2 text-sm text-blue-600 hover:text-blue-700">Create new company</button>
                <div id="contactNewCompanySection" class="hidden mt-4 space-y-4 border border-blue-100 rounded-lg p-4 bg-blue-50/50">
                    <p class="text-xs text-blue-700">We'll automatically create this company when you save the contact.</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                            <input type="text" name="new_company_name" placeholder="Acme Corporation"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Website</label>
                            <input type="url" name="new_company_website" placeholder="https://example.com"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                            <input type="text" name="new_company_industry" placeholder="Software"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select name="new_company_status" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                ${newCompanyStatusOptions}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
                            <input type="text" name="new_company_size" placeholder="50-100"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select name="status" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        ${contactStatusOptions}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Lead Source</label>
                    <select name="lead_source" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        ${contactLeadSourceOptions}
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
                <label class="block text-sm font-medium text-gray-700 mb-2">Obsidian Note Path</label>
                <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                    <input type="text" name="obsidian_note" value="${contactNoteValue}" placeholder="Contacts/Name – Company.md"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <div class="flex items-center gap-2">
                        <button type="button" class="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                                data-contact-note-trigger>
                            <i class="fas fa-link mr-1"></i>Open Obsidian
                        </button>
                        <a ${contactNoteHref ? `href="${contactNoteHref}"` : ''}
                           class="text-sm text-blue-600 hover:text-blue-700 ${contactNoteHref ? '' : 'hidden'}"
                           target="_blank" rel="noopener" data-contact-note-link>
                            <i class="fas fa-file-lines mr-1"></i>View Markdown
                        </a>
                    </div>
                </div>
                <p class="text-xs text-gray-500 mt-1">Store the relative path to this contact's note inside the Obsidian vault.</p>
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

    const form = document.getElementById('contactForm');
    const companySelect = form.querySelector('#contactCompanySelect');
    const companyNameInput = form.querySelector('#contactCompanyName');
    const newCompanyToggle = form.querySelector('#contactNewCompanyToggle');
    const newCompanySection = form.querySelector('#contactNewCompanySection');
    const newCompanyNameInput = form.querySelector('input[name="new_company_name"]');
    const toggleCreateLabel = newCompanyToggle?.dataset?.labelCreate || 'Create new company';
    const toggleCancelLabel = newCompanyToggle?.dataset?.labelCancel || 'Use existing company';

    const syncCompanyName = () => {
        if (!companySelect || !companyNameInput) {
            return;
        }
        const selectedOption = companySelect.selectedOptions?.[0];
        companyNameInput.value = selectedOption ? selectedOption.textContent.trim() : '';
    };

    syncCompanyName();

    companySelect?.addEventListener('change', () => {
        if (newCompanySection) {
            newCompanySection.classList.add('hidden');
        }
        if (newCompanyToggle) {
            newCompanyToggle.setAttribute('data-expanded', 'false');
            newCompanyToggle.textContent = toggleCreateLabel;
        }
        if (newCompanyNameInput) {
            newCompanyNameInput.value = '';
        }
        syncCompanyName();
    });

    newCompanyToggle?.addEventListener('click', event => {
        event.preventDefault();
        if (!newCompanySection) {
            return;
        }
        const expanded = newCompanyToggle.getAttribute('data-expanded') === 'true';
        if (expanded) {
            newCompanySection.classList.add('hidden');
            newCompanyToggle.setAttribute('data-expanded', 'false');
            newCompanyToggle.textContent = toggleCreateLabel;
            syncCompanyName();
        } else {
            newCompanySection.classList.remove('hidden');
            newCompanyToggle.setAttribute('data-expanded', 'true');
            newCompanyToggle.textContent = toggleCancelLabel;
            if (companySelect) {
                companySelect.value = '';
            }
            if (companyNameInput) {
                companyNameInput.value = '';
            }
            newCompanyNameInput?.focus();
        }
    });

    const noteInput = form.querySelector('input[name="obsidian_note"]');
    const noteButton = form.querySelector('[data-contact-note-trigger]');
    const noteLink = form.querySelector('[data-contact-note-link]');

    const updateNoteLink = () => {
        if (!noteLink || !noteInput) {
            return;
        }
        const normalized = normalizeVaultPath(noteInput.value || '');
        if (normalized) {
            noteLink.classList.remove('hidden');
            noteLink.setAttribute('href', `vault/${encodeURI(normalized)}`);
        } else {
            noteLink.classList.add('hidden');
            noteLink.removeAttribute('href');
        }
    };

    updateNoteLink();

    noteInput?.addEventListener('input', () => {
        updateNoteLink();
    });

    noteButton?.addEventListener('click', event => {
        event.preventDefault();
        if (!noteInput) {
            return;
        }
        const value = noteInput.value?.trim();
        if (!value) {
            showToast('Add a note path before opening Obsidian', 'warning');
            return;
        }
        if (typeof openObsidianNote === 'function') {
            openObsidianNote(value);
        } else {
            const normalized = normalizeVaultPath(value);
            if (!normalized) {
                showToast('Unable to resolve the note path', 'warning');
                return;
            }
            const url = `vault/${encodeURI(normalized)}`;
            window.open(url, '_blank');
        }
    });

    form.addEventListener('submit', async event => {
        event.preventDefault();
        await saveContact(contactId, new FormData(form));
    });
}

async function saveContact(contactId, formData) {
    showLoading();
    try {
        const formValues = {};
        for (const [rawKey, rawValue] of formData.entries()) {
            if (typeof rawValue === 'string') {
                const trimmed = rawValue.trim();
                if (trimmed) {
                    formValues[rawKey] = trimmed;
                }
            } else if (rawValue !== undefined && rawValue !== null) {
                formValues[rawKey] = rawValue;
            }
        }

        let companyLink = null;
        if (typeof ensureCompanyAssociation === 'function') {
            companyLink = await ensureCompanyAssociation({
                selectedId: formValues.company_id,
                companyName: formValues.company_name,
                newCompany: {
                    name: formValues.new_company_name,
                    website: formValues.new_company_website,
                    industry: formValues.new_company_industry,
                    status: formValues.new_company_status,
                    size: formValues.new_company_size
                }
            });
        }

        if (companyLink) {
            if (companyLink.company_id) {
                formValues.company_id = companyLink.company_id;
            } else {
                delete formValues.company_id;
            }
            if (companyLink.company_name) {
                formValues.company_name = companyLink.company_name;
            }
        } else {
            if (!formValues.company_id) {
                delete formValues.company_id;
            }
            if (!formValues.company_name) {
                delete formValues.company_name;
            }
        }

        delete formValues.new_company_name;
        delete formValues.new_company_website;
        delete formValues.new_company_industry;
        delete formValues.new_company_status;
        delete formValues.new_company_size;

        const data = { ...formValues };
        const nowIso = new Date().toISOString();
        data.updated_at = nowIso;

        if (!contactId) {
            data.created_at = nowIso;
            if (currentUser) {
                data.created_by = currentUser;
            }
            if (!data.status) {
                data.status = 'Active';
            }
        }

        const method = contactId ? 'PUT' : 'POST';
        const url = contactId ? `tables/contacts/${contactId}` : 'tables/contacts';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Save failed');
        }

        const savedContact = await response.json();
        if (savedContact && typeof updateContactDirectory === 'function') {
            updateContactDirectory([savedContact], { merge: true });
        }

        showToast(contactId ? 'Contact updated successfully' : 'Contact created successfully', 'success');
        const reopenOpportunityId = window.opportunityModalState && window.opportunityModalState.reopenAfterForm
            ? window.opportunityModalState.currentId
            : null;
        if (window.opportunityModalState) {
            window.opportunityModalState.reopenAfterForm = false;
        }
        closeModal();
        if (reopenOpportunityId) {
            await viewOpportunity(reopenOpportunityId);
        }
        await loadContacts();
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
    if (window.opportunityModalState) {
        window.opportunityModalState.currentId = null;
        window.opportunityModalState.reopenAfterForm = false;
    }
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

function normalizeVaultPath(path) {
    if (!path) {
        return '';
    }
    const trimmed = String(path).trim();
    if (!trimmed) {
        return '';
    }
    return trimmed.replace(/^\/+/, '').replace(/^vault\//i, '');
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

function getContactDisplayName(contact) {
    if (!contact) {
        return '';
    }
    const name = [contact.first_name, contact.last_name]
        .filter(Boolean)
        .join(' ')
        .trim();
    if (name) {
        return name;
    }
    if (contact.email) {
        return contact.email;
    }
    return contact.title || contact.id || '';
}

function getCompanyDisplayName(company) {
    if (!company) {
        return '';
    }
    return company.name || company.website || company.id || '';
}

async function resolveContactRecord(contactId) {
    const normalizedId = contactId ? String(contactId).trim() : '';
    if (!normalizedId) {
        return null;
    }
    await ensureEntityDirectoryData('contacts');
    const cached = entityDirectories.contacts.byId.get(normalizedId);
    if (cached) {
        return cached;
    }
    try {
        const response = await fetch(`tables/contacts/${encodeURIComponent(normalizedId)}`);
        if (response.ok) {
            const record = await response.json();
            updateContactDirectory([record], { merge: true });
            return record;
        }
    } catch (error) {
        console.warn('Unable to resolve contact by id:', error);
    }
    return null;
}

async function resolveCompanyRecord(companyId) {
    const normalizedId = companyId ? String(companyId).trim() : '';
    if (!normalizedId) {
        return null;
    }
    await ensureEntityDirectoryData('companies');
    const cached = entityDirectories.companies.byId.get(normalizedId);
    if (cached) {
        return cached;
    }
    try {
        const response = await fetch(`tables/companies/${encodeURIComponent(normalizedId)}`);
        if (response.ok) {
            const record = await response.json();
            updateCompanyDirectory([record], { merge: true });
            return record;
        }
    } catch (error) {
        console.warn('Unable to resolve company by id:', error);
    }
    return null;
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
    if (!contactId) {
        return;
    }

    showLoading();
    try {
        const response = await fetch(`tables/contacts/${contactId}`);
        if (!response.ok) {
            throw new Error('Not found');
        }
        const contact = await response.json();

        const parseList = payload => {
            if (Array.isArray(payload?.data)) {
                return payload.data;
            }
            if (Array.isArray(payload)) {
                return payload;
            }
            return [];
        };

        const companyPromise = contact.company_id
            ? fetch(`tables/companies/${encodeURIComponent(contact.company_id)}`)
                .then(res => (res.ok ? res.json() : null))
                .catch(() => null)
            : Promise.resolve(null);

        const [company, leadsPayload, dealsPayload, tasksPayload, activitiesPayload, notesPayload, relatedDataset] = await Promise.all([
            companyPromise,
            fetch(`tables/leads?contact_id=${encodeURIComponent(contact.id)}&limit=1000`).then(res => res.json()).catch(() => ({ data: [] })),
            fetch(`tables/opportunities?primary_contact_id=${encodeURIComponent(contact.id)}&limit=1000`).then(res => res.json()).catch(() => ({ data: [] })),
            fetch('tables/tasks?limit=1000').then(res => res.json()).catch(() => ({ data: [] })),
            fetch('tables/activities?limit=1000').then(res => res.json()).catch(() => ({ data: [] })),
            fetch(`tables/notes?entity_type=contacts&entity_id=${encodeURIComponent(contact.id)}&limit=1000`).then(res => res.json()).catch(() => ({ data: [] })),
            typeof fetchRelatedRecordsForLinking === 'function'
                ? fetchRelatedRecordsForLinking()
                : Promise.resolve({ leads: [], opportunities: [], companies: [], contacts: [], competitors: [] })
        ]);

        const leads = parseList(leadsPayload);
        const deals = parseList(dealsPayload);
        const tasksAll = parseList(tasksPayload);
        const activitiesAll = parseList(activitiesPayload);
        const notes = parseList(notesPayload);

        const normalizeRelatedValue = value => {
            if (typeof normalizeRelatedFieldValue === 'function') {
                return normalizeRelatedFieldValue(value) || '';
            }
            if (value === undefined || value === null) {
                return '';
            }
            if (typeof value === 'string') {
                return value;
            }
            if (typeof value === 'object') {
                return value.id || value.value || value.path || '';
            }
            return String(value);
        };

        const normalizedContactId = normalizeRelatedValue(contact.id);
        const matchesContactRelation = value => {
            const normalized = normalizeRelatedValue(value);
            if (!normalized) {
                return false;
            }
            return normalized.toLowerCase() === normalizedContactId.toLowerCase();
        };

        const tasks = tasksAll
            .filter(task => matchesContactRelation(task?.related_to) || (task?.contact_id && String(task.contact_id) === contact.id))
            .sort((a, b) => {
                const dateA = new Date(a.due_date || a.updated_at || 0).getTime();
                const dateB = new Date(b.due_date || b.updated_at || 0).getTime();
                return dateA - dateB;
            });

        const activities = activitiesAll
            .filter(activity => matchesContactRelation(activity?.related_to) || (activity?.contact_id && String(activity.contact_id) === contact.id))
            .sort((a, b) => {
                const dateA = new Date(a.date || a.updated_at || 0).getTime();
                const dateB = new Date(b.date || b.updated_at || 0).getTime();
                return dateB - dateA;
            });

        const sortedNotes = notes
            .slice()
            .sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));

        const mergeRecords = (base = [], extras = []) => {
            const map = new Map();
            base.forEach(item => {
                if (item?.id) {
                    map.set(String(item.id), item);
                }
            });
            extras.forEach(item => {
                if (item?.id) {
                    map.set(String(item.id), item);
                }
            });
            return Array.from(map.values());
        };

        const relationDataset = {
            opportunities: mergeRecords(Array.isArray(relatedDataset?.opportunities) ? relatedDataset.opportunities : [], deals),
            leads: mergeRecords(Array.isArray(relatedDataset?.leads) ? relatedDataset.leads : [], leads),
            companies: mergeRecords(Array.isArray(relatedDataset?.companies) ? relatedDataset.companies : [], company ? [company] : []),
            contacts: mergeRecords(Array.isArray(relatedDataset?.contacts) ? relatedDataset.contacts : [], [contact]),
            competitors: Array.isArray(relatedDataset?.competitors) ? relatedDataset.competitors : []
        };

        const nameParts = [contact.first_name, contact.last_name].filter(Boolean);
        const contactName = nameParts.length ? nameParts.join(' ') : (contact.email || contact.phone || contact.id);
        const safeContactName = sanitizeText(contactName);
        const companyName = company?.name ? company.name : '';
        const companyNameSafe = companyName ? sanitizeText(companyName) : '';

        const locationParts = [contact.city, contact.state, contact.country].filter(Boolean);
        const locationText = locationParts.join(', ');

        const obsidianNormalized = normalizeVaultPath(contact.obsidian_note || '');
        const obsidianLinks = obsidianNormalized
            ? `<div class="mt-3 flex flex-wrap items-center gap-2">
                    <button type="button" class="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100" data-open-obsidian-note="${encodeURIComponent(contact.obsidian_note)}">
                        <i class="fas fa-link mr-1"></i>Open in Obsidian
                    </button>
                    <a href="vault/${encodeURI(obsidianNormalized)}" target="_blank" rel="noopener" class="text-sm text-blue-600 hover:text-blue-700">
                        <i class="fas fa-file-lines mr-1"></i>View Markdown
                    </a>
                    <span class="text-xs text-gray-500">${sanitizeText(contact.obsidian_note)}</span>
               </div>`
            : `<p class="mt-3 text-xs text-gray-500">Add an Obsidian note path to jump into your vault from this profile.</p>`;

        const infoItems = [
            {
                label: 'Title',
                icon: 'id-badge',
                value: contact.title ? sanitizeText(contact.title) : '—'
            },
            {
                label: 'Company',
                icon: 'building',
                value: company
                    ? `<button type="button" class="text-sm text-blue-600 hover:text-blue-700" data-contact-action="open-company" data-company-id="${sanitizeText(company.id)}">${companyNameSafe}</button>`
                    : '<span class="text-sm text-gray-500">Not linked</span>'
            },
            {
                label: 'Email',
                icon: 'envelope',
                value: contact.email
                    ? `<a href="mailto:${sanitizeText(contact.email)}" class="text-blue-600 hover:text-blue-700">${sanitizeText(contact.email)}</a>`
                    : '—'
            },
            {
                label: 'Phone',
                icon: 'phone',
                value: contact.phone
                    ? `<a href="tel:${sanitizeText(contact.phone)}" class="text-blue-600 hover:text-blue-700">${sanitizeText(contact.phone)}</a>`
                    : '—'
            },
            {
                label: 'Mobile',
                icon: 'mobile-screen',
                value: contact.mobile
                    ? `<a href="tel:${sanitizeText(contact.mobile)}" class="text-blue-600 hover:text-blue-700">${sanitizeText(contact.mobile)}</a>`
                    : '—'
            },
            {
                label: 'Lead Source',
                icon: 'bullhorn',
                value: contact.lead_source ? sanitizeText(contact.lead_source) : '—'
            },
            {
                label: 'Status',
                icon: 'circle-dot',
                value: contact.status ? `<span class="px-2 py-1 rounded-full ${getStatusClass(contact.status)}">${sanitizeText(contact.status)}</span>` : '—'
            },
            {
                label: 'Location',
                icon: 'location-dot',
                value: locationText ? sanitizeText(locationText) : '—'
            }
        ];

        const infoHtml = infoItems.map(item => `
            <div class="p-4 bg-gray-50 rounded-lg">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide"><i class="fas fa-${item.icon} mr-2 text-gray-400"></i>${item.label}</p>
                <p class="mt-2 text-sm text-gray-800">${item.value}</p>
            </div>
        `).join('');

        const internalNotes = contact.notes
            ? `<div class="mt-4 p-4 bg-gray-50 rounded-lg"><p class="text-sm text-gray-700 whitespace-pre-line">${sanitizeText(contact.notes).replace(/\n/g, '<br>')}</p></div>`
            : '';

        const formatExpectedDate = value => {
            if (!value) {
                return 'No close date';
            }
            const date = new Date(value);
            return Number.isNaN(date.getTime()) ? 'No close date' : date.toLocaleDateString();
        };

        const leadsHtml = leads.length
            ? leads.map(lead => {
                const statusBadge = lead.status ? `<span class="px-2 py-1 text-xs rounded-full ${getStatusClass(lead.status)}">${sanitizeText(lead.status)}</span>` : '';
                return `
                    <div class="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                        <div class="flex items-start justify-between gap-4">
                            <div>
                                <p class="text-sm font-semibold text-gray-800">${sanitizeText(lead.title || 'Lead')}</p>
                                <p class="text-xs text-gray-500">${sanitizeText(lead.company_name || companyName || 'No company')}</p>
                            </div>
                            ${statusBadge}
                        </div>
                        <div class="mt-3 text-sm text-gray-600 flex items-center justify-between">
                            <span>${lead.value ? formatCurrency(lead.value) : 'Value not set'}</span>
                            <span>${formatExpectedDate(lead.expected_close_date)}</span>
                        </div>
                        <div class="mt-3 flex gap-2">
                            <button type="button" class="px-3 py-1 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100" data-contact-action="open-lead" data-lead-id="${sanitizeText(lead.id)}">View</button>
                            <button type="button" class="px-3 py-1 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100" data-contact-action="edit-lead" data-lead-id="${sanitizeText(lead.id)}">Edit</button>
                        </div>
                    </div>
                `;
            }).join('')
            : '<div class="border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">No leads associated with this contact yet.</div>';

        const dealsHtml = deals.length
            ? deals.map(deal => {
                const stageBadge = deal.stage ? `<span class="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">${sanitizeText(deal.stage)}</span>` : '';
                const probabilityText = deal.probability !== undefined ? `${deal.probability}%` : '—';
                const competitorName = deal.competitor_name || deal.relationships?.competitor?.name || '';
                const competitorLine = competitorName
                    ? `<p class="mt-2 text-xs text-rose-600"><i class="fas fa-chess-knight mr-1"></i>${sanitizeText(competitorName)}</p>`
                    : '';
                return `
                    <div class="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                        <div class="flex items-start justify-between gap-4">
                            <div>
                                <p class="text-sm font-semibold text-gray-800">${sanitizeText(deal.name || 'Opportunity')}</p>
                                <p class="text-xs text-gray-500">${sanitizeText(deal.company_name || companyName || 'No company')}</p>
                            </div>
                            ${stageBadge}
                        </div>
                        <div class="mt-3 text-sm text-gray-600 flex items-center justify-between">
                            <span>${deal.value ? formatCurrency(deal.value) : 'Value not set'}</span>
                            <span>Probability: ${probabilityText}</span>
                        </div>
                        ${competitorLine}
                        <div class="mt-3 flex gap-2">
                            <button type="button" class="px-3 py-1 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100" data-contact-action="edit-deal" data-deal-id="${sanitizeText(deal.id)}">Edit</button>
                        </div>
                    </div>
                `;
            }).join('')
            : '<div class="border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">No opportunities linked to this contact yet.</div>';

        const buildRelationLabel = value => {
            if (typeof resolveRelatedRecordDisplay === 'function') {
                const relation = resolveRelatedRecordDisplay(value, relationDataset);
                if (relation) {
                    return `<span class="text-xs text-blue-600"><i class="fas fa-link mr-1"></i>${sanitizeText(relation.typeLabel)}: ${sanitizeText(relation.label)}</span>`;
                }
            }
            return '';
        };

        const tasksHtml = tasks.length
            ? tasks.map(task => {
                const statusClass = typeof getTaskStatusClass === 'function'
                    ? getTaskStatusClass(task.status)
                    : 'bg-blue-100 text-blue-800';
                const relationInfo = buildRelationLabel(task.related_to);
                const description = task.description
                    ? sanitizeText(task.description.length > 80 ? `${task.description.substring(0, 80)}…` : task.description)
                    : 'No description';
                return `
                    <div class="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                        <div class="flex items-start justify-between gap-4">
                            <div>
                                <p class="text-sm font-semibold text-gray-800">${sanitizeText(task.title || 'Task')}</p>
                                <p class="text-xs text-gray-500">${description}</p>
                                ${relationInfo ? `<p class="mt-2">${relationInfo}</p>` : ''}
                            </div>
                            <div class="text-right space-y-1 text-xs text-gray-500">
                                <span class="inline-flex items-center px-2 py-1 rounded-full ${statusClass}">${sanitizeText(task.status || 'In Progress')}</span>
                                <span class="block">${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</span>
                            </div>
                        </div>
                        <div class="mt-3 flex gap-2">
                            <button type="button" class="px-3 py-1 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100" data-contact-action="edit-task" data-task-id="${sanitizeText(task.id)}">Open</button>
                        </div>
                    </div>
                `;
            }).join('')
            : '<div class="border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">No tasks scheduled for this contact.</div>';

        const activitiesHtml = activities.length
            ? activities.map(activity => {
                const icon = typeof getActivityIcon === 'function' ? getActivityIcon(activity.type) : 'circle';
                const relationInfo = buildRelationLabel(activity.related_to);
                const description = activity.description
                    ? sanitizeText(activity.description.length > 100 ? `${activity.description.substring(0, 100)}…` : activity.description)
                    : '';
                return `
                    <div class="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                        <div class="flex items-start justify-between gap-4">
                            <div>
                                <p class="text-sm font-semibold text-gray-800"><i class="fas fa-${icon} mr-2 text-gray-400"></i>${sanitizeText(activity.subject || activity.type || 'Activity')}</p>
                                ${description ? `<p class="text-xs text-gray-500 mt-1">${description}</p>` : ''}
                                ${relationInfo ? `<p class="mt-2">${relationInfo}</p>` : ''}
                            </div>
                            <div class="text-right text-xs text-gray-500 space-y-1">
                                <span>${activity.date ? new Date(activity.date).toLocaleString() : 'No date'}</span>
                                ${activity.outcome ? `<span class="block">Outcome: ${sanitizeText(activity.outcome)}</span>` : ''}
                            </div>
                        </div>
                        <div class="mt-3 flex gap-2">
                            <button type="button" class="px-3 py-1 text-sm border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100" data-contact-action="edit-activity" data-activity-id="${sanitizeText(activity.id)}">Edit</button>
                        </div>
                    </div>
                `;
            }).join('')
            : '<div class="border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">No activities logged for this contact.</div>';

        const notesHtml = sortedNotes.length
            ? sortedNotes.map(note => {
                const vaultPath = normalizeVaultPath(note.vault_path || '');
                const vaultLink = vaultPath
                    ? `<a href="vault/${encodeURI(vaultPath)}" target="_blank" rel="noopener" class="text-xs text-blue-600 hover:text-blue-700">Open note</a>`
                    : '';
                const noteContent = note.content ? sanitizeText(note.content.length > 160 ? `${note.content.substring(0, 160)}…` : note.content) : '';
                return `
                    <div class="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                        <div class="flex items-start justify-between gap-4">
                            <div>
                                <p class="text-sm font-semibold text-gray-800">${sanitizeText(note.title || 'Note')}</p>
                                ${noteContent ? `<p class="text-xs text-gray-500 mt-1">${noteContent}</p>` : ''}
                            </div>
                            <div class="text-right text-xs text-gray-500 space-y-1">
                                ${note.author ? `<span>${sanitizeText(note.author)}</span>` : ''}
                                <span>${note.updated_at ? new Date(note.updated_at).toLocaleString() : ''}</span>
                                ${vaultLink}
                            </div>
                        </div>
                    </div>
                `;
            }).join('')
            : '<div class="border border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">No CRM notes attached to this contact yet.</div>';

        const encodedContactName = encodeURIComponent(contactName);
        const encodedCompanyName = companyName ? encodeURIComponent(companyName) : '';

        const modalHtml = `
            <div class="space-y-6">
                <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                        <div>
                            <h4 class="text-2xl font-semibold text-gray-800">${safeContactName}</h4>
                            ${contact.title ? `<p class="text-sm text-gray-500 mt-1">${sanitizeText(contact.title)}</p>` : ''}
                            <div class="mt-2 flex flex-wrap gap-2 text-sm text-gray-600">
                                ${contact.status ? `<span class="px-2 py-1 rounded-full ${getStatusClass(contact.status)}">${sanitizeText(contact.status)}</span>` : ''}
                                ${contact.lead_source ? `<span class="px-2 py-1 rounded-full bg-sky-100 text-sky-700">${sanitizeText(contact.lead_source)}</span>` : ''}
                                ${companyName ? `<span class="px-2 py-1 rounded-full bg-gray-100 text-gray-700"><i class="fas fa-building mr-1 text-gray-400"></i>${companyNameSafe}</span>` : ''}
                            </div>
                            ${obsidianLinks}
                        </div>
                        <div class="flex flex-col gap-3 items-stretch lg:items-end">
                            <div class="flex flex-wrap gap-2 justify-end">
                                <button type="button" class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" data-contact-action="add-lead" data-contact-id="${sanitizeText(contact.id)}" data-contact-name="${encodedContactName}" data-company-id="${company ? sanitizeText(company.id) : ''}" data-company-name="${encodedCompanyName}">
                                    <i class="fas fa-bullseye mr-2"></i>New Lead
                                </button>
                                <button type="button" class="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700" data-contact-action="add-deal" data-contact-id="${sanitizeText(contact.id)}" data-contact-name="${encodedContactName}" data-company-id="${company ? sanitizeText(company.id) : ''}" data-company-name="${encodedCompanyName}">
                                    <i class="fas fa-briefcase mr-2"></i>New Opportunity
                                </button>
                                <button type="button" class="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100" data-contact-action="add-task" data-contact-id="${sanitizeText(contact.id)}">
                                    <i class="fas fa-list-check mr-2"></i>New Task
                                </button>
                                <button type="button" class="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100" data-contact-action="add-activity" data-contact-id="${sanitizeText(contact.id)}">
                                    <i class="fas fa-clock mr-2"></i>Log Activity
                                </button>
                            </div>
                            <div class="flex flex-wrap gap-2 justify-end">
                                <button type="button" class="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100" data-contact-action="edit" data-contact-id="${sanitizeText(contact.id)}">
                                    <i class="fas fa-edit mr-1"></i>Edit Contact
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${infoHtml}
                    </div>
                    ${internalNotes}
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h5 class="text-lg font-semibold text-gray-800">Leads (${leads.length})</h5>
                            <button type="button" class="text-sm text-blue-600 hover:text-blue-700" data-contact-action="add-lead" data-contact-id="${sanitizeText(contact.id)}" data-contact-name="${encodedContactName}" data-company-id="${company ? sanitizeText(company.id) : ''}" data-company-name="${encodedCompanyName}"><i class="fas fa-plus mr-1"></i>Add Lead</button>
                        </div>
                        <div class="space-y-3">${leadsHtml}</div>
                    </div>
                    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h5 class="text-lg font-semibold text-gray-800">Opportunities (${deals.length})</h5>
                            <button type="button" class="text-sm text-purple-600 hover:text-purple-700" data-contact-action="add-deal" data-contact-id="${sanitizeText(contact.id)}" data-contact-name="${encodedContactName}" data-company-id="${company ? sanitizeText(company.id) : ''}" data-company-name="${encodedCompanyName}"><i class="fas fa-plus mr-1"></i>Add Opportunity</button>
                        </div>
                        <div class="space-y-3">${dealsHtml}</div>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h5 class="text-lg font-semibold text-gray-800">Tasks (${tasks.length})</h5>
                            <button type="button" class="text-sm text-gray-700 hover:text-gray-900" data-contact-action="add-task" data-contact-id="${sanitizeText(contact.id)}"><i class="fas fa-plus mr-1"></i>Add Task</button>
                        </div>
                        <div class="space-y-3">${tasksHtml}</div>
                    </div>
                    <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <div class="flex items-center justify-between mb-4">
                            <h5 class="text-lg font-semibold text-gray-800">Activities (${activities.length})</h5>
                            <button type="button" class="text-sm text-gray-700 hover:text-gray-900" data-contact-action="add-activity" data-contact-id="${sanitizeText(contact.id)}"><i class="fas fa-plus mr-1"></i>Log Activity</button>
                        </div>
                        <div class="space-y-3">${activitiesHtml}</div>
                    </div>
                </div>
                <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h5 class="text-lg font-semibold text-gray-800">Notes (${sortedNotes.length})</h5>
                    </div>
                    <div class="space-y-3">${notesHtml}</div>
                </div>
            </div>
        `;

        showModal('Contact Details', modalHtml);
    } catch (error) {
        console.error('Error viewing contact:', error);
        showToast('Failed to load contact details', 'error');
    } finally {
        hideLoading();
    }
}

function initializeModalEventDelegates() {
    const modalContent = document.getElementById('modalContent');
    if (!modalContent || modalContent.dataset.modalDelegatesAttached === 'true') {
        return;
    }

    modalContent.addEventListener('click', event => {
        const noteTrigger = event.target.closest('[data-open-obsidian-note]');
        if (noteTrigger) {
            const encoded = noteTrigger.getAttribute('data-open-obsidian-note') || '';
            const decoded = encoded ? decodeURIComponent(encoded) : '';
            if (!decoded) {
                showToast('Note path is missing', 'warning');
                return;
            }
            if (typeof openObsidianNote === 'function') {
                openObsidianNote(decoded);
            } else {
                const normalized = normalizeVaultPath(decoded);
                if (!normalized) {
                    showToast('Unable to resolve the note path', 'warning');
                    return;
                }
                window.open(`vault/${encodeURI(normalized)}`, '_blank');
            }
            return;
        }

        const contactAction = event.target.closest('[data-contact-action]');
        if (!contactAction) {
            return;
        }

        const action = contactAction.getAttribute('data-contact-action');
        const contactId = contactAction.getAttribute('data-contact-id') || '';

        switch (action) {
            case 'edit':
                if (contactId) {
                    showContactForm(contactId);
                }
                break;
            case 'open-company': {
                const companyId = contactAction.getAttribute('data-company-id');
                if (companyId && typeof viewCompany === 'function') {
                    viewCompany(companyId);
                }
                break;
            }
            case 'add-lead': {
                const contactName = decodeURIComponent(contactAction.getAttribute('data-contact-name') || '');
                const companyId = contactAction.getAttribute('data-company-id') || '';
                const companyName = decodeURIComponent(contactAction.getAttribute('data-company-name') || '');
                if (typeof showLeadForm === 'function') {
                    showLeadForm(null, {
                        defaultContactId: contactId,
                        defaultContactName: contactName,
                        defaultCompanyId: companyId,
                        defaultCompanyName: companyName
                    });
                }
                break;
            }
            case 'edit-lead': {
                const leadId = contactAction.getAttribute('data-lead-id');
                if (leadId && typeof showLeadForm === 'function') {
                    showLeadForm(leadId);
                }
                break;
            }
            case 'open-lead': {
                const leadId = contactAction.getAttribute('data-lead-id');
                if (leadId && typeof viewLead === 'function') {
                    viewLead(leadId);
                }
                break;
            }
            case 'add-deal': {
                const contactName = decodeURIComponent(contactAction.getAttribute('data-contact-name') || '');
                const companyId = contactAction.getAttribute('data-company-id') || '';
                const companyName = decodeURIComponent(contactAction.getAttribute('data-company-name') || '');
                if (typeof showOpportunityForm === 'function') {
                    showOpportunityForm(null, {
                        defaultContactId: contactId,
                        defaultContactName: contactName,
                        defaultCompanyId: companyId,
                        defaultCompanyName: companyName
                    });
                }
                break;
            }
            case 'edit-deal': {
                const dealId = contactAction.getAttribute('data-deal-id');
                if (dealId && typeof showOpportunityForm === 'function') {
                    showOpportunityForm(dealId);
                }
                break;
            }
            case 'add-task':
                if (typeof showTaskForm === 'function') {
                    showTaskForm(null, { defaultRelatedType: 'contact', defaultRelatedId: contactId });
                }
                break;
            case 'edit-task': {
                const taskId = contactAction.getAttribute('data-task-id');
                if (taskId && typeof showTaskForm === 'function') {
                    showTaskForm(taskId);
                }
                break;
            }
            case 'add-activity':
                if (typeof showActivityForm === 'function') {
                    showActivityForm(null, { defaultRelatedType: 'contact', defaultRelatedId: contactId });
                }
                break;
            case 'edit-activity': {
                const activityId = contactAction.getAttribute('data-activity-id');
                if (activityId && typeof showActivityForm === 'function') {
                    showActivityForm(activityId);
                }
                break;
            }
            default:
                break;
        }
    });

    modalContent.dataset.modalDelegatesAttached = 'true';
}

initializeModalEventDelegates();

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