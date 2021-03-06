(function () {
  "use strict";
  var margin = {top: 10, right: 10, bottom: 10, left: 10},
      dist = 5,
      endDotRadius = 8,
      delay = 100,
      cache = {},
      idToLine = {},
      whiskers = [],
      entries = {},
      exits = {},
      intersections = {},
      nodesById = {},
      scale = 0,
      distScale,
      whiskerScale,
      spider = window.location.search.indexOf('flat') > -1 ? window.spider2 : window.spider;

  d3.json('medians.json', function (medians) {
    d3.json('data.json', function (inputData) {
      inputData.links.forEach(function (link) {
        link.source = inputData.nodes[link.source];
        link.target = inputData.nodes[link.target];
        link.source.links = link.source.links || [];
        link.target.links = link.target.links || [];
        link.target.links.splice(0, 0, link);
        link.source.links.splice(0, 0, link);
        idToLine[link.source.id + '|' + link.target.id] = link.line;
        idToLine[link.target.id + '|' + link.source.id] = link.line;
        whiskers.push({
          source: link.source.id,
          target: link.target.id
        });
        whiskers.push({
          source: link.target.id,
          target: link.source.id
        });
      });
      inputData.nodes.forEach(function (data) {
        data.x = spider[data.id][0];
        data.y = spider[data.id][1];
        nodesById[data.id] = data;
        if (data.links.length === 1) {
          whiskers.push({
            target: data.id,
            source: "void"
          });
        }
      });
      var xRange = d3.extent(inputData.nodes, function (d) { return d.x; });
      var yRange = d3.extent(inputData.nodes, function (d) { return d.y; });

      var svg;
      function draw () {
        var outerWidth = Math.min(window.innerWidth || 300, 500) - 10,
            outerHeight = 450;
        var m = Math.min(outerWidth, outerHeight) / 20;
        margin = {
          top: m,
          right: m,
          bottom: m,
          left: m
        };
        var width = outerWidth - margin.left - margin.right,
            height = outerHeight - margin.top - margin.bottom;
        var xScale = width / (xRange[1] - xRange[0]);
        var yScale = height / (yRange[1] - yRange[0]);
        scale = Math.min(xScale, yScale);
        dist = 0.3 * scale;
        distScale = d3.scale.linear()
          .domain([0, 100])
          .range([0.15 * scale, 0.4 * scale]);
        whiskerScale = d3.scale.linear()
          .domain([0, 100])
          .range([0.0 * scale, 0.4 * scale]);
        endDotRadius = 0.2 * scale;
        inputData.nodes.forEach(function (data) {
          data.pos = [data.x * scale, data.y * scale];
        });
        d3.select('svg').remove();
        svg = d3.select('#chart').append('svg')
            .attr('width', scale * xRange[1] + margin.left + margin.right)
            .attr('height', scale * yRange[1] + margin.top + margin.bottom)
          .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
        d3.select("#chart svg").append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
          .selectAll('.whisker')
            .data(whiskers, function (d) { return d.source + "|" + d.target; })
            .enter()
          .append('line')
            .attr('class', function (d) { return 'whisker ' + d.source + '-' + d.target; });
        var lines = svg.selectAll('.connect')
            .data(inputData.links)
            .enter()
          .append('g')
            .attr('attr', 'connect');

        lines.append('g')
            .attr('class', function (d) { return d.line + ' ' + d.source.id + '-' + d.target.id; })
          .append('path')
            .datum(function (d) {
              return {
                incoming: getEntering(d.source),
                line: d.line,
                ids: d.source.id + '|' + d.target.id,
                segment: [d.source.pos, d.target.pos],
                outgoing: getLeaving(d.target),
                name: d.source.name + " to " + d.target.name
              };
            })
            .attr('fill', colorFunc)
            .attr('d', lineFunction)
          .append('title')
            .text(function (d) {
              return d.name;
            });

        lines.append('g')
            .attr('class', function (d) { return d.line + ' ' + d.target.id + '-' + d.source.id; })
          .append('path')
            .datum(function (d) {
              return {
                incoming: getEntering(d.target),
                line: d.line,
                ids: d.target.id + '|' + d.source.id,
                segment: [d.target.pos, d.source.pos],
                outgoing: getLeaving(d.source),
                name: d.target.name + " to " + d.source.name
              };
            })
            .attr('fill', colorFunc)
            .attr('d', lineFunction)
          .append('title')
            .text(function (d) {
              return d.name;
            });

        function getEntering(node) {
          return node.links.map(function (n) {
            var segment;
            var ids;
            if (n.target === node) {
              segment = [n.source.pos, n.target.pos];
              ids = n.source.id + "|" + n.target.id;
            } else {
              segment = [n.target.pos, n.source.pos];
              ids = n.target.id + "|" + n.source.id;
            }
            return {
              segment: segment,
              line: n.line,
              ids: ids
            };
          });
        }

        function getLeaving(node) {
          return node.links.map(function (n) {
            var segment;
            var ids;
            if (n.source === node) {
              segment = [n.source.pos, n.target.pos];
              ids = n.source.id + "|" + n.target.id;
            } else {
              segment = [n.target.pos, n.source.pos];
              ids = n.target.id + "|" + n.source.id;
            }
            return {
              segment: segment,
              line: n.line,
              ids: ids
            };
          });
        }

        // line color circles
        function dot(id, color) {
          svg.append('circle')
            .attr('cx', scale * spider[id][0])
            .attr('cy', scale * spider[id][1])
            .attr('fill', color)
            .attr('r', endDotRadius)
            .attr('stroke', "none");
        }
        dot('place-asmnl', "#E12D27");
        dot('place-alfcl', "#E12D27");
        dot('place-brntn', "#E12D27");
        dot('place-wondl', "#2F5DA6");
        dot('place-bomnl', "#2F5DA6");
        dot('place-forhl', "#E87200");
        dot('place-ogmnl', "#E87200");
        return svg;
      }
      var colorScale = d3.scale.pow().exponent(2)
          .domain([1.2, 0.5, 0])
          .range(['white', 'black', 'red']);
      function colorFunc(d) {
        var speed = cache[d.ids];
        var color;
        if (speed === null || typeof speed === 'undefined') {
          color = 'white';
        } else {
          color = colorScale(speed);
        }
        return color;
      }

      draw();
      d3.select(window).on('resize', draw);

      var time = d3.select('#time');

      d3.json('historical.json')
      .on('progress', function() {
        var pct = Math.round(100 * d3.event.loaded / 7907504);
        time.text("Loading... " + pct + "%");
      })
      .get(function(error, inOrder) {
        var i = 0;
        setTimeout(function check() {
          if (i < inOrder.length) {
            render(inOrder[i]);
            i++;
            setTimeout(check, delay);
          }
        }, 0);

        function render(data) {
          time.text(moment(data.time).format('dddd M/D h:mm a'));
          entries = data.ins;
          exits = data.outs;

          data.lines.forEach(function (datum) {
            var line = datum.line;
            var byPair = datum.byPair;
            function update(FROM, TO) {
              var key = FROM + "|" + TO;
              if (byPair.hasOwnProperty(key)) {
                var diff = byPair[key];
                var median = medians[key];
                var speed = median / diff;
                cache[key] = speed;
              } else if (line === idToLine[key]) {
                cache[key] = null;
              }
            }

            inputData.links.forEach(function (link) {
              update(link.source.id, link.target.id);
              update(link.target.id, link.source.id);
            });
          });
          svg.selectAll('path')
            .attr('fill', colorFunc)
            .attr('d', lineFunction);
          if (window.location.search.indexOf('whisker') > -1) {
            d3.selectAll('.whisker')
              .call(exitWhiskers);
          }
        }
      });
    });
  });

  function closestClockwise(line, lines) {
    var origAngle = angle(line.segment);
    lines = lines || [];
    var result = null;
    var minAngle = Infinity;
    lines.forEach(function (other) {
      if (same(other, line)) { return; }
      var thisAngle = angle(other.segment) + Math.PI;
      var diff = -normalize(thisAngle - origAngle);
      if (diff < minAngle) {
        minAngle = diff;
        result = other;
      }
    });
    return result;
  }
  function closestCounterClockwise(line, lines) {
    var origAngle = angle(line.segment);
    lines = lines || [];
    var result = null;
    var minAngle = Infinity;
    lines.forEach(function (other) {
      var thisAngle = angle(other.segment);
      var diff = normalize(origAngle - thisAngle);
      var absDiff = Math.abs(diff);
      if (absDiff < 0.2 || Math.abs(absDiff - Math.PI) < 0.2) { return; }
      if (diff < minAngle) {
        minAngle = diff;
        result = other;
      }
    });
    return result;
  }

  function same(a, b) {
    var sega = JSON.stringify(a.segment);
    var segb = JSON.stringify(b.segment);
    return sega === segb;
  }

  function normalize(angle) {
    return (Math.PI * 4 + angle) % (Math.PI * 2) - Math.PI;
  }

  function angle(p1, p2) {
    if (arguments.length === 1) {
      var origP1 = p1;
      p1 = origP1[0];
      p2 = origP1[1];
    }
    return Math.atan2((p2[1] - p1[1]), (p2[0] - p1[0]));
  }
  function offsetPoints(d) {
    var split = d.ids.split("|").map(function (a) {
      var val = entries[a];
      return distScale(val || 0);
    });
    var p1 = d.segment[0];
    var p2 = d.segment[1];
    var lineAngle = angle(p1, p2);
    var angle90 = lineAngle + Math.PI / 2;
    var p3 = [p2[0] + split[1] * Math.cos(angle90), p2[1] + split[1] * Math.sin(angle90)];
    var p4 = [p1[0] + split[0] * Math.cos(angle90), p1[1] + split[0] * Math.sin(angle90)];
    return [p4, p3];
  }
  function slope(line) {
    return (line[1][1] - line[0][1]) / (line[1][0] - line[0][0]);
  }
  function intercept(line) {
    // y = mx + b
    // b = y - mx
    return line[1][1] - slope(line) * line[1][0];
  }
  function intersect(line1, line2) {
    var m1 = slope(line1);
    var b1 = intercept(line1);
    var m2 = slope(line2);
    var b2 = intercept(line2);
    var m1Infinite = m1 === Infinity || m1 === -Infinity;
    var m2Infinite = m2 === Infinity || m2 === -Infinity;
    var x, y;
    if ((m1Infinite && m2Infinite) || Math.abs(m2 - m1) < 0.01) {
      return null;
    } else if (m1Infinite) {
      x = line1[0][0];
      // y = mx + b
      y = m2 * x + b2;
      return [x, y];
    } else if (m2Infinite) {
      x = line2[0][0];
      y = m1 * x + b1;
      return [x, y];
    } else {
      // return null;
      // x = (b2 - b1) / (m1 - m2)
      x = (b2 - b1) / (m1 - m2);
      y = m1 * x + b1;
      return [x, y];
    }
  }
  function length (a, b) {
    return Math.sqrt(Math.pow(b[1] - a[1], 2) + Math.pow(b[0] - a[0], 2));
  }
  function exitWhiskers(selection) {
    selection
      .each(function (d) {
        var originalNode = nodesById[d.source] || nodesById[d.target];
        var originalPoint = [originalNode.x * scale, originalNode.y * scale];
        d.whiskerStart = intersections[d.source][d.target];
        var angle = Math.atan2(d.whiskerStart[1] - originalPoint[1], d.whiskerStart[0] - originalPoint[0]);
        var origDist = Math.sqrt(Math.pow(originalPoint[0] - d.whiskerStart[0], 2) + Math.pow(originalPoint[1] - d.whiskerStart[1], 2))
        var dist = whiskerScale(exits[d.source] || exits[d.target] || 0);
        d.whiskerEnd = [
          d.whiskerStart[0] + dist * Math.cos(angle),
          d.whiskerStart[1] + dist * Math.sin(angle),
        ];
      })
      .attr('x1', function (d) { return d.whiskerStart[0]; })
      .attr('y1', function (d) { return d.whiskerStart[1]; })
      .attr('x2', function (d) { return d.whiskerEnd[0]; })
      .attr('y2', function (d) { return d.whiskerEnd[1]; });
  }
  function lineFunction (d) {
    var p1 = d.segment[0];
    var p2 = d.segment[1];
    var offsets = offsetPoints(d);
    var p3 = offsets[1];
    var p4 = offsets[0];
    var first;

    first = closestClockwise(d, d.outgoing);
    if (first && d.outgoing.length > 1) {
      var outgoingPoints = offsetPoints(first);
      var newP3 = intersect(offsets, outgoingPoints);
      if (newP3) { p3 = newP3; }
    }
    first = closestCounterClockwise(d, d.incoming);
    if (first && d.incoming.length > 1) {
      var incomingPoints = offsetPoints(first);
      var newP4 = intersect(offsets, incomingPoints);
      if (newP4) { p4 = newP4; }
    }
    var ids = d.ids.split("|");
    var src = ids[0];
    var dest = ids[1];
    intersections[src] = intersections[src] || {};
    intersections[dest] = intersections[dest] || {};
    intersections["void"] = intersections["void"] || {};
    intersections[dest][src] = p3;
    if (d.incoming.length === 1) {
      intersections["void"][src] = p4;
    }
    return lineMapping([p1, p2, p3, p4, p1]);
  }
  function place(selection) {
    selection
      .append('path')
      .attr('fill', colorFunc)
      .attr('d', lineFunction);
  }

  var lineMapping = d3.svg.line()
    .x(function(d) { return d[0]; })
    .y(function(d) { return d[1]; })
    .interpolate("linear");

  function average(list) {
    return list.reduce(function (a,b) { return a+b; }) / list.length;
  }
}());