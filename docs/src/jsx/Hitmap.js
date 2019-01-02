//  Copyright (c) 2018-present, GM Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.

// #BEGIN EXAMPLE
import React, { useState } from "react";

import Worldview, { Axes, Cubes, DEFAULT_CAMERA_STATE, Overlay, Spheres, getCSSColor } from "regl-worldview";

// #BEGIN EDITABLE
function HitmapDemo() {
  const getHitmapId = (shape) => shape.hitmapId || 0;
  const numberToColor = (number, max, a = 1) => {
    const i = (number * 255) / max;
    const r = Math.round(Math.sin(0.024 * i + 0) * 127 + 128) / 255;
    const g = Math.round(Math.sin(0.024 * i + 2) * 127 + 128) / 255;
    const b = Math.round(Math.sin(0.024 * i + 4) * 127 + 128) / 255;
    return { r, g, b, a };
  };

  const [clickedId, setClickedId] = useState(7);
  const [cameraState, setCameraState] = useState({
    ...DEFAULT_CAMERA_STATE,
    distance: 145,
    phi: 1.22,
    thetaOffset: 0,
  });

  const objectMap = {};

  // Generate shapes and update the map
  const count = 20;
  const cubeGap = 5;

  // generate cubes
  let hitmapIdCounter = 1;
  const cubes = new Array(count).fill(0).map((_, idx) => {
    const totalLen = count * cubeGap;
    const posX = -totalLen / 2 + idx * cubeGap;
    const posY = Math.sin(posX) * 30;
    const posZ = Math.cos(posX) * 20;
    const hitmapId = hitmapIdCounter++;
    const isClicked = clickedId === hitmapId;
    const scale = isClicked ? { x: 10, y: 10, z: 10 } : { x: 5, y: 5, z: 5 };
    const alpha = isClicked ? 1 : 0.2 + idx / count;
    return {
      hitmapId,
      pose: {
        orientation: { x: 0, y: 0, z: 0, w: 1 },
        position: { x: posX, y: posY, z: posZ },
      },
      scale,
      color: numberToColor(idx, count, alpha),
      info: {
        description: "additional cube info",
        objectId: hitmapId + 10000,
      },
    };
  });

  // generate spheres
  const spheres = new Array(count).fill(0).map((_, idx) => {
    const totalLen = count * cubeGap * 1.1;
    const posX = -totalLen / 2 + idx * cubeGap * 1.1;
    const posY = -Math.sin(posX) * 30;
    const posZ = -Math.cos(posX) * 20;

    const hitmapId = hitmapIdCounter++;
    const isClicked = clickedId === hitmapId;
    const scale = isClicked ? { x: 10, y: 10, z: 10 } : { x: 5, y: 5, z: 5 };
    const alpha = isClicked ? 1 : 0.2 + idx / count;
    return {
      hitmapId,
      pose: {
        orientation: { x: 0, y: 0, z: 0, w: 1 },
        position: { x: posY, y: posX, z: posZ },
      },
      scale,
      color: numberToColor(count - idx - 1, count, alpha),
      info: {
        description: "additional sphere info",
        objectId: hitmapId + 1000,
      },
    };
  });

  cubes.forEach((object) => {
    if (object.hitmapId) {
      objectMap[object.hitmapId] = { object, type: "cube" };
    }
  });

  spheres.forEach((object) => {
    if (object.hitmapId) {
      objectMap[object.hitmapId] = { object, type: "sphere" };
    }
  });

  const textMarkers = [];
  if (clickedId !== undefined) {
    const clickedObj = objectMap[clickedId];
    if (clickedObj) {
      const {
        object: {
          hitmapId,
          pose: { orientation, position },
          info,
          color,
        },
        type,
      } = clickedObj;
      let text = `hitmapId: ${hitmapId}\nx: ${position.x}\ny: ${position.y}\nz: ${position.z}`;
      if (info) {
        text += `\ndescription: ${info.description}\nobjectId: ${info.objectId}`;
      }

      const id = textMarkers.length;
      textMarkers.push({
        id,
        text,
        color: { r: 1, g: 1, b: 1, a: 1 },
        pose: {
          orientation,
          position: { x: position.x + 2, y: position.y, z: position.z },
        },
        scale: { x: 1, y: 1, z: 1 },
        info: {
          title: type,
          color,
        },
      });
    }
  }

  return (
    <Worldview
      cameraState={cameraState}
      onCameraStateChange={(cameraState) => {
        setCameraState(cameraState);
      }}
      onClick={(e, arg) => {
        if (clickedId === arg.clickedObjectId) {
          setClickedId(undefined);
        } else {
          setClickedId(arg.clickedObjectId);
        }
      }}>
      <Cubes getHitmapId={getHitmapId}>{cubes}</Cubes>
      <Spheres getHitmapId={getHitmapId}>{spheres}</Spheres>
      <Overlay
        renderItem={({ item, coordinates, dimension: { width, height } }) => {
          if (!coordinates) {
            return null;
          }
          const [left, top] = coordinates;
          if (left < -10 || top < -10 || left > width + 10 || top > height + 10) {
            return null; // Don't render anything that's too far outside of the canvas
          }

          const {
            text,
            info: { color, title },
          } = item;
          return (
            <div
              key={item.id}
              style={{
                transform: `translate(${left.toFixed()}px,${top.toFixed()}px)`,
                flexDirection: "column",
                position: "absolute",
                background: "rgba(0, 0, 0, 0.8)",
                color: "white",
                maxWidth: 250,
                pointerEvents: "none",
                willChange: "transform",
                fontSize: 12,
                padding: 8,
                whiteSpace: "pre-line",
              }}>
              <div style={{ color: getCSSColor(color) }}>{title}</div>
              <div>{text}</div>
            </div>
          );
        }}>
        {textMarkers}
      </Overlay>
      <Axes />
    </Worldview>
  );
}
// #END EXAMPLE
export default HitmapDemo;
