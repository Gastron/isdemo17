/* State: */
var speechTracking = false;
var workerAvailable = false;
var cursorPos = 0;
var ReadingPrompt = function() {
  var asList = [];
  var asHTMLList = [];
  var lastSpace = null;
  this.loadText = function(text) {
    asList = text.split(/(\s+)/).filter( function(x) {return x.trim().length > 0;});
    asHTMLList = [];
    for (i = 0; i < asList.length; i++) {
      //var wordDiv = document.createElement('div');
      var spaceSpan = document.createElement('span');
      var wordSpan = document.createElement('span');
      spaceSpan.innerHTML = " ";
      spaceSpan.style["white-space"] = 'pre';
      wordSpan.innerHTML = asList[i];
      wordSpan.classList.add('promptword');
      //wordDiv.appendChild(spaceSpan);
      //wordDiv.appendChild(wordSpan);
      //wordDiv.classList.add('promptword');
      asHTMLList.push({//div: wordDiv, 
        spaceSpan: spaceSpan,
        wordSpan: wordSpan});
    }
    lastSpace = document.createElement('span');
    lastSpace.innerHTML = " ";
    lastSpace.style["white-space"] = 'pre';
  }
  this.getHTMLList = function() {
    return asHTMLList;
  }
  this.getWordAtIndex = function(index) {
    return asHTMLList[index].wordSpan;
  }
  this.getLastSpace = function() {
    return lastSpace;
  }
};
function setPromptDiv(readingPrompt) {
  var HTMLList = readingPrompt.getHTMLList();
  var lastSpace = readingPrompt.getLastSpace();
  var promptdiv = document.getElementById("prompt")
  promptdiv.innerHTML = "";
  for (i = 0; i < HTMLList.length; i++) {
    promptdiv.appendChild(HTMLList[i].spaceSpan);
    promptdiv.appendChild(HTMLList[i].wordSpan);
  }
  promptdiv.appendChild(lastSpace);
}

var readingPrompt = new ReadingPrompt();
readingPrompt.loadText("En dag började solen och vinden bråka om vem av dem som var starkast.")
setPromptDiv(readingPrompt);

var dictate = new Dictate({
  server : "ws://localhost:8888/client/ws/speech",
  serverStatus : "ws://localhost:8888/client/ws/status",
  recorderWorkerPath : 'static/js/recorderWorker.js',
  onPartialResults : function(hypos) {
    bestHypothesis = hypos[0].transcript;
    __processHypothesis(bestHypothesis);
  },
  onResults : function(hypos) {
    bestHypothesis = hypos[0].transcript;
    __processHypothesis(bestHypothesis);
  },
  onServerStatus : function(json) {
    if (json.num_workers_available == 0) {
      workerAvailable = false;
    } else {
      workerAvailable = true;
    }
  }
});

/* callbacks for dictate */
function __processHypothesis(hypothesis) {
  console.log("Got hypo");
  parsedHypo = parseHypothesis(hypothesis);
  colorPrompt(readingPrompt, parsedHypo);
  blinkCursor();
}

function colorPromptByHypothesis(readingPrompt, hypothesis) {
  var reWordIds = /@([0-9]*)/g;
  var reresult; 
  while ((reresult = reWordIds.exec(hypothesis)) !== null) {
    index = parseInt(reresult[1]);
    readingPrompt.getWordAtIndex(index).classList.add('correct');
  }
}

function setReadingClass(element, cls) {
  element.classList.remove('correct');
  element.classList.remove('truncated');
  element.classList.remove('missed');
  if (cls !== null) {
    element.classList.add(cls);
  }
}
function getReadingClassByIndex(parsedHypo, index) {
  if (parsedHypo.correctInds.has(index)) {return 'correct';}
  if (parsedHypo.truncInds.has(index)) {return 'truncated';}
  if (parsedHypo.missedInds.has(index)) {return 'missed';}
  return null;
}

function colorPrompt(readingPrompt, parsedHypothesis) {
  var HTMLList = readingPrompt.getHTMLList();
  for (index = 0; index < HTMLList.length; index++) {
    cls = getReadingClassByIndex(parsedHypothesis, index);
    setReadingClass(HTMLList[index].wordSpan, cls);
    if (speechTracking) {
      HTMLList[index].wordSpan.classList.remove('future');
      HTMLList[index].wordSpan.classList.remove('past');
      if (index >= parsedHypothesis.cursor + 1) {
        HTMLList[index].wordSpan.classList.add('future');
      }
      if (index < parsedHypothesis.cursor) {
        HTMLList[index].wordSpan.classList.add('past');
      }
    }
  }
  cursorPos = parsedHypothesis.cursor;
}

function colorAtStart(readingPrompt) {
  var HTMLList = readingPrompt.getHTMLList();
  for (index = 1; index < HTMLList.length; index++) {
    HTMLList[index].wordSpan.classList.add('future');
  }
  cursorPos = 0;
}
function colorAtEnd(readingPrompt) {
  var HTMLList = readingPrompt.getHTMLList();
  for (index = 0; index < HTMLList.length; index++) {
    HTMLList[index].wordSpan.classList.remove('future');
    HTMLList[index].wordSpan.classList.remove('past');
  }
}

var cursorOn = false;
function blinkCursor() {
  var HTMLList = readingPrompt.getHTMLList();
  for (i = 0; i < HTMLList.length; i++) {
    if (cursorPos === i) {
      if (speechTracking && !cursorOn) {
        cursorOn = true;
        HTMLList[i].spaceSpan.classList.add('blink');
      }
      else {
        HTMLList[i].spaceSpan.classList.remove('blink');
        cursorOn = false;
      }
    }
    else {
      HTMLList[i].spaceSpan.classList.remove('blink');
    }
  }
  var lastSpace = readingPrompt.getLastSpace();
  if (cursorPos === HTMLList.length) {
    if (speechTracking && !cursorOn) {
      cursorOn = true;
      lastSpace.classList.add('blink');
    }
    else {
      lastSpace.classList.remove('blink');
      cursorOn = false;
    }
  } 
  else {
    lastSpace.classList.remove('blink');
  }
}
window.setInterval(blinkCursor, 200);

function parseHypothesis(hypothesis) {
  var parsed = {correctInds: new Set(), truncInds: new Set(), missedInds: new Set(), cursor: 0};
  var reTruncInds = /(?:^|\s)trunc:[^@]*@([0-9]*)/g;
  var reCorrectInds = /(?:^|\s)(?!trunc:)[^@]*@([0-9]*)/g;
  var triedWords = []; 
  var reresult;
  while ((reresult = reCorrectInds.exec(hypothesis)) !== null) {
    index = parseInt(reresult[1]);
    parsed.correctInds.add(index);
    parsed.cursor = index + 1;
    triedWords.push(index);
  }
  while ((reresult = reTruncInds.exec(hypothesis)) !== null) {
    index = parseInt(reresult[1]);
    if (!parsed.correctInds.has(index)) {
      parsed.truncInds.add(index);
      triedWords.push(index);
    }
  }
  triedWords.sort(function (a,b) { return a - b; });
  triedSet = new Set(triedWords);
  for (i=0; i < triedWords[triedWords.length-1]; i++) {
    if (!triedSet.has(i)) {
      parsed.missedInds.add(i);
    }
  }
  return parsed;
}


document.onkeydown = function(evt) {
  evt = evt || window.event;
  if (evt.keyCode == 32 && !speechTracking) {
    if (!workerAvailable) {
      console.log("Worker not available.");
      return;
    }
    console.log("Starting speech tracking.");
    try{
      dictate.startListening();
      speechTracking = true;
      __processHypothesis(""); 
      colorAtStart(readingPrompt);
    } catch (e) {
      console.log("Unable to start speech tracking due to error: " +e);
      speechTracking = false;
      colorAtEnd(readingPrompt);
    }
  }
};
document.onkeyup = function(evt) {
  evt = evt || window.event;
  if (evt.keyCode == 32 && speechTracking) {
    console.log("Stopping speech tracking.");
    dictate.stopListening();
    speechTracking = false;
    colorAtEnd(readingPrompt);
  }
};


function startListening() {
	dictate.startListening();
}

function stopListening() {
	dictate.stopListening();
}

window.onload = function() {
  dictate.init();
}
