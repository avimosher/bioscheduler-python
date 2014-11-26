define('alignment',['jquery','kinetic'],function($,kinetic) {
	var alignment={}

	alignment.openItem=function(seq, sequencePath) {
		var $accordion=$("#accordion");
		var $header=$('<h3/>',{text: "Alignment"});
		var $div=$('<div/>',{class: 'tab_container'}).css({position: 'relative'});
		var $list=$('<select/>',{size: 5});
		var $leftdiv=$('<div/>',{class: 'alignment'}).width('20%');
		$leftdiv.append($list);
		var $rightwrapper=$('<div/>').width('70%').css({'overflow-x': 'auto'});
		var $rightdiv=$('<div/>',{class: 'alignment'});
		$rightdiv.css({'white-space': 'nowrap','overflow': 'auto'});
		$rightwrapper.append($rightdiv);
		$div.append($leftdiv);
		$div.append($rightwrapper);
		$accordion.append([$header,$div]);
		$accordion.accordion('refresh');
		$accordion.accordion("option","active",-1);
		var $datatable=$('#example').dataTable();
		var contents=[];
		var direction=[];
		$div.droppable({
			drop: function(evt,ui) {
			    if (evt.shiftKey) {
				direction.push(-1);
			    }
			    else {
				direction.push(1);
			    }
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

		function fixedWidth(s) {
		    var width=15;
		    var blankChar=String.fromCharCode(9617);
		    if (s.length>width) {
			s=s.substring(0,width);
		    }
		    while (s.length<width) {
			s+=blankChar;
		    }
		    s+=blankChar+blankChar+blankChar;
		    return s;
		}

		$div.on('dblclick',function() {
			$.ajax({
				url: 'align',
				    type: 'POST',
				    datatype: 'json',
				    data: {
				    sequences: contents,
				    directions: direction,
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
					    $rightdiv.append($p);
					    var $namep=$('<p/>',{'class': 'alignmentSequence'}).text(fixedWidth(property));
					    $leftdiv.append($namep);
					}
				    }
				    var identityString="";
				    var length=strings[0].length;
				    for(var i=0;i<length;i++){
					var cs=[];
					for(var s=0;s<strings.length;s++){
					    var c=strings[s].charAt(i);
					    cs.push(c);
					}
					var echar=String.fromCharCode(9608);
					if(cs.length>0){
					    var c=cs[0];
					    for(var s=1;s<cs.length;s++){
						if (c!=cs[s]){
						    echar=String.fromCharCode(9617);
						    break;
						}
					    }
					}
					identityString+=echar;
				    }
				    var $p=$('<p/>',{'class': 'alignmentSequence'}).text(identityString);
				    $rightdiv.append($p);
				    var $namep=$('<p/>',{'class': 'alignmentSequence'}).text(fixedWidth(""));
				    $leftdiv.append($namep);
				    $list.remove();
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