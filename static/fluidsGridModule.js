var fluidsGridModule=(function() {
	var module={};

	function cellIterator(dimensions) {
		var currentIndex=Array.apply(null,new Array(dimensions.length)).map(Number.prototype.valueOf,0);
		var iterator={};
		iterator.nextIndex=function() {
			var dimension=0;
			currentIndex[0]++;
			for (var dimension=1;dimension<dimensions.length && currentIndex[dimension-1]==dimensions[dimension-1];dimension++) {
				currentIndex[dimension-1]=0;
				currentIndex[dimension]++;
			}}
		iterator.currentIndex=function() {return currentIndex.slice(0);}
		iterator.valid=function() {return currentIndex[dimensions.length-1]<dimensions[dimensions.length-1];}
		return iterator;
	}

	function faceIterator(g,d) {
		var currentIndex=numeric.rep([g.dimensions.length],0);//Array.apply(null,new Array(dimensions.length)).map(Number.prototype.valueOf,0);
		var iterator={};
		iterator.nextIndex=function() {
			var dimension=0;
			currentIndex[0]++;
			for (var dimension=1;dimension<g.dimensions.length && currentIndex[dimension-1]==g.dimensions[dimension-1]+(dimension-1==d?1:0);dimension++) {
				currentIndex[dimension-1]=0;
				currentIndex[dimension]++;
			}}
		iterator.currentIndex=function() {return {index: currentIndex.slice(0), axis: d};}
		iterator.valid=function() {return currentIndex[g.dimensions.length-1]<g.dimensions[g.dimensions.length-1]+(g.dimensions.length-1==d?1:0);}
		return iterator;
	}

	function grid(dimensions) {
		this.dimensions=dimensions;
		this.cells=function() {
			var product=this.dimensions[0];
			for (var i=1;i<this.dimensions.length;i++){product*=this.dimensions[i];}
			return product;};
		this.faces=function() {
			var sum=0;
			for (var d=0;d<this.dimensions.length;d++){
				var dimensionIndices=this.dimensions.slice(0);
				dimensionIndices[d]++;
				var product=dimensionIndices[0];
				for (var i=1;i<dimensionIndices.length;i++){product*=dimensionIndices[i];}
				sum+=product;
			}
			return sum;
		}
	}

	module.fluidsGrid=function() {
		var $accordion=$("#accordion");
		var $header=$('<h3/>',{text: "Fluids Grid"});
		var $div=$('<div/>',{class: 'tab_container', id: "fluidsgrid_container"});
		var fluidsGridContainerName="fluidsgrid";
		var containCanvas=$('<div/>',{class: 'contain_canvas',id: fluidsGridContainerName});
		containCanvas.appendTo($div);
		$accordion.append([$header,$div]);
		$accordion.accordion('refresh');
		$accordion.accordion("option","active",-1);

		var stage=new Kinetic.Stage({container: fluidsGridContainerName, width: 800, height: 600});
		var fontSize=10;
		var fontFamily='monospace';
		var featureLayer=new Kinetic.Layer();
		var tooltipLayer=new Kinetic.Layer();

		var cellSize=35;
		var m=5;
		var n=4;
		var g=new grid([m,n],cellSize);
		var maxHeight=n*cellSize;
		var maxWidth=m*cellSize;

		var makeGrid=function(layer) {
			for (var i=0;i<m+1;i++) {
				var I=i*cellSize;
				var line=new Kinetic.Line({stroke: "black", points: [I, 0, I, maxHeight]});
				layer.add(line);}
			for (var j=0;j<n+1;j++) {
				var J=j*cellSize;
				var line=new Kinetic.Line({stroke: "black", points: [0, J, maxWidth, J]});
				layer.add(line);}}
		makeGrid(featureLayer);

		var iterator=faceIterator(g,1);
		var velocities=numeric.random([m+1,n]);
		for (;iterator.valid();iterator.nextIndex()) {
			var faceIndex=iterator.currentIndex();
			var index=faceIndex.index;
			var I=index[0]*cellSize;
			var J=(index[1]+.5)*cellSize;
			var V=10*(velocities[index[0]][index[1]]);
			var velocityLine=new Kinetic.Line({stroke: "black", points: [I, J, I+V, J]});
			featureLayer.add(velocityLine);}
		stage.add(featureLayer);

		var makeCellIndexMap=function(g) {
			var cellToIndexMap=numeric.rep(g.dimensions,0);
			var indexToCellMap=numeric.rep(g.cells(),[-1,-1]);
			var currentIndex=0;
			for (var iterator=cellIterator(g.dimensions);iterator.valid();iterator.nextIndex()) {
				var index=iterator.currentIndex();
				indexToCellMap[currentIndex]=index;
				cellToIndexMap[index[0]][index[1]]=currentIndex++;
			}
			return {indexToCell: indexToCellMap, cellToIndex: cellToIndexMap};
		}
		var makeFaceIndexMap=function(g) {
			var faceToIndexMap=numeric.rep([g.dimensions.length],0);
			alert(g.faces());
			var indexToFaceMap=numeric.rep([g.faces()],{});
			var currentIndex=0;
			for (var d=0;d<g.dimensions.length;d++) {
				var sliceDimension=g.dimensions.slice(0);
				sliceDimension[d]++;
				faceToIndexMap[d]=numeric.rep(sliceDimension,-1);
				for (var iterator=faceIterator(g,d);iterator.valid();iterator.nextIndex()) {
					var faceIndex=iterator.currentIndex();
					var index=faceIndex.index;
					indexToFaceMap[currentIndex]=faceIndex;
					faceToIndexMap[d][index[0]][index[1]]=currentIndex++;
					console.log(index);
				}
			}
			return {indexToFace: indexToFaceMap, faceToIndex: faceToIndexMap};
		}
		var cellIndexMap=makeCellIndexMap(g);
		console.log(cellIndexMap);
		var faceIndexMap=makeFaceIndexMap(g);
		console.log(faceIndexMap);

	}
	return module;
}());