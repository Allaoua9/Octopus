/**
 * Created by XoX on 16/03/2016.
 */
'use strict';

const CssParserModule = require('./cssParser.js');
const CssParser = CssParserModule.CssParser;
const Rule = CssParserModule.Rule;
const Declaration = CssParserModule.Declaration;

const Mathjs = require('mathjs');

//TODO Add Documentation

const CssWatermarker = function () {

};

CssWatermarker.prototype.embedWatermark = function (css, watermark, options) {

    options = options || { compress: true };

    /* Processing the required embedding size */
    const size = Mathjs.ceil(Mathjs.log(watermark + 1, 2));
    /* Parsing, Merging and Sorting Rules and Declarations*/
    const cssParser = new CssParser();
    let cssObject = cssParser.process(css);


    /* n is the embedding capacity */
    const n = this._embeddingCapacity(cssObject);
    /* Increase the embedding capacity until it is above the required size*/

    if (n < size) {
        cssObject = this._increaseCapacity(cssObject, size);
    }


    /* Processing lexicographic orders */
    const I = this._processLexicographicOrders(cssObject, watermark);
    let declarations = [];
    for (let i = 0; i < I.length - 1; ++i) {
        declarations = cssObject.stylesheet.rules[i].declarations;
        declarations = this._applyLexicographicPermutation(declarations, I[i]);
        cssObject.stylesheet.rules[i].declarations = declarations;
    }
    cssObject.stylesheet.rules = this._applyLexicographicPermutation(cssObject.stylesheet.rules, I[I.length - 1]);

    /* The watermarked Css string*/
    return cssParser.stringify(cssObject, options);
};

CssWatermarker.prototype.extractWatermark = function (css) {

    const cssParser = new CssParser();
    const cssObject = cssParser.parse(css);

    /* Getting lexicographic orders from Css rules and declarations*/
    const I = [];
    const rules = cssObject.stylesheet.rules;
    for (let i = 0; i < rules.length; ++i) {
        I.push(this._getLexicographicOrder(rules[i].declarations));
    }
    I.push(this._getLexicographicOrder(rules));

    return this._processWatermark(cssObject, I);
};

CssWatermarker.prototype._embeddingCapacity = function (cssObject) {

    const rules = cssObject.stylesheet.rules;
    let n = Mathjs.factorial(rules.length);

    for (let i = 0; i < rules.length; ++i) {
        n = n * Mathjs.factorial(rules[i].declarations.length);
    }

    return Mathjs.floor(Mathjs.log(n, 2));
};

CssWatermarker.prototype._generateRandomRule = function (RANDOMRULES, prefix) {

    const index = Mathjs.randomInt(0, RANDOMRULES.length - 1);
    const rule = new Rule([RANDOMRULES[index] + prefix], []);

    rule.declarations = this._generateRandomDeclarations();
    return rule;
};

CssWatermarker.prototype._generateRandomDeclarations = function () {

    const RANDOMDECLARATIONS = require('./randomdeclarations.json');
    const m = Mathjs.randomInt(1, 10);
    let declaration = null;
    let index = 0;
    const declarations = [];

    for (let i = 0; i < m; ++i) {
        declaration = new Declaration('', '');
        index = Mathjs.randomInt(0, RANDOMDECLARATIONS.length);
        declaration.property = RANDOMDECLARATIONS[index].property;
        RANDOMDECLARATIONS.splice(index, 1);
        declarations.push(declaration);
    }
    return declarations;
};

CssWatermarker.prototype._increaseCapacity = function (cssObject, size) {

    const RANDOMRULES = require('./randomrules.json');
    let n = this._embeddingCapacity(cssObject);
    let randomRule = null;
    let i = 0;

    while (n < size) {
        i++;
        randomRule = this._generateRandomRule(RANDOMRULES, i);
        cssObject.stylesheet.rules.push(randomRule);
        n = this._embeddingCapacity(cssObject);
    }

    cssObject.sort();
    return cssObject;
};

CssWatermarker.prototype._processLexicographicOrders = function (cssObject, watermark) {

    const np = [];
    const rules = cssObject.stylesheet.rules;
    const I = [];

    for (let i = 0; i < rules.length; ++i) {
        np[i] = Mathjs.factorial(rules[i].declarations.length);
    }
    np.push(Mathjs.factorial(rules.length));
    /* Processing lexicographic orders */
    let d = 0;
    let k = watermark;
    for (let i = 0; i < np.length - 1; ++i) {
        d = this._productTable(np, i);
        I[i] = Mathjs.floor(Mathjs.divide(k, d));
        k = Mathjs.mod(k, d);
    }
    I.push(k);

    return I;
};

CssWatermarker.prototype._productTable = function (values, index) {

    let result = 1;
    for (let i = index + 1; i < values.length; ++i) {
        result = result * values[i];
    }

    return result;
};

CssWatermarker.prototype._applyLexicographicPermutation = function (initialPermutation, order) {

    const permutation = [];
    initialPermutation = initialPermutation.slice();
    let f = 0;
    let q = 0;

    while (initialPermutation.length !== 0) {
        f = Mathjs.factorial(initialPermutation.length - 1);
        q = Mathjs.floor(Mathjs.divide(order, f));
        order = Mathjs.mod(order, f);
        permutation.push(initialPermutation[q]);
        initialPermutation.splice(q, 1);
    }

    return permutation;
};

CssWatermarker.prototype._getLexicographicOrder = function (permutation) {

    const initialPermutation = permutation.slice();

    initialPermutation.sort((a, b) => {

        return a.compare(b);
    });
    let order = 0;
    let k = 0;
    let f = 0;
    let index = 0;

    while (initialPermutation.length !== 0) {
        f = Mathjs.factorial((initialPermutation.length - 1));
        index = initialPermutation.indexOf(permutation[k]);

        order = order + Mathjs.multiply(index, f);
        k = k + 1;
        initialPermutation.splice(index, 1);
    }

    return order;
};

CssWatermarker.prototype._processWatermark = function (cssObject, I) {

    const rules = cssObject.stylesheet.rules;
    const sortedRules = rules.slice();
    sortedRules.sort((a, b) => {

        return a.compare(b);
    });

    const np = [];
    for (let i = 0; i < sortedRules.length; ++i) {
        np[i] = Mathjs.factorial(sortedRules[i].declarations.length);
    }
    np.push(Mathjs.factorial(sortedRules.length));

    let watermark = 0;
    let index = 0;
    for (let i = 0; i < I.length - 1; ++i) {
        index = sortedRules.indexOf(rules[i]);
        watermark = watermark + Mathjs.multiply(I[i], this._productTable(np, index));
    }
    watermark = watermark + I[I.length - 1];

    return watermark;
};

module.exports = CssWatermarker;
/*exports.embedWatermark = embedWatermark;
exports.extractWatermark = extractWatermark;
/!* Private methods exported for testing purposes, should not be called outside the module*!/
exports._embedingCapacity = embeddingCapacity;
exports._increaseCapacity = increaseCapacity;
exports._productTable = _productTable;
exports._processLexicographicOrders = _processLexicographicOrders;
exports._applyLexicographicPermutation = _applyLexicographicPermutation;
exports._getLexicographicOrder = _getLexicographicOrder;*/
