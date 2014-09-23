function molarityCalculator() {
	var $header=$('<h3/>');
	$('<div/>', {text: "Molarity Calculator"}).css({'float': 'left'}).appendTo($header);
	var $iconSpan=$('<span/>',{'class': 'ui-icon ui-icon-closethick', position: 'absolute'});
	$iconSpan.on('click', function(e) {
		var $h3parent=$(this).closest('h3');
		$h3parent.next('div').remove();
		$h3parent.remove();
		e.stopPropagation();
	})
	$iconSpan.appendTo($header);
	var $div=$('<div/>', {id: "molarityCalculator", class: "tab_container"});
	$div.append(["Mass: ",$('<input/>')]);
	var concentrations=['femtomolar','picomolar','nanomolar','micromolar','millimolar','molar'];
	var $selectConcentration=$('<select/>');
	concentrations.forEach(function(value,index,array) {
		$('<option/>', {value: value, text: value}).appendTo($selectConcentration);
	});

	$selectConcentration.appendTo($div);
	$("#accordion").append([$header, $div]);
	$("#accordion").accordion('refresh');
	$("#accordion").accordion("option","active",-1);

}