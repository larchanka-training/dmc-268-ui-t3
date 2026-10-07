import type { AvailableRepositoryWire, RepositoryWire } from '../types'

/**
 * Repository fixtures for the mock adapter, kept apart from the documented
 * run state in app-state.mock.ts.
 *
 * - `connected` is what `GET /repositories` returns.
 * - `available` is what `GET /repositories/available` returns before any
 *   connection is made; its `repository_id` marks the connected ones.
 */
export interface MockRepositoryState {
  connected: RepositoryWire[]
  available: AvailableRepositoryWire[]
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
  ],
}
