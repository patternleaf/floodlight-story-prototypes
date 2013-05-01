;(function($, Modernizr, _gaq, storyTestOpts) {
  // App-wide options 
  _.defaults(storyTestOpts, { 
    ignoreCookies: false, // Ignore cookies
    forceModal: false // Always use modal popup instead of full-screen
  });
  var googleFormUrlBase = 'https://docs.google.com/forms/d/11FO5El2U35pV8HIiidjQkpqKeE4t1nwfYWxugOwbIdE/viewform?embedded=true';
  var googleFormUrl = googleFormUrlBase;
  // Story formats that the user has seen
  var seen = $.cookie('floodlight_storytest_seen');
  if (seen && !storyTestOpts.ignoreCookies) {
    seen = JSON.parse(seen);
  }
  else {
    seen = {};
  }
  // UserId, usually the e-mail address
  var userId;

  // Get unseen story ids
  function getStoryIds(sel, seen) {
    return $(sel).map(function() {
      var id = this.id.replace('story-', '');
      if (seen[id]) {
        return undefined;
      }
      return id;
    }).get();
  }

  // Mark a particular story as seen
  function setSeen(id) {
    seen[id] = true;
    $.cookie('floodlight_storytest_seen', JSON.stringify(seen), {
      expires: 30,
      path: '/'
    });
  }

  function updateSurveyUrl(userId, storyType) {
    googleFormUrl = googleFormUrlBase + '&entry.1498993524=' + userId +
              '&entry.75722686=' + storyType;
  }

  /**
   * Navigate to the response form.
   */
  function showSurvey() {
      window.location = googleFormUrl;  
  }

  function getUserId(opts) {
    opts = opts || {};
    var inputVal;
    var saveToCookie = false;

    if (typeof userId == 'undefined') {
      // First try getting it from the cookie
      userId = $.cookie('floodlight_storytest_userid');
    }

    if (typeof userId == 'undefined') {
      // Then try getting it from the form
      inputVal = $('input[name=userid]').val(); 
      if (inputVal.length) {
        userId = inputVal;
        saveToCookie = true;
      }
    }

    if (typeof userId == 'undefined' && opts.setRandom) {
      // Generate a random userId
      userId = uuid.v4();
      saveToCookie = true;
    }

    if (saveToCookie) {
      $.cookie('floodlight_storytest_userid', userId, {
        expires: 30,
        path: '/'
      });
    }

    return userId;
  }

  function displayUserId() {
    var userId = getUserId();
    // If the userId is present, hide the form elements
    if (userId) {
      $('#userid-container').hide();
      $('input[name=userid]').val(userId);
    }
  }

  /**
   * Launch the story viewer in fullscreen mode.
   */
  function showStory(id) {
    var sel = '#story-' + id;
    var userId = getUserId({
      setRandom: true
    });
    var storyType = $(sel).data('survey-value');
    var loadIframe = function() {
      if ($(sel).data('story-src')) {
        $(sel).attr('src', $(sel).data('story-src'));
      }
    };
    var closeIframe = function() {
      $(sel).hide();
      showSurvey();
    };
    updateSurveyUrl(userId, storyType);
    setSeen(id);
    $(sel).show();
    if (BigScreen.enabled && !storyTestOpts.forceModal) {
        BigScreen.request($(sel)[0], loadIframe, closeIframe);
    }
    else {
      // Fullscreen API isn't available, launch the story in a full-window-
      // sized modal overlay
      $(sel).modal({
        minHeight: window.innerHeight,
        minWidth: window.innerWidth,
        // Make sure modal has a higher z-index than the bootstrap
        // header
        zIndex: 2000,
        onShow: function(dialog) {
          $(sel).width(window.innerWidth);
          $(sel).height(window.innerHeight);
          loadIframe();
        },
        // This doesn't seem to work. We'll handle this manually using
        // window.postMessage between the parent and child iframes below
        //escClose: true,
        escClose: false,
        onClose: closeIframe
      });
      // HACK: Listen to window.postMessage from the child (story) iframe
      // and close the modal when the escape key is pressed
      $(window).on("message", function(e) {
        var message = e.originalEvent.data;
        // Escape key has keycode of 27
        if (message === "storytest:keydown:27") {
          $.modal.close();
          // Unbind the current event listener
          $(window).off("message", arguments.callee);
        }
      });
    }
  }

  function getRandomStoryId(storyIds) {
    var idx = Math.floor(Math.random() * storyIds.length);
    return storyIds[idx];
  }

  function updateIntro() {
    var storyIds = getStoryIds('iframe.story-embed', seen);
    // No remaining stories, 
    if (!storyIds.length) {
      $('#intro-default').hide();
      $('#intro-returning').hide();
      $('#intro-finished').show();
      $('#view-story-form').hide();
    }
    else if (_.size(seen)) {
      $('#intro-default').hide();
      $('#intro-returning').show();
      $('#intro-finished').hide();
      $('#view-story-form').show();
    }
    else {
      $('#intro-default').show();
      $('#intro-returning').hide();
      $('#intro-finished').hide();
      $('#view-story-form').show();
    }
  }

  $(function() {
    if (!Modernizr.csstransforms3d) {
      // Unsupported browser.  Show an error message and track an event
      // with Google Analytics
      $('#unsupported-browser-alert').show(); 
      _gaq.push(['_trackEvent', 'Unsupported Browser', 'Unsupported Browser']);
    }
    updateIntro();
    displayUserId();
    $('#launch-viewer').click(function() {
      var storyIds = getStoryIds('iframe.story-embed', seen);
      if (storyIds.length) {
        showStory(getRandomStoryId(storyIds));
      }
    });
  });
})(jQuery, Modernizr, _gaq, window.storyTestOpts || {});
