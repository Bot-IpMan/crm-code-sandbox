# Папка `Tasks/`

У цій папці ведіть великі або кросфункціональні задачі, які потребують окремого контексту. Дрібні дії можна залишати у нотатках клієнтів чи проєктів як чекбокси.

## Формат імені
`Task – Опис – Контекст` (наприклад, `Task – Підготувати конкурентний аналіз – @Acme Corp`).

## Рекомендовані метадані
```yaml
---
type: task
status: todo # todo / in-progress / blocked / done / cancelled
priority: A # A / B / C
owner: [[Відповідальний]]
due: 2024-05-15
created: 2024-05-01
related_to:
  - [[@Acme Corp – Іван Іваненко]]
  - [[SEO Sprint – @Acme Corp]]
category: research
estimated_hours: 12
actual_hours:
dependencies:
  - [[Task – Отримати доступи]]
tags:
  - task
  - priority/a
  - area/research
---
```

## Структура нотатки
1. **Опис задачі** — результат, критерії приймання.
2. **План дій** — чекліст або підзадачі.
3. **Контекст** — посилання на клієнтів, проєкти, документи.
4. **Комунікація** — нотатки про статус, перешкоди, рішення.
5. **Артефакти** — посилання на документи, репорти, презентації.
6. **Після виконання** — фактичні години, висновки.

## Теги та звʼязки
- Основні теги: `#task`, `#priority/{a-c}`, `#status/{стан}`.
- Додаткові: `#area/{sales/research/delivery}`, `#context/{client/project}`.
- Лінкуйте до `Clients/`, `Projects/`, `Leads/`, `Contacts/` для повного ланцюжка взаємодій.

## Dataview-приклад
```dataview
table status, priority, due, owner, related_to
from "Tasks"
where type = "task" and status != "done"
sort priority asc, due asc
```

Поєднуйте з плагіном Tasks для нагадувань, повторюваних задач та синхронізації з календарем.
