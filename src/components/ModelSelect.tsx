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

interface ModelSelectProps {
  selectedModel: string
  onModelChange: (model: string) => void
}

export function ModelSelect({
  selectedModel,
  onModelChange,
}: ModelSelectProps) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', gap: '15px' }}>
          <span style={{fontWeight: "bold"}}>Select a model:</span>
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
    </div>
  )
}
