interface SearchFormProps {
  query: string
  onQueryChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
}

export function SearchForm({
  query,
  onQueryChange,
  onSubmit,
  isLoading
}: SearchFormProps) {
  return (
    <form onSubmit={onSubmit} className="search-form">
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Enter your query..."
        className="search-input"
      />
      <button type="submit" className="search-button" disabled={isLoading}>
        Submit
      </button>
    </form>
  )
}
