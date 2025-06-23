import './App.css'
import { ChatMessages } from './components/ChatMessages'
import { SearchForm } from './components/SearchForm'
import { SuggestedQueries } from './components/SuggestedQueries'
import { ModelRepositorySelect } from './components/ModelRepositorySelect'
import { useChat } from './hooks/useChat'

function App() {
  const {
    messages,
    messageMetadata,
    mainQuery,
    followUpQuery,
    isLoading,
    setMainQuery,
    setFollowUpQuery,
    handleMainSearch,
    handleFollowUp,
    status,
    selectedModel,
    setSelectedModel,
    selectedRepositories,
    setSelectedRepositories,
    chatId,
    chatKey,
    onMessageFeedbackSubmit
  } = useChat()

  const handleSuggestedQuery = (q: string) => {
    setMainQuery(q)
  }

  return (
    <main className="container">
      <div style={{padding: '10px', margin: '10px 0', backgroundColor: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '4px', color: '#856404'}}>
        <p style={{margin: 0}}>
          Note: This application is experimental and in early development. It will only work when the job runner service is online.
        </p>
      </div>
      <div style={{padding: '10px', margin: '10px 0', backgroundColor: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '4px', color: '#856404'}}>
        <p style={{margin: 0}}>
          Note: All chats are saved and may be visible to others.
          {chatId && (
            <>
              <br />
              Chat ID: {chatId}
              <br />
              Status: {chatKey ? 'Editable' : 'View Only'}
            </>
          )}
        </p>
      </div>
      {(!messages.length || chatKey) && (
        <div className="search-container">
        <ModelRepositorySelect
          selectedModel={selectedModel}
          selectedRepositories={selectedRepositories}
          onModelChange={setSelectedModel}
          onRepositoriesChange={setSelectedRepositories}
        />
        {/* {messages.length === 0 && (
          <SuggestedQueries onQuerySelect={handleSuggestedQuery} />
        )} */}
        <SuggestedQueries onQuerySelect={handleSuggestedQuery} selectedRepositories={selectedRepositories} />
        <SearchForm
          query={mainQuery}
          onQueryChange={setMainQuery}
          onSubmit={handleMainSearch}
          isLoading={isLoading}
        />
        </div>
      )}

      <ChatMessages
        messages={messages}
        messageMetadata={messageMetadata}
        isLoading={isLoading}
        followUpQuery={followUpQuery}
        onFollowUpChange={chatKey ? setFollowUpQuery : undefined}
        onFollowUpSubmit={chatKey ? handleFollowUp : undefined}
        status={status}
        onMessageFeedbackSubmit={onMessageFeedbackSubmit}
      />
    </main>
  )
}

export default App
