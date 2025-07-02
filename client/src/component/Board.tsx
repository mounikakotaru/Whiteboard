import React, { useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useParams, useSearchParams } from 'react-router-dom';

interface MyBoard {
  brushColor: string;
  brushSize: number;
  isCreator: boolean;
}

const Board: React.FC<MyBoard> = ({ brushColor, brushSize, isCreator }) => {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const username = searchParams.get('name') || 'Anonymous';

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [socket, setSocket] = useState<any>(null);
  const [userCount, setUserCount] = useState<number>(1);
  const [userList, setUserList] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join-room', { roomId, username });
      if (!isCreator) {
        newSocket.emit('request-sync', roomId);
      }
    });

    return () => newSocket.disconnect();
  }, [roomId, username, isCreator]);

  useEffect(() => {
    if (!socket) return;

    socket.on('canvasImage', (data: string) => {
      const image = new Image();
      image.src = data;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      image.onload = () => {
        if (ctx && canvas) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(image, 0, 0);
        }
      };
    });

    if (isCreator) {
      socket.on('send-current-canvas', ({ to }) => {
        const canvas = canvasRef.current;
        if (canvas) {
          const dataURL = canvas.toDataURL();
          socket.emit('canvasImage', { roomId, data: dataURL, to });
        }
      });
    }

    socket.on('user-count', (count: number) => {
      setUserCount(count);
    });

    socket.on('user-list', (list: string[]) => {
      setUserList(list);
    });
  }, [socket, isCreator, roomId]);

  useEffect(() => {
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;

    const startDrawing = (e: MouseEvent) => {
      isDrawing = true;
      [lastX, lastY] = [e.offsetX, e.offsetY];
    };

    const draw = (e: MouseEvent) => {
      if (!isDrawing) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = brushColor;
        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
        [lastX, lastY] = [e.offsetX, e.offsetY];
      }
    };

    const endDrawing = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dataURL = canvas.toDataURL();
      setHistory(prev => [...prev, dataURL]);
      setRedoStack([]);
      if (socket) {
        socket.emit('canvasImage', { roomId, data: dataURL });
      }
      isDrawing = false;
    };

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      canvas.addEventListener('mouseup', endDrawing);
      canvas.addEventListener('mouseout', endDrawing);
    }

    return () => {
      if (canvas) {
        canvas.removeEventListener('mousedown', startDrawing);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('mouseup', endDrawing);
        canvas.removeEventListener('mouseout', endDrawing);
      }
    };
  }, [brushColor, brushSize, socket, roomId]);

  const undo = () => {
    if (history.length === 0) return;
    const newHistory = [...history];
    newHistory.pop();
    const last = newHistory[newHistory.length - 1] || '';
    setHistory(newHistory);
    setRedoStack(prev => [...prev, canvasRef.current!.toDataURL()]);
    const img = new Image();
    img.src = last;
    img.onload = () => {
      const ctx = canvasRef.current!.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      ctx?.drawImage(img, 0, 0);
    };
    if (socket) socket.emit('canvasImage', { roomId, data: img.src });
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    const newRedoStack = [...redoStack];
    const restored = newRedoStack.pop()!;
    setRedoStack(newRedoStack);
    setHistory(prev => [...prev, restored]);
    const img = new Image();
    img.src = restored;
    img.onload = () => {
      const ctx = canvasRef.current!.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      ctx?.drawImage(img, 0, 0);
    };
    if (socket) socket.emit('canvasImage', { roomId, data: img.src });
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHistory([]);
      setRedoStack([]);
      if (socket) socket.emit('canvasImage', { roomId, data: canvas.toDataURL() });
    }
  };

  const [windowSize, setWindowSize] = useState([
    window.innerWidth,
    window.innerHeight,
  ]);

  useEffect(() => {
    const handleWindowResize = () => {
      setWindowSize([window.innerWidth, window.innerHeight]);
    };
    window.addEventListener('resize', handleWindowResize);
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        width: '100%',
        height: 'calc(100vh - 80px)',
        paddingTop: '20px',
        position: 'relative',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '15px',
        }}
      >
        <canvas
          ref={canvasRef}
          width={windowSize[0] > 600 ? 600 : 300}
          height={windowSize[1] > 400 ? 400 : 200}
          style={{ backgroundColor: 'white', border: '1px solid #ccc' }}
        />

        <div
          className="tools"
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
            backgroundColor: 'black',
            padding: '10px 20px',
            borderRadius: '8px',
            width: 'fit-content',
            color: 'white',
          }}
        >
          <div>
            <span>Color:</span>
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              style={{ marginLeft: '5px' }}
            />
          </div>
          <div>
            <span style={{ marginLeft: '10px' }}>Size:</span>
            <input
              type="range"
              min="1"
              max="100"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              style={{ margin: '0 8px' }}
            />
            <span>{brushSize}</span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '12px',
          }}
        >
          <button onClick={undo} style={buttonStyle('#3498db')}>⬅️ Undo</button>
          <button onClick={redo} style={buttonStyle('#2ecc71')}>➡️ Redo</button>
          <button onClick={clearCanvas} style={buttonStyle('#e74c3c')}>🧹 Clear</button>
        </div>
      </div>

      {isCreator && (
        <div
          style={{
            position: 'fixed',
            top: '100px',
            right: '40px',
            width: '220px',
            background: '#f4f4f4',
            border: '1px solid #ccc',
            borderRadius: '8px',
            padding: '1rem',
            zIndex: 10,
            boxShadow: '0 0 8px rgba(0, 0, 0, 0.1)',
          }}
        >
          <h3 style={{ marginTop: 0, fontSize: '1rem', textAlign: 'center' }}>
            👥 Connected ({userCount})
          </h3>
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            {userList.map((name, index) => (
              <li
                key={index}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#fff',
                  marginBottom: '5px',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const buttonStyle = (bgColor: string): React.CSSProperties => ({
  padding: '8px 16px',
  backgroundColor: bgColor,
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: '0.3s'
});

export default Board;


