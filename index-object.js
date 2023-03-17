import * as THREE from "three";
import { GLTFLoader } from '/three/examples/jsm/loaders/GLTFLoader.js';
import { OBJLoader } from '/three/examples/jsm/loaders/OBJLoader.js';
//import necessary libraries for 3-D rendering
//'three' allows for 3-D rendering and manipulation: https://threejs.org/docs
//'GLTFLoader' allows 3-D models in .glb or .gltf format to be loaded into the threejs scene: https://threejs.org/docs/?q=gltf#examples/en/loaders/GLTFLoader
//'OBJLoader' allows 3-D models in .obj format to be loaded into the threejs scene: https://threejs.org/docs/?q=obj#api/en/loaders/ObjectLoader


const ip = prompt("Enter Server IP:", window.location.host);
//This runs before the game starts and allows the user to enter the location of the server to communicate with to share data between clients

var keyspressed = [];
var shipsarr = [];
var projectilesarr = [];
var staticobjarr = [];
var xperc = 0;
var yperc = 0;
var max_ships = 5;
var active_proj = 0;
var mostrecentupdate = 0;
//initialises all variables

class Objects{
    constructor(object, speed){
        this.object = object;
        this.speed = speed;
        //assign these variables to this object on creation
    }
}
//creates a class called objects with the properties: speed, and threejs object

class Staticobjs extends Objects{
    constructor(object, colour, radius){
        super(object, 0);
        //speed is 0 because the object is static
        this.colour = colour;
        this.rad = radius;
        //assign these variables to this object on creation
    }
}

class Ships extends Objects{
    constructor(object, speed, rotationSpeed, hitbox, health, regenerationChance){
        super(object, speed);
        this.rotationSpeed = rotationSpeed;
        this.hitbox = hitbox;
        this.health = health;
        this.maxSpeed = speed;
        this.maxHealth = health;
        this.regenerationChance = regenerationChance;
        //assign these variables to this object on creation
    }
    checkForCollisions(){
        //a method that checks if any projectiles are inside the hitboxes of any ships
        projectilesarr.forEach(p => {
            if (this.hitbox.containsPoint(p.object.position)){
                //if the projectiles threejs position is between the bounds of this ships hitbox:
                this.health = this.health - p.damage;
                //reduce the health of this ship by the damage dealt by the projectile
                if (p.damage > 1){
                    this.object.applyQuaternion(new THREE.Quaternion().random());
                    //if the projectiles deals substantial damage then it will cause steering anomalies to this ship upon hit
                }
                p.remove();
                //call method to remove this projectile
                if (this.health <= 0){
                    this.removeMyself();
                    //if health has reached 0, remove the ship
                }
            }
        });
        
    }


    regenerate(){
        if (Math.random() < this.regenerationChance && this.health < this.maxHealth){
            //checks if ship is not at max health, and if an RNG generates a number less than the regeneration chance -
            //basically the regenerationChance is the probability of regenerating a health point every time this method is run - 
            //it will cause the ship to regenerate a single health point, up to its maximum
            this.health += 1;
        }
    }
}

class Camera extends Ships{
    constructor(object, speed, rotationSpeed, hitbox, health, regenerationChance, startPos){
        super(object, speed, rotationSpeed, hitbox, health, regenerationChance);
        this.object.position.set(startPos.x, startPos.y, startPos.z);
        //assign these variables to this object on creation
    }
    move(){
        for (let i = 0; i < keyspressed.length; i++){
            //for every item in the array of current keys pressed
            if (keyspressed[i] == 'w'){
                if (this.speed < this.maxSpeed){
                    //increase speed if it isn't at the ships maxspeed
                    this.speed += 0.01;
                }
            } else if (keyspressed[i] == 's'){
                if (this.speed > 0){
                    //decrease speed if it isn't at the ships minspeed
                    this.speed -= 0.01;
                } else {
                    this.speed = 0;
                }
            } else if (keyspressed[i] == 'a'){
                this.object.rotateZ(-this.rotationSpeed);
                //rotate the object on its local Z-axis by its rotationspeed (all threejs objects look down their -Z-axis) anticlockwise
            } else if (keyspressed[i] == 'd'){
                this.object.rotateZ(this.rotationSpeed);
                //rotate the object on its local Z-axis by its rotationspeed (all threejs objects look down their -Z-axis) clockwise
            }
            this.object.translateZ(-this.speed);
            //move the object depenending on its current speed
            this.alignHitbox();
            //move the hitbox to align with the current position and rotation of the object
        }
    }
    rotate(){
        this.object.rotateX(-this.calculateExpoRotateSpeed(xperc));
        this.object.rotateY(-this.calculateExpoRotateSpeed(yperc));
        }
        //this allows the user to look around using the cursor
        //the formula for speed is exponential so the further the cursor is from the centre of the screen,
        //the faster it rotates, exponentially.
    calculateExpoRotateSpeed(f){
        return (1.1^f)/3500;
        //calculates a value for the speed using exponentials
    }
    fireProjectile(colour, quaternion){
        if (active_proj == 0){
            //if the current projectile type is photon cannon
            let material = new THREE.LineBasicMaterial( { color: colour } );
            //set the colour of the projectile
            let points = [];
            var point1 = new THREE.Vector3(0,0,0);
            var point2 = new THREE.Vector3(0,0,1);
            //set points for the projectile
            points.push( point1 );
            points.push( point2 );
            let geometry = new THREE.BufferGeometry().setFromPoints( points );
            //draw the projectile from the given points
            let proj = new THREE.Line( geometry, material );
            scene.add(proj);
            //adds this projectile to the scene to be rendered
            projectilesarr.push(new Projectile(proj, 3, this.object.position.clone().sub(new THREE.Vector3(0,1,0)), quaternion, 1, 0, colour));
            //adds this projectile and necessary properties to a new instance of Projectile class so it can be referred to later
        } else {
            //if current weapon type is missile
            var startPos = this.object.position.clone().sub(new THREE.Vector3(0,1,0));
            //set the inital position to slightly offset from the camera, as a gun turret would be
            loader.load('resources/Missile/scene.gltf', function ( gltf ) {
                gltf.scene.scale.set(1,1,1);
                //set scale to default as override
                scene.add(gltf.scene);
                //adds this projectile to the scene
                projectilesarr.push(new Projectile(gltf.scene, 1.5, startPos, quaternion, 2, 1, 0xffffff));
                //adds this projectile and necessary properties to a new instance of Projectile class so it can be referred to later
            }, undefined, function ( error ) {
                console.error( error );
                //output error to console if there is one
            } );
        }
        
        
    }
    alignHitbox(){
        var min = new THREE.Vector3(-0.5,-0.5,-0.5).add(camera.object.position);
        var max = new THREE.Vector3(0.5,0.5,0.5).add(camera.object.position);
        this.hitbox = new THREE.Box3(min, max);
        //creates a 3d box around the camera, with a width, length and height of 1
        //sets this to the player ships hitbox
    }

    removeMyself(){
        //called if health gets to 0
        var canvas = document.getElementById("canvas");
        var context = canvas.getContext("2d");
        context.fillStyle = "red";
        context.font = "bold 32px Arial";
        context.textAlign = 'left';
        context.textBaseline = 'middle';
        context.fillText("ELIMINATED", 50, 50);
        //sets the properties of some text, and then displays it on top of the canvas
    }
}

class Projectile extends Objects{
    constructor(object,speed, startPos, startQuart, damage, type, colour){
        super(object,speed);
        this.object.position.set(startPos.x, startPos.y, startPos.z);
        this.object.applyQuaternion(startQuart);
        this.damage = damage;
        this.type = type;
        this.colour = colour;
        //sets these properties when the object is created
    }
    checkForRemoval(){
        if (Math.abs(this.object.position.x) > 1000 || Math.abs(this.object.position.y) > 1000 || Math.abs(this.object.position.z) > 1000){
            //if any of the position values are greater than 1000 or less than -1000
            this.remove(projectilesarr.indexOf(this));
            //call a method to remove this projectile
        }
        while (projectilesarr.length > 50){
            //if the length of the array exceeds 50
            this.remove(0);
            //then remove the first one
            //optimisation purposes
            //too many projectiles makes the game lag because its running using the clients processing power
        }
    }
    remove(obj){
        //a method to remove any projectile object
        projectilesarr.splice(obj, 1);
        //remove it from the array
        scene.remove(this.object);
        //remove it from the scene
    }
    move(){
        this.object.translateZ(-this.speed);
        //move the object along its negative Z-axis
    }
}

class Enemy extends Ships{
    constructor(object, speed, rotationSpeed, hitbox, health, startPosition, regenerationChance){
        super(object, speed, rotationSpeed, hitbox, health, regenerationChance);
        this.object.position.set(startPosition.x, startPosition.y, startPosition.z);
        this.targetPoint = this.object.position.clone();
        this.passedTP = false;
        //properties set when the object is
    }
    move(){
        var rotationmatrix = new THREE.Matrix4();
        //initalise a new 4-dimensional matrix to use for the rotation
        rotationmatrix.lookAt(this.targetPoint, this.object.position, this.object.up);
        //make the matrix equal to the quaternion required to face the ships target point from its current position
        this.object.quaternion.rotateTowards(new THREE.Quaternion().setFromRotationMatrix(rotationmatrix), this.rotationSpeed);
        //rotate slowly towards this quaternion, with incremental steps of rotationSpeed
        if (this.passedTP){
            //if it has come very close to its target point
            this.speed = this.speed-0.01;
            //reduce the speed to turn better
            if (Math.round(this.speed*100)/100 == 0.02){
                //if this speed is approximately equal to 0.02
                //you multiply by 100 because its integer rounding to preserve 2d.p.
                this.passedTP = false;
                //set passed target point to false
            }
        }
        this.object.translateZ(this.speed);
        //move the object along its local Z-axis
        if (Math.abs(this.speed) < this.maxSpeed && this.passedTP == false){
            //if the speed is not the maxspeed, and its not slowed down to turn
            this.speed += 0.01;
            //gradually increased the speed
        }
        this.alignHitbox();
        //align the hitbox with the new position of the enemy ship
    }
    checkIfTarget(){
        //check if it has reached its target
        if (this.object.position.distanceTo(this.targetPoint) < 1 || Math.random() < 0.001){
            //if the distance to the target point is > 1 unit OR there is a small chance it will randomly occur
            //helps to break out of 'softlocked' circles where it just rotates about a single point forever
            this.passedTP = true;
            //set the boolean variable to true to say it has passed this point
            var newtarget = camera.object.position.clone();
            //set the newtarget to the current player ship position
            var offset = new THREE.Vector3(0,0,0).random().multiplyScalar(10);
            //create an offset vector between (0,0,0) and (10,10,10)
            for (var i =0; i < 3; i++){
                //for each value in the offset vector
                if (Math.random() < 0.5){
                    //50% chance to make it negative
                    offset[i] = -offset[i];
                    //make that value negative
                }
                //allows the targetPoint to be in a box with the player ship in the centre, and a width, length, and height of 20
            }
            newtarget.add(offset);
            //create the final target point vector
            this.targetPoint = newtarget;
            //redefine the property to this new target point
            
        } 
    }

    alignHitbox(){
        //keeps the hitbox in the right place so the enemies can be shot at and hit
        var newhitbox = new THREE.Box3().setFromObject( this.object );
        //create a box3 with min and max co-ordinates automatically calculated based on the dimensions and rotation of the 3d model
        this.hitbox = newhitbox;
        //redefine the hitbox property with this new hitbox
    }

    attemptToFire(){
        if (Math.random() < 0.02){
            //1 in 50 chance
            this.fireProjectile(0xfa5c00);
            //fire a projectile
            //argument is a hex code for a shade of red
        }
    }
    fireProjectile(colour){
        let material = new THREE.LineBasicMaterial( { color: colour } );
        //create the material for the projectile
        let points = [];
        var point1 = new THREE.Vector3(0,0,0);
        var point2 = new THREE.Vector3(0,0,2);
        points.push( point1 );
        points.push( point2 );
        //create the vector geometry properties
        let geometry = new THREE.BufferGeometry().setFromPoints( points );
        //create the actual geometry from the properties
        let proj = new THREE.Line( geometry, material );
        //create the line from the material and geometry
        var offset = new THREE.Vector3(0,0,0).random().multiplyScalar(6);
            for (var i =0; i < 3; i++){
                if (Math.random() < 0.5){
                    offset[i] = -offset[i];
                }
            }
        //create an offset vector with values from (-6,-6,-6) to (6,6,6)
        var aimVector = camera.object.position.clone().add(offset);
        //calculate the aimVector by firing at the camera with a slight offset
        var rotationmatrix = new THREE.Matrix4();
        //create a new 4-dimensional matrix
        rotationmatrix.lookAt(this.object.position, aimVector, this.object.up);
        //calculate the necessary quaternion for the aim of the projectile from the ships current position and the target for the projectile
        projectilesarr.push(new Projectile(proj, 1, this.object.position, new THREE.Quaternion().setFromRotationMatrix(rotationmatrix), 1, 0, colour));
        scene.add(proj);
        //add the projectile to the scene
    }

    removeMyself(){
        //if health = 0
        scene.remove(this.object);
        //remove the object from the scene
        shipsarr.splice(shipsarr.indexOf(this), 1);
        //remove the object from the ships array

    }
}

const scene = new THREE.Scene();
//create the THREEJS scene

var cameraHitbox = new THREE.Box3(new THREE.Vector3(-0.5,-0.5,9.5), new THREE.Vector3(0.5,0.5,10.5));
//define the cameraHitbox before it has moved
var camera = new Camera(new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 ), 0.1, 0.04, cameraHitbox, 20, 0.01, new THREE.Vector3(0,0,10));
//create the camera with the necessary player ship properties
shipsarr.push(camera);
//add it to the ships array

const renderer = new THREE.WebGLRenderer();
//create the WebGL renderer
renderer.setSize( window.innerWidth, window.innerHeight );
//set the size to fill all available space
document.body.appendChild( renderer.domElement );
//add this element to the body of the HTML

const loader = new GLTFLoader();
//create the loader for the TIE fighters

document.addEventListener('keydown', (event) => {
    //when a key is pressed
    if (event.key == 'f'){
        //if the key is f
        active_proj = (active_proj + 1) % 2;
        //change the active_proj variable to switch between different weapon types
    }
    else if (keyspressed.indexOf(event.key) == -1){
        //if the key is not in the keyspressed array
        keyspressed[keyspressed.length] = event.key;
        //add it to the array
    }
}, false);
document.addEventListener('keyup', (event) => {
    //when a key is released
    let index = keyspressed.indexOf(event.key);
    //find that key in the array of keyspressed
    if (index > -1) {
        //if it is definitely in the array
        keyspressed.splice(index, 1);
        //remove it from the array
    }
}, false);
document.addEventListener('mousemove', (event) => {
    //every time the mouse moves
    yperc = (event.clientX-(window.innerWidth/2))/(window.innerWidth/2)*100;
    //calculate the Y-Percentage from the centre of the cursor
    xperc = (event.clientY-(window.innerHeight/2))/(window.innerHeight/2)*100;
    //calculate the X-Percentage from the centre of the cursor
});

const objloader = new OBJLoader();
//define the loader for the Asteroids

let repeats = 0;
//variable to check how many asteroids are currently loaded in

for (var i = 0; i < 30; i++){
    //load 30 asteroids around the player
    objloader.load('resources/Asteroid/meteor.obj', function ( object ) {
        var startPos = new THREE.Vector3(0,0,0).random().multiplyScalar(50);
        //within 86.6 units of the player (further possible point would be (50,50,50) compared to camera: (0,0,0) so 3-D pythagoras gives 86.6 units)
        for (var j =0; j < 3; j++){
            //for each value in the startPos
            if (Math.random() < 0.5){
                //50% chance to change to negative
                if (j==0){
                    startPos.x = (startPos.x)*(-1);
                } else if (j==1){
                    startPos.y = (startPos.y)*(-1);
                } else {
                    startPos.z = (startPos.z)*(-1);
                }
                //make negative depending on which property the loop is up to
            }
        }
        object.scale.set(0.005,0.005,0.005);
        //set the scale to very small because the objects are very large and high quality
        object.position.copy(startPos);
        //set the position to the startPos we defined
        scene.add( object );
        //add the object to the scene
        object.name = "asteroid";
        //set the name as asteroid so it can be identified
        staticobjarr.push(new Staticobjs(object, 0xffffff, 0));
        //push the asteroid to the staticobjs array
        repeats = repeats + 1;
        //one more asteroid has now been loaded
        checkAllAsteroidsLoaded();
        //check if all asteroids are loaded
        }, undefined, function ( error ) {
        console.log( 'An error happened: '+ error );
        //if there is an error, output it to the console
        }
    );
}

function checkAllAsteroidsLoaded(){
    //checks if all asteroids have been loaded
    if (repeats == 30){
        //if all are done
        sendStaticObjs();
        //update the staticObjs in the database
        //don't want to send prematurely not containing all the asteroids
        //as they load using a callback function
        //as I would have to continuously render the static objects to make sure they were all there
        //whereas this way, I only have to render them once
    }
}

const coloursarr = [0xcde8b3, 0x3987ec, 0x17ff96, 0x16a912, 0xe7df39, 0x876bf0];
//an array of valid colours for the planets

for (var i = 0; i < 2; i++){
    //create 2 planets
    var colour = coloursarr[Math.floor(Math.random()*coloursarr.length)];
    //set the colour to one from the above array
    var radius = Math.floor(Math.random()*200);
    //calculate a random radius
    const geometry = new THREE.SphereGeometry( radius, 32, 16 );
    const material = new THREE.MeshBasicMaterial( { color: colour } );
    const sphere = new THREE.Mesh( geometry, material );
    //create the threejs object from these properties
    var startPos = new THREE.Vector3(0,0,0).random().multiplyScalar(500);
        for (var j =0; j < 3; j++){
            if (Math.random() < 0.5){
                if (j==0){
                    startPos.x = (startPos.x)*(-1);
                } else if (j==1){
                    startPos.y = (startPos.y)*(-1);
                } else {
                    startPos.z = (startPos.z)*(-1);
                }
            }
        }
        //randomise the startPos of the planet to anywhere within 866 units of the player (see above for how value was calculated)
    sphere.position.copy( startPos );
    //set the startposition to the startPos we've defined
    sphere.name = "planet";
    //set the name to planet so it can be identified later on
    scene.add( sphere );
    //add it to the scene
    var planetlight = new THREE.PointLight( colour, 2, 0, 0);
    //create a pointlight of the same colour as the planet
    planetlight.position.copy( startPos );
    //place it in the centre of the planet
    planetlight.name = "planetlight";
    //set the name to planetlight so it can be identified later on
    scene.add( planetlight );
    //add it to the scene
    staticobjarr.push( new Staticobjs(sphere, colour, radius) );
    staticobjarr.push( new Staticobjs(planetlight, colour, 0) );
    //push both the planet and the planetlight to the array of static objects
}

function createEnemyShip(path, speed, rotationSpeed, health, regenerationChance){
    //loads in a TIE fighter
    loader.load(path, function ( gltf ) {
        //gets the path to the file from the arguments of the function call
        gltf.scene.scale.set(0.001,0.001,0.001);
        //sets very small as the objects are very large!
        var hitbox = new THREE.Box3().setFromObject( gltf.scene );
        //set the hitbox of the enemy initially from its dimensions
        var startPos = new THREE.Vector3(0,0,0).random().multiplyScalar(30);
        for (var i =0; i < 3; i++){
            if (Math.random() < 0.5){
                startPos[i] = -startPos[i];
            }
        }
        //pick a random start position within 52 units of the origin
        shipsarr.push(new Enemy(gltf.scene, speed, rotationSpeed, hitbox, health, startPos, regenerationChance));
        //create Enemy instance
        scene.add( gltf.scene );
        //add this object to the scene
    }, undefined, function ( error ) {
        console.error( error );
        //if there is an error, output it
    } );

}
function sendStaticObjs(){
    //a method to update the database with the static objects loaded
    var staticslim = [];
    //define an empty array
    staticobjarr.forEach(f =>{
        //for every static object
        staticslim.push({position: f.object.position, colour: f.colour, type: f.object.name, radius: f.rad});
        //add the necessary properties to the array as a JS object
    });
    staticobjarr = [];
    //empty the staticobjarr to free up memory
    let postObj = {
        objects: staticslim
    }
    //create the object to post to the database
    let post = JSON.stringify(postObj);
    //covert it to JSON
    const url = "http://" + ip + "/update_static_objects.php";
    //set the URL for the php page to handle the request
    let xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
    xhr.send(post);
    //create and send the request
    xhr.onload = function () {
        if(xhr.status != 200) {
            //do nothing
        }
    }
}




function updateWorldState(){
    //this takes properties of all objects and sends them to the database
    var shipsslim = [];
    //creates empty array
    shipsarr.forEach(s =>{
        //for each ship in the array
        if (s instanceof Enemy){
            //if the ship is of the Enemy class
            shipsslim.push({position: s.object.position.clone(), quaternion: s.object.quaternion.clone(), id: s.object.uuid});
            //push the necessary data about the ship to the array
        }
    });
    var projectilesslim = [];
    //creates empty array for projectiles
    projectilesarr.forEach(p => {
        //for each projectile
        projectilesslim.push({position: p.object.position, quaternion: p.object.quaternion, colour: p.colour, type: p.type, id: p.object.uuid});
        //push the necessary data about each projectile to the array
    });
    let postObj = {
        projectiles: projectilesslim,
        ships: shipsslim,
        camera: {position: camera.object.position.clone(), quaternion: camera.object.quaternion.clone()},
    }
    //create the JS object containing these arrays to be sent to the database
    let post = JSON.stringify(postObj);
    //convert the JS object to JSON for easy transfer
    const url = "http://" + ip + "/update_world_state.php";
    let xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
    xhr.send(post);
    //set properties for connection, and send request
    xhr.onload = function () {
        if(xhr.status === 200) {
            //do nothing
        }
    }
}

let new_req = true;
//this allows only one request to be made at a time instead of having multiple running at the same time

function retrieveOtherPlayerClicks(){
    if (new_req){
        new_req = false;
        //stop any more requests starting
        let post = mostrecentupdate;
        //get the most recent time a shot was retrieved from the data
        const url = "http://" + ip + "/get_user_action.php";
        let xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-type', 'application/json; charset=UTF-8');
        xhr.send(post);
        //set up the request and send it
        xhr.onload = function () {
            if(xhr.status === 200) {
                //if the request was a success
                try{
                    mostrecentupdate = xhr.getResponseHeader("time");
                    //get the new mostrecentupdate time from the header of the response
                    var response = JSON.parse(xhr.response);
                    //parse the JSON response back to a JS Object
                    response.forEach(row => {
                        //for each row in the response
                        var data = JSON.parse(row);
                        //parse the data for that row
                        camera.fireProjectile(0xffffff, new THREE.Quaternion(data.quaternion._x, data.quaternion._y, data.quaternion._z, data.quaternion._w));
                        //fire the projectile that the other players have requested
                    });
                } catch (exceptionVar) {
                    //do nothing if there is an error, but don't stop processing
                }
                new_req = true;
                //allow a new request to be created now
            }
        }
        
    }
    
}

function updateAllObjects(){
    //runs every screen update to update the scene
    retrieveOtherPlayerClicks();
    //gets other players shots and fires them
    projectilesarr.forEach(p =>{
        p.move();
        //moves every projectile
        p.checkForRemoval();
        //checks each projectile to see if it should be removed
    });
    shipsarr.forEach(s => {
        s.move();
        //move every ship
        s.regenerate();
        //try and regenerate some health on each ship
        s.checkForCollisions();
        //see if the hitbox has intersected with a projectile
        if (s instanceof Enemy){
            //if the ship is an enemy type
            s.checkIfTarget();
            //check if it has reached its current target
            s.attemptToFire();
            //try and fire a projectile
        } else {
            //if not an enemy
            s.rotate();
            //rotate based on mouse position
            //works solely for the player slip
        }
    });
    updateWorldState();
    //writes the new information to the database
    
}


for (var i=0; i < max_ships; i++){
    //loads as many ships as is allowed
    createEnemyShip('resources/TIE/scene.gltf', 0.06, 0.02, 4, 0.00001);
    //creates new enemy ships with the necessary properties
}


/*const canvas = document.getElementById('canvas'); 
const context = canvas.getContext('2d');
const img = new Image();
img.src = 'resources/cockpit.png';
img.onload = () => {
    context.drawImage(img, 0, 0, 3000, 1710, 0, 0, canvas.width, canvas.height);
};*/
//this is a feature I implemented in order to make the scene more immersive
//but when implemented, drew a very low quality image
//it created a cockpit view of the Millenium Falcon: image taken from this website - https://www.etsy.com/uk/listing/1229356499/millennium-falcon-cockpit-view-of-space
//can be uncommented and will work successfully but commented for the purposes of visibility when testing


function animate() {
	requestAnimationFrame( animate );
    //recursively calls itself
    updateAllObjects();
    //updates all objects
	renderer.render( scene, camera.object );
    //updates the renderer object
}
//the animate function is a key function for threejs that runs every time the screen updates to move all the objects in the scene
animate();
//call it the first time