import { useNavigate } from 'react-router-dom'
import { useChats } from '../hooks/useChats'
import { useEffect } from 'react'

export const AdminPage: React.FC = () => {
  const navigate = useNavigate()
  const {
    chats,
    isLoading,
    loadChats,
    countFeedback,
    formatDate,
    getFirstUserMessage,
    getModelsUsed,
    formatCost,
    getMessageCount
  } = useChats()

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>Chat Admin</h1>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Back to Chat
        </button>
      </div>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Timestamp</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>User</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>First Message</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Models</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Messages</th>
              <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6' }}>Cost</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>👍</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>👎</th>
            </tr>
          </thead>
          <tbody>
            {[...chats]
              .sort((a, b) => b.timestampCreated - a.timestampCreated)
              .map((chat) => (
                <tr
                  key={chat.chatId}
                  style={{
                    cursor: 'pointer',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa'
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = ''
                  }}
                  onClick={() => navigate(`/?chat=${chat.chatId}`)}
                >
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                    {formatDate(chat.timestampCreated)}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6', color: chat.userName ? '#333' : '#999', fontStyle: chat.userName ? 'normal' : 'italic' }}>
                    {chat.userName || 'Anonymous'}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                    {getFirstUserMessage(chat.messages)}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                    {getModelsUsed(chat.messageMetadata)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>
                    {getMessageCount(chat.messages)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>
                    {formatCost(chat.estimatedCost)}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>
                    {countFeedback(chat.messageMetadata, 'up')}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>
                    {countFeedback(chat.messageMetadata, 'down')}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
