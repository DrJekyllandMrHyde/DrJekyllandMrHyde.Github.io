 var accessToken = "db6b486f323c410a82d597f2e1ad6a5c",
      appId = "",	
      baseUrl = "https://api.wit.ai/",
      $speechInput, // The input element, the speech box
      $recBtn, // Toggled recording button value
      recognition, // Used for accessing the HTML5 Speech Recognition API
      messageRecording = "Recording...",
      messageCouldntHear = "I couldn't hear you, could you say that again?",
      messageInternalError = "Oh no, there has been an internal server error",
      messageSorry = "I'm sorry, I don't have the answer to that yet.";

$(document).ready(function() {

  $speechInput = $("#speech");
  $recBtn = $("#rec");
  
  $speechInput.keypress(function(event) {
    if (event.which == 13) {
      event.preventDefault();
      send();
    }
  });

  $recBtn.on("click", function(event) {
    switchRecognition();
  });
  
  $(".debug__btn").on("click", function() {
    $(this).next().toggleClass("is-active");
    return false;
  });  
});

function switchRecognition() {
  if (recognition) {
    stopRecognition();
  } else {
    startRecognition();
  }
}

function startRecognition() {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.onstart = function(event) {
    respond(messageRecording);
    updateRec();
  };
  recognition.onresult = function(event) {
    recognition.onend = null;

    var text = "";
    for (var i = event.resultIndex; i < event.results.length; ++i) {
      text += event.results[i][0].transcript;
    }
    setInput(text);
    stopRecognition();
  };
  recognition.onend = function() {
    respond(messageCouldntHear);
    stopRecognition();
  };
  recognition.lang = "ru-RUS";
  recognition.start();
}

function stopRecognition() {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
  updateRec();
}

function setInput(text) {
  $speechInput.val(text);
  send();
}

function updateRec() {
  $recBtn.text(recognition ? "Stop" : "Speak");
}

function send() {
  var text = $speechInput.val();
  console.log(text);
  
  // Currently does not work cross-domain.
  
  $.ajax({
    url: baseUrl + "converse",
    data: {
      'q': text, // The message to send the bot
      'session_id': "123abc",
      'access_token' : accessToken // Authorisation key for using our bot
    },
    dataType: 'json',
    crossDomain: true,
    method: 'POST',
    
    success: function(data) {
      prepareResponse(data);
    },
    error: function() {
      respond(messageInternalError);
    }
  });
}
function prepareResponse(val) {
  
  console.log("Here is the JSON data:")
  console.log(val);
  
  var spokenResponse = val.result.speech;
  // actionResponse = val.result.action;
  // respond()
  respond(spokenResponse);
  
  var debugJSON = JSON.stringify(val, undefined, 2);
  debugRespond(debugJSON); // Print JSON to Debug window
}
function debugRespond(val) {
  $("#response").text(val);
}
function respond(val) {
  if (val == "") {
    val = messageSorry;
  }
  if (val !== messageRecording) {
    var msg = new SpeechSynthesisUtterance();
    msg.voiceURI = "native";
    msg.text = val;
    msg.lang = "en-US";
    window.speechSynthesis.speak(msg);
  }
  $("#spokenResponse").addClass("is-active").find(".spoken-response__text").html(val);
}
