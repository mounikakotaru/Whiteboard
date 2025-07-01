import React, { useRef, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useParams } from 'react-router-dom';

interface MyBoard {
  brushColor: string;
  brushSize: number;
  isCreator: boolean;
}

const Board: React.FC<MyBoard> = ({ brushColor, brushSize, isCreator }) => {
  const { roomId } = useParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [socket, setSocket] = useState<any>(null);
  const [userCount, setUserCount] = useState<number>(1);
  const [history, setHistory] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join-room', roomId);
    });

    return () => newSocket.disconnect();
  }, [roomId]);

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

    socket.on('user-count', (count: number) => {
      setUserCount(count);
    });
  }, [socket]);

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
    <div style={{ textAlign: 'center' }}>
      {/* 👥 Only creator sees the count */}
      {isCreator && (
        <div style={{ marginBottom: '10px', fontWeight: 'bold', fontSize: '16px' }}>
          👥 Users Connected: {userCount}
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={windowSize[0] > 600 ? 600 : 300}
        height={windowSize[1] > 400 ? 400 : 200}
        style={{ backgroundColor: 'white', border: '1px solid #ccc' }}
      />

      <div style={{
        marginTop: '15px',
        display: 'flex',
        justifyContent: 'center',
        gap: '12px'
      }}>
        <button onClick={undo} style={buttonStyle('#3498db')}>⬅️ Undo</button>
        <button onClick={redo} style={buttonStyle('#2ecc71')}>➡️ Redo</button>
        <button onClick={clearCanvas} style={buttonStyle('#e74c3c')}>🧹 Clear</button>
      </div>
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


