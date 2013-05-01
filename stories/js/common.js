/**
 * Common functionality across stories.
 */
;(function($) {
  $(function() {
    // HACK: When we're viewing the story in a modal overlay instead of
    // fullscreen, we need a way to propogate the escape key upward to
    // close the window and move it to the survey.  We can use
    // window.postMessage for this, though I don't love it.
    $(document).bind('keydown.storytest', function(e) {
      window.parent.postMessage('storytest:keydown:'+ e.keyCode, '*');
    });
  });
})(jQuery);
