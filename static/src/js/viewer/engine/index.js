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
 import $ from 'jquery';
import Stats from 'stats-js';

import createFrameLoop from './frameloop';
import { createView } from './view';
import createRenderer from './renderer';
import createControl from './control';

export function create(){

  const frameLoop = createFrameLoop();

  const renderer = createRenderer({
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: true
  });

  const camera = renderer.getDefaultCamera();

  const view = createView({
    renderer: renderer
  });

  const control = createControl( camera, view.getDomElement() );


  var stats = new Stats();
  stats.setMode(0); // 0: fps, 1: ms

  // Align top-left
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.bottom = '20px';
  stats.domElement.style.display = 'none';

  document.body.appendChild( stats.domElement );

  function showStats(){
    stats.domElement.style.display = 'block';
  }

  function reInitFrameLoop(){
    frameLoop.add( function(ms){
      stats.begin();
      control.orbit().update();
      view.update(ms);
      stats.end();
    });
  }

  reInitFrameLoop();

  const engine = {
    frameLoop,
    camera,
    renderer,
    view,
    control,
    reInitFrameLoop,
    showStats
  };

  return engine;
}

