import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './App.css';

const HORAS_JORNADA = ['09:00', '10:00', '11:00', '12:00', '15:00', '16:00', '17:00'];

export default function Admin() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [citasDelDia, setCitasDelDia] = useState([]);
  const [servicios, setServicios] = useState([]);

  // Estados del nuevo formulario de servicios
  const [nombreServicio, setNombreServicio] = useState('');
  const [precioServicio, setPrecioServicio] = useState('');
  const [fotoServicio, setFotoServicio] = useState(null);
  const [subiendo, setSubiendo] = useState(false);

  const obtenerFechaString = (dateObj) => {
    const año = dateObj.getFullYear();
    const mes = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dia = String(dateObj.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  };

  const cargarCitasYBloqueos = async () => {
    const fechaStr = obtenerFechaString(fechaSeleccionada);
    try {
      const apiURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${apiURL}/api/admin/bloqueos?fecha=${fechaStr}`);
      if (res.ok) setCitasDelDia(await res.json());
    } catch (e) { console.error(e); }
  };

  const cargarServicios = async () => {
    try {
      const apiURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${apiURL}/api/servicios`);
      if (res.ok) setServicios(await res.json());
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    cargarCitasYBloqueos();
    cargarServicios();
  }, [fechaSeleccionada]);

  const toggleBloqueoHora = async (hora) => {
    const fechaStr = obtenerFechaString(fechaSeleccionada);
    const estaOcupada = citasDelDia.some(c => c.fecha_hora.startsWith(`${fechaStr}T${hora}`));
    try {
      const apiURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${apiURL}/api/admin/gestionar-bloqueo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha: fechaStr, hora: hora, bloquear: !estaOcupada })
      });
      if (res.ok) cargarCitasYBloqueos();
    } catch (e) { console.error(e); }
  };

  const handleCrearServicio = async (e) => {
    e.preventDefault();
    if (!fotoServicio) return alert("Por favor selecciona una foto.");

    setSubiendo(true);
    
    const formData = new FormData();
    formData.append('nombre', nombreServicio);
    formData.append('precio', parseInt(precioServicio, 10)); 
    formData.append('imagen', fotoServicio); 

    try {
      const apiURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${apiURL}/api/admin/servicios`, {
        method: 'POST',
        body: formData 
      });

      if (res.ok) {
        const resultado = await res.json();
        console.log("Servicio creado con éxito:", resultado);
        
        setNombreServicio('');
        setPrecioServicio('');
        setFotoServicio(null);
        e.target.reset(); 
        
        cargarServicios();
      } else {
        const errorData = await res.json();
        console.error("El servidor rechazó el servicio:", errorData);
        alert("Error del servidor: " + JSON.stringify(errorData.detail));
      }
    } catch (e) {
      console.error("Error de red al intentar conectar con el backend:", e);
    } finally {
      setSubiendo(false);
    }
  };
  
  const handleEliminarServicio = async (id) => {
    if (!confirm("¿Seguro que deseas eliminar este servicio?")) return;
    try {
      const apiURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const res = await fetch(`${apiURL}/api/admin/servicios/${id}`, { method: 'DELETE' });
      if (res.ok) cargarServicios();
    } catch (e) { console.error(e); }
  };

  return (
    <div className="container-wide">
      <h2>🔑 Panel de Control General</h2>
      
      <div className="grid-layout">
        <div className="seccion">
          <label>1. Elige la fecha a revisar o bloquear:</label>
          <div className="calendar-wrapper"><Calendar onChange={setFechaSeleccionada} value={fechaSeleccionada} /></div>
        </div>
        <div className="seccion">
          <label>2. Estado de la agenda para el {fechaSeleccionada.toLocaleDateString()}:</label>
          <p className="instruccion-admin">🟢 Verde = Libre | 🔴 Rojo = Ocupada / Bloqueada</p>
          <div className="horas-grid-admin">
            {HORAS_JORNADA.map(hora => {
              const fechaStr = obtenerFechaString(fechaSeleccionada);
              const citaEncontrada = citasDelDia.find(c => c.fecha_hora.startsWith(`${fechaStr}T${hora}`));
              const estaOcupada = !!citaEncontrada;
              return (
                <button type="button" key={hora} className={`admin-hora-card ${estaOcupada ? 'cerrada-roja' : 'abierta-verde'}`} onClick={() => toggleBloqueoHora(hora)}>
                  {hora} <br />
                  <small>{estaOcupada ? (citaEncontrada.nombre_cliente.includes("BLOQUEADO") ? "Bloqueado Admin" : `Cita: ${citaEncontrada.nombre_cliente}`) : "Libre"}</small>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <hr style={{ margin: '40px 0', border: '0', borderTop: '1px solid #ccc' }} />

      <div className="grid-layout">
        <div className="seccion">
          <h3>✨ Agregar Nuevo Servicio</h3>
          <form onSubmit={handleCrearServicio} className="form-nuevo-servicio">
            <label>Nombre del Servicio:</label>
            <input type="text" value={nombreServicio} onChange={(e) => setNombreServicio(e.target.value)} required placeholder="Ej. Depilación de Espalda" />

            <label>Precio ($):</label>
            <input type="number" value={precioServicio} onChange={(e) => setPrecioServicio(e.target.value)} required placeholder="Ej. 12000" />

            <label>Foto del Servicio:</label>
            <input type="file" accept="image/*" onChange={(e) => setFotoServicio(e.target.files[0])} required />

            <button type="submit" className="btn-principal" style={{ marginTop: '15px' }} disabled={subiendo}>
              {subiendo ? "Guardando y Subiendo Foto..." : "Añadir Servicio al Catálogo"}
            </button>
          </form>
        </div>

        <div className="seccion">
          <h3>📋 Catálogo Actual ({servicios.length})</h3>
          <div className="admin-servicios-lista">
            {servicios.map(s => (
              <div key={s.id} className="admin-servicio-item">
                <img src={s.imagen_url} alt={s.nombre} />
                <div className="info">
                  <h4>{s.nombre}</h4>
                  <p>${s.precio.toLocaleString()}</p>
                </div>
                <button type="button" onClick={() => handleEliminarServicio(s.id)} className="btn-eliminar-servicio">✕ Eliminar</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}