import { ApiError, type ReviewApi, type ReviewApiMethod } from '../review-api'
import type { FindingWire, ReplyWire, RepositoryWire, ReviewSettingsWire } from '../types'
import { mockAppState, type MockAppState } from './app-state.mock'
import {
  defaultReviewSettings,
  missingRulesFile,
  mockRepositoryState,
  type MockRepositoryState,
} from './repositories.mock'

type MockServerState = MockAppState['server']

export interface MockReviewApiOptions {
  /** Initial server state; defaults to a copy of mockAppState.server. */
  state?: MockServerState
  /** Initial repositories; defaults to a copy of mockRepositoryState. */
  repositories?: MockRepositoryState
  /** Artificial latency per call, in milliseconds. */
  delayMs?: number
  /** Methods that reject with a 500 error until switched off. */
  failures?: Iterable<ReviewApiMethod>
  /** Author name recorded on replies. */
  author?: string
  now?: () => Date
}

export interface MockReviewApi extends ReviewApi {
  setFailure(method: ReviewApiMethod, failing: boolean): void
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const abortError = () => new DOMException('The request was aborted.', 'AbortError')
    if (signal?.aborted) {
      reject(abortError())
      return
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    function onAbort() {
      clearTimeout(timer)
      reject(abortError())
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

/** In-memory ReviewApi backed by the mock application state. */
export function createMockReviewApi(options: MockReviewApiOptions = {}): MockReviewApi {
  const state = clone(options.state ?? mockAppState.server)
  const repositories = clone(options.repositories ?? mockRepositoryState)
  const failing = new Set<ReviewApiMethod>(options.failures)
  const delayMs = options.delayMs ?? 0
  const author = options.author ?? 'you'
  const now = options.now ?? (() => new Date())
  let replyCounter = 0
  let repositoryCounter = 0

  async function respond<T>(
    method: ReviewApiMethod,
    signal: AbortSignal | undefined,
    produce: () => T,
  ) {
    await wait(delayMs, signal)
    if (failing.has(method)) {
      throw new ApiError(`Mock failure for ${method}`, 500)
    }
    return clone(produce())
  }

  function requireRun(runId: string) {
    if (runId !== state.run.run_id) {
      throw new ApiError(`Review run ${runId} not found`, 404)
    }
  }

  function requireFinding(runId: string, findingId: string): FindingWire {
    requireRun(runId)
    const finding = state.findings.find((item) => item.finding_id === findingId)
    if (!finding) {
      throw new ApiError(`Finding ${findingId} not found`, 404)
    }
    return finding
  }

  function requireRepository(repositoryId: string): RepositoryWire {
    const repository = repositories.connected.find((item) => item.repository_id === repositoryId)
    if (!repository) {
      throw new ApiError(`Repository ${repositoryId} not found`, 404)
    }
    return repository
  }

  /** Every connected repository has settings and rules; a fixture gap falls back to the defaults. */
  function settingsOf(repository: RepositoryWire) {
    return (repositories.settings[repository.repository_id] ??= defaultReviewSettings(
      repository.connected_at,
    ))
  }

  return {
    setFailure(method, isFailing) {
      if (isFailing) failing.add(method)
      else failing.delete(method)
    },
    // The mock state holds one run; the list is derived from it so the state shape stays as documented.
    listRuns: (signal) => respond('listRuns', signal, () => [state.run]),
    getRun: (runId, signal) =>
      respond('getRun', signal, () => {
        requireRun(runId)
        return state.run
      }),
    getDiff: (runId, signal) =>
      respond('getDiff', signal, () => {
        requireRun(runId)
        return state.diffText
      }),
    getFindings: (runId, signal) =>
      respond('getFindings', signal, () => {
        requireRun(runId)
        return state.findings
      }),
    getFileContent: ({ runId, path }, signal) =>
      respond('getFileContent', signal, () => {
        requireRun(runId)
        return state.fileContents[path] ?? null
      }),
    replyToFinding: ({ runId, findingId, body }, signal) =>
      respond('replyToFinding', signal, () => {
        const finding = requireFinding(runId, findingId)
        replyCounter += 1
        const reply: ReplyWire = {
          reply_id: `mock-reply-${String(replyCounter)}`,
          author,
          body,
          created_at: now().toISOString(),
        }
        finding.replies.push(reply)
        return reply
      }),
    setFindingStatus: ({ runId, findingId, status }, signal) =>
      respond('setFindingStatus', signal, () => {
        const finding = requireFinding(runId, findingId)
        finding.status = status
        return finding
      }),
    listRepositories: (signal) => respond('listRepositories', signal, () => repositories.connected),
    listAvailableRepositories: (signal) =>
      respond('listAvailableRepositories', signal, () => repositories.available),
    connectRepository: ({ provider, externalId }, signal) =>
      respond('connectRepository', signal, () => {
        const available = repositories.available.find(
          (item) => item.provider === provider && item.external_id === externalId,
        )
        if (!available) {
          throw new ApiError(`Repository ${provider}:${externalId} not found`, 404)
        }
        if (available.repository_id !== null) {
          throw new ApiError(`Repository ${available.full_name} is already connected`, 409)
        }
        repositoryCounter += 1
        const repository: RepositoryWire = {
          repository_id: `mock-repo-${String(repositoryCounter)}`,
          provider: available.provider,
          external_id: available.external_id,
          full_name: available.full_name,
          url: available.url,
          default_branch: available.default_branch,
          private: available.private,
          connected_at: now().toISOString(),
        }
        available.repository_id = repository.repository_id
        repositories.connected.push(repository)
        repositories.settings[repository.repository_id] = defaultReviewSettings(
          repository.connected_at,
        )
        repositories.rules[repository.repository_id] = missingRulesFile(repository.default_branch)
        return repository
      }),
    getRepository: (repositoryId, signal) =>
      respond('getRepository', signal, () => requireRepository(repositoryId)),
    getReviewSettings: (repositoryId, signal) =>
      respond('getReviewSettings', signal, () => settingsOf(requireRepository(repositoryId))),
    updateReviewSettings: ({ repositoryId, settings }, signal) =>
      respond('updateReviewSettings', signal, () => {
        requireRepository(repositoryId)
        // Mirrors the client check, so the rejection path can be exercised in mock mode.
        if (settings.branch_filter.some((pattern) => /\s/.test(pattern))) {
          throw new ApiError('A branch pattern contains whitespace', 422)
        }
        const saved: ReviewSettingsWire = { ...settings, updated_at: now().toISOString() }
        repositories.settings[repositoryId] = saved
        return saved
      }),
    getRepositoryRules: (repositoryId, signal) =>
      respond('getRepositoryRules', signal, () => {
        const repository = requireRepository(repositoryId)
        return (repositories.rules[repositoryId] ??= missingRulesFile(repository.default_branch))
      }),
  }
}

/**
 * Reads the dev-only failure switch from the URL, e.g. `?mockFail=replyToFinding,connectRepository`.
 */
export function failuresFromSearch(search: string): ReviewApiMethod[] {
  const methods: ReviewApiMethod[] = [
    'listRuns',
    'getRun',
    'getDiff',
    'getFindings',
    'getFileContent',
    'replyToFinding',
    'setFindingStatus',
    'listRepositories',
    'listAvailableRepositories',
    'connectRepository',
    'getRepository',
    'getReviewSettings',
    'updateReviewSettings',
    'getRepositoryRules',
  ]
  const requested = new URLSearchParams(search).get('mockFail')?.split(',') ?? []
  return methods.filter((method) => requested.includes(method))
}
