import * as THREE from "three";
import { GLTFLoader } from '/three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from '/three/examples/jsm/loaders/OBJLoader.js';

const ip = prompt("Enter Server IP:", window.location.host);

const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const loader = new GLTFLoader();

var xperc = 0;
var yperc = 0;
var active_proj = 0;
const player = 2;

document.addEventListener('mousemove', (event) => {
    yperc = (event.clientX-(window.innerWidth/2))/(window.innerWidth/2)*100;
    xperc = (event.clientY-(window.innerHeight/2))/(window.innerHeight/2)*100;
    //console.log(xperc + ", " + yperc);
});
document.addEventListener('mousedown', (event) => {
    var camq = camera.quaternion.clone();
    var aimq = new THREE.Quaternion(0,0,0,0);
    var radx = -((((xperc/100)*37.5))/180)*Math.PI;
    var yangle = (75/window.innerHeight)*window.innerWidth;
    var rady = -(((yperc/100)*(yangle/2))/180)*Math.PI;
    var offset = new THREE.Quaternion().setFromEuler(new THREE.Euler(radx, rady, 10));
    aimq.multiplyQuaternions(camq,offset);
    sendHTTPRequest(aimq);
});
document.addEventListener('keydown', (event) => {
    if (event.key == 'f'){
        active_proj = (active_proj + 1) % 2;
    }
}, false);

function sendHTTPRequest(firequaternion){
    let postObj = {
        weapon_type: active_proj,
        quaternion: firequaternion,
        playernum: player
    }
    let post = JSON.stringify(postObj);
    const url = "http://"+ip+"/update_user_action.php";
    let xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
    xhr.send(post);
    xhr.onload = function () {
        if(xhr.status === 200) {
            //console.log("Post successfully created!");
            //console.log(xhr.response);
        }
    }
}
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set(0,0,30);
camera.name = "static";

var localships = [];
var localprojectiles = [];
//const ip = "10.10.67.4";
const objloader = new OBJLoader();


function getStaticObjects(){
    const url = "http://"+ip+"/get_static_objects.php";
    let xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
    xhr.send();
    xhr.onload = function () {
        if(xhr.status === 200) {
            var response = JSON.parse(xhr.response);
            console.log(response);
            response.objects.forEach(s => {
                console.log(s.colour);
                if (s.type == "asteroid"){
                    objloader.load('../resources/Asteroid/meteor.obj', function ( object ) {
                        object.scale.set(0.005,0.005,0.005);
                        object.position.set(s.position.x, s.position.y, s.position.z);
                        scene.add ( object );
                        }, undefined, function ( error ) {
                        console.log( 'An error happened: '+ error );
                        }
                    );
                } else if (s.type == "planet"){
                    const geometry = new THREE.SphereGeometry( s.radius, 32, 16 );
                    const material = new THREE.MeshBasicMaterial( { color: s.colour } );
                    const sphere = new THREE.Mesh( geometry, material );
                    sphere.position.set(s.position.x, s.position.y, s.position.z );
                    scene.add( sphere );
                } else if (s.type == "planetlight"){
                    var planetlight = new THREE.PointLight( s.colour, 2, 0, 0);
                    planetlight.position.set( s.position.x, s.position.y, s.position.z );
                    scene.add( planetlight );
                } else {
                    console.error("type doesn't exist");
                }
            });
        } 
   }
}
setTimeout(getStaticObjects(), 1000);

function updateWorldStateOnScreen(){
    const url = "http://"+ip+"/get_world_state.php";
    let xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
    xhr.send();
    xhr.onload = function () {
        if(xhr.status === 200) {
            try{
                var response = JSON.parse(xhr.response);
                //console.log(response);
                var updatedships = [];
                console.log(response);
                response.ships.forEach(s => {
                    try{
                        var found_ship = false;
                        for (var i = 0; i < localships.length; i++){
                            if (localships[i].name == s.id){
                                found_ship = true;
                                localships[i].position.set(s.position.x, s.position.y, s.position.z);
                                localships[i].quaternion.copy(new THREE.Quaternion(s.quaternion._x, s.quaternion._y, s.quaternion._z));
                                updatedships.push(localships[i].name);
                            }
                        }
                        if (!found_ship){
                            updatedships.push(s.id);
                            loader.load('../resources/TIE/scene.gltf', function ( gltf ) {
                                gltf.scene.scale.set(0.001,0.001,0.001);
                                gltf.scene.position.set(s.position.x, s.position.y, s.position.z);
                                //gltf.scene.copy(new THREE.Quaternion(s.quaternion._x, s.quaternion._y, s.quaternion._z));
                                gltf.scene.name = s.id;
                                scene.add(gltf.scene);
                                localships.push(gltf.scene);

                            }, undefined, function ( error ) {
                                console.error( error );
                            } );
                        }
                    } catch (exceptionVar){
                        console.log(exceptionVar);
                        //alert("Error logged within Ships. Please see console for more details");
                        
                    }  
                });
                localships.forEach(f => {
                    if (updatedships.includes(f.name)){
                        //do nothing
                    } else {
                        scene.remove(f);
                    }
                });

                var updatedprojs = [];
                response.projectiles.forEach(b => {
                    try{
                        var found_proj = false;
                        for (var i = 0; i < localprojectiles.length; i++){
                            if (localprojectiles[i].name == b.id){
                                found_proj = true;
                                localprojectiles[i].position.set(b.position.x, b.position.y, b.position.z);
                                localprojectiles[i].quaternion.copy(new THREE.Quaternion(b.quaternion._x, b.quaternion._y, b.quaternion._z));
                                updatedprojs.push(localprojectiles[i].name);
                            }
                        }
                        if (!found_proj){
                            updatedprojs.push(b.id);
                            if (b.type == 0){
                                let material = new THREE.LineBasicMaterial( { color: b.colour } ); //0x274f35 0xfa5c00
                                let points = [];
                                var point1 = new THREE.Vector3(0,0,0);
                                var point2 = new THREE.Vector3(0,0,2);
                                points.push( point1 );
                                points.push( point2 );
                                let geometry = new THREE.BufferGeometry().setFromPoints( points );
                                let proj = new THREE.Line( geometry, material );
                                scene.add(proj);
                                proj.name = b.id;
                                proj.position.set(b.position.x, b.position.y, b.position.z);
                                localprojectiles.push(proj);
                                updatedprojs.push(proj.name);
                            } else {
                                updatedprojs.push(b.id);
                                loader.load('../resources/Missile/scene.gltf', function ( gltf ) {
                                    gltf.scene.scale.set(1,1,1);
                                    gltf.scene.position.set(b.position.x, b.position.y, b.position.z);
                                    gltf.scene.name = b.id;
                                    scene.add(gltf.scene);
                                    localprojectiles.push(gltf.scene);
                                }, undefined, function ( error ) {
                                    console.error( error );
                                } );
                            }
                        }
                    } catch (exceptionVar){
                        console.log(exceptionVar);
                        //alert("Error logged within Projectiles. Please see console for more details");
                        
                    }  
                });
                localprojectiles.forEach(f => {
                    if (updatedprojs.includes(f.name)){
                        //do nothing
                    } else {
                        scene.remove(f);
                    }
                })
                try{
                    camera.position.set(response.camera.position.x,response.camera.position.y, response.camera.position.z);
                    camera.quaternion.copy(new THREE.Quaternion(response.camera.quaternion._x, response.camera.quaternion._y, response.camera.quaternion._z));
                    //light.position.set(camera.position.x, camera.position.y, camera.position.z);
                    camera.rotateY(-(Math.PI/2));
                } catch (exceptionVar){
                    console.log(exceptionVar);
                    //alert("Error logged within Camera Movement. Please see console for more details");
                }
                

            } catch (exceptionVar){
                console.log(exceptionVar);
                //alert("Error logged within whole function. Please see console for more details");
            }
        }
    }
}

/*const light = new THREE.PointLight(0xffffff, 255, 0, 0);
light.position.set( 0, 0, 30 );
light.name = "static";
scene.add( light );
console.log("Added light");*/

//getWorldState();
//setInterval(getWorldState, 500);

let new_req = true;

function animate() {
    if (new_req){
        new_req = false;
        requestAnimationFrame( animate );
        updateWorldStateOnScreen();
        renderer.render( scene, camera );
        new_req = true;
    }
	
}
animate();