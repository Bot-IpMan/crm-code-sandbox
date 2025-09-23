---
type: report
subtype: weekly-review
title: Weekly Review Template
tags:
  - report
  - review
  - weekly
week_start: 2024-05-06
week_end: 2024-05-12
stale_client_threshold: 14
---

# Weekly Review Template

Дублюйте цю нотатку щотижня, оновлюйте `week_start` / `week_end` у YAML і фіксуйте ключові інсайти на основі автоматичних дайджестів Dataview. За потреби додавайте власні секції (наприклад, маркетингові кампанії або фінансові показники).

## Параметри періоду

```dataviewjs
const current = dv.current();
const weekStart = dv.date(current.week_start ?? luxon.DateTime.now().startOf("week"));
const weekEnd = dv.date(current.week_end ?? luxon.DateTime.now().endOf("week"));
const days = Math.max(1, Math.round(weekEnd.diff(weekStart, "days").days) + 1);
dv.table([
  "Показник",
  "Значення"
], [
  ["Початок тижня", weekStart.toISODate()],
  ["Кінець тижня", weekEnd.toISODate()],
  ["Тривалість, днів", days]
]);
```

## 1. Рух у воронці за тиждень

```dataviewjs
const current = dv.current();
const normalize = value => (value ?? "").toString().toLowerCase();
const weekStart = dv.date(current.week_start ?? luxon.DateTime.now().startOf("week"));
const weekEnd = dv.date(current.week_end ?? luxon.DateTime.now().endOf("week"));
const toLink = (value) => {
  if (!value) return null;
  if (Array.isArray(value)) return value.length ? value[0] : null;
  if (value.path) return value;
  return null;
};
const leads = dv.pages('"Leads"').where(l => normalize(l.type) === "lead").array();
const inRange = (value) => {
  if (!value) return false;
  const date = dv.date(value);
  return date && date >= weekStart && date <= weekEnd;
};
const createdThisWeek = leads.filter(lead => inRange(lead.created));
const touchedThisWeek = leads.filter(lead => inRange(lead.last_contact));
const wonThisWeek = leads.filter(lead => normalize(lead.status) === "won" && inRange(lead.last_contact));
const conversion = touchedThisWeek.length ? Math.round((wonThisWeek.length / touchedThisWeek.length) * 1000) / 10 : 0;

dv.table([
  "Метрика",
  "Значення"
], [
  ["Нові ліди", `${createdThisWeek.length}`],
  ["Ліди з контактами за тиждень", `${touchedThisWeek.length}`],
  ["Закрито в \"won\"", `${wonThisWeek.length}`],
  ["Конверсія тижня", touchedThisWeek.length ? `${conversion}%` : "—"]
]);

if (createdThisWeek.length) {
  dv.header(3, "Нові ліди");
  dv.table([
    "Лід",
    "Статус",
    "Потенціал, $",
    "Власник"
  ], createdThisWeek.map(lead => {
    const ownerLink = toLink(lead.owner);
    return [
      dv.fileLink(lead.file.path),
      lead.status ?? "—",
      lead.potential_value ?? "—",
      ownerLink ? dv.fileLink(ownerLink.path) : "—"
    ];
  }));
}

if (wonThisWeek.length) {
  dv.header(3, "Ліди, що стали клієнтами цього тижня");
  dv.table([
    "Лід",
    "Клієнт",
    "Останній контакт"
  ], wonThisWeek.map(lead => {
    const clientLink = toLink(lead.related_client);
    return [
      dv.fileLink(lead.file.path),
      clientLink ? dv.fileLink(clientLink.path) : "—",
      lead.last_contact ? dv.date(lead.last_contact).toISODate() : "—"
    ];
  }));
}
```

## 2. Клієнти без контакту понад N днів

```dataviewjs
const current = dv.current();
const threshold = Number(current.stale_client_threshold ?? 14);
const weekEnd = dv.date(current.week_end ?? luxon.DateTime.now().endOf("week"));
const clients = dv.pages('"Clients"').where(c => (c.type ?? "").toLowerCase() === "client").array();
const tasks = dv.pages('"Tasks"').where(t => (t.type ?? "").toLowerCase() === "task").array();
const now = luxon.DateTime.now();
const staleClients = clients
  .map(client => {
    const lastContact = client.last_contact ? dv.date(client.last_contact) : null;
    const daysSince = lastContact ? Math.floor(now.diff(lastContact, "days").days) : null;
    const openTasks = tasks.filter(task => task.status !== "done" && task.related_to && task.related_to.some(link => link.path === client.file.path)).length;
    return {
      client,
      lastContact,
      daysSince,
      openTasks
    };
  })
  .filter(item => (item.daysSince ?? Infinity) > threshold && (!item.lastContact || item.lastContact <= weekEnd))
  .sort((a, b) => (b.daysSince ?? 0) - (a.daysSince ?? 0));

dv.paragraph(`Порог: ${threshold} днів без контакту.`);

if (!staleClients.length) {
  dv.paragraph("Немає клієнтів, що перевищили порог без контакту.");
} else {
  dv.table([
    "Клієнт",
    "Днів без контакту",
    "Останній контакт",
    "Активні задачі"
  ], staleClients.map(item => [
    dv.fileLink(item.client.file.path),
    item.daysSince ?? "—",
    item.lastContact ? item.lastContact.toISODate() : "—",
    item.openTasks
  ]));
}
```

## 3. Виконані та заплановані задачі

```dataviewjs
const current = dv.current();
const weekStart = dv.date(current.week_start ?? luxon.DateTime.now().startOf("week"));
const weekEnd = dv.date(current.week_end ?? luxon.DateTime.now().endOf("week"));
const tasks = dv.pages('"Tasks"').where(t => (t.type ?? "").toLowerCase() === "task").array();
const completed = tasks.filter(task => (task.status ?? "").toLowerCase() === "done" && task.completed && dv.date(task.completed) >= weekStart && dv.date(task.completed) <= weekEnd);
const completedFallback = tasks.filter(task => (task.status ?? "").toLowerCase() === "done" && !task.completed && task.due && dv.date(task.due) >= weekStart && dv.date(task.due) <= weekEnd);
const completedThisWeek = [...completed, ...completedFallback.filter(task => !completed.includes(task))];
const upcoming = tasks.filter(task => task.status !== "done" && task.due && dv.date(task.due) > weekEnd && dv.date(task.due) <= weekEnd.plus({ days: 7 }));
const overdue = tasks.filter(task => task.status !== "done" && task.due && dv.date(task.due) < weekStart);

dv.table([
  "Метрика",
  "Значення"
], [
  ["Завершено цього тижня", `${completedThisWeek.length}`],
  ["Заплановано на наступний тиждень", `${upcoming.length}`],
  ["Прострочені на старт тижня", `${overdue.length}`]
]);

if (completedThisWeek.length) {
  dv.header(3, "Завершені задачі");
  dv.table([
    "Задача",
    "Відповідальний",
    "Дедлайн",
    "Дата завершення"
  ], completedThisWeek.map(task => [
    dv.fileLink(task.file.path),
    task.owner ? dv.fileLink(task.owner.path) : "—",
    task.due ? dv.date(task.due).toISODate() : "—",
    task.completed ? dv.date(task.completed).toISODate() : (task.due ? dv.date(task.due).toISODate() : "—")
  ]));
}

if (upcoming.length) {
  dv.header(3, "Задачі на наступний тиждень");
  dv.table([
    "Задача",
    "Дедлайн",
    "Відповідальний",
    "Прив'язка"
  ], upcoming.map(task => [
    dv.fileLink(task.file.path),
    dv.date(task.due).toISODate(),
    task.owner ? dv.fileLink(task.owner.path) : "—",
    task.related_to ? dv.array(task.related_to.map(link => dv.fileLink(link.path))) : "—"
  ]));
}

if (overdue.length) {
  dv.header(3, "Прострочені задачі на старті тижня");
  dv.table([
    "Задача",
    "Дедлайн",
    "Відповідальний"
  ], overdue.map(task => [
    dv.fileLink(task.file.path),
    task.due ? dv.date(task.due).toISODate() : "—",
    task.owner ? dv.fileLink(task.owner.path) : "—"
  ]));
}
```

## 4. Журнал подій та нотатки

```dataviewjs
const current = dv.current();
const weekStart = dv.date(current.week_start ?? luxon.DateTime.now().startOf("week"));
const weekEnd = dv.date(current.week_end ?? luxon.DateTime.now().endOf("week"));
const dailyNotes = dv.pages('"Daily Notes"').where(page => page.file.name >= weekStart.toISODate() && page.file.name <= weekEnd.toISODate());
const sortedNotes = dailyNotes.array().sort((a, b) => a.file.name.localeCompare(b.file.name));
if (!sortedNotes.length) {
  dv.paragraph("Щоденних нотаток за період не знайдено.");
} else {
  dv.list(sortedNotes.map(page => dv.fileLink(page.file.path)));
}
```

## 5. Плани та ризики (заповнити вручну)
- **Головні фокуси наступного тижня:**
- **Ризики / блокери:**
- **Потреби у підтримці команди:**
- **Експерименти чи гіпотези:**

> 💡 Для місячного огляду змініть назву нотатки, оновіть `week_start` / `week_end` на відповідний період та адаптуйте фільтри (наприклад, замініть `plus({ days: 7 })` на `plus({ days: 30 })`).
