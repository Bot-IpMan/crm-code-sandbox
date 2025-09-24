# Competitor Intelligence Hub — Масштабована система

## Архітектура для великих обсягів даних
**Масштаб**: 20+ клієнтів × 50–100 конкурентів × різнорідні дані.

- **Мультиорендність** — логічна ізоляція даних клієнтів (tenant_id у всіх таблицях, шардинг за клієнтом при >50 конкурентів).
- **Data Ingestion Layer** — конектори до API, RSS, соцмереж і ручних імпортів (CSV/Excel); планувальник (Airflow/Temporal) керує фетчингом та ретраями.
- **Streaming & Queueing** — Kafka/Redpanda для потокового надходження сигналів (цінові зміни, згадки в медіа) та подій користувача.
- **Normalization & Enrichment** — пайплайни очищення (dbt/Beam) приводять дані до канонічних моделей, додають таксономії, географію, sentiment.
- **Storage Tiering**
  - OLTP (PostgreSQL + партиції) для оперативних даних модулів.
  - OLAP (BigQuery/Snowflake) для історичних трендів та аналітики.
  - Object Storage (S3/GCS) для файлів, медіа й резервних копій.
- **Indexing Layer** — Elasticsearch/OpenSearch для швидкого пошуку, Redis для кешів запитів і агрегатів сайдбара.
- **Service Mesh** — окремі сервіси для компаній, конкурентів, модулів, користувачів, синхронізовані через gRPC/REST з Istio/Linkerd для observability та rate limiting.
- **Event Bus** — публікація доменних подій (ModuleCreated, CompetitorUpdated) для реактивних модулів і оновлень UI у реальному часі.
- **Data Governance** — каталог метаданих, аудит дій, автоматичне маскування PII.
- **Observability** — централізовані логи (ELK), метрики (Prometheus/Grafana), трейсинг (Jaeger), SLA-алерти.

### 1. Дерево навігації (Sidebar Navigation Tree)
```
📁 Компанія А (25 конкурентів)
  └── 🏢 Конкурент 1 [●●○] (3 активні модулі)
  └── 🏢 Конкурент 2 [●○○] (1 активний модуль)
📁 Компанія Б (87 конкурентів)
  └── 🏢 Конкурент 1 [●●●] (всі модулі)
```

- **Віртуалізовані списки** — react-window/virtual-scroller для рендеру 100+ конкурентів із 60 FPS.
- **Агреговані стани** — індикатори `[●●○]` підтягуються асинхронно з Redis cache, оновлюються через WebSocket diff.
- **Lazy Expansion** — дерево підвантажує дітей лише при розгортанні гілки; бекенд повертає пагіновані списки конкурентів (cursor-based).
- **Multi-select & Bulk Actions** — чекбокси дозволяють масове застосування шаблонів модулів, експорт або архівацію.
- **Context-aware Search** — інкрементальний пошук із підсвіткою збігів та швидкими фільтрами (теги, активні модулі).
- **Keyboard-first UX** — навігація стрілками, Enter для відкриття, пробіл для вибору, Ctrl+F для scoped search.

### 2. Workspace (Робоча область)
- **Multi-tab Interface** — кожен конкурент відкривається у власній вкладці.
- **Split View** — паралельне порівняння 2–4 конкурентів.
- **Quick Switch** — миттєве перемикання між вкладками (Ctrl+Tab) з прелоудом даних наступних конкурентів.

## Модульна система LEGO-блоків

### Універсальна структура модуля
```javascript
Module {
  id: unique_id,
  type: "kanban|contacts|docs|prices|media|swot|network|custom",
  title: "Назва модуля",
  status: "collapsed|expanded|minimized",
  data: {},
  position: {x, y},
  size: "small|medium|large|fullwidth",
  permissions: ["view", "edit", "delete"]
}
```

### Типи модулів (Template Library)

#### 🎯 Швидкі модулі (Quick Cards)
- **Info Card** — основна інформація (назва, лого, опис, статус).
- **KPI Card** — ключові метрики (дохід, розмір, ринкова частка).
- **Status Card** — поточний статус моніторингу.
- **Contact Card** — 1–3 основні контактні особи.

#### 📊 Аналітичні модулі (Analytics Modules)
- **Price Timeline** — історія цін з міні-графіком.
- **Media Buzz** — згадки в ЗМІ з sentiment-аналізом.
- **Tech Stack** — технології конкурента.
- **SWOT Matrix** — швидкий SWOT-аналіз.

#### 📋 Робочі модулі (Work Modules)
- **Task Kanban** — задачі по конкуренту.
- **Document Vault** — файли та документи.
- **Contact CRM** — повна контактна база.
- **Notes** — текстові нотатки та спостереження.

#### 🔗 Зв'язки (Relationship Modules)
- **Network Map** — схема зв'язків.
- **Comparison Table** — порівняння з іншими.
- **Timeline** — хронологія ключових подій.

## Система управління модулями

- **Module Library** — галерея готових шаблонів.
- **Quick Add** — швидке додавання через кнопку «+» біля конкурента.
- **Bulk Actions** — масове додавання або редагування однакових модулів.
- **Custom Templates** — створення та розповсюдження власних наборів модулів.
- **CRUD** — перетягування з бібліотеки, згорнутий/розгорнутий перегляд, inline-редагування та drag&drop-ресайз, soft delete з відновленням.
- **Організація** — drag & drop між конкурентами, grid layout, збережені макети, масове переміщення.
- **Автоматизація** — правила автозаповнення та інтеграція з зовнішніми джерелами даних.

> Детальні сценарії керування модульним полотном описані в [docs/module-management-system.md](module-management-system.md).

## Оптимізація для великих обсягів

### Віртуалізація та ледаче завантаження
- **Virtual Scrolling** — рендеряться тільки видимі елементи навіть у списках із сотнями конкурентів.
- **Lazy Loading** — модулі та дані підтягуються лише під час розгортання, що зменшує initial payload.
- **Progressive Enhancement** — UI спочатку відмальовує структуру та skeleton-states, а дані дозавантажуються потоково.
- **Caching Strategy** — кешування часто використовуваних даних (Redis/edge cache) для миттєвого повторного доступу.
- **Adaptive Prefetching** — ML-модель прогнозує, які модулі або конкуренти відкриють далі, й готує дані в кеші.
- **Edge Delivery** — CDN edge functions попередньо обчислюють легкі агрегації для мобільних користувачів.
- **Backpressure Control** — rate limiting та черги запобігають блокуванням при пікових оновленнях.

### Пошук та фільтрація
```
🔍 Smart Search:
├── Global: Пошук по всій базі
├── Scoped: В межах клієнта/конкурента
├── Module-specific: В межах конкретного типу даних
└── Saved Filters: Збереження частих фільтрів
```

### Масові операції
- **Bulk Edit** — редагування групи конкурентів або модулів.
- **Template Apply** — застосування шаблонів до виділеної групи.
- **Export/Import** — масовий експорт/імпорт даних (CSV/Excel).
- **Archive/Restore** — архівування неактивних конкурентів з можливістю відновлення.

## UI/UX для масштабування

### Компактний дизайн
- **Card Density** — три режими відображення (compact/normal/comfortable) збережені на рівні користувача.
- **Icon System** — піктограми замінюють текст, tooltips та клавіша `Alt` показують підписи.
- **Color Coding** — палітра для компаній, конкурентів і статусів модулів з підтримкою темних/світлих тем (WCAG AA).
- **Status Indicators** — прогрес-бари, точки активності та бейджі SLA оновлюються через WebSocket у реальному часі.

### Навігація
```
🗺️ Navigation Patterns:
├── Breadcrumbs: Компанія > Конкурент > Модуль
├── Quick Jump: Ctrl+K для швидкого переходу та команд
├── Recently Viewed: Історія останніх 15 елементів
└── Bookmarks: Закладки на важливі об'єкти
```
- **Adaptive Breadcrumbs** — згортання проміжних рівнів із доступом через випадаюче меню.
- **Quick Jump Palette** — підтримка fuzzy-пошуку та команд (`create competitor`).
- **Recently Viewed** — локальне збереження з синхронізацією між пристроями.
- **Bookmarks** — drag & drop сортування, групування за папками, шаринг у команді.

### Продуктивність
- **Keyboard Shortcuts** — навігація, створення модулів, перемикання вкладок і масові операції; довідка `?` адаптується до ролі.
- **Batch Operations** — multi-select для шаблонів, експорту, архівації та зміни відповідальних.
- **Quick Actions** — контекстні меню (правий клік або `.`) із врахуванням прав доступу.
- **Auto-save** — автоматичне збереження після змін із toast-підтвердженнями та офлайн-буфером.

## Система прав доступу

```
👥 Roles:
├── Owner: Повний доступ до всього
├── Manager: Управління командою + всі дані
├── Analyst: Створення/редагування аналітики
└── Viewer: Тільки перегляд
```
- **Company Level** — доступ до конкретних клієнтів та історії взаємодій.
- **Competitor Level** — доступ до профілів конкурентів і пов'язаної аналітики.
- **Module Level** — контроль видимості типів даних і шаблонів.
- **Field Level** — маскування чутливих полів, політики read/write, логування звернень.

> Повний опис рольової моделі та аудитів доступу — у [docs/access-control-system.md](access-control-system.md).

## Технічна архітектура

### Database Design
```sql
companies (id, name, status, settings)
competitors (id, company_id, name, priority, tags)
modules (id, competitor_id, type, config, data, position)
permissions (user_id, resource_type, resource_id, actions)
activity_log (id, tenant_id, actor_id, resource_type, resource_id, event, payload, created_at)
module_snapshots (id, module_id, version, diff, created_at)
search_index (resource_type, resource_id, payload, embeddings)
```

### API Strategy
- **REST endpoints** — `/api/companies/:id/competitors/:id/modules` для CRUD в контексті компанії та конкурента.
- **Bulk endpoints** — `/api/bulk/modules` для масових операцій із підтримкою транзакційних пакетів.
- **GraphQL** — гнучкі запити для складних даних та умовного завантаження.
- **WebSocket** — real-time оновлення модулів і сигналів колаборації.
- **gRPC Streaming** — передача високочастотних телеметричних даних (цінові тики, моніторинг реклами).
- **Webhook Orchestrator** — безпечні вихідні webhook-и з HMAC-підписом і повторними спробами.
- **Data Lake Exports** — планові вивантаження в S3/BigQuery через `/api/export` або Airflow DAG.

### Performance
- **Database** — індекси, партиціонування за `company_id`, курсорна пагінація.
- **Caching** — Redis для частих запитів, CDN для статики.
- **Observability** — телеметрія запитів, latency-tracing, SLA-алерти (CRUD <100 мс, bulk <10 с).
- **Recovery** — резервні копії та механізми відновлення кешів/WebSocket-хабів.

> Додаткові технічні аспекти описані в [docs/technical-architecture.md](technical-architecture.md).

## Workflow для користувача

### Щоденна робота
1. **Login** → дашборд активних проєктів.
2. **Select Company** → список конкурентів і ключових статусів.
3. **Quick Overview** → перегляд статусних карток.
4. **Deep Dive** → розгортання потрібних модулів.
5. **Update Data** → швидке оновлення через inline-редагування.
6. **Set Reminders** → налаштування алертів та нагадувань.

### Налаштування нового конкурента
1. **Create Competitor** → базова інформація.
2. **Choose Template** → вибір набору модулів.
3. **Quick Setup** → заповнення ключових даних.
4. **Customize Layout** → розташування модулів.
5. **Set Monitoring** → автоматичний збір даних.

> Покрокові сценарії для щоденної роботи див. у [docs/user-daily-workflow.md](user-daily-workflow.md).

## Метрики ефективності
- **Load Time** — <2 с для будь-якого екрану.
- **Search Speed** — <500 мс для пошуку.
- **Bulk Operations** — <10 с для 100+ записів.
- **Memory Usage** — <500 МБ для сесії з 20+ вкладками.
