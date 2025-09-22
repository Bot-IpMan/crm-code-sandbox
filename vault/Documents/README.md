# Папка `Documents/`

Сховище документів, вкладень і шаблонів. Може містити як Markdown-нотатки (наприклад, конспекти, шаблони), так і файли (PDF, PPTX, XLSX).

## Організація
- Створюйте підпапки за клієнтами (`Documents/Clients/@Acme Corp/`), типами документів (`Documents/Contracts/`, `Documents/Briefs/`) або за роками.
- Використовуйте однаковий формат імені файлів: `YYYY-MM-DD – Назва – Клієнт`.
- Для великих файлів зберігайте лише посилання (Google Drive, Dropbox) у Markdown-нотатці.

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
1. **Вказуйте джерело** — у полі `link` або у тілі нотатки.
2. **Версіонуйте** — додавайте `version`, `updated` і тег `#version/{номер}`.
3. **Звʼязуйте з нотатками** — клієнти, проєкти, задачі, leads.
4. **Архівуйте** — після завершення проєкту переміщуйте у підпапку `Archive/` або додавайте тег `#archived`.
5. **Шаблони** — у `Documents/Templates/` зберігайте типові форми (брифи, договори, презентації).

## Dataview-приклад
```dataview
table category, client, project, status, expires
from "Documents"
where type = "document"
sort expires asc
```

Наявність централізованого сховища забезпечує швидкий доступ до актуальних версій документів і зменшує ризик втрати важливих файлів.
