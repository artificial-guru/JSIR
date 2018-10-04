function OkapiBM25(c) {
    var caller = c;
    var docRSV = null;

    function bm25Score(id, dv, qv) {
        var k1 = 2.0;
        var b = 0.75;
        var score = 0.0;
        for (var i = 0; i < qv.length; i++) {
            score += qv[i] * (dv[i] * (k1 + 1)) / (dv[i] + k1 * (1 - b + b * docLength[id] / docLength["avg"]));
        }
        return score;
    }

    function dictValue(dictionary, key, defaultValue) {
        var returnValue;
        if (key in dictionary) {
            returnValue = dictionary[key];
        }
        else {
            returnValue = defaultValue;
        }
        return returnValue;
    }

    function normalizeQuery(q) {
        var nq = q.toLowerCase();
        nq = nq.replace(/[^a-zוהציטü\- ]/g, " ");
        nq = nq.replace(/\s+/g, " ");
        nq = nq.replace(/^\s+|\s+$/g, "");
        return nq;
    }

    function transformQuery(q) {
        var terms = q.split(" ");
        var vocab = new Array();
        var vsize = 0;
        for (var i = 0; i < terms.length; i++) {
            var term = terms[i];
            if (!(term in vocab)) {
                vocab[term] = vsize;
                vsize++;
            }
        }
        var queryVector = new Array(vsize);
        for (term in vocab) {
            queryVector[vocab[term]] = dictValue(termIdf, term, 0);
        }
        return [vocab, queryVector];
    }

    function sortByRSV(a, b) {
        var rsvA = docRSV[a];
        var rsvB = docRSV[b];

        if (rsvA > rsvB) {
            return -1;
        }
        else if (rsvA < rsvB) {
            return 1;
        }
        else {
            return 0;
        }
    }

    this.doSearch = function(q) {
        var nq = normalizeQuery(q);
        if (nq.length == 0) return;
        var tq = transformQuery(nq);
        var queryTerms = tq[0];
        var queryVector = tq[1];
        var docs = new Array();
        docRSV = new Array();
        for (id in docText) {
            var docVector = new Array();
            for (term in queryTerms) {
                docVector[queryTerms[term]] = (term in indexTf) ? ((id in indexTf[term]) ? indexTf[term][id] : 0) : 0;
            }
            var rsv = bm25Score(id, docVector, queryVector);
            if (rsv > 0) {
                docRSV[id] = rsv;
                docs.push(id);
            }
        }
        caller.eventHandler.fire("result", [docs.sort(sortByRSV), docRSV]);
        caller.eventHandler.fire("terms", queryTerms);
    }
}
