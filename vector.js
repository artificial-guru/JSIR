function VectorSpaceModel(c) {
    var caller = c;
    var docRSV = null;

    function vDotProduct(u, v) {
        var sum = 0.0;
        for (var i = 0; i < Math.min(u.length, v.length); i++) {
            sum += u[i] * v[i];
        }
        return sum;
    }

    function vNorm(u) {
        return Math.sqrt(vDotProduct(u, u));
    }

    function vCosine(u, v) {
        var normalization = vNorm(u) * vNorm(v);
        //normalization = 1;
        return (normalization > 0) ? vDotProduct(u, v) / normalization : -1;
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

    function sortByCosine(a, b) {
        var cosA = docRSV[a];
        var cosB = docRSV[b];

        if (cosA > cosB) {
            return -1;
        }
        else if (cosA < cosB) {
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
                docVector[queryTerms[term]] = (term in indexTfidf) ? ((id in indexTfidf[term]) ? indexTfidf[term][id] : 0) : 0;
            }
            var rsv = vCosine(docVector, queryVector);
            if (rsv > 0) {
                docRSV[id] = rsv;
                docs.push(id);
            }
        }
        caller.eventHandler.fire("result", [docs.sort(sortByCosine), docRSV]);
        caller.eventHandler.fire("terms", queryTerms);
    }
}
