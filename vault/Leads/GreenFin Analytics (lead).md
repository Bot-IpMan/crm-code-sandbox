---
type: lead
name: "GreenFin Analytics"
status: proposal
stage: proposal
source: Webinar – Sustainable Finance Signals
potential_value: 28000
probability: 0.55
priority: medium
owner: [[Лисенко Андрій – Agency Sales]]
tags:
  - lead
  - pipeline/proposal
  - industry/fintech
created: 2024-04-20
last_contact: 2024-05-06
next_step_due: 2024-05-14
related_contacts:
  - [[Contacts/Орлов Денис – GreenFin Analytics]]
related_client:
related_competitors:
  - [[Competitors/MarketPulse – SaaS]]
---

# GreenFin Analytics (lead)

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
GreenFin Analytics — фінтех-платформа, яка надає ESG-аналітику для банків і фондів. Команда зацікавлена у відстеженні конкурентів та моніторингу регуляторних змін в ЄС.

## Контактна інформація
- Відповідальний менеджер:: [[Лисенко Андрій – Agency Sales]]
- Основний контакт:: [[Contacts/Орлов Денис – GreenFin Analytics]]
- Телефон:: [tel:+498944556677](tel:+498944556677)
- Email:: [denis.orlov@greenfin.io](mailto:denis.orlov@greenfin.io)
- LinkedIn:: https://www.linkedin.com/company/greenfin-analytics
- Zoom-кімната для наступного демо:: [https://zoom.us/j/6677889900?pwd=finproposal](https://zoom.us/j/6677889900?pwd=finproposal)

## Швидкі дії
- ✉️ [Email](mailto:denis.orlov@greenfin.io)
- ☎️ [Дзвінок](tel:+498944556677)
- 🎥 [Zoom-демо](https://zoom.us/j/6677889900?pwd=finproposal)
- 🔗 [LinkedIn](https://www.linkedin.com/company/greenfin-analytics)

## Кваліфікація
- Джерело ліда: ESG webinar (квітень 2024).
- Етап воронки: Proposal — відправлено комерційну пропозицію 2024-05-06.
- Потенційний бюджет/цінність: $28 000 на рік.
- Оцінка потенціалу (L/M/H): Medium.
- Конкуренти у процесі:: [[Competitors/InsightSphere – Analytics]].

## Потреби та пропозиція
- Потреби: оцінка конкурентів на ринку ESG-аналітики, моніторинг змін регулювання, трекінг патентів.
- Пропозиція: пакет Competitive Intelligence Core + модуль Regulatory Radar.
- Ключові аргументи: досвід роботи з фінансовими установами, автоматичні тригери новин.
- Ризики та заперечення: потреба інтеграції з їхньою BI-платформою Looker.

## Наступні кроки
- Поточна задача:: Створити tailored proof-of-value дашборд до 2024-05-13.
- Наступний запланований контакт:: 2024-05-14 — демо функціональності Regulatory Radar.
- Формат взаємодії: Zoom-зустріч + спільний перегляд дашборду.

## Активні задачі
```dataview
TABLE status, due, owner
FROM "Tasks"
WHERE contains(related_to, this.file.link) AND status != "done"
SORT due asc
```

## Лог взаємодій
- 2024-05-06 — Надіслано пропозицію і шаблон звіту, запланували демо (див. [[Daily Notes/2024-05-06#Журнал подій]]).
- 2024-04-29 — Провели discovery call, виявили запит на моніторинг регулювання.
- 2024-04-20 — Лід потрапив після реєстрації на вебінар.

## Повʼязані нотатки
- [[Contacts/Орлов Денис – GreenFin Analytics]]
- [[Competitors/InsightSphere – Analytics]]
