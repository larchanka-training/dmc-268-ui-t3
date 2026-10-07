import { ApiError, type ReviewApi, type ReviewApiMethod } from '../review-api'
import type { FindingWire, ReplyWire } from '../types'
import { mockAppState, type MockAppState } from './app-state.mock'

type MockServerState = MockAppState['server']

export interface MockReviewApiOptions {
  /** Initial server state; defaults to a copy of mockAppState.server. */
  state?: MockServerState
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
  const failing = new Set<ReviewApiMethod>(options.failures)
  const delayMs = options.delayMs ?? 0
  const author = options.author ?? 'you'
  const now = options.now ?? (() => new Date())
  let replyCounter = 0

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
  }
}

/**
 * Reads the dev-only failure switch from the URL, e.g. `?mockFail=replyToFinding,setFindingStatus`.
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
  ]
  const requested = new URLSearchParams(search).get('mockFail')?.split(',') ?? []
  return methods.filter((method) => requested.includes(method))
}
