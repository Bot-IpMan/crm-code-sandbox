---
type: report
title: CRM Analytics Dashboard
tags:
  - report
stale_client_threshold: 14
engagement_weights:
  base: 60
  task: 8
  contact_decay: 1.2
---

# CRM Analytics Dashboard

Аналітичний центр для швидкої оцінки стану воронки, активності клієнтів і завантаження команди. Значення оновлюються автоматично на основі YAML-полів у папках `Clients/`, `Leads/`, `Projects/` та `Tasks/`.

## 1. Воронка лідів та конверсія

```dataviewjs
const stageOrder = ["new","contacted","qualified","proposal","negotiation","won","lost"];
const labelMap = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost"
};
const normalize = value => (value ?? "").toString().toLowerCase();
const leads = dv.pages('"Leads"').where(l => normalize(l.type) === "lead");
if (!leads || leads.length === 0) {
  dv.paragraph("У сховищі немає лідів.");
} else {
  const stageSummary = stageOrder.map(status => {
    const items = leads.where(l => normalize(l.stage ?? l.status) === status);
    const arr = items.array();
    if (!arr.length) return null;
    const potential = arr.reduce((sum, item) => sum + (item.potential_value ?? 0), 0);
    return {
      status,
      label: labelMap[status] ?? status,
      count: arr.length,
      potential,
      links: arr.map(item => item.file.link)
    };
  }).filter(Boolean);

  if (!stageSummary.length) {
    dv.paragraph("Недостатньо даних для побудови воронки.");
    return;
  }

  dv.table(
    ["Етап", "Кількість", "Потенціал, $", "Ліди"],
    stageSummary.map(row => [
      row.label,
      row.count,
      row.potential,
      dv.array(row.links)
    ])
  );

  const totalLeads = leads.length;
  const wonLeads = leads.where(l => normalize(l.status) === "won");
  const linkedClients = leads.where(l => l.related_client);
  const conversionWon = totalLeads ? Math.round((wonLeads.length / totalLeads) * 1000) / 10 : 0;
  const conversionClients = totalLeads ? Math.round((linkedClients.length / totalLeads) * 1000) / 10 : 0;

  dv.markdown(`**Конверсія у статус "won":** ${conversionWon}% (${wonLeads.length}/${totalLeads}).`);
  dv.markdown(`**Ліди з прив'язкою до клієнтів:** ${linkedClients.length} (${conversionClients}% від загальної кількості).`);

  const maxCount = Math.max(...stageSummary.map(row => row.count));

  const funnel = dv.el("div");
  funnel.style.display = "flex";
  funnel.style.flexDirection = "column";
  funnel.style.gap = "6px";
  funnel.style.marginTop = "12px";

  stageSummary.forEach(row => {
    const rowEl = funnel.createEl("div");
    rowEl.style.display = "flex";
    rowEl.style.alignItems = "center";
    rowEl.style.gap = "12px";

    const label = rowEl.createEl("div", { text: `${row.label} (${row.count})` });
    label.style.width = "190px";
    label.style.fontWeight = "600";

    const track = rowEl.createEl("div");
    track.style.flexGrow = "1";
    track.style.backgroundColor = "var(--background-secondary, #e5e7eb)";
    track.style.borderRadius = "9999px";
    track.style.height = "16px";
    track.style.overflow = "hidden";

    const bar = track.createEl("div");
    const width = maxCount ? Math.max((row.count / maxCount) * 100, 8) : 8;
    bar.style.width = `${width}%`;
    bar.style.height = "100%";
    bar.style.borderRadius = "9999px";
    bar.style.boxShadow = "0 1px 3px rgba(15, 23, 42, 0.25)";

    if (row.status === "won") {
      bar.style.background = "linear-gradient(90deg,#22c55e,#16a34a)";
    } else if (row.status === "lost") {
      bar.style.background = "linear-gradient(90deg,#f87171,#ef4444)";
    } else {
      bar.style.background = "linear-gradient(90deg,#60a5fa,#2563eb)";
    }

    bar.setAttr("title", `${row.count} лідів на етапі ${row.label}`);
  });
}
```

## 2. Клієнти, що потребують уваги

```dataviewjs
const settings = dv.current();
const threshold = Number(settings.stale_client_threshold ?? 14);
const weights = Object.assign({ base: 50, task: 6, contact_decay: 1 }, settings.engagement_weights ?? {});
const now = luxon.DateTime.now();
const clients = dv.pages('"Clients"').where(c => (c.type ?? "").toLowerCase() === "client");
const tasks = dv.pages('"Tasks"').where(t => (t.type ?? "").toLowerCase() === "task");
if (!clients || clients.length === 0) {
  dv.paragraph("Картки клієнтів відсутні.");
  return;
}
const taskArray = tasks.array();
const dataset = clients.array().map(client => {
  const lastContact = client.last_contact ? dv.date(client.last_contact) : null;
  const daysSince = lastContact ? Math.floor(now.diff(lastContact, "days").days) : null;
  const openTasks = taskArray.filter(task =>
    task.status !== "done" &&
    task.related_to &&
    task.related_to.some(link => link.path === client.file.path)
  ).length;
  const manualScore = client.engagement_score ?? null;
  const computedScore = Math.max(
    0,
    Math.round(
      (weights.base ?? 0) +
      openTasks * (weights.task ?? 0) -
      (daysSince ?? 0) * (weights.contact_decay ?? 0)
    )
  );
  return { client, lastContact, daysSince, openTasks, manualScore, computedScore };
});

dv.markdown(`Порог відсутності контакту: **${threshold} днів** (налаштовується через \`stale_client_threshold\` у YAML).`);

const stale = dataset.filter(item => (item.daysSince ?? Infinity) > threshold);

if (!stale.length) {
  dv.paragraph("Усі клієнти контактували в межах заданого порогу.");
} else {
  dv.table(
    ["Клієнт", "Днів без контакту", "Останній контакт", "Активні задачі", "Manual score", "Розрахований score"],
    stale.map(item => [
      dv.fileLink(item.client.file.path),
      item.daysSince ?? "—",
      item.lastContact ? item.lastContact.toISODate() : "—",
      item.openTasks,
      item.manualScore ?? "—",
      item.computedScore
    ])
  );
}

dv.header(3, "Лідерборд залученості (engagement score)");
const leaderboard = dataset.sort((a, b) => b.computedScore - a.computedScore);
dv.table(
  ["Клієнт", "Активні задачі", "Днів без контакту", "Manual score", "Розрахований score"],
  leaderboard.map(item => [
    dv.fileLink(item.client.file.path),
    item.openTasks,
    item.daysSince ?? "—",
    item.manualScore ?? "—",
    item.computedScore
  ])
);
```

## 3. Статистика задач та завантаження команди

```dataviewjs
const tasks = dv.pages('"Tasks"').where(t => (t.type ?? "").toLowerCase() === "task");
if (!tasks || tasks.length === 0) {
  dv.paragraph("Задачі відсутні.");
  return;
}
const now = luxon.DateTime.now().startOf("day");
const arr = tasks.array();
const total = arr.length;
const countsByStatus = {};
arr.forEach(task => {
  const key = (task.status ?? "unspecified").toString();
  countsByStatus[key] = (countsByStatus[key] ?? 0) + 1;
});
const overdue = arr.filter(task => task.due && task.status !== "done" && dv.date(task.due) < now);
const dueSoon = arr.filter(task => task.status !== "done" && task.due && dv.date(task.due) >= now && dv.date(task.due) <= now.plus({ days: 3 }));
const completed = arr.filter(task => (task.status ?? "").toLowerCase() === "done");

dv.markdown(`**Всього задач:** ${total}. **Виконано:** ${completed.length}. **Прострочено:** ${overdue.length}. **Дедлайн ≤ 3 днів:** ${dueSoon.length}.`);

const statusRows = Object.entries(countsByStatus)
  .map(([status, count]) => ({
    status,
    count,
    percentage: total ? Math.round((count / total) * 1000) / 10 : 0
  }))
  .sort((a, b) => b.count - a.count);

dv.table(
  ["Статус", "К-сть", "% від усіх"],
  statusRows.map(row => [row.status, row.count, `${row.percentage}%`])
);

if (statusRows.length) {
  const maxStatus = Math.max(...statusRows.map(row => row.count));
  const chart = dv.el("div");
  chart.style.display = "flex";
  chart.style.flexDirection = "column";
  chart.style.gap = "6px";
  chart.style.marginTop = "12px";

  statusRows.forEach(row => {
    const rowEl = chart.createEl("div");
    rowEl.style.display = "flex";
    rowEl.style.alignItems = "center";
    rowEl.style.gap = "12px";

    const label = rowEl.createEl("div", { text: `${row.status} (${row.count})` });
    label.style.width = "200px";
    label.style.fontWeight = "500";

    const track = rowEl.createEl("div");
    track.style.flexGrow = "1";
    track.style.height = "12px";
    track.style.borderRadius = "9999px";
    track.style.backgroundColor = "var(--background-secondary, #e5e7eb)";
    track.style.overflow = "hidden";

    const bar = track.createEl("div");
    const width = maxStatus ? Math.max((row.count / maxStatus) * 100, 8) : 8;
    bar.style.width = `${width}%`;
    bar.style.height = "100%";
    bar.style.borderRadius = "9999px";
    bar.style.background = "linear-gradient(90deg,#fbbf24,#f97316)";
    bar.setAttr("title", `${row.count} задач зі статусом ${row.status}`);
  });
}

if (overdue.length) {
  dv.header(3, "Прострочені задачі");
  dv.table(
    ["Задача", "Дедлайн", "Відповідальний", "Статус"],
    overdue.map(task => [
      dv.fileLink(task.file.path),
      task.due ? dv.date(task.due).toISODate() : "—",
      task.owner ? dv.fileLink(task.owner.path) : "—",
      task.status ?? "—"
    ])
  );
}

if (dueSoon.length) {
  dv.header(3, "Дедлайн протягом 3 днів");
  dv.table(
    ["Задача", "Дедлайн", "Відповідальний"],
    dueSoon.map(task => [
      dv.fileLink(task.file.path),
      task.due ? dv.date(task.due).toISODate() : "—",
      task.owner ? dv.fileLink(task.owner.path) : "—"
    ])
  );
}

const ownerCounts = {};
arr.forEach(task => {
  const ownerLink = task.owner ?? null;
  const key = ownerLink ? ownerLink.path : "__unassigned";
  if (!ownerCounts[key]) {
    ownerCounts[key] = { count: 0, link: ownerLink };
  }
  ownerCounts[key].count += 1;
});

const ownerRows = Object.values(ownerCounts)
  .map(item => {
    const label = item.link
      ? (item.link.display ?? item.link.path.split("/").pop())
      : "Не призначено";
    return {
      label,
      link: item.link ? dv.fileLink(item.link.path) : "—",
      count: item.count
    };
  })
  .sort((a, b) => b.count - a.count);

dv.header(3, "Розподіл задач за відповідальними");
dv.table(
  ["Відповідальний", "К-сть задач"],
  ownerRows.map(row => [row.link, row.count])
);

if (ownerRows.length) {
  const maxOwner = Math.max(...ownerRows.map(row => row.count));
  const ownerChart = dv.el("div");
  ownerChart.style.display = "flex";
  ownerChart.style.flexDirection = "column";
  ownerChart.style.gap = "6px";
  ownerChart.style.marginTop = "12px";

  ownerRows.forEach(row => {
    const rowEl = ownerChart.createEl("div");
    rowEl.style.display = "flex";
    rowEl.style.alignItems = "center";
    rowEl.style.gap = "12px";

    const label = rowEl.createEl("div", { text: `${row.label} (${row.count})` });
    label.style.width = "220px";
    label.style.fontWeight = "500";

    const track = rowEl.createEl("div");
    track.style.flexGrow = "1";
    track.style.height = "12px";
    track.style.borderRadius = "9999px";
    track.style.backgroundColor = "var(--background-secondary, #e5e7eb)";
    track.style.overflow = "hidden";

    const bar = track.createEl("div");
    const width = maxOwner ? Math.max((row.count / maxOwner) * 100, 8) : 8;
    bar.style.width = `${width}%`;
    bar.style.height = "100%";
    bar.style.borderRadius = "9999px";
    bar.style.background = "linear-gradient(90deg,#34d399,#059669)";
    bar.setAttr("title", `${row.count} задач у ${row.label}`);
  });
}

const relatedCounts = {};
arr.forEach(task => {
  (task.related_to ?? []).forEach(link => {
    if (!link || !link.path) return;
    const key = link.path;
    if (!relatedCounts[key]) {
      relatedCounts[key] = { count: 0, link };
    }
    relatedCounts[key].count += 1;
  });
});

const relatedRows = Object.values(relatedCounts)
  .map(item => {
    const type = item.link.path.startsWith("Clients/") ? "client"
      : item.link.path.startsWith("Leads/") ? "lead"
      : item.link.path.startsWith("Projects/") ? "project"
      : "other";
    return {
      link: dv.fileLink(item.link.path),
      label: item.link.display ?? item.link.path.split("/").pop(),
      type,
      count: item.count
    };
  })
  .sort((a, b) => b.count - a.count);

dv.header(3, "Розподіл задач за клієнтами / лідами / проєктами");
dv.table(
  ["Прив'язка", "Тип", "К-сть задач"],
  relatedRows.map(row => [row.link, row.type, row.count])
);

const focusRows = relatedRows.filter(row => row.type === "client" || row.type === "lead");
if (focusRows.length) {
  const maxFocus = Math.max(...focusRows.map(row => row.count));
  const focusChart = dv.el("div");
  focusChart.style.display = "flex";
  focusChart.style.flexDirection = "column";
  focusChart.style.gap = "6px";
  focusChart.style.marginTop = "12px";

  focusRows.forEach(row => {
    const rowEl = focusChart.createEl("div");
    rowEl.style.display = "flex";
    rowEl.style.alignItems = "center";
    rowEl.style.gap = "12px";

    const label = rowEl.createEl("div", { text: `${row.label} (${row.count})` });
    label.style.width = "220px";
    label.style.fontWeight = "500";

    const track = rowEl.createEl("div");
    track.style.flexGrow = "1";
    track.style.height = "12px";
    track.style.borderRadius = "9999px";
    track.style.backgroundColor = "var(--background-secondary, #e5e7eb)";
    track.style.overflow = "hidden";

    const bar = track.createEl("div");
    const width = maxFocus ? Math.max((row.count / maxFocus) * 100, 8) : 8;
    bar.style.width = `${width}%`;
    bar.style.height = "100%";
    bar.style.borderRadius = "9999px";
    bar.style.background = "linear-gradient(90deg,#60a5fa,#2563eb)";
    bar.setAttr("title", `${row.count} задач, пов'язаних із ${row.label}`);
  });
}
```

## 4. Примітки щодо експорту та розширень

- Для глибшої обробки даних скористайтеся нотаткою [[Reports/Data Export Playbook]] або заплануйте експорт за допомогою MetaEdit / Metadata Extractor.
- Змінюйте ваги у блоці `engagement_weights`, щоб адаптувати формулу engagement score до реальної частоти комунікацій і навантаження команди.
- Додавайте власні секції (наприклад, аналіз ARR чи прогнозованого доходу) шляхом копіювання DataviewJS-блоків і зміни фільтрів.
