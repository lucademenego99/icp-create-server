/**
 * Replace all occurrences of search with replacement
 * @param {string} search String to replace
 * @param {string} replacement
 * @returns The new string with all the replacements
 */
 String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(search, 'g'), replacement);
}

/**
 * Replace a string between two indices
 * @param {number} start Index in which we want to start replacing
 * @param {number} end Index in which the replacement should end
 * @param {string} replacement
 * @returns The new string with the replacement
 */
String.prototype.replaceBetween = function(start, end, replacement) {
    return this.substring(0, start) + replacement + this.substring(end);
}