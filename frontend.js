function Frontend() {
    var previousTopic = "";
    var selectedTopic = "";
    var editableElement = null;
    var diagramCurves = new Array();
    var dcvr = 200;
    var dcvp = 40;
    var model = "Vector Space Model";
    var evt = new CustomEvent();
    var elemX, elemY;
    var elemDragging = false;
    var numericResult = new Array();
    var diagramLineColors = ["blue", "#006400", "red"]
    var diagramDotColors = ["red", "cyan", "yellow"]
    var diagramNumber = 0;
    var queryTerms = [];
    evt.addEventListener("result", displayResult);
    evt.addEventListener("terms", setQueryTerms);

    function degreesToRadians(degrees) {
        return (degrees * Math.PI) / 180;
    }

    function sumTo(data, i) {
        var sum = 0.0;
        for (var j = 0; j < i; j++) {
            sum += data[j];
        }
        return sum;
    }

    function drawSegment(svg, data, i, centerX, centerY, radius, empty) {
        if (data[i] == 0.0) return;
        var colors = ["#33AAFF", "#CC3300"];
        var gradient = ["#pie1", "#pie2"];
        
        if (data[i] < 1.0) {
            var startingAngle = degreesToRadians(sumTo(data, i) * 360 + 30);
            var arcSizeDeg = (data[i] * 360);
            var arcSize = degreesToRadians(arcSizeDeg);
            var endingAngle = startingAngle + arcSize;
            var path = "M" + centerX + "," + centerY;
            path += " L" + (centerX + radius * Math.cos(startingAngle));
            path += "," + (centerY + radius * Math.sin(startingAngle));
            path += " A" + radius + "," + radius + " 0 ";
            path += (arcSizeDeg >= 180) ? "1" : "0";
            path += ",1";
            path += " " + (centerX + radius * Math.cos(endingAngle));
            path += "," + (centerY + radius * Math.sin(endingAngle));
            path += " z";
            var elem = document.createElementNS("http://www.w3.org/2000/svg", "path");
            elem.setAttribute("d", path);
            elem.setAttribute("fill", "url(" + gradient[i] + ")");
            elem.setAttribute("stroke", "black");
            elem.setAttribute("stroke-width", "0.0");
            svg.appendChild(elem);
        } else {
            var elem = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            elem.setAttribute("cx", centerX);
            elem.setAttribute("cy", centerY);
            elem.setAttribute("r", radius);
            elem.setAttribute("stroke", "black");
            elem.setAttribute("stroke-width", "0.0");
            elem.setAttribute("fill", "url(" + gradient[i] + ")");
            elem.setAttribute("filter", "url(#i1)");
            svg.appendChild(elem);            
        }
    }

    function drawRecallDiagram(r, empty) {
        var diagramData = [r, 1.0 - r];
        var svg = document.getElementById("recalldiagram");
        var gradients = new Array();
        var defs = svg.getElementsByTagName("defs")[0];
        while (svg.childNodes.length > 0) {
            svg.removeChild(svg.childNodes[0]);
        }
        svg.appendChild(defs);

        var centerX = Math.floor(svg.getAttribute("width") / 2);
        var centerY = Math.floor(svg.getAttribute("height") / 2);
        var radius = Math.min(centerX, centerY) - 10;
        for (var i = 0; i < diagramData.length; i++) {
            drawSegment(svg, diagramData, i, centerX, centerY, radius, empty);
        }
    }

    function drawPrecisionDiagram(pr) {
        var svg = document.getElementById("precisiondiagram");
        var zeroPointX = 23;
        var zeroPointY = 190;
        var dx = 22;
        var dy = 180;
        var points = "";
        for (var i = 0; i < pr.length; i++) {
            if (points.length > 0) points += " ";
            points += ((i + 1) * dx + 1) + "," + (zeroPointY - pr[i] * dy);
        }
        var lineColor = diagramLineColors[diagramNumber % 3];
        var dotColor = diagramDotColors[diagramNumber % 3];
        var group = document.createElementNS("http://www.w3.org/2000/svg", "g");
        var elem = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        elem.setAttribute("points", points);
        elem.setAttribute("fill", "none");
        elem.setAttribute("stroke", lineColor);
        elem.setAttribute("stroke-width", "2.0");
        group.appendChild(elem);
        for (var i = 0; i < pr.length; i++) {
            elem = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            elem.setAttribute("cx", (i + 1) * dx + 1);
            elem.setAttribute("cy", (zeroPointY - pr[i] * dy));
            elem.setAttribute("r", "3");
            elem.setAttribute("fill", dotColor);
            elem.setAttribute("stroke", "black");
            elem.setAttribute("stroke-width", "0.8");
            group.appendChild(elem);
        }
        diagramCurve = group;
        if (diagramCurves.length == 3) {
            svg.removeChild(diagramCurves[0]);
            svg.appendChild(group);
            diagramCurves.splice(0, 1);
        }
        diagramCurves.push(group);
        svg.appendChild(group);
        diagramNumber++;
    }
    
    function roundNumber(rnum, rlength) {
        var newnumber = Math.round(rnum * Math.pow(10,rlength)) / Math.pow(10, rlength);
        return newnumber.toFixed(rlength);
    }

    function isRelevant(id) {
        var queryId = selectedTopic;
        if (!queryId) return false;
        var nid = String(parseInt(id, 10));
        return (nid in topics[queryId]["relevant"]);
    }

    function displayResult(result) {
        var row = null;
        var docs = result[0];
        var rsv = result[1];
        var resultTable = document.getElementById("resultTable");
        var relevanceTable = document.getElementById("relevance");
        
        if (previousTopic != selectedTopic) {
            clearPrecisionDiagram();
            previousTopic = selectedTopic;
        }
        // Clear the tables
        while (resultTable.rows.length > 0) {
            resultTable.deleteRow(resultTable.rows.length - 1);
        }
        for (var i = 0; i < 20; i++) {
            var row = resultTable.insertRow(resultTable.rows.length);
            row.insertCell(0);
            row.insertCell(1);
            row.insertCell(2);
            row.insertCell(3);
            for (var j = 0; j < row.cells.length; j++) {
                row.cells[j].innerHTML = "&nbsp;";
            }
        }
        for (var i = 0; i < relevanceTable.rows[0].cells.length; i++) {
            relevanceTable.rows[0].cells[i].style.backgroundColor = "white";
        }
        numericResult = new Array();
        // Write search result to table
        for (var i = 0; i < Math.min(dcvr, docs.length); i++) {
            var id = docs[i];
            if (i >= resultTable.rows.length) {
                row = resultTable.insertRow(resultTable.rows.length);
                row.insertCell(0);
                row.insertCell(1);
                row.insertCell(2);
                row.insertCell(3);
            }
            row = resultTable.rows[i];
            row.cells[0].innerHTML = (i + 1);
            row.cells[1].innerHTML = '<a href="#" onclick="frontend.showDocumentWindow(' + "'" + id + "'" + ')">' + docText[id]["title"] + '</a>';
            row.cells[1].style.cursor = "pointer";
            row.cells[2].innerHTML = roundNumber(rsv[id], 4);
            var relevant = isRelevant(id);
            row.cells[3].innerHTML = (relevant) ? "Yes" : "&nbsp;";
            if (i < 40) relevanceTable.rows[0].cells[i].style.backgroundColor = (relevant) ? "#33CCFF" : "white";
            numericResult.push([i + 1, (relevant)? 1 : 0, docText[id]["title"]]);
        }
        document.getElementById("numRetrieved").innerHTML = docs.length;
        if (selectedTopic != "") {
            var r = recall(selectedTopic, docs, dcvr);
            var p = precision(selectedTopic, docs, dcvp);
            var ap = averagePrecision(selectedTopic, docs, dcvp);
            var pr = interpolatedPrecisionVector(selectedTopic, docs, dcvr);
            drawRecallDiagram(r, false);
            drawPrecisionDiagram(pr);
            document.getElementById("recall").innerHTML = roundNumber(r * 100, 1) + "%&nbsp;&nbsp;(" + numberOfRelevant(selectedTopic, docs, dcvr) + " / " + totalNumberOfRelevant(selectedTopic) + ")";
            document.getElementById("precision").innerHTML = roundNumber(p * 100, 1) + "%";
            document.getElementById("avg_precision").innerHTML = roundNumber(ap * 100, 1) + "%";
            //document.getElementById("precision").innerHTML = roundNumber(p * 100, 1) + "%&nbsp;&nbsp;(" + numberOfRelevant(selectedTopic, docs, dcvp) + " / " + dcvp + ")";
        }
    }

    function setQueryTerms(terms) {
        queryTerms = [];
        for (term in terms) {
            queryTerms.push(term);
        }
    }

    function clearPrecisionDiagram() {
        var precisionDiagram = document.getElementById("precisiondiagram");
        while (diagramCurves.length > 0) {
            precisionDiagram.removeChild(diagramCurves[0]);
            diagramCurves.splice(0, 1);
        }
    }

    function loadTopics() {
        var tbl = document.getElementById("topics");
        for (var id in topics) {
            var row = tbl.insertRow(tbl.rows.length);
            row.setAttribute("id", id);
            row.setAttribute("onmouseover", "frontend.mouseOver(this)");
            row.setAttribute("onmouseout", "frontend.mouseOut(this)");
            row.setAttribute("onclick", "frontend.selectTopic(this.id)");
            var cellId = row.insertCell(0);
            var cellTopic = row.insertCell(1);
            cellId.innerHTML = id;
            cellTopic.innerHTML = topics[id]["topic"];
        }
    }

    this.mouseOver = function(elem) {
        if (elem.id != selectedTopic) elem.style.backgroundColor = '#F1F2F4'
    }

    this.mouseOut = function(elem) {
        if (elem.id != selectedTopic) elem.style.backgroundColor = '#FFFFFF'
    }

    this.dropdown = function(elem, evt) {
        evt.stopPropagation();
        if (editableElement != null) {
            if (elem == editableElement.parentNode) return;
            this.inactivateEditableElement();
        }
        var value = elem.innerHTML;
        var options = eval("(" + elem.getAttribute("data-options") + ")");
        var html = '<select class="property">';
        for (i = 0; i < options.length; i++) {
            if (value == options[i]) {
                html += "<option selected>" + options[i] + "</option>";
            }
            else {
                html += "<option>" + options[i] + "</option>";
            }
        }
        html += "</select>";
        elem.innerHTML = html;
        editableElement = elem.childNodes[0];
        editableElement.onblur = this.submitProperty;
        editableElement.onchange = this.submitProperty;
        editableElement.focus();
    }

    this.editableText = function(elem, event) {
        event.stopPropagation();
        if (editableElement != null) {
            if (elem == editableElement.parentNode) return;
            this.inactivateEditableElement();
        }
        var value = elem.innerHTML;
        elem.innerHTML = '<input type="text" class="editableText" value="' + value + '">';
        editableElement = elem.childNodes[0];
        editableElement.onkeydown = function(e) {if (e.which == 13) frontend.submitProperty()};
        editableElement.onblur = frontend.submitProperty;
        editableElement.focus();
        editableElement.select();
    }

    this.selectTopic = function(id) {
        selectedTopic = id;
        var tbl = document.getElementById("topics");
        var selectedRow = document.getElementById(id);
        for (var i = 0; i < tbl.rows.length; i++) {
            tbl.rows[i].style.backgroundColor = "#FFFFFF";
        }
        selectedRow.style.backgroundColor = "#EECC00";
        document.getElementById("activeTopic").innerHTML = selectedTopic;
        document.getElementById("txtQuery").value = "";
        document.getElementById("txtQuery").focus();
    }

    this.initialize = function() {
        loadTopics();
        document.getElementById("txtQuery").focus();
        document.getElementById("txtQuery").onkeydown = function(evt) {
            if (evt.ctrlKey && evt.keyCode == 13) frontend.search(document.getElementById("txtQuery").value);
        };
        window.onkeydown = function(evt) {if (evt.which == 27) frontend.closeDocumentWindow();};
    }

    this.clear = function(elem) {
        elem.value = "";
    }

    this.search = function(q) {
        var engine = null;
        if (model == "Vector Space Model") {
            engine = new VectorSpaceModel(this);
        }
        else if (model == "Boolean") {
            engine = new BooleanModel(this);
        }
        else if (model == "Okapi BM25") {
            engine = new OkapiBM25(this);
        }
        setTimeout(function() {engine.doSearch(q);}, 1);
    }

    this.getSelectedTopic = function() {
        return selectedTopic;
    }

    this.inactivateEditableElement = function() {
        if (editableElement != null) {
            var value = editableElement.value;
            var p = editableElement.parentNode;
            p.innerHTML = value;
        }
        editableElement = null;
    }

    this.submitProperty = function() {
        if (editableElement != null) {
            var p = editableElement.parentNode;
            var field = p.getAttribute("data-field");
            eval(field + " = " + ((isNaN(editableElement.value)) ? "'" + editableElement.value + "'" : editableElement.value));
            frontend.inactivateEditableElement();
        }
    }

    this.showDocumentWindow = function(id) {
        var p = document.getElementById("outerPanel");
        var docWindow = document.getElementById("documentWindow");
        var tt = docText[id]["title"];
        var dt = docText[id]["text"];
        for (var i = 0; i < queryTerms.length; i++) {
            tt = tt.replace(new RegExp("([^a-z]|^)(" + queryTerms[i] + ")([^a-z]|$)", "gi"), '$1<span class="highlight">$2</span>$3');
            dt = dt.replace(new RegExp("([^a-z]|^)(" + queryTerms[i] + ")([^a-z]|$)", "gi"), '$1<span class="highlight">$2</span>$3');
        }
        document.getElementById("documentTitle").innerHTML = tt;
        document.getElementById("documentText").innerHTML = dt;
        if (docWindow.style.display != "block") {
            docWindow.style.left = (p.offsetLeft + 15) + 'px';
            docWindow.style.top = (p.offsetTop + 15) + 'px';
            docWindow.style.display = "block";
        }
    }

    this.closeDocumentWindow = function() {
        var docWindow = document.getElementById("documentWindow");
        docWindow.style.display = "none";
    }

    this.showResultWindow = function() {
        var resultWindow = window.open("result.html", "width=800,height=800,location=no");
    }

    this.getNumericResult = function() {
        return numericResult;
    }

    this.startDragElement = function(evt, elem) {
        elemDragging = true;
        elem.style.cursor = "move"
        elem.style.left = elem.offsetLeft + 'px';
        elem.style.top = elem.offsetTop + 'px';
        elemX = evt.clientX;
        elemY = evt.clientY;
    }

    this.dragElement = function(evt, elem) {
        if (elemDragging) {
            var dx = evt.clientX - elemX;
            var dy = evt.clientY - elemY;
            elem.style.left = (elem.offsetLeft + dx) + 'px';
            elem.style.top = (elem.offsetTop + dy) + 'px';
            elemX += dx;
            elemY += dy;
        }
    }

    this.stopDragElement = function(evt, elem) {
        elem.style.cursor = "default"
        elemDragging = false;
    }

    this.eventHandler = evt;
}

var frontend = new Frontend();
window.onload = frontend.initialize;
