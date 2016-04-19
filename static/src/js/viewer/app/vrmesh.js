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
 import * as OBJLoader from '../../third_party/threejs_extra/OBJLoader';
import THREE from 'three';

const manager = new THREE.LoadingManager();
const objLoader = new THREE.OBJLoader( manager );
const textureLoader = new THREE.TextureLoader();

export function getControllerInstance(){

  const controllerGroup = new THREE.Group();

  objLoader.load( '/data/models/Controller_opt.obj', function ( object ) {
    object.traverse( function ( child ) {
      if ( child instanceof THREE.Mesh ) {
        child.material = new THREE.MeshBasicMaterial({
          color: 0x333333,
          blending: THREE.AdditiveBlending,
          transparent: true,
          depthTest: true
        });
      }
    } );
    // object.position.y = - 80;
    object.scale.set( 100, 100, 100 );
    // object.rotation.x = Math.PI;
    object.rotation.y = Math.PI;
    controllerGroup.add( object );
  }, undefined, ( e ) => console.warn( e ) );

  return controllerGroup;

}

export function getHMDInstance(){

  const group = new THREE.Group();

  objLoader.load( '/data/models/HMD.obj', function ( object ) {
    object.traverse( function ( child ) {
      if ( child instanceof THREE.Mesh ) {
        child.material = new THREE.MeshBasicMaterial({
          color: 0x333333,
          blending: THREE.AdditiveBlending,
          transparent: true,
          depthTest: true
        });
      }
    } );
    // object.position.y = - 80;
    object.scale.set( 70, 70, 70 );
    // object.rotation.x = Math.PI;
    object.rotation.y = Math.PI;
    object.position.z = -8;
    group.add( object );
  }, undefined, ( e ) => console.warn( e ) );

  return group;

}

export function getMirrorInstance(){
  const texture = textureLoader.load( '/data/models/mirror.png' );
  const mirrorPlaneGeo = new THREE.PlaneGeometry( 250, 250, 1, 1 );
  mirrorPlaneGeo.applyMatrix( new THREE.Matrix4().makeRotationY( Math.PI * 0.5 ) );

  const material = new THREE.MeshBasicMaterial({
    color: 0xaaaaaa,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
    transparent: true,
    map: texture
  });

  material.alphaTest = 0.5;

  const mirror = new THREE.Mesh( mirrorPlaneGeo, material );
  mirror.position.set( 0,0,100000);
  return mirror;
}

export function getMannequin(){
  const group = new THREE.Group();

  objLoader.load( '/data/models/Dressform_opt.obj', function ( object ) {
    object.traverse( function ( child ) {
      if ( child instanceof THREE.Mesh ) {
        child.material = new THREE.MeshPhongMaterial({
          color: 0x999999,
        });
        child.receiveShadow = true;
        child.rotation.y = Math.PI;
        // child.castShadow = true;
        // console.log( child.geometry );
        // child.geometry.computeFaceNormals();
        // child.geometry.computeVertexNormals();
      }
    } );
    object.scale.set( 100, 100, 100 );
    // object.rotation.x = Math.PI;
    group.add( object );
  }, undefined, ( e ) => console.warn( e ) );

  return group;
}

export function getPalette(){
  const paletteMaterial = new THREE.MeshBasicMaterial({
    color: 0xbbbbbb,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false,
    transparent: true,
    map: textureLoader.load( '/data/models/palette.png' )
  })
  const geometry = new THREE.PlaneGeometry( 15,20,1,1 );
  geometry.applyMatrix( new THREE.Matrix4().makeTranslation( 0, 0, 0 ) );

  const mesh = new THREE.Mesh( geometry, paletteMaterial );

  mesh.rotation.x = -Math.PI * 0.5;
  return mesh;
}