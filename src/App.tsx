import { useState } from 'react'
import './App.css'
import CanvasBoard from './components/CanvasBoard'

function App() {
  const [jsonData, setJsonData] = useState('');

  const handleJsonChange = (newValue: string) => {
    setJsonData(newValue);
  };

  return (
    <div className="app-container">
      <CanvasBoard />
    </div>
  )
}

export default App
