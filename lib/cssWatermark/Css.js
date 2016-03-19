/**
 * Created by XoX on 18/03/2016.
 */
'use strict';

const Css = require('css');
const CleanCss = require('clean-css');

const CssObject = function (rules) {

    this.type = 'stylesheet';
    this.stylesheet = {
        rules: rules || []
    };

    this.sort = function () {

        const sortedRules = this.stylesheet.rules;
        for (let i = 0; i < rules.length; ++i) {
            /* Sorting Declarations */
            sortedRules[i].declarations.sort((a, b) => {

                return a.compare(b);
            });
        }
        /*Sorting Rules*/
        sortedRules.sort((a, b) => {

            return a.compare(b);
        });
    };
};

const Rule = function (selectors, declarations) {

    selectors = selectors || [];
    declarations = declarations || [];
    this.type = 'rule';
    this.selectors = selectors;
    this.declarations = declarations;


    this.compare = function (rule) {

        return this.getStringSelectors().localeCompare(rule.getStringSelectors());
    };

    this.getStringSelectors = function () {

        let stringSelectors = selectors[0];
        for (let i = 1; i < this.selectors.length; ++i) {
            stringSelectors = stringSelectors + ',' + this.selectors[i];
        }
        return stringSelectors;
    };
};

const Declaration = function (property, value) {

    this.type = 'declaration';
    this.property = property || '';
    this.value = value || '';

    this.compare = function (declaration) {

        return (this.property + this.value).localeCompare((declaration.property + declaration.value));
    };
};

const process = function (css) {

    const cleanCss = new CleanCss();

    /* Minifying CSS */
    /* Merging Rules */
    /* Removing duplicate rules and duplicate declarations inside rules */
    const minified = cleanCss.minify(css).styles;
    const cssObject = parse(minified);
    /* Sorting rules and declarations */
    cssObject.sort();

    return cssObject;
};

const parse = function (code, options) {

    options = options || undefined;
    const cssObject = Css.parse(code, options);

    let oldDeclaration = null;
    let newDeclaration = null;
    let oldRule = null;
    let newRule = null;
    let declarations = [];
    const rules = [];
    /* Augmenting the Rules and Declarations returned by Css parser */
    for (let i = 0; i < cssObject.stylesheet.rules.length; ++i) {

        declarations = [];
        for (let j = 0; j < cssObject.stylesheet.rules[i].declarations.length; ++j) {

            oldDeclaration = cssObject.stylesheet.rules[i].declarations[j];
            newDeclaration = new Declaration(oldDeclaration.property, oldDeclaration.value);
            declarations.push(newDeclaration);
        }
        oldRule = cssObject.stylesheet.rules[i];
        newRule = new Rule(oldRule.selectors, declarations);
        rules.push(newRule);
    }

    return new CssObject(rules);
};

const stringify = function (cssObject, options) {

    options = options || undefined;
    return Css.stringify(cssObject, options);
};

exports.CssObject = CssObject;
exports.Rule = Rule;
exports.Declaration = Declaration;
exports.process = process;
exports.parse = parse;
exports.stringify = stringify;
