// components/user/Text.js
import React from "react";

export const Text = ({text, fontSize}) => {
  return (
      <div>
         <p style={{fontSize}}>{text}</p>
      </div>
  )
}