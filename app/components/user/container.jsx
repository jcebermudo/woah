// components/user/Container.js
import React from "react";

export const Container = ({background, padding = 0, children}) => {
  return (
    <div style={{margin: "5px 0", background, padding: `${padding}px`}}>
      {children}
    </div>
  )
}