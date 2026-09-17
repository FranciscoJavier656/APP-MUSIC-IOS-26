import React from 'react';

export const YagamiLoader = () => {
  return (
    <div className="yagami-loader-wrapper">
      <div className="glass-orb">
        {/* Ondas continuas de gel simulando audio/fluido */}
        <div className="wave-container">
          <div className="wave wave1"></div>
          <div className="wave wave2"></div>
          <div className="wave wave3"></div>
        </div>
        
        {/* Tipografía Premium */}
        <div className="brand-container">
          <span className="brand-name">YAGAMI</span>
          <span className="brand-suffix">TECH</span>
        </div>
      </div>

      <style>{`
        .yagami-loader-wrapper {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          min-height: 250px;
          background: transparent;
        }

        /* Contenedor Glassmorphism */
        .glass-orb {
          position: relative;
          width: 160px;
          height: 160px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.03);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3),
                      inset 0 0 20px rgba(0, 150, 255, 0.1);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
          animation: pulseGlow 3s infinite alternate ease-in-out;
        }

        /* Texto de la Marca */
        .brand-container {
          position: absolute;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          pointer-events: none;
        }

        .brand-name {
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;
          font-size: 22px;
          font-weight: 800;
          letter-spacing: 3px;
          color: #ffffff;
          text-shadow: 0 4px 15px rgba(0, 0, 0, 0.8);
          margin-bottom: -2px;
        }

        .brand-suffix {
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 6px;
          color: #00f0ff; /* Acento Cyan Neón */
          text-shadow: 0 0 8px rgba(0, 240, 255, 0.5);
          margin-right: -6px; /* Balancea el tracking visual */
        }

        /* Motor de Onda de Gel Continua */
        .wave-container {
          position: absolute;
          width: 100%;
          height: 100%;
          bottom: 0;
          left: 0;
          opacity: 0.8;
        }

        .wave {
          position: absolute;
          width: 350px;
          height: 350px;
          left: -95px;
          top: 100px; /* Nivel del "agua" */
          border-radius: 43%; /* El secreto de la onda de gel */
          animation: spin 5s infinite linear;
        }

        .wave1 {
          background: rgba(0, 240, 255, 0.2);
          animation-duration: 6s;
        }

        .wave2 {
          background: rgba(0, 100, 255, 0.3);
          animation-duration: 8s;
          top: 105px;
        }

        .wave3 {
          background: rgba(20, 20, 20, 0.6); /* Oscurece el fondo para dar contraste al texto */
          animation-duration: 11s;
          top: 115px;
        }

        /* Animaciones clave */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulseGlow {
          0% { box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3), inset 0 0 20px rgba(0, 150, 255, 0.05); }
          100% { box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 0 30px rgba(0, 150, 255, 0.2); }
        }
      `}</style>
    </div>
  );
};
