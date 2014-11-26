define('alignment',['jquery','kinetic'],function($,kinetic) {
	var alignment={}

	alignment.openItem=function(seq, sequencePath) {
		var $accordion=$("#accordion");
		var $header=$('<h3/>',{text: "Alignment"});
		var $div=$('<div/>',{class: 'tab_container alignment'});
		var $list=$('<select/>',{size: 5});
		$div.append($list);
		$div.css({'white-space': 'nowrap','overflow': 'auto'});
		$accordion.append([$header,$div]);
		$accordion.accordion('refresh');
		$accordion.accordion("option","active",-1);
		var $datatable=$('#example').dataTable();
		var contents=[];
		$div.droppable({
			drop: function(evt,ui) {
			    var fields=$datatable.fnGetData(ui.draggable);
			    $list.append($('<option/>').text(fields[0]).val(fields[0]));
			    contents.push(fields[0]);
			}
		    });

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
		var csrftoken=getCookie('csrftoken');

		$div.on('dblclick',function() {
			$.ajax({
				url: 'align',
				    type: 'POST',
				    datatype: 'json',
				    data: {
				    sequences: contents,
					csrfmiddlewaretoken: csrftoken},
				    beforeSend: function(xhr) {
				    xhr.setRequestHeader("Accept", "application/json");
				    xhr.setRequestHeader("X-CSRFToken", csrftoken);},
				    success: function(job) {
				    var strings=[];
				    for (var property in job) {
					if (job.hasOwnProperty(property)) {
					    strings.push(job[property]);
					    var $p=$('<p/>',{'class': 'alignmentSequence'}).text(job[property]);
					    $div.append($p);
					}
				    }
				    console.log(strings);
				    var identityString="";
				    var length=strings[0].length;
				    for(var i=0;i<length;i++){
					var c=strings[0].charAt(i);
					var echar=String.fromCharCode(9608);
					for(var s=1;s<strings.length;s++){
					    if (c!=strings[s].charAt(i)) {
						echar=String.fromCharCode(9617);
						break;
					    }
					}
					if(i==1207) {
					    console.log(strings[0].charAt(i));
					    console.log(strings[1].charAt(i));
					    console.log(echar);
					}
					identityString+=echar;
				    }
				    var $p=$('<p/>',{'class': 'alignmentSequence'}).text(identityString);
				    $div.append($p);
				    },
				    error: function(XMLHttpRequest,textStatus,errorThrown) {
				    alert("Status: " + textStatus); alert("Error: " + errorThrown);
				}
			    });
		    }
		    
		    );
	}

	return alignment;
    });