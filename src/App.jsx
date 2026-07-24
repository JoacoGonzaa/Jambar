import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Cliente from './Cliente';
import Admin from './Admin';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* La página de inicio normal para tus clientes */}
        <Route path="/" element={<Cliente />} />
        
        {/* La ruta secreta exclusiva para el administrador */}
        <Route path="/colocolo" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}