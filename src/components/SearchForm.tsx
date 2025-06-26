interface SearchFormProps {
  query: string
  onQueryChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  isLoading: boolean
  disabled?: boolean
}

export function SearchForm({
  query,
  onQueryChange,
  onSubmit,
  isLoading,
  disabled = false
}: SearchFormProps) {
  return (
    <form onSubmit={onSubmit} className="search-form">
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Query DANDI, OpenNeuro, and EBRAINS..."
        className="search-input"
        disabled={disabled}
      />
      <button type="submit" className="search-button" disabled={isLoading || disabled}>
        Submit
      </button>
    </form>
  )
}
