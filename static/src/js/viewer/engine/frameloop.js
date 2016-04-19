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
 export default function createFrameLoop(){

  var updateFunctions = [];

  var delta = null;
  var lastMsec = Date.now();
  (function updateLoop( nowMsec )
  {
    delta = nowMsec - lastMsec;

    updateFunctions.forEach( function( update ){
      var fnDelta = nowMsec - update.lastTime;
      if( fnDelta > update.frequency ){
        update.fn( delta );
        update.lastTime = nowMsec;
      }
    });

    lastMsec = nowMsec;

    requestAnimationFrame( updateLoop );

  })( Date.now() );

  var that = {};

  that.add = function( fn, frequency=0 ){
    updateFunctions.push( {
      lastTime: 0,
      frequency: frequency,
      fn: fn
    });
  };

  that.clear = function(){
    updateFunctions = [];
  };

  return that;
}