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

const AUTOMATION_TRIGGER_CATALOG = [
    {
        title: 'Створення нового ліда',
        description: 'Автоматично запускати ланцюги після появи нового звернення з сайту, email чи чат-бота.'
    },
    {
        title: 'Зміна статусу угоди',
        description: 'Вмикає сценарії при переході угоди між етапами — наприклад, "Переговори" чи "Успішно".'
    },
    {
        title: 'Настання визначеної дати',
        description: 'Планує нагадування до дня народження клієнта або контрольних термінів оплат.'
    },
    {
        title: 'Нове повідомлення від клієнта',
        description: 'Реагує на вхідні email та чат-повідомлення, створюючи завдання чи відповіді.'
    },
    {
        title: 'Додавання контакту чи компанії',
        description: 'Вмикає онбординг і сегментацію щойно доданих записів.'
    },
    {
        title: 'Прострочення завдання',
        description: 'Автоматично піднімає ескалації, якщо менеджер не виконав завдання вчасно.'
    }
];

const AUTOMATION_ACTION_CATALOG = [
    {
        title: 'Створення завдання',
        description: 'Плануйте дзвінки, листи та зустрічі без ручного втручання.'
    },
    {
        title: 'Відправка email або SMS',
        description: 'Надсилайте шаблонні повідомлення одразу після події.'
    },
    {
        title: 'Зміна статусу запису',
        description: 'Переводьте ліди у "В роботі" чи угоди у "Оплату отримано".'
    },
    {
        title: 'Призначення відповідального',
        description: 'Розподіляйте звернення між менеджерами за правилами.'
    },
    {
        title: 'Додавання тегів або міток',
        description: 'Маркуйте клієнтів як "Гарячий лід" чи "VIP".'
    },
    {
        title: 'Створення нотаток та логів',
        description: 'Фіксуйте історію взаємодій автоматично.'
    },
    {
        title: 'Надсилання внутрішніх сповіщень',
        description: 'Повідомляйте команду про важливі події у Slack чи Email.'
    }
];

const AUTOMATION_WORKFLOW_TEMPLATES = [
    {
        category: 'Лідогенерація',
        items: [
            'Створення ліда з веб-форми та миттєвий розподіл менеджеру.',
            'Відправка вітального email із презентацією продукту.'
        ]
    },
    {
        category: 'Продажі',
        items: [
            'Автоматичне оновлення статусу угоди після надходження оплати.',
            'Нагадування менеджеру про прострочені угоди.'
        ]
    },
    {
        category: 'Підтримка клієнтів',
        items: [
            'Відправка анкети задоволеності після закриття кейсу.',
            'Створення завдання на зворотний дзвінок після отримання скарги.'
        ]
    },
    {
        category: 'Маркетинг',
        items: [
            'Розсилка email-кампаній за розкладом.',
            'Сегментація клієнтів за активністю з персональними пропозиціями.'
        ]
    }
];

const AUTOMATION_CUSTOM_SCENARIO_FEATURES = [
    'Створення власних сценаріїв на основі тригерів та дій.',
    'Візуальний drag-and-drop редактор для швидкого налаштування.'
];

const AUTOMATION_MESSAGE_TEMPLATES = [
    {
        category: 'Email-шаблони',
        items: [
            'Вітальні листи для нових лідів.',
            'Нагадування про оплату для клієнтів із простроченими рахунками.',
            'Спеціальні пропозиції та акції.',
            'Підтвердження реєстрації або оплати.'
        ]
    },
    {
        category: 'SMS-шаблони',
        items: [
            'Нагадування про зустріч.',
            'Повідомлення про зміну статусу угоди.',
            'Привітання з днем народження.'
        ]
    },
    {
        category: 'Шаблони чат-ботів',
        items: [
            'Автовідповіді на часті запитання.',
            'Кваліфікація лідів у Telegram чи Viber.'
        ]
    }
];

const AUTOMATION_INTEGRATIONS_OVERVIEW = [
    {
        category: 'Email-маркетинг',
        services: ['Mailchimp', 'SendPulse', 'UniSender']
    },
    {
        category: 'Месенджери',
        services: ['Telegram', 'Viber', 'WhatsApp', 'Facebook Messenger']
    },
    {
        category: 'Платіжні системи',
        services: ['LiqPay', 'Fondy', 'WayForPay']
    },
    {
        category: 'Бухгалтерські системи',
        services: ['1C', 'SAP', 'QuickBooks']
    },
    {
        category: 'Соціальні мережі',
        services: ['Facebook', 'Instagram', 'LinkedIn']
    },
    {
        category: 'Хмарні сховища',
        services: ['Google Drive', 'Dropbox']
    }
];

const AUTOMATION_API_OPTIONS = [
    'Підтримка кастомних інтеграцій через REST API.',
    'Вебхуки для синхронізації CRM з іншими системами.'
];

const AUTOMATION_TASK_AUTOMATION = [
    'Автоматичне створення завдань після появи нового ліда або події.',
    'Нагадування про важливі зустрічі та терміни оплат.',
    'Переназначення завдань при простроченні.'
];

const AUTOMATION_SEGMENTATION_RULES = [
    'Сегментація за активністю — наприклад, "Неактивні клієнти".',
    'Виділення VIP-клієнтів за сумою угод.',
    'Географічне групування, як-от "Клієнти з Києва".',
    'Персоналізовані знижки та пропозиції для кожного сегмента.'
];

const AUTOMATION_ANALYTICS_METRICS = [
    'Звіти про ефективність сценаріїв та конверсію.',
    'Статистика відправлених email та SMS.',
    'Оцінка зекономленого часу команди.'
];

const AUTOMATION_LEAD_ROUTING_RULES = [
    'Розподіл лідів за географією, галуззю або типом продукту.',
    'Пріоритетна передача гарячих лідів досвідченим менеджерам.'
];

const AUTOMATION_TESTING_LOGGING = [
    'Тестовий режим для перевірки логіки перед запуском.',
    'Логи виконання для аналізу помилок та прозорості.'
];

const AUTOMATION_SECURITY_CONTROLS = [
    'Різні рівні доступу до налаштувань автоматизації.',
    'Історія змін та аудит усіх сценаріїв.'
];

const AUTOMATION_IMPORTANCE_POINTS = [
    'Скорочення рутини завдяки автоматичним діям.',
    'Швидша реакція на запити клієнтів.',
    'Покращення сервісу за рахунок персоналізації.',
    'Зростання конверсії завдяки своєчасним нагадуванням.'
];

const AUTOMATION_EXAMPLE_SCENARIO = {
    trigger: 'Новий лід з форми на сайті',
    actions: [
        'Створити картку ліда в CRM',
        'Призначити відповідального менеджера',
        'Відправити вітальний email',
        'Створити завдання на дзвінок через 1 день'
    ]
};

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
    setPageHeader('automation');

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
    const knowledgeBase = renderAutomationKnowledgeBase();

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

            ${knowledgeBase}
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

function renderAutomationKnowledgeBase() {
    const triggerList = renderAutomationCardList(AUTOMATION_TRIGGER_CATALOG);
    const actionList = renderAutomationCardList(AUTOMATION_ACTION_CATALOG);
    const workflowTemplates = renderAutomationCategoryBlocks(AUTOMATION_WORKFLOW_TEMPLATES);
    const customScenarioFeatures = renderAutomationBulletList(AUTOMATION_CUSTOM_SCENARIO_FEATURES);
    const messageTemplates = renderAutomationCategoryBlocks(AUTOMATION_MESSAGE_TEMPLATES);
    const integrationCatalog = renderAutomationCategoryBlocks(AUTOMATION_INTEGRATIONS_OVERVIEW, 'services');
    const apiOptions = renderAutomationBulletList(AUTOMATION_API_OPTIONS);
    const taskAutomation = renderAutomationBulletList(AUTOMATION_TASK_AUTOMATION);
    const segmentation = renderAutomationBulletList(AUTOMATION_SEGMENTATION_RULES);
    const analytics = renderAutomationBulletList(AUTOMATION_ANALYTICS_METRICS);
    const leadRouting = renderAutomationBulletList(AUTOMATION_LEAD_ROUTING_RULES);
    const testing = renderAutomationBulletList(AUTOMATION_TESTING_LOGGING);
    const security = renderAutomationBulletList(AUTOMATION_SECURITY_CONTROLS);
    const example = renderAutomationExampleScenario(AUTOMATION_EXAMPLE_SCENARIO);
    const importance = renderAutomationBulletList(AUTOMATION_IMPORTANCE_POINTS);

    return `
        <div class="bg-white border border-gray-200 rounded-2xl p-6 space-y-8">
            <div class="space-y-1">
                <h3 class="text-xl font-semibold text-gray-800">Автоматизація: довідник можливостей</h3>
                <p class="text-sm text-gray-600">Оптимізуйте бізнес-процеси, зменшуйте рутину та посилюйте взаємодію з клієнтами.</p>
            </div>

            <section class="space-y-4">
                <h4 class="text-lg font-semibold text-gray-800">1. Правила автоматизації</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p class="text-sm font-medium text-gray-700 mb-2">Тригери</p>
                        ${triggerList}
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-700 mb-2">Автоматичні дії</p>
                        ${actionList}
                    </div>
                </div>
            </section>

            <section class="space-y-4">
                <h4 class="text-lg font-semibold text-gray-800">2. Сценарії автоматизації (Workflows)</h4>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${workflowTemplates}
                </div>
                <div class="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p class="text-sm font-semibold text-blue-800 mb-2">Кастомні сценарії</p>
                    ${customScenarioFeatures}
                </div>
            </section>

            <section class="space-y-4">
                <h4 class="text-lg font-semibold text-gray-800">3. Шаблони повідомлень</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    ${messageTemplates}
                </div>
            </section>

            <section class="space-y-4">
                <h4 class="text-lg font-semibold text-gray-800">4. Інтеграції з зовнішніми сервісами</h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    ${integrationCatalog}
                </div>
                <div class="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <p class="text-sm font-medium text-gray-700 mb-2">API та вебхуки</p>
                    ${apiOptions}
                </div>
            </section>

            <section class="space-y-4">
                <h4 class="text-lg font-semibold text-gray-800">5. Автоматизація завдань та нагадувань</h4>
                ${taskAutomation}
            </section>

            <section class="space-y-4">
                <h4 class="text-lg font-semibold text-gray-800">6. Сегментація та персоналізація</h4>
                ${segmentation}
            </section>

            <section class="space-y-4">
                <h4 class="text-lg font-semibold text-gray-800">7. Аналітика автоматизації</h4>
                ${analytics}
            </section>

            <section class="space-y-4">
                <h4 class="text-lg font-semibold text-gray-800">8. Налаштування правил розподілу лідів</h4>
                ${leadRouting}
            </section>

            <section class="space-y-4">
                <h4 class="text-lg font-semibold text-gray-800">9. Тестування та логування</h4>
                ${testing}
            </section>

            <section class="space-y-4">
                <h4 class="text-lg font-semibold text-gray-800">10. Безпека та доступ</h4>
                ${security}
            </section>

            <section class="space-y-4">
                <h4 class="text-lg font-semibold text-gray-800">Приклад сценарію автоматизації</h4>
                ${example}
            </section>

            <section class="space-y-4">
                <h4 class="text-lg font-semibold text-gray-800">Чому це важливо?</h4>
                ${importance}
                <p class="text-sm text-gray-600">Потрібна допомога з налаштуванням? Зверніться до команди підтримки — ми підкажемо оптимальний сценарій.</p>
            </section>
        </div>
    `;
}

function renderAutomationCardList(items = []) {
    if (!Array.isArray(items) || !items.length) {
        return '<p class="text-sm text-gray-500">Дані про автоматизацію тимчасово недоступні.</p>';
    }
    return `
        <ul class="space-y-3">
            ${items.map(item => `
                <li class="border border-gray-100 rounded-xl p-3">
                    <p class="text-sm font-semibold text-gray-800">${sanitizeAutomationHtml(item.title)}</p>
                    ${item.description ? `<p class="text-xs text-gray-500 mt-1">${sanitizeAutomationHtml(item.description)}</p>` : ''}
                </li>
            `).join('')}
        </ul>
    `;
}

function renderAutomationCategoryBlocks(categories = [], itemsKey = 'items') {
    if (!Array.isArray(categories) || !categories.length) {
        return '<p class="text-sm text-gray-500">Налаштовані шаблони відсутні.</p>';
    }
    return categories.map(category => {
        const values = Array.isArray(category[itemsKey]) && category[itemsKey].length ? category[itemsKey] : (Array.isArray(category.items) ? category.items : []);
        if (!values.length) {
            return '';
        }
        return `
            <div class="border border-gray-100 rounded-xl p-4 space-y-2">
                <p class="text-sm font-semibold text-gray-800">${sanitizeAutomationHtml(category.category)}</p>
                <ul class="list-disc pl-4 space-y-1 text-sm text-gray-600">
                    ${values.map(item => `<li>${sanitizeAutomationHtml(item)}</li>`).join('')}
                </ul>
            </div>
        `;
    }).join('');
}

function renderAutomationBulletList(items = []) {
    if (!Array.isArray(items) || !items.length) {
        return '<p class="text-sm text-gray-500">Дані відсутні.</p>';
    }
    return `
        <ul class="list-disc pl-5 space-y-2 text-sm text-gray-700">
            ${items.map(item => `<li>${sanitizeAutomationHtml(item)}</li>`).join('')}
        </ul>
    `;
}

function renderAutomationExampleScenario(example) {
    if (!example) {
        return '<p class="text-sm text-gray-500">Поки що немає прикладів сценаріїв.</p>';
    }
    const actions = Array.isArray(example.actions) ? example.actions : [];
    return `
        <div class="border border-gray-100 rounded-2xl overflow-hidden">
            <table class="w-full text-sm">
                <thead class="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                        <th class="p-3 text-left">Тригер</th>
                        <th class="p-3 text-left">Автоматичні дії</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="divide-x divide-gray-100">
                        <td class="p-4 align-top text-gray-700">${sanitizeAutomationHtml(example.trigger || '')}</td>
                        <td class="p-4 align-top">${renderAutomationBulletList(actions)}</td>
                    </tr>
                </tbody>
            </table>
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

const AUTOMATION_CONDITION_CHECKS = {
    high_value_deal(context) {
        const record = context.record || {};
        const value = Number(record.value ?? record.amount ?? record.annual_value ?? 0);
        return Number.isFinite(value) && value > 50000;
    },
    tier1_account(context) {
        const tier = (context.record?.account_tier
            || context.record?.tier
            || context.relatedCompany?.account_tier
            || context.relatedCompany?.tier
            || '').toLowerCase();
        return tier.includes('strategic') || tier.replace(/\s+/g, '').includes('tier1');
    },
    call_outcome_positive(context) {
        const outcome = (context.record?.outcome || '').toLowerCase();
        return outcome === 'positive' || outcome === 'success';
    },
    task_priority_high(context) {
        const priority = (context.record?.priority || '').toLowerCase();
        return priority === 'high' || priority === 'critical';
    },
    erp_sync_pending(context) {
        const record = context.record || {};
        if (record.erp_sync_pending === true) {
            return true;
        }
        const status = (record.integration_status || record.erp_sync_status || '').toLowerCase();
        return status.includes('pending');
    },
    no_open_tasks(context) {
        const record = context.record || {};
        const entity = context.entity;
        const dataCore = context.engine?.dataCore;
        if (!dataCore) {
            return true;
        }
        const result = dataCore.list('tasks') || {};
        const tasks = Array.isArray(result.data) ? result.data : [];
        const openStatuses = new Set(['not started', 'in progress', 'open', 'awaiting input', 'backlog']);

        return !tasks.some(task => {
            const status = (task.status || '').toLowerCase();
            const isOpen = !status || openStatuses.has(status);
            if (!isOpen) {
                return false;
            }
            if (task.related_to && (task.related_to === record.id || task.related_to === record.related_to)) {
                return true;
            }
            if (entity === 'activities') {
                if (record.company_id && task.company_id && record.company_id === task.company_id) {
                    return true;
                }
                if (record.contact_id && task.contact_id && record.contact_id === task.contact_id) {
                    return true;
                }
                if (record.opportunity_id && task.related_to === record.opportunity_id) {
                    return true;
                }
            }
            if (entity === 'opportunities' && task.related_to === record.id) {
                return true;
            }
            if (entity === 'leads' && task.related_to === record.id) {
                return true;
            }
            return false;
        });
    }
};

function createAutomationEngine() {
    const engine = {
        dataCore: null,
        workflowCache: new Map(),
        listeners: [],
        initialized: false,

        init(dataCore) {
            if (this.initialized || !dataCore || typeof dataCore.on !== 'function') {
                return;
            }
            this.dataCore = dataCore;
            this.initialized = true;
            this.refreshWorkflowCache();

            this.listeners.push(dataCore.on('workflows.created', () => this.refreshWorkflowCache()));
            this.listeners.push(dataCore.on('workflows.updated', () => this.refreshWorkflowCache()));
            this.listeners.push(dataCore.on('workflows.deleted', () => this.refreshWorkflowCache()));
            this.listeners.push(dataCore.on('record.created', payload => this.handleRecordEvent(payload)));
            this.listeners.push(dataCore.on('record.updated', payload => this.handleRecordEvent(payload)));
        },

        refreshWorkflowCache() {
            if (!this.dataCore) {
                return;
            }
            const result = this.dataCore.list('workflows') || {};
            const workflows = Array.isArray(result.data) ? result.data : [];
            this.workflowCache = new Map(workflows.map(workflow => [workflow.id, workflow]));
        },

        handleRecordEvent(event) {
            if (!event || !event.entity || event.entity === 'workflows') {
                return;
            }
            if (!this.workflowCache.size) {
                return;
            }

            const descriptors = this.resolveAutomationEvents(event);
            descriptors.forEach(descriptor => {
                this.executeWorkflows(descriptor, event);
            });
        },

        resolveAutomationEvents(event) {
            const descriptors = [];
            const entity = event.entity;
            const action = event.action;
            const record = event.record || {};
            const previous = event.previous || {};
            const changes = event.changes || {};

            if (entity === 'opportunities' && action === 'update' && changes.stage) {
                descriptors.push({
                    name: 'opportunity.stage.changed',
                    context: {
                        from_stage: previous.stage,
                        to_stage: record.stage
                    }
                });
            }

            if (entity === 'activities' && action === 'update') {
                const status = (record.status || '').toLowerCase();
                const outcomeChanged = changes.outcome && record.type === 'Call';
                const isCompleted = status === 'completed' || record.completed === true || outcomeChanged;
                if (isCompleted) {
                    descriptors.push({
                        name: 'activity.completed',
                        context: {
                            outcome: record.outcome,
                            activity_type: record.type
                        }
                    });
                }
            }

            if (entity === 'tasks') {
                const becameOverdue = this.detectTaskOverdue(record, previous, changes);
                if (becameOverdue) {
                    descriptors.push({
                        name: 'task.overdue',
                        context: {
                            due_date: record.due_date || record.due_at,
                            status: record.status
                        }
                    });
                }
            }

            if (entity === 'leads' && action === 'update' && changes.status) {
                descriptors.push({
                    name: 'lead.status.changed',
                    context: {
                        status: record.status
                    }
                });
            }

            if ((entity === 'opportunities' || entity === 'companies') && this.detectErpSyncRequired(record, previous, changes)) {
                descriptors.push({
                    name: 'integration.erp.sync_required',
                    context: {
                        system: record.erp_system || record.integration_system,
                        reason: record.erp_sync_reason || record.sync_reason
                    }
                });
            }

            return descriptors;
        },

        detectTaskOverdue(record, previous, changes) {
            const status = (record.status || '').toLowerCase();
            if (changes.status && (status === 'overdue' || status === 'past due')) {
                return true;
            }
            const dueDate = record.due_date || record.due_at;
            if (!dueDate) {
                return false;
            }
            const due = new Date(dueDate);
            if (Number.isNaN(due.getTime())) {
                return false;
            }
            const previousDue = previous?.due_date || previous?.due_at;
            const now = new Date();
            const previouslyOverdue = previousDue ? new Date(previousDue) < now && !this.isTaskCompleted(previous) : false;
            const nowOverdue = due < now && !this.isTaskCompleted(record);
            return !previouslyOverdue && nowOverdue;
        },

        isTaskCompleted(task) {
            const status = (task?.status || '').toLowerCase();
            return status === 'completed' || status === 'done' || status === 'closed' || task?.completed === true;
        },

        detectErpSyncRequired(record, previous, changes) {
            if (record.erp_sync_pending === true && previous?.erp_sync_pending !== true) {
                return true;
            }
            const statusChanged = changes.integration_status || changes.erp_sync_status;
            if (statusChanged) {
                const status = (record.integration_status || record.erp_sync_status || '').toLowerCase();
                return status.includes('pending');
            }
            return false;
        },

        executeWorkflows(descriptor, event) {
            if (!descriptor || !descriptor.name) {
                return;
            }
            const workflows = [];
            this.workflowCache.forEach(workflow => {
                if (!workflow || !this.isWorkflowActive(workflow)) {
                    return;
                }
                const triggerEvent = workflow.trigger?.event || workflow.trigger?.id || workflow.trigger;
                if (triggerEvent === descriptor.name) {
                    if (!workflow.entity || workflow.entity === event.entity) {
                        workflows.push(workflow);
                    }
                }
            });

            if (!workflows.length) {
                return;
            }

            workflows.forEach(workflow => {
                if (event.meta?.triggeredByWorkflow && event.meta.triggeredByWorkflow === workflow.id) {
                    return;
                }
                const context = this.buildExecutionContext(workflow, event, descriptor);
                if (!this.evaluateTrigger(workflow, descriptor, context)) {
                    return;
                }
                if (!this.evaluateConditions(workflow, context)) {
                    return;
                }
                const summary = this.executeActions(workflow, context);
                if (summary.executed) {
                    this.updateWorkflowMetrics(workflow, summary);
                    this.logWorkflowRun(workflow, descriptor, summary, context);
                }
            });
        },

        isWorkflowActive(workflow) {
            const status = (workflow.status || '').toLowerCase();
            if (!status) {
                return true;
            }
            return status.includes('active') || status.includes('enabled') || status.includes('running');
        },

        buildExecutionContext(workflow, event, descriptor) {
            const record = event.record || {};
            const previous = event.previous || {};
            const relatedCompany = this.resolveCompany(record);
            const relatedContact = this.resolveContact(record);
            const relatedOpportunity = this.resolveOpportunity(record, event.entity);
            const relatedLead = this.resolveLead(record, event.entity);

            const mergeData = {
                workflow,
                entity: event.entity,
                event: descriptor.name,
                record,
                previous,
                company: relatedCompany,
                contact: relatedContact,
                opportunity: event.entity === 'opportunities' ? record : relatedOpportunity,
                lead: event.entity === 'leads' ? record : relatedLead,
                activity: event.entity === 'activities' ? record : null,
                task: event.entity === 'tasks' ? record : null
            };

            return {
                workflow,
                record,
                previous,
                descriptor,
                entity: event.entity,
                changes: event.changes || {},
                meta: event.meta || null,
                relatedCompany,
                relatedContact,
                relatedOpportunity,
                relatedLead,
                mergeData,
                engine: this
            };
        },

        resolveCompany(record) {
            if (!this.dataCore) {
                return null;
            }
            const companyId = record.company_id || record.account_id;
            if (companyId) {
                return this.dataCore.get('companies', companyId);
            }
            if (record.relationships?.company?.id) {
                return this.dataCore.get('companies', record.relationships.company.id);
            }
            return null;
        },

        resolveContact(record) {
            if (!this.dataCore) {
                return null;
            }
            const contactId = record.contact_id || record.primary_contact_id;
            if (contactId) {
                return this.dataCore.get('contacts', contactId);
            }
            if (record.relationships?.contact?.id) {
                return this.dataCore.get('contacts', record.relationships.contact.id);
            }
            return null;
        },

        resolveOpportunity(record, entity) {
            if (!this.dataCore) {
                return null;
            }
            if (entity === 'opportunities') {
                return record;
            }
            const opportunityId = record.opportunity_id || record.related_to;
            if (opportunityId && String(opportunityId).startsWith('opp-')) {
                return this.dataCore.get('opportunities', opportunityId);
            }
            return null;
        },

        resolveLead(record, entity) {
            if (!this.dataCore) {
                return null;
            }
            if (entity === 'leads') {
                return record;
            }
            const leadId = record.lead_id;
            if (leadId) {
                return this.dataCore.get('leads', leadId);
            }
            return null;
        },

        evaluateTrigger(workflow, descriptor, context) {
            const triggerConfig = workflow.trigger?.config || {};
            switch (descriptor.name) {
                case 'opportunity.stage.changed': {
                    if (triggerConfig.from_stage && triggerConfig.from_stage !== context.descriptor.context.from_stage) {
                        return false;
                    }
                    if (triggerConfig.to_stage && triggerConfig.to_stage !== context.descriptor.context.to_stage) {
                        return false;
                    }
                    return true;
                }
                case 'activity.completed': {
                    if (triggerConfig.outcome) {
                        return (context.record?.outcome || '').toLowerCase() === triggerConfig.outcome.toLowerCase();
                    }
                    return true;
                }
                case 'task.overdue': {
                    if (!context.record?.due_date && !context.record?.due_at) {
                        return false;
                    }
                    const grace = Number(triggerConfig.grace_period);
                    if (!Number.isFinite(grace) || grace <= 0) {
                        return true;
                    }
                    const dueString = context.record.due_date || context.record.due_at;
                    const due = new Date(dueString);
                    if (Number.isNaN(due.getTime())) {
                        return false;
                    }
                    const elapsed = Date.now() - due.getTime();
                    return elapsed >= grace * 60 * 60 * 1000;
                }
                case 'lead.status.changed': {
                    if (!triggerConfig.target_status) {
                        return true;
                    }
                    return (context.record?.status || '').toLowerCase() === triggerConfig.target_status.toLowerCase();
                }
                case 'integration.erp.sync_required': {
                    if (triggerConfig.system) {
                        const system = (context.record?.erp_system || context.record?.integration_system || '').toLowerCase();
                        if (system && system !== triggerConfig.system.toLowerCase()) {
                            return false;
                        }
                    }
                    return true;
                }
                default:
                    return true;
            }
        },

        evaluateConditions(workflow, context) {
            const conditions = Array.isArray(workflow.conditions) ? workflow.conditions : [];
            if (!conditions.length) {
                return true;
            }
            return conditions.every(condition => {
                const id = condition?.id || condition;
                const evaluator = AUTOMATION_CONDITION_CHECKS[id];
                if (typeof evaluator !== 'function') {
                    return true;
                }
                try {
                    return evaluator({ ...context, condition });
                } catch (error) {
                    console.error('Automation condition evaluation failed', id, error);
                    return false;
                }
            });
        },

        executeActions(workflow, context) {
            const summary = {
                executed: false,
                tasksCreated: 0,
                remindersSent: 0,
                erpSyncs: 0,
                statusUpdates: 0,
                actionDetails: [],
                errors: [],
                totalActions: Array.isArray(workflow.actions) ? workflow.actions.length : 0,
                executedActions: 0
            };

            const actions = Array.isArray(workflow.actions) ? workflow.actions : [];
            actions.forEach(action => {
                try {
                    const detail = this.runAction(action, workflow, context, summary);
                    if (detail) {
                        summary.actionDetails.push(detail);
                        summary.executedActions += 1;
                    }
                } catch (error) {
                    summary.errors.push(error);
                    console.error('Automation action failed', action?.type, error);
                }
            });

            summary.executed = summary.executedActions > 0
                || summary.tasksCreated > 0
                || summary.remindersSent > 0
                || summary.erpSyncs > 0
                || summary.statusUpdates > 0;
            return summary;
        },

        runAction(action, workflow, context, summary) {
            if (!action || !action.type) {
                return null;
            }
            const settings = action.settings || {};
            const meta = { triggeredByWorkflow: workflow.id };
            switch (action.type) {
                case 'create_task': {
                    const dueDays = Number(settings.due_in_days ?? 0);
                    const dueDate = this.computeDueDate(dueDays);
                    const titleTemplate = settings.title || 'Follow-up task';
                    const title = this.renderTemplate(titleTemplate, context.mergeData);
                    const payload = this.cleanPayload({
                        title,
                        description: settings.description ? this.renderTemplate(settings.description, context.mergeData) : '',
                        priority: settings.priority || 'Medium',
                        status: 'Not Started',
                        due_date: dueDate,
                        assigned_to: settings.assignee || context.record?.assigned_to,
                        related_to: context.record?.id,
                        company_id: context.record?.company_id,
                        opportunity_id: context.entity === 'opportunities' ? context.record?.id : context.record?.opportunity_id,
                        lead_id: context.entity === 'leads' ? context.record?.id : context.record?.lead_id,
                        source_workflow_id: workflow.id
                    });
                    const created = this.dataCore?.create('tasks', payload, { meta });
                    summary.tasksCreated += created ? 1 : 0;
                    return {
                        label: action.label || 'Create task',
                        detail: `${title}${dueDate ? ` · Due ${dueDate}` : ''}`
                    };
                }
                case 'send_reminder': {
                    const messageTemplate = settings.message || `Reminder for ${workflow.name}`;
                    const message = this.renderTemplate(messageTemplate, context.mergeData);
                    const offsetMinutes = Number(settings.offset ?? 0);
                    const scheduledAt = this.computeReminderTime(offsetMinutes);
                    const payload = this.cleanPayload({
                        type: 'Reminder',
                        subject: `${settings.channel || 'Notification'} reminder`,
                        description: message,
                        channel: settings.channel || 'Email',
                        date: scheduledAt,
                        related_to: context.record?.id,
                        assigned_to: context.record?.assigned_to || workflow.owner,
                        source_workflow_id: workflow.id
                    });
                    const created = this.dataCore?.create('activities', payload, { meta });
                    summary.remindersSent += created ? 1 : 0;
                    return {
                        label: action.label || 'Send reminder',
                        detail: `${settings.channel || 'Email'}${offsetMinutes ? ` · +${offsetMinutes} min` : ''}`
                    };
                }
                case 'update_status': {
                    const field = settings.field || '';
                    const value = settings.value;
                    if (!context.record?.id || value === undefined) {
                        return null;
                    }
                    let performed = false;
                    if (field.includes('Opportunity') && context.record.id) {
                        this.dataCore?.update('opportunities', context.record.id, { stage: value }, { meta });
                        performed = true;
                    } else if (field.includes('Lead')) {
                        this.dataCore?.update('leads', context.record.id, { status: value }, { meta });
                        performed = true;
                    } else if (field.includes('Task')) {
                        this.dataCore?.update('tasks', context.record.id, { status: value }, { meta });
                        performed = true;
                    }
                    if (!performed) {
                        return null;
                    }
                    summary.statusUpdates += 1;
                    return {
                        label: action.label || 'Update status',
                        detail: `${field} → ${value}`
                    };
                }
                case 'sync_erp': {
                    const system = settings.system || 'ERP';
                    const mode = settings.mode || 'Immediate';
                    const payload = this.cleanPayload({
                        type: 'Integration',
                        subject: `ERP sync scheduled (${system})`,
                        description: settings.payload ? this.renderTemplate(settings.payload, context.mergeData) : '',
                        date: new Date().toISOString(),
                        related_to: context.record?.id,
                        channel: system,
                        source_workflow_id: workflow.id
                    });
                    const created = this.dataCore?.create('activities', payload, { meta });
                    summary.erpSyncs += created ? 1 : 0;
                    return {
                        label: action.label || 'Sync ERP',
                        detail: `${system}${mode ? ` · ${mode}` : ''}`
                    };
                }
                default:
                    return null;
            }
        },

        computeDueDate(offsetDays) {
            const now = new Date();
            if (Number.isFinite(offsetDays) && offsetDays > 0) {
                now.setDate(now.getDate() + offsetDays);
            }
            return now.toISOString().split('T')[0];
        },

        computeReminderTime(offsetMinutes) {
            const date = new Date();
            if (Number.isFinite(offsetMinutes) && offsetMinutes > 0) {
                date.setMinutes(date.getMinutes() + offsetMinutes);
            }
            return date.toISOString();
        },

        renderTemplate(template, data) {
            if (!template) {
                return '';
            }
            if (!data || typeof template !== 'string') {
                return template;
            }
            return template.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (match, token) => {
                const value = token.split('.').reduce((acc, key) => {
                    if (acc && Object.prototype.hasOwnProperty.call(acc, key)) {
                        return acc[key];
                    }
                    return undefined;
                }, data);
                return value === undefined || value === null ? '' : String(value);
            });
        },

        cleanPayload(payload) {
            const result = {};
            Object.entries(payload || {}).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    result[key] = value;
                }
            });
            return result;
        },

        updateWorkflowMetrics(workflow, summary) {
            if (!this.dataCore || !workflow?.id) {
                return;
            }
            const metrics = workflow.metrics || {};
            const previousRuns = Number(metrics.runs) || 0;
            const successEstimate = Number(metrics.successful_runs || metrics.successes);
            let previousSuccesses = Number.isFinite(successEstimate)
                ? successEstimate
                : Math.round((Number(metrics.success_rate) || 0) * previousRuns);
            if (!Number.isFinite(previousSuccesses)) {
                previousSuccesses = 0;
            }
            const isSuccess = summary.errors.length === 0;
            const newRuns = previousRuns + 1;
            const newSuccesses = previousSuccesses + (isSuccess ? 1 : 0);
            const updatedMetrics = {
                ...metrics,
                runs: newRuns,
                successful_runs: newSuccesses,
                success_rate: newRuns ? newSuccesses / newRuns : 1,
                tasks_created: (metrics.tasks_created || 0) + summary.tasksCreated,
                reminders_sent: (metrics.reminders_sent || 0) + summary.remindersSent,
                erp_syncs: (metrics.erp_syncs || 0) + summary.erpSyncs
            };

            const timestamp = new Date().toISOString();
            this.dataCore.update('workflows', workflow.id, {
                metrics: updatedMetrics,
                last_run_at: timestamp
            }, { meta: { triggeredByWorkflow: workflow.id } });

            const cached = this.workflowCache.get(workflow.id);
            if (cached) {
                cached.metrics = updatedMetrics;
                cached.last_run_at = timestamp;
            }
            this.updateAutomationState(workflow.id, {
                metrics: updatedMetrics,
                last_run_at: timestamp
            });
        },

        logWorkflowRun(workflow, descriptor, summary, context) {
            const status = summary.errors.length
                ? (summary.executedActions && summary.executedActions !== summary.errors.length ? 'Warning' : 'Error')
                : 'Success';
            const runEntry = {
                id: `run-${Date.now()}`,
                workflowName: workflow.name || 'Workflow',
                owner: workflow.owner || 'Automation Engine',
                event: this.describeRunEvent(workflow, descriptor, context),
                executedAt: new Date().toISOString(),
                status,
                actions: summary.actionDetails.map(item => ({
                    label: item.label,
                    detail: item.detail
                }))
            };

            if (Array.isArray(automationState?.runLog)) {
                automationState.runLog.unshift(runEntry);
                if (automationState.runLog.length > 10) {
                    automationState.runLog = automationState.runLog.slice(0, 10);
                }
            }

            const view = document.getElementById('automationView');
            if (view && !view.classList.contains('hidden')) {
                renderAutomationView();
            }
        },

        describeRunEvent(workflow, descriptor, context) {
            const triggerLabel = workflow.trigger?.label || descriptor.name;
            if (descriptor.name === 'opportunity.stage.changed') {
                return `${triggerLabel} · ${context.record?.stage || descriptor.context.to_stage || ''}`.trim();
            }
            if (descriptor.name === 'activity.completed') {
                return `${triggerLabel} · ${context.record?.outcome || 'Completed'}`;
            }
            if (descriptor.name === 'task.overdue') {
                return `${triggerLabel} · ${context.record?.title || 'Task'}`;
            }
            if (descriptor.name === 'lead.status.changed') {
                return `${triggerLabel} · ${context.record?.status || ''}`;
            }
            if (descriptor.name === 'integration.erp.sync_required') {
                return `${triggerLabel} · ${context.record?.erp_system || context.record?.integration_system || 'ERP'}`;
            }
            return triggerLabel;
        },

        updateAutomationState(workflowId, updates) {
            if (!Array.isArray(automationState?.workflows)) {
                return;
            }
            const index = automationState.workflows.findIndex(item => item.id === workflowId);
            if (index === -1) {
                return;
            }
            automationState.workflows[index] = {
                ...automationState.workflows[index],
                ...updates,
                metrics: {
                    ...automationState.workflows[index].metrics,
                    ...(updates.metrics || {})
                }
            };
        }
    };

    return engine;
}

(function initializeAutomationEngine(global) {
    if (!global) {
        return;
    }
    const engine = global.crmAutomationEngine || createAutomationEngine();
    global.crmAutomationEngine = engine;

    function attemptInitialization(retries = 10) {
        if (engine.initialized) {
            return;
        }
        const dataCore = global.crmDataCore;
        if (dataCore && typeof dataCore.on === 'function') {
            engine.init(dataCore);
        } else if (retries > 0) {
            setTimeout(() => attemptInitialization(retries - 1), 50);
        } else {
            console.warn('Automation engine could not find DataCore instance.');
        }
    }

    attemptInitialization(20);
})(typeof window !== 'undefined' ? window : this);
