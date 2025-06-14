// components/user/Card.js
import {useNode, Element} from "@craftjs/core";
import { Container } from "./Container";
import { Text } from "./Text";
import { Button } from "./Button";

export const Card = ({background, padding}) => {
  return (
    <Container background={background} padding={padding}>
      <Element id="Text" canvas is={Container}>
        <Text text="Title" fontSize={20} />
        <Text text="Subtitle" fontSize={15} />
      </Element>
      <Element id="Button" canvas is={Container}>
        <Button size="small" text="Learn more" />
      </Element>
    </Container>
  )
}