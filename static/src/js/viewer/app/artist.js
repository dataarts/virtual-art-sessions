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
import * as ArtistShader from './artistshader';
import * as DeviceCheck from './devicecheck';

export function create( { video, artistSettings, cameraData, sourceCorners } = {} ){

  const { minDepth: nearClip, maxDepth: farClip } = cameraData;

  const view = new THREE.Group();

  const vertexShader = ArtistShader.vertexShader;
  const fragmentShader = ArtistShader.fragmentShader;

  const sourceWidth = sourceCorners.right - sourceCorners.left;
  const sourceHeight = sourceCorners.bottom - sourceCorners.top;
  const sampleTop = sourceCorners.top;
  const sampleLeft = sourceCorners.left;

  let pixelsPerParticle = 2.0;
  if (DeviceCheck.isMobile()) {
    pixelsPerParticle = 3.0;
  }

  let kinectPitch = 0;

  console.log('initFromVideo', cameraData);

  const videoTexture = new THREE.Texture( video );
  videoTexture.minFilter = THREE.LinearFilter;
  videoTexture.magFilter = THREE.LinearFilter;
  videoTexture.format = THREE.RGBFormat;
  videoTexture.crossOrigin = '';
  video.crossOrigin = '';

  const material = buildMaterial({
    artistSettings, cameraData,
    videoTexture, sourceWidth, sourceHeight,
    sampleTop, sampleLeft,
    vertexShader, fragmentShader
  });

  material.glow = false;

  const geometry = buildGeometry( { artistSettings, sourceWidth, sourceHeight,
    sampleLeft, sampleTop,
    pixelsPerParticle } );

  var mesh;
  if (artistSettings.renderStyle == "points") {
    mesh = new THREE.Points( geometry, material );
  } else if ((artistSettings.renderStyle == "mesh") || (artistSettings.renderStyle == "wireframe")) {
    mesh = new THREE.Mesh( geometry, material );
  } else if (artistSettings.renderStyle == "lines") {
    mesh = new THREE.Line( geometry, material );
  } else if (artistSettings.renderStyle == "lineSegments") {
    mesh = new THREE.LineSegments( geometry, material );
  }


  mesh.frustumCulled = false;
  view.add( mesh );

  view.update = function(){
    video.crossOrigin = '*';
    videoTexture.crossOrigin = '*';
    videoTexture.needsUpdate = true;
  };



  function setAngle( pitch ){
    kinectPitch = pitch;
  }

  function updatePos() {
    var angleRads = ( kinectPitch * Math.PI)/180;
    view.rotation.set(angleRads,0,0,'XYZ');
  }

  function setPosition( x, y, z ){
    view.position.set( x, y, z );
  }

  function updateUniforms( uni ){
    for( let uniformName in uni ){
      let newUniformValue = uni[ uniformName ];

      // increase point size on mobile
      if (uniformName == "pointSize") {
        if (DeviceCheck.isMobile()) {
          newUniformValue *= 1.1;
        }
      }

      material.uniforms[ uniformName ].value = newUniformValue;
    }
  }

  return {
    getView: () => view,
    setAngle,
    updatePos,
    setPosition,
    updateUniforms
  };
}


function buildGeometry( {
  artistSettings, sourceWidth, sourceHeight,
  sampleLeft, sampleTop,
  pixelsPerParticle
} = {}) {

  var cols = Math.floor(sourceWidth / pixelsPerParticle);
  var rows = Math.floor(sourceHeight / pixelsPerParticle);

  var renderMode = artistSettings.renderStyle;
  if ((renderMode != "points") && (renderMode != "mesh") && (renderMode != "wireframe") && (renderMode != "lines") && (renderMode != "lineSegments")) {
    artistSettings.renderStyle = "points"; //default to points
  }


  var geometry;
  if (artistSettings.renderStyle == "points") {
    geometry = new THREE.BufferGeometry();
    var vertices = new Float32Array( cols * rows * 3 );
    for ( var i = 0, j = 0, l = vertices.length; i < l; i += 3, j ++ ) {

      vertices[ i ] = (j % cols) * pixelsPerParticle;
      vertices[ i + 1 ] = Math.floor( j / cols ) * pixelsPerParticle;

    }
    geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
  } else if ((artistSettings.renderStyle == "mesh") || (artistSettings.renderStyle == "wireframe")) {
      geometry = new THREE.PlaneGeometry( cols * pixelsPerParticle, rows * pixelsPerParticle, cols, rows );
      geometry.applyMatrix( new THREE.Matrix4().makeTranslation( cols * pixelsPerParticle * 0.5, rows * pixelsPerParticle * 0.5, 0 ) );
    } else if (artistSettings.renderStyle == "lines") {
      geometry = new THREE.Geometry();
      for( let y=0; y<cols; y++ ){
          for( let x=0; x<rows; x++ ){
            geometry.vertices.push( new THREE.Vector3( x * pixelsPerParticle, y * pixelsPerParticle, 0 ) );
            // geometry.vertices.push( new THREE.Vector3( (x+1) * pixelsPerParticle, y * pixelsPerParticle, 0 ) );
          }
        }
    } else if (artistSettings.renderStyle == "lineSegments") {
      geometry = new THREE.Geometry();

      for( let y=0; y<cols; y++ ){
        for( let x=0; x<rows; x++ ){
          geometry.vertices.push( new THREE.Vector3( x * pixelsPerParticle, y * pixelsPerParticle, 0 ) );
          // geometry.vertices.push( new THREE.Vector3( (x+1) * pixelsPerParticle, y * pixelsPerParticle, 0 ) );
          geometry.vertices.push( new THREE.Vector3( (x+1) * pixelsPerParticle, y * pixelsPerParticle, 0 ) );
          geometry.vertices.push( new THREE.Vector3( x * pixelsPerParticle, y * pixelsPerParticle, 0 ) );
          geometry.vertices.push( new THREE.Vector3( x * pixelsPerParticle, (y+1) * pixelsPerParticle, 0 ) );
        }
      }
    }

  //return geometry;


  return geometry;
}


function buildMaterial( {
  artistSettings, cameraData,
  videoTexture, sourceWidth, sourceHeight,
  sampleLeft, sampleTop,
  vertexShader, fragmentShader
} = {}){

  var defaultParticleSize = artistSettings.particleSize ? artistSettings.particleSize : 4.0;
  var defaultBlackCutOff = artistSettings.blackCutOff ? artistSettings.blackCutOff : 0.001;


  var material = new THREE.ShaderMaterial( {

    uniforms: {

      'map': { type: 't', value: videoTexture },
      'width': { type: 'f', value: sourceWidth },
      'height': { type: 'f', value: sourceHeight },
      'left': { type: 'f', value: sampleLeft },
      'top': { type: 'f', value: sampleTop },

      'cam_fovx': { type: 'f', value: cameraData.fovx },
      'cam_fovy': { type: 'f', value: cameraData.fovy  },
      'cam_ppx': { type: 'f', value: cameraData.ppx  },
      'cam_ppy': { type: 'f', value: cameraData.ppy  },
      'cam_minDepth': { type: 'f', value: cameraData.minDepth  },
      'cam_maxDepth': { type: 'f', value: cameraData.maxDepth  },

      'sampleLeft': { type: 'f', value: sampleLeft },
      'sampleTop': { type: 'f', value: sampleTop },

      'zOffset': { type: 'f', value: 100 },

      'colorMode': { type: 'i', value: 0 },

      'pointSize': { type: 'f', value: defaultParticleSize },
      'blackCutOff': { type: 'f', value: defaultBlackCutOff }
    },
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    depthTest: true,
    depthWrite: true,
    transparent: false,
  //  shading: THREE.FlatShading,
  //  wireframe:true
  } );


  if (artistSettings.renderStyle == "points") {

  } else if (artistSettings.renderStyle == "mesh") {
    material.shading = THREE.FlatShading;
  }else if (artistSettings.renderStyle == "wireframe") {
    material.shading = THREE.FlatShading;
    material.wireframe = true;
  }

  return material;

}

function MMtoRawIndex(depthMM) {
  var indexFloat = ((1000.0/depthMM) - 3.3309495161) / -0.0030711016;
  return Math.floor(indexFloat);
}



  // const frustrum = null;
  // const frustrumLineMaterial = null;
  // const frustrumPlaneMaterial  = null;

  // const cameraPosMesh = null;


  // var geometry = new THREE.BoxGeometry( 20, 3, 2 );
  // var material = new THREE.MeshBasicMaterial( { color: 0xffaa00, wireframe: true } );
  // cameraPosMesh = new THREE.Mesh( geometry, material );
  // view.add( cameraPosMesh );

  // this.createFrustum();



  // function setHelpersVisibility( visible ) {
  //   frustrum.visible = visible;
  //   cameraPosMesh.visible = visible;
  // };




  // this.createFrustum = function() {
  //   frustrum = new THREE.Object3D();
  //   view.add( frustrum );

  //   frustrumLineMaterial = new THREE.LineBasicMaterial( { color: 0xffffff, linewidth: 2, opacity:0.5, transparent:true } );
  //   frustrumPlaneMaterial = new THREE.MeshBasicMaterial( { color: 0xffffff, opacity:0.5, transparent:true } );


  //   for (var i=0; i<6; i += 0.5 ) {
  //     this.drawFrustrumRectangleAtDepth(i);
  //   }

  // };

  // this.drawFrustrumRectangleAtDepth = function(depth) {

  //   var v0 = this.pixelToWorldRevised(0,0,depth);
  //   var v1 = this.pixelToWorldRevised(640,0,depth);
  //   var v2 = this.pixelToWorldRevised(640,480,depth);
  //   var v3 = this.pixelToWorldRevised(0,480,depth);

  //   var scale = 1.0;
  //   var factor = scale * 100;

  //   var rectShape = new THREE.Shape();
  //   rectShape.moveTo( v0.x*factor, v0.y*factor );
  //   rectShape.lineTo( v1.x*factor, v1.y*factor );
  //   rectShape.lineTo( v2.x*factor, v2.y*factor );
  //   rectShape.lineTo( v3.x*factor, v3.y*factor );
  //   rectShape.lineTo( v0.x*factor, v0.y*factor );

  //   var rectPoints = rectShape.createPointsGeometry();
  //   var line = new THREE.Line( rectPoints,  frustrumLineMaterial);

  //   line.position.z =  -v0.z*factor;

  //   frustrum.add( line );


  // };



  // this.getBrushShape = function(brushWidth, drawingScale) {
  //   var x = y = 0;

  //   var rectRatioLengthToWidth = sketchSettings.brushShapeRatio;

  //   var rectWidth = brushWidth * drawingScale * sketchSettings.brushWidthMultiplier;
  //   var rectLength = rectWidth * rectRatioLengthToWidth * sketchSettings.brushWidthMultiplier;
  //   var hl = rectLength/2;
  //   var hw = rectWidth/2;

  //   var rectShape = new THREE.Shape();
  //   rectShape.moveTo( -hw, -hl );
  //   rectShape.lineTo( hw, -hl );
  //   rectShape.lineTo( hw, hl );
  //   rectShape.lineTo( -hw, hl );
  //   rectShape.lineTo( -hw, -hl );

  //   return rectShape;
  // };

  // this.pixelToWorldRevised = function(x, y, depth) {
  //   var factor = 2.0 * KINECT_CONST.REF_PIX_SIZE * depth / KINECT_CONST.REF_DIST;

  //   var out_x = ((x - KINECT_CONST.HALF_DEPTH_X_RES) * factor);
  //   var out_y = ((y - KINECT_CONST.HALF_DEPTH_Y_RES) * factor);
  //   var pos = new THREE.Vector3(out_x,out_y,depth);
  //   return pos;
  // };