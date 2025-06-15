import React from "react";
import { Button as ShadcnButton } from "@/components/ui/button"; // Rename to avoid confusion
import { useEditor, Element } from "@craftjs/core";
import { Text } from "@/app/components/user/Text";
import { Container } from "@/app/components/user/Container";
import { Card } from "@/app/components/user/Card";
import { Button as UserButton } from "@/app/components/user/Button"; // Import user Button separately

export const Toolbox = () => {
  const { connectors, query } = useEditor();

  return (
    <div className="px-2 py-2">
      <div className="flex flex-col items-center justify-center gap-1">
        <div className="pb-2">
          <p className="text-sm">Drag to add</p>
        </div>
        <div className="flex flex-col w-full">
          <ShadcnButton
            ref={(ref) =>
              connectors.create(ref, <UserButton size="sm"
                  variant="outline"
                  color="default"
                  text="Click"/>)
            }
            variant="default"
          >
            Button
          </ShadcnButton>
        </div>
        <div className="flex flex-col w-full">
          <ShadcnButton
            ref={(ref) => connectors.create(ref, <Text text="Hi world" />)}
            variant="default"
          >
            Text
          </ShadcnButton>
        </div>
        <div className="flex flex-col w-full">
          <ShadcnButton
            ref={(ref) =>
              connectors.create(
                ref,
                <Element is={Container} padding={20} canvas />
              )
            }
            variant="default"
          >
            Container
          </ShadcnButton>
        </div>
        <div className="flex flex-col w-full">
          <ShadcnButton
            ref={(ref) => connectors.create(ref, <Card />)}
            variant="default"
          >
            Card
          </ShadcnButton>
        </div>
      </div>
    </div>
  );
};