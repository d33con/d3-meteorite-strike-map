// map dimensions
var width = parseInt(d3.select('#map').style('width'));
var height = width * 0.6;

// projection
var projection = d3.geo.mercator()
                        .center([-10, 30])
                        .scale(250);

// append svg to graph div
var svg = d3.select('#map')
    .append('svg')
      .attr('width', width)
      .attr('height', height);

// add path & projection
var path = d3.geo.path()
                .projection(projection);

var g = svg.append('g');

// zoom & pan function
var zoom = d3.behavior.zoom()
              .on('zoom', function () {
                g.attr('transform', 'translate(' + 
                  d3.event.translate.join(',') + ')scale(' + d3.event.scale + ')');
                g.selectAll('path')
                  .attr('d', path.projection(projection));
              });
              
svg.call(zoom);

// load map
d3.json('data/world-110m.json', function (error, topology) {

  if (error) throw 'error';
  
  g.selectAll('path')
      .data(topojson.object(topology, topology.objects.countries)
    .geometries)
      .enter()
      .append('path')
      .attr('d', path);
      
      // load strike data
      d3.json('data/meteorite-strike-data.json', function (error, data) {
        
        if (error) throw 'error';
        data = data.features;
        
        // colour buckets
        var color = ['#8C9275','#43819E','#5C1434'];
        
        // scale the size of the circles
        var circleRScale = d3.scale.linear().range([1, 75]).clamp(true);
        // color scale
        var colorScale = d3.scale.threshold().range(color);
        // opacity scale
        var opacityScale = d3.scale.linear().range([0.85, 0.5]).clamp(true);
        
        // circle size domain
        circleRScale.domain([1000, 5000000]);
        // color domain
        colorScale.domain([10000, 1000000]);
        // opacity domain
        opacityScale.domain([0, 5000000]);
        
        //tooltip
        var tooltip = d3.select('#map').append('div')
          .attr('class', 'tooltip')
          .style('opacity', 0);
  
        // append the strike points
        g.selectAll('circle')
          .data(data)
          .enter()
          .append('circle')
          .attr('cx', function (d) {
            return projection([+d.properties.reclong, +d.properties.reclat])[0];
          })
          .attr('cy', function (d) {
            return projection([+d.properties.reclong, +d.properties.reclat])[1];
          })
          .attr('r', function (d) { 
            return circleRScale(+d.properties.mass); 
          })
          .style('fill', function (d) {
            return colorScale(+d.properties.mass);
          })
          .style('opacity', function (d) {
            return opacityScale(+d.properties.mass);
          })
          // add the tooltip
          .on('mouseover', function (d) {
            
            var html = '';
            html += '<div>Location: <span>' + d.properties.name + '</span></div>';
            html += '<div>Year: <span>' + d.properties.year.slice(0,4) + '</span></div>';
            html += '<div>Mass: <span>' + (d.properties.mass / 1000) + 'kg</span></div>';
            html += '<div>Type: <span>' + d.properties.recclass + '</span></div>';
            
            tooltip.transition()
                    .duration(500)
                    .style('opacity', 0.95);
            tooltip.html(html)
                    .style('left', (d3.event.pageX + 20) + 'px')
                    .style('top', (d3.event.pageY - 20) + 'px');
          })
          .on('mouseout', function(d) {
            tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
          });
      });

});
