/**
 * Additional CRM Modules
 * Company, Lead, Opportunity, Task, and Activity Management
 */

// Companies Management
async function showCompanies() {
    showView('companies');
    setPageHeader('companies');
    
    const companiesView = document.getElementById('companiesView');
    companiesView.innerHTML = `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center space-x-4">
                    <h3 class="text-lg font-semibold text-gray-800" data-i18n="companies.heading">All Companies</h3>
                    <div class="relative">
                        <input type="text" id="companySearch" placeholder="Search companies..." data-i18n="companies.searchPlaceholder" data-i18n-attr="placeholder"
                               class="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    <button onclick="exportCompanies()" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <i class="fas fa-download mr-2"></i><span data-i18n="companies.export">Export</span>
                    </button>
                    <button onclick="showCompanyForm()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-plus mr-2"></i><span data-i18n="companies.addCompany">Add Company</span>
                    </button>
                </div>
            </div>

            <div class="flex items-center space-x-4 mb-6">
                <select id="companyStatusFilter" class="border border-gray-300 rounded-lg px-3 py-2">
                    <option value="" data-i18n="companies.filter.status.all">All Statuses</option>
                    <option value="Active" data-i18n="companies.filter.status.active">Active</option>
                    <option value="Customer" data-i18n="companies.filter.status.customer">Customer</option>
                    <option value="Prospect" data-i18n="companies.filter.status.prospect">Prospect</option>
                    <option value="Partner" data-i18n="companies.filter.status.partner">Partner</option>
                </select>
                <select id="companySizeFilter" class="border border-gray-300 rounded-lg px-3 py-2">
                    <option value="" data-i18n="companies.filter.size.all">All Sizes</option>
                    <option value="Startup" data-i18n="companies.filter.size.startup">Startup</option>
                    <option value="Small (1-50)" data-i18n="companies.filter.size.small">Small (1-50)</option>
                    <option value="Medium (51-200)" data-i18n="companies.filter.size.medium">Medium (51-200)</option>
                    <option value="Large (201-1000)" data-i18n="companies.filter.size.large">Large (201-1000)</option>
                    <option value="Enterprise (1000+)" data-i18n="companies.filter.size.enterprise">Enterprise (1000+)</option>
                </select>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="text-left p-3 font-medium text-gray-600" data-i18n="companies.table.company">Company</th>
                            <th class="text-left p-3 font-medium text-gray-600" data-i18n="companies.table.industry">Industry</th>
                            <th class="text-left p-3 font-medium text-gray-600" data-i18n="companies.table.size">Size</th>
                            <th class="text-left p-3 font-medium text-gray-600" data-i18n="companies.table.revenue">Revenue</th>
                            <th class="text-left p-3 font-medium text-gray-600" data-i18n="companies.table.status">Status</th>
                            <th class="text-left p-3 font-medium text-gray-600" data-i18n="companies.table.actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="companiesTableBody">
                    </tbody>
                </table>
            </div>

            <div id="companiesPagination" class="mt-6 flex items-center justify-between">
            </div>
        </div>
    `;

    applyTranslations();

    await loadCompanies();
    setupCompanyFilters();
}

async function loadCompanies(page = 1, search, status, size) {
    showLoading();
    try {
        const searchInput = document.getElementById('companySearch');
        const statusSelect = document.getElementById('companyStatusFilter');
        const sizeSelect = document.getElementById('companySizeFilter');

        const searchValue = search !== undefined ? search : (searchInput?.value ?? '');
        const statusValue = status !== undefined ? status : (statusSelect?.value ?? '');
        const sizeValue = size !== undefined ? size : (sizeSelect?.value ?? '');

        const params = new URLSearchParams({
            page: String(page),
            limit: '20'
        });

        if (searchValue.trim()) params.append('search', searchValue.trim());
        if (statusValue) params.append('status', statusValue);
        if (sizeValue) params.append('size', sizeValue);

        const response = await fetch(`tables/companies?${params.toString()}`);
        const data = await response.json();
        
        displayCompanies(data.data || []);
        displayPagination('companies', data, page);
        
    } catch (error) {
        console.error('Error loading companies:', error);
        showToast(translate('companies.loadError'), 'error');
    } finally {
        hideLoading();
    }
}

function displayCompanies(companies) {
    const tbody = document.getElementById('companiesTableBody');
    
    if (companies.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-8 text-gray-500">
                    <i class="fas fa-building text-4xl mb-4"></i>
                    <p data-i18n="companies.empty">No companies found</p>
                    <button onclick="showCompanyForm()" class="mt-2 text-blue-600 hover:text-blue-700" data-i18n="companies.emptyCta">Add your first company</button>
                </td>
            </tr>
        `;
        applyTranslations();
        return;
    }

    tbody.innerHTML = companies.map(company => `
        <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="p-3">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <i class="fas fa-building text-purple-600"></i>
                    </div>
                    <div>
                        <p class="font-medium text-gray-800">${company.name}</p>
                        <p class="text-sm text-gray-600">${company.website || `<span data-i18n="companies.noWebsite">${translate('companies.noWebsite')}</span>`}</p>
                    </div>
                </div>
            </td>
            <td class="p-3 text-gray-600">${company.industry || `<span data-i18n="common.notAvailable">${translate('common.notAvailable')}</span>`}</td>
            <td class="p-3 text-gray-600">${company.size || `<span data-i18n="common.notAvailable">${translate('common.notAvailable')}</span>`}</td>
            <td class="p-3 text-gray-600">${formatCurrency(company.annual_revenue)}</td>
            <td class="p-3">
                <span class="px-2 py-1 text-xs rounded-full ${getStatusClass(company.status)}" ${getCompanyStatusI18nAttribute(company.status)}>${translate(getCompanyStatusTranslationKey(company.status))}</span>
            </td>
            <td class="p-3">
                <div class="flex items-center space-x-2">
                    <button onclick="viewCompany('${company.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editCompany('${company.id}')" class="p-2 text-green-600 hover:bg-green-50 rounded">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteCompany('${company.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    applyTranslations();
}

function getCompanyStatusTranslationKey(status) {
    const normalized = (status || 'Active').toLowerCase();
    switch (normalized) {
        case 'active':
            return 'companies.filter.status.active';
        case 'customer':
            return 'companies.filter.status.customer';
        case 'prospect':
            return 'companies.filter.status.prospect';
        case 'partner':
            return 'companies.filter.status.partner';
        default:
            return 'companies.filter.status.active';
    }
}

function getCompanyStatusI18nAttribute(status) {
    const key = getCompanyStatusTranslationKey(status);
    return `data-i18n="${key}"`;
}

function setupCompanyFilters() {
    const searchInput = document.getElementById('companySearch');
    const statusFilter = document.getElementById('companyStatusFilter');
    const sizeFilter = document.getElementById('companySizeFilter');
    
    let filterTimeout;
    
    const applyFilters = () => {
        clearTimeout(filterTimeout);
        filterTimeout = setTimeout(() => {
            loadCompanies(1, searchInput.value, statusFilter.value, sizeFilter.value);
        }, 300);
    };
    
    searchInput.addEventListener('input', applyFilters);
    statusFilter.addEventListener('change', applyFilters);
    sizeFilter.addEventListener('change', applyFilters);
}

// Leads Management
async function showLeads() {
    showView('leads');
    setPageHeader('leads');
    
    const leadsView = document.getElementById('leadsView');
    leadsView.innerHTML = `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center space-x-4">
                    <h3 class="text-lg font-semibold text-gray-800" data-i18n="leads.heading">All Leads</h3>
                    <div class="relative">
                        <input type="text" id="leadSearch" placeholder="Search leads..." data-i18n="leads.searchPlaceholder" data-i18n-attr="placeholder"
                               class="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    <button onclick="showLeadForm()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-plus mr-2"></i><span data-i18n="leads.addLead">Add Lead</span>
                    </button>
                </div>
            </div>

            <div class="flex items-center space-x-4 mb-6">
                <select id="leadStatusFilter" class="border border-gray-300 rounded-lg px-3 py-2">
                    <option value="" data-i18n="leads.filter.status.all">All Statuses</option>
                    <option value="New" data-i18n="leads.filter.status.new">New</option>
                    <option value="Contacted" data-i18n="leads.filter.status.contacted">Contacted</option>
                    <option value="Qualified" data-i18n="leads.filter.status.qualified">Qualified</option>
                    <option value="Proposal" data-i18n="leads.filter.status.proposal">Proposal</option>
                    <option value="Negotiation" data-i18n="leads.filter.status.negotiation">Negotiation</option>
                    <option value="Won" data-i18n="leads.filter.status.won">Won</option>
                    <option value="Lost" data-i18n="leads.filter.status.lost">Lost</option>
                </select>
                <select id="leadPriorityFilter" class="border border-gray-300 rounded-lg px-3 py-2">
                    <option value="" data-i18n="leads.filter.priority.all">All Priorities</option>
                    <option value="Low" data-i18n="leads.filter.priority.low">Low</option>
                    <option value="Medium" data-i18n="leads.filter.priority.medium">Medium</option>
                    <option value="High" data-i18n="leads.filter.priority.high">High</option>
                    <option value="Critical" data-i18n="leads.filter.priority.critical">Critical</option>
                </select>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="text-left p-3 font-medium text-gray-600" data-i18n="leads.table.title">Lead Title</th>
                            <th class="text-left p-3 font-medium text-gray-600" data-i18n="leads.table.value">Value</th>
                            <th class="text-left p-3 font-medium text-gray-600" data-i18n="leads.table.status">Status</th>
                            <th class="text-left p-3 font-medium text-gray-600" data-i18n="leads.table.priority">Priority</th>
                            <th class="text-left p-3 font-medium text-gray-600" data-i18n="leads.table.expectedClose">Expected Close</th>
                            <th class="text-left p-3 font-medium text-gray-600" data-i18n="leads.table.assignedTo">Assigned To</th>
                            <th class="text-left p-3 font-medium text-gray-600" data-i18n="leads.table.actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="leadsTableBody">
                    </tbody>
                </table>
            </div>

            <div id="leadsPagination" class="mt-6 flex items-center justify-between">
            </div>
        </div>
    `;

    applyTranslations();

    await loadLeads();
    setupLeadFilters();
}

async function loadLeads(page = 1, search, status, priority) {
    showLoading();
    try {
        const searchInput = document.getElementById('leadSearch');
        const statusSelect = document.getElementById('leadStatusFilter');
        const prioritySelect = document.getElementById('leadPriorityFilter');

        const searchValue = search !== undefined ? search : (searchInput?.value ?? '');
        const statusValue = status !== undefined ? status : (statusSelect?.value ?? '');
        const priorityValue = priority !== undefined ? priority : (prioritySelect?.value ?? '');

        const params = new URLSearchParams({
            page: String(page),
            limit: '20'
        });

        if (searchValue.trim()) params.append('search', searchValue.trim());
        if (statusValue) params.append('status', statusValue);
        if (priorityValue) params.append('priority', priorityValue);

        const response = await fetch(`tables/leads?${params.toString()}`);
        const data = await response.json();

        displayLeads(data.data || []);
        displayPagination('leads', data, page);

    } catch (error) {
        console.error('Error loading leads:', error);
        showToast(translate('leads.loadError'), 'error');
    } finally {
        hideLoading();
    }
}

function displayLeads(leads) {
    const tbody = document.getElementById('leadsTableBody');

    if (leads.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-8 text-gray-500">
                    <i class="fas fa-bullseye text-4xl mb-4"></i>
                    <p data-i18n="leads.empty">No leads found</p>
                    <button onclick="showLeadForm()" class="mt-2 text-blue-600 hover:text-blue-700" data-i18n="leads.emptyCta">Add your first lead</button>
                </td>
            </tr>
        `;
        applyTranslations();
        return;
    }

    tbody.innerHTML = leads.map(lead => `
        <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="p-3">
                <div>
                    <p class="font-medium text-gray-800">${lead.title}</p>
                    <p class="text-sm text-gray-600">${lead.description ? lead.description.substring(0, 50) + '...' : translate('leads.noDescription')}</p>
                </div>
            </td>
            <td class="p-3 text-gray-600">${formatCurrency(lead.value)}</td>
            <td class="p-3">
                <span class="px-2 py-1 text-xs rounded-full ${getStatusClass(lead.status)}">${translateLeadStatus(lead.status)}</span>
            </td>
            <td class="p-3">
                <span class="px-2 py-1 text-xs rounded-full ${getPriorityClass(lead.priority)}">${translateLeadPriority(lead.priority)}</span>
            </td>
            <td class="p-3 text-gray-600">${lead.expected_close_date ? new Date(lead.expected_close_date).toLocaleDateString(currentLanguage === 'uk' ? 'uk-UA' : undefined) : translate('leads.notSet')}</td>
            <td class="p-3 text-gray-600">${lead.assigned_to || translate('leads.unassigned')}</td>
            <td class="p-3">
                <div class="flex items-center space-x-2">
                    <button onclick="viewLead('${lead.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button onclick="editLead('${lead.id}')" class="p-2 text-green-600 hover:bg-green-50 rounded">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteLead('${lead.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    applyTranslations();
}

const LEAD_STATUS_TRANSLATION_KEYS = {
    'New': 'leads.status.new',
    'Contacted': 'leads.status.contacted',
    'Qualified': 'leads.status.qualified',
    'Proposal': 'leads.status.proposal',
    'Negotiation': 'leads.status.negotiation',
    'Won': 'leads.status.won',
    'Lost': 'leads.status.lost'
};

const LEAD_PRIORITY_TRANSLATION_KEYS = {
    'Low': 'leads.priority.low',
    'Medium': 'leads.priority.medium',
    'High': 'leads.priority.high',
    'Critical': 'leads.priority.critical'
};

function translateLeadStatus(status) {
    if (!status) {
        return '';
    }

    const key = LEAD_STATUS_TRANSLATION_KEYS[status];
    if (!key) {
        return status;
    }

    const translated = translate(key);
    return translated === key ? status : translated;
}

function translateLeadPriority(priority) {
    if (!priority) {
        return '';
    }

    const key = LEAD_PRIORITY_TRANSLATION_KEYS[priority];
    if (!key) {
        return priority;
    }

    const translated = translate(key);
    return translated === key ? priority : translated;
}

function setupLeadFilters() {
    const searchInput = document.getElementById('leadSearch');
    const statusFilter = document.getElementById('leadStatusFilter');
    const priorityFilter = document.getElementById('leadPriorityFilter');
    
    let filterTimeout;
    
    const applyFilters = () => {
        clearTimeout(filterTimeout);
        filterTimeout = setTimeout(() => {
            loadLeads(1, searchInput.value, statusFilter.value, priorityFilter.value);
        }, 300);
    };
    
    searchInput.addEventListener('input', applyFilters);
    statusFilter.addEventListener('change', applyFilters);
    priorityFilter.addEventListener('change', applyFilters);
}

// Opportunities Management
async function showOpportunities() {
    showView('opportunities');
    setPageHeader('opportunities');
    
    const opportunitiesView = document.getElementById('opportunitiesView');
    opportunitiesView.innerHTML = `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center space-x-4">
                    <h3 class="text-lg font-semibold text-gray-800">Sales Pipeline</h3>
                    <div class="relative">
                        <input type="text" id="opportunitySearch" placeholder="Search opportunities..." 
                               class="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    <button onclick="showOpportunityForm()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-plus mr-2"></i>Add Opportunity
                    </button>
                </div>
            </div>
            
            <!-- Pipeline Board View -->
            <div class="mb-6">
                <div class="flex space-x-4 overflow-x-auto pb-4">
                    <div class="min-w-80 bg-gray-50 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-700 mb-3">Qualification</h4>
                        <div id="qualificationColumn" class="space-y-3 min-h-40">
                        </div>
                    </div>
                    <div class="min-w-80 bg-blue-50 rounded-lg p-4">
                        <h4 class="font-semibold text-blue-700 mb-3">Needs Analysis</h4>
                        <div id="needsAnalysisColumn" class="space-y-3 min-h-40">
                        </div>
                    </div>
                    <div class="min-w-80 bg-yellow-50 rounded-lg p-4">
                        <h4 class="font-semibold text-yellow-700 mb-3">Proposal</h4>
                        <div id="proposalColumn" class="space-y-3 min-h-40">
                        </div>
                    </div>
                    <div class="min-w-80 bg-orange-50 rounded-lg p-4">
                        <h4 class="font-semibold text-orange-700 mb-3">Negotiation</h4>
                        <div id="negotiationColumn" class="space-y-3 min-h-40">
                        </div>
                    </div>
                    <div class="min-w-80 bg-green-50 rounded-lg p-4">
                        <h4 class="font-semibold text-green-700 mb-3">Closed Won</h4>
                        <div id="closedWonColumn" class="space-y-3 min-h-40">
                        </div>
                    </div>
                    <div class="min-w-80 bg-red-50 rounded-lg p-4">
                        <h4 class="font-semibold text-red-700 mb-3">Closed Lost</h4>
                        <div id="closedLostColumn" class="space-y-3 min-h-40">
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Table View Toggle -->
            <div class="flex justify-center mb-6">
                <button onclick="toggleOpportunityView()" id="viewToggle" class="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                    Switch to Table View
                </button>
            </div>
        </div>
    `;
    
    await loadOpportunities();
}

async function loadOpportunities() {
    showLoading();
    try {
        const response = await fetch('tables/opportunities?limit=100');
        const data = await response.json();
        
        displayOpportunitiesPipeline(data.data || []);
        
    } catch (error) {
        console.error('Error loading opportunities:', error);
        showToast('Failed to load opportunities', 'error');
    } finally {
        hideLoading();
    }
}

function displayOpportunitiesPipeline(opportunities, columnPrefix = '') {
    const stages = {
        'Qualification': { baseId: 'qualificationColumn', prefixedId: 'QualificationColumn' },
        'Needs Analysis': { baseId: 'needsAnalysisColumn', prefixedId: 'NeedsAnalysisColumn' },
        'Proposal': { baseId: 'proposalColumn', prefixedId: 'ProposalColumn' },
        'Negotiation': { baseId: 'negotiationColumn', prefixedId: 'NegotiationColumn' },
        'Closed Won': { baseId: 'closedWonColumn', prefixedId: 'ClosedWonColumn' },
        'Closed Lost': { baseId: 'closedLostColumn', prefixedId: 'ClosedLostColumn' }
    };

    Object.values(stages).forEach(config => {
        const columnId = columnPrefix ? `${columnPrefix}${config.prefixedId}` : config.baseId;
        const column = document.getElementById(columnId);
        if (column) {
            column.innerHTML = '';
        }
    });

    opportunities.forEach(opp => {
        const config = stages[opp.stage];
        if (!config) {
            return;
        }

        const columnId = columnPrefix ? `${columnPrefix}${config.prefixedId}` : config.baseId;
        const column = document.getElementById(columnId);
        if (column) {
            column.innerHTML += createOpportunityCard(opp);
        }
    });
}

function createOpportunityCard(opportunity) {
    const probability = opportunity.probability || 0;
    const expectedClose = opportunity.expected_close_date ?
        new Date(opportunity.expected_close_date).toLocaleDateString() : 'Not set';

    return `
        <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
             onclick="viewOpportunity('${opportunity.id}')">
            <h5 class="font-medium text-gray-800 mb-2">${opportunity.name}</h5>
            <p class="text-sm text-gray-600 mb-2">${formatCurrency(opportunity.value)}</p>
            <div class="flex justify-between items-center text-xs text-gray-500 mb-2">
                <span>${probability}% probability</span>
                <span>${opportunity.assigned_to || 'Unassigned'}</span>
            </div>
            <div class="text-xs text-gray-500">
                Expected: ${expectedClose}
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div class="bg-blue-600 h-2 rounded-full" style="width: ${probability}%"></div>
            </div>
        </div>
    `;
}

// Sales Module
const SALES_STAGE_ORDER = ['Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];

const STAGE_DEFAULT_PROBABILITY = {
    'Qualification': 25,
    'Needs Analysis': 35,
    'Proposal': 55,
    'Negotiation': 75,
    'Closed Won': 100,
    'Closed Lost': 0
};

const SALES_STAGE_GRADIENTS = {
    'Qualification': 'linear-gradient(90deg, #3b82f6 0%, #60a5fa 100%)',
    'Needs Analysis': 'linear-gradient(90deg, #0ea5e9 0%, #38bdf8 100%)',
    'Proposal': 'linear-gradient(90deg, #f59e0b 0%, #facc15 100%)',
    'Negotiation': 'linear-gradient(90deg, #f97316 0%, #fb923c 100%)',
    'Closed Won': 'linear-gradient(90deg, #10b981 0%, #34d399 100%)',
    'Closed Lost': 'linear-gradient(90deg, #ef4444 0%, #f87171 100%)'
};

const CPQ_PRODUCTS = [
    { id: 'crm-professional', name: 'CRM Platform · Professional', price: 1200, unit: 'Per user / year', category: 'Software' },
    { id: 'crm-enterprise', name: 'CRM Platform · Enterprise', price: 1800, unit: 'Per user / year', category: 'Software' },
    { id: 'onboarding-suite', name: 'Onboarding & Implementation Suite', price: 4500, unit: 'One-time', category: 'Services' },
    { id: 'premium-support', name: 'Premium Support Plan', price: 950, unit: 'Per account / year', category: 'Support' },
    { id: 'analytics-pack', name: 'Revenue Analytics Pack', price: 2500, unit: 'Per account / year', category: 'Add-on' }
];

const PAYMENT_PROVIDERS = [
    { id: 'stripe', name: 'Stripe', description: 'Global card payments and subscription billing' },
    { id: 'paypal', name: 'PayPal', description: 'Digital wallets and PayPal credit for B2B' },
    { id: 'adyen', name: 'Adyen', description: 'Enterprise omnichannel payments' }
];

const ACCOUNTING_SYSTEMS = [
    { id: 'quickbooks', name: 'QuickBooks Online', description: 'SMB accounting and invoicing' },
    { id: 'xero', name: 'Xero', description: 'Cloud accounting for scaling teams' },
    { id: 'netsuite', name: 'Oracle NetSuite', description: 'Enterprise ERP & revenue recognition' }
];

const salesModuleState = {
    opportunities: [],
    cpq: {
        lines: [],
        opportunityId: null,
        currency: 'USD',
        lastGeneratedAt: null
    },
    billing: {
        paymentProviders: new Set(),
        accountingSystems: new Set(),
        paymentTerms: 'Net 30',
        autoSendInvoices: false
    }
};

async function showSales() {
    showView('sales');
    setPageHeader('sales');

    const salesView = document.getElementById('salesView');
    salesView.innerHTML = `
        <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <p class="text-sm text-gray-500">Pipeline Value</p>
                    <p id="salesPipelineValue" class="text-2xl font-semibold text-gray-800 mt-1">$0.00</p>
                    <p id="salesPipelineCount" class="text-xs text-gray-400 mt-2">0 open deals</p>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <p class="text-sm text-gray-500">Weighted Forecast</p>
                    <p id="salesWeightedValue" class="text-2xl font-semibold text-gray-800 mt-1">$0.00</p>
                    <p id="salesWonValue" class="text-xs text-gray-400 mt-2">$0.00 closed won</p>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <p class="text-sm text-gray-500">Win Rate</p>
                    <p id="salesWinRate" class="text-2xl font-semibold text-gray-800 mt-1">0.0%</p>
                    <p class="text-xs text-gray-400 mt-2">Across closed opportunities</p>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <p class="text-sm text-gray-500">Average Deal Size</p>
                    <p id="salesAvgDealSize" class="text-2xl font-semibold text-gray-800 mt-1">$0.00</p>
                    <p class="text-xs text-gray-400 mt-2">Based on open pipeline</p>
                </div>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-800">Sales Funnel</h3>
                        <span id="salesFunnelSummary" class="text-xs text-gray-500"></span>
                    </div>
                    <div id="salesFunnel" class="space-y-4"></div>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-800">Revenue Forecast</h3>
                    </div>
                    <div class="relative h-64">
                        <canvas id="salesForecastChart" class="h-full"></canvas>
                        <p id="salesForecastEmpty" class="absolute inset-0 flex items-center justify-center text-sm text-gray-500 hidden">Add expected close dates to power the forecast.</p>
                    </div>
                    <p id="salesForecastSummary" class="text-sm text-gray-500 mt-4"></p>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold text-gray-800">Pipeline Board</h3>
                    <p id="salesPipelineStats" class="text-sm text-gray-500"></p>
                </div>
                <div class="flex space-x-4 overflow-x-auto pb-4">
                    <div class="min-w-80 bg-gray-50 rounded-lg p-4">
                        <h4 class="font-semibold text-gray-700 mb-3">Qualification</h4>
                        <div id="salesQualificationColumn" class="space-y-3 min-h-40"></div>
                    </div>
                    <div class="min-w-80 bg-blue-50 rounded-lg p-4">
                        <h4 class="font-semibold text-blue-700 mb-3">Needs Analysis</h4>
                        <div id="salesNeedsAnalysisColumn" class="space-y-3 min-h-40"></div>
                    </div>
                    <div class="min-w-80 bg-yellow-50 rounded-lg p-4">
                        <h4 class="font-semibold text-yellow-700 mb-3">Proposal</h4>
                        <div id="salesProposalColumn" class="space-y-3 min-h-40"></div>
                    </div>
                    <div class="min-w-80 bg-orange-50 rounded-lg p-4">
                        <h4 class="font-semibold text-orange-700 mb-3">Negotiation</h4>
                        <div id="salesNegotiationColumn" class="space-y-3 min-h-40"></div>
                    </div>
                    <div class="min-w-80 bg-green-50 rounded-lg p-4">
                        <h4 class="font-semibold text-green-700 mb-3">Closed Won</h4>
                        <div id="salesClosedWonColumn" class="space-y-3 min-h-40"></div>
                    </div>
                    <div class="min-w-80 bg-red-50 rounded-lg p-4">
                        <h4 class="font-semibold text-red-700 mb-3">Closed Lost</h4>
                        <div id="salesClosedLostColumn" class="space-y-3 min-h-40"></div>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">Opportunity Management</h3>
                        <p class="text-sm text-gray-500">Adjust stages, forecast probability and next steps.</p>
                    </div>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-50 text-gray-600 uppercase text-xs">
                            <tr>
                                <th class="p-3 text-left">Opportunity</th>
                                <th class="p-3 text-left">Stage</th>
                                <th class="p-3 text-left">Probability</th>
                                <th class="p-3 text-left">Value</th>
                                <th class="p-3 text-left">Expected Close</th>
                                <th class="p-3 text-left">Owner</th>
                                <th class="p-3 text-left">Next Step</th>
                            </tr>
                        </thead>
                        <tbody id="salesOpportunitiesTableBody" class="divide-y divide-gray-100"></tbody>
                    </table>
                </div>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800">Configure Price Quote (CPQ)</h3>
                            <p class="text-sm text-gray-500">Bundle products, discounts and approvals.</p>
                        </div>
                        <button id="cpqResetQuote" class="text-sm text-blue-600 hover:text-blue-700">Reset</button>
                    </div>
                    <div class="space-y-4">
                        <div>
                            <label for="cpqOpportunitySelect" class="block text-sm font-medium text-gray-600 mb-1">Opportunity</label>
                            <select id="cpqOpportunitySelect" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"></select>
                        </div>
                        <div class="grid md:grid-cols-4 gap-4">
                            <div class="md:col-span-2">
                                <label for="cpqProductSelect" class="block text-sm font-medium text-gray-600 mb-1">Catalog Item</label>
                                <select id="cpqProductSelect" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"></select>
                            </div>
                            <div>
                                <label for="cpqQuantity" class="block text-sm font-medium text-gray-600 mb-1">Quantity</label>
                                <input type="number" id="cpqQuantity" min="1" value="1" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            <div>
                                <label for="cpqDiscount" class="block text-sm font-medium text-gray-600 mb-1">Discount (%)</label>
                                <input type="number" id="cpqDiscount" min="0" max="100" value="0" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                        </div>
                        <div class="flex items-center justify-between text-sm text-gray-500">
                            <button id="cpqAddLineItem" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Add Line Item</button>
                            <span id="cpqCatalogSummary"></span>
                        </div>
                        <div class="border border-dashed border-gray-200 rounded-lg overflow-hidden">
                            <table class="w-full text-sm">
                                <thead class="bg-gray-50 text-gray-600 uppercase text-xs">
                                    <tr>
                                        <th class="p-3 text-left">Product</th>
                                        <th class="p-3 text-left">Qty</th>
                                        <th class="p-3 text-left">Unit Price</th>
                                        <th class="p-3 text-left">Discount</th>
                                        <th class="p-3 text-left">Net Total</th>
                                        <th class="p-3 text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="cpqLineItemsBody"></tbody>
                            </table>
                        </div>
                        <div class="space-y-1 text-sm text-gray-700">
                            <div class="flex items-center justify-between"><span>Subtotal</span><span id="cpqSubtotal">$0.00</span></div>
                            <div class="flex items-center justify-between"><span>Discounts</span><span id="cpqDiscountTotal">$0.00</span></div>
                            <div class="flex items-center justify-between text-base font-semibold text-gray-800"><span>Total</span><span id="cpqGrandTotal">$0.00</span></div>
                        </div>
                        <div class="space-y-3">
                            <button id="cpqGenerateQuote" class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Generate Quote Preview</button>
                            <button id="cpqGenerateInvoice" class="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Create Invoice Draft</button>
                            <p id="cpqInvoiceStatus" class="text-sm text-gray-500"></p>
                        </div>
                        <div id="cpqQuotePreview" class="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700"></div>
                    </div>
                </div>

                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div class="flex items-center justify-between mb-4">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800">Billing & Integrations</h3>
                            <p class="text-sm text-gray-500">Connect payment and accounting systems for invoicing.</p>
                        </div>
                        <button id="simulateInvoiceSync" class="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">Run Sync</button>
                    </div>
                    <div class="space-y-6">
                        <div>
                            <h4 class="text-sm font-semibold text-gray-700 mb-3">Payment Providers</h4>
                            <div id="paymentProvidersList" class="grid grid-cols-1 sm:grid-cols-2 gap-3"></div>
                        </div>
                        <div>
                            <h4 class="text-sm font-semibold text-gray-700 mb-3">Accounting Platforms</h4>
                            <div id="accountingSystemsList" class="grid grid-cols-1 sm:grid-cols-2 gap-3"></div>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label for="invoicePaymentTerms" class="block text-sm font-medium text-gray-600 mb-1">Default Payment Terms</label>
                                <select id="invoicePaymentTerms" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <option value="Net 15">Net 15</option>
                                    <option value="Net 30" selected>Net 30</option>
                                    <option value="Net 45">Net 45</option>
                                    <option value="Due on Receipt">Due on Receipt</option>
                                </select>
                            </div>
                            <div class="flex items-center space-x-2 pt-6">
                                <input type="checkbox" id="invoiceAutoSend" class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                                <label for="invoiceAutoSend" class="text-sm text-gray-600">Automatically send invoices after quote approval</label>
                            </div>
                        </div>
                        <div id="billingConnectionSummary" class="text-sm text-blue-700 bg-blue-50 px-4 py-3 rounded-lg"></div>
                        <div id="invoiceSyncStatus" class="text-sm text-gray-500"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

    await loadSalesModuleData();
}

async function loadSalesModuleData() {
    showLoading();
    try {
        const response = await fetch('tables/opportunities?limit=200');
        const data = await response.json();

        salesModuleState.opportunities = (data.data || []).map(opportunity => ({
            ...opportunity,
            probability: typeof opportunity.probability === 'number'
                ? opportunity.probability
                : (STAGE_DEFAULT_PROBABILITY[opportunity.stage] ?? 0)
        }));

        salesModuleState.cpq.lines = [];
        salesModuleState.cpq.opportunityId = null;
        salesModuleState.cpq.lastGeneratedAt = null;

        initializeCpqSection();
        initializeBillingIntegrations();
        refreshSalesVisuals();
    } catch (error) {
        console.error('Error loading sales data:', error);
        showToast('Failed to load sales data', 'error');
    } finally {
        hideLoading();
    }
}

function calculateSalesMetrics(opportunities) {
    const stageSummary = {};
    SALES_STAGE_ORDER.forEach(stage => {
        stageSummary[stage] = { count: 0, total: 0, conversion: 0 };
    });

    let totalPipeline = 0;
    let weightedPipeline = 0;
    let openCount = 0;
    let openValue = 0;
    let closedWonCount = 0;
    let closedLostCount = 0;
    let wonValue = 0;

    const forecastBuckets = {};

    opportunities.forEach(opportunity => {
        const stage = stageSummary[opportunity.stage] ? opportunity.stage : SALES_STAGE_ORDER[0];
        const amount = Number(opportunity.value) || 0;
        const probability = Math.min(Math.max(Number(opportunity.probability) || 0, 0), 100);

        stageSummary[stage].count += 1;
        stageSummary[stage].total += amount;

        const isOpen = stage !== 'Closed Won' && stage !== 'Closed Lost';

        if (isOpen) {
            totalPipeline += amount;
            weightedPipeline += amount * (probability / 100);
            openCount += 1;
            openValue += amount;
        }

        if (stage === 'Closed Won') {
            closedWonCount += 1;
            wonValue += amount;
        }

        if (stage === 'Closed Lost') {
            closedLostCount += 1;
        }

        if (opportunity.expected_close_date) {
            const expectedDate = new Date(opportunity.expected_close_date);
            if (!Number.isNaN(expectedDate.valueOf())) {
                const key = `${expectedDate.getFullYear()}-${String(expectedDate.getMonth() + 1).padStart(2, '0')}`;
                const label = expectedDate.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
                if (!forecastBuckets[key]) {
                    forecastBuckets[key] = { label, pipeline: 0, weighted: 0 };
                }
                if (isOpen) {
                    forecastBuckets[key].pipeline += amount;
                    forecastBuckets[key].weighted += amount * (probability / 100);
                } else if (stage === 'Closed Won') {
                    forecastBuckets[key].weighted += amount;
                }
            }
        }
    });

    SALES_STAGE_ORDER.forEach((stage, index) => {
        const previousStage = stage === 'Closed Lost'
            ? 'Negotiation'
            : SALES_STAGE_ORDER[index - 1];
        if (!previousStage) {
            stageSummary[stage].conversion = 100;
            return;
        }

        const previousCount = stageSummary[previousStage]?.count || 0;
        stageSummary[stage].conversion = previousCount > 0
            ? Math.round((stageSummary[stage].count / previousCount) * 100)
            : 0;
    });

    const sortedForecastKeys = Object.keys(forecastBuckets).sort();
    const forecast = {
        labels: sortedForecastKeys.map(key => forecastBuckets[key].label),
        pipeline: sortedForecastKeys.map(key => Math.round(forecastBuckets[key].pipeline)),
        weighted: sortedForecastKeys.map(key => Math.round(forecastBuckets[key].weighted))
    };

    const winRateDenominator = closedWonCount + closedLostCount;
    const winRate = winRateDenominator > 0 ? (closedWonCount / winRateDenominator) * 100 : 0;
    const avgDealSize = openCount > 0 ? openValue / openCount : 0;

    return {
        stageSummary,
        totalPipeline,
        weightedPipeline,
        openCount,
        avgDealSize,
        winRate,
        wonValue,
        forecast
    };
}

function renderSalesMetrics(metrics) {
    const pipelineValue = document.getElementById('salesPipelineValue');
    const pipelineCount = document.getElementById('salesPipelineCount');
    const weightedValue = document.getElementById('salesWeightedValue');
    const winRate = document.getElementById('salesWinRate');
    const avgDealSize = document.getElementById('salesAvgDealSize');
    const wonValue = document.getElementById('salesWonValue');
    const pipelineStats = document.getElementById('salesPipelineStats');
    const funnelSummary = document.getElementById('salesFunnelSummary');
    const forecastSummary = document.getElementById('salesForecastSummary');

    if (pipelineValue) pipelineValue.textContent = formatCurrency(metrics.totalPipeline);
    if (pipelineCount) pipelineCount.textContent = `${metrics.openCount} open deals`;
    if (weightedValue) weightedValue.textContent = formatCurrency(metrics.weightedPipeline);
    if (wonValue) wonValue.textContent = `${formatCurrency(metrics.wonValue)} closed won`;
    if (winRate) winRate.textContent = `${metrics.winRate.toFixed(1)}%`;
    if (avgDealSize) avgDealSize.textContent = formatCurrency(metrics.avgDealSize);
    if (pipelineStats) pipelineStats.textContent = `${metrics.openCount} open • ${formatCurrency(metrics.totalPipeline)} in pipeline`;

    const qualificationCount = metrics.stageSummary['Qualification']?.count || 0;
    if (funnelSummary) funnelSummary.textContent = `${qualificationCount} opportunities entering the funnel`;

    if (forecastSummary) {
        const totalWeighted = metrics.forecast.weighted.reduce((sum, value) => sum + value, 0);
        forecastSummary.textContent = metrics.forecast.labels.length
            ? `Projected weighted revenue: ${formatCurrency(totalWeighted)}`
            : 'Add expected close dates to generate a forward-looking forecast.';
    }
}

function renderSalesFunnel(stageSummary) {
    const funnelContainer = document.getElementById('salesFunnel');
    if (!funnelContainer) {
        return;
    }

    const maxValue = Math.max(...SALES_STAGE_ORDER.map(stage => stageSummary[stage]?.total || 0), 1);

    funnelContainer.innerHTML = SALES_STAGE_ORDER.map(stage => {
        const data = stageSummary[stage] || { count: 0, total: 0, conversion: 0 };
        const width = Math.max(12, (data.total / maxValue) * 100);
        const gradient = SALES_STAGE_GRADIENTS[stage] || '#e5e7eb';
        return `
            <div class="flex items-center space-x-4">
                <div class="w-36">
                    <p class="text-sm font-medium text-gray-700">${stage}</p>
                    <p class="text-xs text-gray-500">${data.count} deals</p>
                </div>
                <div class="flex-1">
                    <div class="h-10 rounded-r-full" style="width: ${width}%; background: ${gradient};"></div>
                </div>
                <div class="w-32 text-right">
                    <p class="text-sm font-medium text-gray-700">${formatCurrency(data.total)}</p>
                    <p class="text-xs text-gray-400">${data.conversion}% conversion</p>
                </div>
            </div>
        `;
    }).join('');
}

function renderSalesPipelineBoard() {
    displayOpportunitiesPipeline(salesModuleState.opportunities, 'sales');
}

function renderSalesOpportunityTable() {
    const tbody = document.getElementById('salesOpportunitiesTableBody');
    if (!tbody) {
        return;
    }

    if (salesModuleState.opportunities.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="py-6 text-center text-gray-500">No opportunities available. Create a deal to populate the pipeline.</td>
            </tr>
        `;
        return;
    }

    const stageRank = stage => {
        const index = SALES_STAGE_ORDER.indexOf(stage);
        return index === -1 ? SALES_STAGE_ORDER.length : index;
    };

    const sortedOpportunities = [...salesModuleState.opportunities].sort((a, b) => {
        const stageDiff = stageRank(a.stage) - stageRank(b.stage);
        if (stageDiff !== 0) return stageDiff;
        const aDate = a.expected_close_date ? new Date(a.expected_close_date).valueOf() : Infinity;
        const bDate = b.expected_close_date ? new Date(b.expected_close_date).valueOf() : Infinity;
        return aDate - bDate;
    });

    tbody.innerHTML = sortedOpportunities.map(opportunity => {
        const stageOptions = SALES_STAGE_ORDER.map(stage => `
            <option value="${stage}" ${opportunity.stage === stage ? 'selected' : ''}>${stage}</option>
        `).join('');

        const probabilityValue = Math.min(Math.max(Number(opportunity.probability) || 0, 0), 100);
        const expected = opportunity.expected_close_date ? new Date(opportunity.expected_close_date).toLocaleDateString() : 'Not set';

        return `
            <tr class="hover:bg-gray-50">
                <td class="p-3">
                    <div class="font-medium text-gray-800">${opportunity.name}</div>
                    <div class="text-xs text-gray-500">${opportunity.company_name || 'No account linked'}</div>
                </td>
                <td class="p-3">
                    <select data-opportunity-id="${opportunity.id}" class="sales-stage-select border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        ${stageOptions}
                    </select>
                </td>
                <td class="p-3">
                    <input type="number" min="0" max="100" value="${probabilityValue}" data-opportunity-id="${opportunity.id}" class="sales-probability-input w-24 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </td>
                <td class="p-3 text-gray-700">${formatCurrency(opportunity.value)}</td>
                <td class="p-3 text-gray-500">${expected}</td>
                <td class="p-3 text-gray-500">${opportunity.assigned_to || 'Unassigned'}</td>
                <td class="p-3 text-gray-500">${opportunity.next_step || 'No next step defined'}</td>
            </tr>
        `;
    }).join('');

    bindSalesOpportunityEvents();
}

function bindSalesOpportunityEvents() {
    document.querySelectorAll('.sales-stage-select').forEach(select => {
        select.addEventListener('change', handleOpportunityStageChange);
    });

    document.querySelectorAll('.sales-probability-input').forEach(input => {
        input.addEventListener('change', handleOpportunityProbabilityChange);
    });
}

function handleOpportunityStageChange(event) {
    const opportunityId = event.target.dataset.opportunityId;
    const newStage = event.target.value;
    const opportunity = salesModuleState.opportunities.find(item => item.id === opportunityId);
    if (!opportunity) {
        return;
    }

    opportunity.stage = newStage;
    if (typeof STAGE_DEFAULT_PROBABILITY[newStage] === 'number') {
        opportunity.probability = STAGE_DEFAULT_PROBABILITY[newStage];
    }

    showToast('Opportunity stage updated for forecasting', 'success');
    refreshSalesVisuals();
}

function handleOpportunityProbabilityChange(event) {
    const opportunityId = event.target.dataset.opportunityId;
    let probability = Number(event.target.value);
    if (!Number.isFinite(probability)) {
        probability = 0;
    }
    probability = Math.min(Math.max(probability, 0), 100);
    event.target.value = probability;

    const opportunity = salesModuleState.opportunities.find(item => item.id === opportunityId);
    if (!opportunity) {
        return;
    }

    opportunity.probability = probability;
    showToast('Updated opportunity probability', 'info');
    refreshSalesVisuals();
}

function refreshSalesVisuals() {
    const metrics = calculateSalesMetrics(salesModuleState.opportunities);
    renderSalesMetrics(metrics);
    renderSalesFunnel(metrics.stageSummary);
    renderSalesPipelineBoard();
    renderSalesOpportunityTable();
    renderSalesForecast(metrics.forecast);
    updateCpqOpportunityOptions();
}

function renderSalesForecast(forecast) {
    const canvas = document.getElementById('salesForecastChart');
    const emptyState = document.getElementById('salesForecastEmpty');
    if (!canvas) {
        return;
    }

    if (!forecast.labels.length) {
        if (charts.salesForecast) {
            charts.salesForecast.destroy();
            charts.salesForecast = null;
        }
        canvas.classList.add('hidden');
        if (emptyState) emptyState.classList.remove('hidden');
        return;
    }

    canvas.classList.remove('hidden');
    if (emptyState) emptyState.classList.add('hidden');

    const context = canvas.getContext('2d');
    if (charts.salesForecast) {
        charts.salesForecast.destroy();
    }

    charts.salesForecast = new Chart(context, {
        type: 'bar',
        data: {
            labels: forecast.labels,
            datasets: [
                {
                    label: 'Total Pipeline',
                    data: forecast.pipeline,
                    backgroundColor: '#bfdbfe',
                    borderColor: '#3b82f6',
                    borderWidth: 1
                },
                {
                    label: 'Weighted Forecast',
                    data: forecast.weighted,
                    backgroundColor: '#bbf7d0',
                    borderColor: '#22c55e',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    ticks: {
                        callback: value => formatCurrency(value)
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    callbacks: {
                        label: context => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
                    }
                }
            }
        }
    });
}

function initializeCpqSection() {
    const productSelect = document.getElementById('cpqProductSelect');
    const opportunitySelect = document.getElementById('cpqOpportunitySelect');
    const addButton = document.getElementById('cpqAddLineItem');
    const resetButton = document.getElementById('cpqResetQuote');
    const quoteButton = document.getElementById('cpqGenerateQuote');
    const invoiceButton = document.getElementById('cpqGenerateInvoice');
    const quotePreview = document.getElementById('cpqQuotePreview');
    const invoiceStatus = document.getElementById('cpqInvoiceStatus');
    const quantityInput = document.getElementById('cpqQuantity');
    const discountInput = document.getElementById('cpqDiscount');
    const catalogSummary = document.getElementById('cpqCatalogSummary');

    if (!productSelect || !opportunitySelect) {
        return;
    }

    productSelect.innerHTML = CPQ_PRODUCTS.map(product => `
        <option value="${product.id}">${product.name} · ${formatCurrency(product.price)} (${product.unit})</option>
    `).join('');

    salesModuleState.cpq.lines = [];
    salesModuleState.cpq.opportunityId = determineDefaultCpqOpportunity();
    salesModuleState.cpq.lastGeneratedAt = null;

    if (quantityInput) quantityInput.value = '1';
    if (discountInput) discountInput.value = '0';
    if (catalogSummary) catalogSummary.textContent = `0 line items · Catalog size ${CPQ_PRODUCTS.length}`;
    if (quotePreview) quotePreview.innerHTML = '<p class="text-sm text-gray-500">Add line items and generate a quote preview.</p>';
    if (invoiceStatus) invoiceStatus.textContent = '';

    updateCpqOpportunityOptions();
    renderCpqLineItems();
    updateCpqTotals();

    addButton?.addEventListener('click', handleAddCpqLineItem);
    resetButton?.addEventListener('click', event => {
        event.preventDefault();
        resetCpqQuote();
    });
    quoteButton?.addEventListener('click', event => {
        event.preventDefault();
        generateQuotePreview();
    });
    invoiceButton?.addEventListener('click', event => {
        event.preventDefault();
        handleGenerateInvoice();
    });
    opportunitySelect.addEventListener('change', event => {
        salesModuleState.cpq.opportunityId = event.target.value || null;
    });
}

function determineDefaultCpqOpportunity() {
    const activeOpportunity = salesModuleState.opportunities.find(opportunity => opportunity.stage !== 'Closed Lost');
    return activeOpportunity ? activeOpportunity.id : (salesModuleState.opportunities[0]?.id || null);
}

function updateCpqOpportunityOptions() {
    const select = document.getElementById('cpqOpportunitySelect');
    if (!select) {
        return;
    }

    if (salesModuleState.opportunities.length === 0) {
        select.innerHTML = '<option value="">No opportunities available</option>';
        select.disabled = true;
        salesModuleState.cpq.opportunityId = null;
        return;
    }

    select.disabled = false;
    const previousSelection = salesModuleState.cpq.opportunityId;
    select.innerHTML = salesModuleState.opportunities.map(opportunity => `
        <option value="${opportunity.id}">${opportunity.name} • ${opportunity.stage}</option>
    `).join('');

    if (previousSelection && salesModuleState.opportunities.some(item => item.id === previousSelection)) {
        select.value = previousSelection;
    } else {
        select.value = determineDefaultCpqOpportunity() || '';
    }

    salesModuleState.cpq.opportunityId = select.value || null;
}

function handleAddCpqLineItem(event) {
    event.preventDefault();
    const productSelect = document.getElementById('cpqProductSelect');
    const quantityInput = document.getElementById('cpqQuantity');
    const discountInput = document.getElementById('cpqDiscount');

    if (!productSelect || !quantityInput || !discountInput) {
        return;
    }

    const product = CPQ_PRODUCTS.find(item => item.id === productSelect.value);
    if (!product) {
        showToast('Select a catalog item to add to the quote', 'warning');
        return;
    }

    let quantity = parseInt(quantityInput.value, 10);
    if (!Number.isFinite(quantity) || quantity <= 0) {
        quantity = 1;
    }

    let discount = parseFloat(discountInput.value);
    if (!Number.isFinite(discount) || discount < 0) {
        discount = 0;
    }
    discount = Math.min(discount, 100);

    quantityInput.value = quantity;
    discountInput.value = discount;

    salesModuleState.cpq.lines.push({
        id: `line-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: product.id,
        name: product.name,
        unit: product.unit,
        price: product.price,
        quantity,
        discount
    });

    renderCpqLineItems();
    updateCpqTotals();
    showToast('Line item added to quote', 'success');
}

function renderCpqLineItems() {
    const tbody = document.getElementById('cpqLineItemsBody');
    if (!tbody) {
        return;
    }

    if (salesModuleState.cpq.lines.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="py-4 text-center text-gray-500">No line items yet. Use the catalog above to build a quote.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = salesModuleState.cpq.lines.map(line => {
        const lineAmount = line.price * line.quantity;
        const netAmount = lineAmount * (1 - line.discount / 100);
        return `
            <tr class="border-b border-gray-100">
                <td class="p-3">
                    <div class="font-medium text-gray-800">${line.name}</div>
                    <div class="text-xs text-gray-500">${line.unit}</div>
                </td>
                <td class="p-3 text-gray-600">${line.quantity}</td>
                <td class="p-3 text-gray-600">${formatCurrency(line.price)}</td>
                <td class="p-3 text-gray-600">${line.discount}%</td>
                <td class="p-3 text-gray-800 font-semibold">${formatCurrency(netAmount)}</td>
                <td class="p-3 text-right">
                    <button class="text-sm text-red-600 hover:text-red-700" data-line-id="${line.id}">Remove</button>
                </td>
            </tr>
        `;
    }).join('');

    tbody.querySelectorAll('button[data-line-id]').forEach(button => {
        button.addEventListener('click', removeCpqLineItem);
    });
}

function removeCpqLineItem(event) {
    event.preventDefault();
    const lineId = event.target.dataset.lineId;
    salesModuleState.cpq.lines = salesModuleState.cpq.lines.filter(line => line.id !== lineId);
    renderCpqLineItems();
    updateCpqTotals();
    showToast('Removed line item from quote', 'info');
}

function updateCpqTotals() {
    const subtotalElement = document.getElementById('cpqSubtotal');
    const discountElement = document.getElementById('cpqDiscountTotal');
    const totalElement = document.getElementById('cpqGrandTotal');
    const catalogSummary = document.getElementById('cpqCatalogSummary');

    let subtotal = 0;
    let discountTotal = 0;

    salesModuleState.cpq.lines.forEach(line => {
        const lineAmount = line.price * line.quantity;
        const discountAmount = lineAmount * (line.discount / 100);
        subtotal += lineAmount;
        discountTotal += discountAmount;
    });

    const total = subtotal - discountTotal;

    if (subtotalElement) subtotalElement.textContent = formatCurrency(subtotal);
    if (discountElement) discountElement.textContent = `-${formatCurrency(discountTotal)}`;
    if (totalElement) totalElement.textContent = formatCurrency(total);
    if (catalogSummary) catalogSummary.textContent = `${salesModuleState.cpq.lines.length} line items · Catalog size ${CPQ_PRODUCTS.length}`;

    return { subtotal, discountTotal, total };
}

function resetCpqQuote() {
    salesModuleState.cpq.lines = [];
    salesModuleState.cpq.lastGeneratedAt = null;
    const opportunitySelect = document.getElementById('cpqOpportunitySelect');
    if (opportunitySelect) {
        opportunitySelect.value = determineDefaultCpqOpportunity() || '';
        salesModuleState.cpq.opportunityId = opportunitySelect.value || null;
    }

    renderCpqLineItems();
    updateCpqTotals();

    const quotePreview = document.getElementById('cpqQuotePreview');
    if (quotePreview) {
        quotePreview.innerHTML = '<p class="text-sm text-gray-500">Quote cleared. Add new line items to continue.</p>';
    }

    const invoiceStatus = document.getElementById('cpqInvoiceStatus');
    if (invoiceStatus) {
        invoiceStatus.className = 'text-sm text-gray-500';
        invoiceStatus.textContent = '';
    }
}

function generateQuotePreview() {
    if (salesModuleState.cpq.lines.length === 0) {
        showToast('Add at least one line item before generating a quote', 'warning');
        return;
    }

    const quotePreview = document.getElementById('cpqQuotePreview');
    if (!quotePreview) {
        return;
    }

    const opportunity = salesModuleState.opportunities.find(item => item.id === salesModuleState.cpq.opportunityId);
    const totals = updateCpqTotals();
    const generatedAt = new Date();
    salesModuleState.cpq.lastGeneratedAt = generatedAt;

    const lineRows = salesModuleState.cpq.lines.map(line => {
        const lineAmount = line.price * line.quantity;
        const netAmount = lineAmount * (1 - line.discount / 100);
        return `
            <tr class="border-t border-gray-100">
                <td class="p-3">${line.name}</td>
                <td class="p-3 text-right">${line.quantity}</td>
                <td class="p-3 text-right">${formatCurrency(line.price)}</td>
                <td class="p-3 text-right">${line.discount}%</td>
                <td class="p-3 text-right">${formatCurrency(netAmount)}</td>
            </tr>
        `;
    }).join('');

    quotePreview.innerHTML = `
        <div class="space-y-3">
            <div class="flex items-center justify-between">
                <h4 class="text-sm font-semibold text-gray-700">Quote Summary</h4>
                <span class="text-xs text-gray-500">${generatedAt.toLocaleString()}</span>
            </div>
            <div class="text-sm text-gray-600">
                <p><span class="font-medium text-gray-700">Opportunity:</span> ${opportunity ? opportunity.name : 'Unassigned quote'}</p>
                <p><span class="font-medium text-gray-700">Account:</span> ${opportunity?.company_name || 'Not linked'}</p>
            </div>
            <div class="border border-gray-200 rounded-lg overflow-hidden">
                <table class="w-full text-sm">
                    <thead class="bg-gray-100 text-gray-600 uppercase text-xs">
                        <tr>
                            <th class="p-3 text-left">Product</th>
                            <th class="p-3 text-right">Qty</th>
                            <th class="p-3 text-right">Unit Price</th>
                            <th class="p-3 text-right">Discount</th>
                            <th class="p-3 text-right">Net Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${lineRows}
                    </tbody>
                </table>
            </div>
            <div class="flex justify-end text-sm text-gray-700">
                <div class="space-y-1 text-right">
                    <div><span class="font-medium">Subtotal:</span> ${formatCurrency(totals.subtotal)}</div>
                    <div><span class="font-medium">Discounts:</span> -${formatCurrency(totals.discountTotal)}</div>
                    <div class="text-base font-semibold text-gray-800"><span>Total Due:</span> ${formatCurrency(totals.total)}</div>
                </div>
            </div>
        </div>
    `;

    showToast('Quote preview generated', 'success');
}

function handleGenerateInvoice() {
    if (salesModuleState.cpq.lines.length === 0) {
        showToast('Create a quote before generating an invoice draft', 'warning');
        return;
    }

    const paymentProviders = Array.from(salesModuleState.billing.paymentProviders);
    const accountingSystems = Array.from(salesModuleState.billing.accountingSystems);
    const invoiceStatus = document.getElementById('cpqInvoiceStatus');

    if (paymentProviders.length === 0 || accountingSystems.length === 0) {
        showToast('Connect billing integrations to prepare invoices', 'warning');
        if (invoiceStatus) {
            invoiceStatus.className = 'text-sm text-red-600';
            invoiceStatus.textContent = 'Connect at least one payment provider and accounting system to create invoices.';
        }
        return;
    }

    const totals = updateCpqTotals();
    const opportunity = salesModuleState.opportunities.find(item => item.id === salesModuleState.cpq.opportunityId);
    const paymentNames = paymentProviders.map(id => PAYMENT_PROVIDERS.find(provider => provider.id === id)?.name || id);
    const accountingNames = accountingSystems.map(id => ACCOUNTING_SYSTEMS.find(system => system.id === id)?.name || id);

    if (invoiceStatus) {
        invoiceStatus.className = 'text-sm text-green-600';
        invoiceStatus.innerHTML = `
            Invoice draft prepared for <span class="font-semibold">${opportunity ? opportunity.name : 'unassigned opportunity'}</span>.<br>
            Payments via ${paymentNames.join(', ')} · Syncing to ${accountingNames.join(', ')} with terms ${salesModuleState.billing.paymentTerms}.<br>
            Total due: ${formatCurrency(totals.total)}.
        `;
    }

    showToast('Invoice draft prepared with connected systems', 'success');
}

function initializeBillingIntegrations() {
    const paymentsContainer = document.getElementById('paymentProvidersList');
    const accountingContainer = document.getElementById('accountingSystemsList');
    const termsSelect = document.getElementById('invoicePaymentTerms');
    const autoSendCheckbox = document.getElementById('invoiceAutoSend');
    const syncButton = document.getElementById('simulateInvoiceSync');
    const syncStatus = document.getElementById('invoiceSyncStatus');

    if (!paymentsContainer || !accountingContainer) {
        return;
    }

    salesModuleState.billing.paymentProviders = new Set();
    salesModuleState.billing.accountingSystems = new Set();
    salesModuleState.billing.paymentTerms = termsSelect?.value || 'Net 30';
    salesModuleState.billing.autoSendInvoices = autoSendCheckbox?.checked || false;
    if (syncStatus) {
        syncStatus.className = 'text-sm text-gray-500';
        syncStatus.textContent = '';
    }

    paymentsContainer.innerHTML = PAYMENT_PROVIDERS.map(provider => createIntegrationOption(provider, 'payment')).join('');
    accountingContainer.innerHTML = ACCOUNTING_SYSTEMS.map(system => createIntegrationOption(system, 'accounting')).join('');

    paymentsContainer.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', event => updateBillingSelection(event, 'payment'));
    });

    accountingContainer.querySelectorAll('input[type="checkbox"]').forEach(input => {
        input.addEventListener('change', event => updateBillingSelection(event, 'accounting'));
    });

    termsSelect?.addEventListener('change', event => {
        salesModuleState.billing.paymentTerms = event.target.value;
        updateBillingConnectionSummary();
    });

    autoSendCheckbox?.addEventListener('change', event => {
        salesModuleState.billing.autoSendInvoices = event.target.checked;
        updateBillingConnectionSummary();
    });

    syncButton?.addEventListener('click', event => {
        event.preventDefault();
        simulateInvoiceSync();
    });

    updateBillingConnectionSummary();
}

function createIntegrationOption(item, group) {
    return `
        <label class="flex items-start space-x-3 border border-gray-200 rounded-lg px-3 py-2 hover:border-blue-300 cursor-pointer">
            <input type="checkbox" value="${item.id}" data-integration-group="${group}" class="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
            <div>
                <p class="text-sm font-medium text-gray-700">${item.name}</p>
                <p class="text-xs text-gray-500">${item.description}</p>
            </div>
        </label>
    `;
}

function updateBillingSelection(event, group) {
    const id = event.target.value;
    const isChecked = event.target.checked;
    const targetSet = group === 'payment' ? salesModuleState.billing.paymentProviders : salesModuleState.billing.accountingSystems;

    if (isChecked) {
        targetSet.add(id);
    } else {
        targetSet.delete(id);
    }

    updateBillingConnectionSummary();
}

function updateBillingConnectionSummary() {
    const summary = document.getElementById('billingConnectionSummary');
    if (!summary) {
        return;
    }

    const paymentLabels = Array.from(salesModuleState.billing.paymentProviders).map(id =>
        PAYMENT_PROVIDERS.find(provider => provider.id === id)?.name || id
    );
    const accountingLabels = Array.from(salesModuleState.billing.accountingSystems).map(id =>
        ACCOUNTING_SYSTEMS.find(system => system.id === id)?.name || id
    );

    const autoSendText = salesModuleState.billing.autoSendInvoices ? 'Auto-send enabled' : 'Manual invoice dispatch';

    summary.innerHTML = `
        <div class="space-y-1">
            <p><span class="font-semibold">Payments:</span> ${paymentLabels.length ? paymentLabels.join(', ') : 'No providers connected'}</p>
            <p><span class="font-semibold">Accounting:</span> ${accountingLabels.length ? accountingLabels.join(', ') : 'No ledgers connected'}</p>
            <p><span class="font-semibold">Terms:</span> ${salesModuleState.billing.paymentTerms} · ${autoSendText}</p>
        </div>
    `;
}

function simulateInvoiceSync() {
    const status = document.getElementById('invoiceSyncStatus');
    if (!status) {
        return;
    }

    const paymentProviders = Array.from(salesModuleState.billing.paymentProviders);
    const accountingSystems = Array.from(salesModuleState.billing.accountingSystems);

    if (paymentProviders.length === 0 || accountingSystems.length === 0) {
        status.className = 'text-sm text-red-600';
        status.textContent = 'Connect at least one payment provider and one accounting platform to run the sync.';
        showToast('Cannot run billing sync without integrations', 'warning');
        return;
    }

    const autoSendText = salesModuleState.billing.autoSendInvoices ? 'Auto-send is enabled' : 'Auto-send is disabled';
    const lineItemCount = salesModuleState.cpq.lines.length;

    status.className = 'text-sm text-gray-600';
    status.innerHTML = `
        Sync completed at ${new Date().toLocaleTimeString()}.<br>
        Prepared ${lineItemCount} quote line item(s) for invoicing through ${paymentProviders.length} payment provider(s) and ${accountingSystems.length} accounting system(s).<br>
        ${autoSendText}.
    `;

    showToast('Invoice sync simulated successfully', 'success');
}

function ensureCompetitorHubStyles() {
    if (document.getElementById('competitorHubStyles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'competitorHubStyles';
    style.textContent = `
        .cih-root {
            background: radial-gradient(circle at top left, rgba(56, 189, 248, 0.08), transparent 45%),
                radial-gradient(circle at bottom right, rgba(147, 51, 234, 0.12), transparent 35%),
                #020617;
            min-height: calc(100vh - 120px);
            padding: 2.5rem 2rem;
            border-radius: 1.25rem;
            color: #e2e8f0;
        }

        .cih-grid {
            display: grid;
            gap: 1.5rem;
        }

        .cih-summary-card {
            background: rgba(15, 23, 42, 0.75);
            border: 1px solid rgba(148, 163, 184, 0.15);
            box-shadow: 0 20px 45px -20px rgba(15, 23, 42, 0.8);
            border-radius: 1rem;
            padding: 1.5rem;
            position: relative;
            overflow: hidden;
            transition: transform 0.3s ease, border-color 0.3s ease;
        }

        .cih-summary-card:hover {
            transform: translateY(-4px);
            border-color: rgba(96, 165, 250, 0.45);
        }

        .cih-summary-badge {
            display: inline-flex;
            align-items: center;
            padding: 0.25rem 0.6rem;
            background: rgba(96, 165, 250, 0.16);
            color: #bfdbfe;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .cih-section {
            background: rgba(15, 23, 42, 0.78);
            border: 1px solid rgba(148, 163, 184, 0.18);
            border-radius: 1.25rem;
            padding: 1.75rem;
            box-shadow: 0 25px 60px -35px rgba(30, 64, 175, 0.55);
        }

        .cih-workspace-shell {
            display: grid;
            gap: 1.5rem;
        }

        @media (min-width: 1280px) {
            .cih-workspace-shell {
                grid-template-columns: 7fr 5fr;
                align-items: start;
            }
        }

        .cih-workspace-panel {
            background: rgba(2, 6, 23, 0.65);
            border: 1px solid rgba(148, 163, 184, 0.18);
            border-radius: 1.15rem;
            padding: 1.25rem;
            box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.35);
        }

        .cih-tab-bar {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }

        .cih-tab {
            display: inline-flex;
            align-items: center;
            gap: 0.6rem;
            border-radius: 9999px;
            padding: 0.35rem 0.75rem;
            background: rgba(30, 41, 59, 0.65);
            border: 1px solid transparent;
            color: #cbd5f5;
            font-size: 0.85rem;
            transition: all 0.2s ease;
        }

        .cih-tab input[type='checkbox'] {
            accent-color: #38bdf8;
        }

        .cih-tab[data-active='true'] {
            background: rgba(56, 189, 248, 0.18);
            border-color: rgba(56, 189, 248, 0.65);
            color: #f8fafc;
        }

        .cih-tab button {
            color: inherit;
        }

        .cih-tab button:hover {
            color: #fca5a5;
        }

        .cih-workspace-toolbar {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1rem;
        }

        .cih-workspace-toolbar .cih-outline-button {
            font-size: 0.8rem;
            padding: 0.4rem 0.8rem;
        }

        .cih-split-selector {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-bottom: 0.75rem;
        }

        .cih-split-selector label {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            background: rgba(30, 41, 59, 0.6);
            border-radius: 9999px;
            padding: 0.35rem 0.75rem;
            font-size: 0.75rem;
        }

        .cih-workspace-canvas {
            display: grid;
            gap: 1rem;
        }

        .cih-workspace-canvas[data-split='true'] {
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        }

        .cih-workspace-column {
            display: grid;
            gap: 0.75rem;
        }

        .cih-workspace-column-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.5rem 0.25rem;
            color: #cbd5f5;
        }

        .cih-workspace-module {
            background: rgba(15, 23, 42, 0.9);
            border: 1px solid rgba(148, 163, 184, 0.25);
            border-radius: 1rem;
            padding: 1rem;
            display: grid;
            gap: 0.75rem;
        }

        .cih-workspace-module[data-status='collapsed'] .cih-module-body,
        .cih-workspace-module[data-status='minimized'] .cih-module-body {
            display: none;
        }

        .cih-module-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
        }

        .cih-module-header h4 {
            font-size: 1rem;
            font-weight: 600;
            color: #f8fafc;
        }

        .cih-module-meta {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
            font-size: 0.7rem;
            color: #94a3b8;
        }

        .cih-module-actions {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
        }

        .cih-module-actions button {
            background: rgba(30, 41, 59, 0.55);
            border: 1px solid transparent;
            border-radius: 0.65rem;
            padding: 0.3rem 0.55rem;
            color: #94a3b8;
            font-size: 0.7rem;
            transition: all 0.2s ease;
        }

        .cih-module-actions button:hover {
            border-color: rgba(56, 189, 248, 0.65);
            color: #e0f2fe;
        }

        .cih-module-body {
            display: grid;
            gap: 0.65rem;
            color: #e2e8f0;
            font-size: 0.85rem;
        }

        .cih-module-body table {
            width: 100%;
            border-collapse: collapse;
        }

        .cih-module-body table td,
        .cih-module-body table th {
            padding: 0.35rem 0.25rem;
            border-bottom: 1px solid rgba(148, 163, 184, 0.2);
        }

        .cih-module-body table thead th {
            text-transform: uppercase;
            font-size: 0.7rem;
            letter-spacing: 0.04em;
            color: #94a3b8;
        }

        .cih-module-tag {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            background: rgba(59, 130, 246, 0.12);
            border-radius: 9999px;
            padding: 0.25rem 0.6rem;
            font-size: 0.7rem;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #93c5fd;
        }

        .cih-module-library {
            display: grid;
            gap: 1rem;
        }

        .cih-library-category h4 {
            color: #f8fafc;
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 0.75rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .cih-library-grid {
            display: grid;
            gap: 0.75rem;
        }

        @media (min-width: 768px) {
            .cih-library-grid {
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            }
        }

        .cih-library-item {
            background: rgba(15, 23, 42, 0.8);
            border: 1px solid rgba(148, 163, 184, 0.25);
            border-radius: 0.85rem;
            padding: 0.9rem;
            display: grid;
            gap: 0.65rem;
        }

        .cih-library-item p {
            font-size: 0.8rem;
            color: #cbd5f5;
        }

        .cih-library-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }

        .cih-library-actions button {
            flex: 1;
            min-width: 120px;
            font-size: 0.75rem;
        }

        .cih-custom-template {
            background: rgba(15, 23, 42, 0.75);
            border: 1px solid rgba(148, 163, 184, 0.22);
            border-radius: 0.95rem;
            padding: 1rem;
            display: grid;
            gap: 0.75rem;
        }

        .cih-custom-template form {
            display: grid;
            gap: 0.65rem;
        }

        .cih-custom-template input,
        .cih-custom-template textarea,
        .cih-custom-template select {
            background: rgba(30, 41, 59, 0.65);
            border: 1px solid rgba(148, 163, 184, 0.3);
            border-radius: 0.65rem;
            padding: 0.5rem 0.75rem;
            color: #f8fafc;
            font-size: 0.85rem;
        }

        .cih-custom-template textarea {
            min-height: 80px;
        }

        .cih-size-small {
            grid-row: span 1;
        }

        .cih-size-medium {
            grid-row: span 1;
        }

        .cih-size-large {
            grid-row: span 2;
        }

        .cih-size-fullwidth {
            grid-column: 1 / -1;
        }

        .cih-permission-chip {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            background: rgba(15, 118, 110, 0.3);
            border-radius: 9999px;
            padding: 0.2rem 0.55rem;
            font-size: 0.7rem;
            color: #5eead4;
        }

        .cih-section-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 1.5rem;
        }

        .cih-section-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: #f8fafc;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .cih-section-title i {
            color: #38bdf8;
        }

        .cih-tag {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            background: rgba(71, 85, 105, 0.45);
            border-radius: 9999px;
            padding: 0.25rem 0.75rem;
            font-size: 0.75rem;
            letter-spacing: 0.02em;
        }

        .cih-card {
            background: rgba(2, 6, 23, 0.7);
            border: 1px solid rgba(148, 163, 184, 0.15);
            border-radius: 1.15rem;
            padding: 1.25rem;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }

        .cih-card::before {
            content: '';
            position: absolute;
            inset: -30% auto auto -30%;
            width: 65%;
            height: 65%;
            background: radial-gradient(circle at center, rgba(56, 189, 248, 0.25), transparent 70%);
            opacity: 0;
            transition: opacity 0.35s ease;
        }

        .cih-card:hover {
            transform: translateY(-6px);
            border-color: rgba(59, 130, 246, 0.35);
        }

        .cih-card:hover::before {
            opacity: 1;
        }

        .cih-card h4 {
            font-size: 1.05rem;
            font-weight: 600;
            color: #f1f5f9;
        }

        .cih-card p {
            color: #94a3b8;
        }

        .cih-flag {
            width: 0.6rem;
            height: 0.6rem;
            border-radius: 9999px;
        }

        .cih-status-active { background: #34d399; box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.25); }
        .cih-status-monitor { background: #facc15; box-shadow: 0 0 0 3px rgba(250, 204, 21, 0.18); }
        .cih-status-watch { background: #a855f7; box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.18); }

        .cih-compare-panel {
            background: rgba(2, 6, 23, 0.6);
            border: 1px dashed rgba(148, 163, 184, 0.25);
            border-radius: 1rem;
            padding: 1.25rem;
        }

        .cih-compare-panel h4 {
            font-size: 1rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }

        .cih-chip {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            padding: 0.35rem 0.8rem;
            border-radius: 999px;
            background: rgba(51, 65, 85, 0.6);
            color: #cbd5f5;
            font-size: 0.78rem;
        }

        .cih-chip i {
            color: #38bdf8;
        }

        .cih-competitor-card {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .cih-outline-button {
            border: 1px solid rgba(148, 163, 184, 0.35);
            background: rgba(15, 23, 42, 0.65);
            padding: 0.45rem 0.85rem;
            border-radius: 0.8rem;
            color: #e2e8f0;
            font-size: 0.85rem;
            transition: all 0.25s ease;
        }

        .cih-outline-button:hover,
        .cih-outline-button.active {
            border-color: rgba(59, 130, 246, 0.65);
            color: #bfdbfe;
            background: rgba(59, 130, 246, 0.18);
        }

        .cih-primary-button {
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.85), rgba(14, 165, 233, 0.85));
            color: #f8fafc;
            padding: 0.45rem 0.95rem;
            border-radius: 0.8rem;
            font-size: 0.85rem;
            border: 1px solid rgba(59, 130, 246, 0.65);
            display: inline-flex;
            align-items: center;
            gap: 0.45rem;
            box-shadow: 0 10px 25px -15px rgba(56, 189, 248, 0.85);
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .cih-primary-button:hover {
            transform: translateY(-1px);
            box-shadow: 0 18px 30px -12px rgba(56, 189, 248, 0.9);
        }

        .cih-module {
            border-radius: 1rem;
            border: 1px solid rgba(148, 163, 184, 0.15);
            background: rgba(2, 6, 23, 0.7);
            overflow: hidden;
        }

        .cih-module-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem 1.25rem;
            border-bottom: 1px solid rgba(148, 163, 184, 0.1);
        }

        .cih-module-header button {
            background: rgba(59, 130, 246, 0.12);
            border: 1px solid rgba(59, 130, 246, 0.35);
            color: #bfdbfe;
            font-size: 0.8rem;
            padding: 0.35rem 0.85rem;
            border-radius: 0.65rem;
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            transition: all 0.25s ease;
        }

        .cih-module-header button:hover {
            background: rgba(59, 130, 246, 0.2);
        }

        .cih-module-body {
            padding: 1.1rem 1.35rem 1.5rem;
            display: grid;
            gap: 1.25rem;
        }

        .cih-module-preview {
            display: grid;
            gap: 1rem;
        }

        .cih-module-expanded {
            display: none;
            gap: 1.2rem;
        }

        .cih-module.expanded .cih-module-preview {
            display: none;
        }

        .cih-module.expanded .cih-module-expanded {
            display: grid;
        }

        .cih-kanban-column {
            background: rgba(15, 23, 42, 0.65);
            border-radius: 0.85rem;
            border: 1px solid rgba(148, 163, 184, 0.12);
            padding: 1rem;
            min-height: 220px;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }

        .cih-kanban-card {
            background: rgba(2, 6, 23, 0.75);
            border-radius: 0.8rem;
            border: 1px solid rgba(148, 163, 184, 0.12);
            padding: 0.75rem;
            display: grid;
            gap: 0.5rem;
        }

        .cih-mini-table {
            width: 100%;
            border-collapse: collapse;
        }

        .cih-mini-table th,
        .cih-mini-table td {
            padding: 0.55rem 0.65rem;
            text-align: left;
            border-bottom: 1px solid rgba(148, 163, 184, 0.12);
            font-size: 0.82rem;
        }

        .cih-mini-table th {
            font-weight: 600;
            color: #cbd5f5;
        }

        .cih-sentiment-positive { color: #4ade80; }
        .cih-sentiment-neutral { color: #facc15; }
        .cih-sentiment-negative { color: #f87171; }

        .cih-tech-chip {
            background: rgba(2, 132, 199, 0.2);
            border: 1px solid rgba(14, 165, 233, 0.35);
            color: #bae6fd;
            padding: 0.35rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.78rem;
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
        }

        .cih-swatch {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            background: rgba(30, 41, 59, 0.55);
            border-radius: 9999px;
            padding: 0.25rem 0.6rem;
            font-size: 0.75rem;
        }

        .cih-dot {
            width: 0.55rem;
            height: 0.55rem;
            border-radius: 9999px;
        }

        .cih-rel-diagram {
            display: grid;
            gap: 1rem;
        }

        .cih-rel-nodes {
            display: grid;
            gap: 0.75rem;
        }

        .cih-rel-link {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            background: rgba(15, 23, 42, 0.65);
            padding: 0.65rem 0.85rem;
            border-radius: 0.75rem;
            border: 1px solid rgba(148, 163, 184, 0.12);
        }

        .cih-rel-node {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: rgba(2, 6, 23, 0.7);
            border-radius: 0.8rem;
            border: 1px solid rgba(148, 163, 184, 0.12);
            padding: 0.75rem 0.85rem;
        }

        .cih-swot-grid {
            display: grid;
            gap: 1.1rem;
        }

        @media (min-width: 768px) {
            .cih-grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
            .cih-grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            .cih-grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }

        @media (max-width: 1024px) {
            .cih-root {
                padding: 1.75rem 1.25rem;
            }
        }
    `;

    document.head.appendChild(style);
}


function competitorHubToDate(value) {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function competitorHubFormatRelative(value) {
    const date = competitorHubToDate(value);
    if (!date) return '—';
    const diff = Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 1) return 'сьогодні';
    if (diff < 30) {
        const mod10 = diff % 10;
        const mod100 = diff % 100;
        let word = 'днів';
        if (mod100 < 11 || mod100 > 14) {
            if (mod10 === 1) word = 'день';
            else if (mod10 >= 2 && mod10 <= 4) word = 'дні';
        }
        return `${diff} ${word} тому`;
    }
    const months = Math.round(diff / 30);
    const mod10 = months % 10;
    const mod100 = months % 100;
    let monthWord = 'місяців';
    if (mod100 < 11 || mod100 > 14) {
        if (mod10 === 1) monthWord = 'місяць';
        else if (mod10 >= 2 && mod10 <= 4) monthWord = 'місяці';
    }
    return `${months} ${monthWord} тому`;
}

function competitorHubFormatDateShort(value) {
    const date = competitorHubToDate(value);
    if (!date) return '—';
    return date.toLocaleDateString('uk-UA', { month: 'short', day: 'numeric' });
}

function competitorHubTierRank(tier) {
    const normalized = (tier || '').toLowerCase();
    if (normalized.includes('tier 1')) return 0;
    if (normalized.includes('tier 2')) return 1;
    if (normalized.includes('tier 3')) return 2;
    return 3;
}

function competitorHubRiskBadge(level) {
    const normalized = (level || '').toLowerCase();
    if (normalized === 'high') return 'bg-rose-500/30 text-rose-200 border border-rose-500/50';
    if (normalized === 'medium') return 'bg-amber-500/20 text-amber-200 border border-amber-400/40';
    return 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/30';
}

function competitorHubResolveColumn(status) {
    const normalized = (status || '').toLowerCase();
    if (normalized.includes('progress')) return 'In Progress';
    if (normalized.includes('review') || normalized.includes('waiting')) return 'Review';
    if (normalized.includes('done') || normalized.includes('complete')) return 'Done';
    return 'Backlog';
}

const COMPETITOR_ENHANCEMENTS = {
    'competitor-insightsphere': {
        contacts: [
            { name: 'Eva Neumann', title: 'VP Competitive Strategy', email: 'eva.neumann@insightsphere.ai', phone: '+49 30 555 120', segment: 'Executive', linkedin: 'linkedin.com/in/evaneumann', notes: 'Primary spokesperson for enterprise analytics deals.' },
            { name: 'Mateusz Brunner', title: 'Head of Solution Engineering', email: 'mateusz.brunner@insightsphere.ai', phone: '+48 22 601 440', segment: 'Solutions', linkedin: 'linkedin.com/in/mateuszbrunner', notes: 'Runs technical evaluations and POC approvals.' },
            { name: 'Ivy Salazar', title: 'Strategic Partnerships Lead', email: 'ivy.salazar@insightsphere.ai', phone: '+1 415 200 9981', segment: 'Alliances', linkedin: 'linkedin.com/in/ivysalazar', notes: 'Signs co-marketing agreements in North America.' },
            { name: 'Tomasz Ricci', title: 'Head of Pricing', email: 't.ricci@insightsphere.ai', phone: '+39 02 555 880', segment: 'Product', linkedin: 'linkedin.com/in/tomaszricci', notes: 'Owns price experimentation and enterprise bids.' }
        ],
        relationships: {
            nodes: [
                { id: 'insightsphere', label: 'InsightSphere', type: 'Competitor' },
                { id: 'techcorp', label: 'TechCorp Solutions', type: 'Client' },
                { id: 'startupxyz', label: 'StartupXYZ', type: 'Client' },
                { id: 'databridge', label: 'DataBridge Partners', type: 'Partner' },
                { id: 'forecastai', label: 'ForecastAI', type: 'Product' }
            ],
            links: [
                { source: 'insightsphere', target: 'techcorp', type: 'Competition', description: 'Head-to-head in predictive intelligence RFP.' },
                { source: 'insightsphere', target: 'startupxyz', type: 'Competition', description: 'Battling for usage analytics expansion.' },
                { source: 'insightsphere', target: 'databridge', type: 'Partnership', description: 'Data ingestion alliance for EU compliance.' },
                { source: 'insightsphere', target: 'forecastai', type: 'Ownership', description: 'Acquired ForecastAI in 2023 for AI copilot tech.' }
            ]
        },
        pricing: {
            summary: 'Enterprise suite increased by 6% QoQ, usage add-ons now metered.',
            series: [
                { plan: 'Enterprise', points: [
                    { label: 'Jan', value: 1190 },
                    { label: 'Feb', value: 1190 },
                    { label: 'Mar', value: 1225 },
                    { label: 'Apr', value: 1260 },
                    { label: 'May', value: 1260 }
                ] },
                { plan: 'Growth', points: [
                    { label: 'Jan', value: 780 },
                    { label: 'Feb', value: 780 },
                    { label: 'Mar', value: 795 },
                    { label: 'Apr', value: 805 },
                    { label: 'May', value: 805 }
                ] }
            ],
            table: [
                { plan: 'Starter', price: '$480/mo', positioning: 'Below our Growth plan', movement: '+3% QoQ' },
                { plan: 'Growth', price: '$805/mo', positioning: 'Matches our Scale plan', movement: '+2% QoQ' },
                { plan: 'Enterprise', price: '$1,260/mo', positioning: 'Higher than Elite plan', movement: '+6% QoQ' }
            ],
            alerts: [
                { label: 'Usage-based add-ons', status: 'Active' },
                { label: 'Annual uplift threshold', status: 'Monitor' }
            ]
        },
        media: [
            { title: 'InsightSphere launches AI forecasting copilot', source: 'TechCrunch', date: '2024-05-10', sentiment: 'Positive', summary: 'Highlights predictive workflows for enterprise accounts.' },
            { title: 'InsightSphere doubles EU data center footprint', source: 'EU SaaS Weekly', date: '2024-05-02', sentiment: 'Neutral', summary: 'Capacity expansion to support regulated markets.' },
            { title: 'Analysts question InsightSphere pricing flexibility', source: 'RevenueOps Digest', date: '2024-04-26', sentiment: 'Negative', summary: 'Concerns around price lock-ins raised by customers.' }
        ],
        documents: [
            { title: 'Battlecard Q2 2024', type: 'PDF', updated: '2024-05-09', owner: 'Competitive Research Guild' },
            { title: 'Pricing objection handling', type: 'Slides', updated: '2024-04-22', owner: 'Enablement' },
            { title: 'Latest security posture brief', type: 'Doc', updated: '2024-04-18', owner: 'Product Marketing' }
        ],
        swot: {
            strengths: ['AI-first roadmap resonates with enterprise buyers', 'Deep partner ecosystem in DACH region'],
            weaknesses: ['High implementation costs vs. peers', 'Limited SMB enablement playbooks'],
            opportunities: ['Customers asking for compliance automation', 'Upsell via predictive benchmarking bundles'],
            threats: ['Emerging regional analytics challengers', 'Our new freemium analytics add-on']
        },
        tech: {
            highlights: 'Snowflake-based warehouse with dbt and Kubernetes orchestration.',
            categories: [
                { label: 'Data & AI', items: ['Snowflake', 'dbt', 'Airflow', 'Python'] },
                { label: 'Platform', items: ['React', 'GraphQL', 'Kubernetes', 'Istio'] },
                { label: 'GTM Stack', items: ['HubSpot', 'Gong', 'Pendo'] }
            ]
        }
    },
    'competitor-marketpulse': {
        contacts: [
            { name: 'Laura Vaitkus', title: 'Head of Market Strategy', email: 'laura.vaitkus@marketpulse.io', phone: '+370 5 777 120', segment: 'Strategy', linkedin: 'linkedin.com/in/lauravaitkus', notes: 'Coordinates Baltic go-to-market plays.' },
            { name: 'Anders Holm', title: 'Director of Pricing Research', email: 'anders.holm@marketpulse.io', phone: '+45 70 55 210', segment: 'Research', linkedin: 'linkedin.com/in/andersholm', notes: 'Owner of pricing benchmark methodology.' },
            { name: 'Milda Janule', title: 'Enterprise Account Executive', email: 'milda.janule@marketpulse.io', phone: '+370 6 210 998', segment: 'Sales', linkedin: 'linkedin.com/in/mildajanule', notes: 'Works Baltic logistics enterprise accounts.' }
        ],
        relationships: {
            nodes: [
                { id: 'marketpulse', label: 'MarketPulse', type: 'Competitor' },
                { id: 'globalmanufacturing', label: 'Global Manufacturing', type: 'Client' },
                { id: 'balticalliance', label: 'Baltic SaaS Consortium', type: 'Partner' },
                { id: 'alertengine', label: 'AlertEngine', type: 'Product' }
            ],
            links: [
                { source: 'marketpulse', target: 'globalmanufacturing', type: 'Competition', description: 'Pitching logistics pricing benchmarks.' },
                { source: 'marketpulse', target: 'balticalliance', type: 'Partnership', description: 'New data sharing agreement (2024).' },
                { source: 'marketpulse', target: 'alertengine', type: 'Product', description: 'Core alert automation workflow.' }
            ]
        },
        pricing: {
            summary: 'Stabilized base pricing while introducing pay-per-alert surcharges.',
            series: [
                { plan: 'Growth', points: [
                    { label: 'Jan', value: 540 },
                    { label: 'Feb', value: 540 },
                    { label: 'Mar', value: 560 },
                    { label: 'Apr', value: 560 },
                    { label: 'May', value: 565 }
                ] },
                { plan: 'Enterprise', points: [
                    { label: 'Jan', value: 920 },
                    { label: 'Feb', value: 940 },
                    { label: 'Mar', value: 940 },
                    { label: 'Apr', value: 955 },
                    { label: 'May', value: 955 }
                ] }
            ],
            table: [
                { plan: 'Essential', price: '$390/mo', positioning: 'Undercuts our entry plan', movement: '+0% QoQ' },
                { plan: 'Growth', price: '$565/mo', positioning: 'Matches our Standard plan', movement: '+5% QoQ' },
                { plan: 'Enterprise', price: '$955/mo', positioning: 'Lower than Elite', movement: '+4% QoQ' }
            ],
            alerts: [
                { label: 'Alert surcharges', status: 'Active' },
                { label: 'Consortium bundle pricing', status: 'Monitor' }
            ]
        },
        media: [
            { title: 'MarketPulse joins Baltic SaaS consortium', source: 'Baltic Tech Wire', date: '2024-05-08', sentiment: 'Positive', summary: 'Expands coverage in maritime and logistics sectors.' },
            { title: 'MarketPulse adds cross-border pricing alerts', source: 'Logistics Today', date: '2024-04-30', sentiment: 'Positive', summary: 'New alert types covering import/export fees.' }
        ],
        documents: [
            { title: 'MarketPulse Q2 positioning', type: 'PDF', updated: '2024-05-05', owner: 'Regional Desk' },
            { title: 'Competitive pricing grid', type: 'Spreadsheet', updated: '2024-04-24', owner: 'Revenue Ops' }
        ],
        swot: {
            strengths: ['Deep Baltic market coverage', 'Alert automation differentiator'],
            weaknesses: ['Limited enterprise support hours', 'Data latency outside Baltics'],
            opportunities: ['Alliances expand dataset reach', 'Partnership upsell potential'],
            threats: ['Local challengers in Poland', 'Our freight benchmark launch']
        },
        tech: {
            highlights: 'Alert engine powered by Go microservices, front-end in Vue 3.',
            categories: [
                { label: 'Data', items: ['PostgreSQL', 'Metabase', 'Fivetran'] },
                { label: 'Platform', items: ['Vue 3', 'Tailwind', 'Go'] },
                { label: 'Integrations', items: ['Slack', 'Outlook', 'Zapier'] }
            ]
        }
    },
    'competitor-atlaslogix': {
        contacts: [
            { name: 'Justyna Kowalski', title: 'Founder & CEO', email: 'justyna@atlaslogix.io', phone: '+48 71 300 450', segment: 'Executive', linkedin: 'linkedin.com/in/justynak', notes: 'Active on LinkedIn about freight automation.' },
            { name: 'Rafael Silva', title: 'Head of Product', email: 'rafael.silva@atlaslogix.io', phone: '+351 21 650 778', segment: 'Product', linkedin: 'linkedin.com/in/rafaelsilva', notes: 'Owns modular dashboard roadmap.' }
        ],
        relationships: {
            nodes: [
                { id: 'atlaslogix', label: 'AtlasLogix', type: 'Competitor' },
                { id: 'northwind', label: 'Northwind Logistics', type: 'Client' },
                { id: 'routeai', label: 'RouteAI', type: 'Partner' }
            ],
            links: [
                { source: 'atlaslogix', target: 'northwind', type: 'Competition', description: 'Chasing our automation footprint.' },
                { source: 'atlaslogix', target: 'routeai', type: 'Partnership', description: 'Joint go-to-market for SMB fleets.' }
            ]
        },
        pricing: {
            summary: 'Usage-based bundles introduced for telemetry features.',
            series: [
                { plan: 'Core', points: [
                    { label: 'Jan', value: 320 },
                    { label: 'Feb', value: 320 },
                    { label: 'Mar', value: 335 },
                    { label: 'Apr', value: 340 },
                    { label: 'May', value: 340 }
                ] },
                { plan: 'Scale', points: [
                    { label: 'Jan', value: 520 },
                    { label: 'Feb', value: 530 },
                    { label: 'Mar', value: 540 },
                    { label: 'Apr', value: 555 },
                    { label: 'May', value: 560 }
                ] }
            ],
            table: [
                { plan: 'Core', price: '$340/mo', positioning: 'Undercuts our base price', movement: '+6% QoQ' },
                { plan: 'Scale', price: '$560/mo', positioning: 'Matches Standard tier', movement: '+8% QoQ' }
            ],
            alerts: [
                { label: 'Telemetry surcharge', status: 'Active' }
            ]
        },
        media: [
            { title: 'AtlasLogix introduces freight playbooks', source: 'Logistics Innovation', date: '2024-05-06', sentiment: 'Positive', summary: 'Adds packaged workflows for brokers.' }
        ],
        documents: [
            { title: 'AtlasLogix differentiation notes', type: 'Doc', updated: '2024-05-04', owner: 'Product Marketing' }
        ],
        swot: {
            strengths: ['Modular deployment approach', 'Fast-moving product experiments'],
            weaknesses: ['Limited enterprise references'],
            opportunities: ['SMB fleets digitizing quickly'],
            threats: ['Pricing pressure from incumbent ERPs']
        },
        tech: {
            highlights: 'BuiltWith scan shows heavy usage of Node.js services.',
            categories: [
                { label: 'Platform', items: ['Node.js', 'Next.js', 'Tailwind'] },
                { label: 'Analytics', items: ['Looker', 'Segment'] }
            ]
        }
    }
};

async function showCompetitorIntel() {
    showView('competitorIntel');
    setPageHeader('competitorIntel');

    const hubView = document.getElementById('competitorIntelView');
    if (!hubView) {
        return;
    }

    ensureCompetitorHubStyles();

    hubView.innerHTML = `
        <div class="cih-section text-sm text-slate-300 flex items-center gap-3">
            <i class="fas fa-circle-notch fa-spin text-sky-400"></i>
            <span>Формуємо робочий простір конкурентної аналітики...</span>
        </div>
    `;

    showLoading();

    try {
        const [companiesResponse, competitorsResponse, tasksResponse, activitiesResponse, contactsResponse] = await Promise.all([
            fetch('tables/companies').then(res => res.json()),
            fetch('tables/competitors').then(res => res.json()),
            fetch('tables/tasks').then(res => res.json()),
            fetch('tables/activities').then(res => res.json()),
            fetch('tables/contacts').then(res => res.json())
        ]);

        const companies = companiesResponse?.data || [];
        const competitorsRaw = competitorsResponse?.data || [];
        const tasks = tasksResponse?.data || [];
        const activities = activitiesResponse?.data || [];
        const contacts = contactsResponse?.data || [];

        const translateTierLabel = tier => {
            if (!tier) return '';
            const map = {
                'Tier 1': 'Рівень 1',
                'Tier 2': 'Рівень 2',
                'Tier 3': 'Рівень 3',
                'Tier 4': 'Рівень 4'
            };
            return map[tier] || tier;
        };

        const translateStatusLabel = status => {
            if (!status) return '';
            const map = {
                'Active Watch': 'Активний моніторинг',
                'Monitoring': 'Моніторинг',
                'Watchlist': 'Список спостереження',
                'Dormant': 'Призупинено',
                'Active': 'Активний',
                'Review': 'Перегляд'
            };
            return map[status] || status;
        };

        const translateRiskLabel = risk => {
            if (!risk) return '';
            const map = {
                'Critical': 'Критичний',
                'High': 'Високий',
                'Medium': 'Середній',
                'Low': 'Низький',
                'Standard': 'Стандартний'
            };
            return map[risk] || risk;
        };

        const tasksByCompetitor = new Map();
        const tasksByClient = new Map();

        tasks.forEach(task => {
            const related = task?.related_to;
            if (related) {
                if (!tasksByCompetitor.has(related)) {
                    tasksByCompetitor.set(related, []);
                }
                tasksByCompetitor.get(related).push(task);
            }
            const clientId = task?.related_to?.startsWith('company-') ? task.related_to : task?.company_id;
            if (clientId) {
                if (!tasksByClient.has(clientId)) {
                    tasksByClient.set(clientId, []);
                }
                tasksByClient.get(clientId).push(task);
            }
        });

        const intelActivities = activities.filter(activity => (
            activity?.category === 'Competitive Intelligence'
            || (activity.subject && activity.subject.toLowerCase().includes('competitor'))
            || (activity.description && activity.description.toLowerCase().includes('competitor'))
        ));

        const activitiesByCompetitor = new Map();
        intelActivities.forEach(activity => {
            const related = Array.isArray(activity.related_competitors) ? activity.related_competitors : [];
            related.forEach(id => {
                if (!activitiesByCompetitor.has(id)) {
                    activitiesByCompetitor.set(id, []);
                }
                activitiesByCompetitor.get(id).push(activity);
            });
        });

        const sortedCompetitors = competitorsRaw.slice().sort((a, b) => {
            const tierDiff = competitorHubTierRank(a.tier) - competitorHubTierRank(b.tier);
            if (tierDiff !== 0) {
                return tierDiff;
            }
            const dateA = competitorHubToDate(a.last_update || a.updated_at)?.getTime() || 0;
            const dateB = competitorHubToDate(b.last_update || b.updated_at)?.getTime() || 0;
            return dateB - dateA;
        });

        const competitorProfiles = sortedCompetitors.map(comp => {
            const enhancement = COMPETITOR_ENHANCEMENTS[comp.id] || {};
            const relatedTasks = tasksByCompetitor.get(comp.id) || [];
            const kanbanColumns = ['Backlog', 'In Progress', 'Review', 'Done'].map(column => ({
                name: column,
                tasks: relatedTasks
                    .filter(task => competitorHubResolveColumn(task.status) === column)
                    .map(task => ({
                        id: task.id,
                        title: task.title,
                        status: task.status,
                        priority: task.priority,
                        due_date: task.due_date,
                        assigned_to: task.assigned_to
                    }))
            }));

            const activeSignals = (activitiesByCompetitor.get(comp.id) || []).slice().sort((a, b) => {
                const dateA = competitorHubToDate(a.date || a.updated_at)?.getTime() || 0;
                const dateB = competitorHubToDate(b.date || b.updated_at)?.getTime() || 0;
                return dateB - dateA;
            });

            const linkedContacts = contacts.filter(contact => (contact.company_name || '').toLowerCase().includes((comp.name || '').toLowerCase()));

            return {
                ...comp,
                kanbanColumns,
                signals: activeSignals,
                enhancement,
                linkedContacts
            };
        });
        const clientsWithCoverage = companies.map(company => {
            const coverage = competitorProfiles.filter(comp => (comp.linked_clients || []).includes(company.name));
            const watchers = Array.from(new Set(coverage.flatMap(comp => (comp.enhancement?.contacts || []).slice(0, 2).map(c => c.name))));
            const tierValue = coverage.reduce((acc, comp) => Math.min(acc, competitorHubTierRank(comp.tier)), 3);
            const tierLabel = tierValue === 0 ? 'Фокус рівня 1' : tierValue === 1 ? 'Покриття рівня 2' : 'Моніторинг';
            const intelTasksForClient = tasksByClient.get(company.id) || [];
            const openTasks = intelTasksForClient.filter(task => !String(task.status || '').toLowerCase().includes('completed'));
            const earliestDue = openTasks.reduce((acc, task) => {
                const date = competitorHubToDate(task.due_date);
                if (!date) return acc;
                if (!acc || date < acc) return date;
                return acc;
            }, null);
            const activityHits = intelActivities.filter(activity => {
                const related = Array.isArray(activity.related_competitors) ? activity.related_competitors : [];
                return coverage.some(comp => related.includes(comp.id));
            });
            const riskLevel = coverage.length === 0 ? 'Low' : (openTasks.some(task => {
                const due = competitorHubToDate(task.due_date);
                return due && due.getTime() < Date.now();
            }) || coverage.length > 2) ? 'High' : coverage.length === 1 ? 'Medium' : 'Medium';

            return {
                id: company.id,
                name: company.name,
                industry: company.industry || '—',
                location: [company.city, company.state || company.country].filter(Boolean).join(', '),
                competitorCount: coverage.length,
                watchers,
                tierLabel,
                lastIntel: coverage.reduce((latest, comp) => {
                    const date = competitorHubToDate(comp.last_update || comp.updated_at);
                    if (!latest || (date && date > latest)) return date;
                    return latest;
                }, null),
                earliestDue,
                riskLevel,
                activitiesCount: activityHits.length,
                openTasks,
                coverageNames: coverage.map(comp => comp.name),
                tierValue,
                intelScore: Math.min(100, (coverage.length * 22) + (activityHits.length * 6) + (openTasks.length ? 12 : 0))
            };
        });

        const trackedClients = clientsWithCoverage.filter(client => client.competitorCount > 0);

        const recentIntelDate = competitorProfiles.reduce((latest, comp) => {
            const date = competitorHubToDate(comp.last_update || comp.updated_at);
            if (!latest || (date && date > latest)) return date;
            return latest;
        }, null);

        const avgDaysSinceUpdate = (() => {
            const dates = competitorProfiles
                .map(comp => competitorHubToDate(comp.last_update || comp.updated_at))
                .filter(Boolean);
            if (!dates.length) return '—';
            const avg = dates.reduce((sum, date) => sum + (Date.now() - date.getTime()), 0) / dates.length;
            const days = Math.round(avg / (1000 * 60 * 60 * 24));
            const dayWord = days === 1 ? 'день' : (days >= 2 && days <= 4 ? 'дні' : 'днів');
            return `${days} ${dayWord} у середньому`;
        })();

        const summaryMetrics = [
            {
                title: 'Відстежувані конкуренти',
                value: competitorProfiles.length,
                badge: `${competitorProfiles.filter(comp => competitorHubTierRank(comp.tier) === 0).length} рівень 1`,
                caption: recentIntelDate ? `Останнє оновлення ${competitorHubFormatRelative(recentIntelDate)}` : 'Оновлення відсутні',
                icon: 'fa-chess-knight'
            },
            {
                title: 'Клієнти з конкурентами',
                value: trackedClients.length,
                badge: `${trackedClients.reduce((sum, client) => sum + client.competitorCount, 0)} збігів`,
                caption: 'Пов’язані через поле «Конкуренти»',
                icon: 'fa-layer-group'
            },
            {
                title: 'Процеси конкурентної розвідки',
                value: tasks.filter(task => (task.category === 'Competitive Intelligence' || (task.tags || []).includes('competitor')) && !String(task.status || '').toLowerCase().includes('completed')).length,
                badge: `${intelActivities.length} сигналів`,
                caption: avgDaysSinceUpdate,
                icon: 'fa-clipboard-list'
            },
            {
                title: 'Згадки в медіа',
                value: competitorProfiles.reduce((sum, comp) => sum + (comp.enhancement.media?.length || 0), 0),
                badge: 'Сповіщення та сентимент',
                caption: 'По всіх відстежуваних конкурентів',
                icon: 'fa-bullhorn'
            }
        ];

        const summaryCardsHtml = summaryMetrics.map(metric => `
            <div class="cih-summary-card">
                <div class="flex items-start justify-between">
                    <div>
                        <p class="cih-summary-badge"><i class="fas ${metric.icon} mr-2"></i>${metric.title}</p>
                        <p class="mt-3 text-3xl font-semibold text-slate-50">${metric.value}</p>
                    </div>
                    <span class="cih-chip"><i class="fas fa-signal"></i>${metric.badge}</span>
                </div>
                <p class="mt-4 text-sm text-slate-300">${metric.caption}</p>
            </div>
        `).join('');
        const clientCardsHtml = trackedClients.map(client => `
            <div class="cih-card cih-client-card" data-client-name="${client.name.toLowerCase()}" data-client-risk="${client.riskLevel.toLowerCase()}" data-client-industry="${(client.industry || '').toLowerCase()}" data-intel-score="${client.intelScore}">
                <div class="flex items-start justify-between gap-4">
                    <div>
                        <h4>${client.name}</h4>
                        <p class="text-xs uppercase tracking-wide text-slate-400 mt-1">${client.industry} · ${client.location || 'Локацію не вказано'}</p>
                    </div>
                    <span class="cih-tag"><i class="fas fa-shield-alt"></i>${client.tierLabel}</span>
                </div>
                <div class="mt-4 grid gap-3">
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-slate-400">Пов’язані конкуренти</span>
                        <span class="font-medium text-slate-100">${client.competitorCount}</span>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-slate-400">Відповідальні за аналітику</span>
                        <span class="text-slate-100">${client.watchers.slice(0, 3).join(', ') || '—'}</span>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-slate-400">Остання аналітика</span>
                        <span class="text-slate-100">${client.lastIntel ? competitorHubFormatRelative(client.lastIntel) : '—'}</span>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                        <span class="text-slate-400">Наступний дедлайн</span>
                        <span class="text-slate-100">${client.earliestDue ? competitorHubFormatDateShort(client.earliestDue) : '—'}</span>
                    </div>
                </div>
                <div class="mt-4">
                    <div class="flex items-center justify-between text-xs text-slate-300 mb-2">
                        <span>Інтенсивність покриття</span>
                        <span>${client.intelScore}</span>
                    </div>
                    <div class="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div class="h-full bg-sky-500" style="width: ${client.intelScore}%;"></div>
                    </div>
                </div>
                <div class="mt-4 flex items-center justify-between">
                    <div class="flex flex-wrap gap-2">
                        ${client.coverageNames.map(name => `<span class="cih-swatch"><span class="cih-dot" style="background: rgba(56,189,248,0.6);"></span>${name}</span>`).join('')}
                    </div>
                    <span class="cih-swatch ${competitorHubRiskBadge(client.riskLevel)}"><span class="cih-dot" style="background: currentColor;"></span>Ризик: ${translateRiskLabel(client.riskLevel)}</span>
                </div>
            </div>
        `).join('');

        const competitorCardsHtml = competitorProfiles.map(comp => {
            const statusClass = (() => {
                const normalized = (comp.status || '').toLowerCase();
                if (normalized.includes('active')) return 'cih-status-active';
                if (normalized.includes('monitor')) return 'cih-status-monitor';
                return 'cih-status-watch';
            })();
            return `
                <div class="cih-card cih-competitor-card" data-competitor-id="${comp.id}">
                    <div class="flex items-start justify-between gap-3">
                        <div>
                            <div class="flex items-center gap-2">
                                <span class="cih-flag ${statusClass}"></span>
                                <p class="uppercase tracking-wide text-xs text-slate-400">${translateTierLabel(comp.tier) || 'Рівень 3'}</p>
                            </div>
                            <h4 class="mt-2">${comp.name}</h4>
                            <p class="text-sm text-slate-400 mt-1">${comp.industry || 'Індустрію не вказано'} · ${comp.headquarters || '—'}</p>
                        </div>
                        <div class="flex flex-col gap-2 items-end">
                            <button class="cih-outline-button" data-compare-toggle="${comp.id}"><i class="fas fa-balance-scale"></i> Порівняти</button>
                            <button class="cih-primary-button" data-open-workspace="${comp.id}"><i class="fas fa-layer-group"></i> Робоче місце</button>
                        </div>
                    </div>
                    <div class="grid gap-3 text-sm">
                        <div class="flex items-center justify-between text-slate-300">
                            <span>Основні ринки</span>
                            <span class="text-right text-slate-100">${(comp.primary_markets || []).slice(0, 2).join(', ') || '—'}</span>
                        </div>
                        <div class="flex items-center justify-between text-slate-300">
                            <span>Ключові напрями</span>
                            <span class="text-right text-slate-100">${(comp.focus_areas || []).slice(0, 3).join(', ') || '—'}</span>
                        </div>
                        <div class="flex items-center justify-between text-slate-300">
                            <span>Відповідальний аналітик</span>
                            <span class="text-right text-slate-100">${comp.intel_owner || 'Не призначено'}</span>
                        </div>
                        <div class="flex items-center justify-between text-slate-300">
                            <span>Останній крок</span>
                            <span class="text-right text-slate-100">${competitorHubFormatRelative(comp.last_update || comp.updated_at)}</span>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-2">
                        ${(comp.linked_clients || []).map(client => `<span class="cih-chip"><i class="fas fa-building"></i>${client}</span>`).join('')}
                    </div>
                    <div class="flex items-center justify-between text-xs text-slate-400">
                        <span>${comp.enhancement?.pricing?.summary || comp.latest_move || 'Останні кроки не зафіксовані.'}</span>
                        ${comp.note_file ? `<a class="text-sky-300 hover:text-sky-200" href="vault/Competitors/${encodeURIComponent(comp.note_file)}" target="_blank"><i class="fas fa-file-lines mr-2"></i>Батлкард</a>` : ''}
                    </div>
                </div>
            `;
        }).join('');

        const sentimentClass = sentiment => {
            const normalized = (sentiment || '').toLowerCase();
            if (normalized.includes('positive')) return 'cih-sentiment-positive';
            if (normalized.includes('negative')) return 'cih-sentiment-negative';
            return 'cih-sentiment-neutral';
        };

        const renderRelationshipPreview = relationships => {
            const nodeCount = relationships?.nodes?.length || 0;
            const linkCount = relationships?.links?.length || 0;
            return `
                <div class="grid gap-3 md:grid-cols-2">
                    <div class="cih-card">
                        <p class="text-xs uppercase tracking-wide text-slate-400">Сутності</p>
                        <p class="text-2xl font-semibold text-slate-100">${nodeCount}</p>
                        <p class="text-sm text-slate-300 mt-2">Компанії, партнери та продукти на мапі.</p>
                    </div>
                    <div class="cih-card">
                        <p class="text-xs uppercase tracking-wide text-slate-400">Зв’язки</p>
                        <p class="text-2xl font-semibold text-slate-100">${linkCount}</p>
                        <p class="text-sm text-slate-300 mt-2">Конкурентні, партнерські та власницькі зв’язки.</p>
                    </div>
                </div>
            `;
        };

        const renderRelationshipExpanded = relationships => `
            <div class="cih-rel-diagram">
                <div>
                    <h4 class="text-slate-200 font-semibold mb-3">Ключові вузли</h4>
                    <div class="cih-rel-nodes">
                        ${(relationships?.nodes || []).map(node => `
                            <div class="cih-rel-node">
                                <span class="text-slate-200 font-medium">${node.label}</span>
                                <span class="text-xs uppercase tracking-wide text-slate-400">${node.type}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div>
                    <h4 class="text-slate-200 font-semibold mb-3">Зв’язки</h4>
                    <div class="grid gap-2">
                        ${(relationships?.links || []).map(link => `
                            <div class="cih-rel-link">
                                <span class="cih-chip"><i class="fas fa-arrows-alt-h"></i>${link.type}</span>
                                <p class="text-sm text-slate-200">${link.description}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        const renderContactsPreview = contactsList => `
            <div class="grid gap-2">
                <div class="cih-card">
                    <p class="text-xs uppercase tracking-wide text-slate-400">Усього контактів</p>
                    <p class="text-2xl font-semibold text-slate-100">${contactsList?.length || 0}</p>
                    <p class="text-xs text-slate-400 mt-2">Синхронізовано в робочу область аналітики</p>
                </div>
                <div class="cih-card">
                    <p class="text-xs uppercase tracking-wide text-slate-400">Ключові зв’язки</p>
                    <p class="text-sm text-slate-100 mt-2">${(contactsList || []).slice(0, 3).map(contact => contact.name).join(', ') || 'Іменовані контакти відсутні'}</p>
                </div>
            </div>
        `;

        const renderContactsExpanded = contactsList => `
            <div class="overflow-x-auto">
                <table class="cih-mini-table">
                    <thead>
                        <tr>
                            <th>Ім’я</th>
                            <th>Посада</th>
                            <th>Сегмент</th>
                            <th>Контакти</th>
                            <th>Нотатки</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(contactsList || []).map(contact => `
                            <tr>
                                <td>${contact.name}</td>
                                <td>${contact.title}</td>
                                <td>${contact.segment}</td>
                                <td>
                                    <div class="flex flex-col">
                                        <span>${contact.email}</span>
                                        <span>${contact.phone}</span>
                                        <span>${contact.linkedin}</span>
                                    </div>
                                </td>
                                <td>${contact.notes || '—'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        const renderMediaPreview = mediaList => {
            const latest = (mediaList || [])[0];
            if (!latest) {
                return '<div class="cih-card"><p class="text-sm text-slate-300">Немає нещодавніх згадок у медіа.</p></div>';
            }
            return `
                <div class="cih-card">
                    <p class="text-xs uppercase tracking-wide text-slate-400">Остання згадка</p>
                    <p class="text-lg text-slate-100 mt-2">${latest.title}</p>
                    <p class="text-sm text-slate-400">${latest.source} · ${competitorHubFormatDateShort(latest.date)}</p>
                    <p class="text-sm ${sentimentClass(latest.sentiment)} mt-2">${latest.sentiment}</p>
                </div>
            `;
        };

        const renderMediaExpanded = mediaList => `
            <div class="grid gap-3">
                ${(mediaList || []).map(item => `
                    <div class="cih-card">
                        <div class="flex items-start justify-between">
                            <div>
                                <p class="text-slate-100 font-medium">${item.title}</p>
                                <p class="text-xs text-slate-400 mt-1">${item.source} · ${competitorHubFormatDateShort(item.date)}</p>
                            </div>
                            <span class="cih-chip ${sentimentClass(item.sentiment)}">${item.sentiment}</span>
                        </div>
                        <p class="text-sm text-slate-300 mt-3">${item.summary}</p>
                    </div>
                `).join('')}
            </div>
        `;

        const renderDocumentsExpanded = documentsList => `
            <div class="grid gap-3">
                ${(documentsList || []).map(doc => `
                    <div class="cih-card">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-slate-100 font-medium">${doc.title}</p>
                                <p class="text-xs text-slate-400">${doc.type} · ${doc.owner}</p>
                            </div>
                            <span class="text-xs text-slate-400">${competitorHubFormatDateShort(doc.updated)}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        const renderSwotExpanded = swot => {
            const renderList = (title, items, accent) => `
                <div class="cih-card" style="border-left: 3px solid ${accent};">
                    <h4 class="text-slate-200 font-semibold mb-3">${title}</h4>
                    <ul class="list-disc list-inside space-y-2 text-sm text-slate-300">
                        ${(items || []).map(item => `<li>${item}</li>`).join('') || '<li>Записів немає</li>'}
                    </ul>
                </div>
            `;
            return `
                <div class="cih-swot-grid md:grid-cols-2">
                    ${renderList('Сильні сторони', swot?.strengths, '#22c55e')}
                    ${renderList('Слабкі сторони', swot?.weaknesses, '#ef4444')}
                    ${renderList('Можливості', swot?.opportunities, '#facc15')}
                    ${renderList('Загрози', swot?.threats, '#6366f1')}
                </div>
            `;
        };

        const renderTechExpanded = tech => `
            <div class="grid gap-3">
                ${(tech?.categories || []).map(category => `
                    <div class="cih-card">
                        <h4 class="text-slate-200 font-semibold mb-2">${category.label}</h4>
                        <div class="flex flex-wrap gap-2">
                            ${category.items.map(item => `<span class="cih-tech-chip"><i class="fas fa-circle"></i>${item}</span>`).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        const priceCharts = new Map();

        const renderPriceExpanded = (pricing, competitorId, moduleInstanceId) => {
            const chartKey = moduleInstanceId || competitorId;
            const canvasId = `cihPriceChart-${chartKey}`;
            const tableRows = (pricing?.table || []).map(row => `
                <tr>
                    <td>${row.plan}</td>
                    <td>${row.price}</td>
                    <td>${row.positioning}</td>
                    <td>${row.movement}</td>
                </tr>
            `).join('');

            const alerts = (pricing?.alerts || []).map(alert => `<span class="cih-chip"><i class="fas fa-bell"></i>${alert.label} (${alert.status})</span>`).join('');

            setTimeout(() => {
                const ctx = document.getElementById(canvasId);
                if (!ctx || !pricing?.series?.length || typeof Chart === 'undefined') {
                    return;
                }
                if (priceCharts.has(chartKey)) {
                    priceCharts.get(chartKey).destroy();
                }
                const labels = pricing.series[0].points.map(point => point.label);
                const datasets = pricing.series.map((series, index) => ({
                    label: series.plan,
                    data: series.points.map(point => point.value),
                    borderColor: index === 0 ? '#38bdf8' : '#a855f7',
                    backgroundColor: 'transparent',
                    tension: 0.35
                }));
                const chart = new Chart(ctx, {
                    type: 'line',
                    data: { labels, datasets },
                    options: {
                        plugins: { legend: { labels: { color: '#cbd5f5' } } },
                        scales: {
                            x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.2)' } },
                            y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.15)' } }
                        }
                    }
                });
                priceCharts.set(chartKey, chart);
            }, 50);

            return `
                <div class="grid gap-4 md:grid-cols-2">
                    <div class="cih-card">
                        <canvas id="${canvasId}" height="180"></canvas>
                    </div>
                    <div class="cih-card">
                        <table class="cih-mini-table">
                            <thead>
                                <tr>
                                    <th>Тариф</th>
                                    <th>Ціна</th>
                                    <th>Позиціонування</th>
                                    <th>Динаміка</th>
                                </tr>
                            </thead>
                            <tbody>${tableRows}</tbody>
                        </table>
                        <div class="flex flex-wrap gap-2 mt-4">${alerts}</div>
                    </div>
                </div>
            `;
        };

        const computeActiveTasks = competitor => (competitor.kanbanColumns || []).reduce((total, column) => total + column.tasks.length, 0);
        const computeSignalsWithinDays = (competitor, days) => {
            const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
            return (competitor.signals || []).filter(signal => {
                const date = competitorHubToDate(signal.date || signal.updated_at);
                return date ? date.getTime() >= cutoff : false;
            }).length;
        };

        const moduleTemplateLibrary = [
            {
                category: 'Швидкі картки',
                emoji: '🎯',
                templates: [
                    {
                        id: 'info-card',
                        type: 'custom',
                        title: 'Картка інформації',
                        description: 'Основні дані, рівень і останній крок конкурента.',
                        defaultSize: 'small',
                        defaultStatus: 'expanded',
                        permissions: ['view', 'edit'],
                        build: competitor => ({
                            name: competitor.name,
                            tier: translateTierLabel(competitor.tier) || 'Рівень 3',
                            status: translateStatusLabel(competitor.status) || 'Моніторинг',
                            headquarters: competitor.headquarters || '—',
                            owner: competitor.intel_owner || 'Не призначено',
                            latestMove: competitor.latest_move || competitor.enhancement?.pricing?.summary || 'Останні кроки не зафіксовані.',
                            markets: (competitor.primary_markets || []).slice(0, 3),
                            focus: (competitor.focus_areas || []).slice(0, 3)
                        }),
                        render: module => {
                            const data = module.data || {};
                            return `
                                <div class="grid gap-2">
                                    <div class="flex items-center justify-between">
                                        <span class="cih-module-tag"><i class="fas fa-industry"></i>${data.tier}</span>
                                        <span class="text-xs text-slate-400">${data.headquarters}</span>
                                    </div>
                                    <div>
                                        <p class="text-lg font-semibold text-slate-100">${data.name}</p>
                                        <p class="text-sm text-slate-400">${data.status}</p>
                                    </div>
                                    <p class="text-sm text-slate-300">${data.latestMove}</p>
                                    <div class="flex flex-wrap gap-2 text-xs text-slate-400">
                                        ${data.markets.map(market => `<span class="cih-chip"><i class="fas fa-globe"></i>${market}</span>`).join('') || '<span>Ринки не вказані</span>'}
                                    </div>
                                    <div class="flex items-center justify-between text-xs text-slate-400">
                                        <span><i class="fas fa-user-shield mr-1"></i>${data.owner}</span>
                                        <span>${(data.focus || []).join(', ') || 'Напрями не задані'}</span>
                                    </div>
                                </div>
                            `;
                        }
                    },
                    {
                        id: 'kpi-card',
                        type: 'custom',
                        title: 'Картка KPI',
                        description: 'Ключові показники активності на основі задач, сигналів і контактів.',
                        defaultSize: 'small',
                        defaultStatus: 'expanded',
                        permissions: ['view'],
                        build: competitor => ({
                            metrics: [
                                { label: 'Активні задачі', value: computeActiveTasks(competitor) },
                                { label: 'Сигнали (30 днів)', value: computeSignalsWithinDays(competitor, 30) },
                                { label: 'Пов’язані контакти', value: (competitor.linkedContacts || []).length || (competitor.enhancement?.contacts?.length || 0) },
                                { label: 'Клієнти зі списку спостереження', value: (competitor.linked_clients || []).length }
                            ]
                        }),
                        render: module => {
                            const metrics = module.data?.metrics || [];
                            return `
                                <div class="grid grid-cols-2 gap-2">
                                    ${metrics.map(metric => `
                                        <div class="cih-card">
                                            <p class="text-xs uppercase tracking-wide text-slate-400">${metric.label}</p>
                                            <p class="text-xl font-semibold text-slate-100">${metric.value ?? '—'}</p>
                                        </div>
                                    `).join('')}
                                </div>
                            `;
                        }
                    },
                    {
                        id: 'status-card',
                        type: 'custom',
                        title: 'Картка статусу',
                        description: 'Статус моніторингу, відповідальний і нагадування про ритм.',
                        defaultSize: 'small',
                        permissions: ['view', 'edit'],
                        build: competitor => {
                            const dueDates = (competitor.kanbanColumns || []).flatMap(column => column.tasks.map(task => competitorHubToDate(task.due_date))).filter(Boolean).sort((a, b) => a.getTime() - b.getTime());
                            const nextDue = dueDates[0];
                            const lastSignal = (competitor.signals || [])[0];
                            return {
                                status: translateStatusLabel(competitor.status) || 'Моніторинг',
                                owner: competitor.intel_owner || 'Не призначено',
                                lastUpdate: competitor.last_update || competitor.updated_at,
                                nextDue,
                                risk: (competitor.enhancement?.pricing?.alerts || []).some(alert => (alert.status || '').toLowerCase() === 'active') ? 'High' : 'Standard',
                                lastSignal: lastSignal ? {
                                    subject: lastSignal.subject || lastSignal.title || 'Запис оновлено',
                                    date: lastSignal.date || lastSignal.updated_at
                                } : null
                            };
                        },
                        render: module => {
                            const data = module.data || {};
                            return `
                                <div class="grid gap-2">
                                    <div class="flex items-center justify-between">
                                        <span class="cih-module-tag"><i class="fas fa-signal"></i>${data.status}</span>
                                        <span class="cih-swatch ${competitorHubRiskBadge(data.risk)}"><span class="cih-dot" style="background: currentColor;"></span>Ризик: ${translateRiskLabel(data.risk)}</span>
                                    </div>
                                    <div class="flex items-center justify-between text-xs text-slate-400">
                                        <span><i class="fas fa-user-check mr-1"></i>${data.owner}</span>
                                        <span>Останнє оновлення: ${competitorHubFormatRelative(data.lastUpdate)}</span>
                                    </div>
                                    <div class="text-sm text-slate-300">
                                        Наступний дедлайн: ${data.nextDue ? competitorHubFormatDateShort(data.nextDue) : '—'}
                                    </div>
                                    ${data.lastSignal ? `<div class="text-xs text-slate-400">Останній сигнал: <span class="text-slate-200">${data.lastSignal.subject}</span> · ${competitorHubFormatRelative(data.lastSignal.date)}</div>` : ''}
                                </div>
                            `;
                        }
                    },
                    {
                        id: 'contact-card',
                        type: 'contacts',
                        title: 'Картка контактів',
                        description: 'Три ключові контакти, пов’язані з конкурентом.',
                        defaultSize: 'small',
                        permissions: ['view'],
                        build: competitor => ({
                            contacts: (competitor.linkedContacts?.length ? competitor.linkedContacts : competitor.enhancement?.contacts || []).slice(0, 3)
                        }),
                        render: module => {
                            const contacts = module.data?.contacts || [];
                            if (!contacts.length) {
                                return '<p class="text-sm text-slate-400">Пов’язаних контактів немає.</p>';
                            }
                            return `
                                <div class="grid gap-2">
                                    ${contacts.map(contact => `
                                        <div class="cih-card">
                                            <p class="text-sm text-slate-100 font-medium">${contact.name}</p>
                                            <p class="text-xs text-slate-400">${contact.title || contact.segment || ''}</p>
                                            <p class="text-xs text-slate-500">${contact.email || ''}</p>
                                        </div>
                                    `).join('')}
                                </div>
                            `;
                        }
                    }
                ]
            },
            {
                category: 'Аналітичні модулі',
                emoji: '📊',
                templates: [
                    {
                        id: 'price-timeline',
                        type: 'prices',
                        title: 'Динаміка цін',
                        description: 'Історія цін із бенчмарками за тарифами.',
                        defaultSize: 'large',
                        permissions: ['view'],
                        build: competitor => ({ pricing: competitor.enhancement?.pricing }),
                        render: (module, competitor) => renderPriceExpanded(module.data?.pricing, competitor.id, module.id)
                    },
                    {
                        id: 'media-buzz',
                        type: 'media',
                        title: 'Медійний шум',
                        description: 'Останні згадки в медіа та сигнали сентименту.',
                        defaultSize: 'medium',
                        permissions: ['view'],
                        build: competitor => ({ media: competitor.enhancement?.media || competitor.signals?.slice(0, 5) || [] }),
                        render: module => renderMediaExpanded(module.data?.media)
                    },
                    {
                        id: 'tech-stack',
                        type: 'custom',
                        title: 'Технологічний стек',
                        description: 'Виявлені інструменти й платформи.',
                        defaultSize: 'medium',
                        permissions: ['view', 'edit'],
                        build: competitor => ({ tech: competitor.enhancement?.tech }),
                        render: module => renderTechExpanded(module.data?.tech)
                    },
                    {
                        id: 'swot-matrix',
                        type: 'swot',
                        title: 'SWOT Matrix',
                        description: 'Strengths, weaknesses, opportunities and threats snapshot.',
                        defaultSize: 'large',
                        permissions: ['view', 'edit'],
                        build: competitor => ({ swot: competitor.enhancement?.swot }),
                        render: module => renderSwotExpanded(module.data?.swot)
                    }
                ]
            },
            {
                category: 'Робочі модулі',
                emoji: '📋',
                templates: [
                    {
                        id: 'task-kanban',
                        type: 'kanban',
                        title: 'Канбан задач',
                        description: 'Колонки з задачами підтримки та досліджень.',
                        defaultSize: 'large',
                        permissions: ['view', 'edit', 'delete'],
                        build: competitor => ({ columns: competitor.kanbanColumns || [] }),
                        render: module => {
                            const columns = module.data?.columns || [];
                            if (!columns.length) {
                                return '<p class="text-sm text-slate-400">Задач ще не зафіксовано.</p>';
                            }
                            return `
                                <div class="grid gap-3 md:grid-cols-${Math.min(columns.length, 4)}">
                                    ${columns.map(column => `
                                        <div class="cih-kanban-column">
                                            <div class="flex items-center justify-between">
                                                <span class="text-slate-200 font-medium">${column.name}</span>
                                                <span class="text-xs text-slate-400">${column.tasks.length}</span>
                                            </div>
                                            ${column.tasks.map(task => `
                                                <div class="cih-kanban-card">
                                                    <div class="flex items-start justify-between">
                                                        <p class="text-sm text-slate-100 font-medium">${task.title}</p>
                                                <span class="cih-chip">${task.priority || '—'}</span>
                                                    </div>
                                                    <div class="flex items-center justify-between text-xs text-slate-400">
                                                        <span><i class="far fa-calendar mr-1"></i>${competitorHubFormatDateShort(task.due_date)}</span>
                                                        <span><i class="far fa-user mr-1"></i>${task.assigned_to || 'Unassigned'}</span>
                                                    </div>
                                                </div>
                                            `).join('') || '<p class="text-xs text-slate-400">Записаних задач немає.</p>'}
                                        </div>
                                    `).join('')}
                                </div>
                            `;
                        }
                    },
                    {
                        id: 'document-vault',
                        type: 'docs',
                        title: 'Сховище документів',
                        description: 'Репозиторій батлкарт, брифів та матеріалів.',
                        defaultSize: 'medium',
                        permissions: ['view', 'edit', 'delete'],
                        build: competitor => ({ documents: competitor.enhancement?.documents || [] }),
                        render: module => renderDocumentsExpanded(module.data?.documents)
                    },
                    {
                        id: 'contact-crm',
                        type: 'contacts',
                        title: 'Контактна база',
                        description: 'Повний перелік контактів, синхронізований із CRM.',
                        defaultSize: 'medium',
                        permissions: ['view', 'edit'],
                        build: competitor => ({ contacts: competitor.enhancement?.contacts || competitor.linkedContacts || [] }),
                        render: module => renderContactsExpanded(module.data?.contacts)
                    },
                    {
                        id: 'notes-module',
                        type: 'custom',
                        title: 'Нотатки',
                        description: 'Вільні нотатки та спостереження для аналітиків.',
                        defaultSize: 'medium',
                        permissions: ['view', 'edit'],
                        build: competitor => ({
                            notes: (competitor.signals || []).slice(0, 5).map(signal => ({
                                title: signal.subject || signal.title || 'Спостереження',
                                summary: signal.description || signal.summary || '—',
                                date: signal.date || signal.updated_at
                            }))
                        }),
                        render: module => {
                            const notes = module.data?.notes || [];
                            if (!notes.length) {
                                return '<p class="text-sm text-slate-400">Аналітичні нотатки відсутні.</p>';
                            }
                            return `
                                <div class="grid gap-2">
                                    ${notes.map(note => `
                                        <div class="cih-card">
                                            <p class="text-sm text-slate-100 font-medium">${note.title}</p>
                                            <p class="text-xs text-slate-400 mb-1">${competitorHubFormatRelative(note.date)}</p>
                                            <p class="text-sm text-slate-300">${note.summary}</p>
                                        </div>
                                    `).join('')}
                                </div>
                            `;
                        }
                    }
                ]
            },
            {
                category: 'Модулі зв’язків',
                emoji: '🔗',
                templates: [
                    {
                        id: 'network-map',
                        type: 'network',
                        title: 'Карта мережі',
                        description: 'Конкурентні, партнерські та продуктові зв’язки.',
                        defaultSize: 'large',
                        permissions: ['view'],
                        build: competitor => ({ relationships: competitor.enhancement?.relationships }),
                        render: module => renderRelationshipExpanded(module.data?.relationships)
                    },
                    {
                        id: 'comparison-table',
                        type: 'custom',
                        title: 'Таблиця порівняння',
                        description: 'Порівняння конкурента із середніми показниками робочої області.',
                        defaultSize: 'medium',
                        permissions: ['view'],
                        build: (competitor, context) => {
                            const peers = context?.competitorProfiles || [];
                            const total = peers.length || 1;
                            const avgTasks = peers.reduce((acc, item) => acc + computeActiveTasks(item), 0) / total;
                            const avgSignals = peers.reduce((acc, item) => acc + (item.signals?.length || 0), 0) / total;
                            const avgClients = peers.reduce((acc, item) => acc + (item.linked_clients?.length || 0), 0) / total;
                            return {
                                competitor: {
                                    name: competitor.name,
                                    tier: translateTierLabel(competitor.tier) || 'Рівень 3',
                                    tasks: computeActiveTasks(competitor),
                                    signals: competitor.signals?.length || 0,
                                    clients: competitor.linked_clients?.length || 0
                                },
                                averages: {
                                    tasks: Math.round(avgTasks),
                                    signals: Math.round(avgSignals),
                                    clients: Math.round(avgClients)
                                }
                            };
                        },
                        render: module => {
                            const data = module.data || {};
                            const competitorRow = data.competitor || {};
                            const averages = data.averages || {};
                            return `
                                <div class="cih-card">
                                    <table class="cih-mini-table">
                                        <thead>
                                            <tr>
                                                <th>Показник</th>
                                                <th>${competitorRow.name || 'Конкурент'}</th>
                                                <th>Середнє по workspace</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                            <tr><td>Рівень</td><td>${competitorRow.tier}</td><td>—</td></tr>
                                            <tr><td>Активні задачі</td><td>${competitorRow.tasks}</td><td>${averages.tasks ?? '—'}</td></tr>
                                            <tr><td>Зафіксовані сигнали</td><td>${competitorRow.signals}</td><td>${averages.signals ?? '—'}</td></tr>
                                            <tr><td>Пов’язані клієнти</td><td>${competitorRow.clients}</td><td>${averages.clients ?? '—'}</td></tr>
                                        </tbody>
                                    </table>
                                </div>
                            `;
                        }
                    },
                    {
                        id: 'event-timeline',
                        type: 'custom',
                        title: 'Хронологія',
                        description: 'Послідовність подій конкурентної розвідки.',
                        defaultSize: 'medium',
                        permissions: ['view'],
                        build: competitor => ({
                            events: (competitor.signals || []).map(signal => ({
                                title: signal.subject || signal.title || 'Сигнал зафіксовано',
                                date: signal.date || signal.updated_at,
                                summary: signal.description || signal.summary || '—'
                            })).sort((a, b) => {
                                const dateA = competitorHubToDate(b.date)?.getTime() || 0;
                                const dateB = competitorHubToDate(a.date)?.getTime() || 0;
                                return dateA - dateB;
                            })
                        }),
                        render: module => {
                            const events = module.data?.events || [];
                            if (!events.length) {
                                return '<p class="text-sm text-slate-400">Подій у хронології немає.</p>';
                            }
                            return `
                                <div class="grid gap-2">
                                    ${events.map(event => `
                                        <div class="cih-card">
                                            <p class="text-sm text-slate-100 font-medium">${event.title}</p>
                                            <p class="text-xs text-slate-400">${competitorHubFormatDateShort(event.date)}</p>
                                            <p class="text-sm text-slate-300 mt-1">${event.summary}</p>
                                        </div>
                                    `).join('')}
                                </div>
                            `;
                        }
                    }
                ]
            }
        ];

        const templateIndex = new Map();
        moduleTemplateLibrary.forEach(category => {
            category.templates.forEach(template => {
                templateIndex.set(template.id, template);
            });
        });

        let workspaceModuleCounter = 0;

        const instantiateModule = (template, competitor, context, overrides = {}) => {
            if (!template || !competitor) {
                return null;
            }
            workspaceModuleCounter += 1;
            return {
                id: `${template.id}-${competitor.id}-${workspaceModuleCounter}`,
                templateId: template.id,
                type: template.type,
                title: template.title,
                status: overrides.status || template.defaultStatus || 'expanded',
                data: template.build ? template.build(competitor, context) : {},
                position: overrides.position || { x: overrides.x ?? 0, y: overrides.y ?? 0 },
                size: overrides.size || template.defaultSize || 'medium',
                permissions: Array.isArray(overrides.permissions) ? overrides.permissions : (template.permissions || ['view', 'edit', 'delete'])
            };
        };

        const defaultModuleTemplateOrder = ['info-card', 'kpi-card', 'status-card', 'contact-card', 'task-kanban', 'price-timeline', 'media-buzz', 'swot-matrix'];

        const createDefaultModules = (competitor, context) => defaultModuleTemplateOrder
            .map((templateId, index) => {
                const template = templateIndex.get(templateId);
                return instantiateModule(template, competitor, context, {
                    position: { x: index % 2, y: Math.floor(index / 2) }
                });
            })
            .filter(Boolean);

        hubView.innerHTML = `
            <div class="cih-root">
                <div class="cih-grid cih-grid-cols-4">
                    ${summaryCardsHtml}
                </div>
                <div class="cih-section mt-8">
                    <div class="cih-section-header">
                        <h3 class="cih-section-title"><i class="fas fa-building"></i>Огляд портфеля клієнтів</h3>
                        <div class="flex flex-wrap gap-3">
                            <div class="relative">
                                <i class="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"></i>
                                <input id="cihClientSearch" type="search" placeholder="Пошук клієнтів" class="bg-slate-900/70 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500">
                            </div>
                            <select id="cihClientFilter" class="bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500">
                                <option value="all">Усе покриття</option>
                                <option value="high">Високий ризик</option>
                                <option value="medium">Середній ризик</option>
                                <option value="low">Низький ризик</option>
                            </select>
                            <select id="cihClientSort" class="bg-slate-900/70 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500">
                                <option value="recent">Сортування: остання аналітика</option>
                                <option value="competitors">Сортування: кількість конкурентів</option>
                                <option value="score">Сортування: оцінка покриття</option>
                            </select>
                        </div>
                    </div>
                    <div id="cihClientCards" class="cih-grid md:cih-grid-cols-2 xl:cih-grid-cols-3">
                        ${clientCardsHtml || '<p class="text-slate-400">Прив’яжіть конкурентів до клієнтів, щоб заповнити цей блок.</p>'}
                    </div>
                </div>

                <div class="cih-section mt-8">
                    <div class="cih-section-header">
                        <h3 class="cih-section-title"><i class="fas fa-chess"></i>Портфель конкурентів</h3>
                        <div class="cih-compare-panel" id="cihComparePanel">
                            <h4 class="text-slate-200">Панель порівняння</h4>
                            <p class="text-sm text-slate-400">Оберіть конкурентів, щоб порівняти рівень, статус, ціни та фокус спостереження.</p>
                        </div>
                    </div>
                    <div class="cih-grid md:cih-grid-cols-2 xl:cih-grid-cols-3" id="cihCompetitorCards">
                        ${competitorCardsHtml}
                    </div>
                </div>

                <div class="cih-section mt-8" id="cihWorkspaceSection">
                    <div class="cih-section-header">
                        <h3 class="cih-section-title"><i class="fas fa-cubes"></i>Модульна робоча станція аналітики</h3>
                        <div class="cih-workspace-toolbar">
                            <button class="cih-outline-button" data-toggle-split-view="false"><i class="fas fa-columns"></i> Розділений режим: вимкнено</button>
                            <span class="text-xs text-slate-400 flex items-center gap-2"><i class="fas fa-keyboard"></i>Швидке перемикання: Ctrl+Tab</span>
                        </div>
                    </div>
                    <div class="cih-workspace-shell">
                        <div class="cih-workspace-panel">
                            <div class="cih-tab-bar" id="cihWorkspaceTabs"></div>
                            <div class="cih-split-selector" id="cihSplitSelector"></div>
                            <div class="cih-workspace-canvas" id="cihWorkspaceCanvas" data-split="false"></div>
                        </div>
                        <div class="cih-workspace-panel">
                            <div class="cih-module-library" id="cihModuleLibrary"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        const clientSearchInput = document.getElementById('cihClientSearch');
        const clientFilterSelect = document.getElementById('cihClientFilter');
        const clientSortSelect = document.getElementById('cihClientSort');
        const clientCardsContainer = document.getElementById('cihClientCards');

        const applyClientFilters = () => {
            const searchValue = clientSearchInput.value.trim().toLowerCase();
            const riskFilter = clientFilterSelect.value;
            const sortValue = clientSortSelect.value;

            let cards = trackedClients.slice();

            if (searchValue) {
                cards = cards.filter(client => client.name.toLowerCase().includes(searchValue) || (client.industry || '').toLowerCase().includes(searchValue));
            }

            if (riskFilter !== 'all') {
                cards = cards.filter(client => client.riskLevel.toLowerCase() === riskFilter);
            }

            if (sortValue === 'competitors') {
                cards.sort((a, b) => b.competitorCount - a.competitorCount);
            } else if (sortValue === 'score') {
                cards.sort((a, b) => b.intelScore - a.intelScore);
            } else {
                cards.sort((a, b) => {
                    const dateA = a.lastIntel ? a.lastIntel.getTime() : 0;
                    const dateB = b.lastIntel ? b.lastIntel.getTime() : 0;
                    return dateB - dateA;
                });
            }

            clientCardsContainer.innerHTML = cards.length ? cards.map(client => `
                <div class="cih-card cih-client-card">
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <h4>${client.name}</h4>
                            <p class="text-xs uppercase tracking-wide text-slate-400 mt-1">${client.industry} · ${client.location || 'Локацію не вказано'}</p>
                        </div>
                        <span class="cih-tag"><i class="fas fa-shield-alt"></i>${client.tierLabel}</span>
                    </div>
                    <div class="mt-4 grid gap-3">
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-slate-400">Пов’язані конкуренти</span>
                            <span class="font-medium text-slate-100">${client.competitorCount}</span>
                        </div>
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-slate-400">Відповідальні за аналітику</span>
                            <span class="text-slate-100">${client.watchers.slice(0, 3).join(', ') || '—'}</span>
                        </div>
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-slate-400">Остання аналітика</span>
                            <span class="text-slate-100">${client.lastIntel ? competitorHubFormatRelative(client.lastIntel) : '—'}</span>
                        </div>
                        <div class="flex items-center justify-between text-sm">
                            <span class="text-slate-400">Наступний дедлайн</span>
                            <span class="text-slate-100">${client.earliestDue ? competitorHubFormatDateShort(client.earliestDue) : '—'}</span>
                        </div>
                    </div>
                    <div class="mt-4">
                        <div class="flex items-center justify-between text-xs text-slate-300 mb-2">
                            <span>Інтенсивність покриття</span>
                            <span>${client.intelScore}</span>
                        </div>
                        <div class="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                            <div class="h-full bg-sky-500" style="width: ${client.intelScore}%;"></div>
                        </div>
                    </div>
                    <div class="mt-4 flex items-center justify-between">
                        <div class="flex flex-wrap gap-2">
                            ${client.coverageNames.map(name => `<span class="cih-swatch"><span class="cih-dot" style="background: rgba(56,189,248,0.6);"></span>${name}</span>`).join('')}
                        </div>
                        <span class="cih-swatch ${competitorHubRiskBadge(client.riskLevel)}"><span class="cih-dot" style="background: currentColor;"></span>Ризик: ${translateRiskLabel(client.riskLevel)}</span>
                    </div>
                </div>
            `).join('') : '<p class="text-slate-400">За обраними фільтрами клієнтів не знайдено.</p>';
        };

        clientSearchInput.addEventListener('input', applyClientFilters);
        clientFilterSelect.addEventListener('change', applyClientFilters);
        clientSortSelect.addEventListener('change', applyClientFilters);

        const comparePanel = document.getElementById('cihComparePanel');
        const compareSelection = new Set();

        const renderComparePanel = () => {
            if (!compareSelection.size) {
                comparePanel.innerHTML = `
                    <h4 class="text-slate-200">Панель порівняння</h4>
                    <p class="text-sm text-slate-400">Оберіть конкурентів для порівняння рівня, статусу, цін і фокусу спостереження.</p>
                `;
                return;
            }
            const selectedCompetitors = Array.from(compareSelection).map(id => competitorProfiles.find(comp => comp.id === id)).filter(Boolean);
            const count = selectedCompetitors.length;
            const noun = count === 1 ? 'конкурент' : (count >= 2 && count <= 4 ? 'конкуренти' : 'конкурентів');
            comparePanel.innerHTML = `
                <h4 class="text-slate-200">${count} ${noun} обрано</h4>
                <div class="grid gap-3 md:grid-cols-${Math.min(selectedCompetitors.length, 3)}">
                    ${selectedCompetitors.map(comp => `
                        <div class="cih-card">
                            <div class="flex items-center justify-between">
                                <p class="text-slate-100 font-semibold">${comp.name}</p>
                                <span class="cih-tag">${translateTierLabel(comp.tier) || 'Рівень 3'}</span>
                            </div>
                            <p class="text-xs text-slate-400 mt-2">${translateStatusLabel(comp.status) || 'Моніторинг'} · ${comp.intel_owner || 'Не призначено'}</p>
                            <p class="text-sm text-slate-300 mt-3">${comp.enhancement?.pricing?.summary || comp.latest_move || 'Останні кроки не зафіксовані.'}</p>
                        </div>
                    `).join('')}
                </div>
            `;
        };

        document.querySelectorAll('[data-compare-toggle]').forEach(button => {
            button.addEventListener('click', () => {
                const competitorId = button.getAttribute('data-compare-toggle');
                if (compareSelection.has(competitorId)) {
                    compareSelection.delete(competitorId);
                    button.classList.remove('active');
                } else {
                    if (compareSelection.size >= 3) {
                        const first = compareSelection.values().next().value;
                        compareSelection.delete(first);
                        document.querySelector(`[data-compare-toggle="${first}"]`)?.classList.remove('active');
                    }
                    compareSelection.add(competitorId);
                    button.classList.add('active');
                }
                renderComparePanel();
            });
        });

        const workspaceSection = document.getElementById('cihWorkspaceSection');
        const workspaceState = {
            openTabs: [],
            activeTabId: null,
            splitView: false,
            splitSelection: new Set(),
            bulkSelection: new Set(),
            customTemplates: []
        };

        const workspaceContext = {
            workspaceState,
            moduleTemplateLibrary,
            templateIndex,
            competitorProfiles,
            createDefaultModules,
            instantiateModule
        };

        const getTemplateById = templateId => templateIndex.get(templateId) || workspaceState.customTemplates.find(template => template.id === templateId);

        const renderTemplateCard = (template, options = {}) => {
            const sizeTranslations = {
                small: 'малий',
                medium: 'середній',
                large: 'великий',
                fullwidth: 'повна ширина'
            };
            const sizeLabel = sizeTranslations[template.defaultSize || 'medium'] || template.defaultSize;
            return `
                <div class="cih-library-item" data-template-id="${template.id}" data-template-source="${options.custom ? 'custom' : 'library'}">
                    <div class="flex items-center justify-between">
                        <span class="cih-module-tag"><i class="fas fa-puzzle-piece"></i>${template.title}</span>
                        <span class="text-xs text-slate-500">${sizeLabel}</span>
                    </div>
                    <p>${template.description || 'Опис відсутній.'}</p>
                    <div class="cih-library-actions">
                        <button class="cih-outline-button" data-add-template="${template.id}"><i class="fas fa-plus"></i> Активна вкладка</button>
                        <button class="cih-outline-button" data-add-template-bulk="${template.id}"><i class="fas fa-layer-group"></i> Масове додавання</button>
                        ${options.custom ? `<button class="cih-outline-button" data-remove-template="${template.id}"><i class="fas fa-trash"></i></button>` : ''}
                    </div>
                </div>
            `;
        };

        const renderModuleCard = (module, competitor, context, options = {}) => {
            const template = getTemplateById(module.templateId);
            if (!template) {
                return '';
            }
            const isSplit = Boolean(options.split);
            const sizeClass = `cih-size-${module.size || 'medium'}`;
            const actions = isSplit ? '' : `
                <div class="cih-module-actions">
                    <button type="button" data-module-action="toggleCollapse" data-module-id="${module.id}"><i class="fas fa-chevron-${module.status === 'collapsed' ? 'up' : 'down'}"></i></button>
                    <button type="button" data-module-action="toggleMinimize" data-module-id="${module.id}"><i class="fas fa-window-minimize"></i></button>
                    <button type="button" data-module-action="cycleSize" data-module-id="${module.id}"><i class="fas fa-expand-arrows-alt"></i></button>
                    <button type="button" data-module-action="remove" data-module-id="${module.id}"><i class="fas fa-times"></i></button>
                </div>
            `;
            const permissionLabels = {
                view: 'перегляд',
                edit: 'редагування',
                delete: 'видалення'
            };
            const permissionChips = (module.permissions || []).map(permission => {
                const label = permissionLabels[permission] || permission;
                return `<span class="cih-permission-chip"><i class="fas fa-check"></i>${label}</span>`;
            }).join('');
            const typeTranslations = {
                custom: 'кастом',
                contacts: 'контакти',
                docs: 'документи',
                prices: 'ціни',
                media: 'медіа',
                swot: 'SWOT',
                network: 'мережа',
                kanban: 'канбан'
            };
            const sizeTranslations = {
                small: 'малий',
                medium: 'середній',
                large: 'великий',
                fullwidth: 'повна ширина'
            };
            const translatedType = typeTranslations[template.type] || template.type;
            const translatedSize = sizeTranslations[module.size || 'medium'] || (module.size || 'medium');
            const meta = `
                <div class="cih-module-meta">
                    <span><i class="fas fa-shapes"></i>${translatedType}</span>
                    <span><i class="fas fa-expand"></i>${translatedSize}</span>
                    <span><i class="fas fa-th"></i>${module.position?.x ?? 0},${module.position?.y ?? 0}</span>
                </div>
            `;
            const bodyContent = template.render ? template.render(module, competitor, { context, split: isSplit }) : '<p class="text-sm text-slate-400">Рендерер не визначено.</p>';
            const moduleBody = module.status === 'minimized'
                ? '<div class="text-xs text-slate-400">Модуль згорнуто. Скористайтеся керуванням, щоб відновити.</div>'
                : `<div class="cih-module-body">${bodyContent}</div>`;
            return `
                <div class="cih-workspace-module ${sizeClass}" data-module-id="${module.id}" data-status="${module.status}">
                    <div class="cih-module-header">
                        <div>
                            <h4>${module.title}</h4>
                            ${meta}
                        </div>
                        ${actions}
                    </div>
                    ${moduleBody}
                    ${permissionChips ? `<div class="flex flex-wrap gap-1">${permissionChips}</div>` : ''}
                </div>
            `;
        };

        const renderModulesForCanvas = (tab, competitor, options = {}) => {
            if (!tab || !competitor) {
                return '<p class="text-sm text-slate-400">Конкурента не обрано.</p>';
            }
            const moduleFilter = options.split
                ? tab.modules.filter(module => ['info-card', 'kpi-card', 'status-card', 'price-timeline'].includes(module.templateId)).slice(0, 4)
                : tab.modules;
            if (!moduleFilter.length) {
                return '<p class="text-sm text-slate-400">Модулі ще не налаштовані.</p>';
            }
            return moduleFilter.map(module => renderModuleCard(module, competitor, workspaceContext, options)).join('');
        };

        const renderModuleLibrary = context => {
            const libraryContainer = document.getElementById('cihModuleLibrary');
            if (!libraryContainer) {
                return;
            }
            const baseLibraryHtml = context.moduleTemplateLibrary.map(category => `
                <div class="cih-library-category">
                    <h4>${category.emoji} ${category.category}</h4>
                    <div class="cih-library-grid">
                        ${category.templates.map(template => renderTemplateCard(template)).join('')}
                    </div>
                </div>
            `).join('');
            const customTemplates = context.workspaceState.customTemplates;
            const customListHtml = customTemplates.length
                ? `<div class="cih-library-grid">${customTemplates.map(template => renderTemplateCard(template, { custom: true })).join('')}</div>`
                : '<p class="text-sm text-slate-400">Користувацькі шаблони ще не збережені.</p>';
            libraryContainer.innerHTML = `
                ${baseLibraryHtml}
                <div class="cih-custom-template">
                    <h4 class="text-slate-100 font-semibold flex items-center gap-2"><i class="fas fa-pen-nib"></i>Користувацькі шаблони</h4>
                    <form id="cihCustomTemplateForm">
                        <div class="grid md:grid-cols-2 gap-2">
                            <input type="text" id="cihCustomTemplateName" placeholder="Назва шаблону" required>
                            <select id="cihCustomTemplateType">
                                <option value="custom">Індивідуальний</option>
                                <option value="kanban">Канбан</option>
                                <option value="contacts">Контакти</option>
                                <option value="docs">Документи</option>
                                <option value="prices">Ціни</option>
                                <option value="media">Медіа</option>
                                <option value="swot">SWOT</option>
                                <option value="network">Мережа</option>
                            </select>
                        </div>
                        <textarea id="cihCustomTemplateNotes" placeholder="Опишіть макет, поля чи аналіз, який містить цей шаблон..."></textarea>
                        <button class="cih-primary-button" type="submit"><i class="fas fa-plus"></i>Створити шаблон</button>
                    </form>
                    ${customListHtml}
                </div>
            `;
        };

        const renderWorkspace = context => {
            const tabBar = document.getElementById('cihWorkspaceTabs');
            const splitSelector = document.getElementById('cihSplitSelector');
            const canvas = document.getElementById('cihWorkspaceCanvas');
            const splitToggleButton = workspaceSection?.querySelector('[data-toggle-split-view]');
            if (!tabBar || !splitSelector || !canvas || !splitToggleButton) {
                return;
            }

            const { workspaceState } = context;

            if (!workspaceState.openTabs.length) {
                tabBar.innerHTML = '<p class="text-sm text-slate-400">Open a competitor workspace from the portfolio cards above.</p>';
                splitSelector.innerHTML = '<p class="text-xs text-slate-500">Enable split view once competitors are added.</p>';
                canvas.dataset.split = 'false';
                canvas.innerHTML = '<p class="text-sm text-slate-400">Вкладку конкурента не обрано.</p>';
            } else {
                const tabsHtml = workspaceState.openTabs.map(tab => `
                    <div class="cih-tab" data-tab="${tab.competitorId}" data-active="${tab.competitorId === workspaceState.activeTabId}">
                        <label class="flex items-center gap-2">
                            <input type="checkbox" data-bulk-select="${tab.competitorId}" ${workspaceState.bulkSelection.has(tab.competitorId) ? 'checked' : ''} title="Позначити для масових дій">
                            <button type="button" data-activate-tab="${tab.competitorId}"><i class="fas fa-chess-knight mr-1"></i>${tab.competitorName}</button>
                        </label>
                        <button type="button" data-close-tab="${tab.competitorId}" title="Close tab"><i class="fas fa-times"></i></button>
                    </div>
                `).join('');
                tabBar.innerHTML = tabsHtml;

                if (workspaceState.splitView) {
                    const selectorHtml = workspaceState.openTabs.map(tab => `
                        <label>
                            <input type="checkbox" data-split-select="${tab.competitorId}" ${workspaceState.splitSelection.has(tab.competitorId) ? 'checked' : ''}>
                            ${tab.competitorName}
                        </label>
                    `).join('');
                    splitSelector.innerHTML = `${selectorHtml}<p class="text-xs text-slate-500">Оберіть 2–4 вкладки для порівняння поруч.</p>`;
                } else {
                    splitSelector.innerHTML = '<p class="text-xs text-slate-500">Toggle split view to compare multiple competitors or select tab checkboxes for bulk actions.</p>';
                }

                const activeTab = workspaceState.openTabs.find(tab => tab.competitorId === workspaceState.activeTabId) || workspaceState.openTabs[0];
                workspaceState.activeTabId = activeTab?.competitorId || null;

                if (workspaceState.splitView && workspaceState.splitSelection.size >= 2) {
                    canvas.dataset.split = 'true';
                    const splitColumns = Array.from(workspaceState.splitSelection).map(id => {
                        const tab = workspaceState.openTabs.find(item => item.competitorId === id);
                        const competitor = context.competitorProfiles.find(item => item.id === id);
                        if (!tab || !competitor) {
                            return '';
                        }
                        return `
                            <div class="cih-workspace-column">
                                <div class="cih-workspace-column-header">
                                    <span class="font-semibold text-slate-100">${tab.competitorName}</span>
                                    <span class="text-xs text-slate-400">${translateTierLabel(competitor.tier) || 'Рівень 3'} • ${translateStatusLabel(competitor.status) || 'Моніторинг'}</span>
                                </div>
                                ${renderModulesForCanvas(tab, competitor, { split: true })}
                            </div>
                        `;
                    }).join('');
                    canvas.innerHTML = splitColumns || '<p class="text-sm text-slate-400">Для розділеного режиму не обрано конкурентів.</p>';
                } else {
                    canvas.dataset.split = 'false';
                    if (!activeTab) {
                        canvas.innerHTML = '<p class="text-sm text-slate-400">Оберіть вкладку конкурента, щоб переглянути модулі.</p>';
                    } else {
                        const competitor = context.competitorProfiles.find(item => item.id === activeTab.competitorId);
                        canvas.innerHTML = `
                            <div class="cih-workspace-column">
                                <div class="cih-workspace-column-header">
                                    <div class="flex items-center gap-2">
                                        <span class="font-semibold text-slate-100">${activeTab.competitorName}</span>
                                        <span class="cih-module-tag">${translateTierLabel(competitor?.tier) || 'Рівень 3'}</span>
                                    </div>
                                    <span class="text-xs text-slate-400">Статус: ${translateStatusLabel(competitor?.status) || 'Моніторинг'}</span>
                                </div>
                                ${renderModulesForCanvas(activeTab, competitor)}
                            </div>
                        `;
                    }
                }
            }

            splitToggleButton.dataset.toggleSplitView = workspaceState.splitView ? 'true' : 'false';
            splitToggleButton.innerHTML = `<i class="fas fa-columns"></i> Розділений режим: ${workspaceState.splitView ? 'увімкнено' : 'вимкнено'}`;
        };

        const openWorkspaceTab = (competitorId, context, options = {}) => {
            if (!competitorId) {
                return;
            }
            const { workspaceState } = context;
            let tab = workspaceState.openTabs.find(item => item.competitorId === competitorId);
            if (!tab) {
                const competitor = context.competitorProfiles.find(item => item.id === competitorId);
                if (!competitor) {
                    return;
                }
                tab = {
                    competitorId,
                    competitorName: competitor.name,
                    modules: createDefaultModules(competitor, context)
                };
                workspaceState.openTabs.push(tab);
            }
            if (options.activate !== false) {
                workspaceState.activeTabId = competitorId;
            }
            if (workspaceState.splitView && workspaceState.splitSelection.size < 2) {
                workspaceState.splitSelection.add(competitorId);
            }
            renderWorkspace(context);
        };

        const closeWorkspaceTab = (competitorId, context) => {
            const { workspaceState } = context;
            const index = workspaceState.openTabs.findIndex(tab => tab.competitorId === competitorId);
            if (index === -1) {
                return;
            }
            workspaceState.openTabs.splice(index, 1);
            workspaceState.bulkSelection.delete(competitorId);
            workspaceState.splitSelection.delete(competitorId);
            if (workspaceState.activeTabId === competitorId) {
                const nextTab = workspaceState.openTabs[index] || workspaceState.openTabs[index - 1] || workspaceState.openTabs[0];
                workspaceState.activeTabId = nextTab ? nextTab.competitorId : null;
            }
            renderWorkspace(context);
        };

        const handleModuleAction = (moduleId, action, context) => {
            const { workspaceState } = context;
            const activeTab = workspaceState.openTabs.find(tab => tab.competitorId === workspaceState.activeTabId);
            if (!activeTab) {
                return;
            }
            const module = activeTab.modules.find(item => item.id === moduleId);
            if (!module) {
                return;
            }
            if (action === 'toggleCollapse') {
                module.status = module.status === 'collapsed' ? 'expanded' : 'collapsed';
            } else if (action === 'toggleMinimize') {
                module.status = module.status === 'minimized' ? 'expanded' : 'minimized';
            } else if (action === 'cycleSize') {
                const sizes = ['small', 'medium', 'large', 'fullwidth'];
                const currentIndex = sizes.indexOf(module.size || 'medium');
                module.size = sizes[(currentIndex + 1) % sizes.length];
            } else if (action === 'remove') {
                activeTab.modules = activeTab.modules.filter(item => item.id !== moduleId);
            }
            renderWorkspace(context);
        };

        const addTemplateToTabs = (templateId, context, options = {}) => {
            const template = getTemplateById(templateId);
            if (!template) {
                showToast('Шаблон не знайдено', 'error');
                return;
            }
            const { workspaceState } = context;
            if (!workspaceState.openTabs.length) {
                showToast('Відкрийте вкладку конкурента перед додаванням модулів.', 'warning');
                return;
            }
            const targets = options.bulk
                ? (workspaceState.bulkSelection.size ? workspaceState.openTabs.filter(tab => workspaceState.bulkSelection.has(tab.competitorId)) : workspaceState.openTabs)
                : workspaceState.openTabs.filter(tab => tab.competitorId === workspaceState.activeTabId);
            if (!targets.length) {
                showToast('Оберіть вкладку для вставки модуля.', 'warning');
                return;
            }
            targets.forEach(tab => {
                const competitor = context.competitorProfiles.find(item => item.id === tab.competitorId);
                if (!competitor) {
                    return;
                }
                const module = instantiateModule(template, competitor, context, {
                    position: { x: tab.modules.length % 2, y: Math.floor(tab.modules.length / 2) }
                });
                if (module) {
                    tab.modules.push(module);
                }
            });
            renderWorkspace(context);
            showToast(`Template “${template.title}” added to ${targets.length} workspace tab${targets.length === 1 ? '' : 's'}.`, 'success');
        };

        const cycleWorkspaceTab = (direction, context) => {
            const { workspaceState } = context;
            if (!workspaceState.openTabs.length) {
                return;
            }
            const currentIndex = workspaceState.openTabs.findIndex(tab => tab.competitorId === workspaceState.activeTabId);
            const nextIndex = ((currentIndex >= 0 ? currentIndex : 0) + direction + workspaceState.openTabs.length) % workspaceState.openTabs.length;
            workspaceState.activeTabId = workspaceState.openTabs[nextIndex].competitorId;
            renderWorkspace(context);
        };

        const registerWorkspaceHotkeys = context => {
            window.competitorWorkspaceContext = context;
            if (window.competitorWorkspaceHotkeysRegistered) {
                return;
            }
            document.addEventListener('keydown', event => {
                if (!event.ctrlKey || event.key !== 'Tab') {
                    return;
                }
                const competitorView = document.getElementById('competitorIntelView');
                if (!competitorView || competitorView.classList.contains('hidden')) {
                    return;
                }
                event.preventDefault();
                const direction = event.shiftKey ? -1 : 1;
                cycleWorkspaceTab(direction, window.competitorWorkspaceContext);
            });
            window.competitorWorkspaceHotkeysRegistered = true;
        };

        const handleBulkSelection = (competitorId, checked) => {
            if (checked) {
                workspaceState.bulkSelection.add(competitorId);
            } else {
                workspaceState.bulkSelection.delete(competitorId);
            }
        };

        const handleSplitSelection = (competitorId, checked) => {
            if (checked) {
                if (workspaceState.splitSelection.size >= 4) {
                    showToast('Розділений режим підтримує до чотирьох конкурентів.', 'warning');
                    return false;
                }
                workspaceState.splitSelection.add(competitorId);
            } else {
                workspaceState.splitSelection.delete(competitorId);
            }
            return true;
        };

        renderModuleLibrary(workspaceContext);
        if (competitorProfiles.length) {
            openWorkspaceTab(competitorProfiles[0].id, workspaceContext);
        } else {
            renderWorkspace(workspaceContext);
        }
        registerWorkspaceHotkeys(workspaceContext);

        if (workspaceSection) {
            workspaceSection.addEventListener('click', event => {
                const splitToggle = event.target.closest('[data-toggle-split-view]');
                if (splitToggle) {
                    workspaceState.splitView = splitToggle.getAttribute('data-toggle-split-view') !== 'true';
                    if (!workspaceState.splitView) {
                        workspaceState.splitSelection.clear();
                    }
                    renderWorkspace(workspaceContext);
                    return;
                }
                const addTemplateButton = event.target.closest('[data-add-template]');
                if (addTemplateButton) {
                    addTemplateToTabs(addTemplateButton.getAttribute('data-add-template'), workspaceContext, { bulk: false });
                    return;
                }
                const addTemplateBulkButton = event.target.closest('[data-add-template-bulk]');
                if (addTemplateBulkButton) {
                    addTemplateToTabs(addTemplateBulkButton.getAttribute('data-add-template-bulk'), workspaceContext, { bulk: true });
                    return;
                }
                const removeTemplateButton = event.target.closest('[data-remove-template]');
                if (removeTemplateButton) {
                    const templateId = removeTemplateButton.getAttribute('data-remove-template');
                    workspaceState.customTemplates = workspaceState.customTemplates.filter(template => template.id !== templateId);
                    renderModuleLibrary(workspaceContext);
                    return;
                }
                const activateTabButton = event.target.closest('[data-activate-tab]');
                if (activateTabButton) {
                    workspaceState.activeTabId = activateTabButton.getAttribute('data-activate-tab');
                    renderWorkspace(workspaceContext);
                    return;
                }
                const closeTabButton = event.target.closest('[data-close-tab]');
                if (closeTabButton) {
                    closeWorkspaceTab(closeTabButton.getAttribute('data-close-tab'), workspaceContext);
                    return;
                }
                const moduleActionButton = event.target.closest('[data-module-action]');
                if (moduleActionButton) {
                    handleModuleAction(moduleActionButton.getAttribute('data-module-id'), moduleActionButton.getAttribute('data-module-action'), workspaceContext);
                }
            });

            workspaceSection.addEventListener('change', event => {
                const bulkToggle = event.target.closest('[data-bulk-select]');
                if (bulkToggle) {
                    handleBulkSelection(bulkToggle.getAttribute('data-bulk-select'), bulkToggle.checked);
                    renderWorkspace(workspaceContext);
                    return;
                }
                const splitToggle = event.target.closest('[data-split-select]');
                if (splitToggle) {
                    const competitorId = splitToggle.getAttribute('data-split-select');
                    const accepted = handleSplitSelection(competitorId, splitToggle.checked);
                    if (!accepted) {
                        splitToggle.checked = false;
                    }
                    renderWorkspace(workspaceContext);
                }
            });

            workspaceSection.addEventListener('submit', event => {
                if (event.target.id === 'cihCustomTemplateForm') {
                    event.preventDefault();
                    const nameInput = document.getElementById('cihCustomTemplateName');
                    const typeSelect = document.getElementById('cihCustomTemplateType');
                    const notesInput = document.getElementById('cihCustomTemplateNotes');
                    const name = nameInput.value.trim();
                    if (!name) {
                        showToast('Вкажіть назву для користувацького шаблону.', 'warning');
                        return;
                    }
                    const type = typeSelect.value;
                    const notes = notesInput.value.trim();
                    const templateId = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
                    const customTemplate = {
                        id: templateId,
                        type,
                        title: name,
                        description: notes || 'Користувацький шаблон аналітика.',
                        defaultSize: 'medium',
                        defaultStatus: 'expanded',
                        permissions: ['view', 'edit', 'delete'],
                        build: competitor => ({
                            summary: notes || 'Аналітичні нотатки робочого простору.',
                            context: {
                                tier: translateTierLabel(competitor.tier) || 'Рівень 3',
                                owner: competitor.intel_owner || 'Не призначено',
                                lastMove: competitor.latest_move || competitor.enhancement?.pricing?.summary || 'Оновлень не зафіксовано.'
                            }
                        }),
                        render: module => {
                            const data = module.data || {};
                            return `
                                <div class="cih-card">
                                    <p class="text-sm text-slate-100 font-medium">${module.title}</p>
                                    <p class="text-xs text-slate-400">Відповідальний: ${data.context?.owner || 'Не призначено'} · Рівень: ${data.context?.tier || 'Рівень 3'}</p>
                                    <p class="text-sm text-slate-300 mt-2">${data.summary}</p>
                                    <p class="text-xs text-slate-500 mt-2">Останній крок: ${data.context?.lastMove || '—'}</p>
                                </div>
                            `;
                        }
                    };
                    workspaceState.customTemplates.push(customTemplate);
                    renderModuleLibrary(workspaceContext);
                    event.target.reset();
                    showToast('Користувацький шаблон збережено в бібліотеці.', 'success');
                }
            });
        }

        hubView.addEventListener('click', event => {
            const workspaceTrigger = event.target.closest('[data-open-workspace]');
            if (workspaceTrigger) {
                const competitorId = workspaceTrigger.getAttribute('data-open-workspace');
                openWorkspaceTab(competitorId, workspaceContext);
            }
        });

        applyClientFilters();

    } catch (error) {
        console.error('Error loading competitor intelligence hub:', error);
        showToast('Не вдалося завантажити конкурентний хаб', 'error');
        hubView.innerHTML = `
            <div class="cih-section text-sm text-rose-200 border border-rose-500/40 bg-rose-500/10">
                <p class="font-semibold">We could not load the competitor hub.</p>
                <p class="mt-2 text-rose-100">Please refresh the page or check your mock data configuration.</p>
            </div>
        `;
    } finally {
        hideLoading();
    }
}

// Tasks Management
async function showTasks() {
    showView('tasks');
    setPageHeader('tasks');
    
    const tasksView = document.getElementById('tasksView');
    tasksView.innerHTML = `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center space-x-4">
                    <h3 class="text-lg font-semibold text-gray-800">All Tasks</h3>
                    <div class="relative">
                        <input type="text" id="taskSearch" placeholder="Search tasks..." 
                               class="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    <button onclick="showTaskForm()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-plus mr-2"></i>Add Task
                    </button>
                </div>
            </div>
            
            <div class="flex items-center space-x-4 mb-6">
                <select id="taskStatusFilter" class="border border-gray-300 rounded-lg px-3 py-2">
                    <option value="">All Statuses</option>
                    <option value="Not Started">Not Started</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                </select>
                <select id="taskPriorityFilter" class="border border-gray-300 rounded-lg px-3 py-2">
                    <option value="">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                </select>
                <select id="taskTypeFilter" class="border border-gray-300 rounded-lg px-3 py-2">
                    <option value="">All Types</option>
                    <option value="Call">Call</option>
                    <option value="Email">Email</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Demo">Demo</option>
                </select>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="text-left p-3 font-medium text-gray-600">Task</th>
                            <th class="text-left p-3 font-medium text-gray-600">Type</th>
                            <th class="text-left p-3 font-medium text-gray-600">Priority</th>
                            <th class="text-left p-3 font-medium text-gray-600">Status</th>
                            <th class="text-left p-3 font-medium text-gray-600">Due Date</th>
                            <th class="text-left p-3 font-medium text-gray-600">Assigned To</th>
                            <th class="text-left p-3 font-medium text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="tasksTableBody">
                    </tbody>
                </table>
            </div>
            
            <div id="tasksPagination" class="mt-6 flex items-center justify-between">
            </div>
        </div>
    `;
    
    await loadTasks();
    setupTaskFilters();
}

async function loadTasks(page = 1, search, status, priority, type) {
    showLoading();
    try {
        const searchInput = document.getElementById('taskSearch');
        const statusSelect = document.getElementById('taskStatusFilter');
        const prioritySelect = document.getElementById('taskPriorityFilter');
        const typeSelect = document.getElementById('taskTypeFilter');

        const searchValue = search !== undefined ? search : (searchInput?.value ?? '');
        const statusValue = status !== undefined ? status : (statusSelect?.value ?? '');
        const priorityValue = priority !== undefined ? priority : (prioritySelect?.value ?? '');
        const typeValue = type !== undefined ? type : (typeSelect?.value ?? '');

        const params = new URLSearchParams({
            page: String(page),
            limit: '50'
        });

        if (searchValue.trim()) params.append('search', searchValue.trim());
        if (statusValue) params.append('status', statusValue);
        if (priorityValue) params.append('priority', priorityValue);
        if (typeValue) params.append('type', typeValue);

        const response = await fetch(`tables/tasks?${params.toString()}`);
        const data = await response.json();

        displayTasks(data.data || []);
        const paginationContainer = document.getElementById('tasksPagination');
        if (paginationContainer) {
            if (typeof data.total === 'number' && typeof data.limit === 'number') {
                displayPagination('tasks', data, page);
            } else {
                paginationContainer.innerHTML = '';
            }
        }

    } catch (error) {
        console.error('Error loading tasks:', error);
        showToast('Не вдалося завантажити задачі', 'error');
    } finally {
        hideLoading();
    }
}

function displayTasks(tasks) {
    const tbody = document.getElementById('tasksTableBody');
    
    if (tasks.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-8 text-gray-500">
                    <i class="fas fa-tasks text-4xl mb-4"></i>
                    <p>No tasks found</p>
                    <button onclick="showTaskForm()" class="mt-2 text-blue-600 hover:text-blue-700">Add your first task</button>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = tasks.map(task => `
        <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="p-3">
                <div>
                    <p class="font-medium text-gray-800">${task.title}</p>
                    <p class="text-sm text-gray-600">${task.description ? task.description.substring(0, 50) + '...' : 'No description'}</p>
                </div>
            </td>
            <td class="p-3">
                <span class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">${task.type}</span>
            </td>
            <td class="p-3">
                <span class="px-2 py-1 text-xs rounded-full ${getPriorityClass(task.priority)}">${task.priority}</span>
            </td>
            <td class="p-3">
                <span class="px-2 py-1 text-xs rounded-full ${getTaskStatusClass(task.status)}">${task.status}</span>
            </td>
            <td class="p-3 text-gray-600">${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Not set'}</td>
            <td class="p-3 text-gray-600">${task.assigned_to || 'Unassigned'}</td>
            <td class="p-3">
                <div class="flex items-center space-x-2">
                    <button onclick="completeTask('${task.id}')" class="p-2 text-green-600 hover:bg-green-50 rounded" title="Mark Complete">
                        <i class="fas fa-check"></i>
                    </button>
                    <button onclick="editTask('${task.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteTask('${task.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getTaskStatusClass(status) {
    const statusClasses = {
        'Not Started': 'bg-gray-100 text-gray-800',
        'In Progress': 'bg-blue-100 text-blue-800',
        'Completed': 'bg-green-100 text-green-800',
        'Cancelled': 'bg-red-100 text-red-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
}

function setupTaskFilters() {
    const searchInput = document.getElementById('taskSearch');
    const statusFilter = document.getElementById('taskStatusFilter');
    const priorityFilter = document.getElementById('taskPriorityFilter');
    const typeFilter = document.getElementById('taskTypeFilter');
    
    let filterTimeout;
    
    const applyFilters = () => {
        clearTimeout(filterTimeout);
        filterTimeout = setTimeout(() => {
            loadTasks(1, searchInput.value, statusFilter.value, priorityFilter.value, typeFilter.value);
        }, 300);
    };
    
    searchInput.addEventListener('input', applyFilters);
    statusFilter.addEventListener('change', applyFilters);
    priorityFilter.addEventListener('change', applyFilters);
    typeFilter.addEventListener('change', applyFilters);
}

// Activities Management
async function showActivities() {
    showView('activities');
    setPageHeader('activities');
    
    const activitiesView = document.getElementById('activitiesView');
    activitiesView.innerHTML = `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center space-x-4">
                    <h3 class="text-lg font-semibold text-gray-800">Activity Timeline</h3>
                    <div class="relative">
                        <input type="text" id="activitySearch" placeholder="Search activities..." 
                               class="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    <button onclick="showActivityForm()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-plus mr-2"></i>Log Activity
                    </button>
                </div>
            </div>
            
            <div class="space-y-4" id="activitiesTimeline">
            </div>
        </div>
    `;
    
    await loadActivities();
}

async function loadActivities() {
    showLoading();
    try {
        const response = await fetch('tables/activities?limit=50&sort=date');
        const data = await response.json();
        
        displayActivitiesTimeline(data.data || []);
        
    } catch (error) {
        console.error('Error loading activities:', error);
        showToast('Не вдалося завантажити активності', 'error');
    } finally {
        hideLoading();
    }
}

function displayActivitiesTimeline(activities) {
    const timeline = document.getElementById('activitiesTimeline');
    
    if (activities.length === 0) {
        timeline.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <i class="fas fa-clock text-4xl mb-4"></i>
                <p>No activities recorded</p>
                <button onclick="showActivityForm()" class="mt-2 text-blue-600 hover:text-blue-700">Log your first activity</button>
            </div>
        `;
        return;
    }
    
    timeline.innerHTML = activities.map(activity => `
        <div class="flex items-start space-x-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
            <div class="w-10 h-10 rounded-full flex items-center justify-center ${getActivityTypeColor(activity.type)}">
                <i class="fas fa-${getActivityIcon(activity.type)} text-white"></i>
            </div>
            <div class="flex-1">
                <div class="flex items-center justify-between mb-2">
                    <h4 class="font-medium text-gray-800">${activity.subject}</h4>
                    <div class="flex items-center space-x-2 text-sm text-gray-500">
                        <span>${new Date(activity.date).toLocaleDateString()}</span>
                        <span>${new Date(activity.date).toLocaleTimeString()}</span>
                    </div>
                </div>
                <p class="text-gray-600 mb-2">${activity.description || 'No description'}</p>
                <div class="flex items-center space-x-4 text-sm text-gray-500">
                    <span><i class="fas fa-user mr-1"></i>${activity.assigned_to || 'Unknown'}</span>
                    ${activity.duration ? `<span><i class="fas fa-clock mr-1"></i>${activity.duration} min</span>` : ''}
                    ${activity.outcome ? `<span class="px-2 py-1 bg-gray-100 rounded-full">${activity.outcome}</span>` : ''}
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <button onclick="editActivity('${activity.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteActivity('${activity.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function getActivityTypeColor(type) {
    const colors = {
        'Call': 'bg-blue-500',
        'Email': 'bg-green-500',
        'Meeting': 'bg-purple-500',
        'Note': 'bg-yellow-500',
        'Task': 'bg-orange-500',
        'Appointment': 'bg-pink-500',
        'Document': 'bg-indigo-500'
    };
    return colors[type] || 'bg-gray-500';
}

// Analytics & BI Management
const CAMPAIGN_PERFORMANCE_TEMPLATES = [
    {
        name: 'Lifecycle nurture · від заявки до продовження',
        status: 'Активна',
        spend: 5400,
        generatedLeads: 148,
        influencedDeals: 19,
        influencedRevenue: 132000,
        meetingsBooked: 32,
        retentionLift: 0.18,
        engagementRate: 0.64
    },
    {
        name: 'Account-based програма для стратегічних клієнтів',
        status: 'Підготовка',
        spend: 8600,
        generatedLeads: 58,
        influencedDeals: 11,
        influencedRevenue: 156000,
        meetingsBooked: 21,
        retentionLift: 0.12,
        engagementRate: 0.58
    },
    {
        name: 'Reactivation sprint · повернення неактивних користувачів',
        status: 'Активна',
        spend: 3900,
        generatedLeads: 96,
        influencedDeals: 14,
        influencedRevenue: 84000,
        meetingsBooked: 17,
        retentionLift: 0.21,
        engagementRate: 0.71
    }
];

function getCampaignPerformanceData() {
    const hasCampaigns = typeof MARKETING_CAMPAIGNS !== 'undefined' && Array.isArray(MARKETING_CAMPAIGNS);
    const campaigns = hasCampaigns ? MARKETING_CAMPAIGNS : [];

    return CAMPAIGN_PERFORMANCE_TEMPLATES.map((template, index) => {
        const campaign = campaigns[index];
        return {
            ...template,
            name: campaign?.name || template.name,
            status: campaign?.status || template.status
        };
    });
}

const ANALYTICS_WIDGETS_STORAGE_KEY = 'crmAnalyticsWidgets';

const ANALYTICS_WIDGET_LIBRARY = {
    pipelineByStage: {
        label: 'Pipeline за стадіями',
        description: 'Порівняння загальної та зваженої виручки у кожній стадії продажу.',
        render(container, context, widget) {
            const stageData = context.pipelineByStage || [];
            if (!stageData.length) {
                container.innerHTML = '<p class="text-sm text-gray-500">Недостатньо даних для побудови графіка.</p>';
                return;
            }

            const canvasId = `${widget.id}-chart`;
            container.innerHTML = `<div style="height: 240px;"><canvas id="${canvasId}"></canvas></div>`;

            renderChartInstance(canvasId, {
                type: 'bar',
                data: {
                    labels: stageData.map(item => item.stage),
                    datasets: [
                        {
                            label: 'Pipeline',
                            data: stageData.map(item => Number(item.totalValue || 0)),
                            backgroundColor: 'rgba(96, 165, 250, 0.65)',
                            borderRadius: 6
                        },
                        {
                            label: 'Зважена виручка',
                            data: stageData.map(item => Number(item.weightedValue || 0)),
                            backgroundColor: 'rgba(37, 99, 235, 0.9)',
                            borderRadius: 6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            ticks: {
                                callback(value) {
                                    return formatCurrency(value);
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });

            const topStage = stageData.slice().sort((a, b) => (b.weightedValue || 0) - (a.weightedValue || 0))[0];
            if (topStage) {
                const summary = document.createElement('p');
                summary.className = 'mt-3 text-xs text-gray-500';
                summary.innerHTML = `Найбільше очікуваної виручки у стадії <span class="font-medium text-gray-700">${topStage.stage}</span>: ${formatCurrency(topStage.weightedValue || 0)}.`;
                container.appendChild(summary);
            }
        }
    },
    ownerPerformance: {
        label: 'Продуктивність менеджерів',
        description: 'Порівняння закритої виручки та активного pipeline по власниках угод.',
        render(container, context, widget) {
            const ownerData = context.ownerProductivity || [];
            if (!ownerData.length) {
                container.innerHTML = '<p class="text-sm text-gray-500">У CRM поки немає угод для аналізу менеджерів.</p>';
                return;
            }

            const canvasId = `${widget.id}-chart`;
            container.innerHTML = `<div style="height: 240px;"><canvas id="${canvasId}"></canvas></div>`;

            renderChartInstance(canvasId, {
                type: 'bar',
                data: {
                    labels: ownerData.map(item => item.owner),
                    datasets: [
                        {
                            label: 'Закрито',
                            data: ownerData.map(item => Number(item.wonValue || 0)),
                            backgroundColor: 'rgba(16, 185, 129, 0.85)',
                            borderRadius: 6
                        },
                        {
                            label: 'Активний pipeline',
                            data: ownerData.map(item => Number(item.openPipeline || 0)),
                            backgroundColor: 'rgba(59, 130, 246, 0.6)',
                            borderRadius: 6
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    scales: {
                        x: {
                            ticks: {
                                callback(value) {
                                    return formatCurrency(value);
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });

            const leader = ownerData[0];
            if (leader) {
                const info = document.createElement('p');
                info.className = 'mt-3 text-xs text-gray-500';
                info.innerHTML = `${leader.owner} генерує ${formatCurrency(leader.wonValue || 0)} закритої виручки при win-rate ${formatPercentage(leader.winRate || 0)}.`;
                container.appendChild(info);
            }
        }
    },
    campaignROI: {
        label: 'ROI маркетингових кампаній',
        description: 'ROI та конверсія по ключових кампаніях.',
        render(container, context, widget) {
            const campaignData = context.campaignEffectiveness?.enriched || [];
            if (!campaignData.length) {
                container.innerHTML = '<p class="text-sm text-gray-500">Додайте кампанії у модулі Marketing, щоб побачити їх ефективність.</p>';
                return;
            }

            const canvasId = `${widget.id}-chart`;
            container.innerHTML = `<div style="height: 240px;"><canvas id="${canvasId}"></canvas></div>`;

            renderChartInstance(canvasId, {
                data: {
                    labels: campaignData.map(item => item.name),
                    datasets: [
                        {
                            type: 'bar',
                            label: 'ROI (x)',
                            data: campaignData.map(item => Number((item.roi || 0).toFixed(2))),
                            backgroundColor: 'rgba(251, 191, 36, 0.85)',
                            borderRadius: 6,
                            yAxisID: 'y'
                        },
                        {
                            type: 'line',
                            label: 'Конверсія %',
                            data: campaignData.map(item => Number(((item.conversionRate || 0) * 100).toFixed(1))),
                            borderColor: '#2563eb',
                            backgroundColor: 'rgba(37, 99, 235, 0.1)',
                            tension: 0.4,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                callback(value) {
                                    return `${value}x`;
                                }
                            }
                        },
                        y1: {
                            beginAtZero: true,
                            position: 'right',
                            grid: { drawOnChartArea: false },
                            ticks: {
                                callback(value) {
                                    return `${value}%`;
                                }
                            }
                        }
                    },
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });

            const meanCpl = campaignData.reduce((sum, item) => sum + (item.costPerLead || 0), 0) / campaignData.length;
            const helper = document.createElement('p');
            helper.className = 'mt-3 text-xs text-gray-500';
            helper.textContent = `Середня вартість ліда: ${formatCurrency(meanCpl || 0)}.`;
            container.appendChild(helper);
        }
    },
    forecastTrend: {
        label: 'Тренд прогнозу виручки',
        description: 'AI-модель порівнює історію угод та прогноз наступних місяців.',
        render(container, context, widget) {
            const series = context.revenueSeries || [];
            const forecast = context.forecast || { predictions: [] };

            if (!series.length) {
                container.innerHTML = '<p class="text-sm text-gray-500">Недостатньо даних для побудови прогнозу.</p>';
                return;
            }

            const historyLabels = series.map(item => getMonthLabel(item.month));
            const forecastLabels = (forecast.predictions || []).map(item => getMonthLabel(item.month));
            const labels = historyLabels.concat(forecastLabels);

            const actualData = [];
            const weightedData = [];
            const forecastData = [];

            series.forEach(item => {
                actualData.push(Number(item.actual || 0));
                weightedData.push(Number(item.weighted || 0));
                forecastData.push(null);
            });

            (forecast.predictions || []).forEach(prediction => {
                actualData.push(null);
                weightedData.push(null);
                forecastData.push(Number(Math.max(prediction.value || 0, 0)));
            });

            const canvasId = `${widget.id}-chart`;
            container.innerHTML = `<div style="height: 240px;"><canvas id="${canvasId}"></canvas></div>`;

            renderChartInstance(canvasId, {
                type: 'line',
                data: {
                    labels,
                    datasets: [
                        {
                            label: 'Фактична виручка',
                            data: actualData,
                            borderColor: '#10b981',
                            backgroundColor: 'rgba(16, 185, 129, 0.1)',
                            tension: 0.4,
                            spanGaps: true
                        },
                        {
                            label: 'Ймовірна виручка',
                            data: weightedData,
                            borderColor: '#2563eb',
                            backgroundColor: 'rgba(37, 99, 235, 0.08)',
                            borderDash: [6, 6],
                            tension: 0.4,
                            spanGaps: true
                        },
                        {
                            label: 'AI прогноз',
                            data: forecastData,
                            borderColor: '#f97316',
                            backgroundColor: 'rgba(249, 115, 22, 0.1)',
                            borderDash: [4, 4],
                            tension: 0.4,
                            spanGaps: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    },
                    scales: {
                        y: {
                            ticks: {
                                callback(value) {
                                    return formatCurrency(value);
                                }
                            }
                        }
                    }
                }
            });

            const note = document.createElement('p');
            note.className = 'mt-3 text-xs text-gray-500';
            const nextMonth = forecast.predictions && forecast.predictions[0];
            const nextValue = nextMonth ? nextMonth.value || 0 : 0;
            note.textContent = `Наступний місяць: ${formatCurrency(nextValue)} (${forecast.trendLabel || 'тренд стабільний'}).`;
            container.appendChild(note);
        }
    },
    winRate: {
        label: 'Win-rate команди',
        description: 'Ключовий KPI з підказками щодо наступних кроків.',
        render(container, context) {
            const winRate = context.salesKPIs?.winRate || 0;
            const wonCount = context.salesKPIs?.wonCount || 0;
            const openCount = context.salesKPIs?.openCount || 0;
            container.innerHTML = `
                <div class="text-3xl font-semibold text-gray-800">${formatPercentage(winRate)}</div>
                <p class="text-sm text-gray-500 mt-2">Win-rate команди за всіма угодами.</p>
                <div class="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div class="h-full bg-emerald-500" style="width: ${Math.min(100, winRate * 100).toFixed(1)}%;"></div>
                </div>
                <p class="mt-3 text-xs text-gray-400">Закриті угоди: ${wonCount}. Активні: ${openCount}.</p>
            `;
        }
    },
    activityMix: {
        label: 'Активність команди',
        description: 'Баланс дзвінків, листів і зустрічей по типах активностей.',
        render(container, context, widget) {
            const metrics = context.activityMetrics || { breakdown: [] };
            if (!metrics.total) {
                container.innerHTML = '<p class="text-sm text-gray-500">Поки немає активностей для аналітики.</p>';
                return;
            }

            const canvasId = `${widget.id}-chart`;
            container.innerHTML = '<div class="space-y-4"><div style="height: 220px;"><canvas id="' + canvasId + '"></canvas></div></div>';

            const colors = ['#2563eb', '#10b981', '#f59e0b', '#6366f1', '#f97316', '#ef4444', '#14b8a6'];
            renderChartInstance(canvasId, {
                type: 'doughnut',
                data: {
                    labels: metrics.breakdown.map(item => item.type),
                    datasets: [{
                        data: metrics.breakdown.map(item => item.count),
                        backgroundColor: colors,
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'bottom' }
                    }
                }
            });

            const summary = document.createElement('p');
            summary.className = 'text-xs text-gray-500 text-center';
            const topType = metrics.topType;
            const topText = topType ? `${topType.type} (${formatPercentage(topType.percentage || 0)})` : '—';
            summary.textContent = `Усього активностей: ${metrics.total}. Топ канал: ${topText}.`;
            container.querySelector('.space-y-4').appendChild(summary);
        }
    }
};

async function renderAnalyticsAndBI() {
    showView('reports');
    setPageHeader('reports');

    const reportsView = document.getElementById('reportsView');
    if (!reportsView) {
        return;
    }

    reportsView.innerHTML = `
        <div class="space-y-6">
            <section>
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" id="analyticsSummary"></div>
            </section>

            <section class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">Конструктор дашбордів</h3>
                        <p class="text-sm text-gray-500">Обирайте віджети, щоб зібрати власний BI-набір. Налаштування зберігаються у браузері.</p>
                    </div>
                    <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                        <select id="analyticsWidgetSelect" class="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="">Оберіть віджет...</option>
                        </select>
                        <button id="addAnalyticsWidget" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <i class="fas fa-plus mr-2"></i>Додати
                        </button>
                        <button id="resetAnalyticsWidgets" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                            <i class="fas fa-rotate-left mr-2"></i>Скинути
                        </button>
                    </div>
                </div>
                <div id="customAnalyticsDashboard" class="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"></div>
            </section>

            <section class="space-y-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">Аналітичні зрізи</h3>
                        <p class="text-sm text-gray-500">Фокус на продуктивності продажів, маркетингу та прогнозуванні.</p>
                    </div>
                    <span class="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase rounded-full bg-blue-50 text-blue-600">
                        Автооновлення
                    </span>
                </div>
                <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <span class="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase rounded-full bg-emerald-50 text-emerald-600">Продажі</span>
                        <div class="flex items-center justify-between mt-2">
                            <h3 class="text-lg font-semibold text-gray-800">Продуктивність команди продажів</h3>
                            <span class="text-xs text-gray-400">Автоматична візуалізація</span>
                        </div>
                        <div class="mt-4" style="height: 280px;">
                            <canvas id="salesProductivityChart"></canvas>
                        </div>
                        <div id="salesInsights" class="mt-4 space-y-3 text-sm text-gray-600"></div>
                    </div>
                    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <span class="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase rounded-full bg-amber-50 text-amber-600">Маркетинг</span>
                        <h3 class="text-lg font-semibold text-gray-800 mt-2">Ефективність маркетингових кампаній</h3>
                        <div class="mt-4" style="height: 280px;">
                            <canvas id="campaignPerformanceChart"></canvas>
                        </div>
                        <div id="campaignInsights" class="mt-4 space-y-3 text-sm text-gray-600"></div>
                    </div>
                </div>
            </section>

            <section class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <span class="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase rounded-full bg-indigo-50 text-indigo-600">Прогноз</span>
                    <h3 class="text-lg font-semibold text-gray-800 mt-2">Прогноз виручки</h3>
                    <p class="text-sm text-gray-500 mt-2">AI-модель використовує вагу угод, ймовірність закриття та історичні перемоги.</p>
                    <div class="mt-4" style="height: 280px;">
                        <canvas id="revenueForecastChart"></canvas>
                    </div>
                    <div id="forecastSummary" class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600"></div>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <span class="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase rounded-full bg-purple-50 text-purple-600">AI</span>
                    <h3 class="text-lg font-semibold text-gray-800 mt-2">AI-рекомендації</h3>
                    <p class="text-sm text-gray-500 mt-2">Персональні поради щодо наступних кроків на основі ваших CRM-даних.</p>
                    <div id="aiRecommendations" class="mt-4 space-y-4"></div>
                </div>
            </section>
        </div>
    `;

    showLoading();
    try {
        const dataset = await fetchAnalyticsDataset();
        const context = buildAnalyticsContext(dataset);

        renderAnalyticsSummary(context);
        initializeDashboardBuilder(context);
        renderSalesAnalytics(context);
        renderCampaignAnalytics(context);
        renderForecastAnalytics(context);
        renderAIInsights(context);
    } catch (error) {
        console.error('Error loading analytics module:', error);
        showToast('Не вдалося завантажити модуль аналітики', 'error');
    } finally {
        hideLoading();
    }
}

async function fetchAnalyticsDataset() {
    const [opportunitiesRes, leadsRes, activitiesRes, tasksRes, companiesRes] = await Promise.all([
        fetch('tables/opportunities').then(response => response.json()),
        fetch('tables/leads').then(response => response.json()),
        fetch('tables/activities').then(response => response.json()),
        fetch('tables/tasks').then(response => response.json()),
        fetch('tables/companies').then(response => response.json())
    ]);

    return {
        opportunities: opportunitiesRes.data || opportunitiesRes || [],
        leads: leadsRes.data || leadsRes || [],
        activities: activitiesRes.data || activitiesRes || [],
        tasks: tasksRes.data || tasksRes || [],
        companies: companiesRes.data || companiesRes || [],
        campaigns: Array.isArray(MARKETING_CAMPAIGNS) ? MARKETING_CAMPAIGNS.slice() : [],
        campaignPerformance: getCampaignPerformanceData()
    };
}

function buildAnalyticsContext(dataset) {
    const pipelineByStage = calculatePipelineByStage(dataset.opportunities);
    const salesKPIs = calculateSalesKPIs(dataset.opportunities);
    const ownerProductivity = calculateOwnerProductivity(dataset.opportunities);
    const activityMetrics = calculateActivityMetrics(dataset.activities);
    const revenueSeries = buildRevenueSeries(dataset.opportunities);
    const forecast = generateRevenueForecast(revenueSeries);
    const campaignEffectiveness = calculateCampaignEffectiveness(dataset.campaignPerformance);

    return {
        ...dataset,
        pipelineByStage,
        salesKPIs,
        ownerProductivity,
        activityMetrics,
        revenueSeries,
        forecast,
        campaignEffectiveness
    };
}

function renderAnalyticsSummary(context) {
    const container = document.getElementById('analyticsSummary');
    if (!container) {
        return;
    }

    const cards = [
        {
            title: 'Зважений pipeline',
            value: formatCurrency(context.salesKPIs.weightedPipeline || 0),
            helper: `Середня ймовірність: ${formatPercentage((context.salesKPIs.averageProbability || 0) / 100)}`,
            icon: 'fa-diagram-project',
            accent: 'bg-blue-50 text-blue-600'
        },
        {
            title: 'Win-rate команди',
            value: formatPercentage(context.salesKPIs.winRate || 0),
            helper: `Середній чек: ${formatCurrency(context.salesKPIs.averageDealSize || 0)}`,
            icon: 'fa-bullseye',
            accent: 'bg-emerald-50 text-emerald-600'
        },
        {
            title: 'Прогноз (90 днів)',
            value: formatCurrency(context.forecast.projectedNextQuarter || 0),
            helper: context.forecast.trendLabel || 'Тренд: стабільний',
            icon: 'fa-chart-line',
            accent: 'bg-indigo-50 text-indigo-600'
        },
        {
            title: 'ROI маркетингу',
            value: `x${(context.campaignEffectiveness.overallROI || 0).toFixed(1)}`,
            helper: context.campaignEffectiveness.topROI ? `Найкраща: ${context.campaignEffectiveness.topROI.name}` : 'Додайте кампанії для аналізу',
            icon: 'fa-bullhorn',
            accent: 'bg-amber-50 text-amber-600'
        }
    ];

    container.innerHTML = cards.map(card => `
        <div class="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-xs uppercase tracking-wide text-gray-500">${card.title}</p>
                    <p class="mt-2 text-2xl font-semibold text-gray-800">${card.value}</p>
                </div>
                <span class="w-10 h-10 rounded-lg flex items-center justify-center ${card.accent}">
                    <i class="fas ${card.icon}"></i>
                </span>
            </div>
            <p class="mt-3 text-sm text-gray-500">${card.helper}</p>
        </div>
    `).join('');
}

function initializeDashboardBuilder(context) {
    const select = document.getElementById('analyticsWidgetSelect');
    const addBtn = document.getElementById('addAnalyticsWidget');
    const resetBtn = document.getElementById('resetAnalyticsWidgets');

    if (!select || !addBtn || !resetBtn) {
        return;
    }

    select.innerHTML = '<option value="">Оберіть віджет...</option>' + Object.entries(ANALYTICS_WIDGET_LIBRARY)
        .map(([key, definition]) => `<option value="${key}">${definition.label}</option>`)
        .join('');

    let activeWidgets = loadStoredAnalyticsWidgets();
    const updateWidgets = nextWidgets => {
        activeWidgets = nextWidgets;
        saveAnalyticsWidgets(activeWidgets);
        renderCustomDashboard(activeWidgets, context, updateWidgets);
    };

    renderCustomDashboard(activeWidgets, context, updateWidgets);

    addBtn.addEventListener('click', () => {
        const type = select.value;
        if (!type) {
            showToast('Оберіть віджет для додавання', 'warning');
            return;
        }
        const widget = {
            id: `widget-${type}-${Date.now()}`,
            type
        };
        updateWidgets(activeWidgets.concat(widget));
        showToast('Віджет додано до дашборду', 'success');
    });

    resetBtn.addEventListener('click', () => {
        updateWidgets([]);
        showToast('Аналітичні віджети очищено', 'info');
    });
}

function loadStoredAnalyticsWidgets() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return [];
    }
    try {
        const raw = window.localStorage.getItem(ANALYTICS_WIDGETS_STORAGE_KEY);
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed.filter(widget => widget && widget.type);
        }
    } catch (error) {
        console.warn('Failed to read analytics widgets from storage', error);
    }
    return [];
}

function saveAnalyticsWidgets(widgets) {
    if (typeof window === 'undefined' || !window.localStorage) {
        return;
    }
    try {
        window.localStorage.setItem(ANALYTICS_WIDGETS_STORAGE_KEY, JSON.stringify(widgets));
    } catch (error) {
        console.warn('Failed to persist analytics widgets', error);
    }
}

function renderCustomDashboard(widgets, context, onUpdate) {
    const container = document.getElementById('customAnalyticsDashboard');
    if (!container) {
        return;
    }

    if (typeof charts === 'object' && charts) {
        Object.keys(charts).forEach(chartId => {
            if (chartId.startsWith('widget-')) {
                destroyChartById(chartId);
            }
        });
    }

    container.innerHTML = '';

    if (!widgets || !widgets.length) {
        container.innerHTML = `
            <div class="col-span-full border border-dashed border-gray-300 rounded-lg p-6 text-sm text-gray-500 bg-gray-50">
                Додайте один або кілька віджетів, щоб сформувати персональний дашборд. Налаштування буде збережено у вашому браузері.
            </div>
        `;
        return;
    }

    widgets.forEach(widget => {
        const definition = ANALYTICS_WIDGET_LIBRARY[widget.type];
        if (!definition) {
            return;
        }
        const card = document.createElement('div');
        card.className = 'bg-white border border-gray-100 rounded-xl shadow-sm p-5 flex flex-col';
        card.setAttribute('data-widget-id', widget.id);

        card.innerHTML = `
            <div class="flex items-start justify-between">
                <div>
                    <p class="text-xs uppercase tracking-wide text-blue-500 font-semibold">Віджет</p>
                    <h4 class="text-base font-semibold text-gray-800 mt-1">${definition.label}</h4>
                    <p class="text-xs text-gray-500 mt-1">${definition.description}</p>
                </div>
                <button type="button" data-remove-widget class="text-gray-400 hover:text-gray-600 transition-colors">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="mt-4 flex-1 widget-body"></div>
        `;

        container.appendChild(card);
        const body = card.querySelector('.widget-body');
        try {
            definition.render(body, context, widget);
        } catch (error) {
            console.error('Failed to render analytics widget', widget.type, error);
            body.innerHTML = '<p class="text-sm text-red-500">Не вдалося відобразити віджет.</p>';
        }
    });

    container.querySelectorAll('[data-remove-widget]').forEach(button => {
        button.addEventListener('click', () => {
            const card = button.closest('[data-widget-id]');
            if (!card) {
                return;
            }
            const widgetId = card.getAttribute('data-widget-id');
            destroyChartById(`${widgetId}-chart`);
            const nextWidgets = widgets.filter(item => item.id !== widgetId);
            if (typeof onUpdate === 'function') {
                onUpdate(nextWidgets);
            }
        });
    });
}

function destroyChartById(chartId) {
    if (typeof charts === 'object' && charts && charts[chartId]) {
        charts[chartId].destroy();
        delete charts[chartId];
    }
}

function renderChartInstance(chartId, config) {
    const canvas = document.getElementById(chartId);
    if (!canvas || typeof Chart === 'undefined') {
        return null;
    }
    destroyChartById(chartId);
    const chart = new Chart(canvas.getContext('2d'), config);
    if (typeof charts === 'object' && charts) {
        charts[chartId] = chart;
    }
    return chart;
}

function calculateSalesKPIs(opportunities = []) {
    const result = {
        pipelineValue: 0,
        weightedPipeline: 0,
        wonRevenue: 0,
        wonCount: 0,
        lostCount: 0,
        openCount: 0,
        averageDealSize: 0,
        winRate: 0,
        averageProbability: 0
    };

    let probabilitySum = 0;
    let probabilityCount = 0;

    opportunities.forEach(opportunity => {
        const value = Number(opportunity.value) || 0;
        const stage = (opportunity.stage || '').toString();

        if (stage === 'Closed Won') {
            result.wonRevenue += value;
            result.wonCount += 1;
            result.weightedPipeline += value;
        } else if (stage === 'Closed Lost') {
            result.lostCount += 1;
        } else {
            result.pipelineValue += value;
            result.openCount += 1;
            const probability = determineProbability(opportunity);
            result.weightedPipeline += value * probability;
            probabilitySum += probability * 100;
            probabilityCount += 1;
        }
    });

    result.winRate = result.wonCount / Math.max(1, result.wonCount + result.lostCount);
    result.averageDealSize = result.wonCount ? result.wonRevenue / result.wonCount : 0;
    result.averageProbability = probabilityCount ? probabilitySum / probabilityCount : 0;

    return result;
}

function determineProbability(opportunity) {
    const stage = (opportunity.stage || '').toString();
    if (stage === 'Closed Won') {
        return 1;
    }
    if (stage === 'Closed Lost') {
        return 0;
    }
    const candidate = Number(opportunity.probability);
    if (Number.isFinite(candidate)) {
        return Math.min(Math.max(candidate, 0), 100) / 100;
    }
    return 0.5;
}

function calculatePipelineByStage(opportunities = []) {
    const stageOrder = ['Qualification', 'Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
    const stageMap = new Map();

    opportunities.forEach(opportunity => {
        const stage = (opportunity.stage || 'Інше').toString();
        const value = Number(opportunity.value) || 0;
        const probability = determineProbability(opportunity);

        if (!stageMap.has(stage)) {
            stageMap.set(stage, { stage, totalValue: 0, weightedValue: 0, count: 0 });
        }

        const entry = stageMap.get(stage);
        entry.totalValue += value;
        entry.weightedValue += value * probability;
        entry.count += 1;
    });

    return Array.from(stageMap.values())
        .map(entry => ({
            ...entry,
            lossRatio: entry.totalValue > 0 ? 1 - (entry.weightedValue / entry.totalValue) : 0
        }))
        .sort((a, b) => {
            const indexA = stageOrder.indexOf(a.stage);
            const indexB = stageOrder.indexOf(b.stage);
            if (indexA === -1 && indexB === -1) {
                return a.stage.localeCompare(b.stage);
            }
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
}

function calculateOwnerProductivity(opportunities = []) {
    const map = new Map();

    opportunities.forEach(opportunity => {
        const owner = opportunity.assigned_to || 'Без власника';
        const value = Number(opportunity.value) || 0;
        const probability = determineProbability(opportunity);
        const stage = (opportunity.stage || '').toString();

        if (!map.has(owner)) {
            map.set(owner, {
                owner,
                wonValue: 0,
                openPipeline: 0,
                deals: 0,
                wonDeals: 0,
                totalProbability: 0
            });
        }

        const entry = map.get(owner);
        entry.deals += 1;
        entry.totalProbability += probability;

        if (stage === 'Closed Won') {
            entry.wonDeals += 1;
            entry.wonValue += value;
        } else if (stage !== 'Closed Lost') {
            entry.openPipeline += value * probability;
        }
    });

    return Array.from(map.values())
        .map(entry => ({
            owner: entry.owner,
            wonValue: entry.wonValue,
            openPipeline: entry.openPipeline,
            deals: entry.deals,
            winRate: entry.deals ? entry.wonDeals / entry.deals : 0,
            averageProbability: entry.deals ? entry.totalProbability / entry.deals : 0
        }))
        .sort((a, b) => (b.wonValue || 0) - (a.wonValue || 0));
}

function calculateActivityMetrics(activities = []) {
    if (!Array.isArray(activities) || !activities.length) {
        return { total: 0, breakdown: [], topType: null, avgDuration: 0 };
    }

    const counts = new Map();
    let durationSum = 0;

    activities.forEach(activity => {
        const type = activity.type || 'Інше';
        const entry = counts.get(type) || { type, count: 0 };
        entry.count += 1;
        counts.set(type, entry);

        if (typeof activity.duration === 'number') {
            durationSum += activity.duration;
        }
    });

    const total = activities.length;
    const breakdown = Array.from(counts.values())
        .map(entry => ({
            type: entry.type,
            count: entry.count,
            percentage: total ? entry.count / total : 0
        }))
        .sort((a, b) => b.count - a.count);

    const topType = breakdown[0] || null;
    const avgDuration = total ? durationSum / total : 0;

    return { total, breakdown, topType, avgDuration };
}

function buildRevenueSeries(opportunities = []) {
    const monthly = new Map();

    opportunities.forEach(opportunity => {
        if (!opportunity.expected_close_date) {
            return;
        }

        const date = new Date(opportunity.expected_close_date);
        if (Number.isNaN(date.getTime())) {
            return;
        }

        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (!monthly.has(key)) {
            monthly.set(key, { month: key, actual: 0, weighted: 0 });
        }

        const entry = monthly.get(key);
        const value = Number(opportunity.value) || 0;
        const probability = determineProbability(opportunity);
        const stage = (opportunity.stage || '').toString();

        entry.weighted += value * probability;
        if (stage === 'Closed Won') {
            entry.actual += value;
        }
    });

    return Array.from(monthly.values()).sort((a, b) => a.month.localeCompare(b.month));
}

function generateRevenueForecast(series = []) {
    const predictions = [];
    if (!Array.isArray(series) || !series.length) {
        return {
            predictions,
            projectedNextQuarter: 0,
            trend: 'flat',
            trendLabel: 'Тренд: недостатньо даних',
            growthRate: 0
        };
    }

    const points = series.map((item, index) => ({ x: index, y: Number(item.weighted || 0) }));
    if (points.length === 1) {
        const baseValue = points[0].y;
        let monthCursor = parseMonthKey(series[0].month);
        for (let i = 0; i < 3; i++) {
            monthCursor = addMonths(monthCursor, 1);
            predictions.push({
                month: formatMonthKey(monthCursor),
                value: baseValue
            });
        }
        return {
            predictions,
            projectedNextQuarter: baseValue * 3,
            trend: 'flat',
            trendLabel: 'Тренд: стабільний',
            growthRate: 0
        };
    }

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    points.forEach(point => {
        sumX += point.x;
        sumY += point.y;
        sumXY += point.x * point.y;
        sumXX += point.x * point.x;
    });

    const n = points.length;
    const denominator = (n * sumXX) - (sumX * sumX);
    const slope = denominator !== 0 ? ((n * sumXY) - (sumX * sumY)) / denominator : 0;
    const intercept = (sumY - (slope * sumX)) / n;

    let monthCursor = parseMonthKey(series[series.length - 1].month);
    for (let i = 1; i <= 3; i++) {
        monthCursor = addMonths(monthCursor, 1);
        const predictionIndex = points[points.length - 1].x + i;
        const value = slope * predictionIndex + intercept;
        predictions.push({
            month: formatMonthKey(monthCursor),
            value: Math.max(0, value)
        });
    }

    const projectedNextQuarter = predictions.reduce((sum, item) => sum + (item.value || 0), 0);
    const lastWeighted = points[points.length - 1].y || 1;
    const growthRate = lastWeighted ? slope / lastWeighted : 0;
    let trendLabel = 'Тренд: стабільний';
    let trend = 'flat';

    if (growthRate > 0.01) {
        trend = 'up';
        trendLabel = `Тренд: зростання ${formatPercentage(growthRate)} на місяць`;
    } else if (growthRate < -0.01) {
        trend = 'down';
        trendLabel = `Тренд: зниження ${formatPercentage(Math.abs(growthRate))} на місяць`;
    }

    return {
        predictions,
        projectedNextQuarter,
        trend,
        trendLabel,
        growthRate
    };
}

function addMonths(date, months) {
    const next = new Date(date.getTime());
    next.setMonth(next.getMonth() + months);
    return next;
}

function formatMonthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function parseMonthKey(monthKey) {
    const [year, month] = (monthKey || '').split('-').map(Number);
    if (!year || !month) {
        return new Date();
    }
    return new Date(year, month - 1, 1);
}

function getMonthLabel(monthKey) {
    const date = parseMonthKey(monthKey);
    return date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

function calculateCampaignEffectiveness(performanceData = []) {
    const enriched = (performanceData || []).map(item => {
        const spend = Number(item.spend) || 0;
        const influencedRevenue = Number(item.influencedRevenue) || 0;
        const generatedLeads = Number(item.generatedLeads) || 0;
        const influencedDeals = Number(item.influencedDeals) || 0;
        const roi = spend ? influencedRevenue / spend : 0;
        const conversionRate = generatedLeads ? influencedDeals / generatedLeads : 0;
        const costPerLead = generatedLeads ? spend / generatedLeads : 0;

        return {
            ...item,
            roi,
            conversionRate,
            costPerLead
        };
    });

    const totalRevenue = enriched.reduce((sum, item) => sum + (item.influencedRevenue || 0), 0);
    const totalSpend = enriched.reduce((sum, item) => sum + (item.spend || 0), 0);
    const overallROI = totalSpend ? totalRevenue / totalSpend : 0;
    const topROI = enriched.slice().sort((a, b) => (b.roi || 0) - (a.roi || 0))[0] || null;
    const topEngagement = enriched.slice().sort((a, b) => (b.engagementRate || 0) - (a.engagementRate || 0))[0] || null;
    const averageConversion = enriched.length ? enriched.reduce((sum, item) => sum + (item.conversionRate || 0), 0) / enriched.length : 0;

    return {
        enriched,
        totalRevenue,
        totalSpend,
        overallROI,
        topROI,
        topEngagement,
        averageConversion
    };
}

function renderSalesAnalytics(context) {
    const ownerData = context.ownerProductivity || [];
    if (ownerData.length) {
        renderChartInstance('salesProductivityChart', {
            type: 'bar',
            data: {
                labels: ownerData.map(item => item.owner),
                datasets: [
                    {
                        label: 'Закрито',
                        data: ownerData.map(item => Number(item.wonValue || 0)),
                        backgroundColor: 'rgba(16, 185, 129, 0.85)',
                        borderRadius: 6
                    },
                    {
                        label: 'Активний pipeline',
                        data: ownerData.map(item => Number(item.openPipeline || 0)),
                        backgroundColor: 'rgba(59, 130, 246, 0.65)',
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: { legend: { position: 'bottom' } },
                scales: {
                    x: {
                        ticks: {
                            callback(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    }

    const insights = document.getElementById('salesInsights');
    if (!insights) {
        return;
    }

    if (!ownerData.length) {
        insights.innerHTML = '<p class="text-sm text-gray-500">У CRM ще немає достатньо угод для аналізу.</p>';
        return;
    }

    const leader = ownerData[0];
    const slowestStage = (context.pipelineByStage || []).slice().sort((a, b) => (b.lossRatio || 0) - (a.lossRatio || 0))[0];

    insights.innerHTML = `
        <div class="flex items-start space-x-3">
            <i class="fas fa-arrow-trend-up text-blue-500 mt-1"></i>
            <p><span class="font-medium text-gray-800">${leader.owner}</span> генерує ${formatCurrency(leader.wonValue || 0)} закритої виручки із win-rate ${formatPercentage(leader.winRate || 0)}.</p>
        </div>
        <div class="flex items-start space-x-3">
            <i class="fas fa-gauge-high text-emerald-500 mt-1"></i>
            <p>Середній чек по перемогах: <span class="font-medium text-gray-800">${formatCurrency(context.salesKPIs.averageDealSize || 0)}</span>.</p>
        </div>
        ${slowestStage ? `<div class="flex items-start space-x-3">
            <i class="fas fa-triangle-exclamation text-amber-500 mt-1"></i>
            <p>Найбільше втрат на стадії <span class="font-medium text-gray-800">${slowestStage.stage}</span> — ${formatPercentage(slowestStage.lossRatio || 0)} pipeline.</p>
        </div>` : ''}
    `;
}

function renderCampaignAnalytics(context) {
    const campaignData = context.campaignEffectiveness?.enriched || [];
    if (campaignData.length) {
        renderChartInstance('campaignPerformanceChart', {
            data: {
                labels: campaignData.map(item => item.name),
                datasets: [
                    {
                        type: 'bar',
                        label: 'ROI (x)',
                        data: campaignData.map(item => Number((item.roi || 0).toFixed(2))),
                        backgroundColor: 'rgba(251, 191, 36, 0.85)',
                        borderRadius: 6,
                        yAxisID: 'y'
                    },
                    {
                        type: 'line',
                        label: 'Конверсія %',
                        data: campaignData.map(item => Number(((item.conversionRate || 0) * 100).toFixed(1))),
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback(value) {
                                return `${value}x`;
                            }
                        }
                    },
                    y1: {
                        beginAtZero: true,
                        position: 'right',
                        grid: { drawOnChartArea: false },
                        ticks: {
                            callback(value) {
                                return `${value}%`;
                            }
                        }
                    }
                }
            }
        });
    }

    const insights = document.getElementById('campaignInsights');
    if (!insights) {
        return;
    }

    if (!campaignData.length) {
        insights.innerHTML = '<p class="text-sm text-gray-500">Поки немає маркетингових даних для аналізу.</p>';
        return;
    }

    const topROI = context.campaignEffectiveness.topROI;
    const topEngagement = context.campaignEffectiveness.topEngagement;
    const overallROI = context.campaignEffectiveness.overallROI || 0;
    const averageConversion = context.campaignEffectiveness.averageConversion || 0;
    const avgCpl = campaignData.reduce((sum, item) => sum + (item.costPerLead || 0), 0) / campaignData.length;

    insights.innerHTML = `
        <div class="flex items-start space-x-3">
            <i class="fas fa-bullhorn text-amber-500 mt-1"></i>
            <p>ROI портфелю: <span class="font-medium text-gray-800">x${overallROI.toFixed(1)}</span>. Середня вартість ліда — ${formatCurrency(avgCpl || 0)}.</p>
        </div>
        ${topROI ? `<div class="flex items-start space-x-3">
            <i class="fas fa-trophy text-yellow-500 mt-1"></i>
            <p>Найкраща кампанія — <span class="font-medium text-gray-800">${topROI.name}</span> з ROI x${topROI.roi.toFixed(1)} та конверсією ${formatPercentage(topROI.conversionRate || 0)}.</p>
        </div>` : ''}
        ${topEngagement ? `<div class="flex items-start space-x-3">
            <i class="fas fa-people-line text-blue-500 mt-1"></i>
            <p>Найвищий engagement (${formatPercentage(topEngagement.engagementRate || 0)}) у кампанії «${topEngagement.name}».</p>
        </div>` : ''}
        <div class="flex items-start space-x-3">
            <i class="fas fa-wave-square text-emerald-500 mt-1"></i>
            <p>Середня конверсія по кампаніях — ${formatPercentage(averageConversion || 0)}. Перевірте узгодженість сегментації та контенту.</p>
        </div>
    `;
}

function renderForecastAnalytics(context) {
    const series = context.revenueSeries || [];
    const forecast = context.forecast || { predictions: [] };

    if (series.length || (forecast.predictions && forecast.predictions.length)) {
        const historyLabels = series.map(item => getMonthLabel(item.month));
        const forecastLabels = (forecast.predictions || []).map(item => getMonthLabel(item.month));
        const labels = historyLabels.concat(forecastLabels);

        const actualData = [];
        const weightedData = [];
        const forecastData = [];

        series.forEach(item => {
            actualData.push(Number(item.actual || 0));
            weightedData.push(Number(item.weighted || 0));
            forecastData.push(null);
        });

        (forecast.predictions || []).forEach(prediction => {
            actualData.push(null);
            weightedData.push(null);
            forecastData.push(Number(Math.max(prediction.value || 0, 0)));
        });

        renderChartInstance('revenueForecastChart', {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Фактична виручка',
                        data: actualData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.4,
                        spanGaps: true
                    },
                    {
                        label: 'Ймовірна виручка',
                        data: weightedData,
                        borderColor: '#2563eb',
                        backgroundColor: 'rgba(37, 99, 235, 0.08)',
                        borderDash: [6, 6],
                        tension: 0.4,
                        spanGaps: true
                    },
                    {
                        label: 'AI прогноз',
                        data: forecastData,
                        borderColor: '#f97316',
                        backgroundColor: 'rgba(249, 115, 22, 0.1)',
                        borderDash: [4, 4],
                        tension: 0.4,
                        spanGaps: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                },
                scales: {
                    y: {
                        ticks: {
                            callback(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    }

    const summary = document.getElementById('forecastSummary');
    if (!summary) {
        return;
    }

    if (!series.length && !(forecast.predictions && forecast.predictions.length)) {
        summary.innerHTML = '<p class="text-sm text-gray-500">Накопичіть більше даних, щоб побачити прогноз.</p>';
        return;
    }

    const nextMonth = forecast.predictions && forecast.predictions[0] ? forecast.predictions[0] : null;
    const lastWeighted = series.length ? series[series.length - 1].weighted : 0;
    const delta = nextMonth ? (nextMonth.value || 0) - (lastWeighted || 0) : 0;
    const coverageRatio = forecast.projectedNextQuarter ? (context.salesKPIs.weightedPipeline || 0) / forecast.projectedNextQuarter : 0;

    const cards = [
        {
            label: 'Наступний квартал',
            value: formatCurrency(forecast.projectedNextQuarter || 0),
            helper: forecast.trendLabel || 'Тренд: стабільний',
            icon: 'fa-chart-line',
            accent: 'bg-indigo-50 text-indigo-600'
        },
        {
            label: nextMonth ? `Прогноз на ${getMonthLabel(nextMonth.month)}` : 'Прогноз на наступний місяць',
            value: formatCurrency(nextMonth ? nextMonth.value || 0 : 0),
            helper: nextMonth ? `Δ до поточного: ${formatCurrency(delta)} (${formatPercentage(lastWeighted ? delta / lastWeighted : 0)})` : 'Очікуємо нові дані',
            icon: 'fa-calendar-days',
            accent: 'bg-emerald-50 text-emerald-600'
        },
        {
            label: 'Покриття pipeline',
            value: formatPercentage(coverageRatio || 0),
            helper: `Зважений pipeline: ${formatCurrency(context.salesKPIs.weightedPipeline || 0)}`,
            icon: 'fa-diagram-project',
            accent: 'bg-blue-50 text-blue-600'
        }
    ];

    summary.innerHTML = cards.map(card => `
        <div class="border border-gray-100 rounded-xl bg-white p-4 shadow-sm">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-xs uppercase tracking-wide text-gray-500">${card.label}</p>
                    <p class="mt-2 text-xl font-semibold text-gray-800">${card.value}</p>
                </div>
                <span class="w-10 h-10 rounded-lg flex items-center justify-center ${card.accent}">
                    <i class="fas ${card.icon}"></i>
                </span>
            </div>
            <p class="mt-3 text-xs text-gray-500">${card.helper}</p>
        </div>
    `).join('');
}

function renderAIInsights(context) {
    const container = document.getElementById('aiRecommendations');
    if (!container) {
        return;
    }

    const recommendations = generateAIRecommendations(context);

    if (!recommendations.length) {
        container.innerHTML = '<div class="border border-dashed border-gray-300 rounded-lg p-4 text-sm text-gray-500 bg-gray-50">Поки що недостатньо даних для AI-висновків.</div>';
        return;
    }

    container.innerHTML = recommendations.map(rec => `
        <div class="border border-gray-200 rounded-lg p-4 hover:border-blue-200 transition-colors">
            <div class="flex items-center justify-between text-xs uppercase tracking-wide font-semibold text-blue-500">
                <span>AI Insight</span>
                <span class="text-gray-400 normal-case">${rec.impact || ''}</span>
            </div>
            <h4 class="mt-2 text-base font-semibold text-gray-800">${rec.title}</h4>
            <p class="mt-2 text-sm text-gray-600 leading-relaxed">${rec.description}</p>
            ${rec.action ? `<p class="mt-3 text-sm text-blue-600"><i class="fas fa-lightbulb mr-2"></i>${rec.action}</p>` : ''}
        </div>
    `).join('');
}

function generateAIRecommendations(context) {
    const recommendations = [];
    const winRate = context.salesKPIs?.winRate || 0;
    const pipelineStages = context.pipelineByStage || [];
    const stageWithLoss = pipelineStages.slice().sort((a, b) => (b.lossRatio || 0) - (a.lossRatio || 0))[0];

    if (stageWithLoss) {
        if (winRate < 0.45) {
            recommendations.push({
                title: `Підсиліть стадію «${stageWithLoss.stage}»`,
                description: `Win-rate команди ${formatPercentage(winRate)}. На стадії «${stageWithLoss.stage}» втрачається ${formatPercentage(stageWithLoss.lossRatio || 0)} pipeline. Залучіть коучинг та контроль якості дзвінків.`,
                impact: 'High impact',
                action: 'Проведіть воркшоп зі скриптів та додайте критерії перевірки у чек-листи цього тижня.'
            });
        } else {
            recommendations.push({
                title: `Тримайте фокус на «${stageWithLoss.stage}»`,
                description: `Навіть із win-rate ${formatPercentage(winRate)} стадія «${stageWithLoss.stage}» має найбільший відтік (${formatPercentage(stageWithLoss.lossRatio || 0)}).`,
                impact: 'Monitor',
                action: 'Налаштуйте нагадування в Automation, щоб менеджери оновлювали наступні кроки після кожної зустрічі.'
            });
        }
    }

    const topCampaign = context.campaignEffectiveness?.topROI;
    if (topCampaign) {
        recommendations.push({
            title: `Масштабуйте кампанію «${topCampaign.name}»`,
            description: `ROI x${topCampaign.roi.toFixed(1)} з конверсією ${formatPercentage(topCampaign.conversionRate || 0)} та CPL ${formatCurrency(topCampaign.costPerLead || 0)}. Це найшвидший драйвер виручки.`,
            impact: 'Revenue growth',
            action: 'Розширте сегменти кампанії та синхронізуйтеся з sales щодо follow-up сценаріїв.'
        });
    }

    const growthRate = context.forecast?.growthRate || 0;
    const nextMonth = context.forecast?.predictions && context.forecast.predictions[0];
    if (nextMonth) {
        if (growthRate < 0) {
            recommendations.push({
                title: 'Ризик просідання прогнозу',
                description: `AI прогнозує падіння на ${formatPercentage(Math.abs(growthRate))} у ${getMonthLabel(nextMonth.month)}. Зосередьтесь на угодах з найвищою ймовірністю.`,
                impact: 'Forecast risk',
                action: 'Додайте 2-3 пріоритетні угоди до воркфлоу рев’ю та посильте follow-up через Automation.'
            });
        } else if (growthRate > 0.08) {
            recommendations.push({
                title: 'Підтримайте позитивний тренд',
                description: `Очікується приріст ~${formatPercentage(growthRate)} наступного місяця. Забезпечте команду ресурсами та контентом.`,
                impact: 'Growth opportunity',
                action: 'Перевірте завантаження команди та підготуйте матеріали для фінальних презентацій.'
            });
        }
    }

    const owners = context.ownerProductivity || [];
    if (owners.length > 1) {
        const leader = owners[0];
        const totalWon = owners.reduce((sum, item) => sum + (item.wonValue || 0), 0);
        const leaderShare = totalWon ? (leader.wonValue || 0) / totalWon : 0;
        if (leaderShare > 0.6) {
            recommendations.push({
                title: 'Збалансуйте навантаження між менеджерами',
                description: `${leader.owner} закриває ${formatPercentage(leaderShare)} всієї виручки. Це підвищує ризик залежності.`,
                impact: 'Operational',
                action: 'Перерозподіліть частину лідів та запустіть програму менторства для колег.'
            });
        }
    }

    return recommendations.slice(0, 4);
}

function formatPercentage(value, digits = 1) {
    if (!Number.isFinite(value)) {
        return '0%';
    }
    return `${(value * 100).toFixed(digits)}%`;
}

// Utility functions for additional modules
async function completeTask(taskId) {
    try {
        const response = await fetch(`tables/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                status: 'Completed',
                completed_date: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
        });
        
        if (response.ok) {
            showToast('Task marked as complete', 'success');
            loadTasks();
        }
    } catch (error) {
        console.error('Error completing task:', error);
        showToast('Failed to complete task', 'error');
    }
}

async function generateReport(type) {
    showLoading();
    try {
        let data, headers, filename;
        
        switch(type) {
            case 'contacts':
                const contactsResponse = await fetch('tables/contacts?limit=10000');
                const contactsData = await contactsResponse.json();
                data = contactsData.data;
                filename = 'contacts_report.csv';
                break;
                
            case 'sales':
                const oppsResponse = await fetch('tables/opportunities?limit=10000');
                const oppsData = await oppsResponse.json();
                data = oppsData.data;
                filename = 'sales_report.csv';
                break;
                
            case 'activities':
                const activitiesResponse = await fetch('tables/activities?limit=10000');
                const activitiesData = await activitiesResponse.json();
                data = activitiesData.data;
                filename = 'activities_report.csv';
                break;
        }
        
        if (data && data.length > 0) {
            const csv = convertToCSV(data);
            downloadCSV(csv, filename);
            showToast(`${type} report generated successfully`, 'success');
        } else {
            showToast('No data available for report', 'warning');
        }
        
    } catch (error) {
        console.error('Report generation error:', error);
        showToast('Failed to generate report', 'error');
    } finally {
        hideLoading();
    }
}

// Company management helpers
async function showCompanyForm(companyId = null) {
    const isEdit = Boolean(companyId);
    let company = {};

    if (isEdit) {
        showLoading();
        try {
            const response = await fetch(`tables/companies/${companyId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch company');
            }
            company = await response.json();
        } catch (error) {
            console.error('Error loading company:', error);
            showToast('Failed to load company details', 'error');
            return;
        } finally {
            hideLoading();
        }
    }

    const statusOptions = ['Active', 'Customer', 'Prospect', 'Partner', 'Inactive'];
    if (company.status && !statusOptions.includes(company.status)) {
        statusOptions.unshift(company.status);
    }

    const sizeOptions = ['Startup', 'Small (1-50)', 'Medium (51-200)', 'Large (201-1000)', 'Enterprise (1000+)'];
    if (company.size && !sizeOptions.includes(company.size)) {
        sizeOptions.unshift(company.size);
    }

    const selectedStatus = company.status || 'Active';

    showModal(isEdit ? 'Edit Company' : 'Add New Company', `
        <form id="companyForm" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Company Name *</label>
                    <input type="text" name="name" value="${company.name || ''}" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                    <input type="text" name="industry" value="${company.industry || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
                    <select name="size" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Select size...</option>
                        ${sizeOptions.map(size => `<option value="${size}" ${company.size === size ? 'selected' : ''}>${size}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select name="status" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        ${statusOptions.map(status => `<option value="${status}" ${selectedStatus === status ? 'selected' : ''}>${status}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Website</label>
                    <input type="url" name="website" value="${company.website || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="https://example.com">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input type="email" name="email" value="${company.email || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    <input type="tel" name="phone" value="${company.phone || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Annual Revenue (USD)</label>
                    <input type="number" min="0" step="1000" name="annual_revenue" value="${company.annual_revenue ?? ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="250000">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">CRM Owner</label>
                    <input type="text" name="owner" value="${company.owner || currentUser || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Account owner">
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">City</label>
                    <input type="text" name="city" value="${company.city || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">State / Region</label>
                    <input type="text" name="state" value="${company.state || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Country</label>
                    <input type="text" name="country" value="${company.country || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea name="notes" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Internal notes about this company">${company.notes || ''}</textarea>
            </div>

            <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Cancel
                </button>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    ${isEdit ? 'Update Company' : 'Create Company'}
                </button>
            </div>
        </form>
    `);

    document.getElementById('companyForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        await saveCompany(companyId, new FormData(this));
    });
}

async function saveCompany(companyId, formData) {
    const data = {};
    for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed) {
                data[key] = trimmed;
            }
        } else if (value !== undefined && value !== null) {
            data[key] = value;
        }
    }

    if (!data.name) {
        showToast('Company name is required', 'error');
        return;
    }

    if (typeof data.annual_revenue === 'string') {
        const numericRevenue = Number(data.annual_revenue.replace(/[^0-9.\-]/g, ''));
        if (Number.isFinite(numericRevenue)) {
            data.annual_revenue = numericRevenue;
        } else {
            delete data.annual_revenue;
        }
    }

    const nowIso = new Date().toISOString();
    data.updated_at = nowIso;
    if (!companyId) {
        data.created_at = nowIso;
        data.created_by = currentUser;
    }

    showLoading();
    try {
        const method = companyId ? 'PUT' : 'POST';
        const url = companyId ? `tables/companies/${companyId}` : 'tables/companies';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Save failed');
        }

        showToast(companyId ? 'Company updated successfully' : 'Company created successfully', 'success');
        closeModal();
        await loadCompanies();
    } catch (error) {
        console.error('Error saving company:', error);
        showToast('Failed to save company', 'error');
    } finally {
        hideLoading();
    }
}

async function viewCompany(id) {
    showLoading();
    try {
        const response = await fetch(`tables/companies/${id}`);
        if (!response.ok) {
            throw new Error('Not found');
        }
        const company = await response.json();

        const details = [
            { label: 'Industry', value: company.industry || '—' },
            { label: 'Size', value: company.size || '—' },
            { label: 'Status', value: company.status || '—' },
            { label: 'Phone', value: company.phone || '—' },
            { label: 'Email', value: company.email || '—' },
            { label: 'Website', value: company.website ? `<a href="${company.website}" target="_blank" class="text-blue-600 hover:text-blue-700">${company.website}</a>` : '—' },
            { label: 'City', value: company.city || '—' },
            { label: 'State / Region', value: company.state || '—' },
            { label: 'Country', value: company.country || '—' },
            { label: 'Annual Revenue', value: formatCurrency(company.annual_revenue) },
            { label: 'Owner', value: company.owner || '—' },
            { label: 'Notes', value: company.notes || '—' },
            { label: 'Created At', value: formatDate(company.created_at) },
            { label: 'Last Updated', value: formatDate(company.updated_at) }
        ];

        const detailHtml = details.map(detail => `
            <div class="p-4 bg-gray-50 rounded-lg">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">${detail.label}</p>
                <p class="mt-2 text-sm text-gray-800">${detail.value}</p>
            </div>
        `).join('');

        showModal('Company Details', `
            <div class="space-y-6">
                <div class="flex flex-col md:flex-row md:items-start md:justify-between md:space-x-6 space-y-4 md:space-y-0">
                    <div>
                        <h4 class="text-2xl font-semibold text-gray-800">${company.name || 'Unnamed Company'}</h4>
                        <div class="mt-2 flex items-center space-x-2 text-sm text-gray-600">
                            <span class="px-2 py-1 rounded-full ${getStatusClass(company.status)}">${company.status || '—'}</span>
                            ${company.owner ? `<span>Owned by <span class="font-medium text-gray-700">${company.owner}</span></span>` : ''}
                        </div>
                    </div>
                    <div class="flex space-x-3">
                        <button onclick="showCompanyForm('${company.id}')" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">
                            Edit
                        </button>
                        <button onclick="deleteCompany('${company.id}')" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                            Delete
                        </button>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${detailHtml}
                </div>
            </div>
        `);
    } catch (error) {
        console.error('Error viewing company:', error);
        showToast('Failed to load company', 'error');
    } finally {
        hideLoading();
    }
}

async function editCompany(id) {
    await showCompanyForm(id);
}

async function deleteCompany(id) {
    const confirmed = confirm('Are you sure you want to delete this company?');
    if (!confirmed) {
        return;
    }

    showLoading();
    try {
        const response = await fetch(`tables/companies/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            throw new Error('Delete failed');
        }
        showToast('Company deleted successfully', 'success');
        closeModal();
        await loadCompanies();
    } catch (error) {
        console.error('Error deleting company:', error);
        showToast('Failed to delete company', 'error');
    } finally {
        hideLoading();
    }
}

async function exportCompanies() {
    showLoading();
    try {
        const response = await fetch('tables/companies?limit=10000');
        if (!response.ok) {
            throw new Error('Failed to export');
        }
        const data = await response.json();
        const companies = data.data || [];

        if (companies.length === 0) {
            showToast('No companies available to export', 'warning');
            return;
        }

        const csv = convertToCSV(companies);
        downloadCSV(csv, 'companies.csv');
        showToast('Companies exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting companies:', error);
        showToast('Failed to export companies', 'error');
    } finally {
        hideLoading();
    }
}

async function showLeadForm(leadId = null) {
    const isEdit = Boolean(leadId);
    let lead = {};

    if (isEdit) {
        showLoading();
        try {
            const response = await fetch(`tables/leads/${leadId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch lead');
            }
            lead = await response.json();
        } catch (error) {
            console.error('Error loading lead:', error);
            showToast('Failed to load lead details', 'error');
            hideLoading();
            return;
        }
        hideLoading();
    }

    let companies = [];
    try {
        const response = await fetch('tables/companies?limit=1000');
        if (response.ok) {
            const data = await response.json();
            companies = Array.isArray(data.data) ? data.data : [];
        }
    } catch (error) {
        console.warn('Unable to fetch companies for lead form:', error);
    }

    const statusOptions = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];
    if (lead.status && !statusOptions.includes(lead.status)) {
        statusOptions.unshift(lead.status);
    }

    const priorityOptions = ['Low', 'Medium', 'High', 'Critical'];
    if (lead.priority && !priorityOptions.includes(lead.priority)) {
        priorityOptions.unshift(lead.priority);
    }

    const sourceOptions = ['Website', 'Referral', 'Email Campaign', 'Conference', 'Cold Call', 'Social Media', 'Partner', 'Advertisement', 'Event', 'Other'];
    if (lead.source && !sourceOptions.includes(lead.source)) {
        sourceOptions.unshift(lead.source);
    }

    const selectedStatus = lead.status || 'New';
    const selectedPriority = lead.priority || 'Medium';
    const selectedSource = lead.source || '';
    const expectedCloseDate = lead.expected_close_date
        ? new Date(lead.expected_close_date).toISOString().split('T')[0]
        : '';

    const companyOptionsHtml = companies
        .map(company => `<option value="${company.name || ''}"></option>`)
        .join('');

    showModal(isEdit ? 'Edit Lead' : 'Add New Lead', `
        <form id="leadForm" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Lead Title *</label>
                    <input type="text" name="title" value="${lead.title || ''}" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select name="status" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        ${statusOptions.map(status => `<option value="${status}" ${selectedStatus === status ? 'selected' : ''}>${status}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Value (USD)</label>
                    <input type="number" min="0" step="100" name="value" value="${lead.value ?? ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="25000">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select name="priority" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        ${priorityOptions.map(priority => `<option value="${priority}" ${selectedPriority === priority ? 'selected' : ''}>${priority}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Probability (%)</label>
                    <input type="number" name="probability" min="0" max="100" step="1" value="${lead.probability ?? ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="50">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Expected Close Date</label>
                    <input type="date" name="expected_close_date" value="${expectedCloseDate}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                    <input type="text" name="assigned_to" value="${lead.assigned_to || currentUser || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Team member">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Lead Source</label>
                    <select name="source" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Select source...</option>
                        ${sourceOptions.map(source => `<option value="${source}" ${selectedSource === source ? 'selected' : ''}>${source}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Company</label>
                <input type="text" name="company_name" list="leadCompanyOptions" value="${lead.company_name || ''}"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Linked company">
                <datalist id="leadCompanyOptions">
                    ${companyOptionsHtml}
                </datalist>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea name="description" rows="4"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Summary of the opportunity">${lead.description || ''}</textarea>
            </div>

            <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Cancel
                </button>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    ${isEdit ? 'Update Lead' : 'Create Lead'}
                </button>
            </div>
        </form>
    `);

    const form = document.getElementById('leadForm');
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        await saveLead(leadId, new FormData(form));
    });
}

async function saveLead(leadId, formData) {
    const data = {};
    for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed) {
                data[key] = trimmed;
            }
        } else if (value !== undefined && value !== null) {
            data[key] = value;
        }
    }

    if (!data.title) {
        showToast('Lead title is required', 'error');
        return;
    }

    if (!data.status) {
        data.status = 'New';
    }

    if (!data.priority) {
        data.priority = 'Medium';
    }

    if (typeof data.value === 'string') {
        const numericValue = Number(data.value.replace(/[^0-9.\-]/g, ''));
        if (Number.isFinite(numericValue)) {
            data.value = numericValue;
        } else {
            delete data.value;
        }
    }

    if (typeof data.probability === 'string') {
        const numericProbability = Number(data.probability);
        if (Number.isFinite(numericProbability)) {
            data.probability = Math.min(100, Math.max(0, Math.round(numericProbability)));
        } else {
            delete data.probability;
        }
    }

    if (data.expected_close_date) {
        const parsedDate = new Date(data.expected_close_date);
        if (Number.isNaN(parsedDate.getTime())) {
            delete data.expected_close_date;
        }
    }

    const nowIso = new Date().toISOString();
    data.updated_at = nowIso;
    if (!leadId) {
        data.created_at = nowIso;
        data.created_by = currentUser;
    }

    showLoading();
    try {
        const method = leadId ? 'PUT' : 'POST';
        const url = leadId ? `tables/leads/${leadId}` : 'tables/leads';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Save failed');
        }

        showToast(leadId ? 'Lead updated successfully' : 'Lead created successfully', 'success');
        closeModal();
        await loadLeads();
    } catch (error) {
        console.error('Error saving lead:', error);
        showToast('Failed to save lead', 'error');
    } finally {
        hideLoading();
    }
}

async function viewLead(id) {
    showLoading();
    try {
        const response = await fetch(`tables/leads/${id}`);
        if (!response.ok) {
            throw new Error('Not found');
        }
        const lead = await response.json();

        const expectedClose = lead.expected_close_date
            ? new Date(lead.expected_close_date).toLocaleDateString()
            : 'Not set';

        const detailItems = [
            { label: 'Value', value: formatCurrency(lead.value) },
            { label: 'Company', value: lead.company_name || '—' },
            { label: 'Assigned To', value: lead.assigned_to || '—' },
            { label: 'Lead Source', value: lead.source || '—' },
            { label: 'Expected Close', value: expectedClose },
            { label: 'Probability', value: lead.probability !== undefined ? `${lead.probability}%` : 'Not set' },
            { label: 'Created At', value: formatDate(lead.created_at) },
            { label: 'Last Updated', value: formatDate(lead.updated_at) }
        ];

        const detailHtml = detailItems.map(item => `
            <div class="p-4 bg-gray-50 rounded-lg">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">${item.label}</p>
                <p class="mt-2 text-sm text-gray-800">${item.value}</p>
            </div>
        `).join('');

        const badges = `
            <div class="mt-2 flex flex-wrap gap-2 text-sm text-gray-600">
                <span class="px-2 py-1 rounded-full ${getStatusClass(lead.status)}">${lead.status || '—'}</span>
                <span class="px-2 py-1 rounded-full ${getPriorityClass(lead.priority)}">${lead.priority || '—'}</span>
                ${lead.probability !== undefined ? `<span class="px-2 py-1 rounded-full bg-blue-100 text-blue-800">${lead.probability}% probability</span>` : ''}
            </div>
        `;

        showModal('Lead Details', `
            <div class="space-y-6">
                <div class="flex flex-col md:flex-row md:items-start md:justify-between md:space-x-6 space-y-4 md:space-y-0">
                    <div>
                        <h4 class="text-2xl font-semibold text-gray-800">${lead.title || 'Untitled Lead'}</h4>
                        ${badges}
                    </div>
                    <div class="flex space-x-3">
                        <button onclick="showLeadForm('${lead.id}')" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">
                            Edit
                        </button>
                        <button onclick="deleteLead('${lead.id}')" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                            Delete
                        </button>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${detailHtml}
                </div>
                ${lead.description ? `<div class="p-4 bg-gray-50 rounded-lg"><p class="text-sm text-gray-700 whitespace-pre-line">${lead.description}</p></div>` : ''}
            </div>
        `);
    } catch (error) {
        console.error('Error viewing lead:', error);
        showToast('Failed to load lead', 'error');
    } finally {
        hideLoading();
    }
}

async function editLead(id) {
    await showLeadForm(id);
}

async function deleteLead(id) {
    const confirmed = confirm('Are you sure you want to delete this lead?');
    if (!confirmed) {
        return;
    }

    showLoading();
    try {
        const response = await fetch(`tables/leads/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            throw new Error('Delete failed');
        }
        showToast('Lead deleted successfully', 'success');
        closeModal();
        await loadLeads();
    } catch (error) {
        console.error('Error deleting lead:', error);
        showToast('Failed to delete lead', 'error');
    } finally {
        hideLoading();
    }
}

// Additional module forms
async function showOpportunityForm(oppId = null) {
    const isEdit = Boolean(oppId);
    let opportunity = {};

    if (isEdit) {
        showLoading();
        try {
            const response = await fetch(`tables/opportunities/${oppId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch opportunity');
            }
            opportunity = await response.json();
        } catch (error) {
            console.error('Error loading opportunity:', error);
            showToast('Failed to load opportunity details', 'error');
            hideLoading();
            return;
        }
        hideLoading();
    }

    let companies = [];
    try {
        const response = await fetch('tables/companies?limit=1000');
        if (response.ok) {
            const data = await response.json();
            companies = Array.isArray(data.data) ? data.data : [];
        }
    } catch (error) {
        console.warn('Unable to fetch companies for opportunity form:', error);
    }

    const stageOptions = ['Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
    if (opportunity.stage && !stageOptions.includes(opportunity.stage)) {
        stageOptions.unshift(opportunity.stage);
    }

    const stageProbabilityDefaults = {
        'Qualification': 20,
        'Needs Analysis': 35,
        'Proposal': 55,
        'Negotiation': 75,
        'Closed Won': 100,
        'Closed Lost': 0
    };

    const selectedStage = opportunity.stage || 'Qualification';
    const expectedCloseDate = opportunity.expected_close_date
        ? new Date(opportunity.expected_close_date).toISOString().split('T')[0]
        : '';

    const probabilityValue = opportunity.probability ?? (stageProbabilityDefaults[selectedStage] ?? '');
    const companyOptionsHtml = companies
        .map(company => `<option value="${company.name || ''}"></option>`)
        .join('');

    showModal(isEdit ? 'Edit Opportunity' : 'Add New Opportunity', `
        <form id="opportunityForm" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Opportunity Name *</label>
                    <input type="text" name="name" value="${opportunity.name || ''}" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Stage</label>
                    <select name="stage" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        ${stageOptions.map(stage => `<option value="${stage}" ${selectedStage === stage ? 'selected' : ''}>${stage}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Value (USD)</label>
                    <input type="number" min="0" step="1000" name="value" value="${opportunity.value ?? ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="50000">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Probability (%)</label>
                    <input type="number" name="probability" min="0" max="100" step="1" value="${probabilityValue === '' ? '' : probabilityValue}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="60">
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Expected Close Date</label>
                    <input type="date" name="expected_close_date" value="${expectedCloseDate}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                    <input type="text" name="assigned_to" value="${opportunity.assigned_to || currentUser || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Team member">
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Company</label>
                <input type="text" name="company_name" list="opportunityCompanyOptions" value="${opportunity.company_name || ''}"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Linked company">
                <datalist id="opportunityCompanyOptions">
                    ${companyOptionsHtml}
                </datalist>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Next Step</label>
                <textarea name="next_step" rows="3"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="What needs to happen next?">${opportunity.next_step || ''}</textarea>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea name="description" rows="4"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Additional context for this opportunity">${opportunity.description || ''}</textarea>
            </div>

            <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button type="button" onclick="closeModal()" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                    Cancel
                </button>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    ${isEdit ? 'Update Opportunity' : 'Create Opportunity'}
                </button>
            </div>
        </form>
    `);

    const form = document.getElementById('opportunityForm');
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        await saveOpportunity(oppId, new FormData(form));
    });

    const stageSelect = form.querySelector('select[name="stage"]');
    const probabilityInput = form.querySelector('input[name="probability"]');

    const updateProbabilityForStage = () => {
        if (!stageSelect || !probabilityInput) {
            return;
        }

        const stage = stageSelect.value;
        if (stage === 'Closed Won') {
            probabilityInput.value = '100';
            probabilityInput.setAttribute('readonly', 'readonly');
        } else if (stage === 'Closed Lost') {
            probabilityInput.value = '0';
            probabilityInput.setAttribute('readonly', 'readonly');
        } else {
            probabilityInput.removeAttribute('readonly');
            if (!probabilityInput.value || probabilityInput.value === '0' || probabilityInput.value === '100') {
                const defaultValue = stageProbabilityDefaults[stage];
                if (defaultValue !== undefined) {
                    probabilityInput.value = defaultValue;
                }
            }
        }
    };

    stageSelect?.addEventListener('change', updateProbabilityForStage);
    updateProbabilityForStage();
}

async function saveOpportunity(oppId, formData) {
    const data = {};
    for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed) {
                data[key] = trimmed;
            }
        } else if (value !== undefined && value !== null) {
            data[key] = value;
        }
    }

    if (!data.name) {
        showToast('Opportunity name is required', 'error');
        return;
    }

    if (!data.stage) {
        data.stage = 'Qualification';
    }

    if (typeof data.value === 'string') {
        const numericValue = Number(data.value.replace(/[^0-9.\-]/g, ''));
        if (Number.isFinite(numericValue)) {
            data.value = numericValue;
        } else {
            delete data.value;
        }
    }

    if (typeof data.probability === 'string') {
        const numericProbability = Number(data.probability);
        if (Number.isFinite(numericProbability)) {
            data.probability = Math.min(100, Math.max(0, Math.round(numericProbability)));
        } else {
            delete data.probability;
        }
    }

    if (data.stage === 'Closed Won') {
        data.probability = 100;
    } else if (data.stage === 'Closed Lost') {
        data.probability = 0;
    }

    if (data.expected_close_date) {
        const parsedDate = new Date(data.expected_close_date);
        if (Number.isNaN(parsedDate.getTime())) {
            delete data.expected_close_date;
        }
    }

    const nowIso = new Date().toISOString();
    data.updated_at = nowIso;
    if (!oppId) {
        data.created_at = nowIso;
        data.created_by = currentUser;
    }

    showLoading();
    try {
        const method = oppId ? 'PUT' : 'POST';
        const url = oppId ? `tables/opportunities/${oppId}` : 'tables/opportunities';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Save failed');
        }

        showToast(oppId ? 'Opportunity updated successfully' : 'Opportunity created successfully', 'success');
        closeModal();
        await loadOpportunities();
    } catch (error) {
        console.error('Error saving opportunity:', error);
        showToast('Failed to save opportunity', 'error');
    } finally {
        hideLoading();
    }
}

function normalizeRelatedFieldValue(value) {
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
}

async function fetchRelatedRecordsForLinking() {
    const parseListResponse = async response => {
        if (!response || !response.ok) {
            return [];
        }
        try {
            const payload = await response.json();
            if (Array.isArray(payload)) {
                return payload;
            }
            if (Array.isArray(payload.data)) {
                return payload.data;
            }
            return [];
        } catch (error) {
            console.warn('Unable to parse related records response:', error);
            return [];
        }
    };

    try {
        const [leadsResponse, opportunitiesResponse, companiesResponse, contactsResponse] = await Promise.all([
            fetch('tables/leads?limit=1000'),
            fetch('tables/opportunities?limit=1000'),
            fetch('tables/companies?limit=1000'),
            fetch('tables/contacts?limit=1000')
        ]);

        const [leads, opportunities, companies, contacts] = await Promise.all([
            parseListResponse(leadsResponse),
            parseListResponse(opportunitiesResponse),
            parseListResponse(companiesResponse),
            parseListResponse(contactsResponse)
        ]);

        return { leads, opportunities, companies, contacts };
    } catch (error) {
        console.warn('Unable to fetch related records for linking:', error);
        return { leads: [], opportunities: [], companies: [], contacts: [] };
    }
}

async function buildRelatedRecordOptions(selectedValue) {
    const normalizedSelected = normalizeRelatedFieldValue(selectedValue);
    const { leads, opportunities, companies, contacts } = await fetchRelatedRecordsForLinking();
    let hasSelectedOption = false;

    const createOption = (value, label) => {
        if (value === undefined || value === null || !label) {
            return '';
        }
        const optionValue = String(value);
        const isSelected = normalizedSelected && optionValue === normalizedSelected;
        if (isSelected) {
            hasSelectedOption = true;
        }
        return `<option value="${optionValue}" ${isSelected ? 'selected' : ''}>${label}</option>`;
    };

    const buildGroupOptions = (label, items, labelBuilder) => {
        if (!Array.isArray(items) || items.length === 0) {
            return '';
        }
        const options = items
            .map(item => createOption(item.id, labelBuilder(item)))
            .filter(Boolean)
            .join('');
        return options ? `<optgroup label="${label}">${options}</optgroup>` : '';
    };

    const opportunityOptionsHtml = buildGroupOptions('Opportunities', opportunities, opportunity => {
        const name = opportunity?.name || 'Untitled Opportunity';
        const companySuffix = opportunity?.company_name ? ` – ${opportunity.company_name}` : '';
        return `${name}${companySuffix}`;
    });

    const leadOptionsHtml = buildGroupOptions('Leads', leads, lead => {
        const title = lead?.title || 'Untitled Lead';
        const companySuffix = lead?.company_name ? ` – ${lead.company_name}` : '';
        return `${title}${companySuffix}`;
    });

    const companyOptionsHtml = buildGroupOptions('Companies', companies, company => company?.name || 'Unnamed Company');

    const contactOptionsHtml = buildGroupOptions('Contacts', contacts, contact => {
        const fullName = [contact?.first_name, contact?.last_name].filter(Boolean).join(' ');
        const fallback = contact?.email || contact?.phone || 'Contact';
        const name = fullName || fallback;
        const companySuffix = contact?.company_name ? ` – ${contact.company_name}` : '';
        return `${name}${companySuffix}`;
    });

    let relatedOptionsHtml = [
        opportunityOptionsHtml,
        leadOptionsHtml,
        companyOptionsHtml,
        contactOptionsHtml
    ].filter(Boolean).join('');

    if (normalizedSelected && !hasSelectedOption) {
        relatedOptionsHtml = `<option value="${normalizedSelected}" selected>Current link (${normalizedSelected})</option>` + relatedOptionsHtml;
    }

    return relatedOptionsHtml;
}

function formatDateTimeLocal(dateValue) {
    if (!dateValue) {
        return '';
    }
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (Number.isNaN(date.getTime())) {
        return '';
    }
    const pad = number => String(number).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

async function showTaskForm(taskId = null) {
    const isEdit = Boolean(taskId);
    let task = {};

    if (isEdit) {
        showLoading();
        try {
            const response = await fetch(`tables/tasks/${taskId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch task');
            }
            task = await response.json();
        } catch (error) {
            console.error('Error loading task:', error);
            showToast('Failed to load task details', 'error');
            hideLoading();
            return;
        }
        hideLoading();
    }

    const relatedOptionsHtml = await buildRelatedRecordOptions(task.related_to);

    const statusOptions = ['Not Started', 'In Progress', 'Completed', 'Cancelled'];
    if (task.status && !statusOptions.includes(task.status)) {
        statusOptions.unshift(task.status);
    }

    const priorityOptions = ['Low', 'Medium', 'High', 'Critical'];
    if (task.priority && !priorityOptions.includes(task.priority)) {
        priorityOptions.unshift(task.priority);
    }

    const typeOptions = ['Task', 'Call', 'Email', 'Meeting', 'Follow-up', 'Proposal', 'Demo', 'Planning', 'Documentation', 'Research', 'Other'];
    if (task.type && !typeOptions.includes(task.type)) {
        typeOptions.unshift(task.type);
    }

    const selectedStatus = task.status || 'Not Started';
    const selectedPriority = task.priority || 'Medium';
    const selectedType = task.type || 'Task';
    const dueDate = task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : '';

    showModal(isEdit ? 'Edit Task' : 'Add New Task', `
        <form id="taskForm" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Task Title *</label>
                    <input type="text" name="title" value="${task.title || ''}" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           placeholder="Follow up with client">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Task Type</label>
                    <select name="type" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        ${typeOptions.map(type => `<option value="${type}" ${selectedType === type ? 'selected' : ''}>${type}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select name="priority" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        ${priorityOptions.map(priority => `<option value="${priority}" ${selectedPriority === priority ? 'selected' : ''}>${priority}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select name="status" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        ${statusOptions.map(status => `<option value="${status}" ${selectedStatus === status ? 'selected' : ''}>${status}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                    <input type="date" name="due_date" value="${dueDate}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                    <input type="text" name="assigned_to" value="${task.assigned_to || currentUser || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           placeholder="Team member">
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Related Record</label>
                <select name="related_to" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Not linked</option>
                    ${relatedOptionsHtml}
                </select>
                <p class="mt-1 text-xs text-gray-500">Link the task to a lead, opportunity, company or contact to keep context together.</p>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea name="description" rows="4"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Add more details about the task">${task.description || ''}</textarea>
            </div>

            <div class="flex justify-end space-x-3">
                <button type="button" onclick="closeModal()" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">
                    Cancel
                </button>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    ${isEdit ? 'Update Task' : 'Create Task'}
                </button>
            </div>
        </form>
    `);

    const form = document.getElementById('taskForm');
    form.addEventListener('submit', async event => {
        event.preventDefault();
        await saveTask(taskId, new FormData(form));
    });
}

async function saveTask(taskId, formData) {
    const data = {};
    for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed) {
                data[key] = trimmed;
            }
        } else if (value !== undefined && value !== null) {
            data[key] = value;
        }
    }

    if (!data.title) {
        showToast('Task title is required', 'error');
        return;
    }

    if (!data.type) {
        data.type = 'Task';
    }

    if (!data.priority) {
        data.priority = 'Medium';
    }

    if (!data.status) {
        data.status = 'Not Started';
    }

    if (!data.assigned_to && currentUser) {
        data.assigned_to = currentUser;
    }

    if (data.due_date) {
        const parsedDate = new Date(data.due_date);
        if (Number.isNaN(parsedDate.getTime())) {
            delete data.due_date;
        }
    }

    if (data.related_to === '') {
        delete data.related_to;
    }

    const nowIso = new Date().toISOString();
    data.updated_at = nowIso;
    if (!taskId) {
        data.created_at = nowIso;
        data.created_by = currentUser;
    }

    showLoading();
    try {
        const method = taskId ? 'PUT' : 'POST';
        const url = taskId ? `tables/tasks/${taskId}` : 'tables/tasks';
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Save failed');
        }

        showToast(taskId ? 'Task updated successfully' : 'Task created successfully', 'success');
        closeModal();
        await loadTasks();
    } catch (error) {
        console.error('Error saving task:', error);
        showToast('Failed to save task', 'error');
    } finally {
        hideLoading();
    }
}

async function showActivityForm(activityId = null) {
    const isEdit = Boolean(activityId);
    let activity = {};

    if (isEdit) {
        showLoading();
        try {
            const response = await fetch(`tables/activities/${activityId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch activity');
            }
            activity = await response.json();
        } catch (error) {
            console.error('Error loading activity:', error);
            showToast('Failed to load activity details', 'error');
            return;
        } finally {
            hideLoading();
        }
    }

    const typeOptions = ['Call', 'Email', 'Meeting', 'Note', 'Task', 'Appointment', 'Document', 'Other'];
    if (activity.type && !typeOptions.includes(activity.type)) {
        typeOptions.unshift(activity.type);
    }
    const selectedType = activity.type || 'Call';

    const outcomeOptions = ['Positive', 'Neutral', 'Negative', 'Completed', 'In progress', 'Awaiting response', 'Follow-up scheduled', 'No answer', 'Action items assigned', 'Other'];
    if (activity.outcome && !outcomeOptions.includes(activity.outcome)) {
        outcomeOptions.unshift(activity.outcome);
    }
    const selectedOutcome = activity.outcome || '';

    const datetimeValue = formatDateTimeLocal(activity.date || new Date());
    const durationValue = activity.duration !== undefined && activity.duration !== null ? activity.duration : '';
    const relatedOptionsHtml = await buildRelatedRecordOptions(activity.related_to);

    showModal(isEdit ? 'Edit Activity' : 'Log Activity', `
        <form id="activityForm" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Activity Type</label>
                    <select name="type" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                        ${typeOptions.map(type => `<option value="${type}" ${selectedType === type ? 'selected' : ''}>${type}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                    <input type="text" name="subject" value="${activity.subject || ''}" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           placeholder="Follow-up call with client">
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Date & Time *</label>
                    <input type="datetime-local" name="date" value="${datetimeValue}" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                    <input type="text" name="assigned_to" value="${activity.assigned_to || currentUser || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           placeholder="Team member">
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                    <input type="number" name="duration" min="0" step="5" value="${durationValue}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           placeholder="30">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Outcome</label>
                    <select name="outcome" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <option value="">Not specified</option>
                        ${outcomeOptions.map(outcome => `<option value="${outcome}" ${selectedOutcome === outcome ? 'selected' : ''}>${outcome}</option>`).join('')}
                    </select>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Related Record</label>
                <select name="related_to" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Not linked</option>
                    ${relatedOptionsHtml}
                </select>
                <p class="mt-1 text-xs text-gray-500">Link the activity to a lead, opportunity, company or contact to keep context together.</p>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea name="description" rows="4"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Add notes about the conversation or outcome">${activity.description || ''}</textarea>
            </div>

            <div class="flex justify-end space-x-3">
                <button type="button" onclick="closeModal()" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">
                    Cancel
                </button>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    ${isEdit ? 'Update Activity' : 'Log Activity'}
                </button>
            </div>
        </form>
    `);

    const form = document.getElementById('activityForm');
    form.addEventListener('submit', async event => {
        event.preventDefault();
        await saveActivity(activityId, new FormData(form));
    });
}

async function saveActivity(activityId, formData) {
    const data = {};
    for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed) {
                data[key] = trimmed;
            }
        } else if (value !== undefined && value !== null) {
            data[key] = value;
        }
    }

    if (!data.subject) {
        showToast('Activity subject is required', 'error');
        return;
    }

    if (!data.type) {
        data.type = 'Call';
    }

    if (data.date) {
        const parsedDate = new Date(data.date);
        if (Number.isNaN(parsedDate.getTime())) {
            showToast('Invalid date selected for the activity', 'error');
            return;
        }
        data.date = parsedDate.toISOString();
    } else {
        data.date = new Date().toISOString();
    }

    if (data.duration !== undefined) {
        const numericDuration = Number(data.duration);
        if (Number.isFinite(numericDuration) && numericDuration >= 0) {
            data.duration = numericDuration;
        } else {
            delete data.duration;
        }
    }

    if (!data.assigned_to && currentUser) {
        data.assigned_to = currentUser;
    }

    if (!data.outcome) {
        delete data.outcome;
    }

    if (!data.description) {
        delete data.description;
    }

    if (!data.related_to) {
        delete data.related_to;
    }

    const nowIso = new Date().toISOString();
    data.updated_at = nowIso;
    if (!activityId) {
        data.created_at = nowIso;
        data.created_by = currentUser;
    }

    showLoading();
    try {
        const method = activityId ? 'PUT' : 'POST';
        const url = activityId ? `tables/activities/${activityId}` : 'tables/activities';
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error('Save failed');
        }

        showToast(activityId ? 'Activity updated successfully' : 'Activity logged successfully', 'success');
        closeModal();
        await loadActivities();
    } catch (error) {
        console.error('Error saving activity:', error);
        showToast('Failed to save activity', 'error');
    } finally {
        hideLoading();
    }
}

// Marketing automation module data
const MARKETING_SEGMENTS = [
    {
        name: "Стратегічні B2B-клієнти",
        size: 120,
        share: "42% виручки",
        priority: "Стратегічний",
        growth: "+8% QoQ",
        description: "Компанії з виручкою понад $1 млн та циклом продажу 90+ днів. Потребують персонального супроводу та складних інтеграцій.",
        criteria: [
            "Рівень контактів: C-level або директор з розвитку",
            "Оцінка fit score > 75 у CRM",
            "Активна взаємодія з контентом (3+ переглядів демо)"
        ],
        needs: [
            "ROI-кейси для ради директорів",
            "Персональний solution workshop",
            "План поетапного впровадження"
        ],
        channels: [
            { type: "Email", detail: "Щомісячні executive-дайджести з аналітикою галузі" },
            { type: "SMS", detail: "Нагадування про стратегічні дзвінки за 24 години" },
            { type: "Месенджери", detail: "LinkedIn / Viber для погодження зустрічей з експертом" }
        ]
    },
    {
        name: "Швидкозростаючі стартапи",
        size: 210,
        share: "27% виручки",
        priority: "Високий потенціал",
        growth: "+21% QoQ",
        description: "Компанії Series A-B з невеликим відділом продажів, які шукають швидкий старт та автоматизацію.",
        criteria: [
            "Країни: EMEA та Північна Америка",
            "Активні ліди з джерела Product Hunt або партнерських вебінарів",
            "Цикл угоди < 45 днів"
        ],
        needs: [
            "Швидкий запуск та готові плейбуки",
            "Пакети інтеграцій без коду",
            "Прозоре ціноутворення та знижки за річну оплату"
        ],
        channels: [
            { type: "Email", detail: "Серія онбордингу з підказками та відео" },
            { type: "SMS", detail: "Тригери під час trial-періоду та перед закінченням" },
            { type: "Месенджери", detail: "WhatsApp-чат із success-менеджером для швидких питань" }
        ]
    },
    {
        name: "Клієнти на етапі повторної покупки",
        size: 95,
        share: "21% виручки",
        priority: "Утримання",
        growth: "+5% QoQ",
        description: "Існуючі клієнти з потенціалом апсейлу на модулі аналітики та CPQ.",
        criteria: [
            "Статус у CRM: Customer 12+ місяців",
            "Активні користувачі < 70% від куплених ліцензій",
            "Запити в підтримку щодо додаткових функцій"
        ],
        needs: [
            "План розвитку акаунта на 12 місяців",
            "Пакет навчальних сесій для нових користувачів",
            "ROI-докази для фінансової команди"
        ],
        channels: [
            { type: "Email", detail: "Квартальні health-check листи з usage-аналітикою" },
            { type: "SMS", detail: "Нагадування про закінчення контракту та опитування NPS" },
            { type: "Месенджери", detail: "Telegram-групи для продакт-апдейтів" }
        ]
    }
];

const MARKETING_CAMPAIGNS = [
    {
        name: "Lifecycle nurture · від заявки до продовження",
        status: "Активна",
        objective: "Зменшити час до першого value та збільшити конверсію в оплату на 20%.",
        owner: "Marketing Ops & Customer Success",
        audience: "Нові клієнти після демо та підписання договору",
        segments: ["Стратегічні B2B-клієнти", "Швидкозростаючі стартапи"],
        automation: [
            "Trigger: створення угоди у стадії «Closed Won»",
            "Гілка A: якщо adoption score < 50 – запуск серії підтримки",
            "Гілка B: якщо активовано 3+ ключових модулі – запит відгуку",
            "Webhook: оновлення health-score у CRM"
        ],
        channels: [
            { type: "Email", frequency: "Day 0 / 3 / 7 / 21", purpose: "Онбординг, туторіали та чек-листи" },
            { type: "SMS", frequency: "Перед live-сесіями та за 1 день до завершення trial", purpose: "Нагадування про наступний крок" },
            { type: "Месенджери", frequency: "Щотижня у WhatsApp / Viber", purpose: "Особисті апдейти від Customer Success" }
        ],
        metrics: ["Активні користувачі в перші 30 днів", "Час до першого успішного сценарію", "NPS після 45 днів"]
    },
    {
        name: "Account-based програма для стратегічних клієнтів",
        status: "Підготовка",
        objective: "Виявити нові підрозділи для апсейлу та збільшити середній чек.",
        owner: "ABM-команда",
        audience: "Enterprise-акаунти з ARR > $50k",
        segments: ["Стратегічні B2B-клієнти"],
        automation: [
            "Trigger: оновлення стадії угоди до «Negotiation»",
            "Signal: акаунт має 2+ champion’ів",
            "Action: створення задачі для sales + запуск персонального контенту",
            "Sync: двосторонній список у LinkedIn Ads"
        ],
        channels: [
            { type: "Email", frequency: "Щомісячно", purpose: "Персоналізовані executive-briefing’и" },
            { type: "Месенджери", frequency: "Щотижневі LinkedIn InMail", purpose: "Координація з decision maker’ами" },
            { type: "SMS", frequency: "Перед воркшопами", purpose: "Підтвердження участі ключових стейкхолдерів" }
        ],
        metrics: ["Кількість залучених champion’ів", "Заплановані воркшопи", "Pipeline influenced revenue"]
    },
    {
        name: "Reactivation sprint · повернення неактивних користувачів",
        status: "Активна",
        objective: "Повернути 15% неактивних контактів та прогріти їх до повторної покупки.",
        owner: "Growth Marketing",
        audience: "Користувачі без активності 60+ днів",
        segments: ["Швидкозростаючі стартапи", "Клієнти на етапі повторної покупки"],
        automation: [
            "Trigger: activity score < 20 протягом 45 днів",
            "Умова: статус угоди ≠ Closed Lost",
            "Динаміка: припиняти серію після відповіді в месенджері",
            "Завершення: передати ліда у SDR через Slack webhook"
        ],
        channels: [
            { type: "Email", frequency: "3 листи протягом 10 днів", purpose: "Персоналізовані кейси та відновлення trial" },
            { type: "Месенджери", frequency: "Telegram / Facebook Messenger", purpose: "Бот з діагностикою потреб" },
            { type: "SMS", frequency: "Дні 2 та 7", purpose: "Купон на консультацію та нагадування про дедлайн" }
        ],
        metrics: ["Відкриття листів", "Відповіді в месенджерах", "Повторні демо"]
    }
];

const CUSTOMER_JOURNEYS = [
    {
        name: "Enterprise Success Journey",
        trigger: "Коли угода переходить у стадію «Closed Won»",
        goal: "Активація ключових користувачів і підготовка до апсейлу на 6 місяць",
        owner: "Customer Success",
        stages: [
            {
                title: "Активація 0-14 днів",
                description: "Головна мета — провести запуск та навчити champion’ів.",
                actions: [
                    "Email: welcome-лист від CEO з записом воркшопу",
                    "SMS: нагадування про стартову сесію за 24 години",
                    "Месенджер: представлення менеджера у WhatsApp / Teams"
                ],
                kpis: ["% акаунтів зі стартовим воркшопом", "Середній час до першої інтеграції"]
            },
            {
                title: "Успіх 15-45 днів",
                description: "Побудувати регулярне використання та збір фідбеку.",
                actions: [
                    "Email: серія з кейсами та advanced-підказками",
                    "In-app + месенджер: чек-ін від CSM після 30 днів",
                    "SMS: NPS-опитування на 45 день"
                ],
                kpis: ["Active seats / purchased seats", "NPS > 40"]
            },
            {
                title: "Розширення 46-120 днів",
                description: "Підготувати апсейл на модулі аналітики.",
                actions: [
                    "Email: ROI-розрахунок за даними CRM",
                    "Месенджер: спільний план розвитку акаунта",
                    "Вебінар: демонстрація аналітичного модуля для нових стейкхолдерів"
                ],
                kpis: ["Заплановані розширення", "Додатковий ARR у прогнозі"]
            }
        ]
    },
    {
        name: "Product-led journey для стартапів",
        trigger: "Реєстрація у trial через лендинг або партнерський канал",
        goal: "Конвертувати trial у оплату протягом 21 дня",
        owner: "Growth Team",
        stages: [
            {
                title: "Активація день 0-3",
                description: "Вивести користувача на перший aha-moment.",
                actions: [
                    "Email: серія запуску з відео та чек-листом",
                    "In-app message + месенджер-бот: налаштування інтеграцій",
                    "SMS: нагадування про завершення налаштування на 3 день"
                ],
                kpis: ["Completed onboarding checklist", "Активовані інтеграції"]
            },
            {
                title: "Конверсія день 4-14",
                description: "Показати бізнес-цінність та стимулювати оплату.",
                actions: [
                    "Email: кейси клієнтів у схожій галузі",
                    "Месенджер: персональна пропозиція від SDR",
                    "SMS: промо-код на знижку при оплаті до 14 дня"
                ],
                kpis: ["Trial-to-paid conversion", "Відгуки на месенджерні пропозиції"]
            },
            {
                title: "Утримання день 15-21",
                description: "Запобігти відтоку та зібрати заперечення.",
                actions: [
                    "Email: опитування щодо досвіду використання",
                    "Месенджер: швидкі відповіді на бар’єри у Telegram",
                    "SMS: нагадування про фінальний демо-дзвінок"
                ],
                kpis: ["Retention після 30 дня", "Причини відмови, зафіксовані у CRM"]
            }
        ]
    }
];

const MARKETING_TEMPLATES = [
    {
        channel: "Email",
        name: "Executive briefing для C-level",
        cadence: "Щомісяця, перший вівторок",
        description: "Преміум-розсилання з трендами ринку та кастомними метриками клієнта.",
        structure: [
            "Персоналізоване звернення з згадкою KPI акаунта",
            "Блок з галузевою аналітикою та порівнянням бенчмарків",
            "Кейс успішного клієнта + CTA на стратсесію"
        ],
        recommendation: "Сегмент: стратегічні B2B-клієнти. Використовувати динамічний контент через HubSpot smart fields."
    },
    {
        channel: "SMS",
        name: "Trigger-нагадування про ключову дію",
        cadence: "Автоматично після події у CRM",
        description: "Коротке повідомлення для нагадування про наступний крок у journey.",
        structure: [
            "Назва продукту + ім’я менеджера",
            "Конкретна дія з дедлайном",
            "Посилання на ресурс або CTA для відповіді"
        ],
        recommendation: "Сегменти: швидкозростаючі стартапи, клієнти на повторній покупці. Надсилати з 9:00 до 18:00 за часовим поясом контакту."
    },
    {
        channel: "Месенджери",
        name: "WhatsApp сценарій для повторної активації",
        cadence: "Серія з 3 повідомлень протягом 7 днів",
        description: "Напівавтоматична серія з ботом та залученням менеджера.",
        structure: [
            "Повідомлення 1: перевірка статусу та швидке опитування",
            "Повідомлення 2: відео-кейс та кнопки «Потрібна допомога» / «Запланувати дзвінок»",
            "Повідомлення 3: нагадування про бонус або консультацію"
        ],
        recommendation: "Сегмент: клієнти на етапі повторної покупки. Після відповіді — автостворення задачі у CRM."
    }
];

const MARKETING_AB_TESTS = [
    {
        name: "Тест теми листа welcome-серії",
        status: "У тесті (спринт 15)",
        audience: "Сегмент: швидкозростаючі стартапи, 4 500 контактів",
        goal: "Підвищити open rate другого листа до 45%",
        metric: "Open rate листа #2",
        variants: [
            { label: "Варіант A", description: "«Запустіть команду продажів за 7 днів»", result: "Базовий контроль · 34,2% OR" },
            { label: "Варіант B", description: "«[Ім’я], готовий чек-лист для запуску CRM»", result: "Персоналізація · 41,8% OR" }
        ],
        learnings: [
            "Додаємо персоналізацію за іменем + згадку про чек-лист — зростання OR на 22%.",
            "Потрібно протестувати динамічні підзаголовки у тілі листа."
        ]
    },
    {
        name: "SMS vs WhatsApp для реактивації",
        status: "Завершено",
        audience: "Сегмент: клієнти на етапі повторної покупки, 1 200 контактів",
        goal: "Збільшити кількість повторних демо на 15%",
        metric: "Booked demo rate",
        variants: [
            { label: "Варіант A", description: "SMS з персональним посиланням на календар", result: "8,4% бронювань" },
            { label: "Варіант B", description: "WhatsApp-бот з вибором зручного часу", result: "12,9% бронювань" }
        ],
        learnings: [
            "Месенджерні сценарії мають вищу конверсію, але потребують SLA від CSM < 2 години.",
            "Інтегрувати бота з календарем Google для автооновлення слотів."
        ]
    }
];

const MARKETING_INTEGRATIONS = [
    {
        platform: "HubSpot Marketing Hub",
        category: "Automation & CRM",
        status: "Підключено",
        useCases: [
            "Двостороння синхронізація сегментів та lifecycle-стадій",
            "Запуск workflow при зміні статусу угоди у ProCRM",
            "Синхронізація показників кампаній у розділ звітності"
        ],
        sync: "Оновлення кожні 15 хвилин через HubSpot APIs",
        connectors: ["OAuth 2.0", "Workflows", "Custom Behavioral Events"]
    },
    {
        platform: "Mailchimp",
        category: "Email & кампанії",
        status: "Готово",
        useCases: [
            "Експорт динамічних аудиторій для кампаній з контентом",
            "Передача аналітики відкриттів назад у CRM",
            "Автоматичне створення тегів на контактах після розсилки"
        ],
        sync: "Реальний час через вебхуки + нічна повна синхронізація",
        connectors: ["API ключ", "Webhooks", "Audience Tags"]
    },
    {
        platform: "Twilio / Segment",
        category: "SMS & месенджери",
        status: "У розгортанні",
        useCases: [
            "Trigger-SMS з можливістю відповіді напряму в CRM",
            "WhatsApp-потоки для повторної активації",
            "Збір подій доставки у Customer 360"
        ],
        sync: "Події в режимі реального часу через Segment Functions",
        connectors: ["Twilio Studio", "WhatsApp API", "Segment Destination"]
    },
    {
        platform: "Meta Business Suite",
        category: "Ретаргетинг та реклами",
        status: "Заплановано Q3",
        useCases: [
            "Створення look-alike аудиторій на основі цінних сегментів",
            "Ретаргетинг лідів, які не завершили демо",
            "Передача офлайн-подій з CRM у рекламні кампанії"
        ],
        sync: "Двічі на день через автоматичні завантаження",
        connectors: ["Conversions API", "Custom Audiences", "Scheduled CSV"]
    }
];


async function showMarketing() {
    showView('marketing');
    setPageHeader('marketing');

    const marketingView = document.getElementById('marketingView');
    if (!marketingView) {
        return;
    }

    const totalSegmentRecords = MARKETING_SEGMENTS.reduce((sum, segment) => sum + (segment.size || 0), 0);
    const activeCampaigns = MARKETING_CAMPAIGNS.filter(campaign => (campaign.status || '').toLowerCase().includes('актив')).length;
    const runningTests = MARKETING_AB_TESTS.filter(test => (test.status || '').toLowerCase().includes('тест')).length;

    const stats = [
        { label: 'Активні кампанії', value: activeCampaigns, caption: `з ${MARKETING_CAMPAIGNS.length} запланованих` },
        { label: 'Контакти у сегментах', value: totalSegmentRecords, caption: `${MARKETING_SEGMENTS.length} сегменти з автоматичним оновленням` },
        { label: 'Готові шаблони', value: MARKETING_TEMPLATES.length, caption: 'Email · SMS · месенджери' },
        { label: 'A/B-тести', value: MARKETING_AB_TESTS.length, caption: runningTests > 0 ? `${runningTests} активні зараз` : 'Нові гіпотези заплановані' }
    ];

    const renderList = items => (items || []).map(item => `
        <li class="flex items-start space-x-2">
            <i class="fas fa-circle text-[6px] text-blue-500 mt-2"></i>
            <span class="text-sm text-gray-600">${item}</span>
        </li>
    `).join('');

    const resolveChannelIcon = label => {
        const normalized = (label || '').toLowerCase();
        if (normalized.includes('email') || normalized.includes('лист')) return 'fa-envelope';
        if (normalized.includes('sms')) return 'fa-sms';
        if (normalized.includes('whatsapp') || normalized.includes('viber') || normalized.includes('telegram') || normalized.includes('messenger') || normalized.includes('месен')) return 'fa-comments';
        if (normalized.includes('вебінар') || normalized.includes('webinar')) return 'fa-video';
        if (normalized.includes('push')) return 'fa-bell';
        if (normalized.includes('in-app')) return 'fa-bullseye';
        return 'fa-bullhorn';
    };

    const getStatusBadgeClass = status => {
        const normalized = (status || '').toLowerCase();
        if (normalized.includes('актив')) return 'bg-green-50 text-green-600';
        if (normalized.includes('тест')) return 'bg-green-50 text-green-600';
        if (normalized.includes('підключ')) return 'bg-green-50 text-green-600';
        if (normalized.includes('готов')) return 'bg-blue-50 text-blue-600';
        if (normalized.includes('підготов') || normalized.includes('розгорт')) return 'bg-yellow-50 text-yellow-700';
        if (normalized.includes('заплан')) return 'bg-yellow-50 text-yellow-700';
        if (normalized.includes('заверш')) return 'bg-gray-100 text-gray-600';
        return 'bg-gray-100 text-gray-600';
    };

    const statsCards = stats.map(stat => `
        <div class="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">${stat.label}</p>
            <p class="text-2xl font-semibold text-gray-800 mt-3">${Number(stat.value || 0).toLocaleString('uk-UA')}</p>
            <p class="text-xs text-gray-500 mt-2">${stat.caption}</p>
        </div>
    `).join('');

    const segmentCards = MARKETING_SEGMENTS.map(segment => `
        <div class="border border-gray-200 rounded-xl p-6 bg-gray-50">
            <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div class="md:max-w-xl">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-600">${segment.priority}</span>
                    <h4 class="text-lg font-semibold text-gray-800 mt-3">${segment.name}</h4>
                    <p class="text-sm text-gray-600 mt-2">${segment.description}</p>
                </div>
                <div class="text-right space-y-1">
                    <p class="text-2xl font-semibold text-gray-800">${Number(segment.size || 0).toLocaleString('uk-UA')}</p>
                    <p class="text-xs uppercase tracking-wide text-gray-500">акаунтів у сегменті</p>
                    <p class="text-sm text-gray-500">${segment.share}</p>
                    <p class="text-xs text-green-600 font-medium">${segment.growth}</p>
                </div>
            </div>
            <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Ключові критерії</p>
                    <ul class="mt-3 space-y-2">${renderList(segment.criteria)}</ul>
                </div>
                <div>
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Потреби та пропозиція</p>
                    <ul class="mt-3 space-y-2">${renderList(segment.needs)}</ul>
                </div>
            </div>
            <div class="mt-6">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Рекомендовані канали</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    ${(segment.channels || []).map(channel => `
                        <div class="flex items-start space-x-3 bg-white border border-gray-200 rounded-lg p-3">
                            <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                <i class="fas ${resolveChannelIcon(channel.type)}"></i>
                            </span>
                            <div>
                                <p class="text-sm font-semibold text-gray-700">${channel.type}</p>
                                <p class="text-sm text-gray-600">${channel.detail}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');

    const campaignCards = MARKETING_CAMPAIGNS.map(campaign => `
        <div class="border border-gray-200 rounded-xl p-6 bg-gray-50">
            <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                    <div class="flex items-center gap-3">
                        <h4 class="text-lg font-semibold text-gray-800">${campaign.name}</h4>
                        <span class="inline-flex items-center px-3 py-1 rounded-full text-xs ${getStatusBadgeClass(campaign.status)}">${campaign.status}</span>
                    </div>
                    <p class="text-sm text-gray-600 mt-2">${campaign.objective}</p>
                    <p class="text-xs text-gray-500 mt-3"><i class="fas fa-users-cog text-blue-500 mr-2"></i>${campaign.owner}</p>
                    <p class="text-xs text-gray-500 mt-1"><i class="fas fa-layer-group text-purple-500 mr-2"></i>Цільові сегменти: ${campaign.segments.join(', ')}</p>
                </div>
                <div class="text-sm text-gray-600 bg-white border border-gray-200 px-4 py-3 rounded-lg lg:max-w-xs">
                    <p class="font-semibold text-gray-700 flex items-center"><i class="fas fa-bolt text-yellow-500 mr-2"></i>Автоматизація</p>
                    <ul class="mt-2 space-y-2">${renderList(campaign.automation)}</ul>
                </div>
            </div>
            <div class="mt-6">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Оркестрація каналів</p>
                <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    ${(campaign.channels || []).map(channel => `
                        <div class="border border-gray-200 rounded-lg p-4 bg-white">
                            <div class="flex items-center justify-between">
                                <span class="inline-flex items-center text-sm font-semibold text-gray-700">
                                    <i class="fas ${resolveChannelIcon(channel.type)} text-blue-500 mr-2"></i>${channel.type}
                                </span>
                                <span class="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-600">${channel.frequency}</span>
                            </div>
                            <p class="text-sm text-gray-600 mt-3">${channel.purpose}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="mt-6 flex flex-wrap gap-2">
                ${campaign.metrics.map(metric => `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-700">${metric}</span>`).join('')}
            </div>
        </div>
    `).join('');

    const journeyCards = CUSTOMER_JOURNEYS.map(journey => `
        <div class="border border-gray-200 rounded-xl p-6 bg-gray-50">
            <div>
                <h4 class="text-lg font-semibold text-gray-800">${journey.name}</h4>
                <p class="text-sm text-gray-600 mt-2">${journey.goal}</p>
                <p class="text-xs text-gray-500 mt-3"><i class="fas fa-bolt text-yellow-500 mr-2"></i>Тригер: ${journey.trigger}</p>
                <p class="text-xs text-gray-500 mt-1"><i class="fas fa-user-check text-green-500 mr-2"></i>Відповідальні: ${journey.owner}</p>
            </div>
            <div class="mt-6 space-y-4 md:space-y-0 md:flex md:space-x-4">
                ${journey.stages.map(stage => `
                    <div class="md:flex-1 bg-white border border-gray-200 rounded-lg p-4">
                        <p class="text-xs font-semibold text-blue-600 uppercase tracking-wide">${stage.title}</p>
                        <p class="text-sm text-gray-600 mt-2">${stage.description}</p>
                        <ul class="mt-3 space-y-2">${renderList(stage.actions)}</ul>
                        <p class="text-xs text-gray-500 mt-3">KPI: ${stage.kpis.join(', ')}</p>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');

    const templateCards = MARKETING_TEMPLATES.map(template => `
        <div class="border border-gray-200 rounded-xl p-5 bg-gray-50">
            <div class="flex items-start justify-between gap-4">
                <div>
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs bg-purple-50 text-purple-600">
                        <i class="fas ${resolveChannelIcon(template.channel)} mr-2"></i>${template.channel}
                    </span>
                    <h4 class="text-lg font-semibold text-gray-800 mt-3">${template.name}</h4>
                    <p class="text-sm text-gray-600 mt-2">${template.description}</p>
                </div>
                ${template.cadence ? `<span class="text-xs text-gray-500">${template.cadence}</span>` : ''}
            </div>
            <div class="mt-4">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Структура</p>
                <ul class="mt-2 space-y-2">${renderList(template.structure)}</ul>
            </div>
            <p class="text-xs text-gray-500 mt-4">${template.recommendation}</p>
        </div>
    `).join('');

    const abTestCards = MARKETING_AB_TESTS.map(test => `
        <div class="border border-gray-200 rounded-xl p-6 bg-gray-50">
            <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                    <h4 class="text-lg font-semibold text-gray-800">${test.name}</h4>
                    <p class="text-sm text-gray-600 mt-2">${test.goal}</p>
                    <p class="text-xs text-gray-500 mt-3"><i class="fas fa-bullseye text-purple-500 mr-2"></i>${test.metric}</p>
                    <p class="text-xs text-gray-500 mt-1"><i class="fas fa-users text-blue-500 mr-2"></i>${test.audience}</p>
                </div>
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs ${getStatusBadgeClass(test.status)}">${test.status}</span>
            </div>
            <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                ${test.variants.map(variant => `
                    <div class="border border-gray-200 rounded-lg p-4 bg-white">
                        <p class="text-sm font-semibold text-gray-700">${variant.label}</p>
                        <p class="text-sm text-gray-600 mt-2">${variant.description}</p>
                        <p class="text-xs text-gray-500 mt-2">${variant.result}</p>
                    </div>
                `).join('')}
            </div>
            <div class="mt-4">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Висновки</p>
                <ul class="mt-2 space-y-2">${renderList(test.learnings)}</ul>
            </div>
        </div>
    `).join('');

    const integrationCards = MARKETING_INTEGRATIONS.map(integration => `
        <div class="border border-gray-200 rounded-xl p-6 bg-gray-50">
            <div class="flex items-start justify-between gap-4">
                <div>
                    <h4 class="text-lg font-semibold text-gray-800">${integration.platform}</h4>
                    <p class="text-sm text-gray-600 mt-1">${integration.category}</p>
                </div>
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs ${getStatusBadgeClass(integration.status)}">${integration.status}</span>
            </div>
            <div class="mt-4">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Основні сценарії</p>
                <ul class="mt-2 space-y-2">${renderList(integration.useCases)}</ul>
            </div>
            <div class="mt-4 text-sm text-gray-600">
                <p><strong>Синхронізація:</strong> ${integration.sync}</p>
            </div>
            <div class="mt-4">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Технічні вимоги</p>
                <div class="flex flex-wrap gap-2">
                    ${integration.connectors.map(connector => `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs bg-white border border-gray-200 text-gray-600">${connector}</span>`).join('')}
                </div>
            </div>
        </div>
    `).join('');

    marketingView.innerHTML = `
        <div class="space-y-8">
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                ${statsCards}
            </div>

            <div class="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 class="text-xl font-semibold text-gray-800">Сегментація клієнтів</h3>
                        <p class="text-sm text-gray-600 mt-1">Динамічні правила для пріоритизації маркетингових дій.</p>
                    </div>
                    <span class="text-xs text-gray-500">Оновлено 5 хв тому · джерело: CRM scoring</span>
                </div>
                <div class="space-y-6">
                    ${segmentCards}
                </div>
            </div>

            <div class="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 class="text-xl font-semibold text-gray-800">Мультиканальні кампанії</h3>
                        <p class="text-sm text-gray-600 mt-1">Автоматизовані серії email, SMS та месенджерів за життєвим циклом.</p>
                    </div>
                    <span class="text-xs text-gray-500">Керування через Marketing Ops</span>
                </div>
                <div class="space-y-6">
                    ${campaignCards}
                </div>
            </div>

            <div class="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 class="text-xl font-semibold text-gray-800">Customer journey</h3>
                        <p class="text-sm text-gray-600 mt-1">Погоджені сценарії взаємодії від активації до розширення.</p>
                    </div>
                    <span class="text-xs text-gray-500">Відповідальні: маркетинг + Customer Success</span>
                </div>
                <div class="space-y-6">
                    ${journeyCards}
                </div>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div class="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-xl font-semibold text-gray-800">Шаблони комунікацій</h3>
                            <p class="text-sm text-gray-600 mt-1">Єдині бібліотеки для email, SMS та месенджерів.</p>
                        </div>
                        <span class="text-xs text-gray-500">Узгоджено з брендом</span>
                    </div>
                    <div class="space-y-4">
                        ${templateCards}
                    </div>
                </div>
                <div class="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-xl font-semibold text-gray-800">A/B-тести</h3>
                            <p class="text-sm text-gray-600 mt-1">Гіпотези для підвищення конверсій на ключових етапах.</p>
                        </div>
                        <span class="text-xs text-gray-500">Каденція: щомісячний аналіз</span>
                    </div>
                    <div class="space-y-4">
                        ${abTestCards}
                    </div>
                </div>
            </div>

            <div class="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 class="text-xl font-semibold text-gray-800">Інтеграція з маркетинговими платформами</h3>
                        <p class="text-sm text-gray-600 mt-1">Синхронізація сегментів, подій та звітності з топовими рішеннями.</p>
                    </div>
                    <span class="text-xs text-gray-500">Відстеження SLA через Integration Hub</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${integrationCards}
                </div>
            </div>
        </div>
    `;
}


// Placeholder view functions for other modules

async function viewOpportunity(id) { showToast('View opportunity - to be implemented', 'info'); }
async function editOpportunity(id) { showToast('Edit opportunity - to be implemented', 'info'); }
async function deleteOpportunity(id) { showToast('Delete opportunity - to be implemented', 'info'); }

async function editTask(id) {
    await showTaskForm(id);
}

async function deleteTask(id) {
    const confirmed = confirm('Are you sure you want to delete this task?');
    if (!confirmed) {
        return;
    }

    showLoading();
    try {
        const response = await fetch(`tables/tasks/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            throw new Error('Delete failed');
        }
        showToast('Task deleted successfully', 'success');
        closeModal();
        await loadTasks();
    } catch (error) {
        console.error('Error deleting task:', error);
        showToast('Failed to delete task', 'error');
    } finally {
        hideLoading();
    }
}

async function editActivity(id) {
    await showActivityForm(id);
}

async function deleteActivity(id) {
    const confirmed = confirm('Are you sure you want to delete this activity?');
    if (!confirmed) {
        return;
    }

    showLoading();
    try {
        const response = await fetch(`tables/activities/${id}`, { method: 'DELETE' });
        if (!response.ok) {
            throw new Error('Delete failed');
        }
        showToast('Activity deleted successfully', 'success');
        closeModal();
        await loadActivities();
    } catch (error) {
        console.error('Error deleting activity:', error);
        showToast('Failed to delete activity', 'error');
    } finally {
        hideLoading();
    }
}

function toggleOpportunityView() {
    showToast('Opportunity view toggle - to be implemented', 'info');
}