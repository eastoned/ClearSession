import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { MeshLine, MeshLineMaterial, MeshLineRaycast } from 'three.meshline';
import { cameraControls, focusPosition, focusTarget, moveCamera } from './camera.js';
import { interactionManager, toggleScenePerspective, toggled } from './interaction.js';
import { dotMaterial, yellow, crackMat, dashedShapeMaterial, distanceSignMaterial, distanceWhiteMaterial, distanceGreyMaterial,  } from './materials.js';
import {Text} from 'troika-three-text';
import {preloadFont} from 'troika-three-text';


export function drawSphere(x = 0, y = 0, z = 0, size = 20, scene, material = dotMaterial, interactive = true)
    {
        const sphereGeo = new THREE.SphereGeometry();
        const sphereObj = new THREE.Mesh(sphereGeo, material);
        sphereObj.name = "sphere";
        sphereObj.scale.set(size, size, 1);
        sphereObj.position.set(x,y,z);
        scene.add(sphereObj);

        if(interactive){
            sphereObj.addEventListener('mouseover', (event) => {
                sphereObj.material = yellow;
            });

            sphereObj.addEventListener('mouseout', (event) => {
                sphereObj.material = dotMaterial;
            });

            sphereObj.addEventListener('click', (event) => {
                moveCamera(x, y, z, x, y, z);
                sphereObj.material = yellow;
                
            });

            interactionManager.add(sphereObj);
        }

        
    }

var uvGenerator =  {
        generateTopUV:  function(geometry, vertices, idxA, idxB, idxC) {
                            var ax, ay, bx, by, cx, cy;

                return([
                    new THREE.Vector2(1, 0),
                    new THREE.Vector2(1, 1),
                    new THREE.Vector2(0, 1),
                    new THREE.Vector2(0, 0),
                ]);
        },
        generateSideWallUV: function(geometry, vertices, idxA, idxB, idxC, idxD) {
            return([
                new THREE.Vector2(1, 0),
                new THREE.Vector2(1, 1),
                new THREE.Vector2(0, 1),
                new THREE.Vector2(0, 0),
            ]);
    }
    }
export function drawRoad(start, end, sourceCount, childCount, pos, scene, roadMat, dataID, obj){

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
        let angle = Math.atan2(pos[start].x - pos[end].x, pos[start].y - pos[end].y);
        let vec = new THREE.Vector2(Math.cos(angle), Math.sin(angle));

        if(childCount < 2){
            //bottom left
            shape.moveTo(pos[start].y-12, pos[start].x-512);

            //bottom right
            shape.lineTo(pos[start].y+12, pos[start].x-512);

            //top right
            shape.lineTo(pos[end].y+12, pos[end].x + 12);

            //top left
            shape.lineTo(pos[end].y-12, pos[end].x + 12);

            const centerStripe = new THREE.Shape();

            centerStripe.moveTo(pos[start].y-0.5, pos[start].x - 512);
            //bottom right
            centerStripe.lineTo(pos[start].y+0.5, pos[start].x - 512);
            //top right
            centerStripe.lineTo(pos[end].y+0.5, pos[end].x);
            //top left
            centerStripe.lineTo(pos[end].y-0.5, pos[end].x);

            const grey = new THREE.MeshBasicMaterial({color:0xbbbbbb, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending});
            
            const centerStripeGeo = new THREE.ShapeGeometry(centerStripe);
            const centerStripeMesh = new THREE.Mesh(centerStripeGeo, dashedShapeMaterial);
            let uvs = centerStripeMesh.geometry.attributes.uv.array;
            uvs[0] = (0,0);
            uvs[1] = (0,0);
            uvs[2] = (1,1);
            uvs[3] = (1,0);
            centerStripeMesh.geometry.attributes.uv.needsUpdate = true;

            
            centerStripeMesh.position.z = 0.65;

            scene.add(centerStripeMesh);
            
            let triGroup = new THREE.Group();
            triGroup.name = "hello";
            drawTriangleSign((pos[start].y) - vec.x*7, (pos[start].x) - vec.y*7, 3, 5, 10, dotMaterial, triGroup, 1, angle + 90 * Math.PI/180, pos[end], scene);
            drawTriangleSign((pos[end].y) + vec.x*7, (pos[end].x) + vec.y*7, 3, 5, 10, dotMaterial, triGroup, 1, angle - 90 * Math.PI/180, pos[start]);
            scene.add(triGroup);
            loadSign(end, dataID, obj, pos, scene, (pos[end].y), (pos[end].x));

        }else{

            loadSign(end, dataID, obj, pos, scene, (pos[end].y), (pos[end].x));
            //bottom left
            shape.moveTo(pos[start].y + (vec.y*12), pos[start].x - (vec.x*12));

            //bottom right
            shape.lineTo(pos[start].y - (vec.y*12), pos[start].x + (vec.x*12));

            //top right
            shape.lineTo(pos[end].y - (vec.y*12), pos[end].x + (vec.x*12));

            //top left
            shape.lineTo(pos[end].y + (vec.y*12), pos[end].x - (vec.x*12));


            const centerStripe = new THREE.Shape();

            centerStripe.moveTo(pos[start].y - (vec.y*0.5), pos[start].x + (vec.x*0.5));
            //bottom right
            centerStripe.lineTo(pos[start].y + (vec.y*0.5), pos[start].x - (vec.x*0.5));
            //top right
            centerStripe.lineTo(pos[end].y + (vec.y*0.5), pos[end].x - (vec.x*0.5));
            //top left
            centerStripe.lineTo(pos[end].y - (vec.y*0.5), pos[end].x + (vec.x*0.5));

            

            let triGroup = new THREE.Group();
            triGroup.name = "hello";
            
            drawTriangleSign((pos[start].y) - vec.x*7, (pos[start].x) - vec.y*7, 3, 5, 10, dotMaterial, triGroup, 1, angle + 90 * Math.PI/180, pos[end]);
            drawTriangleSign((pos[end].y) + vec.x*7, (pos[end].x) + vec.y*7, 3, 5, 10, dotMaterial, triGroup, 1, angle - 90 * Math.PI/180, pos[start]);
            scene.add(triGroup);
            
            const centerStripeGeo = new THREE.ShapeGeometry(centerStripe);
            
            const centerStripeMesh = new THREE.Mesh(centerStripeGeo, dashedShapeMaterial);
            let uvs = centerStripeMesh.geometry.attributes.uv.array;
            uvs[0] = (0,0);
            uvs[1] = (0,0);
            uvs[2] = (1,1);
            uvs[3] = (1,0);
            centerStripeMesh.geometry.attributes.uv.needsUpdate = true;
            centerStripeMesh.position.z = 0.65;

            scene.add(centerStripeMesh);
        }
       
            
        
        const lineGeo = new THREE.ShapeGeometry(shape, extrudeSettings);
        const lineMesh = new THREE.Mesh(lineGeo, roadMat);
        lineMesh.position.z = 0.5;
        
        const condMesh = new THREE.Mesh(lineGeo, crackMat);
        condMesh.position.z = 0.6;

        scene.add(lineMesh);
        if(Math.random() < 0.6){
            scene.add(condMesh);
            let warnG = new THREE.Group();
            
            drawTriangleSign(0, 0, 4.5, 8, 10, yellow, warnG, 1, 0, pos[end], scene, false);
            const cylGeo = new THREE.CylinderGeometry(.3,.3,20,6);
            const cyl = new THREE.Mesh(cylGeo, yellow);
            cyl.position.y = -6;
            cyl.position.z = 1;

            cyl.layers.set(1);
            warnG.position.x = (pos[start].y) - 16;
            warnG.position.y = (pos[start].x);
            warnG.add(cyl);
            scene.add(warnG);
        }
            
    }
    
    export function drawSign(curveSize, xPos, yPos, width, height, mat, group, amount, offset){
        const shape = new THREE.Shape();

        shape.moveTo(curveSize, 0);

        shape.lineTo(curveSize + width, 0);
        shape.bezierCurveTo(curveSize + width + amount, 0, curveSize + width + curveSize, curveSize - amount, curveSize + width + curveSize, curveSize);

        shape.lineTo(curveSize + width + curveSize, curveSize + height);
        shape.bezierCurveTo(curveSize + width + curveSize, curveSize + height + amount, curveSize + width + amount, curveSize + height + curveSize, curveSize + width, curveSize + height + curveSize);
        
        shape.lineTo(curveSize, curveSize + height + curveSize);
        shape.bezierCurveTo(curveSize - amount, curveSize + height + curveSize, 0, curveSize + height + amount, 0, height + curveSize);
        
        shape.lineTo(0, curveSize);
        shape.bezierCurveTo(0, curveSize - amount, curveSize - amount, 0, curveSize, 0);

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
    export function drawTriangleSign(xPos, yPos, width, height, curveSize, mat, group, offset, rot, target, scene, interactive = true){
        const tri = new THREE.Shape();

        tri.moveTo(0, 0);

        tri.lineTo(width/2, 0);
        tri.bezierCurveTo(width*1.2, 0, width, 0, width/2, height/2);
        tri.bezierCurveTo(0, height, 0, height, -width/2, height/2);
        tri.bezierCurveTo(-width, 0, -width*1.2, 0, 0, 0);

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

        const signGeo = new THREE.ExtrudeGeometry(tri, extrudeSettings); 
        
        const signMesh = new THREE.Mesh(signGeo, mat);
        signMesh.position.x = xPos;
        signMesh.position.y = yPos;
        signMesh.position.z = offset;
        signMesh.rotation.z = rot;

        group.add(signMesh);

        if(interactive){
        signMesh.addEventListener('mouseover', (event) => {
            event.target.scale.set(1.3, 1.3, 1);
            signMesh.material = yellow;
        });

        signMesh.addEventListener('mouseout', (event) => {
            event.target.scale.set(1, 1, 1);
            signMesh.material = dotMaterial;
        });

        signMesh.addEventListener('click', (event) => {
            moveCamera(target.y, target.x, 0, target.y, target.x, 0);
        });

        interactionManager.add(signMesh);
    }
    }

   export function drawQuad(xPos, yPos, width, height, mat, group, offset, layer){
        const shape = new THREE.Shape();
        
        shape.moveTo(xPos, yPos);
        shape.lineTo(xPos + width, yPos);
        shape.lineTo(xPos + width, yPos + height);
        shape.lineTo(xPos, yPos + height);

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

        const quadGeo = new THREE.ShapeGeometry(shape, extrudeSettings); 
        
        const quadMesh = new THREE.Mesh(quadGeo, mat);
        quadMesh.position.z = offset;
        quadMesh.layers.set(layer);
        group.add(quadMesh);
    }

    export function loadSign(key, dataID, obj, nodePos, scene, x, y){
        let name = dataID.find(item => item.id === key);
        let date = obj.nodes.find(item => item.key === key);

        let count = date.attributes.content.date.quantity;
        let span = date.attributes.content.date.timespan;

        const timeSpan = count.toString() + " " + span.toString();

        const nameLength = name.nameEn.length;

        const width = Math.max(nameLength, timeSpan.length);

        let signGroup = new THREE.Group();

        drawSign(2, 6, -9, 50, 14, distanceSignMaterial, signGroup, 1, -.5);
        drawSign(2, 7, -8, 48, 12, distanceWhiteMaterial, signGroup, 2, 0);
        drawSign(2, 7.5, -7.5, 47, 11, distanceSignMaterial, signGroup, 2, .5);
        const cylGeo = new THREE.CylinderGeometry(1,1,35,12);
        const cyl = new THREE.Mesh(cylGeo, distanceGreyMaterial);
        
        cyl.position.x = 50;
        cyl.position.y = -26;
        cyl.position.z = -2;
        cyl.layers.set(1);
        
        const cyl2 = cyl.clone();
        cyl2.layers.set(1);
        cyl2.scale.y = 1.5;
        cyl2.position.x = 33;
        cyl2.position.y = -10;
        cyl2.position.z = 0;
        cyl2.rotation.z = 90 * Math.PI/180;
        signGroup.add(cyl);
        signGroup.add(cyl2);
        
        signGroup.name = "Sign" + name.nameEn;

        const signText = new Text();
                
        signText.fontSize = 4;
        signText.font = 'assets/fonts/Highwaygothicd-KV5Dp.otf';
        signText.text = name.nameEn + "\n" + timeSpan;
        signText.material = distanceWhiteMaterial;
        signText.anchorX = 'middle';
        signText.anchorY = 'middle';
        signText.position.x = 9;
        signText.position.y = 0;
        signText.rotation.z = Math.PI/180;
        signText.position.z = 1.5;
        signGroup.add(signText);
        signGroup.position.x = x;
        signGroup.position.y = y;
        signGroup.position.z = 15;
        scene.add(signGroup);
        
        signText.sync();
    }
    /*const positions = [];
            const colors = [];
            
            positions.push(pos[start].y, pos[start].x, 1);
            colors.push(1,1,0); 
            positions.push(pos[end].y, pos[end].x, 1);
            colors.push(1,1,0); 
            
            const geometry = new LineGeometry();
            geometry.setPositions( positions );
            geometry.setColors( colors );

            let matLine = new LineMaterial( {

                            color: 0xffffff,
                            dashSize: 2,
                            linewidth: .4, // in world units with size attenuation, pixels otherwise
                            vertexColors: true,
                            dashed: true,
                            alphaToCoverage: true,
                            worldUnits: true
                        } );

            let line = new Line2( geometry, matLine );
            line.computeLineDistances();
            line.scale.set( 1, 1, 1 );
            //scene.add( line );*/