---
type: report
subtype: export-guide
title: Data Export Playbook
tags:
  - report
  - export
  - workflow
---

# Data Export Playbook

Шпаргалка для вивантаження даних із CRM-vault у зовнішні інструменти (таблиці, BI, аналітичні скрипти). Нижче — поєднання плагінів Obsidian та готових DataviewJS-скриптів.

## 1. MetaEdit (масове редагування / експорт фронтматеру)
1. Встановіть плагін **MetaEdit** та дайте доступ до папок `Clients/`, `Leads/`, `Projects/`, `Tasks/`.
2. Відкрийте команду **MetaEdit: View metadata** на потрібній нотатці або на виборі файлів, щоб зібрати фронтматер у табличному вигляді.
3. Використовуйте **MetaEdit: Export to CSV** для швидкого вивантаження відфільтрованих колонок (наприклад, `name`, `status`, `last_contact`, `owner`).
4. Змінюйте значення безпосередньо у модальному вікні MetaEdit для пакетного оновлення полів (наприклад, `engagement_score`).

## 2. Metadata Extractor (регулярні бекапи)
1. Встановіть плагін **Metadata Extractor** і створіть профіль (наприклад, `crm-snapshot`).
2. Вкажіть папки для сканування (`Clients`, `Leads`, `Tasks`, `Projects`) та формат вихідних файлів (CSV або JSON).
3. Запустіть команду **Metadata Extractor: Run** — плагін збере всі YAML-поля та збереже їх у `./meta/` (або іншу вказану директорію) з датою виконання.
4. Імпортуйте згенерований CSV/JSON у BI-інструмент чи Google Sheets для подальшої візуалізації.

## 3. DataviewJS → JSON (копіювати/вставити)

```dataviewjs
const leads = dv.pages('"Leads"').where(l => (l.type ?? "").toLowerCase() === "lead").array();
const dataset = leads.map(lead => ({
  name: lead.name ?? lead.file.name,
  status: lead.status ?? null,
  stage: lead.stage ?? null,
  potential_value: lead.potential_value ?? null,
  probability: lead.probability ?? null,
  owner: lead.owner ? lead.owner.path : null,
  last_contact: lead.last_contact ?? null,
  related_client: lead.related_client ? lead.related_client.path : null
}));
const pre = dv.el("pre");
pre.classList.add("language-json");
pre.textContent = JSON.stringify(dataset, null, 2);
```

> Скопіюйте JSON у буфер або збережіть як `.json` для імпорту у зовнішні сервіси.

## 4. DataviewJS → CSV (таблиця задач)

```dataviewjs
const tasks = dv.pages('"Tasks"').where(t => (t.type ?? "").toLowerCase() === "task").array();
const headers = ["title", "status", "due", "owner", "related_to", "priority", "completed"];
const rows = tasks.map(task => {
  const related = (task.related_to ?? []).map(link => link.path).join(";");
  return [
    `"${task.file.name.replace(/"/g, '""')}"`,
    `"${(task.status ?? '').replace(/"/g, '""')}"`,
    task.due ? dv.date(task.due).toISODate() : "",
    task.owner ? `"${task.owner.path.replace(/"/g, '""')}"` : "",
    `"${related.replace(/"/g, '""')}"`,
    task.priority ? `"${task.priority.replace(/"/g, '""')}"` : "",
    task.completed ? dv.date(task.completed).toISODate() : ""
  ].join(",");
});
const csv = [headers.join(","), ...rows].join("\n");
const pre = dv.el("pre");
pre.classList.add("language-csv");
pre.textContent = csv;
```

> Вставте CSV у Google Sheets, Excel або завантажте у BI. Для великих масивів рекомендується зберігати результат у файл за допомогою команд `Copy` → `Paste to new file`.

## 5. Рекомендовані наступні кроки
- Налаштуйте автоматичний експорт за розкладом (наприклад, через Obsidian Git + GitHub Actions).
- Додавайте кастомні поля (`engagement_score`, `health_index`, `csat`) у YAML, щоб вони потрапляли у CSV/JSON.
- Якщо потрібні графіки в Obsidian Charts, використовуйте CSV-блоки з цього файлу як джерело (наприклад, кодовий блок \`\`\`chart ... \`\`\`).
- Зберігайте шаблонні запити у цій папці, щоб команда легко повторювала експорт без зайвих інструкцій.
