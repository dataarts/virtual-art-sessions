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
 import * as Signal from './signal';

export function create( start, end, offsets ){

  const onTick = Signal.create();
  const onSeek = Signal.create();

  const duration = end - start;

  let time = start;
  let playing = false;

  function play(){
    playing = true;
  }

  function pause(){
    playing = false;
  }

  function restart(){

  }

  function currentTime(){
    return time;
  }

  function totalTime(){
    return duration;
  }

  function updateTime( curTime ){
    // console.log('update time', curTime, offsets.time * 1000 );
    if( curTime < 0 ){
      time = 0;
    }
    else{
      time = curTime;
    }
    return ( curTime - offsets.time ) * 1000.0;
  }

  function update( t ){
    onTick.emit( updateTime( t ) );
  }

  function seek( t ){
    onSeek.emit( updateTime( t ) );
  }

  function seekToRatio( ratio ){
    seek( duration / 1000.0 * ratio );
  }

  function getPercentage(){
    return time * 1000 / duration;
  }

  function getDuration(){
    return duration / 1000.0;
  }

  function getTimeAtRatio( ratio ){
    return ( ( duration / 1000.0 * ratio ) - offsets.time ) * 1000.0
  }

  function bindEvents( { onTick: bTick, onSeek: bSeek } = {} ){
    onTick.add( bTick );
    onSeek.add( bSeek );
  }

  function isPlaying(){
    return playing;
  }

  function isFinished(){
    var progress = Math.round(getPercentage() * 1000) / 1000;
    return progress >= 1.0;
  }

  return {
    play, pause, restart, isPlaying, isFinished,
    currentTime, totalTime,
    seekToRatio, seek, update,
    getPercentage, bindEvents, getDuration, getTimeAtRatio
  };
}