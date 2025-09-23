---
type: lead
name: "{{title}}"
status:
stage:
source:
potential_value:
probability:
priority:
owner: [[Менеджер з продажу]]
related_contacts:
  - [[Ключовий контакт]]
related_client:
deals: []
created: {{date:YYYY-MM-DD}}
last_contact:
next_step_due:
tags:
  - lead
  - pipeline/new
---

# {{title}}

## Дашборд ліда
```dataviewjs
const page = dv.current();
const formatDate = value => value ? dv.date(value).toISODate() : "—";
const probability = page.probability != null ? `${Math.round(page.probability * 100)}%` : "—";
const owner = page.owner ? dv.fileLink(page.owner) : "—";
const tasks = dv.pages('"Tasks"')
  .where(p => p.related_to && p.related_to.some(r => r.path === page.file.path) && p.status !== "done");
const deals = dv.array(page.deals ?? []).map(link => dv.fileLink(link)).join(", ") || "—";
dv.table(["Показник", "Значення"], [
  ["Статус ліда", page.status ?? "—"],
  ["Стадія воронки", page.stage ?? page.status ?? "—"],
  ["Потенціал, $", page.potential_value ?? "—"],
  ["Ймовірність", probability],
  ["Власник", owner],
  ["Наступний крок до", formatDate(page.next_step_due)],
  ["Останній контакт", formatDate(page.last_contact)],
  ["Пов'язані угоди", deals],
  ["Активні задачі", tasks.length]
]);
```

## Профіль ліда
Короткий опис організації або контакту, болі, можливості та очікуваний результат.

## Контактна інформація
- Відповідальний менеджер:: [[Менеджер з продажу]]
- Основний контакт:: [[Ключовий контакт]]
- Телефон:: +__ (___) ___-__-__
- Email:: lead@example.com
- LinkedIn:: https://
- Регіон:: 
- Zoom/відеозв'язок:: [zoommtg://zoom.us/join?action=join&confno=1122334455&pwd=lead](zoommtg://zoom.us/join?action=join&confno=1122334455&pwd=lead)

## Швидкі дії
- ✉️ [Email](mailto:lead@example.com)
- ☎️ [Дзвінок](tel:+380441112233)
- 🎥 [Zoom-демо](zoommtg://zoom.us/join?action=join&confno=1122334455&pwd=lead)
- 🔗 [LinkedIn](https://www.linkedin.com/company/example)

## Кваліфікація
- Джерело ліда:
- Етап воронки:
- Потенційний бюджет/цінність:
- Оцінка потенціалу (L/M/H):
- Конкуренти у процесі:: [[Competitors/Конкурент]]

## Потреби та пропозиція
- Основні виклики клієнта:
- Запропоноване рішення / пакет:
- Ключові аргументи:
- Ризики та заперечення:

## Наступні кроки
- Поточна задача:: [[Tasks/Задача]]
- Наступний запланований контакт:: 2024-__-__
- Формат взаємодії: дзвінок / зустріч / email / демо

## Активні задачі
```dataview
TABLE status, due, owner
FROM "Tasks"
WHERE contains(related_to, this.file.link) AND status != "done"
SORT due asc
```

## Лог взаємодій
- 2024-__-__ — Подія, результат, домовленості. Відповідальний:: [[Менеджер з продажу]]
- 2024-__-__ — ...

## Повʼязані нотатки
- [[Презентація або комерційна пропозиція]]
- [[Запис дзвінка або документ]]
- [[Projects/Повʼязана угода]]
