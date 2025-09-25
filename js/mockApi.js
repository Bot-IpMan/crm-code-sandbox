(function(global) {
    const API_PREFIX = 'tables';
    const originalFetch = global.fetch ? global.fetch.bind(global) : null;

    if (!global.DataCore) {
        console.warn('DataCore is not available. Mock API disabled.');
        return;
    }

    const entityDefinitions = {
        companies: {
            searchFields: ['name', 'industry', 'website', 'city', 'country'],
            filterFields: { status: 'status', size: 'size', industry: 'industry' },
            labelFields: ['name'],
            relations: {
                hasMany: [
                    { name: 'contacts', entity: 'contacts', foreignKey: 'company_id' },
                    { name: 'leads', entity: 'leads', foreignKey: 'company_id' },
                    { name: 'deals', entity: 'opportunities', foreignKey: 'company_id' }
                ]
            }
        },
        contacts: {
            searchFields: ['first_name', 'last_name', 'email', 'phone', 'company_name', 'title'],
            filterFields: { status: 'status', source: 'lead_source' },
            getLabel: record => {
                const fullName = [record.first_name, record.last_name]
                    .filter(Boolean)
                    .join(' ')
                    .trim();
                return fullName || record.email || record.id;
            },
            relations: {
                belongsTo: [
                    {
                        name: 'company',
                        entity: 'companies',
                        localKey: 'company_id',
                        fields: { company_name: 'name' },
                        match: { source: 'company_name', target: 'name' }
                    }
                ],
                hasMany: [
                    { name: 'leads', entity: 'leads', foreignKey: 'contact_id' },
                    { name: 'deals', entity: 'opportunities', foreignKey: 'primary_contact_id' }
                ]
            }
        },
        leads: {
            searchFields: ['title', 'description', 'assigned_to', 'company_name'],
            filterFields: { status: 'status', priority: 'priority' },
            relations: {
                belongsTo: [
                    {
                        name: 'company',
                        entity: 'companies',
                        localKey: 'company_id',
                        fields: { company_name: 'name' },
                        match: { source: 'company_name', target: 'name' }
                    },
                    {
                        name: 'contact',
                        entity: 'contacts',
                        localKey: 'contact_id',
                        fields: {
                            contact_name: contact => [contact.first_name, contact.last_name]
                                .filter(Boolean)
                                .join(' ')
                                .trim()
                        }
                    }
                ],
                hasMany: [
                    { name: 'deals', entity: 'opportunities', foreignKey: 'lead_id' }
                ]
            }
        },
        opportunities: {
            aliases: ['deals'],
            searchFields: ['name', 'company_name', 'description', 'stage'],
            filterFields: { stage: 'stage', status: 'status' },
            relations: {
                belongsTo: [
                    {
                        name: 'company',
                        entity: 'companies',
                        localKey: 'company_id',
                        fields: { company_name: 'name' },
                        match: { source: 'company_name', target: 'name' }
                    },
                    {
                        name: 'lead',
                        entity: 'leads',
                        localKey: 'lead_id'
                    },
                    {
                        name: 'contact',
                        entity: 'contacts',
                        localKey: 'primary_contact_id',
                        fields: {
                            primary_contact_name: contact => [contact.first_name, contact.last_name]
                                .filter(Boolean)
                                .join(' ')
                                .trim()
                        }
                    },
                    {
                        name: 'competitor',
                        entity: 'competitors',
                        localKey: 'competitor_id',
                        fields: {
                            competitor_name: 'name',
                            competitor_status: 'status',
                            competitor_tier: 'tier'
                        }
                    }
                ]
            }
        },
        tasks: {
            searchFields: ['title', 'description', 'assigned_to'],
            filterFields: { status: 'status', priority: 'priority', type: 'type' },
            getLabel: record => record.title || record.id
        },
        activities: {
            searchFields: ['subject', 'description', 'assigned_to'],
            filterFields: { type: 'type' },
            getLabel: record => record.subject || record.description || record.id
        },
        competitors: {
            searchFields: ['name', 'industry', 'tier', 'status', 'primary_markets'],
            filterFields: { tier: 'tier', status: 'status' },
            getLabel: record => record.name || record.id
        },
        files: {
            searchFields: ['name', 'description', 'type', 'vault_path', 'owner'],
            filterFields: { type: 'type', owner: 'owner' },
            getLabel: record => record.name || record.file_name || record.id,
            relations: {
                belongsTo: [
                    {
                        name: 'company',
                        entity: 'companies',
                        localKey: 'company_id',
                        fields: { company_name: 'name' }
                    },
                    {
                        name: 'contact',
                        entity: 'contacts',
                        localKey: 'contact_id',
                        fields: {
                            contact_name: contact => [contact.first_name, contact.last_name]
                                .filter(Boolean)
                                .join(' ')
                                .trim()
                        }
                    },
                    {
                        name: 'opportunity',
                        entity: 'opportunities',
                        localKey: 'opportunity_id',
                        fields: { opportunity_name: 'name' }
                    }
                ]
            }
        },
        notes: {
            searchFields: ['title', 'content', 'author', 'entity_type', 'entity_name'],
            filterFields: { entity: 'entity_type', owner: 'author' },
            getLabel: record => record.title || (record.content ? record.content.slice(0, 40) : record.id)
        },
        workflows: {
            searchFields: ['name', 'description', 'owner', 'entity', 'status'],
            filterFields: { status: 'status', entity: 'entity' },
            getLabel: record => record.name || record.id
        }
    };

    const seedData = {
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
                obsidian_note: 'Clients/TechCorp Solutions.md',
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
                obsidian_note: 'Clients/Global Manufacturing Inc.md',
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
                obsidian_note: 'Clients/StartupXYZ.md',
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
                obsidian_note: 'Clients/Northwind Logistics.md',
                annual_revenue: 915000,
                city: 'Seattle',
                state: 'WA',
                country: 'USA',
                created_at: '2024-02-14T08:45:00Z',
                updated_at: '2024-05-02T17:30:00Z'
            }
        ],
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
                company_id: 'company-2',
                company_name: 'Global Manufacturing Inc',
                contact_id: 'contact-2',
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
                company_id: 'company-4',
                company_name: 'Northwind Logistics',
                contact_id: 'contact-4',
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
                company_id: 'company-3',
                company_name: 'StartupXYZ',
                contact_id: 'contact-3',
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
                company_id: 'company-2',
                company_name: 'Global Manufacturing Inc',
                lead_id: 'lead-1',
                primary_contact_id: 'contact-2',
                assigned_to: 'Michael Chen',
                next_step: 'Finalize security review with IT team',
                description: 'Lift-and-shift of legacy workloads to hybrid cloud.',
                priority: 'High',
                competitor_id: 'competitor-marketpulse',
                obsidian_note: 'Deals/Cloud Infrastructure Migration.md'
            },
            {
                id: 'opp-2',
                name: 'Customer Success Platform Expansion',
                stage: 'Proposal',
                value: 62000,
                probability: 55,
                expected_close_date: '2024-06-18',
                company_id: 'company-1',
                company_name: 'TechCorp Solutions',
                lead_id: 'lead-1',
                primary_contact_id: 'contact-1',
                assigned_to: 'Emily Johnson',
                next_step: 'Send revised pricing options',
                description: 'Expansion of existing success platform to additional regions.',
                priority: 'Medium',
                competitor_id: 'competitor-insightsphere',
                obsidian_note: 'Deals/Customer Success Platform Expansion.md'
            },
            {
                id: 'opp-3',
                name: 'Logistics Optimization Suite',
                stage: 'Qualification',
                value: 41000,
                probability: 30,
                expected_close_date: '2024-08-05',
                company_id: 'company-4',
                company_name: 'Northwind Logistics',
                lead_id: 'lead-2',
                primary_contact_id: 'contact-4',
                assigned_to: 'Daniel Iverson',
                next_step: 'Schedule discovery workshop',
                description: 'Optimization algorithms for routing and fleet management.',
                priority: 'High',
                competitor_id: 'competitor-atlaslogix',
                obsidian_note: 'Deals/Logistics Optimization Suite.md'
            },
            {
                id: 'opp-4',
                name: 'Startup Growth Advisory',
                stage: 'Closed Won',
                value: 38000,
                probability: 100,
                expected_close_date: '2024-04-12',
                company_id: 'company-3',
                company_name: 'StartupXYZ',
                lead_id: 'lead-3',
                primary_contact_id: 'contact-3',
                assigned_to: 'Sofia Martinez',
                next_step: 'Kickoff meeting scheduled',
                description: 'Growth advisory retainer for 12 months.',
                priority: 'Medium',
                competitor_id: 'competitor-insightsphere',
                obsidian_note: 'Deals/Startup Growth Advisory.md'
            },
            {
                id: 'opp-5',
                name: 'Legacy System Support Renewal',
                stage: 'Closed Lost',
                value: 27000,
                probability: 0,
                expected_close_date: '2024-03-22',
                company_id: 'company-1',
                company_name: 'TechCorp Solutions',
                primary_contact_id: 'contact-1',
                assigned_to: 'Emily Johnson',
                next_step: 'Document lessons learned',
                description: 'Renewal opportunity lost due to budget constraints.',
                priority: 'Medium',
                competitor_id: 'competitor-insightsphere',
                obsidian_note: 'Deals/Legacy System Support Renewal.md'
            }
        ],
        competitors: [
            {
                id: 'competitor-insightsphere',
                name: 'InsightSphere',
                industry: 'Analytics Platform',
                tier: 'Tier 1',
                status: 'Active Watch',
                headquarters: 'Berlin, Germany',
                primary_markets: ['EU SaaS', 'Enterprise BI'],
                focus_areas: ['Predictive benchmarking', 'Revenue intelligence'],
                linked_clients: ['TechCorp Solutions', 'StartupXYZ'],
                linked_company_ids: ['company-1', 'company-3'],
                intel_owner: 'Competitive Research Guild',
                last_update: '2024-05-10',
                latest_move: 'Launched AI forecasting copilot for enterprise plans.',
                note_file: 'InsightSphere – Analytics.md'
            },
            {
                id: 'competitor-marketpulse',
                name: 'MarketPulse',
                industry: 'Market Intelligence',
                tier: 'Tier 1',
                status: 'Monitoring',
                headquarters: 'Vilnius, Lithuania',
                primary_markets: ['Baltics', 'Central Europe'],
                focus_areas: ['Deal alerts', 'Pricing benchmarks'],
                linked_clients: ['Global Manufacturing Inc'],
                linked_company_ids: ['company-2'],
                intel_owner: 'Regional Desk',
                last_update: '2024-05-08',
                latest_move: 'Signed data-sharing alliance with Baltic SaaS consortium.',
                note_file: 'MarketPulse – SaaS.md'
            },
            {
                id: 'competitor-atlaslogix',
                name: 'AtlasLogix',
                industry: 'Logistics Automation',
                tier: 'Tier 2',
                status: 'Watchlist',
                headquarters: 'Wrocław, Poland',
                primary_markets: ['CE SMB', 'Logistics tech'],
                focus_areas: ['Modular dashboards', 'Usage-based pricing'],
                linked_clients: ['Northwind Logistics'],
                linked_company_ids: ['company-4'],
                intel_owner: 'Product Marketing',
                last_update: '2024-05-06',
                latest_move: 'Introduced logistics optimization playbooks for freight brokers.'
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
            },
            {
                id: 'task-5',
                title: 'Refresh InsightSphere battlecard',
                description: 'Update positioning, pricing responses, and counter-messaging for InsightSphere.',
                type: 'Research',
                priority: 'High',
                status: 'In Progress',
                due_date: '2024-05-29',
                assigned_to: 'Competitive Research Guild',
                related_to: 'competitor-insightsphere',
                category: 'Competitive Intelligence',
                tags: ['competitor', 'insightsphere'],
                updated_at: '2024-05-09T10:45:00Z'
            },
            {
                id: 'task-6',
                title: 'Audit MarketPulse deal alerts',
                description: 'Review alert cadence, coverage gaps, and overlap with current monitoring stack.',
                type: 'Research',
                priority: 'Medium',
                status: 'Not Started',
                due_date: '2024-05-27',
                assigned_to: 'Regional Desk',
                related_to: 'competitor-marketpulse',
                category: 'Competitive Intelligence',
                tags: ['competitor', 'marketpulse'],
                updated_at: '2024-05-08T12:00:00Z'
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
            },
            {
                id: 'activity-7',
                type: 'Update',
                subject: 'InsightSphere AI copilot announcement',
                description: 'Briefed account teams on InsightSphere predictive features and pricing tiers.',
                date: '2024-05-10T10:15:00Z',
                assigned_to: 'Competitive Research Guild',
                category: 'Competitive Intelligence',
                related_competitors: ['competitor-insightsphere']
            },
            {
                id: 'activity-8',
                type: 'Alert',
                subject: 'MarketPulse expands Baltic coverage',
                description: 'Captured announcement on MarketPulse logistics benchmark for Baltic region.',
                date: '2024-05-08T13:40:00Z',
                assigned_to: 'Regional Desk',
                category: 'Competitive Intelligence',
                related_competitors: ['competitor-marketpulse']
            }
        ],
        files: [
            {
                id: 'file-1',
                name: 'InsightEdge kickoff deck',
                type: 'Document',
                format: 'pptx',
                vault_path: 'Projects/Deal – InsightEdge Retainer.md',
                size_kb: 8420,
                owner: 'Emily Johnson',
                related_to: 'opp-1',
                opportunity_id: 'opp-1',
                company_id: 'company-1',
                company_name: 'TechCorp Solutions',
                updated_at: '2024-05-08T10:10:00Z'
            },
            {
                id: 'file-2',
                name: 'MarketPulse competitor brief',
                type: 'Markdown',
                format: 'md',
                vault_path: 'Competitors/MarketPulse – SaaS.md',
                size_kb: 28,
                owner: 'Competitive Research Guild',
                related_to: 'competitor-marketpulse',
                updated_at: '2024-05-07T09:15:00Z'
            },
            {
                id: 'file-3',
                name: 'Emily Johnson profile',
                type: 'Markdown',
                format: 'md',
                vault_path: 'Contacts/Emily Johnson – TechCorp.md',
                size_kb: 12,
                owner: 'Revenue Operations',
                related_to: 'contact-1',
                contact_id: 'contact-1',
                updated_at: '2024-05-01T11:45:00Z'
            }
        ],
        notes: [
            {
                id: 'note-1',
                title: 'Discovery follow-up plan',
                content: 'Summarize procurement requirements and send recap email with pricing matrix.',
                author: 'Michael Chen',
                entity_type: 'leads',
                entity_id: 'lead-1',
                entity_name: 'TechCorp analytics expansion',
                vault_path: 'Leads/InsightEdge Consulting (lead).md',
                tags: ['follow-up', 'discovery'],
                created_at: '2024-05-06T15:30:00Z',
                updated_at: '2024-05-06T15:30:00Z'
            },
            {
                id: 'note-2',
                title: 'Quarterly roadmap alignment',
                content: 'Customer requested alignment workshop with marketing analytics squad to sync KPIs.',
                author: 'Sofia Martinez',
                entity_type: 'companies',
                entity_id: 'company-3',
                entity_name: 'StartupXYZ',
                vault_path: 'Clients/StartupXYZ/README.md',
                tags: ['qbr', 'roadmap'],
                created_at: '2024-05-03T09:20:00Z',
                updated_at: '2024-05-05T12:00:00Z'
            },
            {
                id: 'note-3',
                title: 'Competitor insight: InsightSphere pricing',
                content: 'InsightSphere rolling out AI tiered pricing with auto-bundled support. Capture objections for enterprise accounts.',
                author: 'Competitive Research Guild',
                entity_type: 'competitors',
                entity_id: 'competitor-insightsphere',
                entity_name: 'InsightSphere',
                vault_path: 'Competitors/InsightSphere – Analytics.md',
                tags: ['pricing', 'competitive-intel'],
                created_at: '2024-05-09T08:05:00Z',
                updated_at: '2024-05-09T08:05:00Z'
            }
        ],
        workflows: [
            {
                id: 'workflow-1',
                name: 'Discovery call follow-up',
                description: 'Create a follow-up task and reminder after a successful discovery call.',
                entity: 'activities',
                status: 'Active',
                owner: 'RevOps Automation',
                trigger: {
                    id: 'call_completed',
                    label: 'Call completed',
                    icon: 'fa-phone',
                    event: 'activity.completed',
                    config: { outcome: 'Positive' }
                },
                conditions: [
                    {
                        id: 'no_open_tasks',
                        label: 'No open tasks on record',
                        description: 'Skip when a follow-up task is already open.'
                    },
                    {
                        id: 'call_outcome_positive',
                        label: 'Call outcome is Positive',
                        description: 'Only run for positive outcomes.'
                    }
                ],
                actions: [
                    {
                        type: 'create_task',
                        label: 'Create task',
                        icon: 'fa-list-check',
                        order: 1,
                        settings: {
                            title: 'Send discovery recap',
                            due_in_days: 1,
                            priority: 'High',
                            assignee: 'Account Executive'
                        }
                    },
                    {
                        type: 'send_reminder',
                        label: 'Send reminder',
                        icon: 'fa-bell',
                        order: 2,
                        settings: {
                            channel: 'Email',
                            offset: 30,
                            message: 'Reminder: send recap email for {{activity.subject}}'
                        }
                    }
                ],
                metrics: {
                    runs: 42,
                    success_rate: 0.98,
                    tasks_created: 42,
                    reminders_sent: 42,
                    erp_syncs: 0
                },
                last_run_at: '2024-05-07T16:45:00Z',
                created_at: '2024-03-12T09:00:00Z',
                updated_at: '2024-05-07T16:45:00Z'
            },
            {
                id: 'workflow-2',
                name: 'Closed won implementation kickoff',
                description: 'Launch onboarding tasks and push data to ERP after a deal is Closed Won.',
                entity: 'opportunities',
                status: 'Active',
                owner: 'Sales Operations',
                trigger: {
                    id: 'deal_stage_change',
                    label: 'Deal stage changed',
                    icon: 'fa-diagram-project',
                    event: 'opportunity.stage.changed',
                    config: { from_stage: 'Negotiation', to_stage: 'Closed Won' }
                },
                conditions: [
                    {
                        id: 'high_value_deal',
                        label: 'Deal value > $50k',
                        description: 'Only for enterprise-sized deals.'
                    },
                    {
                        id: 'erp_sync_pending',
                        label: 'ERP sync pending flag = true',
                        description: 'Ensure ERP sync is required before running.'
                    }
                ],
                actions: [
                    {
                        type: 'update_status',
                        label: 'Update status',
                        icon: 'fa-arrows-rotate',
                        order: 1,
                        settings: {
                            field: 'Opportunity Stage',
                            value: 'Closed Won'
                        }
                    },
                    {
                        type: 'create_task',
                        label: 'Create task',
                        icon: 'fa-list-check',
                        order: 2,
                        settings: {
                            title: 'Kickoff with Implementation',
                            due_in_days: 2,
                            priority: 'High',
                            assignee: 'Implementation Lead'
                        }
                    },
                    {
                        type: 'sync_erp',
                        label: 'Sync with ERP',
                        icon: 'fa-cloud-arrow-up',
                        order: 3,
                        settings: {
                            system: 'SAP S/4HANA',
                            payload: 'opportunity_id,value,close_date',
                            mode: 'Immediate'
                        }
                    }
                ],
                metrics: {
                    runs: 18,
                    success_rate: 0.94,
                    tasks_created: 18,
                    reminders_sent: 0,
                    erp_syncs: 18
                },
                last_run_at: '2024-05-06T14:20:00Z',
                created_at: '2024-02-01T10:30:00Z',
                updated_at: '2024-05-06T14:20:00Z'
            },
            {
                id: 'workflow-3',
                name: 'Renewal risk escalation',
                description: 'Escalate high-priority renewal tasks and sync risk to ERP.',
                entity: 'tasks',
                status: 'Active',
                owner: 'Customer Success Ops',
                trigger: {
                    id: 'task_overdue',
                    label: 'Task becomes overdue',
                    icon: 'fa-stopwatch',
                    event: 'task.overdue',
                    config: { grace_period: 2 }
                },
                conditions: [
                    {
                        id: 'task_priority_high',
                        label: 'Task priority is High',
                        description: 'Escalate only urgent renewals.'
                    },
                    {
                        id: 'tier1_account',
                        label: 'Account tier is Strategic',
                        description: 'Focus on tier 1 accounts.'
                    }
                ],
                actions: [
                    {
                        type: 'send_reminder',
                        label: 'Send reminder',
                        icon: 'fa-bell',
                        order: 1,
                        settings: {
                            channel: 'Slack',
                            offset: 5,
                            message: 'Renewal task overdue for {{company.name}}'
                        }
                    },
                    {
                        type: 'sync_erp',
                        label: 'Sync with ERP',
                        icon: 'fa-cloud-arrow-up',
                        order: 2,
                        settings: {
                            system: 'NetSuite',
                            payload: 'task_id,account_id,status',
                            mode: 'Immediate'
                        }
                    }
                ],
                metrics: {
                    runs: 27,
                    success_rate: 0.91,
                    tasks_created: 0,
                    reminders_sent: 27,
                    erp_syncs: 27
                },
                last_run_at: '2024-05-07T09:55:00Z',
                created_at: '2024-03-20T08:00:00Z',
                updated_at: '2024-05-07T09:55:00Z'
            }
        ]
    };

    const dataCore = new global.DataCore({ entities: entityDefinitions, seedData });

    const RESERVED_QUERY_KEYS = new Set(['search', 'sort', 'page', 'limit', 'version']);
    const ENTITY_ALIASES = { deals: 'opportunities' };

    function resolveEntityName(rawName) {
        if (!rawName) {
            return null;
        }
        const normalized = String(rawName).toLowerCase();
        return ENTITY_ALIASES[normalized] || normalized;
    }

    function toNumber(value) {
        const num = Number(value);
        return Number.isFinite(num) && num > 0 ? num : undefined;
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

    function extractFilters(params) {
        const filters = {};
        params.forEach((value, key) => {
            if (RESERVED_QUERY_KEYS.has(key)) {
                return;
            }
            filters[key] = value;
        });
        return filters;
    }

    global.fetch = async function(input, init = {}) {
        const request = typeof input === 'string' ? input : input?.url;
        if (typeof request !== 'string') {
            return originalFetch ? originalFetch(input, init) : Promise.reject(new Error('Invalid request'));
        }

        if (!request.includes(`${API_PREFIX}/`)) {
            return originalFetch ? originalFetch(input, init) : Promise.reject(new Error('fetch not available'));
        }

        const base = global.location?.href || 'http://localhost/';
        const url = new URL(request, base);
        const pathParts = url.pathname
            .replace(/^\/+/, '')
            .split('/')
            .filter(Boolean);
        const apiIndex = pathParts.indexOf(API_PREFIX);
        if (apiIndex === -1) {
            return createJsonResponse({ message: 'Not found' }, 404);
        }

        const rawEntity = pathParts[apiIndex + 1];
        const entity = resolveEntityName(rawEntity);
        if (!entity || !dataCore.hasEntity(entity)) {
            return createJsonResponse({ message: 'Unknown entity' }, 404);
        }

        const recordId = pathParts[apiIndex + 2] ? decodeURIComponent(pathParts[apiIndex + 2]) : undefined;
        const extraSegment = pathParts[apiIndex + 3];
        const method = (init.method || (typeof input === 'object' && input.method) || 'GET').toUpperCase();
        const params = url.searchParams;

        try {
            if (method === 'GET' && recordId && extraSegment === 'versions') {
                const history = dataCore.getHistory(entity, recordId);
                return createJsonResponse({ data: history, total: history.length });
            }

            if (method === 'GET' && !recordId) {
                const search = params.get('search') || '';
                const sort = params.get('sort') || undefined;
                const limit = toNumber(params.get('limit'));
                const page = toNumber(params.get('page'));
                const filters = extractFilters(params);
                const result = dataCore.list(entity, { search, sort, limit, page, filters });
                return createJsonResponse(result);
            }

            if (method === 'GET' && recordId) {
                const version = params.get('version');
                const record = dataCore.get(entity, recordId, { version });
                if (!record) {
                    return createJsonResponse({ message: 'Not found' }, 404);
                }
                return createJsonResponse(record);
            }

            if (method === 'POST') {
                const body = parseBody(init);
                const record = dataCore.create(entity, body);
                return createJsonResponse(record, 201);
            }

            if ((method === 'PUT' || method === 'PATCH') && recordId) {
                const body = parseBody(init);
                const record = dataCore.update(entity, recordId, body);
                if (!record) {
                    return createJsonResponse({ message: 'Not found' }, 404);
                }
                return createJsonResponse(record);
            }

            if (method === 'DELETE' && recordId) {
                const success = dataCore.delete(entity, recordId);
                if (!success) {
                    return createJsonResponse({ message: 'Not found' }, 404);
                }
                return createJsonResponse({ success: true });
            }

            return createJsonResponse({ message: 'Unsupported operation' }, 400);
        } catch (error) {
            console.error('Mock API error', error);
            return createJsonResponse({ message: error.message || 'Server error' }, 400);
        }
    };

    global.crmDataCore = dataCore;
    Object.defineProperty(global, 'mockDatabase', {
        configurable: true,
        get() {
            return dataCore.exportState();
        }
    });
})(typeof window !== 'undefined' ? window : this);

