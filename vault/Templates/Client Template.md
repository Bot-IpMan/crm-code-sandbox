---
type: client
name: "{{title}}"
status:
responsibles:
  - [[Відповідальний менеджер]]
contacts:
  - [[Ключовий контакт]]
industry:
segment:
priority:
last_contact:
next_review:
lifetime_value:
deals: []
tags:
  - client
---

# {{title}}

## Дашборд клієнта
```dataviewjs
const page = dv.current();
const formatDate = value => value ? dv.date(value).toISODate() : "—";
const responsibles = dv.array(page.responsibles ?? []).map(link => dv.fileLink(link)).join(", ") || "—";
const tasks = dv.pages('"Tasks"')
  .where(p => p.related_to && p.related_to.some(r => r.path === page.file.path) && p.status !== "done");
const deals = dv.array(page.deals ?? []).map(link => dv.fileLink(link)).join(", ") || "—";
dv.table(["Показник", "Значення"], [
  ["Статус клієнта", page.status ?? "—"],
  ["Останній контакт", formatDate(page.last_contact)],
  ["Наступний перегляд", formatDate(page.next_review)],
  ["Активні задачі", tasks.length],
  ["Відповідальні", responsibles],
  ["Угоди", deals]
]);
```

## Опис
Короткий профіль компанії, головні продукти або послуги, сегмент ринку та очікування клієнта.

## Контактна інформація
- Основний контакт:: [[Ключовий контакт]]
- Менеджер акаунта:: [[Відповідальний менеджер]]
- Email:: client@example.com
- Телефон:: +__ (___) ___-__-__
- Локація:: Місто, країна
- Портал/сайт:: https://

## Швидкі дії
- ✉️ [Email](mailto:client@example.com)
- ☎️ [Дзвінок](tel:+380441112233)
- 🎥 [Zoom-зустріч](zoommtg://zoom.us/join?action=join&confno=9988776655&pwd=crm)
- 🔗 [LinkedIn](https://www.linkedin.com/company/example)

## Проєкти та послуги
- [[Projects/Назва проєкту]] — статус / етап / короткий опис.

## Фінанси та умови (опційно)
- Договір / тариф:
- Термін дії:
- Платіжні умови:

## Ключові показники
- Поточний статус: 
- Оцінка задоволеності: 
- Наступний контрольний огляд:: 

## Активні задачі
```dataview
TABLE status, due, owner
FROM "Tasks"
WHERE contains(related_to, this.file.link) AND status != "done"
SORT due asc
```

## Хронологія взаємодій
- 2024-__-__ — Опис взаємодії, результат, наступні кроки. Відповідальний:: [[Відповідальний менеджер]]
- 2024-__-__ — ...

## Повʼязані нотатки
- [[Contacts/Повʼязаний контакт]]
- [[Projects/Повʼязаний проєкт]]
- [[Documents/Повʼязаний документ]]
