require.config({
	paths: {
		'datatables': 'jquery-ui/jquery.dataTables',
		'jquery-ui': 'jquery-ui/jquery-ui'
	},
	urlArgs: "bust="+(new Date()).getTime()
});

require({

}, ['require', 'jquery', 'datatables', 'jquery-ui', 'tween.min', 'three/OrbitControls', 'three/CombinedCamera', 'three.min', 'three/threex.dynamictexture'], function(req, $) {
	var objectloaders={};


	$(function () {
		function getCookie(name) {
		    var cookieValue = null;
		    if (document.cookie && document.cookie != '') {
		        var cookies = document.cookie.split(';');
		        for (var i = 0; i < cookies.length; i++) {
		            var cookie = jQuery.trim(cookies[i]);
		            // Does this cookie string begin with the name we want?
		            if (cookie.substring(0, name.length + 1) == (name + '=')) {
		                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
		                break;}}}
		    return cookieValue;}

		var csrftoken = getCookie('csrftoken');

		var objectloader=function(moduleName,item) {
			req([moduleName],function(module) {
				$.ajax({
				  url: module.loadURL,
				  type: 'POST',
				  datatype: 'json',
				  data: {
				    name: item.name,
				    csrfmiddlewaretoken: csrftoken},
				  beforeSend: function(xhr) {
				    xhr.setRequestHeader("Accept", "application/json");
				    xhr.setRequestHeader("X-CSRFToken", csrftoken);},
				  success: function(result) {
				  	console.log(module);
				  	module.openItem(result,item);},
				  error: function(XMLHttpRequest,textStatus,errorThrown) {
				    alert("Status: " + textStatus); alert("Error: " + errorThrown);}});});
		};

		var objectlocater=function(moduleName,item) {
			req([moduleName],function(module) {
				$.ajax({
				  url: module.loadURL,
				  type: 'POST',
				  datatype: 'json',
				  data: {
				    name: item.name,
				    csrfmiddlewaretoken: csrftoken},
				  beforeSend: function(xhr) {
				    xhr.setRequestHeader("Accept", "application/json");
				    xhr.setRequestHeader("X-CSRFToken", csrftoken);},
				  success: function(result) {
				  	console.log(result);
				  	module.askForLocation(result.location);},
				  error: function(XMLHttpRequest,textStatus,errorThrown) {
				    alert("Status: " + textStatus); alert("Error: " + errorThrown);}});})
			
		};

		var icons={header: "ui-icon-close"};
		$('#accordion').accordion({
		  heightStyle: "fill",
		  collapsible: true,
		  icons: icons});


		$.ajax({
		  url: "getlist",
		  type: "POST",
		  headers: {
		    'Accept': 'application/json',
		    'Content-Type': 'application/json'},          
		  beforeSend: function(xhr) {
		    xhr.setRequestHeader("Accept", "application/json");
		    xhr.setRequestHeader("Content-Type", "application/json");
		    xhr.setRequestHeader("X-CSRFToken", csrftoken);},
		  success: function(seqList) {
		    $('#demo').html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="example"></table>' );
		    $('#example').dataTable( {
		      "data" : seqList,
		      "columns": [
		      { "title": "Name"},
		      { "title": "Length", "class": "center"},
		      { "title": "Sequence"},
		      { "title": "Extension"},
		      { "title": "Complementary"},
		      { "title": "Function"}],
		      "columnDefs": [
		      { "targets": [2], "visible": false},
		      { "targets": [3], "visible": false},
		      { "targets": [4], "visible": false},
		      { "targets": [5], "visible": false}
		      ],
		      "createdRow": function(row,data,dataIndex) { $(row).addClass("inventoryItem");}});
		    var datatable=$('#example').dataTable();
		    $('#example tbody').on('dblclick', 'tr', function(evt) {
		      var name=datatable.fnGetData(this,0);
		      var fnName=datatable.fnGetData(this,5);
		      if (evt.shiftKey) {objectlocater(fnName,{name: name});}
		      else {objectloader(fnName,{name: name});}
		    });
		    //$('#example > tbody > tr').draggable({
		    $(datatable.fnGetNodes()).draggable({
		      //containment: "#outer",
		      helper: function(event) {
		        var _this=$(this);
		        var name=$('td',this).eq(0).text();
		        var new_ele=$('<div class="inventoryItem">'+name+'</div>');
		        return new_ele.clone();},
		      appendTo: 'body'});}});
	});
})