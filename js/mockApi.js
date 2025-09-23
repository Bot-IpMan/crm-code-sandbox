// Mock API layer for local demo usage
// Provides in-memory dataset and intercepts fetch requests to `tables/` endpoints
(function() {
    const API_PREFIX = 'tables';
    const originalFetch = window.fetch ? window.fetch.bind(window) : null;

    const mockDatabase = {
        contacts: [
            {
                id: 'contact-1',
                first_name: 'Emily',
                last_name: 'Johnson',
                title: 'Head of Procurement',
                email: 'emily.johnson@techcorp.com',
                phone: '+1 (555) 123-4567',
                mobile: '+1 (555) 555-0123',
                company_id: 'company-1',
                company_name: 'TechCorp Solutions',
                status: 'Active',
                lead_source: 'Referral',
                address: '100 Market Street',
                city: 'San Francisco',
                state: 'CA',
                postal_code: '94105',
                country: 'USA',
                linkedin: 'https://www.linkedin.com/in/emilyjohnson',
                created_by: 'Admin User',
                created_at: '2024-01-10T09:30:00Z',
                updated_at: '2024-05-01T11:15:00Z',
                notes: 'Interested in enterprise analytics package.'
            },
            {
                id: 'contact-2',
                first_name: 'Michael',
                last_name: 'Chen',
                title: 'IT Director',
                email: 'michael.chen@globalmanufacturing.com',
                phone: '+1 (555) 987-6543',
                mobile: '+1 (555) 123-9876',
                company_id: 'company-2',
                company_name: 'Global Manufacturing Inc',
                status: 'Qualified',
                lead_source: 'Website',
                address: '250 Industrial Way',
                city: 'Chicago',
                state: 'IL',
                postal_code: '60601',
                country: 'USA',
                created_by: 'Admin User',
                created_at: '2024-02-18T13:00:00Z',
                updated_at: '2024-04-21T16:30:00Z',
                notes: 'Awaiting follow-up on security requirements.'
            },
            {
                id: 'contact-3',
                first_name: 'Sofia',
                last_name: 'Martinez',
                title: 'Chief Marketing Officer',
                email: 'sofia.martinez@startupxyz.com',
                phone: '+1 (555) 222-3344',
                mobile: '+1 (555) 222-8899',
                company_id: 'company-3',
                company_name: 'StartupXYZ',
                status: 'Customer',
                lead_source: 'Conference',
                address: '88 Innovation Drive',
                city: 'Austin',
                state: 'TX',
                postal_code: '73301',
                country: 'USA',
                created_by: 'Admin User',
                created_at: '2023-11-05T09:00:00Z',
                updated_at: '2024-05-04T15:45:00Z',
                notes: 'Upsell opportunity for premium analytics add-on.'
            },
            {
                id: 'contact-4',
                first_name: 'Daniel',
                last_name: 'Iverson',
                title: 'Operations Manager',
                email: 'daniel.iverson@northwindlogistics.com',
                phone: '+1 (555) 765-4321',
                mobile: '+1 (555) 765-0987',
                company_id: 'company-4',
                company_name: 'Northwind Logistics',
                status: 'Active',
                lead_source: 'Cold Call',
                address: '410 Harbor Blvd',
                city: 'Seattle',
                state: 'WA',
                postal_code: '98101',
                country: 'USA',
                created_by: 'Admin User',
                created_at: '2024-03-01T10:45:00Z',
                updated_at: '2024-04-28T08:20:00Z',
                notes: 'Considering pilot program starting next quarter.'
            }
        ],
        companies: [
            {
                id: 'company-1',
                name: 'TechCorp Solutions',
                industry: 'Software',
                size: '500-1000',
                website: 'https://techcorp.com',
                phone: '+1 (555) 111-2222',
                email: 'info@techcorp.com',
                status: 'Customer',
                annual_revenue: 1250000,
                city: 'San Francisco',
                state: 'CA',
                country: 'USA',
                created_at: '2023-09-12T10:00:00Z',
                updated_at: '2024-04-18T15:00:00Z'
            },
            {
                id: 'company-2',
                name: 'Global Manufacturing Inc',
                industry: 'Manufacturing',
                size: '1000+',
                website: 'https://globalmanufacturing.com',
                phone: '+1 (555) 333-4444',
                email: 'contact@globalmanufacturing.com',
                status: 'Prospect',
                annual_revenue: 2250000,
                city: 'Chicago',
                state: 'IL',
                country: 'USA',
                created_at: '2024-01-02T09:30:00Z',
                updated_at: '2024-05-05T14:00:00Z'
            },
            {
                id: 'company-3',
                name: 'StartupXYZ',
                industry: 'Technology',
                size: '50-100',
                website: 'https://startupxyz.com',
                phone: '+1 (555) 555-1212',
                email: 'hello@startupxyz.com',
                status: 'Customer',
                annual_revenue: 480000,
                city: 'Austin',
                state: 'TX',
                country: 'USA',
                created_at: '2023-05-22T11:15:00Z',
                updated_at: '2024-04-11T09:45:00Z'
            },
            {
                id: 'company-4',
                name: 'Northwind Logistics',
                industry: 'Transportation',
                size: '200-500',
                website: 'https://northwindlogistics.com',
                phone: '+1 (555) 777-8888',
                email: 'support@northwindlogistics.com',
                status: 'Prospect',
                annual_revenue: 915000,
                city: 'Seattle',
                state: 'WA',
                country: 'USA',
                created_at: '2024-02-14T08:45:00Z',
                updated_at: '2024-05-02T17:30:00Z'
            }
        ],
        leads: [
            {
                id: 'lead-1',
                title: 'Enterprise Analytics Rollout',
                description: 'Company-wide analytics implementation for manufacturing division.',
                value: 75000,
                status: 'Qualified',
                priority: 'High',
                probability: 60,
                expected_close_date: '2024-07-15',
                assigned_to: 'Emily Johnson',
                company_name: 'Global Manufacturing Inc',
                source: 'Website',
                created_at: '2024-03-05T12:00:00Z',
                updated_at: '2024-05-03T16:00:00Z'
            },
            {
                id: 'lead-2',
                title: 'Customer Portal Redesign',
                description: 'Improve onboarding workflow and support experience for partners.',
                value: 52000,
                status: 'Contacted',
                priority: 'Medium',
                probability: 40,
                expected_close_date: '2024-06-20',
                assigned_to: 'Michael Chen',
                company_name: 'Northwind Logistics',
                source: 'Referral',
                created_at: '2024-03-22T10:30:00Z',
                updated_at: '2024-05-04T09:20:00Z'
            },
            {
                id: 'lead-3',
                title: 'Marketing Automation Pilot',
                description: 'Pilot program for marketing automation workflows.',
                value: 28000,
                status: 'Proposal',
                priority: 'High',
                probability: 55,
                expected_close_date: '2024-05-31',
                assigned_to: 'Sofia Martinez',
                company_name: 'StartupXYZ',
                source: 'Conference',
                created_at: '2024-02-10T09:45:00Z',
                updated_at: '2024-05-01T14:10:00Z'
            }
        ],
        opportunities: [
            {
                id: 'opp-1',
                name: 'Cloud Infrastructure Migration',
                stage: 'Negotiation',
                value: 95000,
                probability: 70,
                expected_close_date: '2024-07-30',
                company_name: 'Global Manufacturing Inc',
                assigned_to: 'Michael Chen',
                next_step: 'Finalize security review with IT team',
                description: 'Lift-and-shift of legacy workloads to hybrid cloud.'
            },
            {
                id: 'opp-2',
                name: 'Customer Success Platform Expansion',
                stage: 'Proposal',
                value: 62000,
                probability: 55,
                expected_close_date: '2024-06-18',
                company_name: 'TechCorp Solutions',
                assigned_to: 'Emily Johnson',
                next_step: 'Send revised pricing options',
                description: 'Expansion of existing success platform to additional regions.'
            },
            {
                id: 'opp-3',
                name: 'Logistics Optimization Suite',
                stage: 'Qualification',
                value: 41000,
                probability: 30,
                expected_close_date: '2024-08-05',
                company_name: 'Northwind Logistics',
                assigned_to: 'Daniel Iverson',
                next_step: 'Schedule discovery workshop',
                description: 'Optimization algorithms for routing and fleet management.'
            },
            {
                id: 'opp-4',
                name: 'Startup Growth Advisory',
                stage: 'Closed Won',
                value: 38000,
                probability: 100,
                expected_close_date: '2024-04-12',
                company_name: 'StartupXYZ',
                assigned_to: 'Sofia Martinez',
                next_step: 'Kickoff meeting scheduled',
                description: 'Growth advisory retainer for 12 months.'
            },
            {
                id: 'opp-5',
                name: 'Legacy System Support Renewal',
                stage: 'Closed Lost',
                value: 27000,
                probability: 0,
                expected_close_date: '2024-03-22',
                company_name: 'TechCorp Solutions',
                assigned_to: 'Emily Johnson',
                next_step: 'Document lessons learned',
                description: 'Renewal opportunity lost due to budget constraints.'
            }
        ],
        tasks: [
            {
                id: 'task-1',
                title: 'Prepare migration proposal',
                description: 'Compile infrastructure assessment and migration roadmap for Global Manufacturing.',
                type: 'Proposal',
                priority: 'High',
                status: 'In Progress',
                due_date: '2024-05-25',
                assigned_to: 'Michael Chen',
                related_to: 'opp-1',
                created_at: '2024-05-05T10:00:00Z',
                updated_at: '2024-05-10T08:30:00Z'
            },
            {
                id: 'task-2',
                title: 'Schedule success platform workshop',
                description: 'Coordinate with TechCorp stakeholders for onboarding workshop.',
                type: 'Meeting',
                priority: 'Medium',
                status: 'Not Started',
                due_date: '2024-05-22',
                assigned_to: 'Emily Johnson',
                related_to: 'opp-2',
                created_at: '2024-05-08T09:00:00Z',
                updated_at: '2024-05-08T09:00:00Z'
            },
            {
                id: 'task-3',
                title: 'Draft automation pilot plan',
                description: 'Create pilot success criteria and implementation schedule for StartupXYZ.',
                type: 'Planning',
                priority: 'High',
                status: 'In Progress',
                due_date: '2024-05-28',
                assigned_to: 'Sofia Martinez',
                related_to: 'lead-3',
                created_at: '2024-05-03T14:30:00Z',
                updated_at: '2024-05-09T11:45:00Z'
            },
            {
                id: 'task-4',
                title: 'Complete logistics case study',
                description: 'Gather performance metrics and write summary for Northwind Logistics case study.',
                type: 'Documentation',
                priority: 'Low',
                status: 'Not Started',
                due_date: '2024-06-05',
                assigned_to: 'Content Team',
                related_to: 'company-4',
                created_at: '2024-05-06T07:15:00Z',
                updated_at: '2024-05-06T07:15:00Z'
            }
        ],
        activities: [
            {
                id: 'activity-1',
                type: 'Call',
                subject: 'Discovery call with Global Manufacturing',
                description: 'Discussed scope of migration and compliance requirements.',
                date: '2024-05-12T14:30:00Z',
                duration: 45,
                outcome: 'Positive',
                assigned_to: 'Michael Chen'
            },
            {
                id: 'activity-2',
                type: 'Email',
                subject: 'Proposal sent to TechCorp',
                description: 'Shared updated pricing and implementation timeline.',
                date: '2024-05-10T16:15:00Z',
                outcome: 'Awaiting response',
                assigned_to: 'Emily Johnson'
            },
            {
                id: 'activity-3',
                type: 'Meeting',
                subject: 'Quarterly business review with StartupXYZ',
                description: 'Reviewed KPIs and identified upsell opportunities.',
                date: '2024-05-08T09:00:00Z',
                duration: 60,
                outcome: 'Action items assigned',
                assigned_to: 'Sofia Martinez'
            },
            {
                id: 'activity-4',
                type: 'Note',
                subject: 'Competitive analysis insights',
                description: 'Documented findings from competitor research for logistics sector.',
                date: '2024-05-05T12:45:00Z',
                assigned_to: 'Research Team'
            },
            {
                id: 'activity-5',
                type: 'Task',
                subject: 'Prepare kickoff deck for StartupXYZ',
                description: 'Collect success metrics and milestones for presentation.',
                date: '2024-05-03T11:20:00Z',
                assigned_to: 'Emily Johnson',
                outcome: 'In progress'
            },
            {
                id: 'activity-6',
                type: 'Document',
                subject: 'Uploaded migration readiness checklist',
                description: 'Checklist shared with Global Manufacturing stakeholders.',
                date: '2024-04-30T15:05:00Z',
                assigned_to: 'Michael Chen'
            }
        ]
    };

    const searchFields = {
        contacts: ['first_name', 'last_name', 'email', 'phone', 'company_name', 'title'],
        companies: ['name', 'industry', 'website', 'city', 'country'],
        leads: ['title', 'description', 'assigned_to', 'company_name'],
        opportunities: ['name', 'company_name', 'description'],
        tasks: ['title', 'description', 'assigned_to'],
        activities: ['subject', 'description', 'assigned_to']
    };

    const filterMap = {
        contacts: { status: 'status', source: 'lead_source' },
        companies: { status: 'status', size: 'size', industry: 'industry' },
        leads: { status: 'status', priority: 'priority' },
        tasks: { status: 'status', priority: 'priority', type: 'type' },
        activities: { type: 'type' }
    };

    function normalizeValue(value) {
        return typeof value === 'string' ? value.toLowerCase() : String(value ?? '').toLowerCase();
    }

    function applySearch(entity, records, term) {
        const lowerTerm = term.trim().toLowerCase();
        if (!lowerTerm) return records;
        const fields = searchFields[entity] || [];
        return records.filter(record =>
            fields.some(field => {
                const value = record[field];
                if (value === undefined || value === null) return false;
                return normalizeValue(value).includes(lowerTerm);
            })
        );
    }

    function applyFilters(entity, records, params) {
        const entityFilters = filterMap[entity] || {};
        return records.filter(record => {
            for (const [queryKey, fieldName] of Object.entries(entityFilters)) {
                if (!params.has(queryKey)) continue;
                const filterValue = params.get(queryKey);
                if (!filterValue) continue;
                const recordValue = record[fieldName];
                if (recordValue === undefined || recordValue === null) return false;
                if (normalizeValue(recordValue) !== filterValue.toLowerCase()) {
                    return false;
                }
            }
            return true;
        });
    }

    function applySorting(entity, records, params) {
        const sort = params.get('sort');
        if (!sort) return records;
        const sorted = records.slice();
        if (sort === 'date') {
            sorted.sort((a, b) => new Date(b.date || b.updated_at || 0) - new Date(a.date || a.updated_at || 0));
        } else if (sort === 'created_at') {
            sorted.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
        }
        return sorted;
    }

    function toNumber(value, fallback) {
        const num = Number(value);
        return Number.isFinite(num) && num > 0 ? num : fallback;
    }

    function createJsonResponse(body, status = 200) {
        return {
            ok: status >= 200 && status < 300,
            status,
            json: async () => body,
            text: async () => JSON.stringify(body),
            headers: {
                get(name) {
                    return name && name.toLowerCase() === 'content-type'
                        ? 'application/json'
                        : null;
                }
            }
        };
    }

    function parseBody(init) {
        if (!init || init.body === undefined || init.body === null) {
            return {};
        }
        if (typeof init.body === 'string') {
            try {
                return JSON.parse(init.body);
            } catch (error) {
                console.warn('Mock API: failed to parse body', error);
                return {};
            }
        }
        if (init.body instanceof FormData) {
            const result = {};
            init.body.forEach((value, key) => {
                result[key] = value;
            });
            return result;
        }
        return init.body;
    }

    function resolveCompanyName(companyId) {
        if (!companyId) return undefined;
        const company = mockDatabase.companies.find(item => item.id === companyId);
        return company ? company.name : undefined;
    }

    function enhanceRecord(entity, record) {
        if (entity === 'contacts') {
            const companyName = resolveCompanyName(record.company_id);
            record.company_name = companyName || '';
        }
    }

    function generateId(entity) {
        if (window.crypto?.randomUUID) {
            return `${entity}-${window.crypto.randomUUID()}`;
        }
        return `${entity}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }

    window.fetch = async function(input, init = {}) {
        const request = typeof input === 'string' ? input : input?.url;
        if (typeof request !== 'string') {
            return originalFetch ? originalFetch(input, init) : Promise.reject(new Error('Invalid request'));
        }

        if (!request.includes(`${API_PREFIX}/`)) {
            return originalFetch ? originalFetch(input, init) : Promise.reject(new Error('fetch not available'));
        }

        const base = window.location?.href || 'http://localhost/';
        const url = new URL(request, base);
        const pathParts = url.pathname
            .replace(/^\/+/, '')
            .split('/')
            .filter(Boolean);
        const apiIndex = pathParts.indexOf(API_PREFIX);
        if (apiIndex === -1) {
            return createJsonResponse({ message: 'Not found' }, 404);
        }

        const entity = pathParts[apiIndex + 1];
        const recordId = pathParts[apiIndex + 2];
        if (!entity || !mockDatabase[entity]) {
            return createJsonResponse({ message: 'Unknown entity' }, 404);
        }

        const method = (init.method || (typeof input === 'object' && input.method) || 'GET').toUpperCase();
        const params = url.searchParams;
        const records = mockDatabase[entity];

        if (method === 'GET' && !recordId) {
            let results = records.slice();
            if (params.has('search')) {
                results = applySearch(entity, results, params.get('search'));
            }
            results = applyFilters(entity, results, params);
            results = applySorting(entity, results, params);

            const total = results.length;
            const limit = toNumber(params.get('limit'), total > 0 ? total : 20);
            const page = toNumber(params.get('page'), 1);
            const start = (page - 1) * limit;
            const paginated = start >= total ? results.slice(0, limit) : results.slice(start, start + limit);

            return createJsonResponse({
                data: paginated,
                total,
                limit,
                page
            });
        }

        if (method === 'GET' && recordId) {
            const record = records.find(item => item.id === recordId);
            if (!record) {
                return createJsonResponse({ message: 'Not found' }, 404);
            }
            return createJsonResponse({ ...record });
        }

        if (method === 'POST') {
            const body = parseBody(init);
            const nowIso = new Date().toISOString();
            const newRecord = {
                id: body.id || generateId(entity),
                ...body
            };
            if (!newRecord.created_at) {
                newRecord.created_at = nowIso;
            }
            if (!newRecord.updated_at) {
                newRecord.updated_at = nowIso;
            }
            enhanceRecord(entity, newRecord);
            records.push(newRecord);
            return createJsonResponse(newRecord, 201);
        }

        if (method === 'PUT' && recordId) {
            const body = parseBody(init);
            const index = records.findIndex(item => item.id === recordId);
            if (index === -1) {
                return createJsonResponse({ message: 'Not found' }, 404);
            }
            const updatedRecord = { ...records[index], ...body, id: recordId };
            if (!updatedRecord.updated_at) {
                updatedRecord.updated_at = new Date().toISOString();
            }
            enhanceRecord(entity, updatedRecord);
            records[index] = updatedRecord;
            return createJsonResponse(updatedRecord);
        }

        if (method === 'DELETE' && recordId) {
            const index = records.findIndex(item => item.id === recordId);
            if (index === -1) {
                return createJsonResponse({ message: 'Not found' }, 404);
            }
            records.splice(index, 1);
            return createJsonResponse({ success: true }, 200);
        }

        return createJsonResponse({ message: 'Unsupported operation' }, 400);
    };

    window.mockDatabase = mockDatabase;
})();
