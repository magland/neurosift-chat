import { SUGGESTED_QUERIES } from '../constants'
import styles from './SuggestedQueries.module.css'

interface SuggestedQueriesProps {
  onQuerySelect: (query: string) => void
}

export function SuggestedQueries({ onQuerySelect }: SuggestedQueriesProps) {
  const suggestedQueries = SUGGESTED_QUERIES;
  return (
    <div className={styles.suggestions}>
      {/* <h2>Try asking about...</h2> */}
      <div className={styles.suggestionsGrid}>
        {suggestedQueries.map((q, index) => (
          <button
            key={index}
            className={styles.suggestionButton}
            onClick={() => onQuerySelect(q)}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}
