/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
export var vertexShader = `

vec3 rgb_to_hsv(vec3 rgb) {
   float R = rgb.r;
    float G = rgb.g;
    float B = rgb.b;

    float Cmax = max (R, max (G, B));
    float Cmin = min (R, min (G, B));

  float H;
  float S;
  float V = Cmax;
  float D = Cmax - Cmin;

  if (Cmax == 0.0) {
    S = 0.0;
  } else {
    S = D / Cmax;
  }

  if (Cmax == Cmin) {
    H = 0.0;
  } else {
    if (R == Cmax) {
      H = (G-B) / D;
      if (G < B) H += 6.0;
    }
    else if (G == Cmax) {
      H = (B - R) / D + 2.0;
    }
    else if (B == Cmax) {
      H = (R - G) / D + 4.0;
    }
    H /= 6.0;
  }

  vec3 hsv = vec3(H,S,V);
  return hsv;
}

uniform float cam_fovx;
uniform float cam_fovy;
uniform float cam_ppx;
uniform float cam_ppy;
uniform float cam_minDepth ;
uniform float cam_maxDepth ;

vec3 pixelToWorld(float x, float y, float depth) {
  vec3 pos = vec3((x - cam_ppx) * depth / cam_fovx,
                    (y - cam_ppy) * depth / cam_fovy, depth);
  return pos;
}


const float hue_start = 0.0 / 360.0;
const float hue_end = 360.0 / 360.0;
const float hue_distance = hue_end - hue_start;

uniform sampler2D map;
uniform sampler2D colormap;

uniform float width;
uniform float height;
uniform float sampleLeft;
uniform float sampleTop;
uniform float nearClipping, farClipping;

uniform float blackCutOff;
uniform int colorMode;
uniform float pointSize;

varying vec2 depthUV;
varying vec2 colorUV;
varying float isHidden;

const float PI = 3.14159265358979323846264;


void main() {


  colorUV = vec2( (position.x + sampleLeft ) / ( width * 2.0 ), (position.y + sampleTop) / ( height * 2.0 ) + 0.5  );  
  depthUV = vec2( colorUV.x, colorUV.y - 0.5 );

  vec4 depthPixel = texture2D( map, depthUV );
  vec4 colorPixel = texture2D( map, colorUV );
  vec3 depthHSV = rgb_to_hsv( depthPixel.rgb );
        
  float dist = 0.0; 
  float hueRatio = 0.0;
  isHidden = 0.0;

  if (depthHSV.z > 0.92) {
    /*
    // if the color is too black, discard (probably background/edge) 
    if (length(colorPixel) < (1.0 + blackCutOff) ) {
      isHidden = 1.0;
    } else {
      hueRatio = depthHSV.x;
      dist = mix(cam_minDepth, cam_maxDepth, hueRatio);
    }
    */
    hueRatio = depthHSV.x;
    dist = mix(cam_minDepth, cam_maxDepth, hueRatio);
  } 
  // ELSE too dark (black should be ignored), so discard 
  else {
    dist = 0.0;
    isHidden = 1.0;
  }

  if (isHidden != 1.0) {
    vec3 pos = pixelToWorld(position.x, position.y, dist);

    float scaleFactor = 0.10; // Kinect to TB
    vec3 scaledPos = pos.xyz * vec3(scaleFactor, scaleFactor, -scaleFactor);

    vec4 mvPosition = modelViewMatrix * vec4( scaledPos, 1.0 );

    gl_PointSize = pointSize;
    gl_Position = projectionMatrix * mvPosition;
   }
}

`;

export var fragmentShader = `

uniform sampler2D map;
uniform sampler2D colormap;

uniform float width;
uniform float height;
uniform float pointSize;

varying vec2 depthUV;
varying vec2 colorUV;
varying float isHidden;

uniform int colorMode;

void main() {
  if (isHidden > 0.0) {
    discard;
  }

  vec4 color;
  if (colorMode == 0) {
    color = texture2D( map, colorUV );
  } else if (colorMode == 1) {
    color = vec4(1.0,1.0,1.0,1.0);
  } else if (colorMode == 2) {
    color = texture2D( map, depthUV );
  }

  gl_FragColor = vec4( color.r, color.g, color.b, 1.0 );

}

`;