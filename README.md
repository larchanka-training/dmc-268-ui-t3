# DMC-268 UI (команда 3)

Frontend команды 3 на Vite, React и TypeScript.

## Установка и запуск

Requires Node 24 (`.nvmrc`) and pnpm 12 (`npm install -g pnpm@12.9.1`, or `corepack enable`).

```bash
pnpm install      # also installs the Husky git hooks
cp .env.example .env.local
pnpm dev
```

По умолчанию `VITE_AUTH_MODE=mock`: вход через GitHub работает на моковом бэкенде, и GitHub App не нужен. Регистрация GitHub App и переход в режим `github` описаны в [docs/github-app-setup.md](docs/github-app-setup.md). В `.env.local` попадают только публичные значения `VITE_*`. Client secret, приватный ключ и webhook secret хранятся только на бэкенде.

Правила, скиллы и шаблоны разработки команды: [.agents/README.md](.agents/README.md).

Архитектура фронтенда (слои FSD, управление состоянием, вход через GitHub и контракт auth-эндпоинтов бэкенда, UI-кит, компоненты диффа и мок состояния приложения): [FRONTEND_ARCHITECTURE.md](FRONTEND_ARCHITECTURE.md).

## Quality checks

| Command                             | What it does                                                                     |
| ----------------------------------- | -------------------------------------------------------------------------------- |
| `pnpm lint`                         | ESLint (typescript-eslint strict, type-aware) + Stylelint, zero warnings allowed |
| `pnpm lint:fix`                     | same, auto-fixing what it can                                                    |
| `pnpm check-types`                  | `tsc --noEmit` (strict)                                                          |
| `pnpm test`                         | Vitest: unit and component tests                                                 |
| `pnpm format` / `pnpm format:check` | Prettier                                                                         |
| `pnpm build`                        | type-check + production build into `dist/`                                       |

Git hooks (Husky): **pre-commit** runs lint-staged (ESLint/Stylelint `--fix` + Prettier on staged files) and blocks the commit on errors; **pre-push** runs `check-types` and `lint`.
