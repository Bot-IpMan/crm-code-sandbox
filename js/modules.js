/**
 * Additional CRM Modules
 * Company, Lead, Opportunity, Task, and Activity Management
 */

// Companies Management
async function showCompanies() {
    showView('companies');
    updatePageHeader('Companies', 'Manage your business accounts');
    
    const companiesView = document.getElementById('companiesView');
    companiesView.innerHTML = `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center space-x-4">
                    <h3 class="text-lg font-semibold text-gray-800">All Companies</h3>
                    <div class="relative">
                        <input type="text" id="companySearch" placeholder="Search companies..." 
                               class="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    <button onclick="exportCompanies()" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <i class="fas fa-download mr-2"></i>Export
                    </button>
                    <button onclick="showCompanyForm()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-plus mr-2"></i>Add Company
                    </button>
                </div>
            </div>
            
            <div class="flex items-center space-x-4 mb-6">
                <select id="companyStatusFilter" class="border border-gray-300 rounded-lg px-3 py-2">
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Customer">Customer</option>
                    <option value="Prospect">Prospect</option>
                    <option value="Partner">Partner</option>
                </select>
                <select id="companySizeFilter" class="border border-gray-300 rounded-lg px-3 py-2">
                    <option value="">All Sizes</option>
                    <option value="Startup">Startup</option>
                    <option value="Small (1-50)">Small (1-50)</option>
                    <option value="Medium (51-200)">Medium (51-200)</option>
                    <option value="Large (201-1000)">Large (201-1000)</option>
                    <option value="Enterprise (1000+)">Enterprise (1000+)</option>
                </select>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="text-left p-3 font-medium text-gray-600">Company</th>
                            <th class="text-left p-3 font-medium text-gray-600">Industry</th>
                            <th class="text-left p-3 font-medium text-gray-600">Size</th>
                            <th class="text-left p-3 font-medium text-gray-600">Revenue</th>
                            <th class="text-left p-3 font-medium text-gray-600">Status</th>
                            <th class="text-left p-3 font-medium text-gray-600">Actions</th>
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
        showToast('Failed to load companies', 'error');
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
                    <p>No companies found</p>
                    <button onclick="showCompanyForm()" class="mt-2 text-blue-600 hover:text-blue-700">Add your first company</button>
                </td>
            </tr>
        `;
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
                        <p class="text-sm text-gray-600">${company.website || 'No website'}</p>
                    </div>
                </div>
            </td>
            <td class="p-3 text-gray-600">${company.industry || 'N/A'}</td>
            <td class="p-3 text-gray-600">${company.size || 'N/A'}</td>
            <td class="p-3 text-gray-600">${formatCurrency(company.annual_revenue)}</td>
            <td class="p-3">
                <span class="px-2 py-1 text-xs rounded-full ${getStatusClass(company.status)}">${company.status || 'Active'}</span>
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
    updatePageHeader('Leads', 'Track and manage your sales leads');
    
    const leadsView = document.getElementById('leadsView');
    leadsView.innerHTML = `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center space-x-4">
                    <h3 class="text-lg font-semibold text-gray-800">All Leads</h3>
                    <div class="relative">
                        <input type="text" id="leadSearch" placeholder="Search leads..." 
                               class="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    <button onclick="showLeadForm()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-plus mr-2"></i>Add Lead
                    </button>
                </div>
            </div>
            
            <div class="flex items-center space-x-4 mb-6">
                <select id="leadStatusFilter" class="border border-gray-300 rounded-lg px-3 py-2">
                    <option value="">All Statuses</option>
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Proposal">Proposal</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                </select>
                <select id="leadPriorityFilter" class="border border-gray-300 rounded-lg px-3 py-2">
                    <option value="">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                </select>
            </div>
            
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="text-left p-3 font-medium text-gray-600">Lead Title</th>
                            <th class="text-left p-3 font-medium text-gray-600">Value</th>
                            <th class="text-left p-3 font-medium text-gray-600">Status</th>
                            <th class="text-left p-3 font-medium text-gray-600">Priority</th>
                            <th class="text-left p-3 font-medium text-gray-600">Expected Close</th>
                            <th class="text-left p-3 font-medium text-gray-600">Assigned To</th>
                            <th class="text-left p-3 font-medium text-gray-600">Actions</th>
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
        showToast('Failed to load leads', 'error');
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
                    <p>No leads found</p>
                    <button onclick="showLeadForm()" class="mt-2 text-blue-600 hover:text-blue-700">Add your first lead</button>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = leads.map(lead => `
        <tr class="border-b border-gray-100 hover:bg-gray-50">
            <td class="p-3">
                <div>
                    <p class="font-medium text-gray-800">${lead.title}</p>
                    <p class="text-sm text-gray-600">${lead.description ? lead.description.substring(0, 50) + '...' : 'No description'}</p>
                </div>
            </td>
            <td class="p-3 text-gray-600">${formatCurrency(lead.value)}</td>
            <td class="p-3">
                <span class="px-2 py-1 text-xs rounded-full ${getStatusClass(lead.status)}">${lead.status}</span>
            </td>
            <td class="p-3">
                <span class="px-2 py-1 text-xs rounded-full ${getPriorityClass(lead.priority)}">${lead.priority}</span>
            </td>
            <td class="p-3 text-gray-600">${lead.expected_close_date ? new Date(lead.expected_close_date).toLocaleDateString() : 'Not set'}</td>
            <td class="p-3 text-gray-600">${lead.assigned_to || 'Unassigned'}</td>
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
    updatePageHeader('Opportunities', 'Manage your sales opportunities');
    
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
    updatePageHeader('Sales', 'End-to-end pipeline, forecasting and billing');

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

// Tasks Management
async function showTasks() {
    showView('tasks');
    updatePageHeader('Tasks', 'Manage your tasks and activities');
    
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
        showToast('Failed to load tasks', 'error');
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
    updatePageHeader('Activities', 'Track all your business activities');
    
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
        showToast('Failed to load activities', 'error');
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

// Reports Management
async function showReports() {
    showView('reports');
    updatePageHeader('Reports', 'View comprehensive business reports');
    
    const reportsView = document.getElementById('reportsView');
    reportsView.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <!-- Sales Performance -->
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Sales Performance</h3>
                <div style="height: 300px;">
                    <canvas id="salesPerformanceChart"></canvas>
                </div>
            </div>
            
            <!-- Lead Conversion -->
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 class="text-lg font-semibold text-gray-800 mb-4">Lead Conversion Funnel</h3>
                <div style="height: 300px;">
                    <canvas id="conversionFunnelChart"></canvas>
                </div>
            </div>
        </div>
        
        <!-- Reports Table -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-6">
                <h3 class="text-lg font-semibold text-gray-800">Detailed Reports</h3>
                <div class="flex space-x-3">
                    <button onclick="generateReport('contacts')" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Contacts Report
                    </button>
                    <button onclick="generateReport('sales')" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        Sales Report
                    </button>
                    <button onclick="generateReport('activities')" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                        Activities Report
                    </button>
                </div>
            </div>
            
            <div id="reportData" class="mt-6">
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-chart-bar text-4xl mb-4"></i>
                    <p>Select a report type to view detailed data</p>
                </div>
            </div>
        </div>
    `;
    
    initializeReportCharts();
}

function initializeReportCharts() {
    // Sales Performance Chart
    const salesCtx = document.getElementById('salesPerformanceChart').getContext('2d');
    new Chart(salesCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Revenue',
                data: [65000, 85000, 75000, 95000, 120000, 140000],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
    
    // Conversion Funnel Chart
    const funnelCtx = document.getElementById('conversionFunnelChart').getContext('2d');
    new Chart(funnelCtx, {
        type: 'bar',
        data: {
            labels: ['Leads', 'Qualified', 'Proposals', 'Negotiations', 'Won'],
            datasets: [{
                label: 'Count',
                data: [100, 75, 45, 25, 18],
                backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#059669']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            }
        }
    });
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