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
