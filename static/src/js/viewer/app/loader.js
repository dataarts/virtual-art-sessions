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

import * as Artist from './artist';
import * as Sketch from './sketch';
import * as VideoController from './videocontroller';
import * as StraightEdgeTool from './straightedgetool';
import * as DataPlayer from './dataplayer';
import * as InputView from './inputview';
import * as VRMesh from './vrmesh';

export var sketchLoader = R.curry( function( { renderer, povCamera, frameLoop, control }, events, sketchName, resolve, reject ){

  const path = '/data/sketches/' + sketchName + '/';

  const videoSource = 'https://storage.googleapis.com/udon-media-usa/test_videos';

  const mainGroup = new THREE.Group();

  const zUp = createZUp();
  mainGroup.add( zUp );

  let player;

  $.getJSON( path + 'meta.json' ).then( function( meta ){
    const hasVideo = ( meta.video !== undefined );
    const videoSource = hasVideo ? meta.video.source : '';
    const artistSettings = meta.artistSettings ? meta.artistSettings : {};

    renderer.setRenderFlags( meta.postprocessing ? meta.postprocessing : {} );

    player = createPlayer( {
      path, hasVideo, videoSource, artistSettings, mainGroup,
      frameLoop, zUp, renderer, povCamera, control,
      resolve, reject, events
    } );
  });

  //  Props can load separately..
  $.getJSON( path + 'props.json' )
  .then( function( props ){
    if( props.pos && props.type === 'P' ){
      const position = Sketch.ThreeJSVec3FromTiltbrushData( props.pos );
      const scale = Sketch.ThreeJSScaleFromTiltbrushData( props.scale );
      position.y += scale.y * 0.5;

      const geo = new THREE.BoxGeometry( 1, 1, 1, 1, 1, 1 );

      const mat = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
      const mesh = new THREE.Mesh( geo, mat );
      mesh.position.copy( position );
      mesh.scale.copy( scale );
      mesh.receiveShadow = true;
      mesh.castShadow = false;

      zUp.add( mesh );
    }
    else if( props.type === 'dress' ){
      zUp.add( VRMesh.getMannequin() );
    }
  })
  .fail( function(){
    console.log( 'no props detected for this sketch' );
  });

  function unload(){
    if( player ){
      player.unload();
    }
  }

  return {
    view: mainGroup,
    unload: unload
  };

});

function createZUp(){
  const zUp = new THREE.Group();
  zUp.rotation.y = Math.PI * 0.5;
  return zUp;
}

function createPlayer( {
  path, hasVideo, videoSource, artistSettings, mainGroup,
  frameLoop, zUp, renderer, povCamera, control,
  resolve, reject, events } ){

  const orbit = control.orbit();

  //  autorotate on start
  //orbit.autoRotate = true;
  orbit.noKeys = true;
  orbit.autoRotateSpeed = -0.20;
  orbit.noRotate = false;

  function disableAutoRotate(){
    orbit.autoRotate = false;
  }

  //  disable it on events
  $(window).click( disableAutoRotate );
  $(window).on( 'tap', disableAutoRotate );

  const loadList = [
    $.getJSON( path + 'actions.json' ),
    $.getJSON( path + 'input.json' )
  ];

  const vc = VideoController
      .create( VideoController.defaultVideoSettings(), frameLoop );

  if( hasVideo ){
    loadList.push( $.getJSON( path + 'playback.json' ) );
    loadList.push( $.getJSON( path + 'offsets.json' ) );
    loadList.push( $.getJSON( path + 'editing.json' ) );
    loadList.push( vc.load( videoSource ) );
  }

  console.time( 'load json' );
  // console.profile('loading');
  Promise.all( loadList )
  .then( function( [ sketchData, inputState, playbackMeta, offsets, editing, videoController ] = [] ){
    console.timeEnd( 'load json' );

    const ground = createGround();
    mainGroup.add( ground );

    frameLoop.add( function(){
      if( offsets.cameraTargetHeight !== undefined ){
        orbit.target.y = offsets.cameraTargetHeight;
      }
    });

    if( offsets ){

    } else {
      // create zero'd offsets, since we have no video
      offsets = {};
      offsets.time = 0;
      offsets.playhead = 0;
      // offsets.cameraTargetHeight = orbit.target.y;
      offsets.positionGround = 0;
      offsets.sketchStartTime = 0;
      offsets.videoOffsetTime = 0;
    }

    let artistFront;
    let artistBack;
    let playbackRate = 1.0;

    function updateArtistUniforms( uni ){
      if( artistFront && artistBack ){
        artistFront.updateUniforms( uni );
        artistBack.updateUniforms( uni );
      }
    }

    if( playbackMeta && videoController ){

      const artistGroup = new THREE.Group();
      mainGroup.add( artistGroup );
      artistGroup.position.copy( offsets.positionBoth );

      const video = videoController.getElement();

      const [ cameraA, cameraB ] = playbackMeta.cameras;

      const frontCorners = {
        top: 0, left: 0, right: 512, bottom: 424
      };
      const backCorners = {
        top: 0, left: 512, right: 1024, bottom: 424
      };

      artistFront = Artist.create( { video, artistSettings, cameraData: cameraA, sourceCorners: frontCorners } );
      const artistFrontView = artistFront.getView();
      artistFrontView.position.copy( offsets.positionA );
      artistGroup.add( artistFrontView );

      artistBack = Artist.create( { video, artistSettings, cameraData: cameraB, sourceCorners: backCorners } );
      const artistBackView = artistBack.getView();
      artistBackView.position.copy( offsets.positionB );
      artistBackView.rotation.y = Math.PI;
      artistGroup.add( artistBackView );

      artistGroup.hiddenInPOV = true;


      if (!artistSettings.pointSize) artistSettings.pointSize = 3.4;
      if (!artistSettings.blackCutOff) artistSettings.blackCutOff = 0.0;


      var artistUniforms = {
        pointSize: artistSettings.pointSize,
        zOffset: 100,
        colorMode: 0,
        blackCutOff: artistSettings.blackCutOff
      };
      updateArtistUniforms(artistUniforms);

      var postionA_default = new THREE.Vector3( 0, 0, 300 );
      var postionB_default = new THREE.Vector3( 0, 0, -300 );

      //  debug
      frameLoop.add( function(){
        // TODO: do we really need to update this every frame?
        artistFrontView.position.set( offsets.positionA.x, offsets.positionA.y, offsets.positionA.z + postionA_default.z);
        artistBackView.position.set( offsets.positionB.x, offsets.positionB.y, offsets.positionB.z + postionB_default.z);
        artistGroup.position.copy( offsets.positionBoth );

        artistFrontView.rotation.x = offsets.positionA.pitch * Math.PI / 180;
        artistBackView.rotation.x = offsets.positionB.pitch * Math.PI / 180;
        artistGroup.rotation.x = offsets.positionBoth.pitch * Math.PI / 180;
        artistFrontView.rotation.y = offsets.positionA.yaw * Math.PI / 180;
        artistBackView.rotation.y = offsets.positionB.yaw * Math.PI / 180 + Math.PI;
        artistGroup.rotation.y = offsets.positionBoth.yaw * Math.PI / 180 + Math.PI;
        artistFrontView.rotation.z = offsets.positionA.roll * Math.PI / 180;
        artistBackView.rotation.z = offsets.positionB.roll * Math.PI / 180;
        artistGroup.rotation.z = offsets.positionBoth.roll * Math.PI / 180;

        ground.position.y = offsets.positionGround;
      });
    }

    const { dataMesh, endTime, bindings: sketchBindings } = Sketch.createPlayer( sketchData );
    zUp.add( dataMesh );

    const dataPlayer = DataPlayer.create( 0, endTime, offsets );
    dataPlayer.bindEvents( sketchBindings );
    console.log( endTime, offsets );

    const { bindings : inputBindings, view: inputView, hmd, rhand, lhand, mirror }
       = InputView.create( inputState );
    dataPlayer.bindEvents( inputBindings );
    zUp.add( inputView );



    const mainCamera = renderer.getDefaultCamera();

    const straightEdgePlayer = StraightEdgeTool.createPlayer( sketchData, rhand );
    dataPlayer.bindEvents( straightEdgePlayer.bindings );
    zUp.add( straightEdgePlayer.view );

    hmd.add( povCamera );

    const appState = {
      pov: false,
      playingEdit:false
    };

    function setPOV( usePOV ){
      if( usePOV ){
        renderer.swapSpecificCamera( true );
        orbit.noRotate = true;
      }
      else{
        renderer.swapSpecificCamera( false );
        orbit.noRotate = false;
      }
      appState.pov = usePOV;
    }

    function togglePOV(){
      appState.pov = !appState.pov;
      setPOV( appState.pov );
    }

    $(renderer.getThumbnailElement()).click( togglePOV );

    let endCalled = false;
    if( videoController ){

      frameLoop.add( function(){
        update( videoController.getPercentage() );
        dataPlayer.update( videoController.getCurrentTime() );
        offsets.playhead = Math.min( dataPlayer.getPercentage(), 1.0 );

        if (!endCalled && videoController.getPercentage() === 1.0) {

          if (isPlaying()) {
            endCalled = true;
            events.playbackComplete.emit();
          }
        } else if (videoController.getPercentage() < 1) {
          endCalled = false;
        }
      });

      videoController.onPlay( function(){
        dataPlayer.play( );
        events.beginPlay.emit();
      });

      videoController.onEnd( function(){
        events.playbackComplete.emit();
      });
    }
    else{
      frameLoop.add( function( delta ){
        update( dataPlayer.getPercentage() );
        if( dataPlayer.isPlaying() ){
          dataPlayer.update( dataPlayer.currentTime() + (delta * playbackRate) / 1000.0 );
        }
        else{
          dataPlayer.update( dataPlayer.currentTime() );
        }
        offsets.playhead = Math.min( dataPlayer.getPercentage(), 1.0 );
        // console.log('dataplayer playing', dataPlayer.getPercentage());
        if( !endCalled && dataPlayer.getPercentage() > 1.0 ){
          endCalled = true;
          events.playbackComplete.emit();
        }
        else if( dataPlayer.getPercentage() < 1 ){
          endCalled = false;
        }
      });
    }

    let cuts;
    let currentCutIndex;

    function update( ratio ){
      if (appState.playingEdit) {
        if(ratio >= cuts[currentCutIndex].end ){
          if ((currentCutIndex + 1) >= cuts.length) {
            pause();
          }
          else {
            currentCutIndex++;
            seek(cuts[currentCutIndex].start);
          }

        }
      }

    }

    function startEditPlayback(inCuts) {
      if (inCuts && (inCuts.length > 0) ) {
        cuts = inCuts;
        appState.playingEdit = true;


        currentCutIndex = 0;
        seek( cuts[currentCutIndex].start)
      }

    }

    function endEditPlayback() {
      appState.playingEdit = false;
    }

    function isEditPlayback() {
      return appState.playingEdit;
    }

    function play( ) {
      if (videoController) {
        videoController.play( );
      } else {
        dataPlayer.play( );
        events.beginPlay.emit();
      }
    }

    function pause(){
      if( videoController ){
        videoController.pause();
      }
      dataPlayer.pause();

      events.endPlay.emit();
    }

    function seek( percentage ){
      if (appState.playingEdit) {
        for (var i in cuts) {
          var cut = cuts[i];
          if (percentage < cut.end){
            currentCutIndex = parseInt(i);

            if (percentage < cut.start) {
              percentage = cut.start;
            }
            break;
          }
        }
      }


      if( videoController ){
        videoController.seekToRatio( percentage );
        dataPlayer.seek( percentage * dataPlayer.totalTime() / 1000.0 );
      }
      else{
        dataPlayer.seek( percentage * dataPlayer.totalTime() / 1000.0 );
      }
    }

    function rewind(){
      seek( 0 );
    }

    function progress(){

      if( videoController ){
        return videoController.getPercentage();
      }
      else{
        return dataPlayer.getPercentage();
      }
    }

    function setPlaybackRate(rate) {
      playbackRate = rate;
      if( videoController ){
        return videoController.setPlaybackRate(rate);
      }
      else{
        return true;
      }
    }

    function getCurrentTime(){
      if( videoController ){
        return videoController.getCurrentTime();
      }
      else{
        return dataPlayer.currentTime();
      }
    }

    function isPlaying(){
      if( videoController ){
        return videoController.isPlaying();
      }
      else{
        return dataPlayer.isPlaying();
      }
    }

    function debugVideo(){
      if( videoController ){
        videoController.debugVideo();
      }
    }

    function videoDuration(){
      if( videoController ){
        return videoController.getDuration();
      }
      else{
        return 0;
      }
    }

    function getRatioAtVideoTime(time) {
      if( videoController ){
        return time / videoController.getDuration();
      }
      else{
        return 0;
      }
    }

    function getVideoTimeAtRatio( ratio ){
      if( videoController ){
        return ratio * videoController.getDuration();
      }
      else{
        return 0;
      }
    }

    function dataDuration(){
      return dataPlayer.getDuration();
    }

    function getDataTimeAtRatio( ratio ){
      return dataPlayer.getTimeAtRatio( ratio );
    }

    function setInputVisibilty(bool) {
      hmd.visible = bool;
      lhand.visible = bool;
      rhand.visible = bool;
      mirror.visible = bool;
    }

    function setThumbnailVisibilty(bool) {
      if (bool) {
       renderer.getThumbnailRenderer().setSize( 320, 200 );

      } else {
        renderer.getThumbnailRenderer().setSize( 0, 0 );
      }
    }

    function skip( time ){
      const percentageToSkip = time / videoController.getDuration();
      const seekTarget = videoController.getPercentage() + percentageToSkip;
      seek( seekTarget );
    }


    // console.log('END OF LOADER');

    seek( 0 );

    pause();

    events.sketchLoaded.emit();
    // console.profileEnd('loading');

    renderer.start();

    resolve( { play, pause, rewind, seek,
      setPOV, togglePOV,
      progress, offsets, artistSettings, debugVideo,
      videoDuration, dataDuration, getCurrentTime, isPlaying,
      getVideoTimeAtRatio, getRatioAtVideoTime, getDataTimeAtRatio, orbit,
      updateArtistUniforms, setInputVisibilty, setThumbnailVisibilty,
      skip, path, playbackMeta, setPlaybackRate,
      startEditPlayback, endEditPlayback, isEditPlayback, editing } );


  })
  .catch( function( err ){
    reject( err );
  });

  function unload(){
    vc.unload();
    renderer.swapSpecificCamera( false );
    $(renderer.getThumbnailElement()).unbind();
  }

  return {
    unload
  };
}

function createGround(){
  const ground = new THREE.Mesh( new THREE.CylinderGeometry(140,140,20, 8),
    new THREE.MeshPhongMaterial({
      color:0x101010,
      //color:0x0C0C0C,
      specular: 0.15,
      shininess: 2
    })
  );
  ground.position.y = -10;
  ground.receiveShadow = true;
  return ground;
}
