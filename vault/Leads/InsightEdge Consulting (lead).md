---
type: lead
name: "InsightEdge Consulting"
status: won
stage: won
source: Referral – [[Knowledge/Partners/Strategy Guild]]
potential_value: 42000
probability: 0.95
priority: high
owner: [[Лисенко Андрій – Agency Sales]]
tags:
  - lead
  - pipeline/won
  - industry/consulting
created: 2024-04-10
last_contact: 2024-05-06
next_step_due: 2024-05-13
related_client: [[@InsightEdge Consulting – Марія Коваленко]]
related_contacts:
  - [[Коваленко Марія – InsightEdge Consulting]]
deals:
  - [[Projects/Deal – InsightEdge Retainer]]
---

# InsightEdge Consulting (lead)

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
InsightEdge Consulting звернулися за повним супроводом конкурентної розвідки після рекомендації партнера Strategy Guild. Основна потреба — безперервний моніторинг конкурентів у сегменті професійних послуг та впровадження раннього попередження про ринкові зміни.

## Контактна інформація
- Відповідальний менеджер:: [[Лисенко Андрій – Agency Sales]]
- Основний контакт:: [[Коваленко Марія – InsightEdge Consulting]]
- Телефон:: [tel:+380442223344](tel:+380442223344)
- Email:: [maria.kovalenko@insightedge.com](mailto:maria.kovalenko@insightedge.com)
- LinkedIn:: https://www.linkedin.com/company/insightedge-consulting
- Zoom-кімната для демо:: [zoommtg://zoom.us/join?action=join&confno=4422110099&pwd=demo](zoommtg://zoom.us/join?action=join&confno=4422110099&pwd=demo)

## Швидкі дії
- ✉️ [Email](mailto:maria.kovalenko@insightedge.com)
- ☎️ [Дзвінок](tel:+380442223344)
- 🎥 [Zoom-демо](zoommtg://zoom.us/join?action=join&confno=4422110099&pwd=demo)
- 🔗 [LinkedIn](https://www.linkedin.com/company/insightedge-consulting)

## Кваліфікація
- Джерело ліда: Referral від партнера [[Knowledge/Partners/Strategy Guild]].
- Етап воронки: **Won** — контракт підписано 2024-05-06.
- Потенційний бюджет/цінність: $42 000 ARR.
- Оцінка потенціалу (L/M/H): High.
- Конкуренти у процесі:: [[Competitors/MarketPulse – SaaS]].

## Потреби та пропозиція
- Потреби: прозорий огляд конкурентів на ринку консалтингу, швидкий аналіз M&A угод, огляд вакансій конкурентів.
- Пропозиція: річний пакет Competitive Intelligence Premium + модуль автоматичних сповіщень.
- Ключові аргументи: експертиза агентства, можливість кастомізованих сигналів.
- Ризики та заперечення: необхідність інтеграції з внутрішнім порталом клієнта.

## Наступні кроки
- Поточна задача:: [[Tasks/Налагодити звіт для InsightEdge.md]]
- Наступний запланований контакт:: 2024-05-13 (strategic planning workshop).
- Формат взаємодії: Zoom-зустріч + follow-up лист із планом запуску.

## Активні задачі
```dataview
TABLE status, due, owner
FROM "Tasks"
WHERE contains(related_to, this.file.link) AND status != "done"
SORT due asc
```

## Лог взаємодій
- 2024-05-06 — Підписано контракт, підтверджено старт проєкту (див. [[Daily Notes/2024-05-06#Журнал подій]]).
- 2024-04-30 — Провели фінальну демо-сесію, узгодили KPI.
- 2024-04-18 — Первинний qualification call, визначили пріоритети аналізу конкурентів.

## Повʼязані нотатки
- [[Projects/Deal – InsightEdge Retainer]]
- [[@InsightEdge Consulting – Марія Коваленко]]
