import * as React from 'react';
import { useEffect, useRef, useState } from 'react';

export type MenuUsuarioProps = {
  userDisplayName: string;
  signOutUrl: string;
};

export default function MenuUsuario(props: MenuUsuarioProps): React.ReactElement {
  const { userDisplayName, signOutUrl } = props;
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) {
      return undefined;
    }

    const CerrarSiClickFuera = (evento: MouseEvent): void => {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target as Node)) {
        setAbierto(false);
      }
    };

    document.addEventListener('mousedown', CerrarSiClickFuera);
    return () => document.removeEventListener('mousedown', CerrarSiClickFuera);
  }, [abierto]);

  const AlternarMenu = (): void => {
    setAbierto((valor) => !valor);
  };

  return (
    <div className={`dropdown cowork-menu-usuario ${abierto ? 'show' : ''}`} ref={contenedorRef}>
      <button
        type="button"
        className="cowork-menu-usuario__disparador dropdown-toggle"
        onClick={AlternarMenu}
        aria-expanded={abierto}
        aria-haspopup="menu"
        id="cowork-menu-usuario-disparador"
      >
        {userDisplayName ? (
          <span className="cowork-menu-usuario__nombre">{userDisplayName}</span>
        ) : null}
      </button>
      <ul
        className={`dropdown-menu dropdown-menu-end ${abierto ? 'show' : ''}`}
        aria-labelledby="cowork-menu-usuario-disparador"
        role="menu"
      >
        <li role="none">
          <a className="dropdown-item" href={signOutUrl} role="menuitem">
            Cerrar sesión
          </a>
        </li>
      </ul>
    </div>
  );
}
