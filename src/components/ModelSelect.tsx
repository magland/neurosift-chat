import { useUsage } from '../contexts/UsageContext';

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
  const { isModelAvailable, getModelStatus } = useUsage();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ marginBottom: '10px' }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <span style={{fontWeight: "bold"}}>Select a model:</span>
          {AVAILABLE_MODELS.map((model) => {
            const available = isModelAvailable(model.model);
            const status = getModelStatus(model.model);

            return (
              <div key={model.model} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center' }}>
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
                {status && (
                  <small style={{
                    fontSize: '11px',
                    color: available ? '#666' : '#d32f2f',
                    marginLeft: '20px'
                  }}>
                    {available
                      ? `${formatCurrency(status.remainingBudget)} remaining`
                      : 'Daily quota exceeded'
                    }
                  </small>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}
