import type { FindingStatusWire, VcsProviderWire } from './types'

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

export interface ConnectRepositoryRequest {
  provider: VcsProviderWire
  /** The provider's repository ID, as listed by listAvailableRepositories. */
  externalId: string
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
  /** Resolves with a RepositoryWire[]-shaped value: the connected repositories (`GET /repositories`). */
  listRepositories(signal?: AbortSignal): Promise<unknown>
  /**
   * Resolves with an AvailableRepositoryWire[]-shaped value: the repositories the user can
   * access (`GET /repositories/available`).
   */
  listAvailableRepositories(signal?: AbortSignal): Promise<unknown>
  /**
   * Connects a repository (`POST /repositories`); resolves with the created RepositoryWire.
   * Rejects with ApiError 409 when it is already connected, 403/404 when it is not accessible.
   */
  connectRepository(request: ConnectRepositoryRequest, signal?: AbortSignal): Promise<unknown>
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
