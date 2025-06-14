// components/user/Card.js
import React  from "react";
import { Text } from "./Text";
import { Button } from "./Button";
import { Container } from "./Container";
import { useNode } from "@craftjs/core";

export const Card = ({background, padding = 20}) => {
  const { connectors: {connect, drag} } = useNode();
  return (
    <Container ref={ref => connect(drag(ref))} background={background} padding={padding}>
      <div className="text-only">
        <Text text="Title" fontSize={20} />
        <Text text="Subtitle" fontSize={15} />
      </div>
      <div className="buttons-only">
        <Button size="small" text="Learn more" variant="default" color="primary" />
      </div>
    </Container>
  )
}
