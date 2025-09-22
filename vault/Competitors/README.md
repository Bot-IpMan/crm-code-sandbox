# Папка `Competitors/`

Використовуйте для профілів конкурентів, відстеження їхніх активностей та фіксації інсайтів конкурентної розвідки.

## Формат імені
`Конкурент – Ринок/Продукт` (наприклад, `Rival Analytics – SaaS Monitoring`).

## Рекомендовані метадані
```yaml
---
type: competitor
industry: SaaS Monitoring
region: EU
size: enterprise
positioning: premium
primary_offerings:
  - Benchmarking platform
  - Market intelligence
pricing_model: subscription
tracking_since: 2023-11-01
tier: tier-1 # tier-1 / tier-2 / tier-3
last_update: 2024-05-04
alert_channels:
  - RSS
  - LinkedIn
owner: [[Аналітик]]
tags:
  - competitor
  - intel
  - industry/saas
---
```

## Структура нотатки
1. **Огляд** — позиціонування, продуктові лінійки, ключові ринки.
2. **Сильні та слабкі сторони** — SWOT або скорочений аналіз.
3. **Докази та інсайти** — датовані спостереження із джерелами (лінки, файли, скріншоти).
4. **Порівняння з нашою пропозицією** — конкурентні переваги та прогалини.
5. **Активні угоди** — де конкурент змагається за того самого клієнта (лінки на `Leads/` або `Clients/`).
6. **Публічні дії** — новини, вакансії, оновлення продукту.

## Теги та звʼязки
- Основні теги: `#competitor`, `#intel`, `#industry/{сегмент}`.
- Додаткові: `#threat/high`, `#watchlist`, `#benchmark`.
- Лінкуйте з:
  - `Clients/` або `Leads/`, де конкурент зустрічається у тендері;
  - `Knowledge/` — аналітичні довідки та методології;
  - `Daily Notes/` — оперативні згадки чи сигнали.

## Dataview-приклад
```dataview
table industry, tier, last_update, owner
from "Competitors"
where type = "competitor"
sort tier asc, last_update desc
```

Регулярно оновлюйте поле `last_update` та додавайте нові спостереження, щоб команді було легко відслідковувати активність конкурентів.
