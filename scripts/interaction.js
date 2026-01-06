import { InteractionManager } from 'three.interactive';
import { renderer, cameraMain, cameraControls, toggleCameraControls} from './camera.js';
import * as THREE from 'three';

export const interactionManager = new InteractionManager(
        renderer,
        cameraMain,
        renderer.domElement
    );

export var toggled = false;

export function toggleScenePerspective(zoomed, scene){

        if(toggled != zoomed){
            scene.children.forEach(object => {
            
                if (object instanceof THREE.Object3D) {
                    if(!toggled){
                        //3d model would have scene name
                        if(object.name == "Scene"){
                            object.rotation.x = 90 * Math.PI/180;
                            object.rotation.y = 315 * Math.PI/180;
                            object.position.x -= 14;
                            object.scale.x = 5;
                            object.scale.y = 5;
                            object.scale.z = 5;
                        }
                    }
                    else{
                        
                        if(object.name == "Scene"){
                            object.scale.x = 5;
                            object.scale.y = 5;
                            object.scale.z = 5;
                            object.position.x += 14;
                            object.rotation.x = 0 * Math.PI/180;
                            object.rotation.y = 0 * Math.PI/180;
                        }
                        
                    }
                
                }

                if(object instanceof THREE.Group){
                    if(object.name == "Scene") return;
                    
                    if(object.name == "hello") return;
                    
                    if(!toggled){
                        object.rotation.x = 90 * Math.PI/180;
                        object.position.y += 2;
                        object.position.z += 8;
                        object.scale.set(0.6,0.6,0.6);
                    }else{
                        object.rotation.x = 0 * Math.PI/180;
                        object.position.y -= 2;
                        object.position.z -= 8;
                        object.scale.set(1,1,1);
                    }
                }
            });

            toggled = zoomed;

        }
        
    }