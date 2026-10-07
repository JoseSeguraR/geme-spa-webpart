import * as React from 'react';
import VistaPlantilla from './VistaPlantilla';

export type VistaInicioProps = {
  userDisplayName: string;
};

export default function VistaInicio(props: VistaInicioProps): React.ReactElement {
  const { userDisplayName } = props;

  return (
    <div>
      <VistaPlantilla titulo="Inicio" rutaHash="inicio" />
      <p className="mt-3 mb-0">
        Bienvenido{userDisplayName ? `, ${userDisplayName}` : ''} al landing principal de GEME.
      </p>
    </div>
  );
}
