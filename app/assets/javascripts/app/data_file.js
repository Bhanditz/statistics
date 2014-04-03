function handsontable_with_filter(selector, data, readonly) {

    $(selector).handsontable({
        startRows: 5,
        startCols: 5,
        minRows: 5,
        minCols: 5,
        rowHeaders: true,
        colHeaders: true,
        minSpareRows: 1,
        stretchH: 'all',
        readOnly: readonly,
        fixedRowsTop: 2,
        fixedColumnsLeft: 2,
        autoWrapRow: true,
        columnSorting: true,
        manualColumnResize: true,
        manualColumnMove: true,
        contextMenu: true,
        autoWrapRow: true,
                outsideClickDeselects: false,
        cells: function(row, col, prop) {
            if (row <= 0) {
                var cellProperties = {
                    renderer: firstRowRenderer
                }
                return cellProperties;
            }
        }


    });

    if (data.length > 0) {
        var handsontable = $(selector).data('handsontable');
        handsontable.loadData(data);
    }

    function firstRowRenderer(instance, td, row, col, prop, value, cellProperties) {
        Handsontable.TextCell.renderer.apply(this, arguments);
        td.style.fontWeight = 'bold';
        td.style.color = '#1B668B';
        td.style.background = '#f0f0f0';
    }


    $(selector + ' table').addClass('table-hover table-condensed');
    $(selector + ' table tbody tr:first').css('font-weight', 'bold').css("color", "#1B668B");


    function ConvertToCSV(objArray) {
        var array = typeof objArray != 'object' ? JSON.parse(objArray) : objArray;
        var str = '';

        for (var i = 0; i < array.length; i++) {
            var line = '';
            for (var index in array[i]) {
                if (line != '')
                    line += ','

                line += array[i][index];
            }

            str += line + '\r\n';
        }

        return str;
    }

}

function remove_null_rows(selector) {
    var total_rows = $(selector).handsontable('countRows');

    for (var i = total_rows - 1; i >= 0; i--) {

        if ($(selector).handsontable("isEmptyRow", i)) {
            $(selector).handsontable("alter", "remove_row", i);
        }

    }

}

function remove_null_cols(selector) {
    var total_cols = $(selector).handsontable('countCols');

    for (var i = total_cols - 1; i >= 0; i--) {
        if ($(selector).handsontable("isEmptyCol", i)) {
            $(selector).handsontable("alter", "remove_col", i);
        }

    }

}


function generate_article_chart() {

    $(".wmd-input").hide();
    var converter = new Showdown.converter();
    var chart_types = {"Pie Chart": "pie", "Election Donut Chart": "election-donut", "Donut Chart": "donut", "Bar Chart": "bar", "Column Chart": "column", "Grouped Column Chart": "grouped-column", "Line Chart": "line"}
    gon.mapped_output = {}
    gon.lineChartData = {}
    // gon.mapped_output["#pie-chart"] = @mapped_output
    // gon.lineChartData["#pie-chart"] = gon.csv_data

    $.each(gon.cms_articles, function(index, data) {

        var class_name = "#preview-" + data.id;

        var title = "";
        if (data.description.split("![visualization]\(")) {
            title = data.description.split("![visualization]\(");
            if (title.length > 1) {
                title = title[1].split("\)")[0];
            } else {
                title = "";
            }
        }


        if (title.length > 0) {

            $("<div>")
                    .attr("id", title + "_Id_" + data.id)
                    .css({
                        "height": "200px",
                        "width": "180px"
                    })
                    .appendTo(class_name)
            var custom_chart = ["Bubble Chart", "Bullet Chart", "Compare Line Chart"];
            $.get("/generate/chart/" + title, function(vdata, status) {
                if (custom_chart.indexOf(vdata.chart_type) >= 0) {
                    // gon.mapped_output["#pie-chart"] = @mapped_output
                    // gon.lineChartData["#pie-chart"] = gon.csv_data

                    GenerateCustomChart(vdata.chart_type, '#' + title + "_Id_" + data.id, vdata.mapped_output);
                } else {
                    if (vdata) {
                        dw.visualize({
                            type: chart_types[vdata.chart_type] + "-chart",
                            theme: 'default',
                            container: $('#' + title + "_Id_" + data.id),
                            datasource: dw.datasource.delimited({csv: vdata.mapped_output})
                        })
                    }
                }

            });

        }

        if (title.length <= 0) {
            var image_checker = converter.makeHtml(data.description);
            $(class_name).html(image_checker);
            var element_type = $(class_name + " img:first")

            if (element_type.length <= 0) {
                element_type = image_checker;
            }

            $(class_name).html(element_type);
        }

    });

}

function GenereteChartInMarkdown() {

    var chart_types = {"Pie Chart": "pie", "Election Donut Chart": "election-donut", "Donut Chart": "donut", "Bar Chart": "bar", "Column Chart": "column", "Grouped Column Chart": "grouped-column", "Line Chart": "line"}
    gon.mapped_output = {}
    gon.lineChartData = {}
    $(".pykih-viz").each(function(index) {
        var title = $(this).attr("data-slug-id");
        var that = $(this);
        var width = $(this).parent("div").attr("class");
        var div_id = $("#" + title).attr("id");

        var custom_chart = ["Bubble Chart", "Bullet Chart", "Compare Line Chart"];
        $.get("/generate/chart/" + title, function(vdata, status) {
            if (custom_chart.indexOf(vdata.chart_type) >= 0) {
                gon.mapped_output["#" + title] = vdata.mapped_output
                gon.lineChartData["#" + title] = vdata.chart_data
                GenerateCustomChart(vdata.chart_type, "#" + title, vdata.chart_data);
                if (vdata.chart_type === "Compare Line Chart") {
                    $("#" + title + " .filter-compare-to-line").trigger("change");
                    that.addClass("compare-custom-line-chart");

                    if ($("#" + title).height() < 100) {
                        $("#" + title).css("height", "300px")
                    }
                }

            } else {
                if (vdata) {
                    $(that).addClass("col-sm-12");
                    $(that).css("height", "250px");
                    dw.visualize({
                        type: chart_types[vdata.chart_type] + "-chart",
                        theme: 'default',
                        container: that,
                        datasource: dw.datasource.delimited({csv: vdata.chart_data})
                    })
                }
            }
        });
    });
}

function get_html_template(layout_type, style) {

    var algorithm = parseInt(layout_type.split("x")[1]);
    var html_tag = "<div class='row'>";

    var class_name = "col-sm-12";
    if (algorithm >= 2) {
        class_name = "col-sm-" + (12 / algorithm);
    }

    for (var i = 1; i <= algorithm; i++) {
        html_tag = html_tag + "<div class='" + class_name + "'></div>";
    }

    return html_tag = html_tag + "</div>";
}

function randomString() {
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
    var string_length = 5;
    var randomstring = '';
    for (var i = 0; i < string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars.substring(rnum, rnum + 1);
    }
    return randomstring;
}

function GenereteDataWrapperChart(options) {

    var chart_types = {"Pie Chart": "pie", "Election Donut Chart": "election-donut", "Donut Chart": "donut", "Bar Chart": "bar", "Column Chart": "column", "Grouped Column Chart": "grouped-column", "Line Chart": "line"}

    var title = options.title;
    $("#" + options.id).addClass("col-sm-12");
    $("#" + options.id).css("height", "250px");
    var custom_chart = ["Bubble Chart", "Compare Line Chart", "Bullet Chart"];
    $.get("/generate/chart/" + title, function(vdata, status) {

        if (vdata) {
            if (custom_chart.indexOf(vdata.chart_type) >= 0) {
                GenerateCustomChart(vdata.chart_type, '#' + title + "_Id_" + data.id, vdata.mapped_output);
            } else {
                dw.visualize({
                    type: chart_types[vdata.chart_type] + "-chart",
                    theme: 'default',
                    container: options.selector,
                    datasource: dw.datasource.delimited({csv: vdata.mapped_output})
                })
            }
        }
    });
}

function GenerateCustomChart(chart_type, selector, data, mapped_output) {
    if (chart_type == "Bubble Chart") {
        GenerateCustomBubbleChart(selector, data);
    } else if (chart_type == "Compare Line Chart") {
        GenerateCustomLineChart(selector, gon.lineChartData[selector], gon.mapped_output[selector]);
    } else if (chart_type === "Bullet Chart") {
        GenerateBulletChart(selector, data);
    }else  if (chart_type === "Cross Filter") {
        var options = {selector: selector, chart_type: chart_type,
                       data: data                                             
                      };
        generateCrossFilterChart(options);
    }
}

function convertDataToBulletChart(data) {
    var output = [];
    for (var i = 0; i <= data.length - 1; i++) {
        if (i > 0) {
            output.push({"title": data[i][0], "subtitle": data[i][1],
                "ranges": stringToNumArr(data[i][2].split(",")),
                "measures": stringToNumArr(data[i][3].split(",")),
                "markers": stringToNumArr(data[i][4].split(","))
            });
        }
    }
    return output;
}

function stringToNumArr(data_arr) {
    var output = [];
    for (var i = 0; i <= data_arr.length - 1; i++) {
        output.push(parseInt(data_arr[i]));
    }
    return output;
}

function GenerateBulletChart(selector, data) {
    var margin = {top: 5, right: 40, bottom: 20, left: 120},
    width = $(selector).width() - margin.left - margin.right,
            height = 50 - margin.top - margin.bottom;

    var chart = d3.bullet()
            .width(width)
            .height(height);

    data = d3.csv.parseRows(data);
    data = convertDataToBulletChart(data);
    var svg = d3.select(selector).selectAll(selector + " svg")
            .data(data)
            .enter().append("svg")
            .attr("class", "bullet")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .call(chart);

    var title = svg.append("g")
            .style("text-anchor", "end")
            .attr("transform", "translate(-6," + height / 2 + ")");

    title.append("text")
            .attr("class", "title")
            .text(function(d) {
                return d.title;
            });

    title.append("text")
            .attr("class", "subtitle")
            .attr("dy", "1em")
            .text(function(d) {
                return d.subtitle;
            });
}

function formaToCustomLineData(data) {
    var output = [];
    for (var i = 0; i <= data.length - 1; i++) {
        if (i > 0) {
            output.push(data[i]);
        }
    }
    return output;
}

function GenerateCustomLineChart(selector, data, mapped_output) {
    data = d3.csv.parseRows(data);
    data = formaToCustomLineData(data);
    data = setDataByFilter(data, selector);
    updateLineChartWithAxis(selector, data, mapped_output);
}

function setDataByFilter(data, selector) {
    var compare_to_pos = $(selector + " .filter-compare-to-line").val();
    var filtered_data = [getDataFromFilter(data[compare_to_pos], selector)];
    var compare_with_pos = $(selector + " .filter-compare-with-line").val();
    var time_frame = $(selector + " .filter-time-frame-line").val();
    if (compare_with_pos > 0) {
        filtered_data.push(getDataFromFilter(data[compare_with_pos], selector));
    }

    var time_frames = ["Monthly", "Quaterly", "Yearly", "All"];
    var new_data_set = [];
    for (var i = 0; i <= filtered_data.length - 1; i++) {
        var qdata = filtered_data[i];
        for (var j = 1; j <= time_frame; j++) {
            var format = {"y": parseInt(qdata[j]), "x": time_frames[j - 1],
                "group": qdata[0]}
            new_data_set.push(format);
        }
        ;
    }
    ;
    return new_data_set;
}

function getDataFromFilter(data, selector) {
    var filtered_data = [];
    var time_frame = $(selector + " .filter-time-frame-line").val();
    for (var i = 0; i <= time_frame; i++) {
        filtered_data.push(data[i]);
    }
    ;
    return filtered_data;
}

function clubDataForBubbleChart(data) {
    var filtered_data = [];
    var how_much = 50;
    for (var i = 0; i <= data.length - 1; i++) {
        if (how_much >= i) {
            filtered_data.push(data[i]);
        } else {
            var prev_data0 = "Others";
            var current_val = parseInt(data[i][1]);
            if (filtered_data[how_much]) {
                current_val += parseInt(filtered_data[how_much][1]);
                filtered_data[how_much] = [prev_data0, current_val];
            } else {
                filtered_data.push([prev_data0, current_val]);
            }
        }

    }
    ;
    return filtered_data;
}
function GenerateCustomBubbleChart(selector, data) {

    var diameter = 500,
            format = d3.format(",d"),
            color = d3.scale.category20c();

    var bubble = d3.layout.pack()
            .sort(null)
            .size([diameter, diameter])
            .padding(1.5);

    var svg = d3.select(selector).append("svg")
            .attr("width", diameter)
            .attr("height", diameter)
            .attr("class", "bubble");

    var data = d3.csv.parseRows(data);
    var data = clubDataForBubbleChart(data);

    var node = svg.selectAll(".node")
            .data(bubble.nodes(classes(data))
                    .filter(function(d) {
                        return !d.children;
                    }))
            .enter().append("g")
            .attr("class", "node")
            .attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            });

    node.append("title")
            .text(function(d) {
                return d.className + ": " + format(d.value);
            });

    node.append("circle")
            .attr("r", function(d) {
                return d.r;
            })
            .style("fill", function(d) {
                return color(d.packageName);
            });

    node.append("text")
            .attr("dy", ".3em")
            .style("text-anchor", "middle")
            .text(function(d) {
                return d.className.substring(0, d.r / 3);
            });


    // Returns a flattened hierarchy containing all leaf nodes under the root.
    function classes(root) {
        var classes = [];

        function recurse(name, nodes) {
            nodes.forEach(function(node, index) {
                if (index > 0) {
                    classes.push({packageName: node[0], className: node[0], value: node[1]});
                }
            });
            // return false;
            // if (node.children) node.children.forEach(function(child) { recurse(node.name, child); });
            // else classes.push({packageName: name, className: node.name, value: node.size});
        }

        recurse(null, root);
        return {children: classes};
    }

    d3.select(self.frameElement).style("height", diameter + "px");

}

// This Jquery extend function for textarea to add text or data @ cursor postion
$.fn.insertAtCaret = function(text) {
    return this.each(function() {
        if (document.selection && this.tagName == 'TEXTAREA') {
            //IE textarea support
            this.focus();
            sel = document.selection.createRange();
            sel.text = text;
            this.focus();
        } else if (this.selectionStart || this.selectionStart == '0') {
            //MOZILLA/NETSCAPE support
            startPos = this.selectionStart;
            endPos = this.selectionEnd;
            scrollTop = this.scrollTop;
            this.value = this.value.substring(0, startPos) + text + this.value.substring(endPos, this.value.length);
            this.focus();
            this.selectionStart = startPos + text.length;
            this.selectionEnd = startPos + text.length;
            this.scrollTop = scrollTop;
        } else {
            // IE input[type=text] and other browsers
            this.value += text;
            this.focus();
            this.value = this.value;    // forces cursor to end
        }
    });
};

$(document).ready(function() {

    $(document).on("change", ".filter-compare-to-line", function() {
        var selector = $(this).attr("data-selector");
        var compareTo = $(selector + " .filter-compare-to-line").val();
        var compareWith = $(selector + " .filter-compare-with-line").val();
        var timeFrame = $(selector + " .filter-time-frame-line").val();
        if (validateCompareToWith(selector)) {
            $(selector + " svg").remove()
            GenerateCustomChart("Compare Line Chart", selector, gon.lineChartData[selector], gon.mapped_output[selector]);
        }
        $(selector + " .filter-compare-to-line").val(compareTo);
        $(selector + " .filter-compare-with-line").val(compareWith);
        $(selector + " .filter-time-frame-line").val(timeFrame);

    });

    $(".filter-compare-to-line").trigger("change");

    $(document).on("change", ".filter-compare-with-line", function() {

        var selector = $(this).attr("data-selector");
        var compareTo = $(selector + " .filter-compare-to-line").val();
        var compareWith = $(selector + " .filter-compare-with-line").val();
        var timeFrame = $(selector + " .filter-time-frame-line").val();
        if (validateCompareToWith(selector)) {
            $(selector + " svg").remove()
            GenerateCustomChart("Compare Line Chart", selector, gon.lineChartData[selector], gon.mapped_output[selector]);
        }
        $(selector + " .filter-compare-to-line").val(compareTo);
        $(selector + " .filter-compare-with-line").val(compareWith);
        $(selector + " .filter-time-frame-line").val(timeFrame);
    });

    $(document).on("change", ".filter-time-frame-line", function() {
        var selector = $(this).attr("data-selector");
        var compareTo = $(selector + " .filter-compare-to-line").val();
        var compareWith = $(selector + " .filter-compare-with-line").val();
        var timeFrame = $(selector + " .filter-time-frame-line").val();
        if (validateCompareToWith(selector)) {
            $(selector + " svg").remove()
            GenerateCustomChart("Compare Line Chart", selector, gon.lineChartData[selector], gon.mapped_output[selector]);
        }
        $(selector + " .filter-compare-to-line").val(compareTo);
        $(selector + " .filter-compare-with-line").val(compareWith);
        $(selector + " .filter-time-frame-line").val(timeFrame);
    });

});

function validateCompareToWith(selector) {
    var compareTo = $(selector + " .filter-compare-to-line").val();
    var compareWith = $(selector + " .filter-compare-with-line").val();
    if (compareTo === compareWith) {
        alert("Compare To & With Value Cannot be Same");
        return false;
    } else {
        return true;
    }
}

function appendSelectCustomLineChart(selector, mapped_output) {
    var lable_name = "Compare";
    var html_template = "";
    var class_name = "filter-compare-to-line";
    for (var i = 1; i <= 2; i++) {
        html_template += " <strong>" + lable_name + "</strong>";
        html_template += "<select class='" + class_name + "' data-selector='" + selector + "'>";
        for (var j = 1; j <= mapped_output.length - 1; j++) {
            if (i > 1 && j <= 1) {
                html_template += "<option value=''>None</option>";
            }
            var key = j - 1;
            html_template += "<option value=" + key.toString() + ">" + mapped_output[j][0] + "</option>";
        }
        ;
        html_template += "</select>";
        lable_name = " With";
        class_name = "filter-compare-with-line";
    }
    ;
    class_name = "filter-time-frame-line";
    html_template += " <strong>Time</strong>";
    html_template += '<select class="' + class_name + '" data-selector="' + selector + '"><option value="1">Monthly</option><option value="2">Quarter</option><option value="3">Year</option><option selected="selected" value="4">Maximum</option></select>';
    return html_template;
}

function updateLineChartWithAxis(selector, data, mapped_output) {
    if ($(selector).height() < 60) {
        height = 300
    } else {
        height = $(selector).height();
    }

    var m = [30, 80, 50, 80];
    var w = $(selector).width() - m[1] - m[3];
    var h = height - m[0] - m[2];

    var line = d3.svg.line().interpolate("linear")
            .x(function(d) {
                return x(d.x);
            })
            .y(function(d) {
                return y(d.y);
            });
    var html_template = appendSelectCustomLineChart(selector, mapped_output);
    $(selector).html(html_template);

    var x = d3.scale.ordinal().rangeRoundBands([0, w], .95);
    var y = d3.scale.linear().range([h, 0]);
    var xAxis = d3.svg.axis().scale(x).orient("bottom");
    var yAxis = d3.svg.axis().scale(y).orient("left");

    var graph = d3.select(selector).append("svg:svg")
            .attr("width", w + m[1] + m[3])
            .attr("height", h + m[0] + m[2])
            .append("svg:g")
            .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

    x.domain(data.map(function(d) {
        return d.x;
    }));
    y.domain([d3.min(data, function(d) {
            return d.y;
        }),
        d3.max(data, function(d) {
            return d.y;
        })]);

    // graph.append("svg:g")
    //      .attr("class", "x axis")
    //      .attr("transform", "translate(0," + h + ")")
    //      .call(xAxis);

    var yAxisLeft = d3.svg.axis()
            .scale(y)
            .ticks(5)
            .orient("left")
            .tickSize(-w)
            .tickSubdivide(true);

    graph.append("svg:g")
            .attr("class", "y axis")
            .attr("transform", "translate(0,0)")
            .style("stroke-dasharray", ("3, 3"))
            .call(yAxisLeft);

    var groups = [];

    data.forEach(function(group) {
        if (groups.indexOf(group.group) < 0) {
            groups.push(group.group);
        }
    });
    var counter = 0;
    var color = "#51A6F9";
    groups.forEach(function(group) {

        if (counter > 0) {
            color = "#6DBE3D"
        }
        counter++;

        var line_data = [];
        var class_name = group;
        data.forEach(function(d) {
            if (group.indexOf(d.group) >= 0) {
                line_data.push({x: d.x, y: d.y, group: d.group});
            }
        });

        graph.append("svg:path")
                .attr("d", line(line_data))
                .attr("stroke", color)
                .attr("class", "line point-line line-" + class_name);

        graph.selectAll(".text-legend")
                .data(line_data)
                .enter()
                .append("text")
                .attr("x", function(d) {
                    return x(d.x);
                })
                .attr("y", function(d, i) {
                    return y(d.y) + i + 10;
                })
                .text(function(d) {
                    return d.y;
                })

    });
}

function generateCrossFilterChart(options) {


    
        flights = d3.csv.parse(options.data);
        flights.forEach(function(value,index) {          
          var time = new Date().getTime(flights[index].date);
          var date = new Date(time);
          var newd = date.toString();

          flights[index].delay = parseInt(flights[index].delay);
          flights[index].distance = parseInt(flights[index].distance);
        });

        // Various formatters.
        var formatNumber = d3.format(",d"),
                formatChange = d3.format("+,d"),
                formatDate = d3.time.format("%B %d, %Y"),
                formatTime = d3.time.format("%I:%M %p");

        // A nest operator, for grouping the flight list.
        var nestByDate = d3.nest()
                .key(function(d) {
                    return d3.time.day(d.date);
                });

        // A little coercion, since the CSV is untyped.
        flights.forEach(function(d, i) {
            d.index = i;
            d.date = parseDate(d.date);
            d.delay = +d.delay;
            d.distance = +d.distance;
        });

        // Create the crossfilter for the relevant dimensions and groups.
        var flight = crossfilter(flights),
                all = flight.groupAll(),
                date = flight.dimension(function(d) {
                    return d.date;
                }),
                dates = date.group(d3.time.day),
                hour = flight.dimension(function(d) {
                    return d.date.getHours() + d.date.getMinutes() / 60;
                }),
                hours = hour.group(Math.floor),
                delay = flight.dimension(function(d) {
                    return Math.max(-60, Math.min(149, d.delay));
                }),
                delays = delay.group(function(d) {
                    return Math.floor(d / 10) * 10;
                }),
                distance = flight.dimension(function(d) {
                    return Math.min(1999, d.distance);
                }),
                distances = distance.group(function(d) {
                    return Math.floor(d / 50) * 50;
                });

        var charts = [
            barChart()
                    .dimension(hour)
                    .group(hours)
                    .x(d3.scale.linear()
                            .domain([0, 24])
                            .rangeRound([0, 10 * 24])),
            barChart()
                    .dimension(delay)
                    .group(delays)
                    .x(d3.scale.linear()
                            .domain([-60, 150])
                            .rangeRound([0, 10 * 21])),
            barChart()
                    .dimension(distance)
                    .group(distances)
                    .x(d3.scale.linear()
                            .domain([0, 2000])
                            .rangeRound([0, 10 * 40])),
            barChart()
                    .dimension(date)
                    .group(dates)
                    .round(d3.time.day.round)
                    .x(d3.time.scale()
                            .domain([new Date(2001, 0, 1), new Date(2001, 3, 1)])
                            .rangeRound([0, 10 * 90]))
                    .filter([new Date(2001, 1, 1), new Date(2001, 2, 1)])

        ];

        // Given our array of charts, which we assume are in the same order as the
        // .chart elements in the DOM, bind the charts to the DOM and render them.
        // We also listen to the chart's brush events to update the display.
        var chart = d3.selectAll("#test-chart .cross-filter-chart")
                .data(charts)
                .each(function(chart) {
                    chart.on("brush", renderAll).on("brushend", renderAll);
                });

        // Render the initial lists.
        var list = d3.selectAll(".list")
                .data([flightList]);

        // Render the total.
        d3.selectAll("#total")
                .text(formatNumber(flight.size()));

        renderAll();

        // Renders the specified chart or list.
        function render(method) {
            d3.select(this).call(method);
        }

        // Whenever the brush moves, re-rendering everything.
        function renderAll() {
            chart.each(render);
            list.each(render);
            d3.select("#active").text(formatNumber(all.value()));
        }

        // Like d3.time.format, but faster.
        function parseDate(d) {
            return new Date(2001,
                    d.substring(0, 2) - 1,
                    d.substring(2, 4),
                    d.substring(4, 6),
                    d.substring(6, 8));
        }

        window.filter = function(filters) {
            filters.forEach(function(d, i) {
                charts[i].filter(d);
            });
            renderAll();
        };

        window.reset = function(i) {
            charts[i].filter(null);
            renderAll();
        };

        function flightList(div) {
            var flightsByDate = nestByDate.entries(date.top(40));

            div.each(function() {
                var date = d3.select(this).selectAll(".date")
                        .data(flightsByDate, function(d) {
                            return d.key;
                        });

                date.enter().append("div")
                        .attr("class", "date")
                        .append("div")
                        .attr("class", "day")
                        .text(function(d) {
                            return formatDate(d.values[0].date);
                        });

                date.exit().remove();

                var flight = date.order().selectAll(".flight")
                        .data(function(d) {
                            return d.values;
                        }, function(d) {
                            return d.index;
                        });

                var flightEnter = flight.enter().append("div")
                        .attr("class", "flight");

                flightEnter.append("div")
                        .attr("class", "time")
                        .text(function(d) {
                            return formatTime(d.date);
                        });

                flightEnter.append("div")
                        .attr("class", "origin")
                        .text(function(d) {
                            return d.origin;
                        });

                flightEnter.append("div")
                        .attr("class", "destination")
                        .text(function(d) {
                            return d.destination;
                        });

                flightEnter.append("div")
                        .attr("class", "distance")
                        .text(function(d) {
                            return formatNumber(d.distance) + " mi.";
                        });

                flightEnter.append("div")
                        .attr("class", "delay")
                        .classed("early", function(d) {
                            return d.delay < 0;
                        })
                        .text(function(d) {
                            return formatChange(d.delay) + " min.";
                        });

                flight.exit().remove();

                flight.order();
            });
        }

        function barChart() {
            if (!barChart.id)
                barChart.id = 0;

            var margin = {top: 10, right: 10, bottom: 20, left: 10},
            x,
                    y = d3.scale.linear().range([100, 0]),
                    id = barChart.id++,
                    axis = d3.svg.axis().orient("bottom"),
                    brush = d3.svg.brush(),
                    brushDirty,
                    dimension,
                    group,
                    round;

            function chart(div) {
                var width = x.range()[1],
                        height = y.range()[0];

                y.domain([0, group.top(1)[0].value]);

                div.each(function() {
                    var div = d3.select(this),
                            g = div.select("g");

                    // Create the skeletal chart.
                    if (g.empty()) {
                        div.select(".title").append("a")
                                .attr("href", "javascript:reset(" + id + ")")
                                .attr("class", "reset")
                                .text("reset")
                                .style("display", "none");

                        g = div.append("svg")
                                .attr("width", width + margin.left + margin.right)
                                .attr("height", height + margin.top + margin.bottom)
                                .append("g")
                                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

                        g.append("clipPath")
                                .attr("id", "clip-" + id)
                                .append("rect")
                                .attr("width", width)
                                .attr("height", height);

                        g.selectAll(".bar")
                                .data(["background", "foreground"])
                                .enter().append("path")
                                .attr("class", function(d) {
                                    return d + " bar";
                                })
                                .datum(group.all());

                        g.selectAll(".foreground.bar")
                                .attr("clip-path", "url(#clip-" + id + ")");

                        g.append("g")
                                .attr("class", "axis")
                                .attr("transform", "translate(0," + height + ")")
                                .call(axis);

                        // Initialize the brush component with pretty resize handles.
                        var gBrush = g.append("g").attr("class", "brush").call(brush);
                        gBrush.selectAll("rect").attr("height", height);
                        gBrush.selectAll(".resize").append("path").attr("d", resizePath);
                    }

                    // Only redraw the brush if set externally.
                    if (brushDirty) {
                        brushDirty = false;
                        g.selectAll(".brush").call(brush);
                        div.select(".title a").style("display", brush.empty() ? "none" : null);
                        if (brush.empty()) {
                            g.selectAll("#clip-" + id + " rect")
                                    .attr("x", 0)
                                    .attr("width", width);
                        } else {
                            var extent = brush.extent();
                            g.selectAll("#clip-" + id + " rect")
                                    .attr("x", x(extent[0]))
                                    .attr("width", x(extent[1]) - x(extent[0]));
                        }
                    }

                    g.selectAll(".bar").attr("d", barPath);
                });

                function barPath(groups) {
                    var path = [],
                            i = -1,
                            n = groups.length,
                            d;
                    while (++i < n) {
                        d = groups[i];
                        path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
                    }
                    return path.join("");
                }

                function resizePath(d) {
                    var e = +(d == "e"),
                            x = e ? 1 : -1,
                            y = height / 3;
                    return "M" + (.5 * x) + "," + y
                            + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
                            + "V" + (2 * y - 6)
                            + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
                            + "Z"
                            + "M" + (2.5 * x) + "," + (y + 8)
                            + "V" + (2 * y - 8)
                            + "M" + (4.5 * x) + "," + (y + 8)
                            + "V" + (2 * y - 8);
                }
            }

            brush.on("brushstart.chart", function() {
                var div = d3.select(this.parentNode.parentNode.parentNode);
                div.select(".title a").style("display", null);
            });

            brush.on("brush.chart", function() {
                var g = d3.select(this.parentNode),
                        extent = brush.extent();
                if (round)
                    g.select(".brush")
                            .call(brush.extent(extent = extent.map(round)))
                            .selectAll(".resize")
                            .style("display", null);
                g.select("#clip-" + id + " rect")
                        .attr("x", x(extent[0]))
                        .attr("width", x(extent[1]) - x(extent[0]));
                dimension.filterRange(extent);
            });

            brush.on("brushend.chart", function() {
                if (brush.empty()) {
                    var div = d3.select(this.parentNode.parentNode.parentNode);
                    div.select(".title a").style("display", "none");
                    div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
                    dimension.filterAll();
                }
            });

            chart.margin = function(_) {
                if (!arguments.length)
                    return margin;
                margin = _;
                return chart;
            };

            chart.x = function(_) {
                if (!arguments.length)
                    return x;
                x = _;
                axis.scale(x);
                brush.x(x);
                return chart;
            };

            chart.y = function(_) {
                if (!arguments.length)
                    return y;
                y = _;
                return chart;
            };

            chart.dimension = function(_) {
                if (!arguments.length)
                    return dimension;
                dimension = _;
                return chart;
            };

            chart.filter = function(_) {
                if (_) {
                    brush.extent(_);
                    dimension.filterRange(_);
                } else {
                    brush.clear();
                    dimension.filterAll();
                }
                brushDirty = true;
                return chart;
            };

            chart.group = function(_) {
                if (!arguments.length)
                    return group;
                group = _;
                return chart;
            };

            chart.round = function(_) {
                if (!arguments.length)
                    return round;
                round = _;
                return chart;
            };

            return d3.rebind(chart, brush, "on");
        }
    


}