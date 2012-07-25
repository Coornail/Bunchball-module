(function($) {
  Drupal.behaviors.bunchballNitroContent = {
    attach: function (context, settings) {
      if (typeof Drupal.bunchball.nitro !== "undefined") {
        setUserId();
      }
    }
  };
}) (jQuery);

var _currentUserId = '';
var _userCommandsArray = [];
var _thePlayer = '';
var _playerPlayed = 0;

function setUserId() {
  var userId = Drupal.bunchball.nitro.connectionParams.userId;
  Drupal.bunchball.nitro.setUserId(userId);
  Drupal.bunchball.nitro.getUserId(gotCurrentUserId);
}

// Callback function for acquiring the User ID of the current user.
function gotCurrentUserId(inUserId) {
  _currentUserId = inUserId;

  // User viewed content.
  if (typeof Drupal.settings.bunchballNitroNode.nodeID !== 'undefined') {
    // We are in a node.
    userViewedContent();
  }
}

// ViewedContent is called because the user is currently viewing content.
function userViewedContent() {
  var nodeData = Drupal.settings.bunchballNitroNode;
  var sentTags = nodeData.nodeAction + ', Title: ' + nodeData.nodeTitle + ', Category: ' + nodeData.nodeCategory;

  // add requests for all players into the array to walk through.
  var inObj = {};
  inObj.uid = _currentUserId;
  inObj.tags = sentTags;
  inObj.ses = '';
  _userCommandsArray.push(inObj);

  // TODO: here is where you'd check to make sure the users isn't the same as
  // the creator.

  nitroIterateQueue();
}

function submitNitroAPICall(tags) {
  var params = new Array();

  params[0] = 'method=' + encodeURIComponent('user.logAction');
  params[1] = 'sessionKey=' + encodeURIComponent(_userCommandsArray[0].ses);
  params[2] = 'tags=' + encodeURIComponent(tags);

  var queryString = params.join('&');

  nitroCallback("data", "token");
  Drupal.bunchball.nitro.callAPI(queryString, "nitroCallback");
}

function nitroCallback(data, token) {
  // remove from array
  if (_userCommandsArray.length > 0) {
    _userCommandsArray.splice(0, 1);
  }

  nitroIterateQueue();
}

function nitroLogin(userId) {
  var connectionParams = Drupal.bunchball.nitro.connectionParams;
  var params = new Array();

  params[0] = 'method=' + encodeURIComponent('user.login');
  params[1] = 'apiKey=' + encodeURIComponent(connectionParams.apiKey);
  params[2] = 'userId=' + encodeURIComponent(userId);
  params[3] = 'ts=' + encodeURIComponent(connectionParams.timeStamp);
  params[4] = 'sig=' + encodeURIComponent(connectionParams.signature);

  var loginQuery = params.join('&');

  Drupal.bunchball.nitro.callAPI(loginQuery, "nitroLoginCallback");
}

function nitroLoginCallback(data, token) {
  // this is a stub that can be used later to track responses from the server.
  _userCommandsArray[0].ses = data['Nitro']['Login']['sessionKey'];

  // do the nitro API call..
  submitNitroAPICall(_userCommandsArray[0].tags);
}


function nitroIterateQueue() {
  // proceed to log in next user
  if (_userCommandsArray.length > 0) {
    nitroLogin(_userCommandsArray[0].uid);
  }
}

/**
 * Your HTML pages that display the chromeless player must implement
 * a callback function named onYouTubePlayerReady.
 *
 * The API will call this function when the player is fully loaded
 * and the API is ready to receive calls.
 *
 * https://developers.google.com/youtube/js_api_reference#EventHandlers
 */
function onYouTubePlayerReady(playerId) {
  // attach the listener
  (function ($) {
    $("div.oembed-video .oembed-content object embed").each(function(i){
      _thePlayer = this;
      _thePlayer.addEventListener("onStateChange", nitroVideoStateChange);
    });
  }) (jQuery);
}

/**
 * Youtube video event listeners.
 *
 * https://developers.google.com/youtube/js_api_reference#Events
 */
function nitroVideoStateChange(newState) {
  // empty action to prevent anything from going forward
  var youtubeData = Drupal.settings.bunchballNitroYoutube;
  var action = "";

  if (newState == 0) {
    // Video ended.
    action = youtubeData.artistEnd;
    _playerPlayed = 0;
  } else if (newState == 1 && _playerPlayed == 0) {
    // Video started.
    action = youtubeData.artistStart;
    _playerPlayed = 1;
  }

  // only continue if there is something in Action
  if (action.length > 1) {
    action = action + ",Artist: " + youtubeData.artistName + ", Category: " + youtubeData.artistCategory;

    var inObj = {};
    inObj.uid = _currentUserId;
    inObj.tags = action;
    inObj.ses = '';
    _userCommandsArray.push(inObj);

    nitroIterateQueue();
  }
}

function nitroSocialShareClicked(network) {
  if(network.length > 0) {
    var action = "Share_Link, Network: " + network;

    var inObj = {};
    inObj.uid = _currentUserId;
    inObj.tags = action;
    inObj.ses = '';
    _userCommandsArray.push(inObj);

    nitroIterateQueue();
  }
}
