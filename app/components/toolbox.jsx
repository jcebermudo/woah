import React from "react";
import { Button } from "@/app/components/user/Button";
import { useEditor } from "@craftjs/core";
import { Text } from "@/app/components/user/Text";
import { Container } from "@/app/components/user/Container";
import { Card } from "@/app/components/user/Card";


export const Toolbox = () => {
  const { connectors, query } = useEditor();

  return (
    <div className="px-2 py-2">
      <div className="flex flex-col items-center justify-center gap-1">
        <div className="pb-2">
          <p className="text-sm">Drag to add</p>
        </div>
        <div className="flex flex-col w-full">
          <Button
            ref={(ref) =>
              connectors.create(ref, <Button text="Click me" size="small" />)
            }
            variant="default"
          >
            Button
          </Button>
        </div>
        <div className="flex flex-col w-full">
          <Button
            ref={(ref) => connectors.create(ref, <Text text="Hi world" />)}
            variant="default"
          >
            Text
          </Button>
        </div>
        <div className="flex flex-col w-full">
          <Button
            ref={(ref) =>
              connectors.create(
                ref,
                <Element is={Container} padding={20} canvas />,
              )
            }
            variant="default"
          >
            Container
          </Button>
        </div>
        <div className="flex flex-col w-full">
          <div className="flex flex-col w-full">
            <Button
              ref={(ref) => connectors.create(ref, <Card />)}
              variant="default"
            >
              Card
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
