import * as THREE from "three";
import { GLTFLoader } from '/three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from '/three/examples/jsm/loaders/OBJLoader.js';
//import necessary libraries for 3-D rendering
//'three' allows for 3-D rendering and manipulation: https://threejs.org/docs
//'GLTFLoader' allows 3-D models in .glb or .gltf format to be loaded into the threejs scene: https://threejs.org/docs/?q=gltf#examples/en/loaders/GLTFLoader
//'OBJLoader' allows 3-D models in .obj format to be loaded into the threejs scene: https://threejs.org/docs/?q=obj#api/en/loaders/ObjectLoader

const ip = prompt("Enter Server IP:", window.location.host);
//This runs before the game starts and allows the user to enter the location of the server to communicate with to share data between clients

const scene = new THREE.Scene();
//creates the THREEJS Scene

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );
//sets the renderer properties and displays it on the html

const loader = new GLTFLoader();
//creates the loader for the TIE fighters

var xperc = 0;
var yperc = 0;
var active_proj = 0;
const player = 2;
//define necessary variables

document.addEventListener('mousemove', (event) => {
    //every time the mouse moves
    yperc = (event.clientX-(window.innerWidth/2))/(window.innerWidth/2)*100;
    //calculate the Y-Percentage from the centre of the cursor
    xperc = (event.clientY-(window.innerHeight/2))/(window.innerHeight/2)*100;
    //calculate the X-Percentage from the centre of the cursor
});
document.addEventListener('mousedown', (event) => {
    //when the gunner clicks
    var camq = camera.quaternion.clone();
    //clone the current camera quaternion
    var aimq = new THREE.Quaternion(0,0,0,0);
    //define an empty quaternion
    var radx = -((((xperc/100)*37.5))/180)*Math.PI;
    //calculate the radian angle of the x-pos of the cursor relative to World Space
    var yangle = (75/window.innerHeight)*window.innerWidth;
    //calculate the horizontal FOV
    var rady = -(((yperc/100)*(yangle/2))/180)*Math.PI;
    //calculate the radian angle of the y-pos of the cursor relative to World Space
    var offset = new THREE.Quaternion().setFromEuler(new THREE.Euler(radx, rady, 10));
    //sets the quaternion for the position relative to the current view
    aimq.multiplyQuaternions(camq,offset);
    //applys them together to get the final quaternion
    sendHTTPRequest(aimq);
    //sends a HTTP Request with this quaternion
});
document.addEventListener('keydown', (event) => {
    if (event.key == 'f'){
        //if they press f
        active_proj = (active_proj + 1) % 2;
        //change the active type of projectile
    }
}, false);

function sendHTTPRequest(firequaternion){
    let postObj = {
        weapon_type: active_proj,
        quaternion: firequaternion,
        playernum: player
    }
    //define the object to send as a JS Object involving the current weapon type, direction of shot, and the player who sent the data
    let post = JSON.stringify(postObj);
    const url = "http://"+ip+"/update_user_action.php";
    let xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
    xhr.send(post);
    //send the request to the necessary PHP file to deal with
    xhr.onload = function () {
        if(xhr.status === 200) {
            //do nothing
        }
    }
}
var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set(0,0,30);
//set the camera position and properties initially


var localships = [];
var localprojectiles = [];
const objloader = new OBJLoader();
//define some more necessary variables


function getStaticObjects(){
    //function to retrieve static objects from the database
    const url = "http://"+ip+"/get_static_objects.php";
    let xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
    xhr.send();
    //set up and send the request to the database
    xhr.onload = function () {
        if(xhr.status === 200) {
            //if the status is a success
            var response = JSON.parse(xhr.response);
            //parse the information from JSON
            response.objects.forEach(s => {
                //for each object
                if (s.type == "asteroid"){
                    //if it is an asteroid object
                    objloader.load('../resources/Asteroid/meteor.obj', function ( object ) {
                        object.scale.set(0.005,0.005,0.005);
                        object.position.set(s.position.x, s.position.y, s.position.z);
                        scene.add ( object );
                        }, undefined, function ( error ) {
                        console.log( 'An error happened: '+ error );
                        }
                        //load in a 3d model of an asteroid, the same as you would if you were P1
                    );
                } else if (s.type == "planet"){
                    //if the object is a planet
                    const geometry = new THREE.SphereGeometry( s.radius, 32, 16 );
                    const material = new THREE.MeshBasicMaterial( { color: s.colour } );
                    const sphere = new THREE.Mesh( geometry, material );
                    sphere.position.set(s.position.x, s.position.y, s.position.z );
                    scene.add( sphere );
                    //create the 3d object, the same as you would if you were P1
                } else if (s.type == "planetlight"){
                    var planetlight = new THREE.PointLight( s.colour, 2, 0, 0);
                    planetlight.position.set( s.position.x, s.position.y, s.position.z );
                    scene.add( planetlight );
                    //create the 3d object, the same as you would if you were P1
                } else {
                    console.error("type doesn't exist");
                    //if the name is unrecognised, output an error to the console
                }
            });
        } 
   }
}
setTimeout(getStaticObjects(), 1000);
//run this function 1 second after loading the page, as this should be more than sufficient for P1 to have sent the information to the databaee

function updateWorldStateOnScreen(){
    //acts on the information retrieved from the server
    const url = "http://"+ip+"/get_world_state.php";
    let xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
    xhr.send();
    //set up and send the HTTP request
    xhr.onload = function () {
        if(xhr.status === 200) {
            try{
                //if it is a success
                var response = JSON.parse(xhr.response);
                //parse the JSON
                var updatedships = [];
                response.ships.forEach(s => {
                    //for each ship in the response
                    try{
                        var found_ship = false;
                        //not currently identified that object
                        for (var i = 0; i < localships.length; i++){
                            //for each ship in localships
                            if (localships[i].name == s.id){
                                //if the ship is found
                                found_ship = true;
                                //update this to say it has been found
                                localships[i].position.set(s.position.x, s.position.y, s.position.z);
                                //update its position
                                localships[i].quaternion.copy(new THREE.Quaternion(s.quaternion._x, s.quaternion._y, s.quaternion._z));
                                //update its quaternion
                                updatedships.push(localships[i].name);
                                //push it to an array of updated ships
                            }
                        }
                        if (!found_ship){
                            //if the ship was not found
                            updatedships.push(s.id);
                            //add this to the updatedships array, then render it
                            loader.load('../resources/TIE/scene.gltf', function ( gltf ) {
                                gltf.scene.scale.set(0.001,0.001,0.001);
                                gltf.scene.position.set(s.position.x, s.position.y, s.position.z);
                                gltf.scene.name = s.id;
                                scene.add(gltf.scene);
                                localships.push(gltf.scene);
                                //rendered exactly the same as if you were P1, then pushs the ship to an array of localships
                            }, undefined, function ( error ) {
                                console.error( error );
                                //if there is an error output it
                            } );
                        }
                    } catch (exceptionVar){
                        console.log(exceptionVar);
                        //if there is an error output it
                        
                    }  
                });
                localships.forEach(f => {
                    //for every localship
                    if (updatedships.includes(f.name)){
                        //if it has been updated, then do nothing
                    } else {
                        //if it wasn't sent by P1, this means it is dead
                        scene.remove(f);
                        //so remove it from the scene
                    }
                });

                var updatedprojs = [];
                response.projectiles.forEach(b => {
                    //for every projectile
                    try{
                        var found_proj = false;
                        //not currently found
                        for (var i = 0; i < localprojectiles.length; i++){
                            if (localprojectiles[i].name == b.id){
                                //if it is found
                                found_proj = true;
                                //set the property to say it is found
                                localprojectiles[i].position.set(b.position.x, b.position.y, b.position.z);
                                //update the position of the projectile
                                localprojectiles[i].quaternion.copy(new THREE.Quaternion(b.quaternion._x, b.quaternion._y, b.quaternion._z));
                                //update the rotation of the projectile
                                updatedprojs.push(localprojectiles[i].name);
                                //push this projectile to an array of updated projectiles
                            }
                        }
                        if (!found_proj){
                            //if the projectile was not found
                            updatedprojs.push(b.id);
                            //add it to a list of updated projectiles
                            if (b.type == 0){
                                //if it originated from a photon cannon
                                let material = new THREE.LineBasicMaterial( { color: b.colour } ); //0x274f35 0xfa5c00
                                let points = [];
                                var point1 = new THREE.Vector3(0,0,0);
                                var point2 = new THREE.Vector3(0,0,2);
                                points.push( point1 );
                                points.push( point2 );
                                let geometry = new THREE.BufferGeometry().setFromPoints( points );
                                let proj = new THREE.Line( geometry, material );
                                scene.add(proj);
                                //render the line exactly as has been done before
                                proj.name = b.id;
                                //set the name of the projectile
                                proj.position.set(b.position.x, b.position.y, b.position.z);
                                //set the initial position of the projectiles
                                localprojectiles.push(proj);
                                //push it to the array of currently available projectiles

                            } else {
                                //if not originating from a photon cannon, it must be a missile
                                updatedprojs.push(b.id);
                                //add it to the updated ships array
                                loader.load('../resources/Missile/scene.gltf', function ( gltf ) {
                                    gltf.scene.scale.set(1,1,1);
                                    gltf.scene.position.set(b.position.x, b.position.y, b.position.z);
                                    gltf.scene.name = b.id;
                                    scene.add(gltf.scene);
                                    //render the missile as before
                                    localprojectiles.push(gltf.scene);
                                    //add it to the array of localprojectiles
                                }, undefined, function ( error ) {
                                    console.error( error );
                                    //if there is an error, output it
                                } );
                            }
                        }
                    } catch (exceptionVar){
                        console.log(exceptionVar);
                        //if there is an error, output it
                        
                    }  
                });
                localprojectiles.forEach(f => {
                    //for each projectile
                    if (updatedprojs.includes(f.name)){
                        //if it has been updated, then do nothing
                    } else {
                        //if it has not been updated then no data was sent from P1 about it, so it must've expired
                        scene.remove(f);
                        //remove it from the scene
                    }
                })
                try{
                    camera.position.set(response.camera.position.x,response.camera.position.y, response.camera.position.z);
                    camera.quaternion.copy(new THREE.Quaternion(response.camera.quaternion._x, response.camera.quaternion._y, response.camera.quaternion._z));
                    //set the camera position of the gunner to copy the camera position of P1
                    //copy the quaternion also
                    camera.rotateY(Math.PI/2);
                    //then make sure we're at 90 degrees to that camera
                } catch (exceptionVar){
                    console.log(exceptionVar);
                    //if there is an error, output it
                }
                

            } catch (exceptionVar){
                console.log(exceptionVar);
                //if there is an error, output it
            }
        }
    }
}

let new_req = true;

function animate() {
    if (new_req){
        new_req = false;
        requestAnimationFrame( animate );
        //recursively call itself
        updateWorldStateOnScreen();
        //update the world state from the database
        renderer.render( scene, camera );
        new_req = true;
        //allow a new request to be made
    }
	
}
animate();
//start the 'chain reaction'