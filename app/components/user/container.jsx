// components/user/Container.js
import React from "react";
import { useNode } from "@craftjs/core";
  
export const Container = ({background, padding = 0, children}) => {
  const { connectors: {connect, drag} } = useNode();
  return (
    <div ref={ref => connect(drag(ref))} style={{margin: "5px 0", background, padding: `${padding}px`}}>
      {children}
    </div>
  )
}