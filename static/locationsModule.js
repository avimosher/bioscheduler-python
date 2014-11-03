var locationsModule=(function() {
	var module={};

	module.locations=function(sceneJson) {
		var $accordion=$("#accordion");
		var $header=$('<h3/>',{text: "Babylon"});
		var $div=$('<div/>',{class: 'tab_container locations', id: "babylon_container"});
		var babylonContainerName="babylon";
		//var containCanvas=$('<canvas/>',{id: babylonContainerName});
		//containCanvas.appendTo($div);
		$accordion.append([$header,$div]);
		$accordion.accordion('refresh');
		$accordion.accordion("option","active",-1);

		//var sceneJson=JSON.parse(sceneString);
		var WIDTH=$div.width();
		var HEIGHT=$div.height();
		//var scene=new THREE.Scene();
		var renderer=new THREE.WebGLRenderer({antialias: true});
		renderer.setSize(WIDTH,HEIGHT);
		renderer.shadowMapEnabled = true;
		renderer.shadowMapSoft = true;
		renderer.shadowMapType = THREE.PCFShadowMap;
		renderer.shadowMapAutoUpdate = true;
		renderer.setClearColor(0xffffff, 1);
		$div[0].appendChild(renderer.domElement);
		var VIEW_ANGLE=60;
		var ASPECT=WIDTH/HEIGHT;

		var loader=new THREE.ObjectLoader();
		var scene=loader.parse(sceneJson);

		var directionalLight = new THREE.DirectionalLight( 0xb8b8b8 );
		directionalLight.position.set(1, 1, 1).normalize();
		directionalLight.intensity = 1.0;
		scene.add( directionalLight );
		
		directionalLight = new THREE.DirectionalLight( 0xb8b8b8 );
		directionalLight.position.set(-1, 0.6, 0.5).normalize();
		directionalLight.intensity = 0.5;
		scene.add(directionalLight);

		directionalLight = new THREE.DirectionalLight();
		directionalLight.position.set(-0.3, 0.6, -0.8).normalize( 0xb8b8b8 );
		directionalLight.intensity = 0.45;
		scene.add(directionalLight);


		var boundingBox=new THREE.Box3();
		console.log(boundingBox);
		console.log(boundingBox.makeEmpty());
		console.log(boundingBox);
		for (var i=0;i<scene.children.length;i++) {
			var child=scene.children[i];
			if (child.geometry) {
				var box=new THREE.Box3();
				box.setFromObject(child);
				boundingBox.union(box);
			}
		}
		console.log(boundingBox);

		var domainSize=boundingBox.size();
		var domainCenter=boundingBox.center();

		var midPlane=domainCenter.y;
		

		var fovDegrees=60;
		var fovRadians=fovDegrees*Math.PI/180;
		var cameraHeight=domainSize.z/2/Math.tan(fovRadians/2);
		console.log(cameraHeight);
		var NEAR=.01;
		var FAR=NEAR+2*cameraHeight;


		var camera=new THREE.CombinedCamera(WIDTH,HEIGHT,fovDegrees,NEAR,FAR,.1,.1+2*cameraHeight);
		var orbit=new THREE.OrbitControls(camera,$div[0]);
		camera.position.z=0;
		camera.position.x=0;
		camera.position.y=cameraHeight;
		camera.position.add(domainCenter);
		var target=domainCenter;
		camera.up=new THREE.Vector3(0,0,1);
		camera.lookAt(target);
		orbit.target=target;
		camera.updateProjectionMatrix();
		camera.toOrthographic();

		function render() {
			requestAnimationFrame(render);
			TWEEN.update();
			camera.lookAt(target);
			camera.updateProjectionMatrix();
			//console.log(camera.cameraP.position);
			renderer.render(scene,camera);
		}

		renderer.domElement.addEventListener('mousedown',function(evt) {
			evt.preventDefault();
			var mouse={x: (evt.offsetX/WIDTH)*2-1, y: -(evt.offsetY/HEIGHT)*2+1};
			var vector=new THREE.Vector3(mouse.x,mouse.y,.5);
			console.log(scene);
			vector.unproject(camera);
			var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
			var intersects = raycaster.intersectObjects( scene.children, true );
			if ( intersects.length > 0 ) {
				camera.toPerspective();

				var cameraTarget=intersects[0].object.position;
				//cameraTarget=new THREE.Vector3(0,0,-1);
				//cameraTarget.applyMatrix4(camera.matrixWorld);

				var position=new THREE.Vector3().copy(cameraTarget);
				position.x+=5;
				console.log(position);
				new TWEEN.Tween(camera.position).to({
					x: position.x,
					y: position.y,
					z: position.z
				}, 600).easing(TWEEN.Easing.Sinusoidal.InOut).start();
				
				
				new TWEEN.Tween(target).to({
					x: cameraTarget.x,
					y: cameraTarget.y,
					z: cameraTarget.z
				}, 600).easing(TWEEN.Easing.Sinusoidal.InOut).start();
				console.log(cameraTarget);
				new TWEEN.Tween(camera.up).to({
					x: 0, y: 1, z: 0
				},600).easing(TWEEN.Easing.Sinusoidal.InOut).start();
				
				console.log(intersects);
			}

		},false);
		render();
	}

	return module;
}());	
