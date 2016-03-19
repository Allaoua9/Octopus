/**
 * Created by XoX on 17/03/2016.
 */
'use strict';

const Lab = require('lab').script();
const Code = require('code');
const CssWatermarker = require('../lib/cssWatermark/cssWatermarker.js');
const Fs = require('fs');
const Css = require('../lib/cssWatermark/css.js');

Lab.experiment('Testing CSS watermark based on lexicographic orders', () => {

    Lab.test('It should return the embedding capacity given a processed cssObject with process() method', (done) => {

        const css = Fs.readFileSync('./test/file/css/stylesheet.css', 'utf8');
        const cssObject = Css.process(css);
        const n = CssWatermarker._embedingCapacity(cssObject);
        Code.expect(n).to.be.equal(6);
        done();
    });

    Lab.test('It should generate random css rules to meet the required embedding size', (done) => {

        const css = Fs.readFileSync('./test/file/css/stylesheet.css', 'utf8');
        let cssObject = Css.process(css);
        const size = 12;
        cssObject = CssWatermarker._increaseCapacity(cssObject, size);
        Code.expect(CssWatermarker._embedingCapacity(cssObject)).to.be.at.least(size);
        done();
    });

    Lab.test('It should multiply the values of the table beginning at index + 1', (done) => {

        const values = [2, 3, 1, 7];
        let result = CssWatermarker._productTable(values, 2);
        Code.expect(result).to.be.equal(7);
        result = CssWatermarker._productTable(values, 3);
        Code.expect(result).to.be.equal(1);
        result = CssWatermarker._productTable(values, 0);
        Code.expect(result).to.be.equal(21);
        done();
    });

    Lab.test('It should process lexicographic orders given a cssObject and an integer watermark', (done) => {

        const declaration1 = new Css.Declaration('color', 'blue');
        const declaration2 = new Css.Declaration('margin', '20px');
        const declaration3 = new Css.Declaration('width', '100px');

        const rule1 = new Css.Rule(['h1'], [declaration1, declaration2]);
        const rule2 = new Css.Rule(['h2'], [declaration1, declaration2, declaration3]);
        const cssObject = new Css.CssObject([rule1, rule2]);

        const I = CssWatermarker._processLexicographicOrders(cssObject, 3);
        Code.expect(I.length).to.be.equal(3);
        Code.expect(I[0]).to.be.equal(0);
        Code.expect(I[1]).to.be.equal(1);
        Code.expect(I[2]).to.be.equal(1);
        done();
    });

    Lab.test('It should apply a lexicographic permutation to a sorted array given the lexicographic order of that permutation', (done) => {

        const declaration1 = new Css.Declaration('display', 'inline');
        const declaration2 = new Css.Declaration('margin', '20px');
        const declaration3 = new Css.Declaration('width', '100px');

        const rule1 = new Css.Rule(['h1'], [declaration1, declaration2]);
        const rule2 = new Css.Rule(['h2'], [declaration1, declaration2, declaration3]);


        rule1.declarations = CssWatermarker._applyLexicographicPermutation(rule1.declarations, 0);
        rule2.declarations = CssWatermarker._applyLexicographicPermutation(rule2.declarations, 3);

        let order = CssWatermarker._getLexicographicOrder(rule1.declarations);
        Code.expect(order).to.equal(0);

        order = CssWatermarker._getLexicographicOrder(rule2.declarations);
        Code.expect(order).to.equal(3);

        let rules = [rule1, rule2];
        rules = CssWatermarker._applyLexicographicPermutation(rules, 1);

        order = CssWatermarker._getLexicographicOrder(rules);
        Code.expect(order).to.equal(1);

        Code.expect(rules[0].selectors[0]).to.be.equal('h2');
        Code.expect(rules[1].selectors[0]).to.be.equal('h1');

        done();
    });

    Lab.test('It should embed a Integer watermark into a css code using lexicographic permutations', (done) => {

        const cssCode = 'h1{margin:10px;display:bloc;}h2{display:inline;margin:20px;width:100px;}';
        const cssWtmk = CssWatermarker.embedWatermark(cssCode, 16);
        //Code.expect(cssWtmk).to.equal('h2{display:inline;width:100px;margin:20px;}h1{display:bloc;margin:10px;}');
        //
        const watermark = CssWatermarker.extractWatermark(cssWtmk);
        Code.expect(watermark).to.equal(16);

        /*cssWtmk = CssWatermarker.embedWatermark(cssCode, 0);
        Code.expect(cssWtmk).to.equal(cssCode);

        watermark = CssWatermarker.extractWatermark(cssWtmk);
        Code.expect(watermark).to.equal(0);*/

        /*cssWtmk = CssWatermarker.embedWatermark(cssCode, 16);
        Code.expect(cssWtmk.length).to.be.at.above(cssCode.length);

        const watermark = CssWatermarker.extractWatermark(cssWtmk);
        Code.expect(watermark).to.equal(16);*/
        done();
    });
});

exports.lab = Lab;
