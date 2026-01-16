'use client'

import React from 'react'
import LiquidGlassBase  from 'liquid-glass-react'

type Props = React.ComponentProps<typeof LiquidGlassBase>;

const LiquidGlassComponent = (props: Props) => {
  return (
    <LiquidGlassBase
    {...props}
      mouseContainer={props.mouseContainer}
    >
      {props.children}
    </LiquidGlassBase>
  );
}

LiquidGlassComponent.displayName = 'LiquidGlassComponent';

export default LiquidGlassComponent;
