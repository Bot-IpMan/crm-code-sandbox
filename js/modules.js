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

function displayOpportunitiesPipeline(opportunities) {
    const stages = {
        'Qualification': 'qualificationColumn',
        'Needs Analysis': 'needsAnalysisColumn',
        'Proposal': 'proposalColumn',
        'Negotiation': 'negotiationColumn',
        'Closed Won': 'closedWonColumn',
        'Closed Lost': 'closedLostColumn'
    };
    
    // Clear columns
    Object.values(stages).forEach(columnId => {
        document.getElementById(columnId).innerHTML = '';
    });
    
    // Populate columns
    opportunities.forEach(opp => {
        const columnId = stages[opp.stage];
        if (columnId) {
            const column = document.getElementById(columnId);
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
                updated_at: Date.now()
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

// Placeholder functions for additional module forms
async function showLeadForm(leadId = null) { showToast('Lead form - to be implemented', 'info'); }
async function showOpportunityForm(oppId = null) { showToast('Opportunity form - to be implemented', 'info'); }
async function showTaskForm(taskId = null) { showToast('Task form - to be implemented', 'info'); }
async function showActivityForm(activityId = null) { showToast('Activity form - to be implemented', 'info'); }

// Placeholder view functions for other modules

async function viewLead(id) { showToast('View lead - to be implemented', 'info'); }
async function editLead(id) { showToast('Edit lead - to be implemented', 'info'); }
async function deleteLead(id) { showToast('Delete lead - to be implemented', 'info'); }

async function viewOpportunity(id) { showToast('View opportunity - to be implemented', 'info'); }
async function editOpportunity(id) { showToast('Edit opportunity - to be implemented', 'info'); }
async function deleteOpportunity(id) { showToast('Delete opportunity - to be implemented', 'info'); }

async function editTask(id) { showToast('Edit task - to be implemented', 'info'); }
async function deleteTask(id) { showToast('Delete task - to be implemented', 'info'); }

async function editActivity(id) { showToast('Edit activity - to be implemented', 'info'); }
async function deleteActivity(id) { showToast('Delete activity - to be implemented', 'info'); }

function toggleOpportunityView() {
    showToast('Opportunity view toggle - to be implemented', 'info');
}