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
 import R from 'ramda';
import $ from 'jquery';

import THREE from 'three';

export function createView( options ){
  const { renderer } = options;

  function update( nowMsec ){
    renderer.render( nowMsec );
    renderer.update( nowMsec );
  }

  // const $body = $( document.body );
  // const $domElement = $( renderer.getDomElement() );
  // $domElement.css('position','absolute');
  // $body.append( $domElement );

  //  force an update so that shaders (and lights!) get generated
  update();

  const space = new THREE.Group();
  // rotateZUp( space );

  renderer.getScene().add( space );

  return {
    update: update,
    getDomElement: renderer.getDomElement,
    add: function( ...view ){
      space.add( ...view );
    },
    clear: function(){
      clearGroup( space );
    }
  };
}

function rotateZUp( group ){
  group.rotation.x = Math.PI * 0.5;
}

function clearGroup( group ){
  group.remove( ...group.children );
}