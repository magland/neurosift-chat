import { useNavigate } from 'react-router-dom'
import { useChats } from '../hooks/useChats'
import { useEffect, useState } from 'react'

export const AdminPage: React.FC = () => {
  const navigate = useNavigate()
  const [adminPasscode, setAdminPasscode] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    chats,
    isLoading,
    loadChats,
    deleteChat,
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

  const handleDeleteClick = (chatId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setChatToDelete(chatId)
    setShowDeleteModal(true)
    setDeleteError(null)
  }

  const handleDeleteConfirm = async () => {
    if (!chatToDelete || !adminPasscode.trim()) {
      setDeleteError('Admin passcode is required')
      return
    }

    setIsDeleting(true)
    setDeleteError(null)

    try {
      await deleteChat(chatToDelete, adminPasscode)
      setShowDeleteModal(false)
      setChatToDelete(null)
      setAdminPasscode('')
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete chat')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setChatToDelete(null)
    setAdminPasscode('')
    setDeleteError(null)
  }

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
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Actions</th>
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
                  <td style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>
                    <button
                      onClick={(e) => handleDeleteClick(chat.chatId, e)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            minWidth: '400px',
            maxWidth: '500px'
          }}>
            <h3 style={{ marginTop: 0 }}>Delete Chat</h3>
            <p>Enter admin passcode to delete this chat:</p>

            <input
              type="password"
              value={adminPasscode}
              onChange={(e) => setAdminPasscode(e.target.value)}
              placeholder="Admin passcode"
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxSizing: 'border-box'
              }}
            />

            {deleteError && (
              <div style={{
                color: '#dc3545',
                marginBottom: '10px',
                fontSize: '14px'
              }}>
                {deleteError}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.6 : 1
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: isDeleting ? 'not-allowed' : 'pointer',
                  opacity: isDeleting ? 0.6 : 1
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
