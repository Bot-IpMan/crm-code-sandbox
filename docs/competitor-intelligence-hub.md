# Competitor Intelligence Hub — Масштабована архітектура

## Огляд
Це проєктування описує UI/UX та технічну архітектуру модульної системи конкурентної розвідки, здатної обробляти десятки клієнтів, сотні конкурентів та різнорідні дані без втрати продуктивності.

## Масштабована архітектура для великих обсягів даних
- **Мультиорендність** — логічна ізоляція даних клієнтів (tenant_id в усіх таблицях, sharding за клієнтом для >50 конкурентів).
- **Data Ingestion Layer** — конектори до API, RSS, соцмереж, ручні імпорти CSV/Excel. Планувальник (Airflow/Temporal) керує фетчингом та ретраями.
- **Streaming & Queueing** — Kafka/Redpanda для потокового надходження сигналів (цінові зміни, згадки в медіа) та подій користувача.
- **Normalization & Enrichment** — pipeline очищення (dbt/Beam) приводить дані до canonical-моделей, додає таксономії, географію, sentiment.
- **Storage Tiering**
  - OLTP (PostgreSQL + партиції) для оперативних даних модулів.
  - OLAP (BigQuery/Snowflake) для історичних трендів, аналітики.
  - Object Storage (S3/GCS) для файлів, медіа та резервних копій.
- **Indexing Layer** — Elasticsearch/OpenSearch для швидкого пошуку, Redis для кешів запитів та side-panel агрегатів.
- **Service Mesh** — окремі сервіси для компаній, конкурентів, модулів, користувачів, синхронізовані через gRPC/REST. Istio/Linkerd для observability та rate limiting.
- **Event Bus** — публікація доменних подій (ModuleCreated, CompetitorUpdated) для реактивних модулів, оновлення UI у реальному часі.
- **Data Governance** — каталог метаданих, аудит дій, автоматичне маскування PII.
- **Observability** — централізовані логи (ELK), метрики (Prometheus/Grafana), трейсинг (Jaeger), SLA-алерти.

## Дерево навігації
```
📁 Компанія А (25 конкурентів)
  └── 🏢 Конкурент 1 [●●○] (3 активні модулі)
  └── 🏢 Конкурент 2 [●○○] (1 активний модуль)
📁 Компанія Б (87 конкурентів)
  └── 🏢 Конкурент 1 [●●●] (всі модулі)
```

### Принципи побудови Sidebar Navigation
- **Віртуалізовані списки** — react-window/virtual-scroller для рендеру 100+ конкурентів із 60FPS.
- **Агреговані стани** — значки модулів `[●●○]` підтягуються асинхронно з Redis cache, оновлюються через WebSocket diff.
- **Lazy Expansion** — дерево підвантажує дітей лише при розгортанні гілки; бекенд повертає пагіновані списки конкурентів (cursor-based).
- **Multi-select & Bulk Actions** — чекбокси в іконках дозволяють масове застосування шаблонів модулів або експорт.
- **Context-aware Search** — інкрементальний пошук по компаніях/конкурентах з підсвіткою збігів та швидкими фільтрами (теги, активні модулі).
- **Keyboard-first UX** — навігація стрілками, Enter для відкриття, пробіл для вибору, Ctrl+F для scoped search.

## Робоча область (Workspace)
- **Multi-tab Interface** — кожен конкурент відкривається у власній вкладці.
- **Split View** — паралельне порівняння 2–4 конкурентів.
- **Quick Switch** — миттєве перемикання між вкладками (Ctrl+Tab).

## LEGO-система модулів
### Стандартна структура
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

### Бібліотека шаблонів
#### Швидкі модулі (Quick Cards)
- **Info Card** — базові дані, лого та статус.
- **KPI Card** — ключові метрики (дохід, частка, розмір).
- **Status Card** — стан моніторингу.
- **Contact Card** — 1–3 основні контактні особи.

#### Аналітичні модулі (Analytics)
- **Price Timeline** — історія цін з мініграфіком.
- **Media Buzz** — згадки у ЗМІ з sentiment-аналізом.
- **Tech Stack** — технології конкурента.
- **SWOT Matrix** — швидкий SWOT.

#### Робочі модулі (Work)
- **Task Kanban** — задачі за конкурентом.
- **Document Vault** — файли й документи.
- **Contact CRM** — контактна база.
- **Notes** — текстові нотатки.

#### Зв'язки (Relationships)
- **Network Map** — граф зв'язків.
- **Comparison Table** — порівняння конкурентів.
- **Timeline** — ключові події.

## Менеджмент модулів
- **Module Library** — галерея шаблонів.
- **Quick Add** — кнопка + біля конкурента.
- **Bulk Actions** — масове додавання однакових модулів.
- **Custom Templates** — користувацькі набори.
- **CRUD** — створення перетягуванням, згорнутий/розгорнутий перегляд, inline-редагування та drag&drop-ресайз, м'яке видалення з відновленням.
- **Організація** — drag & drop між конкурентами, grid-верстка, збережені макети, масове переміщення.

## Оптимізація під великі обсяги
### Віртуалізація та ледаче завантаження
- **Virtual Scrolling** — рендеряться тільки видимі елементи навіть у списках із сотнями конкурентів.
- **Lazy Loading** — модулі та дані підтягуються лише під час розгортання, що зменшує initial payload.
- **Progressive Enhancement** — UI спочатку відмальовує структуру та skeleton-states, а дані дозавантажуються потоково.
- **Caching Strategy** — кешування часто використовуваних даних (Redis/edge cache) для миттєвого повторного доступу.

### Пошук та фільтрація
```
🔍 Smart Search:
├── Global: Пошук по всій базі
├── Scoped: В межах клієнта/конкурента
├── Module-specific: В межах конкретного типу даних
└── Saved Filters: Збереження частих фільтрів
```

### Масові операції
- **Bulk Edit** — одночасне редагування групи конкурентів або модулів.
- **Template Apply** — застосування шаблонів до виділеної групи.
- **Export/Import** — масовий експорт у CSV/Excel та імпорт оновлень назад.
- **Archive/Restore** — архівування неактивних конкурентів із можливістю відновлення.

### Додаткові стратегії масштабування
- **Adaptive Prefetching** — machine learning-модель прогнозує, які модулі або конкуренти відкриють далі, й підготовлює дані в кеші.
- **Edge Delivery** — CDN edge functions попередньо обчислюють легкі агрегації для мобільних користувачів.
- **Backpressure Control** — сервіс інжесту та UI використовують rate limiting та черги, щоб уникнути блокувань при пікових оновленнях.

## UI/UX патерни
- **Card Density** — три рівні щільності (compact/normal/comfortable).
- **Icon System** — максимум іконок замість тексту.
- **Color Coding** — кольорове кодування й статусні індикатори.
- **Navigation** — breadcrumbs, Ctrl+K quick jump, недавно переглянуті, закладки.
- **Productivity** — шорткати, групові операції, контекстні дії, автозбереження.

## Права доступу
- **Roles** — Owner, Manager, Analyst, Viewer.
- **Granular Permissions** — рівні компанії, конкурента, модуля, поля.

## Технічна архітектура
### База даних
```sql
companies (id, name, status, settings)
competitors (id, company_id, name, priority, tags)
modules (id, competitor_id, type, config, data, position)
permissions (user_id, resource_type, resource_id, actions)
activity_log (id, tenant_id, actor_id, resource_type, resource_id, event, payload, created_at)
module_snapshots (id, module_id, version, diff, created_at)
search_index (resource_type, resource_id, payload, embeddings)
```

### API та інтеграції
- **REST** — `/api/companies/:id/competitors/:id/modules`.
- **Bulk** — `/api/bulk/modules` для масових операцій.
- **GraphQL** — складні вибірки.
- **WebSocket** — real-time оновлення.
- **Performance** — індекси, партиціонування, Redis-кеш, CDN для статики, курсорна пагінація.
- **gRPC Streaming** — для високочастотних телеметричних даних (цінові тики, моніторинг реклами).
- **Webhook Orchestrator** — безпечні вихідні webhook-и для алертів клієнтам (HMAC-підпис, повтори).
- **Data Lake Exports** — планові вивантаження в S3/BigQuery через `/api/export` або Airflow DAG.

## Користувацький workflow
1. Вхід → дашборд активних проєктів.
2. Вибір компанії → список конкурентів.
3. Огляд статусних карток.
4. Глибоке дослідження → розгортання модулів.
5. Оновлення даних → inline-редагування.
6. Нагадування й алерти.

### Налаштування нового конкурента
1. Створення конкурента.
2. Вибір шаблону модулів.
3. Швидке заповнення ключових полів.
4. Кастомізація розміщення модулів.
5. Моніторинг та автоматичний збір даних.

## KPI
- Завантаження екранів < 2 с.
- Пошук < 500 мс.
- Масові операції (100+ записів) < 10 с.
- Споживання пам'яті < 500 МБ при 20+ вкладках.
