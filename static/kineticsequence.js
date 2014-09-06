function sequenceeditor(seq) {
  dna=seq.seq;
  features=seq.features;

  var html="<h3>"+seq.name+"</h3><div class='tab_container' id='"+seq.name+"_container'><p id='"+seq.name+"_tm'>Tm: </p><br><div class='contain_canvas' id='"+seq.name+"'/></div>";
  $("#accordion").accordion('destroy');
  $("#accordion").append(html);
  $("#accordion").accordion({
      heightStyle: "fill",
      collapsible: true
    });
  //var stage=new Kinetic.Stage({container: 'contain_canvas', width: 300, height: 200});
  var containCanvas=$("#"+seq.name);
  var stage=new Kinetic.Stage({container: seq.name, width: 300, height: 200});
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
  var lineSeparation=1.5*fontSize;
  $(window).resize(function(e) {initializeDisplay();});

  var lineStructure={};
  var selection={start: 0, end: 0};
  var selecting=false;
  var cursor=new Kinetic.Rect({x: 0, y: 2, height: fontSize, width: 1, fill: 'black'});

  function initializeDisplay() {
    stage.setWidth($("#"+seq.name).width());
    var usefulCanvasWidth=stage.getWidth()-leftMargin-rightMargin;
    lineStructure.charactersPerLine=Math.floor(usefulCanvasWidth/fontWidth);

    lineStructure.lines=Math.ceil(dna.length/lineStructure.charactersPerLine);

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

      lineStructure.lineList[i]=group;
      runningTop+=lineSeparation+fontSize;
    }
    for(i=0;i<features.length;i++){
      var feature=features[i];
      var firstLine=lineAtBase(feature.location.start);
      var lastLine=lineAtBase(feature.location.end);
      for(line=firstLine;line<=lastLine;line++) {lineStructure.lineList[line].features.push(feature);}
    }

    var runningHeight=0;
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
      line.totalHeight=groupHeight(line)+lineSeparation;
      runningHeight+=line.totalHeight;
      var backgroundRect=new Kinetic.Rect({x: 0, y: 0, width: groupWidth(line), height: line.totalHeight, opacity: .1, fill: 'grey'});
      line.add(backgroundRect);
      backgroundRect.moveToBottom();

      if(i>0){
        var previousLine=lineStructure.lineList[i-1];
        var position=line.position();
        var previousPosition=previousLine.position();
        position.y=previousPosition.y+previousLine.totalHeight;
        line.position(position);
      }
    }
    for(i=0;i<lineStructure.lines;i++){
      var group=lineStructure.lineList[i];
      group.index=i;
      group.on("mousedown", function(options) {
        selecting=true;
        selection.end=getBase(options.evt.offsetX,this);
        if(!options.evt.shiftKey) {selection.start=selection.end;}
        updateSelection();
      });
      group.on("selectmove", function(options) {
        if (selecting) {
          selection.end=getBase(options.evt.offsetX,this);
          updateSelection();
        }
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
      group.moveToTop();
    }
    stage.setHeight(runningHeight+lineSeparation);
    updateSelection();
  }

  function drawFeature(rangeEvent,line) {
    var lineFeature=rangeEvent.lineFeature;
    var feature=rangeEvent.feature;
    var start=Math.max(feature.location.start, line.start)-line.start;
    var end=Math.min(feature.location.end, line.end)-line.start;
    var width=end-start;
    var featureGroup=new Kinetic.Group({x: fontWidth*start, y: 2+(6+fontSize)*(1+lineFeature.displayIndex)});
    featureGroup.add(new Kinetic.Rect({x: 0, y: 0, width: width*fontWidth, height: fontSize+2, fill: 'cornsilk', stroke: 'black'}));
    featureGroup.add(new Kinetic.Text({text: feature.qualifiers.label[0], x: 0, y: 2, width: width*fontWidth, fontSize: fontSize,
      fontFamily: 'Times New Roman', fill: 'black', align: 'center'}));
    return featureGroup;
  }

  function groupHeight(group) {
    if (group.getChildren === 'undefined'){
      return group.getHeight();
    }
    var children=group.getChildren();
    var height=0;
    for(var gi=0;gi<children.length;gi++){
      height=Math.max(height,children[gi].position().y+children[gi].getHeight());//groupHeight(children[i]));
    }
    return height;
  }
  function groupWidth(group) {
    if (group.getChildren === 'undefined'){
      return group.getWidth();
    }
    var children=group.getChildren();
    var width=0;
    for(var gi=0;gi<children.length;gi++){
      width=Math.max(width,children[gi].position().x+children[gi].getWidth());
    }
    return width;
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
      groupSelection.setHeight(group.totalHeight);
    }
    var cursorGroup=groupAtBase(selection.end);
    cursorGroup.add(cursor);
    cursor.position({x: (selection.end-cursorGroup.start)*fontWidth, y: 2});
    firstLayer.draw();
    var currentSelection=dna.substring(selection.start,selection.end);
    var displayText="";
    $("#"+seq.name+"_tm").css({fontSize: fontSize});
    if (currentSelection.length>8) {
      displayText="Tm: "+meltingTemperature(currentSelection);
    }
    else {
      displayText="Tm:";
    }
    displayText+=" Length: "+currentSelection.length;
    $("#"+seq.name+"_tm").text(displayText);
  }

  stage.add(firstLayer);
  initializeDisplay();

  setInterval(function(){
    cursor.setWidth(1-cursor.getWidth());
    firstLayer.draw();
  },600);
  var canvasElement=$("#"+seq.name+"_container")[0];
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
  $("#accordion").accordion("option","active",-1);

  var mousePos;
  var container=$("#"+seq.name+"_container");
  var mousePosHandler=function(event) {
    mousePos = {x: event.clientX, y: event.clientY};
  };

  var mouseScrollTimer;
  $(window).mouseup(function() {
    selecting=false;
    clearInterval(mouseScrollTimer);
    $(window).unbind("mousemove", mousePosHandler);
    console.log("unbound");
  });

  $("#"+seq.name).mouseleave(function(event) {
    if(selecting){
      $(window).bind("mousemove", mousePosHandler);
      mouseScrollTimer=setInterval(function(){
        var top=container.position().top;
        var bottom=top+container.outerHeight(true);
        var eventX=mousePos.x;
        var eventY=Math.max(top+10,Math.min(bottom-10,mousePos.y));
        var offsetX=eventX-containCanvas.position().left;
        var offsetY=eventY-containCanvas.position().top;//+container.scrollTop();
        var clickEvent={'evt': {
            'clientX': eventX,
            'clientY': eventY,
            'offsetX': eventX,
            'offsetY': eventY
          }
        };
        console.log("top: "+top+" bottom: "+bottom+" eventX: "+eventX+" eventY: "+eventY+" offsetX: "+offsetX+" offsetY: "+offsetY+" mousePos.y: "+mousePos.y);
        if(mousePos.y>bottom){
          container.scrollTop(10+container.scrollTop()); 
          firstLayer.getIntersection({x: eventX, y: eventY}).fire('selectmove',clickEvent,true);
        }
        if(mousePos.y<top){
          container.scrollTop(-10+container.scrollTop()); 
          firstLayer.getIntersection({x: eventX, y: eventY}).fire('selectmove',clickEvent,true);
        }
        //firstLayer.draw();
      },100);
    }
  });

  function meltingTemperature(seq) {
    var salt=50;
    var ct=500/1000.0; // concentration in uM
    var dmso=0;
    var meth=1;
    tmc = NEB.createTmCalc({
      seq: seq,
      ct: ct,
      salt: salt,
      method: meth,
      dmso: dmso
    });
    t1 = Math.round(tmc.Tm().tm * 10) / 10;
    return t1;
  }
}