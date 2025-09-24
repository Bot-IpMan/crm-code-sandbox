(function(global) {
    if (!global) {
        return;
    }

    class DataCore {
        constructor(options = {}) {
            const { entities = {}, seedData = {} } = options;
            this.entityConfig = new Map();
            this.collections = new Map();
            this.history = new Map();
            this.aliases = new Map();

            Object.entries(entities).forEach(([name, config]) => {
                this.defineEntity(name, config);
            });

            this.seed(seedData);
        }

        defineEntity(name, config = {}) {
            const key = this.normalizeKey(name);
            if (!key) {
                return;
            }

            const normalizedConfig = {
                searchFields: Array.isArray(config.searchFields) ? config.searchFields.slice() : [],
                filterFields: config.filterFields ? { ...config.filterFields } : {},
                relations: this.normalizeRelations(config.relations),
                getLabel: this.buildLabelResolver(config)
            };

            this.entityConfig.set(key, normalizedConfig);
            if (!this.collections.has(key)) {
                this.collections.set(key, new Map());
            }
            if (!this.history.has(key)) {
                this.history.set(key, new Map());
            }

            if (Array.isArray(config.aliases)) {
                config.aliases.forEach(alias => {
                    const aliasKey = this.normalizeKey(alias);
                    if (aliasKey) {
                        this.aliases.set(aliasKey, key);
                    }
                });
            }
        }

        hasEntity(name) {
            try {
                this.requireEntity(name);
                return true;
            } catch (error) {
                return false;
            }
        }

        seed(seedData = {}) {
            Object.entries(seedData).forEach(([name, records]) => {
                const entity = this.requireEntity(name);
                const collection = Array.isArray(records) ? records : [];
                collection.forEach(record => this.insertSeedRecord(entity, record));
            });
        }

        create(entityName, payload = {}) {
            const entity = this.requireEntity(entityName);
            const now = new Date().toISOString();
            const prepared = this.prepareRecord(entity, payload);
            const collection = this.collections.get(entity);
            const id = this.resolveIdentifier(prepared.id, entity);

            if (collection.has(id)) {
                throw new Error(`Record with id ${id} already exists`);
            }

            const record = {
                ...prepared,
                id,
                created_at: prepared.created_at || now,
                updated_at: prepared.updated_at || now,
                version: this.normalizeVersion(prepared.version)
            };

            collection.set(id, record);
            this.logHistory(entity, record, 'create', record.updated_at);
            return this.decorateRecord(entity, record);
        }

        get(entityName, id, options = {}) {
            const entity = this.requireEntity(entityName);
            if (!id) {
                return null;
            }

            const versionParam = options.version;
            if (versionParam !== undefined && versionParam !== null && versionParam !== '') {
                const versionNumber = Number(versionParam);
                if (!Number.isFinite(versionNumber)) {
                    return null;
                }
                const historyEntries = this.history.get(entity)?.get(id) || [];
                const entry = historyEntries
                    .slice()
                    .reverse()
                    .find(item => item.version === versionNumber);
                if (!entry) {
                    return null;
                }
                return this.decorateRecord(entity, entry.data);
            }

            const record = this.collections.get(entity)?.get(id);
            if (record) {
                return this.decorateRecord(entity, record);
            }

            const historyEntries = this.history.get(entity)?.get(id) || [];
            if (!historyEntries.length) {
                return null;
            }

            const latest = historyEntries[historyEntries.length - 1];
            return this.decorateRecord(entity, latest.data);
        }

        update(entityName, id, payload = {}) {
            const entity = this.requireEntity(entityName);
            const collection = this.collections.get(entity);
            const existing = collection.get(id);
            if (!existing) {
                return null;
            }

            const patch = this.clone(payload);
            patch.id = id;

            const updated = {
                ...existing,
                ...patch,
                id,
                created_at: existing.created_at,
                updated_at: patch.updated_at || new Date().toISOString(),
                version: (existing.version || 1) + 1
            };

            const prepared = this.prepareRecord(entity, updated);
            prepared.id = id;
            prepared.created_at = existing.created_at;
            prepared.updated_at = updated.updated_at;
            prepared.version = updated.version;

            collection.set(id, prepared);
            this.logHistory(entity, prepared, 'update', prepared.updated_at);
            return this.decorateRecord(entity, prepared);
        }

        delete(entityName, id) {
            const entity = this.requireEntity(entityName);
            const collection = this.collections.get(entity);
            const existing = collection.get(id);
            if (!existing) {
                return false;
            }

            const timestamp = new Date().toISOString();
            const snapshot = {
                ...existing,
                version: (existing.version || 1) + 1,
                deleted_at: timestamp
            };

            this.logHistory(entity, snapshot, 'delete', timestamp);
            collection.delete(id);
            return true;
        }

        list(entityName, options = {}) {
            const entity = this.requireEntity(entityName);
            const config = this.entityConfig.get(entity);
            const collection = this.collections.get(entity);
            let results = Array.from(collection.values());

            if (options.search && config.searchFields.length) {
                const searchTerm = String(options.search).trim().toLowerCase();
                if (searchTerm) {
                    results = results.filter(record =>
                        config.searchFields.some(field => {
                            const value = record[field];
                            if (value === undefined || value === null) {
                                return false;
                            }
                            return String(value).toLowerCase().includes(searchTerm);
                        })
                    );
                }
            }

            if (options.filters && Object.keys(options.filters).length) {
                results = results.filter(record => this.applyFilters(record, config, options.filters));
            }

            if (options.sort) {
                results = this.applySorting(results, options.sort);
            }

            const total = results.length;
            const limitCandidate = Number(options.limit);
            const pageCandidate = Number(options.page);
            const limit = Number.isFinite(limitCandidate) && limitCandidate > 0 ? limitCandidate : (total > 0 ? total : 20);
            const page = Number.isFinite(pageCandidate) && pageCandidate > 0 ? pageCandidate : 1;
            const start = (page - 1) * limit;
            const paginated = start >= total
                ? results.slice(0, limit)
                : results.slice(start, start + limit);

            return {
                data: paginated.map(record => this.decorateRecord(entity, record)),
                total,
                limit,
                page
            };
        }

        getHistory(entityName, id) {
            const entity = this.requireEntity(entityName);
            if (!id) {
                return [];
            }
            const historyEntries = this.history.get(entity)?.get(id) || [];
            const sorted = historyEntries.slice().sort((a, b) => {
                if (a.version !== b.version) {
                    return a.version - b.version;
                }
                const timeA = new Date(a.timestamp || 0).getTime();
                const timeB = new Date(b.timestamp || 0).getTime();
                return timeA - timeB;
            });

            return sorted.map(entry => ({
                version: entry.version,
                action: entry.action,
                timestamp: entry.timestamp,
                data: this.decorateRecord(entity, entry.data)
            }));
        }

        exportState() {
            const snapshot = {};
            this.collections.forEach((collection, entity) => {
                snapshot[entity] = Array.from(collection.values()).map(record => this.decorateRecord(entity, record));
            });
            return snapshot;
        }

        normalizeKey(name) {
            if (!name) {
                return null;
            }
            return String(name).toLowerCase();
        }

        resolveEntityName(name) {
            const key = this.normalizeKey(name);
            if (!key) {
                return null;
            }
            return this.aliases.get(key) || key;
        }

        requireEntity(name) {
            const key = this.resolveEntityName(name);
            if (!key || !this.entityConfig.has(key)) {
                throw new Error(`Unknown entity: ${name}`);
            }
            return key;
        }

        normalizeRelations(relations = {}) {
            const belongsTo = Array.isArray(relations.belongsTo)
                ? relations.belongsTo.map(relation => ({
                    ...relation,
                    fields: relation?.fields ? { ...relation.fields } : undefined,
                    match: relation?.match ? { ...relation.match } : undefined
                }))
                : [];

            const hasMany = Array.isArray(relations.hasMany)
                ? relations.hasMany.map(relation => ({ ...relation }))
                : [];

            return { belongsTo, hasMany };
        }

        buildLabelResolver(config) {
            if (typeof config.getLabel === 'function') {
                return config.getLabel;
            }

            const labelFields = Array.isArray(config.labelFields) ? config.labelFields.slice() : null;
            return record => {
                if (labelFields) {
                    for (const field of labelFields) {
                        if (typeof field === 'function') {
                            const value = field(record);
                            if (value) {
                                return value;
                            }
                        } else if (typeof field === 'string') {
                            const candidate = record[field];
                            if (typeof candidate === 'string' && candidate.trim()) {
                                return candidate;
                            }
                        }
                    }
                }

                const defaultLabel = this.defaultLabel(record);
                return defaultLabel || record?.id || '';
            };
        }

        defaultLabel(record) {
            if (!record || typeof record !== 'object') {
                return '';
            }
            if (record.name) {
                return record.name;
            }
            if (record.title) {
                return record.title;
            }
            if (record.subject) {
                return record.subject;
            }
            const fullName = [record.first_name, record.last_name]
                .filter(Boolean)
                .join(' ')
                .trim();
            if (fullName) {
                return fullName;
            }
            if (record.email) {
                return record.email;
            }
            return '';
        }

        insertSeedRecord(entity, record) {
            const prepared = this.prepareRecord(entity, record);
            const now = new Date().toISOString();
            const stored = {
                ...prepared,
                id: this.resolveIdentifier(prepared.id, entity),
                created_at: prepared.created_at || now,
                updated_at: prepared.updated_at || prepared.created_at || now,
                version: this.normalizeVersion(prepared.version)
            };

            this.collections.get(entity).set(stored.id, stored);
            this.logHistory(entity, stored, 'seed', stored.updated_at);
        }

        resolveIdentifier(id, entity) {
            if (id && String(id).trim()) {
                return String(id).trim();
            }
            return this.generateId(entity);
        }

        normalizeVersion(value) {
            const numeric = Number(value);
            return Number.isFinite(numeric) && numeric > 0 ? Math.floor(numeric) : 1;
        }

        prepareRecord(entity, data) {
            const config = this.entityConfig.get(entity);
            const record = this.clone(data) || {};
            if (record.relationships) {
                delete record.relationships;
            }
            if (record.version !== undefined) {
                delete record.version;
            }

            this.sanitizeBelongsToFields(record, config);
            this.resolveBelongsToReferences(entity, record, config);
            return record;
        }

        sanitizeBelongsToFields(record, config) {
            if (!config?.relations?.belongsTo) {
                return;
            }
            config.relations.belongsTo.forEach(relation => {
                const key = relation?.localKey;
                if (!key) {
                    return;
                }
                if (Object.prototype.hasOwnProperty.call(record, key)) {
                    const value = record[key];
                    if (value === null || value === undefined) {
                        delete record[key];
                        return;
                    }
                    if (typeof value === 'string' && value.trim() === '') {
                        delete record[key];
                    }
                }
            });
        }

        resolveBelongsToReferences(entity, record, config) {
            const relations = config?.relations?.belongsTo || [];
            relations.forEach(relation => {
                const targetEntity = this.resolveEntityName(relation.entity);
                const localKey = relation?.localKey;
                if (!targetEntity || !localKey) {
                    return;
                }

                const collection = this.collections.get(targetEntity);
                if (!collection) {
                    return;
                }

                let related = null;
                if (record[localKey]) {
                    related = collection.get(record[localKey]) || null;
                    if (!related) {
                        delete record[localKey];
                    }
                }

                const matchConfig = relation.match;
                const matchSource = matchConfig?.source;
                const matchTarget = matchConfig?.target || 'name';
                const matchValue = matchSource ? record[matchSource] : undefined;
                if (!related && matchSource && matchValue !== undefined && matchValue !== null) {
                    related = this.findByField(targetEntity, matchTarget, matchValue);
                    if (related) {
                        record[localKey] = related.id;
                    }
                }

                if (related && matchSource) {
                    const relatedValue = related[matchTarget];
                    if (relatedValue !== undefined) {
                        record[matchSource] = relatedValue;
                    }
                }
            });
        }

        findByField(entityName, field, value) {
            const entity = this.requireEntity(entityName);
            const collection = this.collections.get(entity);
            const normalizedValue = typeof value === 'string' ? value.trim().toLowerCase() : value;
            if (normalizedValue === undefined || normalizedValue === null || normalizedValue === '') {
                return null;
            }

            for (const record of collection.values()) {
                const candidate = record[field];
                if (candidate === undefined || candidate === null) {
                    continue;
                }
                if (typeof normalizedValue === 'string') {
                    if (String(candidate).trim().toLowerCase() === normalizedValue) {
                        return record;
                    }
                } else if (candidate === normalizedValue) {
                    return record;
                }
            }
            return null;
        }

        applyFilters(record, config, filters) {
            const entries = Object.entries(filters);
            for (const [queryKey, filterValue] of entries) {
                if (filterValue === undefined || filterValue === null || filterValue === '') {
                    continue;
                }
                const fieldName = config.filterFields[queryKey] || queryKey;
                const recordValue = record[fieldName];
                if (recordValue === undefined || recordValue === null) {
                    return false;
                }
                if (String(recordValue).toLowerCase() !== String(filterValue).toLowerCase()) {
                    return false;
                }
            }
            return true;
        }

        applySorting(records, sort) {
            if (!Array.isArray(records) || !records.length) {
                return records;
            }
            if (sort === 'date') {
                return records.slice().sort((a, b) => new Date(b.date || b.updated_at || 0) - new Date(a.date || a.updated_at || 0));
            }
            if (sort === 'created_at') {
                return records.slice().sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
            }
            if (sort === '-created_at') {
                return records.slice().sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
            }
            return records.slice();
        }

        decorateRecord(entity, source) {
            const config = this.entityConfig.get(entity);
            const record = this.clone(source) || {};
            const relationships = {};

            if (config?.relations?.belongsTo) {
                config.relations.belongsTo.forEach(relation => {
                    const targetEntity = this.resolveEntityName(relation.entity);
                    const localKey = relation?.localKey;
                    if (!targetEntity || !localKey) {
                        return;
                    }
                    const targetCollection = this.collections.get(targetEntity);
                    if (!targetCollection) {
                        return;
                    }
                    const related = record[localKey] ? targetCollection.get(record[localKey]) : null;
                    if (!related) {
                        return;
                    }
                    if (relation.fields) {
                        Object.entries(relation.fields).forEach(([fieldName, descriptor]) => {
                            let value;
                            if (typeof descriptor === 'function') {
                                value = descriptor(related, record);
                            } else if (typeof descriptor === 'string') {
                                value = related[descriptor];
                            }
                            if (value !== undefined) {
                                record[fieldName] = value;
                            }
                        });
                    }
                    if (relation.name) {
                        relationships[relation.name] = this.buildRelationshipSummary(targetEntity, related);
                    }
                });
            }

            if (config?.relations?.hasMany) {
                config.relations.hasMany.forEach(relation => {
                    const targetEntity = this.resolveEntityName(relation.entity);
                    const foreignKey = relation?.foreignKey;
                    if (!targetEntity || !foreignKey) {
                        return;
                    }
                    const targetCollection = this.collections.get(targetEntity);
                    if (!targetCollection) {
                        return;
                    }
                    const relatedRecords = [];
                    targetCollection.forEach(item => {
                        if (item[foreignKey] === record.id) {
                            relatedRecords.push(this.buildRelationshipSummary(targetEntity, item));
                        }
                    });
                    if (relatedRecords.length) {
                        relationships[relation.name || `${targetEntity}_items`] = relatedRecords;
                    }
                });
            }

            if (Object.keys(relationships).length) {
                record.relationships = relationships;
            }

            return record;
        }

        buildRelationshipSummary(entity, record) {
            const config = this.entityConfig.get(entity);
            const summary = {
                id: record.id,
                entity,
                name: config?.getLabel ? config.getLabel(record) : this.defaultLabel(record)
            };
            if (record.version !== undefined) {
                summary.version = record.version;
            }
            if (record.status) {
                summary.status = record.status;
            }
            if (record.stage) {
                summary.stage = record.stage;
            }
            if (record.value !== undefined) {
                summary.value = record.value;
            }
            if (record.updated_at) {
                summary.updated_at = record.updated_at;
            }
            return summary;
        }

        logHistory(entity, record, action, timestamp) {
            const historyMap = this.history.get(entity);
            if (!historyMap.has(record.id)) {
                historyMap.set(record.id, []);
            }
            const entry = {
                version: this.normalizeVersion(record.version),
                action,
                timestamp: timestamp || new Date().toISOString(),
                data: this.clone(record)
            };
            historyMap.get(record.id).push(entry);
        }

        generateId(entity) {
            if (global.crypto?.randomUUID) {
                return `${entity}-${global.crypto.randomUUID()}`;
            }
            return `${entity}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        }

        clone(value) {
            if (value === null || value === undefined) {
                return value;
            }
            if (typeof global.structuredClone === 'function') {
                try {
                    return global.structuredClone(value);
                } catch (error) {
                    // Fallback to JSON cloning below
                }
            }
            return JSON.parse(JSON.stringify(value));
        }
    }

    global.DataCore = DataCore;
})(typeof window !== 'undefined' ? window : this);

