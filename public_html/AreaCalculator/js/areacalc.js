/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

$(document).ready(function () {
	// listener for coordinate type change
	$("#coordType").change(coordTypeHandler);
        
        // listener for line type change
        $("#lineType").change(lineTypeHandler);

	// listener for add line
	$("#addLine").click(addLineHandler);

	// listener to remove last line
	$("#removeLast").click(removeLastHandler);

	// listener for calculate area
	$("#calcArea").click(calcAreaHandler);

});

function coordTypeHandler() {
	var cType = $(this).val();
	var c1Label = "";
	var c2Label = "";
	switch (cType) {
		case "cr":
			c1Label = "Delta X:";
			c2Label = "Delta Y:";
			break;
		case "ca":
			c1Label = "To X:";
			c2Label = "To Y:";
			break;
		default:
			c1Label = "Length:";
			c2Label = "Angle:";
			break;
	}
	if (cType === "am") {
		$("#c2").attr("type", "text");
	} else {
		$("#c2").attr("type", "number");
	}
	$("#c1Label").text(c1Label);
	$("#c2Label").text(c2Label);
}

function addLineHandler(e) {
	e.preventDefault();
	// read in path
	var d = $("#path > path").attr("d");
	// get coordType
	var cType = $("#coordType").val();
	if (cType === "ca") { // cartesian absolute
		var x = $("#c1").val().trim();
		var y = $("#c2").val().trim() * -1;
		if ($("#lineType").val() === "arc") { // add arc
			var radius = $("#radius").val();
			var rot = 0;
			if ($("#reverseArc").prop("checked")) { // reverse arc
				rot = 1;
			}
			d = d + "A " + radius + " " + radius + " 0 0 " + rot + " " + x + " " + y + " ";
		} else {
			d = d + "L " + x + " " + y + " ";
		}
	} else { // all others reduce to cartesian relative
		var coords = {"x": 0.0, "y": 0.0};
		if (cType === "cr") { // cartesian relative
			coords.x = $("#c1").val().trim();
			coords.y = $("#c2").val().trim();
		} else { // angle types
			var length = $("#c1").val().trim();
			var angle = $("#c2").val().trim();
			if (cType === "am") {
				// convert deg min sec to decimal
				angle = angle.replace(/\s{2,}/g, ' ');
				var degArray = angle.split(' ');
				var degrees = parseInt(degArray[0]);
				var minutes = parseInt(degArray[1]) / 60 || 0;
				var seconds = parseInt(degArray[2]) / 3600 || 0;
				angle = degrees + minutes + seconds;
			}
			if (cType === "am" || cType === "ad") { // both azimuth types
				coords = azimuth2cart(length, angle);
			} else { // both polar types are left
				var isDeg = false;
				if (cType === "pd") {
					isDeg = true;
				}
				coords = polar2cart(length, angle, isDeg);
			}
		}
		// append to d for non absolute types
		if ($("#lineType").val() === "arc") { // add arc
			var radius = $("#radius").val();
			var rot = 0;
			if ($("#reverseArc").prop("checked")) { // reverse arc
				rot = 1;
			}
			d = d + "a " + radius + " " + radius + " 0 0 " + rot + " " + coords.x + " " + (coords.y * -1) + " ";
		} else { // straight line
			d = d + "l " + coords.x + " " + (coords.y * -1) + " ";
		}
	}
	// append to path
	$("#path > path").attr("d", d);
        // resize drawing
        calcViewBox();
	// focus in length
	$("#c1").focus().select();
}

/**
 * polar2cart
 *
 * convert polar coordinates to cartersian given length and angle in degress
 * or radians
 *
 * @param {Number} length
 * @param {Number} angle
 * @param {Boolean} isDeg
 * @returns {polar2cart.coord}
 */
function polar2cart(length, angle, isDeg) {
	if (isDeg) {
		angle = angle * Math.PI / 180;
	}
	var coord = {
		"x": length * Math.cos(angle),
		"y": length * Math.sin(angle)
	};
	return coord;
}

/**
 * azimuth2cart
 *
 * converts azimuth coordinates to cartesian and returns object
 *
 * @param {Number} length
 * @param {Number} angle
 * @returns {polar2cart.coord}
 */
function azimuth2cart(length, angle) {
	// 0 deg is up
	var rad = azimuth2polar(angle);
	var coord = {
		"x": length * Math.cos(rad),
		"y": length * Math.sin(rad)
	};
	return coord;
}

/**
 * azimuth2polar
 *
 * convert azimuth in degress to polar in radians
 *
 * @param {Number} angle
 * @returns {Number}
 */
function azimuth2polar(angle) {
	var polarDeg = angle * -1 + 90;
	if (polarDeg < 0) {
		polarDeg = polarDeg + 360;
	}
	var polarRad = polarDeg * Math.PI / 180;
	return polarRad;
}

function calcAreaHandler(e) {
	e.preventDefault();
	var path = $("#path > path")[0];
	var totLength = path.getTotalLength();
	var points = 10000;
	var pointsArray = [];
	var step = totLength / points;
	var length = 0;
	// build x,y points
	for (i = 0; i <= points; i++) {
		var p = path.getPointAtLength(length);
		pointsArray.push(p);
		length = length + step;
	}
	// calculate area
	var area = 0.0;
	for (i = 0; i < points; i++) {
		area = area + pointsArray[i].x * pointsArray[i + 1].y - pointsArray[i].y * pointsArray[i + 1].x;
	}
	area = Math.abs(area / 2);
	if (area < 10) {
		area = Math.round(area * 1000) / 1000;
	} else if (area < 100) {
		area = Math.round(area * 100) / 100;
	} else if (area < 1000) {
		area = Math.round(area * 10) / 10;
	} else {
		area = Math.round(area);
	}
	alert(area);
}

function calcViewBox() {
	var path = $("#path > path")[0];
	var totLength = path.getTotalLength();
	var points = 1000;
	var step = totLength / points;
	var length = 0;
        var minX = 0;
        var maxX = 0;
        var minY = 0;
        var maxY = 0;
	// find min/max values
	for (i = 0; i <= points; i++) {
		var p = path.getPointAtLength(length);
                if (p.x > maxX) {
                    maxX = p.x;
                } else if (p.x < minX) {
                    minX = p.x;
                }
                if (p.y > maxY) {
                    maxY = p.y;
                } else if (p.y < minY) {
                    minY = p.y;
                }
		length = length + step;
	}
        // calculate viewbox values
        var vbWidth = maxX - minX;
        if (vbWidth < 1) {vbWidth = 1;}
        var vbHeight = maxY - minY;
        if (vbHeight < 1) {vbHeight = 1;}
        var vbX = (minX + maxX) / 2;
        var vbY = (minY + maxY) / 2;
        var vbString = vbX.toString() + " " + vbY.toString() + " " + vbWidth.toString() + " " + vbHeight.toString();
        $("#path")[0].setAttribute("viewBox", vbString);
    }

function removeLastHandler(e) {
	e.preventDefault();
	var d = $("#path > path").attr("d");
	d = d.replace(/[lLaAzZ][ .\-0-9e]*$/, "");
	$("#path > path").attr("d", d);
}

function lineTypeHandler(e) {
    if ($(this).val() === "line") {
        $("div.arc").hide();
    } else { // arc
        $("div.arc").show();
    }
}