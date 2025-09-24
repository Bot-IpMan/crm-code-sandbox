/**
 * Automation Workflow Builder Module
 * Enables event-driven workflows for task creation, reminders and ERP sync.
 */

const WORKFLOW_TRIGGER_OPTIONS = [
    {
        id: 'deal_stage_change',
        label: 'Deal stage changed',
        icon: 'fa-diagram-project',
        description: 'Fires when an opportunity stage is updated.',
        event: 'opportunity.stage.changed',
        entities: ['opportunities'],
        configFields: [
            {
                key: 'from_stage',
                label: 'Previous stage',
                type: 'select',
                options: ['Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
                description: 'Optional guard to limit when the automation starts.'
            },
            {
                key: 'to_stage',
                label: 'New stage',
                type: 'select',
                options: ['Qualification', 'Needs Analysis', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
                description: 'Select the target stage that should trigger the workflow.'
            }
        ]
    },
    {
        id: 'call_completed',
        label: 'Call completed',
        icon: 'fa-phone',
        description: 'Runs after a call activity is logged with an outcome.',
        event: 'activity.completed',
        entities: ['activities'],
        configFields: [
            {
                key: 'outcome',
                label: 'Call outcome equals',
                type: 'select',
                options: ['Positive', 'Neutral', 'Negative', 'No Show', 'Voicemail'],
                description: 'Only continue when the selected outcome is recorded.'
            }
        ]
    },
    {
        id: 'task_overdue',
        label: 'Task becomes overdue',
        icon: 'fa-stopwatch',
        description: 'Evaluates tasks that have missed their due date.',
        event: 'task.overdue',
        entities: ['tasks'],
        configFields: [
            {
                key: 'grace_period',
                label: 'Grace period (hours)',
                type: 'number',
                min: 0,
                max: 72,
                default: 2,
                description: 'Delay execution to allow owners to catch up.'
            }
        ]
    },
    {
        id: 'lead_status_change',
        label: 'Lead status updated',
        icon: 'fa-user-check',
        description: 'Detects when a lead moves to the selected status.',
        event: 'lead.status.changed',
        entities: ['leads'],
        configFields: [
            {
                key: 'target_status',
                label: 'Target status',
                type: 'select',
                options: ['New', 'Contacted', 'Qualified', 'Proposal', 'Won', 'Lost']
            }
        ]
    },
    {
        id: 'erp_sync_required',
        label: 'ERP sync required',
        icon: 'fa-cloud-arrow-up',
        description: 'Triggered when a CRM record needs ERP synchronisation.',
        event: 'integration.erp.sync_required',
        entities: ['opportunities', 'companies'],
        configFields: [
            {
                key: 'system',
                label: 'ERP system',
                type: 'select',
                options: ['SAP S/4HANA', 'NetSuite', 'Microsoft Dynamics 365', '1C:Підприємство'],
                default: 'NetSuite'
            },
            {
                key: 'reason',
                label: 'Reason',
                type: 'select',
                options: ['New contract', 'Update forecast', 'Sync account data', 'Invoice request'],
                default: 'New contract'
            }
        ]
    }
];

const WORKFLOW_CONDITION_OPTIONS = [
    {
        id: 'high_value_deal',
        label: 'Deal value > $50k',
        description: 'Use for enterprise-sized or strategic opportunities.',
        entities: ['opportunities']
    },
    {
        id: 'tier1_account',
        label: 'Account tier is Strategic',
        description: 'Limit automation to Tier 1 accounts.',
        entities: ['opportunities', 'companies', 'tasks']
    },
    {
        id: 'call_outcome_positive',
        label: 'Call outcome is Positive',
        description: 'Only run when a call is successful.',
        entities: ['activities']
    },
    {
        id: 'task_priority_high',
        label: 'Task priority is High',
        description: 'Focus automation on urgent work items.',
        entities: ['tasks']
    },
    {
        id: 'erp_sync_pending',
        label: 'ERP sync pending flag = true',
        description: 'Run when integration status indicates pending sync.',
        entities: ['opportunities', 'companies']
    },
    {
        id: 'no_open_tasks',
        label: 'No open tasks on record',
        description: 'Avoid creating duplicate follow-up tasks.',
        entities: ['activities', 'opportunities', 'leads']
    }
];

const WORKFLOW_ACTION_LIBRARY = {
    create_task: {
        label: 'Create CRM task',
        icon: 'fa-list-check',
        color: 'bg-blue-50 text-blue-700',
        description: 'Automatically assign a follow-up task to the right owner.',
        configFields: [
            {
                key: 'title',
                label: 'Task title',
                type: 'text',
                placeholder: 'Follow-up call with client',
                description: 'Use merge tags such as {{contact.first_name}}.'
            },
            {
                key: 'due_in_days',
                label: 'Due in (days)',
                type: 'number',
                min: 0,
                max: 30,
                default: 2,
                description: 'Number of days until the task is due.'
            },
            {
                key: 'priority',
                label: 'Priority',
                type: 'select',
                options: ['Low', 'Medium', 'High', 'Critical'],
                default: 'Medium'
            },
            {
                key: 'assignee',
                label: 'Assign to',
                type: 'text',
                placeholder: 'Team or user name',
                description: 'Route to a queue, role, or individual owner.'
            }
        ]
    },
    send_reminder: {
        label: 'Send reminder',
        icon: 'fa-bell',
        color: 'bg-amber-50 text-amber-700',
        description: 'Send proactive nudges via email, SMS or Slack.',
        configFields: [
            {
                key: 'channel',
                label: 'Channel',
                type: 'select',
                options: ['Email', 'SMS', 'In-app', 'Slack'],
                default: 'Email'
            },
            {
                key: 'offset',
                label: 'Send after (minutes)',
                type: 'number',
                min: 0,
                max: 1440,
                default: 15,
                description: 'Delay after the trigger event before sending.'
            },
            {
                key: 'message',
                label: 'Message template',
                type: 'textarea',
                placeholder: 'Hi {{contact.first_name}}, here is your reminder...',
                description: 'Supports liquid-style merge tags.'
            }
        ]
    },
    update_status: {
        label: 'Update record status',
        icon: 'fa-arrows-rotate',
        color: 'bg-purple-50 text-purple-700',
        description: 'Automatically move records to the correct status or stage.',
        configFields: [
            {
                key: 'field',
                label: 'Field to update',
                type: 'select',
                options: ['Opportunity Stage', 'Lead Status', 'Task Status'],
                default: 'Opportunity Stage'
            },
            {
                key: 'value',
                label: 'New value',
                type: 'text',
                placeholder: 'Negotiation',
                description: 'Provide the new status, stage, or label.'
            }
        ]
    },
    sync_erp: {
        label: 'Sync with ERP',
        icon: 'fa-cloud-arrow-up',
        color: 'bg-emerald-50 text-emerald-700',
        description: 'Send structured payloads to ERP or financial systems.',
        configFields: [
            {
                key: 'system',
                label: 'ERP system',
                type: 'select',
                options: ['SAP S/4HANA', 'NetSuite', 'Microsoft Dynamics 365', '1C:Підприємство'],
                default: 'SAP S/4HANA'
            },
            {
                key: 'mode',
                label: 'Sync mode',
                type: 'select',
                options: ['Immediate', 'Batch', 'Nightly'],
                default: 'Immediate'
            },
            {
                key: 'payload',
                label: 'Data payload',
                type: 'textarea',
                placeholder: 'opportunity_id,value,close_date',
                description: 'Fields that will be transmitted to the ERP connector.'
            }
        ]
    }
};

const WORKFLOW_RUN_LOG_SEED = [
    {
        id: 'run-1',
        workflowName: 'Discovery call follow-up',
        event: 'Call completed · Emily Johnson',
        executedAt: '2024-05-07T16:45:00Z',
        status: 'Success',
        owner: 'RevOps Automation',
        actions: [
            { label: 'Task created', detail: 'Send discovery recap · Due in 1 day' },
            { label: 'Reminder scheduled', detail: 'Email · +30 minutes' }
        ]
    },
    {
        id: 'run-2',
        workflowName: 'Closed won implementation kickoff',
        event: 'Stage changed to Closed Won · TechCorp Solutions',
        executedAt: '2024-05-06T14:20:00Z',
        status: 'Success',
        owner: 'Sales Operations',
        actions: [
            { label: 'Status updated', detail: 'Opportunity Stage → Closed Won' },
            { label: 'Task created', detail: 'Kickoff with Implementation · Due in 2 days' },
            { label: 'ERP sync', detail: 'SAP S/4HANA · Immediate' }
        ]
    },
    {
        id: 'run-3',
        workflowName: 'Renewal risk escalation',
        event: 'Task overdue · Strategic renewal portfolio',
        executedAt: '2024-05-07T09:55:00Z',
        status: 'Warning',
        owner: 'Customer Success Ops',
        actions: [
            { label: 'Reminder sent', detail: 'Slack · +5 minutes' },
            { label: 'ERP sync', detail: 'NetSuite · Immediate' }
        ]
    }
];

const ERP_SYNC_CONNECTIONS = [
    {
        system: 'SAP S/4HANA',
        scope: 'Opportunities · Orders · Forecast',
        frequency: 'Real-time via webhooks',
        owner: 'Integration Hub',
        status: 'Healthy',
        lastSync: '2024-05-07T11:30:00Z',
        notes: 'Bidirectional sync for pricing, contracts and invoices.'
    },
    {
        system: 'Microsoft Dynamics 365',
        scope: 'Accounts · Renewals',
        frequency: 'Every 15 minutes',
        owner: 'Sales Operations',
        status: 'Warning',
        lastSync: '2024-05-07T11:10:00Z',
        notes: 'Monitoring API limit consumption after Q2 load.'
    },
    {
        system: '1C:Підприємство',
        scope: 'Contracts · Payments',
        frequency: 'Nightly 02:00',
        owner: 'Finance Ops',
        status: 'Healthy',
        lastSync: '2024-05-07T02:05:00Z',
        notes: 'Nightly job creates fiscal documents and syncs balances.'
    }
];

const automationState = {
    workflows: [],
    runLog: WORKFLOW_RUN_LOG_SEED.map(entry => ({
        ...entry,
        actions: (entry.actions || []).map(action => ({ ...action }))
    })),
    builder: null
};

async function showAutomation() {
    ensureAutomationBuilderState();
    showView('automation');
    updatePageHeader('Automation', 'Automate routine processes with event-driven workflows');

    renderAutomationView();
    await fetchAutomationWorkflows();
}

async function fetchAutomationWorkflows(showSuccessToast = false) {
    showLoading();
    try {
        const response = await fetch('tables/workflows?sort=-updated_at');
        if (!response.ok) {
            throw new Error('Failed to load workflows');
        }
        const data = await response.json();
        const list = Array.isArray(data.data) ? data.data.slice() : [];
        automationState.workflows = list.sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));
        if (showSuccessToast) {
            showToast('Automation catalogue refreshed', 'success');
        }
        renderAutomationView();
    } catch (error) {
        console.error('Error loading automation workflows:', error);
        if (!automationState.workflows.length) {
            const view = document.getElementById('automationView');
            if (view) {
                view.innerHTML = `
                    <div class="bg-white border border-red-100 text-red-600 rounded-xl p-6">
                        Unable to load workflows. Please try again later.
                    </div>
                `;
            }
        }
        showToast('Failed to load automation workflows', 'error');
    } finally {
        hideLoading();
    }
}

function renderAutomationView() {
    const view = document.getElementById('automationView');
    if (!view) {
        return;
    }

    const builder = ensureAutomationBuilderState();
    const stats = calculateAutomationStats(automationState.workflows);
    const workflowList = renderAutomationWorkflowList(automationState.workflows);
    const builderPanel = renderAutomationBuilderPanel(builder);
    const runLog = renderAutomationRunLog(automationState.runLog);
    const integrationGrid = renderAutomationErpGrid();

    view.innerHTML = `
        <div class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                ${renderAutomationStatCard('Active workflows', stats.activeCount, 'Automations monitoring CRM events', 'fa-diagram-project', 'bg-blue-50 text-blue-600')}
                ${renderAutomationStatCard('Task actions / month', stats.tasksCreated, 'Tasks created by automation', 'fa-list-check', 'bg-emerald-50 text-emerald-700')}
                ${renderAutomationStatCard('Reminders scheduled', stats.remindersSent, 'Notifications sent automatically', 'fa-bell', 'bg-amber-50 text-amber-700')}
                ${renderAutomationStatCard('ERP sync signals', stats.erpSyncs, 'Records pushed to ERP', 'fa-cloud-arrow-up', 'bg-purple-50 text-purple-700')}
            </div>

            <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div class="xl:col-span-2 bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
                    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h3 class="text-xl font-semibold text-gray-800">Active Workflows</h3>
                            <p class="text-sm text-gray-600">Event-driven playbooks creating tasks, reminders and ERP syncs.</p>
                        </div>
                        <div class="flex items-center space-x-3">
                            <button id="automationRefresh" class="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 rounded-lg border border-blue-100 bg-blue-50/40">
                                <i class="fas fa-rotate mr-2"></i>Refresh
                            </button>
                        </div>
                    </div>
                    <div id="automationWorkflowList" class="space-y-4">
                        ${workflowList}
                    </div>
                </div>
                <div class="bg-white border border-gray-200 rounded-2xl p-6">
                    ${builderPanel}
                </div>
            </div>

            <div class="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 class="text-xl font-semibold text-gray-800">Execution Monitor</h3>
                        <p class="text-sm text-gray-600">Track recent workflow runs and integration health.</p>
                    </div>
                    <span class="text-xs text-gray-500">Simulated telemetry for demo purposes</span>
                </div>
                ${runLog}
            </div>

            <div class="bg-white border border-gray-200 rounded-2xl p-6 space-y-6">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 class="text-xl font-semibold text-gray-800">ERP Integration Coverage</h3>
                        <p class="text-sm text-gray-600">Overview of live synchronisation jobs with finance systems.</p>
                    </div>
                    <span class="text-xs text-gray-500">Maintained by Revenue & Finance Ops</span>
                </div>
                ${integrationGrid}
            </div>
        </div>
    `;

    const refreshButton = document.getElementById('automationRefresh');
    if (refreshButton) {
        refreshButton.addEventListener('click', event => {
            event.preventDefault();
            fetchAutomationWorkflows(true);
        });
    }

    initializeAutomationBuilder();
}

function renderAutomationStatCard(label, value, caption, icon, iconClass) {
    return `
        <div class="bg-white border border-gray-200 rounded-2xl p-5">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm text-gray-500">${sanitizeAutomationHtml(label)}</p>
                    <p class="text-2xl font-semibold text-gray-800 mt-1">${formatAutomationNumber(value)}</p>
                </div>
                <div class="w-12 h-12 rounded-xl flex items-center justify-center ${iconClass}">
                    <i class="fas ${icon}"></i>
                </div>
            </div>
            <p class="text-xs text-gray-500 mt-3">${sanitizeAutomationHtml(caption)}</p>
        </div>
    `;
}

function calculateAutomationStats(workflows) {
    return workflows.reduce((acc, workflow) => {
        const status = (workflow.status || '').toLowerCase();
        if (!status || status === 'active' || status === 'enabled' || status === 'running') {
            acc.activeCount += 1;
        }
        const metrics = workflow.metrics || {};
        const taskCount = Number(metrics.tasks_created);
        const reminderCount = Number(metrics.reminders_sent);
        const erpCount = Number(metrics.erp_syncs);
        acc.tasksCreated += Number.isFinite(taskCount) ? taskCount : (workflow.actions || []).filter(action => action.type === 'create_task').length;
        acc.remindersSent += Number.isFinite(reminderCount) ? reminderCount : (workflow.actions || []).filter(action => action.type === 'send_reminder').length;
        acc.erpSyncs += Number.isFinite(erpCount) ? erpCount : (workflow.actions || []).filter(action => action.type === 'sync_erp').length;
        return acc;
    }, { activeCount: 0, tasksCreated: 0, remindersSent: 0, erpSyncs: 0 });
}

function renderAutomationWorkflowList(workflows) {
    if (!workflows.length) {
        return `
            <div class="border border-dashed border-gray-300 rounded-xl p-6 text-center text-sm text-gray-500">
                <p class="font-medium text-gray-700">No workflows configured yet.</p>
                <p class="text-xs text-gray-500 mt-2">Use the builder to automate task creation, reminders, status updates and ERP synchronisation.</p>
            </div>
        `;
    }
    return workflows.map(renderAutomationWorkflowCard).join('');
}

function renderAutomationWorkflowCard(workflow) {
    const trigger = workflow.trigger || {};
    const triggerDefinition = getAutomationTriggerDefinition(trigger.id || trigger);
    const triggerLabel = trigger.label || triggerDefinition?.label || 'Event trigger';
    const triggerDescription = trigger.description || triggerDefinition?.description || '';
    const triggerIcon = trigger.icon || triggerDefinition?.icon || 'fa-bolt';
    const metrics = workflow.metrics || {};
    const lastRun = workflow.last_run_at || workflow.updated_at || workflow.created_at;
    const actions = Array.isArray(workflow.actions) ? workflow.actions : [];
    const conditions = Array.isArray(workflow.conditions) ? workflow.conditions : [];

    const actionBadges = actions.length
        ? actions.map(action => {
            const definition = getAutomationActionDefinition(action.type);
            const color = definition?.color || 'bg-gray-100 text-gray-700';
            const icon = action.icon || definition?.icon || 'fa-gear';
            const label = action.label || definition?.label || action.type;
            const summary = summarizeAutomationAction(action);
            return `
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${color}">
                    <i class="fas ${icon} mr-2"></i>
                    ${sanitizeAutomationHtml(label)}
                    ${summary ? `<span class="text-[11px] font-normal text-gray-600 ml-1">· ${sanitizeAutomationHtml(summary)}</span>` : ''}
                </span>
            `;
        }).join('')
        : '<span class="text-xs text-gray-500">No actions configured</span>';

    const conditionBadges = conditions.length
        ? conditions.map(condition => `
            <span class="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-700">
                <i class="fas fa-filter mr-2 text-gray-400"></i>
                ${sanitizeAutomationHtml(condition.label || condition.id)}
            </span>
        `).join('')
        : `<span class="text-xs text-gray-500">Runs for all ${sanitizeAutomationHtml(formatAutomationEntityLabel(workflow.entity))}</span>`;

    const successRate = Number(metrics.success_rate);
    const successPercent = Number.isFinite(successRate) ? Math.round(successRate * 100) : '—';

    return `
        <div class="border border-gray-200 rounded-2xl p-5 hover:border-blue-200 transition-colors">
            <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                    <div class="flex items-center space-x-3">
                        <h4 class="text-lg font-semibold text-gray-800">${sanitizeAutomationHtml(workflow.name || 'Workflow')}</h4>
                        <span class="px-2 py-1 text-xs rounded-full ${getAutomationStatusBadgeClass(workflow.status)}">${sanitizeAutomationHtml(workflow.status || 'Active')}</span>
                    </div>
                    <p class="text-sm text-gray-600 mt-1">${sanitizeAutomationHtml(workflow.description || triggerDescription)}</p>
                    <p class="text-xs text-gray-500 mt-2"><i class="fas fa-database mr-2 text-gray-400"></i>${sanitizeAutomationHtml(formatAutomationEntityLabel(workflow.entity))}</p>
                </div>
                <div class="text-xs text-gray-500 text-right space-y-1">
                    <p><i class="fas fa-user-shield mr-2"></i>${sanitizeAutomationHtml(workflow.owner || 'Automation Engine')}</p>
                    <p><i class="fas fa-clock mr-2"></i>${sanitizeAutomationHtml(formatAutomationRelativeTime(lastRun))}</p>
                </div>
            </div>

            <div class="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Trigger</p>
                    <div class="mt-2 flex items-start space-x-3">
                        <span class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 text-blue-600">
                            <i class="fas ${triggerIcon}"></i>
                        </span>
                        <div>
                            <p class="text-sm font-medium text-gray-800">${sanitizeAutomationHtml(triggerLabel)}</p>
                            <p class="text-xs text-gray-500">${sanitizeAutomationHtml(triggerDescription)}</p>
                        </div>
                    </div>
                </div>
                <div>
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide">Run metrics</p>
                    <div class="mt-2 text-sm text-gray-600 space-y-1">
                        <p>${sanitizeAutomationHtml(String(metrics.runs ?? 0))} runs · Success ${sanitizeAutomationHtml(successPercent === '—' ? '—' : `${successPercent}%`)}</p>
                        <p class="text-xs text-gray-500">Tasks ${sanitizeAutomationHtml(String(metrics.tasks_created ?? 0))} · Reminders ${sanitizeAutomationHtml(String(metrics.reminders_sent ?? 0))} · ERP sync ${sanitizeAutomationHtml(String(metrics.erp_syncs ?? 0))}</p>
                    </div>
                </div>
            </div>

            <div class="mt-4">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Actions</p>
                <div class="flex flex-wrap gap-2">${actionBadges}</div>
            </div>

            <div class="mt-4">
                <p class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Conditions</p>
                <div class="flex flex-wrap gap-2">${conditionBadges}</div>
            </div>
        </div>
    `;
}

function summarizeAutomationAction(action) {
    if (!action) {
        return '';
    }
    const settings = action.settings || {};
    switch (action.type) {
        case 'create_task': {
            const segments = [];
            if (settings.title) {
                segments.push(settings.title);
            }
            if (settings.due_in_days !== undefined && settings.due_in_days !== null && settings.due_in_days !== '') {
                const due = Number(settings.due_in_days);
                if (Number.isFinite(due)) {
                    segments.push(`Due in ${due} day${due === 1 ? '' : 's'}`);
                }
            }
            if (settings.assignee) {
                segments.push(`Assign to ${settings.assignee}`);
            }
            return segments.join(' · ');
        }
        case 'send_reminder': {
            const segments = [];
            if (settings.channel) {
                segments.push(settings.channel);
            }
            if (settings.offset !== undefined && settings.offset !== null && settings.offset !== '') {
                const offset = Number(settings.offset);
                if (Number.isFinite(offset)) {
                    segments.push(`+${offset} min`);
                }
            }
            return segments.join(' · ');
        }
        case 'update_status': {
            const field = settings.field ? `${settings.field}` : 'Status';
            const value = settings.value ? `→ ${settings.value}` : '';
            return `${field} ${value}`.trim();
        }
        case 'sync_erp': {
            const system = settings.system || 'ERP';
            const mode = settings.mode || '';
            return [system, mode].filter(Boolean).join(' · ');
        }
        default:
            return '';
    }
}

function renderAutomationBuilderPanel(builder) {
    const triggerOptions = getAutomationTriggerOptions(builder.entity);
    const triggerDefinition = getAutomationTriggerDefinition(builder.trigger);
    const triggerDescription = triggerDefinition?.description || 'Select a trigger event to start the workflow.';
    const triggerFields = renderAutomationTriggerConfigFields(builder.trigger, builder.triggerConfig);
    const conditions = renderAutomationConditions(builder.entity, builder.conditions);
    const actions = renderAutomationActionsList(builder.actions);

    return `
        <div class="space-y-5">
            <div>
                <h3 class="text-lg font-semibold text-gray-800">Workflow Builder</h3>
                <p class="text-sm text-gray-600 mt-1">Orchestrate tasks, reminders and ERP sync from one automation.</p>
            </div>
            <form id="workflowBuilderForm" class="space-y-5">
                <div class="space-y-3">
                    <div>
                        <label for="workflowName" class="block text-xs font-semibold text-gray-500 uppercase mb-1">Workflow name</label>
                        <input type="text" id="workflowName" value="${sanitizeAutomationHtml(builder.name)}" placeholder="e.g. Handoff after Closed Won" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                    </div>
                    <div>
                        <label for="workflowOwner" class="block text-xs font-semibold text-gray-500 uppercase mb-1">Owner</label>
                        <input type="text" id="workflowOwner" value="${sanitizeAutomationHtml(builder.owner || '')}" placeholder="Automation owner or team" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    <div>
                        <label for="workflowDescription" class="block text-xs font-semibold text-gray-500 uppercase mb-1">Description</label>
                        <textarea id="workflowDescription" rows="2" placeholder="Describe the business process the automation should cover" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">${sanitizeAutomationHtml(builder.description || '')}</textarea>
                    </div>
                </div>

                <div class="space-y-3">
                    <div>
                        <label for="workflowEntity" class="block text-xs font-semibold text-gray-500 uppercase mb-1">Target entity</label>
                        <select id="workflowEntity" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            ${['opportunities', 'leads', 'activities', 'tasks', 'companies'].map(entity => `<option value="${entity}" ${builder.entity === entity ? 'selected' : ''}>${sanitizeAutomationHtml(formatAutomationEntityLabel(entity))}</option>`).join('')}
                        </select>
                    </div>
                    <div>
                        <label for="workflowTrigger" class="block text-xs font-semibold text-gray-500 uppercase mb-1">Trigger event</label>
                        <select id="workflowTrigger" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" ${triggerOptions.length ? '' : 'disabled'}>
                            ${triggerOptions.length ? triggerOptions.map(option => `<option value="${option.id}" ${option.id === builder.trigger ? 'selected' : ''}>${sanitizeAutomationHtml(option.label)}</option>`).join('') : '<option>No triggers available</option>'}
                        </select>
                        <p class="text-xs text-gray-500 mt-1">${sanitizeAutomationHtml(triggerDescription)}</p>
                    </div>
                    <div id="workflowTriggerConfig" class="space-y-3">
                        ${triggerFields}
                    </div>
                </div>

                <div class="space-y-3">
                    <p class="text-xs font-semibold text-gray-500 uppercase mb-1">Optional conditions</p>
                    <div id="workflowConditions" class="space-y-2 max-h-44 overflow-y-auto pr-1">
                        ${conditions}
                    </div>
                </div>

                <div class="space-y-3">
                    <div class="flex items-center justify-between">
                        <p class="text-xs font-semibold text-gray-500 uppercase">Actions</p>
                        <button type="button" id="workflowAddAction" class="text-xs font-medium text-blue-600 hover:text-blue-700">
                            <i class="fas fa-plus mr-1"></i>Add action
                        </button>
                    </div>
                    <div id="workflowActionList" class="space-y-3">
                        ${actions}
                    </div>
                </div>

                <div class="pt-4 border-t border-gray-200">
                    <button type="submit" class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
                        Save & Activate Workflow
                    </button>
                    <p class="text-xs text-gray-500 text-center mt-2">
                        Actions run sequentially. ERP sync executes last to push the final state.
                    </p>
                </div>
            </form>
        </div>
    `;
}

function renderAutomationTriggerConfigFields(triggerId, config = {}) {
    const definition = getAutomationTriggerDefinition(triggerId);
    if (!definition || !Array.isArray(definition.configFields) || !definition.configFields.length) {
        return '<p class="text-xs text-gray-500">No additional configuration required for this trigger.</p>';
    }
    return definition.configFields.map(field => renderAutomationTriggerConfigField(triggerId, field, config[field.key])).join('');
}

function renderAutomationTriggerConfigField(triggerId, field, rawValue) {
    const value = rawValue ?? field.default ?? (field.type === 'select' && Array.isArray(field.options) && field.options.length ? field.options[0] : '');
    const inputId = `trigger-${triggerId}-${field.key}`;
    const description = field.description ? `<p class="text-xs text-gray-400 mt-1">${sanitizeAutomationHtml(field.description)}</p>` : '';
    const dataset = `data-trigger-field="${field.key}"`;

    if (field.type === 'select') {
        return `
            <div>
                <label for="${inputId}" class="block text-xs font-semibold text-gray-500 uppercase mb-1">${sanitizeAutomationHtml(field.label)}</label>
                <select id="${inputId}" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" ${dataset}>
                    ${(field.options || []).map(option => `<option value="${sanitizeAutomationHtml(option)}" ${option === value ? 'selected' : ''}>${sanitizeAutomationHtml(option)}</option>`).join('')}
                </select>
                ${description}
            </div>
        `;
    }

    if (field.type === 'number') {
        return `
            <div>
                <label for="${inputId}" class="block text-xs font-semibold text-gray-500 uppercase mb-1">${sanitizeAutomationHtml(field.label)}</label>
                <input type="number" id="${inputId}" value="${value === '' ? '' : sanitizeAutomationHtml(value)}" ${field.min !== undefined ? `min="${field.min}"` : ''} ${field.max !== undefined ? `max="${field.max}"` : ''} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" ${dataset}>
                ${description}
            </div>
        `;
    }

    return `
        <div>
            <label for="${inputId}" class="block text-xs font-semibold text-gray-500 uppercase mb-1">${sanitizeAutomationHtml(field.label)}</label>
            <input type="text" id="${inputId}" value="${sanitizeAutomationHtml(value)}" ${field.placeholder ? `placeholder="${sanitizeAutomationHtml(field.placeholder)}"` : ''} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" ${dataset}>
            ${description}
        </div>
    `;
}

function renderAutomationConditions(entity, selected = []) {
    const available = WORKFLOW_CONDITION_OPTIONS.filter(condition => !condition.entities || condition.entities.includes(entity));
    if (!available.length) {
        return '<p class="text-xs text-gray-500">No additional conditions for this entity.</p>';
    }
    return available.map(condition => {
        const checked = selected.includes(condition.id) ? 'checked' : '';
        return `
            <label class="flex items-start space-x-3 p-3 border border-gray-200 rounded-xl hover:border-blue-300 cursor-pointer">
                <input type="checkbox" class="mt-1" data-condition-id="${condition.id}" ${checked}>
                <span>
                    <span class="text-sm font-medium text-gray-800">${sanitizeAutomationHtml(condition.label)}</span>
                    ${condition.description ? `<p class="text-xs text-gray-500">${sanitizeAutomationHtml(condition.description)}</p>` : ''}
                </span>
            </label>
        `;
    }).join('');
}

function renderAutomationActionsList(actions = []) {
    if (!actions.length) {
        return `
            <div class="border border-dashed border-gray-300 rounded-xl p-4 text-center text-sm text-gray-500">
                <p>Add at least one action to execute when the trigger fires.</p>
            </div>
        `;
    }
    return actions.map((action, index) => renderAutomationActionBlock(action, index)).join('');
}

function renderAutomationActionBlock(action, index) {
    const definition = getAutomationActionDefinition(action.type);
    const configFields = definition?.configFields || [];
    const configHtml = configFields.map(field => renderAutomationActionConfigField(action, index, field, action.settings?.[field.key])).join('');
    return `
        <div class="border border-gray-200 rounded-xl p-4 space-y-3" data-action-index="${index}">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-xs font-semibold text-gray-500 uppercase">Action ${index + 1}</p>
                    <p class="text-sm font-medium text-gray-800">${sanitizeAutomationHtml(definition?.label || action.label || 'Action')}</p>
                </div>
                <div class="flex items-center space-x-2">
                    <select class="workflow-action-type border border-gray-300 rounded-lg px-2 py-1 text-sm" data-action-index="${index}">
                        ${Object.entries(WORKFLOW_ACTION_LIBRARY).map(([key, libraryAction]) => `<option value="${key}" ${key === action.type ? 'selected' : ''}>${sanitizeAutomationHtml(libraryAction.label)}</option>`).join('')}
                    </select>
                    <button type="button" data-remove-action="${index}" class="text-sm text-red-500 hover:text-red-600">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="grid grid-cols-1 gap-3">
                ${configHtml || '<p class="text-xs text-gray-500">No configuration required.</p>'}
            </div>
        </div>
    `;
}

function renderAutomationActionConfigField(action, index, field, rawValue) {
    const value = rawValue ?? field.default ?? (field.type === 'select' && Array.isArray(field.options) && field.options.length ? field.options[0] : '');
    const inputId = `action-${index}-${field.key}`;
    const description = field.description ? `<p class="text-xs text-gray-400 mt-1">${sanitizeAutomationHtml(field.description)}</p>` : '';
    const dataset = `data-action-index="${index}" data-action-field="${field.key}"`;

    if (field.type === 'select') {
        return `
            <div>
                <label for="${inputId}" class="block text-xs font-semibold text-gray-500 uppercase mb-1">${sanitizeAutomationHtml(field.label)}</label>
                <select id="${inputId}" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" ${dataset}>
                    ${(field.options || []).map(option => `<option value="${sanitizeAutomationHtml(option)}" ${option === value ? 'selected' : ''}>${sanitizeAutomationHtml(option)}</option>`).join('')}
                </select>
                ${description}
            </div>
        `;
    }

    if (field.type === 'number') {
        return `
            <div>
                <label for="${inputId}" class="block text-xs font-semibold text-gray-500 uppercase mb-1">${sanitizeAutomationHtml(field.label)}</label>
                <input type="number" id="${inputId}" value="${value === '' ? '' : sanitizeAutomationHtml(value)}" ${field.min !== undefined ? `min="${field.min}"` : ''} ${field.max !== undefined ? `max="${field.max}"` : ''} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" ${dataset}>
                ${description}
            </div>
        `;
    }

    if (field.type === 'textarea') {
        return `
            <div>
                <label for="${inputId}" class="block text-xs font-semibold text-gray-500 uppercase mb-1">${sanitizeAutomationHtml(field.label)}</label>
                <textarea id="${inputId}" rows="3" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" ${dataset}>${sanitizeAutomationHtml(value)}</textarea>
                ${description}
            </div>
        `;
    }

    return `
        <div>
            <label for="${inputId}" class="block text-xs font-semibold text-gray-500 uppercase mb-1">${sanitizeAutomationHtml(field.label)}</label>
            <input type="text" id="${inputId}" value="${sanitizeAutomationHtml(value)}" ${field.placeholder ? `placeholder="${sanitizeAutomationHtml(field.placeholder)}"` : ''} class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" ${dataset}>
            ${description}
        </div>
    `;
}

function renderAutomationRunLog(entries = []) {
    if (!entries.length) {
        return '<p class="text-sm text-gray-500">No executions logged yet.</p>';
    }
    return `
        <div class="overflow-x-auto">
            <table class="w-full text-sm">
                <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                        <th class="p-3 text-left">Workflow</th>
                        <th class="p-3 text-left">Event</th>
                        <th class="p-3 text-left">Actions</th>
                        <th class="p-3 text-left">When</th>
                        <th class="p-3 text-right">Status</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    ${entries.map(entry => `
                        <tr>
                            <td class="p-3 align-top">
                                <p class="font-medium text-gray-800">${sanitizeAutomationHtml(entry.workflowName)}</p>
                                <p class="text-xs text-gray-500 mt-1">${sanitizeAutomationHtml(entry.owner || '')}</p>
                            </td>
                            <td class="p-3 align-top text-sm text-gray-700">
                                ${sanitizeAutomationHtml(entry.event || '')}
                            </td>
                            <td class="p-3 align-top">
                                <div class="flex flex-wrap gap-2">
                                    ${(entry.actions || []).map(action => `
                                        <span class="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-700">
                                            <i class="fas fa-check mr-2 text-gray-400"></i>
                                            ${sanitizeAutomationHtml(action.label)}
                                            ${action.detail ? `<span class="ml-1 text-gray-500">· ${sanitizeAutomationHtml(action.detail)}</span>` : ''}
                                        </span>
                                    `).join('')}
                                </div>
                            </td>
                            <td class="p-3 align-top text-sm text-gray-600">
                                <p>${sanitizeAutomationHtml(formatAutomationRelativeTime(entry.executedAt))}</p>
                                <p class="text-xs text-gray-500 mt-1">${entry.executedAt ? sanitizeAutomationHtml(new Date(entry.executedAt).toLocaleString()) : ''}</p>
                            </td>
                            <td class="p-3 align-top text-right">
                                <span class="px-2 py-1 rounded-full text-xs ${getAutomationRunStatusBadgeClass(entry.status)}">${sanitizeAutomationHtml(entry.status || 'Success')}</span>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderAutomationErpGrid() {
    if (!ERP_SYNC_CONNECTIONS.length) {
        return '<p class="text-sm text-gray-500">No ERP integrations configured.</p>';
    }
    return `
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            ${ERP_SYNC_CONNECTIONS.map(connection => `
                <div class="border border-gray-200 rounded-2xl p-4 space-y-3">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-md font-semibold text-gray-800">${sanitizeAutomationHtml(connection.system)}</p>
                            <p class="text-xs text-gray-500">${sanitizeAutomationHtml(connection.scope)}</p>
                        </div>
                        <span class="px-2 py-1 rounded-full text-xs ${getAutomationIntegrationStatusBadgeClass(connection.status)}">${sanitizeAutomationHtml(connection.status)}</span>
                    </div>
                    <div class="text-sm text-gray-600 space-y-2">
                        <p><i class="fas fa-rotate-right mr-2 text-gray-400"></i>${sanitizeAutomationHtml(connection.frequency)}</p>
                        <p><i class="fas fa-user-shield mr-2 text-gray-400"></i>${sanitizeAutomationHtml(connection.owner)}</p>
                        <p><i class="fas fa-clock mr-2 text-gray-400"></i>${sanitizeAutomationHtml(formatAutomationRelativeTime(connection.lastSync))}</p>
                    </div>
                    ${connection.notes ? `<p class="text-xs text-gray-500">${sanitizeAutomationHtml(connection.notes)}</p>` : ''}
                </div>
            `).join('')}
        </div>
    `;
}

function initializeAutomationBuilder() {
    const builder = ensureAutomationBuilderState();
    const form = document.getElementById('workflowBuilderForm');
    if (!form) {
        return;
    }

    const nameInput = document.getElementById('workflowName');
    if (nameInput) {
        nameInput.addEventListener('input', event => {
            builder.name = event.target.value;
        });
    }

    const ownerInput = document.getElementById('workflowOwner');
    if (ownerInput) {
        ownerInput.addEventListener('input', event => {
            builder.owner = event.target.value;
        });
    }

    const descriptionInput = document.getElementById('workflowDescription');
    if (descriptionInput) {
        descriptionInput.addEventListener('input', event => {
            builder.description = event.target.value;
        });
    }

    const entitySelect = document.getElementById('workflowEntity');
    if (entitySelect) {
        entitySelect.addEventListener('change', event => {
            builder.entity = event.target.value;
            const triggers = getAutomationTriggerOptions(builder.entity);
            if (!triggers.some(option => option.id === builder.trigger)) {
                builder.trigger = triggers[0]?.id || '';
                builder.triggerConfig = createDefaultAutomationTriggerConfig(builder.trigger);
            }
            builder.conditions = builder.conditions.filter(conditionId => {
                const definition = WORKFLOW_CONDITION_OPTIONS.find(condition => condition.id === conditionId);
                return definition?.entities?.includes(builder.entity);
            });
            renderAutomationView();
        });
    }

    const triggerSelect = document.getElementById('workflowTrigger');
    if (triggerSelect) {
        triggerSelect.addEventListener('change', event => {
            builder.trigger = event.target.value;
            builder.triggerConfig = createDefaultAutomationTriggerConfig(builder.trigger);
            renderAutomationView();
        });
    }

    document.querySelectorAll('[data-trigger-field]').forEach(input => {
        const fieldKey = input.dataset.triggerField;
        if (!fieldKey) {
            return;
        }
        const handler = event => {
            builder.triggerConfig[fieldKey] = automationGetInputValue(event.target);
        };
        input.addEventListener('input', handler);
        input.addEventListener('change', handler);
    });

    document.querySelectorAll('[data-condition-id]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const conditionId = checkbox.dataset.conditionId;
            if (!conditionId) {
                return;
            }
            if (checkbox.checked) {
                if (!builder.conditions.includes(conditionId)) {
                    builder.conditions.push(conditionId);
                }
            } else {
                builder.conditions = builder.conditions.filter(id => id !== conditionId);
            }
        });
    });

    const addActionButton = document.getElementById('workflowAddAction');
    if (addActionButton) {
        addActionButton.addEventListener('click', event => {
            event.preventDefault();
            const defaultType = Object.keys(WORKFLOW_ACTION_LIBRARY)[0];
            builder.actions.push({
                type: defaultType,
                settings: createDefaultAutomationActionSettings(defaultType)
            });
            renderAutomationView();
        });
    }

    document.querySelectorAll('.workflow-action-type').forEach(select => {
        select.addEventListener('change', event => {
            const index = Number(event.target.dataset.actionIndex);
            if (!Number.isFinite(index)) {
                return;
            }
            const type = event.target.value;
            if (!WORKFLOW_ACTION_LIBRARY[type]) {
                return;
            }
            builder.actions[index] = {
                type,
                settings: createDefaultAutomationActionSettings(type)
            };
            renderAutomationView();
        });
    });

    document.querySelectorAll('[data-remove-action]').forEach(button => {
        button.addEventListener('click', event => {
            event.preventDefault();
            const index = Number(button.dataset.removeAction);
            if (!Number.isFinite(index)) {
                return;
            }
            builder.actions.splice(index, 1);
            renderAutomationView();
        });
    });

    document.querySelectorAll('[data-action-field]').forEach(input => {
        const handler = event => {
            const index = Number(event.target.dataset.actionIndex);
            const fieldKey = event.target.dataset.actionField;
            if (!Number.isFinite(index) || !fieldKey) {
                return;
            }
            const action = builder.actions[index];
            if (!action) {
                return;
            }
            action.settings[fieldKey] = automationGetInputValue(event.target);
        };
        input.addEventListener('input', handler);
        input.addEventListener('change', handler);
    });

    form.addEventListener('submit', handleAutomationFormSubmit);
}

async function handleAutomationFormSubmit(event) {
    event.preventDefault();
    const builder = ensureAutomationBuilderState();

    if (!builder.name || !builder.name.trim()) {
        showToast('Please provide a workflow name.', 'warning');
        return;
    }
    if (!builder.entity) {
        showToast('Select a target entity for the workflow.', 'warning');
        return;
    }
    if (!builder.trigger) {
        showToast('Select a trigger event.', 'warning');
        return;
    }
    if (!builder.actions.length) {
        showToast('Add at least one action to the workflow.', 'warning');
        return;
    }

    const triggerDefinition = getAutomationTriggerDefinition(builder.trigger);
    const payload = {
        name: builder.name.trim(),
        description: builder.description?.trim() || triggerDefinition?.description || '',
        entity: builder.entity,
        status: 'Active',
        owner: builder.owner?.trim() || (typeof currentUser !== 'undefined' ? currentUser : 'Automation Engine'),
        trigger: {
            id: builder.trigger,
            label: triggerDefinition?.label || builder.trigger,
            icon: triggerDefinition?.icon || 'fa-bolt',
            event: triggerDefinition?.event || null,
            config: { ...builder.triggerConfig }
        },
        conditions: builder.conditions.map(conditionId => {
            const definition = WORKFLOW_CONDITION_OPTIONS.find(condition => condition.id === conditionId);
            return definition ? {
                id: definition.id,
                label: definition.label,
                description: definition.description
            } : { id: conditionId };
        }),
        actions: builder.actions.map((action, index) => {
            const definition = getAutomationActionDefinition(action.type);
            return {
                type: action.type,
                label: definition?.label || action.label || action.type,
                icon: definition?.icon || 'fa-gear',
                order: index + 1,
                settings: { ...action.settings }
            };
        }),
        metrics: {
            runs: 0,
            success_rate: 1,
            tasks_created: builder.actions.filter(action => action.type === 'create_task').length,
            reminders_sent: builder.actions.filter(action => action.type === 'send_reminder').length,
            erp_syncs: builder.actions.filter(action => action.type === 'sync_erp').length
        },
        last_run_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    showLoading();
    try {
        const response = await fetch('tables/workflows', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error('Failed to save workflow');
        }
        const created = await response.json();
        automationState.workflows.push(created);
        automationState.workflows.sort((a, b) => new Date(b.updated_at || b.created_at || 0) - new Date(a.updated_at || a.created_at || 0));

        automationState.runLog.unshift({
            id: `run-${Date.now()}`,
            workflowName: payload.name,
            owner: payload.owner,
            event: `${payload.trigger.label} configured`,
            executedAt: new Date().toISOString(),
            status: 'Scheduled',
            actions: payload.actions.map(action => ({
                label: action.label,
                detail: summarizeAutomationAction(action)
            }))
        });
        if (automationState.runLog.length > 8) {
            automationState.runLog = automationState.runLog.slice(0, 8);
        }

        showToast('Workflow created and activated', 'success');
        resetAutomationBuilderState();
        renderAutomationView();
    } catch (error) {
        console.error('Failed to create workflow:', error);
        showToast('Unable to save workflow', 'error');
    } finally {
        hideLoading();
    }
}

function resetAutomationBuilderState() {
    automationState.builder = createDefaultAutomationBuilderState();
}

function createDefaultAutomationBuilderState() {
    const defaultEntity = 'opportunities';
    const triggers = getAutomationTriggerOptions(defaultEntity);
    const defaultTrigger = triggers[0]?.id || '';
    return {
        name: '',
        owner: typeof currentUser !== 'undefined' ? currentUser : 'Automation Engine',
        description: '',
        entity: defaultEntity,
        trigger: defaultTrigger,
        triggerConfig: createDefaultAutomationTriggerConfig(defaultTrigger),
        conditions: [],
        actions: []
    };
}

function ensureAutomationBuilderState() {
    if (!automationState.builder) {
        automationState.builder = createDefaultAutomationBuilderState();
    }
    return automationState.builder;
}

function getAutomationTriggerOptions(entity) {
    return WORKFLOW_TRIGGER_OPTIONS.filter(option => !option.entities || option.entities.includes(entity));
}

function getAutomationTriggerDefinition(identifier) {
    if (!identifier) {
        return null;
    }
    return WORKFLOW_TRIGGER_OPTIONS.find(option => option.id === identifier) || null;
}

function createDefaultAutomationTriggerConfig(triggerId) {
    const definition = getAutomationTriggerDefinition(triggerId);
    if (!definition || !Array.isArray(definition.configFields)) {
        return {};
    }
    const config = {};
    definition.configFields.forEach(field => {
        if (field.default !== undefined) {
            config[field.key] = field.default;
        } else if (field.type === 'select' && Array.isArray(field.options) && field.options.length) {
            config[field.key] = field.options[0];
        } else {
            config[field.key] = '';
        }
    });
    return config;
}

function createDefaultAutomationActionSettings(type) {
    const definition = getAutomationActionDefinition(type);
    if (!definition || !Array.isArray(definition.configFields)) {
        return {};
    }
    const settings = {};
    definition.configFields.forEach(field => {
        if (field.default !== undefined) {
            settings[field.key] = field.default;
        } else if (field.type === 'select' && Array.isArray(field.options) && field.options.length) {
            settings[field.key] = field.options[0];
        } else {
            settings[field.key] = '';
        }
    });
    return settings;
}

function getAutomationActionDefinition(type) {
    return WORKFLOW_ACTION_LIBRARY[type] || null;
}

function getAutomationStatusBadgeClass(status) {
    const normalized = (status || '').toLowerCase();
    if (normalized.includes('active') || normalized.includes('running') || normalized.includes('enabled')) {
        return 'bg-green-50 text-green-600';
    }
    if (normalized.includes('paused') || normalized.includes('draft')) {
        return 'bg-yellow-50 text-yellow-700';
    }
    if (normalized.includes('error') || normalized.includes('failed')) {
        return 'bg-red-50 text-red-600';
    }
    return 'bg-gray-100 text-gray-600';
}

function getAutomationRunStatusBadgeClass(status) {
    const normalized = (status || '').toLowerCase();
    if (normalized.includes('success') || normalized.includes('completed')) {
        return 'bg-green-50 text-green-600';
    }
    if (normalized.includes('warning') || normalized.includes('retry')) {
        return 'bg-amber-50 text-amber-700';
    }
    if (normalized.includes('error') || normalized.includes('failed')) {
        return 'bg-red-50 text-red-600';
    }
    if (normalized.includes('scheduled')) {
        return 'bg-blue-50 text-blue-600';
    }
    return 'bg-gray-100 text-gray-600';
}

function getAutomationIntegrationStatusBadgeClass(status) {
    const normalized = (status || '').toLowerCase();
    if (normalized.includes('healthy') || normalized.includes('active')) {
        return 'bg-green-50 text-green-600';
    }
    if (normalized.includes('warning') || normalized.includes('degraded')) {
        return 'bg-amber-50 text-amber-700';
    }
    if (normalized.includes('failed') || normalized.includes('error')) {
        return 'bg-red-50 text-red-600';
    }
    return 'bg-gray-100 text-gray-600';
}

function formatAutomationEntityLabel(entity) {
    const mapping = {
        opportunities: 'Opportunities',
        leads: 'Leads',
        activities: 'Activities',
        tasks: 'Tasks',
        companies: 'Accounts'
    };
    return mapping[entity] || (entity ? entity.charAt(0).toUpperCase() + entity.slice(1) : 'Record');
}

function formatAutomationNumber(value) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
        return numeric.toLocaleString();
    }
    return '0';
}

function formatAutomationRelativeTime(timestamp) {
    if (!timestamp) {
        return 'Never run';
    }
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
        return 'Unknown';
    }
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.round(diffMs / 60000);
    if (minutes < 1) {
        return 'Just now';
    }
    if (minutes < 60) {
        return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
    }
    const hours = Math.round(minutes / 60);
    if (hours < 24) {
        return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    }
    const days = Math.round(hours / 24);
    if (days < 7) {
        return `${days} day${days === 1 ? '' : 's'} ago`;
    }
    return date.toLocaleDateString();
}

function sanitizeAutomationHtml(value) {
    if (value === null || value === undefined) {
        return '';
    }
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function automationGetInputValue(input) {
    if (input.type === 'number') {
        return input.value === '' ? '' : Number(input.value);
    }
    return input.value;
}
