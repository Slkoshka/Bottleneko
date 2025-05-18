export function asString(value) {
    if (value === null) {
        return 'null';
    }
    else if (value === 'undefined') {
        return 'undefined';
    }
    else if (typeof value === 'string') {
        return value;
    }
    else {
        return value.toString();
    }
}
;
