import styles from './ModelRepositorySelect.module.css'

const AVAILABLE_MODELS = [
  {
    model: "openai/gpt-4.1-mini",
    label: "GPT-4.1 Mini"
  },
  {
    model: "openai/gpt-4.1",
    label: "GPT-4.1"
  },
  {
    model: "anthropic/claude-sonnet-4",
    label: "Claude Sonnet 4"
  }
] as const

const AVAILABLE_REPOSITORIES = ['DANDI', 'OpenNeuro'] as const

interface ModelRepositorySelectProps {
  selectedModel: string
  selectedRepositories: string[]
  onModelChange: (model: string) => void
  onRepositoriesChange: (repositories: string[]) => void
}

export function ModelRepositorySelect({
  selectedModel,
  selectedRepositories,
  onModelChange,
  onRepositoriesChange
}: ModelRepositorySelectProps) {
  const handleRepositoryChange = (repository: string, checked: boolean) => {
    if (checked) {
      onRepositoriesChange([...selectedRepositories, repository])
    } else {
      onRepositoriesChange(selectedRepositories.filter(db => db !== repository))
    }
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ marginBottom: '10px' }}>
        <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>Model:</div>
        <div style={{ display: 'flex', gap: '15px' }}>
          {AVAILABLE_MODELS.map((model) => (
            <label key={model.model} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <input
                type="radio"
                name="model"
                value={model.model}
                checked={selectedModel === model.model}
                onChange={(e) => onModelChange(e.target.value)}
                style={{ marginRight: '5px' }}
              />
              {model.label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>Repositories:</div>
        <div className={styles.toggleContainer}>
          {AVAILABLE_REPOSITORIES.map((repo) => (
            <label key={repo} className={styles.toggleLabel}>
              <span className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={selectedRepositories.includes(repo)}
                  onChange={(e) => handleRepositoryChange(repo, e.target.checked)}
                  disabled={repo !== "DANDI"}
                />
                <span className={styles.slider}></span>
              </span>
              {repo}
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
