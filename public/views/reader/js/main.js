/**
 * Created by XoX on 10/04/2016.
 */

"use strict";

$(function () {

    document.onreadystatechange = function () {
        if (document.readyState == "complete") {
            EPUBJS.filePath = "js/libs/";
            var cssPath = window.location.href.replace(window.location.hash, '');
            cssPath = cssPath.substr(0, cssPath.lastIndexOf('/') + 1) + 'css/';
            EPUBJS.cssPath = cssPath;
            // fileStorage.filePath = EPUBJS.filePath;

            var path = location.pathname;
            var epubID = path.substr(path.lastIndexOf('/') + 1);
            window.reader = ePubReader('http://'+ location.host + '/epub/' + epubID + '/download/book.epub');
        }
    };
});
