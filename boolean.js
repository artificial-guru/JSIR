function BooleanModel(c) {
    var caller = c;

    function sortByLengthDesc(a, b) {
        var alen = a.length;
        var blen = b.length;
        if (alen > blen) {
            return -1;
        } else if (alen < blen) {
            return 1;
        } else {
            return 0;
        }
    }

    function filter(arr, cond) {
        var nArr = new Array();
        for (var i = 0; i < arr.length; i++) {
            var elem = arr[i];
            if (eval(cond)) {
                nArr.push(arr[i]);
            }
        }
        return nArr;
    }

    function allTuples(dim) {
        var tuples = new Array();
        for (var i = 0; i < Math.pow(2, dim); i++) {
            var tuple = new Array(dim);
            for (var j = 0; j < dim; j++) {
                var mask = Math.pow(2, (dim - j - 1));
                tuple[j] = (i & mask) ? 1 : 0;
            }
            tuples.push(tuple);
        }
        return tuples;
    }

    function transformQuery(q) {
        var nq = q.toLowerCase();
        var tq = nq.replace(/[^a-zוהציטü\- ]/g, " ");
        tq = tq.replace(/\s+/g, " ");
        tq = tq.replace(/^\s+|\s+$/g, "");
        var terms = tq.split(" ");
        var vocab = new Array();
        var vsize = 0;
        for (var i = 0; i < terms.length; i++) {
            var term = terms[i];
            if (term != "and" && term != "or" && term != "not") {
                if (!(term in vocab)) {
                    vocab[term] = vsize;
                    vsize++;
                }
            }
        }
        var sortedVocab = new Array();
        for (term in vocab) sortedVocab.push(term);
        sortedVocab.sort(sortByLengthDesc);
        for (var i = 0; i < sortedVocab.length; i++) {
            var term = sortedVocab[i];
            var re = new RegExp(term, "g");
            nq = nq.replace(re, "(elem[" + vocab[term] + "] == 1)");
        }
        nq = nq.replace(/ or /g, " || ");
        nq = nq.replace(/ and /g, " && ");
        nq = nq.replace(/ not /g, " !");
        return [vsize, vocab, nq];
    }

    function inArray(arr, item) {
        var found = false;
        for (var i = 0; i < arr.length; i++) {
            found = true;
            for (var j = 0; j < arr[i].length; j++) {
                if (arr[i][j] != item[j]) {
                    found = false;
                    break;
                }
            }
            if (found) break;
        }
        return found;
    }

    this.doSearch = function(q) {
        var tq = transformQuery(q);
        var dim = tq[0];
        var vocab = tq[1];
        var nq = tq[2];
        var validTuples = filter(allTuples(dim), nq);
        var result = new Array();
        var rsv = new Array();
        for (id in docText) {
            var doctuple = new Array(dim);
            var relevant = false;
            for (term in vocab) {
                doctuple[vocab[term]] = (term in indexBinary) ? ((id in indexBinary[term]) ? 1 : 0) : 0;
            }
            if (inArray(validTuples, doctuple)) {
                result.push(id);
                rsv[id] = 1.0;
            }
        }
        caller.eventHandler.fire("result", [result, rsv])
        caller.eventHandler.fire("terms", vocab)
    }
}
