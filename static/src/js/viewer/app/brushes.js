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
 export default  {
  'd229d335-c334-495a-a801-660ac8a87360': {
    texture: '/data/brushassets/VelvetPen/maintexture.png',
    name: 'Velvet Pen',
    material: 'Additive',
    brushsizemin: 0.025,
    brushsizemax: 0.2,
    pressuresizemin: 0.15,
    pressuresizemax: 1,
    textureatlas: false,
    ssao: false,
    glow: true,
    backface: false
  },
  'c515dad7-4393-4681-81ad-162ef052241b': {
    texture: '/data/brushassets/OilPaint/main.png',
    normalmap: '/data/brushassets/OilPaint/normal.png',
    name: 'Oil Paint',
    material: 'Standard',
    brushsizemin: 0.25,
    brushsizemax: 1.5,
    pressuresizemin: 1,
    pressuresizemax: 1,
    textureatlas: true,
    ssao: false,
    glow: false,
    backface: false
  },
  '55303bc4-c749-4a72-98d9-d23e68e76e18': {
    texture: '/data/brushassets/Flat/maintexture.png',
    name: 'Flat',
    material: 'Standard',
    brushsizemin: 0.05,
    brushsizemax: 3.0,
    pressuresizemin: 1,
    pressuresizemax: 1,
    textureatlas: false,
    ssao: true,
    glow: false,
    backface: true
  },
  'c0012095-3ffd-4040-8ee1-fc180d346eaa': {
    texture: '/data/brushassets/Ink/maintexture.png',
    normalmap: '/data/brushassets/Ink/maintexture_normal.png',
    name: 'Ink',
    material: 'Standard',
    brushsizemin: 0.05,
    brushsizemax: 1.0,
    pressuresizemin: 0.2,
    pressuresizemax: 1,
    textureatlas: true,
    ssao: false,
    glow: false,
    backface: false
  }
};