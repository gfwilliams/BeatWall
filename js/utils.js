var UTILS = {};

// Given an array of arrays of indices (representing line segments), join them all up into polygons
// return [[Vector2]] (puts actual vectors in, not indices)
function indicesToPolygons(indices, verts) {
  // rebuild a series of polygons
  var polys = [];
  var idx = indices.findIndex( el => el!==undefined );
  while (idx>=0) {
    var poly = [];
    var indexList = indices[idx];
    while (indexList!==undefined) {
      poly.push(verts[idx]);
      var vert = indexList.shift();
      if (!indexList.length) delete indices[idx];
      idx = vert;
      indexList = indices[idx];
    }
    polys.push(poly);
    idx = indices.findIndex( el => el!==undefined );
  }
  return polys;
}

// Projects a 3D mesh into world coordinates and pulls out a list of 2D polygons ([[Vector2]]) from XY
UTILS.meshToPolygon = function(mesh) {
  var geometry = mesh.geometry;
  // convert positions
  var pos = geometry.getAttribute('position').array;
  var verts = new Array(pos.length/3);
  var n=0;
  for (var i=0;i<verts.length;i++) {
    var v = new THREE.Vector3(pos[n++],pos[n++],pos[n++]);
    mesh.localToWorld(v);
    verts[i] = new THREE.Vector2(v.x,v.y);
  }
  // iterate over tris - build up a
  // list of bounding sides in indices
  var tris = geometry.index.array;
  var indices = [];
  function addIndex(a,b) {
    var idx = (indices[b]===undefined) ? -1 : indices[b].indexOf(a);
    if (idx>=0) {
      if (indices[b].length==1) delete indices[b];
      else indices[b].splice(idx,1); // remove element
    } else {
      if (indices[a]===undefined) indices[a]=[b];
      else indices[a].push(b);
    }
  }
  var i=0;
  while (i<tris.length) {
    var ai=tris[i++],bi=tris[i++],ci=tris[i++]; // indices
    var a=verts[ai],b=verts[bi],c=verts[ci]; // vertices
    // work out cross product to see which way we're pointing
    var ax=a.x-b.x, ay=a.y-b.y;
    var bx=a.x-c.x, by=a.y-c.y;
    var cz=ax*by - ay*bx;
    if (cz<=0) continue; // ignore any backwards or sideways triangles
    addIndex(ai,bi);
    addIndex(bi,ci);
    addIndex(ci,ai);
  }
  return indicesToPolygons(indices, verts);
}


// Projects a 3D mesh into world coordinates and intersect with an XY plane at zValue - return the intersection points
UTILS.meshIntersectVertices = function(mesh, zValue) {
  var geometry = mesh.geometry;
  // convert positions
  var pos = geometry.getAttribute('position').array;
  var verts = new Array(pos.length/3);
  var n=0;
  for (var i=0;i<verts.length;i++) {
    var v = new THREE.Vector3(pos[n++],pos[n++],pos[n++]);
    mesh.localToWorld(v);
    verts[i] = v;
  }
  // iterate over tris
  var tris = geometry.index.array;
  var intersections = [];
  function intersect(a,b) {
    if (a.z<zValue && b.z>zValue) {
      // ignore intersections the other way so
      // we don't end up with duplicates - since this is
      // a closed mesh we're good.
      var l = b.z - a.z;
      var amt = (zValue-a.z)/l, namt=1-amt;
      intersections.push(new THREE.Vector2(
        namt*a.x + amt*b.x,
        namt*a.y + amt*b.y
      ));
    }
  }
  var i=0;
  while (i<tris.length) {
    var ai=tris[i++],bi=tris[i++],ci=tris[i++]; // indices
    var a=verts[ai],b=verts[bi],c=verts[ci]; // vertices
    intersect(a,b);
    intersect(b,c);
    intersect(c,a);
  }
  return intersections;
}


  var geometry = new THREE.BoxBufferGeometry( 0.15, 0.15, 0.45 );
  var mesh = new THREE.Mesh( geometry, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );
  console.log(UTILS.meshToPolygon(mesh));
  console.log(UTILS.meshIntersectVertices(mesh, 0));
