<?xml version="1.0" encoding="UTF-8" ?>
<%@ page language="java" contentType="text/html; charset=UTF-8"
    pageEncoding="ISO-8859-1"%>

<%@taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>

<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<title>All Smartphones</title>
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
<script type="text/javascript">
   
    $(document).ready(function() {
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    var csrftoken = getCookie('csrftoken');

    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    $.ajaxSetup({
    	beforeSend: function(xhr, settings) {
    		alert('be safe');
    		if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
    			xhr.setRequestHeader("X-CSRFToken", csrftoken);
    		}
    	}
    });

    $("#buttonclick").click(function(event) {
    var json= {"producer": "Samsung", "model": "RAZR", "price" : 50};

    	$.ajax({
    		url: "create",
    	  	type: "POST",
    	  	data: JSON.stringify(json),
    	  	headers: {
    	  		'Accept': 'application/json',
    	  		'Content-Type': 'application/json'
    	  	},			  	
    	  	beforeSend: function(xhr) {
    	  		xhr.setRequestHeader("Accept", "application/json");
    	  		xhr.setRequestHeader("Content-Type", "application/json");
    			xhr.setRequestHeader("X-CSRFToken", csrftoken);
    	  	},
    	  	
    	  	success: function(smartphone) {
    	  		alert("success");
    	  		var respContent = "";
    	  		var rowToDelete = $(event.target).closest("tr");
    	  		
    	  		rowToDelete.remove();
    	  		
    	  		respContent += "<span class='success'>Smartphone was created: [";
    	  		respContent += smartphone.producer + " : ";
    	  		respContent += smartphone.model + " : " ;
    	  		respContent += smartphone.price + "]</span>";
    	  		alert(smartphone.producer);
    	  		$("#sPhoneFromResponse").html(respContent);
    	  	}
    	});
    
    	event.preventDefault();
    });
       
});   
</script>

</head>
<body>
<div id="create_container>
<form:form id="newSmartphoneform" action="${pageContext.request.contextPath}/smartphones/create.json" commandName="sPhone">
<input id="buttonclick" type="submit" value="Create" />
</form:form>
</div>
<div id="container">
<h1>All Smartphones</h1>
<div>
<p>Here you can see a list of Smartphones:</p>
<div id="sPhoneFromResponse"></div>
</div>
	<table border="1px" cellpadding="0" cellspacing="0">
	<thead>
	<tr>
	<th>Producer</th><th>Model</th><th>Price</th><th>Actions</th>
	</tr>
	</thead>
	<tbody>
	<c:forEach var="sPhone" items="${smartphones}">
	<tr>
	<td>${sPhone.producer}</td>
	<td>${sPhone.model}</td>
	<td>${sPhone.price}</td>
	<td>
	<a href="${pageContext.request.contextPath}/smartphones/edit/${sPhone.id}.json">Edit</a><br/>
	<a href="${pageContext.request.contextPath}/smartphones/delete/${sPhone.id}.json">Delete</a><br/>
	</td>
	</tr>
	</c:forEach>
	</tbody>
	</table>

<a href="${pageContext.request.contextPath}/index.html">Home page</a>
</div>
</body>
</html>
