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
 import THREE from 'three';
import $ from 'jquery';
import R from 'ramda';

import * as Loader from './loader';
import * as Signal from './signal';

const BG_COLOR = 0x000000;

export function create( {
    frameLoop,
    camera,
    renderer,
    view,
    control,
    reInitFrameLoop,
    showStats
  } = {} ){

  configureRenderer( renderer );

  const povCamera = createPOVCamera();
  renderer.setSpecificCamera( povCamera );

  const configuredLoader = Loader.sketchLoader({
    povCamera, frameLoop, renderer, control
  });

  //  sketch-wide events
  const events = createSignals();

  let sketch;
  function load( sketchName ){

    //  unload in case another sketch is here
    unload();

    console.log( 'loading', sketchName );
    return new Promise( function( resolve, reject ){
      sketch = configuredLoader( events, sketchName, resolve, reject );
      view.add( sketch.view );

      view.add( ... createLights() );

    });
  }

  function unload(){
    view.clear();
    frameLoop.clear();
    reInitFrameLoop();
    renderer.getRenderer().clear();
    if( sketch ){
      sketch.unload();
    }
    // R.values( events ).forEach( (s)=>s.clear() );
  }

  function enablePanning(){
    control.orbit().noPan = false;
  }

  function domElement(){
    return renderer.getDomElement();
  }

  function thumbnailElement(){
    return renderer.getThumbnailElement();
  }

  return {
    load, unload, showStats, enablePanning, events,
    domElement, thumbnailElement
  };

}

function createLights(){
  const lights = [];

  const ambientLight = new THREE.AmbientLight( 0x888888 );
  lights.push( ambientLight );

  const dlight1 = new THREE.DirectionalLight(
    new THREE.Color( 'rgb(124, 130, 158)' ).getHex(),
    2.0);

 // dlight1.rotation.set( 60, 0, 26 );

  dlight1.position.set( 50, 600, 0 );
//  dlight1.target.position.set( 0,0, 0 );

  dlight1.castShadow = true;
  dlight1.shadow.darkness = 0.8;
  dlight1.shadow.bias = 0.004;
  dlight1.shadow.mapSize.set( 2048, 2048 );
  dlight1.shadow.camera.zoom = 3.0;
  dlight1.shadow.camera.near = 300;
  dlight1.shadow.camera.far = 640;

  lights.push( dlight1 );

 // const helper = new THREE.CameraHelper( dlight1.shadow.camera );
 // lights.push( helper );

  const dlight2 = new THREE.DirectionalLight(
    new THREE.Color( 'rgb(182, 179, 147)' ).getHex(),
    0.8 );

  dlight2.position.set( 120, -300, 5 );
  lights.push( dlight2 );

  return lights;
}


function configureRenderer( renderer ){
  renderer.getRenderer().setClearColor( BG_COLOR, 1 );
  renderer.getRenderer().shadowMap.enabled = true;
  renderer.getRenderer().shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.getRenderer().shadowMap.cascade = true;
  renderer.getRenderer().shadowMap.cullFace = THREE.CullFaceBack;
}

function createPOVCamera(){
  const povCamera = new THREE.PerspectiveCamera( 95, window.innerWidth / window.innerHeight, 0.1 + (window.devicePixelRatio-1) * 4.0 , 2000 - ( window.devicePixelRatio-1 ) * 50 );
  povCamera.fov = 95;
  return povCamera;
}

function createSignals(){
  return {
    beginPlay: Signal.create(),
    endPlay: Signal.create(),
    playbackComplete: Signal.create(),
    sketchLoaded: Signal.create()
  };
}