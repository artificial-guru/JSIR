function indexOfSmallestSupremum(arr, target) {
    var lpos = 0;
    var upos = arr.length - 1;
    if (arr[upos] < target) return -1;

    var pos = ((lpos + upos) % 2 == 0) ? (lpos + upos) / 2 : (lpos + upos - 1) / 2;
    while ((pos > 0) && !(arr[pos] >= target && arr[pos - 1] < target)) {
        if (arr[pos] < target) {
            lpos = pos + 1;
        }
        else if (arr[pos - 1] >= target) {
            upos = pos - 1;
        }
        pos = ((lpos + upos) % 2 == 0) ? (lpos + upos) / 2 : (lpos + upos - 1) / 2;
    }
    return pos;
}

function totalNumberOfRelevant(qid) {
    var R = 0;
    var relevant = topics[qid]["relevant"];
    for (id in relevant) {
        if (relevant.hasOwnProperty(id)) R++;
    }
    return R;
}

function numberOfRelevant(qid, result, dcv) {
    var r = 0;
    var relevant = topics[qid]["relevant"];
    for (var i = 0; i < Math.min(dcv, result.length); i++) {
        var docid = String(parseInt(result[i], 10));
        if (docid in relevant) r++;
    }
    return r;
}

function recall(qid, result, dcv) {
    var r = numberOfRelevant(qid, result, dcv);
    var R = totalNumberOfRelevant(qid);
    return r * 1.0 / R;
}

function averagePrecision(qid, result, dcv) {
    var relevant = topics[qid]["relevant"];
    var sum = 0.0;
    var accrel = 0;
    for (var i = 0; i < Math.min(result.length, dcv); i++) {
        var docid = String(parseInt(result[i], 10));
        if (docid in relevant) {
            accrel++;
            sum += accrel * 1.0 / (i + 1);
        }
    }
    return (sum / totalNumberOfRelevant(qid));
}

function precision(qid, result, dcv) {
    var r = numberOfRelevant(qid, result, dcv);
    return r * 1.0 / dcv;
}

function precisionVector(qid, result, dcv) {
    var r = numberOfRelevant(qid, result, dcv);
    var R = totalNumberOfRelevant(qid);
    var relevant = topics[qid]["relevant"];
    var parr = new Array(r);
    var rarr = new Array(r);
    var acc = 0;
    for (var i = 0; i < result.length; i++) {
        var docid = String(parseInt(result[i], 10));
        if (docid in relevant) {
            parr[acc] = (acc + 1) * 1.0 / (i + 1);
            rarr[acc] = (acc + 1) * 1.0 / R;
            acc++;
        }
    }
    return [parr, rarr];
}

function interpolatedPrecisionVector(qid, result, dcv) {
    var vectors = precisionVector(qid, result, dcv);
    var parr = vectors[0];
    var rarr = vectors[1];
    var iparr = new Array();
    var pos = 0;
    for (i = 0; i <= 10 && pos >= 0; i++) {
        var rlevel = i / 10.0;
        pos = indexOfSmallestSupremum(rarr, rlevel);
        if (pos >= 0) {
            var pvalue = (pos == parr.length - 1) ? parr[parr.length - 1] : Math.max.apply(null, parr.slice(pos, parr.length - 1));
            iparr.push(pvalue);
        }
    }
    return iparr;
}
