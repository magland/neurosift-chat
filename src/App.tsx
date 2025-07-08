import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ChatMessages } from './components/ChatMessages'
import { SearchForm } from './components/SearchForm'
import { SuggestedQueries } from './components/SuggestedQueries'
import { ModelSelect } from './components/ModelSelect'
import { UserNameInput } from './components/UserNameInput'
import { AdminPage } from './components/AdminPage'
import { useChat } from './hooks/useChat'
import { useUsage } from './contexts/UsageContext'

function ChatPage() {
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
    chatKey,
    onMessageFeedbackSubmit,
  } = useChat()

  const { isModelAvailable } = useUsage()

  const handleSuggestedQuery = (q: string) => {
    setMainQuery(q)
  }

  const modelAvailable = isModelAvailable(selectedModel)

  return (
    <main className="container">
      <div style={{padding: '10px', margin: '10px 0', backgroundColor: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '4px', color: '#856404'}}>
        Please read:
        <p style={{margin: 0}}>
          * This application is experimental and in early development.
          <br />
          * All chats are saved and may be visible to others. We are collecting data to improve the service.
          <br />
          * Use it for free, but please be considerate of the shared resources.
          <br />
          * All users share a single quota, which resets every day. GPT-4.1 Mini is the most cost-effective, while Claude Sonnet 4 is the most advanced.
          <br />
        </p>
      </div>
      {(!messages.length || chatKey) && (
        <div className="search-container">
        <UserNameInput />
        <ModelSelect
          selectedModel={selectedModel}
          onModelChange={setSelectedModel}
        />
        {!modelAvailable && (
          <div style={{
            padding: '10px',
            margin: '10px 0',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            color: '#721c24'
          }}>
            <p style={{margin: 0}}>
              Daily quota exceeded for {selectedModel}. Please select a different model or provide your own OpenRouter key.
            </p>
          </div>
        )}
        {/* {messages.length === 0 && (
          <SuggestedQueries onQuerySelect={handleSuggestedQuery} />
        )} */}
        <SuggestedQueries onQuerySelect={handleSuggestedQuery} />
        <SearchForm
          query={mainQuery}
          onQueryChange={setMainQuery}
          onSubmit={handleMainSearch}
          isLoading={isLoading}
          disabled={!modelAvailable}
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

function App() {
  return (
    <Routes>
      <Route path="/" element={<ChatPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}

export default App
