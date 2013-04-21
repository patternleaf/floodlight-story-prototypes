;(function($) {
  var googleFormUrl = 'https://docs.google.com/forms/d/11FO5El2U35pV8HIiidjQkpqKeE4t1nwfYWxugOwbIdE/viewform?embedded=true';
  // Story formats that the user has seen
  var seen = {};

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

  // Mark a particul
  function setSeen(id) {
    seen[id] = true;
    // TODO: Serialize seen into a cookie
  }

  function updateFormUrl(userId, storyType) {
    var url = googleFormUrl + '&entry.1498993524=' + userId +
              '&entry.75722686=' + storyType;
    $('#survey-google-form').attr('src', url);
  }

  /**
   * Navigate to the response form.
   */
  function showForm() {
      window.location.hash = 'form';
  }

  /**
   * Launch the story viewer in fullscreen mode.
   */
  function showStory(id) {
    var sel = '#story-' + id;
    var userId = $('input[name=userid]').val(); 
    var storyType = $(sel).data('survey-value');
    updateFormUrl(userId, storyType);
    setSeen(id);
    $(sel).show();
    if (BigScreen.enabled) {
        BigScreen.request($(sel)[0], null, function() {
            $(sel).hide();
            showForm();
        });
    }
    else {
      // TODO: Present story in full-window modal
      // Fallback
    }
  }

  /**
   * Resize the initial section so following sections are not visible
   */
  function hideFollowing() {
    var bottomPos = $(document).height();
    var $firstSection = $('section').first();
    // Save the original height in case we want to restore it later
    $firstSection.data('orig-height', $firstSection.height());
    $('section').first().height(bottomPos);
  }

  function getRandomStoryId(storyIds) {
    var idx = Math.floor(Math.random() * storyIds.length);
    return storyIds[idx];
  }

  $(function() {
    hideFollowing();
    $('#launch-viewer').click(function() {
      var storyIds = getStoryIds('iframe.story-embed', seen);
      if (storyIds.length) {
        showStory(getRandomStoryId(storyIds));
      }
      else {
        // No more stories
        // TODO: Handle this with user-facing message
        console.info("No more stories to see");
      }
    });
  });
})(jQuery);
