define(['jquery','locations_module'],function($,locations) {
	var module={};

	module.loadURL='getitem';

	module.askForLocation=function(location) {
		locations.askForLocation(location);
	};

	module.openItem=function(item,itemName) {
		console.log(locations);	
		var $accordion=$("#accordion");
		var $header=$('<h3/>',{text: "Babylon"});
		var $div=$('<div/>',{class: 'tab_container item'});
		var babylonContainerName="babylon";
		$accordion.append([$header,$div]);
		$accordion.accordion('refresh');
		$accordion.accordion("option","active",-1);

		var $table=$('<table/>');
		for (var key in item) {
			var $tr=$("<tr/>");
			$tr.append($('<td/>',{text: key}));
			$tr.append($('<td/>').append($('<input/>',{value: item[key]})));
			$table.append($tr);
		}
		$div.append($table);
	}

	return module;
});	