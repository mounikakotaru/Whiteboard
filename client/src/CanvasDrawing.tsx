import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import './App.css';
import Board from './component/Board';

const CanvasDrawing = () => {
  const [brushColor, setBrushColor] = useState('black');
  const [brushSize, setBrushSize] = useState<number>(5);

  const [searchParams] = useSearchParams();
  const isCreator = searchParams.get('creator') === 'true';

  useEffect(() => {
    console.log("CanvasDrawing Brush Size: ", brushSize);
  }, [brushSize]);

  return (
    <div className="App">
      <h1>Collaborative Whiteboard</h1>
      <Board
        brushColor={brushColor}
        brushSize={brushSize}
        isCreator={isCreator}
      />
    </div>
  );
};

export default CanvasDrawing;

