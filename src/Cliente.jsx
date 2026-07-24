import { useState, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './App.css';

import LOGO_EMPRENDIMIENTO from './assets/Logo_Jambar.jpeg';

export default function Cliente() {
  const [servicios, setServicios] = useState([]); 
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());
  const [nombre, setNombre] = useState('');
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  const [horaSeleccionada, setHoraSeleccionada] = useState('');
  const [horasDisponiblesCliente, setHorasDisponiblesCliente] = useState([]);
  const [status, setStatus] = useState({ loading: false, error: null, success: false });

  const obtenerFechaString = (dateObj) => {
    const año = dateObj.getFullYear();
    const mes = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dia = String(dateObj.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  };

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/servicios`)
      .then(res => res.json())
      .then(data => setServicios(data))
      .catch(err => console.error("Error cargando servicios:", err));

    const fechaStr = obtenerFechaString(fechaSeleccionada);
   fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/horas-disponibles-cliente?fecha=${fechaStr}`)
      .then(res => res.json())
      .then(data => setHorasDisponiblesCliente(data))
      .catch(err => console.error("Error cargando horas:", err));
  }, [fechaSeleccionada]);

  const totalCosto = serviciosSeleccionados.reduce((acc, s) => acc + s.precio, 0);
  const abonoRequerido = totalCosto * 0.20;

  const handleReservaCliente = async (e) => {
    e.preventDefault();
    if (serviciosSeleccionados.length === 0) {
      setStatus({ loading: false, error: "Selecciona al menos un servicio para armar tu carrito.", success: false });
      return;
    }
    if (!horaSeleccionada) {
      setStatus({ loading: false, error: "Por favor, elige un horario disponible.", success: false });
      return;
    }

    setStatus({ loading: true, error: null, success: false });
    const fechaStr = obtenerFechaString(fechaSeleccionada);
    const fechaIsoLimpia = `${fechaStr}T${horaSeleccionada}:00Z`;
    const nombresServicios = serviciosSeleccionados.map(s => s.nombre).join(', ');

    try {
      const respuesta = await fetch(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/reservar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_cliente: nombre,
          whatsapp_cliente: "No solicitado",
          servicio: nombresServicios,
          fecha_hora: fechaIsoLimpia
        })
      });

      if (respuesta.status === 201) {
        setStatus({ loading: false, error: null, success: true });
        setHorasDisponiblesCliente(horasDisponiblesCliente.filter(h => h !== horaSeleccionada));
        
        const mensajeWa = `¡Hola! Agendé una hora desde la web:\n *Cliente:* ${nombre}\n *Servicios:* ${nombresServicios}\n *Fecha:* ${fechaSeleccionada.toLocaleDateString()}\n *Hora:* ${horaSeleccionada}\n *Total:* $${totalCosto.toLocaleString()}\n *Abono (20%):* $${abonoRequerido.toLocaleString()}`;
        
        window.location.href = `https://wa.me/56984950388?text=${encodeURIComponent(mensajeWa)}`;
      } else {
        const err = await respuesta.json();
        setStatus({ loading: false, error: err.detail, success: false });
      }
    } catch (error) {
      setStatus({ loading: false, error: "Error en la conexión con el servidor.", success: false });
    }
  };

  return (
    <div className="beauty-container fading-in">
      
      {/* CABECERA REDISEÑADA CON LOGO CIRCULAR */}
      <header className="beauty-header">
        <div className="logo-wrapper">
          <img src={LOGO_EMPRENDIMIENTO} alt="Logo Emprendimiento" className="beauty-logo" />
        </div>
        <h1>Reserva tu Cita de Depilación</h1>
        <p>Selecciona tus servicios favoritos, escoge el día y asegura tu cupo de forma inmediata.</p>
      </header>

      <form onSubmit={handleReservaCliente} className="beauty-layout">
        
        {/* COLUMNA IZQUIERDA: IDENTIFICACIÓN Y SERVICIOS */}
        <div className="beauty-column">
          <div className="card-wrapper">
            <label className="section-title">1. Identificación</label>
            <input 
              type="text" 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)} 
              required 
              placeholder="Escribe tu nombre y apellido" 
              className="beauty-input"
            />
          </div>

          <div className="card-wrapper">
            <label className="section-title">2. Elige tus Servicios</label>
            {servicios.length === 0 ? (
              <p className="loading-text">Cargando el catálogo de estética...</p>
            ) : (
              <div className="beauty-services-grid">
                {servicios.map(s => {
                  const estaSeleccionado = serviciosSeleccionados.some(sel => sel.id === s.id);
                  return (
                    <div 
                      key={s.id} 
                      className={`beauty-service-card ${estaSeleccionado ? 'selected' : ''}`} 
                      onClick={() => {
                        if (estaSeleccionado) {
                          setServiciosSeleccionados(serviciosSeleccionados.filter(sel => sel.id !== s.id));
                        } else {
                          setServiciosSeleccionados([...serviciosSeleccionados, s]);
                        }
                      }}
                    >
                      <div className="image-container">
                        <img src={s.imagen_url} alt={s.nombre} />
                        {estaSeleccionado && <div className="badge-selected">✓</div>}
                      </div>
                      <div className="info-container">
                        <h3>{s.nombre}</h3>
                        <p className="price">${s.precio.toLocaleString()}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: CALENDARIO, HORAS Y CARRITO */}
        <div className="beauty-column">
          <div className="card-wrapper">
            <label className="section-title">3. Selecciona Fecha y Hora</label>
            <div className="beauty-calendar-box">
              <Calendar onChange={setFechaSeleccionada} value={fechaSeleccionada} minDate={new Date()} />
            </div>

            <label className="sub-title">Horas libres para el {fechaSeleccionada.toLocaleDateString()}:</label>
            {horasDisponiblesCliente.length === 0 ? (
              <p className="no-hours-alert">⚠️ No quedan horarios disponibles para este día.</p>
            ) : (
              <div className="beauty-hours-grid">
                {horasDisponiblesCliente.map(hora => (
                  <button 
                    type="button" 
                    key={hora} 
                    className={`beauty-hora-btn ${horaSeleccionada === hora ? 'active' : ''}`} 
                    onClick={() => setHoraSeleccionada(hora)}
                  >
                    {hora}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SECCIÓN DEL CARRITO DINÁMICO */}
          <div className="card-wrapper cart-section">
            <label className="section-title">🛒 Resumen de tu Reserva</label>
            {serviciosSeleccionados.length === 0 ? (
              <p className="empty-cart-text">Tu carrito está vacío. Selecciona servicios a la izquierda.</p>
            ) : (
              <div className="cart-content">
                <ul className="cart-items-list">
                  {serviciosSeleccionados.map(s => (
                    <li key={s.id} className="cart-item">
                      <span>✨ {s.nombre}</span>
                      <span className="cart-item-price">${s.precio.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="cart-divider"></div>
                
                <div className="cart-totals">
                  <div className="total-row">
                    <span>Total Servicios:</span>
                    <strong className="value-total">${totalCosto.toLocaleString()}</strong>
                  </div>
                  <div className="total-row abono-highlight">
                    <span>Abono para reservar (20%):</span>
                    <strong className="value-abono">${abonoRequerido.toLocaleString()}</strong>
                  </div>
                  <p className="abono-footnote">* El 80% restante se paga directamente en el local el día de la cita.</p>
                </div>
              </div>
            )}

            <button 
              type="submit" 
              className="beauty-btn-submit" 
              disabled={status.loading || serviciosSeleccionados.length === 0 || !horaSeleccionada}
            >
              {status.loading ? "Procesando tu cita..." : "Agendar Cita vía WhatsApp"}
            </button>
            
            {status.error && <div className="beauty-alert-error">{status.error}</div>}
          </div>
        </div>

      </form>
    </div>
  );
}