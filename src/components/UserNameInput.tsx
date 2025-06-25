import { useState, useEffect } from 'react';
import { getUserName, setUserName } from '../utils/userNameManager';

interface UserNameInputProps {
  className?: string;
}

export function UserNameInput({ className }: UserNameInputProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    const savedName = getUserName();
    if (savedName) {
      setName(savedName);
    }
  }, []);

  const handleNameChange = (value: string) => {
    setName(value);
    setUserName(value);
  };

  const handleHelpClick = () => {
    alert('Providing your name helps us collect feedback and identify who submitted which chat queries for improving the service.\n\nThis is completely optional but recommended for better support.');
  };

  return (
    <div className={`user-name-input ${className || ''}`}>
      <div className="user-name-input-wrapper">
        <input
          type="text"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Your name (optional, recommended)"
          className="user-name-field"
          maxLength={50}
        />
        <div
          className="user-name-help"
          title="Providing your name helps us collect feedback and identify who submitted which chat queries for improving the service."
          onClick={handleHelpClick}
        >
          ?
        </div>
      </div>
    </div>
  );
}
