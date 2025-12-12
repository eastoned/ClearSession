import * as THREE from 'three';
import { loadModel } from './loadModel.js';
import {roadMat, dashedShapeMaterial, groundMat, dotMaterial, yellow } from './materials.js';
import {drawSign, drawQuad, drawRoad, drawSphere, drawTriangleSign, loadSign } from './shapes.js';
import { renderer, cameraMain, cameraControls, toggleCameraControls} from './camera.js';
import {MathUtils} from 'three';
import { interactionManager, toggleScenePerspective, toggled } from './interaction.js';

import {Text} from 'troika-three-text';
import {preloadFont} from 'troika-three-text';

import Papa from 'papaparse';
import data from '/maps/data3.json' with { type: 'json' };

window.onload = () => loadScene();

function loadScene() {

    //scene setup
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const color = 0x8888ff;  // blue
    let near = 250;
    let far = 800;
    scene.background = new THREE.Color(color);
    ///scene.fog = new THREE.Fog(color, near, far);

    const directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
    directionalLight.castShadow = true;
    directionalLight.target.position.x = 20;
    directionalLight.target.position.y = 20;
    directionalLight.target.position.z = -20;

    scene.add(directionalLight);
    scene.add(directionalLight.target);

    const planeGeo = new THREE.PlaneGeometry();
    
    var dataID; //gets icon information from csv file
    let modelPaths = {};

    const obj = data;
    cameraControls.setLookAt(0, 0, 250, 0, 0, 0);

    const ground = new THREE.Mesh(planeGeo, groundMat);

    ground.name = "ground";
    ground.scale.x = 5000;
    ground.scale.y = 5000;
    scene.add(ground);

    const nodePos = {};
    let sources = {};

    function getTimeDifference(dest){
        let timeMul = obj.nodes.find(item => item.key === dest);
        let expireTime;
        
        expireTime = timeMul.attributes.content.date.quantity;
        
        switch(timeMul.attributes.content.date.timespan){
            case "days":
                expireTime *= 1;
            break;
            case "months":
                expireTime *= 30;
            break;
            case "years":
                expireTime *= 365;
            break;
        }

        let days = expireTime;
        return days;
    }
    const light = new THREE.AmbientLight( 0x00ffff ); // soft white light
    scene.add( light );

    function drawTimeline() {
        let startingGroup = new THREE.Group();
        startingGroup.name = "hello";
        const hereText = new Text();
        hereText.color = 0xFFFF00;
        hereText.fontSize = 4;
        hereText.font = 'assets/fonts/Highwaygothicd-KV5Dp.otf';
        hereText.text = "You are here.";
        hereText.anchorX = 'right';
        hereText.anchorY = 'middle';
        hereText.sync();
        hereText.position.x = -14;
        hereText.position.z = 1;
        startingGroup.add(hereText);
        
        
        drawQuad(-14, -0.25, 12, 0.5, yellow, startingGroup, 1);
        drawSphere(0, 0, 1, 3, scene, yellow, false);
        scene.add(startingGroup);
        let level = getTimeDifference(obj.edges[0].source)*3;
        loadSign(obj.edges[0].source, dataID, obj, nodePos, scene, 0, level/2);
        for(let i = 0; i < obj.edges.length; i++) {
            
            const src = obj.edges[i].source;
            const dest = obj.edges[i].target;

            let childCount = 0;
            for(let x = 0; x < obj.edges.length; x++) {
                if(src == obj.edges[x].source){
                    childCount += 1;
                }
            }


            if(!(src in nodePos)) {
                nodePos[src] = new THREE.Vector2(level, 0);
                sources[src] = 1;

                //draws distance between single node
                if(!(dest in nodePos))  {
                    //draw with time difference
                    //nodePos[dest] = new THREE.Vector2(level + getTimeDifference(src, dest)/2, 0);
                    
                    nodePos[dest] = new THREE.Vector2(level + getTimeDifference(dest)*3, 0);
                    sources[dest] = 0;
                }
                
                level += 1;
                
            }   else    {
                sources[src] += 1;
                if(!(dest in nodePos))  {
                    //draws spaced shape
                    nodePos[dest] = new THREE.Vector2(nodePos[src].x + getTimeDifference(dest)*3, (sources[src]-1.5) * 900);
                }
                
            }
            drawRoad(src, dest, sources[src], childCount, nodePos, scene, roadMat, dataID, obj);
        }


        //draw spheres at positions
        for (const [key, value] of Object.entries(nodePos)) {
            
            if(key in modelPaths)
            {
                //draws all models to scene
                loadModel(modelPaths[key], nodePos[key].y + 34, nodePos[key].x, 8, 5, scene);
                
            }

            //loadSign(key, dataID, obj, nodePos, scene);
            drawSphere(value.y, value.x, 0, 3, scene);
            
        }
    }

    //Read matching 3D models to data key
    Papa.parse('assets/data/iconData.csv', {
        header: true,
        download: true,
        dynamicTyping: true,
        complete: function(results) {

            dataID = results.data;
            
            for(let i = 0; i < dataID.length; i++){
                modelPaths[dataID[i].id.toString()] = dataID[i].icon.toString();
            }

            drawTimeline();
        }
    });



    function toggleTopDownView() {
        cameraControls.setLookAt(0, 0, 250, 0, 0, 0, true);
        toggleScenePerspective(false, scene);
    }


    

    var el = document.getElementById("ToggleButton");

    if(el.addEventListener)
            el.addEventListener("click", toggleTopDownView);
    else if(el.attachEvent)
        el.attachEvent('onclick', toggleTopDownView);

    var cameraCon = document.getElementById("CC");

    if(cameraCon.addEventListener)
            cameraCon.addEventListener("click", toggleCameraControls);

    toggleCameraControls();

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        if(toggled){
            scene.children.forEach(object => {
            
                if (object instanceof THREE.Object3D) {
                    if(object.name == "Scene"){
                            let time = Date.now() * 0.001;
                            object.rotation.y = -time * .25;
                        }
                    }
                    
            });
        }

        const delta = clock.getDelta();
        const hasControlsUpdated = cameraControls.update(delta);
        interactionManager.update();

        render();
    }

    window.addEventListener('resize', function () {
    cameraMain.aspect = window.innerWidth / window.innerHeight;
    cameraMain.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    });

    function render() {
        renderer.render(scene, cameraMain);
    }

    animate();
}