import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RoomPage from './RoomPage';
import CanvasDrawing from './CanvasDrawing';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoomPage />} />
        <Route path="/board/:roomId" element={<CanvasDrawing isCreator={true} />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
