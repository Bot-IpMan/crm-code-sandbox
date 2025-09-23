# Папка `Documents/`

Сховище документів, вкладень і шаблонів. Може містити як Markdown-нотатки (конспекти, шаблони), так і файли (PDF, PPTX, XLSX). Використовуйте цю папку як єдине джерело правди для контрактів, scope-документів, брифів та презентацій.

## Організація
- Створюйте підпапки за клієнтами (`Documents/Clients/@Acme Corp/`), типами документів (`Documents/Contracts/`, `Documents/Briefs/`) або за роками.
- Використовуйте однаковий формат імені файлів: `YYYY-MM-DD – Назва – Клієнт`.
- Для великих файлів зберігайте лише посилання (Google Drive, Dropbox) у Markdown-нотатці.
- Фіксуйте версію у полі `version` та дублюйте дату у назві файлу для швидкої навігації.

### Приклад структури
```
Documents/
├── Clients/
│   └── InsightEdge Consulting/
│       ├── Contracts/
│       │   └── 2024-05-06 – InsightEdge – Annual Service Agreement.md
│       └── Scopes/
│           └── 2024-05-05 – InsightEdge – Competitive Intelligence Scope.md
├── Templates/
└── README.md
```

## Лінкування в нотатках
- Посилайтесь на файли через `[[Documents/Clients/InsightEdge Consulting/Contracts/...]]` або скорочені псевдоніми.
- Для важливих розділів використовуйте вбудовані прев’ю: `![[Documents/...#Розділ]]`.
- Додавайте блок "Повʼязані документи" у нотатках клієнтів, проєктів і задач.

## Приклад метаданих для супровідної нотатки
```yaml
---
type: document
category: contract
client: [[@Acme Corp – Іван Іваненко]]
project: [[SEO Sprint – @Acme Corp]]
author: [[Юрист]]
status: signed # draft / in-review / signed / archived
link: https://drive.google.com/...
expires: 2025-05-01
version: v1.2
confidentiality: nda
---
```

## Рекомендації
1. **Вказуйте джерело** — у полі `file_link`/`link` або у тілі нотатки.
2. **Версіонуйте** — додавайте `version`, `updated` і тег `#version/{номер}`.
3. **Звʼязуйте з нотатками** — клієнти, проєкти, задачі, leads.
4. **Архівуйте** — після завершення проєкту переміщуйте у підпапку `Archive/` або додавайте тег `#archived`.
5. **Шаблони** — у `Documents/Templates/` зберігайте типові форми (брифи, договори, презентації).

## Dataview-приклад
```dataview
table category, client, project, status, version, updated
from "Documents"
where type = "document"
sort updated desc
```

Наявність централізованого сховища забезпечує швидкий доступ до актуальних версій документів і зменшує ризик втрати важливих файлів.
