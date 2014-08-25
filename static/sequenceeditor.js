function sequenceeditor(seq) {
  var canvas=this.__canvas=new fabric.Canvas("c");
  canvas.selection=false;
  dna=seq.seq;
  features=seq.features;

  var fontSize=10;

  function computeFontWidth(fontSize, fontFamily) {
    var testString="AGCT";
    var text=new fabric.Text(testString, {left: -100,top: -100, fontSize: fontSize, fontFamily: fontFamily});
    canvas.add(text);
    var w=text.width;
    canvas.remove(text);
    return w/testString.length;
  }

  var fontFamily="monospace";
  var fontWidth=computeFontWidth(fontSize,fontFamily);
  var leftMargin=20;
  var rightMargin=20;
  var lineSeparation=20;
  $(window).resize(function(e) {initializeDisplay();});

  var lineStructure={};
  var selection={start: 0, end: 0};
  var selecting=false;
  cursor=new fabric.Rect({left: 0, top: 2, height: fontSize, width: 1, hasControls: false,
    selectable: false, originX: 'left', originY: 'top'});

  function initializeDisplay() {
    canvas.setWidth($("#contain_canvas").width());
    var usefulCanvasWidth=canvas.width-leftMargin-rightMargin;
    lineStructure.charactersPerLine=Math.floor(usefulCanvasWidth/fontWidth);

    lineStructure.lines=Math.ceil(dna.length/lineStructure.charactersPerLine);
    canvas.setHeight(lineStructure.lines*(lineSeparation+fontSize)+fontSize);

    canvas.clear();
    var runningTop=lineSeparation;
    lineStructure.lineList=[];
    for(i=0;i<lineStructure.lines;i++){
      var start=i*lineStructure.charactersPerLine;
      var end=Math.min(dna.length,(i+1)*lineStructure.charactersPerLine);
      var subtext=dna.substring(start,end);
      var text=new fabric.Text(subtext, {left: 0, top: 0, hasControls: false, selectable: false, fontSize: fontSize, fontFamily: fontFamily,
        start: start, end: end, originX: 'left'});
      var groupSelection = new fabric.Rect({left: 0, top: 2, height: fontSize, width: 0, hasControls: false, selectable: false, opacity: 0.5});
      var group=new fabric.Group([text,groupSelection], {left: leftMargin, top: runningTop, selectable: false, start: start,
        end: end, features: []});
      canvas.add(group);
      lineStructure.lineList[i]=group;
      runningTop+=lineSeparation+fontSize;
    }
    for(i=0;i<features.length;i++){
      var feature=features[i];
      var firstLine=lineAtBase(feature.location.start);
      var lastLine=lineAtBase(feature.location.end);
      for(line=firstLine;line<=lastLine;line++) {lineStructure.lineList[line].features.push(feature);}
    }

    // figure out feature display
    for(i=0;i<lineStructure.lines;i++){
      var line=lineStructure.lineList[i];
      var lineFeatures=line.features;
      var rangeEvents=[];
      for(j=0;j<lineFeatures.length;j++){
        var feature=lineFeatures[j];
        var lineFeature={};
        rangeEvents.push({base: feature.location.start, type: "start", feature: feature, lineFeature: lineFeature});
        rangeEvents.push({base: feature.location.end, type: "end", feature: feature, lineFeature: lineFeature});
      }
      function compareRange(a,b){
        if(a.base<b.base){return -1;}
        if(a.base>b.base){return 1;}
        return 0;
      }
      rangeEvents.sort(compareRange);
      var active=[];
      var maximumCount=0;
      var currentCount=0;
      for(j=0;j<rangeEvents.length;j++){
        switch (rangeEvents[j].type) {
          case "start":
            if (currentCount==maximumCount){
              maximumCount++;
              rangeEvents[j].lineFeature.displayIndex=active.length;
              active[active.length]=true;
            }
            else {
              for (k=0;k<active.length;k++){
                if (!active[k]) {
                  rangeEvents[j].lineFeature.displayIndex=k;
                  active[k]=true;
                  break;
                }
              }
            }
            //var featureDisplay=drawFeature(rangeEvents[j].lineFeature,rangeEvents[j].feature);

            var leftOffset=line.item(0).left;
            var topOffset=line.item(0).top;
            //var featureDisplay=new fabric.Rect({left: leftOffset+30*rangeEvents[j].lineFeature.displayIndex, top: 2+topOffset+fontSize*(1+rangeEvents[j].lineFeature.displayIndex),
            //  width: 10, height: fontSize, hasControls: false, selectable: false, originX: 'left', originY: 'top'});
            var featureDisplay=drawFeature(rangeEvents[j],line);
            line.add(featureDisplay);
            currentCount++;
            break;
          case "end":
            currentCount--;
            active[rangeEvents[j].lineFeature.displayIndex]=false;
            break;
        }

      }
      line.totalHeight=fontSize*(maximumCount+1);
      if(i>0){
        var previousLine=lineStructure.lineList[i-1];
        line.top=previousLine.top+previousLine.totalHeight;
      }
    }
    updateSelection();
  }

  function drawFeature(rangeEvent,line) {
    var lineFeature=rangeEvent.lineFeature;
    var feature=rangeEvent.feature;
    var leftOffset=line.item(0).left;
    var topOffset=line.item(0).top;
    var start=Math.max(feature.location.start, line.start)-line.start;
    var end=Math.min(feature.location.end, line.end)-line.start;
    var width=end-start;
    //alert("start: "+feature.location.start+" line start: "+line.start);
    return new fabric.Rect({left: leftOffset+fontWidth*start, top: 2+topOffset+fontSize*(1+lineFeature.displayIndex), width: width*fontWidth, height: fontSize,
      hasControls: false, selectable: false, originX: 'left', originY: 'top'});

  }

  fabric.util.addListener(document.getElementById('contain_canvas'), 'scroll', function() {canvas.calcOffset();});
  function lineAtBase(base) {return Math.floor(base/lineStructure.charactersPerLine);}
  function groupAtBase(base) {return lineStructure.lineList[lineAtBase(base)];}
  function getBase(X,reference) {return reference.start+Math.floor((X-reference.left)/fontWidth);}

  initializeDisplay();

  function updateSelection() {
    if (cursor.group) {cursor.group.remove(cursor);}
    var sortedStart=Math.min(selection.start,selection.end);
    var sortedEnd=Math.max(selection.start,selection.end);
    for(i=0;i<lineStructure.lines;i++) {
      var group=lineStructure.lineList[i];
      group.originX='left';
      var groupSelection=group.item(1);
      var leftOffset=group.item(0).left;
      if (group.start>sortedEnd || group.end<sortedStart) {
        groupSelection.left=leftOffset;
        groupSelection.width=0;
        continue;
      }

      var lineLeft=Math.max(0,sortedStart-group.start);
      var lineRight=Math.min(group.end-group.start,sortedEnd-group.start);
      groupSelection.left=lineLeft*fontWidth+leftOffset;
      groupSelection.width=(lineRight-lineLeft)*fontWidth;
    }
    var cursorGroup=groupAtBase(selection.end);
    cursorGroup.add(cursor);
    var leftOffset=cursorGroup.item(0).left;
    var topOffset=cursorGroup.item(0).top;
    cursor.left=leftOffset+(selection.end-cursorGroup.start)*fontWidth;
    cursor.top=topOffset+2;
    cursor.group=cursorGroup;
    canvas.renderAll();
  }
  canvas.on("mouse:down", function(options) {
    if (options.target) {
      selecting=true;
      selection.end=getBase(options.e.offsetX,options.target);
      if(!options.e.shiftKey) {selection.start=selection.end;}
      updateSelection();
    }
  });
  canvas.on("mouse:move", function(options) {
    if (selecting && options.target) {
      selection.end=getBase(options.e.offsetX,options.target);
      updateSelection();
      canvas.renderAll();
    }
  });
  canvas.on("mouse:up", function(options) {
    selecting=false;
  });
  setInterval(function(){
    cursor.width=(1-cursor.width);
    canvas.renderAll();
  },600);

  var canvasElement=document.getElementById('contain_canvas');
  canvasElement.tabIndex=1000;
  canvasElement.addEventListener("keydown",doKeyDown,false);

  function doKeyDown(e) {
    document.onkeydown=function(e) {
      var moved=true;
      switch (e.keyCode) {
        case 37: selection.end=Math.max(0,selection.end-1);break;
        case 38: selection.end=Math.max(0,selection.end-lineStructure.charactersPerLine);break;
        case 39: selection.end=Math.min(selection.end+1,dna.length);break;
        case 40: selection.end=Math.min(selection.end+lineStructure.charactersPerLine,dna.length);break;
        break;
        default: moved=false;
      }
      if(moved) {
        e.preventDefault();
        if (!e.shiftKey) {selection.start=selection.end;}
        updateSelection();
      }
    }
  }
}