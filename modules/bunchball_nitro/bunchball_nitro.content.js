Drupal.bunchball = Drupal.bunchball || {};
Drupal.bunchball.userCommandsArray = Drupal.bunchball.userCommandsArray || [];

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
  if (nodeData.viewAction) {
    var sentTags = nodeData.viewAction + ', Title: ' + nodeData.nodeTitle + ', Category: ' + nodeData.nodeCategory;

    var inObj = {};
    inObj.uid = _currentUserId;
    inObj.tags = sentTags;
    inObj.ses = '';
    Drupal.bunchball.userCommandsArray.push(inObj);
  }

  if (nodeData.viewReceiveAction) {
    var sentTags = nodeData.viewReceiveAction + ', Title: ' + nodeData.nodeTitle + ', Category: ' + nodeData.nodeCategory;

    var inObj = {};
    inObj.uid = nodeData.nodeUID;
    inObj.tags = sentTags;
    inObj.ses = '';
    Drupal.bunchball.userCommandsArray.push(inObj);
  }

  nodeWaitForBunchballNitroInit();
}

function nitroSocialShareClicked(network) {
  if(network.length > 0) {
    var action = "Share_Link, Network: " + network;

    var inObj = {};
    inObj.uid = _currentUserId;
    inObj.tags = action;
    inObj.ses = '';
    Drupal.bunchball.userCommandsArray.push(inObj);

    Drupal.bunchball.WorkerQueue.nitroIterateQueue();
  }
}

function nodeWaitForBunchballNitroInit() {
  if (typeof Drupal.bunchball.nitro !== 'undefined' && typeof Drupal.bunchball.WorkerQueue.nitroIterateQueue === 'function') {
    Drupal.bunchball.WorkerQueue.nitroIterateQueue();
  }
  else {
    setTimeout(nodeWaitForBunchballNitroInit, 1500);
  }
}
