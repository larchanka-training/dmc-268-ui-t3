# AI-скиллы и стандарты frontend-разработки

`.agents` задаёт порядок реализации, тестирования и ревью React/TypeScript-кода. Пакет учитывает [System Design v1, a9277b9](https://github.com/larchanka-training/dmc-268-api-t3/blob/a9277b9da2b6b066dbe889a6d5fdd1b9436cf74f/SYSTEM_DESIGN.md). Его статус Draft и открытые решения отражены в [контексте проекта](rules/project-context.md).

## Применение

| Задача | Материал |
| --- | --- |
| Реализация интерфейса | [reviewer-frontend](skills/reviewer-frontend/SKILL.md) |
| Проверка поведения | [reviewer-frontend-tests](skills/reviewer-frontend-tests/SKILL.md) |
| Ревью diff | [reviewer-diff-review](skills/reviewer-diff-review/SKILL.md) |
| Правила и порядок работы | [frontend.md](rules/frontend.md), [workflows.md](workflows.md) |
| Локальные шаблоны | [реализация](templates/implement.md), [тест-план](templates/test-plan.md), [PR](templates/pull-request.md) |

Выберите скилл в редакторе с поддержкой project skills или приложите SKILL.md и связанные материалы вручную. Передайте задачу, API-контракт и критерии приёмки. Для прямого вызова модели есть системные промпты [кодирования](prompts/coding-system.md) и [тестирования](prompts/testing-system.md).

Принятый стек: React, TypeScript, Node.js, pnpm, ESLint, Zod, Zustand и Vitest; Skylos применяется в настроенной командой области. Скиллы требуют валидации DTO, доступности, безопасного отображения данных и защиты от устаревших ответов.

## Состояния и история

Отдельно отображаются жизненный цикл запуска, полнота анализа и состояние публикации. Завершённое ревью остаётся доступным при ошибке отправки summary. Идентичность и lifecycle findings, связи истории и baseline определяет backend; отсутствие finding в частичном отчёте не означает FIXED.

[Шаблон загрузчика](templates/report-loader.ts.example) и [его тесты](templates/report-loader.test.ts.example) демонстрируют эти различия и порядок асинхронных ответов. `RunView` — локальный пример, а не утверждённый API-контракт: перед использованием замените схему и адаптер на контракт владельца API. Инструкция запуска находится в [workflows.md](workflows.md).

## Общий контракт AI-ревью

Локально доступны [review-system](prompts/review-system.md), [входной шаблон](prompts/review-user.md), [каталог сигнатур](prompts/signatures.md), [схема кандидатов](schemas/review.schema.json) и [схема контекста](schemas/review-context.schema.json). Используются rule_id, неизменяемый RuleSet, SHA и проверенные связи с изменёнными строками.

**Версия 2.0.0 несовместима с 1.0.0.** [Описание контракта](rules/review-contract.md) объясняет миграцию и различие кандидата модели, Finding и DTO API. JSON Schema не заменяет проверку правил, контекста и точных дубликатов; в backend-пакете есть эталонный валидатор и режим фильтрации.

Пять общих промптов, обе схемы и правила project-context/review-contract синхронизируются с backend. Markdown пишется на английском, кроме README.md на русском. Корневой AGENTS.md ведёт техлид; конфигурацией приложения, инфраструктурой и CI/CD занимаются владельцы соответствующих задач.
