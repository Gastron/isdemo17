/* State: */
var speechTracking = false;
var workerAvailable = false;
var ReadingPrompt = function() {
  var asList = [];
  var asSpanList = [];
  this.loadText = function(text) {
    asList = text.split(/(\s+)/).filter( function(x) {return x.trim().length > 0;});
    asSpanList = [];
    for (i = 0; i < asList.length; i++) {
      var wordSpan = document.createElement('span');
      wordSpan.innerHTML = asList[i] + " ";
      wordSpan.classList.add('promptword');
      asSpanList.push(wordSpan);
    }
  }
  this.getSpanList = function() {
    return asSpanList;
  }
  this.getElementAtIndex = function(index) {
    return asSpanList[index];
  }
};
function setPrompt(spanList) {
  var promptdiv = document.getElementById("prompt")
  promptdiv.innerHTML = "";
  for (i = 0; i < spanList.length; i++) {
    promptdiv.appendChild(spanList[i]);
  }
}

var readingPrompt = new ReadingPrompt();
readingPrompt.loadText("En dag började solen och vinden bråka om vem av dem som var starkast.")
setPrompt(readingPrompt.getSpanList());


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
  colorPromptByHypothesis(readingPrompt, hypothesis);
}

function colorPromptByHypothesis(readingPrompt, hypothesis) {
  var reWordIds = /@([0-9]*)/g;
  var reresult; 
  while ((reresult = reWordIds.exec(hypothesis)) !== null) {
    index = parseInt(reresult[1]);
    readingPrompt.getElementAtIndex(index).classList.add('correct');
  }
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
    } catch (e) {
      console.log("Unable to start speech tracking due to error: " +e);
      speechTracking = false;
    }
  }
};
document.onkeyup = function(evt) {
  evt = evt || window.event;
  if (evt.keyCode == 32 && speechTracking) {
    console.log("Stopping speech tracking.");
    dictate.stopListening();
    speechTracking = false;
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
