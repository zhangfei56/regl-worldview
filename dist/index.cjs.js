'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var _extends = require('@babel/runtime/helpers/extends');
var _defineProperty = require('@babel/runtime/helpers/defineProperty');
var mapValues = require('lodash/mapValues');
var pickBy = require('lodash/pickBy');
var React = require('react');
var glMatrix = require('gl-matrix');
var reselect = require('reselect');
var normalizeWheel = require('normalize-wheel');
var createREGL = require('regl');
var shallowequal = require('shallowequal');
var last = require('lodash/last');
var draco3d = require('draco3d');
var omit = require('lodash/omit');
var memoize = require('lodash/memoize');
var flatten = require('lodash/flatten');
var distance = require('distance-to-line-segment');
var _objectWithoutProperties = require('@babel/runtime/helpers/objectWithoutProperties');
var earcut = require('earcut');
var TinySDF = require('@mapbox/tiny-sdf');
var difference = require('lodash/difference');
var memoizeOne = require('memoize-one');
var memoizeWeak = require('memoize-weak');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}

var _extends__default = /*#__PURE__*/_interopDefaultLegacy(_extends);
var _defineProperty__default = /*#__PURE__*/_interopDefaultLegacy(_defineProperty);
var mapValues__default = /*#__PURE__*/_interopDefaultLegacy(mapValues);
var pickBy__default = /*#__PURE__*/_interopDefaultLegacy(pickBy);
var React__namespace = /*#__PURE__*/_interopNamespace(React);
var React__default = /*#__PURE__*/_interopDefaultLegacy(React);
var normalizeWheel__default = /*#__PURE__*/_interopDefaultLegacy(normalizeWheel);
var createREGL__default = /*#__PURE__*/_interopDefaultLegacy(createREGL);
var shallowequal__default = /*#__PURE__*/_interopDefaultLegacy(shallowequal);
var last__default = /*#__PURE__*/_interopDefaultLegacy(last);
var draco3d__default = /*#__PURE__*/_interopDefaultLegacy(draco3d);
var omit__default = /*#__PURE__*/_interopDefaultLegacy(omit);
var memoize__default = /*#__PURE__*/_interopDefaultLegacy(memoize);
var flatten__default = /*#__PURE__*/_interopDefaultLegacy(flatten);
var distance__default = /*#__PURE__*/_interopDefaultLegacy(distance);
var _objectWithoutProperties__default = /*#__PURE__*/_interopDefaultLegacy(_objectWithoutProperties);
var earcut__default = /*#__PURE__*/_interopDefaultLegacy(earcut);
var TinySDF__default = /*#__PURE__*/_interopDefaultLegacy(TinySDF);
var difference__default = /*#__PURE__*/_interopDefaultLegacy(difference);
var memoizeOne__default = /*#__PURE__*/_interopDefaultLegacy(memoizeOne);
var memoizeWeak__default = /*#__PURE__*/_interopDefaultLegacy(memoizeWeak);

//  Copyright (c) 2018-present, GM Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.
class BoundingBox {
  constructor(left, top) {
    _defineProperty__default["default"](this, "left", void 0);

    _defineProperty__default["default"](this, "right", void 0);

    _defineProperty__default["default"](this, "top", void 0);

    _defineProperty__default["default"](this, "bottom", void 0);

    _defineProperty__default["default"](this, "width", void 0);

    _defineProperty__default["default"](this, "height", void 0);

    this.left = left;
    this.top = top;
    this.right = -left;
    this.bottom = -top;
    this.width = Math.abs(left) * 2;
    this.height = Math.abs(top) * 2;
  }

}

function getOrthographicBounds(zDistance, width, height) {
  const aspect = width / height; // never go below ground level

  const distanceToGround = Math.abs(zDistance);
  const left = -distanceToGround / 2 * aspect;
  const top = distanceToGround / 2;
  return new BoundingBox(left, top);
}

//  Copyright (c) 2018-present, GM Cruise LLC
const NEAR_RANGE = 0;
const FAR_RANGE = 1;
const tmp4 = [0, 0, 0, 0];
function cameraProject(out, vec, viewport, combinedProjView) {
  const vX = viewport[0],
        vY = viewport[1],
        vWidth = viewport[2],
        vHeight = viewport[3],
        n = NEAR_RANGE,
        f = FAR_RANGE; // convert: clip space -> NDC -> window coords
  // implicit 1.0 for w component

  glMatrix.vec4.set(tmp4, vec[0], vec[1], vec[2], 1.0); // transform into clip space

  glMatrix.vec4.transformMat4(tmp4, tmp4, combinedProjView); // now transform into NDC

  const w = tmp4[3];

  if (w !== 0) {
    // how to handle infinity here?
    tmp4[0] = tmp4[0] / w;
    tmp4[1] = tmp4[1] / w;
    tmp4[2] = tmp4[2] / w;
  } // and finally into window coordinates
  // the foruth component is (1/clip.w)
  // which is the same as gl_FragCoord.w


  out[0] = vX + vWidth / 2 * tmp4[0] + (0 + vWidth / 2);
  out[1] = vY + vHeight / 2 * tmp4[1] + (0 + vHeight / 2);
  out[2] = (f - n) / 2 * tmp4[2] + (f + n) / 2;
  out[3] = w === 0 ? 0 : 1 / w;
  return out;
}

function ownKeys$8(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$8(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$8(Object(source), true).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$8(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

//  Copyright (c) 2018-present, GM Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.
const rotateGLSL = `
  uniform vec3 _position;
  uniform vec4 _rotation;

  // rotate a 3d point v by a rotation quaternion q
  vec3 rotate(vec3 v, vec4 q) {
    vec3 temp = cross(q.xyz, v) + q.w * v;
    return v + (2.0 * cross(q.xyz, temp));
  }

  vec3 applyPose(vec3 point) {
    // rotate the point and then add the position of the pose
    return rotate(point, _rotation) + _position;
  }
`;
const DEFAULT_TEXT_COLOR$1 = {
  r: 1,
  g: 1,
  b: 1,
  a: 1
};
const pointToVec3$1 = ({
  x,
  y,
  z
}) => {
  return [x, y, z];
};
const orientationToVec4 = ({
  x,
  y,
  z,
  w
}) => {
  return [x, y, z, w];
};
const vec3ToPoint = ([x, y, z]) => ({
  x,
  y,
  z
});
const vec4ToOrientation = ([x, y, z, w]) => ({
  x,
  y,
  z,
  w
});
const pointToVec3Array = points => {
  const result = new Float32Array(points.length * 3);
  let i = 0;

  for (const {
    x,
    y,
    z
  } of points) {
    result[i++] = x;
    result[i++] = y;
    result[i++] = z;
  }

  return result;
};
const toRGBA = val => {
  return [val.r, val.g, val.b, val.a];
};
const vec4ToRGBA = color => ({
  r: color[0],
  g: color[1],
  b: color[2],
  a: color[3]
});
const toColor = val => Array.isArray(val) ? vec4ToRGBA(val) : val;
function getCSSColor(color = DEFAULT_TEXT_COLOR$1) {
  const {
    r,
    g,
    b,
    a
  } = color;
  return `rgba(${(r * 255).toFixed()}, ${(g * 255).toFixed()}, ${(b * 255).toFixed()}, ${a.toFixed(3)})`;
}

const toRGBAArray = colors => {
  const result = new Float32Array(colors.length * 4);
  let i = 0;

  for (const {
    r,
    g,
    b,
    a
  } of colors) {
    result[i++] = r;
    result[i++] = g;
    result[i++] = b;
    result[i++] = a;
  }

  return result;
};

const constantRGBAArray = (count, {
  r,
  g,
  b,
  a
}) => {
  const result = new Float32Array(count * 4);

  for (let i = 0; i < count; i++) {
    result[4 * i + 0] = r;
    result[4 * i + 1] = g;
    result[4 * i + 2] = b;
    result[4 * i + 3] = a;
  }

  return result;
}; // default blend func params to be mixed into regl commands


const defaultReglBlend = {
  enable: true,
  // this is the same gl.BlendFunc used by three.js by default
  func: {
    src: "src alpha",
    dst: "one minus src alpha",
    srcAlpha: 1,
    dstAlpha: "one minus src alpha"
  },
  equation: {
    rgb: "add",
    alpha: "add"
  }
};
const defaultReglDepth = {
  enable: true,
  mask: true
};
const defaultDepth = {
  enable: (context, props) => props.depth && props.depth.enable || defaultReglDepth.enable,
  mask: (context, props) => props.depth && props.depth.mask || defaultReglDepth.mask
};
const defaultBlend = _objectSpread$8(_objectSpread$8({}, defaultReglBlend), {}, {
  enable: (context, props) => props.blend && props.blend.enable || defaultReglBlend.enable,
  func: (context, props) => props.blend && props.blend.func || defaultReglBlend.func
}); // TODO: deprecating, remove before 1.x release

const blend = defaultBlend; // takes a regl command definition object and injects
// position and rotation from the object pose and also
// inserts some glsl helpers to apply the pose to points in a fragment shader

function withPose(command) {
  const {
    vert,
    uniforms
  } = command;
  const newVert = typeof vert === "function" ? (context, props) => vert(context, props).replace("#WITH_POSE", rotateGLSL) : vert.replace("#WITH_POSE", rotateGLSL);

  const newUniforms = _objectSpread$8(_objectSpread$8({}, uniforms), {}, {
    _position: (context, props) => {
      const {
        position
      } = props.pose;
      return Array.isArray(position) ? position : pointToVec3$1(position);
    },
    _rotation: (context, props) => {
      const {
        orientation: r
      } = props.pose;
      return Array.isArray(r) ? r : [r.x, r.y, r.z, r.w];
    }
  });

  return _objectSpread$8(_objectSpread$8({}, command), {}, {
    vert: newVert,
    uniforms: newUniforms
  });
}
function getVertexColors({
  colors,
  color,
  points
}) {
  if ((!colors || !colors.length) && color) {
    return constantRGBAArray(points.length, color);
  }

  if (colors) {
    // $FlowFixMe this will go away once we consolidate getVertexColors and colorBuffer
    return shouldConvert(colors) ? toRGBAArray(colors) : colors;
  }

  return [];
}

function hasNestedArrays(arr) {
  return arr.length && Array.isArray(arr[0]);
} // Returns a function which accepts a single color, an array of colors, and the number of instances,
// and returns a color attribute buffer for use in regl.
// If there are multiple colors in the colors array, one color will be assigned to each instance.
// In the case of a single color, the same color will be used for all instances.


function colorBuffer(regl) {
  const buffer = regl.buffer({
    usage: "dynamic",
    data: []
  });
  return function (color, colors, length) {
    let data, divisor;

    if (!colors || !colors.length) {
      data = shouldConvert(color) ? toRGBA(color) : color;
      divisor = length;
    } else {
      data = shouldConvert(colors) ? toRGBAArray(colors) : colors;
      divisor = 1;
    }

    return {
      buffer: buffer({
        usage: "dynamic",
        data
      }),
      divisor
    };
  };
} // used to determine if the input/array of inputs is an object like {r: 0, g: 0, b: 0} or [0,0,0]

function shouldConvert(props) {
  if (!props || hasNestedArrays(props) || !isNaN(props[0])) {
    return false;
  }

  return true;
}
function intToRGB(i = 0) {
  const r = (i >> 16 & 255) / 255;
  const g = (i >> 8 & 255) / 255;
  const b = (i & 255) / 255;
  return [r, g, b, 1];
}
function getIdFromColor(rgb) {
  const r = rgb[0] * 255;
  const g = rgb[1] * 255;
  const b = rgb[2] * 255;
  return b | g << 8 | r << 16;
}
function getIdFromPixel(rgb) {
  const r = rgb[0];
  const g = rgb[1];
  const b = rgb[2];
  return b | g << 8 | r << 16;
} // gl-matrix clone of three.js Vector3.setFromSpherical
// phi: polar angle (between poles, 0 - pi)
// theta: azimuthal angle (around equator, 0 - 2pi)

function fromSpherical(out, r, theta, phi) {
  const rSinPhi = r * Math.sin(phi);
  out[0] = rSinPhi * Math.sin(theta);
  out[1] = r * Math.cos(phi);
  out[2] = rSinPhi * Math.cos(theta);
  return out;
}

//  Copyright (c) 2018-present, GM Cruise LLC
const UNIT_X_VECTOR$1 = Object.freeze([1, 0, 0]); // reusable arrays for intermediate calculations

const TEMP_VEC3 = [0, 0, 0];
const TEMP_MAT$1 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const TEMP_QUAT$1 = [0, 0, 0, 0];

const stateSelector = state => state;

const perspectiveSelector = reselect.createSelector(stateSelector, ({
  perspective
}) => perspective);
const distanceSelector = reselect.createSelector(stateSelector, ({
  distance
}) => distance);
const phiSelector = reselect.createSelector(stateSelector, ({
  phi
}) => phi);
const thetaOffsetSelector = reselect.createSelector(stateSelector, ({
  thetaOffset
}) => thetaOffset);
const targetOrientationSelector = reselect.createSelector(stateSelector, ({
  targetOrientation
}) => targetOrientation); // the heading direction of the target

const targetHeadingSelector = reselect.createSelector(targetOrientationSelector, targetOrientation => {
  const out = glMatrix.vec3.transformQuat(TEMP_VEC3, UNIT_X_VECTOR$1, targetOrientation);
  const heading = -Math.atan2(out[1], out[0]);
  return heading;
}); // orientation of the camera

const orientationSelector = reselect.createSelector(perspectiveSelector, phiSelector, thetaOffsetSelector, (perspective, phi, thetaOffset) => {
  const result = glMatrix.quat.identity([0, 0, 0, 0]);
  glMatrix.quat.rotateZ(result, result, -thetaOffset); // phi is ignored in 2D mode

  if (perspective) {
    glMatrix.quat.rotateX(result, result, phi);
  }

  return result;
}); // position of the camera

const positionSelector = reselect.createSelector(thetaOffsetSelector, phiSelector, distanceSelector, (thetaOffset, phi, distance) => {
  const position = fromSpherical([], distance, thetaOffset, phi); // poles are on the y-axis in spherical coordinates; rearrange so they are on the z axis

  const [x, y, z] = position;
  position[0] = -x;
  position[1] = -z;
  position[2] = y;
  return position;
});
/*
Get the view matrix, which transforms points from world coordinates to camera coordinates.

An equivalent and easier way to think about this transformation is that it takes the camera from
its actual position/orientation in the world, and moves it to have position=0,0,0 and orientation=0,0,0,1.

We build up this transformation in 5 steps as demonstrated below:
   T = target
   < = direction of target
   * = target with offset (position that the camera is looking at)
   C = camera (always points toward *)

Starting point: actual positions in world coordinates

  |      *
  |  <T   C
  |
  +--------

Step 1: translate target to the origin

  |
  |  *
 <T---C----

Step 2: rotate around the origin so the target points forward

  |
  ^
  T--------
  |
  | *
  C

Step 3: translate the target-with-offset point to be at the origin

 ^
 T|
  |
  *--------
 C|
  |


Step 4: translate the camera to be at the origin
(Steps 3 and 4 are both translations, but they're kept separate because it's easier
to conceptualize: 3 uses the targetOffset and 4 uses the distance+thetaOffset+phi.)

 ^
 T
 |
 |*
 C--------
 |

Step 5: rotate the camera to point forward

 \
  T  |
     *
     C--------
     |

*/

const viewSelector = reselect.createSelector(stateSelector, orientationSelector, positionSelector, ({
  target,
  targetOffset,
  targetOrientation,
  perspective
}, orientation, position) => {
  const m = glMatrix.mat4.identity([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]); // apply the steps described above in reverse because we use right-multiplication
  // 5. rotate camera to point forward

  glMatrix.mat4.multiply(m, m, glMatrix.mat4.fromQuat(TEMP_MAT$1, glMatrix.quat.invert(TEMP_QUAT$1, orientation))); // 4. move camera to the origin

  if (perspective) {
    glMatrix.mat4.translate(m, m, glMatrix.vec3.negate(TEMP_VEC3, position));
  } // 3. move center to the origin


  glMatrix.mat4.translate(m, m, glMatrix.vec3.negate(TEMP_VEC3, targetOffset)); // 2. rotate target to point forward

  glMatrix.mat4.multiply(m, m, glMatrix.mat4.fromQuat(TEMP_MAT$1, targetOrientation)); // 1. move target to the origin

  glMatrix.mat4.translate(m, m, glMatrix.vec3.negate(TEMP_VEC3, target)); // if using orthographic camera ensure the distance from "ground"
  // stays large so no reasonably tall item goes past the camera

  if (!perspective) {
    TEMP_VEC3[0] = 0;
    TEMP_VEC3[1] = 0;
    TEMP_VEC3[2] = -2500;
    glMatrix.vec3.transformMat4(TEMP_VEC3, TEMP_VEC3, glMatrix.mat4.fromQuat(TEMP_MAT$1, glMatrix.quat.invert(TEMP_QUAT$1, targetOrientation)));
    glMatrix.mat4.translate(m, m, TEMP_VEC3);
  }

  return m;
});
const billboardRotation = reselect.createSelector(orientationSelector, targetHeadingSelector, (orientation, targetHeading) => {
  const m = glMatrix.mat4.identity(glMatrix.mat4.create());
  glMatrix.mat4.rotateZ(m, m, -targetHeading);
  glMatrix.mat4.multiply(m, m, glMatrix.mat4.fromQuat(TEMP_MAT$1, orientation));
  return m;
});
var selectors = {
  orientation: orientationSelector,
  position: positionSelector,
  targetHeading: targetHeadingSelector,
  view: viewSelector,
  billboardRotation
};

function ownKeys$7(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$7(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$7(Object(source), true).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$7(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
//  we use up on the +z axis
const UNIT_Z_VECTOR = Object.freeze([0, 0, 1]); // reusable array for intermediate calculations

const TEMP_QUAT = [0, 0, 0, 0];
const DEFAULT_CAMERA_STATE = {
  distance: 75,
  perspective: true,
  phi: Math.PI / 4,
  target: [0, 0, 0],
  targetOffset: [0, 0, 0],
  targetOrientation: [0, 0, 0, 1],
  thetaOffset: 0,
  fovy: Math.PI / 4,
  near: 0.01,
  far: 5000
};

function distanceAfterZoom(startingDistance, zoomPercent) {
  // keep distance above 0 so that percentage-based zoom always works
  return Math.max(0.001, startingDistance * (1 - zoomPercent / 100));
}

class CameraStore {
  constructor(handler = () => {}, initialCameraState = DEFAULT_CAMERA_STATE) {
    _defineProperty__default["default"](this, "state", void 0);

    _defineProperty__default["default"](this, "_onChange", void 0);

    _defineProperty__default["default"](this, "setCameraState", state => {
      // Fill in missing properties from DEFAULT_CAMERA_STATE.
      // Mutate the `state` parameter instead of copying -- this
      // matches the previous behavior of this method, which didn't
      // fill in missing properties but also didn't copy `state`.
      for (const [key, value] of Object.entries(DEFAULT_CAMERA_STATE)) {
        if (state[key] == null) {
          state[key] = value;
        }
      } // `state` must be a valid CameraState now, because we filled in
      // missing properties from DEFAULT_CAMERA_STATE.


      this.state = state;
    });

    _defineProperty__default["default"](this, "cameraRotate", ([x, y]) => {
      // This can happen in 2D mode, when both e.movementX and e.movementY are evaluated as negative and mouseX move is 0
      if (x === 0 && y === 0) {
        return;
      }

      const {
        thetaOffset,
        phi
      } = this.state;
      this.setCameraState(_objectSpread$7(_objectSpread$7({}, this.state), {}, {
        thetaOffset: thetaOffset - x,
        phi: Math.max(0, Math.min(phi + y, Math.PI))
      }));

      this._onChange(this.state);
    });

    _defineProperty__default["default"](this, "cameraMove", ([x, y]) => {
      // moveX and moveY both be 0 sometimes
      if (x === 0 && y === 0) {
        return;
      }

      const {
        targetOffset,
        thetaOffset
      } = this.state; // rotate around z axis so the offset is in the target's reference frame

      const result = [x, y, 0];
      const offset = glMatrix.vec3.transformQuat(result, result, glMatrix.quat.setAxisAngle(TEMP_QUAT, UNIT_Z_VECTOR, -thetaOffset));
      this.setCameraState(_objectSpread$7(_objectSpread$7({}, this.state), {}, {
        targetOffset: glMatrix.vec3.add(offset, targetOffset, offset)
      }));

      this._onChange(this.state);
    });

    _defineProperty__default["default"](this, "cameraZoom", zoomPercent => {
      const {
        distance
      } = this.state;
      const newDistance = distanceAfterZoom(distance, zoomPercent);

      if (distance === newDistance) {
        return;
      }

      this.setCameraState(_objectSpread$7(_objectSpread$7({}, this.state), {}, {
        distance: newDistance
      }));

      this._onChange(this.state);
    });

    this._onChange = handler;
    this.setCameraState(initialCameraState);
  }

}

const TEMP_MAT = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // This is the regl command which encapsulates the camera projection and view matrices.
// It adds the matrices to the regl context so they can be used by other commands.

var camera = (regl => {
  if (!regl) {
    throw new Error("Invalid regl instance");
  }

  return class Camera {
    constructor() {
      _defineProperty__default["default"](this, "viewportWidth", 0);

      _defineProperty__default["default"](this, "viewportHeight", 0);

      _defineProperty__default["default"](this, "cameraState", DEFAULT_CAMERA_STATE);

      _defineProperty__default["default"](this, "draw", regl({
        // adds context variables to the regl context so they are accessible from commands
        context: {
          // use functions, not lambdas here to make sure we can access
          // the regl supplied this scope: http://regl.party/api#this
          projection(context, props) {
            const {
              viewportWidth,
              viewportHeight
            } = context; // save these variables on the camera instance
            // because we need them for raycasting

            this.viewportWidth = viewportWidth;
            this.viewportHeight = viewportHeight;
            this.cameraState = props;
            return this.getProjection();
          },

          view(context, props) {
            return this.getView();
          },

          // inverse of the view rotation, used for making objects always face the camera
          billboardRotation(context, props) {
            return selectors.billboardRotation(this.cameraState);
          },

          isPerspective(context, props) {
            return this.cameraState.perspective;
          },

          fovy(context, props) {
            return this.cameraState.fovy;
          }

        },
        // adds view and projection as uniforms to every command
        // and makes them available in the shaders
        uniforms: {
          view: regl.context("view"),
          billboardRotation: regl.context("billboardRotation"),
          projection: regl.context("projection")
        }
      }));
    }

    getProjection() {
      const {
        near,
        far,
        distance,
        fovy
      } = this.cameraState;

      if (!this.cameraState.perspective) {
        const bounds = getOrthographicBounds(distance, this.viewportWidth, this.viewportHeight);
        const {
          left,
          right,
          bottom,
          top
        } = bounds;
        return glMatrix.mat4.ortho([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], left, right, bottom, top, near, far);
      }

      const aspect = this.viewportWidth / this.viewportHeight;
      return glMatrix.mat4.perspective([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], fovy, aspect, near, far);
    }

    getView() {
      return selectors.view(this.cameraState);
    } // convert a point in 3D space to a point on the screen


    toScreenCoord(viewport, point) {
      const projection = this.getProjection();
      const view = selectors.view(this.cameraState);
      const combinedProjView = glMatrix.mat4.multiply(TEMP_MAT, projection, view);
      const [x, y, z, w] = cameraProject([], point, viewport, combinedProjView);

      if (z < 0 || z > 1 || w < 0) {
        // resulting point is outside the window depth range
        return undefined;
      }

      const diffY = viewport[3] + viewport[1];
      const diffX = viewport[0]; // move the x value over based on the left of the viewport
      // and move the y value over based on the bottom of the viewport

      return [x - diffX, diffY - y, z];
    }

  };
});

const PAN_SPEED = 4;
const MOUSE_ZOOM_SPEED = 0.3;
const KEYBOARD_MOVE_SPEED = 0.3;
const KEYBOARD_ZOOM_SPEED = 150;
const KEYBOARD_SPIN_SPEED = 1.5;
const DEFAULT_KEYMAP = {
  KeyA: "moveLeft",
  KeyD: "moveRight",
  KeyE: "rotateRight",
  KeyF: "tiltUp",
  KeyQ: "rotateLeft",
  KeyR: "tiltDown",
  KeyS: "moveDown",
  KeyW: "moveUp",
  KeyX: "zoomOut",
  KeyZ: "zoomIn"
};
// attaches mouse and keyboard listeners to allow for moving the camera on user input
class CameraListener extends React__namespace.Component {
  constructor(...args) {
    super(...args);

    _defineProperty__default["default"](this, "_keyTimer", void 0);

    _defineProperty__default["default"](this, "_keys", new Set());

    _defineProperty__default["default"](this, "_buttons", new Set());

    _defineProperty__default["default"](this, "_listeners", []);

    _defineProperty__default["default"](this, "_shiftKey", false);

    _defineProperty__default["default"](this, "_metaKey", false);

    _defineProperty__default["default"](this, "_ctrlKey", false);

    _defineProperty__default["default"](this, "_el", void 0);

    _defineProperty__default["default"](this, "_rect", void 0);

    _defineProperty__default["default"](this, "_initialMouse", void 0);

    _defineProperty__default["default"](this, "_getMouseOnScreen", mouse => {
      const {
        clientX,
        clientY
      } = mouse;
      const {
        top,
        left,
        width,
        height
      } = this._rect;
      const x = (clientX - left) / width;
      const y = (clientY - top) / height;
      return [x, y];
    });

    _defineProperty__default["default"](this, "_onMouseDown", e => {
      const {
        _el
      } = this;

      if (!_el) {
        return;
      }

      e.preventDefault();

      this._buttons.add(e.button);

      _el.focus();

      this._rect = _el.getBoundingClientRect();
      this._initialMouse = this._getMouseOnScreen(e);
      this.startDragging(e);
    });

    _defineProperty__default["default"](this, "_onWindowMouseMove", e => {
      if (!this._buttons.size) {
        return;
      }

      this._shiftKey = e.shiftKey;
      const {
        cameraStore: {
          cameraMove,
          cameraRotate,
          state: {
            perspective
          }
        }
      } = this.props; // compute the amount the mouse has moved

      let moveX, moveY;

      const mouse = this._getMouseOnScreen(e); // when pointer lock is enabled, we get movementX and movementY (with direction reversed)
      // instead of the screenX/screenY changing... except, when using synergy, they come through
      // like regular mousemove events.


      if (document.pointerLockElement && (e.movementX || e.movementY)) {
        moveX = -e.movementX / this._rect.width;
        moveY = -e.movementY / this._rect.height;
      } else {
        moveX = this._initialMouse[0] - mouse[0];
        moveY = this._initialMouse[1] - mouse[1];
      }

      this._initialMouse = mouse;

      if (this._isRightMouseDown()) {
        const magnitude = this._getMagnitude(PAN_SPEED); // in orthographic mode, flip the direction of rotation so "left" means "counterclockwise"


        const x = (perspective ? moveX : -moveX) * magnitude; // do not rotate vertically in orthograhpic mode

        const y = perspective ? moveY * magnitude : 0;
        cameraRotate([x, y]);
      }

      if (this._isLeftMouseDown()) {
        const {
          x,
          y
        } = this._getMoveMagnitude();

        cameraMove([this._getMagnitude(moveX * x), this._getMagnitude(-moveY * y)]);
      }
    });

    _defineProperty__default["default"](this, "_onMouseUp", e => {
      this._buttons.delete(e.button);

      this._endDragging();
    });

    _defineProperty__default["default"](this, "_onWindowMouseUp", e => {
      const {
        _el
      } = this;

      if (!_el) {
        return;
      } // do nothing if this container had a mouseup, because we catch it in the onMouseUp handler


      if (_el.contains(e.target) || e.target === _el) {
        return;
      } // If mouseup triggers on the window outside this container, clear any active interactions.
      // This will allow a mouseup outside the browser window to be handled; otherwise the mouse
      // "sticks" in a down position until another click on this element is received.


      this._buttons.clear();

      this._endDragging();
    });

    _defineProperty__default["default"](this, "_getKeyMotion", code => {
      const moveSpeed = this._getMagnitude(KEYBOARD_MOVE_SPEED);

      const zoomSpeed = this._getMagnitude(KEYBOARD_ZOOM_SPEED);

      const spinSpeed = this._getMagnitude(KEYBOARD_SPIN_SPEED);

      const {
        keyMap,
        shiftKeys
      } = this.props;
      const action = keyMap && keyMap[code] || DEFAULT_KEYMAP[code] || false;

      if (this._shiftKey && !shiftKeys) {
        return null;
      }

      switch (action) {
        case "moveRight":
          return {
            x: moveSpeed
          };

        case "moveLeft":
          return {
            x: -moveSpeed
          };

        case "moveUp":
          return {
            y: moveSpeed
          };

        case "moveDown":
          return {
            y: -moveSpeed
          };

        case "zoomIn":
          return {
            zoom: zoomSpeed
          };

        case "zoomOut":
          return {
            zoom: -zoomSpeed
          };

        case "rotateLeft":
          return {
            yaw: -spinSpeed
          };

        case "rotateRight":
          return {
            yaw: spinSpeed
          };

        case "tiltUp":
          return {
            tilt: -spinSpeed
          };

        case "tiltDown":
          return {
            tilt: spinSpeed
          };

        case false:
          return null;

        default:
          console.warn("Unrecognized key action:", action);
          return null;
      }
    });

    _defineProperty__default["default"](this, "_onKeyDown", e => {
      const {
        keyMap
      } = this.props;
      this._shiftKey = e.shiftKey;
      this._metaKey = e.metaKey;
      this._ctrlKey = e.ctrlKey;
      const code = e.nativeEvent.code; // ignore repeated keydown events

      if (e.repeat || this._keys.has(code)) {
        e.stopPropagation();
        e.preventDefault();
        return;
      }

      if (e.altKey || e.ctrlKey || e.metaKey) {
        // we don't currently handle these modifiers
        return;
      } // allow null, false, or empty keymappings which explicitly cancel Worldview from processing that key


      if (keyMap && code in keyMap && !keyMap[code]) {
        return false;
      } // if we respond to this key, start the update timer


      if (this._getKeyMotion(code)) {
        this._keys.add(code);

        this._startKeyTimer();

        e.stopPropagation();
        e.preventDefault();
      }
    });

    _defineProperty__default["default"](this, "_onKeyUp", e => {
      this._shiftKey = e.shiftKey;
      this._metaKey = e.metaKey;
      this._ctrlKey = e.ctrlKey;

      this._keys.delete(e.nativeEvent.code);
    });

    _defineProperty__default["default"](this, "_onWheel", e => {
      // stop the wheel event here, as wheel propagation through the entire dom
      // can cause the browser to slow down & thrash
      e.preventDefault();
      e.stopPropagation();
      this._shiftKey = e.shiftKey; // with osx trackpad scrolling, slow to medium pixelY is around +/- 1 to 10
      // external mouse wheels generally come in higher values around +/- 30 to 50

      const {
        pixelX,
        pixelY
      } = normalizeWheel__default["default"](e); // shift+scroll on an external mouse may scroll in the X direction instead of Y

      const wheelAmount = pixelY || pixelX; // we use positive value to indicate zooming in
      // and negative value to zoom out, so reverse the direction of the wheel

      const dir = Math.sign(wheelAmount) * -1;
      const amount = Math.abs(wheelAmount); // restrict zoom percentage per tick to between 1 & 50 percent

      const percentage = Math.max(1, Math.min(amount, 50)); // support shift+wheel magnitude adjustment

      const zoomPercentage = this._getMagnitude(percentage * dir * MOUSE_ZOOM_SPEED);

      this.props.cameraStore.cameraZoom(zoomPercentage);
    });

    _defineProperty__default["default"](this, "_onBlur", e => {
      this._keys = new Set();
      this._ctrlKey = false;
      this._shiftKey = false;
      this._metaKey = false;

      this._stopKeyTimer();
    });

    _defineProperty__default["default"](this, "_onContextMenu", e => {
      e.preventDefault();
      e.stopPropagation();
    });
  }

  componentDidMount() {
    const {
      _el
    } = this;

    if (!_el) {
      return;
    }

    this._rect = _el.getBoundingClientRect();

    const listen = (target, name, fn) => {
      target.addEventListener(name, fn);

      this._listeners.push({
        target,
        name,
        fn
      });
    };

    listen(document, "blur", this._onBlur);
    listen(window, "mouseup", this._onWindowMouseUp);

    _el.addEventListener("wheel", this._onWheel, {
      passive: false
    });
  }

  componentWillUnmount() {
    this._listeners.forEach(listener => {
      listener.target.removeEventListener(listener.name, listener.fn);
    });

    this._endDragging();

    const {
      _el
    } = this;

    if (!_el) {
      return;
    }

    _el.removeEventListener("wheel", this._onWheel, {
      passive: false
    });
  }

  focus() {
    if (this._el) {
      this._el.focus();
    }
  }

  _isLeftMouseDown() {
    return this._buttons.has(0);
  }

  _isRightMouseDown() {
    return this._buttons.has(2);
  }

  _getMagnitude(base = 1) {
    return this._shiftKey ? base / 10 : base;
  }

  _getMoveMagnitude() {
    // avoid interference with drawing tools
    if (this._ctrlKey) {
      return {
        x: 0,
        y: 0
      };
    }

    const {
      cameraStore: {
        state: {
          distance,
          perspective
        }
      }
    } = this.props;

    if (perspective) {
      // in perspective mode its more like flying, so move by the magnitude
      // we use the camera distance as a heuristic
      return {
        x: distance,
        y: distance
      };
    } // in orthographic mode we know the exact viewable area
    // which is a square so we can move exactly percentage within it


    const {
      width,
      height
    } = this._rect;
    const bounds = getOrthographicBounds(distance, width, height);
    return {
      x: bounds.width,
      y: bounds.height
    };
  }

  startDragging(e) {
    if (e.button !== 0 && this._el && typeof this._el.requestPointerLock === "function") {
      this._el.requestPointerLock();
    }

    window.addEventListener("mousemove", this._onWindowMouseMove);
  }

  _endDragging() {
    window.removeEventListener("mousemove", this._onWindowMouseMove);

    if (typeof document.exitPointerLock === "function") {
      document.exitPointerLock();
    }
  }

  _moveKeyboard(dt) {
    const motion = {
      x: 0,
      y: 0,
      zoom: 0,
      yaw: 0,
      tilt: 0
    };

    this._keys.forEach(code => {
      const {
        x = 0,
        y = 0,
        zoom = 0,
        yaw = 0,
        tilt = 0
      } = this._getKeyMotion(code) || {};
      motion.x += x;
      motion.y += y;
      motion.zoom += zoom;
      motion.yaw += yaw;
      motion.tilt += tilt;
    });

    const {
      cameraStore: {
        cameraMove,
        cameraRotate,
        cameraZoom,
        state: {
          perspective
        }
      }
    } = this.props;

    if (motion.x || motion.y) {
      const {
        x,
        y
      } = this._getMoveMagnitude();

      cameraMove([motion.x * x * dt, motion.y * y * dt]);
    }

    if (motion.yaw || perspective && motion.tilt) {
      cameraRotate([motion.yaw * dt, perspective ? motion.tilt * dt : 0]);
    }

    if (motion.zoom) {
      cameraZoom(motion.zoom * dt);
    }
  }

  _startKeyTimer(lastStamp) {
    if (this._keyTimer) {
      return;
    }

    this._keyTimer = requestAnimationFrame(stamp => {
      this._moveKeyboard((lastStamp ? stamp - lastStamp : 0) / 1000);

      this._keyTimer = undefined; // Only start the timer if keys are still pressed.
      // We do this rather than stopping the timer in onKeyUp, because keys held
      // sometimes actually trigger repeated keyup/keydown, rather than just repeated keydown.
      // By checking currently-down keys in the requestAnimationFrame callback, we give the browser enough time to
      // handle both the keyup and keydown before checking whether we should restart the timer.

      if (this._keys.size) {
        this._startKeyTimer(stamp);
      }
    });
  }

  _stopKeyTimer() {
    if (this._keyTimer) {
      cancelAnimationFrame(this._keyTimer);
    }

    this._keyTimer = undefined;
  }

  render() {
    const {
      children
    } = this.props;
    return /*#__PURE__*/React__namespace.createElement("div", {
      tabIndex: 0,
      style: {
        outline: "none"
      },
      draggable: true,
      ref: el => this._el = el,
      onMouseDown: this._onMouseDown,
      onMouseUp: this._onMouseUp,
      onBlur: this._onBlur,
      onContextMenu: this._onContextMenu,
      onKeyDown: this._onKeyDown,
      onKeyUp: this._onKeyUp
    }, children);
  }

}

//  Copyright (c) 2018-present, GM Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.
function getNodeEnv() {
  return process && process.env && process.env.NODE_ENV;
}
/* eslint-disable no-undef */

const inWebWorker = () => global.postMessage && typeof WorkerGlobalScope !== "undefined" && self instanceof WorkerGlobalScope;

const tempVec = [0, 0, 0];
const tempMat = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
class Ray {
  constructor(origin, dir, point) {
    _defineProperty__default["default"](this, "origin", void 0);

    _defineProperty__default["default"](this, "dir", void 0);

    _defineProperty__default["default"](this, "point", void 0);

    this.origin = origin;
    this.dir = dir;
    this.point = point;
  }

  distanceToPoint(point) {
    return glMatrix.vec3.distance(this.origin, point);
  } // https://commons.apache.org/proper/commons-math/javadocs/api-3.6/src-html/org/apache/commons/math3/geometry/euclidean/threed/Plane.html#line.394


  planeIntersection(planeCoordinate, planeNormal) {
    const d = glMatrix.vec3.dot(planeNormal, planeCoordinate);
    const cosine = glMatrix.vec3.dot(planeNormal, this.dir);

    if (cosine === 0) {
      return null;
    }

    const x = (d - glMatrix.vec3.dot(planeNormal, this.origin)) / cosine;
    const contact = glMatrix.vec3.add([0, 0, 0], this.origin, glMatrix.vec3.scale(tempVec, this.dir, x));
    return contact;
  }

} // adapted from https://github.com/regl-project/regl/blob/master/example/raycast.js

function getRayFromClick(camera, {
  clientX,
  clientY,
  width,
  height
}) {
  const projectionMatrix = camera.getProjection();
  const viewMatrix = camera.getView();
  const vp = glMatrix.mat4.multiply(tempMat, projectionMatrix, viewMatrix);
  const invVp = glMatrix.mat4.invert(tempMat, vp);
  const mouseX = 2.0 * clientX / width - 1.0;
  const mouseY = -2.0 * clientY / height + 1.0; // get a single point on the camera ray.

  const rayPoint = glMatrix.vec3.transformMat4([0, 0, 0], [mouseX, mouseY, 0.0], invVp); // get the position of the camera.

  const rayOrigin = glMatrix.vec3.transformMat4([0, 0, 0], [0, 0, 0], glMatrix.mat4.invert(tempMat, viewMatrix));
  const rayDir = glMatrix.vec3.normalize([0, 0, 0], glMatrix.vec3.subtract(tempVec, rayPoint, rayOrigin));
  return new Ray(rayOrigin, rayDir, rayPoint);
}

//  Copyright (c) 2018-present, GM Cruise LLC
// $FlowFixMe
var WorldviewReactContext = /*#__PURE__*/React__default["default"].createContext(undefined);

const SUPPORTED_MOUSE_EVENTS = ["onClick", "onMouseUp", "onMouseMove", "onMouseDown", "onDoubleClick"];
// Component to dispatch children (for drawing) and hitmap props and a reglCommand to the render loop to render with regl.
class Command extends React__namespace.Component {
  constructor(props) {
    super(props); // In development put a check in to make sure the reglCommand prop is not mutated.
    // Similar to how react checks for unsupported or deprecated calls in a development build.

    _defineProperty__default["default"](this, "context", void 0);

    if (getNodeEnv() !== "production") {
      // $FlowFixMe
      this.shouldComponentUpdate = nextProps => {
        if (nextProps.reglCommand !== this.props.reglCommand) {
          console.error("Changing the regl command prop on a <Command /> is not supported.");
        }

        return true;
      };
    }
  }

  componentDidMount() {
    const context = this.context;

    if (!context) {
      return;
    }

    context.onMount(this, this.props.reglCommand);

    this._updateContext();
  }

  componentDidUpdate() {
    this._updateContext();
  }

  componentWillUnmount() {
    const context = this.context;

    if (!context) {
      return;
    }

    context.onUnmount(this);
  }

  _updateContext() {
    const context = this.context;

    if (!context) {
      return;
    }

    const {
      reglCommand,
      layerIndex,
      getChildrenForHitmap
    } = this.props;
    const children = this.props.children || this.props.drawProps;

    if (children == null) {
      return;
    }

    context.registerDrawCall({
      instance: this,
      reglCommand,
      children,
      layerIndex,
      getChildrenForHitmap
    });
  }

  handleMouseEvent(objects, ray, e, mouseEventName) {
    const mouseHandler = this.props[mouseEventName];

    if (!mouseHandler || !objects.length) {
      return;
    }

    mouseHandler(e, {
      ray,
      objects
    });
  }

  render() {
    return /*#__PURE__*/React__namespace.createElement(WorldviewReactContext.Consumer, null, ctx => {
      if (ctx) {
        this.context = ctx;
      }

      return null;
    });
  }

}

_defineProperty__default["default"](Command, "displayName", "Command");

//  Copyright (c) 2018-present, GM Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.
// Takes an array of [value, key] and aggregates across the keys. Results in a Map of [key, values[]], in order of the
// keys as seen in the array.
function aggregate(array) {
  const aggregationMap = new Map();
  array.forEach(([item, key]) => {
    const existingItems = aggregationMap.get(key) || [];
    existingItems.push(item);

    if (!aggregationMap.has(key)) {
      aggregationMap.set(key, existingItems);
    }
  });
  return aggregationMap;
}

// Jest does not include ResizeObserver.
class ResizeObserverMock {
  constructor(callback) {
    _defineProperty__default["default"](this, "_callback", void 0);

    this._callback = callback;
  }

  observe() {
    const entry = {
      contentRect: {
        width: 150,
        height: 150
      }
    };

    this._callback([entry]);
  }

  unobserve() {}

}

const ResizeObserverImpl = process.env.NODE_ENV === "test" || inWebWorker() ? ResizeObserverMock : ResizeObserver; // Calculates the dimensions of the parent element, and passes those dimensions to the child function.
// Uses resizeObserver, which is very performant.
// Works by rendering an empty div, getting the parent element, and then once we know the dimensions of the parent
// element, rendering the children. After the initial render it just observes the parent element.
// We expect the parent element to never change.

function Dimensions({
  children
}) {
  const [parentElement, setParentElement] = React.useState(undefined);
  const [dimensions, setDimensions] = React.useState(); // This resizeObserver should never change.

  const [resizeObserver] = React.useState(() => new ResizeObserverImpl(entries => {
    if (!entries || !entries.length) {
      return;
    } // We only observe a single element, so just use the first entry.
    // We have to round because these could be sub-pixel values.


    const newWidth = Math.round(entries[0].contentRect.width);
    const newHeight = Math.round(entries[0].contentRect.height);
    const newLeft = Math.round(entries[0].contentRect.left);
    const newTop = Math.round(entries[0].contentRect.top);
    setDimensions({
      width: newWidth,
      height: newHeight,
      top: newTop,
      left: newLeft
    });
  })); // This should only fire once, because `dimensions` should only be undefined at the beginning.

  const setParentElementRef = React.useCallback(element => {
    if (element) {
      setParentElement(element.parentElement);
    }
  }, []);
  React.useEffect(() => {
    if (!parentElement) {
      return;
    }

    resizeObserver.observe(parentElement); // Make sure to unobserve when we unmount the component.

    return () => resizeObserver.unobserve(parentElement);
  }, [parentElement, resizeObserver]); // This only happens during the first render - we use it to grab the parentElement of this div.

  if (dimensions == null) {
    return /*#__PURE__*/React__default["default"].createElement("div", {
      ref: setParentElementRef
    });
  }

  return children(dimensions);
}

function fillArray(start, length) {
  return new Array(length).fill(0).map((_, index) => start + index);
}

/*
 * This object manages the mapping between objects that are rendered into the scene and their IDs.
 * It supplies an API for generating IDs for a rendered object and then accessing those objects based on their ID.
 */
class HitmapObjectIdManager {
  constructor() {
    _defineProperty__default["default"](this, "_objectsByObjectHitmapIdMap", {});

    _defineProperty__default["default"](this, "_commandsByObjectMap", new Map());

    _defineProperty__default["default"](this, "_nextObjectHitmapId", 1);

    _defineProperty__default["default"](this, "_instanceIndexByObjectHitmapIdMap", {});

    _defineProperty__default["default"](this, "assignNextColors", (command, object, count) => {
      if (count < 1) {
        throw new Error("Must get at least 1 id");
      }

      const ids = fillArray(this._nextObjectHitmapId, count);
      this._nextObjectHitmapId = last__default["default"](ids) + 1; // Instanced rendering - add to the instanced ID map.

      if (count > 1) {
        ids.forEach((id, index) => {
          this._instanceIndexByObjectHitmapIdMap[id] = index;
        });
      } // Store the mapping of ID to original marker object


      for (const id of ids) {
        this._objectsByObjectHitmapIdMap[id] = object;
      }

      this._commandsByObjectMap.set(object, command); // Return colors from the IDs.


      const colors = ids.map(id => intToRGB(id));
      return colors;
    });

    _defineProperty__default["default"](this, "getObjectByObjectHitmapId", objectHitmapId => {
      return {
        object: this._objectsByObjectHitmapIdMap[objectHitmapId],
        instanceIndex: this._instanceIndexByObjectHitmapIdMap[objectHitmapId]
      };
    });

    _defineProperty__default["default"](this, "getCommandForObject", object => {
      return this._commandsByObjectMap.get(object);
    });
  }

}

//
//  Copyright (c) 2019-present, Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.
function signal() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  promise.resolve = resolve;
  promise.reject = reject;
  return promise;
}

//
// Wait for the previous promise to resolve before starting the next call to the function.
function queuePromise(fn) {
  // Whether we are currently waiting for a promise returned by `fn` to resolve.
  let calling = false; // The list of calls made to the function was made while a call was in progress.

  const nextCalls = [];

  function queuedFn(...args) {
    if (calling) {
      const returnPromise = signal();
      nextCalls.push({
        args,
        promise: returnPromise
      });
      return returnPromise;
    }

    return start(...args);
  }

  function start(...args) {
    calling = true;
    const promise = fn(...args).finally(() => {
      calling = false;
      queuedFn.currentPromise = undefined;

      if (nextCalls.length) {
        const {
          promise: nextPromise,
          args: nextArgs
        } = nextCalls.shift();
        start(...nextArgs).then(result => nextPromise.resolve(result)).catch(error => nextPromise.reject(error));
      }
    });
    queuedFn.currentPromise = promise;
    return promise;
  }

  return queuedFn;
}

function ownKeys$6(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$6(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$6(Object(source), true).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$6(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

// Compile instructions with an initialized regl context into a regl command.
// If the instructions are a function, pass the context to the instructions and compile the result
// of the function; otherwise, compile the instructions directly
function compile(regl, cmd) {
  const src = cmd(regl);
  return typeof src === "function" ? src : regl(src);
} // This is made available to every Command component as `this.context`.
// It contains all the regl interaction code and is responsible for collecting and executing
// draw calls, hitmap calls, and raycasting.


class WorldviewContext {
  // store every compiled command object compiled for debugging purposes
  // group all initialized data together so it can be checked for existence to verify initialization is complete
  constructor({
    dimension,
    canvasBackgroundColor,
    cameraState,
    onCameraStateChange,
    contextAttributes
  }) {
    _defineProperty__default["default"](this, "_commands", new Set());

    _defineProperty__default["default"](this, "_compiled", new Map());

    _defineProperty__default["default"](this, "_drawCalls", new Map());

    _defineProperty__default["default"](this, "_frame", void 0);

    _defineProperty__default["default"](this, "_needsPaint", false);

    _defineProperty__default["default"](this, "_paintCalls", new Map());

    _defineProperty__default["default"](this, "_hitmapObjectIdManager", new HitmapObjectIdManager());

    _defineProperty__default["default"](this, "_cachedReadHitmapCall", undefined);

    _defineProperty__default["default"](this, "reglCommandObjects", []);

    _defineProperty__default["default"](this, "counters", {});

    _defineProperty__default["default"](this, "dimension", void 0);

    _defineProperty__default["default"](this, "onDirty", void 0);

    _defineProperty__default["default"](this, "cameraStore", void 0);

    _defineProperty__default["default"](this, "canvasBackgroundColor", [0, 0, 0, 1]);

    _defineProperty__default["default"](this, "initializedData", void 0);

    _defineProperty__default["default"](this, "contextAttributes", void 0);

    _defineProperty__default["default"](this, "destroyed", false);

    _defineProperty__default["default"](this, "raycast", (canvasX, canvasY) => {
      if (!this.initializedData) {
        return undefined;
      }

      const {
        width,
        height
      } = this.dimension;
      return getRayFromClick(this.initializedData.camera, {
        clientX: canvasX,
        clientY: canvasY,
        width,
        height
      });
    });

    _defineProperty__default["default"](this, "onDirty", () => {
      if (undefined === this._frame) {
        this._frame = requestAnimationFrame(() => this.paint());
      } else {
        this._needsPaint = true;
      }
    });

    _defineProperty__default["default"](this, "readHitmap", queuePromise((canvasX, canvasY, enableStackedObjectEvents, maxStackedObjectCount) => {
      if (!this.initializedData) {
        return Promise.reject(new Error("regl data not initialized yet"));
      }

      const args = [canvasX, canvasY, enableStackedObjectEvents, maxStackedObjectCount];
      const cachedReadHitmapCall = this._cachedReadHitmapCall;

      if (cachedReadHitmapCall) {
        if (shallowequal__default["default"](cachedReadHitmapCall.arguments, args)) {
          // Make sure that we aren't returning the exact object identity of the mouseEventObject - we don't know what
          // callers have done with it.
          const result = cachedReadHitmapCall.result.map(([mouseEventObject, command]) => [_objectSpread$6({}, mouseEventObject), command]);
          return Promise.resolve(result);
        }

        this._cachedReadHitmapCall = undefined;
      }

      const {
        regl,
        camera,
        _fbo
      } = this.initializedData;
      const {
        width,
        height
      } = this.dimension;
      const x = canvasX; // 0,0 corresponds to the bottom left in the webgl context, but the top left in window coordinates

      const y = height - canvasY; // regl will only resize the framebuffer if the size changed
      // it uses floored whole pixel values

      _fbo.resize(Math.floor(width), Math.floor(height));

      return new Promise(resolve => {
        // tell regl to use a framebuffer for this render
        regl({
          framebuffer: _fbo
        })(() => {
          // clear the framebuffer
          regl.clear({
            color: intToRGB(0),
            depth: 1
          });
          let currentObjectId = 0;
          const excludedObjects = [];
          const mouseEventsWithCommands = [];
          let counter = 0;
          camera.draw(this.cameraStore.state, () => {
            // Every iteration in this loop clears the framebuffer, draws the hitmap objects that have NOT already been
            // seen to the framebuffer, and then reads the pixel under the cursor to find the object on top.
            // If `enableStackedObjectEvents` is false, we only do this iteration once - we only resolve with 0 or 1
            // objects.
            do {
              if (counter >= maxStackedObjectCount) {
                // Provide a max number of layers so this while loop doesn't crash the page.
                console.error(`Hit ${maxStackedObjectCount} iterations. There is either a bug or that number of rendered hitmap layers under the mouse cursor.`);
                break;
              }

              counter++;
              regl.clear({
                color: intToRGB(0),
                depth: 1
              });

              this._drawInput(true, excludedObjects); // it's possible to get x/y values outside the framebuffer size
              // if the mouse quickly leaves the draw area during a read operation
              // reading outside the bounds of the framebuffer causes errors
              // and puts regl into a bad internal state.
              // https://github.com/regl-project/regl/blob/28fbf71c871498c608d9ec741d47e34d44af0eb5/lib/read.js#L57


              if (x < Math.floor(width) && y < Math.floor(height) && x >= 0 && y >= 0) {
                const pixel = new Uint8Array(4); // read pixel value from the frame buffer

                regl.read({
                  x,
                  y,
                  width: 1,
                  height: 1,
                  data: pixel
                });
                currentObjectId = getIdFromPixel(pixel);

                const mouseEventObject = this._hitmapObjectIdManager.getObjectByObjectHitmapId(currentObjectId); // Check an error case: if we see an ID/color that we don't know about, it means that some command is
                // drawing a color into the hitmap that it shouldn't be.


                if (currentObjectId > 0 && !mouseEventObject) {
                  console.error(`Clicked on an unknown object with id ${currentObjectId}. This likely means that a command is painting an incorrect color into the hitmap.`);
                } // Check an error case: if we've already seen this object, then the getHitmapFromChildren function
                // is not respecting the excludedObjects correctly and we should notify the user of a bug.


                if (excludedObjects.some(({
                  object,
                  instanceIndex
                }) => object === mouseEventObject.object && instanceIndex === mouseEventObject.instanceIndex)) {
                  console.error(`Saw object twice when reading from hitmap. There is likely an error in getHitmapFromChildren`, mouseEventObject);
                  break;
                }

                if (currentObjectId > 0 && mouseEventObject.object) {
                  const command = this._hitmapObjectIdManager.getCommandForObject(mouseEventObject.object);

                  excludedObjects.push(mouseEventObject);

                  if (command) {
                    mouseEventsWithCommands.push([mouseEventObject, command]);
                  }
                }
              } // If we haven't enabled stacked object events, break out of the loop immediately.
              // eslint-disable-next-line no-unmodified-loop-condition

            } while (currentObjectId !== 0 && enableStackedObjectEvents);

            this._cachedReadHitmapCall = {
              arguments: args,
              result: mouseEventsWithCommands
            };
            resolve(mouseEventsWithCommands);
          });
        });
      });
    }));

    _defineProperty__default["default"](this, "_drawInput", (isHitmap, excludedObjects) => {
      if (isHitmap) {
        this._hitmapObjectIdManager = new HitmapObjectIdManager();
      }

      const drawCalls = Array.from(this._drawCalls.values()).sort((a, b) => (a.layerIndex || 0) - (b.layerIndex || 0));
      drawCalls.forEach(drawInput => {
        const {
          reglCommand,
          children,
          instance,
          getChildrenForHitmap
        } = drawInput;

        if (!children) {
          return console.debug(`${isHitmap ? "hitmap" : ""} draw skipped, props was falsy`, drawInput);
        }

        const cmd = this._compiled.get(reglCommand);

        if (!cmd) {
          return console.warn("could not find draw command for", instance ? instance.constructor.displayName : "Unknown");
        } // draw hitmap


        if (isHitmap && getChildrenForHitmap) {
          const assignNextColorsFn = (...rest) => {
            return this._hitmapObjectIdManager.assignNextColors(instance, ...rest);
          };

          const hitmapProps = getChildrenForHitmap(children, assignNextColorsFn, excludedObjects || []);

          if (hitmapProps) {
            cmd(hitmapProps, true);
          }
        } else if (!isHitmap) {
          cmd(children, false);
        }
      });
    });

    _defineProperty__default["default"](this, "_clearCanvas", regl => {
      // Since we aren't using regl.frame and only rendering when we need to,
      // we need to tell regl to update its internal state.
      regl.poll();
      regl.clear({
        color: this.canvasBackgroundColor,
        depth: 1
      });
    });

    // used for children to call paint() directly
    this.dimension = dimension;
    this.canvasBackgroundColor = canvasBackgroundColor;
    this.contextAttributes = contextAttributes;
    this.cameraStore = new CameraStore(cameraState => {
      if (onCameraStateChange) {
        onCameraStateChange(cameraState);
      } else {
        // this must be called for Worldview with defaultCameraState prop
        this.paint();
      }
    }, cameraState);
  }

  initialize(canvas) {
    if (this.initializedData) {
      throw new Error("can not initialize regl twice");
    }

    const regl = this._instrumentCommands(createREGL__default["default"]({
      canvas,
      attributes: this.contextAttributes || {},
      extensions: ["angle_instanced_arrays", "oes_texture_float", "oes_element_index_uint", "oes_standard_derivatives"],
      profile: getNodeEnv() !== "production"
    }));

    if (!regl) {
      throw new Error("Cannot initialize regl");
    } // compile any components which mounted before regl is initialized


    this._commands.forEach(uncompiledCommand => {
      const compiledCommand = compile(regl, uncompiledCommand);

      this._compiled.set(uncompiledCommand, compiledCommand);
    });

    const Camera = compile(regl, camera);
    const compiledCameraCommand = new Camera(); // framebuffer object from regl context

    const fbo = regl.framebuffer({
      width: Math.round(this.dimension.width),
      height: Math.round(this.dimension.height)
    });
    this.initializedData = {
      _fbo: fbo,
      camera: compiledCameraCommand,
      regl
    };
  }

  destroy() {
    this.destroyed = true;

    if (this.initializedData) {
      this.initializedData.regl.destroy();
    }

    if (this._frame) {
      cancelAnimationFrame(this._frame);
    }
  } // compile a command when it is first mounted, and try to register in _commands and _compiled maps


  onMount(instance, command) {
    const {
      initializedData
    } = this; // do nothing if regl hasn't been initialized yet

    if (!initializedData || this._commands.has(command)) {
      return;
    }

    this._commands.add(command); // for components that mount after regl is initialized


    this._compiled.set(command, compile(initializedData.regl, command));
  } // unregister children hitmap and draw calls


  onUnmount(instance) {
    this._drawCalls.delete(instance);
  }

  unregisterPaintCallback(paintFn) {
    this._paintCalls.delete(paintFn);
  }

  registerDrawCall(drawInput) {
    this._drawCalls.set(drawInput.instance, drawInput);
  }

  registerPaintCallback(paintFn) {
    this._paintCalls.set(paintFn, paintFn);
  }

  setDimension(dimension) {
    this.dimension = dimension;
  }

  paint() {
    try {
      this._paint();
    } catch (error) {
      // Regl automatically tries to reconnect when losing the canvas 3d context.
      // We should log this error, but it's not important to throw it.
      if (error.message === "(regl) context lost") {
        console.warn(error);
      } else {
        throw error;
      }
    }
  }

  _paint() {
    this._needsPaint = false;
    const start = Date.now();
    this.reglCommandObjects.forEach(cmd => cmd.stats.count = 0);

    if (!this.initializedData) {
      return;
    }

    this._cachedReadHitmapCall = null; // clear the cache every time we paint

    const {
      regl,
      camera
    } = this.initializedData;

    this._clearCanvas(regl);

    camera.draw(this.cameraStore.state, () => {
      const x = Date.now();

      this._drawInput();

      this.counters.paint = Date.now() - x;
    });

    this._paintCalls.forEach(paintCall => {
      paintCall();
    });

    this.counters.render = Date.now() - start; // More React state updates may have happened while we were painting, since paint happens
    // outside the normal React render flow. If this is the case, we need to paint again.

    if (this._needsPaint) {
      this._frame = requestAnimationFrame(() => this.paint());
    } else {
      this._frame = undefined;
    }
  }

  _instrumentCommands(regl) {
    if (getNodeEnv() === "production") {
      return regl;
    }

    return new Proxy(regl, {
      apply: (target, thisArg, args) => {
        const command = target(...args);

        if (typeof command.stats === "object") {
          this.reglCommandObjects.push(command);
        }

        return command;
      }
    });
  }

}

function ownKeys$5(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$5(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$5(Object(source), true).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$5(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
const DEFAULT_BACKGROUND_COLOR = [0, 0, 0, 1];
const DEFAULT_MOUSE_CLICK_RADIUS = 3;
const DEFAULT_MAX_NUMBER_OF_HITMAP_LAYERS = 100;

function handleWorldviewMouseInteraction(objects, ray, e, handler) {
  const args = {
    ray,
    objects
  };

  try {
    handler(e, args);
  } catch (err) {
    console.error("Error during mouse handler", err);
  }
} // responsible for camera and scene state management
// takes in children that declaritively define what should be rendered


class WorldviewBase extends React__namespace.Component {
  constructor(props) {
    super(props);

    _defineProperty__default["default"](this, "_canvas", /*#__PURE__*/React__namespace.createRef());

    _defineProperty__default["default"](this, "_cameraListener", /*#__PURE__*/React__namespace.createRef());

    _defineProperty__default["default"](this, "_tick", void 0);

    _defineProperty__default["default"](this, "_dragStartPos", null);

    _defineProperty__default["default"](this, "handleOffscreenMouseEvent", (e, mouseEventName) => {
      if (mouseEventName === "onDoubleClick") {
        this._onDoubleClick(e, true);
      } else if (mouseEventName === "onMouseDown") {
        this._onMouseDown(e, true);
      } else if (mouseEventName === "onMouseMove") {
        this._onMouseMove(e, true);
      } else if (mouseEventName === "onMouseUp") {
        this._onMouseUp(e, true);
      }
    });

    _defineProperty__default["default"](this, "_handleContextLost", ev => {
      const {
        width,
        height,
        top,
        left,
        backgroundColor,
        onCameraStateChange,
        cameraState,
        defaultCameraState,
        contextAttributes
      } = this.props;

      if (this._tick) {
        cancelAnimationFrame(this._tick);
      }

      this.state.worldviewContext.destroy(); // prepare a new worldview context for when we are restored

      this.setState({
        worldviewContext: new WorldviewContext({
          dimension: {
            width,
            height,
            top,
            left
          },
          canvasBackgroundColor: backgroundColor || DEFAULT_BACKGROUND_COLOR,
          // DEFAULT_CAMERA_STATE is applied if both `cameraState` and `defaultCameraState` are not present
          cameraState: cameraState || defaultCameraState || DEFAULT_CAMERA_STATE,
          onCameraStateChange: onCameraStateChange || undefined,
          contextAttributes: contextAttributes || {}
        })
      });
      ev.preventDefault();
    });

    _defineProperty__default["default"](this, "_handleContextRestored", ev => {
      this.state.worldviewContext.initialize(this._canvas.current); // update internal dimensions

      this.state.worldviewContext.paint(); // trigger rendering since our worldviewContext is initialized

      this.setState({}); //eslint-disable-line
    });

    _defineProperty__default["default"](this, "_onDoubleClick", (e, fromOffscreenTarget) => {
      this._onMouseInteraction(e, "onDoubleClick", fromOffscreenTarget);
    });

    _defineProperty__default["default"](this, "_onMouseDown", (e, fromOffscreenTarget) => {
      this._dragStartPos = {
        x: e.clientX,
        y: e.clientY
      };

      this._onMouseInteraction(e, "onMouseDown", fromOffscreenTarget);
    });

    _defineProperty__default["default"](this, "_onMouseMove", (e, fromOffscreenTarget) => {
      this._onMouseInteraction(e, "onMouseMove", fromOffscreenTarget);
    });

    _defineProperty__default["default"](this, "_onMouseUp", (e, fromOffscreenTarget) => {
      this._onMouseInteraction(e, "onMouseUp", fromOffscreenTarget);

      const {
        _dragStartPos
      } = this;

      if (_dragStartPos) {
        const deltaX = e.clientX - _dragStartPos.x;
        const deltaY = e.clientY - _dragStartPos.y;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance < DEFAULT_MOUSE_CLICK_RADIUS) {
          this._onMouseInteraction(e, "onClick", fromOffscreenTarget);
        }

        this._dragStartPos = null;
      }
    });

    _defineProperty__default["default"](this, "_onMouseInteraction", (e, mouseEventName, fromOffscreenTarget) => {
      const {
        worldviewContext
      } = this.state;
      const worldviewHandler = this.props[mouseEventName]; // When working with offscreen canvases, window is not defined and the target
      // might not be a valid HTMLElement. If so, we can asume any event coming
      // from an offscreen canvas already has a relevant target.

      if (!fromOffscreenTarget && (!(e.target instanceof window.HTMLElement) || e.button !== 0)) {
        return;
      } // $FlowFixMe: Because of `fromOffscreenTarget`, target might not be an actual HTMLElement instance but still needs to implement `getBoundingClientRect`


      const {
        top: clientTop,
        left: clientLeft
      } = e.target.getBoundingClientRect();
      const {
        clientX,
        clientY
      } = e;
      const canvasX = clientX - clientLeft;
      const canvasY = clientY - clientTop;
      const ray = worldviewContext.raycast(canvasX, canvasY);

      if (!ray) {
        return;
      } // Rendering the hitmap is expensive, so we should disable it for some events.
      // If 'disableHitmapForEvents' is provided, we ignore any events contained in that property.
      // Otherwise, we ignore 'onMouseMove' events by default unless 'hitmapOnMouseMove' is 'true'


      const {
        hitmapOnMouseMove,
        disableHitmapForEvents = hitmapOnMouseMove ? [] : ["onMouseMove"]
      } = this.props;

      if (disableHitmapForEvents.includes(mouseEventName)) {
        if (worldviewHandler) {
          return handleWorldviewMouseInteraction([], ray, e, worldviewHandler);
        }

        return;
      } // reading hitmap is async so we need to persist the event to use later in the event handler


      e.persist();
      worldviewContext.readHitmap(canvasX, canvasY, !!this.props.enableStackedObjectEvents, this.props.maxStackedObjectCount).then(mouseEventsWithCommands => {
        const mouseEventsByCommand = aggregate(mouseEventsWithCommands);

        for (const [command, mouseEvents] of mouseEventsByCommand.entries()) {
          command.handleMouseEvent(mouseEvents, ray, e, mouseEventName);

          if (e.isPropagationStopped()) {
            break;
          }
        }

        if (worldviewHandler && !e.isPropagationStopped()) {
          const mouseEvents = mouseEventsWithCommands.map(([mouseEventObject]) => mouseEventObject);
          handleWorldviewMouseInteraction(mouseEvents, ray, e, worldviewHandler);
        }
      }).catch(e => {
        console.error(e);
      });
    });

    const {
      width: _width,
      height: _height,
      top: _top,
      left: _left,
      backgroundColor: _backgroundColor,
      onCameraStateChange: _onCameraStateChange,
      cameraState: _cameraState,
      defaultCameraState: _defaultCameraState,
      hitmapOnMouseMove: _hitmapOnMouseMove,
      disableHitmapForEvents: _disableHitmapForEvents,
      canvas
    } = props;

    if (canvas) {
      this._canvas.current = canvas;
    }

    if (_onCameraStateChange) {
      if (!_cameraState) {
        console.warn("You provided `onCameraStateChange` without `cameraState`. Use Worldview as a controlled component with `cameraState` and `onCameraStateChange`, or uncontrolled with `defaultCameraState`.");
      }

      if (_cameraState && _defaultCameraState) {
        console.warn("You provided both `cameraState` and `defaultCameraState`. `defaultCameraState` will be ignored.");
      }
    } else {
      if (_cameraState) {
        console.warn("You provided `cameraState` without an `onCameraStateChange` handler. This will prevent moving the camera. If the camera should be movable, use `defaultCameraState`, otherwise set `onCameraStateChange`.");
      }
    }

    if (_hitmapOnMouseMove) {
      if (_disableHitmapForEvents) {
        throw new Error("Property 'hitmapOnMouseMove' is deprectated and will be ignored when used along with 'disableHitmapForEvents'.");
      } else {
        console.warn("Property 'hitmapOnMouseMove' is deprectated. Please use 'disableHitmapForEvents' property instead.");
      }
    }

    this.state = {
      worldviewContext: new WorldviewContext({
        dimension: {
          width: _width,
          height: _height,
          top: _top,
          left: _left
        },
        canvasBackgroundColor: _backgroundColor || DEFAULT_BACKGROUND_COLOR,
        // DEFAULT_CAMERA_STATE is applied if both `cameraState` and `defaultCameraState` are not present
        cameraState: props.cameraState || props.defaultCameraState || DEFAULT_CAMERA_STATE,
        onCameraStateChange: props.onCameraStateChange || undefined,
        contextAttributes: props.contextAttributes || {}
      })
    };
  }

  static getDerivedStateFromProps({
    width,
    height,
    top,
    left
  }, {
    worldviewContext
  }) {
    worldviewContext.setDimension({
      width,
      height,
      top,
      left
    });
    return null;
  }

  componentDidMount() {
    if (!this._canvas.current) {
      return console.warn("missing canvas element");
    }

    this._canvas.current.addEventListener("webglcontextlost", this._handleContextLost);

    this._canvas.current.addEventListener("webglcontextrestored", this._handleContextRestored);

    const initialize = () => {
      const {
        worldviewContext
      } = this.state;
      worldviewContext.initialize(this._canvas.current); // trigger rendering in children that require camera to be present, e.g. Text component

      this.setState({}); //eslint-disable-line
      // call paint to set the correct viewportWidth and viewportHeight for camera so non-regl components
      // such as Text can get the correct screen coordinates for the first render

      worldviewContext.paint();
    };

    if (this.state.worldviewContext.destroyed) {
      const {
        width,
        height,
        top,
        left,
        backgroundColor,
        cameraState,
        defaultCameraState,
        onCameraStateChange,
        contextAttributes
      } = this.props; // prepare a new worldview context for when we are restored

      this.setState({
        worldviewContext: new WorldviewContext({
          dimension: {
            width,
            height,
            top,
            left
          },
          canvasBackgroundColor: backgroundColor || DEFAULT_BACKGROUND_COLOR,
          // DEFAULT_CAMERA_STATE is applied if both `cameraState` and `defaultCameraState` are not present
          cameraState: cameraState || defaultCameraState || DEFAULT_CAMERA_STATE,
          onCameraStateChange: onCameraStateChange || undefined,
          contextAttributes: contextAttributes || {}
        })
      }, initialize);
    } else {
      initialize();
    }
  }

  componentWillUnmount() {
    if (this._tick) {
      cancelAnimationFrame(this._tick);
    }

    this._canvas.current.removeEventListener("webglcontextlost", this._handleContextLost);

    this._canvas.current.removeEventListener("webglcontextrestored", this._handleContextRestored);

    this.state.worldviewContext.destroy();
  }

  componentDidUpdate() {
    const {
      worldviewContext
    } = this.state; // update internal cameraState

    if (this.props.cameraState) {
      worldviewContext.cameraStore.setCameraState(this.props.cameraState);
    }

    worldviewContext.canvasBackgroundColor = this.props.backgroundColor || DEFAULT_BACKGROUND_COLOR;
    worldviewContext.onDirty();
  }

  focus() {
    if (this._cameraListener.current) {
      this._cameraListener.current.focus();
    }
  }

  _renderDebug() {
    const {
      worldviewContext
    } = this.state;
    const initializedData = worldviewContext.initializedData;

    if (getNodeEnv() === "production" || !initializedData) {
      return null;
    }

    const {
      regl
    } = initializedData;
    const mem = window.performance.memory;
    const style = {
      bottom: 5,
      right: 10,
      width: 200,
      position: "absolute",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      color: "white",
      fontFamily: "monospace",
      fontSize: 10
    };
    const {
      counters,
      reglCommandObjects
    } = worldviewContext;
    const data = mapValues__default["default"](counters, val => `${val} ms`);
    data["draw calls"] = reglCommandObjects.reduce((total, cmd) => total + cmd.stats.count, 0);

    if (mem) {
      data["heap used"] = `${(mem.usedJSHeapSize / mem.jsHeapSizeLimit * 100).toFixed(3)}%`;
    }

    Object.assign(data, pickBy__default["default"](regl.stats, val => typeof val === "number" && val !== 0));

    if (regl.stats.bufferCount > 1000) {
      throw new Error("Memory leak: Buffer count > 1000.");
    }

    const rows = Object.keys(data).map(key => {
      return /*#__PURE__*/React__namespace.createElement("tr", {
        key: key,
        style: {
          backgroundColor: "transparent",
          border: "none"
        }
      }, /*#__PURE__*/React__namespace.createElement("td", {
        style: {
          paddingRight: 10,
          border: "none"
        }
      }, key), /*#__PURE__*/React__namespace.createElement("td", {
        style: {
          width: "100%",
          border: "none"
        }
      }, data[key]));
    });
    return /*#__PURE__*/React__namespace.createElement("table", {
      style: style
    }, /*#__PURE__*/React__namespace.createElement("tbody", null, rows));
  }

  render() {
    const {
      width,
      height,
      showDebug,
      keyMap,
      shiftKeys,
      style,
      cameraState,
      onCameraStateChange,
      resolutionScale,
      canvas
    } = this.props;
    const {
      worldviewContext
    } = this.state; // If we are supplied controlled camera state and no onCameraStateChange callback
    // then there is a 'fixed' camera from outside of worldview itself.

    const isFixedCamera = cameraState && !onCameraStateChange;
    const canvasScale = resolutionScale || 1;
    const canvasHtml = canvas ? null : /*#__PURE__*/React__namespace.createElement(React__namespace.Fragment, null, /*#__PURE__*/React__namespace.createElement("canvas", {
      style: {
        width,
        height,
        maxWidth: "100%",
        maxHeight: "100%"
      },
      width: width * canvasScale,
      height: height * canvasScale,
      ref: this._canvas,
      onMouseUp: this._onMouseUp,
      onMouseDown: this._onMouseDown,
      onDoubleClick: this._onDoubleClick,
      onMouseMove: this._onMouseMove
    }), showDebug && this._renderDebug());
    return /*#__PURE__*/React__namespace.createElement("div", {
      style: _objectSpread$5({
        position: "relative",
        overflow: "hidden"
      }, style)
    }, isFixedCamera ? canvasHtml : /*#__PURE__*/React__namespace.createElement(CameraListener, {
      cameraStore: worldviewContext.cameraStore,
      keyMap: keyMap,
      shiftKeys: shiftKeys,
      ref: el => this._cameraListener.current = el
    }, canvasHtml), worldviewContext.initializedData && /*#__PURE__*/React__namespace.createElement(WorldviewReactContext.Provider, {
      value: worldviewContext
    }, this.props.children));
  }

}

_defineProperty__default["default"](WorldviewBase, "defaultProps", {
  maxStackedObjectCount: DEFAULT_MAX_NUMBER_OF_HITMAP_LAYERS,
  backgroundColor: DEFAULT_BACKGROUND_COLOR,
  shiftKeys: true,
  style: {},
  resolutionScale: 1
});

const Worldview = /*#__PURE__*/React__namespace.forwardRef((props, ref) => /*#__PURE__*/React__namespace.createElement(Dimensions, null, ({
  width,
  height,
  left,
  top
}) => /*#__PURE__*/React__namespace.createElement(WorldviewBase, _extends__default["default"]({
  width: width,
  height: height,
  left: left,
  top: top,
  ref: ref
}, props))));
Worldview.displayName = "Worldview";

//  Copyright (c) 2018-present, GM Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.
// a single min/max value
class Bound {
  constructor() {
    _defineProperty__default["default"](this, "min", void 0);

    _defineProperty__default["default"](this, "max", void 0);

    this.min = Number.MAX_SAFE_INTEGER;
    this.max = Number.MIN_SAFE_INTEGER;
  } // update the bound based on a value


  update(value) {
    this.min = Math.min(this.min, value);
    this.max = Math.max(this.max, value);
  }

} // represents x, y, and z min & max bounds for a 3d scene


class Bounds {
  constructor() {
    _defineProperty__default["default"](this, "x", void 0);

    _defineProperty__default["default"](this, "y", void 0);

    _defineProperty__default["default"](this, "z", void 0);

    this.x = new Bound();
    this.y = new Bound();
    this.z = new Bound();
  } // update the bounds based on a point


  update(point) {
    this.x.update(point.x);
    this.y.update(point.y);
    this.z.update(point.z);
  }

}

//  Copyright (c) 2018-present, GM Cruise LLC
const scratch = [0, 0, 0, 0, 0, 0, 0, 0, 0]; // gl-matrix clone of three.js Euler.setFromQuaternion
// assumes default XYZ order

function eulerFromQuaternion(out, q) {
  const m = glMatrix.mat3.fromQuat(scratch, q);
  const m11 = m[0],
        m12 = m[3],
        m13 = m[6]; // prettier-ignore

  const m22 = m[4],
        m23 = m[7]; // prettier-ignore

  const m32 = m[5],
        m33 = m[8]; // prettier-ignore

  out[1] = Math.asin(m13 < -1 ? -1 : m13 > 1 ? 1 : m13);

  if (Math.abs(m13) < 0.99999) {
    out[0] = Math.atan2(-m23, m33);
    out[2] = Math.atan2(-m12, m11);
  } else {
    out[0] = Math.atan2(m32, m22);
    out[2] = 0;
  }

  return out;
}

//  Copyright (c) 2018-present, GM Cruise LLC
// and elements (indexes into the array of positions), and apply the object's pose, scale, and color to it.

var fromGeometry = ((positions, elements) => regl => {
  const vertexArray = Float32Array.from([].concat(...positions));

  if (elements.some(face => face.some(i => i < 0 || i >= 1 << 16))) {
    throw new Error("Element index out of bounds for Uint16");
  }

  const elementsArray = Uint16Array.from([].concat(...elements));
  const buff = regl.buffer({
    // tell the gpu this buffer's contents will change frequently
    usage: "dynamic",
    data: []
  });
  const colorBuff = colorBuffer(regl);
  return withPose({
    vert: `
    precision mediump float;
    attribute vec3 point;
    attribute vec3 offset;
    attribute vec4 color;
    uniform mat4 projection, view;
    uniform vec3 scale;
    varying vec4 vColor;

    #WITH_POSE

    void main () {
      vec3 p = applyPose(scale * point + offset);
      vColor = color;
      gl_Position = projection * view * vec4(p, 1);
    }
    `,
    frag: `
    precision mediump float;
    varying vec4 vColor;
    void main () {
      gl_FragColor = vColor;
    }`,
    attributes: {
      point: vertexArray,
      color: (context, props) => {
        return colorBuff(props.color, props.colors, props.points ? props.points.length : 1);
      },
      offset: (context, props) => {
        const points = shouldConvert(props.points) ? props.points.map(pointToVec3$1) : props.points || [0, 0, 0];
        return {
          buffer: buff({
            usage: "dynamic",
            data: points
          }),
          divisor: 1
        };
      }
    },
    elements: elementsArray,
    depth: defaultDepth,
    blend: defaultBlend,
    uniforms: {
      scale: (context, props) => shouldConvert(props.scale) ? pointToVec3$1(props.scale) : props.scale
    },
    count: elementsArray.length,
    instances: (context, props) => props.points ? props.points.length : 1
  });
});

//

const decodeGeometry = (draco, decoder, json, binary, dracoCompression) => {
  var _dracoGeometry;

  const {
    bufferView: bufferViewIndex
  } = dracoCompression;
  const bufferView = json.bufferViews[bufferViewIndex];
  const buffer = new draco.DecoderBuffer();
  const data = new Int8Array(binary.buffer, binary.byteOffset + (bufferView.byteOffset || 0), bufferView.byteLength);
  buffer.Init(data, bufferView.byteLength);
  const geometryType = decoder.GetEncodedGeometryType(buffer);
  let dracoGeometry;
  let status;

  if (geometryType === draco.TRIANGULAR_MESH) {
    dracoGeometry = new draco.Mesh();
    status = decoder.DecodeBufferToMesh(buffer, dracoGeometry);
  } else if (geometryType === draco.POINT_CLOUD) {
    dracoGeometry = new draco.PointCloud();
    status = decoder.DecodeBufferToPointCloud(buffer, dracoGeometry);
  } else {
    const errorMsg = "Error: Unknown geometry type.";
    console.error(errorMsg);
  }

  if (!status || !dracoGeometry || !status.ok() || ((_dracoGeometry = dracoGeometry) === null || _dracoGeometry === void 0 ? void 0 : _dracoGeometry.ptr) === 0) {
    throw new Error(`Decoding failed: ${status ? status.error_msg() : "unknown error"}`);
  }

  draco.destroy(buffer);
  return dracoGeometry;
};

const decodeAttribute = (draco, decoder, dracoGeometry, attributeId) => {
  const attribute = decoder.GetAttributeByUniqueId(dracoGeometry, attributeId);
  const numComponents = attribute.num_components();
  const numPoints = dracoGeometry.num_points();
  const numValues = numPoints * numComponents;

  if (attribute.data_type() !== draco.DT_FLOAT32) {
    throw new Error("Only DT_FLOAT32 is supported");
  }

  const attributeType = Float32Array;
  const byteLength = numValues * attributeType.BYTES_PER_ELEMENT;
  const dataType = draco.DT_FLOAT32; // eslint-disable-next-line no-underscore-dangle

  const ptr = draco._malloc(byteLength);

  decoder.GetAttributeDataArrayForAllPoints(dracoGeometry, attribute, dataType, byteLength, ptr);
  const array = new attributeType(draco.HEAPF32.buffer, ptr, numValues).slice(); // eslint-disable-next-line no-underscore-dangle

  draco._free(ptr);

  return array;
};

const decodeIndices = (draco, decoder, dracoGeometry) => {
  const numFaces = dracoGeometry.num_faces();
  const numIndices = numFaces * 3;
  const byteLength = numIndices * 4; // eslint-disable-next-line no-underscore-dangle

  const ptr = draco._malloc(byteLength);

  decoder.GetTrianglesUInt32Array(dracoGeometry, byteLength, ptr);
  const indices = new Uint32Array(draco.HEAPF32.buffer, ptr, numIndices).slice(); // eslint-disable-next-line no-underscore-dangle

  draco._free(ptr);

  return indices;
};

const decodePrimitive = (draco, decoder, json, binary, primitive) => {
  const {
    extensions: {
      KHR_draco_mesh_compression
    } = {}
  } = primitive;

  if (!KHR_draco_mesh_compression) {
    return;
  }

  const dracoGeometry = decodeGeometry(draco, decoder, json, binary, KHR_draco_mesh_compression);
  KHR_draco_mesh_compression.accessors = [];

  for (const attributeId of Object.values(KHR_draco_mesh_compression.attributes)) {
    KHR_draco_mesh_compression.accessors[attributeId] = decodeAttribute(draco, decoder, dracoGeometry, attributeId);
  }

  KHR_draco_mesh_compression.accessors[primitive.indices] = decodeIndices(draco, decoder, dracoGeometry);
  draco.destroy(dracoGeometry);
};

async function createDracoModule() {
  // npm does not work correctly when we try to use `import` to fetch the wasm module,
  // so we need to use `require` here instead. In any case, `draco3dWasm` does not
  // hold the actual wasm module, but the path to it, which we use in the `locateFile`
  // function below.
  const draco3dWasm = require("draco3d/draco_decoder.wasm");

  return draco3d__default["default"].createDecoderModule({
    locateFile: () => {
      return draco3dWasm;
    }
  });
}

async function decodeCompressedGLB(json, binary) {
  const {
    extensionsRequired = []
  } = json;

  if (!extensionsRequired.includes("KHR_draco_mesh_compression")) {
    // this model does not uses Draco compression
    return;
  }

  const draco = await createDracoModule();
  const decoder = new draco.Decoder();
  json.meshes.forEach(mesh => {
    mesh.primitives.forEach(primitive => {
      decodePrimitive(draco, decoder, json, binary, primitive);
    });
  });
  draco.destroy(decoder);
}

//  Copyright (c) 2019-present, GM Cruise LLC
const SUPPORTED_EXTENSIONS = ["KHR_draco_mesh_compression", "KHR_materials_unlit"]; // Parse a GLB file: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0
//
// Returns an object containing the raw json data as well as parsed images (Image) and
// accessors (TypedArray).

async function parseGLB(arrayBuffer) {
  const data = new DataView(arrayBuffer);
  let offset = 0;

  function readUint32() {
    const value = data.getUint32(offset, true);
    offset += 4;
    return value;
  } // magic header


  const magic = readUint32();

  if (magic !== 0x46546c67) {
    throw new Error(`incorrect magic value 0x${magic.toString(16)}`);
  } // Binary glTF version


  const version = readUint32();

  if (version !== 2) {
    throw new Error(`incorrect version ${version}`);
  } // total file length


  const totalLength = readUint32();

  if (totalLength !== data.byteLength) {
    throw new Error(`length ${totalLength} doesn't match response length ${data.byteLength}`);
  }

  function findNextChunkOfType(type) {
    do {
      const chunkLength = readUint32();
      const chunkType = readUint32();

      if (chunkType === type) {
        const chunkData = new DataView(data.buffer, offset, chunkLength);
        offset += chunkLength;
        return chunkData;
      }

      offset += chunkLength;
    } while (offset < totalLength);
  }

  const jsonData = findNextChunkOfType(
  /* JSON */
  0x4e4f534a);

  if (!jsonData) {
    throw new Error("no JSON chunk found");
  }

  const json = JSON.parse(new TextDecoder().decode(jsonData));
  const binary = findNextChunkOfType(
  /* BIN */
  0x004e4942);

  if (!binary) {
    return {
      json
    };
  }

  if (json.buffers[0].uri !== undefined) {
    throw new Error("expected GLB-stored buffer");
  }

  for (const ext of (_json$extensionsRequi = json.extensionsRequired) !== null && _json$extensionsRequi !== void 0 ? _json$extensionsRequi : []) {
    var _json$extensionsRequi;

    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      console.warn(`Extension ${ext} not supported by parseGLB()`);
    }
  } // create a TypedArray for each accessor


  const accessors = json.accessors.map(accessorInfo => {
    var _bufferView$byteStrid;

    if (accessorInfo.bufferView == null) {
      // This accessor has no associated bufferView, which happens when the mesh
      // contains compressed data. This is not an error, though. So, we return
      // null and let the mesh handles data access later.
      return null;
    }

    let arrayType; // prettier-ignore

    switch (accessorInfo.componentType) {
      case WebGLRenderingContext.BYTE:
        arrayType = Int8Array;
        break;

      case WebGLRenderingContext.UNSIGNED_BYTE:
        arrayType = Uint8Array;
        break;

      case WebGLRenderingContext.SHORT:
        arrayType = Int16Array;
        break;

      case WebGLRenderingContext.UNSIGNED_SHORT:
        arrayType = Uint16Array;
        break;

      case WebGLRenderingContext.UNSIGNED_INT:
        arrayType = Uint32Array;
        break;

      case WebGLRenderingContext.FLOAT:
        arrayType = Float32Array;
        break;

      default:
        throw new Error(`unrecognized componentType ${accessorInfo.componentType}`);
    }

    let numComponents; // prettier-ignore

    switch (accessorInfo.type) {
      case "SCALAR":
        numComponents = 1;
        break;

      case "VEC2":
        numComponents = 2;
        break;

      case "VEC3":
        numComponents = 3;
        break;

      case "VEC4":
        numComponents = 4;
        break;

      case "MAT2":
        numComponents = 4;
        break;

      case "MAT3":
        numComponents = 9;
        break;

      case "MAT4":
        numComponents = 16;
        break;

      default:
        throw new Error(`unrecognized type ${accessorInfo.type}`);
    }

    const bufferView = json.bufferViews[accessorInfo.bufferView];

    if (((_bufferView$byteStrid = bufferView.byteStride) !== null && _bufferView$byteStrid !== void 0 ? _bufferView$byteStrid : 0) > 0) {
      console.warn("non-zero byteStride is not supported");
    }

    if (bufferView.buffer !== 0) {
      throw new Error("only GLB-stored buffers are supported");
    }

    if (bufferView.byteLength % arrayType.BYTES_PER_ELEMENT !== 0) {
      throw new Error("bufferView.byteLength mismatch");
    }

    return new arrayType(binary.buffer, binary.byteOffset + (bufferView.byteOffset || 0) + (accessorInfo.byteOffset || 0), accessorInfo.count * numComponents);
  });
  await decodeCompressedGLB(json, binary); // load embedded images

  const images = json.images && (await Promise.all(json.images.map(imgInfo => {
    const bufferView = json.bufferViews[imgInfo.bufferView];
    const data = new DataView(binary.buffer, binary.byteOffset + (bufferView.byteOffset || 0), bufferView.byteLength);
    return self.createImageBitmap(new Blob([data], {
      type: imgInfo.mimeType
    }));
  })));
  return {
    json,
    accessors,
    images
  };
}

function ownKeys$4(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$4(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$4(Object(source), true).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$4(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

//  Copyright (c) 2018-present, GM Cruise LLC
//
//  This source code is licensed under the Apache License, Version 2.0,
//  found in the LICENSE file in the root directory of this source tree.
//  You may not use this file except in compliance with the License.
function nonInstancedGetChildrenForHitmapFromSingleProp(prop, assignNextColors, excludedObjects, useOriginalMarkerProp = false) {
  // The marker that we send to event callbacks.
  const eventCallbackMarker = useOriginalMarkerProp ? prop.originalMarker : prop;

  if (excludedObjects.some(({
    object
  }) => object === eventCallbackMarker)) {
    return null;
  }

  const hitmapProp = _objectSpread$4({}, prop);

  const [hitmapColor] = assignNextColors(eventCallbackMarker, 1);
  hitmapProp.color = hitmapColor;

  if (hitmapProp.colors && hitmapProp.points && hitmapProp.points.length) {
    hitmapProp.colors = new Array(hitmapProp.points.length).fill(hitmapColor);
  }

  return hitmapProp;
}

const nonInstancedGetChildrenForHitmap = (props, assignNextColors, excludedObjects) => {
  if (Array.isArray(props)) {
    return props.map(prop => nonInstancedGetChildrenForHitmapFromSingleProp(prop, assignNextColors, excludedObjects)).filter(Boolean);
  }

  return nonInstancedGetChildrenForHitmapFromSingleProp(props, assignNextColors, excludedObjects);
}; // Almost identical to nonInstancedGetChildrenForHitmap, but instead the object passed to event callbacks is the object
// at `prop.originalMarker`, not just `prop`.

const getChildrenForHitmapWithOriginalMarker = (props, assignNextColors, excludedObjects) => {
  if (Array.isArray(props)) {
    return props.map(prop => nonInstancedGetChildrenForHitmapFromSingleProp(prop, assignNextColors, excludedObjects, true)).filter(Boolean);
  }

  return nonInstancedGetChildrenForHitmapFromSingleProp(props, assignNextColors, excludedObjects, true);
};

function instancedGetChildrenForHitmapFromSingleProp(prop, assignNextColors, excludedObjects, pointCountPerInstance) {
  const matchedExcludedObjects = excludedObjects.filter(({
    object,
    instanceIndex
  }) => object === prop);
  const filteredIndices = matchedExcludedObjects.map(({
    object,
    instanceIndex
  }) => instanceIndex).filter(instanceIndex => typeof instanceIndex === "number");

  const hitmapProp = _objectSpread$4({}, prop);

  const instanceCount = hitmapProp.points && Math.ceil(hitmapProp.points.length / pointCountPerInstance) || 1; // This returns 1 color per instance.

  const idColors = assignNextColors(prop, instanceCount);
  const startColor = idColors[0]; // We have to map these instance colors to `pointCountPerInstance` number of points

  if (hitmapProp.points && hitmapProp.points.length) {
    const allColors = new Array(hitmapProp.points.length).fill().map(() => startColor);

    for (let i = 0; i < instanceCount; i++) {
      for (let j = 0; j < pointCountPerInstance; j++) {
        const idx = i * pointCountPerInstance + j;

        if (idx < allColors.length) {
          allColors[idx] = idColors[i];
        }
      }
    }

    hitmapProp.colors = allColors;

    if (filteredIndices.length) {
      hitmapProp.points = hitmapProp.points.filter((_, index) => !filteredIndices.includes(Math.floor(index / pointCountPerInstance)));
      hitmapProp.colors = hitmapProp.colors.filter((_, index) => !filteredIndices.includes(Math.floor(index / pointCountPerInstance)));
    } else if (matchedExcludedObjects.length) {
      // if we don't have instance indices, just filter out the whole object.
      return null;
    }
  } else {
    hitmapProp.color = startColor;

    if (matchedExcludedObjects.length) {
      return null;
    }
  }

  return hitmapProp;
}

const createInstancedGetChildrenForHitmap = pointCountPerInstance => (props, assignNextColors, excludedObjects) => {
  if (Array.isArray(props)) {
    return props.map(prop => instancedGetChildrenForHitmapFromSingleProp(prop, assignNextColors, excludedObjects, pointCountPerInstance)).filter(Boolean);
  }

  return instancedGetChildrenForHitmapFromSingleProp(props, assignNextColors, excludedObjects, pointCountPerInstance);
};

function ownKeys$3(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$3(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$3(Object(source), true).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$3(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

const withRenderStateOverrides = command => regl => {
  // Generate the render command once
  const reglCommand = command(regl); // Use memoization to avoid generating multiple render commands for the same render states
  // for the same render states

  const memoizedRender = memoize__default["default"](props => {
    const {
      depth,
      blend
    } = props;
    return regl(_objectSpread$3(_objectSpread$3({}, reglCommand), {}, {
      depth,
      blend
    }));
  }, (...args) => JSON.stringify(args));

  const renderElement = props => {
    var _props$originalMarker, _props$originalMarker2;

    // Get curstom render states from the given marker. Some commands, like <Arrows />
    // will use the originalMarker property instead. If no custom render states
    // are present, use either the ones provided in the command or the default ones. We do
    // need to provide valid objects in order to make sure the hitmap works correctly.
    const depth = props.depth || ((_props$originalMarker = props.originalMarker) === null || _props$originalMarker === void 0 ? void 0 : _props$originalMarker.depth) || reglCommand.depth || defaultReglDepth;
    const blend = props.blend || ((_props$originalMarker2 = props.originalMarker) === null || _props$originalMarker2 === void 0 ? void 0 : _props$originalMarker2.blend) || reglCommand.blend || defaultReglBlend;
    memoizedRender({
      depth,
      blend
    })(props);
  };

  return props => {
    if (Array.isArray(props)) {
      props.forEach(renderElement);
    } else {
      renderElement(props);
    }
  };
};

function createCylinderGeometry(numSegments, cone) {
  // "poles" are the centers of top/bottom faces
  const northPole = [0, 0, 0.5];
  const southPole = [0, 0, -0.5];
  const points = [northPole, southPole]; // Keep side faces separate from top/bottom to improve appearance for semi-transparent colors.
  // We don't have a good approach to transparency right now but this is a small improvement over mixing the faces.

  const sideFaces = [];
  const endCapFaces = [];

  for (let i = 0; i < numSegments; i++) {
    const theta = 2 * Math.PI * i / numSegments;
    const x = 0.5 * Math.cos(theta);
    const y = 0.5 * Math.sin(theta);
    points.push([x, y, 0.5], [x, y, -0.5]);
    const bottomLeftPt = points.length - 1;
    const topRightPt = cone ? 0 : i + 1 === numSegments ? 2 : points.length;
    const bottomRightPt = i + 1 === numSegments ? 3 : points.length + 1;
    sideFaces.push([bottomLeftPt, topRightPt, bottomRightPt]);
    endCapFaces.push([bottomLeftPt, bottomRightPt, 1]);

    if (!cone) {
      const topLeftPt = points.length - 2;
      sideFaces.push([topLeftPt, bottomLeftPt, topRightPt]);
      endCapFaces.push([topLeftPt, topRightPt, 0]);
    }
  }

  return {
    points,
    sideFaces,
    endCapFaces
  };
}
const {
  points: points$2,
  sideFaces: sideFaces$1,
  endCapFaces: endCapFaces$1
} = createCylinderGeometry(30, false);
const cylinders = withRenderStateOverrides(fromGeometry(points$2, sideFaces$1.concat(endCapFaces$1)));
const getChildrenForHitmap$5 = createInstancedGetChildrenForHitmap(1);
function Cylinders(props) {
  return /*#__PURE__*/React__namespace.createElement(Command, _extends__default["default"]({
    getChildrenForHitmap: getChildrenForHitmap$5
  }, props, {
    reglCommand: cylinders
  }));
}

const {
  points: points$1,
  sideFaces,
  endCapFaces
} = createCylinderGeometry(30, true);
const cones = withRenderStateOverrides(fromGeometry(points$1, sideFaces.concat(endCapFaces)));
const getChildrenForHitmap$4 = createInstancedGetChildrenForHitmap(1);
function Cones(props) {
  return /*#__PURE__*/React__namespace.createElement(Command, _extends__default["default"]({
    getChildrenForHitmap: getChildrenForHitmap$4
  }, props, {
    reglCommand: cones
  }));
}

const UNIT_X_VECTOR = Object.freeze([0, 0, 1]);

const generateArrowPrimitives = markers => {
  const cylinders = [];
  const cones = [];

  for (const marker of markers) {
    let shaftWidthX;
    let shaftWidthY;
    let shaftLength;
    let headWidthX;
    let headWidthY;
    let headLength;
    let basePosition;
    let orientation;
    let dir;

    if (marker.points && marker.points.length === 2) {
      const [start, end] = marker.points;
      const posePosition = pointToVec3$1(marker.pose.position);
      const poseOrientation = orientationToVec4(marker.pose.orientation);
      basePosition = glMatrix.vec3.add([0, 0, 0], posePosition, [start.x, start.y, start.z]);
      const tipPosition = glMatrix.vec3.add([0, 0, 0], posePosition, [end.x, end.y, end.z]);
      const length = glMatrix.vec3.distance(basePosition, tipPosition);
      dir = glMatrix.vec3.subtract([0, 0, 0], tipPosition, basePosition);
      glMatrix.vec3.normalize(dir, dir);
      glMatrix.vec3.transformQuat(dir, dir, poseOrientation);
      orientation = glMatrix.quat.rotationTo([0, 0, 0, 0], UNIT_X_VECTOR, dir);
      headWidthX = headWidthY = marker.scale.y;
      headLength = marker.scale.z || length * 0.3;
      shaftWidthX = shaftWidthY = marker.scale.x;
      shaftLength = length - headLength;
    } else {
      basePosition = pointToVec3$1(marker.pose.position);
      orientation = orientationToVec4(marker.pose.orientation);
      glMatrix.quat.rotateY(orientation, orientation, Math.PI / 2);
      dir = glMatrix.vec3.transformQuat([0, 0, 0], UNIT_X_VECTOR, orientation);
      shaftWidthX = marker.scale.y || 1;
      shaftWidthY = marker.scale.z || 1;
      headWidthX = 2 * shaftWidthX;
      headWidthY = 2 * shaftWidthY; // these magic numbers taken from
      // https://github.com/ros-visualization/rviz/blob/57325fa075893de70f234f4676cdd08b411858ff/src/rviz/default_plugin/markers/arrow_marker.cpp#L113

      headLength = 0.23 * (marker.scale.x || 1);
      shaftLength = 0.77 * (marker.scale.x || 1);
    }

    const shaftPosition = glMatrix.vec3.scaleAndAdd([0, 0, 0], basePosition, dir, shaftLength / 2);
    const headPosition = glMatrix.vec3.scaleAndAdd([0, 0, 0], basePosition, dir, shaftLength + headLength / 2);
    cylinders.push({
      // Set the original marker so we can use it in mouse events
      originalMarker: marker,
      scale: {
        x: shaftWidthX,
        y: shaftWidthY,
        z: shaftLength
      },
      color: marker.color,
      pose: {
        position: vec3ToPoint(shaftPosition),
        orientation: vec4ToOrientation(orientation)
      }
    });
    cones.push({
      // Set the original marker so we can use it in mouse events
      originalMarker: marker,
      scale: {
        x: headWidthX,
        y: headWidthY,
        z: headLength
      },
      color: marker.color,
      pose: {
        position: vec3ToPoint(headPosition),
        orientation: vec4ToOrientation(orientation)
      }
    });
  }

  return {
    cones,
    cylinders
  };
};

const makeArrowsCommand = () => regl => {
  const cylindersCommand = cylinders(regl);
  const conesCommand = cones(regl);
  return props => {
    const {
      cylinders: cylinderPrimitives,
      cones: conePrimitives
    } = generateArrowPrimitives(props);
    cylindersCommand(cylinderPrimitives);
    conesCommand(conePrimitives);
  };
};

function Arrows(props) {
  const passedProps = omit__default["default"](props, "children");
  const {
    cylinders,
    cones
  } = generateArrowPrimitives(props.children);
  return /*#__PURE__*/React__default["default"].createElement(React.Fragment, null, /*#__PURE__*/React__default["default"].createElement(Cylinders, _extends__default["default"]({
    getChildrenForHitmap: getChildrenForHitmapWithOriginalMarker
  }, passedProps), cylinders), /*#__PURE__*/React__default["default"].createElement(Cones, _extends__default["default"]({
    getChildrenForHitmap: getChildrenForHitmapWithOriginalMarker
  }, passedProps), cones));
}

var Arrows$1 = /*#__PURE__*/React.memo(Arrows);

/*
Triangle-based line drawing.

4 points (a strip of 2 triangles) are drawn for each segment of the line using instanced arrays.
Each of the 4 points has a distinct "point type" which informs how the input point is offset to
yield the vertices of the triangle.

Passing the input point as an attribute with {divisor: 1} tells GL to use each point for 1 instance,
then move on to the next point -- something like `points.map((p) => draw2Triangles(p))`.

4 attributes are used so the vertex shader can see 4 input points at once (reading from the same
buffer with different offsets). This is because the positions of the TL/BL endpoints depend on the
angle ABC, and the positions of TR/BR depend on the angle BCD.

Roughly the segment looks like:

     TL   -   -   -  .TR
      |          ,.-' |
A - - B - - -,.-' - - C - - D
      |  ,.-'         |
     BL-' -   -   -   BR

When two adjacent segments form an obtuse angle, we draw a miter join:

                      TR/TL.
                 , '   _/|   ' .
             , '     _/  |       ' .
         , '       _/    C           ' .
     , '         _/      |               ' .
   TL          _/        |        ______,----'TR
    \        _/       ,BR/BL.----'            /
     B     _/    , '          ' .            D
      \  _/ , '                   ' .       /
       BL'                            ' . BR

But when the angle gets too sharp, we switch to a "fold" join, where the two segments overlap at
the corner:

        ,TR/BL---C--BR/TL
       ,    |.\__  ,     .
      ,     | .  \,_      .
     ,      |  . ,  \_     .
    ,       |   ,     \__   .
   ,        |  , .       \__ .
  TL._      | ,   .        _.TR
      'B._  |,     .   _.C'
          'BL       BR'

(A regular bevel join without any overlaps is harder to achieve without artifacts in the sharp-angle
edge cases.)

*/

const FLOAT_BYTES = Float32Array.BYTES_PER_ELEMENT;
const POINT_BYTES = 3 * FLOAT_BYTES;
const DEFAULT_MONOCHROME_COLOR = [1, 1, 1, 0.2]; // The four points forming the triangles' vertices.
// Values do not matter, they just need to be distinct.

const POINT_TYPES = {
  BL: 0,
  TR: 1,
  BR: 2,
  TL: 3
};
const VERTICES_PER_INSTANCE = Object.keys(POINT_TYPES).length;
const vert$1 = `
precision mediump float;

attribute float pointType;

// per-instance attributes
attribute vec4 colorB;
attribute vec4 colorC;
attribute vec3 positionA;
attribute vec3 positionB;
attribute vec3 positionC;
attribute vec3 positionD;
// per-instance pose attributes
attribute vec3 posePosition;
attribute vec4 poseRotation;

uniform mat4 projection, view;
uniform float viewportWidth;
uniform float viewportHeight;
uniform float alpha;
uniform float thickness;
uniform bool joined;
uniform bool scaleInvariant;

varying vec4 vColor;

${Object.keys(POINT_TYPES).map(k => `const float POINT_${k} = ${POINT_TYPES[k]}.0;`).join("\n")}

#WITH_POSE

vec3 applyPoseInstance(vec3 point, vec4 rotation, vec3 position) {
  // rotate the point and then add the position of the pose
  // this function is defined in WITH_POSE
  return rotate(point, rotation) + position;
}

vec2 rotateCCW(vec2 v) {
  return vec2(-v.y, v.x);
}

vec2 normalizeOrZero(vec2 v) {
  return length(v) < 0.00001 ? vec2(0, 0) : normalize(v);
}

void setPosition(vec4 proj, vec2 offset) {
  gl_Position = proj;

  offset *= thickness / 2.;

  if (scaleInvariant) {
    // The given thickness is a number of pixels on screen. Divide x by width/2 and
    // y by height/2 so that they correspond to pixel distances when scaled from clip space to NDC.
    offset.x /= viewportWidth / 2.0;
    offset.y /= viewportHeight / 2.0;
    // Compensate for automatic division by w
    offset *= proj.w;
  } else {
    // The line thickness should be scaled the same way the camera scales other distances.
    // projection[0].xyz is the result of projecting a unit x-vector, so its length represents
    // how much distances are scaled by the camera projection.
    offset *= length(projection[0].xyz);
    offset.y *= viewportWidth / viewportHeight;
  }

  gl_Position.xy += offset;
}

void main () {
  bool isStart = positionA == positionB;
  bool isEnd = positionC == positionD;
  bool isLeft = (pointType == POINT_TL || pointType == POINT_BL);
  bool isTop = (pointType == POINT_TL || pointType == POINT_TR);
  bool isEndpoint = isLeft ? isStart : isEnd;

  float scale = isTop ? 1. : -1.;

  mat4 projView = projection * view;
  vec4 projA = projView * vec4(applyPose(applyPoseInstance(positionA, poseRotation, posePosition)), 1);
  vec4 projB = projView * vec4(applyPose(applyPoseInstance(positionB, poseRotation, posePosition)), 1);
  vec4 projC = projView * vec4(applyPose(applyPoseInstance(positionC, poseRotation, posePosition)), 1);
  vec4 projD = projView * vec4(applyPose(applyPoseInstance(positionD, poseRotation, posePosition)), 1);

  vec2 aspectVec = vec2(viewportWidth / viewportHeight, 1.0);
  vec2 screenA = projA.xy / projA.w * aspectVec;
  vec2 screenB = projB.xy / projB.w * aspectVec;
  vec2 screenC = projC.xy / projC.w * aspectVec;
  vec2 screenD = projD.xy / projD.w * aspectVec;

  vec2 dirAB = normalizeOrZero(screenB - screenA);
  vec2 dirBC = normalizeOrZero(screenC - screenB);
  vec2 dirCD = normalizeOrZero(screenD - screenC);

  vec2 perpAB = rotateCCW(dirAB); // vector perpendicular to AB
  vec2 perpBC = rotateCCW(dirBC); // vector perpendicular to BC

  vColor = isLeft ? colorB : colorC;
  vColor.a *= alpha;

  vec4 proj = isLeft ? projB : projC;

  // simple case: non-joined line list
  if (!joined || isEndpoint) {
    setPosition(proj, scale * perpBC);
    return;
  }

  // clamp to prevent rounding errors from breaking the sqrt()s below
  float cosB = clamp(-dot(dirAB, dirBC), -1., 1.);
  float cosC = clamp(-dot(dirBC, dirCD), -1., 1.);

  bool tooSharpB = cosB > 0.01;
  bool tooSharpC = cosC > 0.01;
  bool tooSharp = isLeft ? tooSharpB : tooSharpC;

  bool turningRightB = dot(dirAB, rotateCCW(dirBC)) > 0.;
  bool turningRightC = dot(dirBC, rotateCCW(dirCD)) > 0.;
  bool turningRight = isLeft ? turningRightB : turningRightC;

  if (tooSharp) {
    // "fold join"
    vec2 perp = isLeft ? perpAB : perpBC;
    vec2 dir = isLeft ? dirAB : dirBC;
    float scalePerp = isLeft ? -1. : 1.;
    float scaleDir = (turningRight == isLeft) ? 1. : -1.;
    float tanHalfB = sqrt((1. - cosB) / (1. + cosB));
    float tanHalfC = sqrt((1. - cosC) / (1. + cosC));
    float tanHalf = isLeft ? tanHalfB : tanHalfC;
    setPosition(proj, scale * (scalePerp * perp + scaleDir * dir * tanHalf));
  } else {
    // miter join
    vec2 bisectorB = rotateCCW(normalize(dirAB + dirBC)); // angle bisector of ABC
    vec2 bisectorC = rotateCCW(normalize(dirBC + dirCD)); // angle bisector of BCD
    vec2 bisector = isLeft ? bisectorB : bisectorC;
    float sinHalfB = sqrt((1. - cosB) / 2.);
    float sinHalfC = sqrt((1. - cosC) / 2.);
    float sinHalf = isLeft ? sinHalfB : sinHalfC;
    setPosition(proj, scale * bisector / sinHalf);
  }
}
`;
const frag$1 = `
precision mediump float;
varying vec4 vColor;
void main () {
  gl_FragColor = vColor;
}
`;

function pointsEqual(a, b) {
  const [ax, ay, az] = shouldConvert(a) ? pointToVec3$1(a) : a;
  const [bx, by, bz] = shouldConvert(b) ? pointToVec3$1(b) : b;
  return ax === bx && ay === by && az === bz;
}

const lines = regl => {
  if (!regl) {
    throw new Error("Invalid regl instance");
  } // The point type attribute, reused for each instance


  const pointTypeBuffer = regl.buffer({
    type: "uint16",
    usage: "static",
    data: [POINT_TYPES.TL, POINT_TYPES.BL, POINT_TYPES.TR, POINT_TYPES.BR]
  });
  const debugColorBuffer = regl.buffer({
    type: "float",
    usage: "static",
    data: [[0, 1, 1, 1], // cyan
    [1, 0, 0, 1], // red
    [0, 1, 0, 1], // green
    [1, 0, 1, 1] // magenta
    ]
  }); // The pose position and rotation buffers contain the identity position/rotation, for use when we don't have instanced
  // poses.

  const defaultPosePositionBuffer = regl.buffer({
    type: "float",
    usage: "static",
    data: flatten__default["default"](new Array(VERTICES_PER_INSTANCE).fill([0, 0, 0]))
  });
  const defaultPoseRotationBuffer = regl.buffer({
    type: "float",
    usage: "static",
    // Rotation array identity is [x: 0, y: 0, z: 0, w: 1]
    data: flatten__default["default"](new Array(VERTICES_PER_INSTANCE).fill([0, 0, 0, 1]))
  }); // The buffers used for input position & color data

  const colorBuffer = regl.buffer({
    type: "float"
  }); // All invocations of the vertex shader share data from the positions buffer, but with different
  // offsets. However, when offset and stride are combined, 3 or 4 attributes reading from the same
  // buffer produces incorrect results on certain Lenovo hardware running Ubuntu. As a workaround,
  // we upload the same data into two buffers and have only two attributes reading from each buffer.

  const positionBuffer1 = regl.buffer({
    type: "float"
  });
  const positionBuffer2 = regl.buffer({
    type: "float"
  });
  const posePositionBuffer = regl.buffer({
    type: "float"
  });
  const poseRotationBuffer = regl.buffer({
    type: "float"
  });
  const command = regl(withPose({
    vert: vert$1,
    frag: frag$1,
    blend: defaultBlend,
    uniforms: {
      thickness: regl.prop("scale.x"),
      viewportWidth: regl.context("viewportWidth"),
      viewportHeight: regl.context("viewportHeight"),
      alpha: regl.prop("alpha"),
      joined: regl.prop("joined"),
      scaleInvariant: regl.prop("scaleInvariant")
    },
    attributes: {
      pointType: pointTypeBuffer,
      colorB: (context, {
        joined,
        monochrome,
        debug
      }) => ({
        buffer: debug ? debugColorBuffer : colorBuffer,
        offset: 0,
        stride: (joined || monochrome || debug ? 1 : 2) * 4 * FLOAT_BYTES,
        divisor: monochrome || debug ? 0 : 1
      }),
      colorC: (context, {
        joined,
        monochrome,
        debug
      }) => ({
        buffer: debug ? debugColorBuffer : colorBuffer,
        offset: monochrome || debug ? 0 : 4 * FLOAT_BYTES,
        stride: (joined || monochrome || debug ? 1 : 2) * 4 * FLOAT_BYTES,
        divisor: monochrome || debug ? 0 : 1
      }),
      positionA: (context, {
        joined
      }) => ({
        buffer: positionBuffer1,
        offset: 0,
        stride: (joined ? 1 : 2) * POINT_BYTES,
        divisor: 1
      }),
      positionB: (context, {
        joined
      }) => ({
        buffer: positionBuffer1,
        offset: POINT_BYTES,
        stride: (joined ? 1 : 2) * POINT_BYTES,
        divisor: 1
      }),
      positionC: (context, {
        joined
      }) => ({
        buffer: positionBuffer2,
        offset: 2 * POINT_BYTES,
        stride: (joined ? 1 : 2) * POINT_BYTES,
        divisor: 1
      }),
      positionD: (context, {
        joined
      }) => ({
        buffer: positionBuffer2,
        offset: 3 * POINT_BYTES,
        stride: (joined ? 1 : 2) * POINT_BYTES,
        divisor: 1
      }),
      posePosition: (context, {
        hasInstancedPoses
      }) => ({
        buffer: hasInstancedPoses ? posePositionBuffer : defaultPosePositionBuffer,
        divisor: hasInstancedPoses ? 1 : 0
      }),
      poseRotation: (context, {
        hasInstancedPoses
      }) => ({
        buffer: hasInstancedPoses ? poseRotationBuffer : defaultPoseRotationBuffer,
        divisor: hasInstancedPoses ? 1 : 0
      })
    },
    count: VERTICES_PER_INSTANCE,
    instances: regl.prop("instances"),
    primitive: regl.prop("primitive")
  }));
  let colorArray = new Float32Array(VERTICES_PER_INSTANCE * 4);
  let pointArray = new Float32Array(0);
  let allocatedPoints = 0;
  let positionArray = new Float32Array(0);
  let rotationArray = new Float32Array(0);

  function fillPointArray(points, alreadyClosed, shouldClose) {
    const numTotalPoints = points.length + (shouldClose ? 3 : 2);

    if (allocatedPoints < numTotalPoints) {
      pointArray = new Float32Array(numTotalPoints * 3);
      allocatedPoints = numTotalPoints;
    }

    points.forEach((point, i) => {
      const [x, y, z] = shouldConvert(point) ? pointToVec3$1(point) : point;
      const off = 3 + i * 3;
      pointArray[off + 0] = x;
      pointArray[off + 1] = y;
      pointArray[off + 2] = z;
    }); // The "prior" point (A) and "next" point (D) need to be set when rendering the first & last
    // segments, so we copy data from the last point(s) to the beginning of the array, and from the
    // first point(s) to the end of the array.

    const n = numTotalPoints * 3;

    if (alreadyClosed) {
      // First and last points already match; "prior" should be the second-to-last
      // and "next" should be the second.
      pointArray.copyWithin(0, n - 9, n - 6);
      pointArray.copyWithin(n - 3, 6, 9);
    } else if (shouldClose) {
      // First point is being reused after last point; first *two* points need to be copied at the end
      pointArray.copyWithin(0, n - 9, n - 6);
      pointArray.copyWithin(n - 6, 3, 9);
    } else {
      // Endpoints are separate; just duplicate first & last points, resulting in square-looking endcaps
      pointArray.copyWithin(0, 3, 6);
      pointArray.copyWithin(n - 3, n - 6, n - 3);
    }

    return pointArray.subarray(0, n);
  }

  function fillPoseArrays(instances, poses) {
    if (positionArray.length < instances * 3) {
      positionArray = new Float32Array(instances * 3);
      rotationArray = new Float32Array(instances * 4);
    }

    for (let index = 0; index < poses.length; index++) {
      const positionOffset = index * 3;
      const rotationOffset = index * 4;
      const {
        position,
        orientation: r
      } = poses[index];
      const convertedPosition = Array.isArray(position) ? position : pointToVec3$1(position);
      positionArray[positionOffset + 0] = convertedPosition[0];
      positionArray[positionOffset + 1] = convertedPosition[1];
      positionArray[positionOffset + 2] = convertedPosition[2];
      const convertedRotation = Array.isArray(r) ? r : [r.x, r.y, r.z, r.w];
      rotationArray[rotationOffset + 0] = convertedRotation[0];
      rotationArray[rotationOffset + 1] = convertedRotation[1];
      rotationArray[rotationOffset + 2] = convertedRotation[2];
      rotationArray[rotationOffset + 3] = convertedRotation[3];
    }

    return {
      positionData: positionArray.subarray(0, instances * 3),
      rotationData: rotationArray.subarray(0, instances * 4)
    };
  }

  function convertColors(colors) {
    return shouldConvert(colors) ? colors.map(toRGBA) : colors;
  }

  function fillColorArray(color, colors, monochrome, shouldClose) {
    if (monochrome) {
      if (colorArray.length < VERTICES_PER_INSTANCE * 4) {
        colorArray = new Float32Array(VERTICES_PER_INSTANCE * 4);
      }

      const monochromeColor = color || DEFAULT_MONOCHROME_COLOR;
      const [convertedMonochromeColor] = convertColors([monochromeColor]);
      const [r, g, b, a] = convertedMonochromeColor;

      for (let index = 0; index < VERTICES_PER_INSTANCE; index++) {
        const offset = index * 4;
        colorArray[offset + 0] = r;
        colorArray[offset + 1] = g;
        colorArray[offset + 2] = b;
        colorArray[offset + 3] = a;
      }

      return colorArray.subarray(0, VERTICES_PER_INSTANCE * 4);
    } else if (colors) {
      const length = shouldClose ? colors.length + 1 : colors.length;

      if (colorArray.length < length * 4) {
        colorArray = new Float32Array(length * 4);
      }

      const convertedColors = convertColors(colors);

      for (let index = 0; index < convertedColors.length; index++) {
        const offset = index * 4;
        const [r, g, b, a] = convertedColors[index];
        colorArray[offset + 0] = r;
        colorArray[offset + 1] = g;
        colorArray[offset + 2] = b;
        colorArray[offset + 3] = a;
      }

      if (shouldClose) {
        const [r, g, b, a] = convertedColors[0];
        const lastIndex = length - 1;
        colorArray[lastIndex * 4 + 0] = r;
        colorArray[lastIndex * 4 + 1] = g;
        colorArray[lastIndex * 4 + 2] = b;
        colorArray[lastIndex * 4 + 3] = a;
      }

      return colorArray.subarray(0, length * 4);
    }

    throw new Error("Impossible: !monochrome implies !!colors.");
  } // Create a new render function based on rendering settings
  // Memoization is required in order to prevent creating too many functions
  // that use the same arguments, potentially leading to memory leaks.


  const memoizedRender = memoize__default["default"](props => {
    const {
      depth = defaultReglDepth,
      blend = defaultReglBlend
    } = props;
    return regl({
      depth,
      blend
    });
  }, (...args) => JSON.stringify(args)); // Disable depth for debug rendering (so lines stay visible)

  const render = (props, commands) => {
    const {
      debug
    } = props;

    if (debug) {
      memoizedRender({
        depth: {
          enable: false
        }
      })(commands);
    } else {
      memoizedRender(props)(commands);
    }
  }; // Render one line list/strip


  function renderLine(props) {
    const {
      debug,
      primitive = "lines",
      scaleInvariant = false,
      depth,
      blend
    } = props;
    const numInputPoints = props.points.length;

    if (numInputPoints < 2) {
      return;
    }

    const alreadyClosed = numInputPoints > 2 && pointsEqual(props.points[0], props.points[numInputPoints - 1]); // whether the first point needs to be duplicated after the last point

    const shouldClose = !alreadyClosed && props.closed;
    const pointData = fillPointArray(props.points, alreadyClosed, shouldClose);
    positionBuffer1({
      data: pointData,
      usage: "dynamic"
    });
    positionBuffer2({
      data: pointData,
      usage: "dynamic"
    });
    const monochrome = !(props.colors && props.colors.length);
    const colorData = fillColorArray(props.color, props.colors, monochrome, shouldClose);
    colorBuffer({
      data: colorData,
      usage: "dynamic"
    });
    const joined = primitive === "line strip";
    const effectiveNumPoints = numInputPoints + (shouldClose ? 1 : 0);
    const instances = joined ? effectiveNumPoints - 1 : Math.floor(effectiveNumPoints / 2); // fill instanced pose buffers

    const {
      poses
    } = props;
    const hasInstancedPoses = !!poses && poses.length > 0;

    if (hasInstancedPoses && poses) {
      if (instances !== poses.length) {
        console.error(`Expected ${instances} poses but given ${poses.length} poses: will result in webgl error.`);
        return;
      }

      const {
        positionData,
        rotationData
      } = fillPoseArrays(instances, poses);
      posePositionBuffer({
        data: positionData,
        usage: "dynamic"
      });
      poseRotationBuffer({
        data: rotationData,
        usage: "dynamic"
      });
    }

    render({
      debug,
      depth,
      blend
    }, () => {
      // Use Object.assign because it's actually faster than babel's object spread polyfill.
      command(Object.assign({}, props, {
        joined,
        primitive: "triangle strip",
        alpha: debug ? 0.2 : 1,
        monochrome,
        instances,
        scaleInvariant,
        hasInstancedPoses
      }));

      if (debug) {
        command(Object.assign({}, props, {
          joined,
          primitive: "line strip",
          alpha: 1,
          monochrome,
          instances,
          scaleInvariant,
          hasInstancedPoses
        }));
      }
    });
  }

  return inProps => {
    if (Array.isArray(inProps)) {
      inProps.forEach(renderLine);
    } else {
      renderLine(inProps);
    }
  };
};
function Lines(props) {
  return /*#__PURE__*/React__namespace.createElement(Command, _extends__default["default"]({
    getChildrenForHitmap: nonInstancedGetChildrenForHitmap
  }, props, {
    reglCommand: lines
  }));
}

const pointToVec3 = p => ({
  x: p[0],
  y: p[1],
  z: p[2]
});

const scale = 100;
const x = 1 * scale;
const xAxisPoints = [[-x, 0, 0], [x, 0, 0]].map(pointToVec3);
const yAxisPoints = [[0, -100, 0], [0, 100, 0]].map(pointToVec3);
const zAxisPoints = [[0, 0, -100], [0, 0, 100]].map(pointToVec3);
const pose = {
  orientation: {
    x: 0,
    y: 0,
    z: 0,
    w: 0
  },
  position: {
    x: 0,
    y: 0,
    z: 0
  }
};
const xAxis = {
  pose,
  points: xAxisPoints,
  scale: {
    x: 0.5,
    y: 0.5,
    z: 0.5
  },
  color: {
    r: 0.95,
    g: 0.26,
    b: 0.4,
    a: 1
  }
};
const yAxis = {
  pose,
  points: yAxisPoints,
  scale: {
    x: 0.5,
    y: 0.5,
    z: 0.5
  },
  color: {
    r: 0.02,
    g: 0.82,
    b: 0.49,
    a: 1
  }
};
const zAxis = {
  pose,
  points: zAxisPoints,
  scale: {
    x: 0.5,
    y: 0.5,
    z: 0.5
  },
  color: {
    r: 0.11,
    g: 0.51,
    b: 0.92,
    a: 1
  }
};
// Renders lines along the x, y, and z axes; useful for debugging.
class Axes extends React__default["default"].Component {
  render() {
    return /*#__PURE__*/React__default["default"].createElement(Lines, null, this.props.children);
  }

}

_defineProperty__default["default"](Axes, "defaultProps", {
  children: [xAxis, yAxis, zAxis]
});

const cubes = withRenderStateOverrides(fromGeometry([// bottom face corners
[-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], // top face corners
[-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5]], [// bottom
[0, 1, 2], [1, 2, 3], // top
[4, 5, 6], [5, 6, 7], // left
[0, 2, 4], [2, 4, 6], // right
[1, 3, 5], [3, 5, 7], //front
[2, 3, 6], [3, 6, 7], //back
[0, 1, 4], [1, 4, 5]]));
const getChildrenForHitmap$3 = createInstancedGetChildrenForHitmap(1);
function Cubes(props) {
  return /*#__PURE__*/React__namespace.createElement(Command, _extends__default["default"]({
    getChildrenForHitmap: getChildrenForHitmap$3
  }, props, {
    reglCommand: cubes
  }));
}

const NUM_PARALLELS = 15;
const NUM_MERIDIANS = 15;
const RADIUS = 0.5;
const northPole = [0, 0, RADIUS];
const southPole = [0, 0, -RADIUS];
const points = [northPole, southPole];
const faces = [];

for (let i = 0; i < NUM_PARALLELS; i++) {
  for (let j = 0; j < NUM_MERIDIANS; j++) {
    const phi = (i + 1) / (NUM_PARALLELS + 1) * Math.PI;
    const z = RADIUS * Math.cos(phi);
    const width = RADIUS * Math.sin(phi);
    const theta = j * 2 * Math.PI / NUM_MERIDIANS;
    const x = width * Math.cos(theta);
    const y = width * Math.sin(theta);
    points.push([x, y, z]);

    if (j > 0) {
      // connect to previous parallel (or north pole)
      const prevMeridianPt = i === 0 ? 0 : points.length - 1 - NUM_MERIDIANS;
      faces.push([points.length - 2, points.length - 1, prevMeridianPt]);

      if (i > 0) {
        faces.push([points.length - 2, prevMeridianPt - 1, prevMeridianPt]);
      }
    }
  } // connect to previous parallel (or north pole)


  const prevMeridianPt = i === 0 ? 0 : points.length - 2 * NUM_MERIDIANS;
  faces.push([points.length - 1, points.length - NUM_MERIDIANS, prevMeridianPt]);

  if (i > 0) {
    faces.push([points.length - 1, points.length - NUM_MERIDIANS - 1, prevMeridianPt]);
  }
} // connect last parallel to south pole


for (let j = 0; j < NUM_MERIDIANS; j++) {
  const pt = points.length - NUM_MERIDIANS + j;
  const prevPt = j === 0 ? points.length - 1 : pt - 1;
  faces.push([pt, prevPt, 1]);
}

const spheres = withRenderStateOverrides(fromGeometry(points, faces));
const getChildrenForHitmap$2 = createInstancedGetChildrenForHitmap(1);
function Spheres(props) {
  return /*#__PURE__*/React__namespace.createElement(Command, _extends__default["default"]({
    getChildrenForHitmap: getChildrenForHitmap$2
  }, props, {
    reglCommand: spheres
  }));
}

function ownKeys$2(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$2(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$2(Object(source), true).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$2(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
function multiplyScale(scale, factor) {
  return {
    x: scale.x * factor,
    y: scale.y * factor,
    z: scale.z * factor
  };
}
const DEFAULT_COLOR = [1, 1, 1, 1];
const ACTIVE_POLYGON_COLOR = [0.8, 0, 0.8, 1];
const ACTIVE_POINT_COLOR = [1, 0.2, 1, 1];
const LINE_STRIP = "line strip";
const POINT_SIZE_FACTOR = 1.3;
const DRAW_SCALE = {
  x: 0.1,
  y: 0.1,
  z: 0.1
};
const DRAW_POINT_SCALE = multiplyScale(DRAW_SCALE, POINT_SIZE_FACTOR);
const HITMAP_SCALE = {
  x: 0.5,
  y: 0.5,
  z: 0.5
};
const HITMAP_POINT_SCALE = multiplyScale(HITMAP_SCALE, POINT_SIZE_FACTOR);
const POSE = {
  position: {
    x: 0,
    y: 0,
    z: 0
  },
  orientation: {
    x: 0,
    y: 0,
    z: 0,
    w: 0
  }
};
let count = 1;
class PolygonPoint {
  constructor(points) {
    _defineProperty__default["default"](this, "id", void 0);

    _defineProperty__default["default"](this, "point", void 0);

    _defineProperty__default["default"](this, "active", false);

    this.id = count++;
    this.point = points;
  }

}
class Polygon {
  constructor(name = "") {
    _defineProperty__default["default"](this, "id", void 0);

    _defineProperty__default["default"](this, "name", void 0);

    _defineProperty__default["default"](this, "points", []);

    _defineProperty__default["default"](this, "active", false);

    this.name = name;
    this.id = count++;
  }

}

const polygonLinesGetChildrenForHitmap = (props, assignNextColors, excludedObjects) => {
  // This is almost identical to the default nonInstancedGetChildrenForHitmap, with changes marked.
  return props.map(prop => {
    if (excludedObjects.some(({
      object
    }) => object === prop)) {
      return null;
    }

    const hitmapProp = _objectSpread$2({}, prop); // Change from original: pass the original marker as a callback object instead of this marker.


    const [hitmapColor] = assignNextColors(prop.originalMarker, 1); // Change from original: increase scale for hitmap

    hitmapProp.scale = HITMAP_SCALE;
    hitmapProp.color = hitmapColor;

    if (hitmapProp.colors && hitmapProp.points && hitmapProp.points.length) {
      hitmapProp.colors = new Array(hitmapProp.points.length).fill(hitmapColor);
    }

    return hitmapProp;
  }).filter(Boolean);
};
/**
 * Draw the polygon lines
 */


class PolygonLines extends React__default["default"].Component {
  render() {
    const polygons = this.props.children;
    const lines = [];

    for (const poly of polygons) {
      const color = poly.active ? ACTIVE_POLYGON_COLOR : DEFAULT_COLOR;
      const points = poly.points.map(({
        point
      }) => vec3ToPoint(point));
      lines.push({
        primitive: LINE_STRIP,
        pose: POSE,
        points,
        scale: DRAW_SCALE,
        color: vec4ToRGBA(color),
        originalMarker: poly
      });
    }

    return /*#__PURE__*/React__default["default"].createElement(Lines, {
      getChildrenForHitmap: polygonLinesGetChildrenForHitmap
    }, lines);
  }

}

const polygonPointsGetChildrenForHitmap = (props, assignNextColors, excludedObjects) => {
  // This is similar to the default nonInstancedGetChildrenForHitmap, with changes marked.
  return props.map(prop => {
    if (excludedObjects.some(({
      object
    }) => object === prop)) {
      return null;
    }

    const hitmapProp = _objectSpread$2({}, prop); // Change from original: assign a non-instanced color to each point color, even though this marker uses
    // instancing.
    // This is so that we can have a unique callback object for each point.


    hitmapProp.colors = hitmapProp.colors.map((color, index) => {
      return assignNextColors(prop.originalMarkers[index], 1);
    }); // Change from original: increase scale for hitmap

    hitmapProp.scale = HITMAP_POINT_SCALE;
    return hitmapProp;
  }).filter(Boolean);
};
/**
 * Draw the polygon points at the end of each lines
 */


class PolygonPoints extends React__default["default"].Component {
  render() {
    const polygons = this.props.children;
    const points = [];
    const colors = [];
    const originalMarkers = [];

    for (const poly of polygons) {
      const color = poly.active ? ACTIVE_POLYGON_COLOR : DEFAULT_COLOR;

      for (const point of poly.points) {
        const convertedPoint = vec3ToPoint(point.point);
        points.push(convertedPoint);
        colors.push(point.active ? ACTIVE_POINT_COLOR : color);
        originalMarkers.push(point);
      }
    }

    const sphereList = {
      points,
      colors,
      pose: POSE,
      scale: DRAW_POINT_SCALE,
      originalMarkers
    };
    return /*#__PURE__*/React__default["default"].createElement(Spheres, {
      getChildrenForHitmap: polygonPointsGetChildrenForHitmap
    }, [sphereList]);
  }

}

function DrawPolygons({
  children: polygons = []
}) {
  if (polygons.length === 0) {
    return null;
  }

  return /*#__PURE__*/React__default["default"].createElement(React__default["default"].Fragment, null, /*#__PURE__*/React__default["default"].createElement(PolygonLines, null, polygons), /*#__PURE__*/React__default["default"].createElement(PolygonPoints, null, polygons));
}

function areEqual(point1, point2) {
  const [x1, y1, z1] = point1.point;
  const [x2, y2, z2] = point2.point;
  return x1 === x2 && y1 === y2 && z1 === z2;
}

function isClosed(polygon) {
  const {
    points
  } = polygon;

  for (let i = 0; i < points.length - 1; i++) {
    if (areEqual(points[i], points[i + 1])) {
      return true;
    }
  }

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  return areEqual(firstPoint, lastPoint);
} // Has listeners you can pass to Worldview for mouse interactions
// internally builds a list of polygons and modifies the polygons
// based on mouse & keyboard interactions. For now we use mututation internally
// instead of immutability to keep the number of allocations lower and make
// the implementation a bit more straightforward


class PolygonBuilder {
  constructor(polygons = []) {
    _defineProperty__default["default"](this, "mouseDown", false);

    _defineProperty__default["default"](this, "polygons", void 0);

    _defineProperty__default["default"](this, "onChange", () => {});

    _defineProperty__default["default"](this, "activePolygon", void 0);

    _defineProperty__default["default"](this, "activePoint", void 0);

    _defineProperty__default["default"](this, "mouseDownPoint", void 0);

    _defineProperty__default["default"](this, "onMouseMove", (e, args) => {
      // prevent the camera from responding to move if we
      // have an active object being edited
      if (this.activePolygon) {
        e.preventDefault();
        e.stopPropagation();
      } //const cursor = e.ctrlKey ? 'crosshair' : '';
      //document.body.style.cursor = cursor;


      if (!this.mouseDown) {
        return;
      }

      if (!args) {
        return;
      } // early return to only raycast when mouse moves during interaction


      if (!this.activePoint && !this.activePolygon) {
        return;
      }

      const {
        ray
      } = args;
      const point = ray.planeIntersection([0, 0, 0], [0, 0, 1]); // satisfy flow

      if (!point) {
        return;
      } // satisfy flow


      const {
        activePolygon
      } = this;

      if (this.activePoint) {
        this.updateActivePoint(point);
      } else if (activePolygon && this.mouseDownPoint) {
        // move polygon
        const [pointX, pointY] = point;
        const [mouseX, mouseY] = this.mouseDownPoint; // figure out how far the mouse has moved

        const dX = pointX - mouseX;
        const dY = pointY - mouseY; // save the new mouse position as for the next computation

        this.mouseDownPoint = point; // only update the 'overlap' point once

        const uniquePoints = activePolygon.points.reduce((acc, point) => {
          if (!acc.includes(point)) {
            acc.push(point);
          }

          return acc;
        }, []); // adjust each point's location

        for (const polygonPoint of uniquePoints) {
          const {
            point
          } = polygonPoint;
          point[0] = point[0] + dX;
          point[1] = point[1] + dY;
        }

        this.onChange();
      }
    });

    _defineProperty__default["default"](this, "onKeyDown", e => {
      // only respond to key events if we have a selected polygon
      const {
        activePolygon
      } = this;

      if (!activePolygon) {
        return;
      }

      switch (e.key) {
        case "Delete":
        case "Backspace":
          if (this.activePoint) {
            this.deletePoint(this.activePoint);
          } else {
            this.deletePolygon(activePolygon);
          }

          this.onChange();
          break;
      }
    });

    _defineProperty__default["default"](this, "onMouseUp", (e, args) => {
      if (!e.ctrlKey) {
        this.mouseDown = false;
      }
    });

    _defineProperty__default["default"](this, "onDoubleClick", (e, args) => {
      // satisfy flow
      if (!args) {
        return;
      }

      if (!args.objects.length) {
        return;
      }

      this.selectObject(args.objects[0].object); // if a point was double-clicked, delete it

      if (this.activePoint) {
        this.deletePoint(this.activePoint);
        return;
      } // otherwise insert a new point into the nearest line of the active polygon


      const {
        activePolygon
      } = this; // if no polygon is active, don't do anything w/ the double-click

      if (!activePolygon) {
        return;
      }

      let shortestDistance = Number.MAX_SAFE_INTEGER;
      let shortestIndex = -1;
      const {
        ray
      } = args;
      const point = ray.planeIntersection([0, 0, 0], [0, 0, 1]);

      if (!point) {
        return;
      }

      const [px, py] = point; // find the closest line segment of the active polygon

      const {
        points
      } = activePolygon;

      for (let i = 0; i < points.length - 1; i++) {
        const point1 = points[i];
        const point2 = points[i + 1];
        const [x1, y1] = point1.point;
        const [x2, y2] = point2.point; // distance.squared is faster since we don't care about the
        // actual distance, just which line produces the shortest distance

        const dist = distance__default["default"].squared(x1, y1, x2, y2, px, py);

        if (dist < shortestDistance) {
          shortestDistance = dist;
          shortestIndex = i;
        }
      } // insert a new point in the nearest line


      if (shortestIndex > -1) {
        const newPoint = new PolygonPoint(point);
        activePolygon.points.splice(shortestIndex + 1, 0, newPoint);
        this.activePoint = newPoint;
      }

      this.onChange();
    });

    _defineProperty__default["default"](this, "onMouseDown", (e, args) => {
      if (!args) {
        return;
      }

      const {
        ray
      } = args;
      const point = ray.planeIntersection([0, 0, 0], [0, 0, 1]); // satisfy flow but raycasting should always work

      if (!point) {
        return;
      }

      const isFirstClick = !this.mouseDown;
      this.mouseDown = true;
      this.mouseDownPoint = point;
      const isCtrlClick = e.ctrlKey; // single click or click+drag is for selection & moving

      if (isFirstClick && !isCtrlClick) {
        const clickObject = args.objects[0];
        this.selectObject(clickObject && clickObject.object);
        return this.onChange();
      } // ctrl+click always inserts a point


      if (isCtrlClick) {
        this.pushPoint(point);
        return this.onChange();
      } // if mouse was down & we have a non-control click, close the active polygon


      this.closeActivePolygon();
      return this.onChange();
    });

    this.polygons = polygons;
  }

  isActivePolygonClosed() {
    return !!this.activePolygon && isClosed(this.activePolygon);
  } // adds a polygon to the builder, transforming it into the internal representation


  addPolygon(cmd) {
    const {
      points,
      name
    } = cmd;

    if (points.length < 3) {
      return;
    } // clear any selections


    this.selectObject();
    const polygon = new Polygon(name);
    polygon.points = points.map(p => new PolygonPoint([p.x, p.y, p.z || 0]));

    if (!isClosed(polygon)) {
      polygon.points.push(polygon.points[0]);
    }

    this.polygons.push(polygon);
  } // push a new point - either adds to the active polygon
  // or creates a new polygon at this point


  pushPoint(point) {
    const {
      activePolygon
    } = this;

    if (activePolygon) {
      // do not push a point on a closed polygon
      if (!isClosed(activePolygon)) {
        const newPoint = new PolygonPoint(point);
        activePolygon.points.push(newPoint);
        this.selectObject(newPoint);
        return;
      }
    }

    const polygon = new Polygon();
    polygon.points.push(new PolygonPoint(point));
    const floatingPoint = new PolygonPoint(point);
    polygon.points.push(floatingPoint);
    this.polygons.push(polygon);
    this.selectObject(floatingPoint);
    this.onChange();
  } // updates the active point to the new position


  updateActivePoint(point) {
    if (this.activePoint) {
      this.activePoint.point = point;
      this.onChange();
    }
  } // closes the active polygon by either deleting it if
  // is only 2 points (no "single sided" polygons...)
  // or inserts an 'overlap' point by making the first point
  // and last point a reference to the same point in the list
  // this structure of overlap is similar to the structure used by geoJSON
  // though "left to right" ordering is not enforced


  closeActivePolygon() {
    const polygon = this.activePolygon;

    if (!polygon) {
      return;
    } // remove single lines


    if (polygon.points.length === 2) {
      this.deletePolygon(polygon);
    } else {
      polygon.points.push(polygon.points[0]);
    }

    this.onChange();
  } // mouse move handler - should be added to Worldview as a prop


  // deletes a polygon
  deletePolygon(polygon) {
    this.polygons = this.polygons.filter(poly => poly !== polygon);
    this.activePolygon = null;
  } // deletes a point in the active polygon
  // if the point is the 'overlap point' create a new one
  // also deletes the entire polygon if the polygon becomes a 1-sided polygon


  deletePoint(point) {
    const {
      activePolygon
    } = this;

    if (!activePolygon) {
      return;
    }

    const newPoints = activePolygon.points.filter(p => p.id !== point.id); // if the 'overlap' point is deleted, create a new start/end overlap point

    if (newPoints.length === activePolygon.points.length - 2) {
      newPoints.push(newPoints[0]);
    }

    activePolygon.points = newPoints;
    this.activePoint = null;

    if (activePolygon.points.length < 4) {
      this.deletePolygon(activePolygon);
    }

    this.onChange();
  } // key down handler - to be passed to Worldview as a prop


  // select either a point or polygon by id
  selectObject(object) {
    // clear out any previously active objects
    this.activePolygon = null;

    if (this.activePoint) {
      this.activePoint.active = false;
    }

    this.activePoint = null;

    for (const polygon of this.polygons) {
      let isActive = polygon === object;
      polygon.active = isActive;

      if (isActive) {
        this.activePolygon = polygon;
      }

      for (const point of polygon.points) {
        if (point === object) {
          // if a point is selected, activate both it
          // and the polygon it belongs to
          this.activePoint = point;
          point.active = true;
          polygon.active = true;
          this.activePolygon = polygon;
          isActive = true;
        }
      }
    }

    this.onChange();
  } // mouse up handler - to be passed to Worldview as a prop


}

const defaultSingleColorDepth = {
  enable: true,
  mask: false
};
const defaultVetexColorDepth = {
  enable: true,
  mask: true,
  func: "<="
};

const singleColor = regl => withPose({
  primitive: "triangles",
  vert: `
  precision mediump float;

  attribute vec3 point;

  uniform mat4 projection, view;

  #WITH_POSE

  void main () {
    vec3 pos = applyPose(point);
    gl_Position = projection * view * vec4(pos, 1);
  }
  `,
  frag: `
  precision mediump float;
  uniform vec4 color;
  void main () {
    gl_FragColor = color;
  }
  `,
  attributes: {
    point: (context, props) => {
      if (shouldConvert(props.points)) {
        return pointToVec3Array(props.points);
      }

      return props.points;
    }
  },
  uniforms: {
    color: (context, props) => {
      if (shouldConvert(props.color)) {
        return toRGBA(props.color);
      }

      return props.color;
    }
  },
  // can pass in { enable: true, depth: false } to turn off depth to prevent flicker
  // because multiple items are rendered to the same z plane
  depth: {
    enable: (context, props) => {
      return props.depth && props.depth.enable || defaultSingleColorDepth.enable;
    },
    mask: (context, props) => {
      return props.depth && props.depth.mask || defaultSingleColorDepth.mask;
    }
  },
  blend: defaultBlend,
  count: (context, props) => props.points.length
});

const vertexColors = regl => withPose({
  primitive: "triangles",
  vert: `
  precision mediump float;

  attribute vec3 point;
  attribute vec4 color;

  uniform mat4 projection, view;

  varying vec4 vColor;

  #WITH_POSE

  void main () {
    vec3 pos = applyPose(point);
    vColor = color;
    gl_Position = projection * view * vec4(pos, 1);
  }
  `,
  frag: `
  precision mediump float;
  varying vec4 vColor;
  void main () {
    gl_FragColor = vColor;
  }
  `,
  attributes: {
    point: (context, props) => {
      if (shouldConvert(props.points)) {
        return pointToVec3Array(props.points);
      }

      return props.points;
    },
    color: (context, props) => {
      if (!props.colors || !props.colors.length) {
        throw new Error(`Invalid empty or null prop "colors" when rendering triangles using vertex colors`);
      }

      if (shouldConvert(props.colors)) {
        return getVertexColors(props);
      }

      return props.colors;
    }
  },
  depth: {
    enable: (context, props) => {
      return props.depth && props.depth.enable || defaultVetexColorDepth.enable;
    },
    mask: (context, props) => {
      return props.depth && props.depth.mask || defaultVetexColorDepth.mask;
    }
  },
  blend: defaultBlend,
  count: (context, props) => props.points.length
}); // command to render triangle lists optionally supporting vertex colors for each triangle


const triangles = regl => {
  const single = withRenderStateOverrides(singleColor)(regl);
  const vertex = withRenderStateOverrides(vertexColors)(regl);
  return (props, isHitmap) => {
    const items = Array.isArray(props) ? props : [props];
    const singleColorItems = [];
    const vertexColorItems = [];
    items.forEach(item => {
      // If the item has onlyRenderInHitmap set, only render it in the hitmap.
      if (isHitmap || !item.onlyRenderInHitmap) {
        if (item.colors && item.colors.length) {
          vertexColorItems.push(item);
        } else {
          singleColorItems.push(item);
        }
      }
    });
    single(singleColorItems);
    vertex(vertexColorItems);
  };
};

const makeTrianglesCommand = () => {
  return triangles;
};
const getChildrenForHitmap$1 = createInstancedGetChildrenForHitmap(3);
function Triangles(props) {
  return /*#__PURE__*/React__namespace.createElement(Command, _extends__default["default"]({
    getChildrenForHitmap: getChildrenForHitmap$1
  }, props, {
    reglCommand: triangles
  }));
}

const _excluded$2 = ["children"];

function ownKeys$1(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread$1(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys$1(Object(source), true).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys$1(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }
const NO_POSE = {
  position: {
    x: 0,
    y: 0,
    z: 0
  },
  orientation: {
    x: 0,
    y: 0,
    z: 0,
    w: 0
  }
};
const DEFAULT_SCALE = {
  x: 1,
  y: 1,
  z: 1
};

function flatten3D(points) {
  const array = new Float32Array(points.length * 3);

  for (let i = 0; i < points.length; i++) {
    const [x, y, z] = points[i];
    array[i * 3] = x;
    array[i * 3 + 1] = y;
    array[i * 3 + 2] = z;
  }

  return array;
}

function getEarcutPoints(points) {
  const flattenedPoints = flatten3D(points);
  const indices = earcut__default["default"](flattenedPoints, null, 3);
  const newPoints = [];

  for (let i = 0; i < indices.length; i++) {
    const originalIndex = indices[i];
    newPoints.push(points[originalIndex]);
  }

  return newPoints;
}

const generateTriangles = polygons => {
  return polygons.map(poly => {
    // $FlowFixMe flow doesn't know how shouldConvert works
    const points = shouldConvert(poly.points) ? poly.points.map(pointToVec3$1) : poly.points;
    const pose = poly.pose ? poly.pose : NO_POSE;
    const earcutPoints = getEarcutPoints(points);
    return _objectSpread$1(_objectSpread$1({}, poly), {}, {
      points: earcutPoints,
      pose,
      scale: DEFAULT_SCALE,
      originalMarker: poly
    });
  });
};

const makeFilledPolygonsCommand = () => regl => {
  const trianglesCommand = makeTrianglesCommand()(regl);
  return props => {
    trianglesCommand(generateTriangles(props), false);
  };
}; // command to draw a filled polygon

function FilledPolygons(_ref) {
  let {
    children: polygons = []
  } = _ref,
      rest = _objectWithoutProperties__default["default"](_ref, _excluded$2);

  const triangles = generateTriangles(polygons); // Overwrite the triangle's default getChildrenForHitmap because we want to event as if each triangle is a single
  // polygon.

  return /*#__PURE__*/React__default["default"].createElement(Triangles, _extends__default["default"]({
    getChildrenForHitmap: getChildrenForHitmapWithOriginalMarker
  }, rest), triangles);
}

const BG_COLOR_LIGHT$1 = "#ffffff";
const BG_COLOR_DARK$1 = "rgba(0,0,0,0.8)";
const BRIGHTNESS_THRESHOLD = 128;
const DEFAULT_TEXT_COLOR = {
  r: 1,
  g: 1,
  b: 1,
  a: 1
};
const DEFAULT_BG_COLOR = {
  r: 0,
  g: 0,
  b: 0,
  a: 0.8
};
let cssHasBeenInserted = false;

function insertGlobalCss() {
  if (cssHasBeenInserted) {
    return;
  }

  const style = document.createElement("style");
  style.innerHTML = `
    .regl-worldview-text-wrapper {
      position: absolute;
      white-space: nowrap;
      z-index: 100;
      pointer-events: none;
      top: 0;
      left: 0;
      will-change: transform;
    }
    .regl-worldview-text-inner {
      position: relative;
      left: -50%;
      top: -0.5em;
      white-space: pre-line;
    }
  `;

  if (document.body) {
    document.body.appendChild(style);
  }

  cssHasBeenInserted = true;
}

function isColorDark({
  r,
  g,
  b
}) {
  // ITU-R BT.709 https://en.wikipedia.org/wiki/Rec._709
  // 0.2126 * 255 * r + 0.7152 * 255 * g + 0.0722 * 255 * b
  const luma = 54.213 * r + 182.376 * g + 18.411 * b;
  return luma < BRIGHTNESS_THRESHOLD;
}

function isColorEqual(a, b) {
  return a.r === b.r && a.g === b.g && a.b === b.b && a.a === b.a;
}

class TextElement {
  // store prev colors to improve perf
  constructor() {
    _defineProperty__default["default"](this, "wrapper", document.createElement("span"));

    _defineProperty__default["default"](this, "_inner", document.createElement("span"));

    _defineProperty__default["default"](this, "_text", document.createTextNode(""));

    _defineProperty__default["default"](this, "_prevTextColor", DEFAULT_TEXT_COLOR);

    _defineProperty__default["default"](this, "_prevBgColor", DEFAULT_BG_COLOR);

    _defineProperty__default["default"](this, "_prevAutoBackgroundColor", null);

    insertGlobalCss();
    this.wrapper.className = "regl-worldview-text-wrapper";
    this._inner.className = "regl-worldview-text-inner";
    this.wrapper.appendChild(this._inner);

    this._inner.appendChild(this._text);

    this.wrapper.style.color = getCSSColor(DEFAULT_TEXT_COLOR);
  }

  update(marker, left, top, autoBackgroundColor) {
    this.wrapper.style.transform = `translate(${left.toFixed()}px,${top.toFixed()}px)`;
    const {
      color,
      colors = []
    } = marker;
    const hasBgColor = colors.length >= 2;
    const textColor = toColor(hasBgColor ? colors[0] : color || [0, 0, 0, 1]);

    if (textColor) {
      const backgroundColor = toColor(colors[1]);

      if (!isColorEqual(this._prevTextColor, textColor)) {
        this._prevTextColor = textColor;
        this.wrapper.style.color = getCSSColor(textColor);
      }

      if (!autoBackgroundColor && autoBackgroundColor !== this._prevAutoBackgroundColor) {
        // remove background color if autoBackgroundColor has changed
        this._inner.style.background = "transparent";
        this._prevBgColor = null;
      } else {
        if (autoBackgroundColor && (!this._prevBgColor || this._prevBgColor && !isColorEqual(textColor, this._prevBgColor))) {
          // update background color with automatic dark/light color
          this._prevBgColor = textColor;
          const isTextColorDark = isColorDark(textColor);
          const hexBgColor = isTextColorDark ? BG_COLOR_LIGHT$1 : BG_COLOR_DARK$1;
          this._inner.style.background = hexBgColor;
        } else if (hasBgColor && this._prevBgColor && !isColorEqual(backgroundColor, this._prevBgColor)) {
          // update background color with colors[1] data
          this._prevBgColor = backgroundColor;
          this._inner.style.background = getCSSColor(backgroundColor);
        }
      }
    }

    this._prevAutoBackgroundColor = autoBackgroundColor;

    if (this._text.textContent !== marker.text) {
      this._text.textContent = marker.text || "";
    }
  }

}

// Render text on a scene using DOM nodes, similar to the Overlay command.
// Implementation uses manual DOM manipulation to avoid the performance hit from React tree reconciliation.
class Text extends React__default["default"].Component {
  constructor(...args) {
    super(...args);

    _defineProperty__default["default"](this, "_context", void 0);

    _defineProperty__default["default"](this, "_textComponents", new Map());

    _defineProperty__default["default"](this, "_textContainerRef", /*#__PURE__*/React__default["default"].createRef());

    _defineProperty__default["default"](this, "componentWillUnmount", () => {
      if (this._context) {
        this._context.unregisterPaintCallback(this.paint);
      }
    });

    _defineProperty__default["default"](this, "paint", () => {
      const context = this._context;
      const textComponents = this._textComponents;
      const {
        children: markers,
        autoBackgroundColor
      } = this.props;
      const {
        current: textContainer
      } = this._textContainerRef;
      const initializedData = context && context.initializedData;

      if (!textContainer || !context || !initializedData) {
        return;
      }

      const {
        dimension,
        dimension: {
          width,
          height
        }
      } = context;
      const {
        camera
      } = initializedData;
      const componentsToRemove = new Set(textComponents.keys());

      for (const marker of markers) {
        const {
          pose,
          name
        } = marker;
        const {
          position
        } = pose;
        const coord = this.project(position, camera, dimension);

        if (!coord) {
          continue;
        }

        const [left, top] = coord;

        if (left < -10 || top < -10 || left > width + 10 || top > height + 10) {
          continue;
        }

        let el = textComponents.get(name || marker);

        if (el) {
          componentsToRemove.delete(name || marker);
        } else {
          el = new TextElement();
          textComponents.set(name || marker, el);
          textContainer.appendChild(el.wrapper);
        }

        el.update(marker, left, top, autoBackgroundColor);
      }

      for (const key of componentsToRemove) {
        const el = textComponents.get(key);

        if (!el) {
          continue;
        }

        el.wrapper.remove();
        textComponents.delete(key);
      }
    });

    _defineProperty__default["default"](this, "project", (point, camera, dimension) => {
      const vec = [point.x, point.y, point.z];
      const {
        left,
        top,
        width,
        height
      } = dimension;
      const viewport = [left, top, width, height];
      return camera.toScreenCoord(viewport, vec);
    });
  }

  componentDidMount() {
    if (this._context) {
      this._context.registerPaintCallback(this.paint);
    }
  }

  render() {
    return /*#__PURE__*/React__default["default"].createElement(React__default["default"].Fragment, null, /*#__PURE__*/React__default["default"].createElement("div", {
      ref: this._textContainerRef
    }), /*#__PURE__*/React__default["default"].createElement(WorldviewReactContext.Consumer, null, ctx => {
      if (ctx) {
        this._context = ctx;
      }

      return null;
    }));
  }

}

_defineProperty__default["default"](Text, "defaultProps", {
  children: []
});

// TODO(steel): Upstream the fix in memoizedCreateCanvas.

if (typeof self !== "undefined" && !self.document) {
  // $FlowFixMe: Flow doesn't know about OffscreenCanvas.
  self.document = {
    createElement: () => new OffscreenCanvas(0, 0)
  };
} // The GLText command renders text from a Signed Distance Field texture.
// There are many external resources about SDFs and text rendering in WebGL, including:
// https://steamcdn-a.akamaihd.net/apps/valve/2007/SIGGRAPH2007_AlphaTestedMagnification.pdf
// https://blog.mapbox.com/drawing-text-with-signed-distance-fields-in-mapbox-gl-b0933af6f817
// http://hack.chrons.me/opengl-text-rendering/
// https://stackoverflow.com/questions/25956272/better-quality-text-in-webgl
//
// Approach
// ========
// Characters from the font are measured using a <canvas> and the SDFs are drawn into a texture up front
// (and whenever new characters are being rendered). Then one instanced draw call is made with an instance
// per character which reads from the corresponding place in the texture atlas.
//
// Possible future improvements
// ============================
// - Allow customization of font style, maybe highlight ranges.
// - Consider a solid rectangular background instead of an outline. This is challenging because the
//   instances currently overlap, so there will be z-fighting, but might be possible using the stencil buffer and multiple draw calls.
// - Somehow support kerning and more advanced font metrics. However, the web font APIs may not
//   provide support for this. Some font info could be generated/stored offline, possibly including the atlas.
// - Explore multi-channel SDFs.


// Font size used in rendering the atlas. This is independent of the `scale` of the rendered text.
const MIN_RESOLUTION = 40;
const DEFAULT_RESOLUTION = 160;
const SDF_RADIUS = 8;
const CUTOFF = 0.25;
const BUFFER = 10;
const BG_COLOR_LIGHT = Object.freeze({
  r: 1,
  g: 1,
  b: 1,
  a: 1
});
const BG_COLOR_DARK = Object.freeze({
  r: 0,
  g: 0,
  b: 0,
  a: 1
});
const memoizedCreateCanvas = memoizeOne__default["default"](font => {
  // $FlowFixMe: Flow doesn't know about OffscreenCanvas.
  const canvas = self.OffscreenCanvas ? new OffscreenCanvas(0, 0) : document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  ctx.font = font;
  return ctx;
});

const hashMarkerPosition = marker => {
  const {
    x,
    y,
    z
  } = marker.pose.position; // The hash is a simple string with all three components

  return `x${x}y${y}z${z}`;
};

const getMarkerYOffset = (offsets, marker) => {
  return offsets.get(hashMarkerPosition(marker)) || 0;
};

const setMarkerYOffset = (offsets, marker, yOffset) => {
  offsets.set(hashMarkerPosition(marker), yOffset);
}; // Build a single font atlas: a texture containing all characters and position/size data for each character.


const createMemoizedGenerateAtlas = () => memoizeOne__default["default"]( // We update charSet mutably but monotonically. Pass in the size to invalidate the cache.
(charSet, _setSize, resolution, maxAtlasWidth) => {
  const tinySDF = new TinySDF__default["default"](resolution, BUFFER, SDF_RADIUS, CUTOFF, "sans-serif", "normal");
  const ctx = memoizedCreateCanvas(`${resolution}px sans-serif`);
  let textureWidth = 0;
  const rowHeight = resolution + 2 * BUFFER;
  const charInfo = {}; // Measure and assign positions to all characters

  let x = 0;
  let y = 0;

  for (const char of charSet) {
    const width = ctx.measureText(char).width;
    const dx = Math.ceil(width) + 2 * BUFFER;

    if (x + dx > maxAtlasWidth) {
      x = 0;
      y += rowHeight;
    }

    charInfo[char] = {
      x,
      y,
      width
    };
    x += dx;
    textureWidth = Math.max(textureWidth, x);
  }

  const textureHeight = y + rowHeight;
  const textureData = new Uint8Array(textureWidth * textureHeight); // Use tiny-sdf to create SDF images for each character and copy them into a single texture

  for (const char of charSet) {
    const {
      x,
      y
    } = charInfo[char];
    const data = tinySDF.draw(char);

    for (let i = 0; i < tinySDF.size; i++) {
      for (let j = 0; j < tinySDF.size; j++) {
        // if this character is near the right edge, we don't actually copy the whole square of data
        if (x + j < textureWidth) {
          textureData[textureWidth * (y + i) + x + j] = data[i * tinySDF.size + j];
        }
      }
    }
  }

  return {
    charInfo,
    textureWidth,
    textureHeight,
    textureData
  };
});

const createMemoizedDrawAtlasTexture = () => memoizeOne__default["default"]((textAtlas, atlasTexture) => {
  atlasTexture({
    data: textAtlas.textureData,
    width: textAtlas.textureWidth,
    height: textAtlas.textureHeight,
    format: "alpha",
    wrap: "clamp",
    mag: "linear",
    min: "linear"
  });
});

const vert = `
  precision mediump float;

  uniform mat4 projection, view, billboardRotation;
  uniform float fontSize;
  uniform vec2 atlasSize;
  uniform bool scaleInvariant;
  uniform float scaleInvariantSize;
  uniform float viewportHeight;
  uniform float viewportWidth;
  uniform bool isPerspective;
  uniform float cameraFovY;

  // per-vertex attributes
  attribute vec2 texCoord;
  attribute vec2 position;

  // per-instance (character) attributes
  attribute vec2 srcOffset;
  attribute float srcWidth;
  attribute vec2 destOffset;

  // per-marker attributes
  attribute vec3 scale;
  attribute float billboard;
  attribute vec2 alignmentOffset;
  attribute float enableBackground;
  attribute float enableHighlight;
  attribute vec4 foregroundColor;
  attribute vec4 backgroundColor;
  attribute vec4 highlightColor;
  attribute vec3 posePosition;
  attribute vec4 poseOrientation;

  varying vec2 vTexCoord;
  varying float vEnableBackground;
  varying vec4 vForegroundColor;
  varying vec4 vBackgroundColor;
  varying vec4 vHighlightColor;
  varying float vEnableHighlight;
  varying float vBillboard;

  // rotate a 3d point v by a rotation quaternion q
  // like applyPose(), but we need to use a custom per-instance pose
  vec3 rotate(vec3 v, vec4 q) {
    vec3 temp = cross(q.xyz, v) + q.w * v;
    return v + (2.0 * cross(q.xyz, temp));
  }

  vec4 computeVertexPosition(vec3 markerPos) {
    vec3 pos;
    if (billboard == 1.0) {
      pos = (billboardRotation * vec4(markerPos, 1.0)).xyz + posePosition;
    } else {
      pos = rotate(markerPos, poseOrientation) + posePosition;
    }
    return projection * view * vec4(pos, 1.0);
  }

  void main () {
    // Scale invariance only works for billboards
    bool scaleInvariantEnabled = scaleInvariant && billboard == 1.0;

    vec2 srcSize = vec2(srcWidth, fontSize);
    vec3 markerSpacePos = vec3((destOffset + position * srcSize + alignmentOffset) / fontSize, 0);

    if (!scaleInvariantEnabled) {
      // Apply marker scale only when scale invariance is disabled
      markerSpacePos *= scale;
    } else {
      // If scale invariance is enabled, the text will be rendered at a constant
      // scale regardless of the zoom level.
      // The given scaleInvariantSize is in pixels. We need to scale it based on
      // the current canvas resolution to get the proper dimensions later in NDC
      float scaleInvariantFactor = scaleInvariantSize / viewportHeight;
      if (isPerspective) {
        // When using a perspective projection, the effect is achieved by using
        // the w-component for scaling, which is obtained by first projecting
        // the marker position into clip space.
        gl_Position = computeVertexPosition(markerSpacePos);
        scaleInvariantFactor *= gl_Position.w;
        // We also need to take into account the camera's half vertical FOV
        scaleInvariantFactor *= cameraFovY;
      } else {
        // Compute inverse aspect ratio
        float invAspect = viewportHeight / viewportWidth;
        // When using orthographic projection, the scaling factor is obtain from
        // the camera projection itself.
        // We also need applied the inverse aspect ratio
        scaleInvariantFactor *= 2.0 * invAspect / length(projection[0].xyz);
      }
      // Apply scale invariant factor
      markerSpacePos *= scaleInvariantFactor;
    }

    // Compute final vertex position
    gl_Position = computeVertexPosition(markerSpacePos);

    vTexCoord = (srcOffset + texCoord * srcSize) / atlasSize;
    vEnableBackground = enableBackground;
    vForegroundColor = foregroundColor;
    vBackgroundColor = backgroundColor;
    vHighlightColor = highlightColor;
    vEnableHighlight = enableHighlight;
    vBillboard = billboard;
  }
`;
const frag = `
  #extension GL_OES_standard_derivatives : enable
  precision mediump float;
  uniform mat4 projection;
  uniform sampler2D atlas;
  uniform float cutoff;
  uniform bool scaleInvariant;
  uniform float scaleInvariantSize;
  uniform bool isHitmap;

  varying vec2 vTexCoord;
  varying float vEnableBackground;
  varying vec4 vForegroundColor;
  varying vec4 vBackgroundColor;
  varying vec4 vHighlightColor;
  varying float vEnableHighlight;
  varying float vBillboard;

  void main() {
    float dist = texture2D(atlas, vTexCoord).a;

    // fwidth(dist) is used to provide some anti-aliasing. However it's currently only used
    // when the solid background is enabled, because the alpha blending and
    // depth test don't work together nicely for partially-transparent pixels.
    float edgeStep = smoothstep(1.0 - cutoff - fwidth(dist), 1.0 - cutoff, dist);

    if (scaleInvariant && vBillboard == 1.0 && scaleInvariantSize <= 20.0) {
      // If scale invariant is enabled and scaleInvariantSize is "too small", do not interpolate
      // the raw distance value since at such small scale, the SDF approach causes some
      // visual artifacts.
      // The value used for checking if scaleInvariantSize is "too small" is arbitrary and
      // was defined after some experimentation.
      edgeStep = dist;
    }

    if (isHitmap) {
      // When rendering for the hitmap buffer, we draw flat polygons using the foreground color
      // instead of the actual glyphs. This way we increase the selection range and provide a
      // better user experience.
      gl_FragColor = vForegroundColor;
    } else if (vEnableHighlight > 0.5) {
      gl_FragColor = mix(vHighlightColor, vec4(0, 0, 0, 1), edgeStep);
    } else if (vEnableBackground > 0.5) {
      gl_FragColor = mix(vBackgroundColor, vForegroundColor, edgeStep);
    } else {
      gl_FragColor = vForegroundColor;
      gl_FragColor.a *= edgeStep;
    }

    if (gl_FragColor.a == 0.) {
      discard;
    }
  }
`;

function makeTextCommand(alphabet) {
  // Keep the set of rendered characters around so we don't have to rebuild the font atlas too often.
  const charSet = new Set(alphabet || []);
  const memoizedGenerateAtlas = createMemoizedGenerateAtlas();
  const memoizedDrawAtlasTexture = createMemoizedDrawAtlasTexture();

  const command = regl => {
    if (!regl) {
      throw new Error("Invalid regl instance");
    }

    const atlasTexture = regl.texture();
    const drawText = regl({
      // When using scale invariance, we want the text to be drawn on top
      // of other elements. This is achieved by disabling depth testing
      // In addition, make sure the <GLText /> command is the last one
      // being rendered.
      depth: {
        enable: (ctx, props) => props.scaleInvariant ? false : defaultDepth.enable(ctx, props),
        mask: (ctx, props) => props.scaleInvariant ? false : defaultDepth.mask(ctx, props)
      },
      blend: defaultBlend,
      primitive: "triangle strip",
      vert,
      frag,
      uniforms: {
        atlas: atlasTexture,
        atlasSize: () => [atlasTexture.width, atlasTexture.height],
        fontSize: regl.prop("resolution"),
        cutoff: CUTOFF,
        scaleInvariant: regl.prop("scaleInvariant"),
        scaleInvariantSize: regl.prop("scaleInvariantSize"),
        isHitmap: regl.prop("isHitmap"),
        viewportHeight: regl.context("viewportHeight"),
        viewportWidth: regl.context("viewportWidth"),
        isPerspective: regl.context("isPerspective"),
        cameraFovY: regl.context("fovy")
      },
      instances: regl.prop("instances"),
      count: 4,
      attributes: {
        position: [[0, 0], [0, -1], [1, 0], [1, -1]],
        texCoord: [[0, 0], [0, 1], [1, 0], [1, 1]],
        // flipped
        srcOffset: (ctx, props) => ({
          buffer: props.srcOffsets,
          divisor: 1
        }),
        destOffset: (ctx, props) => ({
          buffer: props.destOffsets,
          divisor: 1
        }),
        srcWidth: (ctx, props) => ({
          buffer: props.srcWidths,
          divisor: 1
        }),
        scale: (ctx, props) => ({
          buffer: props.scale,
          divisor: 1
        }),
        alignmentOffset: (ctx, props) => ({
          buffer: props.alignmentOffset,
          divisor: 1
        }),
        billboard: (ctx, props) => ({
          buffer: props.billboard,
          divisor: 1
        }),
        foregroundColor: (ctx, props) => ({
          buffer: props.foregroundColor,
          divisor: 1
        }),
        backgroundColor: (ctx, props) => ({
          buffer: props.backgroundColor,
          divisor: 1
        }),
        highlightColor: (ctx, props) => ({
          buffer: props.highlightColor,
          divisor: 1
        }),
        enableBackground: (ctx, props) => ({
          buffer: props.enableBackground,
          divisor: 1
        }),
        enableHighlight: (ctx, props) => ({
          buffer: props.enableHighlight,
          divisor: 1
        }),
        posePosition: (ctx, props) => ({
          buffer: props.posePosition,
          divisor: 1
        }),
        poseOrientation: (ctx, props) => ({
          buffer: props.poseOrientation,
          divisor: 1
        })
      }
    });
    return (props, isHitmap) => {
      let estimatedInstances = 0;

      for (const {
        text
      } of props) {
        if (typeof text !== "string") {
          throw new Error(`Expected typeof 'text' to be a string. But got type '${typeof text}' instead.`);
        }

        for (const char of text) {
          ++estimatedInstances;
          charSet.add(char);
        }
      }

      let generatedAtlas = command.textAtlas;
      const generatedAtlasChars = generatedAtlas ? Object.keys(generatedAtlas.charInfo) : [];
      const textChars = Array.from(charSet);
      const generatedAtlasHasAllChars = difference__default["default"](textChars, generatedAtlasChars).length === 0;

      if (!generatedAtlas || !generatedAtlasHasAllChars) {
        // See http://webglstats.com/webgl/parameter/MAX_TEXTURE_SIZE - everyone has at least min 2048 texture size, and
        // almost everyone has at least 4096. With a 2048 width we have ~900 height with a full character set.
        const maxAtlasWidth = regl.limits.maxTextureSize || 2048;
        generatedAtlas = memoizedGenerateAtlas(charSet, charSet.size, command.resolution, maxAtlasWidth);
      }

      memoizedDrawAtlasTexture(generatedAtlas, atlasTexture);
      const destOffsets = new Float32Array(estimatedInstances * 2);
      const srcWidths = new Float32Array(estimatedInstances);
      const srcOffsets = new Float32Array(estimatedInstances * 2); // These don't vary across characters within a marker, but the divisor can't be dynamic so we have to duplicate the data for each character.

      const alignmentOffset = new Float32Array(estimatedInstances * 2);
      const scale = new Float32Array(estimatedInstances * 3);
      const foregroundColor = new Float32Array(estimatedInstances * 4);
      const backgroundColor = new Float32Array(estimatedInstances * 4);
      const highlightColor = new Float32Array(estimatedInstances * 4);
      const enableBackground = new Float32Array(estimatedInstances);
      const billboard = new Float32Array(estimatedInstances);
      const posePosition = new Float32Array(estimatedInstances * 3);
      const poseOrientation = new Float32Array(estimatedInstances * 4);
      const enableHighlight = new Float32Array(estimatedInstances);
      let totalInstances = 0; // Markers sharing the same position will be rendered in multiple lines.
      // We keep track of offsets for the y-coordinate.
      // We cannot use same value comparison here, so the
      // key of the map is a hash based on the marker's position
      // (see hashMarkerPosition() above).

      const yOffsets = new Map();

      for (const marker of props) {
        var _marker$colors, _marker$colors2, _marker$colors3;

        let totalWidth = 0;
        let x = 0;
        let y = getMarkerYOffset(yOffsets, marker);
        let markerInstances = 0;
        let lineCount = 1; // every text has at least one line
        // If we need to render text for hitmap framebuffer, we only render the polygons using
        // the foreground color (which needs to be converted to RGBA since it's a vec4).
        // See comment on fragment shader above

        const fgColor = toColor(isHitmap ? marker.color || [0, 0, 0, 1] : ((_marker$colors = marker.colors) === null || _marker$colors === void 0 ? void 0 : _marker$colors[0]) || marker.color || BG_COLOR_LIGHT);
        const outline = ((_marker$colors2 = marker.colors) === null || _marker$colors2 === void 0 ? void 0 : _marker$colors2[1]) != null || command.autoBackgroundColor;
        const bgColor = toColor(((_marker$colors3 = marker.colors) === null || _marker$colors3 === void 0 ? void 0 : _marker$colors3[1]) || (command.autoBackgroundColor && isColorDark(fgColor) ? BG_COLOR_LIGHT : BG_COLOR_DARK));
        const hlColor = (marker === null || marker === void 0 ? void 0 : marker.highlightColor) || {
          r: 1,
          b: 0,
          g: 1,
          a: 1
        };

        for (let i = 0; i < marker.text.length; i++) {
          var _marker$billboard;

          const char = marker.text[i];

          if (char === "\n") {
            x = 0; // Make sure every line in the text is offsetted correctly

            y += command.resolution;
            lineCount++;
            continue;
          }

          const info = generatedAtlas.charInfo[char];
          const index = totalInstances + markerInstances; // Calculate per-character attributes

          destOffsets[2 * index + 0] = x;
          destOffsets[2 * index + 1] = -y;
          srcOffsets[2 * index + 0] = info.x + BUFFER; // In order to make sure there's enough room for glyphs' descenders (i.e. 'g'),
          // we need to apply an extra offset based on the font resolution.
          // The value used to compute the offset is a result of experimentation.

          srcOffsets[2 * index + 1] = info.y + BUFFER + 0.05 * command.resolution;
          srcWidths[index] = info.width;
          x += info.width;
          totalWidth = Math.max(totalWidth, x); // Copy per-marker attributes. These are duplicated per character so that we can draw
          // all characters from all markers in a single draw call.

          billboard[index] = ((_marker$billboard = marker.billboard) !== null && _marker$billboard !== void 0 ? _marker$billboard : true) ? 1 : 0;
          scale[3 * index + 0] = marker.scale.x;
          scale[3 * index + 1] = marker.scale.y;
          scale[3 * index + 2] = marker.scale.z;
          posePosition[3 * index + 0] = marker.pose.position.x;
          posePosition[3 * index + 1] = marker.pose.position.y;
          posePosition[3 * index + 2] = marker.pose.position.z;
          poseOrientation[4 * index + 0] = marker.pose.orientation.x;
          poseOrientation[4 * index + 1] = marker.pose.orientation.y;
          poseOrientation[4 * index + 2] = marker.pose.orientation.z;
          poseOrientation[4 * index + 3] = marker.pose.orientation.w;
          foregroundColor[4 * index + 0] = fgColor.r;
          foregroundColor[4 * index + 1] = fgColor.g;
          foregroundColor[4 * index + 2] = fgColor.b;
          foregroundColor[4 * index + 3] = fgColor.a;
          backgroundColor[4 * index + 0] = bgColor.r;
          backgroundColor[4 * index + 1] = bgColor.g;
          backgroundColor[4 * index + 2] = bgColor.b;
          backgroundColor[4 * index + 3] = bgColor.a;
          highlightColor[4 * index + 0] = hlColor.r;
          highlightColor[4 * index + 1] = hlColor.g;
          highlightColor[4 * index + 2] = hlColor.b;
          highlightColor[4 * index + 3] = hlColor.a;
          enableHighlight[index] = marker.highlightedIndices && marker.highlightedIndices.includes(i) ? 1 : 0;
          enableBackground[index] = outline ? 1 : 0;
          ++markerInstances;
        }

        const totalHeight = y + command.resolution;

        for (let i = 0; i < markerInstances; i++) {
          alignmentOffset[2 * (totalInstances + i) + 0] = -totalWidth / 2;
          alignmentOffset[2 * (totalInstances + i) + 1] = totalHeight / 2;
        } // Compute the y-coordinate's offset for the next overlapped marker, if any.
        // Basically, we add as many offsets as numbers of lines in the marker's text.
        // Since the y-coordinate is inverted when computing destOffset[] a few lines above
        // we need an additional command.resolution offset (precomputed in totalHeight).


        setMarkerYOffset(yOffsets, marker, totalHeight + lineCount * command.resolution);
        totalInstances += markerInstances;
      }

      drawText({
        instances: totalInstances,
        isHitmap: !!isHitmap,
        scaleInvariant: command.scaleInvariant,
        resolution: command.resolution,
        scaleInvariantSize: command.scaleInvariantSize,
        // per-character
        srcOffsets,
        destOffsets,
        srcWidths,
        // per-marker
        alignmentOffset,
        billboard,
        enableBackground,
        enableHighlight,
        foregroundColor,
        backgroundColor,
        highlightColor,
        poseOrientation,
        posePosition,
        scale
      });
    };
  };

  command.autoBackgroundColor = false;
  return command;
}

const makeGLTextCommand = props => {
  var _props$scaleInvariant;

  const command = makeTextCommand(props.alphabet); // HACK: Worldview doesn't provide an easy way to pass a command-level prop into the regl commands,
  // so just attach it to the command object for now.

  command.autoBackgroundColor = props.autoBackgroundColor;
  command.resolution = Math.max(MIN_RESOLUTION, props.resolution || DEFAULT_RESOLUTION);
  command.scaleInvariant = props.scaleInvariantFontSize != null;
  command.scaleInvariantSize = (_props$scaleInvariant = props.scaleInvariantFontSize) !== null && _props$scaleInvariant !== void 0 ? _props$scaleInvariant : 0;
  command.textAtlas = props.textAtlas;
  return command;
};
function GLText(props) {
  const [command] = React.useState(() => makeGLTextCommand(props));
  const getChildrenForHitmap = createInstancedGetChildrenForHitmap(1);
  return /*#__PURE__*/React__default["default"].createElement(Command, _extends__default["default"]({
    getChildrenForHitmap: getChildrenForHitmap,
    reglCommand: command
  }, props));
}

const _excluded$1 = ["children", "model"];

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty__default["default"](target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function glConstantToRegl(value) {
  if (value === undefined) {
    return undefined;
  } // prettier-ignore


  switch (value) {
    // min/mag filters
    case WebGLRenderingContext.NEAREST:
      return "nearest";

    case WebGLRenderingContext.LINEAR:
      return "linear";

    case WebGLRenderingContext.NEAREST_MIPMAP_NEAREST:
      return "nearest mipmap nearest";

    case WebGLRenderingContext.NEAREST_MIPMAP_LINEAR:
      return "nearest mipmap linear";

    case WebGLRenderingContext.LINEAR_MIPMAP_NEAREST:
      return "linear mipmap nearest";

    case WebGLRenderingContext.LINEAR_MIPMAP_LINEAR:
      return "linear mipmap linear";
    // texture wrapping modes

    case WebGLRenderingContext.REPEAT:
      return "repeat";

    case WebGLRenderingContext.CLAMP_TO_EDGE:
      return "clamp";

    case WebGLRenderingContext.MIRRORED_REPEAT:
      return "mirror";
  }

  throw new Error(`unhandled constant value ${JSON.stringify(value)}`);
} // Default sampler set based on GLTF recommendations:
// https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#texture


const getDefaultSampler = () => ({
  minFilter: WebGLRenderingContext.NEAREST_MIPMAP_LINEAR,
  magFilter: WebGLRenderingContext.LINEAR,
  wrapS: WebGLRenderingContext.REPEAT,
  wrapT: WebGLRenderingContext.REPEAT
});

const getSceneToDraw = ({
  json
}) => {
  var _json$scenes;

  if (json.scene != null) {
    return json.scene;
  } // Draw the first scene if the scene key is missing.


  const keys = Object.keys((_json$scenes = json.scenes) !== null && _json$scenes !== void 0 ? _json$scenes : {});

  if (keys.length === 0) {
    throw new Error("No scenes to render");
  }

  return keys[0];
};

const drawModel = regl => {
  if (!regl) {
    throw new Error("Invalid regl instance");
  }

  const command = regl({
    primitive: "triangles",
    blend: defaultBlend,
    uniforms: {
      globalAlpha: regl.context("globalAlpha"),
      poseMatrix: regl.context("poseMatrix"),
      baseColorTexture: regl.prop("baseColorTexture"),
      baseColorFactor: regl.prop("baseColorFactor"),
      nodeMatrix: regl.prop("nodeMatrix"),
      "light.direction": [0, 0, -1],
      "light.ambientIntensity": 0.5,
      "light.diffuseIntensity": 0.5,
      hitmapColor: regl.context("hitmapColor"),
      isHitmap: regl.context("isHitmap"),
      unlit: regl.prop("unlit"),
      overrideColor: regl.context("overrideColor"),
      useOverrideColor: regl.context("useOverrideColor")
    },
    attributes: {
      position: regl.prop("positions"),
      normal: regl.prop("normals"),
      texCoord: regl.prop("texCoords")
    },
    elements: regl.prop("indices"),
    vert: `
  uniform mat4 projection, view;
  uniform mat4 nodeMatrix;
  uniform mat4 poseMatrix;
  attribute vec3 position, normal;
  varying vec3 vNormal;
  attribute vec2 texCoord;
  varying vec2 vTexCoord;

  void main() {
    // using the projection matrix for normals breaks lighting for orthographic mode
    mat4 mv = view * poseMatrix * nodeMatrix;
    vNormal = normalize((mv * vec4(normal, 0)).xyz);
    vTexCoord = texCoord;
    gl_Position = projection * mv * vec4(position, 1);
  }
  `,
    frag: `
  precision mediump float;
  uniform bool isHitmap;
  uniform bool unlit;
  uniform vec4 hitmapColor;
  uniform bool useOverrideColor;
  uniform vec4 overrideColor;
  uniform float globalAlpha;
  uniform sampler2D baseColorTexture;
  uniform vec4 baseColorFactor;
  varying mediump vec2 vTexCoord;
  varying mediump vec3 vNormal;

  // Basic directional lighting from:
  // http://ogldev.atspace.co.uk/www/tutorial18/tutorial18.html
  struct DirectionalLight {
    mediump vec3 direction;
    lowp float ambientIntensity;
    lowp float diffuseIntensity;
  };
  uniform DirectionalLight light;

  void main() {
    vec4 baseColor = useOverrideColor ? overrideColor : texture2D(baseColorTexture, vTexCoord) * baseColorFactor;
    float diffuse = light.diffuseIntensity * max(0.0, dot(vNormal, -light.direction));
    if (isHitmap) {
      gl_FragColor = hitmapColor;
    } else if (unlit) {
      gl_FragColor = vec4(baseColor.rgb, baseColor.a * globalAlpha);
    } else {
      gl_FragColor = vec4((light.ambientIntensity + diffuse) * baseColor.rgb, baseColor.a * globalAlpha);
    }
  }
  `
  }); // default values for when baseColorTexture is not specified

  const singleTexCoord = regl.buffer([0, 0]);
  const whiteTexture = regl.texture({
    data: [255, 255, 255, 255],
    width: 1,
    height: 1
  }); // build the draw calls needed to draw the model. This will happen whenever the model changes.

  const getDrawCalls = memoizeWeak__default["default"](model => {
    // upload textures to the GPU
    const {
      accessors
    } = model;
    const textures = model.json.textures && model.json.textures.map(textureInfo => {
      const sampler = textureInfo.sampler ? model.json.samplers[textureInfo.sampler] : getDefaultSampler();
      const bitmap = model.images && model.images[textureInfo.source];
      const texture = regl.texture({
        data: bitmap,
        min: glConstantToRegl(sampler.minFilter),
        mag: glConstantToRegl(sampler.magFilter),
        wrapS: sampler.wrapS ? glConstantToRegl(sampler.wrapS) : "repeat",
        wrapT: sampler.wrapT ? glConstantToRegl(sampler.wrapT) : "repeat"
      });
      return texture;
    });

    if (model.images) {
      model.images.forEach(bitmap => bitmap.close());
    }

    const drawCalls = []; // helper to draw the primitives comprising a mesh

    function drawMesh(mesh, nodeMatrix) {
      for (const primitive of mesh.primitives) {
        var _primitive$mode, _material$extensions;

        if (((_primitive$mode = primitive.mode) !== null && _primitive$mode !== void 0 ? _primitive$mode : 4) !== 4) {
          console.warn(`GLTFScene: ignoring glTF primitive with mode ${primitive.mode}, only TRIANGLES are currently supported`);
          continue;
        }

        const material = model.json.materials[primitive.material];
        const texInfo = material.pbrMetallicRoughness.baseColorTexture;
        let primitiveAccessors = accessors;
        let primitiveAttributes = primitive.attributes;
        const {
          extensions = {}
        } = primitive;
        const dracoCompressionEXT = extensions.KHR_draco_mesh_compression;

        if (dracoCompressionEXT) {
          // If mesh contains compressed data, accessors will be available inside
          // the draco extension. See `parseGLB.js` and `draco.js` files.
          primitiveAccessors = dracoCompressionEXT.accessors;
          primitiveAttributes = dracoCompressionEXT.attributes;
        }

        if (!primitiveAccessors) {
          throw new Error("Error decoding GLB model: Missing `accessors` in JSON data");
        }

        const unlit = ((_material$extensions = material.extensions) === null || _material$extensions === void 0 ? void 0 : _material$extensions.KHR_materials_unlit) !== undefined;
        drawCalls.push({
          indices: primitiveAccessors[primitive.indices],
          positions: primitiveAccessors[primitiveAttributes.POSITION],
          normals: unlit ? {
            constant: 0
          } : primitiveAccessors[primitiveAttributes.NORMAL],
          unlit,
          texCoords: texInfo ? primitiveAccessors[primitiveAttributes[`TEXCOORD_${texInfo.texCoord || 0}`]] : {
            divisor: 1,
            buffer: singleTexCoord
          },
          baseColorTexture: texInfo ? textures[texInfo.index] : whiteTexture,
          baseColorFactor: material.pbrMetallicRoughness.baseColorFactor || [1, 1, 1, 1],
          nodeMatrix
        });
      }
    } // helper to draw all the meshes contained in a node and its child nodes


    function drawNode(node, parentMatrix) {
      const nodeMatrix = node.matrix ? glMatrix.mat4.clone(node.matrix) : glMatrix.mat4.fromRotationTranslationScale(glMatrix.mat4.create(), node.rotation || [0, 0, 0, 1], node.translation || [0, 0, 0], node.scale || [1, 1, 1]);
      glMatrix.mat4.mul(nodeMatrix, parentMatrix, nodeMatrix);

      if (node.mesh != null) {
        drawMesh(model.json.meshes[node.mesh], nodeMatrix);
      }

      if (node.children) {
        for (const childIdx of node.children) {
          drawNode(model.json.nodes[childIdx], nodeMatrix);
        }
      }
    } // finally, draw each of the main scene's nodes. Use the first scene if one isn't specified
    // explicitly.


    for (const nodeIdx of model.json.scenes[getSceneToDraw(model)].nodes) {
      const rootTransform = glMatrix.mat4.create();
      glMatrix.mat4.rotateX(rootTransform, rootTransform, Math.PI / 2);
      glMatrix.mat4.rotateY(rootTransform, rootTransform, Math.PI / 2);
      drawNode(model.json.nodes[nodeIdx], rootTransform);
    }

    return drawCalls;
  }); // create a regl command to set the context for each draw call

  const withContext = regl({
    context: {
      poseMatrix: (context, props) => glMatrix.mat4.fromRotationTranslationScale(glMatrix.mat4.create(), orientationToVec4(props.pose.orientation), pointToVec3$1(props.pose.position), props.scale ? pointToVec3$1(props.scale) : [1, 1, 1]),
      globalAlpha: (context, props) => props.alpha == null ? 1 : props.alpha,
      hitmapColor: (context, props) => props.color || [0, 0, 0, 1],
      isHitmap: (context, props) => !!props.isHitmap,
      useOverrideColor: (context, props) => !!props.overrideColor,
      overrideColor: (context, props) => props.overrideColor ? toRGBA(props.overrideColor) : [0, 0, 0, 1]
    }
  });
  return (props, isHitmap) => {
    const drawCalls = getDrawCalls(props.model);
    withContext(isHitmap ? _objectSpread(_objectSpread({}, props), {}, {
      isHitmap
    }) : props, () => {
      command(drawCalls);
    });
  };
};

function useAsyncValue(fn, deps) {
  const [value, setValue] = React.useState();
  React.useEffect(React.useCallback(() => {
    let unloaded = false;
    fn().then(result => {
      if (!unloaded) {
        setValue(result);
      }
    });
    return () => {
      unloaded = true;
      setValue(undefined);
    };
  }, deps || [fn]), deps || [fn]);
  return value;
}

function useModel(model) {
  React.useDebugValue(model);
  return useAsyncValue(async () => {
    if (typeof model === "function") {
      return model();
    }

    if (typeof model === "string") {
      const response = await fetch(model);

      if (!response.ok) {
        throw new Error(`failed to fetch GLTF model: ${response.status}`);
      }

      return parseGLB(await response.arrayBuffer());
    }
    /*:: (model: empty) */


    throw new Error(`unsupported model prop: ${typeof model}`);
  }, [model]);
}

function GLTFScene(props) {
  const {
    children,
    model
  } = props,
        rest = _objectWithoutProperties__default["default"](props, _excluded$1);

  const context = React.useContext(WorldviewReactContext);
  const loadedModel = useModel(model);
  React.useEffect(() => {
    if (context) {
      context.onDirty();
    }
  }, [context, loadedModel]);

  if (!loadedModel) {
    return null;
  }

  return /*#__PURE__*/React__default["default"].createElement(Command, _extends__default["default"]({}, rest, {
    reglCommand: drawModel,
    getChildrenForHitmap: getChildrenForHitmapWithOriginalMarker
  }), _objectSpread(_objectSpread({}, children), {}, {
    model: loadedModel,
    originalMarker: children
  }));
}

const _excluded = ["count"];
const DEFAULT_GRID_COLOR = [0.3, 0.3, 0.3, 1];
function grid() {
  return withPose({
    vert: `
    precision mediump float;
    uniform mat4 projection, view;

    attribute vec3 point;
    attribute vec4 color;
    varying vec4 fragColor;

    void main () {
      fragColor = color;
      vec3 p = point;
      gl_Position = projection * view * vec4(p, 1);
    }
    `,
    frag: `
      precision mediump float;
      varying vec4 fragColor;
      void main () {
        gl_FragColor = fragColor;
      }
    `,
    primitive: "lines",
    attributes: {
      point: (context, props) => {
        const points = [];
        const bound = props.count;

        for (let i = -props.count; i < props.count; i++) {
          points.push([-bound, i, 0]);
          points.push([bound, i, 0]);
          points.push([i, -bound, 0]);
          points.push([i, bound, 0]);
        }

        return points;
      },
      color: (context, props) => {
        const color = props.color || DEFAULT_GRID_COLOR;
        return new Array(props.count * 4 * 2).fill(color);
      }
    },
    count: (context, props) => {
      // 8 points per count
      const count = props.count * 4 * 2;
      return count;
    }
  });
}
// useful for rendering a grid for debugging in stories
function Grid(_ref) {
  let {
    count
  } = _ref,
      rest = _objectWithoutProperties__default["default"](_ref, _excluded);

  const children = {
    count
  };
  return /*#__PURE__*/React__default["default"].createElement(Command, _extends__default["default"]({
    getChildrenForHitmap: nonInstancedGetChildrenForHitmap
  }, rest, {
    reglCommand: grid
  }), children);
}
Grid.defaultProps = {
  count: 6
};

// A command that renders arbitrary DOM nodes on top of the Worldview 3D scene.
// It supplies coordinates to the `renderItem` prop for positioning DOM nodes relative to the canvas.
class Overlay extends React__namespace.Component {
  constructor(...args) {
    super(...args);

    _defineProperty__default["default"](this, "_context", void 0);

    _defineProperty__default["default"](this, "state", {
      items: []
    });

    _defineProperty__default["default"](this, "componentWillUnmount", () => {
      if (this._context) {
        this._context.unregisterPaintCallback(this.paint);
      }
    });

    _defineProperty__default["default"](this, "paint", () => {
      const context = this._context;
      const dimension = context && context.dimension;
      const {
        renderItem,
        children
      } = this.props;

      if (!context || !dimension) {
        return;
      }

      const items = children.map((item, index) => {
        const coordinates = this.project(item.pose.position, context);
        return renderItem({
          item,
          index,
          coordinates,
          dimension
        });
      });
      this.setState({
        items
      });
    });

    _defineProperty__default["default"](this, "project", (point, context) => {
      if (!context || !context.initializedData) {
        return;
      }

      const {
        dimension
      } = context;
      const {
        camera
      } = context.initializedData;
      const vec = [point.x, point.y, point.z];
      const {
        left,
        top,
        width,
        height
      } = dimension;
      const viewport = [left, top, width, height];
      return camera.toScreenCoord(viewport, vec);
    });
  }

  componentDidMount() {
    if (this._context) {
      this._context.registerPaintCallback(this.paint);
    }
  }

  render() {
    return /*#__PURE__*/React__namespace.createElement(React__namespace.Fragment, null, /*#__PURE__*/React__namespace.createElement(WorldviewReactContext.Consumer, null, ctx => {
      if (ctx) {
        this._context = ctx;
      }

      return this.state.items;
    }));
  }

}

const makePointsCommand = ({
  useWorldSpaceSize
}) => {
  return regl => {
    if (!regl) {
      throw new Error("Invalid regl instance");
    }

    const [minLimitPointSize, maxLimitPointSize] = regl.limits.pointSizeDims;
    return withPose({
      primitive: "points",
      vert: `
    precision mediump float;

    #WITH_POSE

    uniform mat4 projection, view;
    uniform float pointSize;
    uniform bool useWorldSpaceSize;
    uniform float viewportWidth;
    uniform float viewportHeight;
    uniform float minPointSize;
    uniform float maxPointSize;

    attribute vec3 point;
    attribute vec4 color;
    varying vec4 fragColor;
    void main () {
      vec3 pos = applyPose(point);
      gl_Position = projection * view * vec4(pos, 1);
      fragColor = color;

      if (useWorldSpaceSize) {
        // Calculate the point size based on world dimensions:
        // First, we need to compute a new point that is one unit away from
        // the center of the current point being rendered. We do it in view space
        // in order to make sure the new point is always one unit up and it's not
        // affected by view rotation.
        vec4 up = projection * (view * vec4(pos, 1.0) + vec4(0.0, 1.0, 0.0, 0.0));

        // Then, we compute the distance between both points in clip space, dividing
        // by the w-component to account for distance in perspective projection.
        float d = length(up.xyz / up.w - gl_Position.xyz / gl_Position.w);

        // Finally, the point size is calculated using the size of the render target
        // and it's aspect ratio. We multiply it by 0.5 since distance in clip space
        // is in range [0, 2] (because clip space's range is [-1, 1]) and
        // we need it to be [0, 1].
        float invAspect = viewportHeight / viewportWidth;
        gl_PointSize = pointSize * 0.5 * d * viewportWidth * invAspect;
      } else {
        gl_PointSize = pointSize;
      }

      // Finally, ensure the calculated point size is within the limits.
      gl_PointSize = min(maxPointSize, max(minPointSize, gl_PointSize));
    }
    `,
      frag: `
    precision mediump float;
    varying vec4 fragColor;
    void main () {
      gl_FragColor = vec4(fragColor.x, fragColor.y, fragColor.z, 1);
    }
    `,
      attributes: {
        point: (context, props) => {
          return props.points.map(point => Array.isArray(point) ? point : pointToVec3$1(point));
        },
        color: (context, props) => {
          const colors = getVertexColors(props);
          return colors;
        }
      },
      uniforms: {
        pointSize: (context, props) => {
          return props.scale.x || 1;
        },
        useWorldSpaceSize: !!useWorldSpaceSize,
        viewportWidth: regl.context("viewportWidth"),
        viewportHeight: regl.context("viewportHeight"),
        minPointSize: minLimitPointSize,
        maxPointSize: maxLimitPointSize
      },
      count: regl.prop("points.length")
    });
  };
};
const getChildrenForHitmap = createInstancedGetChildrenForHitmap(1);
function Points(props) {
  const [command] = React.useState(() => makePointsCommand(props));
  return /*#__PURE__*/React__default["default"].createElement(Command, _extends__default["default"]({
    getChildrenForHitmap: getChildrenForHitmap
  }, props, {
    reglCommand: command
  }));
}

//  Copyright (c) 2018-present, GM Cruise LLC

exports.Arrows = Arrows$1;
exports.Axes = Axes;
exports.Bounds = Bounds;
exports.CameraListener = CameraListener;
exports.CameraStore = CameraStore;
exports.Command = Command;
exports.Cones = Cones;
exports.Cubes = Cubes;
exports.Cylinders = Cylinders;
exports.DEFAULT_CAMERA_STATE = DEFAULT_CAMERA_STATE;
exports.DrawPolygons = DrawPolygons;
exports.FilledPolygons = FilledPolygons;
exports.GLTFScene = GLTFScene;
exports.GLText = GLText;
exports.Grid = Grid;
exports.Lines = Lines;
exports.OffscreenWorldview = WorldviewBase;
exports.Overlay = Overlay;
exports.Points = Points;
exports.Polygon = Polygon;
exports.PolygonBuilder = PolygonBuilder;
exports.PolygonPoint = PolygonPoint;
exports.Ray = Ray;
exports.SUPPORTED_MOUSE_EVENTS = SUPPORTED_MOUSE_EVENTS;
exports.Spheres = Spheres;
exports.Text = Text;
exports.Triangles = Triangles;
exports.Worldview = Worldview;
exports.WorldviewReactContext = WorldviewReactContext;
exports.blend = blend;
exports.camera = camera;
exports.cameraStateSelectors = selectors;
exports.colorBuffer = colorBuffer;
exports.cones = cones;
exports.createInstancedGetChildrenForHitmap = createInstancedGetChildrenForHitmap;
exports.cubes = cubes;
exports.cylinders = cylinders;
exports["default"] = Worldview;
exports.defaultBlend = defaultBlend;
exports.defaultDepth = defaultDepth;
exports.defaultReglBlend = defaultReglBlend;
exports.defaultReglDepth = defaultReglDepth;
exports.eulerFromQuaternion = eulerFromQuaternion;
exports.fromGeometry = fromGeometry;
exports.fromSpherical = fromSpherical;
exports.getCSSColor = getCSSColor;
exports.getChildrenForHitmapWithOriginalMarker = getChildrenForHitmapWithOriginalMarker;
exports.getIdFromColor = getIdFromColor;
exports.getIdFromPixel = getIdFromPixel;
exports.getRayFromClick = getRayFromClick;
exports.getVertexColors = getVertexColors;
exports.intToRGB = intToRGB;
exports.lines = lines;
exports.makeArrowsCommand = makeArrowsCommand;
exports.makeFilledPolygonsCommand = makeFilledPolygonsCommand;
exports.makeGLTextCommand = makeGLTextCommand;
exports.makePointsCommand = makePointsCommand;
exports.makeTrianglesCommand = makeTrianglesCommand;
exports.nonInstancedGetChildrenForHitmap = nonInstancedGetChildrenForHitmap;
exports.orientationToVec4 = orientationToVec4;
exports.parseGLB = parseGLB;
exports.pointToVec3 = pointToVec3$1;
exports.pointToVec3Array = pointToVec3Array;
exports.shouldConvert = shouldConvert;
exports.spheres = spheres;
exports.toColor = toColor;
exports.toRGBA = toRGBA;
exports.vec3ToPoint = vec3ToPoint;
exports.vec4ToOrientation = vec4ToOrientation;
exports.vec4ToRGBA = vec4ToRGBA;
exports.withPose = withPose;
//# sourceMappingURL=index.cjs.js.map
