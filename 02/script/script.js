function isCompatible(ua) {
    return !!((function () {
        'use strict';
        return !this && Function.prototype.bind && window.JSON;
    }()) && 'querySelector' in document && 'localStorage' in window && 'addEventListener' in window && !ua.match(/MSIE 10|webOS\/1\.[0-4]|SymbianOS|NetFront|Opera Mini|S40OviBrowser|MeeGo|Android.+Glass|^Mozilla\/5\.0 .+ Gecko\/$|googleweblight|PLAYSTATION|PlayStation/));
}
if (!isCompatible(navigator.userAgent)) {
    document.documentElement.className = document.documentElement.className.replace(/(^|\s)client-js(\s|$)/, '$1client-nojs$2');
    while (window.NORLQ && NORLQ[0]) {
        NORLQ.shift()();
    }
    NORLQ = {
        push: function (fn) {
            fn();
        }
    };
    RLQ = {
        push: function () {}
    };
} else {
    if (window.performance && performance.mark) {
        performance.mark('mwStartup');
    }(function () {
        'use strict';
        var mw, StringSet, log, hasOwn = Object.prototype.hasOwnProperty;

        function fnv132(str) {
            var hash = 0x811C9DC5,
                i = 0;
            for (; i < str.length; i++) {
                hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
                hash ^= str.charCodeAt(i);
            }
            hash = (hash >>> 0).toString(36);
            while (hash.length < 7) {
                hash =
                    '0' + hash;
            }
            return hash;
        }

        function defineFallbacks() {
            StringSet = window.Set || function () {
                var set = Object.create(null);
                return {
                    add: function (value) {
                        set[value] = !0;
                    },
                    has: function (value) {
                        return value in set;
                    }
                };
            };
        }

        function setGlobalMapValue(map, key, value) {
            map.values[key] = value;
            log.deprecate(window, key, value, map === mw.config && 'Use mw.config instead.');
        }

        function logError(topic, data) {
            var msg, e = data.exception,
                console = window.console;
            if (console && console.log) {
                msg = (e ? 'Exception' : 'Error') + ' in ' + data.source + (data.module ? ' in module ' + data.module : '') + (e ? ':' : '.');
                console.log(msg);
                if (e && console.warn) {
                    console.warn(e);
                }
            }
        }

        function Map(global) {
            this.values = Object.create(null);
            if (global === true) {
                this.set = function (selection, value) {
                    var s;
                    if (arguments.length > 1) {
                        if (typeof selection === 'string') {
                            setGlobalMapValue(this, selection, value);
                            return true;
                        }
                    } else if (typeof selection === 'object') {
                        for (s in selection) {
                            setGlobalMapValue(this, s, selection[s]);
                        }
                        return true;
                    }
                    return false;
                };
            }
        }
        Map.prototype = {
            constructor: Map,
            get: function (
                selection, fallback) {
                var results, i;
                fallback = arguments.length > 1 ? fallback : null;
                if (Array.isArray(selection)) {
                    results = {};
                    for (i = 0; i < selection.length; i++) {
                        if (typeof selection[i] === 'string') {
                            results[selection[i]] = selection[i] in this.values ? this.values[selection[i]] : fallback;
                        }
                    }
                    return results;
                }
                if (typeof selection === 'string') {
                    return selection in this.values ? this.values[selection] : fallback;
                }
                if (selection === undefined) {
                    results = {};
                    for (i in this.values) {
                        results[i] = this.values[i];
                    }
                    return results;
                }
                return fallback;
            },
            set: function (selection, value) {
                var s;
                if (arguments.length > 1) {
                    if (typeof selection === 'string') {
                        this.values[selection] = value;
                        return true;
                    }
                } else if (typeof selection === 'object') {
                    for (s in selection) {
                        this.values[s] = selection[s];
                    }
                    return true;
                }
                return false;
            },
            exists: function (selection) {
                var i;
                if (Array.isArray(selection)) {
                    for (i = 0; i < selection.length; i++) {
                        if (typeof selection[i] !== 'string' || !(selection[i] in this.values)) {
                            return false;
                        }
                    }
                    return true;
                }
                return typeof selection === 'string' && selection in this.values;
            }
        };
        defineFallbacks();
        log = (function () {
            var log = function () {},
                console = window.console;
            log.warn = console && console.warn ? Function.prototype.bind.call(console.warn, console) : function () {};
            log.error = console && console.error ? Function.prototype.bind.call(console.error, console) : function () {};
            log.deprecate = function (obj, key, val, msg, logName) {
                var stacks;

                function maybeLog() {
                    var name = logName || key,
                        trace = new Error().stack;
                    if (!stacks) {
                        stacks = new StringSet();
                    }
                    if (!stacks.has(trace)) {
                        stacks.add(trace);
                        if (logName || obj === window) {
                            mw.track('mw.deprecate', name);
                        }
                        mw.log.warn('Use of "' + name + '" is deprecated.' + (msg ? ' ' + msg : ''));
                    }
                }
                try {
                    Object.defineProperty(obj, key, {
                        configurable: !0,
                        enumerable: !0,
                        get: function () {
                            maybeLog();
                            return val;
                        },
                        set: function (newVal) {
                            maybeLog();
                            val = newVal;
                        }
                    });
                } catch (err) {
                    obj[key] = val;
                }
            };
            return log;
        }());
        mw = {
            redefineFallbacksForTest: function () {
                if (!window.QUnit) {
                    throw new Error('Not allowed');
                }
                defineFallbacks();
            },
            now: function () {
                var perf = window.performance,
                    navStart = perf && perf.timing && perf.timing.
                navigationStart;
                mw.now = navStart && perf.now ? function () {
                    return navStart + perf.now();
                } : Date.now;
                return mw.now();
            },
            trackQueue: [],
            track: function (topic, data) {
                mw.trackQueue.push({
                    topic: topic,
                    timeStamp: mw.now(),
                    data: data
                });
            },
            trackError: function (topic, data) {
                mw.track(topic, data);
                logError(topic, data);
            },
            Map: Map,
            config: null,
            libs: {},
            legacy: {},
            messages: new Map(),
            templates: new Map(),
            log: log,
            loader: (function () {
                var registry = Object.create(null),
                    sources = Object.create(null),
                    handlingPendingRequests = !1,
                    pendingRequests = [],
                    queue = [],
                    jobs = [],
                    willPropagate = !1,
                    errorModules = [],
                    baseModules = ["jquery", "mediawiki.base", "mediawiki.legacy.wikibits"],
                    marker = document.querySelector('meta[name="ResourceLoaderDynamicStyles"]'),
                    nextCssBuffer, rAF = window.requestAnimationFrame || setTimeout;

                function newStyleTag(text, nextNode) {
                    var el = document.createElement('style');
                    el.appendChild(document.createTextNode(text));
                    if (nextNode && nextNode.parentNode) {
                        nextNode.parentNode.insertBefore(el, nextNode);
                    } else {
                        document.head.appendChild(el);
                    }
                    return el;
                }

                function flushCssBuffer(cssBuffer) {
                    var i;
                    cssBuffer.active = !1;
                    newStyleTag(cssBuffer.cssText, marker);
                    for (i = 0; i < cssBuffer.callbacks.length; i++) {
                        cssBuffer.callbacks[i]();
                    }
                }

                function addEmbeddedCSS(cssText, callback) {
                    if (!nextCssBuffer || nextCssBuffer.active === false || cssText.slice(0, '@import'.length) === '@import') {
                        nextCssBuffer = {
                            cssText: '',
                            callbacks: [],
                            active: null
                        };
                    }
                    nextCssBuffer.cssText += '\n' + cssText;
                    nextCssBuffer.callbacks.push(callback);
                    if (nextCssBuffer.active === null) {
                        nextCssBuffer.active = !0;
                        rAF(flushCssBuffer.bind(null, nextCssBuffer));
                    }
                }

                function getCombinedVersion(modules) {
                    var hashes = modules.reduce(function (result, module) {
                        return result + registry[module].version;
                    }, '');
                    return fnv132(hashes);
                }

                function allReady(modules) {
                    var i = 0;
                    for (; i < modules.length; i++) {
                        if (mw.loader.getState(modules[i]) !== 'ready') {
                            return false;
                        }
                    }
                    return true;
                }

                function allWithImplicitReady(module) {
                    return allReady(registry[module].dependencies) && (baseModules.indexOf(module) !== -1 || allReady(baseModules));
                }

                function
                anyFailed(modules) {
                    var state, i = 0;
                    for (; i < modules.length; i++) {
                        state = mw.loader.getState(modules[i]);
                        if (state === 'error' || state === 'missing') {
                            return true;
                        }
                    }
                    return false;
                }

                function doPropagation() {
                    var errorModule, baseModuleError, module, i, failed, job, didPropagate = !0;
                    do {
                        didPropagate = !1;
                        while (errorModules.length) {
                            errorModule = errorModules.shift();
                            baseModuleError = baseModules.indexOf(errorModule) !== -1;
                            for (module in registry) {
                                if (registry[module].state !== 'error' && registry[module].state !== 'missing') {
                                    if (baseModuleError && baseModules.indexOf(module) === -1) {
                                        registry[module].state = 'error';
                                        didPropagate = !0;
                                    } else if (registry[module].dependencies.indexOf(errorModule) !== -1) {
                                        registry[module].state = 'error';
                                        errorModules.push(module);
                                        didPropagate = !0;
                                    }
                                }
                            }
                        }
                        for (module in registry) {
                            if (registry[module].state === 'loaded' && allWithImplicitReady(module)) {
                                execute(module);
                                didPropagate = !0;
                            }
                        }
                        for (i = 0; i < jobs.length; i++) {
                            job = jobs[i];
                            failed = anyFailed(job.dependencies);
                            if (failed || allReady(job.dependencies)) {
                                jobs.splice(i, 1);
                                i
                                    -= 1;
                                try {
                                    if (failed && job.error) {
                                        job.error(new Error('Failed dependencies'), job.dependencies);
                                    } else if (!failed && job.ready) {
                                        job.ready();
                                    }
                                } catch (e) {
                                    mw.trackError('resourceloader.exception', {
                                        exception: e,
                                        source: 'load-callback'
                                    });
                                }
                                didPropagate = !0;
                            }
                        }
                    } while (didPropagate);
                    willPropagate = !1;
                }

                function requestPropagation() {
                    if (willPropagate) {
                        return;
                    }
                    willPropagate = !0;
                    mw.requestIdleCallback(doPropagation, {
                        timeout: 1
                    });
                }

                function setAndPropagate(module, state) {
                    registry[module].state = state;
                    if (state === 'loaded' || state === 'ready' || state === 'error' || state === 'missing') {
                        if (state === 'ready') {
                            mw.loader.store.add(module);
                        } else if (state === 'error' || state === 'missing') {
                            errorModules.push(module);
                        }
                        requestPropagation();
                    }
                }

                function sortDependencies(module, resolved, unresolved) {
                    var i, skip, deps;
                    if (!(module in registry)) {
                        throw new Error('Unknown module: ' + module);
                    }
                    if (typeof registry[module].skip === 'string') {
                        skip = (new Function(registry[module].skip)());
                        registry[module].skip = !!skip;
                        if (skip) {
                            registry[module].dependencies = [];
                            setAndPropagate(module, 'ready');
                            return;
                        }
                    }
                    if (!unresolved) {
                        unresolved = new StringSet();
                    }
                    deps = registry[module].dependencies;
                    unresolved.add(module);
                    for (i = 0; i < deps.length; i++) {
                        if (resolved.indexOf(deps[i]) === -1) {
                            if (unresolved.has(deps[i])) {
                                throw new Error('Circular reference detected: ' + module + ' -> ' + deps[i]);
                            }
                            sortDependencies(deps[i], resolved, unresolved);
                        }
                    }
                    resolved.push(module);
                }

                function resolve(modules) {
                    var resolved = baseModules.slice(),
                        i = 0;
                    for (; i < modules.length; i++) {
                        sortDependencies(modules[i], resolved);
                    }
                    return resolved;
                }

                function resolveStubbornly(modules) {
                    var saved, resolved = baseModules.slice(),
                        i = 0;
                    for (; i < modules.length; i++) {
                        saved = resolved.slice();
                        try {
                            sortDependencies(modules[i], resolved);
                        } catch (err) {
                            resolved = saved;
                            mw.trackError('resourceloader.exception', {
                                exception: err,
                                source: 'resolve'
                            });
                        }
                    }
                    return resolved;
                }

                function resolveRelativePath(relativePath, basePath) {
                    var prefixes, prefix, baseDirParts, relParts = relativePath.match(/^((?:\.\.?\/)+)(.*)$/);
                    if (!relParts) {
                        return null;
                    }
                    baseDirParts = basePath.
                    split('/');
                    baseDirParts.pop();
                    prefixes = relParts[1].split('/');
                    prefixes.pop();
                    while ((prefix = prefixes.pop()) !== undefined) {
                        if (prefix === '..') {
                            baseDirParts.pop();
                        }
                    }
                    return (baseDirParts.length ? baseDirParts.join('/') + '/' : '') + relParts[2];
                }

                function makeRequireFunction(moduleObj, basePath) {
                    return function require(moduleName) {
                        var fileName, fileContent, result, moduleParam, scriptFiles = moduleObj.script.files;
                        fileName = resolveRelativePath(moduleName, basePath);
                        if (fileName === null) {
                            return mw.loader.require(moduleName);
                        }
                        if (!hasOwn.call(scriptFiles, fileName)) {
                            throw new Error('Cannot require() undefined file ' + fileName);
                        }
                        if (hasOwn.call(moduleObj.packageExports, fileName)) {
                            return moduleObj.packageExports[fileName];
                        }
                        fileContent = scriptFiles[fileName];
                        if (typeof fileContent === 'function') {
                            moduleParam = {
                                exports: {}
                            };
                            fileContent(makeRequireFunction(moduleObj, fileName), moduleParam);
                            result = moduleParam.exports;
                        } else {
                            result = fileContent;
                        }
                        moduleObj.packageExports[fileName] = result;
                        return result;
                    };
                }

                function addScript(src, callback) {
                    var script = document.createElement('script');
                    script.src = src;
                    script.onload = script.onerror = function () {
                        if (script.parentNode) {
                            script.parentNode.removeChild(script);
                        }
                        if (callback) {
                            callback();
                            callback = null;
                        }
                    };
                    document.head.appendChild(script);
                }

                function queueModuleScript(src, moduleName, callback) {
                    pendingRequests.push(function () {
                        if (moduleName !== 'jquery') {
                            window.require = mw.loader.require;
                            window.module = registry[moduleName].module;
                        }
                        addScript(src, function () {
                            delete window.module;
                            callback();
                            if (pendingRequests[0]) {
                                pendingRequests.shift()();
                            } else {
                                handlingPendingRequests = !1;
                            }
                        });
                    });
                    if (!handlingPendingRequests && pendingRequests[0]) {
                        handlingPendingRequests = !0;
                        pendingRequests.shift()();
                    }
                }

                function addLink(url, media, nextNode) {
                    var el = document.createElement('link');
                    el.rel = 'stylesheet';
                    if (media && media !== 'all') {
                        el.media = media;
                    }
                    el.href = url;
                    if (nextNode && nextNode.parentNode) {
                        nextNode.parentNode.insertBefore(el, nextNode);
                    } else {
                        document.head.appendChild(el);
                    }
                }

                function domEval(code) {
                    var script = document.
                    createElement('script');
                    if (mw.config.get('wgCSPNonce') !== false) {
                        script.nonce = mw.config.get('wgCSPNonce');
                    }
                    script.text = code;
                    document.head.appendChild(script);
                    script.parentNode.removeChild(script);
                }

                function enqueue(dependencies, ready, error) {
                    if (allReady(dependencies)) {
                        if (ready !== undefined) {
                            ready();
                        }
                        return;
                    }
                    if (anyFailed(dependencies)) {
                        if (error !== undefined) {
                            error(new Error('One or more dependencies failed to load'), dependencies);
                        }
                        return;
                    }
                    if (ready !== undefined || error !== undefined) {
                        jobs.push({
                            dependencies: dependencies.filter(function (module) {
                                var state = registry[module].state;
                                return state === 'registered' || state === 'loaded' || state === 'loading' || state === 'executing';
                            }),
                            ready: ready,
                            error: error
                        });
                    }
                    dependencies.forEach(function (module) {
                        if (registry[module].state === 'registered' && queue.indexOf(module) === -1) {
                            if (registry[module].group === 'private') {
                                setAndPropagate(module, 'error');
                            } else {
                                queue.push(module);
                            }
                        }
                    });
                    mw.loader.work();
                }

                function execute(module) {
                    var key, value, media, i, urls, cssHandle, siteDeps, siteDepErr,
                        runScript, cssPending = 0;
                    if (registry[module].state !== 'loaded') {
                        throw new Error('Module in state "' + registry[module].state + '" may not be executed: ' + module);
                    }
                    registry[module].state = 'executing';
                    runScript = function () {
                        var script, markModuleReady, nestedAddScript, mainScript;
                        script = registry[module].script;
                        markModuleReady = function () {
                            setAndPropagate(module, 'ready');
                        };
                        nestedAddScript = function (arr, callback, i) {
                            if (i >= arr.length) {
                                callback();
                                return;
                            }
                            queueModuleScript(arr[i], module, function () {
                                nestedAddScript(arr, callback, i + 1);
                            });
                        };
                        try {
                            if (Array.isArray(script)) {
                                nestedAddScript(script, markModuleReady, 0);
                            } else if (typeof script === 'function' || (typeof script === 'object' && script !== null)) {
                                if (typeof script === 'function') {
                                    if (module === 'jquery') {
                                        script();
                                    } else {
                                        script(window.$, window.$, mw.loader.require, registry[module].module);
                                    }
                                } else {
                                    mainScript = script.files[script.main];
                                    if (typeof mainScript !== 'function') {
                                        throw new Error('Main file ' + script.main + ' in module ' + module + ' must be of type function, found ' + typeof mainScript);
                                    }
                                    mainScript(makeRequireFunction(registry[module], script.main), registry[module].module);
                                }
                                markModuleReady();
                            } else if (typeof script === 'string') {
                                domEval(script);
                                markModuleReady();
                            } else {
                                markModuleReady();
                            }
                        } catch (e) {
                            setAndPropagate(module, 'error');
                            mw.trackError('resourceloader.exception', {
                                exception: e,
                                module: module,
                                source: 'module-execute'
                            });
                        }
                    };
                    if (registry[module].messages) {
                        mw.messages.set(registry[module].messages);
                    }
                    if (registry[module].templates) {
                        mw.templates.set(module, registry[module].templates);
                    }
                    cssHandle = function () {
                        cssPending++;
                        return function () {
                            var runScriptCopy;
                            cssPending--;
                            if (cssPending === 0) {
                                runScriptCopy = runScript;
                                runScript = undefined;
                                runScriptCopy();
                            }
                        };
                    };
                    if (registry[module].style) {
                        for (key in registry[module].style) {
                            value = registry[module].style[key];
                            media = undefined;
                            if (key !== 'url' && key !== 'css') {
                                if (typeof value === 'string') {
                                    addEmbeddedCSS(value, cssHandle());
                                } else {
                                    media = key;
                                    key = 'bc-url';
                                }
                            }
                            if (Array.isArray(value)) {
                                for (i = 0; i < value.length; i++) {
                                    if (key === 'bc-url') {
                                        addLink(value[i], media, marker);
                                    } else if (key === 'css') {
                                        addEmbeddedCSS(value[i], cssHandle());
                                    }
                                }
                            } else if (typeof value === 'object') {
                                for (media in value) {
                                    urls = value[media];
                                    for (i = 0; i < urls.length; i++) {
                                        addLink(urls[i], media, marker);
                                    }
                                }
                            }
                        }
                    }
                    if (module === 'user') {
                        try {
                            siteDeps = resolve(['site']);
                        } catch (e) {
                            siteDepErr = e;
                            runScript();
                        }
                        if (siteDepErr === undefined) {
                            enqueue(siteDeps, runScript, runScript);
                        }
                    } else if (cssPending === 0) {
                        runScript();
                    }
                }

                function sortQuery(o) {
                    var key, sorted = {},
                        a = [];
                    for (key in o) {
                        a.push(key);
                    }
                    a.sort();
                    for (key = 0; key < a.length; key++) {
                        sorted[a[key]] = o[a[key]];
                    }
                    return sorted;
                }

                function buildModulesString(moduleMap) {
                    var p, prefix, str = [],
                        list = [];

                    function restore(suffix) {
                        return p + suffix;
                    }
                    for (prefix in moduleMap) {
                        p = prefix === '' ? '' : prefix + '.';
                        str.push(p + moduleMap[prefix].join(','));
                        list.push.apply(list, moduleMap[prefix].map(restore));
                    }
                    return {
                        str: str.join('|'),
                        list: list
                    };
                }

                function resolveIndexedDependencies(modules) {
                    var i, j, deps;

                    function resolveIndex(dep) {
                        return typeof dep === 'number' ? modules[dep][0] : dep;
                    }
                    for (i = 0; i < modules.length; i++) {
                        deps = modules[i][2];
                        if (deps) {
                            for (j = 0; j < deps.length; j++) {
                                deps[j] = resolveIndex(deps[j]);
                            }
                        }
                    }
                }

                function makeQueryString(params) {
                    return Object.keys(params).map(function (key) {
                        return encodeURIComponent(key) + '=' + encodeURIComponent(params[key]);
                    }).join('&');
                }

                function batchRequest(batch) {
                    var reqBase, splits, b, bSource, bGroup, source, group, i, modules, sourceLoadScript, currReqBase, currReqBaseLength, moduleMap, currReqModules, l, lastDotIndex, prefix, suffix, bytesAdded;

                    function doRequest() {
                        var query = Object.create(currReqBase),
                            packed = buildModulesString(moduleMap);
                        query.modules = packed.str;
                        query.version = getCombinedVersion(packed.list);
                        query = sortQuery(query);
                        addScript(sourceLoadScript + '?' + makeQueryString(query));
                    }
                    if (!batch.length) {
                        return;
                    }
                    batch.sort();
                    reqBase = {
                        skin: mw.config.get('skin'),
                        lang: mw.config.get('wgUserLanguage'),
                        debug: mw.config.get('debug')
                    };
                    splits = Object.create(null);
                    for (b = 0; b < batch.length; b++) {
                        bSource = registry[batch[b]].source;
                        bGroup = registry[batch[b]].group;
                        if (!splits[bSource]) {
                            splits[bSource] = Object.
                            create(null);
                        }
                        if (!splits[bSource][bGroup]) {
                            splits[bSource][bGroup] = [];
                        }
                        splits[bSource][bGroup].push(batch[b]);
                    }
                    for (source in splits) {
                        sourceLoadScript = sources[source];
                        for (group in splits[source]) {
                            modules = splits[source][group];
                            currReqBase = Object.create(reqBase);
                            if (group === 'user' && mw.config.get('wgUserName') !== null) {
                                currReqBase.user = mw.config.get('wgUserName');
                            }
                            currReqBaseLength = makeQueryString(currReqBase).length + 25;
                            l = currReqBaseLength;
                            moduleMap = Object.create(null);
                            currReqModules = [];
                            for (i = 0; i < modules.length; i++) {
                                lastDotIndex = modules[i].lastIndexOf('.');
                                prefix = modules[i].substr(0, lastDotIndex);
                                suffix = modules[i].slice(lastDotIndex + 1);
                                bytesAdded = moduleMap[prefix] ? suffix.length + 3 : modules[i].length + 3;
                                if (currReqModules.length && l + bytesAdded > mw.loader.maxQueryLength) {
                                    doRequest();
                                    l = currReqBaseLength;
                                    moduleMap = Object.create(null);
                                    currReqModules = [];
                                    mw.track('resourceloader.splitRequest', {
                                        maxQueryLength: mw.loader.maxQueryLength
                                    });
                                }
                                if (!moduleMap[prefix]) {
                                    moduleMap[prefix] = [];
                                }
                                l += bytesAdded;
                                moduleMap[
                                    prefix].push(suffix);
                                currReqModules.push(modules[i]);
                            }
                            if (currReqModules.length) {
                                doRequest();
                            }
                        }
                    }
                }

                function asyncEval(implementations, cb) {
                    if (!implementations.length) {
                        return;
                    }
                    mw.requestIdleCallback(function () {
                        try {
                            domEval(implementations.join(';'));
                        } catch (err) {
                            cb(err);
                        }
                    });
                }

                function getModuleKey(module) {
                    return module in registry ? (module + '@' + registry[module].version) : null;
                }

                function splitModuleKey(key) {
                    var index = key.indexOf('@');
                    if (index === -1) {
                        return {
                            name: key,
                            version: ''
                        };
                    }
                    return {
                        name: key.slice(0, index),
                        version: key.slice(index + 1)
                    };
                }

                function registerOne(module, version, dependencies, group, source, skip) {
                    if (module in registry) {
                        throw new Error('module already registered: ' + module);
                    }
                    registry[module] = {
                        module: {
                            exports: {}
                        },
                        packageExports: {},
                        version: String(version || ''),
                        dependencies: dependencies || [],
                        group: typeof group === 'string' ? group : null,
                        source: typeof source === 'string' ? source : 'local',
                        state: 'registered',
                        skip: typeof skip === 'string' ? skip : null
                    };
                }
                return {
                    moduleRegistry: registry,
                    maxQueryLength: 5000,
                    addStyleTag: newStyleTag,
                    enqueue: enqueue,
                    resolve: resolve,
                    work: function () {
                        var implementations, sourceModules, batch = [],
                            q = 0;
                        for (; q < queue.length; q++) {
                            if (queue[q] in registry && registry[queue[q]].state === 'registered') {
                                if (batch.indexOf(queue[q]) === -1) {
                                    batch.push(queue[q]);
                                    registry[queue[q]].state = 'loading';
                                }
                            }
                        }
                        queue = [];
                        if (!batch.length) {
                            return;
                        }
                        mw.loader.store.init();
                        if (mw.loader.store.enabled) {
                            implementations = [];
                            sourceModules = [];
                            batch = batch.filter(function (module) {
                                var implementation = mw.loader.store.get(module);
                                if (implementation) {
                                    implementations.push(implementation);
                                    sourceModules.push(module);
                                    return false;
                                }
                                return true;
                            });
                            asyncEval(implementations, function (err) {
                                var failed;
                                mw.loader.store.stats.failed++;
                                mw.loader.store.clear();
                                mw.trackError('resourceloader.exception', {
                                    exception: err,
                                    source: 'store-eval'
                                });
                                failed = sourceModules.filter(function (module) {
                                    return registry[module].state === 'loading';
                                });
                                batchRequest(failed);
                            });
                        }
                        batchRequest(batch);
                    },
                    addSource: function (ids) {
                        var id;
                        for (id in ids) {
                            if (id in sources) {
                                throw new Error('source already registered: ' + id);
                            }
                            sources[id] = ids[id];
                        }
                    },
                    register: function (modules) {
                        var i;
                        if (typeof modules === 'object') {
                            resolveIndexedDependencies(modules);
                            for (i = 0; i < modules.length; i++) {
                                registerOne.apply(null, modules[i]);
                            }
                        } else {
                            registerOne.apply(null, arguments);
                        }
                    },
                    implement: function (module, script, style, messages, templates) {
                        var split = splitModuleKey(module),
                            name = split.name,
                            version = split.version;
                        if (!(name in registry)) {
                            mw.loader.register(name);
                        }
                        if (registry[name].script !== undefined) {
                            throw new Error('module already implemented: ' + name);
                        }
                        if (version) {
                            registry[name].version = version;
                        }
                        registry[name].script = script || null;
                        registry[name].style = style || null;
                        registry[name].messages = messages || null;
                        registry[name].templates = templates || null;
                        if (registry[name].state !== 'error' && registry[name].state !== 'missing') {
                            setAndPropagate(name, 'loaded');
                        }
                    },
                    load: function (modules, type) {
                        if (typeof modules === 'string' && /^(https?:)?\/?\//.test(modules)) {
                            if (type === 'text/css') {
                                addLink(modules);
                            } else if (type === 'text/javascript' ||
                                type === undefined) {
                                addScript(modules);
                            } else {
                                throw new Error('type must be text/css or text/javascript, found ' + type);
                            }
                        } else {
                            modules = typeof modules === 'string' ? [modules] : modules;
                            enqueue(resolveStubbornly(modules), undefined, undefined);
                        }
                    },
                    state: function (states) {
                        var module, state;
                        for (module in states) {
                            state = states[module];
                            if (!(module in registry)) {
                                mw.loader.register(module);
                            }
                            setAndPropagate(module, state);
                        }
                    },
                    getVersion: function (module) {
                        return module in registry ? registry[module].version : null;
                    },
                    getState: function (module) {
                        return module in registry ? registry[module].state : null;
                    },
                    getModuleNames: function () {
                        return Object.keys(registry);
                    },
                    require: function (moduleName) {
                        var state = mw.loader.getState(moduleName);
                        if (state !== 'ready') {
                            throw new Error('Module "' + moduleName + '" is not loaded');
                        }
                        return registry[moduleName].module.exports;
                    },
                    store: {
                        enabled: null,
                        MODULE_SIZE_MAX: 100 * 1000,
                        items: {},
                        queue: [],
                        stats: {
                            hits: 0,
                            misses: 0,
                            expired: 0,
                            failed: 0
                        },
                        toJSON: function () {
                            return {
                                items: mw.loader.store.items,
                                vary: mw.loader.
                                store.getVary()
                            };
                        },
                        getStoreKey: function () {
                            return 'MediaWikiModuleStore:' + mw.config.get('wgDBname');
                        },
                        getVary: function () {
                            return mw.config.get('skin') + ':' + mw.config.get('wgResourceLoaderStorageVersion') + ':' + mw.config.get('wgUserLanguage');
                        },
                        init: function () {
                            var raw, data;
                            if (this.enabled !== null) {
                                return;
                            }
                            if (/Firefox/.test(navigator.userAgent) || !mw.config.get('wgResourceLoaderStorageEnabled')) {
                                this.clear();
                                this.enabled = !1;
                                return;
                            }
                            if (mw.config.get('debug')) {
                                this.enabled = !1;
                                return;
                            }
                            try {
                                raw = localStorage.getItem(this.getStoreKey());
                                this.enabled = !0;
                                data = JSON.parse(raw);
                                if (data && typeof data.items === 'object' && data.vary === this.getVary()) {
                                    this.items = data.items;
                                    return;
                                }
                            } catch (e) {}
                            if (raw === undefined) {
                                this.enabled = !1;
                            }
                        },
                        get: function (module) {
                            var key;
                            if (!this.enabled) {
                                return false;
                            }
                            key = getModuleKey(module);
                            if (key in this.items) {
                                this.stats.hits++;
                                return this.items[key];
                            }
                            this.stats.misses++;
                            return false;
                        },
                        add: function (module) {
                            if (!this.enabled) {
                                return;
                            }
                            this.queue.push(module);
                            this.requestUpdate();
                        },
                        set: function (module) {
                            var key, args, src, encodedScript, descriptor = mw.loader.moduleRegistry[module];
                            key = getModuleKey(module);
                            if (key in this.items || !descriptor || descriptor.state !== 'ready' || !descriptor.version || descriptor.group === 'private' || descriptor.group === 'user' || [descriptor.script, descriptor.style, descriptor.messages, descriptor.templates].indexOf(undefined) !== -1) {
                                return;
                            }
                            try {
                                if (typeof descriptor.script === 'function') {
                                    encodedScript = String(descriptor.script);
                                } else if (typeof descriptor.script === 'object' && descriptor.script && !Array.isArray(descriptor.script)) {
                                    encodedScript = '{' + 'main:' + JSON.stringify(descriptor.script.main) + ',' + 'files:{' + Object.keys(descriptor.script.files).map(function (key) {
                                        var value = descriptor.script.files[key];
                                        return JSON.stringify(key) + ':' + (typeof value === 'function' ? value : JSON.stringify(value));
                                    }).join(',') + '}}';
                                } else {
                                    encodedScript = JSON.stringify(descriptor.script);
                                }
                                args = [JSON.stringify(key), encodedScript, JSON.stringify(descriptor.style), JSON.stringify(descriptor.messages), JSON.stringify(descriptor.templates)];
                            } catch (e) {
                                mw.trackError('resourceloader.exception', {
                                    exception: e,
                                    source: 'store-localstorage-json'
                                });
                                return;
                            }
                            src = 'mw.loader.implement(' + args.join(',') + ');';
                            if (src.length > this.MODULE_SIZE_MAX) {
                                return;
                            }
                            this.items[key] = src;
                        },
                        prune: function () {
                            var key, module;
                            for (key in this.items) {
                                module = key.slice(0, key.indexOf('@'));
                                if (getModuleKey(module) !== key) {
                                    this.stats.expired++;
                                    delete this.items[key];
                                } else if (this.items[key].length > this.MODULE_SIZE_MAX) {
                                    delete this.items[key];
                                }
                            }
                        },
                        clear: function () {
                            this.items = {};
                            try {
                                localStorage.removeItem(this.getStoreKey());
                            } catch (e) {}
                        },
                        requestUpdate: (function () {
                            var hasPendingWrites = !1;

                            function flushWrites() {
                                var data, key;
                                mw.loader.store.prune();
                                while (mw.loader.store.queue.length) {
                                    mw.loader.store.set(mw.loader.store.queue.shift());
                                }
                                key = mw.loader.store.getStoreKey();
                                try {
                                    localStorage.removeItem(key);
                                    data = JSON.stringify(mw.loader.store);
                                    localStorage.setItem(key, data);
                                } catch (e) {
                                    mw.trackError('resourceloader.exception', {
                                        exception: e,
                                        source: 'store-localstorage-update'
                                    });
                                }
                                hasPendingWrites = !1;
                            }

                            function onTimeout() {
                                mw.requestIdleCallback(flushWrites);
                            }
                            return function () {
                                if (!hasPendingWrites) {
                                    hasPendingWrites = !0;
                                    setTimeout(onTimeout, 2000);
                                }
                            };
                        }())
                    }
                };
            }()),
            user: {
                options: new Map(),
                tokens: new Map()
            },
            widgets: {}
        };
        window.mw = window.mediaWiki = mw;
    }());
    (function () {
        var maxBusy = 50;
        mw.requestIdleCallbackInternal = function (callback) {
            setTimeout(function () {
                var start = mw.now();
                callback({
                    didTimeout: !1,
                    timeRemaining: function () {
                        return Math.max(0, maxBusy - (mw.now() - start));
                    }
                });
            }, 1);
        };
        mw.requestIdleCallback = window.requestIdleCallback ? window.requestIdleCallback.bind(window) : mw.requestIdleCallbackInternal;
    }());
    (function () {
        mw.config = new mw.Map(true);
        mw.loader.addSource({
            "local": "/w/load.php",
            "metawiki": "//meta.wikimedia.org/w/load.php"
        });
        mw.loader.register([
            ["site", "0n4hskc", [1]],
            ["site.styles", "0a5cgq6", [], "site"],
            ["noscript", "09sx0ru", [], "noscript"],
            ["filepage", "1yjvhwj"],
            ["user.groups", "07j6l8d", [5]],
            ["user", "0k1cuul", [], "user"],
            [
                "user.styles", "08fimpv", [], "user"
            ],
            ["user.defaults", "1c8eu28"],
            ["user.options", "1cm6q67", [7], "private"],
            ["user.tokens", "0tffind", [], "private"],
            ["mediawiki.skinning.elements", "12ext4y"],
            ["mediawiki.skinning.content", "0qx32ex"],
            ["mediawiki.skinning.interface", "07jwd5s"],
            ["jquery.makeCollapsible.styles", "0p25h4g"],
            ["mediawiki.skinning.content.parsoid", "1ipyzzq"],
            ["mediawiki.skinning.content.externallinks", "12nrpcj"],
            ["jquery", "0gmhg1u"],
            ["mediawiki.base", "11zlll0", [16]],
            ["mediawiki.legacy.wikibits", "05hpy57", [16]],
            ["jquery.accessKeyLabel", "1hapo74", [22, 104]],
            ["jquery.checkboxShiftClick", "0m21x1o"],
            ["jquery.chosen", "11bppto"],
            ["jquery.client", "1nc40rm"],
            ["jquery.color", "0815wm8", [24]],
            ["jquery.colorUtil", "0bi0x56"],
            ["jquery.confirmable", "0sbtt95", [149]],
            ["jquery.cookie", "12o00nd"],
            ["jquery.form", "0aamipo"],
            ["jquery.fullscreen", "00p9phm"],
            ["jquery.getAttrs", "0bcjlvq"],
            ["jquery.highlightText", "0ozekmh", [104]],
            ["jquery.hoverIntent", "0biveym"],
            ["jquery.i18n", "0t8bvxd", [148]],
            [
                "jquery.lengthLimit", "0sji1oy", [105]
            ],
            ["jquery.makeCollapsible", "1o2gri1", [13]],
            ["jquery.mw-jump", "1szw96f"],
            ["jquery.qunit", "11kof1g"],
            ["jquery.spinner", "0bx0qb7"],
            ["jquery.jStorage", "0v6nblq"],
            ["jquery.suggestions", "0hg2hqd", [30]],
            ["jquery.tabIndex", "02mw9ml"],
            ["jquery.tablesorter", "1fsv9he", [42, 104, 150]],
            ["jquery.tablesorter.styles", "0o0q5m0"],
            ["jquery.textSelection", "0jpf5ox", [22]],
            ["jquery.throttle-debounce", "06eecyr"],
            ["jquery.tipsy", "01x01bg"],
            ["jquery.ui.core", "0qx9lar", [47], "jquery.ui"],
            ["jquery.ui.core.styles", "0fari4b", [], "jquery.ui"],
            ["jquery.ui.accordion", "1cc21wd", [46, 65], "jquery.ui"],
            ["jquery.ui.autocomplete", "0qcao9c", [55], "jquery.ui"],
            ["jquery.ui.button", "168uber", [46, 65], "jquery.ui"],
            ["jquery.ui.datepicker", "10ansch", [46], "jquery.ui"],
            ["jquery.ui.dialog", "1j5ceqe", [50, 53, 57, 59], "jquery.ui"],
            ["jquery.ui.draggable", "0g83sq9", [46, 56], "jquery.ui"],
            ["jquery.ui.droppable", "1wgxv2c", [53], "jquery.ui"],
            ["jquery.ui.menu", "1n2r2an", [46, 57, 65], "jquery.ui"],
            ["jquery.ui.mouse",
                "0j7j4vi", [65], "jquery.ui"
            ],
            ["jquery.ui.position", "0c81it6", [], "jquery.ui"],
            ["jquery.ui.progressbar", "1s360q1", [46, 65], "jquery.ui"],
            ["jquery.ui.resizable", "1f75xdc", [46, 56], "jquery.ui"],
            ["jquery.ui.selectable", "1dd2njn", [46, 56], "jquery.ui"],
            ["jquery.ui.slider", "1y6rx93", [46, 56], "jquery.ui"],
            ["jquery.ui.sortable", "0l8yncv", [46, 56], "jquery.ui"],
            ["jquery.ui.tabs", "1xp8rtg", [46, 65], "jquery.ui"],
            ["jquery.ui.tooltip", "0scsytw", [46, 57, 65], "jquery.ui"],
            ["jquery.ui.widget", "0ve45kp", [], "jquery.ui"],
            ["jquery.effects.core", "1ag4q78", [], "jquery.ui"],
            ["jquery.effects.blind", "14vo2cd", [66], "jquery.ui"],
            ["jquery.effects.clip", "1kvdyfi", [66], "jquery.ui"],
            ["jquery.effects.drop", "1xfrk7q", [66], "jquery.ui"],
            ["jquery.effects.highlight", "12rvk8n", [66], "jquery.ui"],
            ["jquery.effects.scale", "1a06vdb", [66], "jquery.ui"],
            ["jquery.effects.shake", "0mc7wls", [66], "jquery.ui"],
            ["moment", "0w58smm", [104, 146]],
            ["mediawiki.apihelp", "1qm36mn"],
            ["mediawiki.template", "0tqh6fm"],
            ["mediawiki.template.mustache", "0kue43n", [75]],
            ["mediawiki.template.regexp", "1ppu9k0", [75]],
            ["mediawiki.apipretty", "0vjfwbh"],
            ["mediawiki.api", "0igiyel", [109, 9]],
            ["mediawiki.content.json", "05zucud"],
            ["mediawiki.confirmCloseWindow", "0u2pg9b"],
            ["mediawiki.debug", "05vwnx7", [242]],
            ["mediawiki.diff.styles", "1mxuj5d"],
            ["mediawiki.feedback", "0alohs1", [98, 250]],
            ["mediawiki.feedlink", "10k9o9x"],
            ["mediawiki.filewarning", "09cu3io", [242, 255]],
            ["mediawiki.ForeignApi", "0451utn", [385]],
            ["mediawiki.ForeignApi.core", "1hj6uoc", [79, 238]],
            ["mediawiki.helplink", "1390usa"],
            ["mediawiki.hlist", "0i5k2dm"],
            ["mediawiki.htmlform", "1uy4sxe", [33, 104]],
            ["mediawiki.htmlform.checker", "03n31dt", [44]],
            ["mediawiki.htmlform.ooui", "0qx7he6", [242]],
            ["mediawiki.htmlform.styles", "00iuug1"],
            ["mediawiki.htmlform.ooui.styles", "1f29ffm"],
            ["mediawiki.icon", "0r30c5u"],
            ["mediawiki.inspect", "0cq1qr4", [104, 105]],
            ["mediawiki.messagePoster", "0l54pox", [87]],
            ["mediawiki.messagePoster.wikitext", "1xodl3v", [98]],
            ["mediawiki.notification", "1bkw1nt", [121, 128]],
            ["mediawiki.notify",
                "08ef6pm"
            ],
            ["mediawiki.notification.convertmessagebox", "1udpxkk", [100]],
            ["mediawiki.notification.convertmessagebox.styles", "0nmyk2k"],
            ["mediawiki.RegExp", "0kzono7"],
            ["mediawiki.String", "0oxp0ra"],
            ["mediawiki.pager.tablePager", "0uckkbp"],
            ["mediawiki.searchSuggest", "1riavd6", [29, 39, 79, 8]],
            ["mediawiki.storage", "15uaf9w"],
            ["mediawiki.Title", "1q0v947", [105, 121]],
            ["mediawiki.Upload", "18yzv3f", [79]],
            ["mediawiki.ForeignUpload", "10u4xxy", [87, 110]],
            ["mediawiki.ForeignStructuredUpload", "14b296j", [111]],
            ["mediawiki.Upload.Dialog", "0f8z5s8", [114]],
            ["mediawiki.Upload.BookletLayout", "13t6kjf", [110, 149, 119, 234, 73, 245, 250, 256, 257]],
            ["mediawiki.ForeignStructuredUpload.BookletLayout", "1cngfc5", [112, 114, 153, 221, 215]],
            ["mediawiki.toc", "08jabqe", [125]],
            ["mediawiki.toc.styles", "039cd0p"],
            ["mediawiki.Uri", "0qzuvgq", [121, 77]],
            ["mediawiki.user", "05zjnmc", [79, 108, 8]],
            ["mediawiki.userSuggest", "0eya1z7", [39, 79]],
            ["mediawiki.util", "18wyz4b", [19]],
            ["mediawiki.viewport", "06gdr2b"],
            ["mediawiki.checkboxtoggle",
                "00w9tlo"
            ],
            ["mediawiki.checkboxtoggle.styles", "1u6gth1"],
            ["mediawiki.cookie", "1wx9shq", [26]],
            ["mediawiki.experiments", "0rgmhag"],
            ["mediawiki.editfont.styles", "04e3p4i"],
            ["mediawiki.visibleTimeout", "0tu6f3n"],
            ["mediawiki.action.delete", "1onm3pb", [33, 242]],
            ["mediawiki.action.delete.file", "0jgvlvv", [33, 242]],
            ["mediawiki.action.edit", "080ptsv", [43, 132, 79, 127, 217]],
            ["mediawiki.action.edit.styles", "1upyuh9"],
            ["mediawiki.action.edit.collapsibleFooter", "01yyz3r", [34, 96, 108]],
            ["mediawiki.action.edit.preview", "0lv5wee", [37, 43, 79, 83, 149, 242]],
            ["mediawiki.action.history", "1xuxpjk", [34]],
            ["mediawiki.action.history.styles", "1rkxsfl"],
            ["mediawiki.action.view.dblClickEdit", "196tfy5", [121, 8]],
            ["mediawiki.action.view.metadata", "0r5mq4u", [145]],
            ["mediawiki.action.view.categoryPage.styles", "15inf8z"],
            ["mediawiki.action.view.postEdit", "19pnblo", [149, 100]],
            ["mediawiki.action.view.redirect", "1dnfl8b", [22]],
            ["mediawiki.action.view.redirectPage", "1umb916"],
            ["mediawiki.action.view.rightClickEdit", "1cy6ddm"],
            [
                "mediawiki.action.edit.editWarning", "1a091b6", [43, 81, 149]
            ],
            ["mediawiki.action.view.filepage", "19ekogg"],
            ["mediawiki.language", "1ovj9z1", [147]],
            ["mediawiki.cldr", "0nvnuvm", [148]],
            ["mediawiki.libs.pluralruleparser", "012f438"],
            ["mediawiki.jqueryMsg", "1okw93q", [146, 121, 8]],
            ["mediawiki.language.months", "0yxwaiy", [146]],
            ["mediawiki.language.names", "1vy8pta", [146]],
            ["mediawiki.language.specialCharacters", "0shr3jw", [146]],
            ["mediawiki.libs.jpegmeta", "0ete22r"],
            ["mediawiki.page.gallery", "0okja0c", [44, 155]],
            ["mediawiki.page.gallery.styles", "1xzwb22"],
            ["mediawiki.page.gallery.slideshow", "12p0r86", [79, 245, 265, 267]],
            ["mediawiki.page.ready", "03zxw3u", [20, 79, 101]],
            ["mediawiki.page.startup", "0xzy2gc"],
            ["mediawiki.page.patrol.ajax", "1ybtcgy", [37, 79, 101]],
            ["mediawiki.page.watch.ajax", "0agiww3", [79, 149, 101]],
            ["mediawiki.page.rollback.confirmation", "09t3arb", [25]],
            ["mediawiki.page.image.pagination", "1odkj3b", [37, 121]],
            ["mediawiki.rcfilters.filters.base.styles", "0ekhjpy"],
            [
                "mediawiki.rcfilters.highlightCircles.seenunseen.styles", "09y3c3p"
            ],
            ["mediawiki.rcfilters.filters.dm", "0xb4lai", [118, 149, 119, 238]],
            ["mediawiki.rcfilters.filters.ui", "0xks517", [34, 165, 212, 259, 261, 262, 263, 265, 266]],
            ["mediawiki.interface.helpers.styles", "0dfcni5"],
            ["mediawiki.special", "0ifx7jx"],
            ["mediawiki.special.apisandbox", "14i9z80", [34, 149, 212, 218, 241, 257, 262]],
            ["mediawiki.special.block", "10v9g30", [91, 215, 229, 222, 230, 227, 257, 259]],
            ["mediawiki.special.changecredentials.js", "0yzqcla", [79, 93]],
            ["mediawiki.special.changeslist", "00028c6"],
            ["mediawiki.special.changeslist.enhanced", "0vvwcca"],
            ["mediawiki.special.changeslist.legend", "1p9x93p"],
            ["mediawiki.special.changeslist.legend.js", "01hofsk", [34, 125]],
            ["mediawiki.special.contributions", "0od634l", [149, 215]],
            ["mediawiki.special.edittags", "1rt40b4", [21, 33]],
            ["mediawiki.special.import", "0ronzv8"],
            ["mediawiki.special.movePage", "0th966g", [212, 217]],
            ["mediawiki.special.pageLanguage", "1ihqoym", [242]],
            ["mediawiki.special.preferences.ooui",
                "1fcjxys", [81, 127, 102, 108, 222]
            ],
            ["mediawiki.special.preferences.styles.ooui", "0xhgbuj"],
            ["mediawiki.special.recentchanges", "057bqh5"],
            ["mediawiki.special.revisionDelete", "0b05u16", [33]],
            ["mediawiki.special.search", "17beam7", [232]],
            ["mediawiki.special.search.commonsInterwikiWidget", "19md91g", [118, 79, 149]],
            ["mediawiki.special.search.interwikiwidget.styles", "0a8v32b"],
            ["mediawiki.special.search.styles", "0d2knpy"],
            ["mediawiki.special.undelete", "086i3sd", [212, 217]],
            ["mediawiki.special.unwatchedPages", "02rhhte", [79, 101]],
            ["mediawiki.special.upload", "0owbdo6", [37, 79, 81, 149, 153, 168, 75]],
            ["mediawiki.special.userlogin.common.styles", "1ks368f"],
            ["mediawiki.special.userlogin.login.styles", "0gmfrzp"],
            ["mediawiki.special.userlogin.signup.js", "1ydgbx4", [79, 92, 149]],
            ["mediawiki.special.userlogin.signup.styles", "0fryw1y"],
            ["mediawiki.special.userrights", "0vj68sh", [33, 102]],
            ["mediawiki.special.watchlist", "0fsfoj0", [79, 149, 101, 242]],
            ["mediawiki.special.version", "1e3nu61"],
            ["mediawiki.legacy.config",
                "1x7x17n"
            ],
            ["mediawiki.legacy.commonPrint", "1m30ohe"],
            ["mediawiki.legacy.protect", "1vp9ay2", [33]],
            ["mediawiki.legacy.shared", "0cs9sjx"],
            ["mediawiki.legacy.oldshared", "156p73k"],
            ["mediawiki.ui", "0zm5yu5"],
            ["mediawiki.ui.checkbox", "16waqko"],
            ["mediawiki.ui.radio", "0oyu6sq"],
            ["mediawiki.ui.anchor", "1z0300h"],
            ["mediawiki.ui.button", "0ojukq1"],
            ["mediawiki.ui.input", "1d9kubl"],
            ["mediawiki.ui.icon", "04f9vqr"],
            ["mediawiki.ui.text", "1qirr5n"],
            ["mediawiki.widgets", "0po1y6h", [79, 101, 213, 245, 256]],
            ["mediawiki.widgets.styles", "04ic2qu"],
            ["mediawiki.widgets.AbandonEditDialog", "1pwfczh", [250]],
            ["mediawiki.widgets.DateInputWidget", "0fl02t7", [216, 73, 245, 267]],
            ["mediawiki.widgets.DateInputWidget.styles", "1vqcuus"],
            ["mediawiki.widgets.visibleLengthLimit", "09ljyc9", [33, 242]],
            ["mediawiki.widgets.datetime", "1m3k5xc", [104, 242, 266, 267]],
            ["mediawiki.widgets.expiry", "0t9hlv6", [218, 73, 245]],
            ["mediawiki.widgets.CheckMatrixWidget", "19j4gxg", [242]],
            ["mediawiki.widgets.CategoryMultiselectWidget", "0vy15uj", [87, 245]],
            ["mediawiki.widgets.SelectWithInputWidget", "1v42u7h", [223, 245]],
            ["mediawiki.widgets.SelectWithInputWidget.styles", "12dt6as"],
            ["mediawiki.widgets.SizeFilterWidget", "0tnihz2", [225, 245]],
            ["mediawiki.widgets.SizeFilterWidget.styles", "05wuevv"],
            ["mediawiki.widgets.MediaSearch", "11x72x4", [87, 245]],
            ["mediawiki.widgets.UserInputWidget", "06rva64", [79, 245]],
            ["mediawiki.widgets.UsersMultiselectWidget", "1xdpsc4", [79, 245]],
            ["mediawiki.widgets.NamespacesMultiselectWidget", "0z6c6d0", [245]],
            ["mediawiki.widgets.TitlesMultiselectWidget", "1vc7c96", [212]],
            ["mediawiki.widgets.TagMultiselectWidget.styles", "1vu4oee"],
            ["mediawiki.widgets.SearchInputWidget", "0x0vjof", [107, 212, 262]],
            ["mediawiki.widgets.SearchInputWidget.styles", "0fkv4nu"],
            ["mediawiki.widgets.StashedFileWidget", "0enae3n", [79, 242]],
            ["easy-deflate.core", "06fkmhu"],
            ["easy-deflate.deflate", "18qu8bw", [235]],
            ["easy-deflate.inflate", "1y4jg3r", [235]],
            ["oojs", "17r0vy2"],
            ["mediawiki.router", "045fw5w", [240]],
            ["oojs-router", "1rw732c", [238]],
            ["oojs-ui",
                "07j6l8d", [248, 245, 250]
            ],
            ["oojs-ui-core", "1gt4gfv", [146, 238, 244, 243, 252, 253]],
            ["oojs-ui-core.styles", "0hl7si5"],
            ["oojs-ui-core.icons", "0de9im9"],
            ["oojs-ui-widgets", "0g098iw", [242, 247]],
            ["oojs-ui-widgets.styles", "0sla9s0"],
            ["oojs-ui-widgets.icons", "0zas5hs"],
            ["oojs-ui-toolbars", "1aabjzg", [242, 249]],
            ["oojs-ui-toolbars.icons", "0huzbuv"],
            ["oojs-ui-windows", "119wt32", [242, 251]],
            ["oojs-ui-windows.icons", "153jgfs"],
            ["oojs-ui.styles.indicators", "1lqb2la"],
            ["oojs-ui.styles.textures", "0ik8xw1"],
            ["oojs-ui.styles.icons-accessibility", "0qme556"],
            ["oojs-ui.styles.icons-alerts", "0tpej96"],
            ["oojs-ui.styles.icons-content", "0v5w1zw"],
            ["oojs-ui.styles.icons-editing-advanced", "02vyjt7"],
            ["oojs-ui.styles.icons-editing-citation", "1a2b9ch"],
            ["oojs-ui.styles.icons-editing-core", "0h34bjn"],
            ["oojs-ui.styles.icons-editing-list", "0i2w018"],
            ["oojs-ui.styles.icons-editing-styling", "069ztii"],
            ["oojs-ui.styles.icons-interactions", "1jmxuym"],
            ["oojs-ui.styles.icons-layout", "19v1qmy"],
            ["oojs-ui.styles.icons-location",
                "05fyqcu"
            ],
            ["oojs-ui.styles.icons-media", "0wodhsk"],
            ["oojs-ui.styles.icons-moderation", "0vkwmnl"],
            ["oojs-ui.styles.icons-movement", "15f2y6i"],
            ["oojs-ui.styles.icons-user", "0i2uvtr"],
            ["oojs-ui.styles.icons-wikimedia", "1r0z1vk"],
            ["skins.vector.styles", "03lkdvs"],
            ["skins.vector.styles.responsive", "19uai05"],
            ["skins.vector.js", "1va25sr", [40, 44]],
            ["skins.monobook.styles", "1cuso9s"],
            ["skins.monobook.responsive", "1uc0f4o"],
            ["skins.monobook.mobile", "076bk3p", [121]],
            ["skins.modern", "03tbnt5"],
            ["skins.cologneblue", "0bxburf"],
            ["skins.timeless", "179fx6w"],
            ["skins.timeless.misc", "0m2xw4u"],
            ["skins.timeless.js", "1pw39ki", [40]],
            ["skins.timeless.mobile", "0d3cjjj"],
            ["ext.timeline.styles", "1fzotet"],
            ["ext.wikihiero", "11mrb9o"],
            ["ext.wikihiero.Special", "1fqutpv", [37, 242]],
            ["ext.wikihiero.visualEditor", "0jh67v8", [508]],
            ["ext.charinsert", "0d5dyei", [43]],
            ["ext.charinsert.styles", "1111tzt"],
            ["ext.cite.styles", "1h7fnty"],
            ["ext.cite.a11y", "1rjl32p"],
            ["ext.cite.ux-enhancements", "1qh8tek"],
            ["ext.cite.style",
                "03vcvp9"
            ],
            ["ext.citeThisPage", "00jpoxj"],
            ["ext.inputBox.styles", "15iisyf"],
            ["ext.inputBox", "02hkw2a", [44]],
            ["ext.pygments", "0gcc6jx"],
            ["ext.flaggedRevs.basic", "1ln7mlx"],
            ["ext.flaggedRevs.advanced", "06fox2k", [19]],
            ["ext.flaggedRevs.review", "131mt2t", [149, 101, 119]],
            ["ext.flaggedRevs.review.styles", "0z19uxf"],
            ["ext.flaggedRevs.icons", "1o6851s"],
            ["ext.categoryTree", "1lwk883", [79]],
            ["ext.categoryTree.styles", "0yd67vv"],
            ["ext.spamBlacklist.visualEditor", "1yuow70"],
            ["mediawiki.api.titleblacklist", "1bfs7sn", [79]],
            ["ext.titleblacklist.visualEditor", "1895m03"],
            ["mw.PopUpMediaTransform", "0z1uwcl", [109, 324, 307]],
            ["mw.PopUpMediaTransform.styles", "0b1w3e6"],
            ["mw.TMHGalleryHook.js", "1j3dxsi"],
            ["ext.tmh.embedPlayerIframe", "1wug44e", [341, 324]],
            ["mw.MediaWikiPlayerSupport", "0qvi6ra", [340, 324]],
            ["mw.MediaWikiPlayer.loader", "0jw9hl9", [342, 357]],
            ["ext.tmh.video-js", "0xlcple"],
            ["ext.tmh.videojs-ogvjs", "042rwdp", [322, 312]],
            ["ext.tmh.videojs-resolution-switcher", "1s4u1ml", [312]],
            ["ext.tmh.mw-info-button",
                "168izpj", [312, 109]
            ],
            ["ext.tmh.player", "1mzwsef", [321, 315, 314]],
            ["ext.tmh.player.styles", "0qhm0fl"],
            ["ext.tmh.thumbnail.styles", "0o7wzuw"],
            ["ext.tmh.transcodetable", "0ia9ml2", [79, 241]],
            ["ext.tmh.TimedTextSelector", "0ugvi00"],
            ["ext.tmh.OgvJsSupport", "1bdkcwr"],
            ["ext.tmh.OgvJs", "1dy0nyp", [321]],
            ["embedPlayerIframeStyle", "1sk2fi1"],
            ["mw.MwEmbedSupport", "05o2lu1", [325, 327, 337, 336, 328]],
            ["Spinner", "1sbnoxq", [121]],
            ["iScroll", "0ir0rjs"],
            ["jquery.loadingSpinner", "188pg4b"],
            ["mw.MwEmbedSupport.style", "0y5tqhk"],
            ["mediawiki.UtilitiesTime", "13npaan"],
            ["mediawiki.client", "0gb0j5c"],
            ["mediawiki.absoluteUrl", "05v5052", [118]],
            ["mw.ajaxProxy", "0ygq26o"],
            ["fullScreenApi", "1r9pf85"],
            ["jquery.embedMenu", "1xnm22b"],
            ["jquery.ui.touchPunch", "1df4yrj", [46, 56]],
            ["jquery.triggerQueueCallback", "167pvcf"],
            ["jquery.mwEmbedUtil", "162zyg8"],
            ["jquery.debouncedresize", "0jlnu52"],
            ["mw.Language.names", "0yjsgg8"],
            ["mw.Api", "06p6228"],
            ["jquery.embedPlayer", "16la9rh"],
            ["mw.EmbedPlayer.loader", "1s5d0zc", [341]],
            [
                "mw.MediaElement", "04eg6bj", [321]
            ],
            ["mw.MediaPlayer", "1xkwfrc"],
            ["mw.MediaPlayers", "0vw8oxj", [344]],
            ["mw.MediaSource", "1lhyip0", [324]],
            ["mw.EmbedTypes", "0fssbxg", [118, 345]],
            ["mw.EmbedPlayer", "1npg3yp", [333, 26, 338, 334, 31, 61, 335, 329, 331, 330, 149, 351, 347, 343, 346]],
            ["mw.EmbedPlayerKplayer", "0tnm63k"],
            ["mw.EmbedPlayerGeneric", "12b5amx"],
            ["mw.EmbedPlayerNative", "1pd8vi0"],
            ["mw.EmbedPlayerVLCApp", "0wwkt1s", [118]],
            ["mw.EmbedPlayerIEWebMPrompt", "0316p9t"],
            ["mw.EmbedPlayerOgvJs", "01ijdjh", [321, 37]],
            ["mw.EmbedPlayerImageOverlay", "00o6a84"],
            ["mw.EmbedPlayerVlc", "0tna0of"],
            ["mw.TimedText.loader", "05p6j6f"],
            ["mw.TimedText", "0zr0f7a", [348, 359]],
            ["mw.TextSource", "1hjbioc", [329, 332]],
            ["ext.urlShortener.special", "0y5ljsn", [118, 93, 212, 241]],
            ["ext.urlShortener.toolbar", "1m6aogz", [79]],
            ["ext.securepoll.htmlform", "1yziwg4"],
            ["ext.securepoll", "05h4ncg"],
            ["ext.score.visualEditor", "069gdbc", [365, 508]],
            ["ext.score.visualEditor.icons", "0hrgowt"],
            ["ext.score.popup", "0h9uyao", [79]],
            ["ext.cirrus.serp", "0tyysx4", [118]],
            ["ext.cirrus.explore-similar", "1nxuzd0", [79, 76]],
            ["ext.nuke.confirm", "1gx74zu", [149]],
            ["ext.confirmEdit.editPreview.ipwhitelist.styles", "0loke3f"],
            ["ext.confirmEdit.visualEditor", "1g3cjgq"],
            ["ext.confirmEdit.simpleCaptcha", "1s1aepv"],
            ["ext.confirmEdit.fancyCaptcha.styles", "1467l1o"],
            ["ext.confirmEdit.fancyCaptcha", "14cu0dr", [79]],
            ["ext.confirmEdit.fancyCaptchaMobile", "14cu0dr", [565]],
            ["ext.centralauth", "1amp06o", [37, 121]],
            ["ext.centralauth.centralautologin", "0cndqrb", [149, 101]],
            ["ext.centralauth.centralautologin.clearcookie", "1ixgi20"],
            ["ext.centralauth.noflash", "1cud6n1"],
            ["ext.centralauth.globaluserautocomplete", "0v2f052", [39, 79]],
            ["ext.centralauth.globalusers", "17g5f1n"],
            ["ext.centralauth.globalgrouppermissions", "14vr42l"],
            ["ext.centralauth.globalrenameuser", "1kdbroi", [121]],
            ["ext.centralauth.globalrenameuser.styles", "1fsrqx0"],
            ["ext.centralauth.ForeignApi", "1344nh3", [88]],
            ["ext.widgets.GlobalUserInputWidget", "10mkktr", [79, 245]],
            ["ext.GlobalUserPage", "1y49yr4"],
            [
                "ext.apifeatureusage", "1aurd32"
            ],
            ["ext.dismissableSiteNotice", "0y84caw", [26, 121]],
            ["ext.dismissableSiteNotice.styles", "1xxj6o7"],
            ["jquery.ui.multiselect", "0qwr195", [54, 62, 149]],
            ["ext.centralNotice.adminUi", "0o9gjji", [51, 391, 118]],
            ["ext.centralNotice.adminUi.campaignPager", "1cwyb0x"],
            ["ext.centralNotice.adminUi.bannerManager", "0d1165f", [392, 52]],
            ["ext.centralNotice.adminUi.bannerEditor", "057g58j", [392, 52, 79]],
            ["ext.centralNotice.adminUi.campaignManager", "0swr0cz", [392, 44, 52, 61, 76, 241]],
            ["ext.centralNotice.startUp", "1j4sd19", [399]],
            ["ext.centralNotice.geoIP", "1rdojjn", [26]],
            ["ext.centralNotice.choiceData", "1a684yv", [403]],
            ["ext.centralNotice.display", "05jppqx", [398, 401, 118]],
            ["ext.centralNotice.kvStore", "0eq7ai7"],
            ["ext.centralNotice.bannerHistoryLogger", "1cy7oy5", [400, 119]],
            ["ext.centralNotice.impressionDiet", "1753l4t", [400]],
            ["ext.centralNotice.largeBannerLimit", "0fybqa8", [400, 125]],
            ["ext.centralNotice.legacySupport", "0wctcxy", [400]],
            ["ext.centralNotice.bannerSequence", "131xgje", [400]],
            ["ext.centralNotice.adminUi.bannerSequence", "1vdd5hw", [396, 266]],
            ["ext.centralNotice.freegeoipLookup", "0orp3pu", [398]],
            ["ext.centralNotice.bannerController", "07j6l8d", [397]],
            ["ext.centralNotice.impressionEventsSampleRate", "1p3o9dw", [400]],
            ["ext.centralNotice.cspViolationAlert", "02ilq26"],
            ["ext.wikimediamessages.contactpage.affcomusergroup", "11s47hr"],
            ["mediawiki.special.block.feedback.request", "16f3699"],
            ["ext.collection", "1bhp2p2", [416, 62, 146]],
            ["ext.collection.bookcreator.styles", "1kp652y"],
            ["ext.collection.bookcreator", "1r3rqtj", [415, 38]],
            ["ext.collection.checkLoadFromLocalStorage", "1toujwt", [414]],
            ["ext.collection.suggest", "1mfr1ds", [416]],
            ["ext.collection.offline", "12w3yu1"],
            ["ext.collection.bookcreator.messageBox", "07j6l8d", [422, 421, 90]],
            ["ext.collection.bookcreator.messageBox.styles", "1xw4dv5"],
            ["ext.collection.bookcreator.messageBox.icons", "1t8k489"],
            ["ext.ElectronPdfService.print.styles", "1oi9lin"],
            ["ext.ElectronPdfService.special.styles", "050udvz"],
            [
                "ext.ElectronPdfService.special.selectionImages", "0902yrg"
            ],
            ["ext.advancedSearch.initialstyles", "02jqo4a"],
            ["ext.advancedSearch.styles", "12jzaf5"],
            ["ext.advancedSearch.searchtoken", "1v7b7kh", [], "private"],
            ["ext.advancedSearch.elements", "04pnr5n", [427, 118, 149, 119, 245, 262, 263]],
            ["ext.advancedSearch.init", "0vxd0ol", [429, 428]],
            ["ext.advancedSearch.SearchFieldUI", "1ydj9hr", [109, 245]],
            ["ext.abuseFilter", "02csl1n"],
            ["ext.abuseFilter.edit", "0bowlag", [37, 43, 79, 81, 245]],
            ["ext.abuseFilter.tools", "1detua3", [37, 79, 101]],
            ["ext.abuseFilter.examine", "1feo95i", [37, 79]],
            ["ext.abuseFilter.ace", "1774c6y", [659]],
            ["ext.abuseFilter.visualEditor", "13k2o29"],
            ["ext.wikiEditor", "1mfn437", [26, 39, 40, 43, 44, 52, 115, 113, 152, 258, 259, 260, 261, 265, 75], "ext.wikiEditor"],
            ["ext.wikiEditor.styles", "19xd3w4", [], "ext.wikiEditor"],
            ["ext.CodeMirror", "19u7pe2", [441, 43, 59, 119, 261]],
            ["ext.CodeMirror.data", "028mklr"],
            ["ext.CodeMirror.lib", "0he9210"],
            ["ext.CodeMirror.mode.mediawiki", "0790de4", [442]],
            ["ext.CodeMirror.lib.mode.css",
                "04btbgn", [442]
            ],
            ["ext.CodeMirror.lib.mode.javascript", "14qodga", [442]],
            ["ext.CodeMirror.lib.mode.xml", "0zcg1yk", [442]],
            ["ext.CodeMirror.lib.mode.htmlmixed", "1si6ffd", [444, 445, 446]],
            ["ext.CodeMirror.lib.mode.clike", "17t96nl", [442]],
            ["ext.CodeMirror.lib.mode.php", "112538x", [448, 447]],
            ["ext.CodeMirror.visualEditor.init", "1wg6hq4"],
            ["ext.CodeMirror.visualEditor", "0u73j6n", [441, 443, 508]],
            ["ext.MassMessage.autocomplete", "0ohn4s9", [49]],
            ["ext.MassMessage.special.js", "0f0v19w", [452, 33, 44, 149]],
            ["ext.MassMessage.special", "0jlyx02"],
            ["ext.MassMessage.content", "1rgmamg"],
            ["ext.MassMessage.content.js", "0ytar0u", [452, 25, 79]],
            ["ext.MassMessage.content.noedit", "0o0107u"],
            ["ext.MassMessage.content.nojs", "0sd5pzt"],
            ["ext.MassMessage.create", "0dtwer1", [452, 93, 149]],
            ["ext.MassMessage.edit", "1js5cfj", [217, 241]],
            ["ext.betaFeatures", "0slnf2z", [22]],
            ["ext.betaFeatures.styles", "1oux37o"],
            ["mmv", "15bvoxf", [23, 28, 44, 45, 118, 149, 468]],
            ["mmv.ui.ondemandshareddependencies", "16we142", [463, 241]],
            [
                "mmv.ui.download.pane", "0rih3jx", [204, 212, 464]
            ],
            ["mmv.ui.reuse.shareembed", "141tyrb", [212, 464]],
            ["mmv.ui.tipsyDialog", "1w4h6dw", [463]],
            ["mmv.bootstrap", "0xflw4t", [101, 208, 210, 470, 240]],
            ["mmv.bootstrap.autostart", "1wzpx89", [468]],
            ["mmv.head", "1kn6yam", [119]],
            ["ext.popups.images", "097rq44"],
            ["ext.popups", "0mpkta5"],
            ["ext.popups.main", "0ahv4bg", [471, 118, 126, 149, 208, 210, 119]],
            ["ext.linter.edit", "04vtgxu", [43]],
            ["socket.io", "0nv0jim"],
            ["dompurify", "1ckbvin"],
            ["color-picker", "1hua6r9"],
            ["unicodejs", "18ozr7w"],
            ["papaparse", "13ih3e7"],
            ["rangefix", "01bu8pa"],
            ["spark-md5", "1icwqfv"],
            ["ext.visualEditor.supportCheck", "1ra37ny"],
            ["ext.visualEditor.sanitize", "08q61wv", [476, 497]],
            ["ext.visualEditor.progressBarWidget", "0bs7eer"],
            ["ext.visualEditor.tempWikitextEditorWidget", "1byhzpj", [127, 119]],
            ["ext.visualEditor.desktopArticleTarget.init", "0ylueir", [484, 482, 485, 496, 26, 43, 118, 158]],
            ["ext.visualEditor.desktopArticleTarget.noscript", "095iz8w"],
            ["ext.visualEditor.targetLoader", "0n033o4", [496, 43, 118, 119]],
            ["ext.visualEditor.desktopTarget", "1u2ut0m"],
            ["ext.visualEditor.desktopArticleTarget", "09b07bc", [500, 505, 489, 510]],
            ["ext.visualEditor.collabTarget", "0dcrqpc", [498, 504, 262, 263]],
            ["ext.visualEditor.collabTarget.desktop", "118q76g", [491, 505, 489, 510]],
            ["ext.visualEditor.collabTarget.init", "1rubg6c", [482, 212, 241]],
            ["ext.visualEditor.collabTarget.init.styles", "12d0edh"],
            ["ext.visualEditor.ve", "0up6ejb"],
            ["ext.visualEditor.track", "0b1o38l", [495]],
            ["ext.visualEditor.base", "1vhf37b", [495, 241, 478]],
            ["ext.visualEditor.mediawiki", "1u1wpo4", [497, 488, 739]],
            ["ext.visualEditor.mwsave", "0milwm0", [508, 33, 262]],
            ["ext.visualEditor.articleTarget", "1m4j1vj", [509, 499, 214]],
            ["ext.visualEditor.data", "192b9pi", [498]],
            ["ext.visualEditor.core", "0bgl8v3", [497, 482, 22, 479, 480, 481]],
            ["ext.visualEditor.commentAnnotation", "0z6fwno", [502]],
            ["ext.visualEditor.rebase", "15uj5uu", [477, 519, 503, 483, 268, 475]],
            ["ext.visualEditor.core.desktop", "1h2ymc0", [502]],
            ["ext.visualEditor.welcome", "02hhw1r", [241]],
            [
                "ext.visualEditor.switching", "1wka6cg", [241, 254, 257, 259]
            ],
            ["ext.visualEditor.mwcore", "09hvogg", [520, 498, 1222, 507, 506, 26, 83, 149, 14, 212]],
            ["ext.visualEditor.mwextensions", "07j6l8d", [501, 531, 524, 526, 511, 528, 513, 525, 514, 516]],
            ["ext.visualEditor.mwextensions.desktop", "07j6l8d", [509, 515, 115]],
            ["ext.visualEditor.mwformatting", "0syovin", [508]],
            ["ext.visualEditor.mwimage.core", "1dvf2o8", [508]],
            ["ext.visualEditor.mwimage", "08g8eg8", [512, 226, 73, 265, 269]],
            ["ext.visualEditor.mwlink", "0ks0agy", [508]],
            ["ext.visualEditor.mwmeta", "1lwn6lp", [514, 142]],
            ["ext.visualEditor.mwtransclusion", "0hutaff", [508, 227]],
            ["treeDiffer", "0mr1wpq"],
            ["diffMatchPatch", "179lnrj"],
            ["ext.visualEditor.checkList", "0ugvjau", [502]],
            ["ext.visualEditor.diffing", "1o3ebvj", [518, 502, 517]],
            ["ext.visualEditor.diffPage.init.styles", "1appxmn"],
            ["ext.visualEditor.diffLoader", "0if5c07", [488]],
            ["ext.visualEditor.diffPage.init", "17cfsi7", [522, 241, 254, 257]],
            ["ext.visualEditor.language", "177oxwe", [502, 739, 151]],
            ["ext.visualEditor.mwlanguage",
                "0gabkur", [502]
            ],
            ["ext.visualEditor.mwalienextension", "0j01wcv", [508]],
            ["ext.visualEditor.mwwikitext", "04rmppl", [514, 127]],
            ["ext.visualEditor.mwgallery", "1bzbghc", [508, 155, 226, 265]],
            ["ext.visualEditor.mwsignature", "042fby7", [516]],
            ["ext.visualEditor.experimental", "07j6l8d"],
            ["ext.visualEditor.icons", "07j6l8d", [532, 533, 255, 256, 257, 259, 260, 261, 262, 263, 266, 267, 268, 252, 253]],
            ["ext.visualEditor.moduleIcons", "0h1ja26"],
            ["ext.visualEditor.moduleIndicators", "0bdok99"],
            ["ext.citoid.visualEditor", "1uyl6ns", [1113, 535]],
            ["ext.citoid.visualEditor.data", "15xlvcz", [498]],
            ["ext.templateData", "0gsonyt"],
            ["ext.templateDataGenerator.editPage", "1rhlu2q"],
            ["ext.templateDataGenerator.editTemplatePage", "0uqbz3t", [540, 79]],
            ["ext.templateDataGenerator.data", "1rb7msv", [238]],
            ["ext.templateDataGenerator.ui", "063stpx", [536, 541, 539, 542, 43, 739, 245, 250, 262, 263]],
            ["ext.templateData.images", "03km54m"],
            ["ext.templateDataGenerator.ui.images", "0l89n5c"],
            ["ext.TemplateWizard", "1g0akjt", [43, 212, 215, 227, 248, 250, 262]],
            [
                "mediawiki.libs.guiders", "0d3kkd0"
            ],
            ["ext.guidedTour.styles", "1al4xqt", [544, 208]],
            ["ext.guidedTour.lib.internal", "1g444y6"],
            ["ext.guidedTour.lib", "1bba2st", [710, 546, 545, 125, 149]],
            ["ext.guidedTour.launcher", "00qlrsu"],
            ["ext.guidedTour", "1sl9bqk", [547]],
            ["ext.guidedTour.tour.firstedit", "14ycj1x", [549]],
            ["ext.guidedTour.tour.test", "1t2iuyv", [549]],
            ["ext.guidedTour.tour.onshow", "1uaeby3", [549]],
            ["ext.guidedTour.tour.uprightdownleft", "07dsn0i", [549]],
            ["mobile.app", "0flzhpc"],
            ["mobile.app.parsoid", "1st20xa"],
            ["mobile.pagelist.styles", "0ydu7v0"],
            ["mobile.pagesummary.styles", "10t40lx"],
            ["mobile.startup.images.variants", "09xa5f0"],
            ["mobile.messageBox.styles", "0np6zzq"],
            ["mobile.userpage.icons", "0w8f6qp"],
            ["mobile.userpage.styles", "1qfr6yj"],
            ["mobile.startup.images", "047to6r"],
            ["mobile.init", "16e90xp", [118, 126, 564, 565]],
            ["mobile.init.icons", "0c4puhy"],
            ["mobile.startup", "0x135o7", [44, 149, 101, 239, 76, 208, 210, 119, 122, 559, 556, 557, 562, 558]],
            ["mobile.editor.overlay", "1w7t6id", [81, 127, 100, 209, 214, 567,
                565, 241, 259
            ]],
            ["mobile.editor.images", "0u7vzrc"],
            ["mobile.talk.overlays", "0f0bfon", [207, 566]],
            ["mobile.mediaViewer", "06td1zf", [565]],
            ["mobile.categories.overlays", "0rg14bi", [566, 262]],
            ["mobile.languages.structured", "0eb1rl9", [565]],
            ["mobile.nearby.images", "0435ylf"],
            ["mobile.special.user.icons", "01h39hv"],
            ["mobile.special.mobileoptions.styles", "0nwc663"],
            ["mobile.special.mobileoptions.scripts", "0k1od1c", [565]],
            ["mobile.special.nearby.styles", "196bd8c"],
            ["mobile.special.userlogin.scripts", "0r31hi5"],
            ["mobile.special.nearby.scripts", "0wd73xa", [118, 572, 576, 565]],
            ["mobile.special.uploads.scripts", "14v96xr", [565]],
            ["mobile.special.mobilediff.images", "1o9z3nx"],
            ["skins.minerva.base.styles", "1gkfz9c"],
            ["skins.minerva.content.styles", "1akeuxq"],
            ["skins.minerva.content.styles.images", "1e1awo8"],
            ["skins.minerva.icons.loggedin", "0k54v3j"],
            ["skins.minerva.amc.styles", "0pqhg32"],
            ["wikimedia.ui", "1st6qmj"],
            ["skins.minerva.icons.images", "0r9wwy8"],
            ["skins.minerva.icons.images.scripts", "07j6l8d", [589,
                591, 592, 590
            ]],
            ["skins.minerva.icons.images.scripts.misc", "1ydsdhc"],
            ["skins.minerva.icons.page.issues.uncolored", "0c1v1f3"],
            ["skins.minerva.icons.page.issues.default.color", "08p12bn"],
            ["skins.minerva.icons.page.issues.medium.color", "1a8q1zh"],
            ["skins.minerva.mainPage.styles", "065e5qo"],
            ["skins.minerva.userpage.icons", "1eibept"],
            ["skins.minerva.userpage.styles", "1rvbuve"],
            ["skins.minerva.mainMenu.icons", "1cc4xu0"],
            ["skins.minerva.mainMenu.styles", "0d0irbo"],
            ["skins.minerva.loggedin.styles", "1pf97vh"],
            ["skins.minerva.scripts", "08i6h0f", [26, 563, 588, 596, 597, 586]],
            ["skins.minerva.notifications.badge", "1rkiclr", [565]],
            ["skins.minerva.notifications", "1azzopi", [207, 600, 599]],
            ["skins.minerva.options.share.icon", "1teed0k"],
            ["skins.minerva.options", "16ji91a", [602, 599]],
            ["skins.minerva.talk", "11esdqi", [599]],
            ["skins.minerva.toggling", "0oaddwy", [599]],
            ["skins.minerva.watchstar", "0vr67yj", [599]],
            ["zerobanner.config.styles", "1fi8o41"],
            ["ext.math.styles", "15krita"],
            ["ext.math.scripts", "1uk5zyq"],
            [
                "ext.math.visualEditor", "1m63otm", [608, 508]
            ],
            ["ext.math.visualEditor.mathSymbolsData", "0ck829m", [610]],
            ["ext.math.visualEditor.mathSymbols", "0timzyu", [611]],
            ["ext.math.visualEditor.chemSymbolsData", "0ar9ku9", [610]],
            ["ext.math.visualEditor.chemSymbols", "12fgj85", [613]],
            ["ext.babel", "019fixp"],
            ["ext.vipsscaler", "042zps1", [617]],
            ["jquery.ucompare", "0n5cf3z"],
            ["ext.interwiki.specialpage", "1g0ze4s"],
            ["ext.echo.logger", "0e3l1i0", [238]],
            ["ext.echo.ui.desktop", "0lfwzsf", [626, 621]],
            ["ext.echo.ui", "0enz0sw", [622, 619, 1226, 627, 149, 101, 245, 255, 256, 262, 266, 267, 268]],
            ["ext.echo.dm", "03vvppj", [625, 73]],
            ["ext.echo.api", "0r84g1i", [87]],
            ["ext.echo.base", "07j6l8d", [619]],
            ["ext.echo.init", "1fylchn", [623, 118]],
            ["ext.echo.styles.badge", "1gw1vkr"],
            ["ext.echo.styles.notifications", "0i2cyvr"],
            ["ext.echo.styles.alert", "15vzabx"],
            ["ext.echo.special", "1d407ce", [630, 621]],
            ["ext.echo.styles.special", "0y0a7z3"],
            ["ext.thanks.images", "1svvik7"],
            ["ext.thanks", "0nuis2b", [26, 79]],
            ["ext.thanks.corethank", "1qjcmmp", [632, 25,
                250
            ]],
            ["ext.thanks.mobilediff", "0n9sllq", [631, 79, 149, 101]],
            ["ext.thanks.jquery.findWithParent", "01jel51"],
            ["ext.thanks.flowthank", "0907bm1", [632, 635, 149, 250]],
            ["ext.flow.contributions", "1d58394"],
            ["ext.flow.contributions.styles", "03so0mh"],
            ["ext.flow.templating", "0da701t", [645, 119, 73]],
            ["ext.flow.mediawiki.ui.text", "195l9uh"],
            ["ext.flow.mediawiki.ui.form", "0ikmkg1"],
            ["ext.flow.styles.base", "0lnosu5"],
            ["ext.flow.board.styles", "1hv9gnx"],
            ["ext.flow.board.topic.styles", "13i30a8"],
            ["mediawiki.template.handlebars", "03kq05b", [75]],
            ["ext.flow.components", "1afoqau", [654, 639, 44, 118, 101, 238]],
            ["ext.flow.dm", "18wrdff", [79, 238]],
            ["ext.flow.ui", "1f5djfs", [647, 482, 127, 119, 241, 257, 268]],
            ["ext.flow", "19lugqy", [646, 653, 648, 149]],
            ["ext.flow.visualEditor", "0rxyo9q", [651, 505, 489, 510, 527]],
            ["ext.flow.visualEditor.icons", "18j0t0b"],
            ["mediawiki.messagePoster.flow-board", "0cb6g73", [98]],
            ["ext.flow.jquery.conditionalScroll", "0odyk5u"],
            ["ext.flow.jquery.findWithParent", "1f1om0c"],
            [
                "ext.disambiguator.visualEditor", "04jssx3", [515]
            ],
            ["ext.codeEditor", "1lfdbid", [657], "ext.wikiEditor"],
            ["jquery.codeEditor", "0n0pfw2", [659, 658, 438, 125], "ext.wikiEditor"],
            ["ext.codeEditor.icons", "11zck71"],
            ["ext.codeEditor.ace", "0dx2f4j", [], "ext.codeEditor.ace"],
            ["ext.codeEditor.ace.modes", "1fmy9rw", [659], "ext.codeEditor.ace"],
            ["ext.scribunto.errors", "0uwsjnd", [52]],
            ["ext.scribunto.logs", "1md8iza"],
            ["ext.scribunto.edit", "0yz3xq0", [37, 79]],
            ["ext.guidedTour.tour.gettingstartedtasktoolbar", "0hpcbmc", [669, 549]],
            ["ext.gettingstarted.lightbulb.postEdit", "1dowpoh", [670, 668]],
            ["ext.gettingstarted.lightbulb.personalTools", "1wha2rd"],
            ["ext.gettingstarted.lightbulb.flyout", "1ampx2w", [670, 668, 545]],
            ["ext.gettingstarted.lightbulb.common", "04xrdzp", [710, 669, 73]],
            ["ext.gettingstarted.logging", "0zupwb2", [26, 140, 119]],
            ["ext.gettingstarted.api", "1jpphw8", [79]],
            ["ext.gettingstarted.taskToolbar", "1oelxhx", [670, 669, 547]],
            ["ext.gettingstarted.return", "1rswlcg", [670, 669, 547, 118]],
            ["ext.relatedArticles.cards",
                "03srtde", [674, 121, 238]
            ],
            ["ext.relatedArticles.lib", "0qgn19e"],
            ["ext.relatedArticles.readMore.gateway", "1fweshi", [238]],
            ["ext.relatedArticles.readMore.bootstrap", "01xk1wm", [675, 44, 118, 126, 119, 122]],
            ["ext.relatedArticles.readMore", "1gzobke", [121]],
            ["ext.RevisionSlider.lazyCss", "0jobzq6"],
            ["ext.RevisionSlider.lazyJs", "0dx6uof", [684, 267]],
            ["ext.RevisionSlider.init", "1rhqg8v", [683, 692, 684, 689, 149, 266]],
            ["ext.RevisionSlider.noscript", "0lxnpeq"],
            ["ext.RevisionSlider.util", "1nasf6q"],
            ["ext.RevisionSlider.Api", "05fqgds"],
            ["ext.RevisionSlider.Settings", "0u3ob5r", [125, 119]],
            ["ext.RevisionSlider.Revision", "1iz5nl2", [73]],
            ["ext.RevisionSlider.Pointer", "1ed41sa", [688, 687]],
            ["ext.RevisionSlider.PointerView", "1skxcp0"],
            ["ext.RevisionSlider.PointerLine", "0bia6ag"],
            ["ext.RevisionSlider.Slider", "028fh6f", [690]],
            ["ext.RevisionSlider.SliderView", "0w6mcdr", [691, 694, 686, 682, 53, 267]],
            ["ext.RevisionSlider.DiffPage", "08hhxk1", [118]],
            ["ext.RevisionSlider.RevisionList", "0sw867c", [685, 693]],
            [
                "ext.RevisionSlider.RevisionListView", "0mhyz69", [121, 241]
            ],
            ["ext.RevisionSlider.HelpDialog", "14cwmy8", [695, 241, 262]],
            ["ext.RevisionSlider.dialogImages", "1s1mdf9"],
            ["ext.TwoColConflict.InlineCss", "0omerqs"],
            ["ext.TwoColConflict.Inline.initJs", "1lncjc6", [700, 701, 698]],
            ["ext.TwoColConflict.Settings", "0a11c78", [125, 119]],
            ["ext.TwoColConflict.Inline.filterOptionsJs", "17gyamo", [700, 241]],
            ["ext.TwoColConflict.Inline.AutoScroll", "1op7es2"],
            ["ext.TwoColConflict.Inline.HelpDialog", "1q9lyhy", [703, 241, 262]],
            ["ext.TwoColConflict.Inline.HelpDialogCss", "0bqmuym"],
            ["ext.TwoColConflict.Inline.HelpDialogImages", "0m1eg6n"],
            ["ext.TwoColConflict.SpecialConflictTestPageCss", "0o0bywr"],
            ["ext.TwoColConflict.SplitJs", "10qvpo1", [709, 708]],
            ["ext.TwoColConflict.SplitCss", "0isfbnt"],
            ["ext.TwoColConflict.Split.TourImages", "0vzxe2h"],
            ["ext.TwoColConflict.Split.Tour", "1js2lkn", [698, 707, 241, 262]],
            ["ext.TwoColConflict.Split.Merger", "0y27d6z"],
            ["ext.eventLogging", "02jxhrw", [119]],
            ["ext.eventLogging.debug", "1m9y9el"],
            [
                "ext.eventLogging.jsonSchema", "090skt6"
            ],
            ["ext.eventLogging.jsonSchema.styles", "1b0fi5r"],
            ["ext.wikimediaEvents", "07jh729", [710, 118, 126]],
            ["ext.wikimediaEvents.loggedin", "1og6bn0", [118, 119]],
            ["ext.wikimediaEvents.wikibase", "0pgbmvr"],
            ["ext.navigationTiming", "0h3dndb", [710, 26]],
            ["ext.navigationTiming.rumSpeedIndex", "07tpatv"],
            ["ext.uls.common", "1mk8hid", [739, 125, 119]],
            ["ext.uls.compactlinks", "1325w6n", [724, 149, 208]],
            ["ext.uls.geoclient", "1j666c5", [125]],
            ["ext.uls.i18n", "16vhe8z", [32, 121]],
            ["ext.uls.ime", "1r3w0k4", [730, 1231, 737, 101]],
            ["ext.uls.init", "07j6l8d", [719]],
            ["ext.uls.inputsettings", "16nupor", [723, 729, 206]],
            ["ext.uls.interface", "0kpetlm", [734, 149]],
            ["ext.uls.interlanguage", "1f5yooe"],
            ["ext.uls.languagenames", "11rvp3a"],
            ["ext.uls.languagesettings", "1junyrw", [731, 1231, 740, 208]],
            ["ext.uls.mediawiki", "07qofw8", [719, 728, 731, 738]],
            ["ext.uls.messages", "1w6oue8", [722]],
            ["ext.uls.preferencespage", "1fgyyft"],
            ["ext.uls.pt", "18ceely"],
            ["ext.uls.webfonts", "16mv5uz", [719, 1231]],
            [
                "ext.uls.webfonts.fonts", "07j6l8d", [736, 741]
            ],
            ["ext.uls.webfonts.repository", "1asfc8z"],
            ["jquery.ime", "08011q7"],
            ["jquery.uls", "07ygtyr", [32, 739, 740]],
            ["jquery.uls.data", "0008lys"],
            ["jquery.uls.grid", "1hn4j7e"],
            ["jquery.webfonts", "0ofxjie"],
            ["rangy.core", "1y772rp"],
            ["ext.cx.contributions", "0jmmxu6", [121, 242, 256, 257]],
            ["ext.cx.model", "0vh0rme"],
            ["ext.cx.feedback", "113a5ct", [744]],
            ["ext.cx.dashboard", "0lkz9rx", [745, 799, 752, 787, 826, 829, 265]],
            ["ext.cx.util", "1jae4wi", [744]],
            ["mw.cx.util", "1dfxv23", [744, 119]],
            ["ext.cx.util.selection", "1x88t94", [744]],
            ["ext.cx.sitemapper", "14hdyxs", [744, 87, 118, 125, 119]],
            ["ext.cx.source", "0mt1wet", [747, 797, 739, 118, 149, 14, 119]],
            ["mw.cx.SourcePageSelector", "1tkw1rs", [753, 851]],
            ["ext.cx.SelectedSourcePage", "1jkvrpy", [795, 39, 754, 257]],
            ["mw.cx.ui.LanguageFilter", "0lt7q6b", [730, 149, 208, 805, 748, 262]],
            ["ext.cx.translation", "1vcjgu5", [795, 756, 749, 739]],
            ["ext.cx.translation.progress", "1n0usfe", [747]],
            ["ext.cx.tools.manager", "1o6gctb"],
            ["ext.cx.tools", "02mawcr", [745, 776, 775, 764, 763, 773, 772, 760, 765, 762, 767, 761, 774, 768, 769, 770, 771, 749, 797]],
            ["ext.cx.tools.card", "07evpve"],
            ["ext.cx.tools.instructions", "1ckwle2", [759, 757, 149]],
            ["ext.cx.tools.mtabuse", "1uio03j", [744, 759, 757]],
            ["ext.cx.tools.linter", "09drmap", [759, 757]],
            ["ext.cx.tools.formatter", "0hgw3if", [759, 757]],
            ["ext.cx.tools.dictionary", "0omprsy", [759, 757]],
            ["ext.cx.tools.link", "0wk2fs2", [759, 757, 739, 79]],
            ["ext.cx.tools.mt", "09rxmgh", [747, 108]],
            ["ext.cx.tools.mt.card", "15qjf1y", [759, 757, 766]],
            ["ext.cx.tools.reference", "0zgfhmj", [759, 757, 747]],
            ["ext.cx.tools.template", "1j7m0io", [744, 104, 245]],
            ["ext.cx.tools.template.card", "15hf36r", [759, 757, 747]],
            ["ext.cx.tools.template.editor", "1pc5b0b", [747, 796, 847]],
            ["ext.cx.tools.images", "19a9mjp"],
            ["ext.cx.tools.gallery", "0ke7yj1"],
            ["ext.cx.tools.poem", "12f2czc"],
            ["ext.cx.tools.categories", "1hfmgze", [750]],
            ["ext.cx.progressbar", "191hie5", [149]],
            ["ext.cx.translation.loader", "1qclhnf", [744, 119]],
            ["ext.cx.translation.storage", "0gl9b6r", [236, 79]],
            ["ext.cx.publish",
                "178btka", [236, 781, 795]
            ],
            ["ext.cx.wikibase.link", "0mbx4ss"],
            ["ext.cx.publish.dialog", "1qqsmzx", [750, 149]],
            ["ext.cx.eventlogging.campaigns", "1u5atpi", [119]],
            ["ext.cx.eventlogging.translation", "1bujxc2", [748]],
            ["ext.cx.eventlogging.dashboard", "05gb4x6", [119]],
            ["ext.cx.interlanguagelink.init", "1o1uvj3", [724]],
            ["ext.cx.interlanguagelink", "1rieict", [750, 747, 724, 149, 245, 262]],
            ["mw.cx.dashboard.lists", "0zqbs7r", [776, 747, 797, 212, 73, 754, 259, 266]],
            ["ext.cx.translation.conflict", "1l0s8gj", [149]],
            ["ext.cx.stats", "0nafpl8", [790, 750, 747, 798, 797, 739, 149, 73, 826]],
            ["chart.js", "0qv3qaj"],
            ["ext.cx.entrypoints.newarticle", "1m75jr5", [798, 208, 121]],
            ["ext.cx.entrypoints.newarticle.veloader", "0mq8a0z"],
            ["ext.cx.betafeature.init", "0fdaswm"],
            ["ext.cx.entrypoints.contributionsmenu", "0euktiw", [798, 118, 149, 208]],
            ["ext.cx.tools.validator", "0nqa1yg", [750]],
            ["ext.cx.widgets.overlay", "0verknp", [744]],
            ["ext.cx.widgets.spinner", "1s3ovzy", [744]],
            ["ext.cx.widgets.callout", "0kpx6w0"],
            ["ext.cx.widgets.translator", "005qj1q",
                [744, 79, 146]
            ],
            ["mw.cx.dm", "0k2o3pr", [744, 238]],
            ["mw.cx.dm.Translation", "0pukxeg", [800]],
            ["mw.cx.dm.WikiPage", "1orhwvw", [739, 800]],
            ["mw.cx.dm.TranslationIssue", "1xupuc7", [800]],
            ["mw.cx.dm.PageTitleModel", "12viqy0", [814]],
            ["mw.cx.ui", "03yyj6l", [744, 241]],
            ["mw.cx.visualEditor", "07j6l8d", [811, 810, 809, 808, 812, 807]],
            ["mw.cx.visualEditor.sentence", "0068bap", [815]],
            ["mw.cx.visualEditor.publishSettings", "0go8hax", [502]],
            ["mw.cx.visualEditor.mt", "05ayu3d", [815]],
            ["mw.cx.visualEditor.link", "04fhe6z", [815]],
            ["mw.cx.visualEditor.content", "1uvcnvf", [815]],
            ["mw.cx.visualEditor.section", "1vkk8hq", [815, 813, 814]],
            ["ve.ce.CXLintableNode", "1gdbpxo", [502]],
            ["ve.dm.CXLintableNode", "19xf3vo", [502, 803]],
            ["mw.cx.visualEditor.base", "0nlm2n4", [505, 489, 510]],
            ["mw.cx.init", "0v57p5o", [819, 818, 802, 817]],
            ["mw.cx.init.Translation", "1fxdkzi", [236, 836, 821, 820]],
            ["mw.cx.MwApiRequestManager", "1r08i3r", [820]],
            ["mw.cx.MachineTranslation", "0m2blro", [744, 108]],
            ["ve.init.mw.CXTarget", "00cnt4v", [750, 747, 801, 839, 748, 823, 822]],
            [
                "mw.cx.ui.TranslationView", "0d0yvmz", [750, 797, 804, 841, 826, 829, 848]
            ],
            ["ve.ui.CXSurface", "1s2031f", [505]],
            ["ve.ui.CXDesktopContext", "1z13y80", [505]],
            ["mw.cx.ui.TranslationView.legacy", "1sl06iu", [750, 747, 830, 827, 849]],
            ["mw.cx.init.legacy", "0zj6rht", [824]],
            ["mw.cx.ui.Header", "04p5nko", [852, 268, 269]],
            ["mw.cx.ui.Header.legacy", "0wm536k", [829, 852, 268, 269]],
            ["mw.cx.ui.Header.skin", "1w61nm3"],
            ["mw.cx.ui.Infobar", "10p45z3", [850, 748]],
            ["mw.cx.ui.Columns.legacy", "0g80ejc", [831, 833, 832]],
            ["mw.cx.ui.SourceColumn.legacy", "1tjtl4a", [797, 805]],
            ["mw.cx.ui.TranslationColumn.legacy", "14pdtrx", [797, 805]],
            ["mw.cx.ui.ToolsColumn.legacy", "1x8rgqe", [805]],
            ["mw.cx.ui.CategoryMultiselectWidget", "0qhp2tv", [515, 805]],
            ["mw.cx.ui.TranslationIssueWidget", "1l9y1hm", [805]],
            ["mw.cx.ui.Categories", "16etbmc", [801, 834]],
            ["mw.cx.ui.CaptchaDialog", "0zdne44", [1232, 805]],
            ["mw.cx.ui.LoginDialog", "1j0vq2t", [121, 805]],
            ["mw.cx.tools.TranslationToolFactory", "1vnvylp", [805]],
            ["mw.cx.tools", "07j6l8d", [844, 843, 842]],
            [
                "mw.cx.tools.IssueTrackingTool", "08ibpcl", [845, 835]
            ],
            ["mw.cx.tools.TemplateTool", "09ci6lz", [845]],
            ["mw.cx.tools.SearchTool", "0qdplql", [845]],
            ["mw.cx.tools.InstructionsTool", "0rf6ww8", [149, 845]],
            ["mw.cx.tools.TranslationTool", "01aigt3", [846]],
            ["mw.cx.ui.TranslationToolWidget", "1o6juy7", [805]],
            ["mw.cx.widgets.TemplateParamOptionWidget", "1vi1sv5", [805]],
            ["mw.cx.ui.PageTitleWidget", "1g9o1ml", [805, 748, 813]],
            ["mw.cx.ui.PublishSettingsWidget", "0ju5kuw", [805, 262]],
            ["mw.cx.ui.MessageWidget", "0p4fh0t", [805, 255, 262]],
            ["mw.cx.ui.PageSelectorWidget", "1i2lw98", [750, 739, 853, 262]],
            ["mw.cx.ui.PersonalMenuWidget", "0u7wy82", [119, 212, 805]],
            ["mw.cx.ui.TitleOptionWidget", "17o8rdg", [212, 805]],
            ["mw.externalguidance.init", "0kgags6", [118]],
            ["mw.externalguidance", "03oea0d", [87, 565, 856, 259]],
            ["mw.externalguidance.icons", "0g4hd3r"],
            ["mw.externalguidance.special", "1pdvdo7", [739, 87, 206, 565, 856]],
            ["ext.wikimediaBadges", "095wjwn"],
            ["ext.TemplateSandbox.top", "0lx83kp"],
            ["ext.TemplateSandbox", "0knytl8", [859]],
            [
                "ext.jsonConfig", "0v8xwbw"
            ],
            ["ext.graph.styles", "1civrba"],
            ["ext.graph.data", "1cj2mqm"],
            ["ext.graph.loader", "0nwfgvy", [79]],
            ["ext.graph.vega1", "1jldn5h", [863, 118]],
            ["ext.graph.vega2", "0le004j", [863, 118]],
            ["ext.graph.sandbox", "02xbyz3", [656, 866, 81]],
            ["ext.graph.visualEditor", "0c3x3ky", [863, 512]],
            ["ext.MWOAuth.BasicStyles", "17md9qs"],
            ["ext.MWOAuth.AuthorizeForm", "0ed1zwc"],
            ["ext.MWOAuth.AuthorizeDialog", "16rds1o", [52]],
            ["ext.oath.totp.showqrcode", "0np2c1o"],
            ["ext.oath.totp.showqrcode.styles", "1i31rno"],
            ["ext.ores.highlighter", "1bax9ym"],
            ["ext.ores.styles", "0ml3tq9"],
            ["ext.ores.specialoresmodels.styles", "1r90z9w"],
            ["ext.ores.api", "0jfus5m"],
            ["ext.checkUser", "0yaon1r", [121]],
            ["ext.checkUser.caMultiLock", "0omqouh", [121]],
            ["ext.quicksurveys.views", "0cxi2bp", [881, 118, 245]],
            ["ext.quicksurveys.lib", "0ilwd06", [125, 126, 119, 122]],
            ["ext.quicksurveys.init", "15lvfar", [881]],
            ["ext.kartographer", "1dc4652"],
            ["ext.kartographer.extlinks", "17eftrk"],
            ["ext.kartographer.style", "0n21ruy"],
            [
                "ext.kartographer.site", "1jxypm8"
            ],
            ["mapbox", "1t6h1yg"],
            ["leaflet.draw", "10qw2rl", [887]],
            ["ext.kartographer.link", "1nytjk7", [891, 239]],
            ["ext.kartographer.box", "115e9zc", [892, 904, 895, 886, 885, 896, 44, 118, 79, 265]],
            ["ext.kartographer.linkbox", "0634jgx", [896]],
            ["ext.kartographer.data", "0z8ps97"],
            ["ext.kartographer.dialog", "0krtdd9", [239, 250, 256]],
            ["ext.kartographer.dialog.sidebar", "0cksoo3", [884, 262, 267]],
            ["ext.kartographer.settings", "1tf29um", [883, 887]],
            ["ext.kartographer.util", "1e3wcps", [883]],
            ["ext.kartographer.frame", "15lqu2r", [890, 239]],
            ["ext.kartographer.staticframe", "1invndh", [891, 239, 265]],
            ["ext.kartographer.preview", "1khl8of"],
            ["ext.kartographer.editing", "1hmhsxf", [79]],
            ["ext.kartographer.editor", "07j6l8d", [890, 888]],
            ["ext.kartographer.visualEditor", "06sfy3e", [896, 508, 44, 264]],
            ["ext.kartographer.lib.prunecluster", "0tqfpwn", [887]],
            ["ext.kartographer.lib.topojson", "1j7k7hu", [887]],
            ["ext.kartographer.wv", "1ltqp2r", [903, 259]],
            ["ext.kartographer.specialMap", "028zaua"],
            ["ext.pageviewinfo", "0gu5v3p", [866, 241]],
            ["three.js", "1robr4b"],
            ["ext.3d", "0g5plve", [37]],
            ["ext.3d.styles", "1jeu1fq"],
            ["mmv.3d", "1f7v0ta", [909, 463, 908]],
            ["mmv.3d.head", "0lijd83", [909, 242, 254]],
            ["ext.3d.special.upload", "1x9lrec", [914, 191]],
            ["ext.3d.special.upload.styles", "11hw0fx"],
            ["ext.GlobalPreferences.global", "0g8ijhj", [212, 220, 228]],
            ["ext.GlobalPreferences.global-nojs", "0ymd5ai"],
            ["ext.GlobalPreferences.local", "1dcqsv8", [220]],
            ["ext.GlobalPreferences.local-nojs", "0d5p1lr"],
            ["wikibase.client.getMwApiForRepo", "1atj1v9", [930, 1027]],
            ["wikibase.client.init", "1k0gozq"],
            ["wikibase.client.data-bridge.init", "1iku0ak"],
            ["wikibase.client.currentSite", "1owfkh9"],
            ["wikibase.client.page-move", "1hxkx0q"],
            ["wikibase.client.changeslist.css", "0tuo5p8"],
            ["wikibase.client.linkitem.init", "1x2dfab", [37, 101]],
            ["wikibase.client.PageConnector", "1e9j99u", [933]],
            ["jquery.wikibase.linkitem", "00p0w0j", [37, 52, 936, 937, 149, 1029, 1030, 926, 922]],
            ["wikibase.client.action.edit.collapsibleFooter", "07en7qb", [34, 96, 108]],
            [
                "mw.config.values.wbSiteDetails", "0s5v6x7"
            ],
            ["mw.config.values.wbRepo", "1vusrwy"],
            ["wikibase", "0z5mytf"],
            ["wikibase.buildErrorOutput", "0q33lzh", [931]],
            ["wikibase.sites", "08c9mxn", [929, 1233]],
            ["wikibase.RepoApi", "1aaoyv7", [931, 1029]],
            ["wikibase.RepoApiError", "0o2mh6m", [931, 1030]],
            ["jquery.wikibase.siteselector", "1jwlgv4", [1036, 1041, 1050]],
            ["jquery.wikibase.wbtooltip", "1w4za80", [45, 65, 932]],
            ["wikibase.datamodel", "07j6l8d", [943, 947, 952, 953, 954, 955]],
            ["wikibase.datamodel.__namespace", "0cvu8cr", [931]],
            ["wikibase.datamodel.Claim", "0znayuw", [961]],
            ["wikibase.datamodel.Entity", "1cdsnav", [970, 939]],
            ["wikibase.datamodel.FingerprintableEntity", "1of6k11", [941]],
            ["wikibase.datamodel.EntityId", "0ts9q35", [972, 939]],
            ["wikibase.datamodel.Fingerprint", "0pb35ok", [951, 967]],
            ["wikibase.datamodel.Group", "0odbhph", [939]],
            ["wikibase.datamodel.GroupableCollection", "07ks5eq", [970, 939]],
            ["wikibase.datamodel.Item", "05r8rd9", [944, 942, 959, 964]],
            ["wikibase.datamodel.List", "15dq64o", [946]],
            ["wikibase.datamodel.Map",
                "0fxneke", [939]
            ],
            ["wikibase.datamodel.MultiTerm", "0urkj1v", [939]],
            ["wikibase.datamodel.MultiTermMap", "0wpswuc", [970, 949, 950]],
            ["wikibase.datamodel.Property", "1k5pls5", [944, 942, 964]],
            ["wikibase.datamodel.PropertyNoValueSnak", "0c7fuxz", [970, 960]],
            ["wikibase.datamodel.PropertySomeValueSnak", "0i6o7se", [970, 960]],
            ["wikibase.datamodel.PropertyValueSnak", "0v9cilk", [972, 960]],
            ["wikibase.datamodel.Reference", "1ua0183", [961]],
            ["wikibase.datamodel.ReferenceList", "08w3tzn", [956]],
            ["wikibase.datamodel.SiteLink", "19gn8h9", [939]],
            ["wikibase.datamodel.SiteLinkSet", "1r2t8r2", [968, 958]],
            ["wikibase.datamodel.Snak", "0p6e90i", [939]],
            ["wikibase.datamodel.SnakList", "1lps7lh", [948, 960]],
            ["wikibase.datamodel.Statement", "1vgv9ed", [940, 957]],
            ["wikibase.datamodel.StatementGroup", "0w4pmu2", [945, 965]],
            ["wikibase.datamodel.StatementGroupSet", "1wdvmtu", [968, 963]],
            ["wikibase.datamodel.StatementList", "1izpnz2", [962]],
            ["wikibase.datamodel.Term", "1nvuh5b", [939]],
            ["wikibase.datamodel.TermMap", "13fqn2d", [970, 949, 966]],
            [
                "wikibase.datamodel.Set", "0q2zahe", [946]
            ],
            ["globeCoordinate.js", "1lya63y"],
            ["util.inherit", "1rawg4h"],
            ["dataValues", "0aykn96"],
            ["dataValues.DataValue", "0hf8qzu", [971, 970]],
            ["dataValues.values", "1xp0rsm", [974, 969]],
            ["dataValues.TimeValue", "10yqwop", [972]],
            ["valueFormatters", "02bw0u5"],
            ["valueFormatters.ValueFormatter", "0buzsab", [970, 975]],
            ["valueParsers", "0zd1lpq"],
            ["valueParsers.ValueParserStore", "0kgiecz", [977]],
            ["valueParsers.parsers", "06rduk9", [973, 977]],
            ["wikibase.serialization", "07j6l8d", [982, 983]],
            ["wikibase.serialization.__namespace", "06q4u2x", [931]],
            ["wikibase.serialization.DeserializerFactory", "0j0z39k", [987]],
            ["wikibase.serialization.SerializerFactory", "1md7m8n", [1006]],
            ["wikibase.serialization.StrategyProvider", "107qmpf", [981]],
            ["wikibase.serialization.ClaimDeserializer", "1ws44lm", [940, 997]],
            ["wikibase.serialization.Deserializer", "1pu2axt", [970, 981]],
            ["wikibase.serialization.EntityDeserializer", "1xeiwvn", [989, 992, 984]],
            ["wikibase.serialization.FingerprintDeserializer",
                "1k52ru7", [944, 991, 1004]
            ],
            ["wikibase.serialization.ItemDeserializer", "0ov0tyn", [947, 988, 995, 999]],
            ["wikibase.serialization.MultiTermDeserializer", "037ka3n", [950, 986]],
            ["wikibase.serialization.MultiTermMapDeserializer", "14ri3zv", [951, 990]],
            ["wikibase.serialization.PropertyDeserializer", "1etw6cw", [952, 988, 999]],
            ["wikibase.serialization.ReferenceListDeserializer", "0kfvjwv", [957, 994]],
            ["wikibase.serialization.ReferenceDeserializer", "1xz2hzv", [956, 997]],
            ["wikibase.serialization.SiteLinkSetDeserializer", "1pbyaug", [959, 996]],
            ["wikibase.serialization.SiteLinkDeserializer", "0zieitl", [958, 986]],
            ["wikibase.serialization.SnakListDeserializer", "1wweikf", [961, 998]],
            ["wikibase.serialization.SnakDeserializer", "098c6sk", [973, 953, 954, 955, 986]],
            ["wikibase.serialization.StatementGroupSetDeserializer", "1y1bc1j", [964, 1000]],
            ["wikibase.serialization.StatementGroupDeserializer", "0js33rg", [963, 1001]],
            ["wikibase.serialization.StatementListDeserializer", "1yrguru", [965, 1002]],
            [
                "wikibase.serialization.StatementDeserializer", "1l7u9yb", [962, 985, 993]
            ],
            ["wikibase.serialization.TermDeserializer", "17xelz0", [966, 986]],
            ["wikibase.serialization.TermMapDeserializer", "1grgm3h", [967, 1003]],
            ["wikibase.serialization.ClaimSerializer", "0i53bho", [940, 1017]],
            ["wikibase.serialization.EntitySerializer", "0u5sveu", [952, 1008, 1011, 984]],
            ["wikibase.serialization.FingerprintSerializer", "16g7ywk", [944, 1009, 1023]],
            ["wikibase.serialization.ItemSerializer", "0fz6yu2", [947, 1007, 1016, 1020]],
            ["wikibase.serialization.MultiTermMapSerializer", "08u4yw5", [951, 1010]],
            ["wikibase.serialization.MultiTermSerializer", "1k1l503", [950, 1014]],
            ["wikibase.serialization.PropertySerializer", "1jd8kqj", [947, 1007, 1020]],
            ["wikibase.serialization.ReferenceListSerializer", "1618kqh", [957, 1013]],
            ["wikibase.serialization.ReferenceSerializer", "0b3t0bh", [956, 1017]],
            ["wikibase.serialization.Serializer", "0q2ekep", [970, 981]],
            ["wikibase.serialization.SiteLinkSerializer", "1yyr23a", [958, 1014]],
            [
                "wikibase.serialization.SiteLinkSetSerializer", "12s4lzy", [959, 1015]
            ],
            ["wikibase.serialization.SnakListSerializer", "1cpgssg", [961, 1018]],
            ["wikibase.serialization.SnakSerializer", "03jwb9w", [955, 1014]],
            ["wikibase.serialization.StatementGroupSerializer", "1rqfqx8", [963, 1021]],
            ["wikibase.serialization.StatementGroupSetSerializer", "1vy7eoe", [964, 1019]],
            ["wikibase.serialization.StatementListSerializer", "0uepyo2", [965, 1022]],
            ["wikibase.serialization.StatementSerializer", "1ehlhc5", [962, 1005, 1012]],
            ["wikibase.serialization.TermMapSerializer", "05lo7uc", [967, 1024]],
            ["wikibase.serialization.TermSerializer", "097ufe4", [966, 1014]],
            ["wikibase.api.__namespace", "1sf6dlj"],
            ["wikibase.api.FormatValueCaller", "0c5rxch", [972, 1030]],
            ["wikibase.api.getLocationAgnosticMwApi", "1kc0vtc", [87, 1025]],
            ["wikibase.api.ParseValueCaller", "1o06t0d", [1030]],
            ["wikibase.api.RepoApi", "1wx6wi9", [1025]],
            ["wikibase.api.RepoApiError", "15bjd20", [970, 1025]],
            ["jquery.animateWithEvent", "1ns9ijk", [1032]],
            ["jquery.AnimationEvent",
                "1mh6s4r", [1035]
            ],
            ["jquery.focusAt", "0iwurun"],
            ["jquery.inputautoexpand", "10mbgbo", [1036]],
            ["jquery.PurposedCallbacks", "0o3oz96"],
            ["jquery.event.special.eachchange", "1fudhg9", [22]],
            ["jquery.ui.inputextender", "1mdd5em", [1031, 1036, 57, 65]],
            ["jquery.ui.listrotator", "0adjhly", [49]],
            ["jquery.ui.ooMenu", "0n42w5m", [65, 1047, 970]],
            ["jquery.ui.preview", "1gn9br7", [65, 1053, 1052]],
            ["jquery.ui.suggester", "0716265", [46, 1039, 57]],
            ["jquery.ui.commonssuggester", "0e00kas", [1041, 1050]],
            ["jquery.ui.languagesuggester", "1yrv529", [1041]],
            ["jquery.ui.toggler", "0qvc3sc", [1031, 46, 65]],
            ["jquery.ui.unitsuggester", "0ry9dq4", [1041]],
            ["jquery.util.adaptlettercase", "0m6vgh0"],
            ["jquery.util.getscrollbarwidth", "0igg1wx"],
            ["util.ContentLanguages", "0yy013j", [970]],
            ["util.Extendable", "1dwo4ki"],
            ["util.highlightSubstring", "08zsfcu"],
            ["util.MessageProvider", "0f14o60"],
            ["util.HashMessageProvider", "02teti0"],
            ["util.CombiningMessageProvider", "1cvmnfc"],
            ["util.PrefixingMessageProvider", "18hy7w8"],
            ["util.Notifier", "0ri6d2e"],
            [
                "jquery.valueview", "0ctqo24", [1060]
            ],
            ["jquery.valueview.Expert", "06mac0y", [1053, 1049, 1052, 1055, 970]],
            ["jquery.valueview.ExpertStore", "0smnh1x"],
            ["jquery.valueview.experts", "1q9bwga"],
            ["jquery.valueview.valueview", "0dlztmv", [972, 65, 1058, 1061, 1065, 1073, 976, 978]],
            ["jquery.valueview.ViewState", "14qwcii"],
            ["jquery.valueview.experts.CommonsMediaType", "1s6zmsg", [1042, 1069]],
            ["jquery.valueview.experts.GeoShape", "1r7iind", [1042, 1069]],
            ["jquery.valueview.experts.TabularData", "03dqvt9", [1042, 1069]],
            ["jquery.valueview.experts.EmptyValue", "0tlsagx", [1057, 1059]],
            ["jquery.valueview.experts.GlobeCoordinateInput", "0sxamf6", [1075, 1077, 1078, 1069, 1051]],
            ["jquery.valueview.experts.MonolingualText", "1jt002a", [1076, 1069]],
            ["jquery.valueview.experts.QuantityInput", "07ey6te", [1079, 1069]],
            ["jquery.valueview.experts.StringValue", "189ip5g", [1033, 1034, 1057, 1059]],
            ["jquery.valueview.experts.SuggestedStringValue", "1unbz8k", [1041, 1069]],
            ["jquery.valueview.experts.TimeInput", "1enoxus", [974, 1075, 1077, 1078, 1051]],
            [
                "jquery.valueview.experts.UnDeserializableValue", "09n33bs", [1057, 1059]
            ],
            ["jquery.valueview.experts.UnsupportedValue", "1ghqj0u", [1057, 1059]],
            ["jquery.valueview.ExpertExtender", "11k7hlr", [1037, 1056]],
            ["jquery.valueview.ExpertExtender.Container", "1q3f22f", [1074]],
            ["jquery.valueview.ExpertExtender.LanguageSelector", "14ahjdc", [1043, 1074, 1054]],
            ["jquery.valueview.ExpertExtender.Listrotator", "1yrhxjc", [1038, 1074]],
            ["jquery.valueview.ExpertExtender.Preview", "03ppoff", [1040, 1074, 1054]],
            ["jquery.valueview.ExpertExtender.UnitSelector", "0belq49", [1045, 1074]],
            ["jquery.ui.closeable", "0hbi899", [1082]],
            ["jquery.ui.EditableTemplatedWidget", "0i9jkpa", [1080]],
            ["jquery.ui.TemplatedWidget", "1isirlp", [65, 970, 1093]],
            ["jquery.wikibase.entityselector", "07oxyd4", [1036, 44, 1041]],
            ["jquery.wikibase.entityview", "0v84w65", [1082]],
            ["jquery.wikibase.listview", "0wxte1s", [1082]],
            ["jquery.wikibase.referenceview", "169v56w", [1081, 1085, 938]],
            ["jquery.wikibase.statementview", "1fomxsc", [55, 1044, 1083, 1086, 1088, 202, 930, 998, 1018, 1099]],
            ["jquery.wikibase.statementview.RankSelector.styles", "129zv7v"],
            ["jquery.wikibase.toolbar.styles", "103stu8"],
            ["jquery.wikibase.toolbarbutton.styles", "1r2s7pb"],
            ["wikibase.common", "1bd3zqu"],
            ["wikibase.RevisionStore", "0kqepox", [931]],
            ["wikibase.templates", "1ape3js", [29]],
            ["wikibase.ValueFormatterFactory", "0t6wu3i", [970, 931]],
            ["wikibase.entityChangers.EntityChangersFactory", "1fkt2r4", [1030, 950, 1002, 1022]],
            ["wikibase.entityIdFormatter", "0q0sjht", [970, 1100]],
            ["wikibase.store.EntityStore", "1ltpd9l", [970, 931]],
            ["wikibase.utilities.ClaimGuidGenerator", "1aazh85", [970, 1099]],
            ["wikibase.utilities", "1dwi6zv", [149, 931]],
            ["wikibase.view.__namespace", "0ibm72h", [931]],
            ["wikibase.view.StructureEditorFactory", "1r80un3", [1100]],
            ["wikibase.view.ToolbarFactory", "1aj0jd2", [1082, 1089, 1090, 937, 1030, 1100]],
            ["wikibase.view.ControllerViewFactory", "17v4gpd", [1106]],
            ["wikibase.view.ReadModeViewFactory", "0rscmvf", [1106]],
            ["wikibase.view.ViewFactoryFactory", "0wgzplb", [1103, 1104]],
            [
                "wikibase.view.ViewFactory", "1l0k7ae", [1034, 1234, 1056, 1084, 936, 1087, 241, 932, 1235, 933, 1098, 1100]
            ],
            ["ext.centralauth.globalrenamequeue", "11akkzv"],
            ["ext.centralauth.globalrenamequeue.styles", "1lbp82s"],
            ["skins.monobook.mobile.echohack", "0vg3fp2", [121, 255]],
            ["skins.monobook.mobile.uls", "1t3lsx8", [726]],
            ["ext.cite.visualEditor.core", "0cdacvg", [508]],
            ["ext.cite.visualEditor.data", "1g6bi4b", [498]],
            ["ext.cite.visualEditor", "1ec1qwn", [291, 288, 1111, 1112, 516, 255, 258, 262]],
            ["ext.geshi.visualEditor", "1aas5o5", [508]],
            ["ext.gadget.common-action-delete", "1eyhcu3", [], "site"],
            ["ext.gadget.common-action-edit", "04unvnp", [8], "site"],
            ["ext.gadget.common-action-history", "15i7vkq", [], "site"],
            ["ext.gadget.common-namespace-file", "1woh3ue", [], "site"],
            ["ext.gadget.common-special-abusefilter", "040qr64", [], "site"],
            ["ext.gadget.common-special-block", "1mnqwlg", [0], "site"],
            ["ext.gadget.common-special-log", "0k2ltbl", [121], "site"],
            ["ext.gadget.common-special-movepage", "1sg2sra", [], "site"],
            [
                "ext.gadget.common-special-newpages", "0pty5su", [121], "site"
            ],
            ["ext.gadget.common-special-search", "0k3pt3l", [0], "site"],
            ["ext.gadget.common-special-statistics", "0higrau", [], "site"],
            ["ext.gadget.common-special-upload", "0m96ox4", [121], "site"],
            ["ext.gadget.common-special-watchlist-helperStyles", "0gjvlzb", [], "site"],
            ["ext.gadget.common-special-watchlist", "0aeoogc", [0, 26], "site"],
            ["ext.gadget.libJQuery", "1i1xqxq", [], "site"],
            ["ext.gadget.SettingsManager", "0wzq0ug", [119], "site"],
            ["ext.gadget.registerTool", "1gy9z4i", [121, 8], "site"],
            ["ext.gadget.BKL", "1ri68eq", [], "site"],
            ["ext.gadget.collapserefs", "02qc3mn", [125, 121], "site"],
            ["ext.gadget.directLinkToCommons", "1skzc87", [121], "site"],
            ["ext.gadget.referenceTooltips", "0vv2306", [22, 125, 101], "site"],
            ["ext.gadget.logo", "1atilfy", [], "site"],
            ["ext.gadget.edittop", "1yvn4do", [0, 121], "site"],
            ["ext.gadget.blpEditNotice", "0vrekdb", [0, 486], "site"],
            ["ext.gadget.wikibugs", "0gv830c", [], "site"],
            ["ext.gadget.sidebarRelated", "198pn7a", [0], "site"],
            [
                "ext.gadget.preview", "1yxnyij", [121], "site"
            ],
            ["ext.gadget.urldecoder", "1jfvupq", [1131], "site"],
            ["ext.gadget.HotCat", "1p414i3", [], "site"],
            ["ext.gadget.refToolbar", "1kzsdz2", [8, 18, 121], "site"],
            ["ext.gadget.ProveIt", "1r6ki44", [], "site"],
            ["ext.gadget.Wikilinker", "1sgl1f8", [1131], "site"],
            ["ext.gadget.DotsSyntaxHighlighter", "05irqhc", [22], "site"],
            ["ext.gadget.refToolbarBase", "0r8n3ej", [], "site"],
            ["ext.gadget.wikificator", "0c29idu", [1131], "site"],
            ["ext.gadget.summaryButtons", "0z4wwnw", [208, 121], "site"],
            ["ext.gadget.newTopicOnTop", "1gkbs07", [43], "site"],
            ["ext.gadget.HighlightRedirects", "0g4oin2", [121], "site"],
            ["ext.gadget.HighlightUnpatrolledLinks", "1ucygf1", [], "site"],
            ["ext.gadget.popups", "02i6rq7", [], "site"],
            ["ext.gadget.addThisArticles", "1fcff4o", [121], "site"],
            ["ext.gadget.HideInfobox", "0uvbmqm", [], "site"],
            ["ext.gadget.HideWikimediaNavigation", "13p14e8", [], "site"],
            ["ext.gadget.HideNavboxes", "0a4uzwx", [], "site"],
            ["ext.gadget.HideExternalLinks", "0a02xrd", [], "site"],
            [
                "ext.gadget.OpaqueInfoboxReferences", "1trftf1", [], "site"
            ],
            ["ext.gadget.shiftrefs", "1ya07t6", [], "site"],
            ["ext.gadget.imgToggle", "1o5s5cj", [], "site"],
            ["ext.gadget.markadmins", "16ej3fm", [121], "site"],
            ["ext.gadget.markblocked", "1d9tdub", [121], "site"],
            ["ext.gadget.watchlist-helperStyles", "1rw4p8i", [], "site"],
            ["ext.gadget.watchlist", "1niq5nb", [121, 8], "site"],
            ["ext.gadget.disableUpdatedMarker", "13a842p", [], "site"],
            ["ext.gadget.contribsrange", "0b3cde6", [], "site"],
            ["ext.gadget.OldDiff", "00z34e0", [], "site"],
            ["ext.gadget.HideFlaggedRevs", "13aqny1", [], "site"],
            ["ext.gadget.UTCLiveClock-helperStyles", "0lgwqu9", [], "site"],
            ["ext.gadget.UTCLiveClock", "1l9hf6s", [0, 101, 79], "site"],
            ["ext.gadget.roundCorners", "1c0eflh", [], "site"],
            ["ext.gadget.dropdown-menus", "00o12b2", [], "site"],
            ["ext.gadget.ajaxQuickDelete", "1xl2jqj", [121], "site"],
            ["ext.gadget.addThisMain", "13mbaj8", [121], "site"],
            ["ext.gadget.DelKeepVis", "05ugbh3", [], "site"],
            ["ext.gadget.hideSandboxLinkFromPersonalToolbar", "0ud7opp", [], "site"],
            [
                "ext.gadget.osm", "0ggnudn", [121], "site"
            ],
            ["ext.gadget.search-extraTooltips", "1cvgw35", [107], "site"],
            ["ext.gadget.wfTypos", "1kb7rvd", [], "site"],
            ["ext.gadget.wfIsbnLite", "0vk4re0", [], "site"],
            ["ext.gadget.toReasonator", "04fir0q", [], "site"],
            ["ext.gadget.useWD", "0ssp8b8", [], "site"],
            ["ext.gadget.wikidataInfoboxExport", "0dpdd8m", [87, 245, 250], "site"],
            ["ext.gadget.wefcore", "07y4k8s", [52, 63, 739, 87], "site"],
            ["ext.gadget.wikidataHeaderLink", "07zyuzr", [], "site"],
            ["ext.gadget.iwcore", "01l27rz", [], "site"],
            ["ext.gadget.iwhints", "0jg286o", [1188], "site"],
            ["ext.gadget.iwlocalnames", "02ycsdg", [1188], "site"],
            ["ext.gadget.relatedIcons", "08lat72", [], "site"],
            ["ext.gadget.iwen", "06tlnzt", [1188], "site"],
            ["ext.gadget.iwde", "1rwpobb", [1188], "site"],
            ["ext.gadget.iwfr", "0d8kgxl", [1188], "site"],
            ["ext.gadget.iwpl", "0omm7er", [1188], "site"],
            ["ext.gadget.iwit", "0resfyc", [1188], "site"],
            ["ext.gadget.iwes", "0cef33a", [1188], "site"],
            ["ext.gadget.iwpt", "0nfda0u", [1188], "site"],
            ["ext.gadget.iwnl", "03lrjek", [1188], "site"],
            [
                "ext.gadget.iwhe", "0s0paku", [1188], "site"
            ],
            ["ext.gadget.iwja", "10gen1f", [1188], "site"],
            ["ext.gadget.iwzh", "0ku9l0d", [1188], "site"],
            ["ext.gadget.iwuk", "0zsxr3e", [1188], "site"],
            ["ext.gadget.iwbe", "1uexmoq", [1188], "site"],
            ["ext.gadget.iwrussia", "0gi6hyw", [1188], "site"],
            ["ext.gadget.qualityArticles", "0n46zj9", [49, 52], "site"],
            ["ext.gadget.DYK", "1hnawu7", [], "site"],
            ["ext.gadget.articleStats", "00bqfuu", [79], "site"],
            ["ext.gadget.iwrm", "007jst8", [], "site"],
            ["ext.gadget.yandex-tts", "1m6qqsh", [], "site"],
            ["ext.gadget.yandex-speechrecognition", "126bkga", [], "site"],
            ["ext.gadget.mobile-sidebar", "0az7zp9", [], "site"],
            ["ext.gadget.GeoBox", "19u2btc", [], "site"],
            ["ext.globalCssJs.user", "0qvuzjn", [], "user", "metawiki"],
            ["ext.globalCssJs.user.styles", "0qvuzjn", [], "user", "metawiki"],
            ["ext.globalCssJs.site", "1r8qw7v", [], "site", "metawiki"],
            ["ext.globalCssJs.site.styles", "1r8qw7v", [], "site", "metawiki"],
            ["ext.guidedTour.tour.RcFiltersIntro", "0ys5q21", [549]],
            ["ext.guidedTour.tour.WlFiltersIntro", "1na4p6j", [549]],
            [
                "ext.guidedTour.tour.RcFiltersHighlight", "1tcom3k", [549]
            ],
            ["pdfhandler.messages", "1061asn"],
            ["ext.visualEditor.mwextensionmessages", "073a2p7"],
            ["ext.guidedTour.tour.firsteditve", "0zhuaq5", [549]],
            ["mobile.notifications.overlay", "1x9wsrt", [621, 565, 241]],
            ["ext.echo.emailicons", "0w7qgf4"],
            ["ext.echo.secondaryicons", "0d0jzq7"],
            ["ext.guidedTour.tour.flowOptIn", "193we7u", [549]],
            ["ext.guidedTour.tour.gettingstartedtasktoolbarve", "1xl6qj8", [669, 549]],
            ["ext.wikimediaEvents.visualEditor", "18dtl8c", [488]],
            ["ext.uls.displaysettings", "0vov24a", [729, 730, 734, 205]],
            ["ext.uls.preferences", "13scwrq", [119]],
            ["mw.cx.externalmessages", "175ll1u"],
            ["wikibase.Site", "117oxf7", [730, 970, 931]],
            ["jquery.util.getDirectionality", "12tovhk", [730]],
            ["wikibase.getLanguageNameByCode", "0gg1y8g", [730, 931]],
            ["ext.quicksurveys.survey.reader-demographics-ru", "1dcmkds"]
        ]);
        mw.config.set({
            "wgLoadScript": "/w/load.php",
            "debug": !1,
            "skin": "vector",
            "stylepath": "/w/skins",
            "wgUrlProtocols": "bitcoin\\:|ftp\\:\\/\\/|ftps\\:\\/\\/|geo\\:|git\\:\\/\\/|gopher\\:\\/\\/|http\\:\\/\\/|https\\:\\/\\/|irc\\:\\/\\/|ircs\\:\\/\\/|magnet\\:|mailto\\:|mms\\:\\/\\/|news\\:|nntp\\:\\/\\/|redis\\:\\/\\/|sftp\\:\\/\\/|sip\\:|sips\\:|sms\\:|ssh\\:\\/\\/|svn\\:\\/\\/|tel\\:|telnet\\:\\/\\/|urn\\:|worldwind\\:\\/\\/|xmpp\\:|\\/\\/",
            "wgArticlePath": "/wiki/$1",
            "wgScriptPath": "/w",
            "wgScript": "/w/index.php",
            "wgSearchType": "CirrusSearch",
            "wgVariantArticlePath": !1,
            "wgActionPaths": {},
            "wgServer": "//ru.wikipedia.org",
            "wgServerName": "ru.wikipedia.org",
            "wgUserLanguage": "ru",
            "wgContentLanguage": "ru",
            "wgTranslateNumerals": !0,
            "wgVersion": "1.34.0-wmf.11",
            "wgEnableAPI": !0,
            "wgEnableWriteAPI": !0,
            "wgFormattedNamespaces": {
                "-2": "Медиа",
                "-1": "Служебная",
                "0": "",
                "1": "Обсуждение",
                "2": "Участник",
                "3": "Обсуждение участника",
                "4": "Википедия",
                "5": "Обсуждение Википедии",
                "6": "Файл",
                "7": "Обсуждение файла",
                "8": "MediaWiki",
                "9": "Обсуждение MediaWiki",
                "10": "Шаблон",
                "11": "Обсуждение шаблона",
                "12": "Справка",
                "13": "Обсуждение справки",
                "14": "Категория",
                "15": "Обсуждение категории",
                "100": "Портал",
                "101": "Обсуждение портала",
                "102": "Инкубатор",
                "103": "Обсуждение Инкубатора",
                "104": "Проект",
                "105": "Обсуждение проекта",
                "106": "Арбитраж",
                "107": "Обсуждение арбитража",
                "446": "Education Program",
                "447": "Education Program talk",
                "828": "Модуль",
                "829": "Обсуждение модуля",
                "2300": "Гаджет",
                "2301": "Обсуждение гаджета",
                "2302": "Определение гаджета",
                "2303": "Обсуждение определения гаджета",
                "2600": "Тема"
            },
            "wgNamespaceIds": {
                "медиа": -2,
                "служебная": -1,
                "": 0,
                "обсуждение": 1,
                "участник": 2,
                "обсуждение_участника": 3,
                "википедия": 4,
                "обсуждение_википедии": 5,
                "файл": 6,
                "обсуждение_файла": 7,
                "mediawiki": 8,
                "обсуждение_mediawiki": 9,
                "шаблон": 10,
                "обсуждение_шаблона": 11,
                "справка": 12,
                "обсуждение_справки": 13,
                "категория": 14,
                "обсуждение_категории": 15,
                "портал": 100,
                "обсуждение_портала": 101,
                "инкубатор": 102,
                "обсуждение_инкубатора": 103,
                "проект": 104,
                "обсуждение_проекта": 105,
                "арбитраж": 106,
                "обсуждение_арбитража": 107,
                "education_program": 446,
                "education_program_talk": 447,
                "модуль": 828,
                "обсуждение_модуля": 829,
                "гаджет": 2300,
                "обсуждение_гаджета": 2301,
                "определение_гаджета": 2302,
                "обсуждение_определения_гаджета": 2303,
                "тема": 2600,
                "изображение": 6,
                "обсуждение_изображения": 7,
                "участница": 2,
                "обсуждение_участницы": 3,
                "у": 2,
                "u": 2,
                "оу": 3,
                "ut": 3,
                "ш": 10,
                "t": 10,
                "к": 14,
                "вп": 4,
                "и": 102,
                "про": 104,
                "ак": 106,
                "wp": 4,
                "опро": 105,
                "arbcom": 106,
                "wikipedia": 4,
                "wikipedia_talk": 5,
                "image": 6,
                "image_talk": 7,
                "media": -2,
                "special": -1,
                "talk": 1,
                "user": 2,
                "user_talk": 3,
                "project": 4,
                "project_talk": 5,
                "file": 6,
                "file_talk": 7,
                "mediawiki_talk": 9,
                "template": 10,
                "template_talk": 11,
                "help": 12,
                "help_talk": 13,
                "category": 14,
                "category_talk": 15,
                "gadget": 2300,
                "gadget_talk": 2301,
                "gadget_definition": 2302,
                "gadget_definition_talk": 2303,
                "topic": 2600,
                "module": 828,
                "module_talk": 829
            },
            "wgContentNamespaces": [0],
            "wgSiteName": "Википедия",
            "wgDBname": "ruwiki",
            "wgExtraSignatureNamespaces": [104, 106, 4, 12],
            "wgExtensionAssetsPath": "/w/extensions",
            "wgCookiePrefix": "ruwiki",
            "wgCookieDomain": "",
            "wgCookiePath": "/",
            "wgCookieExpiration": 2592000,
            "wgCaseSensitiveNamespaces": [2302, 2303],
            "wgLegalTitleChars": " %!\"$\u0026'()*,\\-./0-9:;=?@A-Z\\\\\\^_`a-z~+\\u0080-\\uFFFF",
            "wgIllegalFileChars": ":/\\\\",
            "wgResourceLoaderStorageVersion": "1-3",
            "wgResourceLoaderStorageEnabled": !0,
            "wgForeignUploadTargets": ["shared"],
            "wgEnableUploads": !0,
            "wgCommentByteLimit": null,
            "wgCommentCodePointLimit": 500,
            "wgCiteVisualEditorOtherGroup": !1,
            "wgCiteResponsiveReferences": !1,
            "wgTimedMediaHandler": {
                "MediaWiki.DefaultProvider": "local",
                "MediaWiki.ApiProviders": {
                    "wikimediacommons": {
                        "url": "//commons.wikimedia.org/w/api.php"
                    }
                },
                "EmbedPlayer.OverlayControls": !0,
                "EmbedPlayer.CodecPreference": ["vp9", "webm", "h264", "ogg", "mp3", "ogvjs"],
                "EmbedPlayer.DisableVideoTagSupport": !1,
                "EmbedPlayer.DisableHTML5FlashFallback": !0,
                "EmbedPlayer.ReplaceSources": null,
                "EmbedPlayer.EnableFlavorSelector": !1,
                "EmbedPlayer.EnableIpadHTMLControls": !0,
                "EmbedPlayer.WebKitPlaysInline": !1,
                "EmbedPlayer.EnableIpadNativeFullscreen": !1,
                "EmbedPlayer.iPhoneShowHTMLPlayScreen": !0,
                "EmbedPlayer.ForceLargeReplayButton": !1,
                "EmbedPlayer.RewriteSelector": "video,audio,playlist",
                "EmbedPlayer.DefaultSize": "400x300",
                "EmbedPlayer.ControlsHeight": 31,
                "EmbedPlayer.TimeDisplayWidth": 85,
                "EmbedPlayer.KalturaAttribution": !0,
                "EmbedPlayer.EnableOptionsMenu": !0,
                "EmbedPlayer.EnableRightClick": !0,
                "EmbedPlayer.EnabledOptionsMenuItems": ["playerSelect", "download", "share", "aboutPlayerLibrary"],
                "EmbedPlayer.WaitForMeta": !0,
                "EmbedPlayer.ShowNativeWarning": !0,
                "EmbedPlayer.ShowPlayerAlerts": !0,
                "EmbedPlayer.EnableFullscreen": !0,
                "EmbedPlayer.EnableTimeDisplay": !0,
                "EmbedPlayer.EnableVolumeControl": !0,
                "EmbedPlayer.NewWindowFullscreen": !1,
                "EmbedPlayer.FullscreenTip": !0,
                "EmbedPlayer.DirectFileLinkWarning": !0,
                "EmbedPlayer.NativeControls": !1,
                "EmbedPlayer.NativeControlsMobileSafari": !0,
                "EmbedPlayer.FullScreenZIndex": 999998,
                "EmbedPlayer.ShareEmbedMode": "iframe",
                "EmbedPlayer.MonitorRate": 250,
                "EmbedPlayer.UseFlashOnAndroid": !1,
                "EmbedPlayer.EnableURLTimeEncoding": "flash",
                "EmbedPLayer.IFramePlayer.DomainWhiteList": "*",
                "EmbedPlayer.EnableIframeApi": !0,
                "EmbedPlayer.PageDomainIframe": !0,
                "EmbedPlayer.NotPlayableDownloadLink": !0,
                "TimedText.ShowInterface": "always",
                "TimedText.ShowAddTextLink": !0,
                "TimedText.ShowRequestTranscript": !1,
                "TimedText.NeedsTranscriptCategory": "Videos needing subtitles",
                "TimedText.BottomPadding": 10,
                "TimedText.BelowVideoBlackBoxHeight": 40,
                "TimedText.ShowInterface.local": "off"
            },
            "wgCirrusSearchFeedbackLink": !1,
            "wgWikiEditorMagicWords": {
                "redirect": "#перенаправление",
                "img_right": "справа",
                "img_left": "слева",
                "img_none": "без",
                "img_center": "центр",
                "img_thumbnail": "мини",
                "img_framed": "обрамить",
                "img_frameless": "безрамки"
            },
            "mw.msg.wikieditor": "--~~~~",
            "wgMultimediaViewer": {
                "infoLink": "https://mediawiki.org/wiki/Special:MyLanguage/Extension:Media_Viewer/About",
                "discussionLink": "https://mediawiki.org/wiki/Special:MyLanguage/Extension_talk:Media_Viewer/About",
                "helpLink": "https://mediawiki.org/wiki/Special:MyLanguage/Help:Extension:Media_Viewer",
                "useThumbnailGuessing": !0,
                "durationSamplingFactor": 1000,
                "durationSamplingFactorLoggedin": !1,
                "networkPerformanceSamplingFactor": 1000,
                "actionLoggingSamplingFactorMap": {
                    "default": 1,
                    "close": 1000,
                    "defullscreen": 10,
                    "download": 7,
                    "download-close": 50,
                    "download-open": 66,
                    "embed-select-menu-html-original": 4,
                    "enlarge": 6,
                    "file-description-page-abovefold": 6,
                    "fullscreen": 20,
                    "hash-load": 60,
                    "history-navigation": 200,
                    "image-view": 2000,
                    "metadata-close": 18,
                    "metadata-open": 6,
                    "metadata-scroll-close": 83,
                    "metadata-scroll-open": 104,
                    "next-image": 800,
                    "prev-image": 200,
                    "right-click-image": 74,
                    "thumbnail": 1000,
                    "view-original-file": 112
                },
                "attributionSamplingFactor": 1000,
                "dimensionSamplingFactor": 1000,
                "imageQueryParameter": !1,
                "recordVirtualViewBeaconURI": "/beacon/media",
                "tooltipDelay": 1000,
                "extensions": {
                    "jpg": "default",
                    "jpeg": "default",
                    "gif": "default",
                    "svg": "default",
                    "png": "default",
                    "tiff": "default",
                    "tif": "default",
                    "stl": "mmv.3d"
                }
            },
            "wgMediaViewer": !0,
            "wgPopupsVirtualPageViews": !0,
            "wgPopupsGateway": "restbaseHTML",
            "wgPopupsEventLogging": !1,
            "wgPopupsRestGatewayEndpoint": "/api/rest_v1/page/summary/",
            "wgPopupsStatsvSamplingRate": 0.01,
            "wgVisualEditorConfig": {
                "usePageImages": !0,
                "usePageDescriptions": !0,
                "disableForAnons": !1,
                "preloadModules": ["site", "user"],
                "preferenceModules": {
                    "visualeditor-enable-experimental": "ext.visualEditor.experimental"
                },
                "namespaces": [102, 2, 6, 12, 14, 0],
                "contentModels": {
                    "wikitext": "article"
                },
                "pluginModules": ["ext.wikihiero.visualEditor", "ext.cite.visualEditor", "ext.geshi.visualEditor", "ext.spamBlacklist.visualEditor", "ext.titleblacklist.visualEditor", "ext.score.visualEditor", "ext.confirmEdit.visualEditor", "ext.CodeMirror.visualEditor.init", "ext.CodeMirror.visualEditor", "ext.templateDataGenerator.editPage", "ext.math.visualEditor", "ext.disambiguator.visualEditor", "ext.wikimediaEvents.visualEditor", "ext.graph.visualEditor", "ext.kartographer.editing", "ext.kartographer.visualEditor",
                    "ext.abuseFilter.visualEditor", "ext.citoid.visualEditor"
                ],
                "thumbLimits": [120, 150, 180, 200, 220, 250, 300, 400],
                "galleryOptions": {
                    "imagesPerRow": 0,
                    "imageWidth": 120,
                    "imageHeight": 120,
                    "captionLength": !0,
                    "showBytes": !0,
                    "mode": "traditional",
                    "showDimensions": !0
                },
                "blacklist": {
                    "firefox": [
                        ["\u003C=", 11]
                    ],
                    "safari": [
                        ["\u003C=", 6]
                    ],
                    "opera": [
                        ["\u003C", 12]
                    ]
                },
                "tabPosition": "before",
                "tabMessages": {
                    "edit": null,
                    "editsource": "visualeditor-ca-editsource",
                    "create": null,
                    "createsource": "visualeditor-ca-createsource",
                    "editlocaldescription": "edit-local",
                    "editlocaldescriptionsource": "visualeditor-ca-editlocaldescriptionsource",
                    "createlocaldescription": "create-local",
                    "createlocaldescriptionsource": "visualeditor-ca-createlocaldescriptionsource",
                    "editsection": "editsection",
                    "editsectionsource": "visualeditor-ca-editsource-section"
                },
                "singleEditTab": !1,
                "enableVisualSectionEditing": "mobile",
                "enableNewMobileContext": !1,
                "showBetaWelcome": !0,
                "allowExternalLinkPaste": !1,
                "enableTocWidget": !1,
                "enableWikitext":
                    !0,
                "svgMaxSize": 4096,
                "namespacesWithSubpages": {
                    "1": !0,
                    "2": !0,
                    "3": !0,
                    "4": !0,
                    "5": !0,
                    "7": !0,
                    "8": !0,
                    "9": !0,
                    "10": !0,
                    "11": !0,
                    "12": !0,
                    "13": !0,
                    "15": !0,
                    "100": !0,
                    "101": !0,
                    "102": !0,
                    "103": !0,
                    "104": !0,
                    "105": !0,
                    "106": !0,
                    "107": !0,
                    "108": !0,
                    "109": !0,
                    "110": !0,
                    "111": !0,
                    "112": !0,
                    "113": !0,
                    "114": !0,
                    "115": !0,
                    "116": !0,
                    "117": !0,
                    "118": !0,
                    "119": !0,
                    "447": !0,
                    "830": !0,
                    "831": !0,
                    "828": !0,
                    "829": !0
                },
                "specialBooksources": "Служебная:Источники_книг",
                "rebaserUrl": !1,
                "restbaseUrl": "/api/rest_v1/page/html/",
                "fullRestbaseUrl": "/api/rest_",
                "allowLossySwitching": !1,
                "feedbackApiUrl": "https://www.mediawiki.org/w/api.php",
                "feedbackTitle": "VisualEditor/Feedback",
                "sourceFeedbackTitle": "2017 wikitext editor/Feedback"
            },
            "wgCitoidConfig": {
                "citoidServiceUrl": !1,
                "fullRestbaseUrl": !1
            },
            "wgEchoMaxNotificationCount": 99,
            "wgEchoPollForUpdates": 0,
            "wgFlowEditorList": ["visualeditor", "wikitext", "visualeditor", "none"],
            "wgFlowMaxTopicLength": 260,
            "wgFlowMentionTemplate": "FlowMention",
            "wgFlowAjaxTimeout": 30,
            "wgGettingStartedConfig": {
                "hasCategories": !1
            },
            "wgRelatedArticlesCardLimit": 3,
            "wgEventLoggingSchemaApiUri": "https://meta.wikimedia.org/w/api.php",
            "wgEventLoggingSchemaRevision": {
                "CentralNoticeBannerHistory": 19079897,
                "MediaViewer": 10867062,
                "MultimediaViewerNetworkPerformance": 15573630,
                "MultimediaViewerDuration": 10427980,
                "MultimediaViewerAttribution": 9758179,
                "MultimediaViewerDimensions": 10014238,
                "Popups": 17807993,
                "VirtualPageView": 17780078,
                "GuidedTourGuiderImpression": 8694395,
                "GuidedTourGuiderHidden": 8690549,
                "GuidedTourButtonClick": 13869649,
                "GuidedTourInternalLinkActivation": 8690553,
                "GuidedTourExternalLinkActivation": 8690560,
                "GuidedTourExited": 8690566,
                "MobileWebSearch": 12054448,
                "WebClientError": 18340282,
                "MobileWebShareButton": 18923688,
                "MobileWebMainMenuClickTracking": 18984528,
                "GettingStartedRedirectImpression": 7355552,
                "SignupExpCTAButtonClick": 8965028,
                "SignupExpCTAImpression": 8965023,
                "SignupExpPageLinkClick": 8965014,
                "TaskRecommendation": 9266319,
                "TaskRecommendationClick": 9266317,
                "TaskRecommendationImpression": 9266226,
                "TaskRecommendationLightbulbClick": 9433256,
                "TwoColConflictConflict": 18155295,
                "Print": 17630514,
                "ReadingDepth": 18201205,
                "EditAttemptStep": 19154569,
                "VisualEditorFeatureUse": 18457512,
                "CompletionSuggestions": 13630018,
                "SearchSatisfaction": 17378115,
                "TestSearchSatisfaction2": 16909631,
                "SearchSatisfactionErrors": 17181648,
                "Search": 14361785,
                "ChangesListHighlights": 16484288,
                "ChangesListFilterGrouping": 17008168,
                "RecentChangesTopLinks": 16732249,
                "InputDeviceDynamics": 17687647,
                "CitationUsage": 18810892,
                "CitationUsagePageLoad": 18502712,
                "WMDEBannerEvents": 18437830,
                "WMDEBannerSizeIssue": 18193993,
                "WikidataCompletionSearchClicks": 18665070,
                "UserFeedback": 18903446,
                "UniversalLanguageSelector": 17799034,
                "ContentTranslation": 18999884,
                "ContentTranslationCTA": 16017678,
                "ContentTranslationAbuseFilter": 18472730,
                "ContentTranslationSuggestion": 19004928,
                "ContentTranslationError": 11767097,
                "QuickSurveysResponses": 18397510,
                "QuickSurveyInitiation": 18397507,
                "AdvancedSearchRequest": 18227136,
                "TemplateWizard": 18374327,
                "EchoInteraction": 15823738,
                "FlowReplies": 10561344,
                "NavigationTiming": 19147339,
                "SaveTiming": 15396492,
                "ResourceTiming": 18358918,
                "CentralNoticeTiming": 18418286,
                "CpuBenchmark": 18436118,
                "ServerTiming": 18622171,
                "RUMSpeedIndex": 18813781,
                "PaintTiming": 19000009,
                "ElementTiming": 18951358,
                "LayoutJank": 18935150,
                "EventTiming": 18902447,
                "ClickTiming": 19037039,
                "FeaturePolicyViolation": 19120697,
                "ExternalGuidance": 18903973
            },
            "wgWMEStatsdBaseUri": "/beacon/statsv",
            "wgWMEReadingDepthSamplingRate": 0.1,
            "wgWMEReadingDepthEnabled": !0,
            "wgWMEPrintSamplingRate": 0,
            "wgWMEPrintEnabled": !0,
            "wgWMECitationUsagePopulationSize": 0,
            "wgWMECitationUsagePageLoadPopulationSize": 0,
            "wgWMESchemaEditAttemptStepSamplingRate": "0.0625",
            "wgWMEWikidataCompletionSearchClicks": [],
            "wgWMEPhp7SamplingRate": 5,
            "wgULSIMEEnabled": !0,
            "wgULSWebfontsEnabled": !1,
            "wgULSPosition": "interlanguage",
            "wgULSAnonCanChangeLanguage": !1,
            "wgULSEventLogging": !0,
            "wgULSImeSelectors": ["input:not([type])", "input[type=text]", "input[type=search]", "textarea", "[contenteditable]"],
            "wgULSNoImeSelectors": ["#wpCaptchaWord", ".ve-ce-surface-paste", ".ve-ce-surface-readOnly [contenteditable]", ".ace_editor textarea"],
            "wgULSNoWebfontsSelectors": ["#p-lang li.interlanguage-link \u003E a"],
            "wgULSFontRepositoryBasePath": "/w/extensions/UniversalLanguageSelector/data/fontrepo/fonts/",
            "wgContentTranslationTranslateInTarget": !0,
            "wgContentTranslationDomainCodeMapping": {
                "be-tarask": "be-x-old",
                "bho": "bh",
                "crh-latn": "crh",
                "gsw": "als",
                "lzh": "zh-classical",
                "nan": "zh-min-nan",
                "nb": "no",
                "rup": "roa-rup",
                "sgs": "bat-smg",
                "simple": "simple",
                "vro": "fiu-vro",
                "yue": "zh-yue"
            },
            "wgContentTranslationSiteTemplates": {
                "view": "//$1.wikipedia.org/wiki/$2",
                "action": "//$1.wikipedia.org/w/index.php?title=$2",
                "api": "//$1.wikipedia.org/w/api.php",
                "cx": "//cxserver.wikimedia.org/v1",
                "cookieDomain": null,
                "restbase": "//$1.wikipedia.org/api/rest_v1"
            },
            "wgContentTranslationTargetNamespace": 0,
            "wgExternalGuidanceMTReferrers": ["translate.google.com", "translate.googleusercontent.com"],
            "wgExternalGuidanceSiteTemplates": {
                "view": "//$1.wikipedia.org/wiki/$2",
                "action": "//$1.wikipedia.org/w/index.php?title=$2",
                "api": "//$1.wikipedia.org/w/api.php"
            },
            "wgExternalGuidanceDomainCodeMapping": {
                "be-tarask": "be-x-old",
                "bho": "bh",
                "crh-latn": "crh",
                "gsw": "als",
                "lzh": "zh-classical",
                "nan": "zh-min-nan",
                "nb": "no",
                "rup": "roa-rup",
                "sgs": "bat-smg",
                "vro": "fiu-vro",
                "yue": "zh-yue"
            },
            "wgEnabledQuickSurveys": [{
                "audience": [],
                "name": "reader-demographics-ru",
                "question": "Reader-demographics-1-message",
                "description": "Reader-segmentation-1-description",
                "module": "ext.quicksurveys.survey.reader-demographics-ru",
                "coverage": 0.02,
                "platforms": {
                    "desktop": ["stable"],
                    "mobile": ["stable"]
                },
                "privacyPolicy": "Reader-demographics-1-privacy",
                "type": "external",
                "link": "Reader-demographics-1-link",
                "instanceTokenParameterName": "entry.1791119923",
                "isInsecure":
                    !1
            }],
            "wgCentralNoticeActiveBannerDispatcher": "//meta.wikimedia.org/w/index.php?title=Special:BannerLoader",
            "wgCentralSelectedBannerDispatcher": "//meta.wikimedia.org/w/index.php?title=Special:BannerLoader",
            "wgCentralBannerRecorder": "//ru.wikipedia.org/beacon/impression",
            "wgCentralNoticeSampleRate": 0.01,
            "wgCentralNoticeImpressionEventSampleRate": 0.01,
            "wgNoticeNumberOfBuckets": 4,
            "wgNoticeBucketExpiry": 7,
            "wgNoticeNumberOfControllerBuckets": 2,
            "wgNoticeCookieDurations": {
                "close": 604800,
                "donate": 21600000
            },
            "wgNoticeHideUrls": ["//en.wikipedia.org/w/index.php?title=Special:HideBanners", "//meta.wikimedia.org/w/index.php?title=Special:HideBanners", "//commons.wikimedia.org/w/index.php?title=Special:HideBanners", "//species.wikimedia.org/w/index.php?title=Special:HideBanners", "//en.wikibooks.org/w/index.php?title=Special:HideBanners", "//en.wikiquote.org/w/index.php?title=Special:HideBanners", "//en.wikisource.org/w/index.php?title=Special:HideBanners",
                "//en.wikinews.org/w/index.php?title=Special:HideBanners", "//en.wikiversity.org/w/index.php?title=Special:HideBanners", "//www.mediawiki.org/w/index.php?title=Special:HideBanners"
            ],
            "wgCentralNoticePerCampaignBucketExtension": 30
        });
        mw.config.set(window.RLCONF || {});
        mw.loader.state(window.RLSTATE || {});
        mw.loader.load(window.RLPAGEMODULES || []);
        RLQ = window.RLQ || [];
        RLQ.push = function (fn) {
            if (typeof fn === 'function') {
                fn();
            } else {
                RLQ[RLQ.length] = fn;
            }
        };
        while (RLQ[0]) {
            RLQ.push(RLQ.shift());
        }
        NORLQ = {
            push: function () {}
        };
    }());
}