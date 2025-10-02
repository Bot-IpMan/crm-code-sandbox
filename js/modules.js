/**
 * Additional CRM Modules
 * Company, Lead, Opportunity, Task, and Activity Management
 */

// Companies Management

function normalizeCompetitorTargets(competitor, companyLookup = new Map()) {
    const ids = new Set();
    const names = new Set();

    if (Array.isArray(competitor?.linked_clients)) {
        competitor.linked_clients.forEach(name => {
            if (name !== undefined && name !== null && String(name).trim()) {
                names.add(String(name));
            }
        });
    }

    const rawIds = Array.isArray(competitor?.linked_company_ids)
        ? competitor.linked_company_ids
        : Array.isArray(competitor?.related_company_ids)
            ? competitor.related_company_ids
            : [];

    rawIds.forEach(id => {
        if (id === undefined || id === null) {
            return;
        }
        const normalizedId = String(id);
        ids.add(normalizedId);
        const match = companyLookup.get(normalizedId);
        if (match?.name) {
            names.add(match.name);
        }
    });

    return { ids: Array.from(ids), names: Array.from(names) };
}

function competitorTargetsCompany(competitor, company, companyLookup = new Map()) {
    if (!competitor || !company) {
        return false;
    }
    const normalizedTargets = normalizeCompetitorTargets(competitor, companyLookup);
    const companyId = company.id || company.company_id;
    if (companyId && normalizedTargets.ids.includes(String(companyId))) {
        return true;
    }
    const companyName = (company.name || '').trim().toLowerCase();
    if (!companyName) {
        return false;
    }
    return normalizedTargets.names.some(name => String(name).trim().toLowerCase() === companyName);
}

async function showCompanies() {
    showView('companies');
    setPageHeader('companies');

    const companyStatusOptions = renderSelectOptions(
        getDictionaryEntries('companies', 'statuses'),
        '',
        {
            includeBlank: true,
            blankLabel: translate('companies.filter.status.all'),
            blankI18nKey: 'companies.filter.status.all'
        }
    );

    const companySizeOptions = renderSelectOptions(
        getDictionaryEntries('companies', 'sizes'),
        '',
        {
            includeBlank: true,
            blankLabel: translate('companies.filter.size.all'),
            blankI18nKey: 'companies.filter.size.all'
        }
    );

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
                    ${companyStatusOptions}
                </select>
                <select id="companySizeFilter" class="border border-gray-300 rounded-lg px-3 py-2">
                    ${companySizeOptions}
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
        <div class="mt-10 bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
            <div>
                <h3 class="text-2xl font-semibold text-gray-800 mb-3">Структура розділу «Компанії»</h3>
                <p class="text-gray-600 leading-relaxed">
                    Вкладка «Компанії» в CRM акумулює всю важливу інформацію про партнерів, постачальників та клієнтів. Нижче наведено ключові блоки даних, які мають бути доступними менеджеру для швидкого аналізу та роботи з обліковими записами.
                </p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <section class="p-5 rounded-lg border border-gray-200 bg-gray-50">
                    <h4 class="text-lg font-semibold text-gray-800 mb-3">1. Основна інформація</h4>
                    <ul class="space-y-2 text-gray-600 text-sm leading-relaxed">
                        <li>• Назва (повна та скорочена), юридична форма, ІПН/ЄДРПОУ.</li>
                        <li>• Дата реєстрації, галузь діяльності, розмір компанії.</li>
                        <li>• Логотип та актуальні контактні адреси (юридична, фактична, доставка).</li>
                        <li>• Телефони, email-и, вебсайт та графік роботи.</li>
                    </ul>
                </section>
                <section class="p-5 rounded-lg border border-gray-200 bg-gray-50">
                    <h4 class="text-lg font-semibold text-gray-800 mb-3">2. Контактні особи</h4>
                    <ul class="space-y-2 text-gray-600 text-sm leading-relaxed">
                        <li>• Ключові контакти з посадами, телефонами та email-ами.</li>
                        <li>• Ролі контактів (наприклад, ЛПР).</li>
                        <li>• Відповідальні менеджери з нашої команди.</li>
                    </ul>
                </section>
                <section class="p-5 rounded-lg border border-gray-200 bg-gray-50">
                    <h4 class="text-lg font-semibold text-gray-800 mb-3">3. Фінансова інформація</h4>
                    <ul class="space-y-2 text-gray-600 text-sm leading-relaxed">
                        <li>• Історія угод: суми, дати, статуси, найпопулярніші продукти.</li>
                        <li>• Платіжні реквізити та умови оплати.</li>
                        <li>• Кредитний ліміт, заборгованість, фінансові метрики (сума, середній чек, LTV).</li>
                    </ul>
                </section>
                <section class="p-5 rounded-lg border border-gray-200 bg-gray-50">
                    <h4 class="text-lg font-semibold text-gray-800 mb-3">4. Договірна база</h4>
                    <ul class="space-y-2 text-gray-600 text-sm leading-relaxed">
                        <li>• Перелік активних та завершених договорів із датами дії.</li>
                        <li>• Основні умови договорів та прикріплені файли.</li>
                    </ul>
                </section>
                <section class="p-5 rounded-lg border border-gray-200 bg-gray-50">
                    <h4 class="text-lg font-semibold text-gray-800 mb-3">5. Історія взаємодій</h4>
                    <ul class="space-y-2 text-gray-600 text-sm leading-relaxed">
                        <li>• Журнал дзвінків, листування, зустрічей.</li>
                        <li>• Нотатки з важливими домовленостями та ризиками.</li>
                    </ul>
                </section>
                <section class="p-5 rounded-lg border border-gray-200 bg-gray-50">
                    <h4 class="text-lg font-semibold text-gray-800 mb-3">6. Сегментація</h4>
                    <ul class="space-y-2 text-gray-600 text-sm leading-relaxed">
                        <li>• Теги та мітки для класифікації (VIP, партнер, постачальник тощо).</li>
                        <li>• Групування за категоріями та джерела надходження.</li>
                    </ul>
                </section>
                <section class="p-5 rounded-lg border border-gray-200 bg-gray-50">
                    <h4 class="text-lg font-semibold text-gray-800 mb-3">7. Завдання й нагадування</h4>
                    <ul class="space-y-2 text-gray-600 text-sm leading-relaxed">
                        <li>• Планові активності з термінами та відповідальними.</li>
                        <li>• Автоматичні нагадування про ключові події та статуси.</li>
                    </ul>
                </section>
                <section class="p-5 rounded-lg border border-gray-200 bg-gray-50">
                    <h4 class="text-lg font-semibold text-gray-800 mb-3">8. Аналітика</h4>
                    <ul class="space-y-2 text-gray-600 text-sm leading-relaxed">
                        <li>• Остання взаємодія, частота контактів, оцінка лояльності.</li>
                        <li>• Відгуки, скарги та прогнози майбутніх продажів.</li>
                    </ul>
                </section>
                <section class="p-5 rounded-lg border border-gray-200 bg-gray-50">
                    <h4 class="text-lg font-semibold text-gray-800 mb-3">9. Інтеграції</h4>
                    <ul class="space-y-2 text-gray-600 text-sm leading-relaxed">
                        <li>• Синхронізація з бухгалтерією, email-маркетингом та месенджерами.</li>
                        <li>• Автоматичні тригери для розсилок і створення завдань.</li>
                    </ul>
                </section>
                <section class="p-5 rounded-lg border border-gray-200 bg-gray-50">
                    <h4 class="text-lg font-semibold text-gray-800 mb-3">10. Документи</h4>
                    <ul class="space-y-2 text-gray-600 text-sm leading-relaxed">
                        <li>• Прикріплені файли, комерційні пропозиції, презентації.</li>
                        <li>• Ведення версій документів і посилання на хмари.</li>
                    </ul>
                </section>
                <section class="p-5 rounded-lg border border-gray-200 bg-gray-50">
                    <h4 class="text-lg font-semibold text-gray-800 mb-3">11. Пошук і фільтри</h4>
                    <ul class="space-y-2 text-gray-600 text-sm leading-relaxed">
                        <li>• Розширений пошук за назвою, галуззю, тегами та активністю.</li>
                        <li>• Збережені фільтри для швидкого доступу до сегментів.</li>
                    </ul>
                </section>
                <section class="p-5 rounded-lg border border-gray-200 bg-gray-50">
                    <h4 class="text-lg font-semibold text-gray-800 mb-3">12. Безпека</h4>
                    <ul class="space-y-2 text-gray-600 text-sm leading-relaxed">
                        <li>• Рівні доступу для різних ролей користувачів.</li>
                        <li>• Лог змін картки компанії.</li>
                    </ul>
                </section>
            </div>
            <div class="bg-white border border-dashed border-gray-300 rounded-xl p-6">
                <h4 class="text-lg font-semibold text-gray-800 mb-4">Приклад структури картки компанії</h4>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <tbody class="divide-y divide-gray-100 text-sm text-gray-700">
                            <tr>
                                <td class="py-3 font-semibold w-1/3">Основна інформація</td>
                                <td class="py-3">ТОВ «Успіх», ЄДРПОУ 12345678, IT-галузь</td>
                            </tr>
                            <tr>
                                <td class="py-3 font-semibold">Контакти</td>
                                <td class="py-3">+380441234567, info@uspih.com.ua</td>
                            </tr>
                            <tr>
                                <td class="py-3 font-semibold">Контактні особи</td>
                                <td class="py-3">Іван Петров (Директор), +380991234567</td>
                            </tr>
                            <tr>
                                <td class="py-3 font-semibold">Історія угод</td>
                                <td class="py-3">10 угод на суму 200 000 ₴</td>
                            </tr>
                            <tr>
                                <td class="py-3 font-semibold">Договори</td>
                                <td class="py-3">Договір №5/2025, дійсний до 31.12.2025</td>
                            </tr>
                            <tr>
                                <td class="py-3 font-semibold">Остання взаємодія</td>
                                <td class="py-3">Зустріч 25.09.2025, домовленість про тендер</td>
                            </tr>
                            <tr>
                                <td class="py-3 font-semibold">Завдання</td>
                                <td class="py-3">Надіслати пропозицію до 05.10.2025</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="bg-blue-50 border border-blue-100 rounded-xl p-6">
                <h4 class="text-lg font-semibold text-blue-900 mb-3">Чому це важливо?</h4>
                <ul class="space-y-2 text-blue-900 text-sm leading-relaxed">
                    <li>• Систематизує інформацію про організації-партнерів.</li>
                    <li>• Допомагає контролювати угоди та фінансові показники.</li>
                    <li>• Підвищує якість взаємодії завдяки історії комунікацій.</li>
                    <li>• Автоматизує процеси та нагадування.</li>
                </ul>
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
        const records = Array.isArray(data?.data) ? data.data : [];

        displayCompanies(records);
        if (typeof updateCompanyDirectory === 'function') {
            updateCompanyDirectory(records, { merge: true });
        }
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
    const normalized = (status || '').toLowerCase();
    const entries = getDictionaryEntries('companies', 'statuses');
    const match = entries.find(entry => entry.value.toLowerCase() === normalized && entry.i18nKey);
    if (match && match.i18nKey) {
        return match.i18nKey;
    }
    switch (normalized) {
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
    const leadStatusOptions = renderSelectOptions(
        getDictionaryEntries('leads', 'statuses'),
        '',
        {
            includeBlank: true,
            blankLabel: translate('leads.filter.status.all'),
            blankI18nKey: 'leads.filter.status.all'
        }
    );

    const leadPriorityOptions = renderSelectOptions(
        getDictionaryEntries('leads', 'priorities'),
        '',
        {
            includeBlank: true,
            blankLabel: translate('leads.filter.priority.all'),
            blankI18nKey: 'leads.filter.priority.all'
        }
    );

    leadsView.innerHTML = `
        <div class="space-y-6">
            <section>
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" id="leadSummaryCards"></div>
            </section>

            <section class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                    <div class="flex flex-col md:flex-row md:items-center md:space-x-4 gap-3">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-800" data-i18n="leads.heading">All Leads</h3>
                            <p class="text-sm text-gray-500">Керуйте потенційними клієнтами від першого контакту до конверсії.</p>
                        </div>
                        <div class="relative">
                            <input type="text" id="leadSearch" placeholder="Search leads..." data-i18n="leads.searchPlaceholder" data-i18n-attr="placeholder"
                                   class="pl-10 pr-4 py-2 w-full md:w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                        </div>
                    </div>
                    <div class="flex items-center space-x-3">
                        <button onclick="showLeadForm()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <i class="fas fa-plus mr-2"></i><span data-i18n="leads.addLead">Add Lead</span>
                        </button>
                    </div>
                </div>

                <div class="flex flex-col md:flex-row md:items-center md:space-x-4 gap-3 mb-6">
                    <select id="leadStatusFilter" class="border border-gray-300 rounded-lg px-3 py-2 w-full md:w-auto">
                        ${leadStatusOptions}
                    </select>
                    <select id="leadPriorityFilter" class="border border-gray-300 rounded-lg px-3 py-2 w-full md:w-auto">
                        ${leadPriorityOptions}
                    </select>
                    <div class="flex-1">
                        <div class="flex flex-wrap gap-2 text-xs text-gray-500">
                            <span class="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 text-blue-700"><i class="fas fa-filter mr-2"></i>Фільтри за статусом, джерелом та менеджером</span>
                            <span class="inline-flex items-center px-3 py-1 rounded-full bg-emerald-50 text-emerald-700"><i class="fas fa-clock mr-2"></i>Використовуйте пошук за ключовими словами</span>
                        </div>
                    </div>
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

                <div class="mt-10 space-y-4">
                    <div>
                        <h4 class="text-lg font-semibold text-gray-800" data-i18n="leads.board.title">Lead Pipeline</h4>
                        <p class="text-sm text-gray-500" data-i18n="leads.board.subtitle">Drag and drop leads between stages or update them inline.</p>
                    </div>
                    <div id="leadKanbanBoard" class="overflow-x-auto pb-2">
                    </div>
                </div>
            </section>

            <section class="grid grid-cols-1 xl:grid-cols-3 gap-6" id="leadDetailLayout">
                <div class="space-y-6 xl:col-span-2" id="leadDetailPrimary"></div>
                <div class="space-y-6" id="leadDetailSidebar"></div>
            </section>

            <section class="grid grid-cols-1 xl:grid-cols-2 gap-6" id="leadAnalyticsLayout">
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6" id="leadAnalyticsPanel"></div>
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6" id="leadFilterPanel"></div>
            </section>
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

        const rawLeads = Array.isArray(data.data) ? data.data : [];
        const enrichedLeads = rawLeads.map(enrichLeadRecord);

        leadExperienceState.leads = enrichedLeads;
        leadExperienceState.leadsById = new Map(
            enrichedLeads
                .filter(lead => lead && lead.id)
                .map(lead => [String(lead.id), lead])
        );

        if (!leadExperienceState.selectedLeadId || !leadExperienceState.leadsById.has(leadExperienceState.selectedLeadId)) {
            leadExperienceState.selectedLeadId = enrichedLeads.length ? String(enrichedLeads[0].id) : null;
        }

        displayLeads(enrichedLeads);
        displayPagination('leads', data, page);
        renderLeadSummary(enrichedLeads);
        renderLeadAnalytics(enrichedLeads);
        renderLeadFilterPanel(enrichedLeads);
        const selectedLead = leadExperienceState.selectedLeadId
            ? leadExperienceState.leadsById.get(leadExperienceState.selectedLeadId)
            : null;
        renderLeadDetail(selectedLead || null);
        updateLeadSelectionHighlight();

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

    tbody.innerHTML = leads.map(lead => {
        const leadIdRaw = String(lead.id || '');
        const safeLeadId = sanitizeText(leadIdRaw);
        const leadIdForHandler = leadIdRaw
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "\\'");
        const safeTitle = sanitizeText(lead.title || 'Untitled Lead');
        const hasDescription = Boolean(lead.description);
        const descriptionPreview = hasDescription
            ? sanitizeText(lead.description.length > 80 ? `${lead.description.slice(0, 77)}...` : lead.description)
            : sanitizeText(translate('leads.noDescription'));
        const currentStatus = lead.status || '';
        const statusLabel = translateLeadStatus(currentStatus) || currentStatus || 'New';
        const statusBadge = `<span class="px-2 py-1 text-xs rounded-full ${getStatusClass(currentStatus)}">${sanitizeText(statusLabel)}</span>`;
        const statusOptions = buildLeadStatusOptions(currentStatus);
        const statusControl = `
            <div class="space-y-2">
                ${statusBadge}
                <select class="w-full px-2 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" data-lead-status-select data-lead-id="${safeLeadId}" data-current-status="${sanitizeText(currentStatus)}">
                    ${statusOptions}
                </select>
            </div>
        `;
        const priorityLabel = lead.priority ? (translateLeadPriority(lead.priority) || lead.priority) : translate('leads.notSet');
        const priorityClass = lead.priority ? getPriorityClass(lead.priority) : 'bg-gray-100 text-gray-600';
        const priorityBadge = `<span class="px-2 py-1 text-xs rounded-full ${priorityClass}">${sanitizeText(priorityLabel)}</span>`;
        const expectedClose = lead.expected_close_date
            ? sanitizeText(new Date(lead.expected_close_date).toLocaleDateString(currentLanguage === 'uk' ? 'uk-UA' : undefined))
            : sanitizeText(translate('leads.notSet'));
        const assignedTo = lead.assigned_to ? sanitizeText(lead.assigned_to) : sanitizeText(translate('leads.unassigned'));
        const profile = lead.detailProfile || buildLeadDetailProfile(lead);
        const contactName = profile?.contact?.fullName || lead.contact_name || '';
        const contactRole = profile?.contact?.jobTitle || '';
        const companyName = profile?.company || lead.company_name || '';
        const contactEmail = profile?.contact?.emails?.[0] || lead.contact_email || '';
        const detailChips = [contactName, contactRole, companyName].filter(Boolean).slice(0, 2);
        const chipHtml = detailChips.length
            ? `<div class="flex flex-wrap gap-2 mt-2">${detailChips.map(text => `<span class="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-xs"><i class="fas fa-user-circle mr-1"></i>${sanitizeText(text)}</span>`).join('')}</div>`
            : '';
        const contactLinks = [];
        if (contactEmail) {
            const emailHref = sanitizeText(`mailto:${contactEmail}`);
            contactLinks.push(`<a href="${emailHref}" class="text-blue-600 hover:underline"><i class="far fa-envelope mr-1"></i>${sanitizeText(contactEmail)}</a>`);
        }
        if (profile?.contact?.phones?.length) {
            const firstPhone = profile.contact.phones[0];
            const phoneHref = sanitizeText(`tel:${String(firstPhone).replace(/[^0-9+]/g, '')}`);
            contactLinks.push(`<a href="${phoneHref}" class="text-blue-600 hover:underline"><i class="fas fa-phone mr-1"></i>${sanitizeText(firstPhone)}</a>`);
        }
        const contactLinksHtml = contactLinks.length
            ? `<div class="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">${contactLinks.join('')}</div>`
            : '';

        return `
            <tr class="border-b border-gray-100 hover:bg-blue-50/40 transition-colors cursor-pointer" data-lead-row data-lead-id="${safeLeadId}">
                <td class="p-3">
                    <div>
                        <p class="font-medium text-gray-800">${safeTitle}</p>
                        <p class="text-sm text-gray-600">${descriptionPreview}</p>
                        ${chipHtml}
                        ${contactLinksHtml}
                    </div>
                </td>
                <td class="p-3 text-gray-600">${formatCurrency(lead.value)}</td>
                <td class="p-3">${statusControl}</td>
                <td class="p-3">${priorityBadge}</td>
                <td class="p-3 text-gray-600">${expectedClose}</td>
                <td class="p-3 text-gray-600">${assignedTo}</td>
                <td class="p-3">
                    <div class="flex items-center space-x-2">
                        <button onclick="viewLead('${leadIdForHandler}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded" title="View lead details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="showLeadConversionWizard('${leadIdForHandler}')" class="p-2 text-purple-600 hover:bg-purple-50 rounded" title="Convert lead">
                            <i class="fas fa-exchange-alt"></i>
                        </button>
                        <button onclick="editLead('${leadIdForHandler}')" class="p-2 text-green-600 hover:bg-green-50 rounded" title="Edit lead">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteLead('${leadIdForHandler}')" class="p-2 text-red-600 hover:bg-red-50 rounded" title="Delete lead">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    setupLeadRowSelection();
    renderLeadKanban(leads);
    initializeLeadStatusControls();
    updateLeadSelectionHighlight();
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

const LEAD_PIPELINE_STATUSES = ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost'];

const leadKanbanCache = {
    dragContext: null,
    leadsById: new Map()
};

const LEAD_DETAIL_LIBRARY = {
    'lead-1': {
        contact: {
            fullName: 'Майкл Чен',
            jobTitle: 'Директор з ІТ',
            phones: ['+1 (555) 987-6543 (роб.)', '+1 (555) 123-9876 (моб.)'],
            emails: ['michael.chen@globalmanufacturing.com'],
            address: '250 Industrial Way, Чикаго, IL 60601, США',
            socials: [
                { label: 'LinkedIn', url: 'https://www.linkedin.com/in/michaelchen-it' }
            ],
            language: 'англійська',
            timezone: 'America/Chicago'
        },
        industry: 'Виробництво',
        sourceDetail: 'Вхідна заявка з сайту',
        funnel: {
            stage: 'Кваліфікація',
            probability: 60,
            statusLabel: 'Кваліфікований'
        },
        interest: {
            products: ['Платформа аналітики для виробництва', 'Модуль інтеграції з ERP'],
            budget: '80 000 $',
            decisionTimeline: 'Кінець червня 2024',
            pains: [
                'Потрібна консолідація даних з виробничих ліній',
                'Потрібні автоматичні звіти для топ-менеджменту'
            ]
        },
        interactions: {
            communications: [
                {
                    type: 'call',
                    date: '2024-05-10T14:30:00Z',
                    subject: 'Огляд технічних вимог',
                    summary: 'Обговорили інтеграцію з SAP та вимоги до кібербезпеки.',
                    owner: 'Emily Johnson',
                    duration: '35 хв'
                },
                {
                    type: 'email',
                    date: '2024-05-07T09:10:00Z',
                    subject: 'Надсилання презентації',
                    summary: 'Відправлено демо-матеріали та ROI-калькулятор для фінансової команди.',
                    owner: 'Emily Johnson'
                },
                {
                    type: 'meeting',
                    date: '2024-05-02T16:00:00Z',
                    subject: 'Стартова демонстрація',
                    summary: '5 учасників. Узгоджено наступні кроки та пілотний сценарій.',
                    owner: 'Emily Johnson',
                    participants: ['Michael Chen', 'Emily Johnson', 'Noah Patel']
                }
            ],
            notes: [
                {
                    date: '2024-05-11T11:00:00Z',
                    author: 'Emily Johnson',
                    content: 'Очікують розрахунок окупності окремо для виробництва та фінансів.'
                }
            ]
        },
        tasks: {
            upcoming: [
                {
                    title: 'Надіслати технічний аудит',
                    due: '2024-05-18',
                    owner: 'Emily Johnson',
                    type: 'Email',
                    priority: 'High'
                },
                {
                    title: 'Погодити пілотний сценарій',
                    due: '2024-05-22',
                    owner: 'Michael Chen',
                    type: 'Meeting',
                    priority: 'Medium'
                }
            ],
            reminders: [
                {
                    title: 'Follow-up після security review',
                    due: '2024-05-20T09:00:00Z',
                    channel: 'CRM-сповіщення'
                }
            ]
        },
        segmentation: {
            tags: ['Гарячий лід', 'B2B', 'Виробництво'],
            groups: ['Пілот 2024', 'Північна Америка'],
            rating: 4.7
        },
        financial: {
            expectedAmount: 75000,
            currency: 'USD',
            proposals: [
                { name: 'Комерційна пропозиція v1', amount: 72000, status: 'Надіслано', date: '2024-05-08' },
                { name: 'Пакет підтримки', amount: 5000, status: 'Обговорюється', date: '2024-05-12' }
            ]
        },
        automation: {
            assignment: 'Менеджер: Emily Johnson (регіон США)',
            emailCampaigns: ['Вітальна послідовність для виробництва', 'Розсилка з кейсами клієнтів'],
            chatbots: ['Чат-бот сайту (форма RFP)'],
            calendarSync: ['Google Calendar'],
            integrations: ['Azure AD Sync', 'Slack Alerts']
        },
        analytics: {
            conversionProbability: 68,
            avgResponseHours: 12,
            sourceEffectiveness: 'Висока: 35% виграних угод з вебсайту',
            newLeadsThisMonth: 8,
            avgHandlingDays: 18,
            processingTimeDays: 34
        },
        security: {
            visibility: 'Доступ: команда продажів та передпродаж',
            auditLog: [
                { date: '2024-05-12T16:40:00Z', actor: 'Emily Johnson', action: 'Оновила статус на «Кваліфікований»' },
                { date: '2024-05-08T10:15:00Z', actor: 'Emily Johnson', action: 'Додала нотатку щодо вимог безпеки' }
            ]
        }
    },
    'lead-2': {
        contact: {
            fullName: 'Прія Патель',
            jobTitle: 'Операційний менеджер',
            phones: ['+1 (555) 210-4422 (роб.)'],
            emails: ['priya.patel@northwindlogistics.com'],
            address: '425 Harbor Ave, Сіетл, WA 98101, США',
            socials: [
                { label: 'LinkedIn', url: 'https://www.linkedin.com/in/priya-patel-ops' }
            ],
            language: 'англійська',
            timezone: 'America/Los_Angeles'
        },
        industry: 'Логістика та перевезення',
        sourceDetail: 'Рекомендація від партнера',
        funnel: {
            stage: 'Перший контакт',
            probability: 40,
            statusLabel: 'На зв’язку'
        },
        interest: {
            products: ['Кабінет клієнта', 'Модуль відстеження вантажів'],
            budget: '50 000 $',
            decisionTimeline: 'Липень 2024',
            pains: [
                'Потрібна прозорість для клієнтів щодо статусу доставки',
                'Шукають автоматизацію оновлень по SLA'
            ]
        },
        interactions: {
            communications: [
                {
                    type: 'call',
                    date: '2024-05-09T18:00:00Z',
                    subject: 'Обговорення сценаріїв кабінету',
                    summary: 'Прія наголосила на потребі інтеграції з їхнім TMS.',
                    owner: 'Michael Chen',
                    duration: '25 хв'
                },
                {
                    type: 'email',
                    date: '2024-05-05T15:20:00Z',
                    subject: 'Матеріали після зустрічі',
                    summary: 'Надіслано презентацію з прикладами UI та відео демо.',
                    owner: 'Michael Chen'
                }
            ],
            notes: [
                {
                    date: '2024-05-06T12:00:00Z',
                    author: 'Michael Chen',
                    content: 'Ключова мета — скоротити час відповіді клієнтам на 30%.'
                }
            ]
        },
        tasks: {
            upcoming: [
                {
                    title: 'Підготувати драфт комерційної пропозиції',
                    due: '2024-05-17',
                    owner: 'Michael Chen',
                    type: 'Document',
                    priority: 'Medium'
                }
            ],
            reminders: [
                {
                    title: 'Нагадати про референс-кейс',
                    due: '2024-05-19T08:30:00Z',
                    channel: 'Email-нагадування'
                }
            ]
        },
        segmentation: {
            tags: ['Холодний лід', 'B2B'],
            groups: ['Логістика', 'Західне узбережжя'],
            rating: 3.8
        },
        financial: {
            expectedAmount: 52000,
            currency: 'USD',
            proposals: [
                { name: 'Пропозиція кабінету клієнта', amount: 52000, status: 'Чернетка', date: '2024-05-14' }
            ]
        },
        automation: {
            assignment: 'Менеджер: Michael Chen (логістика)',
            emailCampaigns: ['Розсилка кейсів з логістики'],
            chatbots: ['Бот рекомендацій для партнерів'],
            calendarSync: ['Outlook'],
            integrations: ['Slack Connect']
        },
        analytics: {
            conversionProbability: 45,
            avgResponseHours: 18,
            sourceEffectiveness: 'Рекомендації конвертуються в 55% переговорів',
            newLeadsThisMonth: 3,
            avgHandlingDays: 12,
            processingTimeDays: 26
        },
        security: {
            visibility: 'Доступ: менеджери з продажів',
            auditLog: [
                { date: '2024-05-09T18:10:00Z', actor: 'Michael Chen', action: 'Додав нотатку про інтеграцію з TMS' }
            ]
        }
    },
    'lead-3': {
        contact: {
            fullName: 'Софія Мартінес',
            jobTitle: 'CMO',
            phones: ['+1 (555) 410-2233'],
            emails: ['sofia.martinez@startupxyz.com'],
            address: '1200 Congress Ave, Остін, TX 78701, США',
            socials: [
                { label: 'LinkedIn', url: 'https://www.linkedin.com/in/sofia-martinez-cmo' }
            ],
            language: 'іспанська',
            timezone: 'America/Chicago'
        },
        industry: 'Технологічні стартапи',
        sourceDetail: 'Конференція SaaS Growth',
        funnel: {
            stage: 'Пропозиція',
            probability: 55,
            statusLabel: 'Пропозиція'
        },
        interest: {
            products: ['Маркетингові автомations', 'CRM для стартапів'],
            budget: '30 000 $',
            decisionTimeline: 'Травень 2024',
            pains: [
                'Потрібно скоротити час запуску кампаній',
                'Шукають інтеграцію з існуючими рекламними платформами'
            ]
        },
        interactions: {
            communications: [
                {
                    type: 'meeting',
                    date: '2024-05-06T15:00:00Z',
                    subject: 'Обговорення пілоту',
                    summary: 'Софія погодилася на 4-тижневий тест з KPI по MQL.',
                    owner: 'Sofia Martinez',
                    participants: ['Sofia Martinez', 'Daniel Iverson']
                },
                {
                    type: 'email',
                    date: '2024-05-04T11:45:00Z',
                    subject: 'Перелік інтеграцій',
                    summary: 'Надіслано список доступних конекторів та API документацію.',
                    owner: 'Sofia Martinez'
                }
            ],
            notes: [
                {
                    date: '2024-05-07T09:20:00Z',
                    author: 'Sofia Martinez',
                    content: 'Цінують швидкість запуску — потрібно показати референси стартапів.'
                }
            ]
        },
        tasks: {
            upcoming: [
                {
                    title: 'Фіналізувати пропозицію по пілоту',
                    due: '2024-05-16',
                    owner: 'Sofia Martinez',
                    type: 'Document',
                    priority: 'High'
                }
            ],
            reminders: [
                {
                    title: 'Надіслати roadmap продукту',
                    due: '2024-05-15T10:00:00Z',
                    channel: 'CRM-сповіщення'
                }
            ]
        },
        segmentation: {
            tags: ['Гарячий лід', 'Стартап'],
            groups: ['Маркетинг', 'Accelerator 2024'],
            rating: 4.2
        },
        financial: {
            expectedAmount: 28000,
            currency: 'USD',
            proposals: [
                { name: 'Маркетингова автоматизація – пілот', amount: 28000, status: 'Надіслано', date: '2024-05-05' }
            ]
        },
        automation: {
            assignment: 'Менеджер: Sofia Martinez (стартапи)',
            emailCampaigns: ['Розсилка для SaaS стартапів'],
            chatbots: ['Бот реєстрації на демо'],
            calendarSync: ['Google Calendar'],
            integrations: ['Zapier Sync']
        },
        analytics: {
            conversionProbability: 62,
            avgResponseHours: 9,
            sourceEffectiveness: 'Конференції дають 25% угод у цьому сегменті',
            newLeadsThisMonth: 5,
            avgHandlingDays: 10,
            processingTimeDays: 21
        },
        security: {
            visibility: 'Доступ: команда з розвитку стартапів',
            auditLog: [
                { date: '2024-05-06T15:45:00Z', actor: 'Sofia Martinez', action: 'Оновила етап на «Пропозиція»' }
            ]
        }
    }
};

const leadExperienceState = {
    selectedLeadId: null,
    leads: [],
    leadsById: new Map()
};

function enrichLeadRecord(lead = {}) {
    if (!lead || typeof lead !== 'object') {
        return lead;
    }

    const template = LEAD_DETAIL_LIBRARY[lead.id] || {};
    const detailProfile = buildLeadDetailProfile(lead, template);

    return {
        ...lead,
        contact_name: lead.contact_name || detailProfile.contact.fullName || lead.contact_email || '',
        contact_email: lead.contact_email || (detailProfile.contact.emails[0] || ''),
        detailProfile
    };
}

function buildLeadDetailProfile(lead = {}, template = {}) {
    const contactTemplate = template.contact || {};
    const contactPhones = ensureArray(contactTemplate.phones || (lead.contact_phone ? [lead.contact_phone] : []));
    const contactEmails = ensureArray(contactTemplate.emails || (lead.contact_email ? [lead.contact_email] : []));
    const contactSocials = ensureArray(contactTemplate.socials).map(social => ({
        label: social?.label || social?.url || '',
        url: social?.url || ''
    })).filter(item => item.label || item.url);

    const funnelTemplate = template.funnel || {};
    const interestTemplate = template.interest || {};
    const interactionsTemplate = template.interactions || {};
    const tasksTemplate = template.tasks || {};
    const segmentationTemplate = template.segmentation || {};
    const financialTemplate = template.financial || {};
    const automationTemplate = template.automation || {};
    const analyticsTemplate = template.analytics || {};
    const securityTemplate = template.security || {};

    return {
        contact: {
            fullName: contactTemplate.fullName || lead.contact_name || '',
            jobTitle: contactTemplate.jobTitle || lead.contact_title || '',
            phones: contactPhones,
            emails: contactEmails,
            address: contactTemplate.address || lead.contact_address || '',
            socials: contactSocials,
            language: contactTemplate.language || lead.contact_language || '',
            timezone: contactTemplate.timezone || lead.contact_timezone || ''
        },
        company: template.company || lead.company_name || '',
        industry: template.industry || lead.industry || '',
        source: template.sourceDetail || lead.source || '',
        funnel: {
            stage: funnelTemplate.stage || lead.stage || lead.status || 'New',
            probability: funnelTemplate.probability ?? lead.probability ?? null,
            statusLabel: funnelTemplate.statusLabel || translateLeadStatus(lead.status || '') || lead.status || 'Новий'
        },
        interest: {
            products: ensureArray(interestTemplate.products),
            budget: interestTemplate.budget || (lead.budget ? formatCurrency(lead.budget) : ''),
            decisionTimeline: interestTemplate.decisionTimeline || lead.decision_timeline || '',
            pains: ensureArray(interestTemplate.pains)
        },
        interactions: {
            communications: ensureArray(interactionsTemplate.communications),
            notes: ensureArray(interactionsTemplate.notes)
        },
        tasks: {
            upcoming: ensureArray(tasksTemplate.upcoming),
            reminders: ensureArray(tasksTemplate.reminders)
        },
        segmentation: {
            tags: ensureArray(segmentationTemplate.tags),
            groups: ensureArray(segmentationTemplate.groups),
            rating: segmentationTemplate.rating ?? null
        },
        financial: {
            expectedAmount: financialTemplate.expectedAmount ?? lead.value ?? null,
            currency: financialTemplate.currency || 'USD',
            proposals: ensureArray(financialTemplate.proposals)
        },
        automation: {
            assignment: automationTemplate.assignment || '',
            emailCampaigns: ensureArray(automationTemplate.emailCampaigns),
            chatbots: ensureArray(automationTemplate.chatbots),
            calendarSync: ensureArray(automationTemplate.calendarSync),
            integrations: ensureArray(automationTemplate.integrations)
        },
        analytics: {
            conversionProbability: analyticsTemplate.conversionProbability ?? lead.probability ?? null,
            avgResponseHours: analyticsTemplate.avgResponseHours ?? null,
            sourceEffectiveness: analyticsTemplate.sourceEffectiveness || '',
            newLeadsThisMonth: analyticsTemplate.newLeadsThisMonth ?? null,
            avgHandlingDays: analyticsTemplate.avgHandlingDays ?? null,
            processingTimeDays: analyticsTemplate.processingTimeDays ?? null
        },
        security: {
            visibility: securityTemplate.visibility || '',
            auditLog: ensureArray(securityTemplate.auditLog)
        }
    };
}

function ensureArray(value) {
    if (!value) {
        return [];
    }
    if (Array.isArray(value)) {
        return value.filter(item => item !== undefined && item !== null);
    }
    return [value];
}

function selectLead(leadId) {
    const normalizedId = leadId ? String(leadId) : '';
    if (!normalizedId || !leadExperienceState.leadsById.has(normalizedId)) {
        return;
    }

    leadExperienceState.selectedLeadId = normalizedId;
    const selectedLead = leadExperienceState.leadsById.get(normalizedId) || null;
    renderLeadDetail(selectedLead);
    renderLeadAnalytics(leadExperienceState.leads);
    updateLeadSelectionHighlight();
}

function setupLeadRowSelection() {
    const rows = document.querySelectorAll('[data-lead-row]');
    rows.forEach(row => {
        if (row.dataset.leadRowInitialized === 'true') {
            return;
        }
        row.dataset.leadRowInitialized = 'true';
        row.addEventListener('click', event => {
            if (event.target.closest('button') || event.target.closest('select') || event.target.closest('a')) {
                return;
            }
            const leadId = row.getAttribute('data-lead-id');
            if (leadId) {
                selectLead(String(leadId));
            }
        });
    });
}

function updateLeadSelectionHighlight() {
    const activeId = leadExperienceState.selectedLeadId ? String(leadExperienceState.selectedLeadId) : '';

    document.querySelectorAll('[data-lead-row]').forEach(row => {
        const rowId = row.getAttribute('data-lead-id') || '';
        const isActive = activeId && rowId === activeId;
        row.classList.toggle('ring-2', isActive);
        row.classList.toggle('ring-blue-300', isActive);
        row.classList.toggle('bg-blue-50/60', isActive);
        row.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    document.querySelectorAll('[data-lead-kanban-card]').forEach(card => {
        const cardId = card.getAttribute('data-lead-id') || '';
        const isActive = activeId && cardId === activeId;
        card.classList.toggle('ring-2', isActive);
        card.classList.toggle('ring-blue-300', isActive);
        card.classList.toggle('shadow-lg', isActive);
        card.classList.toggle('shadow-sm', !isActive);
    });
}

function renderLeadSummary(leads = []) {
    const container = document.getElementById('leadSummaryCards');
    if (!container) {
        return;
    }

    if (!Array.isArray(leads) || leads.length === 0) {
        container.innerHTML = `
            <div class="bg-white border border-dashed border-gray-200 rounded-xl p-6 text-center text-sm text-gray-500">
                Додайте перший лід, щоб побачити ключові показники.
            </div>
        `;
        return;
    }

    const metrics = calculateLeadMetrics(leads);
    const summaryCards = [
        {
            title: 'Усього лідів',
            value: metrics.total,
            subtitle: `+${metrics.newThisMonth} цього місяця`,
            icon: 'fa-bullseye',
            accent: 'bg-blue-50 text-blue-700'
        },
        {
            title: 'Конверсія (виграні)',
            value: `${metrics.conversionRate}%`,
            subtitle: `${metrics.won} угод завершено`,
            icon: 'fa-flag-checkered',
            accent: 'bg-emerald-50 text-emerald-700'
        },
        {
            title: 'Гарячі ліди',
            value: metrics.hot,
            subtitle: 'Високий та критичний пріоритет',
            icon: 'fa-fire',
            accent: 'bg-orange-50 text-orange-700'
        },
        {
            title: 'Середня ймовірність',
            value: `${metrics.avgProbability}%`,
            subtitle: `Сер. час обробки ${metrics.avgHandlingDays} дн.`,
            icon: 'fa-chart-line',
            accent: 'bg-purple-50 text-purple-700'
        }
    ];

    container.innerHTML = summaryCards.map(card => `
        <div class="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
            <div class="${card.accent} rounded-full h-12 w-12 flex items-center justify-center text-lg">
                <i class="fas ${sanitizeText(card.icon)}"></i>
            </div>
            <div>
                <p class="text-xs uppercase tracking-wide text-gray-500">${sanitizeText(card.title)}</p>
                <p class="text-2xl font-semibold text-gray-800">${sanitizeText(card.value)}</p>
                <p class="text-xs text-gray-500 mt-1">${sanitizeText(card.subtitle)}</p>
            </div>
        </div>
    `).join('');
}

function calculateLeadMetrics(leads = []) {
    const total = leads.length;
    const won = leads.filter(lead => (lead.status || '').toLowerCase() === 'won').length;
    const conversionRate = total ? Math.round((won / total) * 100) : 0;
    const hot = leads.filter(lead => ['high', 'critical'].includes((lead.priority || '').toLowerCase())).length;

    const probabilityValues = leads
        .map(lead => Number(lead.probability))
        .filter(value => Number.isFinite(value));
    const avgProbability = probabilityValues.length
        ? Math.round(probabilityValues.reduce((sum, value) => sum + value, 0) / probabilityValues.length)
        : 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const newThisMonth = leads.filter(lead => {
        if (!lead.created_at) {
            return false;
        }
        const created = new Date(lead.created_at);
        if (Number.isNaN(created.getTime())) {
            return false;
        }
        return created.getMonth() === currentMonth && created.getFullYear() === currentYear;
    }).length;

    const statusCounts = leads.reduce((acc, lead) => {
        const status = lead.status || 'Невідомий';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    const sourceCounts = leads.reduce((acc, lead) => {
        const source = lead.source || 'Невідоме джерело';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
    }, {});

    const priorityCounts = leads.reduce((acc, lead) => {
        const priority = lead.priority || 'Не вказано';
        acc[priority] = (acc[priority] || 0) + 1;
        return acc;
    }, {});

    const handlingDurations = leads.map(lead => {
        if (!lead.created_at) {
            return null;
        }
        const created = new Date(lead.created_at);
        const referenceDate = lead.updated_at
            ? new Date(lead.updated_at)
            : (lead.expected_close_date ? new Date(lead.expected_close_date) : now);
        if (Number.isNaN(created.getTime()) || Number.isNaN(referenceDate.getTime())) {
            return null;
        }
        const diffMs = referenceDate.getTime() - created.getTime();
        return Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    }).filter(value => Number.isFinite(value));
    const avgHandlingDays = handlingDurations.length
        ? Math.max(1, Math.round(handlingDurations.reduce((sum, value) => sum + value, 0) / handlingDurations.length))
        : 0;

    return {
        total,
        won,
        conversionRate,
        hot,
        avgProbability,
        newThisMonth,
        statusCounts,
        sourceCounts,
        priorityCounts,
        avgHandlingDays
    };
}

function renderLeadAnalytics(leads = []) {
    const panel = document.getElementById('leadAnalyticsPanel');
    if (!panel) {
        return;
    }

    if (!Array.isArray(leads) || leads.length === 0) {
        panel.innerHTML = `
            <div class="text-sm text-gray-500">Немає даних для побудови аналітики. Додайте ліди або зніміть фільтри.</div>
        `;
        if (charts.leadStatusDistribution) {
            charts.leadStatusDistribution.destroy();
            charts.leadStatusDistribution = null;
        }
        return;
    }

    const metrics = calculateLeadMetrics(leads);
    const selectedLead = leadExperienceState.selectedLeadId
        ? leadExperienceState.leadsById.get(leadExperienceState.selectedLeadId)
        : null;
    const selectedAnalytics = selectedLead?.detailProfile?.analytics || {};

    const statusLabels = Object.keys(metrics.statusCounts);
    const statusData = statusLabels.map(label => metrics.statusCounts[label]);

    panel.innerHTML = `
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
                <h3 class="text-lg font-semibold text-gray-800">Аналітика по лідах</h3>
                <p class="text-sm text-gray-500">Відстежуйте конверсію, ефективність джерел та швидкість роботи з лідами.</p>
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                    <p class="text-xs uppercase text-gray-400">Конверсія</p>
                    <p class="text-lg font-semibold text-gray-800">${sanitizeText(`${metrics.conversionRate}%`)}</p>
                </div>
                <div>
                    <p class="text-xs uppercase text-gray-400">Сер. час обробки</p>
                    <p class="text-lg font-semibold text-gray-800">${sanitizeText(`${metrics.avgHandlingDays} дн.`)}</p>
                </div>
            </div>
        </div>
        <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div class="h-64">
                <canvas id="leadStatusChart" height="220"></canvas>
            </div>
            <div class="space-y-4">
                <div class="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p class="text-sm font-semibold text-blue-800">Активний лід</p>
                    <p class="text-sm text-blue-700 mt-1">${selectedLead ? sanitizeText(selectedLead.title || selectedLead.id || '') : 'Оберіть лід зі списку або канбану.'}</p>
                    ${selectedLead ? `
                        <ul class="mt-3 space-y-1 text-sm text-blue-900">
                            <li><i class="far fa-chart-bar mr-2"></i>Ймовірність: ${sanitizeText(`${selectedAnalytics.conversionProbability ?? selectedLead.probability ?? 0}%`)}</li>
                            <li><i class="far fa-clock mr-2"></i>Середній відгук: ${sanitizeText(selectedAnalytics.avgResponseHours !== null && selectedAnalytics.avgResponseHours !== undefined ? `${selectedAnalytics.avgResponseHours} год` : '—')}</li>
                            <li><i class="fas fa-bolt mr-2"></i>${sanitizeText(selectedAnalytics.sourceEffectiveness || `Джерело: ${selectedLead.source || '—'}`)}</li>
                        </ul>
                    ` : ''}
                </div>
                <div>
                    <h4 class="text-sm font-semibold text-gray-700 mb-2">Найрезультативніші джерела</h4>
                    <ul class="space-y-1 text-sm text-gray-600">
                        ${Object.entries(metrics.sourceCounts)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 4)
                            .map(([source, count]) => `
                                <li class="flex items-center justify-between">
                                    <span>${sanitizeText(source || 'Невідоме джерело')}</span>
                                    <span class="font-semibold text-gray-800">${sanitizeText(String(count))}</span>
                                </li>
                            `)
                            .join('') || '<li class="text-gray-400">Дані відсутні</li>'}
                    </ul>
                </div>
            </div>
        </div>
    `;

    const chartElement = document.getElementById('leadStatusChart');
    if (chartElement && typeof Chart !== 'undefined') {
        if (charts.leadStatusDistribution) {
            charts.leadStatusDistribution.destroy();
        }
        const palette = ['#2563eb', '#f97316', '#10b981', '#facc15', '#8b5cf6', '#ef4444', '#64748b'];
        charts.leadStatusDistribution = new Chart(chartElement.getContext('2d'), {
            type: 'bar',
            data: {
                labels: statusLabels,
                datasets: [
                    {
                        label: 'Кількість лідів',
                        data: statusData,
                        backgroundColor: statusLabels.map((_, index) => palette[index % palette.length]),
                        borderRadius: 8
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
                            precision: 0
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }
}

function renderLeadFilterPanel(leads = []) {
    const panel = document.getElementById('leadFilterPanel');
    if (!panel) {
        return;
    }

    if (!Array.isArray(leads) || leads.length === 0) {
        panel.innerHTML = `
            <div class="text-sm text-gray-500">Фільтри стануть доступними після додавання лідів.</div>
        `;
        return;
    }

    const metrics = calculateLeadMetrics(leads);
    const topManager = getTopLeadManager(leads);
    const dateRange = getLeadDateRange(leads);

    const statusChips = Object.entries(metrics.statusCounts)
        .map(([status, count]) => {
            const label = translateLeadStatus(status) || status;
            return `<span class="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs"><i class="fas fa-circle mr-1 text-[8px]"></i>${sanitizeText(label)}<span class="ml-2 rounded-full bg-white px-2 py-0.5 border border-slate-200 text-slate-600">${sanitizeText(String(count))}</span></span>`;
        })
        .join('');

    const priorityChips = Object.entries(metrics.priorityCounts)
        .map(([priority, count]) => `<span class="inline-flex items-center px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs"><i class="fas fa-layer-group mr-1"></i>${sanitizeText(priority)}<span class="ml-2 rounded-full bg-white px-2 py-0.5 border border-amber-200 text-amber-600">${sanitizeText(String(count))}</span></span>`)
        .join('');

    panel.innerHTML = `
        <div class="flex items-start justify-between gap-4">
            <div>
                <h3 class="text-lg font-semibold text-gray-800">Фільтри та пошук</h3>
                <p class="text-sm text-gray-500">Швидко відфільтруйте ліди за статусом, джерелом або відповідальним менеджером.</p>
            </div>
            <div class="text-xs text-gray-400">${dateRange}</div>
        </div>
        <div class="mt-6 space-y-5 text-sm text-gray-600">
            <div>
                <p class="text-xs uppercase text-gray-500 mb-2">Статус</p>
                <div class="flex flex-wrap gap-2">${statusChips || '<span class="text-gray-400">Дані відсутні</span>'}</div>
            </div>
            <div>
                <p class="text-xs uppercase text-gray-500 mb-2">Пріоритет</p>
                <div class="flex flex-wrap gap-2">${priorityChips || '<span class="text-gray-400">Дані відсутні</span>'}</div>
            </div>
            <div>
                <p class="text-xs uppercase text-gray-500 mb-2">Рекомендований менеджер</p>
                <div class="flex flex-wrap gap-2">
                    ${topManager ? `<span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs"><i class="fas fa-user-check"></i>${sanitizeText(topManager.name)}<span class="ml-2 rounded-full bg-white px-2 py-0.5 border border-emerald-200 text-emerald-600">${sanitizeText(String(topManager.count))}</span></span>` : '<span class="text-gray-400">Не призначено</span>'}
                </div>
            </div>
            <div class="border border-dashed border-gray-200 rounded-lg p-4 bg-gray-50">
                <p class="text-xs uppercase text-gray-500 mb-2">Поради з пошуку</p>
                <ul class="space-y-2 text-sm text-gray-600 list-disc list-inside">
                    <li>Вводьте email або телефон для швидкого пошуку конкретного контакту.</li>
                    <li>Комбінуйте статус та джерело, щоб оцінити ефективність каналів залучення.</li>
                    <li>Зберігайте фільтри як представлення, щоб команда працювала в одному контексті.</li>
                </ul>
            </div>
        </div>
    `;
}

function getTopLeadManager(leads = []) {
    const counts = new Map();
    leads.forEach(lead => {
        if (!lead.assigned_to) {
            return;
        }
        const key = String(lead.assigned_to);
        counts.set(key, (counts.get(key) || 0) + 1);
    });

    if (!counts.size) {
        return null;
    }

    const [name, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    return { name, count };
}

function getLeadDateRange(leads = []) {
    const dates = leads
        .map(lead => new Date(lead.created_at))
        .filter(date => date instanceof Date && !Number.isNaN(date.getTime()));
    if (!dates.length) {
        return '';
    }
    const earliest = new Date(Math.min(...dates.map(date => date.getTime())));
    const latest = new Date(Math.max(...dates.map(date => date.getTime())));

    const formatter = new Intl.DateTimeFormat(currentLanguage === 'uk' ? 'uk-UA' : undefined, {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    return `${formatter.format(earliest)} – ${formatter.format(latest)}`;
}

function renderLeadDetail(lead) {
    const primaryContainer = document.getElementById('leadDetailPrimary');
    const sidebarContainer = document.getElementById('leadDetailSidebar');
    if (!primaryContainer || !sidebarContainer) {
        return;
    }

    if (!lead) {
        primaryContainer.innerHTML = `
            <div class="bg-white border border-dashed border-gray-200 rounded-xl p-6 text-center text-sm text-gray-500">
                Оберіть лід у таблиці або на канбані, щоб переглянути деталі.
            </div>
        `;
        sidebarContainer.innerHTML = `
            <div class="bg-white border border-gray-100 rounded-xl p-6 text-sm text-gray-600">
                <p class="font-semibold text-gray-700">Порада</p>
                <p class="mt-2">Використовуйте статуси та пріоритети, щоб сортувати ліди й планувати навантаження команди.</p>
            </div>
        `;
        return;
    }

    const profile = lead.detailProfile || buildLeadDetailProfile(lead);

    primaryContainer.innerHTML = [
        buildLeadPrimaryInfoHtml(lead, profile),
        buildLeadInterestHtml(profile),
        buildLeadHistoryHtml(profile)
    ].join('');

    sidebarContainer.innerHTML = [
        buildLeadTasksHtml(profile),
        buildLeadSegmentationHtml(profile),
        buildLeadFinancialHtml(profile),
        buildLeadAutomationHtml(profile),
        buildLeadSecurityHtml(profile)
    ].join('');
}

function buildLeadPrimaryInfoHtml(lead, profile) {
    const contact = profile.contact || {};
    const statusClass = getStatusClass(lead.status || profile.funnel?.statusLabel || 'New');
    const probability = profile.funnel?.probability ?? lead.probability;

    const phones = ensureArray(contact.phones)
        .map(phone => {
            const href = `tel:${String(phone).replace(/[^0-9+]/g, '')}`;
            return `<a href="${sanitizeText(href)}" class="text-blue-600 hover:underline">${sanitizeText(phone)}</a>`;
        })
        .join('<br>');

    const emails = ensureArray(contact.emails)
        .map(email => `<a href="mailto:${sanitizeText(email)}" class="text-blue-600 hover:underline">${sanitizeText(email)}</a>`)
        .join('<br>');

    const socials = ensureArray(contact.socials)
        .map(social => social?.url
            ? `<a href="${sanitizeText(social.url)}" target="_blank" rel="noopener" class="text-blue-600 hover:underline">${sanitizeText(social.label || social.url)}</a>`
            : '')
        .filter(Boolean)
        .join('<br>');

    return `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                    <h4 class="text-xl font-semibold text-gray-800">${sanitizeText(lead.title || 'Лід без назви')}</h4>
                    <div class="flex flex-wrap gap-2 mt-3 text-xs font-medium">
                        <span class="px-3 py-1 rounded-full text-white ${statusClass}">${sanitizeText(profile.funnel?.statusLabel || lead.status || 'Новий')}</span>
                        <span class="px-3 py-1 rounded-full bg-purple-100 text-purple-700">${sanitizeText(profile.funnel?.stage || lead.status || 'Етап не вказано')}</span>
                        ${lead.priority ? `<span class="px-3 py-1 rounded-full text-xs ${getPriorityClass(lead.priority)}">${sanitizeText(translateLeadPriority(lead.priority) || lead.priority)}</span>` : ''}
                        ${Number.isFinite(Number(probability)) ? `<span class="px-3 py-1 rounded-full bg-blue-50 text-blue-700"><i class="fas fa-percentage mr-1"></i>${sanitizeText(`${Math.round(Number(probability))}%`)}</span>` : ''}
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                        <p class="text-xs uppercase text-gray-400">Очікувана сума</p>
                        <p class="text-sm font-semibold text-gray-800">${sanitizeText(formatCurrency(profile.financial?.expectedAmount ?? lead.value ?? 0))}</p>
                    </div>
                    <div>
                        <p class="text-xs uppercase text-gray-400">Відповідальний</p>
                        <p class="text-sm font-semibold text-gray-800">${sanitizeText(lead.assigned_to || 'Не призначено')}</p>
                    </div>
                    <div>
                        <p class="text-xs uppercase text-gray-400">Джерело</p>
                        <p class="text-sm font-semibold text-gray-800">${sanitizeText(profile.source || 'Не вказано')}</p>
                    </div>
                    <div>
                        <p class="text-xs uppercase text-gray-400">Дата створення</p>
                        <p class="text-sm font-semibold text-gray-800">${lead.created_at ? sanitizeText(formatDateLocalized(lead.created_at)) : '—'}</p>
                    </div>
                </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-4">
                    <h5 class="text-xs uppercase tracking-wide text-gray-500">Контактні дані</h5>
                    ${buildInfoItem('fa-user', 'ПІБ контакту', contact.fullName || 'Не вказано')}
                    ${buildInfoItem('fa-id-badge', 'Посада', contact.jobTitle || 'Не вказано')}
                    ${buildInfoItem('fa-phone', 'Телефони', phones || 'Не вказано', { allowHtml: true })}
                    ${buildInfoItem('fa-envelope', 'Email', emails || 'Не вказано', { allowHtml: true })}
                </div>
                <div class="space-y-4">
                    <h5 class="text-xs uppercase tracking-wide text-gray-500">Компанія та взаємодія</h5>
                    ${buildInfoItem('fa-building', 'Компанія', profile.company || 'Не вказано')}
                    ${buildInfoItem('fa-industry', 'Галузь', profile.industry || 'Не вказано')}
                    ${buildInfoItem('fa-map-marker-alt', 'Адреса', contact.address || 'Не вказано')}
                    ${buildInfoItem('fa-language', 'Мова спілкування', contact.language || 'Не вказано')}
                    ${buildInfoItem('fa-clock', 'Часовий пояс', contact.timezone || 'Не вказано')}
                    ${buildInfoItem('fa-share-nodes', 'Соціальні мережі', socials || 'Не вказано', { allowHtml: true })}
                </div>
            </div>
        </div>
    `;
}

function buildInfoItem(icon, label, value, options = {}) {
    const { allowHtml = false } = options;
    const safeLabel = sanitizeText(label);
    const displayValue = value && value !== 'Не вказано'
        ? (allowHtml ? value : sanitizeText(value))
        : '<span class="text-gray-400">Не вказано</span>';
    return `
        <div class="flex items-start gap-3 text-sm text-gray-600">
            <span class="mt-1 text-blue-500"><i class="fas ${sanitizeText(icon)}"></i></span>
            <div>
                <p class="text-xs font-semibold uppercase text-gray-500 tracking-wide">${safeLabel}</p>
                <div class="mt-1 leading-snug">${displayValue || '<span class="text-gray-400">Не вказано</span>'}</div>
            </div>
        </div>
    `;
}

function renderChipList(values = [], options = {}) {
    const tone = options.tone || 'blue';
    const palette = {
        blue: 'bg-blue-50 text-blue-700 border border-blue-100',
        emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
        purple: 'bg-purple-50 text-purple-700 border border-purple-100',
        slate: 'bg-slate-100 text-slate-700 border border-slate-200'
    };
    const chipClass = palette[tone] || palette.blue;
    const normalized = ensureArray(values).filter(Boolean);
    if (!normalized.length) {
        return '<span class="text-gray-400">Не вказано</span>';
    }
    return normalized.map(value => `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${chipClass}">${sanitizeText(value)}</span>`).join(' ');
}

function buildLeadInterestHtml(profile) {
    const interest = profile.interest || {};
    return `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div>
                <h4 class="text-lg font-semibold text-gray-800">Інтерес та потреби ліда</h4>
                <p class="text-sm text-gray-500">Зафіксуйте ключові продукти, очікуваний бюджет та проблеми клієнта.</p>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                <div>
                    <p class="text-xs uppercase text-gray-400">Продукт / послуга</p>
                    <div class="mt-2">${renderChipList(interest.products)}</div>
                </div>
                <div>
                    <p class="text-xs uppercase text-gray-400">Бюджет</p>
                    <p class="mt-2 font-semibold text-gray-800">${sanitizeText(interest.budget || 'Не вказано')}</p>
                </div>
                <div>
                    <p class="text-xs uppercase text-gray-400">Термін рішення</p>
                    <p class="mt-2 font-semibold text-gray-800">${sanitizeText(interest.decisionTimeline || 'Не вказано')}</p>
                </div>
            </div>
            <div>
                <p class="text-xs uppercase text-gray-400">Потреби та болі</p>
                <ul class="mt-2 space-y-2 text-sm text-gray-700">
                    ${ensureArray(interest.pains).length
                        ? ensureArray(interest.pains).map(item => `<li class="flex gap-2"><span class="text-blue-500 mt-1"><i class="fas fa-circle text-[6px]"></i></span><span>${sanitizeText(item)}</span></li>`).join('')
                        : '<li class="text-gray-400">Дані відсутні</li>'}
                </ul>
            </div>
        </div>
    `;
}

function buildLeadHistoryHtml(profile) {
    const interactions = profile.interactions || {};
    const communications = ensureArray(interactions.communications);
    const notes = ensureArray(interactions.notes);

    return `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div class="flex items-start justify-between gap-4">
                <div>
                    <h4 class="text-lg font-semibold text-gray-800">Історія взаємодій</h4>
                    <p class="text-sm text-gray-500">Хронологія дзвінків, листів та зустрічей допоможе не втратити контекст.</p>
                </div>
            </div>
            <div class="space-y-4">
                ${communications.length
                    ? communications.map(item => buildLeadTimelineItem(item)).join('')
                    : '<div class="text-sm text-gray-400">Взаємодій поки не зафіксовано.</div>'}
            </div>
            ${notes.length
                ? `<div class="pt-4 border-t border-gray-100"><h5 class="text-xs uppercase text-gray-400 mb-2">Нотатки</h5>${notes.map(note => `<div class="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-900 mb-2"><div class="flex justify-between text-xs text-blue-700"><span>${sanitizeText(note.author || 'Команда')}</span><span>${sanitizeText(formatDateLocalized(note.date, { includeTime: false }))}</span></div><p class="mt-2 leading-snug">${sanitizeText(note.content || '')}</p></div>`).join('')}</div>`
                : ''}
        </div>
    `;
}

function buildLeadTimelineItem(item) {
    const type = (item.type || 'interaction').toLowerCase();
    const iconMap = {
        call: 'fa-phone',
        email: 'fa-envelope',
        meeting: 'fa-handshake',
        chat: 'fa-comments',
        interaction: 'fa-circle'
    };
    const icon = iconMap[type] || iconMap.interaction;
    const timestamp = formatDateLocalized(item.date, { includeTime: true });
    const owner = item.owner ? `<span class="inline-flex items-center gap-1"><i class="fas fa-user-circle text-gray-400"></i>${sanitizeText(item.owner)}</span>` : '';
    const duration = item.duration ? `<span class="inline-flex items-center gap-1"><i class="far fa-clock text-gray-400"></i>${sanitizeText(item.duration)}</span>` : '';
    const participants = ensureArray(item.participants).length
        ? `<div class="text-xs text-gray-500 mt-1">Учасники: ${sanitizeText(ensureArray(item.participants).join(', '))}</div>`
        : '';

    return `
        <div class="border border-gray-100 rounded-lg p-4 hover:border-blue-200 transition-colors">
            <div class="flex items-start gap-3">
                <span class="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><i class="fas ${sanitizeText(icon)}"></i></span>
                <div class="flex-1 space-y-1">
                    <div class="flex items-center justify-between text-sm text-gray-600">
                        <span class="font-semibold text-gray-800">${sanitizeText(item.subject || 'Взаємодія')}</span>
                        <span>${sanitizeText(timestamp || '')}</span>
                    </div>
                    <p class="text-sm text-gray-600">${sanitizeText(item.summary || 'Без опису')}</p>
                    <div class="flex flex-wrap gap-3 text-xs text-gray-500">
                        ${owner}
                        ${duration}
                    </div>
                    ${participants}
                </div>
            </div>
        </div>
    `;
}

function formatDateLocalized(value, options = {}) {
    if (!value) {
        return '';
    }
    try {
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return '';
        }
        const locale = currentLanguage === 'uk' ? 'uk-UA' : undefined;
        const formatter = new Intl.DateTimeFormat(locale, {
            dateStyle: 'medium',
            ...(options.includeTime ? { timeStyle: 'short' } : {})
        });
        return formatter.format(date);
    } catch (error) {
        return '';
    }
}

function buildLeadTasksHtml(profile) {
    const tasks = ensureArray(profile.tasks?.upcoming);
    const reminders = ensureArray(profile.tasks?.reminders);

    return `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div>
                <h4 class="text-lg font-semibold text-gray-800">Завдання та нагадування</h4>
                <p class="text-sm text-gray-500">Плануйте дзвінки, зустрічі та автоматичні нагадування по ліду.</p>
            </div>
            <div class="space-y-3">
                ${tasks.length
                    ? tasks.map(task => {
                        const due = task.due ? formatDateLocalized(task.due) : '';
                        return `<div class="border border-gray-100 rounded-lg p-3">
                            <div class="flex items-start justify-between gap-3">
                                <div>
                                    <p class="text-sm font-semibold text-gray-800">${sanitizeText(task.title || 'Завдання')}</p>
                                    <p class="text-xs text-gray-500 mt-1">${sanitizeText(task.type || '')}</p>
                                </div>
                                <div class="text-right text-xs text-gray-500 space-y-1">
                                    ${due ? `<div><i class="far fa-calendar mr-1"></i>${sanitizeText(due)}</div>` : ''}
                                    ${task.owner ? `<div><i class="fas fa-user mr-1"></i>${sanitizeText(task.owner)}</div>` : ''}
                                </div>
                            </div>
                            ${task.priority ? `<span class="inline-flex items-center mt-2 px-2 py-1 rounded-full text-xs ${getPriorityClass(task.priority)}">${sanitizeText(task.priority)}</span>` : ''}
                        </div>`;
                    }).join('')
                    : '<div class="text-sm text-gray-400">Активних завдань немає.</div>'}
            </div>
            ${reminders.length
                ? `<div class="pt-3 border-t border-gray-100">
                        <h5 class="text-xs uppercase text-gray-400 mb-2">Нагадування</h5>
                        <ul class="space-y-2 text-sm text-gray-600">
                            ${reminders.map(reminder => `<li class="flex justify-between"><span>${sanitizeText(reminder.title || '')}</span><span class="text-xs text-gray-500">${sanitizeText(formatDateLocalized(reminder.due, { includeTime: true }))}</span></li>`).join('')}
                        </ul>
                    </div>`
                : ''}
        </div>
    `;
}

function buildLeadSegmentationHtml(profile) {
    const segmentation = profile.segmentation || {};
    return `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div>
                <h4 class="text-lg font-semibold text-gray-800">Сегментація та категоризація</h4>
                <p class="text-sm text-gray-500">Позначайте теги, групи та рейтинг ліда, щоб команда розуміла пріоритет.</p>
            </div>
            <div class="space-y-3 text-sm text-gray-600">
                <div>
                    <p class="text-xs uppercase text-gray-400 mb-1">Теги</p>
                    <div class="flex flex-wrap gap-2">${renderChipList(segmentation.tags, { tone: 'purple' })}</div>
                </div>
                <div>
                    <p class="text-xs uppercase text-gray-400 mb-1">Групи</p>
                    <div class="flex flex-wrap gap-2">${renderChipList(segmentation.groups, { tone: 'emerald' })}</div>
                </div>
                <div>
                    <p class="text-xs uppercase text-gray-400 mb-1">Рейтинг</p>
                    ${renderRatingStars(segmentation.rating)}
                </div>
            </div>
        </div>
    `;
}

function renderRatingStars(rating) {
    if (!rating) {
        return '<span class="text-gray-400">Не оцінено</span>';
    }
    const maxStars = 5;
    const fullStars = Math.floor(rating);
    const halfStar = rating - fullStars >= 0.5;
    const stars = [];
    for (let i = 0; i < fullStars; i += 1) {
        stars.push('<i class="fas fa-star text-amber-400"></i>');
    }
    if (halfStar) {
        stars.push('<i class="fas fa-star-half-alt text-amber-400"></i>');
    }
    while (stars.length < maxStars) {
        stars.push('<i class="far fa-star text-amber-200"></i>');
    }
    return `<div class="flex items-center gap-1 text-lg">${stars.join('')}<span class="text-sm text-gray-500 ml-2">${sanitizeText(rating.toFixed(1))}</span></div>`;
}

function buildLeadFinancialHtml(profile) {
    const financial = profile.financial || {};
    const proposals = ensureArray(financial.proposals);

    return `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div>
                <h4 class="text-lg font-semibold text-gray-800">Фінансова інформація</h4>
                <p class="text-sm text-gray-500">Оцінюйте потенціал угоди та історію пропозицій.</p>
            </div>
            <div class="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                    <p class="text-xs uppercase text-gray-400">Очікувана сума угоди</p>
                    <p class="text-lg font-semibold text-gray-800">${sanitizeText(formatCurrency(financial.expectedAmount ?? 0))}</p>
                </div>
                <div>
                    <p class="text-xs uppercase text-gray-400">Валюта</p>
                    <p class="text-lg font-semibold text-gray-800">${sanitizeText(financial.currency || 'USD')}</p>
                </div>
            </div>
            <div>
                <p class="text-xs uppercase text-gray-400 mb-2">Історія пропозицій</p>
                ${proposals.length
                    ? `<div class="space-y-2">${proposals.map(proposal => `<div class="border border-gray-100 rounded-lg p-3 text-sm text-gray-600 flex items-center justify-between"><div><p class="font-semibold text-gray-800">${sanitizeText(proposal.name || 'Пропозиція')}</p><p class="text-xs text-gray-500 mt-1">${sanitizeText(proposal.status || '')}</p></div><div class="text-right text-sm text-gray-600"><div class="font-semibold text-gray-800">${sanitizeText(formatCurrency(proposal.amount ?? 0))}</div><div class="text-xs text-gray-500">${sanitizeText(formatDateLocalized(proposal.date))}</div></div></div>`).join('')}</div>`
                    : '<div class="text-sm text-gray-400">Ще не було надіслано пропозицій.</div>'}
            </div>
        </div>
    `;
}

function buildLeadAutomationHtml(profile) {
    const automation = profile.automation || {};
    return `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div>
                <h4 class="text-lg font-semibold text-gray-800">Автоматизація та інтеграції</h4>
                <p class="text-sm text-gray-500">Використовуйте інтеграції та робочі процеси, щоб не втрачати жоден крок.</p>
            </div>
            <div class="space-y-3 text-sm text-gray-600">
                ${automation.assignment ? `<div class="flex items-start gap-2"><i class="fas fa-user-cog text-blue-500 mt-1"></i><span>${sanitizeText(automation.assignment)}</span></div>` : ''}
                <div>
                    <p class="text-xs uppercase text-gray-400 mb-1">Email-кампанії</p>
                    <div class="flex flex-wrap gap-2">${renderChipList(automation.emailCampaigns, { tone: 'emerald' })}</div>
                </div>
                <div>
                    <p class="text-xs uppercase text-gray-400 mb-1">Чат-боти та форми</p>
                    <div class="flex flex-wrap gap-2">${renderChipList(automation.chatbots, { tone: 'blue' })}</div>
                </div>
                <div>
                    <p class="text-xs uppercase text-gray-400 mb-1">Синхронізація календаря</p>
                    <div class="flex flex-wrap gap-2">${renderChipList(automation.calendarSync, { tone: 'purple' })}</div>
                </div>
                <div>
                    <p class="text-xs uppercase text-gray-400 mb-1">Інтеграції</p>
                    <div class="flex flex-wrap gap-2">${renderChipList(automation.integrations, { tone: 'slate' })}</div>
                </div>
            </div>
        </div>
    `;
}

function buildLeadSecurityHtml(profile) {
    const security = profile.security || {};
    const auditLog = ensureArray(security.auditLog);
    return `
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
            <div>
                <h4 class="text-lg font-semibold text-gray-800">Доступ та історія змін</h4>
                <p class="text-sm text-gray-500">Контролюйте, хто працює з лідом, і відстежуйте важливі дії.</p>
            </div>
            <div class="text-sm text-gray-600">
                <p class="text-xs uppercase text-gray-400 mb-1">Рівень доступу</p>
                <p class="font-semibold text-gray-800">${sanitizeText(security.visibility || 'Не налаштовано')}</p>
            </div>
            <div>
                <p class="text-xs uppercase text-gray-400 mb-2">Журнал змін</p>
                ${auditLog.length
                    ? `<ul class="space-y-2 text-sm text-gray-600">${auditLog.map(entry => `<li class="flex items-start gap-3"><span class="text-blue-500 mt-1"><i class="fas fa-history"></i></span><div><p class="font-medium text-gray-800">${sanitizeText(entry.actor || 'Система')}</p><p class="text-xs text-gray-500">${sanitizeText(formatDateLocalized(entry.date, { includeTime: true }))}</p><p class="mt-1">${sanitizeText(entry.action || '')}</p></div></li>`).join('')}</ul>`
                    : '<div class="text-sm text-gray-400">Змін поки не зафіксовано.</div>'}
            </div>
        </div>
    `;
}

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

function buildLeadStatusOptions(selectedStatus = '') {
    const normalized = selectedStatus || '';
    return LEAD_PIPELINE_STATUSES.map(status => {
        const label = translateLeadStatus(status) || status;
        const isSelected = normalized === status;
        return `<option value="${sanitizeText(status)}" ${isSelected ? 'selected' : ''}>${sanitizeText(label)}</option>`;
    }).join('');
}

function initializeLeadStatusControls() {
    const selects = document.querySelectorAll('[data-lead-status-select]');
    selects.forEach(select => {
        if (select.dataset.initialized === 'true') {
            return;
        }
        select.dataset.initialized = 'true';
        select.addEventListener('change', async event => {
            const element = event.currentTarget;
            if (!element) {
                return;
            }
            const leadId = element.getAttribute('data-lead-id');
            const previousStatus = element.getAttribute('data-current-status') || '';
            const nextStatus = element.value;
            element.setAttribute('data-current-status', nextStatus);
            const success = await updateLeadStatus(leadId, nextStatus, { previousStatus, source: 'list' });
            if (!success) {
                element.value = previousStatus;
                element.setAttribute('data-current-status', previousStatus);
            }
        });
    });
}

function renderLeadKanban(leads = []) {
    const board = document.getElementById('leadKanbanBoard');
    if (!board) {
        return;
    }

    leadKanbanCache.dragContext = null;
    leadKanbanCache.leadsById.clear();

    const grouped = new Map();
    leads.forEach(lead => {
        if (!lead || !lead.id) {
            return;
        }
        const status = LEAD_PIPELINE_STATUSES.includes(lead.status) ? lead.status : 'New';
        if (!grouped.has(status)) {
            grouped.set(status, []);
        }
        grouped.get(status).push(lead);
        leadKanbanCache.leadsById.set(String(lead.id), lead);
    });

    const getTranslatedFallback = (key, fallback) => {
        const value = translate(key);
        return value === key ? fallback : value;
    };

    const emptyColumnText = sanitizeText(getTranslatedFallback('leads.board.emptyColumn', 'No leads here yet'));
    const columnsHtml = LEAD_PIPELINE_STATUSES.map(status => {
        const items = grouped.get(status) || [];
        const columnLabel = sanitizeText(translateLeadStatus(status) || status);
        const cardsHtml = items.map(lead => {
            const leadId = String(lead.id || '');
            const safeLeadId = sanitizeText(leadId);
            const safeStatus = sanitizeText(status);
            const title = sanitizeText(lead.title || 'Untitled Lead');
            const description = lead.description
                ? sanitizeText(lead.description.length > 120 ? `${lead.description.slice(0, 117)}...` : lead.description)
                : '';
            const companyLine = lead.company_name
                ? `<div class="flex items-center gap-1 text-xs text-gray-500"><i class="fas fa-building text-gray-400"></i><span>${sanitizeText(lead.company_name)}</span></div>`
                : '';
            const contactLine = lead.contact_name
                ? `<div class="flex items-center gap-1 text-xs text-gray-500"><i class="fas fa-user text-gray-400"></i><span>${sanitizeText(lead.contact_name)}</span></div>`
                : '';
            const assignedLine = lead.assigned_to
                ? `<div class="flex items-center gap-1 text-xs text-gray-500"><i class="fas fa-user-check text-gray-400"></i><span>${sanitizeText(lead.assigned_to)}</span></div>`
                : '';
            const probabilityBadge = Number.isFinite(Number(lead.probability))
                ? `<span class="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs">${Math.round(Number(lead.probability))}%</span>`
                : '';
            const priorityBadge = lead.priority
                ? `<span class="px-2 py-0.5 rounded-full text-xs ${getPriorityClass(lead.priority)}">${sanitizeText(translateLeadPriority(lead.priority) || lead.priority)}</span>`
                : '';
            const valuePill = lead.value
                ? `<span class="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs"><i class="fas fa-dollar-sign mr-1"></i>${formatCurrency(lead.value)}</span>`
                : '';
            const expectedClose = lead.expected_close_date
                ? `<span class="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs"><i class="fas fa-calendar mr-1"></i>${sanitizeText(new Date(lead.expected_close_date).toLocaleDateString(currentLanguage === 'uk' ? 'uk-UA' : undefined))}</span>`
                : '';
            const footerBadges = [priorityBadge, probabilityBadge, valuePill, expectedClose]
                .filter(Boolean)
                .join(' ');

            return `
                <div class="bg-white border border-gray-200 rounded-lg p-3 shadow-sm cursor-move transition-shadow" draggable="true" data-lead-kanban-card data-lead-id="${safeLeadId}" data-lead-status="${safeStatus}">
                    <div class="flex items-start justify-between gap-2">
                        <p class="text-sm font-semibold text-gray-800">${title}</p>
                        ${probabilityBadge}
                    </div>
                    ${description ? `<p class="mt-2 text-xs text-gray-500 leading-snug">${description}</p>` : ''}
                    <div class="mt-3 space-y-1">
                        ${companyLine}
                        ${contactLine}
                        ${assignedLine}
                    </div>
                    ${footerBadges ? `<div class="mt-3 flex flex-wrap gap-2">${footerBadges}</div>` : ''}
                </div>
            `;
        }).join('');

        const placeholder = cardsHtml
            ? ''
            : `<div class="text-xs text-gray-400" data-i18n="leads.board.emptyColumn">${emptyColumnText}</div>`;

        return `
            <div class="min-w-[260px] w-64 flex-shrink-0">
                <div class="flex items-center justify-between mb-3">
                    <h5 class="text-sm font-semibold text-gray-700">${columnLabel}</h5>
                    <span class="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">${items.length}</span>
                </div>
                <div class="space-y-3 bg-gray-50 border border-gray-200 rounded-xl p-3" data-lead-kanban-column="${sanitizeText(status)}" style="min-height: 160px;">
                    ${cardsHtml || placeholder}
                </div>
            </div>
        `;
    }).join('');

    board.innerHTML = `
        <div class="flex items-start gap-4 pb-4">
            ${columnsHtml}
        </div>
    `;

    setupLeadKanbanDragAndDrop(board);
}

function setupLeadKanbanDragAndDrop(boardElement) {
    if (!boardElement) {
        return;
    }

    const columns = boardElement.querySelectorAll('[data-lead-kanban-column]');
    columns.forEach(column => {
        column.addEventListener('dragover', event => {
            if (!leadKanbanCache.dragContext) {
                return;
            }
            event.preventDefault();
            column.classList.add('ring-2', 'ring-blue-300');
        });
        column.addEventListener('dragleave', () => {
            column.classList.remove('ring-2', 'ring-blue-300');
        });
        column.addEventListener('drop', event => {
            if (!leadKanbanCache.dragContext) {
                return;
            }
            event.preventDefault();
            column.classList.remove('ring-2', 'ring-blue-300');

            const targetStatus = column.getAttribute('data-lead-kanban-column') || '';
            const context = leadKanbanCache.dragContext;
            leadKanbanCache.dragContext = null;

            if (!context?.leadId || !targetStatus) {
                return;
            }
            if (targetStatus === context.previousStatus) {
                return;
            }
            updateLeadStatus(context.leadId, targetStatus, { previousStatus: context.previousStatus, source: 'kanban' });
        });
    });

    const cards = boardElement.querySelectorAll('[data-lead-kanban-card]');
    cards.forEach(card => {
        card.addEventListener('dragstart', event => {
            const leadId = card.getAttribute('data-lead-id');
            const previousStatus = card.getAttribute('data-lead-status') || '';
            leadKanbanCache.dragContext = { leadId, previousStatus };
            if (event.dataTransfer) {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', leadId || '');
            }
            card.classList.add('opacity-60');
        });
        card.addEventListener('dragend', () => {
            card.classList.remove('opacity-60');
            leadKanbanCache.dragContext = null;
        });
        card.addEventListener('click', event => {
            if (event.target.closest('button')) {
                return;
            }
            const leadId = card.getAttribute('data-lead-id');
            if (leadId) {
                selectLead(String(leadId));
            }
        });
    });

    updateLeadSelectionHighlight();
}

async function updateLeadStatus(leadId, newStatus, options = {}) {
    const { previousStatus = '', source = 'list' } = options || {};
    const normalizedId = leadId ? String(leadId).trim() : '';
    const normalizedStatus = newStatus ? String(newStatus).trim() : '';

    if (!normalizedId || !normalizedStatus) {
        return false;
    }
    if (!LEAD_PIPELINE_STATUSES.includes(normalizedStatus)) {
        return false;
    }
    if (previousStatus && normalizedStatus === previousStatus) {
        return true;
    }

    const payload = {
        status: normalizedStatus,
        updated_at: new Date().toISOString()
    };

    if (normalizedStatus === 'Qualified') {
        payload.qualified_at = payload.updated_at;
    }

    try {
        const response = await fetch(`tables/leads/${encodeURIComponent(normalizedId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error('Update failed');
        }

        const statusLabel = translateLeadStatus(normalizedStatus) || normalizedStatus;
        showToast(`Lead moved to ${statusLabel}`, 'success');
    } catch (error) {
        console.error('Error updating lead status:', error);
        showToast('Failed to update lead status', 'error');
        return false;
    }

    await loadLeads();

    if (normalizedStatus === 'Qualified' && previousStatus !== 'Qualified') {
        const prompt = translate('leads.board.convertPrompt');
        const promptMessage = prompt === 'leads.board.convertPrompt'
            ? 'This lead is now qualified. Would you like to convert it?'
            : prompt;
        const shouldConvert = confirm(promptMessage);
        if (shouldConvert) {
            showLeadConversionWizard(normalizedId);
        }
    }

    return true;
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
const opportunitiesModuleState = {
    opportunities: [],
    filtered: [],
    tasks: [],
    activities: [],
    files: [],
    notes: [],
    selectedId: null,
    viewMode: 'board',
    filters: {
        search: '',
        stage: '',
        status: '',
        owner: '',
        probabilityRange: '',
        amountRange: '',
        dateRange: ''
    },
    chartInstances: {}
};

async function showOpportunities() {
    showView('opportunities');
    setPageHeader('opportunities');

    const stageOptions = renderSelectOptions(
        getDictionaryEntries('opportunities', 'stages', DEFAULT_SALES_STAGE_ORDER),
        '',
        {
            includeBlank: true,
            blankLabel: 'Усі етапи',
            blankValue: ''
        }
    );
    const statusOptions = renderSelectOptions(
        getDictionaryEntries('opportunities', 'statuses'),
        '',
        {
            includeBlank: true,
            blankLabel: 'Усі статуси',
            blankValue: ''
        }
    );
    const probabilityOptions = [
        { value: '', label: 'Усі ймовірності' },
        { value: '0-25', label: '0–25%' },
        { value: '26-50', label: '26–50%' },
        { value: '51-75', label: '51–75%' },
        { value: '76-100', label: '76–100%' }
    ].map(option => `<option value="${option.value}">${option.label}</option>`).join('');
    const amountOptions = [
        { value: '', label: 'Будь-яка сума' },
        { value: '0-25000', label: 'До $25K' },
        { value: '25000-50000', label: '$25K – $50K' },
        { value: '50000-75000', label: '$50K – $75K' },
        { value: '75000-100000', label: '$75K – $100K' },
        { value: '100000+', label: 'Понад $100K' }
    ].map(option => `<option value="${option.value}">${option.label}</option>`).join('');
    const dateOptions = [
        { value: '', label: 'Будь-яка дата' },
        { value: 'this-week', label: 'Цей тиждень' },
        { value: 'this-month', label: 'Цей місяць' },
        { value: 'next-month', label: 'Наступний місяць' },
        { value: 'quarter', label: 'Цей квартал' }
    ].map(option => `<option value="${option.value}">${option.label}</option>`).join('');

    const opportunitiesView = document.getElementById('opportunitiesView');
    opportunitiesView.innerHTML = `
        <div class="space-y-8">
            <section class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                    <div>
                        <h3 class="text-2xl font-semibold text-gray-800">Керування угодами</h3>
                        <p class="text-sm text-gray-500">Відстежуйте статуси, фінансові показники та активності по всій воронці продажів.</p>
                    </div>
                    <div class="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                        <div class="relative">
                            <input type="text" id="opportunitySearch" placeholder="Пошук за назвою, клієнтом або номером"
                                   class="pl-10 pr-4 py-2 w-full md:w-72 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                        </div>
                        <button onclick="showOpportunityForm()" class="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            <i class="fas fa-plus mr-2"></i>Нова угода
                        </button>
                    </div>
                </div>
                <div id="opportunitySummaryCards" class="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"></div>
            </section>

            <section class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
                    <div>
                        <label for="opportunityStageFilter" class="block text-xs uppercase tracking-wide text-gray-500 mb-1">Етап</label>
                        <select id="opportunityStageFilter" class="w-full border border-gray-300 rounded-lg px-3 py-2">${stageOptions}</select>
                    </div>
                    <div>
                        <label for="opportunityStatusFilter" class="block text-xs uppercase tracking-wide text-gray-500 mb-1">Статус</label>
                        <select id="opportunityStatusFilter" class="w-full border border-gray-300 rounded-lg px-3 py-2">${statusOptions}</select>
                    </div>
                    <div>
                        <label for="opportunityOwnerFilter" class="block text-xs uppercase tracking-wide text-gray-500 mb-1">Менеджер</label>
                        <select id="opportunityOwnerFilter" class="w-full border border-gray-300 rounded-lg px-3 py-2">
                            <option value="">Усі менеджери</option>
                        </select>
                    </div>
                    <div>
                        <label for="opportunityProbabilityFilter" class="block text-xs uppercase tracking-wide text-gray-500 mb-1">Ймовірність</label>
                        <select id="opportunityProbabilityFilter" class="w-full border border-gray-300 rounded-lg px-3 py-2">${probabilityOptions}</select>
                    </div>
                    <div>
                        <label for="opportunityAmountFilter" class="block text-xs uppercase tracking-wide text-gray-500 mb-1">Сума</label>
                        <select id="opportunityAmountFilter" class="w-full border border-gray-300 rounded-lg px-3 py-2">${amountOptions}</select>
                    </div>
                    <div>
                        <label for="opportunityDateFilter" class="block text-xs uppercase tracking-wide text-gray-500 mb-1">Очікуване закриття</label>
                        <select id="opportunityDateFilter" class="w-full border border-gray-300 rounded-lg px-3 py-2">${dateOptions}</select>
                    </div>
                </div>
                <div class="flex flex-wrap gap-2 pt-2 border-t border-gray-100 pt-4">
                    <span class="text-xs font-semibold text-gray-500 uppercase mr-2">Швидкі фільтри:</span>
                    <button type="button" class="px-3 py-1 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600" data-opportunity-quick-filter="status" data-value="">
                        Усі <span class="ml-1 inline-flex items-center justify-center text-xs px-2 py-0.5 bg-gray-100 rounded-full" id="opportunityAllCount">0</span>
                    </button>
                    <button type="button" class="px-3 py-1 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600" data-opportunity-quick-filter="status" data-value="Open">
                        Активні <span class="ml-1 inline-flex items-center justify-center text-xs px-2 py-0.5 bg-gray-100 rounded-full" id="opportunityActiveCount">0</span>
                    </button>
                    <button type="button" class="px-3 py-1 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600" data-opportunity-quick-filter="status" data-value="Closed Won">
                        Виграні <span class="ml-1 inline-flex items-center justify-center text-xs px-2 py-0.5 bg-gray-100 rounded-full" id="opportunityWonCount">0</span>
                    </button>
                    <button type="button" class="px-3 py-1 rounded-full border border-gray-200 text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600" data-opportunity-quick-filter="status" data-value="Closed Lost">
                        Програні <span class="ml-1 inline-flex items-center justify-center text-xs px-2 py-0.5 bg-gray-100 rounded-full" id="opportunityLostCount">0</span>
                    </button>
                </div>
            </section>

            <section class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <div>
                        <h4 class="text-lg font-semibold text-gray-800">Візуалізація угод</h4>
                        <p class="text-sm text-gray-500">Перемикайтеся між канбан-дошкою та табличним виглядом для швидкого аналізу.</p>
                    </div>
                    <button type="button" id="viewToggle" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                        Перейти до табличного вигляду
                    </button>
                </div>
                <div id="opportunityBoardWrapper" class="overflow-x-auto pb-4">
                    <div class="flex space-x-4 min-w-full">
                        <div class="min-w-[18rem] bg-gray-50 rounded-lg p-4">
                            <h5 class="font-semibold text-gray-700 mb-3">Qualification</h5>
                            <div id="qualificationColumn" class="space-y-3 min-h-40"></div>
                        </div>
                        <div class="min-w-[18rem] bg-blue-50 rounded-lg p-4">
                            <h5 class="font-semibold text-blue-700 mb-3">Needs Analysis</h5>
                            <div id="needsAnalysisColumn" class="space-y-3 min-h-40"></div>
                        </div>
                        <div class="min-w-[18rem] bg-yellow-50 rounded-lg p-4">
                            <h5 class="font-semibold text-yellow-700 mb-3">Proposal</h5>
                            <div id="proposalColumn" class="space-y-3 min-h-40"></div>
                        </div>
                        <div class="min-w-[18rem] bg-orange-50 rounded-lg p-4">
                            <h5 class="font-semibold text-orange-700 mb-3">Negotiation</h5>
                            <div id="negotiationColumn" class="space-y-3 min-h-40"></div>
                        </div>
                        <div class="min-w-[18rem] bg-green-50 rounded-lg p-4">
                            <h5 class="font-semibold text-green-700 mb-3">Closed Won</h5>
                            <div id="closedWonColumn" class="space-y-3 min-h-40"></div>
                        </div>
                        <div class="min-w-[18rem] bg-red-50 rounded-lg p-4">
                            <h5 class="font-semibold text-red-700 mb-3">Closed Lost</h5>
                            <div id="closedLostColumn" class="space-y-3 min-h-40"></div>
                        </div>
                    </div>
                </div>
                <div id="opportunityTableWrapper" class="hidden">
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Угода</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Компанія</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Етап</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Статус</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ймовірність</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сума</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Очікуване закриття</th>
                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Відповідальний</th>
                                </tr>
                            </thead>
                            <tbody id="opportunitiesTableBody" class="bg-white divide-y divide-gray-100"></tbody>
                        </table>
                    </div>
                </div>
            </section>

            <section class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div class="xl:col-span-2 space-y-6">
                    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div>
                                <h4 class="text-lg font-semibold text-gray-800">Аналітика та прогнози</h4>
                                <p class="text-sm text-gray-500">Оцінюйте стан воронки, прогнозуйте виручку та виявляйте вузькі місця процесу.</p>
                            </div>
                            <div id="opportunityAnalyticsSummary" class="text-right text-sm text-gray-500"></div>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div class="bg-gray-50 rounded-lg p-4">
                                <h5 class="text-sm font-semibold text-gray-600 mb-3">Розподіл за етапами</h5>
                                <canvas id="opportunityStageChart" height="160"></canvas>
                            </div>
                            <div class="bg-gray-50 rounded-lg p-4">
                                <h5 class="text-sm font-semibold text-gray-600 mb-3">Прогноз виручки</h5>
                                <canvas id="opportunityForecastChart" height="160"></canvas>
                            </div>
                            <div class="bg-gray-50 rounded-lg p-4">
                                <h5 class="text-sm font-semibold text-gray-600 mb-3">Пайплайн за менеджерами</h5>
                                <canvas id="opportunityOwnerChart" height="160"></canvas>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div>
                                <h4 class="text-lg font-semibold text-gray-800">Історія взаємодій</h4>
                                <p class="text-sm text-gray-500">Дзвінки, листування, зустрічі та нотатки за обраною угодою.</p>
                            </div>
                        </div>
                        <div id="opportunityHistory" class="space-y-4"></div>
                    </div>

                    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div class="flex items-center justify-between mb-4">
                            <div>
                                <h4 class="text-lg font-semibold text-gray-800">Завдання та нагадування</h4>
                                <p class="text-sm text-gray-500">Контролюйте підготовку документів, дзвінків і дедлайнів за угодою.</p>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <h5 class="text-sm font-semibold text-gray-600 mb-2">Поточні завдання</h5>
                                <ul id="opportunityTasks" class="space-y-3"></ul>
                            </div>
                            <div>
                                <h5 class="text-sm font-semibold text-gray-600 mb-2">Нагадування та контрольні точки</h5>
                                <ul id="opportunityReminders" class="space-y-3"></ul>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                            <div>
                                <h4 class="text-lg font-semibold text-gray-800">Сегментація та категоризація</h4>
                                <p class="text-sm text-gray-500">Групуйте угоди за тегами, напрямками та типами клієнтів.</p>
                            </div>
                        </div>
                        <div id="opportunitySegmentation" class="flex flex-wrap gap-2 mb-4"></div>
                        <div id="opportunityGroups" class="grid grid-cols-1 md:grid-cols-2 gap-4"></div>
                    </div>
                </div>

                <aside class="space-y-6">
                    <div id="opportunityInspector" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div>
                            <h4 class="text-lg font-semibold text-gray-800">Картка угоди</h4>
                            <p class="text-sm text-gray-500">Оберіть угоду, щоб переглянути повну інформацію.</p>
                        </div>
                        <div class="mt-6 text-sm text-gray-500">
                            Виберіть угоду у канбан-дошці або таблиці, щоб побачити деталі, фінанси та учасників.
                        </div>
                    </div>

                    <div id="opportunityDocuments" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6"></div>

                    <div id="opportunityAutomation" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6"></div>

                    <div id="opportunitySecurity" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6"></div>
                </aside>
            </section>
        </div>
    `;

    initializeOpportunityView();
    await loadOpportunities();
}

async function loadOpportunities() {
    showLoading();
    try {
        const [opportunitiesPayload, tasksPayload, activitiesPayload, filesPayload, notesPayload] = await Promise.all([
            safeFetchJson('tables/opportunities?limit=1000'),
            safeFetchJson('tables/tasks?limit=1000'),
            safeFetchJson('tables/activities?limit=1000'),
            safeFetchJson('tables/files?limit=1000'),
            safeFetchJson('tables/notes?limit=1000')
        ]);

        opportunitiesModuleState.opportunities = normalizeListPayload(opportunitiesPayload);
        opportunitiesModuleState.tasks = normalizeListPayload(tasksPayload);
        opportunitiesModuleState.activities = normalizeListPayload(activitiesPayload);
        opportunitiesModuleState.files = normalizeListPayload(filesPayload);
        opportunitiesModuleState.notes = normalizeListPayload(notesPayload);

        populateOpportunityOwnerFilter();
        applyOpportunityFilters();
        renderOpportunityDocuments(null);
        renderOpportunityAutomation(null);
        renderOpportunitySecurity(null);

    } catch (error) {
        console.error('Error loading opportunities:', error);
        showToast('Failed to load opportunities', 'error');
    } finally {
        hideLoading();
    }
}

async function safeFetchJson(url) {
    try {
        const response = await fetch(url);
        if (!response || !response.ok) {
            throw new Error(`Request failed for ${url}`);
        }
        return await response.json();
    } catch (error) {
        console.warn('safeFetchJson fallback for', url, error);
        return { data: [] };
    }
}

function normalizeListPayload(payload) {
    if (!payload) {
        return [];
    }
    if (Array.isArray(payload)) {
        return payload;
    }
    if (Array.isArray(payload.data)) {
        return payload.data;
    }
    return [];
}

function initializeOpportunityView() {
    const searchInput = document.getElementById('opportunitySearch');
    if (searchInput) {
        let timeoutId;
        searchInput.addEventListener('input', event => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                opportunitiesModuleState.filters.search = (event.target.value || '').trim().toLowerCase();
                applyOpportunityFilters();
            }, 200);
        });
    }

    const stageFilter = document.getElementById('opportunityStageFilter');
    stageFilter?.addEventListener('change', event => {
        opportunitiesModuleState.filters.stage = event.target.value;
        applyOpportunityFilters();
    });

    const statusFilter = document.getElementById('opportunityStatusFilter');
    statusFilter?.addEventListener('change', event => {
        opportunitiesModuleState.filters.status = event.target.value;
        updateOpportunityQuickFilterButtons();
        applyOpportunityFilters();
    });

    const ownerFilter = document.getElementById('opportunityOwnerFilter');
    ownerFilter?.addEventListener('change', event => {
        opportunitiesModuleState.filters.owner = event.target.value;
        applyOpportunityFilters();
    });

    const probabilityFilter = document.getElementById('opportunityProbabilityFilter');
    probabilityFilter?.addEventListener('change', event => {
        opportunitiesModuleState.filters.probabilityRange = event.target.value;
        applyOpportunityFilters();
    });

    const amountFilter = document.getElementById('opportunityAmountFilter');
    amountFilter?.addEventListener('change', event => {
        opportunitiesModuleState.filters.amountRange = event.target.value;
        applyOpportunityFilters();
    });

    const dateFilter = document.getElementById('opportunityDateFilter');
    dateFilter?.addEventListener('change', event => {
        opportunitiesModuleState.filters.dateRange = event.target.value;
        applyOpportunityFilters();
    });

    document.querySelectorAll('[data-opportunity-quick-filter]').forEach(button => {
        button.addEventListener('click', () => {
            const filterValue = button.getAttribute('data-value') || '';
            opportunitiesModuleState.filters.status = filterValue;
            if (statusFilter && statusFilter.value !== filterValue) {
                statusFilter.value = filterValue;
            }
            updateOpportunityQuickFilterButtons();
            applyOpportunityFilters();
        });
    });

    const viewToggle = document.getElementById('viewToggle');
    viewToggle?.addEventListener('click', toggleOpportunityView);

    updateOpportunityQuickFilterButtons();
}

function populateOpportunityOwnerFilter() {
    const select = document.getElementById('opportunityOwnerFilter');
    if (!select) {
        return;
    }

    const owners = new Set();
    opportunitiesModuleState.opportunities.forEach(opportunity => {
        const owner = (opportunity.assigned_to || '').trim();
        if (owner) {
            owners.add(owner);
        }
    });

    const options = Array.from(owners)
        .sort((a, b) => a.localeCompare(b))
        .map(owner => `<option value="${sanitizeText(owner)}"${opportunitiesModuleState.filters.owner === owner ? ' selected' : ''}>${sanitizeText(owner)}</option>`)
        .join('');

    select.innerHTML = `<option value="">Усі менеджери</option>${options}`;

    if (opportunitiesModuleState.filters.owner && !owners.has(opportunitiesModuleState.filters.owner)) {
        opportunitiesModuleState.filters.owner = '';
    }
}

function updateOpportunityQuickFilterButtons() {
    const activeValue = opportunitiesModuleState.filters.status || '';
    document.querySelectorAll('[data-opportunity-quick-filter]').forEach(button => {
        const value = button.getAttribute('data-value') || '';
        if (value === activeValue) {
            button.classList.add('border-blue-500', 'text-blue-600', 'bg-blue-50');
        } else {
            button.classList.remove('border-blue-500', 'text-blue-600', 'bg-blue-50');
        }
    });
}

function updateOpportunityQuickFilterCounts() {
    const allCount = opportunitiesModuleState.opportunities.length;
    const activeCount = opportunitiesModuleState.opportunities.filter(opportunity => getOpportunityStatus(opportunity) === 'Open').length;
    const wonCount = opportunitiesModuleState.opportunities.filter(opportunity => getOpportunityStatus(opportunity) === 'Closed Won').length;
    const lostCount = opportunitiesModuleState.opportunities.filter(opportunity => getOpportunityStatus(opportunity) === 'Closed Lost').length;

    const setCount = (id, value) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    };

    setCount('opportunityAllCount', allCount);
    setCount('opportunityActiveCount', activeCount);
    setCount('opportunityWonCount', wonCount);
    setCount('opportunityLostCount', lostCount);
}

function applyOpportunityFilters() {
    const filters = opportunitiesModuleState.filters;
    const searchTerm = (filters.search || '').trim();

    const filtered = opportunitiesModuleState.opportunities.filter(opportunity => {
        if (searchTerm) {
            const haystack = [
                opportunity.name,
                opportunity.company_name,
                opportunity.id,
                opportunity.obsidian_note
            ].filter(Boolean).join(' ').toLowerCase();
            if (!haystack.includes(searchTerm)) {
                return false;
            }
        }

        if (filters.stage && String(opportunity.stage || '') !== filters.stage) {
            return false;
        }

        const normalizedStatus = getOpportunityStatus(opportunity);
        if (filters.status && normalizedStatus !== filters.status) {
            return false;
        }

        if (filters.owner) {
            const owner = (opportunity.assigned_to || '').trim();
            if (owner !== filters.owner) {
                return false;
            }
        }

        if (filters.probabilityRange) {
            const probability = Number(opportunity.probability) || 0;
            if (!probabilityMatchesRange(probability, filters.probabilityRange)) {
                return false;
            }
        }

        if (filters.amountRange) {
            const value = Number(opportunity.value) || 0;
            if (!amountMatchesRange(value, filters.amountRange)) {
                return false;
            }
        }

        if (filters.dateRange) {
            const closeDate = parseDateValue(opportunity.expected_close_date);
            if (!dateMatchesRange(closeDate, filters.dateRange)) {
                return false;
            }
        }

        return true;
    });

    opportunitiesModuleState.filtered = filtered;
    updateOpportunityQuickFilterCounts();
    renderOpportunitySummaryCards(filtered);
    displayOpportunitiesPipeline(filtered);
    renderOpportunityTable(filtered);
    updateOpportunityAnalytics(filtered);
    ensureOpportunitySelection();
}

function getOpportunityStatus(opportunity) {
    if (!opportunity) {
        return 'Open';
    }
    if (opportunity.status) {
        return String(opportunity.status);
    }
    const stage = String(opportunity.stage || '').toLowerCase();
    if (stage.includes('closed won')) {
        return 'Closed Won';
    }
    if (stage.includes('closed lost')) {
        return 'Closed Lost';
    }
    return 'Open';
}

function probabilityMatchesRange(probability, range) {
    if (!range) {
        return true;
    }
    if (range === '100+' || range === '100') {
        return probability >= 100;
    }
    const [start, end] = range.split('-').map(value => Number(value.replace('+', '')));
    if (Number.isNaN(start)) {
        return true;
    }
    if (Number.isNaN(end)) {
        return probability >= start;
    }
    return probability >= start && probability <= end;
}

function amountMatchesRange(value, range) {
    if (!range) {
        return true;
    }
    if (range.endsWith('+')) {
        const min = Number(range.replace('+', ''));
        return value >= min;
    }
    const [start, end] = range.split('-').map(Number);
    if (Number.isNaN(start)) {
        return true;
    }
    if (Number.isNaN(end)) {
        return value >= start;
    }
    return value >= start && value <= end;
}

function parseDateValue(value) {
    if (!value) {
        return null;
    }
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function endOfDay(date) {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
}

function dateMatchesRange(date, range) {
    if (!range || !date) {
        return true;
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (range) {
        case 'this-week': {
            const dayOfWeek = startOfDay.getDay() || 7;
            const weekStart = new Date(startOfDay);
            weekStart.setDate(startOfDay.getDate() - (dayOfWeek - 1));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return date >= weekStart && date <= endOfDay(weekEnd);
        }
        case 'this-month': {
            const monthStart = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1);
            const monthEnd = new Date(startOfDay.getFullYear(), startOfDay.getMonth() + 1, 0);
            return date >= monthStart && date <= endOfDay(monthEnd);
        }
        case 'next-month': {
            const nextMonthStart = new Date(startOfDay.getFullYear(), startOfDay.getMonth() + 1, 1);
            const nextMonthEnd = new Date(startOfDay.getFullYear(), startOfDay.getMonth() + 2, 0);
            return date >= nextMonthStart && date <= endOfDay(nextMonthEnd);
        }
        case 'quarter': {
            const quarter = Math.floor(startOfDay.getMonth() / 3);
            const quarterStart = new Date(startOfDay.getFullYear(), quarter * 3, 1);
            const quarterEnd = new Date(startOfDay.getFullYear(), quarter * 3 + 3, 0);
            return date >= quarterStart && date <= endOfDay(quarterEnd);
        }
        default:
            return true;
    }
}

function renderOpportunitySummaryCards(opportunities) {
    const container = document.getElementById('opportunitySummaryCards');
    if (!container) {
        return;
    }

    const totalDeals = opportunities.length;
    const pipelineValue = opportunities
        .filter(opportunity => getOpportunityStatus(opportunity) !== 'Closed Lost')
        .reduce((sum, opportunity) => sum + (Number(opportunity.value) || 0), 0);
    const weightedPipeline = opportunities.reduce((sum, opportunity) => {
        const probability = Number(opportunity.probability) || 0;
        return sum + ((Number(opportunity.value) || 0) * probability / 100);
    }, 0);
    const wonCount = opportunities.filter(opportunity => getOpportunityStatus(opportunity) === 'Closed Won').length;
    const lostCount = opportunities.filter(opportunity => getOpportunityStatus(opportunity) === 'Closed Lost').length;
    const activeCount = opportunities.filter(opportunity => getOpportunityStatus(opportunity) === 'Open').length;
    const averageProbability = totalDeals
        ? Math.round(opportunities.reduce((sum, opportunity) => sum + (Number(opportunity.probability) || 0), 0) / totalDeals)
        : 0;

    container.innerHTML = `
        <div class="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <p class="text-xs font-semibold text-blue-600 uppercase">Активні угоди</p>
            <p class="text-2xl font-semibold text-blue-900 mt-1">${activeCount}</p>
            <p class="text-sm text-blue-700">${totalDeals} угод загалом</p>
        </div>
        <div class="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
            <p class="text-xs font-semibold text-emerald-600 uppercase">Обсяг воронки</p>
            <p class="text-2xl font-semibold text-emerald-900 mt-1">${formatCurrency(pipelineValue)}</p>
            <p class="text-sm text-emerald-700">З урахуванням усіх відкритих угод</p>
        </div>
        <div class="bg-purple-50 border border-purple-100 rounded-lg p-4">
            <p class="text-xs font-semibold text-purple-600 uppercase">Зважений прогноз</p>
            <p class="text-2xl font-semibold text-purple-900 mt-1">${formatCurrency(weightedPipeline)}</p>
            <p class="text-sm text-purple-700">Середня ймовірність: ${averageProbability}%</p>
        </div>
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p class="text-xs font-semibold text-gray-600 uppercase">Результати угод</p>
            <p class="text-2xl font-semibold text-gray-900 mt-1">${wonCount} / ${lostCount}</p>
            <p class="text-sm text-gray-600">Виграно / Програно</p>
        </div>
    `;

    const analyticsSummary = document.getElementById('opportunityAnalyticsSummary');
    if (analyticsSummary) {
        analyticsSummary.innerHTML = `
            <p>Очікувана виручка: <span class="font-semibold text-gray-800">${formatCurrency(weightedPipeline)}</span></p>
            <p>Середня ймовірність успіху: <span class="font-semibold text-gray-800">${averageProbability}%</span></p>
        `;
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
            column.innerHTML = '<div class="text-sm text-gray-400 bg-white/60 border border-dashed border-gray-200 rounded-lg p-3 text-center">Немає угод у цьому етапі</div>';
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
            if (column.children.length && column.firstElementChild?.classList.contains('text-gray-400')) {
                column.innerHTML = '';
            }
            column.innerHTML += createOpportunityCard(opp);
        }
    });
}

function createOpportunityCard(opportunity) {
    const probability = Math.min(Math.max(Number(opportunity.probability) || 0, 0), 100);
    const expectedClose = opportunity.expected_close_date
        ? new Date(opportunity.expected_close_date).toLocaleDateString()
        : 'Not set';
    const valueDisplay = formatCurrency(opportunity.value);
    const name = sanitizeText(opportunity.name || 'Untitled Opportunity');
    const companyName = opportunity.company_name
        ? sanitizeText(opportunity.company_name)
        : 'No account linked';
    const contactName = opportunity.primary_contact_name
        ? sanitizeText(opportunity.primary_contact_name)
        : '';
    const assignedTo = opportunity.assigned_to ? sanitizeText(opportunity.assigned_to) : 'Unassigned';
    const priority = sanitizeText(opportunity.priority || 'Medium');
    const competitorName = opportunity.competitor_name
        || opportunity.relationships?.competitor?.label
        || '';
    const competitorIndicator = (opportunity.competitor_id || competitorName)
        ? `<span class="flex items-center gap-1 text-xs text-rose-600" title="Tracked competitor: ${sanitizeText(competitorName || 'Competitor')}"><i class="fas fa-chess-knight"></i>${sanitizeText(competitorName || 'Competitive')}</span>`
        : '';
    const progressStyle = SALES_STAGE_GRADIENTS[opportunity.stage]
        ? `background:${SALES_STAGE_GRADIENTS[opportunity.stage]};`
        : 'background:#2563eb;';

    const contactLine = contactName
        ? `<span class="flex items-center gap-1"><i class="fas fa-user"></i>${contactName}</span>`
        : '';

    const isSelected = opportunitiesModuleState.selectedId === opportunity.id;
    const selectedStyles = isSelected
        ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-white shadow-md'
        : 'hover:shadow-md';

    return `
        <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer transition-shadow ${selectedStyles}"
             onclick="selectOpportunity('${opportunity.id}')">
            <div class="flex items-start justify-between mb-2">
                <div>
                    <h5 class="font-medium text-gray-800">${name}</h5>
                    <p class="text-xs text-gray-500 mt-1 flex items-center gap-1"><i class="fas fa-building"></i>${companyName}</p>
                </div>
                <span class="px-2 py-0.5 rounded-full text-xs ${getPriorityClass(priority)}">${priority}</span>
            </div>
            <div class="flex flex-wrap gap-2 text-xs text-gray-500 mb-3">
                ${contactLine}
                <span class="flex items-center gap-1"><i class="fas fa-user-tie"></i>${assignedTo}</span>
            </div>
            <div class="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span class="flex items-center gap-1"><i class="fas fa-dollar-sign"></i>${valueDisplay}</span>
                <span class="flex items-center gap-1"><i class="fas fa-percentage"></i>${probability}%</span>
            </div>
            <div class="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span class="flex items-center gap-1"><i class="fas fa-calendar-alt"></i>${expectedClose}</span>
                ${competitorIndicator}
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="h-2 rounded-full" style="width: ${probability}%; ${progressStyle}"></div>
            </div>
        </div>
    `;
}

function renderOpportunityTable(opportunities) {
    const tbody = document.getElementById('opportunitiesTableBody');
    if (!tbody) {
        return;
    }

    if (!opportunities.length) {
        tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-6 text-center text-gray-500">За вибраними фільтрами угод не знайдено.</td></tr>';
        return;
    }

    const rows = opportunities.map(opportunity => {
        const status = getOpportunityStatus(opportunity);
        const probability = Number(opportunity.probability) || 0;
        const valueDisplay = formatCurrency(opportunity.value);
        const closeDate = formatNullableDate(parseDateValue(opportunity.expected_close_date));
        const isSelected = opportunitiesModuleState.selectedId === opportunity.id;
        const rowClasses = isSelected
            ? 'bg-blue-50/70 border-l-4 border-blue-500'
            : 'hover:bg-blue-50/50';

        return `
            <tr class="cursor-pointer ${rowClasses}" onclick="selectOpportunity('${opportunity.id}')">
                <td class="px-4 py-3 text-sm text-gray-700 font-medium">${sanitizeText(opportunity.name || 'Без назви')}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${sanitizeText(opportunity.company_name || '—')}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${sanitizeText(opportunity.stage || '—')}</td>
                <td class="px-4 py-3 text-sm">${sanitizeText(status)}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${probability}%</td>
                <td class="px-4 py-3 text-sm font-semibold text-gray-800">${valueDisplay}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${closeDate}</td>
                <td class="px-4 py-3 text-sm text-gray-600">${sanitizeText(opportunity.assigned_to || 'Не призначено')}</td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = rows;
}

function updateOpportunityAnalytics(opportunities) {
    renderOpportunityStageChart(opportunities);
    renderOpportunityOwnerChart(opportunities);
    renderOpportunityForecastChart(opportunities);
}

function destroyOpportunityChart(key) {
    const instance = opportunitiesModuleState.chartInstances[key];
    if (instance && typeof instance.destroy === 'function') {
        instance.destroy();
    }
    opportunitiesModuleState.chartInstances[key] = null;
}

function renderOpportunityStageChart(opportunities) {
    const canvas = document.getElementById('opportunityStageChart');
    if (!canvas) {
        return;
    }

    destroyOpportunityChart('stage');

    const stageOrder = DEFAULT_SALES_STAGE_ORDER;
    const counts = stageOrder.map(stage => opportunities.filter(opportunity => String(opportunity.stage) === stage).length);

    opportunitiesModuleState.chartInstances.stage = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: stageOrder,
            datasets: [
                {
                    label: 'Кількість угод',
                    data: counts,
                    backgroundColor: ['#bfdbfe', '#c7d2fe', '#fde68a', '#fed7aa', '#bbf7d0', '#fecaca'],
                    borderRadius: 6
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function renderOpportunityOwnerChart(opportunities) {
    const canvas = document.getElementById('opportunityOwnerChart');
    if (!canvas) {
        return;
    }

    destroyOpportunityChart('owner');

    const totalsByOwner = new Map();
    opportunities.forEach(opportunity => {
        const owner = (opportunity.assigned_to || 'Невизначено').trim() || 'Невизначено';
        const current = totalsByOwner.get(owner) || 0;
        totalsByOwner.set(owner, current + (Number(opportunity.value) || 0));
    });

    const labels = Array.from(totalsByOwner.keys());
    const data = labels.map(label => totalsByOwner.get(label));

    opportunitiesModuleState.chartInstances.owner = new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels,
            datasets: [
                {
                    label: 'Сума угод',
                    data,
                    backgroundColor: ['#93c5fd', '#a5b4fc', '#fcd34d', '#fdba74', '#86efac', '#fca5a5']
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { boxWidth: 12, usePointStyle: true }
                }
            }
        }
    });
}

function renderOpportunityForecastChart(opportunities) {
    const canvas = document.getElementById('opportunityForecastChart');
    if (!canvas) {
        return;
    }

    destroyOpportunityChart('forecast');

    const buckets = new Map();
    opportunities.forEach(opportunity => {
        const date = parseDateValue(opportunity.expected_close_date);
        if (!date) {
            return;
        }
        const bucketKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const current = buckets.get(bucketKey) || 0;
        const weighted = (Number(opportunity.value) || 0) * ((Number(opportunity.probability) || 0) / 100);
        buckets.set(bucketKey, current + weighted);
    });

    const sortedBuckets = Array.from(buckets.keys()).sort();
    const labels = sortedBuckets.map(key => {
        const [year, month] = key.split('-').map(Number);
        const date = new Date(year, month - 1, 1);
        return date.toLocaleDateString('uk-UA', { month: 'short', year: 'numeric' });
    });
    const data = sortedBuckets.map(key => buckets.get(key));

    opportunitiesModuleState.chartInstances.forecast = new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Прогнозована виручка',
                    data,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    tension: 0.3,
                    fill: true
                }
            ]
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

function ensureOpportunitySelection() {
    const filtered = opportunitiesModuleState.filtered;
    if (!filtered.length) {
        opportunitiesModuleState.selectedId = null;
        renderOpportunityInspector(null);
        renderOpportunityDocuments(null);
        renderOpportunityTasks(null);
        renderOpportunityReminders(null);
        renderOpportunityHistory(null);
        renderOpportunitySegmentation(null);
        renderOpportunityAutomation(null);
        renderOpportunitySecurity(null);
        return;
    }

    if (!opportunitiesModuleState.selectedId || !filtered.some(opportunity => opportunity.id === opportunitiesModuleState.selectedId)) {
        const preferred = filtered.find(opportunity => getOpportunityStatus(opportunity) !== 'Closed Lost') || filtered[0];
        opportunitiesModuleState.selectedId = preferred.id;
    }

    selectOpportunity(opportunitiesModuleState.selectedId, { skipListRefresh: true });
}

function selectOpportunity(id, options = {}) {
    if (!id) {
        opportunitiesModuleState.selectedId = null;
        renderOpportunityInspector(null);
        renderOpportunityDocuments(null);
        renderOpportunityTasks(null);
        renderOpportunityReminders(null);
        renderOpportunityHistory(null);
        renderOpportunitySegmentation(null);
        renderOpportunityAutomation(null);
        renderOpportunitySecurity(null);
        return;
    }

    opportunitiesModuleState.selectedId = id;
    const opportunity = opportunitiesModuleState.opportunities.find(item => item.id === id) || null;

    renderOpportunityInspector(opportunity);
    renderOpportunityDocuments(opportunity);
    renderOpportunityTasks(opportunity);
    renderOpportunityReminders(opportunity);
    renderOpportunityHistory(opportunity);
    renderOpportunitySegmentation(opportunity);
    renderOpportunityAutomation(opportunity);
    renderOpportunitySecurity(opportunity);

    if (!options.skipListRefresh) {
        displayOpportunitiesPipeline(opportunitiesModuleState.filtered);
        renderOpportunityTable(opportunitiesModuleState.filtered);
    }
}

function renderOpportunityInspector(opportunity) {
    const container = document.getElementById('opportunityInspector');
    if (!container) {
        return;
    }

    if (!opportunity) {
        container.innerHTML = `
            <div>
                <h4 class="text-lg font-semibold text-gray-800">Картка угоди</h4>
                <p class="text-sm text-gray-500">Оберіть угоду у канбан-дошці або таблиці, щоб побачити деталі, фінанси та учасників.</p>
            </div>
        `;
        return;
    }

    const status = getOpportunityStatus(opportunity);
    const probability = Number(opportunity.probability) || 0;
    const closeDate = formatNullableDate(parseDateValue(opportunity.expected_close_date));
    const createdDate = formatNullableDate(deriveOpportunityCreatedDate(opportunity));
    const opportunityNumber = sanitizeText(opportunity.deal_number || `UG-${String(opportunity.id || '').toUpperCase()}`);
    const type = sanitizeText(computeOpportunityType(opportunity));
    const category = sanitizeText(computeOpportunityCategory(opportunity));
    const forecastCategory = sanitizeText(computeOpportunityForecastCategory(opportunity));
    const expectedProfit = (Number(opportunity.value) || 0) * 0.35;
    const paymentStatus = opportunity.payment_status || (status === 'Closed Won' ? 'Очікує оплату' : status === 'Closed Lost' ? 'Не оплачено' : 'У процесі');
    const paymentTerms = opportunity.payment_terms || 'Net 30';
    const paymentSchedule = computeOpportunityPaymentSchedule(opportunity);
    const products = buildOpportunityProducts(opportunity);

    const productsRows = products.length
        ? products.map(product => `
                <tr>
                    <td class="px-3 py-2 text-sm text-gray-700">${sanitizeText(product.name)}</td>
                    <td class="px-3 py-2 text-sm text-gray-600">${product.quantity}</td>
                    <td class="px-3 py-2 text-sm text-gray-600">${formatCurrency(product.price)}</td>
                    <td class="px-3 py-2 text-sm text-gray-700 font-medium">${formatCurrency(product.total)}</td>
                </tr>`).join('')
        : '<tr><td colspan="4" class="px-3 py-2 text-sm text-gray-500 text-center">Немає доданих товарів або послуг.</td></tr>';

    const scheduleRows = paymentSchedule.length
        ? paymentSchedule.map(item => `
                <tr>
                    <td class="px-3 py-2 text-sm text-gray-600">${sanitizeText(item.label)}</td>
                    <td class="px-3 py-2 text-sm text-gray-600">${formatNullableDate(item.date)}</td>
                    <td class="px-3 py-2 text-sm text-gray-700 font-medium">${formatCurrency(item.amount)}</td>
                </tr>`).join('')
        : '<tr><td colspan="3" class="px-3 py-2 text-sm text-gray-500 text-center">Графік платежів буде сформовано після узгодження умов.</td></tr>';

    container.innerHTML = `
        <div class="flex items-start justify-between">
            <div>
                <h4 class="text-lg font-semibold text-gray-800">${sanitizeText(opportunity.name || 'Без назви')}</h4>
                <p class="text-sm text-gray-500">Номер угоди: ${opportunityNumber}</p>
            </div>
            <span class="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">${sanitizeText(status)}</span>
        </div>
        <div class="mt-4 grid grid-cols-1 gap-4">
            <section class="border border-gray-100 rounded-lg p-4 bg-gray-50">
                <h5 class="text-sm font-semibold text-gray-700 mb-3">1. Основна інформація</h5>
                <dl class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600">
                    <div><dt class="font-medium text-gray-700">Тип угоди</dt><dd>${type}</dd></div>
                    <div><dt class="font-medium text-gray-700">Етап воронки</dt><dd>${sanitizeText(opportunity.stage || '—')}</dd></div>
                    <div><dt class="font-medium text-gray-700">Категорія</dt><dd>${category}</dd></div>
                    <div><dt class="font-medium text-gray-700">Пріоритет</dt><dd>${sanitizeText(opportunity.priority || 'Medium')}</dd></div>
                    <div><dt class="font-medium text-gray-700">Ймовірність</dt><dd>${probability}%</dd></div>
                    <div><dt class="font-medium text-gray-700">Дата створення</dt><dd>${createdDate}</dd></div>
                    <div><dt class="font-medium text-gray-700">Очікуване закриття</dt><dd>${closeDate}</dd></div>
                    <div><dt class="font-medium text-gray-700">Прогнозна категорія</dt><dd>${forecastCategory}</dd></div>
                </dl>
            </section>
            <section class="border border-gray-100 rounded-lg p-4 bg-gray-50">
                <h5 class="text-sm font-semibold text-gray-700 mb-3">2. Фінансова інформація</h5>
                <div class="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                        <p class="font-medium text-gray-700">Сума угоди</p>
                        <p class="text-lg font-semibold text-gray-900">${formatCurrency(opportunity.value)}</p>
                    </div>
                    <div>
                        <p class="font-medium text-gray-700">Очікуваний прибуток</p>
                        <p class="text-lg font-semibold text-emerald-600">${formatCurrency(expectedProfit)}</p>
                    </div>
                    <div>
                        <p class="font-medium text-gray-700">Умови оплати</p>
                        <p>${sanitizeText(paymentTerms)}</p>
                    </div>
                    <div>
                        <p class="font-medium text-gray-700">Статус оплати</p>
                        <p>${sanitizeText(paymentStatus)}</p>
                    </div>
                </div>
                <div class="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-white">
                            <tr>
                                <th class="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Платіж</th>
                                <th class="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Дата</th>
                                <th class="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Сума</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white">${scheduleRows}</tbody>
                    </table>
                </div>
            </section>
            <section class="border border-gray-100 rounded-lg p-4 bg-gray-50">
                <h5 class="text-sm font-semibold text-gray-700 mb-3">3. Учасники угоди</h5>
                <ul class="space-y-2 text-sm text-gray-600">
                    <li><span class="font-medium text-gray-700">Клієнт:</span> ${sanitizeText(opportunity.company_name || '—')}</li>
                    <li><span class="font-medium text-gray-700">Контактна особа:</span> ${sanitizeText(opportunity.primary_contact_name || '—')}</li>
                    <li><span class="font-medium text-gray-700">Відповідальний менеджер:</span> ${sanitizeText(opportunity.assigned_to || '—')}</li>
                    <li><span class="font-medium text-gray-700">Співвиконавці:</span> ${sanitizeText(opportunity.collaborators?.join(', ') || 'Команда продажів')}</li>
                    <li><span class="font-medium text-gray-700">Партнери / посередники:</span> ${sanitizeText(opportunity.partner_name || 'Не залучено')}</li>
                </ul>
            </section>
            <section class="border border-gray-100 rounded-lg p-4 bg-gray-50">
                <h5 class="text-sm font-semibold text-gray-700 mb-3">4. Продукти та послуги</h5>
                <div class="border border-gray-200 rounded-lg overflow-hidden">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead class="bg-white">
                            <tr>
                                <th class="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Найменування</th>
                                <th class="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">К-сть</th>
                                <th class="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Ціна</th>
                                <th class="px-3 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Разом</th>
                            </tr>
                        </thead>
                        <tbody class="bg-white">${productsRows}</tbody>
                    </table>
                </div>
            </section>
            <section class="border border-gray-100 rounded-lg p-4 bg-gray-50">
                <h5 class="text-sm font-semibold text-gray-700 mb-3">5. Документи та файли</h5>
                <div id="opportunityDocumentsInline"></div>
            </section>
        </div>
    `;

    const inlineDocsContainer = container.querySelector('#opportunityDocumentsInline');
    if (inlineDocsContainer) {
        inlineDocsContainer.replaceWith(renderOpportunityDocuments(opportunity, { returnHtml: true }));
    }
}

function deriveOpportunityCreatedDate(opportunity) {
    if (!opportunity) {
        return null;
    }
    if (opportunity.created_at) {
        return parseDateValue(opportunity.created_at);
    }
    const expected = parseDateValue(opportunity.expected_close_date);
    if (!expected) {
        return null;
    }
    const clone = new Date(expected);
    clone.setDate(clone.getDate() - 45);
    return clone;
}

function computeOpportunityType(opportunity) {
    if (!opportunity) {
        return 'Продаж';
    }
    if (opportunity.type) {
        return opportunity.type;
    }
    if (String(opportunity.name || '').toLowerCase().includes('оренда')) {
        return 'Оренда';
    }
    if (String(opportunity.name || '').toLowerCase().includes('партнер')) {
        return 'Партнерська угода';
    }
    return 'Продаж';
}

function computeOpportunityCategory(opportunity) {
    if (!opportunity) {
        return 'Стандарт';
    }
    if (opportunity.category) {
        return opportunity.category;
    }
    const value = Number(opportunity.value) || 0;
    if (value >= 90000) {
        return 'Проект';
    }
    if (value >= 50000) {
        return 'Опт';
    }
    return 'Стандарт';
}

function computeOpportunityForecastCategory(opportunity) {
    const probability = Number(opportunity?.probability) || 0;
    if (getOpportunityStatus(opportunity) === 'Closed Won') {
        return 'Closed';
    }
    if (probability >= 75) {
        return 'Commit';
    }
    if (probability >= 50) {
        return 'Best Case';
    }
    return 'Pipeline';
}

function computeOpportunityPaymentSchedule(opportunity) {
    const value = Number(opportunity?.value) || 0;
    if (value <= 0) {
        return [];
    }
    const closeDate = parseDateValue(opportunity?.expected_close_date);
    const baseDate = closeDate || new Date();
    const milestone1 = new Date(baseDate);
    const milestone2 = new Date(baseDate);
    milestone1.setDate(baseDate.getDate() - 7);
    milestone2.setDate(baseDate.getDate() + 30);

    return [
        { label: 'Аванс 50%', date: milestone1, amount: value * 0.5 },
        { label: 'Фінальний платіж 50%', date: milestone2, amount: value * 0.5 }
    ];
}

function buildOpportunityProducts(opportunity) {
    const value = Number(opportunity?.value) || 0;
    const baseProduct = {
        name: opportunity?.name || 'CRM рішення',
        quantity: 1,
        price: value,
        total: value
    };

    if (opportunity?.line_items && Array.isArray(opportunity.line_items) && opportunity.line_items.length) {
        return opportunity.line_items.map(item => ({
            name: item.name || item.description || 'Позиція',
            quantity: item.quantity || 1,
            price: item.price || 0,
            total: (item.quantity || 1) * (item.price || 0)
        }));
    }

    const addon = Math.max(Math.round(value * 0.1), 2500);
    return value
        ? [
            baseProduct,
            { name: 'Впровадження та навчання', quantity: 1, price: addon, total: addon }
        ]
        : [baseProduct];
}

function formatNullableDate(date) {
    if (!date) {
        return '—';
    }
    return formatDate(date.toISOString ? date.toISOString() : date);
}

function renderOpportunityDocuments(opportunity, options = {}) {
    const returnHtml = Boolean(options.returnHtml);
    const files = Array.isArray(opportunitiesModuleState.files) ? opportunitiesModuleState.files : [];
    let html;

    if (!opportunity) {
        html = `
            <div class="text-sm text-gray-500">
                Додайте угоду, щоб прикріпити договори, комерційні пропозиції та акти виконаних робіт.
            </div>
        `;
    } else {
        const relatedFiles = files.filter(file => {
            return file.opportunity_id === opportunity.id
                || file.related_to === opportunity.id
                || (opportunity.company_id && file.company_id === opportunity.company_id);
        });

        if (!relatedFiles.length) {
            html = '<div class="text-sm text-gray-500">Немає прикріплених документів. Додайте пропозицію або договір.</div>';
        } else {
            const items = relatedFiles.map(file => `
                <li class="flex items-center justify-between text-sm text-gray-600">
                    <div class="flex items-center gap-2">
                        <i class="fas fa-file-alt text-gray-400"></i>
                        <span>${sanitizeText(file.name)}</span>
                    </div>
                    <span class="text-xs text-gray-400">${formatNullableDate(parseDateValue(file.updated_at))}</span>
                </li>
            `).join('');
            html = `<ul class="space-y-2">${items}</ul>`;
        }
    }

    if (returnHtml) {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html;
        return wrapper.firstElementChild || wrapper;
    }

    const container = document.getElementById('opportunityDocuments');
    if (container) {
        container.innerHTML = `
            <h4 class="text-lg font-semibold text-gray-800 mb-3">Документи та файли</h4>
            ${html}
        `;
    }
}

function renderOpportunityTasks(opportunity) {
    const container = document.getElementById('opportunityTasks');
    if (!container) {
        return;
    }

    if (!opportunity) {
        container.innerHTML = '<li class="text-sm text-gray-500">Оберіть угоду, щоб переглянути пов’язані завдання.</li>';
        return;
    }

    const tasks = (opportunitiesModuleState.tasks || []).filter(task => {
        return task.related_to === opportunity.id
            || task.opportunity_id === opportunity.id
            || (opportunity.primary_contact_id && task.contact_id === opportunity.primary_contact_id);
    });

    if (!tasks.length) {
        container.innerHTML = '<li class="text-sm text-gray-500">Завдань по цій угоді поки немає.</li>';
        return;
    }

    const items = tasks
        .sort((a, b) => new Date(a.due_date || 0) - new Date(b.due_date || 0))
        .map(task => `
            <li class="border border-gray-200 rounded-lg p-3 bg-white shadow-sm">
                <div class="flex items-center justify-between">
                    <p class="font-medium text-gray-700">${sanitizeText(task.title)}</p>
                    <span class="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">${sanitizeText(task.status || '—')}</span>
                </div>
                <p class="text-sm text-gray-500 mt-1">${sanitizeText(task.description || '')}</p>
                <div class="mt-2 flex items-center justify-between text-xs text-gray-400">
                    <span><i class="fas fa-calendar-alt mr-1"></i>${formatNullableDate(parseDateValue(task.due_date))}</span>
                    <span><i class="fas fa-user mr-1"></i>${sanitizeText(task.assigned_to || '—')}</span>
                </div>
            </li>
        `).join('');

    container.innerHTML = items;
}

function renderOpportunityReminders(opportunity) {
    const container = document.getElementById('opportunityReminders');
    if (!container) {
        return;
    }

    if (!opportunity) {
        container.innerHTML = '<li class="text-sm text-gray-500">Оберіть угоду, щоб переглянути нагадування.</li>';
        return;
    }

    const reminders = buildPaymentReminderItems(opportunity);
    if (!reminders.length) {
        container.innerHTML = '<li class="text-sm text-gray-500">Немає запланованих нагадувань.</li>';
        return;
    }

    container.innerHTML = reminders.map(item => `
        <li class="flex items-start gap-3 border border-blue-100 rounded-lg p-3 bg-blue-50/60">
            <i class="fas fa-bell text-blue-500 mt-0.5"></i>
            <div>
                <p class="text-sm font-medium text-blue-900">${sanitizeText(item.title)}</p>
                <p class="text-xs text-blue-700">${sanitizeText(item.description)}</p>
                <p class="text-xs text-blue-500 mt-1"><i class="fas fa-calendar mr-1"></i>${formatNullableDate(item.date)}</p>
            </div>
        </li>
    `).join('');
}

function buildPaymentReminderItems(opportunity) {
    const reminders = [];
    const schedule = computeOpportunityPaymentSchedule(opportunity);
    schedule.forEach(item => {
        reminders.push({
            title: item.label,
            description: 'Контроль платежу за угодою',
            date: item.date
        });
    });

    const tasks = (opportunitiesModuleState.tasks || []).filter(task => task.related_to === opportunity.id && task.due_date);
    tasks.forEach(task => {
        reminders.push({
            title: `Завдання: ${task.title}`,
            description: task.description || 'Підготовка активності',
            date: parseDateValue(task.due_date)
        });
    });

    return reminders.sort((a, b) => new Date(a.date || 0) - new Date(b.date || 0));
}

function renderOpportunityHistory(opportunity) {
    const container = document.getElementById('opportunityHistory');
    if (!container) {
        return;
    }

    if (!opportunity) {
        container.innerHTML = '<p class="text-sm text-gray-500">Оберіть угоду, щоб переглянути історію взаємодій.</p>';
        return;
    }

    const activities = (opportunitiesModuleState.activities || []).filter(activity => activityMatchesOpportunity(activity, opportunity));
    const notes = (opportunitiesModuleState.notes || []).filter(note => noteMatchesOpportunity(note, opportunity));

    const entries = [];
    activities.forEach(activity => {
        entries.push({
            date: parseDateValue(activity.date),
            title: activity.subject || activity.type,
            description: activity.description || '',
            type: activity.type || 'Activity'
        });
    });
    notes.forEach(note => {
        entries.push({
            date: parseDateValue(note.updated_at || note.created_at),
            title: note.title,
            description: note.content,
            type: 'Нотатка'
        });
    });

    if (!entries.length) {
        container.innerHTML = '<p class="text-sm text-gray-500">Немає зафіксованих взаємодій.</p>';
        return;
    }

    entries.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

    container.innerHTML = entries.map(entry => `
        <div class="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
            <div class="flex items-center justify-between">
                <p class="font-medium text-gray-700">${sanitizeText(entry.title || 'Активність')}</p>
                <span class="text-xs text-gray-400">${formatNullableDate(entry.date)}</span>
            </div>
            <p class="text-xs uppercase text-gray-400 mt-1">${sanitizeText(entry.type)}</p>
            <p class="text-sm text-gray-600 mt-2">${sanitizeText(entry.description || 'Без опису')}</p>
        </div>
    `).join('');
}

function renderOpportunitySegmentation(opportunity) {
    const tagsContainer = document.getElementById('opportunitySegmentation');
    const groupsContainer = document.getElementById('opportunityGroups');

    if (tagsContainer) {
        if (!opportunity) {
            tagsContainer.innerHTML = '<span class="text-sm text-gray-500">Оберіть угоду, щоб побачити теги та категорії.</span>';
        } else {
            const tags = buildOpportunityTags(opportunity);
            tagsContainer.innerHTML = tags.map(tag => `<span class="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full border border-blue-100">${sanitizeText(tag)}</span>`).join('');
        }
    }

    if (groupsContainer) {
        groupsContainer.innerHTML = opportunity ? renderOpportunityGroups(opportunity) : '';
    }
}

function buildOpportunityTags(opportunity) {
    const tags = new Set();
    if (!opportunity) {
        return Array.from(tags);
    }
    tags.add(`Етап: ${opportunity.stage || '—'}`);
    tags.add(`Пріоритет: ${opportunity.priority || 'Medium'}`);
    tags.add(`Статус: ${getOpportunityStatus(opportunity)}`);
    tags.add(`Категорія: ${computeOpportunityCategory(opportunity)}`);
    if (opportunity.competitor_name) {
        tags.add(`Конкурент: ${opportunity.competitor_name}`);
    }
    const value = Number(opportunity.value) || 0;
    if (value >= 75000) {
        tags.add('Велика угода');
    }
    if (value <= 30000) {
        tags.add('SMB сегмент');
    }
    return Array.from(tags);
}

function renderOpportunityGroups(opportunity) {
    const businessType = opportunity.company_name && /inc|llc|corp/i.test(opportunity.company_name)
        ? 'B2B'
        : 'B2C';
    const category = computeOpportunityCategory(opportunity);
    const forecast = computeOpportunityForecastCategory(opportunity);

    return `
        <div class="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
            <p class="text-xs uppercase text-gray-400">Сегмент</p>
            <p class="text-sm font-semibold text-gray-800">${sanitizeText(businessType)}</p>
            <p class="text-xs text-gray-500 mt-1">Тип клієнта за природою бізнесу</p>
        </div>
        <div class="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
            <p class="text-xs uppercase text-gray-400">Категорія</p>
            <p class="text-sm font-semibold text-gray-800">${sanitizeText(category)}</p>
            <p class="text-xs text-gray-500 mt-1">Рівень потенціалу угоди</p>
        </div>
        <div class="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
            <p class="text-xs uppercase text-gray-400">Forecast</p>
            <p class="text-sm font-semibold text-gray-800">${sanitizeText(forecast)}</p>
            <p class="text-xs text-gray-500 mt-1">Категорія прогнозу продажів</p>
        </div>
        <div class="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
            <p class="text-xs uppercase text-gray-400">Конкурентність</p>
            <p class="text-sm font-semibold text-gray-800">${sanitizeText(opportunity.competitor_name || 'Без конкуренції')}</p>
            <p class="text-xs text-gray-500 mt-1">Відстежуваний конкурент або партнер</p>
        </div>
    `;
}

function renderOpportunityAutomation(opportunity) {
    const container = document.getElementById('opportunityAutomation');
    if (!container) {
        return;
    }

    if (!opportunity) {
        container.innerHTML = `
            <h4 class="text-lg font-semibold text-gray-800 mb-3">Автоматизація та інтеграції</h4>
            <p class="text-sm text-gray-500">Після вибору угоди ви зможете налаштувати автоматичне оновлення статусів та інтеграції.</p>
        `;
        return;
    }

    container.innerHTML = `
        <h4 class="text-lg font-semibold text-gray-800 mb-3">Автоматизація та інтеграції</h4>
        <ul class="space-y-3 text-sm text-gray-600">
            <li class="flex items-start gap-2"><i class="fas fa-robot text-blue-500 mt-0.5"></i><div><p class="font-medium text-gray-700">Автоматичне оновлення статусу</p><p>Статус змінюється автоматично при закритті угоди.</p></div></li>
            <li class="flex items-start gap-2"><i class="fas fa-envelope-open-text text-blue-500 mt-0.5"></i><div><p class="font-medium text-gray-700">Синхронізація з email</p><p>Пов’язані листи додаються до історії взаємодій.</p></div></li>
            <li class="flex items-start gap-2"><i class="fas fa-calendar-alt text-blue-500 mt-0.5"></i><div><p class="font-medium text-gray-700">Синхронізація з календарем</p><p>Зустрічі та дзвінки додаються до календаря відповідального менеджера.</p></div></li>
            <li class="flex items-start gap-2"><i class="fas fa-file-invoice-dollar text-blue-500 mt-0.5"></i><div><p class="font-medium text-gray-700">Інтеграція з бухгалтерією</p><p>Оплати передаються до ERP після підтвердження статусу «${sanitizeText(getOpportunityStatus(opportunity))}».</p></div></li>
        </ul>
    `;
}

function renderOpportunitySecurity(opportunity) {
    const container = document.getElementById('opportunitySecurity');
    if (!container) {
        return;
    }

    if (!opportunity) {
        container.innerHTML = `
            <h4 class="text-lg font-semibold text-gray-800 mb-3">Безпека та доступ</h4>
            <p class="text-sm text-gray-500">Виберіть угоду, щоб переглянути, хто має до неї доступ.</p>
        `;
        return;
    }

    container.innerHTML = `
        <h4 class="text-lg font-semibold text-gray-800 mb-3">Безпека та доступ</h4>
        <ul class="space-y-2 text-sm text-gray-600">
            <li><span class="font-medium text-gray-700">Власник угоди:</span> ${sanitizeText(opportunity.assigned_to || '—')}</li>
            <li><span class="font-medium text-gray-700">Команда продажів:</span> Доступ на редагування</li>
            <li><span class="font-medium text-gray-700">Фінансовий відділ:</span> Доступ до фінансового блоку</li>
            <li><span class="font-medium text-gray-700">Історія змін:</span> Логи оновлень доступні у CRM</li>
        </ul>
    `;
}

function activityMatchesOpportunity(activity, opportunity) {
    if (!activity || !opportunity) {
        return false;
    }
    if (activity.opportunity_id && activity.opportunity_id === opportunity.id) {
        return true;
    }
    if (activity.related_to && activity.related_to === opportunity.id) {
        return true;
    }
    if (activity.contact_id && opportunity.primary_contact_id && activity.contact_id === opportunity.primary_contact_id) {
        return true;
    }
    if (activity.company_id && opportunity.company_id && activity.company_id === opportunity.company_id) {
        return true;
    }
    return false;
}

function noteMatchesOpportunity(note, opportunity) {
    if (!note || !opportunity) {
        return false;
    }
    if (note.entity_type === 'opportunities' && note.entity_id === opportunity.id) {
        return true;
    }
    if (note.entity_type === 'companies' && note.entity_id === opportunity.company_id) {
        return true;
    }
    if (note.entity_type === 'contacts' && note.entity_id === opportunity.primary_contact_id) {
        return true;
    }
    return false;
}

// Sales Module
const DEFAULT_SALES_STAGE_ORDER = ['Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
const SALES_STAGE_ORDER = (typeof getDictionaryValues === 'function'
    ? getDictionaryValues('opportunities', 'stages', DEFAULT_SALES_STAGE_ORDER)
    : DEFAULT_SALES_STAGE_ORDER.slice());

const DEFAULT_STAGE_PROBABILITY = {
    Qualification: 25,
    'Needs Analysis': 35,
    Proposal: 55,
    Negotiation: 75,
    'Closed Won': 100,
    'Closed Lost': 0
};

const STAGE_DEFAULT_PROBABILITY = (() => {
    if (window.crmConfig && typeof window.crmConfig.getOpportunityProbabilityMap === 'function') {
        const map = window.crmConfig.getOpportunityProbabilityMap();
        if (map && Object.keys(map).length) {
            return map;
        }
    }
    const fallback = {};
    SALES_STAGE_ORDER.forEach(stage => {
        const key = stage;
        fallback[key] = DEFAULT_STAGE_PROBABILITY[key] ?? 0;
    });
    return fallback;
})();

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

const SALES_FILTER_DEFAULTS = {
    period: 'quarter',
    start: null,
    end: null,
    type: 'all',
    region: 'all',
    manager: 'all',
    client: 'all',
    product: 'all'
};

const salesModuleState = {
    allOpportunities: [],
    opportunities: [],
    filters: { ...SALES_FILTER_DEFAULTS },
    lastMetrics: null,
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
            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div class="flex flex-wrap items-start justify-between gap-4 mb-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">Фільтри продажів</h3>
                        <p class="text-sm text-gray-500">Аналізуйте виручку за періодами, сегментами та командами.</p>
                    </div>
                    <div class="flex items-center gap-3">
                        <button id="salesFilterReset" class="px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Скинути</button>
                        <button id="salesFilterApply" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">Застосувати</button>
                    </div>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-6 gap-4">
                    <div>
                        <label for="salesFilterPeriod" class="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Період</label>
                        <select id="salesFilterPeriod" class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="today">Сьогодні</option>
                            <option value="week">Цей тиждень</option>
                            <option value="month">Цей місяць</option>
                            <option value="quarter" selected>Цей квартал</option>
                            <option value="year">Цей рік</option>
                            <option value="custom">Довільний діапазон</option>
                            <option value="all">Увесь час</option>
                        </select>
                    </div>
                    <div>
                        <label for="salesFilterType" class="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Тип продажу</label>
                        <select id="salesFilterType" class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"></select>
                    </div>
                    <div>
                        <label for="salesFilterRegion" class="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Регіон</label>
                        <select id="salesFilterRegion" class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"></select>
                    </div>
                    <div>
                        <label for="salesFilterManager" class="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Менеджер</label>
                        <select id="salesFilterManager" class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"></select>
                    </div>
                    <div>
                        <label for="salesFilterClient" class="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Клієнт</label>
                        <select id="salesFilterClient" class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"></select>
                    </div>
                    <div>
                        <label for="salesFilterProduct" class="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Продукт / послуга</label>
                        <select id="salesFilterProduct" class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"></select>
                    </div>
                </div>
                <div id="salesCustomRangeWrapper" class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4 hidden">
                    <div>
                        <label for="salesFilterStartDate" class="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Початкова дата</label>
                        <input type="date" id="salesFilterStartDate" class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    <div>
                        <label for="salesFilterEndDate" class="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Кінцева дата</label>
                        <input type="date" id="salesFilterEndDate" class="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wide">Поточний фільтр</label>
                        <p id="salesFilterSummary" class="mt-1 text-sm text-gray-500">Фільтри не застосовано.</p>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <p class="text-sm text-gray-500">Загальна виручка</p>
                    <p id="salesTotalRevenue" class="text-2xl font-semibold text-gray-800 mt-1">$0.00</p>
                    <p id="salesRevenueHelper" class="text-xs text-gray-400 mt-2">0 угод у періоді</p>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <p class="text-sm text-gray-500">Кількість угод</p>
                    <p id="salesDealsCount" class="text-2xl font-semibold text-gray-800 mt-1">0</p>
                    <p id="salesDealsHelper" class="text-xs text-gray-400 mt-2">Активні та закриті можливості</p>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <p class="text-sm text-gray-500">Середній чек</p>
                    <p id="salesAverageCheck" class="text-2xl font-semibold text-gray-800 mt-1">$0.00</p>
                    <p id="salesAverageCheckHelper" class="text-xs text-gray-400 mt-2">Розрахунок по закритих угодах</p>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <p class="text-sm text-gray-500">Конверсія лідів у клієнтів</p>
                    <p id="salesConversion" class="text-2xl font-semibold text-gray-800 mt-1">0%</p>
                    <p id="salesConversionHelper" class="text-xs text-gray-400 mt-2">Відсоток виграних угод</p>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <p class="text-sm text-gray-500">Прибутковість</p>
                    <p id="salesProfitability" class="text-2xl font-semibold text-gray-800 mt-1">0%</p>
                    <p id="salesProfitabilityHelper" class="text-xs text-gray-400 mt-2">Маржа та чистий прибуток</p>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <p class="text-sm text-gray-500">Динаміка продажів</p>
                    <div class="flex items-baseline gap-2 mt-1">
                        <span id="salesGrowthBadge" class="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-sm font-medium text-emerald-600">0%</span>
                        <span id="salesGrowthLabel" class="text-xs text-gray-400">vs попередній період</span>
                    </div>
                </div>
            </div>

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

            <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 xl:col-span-2">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-800">Графік виручки</h3>
                        <span id="salesRevenueTrendSummary" class="text-xs text-gray-500"></span>
                    </div>
                    <div class="relative h-72">
                        <canvas id="salesRevenueTrendChart" class="h-full"></canvas>
                        <p id="salesRevenueTrendEmpty" class="absolute inset-0 hidden items-center justify-center text-sm text-gray-500">Недостатньо даних для побудови графіка.</p>
                    </div>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-800">Розподіл продажів</h3>
                        <span id="salesCategorySummary" class="text-xs text-gray-500"></span>
                    </div>
                    <div class="h-60 flex items-center justify-center">
                        <canvas id="salesCategoryDistributionChart" class="max-h-56"></canvas>
                    </div>
                    <div id="salesCategoryDistributionLegend" class="mt-4 space-y-2"></div>
                </div>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 xl:col-span-2">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-800">Топ-продавці</h3>
                        <span id="salesTopSellersSummary" class="text-xs text-gray-500"></span>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm">
                            <thead class="bg-gray-50 text-gray-600 uppercase text-xs">
                                <tr>
                                    <th class="p-3 text-left">Менеджер</th>
                                    <th class="p-3 text-left">Команда</th>
                                    <th class="p-3 text-left">Угод</th>
                                    <th class="p-3 text-left">Виручка</th>
                                    <th class="p-3 text-left">Win-rate</th>
                                </tr>
                            </thead>
                            <tbody id="salesTopSellersBody" class="divide-y divide-gray-100"></tbody>
                        </table>
                    </div>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Швидкі інсайти</h3>
                    <ul id="salesInsightsList" class="space-y-3 text-sm text-gray-600"></ul>
                </div>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-800">Порівняльний аналіз</h3>
                        <span id="salesComparativeSummary" class="text-xs text-gray-500"></span>
                    </div>
                    <div id="salesComparativeAnalysis" class="space-y-3 text-sm text-gray-600"></div>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-800">Сегментація продажів</h3>
                        <span id="salesSegmentationSummary" class="text-xs text-gray-500"></span>
                    </div>
                    <div id="salesSegmentation" class="space-y-4"></div>
                </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div class="flex items-center justify-between mb-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">Деталізація продажів</h3>
                        <p class="text-sm text-gray-500">Повний журнал угод з виручкою, статусом оплати та прибутком.</p>
                    </div>
                    <button id="salesExportQuick" class="px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">Експорт CSV</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead class="bg-gray-50 text-gray-600 uppercase text-xs">
                            <tr>
                                <th class="p-3 text-left">Дата</th>
                                <th class="p-3 text-left">Угода</th>
                                <th class="p-3 text-left">Клієнт</th>
                                <th class="p-3 text-left">Менеджер</th>
                                <th class="p-3 text-left">Продукт / послуга</th>
                                <th class="p-3 text-left">Сума</th>
                                <th class="p-3 text-left">Статус оплати</th>
                                <th class="p-3 text-left">Прибуток</th>
                            </tr>
                        </thead>
                        <tbody id="salesDetailTableBody" class="divide-y divide-gray-100"></tbody>
                    </table>
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
                        <div class="flex items-center gap-2">
                            <button id="salesReportRevenue" class="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">Звіт про виручку</button>
                            <button id="salesReportConversion" class="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100">Звіт про конверсію</button>
                        </div>
                    </div>
                    <div class="relative h-64">
                        <canvas id="salesForecastChart" class="h-full"></canvas>
                        <p id="salesForecastEmpty" class="absolute inset-0 flex items-center justify-center text-sm text-gray-500 hidden">Add expected close dates to power the forecast.</p>
                    </div>
                    <p id="salesForecastSummary" class="text-sm text-gray-500 mt-4"></p>
                </div>
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Звіти та експорт</h3>
                    <div class="grid grid-cols-1 gap-3 text-sm text-gray-600">
                        <button id="salesReportProfitability" class="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-2 hover:bg-gray-50">
                            <span>Звіт про прибутковість</span>
                            <i class="fas fa-arrow-right text-gray-400"></i>
                        </button>
                        <button id="salesReportOverdue" class="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-2 hover:bg-gray-50">
                            <span>Звіт про прострочені платежі</span>
                            <i class="fas fa-arrow-right text-gray-400"></i>
                        </button>
                        <div class="flex items-center gap-2">
                            <button id="salesExportCsv" class="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">CSV</button>
                            <button id="salesExportExcel" class="px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100">Excel</button>
                            <button id="salesExportPdf" class="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">PDF</button>
                        </div>
                        <p id="salesReportsSummary" class="text-xs text-gray-500"></p>
                    </div>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Управління цілями</h3>
                    <div id="salesGoals" class="space-y-4 text-sm text-gray-600"></div>
                </div>
                <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">Інтеграції та безпека</h3>
                    <div id="salesIntegrationsSummary" class="space-y-3 text-sm text-gray-600"></div>
                    <div id="salesSecuritySummary" class="mt-4 space-y-3 text-sm text-gray-600"></div>
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

    initializeSalesActions();
    await loadSalesModuleData();
}

async function loadSalesModuleData() {
    showLoading();
    try {
        const response = await fetch('tables/opportunities?limit=200');
        const data = await response.json();

        salesModuleState.allOpportunities = (data.data || []).map(opportunity => normalizeOpportunityRecord({
            ...opportunity,
            probability: typeof opportunity.probability === 'number'
                ? opportunity.probability
                : (STAGE_DEFAULT_PROBABILITY[opportunity.stage] ?? 0)
        }));

        initializeSalesFilters();
        applySalesFilters({ skipRender: true });

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

function initializeSalesActions() {
    const quickExport = document.getElementById('salesExportQuick');
    if (quickExport) {
        quickExport.onclick = event => {
            event.preventDefault();
            handleSalesExport('csv');
        };
    }

    const csvButton = document.getElementById('salesExportCsv');
    if (csvButton) {
        csvButton.onclick = event => {
            event.preventDefault();
            handleSalesExport('csv');
        };
    }

    const excelButton = document.getElementById('salesExportExcel');
    if (excelButton) {
        excelButton.onclick = event => {
            event.preventDefault();
            handleSalesExport('excel');
        };
    }

    const pdfButton = document.getElementById('salesExportPdf');
    if (pdfButton) {
        pdfButton.onclick = event => {
            event.preventDefault();
            handleSalesExport('pdf');
        };
    }

    const revenueReportBtn = document.getElementById('salesReportRevenue');
    if (revenueReportBtn) {
        revenueReportBtn.onclick = event => {
            event.preventDefault();
            handleSalesReport('revenue');
        };
    }

    const conversionReportBtn = document.getElementById('salesReportConversion');
    if (conversionReportBtn) {
        conversionReportBtn.onclick = event => {
            event.preventDefault();
            handleSalesReport('conversion');
        };
    }

    const profitabilityReportBtn = document.getElementById('salesReportProfitability');
    if (profitabilityReportBtn) {
        profitabilityReportBtn.onclick = event => {
            event.preventDefault();
            handleSalesReport('profitability');
        };
    }

    const overdueReportBtn = document.getElementById('salesReportOverdue');
    if (overdueReportBtn) {
        overdueReportBtn.onclick = event => {
            event.preventDefault();
            handleSalesReport('overdue');
        };
    }
}

function normalizeOpportunityRecord(opportunity = {}) {
    const normalized = { ...opportunity };

    normalized.currency = opportunity.currency || 'USD';
    normalized.sales_type = opportunity.sales_type || 'Проекти';
    normalized.region = opportunity.region || 'Невідомий регіон';
    normalized.manager_team = opportunity.manager_team || opportunity.team || 'Sales';
    normalized.client_type = opportunity.client_type || 'B2B';
    normalized.product_line = opportunity.product_line || opportunity.product || opportunity.service || 'Універсальний продукт';
    normalized.payment_status = opportunity.payment_status || (opportunity.stage === 'Closed Won' ? 'Оплачено' : 'Очікує оплату');
    normalized.invoice_status = opportunity.invoice_status || normalized.payment_status;
    normalized.sales_channel = opportunity.sales_channel || 'Прямі продажі';
    normalized.revenue_stream = opportunity.revenue_stream || 'Основний продукт';
    normalized.deal_code = opportunity.deal_code || opportunity.reference || opportunity.id || '';
    normalized.account_name = opportunity.company_name || opportunity.account_name || '';
    normalized.owner = opportunity.assigned_to || opportunity.owner || '';
    normalized.created_at = opportunity.created_at || opportunity.expected_close_date || new Date().toISOString();
    normalized.updated_at = opportunity.updated_at || normalized.created_at;

    const value = Number(opportunity.value) || 0;
    const margin = Number.isFinite(opportunity.profit_margin) ? Number(opportunity.profit_margin) : 0.32;
    const profitAmount = opportunity.profit_amount !== undefined
        ? Number(opportunity.profit_amount)
        : value * margin;
    normalized.profit_margin = margin;
    normalized.profit_amount = profitAmount;
    normalized.cost_of_sale = opportunity.cost_of_sale !== undefined
        ? Number(opportunity.cost_of_sale)
        : Math.max(value - profitAmount, 0);
    normalized.currency_rate = Number.isFinite(opportunity.currency_rate) ? Number(opportunity.currency_rate) : 1;

    normalized.expected_close_date = opportunity.expected_close_date || null;
    normalized.actual_close_date = opportunity.actual_close_date
        || (opportunity.stage === 'Closed Won' ? opportunity.expected_close_date : null);
    normalized.closed_date = normalized.actual_close_date;

    normalized._typeKey = (normalized.sales_type || '').toLowerCase();
    normalized._regionKey = (normalized.region || '').toLowerCase();
    normalized._managerKey = (normalized.owner || '').toLowerCase();
    normalized._clientKey = (normalized.account_name || '').toLowerCase();
    normalized._productKey = (normalized.product_line || '').toLowerCase();

    return normalized;
}

function buildSalesFilterKeys(filters = {}) {
    return {
        type: (filters.type || 'all').toLowerCase(),
        region: (filters.region || 'all').toLowerCase(),
        manager: (filters.manager || 'all').toLowerCase(),
        client: (filters.client || 'all').toLowerCase(),
        product: (filters.product || 'all').toLowerCase()
    };
}

function matchesOpportunity(opportunity, filterKeys) {
    if (!opportunity) {
        return false;
    }

    if (filterKeys.type !== 'all' && opportunity._typeKey !== filterKeys.type) {
        return false;
    }
    if (filterKeys.region !== 'all' && opportunity._regionKey !== filterKeys.region) {
        return false;
    }
    if (filterKeys.manager !== 'all' && opportunity._managerKey !== filterKeys.manager) {
        return false;
    }
    if (filterKeys.client !== 'all' && opportunity._clientKey !== filterKeys.client) {
        return false;
    }
    if (filterKeys.product !== 'all' && opportunity._productKey !== filterKeys.product) {
        return false;
    }
    return true;
}

function getOpportunityFilterDate(opportunity) {
    if (!opportunity) {
        return null;
    }
    const fallbackDate = opportunity.actual_close_date || opportunity.expected_close_date || opportunity.created_at;
    return parseDateValue(fallbackDate);
}

function resolveSalesPeriodRange(period) {
    if (!period || period === 'all') {
        return { start: null, end: null };
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (period) {
        case 'today': {
            return { start: startOfToday, end: endOfDay(startOfToday) };
        }
        case 'week': {
            const dayOfWeek = startOfToday.getDay() || 7;
            const weekStart = new Date(startOfToday);
            weekStart.setDate(startOfToday.getDate() - (dayOfWeek - 1));
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return { start: weekStart, end: endOfDay(weekEnd) };
        }
        case 'month': {
            const monthStart = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);
            const monthEnd = new Date(startOfToday.getFullYear(), startOfToday.getMonth() + 1, 0);
            return { start: monthStart, end: endOfDay(monthEnd) };
        }
        case 'quarter': {
            const quarter = Math.floor(startOfToday.getMonth() / 3);
            const quarterStart = new Date(startOfToday.getFullYear(), quarter * 3, 1);
            const quarterEnd = new Date(startOfToday.getFullYear(), quarter * 3 + 3, 0);
            return { start: quarterStart, end: endOfDay(quarterEnd) };
        }
        case 'year': {
            const yearStart = new Date(startOfToday.getFullYear(), 0, 1);
            const yearEnd = new Date(startOfToday.getFullYear(), 11, 31);
            return { start: yearStart, end: endOfDay(yearEnd) };
        }
        default:
            return { start: null, end: null };
    }
}

function getSalesFilterDateRange(filters = {}) {
    if (!filters || filters.period === 'all') {
        return { start: null, end: null };
    }

    if (filters.period === 'custom') {
        const start = filters.start ? parseDateValue(filters.start) : null;
        const end = filters.end ? parseDateValue(filters.end) : null;
        return {
            start: start ? new Date(start.getFullYear(), start.getMonth(), start.getDate()) : null,
            end: end ? endOfDay(end) : null
        };
    }

    return resolveSalesPeriodRange(filters.period);
}

function calculatePreviousPeriodRange(range) {
    if (!range || !range.start || !range.end) {
        return null;
    }

    const duration = range.end.getTime() - range.start.getTime();
    const previousEnd = new Date(range.start.getTime() - 1);
    const previousStart = new Date(previousEnd.getTime() - duration);
    return {
        start: new Date(previousStart.getFullYear(), previousStart.getMonth(), previousStart.getDate()),
        end: endOfDay(previousEnd)
    };
}

function formatDateRangeDisplay(date) {
    if (!date) {
        return '';
    }
    return date.toLocaleDateString('uk-UA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function updateSalesFilterSummary(range, totalCount) {
    const summary = document.getElementById('salesFilterSummary');
    if (!summary) {
        return;
    }

    const periodSelect = document.getElementById('salesFilterPeriod');
    const typeSelect = document.getElementById('salesFilterType');
    const regionSelect = document.getElementById('salesFilterRegion');
    const managerSelect = document.getElementById('salesFilterManager');
    const clientSelect = document.getElementById('salesFilterClient');
    const productSelect = document.getElementById('salesFilterProduct');

    const parts = [];
    const periodLabel = periodSelect?.selectedOptions?.[0]?.textContent || 'Увесь час';
    parts.push(periodLabel);

    if (range.start || range.end) {
        const startLabel = formatDateRangeDisplay(range.start);
        const endLabel = formatDateRangeDisplay(range.end);
        if (startLabel || endLabel) {
            parts.push(`Діапазон: ${startLabel || '—'} – ${endLabel || '—'}`);
        }
    }

    if (salesModuleState.filters.type !== 'all' && typeSelect?.selectedOptions?.length) {
        parts.push(`Тип: ${typeSelect.selectedOptions[0].textContent}`);
    }
    if (salesModuleState.filters.region !== 'all' && regionSelect?.selectedOptions?.length) {
        parts.push(`Регіон: ${regionSelect.selectedOptions[0].textContent}`);
    }
    if (salesModuleState.filters.manager !== 'all' && managerSelect?.selectedOptions?.length) {
        parts.push(`Менеджер: ${managerSelect.selectedOptions[0].textContent}`);
    }
    if (salesModuleState.filters.client !== 'all' && clientSelect?.selectedOptions?.length) {
        parts.push(`Клієнт: ${clientSelect.selectedOptions[0].textContent}`);
    }
    if (salesModuleState.filters.product !== 'all' && productSelect?.selectedOptions?.length) {
        parts.push(`Продукт: ${productSelect.selectedOptions[0].textContent}`);
    }

    const baseText = parts.length
        ? `Активні фільтри: ${parts.join(' · ')}`
        : 'Фільтри не застосовано.';
    summary.textContent = `${baseText} · ${totalCount} угод`;
}

function initializeSalesFilters() {
    const periodSelect = document.getElementById('salesFilterPeriod');
    if (!periodSelect) {
        return;
    }

    const typeSelect = document.getElementById('salesFilterType');
    const regionSelect = document.getElementById('salesFilterRegion');
    const managerSelect = document.getElementById('salesFilterManager');
    const clientSelect = document.getElementById('salesFilterClient');
    const productSelect = document.getElementById('salesFilterProduct');
    const startInput = document.getElementById('salesFilterStartDate');
    const endInput = document.getElementById('salesFilterEndDate');
    const applyButton = document.getElementById('salesFilterApply');
    const resetButton = document.getElementById('salesFilterReset');

    populateSalesFilterSelect(typeSelect, getUniqueSalesValues('sales_type'), 'Усі типи');
    populateSalesFilterSelect(regionSelect, getUniqueSalesValues('region'), 'Усі регіони');
    populateSalesFilterSelect(managerSelect, getUniqueSalesValues('owner'), 'Усі менеджери');
    populateSalesFilterSelect(clientSelect, getUniqueSalesValues('account_name'), 'Усі клієнти');
    populateSalesFilterSelect(productSelect, getUniqueSalesValues('product_line'), 'Усі продукти');

    periodSelect.value = salesModuleState.filters.period;
    if (typeSelect) typeSelect.value = salesModuleState.filters.type;
    if (regionSelect) regionSelect.value = salesModuleState.filters.region;
    if (managerSelect) managerSelect.value = salesModuleState.filters.manager;
    if (clientSelect) clientSelect.value = salesModuleState.filters.client;
    if (productSelect) productSelect.value = salesModuleState.filters.product;
    if (startInput) startInput.value = salesModuleState.filters.start || '';
    if (endInput) endInput.value = salesModuleState.filters.end || '';

    syncSalesCustomRangeVisibility();

    periodSelect.onchange = event => {
        salesModuleState.filters.period = event.target.value;
        if (salesModuleState.filters.period !== 'custom') {
            salesModuleState.filters.start = null;
            salesModuleState.filters.end = null;
            if (startInput) startInput.value = '';
            if (endInput) endInput.value = '';
            applySalesFilters();
        } else {
            syncSalesCustomRangeVisibility();
        }
    };

    if (typeSelect) {
        typeSelect.onchange = event => {
            salesModuleState.filters.type = event.target.value;
            applySalesFilters();
        };
    }

    if (regionSelect) {
        regionSelect.onchange = event => {
            salesModuleState.filters.region = event.target.value;
            applySalesFilters();
        };
    }

    if (managerSelect) {
        managerSelect.onchange = event => {
            salesModuleState.filters.manager = event.target.value;
            applySalesFilters();
        };
    }

    if (clientSelect) {
        clientSelect.onchange = event => {
            salesModuleState.filters.client = event.target.value;
            applySalesFilters();
        };
    }

    if (productSelect) {
        productSelect.onchange = event => {
            salesModuleState.filters.product = event.target.value;
            applySalesFilters();
        };
    }

    if (startInput) {
        startInput.onchange = event => {
            salesModuleState.filters.start = event.target.value || null;
        };
    }

    if (endInput) {
        endInput.onchange = event => {
            salesModuleState.filters.end = event.target.value || null;
        };
    }

    if (applyButton) {
        applyButton.onclick = event => {
            event.preventDefault();
            applySalesFilters();
        };
    }

    if (resetButton) {
        resetButton.onclick = event => {
            event.preventDefault();
            resetSalesFilters();
        };
    }
}

function populateSalesFilterSelect(select, values, placeholder) {
    if (!select) {
        return;
    }
    const options = [`<option value="all">${sanitizeText(placeholder || 'Усі')}</option>`];
    values.forEach(value => {
        const raw = String(value || '').trim();
        if (!raw) {
            return;
        }
        options.push(`<option value="${sanitizeText(raw.toLowerCase())}">${sanitizeText(raw)}</option>`);
    });
    select.innerHTML = options.join('');
}

function getUniqueSalesValues(key) {
    const values = new Set();
    salesModuleState.allOpportunities.forEach(opportunity => {
        const value = opportunity[key];
        if (value) {
            values.add(String(value).trim());
        }
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b, 'uk', { sensitivity: 'base' }));
}

function syncSalesCustomRangeVisibility() {
    const wrapper = document.getElementById('salesCustomRangeWrapper');
    if (!wrapper) {
        return;
    }
    if (salesModuleState.filters.period === 'custom') {
        wrapper.classList.remove('hidden');
    } else {
        wrapper.classList.add('hidden');
    }
}

function applySalesFilters(options = {}) {
    const { skipRender = false } = options;
    const filterKeys = buildSalesFilterKeys(salesModuleState.filters);
    const range = getSalesFilterDateRange(salesModuleState.filters);

    const filtered = salesModuleState.allOpportunities.filter(opportunity => {
        if (!matchesOpportunity(opportunity, filterKeys)) {
            return false;
        }

        const date = getOpportunityFilterDate(opportunity);
        if (range.start && (!date || date < range.start)) {
            return false;
        }
        if (range.end && (!date || date > range.end)) {
            return false;
        }
        return true;
    });

    salesModuleState.opportunities = filtered;
    updateSalesFilterSummary(range, filtered.length);
    syncSalesCustomRangeVisibility();

    if (!skipRender) {
        refreshSalesVisuals();
    }
}

function resetSalesFilters() {
    salesModuleState.filters = { ...SALES_FILTER_DEFAULTS };

    const periodSelect = document.getElementById('salesFilterPeriod');
    const typeSelect = document.getElementById('salesFilterType');
    const regionSelect = document.getElementById('salesFilterRegion');
    const managerSelect = document.getElementById('salesFilterManager');
    const clientSelect = document.getElementById('salesFilterClient');
    const productSelect = document.getElementById('salesFilterProduct');
    const startInput = document.getElementById('salesFilterStartDate');
    const endInput = document.getElementById('salesFilterEndDate');

    if (periodSelect) periodSelect.value = salesModuleState.filters.period;
    if (typeSelect) typeSelect.value = salesModuleState.filters.type;
    if (regionSelect) regionSelect.value = salesModuleState.filters.region;
    if (managerSelect) managerSelect.value = salesModuleState.filters.manager;
    if (clientSelect) clientSelect.value = salesModuleState.filters.client;
    if (productSelect) productSelect.value = salesModuleState.filters.product;
    if (startInput) startInput.value = '';
    if (endInput) endInput.value = '';

    applySalesFilters();
}

function formatCurrencyByCode(amount, currency = 'USD') {
    if (!currency) {
        return formatCurrency(amount);
    }
    try {
        return new Intl.NumberFormat('uk-UA', {
            style: 'currency',
            currency
        }).format(amount || 0);
    } catch (error) {
        return formatCurrency(amount);
    }
}

function calculateSalesMetrics(opportunities, filters = {}, referenceOpportunities = []) {
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
    let totalRevenue = 0;
    let totalProfit = 0;

    const forecastBuckets = {};
    const revenueTrendBuckets = new Map();
    const categoryBuckets = new Map();
    const sellerBuckets = new Map();
    const segmentationBuckets = {
        clientTypes: new Map(),
        regions: new Map(),
        products: new Map()
    };
    const overduePayments = [];
    const now = new Date();

    const filterRange = getSalesFilterDateRange(filters);
    const previousRange = calculatePreviousPeriodRange(filterRange);
    const filterKeys = buildSalesFilterKeys(filters);

    const ensureSegment = (map, label) => {
        const key = label || 'Інше';
        if (!map.has(key)) {
            map.set(key, { label: key, revenue: 0, pipeline: 0, deals: 0 });
        }
        return map.get(key);
    };

    opportunities.forEach(opportunity => {
        const stage = stageSummary[opportunity.stage] ? opportunity.stage : SALES_STAGE_ORDER[0];
        const amount = Number(opportunity.value) || 0;
        const probability = Math.min(Math.max(Number(opportunity.probability) || 0, 0), 100);
        const margin = Number.isFinite(opportunity.profit_margin) ? Number(opportunity.profit_margin) : 0.32;
        const rawProfit = Number(opportunity.profit_amount);
        const profitAmount = Number.isFinite(rawProfit) ? rawProfit : amount * margin;

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
            totalRevenue += amount;
            totalProfit += profitAmount;
        }

        if (stage === 'Closed Lost') {
            closedLostCount += 1;
        }

        const expectedDate = parseDateValue(opportunity.expected_close_date);
        if (expectedDate) {
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

        const revenueDate = stage === 'Closed Won'
            ? parseDateValue(opportunity.actual_close_date || opportunity.expected_close_date)
            : expectedDate;
        if (revenueDate) {
            const monthKey = `${revenueDate.getFullYear()}-${String(revenueDate.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = revenueDate.toLocaleDateString('uk-UA', { month: 'short', year: 'numeric' });
            if (!revenueTrendBuckets.has(monthKey)) {
                revenueTrendBuckets.set(monthKey, { label: monthLabel, revenue: 0, pipeline: 0 });
            }
            const bucket = revenueTrendBuckets.get(monthKey);
            if (stage === 'Closed Won') {
                bucket.revenue += amount;
            } else if (isOpen) {
                bucket.pipeline += amount;
            }
        }

        const productLabel = opportunity.product_line || opportunity.sales_type || 'Інше';
        if (!categoryBuckets.has(productLabel)) {
            categoryBuckets.set(productLabel, { label: productLabel, total: 0, deals: 0, wonRevenue: 0 });
        }
        const categoryEntry = categoryBuckets.get(productLabel);
        categoryEntry.total += amount;
        categoryEntry.deals += 1;
        if (stage === 'Closed Won') {
            categoryEntry.wonRevenue += amount;
        }

        const ownerLabel = opportunity.owner || 'Не призначено';
        if (!sellerBuckets.has(ownerLabel)) {
            sellerBuckets.set(ownerLabel, {
                owner: ownerLabel,
                team: opportunity.manager_team || 'Sales',
                deals: 0,
                wonDeals: 0,
                lostDeals: 0,
                revenue: 0
            });
        }
        const sellerEntry = sellerBuckets.get(ownerLabel);
        sellerEntry.deals += 1;
        if (stage === 'Closed Won') {
            sellerEntry.wonDeals += 1;
            sellerEntry.revenue += amount;
        }
        if (stage === 'Closed Lost') {
            sellerEntry.lostDeals += 1;
        }

        const clientSegment = ensureSegment(segmentationBuckets.clientTypes, opportunity.client_type || 'Інші клієнти');
        clientSegment.deals += 1;
        if (stage === 'Closed Won') {
            clientSegment.revenue += amount;
        } else if (isOpen) {
            clientSegment.pipeline += amount;
        }

        const regionSegment = ensureSegment(segmentationBuckets.regions, opportunity.region || 'Інші регіони');
        regionSegment.deals += 1;
        if (stage === 'Closed Won') {
            regionSegment.revenue += amount;
        } else if (isOpen) {
            regionSegment.pipeline += amount;
        }

        const productSegment = ensureSegment(segmentationBuckets.products, productLabel);
        productSegment.deals += 1;
        if (stage === 'Closed Won') {
            productSegment.revenue += amount;
        } else if (isOpen) {
            productSegment.pipeline += amount;
        }

        const paymentStatus = String(opportunity.payment_status || '').toLowerCase();
        if (paymentStatus.includes('простроч') || paymentStatus.includes('overdue')) {
            overduePayments.push(opportunity);
        } else if (
            stage === 'Closed Won'
            && paymentStatus.includes('частково')
            && expectedDate
            && expectedDate < now
        ) {
            overduePayments.push(opportunity);
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

    let previousRevenue = 0;
    if (previousRange) {
        previousRevenue = referenceOpportunities.reduce((sum, opportunity) => {
            if (opportunity.stage !== 'Closed Won') {
                return sum;
            }
            if (!matchesOpportunity(opportunity, filterKeys)) {
                return sum;
            }
            const date = getOpportunityFilterDate(opportunity);
            if (!date) {
                return sum;
            }
            if (previousRange.start && date < previousRange.start) {
                return sum;
            }
            if (previousRange.end && date > previousRange.end) {
                return sum;
            }
            return sum + (Number(opportunity.value) || 0);
        }, 0);
    }

    const averageCheck = closedWonCount > 0 ? totalRevenue / closedWonCount : 0;
    const conversionRate = opportunities.length > 0 ? closedWonCount / opportunities.length : 0;
    const profitMargin = totalRevenue > 0 ? totalProfit / totalRevenue : 0;
    const growthRate = previousRevenue > 0
        ? (totalRevenue - previousRevenue) / previousRevenue
        : (totalRevenue > 0 ? 1 : 0);

    const revenueTrendKeys = Array.from(revenueTrendBuckets.keys()).sort();
    const revenueTrend = {
        labels: revenueTrendKeys.map(key => revenueTrendBuckets.get(key).label),
        revenue: revenueTrendKeys.map(key => Math.round(revenueTrendBuckets.get(key).revenue)),
        pipeline: revenueTrendKeys.map(key => Math.round(revenueTrendBuckets.get(key).pipeline))
    };

    const categoryBreakdown = Array.from(categoryBuckets.values())
        .map(entry => ({ ...entry }))
        .sort((a, b) => {
            if (b.total !== a.total) {
                return b.total - a.total;
            }
            return (b.wonRevenue || 0) - (a.wonRevenue || 0);
        });

    const sellerPerformance = Array.from(sellerBuckets.values())
        .map(entry => ({
            ...entry,
            winRate: entry.deals > 0 ? entry.wonDeals / entry.deals : 0
        }))
        .sort((a, b) => {
            if (b.revenue !== a.revenue) {
                return b.revenue - a.revenue;
            }
            return (b.wonDeals || 0) - (a.wonDeals || 0);
        });

    const convertSegmentationMap = map => Array.from(map.values())
        .sort((a, b) => {
            if (b.revenue !== a.revenue) {
                return b.revenue - a.revenue;
            }
            if (b.pipeline !== a.pipeline) {
                return b.pipeline - a.pipeline;
            }
            return b.deals - a.deals;
        });

    const segmentation = {
        clientTypes: convertSegmentationMap(segmentationBuckets.clientTypes),
        regions: convertSegmentationMap(segmentationBuckets.regions),
        products: convertSegmentationMap(segmentationBuckets.products)
    };

    const insights = {
        topProduct: categoryBreakdown[0] || null,
        topSeller: sellerPerformance[0] || null,
        topRegion: segmentation.regions[0] || null,
        overdueCount: overduePayments.length,
        range: filterRange
    };

    return {
        stageSummary,
        totalPipeline,
        weightedPipeline,
        openCount,
        avgDealSize,
        winRate,
        wonValue,
        forecast,
        kpis: {
            totalRevenue,
            totalProfit,
            dealCount: closedWonCount,
            averageCheck,
            conversionRate,
            profitMargin,
            growthRate,
            previousRevenue,
            range: filterRange
        },
        revenueTrend,
        categoryBreakdown,
        sellerPerformance,
        segmentation,
        insights,
        overduePayments
    };
}

function renderSalesMetrics(metrics) {
    const pipelineValue = document.getElementById('salesPipelineValue');
    const pipelineCount = document.getElementById('salesPipelineCount');
    const weightedValue = document.getElementById('salesWeightedValue');
    const winRateElement = document.getElementById('salesWinRate');
    const avgDealSize = document.getElementById('salesAvgDealSize');
    const wonValueElement = document.getElementById('salesWonValue');
    const pipelineStats = document.getElementById('salesPipelineStats');
    const funnelSummary = document.getElementById('salesFunnelSummary');
    const forecastSummary = document.getElementById('salesForecastSummary');

    const totalRevenueElement = document.getElementById('salesTotalRevenue');
    const revenueHelper = document.getElementById('salesRevenueHelper');
    const dealsCountElement = document.getElementById('salesDealsCount');
    const dealsHelper = document.getElementById('salesDealsHelper');
    const averageCheckElement = document.getElementById('salesAverageCheck');
    const averageCheckHelper = document.getElementById('salesAverageCheckHelper');
    const conversionElement = document.getElementById('salesConversion');
    const conversionHelper = document.getElementById('salesConversionHelper');
    const profitabilityElement = document.getElementById('salesProfitability');
    const profitabilityHelper = document.getElementById('salesProfitabilityHelper');
    const growthBadge = document.getElementById('salesGrowthBadge');
    const growthLabel = document.getElementById('salesGrowthLabel');

    const kpis = metrics.kpis || {};
    const totalDeals = salesModuleState.opportunities.length;

    if (totalRevenueElement) totalRevenueElement.textContent = formatCurrency(kpis.totalRevenue || 0);

    if (revenueHelper) {
        const range = kpis.range || {};
        const startLabel = range.start ? formatDateRangeDisplay(range.start) : '';
        const endLabel = range.end ? formatDateRangeDisplay(range.end) : '';
        const rangeFragment = startLabel || endLabel ? ` · ${startLabel || '—'} – ${endLabel || '—'}` : '';
        revenueHelper.textContent = `${kpis.dealCount || 0} угод у періоді${rangeFragment}`;
    }

    if (dealsCountElement) dealsCountElement.textContent = String(totalDeals);
    if (dealsHelper) dealsHelper.textContent = `Активні у воронці: ${metrics.openCount}`;

    if (averageCheckElement) averageCheckElement.textContent = formatCurrency(kpis.averageCheck || 0);
    if (averageCheckHelper) {
        averageCheckHelper.textContent = kpis.dealCount
            ? `Розраховано по ${kpis.dealCount} виграним угодам`
            : 'Очікуємо виграні угоди';
    }

    if (conversionElement) conversionElement.textContent = formatPercentage(kpis.conversionRate || 0);
    if (conversionHelper) {
        conversionHelper.textContent = totalDeals
            ? `${kpis.dealCount || 0} з ${totalDeals} угод виграно`
            : 'Очікуємо дані про угоди';
    }

    if (profitabilityElement) profitabilityElement.textContent = formatPercentage(kpis.profitMargin || 0);
    if (profitabilityHelper) {
        profitabilityHelper.textContent = `Чистий прибуток: ${formatCurrency(kpis.totalProfit || 0)}`;
    }

    if (growthBadge) {
        const growthValue = Number.isFinite(kpis.growthRate) ? kpis.growthRate : 0;
        const growthPercent = growthValue * 100;
        const formattedGrowth = `${growthPercent >= 0 ? '+' : ''}${growthPercent.toFixed(1)}%`;
        growthBadge.textContent = formattedGrowth;
        growthBadge.classList.remove('bg-emerald-50', 'text-emerald-600', 'bg-rose-50', 'text-rose-600', 'bg-gray-100', 'text-gray-600');
        if (growthValue > 0) {
            growthBadge.classList.add('bg-emerald-50', 'text-emerald-600');
        } else if (growthValue < 0) {
            growthBadge.classList.add('bg-rose-50', 'text-rose-600');
        } else {
            growthBadge.classList.add('bg-gray-100', 'text-gray-600');
        }
    }

    if (growthLabel) {
        growthLabel.textContent = `vs попередній період (${formatCurrency(kpis.previousRevenue || 0)})`;
    }

    if (pipelineValue) pipelineValue.textContent = formatCurrency(metrics.totalPipeline);
    if (pipelineCount) pipelineCount.textContent = `${metrics.openCount} активних угод`;
    if (weightedValue) weightedValue.textContent = formatCurrency(metrics.weightedPipeline);
    if (wonValueElement) wonValueElement.textContent = `${formatCurrency(metrics.wonValue)} closed won`;
    if (winRateElement) winRateElement.textContent = `${metrics.winRate.toFixed(1)}%`;
    if (avgDealSize) avgDealSize.textContent = formatCurrency(metrics.avgDealSize);
    if (pipelineStats) {
        pipelineStats.textContent = `${metrics.openCount} open • Weighted ${formatCurrency(metrics.weightedPipeline)} • Closed ${formatCurrency(kpis.totalRevenue || 0)}`;
    }

    const qualificationCount = metrics.stageSummary['Qualification']?.count || 0;
    if (funnelSummary) funnelSummary.textContent = `${qualificationCount} угод на старті воронки`;

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

    const opportunityStageEntries = getDictionaryEntries('opportunities', 'stages', SALES_STAGE_ORDER);

    tbody.innerHTML = sortedOpportunities.map(opportunity => {
        const stageOptions = renderSelectOptions(opportunityStageEntries, opportunity.stage || '');

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
    const metrics = calculateSalesMetrics(
        salesModuleState.opportunities,
        salesModuleState.filters,
        salesModuleState.allOpportunities
    );
    salesModuleState.lastMetrics = metrics;
    renderSalesMetrics(metrics);
    renderSalesFunnel(metrics.stageSummary);
    renderSalesPipelineBoard();
    renderSalesOpportunityTable();
    renderSalesForecast(metrics.forecast);
    renderSalesRevenueTrend(metrics.revenueTrend);
    renderSalesCategoryDistribution(metrics.categoryBreakdown);
    renderSalesTopSellers(metrics.sellerPerformance);
    renderSalesInsights(metrics);
    renderSalesSegmentation(metrics.segmentation);
    renderSalesDetailTable(salesModuleState.opportunities);
    renderSalesReportsSummary(metrics);
    renderSalesGoals(metrics);
    renderSalesIntegrationsSummary();
    renderSalesSecuritySummary(metrics);
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

function renderSalesRevenueTrend(trend = { labels: [], revenue: [], pipeline: [] }) {
    const canvas = document.getElementById('salesRevenueTrendChart');
    const emptyState = document.getElementById('salesRevenueTrendEmpty');
    const summary = document.getElementById('salesRevenueTrendSummary');
    if (!canvas) {
        return;
    }

    if (!Array.isArray(trend.labels) || trend.labels.length === 0) {
        if (charts.salesRevenueTrend) {
            charts.salesRevenueTrend.destroy();
            charts.salesRevenueTrend = null;
        }
        canvas.classList.add('hidden');
        if (emptyState) {
            emptyState.classList.remove('hidden');
            emptyState.classList.add('flex');
        }
        if (summary) {
            summary.textContent = 'Недостатньо даних';
        }
        return;
    }

    canvas.classList.remove('hidden');
    if (emptyState) {
        emptyState.classList.add('hidden');
        emptyState.classList.remove('flex');
    }

    const context = canvas.getContext('2d');
    if (charts.salesRevenueTrend) {
        charts.salesRevenueTrend.destroy();
    }

    charts.salesRevenueTrend = new Chart(context, {
        type: 'line',
        data: {
            labels: trend.labels,
            datasets: [
                {
                    label: 'Закрита виручка',
                    data: trend.revenue,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.12)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 3
                },
                {
                    label: 'Pipeline',
                    data: trend.pipeline,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.12)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 3
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

    if (summary) {
        const lastRevenue = trend.revenue[trend.revenue.length - 1] || 0;
        summary.textContent = `Останній період: ${formatCurrency(lastRevenue)}`;
    }
}

function renderSalesCategoryDistribution(breakdown = []) {
    const canvas = document.getElementById('salesCategoryDistributionChart');
    const legend = document.getElementById('salesCategoryDistributionLegend');
    const summary = document.getElementById('salesCategorySummary');
    if (!canvas) {
        return;
    }

    if (!Array.isArray(breakdown) || breakdown.length === 0) {
        if (charts.salesCategoryDistribution) {
            charts.salesCategoryDistribution.destroy();
            charts.salesCategoryDistribution = null;
        }
        if (legend) {
            legend.innerHTML = '<p class="text-sm text-gray-500">Немає даних для відображення.</p>';
        }
        if (summary) {
            summary.textContent = 'Очікуємо угоди';
        }
        return;
    }

    const labels = breakdown.map(item => item.label);
    const values = breakdown.map(item => Math.round(item.total || 0));
    const colors = ['#1d4ed8', '#22c55e', '#f97316', '#9333ea', '#0ea5e9', '#ef4444'];

    const context = canvas.getContext('2d');
    if (charts.salesCategoryDistribution) {
        charts.salesCategoryDistribution.destroy();
    }

    charts.salesCategoryDistribution = new Chart(context, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [
                {
                    data: values,
                    backgroundColor: labels.map((_, index) => colors[index % colors.length]),
                    borderWidth: 1,
                    hoverOffset: 6
                }
            ]
        },
        options: {
            cutout: '60%',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: context => `${context.label}: ${formatCurrency(context.parsed)}`
                    }
                }
            }
        }
    });

    if (legend) {
        legend.innerHTML = breakdown.slice(0, 6).map((item, index) => {
            const color = colors[index % colors.length];
            return `
                <div class="flex items-center justify-between text-sm text-gray-600">
                    <div class="flex items-center gap-2">
                        <span class="inline-flex h-2.5 w-2.5 rounded-full" style="background:${color}"></span>
                        <span>${sanitizeText(item.label)}</span>
                    </div>
                    <span class="font-medium text-gray-700">${formatCurrency(item.total || 0)}</span>
                </div>
            `;
        }).join('');
    }

    if (summary) {
        summary.textContent = `Топ категорія: ${sanitizeText(breakdown[0].label)} (${formatCurrency(breakdown[0].total || 0)})`;
    }
}

function renderSalesTopSellers(sellers = []) {
    const tbody = document.getElementById('salesTopSellersBody');
    const summary = document.getElementById('salesTopSellersSummary');
    if (!tbody) {
        return;
    }

    if (!Array.isArray(sellers) || sellers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="p-4 text-center text-sm text-gray-500">Немає даних про продавців.</td>
            </tr>
        `;
        if (summary) {
            summary.textContent = '';
        }
        return;
    }

    tbody.innerHTML = sellers.slice(0, 6).map(seller => {
        const winRate = seller.winRate ? formatPercentage(seller.winRate) : '0%';
        return `
            <tr class="hover:bg-gray-50">
                <td class="p-3 font-medium text-gray-800">${sanitizeText(seller.owner || 'Не призначено')}</td>
                <td class="p-3 text-gray-600">${sanitizeText(seller.team || 'Sales')}</td>
                <td class="p-3 text-gray-600">${sanitizeText(seller.deals || 0)}</td>
                <td class="p-3 text-gray-700 font-medium">${formatCurrency(seller.revenue || 0)}</td>
                <td class="p-3 text-gray-600">${winRate}</td>
            </tr>
        `;
    }).join('');

    if (summary) {
        const leader = sellers[0];
        summary.textContent = leader
            ? `${leader.owner} закрив ${formatCurrency(leader.revenue || 0)}`
            : '';
    }
}

function renderSalesInsights(metrics) {
    const list = document.getElementById('salesInsightsList');
    if (!list) {
        return;
    }

    const insights = [];
    const kpis = metrics.kpis || {};

    if (metrics.insights?.topProduct) {
        insights.push(`Топ продукт: <span class="font-medium text-gray-800">${sanitizeText(metrics.insights.topProduct.label)}</span> (${formatCurrency(metrics.insights.topProduct.total || 0)})`);
    }
    if (metrics.insights?.topRegion) {
        insights.push(`Найактивніший регіон: <span class="font-medium text-gray-800">${sanitizeText(metrics.insights.topRegion.label)}</span> (${formatCurrency(metrics.insights.topRegion.revenue || 0)})`);
    }
    if (kpis.conversionRate !== undefined) {
        insights.push(`Конверсія угод: <span class="font-medium text-gray-800">${formatPercentage(kpis.conversionRate || 0)}</span>.`);
    }
    if (metrics.overduePayments?.length) {
        insights.push(`Прострочені платежі: <span class="font-medium text-rose-600">${metrics.overduePayments.length}</span>.`);
    }

    if (!insights.length) {
        list.innerHTML = '<li class="text-sm text-gray-500">Аналітика буде доступна після появи нових угод.</li>';
        return;
    }

    list.innerHTML = insights.map(item => `<li class="text-sm text-gray-600">${item}</li>`).join('');
}

function renderSalesSegmentation(segmentation = { clientTypes: [], regions: [], products: [] }) {
    const container = document.getElementById('salesSegmentation');
    const summary = document.getElementById('salesSegmentationSummary');
    if (!container) {
        return;
    }

    const renderGroup = (title, items) => {
        if (!items.length) {
            return '';
        }
        const topItems = items.slice(0, 3);
        return `
            <div>
                <h4 class="text-sm font-semibold text-gray-700 mb-2">${sanitizeText(title)}</h4>
                <ul class="space-y-2">
                    ${topItems.map(item => `
                        <li class="flex items-center justify-between text-sm text-gray-600">
                            <span>${sanitizeText(item.label)}</span>
                            <span class="font-medium text-gray-700">${formatCurrency(item.revenue || item.pipeline || 0)}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    };

    const sections = [
        renderGroup('Типи клієнтів', segmentation.clientTypes || []),
        renderGroup('Регіони', segmentation.regions || []),
        renderGroup('Продукти', segmentation.products || [])
    ].filter(Boolean);

    container.innerHTML = sections.length
        ? sections.join('<hr class="my-3 border-gray-100">')
        : '<p class="text-sm text-gray-500">Сегментація стане доступною після появи угод.</p>';

    if (summary) {
        const topClient = segmentation.clientTypes?.[0];
        summary.textContent = topClient
            ? `Лідируючий сегмент: ${sanitizeText(topClient.label)}`
            : '';
    }
}

function renderSalesDetailTable(opportunities) {
    const tbody = document.getElementById('salesDetailTableBody');
    if (!tbody) {
        return;
    }

    if (!Array.isArray(opportunities) || opportunities.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="p-4 text-center text-sm text-gray-500">Немає даних про продажі за вибраними фільтрами.</td>
            </tr>
        `;
        return;
    }

    const rows = opportunities.map(opportunity => {
        const date = getOpportunityFilterDate(opportunity);
        const dateLabel = date ? date.toLocaleDateString('uk-UA') : '—';
        const amount = formatCurrencyByCode(opportunity.value || 0, opportunity.currency || 'USD');
        const profit = formatCurrencyByCode(opportunity.profit_amount || 0, opportunity.currency || 'USD');
        return `
            <tr class="hover:bg-gray-50">
                <td class="p-3 text-gray-600">${sanitizeText(dateLabel)}</td>
                <td class="p-3 font-medium text-gray-800">${sanitizeText(opportunity.deal_code || opportunity.id || '')}</td>
                <td class="p-3 text-gray-600">${sanitizeText(opportunity.account_name || '—')}</td>
                <td class="p-3 text-gray-600">${sanitizeText(opportunity.owner || '—')}</td>
                <td class="p-3 text-gray-600">${sanitizeText(opportunity.product_line || '—')}</td>
                <td class="p-3 text-gray-700 font-medium">${amount}</td>
                <td class="p-3 text-gray-600">${sanitizeText(opportunity.payment_status || '—')}</td>
                <td class="p-3 text-gray-700 font-medium">${profit}</td>
            </tr>
        `;
    }).join('');

    tbody.innerHTML = rows;
}

function renderSalesReportsSummary(metrics) {
    const summary = document.getElementById('salesReportsSummary');
    if (!summary) {
        return;
    }
    const kpis = metrics.kpis || {};
    const parts = [
        `Виручка: ${formatCurrency(kpis.totalRevenue || 0)}`,
        `Конверсія: ${formatPercentage(kpis.conversionRate || 0)}`,
        `Прибуток: ${formatCurrency(kpis.totalProfit || 0)}`
    ];
    if (metrics.overduePayments?.length) {
        parts.push(`Прострочені платежі: ${metrics.overduePayments.length}`);
    }
    summary.textContent = parts.join(' · ');
}

function renderSalesGoals(metrics) {
    const container = document.getElementById('salesGoals');
    if (!container) {
        return;
    }

    const kpis = metrics.kpis || {};
    const revenueTarget = kpis.previousRevenue
        ? Math.max(kpis.previousRevenue * 1.1, kpis.totalRevenue || 0)
        : (kpis.totalRevenue || 50000) * 1.2;
    const conversionTarget = 0.35;
    const winRateTarget = 0.45;

    const goals = [
        {
            title: 'Виконання плану виручки',
            value: kpis.totalRevenue || 0,
            target: revenueTarget,
            helper: `План: ${formatCurrency(revenueTarget)}`
        },
        {
            title: 'Конверсія лідів у клієнтів',
            value: kpis.conversionRate || 0,
            target: conversionTarget,
            helper: `Ціль: ${formatPercentage(conversionTarget)}`,
            isRatio: true
        },
        {
            title: 'Win-rate',
            value: (metrics.winRate || 0) / 100,
            target: winRateTarget,
            helper: `Поточний: ${metrics.winRate.toFixed(1)}%`,
            isRatio: true
        }
    ];

    container.innerHTML = goals.map(goal => {
        const progress = goal.target ? Math.min(goal.value / goal.target, 1) : 0;
        const percentage = goal.isRatio ? goal.value : progress;
        const formattedProgress = goal.isRatio
            ? formatPercentage(goal.value || 0)
            : formatPercentage(progress);
        return `
            <div>
                <div class="flex items-center justify-between text-sm text-gray-600">
                    <span class="font-semibold text-gray-700">${sanitizeText(goal.title)}</span>
                    <span>${formattedProgress}</span>
                </div>
                <div class="mt-2 h-2 w-full rounded-full bg-gray-100">
                    <div class="h-2 rounded-full bg-blue-600" style="width: ${(progress * 100).toFixed(0)}%"></div>
                </div>
                <p class="mt-1 text-xs text-gray-500">${sanitizeText(goal.helper)}</p>
            </div>
        `;
    }).join('');
}

function renderSalesIntegrationsSummary() {
    const summary = document.getElementById('salesIntegrationsSummary');
    if (!summary) {
        return;
    }

    const paymentProviders = Array.from(salesModuleState.billing.paymentProviders || []);
    const accountingSystems = Array.from(salesModuleState.billing.accountingSystems || []);
    const terms = salesModuleState.billing.paymentTerms || 'Net 30';
    const autoSend = salesModuleState.billing.autoSendInvoices ? 'увімкнено' : 'вимкнено';

    const providerLabels = PAYMENT_PROVIDERS
        .filter(provider => paymentProviders.includes(provider.id))
        .map(provider => provider.name);
    const accountingLabels = ACCOUNTING_SYSTEMS
        .filter(system => accountingSystems.includes(system.id))
        .map(system => system.name);

    summary.innerHTML = `
        <p>Платіжні системи: <span class="font-medium text-gray-800">${providerLabels.length ? sanitizeText(providerLabels.join(', ')) : 'не підключено'}</span></p>
        <p>Бухгалтерія: <span class="font-medium text-gray-800">${accountingLabels.length ? sanitizeText(accountingLabels.join(', ')) : 'не налаштовано'}</span></p>
        <p>Умови оплати: <span class="font-medium text-gray-800">${sanitizeText(terms)}</span> · автопостачання ${autoSend}</p>
    `;
}

function renderSalesSecuritySummary(metrics) {
    const summary = document.getElementById('salesSecuritySummary');
    if (!summary) {
        return;
    }

    const overdueCount = metrics.overduePayments?.length || 0;
    summary.innerHTML = `
        <p>Рівні доступу: менеджери бачать лише власні угоди, аналітики — агреговані дані.</p>
        <p>Прострочені платежі під контролем: <span class="font-medium ${overdueCount ? 'text-rose-600' : 'text-emerald-600'}">${overdueCount}</span>.</p>
        <p>Журнал змін зберігає історію для ${metrics.stageSummary ? Object.values(metrics.stageSummary).reduce((sum, item) => sum + (item.count || 0), 0) : 0} записів.</p>
    `;
}

function handleSalesExport(format = 'csv') {
    const dataset = salesModuleState.opportunities;
    if (!Array.isArray(dataset) || dataset.length === 0) {
        showToast('Немає даних для експорту', 'warning');
        return;
    }

    const headers = ['Date', 'Deal', 'Client', 'Manager', 'Product', 'Amount', 'Payment Status', 'Profit'];
    const rows = dataset.map(opportunity => {
        const date = getOpportunityFilterDate(opportunity);
        const dateLabel = date ? date.toISOString().split('T')[0] : '';
        const amount = formatCurrencyByCode(opportunity.value || 0, opportunity.currency || 'USD');
        const profit = formatCurrencyByCode(opportunity.profit_amount || 0, opportunity.currency || 'USD');
        return [
            dateLabel,
            opportunity.deal_code || opportunity.id || '',
            opportunity.account_name || '',
            opportunity.owner || '',
            opportunity.product_line || '',
            amount,
            opportunity.payment_status || '',
            profit
        ];
    });

    const escapeCell = value => `"${String(value).replace(/"/g, '""')}"`;
    const csvContent = [headers, ...rows].map(row => row.map(escapeCell).join(',')).join('\n');

    if (format === 'csv') {
        downloadCSV(csvContent, 'sales_report.csv');
        showToast('Експортовано CSV', 'success');
        return;
    }

    if (format === 'excel') {
        const tsvContent = [headers, ...rows].map(row => row.join('\t')).join('\n');
        downloadCSV(tsvContent, 'sales_report.xlsx');
        showToast('Підготовлено файл Excel (формат TSV)', 'info');
        return;
    }

    showToast('Експорт у PDF доступний через CSV/Excel. Скористайтеся ними для генерації PDF.', 'info');
}

function handleSalesReport(type) {
    const metrics = salesModuleState.lastMetrics;
    const summary = document.getElementById('salesReportsSummary');
    if (!metrics || !summary) {
        showToast('Аналітика ще не готова', 'warning');
        return;
    }

    const kpis = metrics.kpis || {};
    let message;

    switch (type) {
        case 'revenue':
            message = `Виручка: ${formatCurrency(kpis.totalRevenue || 0)} · Δ до минулого періоду ${formatCurrency((kpis.totalRevenue || 0) - (kpis.previousRevenue || 0))}`;
            break;
        case 'conversion':
            message = `Конверсія: ${formatPercentage(kpis.conversionRate || 0)} · Виграно ${kpis.dealCount || 0} угод`;
            break;
        case 'profitability':
            message = `Маржа: ${formatPercentage(kpis.profitMargin || 0)} · Прибуток ${formatCurrency(kpis.totalProfit || 0)}`;
            break;
        case 'overdue':
            message = `Прострочені платежі: ${metrics.overduePayments?.length || 0} · Pipeline ${formatCurrency(metrics.totalPipeline || 0)}`;
            break;
        default:
            message = 'Звіт оновлено.';
    }

    summary.textContent = message;
    showToast('Звіт оновлено', 'success');
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
            transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }

        .cih-competitor-card[data-selected="true"] {
            border-color: rgba(56, 189, 248, 0.6);
            box-shadow: 0 0 0 1px rgba(125, 211, 252, 0.45), 0 18px 40px -20px rgba(56, 189, 248, 0.5);
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

        .cih-outline-button[disabled],
        .cih-primary-button[disabled] {
            opacity: 0.55;
            cursor: not-allowed;
            pointer-events: none;
            filter: grayscale(0.3);
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

        .cih-detail-container {
            background: rgba(15, 23, 42, 0.55);
            border-radius: 1rem;
            border: 1px solid rgba(100, 116, 139, 0.2);
            padding: 1.25rem;
            color: #cbd5f5;
        }

        .cih-detail-shell {
            display: grid;
            gap: 1.25rem;
        }

        .cih-detail-grid {
            display: grid;
            gap: 1rem;
        }

        .cih-detail-grid-cols-2 {
            grid-template-columns: repeat(1, minmax(0, 1fr));
        }

        @media (min-width: 1024px) {
            .cih-detail-grid-cols-2 {
                grid-template-columns: repeat(2, minmax(0, 1fr));
            }
        }

        .cih-detail-panel {
            background: rgba(15, 23, 42, 0.65);
            border-radius: 1rem;
            border: 1px solid rgba(100, 116, 139, 0.25);
            padding: 1.2rem;
            color: #e2e8f0;
        }

        .cih-detail-panel h4 {
            font-size: 0.95rem;
            font-weight: 600;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: #cbd5f5;
        }

        .cih-detail-list {
            display: grid;
            gap: 0.65rem;
            margin-top: 0.85rem;
        }

        .cih-detail-list-item {
            display: flex;
            justify-content: space-between;
            gap: 1rem;
            font-size: 0.85rem;
            color: #cbd5f5;
        }

        .cih-detail-list-item span {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
        }

        .cih-pill {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            padding: 0.35rem 0.65rem;
            border-radius: 9999px;
            background: rgba(56, 189, 248, 0.14);
            border: 1px solid rgba(56, 189, 248, 0.35);
            font-size: 0.75rem;
            color: #bae6fd;
        }

        .cih-pill button {
            font: inherit;
            color: inherit;
            background: transparent;
            border: none;
            cursor: pointer;
        }

        .cih-empty-state {
            padding: 1rem;
            border-radius: 0.75rem;
            border: 1px dashed rgba(148, 163, 184, 0.3);
            background: rgba(15, 23, 42, 0.35);
            color: #94a3b8;
            font-size: 0.85rem;
        }

        .cih-detail-timeline {
            display: grid;
            gap: 0.75rem;
            margin-top: 0.85rem;
        }

        .cih-detail-timeline-item {
            padding: 0.85rem 1rem;
            border-radius: 0.8rem;
            background: rgba(12, 74, 110, 0.18);
            border: 1px solid rgba(56, 189, 248, 0.25);
        }

        .cih-detail-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
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

        .cih-research-board {
            margin-top: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .cih-research-toolbar {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            justify-content: space-between;
            align-items: center;
        }

        .cih-research-tabs {
            display: inline-flex;
            background: rgba(15, 23, 42, 0.5);
            border: 1px solid rgba(148, 163, 184, 0.16);
            border-radius: 9999px;
            padding: 0.25rem;
            gap: 0.25rem;
        }

        .cih-research-tab {
            border: none;
            background: transparent;
            color: #cbd5f5;
            font-size: 0.875rem;
            font-weight: 500;
            padding: 0.45rem 0.9rem;
            border-radius: 9999px;
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            cursor: pointer;
            transition: background-color 0.2s ease, color 0.2s ease;
        }

        .cih-research-tab[data-active="true"] {
            background: rgba(56, 189, 248, 0.25);
            color: #0ea5e9;
            box-shadow: inset 0 0 0 1px rgba(14, 165, 233, 0.45);
        }

        .cih-research-tab[data-drop-active="true"] {
            background: rgba(14, 165, 233, 0.25);
            color: #38bdf8;
        }

        .cih-research-add {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            border-radius: 9999px;
            padding: 0.55rem 1rem;
            font-size: 0.875rem;
            font-weight: 600;
            background: linear-gradient(135deg, rgba(14, 165, 233, 0.9), rgba(59, 130, 246, 0.9));
            color: #0b1120;
            border: none;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .cih-research-add:hover {
            transform: translateY(-1px);
            box-shadow: 0 12px 30px rgba(56, 189, 248, 0.35);
        }

        .cih-research-add .cih-add-icon {
            font-size: 1rem;
        }

        .cih-research-panels {
            display: grid;
            gap: 1.25rem;
        }

        .cih-research-note-list {
            display: grid;
            gap: 0.75rem;
        }

        .cih-research-note {
            display: flex;
            justify-content: space-between;
            gap: 1rem;
            background: rgba(2, 6, 23, 0.7);
            border: 1px solid rgba(148, 163, 184, 0.16);
            border-radius: 0.75rem;
            padding: 0.85rem 1rem;
            cursor: grab;
            transition: border-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
        }

        .cih-research-note:active {
            cursor: grabbing;
        }

        .cih-research-note[data-dragging="true"] {
            opacity: 0.6;
            transform: scale(0.99);
            box-shadow: 0 10px 25px rgba(14, 116, 144, 0.35);
        }

        .cih-research-note h5 {
            font-size: 0.95rem;
            color: #e2e8f0;
            margin-bottom: 0.35rem;
        }

        .cih-research-note p {
            font-size: 0.8rem;
            color: #94a3b8;
            margin: 0;
        }

        .cih-research-note-meta {
            min-width: 8rem;
            text-align: right;
            font-size: 0.75rem;
            color: #7dd3fc;
        }

        .cih-research-folders {
            display: grid;
            gap: 0.85rem;
        }

        .cih-research-folder {
            background: rgba(2, 6, 23, 0.65);
            border: 1px solid rgba(148, 163, 184, 0.14);
            border-radius: 0.9rem;
            padding: 0.85rem 1rem;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .cih-research-folder[data-drop-active="true"] {
            border-color: rgba(56, 189, 248, 0.75);
            box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.25);
        }

        .cih-research-folder-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 0.5rem;
        }

        .cih-research-folder-header span {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            color: #cbd5f5;
            font-size: 0.85rem;
        }

        .cih-research-folder-count {
            font-size: 0.75rem;
            color: #38bdf8;
            background: rgba(56, 189, 248, 0.15);
            padding: 0.1rem 0.55rem;
            border-radius: 9999px;
        }

        .cih-research-file-list {
            margin-top: 0.75rem;
            display: grid;
            gap: 0.6rem;
        }

        .cih-research-file {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 0.75rem;
            background: rgba(15, 23, 42, 0.45);
            border-radius: 0.65rem;
            padding: 0.65rem 0.75rem;
            font-size: 0.8rem;
            color: #cbd5f5;
        }

        .cih-research-file span {
            color: #94a3b8;
        }

        .cih-research-empty {
            font-size: 0.8rem;
            color: #64748b;
            font-style: italic;
        }

        .cih-research-guidance {
            font-size: 0.75rem;
            color: #7dd3fc;
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

function openObsidianNote(filePath) {
    if (!filePath) {
        showToast('Obsidian note path is not configured for this record.', 'warning');
        return;
    }
    const normalized = String(filePath).trim().replace(/^\/+/, '');
    const uri = `obsidian://open?path=${encodeURIComponent(normalized)}`;
    try {
        const opened = window.open(uri, '_blank');
        if (!opened) {
            showToast('We tried to open Obsidian but it may be blocked. Use the note link manually.', 'warning');
        }
    } catch (error) {
        console.warn('Unable to open Obsidian URI', error);
        showToast('Unable to open Obsidian automatically. Copy the path and open it manually.', 'warning');
    }
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
        const companyLookup = new Map();
        companies.forEach(item => {
            if (item?.id) {
                companyLookup.set(String(item.id), item);
            }
        });

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
            const targets = normalizeCompetitorTargets(comp, companyLookup);

            return {
                ...comp,
                kanbanColumns,
                signals: activeSignals,
                enhancement,
                linkedContacts,
                linked_clients: targets.names,
                linkedCompanyIds: targets.ids
            };
        });
        const clientsWithCoverage = companies.map(company => {
            const coverage = competitorProfiles.filter(comp => competitorTargetsCompany(comp, company, companyLookup));
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
                                { label: 'Клієнти зі списку спостереження', value: competitor.linkedCompanyIds?.length || (competitor.linked_clients || []).length }
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
                            const avgClients = peers.reduce((acc, item) => acc + (item.linkedCompanyIds?.length || item.linked_clients?.length || 0), 0) / total;
                            return {
                                competitor: {
                                    name: competitor.name,
                                    tier: translateTierLabel(competitor.tier) || 'Рівень 3',
                                    tasks: computeActiveTasks(competitor),
                                    signals: competitor.signals?.length || 0,
                                    clients: competitor.linkedCompanyIds?.length || competitor.linked_clients?.length || 0
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

                <div class="cih-section mt-8" id="cihCompetitorDetailSection">
                    <div class="cih-section-header">
                        <h3 class="cih-section-title"><i class="fas fa-id-card"></i>Досьє конкурента</h3>
                        <div class="cih-detail-actions">
                            <button type="button" class="cih-outline-button" id="cihAddCompetitorButton"><i class="fas fa-plus"></i> Додати конкурента</button>
                            <button type="button" class="cih-outline-button" id="cihEditCompetitorButton" disabled><i class="fas fa-pen"></i> Редагувати</button>
                            <button type="button" class="cih-outline-button" id="cihCreateCompetitorTaskButton" disabled><i class="fas fa-list-check"></i> Додати задачу</button>
                            <button type="button" class="cih-primary-button" id="cihLogCompetitorUpdateButton" disabled><i class="fas fa-bolt"></i> Залогувати оновлення</button>
                        </div>
                    </div>
                    <div class="cih-detail-container" id="cihCompetitorDetailContent">
                        <p class="text-sm text-slate-400">Оберіть конкурента, щоб побачити деталі, пов’язані клієнти, задачі дослідження та останні оновлення конкурентної розвідки.</p>
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

        const competitorCardsContainer = document.getElementById('cihCompetitorCards');
        const competitorDetailContent = document.getElementById('cihCompetitorDetailContent');
        const addCompetitorButton = document.getElementById('cihAddCompetitorButton');
        const editCompetitorButton = document.getElementById('cihEditCompetitorButton');
        const createCompetitorTaskButton = document.getElementById('cihCreateCompetitorTaskButton');
        const logCompetitorUpdateButton = document.getElementById('cihLogCompetitorUpdateButton');
        let selectedCompetitorId = null;

        const researchWorkspaceStore = new Map();
        let researchWorkspaceIdCounter = 0;
        let researchDragContext = null;

        const ensureResearchWorkspaceState = (competitor, updates = [], documents = []) => {
            if (!competitor) {
                return null;
            }
            let state = researchWorkspaceStore.get(competitor.id);
            if (!state) {
                const baseFolders = [
                    {
                        id: `folder-${competitor.id}-inbox`,
                        name: 'Research Inbox',
                        icon: 'fas fa-inbox',
                        description: 'Review new insights before filing them.',
                        isInbox: true
                    },
                    {
                        id: `folder-${competitor.id}-library`,
                        name: 'Files Library',
                        icon: 'fas fa-folder-open',
                        description: 'Structured archive for vetted documents.',
                        isDefault: true
                    },
                    {
                        id: `folder-${competitor.id}-shared`,
                        name: 'Shared with Sales',
                        icon: 'fas fa-people-group',
                        description: 'Approved material for revenue teams.'
                    }
                ];
                state = {
                    competitorId: competitor.id,
                    activeTab: 'notes',
                    folders: baseFolders.slice(),
                    notes: [],
                    files: []
                };
                const folderMap = new Map(state.folders.map(folder => [folder.id, folder]));
                const ensureFolderForType = type => {
                    if (!type) {
                        const defaultFolder = state.folders.find(folder => folder.isDefault) || state.folders[0];
                        return defaultFolder ? defaultFolder.id : '';
                    }
                    const normalized = type.trim();
                    const slug = normalized.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    const folderId = `folder-${competitor.id}-${slug || 'library'}`;
                    if (!folderMap.has(folderId)) {
                        const folder = {
                            id: folderId,
                            name: normalized,
                            icon: 'fas fa-folder',
                            description: 'Auto-created from competitor documents.'
                        };
                        state.folders.push(folder);
                        folderMap.set(folderId, folder);
                    }
                    return folderId;
                };
                (documents || []).forEach(doc => {
                    const folderId = ensureFolderForType(doc?.type);
                    researchWorkspaceIdCounter += 1;
                    state.files.push({
                        id: `file-${competitor.id}-${researchWorkspaceIdCounter}`,
                        name: doc?.title || 'Untitled document',
                        type: doc?.type || 'Document',
                        owner: doc?.owner || 'Research Guild',
                        folderId,
                        updatedAt: doc?.updated || doc?.date || null
                    });
                });
                (updates || []).slice(0, 4).forEach(update => {
                    researchWorkspaceIdCounter += 1;
                    state.notes.push({
                        id: `note-${competitor.id}-${researchWorkspaceIdCounter}`,
                        title: update?.subject || update?.title || 'Research note',
                        summary: update?.description || update?.summary || '—',
                        owner: update?.assigned_to || update?.owner || 'Competitive Research Guild',
                        updatedAt: update?.date || update?.updated_at || new Date().toISOString(),
                        category: update?.type || update?.category || 'Insight'
                    });
                });
                researchWorkspaceStore.set(competitor.id, state);
            }
            return state;
        };

        const renderResearchNotes = state => {
            if (!state.notes.length) {
                return '<div class="cih-empty-state">Research notes will appear here once captured. Use “Add Note” to get started.</div>';
            }
            return `
                <div class="cih-research-note-list">
                    ${state.notes.map(note => `
                        <article class="cih-research-note" draggable="true" data-research-note-id="${note.id}">
                            <div>
                                <h5>${sanitizeText(note.title)}</h5>
                                <p>${sanitizeText(note.summary)}</p>
                            </div>
                            <div class="cih-research-note-meta">
                                <div>${sanitizeText(note.owner || 'Research')}</div>
                                <div>${sanitizeText(competitorHubFormatRelative(note.updatedAt))}</div>
                            </div>
                        </article>
                    `).join('')}
                </div>
            `;
        };

        const renderResearchFolders = state => {
            return state.folders.map(folder => {
                const folderFiles = state.files.filter(file => file.folderId === folder.id);
                const description = folder.description
                    ? `<p class="cih-research-guidance mt-1">${sanitizeText(folder.description)}</p>`
                    : '';
                const fileList = folderFiles.length
                    ? folderFiles.map(file => `
                        <div class="cih-research-file">
                            <div class="flex items-center gap-2">
                                <i class="fas fa-file-alt text-sky-300"></i>
                                <span>${sanitizeText(file.name)}</span>
                            </div>
                            <span>${sanitizeText(file.owner || '')}</span>
                        </div>
                    `).join('')
                    : '<p class="cih-research-empty">Drop notes here to build this folder.</p>';
                return `
                    <section class="cih-research-folder" data-research-folder-id="${folder.id}">
                        <div class="cih-research-folder-header">
                            <span><i class="${folder.icon || 'fas fa-folder'}"></i>${sanitizeText(folder.name)}</span>
                            <span class="cih-research-folder-count">${folderFiles.length}</span>
                        </div>
                        ${description}
                        <div class="cih-research-file-list">
                            ${fileList}
                        </div>
                    </section>
                `;
            }).join('');
        };

        const renderResearchWorkspaceView = competitorId => {
            if (!competitorDetailContent) {
                return;
            }
            const container = competitorDetailContent.querySelector('#cihResearchWorkspace');
            if (!container) {
                return;
            }
            const state = researchWorkspaceStore.get(competitorId);
            if (!state) {
                container.innerHTML = '<div class="cih-empty-state">Research workspace is loading…</div>';
                return;
            }
            container.dataset.competitorId = competitorId;
            const activeTab = state.activeTab || 'notes';
            const addLabel = activeTab === 'files' ? 'Add File' : 'Add Note';
            container.innerHTML = `
                <div class="cih-research-toolbar">
                    <div class="cih-research-tabs">
                        <button type="button" class="cih-research-tab" data-research-tab="notes" data-active="${activeTab === 'notes'}">📝<span>Research Notes</span></button>
                        <button type="button" class="cih-research-tab" data-research-tab="files" data-active="${activeTab === 'files'}">📁<span>Files</span></button>
                    </div>
                    <button type="button" class="cih-research-add" data-research-add>
                        <span class="cih-add-icon">➕</span>
                        <span>${sanitizeText(addLabel)}</span>
                    </button>
                </div>
                <div class="cih-research-panels">
                    <div data-research-panel="notes" class="${activeTab === 'notes' ? '' : 'hidden'}">
                        ${renderResearchNotes(state)}
                    </div>
                    <div data-research-panel="files" class="${activeTab === 'files' ? '' : 'hidden'}">
                        <p class="cih-research-guidance mb-2">Drag any note onto a folder or the Files tab to archive it safely.</p>
                        <div class="cih-research-folders">
                            ${renderResearchFolders(state)}
                        </div>
                    </div>
                </div>
            `;
            if (!container.dataset.researchHandlersBound) {
                bindResearchWorkspaceEvents(container);
                container.dataset.researchHandlersBound = 'true';
            }
        };

        const getResearchState = event => {
            const container = event.currentTarget;
            const competitorId = container.dataset.competitorId;
            const state = researchWorkspaceStore.get(competitorId);
            return { container, competitorId, state };
        };

        const clearResearchFolderHighlights = container => {
            container.querySelectorAll('[data-research-folder-id]').forEach(folder => {
                folder.dataset.dropActive = 'false';
            });
            container.querySelectorAll('[data-research-tab]').forEach(tab => {
                tab.dataset.dropActive = 'false';
            });
        };

        const handleResearchAddNew = competitorId => {
            const state = researchWorkspaceStore.get(competitorId);
            if (!state) {
                return;
            }
            const now = new Date().toISOString();
            if (state.activeTab === 'files') {
                const defaultFolder = state.folders.find(folder => folder.isDefault) || state.folders[0];
                const name = window.prompt('File name');
                if (!name) {
                    return;
                }
                const trimmedName = name.trim();
                if (!trimmedName) {
                    return;
                }
                researchWorkspaceIdCounter += 1;
                const file = {
                    id: `file-${competitorId}-${researchWorkspaceIdCounter}`,
                    name: trimmedName,
                    type: 'Uploaded file',
                    owner: 'You',
                    folderId: defaultFolder ? defaultFolder.id : '',
                    updatedAt: now
                };
                state.files.unshift(file);
                renderResearchWorkspaceView(competitorId);
                const actionId = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                showToast(`File “${file.name}” added.`, 'success', {
                    duration: 8000,
                    action: {
                        id: actionId,
                        label: 'Undo',
                        handler: () => {
                            const index = state.files.findIndex(item => item.id === file.id);
                            if (index !== -1) {
                                state.files.splice(index, 1);
                                renderResearchWorkspaceView(competitorId);
                            }
                        }
                    }
                });
            } else {
                const title = window.prompt('Research note title');
                if (!title) {
                    return;
                }
                const trimmedTitle = title.trim();
                if (!trimmedTitle) {
                    return;
                }
                researchWorkspaceIdCounter += 1;
                const note = {
                    id: `note-${competitorId}-${researchWorkspaceIdCounter}`,
                    title: trimmedTitle,
                    summary: 'Draft research note created from workspace.',
                    owner: 'You',
                    updatedAt: now,
                    category: 'Draft'
                };
                state.notes.unshift(note);
                renderResearchWorkspaceView(competitorId);
                const actionId = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
                showToast(`Research note “${note.title}” added.`, 'success', {
                    duration: 8000,
                    action: {
                        id: actionId,
                        label: 'Undo',
                        handler: () => {
                            const index = state.notes.findIndex(item => item.id === note.id);
                            if (index !== -1) {
                                state.notes.splice(index, 1);
                                renderResearchWorkspaceView(competitorId);
                            }
                        }
                    }
                });
            }
        };

        const moveResearchNoteToFolder = (competitorId, noteId, folderId) => {
            const state = researchWorkspaceStore.get(competitorId);
            if (!state) {
                return;
            }
            const noteIndex = state.notes.findIndex(note => note.id === noteId);
            if (noteIndex === -1) {
                return;
            }
            const folder = state.folders.find(item => item.id === folderId) || state.folders.find(item => item.isDefault) || state.folders[0];
            if (!folder) {
                return;
            }
            const [note] = state.notes.splice(noteIndex, 1);
            researchWorkspaceIdCounter += 1;
            const file = {
                id: `file-${competitorId}-${researchWorkspaceIdCounter}`,
                name: note.title,
                type: note.category || 'Research Note',
                owner: note.owner,
                folderId: folder.id,
                updatedAt: note.updatedAt
            };
            state.files.unshift(file);
            renderResearchWorkspaceView(competitorId);
            const actionId = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            showToast(`Moved “${note.title}” to ${folder.name}.`, 'success', {
                duration: 8000,
                action: {
                    id: actionId,
                    label: 'Undo',
                    handler: () => {
                        const fileIndex = state.files.findIndex(item => item.id === file.id);
                        if (fileIndex !== -1) {
                            state.files.splice(fileIndex, 1);
                        }
                        state.notes.splice(noteIndex, 0, note);
                        renderResearchWorkspaceView(competitorId);
                    }
                }
            });
        };

        const handleResearchClick = event => {
            const target = event.target.closest('[data-research-tab], [data-research-add]');
            if (!target) {
                return;
            }
            const { container, competitorId, state } = getResearchState(event);
            if (!state) {
                return;
            }
            if (target.hasAttribute('data-research-tab')) {
                const tab = target.getAttribute('data-research-tab');
                if (tab && tab !== state.activeTab) {
                    state.activeTab = tab;
                    renderResearchWorkspaceView(competitorId);
                }
            } else if (target.hasAttribute('data-research-add')) {
                handleResearchAddNew(competitorId);
            }
            clearResearchFolderHighlights(container);
        };

        const handleResearchDragStart = event => {
            const noteEl = event.target.closest('[data-research-note-id]');
            if (!noteEl) {
                return;
            }
            const { container, competitorId } = getResearchState(event);
            if (!competitorId) {
                return;
            }
            const noteId = noteEl.getAttribute('data-research-note-id');
            researchDragContext = { competitorId, noteId, type: 'note' };
            noteEl.dataset.dragging = 'true';
            if (event.dataTransfer) {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', noteId);
            }
            clearResearchFolderHighlights(container);
        };

        const handleResearchDragEnd = event => {
            const { container } = getResearchState(event);
            const noteEl = event.target.closest('[data-research-note-id]');
            if (noteEl) {
                delete noteEl.dataset.dragging;
            }
            researchDragContext = null;
            clearResearchFolderHighlights(container);
        };

        const handleResearchDragEnter = event => {
            const { container, competitorId } = getResearchState(event);
            if (!researchDragContext || researchDragContext.competitorId !== competitorId) {
                return;
            }
            const folderEl = event.target.closest('[data-research-folder-id]');
            if (folderEl) {
                folderEl.dataset.dropActive = 'true';
                event.preventDefault();
            }
            const tabEl = event.target.closest('[data-research-tab="files"]');
            if (tabEl) {
                tabEl.dataset.dropActive = 'true';
                event.preventDefault();
            }
        };

        const handleResearchDragOver = event => {
            const { competitorId } = getResearchState(event);
            if (!researchDragContext || researchDragContext.competitorId !== competitorId) {
                return;
            }
            if (event.target.closest('[data-research-folder-id]') || event.target.closest('[data-research-tab="files"]')) {
                event.preventDefault();
            }
        };

        const handleResearchDragLeave = event => {
            const { container } = getResearchState(event);
            const folderEl = event.target.closest('[data-research-folder-id]');
            if (folderEl) {
                folderEl.dataset.dropActive = 'false';
            }
            const tabEl = event.target.closest('[data-research-tab]');
            if (tabEl) {
                tabEl.dataset.dropActive = 'false';
            }
            if (!event.relatedTarget || !container.contains(event.relatedTarget)) {
                clearResearchFolderHighlights(container);
            }
        };

        const handleResearchDrop = event => {
            const { container, competitorId, state } = getResearchState(event);
            if (!researchDragContext || researchDragContext.competitorId !== competitorId || !state) {
                return;
            }
            const folderEl = event.target.closest('[data-research-folder-id]');
            const tabEl = event.target.closest('[data-research-tab="files"]');
            if (folderEl) {
                event.preventDefault();
                const folderId = folderEl.getAttribute('data-research-folder-id');
                moveResearchNoteToFolder(competitorId, researchDragContext.noteId, folderId);
            } else if (tabEl) {
                event.preventDefault();
                const defaultFolder = state.folders.find(folder => folder.isDefault) || state.folders[0];
                if (defaultFolder) {
                    state.activeTab = 'files';
                    moveResearchNoteToFolder(competitorId, researchDragContext.noteId, defaultFolder.id);
                }
            }
            researchDragContext = null;
            clearResearchFolderHighlights(container);
        };

        const bindResearchWorkspaceEvents = container => {
            container.addEventListener('click', handleResearchClick);
            container.addEventListener('dragstart', handleResearchDragStart);
            container.addEventListener('dragend', handleResearchDragEnd);
            container.addEventListener('dragenter', handleResearchDragEnter);
            container.addEventListener('dragover', handleResearchDragOver);
            container.addEventListener('dragleave', handleResearchDragLeave);
            container.addEventListener('drop', handleResearchDrop);
        };

        const updateCardSelection = competitorId => {
            if (!competitorCardsContainer) {
                return;
            }
            const cards = competitorCardsContainer.querySelectorAll('.cih-competitor-card');
            cards.forEach(card => {
                const cardId = card.getAttribute('data-competitor-id');
                card.dataset.selected = cardId && competitorId && cardId === competitorId ? 'true' : 'false';
            });
        };

        const setDetailActionState = competitor => {
            const hasSelection = Boolean(competitor);
            if (editCompetitorButton) {
                editCompetitorButton.disabled = !hasSelection;
                if (hasSelection) {
                    editCompetitorButton.dataset.competitorId = competitor.id;
                } else {
                    delete editCompetitorButton.dataset.competitorId;
                }
            }
            if (createCompetitorTaskButton) {
                createCompetitorTaskButton.disabled = !hasSelection;
                if (hasSelection) {
                    createCompetitorTaskButton.dataset.competitorId = competitor.id;
                } else {
                    delete createCompetitorTaskButton.dataset.competitorId;
                }
            }
            if (logCompetitorUpdateButton) {
                logCompetitorUpdateButton.disabled = !hasSelection;
                if (hasSelection) {
                    logCompetitorUpdateButton.dataset.competitorId = competitor.id;
                } else {
                    delete logCompetitorUpdateButton.dataset.competitorId;
                }
            }
        };

        const buildLinkedClientChips = (competitor, targets) => {
            const records = [];
            const seen = new Set();
            targets.ids.forEach(id => {
                const company = companyLookup.get(String(id));
                if (!company) {
                    return;
                }
                const key = String(company.id || company.name || id).toLowerCase();
                if (seen.has(key)) {
                    return;
                }
                seen.add(key);
                if (company.name) {
                    seen.add(company.name.trim().toLowerCase());
                }
                records.push({ id: company.id, name: company.name, type: 'company' });
            });

            targets.names.forEach(name => {
                const trimmed = String(name || '').trim();
                if (!trimmed) {
                    return;
                }
                const key = trimmed.toLowerCase();
                if (seen.has(key)) {
                    return;
                }
                seen.add(key);
                records.push({ id: '', name: trimmed, type: 'name' });
            });
            if (!records.length && Array.isArray(competitor.linked_clients)) {
                competitor.linked_clients.forEach(name => {
                    const trimmed = String(name || '').trim();
                    if (!trimmed) {
                        return;
                    }
                    const key = trimmed.toLowerCase();
                    if (seen.has(key)) {
                        return;
                    }
                    seen.add(key);
                    records.push({ id: '', name: trimmed, type: 'name' });
                });
            }
            return records;
        };

        const renderCompetitorDetail = competitorId => {
            if (!competitorDetailContent) {
                return;
            }
            const competitor = competitorProfiles.find(item => item.id === competitorId) || null;
            selectedCompetitorId = competitor ? competitor.id : null;
            updateCardSelection(selectedCompetitorId);
            setDetailActionState(competitor);

            if (!competitor) {
                competitorDetailContent.innerHTML = '<p class="text-sm text-slate-400">Оберіть конкурента, щоб побачити деталі профілю.</p>';
                return;
            }

            const targets = normalizeCompetitorTargets(competitor, companyLookup);
            const linkedRecords = buildLinkedClientChips(competitor, targets);
            const markets = Array.isArray(competitor.primary_markets) ? competitor.primary_markets : [];
            const focusAreas = Array.isArray(competitor.focus_areas) ? competitor.focus_areas : [];
            const tasks = (tasksByCompetitor.get(competitor.id) || []).slice().sort((a, b) => {
                const dateA = competitorHubToDate(a.due_date)?.getTime() || Infinity;
                const dateB = competitorHubToDate(b.due_date)?.getTime() || Infinity;
                return dateA - dateB;
            });
            const updates = (competitor.signals || (activitiesByCompetitor.get(competitor.id) || [])).slice().sort((a, b) => {
                const dateA = competitorHubToDate(a.date || a.updated_at)?.getTime() || 0;
                const dateB = competitorHubToDate(b.date || b.updated_at)?.getTime() || 0;
                return dateB - dateA;
            });
            const nextDue = tasks.reduce((acc, task) => {
                const due = competitorHubToDate(task.due_date);
                if (!due) {
                    return acc;
                }
                if (!acc || due < acc) {
                    return due;
                }
                return acc;
            }, null);

            const noteFile = competitor.note_file || '';
            const noteButton = noteFile
                ? `<div class="mt-4 flex flex-wrap gap-2 items-center"><button type="button" class="cih-outline-button" data-open-obsidian-note="${encodeURIComponent(noteFile)}"><i class="fas fa-link"></i> Відкрити в Obsidian</button><a class="cih-outline-button" href="vault/${encodeURI(noteFile)}" target="_blank" rel="noopener"><i class="fas fa-folder-open"></i> Переглянути у Vault</a><span class="text-xs text-slate-400">${sanitizeText(noteFile)}</span></div>`
                : '<p class="text-xs text-slate-400 mt-3">Додайте шлях до нотатки Obsidian, щоб швидко відкривати батлкарди та дослідження.</p>';

            const linkedHtml = linkedRecords.length
                ? `<div class="mt-4 flex flex-wrap gap-2">${linkedRecords.map(record => record.id
                    ? `<button type="button" class="cih-pill" data-linked-company="${sanitizeText(record.id)}"><i class="fas fa-building"></i>${sanitizeText(record.name)}</button>`
                    : `<span class="cih-pill"><i class="fas fa-building"></i>${sanitizeText(record.name)}</span>`).join('')}</div>`
                : '<div class="cih-empty-state mt-4">Поки що немає пов’язаних клієнтів. Додайте компанії до списку цього конкурента, щоб бачити контекст.</div>';

            const tasksHtml = tasks.length
                ? `<div class="cih-detail-timeline mt-3">${tasks.map(task => {
                    const dueLabel = competitorHubFormatDateShort(task.due_date);
                    const status = task.status ? sanitizeText(task.status) : 'Невідомий статус';
                    const priority = task.priority ? sanitizeText(task.priority) : '—';
                    const assignee = task.assigned_to ? sanitizeText(task.assigned_to) : '';
                    return `
                        <div class="cih-detail-timeline-item">
                            <div class="flex items-center justify-between text-sm">
                                <span class="font-semibold text-slate-100">${sanitizeText(task.title || 'Task')}</span>
                                <span class="text-slate-300"><i class="far fa-calendar mr-1"></i>${dueLabel}</span>
                            </div>
                            <div class="text-xs text-slate-400 mt-2 flex flex-wrap gap-2 items-center">
                                <span><i class="fas fa-circle-notch mr-1"></i>${status}</span>
                                <span>•</span>
                                <span><i class="fas fa-bolt mr-1"></i>${priority}</span>
                                ${assignee ? `<span>•</span><span><i class="fas fa-user mr-1"></i>${assignee}</span>` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}</div>`
                : '<div class="cih-empty-state mt-3">Завдань дослідження поки немає.</div>';

            const updatesHtml = updates.length
                ? `<div class="cih-detail-timeline mt-3">${updates.map(update => {
                    const subject = update.subject || update.title || 'Update';
                    const description = update.description || update.summary || '';
                    const dateLabel = competitorHubFormatRelative(update.date || update.updated_at);
                    const typeLabel = update.type ? sanitizeText(update.type) : (update.category ? sanitizeText(update.category) : 'Update');
                    const owner = update.assigned_to ? sanitizeText(update.assigned_to) : (update.owner ? sanitizeText(update.owner) : '—');
                    return `
                        <div class="cih-detail-timeline-item">
                            <div class="flex items-center justify-between text-sm">
                                <span class="font-semibold text-slate-100">${sanitizeText(subject)}</span>
                                <span class="text-slate-300"><i class="far fa-clock mr-1"></i>${sanitizeText(dateLabel)}</span>
                            </div>
                            <div class="text-xs text-slate-400 mt-2 flex flex-wrap gap-2 items-center">
                                <span><i class="fas fa-bullhorn mr-1"></i>${typeLabel}</span>
                                ${owner && owner !== '—' ? `<span>•</span><span><i class="fas fa-user mr-1"></i>${owner}</span>` : ''}
                            </div>
                            ${description ? `<p class="text-sm text-slate-300 mt-2">${sanitizeText(description)}</p>` : ''}
                        </div>
                    `;
                }).join('')}</div>`
                : '<div class="cih-empty-state mt-3">Оновлення конкурентної розвідки відсутні.</div>';

            competitorDetailContent.innerHTML = `
                <div class="cih-detail-shell">
                    <div class="cih-detail-panel">
                        <div class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                                <h4>${sanitizeText(competitor.name || 'Конкурент')}</h4>
                                <p class="text-sm text-slate-300 mt-1">${sanitizeText(competitor.industry || 'Індустрію не вказано')} · ${sanitizeText(competitor.headquarters || 'Локацію не вказано')}</p>
                                <p class="text-sm text-slate-300 mt-3">${competitor.latest_move ? sanitizeText(competitor.latest_move) : 'Останній крок не зафіксовано.'}</p>
                            </div>
                            <div class="flex flex-wrap gap-2 justify-start md:justify-end">
                                <span class="cih-pill"><i class="fas fa-layer-group"></i>${sanitizeText(translateTierLabel(competitor.tier) || 'Рівень 3')}</span>
                                <span class="cih-pill"><i class="fas fa-satellite-dish"></i>${sanitizeText(translateStatusLabel(competitor.status) || 'Моніторинг')}</span>
                                <span class="cih-pill"><i class="far fa-clock"></i>${sanitizeText(competitorHubFormatRelative(competitor.last_update || competitor.updated_at))}</span>
                            </div>
                        </div>
                        ${noteButton}
                        ${linkedHtml}
                    </div>
                    <div class="cih-detail-grid cih-detail-grid-cols-2">
                        <div class="cih-detail-panel">
                            <h4>Огляд</h4>
                            <div class="cih-detail-list">
                                <div class="cih-detail-list-item"><span><i class="fas fa-user-shield"></i>Аналітик</span><span>${sanitizeText(competitor.intel_owner || 'Не призначено')}</span></div>
                                <div class="cih-detail-list-item"><span><i class="fas fa-globe"></i>Основні ринки</span><span>${markets.length ? markets.map(market => sanitizeText(market)).join(', ') : '—'}</span></div>
                                <div class="cih-detail-list-item"><span><i class="fas fa-bullseye"></i>Фокус</span><span>${focusAreas.length ? focusAreas.map(area => sanitizeText(area)).join(', ') : '—'}</span></div>
                                <div class="cih-detail-list-item"><span><i class="fas fa-calendar-alt"></i>Наст. дедлайн</span><span>${nextDue ? competitorHubFormatDateShort(nextDue) : '—'}</span></div>
                            </div>
                        </div>
                        <div class="cih-detail-panel">
                            <h4>Показники</h4>
                            <div class="cih-detail-list">
                                <div class="cih-detail-list-item"><span><i class="fas fa-list-check"></i>Задач у роботі</span><span>${tasks.length}</span></div>
                                <div class="cih-detail-list-item"><span><i class="fas fa-bolt"></i>Оновлення</span><span>${updates.length}</span></div>
                                <div class="cih-detail-list-item"><span><i class="fas fa-briefcase"></i>Клієнтів під наглядом</span><span>${linkedRecords.length}</span></div>
                            </div>
                        </div>
                    </div>
                    <div class="cih-detail-grid cih-detail-grid-cols-2">
                        <div class="cih-detail-panel">
                            <div class="flex items-center justify-between">
                                <h4>Research Tasks</h4>
                                <button type="button" class="cih-outline-button" data-create-task="${sanitizeText(competitor.id)}"><i class="fas fa-plus"></i> Нова задача</button>
                            </div>
                            ${tasksHtml}
                        </div>
                        <div class="cih-detail-panel">
                            <div class="flex items-center justify-between">
                                <h4>Updates</h4>
                                <button type="button" class="cih-outline-button" data-log-update="${sanitizeText(competitor.id)}"><i class="fas fa-plus"></i> Нове оновлення</button>
                            </div>
                            ${updatesHtml}
                        </div>
                    </div>
                    <div class="cih-detail-panel cih-research-board">
                        <h4 class="text-slate-200 font-semibold">Research Workspace</h4>
                        <p class="cih-research-guidance">Use the universal ➕ button to capture new notes or files and drag items between tabs to stay organized.</p>
                        <div id="cihResearchWorkspace"></div>
                    </div>
                </div>
            `;

            const documents = Array.isArray(competitor?.enhancement?.documents)
                ? competitor.enhancement.documents
                : (Array.isArray(competitor.documents) ? competitor.documents : []);
            ensureResearchWorkspaceState(competitor, updates, documents);
            renderResearchWorkspaceView(competitor.id);
        };

        competitorCardsContainer?.addEventListener('click', event => {
            const compareButton = event.target.closest('[data-compare-toggle]');
            if (compareButton) {
                return;
            }
            const workspaceButton = event.target.closest('[data-open-workspace]');
            if (workspaceButton) {
                return;
            }
            const card = event.target.closest('.cih-competitor-card');
            if (!card) {
                return;
            }
            const cardId = card.getAttribute('data-competitor-id');
            if (cardId) {
                renderCompetitorDetail(cardId);
            }
        });

        competitorDetailContent?.addEventListener('click', event => {
            const noteButtonEl = event.target.closest('[data-open-obsidian-note]');
            if (noteButtonEl) {
                const encoded = noteButtonEl.getAttribute('data-open-obsidian-note');
                const decoded = encoded ? decodeURIComponent(encoded) : '';
                openObsidianNote(decoded);
                return;
            }
            const companyButton = event.target.closest('[data-linked-company]');
            if (companyButton) {
                const companyId = companyButton.getAttribute('data-linked-company');
                if (companyId && typeof viewCompany === 'function') {
                    viewCompany(companyId);
                }
                return;
            }
            const createTaskTrigger = event.target.closest('[data-create-task]');
            if (createTaskTrigger) {
                const competitorId = createTaskTrigger.getAttribute('data-create-task');
                if (competitorId && typeof showTaskForm === 'function') {
                    showTaskForm(null, { defaultRelatedType: 'competitor', defaultRelatedId: competitorId });
                }
                return;
            }
            const logUpdateTrigger = event.target.closest('[data-log-update]');
            if (logUpdateTrigger) {
                const competitorId = logUpdateTrigger.getAttribute('data-log-update');
                if (competitorId && typeof showActivityForm === 'function') {
                    showActivityForm(null, { defaultRelatedType: 'competitor', defaultRelatedId: competitorId });
                }
            }
        });

        addCompetitorButton?.addEventListener('click', () => {
            if (typeof showCompetitorForm === 'function') {
                showCompetitorForm();
            }
        });

        editCompetitorButton?.addEventListener('click', () => {
            const competitorId = editCompetitorButton.dataset.competitorId;
            if (competitorId && typeof showCompetitorForm === 'function') {
                showCompetitorForm(competitorId);
            }
        });

        createCompetitorTaskButton?.addEventListener('click', () => {
            const competitorId = createCompetitorTaskButton.dataset.competitorId;
            if (competitorId && typeof showTaskForm === 'function') {
                showTaskForm(null, { defaultRelatedType: 'competitor', defaultRelatedId: competitorId });
            }
        });

        logCompetitorUpdateButton?.addEventListener('click', () => {
            const competitorId = logCompetitorUpdateButton.dataset.competitorId;
            if (competitorId && typeof showActivityForm === 'function') {
                showActivityForm(null, { defaultRelatedType: 'competitor', defaultRelatedId: competitorId });
            }
        });

        if (competitorProfiles.length) {
            renderCompetitorDetail(competitorProfiles[0].id);
        }

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
const taskUIState = {
    currentView: 'list',
    currentSchedulePeriod: 'week',
    quickFilter: null,
    selectedTaskId: null,
    allTasks: [],
    dataset: [],
    relatedDataset: null
};

async function showTasks() {
    showView('tasks');
    setPageHeader('tasks');

    const tasksView = document.getElementById('tasksView');
    tasksView.innerHTML = `
        <div class="space-y-6">
            <section id="taskSummaryCards" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"></section>

            <div class="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <aside class="space-y-6 xl:col-span-1">
                    <section class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <div class="flex items-center justify-between">
                            <h4 class="text-base font-semibold text-gray-800">Швидкі фільтри</h4>
                            <button id="resetTaskQuickFilters" class="text-sm text-blue-600 hover:text-blue-700">Скинути</button>
                        </div>
                        <p class="mt-2 text-sm text-gray-500">Знайдіть потрібні завдання за один клік.</p>
                        <div class="flex flex-wrap gap-2 mt-4">
                            <button class="task-quick-filter" data-task-filter="active">
                                <span class="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-600"><i class="fas fa-bolt mr-2"></i>Активні</span>
                            </button>
                            <button class="task-quick-filter" data-task-filter="completed">
                                <span class="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-600"><i class="fas fa-circle-check mr-2"></i>Виконані</span>
                            </button>
                            <button class="task-quick-filter" data-task-filter="overdue">
                                <span class="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-rose-50 text-rose-600"><i class="fas fa-triangle-exclamation mr-2"></i>Прострочені</span>
                            </button>
                            <button class="task-quick-filter" data-task-filter="highPriority">
                                <span class="inline-flex items-center px-3 py-1 text-xs font-medium rounded-full bg-orange-50 text-orange-600"><i class="fas fa-fire mr-2"></i>Високий пріоритет</span>
                            </button>
                        </div>
                    </section>

                    <section class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <h4 class="text-base font-semibold text-gray-800">Нагадування та сповіщення</h4>
                        <p class="mt-2 text-sm text-gray-500">Плануйте автоматичні нагадування про дедлайни та оновлення.</p>
                        <ul class="mt-4 space-y-3 text-sm text-gray-600">
                            <li class="flex items-start gap-3">
                                <i class="fas fa-bell text-indigo-500 mt-0.5"></i>
                                <span>Автоматичні сповіщення за день та годину до дедлайну.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <i class="fas fa-calendar-check text-emerald-500 mt-0.5"></i>
                                <span>Синхронізація з Google Calendar та Outlook.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <i class="fas fa-user-group text-blue-500 mt-0.5"></i>
                                <span>Командні сповіщення про зміни статусу або коментарі.</span>
                            </li>
                        </ul>
                    </section>

                    <section class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <h4 class="text-base font-semibold text-gray-800">Автоматизація та інтеграції</h4>
                        <p class="mt-2 text-sm text-gray-500">Запускайте сценарії та інтегруйте задачі з іншими каналами.</p>
                        <ul class="mt-4 space-y-3 text-sm text-gray-600">
                            <li class="flex items-start gap-3">
                                <i class="fas fa-robot text-purple-500 mt-0.5"></i>
                                <span>Автоматичне створення завдань після надходження нового ліда.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <i class="fas fa-envelope-open-text text-sky-500 mt-0.5"></i>
                                <span>Створюйте задачі з email-листів та закріплюйте вкладення.</span>
                            </li>
                            <li class="flex items-start gap-3">
                                <i class="fab fa-slack text-pink-500 mt-0.5"></i>
                                <span>Отримуйте сповіщення в Slack чи Telegram при оновленнях.</span>
                            </li>
                        </ul>
                    </section>

                    <section class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                        <h4 class="text-base font-semibold text-gray-800">Безпека та доступ</h4>
                        <p class="mt-2 text-sm text-gray-500">Контролюйте рівні доступу до завдань і відстежуйте активність.</p>
                        <ul class="mt-4 space-y-2 text-sm text-gray-600">
                            <li><i class="fas fa-shield-halved text-gray-400 mr-2"></i>Ролі для створення, редагування та видалення.</li>
                            <li><i class="fas fa-scroll text-gray-400 mr-2"></i>Повний лог дій та зміни статусів.</li>
                            <li><i class="fas fa-lock text-gray-400 mr-2"></i>Обмеження доступу до чутливих задач.</li>
                        </ul>
                    </section>
                </aside>

                <div class="space-y-6 xl:col-span-3">
                    <section class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                            <div>
                                <h3 class="text-lg font-semibold text-gray-800">Керування завданнями</h3>
                                <p class="text-sm text-gray-500">Плануйте, розподіляйте та контролюйте прогрес команди.</p>
                            </div>
                            <div class="flex flex-wrap items-center gap-2">
                                <button onclick="showTaskForm()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                    <i class="fas fa-plus mr-2"></i>Нове завдання
                                </button>
                                <button onclick="generateReport('activities')" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                    <i class="fas fa-arrow-down mr-2"></i>Експорт активностей
                                </button>
                            </div>
                        </div>

                        <div class="mt-6 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3">
                            <div class="xl:col-span-2 relative">
                                <input type="text" id="taskSearch" placeholder="Пошук завдань..." class="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                            </div>
                            <select id="taskStatusFilter" class="border border-gray-300 rounded-lg px-3 py-2">
                                <option value="">Усі статуси</option>
                                <option value="Not Started">Не розпочато</option>
                                <option value="In Progress">В роботі</option>
                                <option value="Completed">Виконано</option>
                                <option value="Cancelled">Скасовано</option>
                            </select>
                            <select id="taskPriorityFilter" class="border border-gray-300 rounded-lg px-3 py-2">
                                <option value="">Усі пріоритети</option>
                                <option value="Low">Низький</option>
                                <option value="Medium">Середній</option>
                                <option value="High">Високий</option>
                                <option value="Critical">Критичний</option>
                            </select>
                            <select id="taskTypeFilter" class="border border-gray-300 rounded-lg px-3 py-2">
                                <option value="">Усі типи</option>
                                <option value="Call">Дзвінок</option>
                                <option value="Email">Email</option>
                                <option value="Meeting">Зустріч</option>
                                <option value="Follow-up">Follow-up</option>
                                <option value="Proposal">Пропозиція</option>
                                <option value="Planning">Планування</option>
                                <option value="Research">Дослідження</option>
                            </select>
                            <select id="taskRelationTypeFilter" class="border border-gray-300 rounded-lg px-3 py-2">
                                <option value="">Усі пов’язання</option>
                                <option value="unlinked">Лише без зв’язків</option>
                                <option value="deal">Угоди</option>
                                <option value="lead">Ліди</option>
                                <option value="company">Компанії</option>
                                <option value="contact">Контакти</option>
                                <option value="competitor">Конкуренти</option>
                            </select>
                            <select id="taskRelationRecordFilter" class="border border-gray-300 rounded-lg px-3 py-2" disabled>
                                <option value="">Усі записи</option>
                            </select>
                        </div>

                        <div class="mt-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                            <div id="taskViewSwitcher" class="inline-flex items-center bg-gray-100 rounded-lg p-1 text-sm">
                                <button type="button" data-view="list" class="task-view-button px-3 py-1.5 rounded-md bg-white shadow">Список</button>
                                <button type="button" data-view="kanban" class="task-view-button px-3 py-1.5 rounded-md text-gray-600">Канбан</button>
                                <button type="button" data-view="calendar" class="task-view-button px-3 py-1.5 rounded-md text-gray-600">Календар</button>
                            </div>
                            <div id="taskBulkActions" class="flex flex-wrap items-center gap-2 text-sm">
                                <span class="text-gray-500">Масові дії:</span>
                                <button type="button" data-bulk-action="assign" class="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50">Призначити</button>
                                <button type="button" data-bulk-action="status" class="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50">Змінити статус</button>
                                <button type="button" data-bulk-action="export" class="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50">Експорт CSV</button>
                            </div>
                        </div>

                        <div id="taskListContainer" class="mt-6">
                            <div class="overflow-x-auto border border-gray-100 rounded-xl">
                                <table class="w-full">
                                    <thead class="bg-gray-50">
                                        <tr>
                                            <th class="p-3 w-12">
                                                <input type="checkbox" id="selectAllTasks" class="rounded border-gray-300">
                                            </th>
                                            <th class="text-left p-3 font-medium text-gray-600">Завдання</th>
                                            <th class="text-left p-3 font-medium text-gray-600">Тип</th>
                                            <th class="text-left p-3 font-medium text-gray-600">Пріоритет</th>
                                            <th class="text-left p-3 font-medium text-gray-600">Статус</th>
                                            <th class="text-left p-3 font-medium text-gray-600">Термін</th>
                                            <th class="text-left p-3 font-medium text-gray-600">Виконавець</th>
                                            <th class="text-left p-3 font-medium text-gray-600">Створено</th>
                                            <th class="text-left p-3 font-medium text-gray-600">Дії</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tasksTableBody"></tbody>
                                </table>
                            </div>
                            <div id="tasksPagination" class="mt-6 flex items-center justify-between"></div>
                        </div>

                        <div id="taskKanbanContainer" class="mt-6 hidden">
                            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" id="taskKanbanColumns"></div>
                        </div>

                        <div id="taskCalendarContainer" class="mt-6 hidden">
                            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                                <div>
                                    <h4 class="text-base font-semibold text-gray-800">Календарний розклад</h4>
                                    <p class="text-sm text-gray-500">Переглядайте дедлайни на день, тиждень або місяць.</p>
                                </div>
                                <div id="taskSchedulePeriod" class="inline-flex items-center bg-gray-100 rounded-lg p-1 text-sm">
                                    <button type="button" data-period="day" class="task-period-button px-3 py-1.5 rounded-md">День</button>
                                    <button type="button" data-period="week" class="task-period-button px-3 py-1.5 rounded-md bg-white shadow">Тиждень</button>
                                    <button type="button" data-period="month" class="task-period-button px-3 py-1.5 rounded-md">Місяць</button>
                                </div>
                            </div>
                            <div id="taskCalendarContent" class="mt-4 space-y-4"></div>
                        </div>
                    </section>

                    <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div id="taskDetailPanel" class="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div class="text-center text-sm text-gray-500">
                                <p><i class="fas fa-info-circle mr-2"></i>Оберіть завдання у списку, щоб побачити деталі.</p>
                            </div>
                        </div>
                        <div class="space-y-6">
                            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h4 class="text-base font-semibold text-gray-800">Аналітика завдань</h4>
                                <p class="mt-2 text-sm text-gray-500">Відстежуйте прогрес команди та баланс завдань.</p>
                                <div id="taskAnalyticsContainer" class="mt-4 space-y-3"></div>
                            </div>
                            <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                <h4 class="text-base font-semibold text-gray-800">Командна активність</h4>
                                <p class="mt-2 text-sm text-gray-500">Останні оновлення та зміни по завданнях.</p>
                                <div id="taskHistorySnapshot" class="mt-4 space-y-3"></div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    `;

    taskUIState.currentView = 'list';
    taskUIState.currentSchedulePeriod = 'week';
    taskUIState.quickFilter = null;
    taskUIState.selectedTaskId = null;
    taskUIState.allTasks = [];
    taskUIState.dataset = [];
    taskUIState.relatedDataset = null;

    setupTaskViewControls();
    setupTaskQuickFilters();
    setupTaskBulkActions();

    applyDictionaryToSelect(document.getElementById('taskStatusFilter'), 'tasks', 'statuses', {
        includeBlank: true,
        blankLabel: 'Усі статуси',
        blankValue: ''
    });
    applyDictionaryToSelect(document.getElementById('taskPriorityFilter'), 'tasks', 'priorities', {
        includeBlank: true,
        blankLabel: 'Усі пріоритети',
        blankValue: ''
    });
    applyDictionaryToSelect(document.getElementById('taskTypeFilter'), 'tasks', 'types', {
        includeBlank: true,
        blankLabel: 'Усі типи',
        blankValue: ''
    });

    await loadTasks();
    setupTaskFilters();
}

async function loadTasks(page = 1, search, status, priority, type, relationType, relationRecord) {
    showLoading();
    try {
        const searchInput = document.getElementById('taskSearch');
        const statusSelect = document.getElementById('taskStatusFilter');
        const prioritySelect = document.getElementById('taskPriorityFilter');
        const typeSelect = document.getElementById('taskTypeFilter');
        const relationTypeSelect = document.getElementById('taskRelationTypeFilter');
        const relationRecordSelect = document.getElementById('taskRelationRecordFilter');

        const searchValue = search !== undefined ? search : (searchInput?.value ?? '');
        const statusValue = status !== undefined ? status : (statusSelect?.value ?? '');
        const priorityValue = priority !== undefined ? priority : (prioritySelect?.value ?? '');
        const typeValue = type !== undefined ? type : (typeSelect?.value ?? '');
        const relationTypeValue = relationType !== undefined ? relationType : (relationTypeSelect?.value ?? '');
        const relationRecordValue = relationRecord !== undefined ? relationRecord : (relationRecordSelect?.value ?? '');

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
        const relatedDataset = await fetchRelatedRecordsForLinking();
        const relationConfig = getRelatedLinkConfigByType(relationTypeValue);
        const allLabel = relationConfig ? `All ${relationConfig.pluralLabel || `${relationConfig.label}s`}` : 'All records';

        if (relationRecordSelect) {
            updateRelatedRecordSelect(relationRecordSelect, relatedDataset, relationTypeValue, relationRecordValue, {
                includeAllOption: true,
                allLabel,
                placeholderLabel: relationConfig ? `Select ${relationConfig.label.toLowerCase()}` : 'Select related record',
                noTypeLabel: 'All records',
                unlinkedLabel: 'Unlinked only'
            });
        }

        const tasks = Array.isArray(data.data) ? data.data : [];
        const filteredTasks = filterItemsByRelation(tasks, relationTypeValue, relationRecordValue);

        displayTasks(filteredTasks, relatedDataset);
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

function displayTasks(tasks, relatedDataset = null) {
    const tbody = document.getElementById('tasksTableBody');
    if (!tbody) {
        return;
    }

    const allTasks = Array.isArray(tasks) ? tasks.slice() : [];
    taskUIState.allTasks = allTasks;
    taskUIState.relatedDataset = relatedDataset;

    const visibleTasks = applyTaskQuickFilter(allTasks);
    taskUIState.dataset = visibleTasks;

    const selectAllCheckbox = document.getElementById('selectAllTasks');
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
    }

    if (!visibleTasks.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="text-center py-8 text-gray-500">
                    <i class="fas fa-tasks text-4xl mb-4"></i>
                    <p>Завдань не знайдено за вибраними умовами.</p>
                    <button onclick="showTaskForm()" class="mt-2 text-blue-600 hover:text-blue-700">Створити перше завдання</button>
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = visibleTasks.map(task => renderTaskTableRow(task, relatedDataset)).join('');
    }

    updateTaskSummaryCards(visibleTasks, allTasks.length);
    renderTaskKanban(visibleTasks, relatedDataset);
    renderTaskSchedule(visibleTasks);
    renderTaskAnalytics(allTasks, visibleTasks);
    renderTaskHistorySnapshot(allTasks);

    if (taskUIState.selectedTaskId) {
        const selectedTask = allTasks.find(task => String(task.id) === String(taskUIState.selectedTaskId));
        updateTaskDetailPanel(selectedTask || null, relatedDataset);
    } else {
        updateTaskDetailPanel(null, relatedDataset);
    }

    highlightSelectedTask();
    updateQuickFilterChips();
}

function renderTaskTableRow(task, relatedDataset = null) {
    const taskId = task?.id ? sanitizeText(task.id) : '';
    const title = task?.title ? safeText(task.title) : 'Без назви';
    const descriptionText = task?.description ? truncateText(String(task.description), 140) : 'Без опису';
    const description = safeText(descriptionText);
    const relationBadge = buildTaskRelationBadge(task, relatedDataset);
    const expectedResult = task?.expected_result ? safeText(String(task.expected_result)) : '';
    const recurrenceLabel = formatTaskRecurrence(task);
    const tagsHtml = buildTaskTags(task);
    const categoryBadge = task?.category ? `<span class="inline-flex items-center px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600">${safeText(task.category)}</span>` : '';
    const dueDate = formatTaskDate(task?.due_date);
    const dueTime = formatTaskTime(task?.due_date);
    const isOverdue = isTaskOverdue(task);
    const assigned = task?.assigned_to ? safeText(task.assigned_to) : 'Не призначено';
    const author = task?.author || task?.created_by ? safeText(task.author || task.created_by) : '';
    const createdAt = formatTaskDateTime(task?.created_at);
    const metaBadges = [
        relationBadge,
        expectedResult ? `<span class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-emerald-50 text-emerald-600"><i class="fas fa-flag-checkered"></i>${expectedResult}</span>` : '',
        recurrenceLabel ? `<span class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-indigo-50 text-indigo-600"><i class="fas fa-arrows-rotate"></i>${safeText(recurrenceLabel)}</span>` : ''
    ].filter(Boolean).join('');

    return `
        <tr class="task-row border-b border-gray-100 hover:bg-blue-50/40" data-task-id="${taskId}" onclick="handleTaskRowClick(event, '${taskId}')">
            <td class="p-3 align-top">
                <input type="checkbox" class="task-bulk-checkbox rounded border-gray-300" value="${taskId}" onclick="event.stopPropagation();">
            </td>
            <td class="p-3 align-top">
                <div class="flex flex-col gap-2">
                    <div class="flex flex-wrap items-center gap-2">
                        <p class="font-semibold text-gray-800">${title}</p>
                        ${categoryBadge}
                    </div>
                    <p class="text-sm text-gray-600">${description}</p>
                    ${metaBadges ? `<div class="flex flex-wrap gap-2 text-xs text-gray-500">${metaBadges}</div>` : ''}
                    ${tagsHtml}
                </div>
            </td>
            <td class="p-3 align-top">
                <span class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">${safeText(task?.type || '—')}</span>
            </td>
            <td class="p-3 align-top">
                <span class="px-2 py-1 text-xs rounded-full ${getPriorityClass(task?.priority)}">${safeText(task?.priority || '—')}</span>
            </td>
            <td class="p-3 align-top">
                <span class="px-2 py-1 text-xs rounded-full ${getTaskStatusClass(task?.status)}">${safeText(task?.status || '—')}</span>
            </td>
            <td class="p-3 align-top ${isOverdue ? 'text-rose-600 font-medium' : 'text-gray-600'}">
                ${safeText(dueDate)}
                ${dueTime ? `<div class="text-xs ${isOverdue ? 'text-rose-500' : 'text-gray-400'}">${safeText(dueTime)}</div>` : ''}
            </td>
            <td class="p-3 align-top text-gray-600">
                <div class="flex flex-col gap-1">
                    <span>${assigned}</span>
                    ${author ? `<span class="text-xs text-gray-400">Автор: ${author}</span>` : ''}
                </div>
            </td>
            <td class="p-3 align-top text-gray-600">
                ${safeText(createdAt)}
            </td>
            <td class="p-3 align-top">
                <div class="flex items-center space-x-2 text-gray-500">
                    <button onclick="event.stopPropagation(); completeTask('${taskId}');" class="p-2 text-green-600 hover:bg-green-50 rounded" title="Позначити виконаним">
                        <i class="fas fa-check"></i>
                    </button>
                    <button onclick="event.stopPropagation(); editTask('${taskId}');" class="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Редагувати">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="event.stopPropagation(); deleteTask('${taskId}');" class="p-2 text-red-600 hover:bg-red-50 rounded" title="Видалити">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

function buildTaskRelationBadge(task, relatedDataset = null) {
    const relationInfo = resolveRelatedRecordDisplay(task?.related_to, relatedDataset);
    if (relationInfo) {
        return `<span class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-600"><i class="fas fa-link"></i>${safeText(relationInfo.typeLabel)}: ${safeText(relationInfo.label)}</span>`;
    }
    if (task?.contact_name) {
        return `<span class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-600"><i class="fas fa-user"></i>${safeText(task.contact_name)}</span>`;
    }
    if (task?.company_name) {
        return `<span class="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-600"><i class="fas fa-building"></i>${safeText(task.company_name)}</span>`;
    }
    return '';
}

function buildTaskTags(task) {
    const tags = Array.isArray(task?.tags) ? task.tags : [];
    if (!tags.length) {
        return '';
    }
    const items = tags.map(tag => `<span class="inline-flex items-center px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600">${safeText(String(tag))}</span>`).join('');
    return `<div class="flex flex-wrap gap-2 text-xs">${items}</div>`;
}

function truncateText(value, maxLength = 120) {
    if (typeof value !== 'string') {
        return '';
    }
    const trimmed = value.trim();
    if (trimmed.length <= maxLength) {
        return trimmed;
    }
    return `${trimmed.slice(0, maxLength)}…`;
}

function formatTaskRecurrence(task) {
    const raw = task?.recurrence || task?.repeat || task?.repeat_type || task?.frequency;
    if (!raw) {
        return '';
    }
    const normalized = String(raw).toLowerCase();
    const map = {
        'one-time': 'Одноразове',
        'once': 'Одноразове',
        'daily': 'Щоденне',
        'weekly': 'Щотижневе',
        'biweekly': 'Раз на два тижні',
        'monthly': 'Щомісячне',
        'quarterly': 'Щоквартальне',
        'yearly': 'Щорічне',
        'annual': 'Щорічне'
    };
    if (map[normalized]) {
        return map[normalized];
    }
    return String(raw);
}

function formatTaskDateTime(value, options = {}) {
    const { withTime = true } = options;
    if (!value) {
        return '—';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '—';
    }
    const showTime = withTime && typeof value === 'string' && value.includes('T');
    const formatter = new Intl.DateTimeFormat(undefined, showTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' });
    return formatter.format(date);
}

function formatTaskDate(value) {
    if (!value) {
        return 'Не вказано';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Не вказано';
    }
    return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

function formatTaskTime(value) {
    if (!value || (typeof value === 'string' && !value.includes('T'))) {
        return '';
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }
    return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(date);
}

function isTaskCompleted(task) {
    const status = String(task?.status || '').toLowerCase();
    return status === 'completed' || status === 'done';
}

function isTaskCancelled(task) {
    const status = String(task?.status || '').toLowerCase();
    return status === 'cancelled' || status === 'canceled';
}

function isTaskOverdue(task) {
    if (!task || !task.due_date || isTaskCompleted(task) || isTaskCancelled(task)) {
        return false;
    }
    const due = new Date(task.due_date);
    if (Number.isNaN(due.getTime())) {
        return false;
    }
    const now = new Date();
    return due.getTime() < now.getTime();
}

function applyTaskQuickFilter(tasks = []) {
    if (!Array.isArray(tasks)) {
        return [];
    }
    const activeFilter = taskUIState.quickFilter;
    switch (activeFilter) {
        case 'active':
            return tasks.filter(task => !isTaskCompleted(task) && !isTaskCancelled(task));
        case 'completed':
            return tasks.filter(task => isTaskCompleted(task));
        case 'overdue':
            return tasks.filter(task => isTaskOverdue(task));
        case 'highPriority':
            return tasks.filter(task => {
                const priority = String(task?.priority || '').toLowerCase();
                return priority === 'high' || priority === 'critical';
            });
        default:
            return tasks;
    }
}

function setTaskQuickFilter(filter) {
    const nextFilter = filter === taskUIState.quickFilter ? null : filter;
    taskUIState.quickFilter = nextFilter;
    if (taskUIState.allTasks.length) {
        displayTasks(taskUIState.allTasks.slice(), taskUIState.relatedDataset);
    } else {
        updateQuickFilterChips();
    }
}

function updateQuickFilterChips() {
    const chips = document.querySelectorAll('.task-quick-filter');
    chips.forEach(chip => {
        const span = chip.querySelector('span');
        if (!span) {
            return;
        }
        const isActive = chip.getAttribute('data-task-filter') === taskUIState.quickFilter;
        span.classList.toggle('ring-2', isActive);
        span.classList.toggle('ring-offset-1', isActive);
        span.classList.toggle('ring-blue-400', isActive);
        span.classList.toggle('shadow-sm', isActive);
    });
}

function setupTaskQuickFilters() {
    const chips = document.querySelectorAll('.task-quick-filter');
    chips.forEach(chip => {
        chip.addEventListener('click', event => {
            event.preventDefault();
            const filter = chip.getAttribute('data-task-filter');
            setTaskQuickFilter(filter);
        });
    });
    const reset = document.getElementById('resetTaskQuickFilters');
    reset?.addEventListener('click', event => {
        event.preventDefault();
        setTaskQuickFilter(null);
    });
}

function setupTaskViewControls() {
    const switcher = document.getElementById('taskViewSwitcher');
    if (switcher) {
        switcher.addEventListener('click', event => {
            const button = event.target.closest('button[data-view]');
            if (!button) {
                return;
            }
            event.preventDefault();
            setTaskView(button.getAttribute('data-view'));
        });
    }

    const periodContainer = document.getElementById('taskSchedulePeriod');
    if (periodContainer) {
        periodContainer.addEventListener('click', event => {
            const button = event.target.closest('button[data-period]');
            if (!button) {
                return;
            }
            event.preventDefault();
            setTaskSchedulePeriod(button.getAttribute('data-period'));
        });
    }

    setTaskView(taskUIState.currentView || 'list');
    setTaskSchedulePeriod(taskUIState.currentSchedulePeriod || 'week');
}

function setTaskView(view) {
    const resolved = view || 'list';
    taskUIState.currentView = resolved;

    const containers = {
        list: document.getElementById('taskListContainer'),
        kanban: document.getElementById('taskKanbanContainer'),
        calendar: document.getElementById('taskCalendarContainer')
    };

    Object.entries(containers).forEach(([key, element]) => {
        if (element) {
            element.classList.toggle('hidden', key !== resolved);
        }
    });

    const buttons = document.querySelectorAll('#taskViewSwitcher .task-view-button');
    buttons.forEach(button => {
        const isActive = button.getAttribute('data-view') === resolved;
        button.classList.toggle('bg-white', isActive);
        button.classList.toggle('shadow', isActive);
        button.classList.toggle('text-gray-600', !isActive);
    });

    highlightSelectedTask();
}

function setTaskSchedulePeriod(period) {
    const resolved = period || 'week';
    taskUIState.currentSchedulePeriod = resolved;

    const buttons = document.querySelectorAll('#taskSchedulePeriod .task-period-button');
    buttons.forEach(button => {
        const isActive = button.getAttribute('data-period') === resolved;
        button.classList.toggle('bg-white', isActive);
        button.classList.toggle('shadow', isActive);
        button.classList.toggle('text-gray-600', !isActive);
    });

    renderTaskSchedule(taskUIState.dataset);
}

function renderTaskSchedule(tasks = []) {
    const container = document.getElementById('taskCalendarContent');
    if (!container) {
        return;
    }

    const period = taskUIState.currentSchedulePeriod || 'week';
    const groups = new Map();
    const noDue = [];
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    tasks.forEach(task => {
        const date = task?.due_date ? new Date(task.due_date) : null;
        if (!date || Number.isNaN(date.getTime())) {
            noDue.push(task);
            return;
        }

        const diffDays = (date.getTime() - startOfDay.getTime()) / (1000 * 60 * 60 * 24);
        if (period === 'day' && (diffDays < 0 || diffDays >= 1)) {
            return;
        }
        if (period === 'week' && diffDays >= 7) {
            return;
        }
        if (period === 'month' && diffDays >= 31) {
            return;
        }

        const key = date.toISOString().split('T')[0];
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key).push(task);
    });

    const sortedKeys = Array.from(groups.keys()).sort((a, b) => a.localeCompare(b));
    if (noDue.length) {
        sortedKeys.push('no-date');
        groups.set('no-date', noDue);
    }

    if (!sortedKeys.length) {
        container.innerHTML = `
            <div class="border border-dashed border-gray-200 rounded-xl p-6 text-center text-gray-500">
                <i class="fas fa-calendar-days text-3xl mb-3"></i>
                <p>Немає завдань у вибраному періоді.</p>
            </div>
        `;
        highlightSelectedTask();
        return;
    }

    const sections = sortedKeys.map(key => {
        const items = groups.get(key) || [];
        const label = key === 'no-date'
            ? 'Без терміну'
            : formatTaskDate(key);
        const formattedDate = key === 'no-date' ? '' : new Date(key);
        const weekDay = key === 'no-date' ? '' : new Intl.DateTimeFormat(undefined, { weekday: 'long' }).format(formattedDate);

        const list = items.map(task => {
            const taskId = sanitizeText(task?.id || '');
            const overdue = isTaskOverdue(task);
            const statusBadge = `<span class="px-2 py-0.5 text-xs rounded-full ${getTaskStatusClass(task?.status)}">${safeText(task?.status || '—')}</span>`;
            return `
                <article class="border border-gray-200 rounded-lg bg-white p-4 cursor-pointer hover:border-blue-300" data-task-schedule-card="${taskId}" onclick="selectTask('${taskId}')">
                    <div class="flex items-start justify-between gap-3">
                        <div>
                            <h5 class="text-sm font-semibold text-gray-800">${safeText(task?.title || 'Без назви')}</h5>
                            <p class="text-xs text-gray-500 mt-1">${task?.description ? safeText(truncateText(String(task.description), 120)) : 'Без опису'}</p>
                            <div class="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                                ${task?.assigned_to ? `<span class="inline-flex items-center gap-1"><i class="fas fa-user"></i>${safeText(task.assigned_to)}</span>` : ''}
                                ${task?.priority ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${getPriorityClass(task.priority)} bg-opacity-20">${safeText(task.priority)}</span>` : ''}
                            </div>
                        </div>
                        <div class="flex flex-col items-end gap-2 text-xs ${overdue ? 'text-rose-600' : 'text-gray-400'}">
                            ${task?.due_date && task?.due_date.includes('T') ? safeText(formatTaskTime(task.due_date)) : ''}
                            ${statusBadge}
                        </div>
                    </div>
                </article>
            `;
        }).join('');

        return `
            <section class="border border-gray-200 rounded-xl bg-gray-50 p-5">
                <header class="flex items-center justify-between gap-3">
                    <div>
                        <h4 class="text-sm font-semibold text-gray-800">${safeText(label)}</h4>
                        ${weekDay ? `<p class="text-xs text-gray-500 capitalize">${safeText(weekDay)}</p>` : ''}
                    </div>
                    <span class="text-xs text-gray-400">${items.length} шт.</span>
                </header>
                <div class="mt-4 space-y-3">
                    ${list}
                </div>
            </section>
        `;
    }).join('');

    container.innerHTML = sections;
    highlightSelectedTask();
}

function renderTaskKanban(tasks = [], relatedDataset = null) {
    const container = document.getElementById('taskKanbanColumns');
    if (!container) {
        return;
    }

    const statusEntries = getDictionaryEntries('tasks', 'statuses', ['Not Started', 'In Progress', 'Completed', 'Cancelled']);
    const statusMap = new Map(statusEntries.map(entry => [entry.value, { label: entry.label, tasks: [] }]));
    const otherTasks = [];

    tasks.forEach(task => {
        const key = task?.status && statusMap.has(task.status) ? task.status : null;
        if (key) {
            statusMap.get(key).tasks.push(task);
        } else {
            otherTasks.push(task);
        }
    });

    if (otherTasks.length) {
        statusMap.set('other', {
            label: 'Інше',
            tasks: otherTasks
        });
    }

    if (!tasks.length) {
        container.innerHTML = `
            <div class="col-span-full border border-dashed border-gray-200 rounded-xl p-6 text-center text-gray-500">
                <i class="fas fa-layer-group text-3xl mb-3"></i>
                <p>Додайте завдання, щоб побачити їх у Канбані.</p>
            </div>
        `;
        return;
    }

    const columns = Array.from(statusMap.entries()).map(([status, data]) => {
        const columnTasks = data.tasks || [];
        const cards = columnTasks.length
            ? columnTasks.map(task => renderTaskKanbanCard(task, relatedDataset)).join('')
            : '<p class="text-sm text-gray-400 border border-dashed border-gray-200 rounded-lg p-4 text-center">Немає завдань</p>';
        return `
            <div class="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-4">
                <div class="flex items-center justify-between">
                    <h4 class="text-sm font-semibold text-gray-700">${safeText(data.label || status)}</h4>
                    <span class="text-xs text-gray-500">${columnTasks.length}</span>
                </div>
                <div class="flex-1 space-y-3">
                    ${cards}
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = columns;
    highlightSelectedTask();
}

function renderTaskKanbanCard(task, relatedDataset = null) {
    const taskId = sanitizeText(task?.id || '');
    const selected = taskUIState.selectedTaskId && String(taskUIState.selectedTaskId) === String(task?.id);
    const relationBadge = buildTaskRelationBadge(task, relatedDataset);
    const overdue = isTaskOverdue(task);
    return `
        <article class="border ${selected ? 'border-blue-500 bg-blue-50/50' : 'border-transparent'} rounded-lg bg-white shadow-sm p-4 cursor-pointer hover:border-blue-300" data-task-id="${taskId}" onclick="selectTask('${taskId}')">
            <div class="flex items-start justify-between gap-3">
                <h5 class="text-sm font-semibold text-gray-800">${safeText(task?.title || 'Без назви')}</h5>
                <span class="px-2 py-0.5 text-xs rounded-full ${getPriorityClass(task?.priority)}">${safeText(task?.priority || '—')}</span>
            </div>
            <p class="mt-2 text-xs text-gray-500">${task?.description ? safeText(truncateText(String(task.description), 120)) : 'Без опису'}</p>
            <div class="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                ${relationBadge}
                ${task?.assigned_to ? `<span class="inline-flex items-center gap-1"><i class="fas fa-user"></i>${safeText(task.assigned_to)}</span>` : ''}
                ${task?.due_date ? `<span class="inline-flex items-center gap-1 ${overdue ? 'text-rose-600' : ''}"><i class="fas fa-clock"></i>${safeText(formatTaskDate(task.due_date))}</span>` : ''}
            </div>
        </article>
    `;
}

function updateTaskSummaryCards(visibleTasks = [], totalCount = 0) {
    const container = document.getElementById('taskSummaryCards');
    if (!container) {
        return;
    }

    const allTasks = taskUIState.allTasks || [];
    const total = typeof totalCount === 'number' && totalCount > 0 ? totalCount : allTasks.length;
    const completed = allTasks.filter(isTaskCompleted).length;
    const openTasks = allTasks.filter(task => !isTaskCompleted(task) && !isTaskCancelled(task)).length;
    const overdue = allTasks.filter(isTaskOverdue).length;
    const highPriority = allTasks.filter(task => {
        const priority = String(task?.priority || '').toLowerCase();
        return priority === 'high' || priority === 'critical';
    }).length;

    container.innerHTML = `
        <div class="border border-gray-100 rounded-xl bg-white p-4 shadow-sm flex items-center gap-4">
            <span class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><i class="fas fa-list-check"></i></span>
            <div>
                <p class="text-sm text-gray-500">Усього завдань</p>
                <p class="text-xl font-semibold text-gray-800">${total}</p>
            </div>
        </div>
        <div class="border border-gray-100 rounded-xl bg-white p-4 shadow-sm flex items-center gap-4">
            <span class="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><i class="fas fa-play"></i></span>
            <div>
                <p class="text-sm text-gray-500">Активні</p>
                <p class="text-xl font-semibold text-gray-800">${openTasks}</p>
            </div>
        </div>
        <div class="border border-gray-100 rounded-xl bg-white p-4 shadow-sm flex items-center gap-4">
            <span class="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center"><i class="fas fa-clock"></i></span>
            <div>
                <p class="text-sm text-gray-500">Прострочені</p>
                <p class="text-xl font-semibold text-gray-800">${overdue}</p>
            </div>
        </div>
        <div class="border border-gray-100 rounded-xl bg-white p-4 shadow-sm flex items-center gap-4">
            <span class="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center"><i class="fas fa-fire"></i></span>
            <div>
                <p class="text-sm text-gray-500">Високий пріоритет</p>
                <p class="text-xl font-semibold text-gray-800">${highPriority}</p>
            </div>
        </div>
    `;

    const footnote = document.createElement('div');
    footnote.className = 'col-span-full text-xs text-gray-500 text-right';
    footnote.textContent = `Відфільтровано: ${visibleTasks.length} з ${total} завдань`;
    container.appendChild(footnote);
}

function renderTaskAnalytics(allTasks = [], visibleTasks = []) {
    const container = document.getElementById('taskAnalyticsContainer');
    if (!container) {
        return;
    }

    const total = allTasks.length;
    const completed = allTasks.filter(isTaskCompleted).length;
    const open = allTasks.filter(task => !isTaskCompleted(task) && !isTaskCancelled(task)).length;
    const overdue = allTasks.filter(isTaskOverdue).length;
    const highPriority = allTasks.filter(task => {
        const priority = String(task?.priority || '').toLowerCase();
        return priority === 'high' || priority === 'critical';
    }).length;

    const completedTasks = allTasks.filter(isTaskCompleted);
    const durations = completedTasks.map(task => {
        const created = task?.created_at ? new Date(task.created_at) : null;
        const completedAt = task?.completed_date ? new Date(task.completed_date) : (task?.updated_at ? new Date(task.updated_at) : null);
        if (!created || Number.isNaN(created.getTime()) || !completedAt || Number.isNaN(completedAt.getTime())) {
            return null;
        }
        return Math.max(0, completedAt.getTime() - created.getTime());
    }).filter(Number.isFinite);
    const averageDurationDays = durations.length ? (durations.reduce((sum, value) => sum + value, 0) / durations.length) / (1000 * 60 * 60 * 24) : 0;

    container.innerHTML = `
        ${renderTaskMetricRow('Виконано', completed, total, 'bg-emerald-500')}
        ${renderTaskMetricRow('У роботі', open, total, 'bg-blue-500')}
        ${renderTaskMetricRow('Прострочено', overdue, total, 'bg-rose-500')}
        ${renderTaskMetricRow('Високий пріоритет', highPriority, total, 'bg-orange-500')}
        <p class="text-xs text-gray-500">Середній час виконання: ${averageDurationDays ? `${averageDurationDays.toFixed(1)} дн.` : 'н/д'}</p>
        <p class="text-xs text-gray-400">У фокусі зараз: ${visibleTasks.length} завдань.</p>
    `;
}

function renderTaskMetricRow(label, value, total, accentClass) {
    const ratio = total ? Math.min(100, Math.max(0, (value / total) * 100)) : 0;
    return `
        <div class="space-y-2">
            <div class="flex items-center justify-between text-sm text-gray-600">
                <span>${safeText(label)}</span>
                <span class="font-semibold text-gray-800">${value}</span>
            </div>
            <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div class="h-full ${accentClass}" style="width: ${ratio}%"></div>
            </div>
        </div>
    `;
}

function renderTaskHistorySnapshot(allTasks = []) {
    const container = document.getElementById('taskHistorySnapshot');
    if (!container) {
        return;
    }

    if (!allTasks.length) {
        container.innerHTML = '<p class="text-sm text-gray-500">Поки немає активності по завданнях.</p>';
        return;
    }

    const sorted = allTasks
        .filter(task => task?.updated_at || task?.created_at)
        .sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0))
        .slice(0, 5);

    container.innerHTML = sorted.map(task => {
        const updated = formatTaskDateTime(task?.updated_at || task?.created_at, { withTime: true });
        const statusBadge = `<span class="px-2 py-0.5 text-xs rounded-full ${getTaskStatusClass(task?.status)}">${safeText(task?.status || '—')}</span>`;
        return `
            <div class="flex items-start gap-3">
                <span class="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><i class="fas fa-circle-info"></i></span>
                <div class="flex-1">
                    <p class="text-sm font-semibold text-gray-800">${safeText(task?.title || 'Без назви')}</p>
                    <div class="mt-1 flex items-center gap-3 text-xs text-gray-500">
                        <span>${safeText(updated)}</span>
                        ${statusBadge}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function updateTaskDetailPanel(task, relatedDataset = null) {
    const panel = document.getElementById('taskDetailPanel');
    if (!panel) {
        return;
    }

    if (!task) {
        panel.innerHTML = `
            <div class="text-center text-sm text-gray-500">
                <p><i class="fas fa-info-circle mr-2"></i>Оберіть завдання у списку, щоб побачити деталі.</p>
            </div>
        `;
        return;
    }

    const statusBadge = `<span class="px-2 py-1 text-xs rounded-full ${getTaskStatusClass(task?.status)}">${safeText(task?.status || '—')}</span>`;
    const priorityBadge = `<span class="px-2 py-1 text-xs rounded-full ${getPriorityClass(task?.priority)}">${safeText(task?.priority || '—')}</span>`;
    const typeBadge = task?.type ? `<span class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">${safeText(task.type)}</span>` : '';
    const relationInfo = buildTaskRelationBadge(task, relatedDataset);
    const recurrenceLabel = formatTaskRecurrence(task) || 'Одноразове';
    const expectedResult = task?.expected_result ? safeText(task.expected_result) : 'Не вказано';
    const dueDate = formatTaskDateTime(task?.due_date, { withTime: true });
    const createdAt = formatTaskDateTime(task?.created_at, { withTime: true });
    const updatedAt = formatTaskDateTime(task?.updated_at, { withTime: true });
    const comments = Array.isArray(task?.comments) ? task.comments : [];
    const history = Array.isArray(task?.history) ? task.history : [];

    const commentsHtml = comments.length
        ? comments.map(comment => {
            const author = comment?.author ? safeText(comment.author) : 'Без автора';
            const date = comment?.created_at ? safeText(formatTaskDateTime(comment.created_at, { withTime: true })) : '';
            const text = comment?.text ? safeText(comment.text) : '';
            return `
                <article class="border border-gray-200 rounded-lg p-3">
                    <header class="flex items-center justify-between text-xs text-gray-500">
                        <span>${author}</span>
                        <span>${date}</span>
                    </header>
                    <p class="mt-2 text-sm text-gray-700">${text}</p>
                </article>
            `;
        }).join('')
        : `<div class="text-sm text-gray-500 flex items-center justify-between"><span>Коментарів поки немає.</span><button class="text-blue-600 hover:text-blue-700" onclick="openTaskCommentModal('${sanitizeText(task?.id || '')}')">Додати коментар</button></div>`;

    const historyHtml = history.length
        ? history.map(item => {
            const actor = item?.actor ? safeText(item.actor) : 'Система';
            const action = item?.action ? safeText(item.action) : 'Оновлення';
            const timestamp = item?.timestamp ? safeText(formatTaskDateTime(item.timestamp, { withTime: true })) : '';
            return `<li class="flex items-start gap-3 text-sm text-gray-600"><i class="fas fa-circle text-xs text-gray-400 mt-1"></i><div><p class="font-medium text-gray-700">${actor}</p><p>${action}</p><p class="text-xs text-gray-400 mt-1">${timestamp}</p></div></li>`;
        }).join('')
        : `<li class="text-sm text-gray-500">Оновлень поки не зафіксовано.</li>`;

    panel.innerHTML = `
        <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
                <h4 class="text-lg font-semibold text-gray-800">${safeText(task?.title || 'Без назви')}</h4>
                <p class="mt-2 text-sm text-gray-600">${task?.description ? safeText(task.description) : 'Без опису'}</p>
            </div>
            <div class="flex flex-wrap items-center gap-2">
                ${typeBadge}
                ${priorityBadge}
                ${statusBadge}
            </div>
        </div>
        <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div class="space-y-2">
                <div><span class="font-medium text-gray-700">Категорія:</span> ${task?.category ? safeText(task.category) : 'Не вказано'}</div>
                <div><span class="font-medium text-gray-700">Очікуваний результат:</span> ${expectedResult}</div>
                <div><span class="font-medium text-gray-700">Термін:</span> ${safeText(dueDate)}</div>
                <div><span class="font-medium text-gray-700">Повторюваність:</span> ${safeText(recurrenceLabel)}</div>
                <div><span class="font-medium text-gray-700">Створено:</span> ${safeText(createdAt)}</div>
                <div><span class="font-medium text-gray-700">Оновлено:</span> ${safeText(updatedAt)}</div>
            </div>
            <div class="space-y-2">
                <div><span class="font-medium text-gray-700">Виконавець:</span> ${task?.assigned_to ? safeText(task.assigned_to) : 'Не призначено'}</div>
                <div><span class="font-medium text-gray-700">Автор:</span> ${task?.author || task?.created_by ? safeText(task.author || task.created_by) : 'Не вказано'}</div>
                <div><span class="font-medium text-gray-700">Співвиконавці:</span> ${Array.isArray(task?.collaborators) && task.collaborators.length ? safeText(task.collaborators.join(', ')) : 'Не вказано'}</div>
                ${relationInfo ? `<div><span class="font-medium text-gray-700">Пов’язаний об’єкт:</span> ${relationInfo}</div>` : ''}
            </div>
        </div>
        <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <section>
                <h5 class="text-sm font-semibold text-gray-700 mb-3">Коментарі</h5>
                <div class="space-y-3">${commentsHtml}</div>
            </section>
            <section>
                <h5 class="text-sm font-semibold text-gray-700 mb-3">Історія змін</h5>
                <ul class="space-y-3">${historyHtml}</ul>
            </section>
        </div>
    `;
}

function selectTask(taskId) {
    if (!taskId) {
        return;
    }
    taskUIState.selectedTaskId = taskId;
    const task = taskUIState.allTasks.find(item => String(item?.id) === String(taskId));
    updateTaskDetailPanel(task || null, taskUIState.relatedDataset);
    highlightSelectedTask();
}

function handleTaskRowClick(event, taskId) {
    if (event.target.closest('button, a, input, label')) {
        return;
    }
    selectTask(taskId);
}

function highlightSelectedTask() {
    const selectedId = taskUIState.selectedTaskId ? String(taskUIState.selectedTaskId) : null;
    document.querySelectorAll('#tasksTableBody .task-row').forEach(row => {
        const rowId = row.getAttribute('data-task-id');
        const isSelected = selectedId && rowId === selectedId;
        row.classList.toggle('bg-blue-50', Boolean(isSelected));
        row.classList.toggle('border-blue-200', Boolean(isSelected));
    });
    document.querySelectorAll('#taskKanbanColumns article').forEach(card => {
        const cardId = card.getAttribute('data-task-id');
        const isSelected = selectedId && cardId === selectedId;
        card.classList.toggle('border-blue-500', Boolean(isSelected));
        card.classList.toggle('bg-blue-50/50', Boolean(isSelected));
        card.classList.toggle('border-transparent', !isSelected);
    });
    document.querySelectorAll('[data-task-schedule-card]').forEach(card => {
        const cardId = card.getAttribute('data-task-schedule-card');
        const isSelected = selectedId && cardId === selectedId;
        card.classList.toggle('border-blue-400', Boolean(isSelected));
        card.classList.toggle('border-gray-200', !isSelected);
    });
}

function setupTaskBulkActions() {
    const bulkContainer = document.getElementById('taskBulkActions');
    bulkContainer?.addEventListener('click', event => {
        const button = event.target.closest('button[data-bulk-action]');
        if (!button) {
            return;
        }
        event.preventDefault();
        handleTaskBulkAction(button.getAttribute('data-bulk-action'));
    });

    const listContainer = document.getElementById('taskListContainer');
    listContainer?.addEventListener('change', event => {
        const target = event.target;
        if (target.id === 'selectAllTasks') {
            const checked = target.checked;
            target.indeterminate = false;
            document.querySelectorAll('.task-bulk-checkbox').forEach(checkbox => {
                checkbox.checked = checked;
            });
        }
        if (target.classList && target.classList.contains('task-bulk-checkbox')) {
            updateTaskSelectAllState();
        }
    });
}

function getSelectedTaskIds() {
    return Array.from(document.querySelectorAll('.task-bulk-checkbox:checked')).map(input => input.value);
}

function handleTaskBulkAction(action) {
    const selectedIds = getSelectedTaskIds();
    if (!selectedIds.length) {
        showToast('Оберіть принаймні одне завдання', 'warning');
        return;
    }

    const selectedTasks = taskUIState.allTasks.filter(task => selectedIds.includes(String(task?.id)));

    switch (action) {
        case 'assign':
            showToast(`Масове призначення ${selectedIds.length} завдань — функція у розробці`, 'info');
            break;
        case 'status':
            showToast(`Масова зміна статусу (${selectedIds.length}) — відкрийте детальну форму, щоб оновити статуси.`, 'info');
            break;
        case 'export':
            exportTasksSelection(selectedTasks);
            break;
        default:
            showToast('Оберіть дію для масового оновлення', 'warning');
    }
}

function exportTasksSelection(tasks) {
    if (!Array.isArray(tasks) || !tasks.length) {
        showToast('Немає вибраних завдань для експорту', 'warning');
        return;
    }

    const data = tasks.map(task => ({
        id: task?.id,
        title: task?.title,
        description: task?.description,
        type: task?.type,
        priority: task?.priority,
        status: task?.status,
        due_date: task?.due_date,
        assigned_to: task?.assigned_to,
        category: task?.category,
        expected_result: task?.expected_result,
        created_at: task?.created_at,
        updated_at: task?.updated_at
    }));

    const csv = convertToCSV(data);
    downloadCSV(csv, 'tasks_export.csv');
    showToast(`Експортовано ${tasks.length} завдань`, 'success');
}

function updateTaskSelectAllState() {
    const selectAll = document.getElementById('selectAllTasks');
    if (!selectAll) {
        return;
    }
    const checkboxes = Array.from(document.querySelectorAll('.task-bulk-checkbox'));
    if (!checkboxes.length) {
        selectAll.checked = false;
        selectAll.indeterminate = false;
        return;
    }
    const checkedCount = checkboxes.filter(checkbox => checkbox.checked).length;
    selectAll.checked = checkedCount === checkboxes.length;
    selectAll.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
}

function openTaskCommentModal(taskId) {
    if (!taskId) {
        return;
    }
    showToast('Форма додавання коментарів буде доступна у наступному релізі.', 'info');
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
    const relationTypeFilter = document.getElementById('taskRelationTypeFilter');
    const relationRecordFilter = document.getElementById('taskRelationRecordFilter');

    let filterTimeout;

    const applyFilters = () => {
        clearTimeout(filterTimeout);
        filterTimeout = setTimeout(() => {
            loadTasks(
                1,
                searchInput?.value ?? '',
                statusFilter?.value ?? '',
                priorityFilter?.value ?? '',
                typeFilter?.value ?? '',
                relationTypeFilter?.value ?? '',
                relationRecordFilter?.value ?? ''
            );
        }, 300);
    };

    searchInput?.addEventListener('input', applyFilters);
    statusFilter?.addEventListener('change', applyFilters);
    priorityFilter?.addEventListener('change', applyFilters);
    typeFilter?.addEventListener('change', applyFilters);
    if (relationTypeFilter) {
        relationTypeFilter.addEventListener('change', async () => {
            await fetchRelatedRecordsForLinking();
            if (relationRecordFilter) {
                relationRecordFilter.disabled = true;
                relationRecordFilter.innerHTML = '<option value="">Усі записи</option>';
                relationRecordFilter.value = '';
            }
            applyFilters();
        });
    }
    relationRecordFilter?.addEventListener('change', applyFilters);
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

            <div class="flex items-center space-x-4 mb-6">
                <select id="activityTypeFilter" class="border border-gray-300 rounded-lg px-3 py-2">
                    <option value="">All types</option>
                    <option value="Call">Call</option>
                    <option value="Email">Email</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Note">Note</option>
                    <option value="Task">Task</option>
                    <option value="Appointment">Appointment</option>
                    <option value="Document">Document</option>
                    <option value="Other">Other</option>
                </select>
                <select id="activityRelationTypeFilter" class="border border-gray-300 rounded-lg px-3 py-2">
                    <option value="">All linked records</option>
                    <option value="unlinked">Unlinked only</option>
                    <option value="deal">Deals</option>
                    <option value="lead">Leads</option>
                    <option value="company">Companies</option>
                    <option value="contact">Contacts</option>
                    <option value="competitor">Competitors</option>
                </select>
                <select id="activityRelationRecordFilter" class="border border-gray-300 rounded-lg px-3 py-2" disabled>
                    <option value="">All records</option>
                </select>
            </div>

            <div class="space-y-4" id="activitiesTimeline">
            </div>
        </div>
    `;

    applyDictionaryToSelect(document.getElementById('activityTypeFilter'), 'activities', 'types', {
        includeBlank: true,
        blankLabel: 'All types',
        blankValue: ''
    });

    await loadActivities();
    setupActivityFilters();
}

async function loadActivities(options = {}) {
    showLoading();
    try {
        const searchInput = document.getElementById('activitySearch');
        const typeSelect = document.getElementById('activityTypeFilter');
        const relationTypeSelect = document.getElementById('activityRelationTypeFilter');
        const relationRecordSelect = document.getElementById('activityRelationRecordFilter');

        const searchValue = options.search !== undefined ? options.search : (searchInput?.value ?? '');
        const typeValue = options.type !== undefined ? options.type : (typeSelect?.value ?? '');
        const relationTypeValue = options.relationType !== undefined ? options.relationType : (relationTypeSelect?.value ?? '');
        const relationRecordValue = options.relationRecord !== undefined ? options.relationRecord : (relationRecordSelect?.value ?? '');

        const params = new URLSearchParams({ limit: '100', sort: 'date' });
        if (searchValue && searchValue.trim()) {
            params.append('search', searchValue.trim());
        }
        if (typeValue) {
            params.append('type', typeValue);
        }

        const response = await fetch(`tables/activities?${params.toString()}`);
        const data = await response.json();
        const relatedDataset = await fetchRelatedRecordsForLinking();
        const relationConfig = getRelatedLinkConfigByType(relationTypeValue);
        const allLabel = relationConfig ? `All ${relationConfig.pluralLabel || `${relationConfig.label}s`}` : 'All records';

        if (relationRecordSelect) {
            updateRelatedRecordSelect(relationRecordSelect, relatedDataset, relationTypeValue, relationRecordValue, {
                includeAllOption: true,
                allLabel,
                placeholderLabel: relationConfig ? `Select ${relationConfig.label.toLowerCase()}` : 'Select related record',
                noTypeLabel: 'All records',
                unlinkedLabel: 'Unlinked only'
            });
        }

        const activities = Array.isArray(data.data) ? data.data : [];
        const filteredActivities = filterItemsByRelation(activities, relationTypeValue, relationRecordValue);

        displayActivitiesTimeline(filteredActivities, relatedDataset);

    } catch (error) {
        console.error('Error loading activities:', error);
        showToast('Не вдалося завантажити активності', 'error');
    } finally {
        hideLoading();
    }
}

function displayActivitiesTimeline(activities, relatedDataset = null) {
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
    
    timeline.innerHTML = activities.map(activity => {
        const relation = resolveRelatedRecordDisplay(activity.related_to, relatedDataset);
        const relationHtml = relation
            ? `<div class="mt-2 text-xs text-blue-600 flex items-center gap-2"><i class="fas fa-link"></i><span>${safeText(relation.typeLabel)}: ${safeText(relation.label)}</span></div>`
            : '';

        return `
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
                ${relationHtml}
            </div>
            <div class="flex items-center space-x-2">
                <button onclick="editActivity('${activity.id}')" class="p-2 text-blue-600 hover:bg-blue-50 rounded">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteActivity('${activity.id}')" class="p-2 text-red-600 hover:bg-red-50 rounded">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>`;
    }).join('');
}

function setupActivityFilters() {
    const searchInput = document.getElementById('activitySearch');
    const typeFilter = document.getElementById('activityTypeFilter');
    const relationTypeFilter = document.getElementById('activityRelationTypeFilter');
    const relationRecordFilter = document.getElementById('activityRelationRecordFilter');

    let filterTimeout;

    const applyFilters = () => {
        clearTimeout(filterTimeout);
        filterTimeout = setTimeout(() => {
            loadActivities({
                search: searchInput?.value ?? '',
                type: typeFilter?.value ?? '',
                relationType: relationTypeFilter?.value ?? '',
                relationRecord: relationRecordFilter?.value ?? ''
            });
        }, 300);
    };

    searchInput?.addEventListener('input', applyFilters);
    typeFilter?.addEventListener('change', applyFilters);
    if (relationTypeFilter) {
        relationTypeFilter.addEventListener('change', async () => {
            await fetchRelatedRecordsForLinking();
            if (relationRecordFilter) {
                relationRecordFilter.disabled = true;
                relationRecordFilter.innerHTML = '<option value="">All records</option>';
                relationRecordFilter.value = '';
            }
            applyFilters();
        });
    }
    relationRecordFilter?.addEventListener('change', applyFilters);
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

const ANALYTICS_KNOWLEDGE_BASE = [
    {
        title: 'Огляд головної панелі CRM',
        description: 'Орієнтири для побудови головного дашборду: ключові метрики, блоки та сценарії контролю бізнесу.',
        href: 'docs/crm-dashboard-overview.md',
        icon: 'fa-gauge-high',
        tag: 'Дашборд',
        tagClass: 'bg-emerald-50 text-emerald-600',
        estimated: '≈12 хв читання'
    },
    {
        title: 'Покрокова інструкція зі створення CRM-системи в Obsidian',
        description: 'Налаштування робочого сховища в Obsidian як CRM: структури папок, шаблони та автоматизації.',
        href: 'docs/obsidian-crm-guide.md',
        icon: 'fa-cube',
        tag: 'Obsidian',
        tagClass: 'bg-violet-50 text-violet-600',
        estimated: '≈20 хв читання'
    },
    {
        title: 'Competitor Intelligence Hub — Масштабована архітектура',
        description: 'Архітектура модульної системи конкурентної розвідки з аналітикою корпоративного рівня.',
        href: 'docs/competitor-intelligence-hub.md',
        icon: 'fa-sitemap',
        tag: 'Модулі',
        tagClass: 'bg-amber-50 text-amber-600',
        estimated: '≈15 хв читання'
    }
];

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

            <section class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h3 class="text-lg font-semibold text-gray-800">Документація та гіди</h3>
                        <p class="text-sm text-gray-500">Добірка матеріалів про впровадження CRM, роботу з даними та побудову дашбордів.</p>
                    </div>
                    <span class="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase rounded-full bg-blue-50 text-blue-600">Оновлено</span>
                </div>
                <div id="analyticsKnowledgeBase" class="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"></div>
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
        renderAnalyticsKnowledgeBase();
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

function renderAnalyticsKnowledgeBase() {
    const container = document.getElementById('analyticsKnowledgeBase');
    if (!container) {
        return;
    }

    const sanitize = value => (typeof sanitizeText === 'function' ? sanitizeText(value) : String(value));

    container.innerHTML = ANALYTICS_KNOWLEDGE_BASE.map(article => {
        const badge = article.tag
            ? `<span class="inline-flex items-center px-3 py-1 text-xs font-semibold uppercase rounded-full ${article.tagClass || 'bg-slate-100 text-slate-600'}">${sanitize(article.tag)}</span>`
            : '';
        const estimate = article.estimated
            ? `<span class="text-xs text-gray-400">${sanitize(article.estimated)}</span>`
            : '';

        return `
            <article class="border border-gray-100 rounded-xl bg-white p-5 shadow-sm hover:border-blue-200 transition-colors">
                <div class="flex items-start justify-between gap-4">
                    <div class="flex items-start gap-4">
                        <span class="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <i class="fas ${article.icon}"></i>
                        </span>
                        <div>
                            <h4 class="text-base font-semibold text-gray-800 leading-snug">${sanitize(article.title)}</h4>
                            <p class="mt-2 text-sm text-gray-500 leading-relaxed">${sanitize(article.description)}</p>
                        </div>
                    </div>
                    ${badge}
                </div>
                <div class="mt-4 flex items-center justify-between text-sm">
                    <a href="${article.href}" target="_blank" rel="noopener" class="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium">
                        <i class="fas fa-arrow-up-right-from-square mr-2"></i>Відкрити гайд
                    </a>
                    ${estimate}
                </div>
            </article>
        `;
    }).join('');
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

    const statusSelectOptions = renderSelectOptions(
        getDictionaryEntries('companies', 'statuses'),
        company.status || 'Active'
    );

    const sizeSelectOptions = renderSelectOptions(
        getDictionaryEntries('companies', 'sizes'),
        company.size || '',
        {
            includeBlank: true,
            blankLabel: 'Select size...'
        }
    );
    const normalizedObsidianPath = company.obsidian_note
        ? String(company.obsidian_note).trim().replace(/^\\+/,'').replace(/^vault\\//i, '')
        : '';
    const obsidianOpenLink = normalizedObsidianPath
        ? `<a href="vault/${encodeURI(normalizedObsidianPath)}" target="_blank" class="inline-flex items-center px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"><i class=\"fas fa-external-link-alt mr-2\"></i>Open</a>`
        : '';

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
                        ${sizeSelectOptions}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select name="status" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        ${statusSelectOptions}
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

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="md:col-span-3">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Obsidian Note Path</label>
                    <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                        <input type="text" name="obsidian_note" value="${company.obsidian_note || ''}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               placeholder="Clients/TechCorp Solutions.md">
                        ${obsidianOpenLink}
                    </div>
                    <p class="mt-1 text-xs text-gray-500">Store the relative path inside your Obsidian vault to jump to notes directly from this workspace.</p>
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

async function showCompetitorForm(competitorId = null) {
    const isEdit = Boolean(competitorId);
    let competitor = {};

    if (isEdit) {
        showLoading();
        try {
            const response = await fetch(`tables/competitors/${competitorId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch competitor');
            }
            competitor = await response.json();
        } catch (error) {
            console.error('Error loading competitor:', error);
            showToast('Не вдалося завантажити конкурента', 'error');
            hideLoading();
            return;
        }
        hideLoading();
    }

    let companies = [];
    try {
        const response = await fetch('tables/companies?limit=1000');
        if (response.ok) {
            const payload = await response.json();
            companies = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
        }
    } catch (error) {
        console.warn('Unable to load companies for competitor form:', error);
    }

    const tierEntries = getDictionaryEntries('competitors', 'tiers', ['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4']);
    const normalizedTierEntries = tierEntries
        .map(entry => normalizeDictionaryEntry(entry))
        .filter(Boolean);
    const defaultTierValue = competitor.tier || (normalizedTierEntries[0]?.value || '');
    const tierSelectOptions = renderSelectOptions(
        tierEntries,
        defaultTierValue
    );

    const statusEntries = getDictionaryEntries('competitors', 'statuses', ['Active', 'Monitoring', 'Dormant', 'Watchlist']);
    const normalizedStatusEntries = statusEntries
        .map(entry => normalizeDictionaryEntry(entry))
        .filter(Boolean);
    const defaultStatusValue = competitor.status || (normalizedStatusEntries[0]?.value || '');
    const statusSelectOptions = renderSelectOptions(
        statusEntries,
        defaultStatusValue
    );

    const selectedCompanyIds = new Set(
        Array.isArray(competitor.linked_company_ids)
            ? competitor.linked_company_ids.map(id => String(id))
            : Array.isArray(competitor.related_company_ids)
                ? competitor.related_company_ids.map(id => String(id))
                : []
    );

    const manualLinkedClients = Array.isArray(competitor.linked_clients)
        ? competitor.linked_clients.join(', ')
        : (typeof competitor.linked_clients === 'string' ? competitor.linked_clients : '');

    const companyOptionsHtml = companies.map(company => {
        const id = sanitizeText(String(company.id || ''));
        const label = sanitizeText(company.name || company.id || 'Компанія');
        const selected = selectedCompanyIds.has(String(company.id)) ? 'selected' : '';
        return `<option value="${id}" ${selected}>${label}</option>`;
    }).join('');

    const primaryMarketsValue = Array.isArray(competitor.primary_markets)
        ? competitor.primary_markets.join(', ')
        : (competitor.primary_markets || '');

    const focusAreasValue = Array.isArray(competitor.focus_areas)
        ? competitor.focus_areas.join(', ')
        : (competitor.focus_areas || '');

    const lastUpdateValue = competitor.last_update
        ? new Date(competitor.last_update).toISOString().split('T')[0]
        : '';

    const noteButton = competitor.note_file
        ? `<button type="button" data-open-obsidian-note="${encodeURIComponent(competitor.note_file)}"
                class="inline-flex items-center px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200">
                <i class="fas fa-external-link-alt mr-2"></i>Відкрити нотатку
            </button>`
        : '';

    showModal(isEdit ? 'Редагувати конкурента' : 'Додати конкурента', `
        <form id="competitorForm" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Назва конкурента *</label>
                    <input type="text" name="name" value="${competitor.name || ''}" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           placeholder="InsightSphere">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Індустрія</label>
                    <input type="text" name="industry" value="${competitor.industry || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           placeholder="Analytics Platform">
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Штаб-квартира</label>
                    <input type="text" name="headquarters" value="${competitor.headquarters || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           placeholder="Berlin, Germany">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Відповідальний аналітик</label>
                    <input type="text" name="intel_owner" value="${competitor.intel_owner || currentUser || ''}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           placeholder="Competitive Research Guild">
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Tier</label>
                    <select name="tier" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        ${tierSelectOptions}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Статус</label>
                    <select name="status" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        ${statusSelectOptions}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Дата останнього оновлення</label>
                    <input type="date" name="last_update" value="${lastUpdateValue}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Останній зафіксований рух</label>
                <textarea name="latest_move" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Короткий опис конкурентної дії">${competitor.latest_move || ''}</textarea>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Основні ринки</label>
                    <textarea name="primary_markets" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="EU SaaS, Enterprise BI">${primaryMarketsValue}</textarea>
                    <p class="mt-1 text-xs text-gray-500">Використовуйте кому або новий рядок для розділення значень.</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Фокусні напрями</label>
                    <textarea name="focus_areas" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Predictive benchmarking, Revenue intelligence">${focusAreasValue}</textarea>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Клієнти під моніторингом</label>
                <select id="competitorLinkedCompanies" name="linked_company_ids" multiple size="6"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    ${companyOptionsHtml}
                </select>
                <p class="mt-1 text-xs text-gray-500">Утримуйте Ctrl / Cmd, щоб обрати кілька компаній. Імена буде додано у батлкарту автоматично.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Додаткові клієнти (комою)</label>
                    <input type="text" name="linked_clients_manual" value="${manualLinkedClients}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                           placeholder="TechCorp Solutions, StartupXYZ">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Obsidian файл</label>
                    <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                        <input type="text" name="note_file" value="${competitor.note_file || ''}"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               placeholder="Competitors/InsightSphere.md">
                        ${noteButton}
                    </div>
                    <p class="mt-1 text-xs text-gray-500">Збережіть шлях до файлу в Obsidian vault, щоб відкривати нотатку безпосередньо з CRM.</p>
                </div>
            </div>

            <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button type="button" onclick="closeModal()" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">Скасувати</button>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">${isEdit ? 'Оновити конкурента' : 'Створити конкурента'}</button>
            </div>
        </form>
    `);

    const formElement = document.getElementById('competitorForm');
    if (!formElement) {
        return;
    }

    const noteTrigger = formElement.querySelector('[data-open-obsidian-note]');
    if (noteTrigger) {
        noteTrigger.addEventListener('click', () => {
            const encoded = noteTrigger.getAttribute('data-open-obsidian-note');
            const decoded = encoded ? decodeURIComponent(encoded) : '';
            openObsidianNote(decoded);
        });
    }

    formElement.addEventListener('submit', async event => {
        event.preventDefault();
        await saveCompetitor(competitorId, new FormData(formElement), { formElement, companies });
    });
}

async function saveCompetitor(competitorId, formData, options = {}) {
    const { formElement = null, companies = [] } = options;
    const parseListInput = value => {
        if (!value) {
            return [];
        }
        return String(value)
            .split(/[\n;,]+/)
            .map(item => item.trim())
            .filter(Boolean);
    };

    const payload = {};
    const textFields = ['name', 'industry', 'status', 'tier', 'intel_owner', 'headquarters', 'latest_move', 'note_file'];
    textFields.forEach(field => {
        const value = formData.get(field);
        if (value && String(value).trim()) {
            payload[field] = String(value).trim();
        }
    });

    if (!payload.name) {
        showToast('Назва конкурента є обов’язковою', 'error');
        return;
    }

    const lastUpdate = formData.get('last_update');
    if (lastUpdate) {
        payload.last_update = String(lastUpdate);
    }

    const primaryMarkets = parseListInput(formData.get('primary_markets'));
    if (primaryMarkets.length) {
        payload.primary_markets = primaryMarkets;
    }

    const focusAreas = parseListInput(formData.get('focus_areas'));
    if (focusAreas.length) {
        payload.focus_areas = focusAreas;
    }

    const selectedCompanyIds = formData.getAll('linked_company_ids').map(id => String(id).trim()).filter(Boolean);
    if (selectedCompanyIds.length) {
        payload.linked_company_ids = Array.from(new Set(selectedCompanyIds));
    }

    const manualClients = parseListInput(formData.get('linked_clients_manual'));
    const selectedCompanyNames = [];
    if (formElement) {
        const companySelect = formElement.querySelector('#competitorLinkedCompanies');
        if (companySelect) {
            Array.from(companySelect.selectedOptions || []).forEach(option => {
                if (option && option.textContent) {
                    selectedCompanyNames.push(option.textContent.trim());
                }
            });
        }
    } else if (selectedCompanyIds.length && companies.length) {
        const lookup = new Map(companies.map(company => [String(company.id), company.name]));
        selectedCompanyIds.forEach(id => {
            const name = lookup.get(id);
            if (name) {
                selectedCompanyNames.push(name);
            }
        });
    }

    const linkedClients = Array.from(new Set([...selectedCompanyNames, ...manualClients].filter(Boolean)));
    if (linkedClients.length) {
        payload.linked_clients = linkedClients;
    }

    const nowIso = new Date().toISOString();
    payload.updated_at = nowIso;
    if (!competitorId) {
        payload.created_at = nowIso;
        payload.created_by = currentUser;
    }

    showLoading();
    try {
        const method = competitorId ? 'PUT' : 'POST';
        const url = competitorId ? `tables/competitors/${competitorId}` : 'tables/competitors';
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error('Save failed');
        }

        showToast(competitorId ? 'Конкурента оновлено' : 'Конкурента створено', 'success');
        closeModal();
        await fetchRelatedRecordsForLinking({ refresh: true });
        await showCompetitorIntel();
    } catch (error) {
        console.error('Error saving competitor:', error);
        showToast('Не вдалося зберегти конкурента', 'error');
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

        const parseList = payload => {
            if (Array.isArray(payload?.data)) {
                return payload.data;
            }
            if (Array.isArray(payload)) {
                return payload;
            }
            return [];
        };

        const [contactsPayload, leadsPayload, dealsPayload, competitorsPayload, tasksPayload, activitiesPayload] = await Promise.all([
            fetch(`tables/contacts?company_id=${encodeURIComponent(company.id)}&limit=1000`).then(res => res.json()).catch(() => ({ data: [] })),
            fetch(`tables/leads?company_id=${encodeURIComponent(company.id)}&limit=1000`).then(res => res.json()).catch(() => ({ data: [] })),
            fetch(`tables/opportunities?company_id=${encodeURIComponent(company.id)}&limit=1000`).then(res => res.json()).catch(() => ({ data: [] })),
            fetch('tables/competitors?limit=1000').then(res => res.json()).catch(() => ({ data: [] })),
            fetch('tables/tasks?limit=1000').then(res => res.json()).catch(() => ({ data: [] })),
            fetch('tables/activities?limit=1000').then(res => res.json()).catch(() => ({ data: [] }))
        ]);

        const contacts = parseList(contactsPayload);
        const leads = parseList(leadsPayload);
        const deals = parseList(dealsPayload);
        const allCompetitors = parseList(competitorsPayload);
        const tasks = parseList(tasksPayload);
        const activities = parseList(activitiesPayload);

        const companyLookup = new Map();
        if (typeof entityDirectories === 'object' && entityDirectories?.companies?.list) {
            entityDirectories.companies.list.forEach(item => {
                if (item?.id) {
                    companyLookup.set(item.id, item);
                }
            });
        }
        if (company?.id) {
            companyLookup.set(company.id, company);
        }

        const relevantCompetitors = allCompetitors.filter(comp => competitorTargetsCompany(comp, company, companyLookup));

        const contactsById = new Map();
        contacts.forEach(contact => {
            if (contact?.id) {
                contactsById.set(contact.id, contact);
            }
        });

        const leadsById = new Map();
        leads.forEach(lead => {
            if (lead?.id) {
                leadsById.set(lead.id, lead);
            }
        });

        const dealsById = new Map();
        deals.forEach(deal => {
            if (deal?.id) {
                dealsById.set(deal.id, deal);
            }
        });

        const relationContext = { contactsById, leadsById, dealsById };

        const relevantTasks = tasks.filter(task => {
            if (matchesCompanyByRelation(task?.related_to, company, relationContext)) {
                return true;
            }
            if (task?.company_id && String(task.company_id) === company.id) {
                return true;
            }
            return false;
        });

        const relevantActivities = activities.filter(activity => {
            if (matchesCompanyByRelation(activity?.related_to, company, relationContext)) {
                return true;
            }
            if (activity?.company_id && String(activity.company_id) === company.id) {
                return true;
            }
            return false;
        });

        const relatedDatasetForCompany = {
            opportunities: deals,
            leads,
            companies: [company],
            contacts,
            competitors: relevantCompetitors
        };

        const formatDateOnly = value => {
            if (!value) {
                return '';
            }
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) {
                return '';
            }
            return date.toLocaleDateString();
        };

        const safeCompanyName = sanitizeText(company.name || 'Unnamed Company');
        const statusBadge = `<span class="px-2 py-1 rounded-full ${getStatusClass(company.status)}">${sanitizeText(company.status || 'Active')}</span>`;
        const ownerText = company.owner ? `<span><i class="fas fa-user mr-1 text-gray-400"></i>${sanitizeText(company.owner)}</span>` : '';
        const industryText = company.industry ? `<span><i class="fas fa-industry mr-1 text-gray-400"></i>${sanitizeText(company.industry)}</span>` : '';

        const metrics = [
            { label: 'Contacts', value: contacts.length, icon: 'fa-address-book' },
            { label: 'Leads', value: leads.length, icon: 'fa-bullseye' },
            { label: 'Deals', value: deals.length, icon: 'fa-briefcase' },
            { label: 'Competitors Tracked', value: relevantCompetitors.length, icon: 'fa-chess-knight' }
        ];
        const metricCards = metrics.map(metric => `
            <div class="p-4 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                <div>
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">${metric.label}</p>
                    <p class="mt-2 text-2xl font-semibold text-gray-800">${metric.value}</p>
                </div>
                <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <i class="fas ${metric.icon}"></i>
                </div>
            </div>
        `).join('');
        const metricsHtml = `<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">${metricCards}</div>`;

        const websiteValue = company.website
            ? `<a href="${encodeURI(company.website)}" target="_blank" rel="noopener" class="text-blue-600 hover:text-blue-700">${sanitizeText(company.website)}</a>`
            : '—';
        const emailValue = company.email
            ? `<a href="mailto:${encodeURIComponent(company.email)}" class="text-blue-600 hover:text-blue-700">${sanitizeText(company.email)}</a>`
            : '—';

        const obsidianRaw = company.obsidian_note ? String(company.obsidian_note).trim() : '';
        const obsidianNormalized = obsidianRaw ? obsidianRaw.replace(/^\/+/, '').replace(/^vault\//i, '') : '';
        const obsidianHref = obsidianNormalized ? `vault/${encodeURI(obsidianNormalized)}` : '';
        const obsidianValue = obsidianHref
            ? `<a href="${obsidianHref}" target="_blank" class="text-blue-600 hover:text-blue-700"><i class="fas fa-book mr-1"></i>${sanitizeText(obsidianRaw)}</a>`
            : '—';

        const details = [
            { label: 'Industry', value: sanitizeText(company.industry || '—') },
            { label: 'Size', value: sanitizeText(company.size || '—') },
            { label: 'Status', value: statusBadge },
            { label: 'Phone', value: company.phone ? sanitizeText(company.phone) : '—' },
            { label: 'Email', value: emailValue },
            { label: 'Website', value: websiteValue },
            { label: 'Obsidian Note', value: obsidianValue },
            { label: 'City', value: sanitizeText(company.city || '—') },
            { label: 'State / Region', value: sanitizeText(company.state || '—') },
            { label: 'Country', value: sanitizeText(company.country || '—') },
            { label: 'Annual Revenue', value: formatCurrency(company.annual_revenue) },
            { label: 'Owner', value: sanitizeText(company.owner || '—') },
            { label: 'Created At', value: formatDate(company.created_at) },
            { label: 'Last Updated', value: formatDate(company.updated_at) }
        ];

        const detailCards = details.map(detail => `
            <div class="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">${detail.label}</p>
                <p class="mt-2 text-sm text-gray-800">${detail.value}</p>
            </div>
        `).join('');

        const taskCards = relevantTasks.map(task => {
            const statusBadge = task.status ? `<span class="px-2 py-1 rounded-full text-xs ${getTaskStatusClass(task.status)}">${sanitizeText(task.status)}</span>` : '';
            const priorityBadge = task.priority ? `<span class="px-2 py-1 rounded-full text-xs ${getPriorityClass(task.priority)}">${sanitizeText(task.priority)}</span>` : '';
            const dueBadge = task.due_date ? `<span class="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">Due ${formatDateOnly(task.due_date)}</span>` : '';
            const relationInfo = resolveRelatedRecordDisplay(task.related_to, relatedDatasetForCompany);
            const relationBadge = relationInfo ? `<span class="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-xs"><i class="fas fa-link mr-1"></i>${sanitizeText(relationInfo.typeLabel)}: ${sanitizeText(relationInfo.label)}</span>` : '';
            const assignedBadge = task.assigned_to ? `<span class="flex items-center gap-1 text-xs text-gray-500"><i class="fas fa-user"></i>${sanitizeText(task.assigned_to)}</span>` : '';
            const description = task.description ? sanitizeText(task.description.length > 80 ? `${task.description.slice(0, 80)}...` : task.description) : '';
            const updatedLabel = task.updated_at ? `Updated ${formatDateOnly(task.updated_at)}` : '';

            return `
                <div class="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <p class="text-base font-semibold text-gray-800">${sanitizeText(task.title || 'Task')}</p>
                            <div class="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                                ${statusBadge}
                                ${priorityBadge}
                                ${dueBadge}
                            </div>
                            ${description ? `<p class="mt-3 text-sm text-gray-600">${description}</p>` : ''}
                            <div class="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                                ${assignedBadge}
                                ${relationBadge}
                            </div>
                        </div>
                        <div class="text-right text-xs text-gray-400">
                            ${updatedLabel}
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const tasksSectionHtml = `
            <div class="space-y-4">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h4 class="text-lg font-semibold text-gray-800">Tasks</h4>
                        <p class="text-sm text-gray-500">Follow-up work connected to ${safeCompanyName}</p>
                    </div>
                    <button type="button" class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" data-company-action="add-task" data-related-type="company" data-related-id="${company.id}">
                        <i class="fas fa-list-check mr-2"></i>New Task
                    </button>
                </div>
                ${relevantTasks.length ? `<div class="space-y-3">${taskCards}</div>` : `<div class="border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-500"><p>No tasks linked to this company.</p><button type="button" class="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" data-company-action="add-task" data-related-type="company" data-related-id="${company.id}"><i class="fas fa-plus mr-2"></i>Create task</button></div>`}
            </div>
        `;

        const activityCards = relevantActivities.map(activity => {
            const relationInfo = resolveRelatedRecordDisplay(activity.related_to, relatedDatasetForCompany);
            const relationBadge = relationInfo ? `<span class="inline-flex items-center px-2 py-1 rounded-full bg-blue-50 text-blue-600 text-xs"><i class="fas fa-link mr-1"></i>${sanitizeText(relationInfo.typeLabel)}: ${sanitizeText(relationInfo.label)}</span>` : '';
            const outcomeBadge = activity.outcome ? `<span class="px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs">${sanitizeText(activity.outcome)}</span>` : '';
            const durationBadge = activity.duration ? `<span class="flex items-center gap-1 text-xs text-gray-500"><i class="fas fa-clock"></i>${activity.duration} min</span>` : '';
            const assignedBadge = activity.assigned_to ? `<span class="flex items-center gap-1 text-xs text-gray-500"><i class="fas fa-user"></i>${sanitizeText(activity.assigned_to)}</span>` : '';
            const eventDate = activity.date ? new Date(activity.date) : null;
            const dateLabel = eventDate ? `${eventDate.toLocaleDateString()} ${eventDate.toLocaleTimeString()}` : '';
            return `
                <div class="flex items-start space-x-4 p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
                    <div class="w-10 h-10 rounded-full flex items-center justify-center ${getActivityTypeColor(activity.type)}">
                        <i class="fas fa-${getActivityIcon(activity.type)} text-white"></i>
                    </div>
                    <div class="flex-1 space-y-2">
                        <div class="flex items-center justify-between">
                            <p class="font-medium text-gray-800">${sanitizeText(activity.subject || 'Activity')}</p>
                            <span class="text-xs text-gray-500">${dateLabel}</span>
                        </div>
                        <p class="text-sm text-gray-600">${sanitizeText(activity.description || 'No description')}</p>
                        <div class="flex flex-wrap gap-2 text-xs text-gray-500">
                            ${assignedBadge}
                            ${durationBadge}
                            ${outcomeBadge}
                        </div>
                        ${relationBadge}
                    </div>
                </div>
            `;
        }).join('');

        const activitiesSectionHtml = `
            <div class="space-y-4">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h4 class="text-lg font-semibold text-gray-800">Activities</h4>
                        <p class="text-sm text-gray-500">Latest interactions logged for ${safeCompanyName}</p>
                    </div>
                    <button type="button" class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" data-company-action="add-activity" data-related-type="company" data-related-id="${company.id}">
                        <i class="fas fa-plus mr-2"></i>Log Activity
                    </button>
                </div>
                ${relevantActivities.length ? `<div class="space-y-3">${activityCards}</div>` : `<div class="border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-500"><p>No activities recorded for this company.</p><button type="button" class="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" data-company-action="add-activity" data-related-type="company" data-related-id="${company.id}"><i class="fas fa-plus mr-2"></i>Log activity</button></div>`}
            </div>
        `;

        const overviewNotes = company.notes
            ? `<div class="p-4 bg-gray-50 border border-gray-200 rounded-xl"><p class="text-sm text-gray-700 whitespace-pre-line">${sanitizeText(company.notes).replace(/\n/g, '<br>')}</p></div>`
            : '';

        const overviewHtml = `
            <div class="space-y-6">
                ${metricsHtml}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">${detailCards}</div>
                ${tasksSectionHtml}
                ${activitiesSectionHtml}
                ${overviewNotes}
            </div>
        `;

        const buildContactDetails = contact => {
            const detailItems = [];
            if (contact.email) {
                detailItems.push(`<span class="flex items-center gap-1 text-sm text-gray-600"><i class="fas fa-envelope text-gray-400"></i><a href="mailto:${encodeURIComponent(contact.email)}" class="text-blue-600 hover:text-blue-700">${sanitizeText(contact.email)}</a></span>`);
            }
            if (contact.phone) {
                detailItems.push(`<span class="flex items-center gap-1 text-sm text-gray-600"><i class="fas fa-phone text-gray-400"></i>${sanitizeText(contact.phone)}</span>`);
            }
            if (!detailItems.length) {
                detailItems.push('<span class="text-sm text-gray-500">No contact details</span>');
            }
            return detailItems.join('');
        };

        const contactCards = contacts.map(contact => {
            const fullNameRaw = [contact.first_name, contact.last_name].filter(Boolean).join(' ').trim();
            const displayName = sanitizeText(fullNameRaw || contact.email || contact.phone || 'Unnamed Contact');
            const title = contact.title ? `<p class="text-sm text-gray-600">${sanitizeText(contact.title)}</p>` : '';
            const status = contact.status ? `<span class="px-2 py-1 rounded-full text-xs ${getStatusClass(contact.status)}">${sanitizeText(contact.status)}</span>` : '';
            const updated = contact.updated_at ? `<span class="text-xs text-gray-400">Updated ${formatDateOnly(contact.updated_at)}</span>` : '';
            const encodedContactName = encodeURIComponent(fullNameRaw || contact.email || contact.phone || '');
            return `
                <div class="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <p class="text-base font-semibold text-gray-800">${displayName}</p>
                            ${title}
                            <div class="mt-2 flex flex-wrap gap-3">${buildContactDetails(contact)}</div>
                        </div>
                        <div class="flex flex-col items-end gap-2 text-right">
                            ${status}
                            ${updated}
                        </div>
                    </div>
                    <div class="mt-4 flex flex-wrap gap-2">
                        <button type="button" class="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100" data-company-action="edit-contact" data-id="${contact.id}">
                            <i class="fas fa-pen mr-1"></i>Edit
                        </button>
                        <button type="button" class="px-3 py-1 border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-50" data-company-action="create-lead" data-company-id="${company.id}" data-company-name="${encodeURIComponent(company.name || '')}" data-contact-id="${contact.id}" data-contact-name="${encodedContactName}">
                            <i class="fas fa-user-plus mr-1"></i>New Lead
                        </button>
                        <button type="button" class="px-3 py-1 border border-purple-200 rounded-lg text-purple-600 hover:bg-purple-50" data-company-action="create-deal" data-company-id="${company.id}" data-company-name="${encodeURIComponent(company.name || '')}" data-contact-id="${contact.id}" data-contact-name="${encodedContactName}">
                            <i class="fas fa-briefcase mr-1"></i>New Deal
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        const contactsSectionHtml = `
            <div class="space-y-4">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h4 class="text-lg font-semibold text-gray-800">Contacts</h4>
                        <p class="text-sm text-gray-500">People connected with ${safeCompanyName}</p>
                    </div>
                    <button type="button" class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" data-company-action="add-contact" data-company-id="${company.id}" data-company-name="${encodeURIComponent(company.name || '')}">
                        <i class="fas fa-user-plus mr-2"></i>Add Contact
                    </button>
                </div>
                ${contacts.length ? `<div class="space-y-3">${contactCards}</div>` : `<div class="border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500"><p>No contacts linked yet.</p><button type="button" class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" data-company-action="add-contact" data-company-id="${company.id}" data-company-name="${encodeURIComponent(company.name || '')}">Create the first contact</button></div>`}
            </div>
        `;

        const leadCards = leads.map(lead => {
            const title = sanitizeText(lead.title || 'Untitled Lead');
            const status = lead.status ? `<span class="px-2 py-1 rounded-full text-xs ${getStatusClass(lead.status)}">${sanitizeText(lead.status)}</span>` : '';
            const priority = lead.priority ? `<span class="px-2 py-1 rounded-full text-xs ${getPriorityClass(lead.priority)}">${sanitizeText(lead.priority)}</span>` : '';
            const probability = Number.isFinite(Number(lead.probability)) ? `<span class="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">${Math.round(Number(lead.probability))}% probability</span>` : '';
            const expectedClose = lead.expected_close_date ? `<span class="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">Close ${formatDateOnly(lead.expected_close_date)}</span>` : '';
            const contactName = lead.contact_name ? `<span class="flex items-center gap-1 text-sm text-gray-600"><i class="fas fa-user text-gray-400"></i>${sanitizeText(lead.contact_name)}</span>` : '';
            const valueLine = lead.value ? `<span class="flex items-center gap-1 text-sm text-gray-600"><i class="fas fa-dollar-sign text-gray-400"></i>${formatCurrency(lead.value)}</span>` : '';
            const encodedLeadTitle = encodeURIComponent(lead.title || '');
            const encodedContactName = encodeURIComponent(lead.contact_name || '');
            return `
                <div class="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <p class="text-base font-semibold text-gray-800">${title}</p>
                            <div class="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                                ${status}
                                ${priority}
                                ${probability}
                                ${expectedClose}
                            </div>
                            <div class="mt-3 flex flex-wrap gap-3 text-sm text-gray-600">
                                ${contactName}
                                ${valueLine}
                            </div>
                        </div>
                        <div class="text-right text-xs text-gray-500">
                            ${lead.updated_at ? `Updated ${formatDateOnly(lead.updated_at)}` : ''}
                        </div>
                    </div>
                    <div class="mt-4 flex flex-wrap gap-2">
                        <button type="button" class="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100" data-company-action="edit-lead" data-id="${lead.id}">
                            <i class="fas fa-pen mr-1"></i>Edit
                        </button>
                        <button type="button" class="px-3 py-1 border border-purple-200 rounded-lg text-purple-600 hover:bg-purple-50" data-company-action="convert-lead" data-company-id="${company.id}" data-company-name="${encodeURIComponent(company.name || '')}" data-lead-id="${lead.id}" data-lead-title="${encodedLeadTitle}" data-contact-id="${lead.contact_id || ''}" data-contact-name="${encodedContactName}">
                            <i class="fas fa-arrow-right mr-1"></i>Create Deal
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        const leadsSectionHtml = `
            <div class="space-y-4">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h4 class="text-lg font-semibold text-gray-800">Leads</h4>
                        <p class="text-sm text-gray-500">Pipeline linked to ${safeCompanyName}</p>
                    </div>
                    <button type="button" class="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700" data-company-action="add-lead" data-company-id="${company.id}" data-company-name="${encodeURIComponent(company.name || '')}">
                        <i class="fas fa-bullseye mr-2"></i>Add Lead
                    </button>
                </div>
                ${leads.length ? `<div class="space-y-3">${leadCards}</div>` : `<div class="border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500"><p>No leads attached to this company.</p><button type="button" class="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700" data-company-action="add-lead" data-company-id="${company.id}" data-company-name="${encodeURIComponent(company.name || '')}">Create a lead</button></div>`}
            </div>
        `;

        const dealCards = deals.map(opportunity => {
            const name = sanitizeText(opportunity.name || 'Untitled Deal');
            const stage = opportunity.stage ? `<span class="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700">${sanitizeText(opportunity.stage)}</span>` : '';
            const probabilityBadge = Number.isFinite(Number(opportunity.probability)) ? `<span class="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">${Math.round(Number(opportunity.probability))}%</span>` : '';
            const expectedClose = opportunity.expected_close_date ? `<span class="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">Close ${formatDateOnly(opportunity.expected_close_date)}</span>` : '';
            const valueLine = opportunity.value ? `<span class="flex items-center gap-1 text-sm text-gray-600"><i class="fas fa-dollar-sign text-gray-400"></i>${formatCurrency(opportunity.value)}</span>` : '';
            const contactLine = opportunity.primary_contact_name ? `<span class="flex items-center gap-1 text-sm text-gray-600"><i class="fas fa-user text-gray-400"></i>${sanitizeText(opportunity.primary_contact_name)}</span>` : '';
            const leadLine = opportunity.lead?.title || opportunity.lead_name ? `<span class="flex items-center gap-1 text-sm text-gray-600"><i class="fas fa-bullseye text-gray-400"></i>${sanitizeText(opportunity.lead?.title || opportunity.lead_name)}</span>` : '';
            return `
                <div class="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <p class="text-base font-semibold text-gray-800">${name}</p>
                            <div class="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                                ${stage}
                                ${probabilityBadge}
                                ${expectedClose}
                            </div>
                            <div class="mt-3 flex flex-wrap gap-3 text-sm text-gray-600">
                                ${valueLine}
                                ${contactLine}
                                ${leadLine}
                            </div>
                        </div>
                        <div class="text-right text-xs text-gray-500">
                            ${opportunity.updated_at ? `Updated ${formatDateOnly(opportunity.updated_at)}` : ''}
                        </div>
                    </div>
                    <div class="mt-4 flex flex-wrap gap-2">
                        <button type="button" class="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100" data-company-action="edit-deal" data-id="${opportunity.id}">
                            <i class="fas fa-pen mr-1"></i>Edit
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        const dealsSectionHtml = `
            <div class="space-y-4">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h4 class="text-lg font-semibold text-gray-800">Deals</h4>
                        <p class="text-sm text-gray-500">Opportunities sourced from ${safeCompanyName}</p>
                    </div>
                    <button type="button" class="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700" data-company-action="add-deal" data-company-id="${company.id}" data-company-name="${encodeURIComponent(company.name || '')}">
                        <i class="fas fa-briefcase mr-2"></i>Add Deal
                    </button>
                </div>
                ${deals.length ? `<div class="space-y-3">${dealCards}</div>` : `<div class="border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500"><p>No deals in the pipeline yet.</p><button type="button" class="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700" data-company-action="add-deal" data-company-id="${company.id}" data-company-name="${encodeURIComponent(company.name || '')}">Create a deal</button></div>`}
            </div>
        `;

        const competitorCards = relevantCompetitors.map(comp => {
            const targets = normalizeCompetitorTargets(comp, companyLookup);
            const targetBadges = targets.names.map(name => `<span class="inline-flex items-center px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs"><i class="fas fa-building mr-1"></i>${sanitizeText(name)}</span>`).join('');
            const noteRaw = comp.note_file || comp.obsidian_note || '';
            const noteNormalized = noteRaw ? String(noteRaw).trim().replace(/^\/+/, '').replace(/^vault\//i, '') : '';
            const noteHref = noteNormalized ? `vault/${encodeURI(noteNormalized)}` : '';
            const noteLink = noteHref ? `<a href="${noteHref}" target="_blank" class="text-sm text-blue-600 hover:text-blue-700"><i class="fas fa-book mr-1"></i>${sanitizeText(noteRaw)}</a>` : '';
            const latestMove = comp.latest_move ? `<p class="text-sm text-gray-600 mt-3">${sanitizeText(comp.latest_move)}</p>` : '';
            const lastUpdate = comp.last_update || comp.updated_at;
            return `
                <div class="border border-gray-200 rounded-xl p-4 bg-white shadow-sm">
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <p class="text-base font-semibold text-gray-800">${sanitizeText(comp.name || 'Competitor')}</p>
                            <div class="mt-2 flex flex-wrap gap-2 text-xs text-gray-600">
                                <span class="px-2 py-1 rounded-full bg-gray-100 text-gray-700">${sanitizeText(comp.tier || 'Tier')}</span>
                                ${comp.status ? `<span class="px-2 py-1 rounded-full ${getStatusClass(comp.status)}">${sanitizeText(comp.status)}</span>` : ''}
                            </div>
                        </div>
                        <div class="text-right text-xs text-gray-500 space-y-1">
                            ${lastUpdate ? `<div>Updated ${formatDateOnly(lastUpdate)}</div>` : ''}
                            ${noteLink}
                        </div>
                    </div>
                    ${latestMove}
                    ${targetBadges ? `<div class="mt-3 flex flex-wrap gap-2">${targetBadges}</div>` : ''}
                </div>
            `;
        }).join('');

        const competitorsSectionHtml = `
            <div class="space-y-4">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h4 class="text-lg font-semibold text-gray-800">Competitors</h4>
                        <p class="text-sm text-gray-500">Competitive research linked to ${safeCompanyName}</p>
                    </div>
                    <button type="button" class="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100" data-company-action="open-competitor-hub">
                        <i class="fas fa-chess-knight mr-2"></i>Open Competitor Hub
                    </button>
                </div>
                ${relevantCompetitors.length ? `<div class="space-y-3">${competitorCards}</div>` : `<div class="border border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-500"><p>No competitor intelligence is attached to this account.</p><p class="text-sm mt-2">Track competitors from the Competitor Hub and link this company to their watchlists.</p><button type="button" class="mt-4 inline-flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900" data-company-action="open-competitor-hub"><i class="fas fa-chess-knight mr-2"></i>Open Competitor Hub</button></div>`}
            </div>
        `;

        const tabs = [
            { id: 'company-overview', label: 'Overview', content: overviewHtml },
            { id: 'company-contacts', label: `Contacts (${contacts.length})`, content: contactsSectionHtml },
            { id: 'company-leads', label: `Leads (${leads.length})`, content: leadsSectionHtml },
            { id: 'company-deals', label: `Deals (${deals.length})`, content: dealsSectionHtml },
            { id: 'company-competitors', label: `Competitors (${relevantCompetitors.length})`, content: competitorsSectionHtml }
        ];

        const tabButtons = tabs.map((tab, index) => `
            <button type="button" class="px-4 py-2 rounded-lg text-sm font-medium ${index === 0 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}" data-company-tab="${tab.id}">
                ${sanitizeText(tab.label)}
            </button>
        `).join('');

        const tabPanels = tabs.map((tab, index) => `
            <div data-company-panel="${tab.id}" class="${index === 0 ? '' : 'hidden'}">
                ${tab.content}
            </div>
        `).join('');

        const headerHtml = `
            <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                <div>
                    <h4 class="text-2xl font-semibold text-gray-800">${safeCompanyName}</h4>
                    <div class="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                        ${statusBadge}
                        ${ownerText}
                        ${industryText}
                    </div>
                </div>
                <div class="flex flex-col items-stretch md:items-end gap-3">
                    <div class="flex flex-wrap gap-2 justify-end">
                        <button type="button" class="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700" data-company-action="add-contact" data-company-id="${company.id}" data-company-name="${encodeURIComponent(company.name || '')}">
                            <i class="fas fa-user-plus mr-2"></i>New Contact
                        </button>
                        <button type="button" class="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700" data-company-action="add-lead" data-company-id="${company.id}" data-company-name="${encodeURIComponent(company.name || '')}">
                            <i class="fas fa-bullseye mr-2"></i>New Lead
                        </button>
                        <button type="button" class="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700" data-company-action="add-deal" data-company-id="${company.id}" data-company-name="${encodeURIComponent(company.name || '')}">
                            <i class="fas fa-briefcase mr-2"></i>New Deal
                        </button>
                    </div>
                    <div class="flex flex-wrap gap-2 justify-end">
                        <button type="button" class="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100" data-company-action="edit-company" data-company-id="${company.id}">
                            <i class="fas fa-edit mr-1"></i>Edit
                        </button>
                        <button type="button" class="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700" data-company-action="delete-company" data-company-id="${company.id}">
                            <i class="fas fa-trash mr-1"></i>Delete
                        </button>
                    </div>
                </div>
            </div>
        `;

        const modalTitle = company.name ? `Company – ${company.name}` : 'Company';

        showModal(modalTitle, `
            <div class="space-y-6">
                <div class="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
                    ${headerHtml}
                    <div>
                        <div class="flex flex-wrap gap-2" data-company-tablist>
                            ${tabButtons}
                        </div>
                        <div class="mt-4">
                            ${tabPanels}
                        </div>
                    </div>
                </div>
            </div>
        `);

        initializeCompanyModal(company);
    } catch (error) {
        console.error('Error viewing company:', error);
        showToast('Failed to load company', 'error');
    } finally {
        hideLoading();
    }
}

function initializeCompanyModal(company, context = {}) {
    const modalContent = document.getElementById('modalContent');
    if (!modalContent) {
        return;
    }

    const decodeValue = value => {
        if (!value) {
            return '';
        }
        try {
            return decodeURIComponent(value);
        } catch (error) {
            return value;
        }
    };

    const tabButtons = Array.from(modalContent.querySelectorAll('[data-company-tab]'));
    const panels = Array.from(modalContent.querySelectorAll('[data-company-panel]'));

    const setActiveTab = targetId => {
        if (!targetId) {
            return;
        }
        tabButtons.forEach(button => {
            const isActive = button.getAttribute('data-company-tab') === targetId;
            button.setAttribute('data-active', isActive ? 'true' : 'false');
            button.classList.toggle('bg-blue-600', isActive);
            button.classList.toggle('text-white', isActive);
            button.classList.toggle('bg-gray-100', !isActive);
            button.classList.toggle('text-gray-600', !isActive);
        });
        panels.forEach(panel => {
            const matches = panel.getAttribute('data-company-panel') === targetId;
            panel.classList.toggle('hidden', !matches);
        });
    };

    if (tabButtons.length) {
        const initialTab = tabButtons[0].getAttribute('data-company-tab');
        setActiveTab(initialTab);
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                setActiveTab(button.getAttribute('data-company-tab'));
            });
        });
    }

    const register = (selector, handler) => {
        modalContent.querySelectorAll(selector).forEach(element => {
            element.addEventListener('click', event => {
                event.preventDefault();
                handler(element, event);
            });
        });
    };

    register('[data-company-action="add-contact"]', element => {
        if (typeof showContactForm !== 'function') {
            return;
        }
        const companyId = element.getAttribute('data-company-id') || '';
        const companyName = decodeValue(element.getAttribute('data-company-name'));
        showContactForm(null, {
            defaultCompanyId: companyId,
            defaultCompanyName: companyName
        });
    });

    register('[data-company-action="edit-contact"]', element => {
        if (typeof showContactForm !== 'function') {
            return;
        }
        const contactId = element.getAttribute('data-id');
        if (contactId) {
            showContactForm(contactId);
        }
    });

    register('[data-company-action="add-lead"]', element => {
        if (typeof showLeadForm !== 'function') {
            return;
        }
        const companyId = element.getAttribute('data-company-id') || '';
        const companyName = decodeValue(element.getAttribute('data-company-name'));
        showLeadForm(null, {
            defaultCompanyId: companyId,
            defaultCompanyName: companyName
        });
    });

    register('[data-company-action="add-task"]', element => {
        if (typeof showTaskForm !== 'function') {
            return;
        }
        const relatedType = element.getAttribute('data-related-type') || '';
        const relatedId = element.getAttribute('data-related-id') || '';
        showTaskForm(null, {
            defaultRelatedType: relatedType,
            defaultRelatedId: relatedId
        });
    });

    register('[data-company-action="add-activity"]', element => {
        if (typeof showActivityForm !== 'function') {
            return;
        }
        const relatedType = element.getAttribute('data-related-type') || '';
        const relatedId = element.getAttribute('data-related-id') || '';
        showActivityForm(null, {
            defaultRelatedType: relatedType,
            defaultRelatedId: relatedId
        });
    });

    register('[data-company-action="create-lead"]', element => {
        if (typeof showLeadForm !== 'function') {
            return;
        }
        const companyId = element.getAttribute('data-company-id') || '';
        const companyName = decodeValue(element.getAttribute('data-company-name'));
        const contactId = element.getAttribute('data-contact-id') || '';
        const contactName = decodeValue(element.getAttribute('data-contact-name'));
        showLeadForm(null, {
            defaultCompanyId: companyId,
            defaultCompanyName: companyName,
            defaultContactId: contactId,
            defaultContactName: contactName
        });
    });

    register('[data-company-action="edit-lead"]', element => {
        if (typeof showLeadForm !== 'function') {
            return;
        }
        const leadId = element.getAttribute('data-id');
        if (leadId) {
            showLeadForm(leadId);
        }
    });

    register('[data-company-action="add-deal"]', element => {
        if (typeof showOpportunityForm !== 'function') {
            return;
        }
        const companyId = element.getAttribute('data-company-id') || '';
        const companyName = decodeValue(element.getAttribute('data-company-name'));
        showOpportunityForm(null, {
            defaultCompanyId: companyId,
            defaultCompanyName: companyName
        });
    });

    register('[data-company-action="create-deal"]', element => {
        if (typeof showOpportunityForm !== 'function') {
            return;
        }
        const companyId = element.getAttribute('data-company-id') || '';
        const companyName = decodeValue(element.getAttribute('data-company-name'));
        const contactId = element.getAttribute('data-contact-id') || '';
        const contactName = decodeValue(element.getAttribute('data-contact-name'));
        showOpportunityForm(null, {
            defaultCompanyId: companyId,
            defaultCompanyName: companyName,
            defaultContactId: contactId,
            defaultContactName: contactName
        });
    });

    register('[data-company-action="convert-lead"]', element => {
        const companyId = element.getAttribute('data-company-id') || '';
        const companyName = decodeValue(element.getAttribute('data-company-name'));
        const leadId = element.getAttribute('data-lead-id') || '';
        const leadTitle = decodeValue(element.getAttribute('data-lead-title'));
        const contactId = element.getAttribute('data-contact-id') || '';
        const contactName = decodeValue(element.getAttribute('data-contact-name'));

        if (!leadId) {
            return;
        }

        if (typeof showLeadConversionWizard === 'function') {
            showLeadConversionWizard(leadId, {
                defaultCompanyId: companyId,
                defaultCompanyName: companyName,
                defaultContactId: contactId,
                defaultContactName: contactName
            });
            return;
        }

        if (typeof showOpportunityForm === 'function') {
            showOpportunityForm(null, {
                defaultCompanyId: companyId,
                defaultCompanyName: companyName,
                defaultLeadId: leadId,
                defaultLeadName: leadTitle,
                defaultContactId: contactId,
                defaultContactName: contactName
            });
        }
    });

    register('[data-company-action="edit-deal"]', element => {
        if (typeof showOpportunityForm !== 'function') {
            return;
        }
        const oppId = element.getAttribute('data-id');
        if (oppId) {
            showOpportunityForm(oppId);
        }
    });

    register('[data-company-action="edit-company"]', element => {
        if (typeof showCompanyForm !== 'function') {
            return;
        }
        const companyId = element.getAttribute('data-company-id');
        if (companyId) {
            showCompanyForm(companyId);
        }
    });

    register('[data-company-action="delete-company"]', element => {
        if (typeof deleteCompany !== 'function') {
            return;
        }
        const companyId = element.getAttribute('data-company-id');
        if (companyId) {
            deleteCompany(companyId);
        }
    });

    register('[data-company-action="open-competitor-hub"]', () => {
        closeModal();
        if (typeof showCompetitorIntel === 'function') {
            showCompetitorIntel();
        }
    });
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


async function showLeadForm(leadId = null, context = {}) {
    const isEdit = Boolean(leadId);
    const {
        defaultCompanyId = '',
        defaultCompanyName = '',
        defaultContactId = '',
        defaultContactName = ''
    } = context || {};
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

    if (!isEdit) {
        if (defaultCompanyId) {
            lead.company_id = defaultCompanyId;
        }
        if (defaultCompanyName) {
            lead.company_name = defaultCompanyName;
        }
        if (defaultContactId) {
            lead.contact_id = defaultContactId;
        }
        if (defaultContactName) {
            lead.contact_name = defaultContactName;
        }
    }

    let companies = [];
    let contacts = [];
    try {
        const response = await fetch('tables/companies?limit=1000');
        if (response.ok) {
            const data = await response.json();
            companies = Array.isArray(data.data) ? data.data : [];
        }
    } catch (error) {
        console.warn('Unable to fetch companies for lead form:', error);
    }

    try {
        const response = await fetch('tables/contacts?limit=1000');
        if (response.ok) {
            const data = await response.json();
            contacts = Array.isArray(data.data) ? data.data : [];
        }
    } catch (error) {
        console.warn('Unable to fetch contacts for lead form:', error);
    }

    if (typeof updateCompanyDirectory === 'function') {
        updateCompanyDirectory(companies, { merge: true });
    }
    if (typeof updateContactDirectory === 'function') {
        updateContactDirectory(contacts, { merge: true });
    }

    const statusSelectOptions = renderSelectOptions(
        getDictionaryEntries('leads', 'statuses'),
        lead.status || 'New'
    );

    const prioritySelectOptions = renderSelectOptions(
        getDictionaryEntries('leads', 'priorities'),
        lead.priority || 'Medium'
    );

    const sourceSelectOptions = renderSelectOptions(
        getDictionaryEntries('leads', 'sources'),
        lead.source || '',
        {
            includeBlank: true,
            blankLabel: 'Select source...'
        }
    );

    const newCompanyStatusOptions = renderSelectOptions(
        getDictionaryEntries('companies', 'statuses'),
        'Prospect'
    );
    const expectedCloseDate = lead.expected_close_date
        ? new Date(lead.expected_close_date).toISOString().split('T')[0]
        : '';

    const selectedCompanyId = lead.company_id || '';
    let hasCurrentCompany = false;
    const companyOptionsHtml = companies.map(company => {
        if (!company?.id) {
            return '';
        }
        const isSelected = selectedCompanyId && company.id === selectedCompanyId;
        if (isSelected) {
            hasCurrentCompany = true;
        }
        const label = sanitizeText(company.name || company.website || company.id);
        return `<option value="${sanitizeText(company.id)}" ${isSelected ? 'selected' : ''}>${label}</option>`;
    }).join('');

    const fallbackCompanyOption = !hasCurrentCompany && selectedCompanyId && lead.company_name
        ? `<option value="${sanitizeText(selectedCompanyId)}" selected>${sanitizeText(lead.company_name)}</option>`
        : '';

    const selectedContactId = lead.contact_id || '';
    let hasCurrentContact = false;
    const contactOptionsHtml = contacts.map(contact => {
        if (!contact?.id) {
            return '';
        }
        const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ');
        const fallback = contact.email || contact.phone || contact.id;
        const label = sanitizeText(fullName || fallback);
        const isSelected = selectedContactId && contact.id === selectedContactId;
        if (isSelected) {
            hasCurrentContact = true;
        }
        return `<option value="${sanitizeText(contact.id)}" ${isSelected ? 'selected' : ''}>${label}</option>`;
    }).join('');

    const fallbackContactOption = !hasCurrentContact && selectedContactId && lead.contact_name
        ? `<option value="${sanitizeText(selectedContactId)}" selected>${sanitizeText(lead.contact_name)}</option>`
        : '';

    const hiddenCompanyName = sanitizeText(lead.company_name || '');

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
                        ${statusSelectOptions}
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
                        ${prioritySelectOptions}
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
                        ${sourceSelectOptions}
                    </select>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Company</label>
                <select id="leadCompanySelect" name="company_id"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Not linked</option>
                    ${fallbackCompanyOption}
                    ${companyOptionsHtml}
                </select>
                <input type="hidden" name="company_name" id="leadCompanyName" value="${hiddenCompanyName}">
                <p class="mt-1 text-xs text-gray-500">Link this lead to an account. You can create a lightweight company record on the fly.</p>
                <button type="button" id="leadNewCompanyToggle" data-label-create="Create new company" data-label-cancel="Use existing company"
                        class="mt-2 text-sm text-blue-600 hover:text-blue-700">Create new company</button>
                <div id="leadNewCompanySection" class="hidden mt-4 space-y-4 border border-blue-100 rounded-lg p-4 bg-blue-50/50">
                    <p class="text-xs text-blue-700">Fill these fields to create a new company when saving the lead.</p>
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
                            <input type="text" name="new_company_industry" placeholder="Consulting"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select name="new_company_status" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                ${newCompanyStatusOptions}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Primary Contact</label>
                <select id="leadContactSelect" name="contact_id"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Not linked</option>
                    ${fallbackContactOption}
                    ${contactOptionsHtml}
                </select>
                <p class="mt-1 text-xs text-gray-500">Associate a contact person or create one directly from this form.</p>
                <button type="button" id="leadNewContactToggle" data-label-create="Create new contact" data-label-cancel="Use existing contact"
                        class="mt-2 text-sm text-blue-600 hover:text-blue-700">Create new contact</button>
                <div id="leadNewContactSection" class="hidden mt-4 border border-blue-100 rounded-lg p-4 bg-blue-50/50">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                            <input type="text" name="new_contact_first_name" placeholder="First name"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                            <input type="text" name="new_contact_last_name" placeholder="Last name"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input type="email" name="new_contact_email" placeholder="name@example.com"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                            <input type="tel" name="new_contact_phone" placeholder="+1 (555) 123-4567"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Next Step</label>
                <textarea name="next_step" rows="3"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="What needs to happen next?">${lead.next_step || ''}</textarea>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea name="description" rows="4"
                          class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Additional context for this lead">${lead.description || ''}</textarea>
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
    const companySelect = form.querySelector('#leadCompanySelect');
    const companyNameInput = form.querySelector('#leadCompanyName');
    const newCompanyToggle = form.querySelector('#leadNewCompanyToggle');
    const newCompanySection = form.querySelector('#leadNewCompanySection');
    const newCompanyNameInput = form.querySelector('input[name="new_company_name"]');
    const companyToggleCreate = newCompanyToggle?.dataset?.labelCreate || 'Create new company';
    const companyToggleCancel = newCompanyToggle?.dataset?.labelCancel || 'Use existing company';

    const contactSelect = form.querySelector('#leadContactSelect');
    const newContactToggle = form.querySelector('#leadNewContactToggle');
    const newContactSection = form.querySelector('#leadNewContactSection');
    const newContactFirstNameInput = form.querySelector('input[name="new_contact_first_name"]');
    const newContactLastNameInput = form.querySelector('input[name="new_contact_last_name"]');
    const newContactEmailInput = form.querySelector('input[name="new_contact_email"]');
    const newContactPhoneInput = form.querySelector('input[name="new_contact_phone"]');
    const contactToggleCreate = newContactToggle?.dataset?.labelCreate || 'Create new contact';
    const contactToggleCancel = newContactToggle?.dataset?.labelCancel || 'Use existing contact';

    const syncLeadCompanyName = () => {
        if (!companySelect || !companyNameInput) {
            return;
        }
        const option = companySelect.selectedOptions?.[0];
        companyNameInput.value = option ? option.textContent.trim() : '';
    };

    syncLeadCompanyName();

    companySelect?.addEventListener('change', () => {
        if (newCompanySection) {
            newCompanySection.classList.add('hidden');
        }
        if (newCompanyToggle) {
            newCompanyToggle.setAttribute('data-expanded', 'false');
            newCompanyToggle.textContent = companyToggleCreate;
        }
        if (newCompanyNameInput) {
            newCompanyNameInput.value = '';
        }
        syncLeadCompanyName();
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
            newCompanyToggle.textContent = companyToggleCreate;
            syncLeadCompanyName();
        } else {
            newCompanySection.classList.remove('hidden');
            newCompanyToggle.setAttribute('data-expanded', 'true');
            newCompanyToggle.textContent = companyToggleCancel;
            if (companySelect) {
                companySelect.value = '';
            }
            if (companyNameInput) {
                companyNameInput.value = '';
            }
            newCompanyNameInput?.focus();
        }
    });

    const closeNewContactSection = () => {
        if (newContactSection) {
            newContactSection.classList.add('hidden');
        }
        if (newContactToggle) {
            newContactToggle.setAttribute('data-expanded', 'false');
            newContactToggle.textContent = contactToggleCreate;
        }
        if (newContactFirstNameInput) newContactFirstNameInput.value = '';
        if (newContactLastNameInput) newContactLastNameInput.value = '';
        if (newContactEmailInput) newContactEmailInput.value = '';
        if (newContactPhoneInput) newContactPhoneInput.value = '';
    };

    contactSelect?.addEventListener('change', () => {
        closeNewContactSection();
    });

    newContactToggle?.addEventListener('click', event => {
        event.preventDefault();
        if (!newContactSection) {
            return;
        }
        const expanded = newContactToggle.getAttribute('data-expanded') === 'true';
        if (expanded) {
            closeNewContactSection();
        } else {
            newContactSection.classList.remove('hidden');
            newContactToggle.setAttribute('data-expanded', 'true');
            newContactToggle.textContent = contactToggleCancel;
            if (contactSelect) {
                contactSelect.value = '';
            }
            newContactFirstNameInput?.focus();
        }
    });

    form.addEventListener('submit', async event => {
        event.preventDefault();
        await saveLead(leadId, new FormData(form));
    });
}

async function saveLead(leadId, formData) {
    const formValues = {};
    for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed) {
                formValues[key] = trimmed;
            }
        } else if (value !== undefined && value !== null) {
            formValues[key] = value;
        }
    }

    if (!formValues.title) {
        showToast('Lead title is required', 'error');
        return;
    }

    if (!formValues.status) {
        formValues.status = 'New';
    }

    if (!formValues.priority) {
        formValues.priority = 'Medium';
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
                status: formValues.new_company_status
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

    let contactLink = null;
    if (typeof ensureContactAssociation === 'function') {
        contactLink = await ensureContactAssociation({
            selectedId: formValues.contact_id,
            newContact: {
                firstName: formValues.new_contact_first_name,
                lastName: formValues.new_contact_last_name,
                email: formValues.new_contact_email,
                phone: formValues.new_contact_phone,
                status: 'Qualified'
            },
            companyLink
        });
    }

    if (contactLink?.contact_id) {
        formValues.contact_id = contactLink.contact_id;
    } else if (!formValues.contact_id) {
        delete formValues.contact_id;
    }

    delete formValues.new_company_name;
    delete formValues.new_company_website;
    delete formValues.new_company_industry;
    delete formValues.new_company_status;
    delete formValues.new_contact_first_name;
    delete formValues.new_contact_last_name;
    delete formValues.new_contact_email;
    delete formValues.new_contact_phone;

    if (typeof formValues.value === 'string') {
        const numericValue = Number(formValues.value.replace(/[^0-9.\-]/g, ''));
        if (Number.isFinite(numericValue)) {
            formValues.value = numericValue;
        } else {
            delete formValues.value;
        }
    }

    if (typeof formValues.probability === 'string') {
        const numericProbability = Number(formValues.probability);
        if (Number.isFinite(numericProbability)) {
            formValues.probability = Math.min(100, Math.max(0, Math.round(numericProbability)));
        } else {
            delete formValues.probability;
        }
    }

    if (formValues.expected_close_date) {
        const parsedDate = new Date(formValues.expected_close_date);
        if (Number.isNaN(parsedDate.getTime())) {
            delete formValues.expected_close_date;
        }
    }

    const nowIso = new Date().toISOString();
    formValues.updated_at = nowIso;
    if (!leadId) {
        formValues.created_at = nowIso;
        formValues.created_by = currentUser;
    }

    showLoading();
    try {
        const method = leadId ? 'PUT' : 'POST';
        const url = leadId ? `tables/leads/${leadId}` : 'tables/leads';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formValues)
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
        const enrichedLead = enrichLeadRecord(lead);
        const profile = enrichedLead.detailProfile || buildLeadDetailProfile(enrichedLead);

        const actionButtons = `
            <div class="flex flex-wrap gap-3 justify-end">
                <button onclick="showLeadConversionWizard('${sanitizeText(enrichedLead.id)}')" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    <i class="fas fa-exchange-alt mr-2"></i>Конвертувати
                </button>
                <button onclick="showLeadForm('${sanitizeText(enrichedLead.id)}')" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">
                    <i class="fas fa-edit mr-2"></i>Редагувати
                </button>
                <button onclick="deleteLead('${sanitizeText(enrichedLead.id)}')" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                    <i class="fas fa-trash mr-2"></i>Видалити
                </button>
            </div>
        `;

        showModal('Lead Details', `
            <div class="space-y-6 max-h-[80vh] overflow-y-auto pr-1">
                ${actionButtons}
                ${buildLeadPrimaryInfoHtml(enrichedLead, profile)}
                ${buildLeadInterestHtml(profile)}
                ${buildLeadHistoryHtml(profile)}
                ${buildLeadTasksHtml(profile)}
                ${buildLeadSegmentationHtml(profile)}
                ${buildLeadFinancialHtml(profile)}
                ${buildLeadAutomationHtml(profile)}
                ${buildLeadSecurityHtml(profile)}
            </div>
        `);
    } catch (error) {
        console.error('Error viewing lead:', error);
        showToast('Failed to load lead', 'error');
    } finally {
        hideLoading();
    }
}

async function showLeadConversionWizard(leadId, context = {}) {
    showLoading();
    let lead;
    try {
        const response = await fetch(`tables/leads/${leadId}`);
        if (!response.ok) {
            throw new Error('Failed to load lead');
        }
        lead = await response.json();
    } catch (error) {
        console.error('Error loading lead for conversion:', error);
        hideLoading();
        showToast('Unable to load lead for conversion', 'error');
        return;
    }

    const {
        defaultCompanyId = '',
        defaultCompanyName = '',
        defaultContactId = '',
        defaultContactName = ''
    } = context || {};

    if (!lead.company_id && defaultCompanyId) {
        lead.company_id = defaultCompanyId;
    }
    if (!lead.company_name && defaultCompanyName) {
        lead.company_name = defaultCompanyName;
    }
    if (!lead.contact_id && defaultContactId) {
        lead.contact_id = defaultContactId;
    }
    if (!lead.contact_name && defaultContactName) {
        lead.contact_name = defaultContactName;
    }

    const parseList = payload => {
        if (Array.isArray(payload?.data)) {
            return payload.data;
        }
        if (Array.isArray(payload)) {
            return payload;
        }
        return [];
    };

    let companies = [];
    let contacts = [];
    try {
        const [companiesResponse, contactsResponse] = await Promise.all([
            fetch('tables/companies?limit=1000').then(res => res.ok ? res.json() : { data: [] }).catch(() => ({ data: [] })),
            fetch('tables/contacts?limit=1000').then(res => res.ok ? res.json() : { data: [] }).catch(() => ({ data: [] }))
        ]);
        companies = parseList(companiesResponse);
        contacts = parseList(contactsResponse);
    } catch (error) {
        console.warn('Unable to load lookup data for lead conversion:', error);
    }

    if (typeof updateCompanyDirectory === 'function') {
        updateCompanyDirectory(companies, { merge: true });
    }
    if (typeof updateContactDirectory === 'function') {
        updateContactDirectory(contacts, { merge: true });
    }

    hideLoading();

    const selectedCompanyId = lead.company_id || '';
    let hasCurrentCompany = false;
    const companyOptionsHtml = companies.map(company => {
        if (!company?.id) {
            return '';
        }
        const label = sanitizeText(company.name || company.website || company.id);
        const isSelected = selectedCompanyId && company.id === selectedCompanyId;
        if (isSelected) {
            hasCurrentCompany = true;
        }
        return `<option value="${sanitizeText(company.id)}" ${isSelected ? 'selected' : ''}>${label}</option>`;
    }).join('');

    const fallbackCompanyOption = !hasCurrentCompany && selectedCompanyId && lead.company_name
        ? `<option value="${sanitizeText(selectedCompanyId)}" selected>${sanitizeText(lead.company_name)}</option>`
        : '';

    const selectedContactId = lead.contact_id || '';
    let hasCurrentContact = false;
    const contactOptionsHtml = contacts.map(contact => {
        if (!contact?.id) {
            return '';
        }
        const fullName = [contact.first_name, contact.last_name].filter(Boolean).join(' ');
        const fallback = contact.email || contact.phone || contact.id;
        const label = sanitizeText(fullName || fallback);
        const isSelected = selectedContactId && contact.id === selectedContactId;
        if (isSelected) {
            hasCurrentContact = true;
        }
        return `<option value="${sanitizeText(contact.id)}" ${isSelected ? 'selected' : ''}>${label}</option>`;
    }).join('');

    const contactFallbackLabel = lead.contact_name || defaultContactName || '';
    const fallbackContactOption = !hasCurrentContact && selectedContactId && contactFallbackLabel
        ? `<option value="${sanitizeText(selectedContactId)}" selected>${sanitizeText(contactFallbackLabel)}</option>`
        : '';

    const leadStatusEntries = getDictionaryEntries(
        'leads',
        'statuses',
        ['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']
    );
    const normalizedLeadStatusEntries = leadStatusEntries
        .map(entry => normalizeDictionaryEntry(entry))
        .filter(Boolean);
    const leadStatusValues = normalizedLeadStatusEntries.map(entry => entry.value);
    const leadStatusSet = new Set(leadStatusValues);
    const defaultLeadStatus = normalizedLeadStatusEntries.find(entry => entry.value === 'Qualified')?.value
        || normalizedLeadStatusEntries[0]?.value
        || 'Qualified';
    let selectedLeadStatus = defaultLeadStatus;
    if (lead.status && leadStatusSet.has(lead.status)) {
        selectedLeadStatus = ['New', 'Contacted'].includes(lead.status) && leadStatusSet.has('Qualified')
            ? 'Qualified'
            : lead.status;
    }
    const leadStatusOptions = renderSelectOptions(leadStatusEntries, selectedLeadStatus);

    const statusToStageMap = {
        Qualified: 'Qualification',
        Proposal: 'Proposal',
        Negotiation: 'Negotiation',
        Won: 'Closed Won',
        Lost: 'Closed Lost'
    };
    const stageEntries = getDictionaryEntries('opportunities', 'stages', SALES_STAGE_ORDER);
    const normalizedStageEntries = stageEntries
        .map(entry => normalizeDictionaryEntry(entry))
        .filter(Boolean);
    const stageValues = normalizedStageEntries.map(entry => entry.value);
    const fallbackStageValue = normalizedStageEntries[0]?.value || 'Qualification';
    const mappedStage = statusToStageMap[lead.status]
        || statusToStageMap[selectedLeadStatus]
        || fallbackStageValue;
    const selectedStageValue = stageValues.includes(mappedStage) ? mappedStage : fallbackStageValue;
    const stageOptions = renderSelectOptions(stageEntries, selectedStageValue);

    const probabilityDefault = typeof lead.probability === 'number'
        ? lead.probability
        : STAGE_DEFAULT_PROBABILITY[selectedStageValue];
    const probabilityValue = probabilityDefault !== undefined && probabilityDefault !== null
        ? String(probabilityDefault)
        : '';

    const expectedCloseDate = lead.expected_close_date
        ? new Date(lead.expected_close_date).toISOString().split('T')[0]
        : '';

    const opportunityName = lead.title || '';
    const opportunityValue = lead.value ?? '';
    const opportunityOwner = lead.assigned_to || (typeof currentUser !== 'undefined' ? currentUser : '');
    const opportunityDescription = lead.description || '';

    const shouldPrefillOpportunity = ['Qualified', 'Proposal', 'Negotiation', 'Won'].includes(lead.status);
    const opportunitySectionClass = shouldPrefillOpportunity ? '' : 'hidden';
    const createOpportunityChecked = shouldPrefillOpportunity ? 'checked' : '';

    const initialContactName = contactFallbackLabel.trim();
    const [initialFirstName, ...initialLastNameParts] = initialContactName ? initialContactName.split(' ') : ['', ''];
    const initialLastName = initialLastNameParts.join(' ');
    const initialEmail = lead.email || '';
    const initialPhone = lead.phone || '';

    const hiddenCompanyName = sanitizeText(lead.company_name || '');

    showModal('Convert Lead', `
        <form id="leadConversionForm" class="space-y-6">
            <div class="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <h4 class="text-lg font-semibold text-blue-800">${sanitizeText(lead.title || 'Untitled Lead')}</h4>
                <p class="text-sm text-blue-700 mt-1">Transform this lead into structured CRM records without losing context.</p>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Lead Value</p>
                    <p class="mt-2 text-sm text-gray-800">${formatCurrency(lead.value || 0)}</p>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Current Status</p>
                    <p class="mt-2 text-sm text-gray-800">${sanitizeText(lead.status || 'New')}</p>
                </div>
            </div>

            <div>
                <h5 class="text-sm font-semibold text-gray-700 mb-3">Company Association</h5>
                <select id="leadConversionCompanySelect" name="company_id" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Not linked</option>
                    ${fallbackCompanyOption}
                    ${companyOptionsHtml}
                </select>
                <input type="hidden" name="company_name" id="leadConversionCompanyName" value="${hiddenCompanyName}">
                <p class="mt-1 text-xs text-gray-500">Link the lead to an existing account or create a new company inline.</p>
                <button type="button" id="leadConversionNewCompanyToggle" data-label-create="Create new company" data-label-cancel="Use existing company" class="mt-2 text-sm text-blue-600 hover:text-blue-700">Create new company</button>
                <div id="leadConversionNewCompanySection" class="hidden mt-4 border border-blue-100 rounded-lg p-4 bg-blue-50/50 space-y-4">
                    <p class="text-xs text-blue-700">Provide minimal details and we'll create the company once you convert.</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                            <input type="text" name="new_company_name" value="" placeholder="Acme Corporation" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Website</label>
                            <input type="url" name="new_company_website" value="" placeholder="https://example.com" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                            <input type="text" name="new_company_industry" value="" placeholder="Software" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select name="new_company_status" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                <option value="Prospect">Prospect</option>
                                <option value="Customer">Customer</option>
                                <option value="Partner">Partner</option>
                                <option value="Vendor">Vendor</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Company Size</label>
                            <input type="text" name="new_company_size" value="" placeholder="50-100" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <h5 class="text-sm font-semibold text-gray-700 mb-3">Primary Contact</h5>
                <select id="leadConversionContactSelect" name="contact_id" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Create new contact</option>
                    ${fallbackContactOption}
                    ${contactOptionsHtml}
                </select>
                <p class="mt-1 text-xs text-gray-500">Select an existing person or capture their details to create a new contact.</p>
                <button type="button" id="leadConversionNewContactToggle" data-label-create="Create new contact" data-label-cancel="Use existing contact" class="mt-2 text-sm text-blue-600 hover:text-blue-700">Create new contact</button>
                <div id="leadConversionNewContactSection" class="hidden mt-4 border border-purple-100 rounded-lg p-4 bg-purple-50/50">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                            <input type="text" name="new_contact_first_name" value="${sanitizeText(initialFirstName)}" placeholder="First name" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                            <input type="text" name="new_contact_last_name" value="${sanitizeText(initialLastName)}" placeholder="Last name" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input type="email" name="new_contact_email" value="${sanitizeText(initialEmail)}" placeholder="name@example.com" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                            <input type="tel" name="new_contact_phone" value="${sanitizeText(initialPhone)}" placeholder="+1 (555) 123-4567" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Lead Status After Conversion</label>
                    <select name="lead_status" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        ${leadStatusOptions}
                    </select>
                </div>
                <div class="flex items-center mt-6 md:mt-0">
                    <input type="checkbox" id="leadConversionOpportunityToggle" name="create_opportunity" class="h-4 w-4 text-blue-600 border-gray-300 rounded" ${createOpportunityChecked}>
                    <label for="leadConversionOpportunityToggle" class="ml-3 text-sm text-gray-700">Launch opportunity form after conversion</label>
                </div>
            </div>

            <div id="leadConversionOpportunityFields" class="${opportunitySectionClass} space-y-6 border border-gray-200 rounded-xl p-4 bg-gray-50">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Opportunity Name</label>
                        <input type="text" name="opportunity_name" value="${sanitizeText(opportunityName)}" placeholder="Engagement name" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Stage</label>
                        <select id="leadConversionOpportunityStage" name="opportunity_stage" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            ${stageOptions}
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Value (USD)</label>
                        <input type="number" min="0" step="1000" name="opportunity_value" value="${opportunityValue}" placeholder="50000" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Probability (%)</label>
                        <input type="number" id="leadConversionOpportunityProbability" name="opportunity_probability" min="0" max="100" step="1" value="${probabilityValue}" placeholder="60" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Expected Close Date</label>
                        <input type="date" name="opportunity_expected_close_date" value="${expectedCloseDate}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                        <input type="text" name="opportunity_assigned_to" value="${sanitizeText(opportunityOwner)}" placeholder="Team member" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Next Step</label>
                    <textarea name="opportunity_next_step" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Outline the immediate follow-up">${sanitizeText(lead.next_step || '')}</textarea>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea name="opportunity_description" rows="4" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Carry over context from the lead">${sanitizeText(opportunityDescription)}</textarea>
                </div>
            </div>

            <div class="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button type="button" onclick="closeModal()" class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100">Cancel</button>
                <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Convert Lead</button>
            </div>
        </form>
    `);

    const form = document.getElementById('leadConversionForm');
    if (!form) {
        return;
    }
    const companySelect = form.querySelector('#leadConversionCompanySelect');
    const companyNameInput = form.querySelector('#leadConversionCompanyName');
    const newCompanyToggle = form.querySelector('#leadConversionNewCompanyToggle');
    const newCompanySection = form.querySelector('#leadConversionNewCompanySection');
    const newCompanyNameInput = form.querySelector('input[name="new_company_name"]');
    const newContactToggle = form.querySelector('#leadConversionNewContactToggle');
    const newContactSection = form.querySelector('#leadConversionNewContactSection');
    const createOpportunityToggle = form.querySelector('#leadConversionOpportunityToggle');
    const opportunityFields = form.querySelector('#leadConversionOpportunityFields');
    const stageSelect = form.querySelector('#leadConversionOpportunityStage');
    const probabilityInput = form.querySelector('#leadConversionOpportunityProbability');

    const companyToggleCreate = newCompanyToggle?.dataset?.labelCreate || 'Create new company';
    const companyToggleCancel = newCompanyToggle?.dataset?.labelCancel || 'Use existing company';
    const contactToggleCreate = newContactToggle?.dataset?.labelCreate || 'Create new contact';
    const contactToggleCancel = newContactToggle?.dataset?.labelCancel || 'Use existing contact';

    const syncCompanyName = () => {
        if (!companySelect || !companyNameInput) {
            return;
        }
        const option = companySelect.selectedOptions?.[0];
        companyNameInput.value = option ? option.textContent.trim() : '';
    };

    syncCompanyName();

    companySelect?.addEventListener('change', () => {
        if (newCompanySection) {
            newCompanySection.classList.add('hidden');
        }
        if (newCompanyToggle) {
            newCompanyToggle.setAttribute('data-expanded', 'false');
            newCompanyToggle.textContent = companyToggleCreate;
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
            newCompanyToggle.textContent = companyToggleCreate;
            syncCompanyName();
        } else {
            newCompanySection.classList.remove('hidden');
            newCompanyToggle.setAttribute('data-expanded', 'true');
            newCompanyToggle.textContent = companyToggleCancel;
            if (companySelect) {
                companySelect.value = '';
            }
            if (companyNameInput) {
                companyNameInput.value = '';
            }
            newCompanyNameInput?.focus();
        }
    });

    newContactToggle?.addEventListener('click', event => {
        event.preventDefault();
        if (!newContactSection) {
            return;
        }
        const expanded = newContactToggle.getAttribute('data-expanded') === 'true';
        if (expanded) {
            newContactSection.classList.add('hidden');
            newContactToggle.setAttribute('data-expanded', 'false');
            newContactToggle.textContent = contactToggleCreate;
        } else {
            newContactSection.classList.remove('hidden');
            newContactToggle.setAttribute('data-expanded', 'true');
            newContactToggle.textContent = contactToggleCancel;
        }
    });

    if (!lead.contact_id) {
        if (newContactSection) {
            newContactSection.classList.remove('hidden');
        }
        if (newContactToggle) {
            newContactToggle.setAttribute('data-expanded', 'true');
            newContactToggle.textContent = contactToggleCancel;
        }
    }

    const updateProbabilityForStage = () => {
        if (!stageSelect || !probabilityInput) {
            return;
        }
        const stage = stageSelect.value;
        const defaultValue = STAGE_DEFAULT_PROBABILITY[stage];
        if (defaultValue === 0 || defaultValue === 100) {
            probabilityInput.value = String(defaultValue ?? '');
            probabilityInput.setAttribute('readonly', 'readonly');
            return;
        }

        probabilityInput.removeAttribute('readonly');
        if (!probabilityInput.value || probabilityInput.value === '0' || probabilityInput.value === '100') {
            if (defaultValue !== undefined && defaultValue !== null) {
                probabilityInput.value = String(defaultValue);
            }
        }
    };

    stageSelect?.addEventListener('change', () => {
        if (!createOpportunityToggle || createOpportunityToggle.checked) {
            updateProbabilityForStage();
        }
    });

    const toggleOpportunityFields = () => {
        if (!opportunityFields) {
            return;
        }
        const shouldShow = Boolean(createOpportunityToggle?.checked);
        opportunityFields.classList.toggle('hidden', !shouldShow);
        if (shouldShow) {
            updateProbabilityForStage();
        }
    };

    createOpportunityToggle?.addEventListener('change', toggleOpportunityFields);
    toggleOpportunityFields();

    if (!createOpportunityToggle || createOpportunityToggle.checked) {
        updateProbabilityForStage();
    }

    form.addEventListener('submit', async event => {
        event.preventDefault();
        const result = await processLeadConversion(lead, form);
        if (result?.opportunityContext && typeof showOpportunityForm === 'function') {
            showOpportunityForm(null, result.opportunityContext);
        }
    });
}

async function processLeadConversion(lead, form) {
    if (!lead || !form) {
        return null;
    }

    const formData = new FormData(form);
    const selectedContactId = (formData.get('contact_id') || '').trim();
    const newContactFirstName = formData.get('new_contact_first_name');
    const newContactLastName = formData.get('new_contact_last_name');
    const newContactEmail = formData.get('new_contact_email');
    const newContactPhone = formData.get('new_contact_phone');
    const hasNewContactData = [newContactFirstName, newContactLastName, newContactEmail, newContactPhone]
        .some(value => value && value.trim());

    if (!selectedContactId && !hasNewContactData) {
        showToast('Select or create a contact before converting the lead', 'error');
        return null;
    }

    const leadStatus = formData.get('lead_status') || lead.status || 'Qualified';
    const createOpportunity = formData.get('create_opportunity') === 'on';

    const companyPayload = {
        selectedId: formData.get('company_id'),
        companyName: formData.get('company_name'),
        newCompany: {
            name: formData.get('new_company_name'),
            website: formData.get('new_company_website'),
            industry: formData.get('new_company_industry'),
            status: formData.get('new_company_status'),
            size: formData.get('new_company_size')
        }
    };

    const newContactPayload = {
        firstName: newContactFirstName,
        lastName: newContactLastName,
        email: newContactEmail,
        phone: newContactPhone
    };

    let companyLink = null;
    let contactLink = null;

    showLoading();

    if (typeof ensureCompanyAssociation === 'function') {
        try {
            companyLink = await ensureCompanyAssociation(companyPayload);
        } catch (error) {
            console.error('Error linking company during lead conversion:', error);
            showToast('Failed to link company for lead conversion', 'error');
            hideLoading();
            return null;
        }
    } else if (companyPayload.companyName) {
        companyLink = { company_name: companyPayload.companyName };
    }

    if (typeof ensureContactAssociation === 'function') {
        try {
            contactLink = await ensureContactAssociation({
                selectedId: selectedContactId,
                newContact: newContactPayload,
                companyLink,
                defaultStatus: 'Customer',
                originLeadId: lead.id
            });
        } catch (error) {
            console.error('Error linking contact during lead conversion:', error);
            showToast('Failed to create or link contact for conversion', 'error');
            hideLoading();
            return null;
        }
    }

    if (!contactLink?.contact_id) {
        showToast('Select or create a contact before converting the lead', 'error');
        hideLoading();
        return null;
    }

    const timestamp = new Date().toISOString();
    const patch = {
        status: leadStatus,
        updated_at: timestamp,
        converted_at: timestamp
    };

    if (companyLink?.company_id) {
        patch.company_id = companyLink.company_id;
    }
    if (companyLink?.company_name) {
        patch.company_name = companyLink.company_name;
    }
    const trimmedCompanyName = companyPayload.companyName ? companyPayload.companyName.trim() : '';
    if (!patch.company_name && trimmedCompanyName) {
        patch.company_name = trimmedCompanyName;
    }
    if (contactLink.contact_id) {
        patch.contact_id = contactLink.contact_id;
    }

    const contactRecord = contactLink.contact
        || (contactLink.contact_id ? entityDirectories.contacts.byId.get(contactLink.contact_id) : null);
    if (contactRecord) {
        const contactName = [contactRecord.first_name, contactRecord.last_name]
            .filter(Boolean)
            .join(' ')
            .trim();
        if (contactName) {
            patch.contact_name = contactName;
        }
        if (contactRecord.email) {
            patch.contact_email = contactRecord.email;
        }
    }

    try {
        const response = await fetch(`tables/leads/${lead.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch)
        });
        if (!response.ok) {
            throw new Error('Update failed');
        }
        await response.json();
    } catch (error) {
        console.error('Error updating lead during conversion:', error);
        showToast('Failed to update lead during conversion', 'error');
        hideLoading();
        return null;
    }

    await loadLeads();
    closeModal();
    showToast('Lead converted successfully', 'success');
    hideLoading();

    const fallbackContactName = contactRecord
        ? [contactRecord.first_name, contactRecord.last_name].filter(Boolean).join(' ').trim()
        : [newContactFirstName, newContactLastName].filter(Boolean).join(' ').trim();
    const companyNameFallback = (companyLink?.company_name
        || formData.get('company_name')
        || formData.get('new_company_name')
        || lead.company_name
        || '').trim();

    let opportunityContext = null;
    if (createOpportunity && typeof showOpportunityForm === 'function') {
        const opportunityName = (formData.get('opportunity_name') || lead.title || '').trim();
        const valueRaw = (formData.get('opportunity_value') || '').toString().trim();
        const probabilityRaw = (formData.get('opportunity_probability') || '').toString().trim();
        const stage = (formData.get('opportunity_stage') || '').trim();
        const expectedClose = (formData.get('opportunity_expected_close_date') || lead.expected_close_date || '').trim();
        const assignedTo = (formData.get('opportunity_assigned_to') || lead.assigned_to || '').trim();
        const nextStep = (formData.get('opportunity_next_step') || '').trim();
        const description = (formData.get('opportunity_description') || lead.description || '').trim();

        const valueNumber = valueRaw && !Number.isNaN(Number(valueRaw)) ? Number(valueRaw) : undefined;
        const probabilityNumber = probabilityRaw && !Number.isNaN(Number(probabilityRaw)) ? Number(probabilityRaw) : undefined;

        opportunityContext = {
            defaultCompanyId: companyLink?.company_id || '',
            defaultCompanyName: companyNameFallback,
            defaultLeadId: lead.id,
            defaultLeadName: lead.title || '',
            defaultContactId: contactLink.contact_id || '',
            defaultContactName: fallbackContactName
        };

        if (opportunityName) {
            opportunityContext.defaultOpportunityName = opportunityName;
        }
        if (Number.isFinite(valueNumber)) {
            opportunityContext.defaultOpportunityValue = valueNumber;
        }
        if (stage) {
            opportunityContext.defaultStage = stage;
        }
        if (Number.isFinite(probabilityNumber)) {
            opportunityContext.defaultProbability = Math.max(0, Math.min(100, probabilityNumber));
        }
        if (expectedClose) {
            opportunityContext.defaultExpectedCloseDate = expectedClose;
        }
        if (assignedTo) {
            opportunityContext.defaultAssignedTo = assignedTo;
        }
        if (nextStep) {
            opportunityContext.defaultNextStep = nextStep;
        }
        if (description) {
            opportunityContext.defaultDescription = description;
        }
    }

    return { opportunityContext };
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

async function showOpportunityForm(oppId = null, context = {}) {
    const isEdit = Boolean(oppId);
    const {
        defaultCompanyId = '',
        defaultCompanyName = '',
        defaultLeadId = '',
        defaultLeadName = '',
        defaultContactId = '',
        defaultContactName = '',
        defaultOpportunityName = '',
        defaultOpportunityValue = '',
        defaultStage = '',
        defaultProbability = '',
        defaultExpectedCloseDate = '',
        defaultAssignedTo = '',
        defaultNextStep = '',
        defaultDescription = ''
    } = context || {};
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

    if (!isEdit) {
        if (defaultCompanyId) {
            opportunity.company_id = defaultCompanyId;
        }
        if (defaultCompanyName) {
            opportunity.company_name = defaultCompanyName;
        }
        if (defaultLeadId) {
            opportunity.lead_id = defaultLeadId;
            opportunity.lead = {
                id: defaultLeadId,
                title: defaultLeadName || ''
            };
        }
        if (defaultContactId) {
            opportunity.primary_contact_id = defaultContactId;
        }
        if (defaultContactName) {
            opportunity.primary_contact_name = defaultContactName;
        }
        if (defaultOpportunityName) {
            opportunity.name = defaultOpportunityName;
        }
        if (defaultStage) {
            opportunity.stage = defaultStage;
        }
        if (defaultOpportunityValue !== undefined && defaultOpportunityValue !== null && defaultOpportunityValue !== '') {
            const numericValue = Number(defaultOpportunityValue);
            if (!Number.isNaN(numericValue)) {
                opportunity.value = numericValue;
            }
        }
        if (defaultProbability !== undefined && defaultProbability !== null && defaultProbability !== '') {
            const numericProbability = Number(defaultProbability);
            if (!Number.isNaN(numericProbability)) {
                opportunity.probability = numericProbability;
            }
        }
        if (defaultExpectedCloseDate) {
            opportunity.expected_close_date = defaultExpectedCloseDate;
        }
        if (defaultAssignedTo) {
            opportunity.assigned_to = defaultAssignedTo;
        }
        if (defaultNextStep) {
            opportunity.next_step = defaultNextStep;
        }
        if (defaultDescription) {
            opportunity.description = defaultDescription;
        }
    }

    let companies = [];
    let leads = [];
    let contacts = [];
    let competitors = [];
    try {
        const response = await fetch('tables/companies?limit=1000');
        if (response.ok) {
            const data = await response.json();
            companies = Array.isArray(data.data) ? data.data : [];
        }
    } catch (error) {
        console.warn('Unable to fetch companies for opportunity form:', error);
    }

    try {
        const response = await fetch('tables/leads?limit=1000');
        if (response.ok) {
            const data = await response.json();
            leads = Array.isArray(data.data) ? data.data : [];
        }
    } catch (error) {
        console.warn('Unable to fetch leads for opportunity form:', error);
    }

    try {
        const response = await fetch('tables/contacts?limit=1000');
        if (response.ok) {
            const data = await response.json();
            contacts = Array.isArray(data.data) ? data.data : [];
        }
    } catch (error) {
        console.warn('Unable to fetch contacts for opportunity form:', error);
    }

    try {
        const response = await fetch('tables/competitors?limit=1000');
        if (response.ok) {
            const data = await response.json();
            competitors = Array.isArray(data.data) ? data.data : [];
        }
    } catch (error) {
        console.warn('Unable to fetch competitors for opportunity form:', error);
    }

    if (typeof updateCompanyDirectory === 'function') {
        updateCompanyDirectory(companies, { merge: true });
    }
    if (typeof updateContactDirectory === 'function') {
        updateContactDirectory(contacts, { merge: true });
    }

    const opportunityStageEntries = getDictionaryEntries('opportunities', 'stages', SALES_STAGE_ORDER);
    const normalizedOpportunityStageEntries = opportunityStageEntries
        .map(entry => normalizeDictionaryEntry(entry))
        .filter(Boolean);
    const fallbackStage = normalizedOpportunityStageEntries[0]?.value || (SALES_STAGE_ORDER[0] || 'Qualification');
    const initialStageSelection = opportunity.stage || fallbackStage;
    const stageSelectOptions = renderSelectOptions(
        opportunityStageEntries,
        initialStageSelection
    );

    const selectedStage = initialStageSelection;
    const expectedCloseDate = opportunity.expected_close_date
        ? new Date(opportunity.expected_close_date).toISOString().split('T')[0]
        : '';
    const probabilityDefault = STAGE_DEFAULT_PROBABILITY[selectedStage];
    const probabilityValue = opportunity.probability
        ?? (probabilityDefault !== undefined
            ? probabilityDefault
            : (STAGE_DEFAULT_PROBABILITY[fallbackStage] ?? ''));

    const prioritySelectOptions = renderSelectOptions(
        getDictionaryEntries('opportunities', 'priorities'),
        opportunity.priority || 'Medium'
    );

    const companyStatusEntries = getDictionaryEntries('companies', 'statuses');
    const normalizedCompanyStatusEntries = companyStatusEntries
        .map(entry => normalizeDictionaryEntry(entry))
        .filter(Boolean);
    const defaultCompanyStatus = normalizedCompanyStatusEntries.find(entry => entry.value === 'Prospect')?.value
        || normalizedCompanyStatusEntries[0]?.value
        || 'Prospect';
    const newCompanyStatusOptions = renderSelectOptions(
        companyStatusEntries,
        defaultCompanyStatus
    );

    const selectedCompanyId = opportunity.company_id ? String(opportunity.company_id) : '';
    let hasCurrentCompany = false;
    const companyOptionsHtml = companies.map(company => {
        if (!company?.id) {
            return '';
        }
        const id = String(company.id);
        const isSelected = selectedCompanyId && id === selectedCompanyId;
        if (isSelected) {
            hasCurrentCompany = true;
        }
        const label = sanitizeText(company.name || company.website || id);
        return `<option value="${sanitizeText(id)}" ${isSelected ? 'selected' : ''}>${label}</option>`;
    }).join('');

    const fallbackCompanyOption = !hasCurrentCompany && selectedCompanyId && opportunity.company_name
        ? `<option value="${sanitizeText(selectedCompanyId)}" selected>${sanitizeText(opportunity.company_name)}</option>`
        : '';

    const hiddenCompanyName = sanitizeText(opportunity.company_name || '');

    const selectedLeadId = opportunity.lead_id ? String(opportunity.lead_id) : '';
    let hasCurrentLead = false;
    const leadOptionsHtml = leads.map(lead => {
        if (!lead?.id) {
            return '';
        }
        const id = String(lead.id);
        const title = lead.title || 'Untitled Lead';
        const companySuffix = lead.company_name ? ` – ${lead.company_name}` : '';
        const label = sanitizeText(`${title}${companySuffix}`);
        const isSelected = selectedLeadId && id === selectedLeadId;
        if (isSelected) {
            hasCurrentLead = true;
        }
        return `<option value="${sanitizeText(id)}" ${isSelected ? 'selected' : ''}>${label}</option>`;
    }).join('');

    const fallbackLeadOption = !hasCurrentLead && selectedLeadId && opportunity.lead?.title
        ? `<option value="${sanitizeText(selectedLeadId)}" selected>${sanitizeText(opportunity.lead.title)}</option>`
        : '';

    const selectedContactId = opportunity.primary_contact_id ? String(opportunity.primary_contact_id) : '';
    const contactRecords = contacts
        .filter(contact => contact?.id)
        .map(contact => ({
            id: String(contact.id),
            label: ([contact.first_name, contact.last_name].filter(Boolean).join(' ') || contact.email || contact.phone || String(contact.id)),
            companyId: contact.company_id ? String(contact.company_id) : '',
            companyName: contact.company_name || ''
        }));
    const contactRecordIds = new Set(contactRecords.map(record => record.id));
    if (selectedContactId && !contactRecordIds.has(selectedContactId) && opportunity.primary_contact_name) {
        contactRecords.push({
            id: selectedContactId,
            label: opportunity.primary_contact_name,
            companyId: opportunity.company_id ? String(opportunity.company_id) : '',
            companyName: opportunity.company_name || ''
        });
    }
    const hiddenContactName = sanitizeText(opportunity.primary_contact_name || '');

    const selectedCompetitorId = opportunity.competitor_id ? String(opportunity.competitor_id) : '';
    let hasCurrentCompetitor = false;
    const competitorOptionsHtml = competitors.map(competitor => {
        if (!competitor?.id) {
            return '';
        }
        const id = String(competitor.id);
        const labelParts = [competitor.name || 'Competitor'];
        if (competitor.tier) {
            labelParts.push(competitor.tier);
        }
        const label = sanitizeText(labelParts.join(' · '));
        const isSelected = selectedCompetitorId && id === selectedCompetitorId;
        if (isSelected) {
            hasCurrentCompetitor = true;
        }
        return `<option value="${sanitizeText(id)}" ${isSelected ? 'selected' : ''}>${label}</option>`;
    }).join('');

    const fallbackCompetitorOption = !hasCurrentCompetitor && selectedCompetitorId && opportunity.competitor_name
        ? `<option value="${sanitizeText(selectedCompetitorId)}" selected>${sanitizeText(opportunity.competitor_name)}</option>`
        : '';

    const hiddenCompetitorName = sanitizeText(opportunity.competitor_name || '');
    const originalStageValue = sanitizeText(opportunity.stage || '');
    const obsidianNoteValue = sanitizeText(opportunity.obsidian_note || '');
    const contactStatusEntries = getDictionaryEntries('contacts', 'statuses', ['Active', 'Inactive', 'Qualified', 'Customer']);
    const normalizedContactStatusEntries = contactStatusEntries
        .map(entry => normalizeDictionaryEntry(entry))
        .filter(Boolean);
    const defaultContactStatus = normalizedContactStatusEntries.find(entry => entry.value === 'Active')?.value
        || normalizedContactStatusEntries[0]?.value
        || 'Active';
    const newContactStatusOptions = renderSelectOptions(
        contactStatusEntries,
        defaultContactStatus
    );

    showModal(isEdit ? 'Edit Opportunity' : 'Add New Opportunity', `
        <form id="opportunityForm" class="space-y-6">
            <input type="hidden" name="company_name" id="opportunityCompanyName" value="${hiddenCompanyName}">
            <input type="hidden" name="primary_contact_name" id="opportunityPrimaryContactName" value="${hiddenContactName}">
            <input type="hidden" name="competitor_name" id="opportunityCompetitorName" value="${hiddenCompetitorName}">
            <input type="hidden" name="original_stage" value="${originalStageValue}">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div class="md:col-span-2 lg:col-span-1">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Opportunity Name *</label>
                    <input type="text" name="name" value="${sanitizeText(opportunity.name || '')}" required
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Stage</label>
                    <select name="stage" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        ${stageSelectOptions}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select name="priority" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        ${prioritySelectOptions}
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
                    <input type="text" name="assigned_to" value="${sanitizeText(opportunity.assigned_to || currentUser || '')}"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Team member">
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Linked Lead</label>
                <select name="lead_id" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Not linked</option>
                    ${fallbackLeadOption}
                    ${leadOptionsHtml}
                </select>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Company</label>
                <select id="opportunityCompanySelect" name="company_id"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Not linked</option>
                    ${fallbackCompanyOption}
                    ${companyOptionsHtml}
                </select>
                <p class="mt-1 text-xs text-gray-500">Attach this opportunity to an account or create a new one.</p>
                <button type="button" id="opportunityNewCompanyToggle" data-label-create="Create new company" data-label-cancel="Use existing company"
                        class="mt-2 text-sm text-blue-600 hover:text-blue-700">Create new company</button>
                <div id="opportunityNewCompanySection" class="hidden mt-4 space-y-4 border border-blue-100 rounded-lg p-4 bg-blue-50/50">
                    <p class="text-xs text-blue-700">A new company record will be created when you save the opportunity.</p>
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
                    </div>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Primary Contact</label>
                <select id="opportunityContactSelect" name="primary_contact_id"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Not linked</option>
                </select>
                <p class="mt-1 text-xs text-gray-500">Select an existing contact or create a new person without leaving the form.</p>
                <button type="button" id="opportunityNewContactToggle" data-label-create="Create new contact" data-label-cancel="Use existing contact"
                        class="mt-2 text-sm text-blue-600 hover:text-blue-700">Create new contact</button>
                <div id="opportunityNewContactSection" class="hidden mt-4 border border-blue-100 rounded-lg p-4 bg-blue-50/50 space-y-4">
                    <p class="text-xs text-blue-700">A new contact record will be created and linked when you save.</p>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                            <input type="text" name="new_contact_first_name" placeholder="First name"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                            <input type="text" name="new_contact_last_name" placeholder="Last name"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input type="email" name="new_contact_email" placeholder="name@example.com"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                            <input type="tel" name="new_contact_phone" placeholder="+1 (555) 123-4567"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div class="md:col-span-2 lg:col-span-1">
                            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                            <select name="new_contact_status" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                ${newContactStatusOptions}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Competitor</label>
                <select id="opportunityCompetitorSelect" name="competitor_id"
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">Not tracked</option>
                    ${fallbackCompetitorOption}
                    ${competitorOptionsHtml}
                </select>
                <p class="mt-1 text-xs text-gray-500">Identify which competitor is involved in this deal for faster battlecard access.</p>
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

            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Obsidian Note</label>
                <input type="text" name="obsidian_note" value="${obsidianNoteValue}"
                       class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Deals/Opportunity.md">
                <p class="mt-1 text-xs text-gray-500">Link the markdown note inside your Obsidian vault to keep research and documents in sync.</p>
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
    const stageSelect = form.querySelector('select[name="stage"]');
    const probabilityInput = form.querySelector('input[name="probability"]');
    const companySelect = form.querySelector('#opportunityCompanySelect');
    const companyNameInput = form.querySelector('#opportunityCompanyName');
    const newCompanyToggle = form.querySelector('#opportunityNewCompanyToggle');
    const newCompanySection = form.querySelector('#opportunityNewCompanySection');
    const newCompanyNameInput = form.querySelector('input[name="new_company_name"]');
    const companyToggleCreate = newCompanyToggle?.dataset?.labelCreate || 'Create new company';
    const companyToggleCancel = newCompanyToggle?.dataset?.labelCancel || 'Use existing company';
    const contactSelect = form.querySelector('#opportunityContactSelect');
    const contactNameInput = form.querySelector('#opportunityPrimaryContactName');
    const newContactToggle = form.querySelector('#opportunityNewContactToggle');
    const newContactSection = form.querySelector('#opportunityNewContactSection');
    const newContactFirstNameInput = form.querySelector('input[name="new_contact_first_name"]');
    const newContactToggleCreate = newContactToggle?.dataset?.labelCreate || 'Create new contact';
    const newContactToggleCancel = newContactToggle?.dataset?.labelCancel || 'Use existing contact';
    const competitorSelect = form.querySelector('#opportunityCompetitorSelect');
    const competitorNameInput = form.querySelector('#opportunityCompetitorName');
    let lastContactSelection = selectedContactId;

    const syncOpportunityCompanyName = () => {
        if (!companySelect || !companyNameInput) {
            return;
        }
        const option = companySelect.selectedOptions?.[0];
        companyNameInput.value = option ? option.textContent.trim() : '';
    };

    const syncOpportunityContactName = () => {
        if (!contactSelect || !contactNameInput) {
            return;
        }
        const option = contactSelect.selectedOptions?.[0];
        contactNameInput.value = option ? option.textContent.trim() : '';
    };

    const renderContactOptions = companyId => {
        if (!contactSelect) {
            return;
        }
        const normalizedCompanyId = companyId ? String(companyId) : '';
        const selectedValue = contactSelect.value || lastContactSelection || '';
        const matching = normalizedCompanyId
            ? contactRecords.filter(record => record.companyId === normalizedCompanyId)
            : contactRecords.slice();
        const others = normalizedCompanyId
            ? contactRecords.filter(record => record.companyId && record.companyId !== normalizedCompanyId)
            : [];
        const buildLabel = record => {
            const suffix = record.companyName ? ` – ${record.companyName}` : '';
            return `${record.label}${suffix}`;
        };
        const buildOption = record => `<option value="${sanitizeText(record.id)}" ${record.id === selectedValue ? 'selected' : ''}>${sanitizeText(buildLabel(record))}</option>`;
        let optionsHtml = '<option value="">Not linked</option>';
        if (matching.length) {
            optionsHtml += `<optgroup label="Contacts at selected company">${matching.map(buildOption).join('')}</optgroup>`;
        }
        if (others.length) {
            optionsHtml += `<optgroup label="Other contacts">${others.map(buildOption).join('')}</optgroup>`;
        }
        if (!matching.length && !others.length && selectedValue) {
            const fallback = contactRecords.find(record => record.id === selectedValue);
            if (fallback) {
                optionsHtml += buildOption(fallback);
            }
        }
        contactSelect.innerHTML = optionsHtml;
        if (selectedValue) {
            contactSelect.value = selectedValue;
            if (contactSelect.value !== selectedValue) {
                contactSelect.value = '';
                lastContactSelection = '';
            }
        } else {
            contactSelect.value = '';
        }
        syncOpportunityContactName();
    };

    const syncCompetitorName = () => {
        if (!competitorSelect || !competitorNameInput) {
            return;
        }
        const option = competitorSelect.selectedOptions?.[0];
        competitorNameInput.value = option ? option.textContent.trim() : '';
    };

    syncOpportunityCompanyName();
    renderContactOptions(selectedCompanyId);
    syncCompetitorName();

    companySelect?.addEventListener('change', () => {
        if (newCompanySection) {
            newCompanySection.classList.add('hidden');
        }
        if (newCompanyToggle) {
            newCompanyToggle.setAttribute('data-expanded', 'false');
            newCompanyToggle.textContent = companyToggleCreate;
        }
        if (newCompanyNameInput) {
            newCompanyNameInput.value = '';
        }
        syncOpportunityCompanyName();
        renderContactOptions(companySelect.value || '');
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
            newCompanyToggle.textContent = companyToggleCreate;
            syncOpportunityCompanyName();
        } else {
            newCompanySection.classList.remove('hidden');
            newCompanyToggle.setAttribute('data-expanded', 'true');
            newCompanyToggle.textContent = companyToggleCancel;
            if (companySelect) {
                companySelect.value = '';
            }
            if (companyNameInput) {
                companyNameInput.value = '';
            }
            renderContactOptions('');
            if (contactSelect) {
                contactSelect.value = '';
                lastContactSelection = '';
                syncOpportunityContactName();
            }
            newCompanyNameInput?.focus();
        }
    });

    contactSelect?.addEventListener('change', () => {
        lastContactSelection = contactSelect.value;
        syncOpportunityContactName();
    });

    newContactToggle?.addEventListener('click', event => {
        event.preventDefault();
        if (!newContactSection) {
            return;
        }
        const expanded = newContactToggle.getAttribute('data-expanded') === 'true';
        if (expanded) {
            newContactSection.classList.add('hidden');
            newContactToggle.setAttribute('data-expanded', 'false');
            newContactToggle.textContent = newContactToggleCreate;
        } else {
            newContactSection.classList.remove('hidden');
            newContactToggle.setAttribute('data-expanded', 'true');
            newContactToggle.textContent = newContactToggleCancel;
            newContactFirstNameInput?.focus();
        }
    });

    competitorSelect?.addEventListener('change', syncCompetitorName);

    const updateProbabilityForStage = () => {
        if (!stageSelect || !probabilityInput) {
            return;
        }

        const stage = stageSelect.value;
        const defaultValue = STAGE_DEFAULT_PROBABILITY[stage];
        if (defaultValue === 0 || defaultValue === 100) {
            probabilityInput.value = String(defaultValue ?? '');
            probabilityInput.setAttribute('readonly', 'readonly');
            return;
        }

        probabilityInput.removeAttribute('readonly');
        if (!probabilityInput.value || probabilityInput.value === '0' || probabilityInput.value === '100') {
            if (defaultValue !== undefined && defaultValue !== null) {
                probabilityInput.value = String(defaultValue);
            }
        }
    };

    stageSelect?.addEventListener('change', updateProbabilityForStage);
    updateProbabilityForStage();

    form.addEventListener('submit', async event => {
        event.preventDefault();
        await saveOpportunity(oppId, new FormData(form));
    });
}

async function saveOpportunity(oppId, formData) {
    const formValues = {};
    for (const [key, value] of formData.entries()) {
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed) {
                formValues[key] = trimmed;
            }
        } else if (value !== undefined && value !== null) {
            formValues[key] = value;
        }
    }

    if (!formValues.name) {
        showToast('Opportunity name is required', 'error');
        return;
    }

    if (!formValues.stage) {
        formValues.stage = SALES_STAGE_ORDER[0] || 'Qualification';
    }

    const originalStage = formValues.original_stage || '';

    let companyLink = null;
    if (typeof ensureCompanyAssociation === 'function') {
        companyLink = await ensureCompanyAssociation({
            selectedId: formValues.company_id,
            companyName: formValues.company_name,
            newCompany: {
                name: formValues.new_company_name,
                website: formValues.new_company_website,
                industry: formValues.new_company_industry,
                status: formValues.new_company_status
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

    const readTrimmedValue = key => {
        const value = formData.get(key);
        return typeof value === 'string' ? value.trim() : '';
    };

    let contactLink = null;
    if (typeof ensureContactAssociation === 'function') {
        const newContactData = {
            firstName: readTrimmedValue('new_contact_first_name'),
            lastName: readTrimmedValue('new_contact_last_name'),
            email: readTrimmedValue('new_contact_email'),
            phone: readTrimmedValue('new_contact_phone'),
            status: readTrimmedValue('new_contact_status') || 'Active'
        };

        contactLink = await ensureContactAssociation({
            selectedId: formValues.primary_contact_id,
            newContact: newContactData,
            companyLink,
            originLeadId: formValues.lead_id
        });
    }

    if (contactLink?.contact_id) {
        formValues.primary_contact_id = contactLink.contact_id;
        const contactRecord = contactLink.contact;
        if (contactRecord) {
            const fullName = [contactRecord.first_name, contactRecord.last_name]
                .filter(Boolean)
                .join(' ')
                .trim();
            const fallback = contactRecord.email || contactRecord.phone || contactRecord.id;
            if (fullName || fallback) {
                formValues.primary_contact_name = fullName || fallback;
            }
        }
    } else {
        if (!formValues.primary_contact_id) {
            delete formValues.primary_contact_id;
        }
        if (!formValues.primary_contact_name) {
            delete formValues.primary_contact_name;
        }
    }

    delete formValues.new_contact_first_name;
    delete formValues.new_contact_last_name;
    delete formValues.new_contact_email;
    delete formValues.new_contact_phone;
    delete formValues.new_contact_status;

    if (!formValues.lead_id) {
        delete formValues.lead_id;
    }

    if (!formValues.competitor_id) {
        delete formValues.competitor_id;
        delete formValues.competitor_name;
    } else if (!formValues.competitor_name) {
        delete formValues.competitor_name;
    }

    formValues.priority = formValues.priority
        ? formValues.priority.charAt(0).toUpperCase() + formValues.priority.slice(1).toLowerCase()
        : 'Medium';
    const allowedPriorities = new Set(['Low', 'Medium', 'High', 'Critical']);
    if (!allowedPriorities.has(formValues.priority)) {
        formValues.priority = 'Medium';
    }

    if (!formValues.obsidian_note) {
        delete formValues.obsidian_note;
    }

    delete formValues.original_stage;

    if (typeof formValues.value === 'string') {
        const numericValue = Number(formValues.value.replace(/[^0-9.\-]/g, ''));
        if (Number.isFinite(numericValue)) {
            formValues.value = numericValue;
        } else {
            delete formValues.value;
        }
    }

    if (typeof formValues.probability === 'string') {
        const numericProbability = Number(formValues.probability);
        if (Number.isFinite(numericProbability)) {
            formValues.probability = Math.min(100, Math.max(0, Math.round(numericProbability)));
        } else {
            delete formValues.probability;
        }
    }

    if (formValues.stage === 'Closed Won') {
        formValues.probability = 100;
    } else if (formValues.stage === 'Closed Lost') {
        formValues.probability = 0;
    }

    if (formValues.expected_close_date) {
        const parsedDate = new Date(formValues.expected_close_date);
        if (Number.isNaN(parsedDate.getTime())) {
            delete formValues.expected_close_date;
        }
    }

    const nowIso = new Date().toISOString();
    formValues.updated_at = nowIso;
    if (!oppId) {
        formValues.created_at = nowIso;
        formValues.created_by = currentUser;
    }

    showLoading();
    try {
        const method = oppId ? 'PUT' : 'POST';
        const url = oppId ? `tables/opportunities/${oppId}` : 'tables/opportunities';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formValues)
        });

        if (!response.ok) {
            throw new Error('Save failed');
        }

        const savedOpportunity = await response.json();
        showToast(oppId ? 'Opportunity updated successfully' : 'Opportunity created successfully', 'success');

        const reopenOpportunityId = window.opportunityModalState && window.opportunityModalState.reopenAfterForm
            ? (window.opportunityModalState.currentId || savedOpportunity?.id || oppId)
            : null;
        if (window.opportunityModalState) {
            window.opportunityModalState.reopenAfterForm = false;
        }

        closeModal();

        await handleOpportunityStageAutomation(savedOpportunity, originalStage);
        await loadOpportunities();
        if (reopenOpportunityId) {
            await viewOpportunity(reopenOpportunityId);
        }
    } catch (error) {
        console.error('Error saving opportunity:', error);
        showToast('Failed to save opportunity', 'error');
    } finally {
        hideLoading();
    }
}



async function handleOpportunityStageAutomation(opportunity, originalStage) {
    if (!opportunity) {
        return;
    }

    const currentStage = (opportunity.stage || '').toString().trim();
    if (!currentStage) {
        return;
    }

    const previousStage = (originalStage || '').toString().trim();
    if (currentStage === previousStage) {
        return;
    }

    try {
        if (currentStage === 'Closed Won' && previousStage !== 'Closed Won') {
            await runClosedWonAutomation(opportunity);
        } else if (currentStage === 'Closed Lost' && previousStage !== 'Closed Lost') {
            await runClosedLostAutomation(opportunity);
        }
    } catch (error) {
        console.error('Opportunity stage automation failed:', error);
    }
}

async function runClosedWonAutomation(opportunity) {
    const opportunityId = opportunity?.id;
    if (!opportunityId) {
        return;
    }

    const companyId = opportunity.company_id ? String(opportunity.company_id) : '';
    const companyName = opportunity.company_name || '';
    const contactId = opportunity.primary_contact_id ? String(opportunity.primary_contact_id) : '';
    const contactName = opportunity.primary_contact_name || '';
    const competitorName = opportunity.competitor_name || '';
    const assignedOwner = opportunity.assigned_to || currentUser || 'Sales Team';
    const now = new Date();

    const taskTemplates = [
        {
            key: 'kickoff',
            title: companyName ? `Kickoff with ${companyName}` : 'Kickoff customer onboarding',
            description: 'Schedule the implementation kickoff and confirm success metrics with the customer team.',
            type: 'Meeting',
            priority: 'High',
            dueInDays: 3
        },
        {
            key: 'handoff',
            title: 'Internal handoff to delivery',
            description: 'Share scope, expectations, and timelines with the delivery / onboarding pod.',
            type: 'Task',
            priority: 'Medium',
            dueInDays: 2
        },
        {
            key: 'success-plan',
            title: companyName ? `Publish success plan for ${companyName}` : 'Publish customer success plan',
            description: 'Document onboarding checklist, stakeholders, and key milestones in the shared workspace / Obsidian vault.',
            type: 'Documentation',
            priority: 'Medium',
            dueInDays: 7
        }
    ];

    for (const template of taskTemplates) {
        const automationKey = `${opportunityId}::closed-won::${template.key}`;
        const existing = await fetchAutomationRecords('tasks', { automation_key: automationKey });
        if (existing.length) {
            continue;
        }

        const dueDate = Number.isFinite(template.dueInDays)
            ? formatDateOnlyIso(new Date(now.getTime() + template.dueInDays * 24 * 60 * 60 * 1000))
            : undefined;

        const payload = cleanAutomationPayload({
            title: template.title,
            description: template.description,
            type: template.type,
            priority: template.priority,
            status: 'Not Started',
            due_date: dueDate,
            assigned_to: assignedOwner,
            related_to: opportunityId,
            opportunity_id: opportunityId,
            company_id: companyId || undefined,
            company_name: companyName || undefined,
            contact_id: contactId || undefined,
            contact_name: contactName || undefined,
            automation_key: automationKey,
            automation_label: 'Closed Won Playbook'
        });

        await createAutomationRecord('tasks', payload);
    }

    const activityKey = `${opportunityId}::closed-won::summary`;
    const existingActivity = await fetchAutomationRecords('activities', { automation_key: activityKey });
    if (!existingActivity.length) {
        const summaryLines = [
            `Opportunity "${opportunity.name || opportunityId}" marked as Closed Won.`,
            companyName ? `Account: ${companyName}` : null,
            contactName ? `Primary contact: ${contactName}` : null,
            competitorName ? `Competitive context: ${competitorName}` : null,
            opportunity.obsidian_note ? `Obsidian note: ${opportunity.obsidian_note}` : null
        ].filter(Boolean);

        const activityPayload = cleanAutomationPayload({
            type: 'Note',
            subject: `Won: ${opportunity.name || companyName || opportunityId}`,
            description: summaryLines.join('\\n'),
            date: new Date().toISOString(),
            outcome: 'Completed',
            assigned_to: assignedOwner,
            related_to: opportunityId,
            opportunity_id: opportunityId,
            company_id: companyId || undefined,
            company_name: companyName || undefined,
            contact_id: contactId || undefined,
            contact_name: contactName || undefined,
            automation_key: activityKey,
            automation_label: 'Closed Won Playbook'
        });

        await createAutomationRecord('activities', activityPayload);
    }

    if (companyId) {
        await ensureCompanyCustomerStatus(companyId);
    }
}

async function runClosedLostAutomation(opportunity) {
    const opportunityId = opportunity?.id;
    if (!opportunityId) {
        return;
    }

    const companyId = opportunity.company_id ? String(opportunity.company_id) : '';
    const companyName = opportunity.company_name || '';
    const contactName = opportunity.primary_contact_name || '';
    const competitorName = opportunity.competitor_name || '';
    const assignedOwner = opportunity.assigned_to || currentUser || 'Sales Team';
    const now = new Date();

    const taskTemplates = [
        {
            key: 'loss-review',
            title: companyName ? `Run loss review for ${companyName}` : 'Run loss review session',
            description: 'Gather the core team for a quick retrospective and capture improvement actions.',
            type: 'Follow-up',
            priority: 'Medium',
            dueInDays: 5
        }
    ];

    if (competitorName) {
        taskTemplates.push({
            key: 'battlecard-update',
            title: `Update battlecard vs ${competitorName}`,
            description: 'Document learnings from this loss and refresh competitive positioning materials.',
            type: 'Research',
            priority: 'High',
            dueInDays: 7
        });
    }

    for (const template of taskTemplates) {
        const automationKey = `${opportunityId}::closed-lost::${template.key}`;
        const existing = await fetchAutomationRecords('tasks', { automation_key: automationKey });
        if (existing.length) {
            continue;
        }

        const dueDate = Number.isFinite(template.dueInDays)
            ? formatDateOnlyIso(new Date(now.getTime() + template.dueInDays * 24 * 60 * 60 * 1000))
            : undefined;

        const payload = cleanAutomationPayload({
            title: template.title,
            description: template.description,
            type: template.type,
            priority: template.priority,
            status: 'Not Started',
            due_date: dueDate,
            assigned_to: assignedOwner,
            related_to: opportunityId,
            opportunity_id: opportunityId,
            company_id: companyId || undefined,
            company_name: companyName || undefined,
            automation_key: automationKey,
            automation_label: 'Closed Lost Follow-up'
        });

        await createAutomationRecord('tasks', payload);
    }

    const activityKey = `${opportunityId}::closed-lost::summary`;
    const existingActivity = await fetchAutomationRecords('activities', { automation_key: activityKey });
    if (!existingActivity.length) {
        const summaryLines = [
            `Opportunity "${opportunity.name || opportunityId}" marked as Closed Lost.`,
            companyName ? `Account: ${companyName}` : null,
            contactName ? `Primary contact: ${contactName}` : null,
            competitorName ? `Competitive pressure: ${competitorName}` : null,
            opportunity.next_step ? `Next step: ${opportunity.next_step}` : null,
            opportunity.obsidian_note ? `Reference note: ${opportunity.obsidian_note}` : null
        ].filter(Boolean);

        const payload = cleanAutomationPayload({
            type: 'Note',
            subject: `Lost: ${opportunity.name || companyName || opportunityId}`,
            description: summaryLines.join('\\n'),
            date: new Date().toISOString(),
            outcome: 'Completed',
            assigned_to: assignedOwner,
            related_to: opportunityId,
            opportunity_id: opportunityId,
            company_id: companyId || undefined,
            company_name: companyName || undefined,
            automation_key: activityKey,
            automation_label: 'Closed Lost Follow-up'
        });

        await createAutomationRecord('activities', payload);
    }
}

async function fetchAutomationRecords(entity, params = {}) {
    try {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value);
            }
        });
        if (!searchParams.has('limit')) {
            searchParams.set('limit', '200');
        }
        const query = searchParams.toString();
        const url = query ? `tables/${entity}?${query}` : `tables/${entity}`;
        const response = await fetch(url);
        if (!response.ok) {
            return [];
        }
        const payload = await response.json();
        if (Array.isArray(payload?.data)) {
            return payload.data;
        }
        if (Array.isArray(payload)) {
            return payload;
        }
        return [];
    } catch (error) {
        console.warn('Automation lookup failed for', entity, params, error);
        return [];
    }
}

async function createAutomationRecord(entity, payload) {
    const prepared = cleanAutomationPayload(payload);
    if (!prepared || !Object.keys(prepared).length) {
        return null;
    }
    try {
        const response = await fetch(`tables/${entity}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(prepared)
        });
        if (!response.ok) {
            throw new Error('Request failed');
        }
        const record = await response.json();
        return record;
    } catch (error) {
        console.error(`Failed to create automation record for ${entity}:`, error);
        return null;
    }
}

async function ensureCompanyCustomerStatus(companyId) {
    if (!companyId) {
        return;
    }
    try {
        const response = await fetch(`tables/companies/${encodeURIComponent(companyId)}`);
        if (!response.ok) {
            return;
        }
        const company = await response.json();
        if (company.status === 'Customer') {
            return;
        }
        const updatePayload = {
            status: 'Customer',
            updated_at: new Date().toISOString()
        };
        const updateResponse = await fetch(`tables/companies/${encodeURIComponent(companyId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatePayload)
        });
        if (updateResponse.ok) {
            const updated = await updateResponse.json();
            if (typeof updateCompanyDirectory === 'function') {
                updateCompanyDirectory([updated], { merge: true });
            }
        }
    } catch (error) {
        console.warn('Failed to ensure company customer status', companyId, error);
    }
}

function formatDateOnlyIso(value) {
    if (!value) {
        return '';
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }
    return date.toISOString().split('T')[0];
}

function cleanAutomationPayload(payload) {
    if (!payload || typeof payload !== 'object') {
        return {};
    }
    const result = {};
    Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) {
            return;
        }
        if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed) {
                result[key] = trimmed;
            }
        } else {
            result[key] = value;
        }
    });
    return result;
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

function safeText(value) {
    if (typeof sanitizeText === 'function') {
        return sanitizeText(value);
    }
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

const RELATED_LINK_TYPES = [
    {
        type: 'deal',
        datasetKey: 'opportunities',
        prefix: 'opp',
        label: 'Deal',
        pluralLabel: 'Deals',
        getDisplayName(record = {}) {
            const name = record?.name || 'Untitled Deal';
            const companySuffix = record?.company_name ? ` – ${record.company_name}` : '';
            return `${name}${companySuffix}`;
        }
    },
    {
        type: 'lead',
        datasetKey: 'leads',
        prefix: 'lead',
        label: 'Lead',
        pluralLabel: 'Leads',
        getDisplayName(record = {}) {
            const title = record?.title || 'Untitled Lead';
            const companySuffix = record?.company_name ? ` – ${record.company_name}` : '';
            return `${title}${companySuffix}`;
        }
    },
    {
        type: 'company',
        datasetKey: 'companies',
        prefix: 'company',
        label: 'Company',
        pluralLabel: 'Companies',
        getDisplayName(record = {}) {
            return record?.name || 'Company';
        }
    },
    {
        type: 'contact',
        datasetKey: 'contacts',
        prefix: 'contact',
        label: 'Contact',
        pluralLabel: 'Contacts',
        getDisplayName(record = {}) {
            const fullName = [record?.first_name, record?.last_name]
                .filter(Boolean)
                .join(' ')
                .trim();
            const fallback = record?.email || record?.phone || 'Contact';
            const companySuffix = record?.company_name ? ` – ${record.company_name}` : '';
            return `${fullName || fallback}${companySuffix}`;
        }
    },
    {
        type: 'competitor',
        datasetKey: 'competitors',
        prefix: 'competitor',
        label: 'Competitor',
        pluralLabel: 'Competitors',
        getDisplayName(record = {}) {
            return record?.name || 'Competitor';
        }
    }
];

const RELATED_LINK_TYPE_BY_TYPE = new Map(RELATED_LINK_TYPES.map(config => [config.type, config]));
const RELATED_LINK_TYPE_BY_PREFIX = new Map(RELATED_LINK_TYPES.map(config => [config.prefix, config]));
const RELATED_LINK_TYPE_BY_DATASET = new Map(RELATED_LINK_TYPES.map(config => [config.datasetKey, config]));

const relatedRecordsCache = {
    data: null,
    promise: null
};

function getRelatedLinkConfigByType(type) {
    if (!type) {
        return null;
    }
    return RELATED_LINK_TYPE_BY_TYPE.get(type) || null;
}

function getRelatedLinkConfigByPrefix(prefix) {
    if (!prefix) {
        return null;
    }
    return RELATED_LINK_TYPE_BY_PREFIX.get(prefix) || null;
}

function detectRelatedTypeFromValue(value) {
    const normalized = normalizeRelatedFieldValue(value);
    if (!normalized) {
        return '';
    }
    const [prefix] = normalized.split('-');
    const config = getRelatedLinkConfigByPrefix(prefix);
    return config ? config.type : '';
}

function buildRelatedTypeSelectOptions(selectedType = '', options = {}) {
    const {
        includeNoneOption = true,
        noneLabel = 'Not linked'
    } = options || {};

    const normalizedSelected = selectedType || '';
    const parts = [];
    if (includeNoneOption) {
        parts.push(`<option value="">${safeText(noneLabel)}</option>`);
    }
    RELATED_LINK_TYPES.forEach(config => {
        const isSelected = normalizedSelected === config.type;
        parts.push(`<option value="${config.type}" ${isSelected ? 'selected' : ''}>${safeText(config.label)}</option>`);
    });
    return parts.join('');
}

function buildRelatedRecordOptionsForType(dataset, type, selectedValue, options = {}) {
    const config = getRelatedLinkConfigByType(type);
    if (!config) {
        const fallbackLabel = options.placeholderLabel || 'Select related record';
        return {
            html: `<option value="">${safeText(fallbackLabel)}</option>`,
            disabled: true
        };
    }

    const records = Array.isArray(dataset?.[config.datasetKey]) ? dataset[config.datasetKey] : [];
    const normalizedSelected = normalizeRelatedFieldValue(selectedValue);
    const includeAllOption = Boolean(options.includeAllOption);
    const placeholderLabel = includeAllOption
        ? options.allLabel || `All ${config.pluralLabel || `${config.label}s`}`
        : options.placeholderLabel || `Select ${config.label.toLowerCase()}`;

    const optionParts = [`<option value="">${safeText(placeholderLabel)}</option>`];
    let hasSelected = false;

    records.forEach(record => {
        const value = normalizeRelatedFieldValue(record?.id);
        if (!value) {
            return;
        }
        const isSelected = normalizedSelected && value === normalizedSelected;
        if (isSelected) {
            hasSelected = true;
        }
        optionParts.push(`<option value="${value}" ${isSelected ? 'selected' : ''}>${safeText(config.getDisplayName(record))}</option>`);
    });

    if (normalizedSelected && !hasSelected) {
        optionParts.splice(1, 0, `<option value="${normalizedSelected}" selected>Current link (${safeText(normalizedSelected)})</option>`);
    }

    const disabled = records.length === 0 && !hasSelected;
    return {
        html: optionParts.join(''),
        disabled
    };
}

function updateRelatedRecordSelect(selectElement, dataset, typeValue, selectedValue, options = {}) {
    if (!selectElement) {
        return;
    }

    const normalizedType = typeValue || '';
    if (!normalizedType) {
        const label = options.noTypeLabel || 'Select related type first';
        selectElement.innerHTML = `<option value="">${safeText(label)}</option>`;
        selectElement.disabled = true;
        selectElement.value = '';
        return;
    }

    if (normalizedType === 'unlinked') {
        const label = options.unlinkedLabel || 'Unlinked only';
        selectElement.innerHTML = `<option value="">${safeText(label)}</option>`;
        selectElement.disabled = true;
        selectElement.value = '';
        return;
    }

    const config = getRelatedLinkConfigByType(normalizedType);
    if (!config) {
        const label = options.placeholderLabel || 'Select related record';
        selectElement.innerHTML = `<option value="">${safeText(label)}</option>`;
        selectElement.disabled = true;
        selectElement.value = '';
        return;
    }

    const { html, disabled } = buildRelatedRecordOptionsForType(dataset, normalizedType, selectedValue, {
        includeAllOption: options.includeAllOption,
        allLabel: options.allLabel,
        placeholderLabel: options.placeholderLabel
    });

    selectElement.innerHTML = html;
    selectElement.disabled = disabled;

    if (selectedValue) {
        selectElement.value = selectedValue;
        if (selectElement.value !== selectedValue) {
            selectElement.value = '';
        }
    }
}

function resolveRelatedRecordDisplay(value, dataset) {
    const normalized = normalizeRelatedFieldValue(value);
    if (!normalized) {
        return null;
    }
    const [prefix] = normalized.split('-');
    const config = getRelatedLinkConfigByPrefix(prefix);
    if (!config) {
        return {
            label: normalized,
            typeLabel: 'Linked',
            value: normalized
        };
    }

    const records = Array.isArray(dataset?.[config.datasetKey]) ? dataset[config.datasetKey] : [];
    const record = records.find(item => normalizeRelatedFieldValue(item?.id) === normalized);
    const label = record ? config.getDisplayName(record) : normalized;

    return {
        label,
        typeLabel: config.label,
        value: normalized
    };
}

function filterItemsByRelation(items, relationTypeValue, relationRecordValue) {
    const normalizedRecord = normalizeRelatedFieldValue(relationRecordValue);
    const normalizedType = relationTypeValue || '';

    if (!Array.isArray(items)) {
        return [];
    }

    if (!normalizedType && !normalizedRecord) {
        return items.slice();
    }

    return items.filter(item => {
        const relatedValue = normalizeRelatedFieldValue(item?.related_to);
        if (normalizedRecord) {
            return relatedValue && relatedValue.toLowerCase() === normalizedRecord.toLowerCase();
        }
        if (normalizedType === 'unlinked') {
            return !relatedValue;
        }
        const config = getRelatedLinkConfigByType(normalizedType);
        if (!config) {
            return false;
        }
        return relatedValue && relatedValue.startsWith(`${config.prefix}-`);
    });
}

function matchesCompanyByRelation(relatedValue, company, context = {}) {
    const normalized = normalizeRelatedFieldValue(relatedValue);
    if (!normalized || !company?.id) {
        return false;
    }
    if (normalized === company.id) {
        return true;
    }

    const [prefix] = normalized.split('-');
    switch (prefix) {
        case 'company':
            return normalized === company.id;
        case 'opp': {
            const deal = context.dealsById?.get(normalized);
            return Boolean(deal && (deal.company_id === company.id || deal.company?.id === company.id));
        }
        case 'lead': {
            const lead = context.leadsById?.get(normalized);
            return Boolean(lead && (lead.company_id === company.id || lead.company_name === company.name));
        }
        case 'contact': {
            const contact = context.contactsById?.get(normalized);
            return Boolean(contact && (contact.company_id === company.id || contact.company_name === company.name));
        }
        default:
            return false;
    }
}

async function fetchRelatedRecordsForLinking(options = {}) {
    const forceRefresh = Boolean(options?.refresh);

    if (!forceRefresh && relatedRecordsCache.data) {
        return relatedRecordsCache.data;
    }
    if (!forceRefresh && relatedRecordsCache.promise) {
        return relatedRecordsCache.promise;
    }

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

    const fetchPromise = (async () => {
        try {
            const [leadsResponse, opportunitiesResponse, companiesResponse, contactsResponse, competitorsResponse] = await Promise.all([
                fetch('tables/leads?limit=1000'),
                fetch('tables/opportunities?limit=1000'),
                fetch('tables/companies?limit=1000'),
                fetch('tables/contacts?limit=1000'),
                fetch('tables/competitors?limit=1000')
            ]);

            const [leads, opportunities, companies, contacts, competitors] = await Promise.all([
                parseListResponse(leadsResponse),
                parseListResponse(opportunitiesResponse),
                parseListResponse(companiesResponse),
                parseListResponse(contactsResponse),
                parseListResponse(competitorsResponse)
            ]);

            const payload = { leads, opportunities, companies, contacts, competitors };
            relatedRecordsCache.data = payload;
            return payload;
        } catch (error) {
            console.warn('Unable to fetch related records for linking:', error);
            const fallback = { leads: [], opportunities: [], companies: [], contacts: [], competitors: [] };
            relatedRecordsCache.data = fallback;
            return fallback;
        } finally {
            relatedRecordsCache.promise = null;
        }
    })();

    relatedRecordsCache.promise = fetchPromise;
    return fetchPromise;
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

async function showTaskForm(taskId = null, options = {}) {
    const isEdit = Boolean(taskId);
    const {
        defaultRelatedType = '',
        defaultRelatedId = ''
    } = options || {};
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

    const relatedDataset = await fetchRelatedRecordsForLinking();
    const existingRelatedValue = normalizeRelatedFieldValue(task.related_to);
    let selectedRelatedType = detectRelatedTypeFromValue(existingRelatedValue);
    let selectedRelatedRecord = existingRelatedValue;

    if (!selectedRelatedType && defaultRelatedType) {
        selectedRelatedType = defaultRelatedType;
    }
    if (!selectedRelatedRecord && defaultRelatedId) {
        selectedRelatedRecord = defaultRelatedId;
    }

    const typeSelectOptions = buildRelatedTypeSelectOptions(selectedRelatedType);
    const relatedConfig = getRelatedLinkConfigByType(selectedRelatedType);
    const relatedPlaceholder = relatedConfig ? `Select ${relatedConfig.label.toLowerCase()}` : 'Select related record';
    const { html: recordOptionsHtml, disabled: recordSelectDisabled } = buildRelatedRecordOptionsForType(
        relatedDataset,
        selectedRelatedType,
        selectedRelatedRecord,
        { placeholderLabel: relatedPlaceholder }
    );

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

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Related Type</label>
                    <select id="taskRelatedType" name="related_type" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        ${typeSelectOptions}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Related Record</label>
                    <select id="taskRelatedRecord" name="related_record" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" ${recordSelectDisabled ? 'disabled' : ''}>
                        ${recordOptionsHtml}
                    </select>
                    <p class="mt-1 text-xs text-gray-500">Link the task to a lead, opportunity, company, contact or competitor to keep context together.</p>
                </div>
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
    if (form) {
        applyDictionaryToSelect(form.querySelector('select[name="status"]'), 'tasks', 'statuses', { selectedValue: selectedStatus });
        applyDictionaryToSelect(form.querySelector('select[name="priority"]'), 'tasks', 'priorities', { selectedValue: selectedPriority });
        applyDictionaryToSelect(form.querySelector('select[name="type"]'), 'tasks', 'types', { selectedValue: selectedType });
    }

    const relatedTypeSelect = document.getElementById('taskRelatedType');
    const relatedRecordSelect = document.getElementById('taskRelatedRecord');

    if (relatedTypeSelect && relatedRecordSelect) {
        const refreshRecordOptions = async (valueToSelect = '') => {
            const dataset = await fetchRelatedRecordsForLinking();
            const currentType = relatedTypeSelect.value;
            const config = getRelatedLinkConfigByType(currentType);
            const placeholder = config ? `Select ${config.label.toLowerCase()}` : 'Select related record';
            updateRelatedRecordSelect(relatedRecordSelect, dataset, currentType, valueToSelect, {
                placeholderLabel: placeholder
            });
        };

        relatedTypeSelect.addEventListener('change', () => {
            refreshRecordOptions('');
        });
    }

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

    if (data.related_record) {
        data.related_to = data.related_record;
    } else {
        delete data.related_to;
    }
    delete data.related_record;
    delete data.related_type;

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

async function showActivityForm(activityId = null, options = {}) {
    const isEdit = Boolean(activityId);
    const {
        defaultRelatedType = '',
        defaultRelatedId = ''
    } = options || {};
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
    const relatedDataset = await fetchRelatedRecordsForLinking();
    const existingRelatedValue = normalizeRelatedFieldValue(activity.related_to);
    let selectedRelatedType = detectRelatedTypeFromValue(existingRelatedValue);
    let selectedRelatedRecord = existingRelatedValue;

    if (!selectedRelatedType && defaultRelatedType) {
        selectedRelatedType = defaultRelatedType;
    }
    if (!selectedRelatedRecord && defaultRelatedId) {
        selectedRelatedRecord = defaultRelatedId;
    }

    const typeSelectOptions = buildRelatedTypeSelectOptions(selectedRelatedType);
    const relatedConfig = getRelatedLinkConfigByType(selectedRelatedType);
    const relatedPlaceholder = relatedConfig ? `Select ${relatedConfig.label.toLowerCase()}` : 'Select related record';
    const { html: recordOptionsHtml, disabled: recordSelectDisabled } = buildRelatedRecordOptionsForType(
        relatedDataset,
        selectedRelatedType,
        selectedRelatedRecord,
        { placeholderLabel: relatedPlaceholder }
    );

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

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Related Type</label>
                    <select id="activityRelatedType" name="related_type" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        ${typeSelectOptions}
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Related Record</label>
                    <select id="activityRelatedRecord" name="related_record" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" ${recordSelectDisabled ? 'disabled' : ''}>
                        ${recordOptionsHtml}
                    </select>
                    <p class="mt-1 text-xs text-gray-500">Link the activity to a lead, opportunity, company, contact or competitor to keep context together.</p>
                </div>
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

    const activityForm = document.getElementById('activityForm');
    if (activityForm) {
        applyDictionaryToSelect(activityForm.querySelector('select[name="type"]'), 'activities', 'types', { selectedValue: selectedType });
        applyDictionaryToSelect(activityForm.querySelector('select[name="outcome"]'), 'activities', 'outcomes', {
            includeBlank: true,
            blankLabel: 'Not specified',
            blankValue: '',
            selectedValue: selectedOutcome
        });
    }

    const activityRelatedTypeSelect = document.getElementById('activityRelatedType');
    const activityRelatedRecordSelect = document.getElementById('activityRelatedRecord');

    if (activityRelatedTypeSelect && activityRelatedRecordSelect) {
        const refreshRecordOptions = async (valueToSelect = '') => {
            const dataset = await fetchRelatedRecordsForLinking();
            const currentType = activityRelatedTypeSelect.value;
            const config = getRelatedLinkConfigByType(currentType);
            const placeholder = config ? `Select ${config.label.toLowerCase()}` : 'Select related record';
            updateRelatedRecordSelect(activityRelatedRecordSelect, dataset, currentType, valueToSelect, {
                placeholderLabel: placeholder
            });
        };

        activityRelatedTypeSelect.addEventListener('change', () => {
            refreshRecordOptions('');
        });
    }

    activityForm.addEventListener('submit', async event => {
        event.preventDefault();
        await saveActivity(activityId, new FormData(activityForm));
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

    if (data.related_record) {
        data.related_to = data.related_record;
    } else {
        delete data.related_to;
    }
    delete data.related_record;
    delete data.related_type;

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

async function viewOpportunity(id) {
    if (!id) {
        return;
    }
    if (typeof currentView !== 'undefined' && currentView !== 'opportunities') {
        await showOpportunities();
    } else if (!opportunitiesModuleState.opportunities.length) {
        await loadOpportunities();
    }
    selectOpportunity(id);
}
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
    const boardWrapper = document.getElementById('opportunityBoardWrapper');
    const tableWrapper = document.getElementById('opportunityTableWrapper');
    const toggleButton = document.getElementById('viewToggle');

    if (!boardWrapper || !tableWrapper || !toggleButton) {
        showToast('Не вдалося переключити вигляд угод', 'warning');
        return;
    }

    if (opportunitiesModuleState.viewMode === 'board') {
        opportunitiesModuleState.viewMode = 'table';
        boardWrapper.classList.add('hidden');
        tableWrapper.classList.remove('hidden');
        toggleButton.textContent = 'Повернутися до канбану';
    } else {
        opportunitiesModuleState.viewMode = 'board';
        tableWrapper.classList.add('hidden');
        boardWrapper.classList.remove('hidden');
        toggleButton.textContent = 'Перейти до табличного вигляду';
    }
}