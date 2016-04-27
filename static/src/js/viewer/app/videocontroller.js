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
 'use strict';

import $ from 'jquery';
import * as Signal from './signal';
import * as DeviceCheck from './devicecheck';

const VideoTypes = {
  WEBM: 'webm',
  MP4: 'mp4'
};

const VideoResolution = {
  LARGE: '1024_848',
  MEDIUM: '512_424',
  SMALL: '256_212'
};

const VideoSource = {
  REMOTE: 'remote',
  LOCAL: 'local'
};


//const remoteURL = 'http://virtualartsessions.chromeexperiments.com.global.prod.fastly.net/';
const remoteURL = 'https://virtualartsessions.global.ssl.fastly.net/';
const localURL = '/serve-file/';
export function defaultVideoSettings(){
  return {
    resolution: VideoResolution.MEDIUM,
    videoType: VideoTypes.WEBM,
    paintToCanvas: false,
    source:VideoSource.REMOTE
  };
}

function resolvePath( path, settings ){
  let baseURL = remoteURL;
  let suffix = "";

  if (settings.source == VideoSource.LOCAL) {
    baseURL = localURL;
    suffix = "/";
  }

  return baseURL + path + '/' + settings.resolution + '/video.' + settings.videoType + suffix;
}

function getUrlParam( name, url ) {
  if (!url) url = location.href.replace(/\/+$/, '');
  name = name.replace(/[\[]/,'[').replace(/[\]]/,']');
  var regexS = '[\\?&]'+name+'=([^&#]*)';
  var regex = new RegExp( regexS );
  var results = regex.exec( url );
  return results === null ? null : results[1];
}

export function create( settings, frameLoop ) {

  const videoState = {
    finished: false,
    playing: false
  };

  if( DeviceCheck.isMobile() ){
    settings.resolution = VideoResolution.SMALL;
  }

  //if browser doesn't support webm
  if( !Modernizr.video.webm ){
    settings.videoType = VideoTypes.MP4;
  }

  // iOS
  if (DeviceCheck.isIOS() ) {
    settings.paintToCanvas = true;
  }

  // if we're on IE
  if (DeviceCheck.isIE() ) {
    console.log("IE")
    settings.paintToCanvas = true;
    settings.source = VideoSource.LOCAL;
    settings.resolution = VideoResolution.SMALL;
  }

  // if we're on Safar
  if (DeviceCheck.isSafari() ) {
    console.log("Safari")
    settings.paintToCanvas = true;
    settings.source = VideoSource.LOCAL;
  }

  // force video settings via parameter strings
  const forceResolution = getUrlParam( 'res', window.location.href );
  if (forceResolution == 'l') settings.resolution = VideoResolution.LARGE;
  else if (forceResolution == 'm') settings.resolution = VideoResolution.MEDIUM;
  else if (forceResolution == 's') settings.resolution = VideoResolution.SMALL;

  const forceVideoType = getUrlParam( 'type', window.location.href );
  if (forceVideoType == 'webm') settings.videoType = VideoTypes.WEBM;
  else if (forceVideoType == 'mp4') settings.videoType = VideoTypes.MP4;

  const forcePaint = getUrlParam( 'paint', window.location.href );
  if (forcePaint == 'true') settings.paintToCanvas = true;
  if (forcePaint == 'false') settings.paintToCanvas = false;

  const forcePath = getUrlParam( 'loc', window.location.href );
  if (forcePath == 'local') settings.source = VideoSource.LOCAL;
  if (forcePath == 'remote') settings.source = VideoSource.REMOTE;

  console.log("SETTINGS:", settings)


  const $controllerGroup = $( '<div>' )
  .css({
    position: 'absolute',
    top: '0px',
    left: '0px',
    zIndex: 1000
  })
  .appendTo( $( document.body ) )
  .hide();

  const $video = $('<video>')
  .appendTo( $controllerGroup )
  .before( $('<p>RAW VIDEO</p>') );

  const videoElement = $video[ 0 ];
  //videoElement.crossOrigin = 'use-credentials';
  videoElement.crossOrigin = '';

  const videoCanvas = createVideoCanvas();
  videoCanvas.$element
  .appendTo( $controllerGroup )
  .before( $('<p>CANVAS</p>') );

  videoElement.addEventListener( 'loadedmetadata', function(){
    videoCanvas.setSize( videoElement.videoWidth, videoElement.videoHeight );
    videoElement.crossOrigin = '';
  });

  let canvasPlayback;

  function load( filePath ){
    const path = resolvePath( filePath, settings );

    //  because canplaythrough could happen again on seek...
    let needsSetup = true;

    return new Promise( function( resolve, reject ){

      videoElement.addEventListener('error', function(e){
        console.log( 'Error', e );
        videoState.playing = false;
        reject( e );
      }, false);

      videoElement.addEventListener('ended', function(e){
        videoState.finished = true;
        if( onEndFn ){
          onEndFn();
        }
      });

      videoElement.addEventListener('play', function(e){
        if ( onPlayFn ) {
          onPlayFn();
        }
      });

      frameLoop.add(function() {
        var progress = Math.round(getPercentage() * 1000) / 1000;
        if (progress === 1.0 && videoState.playing) {
          videoState.playing = false;
          videoState.finished = true;
          if (onEndFn) {
            onEndFn();
          }
        }
      });

      videoElement.addEventListener('canplaythrough', function(){
        if( needsSetup && settings.paintToCanvas ){
          needsSetup = false;
          setupCanvasPlayback( videoCanvas, videoElement, videoState, frameLoop );
        }

        resolve(
          {
            seek,
            seekToRatio,
            pause,
            getCurrentTime,
            getDuration,
            getPercentage,
            play,
            getElement,
            debugVideo,
            onEnd,
            onPlay,
            setPlaybackRate,
            isPlaying,
            isFinished
          }
        );

      } , false);

      startPreloading( path );
    });
  }

  function unload(){
    // videoElement.parentNode.removeElement( videoElement );
    // videoCanvas.canvas.parentNode.removeElement( videoCanvas.canvas );
    $controllerGroup.remove();
    videoState.playing = false;
  }

  function startPreloading( fullPath ) {
    videoElement.src = fullPath;
    videoElement.load();
  }

  function seek( pos ) {

    // some browsers (safari, iOS) seem to do weird things if you seek to a position that's too long a floating point number
    // http://blog.millermedeiros.com/html5-video-issues-on-the-ipad-and-how-to-solve-them/
    pos = parseFloat( pos.toFixed(3) );

    // safari does weird things if we try to seek to a time we're already at
    var curTime = videoElement.currentTime.toFixed(3);
    if (pos != curTime){
      videoElement.currentTime = pos;
    }

    var progress = Math.round(getPercentage() * 1000) / 1000;
    if (progress < 1) {
      videoState.finished = false;
    }
  }

  function seekToRatio(ratio) {
    seek( videoElement.duration * ratio );
  }

  function pause() {
    videoState.playing = false;
    if( settings.paintToCanvas === false && !videoElement.paused ){
      videoElement.pause();
    }
  }

  function getCurrentTime() {
    return videoElement.currentTime;
  }

  function getDuration() {
    return videoElement.duration;
  }

  function getPercentage(){
    return getCurrentTime() / getDuration();
  }

  function play() {
    let playing = false;

    if( settings.paintToCanvas === false ){
      videoElement.play();

      // Check to see if the video element *actually* started playing (or if
      // playback was blocked/prevented by the browser).
      if (isPlaying()) {
        playing = true;
      }
    } else {
      playing = true;

      // We need to manually call the onPlay function since the native video 
      // play event will never fire (because we aren't actually playing 
      // the video).
      if (onPlayFn) {
        onPlayFn();
      }
    }

    videoState.finished = false;
    videoState.playing = playing;
  }

  function isFinished() {
    return videoState.finished;
  }

  function setPlaybackRate(rate) {
    videoElement.playbackRate = rate;
  }
  function getElement(){
    return settings.paintToCanvas ? videoCanvas.canvas : videoElement;
  }

  function debugVideo(){
    $controllerGroup.show();
  }

  let onEndFn;
  let onPlayFn;

  function onEnd( fn ){
    onEndFn = fn;
  }

  function onPlay( fn ){
    onPlayFn = fn;
  }

  function isPlaying(){
    let playState;

    if (settings.paintToCanvas) {
      playState = videoState.playing;
    } else {
      playState = !!(videoElement.currentTime > 0 && !videoElement.paused && !videoElement.ended && videoElement.readyState > 2);
    }

    return playState;
  }

  return { load, unload };
}

function createVideoCanvas(){

  const $canvas = $('<canvas>');

  const canvas = $canvas[ 0 ];
  const canvasContext = canvas.getContext('2d');
  canvas.crossOrigin = '';

  function setSize( width, height ){
    canvas.width = width;
    canvas.height = width;
  }

  function paintFrame( video ){
    canvas.crossOrigin = '';
    canvasContext.drawImage( video, 0, 0, canvas.width, canvas.height );
  }

  return {
    setSize, paintFrame, $element: $canvas, canvas
  };

}

function setupCanvasPlayback( videoCanvas, videoElement, videoState, frameLoop ){
  let lastTime = Date.now();

  videoElement.addEventListener( 'timeupdate', function(){
    videoCanvas.paintFrame( videoElement );
    videoElement.crossOrigin = '';
  });

  function loopCanvas(){

    if( videoElement.readyState === videoElement.HAVE_ENOUGH_DATA ){

      const time = Date.now();
      const elapsed = ( time - lastTime ) / 1000;

      if( videoState.playing && elapsed >= ( 1 / 30 ) ){
        videoElement.currentTime = videoElement.currentTime + (elapsed * videoElement.playbackRate);
        lastTime = time;
      }

    }

  }

  frameLoop.add( loopCanvas );

  videoElement.pause();

}
