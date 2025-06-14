// components/user/Button.js
import React  from "react";
import { Button as ShadButton } from "@/components/ui/button";
import { useNode } from "@craftjs/core";

export const Button = ({size, variant, color, children}) => {
  const { connectors: {connect, drag} } = useNode();
  return (
    <ShadButton ref={ref => connect(drag(ref))} size={size} variant={variant} color={color}>
      {children}
    </ShadButton>
  )
}