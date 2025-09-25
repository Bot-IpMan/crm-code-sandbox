(function(global) {
    if (!global) {
        return;
    }

    const DEFAULT_DICTIONARIES = {
        contacts: {
            statuses: [
                { value: 'Active', i18nKey: 'contacts.filter.status.active' },
                { value: 'Inactive', i18nKey: 'contacts.filter.status.inactive' },
                { value: 'Qualified', i18nKey: 'contacts.filter.status.qualified' },
                { value: 'Customer', i18nKey: 'contacts.filter.status.customer' }
            ],
            leadSources: [
                { value: 'Website', i18nKey: 'contacts.filter.source.website' },
                { value: 'Cold Call', i18nKey: 'contacts.filter.source.coldCall' },
                { value: 'Email Campaign', label: 'Email Campaign' },
                { value: 'Social Media', i18nKey: 'contacts.filter.source.social' },
                { value: 'Referral', i18nKey: 'contacts.filter.source.referral' },
                { value: 'Trade Show', label: 'Trade Show' },
                { value: 'Advertisement', label: 'Advertisement' },
                { value: 'Event', label: 'Event' },
                { value: 'Partner', label: 'Partner' },
                { value: 'Other', label: 'Other' }
            ]
        },
        companies: {
            statuses: [
                { value: 'Active', i18nKey: 'companies.filter.status.active' },
                { value: 'Customer', i18nKey: 'companies.filter.status.customer' },
                { value: 'Prospect', i18nKey: 'companies.filter.status.prospect' },
                { value: 'Partner', i18nKey: 'companies.filter.status.partner' },
                { value: 'Vendor', label: 'Vendor' },
                { value: 'Inactive', label: 'Inactive' }
            ],
            sizes: [
                { value: 'Startup', i18nKey: 'companies.filter.size.startup' },
                { value: 'Small (1-50)', i18nKey: 'companies.filter.size.small' },
                { value: 'Medium (51-200)', i18nKey: 'companies.filter.size.medium' },
                { value: 'Large (201-1000)', i18nKey: 'companies.filter.size.large' },
                { value: 'Enterprise (1000+)', i18nKey: 'companies.filter.size.enterprise' }
            ]
        },
        leads: {
            statuses: [
                { value: 'New', i18nKey: 'leads.filter.status.new' },
                { value: 'Contacted', i18nKey: 'leads.filter.status.contacted' },
                { value: 'Qualified', i18nKey: 'leads.filter.status.qualified' },
                { value: 'Proposal', i18nKey: 'leads.filter.status.proposal' },
                { value: 'Negotiation', i18nKey: 'leads.filter.status.negotiation' },
                { value: 'Won', i18nKey: 'leads.filter.status.won' },
                { value: 'Lost', i18nKey: 'leads.filter.status.lost' }
            ],
            priorities: [
                { value: 'Low', i18nKey: 'leads.filter.priority.low' },
                { value: 'Medium', i18nKey: 'leads.filter.priority.medium' },
                { value: 'High', i18nKey: 'leads.filter.priority.high' },
                { value: 'Critical', i18nKey: 'leads.filter.priority.critical' }
            ],
            sources: [
                { value: 'Website', label: 'Website' },
                { value: 'Referral', label: 'Referral' },
                { value: 'Email Campaign', label: 'Email Campaign' },
                { value: 'Conference', label: 'Conference' },
                { value: 'Cold Call', label: 'Cold Call' },
                { value: 'Social Media', label: 'Social Media' },
                { value: 'Partner', label: 'Partner' },
                { value: 'Advertisement', label: 'Advertisement' },
                { value: 'Event', label: 'Event' },
                { value: 'Other', label: 'Other' }
            ]
        },
        opportunities: {
            stages: [
                { value: 'Qualification' },
                { value: 'Needs Analysis' },
                { value: 'Proposal' },
                { value: 'Negotiation' },
                { value: 'Closed Won' },
                { value: 'Closed Lost' }
            ],
            statuses: [
                { value: 'Open' },
                { value: 'Closed Won' },
                { value: 'Closed Lost' },
                { value: 'On Hold' }
            ],
            forecastCategories: [
                { value: 'Pipeline' },
                { value: 'Best Case' },
                { value: 'Commit' },
                { value: 'Closed' }
            ],
            priorities: [
                { value: 'Low' },
                { value: 'Medium' },
                { value: 'High' },
                { value: 'Critical' }
            ]
        },
        tasks: {
            statuses: [
                { value: 'Not Started' },
                { value: 'In Progress' },
                { value: 'Completed' },
                { value: 'Cancelled' }
            ],
            priorities: [
                { value: 'Low' },
                { value: 'Medium' },
                { value: 'High' },
                { value: 'Critical' }
            ],
            types: [
                { value: 'Call' },
                { value: 'Email' },
                { value: 'Meeting' },
                { value: 'Follow-up' },
                { value: 'Proposal' },
                { value: 'Research' },
                { value: 'Internal Review' },
                { value: 'Onsite Visit' }
            ]
        },
        activities: {
            types: [
                { value: 'Call' },
                { value: 'Email' },
                { value: 'Meeting' },
                { value: 'Demo' },
                { value: 'Workshop' },
                { value: 'Site Visit' },
                { value: 'Social Event' },
                { value: 'Note' }
            ],
            outcomes: [
                { value: 'Positive' },
                { value: 'Neutral' },
                { value: 'Negative' },
                { value: 'No Show' },
                { value: 'Voicemail' }
            ]
        },
        competitors: {
            tiers: [
                { value: 'Tier 1' },
                { value: 'Tier 2' },
                { value: 'Tier 3' }
            ],
            statuses: [
                { value: 'Active' },
                { value: 'Monitoring' },
                { value: 'Dormant' },
                { value: 'Watchlist' }
            ]
        }
    };

    const OPPORTUNITY_STAGE_PROBABILITY = {
        Qualification: 20,
        'Needs Analysis': 35,
        Proposal: 55,
        Negotiation: 75,
        'Closed Won': 100,
        'Closed Lost': 0
    };

    const dictionaries = JSON.parse(JSON.stringify(DEFAULT_DICTIONARIES));
    const pipelines = {
        opportunities: {
            stageProbability: { ...OPPORTUNITY_STAGE_PROBABILITY }
        }
    };

    function normalizeEntry(entry) {
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

    function normalizeCollection(values) {
        if (!Array.isArray(values)) {
            return [];
        }
        const seen = new Set();
        const normalized = [];
        values.forEach(item => {
            const entry = normalizeEntry(item);
            if (!entry) {
                return;
            }
            const key = entry.value.toLowerCase();
            if (seen.has(key)) {
                return;
            }
            seen.add(key);
            normalized.push(entry);
        });
        return normalized;
    }

    function ensureEntityBucket(entity) {
        if (!dictionaries[entity]) {
            dictionaries[entity] = {};
        }
        return dictionaries[entity];
    }

    function cloneDeep(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function getDictionary(entity, key, fallback = []) {
        if (!entity || !key) {
            return normalizeCollection(fallback);
        }
        const bucket = dictionaries[entity];
        if (bucket && Array.isArray(bucket[key]) && bucket[key].length) {
            return cloneDeep(normalizeCollection(bucket[key]));
        }
        return normalizeCollection(fallback);
    }

    function getDictionaryValues(entity, key, fallback = []) {
        return getDictionary(entity, key, fallback).map(item => item.value);
    }

    function setDictionary(entity, key, values = []) {
        if (!entity || !key) {
            return;
        }
        const bucket = ensureEntityBucket(entity);
        bucket[key] = normalizeCollection(values);
    }

    function addDictionaryValue(entity, key, value) {
        if (!entity || !key) {
            return;
        }
        const entry = normalizeEntry(value);
        if (!entry) {
            return;
        }
        const bucket = ensureEntityBucket(entity);
        const existing = Array.isArray(bucket[key]) ? bucket[key] : [];
        if (!existing.some(item => item.value.toLowerCase() === entry.value.toLowerCase())) {
            existing.push(entry);
        }
        bucket[key] = existing;
    }

    function getOpportunityProbability(stage) {
        if (!stage) {
            return undefined;
        }
        const normalized = String(stage);
        if (Object.prototype.hasOwnProperty.call(pipelines.opportunities.stageProbability, normalized)) {
            return pipelines.opportunities.stageProbability[normalized];
        }
        return undefined;
    }

    function setOpportunityProbability(stage, probability) {
        if (!stage) {
            return;
        }
        const normalizedStage = String(stage);
        const numeric = Number(probability);
        if (!Number.isFinite(numeric)) {
            return;
        }
        const bounded = Math.max(0, Math.min(100, Math.round(numeric)));
        pipelines.opportunities.stageProbability[normalizedStage] = bounded;
    }

    function getOpportunityProbabilityMap() {
        return { ...pipelines.opportunities.stageProbability };
    }

    global.crmConfig = {
        getDictionary,
        getDictionaryValues,
        setDictionary,
        addDictionaryValue,
        getOpportunityProbability,
        setOpportunityProbability,
        getOpportunityProbabilityMap,
        exportConfig() {
            return {
                dictionaries: cloneDeep(dictionaries),
                pipelines: cloneDeep(pipelines)
            };
        }
    };
})(typeof window !== 'undefined' ? window : this);

