import type { FindingWire, ReviewRunWire } from '../types'

/**
 * Mock application state for one review run. It is the single source of the
 * fixtures used by the mock API adapter, and it is embedded verbatim in
 * FRONTEND_ARCHITECTURE.md (a test keeps both in sync).
 *
 * - `server` is what the backend would return (wire format, snake_case).
 *   It lives in the TanStack Query cache after validation.
 * - `client` is the initial shared UI state held in Zustand stores.
 */
export interface MockAppState {
  server: {
    run: ReviewRunWire
    /** Unified diff text between base_sha and head_sha. */
    diffText: string
    findings: FindingWire[]
    /** Head-side file contents by path; null when the backend could not provide them. */
    fileContents: Record<string, string | null>
  }
  client: {
    diffView: {
      mode: 'unified' | 'split'
      /** Explicit per-file collapse choices; files not listed use the default. */
      fileCollapse: Record<string, boolean>
      /** Revealed context lines per gap, keyed by `${runId}:${path}:${gapIndex}`. */
      expandedGaps: Record<string, { top: number; bottom: number }>
    }
    findingNav: {
      selectedFindingId: string | null
    }
  }
}

export const RUN_ID = 'run-2026-10-07-001'

const diffText =
  [
    'diff --git a/assets/logo.png b/assets/logo.png',
    'index c866266..5663091 100644',
    'Binary files a/assets/logo.png and b/assets/logo.png differ',
    'diff --git a/config/settings.py b/config/settings.py',
    'index 374755c..9c7bd41 100644',
    '--- a/config/settings.py',
    '+++ b/config/settings.py',
    "@@ -32,7 +32,7 @@ OPTION_28 = os.environ.get('OPTION_28', '28')",
    " OPTION_29 = os.environ.get('OPTION_29', '29')",
    " OPTION_30 = os.environ.get('OPTION_30', '30')",
    ' ',
    '-DEBUG = False',
    "-ALLOWED_HOSTS = ['example.com']",
    '+DEBUG = True',
    "+ALLOWED_HOSTS = ['*']",
    ' ',
    '-SESSION_TTL = 3600',
    "+SESSION_TTL = int(os.environ.get('SESSION_TTL', '3600'))",
    'diff --git a/src/api/search-endpoint.ts b/src/api/search-endpoint.ts',
    'new file mode 100644',
    'index 0000000..b938dfe',
    '--- /dev/null',
    '+++ b/src/api/search-endpoint.ts',
    '@@ -0,0 +1,8 @@',
    "+import { searchUsers } from '../services/user-service'",
    "+import type { Request, Response } from '../http'",
    '+',
    '+export async function handleSearch(req: Request, res: Response): Promise<void> {',
    "+  const term = String(req.query.q ?? '')",
    '+  const users = await searchUsers(term)',
    "+  res.send(`<h1>Results for ${term}</h1>` + users.map((u) => u.name).join('<br>'))",
    '+}',
    'diff --git a/src/legacy/old-helper.js b/src/legacy/old-helper.js',
    'deleted file mode 100644',
    'index b0408b0..0000000',
    '--- a/src/legacy/old-helper.js',
    '+++ /dev/null',
    '@@ -1,4 +0,0 @@',
    '-// Deprecated: use formatCount from utils/formatting instead.',
    '-export function pad(value) {',
    "-  return String(value).padStart(2, '0')",
    '-}',
    'diff --git a/src/services/user-service.ts b/src/services/user-service.ts',
    'index 8a3a767..6c10b7f 100644',
    '--- a/src/services/user-service.ts',
    '+++ b/src/services/user-service.ts',
    '@@ -17,9 +17,6 @@ function clampPageSize(size: number | undefined): number {',
    ' }',
    ' ',
    ' export async function getUser(id: string): Promise<User | null> {',
    '-  if (!id) {',
    '-    return null',
    '-  }',
    "   const rows = await db.query('SELECT * FROM users WHERE id = $1', [id])",
    '   return rows[0] ?? null',
    ' }',
    '@@ -44,6 +41,11 @@ export async function countActiveUsers(): Promise<number> {',
    '   return Number(rows[0]?.total ?? 0)',
    ' }',
    ' ',
    '+export async function searchUsers(term: string): Promise<User[]> {',
    '+  // Matches users by name or email.',
    "+  return db.query(`SELECT * FROM users WHERE name LIKE '%${term}%' OR email LIKE '%${term}%'`)",
    '+}',
    '+',
    ' export async function touchLastSeen(id: string): Promise<void> {',
    "   await db.query('UPDATE users SET last_seen_at = now() WHERE id = $1', [id])",
    ' }',
    'diff --git a/src/utils/format.ts b/src/utils/formatting.ts',
    'similarity index 47%',
    'rename from src/utils/format.ts',
    'rename to src/utils/formatting.ts',
    'index c8f9983..edf89d7 100644',
    '--- a/src/utils/format.ts',
    '+++ b/src/utils/formatting.ts',
    '@@ -2,6 +2,6 @@ export function formatDate(value: Date): string {',
    '   return value.toISOString().slice(0, 10)',
    ' }',
    ' ',
    '-export function formatCount(value: number): string {',
    "-  return value.toLocaleString('en-US')",
    "+export function formatCount(value: number, locale = 'en-US'): string {",
    '+  return value.toLocaleString(locale)',
    ' }',
  ].join('\n') + '\n'

export const mockAppState: MockAppState = {
  server: {
    run: {
      run_id: RUN_ID,
      title: 'Add user search endpoint',
      repository: 'larchanka-training/dmc-268-demo',
      pull_request: 42,
      status: 'COMPLETED',
      coverage: {
        status: 'partial',
        limitations: [
          'assets/logo.png is a binary file and was not reviewed.',
          'config/settings.py: full file content was unavailable; only the diff hunks were analyzed.',
        ],
      },
      publication: { status: 'published' },
      base_sha: '8a3a7671c2f04b4a9a7e3f1d2b5c6e7f8a9b0c1d',
      head_sha: '6c10b7f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4',
      rules_version: 'rules-2026-10-01',
      created_at: '2026-10-07T09:12:00Z',
      author: { login: 'octocat', avatar_url: 'https://avatars.githubusercontent.com/u/583231' },
      base_branch: 'main',
      head_branch: 'feature/user-search',
      pull_request_url: 'https://github.com/larchanka-training/dmc-268-demo/pull/42',
    },
    diffText,
    findings: [
      {
        finding_id: 'f-sql-injection',
        rule_id: 'SEC-SQL-001',
        title: 'User input is interpolated into a SQL query',
        severity: 'critical',
        anchor: { path: 'src/services/user-service.ts', side: 'RIGHT', line: 46 },
        related_changed_lines: [{ path: 'src/services/user-service.ts', side: 'RIGHT', line: 46 }],
        evidence: "searchUsers builds the query with a template literal: name LIKE '%${term}%'.",
        impact:
          'A crafted search term can read or modify any table the service account can access.',
        recommendation:
          "Use a parameterized query: db.query('... WHERE name LIKE $1 OR email LIKE $1', [`%${term}%`]).",
        confidence: 0.94,
        status: 'open',
        replies: [],
      },
      {
        finding_id: 'f-null-check',
        rule_id: 'COR-NULL-003',
        title: 'Empty id guard was removed from getUser',
        severity: 'high',
        anchor: { path: 'src/services/user-service.ts', side: 'LEFT', line: 20 },
        related_changed_lines: [
          { path: 'src/services/user-service.ts', side: 'LEFT', line: 20 },
          { path: 'src/services/user-service.ts', side: 'LEFT', line: 21 },
          { path: 'src/services/user-service.ts', side: 'LEFT', line: 22 },
        ],
        evidence:
          'The early return for a falsy id is deleted; getUser now queries with an empty id.',
        impact:
          'Callers that relied on a null result now trigger a database round-trip and may get unexpected rows.',
        recommendation:
          'Keep the guard or validate the id at the API boundary before calling getUser.',
        confidence: 0.81,
        status: 'open',
        replies: [],
      },
      {
        finding_id: 'f-deactivate-validation',
        rule_id: 'COR-INPUT-002',
        title: 'deactivateUser accepts an empty id as well',
        severity: 'medium',
        anchor: { path: 'src/services/user-service.ts', side: 'RIGHT', line: 35 },
        related_changed_lines: [{ path: 'src/services/user-service.ts', side: 'LEFT', line: 20 }],
        evidence:
          'With the getUser guard removed, no function in this module validates the id parameter.',
        impact: 'An empty id produces a no-op UPDATE that is logged as a successful deactivation.',
        recommendation:
          'Validate ids once in a shared helper and use it in every exported function.',
        confidence: 0.62,
        status: 'open',
        replies: [],
      },
      {
        finding_id: 'f-reflected-xss',
        rule_id: 'SEC-XSS-002',
        title: 'Search term is reflected into HTML without escaping',
        severity: 'high',
        anchor: { path: 'src/api/search-endpoint.ts', side: 'RIGHT', line: 7 },
        related_changed_lines: [{ path: 'src/api/search-endpoint.ts', side: 'RIGHT', line: 7 }],
        evidence:
          'A request with q=<img src=x onerror=alert(1)> is written into the response body as-is.',
        impact: "Attackers can run script in the victim's browser through a crafted link.",
        recommendation: 'Return JSON, or escape term and user names before building HTML.',
        confidence: 0.9,
        status: 'open',
        replies: [],
        suggested_change: {
          start_line: 7,
          end_line: 7,
          replacement: '  res.json({ term, users: users.map((u) => u.name) })',
        },
      },
      {
        finding_id: 'f-debug-enabled',
        rule_id: 'SEC-CONF-001',
        title: 'DEBUG is enabled in shared settings',
        severity: 'high',
        anchor: { path: 'config/settings.py', side: 'RIGHT', line: 35 },
        related_changed_lines: [{ path: 'config/settings.py', side: 'RIGHT', line: 35 }],
        evidence: 'DEBUG = True is set unconditionally in config/settings.py.',
        impact: 'Debug pages can expose stack traces and settings in production.',
        recommendation: 'Read DEBUG from the environment and default it to False.',
        confidence: 0.88,
        status: 'open',
        replies: [],
        suggested_change: {
          start_line: 35,
          end_line: 35,
          replacement: "DEBUG = os.environ.get('DEBUG', 'False') == 'True'",
        },
      },
      {
        finding_id: 'f-wildcard-hosts',
        rule_id: 'SEC-CONF-004',
        title: 'ALLOWED_HOSTS accepts any host',
        severity: 'medium',
        anchor: { path: 'config/settings.py', side: 'RIGHT', line: 36 },
        related_changed_lines: [{ path: 'config/settings.py', side: 'RIGHT', line: 36 }],
        evidence: "ALLOWED_HOSTS = ['*'] replaces the explicit host list.",
        impact: 'Host header attacks become possible (password reset poisoning, cache poisoning).',
        recommendation: 'Keep an explicit host list per environment.',
        confidence: 0.7,
        status: 'resolved',
        replies: [
          {
            reply_id: 'r-1',
            author: 'anna.dev',
            body: 'This settings file is only used by the local docker-compose setup.',
            created_at: '2026-10-07T09:30:00Z',
          },
          {
            reply_id: 'r-2',
            author: 'anna.dev',
            body: 'Resolving; production hosts come from the deployment config.',
            created_at: '2026-10-07T09:31:00Z',
          },
        ],
        suggested_change: {
          start_line: 36,
          end_line: 36,
          replacement: "ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'example.com').split(',')",
        },
      },
      {
        finding_id: 'f-locale-default',
        rule_id: 'MNT-DUP-001',
        title: 'Locale default duplicates the app-wide locale setting',
        severity: 'low',
        anchor: { path: 'src/utils/formatting.ts', side: 'RIGHT', line: 42 },
        related_changed_lines: [{ path: 'src/utils/formatting.ts', side: 'RIGHT', line: 5 }],
        evidence: "formatCount hard-codes 'en-US' as its default locale.",
        impact: 'Changing the app locale will not affect number formatting.',
        recommendation: 'Read the default from the shared locale config.',
        confidence: 0.41,
        status: 'open',
        replies: [],
      },
    ],
    fileContents: {
      'src/services/user-service.ts':
        [
          "import { db } from '../db'",
          "import { logger } from '../logger'",
          "import type { User, UserFilter } from '../types'",
          '',
          'const DEFAULT_PAGE_SIZE = 20',
          'const MAX_PAGE_SIZE = 100',
          '',
          '/**',
          ' * Normalizes a page size coming from the query string.',
          ' * Falls back to the default when the value is missing or invalid.',
          ' */',
          'function clampPageSize(size: number | undefined): number {',
          '  if (size === undefined || Number.isNaN(size)) {',
          '    return DEFAULT_PAGE_SIZE',
          '  }',
          '  return Math.min(Math.max(size, 1), MAX_PAGE_SIZE)',
          '}',
          '',
          'export async function getUser(id: string): Promise<User | null> {',
          "  const rows = await db.query('SELECT * FROM users WHERE id = $1', [id])",
          '  return rows[0] ?? null',
          '}',
          '',
          'export async function listUsers(filter: UserFilter): Promise<User[]> {',
          '  const pageSize = clampPageSize(filter.pageSize)',
          '  const offset = (filter.page ?? 0) * pageSize',
          "  logger.debug('listing users', { pageSize, offset })",
          "  return db.query('SELECT * FROM users ORDER BY created_at LIMIT $1 OFFSET $2', [",
          '    pageSize,',
          '    offset,',
          '  ])',
          '}',
          '',
          'export async function deactivateUser(id: string): Promise<void> {',
          "  await db.query('UPDATE users SET active = false WHERE id = $1', [id])",
          "  logger.info('user deactivated', { id })",
          '}',
          '',
          'export async function countActiveUsers(): Promise<number> {',
          "  const rows = await db.query('SELECT count(*) AS total FROM users WHERE active = true')",
          '  return Number(rows[0]?.total ?? 0)',
          '}',
          '',
          'export async function searchUsers(term: string): Promise<User[]> {',
          '  // Matches users by name or email.',
          "  return db.query(`SELECT * FROM users WHERE name LIKE '%${term}%' OR email LIKE '%${term}%'`)",
          '}',
          '',
          'export async function touchLastSeen(id: string): Promise<void> {',
          "  await db.query('UPDATE users SET last_seen_at = now() WHERE id = $1', [id])",
          '}',
          '',
          'export async function deleteUser(id: string): Promise<void> {',
          "  await db.query('DELETE FROM users WHERE id = $1', [id])",
          "  logger.warn('user deleted', { id })",
          '}',
        ].join('\n') + '\n',
      'src/utils/formatting.ts':
        [
          'export function formatDate(value: Date): string {',
          '  return value.toISOString().slice(0, 10)',
          '}',
          '',
          "export function formatCount(value: number, locale = 'en-US'): string {",
          '  return value.toLocaleString(locale)',
          '}',
        ].join('\n') + '\n',
      'src/api/search-endpoint.ts':
        [
          "import { searchUsers } from '../services/user-service'",
          "import type { Request, Response } from '../http'",
          '',
          'export async function handleSearch(req: Request, res: Response): Promise<void> {',
          "  const term = String(req.query.q ?? '')",
          '  const users = await searchUsers(term)',
          "  res.send(`<h1>Results for ${term}</h1>` + users.map((u) => u.name).join('<br>'))",
          '}',
        ].join('\n') + '\n',
      'config/settings.py': null,
    },
  },
  client: {
    diffView: {
      mode: 'unified',
      fileCollapse: {},
      expandedGaps: {},
    },
    findingNav: {
      selectedFindingId: null,
    },
  },
}
