import { BaseLinearDisplayComponent } from "@jbrowse/plugin-linear-genome-view";
import { observer } from "mobx-react";
import React from "react";
// import { Axis, LEFT, RIGHT } from 'react-d3-axis'

export const YScaleBar = observer(
  ({ model, orientation }: { model: any; orientation?: string }) => {
    const { ticks } = model;

    return (
      <Axis
        {...ticks}
        format={(n: number) => n}
        style={{ orient: orientation === "left" ? LEFT : RIGHT }}
      />
    );
  },
);

const HgbDisplay = observer((props: { model: any }) => {
  const { model } = props;
  const { height, needsScalebar } = model;
  return (
    <div>
      <BaseLinearDisplayComponent {...props} />
      {needsScalebar ? (
        <svg
          style={{
            position: "absolute",
            top: 0,
            left: 300,
            pointerEvents: "none",
            height,
            width: 50,
          }}
        >
          <YScaleBar model={model} />
        </svg>
      ) : null}
    </div>
  );
});

export default HgbDisplay;
