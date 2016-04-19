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
import {} from '../../third_party/threejs_extra/OrbitControls';
import * as DeviceCheck from '../app/devicecheck';

export default function createControl( camera, domElement ){

  const orbitControls = new THREE.OrbitControls( camera, domElement );
  orbitControls.target.set( 0, 110, 0 );
  orbitControls.userPanSpeed = 0.3;
  orbitControls.zoomSpeed = 3.0;
  orbitControls.keyPanSpeed = 30.0;
  orbitControls.noRotate = false;
  orbitControls.noPan = true;
  orbitControls.minDistance = 40;
  orbitControls.maxDistance = 600;
  orbitControls.minPolarAngle = Math.PI * 0.02;
  orbitControls.maxPolarAngle = Math.PI - Math.PI * 0.43;

  //  some default location
  var startDistance = 200;
  if (DeviceCheck.isMobile()) {
    startDistance = 450;
    orbitControls.maxDistance = 1000;
  }
  camera.position.set( startDistance, 200, startDistance );
    // .normalize()
    // .multiplyScalar( 300 );

  function restore(){
    const savedCamera = JSON.parse( localStorage.getItem( 'savedCamera' ) );
    if( savedCamera ){
      camera.position.copy( savedCamera.cameraPosition );
      orbitControls.target.copy( savedCamera.targetPosition );
    }
  }

  // restore();

  orbitControls.update();

  $(window).unload( function(){
    localStorage.savedCamera = JSON.stringify({
      cameraPosition: camera.position,
      targetPosition: orbitControls.target
    });
  });

  return {
    orbit: () => orbitControls
  };
}