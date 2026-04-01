import * as React from "react";
import { Direction } from "radix-ui";

function DirectionProvider({
  dir,
  direction,
  children,
}: {
  dir?: "ltr" | "rtl";
  direction?: "ltr" | "rtl";
  children: React.ReactNode;
}) {
  return (
    <Direction.DirectionProvider dir={direction ?? dir ?? "rtl"}>
      {children}
    </Direction.DirectionProvider>
  );
}

const useDirection = Direction.useDirection;

export { DirectionProvider, useDirection };
