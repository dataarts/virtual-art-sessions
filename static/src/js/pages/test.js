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
 import * as App from '../viewer/app';
import * as Engine from '../viewer/engine';
import $ from 'jquery';

const engine = Engine.create();
const player = App.create(engine);
const autoRotateParams = {
  autoRotateSpeed: 1.2
};

var controllerGUI;
var timelineGUI;
var isPaused;

var sketches = [
  'hb_spaceship', //*
  'hb_glasses', //**
  'hb_superhero_car', //* 2
  'hb_red_car', //** 4
  'hb_yellow_car',
  'hb_mask',
  'hb_shoe', //* 3
  'hb_shark_ship', //* 1

  '--',
  'ab_little_napolean',
  'ab_seated_woman',
  'ab_flamingo', //** 2
//   'ab_penguin',
  'ab_smoking_man',
  'ab_pelican', //*
  'ab_genie',  //** 4
  'ab_croc',  //**
  'ab_samurai',  //** 3
  'ab_bull',  //** 1
  'ab_bust',  //** 4 ??

  '---',
  //'cn_flowers',
  'cn_banana_slip',
  'cn_flowers_2', //*
  'cn_pencil_hand', //*** ?? 3
  'cn_boxes_1', //*
  'cn_box_trace',
  'cn_badminton', //** 4
  'cn_long_nose',
  'cn_hello_2',
  'cn_dragon', //* ??
  //'cn_paper_man',
  'cn_paper_man_2', //*
  'cn_bathtub',
  'cn_man_in_chair',
  'cn_chair_dog', //* ??
  'cn_chair_meal', //* ?? 1
  'cn_stool_legs', //* ??
//   'cn_paper_men_3',
  'cn_rain', //*
  'cn_sharks', //*
  'cn_piano', //*** 2


  '-----',
  'sny_surf_demon',
  'sny_motorbikes', //** 1
  'sny_wall_rat_yok', //*
  'sny_wall_rat_sheryo', //** 3
  'sny_ren_man',
  'sny_tag_jungle',
  'sny_yoks_brain', //** 4 ??
  'sny_pizza_slice', //*
  'sny_top_dog', //*
  'sny_alley_cat', //*** 2
  'sny_spray_rat', //**
  'sny_tag_chaos',
  'sny_pineapple',  //*

/*
  '----',
  'kr_champagne',
  'kr_faces',
  'kr_starcatcher',  //**1
  'kr_air_dancers',
  'kr_dressform_red',  //*
  'kr_dressform_blue',  //**2
  'kr_figure_and_tree', //*
  'kr_ballet',  //**4
  'kr_tears',
  'kr_flow',  //**3
*/

  '------',
  'syo_low_ribbons', //*
  'syo_yellow_shards', //**2
  'syo_lines_and_shards',
  'syo_shard_stars', //**
  'syo_red_ball', //**
  'syo_yellow_nest', //*
  'syo_red_ribbons', //**
  'syo_double_form', //**3
  'syo_insect_form', //*
  'syo_purple_white',
  'syo_red_explosion', //**1
  'syo_tangle', //*4

];


var sketches_w_artist = [

  'hb_shark_ship_edit',
  'hb_superhero_car_edit',
  'hb_red_car_edit',
  'hb_shoe_edit',

  '-',
  'ab_bull_edit',
  'ab_flamingo_edit',
  'ab_samurai_edit',
  'ab_genie_edit',

  '---',
  'cn_chair_meal_edit',
  'cn_piano_edit',
  'cn_pencil_hand_edit',
  'cn_badminton_edit' ,

  '-----',
  'sny_wall_rat_sheryo_edit',
  'sny_alley_cat_edit',
  'sny_motorbikes_edit',
  'sny_yoks_brain_edit',
  'sny_ren_man_edit',

  '----',
  'kr_starcatcher_edit',
  'kr_dressform_red_edit',
  'kr_dressform_blue_edit',
  'kr_flow_edit',
  'kr_ballet_edit',


  '------',
  'syo_red_explosion_edit',
  'syo_yellow_shards_edit',
  'syo_double_form_edit',
  'syo_tangle_edit',
]

var currentSketchName = '';

/**
 * Initialize components on the page.
 */
function init() {

  timelineGUI = createTimelineGUI()

  player.events.sketchLoaded.add( function(){
    console.log('sketch has loaded');
  });

  player.events.playbackComplete.add( function(){
    console.log('playback complete');
  });

  player.events.beginPlay.add( function(){
    console.log('playing started');
  });

  player.events.endPlay.add( function(){
    console.log('playing stopped');
  });

  currentSketchName = getUrlParam( 'sketch', window.location.href );

  if( currentSketchName == null ){
    console.warn( 'use: test/?sketch=syo_yellow_nest' );
    currentSketchName = 'syo_yellow_nest';

  }
  loadAndTest( currentSketchName );


  initLoaderGui();

  $('.js-viewer').append(player.domElement());
}


function initLoaderGui() {
  var loaderGUI = new dat.GUI( );
  loaderGUI.domElement.id = 'loadergui';
  loaderGUI.add( { sketch: currentSketchName }, 'sketch', sketches ).onFinishChange( sketchSelected);
  loaderGUI.add( { sketch_w_artist: currentSketchName }, 'sketch_w_artist', sketches_w_artist ).onFinishChange( sketchSelected);
}

function sketchSelected( val ) {
    if( controllerGUI ){
      controllerGUI.domElement.parentNode.removeChild( controllerGUI.domElement );
    }
    loadAndTest( val );
}




function getUrlParam( name, url ) {
  if (!url) url = location.href.replace(/\/+$/, '');
  name = name.replace(/[\[]/,'[').replace(/[\]]/,']');
  var regexS = '[\\?&]'+name+'=([^&#]*)';
  var regex = new RegExp( regexS );
  var results = regex.exec( url );
  return results === null ? null : results[1];
}


function loadAndTest( sketchName ){
  //  path from public/data/sketches/...
  player
  .load( sketchName )
  .then( function( sketch ){

    sketch.pause();
    sketch.play();

    window.sketch = sketch;

    timelineGUI.setSketch(sketch);

    var gui = controllerGUI = new dat.GUI();
    gui.domElement.addEventListener('mousedown', function(e){
      return false;
    });


    var help ={};
    help.showInstructions = function() {
      window.alert(
      'Select sketches in the upper left drop downs' + '\n' +
      '---' + '\n' +
      'space: toggle pause/play' + '\n' +
      'left: seek -1s' + '\n' +
      'right: seek +1s' + '\n' +
      '---' + '\n' +
      'u/i: show/hide GUI' + '\n' +
      'w/a/s/d: start camera rotation' 
      )
    }
    help.showEditInstructions = function() {
      window.alert(
      'Editing:' + '\n' +
      '---' + '\n' +
      'x: make cut at current time' + '\n' +
      '1-9: select an edit section' + '\n' +
      'b: set start of current edit' + '\n' +
      'n: set end of current edit' + '\n' +
      'up: goto start of current edit section' + '\n' +
      'down: goto end of current edit section' + '\n' +
      'e: toggle playback mode'
      )
    }
    gui.add( help, "showInstructions" );

    gui.add( sketch, 'play' );
    gui.add( sketch, 'pause' );
   // gui.add( sketch, 'rewind' );

    var playbackParam = {};
    playbackParam.playbackRate = 1.0;
    gui.add( playbackParam, 'playbackRate' ).min(0).max(10).step(0.01).onChange( function(val) {sketch.setPlaybackRate(val)} )


    gui.add( autoRotateParams, 'autoRotateSpeed' ).min(0).max(2).name('rotate speed');


    var offsets = sketch.offsets;
    var artistSettings = sketch.artistSettings;
    var hasVideo = ( offsets && offsets.positionA );
    if( hasVideo ){

      var guiScene = gui.addFolder('Scene Settings');
      guiScene.add( offsets, 'positionGround' ).min(-30).max(10).step(0.01).name('ground y');
      guiScene.add( offsets, 'cameraTargetHeight' ).min(-180).max(180).step(1).name('camera target height');
      guiScene.add( offsets, 'time' ).min( -1.0 ).max( 1.0 ).name('time offset').onFinishChange( function( v ){ console.log( v ); } );


      var artistGui = gui.addFolder('Artist');

      var guiRender = artistGui.addFolder('Rendering');
      var artistUniforms = {
        pointSize: sketch.artistSettings.pointSize,
        colorMode: 0,
        blackCutOff: sketch.artistSettings.blackCutOff
      };


      var a1 = artistGui.addFolder('Adjust Artist side 1');
      a1.add( offsets.positionA, 'x' ).min(-150).max(150).step(0.01).name('ax');
      a1.add( offsets.positionA, 'y' ).min(-20).max(20).step(0.01).name('ay');
      a1.add( offsets.positionA, 'z' ).min(-100).max(100).step(0.01).name('az');
      a1.add( offsets.positionA, 'pitch' ).min(-10).max(10).step(0.1).name('a pitch');
      a1.add( offsets.positionA, 'yaw' ).min(-15).max(15).step(0.01).name('a yaw');
      a1.add( offsets.positionA, 'roll' ).min(-3).max(3).step(0.01).name('a roll');

      var a2 = artistGui.addFolder('Adjust Artist side 2');
      a2.add( offsets.positionB, 'x' ).min(-50).max(50).step(0.01).name('bx');
      a2.add( offsets.positionB, 'y' ).min(-20).max(20).step(0.01).name('by');
      a2.add( offsets.positionB, 'z' ).min(-50).max(50).step(0.01).name('bz');
      a2.add( offsets.positionB, 'pitch' ).min(-10).max(10).step(0.01).name('b pitch');
      a2.add( offsets.positionB, 'yaw' ).min(-15).max(15).step(0.01).name('b yaw');
      a2.add( offsets.positionB, 'roll' ).min(-3).max(3).step(0.01).name('b roll');

      var aBoth = artistGui.addFolder('Adjust Artist whole');
      aBoth.add( offsets.positionBoth, 'x' ).min(-100).max(100).step(0.01).name('both x');
      aBoth.add( offsets.positionBoth, 'y' ).min(-0).max(150).step(0.01).name('both y');
      aBoth.add( offsets.positionBoth, 'z' ).min(-100).max(100).step(0.01).name('both z');
      aBoth.add( offsets.positionBoth, 'pitch' ).min(-10).max(10).step(0.01).name('both pitch');
      aBoth.add( offsets.positionBoth, 'yaw' ).min(-180).max(0).step(0.01).name('both yaw');
      aBoth.add( offsets.positionBoth, 'roll' ).min(-10).max(10).step(0.01).name('both roll');

      var onUniformsChanged = function(){
        sketch.updateArtistUniforms( artistUniforms);
      }

      guiRender.add( artistUniforms, 'colorMode').min(0).max(2).step(1).onChange( onUniformsChanged );
     // guiRender.add( artistUniforms, 'blackCutOff').min(0).max(0.01).onChange( onUniformsChanged );
      guiRender.add( artistUniforms, 'pointSize').min(0).max(8).onChange( onUniformsChanged );
    }


    function updateUI(){
      timelineGUI.updateUI();
      window.requestAnimationFrame(updateUI);
    }
    window.requestAnimationFrame(updateUI);

    if( offsets ) {
      artistGui.add( { saveOffsets: function(){

        window.prompt( 'save', JSON.stringify( offsets, null, 2 ) );
        console.log( JSON.stringify( offsets, null, 2 ) );
      }}, 'saveOffsets' );
    }
    artistGui.add( sketch, 'debugVideo' );
    //guiDebug.add( player, 'unload' );


    var editing = createEditing( sketch );

    var guiEdit = gui.addFolder('Editing');
     guiEdit.add( help, "showEditInstructions" );
     guiEdit.add( editing, "removeSelectedCut" );
     guiEdit.add( editing, "startEditPlayback" );
     guiEdit.add( editing, "endEditPlayback" );
     guiEdit.add( editing, "reset" );
     guiEdit.add( editing, "save" );


    // LOAD EDITS
    if (sketch.editing && sketch.editing.test_edit) {
      $.getJSON(sketch.path + sketch.editing.test_edit, function (data) {
          console.log("DATA", data)
          editing.load(data);
          timelineGUI.setEditing(editing);
      })
    };


    timelineGUI.setEditing(editing);

    player.showStats();
    player.enablePanning();


    window.addEventListener('keydown', function onKeyDown(ev){
      console.log(ev.keyCode)
      switch(ev.keyCode) {
        case 32: // space
          if (isPaused) {
            sketch.play();
            isPaused = false;
          } else {
            sketch.pause();
            isPaused = true;
          }
          break;
        case 85: // u
          document.querySelectorAll('.dg.ac')[0].style.display = 'none'
          document.querySelectorAll('#stats')[0].style.display = 'none'
          document.querySelectorAll('#edit_ui')[0].style.display = 'none'
          document.querySelectorAll('#povcanvas')[0].style.display = 'none'
          sketch.setThumbnailVisibilty(false);
           break;
        case 73: // i
          document.querySelectorAll('.dg.ac')[0].style.display = ''
          document.querySelectorAll('#stats')[0].style.display = ''
          document.querySelectorAll('#edit_ui')[0].style.display = ''
          document.querySelectorAll('#povcanvas')[0].style.display = ''
          sketch.setThumbnailVisibilty(true);
           break;

        case 82: //r
          console.log(artistUniforms)
          break;

        // ORBITTING

        case 87: // w
          //ev.preventDefault();
          sketch.orbit.autoRotateDirection = 1;
          sketch.orbit.autoRotateSpeed = autoRotateParams.autoRotateSpeed;
          sketch.orbit.autoRotate = true;
          break;
        case 83: // s
          //ev.preventDefault();
          sketch.orbit.autoRotateDirection = 1;
          sketch.orbit.autoRotateSpeed = -autoRotateParams.autoRotateSpeed;
          sketch.orbit.autoRotate = true;
          break;
        case 65: // a
          //ev.preventDefault();
          sketch.orbit.autoRotateDirection = 0;
          sketch.orbit.autoRotateSpeed = autoRotateParams.autoRotateSpeed;
          sketch.orbit.autoRotate = true;
          break;
        case 68: // d
          //ev.preventDefault();
          sketch.orbit.autoRotateDirection = 0;
          sketch.orbit.autoRotateSpeed = -autoRotateParams.autoRotateSpeed;
          sketch.orbit.autoRotate = true;
          break;


        case 37: // left
          sketch.skip( -1.0 );
          break;
        case 39: // right
          sketch.skip( 1.0 );
          break;


        // EDITING
        case 49: //1
          editing.selectCut(0);
          break;
        case 50: //2
          editing.selectCut(1);
          break;
        case 51: //3
          editing.selectCut(2);
          break;
        case 52: //4
          editing.selectCut(3);
          break;
        case 53: //5
          editing.selectCut(4);
          break;
        case 54: //6
          editing.selectCut(5);
          break;
        case 55: //7
          editing.selectCut(6);
          break;
        case 56: //8
          editing.selectCut(7);
          break;
        case 57: //9
          editing.selectCut(8);
          break;

        case 38: // up
          editing.gotoStartOfSelectedCut();
          break;
        case 40: // down
          editing.gotoEndOfSelectedCut();
          break;

        case 88: // x
          editing.createCut();
          break;

        case 66: // b
          editing.moveStartOfSelectedCut();
          break;
        case 78: // n
          editing.moveEndOfSelectedCut();
          break;

        case 69: // e
          if (sketch.isEditPlayback()) {
            editing.endEditPlayback();
          } else {
            editing.startEditPlayback()
          }
          break;
      }
    });

  });


}
function createEditing( sketch ){

  var cuts = [{start:0, end:1}];
  var selectedCutIndex = -1;

  function createCut() {
    var currentPos = sketch.progress();
    var indexToSplit = 0;

    //find which cut where are in
    var cut;
    for( var i in cuts ){
      cut = cuts[i];
      if (currentPos > cut.start) indexToSplit = i;
    }

    var newStartPos =currentPos;
    var newEndPos = cuts[indexToSplit].end;

    var newCut = {start: newStartPos, end: newEndPos}

    cuts[indexToSplit].end = currentPos;

    cuts.push(newCut);

    sortCuts();

    // find the one we just made
    selectedCutIndex = cuts.findIndex(function(thisCut){
      return ((thisCut.start == newCut.start) && ((thisCut.end == newCut.end)))})

    console.log("split " + indexToSplit)
  }

  function removeSelectedCut(){
    if (selectedCutIndex != -1)  {
      //var selectedCut = cuts[selectedCutIndex]
      cuts.splice(selectedCutIndex,1);
    }
  }

  function sortCuts() {
    cuts.sort(function(a, b){return a.start - b.start})
  }

  function testEdit(){
    if( cuts.length > 0 ){
      sketch.play( cuts );
    }
    else{
      window.alert( 'first create some cuts using beginCut and endCut' );
    }
  }

  function load(inCuts){
    console.log("LOAD EDITS", inCuts);

    var cutsData = inCuts.map( function( cut ){
      return {
          start: sketch.getRatioAtVideoTime( cut.start ),
          end: sketch.getRatioAtVideoTime( cut.end )
      }
    });
    cuts = cutsData;
  }

  function save(){
    // console.log( 'video duration', sketch.videoDuration() );
    // console.log( 'data duration', sketch.dataDuration() );
    // console.log( 'data time at 0.5', sketch.getDataTimeAtRatio( 0.5 ) );
    var out = cuts.map( function( cut ){
      return {
       // video: {
          start: sketch.getVideoTimeAtRatio( cut.start ),
          end: sketch.getVideoTimeAtRatio( cut.end )
       /* },
        data: {
          start: sketch.getDataTimeAtRatio( cut.start ),
          end: sketch.getDataTimeAtRatio( cut.end ),
        }*/
      }
    });

    window.prompt( 'save', JSON.stringify( out ) );
    console.log( JSON.stringify( out ) );
  }

  function reset(){
    var yesReset = window.confirm( 'are you sure you want to reset?' );
    if( yesReset ){
      cuts = [];
    }
  }

  function selectCut(index) {
    if (index < cuts.length) {
      selectedCutIndex = index;
      this.gotoStartOfSelectedCut();
    }
  }
  function gotoStartOfSelectedCut(){
    //if (selectedCutIndex) cuts[selectedCutIndex].start =
    if (selectedCutIndex != -1) sketch.seek( cuts[selectedCutIndex].start  );
  }
  function gotoEndOfSelectedCut(){
    if (selectedCutIndex != -1) sketch.seek( cuts[selectedCutIndex].end  );

  }
  function moveStartOfSelectedCut(){
    if (selectedCutIndex != -1) cuts[selectedCutIndex].start = sketch.progress();
  }
  function moveEndOfSelectedCut(){
    if (selectedCutIndex != -1) cuts[selectedCutIndex].end = sketch.progress();
  }
  function startEditPlayback(){
    sketch.startEditPlayback(cuts);
  }
  function endEditPlayback(){
    sketch.endEditPlayback();
  }
  function getCuts() {
    return cuts;
  }
  function getSelectedCutIndex() {
    return selectedCutIndex;
  }



  return {
    testEdit: testEdit,
    reset: reset,
    save: save,
    load:load,
    createCut: createCut,
    removeSelectedCut: removeSelectedCut,
    selectCut:selectCut,
    getCuts:getCuts,
    getSelectedCutIndex:getSelectedCutIndex,
    gotoStartOfSelectedCut:gotoStartOfSelectedCut,
    gotoEndOfSelectedCut:gotoEndOfSelectedCut,
    moveStartOfSelectedCut:moveStartOfSelectedCut,
    moveEndOfSelectedCut:moveEndOfSelectedCut,
    startEditPlayback:startEditPlayback,
    endEditPlayback:endEditPlayback
  };
}



function createTimelineGUI(  ){
  var editing = null;
  var sketch = null;
  var ui_canvas;
  var ui_ctx;
  var isMouseDown = false;

  function setSketch(inSketch) {
    sketch = inSketch;
  }
  function setEditing(inEditing) {
    editing = inEditing;
    console.log("setEditing", editing.getCuts())
  }
  function init() {
    $("#edit_timeline").empty();

    ui_canvas = document.createElement('canvas');
    ui_ctx = ui_canvas.getContext('2d');
    $("#edit_timeline").append(ui_canvas);

    $(document).mousedown(function() {
        isMouseDown = true;
    }).mouseup(function() {
        isMouseDown = false;
    });

    $("#edit_timeline")[0].addEventListener("mousedown", uiClicked, false);
    $("#edit_timeline")[0].addEventListener("mousemove", uiDrag, false);

    resizeUI();
  }
  function uiClicked(ev) {
    if (sketch) {
      var pos = (ev.x - ui_canvas.offsetLeft) / ui_canvas.width;
      sketch.seek(pos);
    }
  }
  function uiDrag(ev) {
    if (isMouseDown) {
      uiClicked(ev)
    }
  }
  function resizeUI() {
    ui_canvas.width = $("#edit_timeline").width();
    ui_canvas.height = $("#edit_timeline").height();

  }
  function updateUI() {
    var barW = ui_canvas.width;
    var barH = 6;

    // clear
    ui_ctx.clearRect(0,0,ui_canvas.width, ui_canvas.height);


    if (sketch) {
      //var sketch = this.sketch;

      if ( sketch.isEditPlayback()) {
        ui_ctx.fillStyle="#121212";
      } else {
        ui_ctx.fillStyle="#333";
      }
      ui_ctx.fillRect(0,0,barW,barH);

      ui_ctx.font="12px Arial";

      if (editing) {
        var startX, endX, widthX, cut, duration;
        var totalTime = 0;

        var cuts = editing.getCuts();
        var selectedCutIndex = editing.getSelectedCutIndex();
      //console.log(editing.cuts)
        for( var i in cuts ){
          cut = cuts[i];

          duration = sketch.getVideoTimeAtRatio( cut.end ) - sketch.getVideoTimeAtRatio( cut.start );
          totalTime += duration;

          startX = cut.start * barW;
          endX = cut.end * barW;
          widthX = endX - startX;

          if (i == selectedCutIndex) {
            ui_ctx.fillStyle="#885";
          } else {
            ui_ctx.fillStyle="#666";
          }
          ui_ctx.fillRect(startX,0,widthX,barH);
          ui_ctx.fillText((parseInt(i) + 1) + ": "+ duration.toFixed(1) + "s",startX,18);
        }

      }

      if ( sketch.isEditPlayback()) {
        ui_ctx.fillStyle="#885";
      } else {
        ui_ctx.fillStyle="#888";
      }
      ui_ctx.fillText("time: " + sketch.getCurrentTime().toFixed(1) + "s",0,32);

      if (editing)
        ui_ctx.fillText("total edit: " + totalTime.toFixed(1) + "s",0,48);



      // playHead
      var playHeadX = barW * sketch.progress();
      ui_ctx.strokeStyle="#fff";
      ui_ctx.lineWidth=3;
      ui_ctx.beginPath();
      ui_ctx.moveTo(playHeadX,0);
      ui_ctx.lineTo(playHeadX,barH);
      ui_ctx.stroke();
    }
  }


  init();

  return {
    updateUI: updateUI,
    setEditing:setEditing,
    setSketch:setSketch
  };
}

export { init };
