# Папка `Knowledge/`

Внутрішня база знань: методології, стандарти, дослідження ринку, FAQ. Допомагає масштабувати експертизу й швидко онбордити нових членів команди.

## Формат імені
`Тема` або `Playbook – Напрям` (наприклад, `Playbook – Конкурентна розвідка`).

## Рекомендовані метадані
```yaml
---
type: knowledge
topic: Конкурентна розвідка
subcategory: методологія
owner: [[Керівник R&D]]
updated: 2024-05-01
review_cycle: quarterly
related_markets:
  - SaaS
  - Fintech
related_competitors:
  - [[Rival Analytics – SaaS Monitoring]]
related_clients:
  - [[@Acme Corp – Іван Іваненко]]
tags:
  - knowledge
  - playbook
  - research
---
```

## Структура нотатки
1. **Резюме** — коротке пояснення цінності матеріалу.
2. **Деталі** — покрокові інструкції, чеклисти, best practices.
3. **Інструменти** — посилання на шаблони, макроси, автоматизації.
4. **Кейси** — приклади застосування, lessons learned.
5. **Показники ефективності** — як вимірювати результати.
6. **Оновлення** — журнал змін.

## Теги та звʼязки
- Теги: `#knowledge`, `#playbook`, `#research`, `#process/{назва}`.
- Лінкуйте до `Projects/` (де використовується методологія), `Competitors/`, `Documents/Templates/`, `Daily Notes/` (навчальні сесії).

## Dataview-приклад
```dataview
table subcategory, owner, updated, review_cycle
from "Knowledge"
where type = "knowledge"
sort updated desc
```

Підтримуйте регулярний цикл ревʼю, додавайте теги для пошуку та вказуйте власників контенту, щоб матеріали залишалися актуальними.
