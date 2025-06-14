// components/user/Button.js
import React  from "react";
import { Button as ShadButton } from "@/components/ui/button";

export const Button = ({size, variant, color, children}) => {
  return (
    <ShadButton size={size} variant={variant} color={color}>
      {children}
    </ShadButton>
  )
}