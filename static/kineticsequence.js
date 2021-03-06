define('kineticsequence',['jquery','tmcalc_support','kinetic','kinetic.editable','sms/sms_common','sms/sms_genetic_codes'],function($,NEB,kinetic,editable,sms,sms_genetic) {
  var kinetictest={};
  editable.init(kinetictest);
  console.log(window.Kinetic);
  console.log(sms_genetic);
  var module={loadURL: 'getsequence'};

  module.activeSequences={};

  module.openItem=function (seq, sequencePath) {
    var activeIndex=module.activeSequences[seq.name];
    var $accordion=$("#accordion");
    if (typeof activeIndex!='undefined') {
      $accordion.accordion("option","active",activeIndex);
      return;}
    var dna=seq.seq;
    var originalFeatures=seq.features;
    var newFeatures=[];

    for (var i=0;i<originalFeatures.length;i++) {
      var feature=originalFeatures[i];
      if (!feature.complementaryLocation) {
        feature.complementaryLocation={};
        for (var k in feature.location){feature.complementaryLocation[k]=feature.location[k];}}
      if (!feature.nonComplementaryExtent) {feature.nonComplementaryExtent=0;}
      if (feature.location.strand==1) {feature.location.start=feature.complementaryLocation.start-feature.nonComplementaryExtent;}
      else {feature.location.end=feature.complementaryLocation.end+feature.nonComplementaryExtent;}}

    var $header=$('<h3/>',{text: seq.name});
    var $div=$('<div/>',{class: 'tab_container', id: seq.name+"_container"});
    var outerContainer=$('<p/>',{id: seq.name+"_tm", text: "Tm: "});
    outerContainer.appendTo($div);
    var findBox=$('<input/>',{id: seq.name+"_find"});
    findBox.appendTo($div);
    findBox.on('input',function(evt) {
      var pasteData=findBox.val().toUpperCase().replace(/\s+/g,'');
      var forwardIndex=dna.indexOf(pasteData);
      if (forwardIndex>-1) {
        selection.start=forwardIndex;
        selection.end=forwardIndex+pasteData.length;}
      else {
        var reverseIndex=dna.indexOf(sms.reverse(sms.complement(pasteData)));
        if (reverseIndex>-1) {
          selection.end=reverseIndex;
          selection.start=reverseIndex+pasteData.length;}}
      updateSelection();
    });
    $('<br>').appendTo($div);
    var containCanvas=$('<div/>',{class: 'contain_canvas',id: seq.name});
    containCanvas.appendTo($div);
    module.activeSequences[seq.name]=$accordion.children("h3").length;
    $accordion.append([$header,$div]);
    $accordion.accordion('refresh');
    $accordion.accordion("option","active",module.activeSequences[seq.name]);

    var stage=new Kinetic.Stage({container: seq.name, width: 300, height: 200});
    var fontSize=10;
    var fontFamily='monospace';
    var featureLayer=new Kinetic.Layer();
    var tooltipLayer=new Kinetic.Layer();
    var selectionLayer=new Kinetic.Layer();

    function addFeature(foundIndex, row, complementarySequence, strand) {
      if (foundIndex==-1) {return;}
      var feature={};
      feature.location={};
      feature.location.start=foundIndex;
      feature.location.end=foundIndex+complementarySequence.length;
      if (row[3] && row[4]){
        feature.complementaryLocation={start: foundIndex, end: foundIndex+row[4].length};
        feature.nonComplementaryExtent=row[3].length;
        if(strand==1){
          feature.nonComplementaryLocation={start: foundIndex-row[3].length, end: foundIndex};
          feature.location={start: feature.nonComplementaryLocation.start, end: feature.complementaryLocation.end};}
        else {
          feature.nonComplementaryLocation={start: foundIndex+complementarySequence.length, end: foundIndex+complementarySequence.length+row[3].length};
          feature.location={start: feature.complementaryLocation.start, end: feature.nonComplementaryLocation.end};}}
      else {
        feature.complementaryLocation={start: foundIndex, end: foundIndex+row[2].length};
        feature.location=feature.complementaryLocation;}
      feature.location.strand=strand;
      feature.featureFill='lime';
      feature.qualifiers={};
      feature.qualifiers.label=[row[0]];
      originalFeatures.push(feature);}

    function adjustFeature(feature,start,end,replacementLength) {
      if (feature.location.start>=start && feature.location.end<=end) {return false;}
      if (feature.location.start<=start && feature.location.end<=start) {return true;}
      if (feature.location.start>=end && feature.location.end>=end) {
        updateFeature(feature,complementaryEnd(feature)+replacementLength-(end-start),complementaryExtent(feature),nonComplementaryExtent(feature));
        return true;}

      if (feature.complementaryLocation.start<=start && feature.complementaryLocation.end>=end) {
        feature.complementaryLocation.end+=replacementLength-(end-start);}
      else if (feature.complementaryLocation.start<=start && feature.complementaryLocation.end<=end) {
        feature.complementaryLocation.end=start;}
      else if (feature.complementaryLocation.start>=start && feature.complementaryLocation.end>=end) {
        feature.complementaryLocation.start=start+replacementLength;
        feature.complementaryLocation.end+=replacementLength-(end-start);}
      rectifyFeature(feature);
      return true;}
    function paste(text) {
      // replace the selection
      var sortedStart=Math.min(selection.start,selection.end);
      var sortedEnd=Math.max(selection.start,selection.end);
      var before=dna.substring(0,sortedStart);
      var after=dna.substring(sortedEnd,dna.length)
      dna=before+text+after;
      // fix features
      for (var i=0;i<originalFeatures.length;i++) {
        feature=originalFeatures[i];
        if(!adjustFeature(feature,sortedStart,sortedEnd,text.length)) {
          originalFeatures.slice(i);
          i--;}}
      initializeDisplay();
      selection.start=sortedStart;
      selection.end=selection.start+text.length;
      updateSelection();}
    outerContainer.on('copy', function(evt) {
      var copyData=dna.substring(selection.start,selection.end);
      evt.originalEvent.clipboardData.setData("Text", copyData);
      evt.preventDefault();});
    outerContainer.on('paste', function(evt) {
      var pasteData=evt.originalEvent.clipboardData.getData("Text").toUpperCase().replace(/\s+/g,'');
      paste(pasteData);
      /*var forwardIndex=dna.indexOf(pasteData);
      if (forwardIndex>-1) {
        selection.start=forwardIndex;
        selection.end=forwardIndex+pasteData.length;
      }
      else {
        var reverseIndex=dna.indexOf(reverse(complement(pasteData)));
        if (reverseIndex>-1) {
          selection.end=reverseIndex;
          selection.start=reverseIndex+pasteData.length;
        }
      }
      updateSelection();*/
      evt.preventDefault();});
    containCanvas.on("save", function() {
      originalFeatures=originalFeatures.concat(newFeatures);
      newFeatures=[];
      var sequence={seq: dna, features: originalFeatures, name: seq.name};
      savesequence(sequence,sequencePath.name);});
    containCanvas.on("mapoligos", function() {
      $.each($("#example").dataTable().fnGetData(), function(i, row) {
        if (row[2]) {
          var complementarySequence=row[2];
          if(row[4]) {complementarySequence=row[4];}
          var foundIndex=dna.indexOf(complementarySequence);
          addFeature(foundIndex,row,complementarySequence,1);
          var reverseComplement=sms.reverse(sms.complement(sms.getSequenceFromFasta(complementarySequence)));
          var reverseFoundIndex=dna.indexOf(reverseComplement);
          addFeature(reverseFoundIndex,row,complementarySequence,-1);}});
      initializeDisplay();});
    containCanvas.on("saveprimers", function() {
      var featuresWithSequence=[];
      for (var i=0;i<newFeatures.length;i++) {
        var feature=newFeatures[i];
        featuresWithSequence.push({complementary: complementarySequence(feature,dna),
          nonComplementary: nonComplementarySequence(feature,dna),
          name: getLabel(feature)});}
      saveoligos(featuresWithSequence,function() {
        originalFeatures=originalFeatures.concat(newFeatures);
        newFeatures=[];
        initializeDisplay();
      });});
    containCanvas.on("createfeature", function() {
      if (selection.start==selection.end) {return;}
      var strand=1;
      var feature={type: 'primer'};
      if(selection.end>selection.start) {
        feature.location={start: selection.start, end: selection.end, strand: 1};
        feature.complementaryLocation={start: selection.start, end: selection.end};}
      else {
        feature.location={start: selection.end, end: selection.start, strand: -1};
        feature.complementaryLocation={start: selection.end, end: selection.start};}
      feature.nonComplementaryExtent=0;
      feature.qualifiers={};
      feature.qualifiers.label=['test'];
      newFeatures.push(feature);
      initializeDisplay();});
    containCanvas.on("deletefeature", function(input,params) {
      console.log(params);
    });

    var fontWidth=computeFontWidth(featureLayer, fontSize, fontFamily);

    var leftMargin=20;
    var rightMargin=20;
    var lineSeparation=1.5*fontSize;
    $(window).resize(function(e) {initializeDisplay();});

    var lineStructure={};
    var selection={start: 0, end: 0};
    var selecting=false;
    var cursor=new Kinetic.Rect({x: 0, y: 0, height: fontSize, width: 1, fill: 'black', listening: false});

    function initializeDisplay() {
      featureLayer.destroy();
      featureLayer=new Kinetic.Layer();
      tooltipLayer.destroy();
      tooltipLayer=new Kinetic.Layer();
      selectionLayer.destroy();
      selectionLayer=new Kinetic.Layer();
      stage.setWidth(containCanvas.width());
      var usefulCanvasWidth=stage.getWidth()-leftMargin-rightMargin;
      lineStructure.charactersPerLine=Math.floor(usefulCanvasWidth/fontWidth);
      lineStructure.lines=Math.ceil(dna.length/lineStructure.charactersPerLine);
      var features=originalFeatures.concat(newFeatures);

      var runningTop=lineSeparation;
      lineStructure.lineList=[];
      for(i=0;i<lineStructure.lines;i++){
        var start=i*lineStructure.charactersPerLine;
        var end=Math.min(dna.length,(i+1)*lineStructure.charactersPerLine);
        var subtext=dna.substring(start,end);
        var text=new Kinetic.Text({text: subtext, x: 0, top: 0, fontSize: fontSize, fontFamily: fontFamily, fill: 'black'});
        var groupSelection=new Kinetic.Rect({x: 0, y: 0, height: fontSize, width: 0, opacity: 0.5, fill: 'black', listening: false});
        var groupTranslation=new Kinetic.Text({text: "", x: 0, y: 0, fontSize: fontSize, fontFamily: fontFamily, fill: 'blue'});

        var group=new Kinetic.Group({x: leftMargin, y: runningTop});
        group.groupType='parent';
        group.start=start;
        group.end=end;
        group.features=[];
        groupSelection.name='selection';
        group.translation=groupTranslation;
        group.add(groupSelection);
        group.add(groupTranslation);
        group.add(text);

        lineStructure.lineList[i]=group;
        runningTop+=lineSeparation+fontSize;}
      for(i=0;i<features.length;i++){
        var feature=features[i];
        feature.index=i;
        var firstLine=lineAtBase(feature.location.start);
        var lastLine=lineAtBase(feature.location.end);
        for(line=firstLine;line<=lastLine;line++) {
          var lineInfo=lineStructure.lineList[line];
          lineInfo.features.push(feature);}}

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
          rangeEvents.push({base: feature.location.end, type: "end", feature: feature, lineFeature: lineFeature});}
        function compareRange(a,b){
          if(a.base<b.base){return -1;}
          if(a.base>b.base){return 1;}
          return 0;}
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
                active[active.length]=true;}
              else {
                for (k=0;k<active.length;k++){
                  if (!active[k]) {
                    rangeEvents[j].lineFeature.displayIndex=k;
                    active[k]=true;
                    break;}}}
              var featureDisplay=drawFeature(rangeEvents[j],line);
              line.add(featureDisplay);
              currentCount++;
              break;
            case "end":
              currentCount--;
              active[rangeEvents[j].lineFeature.displayIndex]=false;
              break;}}
        line.translation.position({y: groupHeight(line), x: 0});
        line.totalHeight=groupHeight(line)+lineSeparation;
        runningHeight+=line.totalHeight;
        var backgroundRect=new Kinetic.Rect({x: 0, y: 0, width: groupWidth(line), height: line.totalHeight, opacity: .1, fill: 'grey', listening: false});
        line.add(backgroundRect);
        backgroundRect.moveToBottom();

        if(i>0){
          var previousLine=lineStructure.lineList[i-1];
          var position=line.position();
          var previousPosition=previousLine.position();
          position.y=previousPosition.y+previousLine.totalHeight;
          line.position(position);}}
      for(i=0;i<lineStructure.lines;i++){
        var group=lineStructure.lineList[i];
        group.index=i;
        group.on("mousedown", function(options) {
          // kind of ugly trick for selection.  Won't work in IE.
          // http://stackoverflow.com/questions/985272/selecting-text-in-an-element-akin-to-highlighting-with-your-mouse
          var s=window.getSelection();
          r=document.createRange();
          r.selectNodeContents(outerContainer[0]);
          s.removeAllRanges();
          s.addRange(r);
        	if(options.evt.which==1){
            var offsetX=(options.evt.offsetX || options.evt.clientX - $(options.evt.target).offset().left);
            containCanvas.focus();
            selecting=true;
            selection.end=getBase(offsetX,this);
      	    if(!options.evt.shiftKey) {selection.start=selection.end;}
      	    updateSelection();
        	}});
        group.on("selectmove", function(options) {
          if (selecting) {
            var offsetX=(options.evt.offsetX || options.evt.clientX - $(options.evt.target).offset().left);
            selection.end=getBase(offsetX,this);
            updateSelection();
          }});
        group.on("mousemove", function(options) {
          if (selecting) {
            var offsetX=(options.evt.offsetX || options.evt.clientX - $(options.evt.target).offset().left);
            selection.end=getBase(offsetX,this);
            updateSelection();
          }});
        group.on("mouseup", function() {selecting=false;});
        featureLayer.add(group);
        group.moveToTop();}
      stage.setHeight(runningHeight+lineSeparation);
      stage.add(featureLayer);
      stage.add(tooltipLayer);
      stage.add(selectionLayer);
      updateSelection();}

    function drawFeature(rangeEvent,line) {
      var lineFeature=rangeEvent.lineFeature;
      var feature=rangeEvent.feature;
      var strand=feature.location.strand;
      var start=Math.max(feature.location.start, line.start)-line.start;
      var end=Math.min(feature.location.end, line.end)-line.start;
      var featureRange=[Math.max(0,line.start-feature.location.start),
            Math.min(feature.location.end-feature.location.start,line.end-feature.location.start)];
      var width=end-start;
      var nonComplementaryLocation={start: line.start, end: line.start};
      if (feature.nonComplementaryExtent) {
        nonComplementaryLocation={start: strand==1?(feature.complementaryLocation.start-feature.nonComplementaryExtent):feature.complementaryLocation.end,
          end: strand==1?feature.complementaryLocation.start:(feature.complementaryLocation.end+feature.nonComplementaryExtent)};}
      var lineNonComplementaryStart=Math.max(nonComplementaryLocation.start, line.start)-line.start;
      var lineNonComplementaryEnd=Math.min(Math.max(line.start,nonComplementaryLocation.end), line.end)-line.start;
      var nonComplementaryExtent=lineNonComplementaryEnd-lineNonComplementaryStart;

      var endCapWidth=10;
      var featureGroup=new Kinetic.Group({x: fontWidth*start, y: 2+(6+fontSize)*(1+lineFeature.displayIndex), feature: feature});
      var featureFill='cornsilk';
      if (feature.featureFill) {featureFill=feature.featureFill;}
      var leftCapOffset=0;
      var endCapTipX=width*fontWidth;
      var endCapBaseX=endCapTipX-endCapWidth;
      var featureEndX=fontWidth*nonComplementaryExtent;
      var lineNonComplementaryStart=0;
      var lineNonComplementaryWidth=fontWidth*nonComplementaryExtent;
      if (feature.location.strand==-1) {
        leftCapOffset=endCapWidth;
        endCapBaseX=endCapWidth;
        endCapTipX=0;
        featureEndX=width*fontWidth-lineNonComplementaryWidth;
        lineNonComplementaryStart=width*fontWidth-lineNonComplementaryWidth;}

      var shape=new Kinetic.Shape({
        sceneFunc: function(context) {
          context.beginPath();
          context.moveTo(endCapTipX, fontSize/2+1);
          context.lineTo(endCapBaseX,0);
          context.lineTo(featureEndX,0);
          context.lineTo(featureEndX,fontSize+2);
          context.lineTo(endCapBaseX,fontSize+2);
          context.closePath();
          context.fillStrokeShape(this);
        },
        fill: featureFill,
        stroke: 'black',
        shadowColor: 'black',
        shadowBlur: 2,
        shadowOffset: {x: 2, y:2},
        shadowOpacity: .5});
      var nonComplementaryFill='pink';
      var nonComplementaryShape=new Kinetic.Rect({
        listening: false,
        x: lineNonComplementaryStart,
        width: lineNonComplementaryWidth,
        y: 0,
        height: fontSize+2,
        fill: nonComplementaryFill,
        stroke: 'black',
        shadowColor: 'black',
        shadowBlur: 2,
        shadowOffset: {x: 2, y: 2},
        shadowOpacity: .5});
      var tooltip=new Kinetic.Label({x: 0, y: 0, opacity: .75});
      var tooltipTag=new Kinetic.Tag({
        fill: 'honeydew',
        stroke: '#333',
        shadowColor: 'black',
        shadowBlur: 10,
        shadowOffset: [20, 40],
        shadowOpacity: .9,
        lineJoin: 'round',
        pointerDirection: 'up',
        pointerWidth: 20,
        pointerHeight: 10,
        cornerRadius: 5});
      tooltip.add(tooltipTag);
      tooltip.add(new Kinetic.Text({x: 0, y: 0, padding: 5, fill: 'black', fontSize: fontSize, fontFamily: 'Times New Roman', text: getLabel(feature)}));
      tooltipTag._useBufferCanvas=function() {return false;}; //fix for slow shadow handling in Chrome
      shape._useBufferCanvas=function() {return false;}; //fix for slow shadow handling in Chrome
      nonComplementaryShape._useBufferCanvas=function() {return false;}; //fix for slow shadow handling in Chrome
      featureGroup.add(shape);
      featureGroup.add(nonComplementaryShape);
      var textGroup=new Kinetic.Group({x: 0, y: 0, clip: {x: 0, y: -1, width: 1000, height: fontSize+4}});
      var text=new Kinetic.EditableText({text: getLabel(feature), x: leftCapOffset, y: 2, width: width*fontWidth-endCapWidth, fontSize: fontSize,
        fontFamily: 'Times New Roman', fill: 'black', align: 'center'});
      text.on('dblclick', function(options) {
        var $textarea=$('<textarea/>',{text: getLabel(feature), rows: 1});
        var position=text.getAbsolutePosition();
        $textarea.css({position: 'absolute', left: position.x, top: position.y, 'z-index': 1000, 'font-family': 'Times New Roman', 'font-size': fontSize});
        containCanvas.children().first().append($textarea);
        $textarea.focus();
        options.cancelBubble=true;
        $textarea.focusout(function() {
          setLabel(feature,$textarea.val());
          $textarea.remove();
          initializeDisplay();});
        $textarea.on('keypress', function(evt) {
          if (evt.which==13) {
            evt.preventDefault();
            setLabel(feature,$textarea.val());
            $textarea.remove();
            initializeDisplay();}});});
      textGroup.add(text);
      featureGroup.add(textGroup);
      tooltipLayer.add(tooltip);
      featureGroup.tooltip=tooltip;
      tooltip.hide();
      featureGroup.selectFeature=function(focus,strand) {
        selection.start=feature.location.start;
        selection.end=feature.location.end;
        if(focus=='start'){
          selection.start=complementaryEnd(feature);
          selection.end=complementaryStart(feature);}
        else if (focus=='noncomplementary_start') {
          selection.start=nonComplementaryEnd(feature);
          selection.end=nonComplementaryStart(feature);}
        else if (focus=='noncomplementary_end') {
          selection.start=nonComplementaryStart(feature);
          selection.end=nonComplementaryEnd(feature);}
        else if (focus=='end') {
          selection.start=complementaryStart(feature);
          selection.end=complementaryEnd(feature);}
        updateSelection();}
      featureGroup.on('click', function(evt) {this.selectFeature();});
      featureGroup.on('mousedown', function(options) {
        var parentGroup=getParentGroup(this);
        var offsetX=(options.evt.offsetX || options.evt.clientX - $(options.evt.target).offset().left);
        var clickedBase=getBase(offsetX,parentGroup);
        var selectFeatureOptions=[];
        if (options.evt.ctrlKey) {
          originalFeatures.splice(feature.index);
          initializeDisplay();
          options.evt.preventDefault();
          return;}
        if (options.evt.shiftKey) {
          var nonComplementaryStartOffset=Math.abs(clickedBase-nonComplementaryStart(feature));
          var nonComplementaryEndOffset=Math.abs(clickedBase-nonComplementaryEnd(feature));
          selectFeatureOptions.push({offset: nonComplementaryStartOffset, type: 'noncomplementary_start'});
          selectFeatureOptions.push({offset: nonComplementaryEndOffset, type: 'noncomplementary_end'});}
        else {
          var startOffset=Math.abs(clickedBase-complementaryStart(feature));
          var endOffset=Math.abs(clickedBase-complementaryEnd(feature));
          selectFeatureOptions.push({offset: startOffset, type: 'start'});
          selectFeatureOptions.push({offset: endOffset, type: 'end'});}
        var baseThreshold=8;
        for (var i=0;i<selectFeatureOptions.length;i++) {
          var featureOption=selectFeatureOptions[i];
          if (featureOption.offset<baseThreshold) {
            this.selectFeature(featureOption.type,strand);
            options.cancelBubble=true;
            selecting=true;
            this.selectionType=featureOption.type;
            containCanvas.bind('mouseup', featureGroup.mouseUpHandler);
            shape.setFill('red');
            break;}}});
      featureGroup.mouseUpHandler=function() {
        var indexFeature=feature;
        var newComplementaryLength=complementaryExtent(feature);
        var newComplementaryEnd=complementaryEnd(feature);
        var newNonComplementaryLength=indexFeature.nonComplementaryExtent;
        switch (featureGroup.selectionType) {
          case 'end':
            newComplementaryEnd=selection.end;
          case 'start':
            newComplementaryLength=Math.abs(selection.start-selection.end);
            break;
          case 'noncomplementary_end':
            newComplementaryLength=Math.abs(complementaryEnd(feature)-selection.end);
          case 'noncomplementary_start':
            newNonComplementaryLength=Math.abs(selection.start-selection.end);
            break;}
        updateFeature(indexFeature,newComplementaryEnd,newComplementaryLength,newNonComplementaryLength);
        containCanvas.unbind('mouseup', featureGroup.mouseUpHandler);
        initializeDisplay();};
      function nearFeatureBoundary(base,feature) {
        var startOffset=Math.abs(base-feature.location.start);
        var endOffset=Math.abs(base-feature.location.end);
        var baseThreshold=8;
        if(startOffset<baseThreshold) {
          return true;}
        else if (endOffset<baseThreshold) {
          return true;}
        if (feature.nonComplementaryLocation) {
          var centerOffset=Math.abs(base-feature.nonComplementaryLocation.end);
          if (typeof centerOffset != 'undefined' && centerOffset<baseThreshold) {
            return true;}}
        return false;}
      featureGroup.on('mousemove', function(options) {
        var evt=options.evt;
        var cursorType='default';
        if (evt.shiftKey) {
          var offsetX=(evt.offsetX || evt.clientX - $(evt.target).offset().left);
          var parentGroup=getParentGroup(this);
          var clickedBase=getBase(offsetX,parentGroup);
          if (nearFeatureBoundary(clickedBase,feature)){
            cursorType='pointer';}}
        document.body.style.cursor=cursorType;
        var mousePos=stage.getPointerPosition();
        this.tooltip.setPosition({x: mousePos.x, y: mousePos.y+5});
        this.tooltip.show();
        tooltipLayer.draw();});
      featureGroup.on('mouseout', function() {
        document.body.style.cursor='default';
        this.tooltip.hide();
        tooltipLayer.draw();});
      return featureGroup;}

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
          groupSelection.position({x: 0, y: 0});
          groupSelection.setWidth(0);
          group.translation.setText("");
          continue;}
        var lineLeft=Math.max(0,sortedStart-group.start);
        var lineRight=Math.min(group.end-group.start,sortedEnd-group.start);
        groupSelection.position({x: lineLeft*fontWidth,y: 0});
        groupSelection.setWidth((lineRight-lineLeft)*fontWidth);
        groupSelection.setHeight(group.totalHeight);
        group.translation.position({x: lineLeft*fontWidth});
        var startOffset=(Math.max(sortedStart,group.start)-sortedStart)%3;
        //var endOffset=(Math.min(sortedEnd,group.end)-sortedStart)%3;
        var lineText=dna.substring(Math.max(sortedStart,group.start)-startOffset,Math.min(sortedEnd,group.end)+3);
        group.translation.setText(translate(lineText).substring(startOffset,lineText.length-3));
      }
      var cursorGroup=groupAtBase(selection.end);
      cursorGroup.add(cursor);
      cursor.position({x: (selection.end-cursorGroup.start)*fontWidth, y: 0});
      featureLayer.draw();
      var currentSelection=dna.substring(selection.start,selection.end);
      var displayText="";
      containCanvas.trigger('selectionupdated');
      outerContainer.css({fontSize: fontSize});
      if (currentSelection.length>8) {displayText="Tm: "+module.meltingTemperature(currentSelection);}
      else {displayText="Tm:";}
      displayText+=" Length: "+currentSelection.length;
      displayText+=" Start: "+selection.start;
      displayText+=" End: "+selection.end;
      outerContainer.text(displayText);}

    initializeDisplay();

    setInterval(function(){
      cursor.setWidth(1-cursor.getWidth());
      featureLayer.draw();
    },600);
    var canvasElement=$div[0];
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
          default: moved=false;}
        if(moved) {
          //e.preventDefault();
          if (!e.shiftKey) {selection.start=selection.end;}
          updateSelection();}}}

    featureLayer.draw();
    tooltipLayer.draw();

    var mousePos;
    var mousePosHandler=function(event) {mousePos = {x: event.clientX, y: event.clientY};};

    var mouseScrollTimer;
    $(window).mouseup(function() {
      selecting=false;
      clearInterval(mouseScrollTimer);
      $(window).unbind("mousemove", mousePosHandler);});
    containCanvas.mouseleave(function(event) {
      if(selecting){
        $(window).bind("mousemove", mousePosHandler);
        mouseScrollTimer=setInterval(function(){
          var top=$div.position().top;
          var bottom=top+$div.outerHeight(true);
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
          if(mousePos.y>bottom){
            $div.scrollTop(10+$div.scrollTop()); 
            if (intersectedFeature=featureLayer.getIntersection({x: eventX, y: eventY})){
              intersectedFeature.fire('selectmove',clickEvent,true);}}
          if(mousePos.y<top){
            $div.scrollTop(-10+$div.scrollTop());
            if (intersectedFeature=featureLayer.getIntersection({x: eventX, y: eventY})){
              intersectedFeature.fire('selectmove',clickEvent,true);}}
        },100);
      }});
  };

  module.meltingTemperature=function(seq) {
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
    return t1;};

  function groupHeight(group) {
    if (group.getChildren==='undefined' || group.getChildren().length==0){
      return group.getHeight();}
    var children=group.getChildren();
    var height=0;
    for(var gi=0;gi<children.length;gi++){
      height=Math.max(height,children[gi].position().y+groupHeight(children[gi]));}
    return height;}
  function groupWidth(group) {
    if (group.getChildren === 'undefined'){
      return group.getWidth();
    }
    var children=group.getChildren();
    var width=0;
    for(var gi=0;gi<children.length;gi++){
      width=Math.max(width,children[gi].position().x+children[gi].getWidth());
    }
    return width;}
  function getLabel(feature) {
    if (feature.qualifiers.label) {return feature.qualifiers.label[0];}
    for (key in feature.qualifiers) {
      if (feature.qualifiers[key]) {return feature.qualifiers[key][0];}}
    return "";}
  function setLabel(feature,label) {
    if (feature.qualifiers.label) {feature.qualifiers.label[0]=label;return;}
    for (key in feature.qualifiers) {
      if (feature.qualifiers[key]) {feature.qualifiers[key][0]=label;return;}}
    return "";}
  function complementaryEnd(feature) {
    if (feature.location.strand==1) {return feature.complementaryLocation.end;}
    return feature.complementaryLocation.start;}
  function complementaryStart(feature) {
    if (feature.location.strand==1) {return feature.complementaryLocation.start;}
    return feature.complementaryLocation.end;}
  function nonComplementaryStart(feature) {
    if (feature.location.strand==1) {return complementaryStart(feature)-feature.nonComplementaryExtent;}
    return complementaryStart(feature)+feature.nonComplementaryExtent;}
  function nonComplementaryEnd(feature) {
    return complementaryStart(feature);}
  function complementaryExtent(feature) {
    return Math.abs(feature.complementaryLocation.start-feature.complementaryLocation.end);}
  function nonComplementaryExtent(feature) {
    return feature.nonComplementaryExtent;}
  function complementarySequence(feature,dna) {
    var seq=dna.substring(feature.complementaryLocation.start,feature.complementaryLocation.end);
    return feature.location.strand==1?seq:reverse(complement(seq));}
  function nonComplementarySequence(feature,dna) {
    var start=nonComplementaryStart(feature);
    var end=nonComplementaryEnd(feature);
    var seq=dna.substring(Math.min(start,end),Math.max(start,end));
    return feature.location.strand==1?seq:reverse(complement(seq));}
  function updateFeature(feature,complementaryEnd,complementaryLength,nonComplementaryLength) {
    feature.nonComplementaryExtent=nonComplementaryLength;
    if (feature.location.strand==1) {
      feature.complementaryLocation.end=complementaryEnd;
      feature.complementaryLocation.start=complementaryEnd-complementaryLength;
      feature.location.end=complementaryEnd;
      feature.location.start=complementaryEnd-complementaryLength-nonComplementaryLength;}
    else {
      feature.complementaryLocation.start=complementaryEnd;
      feature.complementaryLocation.end=complementaryEnd+complementaryLength;          
      feature.location.start=complementaryEnd;
      feature.location.end=complementaryEnd+complementaryLength+nonComplementaryLength;}}
  function rectifyFeature(feature) {
    var complementaryEnde=complementaryEnd(feature);
    var complementaryLength=complementaryExtent(feature);
    var nonComplementaryLength=nonComplementaryExtent(feature);
    if (feature.location.strand==1) {
      feature.location.end=complementaryEnde;
      feature.location.start=complementaryEnde-complementaryLength-nonComplementaryLength;}
    else {
      feature.location.start=complementaryEnde;
      feature.location.end=complementaryEnde+complementaryLength+nonComplementaryLength;}}
  function computeFontWidth(layer, fontSize, fontFamily) {
    var testString="AGCT";
    var text=new Kinetic.Text({text: testString, x: -100,y: -100, fontSize: fontSize, fontFamily: fontFamily});
    layer.add(text);
    var w=text.getWidth();
    layer.remove(text);
    return w/testString.length;}
  function getParentGroup(obj) {
    while (obj) {
      if (obj.groupType=='parent') {return obj;}
      obj=obj.getParent();}
    return null;}
  function translate(seq) {
    var dnaSequence=seq.toLowerCase();
    var code=sms_genetic.getGeneticCodeString("standard").split(/,/);
    var matchExp=sms.getGeneticCodeMatchExp(code);
    var matchResult=sms.getGeneticCodeMatchResult(code);
    dnaSequence=dnaSequence.replace(/(...)/g,function (str, p1, offset, s) {return " "+p1+" ";});
    for (var i=0;i<matchExp.length;i++) {
      dnaSequence=dnaSequence.replace(matchExp[i],matchResult[i]);}
    return dnaSequence;
  }
  function geneticCode() {
    return "/gc[acgturyswkmbdhvn]/=A," +
    "/[tu]g[ctuy]/=C," +
    "/ga[tcuy]/=D," +
    "/ga[agr]/=E," +
    "/[tu][tu][tcuy]/=F," +
    "/gg[acgturyswkmbdhvn]/=G," +
    "/ca[tcuy]/=H," +
    "/a[tu][atcuwmhy]/=I," +
    "/aa[agr]/=K," +
    "/c[tu][acgturyswkmbdhvn]|[tu][tu][agr]|[ctuy][tu][agr]/=L," +
    "/a[tu]g/=M," +
    "/aa[tucy]/=N," +
    "/cc[acgturyswkmbdhvn]/=P," +
    "/ca[agr]/=Q," +
    "/cg[acgturyswkmbdhvn]|ag[agr]|[cam]g[agr]/=R," +
    "/[tu]c[acgturyswkmbdhvn]|ag[ct]/=S," +
    "/ac[acgturyswkmbdhvn]/=T," +
    "/g[tu][acgturyswkmbdhvn]/=V," +
    "/[tu]gg/=W," +
    "/[tu]a[ctuy]/=Y," +
    "/[tu]a[agr]|[tu]ga|[tu][agr]a/=*";
  }

  return module;
});