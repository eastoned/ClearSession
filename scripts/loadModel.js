import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { vertexColorMat, brightMat } from './materials.js';
//models
const loader = new GLTFLoader();
//draws a model to the scene given name and position, with optional interactive, scale, and group inputs
export function loadModel(modelName, x, y, z, scale = 3, scene, group)
{

    loader.load('assets/models/' + modelName + '.glb', function(gltf) {
    const modelOriginal = gltf.scene;
    
    modelOriginal.scale.set(scale, scale, scale);
    modelOriginal.position.set(x,y,z);
    

    modelOriginal.traverse((mod) => {
      mod.layers.set(1);
    
    if (mod.isMesh) {
      if(mod.geometry.attributes.color){
        mod.material = vertexColorMat;
      }else{
        mod.material.emissive.set(mod.material.color);
      }
      
    }
    
  });

    if(group){
        group.add(modelOriginal);
    }else{
        scene.add(modelOriginal);
    }    

}, undefined, function ( error ) {

  console.error( error );

} );
}

export function loadSampleModel(scene){
  loader.load('assets/models/modelTest.glb', function(gltf) {
      const modelOriginal = gltf.scene;
      modelOriginal.name = "modelsTest";

      console.log(modelOriginal.children);
      let counter = 0;
      modelOriginal.children.forEach((child) => {
        console.log(child.name);
        child.position.set(counter * 20, 0, 0);
        counter++;
      });
      
      modelOriginal.scale.set(1, 1, 1);
      modelOriginal.position.set(-70,-20,0);
      modelOriginal.rotation.x = 90 * Math.PI/180;

      modelOriginal.traverse((mod) => {
        
        //if(mod.name.includes("Mesh")) counter++;
        if (mod.isMesh) {
          mod.layers.set(3);
          mod.scale.set(4,4,4);
         

          if(mod.geometry.attributes.color){
            mod.material = vertexColorMat;
          }else{
            mod.material.emissive.set(mod.material.color);
          }
          
        }
    }); 

    scene.add(modelOriginal);

  }, undefined, function ( error ) {

    console.error( error );

  } );
}