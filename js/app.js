/**
 * ProCRM - Professional CRM System
 * Main JavaScript file containing all CRM functionality
 */

// Global variables and configuration
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
    
    // Load dashboard by default
    showDashboard();
    
    // Setup global search
    setupGlobalSearch();
    
    console.log('ProCRM initialized successfully');
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
    const mainContent = document.getElementById('mainContent');
    
    mobileMenuBtn.addEventListener('click', function() {
        sidebar.classList.toggle('-translate-x-full');
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            sidebar.classList.add('-translate-x-full');
        }
    });
}

function setupGlobalSearch() {
    const searchInput = document.getElementById('globalSearch');
    let searchTimeout;
    
    searchInput.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performGlobalSearch(e.target.value);
        }, 300);
    });
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
}

function updateNavigation(activeView) {
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('bg-blue-50', 'text-blue-600');
    });
    
    // Add active class to current view (this would need more specific targeting)
    // For now, we'll handle this in individual show functions
}

function updatePageHeader(title, subtitle) {
    document.getElementById('pageTitle').textContent = title;
    document.getElementById('pageSubtitle').textContent = subtitle;
}

// Dashboard functions
async function showDashboard() {
    showView('dashboard');
    updatePageHeader('Dashboard', 'Welcome to your CRM dashboard');
    
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
    const pipelineCtx = document.getElementById('pipelineChart').getContext('2d');
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
    
    // Initialize lead source chart
    const leadSourceCtx = document.getElementById('leadSourceChart').getContext('2d');
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

// Contacts functions
async function showContacts() {
    showView('contacts');
    updatePageHeader('Contacts', 'Manage your customer contacts');
    
    const contactsView = document.getElementById('contactsView');
    contactsView.innerHTML = `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center space-x-4">
                    <h3 class="text-lg font-semibold text-gray-800">All Contacts</h3>
                    <div class="relative">
                        <input type="text" id="contactSearch" placeholder="Search contacts..." 
                               class="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                    </div>
                </div>
                <div class="flex items-center space-x-3">
                    <button onclick="exportContacts()" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50">
                        <i class="fas fa-download mr-2"></i>Export
                    </button>
                    <button onclick="showContactForm()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        <i class="fas fa-plus mr-2"></i>Add Contact
                    </button>
                </div>
            </div>
            
            <!-- Filters -->
            <div class="flex items-center space-x-4 mb-6">
                <select id="statusFilter" class="border border-gray-300 rounded-lg px-3 py-2">
                    <option value="">All Statuses</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Customer">Customer</option>
                </select>
                <select id="sourceFilter" class="border border-gray-300 rounded-lg px-3 py-2">
                    <option value="">All Sources</option>
                    <option value="Website">Website</option>
                    <option value="Cold Call">Cold Call</option>
                    <option value="Referral">Referral</option>
                    <option value="Social Media">Social Media</option>
                </select>
            </div>
            
            <!-- Contacts table -->
            <div class="overflow-x-auto">
                <table class="w-full">
                    <thead class="bg-gray-50">
                        <tr>
                            <th class="text-left p-3 font-medium text-gray-600">Name</th>
                            <th class="text-left p-3 font-medium text-gray-600">Company</th>
                            <th class="text-left p-3 font-medium text-gray-600">Email</th>
                            <th class="text-left p-3 font-medium text-gray-600">Phone</th>
                            <th class="text-left p-3 font-medium text-gray-600">Status</th>
                            <th class="text-left p-3 font-medium text-gray-600">Actions</th>
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
    
    await loadContacts();
    setupContactFilters();
}

async function loadContacts(page = 1, search = '', status = '', source = '') {
    showLoading();
    try {
        let url = `tables/contacts?page=${page}&limit=20`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        displayContacts(data.data || []);
        displayPagination('contacts', data, page);
        
    } catch (error) {
        console.error('Error loading contacts:', error);
        showToast('Failed to load contacts', 'error');
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
                    <p>No contacts found</p>
                    <button onclick="showContactForm()" class="mt-2 text-blue-600 hover:text-blue-700">Add your first contact</button>
                </td>
            </tr>
        `;
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
                        <p class="text-sm text-gray-600">${contact.title || 'No title'}</p>
                    </div>
                </div>
            </td>
            <td class="p-3 text-gray-600">${contact.company_name || 'No company'}</td>
            <td class="p-3 text-gray-600">${contact.email || 'No email'}</td>
            <td class="p-3 text-gray-600">${contact.phone || 'No phone'}</td>
            <td class="p-3">
                <span class="px-2 py-1 text-xs rounded-full ${getStatusClass(contact.status)}">${contact.status || 'Active'}</span>
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
    updatePageHeader('Companies', 'Manage your business accounts');
    
    // Similar implementation to showContacts()
    // ... (implementation would follow same pattern)
}

// Leads functions
async function showLeads() {
    showView('leads');
    updatePageHeader('Leads', 'Track and manage your sales leads');
    
    // Similar implementation to showContacts()
    // ... (implementation would follow same pattern)
}

// Opportunities functions  
async function showOpportunities() {
    showView('opportunities');
    updatePageHeader('Opportunities', 'Manage your sales opportunities');
    
    // Similar implementation to showContacts()
    // ... (implementation would follow same pattern)
}

// Tasks functions
async function showTasks() {
    showView('tasks');
    updatePageHeader('Tasks', 'Manage your tasks and activities');
    
    // Similar implementation to showContacts()
    // ... (implementation would follow same pattern)
}

// Activities functions
async function showActivities() {
    showView('activities');
    updatePageHeader('Activities', 'Track all your business activities');
    
    // Similar implementation to showContacts()
    // ... (implementation would follow same pattern)
}

// Reports functions
async function showReports() {
    showView('reports');
    updatePageHeader('Reports', 'View comprehensive business reports');
    
    // Similar implementation to showContacts()
    // ... (implementation would follow same pattern)
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
            // loadCompanies(page);
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