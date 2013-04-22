;(function($, d3, undefined) {
  window.app = {};
  app.elements = {
    nodes: [],
    edges: [],
    sections: {}
  };
  app.canvas = d3.select('.canvas');
  app.canvasColor = '#F5F5F5';
  app.elementWidth = 150;
  
  window.requestAnimFrame = (function(){
    return  
      window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      function(callback) {
        window.setTimeout(callback, 1000 / 60);
      };
  })();

  // 
  app.makeSectionId = function(section) {
    return section.title
      .toLowerCase()
      .replace(/[^\w\s-]/ig, '')
      .split(' ')
      .join('-')
  };
  
  app.createSectionNode = function(section, canvas) {
    var g = canvas.append('g').attr({
      'class': 'section-node',
      'id': 'node-' + app.makeSectionId(section)
    });
    
    var text = g.append('text').text(section.title).attr({
      x: 25,
      y: 0,
      'text-anchor':'middle'
    });
    var textBBox = text.node().getBBox();
    
    // naive line-wrapping. see http://www.w3.org/TR/SVG/text.html#Introduction
    if (textBBox.width > 150) {
      var words = text.text().split(' ');
      var halfIndex = Math.floor(words.length / 2);
      text.text('');
      text.append('tspan')
        .text(words.slice(0, halfIndex).join(' '))
        .attr({ x: 25, y: '-1.5em', 'text-anchor': 'middle' });
      text.append('tspan')
        .text(words.slice(halfIndex).join(' '))
        .attr({ x: 25, y: '-.25em', 'text-anchor': 'middle' });
    }
    text.attr('y', '-.5em');
    
    // re-calculate for a filled background
    textBBox = text.node().getBBox();
    var bg = g.insert('rect', ':first-child').attr({
      width: textBBox.width,
      height: textBBox.height,
      x: textBBox.x,
      y: textBBox.y,
      'class': 'text-bg'
    });
    
    
    if (section.type == 'content') {
      g.append('rect').attr({
        width: 50,
        height: 40,
        title: section.title,
      });
      if (section.images.length) {
        g.append('image').attr({
          width:50,
          height:40,
          'xlink:href': section.images[0].src
        });
      }
    }
    else {
      g.append('circle').attr({
        r: 25,
        cx: 25,
        cy: 25,
        title: section.title
      });
    }
    
    $(g.node()).on('click', function() {
      app.showSection(section);
    });
    
    return g;
  };
  
  app.createSection = function(section) {
    var $s = $('<div class="section" id="' + section.id + '">');
    var innerHtml = '\
      <h2 class="title">' + section.title + '</h2>\
    ';
    if (section.images.length) {
      innerHtml += '\
        <figure>\
          <img class="img-polaroid" src="' + section.images[0].src + '" title="' + section.images[0].caption + '" />\
          <figcaption>' + section.images[0].caption + '</figcaption>\
        </figure>\
      ';
    }
    innerHtml += '\
      <div class="section-content">' + section.content + '</div>\
    ';
    innerHtml += '\
      <span class="close">&times;</span>\
    ';
    $s.append(innerHtml);
    $s.find('.close').on('click', function() {
      app.hideSection(section);
    });
    app.elements.sections[section.id] = $s;
    return $s;
  };
  
  app.showSectionById = function(sectionId) {
    console.log(sectionId);
    var $s = $('#' + sectionId);
    if ($s.length == 0) {
      $s = app.elements.sections[sectionId];
    }
    $s.hide();
    $('.content').prepend($s.fadeIn());
    $('.canvas').popover('hide');
  };
  
  app.showSection = function(section) {
    app.showSectionById(section.id);
  };
  
  app.hideSection = function(section) {
    $('#' + section.id).hide();
    if ($('.content .section:visible').length == 0) {
      app.showHelp();
    }
  };
  
  app.showHelp = function() {
    if (!$('.canvas').data('popover')) {
      $('.canvas').popover({
        content: '\
          Explore the story by clicking on nodes.\
        ',
        trigger: 'manual',
      });
    }
    // provide a slight delay
    setTimeout(function() {
      $('.canvas').popover('show');
    }, 1000);
  };
  
  
  app.initGraph = function(story) {
    story.sections.forEach(function(section, i) {
      app.elements.nodes.push(app.createSectionNode(section, app.canvas));
    });
    
    story.layout.forEach(function (loc, i) {
      app.elements.nodes[i].attr(
        'transform', 'translate(' + (loc.x + 25) + ', ' + (loc.y + 50) + ')'
      );
    });
    
    story.edges.forEach(function(edge, i) {
      var nodes = [];
      var selection;
      edge.forEach(function(nodeIndex) {
        selection = app.elements.nodes[nodeIndex];
        nodes.push({
          d3: selection,
          origin: d3.transform(selection.attr('transform')).translate
        });
      });
      var commands = [
        'M', nodes[0].origin[0] + 25, nodes[0].origin[1] + 25,
        'L', nodes[1].origin[0] + 25, nodes[1].origin[1] + 25,
      ];
      app.canvas.insert('path', ':first-child').attr({
        d: commands.join(' '),
        stroke: 'black'
      })
    });
    /*
    var layout = window.layout = d3.layout.force()
      .nodes($.map(app.elements.nodes, function(section) { return section.node(); }))
      .links($.map(story.edges, function(edge) { return { source: edge[0], target: edge[1] } }))
      .start();
    */
    var animate = function() {
      //requestAnimFrame(animate());
      //layout.tick();
      //console.log('hi there');
    };
    animate();
  };
  
  $(document).ready(function() {
    
    d3.json('js/data.js', function(error, data) {
      if (data) {
        app.stories = data;

        // generate section elements
        app.stories[0].sections.forEach(function(section, i) {
          section.id = app.makeSectionId(section);
          app.elements.sections[section.id] = app.createSection(section);
        });
        
        app.initGraph(app.stories[0]);
        app.showHelp();
        
        // populate toc
        app.stories[0].sections.forEach(function(section, i) {
          $('ul.toc').append('<li><a href="#' + section.id + '">' + section.title + '</a></li>');
        });
        $('.toc a').on('click', function(event) {
          app.showSectionById($(this).attr('href').substr(1));
          event.preventDefault();
        });
      }
    });
  });
  
})(jQuery, d3);