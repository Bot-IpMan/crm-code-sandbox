---
type: lead
name: "UrbanX Mobility"
status: negotiation
stage: negotiation
source: Conference – FutureCities Expo
potential_value: 36000
probability: 0.65
priority: high
owner: [[Лисенко Андрій – Agency Sales]]
tags:
  - lead
  - pipeline/negotiation
  - industry/mobility
created: 2024-03-25
last_contact: 2024-05-03
next_step_due: 2024-05-09
related_contacts:
  - [[Contacts/Гончар Оксана – UrbanX Mobility]]
related_competitors:
  - [[Competitors/MarketPulse – SaaS]]
deals:
  - [[Projects/UrbanX Competitive Program]]
---

# UrbanX Mobility (lead)

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
UrbanX Mobility — розробник MaaS-рішень для міських операторів транспорту. Компанія шукає партнера для регулярного моніторингу конкурентів, тендерів та інновацій у сфері міської мобільності.

## Контактна інформація
- Відповідальний менеджер:: [[Лисенко Андрій – Agency Sales]]
- Основний контакт:: [[Contacts/Гончар Оксана – UrbanX Mobility]]
- Телефон:: [tel:+442071234567](tel:+442071234567)
- Email:: [oksana.honchar@urbanxmobility.com](mailto:oksana.honchar@urbanxmobility.com)
- LinkedIn:: https://www.linkedin.com/company/urbanx-mobility
- Zoom для переговорів:: [zoommtg://zoom.us/j/3344556677?pwd=urbanx](zoommtg://zoom.us/j/3344556677?pwd=urbanx)

## Швидкі дії
- ✉️ [Email](mailto:oksana.honchar@urbanxmobility.com)
- ☎️ [Дзвінок](tel:+442071234567)
- 🎥 [Zoom-переговори](zoommtg://zoom.us/j/3344556677?pwd=urbanx)
- 🔗 [LinkedIn](https://www.linkedin.com/company/urbanx-mobility)

## Кваліфікація
- Джерело ліда: стенд на FutureCities Expo (Берлін, березень 2024).
- Етап воронки: Negotiation — узгоджуємо комерційні умови та обсяг послуг.
- Потенційний бюджет/цінність: $36 000 на рік.
- Оцінка потенціалу (L/M/H): High.
- Конкуренти у процесі:: [[Competitors/MarketPulse – SaaS]].

## Потреби та пропозиція
- Потреби: моніторинг тендерів Smart Mobility, трекінг продуктового роадмепу конкурентів, огляд регуляторних пілотів.
- Пропозиція: пакет Competitive Intelligence Premium + Scout Program з польовими інтервʼю.
- Ключові аргументи: експертиза у міській мобільності, кейси зі схожих міст.
- Ризики та заперечення: бюджет Q2 ще не затверджений, потреба адаптувати формат звітності.

## Наступні кроки
- Поточна задача:: Підготувати оновлену фінансову модель ROI до 2024-05-08.
- Наступний запланований контакт:: 2024-05-09 — фінальна сесія переговорів.
- Формат взаємодії: Zoom-переговори + юридичний review документів.

## Активні задачі
```dataview
TABLE status, due, owner
FROM "Tasks"
WHERE contains(related_to, this.file.link) AND status != "done"
SORT due asc
```

## Лог взаємодій
- 2024-05-03 — Надіслали оновлену пропозицію з деталями Scout Program, погодили фінальний call.
- 2024-04-18 — Провели воркшоп щодо цілей конкурентної розвідки (див. [[Daily Notes/2024-05-06#План дня]]).
- 2024-04-01 — Первинний дзвінок після конференції, підтвердили бюджетний діапазон.

## Повʼязані нотатки
- [[Contacts/Гончар Оксана – UrbanX Mobility]]
- [[Projects/UrbanX Competitive Program]]
