/**
 * Created by XoX on 17/03/2016.
 */
'use strict';

const Lab = require('lab').script();
const Code = require('code');
const CssWatermarker = require('../lib/cssWatermark/cssWatermarker.js');
const Fs = require('fs');
const Css = require('../lib/cssWatermark/cssParser.js');

const Mathjs = require('mathjs');

Lab.experiment('Testing CSS watermark based on lexicographic orders', () => {

    const cssParser = new Css.CssParser();
    const cssWatermarker = new CssWatermarker();

    Lab.test('It should return the embedding capacity given a processed cssObject with process() method', (done) => {

        const css = Fs.readFileSync('./test/file/css/stylesheet.css', 'utf8');
        const cssObject = cssParser.process(css);
        const n = cssWatermarker._embeddingCapacity(cssObject);

        Code.expect(n.toString()).to.equal('6');
        done();
    });

    Lab.test('It should generate random css rules to meet the required embedding size', (done) => {

        const css = Fs.readFileSync('./test/file/css/stylesheet.css', 'utf8');
        let cssObject = cssParser.process(css);
        const size = Mathjs.bignumber(12);
        cssObject = cssWatermarker._increaseCapacity(cssObject, size);
        Code.expect(cssWatermarker._embeddingCapacity(cssObject).greaterThanOrEqualTo(size)).to.be.true();
        done();
    });

    Lab.test('It should multiply the values of the table beginning at index + 1', (done) => {

        const values = [Mathjs.bignumber(2), Mathjs.bignumber(3), Mathjs.bignumber(1), Mathjs.bignumber(7)];
        let result = cssWatermarker._productTable(values, 2);
        Code.expect(result.eq(7)).to.be.true();
        result = cssWatermarker._productTable(values, 3);
        Code.expect(result.eq(1)).to.be.true();
        result = cssWatermarker._productTable(values, 0);
        Code.expect(result.eq(21)).to.be.true();
        done();
    });

    Lab.test('It should process lexicographic orders given a cssObject and an integer watermark', (done) => {

        const declaration1 = new Css.Declaration('color', 'blue');
        const declaration2 = new Css.Declaration('margin', '20px');
        const declaration3 = new Css.Declaration('width', '100px');

        const rule1 = new Css.Rule('rule', ['h1'], [declaration1, declaration2]);
        const rule2 = new Css.Rule('rule', ['h2'], [declaration1, declaration2, declaration3]);
        const cssObject = new Css.CssObject([rule1, rule2]);

        const I = cssWatermarker._processLexicographicOrders(cssObject, 3);
        Code.expect(I.length).to.equal(3);
        Code.expect(I[0].eq(0)).to.be.true();
        Code.expect(I[1].eq(1)).to.be.true();
        Code.expect(I[2].eq(1)).to.be.true();
        done();
    });

    Lab.test('It should apply a lexicographic permutation to a sorted array given the lexicographic order of that permutation', (done) => {

        const declaration1 = new Css.Declaration('display', 'inline');
        const declaration2 = new Css.Declaration('margin', '20px');
        const declaration3 = new Css.Declaration('width', '100px');

        const rule1 = new Css.Rule('rule', ['h1'], [declaration1, declaration2]);
        const rule2 = new Css.Rule('rule', ['h2'], [declaration1, declaration2, declaration3]);


        rule1.declarations = cssWatermarker._applyLexicographicPermutation(rule1.declarations, Mathjs.bignumber(0));
        rule2.declarations = cssWatermarker._applyLexicographicPermutation(rule2.declarations, Mathjs.bignumber(3));

        let order = cssWatermarker._getLexicographicOrder(rule1.declarations);
        Code.expect(order.eq(0)).to.be.true();

        order = cssWatermarker._getLexicographicOrder(rule2.declarations);
        Code.expect(order.eq(3)).to.be.true();

        let rules = [rule1, rule2];
        rules = cssWatermarker._applyLexicographicPermutation(rules, Mathjs.bignumber(1));

        order = cssWatermarker._getLexicographicOrder(rules);
        Code.expect(order.eq(1)).to.be.true();

        Code.expect(rules[0].selectors[0]).to.equal('h2');
        Code.expect(rules[1].selectors[0]).to.equal('h1');

        done();
    });

    Lab.test('It should embedWatermark a Integer watermark into a css code using lexicographic permutations', (done) => {

        const cssCode = 'h1{display:bloc;margin:10px;}h2{display:inline;margin:20px;width:100px;}';
        let cssWtmk = cssWatermarker.embedWatermark(cssCode, '0x3');
        Code.expect(cssWtmk).to.equal('h2{display:inline;width:100px;margin:20px;}h1{display:bloc;margin:10px;}');

        let watermark = cssWatermarker.extractWatermark(cssWtmk);
        Code.expect(watermark).to.equal('0x3');

        // When watermark = 0 the cssCode does not change
        cssWtmk = cssWatermarker.embedWatermark(cssCode, '0x0');
        Code.expect(cssWtmk).to.equal(cssCode);

        watermark = cssWatermarker.extractWatermark(cssWtmk);
        Code.expect(watermark).to.equal('0x0');

        cssWtmk = cssWatermarker.embedWatermark(cssCode, '0x7930263824715c342a274a526b');
        Code.expect(cssWtmk.length).above(cssCode.length);
        watermark = cssWatermarker.extractWatermark(cssWtmk);
        Code.expect(watermark).to.equal('0x7930263824715c342a274a526b');
        done();
    });

    Lab.test('It should not throw error when the css file is too big', (done) => {

        const cssCode = Fs.readFileSync('./test/file/css/core.css', 'utf8');

        const cssWtmk = cssWatermarker.embedWatermark(cssCode, '0x7930263824715c342a274a526b');
        const watermark = cssWatermarker.extractWatermark(cssWtmk);
        Code.expect(watermark).to.equal('0x7930263824715c342a274a526b');
        done();
    });

});

exports.lab = Lab;
