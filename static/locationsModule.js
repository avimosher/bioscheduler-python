var locationsModule=(function() {
	var module={};

	module.locations=function() {
		var $accordion=$("#accordion");
		var $header=$('<h3/>',{text: "Babylon"});
		var $div=$('<div/>',{class: 'tab_container', id: "babylon_container"});
		var babylonContainerName="babylon";
		var containCanvas=$('<canvas/>',{id: babylonContainerName});
		containCanvas.appendTo($div);
		$accordion.append([$header,$div]);
		$accordion.accordion('refresh');
		$accordion.accordion("option","active",-1);

		var canvas=containCanvas[0];
		var engine=new BABYLON.Engine(canvas,true);
		var scene=new BABYLON.Scene(engine);
		//var camera = new BABYLON.ArcRotateCamera("Camera", 0, Math.PI / 2, 13, BABYLON.Vector3.Zero(), scene);
		//camera.attachControl(canvas, false);
		var camera=new BABYLON.FreeCamera("FreeCamera", new BABYLON.Vector3.Zero(), scene);
		camera.mode=BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
		camera.orthoTop=1;
		camera.orthoBottom=-1;
		camera.orthoLeft=-1;
		camera.orthoRight=1;
		camera.attachControl(canvas, false);
		var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
		var knot = BABYLON.Mesh.CreateTorusKnot("mesh", 2, 0.5, 128, 64, 2, 50, scene);
		var material = new BABYLON.StandardMaterial("mat", scene);
		knot.material = material;
		material.diffuseColor = new BABYLON.Color3(1.5, 0, 0);
		var renderLoop = function () {
		scene.render();
		};
		engine.runRenderLoop(renderLoop);
		var alpha = 0;
		knot.scaling.y = 1.5;
		
		scene.beforeRender = function() {
		knot.rotation.y = alpha;
		  
		alpha += 0.03;
		
		};
	}

	return module;
}());	