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
import THREE from 'three';

import Brushes from './brushes';

const TEXTURES_IN_ATLAS = 4;

export function createPlayer( { metadata, actions } ){
  console.time('generating');
  const { mesh : dataMesh, startTime, endTime, revealTo, clear, onSeek }
    = generatePlayback( metadata, actions );
  console.timeEnd('generating');

  clear();

  const bindings = {
    onTick: revealTo,
    onSeek: clear
  };

  return {
    dataMesh, endTime, bindings
  };
}


const textureLoader = new THREE.TextureLoader();

const TILTBRUSH_SCALE = 10.0;

const tiltbrushToThree = new THREE.Matrix4().makeScale( 1*TILTBRUSH_SCALE, 1*TILTBRUSH_SCALE, -1*TILTBRUSH_SCALE );
const inverseTiltbrushToThree = new THREE.Matrix4().getInverse( tiltbrushToThree );

export function ThreeJSVec3FromTiltbrushData( [x,y,z] = [] ) {
  const out = new THREE.Vector3( x, y, z ).applyMatrix4( tiltbrushToThree );
  return out;
}

export function ThreeJSScaleFromTiltbrushData( [x,y,z] = [] ) {
  const out = new THREE.Vector3( x, y, -z ).applyMatrix4( tiltbrushToThree );
  return out;
}

export function ThreeJSQuaternionFromTiltbrushData( [x,y,z,w] = [] ) {

  const mTiltbrush = new THREE.Matrix4().makeRotationFromQuaternion( new THREE.Quaternion(x,y,z,w) );
  const mThree = tiltbrushToThree.clone().multiply( mTiltbrush ).multiply( inverseTiltbrushToThree );

  const out = new THREE.Quaternion().setFromRotationMatrix( mThree );
  return out;
}

const onlyStrokes = ( action ) => action.type === 'STROKE';
const onlyDeletes = ( action ) => action.type === 'DELETE';
const controlPointsById = ( controlPoints, id ) => controlPoints.filter( ( cp ) => cp.id === id );

function generatePlayback( metadata, actionsRaw ){

  const brushActions = [];
  actionsRaw.forEach( function( action ){
    if( action.type === 'STROKE' ){
      const brushIndex = action.data.brush;
      if( brushActions[ brushIndex ] === undefined ){
        brushActions[ brushIndex ] = [];
      }
      brushActions[ brushIndex ].push( action );
    }
  });

  actionsRaw.forEach( function( action ){
    if( action.type === 'DELETE' ){
      brushActions.forEach( function( actions ){
        actions.push( action );
      });
    }
  });

  const brushPlayback = brushActions.map( function( brushActions, brushIndex ){
    const brush = Brushes[ metadata.BrushIndex[ brushIndex ] ];
    return generateBrushPlayback( brushActions, brush );
  });

  const group = brushPlayback.reduce( function( g, playback ){
    g.add( playback.mesh );
    return g;
  }, new THREE.Group() );

  const clear = () => brushPlayback.forEach( ( p ) => p.clear() );
  const revealTo = ( t ) => brushPlayback.forEach( ( p ) => p.revealTo( t ) );

  const startTime = Math.min( ... brushPlayback.map( ( p ) => p.startTime ) );
  const endTime = Math.max( ... brushPlayback.map( ( p ) => p.endTime ) );

  return {
    mesh: group, startTime, endTime, revealTo, clear
  };
}

function generateBrushPlayback( actionsRaw, brush ){
  const actions = R.unnest( actionsRaw.map( convertAction( brush ) ) );
  const strokes = actions.filter( onlyStrokes );
  const deletes = actions.filter( onlyDeletes );

  const startTime = 0;//paths[ 0 ].timeRange.start;
  const endTime = strokes[ strokes.length-1 ].timeRange.end;

  const quadMap = strokes.map( actionToQuads );

  //  need to separately merge vertices because
  //  default three.js merge clones the vertices instead of keeping ref
  const collectedVertices = [];

  quadMap.forEach( function( qm ){
    collectedVertices.push( ... qm.geometry.vertices );
  });

  let offset = 0;
  const collectedFaces = [];
  quadMap.forEach( function( qm ){
    const quadFaces = qm.geometry.faces;
    quadFaces.forEach( function( face){
      face.a += offset;
      face.b += offset;
      face.c += offset;
    });
    offset += qm.geometry.vertices.length;
    collectedFaces.push( ...quadFaces );
  });

  const collectedUVs = quadMap.reduce( function( uvs, qm ){
    return uvs.concat( qm.geometry.faceVertexUvs[ 0 ] );
  }, [] );

  // const merged = quadMap.reduce( function( geo, qm ){
  //   // geo.vertices = geo.vertices.concat( qm.geometry.vertices );
  //   // geo.faces = geo.faces.concat( qm.geometry.faces );
  //   // geo.faceVertexUvs[ 0 ] = geo.faceVertexUvs[ 0 ].concat( qm.geometry.faceVertexUvs[ 0 ] );
  //   geo.merge( qm.geometry );
  //   return geo;
  // }, new THREE.Geometry() );

  const merged = new THREE.Geometry();
  merged.faces = collectedFaces;
  merged.vertices = collectedVertices;
  merged.faceVertexUvs[ 0 ] = collectedUVs;

  merged.computeBoundingBox();
  merged.computeBoundingSphere();

  const timeMap = quadMap.reduce( function( arr, qm ){
    return arr.concat( qm.mapping );
  }, [] )
  //  must sort by time for mirrored strokes to sync up!
  .sort( function( a, b ){
    return a.time - b.time;
  });

  const toDelete = [];
  deletes.forEach( function( { deleteId, time } = {} ){
    controlPointsById( timeMap, deleteId ).forEach( function( cp ){
      cp.deletion = time;
      toDelete.push( cp );
    });
  });

  let shouldCastShadow = true;

  const materialsettings = {
    map: textureLoader.load( brush.texture ),
    transparent: true,
    depthTest: true,
    depthWrite: true,
    // side: THREE.BackSide,
    // side: THREE.DoubleSide,
    wireframe: false,
    vertexColors: THREE.FaceColors
  };

  const baseMaterial = new THREE.MeshPhongMaterial( materialsettings );


  let frontMaterial = baseMaterial.clone();

  if( brush.material === 'Additive' ){
    frontMaterial = new THREE.MeshBasicMaterial( materialsettings );
    frontMaterial.blending = THREE.AdditiveBlending;
    shouldCastShadow = false;
  }

  frontMaterial.side = brush.backface ? THREE.FrontSide : THREE.DoubleSide;

  frontMaterial.ssao = brush.ssao;
  frontMaterial.glow = brush.glow;

  frontMaterial.alphaTest = 0.5;
  frontMaterial.vertexColors = THREE.FaceColors;

  const mesh = new THREE.Mesh( merged, frontMaterial );
  mesh.castShadow = shouldCastShadow;
  // mesh.receiveShadow = true;



  let seekIndex = 0;
  let deleteIndex = 0;
  function clear(){
    seekIndex = 0;
    deleteIndex = 0;
    timeMap.forEach( hideVertices );
    merged.verticesNeedUpdate = true;
  }

  function revealTo( curTime ){


    let current = timeMap[ seekIndex ];

    while( current && current.time < curTime && seekIndex<timeMap.length ){
      const { positions, verts } = current;
      revealVertices( verts, positions );
      seekIndex++;
      current = timeMap[ seekIndex ];
    }


    let deleteCP = toDelete[ deleteIndex ];
    while( deleteCP && deleteCP.deletion <= curTime && deleteIndex<toDelete.length ){
      const { deletion } = deleteCP;
      if( deletion <= curTime ){
        hideVertices( deleteCP );
      }
      deleteIndex++;
      deleteCP = toDelete[ deleteIndex ];
    }


    merged.verticesNeedUpdate = true;
  }

  return {
    mesh, startTime, endTime, revealTo, clear
  };
}

function hideVertices( { verts } ){
  verts.forEach( function( v ){
    v.set(0,0,0);
  });
}

function revealVertices( vertices, positions ){
  vertices.forEach( function( v, index ){
    v.copy( positions[ index ] );
  });
}

const convertAction = R.curry( function( brush, actionRaw ){

  if( actionRaw.type === 'DELETE' ){
    const action = {
      time: actionRaw.time,
      type: actionRaw.type
    };
    action.deleteId = actionRaw.data.strokeID;
    action.time = actionRaw.time;

    return [ action ];
  }

  if( actionRaw.type === 'STROKE' ){

    const strokeData = actionRaw.data;

    const actions = strokeData.points.map( function( stroke, index ){
      const action = {
        time: actionRaw.time,
        type: actionRaw.type,
        strokeId: strokeData.id
      };

      action.controlPoints = stroke.map( function( point ){
        const result = ThreeJSVec3FromTiltbrushData( point.pos[ 0 ] );
        result.quat = ThreeJSQuaternionFromTiltbrushData( point.pos[ 1 ] );
        result.time = point.t;
        return result;
      });

      action.timeRange = {
        start: strokeData.points[ 0 ][ 0 ].t,
        end: strokeData.points[ strokeData.points.length-1 ][ strokeData.points[strokeData.points.length-1].length-1 ].t,
      };

      action.brush = brush;
      action.brushSize = strokeData.b_size;
      action.useAtlas = brush.textureatlas;
      action.atlasIndex = Math.floor( Math.random() * 4.0 );

      const colorArray = strokeData.color;
      action.brushColor = new THREE.Color( colorArray[ 0 ], colorArray[ 1 ], colorArray[ 2 ] );

      action.existence = {
        start: action.timeRange.start,
        end: Number.MAX_VALUE
      };

      return action;
    });

    return actions;

  }

});

function pathToLine( pathVertices ){
  const geometry = new THREE.Geometry();
  geometry.vertices = pathVertices;

  const material = new THREE.LineBasicMaterial({color:0x0000ff});
  return new THREE.Line( geometry, material );
}

function pathsToPoints( paths ){
  const allGeo = paths.reduce( function( pathGeos, path ){
    const pathGeo = path.reduce( function( pointGeos, vertex ){
      const sphereGeo = new THREE.SphereGeometry( 0.1, 3, 3 );
      sphereGeo.applyMatrix( new THREE.Matrix4().makeTranslation( vertex.x, vertex.y, vertex.z ) );
      pointGeos.merge( sphereGeo );
      return pointGeos;
    }, new THREE.Geometry() );

    pathGeos.merge( pathGeo );
    return pathGeos;
  }, new THREE.Geometry() );
  const mat = new THREE.MeshBasicMaterial({color:0xffffff, wireframe: true});
  return new THREE.Mesh( allGeo, mat );
}

function pathsToAxis( paths ){
  return paths.reduce( function( g, path ){

    const axis = path.map( function( vertex, index ){
      const ax = new THREE.AxisHelper(4 + index * 0.2);
      ax.position.copy( vertex );
      ax.quaternion.copy( vertex.quat );
      return ax;
    });

    g.add( ... axis );
    return g;
  }, new THREE.Group() );
}

function negate( vec3 ){
  return vec3.clone().negate();
}

function actionToQuads( action ){

  const { controlPoints: path, brushSize, brushColor, useAtlas, atlasIndex, brush } = action;

  const useBackFace = brush.backface;

  const merged = new THREE.Geometry();
  let preferredRight = new THREE.Vector3();
  const previousVertex = new THREE.Vector3().copy( path[ 0 ] );
  let vertIndex = 0;
  let quadCount = 0;
  const quadVerts = [];
  const quadNormals = [];
  const quadBackNormals = [];
  const quadUVs = [];
  const timeMapping = [];

  const facing = new THREE.Vector3();
  path.forEach( function( vertex ){
    const orientation = vertex.quat;
    facing.set( 0,0,0 ).subVectors( vertex, previousVertex );
    const moveLength = facing.length();
    facing.divideScalar( moveLength );

    if( moveLength < 1.0 ){
      return;
    }

    const { newRight, normal } = computeSurfaceFrame( preferredRight, facing, orientation );

    const backNormal = normal.clone().negate();

    const quadCenter = vertex.clone().add( previousVertex ).multiplyScalar( 0.5 );
    const quadForward = facing.clone().multiplyScalar( moveLength * 0.5 );
    const quadRight = newRight.clone().multiplyScalar( brushSize * TILTBRUSH_SCALE * 0.5 );

    const verts = generateQuadVerts( quadCenter, quadForward, quadRight );
    const normals = [ normal.clone(), normal.clone(), normal.clone(), normal.clone(), normal.clone(), normal.clone() ];
    const backNormals = [ backNormal.clone(), backNormal.clone(), backNormal.clone(), backNormal.clone(), backNormal.clone(), backNormal.clone() ];
    const uvs = [ new THREE.Vector2( 0,0 ), new THREE.Vector2( 0,0 ), new THREE.Vector2( 0,0 ), new THREE.Vector2( 0,0 ), new THREE.Vector2( 0,0 ), new THREE.Vector2( 0,0 ) ];
    quadVerts.push( verts );
    quadNormals.push( normals );
    quadUVs.push( uvs );

    if( useBackFace ){
      quadBackNormals.push( backNormals );
      quadUVs.push( uvs );
    }

    merged.vertices.push( ...verts );

    const faceA = new THREE.Face3( vertIndex, vertIndex + 1, vertIndex + 2, normals.slice( 0, 3 ), brushColor );
    const faceB = new THREE.Face3( vertIndex + 3, vertIndex + 4, vertIndex + 5, normals.slice( 3, 6 ), brushColor );
    merged.faces.push( faceA );
    merged.faces.push( faceB );

    const backFaceA = new THREE.Face3( vertIndex + 2, vertIndex + 1, vertIndex, backNormals.slice( 0, 3 ), brushColor );
    const backFaceB = new THREE.Face3( vertIndex + 5, vertIndex + 4, vertIndex + 3, backNormals.slice( 3, 6 ), brushColor );
    if( useBackFace ){
      merged.faces.push( backFaceA );
      merged.faces.push( backFaceB );
      reverseNormals( backFaceA.vertexNormals );
      reverseNormals( backFaceB.vertexNormals );
    }

    vertIndex += 6;

    if( quadCount > 1 ){

      const lastQuad = quadVerts[ quadCount - 2 ];
      const currQuad = quadVerts[ quadCount - 1 ];
      const nextQuad = verts;

      for( let i=0; i<6; i++ ){
        currQuad[ i ].copy( lastQuad[ i ].clone().add( nextQuad[ i ] ) ).multiplyScalar( 0.5 );
      }

      fuseQuads( lastQuad, currQuad );
      fuseQuads( currQuad, nextQuad );

      const lastNormals = quadNormals[ quadCount - 2 ];
      const currNormals = quadNormals[ quadCount - 1 ];
      const nextNormals = normals;

      averageSharedEdgeQuadNormals( lastNormals, currNormals );
      averageSharedEdgeQuadNormals( currNormals, nextNormals );

      if( useBackFace ){
        const lastBackNormals = quadBackNormals[ quadCount - 2 ];
        const currBackNormals = quadBackNormals[ quadCount - 1 ];
        const nextBackNormals = backNormals;

        averageSharedEdgeQuadNormals( lastBackNormals, currBackNormals );
        averageSharedEdgeQuadNormals( currBackNormals, nextBackNormals );
      }
    }

    //  save to time mapping
    timeMapping.push( {
      time: vertex.time,
      deletion: action.existence.end,
      verts: verts,
      id: action.strokeId
    });

    preferredRight.copy( newRight.normalize() );
    previousVertex.copy( vertex );
    quadCount++;
  });

  updateUVs( quadVerts, quadUVs, useAtlas, atlasIndex );

  //  update time mapping once more to capture results from smoothing
  timeMapping.forEach( function( m ){
    m.positions = m.verts.map( ( v ) => v.clone() );
  });


  const collectedUvs = [];
  quadUVs.forEach( function( uvset ){
    collectedUvs.push( uvset.slice( 0, 3 ) );
    collectedUvs.push( uvset.slice( 3, 6 ) );
  });
  merged.faceVertexUvs = [ collectedUvs ];

  return {
    geometry: merged,
    mapping: timeMapping
  };
}

function reverseNormals( vertexNormals ){
  const tempN = vertexNormals[ 0 ];
  vertexNormals[ 0 ] = vertexNormals[ 2 ];
  vertexNormals[ 2 ] = tempN;
}

function reverseWinding( geometry ){
  geometry.faces.forEach( function( face ){
    const temp = face.a;
    face.a = face.c;
    face.c = temp;
    face.vertexNormals.forEach( function( normal ){
      normal.negate();
    });
    face.normal.negate();
    const tempN = face.vertexNormals[ 0 ];
    face.vertexNormals[ 0 ] = face.vertexNormals[ 2 ];
    face.vertexNormals[ 2 ] = tempN;
  });

  // geometry.computeVertexNormals();
  // geometry.computeFaceNormals();

  const faceVertexUvs = geometry.faceVertexUvs[ 0 ];
  faceVertexUvs.forEach( function( uvs ){
    const temp = uvs[ 0 ];
    uvs[ 0 ] = uvs[ 2 ];
    uvs[ 2 ] = temp;
  });
  return geometry;
}

const V_UP = new THREE.Vector3( 0, 1, 0 );
const V_FORWARD = new THREE.Vector3( 0, 0, 1 );

function computeSurfaceFrame( previousRight, moveVector, orientation ){
  const pointerF = V_FORWARD.clone().applyQuaternion( orientation );

  const pointerU = V_UP.clone().applyQuaternion( orientation );

  const crossF = pointerF.clone().cross( moveVector );
  const crossU = pointerU.clone().cross( moveVector );

  const right1 = inDirectionOf( previousRight, crossF );
  const right2 = inDirectionOf( previousRight, crossU );

  right2.multiplyScalar( Math.abs( pointerF.dot( moveVector ) ) );

  const newRight = ( right1.clone().add( right2 ) ).normalize();
  const normal = moveVector.clone().cross( newRight );
  return { newRight, normal };
}

function inDirectionOf( desired, v ){
  return v.dot( desired ) >= 0 ? v.clone() : v.clone().multiplyScalar(-1);
}

function generateQuadVerts( center, forward, right ){
  const verts = [];
  verts.push( center.clone().sub( forward ).sub( right ) );
  verts.push( center.clone().add( forward ).sub( right ) );
  verts.push( center.clone().sub( forward ).add( right ) );
  verts.push( center.clone().sub( forward ).add( right ) );
  verts.push( center.clone().add( forward ).sub( right ) );
  verts.push( center.clone().add( forward ).add( right ) );
  return verts;
}

function getMirroredQuadVertsByReference( frontVerts ){
  const verts = [];
  verts.push( frontVerts[ 0 ] );
  verts.push( frontVerts[ 2 ] );
  verts.push( frontVerts[ 1 ] );
  verts.push( frontVerts[ 3 ] );
  verts.push( frontVerts[ 5 ] );
  verts.push( frontVerts[ 4 ] );
  return verts;
}

function fuseQuads( lastVerts, nextVerts) {
  const vTopPos = lastVerts[1].clone().add( nextVerts[0] ).multiplyScalar( 0.5 );
  const vBottomPos = lastVerts[5].clone().add( nextVerts[2] ).multiplyScalar( 0.5 );

  lastVerts[1].copy( vTopPos );
  lastVerts[4].copy( vTopPos );
  lastVerts[5].copy( vBottomPos );
  nextVerts[0].copy( vTopPos );
  nextVerts[2].copy( vBottomPos );
  nextVerts[3].copy( vBottomPos );
}

function averageSharedEdgeQuadNormals( lastNormals, nextNormals ){
  const vNormalAvg = lastNormals[ 1 ].clone().add( nextNormals[ 0 ] ).multiplyScalar( 0.5 );
  vNormalAvg.normalize();

  lastNormals[ 1 ].copy( vNormalAvg );
  lastNormals[ 4 ].copy( vNormalAvg );
  lastNormals[ 5 ].copy( vNormalAvg );

  nextNormals[ 0 ].copy( vNormalAvg );
  nextNormals[ 2 ].copy( vNormalAvg );
  nextNormals[ 3 ].copy( vNormalAvg );
}

function updateUVsForSegment( quadVerts, quadUVs, quadLengths, useAtlas, atlasIndex ) {
  let fYStart = 0.0;
  let fYEnd = 1.0;

  if( useAtlas ){
    const fYWidth = 1.0 / TEXTURES_IN_ATLAS;
    fYStart = fYWidth * atlasIndex;
    fYEnd = fYWidth * (atlasIndex + 1.0);
  }

  //get length of current segment
  const totalLength = quadLengths.reduce( function( total, length ){
    return total + length;
  }, 0 );

  //then, run back through the last segment and update our UVs
  let currentLength = 0.0;
  quadUVs.forEach( function( uvs, index ){
    const segmentLength = quadLengths[ index ];
    const fXStart = currentLength / totalLength;
    const fXEnd = ( currentLength + segmentLength ) / totalLength;
    currentLength += segmentLength;

    uvs[ 0 ].set( fXStart, fYStart );
    uvs[ 1 ].set( fXEnd, fYStart );
    uvs[ 2 ].set( fXStart, fYEnd );
    uvs[ 3 ].set( fXStart, fYEnd );
    uvs[ 4 ].set( fXEnd, fYStart );
    uvs[ 5 ].set( fXEnd, fYEnd );

  });

  // Update tangent space
  // ComputeTangentSpaceForQuads(
  //     rMasterBrush.m_Vertices,
  //     rMasterBrush.m_UVs,
  //     rMasterBrush.m_Normals,
  //     rMasterBrush.m_Tangents,
  //     quadsPerSolid * 6,
  //     iSegmentBack * 6,
  //     iSegmentFront * 6);

}

function quadLength( quadVerts ) {
  const fTopLength = quadVerts[ 0 ].distanceTo( quadVerts[ 1 ] );
  const fBottomLength = quadVerts[ 3 ].distanceTo( quadVerts[ 5 ] );
  return (fTopLength + fBottomLength) * 0.5;
}

function updateUVs( quadVerts, quadUVs, useAtlas, atlasIndex ) {
  const quadLengths = quadVerts.map( quadLength );
  updateUVsForSegment( quadVerts, quadUVs, quadLengths, useAtlas, atlasIndex );
}
