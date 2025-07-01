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
      <div>
        <Board brushColor={brushColor} brushSize={brushSize} isCreator={isCreator} />
        <div className='tools'>
          <div>
            <span>Color: </span>
            <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} />
          </div>
          <div>
            <span>Size: </span>
            <input
              type="range"
              min="1"
              max="100"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
            />
            <span>{brushSize}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CanvasDrawing;
