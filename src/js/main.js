window.onload = startup;
var COLUMNS_NOT_DISPLAYED = ["Team", "Division", "Plays", "ScoringDrive%", "PassNY/A", "ExpectedPts"]

function startup() {
    //parallel chart
	var graph = document.getElementById("graphs");
    //barchart
    var graph2 = document.getElementById("graphs2");
    //division list
    var legendDiv = document.getElementById("legendDiv");
    //team list
    var legendDiv2 = document.getElementById("legendDiv2");

    //array of divisions we want to show data for
    var divisionsOfInterest = [];

    //array of teams to include in the Paralle Line Graph and the Bar Chart
    var teamsToDraw = [];
    //array of teams to list in sidebar
    var teamsToList = [];

    //The data from our .csv; That way it's on hand rather than having to pull it again
    var globalData;

    //The statistic for the barchart for initial calls and creatbar() calls from other functions
    var BCStatistic = "Rank";

	var margin = {top: 20, right: 10, bottom: 20, left: 90};
	var width = 1050 - margin.left - margin.right;
	var height = 700 - margin.top - margin.bottom;

	var svg = d3.select(graph)
		.append('svg')
		.attr('width',width+100)
		.attr('height',height-350)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    var svg2 = d3.select(graph2)
		.append('svg')
		.attr('width',width+100)
		.attr('height',height-150)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + (margin.top + 50) + ")");
    var legendDiv = d3.select(legendDiv)
        .append('svg')
        .attr('width', 200)
		.attr('height', 200)
		.append("g")
		.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    var legendDiv2 = d3.select(legendDiv2)
        .append('svg')
        .attr('width', 200)
		.attr('height', 700)
		.append("g")
		.attr("transform", "translate(" + 0 + "," + margin.top + ")");

    /*
        the basis for the Parallel Lines Diagram
    */

	var xScale = d3.scale.ordinal().rangePoints([0, width],1);
	var yScale = {};
	var dragging = {};

	var line = d3.svg.line();
	var axis = d3.svg.axis().orient("left");

	var foreground;
	var background;
    var cValue = function(d) { return d.Team;}
	var color = d3.scale.category10();

    /*
        The basis for the Bar Chart
    */
    var height = 640;
		var xAxisHeight = 645;

		var x = d3.scale.ordinal()
		    .rangeRoundBands([0, width], .1);

		var y = d3.scale.linear()
		    .range([height, 0]);

		var xAxis = d3.svg.axis()
		    .scale(x)
		    .orient("bottom");

		var yAxis = d3.svg.axis()
		    .scale(y)
		    .orient("left");




            // add the tooltip area to the webpage              //Oringally hidden
var tooltip = d3.select("body").append("div")     //Selects the body of the html and adds a <div>
    .attr("class", "tooltip")
    .style("opacity", 0);

    /*
        This is the inital draw. It draws all of the graphs and the lists
    */
    drawEverything();

    /*  ========================================================================
                                Drawing Functions
        ======================================================================== */
    /*
        Draws the Bar Chart
        @param the statistic you want charted
    */
	function createbar(statistic) {

		document.getElementById("barTitle").innerHTML = "Team Valuation by " + statistic;
		d3.csv('csv/teams/years_2015__team_stats.csv', function(error, data) {

			//var divisions = toSet(data.map(function(d){return d["Division"];}));
            globalData = data;

            BCStatistic = statistic;

            svg2.select("g.x.axis").remove();
            svg2.select("g.y.axis").remove();
            var divisions = divisionsOfInterest;

			data.forEach(function(d) {
				d[statistic] = +d[statistic];
			});

            //data filtered by teams that we care about
            data = data.filter(function(d) {
               if (teamsToDraw.indexOf(d.Team) < 0) {
                   return false;
               }
                return true;

            });

			x.domain(data.map(function(d) { return d.Team; }));
			if (statistic == "Rank") {
				y.domain([32,-32]);
			}
			else {
				y.domain([0, d3.max(data, function(d) { return d[statistic]; }) * 2]);
			}

			var yOffset = -375

			svg2.append("g")
			    .attr("class", "x axis")
			    .attr("transform", "translate(10,"+(xAxisHeight + yOffset)+")")
			    .call(xAxis)
			    .selectAll(".tick text")
                .attr("y", 0)
                .attr("x", 9)
                .attr("dy", ".35em")
                .attr("transform", "rotate(45)")
                .style("text-anchor", "start");
//		        .call(wrap, x.rangeBand());


			svg2.append("g")
			    .attr("class", "y axis")
	   		    .attr("transform", "translate(10, " + yOffset + ")")
			    .call(yAxis)
				.append("text")
			      .attr("transform", "rotate(-90)")
			      .attr("y", 3)
			      .attr("dy", ".71em")
			      .style("text-anchor", "end")
			      .text(statistic);

            //update any bars that already exist
			var bars = svg2.selectAll(".bar")
                .data(data, function(d) {return d.Team;})
                .attr("class", "bar")
                .attr("transform", "translate(10," + yOffset + ")")

            bars.transition()
                .attr("x", function(d) {
                return x(d.Team);
                })
                .attr("width", x.rangeBand())
                .attr("y", function(d) { return y(d[statistic]); })
                .attr("height", function(d) { return (height - y(d[statistic])); })
                .style("fill", function(d) {
                  return setTeamColor(d.Team);
                })
                .attr("opacity", function(d) {
                    return setTeamBlockOpacity(d.Team);
                });
            //Create any new bars we might need
            bars.enter().append("rect")
			      .attr("class", "bar")
	   		      .attr("transform", "translate(10," + yOffset + ")")
			      .attr("x", function(d) {
			      	return x(d.Team);
			      })
			      .attr("width", x.rangeBand())
			      .attr("y", function(d) { return y(d[statistic]); })
			      .attr("height", function(d) { return (height - y(d[statistic])); })
	              .style("fill", function(d) {
                        return setTeamColor(d.Team);
                    })
                    .attr("opacity", function(d) {
                            return setTeamBlockOpacity(d.Team);
                        })
	              .on("click", function(d){
									bars.style("stroke-width", "0px");
									d3.select(this).transition()
									.duration(200)
									.style("stroke", "black")
									.style("stroke-width", "2.5px")

						

											updateStats(d);

				  })
							.on("mouseover", function(d) {
								tooltip.style("opacity", 1)
										tooltip.html(d["Team"] + "<br/>" + BCStatistic + ": " + d[BCStatistic])
										.style("left", d3.event.pageX + 5 + "px")
										.style("top", d3.event.pageY + 5 + "px");

							})
							.on("mouseout", function(d) {
								tooltip.style("opacity", 0);

							})


                //Remove any DOMs that don't have an element associated with them
                bars.exit()
                    .remove();



		});
	}

    /*Draw the Parallel Line Graph*/
	function createParallel(){
		var bolded;

		d3.csv('csv/teams/years_2015__team_stats.csv', function(data) {

			var divisions = toSet(data.map(function(d){return d["Division"];}));
//            var divisions = divisionsOfInterest;

			xScale.domain(dimensions = d3.keys(data[0]).filter(function(d) {
    			if (d == "Rank") {
                  // inverts Rank axis
                  return (yScale[d] = d3.scale.linear()
                    .domain(d3.extent(data, function(p) { return +p[d]; }))
                    .range([0, height-380]));
                }
                return !include(COLUMNS_NOT_DISPLAYED,d) &&(yScale[d] = d3.scale.linear()
					.domain(d3.extent(data, function(p) { return +p[d]; }))
					.range([height-380, 0]));
			}));

			background = svg.append("g")
				.attr("class", "background")
				.selectAll("path")
				.data(data)
				.enter().append("path")
				.attr("d", path)
                .attr("id", "dataSetBG")
				.attr("stroke-opacity", function(e) {
							if (teamsToDraw.indexOf(e.Team) < 0) {
								return 0;
							}
							return 1;
						});

			foreground = svg.append("g")
				.attr("class", "foreground")
				.selectAll("path")
				.data(data)
				.enter().append("path")
				.attr("stroke", function(d) {
					return color.range()[divisions.indexOf(d["Division"])];
				})
				.attr("stroke-opacity", function(e) {
							if (teamsToDraw.indexOf(e.Team) < 0) {
								return 0;
							}
							return 1;
						})
				.attr("d", path)
				.attr("stroke", function(d) {
					return color.range()[divisions.indexOf(d["Division"])];
				})
                .attr("id", "dataSet")
                .on("mouseover", function(d){
                    if(teamsToDraw.indexOf(d.Team) > 0){
                        d3.selectAll(".foreground path").transition()
                        .duration(200)
                        .attr("stroke-opacity", function(e) {
							if (teamsToDraw.indexOf(e.Team) < 0) {
								return 0;
							}
							return .35;
						});

                        d3.select(this).transition()
                        .duration(200)
                        .attr("stroke-width", "2.5px")
                        .attr("stroke-opacity", function(e) {
							if (teamsToDraw.indexOf(e.Team) < 0) {
								return 0;
							}
							return 1;
						});

                        tooltip.style("opacity", 1)
                        tooltip.html(d["Team"])
                        .style("left", d3.event.pageX + 5 + "px")
                        .style("top", d3.event.pageY + 5 + "px");

                        updateStats(d);

                    }
                    })
                .on("mouseout", function(d){
                    d3.selectAll(".foreground path").transition()
                    .duration(200)
                    .attr("stroke-opacity", function(e) {
						if (teamsToDraw.indexOf(e.Team) < 0) {
                            return 0;
                        }
                        return 1;
					})
                    .attr("stroke-width", "1px")
                    tooltip.style("opacity", 0)
                    .style("font-weight", "bold")

                        resetStats();
                });



			var g = svg.selectAll(".dimension")
				.data(dimensions)
				.enter().append("g")
				.attr("class", "dimension")
				.attr("transform", function(d) { return "translate(" + xScale(d) + ")"; })
				.call(d3.behavior.drag()
					.origin(function(d) { return {x: xScale(d)}; })
				.on("dragstart", function(d) {
					dragging[d] = xScale(d);
					background.attr("visibility", "hidden");
				})
				.on("drag", function(d) {
					dragging[d] = Math.min(width, Math.max(0, d3.event.x));
					foreground.attr("d", path);
					dimensions.sort(function(a, b) { return position(a) - position(b); });
					xScale.domain(dimensions);
					g.attr("transform", function(d) { return "translate(" + position(d) + ")"; })
				})
				.on("dragend", function(d) {
					delete dragging[d];
					transition(d3.select(this)).attr("transform", "translate(" + xScale(d) + ")");
					transition(foreground).attr("d", path);
					background
						.attr("d", path)
						.transition()
						.delay(500)
						.duration(0)
						.attr("visibility", null);
					
				}));

			g.append("g")
				.attr("class", "axis")
				.each(function(d) { d3.select(this).call(axis.scale(yScale[d])); })
				.append("text")
				.style("text-anchor", "middle")
				.attr("y", -9)
                .attr("transform", "rotate(8)")
				.text(function(d) { return d; })
				.on("click", function(d){
//					svg.selectAll('*').remove();
					createbar(d);
					d3.select(this).transition()
						.duration(150)
						.style("font-weight", "bold");
					d3.select(bolded).transition()
						.duration(150)
						.style("font-weight", "normal");
					bolded = this;
				})
                .on("mouseover", function(d){
                    d3.select(this)
					.transition()
                    .duration(150)
                    .style("font-weight", "bold");
                })
                .on("mouseout", function(d){
					if (this != bolded) {
						d3.select(this).transition()
						.duration(150)
						.style("font-weight", "normal");
					}
                });

			g.append("g")
				.attr("class", "brush")
				.each(function(d) {
				d3.select(this)
					.call(yScale[d].brush = d3.svg.brush()
					.y(yScale[d])
					.on("brushstart", brushstart)
					.on("brush", brush));
				})
				.selectAll("rect")
				.attr("x", -8)
				.attr("width", 16);

		});
	}

    /*
        Draw the division legend
        @param the data from our CSV
    */
    function drawDivisions(data) {
        //add all the teams to the set we are working with
        teams = toSet(data.map(function(d){return d["Team"];}));
		var divisions = toSet(data.map(function(d){return d["Division"];}));

		var legend = legendDiv.selectAll(".legend")
			.data(divisions)
			.enter()
			.append("g")
			.attr("class", "legend")
			.attr("transform", function(d, i) { return "translate(" + (margin.left * -1) + "," + (i * 20) + ")";                 })
            .on("click", function(d) {
                updateDivisions(d);


                //clear out the teams from the previous selection
                //I could make this into enter() update() exit() but this is easier
//                legendDiv2.selectAll('*').remove();
                //update the teams
                updateTeamsByDivision(d);

                drawTeams(globalData);

                updateTeams();
                //update Parallel Line Graph
                updateParallel();

                createbar(BCStatistic);

            })
            .on("mouseover", function(d){
                d3.select(this).transition()
                    .duration(200)
                    .style("font-weight", "bold")
                    .style("font-size", "17px");

                d3.selectAll(".foreground path").transition()
                    .duration(200)
                    .attr("stroke-opacity", function(e){
                        if(d === e["Division"]){
                            return 1;
                        }
                        return 0;
                    })
                    .attr("stroke-width", function(e){
                        if(d === e["Division"]){
                            return "2px";
                        }
                        return "1px";
                    });


            })
            .on("mouseout", function(d){
                d3.select(this).transition()
                .duration(200)
                .style("font-weight", "normal")
                .style("font-size", "16px");

                d3.selectAll(".foreground path").transition()
                    .duration(200)
                    .attr("stroke-opacity", function(e){
                        if (teamsToDraw.indexOf(e.Team) < 0) {
                            return 0;
                        }
                        return 1;
                    })
                    .attr("stroke-width", "1px");

            });

		// draw legend colored rectangles
		legend.append("rect")
			.attr("x", 108)
			.attr("width", 14)
			.attr("height", 18)
			.style("fill", color);

		// draw legend text
		legend.append("text")
			.attr("x", 90)
			.attr("y", 9)
			.attr("dy", ".35em")
			.style("text-anchor", "end")
            .style("fill", color)
			.text(function(d) { return d;})
	}
    /*
        Draw the team legend
        @param the data from our CSV
    */
    function drawTeams(data) {

        //removes old text elements
        legendDiv2.selectAll(".divisionTeam text").remove();
        legendDiv2.selectAll(".divisionTeam").remove();
   
        //Opacity variable
        var thisOpacity = .25;

		var legend2 = legendDiv2.selectAll(".divisionTeam")
			.data(teamsToList);

        legend2.enter()
			.append("g")
			.attr("class", "divisionTeam")
			.attr("transform", function(d, i) { return "translate(" + 25 + "," + (i * 20) + ")";                 })
            .attr("opacity", function(d) {
                if (teamsToDraw.indexOf(d) >= 0) {
                    return 1;
                }
                return .3;
            })
            .on("click", function(d){
                // update the teams of interests
                updateTeams(d);
                console.log("Teams to draw " + teamsToDraw);
                //Now that teams are updated we update the parallel line graph too
                updateParallel();
                //now that teams are updated we updadte the barchart as well
                createbar(BCStatistic);
            })
             .on("mouseover", function(d){
                d3.select(this).transition()
                .duration(200)
                .style("font-weight", "bold")
                .style("font-size", "11px")
                            })
           .on("mouseout", function(d){
                d3.select(this).transition()
                .duration(200)
                .style("font-weight", "normal")
                .style("font-size", "10px");
				updateParallel();
            })

		// draw legend colored rectangles
		.append("rect")
			.attr("x", 88)
			.attr("width", 15)
			.attr("height", 18)
			.style("fill", function(d) {
                return setTeamColor(d)});
        legend2.append("text")
                .attr("id", "check")
                .attr("x", 95)
                .attr("y", 9)
                .attr("dy", ".35em")
                .style("text-anchor", "middle")
                .text(function(d) { return "✓";})
                .style("fill", "Black");
        
            

		// draw legend text
		legend2.append("text")
			.attr("x", 70)
			.attr("y", 9)
			.attr("dy", ".35em")
			.style("text-anchor", "end")
			.text(function(d) { return d;});

//        legend2.exit().remove();
    }

    /*
        Draw EVERYTHING. Called at the very beginning of the run.
    */
	function drawEverything() {
        d3.csv('csv/teams/years_2015__team_stats.csv', function(error, data) {
            teamsToDraw = [];//toSet(data.map(function(d){return d["Team"];}));
            teamsToList = [];//toSet(data.map(function(d){return d["Team"];}));
			divisionsOfInterest = [];//toSet(data.map(function(d){return d["Division"];}));


            globalData = data;
            drawDivisions(data);
            drawTeams(data);
            createParallel();
            createbar(BCStatistic);

			updateDivisions();
			updateTeams();
			updateParallel();


        });
    }


    /*  ========================================================================
                                update functions
        ======================================================================== */

    /*
        function that updates the visible portions of the parallel line graph based on teams of             interest
    */
    function updateParallel() {
        //select all the foreground lines and remove the ones we don't want
                //I'm just changing the opacity for ease.


				d3.selectAll(".foreground path")
					.transition()
                    .duration(200)
                    .attr("stroke-opacity", function(e){
                        if (teamsToDraw.indexOf(e.Team) < 0) {
                            return 0;
                        }
                        return 1;
                    });

				d3.selectAll(".background path").transition()
                    .duration(200)
                    .attr("stroke-opacity", function(e){
                        if (teamsToDraw.indexOf(e.Team) < 0) {
                            return 0;
                        }
                        return 1;
                    });



    }
    /*
        function that updates the opacity of divisions
        @param the division you want added or removed from divisionsOfInterest
    */
    function updateDivisions(d) {
        /* If the division is already in the list remove it from the list
            Set the opacity to .5
            If the division is not in the list add it to the list
            Set the opacity to 1
        */
        var removed = remove(divisionsOfInterest, d);
        if (removed == -1) {
            //add this division to our divisions of interest
            divisionsOfInterest.push(d);
            console.log("pushed a division");
        } else {
            console.log("removed a division");
        }
        legendDiv.selectAll(".legend")
            .attr("opacity", function(c) {
                if(divisionsOfInterest.indexOf(c) < 0) {
                    return .3;
                } else {
                    return 1;
                }
        });
        legendDiv.selectAll(".legend rect")
            .attr("stroke", "black")
            .attr("stroke-width", function(c) {
                if(divisionsOfInterest.indexOf(c) < 0) {
                    return 1;
                } else {
                    return 0;
                }
        });
    }


    /*
        function that updates the teamsToList and teamsToDraw
        it removes/adds any teams within the division provided
        @param the team you want added or removed from teamsToDraw/teamsToList
    */
    function updateTeamsByDivision(division) {
        var localData = globalData;
        if(divisionsOfInterest.indexOf(division) < 0) {
            localData.forEach(function(d) {
               if (d.Division == division) {
                   console.log("~~~~Teams to draw Removal~~~~");
                   remove(teamsToDraw, d.Team);
                   console.log("++++Teams to list Removal++++");
                   remove(teamsToList, d.Team);
                    console.log("Team removed: " + d.Team);
               }
            });
        } else {
            localData.forEach(function(d) {
               if (d.Division == division) {
                   teamsToDraw.push(d.Team);
                   console.log("Index of that push: " + teamsToDraw.indexOf(d.Team));
                   teamsToList.push(d.Team);
                    console.log("Team added: " + d.Team);
               }
            });
            console.log("teams to draw: " + teamsToDraw);
        }
        teamsToDraw = toSet(teamsToDraw);
        teamsToList = toSet(teamsToList);
    }

    /*
        function that updates the opacity of team legend
        @param the team you want added or removed from teamsToDraw
    */
    function updateTeams(team) {
        //try to remove this team
        console.log("updateTeams remove");
        var removed = remove(teamsToDraw, team);
        if (removed == -1) {
            //it wasn't in the list
            //add this team to our teams of interest
            teamsToDraw.push(team);
        }
        //change the opacity of the blocks based on if they're in the group.
         legendDiv2.selectAll(".divisionTeam")
            .attr("opacity", function(c) {
                if(teamsToDraw.indexOf(c) < 0) {
                    return .3;
                } else {
                    return 1;
                }
            });

        legendDiv2.selectAll(".divisionTeam rect")
            .attr("stroke", "black")
            .attr("opacity", function(c) {
                if(teamsToDraw.indexOf(c) < 0) {
                    return .3;
                } else {
                    return setTeamBlockOpacity(c);
                }
            })
            .attr("stroke-width", function(c) {
                if(teamsToDraw.indexOf(c) < 0) {
                    return 2;
                } else {
                    return 0;
                }
         });
        
                legendDiv2.selectAll("#check")
            .attr("opacity", function(c) {
                if(teamsToDraw.indexOf(c) < 0) {
                    return 0;
                } else {
                    return 1;
                }
            });
    }
    
    function setTeamColor(d) {
        var data = globalData;
        //Array of divisions to pull color from
        var divisions = toSet(data.map(function(d){return d["Division"];}));
        var thisDivision = null;
        data.forEach(function(c) {
            if (c.Team == d) {
                thisDivision = c.Division;
            }
        })
        return color.range()[divisions.indexOf(thisDivision)];
    }
    
    function setTeamBlockOpacity(d) {
        var thisOpacity = .25;
        var divisions = toSet(globalData.map(function(d){return d["Division"];}));
        var thisDivision = null;
        globalData.forEach(function(c) {
            if (c.Team == d) {
                thisDivision = c.Division;
            } else if (thisDivision != null && thisDivision == c.Division) {
                thisOpacity += .25;
            }
        });
        console.log("Opacity of " + d + " is: " +thisOpacity);
        return thisOpacity;
    }

    function updateStats(d) {
        d3.select("#Team-Name").text(d["Team"]);
        d3.select("#NFL-label-rank").text(d["Rank"]);
        d3.select("#NFL-label-points").text(d["Points"]);
        d3.select("#NFL-label-yds").text(d["Yds"]);
        d3.select("#NFL-label-ydsperplay").text(d["Yds/Play"]);
        d3.select("#NFL-label-tos").text(d["TOs"]);
        d3.select("#NFL-label-fumbleslost").text(d["FumblesLost"]);
        d3.select("#NFL-label-1stdowns").text(d["1stDs"]);
        d3.select("#NFL-label-completions").text(d["Completions"]);
        d3.select("#NFL-label-passattempts").text(d["PassAttempts"]);
        d3.select("#NFL-label-passyds").text(d["PassYds"]);
        d3.select("#NFL-label-passtds").text(d["PassTDs"]);
        d3.select("#NFL-label-intthrown").text(d["IntsThrown"]);
        d3.select("#NFL-label-pass1sttds").text(d["Pass1stDs"]);
        d3.select("#NFL-label-rushattempts").text(d["RushAttempts"]);
        d3.select("#NFL-label-rushyds").text(d["RushYds"]);
        d3.select("#NFL-label-rushtds").text(d["RushTDs"]);
        d3.select("#NFL-label-rushya").text(d["RushY/A"]);
        d3.select("#NFL-label-rush1sttd").text(d["Rush1stDs"]);
        d3.select("#NFL-label-penalties").text(d["Penalties"]);
        d3.select("#NFL-label-penyds").text(d["PenYds"]);
        d3.select("#NFL-label-pen1stds").text(d["Pen1stDs"]);
        d3.select("#NFL-label-todriveperc").text(d["TODrive%"]);
    }

    function resetStats() {
        d3.select("#Team-Name").text("NFL Team Stats");
        d3.select("#NFL-label-rank").text("--");
        d3.select("#NFL-label-points").text("--");
        d3.select("#NFL-label-yds").text("--");
        d3.select("#NFL-label-ydsperplay").text("--");
        d3.select("#NFL-label-tos").text("--");
        d3.select("#NFL-label-fumbleslost").text("--");
        d3.select("#NFL-label-1stdowns").text("--");
        d3.select("#NFL-label-completions").text("--");
        d3.select("#NFL-label-passattempts").text("--");
        d3.select("#NFL-label-passyds").text("--");
        d3.select("#NFL-label-passtds").text("--");
        d3.select("#NFL-label-intthrown").text("--");
        d3.select("#NFL-label-pass1sttds").text("--");
        d3.select("#NFL-label-rushattempts").text("--");
        d3.select("#NFL-label-rushyds").text("--");
        d3.select("#NFL-label-rushtds").text("--");
        d3.select("#NFL-label-rushya").text("--");
        d3.select("#NFL-label-rush1sttd").text("--");
        d3.select("#NFL-label-penalties").text("--");
        d3.select("#NFL-label-penyds").text("--");
        d3.select("#NFL-label-pen1stds").text("--");
        d3.select("#NFL-label-todriveperc").text("--");
    }



    /*  ========================================================================
                        the Helper functions  written by Brandon
        ======================================================================== */


    function fade(selectedBar) {
            d3.selectAll("rect")
                .filter(function(d, i) {
                    return selectedBar != d;
                })
                .transition()
                .style("opacity", .4);

    }

    function unfade(selectedBar) {
            d3.selectAll("rect")
                .transition()
                .style("opacity", 1);

    }

    function wrap(text, width) {
		text.each(function() {
		  	var text = d3.select(this),
		    words = text.text().split(/\s+/).reverse(),
		    word,
		    line = [],
		    lineNumber = 0,
		    lineHeight = 1.1,
		    y = text.attr("y"),
		    dy = parseFloat(text.attr("dy")),
		    tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
		  	while (word = words.pop()) {
		      line.push(word);
		      tspan.text(line.join(" "));
		      if (tspan.node().getComputedTextLength() > width) {
		        line.pop();
		        tspan.text(line.join(" "));
		        line = [word];
		        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
		      }
		    }
	  	});
	}


	function toSet(arr) {
		var unique = arr.filter(function(item, pos, self) {
    		return self.indexOf(item) == pos;
		}).sort();
		return unique;
	}

	function include(arr,obj) {
    	return (arr.indexOf(obj) != -1);
	}

	function position(d) {
		var v = dragging[d];
		return v == null ? xScale(d) : v;
	}

	function transition(g) {
		return g.transition().duration(500);
	}

	function path(d) {
		return line(dimensions.map(function(p) { return [position(p), yScale[p](d[p])]; }));
	}

	function brushstart() {
		d3.event.sourceEvent.stopPropagation();
	}

	function brush() {
		var actives = dimensions.filter(function(p) { return !yScale[p].brush.empty(); });
		var extents = actives.map(function(p) { return yScale[p].brush.extent(); });
		foreground.style("display", function(d) {
			if (actives.every(function(p, i) {
				return extents[i][0] <= d[p] && d[p] <= extents[i][1];
			})) 
			{
				if (contains(teamsToList, d.Team)) {
					teamsToDraw.push(d.Team);
					toSet(teamsToDraw);
				}
				return null;
			}
			teamsToDraw = teamsToDraw.filter(function(el) { return el != d.Team; }); 
			return "none";
		});
		createbar(BCStatistic);
	}

	function contains(a, obj) {
		var i = a.length;
		while (i--) {
		   if (a[i] === obj) {
			   return true;
		   }
		}
		return false;
	}
    /*
        Removes an element from an array
        @param the array we want to alter
        @param the element we want removed
        @return returns a 1 if the element was in the array; Otherwise, -1
    */
    function remove(arr, elem) {
        var i = arr.indexOf(elem);
        if (i < 0) {
            console.log("did not remove " + elem);
            return -1;
        }
        console.log("removed " + elem);
        arr.splice(i, 1);
        return 1;
    }


}
