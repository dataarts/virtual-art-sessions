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
import R from 'ramda';
import THREE from 'three';

import * as CopyShader from '../../third_party/threejs_extra/CopyShader';
import * as EffectComposer from '../../third_party/threejs_extra/EffectComposer';
import * as MaskPass from '../../third_party/threejs_extra/MaskPass';
import * as RenderPass from '../../third_party/threejs_extra/RenderPass';
import * as ShaderPass from '../../third_party/threejs_extra/ShaderPass';
import * as SSAOShader from '../../third_party/threejs_extra/SSAOShader';
import * as FXAAShader from '../../third_party/threejs_extra/FXAAShader';
import * as HorizontalBlurShader from '../../third_party/threejs_extra/HorizontalBlurShader';
import * as VerticalBlurShader from '../../third_party/threejs_extra/VerticalBlurShader';

export default function( { width, height, antialias } = {} ){

  const renderer = new THREE.WebGLRenderer( {
    antialias: antialias,
  } );

  renderer.setPixelRatio( 1.0 );
  renderer.setSize( width, height );
  renderer.setClearColor( 0x000000, 1 );

  renderer.gammaInput = true;
  renderer.gammaOutput = false;

  renderer.physicallyBasedShading = true;

  $( renderer.domElement )
  .attr('id','maincanvas');

  const thumbnailRenderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false
  });

  thumbnailRenderer.setClearColor( 0x000000, 1 );

  thumbnailRenderer.setPixelRatio( 1.0 );
  thumbnailRenderer.setSize( 320, 240 );

  const $group = $('<div>');
  $group.append( $( renderer.domElement ) )

  const $thumbnail = $( thumbnailRenderer.domElement );
  $thumbnail.css({
    position: 'absolute',
    zIndex: 100,
    left: '70%',
    top: '50%'
  })
  .addClass('canvas-window-sm')
  .attr('id','povcanvas')
  .appendTo( $group );


  const camera = createDefaultCamera();
  let specificCamera;
  let swappingCameras = false;

  updateCameras();

  function updateCameras(){
    width = window.innerWidth;
    height = window.innerHeight;

    const bigAspect = width/height;
    const smallAspect = 320 / 240;

    if( swappingCameras === false ){
      camera.aspect = bigAspect;
      if( specificCamera ){
        specificCamera.aspect = smallAspect;
      }
    }
    else{
      camera.aspect = smallAspect;
      if( specificCamera ){
        specificCamera.aspect = bigAspect;
      }
    }

    camera.updateProjectionMatrix();
    if( specificCamera ){
      specificCamera.updateProjectionMatrix();
    }
  }

  $( window ).resize( function(){
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize( w, h );
    if( resizePostProcessing ){
      resizePostProcessing( w, h );
    }
    updateCameras();
  });

  const scene = new THREE.Scene();


  const { renderPostProcessed, resizePostProcessing } = initPostprocessing( scene, camera, renderer, width, height );

  function setPOVHiddenObjectsVisibility( flag ){
    scene.traverse( function( o ){
      if( o.hiddenInPOV !== undefined ){
        o.visible = flag;
      }
    });
  }

  function setPOVOnlyObjectsVisibility( flag ){
    scene.traverse( function( o ){
      if( o.POVOnly !== undefined ){
        o.visible = flag;
      }
    });
  }

  const postProcessFlags = {
    ssao: false,
    glow: false
  };

  let rendering = false;

  const that = {};

  that.start = function(){
    rendering = true;
  };

  that.stop = function(){
    rendering = false;
  };

  that.getDomElement = function(){
    return $group[0];
  };

  that.getThumbnailElement = function(){
    return $thumbnail[0];
  };

  that.render = function(){
    if( ! rendering ){
      return;
    }

    if( swappingCameras === false ){
      setPOVHiddenObjectsVisibility( true );
      setPOVOnlyObjectsVisibility( false );
      renderPostProcessed( scene, camera, postProcessFlags );

      setPOVHiddenObjectsVisibility( false );
      setPOVOnlyObjectsVisibility( true );
      if( specificCamera ){
        thumbnailRenderer.render( scene, specificCamera, undefined, true );
      }
    }
    else{
      setPOVHiddenObjectsVisibility( false );
      setPOVOnlyObjectsVisibility( true );
      if( specificCamera ){
        renderPostProcessed( scene, specificCamera, postProcessFlags );
      }
      setPOVHiddenObjectsVisibility( true );
      setPOVOnlyObjectsVisibility( false );
      thumbnailRenderer.render( scene, camera, undefined, true );
    }
  };

  that.getScene = function(){
    return scene;
  };

  that.update = function( ms ){
    scene.traverse( function traverseAndUpdate( o ){
      if( o.update ){
        o.update(ms);
      }
    } );
  };

  that.getRenderer = () => renderer;
  that.getThumbnailRenderer = () => thumbnailRenderer;

  that.getDefaultCamera = () => camera;

  that.setSpecificCamera = function( overridingCamera ){
    specificCamera = overridingCamera;
    updateCameras();
  };

  that.swapSpecificCamera = function( flag ){
    swappingCameras = flag;
    updateCameras();
  };

  that.setRenderFlags = function( flags ){
    //  unset all
    for( let i in postProcessFlags ){
      postProcessFlags[ i ] = false;
    }

    //  set from config
    for( let i in flags ){
      postProcessFlags[ i ] = flags[ i ];
    }
  };

  return that;
}



export function createDefaultCamera(){
  const camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 0.1 + (window.devicePixelRatio-1) * 30.0 , 2000 - ( window.devicePixelRatio-1 ) * 50 );
  camera.reset = ()=>setDefaultCameraPosition( camera );
  window.camera = camera;
  return camera;
}

function setDefaultCameraPosition( camera ){
  camera.position.set( 1, 1, 1 );
  camera.position.normalize().multiplyScalar( 1000 );
}

function initPostprocessing( scene, camera, renderer, width, height ) {

  // Setup render pass
  const renderPass = new THREE.RenderPass( scene, camera );

  // Setup depth pass
  const depthShader = THREE.ShaderLib[ 'depthRGBA' ];
  const depthUniforms = THREE.UniformsUtils.clone( depthShader.uniforms );

  const depthMaterial = new THREE.ShaderMaterial( { fragmentShader: depthShader.fragmentShader, vertexShader: depthShader.vertexShader,
    uniforms: depthUniforms, blending: THREE.NoBlending } );

  const pars = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
  const depthRenderTarget = new THREE.WebGLRenderTarget( width, height, pars );

  // Setup SSAO pass
  const ssaoPass = new THREE.ShaderPass( THREE.SSAOShader );
  //ssaoPass.uniforms[ "tDiffuse" ].value will be set by ShaderPass
  ssaoPass.uniforms[ 'tDepth' ].value = depthRenderTarget;
  ssaoPass.uniforms[ 'size' ].value.set( width / window.devicePixelRatio, height / window.devicePixelRatio );
  ssaoPass.uniforms[ 'cameraNear' ].value = 0.01 + (window.devicePixelRatio-1) * 60.0;
  ssaoPass.uniforms[ 'cameraFar' ].value = 60 + - ( window.devicePixelRatio-1 ) * 50 ;
  ssaoPass.uniforms[ 'onlyAO' ].value = 0;
  ssaoPass.uniforms[ 'aoClamp' ].value = 0.1;
  ssaoPass.uniforms[ 'lumInfluence' ].value = 1.2;

  const fxaaPass = new THREE.ShaderPass( THREE.FXAAShader );
  fxaaPass.uniforms[ 'resolution' ].value.set( 1/width, 1/height );
  fxaaPass.renderToScreen = true;

  window.ssao = ssaoPass.uniforms;

  //  GLOW
  const glowRenderTarget = new THREE.WebGLRenderTarget( width, height, pars );

  const blurPasses = 2;
  const blurPassArray = [];
  for( let i=0; i<blurPasses; i++ ){
    let hblur = new THREE.ShaderPass( THREE.HorizontalBlurShader );
    let vblur = new THREE.ShaderPass( THREE.VerticalBlurShader );

    let bluriness = 1 + i;

    hblur.uniforms.h.value = bluriness / window.innerWidth;
    vblur.uniforms.v.value = bluriness / window.innerHeight;
    blurPassArray.push( hblur, vblur );
    // vblur.renderToScreen = true;
  }

  var effectCopy = new THREE.ShaderPass( THREE.CopyShader );
  // effectCopy.renderToScreen = true;

  const glowComposer = new THREE.EffectComposer( renderer );
  glowComposer.addPass( renderPass );

  blurPassArray.forEach( function( pass ){
    glowComposer.addPass( pass );
  });

  // glowComposer.addPass( effectCopy );


  // Add pass to effect composer
  const effectComposer = new THREE.EffectComposer( renderer );
  effectComposer.addPass( renderPass );
  effectComposer.addPass( ssaoPass );

  //  additive pass
  const additivePass = createAdditivePass( effectComposer.renderTarget, glowComposer.renderTarget2 );
  effectComposer.addPass( additivePass );

  effectComposer.addPass( fxaaPass );

  function flagsSet( flags ){
    return R.any( R.values( flags ) )
  }

  function onlyGlow( flag ){
    scene.traverse( function( o ){
      if( o.POVOnly !== undefined || o.hiddenInPOV !== undefined ){
        return;
      }

      const material = o.material;
      if( material && ( material.glow === undefined || material.glow === false ) ){
        o.visible = flag;
      };
    })
  }

  function renderPostProcessed( scene, camera, flags ){

    const usePostProcessing = flagsSet( flags );
    if( usePostProcessing === false ){
      renderer.render( scene, camera );
      return;
    }

    ssaoPass.enabled = flags.ssao;
    additivePass.enabled = flags.glow;

    // ssaoPass.uniforms[ 'cameraNear' ].value = 0.02;
    // ssaoPass.uniforms[ 'cameraFar' ].value = 40;

    if( flags.glow ){
      onlyGlow( false );
      glowComposer.render();
      onlyGlow( true );
    }

    scene.traverse( function( o ){
      if( o.POVOnly !== undefined || o.hiddenInPOV !== undefined ){
        return;
      }
      const material = o.material;
      if( material && material.ssao !== undefined && material.ssao === false ){
        o.visible = false;
      };
    });
    renderPass.camera = camera;
    scene.overrideMaterial = depthMaterial;
    renderer.render( scene, camera, depthRenderTarget, true );
    scene.overrideMaterial = null;

    scene.traverse( function( o ){
      if( o.POVOnly !== undefined || o.hiddenInPOV !== undefined ){
        return;
      }
      const material = o.material;
      if( material && o.material.ssao !== undefined  && material.ssao === false ){
        o.visible = true;
      };
    });
    effectComposer.render();
  }

  function resizePostProcessing( width, height ){
    effectComposer.reset();
    // glowComposer.reset();

    depthRenderTarget.setSize( width, height );
    glowRenderTarget.setSize( width, height );

    ssaoPass.uniforms[ 'size' ].value.set( width / window.devicePixelRatio, height / window.devicePixelRatio );
    fxaaPass.uniforms[ 'resolution' ].value.set( 1/width, 1/height );

  }

  return {
    renderPostProcessed,
    resizePostProcessing
  };
}

function createAdditiveBlendShader(){
  return {
    uniforms: {
      tDiffuse: { type: 't', value: undefined }, // The base scene buffer
      tGlow: { type: 't', value: undefined }, // The glow scene buffer
      tEmissive: { type: 't', value: undefined }
    },

    vertexShader: [
      'varying vec2 vUv;',

      'void main() {',

        'vUv = vec2( uv.x, uv.y );',
        'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',

      '}'
    ].join('\n'),

    fragmentShader: [
      'uniform sampler2D tDiffuse;',
      'uniform sampler2D tGlow;',
      'uniform sampler2D tEmissive;',

      'varying vec2 vUv;',

      'void main() {',

        'vec4 texel = texture2D( tDiffuse, vUv );',
        'vec4 glow = texture2D( tGlow, vUv );',
        'vec4 emissive = texture2D( tEmissive, vUv );',
        'gl_FragColor = texel + emissive + vec4(0.7, 0.7, 0.7, 1.0) * glow * 2.0;',
      '}'
    ].join('\n')
  };
};

function createAdditivePass( a, b ){
  const additiveBlendShader = createAdditiveBlendShader();
  additiveBlendShader.uniforms.tGlow.value = b;
  additiveBlendShader.uniforms.tEmissive.value = a;

  var additivePass = new THREE.ShaderPass( additiveBlendShader );
  additivePass.needsSwap = true;
  additivePass.renderToScreen = false;
  return additivePass;
};

