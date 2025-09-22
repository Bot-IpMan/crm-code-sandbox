# Папка `Projects/`

Містить усі активні проєкти, кампанії та угоди з клієнтами. Кожна нотатка відображає план робіт, етапи, відповідальних і ризики.

## Формат імені
`Проєкт – Клієнт` (наприклад, `SEO Sprint – @Acme Corp`). За потреби додавайте префікси `Deal –`, `Campaign –`.

## Етапи / статуси
- `planning`
- `in-progress`
- `on-hold`
- `review`
- `completed`
- `cancelled`

## Рекомендовані метадані
```yaml
---
type: project
client: [[@Acme Corp – Іван Іваненко]]
manager: [[Проєктний менеджер]]
team:
  - [[Аналітик]]
  - [[Дизайнер]]
stage: in-progress
scope: SEO + контент
start: 2024-04-01
deadline: 2024-06-30
budget: 12000
success_metrics:
  - Increase organic traffic by 25%
  - Publish 8 research articles
related_leads:
  - [[BrandX (lead)]]
linked_tasks:
  - [[Task – Провести аудит]]
risks:
  - Затримка з боку клієнта
status_notes: Погоджено новий roadmap
resources:
  - [[Documents/Project Brief.pdf]]
tags:
  - project
  - campaign/seo
---
```

## Структура нотатки
1. **Огляд** — мета проєкту, цінність для клієнта.
2. **Команда та ролі** — відповідальні, внутрішні та зовнішні ресурси.
3. **План робіт / етапи** — перелік фаз із датами та чекбоксами.
4. **Дашборд задач** — вставки Dataview або списки задач.
5. **Комунікація** — посилання на зустрічі, нотатки, документи.
6. **Ризики та залежності** — моніторинг проблем та планів дій.
7. **Фінанси** — бюджет, витрати, інвойси.
8. **Підсумки** — результати, висновки, lessons learned.

## Теги та звʼязки
- Основні теги: `#project`, `#campaign/{тип}`, `#deal`.
- Додаткові: `#stage/{етап}`, `#retainer`, `#fixed-price`.
- Лінкуйте з:
  - `Clients/` — головний клієнт;
  - `Contacts/` — стейкхолдери;
  - `Tasks/` — детальні чеклисти та задачі;
  - `Documents/` — дорожні карти, брифінги, інвойси.

## Dataview-приклад
```dataview
table stage, deadline, manager, length(linked_tasks)
from "Projects"
where type = "project" and stage != "completed"
sort deadline asc
```

Використовуйте Kanban-плагін для візуалізації етапів, а також шаблони для швидкого створення нових проєктів з узгодженою структурою.
