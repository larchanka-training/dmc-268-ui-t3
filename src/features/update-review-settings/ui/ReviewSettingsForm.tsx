import { useId, useState, type FormEvent } from 'react'
import {
  SEVERITY_THRESHOLDS,
  THRESHOLD_OPTION,
  type ReviewSettings,
  type SeverityThreshold,
} from '@/entities/review-settings'
import { Button } from '@/shared/ui/button'
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group'
import { Switch } from '@/shared/ui/switch'
import { Textarea } from '@/shared/ui/textarea'
import { formatBranchFilter, parseBranchFilter } from '../lib/branch-filter'
import { describeSaveError } from '../lib/describe-error'
import { useUpdateReviewSettings } from '../model/use-update-review-settings'

interface ReviewSettingsFormProps {
  repositoryId: string
  /** The settings the server holds; the form compares its draft against them. */
  settings: ReviewSettings
}

function sameList(a: readonly string[], b: readonly string[]) {
  return a.length === b.length && a.every((item, index) => item === b[index])
}

/**
 * The editable review settings of one repository. The draft is local state: a failed save
 * keeps it, a successful save replaces it with what the server stored. Render it with
 * `key={repositoryId}` so a draft never carries over to another repository.
 */
export function ReviewSettingsForm({ repositoryId, settings }: ReviewSettingsFormProps) {
  const [autoReview, setAutoReview] = useState(settings.autoReview)
  const [branchText, setBranchText] = useState(() => formatBranchFilter(settings.branchFilter))
  const [threshold, setThreshold] = useState<SeverityThreshold>(settings.severityThreshold)
  const [justSaved, setJustSaved] = useState(false)
  const update = useUpdateReviewSettings(repositoryId)
  const ids = {
    auto: useId(),
    autoHint: useId(),
    branch: useId(),
    branchHint: useId(),
    branchProblems: useId(),
    threshold: useId(),
    error: useId(),
  }

  const { patterns, problems } = parseBranchFilter(branchText)
  const changed =
    autoReview !== settings.autoReview ||
    threshold !== settings.severityThreshold ||
    !sameList(patterns, settings.branchFilter)
  const canSave = changed && problems.length === 0 && !update.isPending

  function edited() {
    setJustSaved(false)
    if (update.isError) update.reset()
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (!canSave) return
    update.mutate(
      { autoReview, branchFilter: patterns, severityThreshold: threshold },
      {
        onSuccess: (saved) => {
          setAutoReview(saved.autoReview)
          setBranchText(formatBranchFilter(saved.branchFilter))
          setThreshold(saved.severityThreshold)
          setJustSaved(true)
        },
      },
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <fieldset disabled={update.isPending} className="space-y-6">
        <legend className="sr-only">Review settings</legend>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <label htmlFor={ids.auto} className="text-sm font-medium">
              Automatic review
            </label>
            <p id={ids.autoHint} className="text-sm text-muted-foreground">
              Review pull requests when they are opened or updated.
            </p>
          </div>
          <Switch
            id={ids.auto}
            checked={autoReview}
            aria-describedby={ids.autoHint}
            onCheckedChange={(checked) => {
              setAutoReview(checked)
              edited()
            }}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor={ids.branch} className="text-sm font-medium">
            Branch filter
          </label>
          <p id={ids.branchHint} className="text-sm text-muted-foreground">
            Target branches to review, one pattern per line, for example <code>main</code> or{' '}
            <code>release/*</code>.{' '}
            {patterns.length === 0 && 'Empty: every target branch is reviewed.'}
          </p>
          <Textarea
            id={ids.branch}
            value={branchText}
            rows={3}
            spellCheck={false}
            autoCapitalize="off"
            aria-invalid={problems.length > 0 || undefined}
            aria-describedby={
              problems.length > 0 ? `${ids.branchHint} ${ids.branchProblems}` : ids.branchHint
            }
            className="font-mono"
            onChange={(event) => {
              setBranchText(event.target.value)
              edited()
            }}
          />
          {problems.length > 0 && (
            <ul id={ids.branchProblems} className="space-y-1 text-sm text-destructive">
              {problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-2">
          <span id={ids.threshold} className="text-sm font-medium">
            Severity threshold
          </span>
          <RadioGroup
            aria-labelledby={ids.threshold}
            value={threshold}
            onValueChange={(value) => {
              setThreshold(value as SeverityThreshold)
              edited()
            }}
          >
            {SEVERITY_THRESHOLDS.map((value) => {
              const option = THRESHOLD_OPTION[value]
              const optionId = `${ids.threshold}-${value}`
              return (
                <div key={value} className="flex items-start gap-3">
                  <RadioGroupItem
                    id={optionId}
                    value={value}
                    aria-describedby={`${optionId}-hint`}
                    className="mt-0.5"
                  />
                  <div className="space-y-0.5">
                    <label htmlFor={optionId} className="text-sm">
                      {option.label}
                    </label>
                    <p id={`${optionId}-hint`} className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </RadioGroup>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          size="sm"
          disabled={!canSave}
          aria-describedby={update.isError ? ids.error : undefined}
        >
          {update.isPending ? 'Saving…' : 'Save'}
        </Button>
        {justSaved && !changed && (
          <p role="status" className="text-sm text-muted-foreground">
            Settings saved
          </p>
        )}
        {update.isError && (
          <p id={ids.error} role="alert" className="text-sm text-destructive">
            {describeSaveError(update.error)}
          </p>
        )}
      </div>
    </form>
  )
}
