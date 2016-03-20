/**
 * Created by XoX on 18/03/2016.
 */
'use strict';

const Css = require('css');
const CleanCss = require('clean-css');

/**
 * This a Css  Parser.
 * It is Built on top of "css" node module ("github.com/reworkcss/css").
 * Provides an Abstract Syntax Tree constructor with a method to sort the rules and declarations,
 * a Rule constructor with a method to compare between two rules,
 * a Declaration Constructor with a method to compare between two declarations,
 * a process method that parses, minifies and sorts the css rules and declarations.
 * @module CssParser
 */

/**
 * A Css Code parser.
 * @class CssParser
 * @constructor
 */

const CssParser = function () {

};

/**
 * Parses, Minifies and Sorts a CSS string and returns An AST Css Object.
 * Calls {{#crossLink "parse:method"}} method
 * @method process
 * @param css
 * @returns {CssObject}
 * @throws {Error} See "github.com/reworkcss/css" for more details
 */
CssParser.prototype.process = function (css) {

    const cleanCss = new CleanCss();

    /* Minifying CSS */
    /* Merging Rules */
    /* Removing duplicate rules and duplicate declarations inside rules */
    const minified = cleanCss.minify(css).styles;
    let cssObject;
    try {

        cssObject = this.parse(minified);
    }
    catch (error) {

        throw  error;
    }
    /* Sorting rules and declarations */
    cssObject.sort();

    return cssObject;
};

/**
 * Parses a CSS string and returns an AST Css Object.
 * Throws an Error if the parsing fail.
 * @method parse
 * @param {string} code
 * @param [options = undefined]
 * @returns {CssObject}
 * @throws {Error} See "github.com/reworkcss/css" for more details.
 */
CssParser.prototype.parse = function (code, options) {

    options = options || undefined;
    let cssObject;
    try {

        cssObject = Css.parse(code, options);
    }
    catch (error) {

        throw error;
    }

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

/**
 * Transform the AST CssObject back to a string
 * @method stringify
 * @param {CssObject} cssObject
 * @param [options = { compress: true }]
 * See "github.com/reworkcss/css" for more details
 * @returns {string}
 */
CssParser.prototype.stringify = function (cssObject, options) {

    options = options || undefined;
    return Css.stringify(cssObject, options);
};

/**
 * An Abstract Syntax Tree (AST) object that represents a parsed Css code.
 * See "github.com/reworkcss/css" For more details.
 *
 * @class CssObject
 * @constructor
 * @param {Rule[]} [rules = []]
 * Array of rules of the Abstract Syntax Tree of a Css Code.
 */

const CssObject = function (rules) {

    /**
     * The type of the Abstract Syntax Tree.
     * It set to 'stylesheet' by default and it should not be modified.
     * @property type
     * @type {string}
     * @default 'stylesheet'
     */
    this.type = 'stylesheet';


    /**
     * The Actual Abstract Syntax Tree, it contains rules and declarations See "github.com/reworkcss/css" For more details.
     * @property stylesheet.rules
     * @type {Rule[]}
     */
    this.stylesheet = {
        rules: rules || []
    };
};

/**
 * Sorts The Rules and Declarations of the AST Css Object Alphabetically.
 * @method sort
 */
CssObject.prototype.sort = function () {

    const sortedRules = this.stylesheet.rules;
    for (let i = 0; i < sortedRules.length; ++i) {
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

/**
 *
 * A node of the AST that represents a Css Rule, it contains selectors and declarations.
 * @class Rule
 * @constructor
 * @param {String[]}  [selectors = []]
 * An array of Selectors that compose the Css Rule.
 * @example : ['h1', 'p']
 * @param {Declaration[]} [declarations = []]
 * An array of Declarations.
 */

const Rule = function (selectors, declarations) {

    selectors = selectors || [];
    declarations = declarations || [];
    /**
     * The type of the node. It is set to 'rule' by default and it should not be modified.
     * @property type
     * @type {string}
     * @default 'rule'
     */
    this.type = 'rule';
    /**
     * An Array of selectors of the rule.
     * @property selectors
     * @type {string[]}
     */
    this.selectors = selectors;
    /**
     * @propery declarations
     * @type {Declaration[]}
     */
    this.declarations = declarations;
};

/**
 * Compares Alphabetically between two Rules based on the selectors.
 * Example : 'h1,h2' < 'h3,h4'
 * @method compare
 * @param {Rule} rule
 * @returns {number}
 */
Rule.prototype.compare = function (rule) {

    return this.getStringSelectors().localeCompare(rule.getStringSelectors());
};

/**
 * Returns the selectors as a String
 * @method getStringSelectors
 * @returns {String}
 */
Rule.prototype.getStringSelectors = function () {

    let stringSelectors = this.selectors[0];
    for (let i = 1; i < this.selectors.length; ++i) {
        stringSelectors = stringSelectors + ',' + this.selectors[i];
    }
    return stringSelectors;
};

/**
 * A node of the AST that represents a Css Declaration, it contains selectors and declarations.
 * @class Declaration
 * @constructor
 * @param {string} [property = '']
 * A Css property
 * @param {string} [value = '']
 * A value of a Css Property.
 * @example
 *     const declaration = new Declaration('display', 'inline');
 */

const Declaration = function (property, value) {

    this.type = 'declaration';

    /**
     * A string that represents a CSS property.
     * @property property
     * @type {string}
     */
    this.property = property || '';

    /**
     * A string that represents a value of a CSS property.
     * @property value
     * @type {string}
     */
    this.value = value || '';

};

/**
 * Compares between two declarations.
 * @method compare
 * @param declaration
 * @returns {number}
 */
Declaration.prototype.compare = function (declaration) {

    return (this.property + this.value).localeCompare((declaration.property + declaration.value));
};

exports.CssParser = CssParser;
exports.CssObject = CssObject;
exports.Rule = Rule;
exports.Declaration = Declaration;
