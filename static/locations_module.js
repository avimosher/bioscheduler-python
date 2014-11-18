define(function() {
	var module={loadURL: 'getlocation', locateURL: 'getitem'};

	var currentLocation;
	var target;
	var camera;
	var scene;

	function targetObject(object,target,camera) {
		camera.toPerspective();
		var cameraTarget=object.position;
		var position=new THREE.Vector3().copy(cameraTarget);
		position.x+=5;
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
	}

	module.askForLocation=function(location) {
		console.log(location);
		var object=scene.getObjectByName(location);
		camera.toPerspective();
		var cameraTarget=object.position;
		targetObject(object,target,camera);
	};

	module.openItem=function(sceneJson) {
		var $accordion=$("#accordion");
		var $header=$('<h3/>',{text: "Babylon"});
		var $div=$('<div/>',{class: 'tab_container locations', id: "babylon_container"});
		$div.css({overflow: 'auto'});
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
		scene=loader.parse(sceneJson);

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

		var domainSize=boundingBox.size();
		var domainCenter=boundingBox.center();
		target=new THREE.Vector3();
		target.copy(domainCenter);

		var fovDegrees=60;
		var fovRadians=fovDegrees*Math.PI/180;
		var cameraHeight=domainSize.z/2/Math.tan(fovRadians/2);
		var NEAR=.01;
		var FAR=NEAR+2*cameraHeight;


		camera=new THREE.CombinedCamera(WIDTH,HEIGHT,fovDegrees,NEAR,FAR,.1,.1+2*cameraHeight);
		//var orbit=new THREE.OrbitControls(camera,$div[0]);

		var basePosition=new THREE.Vector3(0,cameraHeight,0);
		basePosition.add(domainCenter);
		camera.position.copy(basePosition);
		camera.up=new THREE.Vector3(0,0,1);
		camera.lookAt(target);
		//orbit.target=target;
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

		for (var i=0;i<scene.children.length;i++) {
			var object=scene.children[i];
			if (object.geometry) {
				var dynamicTexture=new THREEx.DynamicTexture(512,512);
				dynamicTexture.context.font="bolder 90px Verdana";
				dynamicTexture.clear('grey').drawText(object.name,undefined,256,'red');
				dynamicTexture.texture.needsUpdate=true;
				var material=new THREE.MeshBasicMaterial({
					map: dynamicTexture.texture
				});
				object.material=material;
			}
		}

		var $datatable=$('#example').dataTable();

		var $renderer=$(renderer.domElement);
		$renderer.droppable({
			drop: function(evt, ui) {
				var rawMouse={x: evt.clientX-$renderer.offset().left, y: evt.clientY-$renderer.offset().top};
				var mouse={x: (rawMouse.x/WIDTH)*2-1, y: -(rawMouse.y/HEIGHT)*2+1};
				var vector=new THREE.Vector3(mouse.x,mouse.y,.5);	
			var ray;
				if (camera.inOrthographicMode) {
					var secondVector=new THREE.Vector3(mouse.x,mouse.y,-1);
					secondVector.unproject(camera);
					vector.unproject(camera);
					vector.sub(secondVector);
					ray=new THREE.Raycaster(secondVector,vector.normalize());
				}
				else {
					vector.unproject(camera);
					ray=new THREE.Raycaster(camera.position,vector.sub(camera.position).normalize());
				}
				var intersects=ray.intersectObjects(scene.children, true);
				if (intersects.length > 0) {
					console.log(intersects[0].object);
					updatelocation($datatable.fnGetData(ui.draggable),intersects[0].object.name);
				}
			}
		});
		renderer.domElement.addEventListener('dblclick',function(evt) {
			evt.preventDefault();
			camera.toOrthographic();
			new TWEEN.Tween(camera.position).to({
				x: basePosition.x, y: basePosition.y, z: basePosition.z
			},600).easing(TWEEN.Easing.Sinusoidal.InOut).start();
			new TWEEN.Tween(target).to({
				x: domainCenter.x, y: domainCenter.y, z: domainCenter.z
			},600).easing(TWEEN.Easing.Sinusoidal.InOut).start();
			new TWEEN.Tween(camera.up).to({
				x: 0, y: 0, z: 1
			},600).easing(TWEEN.Easing.Sinusoidal.InOut).start();
		});
		renderer.domElement.addEventListener('click',function(evt) {
			evt.preventDefault();
			var mouse={x: (evt.offsetX/WIDTH)*2-1, y: -(evt.offsetY/HEIGHT)*2+1};
			var vector=new THREE.Vector3(mouse.x,mouse.y,.5);
			vector.unproject(camera);
			var raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
			var intersects = raycaster.intersectObjects( scene.children, true );
			if ( intersects.length > 0 ) {
				targetObject(intersects[0].object.position,target,camera);
			}

		},false);
		render();
	}

	return module;
});	
