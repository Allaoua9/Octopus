/**
 * Created by XoX on 18/03/2016.
 */
'use strict';

const Lab = require('lab').script();
const Code = require('code');
const Fs = require('fs');
const Css = require('../lib/cssWatermark/cssParser.js');

Lab.experiment('Testing CSS Module', () => {

    const cssParser = new Css.CssParser();

    Lab.test('It should create valid Css objects, Rules and Declarations', (done) => {

        let cssObject = new Css.CssObject();
        Code.expect(cssObject.type).to.equal('stylesheet');
        Code.expect(cssObject.stylesheet.rules.length).to.equal(0);

        let declaration = new Css.Declaration();
        Code.expect(declaration.property).to.equal('');
        Code.expect(declaration.value).to.equal('');

        let rule = new Css.Rule();
        Code.expect(rule.selectors.length).to.equal(0);
        Code.expect(rule.declarations.length).to.equal(0);

        declaration = new Css.Declaration('width', '100px');
        rule = new Css.Rule(['h1'], [declaration]);
        cssObject = new Css.CssObject([rule]);

        Code.expect(cssObject.stylesheet.rules[0].selectors[0]).to.equal('h1');
        const d = cssObject.stylesheet.rules[0].declarations[0];
        Code.expect(d.property).to.equal('width');
        Code.expect(d.value).to.equal('100px');
        done();
    });

    Lab.test('It should parse a css string into a AST object and transform it back into a string', (done) => {

        const cssCode = 'h2{width:100px;}';
        let cssObject = cssParser.parse(cssCode);

        Code.expect(cssObject.type).to.equal('stylesheet');

        /* Testing if methods have been added */
        Code.expect(cssObject.stylesheet.rules[0].compare).to.be.a.function();
        Code.expect(cssObject.stylesheet.rules[0].getStringSelectors).to.be.a.function();

        Code.expect(cssObject.stylesheet.rules[0].declarations[0].compare).to.be.a.function();


        Code.expect(cssParser.stringify(cssObject, { compress: true })).to.be.equal(cssCode);


        cssObject = cssParser.parse(cssCode, { silent : true });
        Code.expect(cssObject.type).to.be.equal('stylesheet');
        Code.expect(cssParser.stringify(cssObject)).to.be.equal('h2 {\n' +
            '  width: 100px;\n' +
            '}');
        done();
    });

    Lab.test('It should compress and sort css rules and declarations, merge rules and remove duplicate rules and declarations', (done) => {

        const css = Fs.readFileSync('./test/file/css/stylesheet.css', 'utf8');
        const expectedCss = Fs.readFileSync('./test/file/css/expected-stylesheet.css', 'utf8');

        const processedCss = cssParser.stringify(cssParser.process(css), { compress : true });

        Code.expect(processedCss).to.be.equal(expectedCss);
        done();
    });

    Lab.test('It should throw an error if the input is not a Css file', (done) => {

        Code.expect(() => {

            const notCssCode = 'Not a Css code';
            cssParser.process(notCssCode);
        }).to.throw();

        done();
    });

});

exports.lab = Lab;
