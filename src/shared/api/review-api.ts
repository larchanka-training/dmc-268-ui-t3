import type { FindingStatusWire } from './types'

export interface FileContentRequest {
  runId: string
  /** Path on the RIGHT (head) side. */
  path: string
}

export interface ReplyRequest {
  runId: string
  findingId: string
  body: string
}

export interface FindingStatusRequest {
  runId: string
  findingId: string
  status: FindingStatusWire
}

/**
 * Transport boundary to the review backend. Every method resolves with
 * unvalidated wire data; callers parse it with the entity Zod schemas.
 */
export interface ReviewApi {
  /** Resolves with a ReviewRunWire[]-shaped value: the user's runs (`GET /runs`). */
  listRuns(signal?: AbortSignal): Promise<unknown>
  /** Resolves with a ReviewRunWire-shaped value. */
  getRun(runId: string, signal?: AbortSignal): Promise<unknown>
  /** Resolves with unified diff text. */
  getDiff(runId: string, signal?: AbortSignal): Promise<unknown>
  /** Resolves with a FindingWire[]-shaped value. */
  getFindings(runId: string, signal?: AbortSignal): Promise<unknown>
  /** Resolves with the head-side file text, or null when it is not available. */
  getFileContent(request: FileContentRequest, signal?: AbortSignal): Promise<unknown>
  /** Resolves with the created ReplyWire. */
  replyToFinding(request: ReplyRequest, signal?: AbortSignal): Promise<unknown>
  /** Resolves with the updated FindingWire. */
  setFindingStatus(request: FindingStatusRequest, signal?: AbortSignal): Promise<unknown>
}

export type ReviewApiMethod = keyof ReviewApi

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}
