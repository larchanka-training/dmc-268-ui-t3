import { describe, expect, it } from 'vitest'
import { mockAppState } from '@/shared/api/mock/app-state.mock'
import { reviewRunSchema } from '../model/schema'
import { runsOfRepository } from './filter'

function run(id: string, repository: string) {
  return reviewRunSchema.parse({ ...mockAppState.server.run, run_id: id, repository })
}

describe('runsOfRepository', () => {
  it('keeps exact full-name matches in any case', () => {
    const runs = [
      run('a', 'acme/web'),
      run('b', 'acme/api'),
      run('c', 'Acme/Web'),
      run('d', 'acme/web-legacy'),
      run('e', 'other/acme/web'),
    ]
    expect(runsOfRepository(runs, 'acme/web').map((item) => item.id)).toEqual(['a', 'c'])
  })
})
