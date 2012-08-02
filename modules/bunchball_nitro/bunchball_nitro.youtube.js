Drupal.bunchball = Drupal.bunchball || {};
Drupal.bunchball.userCommandsArray = Drupal.bunchball.userCommandsArray || [];

var _playerPlayed = 0;


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
    $("div.oembed-video .oembed-content object embed").each(function (i) {
      this.addEventListener("onStateChange", "nitroVideoStateChange");
    });
  })(jQuery);
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

  if (newState === 0) {
    // Video ended.
    action = youtubeData.artistEnd;
    _playerPlayed = 0;
  } else if (newState === 1 && _playerPlayed === 0) {
    // Video started.
    action = youtubeData.artistStart;
    _playerPlayed = 1;
  }

  // only continue if there is something in Action
  if (action.length > 1) {
    action = action + ", Artist: " + youtubeData.artistName + ", Category: " + youtubeData.artistCategory;

    var inObj = {};
    inObj.uid = _currentUserId;
    inObj.tags = action;
    inObj.ses = '';
    Drupal.bunchball.userCommandsArray.push(inObj);

    youtubeWaitForBunchballNitroInit();
  }
}

function youtubeWaitForBunchballNitroInit() {
  if (typeof Drupal.bunchball.nitro !== 'undefined' && typeof Drupal.bunchball.WorkerQueue.nitroIterateQueue === 'function') {
    Drupal.bunchball.WorkerQueue.nitroIterateQueue();
  }
  else {
    setTimeout(youtubeWaitForBunchballNitroInit, 1500);
  }
}
