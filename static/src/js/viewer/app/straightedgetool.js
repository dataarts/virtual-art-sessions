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


export function createPlayer( { metadata, actions }, rhand ){
  const lineGeo = new THREE.Geometry();
  const lineStart = new THREE.Vector3();
  const lineEnd = new THREE.Vector3();
  lineGeo.vertices.push( lineStart, lineEnd );

  const view = new THREE.Line(
    lineGeo,
    new THREE.LineBasicMaterial( {} )
  );

  const playbackActions = actions
    .filter( ( a ) => a.type === 'STRAIGHT_TOOL_START' )
    .map( function( action ){
      return {
        position: Sketch.ThreeJSVec3FromTiltbrushData( action.data.pos[ 0 ] ),
        rotation: Sketch.ThreeJSVec3FromTiltbrushData( action.data.pos[ 1 ] ),
        time: action.time,
        endTime: action.data.endTime
      };
    });

  let playback = playbackActions.slice();
  let nextEnd = 0;
  function onTick( time ){

    const action = playback[ 0 ];

    if( action && time >= action.time ){
      lineStart.copy( action.position );
      nextEnd = action.endTime;
      playback.shift();
    }

    if( time <= nextEnd ){
      lineEnd.copy( rhand.position );
    }
    else{
      lineStart.set( 0,0,0 );
      lineEnd.set( 0,0,0 );
    }

    lineGeo.verticesNeedUpdate = true;

  }

  function onSeek( time ){
    playback = playbackActions.slice();
    nextEnd = 0;
    onTick( time );
  }

  const bindings = {
    onTick: onTick,
    onSeek: onSeek
  };

  return { bindings, view };
}
