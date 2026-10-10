import type {
  AvailableRepositoryWire,
  RepositoryRulesWire,
  RepositoryWire,
  ReviewSettingsWire,
  RuleWire,
} from '../types'

/**
 * Repository fixtures for the mock adapter, kept apart from the documented
 * run state in app-state.mock.ts.
 *
 * - `connected` is what `GET /repositories` returns.
 * - `available` is what `GET /repositories/available` returns before any
 *   connection is made; its `repository_id` marks the connected ones.
 * - `settings` and `rules` are what `GET /repositories/{id}/settings` and
 *   `GET /repositories/{id}/rules` return, keyed by repository ID. Together the
 *   rules cover every rules file status: custom, missing and invalid.
 */
export interface MockRepositoryState {
  connected: RepositoryWire[]
  available: AvailableRepositoryWire[]
  settings: Record<string, ReviewSettingsWire>
  rules: Record<string, RepositoryRulesWire>
}

/** The reviewer's built-in rules, in effect when `.review/rules.md` is missing or invalid. */
export const MOCK_DEFAULT_RULES: RuleWire[] = [
  {
    rule_id: 'SEC-001',
    title: 'No hardcoded secrets',
    description: 'Credentials, tokens and private keys must not be committed in source code.',
    category: 'security',
    severity: 'critical',
    enabled: true,
  },
  {
    rule_id: 'SEC-002',
    title: 'No injection through untrusted input',
    description: 'User input must not reach SQL, shell commands or HTML without escaping.',
    category: 'security',
    severity: 'critical',
    enabled: true,
  },
  {
    rule_id: 'COR-001',
    title: 'Handle missing values',
    description: 'Values that can be null or undefined are checked before use.',
    category: 'correctness',
    severity: 'high',
    enabled: true,
  },
  {
    rule_id: 'PERF-001',
    title: 'Avoid N+1 queries',
    description: 'Do not query the database once per item inside a loop.',
    category: 'performance',
    severity: 'medium',
    enabled: true,
  },
  {
    rule_id: 'STY-001',
    title: 'Descriptive names',
    description: 'Names describe what a value holds or a function does.',
    category: 'readability',
    severity: 'low',
    enabled: true,
  },
]

/** Settings of a newly connected repository. */
export function defaultReviewSettings(updatedAt: string): ReviewSettingsWire {
  return {
    auto_review: true,
    branch_filter: [],
    severity_threshold: 'all',
    updated_at: updatedAt,
  }
}

/** Rules of a repository without `.review/rules.md`. */
export function missingRulesFile(branch: string): RepositoryRulesWire {
  return {
    status: 'missing',
    path: '.review/rules.md',
    branch,
    commit_sha: null,
    file_url: null,
    rules_version: 'default-2026-10-01',
    problems: [],
    rules: MOCK_DEFAULT_RULES,
  }
}

export const mockRepositoryState: MockRepositoryState = {
  connected: [
    {
      repository_id: 'repo-1',
      provider: 'github',
      external_id: '810000001',
      full_name: 'acme/web',
      url: 'https://github.com/acme/web',
      default_branch: 'main',
      private: false,
      connected_at: '2026-10-01T09:30:00Z',
    },
    {
      repository_id: 'repo-2',
      provider: 'github',
      external_id: '810000002',
      full_name: 'acme/billing-api',
      url: 'https://github.com/acme/billing-api',
      default_branch: 'develop',
      private: true,
      connected_at: '2026-10-03T14:05:00Z',
    },
    {
      repository_id: 'repo-3',
      provider: 'gitlab',
      external_id: '4200017',
      full_name: 'acme-group/platform/infra',
      url: 'https://gitlab.com/acme-group/platform/infra',
      default_branch: 'main',
      private: true,
      connected_at: '2026-10-05T08:00:00Z',
    },
    {
      repository_id: 'repo-4',
      provider: 'github',
      external_id: '810000007',
      full_name: 'larchanka-training/dmc-268-demo',
      url: 'https://github.com/larchanka-training/dmc-268-demo',
      default_branch: 'main',
      private: false,
      connected_at: '2026-10-06T16:45:00Z',
    },
  ],
  available: [
    {
      provider: 'github',
      external_id: '810000001',
      full_name: 'acme/web',
      url: 'https://github.com/acme/web',
      default_branch: 'main',
      private: false,
      repository_id: 'repo-1',
    },
    {
      provider: 'github',
      external_id: '810000002',
      full_name: 'acme/billing-api',
      url: 'https://github.com/acme/billing-api',
      default_branch: 'develop',
      private: true,
      repository_id: 'repo-2',
    },
    {
      provider: 'github',
      external_id: '810000003',
      full_name: 'acme/docs',
      url: 'https://github.com/acme/docs',
      default_branch: 'main',
      private: false,
      repository_id: null,
    },
    {
      provider: 'github',
      external_id: '810000004',
      full_name: 'acme/mobile-app',
      url: 'https://github.com/acme/mobile-app',
      default_branch: 'main',
      private: true,
      repository_id: null,
    },
    {
      provider: 'github',
      external_id: '810000005',
      full_name: 'acme/design-system',
      url: 'https://github.com/acme/design-system',
      default_branch: 'trunk',
      private: false,
      repository_id: null,
    },
    {
      provider: 'github',
      external_id: '810000006',
      full_name: 'octocat/dotfiles',
      url: 'https://github.com/octocat/dotfiles',
      default_branch: 'master',
      private: false,
      repository_id: null,
    },
    {
      provider: 'github',
      external_id: '810000007',
      full_name: 'larchanka-training/dmc-268-demo',
      url: 'https://github.com/larchanka-training/dmc-268-demo',
      default_branch: 'main',
      private: false,
      repository_id: 'repo-4',
    },
  ],
  settings: {
    'repo-1': {
      auto_review: true,
      branch_filter: ['main', 'release/*'],
      severity_threshold: 'warning_and_critical',
      updated_at: '2026-10-02T11:20:00Z',
    },
    'repo-2': defaultReviewSettings('2026-10-03T14:05:00Z'),
    'repo-3': {
      auto_review: false,
      branch_filter: [],
      severity_threshold: 'critical_only',
      updated_at: '2026-10-05T08:00:00Z',
    },
    'repo-4': defaultReviewSettings('2026-10-06T16:45:00Z'),
  },
  rules: {
    'repo-1': {
      status: 'custom',
      path: '.review/rules.md',
      branch: 'main',
      commit_sha: '3f2a9c1d8e7b6a5f4e3d2c1b0a9f8e7d6c5b4a39',
      file_url: 'https://github.com/acme/web/blob/main/.review/rules.md',
      rules_version: 'rules-2026-10-02',
      problems: [],
      rules: [
        {
          rule_id: 'SEC-001',
          title: 'No hardcoded secrets',
          description: 'API keys belong in the deployment environment, never in the bundle.',
          category: 'security',
          severity: 'critical',
          enabled: true,
        },
        {
          rule_id: 'A11Y-002',
          title: 'Interactive elements have accessible names',
          description: 'Buttons and links without text need an aria-label.',
          category: 'accessibility',
          severity: 'high',
          enabled: true,
        },
        {
          rule_id: 'STY-004',
          title: 'No default exports',
          description: 'Modules use named exports so imports stay greppable.',
          category: 'readability',
          severity: 'low',
          enabled: false,
        },
      ],
    },
    'repo-2': missingRulesFile('develop'),
    'repo-3': {
      status: 'invalid',
      path: '.review/rules.md',
      branch: 'main',
      commit_sha: '9b8a7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b',
      file_url: 'https://gitlab.com/acme-group/platform/infra/-/blob/main/.review/rules.md',
      rules_version: 'default-2026-10-01',
      problems: [
        { message: 'Unknown severity `urgent`', line: 12 },
        { message: 'Missing rule ID', line: null },
      ],
      rules: MOCK_DEFAULT_RULES,
    },
    'repo-4': {
      status: 'custom',
      path: '.review/rules.md',
      branch: 'main',
      commit_sha: '1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c',
      file_url: 'https://github.com/larchanka-training/dmc-268-demo/blob/main/.review/rules.md',
      rules_version: 'rules-2026-10-01',
      problems: [],
      rules: MOCK_DEFAULT_RULES.slice(0, 4),
    },
  },
}
