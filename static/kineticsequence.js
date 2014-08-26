function sequenceeditor(seq) {
  dna=seq.seq;
  features=seq.features;

  var stage=new Kinetic.Stage({container: 'contain_canvas', width: 300, height: 200});
  var firstLayer=new Kinetic.Layer();
  //stage.add(firstLayer);
  var fontSize=10;
  var fontFamily='monospace';

  function computeFontWidth(fontSize, fontFamily) {
    var testString="AGCT";
    var text=new Kinetic.Text({text: testString, x: -100,y: -100, fontSize: fontSize, fontFamily: fontFamily});
    firstLayer.add(text);
    var w=text.getWidth();
    firstLayer.remove(text);
    return w/testString.length;
  }
  var fontWidth=computeFontWidth(fontSize, fontFamily);

  var leftMargin=20;
  var rightMargin=20;
  var lineSeparation=20;
  $(window).resize(function(e) {initializeDisplay();});

  var lineStructure={};
  var selection={start: 0, end: 0};
  var selecting=false;
  var cursor=new Kinetic.Rect({x: 0, y: 2, height: fontSize, width: 1, fill: 'black'});

  function initializeDisplay() {
    stage.setWidth($("#contain_canvas").width());
    var usefulCanvasWidth=stage.getWidth()-leftMargin-rightMargin;
    lineStructure.charactersPerLine=Math.floor(usefulCanvasWidth/fontWidth);

    lineStructure.lines=Math.ceil(dna.length/lineStructure.charactersPerLine);
    stage.setHeight(lineStructure.lines*(lineSeparation+fontSize)+fontSize);

    //canvas.clear();
    var runningTop=lineSeparation;
    lineStructure.lineList=[];
    for(i=0;i<lineStructure.lines;i++){
      var start=i*lineStructure.charactersPerLine;
      var end=Math.min(dna.length,(i+1)*lineStructure.charactersPerLine);
      var subtext=dna.substring(start,end);
      var text=new Kinetic.Text({text: subtext, x: 0, top: 0, fontSize: fontSize, fontFamily: fontFamily, fill: 'black'});
      var groupSelection = new Kinetic.Rect({x: 0, y: 2, height: fontSize, width: 0, opacity: 0.5, fill: 'black'});
      var group=new Kinetic.Group({x: leftMargin, y: runningTop});
      group.start=start;
      group.end=end;
      group.features=[];
      groupSelection.name='selection';
      group.add(groupSelection);
      group.add(text);

      group.on("mousedown", function(options) {
        selecting=true;
        selection.end=getBase(options.evt.offsetX,this);
        if(!options.evt.shiftKey) {selection.start=selection.end;}
        updateSelection();
      });
      group.on("mousemove", function(options) {
        if (selecting) {
          selection.end=getBase(options.evt.offsetX,this);
          updateSelection();
        }
      });
      group.on("mouseup", function() {
        selecting=false;
      });

      firstLayer.add(group);
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
      line.totalHeight=groupHeight(line);
      if(i>0){
        var previousLine=lineStructure.lineList[i-1];
        var position=line.position();
        var previousPosition=previousLine.position();
        position.y=previousPosition.y+previousLine.totalHeight;
        line.position(position);
      }
    }
    updateSelection();
  }

  function drawFeature(rangeEvent,line) {
    var lineFeature=rangeEvent.lineFeature;
    var feature=rangeEvent.feature;
    var start=Math.max(feature.location.start, line.start)-line.start;
    var end=Math.min(feature.location.end, line.end)-line.start;
    var width=end-start;
    return new Kinetic.Rect({x: fontWidth*start, y: 2+fontSize*(1+lineFeature.displayIndex), width: width*fontWidth, height: fontSize, fill: 'grey', stroke: 'black'});
  }

  function groupHeight(group) {
    var children=group.getChildren();
    var height=0;
    for(var i=0;i<children.length;i++){
      height=Math.max(height,children[i].position().y+children[i].getHeight());
    }
    return height;
  }

  function lineAtBase(base) {return Math.floor(base/lineStructure.charactersPerLine);}
  function groupAtBase(base) {return lineStructure.lineList[lineAtBase(base)];}
  function getBase(X,reference) {return reference.start+Math.floor((X-reference.position().x)/fontWidth);}

  function filterSelection(node) {return node.name==='selection';}

  function updateSelection() {
    cursor.remove();
    var sortedStart=Math.min(selection.start,selection.end);
    var sortedEnd=Math.max(selection.start,selection.end);
    for(i=0;i<lineStructure.lines;i++) {
      var group=lineStructure.lineList[i];
      var groupSelection=group.getChildren(filterSelection)[0];
      if (group.start>sortedEnd || group.end<sortedStart) {
        groupSelection.position({x: 0, y: 2});
        groupSelection.setWidth(0);
        continue;
      }
      var lineLeft=Math.max(0,sortedStart-group.start);
      var lineRight=Math.min(group.end-group.start,sortedEnd-group.start);
      groupSelection.position({x: lineLeft*fontWidth,y: 2});
      groupSelection.setWidth((lineRight-lineLeft)*fontWidth);
    }
    var cursorGroup=groupAtBase(selection.end);
    cursorGroup.add(cursor);
    cursor.position({x: (selection.end-cursorGroup.start)*fontWidth, y: 2});
    firstLayer.draw();
  }


  stage.add(firstLayer);
  initializeDisplay();


  setInterval(function(){
    cursor.setWidth(1-cursor.getWidth());
    firstLayer.draw();
  },600);
  var canvasElement=$('#contain_canvas')[0];
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

  firstLayer.draw();
}