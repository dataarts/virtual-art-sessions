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

import * as Sketch from './sketch';
import * as VRMeshes from './vrmesh';

export function create( inputState ){
  const mapping = unpackInput( inputState );
  let playback = mapping.slice();

  const viewObjects = createViewObjects();
  const view = new THREE.Group();
  const { hmd, rhand, lhand, mirror } = viewObjects;
  view.add( hmd, rhand, lhand, mirror );

  let seekIndex = 0;
  function onTick( time ){
    let current = playback[ seekIndex ];
    let previous = playback[ seekIndex - 1 ];


    while( current && current.time <= time && seekIndex<playback.length ){
      previous = current;
      seekIndex++;
      current = playback[ seekIndex ];
    }

    if( current && previous ){
      const currentToPreviousTime = current.time - previous.time;
      const elapsedSincePreviousTime = time - previous.time;
      const alpha = elapsedSincePreviousTime / currentToPreviousTime;
      const input = interpolateView( previous.input, current.input, alpha );
      positionViewObjects( input, viewObjects );
    }

  }

  function onSeek( time ){
    seekIndex = 0;
    // playback = mapping.slice();
    // onTick( time );
  }

  const bindings = {
    onTick, onSeek
  };

  return {
    bindings, view, hmd, rhand, lhand, mirror
  };
}

function interpolateView( previous, current, alpha ){
  return {
    hmd: {
      p: previous.hmd.p.lerp( current.hmd.p, alpha ),
      r: previous.hmd.r.slerp( current.hmd.r, alpha )
    },
    rhand: {
      p: previous.rhand.p.lerp( current.rhand.p, alpha ),
      r: previous.rhand.r.slerp( current.rhand.r, alpha )
    },
    lhand: {
      p: previous.lhand.p.lerp( current.lhand.p, alpha ),
      r: previous.lhand.r.slerp( current.lhand.r, alpha )
    },
    mirror: {
      p: previous.mirror.p.lerp( current.mirror.p, alpha ),
      r: previous.mirror.r.slerp( current.mirror.r, alpha )
    }
  };
}

function createViewObjects(){
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    wireframe: true
  });

  const hmd = VRMeshes.getHMDInstance();
  hmd.hiddenInPOV = true;


  const rhand = VRMeshes.getControllerInstance();

  const rhandRing = new THREE.Mesh( new THREE.TorusGeometry(3,0.2,12,24), new THREE.MeshBasicMaterial() );
  rhand.add( rhandRing );

  const lhand = VRMeshes.getControllerInstance();

  const lhandBox = VRMeshes.getPalette();
  lhandBox.position.z = +1;
  lhandBox.position.y = +6;
  lhand.add( lhandBox );

  const mirror = VRMeshes.getMirrorInstance();
  return {
    hmd, rhand, lhand, mirror
  };
}

function positionViewObjects( input, { hmd, rhand, lhand, mirror } = {} ){
  hmd.position.copy( input.hmd.p );
  hmd.quaternion.copy( input.hmd.r );
  rhand.position.copy( input.rhand.p );
  rhand.quaternion.copy( input.rhand.r );
  lhand.position.copy( input.lhand.p );
  lhand.quaternion.copy( input.lhand.r );
  mirror.position.copy( input.mirror.p );
  mirror.quaternion.copy( input.mirror.r );

  // if( mirror.position.x === 0 &&
  //     mirror.position.y === 0 &&
  //     mirror.position.z === 0 ){
  //   mirror.visible = false;
  // }
  // else{
  //   mirror.visible = true;
  // }
}

function unpackInput( inputState ){
  const chunks = chunk( inputState, 29 );
  return chunks.map( function( parts ){
    let [ time,
      hmdX,
      hmdY,
      hmdZ,
      hmdQX,
      hmdQY,
      hmdQZ,
      hmdQW,
      rhandX,
      rhandY,
      rhandZ,
      rhandQX,
      rhandQY,
      rhandQZ,
      rhandQW,
      lhandX,
      lhandY,
      lhandZ,
      lhandQX,
      lhandQY,
      lhandQZ,
      lhandQW,
      mirrorX,
      mirrorY,
      mirrorZ,
      mirrorQX,
      mirrorQY,
      mirrorQZ,
      mirrorQW
    ] = parts;

    if( mirrorX === 0 && mirrorY === 0 && mirrorZ === 0 ){
      mirrorZ = 100000;
    }

    return {
      time: time,
      input: {
        hmd: {
          p: new THREE.Vector3( hmdX, hmdY, hmdZ ),
          r: new THREE.Quaternion( hmdQX, hmdQY, hmdQZ, hmdQW ),
        },
        rhand: {
          p: new THREE.Vector3( rhandX, rhandY, rhandZ ),
          r: new THREE.Quaternion( rhandQX, rhandQY, rhandQZ, rhandQW ),
        },
        lhand: {
          p: new THREE.Vector3( lhandX, lhandY, lhandZ ),
          r: new THREE.Quaternion( lhandQX, lhandQY, lhandQZ, lhandQW ),
        },
        mirror: {
          p: new THREE.Vector3( mirrorX, mirrorY, mirrorZ ),
          r: new THREE.Quaternion( mirrorQX, mirrorQY, mirrorQZ, mirrorQW ),
        }
      }
    };
  });
}

function chunk (arr, len) {

  var chunks = [],
      i = 0,
      n = arr.length;

  while (i < n) {
    chunks.push(arr.slice(i, i += len));
  }

  return chunks;
}