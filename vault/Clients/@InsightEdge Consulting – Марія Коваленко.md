---
type: client
status: active
industry: consulting
segment: competitive-intelligence
responsibles:
  - [[Лисенко Андрій – Agency Sales]]
contacts:
  - [[Коваленко Марія – InsightEdge Consulting]]
tags:
  - client
  - priority/a
  - industry/consulting
last_contact: 2024-05-06
next_review: 2024-06-10
lifetime_value: 42000
hubspot_id: IE-2024-01
deals:
  - [[Projects/Deal – InsightEdge Retainer]]
---

# InsightEdge Consulting — акаунт Марії Коваленко

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
InsightEdge Consulting — консалтингова компанія, що впроваджує програми конкурентної розвідки для SaaS та фінтех-клієнтів. Агенція забезпечує для них моніторинг конкурентів, щомісячні дайджести і кастомні дашборди з ринковими сигналами.

## Контактна інформація
- Основний контакт:: [[Коваленко Марія – InsightEdge Consulting]]
- Менеджер акаунта:: [[Лисенко Андрій – Agency Sales]]
- Email для звʼязку:: [client-success@insightedge.com](mailto:client-success@insightedge.com)
- Телефон офісу:: [tel:+380442223300](tel:+380442223300)
- Запланувати Zoom:: [zoommtg://zoom.us/join?action=join&confno=9988776655&pwd=insight](zoommtg://zoom.us/join?action=join&confno=9988776655&pwd=insight)
- CRM профіль:: https://insightedge.com/partner-portal

## Швидкі дії
- ✉️ [Email](mailto:client-success@insightedge.com)
- ☎️ [Дзвінок](tel:+380442223300)
- 🎥 [Zoom-зустріч](zoommtg://zoom.us/join?action=join&confno=9988776655&pwd=insight)
- 🔗 [LinkedIn](https://www.linkedin.com/company/insightedge-consulting)
- 🌐 [Портал клієнта](https://insightedge.com/partner-portal)

## Проєкти та угоди
- [[Projects/Deal – InsightEdge Retainer]] — Річний контракт на конкурентну розвідку (статус: negotiation).
- Планується upsell на модуль **Early Warning Dashboard** у Q3 2024.

## Поточні ініціативи
- Впровадження централізованого репозиторію конкурентних сигналів.
- Налаштування регулярних зустрічей з топ-менеджментом клієнта (кожні два тижні).

## Активні задачі
```dataview
TASK
FROM "Tasks"
WHERE contains(related_to, this.file.link)
SORT due asc
```

## Хронологія взаємодій
- 2024-05-06 — Kickoff-дзвінок для старту річного контракту (див. [[Daily Notes/2024-05-06#Журнал подій]]). Визначили KPI та погодили перший звіт.
- 2024-04-29 — Надіслано персоналізований дашборд конкурентів, отримано схвальний відгук від CMO.

## Повʼязані ліди та контакти
- Лід джерела: [[InsightEdge Consulting (lead)]].
- Ключові особи: [[Коваленко Марія – InsightEdge Consulting]].
- Внутрішня команда: [[Лисенко Андрій – Agency Sales]].

## Нотатки конкурентної розвідки
- InsightEdge просить налаштувати автоматичні сповіщення щодо запуску нових продуктів конкурентів у США.
- Важливі конкуренти для клієнта: [[Competitors/MarketPulse – SaaS]] (для відстеження кейсів залучення клієнтів).

## Додаткові ресурси
- Шерингова папка документів: [[Documents/InsightEdge/Contract 2024.md]], [[Documents/InsightEdge/Scope Outline.md]].
- Внутрішній гайдовий матеріал: [[Knowledge/Account Playbooks/InsightEdge.md]].
