/**
 * Created by XoX on 16/03/2016.
 */
'use strict';

const Css = require('./css.js');
const Mathjs = require('mathjs');
const Fs = require('fs');

const embeddingCapacity = function (cssObject) {

    const rules = cssObject.stylesheet.rules;
    let n = Mathjs.factorial(rules.length);

    for (let i = 0; i < rules.length; ++i) {
        n = n * Mathjs.factorial(rules[i].declarations.length);
    }

    return Mathjs.floor(Mathjs.log(n, 2));
};


const generateRandomRule = function (RANDOMRULES, prefix) {

    const index = Mathjs.randomInt(0, RANDOMRULES.length - 1);
    const rule = new Css.Rule([RANDOMRULES[index] + prefix], []);

    rule.declarations = generateRandomDeclarations();
    return rule;
};

const generateRandomDeclarations = function () {

    const RANDOMDECLARATIONS = require('./randomdeclarations.json');
    const m = Mathjs.randomInt(1, 10);
    let declaration = null;
    let index = 0;
    const declarations = [];

    for (let i = 0; i < m; ++i) {
        declaration = new Css.Declaration('', '');
        index = Mathjs.randomInt(0, RANDOMDECLARATIONS.length);
        declaration.property = RANDOMDECLARATIONS[index].property;
        RANDOMDECLARATIONS.splice(index, 1);
        declarations.push(declaration);
    }
    return declarations;
};

const increaseCapacity = function (cssObject, size) {

    const RANDOMRULES = require('./randomrules.json');
    let n = embeddingCapacity(cssObject);
    let randomRule = null;
    let i = 0;

    while (n < size) {
        i++;
        randomRule = generateRandomRule(RANDOMRULES, i);
        cssObject.stylesheet.rules.push(randomRule);
        n = embeddingCapacity(cssObject);
    }

    cssObject.sort();
    return cssObject;
};


const _processLexicographicOrders = function (cssObject, watermark) {

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
        d = _productTable(np, i);
        I[i] = Mathjs.floor(Mathjs.divide(k, d));
        k = Mathjs.mod(k, d);
    }
    I.push(k);

    return I;
};

const _productTable = function (values, index) {

    let result = 1;
    for (let i = index + 1; i < values.length; ++i) {
        result = result * values[i];
    }

    return result;
};

const _applyLexicographicPermutation = function (initialPermutation, order) {

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


const embedWatermark = function (css, watermark, options) {

    options = options || { compress: true };

    /* Processing the required embedding size */
    const size = Mathjs.ceil(Mathjs.log(watermark + 1, 2));
    /* Parsing, Merging and Sorting Rules and Declarations*/
    let cssObject = Css.process(css);


    /* n is the embedding capacity */
    const n = embeddingCapacity(cssObject);
    /* Increase the embedding capacity until it is above the required size*/

    if (n < size) {
        cssObject = increaseCapacity(cssObject, size);
        Fs.writeFileSync('./beforeWatermark.json', JSON.stringify(cssObject.stylesheet.rules), 'utf-8');
    }


    /* Processing lexicographic orders */
    const I = _processLexicographicOrders(cssObject, watermark);
    let declarations = [];
    for (let i = 0; i < I.length - 1; ++i) {
        declarations = cssObject.stylesheet.rules[i].declarations;
        declarations = _applyLexicographicPermutation(declarations, I[i]);
        cssObject.stylesheet.rules[i].declarations = declarations;
    }
    cssObject.stylesheet.rules = _applyLexicographicPermutation(cssObject.stylesheet.rules, I[I.length - 1]);

    /* The watermarked Css string*/
    return Css.stringify(cssObject, options);
};

const _getLexicographicOrder = function (permutation) {

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

const _processWatermark = function (cssObject, I) {

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
        watermark = watermark + Mathjs.multiply(I[i], _productTable(np, index));
    }
    watermark = watermark + I[I.length - 1];

    return watermark;
};

const extractWatermark = function (css) {

    const cssObject = Css.parse(css);
    Fs.writeFileSync('./afterWatermark.json', JSON.stringify(cssObject.stylesheet.rules), 'utf-8');

    /* Getting lexicographic orders from Css rules and declarations*/
    const I = [];
    const rules = cssObject.stylesheet.rules;
    for (let i = 0; i < rules.length; ++i) {
        I.push(_getLexicographicOrder(rules[i].declarations));
    }
    I.push(_getLexicographicOrder(rules));

    const watermark = _processWatermark(cssObject, I);

    return watermark;
};

exports.embedWatermark = embedWatermark;
exports.extractWatermark = extractWatermark;
/* Private methods exported for testing purposes, should not be called outside the module*/
exports._embedingCapacity = embeddingCapacity;
exports._increaseCapacity = increaseCapacity;
exports._productTable = _productTable;
exports._processLexicographicOrders = _processLexicographicOrders;
exports._applyLexicographicPermutation = _applyLexicographicPermutation;
exports._getLexicographicOrder = _getLexicographicOrder;
