import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

const RoomPage: React.FC = () => {
  const [createId, setCreateId] = useState(uuidv4());
  const [joinId, setJoinId] = useState('');

  const handleCreate = () => {
    window.open(`/board/${createId}?creator=true`, '_blank');
  };

  const handleJoin = () => {
    if (joinId.trim()) {
      window.open(`/board/${joinId}`, '_blank');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(createId);
    alert('Room ID copied to clipboard!');
  };

  const handleGenerate = () => {
    setCreateId(uuidv4());
  };

  return (
    <div
      className="room-page"
      style={{
        minHeight: '100vh',
        padding: '3rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn 0.5s ease-out'
      }}
    >
      <h1 style={{ color: 'black', fontSize: '2.5rem', marginBottom: '1rem' }}>
        Collaborative Whiteboard
      </h1>

      <p style={{
        color: 'black',
        fontSize: '1.2rem',
        marginBottom: '2.5rem',
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        Fast. Simple. Shared. <br />
      </p>

      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: '2rem'
      }}>
        {}
        <div style={cardStyle}>
          <h3 style={titleStyle}>Create Room</h3>
          <input
            type="text"
            value={createId}
            readOnly
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: '10px', marginBottom: '0.8rem' }}>
            <button onClick={handleCopy} style={buttonStyle('#7f8c8d')}>Copy</button>
            <button onClick={handleGenerate} style={buttonStyle('#f39c12')}>Generate</button>
          </div>
          <button onClick={handleCreate} style={buttonStyle('#2980b9')}>Create Room</button>
        </div>

        {}
        <div style={cardStyle}>
          <h3 style={titleStyle}>Join Room</h3>
          <input
            type="text"
            placeholder="Enter Room ID"
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            style={inputStyle}
          />
          <button onClick={handleJoin} style={buttonStyle('#27ae60')}>Join Room</button>
        </div>
      </div>
    </div>
  );
};

const cardStyle: React.CSSProperties = {
  background: '#f7f7f7',
  padding: '1.5rem',
  borderRadius: '12px',
  width: '300px',
  boxShadow: '0 8px 16px rgba(0,0,0,0.15)',
  color: 'black',
  border: '1px solid #ddd'
};

const titleStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '1rem'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  marginBottom: '0.8rem',
  fontSize: '14px',
  borderRadius: '6px',
  border: '1px solid #ccc'
};

const buttonStyle = (bgColor: string): React.CSSProperties => ({
  width: '100%',
  padding: '10px',
  backgroundColor: bgColor,
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  fontWeight: 'bold',
  fontSize: '14px',
  cursor: 'pointer',
  transition: '0.3s ease all'
});

export default RoomPage;

