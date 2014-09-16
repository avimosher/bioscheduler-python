[
	'jquery.ui.touch-punch-0.2.2.min.js',
	'lib/jsBezier-0.6.js',
	'lib/biltong-0.2.js',
	'util.js',
	'browser-util.js',
	'dom-adapter.js',
	'jsPlumb.js',
	'endpoint.js',
	'connection.js',
	'anchors.js',
	'defaults.js',
	'connectors-bezier.js',
	'connectors-statemachine.js',
	'connectors-flowchart.js',
	'connector-editors.js',
	'renderers-svg.js',
	'renderers-vml.js',
	'jquery.jsPlumb.js',
	'demo.js'
].forEach(function(src) {
	var script=document.createElement('script');
	script.src=staticPath+"jsPlumb/"+src;
	script.async=false;
	document.head.appendChild(script);
});