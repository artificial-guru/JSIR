function CustomEvent() {
    var listeners = new Array();

    this.addEventListener = function(evt, method) {
        if (listeners[evt] instanceof Array) {
            listeners[evt].push(method);
        }
        else {
            listeners[evt] = [method];
        }
    };

    this.fire = function(evt, args) {
        if (listeners[evt] instanceof Array) {
            for (var i = 0; i < listeners[evt].length; i++) {
                listeners[evt][i].call(this, args);
            }
        }
    };
}
