import * as THREE from 'three';
import {MathUtils} from 'three';
import { MeshLineGeometry, MeshLineMaterial, raycast } from 'meshline';
import JEASINGS, { JEasing, Linear } from 'jeasings';
import {Text} from 'troika-three-text';
import {preloadFont} from 'troika-three-text'
import { InteractionManager } from 'three.interactive';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import CameraControls from 'camera-controls';
import Papa from 'papaparse';
import 'three-hex-tiling';
import { UVsDebug } from 'three/addons/utils/UVsDebug.js';

//
///https://3d.nih.gov/discover?sort=date_desc

CameraControls.install( { THREE: THREE } );

const loader = new GLTFLoader();


//Create scene with no node/medical elements

const grass_tex = new THREE.TextureLoader().load(
    "grass.jpg"
);

const road_tex = new THREE.TextureLoader().load(
    "asphalt.jpg"
);

road_tex.wrapT = THREE.RepeatWrapping;
road_tex.wrapS = THREE.RepeatWrapping;

road_tex.repeat.set(3, 5);


grass_tex.wrapS = THREE.RepeatWrapping;
grass_tex.wrapT = THREE.RepeatWrapping;

grass_tex.repeat.set(800, 800);

const scene = new THREE.Scene();
const color = 0x8888ff;  // blue
let near = 250;
let far = 500;
scene.background = new THREE.Color(color);
scene.fog = new THREE.Fog(color, near, far);

const camera = new THREE.PerspectiveCamera(50, window.innerWidth/window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer();

const clock = new THREE.Clock();
const cameraControls = new CameraControls(camera, renderer.domElement);

const interactionManager = new InteractionManager(
  renderer,
  camera,
  renderer.domElement
);

renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);

const directionalLight = new THREE.DirectionalLight( 0xffffff, 3 );
directionalLight.castShadow = true;
directionalLight.target.position.x = 20;
directionalLight.target.position.y = 20;
directionalLight.target.position.z = -20;
scene.add(directionalLight);
scene.add(directionalLight.target);
const sphereGeo = new THREE.SphereGeometry();

const planeGeo = new THREE.PlaneGeometry();

const dotMaterial = new THREE.MeshBasicMaterial({color:0xffffff, transparent: true, opacity: 0.3});
const flatMaterial = new THREE.MeshToonMaterial({color:0xffffff, side:THREE.BackSide});

var dataID;
let modelPaths = {};

import data from '/data3.json' assert { type: 'json' };

const obj = data;
cameraControls.setLookAt(0, 0, 250, 0, 0, 0);
//cameraControls.setLookAt(0, 0, 2500, 0, 0, 0);
//camera.up.set(1, 0, 0);
//cameraControls.updateCameraUp();

//const sky = new THREE.Mesh(sphereGeo, flatMaterial);
//sky.name = "sky";
//scene.add(sky);

const groundMat = new THREE.MeshStandardMaterial({
    map: grass_tex,
    hexTiling: {
        patchScale: 3,
        useContrastCorrectedBlending: true,
        lookupSkipThreshold: 0.01,
        textureSampleCoefficientExponent: 8,
    }
});

const roadMat = new THREE.ShaderMaterial( {
	map: road_tex,
    hexTiling: {
        patchScale: 3,
        useContrastCorrectedBlending: true,
        lookupSkipThreshold: 0.01,
        textureSampleCoefficientExponent: 8,
    }
} );

const ground = new THREE.Mesh(planeGeo, groundMat);

ground.name = "ground";
ground.scale.x = 3000;
ground.scale.y = 5000;
scene.add(ground);


function drawSphere(x = 0, y = 0, z = 0, size = 20, mat = dotMaterial)
{
    const sphereObj = new THREE.Mesh(sphereGeo, mat);
    sphereObj.name = "sphere";
    sphereObj.scale.set(size, size, 1);
    sphereObj.position.set(x,y,z);
    scene.add(sphereObj);

    sphereObj.addEventListener('mouseover', (event) => {
            event.target.scale.set(size + 1, size + 1, 1);
        });

        sphereObj.addEventListener('mouseout', (event) => {
            event.target.scale.set(size, size, 1);
        });

        sphereObj.addEventListener('click', (event) => {
            moveCam(x, y, 0, 0, -50, 20);
        });

    interactionManager.add(sphereObj);
}

let currentTime = new Date();

const nodePos = {};
let sources = {};

function getTimeDifference(src, dest){
    let timeStart = obj.nodes.find(item => item.key === src);
    let timeMul = obj.nodes.find(item => item.key === dest);
    let expireTime = new Date(timeMul.attributes.content.date.timestamp);
    let days = (expireTime - new Date(timeStart.attributes.content.date.timestamp)) / (1000 * 60 * 60 * 24);
    return days;
}

function drawSign(curveSize, xPos, yPos, width, height, mat, group, amount, offset){
    const shape = new THREE.Shape();
    //bottom left
    
    shape.moveTo(curveSize, 0);
    shape.lineTo(curveSize + width, 0);
    shape.bezierCurveTo(width + (curveSize*2), 0, width + (curveSize*2), 0, width + (curveSize*2), curveSize);
    shape.lineTo(width + (curveSize*2), curveSize + height);
    shape.bezierCurveTo(width + (curveSize*2), height + (curveSize*2), width + (curveSize*2), height + (curveSize*2), curveSize + width, height + (curveSize*2));
    shape.lineTo(curveSize, height + (curveSize*2));
    shape.bezierCurveTo(0, height + (curveSize*2), 0, height + (curveSize*2), 0, height + curveSize);
    shape.lineTo(0, curveSize);
    shape.bezierCurveTo(0, 0, 0, 0, curveSize, 0);

    const extrudeSettings = {
        steps: 0,
        depth: 0,
        bevelEnabled: false,
        bevelThickness: 0,
        bevelSize: 0,
        bevelOffset: 0,
        bevelSegments: 0,
        UVGenerator: uvGenerator,
    };

    const signGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings); 
    
    const signMesh = new THREE.Mesh(signGeo, mat);
    signMesh.position.x = xPos;
    signMesh.position.y = yPos;
    signMesh.position.z = offset;
    group.add(signMesh);
}

function loadSign(key){
    let name = dataID.find(item => item.id === key);
    let date = obj.nodes.find(item => item.key === key);
    let expireTime = new Date(date.attributes.content.date.timestamp);

    const nameLength = name.nameEn.length;
    const dateLength = expireTime.toDateString().length;

    const width = Math.max(nameLength, dateLength);
    //console.log(name.nameEn.length);

    let signGroup = new THREE.Group();
    const signMat = new THREE.MeshBasicMaterial({color:0x01735C});
    drawSign(1, 0, 0, 50, 14, signMat, signGroup, 1, -.1);
    const white = new THREE.MeshBasicMaterial({color:0xffffff});
    drawSign(1, 1, 1, 48, 12, white, signGroup, 1, 0);
    drawSign(1, 1.5, 1.5, 47, 11, signMat, signGroup, 1, 0.1);
    
    signGroup.name = "Sign" + name.nameEn;

    //loadModel("Sign", nodePos[key].y + 20, nodePos[key].x-3, 1, false, 5);
    const myText = new Text();
    
            
    myText.fontSize = 4;
    myText.font = 'Highwaygothicd-KV5Dp.otf';
    myText.text = name.nameEn + "\n" + expireTime.toDateString();
    
    myText.color = 0xFFFFFF;
    myText.anchorX = 'middle';
    myText.anchorY = 'middle';
    myText.position.x = 3;
    myText.position.y = 8;
    myText.rotation.z = Math.PI/180;
    myText.position.z = 1.2;
    signGroup.add(myText);
    signGroup.position.x = nodePos[key].y + 8;
    signGroup.position.y = nodePos[key].x;
    signGroup.position.z = 8;
    scene.add(signGroup);
    
    
    myText.sync();
    var box = new THREE.Box3().setFromObject( myText );
    console.log(box);
    
}

//draws model to the scene
function loadModel(modelName, x, y, z, highlightable = true, scale = 3, group)
{

    loader.load('/' + modelName + '.glb', function(gltf) {
    const modelOriginal = gltf.scene;
    
    modelOriginal.scale.set(scale, scale, scale);
    modelOriginal.position.set(x,y,z);
    modelOriginal.traverse((mod) => {
        //mod.layers.set(5);
    if (mod.isMesh) {
      // Replace the material with MeshBasicMaterial for unlit effect
      mod.material = new THREE.MeshToonMaterial({
        vertexColors: true, // Retain the texture if it exists
      });
    }
  });

   
  if(highlightable){
    modelOriginal.addEventListener('mouseover', (event) => {
                event.target.scale.set(3 + 1, 3 + 1, 3 + 1);
            });

            modelOriginal.addEventListener('mouseout', (event) => {
                event.target.scale.set(3, 3, 3);
            });

            modelOriginal.addEventListener('click', (event) => {
                moveCam(x, y, 0, 0, -50, 30);
            });

        interactionManager.add(modelOriginal);
    }

    if(group){
        group.add(modelOriginal);
    }else{
        scene.add(modelOriginal);
    }    

}, undefined, function ( error ) {

  console.error( error );

} );
}


const lineMat = new THREE.MeshBasicMaterial({map:road_tex});

var uvGenerator =  {
    generateTopUV:  function(geometry, vertices, idxA, idxB, idxC) {
                        var ax, ay, bx, by, cx, cy;

            return([
                new THREE.Vector2(0, 0),
                new THREE.Vector2(1, 0),
                new THREE.Vector2(1, 1),
                new THREE.Vector2(0, 1),
            ]);
    },
    generateSideWallUV: function(geometry, vertices, idxA, idxB, idxC, idxD) {
        return([
            new THREE.Vector2(0, 0),
            new THREE.Vector2(1, 0),
            new THREE.Vector2(1, 1),
            new THREE.Vector2(0, 1),
        ]);
}
}

function drawRoad(start, end, sourceCount, childCount){

    const shape = new THREE.Shape();

    const extrudeSettings = {
        steps: 0,
        depth: 0,
        bevelEnabled: false,
        bevelThickness: 0,
        bevelSize: 0,
        bevelOffset: 0,
        bevelSegments: 0,
        UVGenerator: uvGenerator,
    };

    if(childCount < 2){
        //bottom left
        shape.moveTo(nodePos[start].y-12, nodePos[start].x);

        //bottom right
        shape.lineTo(nodePos[start].y+12, nodePos[start].x);

        //top right
        shape.lineTo(nodePos[end].y+12, nodePos[end].x);

        //top left
        shape.lineTo(nodePos[end].y-12, nodePos[end].x);
    }else{
        //bottom left
        shape.moveTo(nodePos[start].y-12 + sourceCount*24 - 36, nodePos[start].x+15);

        //bottom right
        shape.lineTo(nodePos[start].y+12 + sourceCount*24 - 36, nodePos[start].x+15);

        //top right
        shape.lineTo(nodePos[end].y+12, nodePos[end].x);

        //top left
        shape.lineTo(nodePos[end].y-12, nodePos[end].x);

        const fillerShape = new THREE.Shape();

        //bottom left
        fillerShape.moveTo(nodePos[start].y-12 + sourceCount*24 - 36, nodePos[start].x+15);

        //bottom right
        fillerShape.lineTo(nodePos[start].y+12 + sourceCount*24 - 36, nodePos[start].x+15);

        //bottom left
        fillerShape.moveTo(nodePos[start].y + 6 + sourceCount * 12 - 18, nodePos[start].x);

        //bottom right
        fillerShape.lineTo(nodePos[start].y - 6 + sourceCount * 12 - 18, nodePos[start].x);

        const fillerGeo = new THREE.ExtrudeGeometry(fillerShape, extrudeSettings);
        const fillMat = new THREE.MeshBasicMaterial({color:0xff0000});
        const fillerMesh = new THREE.Mesh(fillerGeo, lineMat);
        fillerMesh.position.z = .5;
        scene.add(fillerMesh);
    }

    const lineGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const lineMesh = new THREE.Mesh(lineGeo, lineMat);
    lineMesh.position.z = .5;

    scene.add(lineMesh);
    

    const tex = new THREE.TextureLoader().load('tree_tex.png');
    const spriteMat = new THREE.SpriteMaterial({map: tex, transparent: false, alphaHash: true, alphaTest: 0.9});

    for(let i = 0; i < 50; i++) {
        const sprite = new THREE.Sprite(spriteMat);
        const scale = (Math.random() * 10) + 20; 
        sprite.scale.set(scale, scale, scale);
        if(Math.random() < 0.5){
            sprite.position.set(nodePos[end].y + Math.random() * 200 + 26, MathUtils.lerp(nodePos[start].x, nodePos[end].x, Math.random()), scale/2);
        }else{
            sprite.position.set(nodePos[end].y - Math.random() * 200 - 26, MathUtils.lerp(nodePos[start].x, nodePos[end].x, Math.random()), scale/2);

        }
        
        //scene.add(sprite);
    }
    
}

function drawTimeline() {
    let level = 0;
    let boundsX = new THREE.Vector2(0,0);
    let boundsY = new THREE.Vector2(0,0);
    for(let i = 0; i < obj.edges.length; i++) {
        
        const src = obj.edges[i].source;
        const dest = obj.edges[i].target;

        let childCount = 0;
        for(let x = 0; x < obj.edges.length; x++) {
            if(src == obj.edges[x].source){
                childCount += 1;
            }
        }

        //add source's key to sources dictionary with position
        if(!(src in nodePos)) {
            //if source is not in targets it's the start
           // console.log("setting src: " + src);
            nodePos[src] = new THREE.Vector2(level, 0);
            sources[src] = 1;

            if(!(dest in nodePos))  {
                //console.log("setting early dest: " + dest);
                //console.log(childCount > 1);
                
                nodePos[dest] = new THREE.Vector2(level + getTimeDifference(src, dest)/5, 0);
                sources[dest] = 0;
            }
            
            level += 1;
            
        }   else    {
            sources[src] += 1;
            if(!(dest in nodePos))  {
                //get date time
                //console.log("setting late dest");


                nodePos[dest] = new THREE.Vector2(nodePos[src].x + getTimeDifference(src, dest)/4, sources[src]/childCount * 100 - 75);
            }
            
        }
        console.log(sources[src] + " : " + childCount);
        
        drawRoad(src, dest, sources[src], childCount);
    }


    //draw spheres at positions
    for (const [key, value] of Object.entries(nodePos)) {
        
        let name = dataID.find(item => item.id === key);
        //console.log(name.nameEn);
        
        if(key in modelPaths)
        {
            //console.log(modelPaths[key]);
            //draws all models to scene
            loadModel(modelPaths[key], nodePos[key].y - 20, nodePos[key].x-2, 6, false, 3);
            
            
            
            for(let i = 0; i < 1050; i++) {
                //loadModel("GrassBlades",nodePos[key].y + Math.random() * 200 - 100, nodePos[key].x + Math.random() * 200 - 100, 0, false, Math.random()*2 + 1);
            }
            
            
            
        }

        loadSign(key);

        drawSphere(value.y, value.x, .5, 5);
        
        //
    }

    console.log(boundsX);
    console.log(boundsY);

    

    //console.log(nodePos);

}
/*
GetRandomPositionOutOfBound(minX, maxX, minY, maxY, boundsX, boundsY)
{
    let posX = Math.random()*(maxX-minX) + minX;
    let posY = Math.random()*(maxY-minY) + minY;

    if((posX < boundsX.x || posX > boundsX.y) && (posY < boundsY.x || posY > boundsY.y)){
        return new THREE.Vector2(0, 0);
    }
    //return new THREE.Vector2(0,0);
}*/

//only draw timeline if we can retrieve the csv data
Papa.parse('/ID_Data.csv', {
  header: true,
  download: true,
  dynamicTyping: true,
  complete: function(results) {
    //console.log(results);
    dataID = results.data;
    //console.log(dataID);
    
    for(let i = 0; i < dataID.length; i++){
        modelPaths[dataID[i].id.toString()] = dataID[i].icon.toString();
    }
    drawTimeline();
  }
});

//drawTimeline();

var toggled = false;

function moveCam(xPos, yPos, zPos, offsetX = 0, offsetY = 0, offsetZ = 70) {
    cameraControls.setLookAt(xPos + offsetX, yPos + offsetY, zPos+offsetZ, xPos, yPos, 0, true);
    //camera.layers.enable(5);
    lineMat.linewidth = 10;
    toggled = true;
    //toggleCam();
    rotateText();
    //scene.fog = new THREE.Fog(color, 50, 200);
}

function toggleCam() {
    console.log("toggle");

    if(!toggled) {
            //scene.fog = new THREE.Fog(color, 0, 10);
    }else{
        cameraControls.setLookAt(0, 0, 250, 0, 0, 0, true);
        camera.layers.disable(5);
        lineMat.linewidth = 2;
        toggled = false;
        rotateText();
            //scene.fog = new THREE.Fog(color, near, far);

    }
}

function rotateText(){
    let counter = 0;
    scene.children.forEach(object => {
        
        

        if (object instanceof THREE.Object3D) {
            //console.log(object.name);
            //
            if(toggled){
                //3d model would have scene name
                if(object.name == "Scene"){
                    object.rotation.x = 90 * Math.PI/180;
                    object.rotation.y = -135 * Math.PI/180;
                    //object.rotation.z = 45 * Math.PI/180;
                }
            }
            else{
                if(object.name == "Scene"){
                    object.rotation.x = 0 * Math.PI/180;
                    object.rotation.y = 0 * Math.PI/180;
                }
                 
            }
            
        }

        if(object instanceof THREE.Group){
            console.log(object.name);
            if(object.name == "Scene") return;
            if(toggled){
                object.rotation.x = 90 * Math.PI/180;
                object.scale.set(0.6,0.6,0.6);
            }else{
                object.rotation.x = 0 * Math.PI/180;
                object.scale.set(1,1,1);
            }
        }
    });
}

var el = document.getElementById("ToggleButton");


if(el.addEventListener)
        el.addEventListener("click", toggleCam);
else if(el.attachEvent)
    el.attachEvent('onclick', toggleCam);

//toggle off camera controls
//cameraControls.mouseButtons.left = CameraControls.ACTION.NONE;
///cameraControls.mouseButtons.middle = CameraControls.ACTION.NONE;
//cameraControls.mouseButtons.right = CameraControls.ACTION.NONE;
//cameraControls.mouseButtons.wheel = CameraControls.ACTION.NONE;

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const hasControlsUpdated = cameraControls.update(delta);
    interactionManager.update();
    JEASINGS.update();

    render();
}

window.addEventListener('resize', function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function render() {
    renderer.render(scene, camera);
}

animate();