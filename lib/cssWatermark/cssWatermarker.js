/**
 * Created by XoX on 16/03/2016.
 */
'use strict';

const CssParserModule = require('./cssParser.js');
const CssParser = CssParserModule.CssParser;
const Rule = CssParserModule.Rule;
const Declaration = CssParserModule.Declaration;
const Mathjs = require('mathjs');
//noinspection JSUnresolvedVariable
const bignumber = Mathjs.bignumber;

//TODO Add Documentation

const CssWatermarker = function () {

};

CssWatermarker.prototype.embedWatermark = function (css, watermark, compress) {


    /* Processing the required embedding size */
    watermark = bignumber(watermark);
    const size = Mathjs.ceil(Mathjs.log(Mathjs.add(watermark, bignumber(1)), bignumber(2)));
    /* Parsing, Merging and Sorting Rules and Declarations*/
    const cssParser = new CssParser();
    let cssObject = cssParser.process(css);


    /* n is the embedding capacity */
    const n = this._embeddingCapacity(cssObject);
    if (!n.isFinite()) {
        throw (new Error('Css File is too big.'));
    }
    /* Increase the embedding capacity until it is above the required size*/

    if (n.lessThan(size)) {
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
    if (compress === undefined || compress === null) {
        compress = true;
    }
    return cssParser.stringify(cssObject, { compress: compress });
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
    let n = Mathjs.factorial(bignumber(rules.length));

    for (let i = 0; i < rules.length; ++i) {
        n = Mathjs.multiply(n, Mathjs.factorial(bignumber(rules[i].declarations.length)));
    }

    return Mathjs.floor(Mathjs.log(n, bignumber(2)));
};

CssWatermarker.prototype._generateRandomRule = function (RANDOMRULES, prefix) {

    const index = Mathjs.randomInt(0, RANDOMRULES.length - 1);
    const rule = new Rule('rule', [RANDOMRULES[index] + prefix], []);

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

    while (n.lessThan(size)) {
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
        np.push(Mathjs.factorial(bignumber(rules[i].declarations.length)));
    }
    np.push(Mathjs.factorial(bignumber(rules.length)));
    /* Processing lexicographic orders */
    let d = bignumber(0);
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

    let result = bignumber(1);
    for (let i = index + 1; i < values.length; ++i) {
        result = Mathjs.multiply(result, values[i]);
    }

    return result;
};

CssWatermarker.prototype._applyLexicographicPermutation = function (initialPermutation, order) {

    const permutation = [];
    initialPermutation = initialPermutation.slice();
    let f = bignumber(0);
    let q = bignumber(0);

    while (initialPermutation.length !== 0) {
        f = Mathjs.factorial(bignumber(initialPermutation.length - 1));
        q = Mathjs.floor(Mathjs.divide(order, f));
        order = Mathjs.mod(order, f);
        permutation.push(initialPermutation[q.toString()]);
        initialPermutation.splice(q.toString(), 1);
    }

    return permutation;
};

CssWatermarker.prototype._getLexicographicOrder = function (permutation) {

    const initialPermutation = permutation.slice();

    initialPermutation.sort((a, b) => {

        return a.compare(b);
    });
    let order = bignumber(0);
    let k = 0;
    let f = bignumber(0);
    let index = 0;

    while (initialPermutation.length !== 0) {
        f = Mathjs.factorial(bignumber(initialPermutation.length - 1));
        index = initialPermutation.indexOf(permutation[k]);

        order = Mathjs.add(order, Mathjs.multiply(bignumber(index), bignumber(f)));
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
        np[i] = Mathjs.factorial(bignumber(sortedRules[i].declarations.length));
    }
    np.push(Mathjs.factorial(bignumber(sortedRules.length)));

    let watermark = bignumber(0);
    let index = 0;
    for (let i = 0; i < I.length - 1; ++i) {
        index = sortedRules.indexOf(rules[i]);
        watermark = Mathjs.add(watermark, Mathjs.multiply(I[i], this._productTable(np, index)));
    }
    watermark = Mathjs.add(watermark, I[I.length - 1]);

    return watermark.toHexadecimal();
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
