---
type: dashboard
scope: sales-pipeline
updated: 2024-05-06
tags:
  - dashboard
  - pipeline
---

# Sales Pipeline

Огляд статусів лідів та угод. Використовуйте цю нотатку для щоденного контролю воронки продажів і швидкого доступу до ключових карток.

## Підсумок по етапах
```dataviewjs
const order = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];
const leads = dv.pages('"Leads"').where(l => l.type === "lead");
const summary = order.map(status => {
  const items = leads.where(l => l.status === status);
  if (!items.length) return null;
  const sum = items.array().reduce((acc, item) => acc + (item.potential_value ?? 0), 0);
  const links = items.array().map(item => dv.fileLink(item.file.path)).join("<br>");
  return [status, items.length, sum, links || "—"];
}).filter(Boolean);
dv.table([
  "Етап",
  "Кількість",
  "Сума, $",
  "Ліди"
], summary);
```

## Активні ліди
```dataviewjs
const order = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];
const toMillis = (value) => value ? dv.date(value).toMillis() : Number.POSITIVE_INFINITY;
const activeLeads = dv.pages('"Leads"')
  .where(l => l.type === "lead" && l.status !== "lost");
const sorted = activeLeads.array().sort((a, b) => {
  const statusDiff = order.indexOf(a.status) - order.indexOf(b.status);
  if (statusDiff !== 0) return statusDiff;
  return toMillis(a.next_step_due) - toMillis(b.next_step_due);
});
dv.table([
  "Лід",
  "Етап",
  "Власник",
  "Потенціал, $",
  "Наступний крок",
  "Останній контакт"
], sorted.map(l => [
  dv.fileLink(l.file.path),
  l.status,
  l.owner ? dv.fileLink(l.owner) : "—",
  l.potential_value ?? "—",
  l.next_step_due ? dv.date(l.next_step_due).toISODate() : "—",
  l.last_contact ? dv.date(l.last_contact).toISODate() : "—"
]));
```

## Пріоритетні дії
- ☑️ Перевірити підготовку демо для [[GreenFin Analytics (lead)]] до 2024-05-14.
- ☑️ Завершити переговори з [[UrbanX Mobility (lead)]] та оновити статус угоди.
- ☑️ Підготувати kickoff-план для [[InsightEdge Consulting (lead)]] після підписання.

## Угоди (Deals)
```dataview
TABLE status, value as "Сума, $", probability as "Ймовірність", close_date as "Дата закриття"
FROM "Projects"
WHERE type = "deal"
SORT close_date asc
```

## Канбан (опційно)
> Для візуалізації можна створити канбан-дошку на основі цієї нотатки за допомогою плагіна **Kanban**. Колонки відповідають статусам воронки: `new`, `contacted`, `qualified`, `proposal`, `negotiation`, `won`, `lost`.

## Звіти та фільтри
- 🔍 Фільтр по джерелу: `source = "Webinar – Sustainable Finance Signals"`.
- 🔍 Фільтр по відповідальному: `owner = [[Лисенко Андрій – Agency Sales]]`.
- 📤 Експорт у CSV: запустіть команду DataviewJS для експорту `dv.io.csv(summary, "exports/pipeline-summary.csv")`.

## Оновлення процесу
- Стандартизовано статуси лідів згідно з єдиною шкалою (`new → contacted → qualified → proposal → negotiation → won/lost`).
- Зʼявилися швидкі посилання `tel:` та `mailto:` у картках лідів/клієнтів для миттєвих дій.
- Контакти повʼязані з компаніями через внутрішні посилання й YAML-поля `responsibles`, `related_contacts`.
