window.plate = {
    /** Get the root domain
     * @return example.org for www.example.org */
    rootDomain:function(){
        return location.hostname.split('.').slice(-2).join('.');
    },
    /** Handler post login, does some special stuff wraps need */
    wrapLogin:function(data){
        if (data && data.userData && data.userData.displayName){
            /* login successful, set cookies and reload page */
            var args = {path:'/', domain:'.' + plate.rootDomain()};
            cmg.query.cookie('ur_name', data.userData.displayName, args);
            cmg.query.cookie('ur_uuid', data.userData.uuid, args);
            cmg.query.cookie('alias', 'u=' + data.userData.uuid + '&n=' + data.userData.displayName, args);
            plate.onReady();
        }
    },
    loginSuccessHandler:function(){
        if(window.janrain && janrain.capture && janrain.capture.ui){
            janrain.on('onCaptureLoginSuccess', plate.wrapLogin);
            janrain.medleySession = false;
        }else{
            setTimeout(plate.loginSuccessHandler, 100);
        }
    },
    logoutSuccessHandler:function(){
        if(window.janrain){
            janrain.on('cmg_ready', function(){
                var logout = function(){
                    /* the alias cookie can only be on root domain, but ur_name+
                     ur_uuid can be on root domain or subdomain: carpet bomb */
                    ['ur_name', 'ur_uuid', 'alias'].forEach(function(e, i, a){
                        document.cookie=e + '=""; path=/;expires=' + plate.cookieExpiration(-2);
                        document.cookie=e + '=""; path=/;expires=' + plate.cookieExpiration(-2) + '; domain=.' + plate.rootDomain();
                    });
                    location= 'http://' + cmg.site_meta.domain + '/auth/logout';
                };
                janrain.settings.capture.federateLogoutCallback = logout;
                /* the cmLogout handler is defined by janrain, unbind it now */
                cmg.query(document).undelegate('.cmLogout');
                /* then add our own override */
                cmg.query('.cmLogout').on('touchstart click', function(e){
                    logout();
                });
            });
        }else{
            setTimeout(plate.logoutSuccessHandler, 100);
        }
    },
    /** Generate appropriate time to expire cookies, same as normal */
    cookieExpiration:function(exdays){
        var d = new Date();
        d.setTime(d.getTime() + (exdays*24*60*60*1000));
        var expires =  d.toUTCString();
        return expires;
    },
    /** Parse parameters from alias. If aliasCookie not given as param, reads cookie
     * @return username, uuid pair */
    getAliasParameters:function(aliasCookie){
        if(!aliasCookie)
            aliasCookie = decodeURI(cmg.query.cookie('alias'));
        var sURLVariables = aliasCookie.split('&');
        var aliasVariables= {};
        for (var i = 0; i < sURLVariables.length; i++)
        {
            var sParameterName = sURLVariables[i].split('=');
            aliasVariables[sParameterName[0]] = sParameterName[1];
        }
        return aliasVariables;
    },
    /** Set ur_uuid and ur_name values based on the values of the alias cookie */
    setMySiteCookies:function(alias){
        var ur_uuid = alias.u;
        var ur_name = alias.n;
        var expiration = plate.cookieExpiration(90);
        document.cookie='ur_uuid=' + ur_uuid + '; path=/;expires=' + expiration;
        document.cookie='ur_name=' + ur_name + '; path=/;expires=' + expiration;
    },
    /** Show or hide premium content or roadblock depending on plate.authorized.  */
    togglePremium:function(authorized){
        if(authorized || !plate.premium){
            cmg.query('.premium-content').show();
            cmg.query('.invitation_chunk, .janusNotAuthorized').hide();
            /* Rendering to hidden divs causes weird display issues, this fixes */
            window.dispatchEvent(new Event('resize'));
        }else{
            cmg.query('.premium-content').hide();
            cmg.query('.invitation_chunk, .janusNotAuthorized').show();
        }
    },
    /** Authorize uuid for the specified content. Handler function is called with result. */
    authorizeUUID:function(uuid, handler){
        auth_url = 'http://' + cmg.site_meta.domain + '/profile/janus-auth/?ur_uuid=';
        cmg.authorization.check(auth_url + uuid, function(json) {
            handler(json.authorized);
        });
    },
    /** Add a handler function to plate's handlers to call back for full authorization. */
    authorizationCheck:function(handler) {
        plate.authHandlers.push(function () {
            var alias = plate.getAliasParameters();
            if (plate.authorized && alias.u) {
                plate.authorizeUUID(alias.u, handler);
            } else {
                handler(false);
            }
        });
    },
    /** content marked premium */
    premium:false,
    /** is client currently authorized */
    authorized:false,
    /** Collect authorization data. Can be triggered multiple times, e.g. once
     * from normal flow and once from SSO. Thus monitoring changed state is a
     * race condition, so we are avoiding. */
    setAuthorized:function(authorized){
        plate.authorized = plate.authorized || authorized;
        plate.togglePremium(plate.authorized);
    },
    /** Hold other auth related utilities to be added as listeners */
    authHandlers:[],
    /** Initialize the premium plate wrap code to override handlers and render chunk
     * properly */
    onReady:function(){
        /* initially set roadblock state (this makes share codes happy etc) */
        plate.togglePremium(!plate.premium);
        /* if access meter is active, disable roadblock */
        if(flipper.is_active('Access-Meter')){
            plate.setAuthorized(true);
        }
        /* if user has alias, he is probably legit. Make more secure check later */
        if(!flipper.is_active('B-01290'))
            plate.setAuthorized(Boolean(cmg.query.cookie('alias')));
        if(cmg.query.cookie('alias')){
            /* perform more secure auth and update cookies if needed */
            var alias = plate.getAliasParameters();
            if(flipper.is_active('B-01290')){
                plate.authorizeUUID(alias.u, plate.setAuthorized);
            }
            if(!cmg.query.cookie('ur_name') || !cmg.query.cookie('ur_uuid')){
                plate.setMySiteCookies(alias);
            }
            cmg.update_auth_message();
        }
        plate.authHandlers.forEach(function(handler){
            handler();
        });
        plate.loginSuccessHandler();
        plate.logoutSuccessHandler();
    },
    /** Wait until cmg is defined to execute initializer for medley plate */
    waitReady:function(){
        if(window.cmg){
            cmg.query(document).ready(function(){
                plate.onReady();
            });
        }else{
            setTimeout(function(){plate.waitReady();}, 100);
        }
    }
};
/* Delay invocation until after js loaded */
setTimeout(function(){ plate.waitReady(); }, 0);
;
flipper = new Object();
flipper.active_flags = {"active_flags": ["GoogleAnalytics_Enable", "CMSTC-969", "CMSAP-1119-visible", "CMSSAI-858", "twitter_card", "disable_auth_recovery", "mobile_image_slider", "JANUS-1572", "JANUS-141", "JANUS-1627", "CMSTC-1011", "new_event_urls", "JANUS-1244", "JANUS-64", "JANUS-1266", "JANUS-1264", "CMSSAI-1343", "Chartbeat_Enable", "HYBRID_LISTS", "JANUS-1520", "JANUS-4777", "CMSAM-408", "ComScore_Enable", "qualtrics_enable", "Quantcast_Enable", "JANUS-2856", "VisualRevenue_Enable", "JANUS-1686", "MaxMapRadar_Enable", "JANUS-4778", "AppMeasurement_Enable", "JANUS-4779", "MaxMapRadarWired_Enable", "B-04471", "D-01426", "SchoolClosingsKeywordSearch_Disable", "jquery-2", "CMSTC-1192", "D-01463", "B-02762", "B-03926", "channel-premium-grid-template", "premium-redesign-nav"]}.active_flags;
flipper.is_active = function(key) {
    for (var i = 0; i < flipper.active_flags.length; i++) {
        if ( flipper.active_flags[i] == key ) return true;
    }
    return false;
}
;
// All code and conventions are protected by copyright
!function(t,e,n){function i(){S.addEventHandler(t,"orientationchange",i.orientationChange)}function a(){this.lastURL=S.URL(),this._fireIfURIChanged=S.bind(this.fireIfURIChanged,this),this._onPopState=S.bind(this.onPopState,this),this._onHashChange=S.bind(this.onHashChange,this),this._pushState=S.bind(this.pushState,this),this._replaceState=S.bind(this.replaceState,this),this.initialize()}function r(){this.rules=S.filter(S.rules,function(t){return"elementexists"===t.event})}function s(){this.rules=S.filter(S.rules,function(t){return"videoplayed"===t.event.substring(0,11)}),this.eventHandler=S.bind(this.onUpdateTime,this)}function o(){var t=this.eventRegex=/^hover\(([0-9]+)\)$/,e=this.rules=[];S.each(S.rules,function(n){var i=n.event.match(t);i&&e.push([Number(n.event.match(t)[1]),n.selector])})}function c(e){S.domReady(S.bind(function(){this.twttr=e||t.twttr,this.initialize()},this))}function u(t){this.delay=250,this.FB=t,S.domReady(S.bind(function(){S.poll(S.bind(this.initialize,this),this.delay,8)},this))}function l(e){e=e||S.rules,this.rules=S.filter(e,function(t){return"inview"===t.event}),this.elements=[],this.eventHandler=S.bind(this.track,this),S.addEventHandler(t,"scroll",this.eventHandler),S.addEventHandler(t,"load",this.eventHandler)}function d(t){S.BaseTool.call(this,t),this.name=t.name||"VisitorID",this.initialize()}function h(t){S.BaseTool.call(this,t)}function f(t){S.BaseTool.call(this,t)}function p(t){S.BaseTool.call(this,t),this.varBindings={},this.events=[],this.products=[],this.customSetupFuns=[]}function g(){S.BaseTool.call(this),this.asyncScriptCallbackQueue=[],this.argsForBlockingScripts=[]}function m(t){S.BaseTool.call(this,t),this.styleElements={},this.targetPageParamsStore={}}function v(t){S.BaseTool.call(this,t),this.name=t.name||"Basic"}var y=Object.prototype.toString,b=t._satellite&&t._satellite.override,S={initialized:!1,$data:function(t,e,i){var a="__satellite__",r=S.dataCache,s=t[a];s||(s=t[a]=S.uuid++);var o=r[s];return o||(o=r[s]={}),i===n?o[e]:void(o[e]=i)},uuid:1,dataCache:{},keys:function(t){var e=[];for(var n in t)e.push(n);return e},values:function(t){var e=[];for(var n in t)e.push(t[n]);return e},isArray:Array.isArray||function(t){return"[object Array]"===y.apply(t)},isObject:function(t){return null!=t&&!S.isArray(t)&&"object"==typeof t},isString:function(t){return"string"==typeof t},isNumber:function(t){return"[object Number]"===y.apply(t)&&!S.isNaN(t)},isNaN:function(t){return t!==t},isRegex:function(t){return t instanceof RegExp},isLinkTag:function(t){return!(!t||!t.nodeName||"a"!==t.nodeName.toLowerCase())},each:function(t,e,n){for(var i=0,a=t.length;a>i;i++)e.call(n,t[i],i,t)},map:function(t,e,n){for(var i=[],a=0,r=t.length;r>a;a++)i.push(e.call(n,t[a],a,t));return i},filter:function(t,e,n){for(var i=[],a=0,r=t.length;r>a;a++){var s=t[a];e.call(n,s,a,t)&&i.push(s)}return i},any:function(t,e,n){for(var i=0,a=t.length;a>i;i++){var r=t[i];if(e.call(n,r,i,t))return!0}return!1},every:function(t,e,n){for(var i=!0,a=0,r=t.length;r>a;a++){var s=t[a];i=i&&e.call(n,s,a,t)}return i},contains:function(t,e){return-1!==S.indexOf(t,e)},indexOf:function(t,e){if(t.indexOf)return t.indexOf(e);for(var n=t.length;n--;)if(e===t[n])return n;return-1},find:function(t,e,n){if(!t)return null;for(var i=0,a=t.length;a>i;i++){var r=t[i];if(e.call(n,r,i,t))return r}return null},textMatch:function(t,e){if(null==e)throw new Error("Illegal Argument: Pattern is not present");return null==t?!1:"string"==typeof e?t===e:e instanceof RegExp?e.test(t):!1},stringify:function(t,e){if(e=e||[],S.isObject(t)){if(S.contains(e,t))return"<Cycle>";e.push(t)}if(S.isArray(t))return"["+S.map(t,function(t){return S.stringify(t,e)}).join(",")+"]";if(S.isString(t))return'"'+String(t)+'"';if(S.isObject(t)){var n=[];for(var i in t)n.push(i+": "+S.stringify(t[i],e));return"{"+n.join(", ")+"}"}return String(t)},trim:function(t){return null==t?null:t.trim?t.trim():t.replace(/^ */,"").replace(/ *$/,"")},bind:function(t,e){return function(){return t.apply(e,arguments)}},throttle:function(t,e){var n=null;return function(){var i=this,a=arguments;clearTimeout(n),n=setTimeout(function(){t.apply(i,a)},e)}},domReady:function(t){function n(t){for(h=1;t=a.shift();)t()}var i,a=[],r=!1,s=e,o=s.documentElement,c=o.doScroll,u="DOMContentLoaded",l="addEventListener",d="onreadystatechange",h=/^loade|^c/.test(s.readyState);return s[l]&&s[l](u,i=function(){s.removeEventListener(u,i,r),n()},r),c&&s.attachEvent(d,i=function(){/^c/.test(s.readyState)&&(s.detachEvent(d,i),n())}),t=c?function(e){self!=top?h?e():a.push(e):function(){try{o.doScroll("left")}catch(n){return setTimeout(function(){t(e)},50)}e()}()}:function(t){h?t():a.push(t)}}(),loadScript:function(t,n){var i=e.createElement("script");S.scriptOnLoad(t,i,n),i.src=t,e.getElementsByTagName("head")[0].appendChild(i)},scriptOnLoad:function(t,e,n){function i(t){t&&S.logError(t),n&&n(t)}"onload"in e?(e.onload=function(){i()},e.onerror=function(){i(new Error("Failed to load script "+t))}):"readyState"in e&&(e.onreadystatechange=function(){var t=e.readyState;("loaded"===t||"complete"===t)&&(e.onreadystatechange=null,i())})},loadScriptOnce:function(t,e){S.loadedScriptRegistry[t]||S.loadScript(t,function(n){n||(S.loadedScriptRegistry[t]=!0),e&&e(n)})},loadedScriptRegistry:{},loadScriptSync:function(t){return e.write?S.domReadyFired?void S.notify('Cannot load sync the "'+t+'" script after DOM Ready.',1):void e.write('<script src="'+t+'"></script>'):void S.notify('Cannot load sync the "'+t+'" script because "document.write" is not available',1)},pushAsyncScript:function(t){S.tools["default"].pushAsyncScript(t)},pushBlockingScript:function(t){S.tools["default"].pushBlockingScript(t)},addEventHandler:t.addEventListener?function(t,e,n){t.addEventListener(e,n,!1)}:function(t,e,n){t.attachEvent("on"+e,n)},removeEventHandler:t.removeEventListener?function(t,e,n){t.removeEventListener(e,n,!1)}:function(t,e,n){t.detachEvent("on"+e,n)},preventDefault:t.addEventListener?function(t){t.preventDefault()}:function(t){t.returnValue=!1},stopPropagation:function(t){t.cancelBubble=!0,t.stopPropagation&&t.stopPropagation()},containsElement:function(t,e){return t.contains?t.contains(e):!!(16&t.compareDocumentPosition(e))},matchesCss:function(n){function i(t,e){var n=e.tagName;return n?t.toLowerCase()===n.toLowerCase():!1}var a=n.matchesSelector||n.mozMatchesSelector||n.webkitMatchesSelector||n.oMatchesSelector||n.msMatchesSelector;return a?function(n,i){if(i===e||i===t)return!1;try{return a.call(i,n)}catch(r){return!1}}:n.querySelectorAll?function(t,e){var n=e.parentNode;if(!n)return!1;if(t.match(/^[a-z]+$/i))return i(t,e);try{for(var a=e.parentNode.querySelectorAll(t),r=a.length;r--;)if(a[r]===e)return!0}catch(s){}return!1}:function(t,e){if(t.match(/^[a-z]+$/i))return i(t,e);try{return S.Sizzle.matches(t,[e]).length>0}catch(n){return!1}}}(e.documentElement),cssQuery:function(t){return t.querySelectorAll?function(e,n){var i;try{i=t.querySelectorAll(e)}catch(a){i=[]}n(i)}:function(t,e){if(S.Sizzle){var n;try{n=S.Sizzle(t)}catch(i){n=[]}e(n)}else S.sizzleQueue.push([t,e])}}(e),hasAttr:function(t,e){return t.hasAttribute?t.hasAttribute(e):t[e]!==n},inherit:function(t,e){var n=function(){};n.prototype=e.prototype,t.prototype=new n,t.prototype.constructor=t},extend:function(t,e){for(var n in e)e.hasOwnProperty(n)&&(t[n]=e[n])},toArray:function(){try{var t=Array.prototype.slice;return t.call(e.documentElement.childNodes,0)[0].nodeType,function(e){return t.call(e,0)}}catch(n){return function(t){for(var e=[],n=0,i=t.length;i>n;n++)e.push(t[n]);return e}}}(),equalsIgnoreCase:function(t,e){return null==t?null==e:null==e?!1:String(t).toLowerCase()===String(e).toLowerCase()},poll:function(t,e,n){function i(){S.isNumber(n)&&a++>=n||t()||setTimeout(i,e)}var a=0;e=e||1e3,i()},escapeForHtml:function(t){return t?String(t).replace(/\&/g,"&amp;").replace(/\</g,"&lt;").replace(/\>/g,"&gt;").replace(/\"/g,"&quot;").replace(/\'/g,"&#x27;").replace(/\//g,"&#x2F;"):t}};S.availableTools={},S.availableEventEmitters=[],S.fireOnceEvents=["condition","elementexists"],S.initEventEmitters=function(){S.eventEmitters=S.map(S.availableEventEmitters,function(t){return new t})},S.eventEmitterBackgroundTasks=function(){S.each(S.eventEmitters,function(t){"backgroundTasks"in t&&t.backgroundTasks()})},S.initTools=function(t){var e={"default":new g},n=S.settings.euCookieName||"sat_track";for(var i in t){var a,r,s;if(a=t[i],a.euCookie){var o="true"!==S.readCookie(n);if(o)continue}if(r=S.availableTools[a.engine],!r){var c=[];for(var u in S.availableTools)c.push(u);throw new Error("No tool engine named "+a.engine+", available: "+c.join(",")+".")}s=new r(a),s.id=i,e[i]=s}return e},S.preprocessArguments=function(t,e,n,i,a){function r(t){return i&&S.isString(t)?t.toLowerCase():t}function s(t){var c={};for(var u in t)if(t.hasOwnProperty(u)){var l=t[u];c[u]=S.isObject(l)?s(l):S.isArray(l)?o(l,i):r(S.replace(l,e,n,a))}return c}function o(t){for(var i=[],a=0,o=t.length;o>a;a++){var c=t[a];S.isString(c)?c=r(S.replace(c,e,n)):c&&c.constructor===Object&&(c=s(c)),i.push(c)}return i}return t?o(t,i):t},S.execute=function(t,e,n,i){function a(a){var r=i[a||"default"];if(r)try{r.triggerCommand(t,e,n)}catch(s){S.logError(s)}}if(!_satellite.settings.hideActivity)if(i=i||S.tools,t.engine){var r=t.engine;for(var s in i){var o=i[s];o.settings&&o.settings.engine===r&&a(s)}}else t.tool instanceof Array?S.each(t.tool,function(t){a(t)}):a(t.tool)},S.Logger={outputEnabled:!1,messages:[],keepLimit:100,flushed:!1,LEVELS:[null,null,"log","info","warn","error"],message:function(t,e){var n=this.LEVELS[e]||"log";this.messages.push([n,t]),this.messages.length>this.keepLimit&&this.messages.shift(),this.outputEnabled&&this.echo(n,t)},getHistory:function(){return this.messages},clearHistory:function(){this.messages=[]},setOutputState:function(t){this.outputEnabled!=t&&(this.outputEnabled=t,t?this.flush():this.flushed=!1)},echo:function(e,n){t.console&&t.console[e]("SATELLITE: "+n)},flush:function(){this.flushed||(S.each(this.messages,function(t){t[2]!==!0&&(this.echo(t[0],t[1]),t[2]=!0)},this),this.flushed=!0)}},S.notify=S.bind(S.Logger.message,S.Logger),S.cleanText=function(t){return null==t?null:S.trim(t).replace(/\s+/g," ")},S.cleanText.legacy=function(t){return null==t?null:S.trim(t).replace(/\s{2,}/g," ").replace(/[^\000-\177]*/g,"")},S.text=function(t){return t.textContent||t.innerText},S.specialProperties={text:S.text,cleanText:function(t){return S.cleanText(S.text(t))}},S.getObjectProperty=function(t,e,i){for(var a,r=e.split("."),s=t,o=S.specialProperties,c=0,u=r.length;u>c;c++){if(null==s)return n;var l=r[c];if(i&&"@"===l.charAt(0)){var d=l.slice(1);s=o[d](s)}else if(s.getAttribute&&(a=l.match(/^getAttribute\((.+)\)$/))){var h=a[1];s=s.getAttribute(h)}else s=s[l]}return s},S.getToolsByType=function(t){if(!t)throw new Error("Tool type is missing");var e=[];for(var n in S.tools){var i=S.tools[n];i.settings&&i.settings.engine===t&&e.push(i)}return e},S.setVar=function(){var t=S.data.customVars;if(null==t&&(S.data.customVars={},t=S.data.customVars),"string"==typeof arguments[0]){var e=arguments[0];t[e]=arguments[1]}else if(arguments[0]){var n=arguments[0];for(var i in n)t[i]=n[i]}},S.dataElementSafe=function(t,e){if(arguments.length>2){var n=arguments[2];"pageview"===e?S.dataElementSafe.pageviewCache[t]=n:"session"===e?S.setCookie("_sdsat_"+t,n):"visitor"===e&&S.setCookie("_sdsat_"+t,n,730)}else{if("pageview"===e)return S.dataElementSafe.pageviewCache[t];if("session"===e||"visitor"===e)return S.readCookie("_sdsat_"+t)}},S.dataElementSafe.pageviewCache={},S.realGetDataElement=function(e){var n;return e.selector?S.hasSelector&&S.cssQuery(e.selector,function(t){if(t.length>0){var i=t[0];"text"===e.property?n=i.innerText||i.textContent:e.property in i?n=i[e.property]:S.hasAttr(i,e.property)&&(n=i.getAttribute(e.property))}}):e.queryParam?n=e.ignoreCase?S.getQueryParamCaseInsensitive(e.queryParam):S.getQueryParam(e.queryParam):e.cookie?n=S.readCookie(e.cookie):e.jsVariable?n=S.getObjectProperty(t,e.jsVariable):e.customJS&&(n=e.customJS()),S.isString(n)&&e.cleanText&&(n=S.cleanText(n)),n},S.getDataElement=function(t,e,i){if(i=i||S.dataElements[t],null==i)return S.settings.undefinedVarsReturnEmpty?"":null;var a=S.realGetDataElement(i);return a===n&&i.storeLength?a=S.dataElementSafe(t,i.storeLength):a!==n&&i.storeLength&&S.dataElementSafe(t,i.storeLength,a),a||e||(a=i["default"]||""),S.isString(a)&&i.forceLowerCase&&(a=a.toLowerCase()),a},S.getVar=function(i,a,r){var s,o,c=S.data.customVars,u=r?r.target||r.srcElement:null,l={uri:S.URI(),protocol:e.location.protocol,hostname:e.location.hostname};if(S.dataElements&&i in S.dataElements)return S.getDataElement(i);if(o=l[i.toLowerCase()],o===n)if("this."===i.substring(0,5))i=i.slice(5),o=S.getObjectProperty(a,i,!0);else if("event."===i.substring(0,6))i=i.slice(6),o=S.getObjectProperty(r,i);else if("target."===i.substring(0,7))i=i.slice(7),o=S.getObjectProperty(u,i);else if("window."===i.substring(0,7))i=i.slice(7),o=S.getObjectProperty(t,i);else if("param."===i.substring(0,6))i=i.slice(6),o=S.getQueryParam(i);else if(s=i.match(/^rand([0-9]+)$/)){var d=Number(s[1]),h=(Math.random()*(Math.pow(10,d)-1)).toFixed(0);o=Array(d-h.length+1).join("0")+h}else o=S.getObjectProperty(c,i);return o},S.getVars=function(t,e,n){var i={};return S.each(t,function(t){i[t]=S.getVar(t,e,n)}),i},S.replace=function(t,e,n,i){return"string"!=typeof t?t:t.replace(/%(.*?)%/g,function(t,a){var r=S.getVar(a,e,n);return null==r?S.settings.undefinedVarsReturnEmpty?"":t:i?S.escapeForHtml(r):r})},S.escapeHtmlParams=function(t){return t.escapeHtml=!0,t},S.searchVariables=function(t,e,n){if(!t||0===t.length)return"";for(var i=[],a=0,r=t.length;r>a;a++){var s=t[a],o=S.getVar(s,e,n);i.push(s+"="+escape(o))}return"?"+i.join("&")},S.fireRule=function(t,e,n){var i=t.trigger;if(i){for(var a=0,r=i.length;r>a;a++){var s=i[a];S.execute(s,e,n)}S.contains(S.fireOnceEvents,t.event)&&(t.expired=!0)}},S.isLinked=function(t){for(var e=t;e;e=e.parentNode)if(S.isLinkTag(e))return!0;return!1},S.firePageLoadEvent=function(t){for(var n=e.location,i={type:t,target:n},a=S.pageLoadRules,r=a.length;r--;){var s=a[r];S.ruleMatches(s,i,n)&&(S.notify('Rule "'+s.name+'" fired.',1),S.fireRule(s,n,i))}for(var o in S.tools){var c=S.tools[o];c.endPLPhase&&c.endPLPhase(t)}},S.track=function(t){t=t.replace(/^\s*/,"").replace(/\s*$/,"");for(var e=0;e<S.directCallRules.length;e++){var n=S.directCallRules[e];if(n.name===t)return S.notify('Direct call Rule "'+t+'" fired.',1),void S.fireRule(n,location,{type:t})}S.notify('Direct call Rule "'+t+'" not found.',1)},S.basePath=function(){return S.data.host?("https:"===e.location.protocol?"https://"+S.data.host.https:"http://"+S.data.host.http)+"/":this.settings.basePath},S.setLocation=function(e){t.location=e},S.parseQueryParams=function(t){var e=function(t){var e=t;try{e=decodeURIComponent(t)}catch(n){}return e};if(""===t||S.isString(t)===!1)return{};0===t.indexOf("?")&&(t=t.substring(1));var n={},i=t.split("&");return S.each(i,function(t){t=t.split("="),t[1]&&(n[e(t[0])]=e(t[1]))}),n},S.getCaseSensitivityQueryParamsMap=function(t){var e=S.parseQueryParams(t),n={};for(var i in e)e.hasOwnProperty(i)&&(n[i.toLowerCase()]=e[i]);return{normal:e,caseInsensitive:n}},S.updateQueryParams=function(){S.QueryParams=S.getCaseSensitivityQueryParamsMap(t.location.search)},S.updateQueryParams(),S.getQueryParam=function(t){return S.QueryParams.normal[t]},S.getQueryParamCaseInsensitive=function(t){return S.QueryParams.caseInsensitive[t.toLowerCase()]},S.encodeObjectToURI=function(t){if(S.isObject(t)===!1)return"";var e=[];for(var n in t)t.hasOwnProperty(n)&&e.push(encodeURIComponent(n)+"="+encodeURIComponent(t[n]));return e.join("&")},S.readCookie=function(t){for(var i=t+"=",a=e.cookie.split(";"),r=0;r<a.length;r++){for(var s=a[r];" "==s.charAt(0);)s=s.substring(1,s.length);if(0===s.indexOf(i))return s.substring(i.length,s.length)}return n},S.setCookie=function(t,n,i){var a;if(i){var r=new Date;r.setTime(r.getTime()+24*i*60*60*1e3),a="; expires="+r.toGMTString()}else a="";e.cookie=t+"="+n+a+"; path=/"},S.removeCookie=function(t){S.setCookie(t,"",-1)},S.getElementProperty=function(t,e){if("@"===e.charAt(0)){var i=S.specialProperties[e.substring(1)];if(i)return i(t)}return"innerText"===e?S.text(t):e in t?t[e]:t.getAttribute?t.getAttribute(e):n},S.propertiesMatch=function(t,e){if(t)for(var n in t){var i=t[n],a=S.getElementProperty(e,n);if("string"==typeof i&&i!==a)return!1;if(i instanceof RegExp&&!i.test(a))return!1}return!0},S.isRightClick=function(t){var e;return t.which?e=3==t.which:t.button&&(e=2==t.button),e},S.ruleMatches=function(t,e,n,i){var a=t.condition,r=t.conditions,s=t.property,o=e.type,c=t.value,u=e.target||e.srcElement,l=n===u;if(t.event!==o&&("custom"!==t.event||t.customEvent!==o))return!1;if(!S.ruleInScope(t))return!1;if("click"===t.event&&S.isRightClick(e))return!1;if(t.isDefault&&i>0)return!1;if(t.expired)return!1;if("inview"===o&&e.inviewDelay!==t.inviewDelay)return!1;if(!l&&(t.bubbleFireIfParent===!1||0!==i&&t.bubbleFireIfChildFired===!1))return!1;if(t.selector&&!S.matchesCss(t.selector,n))return!1;if(!S.propertiesMatch(s,n))return!1;if(null!=c)if("string"==typeof c){if(c!==n.value)return!1}else if(!c.test(n.value))return!1;if(a)try{if(!a.call(n,e,u))return S.notify('Condition for rule "'+t.name+'" not met.',1),!1}catch(d){return S.notify('Condition for rule "'+t.name+'" not met. Error: '+d.message,1),!1}if(r){var h=S.find(r,function(i){try{return!i.call(n,e,u)}catch(a){return S.notify('Condition for rule "'+t.name+'" not met. Error: '+a.message,1),!0}});if(h)return S.notify("Condition "+h.toString()+' for rule "'+t.name+'" not met.',1),!1}return!0},S.evtHandlers={},S.bindEvent=function(t,e){var n=S.evtHandlers;n[t]||(n[t]=[]),n[t].push(e)},S.whenEvent=S.bindEvent,S.unbindEvent=function(t,e){var n=S.evtHandlers;if(n[t]){var i=S.indexOf(n[t],e);n[t].splice(i,1)}},S.bindEventOnce=function(t,e){var n=function(){S.unbindEvent(t,n),e.apply(null,arguments)};S.bindEvent(t,n)},S.isVMLPoisoned=function(t){if(!t)return!1;try{t.nodeName}catch(e){if("Attribute only valid on v:image"===e.message)return!0}return!1},S.handleEvent=function(t){if(!S.$data(t,"eventProcessed")){var e=t.type.toLowerCase(),n=t.target||t.srcElement,i=0,a=S.rules,r=(S.tools,S.evtHandlers[t.type]);if(S.isVMLPoisoned(n))return void S.notify("detected "+e+" on poisoned VML element, skipping.",1);r&&S.each(r,function(e){e(t)});var s=n&&n.nodeName;s?S.notify("detected "+e+" on "+n.nodeName,1):S.notify("detected "+e,1);for(var o=n;o;o=o.parentNode){var c=!1;if(S.each(a,function(e){S.ruleMatches(e,t,o,i)&&(S.notify('Rule "'+e.name+'" fired.',1),S.fireRule(e,o,t),i++,e.bubbleStop&&(c=!0))}),c)break}S.$data(t,"eventProcessed",!0)}},S.onEvent=e.querySelectorAll?function(t){S.handleEvent(t)}:function(){var t=[],e=function(e){e.selector?t.push(e):S.handleEvent(e)};return e.pendingEvents=t,e}(),S.fireEvent=function(t,e){S.onEvent({type:t,target:e})},S.registerEvents=function(t,e){for(var n=e.length-1;n>=0;n--){var i=e[n];S.$data(t,i+".tracked")||(S.addEventHandler(t,i,S.onEvent),S.$data(t,i+".tracked",!0))}},S.registerEventsForTags=function(t,n){for(var i=t.length-1;i>=0;i--)for(var a=t[i],r=e.getElementsByTagName(a),s=r.length-1;s>=0;s--)S.registerEvents(r[s],n)},S.setListeners=function(){var t=["click","submit"];S.each(S.rules,function(e){"custom"===e.event&&e.hasOwnProperty("customEvent")&&!S.contains(t,e.customEvent)&&t.push(e.customEvent)}),S.registerEvents(e,t)},S.setFormListeners=function(){S.registerEventsForTags(["input","select","textarea","button"],["select","change","focus","blur","keypress"])},S.setVideoListeners=function(){S.registerEventsForTags(["video"],["play","pause","ended","volumechange","stalled","timeupdate","loadeddata"])},S.readStoredSetting=function(e){try{return e="sdsat_"+e,t.localStorage.getItem(e)}catch(n){return S.notify("Cannot read stored setting from localStorage: "+n.message,2),null}},S.loadStoredSettings=function(){var t=S.readStoredSetting("debug"),e=S.readStoredSetting("hide_activity");t&&(S.settings.notifications="true"===t),e&&(S.settings.hideActivity="true"===e)},S.isRuleActive=function(t,e){function n(t,e){return e=a(e,{hour:t[f](),minute:t[p]()}),Math.floor(Math.abs((t.getTime()-e.getTime())/864e5))}function i(t,e){function n(t){return 12*t[d]()+t[h]()}return Math.abs(n(t)-n(e))}function a(t,e){var n=new Date(t.getTime());for(var i in e){var a=e[i];switch(i){case"hour":n[g](a);break;case"minute":n[m](a);break;case"date":n[v](a)}}return n}function r(t,e){var n=t[f](),i=t[p](),a=e[f](),r=e[p]();return 60*n+i>60*a+r}function s(t,e){var n=t[f](),i=t[p](),a=e[f](),r=e[p]();return 60*a+r>60*n+i}var o=t.schedule;if(!o)return!0;var c=o.utc,u=c?"getUTCDate":"getDate",l=c?"getUTCDay":"getDay",d=c?"getUTCFullYear":"getFullYear",h=c?"getUTCMonth":"getMonth",f=c?"getUTCHours":"getHours",p=c?"getUTCMinutes":"getMinutes",g=c?"setUTCHours":"setHours",m=c?"setUTCMinutes":"setMinutes",v=c?"setUTCDate":"setDate";if(e=e||new Date,o.repeat){if(r(o.start,e))return!1;if(s(o.end,e))return!1;if(e<o.start)return!1;if(o.endRepeat&&e>=o.endRepeat)return!1;if("daily"===o.repeat){if(o.repeatEvery){var y=n(o.start,e);if(y%o.repeatEvery!==0)return!1}}else if("weekly"===o.repeat){if(o.days){if(!S.contains(o.days,e[l]()))return!1}else if(o.start[l]()!==e[l]())return!1;if(o.repeatEvery){var b=n(o.start,e);if(b%(7*o.repeatEvery)!==0)return!1}}else if("monthly"===o.repeat){if(o.repeatEvery){var k=i(o.start,e);if(k%o.repeatEvery!==0)return!1}if(o.nthWeek&&o.mthDay){if(o.mthDay!==e[l]())return!1;var E=Math.floor((e[u]()-e[l]()+1)/7);if(o.nthWeek!==E)return!1}else if(o.start[u]()!==e[u]())return!1}else if("yearly"===o.repeat){if(o.start[h]()!==e[h]())return!1;if(o.start[u]()!==e[u]())return!1;if(o.repeatEvery){var b=Math.abs(o.start[d]()-e[d]());if(b%o.repeatEvery!==0)return!1}}}else{if(o.start>e)return!1;if(o.end<e)return!1}return!0},S.isOutboundLink=function(t){if(!t.getAttribute("href"))return!1;var e=t.hostname,n=(t.href,t.protocol);if("http:"!==n&&"https:"!==n)return!1;var i=S.any(S.settings.domainList,function(t){return S.isSubdomainOf(e,t)});return i?!1:e!==location.hostname},S.isLinkerLink=function(t){return t.getAttribute&&t.getAttribute("href")?S.hasMultipleDomains()&&t.hostname!=location.hostname&&!t.href.match(/^javascript/i)&&!S.isOutboundLink(t):!1},S.isSubdomainOf=function(t,e){if(t===e)return!0;var n=t.length-e.length;return n>0?S.equalsIgnoreCase(t.substring(n),e):!1},S.getVisitorId=function(){var t=S.getToolsByType("visitor_id");return 0===t.length?null:t[0].getInstance()},S.URI=function(){var t=e.location.pathname+e.location.search;return S.settings.forceLowerCase&&(t=t.toLowerCase()),t},S.URL=function(){var t=e.location.href;return S.settings.forceLowerCase&&(t=t.toLowerCase()),t},S.filterRules=function(){function t(t){return S.isRuleActive(t)?!0:!1}S.rules=S.filter(S.rules,t),S.pageLoadRules=S.filter(S.pageLoadRules,t)},S.ruleInScope=function(t,n){function i(t,e){function n(t){return e.match(t)}var i=t.include,r=t.exclude;if(i&&a(i,e))return!0;if(r){if(S.isString(r)&&r===e)return!0;if(S.isArray(r)&&S.any(r,n))return!0;if(S.isRegex(r)&&n(r))return!0}return!1}function a(t,e){function n(t){return e.match(t)}return S.isString(t)&&t!==e?!0:S.isArray(t)&&!S.any(t,n)?!0:S.isRegex(t)&&!n(t)?!0:!1}n=n||e.location;var r=t.scope;if(!r)return!0;var s=r.URI,o=r.subdomains,c=r.domains,u=r.protocols,l=r.hashes;return s&&i(s,n.pathname+n.search)?!1:o&&i(o,n.hostname)?!1:c&&a(c,n.hostname)?!1:u&&a(u,n.protocol)?!1:l&&i(l,n.hash)?!1:!0},S.backgroundTasks=function(){+new Date;S.setFormListeners(),S.setVideoListeners(),S.loadStoredSettings(),S.registerNewElementsForDynamicRules(),S.eventEmitterBackgroundTasks();+new Date},S.registerNewElementsForDynamicRules=function(){function t(e,n){var i=t.cache[e];return i?n(i):void S.cssQuery(e,function(i){t.cache[e]=i,n(i)})}t.cache={},S.each(S.dynamicRules,function(e){t(e.selector,function(t){S.each(t,function(t){if(!S.$data(t,"dynamicRules.seen")&&(S.$data(t,"dynamicRules.seen",!0),S.propertiesMatch(e.property,t))){var n="custom"===e.event?e.customEvent:e.event;S.registerEvents(t,[n])}})})})},S.ensureCSSSelector=function(){return e.querySelectorAll?void(S.hasSelector=!0):(S.loadingSizzle=!0,S.sizzleQueue=[],void S.loadScript(S.basePath()+"selector.js",function(){if(!S.Sizzle)return void S.logError(new Error("Failed to load selector.js"));var t=S.onEvent.pendingEvents;S.each(t,function(t){S.handleEvent(t)},this),S.onEvent=S.handleEvent,S.hasSelector=!0,delete S.loadingSizzle,S.each(S.sizzleQueue,function(t){S.cssQuery(t[0],t[1])}),delete S.sizzleQueue}))},S.errors=[],S.logError=function(t){S.errors.push(t),S.notify(t.name+" - "+t.message,5)},S.pageBottom=function(){S.initialized&&(S.pageBottomFired=!0,S.firePageLoadEvent("pagebottom"))},S.stagingLibraryOverride=function(){var t="true"===S.readStoredSetting("stagingLibrary");if(t){for(var n,i,a,r=e.getElementsByTagName("script"),s=/^(.*)satelliteLib-(.*)\.js$/,o=/^(.*)satelliteLib-(.*)-staging\.js$/,c=0,u=r.length;u>c&&(a=r[c].getAttribute("src"),!a||(n||(n=a.match(s)),i||(i=a.match(o)),!i));c++);if(n&&!i){var l=n[1]+"satelliteLib-"+n[2]+"-staging.js";if(e.write)e.write('<script src="'+l+'"></script>');else{var d=e.createElement("script");d.src=l,e.head.appendChild(d)}return!0}}return!1},S.checkAsyncInclude=function(){t.satellite_asyncLoad&&S.notify('You may be using the async installation of Satellite. In-page HTML and the "pagebottom" event will not work. Please update your Satellite installation for these features.',5)},S.hasMultipleDomains=function(){return!!S.settings.domainList&&S.settings.domainList.length>1},S.handleOverrides=function(){if(b)for(var t in b)b.hasOwnProperty(t)&&(S.data[t]=b[t])},S.privacyManagerParams=function(){var t={};S.extend(t,S.settings.privacyManagement);var e=[];for(var n in S.tools){var i=S.tools[n],a=i.settings;a&&"sc"===a.engine&&e.push(i)}var r=S.filter(S.map(e,function(t){return t.getTrackingServer()}),function(t){return null!=t});t.adobeAnalyticsTrackingServers=r;for(var s=["bannerText","headline","introductoryText","customCSS"],o=0;o<s.length;o++){var c=s[o],u=t[c];if(u)if("text"===u.type)t[c]=u.value;else{if("data"!==u.type)throw new Error("Invalid type: "+u.type);t[c]=S.getVar(u.value)}}return t},S.prepareLoadPrivacyManager=function(){function e(t){function e(){r++,r===a.length&&(n(),clearTimeout(s),t())}function n(){S.each(a,function(t){S.unbindEvent(t.id+".load",e)})}function i(){n(),t()}var a=S.filter(S.values(S.tools),function(t){return t.settings&&"sc"===t.settings.engine});if(0===a.length)return t();var r=0;S.each(a,function(t){S.bindEvent(t.id+".load",e)});var s=setTimeout(i,5e3)}S.addEventHandler(t,"load",function(){e(S.loadPrivacyManager)})},S.loadPrivacyManager=function(){var t=S.basePath()+"privacy_manager.js";S.loadScript(t,function(){var t=S.privacyManager;t.configure(S.privacyManagerParams()),t.openIfRequired()})},S.init=function(e){if(!S.stagingLibraryOverride()){S.configurationSettings=e;var i=e.tools;delete e.tools;for(var a in e)S[a]=e[a];S.data.customVars===n&&(S.data.customVars={}),S.data.queryParams=S.QueryParams.normal,S.handleOverrides(),S.detectBrowserInfo(),S.trackVisitorInfo&&S.trackVisitorInfo(),S.loadStoredSettings(),S.Logger.setOutputState(S.settings.notifications),S.checkAsyncInclude(),S.ensureCSSSelector(),S.filterRules(),S.dynamicRules=S.filter(S.rules,function(t){return t.eventHandlerOnElement}),S.tools=S.initTools(i),S.initEventEmitters(),S.firePageLoadEvent("aftertoolinit"),S.settings.privacyManagement&&S.prepareLoadPrivacyManager(),S.hasSelector&&S.domReady(S.eventEmitterBackgroundTasks),S.setListeners(),S.domReady(function(){S.poll(function(){S.backgroundTasks()},S.settings.recheckEvery||3e3)}),S.domReady(function(){S.domReadyFired=!0,S.pageBottomFired||S.pageBottom(),S.firePageLoadEvent("domready")}),S.addEventHandler(t,"load",function(){S.firePageLoadEvent("windowload")}),S.firePageLoadEvent("pagetop"),S.initialized=!0}},S.pageLoadPhases=["aftertoolinit","pagetop","pagebottom","domready","windowload"],S.loadEventBefore=function(t,e){return S.indexOf(S.pageLoadPhases,t)<=S.indexOf(S.pageLoadPhases,e)},S.flushPendingCalls=function(t){t.pending&&(S.each(t.pending,function(e){var n=e[0],i=e[1],a=e[2],r=e[3];n in t?t[n].apply(t,[i,a].concat(r)):t.emit?t.emit(n,i,a,r):S.notify("Failed to trigger "+n+" for tool "+t.id,1)}),delete t.pending)},S.setDebug=function(e){try{t.localStorage.setItem("sdsat_debug",e)}catch(n){S.notify("Cannot set debug mode: "+n.message,2)}},S.detectBrowserInfo=function(){function t(t){return function(e){for(var n in t){var i=t[n],a=i.test(e);if(a)return n}return"Unknown"}}var e=t({OmniWeb:/OmniWeb/,"Opera Mini":/Opera Mini/,"Opera Mobile":/Opera Mobi/,Opera:/Opera/,"Mobile Safari":/Mobile(\/[0-9A-z]+)? Safari/,Chrome:/Chrome/,Firefox:/Firefox/,"IE Mobile":/IEMobile/,IE:/MSIE|Trident/,Safari:/Safari/}),n=t({iOS:/iPhone|iPad|iPod/,Blackberry:/BlackBerry/,"Symbian OS":/SymbOS/,Maemo:/Maemo/,Android:/Android [0-9\.]+;/,Linux:/ Linux /,Unix:/FreeBSD|OpenBSD|CrOS/,Windows:/[\( ]Windows /,MacOS:/Macintosh;/}),i=t({iPhone:/iPhone/,iPad:/iPad/,iPod:/iPod/,Nokia:/SymbOS|Maemo/,"Windows Phone":/IEMobile/,Blackberry:/BlackBerry/,Android:/Android [0-9\.]+;/,Desktop:/.*/}),a=navigator.userAgent;S.browserInfo={browser:e(a),os:n(a),deviceType:i(a)}},S.isHttps=function(){return"https:"==e.location.protocol},S.BaseTool=function(t){this.settings=t||{},this.forceLowerCase=S.settings.forceLowerCase,"forceLowerCase"in this.settings&&(this.forceLowerCase=this.settings.forceLowerCase)},S.BaseTool.prototype={triggerCommand:function(t,e,n){var i=this.settings||{};if(this.initialize&&this.isQueueAvailable()&&this.isQueueable(t)&&n&&S.loadEventBefore(n.type,i.loadOn))return void this.queueCommand(t,e,n);var a=t.command,r=this["$"+a],s=r?r.escapeHtml:!1,o=S.preprocessArguments(t.arguments,e,n,this.forceLowerCase,s);r?r.apply(this,[e,n].concat(o)):this.$missing$?this.$missing$(a,e,n,o):S.notify("Failed to trigger "+a+" for tool "+this.id,1)},endPLPhase:function(){},isQueueable:function(t){return"cancelToolInit"!==t.command},isQueueAvailable:function(){return!this.initialized&&!this.initializing},flushQueue:function(){this.pending&&(S.each(this.pending,function(t){this.triggerCommand.apply(this,t)},this),this.pending=[])},queueCommand:function(t,e,n){this.pending||(this.pending=[]),this.pending.push([t,e,n])},$cancelToolInit:function(){this._cancelToolInit=!0}},t._satellite=S,i.orientationChange=function(e){var n=0===t.orientation?"portrait":"landscape";e.orientation=n,S.onEvent(e)},S.availableEventEmitters.push(i),a.prototype={initialize:function(){this.setupHistoryAPI(),this.setupHashChange()},fireIfURIChanged:function(){var t=S.URL();this.lastURL!==t&&(this.fireEvent(),this.lastURL=t)},fireEvent:function(){S.updateQueryParams(),S.onEvent({type:"locationchange",target:e})},setupSPASupport:function(){this.setupHistoryAPI(),this.setupHashChange()},setupHistoryAPI:function(){var e=t.history;e&&(e.pushState&&(this.originalPushState=e.pushState,e.pushState=this._pushState),e.replaceState&&(this.originalReplaceState=e.replaceState,e.replaceState=this._replaceState)),S.addEventHandler(t,"popstate",this._onPopState)},pushState:function(){var t=this.originalPushState.apply(history,arguments);return this.onPushState(),t},replaceState:function(){var t=this.originalReplaceState.apply(history,arguments);return this.onReplaceState(),t},setupHashChange:function(){S.addEventHandler(t,"hashchange",this._onHashChange)},onReplaceState:function(){setTimeout(this._fireIfURIChanged,0)},onPushState:function(){setTimeout(this._fireIfURIChanged,0)},onPopState:function(){setTimeout(this._fireIfURIChanged,0)},onHashChange:function(){setTimeout(this._fireIfURIChanged,0)},uninitialize:function(){this.cleanUpHistoryAPI(),this.cleanUpHashChange()},cleanUpHistoryAPI:function(){history.pushState===this._pushState&&(history.pushState=this.originalPushState),history.replaceState===this._replaceState&&(history.replaceState=this.originalReplaceState),S.removeEventHandler(t,"popstate",this._onPopState)},cleanUpHashChange:function(){S.removeEventHandler(t,"hashchange",this._onHashChange)}},S.availableEventEmitters.push(a),r.prototype.backgroundTasks=function(){S.each(this.rules,function(t){S.cssQuery(t.selector,function(t){if(t.length>0){var e=t[0];if(S.$data(e,"elementexists.seen"))return;S.$data(e,"elementexists.seen",!0),S.onEvent({type:"elementexists",target:e})}})})},S.availableEventEmitters.push(r),s.prototype={backgroundTasks:function(){var t=this.eventHandler;S.each(this.rules,function(e){S.cssQuery(e.selector||"video",function(e){S.each(e,function(e){S.$data(e,"videoplayed.tracked")||(S.addEventHandler(e,"timeupdate",S.throttle(t,100)),S.$data(e,"videoplayed.tracked",!0))
})})})},evalRule:function(t,e){var n=e.event,i=t.seekable,a=i.start(0),r=i.end(0),s=t.currentTime,o=e.event.match(/^videoplayed\(([0-9]+)([s%])\)$/);if(o){var c=o[2],u=Number(o[1]),l="%"===c?function(){return 100*(s-a)/(r-a)>=u}:function(){return s-a>=u};!S.$data(t,n)&&l()&&(S.$data(t,n,!0),S.onEvent({type:n,target:t}))}},onUpdateTime:function(t){var e=this.rules,n=t.target;if(n.seekable&&0!==n.seekable.length)for(var i=0,a=e.length;a>i;i++)this.evalRule(n,e[i])}},S.availableEventEmitters.push(s),o.prototype={backgroundTasks:function(){var t=this;S.each(this.rules,function(e){var n=e[1],i=e[0];S.cssQuery(n,function(e){S.each(e,function(e){t.trackElement(e,i)})})},this)},trackElement:function(t,e){var n=this,i=S.$data(t,"hover.delays");i?S.contains(i,e)||i.push(e):(S.addEventHandler(t,"mouseover",function(e){n.onMouseOver(e,t)}),S.addEventHandler(t,"mouseout",function(e){n.onMouseOut(e,t)}),S.$data(t,"hover.delays",[e]))},onMouseOver:function(t,e){var n=t.target||t.srcElement,i=t.relatedTarget||t.fromElement,a=(e===n||S.containsElement(e,n))&&!S.containsElement(e,i);a&&this.onMouseEnter(e)},onMouseEnter:function(t){var e=S.$data(t,"hover.delays"),n=S.map(e,function(e){return setTimeout(function(){S.onEvent({type:"hover("+e+")",target:t})},e)});S.$data(t,"hover.delayTimers",n)},onMouseOut:function(t,e){var n=t.target||t.srcElement,i=t.relatedTarget||t.toElement,a=(e===n||S.containsElement(e,n))&&!S.containsElement(e,i);a&&this.onMouseLeave(e)},onMouseLeave:function(t){var e=S.$data(t,"hover.delayTimers");e&&S.each(e,function(t){clearTimeout(t)})}},S.availableEventEmitters.push(o),c.prototype={initialize:function(){var t=this.twttr;t&&"function"==typeof t.ready&&t.ready(S.bind(this.bind,this))},bind:function(){this.twttr.events.bind("tweet",function(t){t&&(S.notify("tracking a tweet button",1),S.onEvent({type:"twitter.tweet",target:e}))})}},S.availableEventEmitters.push(c),u.prototype={initialize:function(){return this.FB=this.FB||t.FB,this.FB&&this.FB.Event&&this.FB.Event.subscribe?(this.bind(),!0):void 0},bind:function(){this.FB.Event.subscribe("edge.create",function(){S.notify("tracking a facebook like",1),S.onEvent({type:"facebook.like",target:e})}),this.FB.Event.subscribe("edge.remove",function(){S.notify("tracking a facebook unlike",1),S.onEvent({type:"facebook.unlike",target:e})}),this.FB.Event.subscribe("message.send",function(){S.notify("tracking a facebook share",1),S.onEvent({type:"facebook.send",target:e})})}},S.availableEventEmitters.push(u),l.offset=function(n){var i;try{i=n.getBoundingClientRect()}catch(a){}var r=e,s=r.documentElement,o=r.body,c=t,u=s.clientTop||o.clientTop||0,l=s.clientLeft||o.clientLeft||0,d=c.pageYOffset||s.scrollTop||o.scrollTop,h=c.pageXOffset||s.scrollLeft||o.scrollLeft,f=i.top+d-u,p=i.left+h-l;return{top:f,left:p}},l.getViewportHeight=function(){var n=t.innerHeight,i=e.compatMode;return i&&(n="CSS1Compat"==i?e.documentElement.clientHeight:e.body.clientHeight),n},l.getScrollTop=function(){return e.documentElement.scrollTop?e.documentElement.scrollTop:e.body.scrollTop},l.prototype={backgroundTasks:function(){var t=this.elements;S.each(this.rules,function(e){S.cssQuery(e.selector,function(n){var i=0;S.each(n,function(e){S.contains(t,e)||(t.push(e),i++)}),i&&S.notify(e.selector+" added "+i+" elements.",1)})}),this.track()},elementIsInView:function(t){var e=l.getViewportHeight(),n=l.getScrollTop(),i=l.offset(t).top,a=t.offsetHeight;return!(n>i+a||i>n+e)},checkInView:function(t,e){var n=S.$data(t,"inview");if(this.elementIsInView(t)){n||S.$data(t,"inview",!0);var i=this;this.processRules(t,function(n,a,r){if(e||!n.inviewDelay)S.$data(t,a,!0),S.onEvent({type:"inview",target:t,inviewDelay:n.inviewDelay});else if(n.inviewDelay){var s=S.$data(t,r);s&&clearTimeout(s),s=setTimeout(function(){i.checkInView(t,!0)},n.inviewDelay),S.$data(t,r,s)}})}else n&&S.$data(t,"inview",!1),this.processRules(t,function(e,n,i){var a=S.$data(t,i);a&&clearTimeout(a)})},track:function(){S.each(this.elements,function(t){this.checkInView(t)},this)},processRules:function(t,e){S.each(this.rules,function(n,i){var a=n.inviewDelay?"viewed_"+n.inviewDelay:"viewed",r="inview_timeout_id_"+i;S.$data(t,a)||S.matchesCss(n.selector,t)&&e(n,a,r)})}},S.availableEventEmitters.push(l),S.extend(d.prototype,{getInstance:function(){return this.instance},initialize:function(){var t,e=this.settings;S.notify("Visitor ID: Initializing tool",1),t=this.createInstance(e.mcOrgId,e.namespace,e.initVars),null!==t&&(e.customerIDs&&this.applyCustomerIDs(t,e.customerIDs),e.autoRequest&&t.getMarketingCloudVisitorID(),this.instance=t)},createInstance:function(t,e,n){if(!S.isString(t))return S.notify('Visitor ID: Cannot create instance using mcOrgId: "'+t+'"',4),null;S.notify('Visitor ID: Create instance using mcOrgId: "'+t+'"',1);var i=new Visitor(t,e);return this.applyInitVars(i,n),i},applyInitVars:function(t,e){S.isObject(e)!==!1&&(e=this.parseValues(e),S.extend(t,e),S.notify("Visitor ID: Set variables: "+S.stringify(e),1))},applyCustomerIDs:function(t,e){S.isObject(e)!==!1&&(e=this.parseValues(e),t.setCustomerIDs(e),S.notify("Visitor ID: Set Customer IDs: "+S.stringify(e),1))},parseValues:function(t){var e={};for(var n in t)t.hasOwnProperty(n)&&(e[n]=S.replace(t[n]));return e}}),S.availableTools.visitor_id=d,S.inherit(h,S.BaseTool),S.extend(h.prototype,{name:"GA",initialize:function(){var e=this.settings,n=t._gaq,i=e.initCommands||[],a=e.customInit;if(n||(_gaq=[]),this.isSuppressed())S.notify("GA: page code not loaded(suppressed).",1);else{if(!n&&!h.scriptLoaded){var r=S.isHttps(),s=(r?"https://ssl":"http://www")+".google-analytics.com/ga.js";e.url&&(s=r?e.url.https:e.url.http),S.loadScript(s),h.scriptLoaded=!0,S.notify("GA: page code loaded.",1)}{var o=(e.domain,e.trackerName),c=k.allowLinker(),u=S.replace(e.account,location);S.settings.domainList||[]}_gaq.push([this.cmd("setAccount"),u]),c&&_gaq.push([this.cmd("setAllowLinker"),c]),_gaq.push([this.cmd("setDomainName"),k.cookieDomain()]),S.each(i,function(t){var e=[this.cmd(t[0])].concat(S.preprocessArguments(t.slice(1),location,null,this.forceLowerCase));_gaq.push(e)},this),a&&(this.suppressInitialPageView=!1===a(_gaq,o)),e.pageName&&this.$overrideInitialPageView(null,null,e.pageName)}this.initialized=!0,S.fireEvent(this.id+".configure",_gaq,o)},isSuppressed:function(){return this._cancelToolInit||this.settings.initTool===!1},tracker:function(){return this.settings.trackerName},cmd:function(t){var e=this.tracker();return e?e+"._"+t:"_"+t},$overrideInitialPageView:function(t,e,n){this.urlOverride=n},trackInitialPageView:function(){if(!this.isSuppressed()&&!this.suppressInitialPageView)if(this.urlOverride){var t=S.preprocessArguments([this.urlOverride],location,null,this.forceLowerCase);this.$missing$("trackPageview",null,null,t)}else this.$missing$("trackPageview")},endPLPhase:function(t){var e=this.settings.loadOn;t===e&&(S.notify("GA: Initializing at "+t,1),this.initialize(),this.flushQueue(),this.trackInitialPageView())},call:function(t,e,n,i){if(!this._cancelToolInit){var a=(this.settings,this.tracker()),r=this.cmd(t),i=i?[r].concat(i):[r];_gaq.push(i),a?S.notify("GA: sent command "+t+" to tracker "+a+(i.length>1?" with parameters ["+i.slice(1).join(", ")+"]":"")+".",1):S.notify("GA: sent command "+t+(i.length>1?" with parameters ["+i.slice(1).join(", ")+"]":"")+".",1)}},$missing$:function(t,e,n,i){this.call(t,e,n,i)},$postTransaction:function(e,n,i){var a=S.data.customVars.transaction=t[i];this.call("addTrans",e,n,[a.orderID,a.affiliation,a.total,a.tax,a.shipping,a.city,a.state,a.country]),S.each(a.items,function(t){this.call("addItem",e,n,[t.orderID,t.sku,t.product,t.category,t.unitPrice,t.quantity])},this),this.call("trackTrans",e,n)},delayLink:function(t,e){var n=this;if(k.allowLinker()&&t.hostname.match(this.settings.linkerDomains)&&!S.isSubdomainOf(t.hostname,location.hostname)){S.preventDefault(e);var i=S.settings.linkDelay||100;setTimeout(function(){n.call("link",t,e,[t.href])},i)}},popupLink:function(e,n){if(t._gat){S.preventDefault(n);var i=this.settings.account,a=t._gat._createTracker(i),r=a._getLinkerUrl(e.href);t.open(r)}},$link:function(t,e){"_blank"===t.getAttribute("target")?this.popupLink(t,e):this.delayLink(t,e)},$trackEvent:function(t,e){var n=Array.prototype.slice.call(arguments,2);if(n.length>=4&&null!=n[3]){var i=parseInt(n[3],10);S.isNaN(i)&&(i=1),n[3]=i}this.call("trackEvent",t,e,n)}}),S.availableTools.ga=h,S.inherit(f,S.BaseTool),S.extend(f.prototype,{name:"GAUniversal",endPLPhase:function(t){var e=this.settings,n=e.loadOn;t===n&&(S.notify("GAU: Initializing at "+t,1),this.initialize(),this.flushQueue(),this.trackInitialPageView())},getTrackerName:function(){return this.settings.trackerSettings.name||""},isPageCodeLoadSuppressed:function(){return this.settings.initTool===!1||this._cancelToolInit===!0},initialize:function(){if(this.isPageCodeLoadSuppressed())return this.initialized=!0,void S.notify("GAU: Page code not loaded (suppressed).",1);var e="ga";t[e]=t[e]||this.createGAObject(),t.GoogleAnalyticsObject=e,S.notify("GAU: Page code loaded.",1),S.loadScriptOnce(this.getToolUrl());var n=this.settings;if(k.allowLinker()&&n.allowLinker!==!1?this.createAccountForLinker():this.createAccount(),this.executeInitCommands(),n.customInit){var i=n.customInit,a=i(t[e],this.getTrackerName());a===!1&&(this.suppressInitialPageView=!0)}this.initialized=!0},createGAObject:function(){var t=function(){t.q.push(arguments)};return t.q=[],t.l=1*new Date,t},createAccount:function(){this.create()},createAccountForLinker:function(){var t={};k.allowLinker()&&(t.allowLinker=!0),this.create(t),this.call("require","linker"),this.call("linker:autoLink",this.autoLinkDomains(),!1,!0)},create:function(t){var e=this.settings.trackerSettings;e=S.preprocessArguments([e],location,null,this.forceLowerCase)[0],e.trackingId=S.replace(this.settings.trackerSettings.trackingId,location),e.cookieDomain||(e.cookieDomain=k.cookieDomain()),S.extend(e,t||{}),this.call("create",e)},autoLinkDomains:function(){var t=location.hostname;return S.filter(S.settings.domainList,function(e){return e!==t})},executeInitCommands:function(){var t=this.settings;t.initCommands&&S.each(t.initCommands,function(t){var e=t.splice(2,t.length-2);t=t.concat(S.preprocessArguments(e,location,null,this.forceLowerCase)),this.call.apply(this,t)},this)},trackInitialPageView:function(){this.suppressInitialPageView||this.isPageCodeLoadSuppressed()||this.call("send","pageview")},call:function(){return"function"!=typeof ga?void S.notify("GA Universal function not found!",4):void(this.isCallSuppressed()||(arguments[0]=this.cmd(arguments[0]),this.log(S.toArray(arguments)),ga.apply(t,arguments)))},isCallSuppressed:function(){return this._cancelToolInit===!0},$missing$:function(t,e,n,i){i=i||[],i=[t].concat(i),this.call.apply(this,i)},getToolUrl:function(){var t=this.settings,e=S.isHttps();return t.url?e?t.url.https:t.url.http:(e?"https://ssl":"http://www")+".google-analytics.com/analytics.js"},cmd:function(t){var e=["send","set","get"],n=this.getTrackerName();return n&&-1!==S.indexOf(e,t)?n+"."+t:t},log:function(t){var e=t[0],n=this.getTrackerName()||"default",i="GA Universal: sent command "+e+" to tracker "+n;if(t.length>1){{S.stringify(t.slice(1))}i+=" with parameters "+S.stringify(t.slice(1))}i+=".",S.notify(i,1)}}),S.availableTools.ga_universal=f;var k={allowLinker:function(){return S.hasMultipleDomains()},cookieDomain:function(){var e=S.settings.domainList,n=S.find(e,function(e){var n=t.location.hostname;return S.equalsIgnoreCase(n.slice(n.length-e.length),e)}),i=n?"."+n:"auto";return i}};S.inherit(p,S.BaseTool),S.extend(p.prototype,{name:"SC",endPLPhase:function(t){var e=this.settings.loadOn;t===e&&this.initialize(t)},initialize:function(e){if(!this._cancelToolInit)if(this.settings.initVars=this.substituteVariables(this.settings.initVars,{type:e}),this.settings.initTool!==!1){var n=this.settings.sCodeURL||S.basePath()+"s_code.js";"object"==typeof n&&(n="https:"===t.location.protocol?n.https:n.http),n.match(/^https?:/)||(n=S.basePath()+n),this.settings.initVars&&this.$setVars(null,null,this.settings.initVars),S.loadScript(n,S.bind(this.onSCodeLoaded,this)),this.initializing=!0}else this.initializing=!0,this.pollForSC()},getS:function(e,n){var i=n&&n.hostname||t.location.hostname,a=this.concatWithToolVarBindings(n&&n.setVars||this.varBindings),r=n&&n.addEvent||this.events,s=this.getAccount(i),o=t.s_gi;if(!o)return null;if(this.isValidSCInstance(e)||(e=null),!s&&!e)return S.notify("Adobe Analytics: tracker not initialized because account was not found",1),null;var e=e||o(s),c="D"+S.appVersion;"undefined"!=typeof e.tagContainerMarker?e.tagContainerMarker=c:"string"==typeof e.version&&e.version.substring(e.version.length-5)!=="-"+c&&(e.version+="-"+c),e.sa&&this.settings.skipSetAccount!==!0&&this.settings.initTool!==!1&&e.sa(this.settings.account),this.applyVarBindingsOnTracker(e,a),r.length>0&&(e.events=r.join(","));var u=S.getVisitorId();return u&&(e.visitor=S.getVisitorId()),e},onSCodeLoaded:function(){this.initialized=!0,this.initializing=!1,S.notify("Adobe Analytics: loaded.",1),S.fireEvent(this.id+".load",this.getS()),this.flushQueueExceptTrackLink(),this.sendBeacon(),this.flushQueue()},getAccount:function(e){return t.s_account?t.s_account:e&&this.settings.accountByHost?this.settings.accountByHost[e]||this.settings.account:this.settings.account},getTrackingServer:function(){var e=this,n=e.getS();if(n&&n.trackingServer)return n.trackingServer;var i=e.getAccount(t.location.hostname);if(!i)return null;var a,r,s,o="",c=n&&n.dc;return a=i,r=a.indexOf(","),r>=0&&(a=a.gb(0,r)),a=a.replace(/[^A-Za-z0-9]/g,""),o||(o="2o7.net"),c=c?(""+c).toLowerCase():"d1","2o7.net"==o&&("d1"==c?c="112":"d2"==c&&(c="122"),s=""),r=a+"."+c+"."+s+o},sendBeacon:function(){var e=this.getS(t[this.settings.renameS||"s"]);return e?this.settings.customInit&&this.settings.customInit(e)===!1?void S.notify("Adobe Analytics: custom init suppressed beacon",1):(this.settings.executeCustomPageCodeFirst&&this.applyVarBindingsOnTracker(e,this.varBindings),this.executeCustomSetupFuns(e),e.t(),this.clearVarBindings(),this.clearCustomSetup(),void S.notify("Adobe Analytics: tracked page view",1)):void S.notify("Adobe Analytics: page code not loaded",1)},pollForSC:function(){S.poll(S.bind(function(){return"function"==typeof t.s_gi?(this.initialized=!0,this.initializing=!1,S.notify("Adobe Analytics: loaded (manual).",1),S.fireEvent(this.id+".load",this.getS()),this.flushQueue(),!0):void 0},this))},flushQueueExceptTrackLink:function(){if(this.pending){for(var t=[],e=0;e<this.pending.length;e++){var n=this.pending[e],i=n[0];"trackLink"===i.command?t.push(n):this.triggerCommand.apply(this,n)}this.pending=t}},isQueueAvailable:function(){return!this.initialized},substituteVariables:function(t,e){var n={};for(var i in t){var a=t[i];n[i]=S.replace(a,location,e)}return n},$setVars:function(t,e,n){for(var i in n){var a=n[i];"function"==typeof a&&(a=a()),this.varBindings[i]=a}S.notify("Adobe Analytics: set variables.",2)},$customSetup:function(t,e,n){this.customSetupFuns.push(function(i){n.call(t,e,i)})},isValidSCInstance:function(t){return!!t&&"function"==typeof t.t&&"function"==typeof t.tl},concatWithToolVarBindings:function(t){var e=this.settings.initVars||{};return S.map(["trackingServer","trackingServerSecure"],function(n){e[n]&&!t[n]&&(t[n]=e[n])}),t},applyVarBindingsOnTracker:function(t,e){for(var n in e)t[n]=e[n]},clearVarBindings:function(){this.varBindings={}},clearCustomSetup:function(){this.customSetupFuns=[]},executeCustomSetupFuns:function(e){S.each(this.customSetupFuns,function(n){n.call(t,e)})},$trackLink:function(t,e,n){n=n||{};var i=n.type,a=n.linkName;!a&&t&&t.nodeName&&"a"===t.nodeName.toLowerCase()&&(a=t.innerHTML),a||(a="link clicked");var r=n&&n.setVars,s=n&&n.addEvent||[],o=this.getS(null,{setVars:r,addEvent:s});if(!o)return void S.notify("Adobe Analytics: page code not loaded",1);var c=o.linkTrackVars,u=o.linkTrackEvents,l=this.definedVarNames(r);n&&n.customSetup&&n.customSetup.call(t,e,o),s.length>0&&l.push("events"),o.products&&l.push("products"),l=this.mergeTrackLinkVars(o.linkTrackVars,l),s=this.mergeTrackLinkVars(o.linkTrackEvents,s),o.linkTrackVars=this.getCustomLinkVarsList(l);var d=S.map(s,function(t){return t.split(":")[0]});o.linkTrackEvents=this.getCustomLinkVarsList(d),o.tl(!0,i||"o",a),S.notify(["Adobe Analytics: tracked link ","using: linkTrackVars=",S.stringify(o.linkTrackVars),"; linkTrackEvents=",S.stringify(o.linkTrackEvents)].join(""),1),o.linkTrackVars=c,o.linkTrackEvents=u},mergeTrackLinkVars:function(t,e){return t&&(e=t.split(",").concat(e)),e},getCustomLinkVarsList:function(t){var e=S.indexOf(t,"None");return e>-1&&t.length>1&&t.splice(e,1),t.join(",")},definedVarNames:function(t){t=t||this.varBindings;var e=[];for(var n in t)/^(eVar[0-9]+)|(prop[0-9]+)|(hier[0-9]+)|campaign|purchaseID|channel|server|state|zip|pageType$/.test(n)&&e.push(n);return e},$trackPageView:function(t,e,n){var i=n&&n.setVars,a=n&&n.addEvent||[],r=this.getS(null,{setVars:i,addEvent:a});return r?(r.linkTrackVars="",r.linkTrackEvents="",this.executeCustomSetupFuns(r),n&&n.customSetup&&n.customSetup.call(t,e,r),r.t(),this.clearVarBindings(),this.clearCustomSetup(),void S.notify("Adobe Analytics: tracked page view",1)):void S.notify("Adobe Analytics: page code not loaded",1)},$postTransaction:function(e,n,i){var a=S.data.transaction=t[i],r=this.varBindings,s=this.settings.fieldVarMapping;if(S.each(a.items,function(t){this.products.push(t)},this),r.products=S.map(this.products,function(t){var e=[];if(s&&s.item)for(var n in s.item){var i=s.item[n];e.push(i+"="+t[n]),"event"===i.substring(0,5)&&this.events.push(i)}var a=["",t.product,t.quantity,t.unitPrice*t.quantity];return e.length>0&&a.push(e.join("|")),a.join(";")},this).join(","),s&&s.transaction){var o=[];for(var c in s.transaction){var i=s.transaction[c];o.push(i+"="+a[c]),"event"===i.substring(0,5)&&this.events.push(i)}r.products.length>0&&(r.products+=","),r.products+=";;;;"+o.join("|")}},$addEvent:function(){for(var t=2,e=arguments.length;e>t;t++)this.events.push(arguments[t])},$addProduct:function(){for(var t=2,e=arguments.length;e>t;t++)this.products.push(arguments[t])}}),S.availableTools.sc=p,S.inherit(g,S.BaseTool),S.extend(g.prototype,{name:"Default",$loadIframe:function(e,n,i){var a=i.pages,r=i.loadOn,s=S.bind(function(){S.each(a,function(t){this.loadIframe(e,n,t)},this)},this);r||s(),"domready"===r&&S.domReady(s),"load"===r&&S.addEventHandler(t,"load",s)},loadIframe:function(t,n,i){var a=e.createElement("iframe");a.style.display="none";var r=S.data.host,s=i.data,o=this.scriptURL(i.src),c=S.searchVariables(s,t,n);r&&(o=S.basePath()+o),o+=c,a.src=o;var u=e.getElementsByTagName("body")[0];u?u.appendChild(a):S.domReady(function(){e.getElementsByTagName("body")[0].appendChild(a)})},scriptURL:function(t){var e=S.settings.scriptDir||"";return e+t},$loadScript:function(e,n,i){var a=i.scripts,r=i.sequential,s=i.loadOn,o=S.bind(function(){r?this.loadScripts(e,n,a):S.each(a,function(t){this.loadScripts(e,n,[t])},this)},this);s?"domready"===s?S.domReady(o):"load"===s&&S.addEventHandler(t,"load",o):o()},loadScripts:function(t,e,n){function i(){if(r.length>0&&a){var c=r.shift();c.call(t,e,s)}var u=n.shift();if(u){var l=S.data.host,d=o.scriptURL(u.src);l&&(d=S.basePath()+d),a=u,S.loadScript(d,i)}}try{var a,n=n.slice(0),r=this.asyncScriptCallbackQueue,s=e.target||e.srcElement,o=this}catch(c){console.error("scripts is",S.stringify(n))}i()},$loadBlockingScript:function(t,e,n){var i=n.scripts,a=(n.loadOn,S.bind(function(){S.each(i,function(n){this.loadBlockingScript(t,e,n)},this)},this));a()},loadBlockingScript:function(t,e,n){var i=this.scriptURL(n.src),a=S.data.host,r=e.target||e.srcElement;a&&(i=S.basePath()+i),this.argsForBlockingScripts.push([t,e,r]),S.loadScriptSync(i)},pushAsyncScript:function(t){this.asyncScriptCallbackQueue.push(t)},pushBlockingScript:function(t){var e=this.argsForBlockingScripts.shift(),n=e[0];t.apply(n,e.slice(1))},$writeHTML:S.escapeHtmlParams(function(t,n){if(S.domReadyFired||!e.write)return void S.notify("Command writeHTML failed. You should try appending HTML using the async option.",1);if("pagebottom"!==n.type&&"pagetop"!==n.type)return void S.notify("You can only use writeHTML on the `pagetop` and `pagebottom` events.",1);for(var i=2,a=arguments.length;a>i;i++){var r=arguments[i].html;r=S.replace(r,t,n),e.write(r)}}),linkNeedsDelayActivate:function(e,n){n=n||t;var i=e.tagName,a=e.getAttribute("target"),r=e.getAttribute("href");return i&&"a"!==i.toLowerCase()?!1:r?a?"_blank"===a?!1:"_top"===a?n.top===n:"_parent"===a?!1:"_self"===a?!0:n.name?a===n.name:!0:!0:!1},$delayActivateLink:function(t,e){if(this.linkNeedsDelayActivate(t)){S.preventDefault(e);var n=S.settings.linkDelay||100;setTimeout(function(){S.setLocation(t.href)},n)}},isQueueable:function(t){return"writeHTML"!==t.command}}),S.availableTools["default"]=g,S.inherit(m,S.BaseTool),S.extend(m.prototype,{name:"tnt",endPLPhase:function(t){"aftertoolinit"===t&&this.initialize()},initialize:function(){S.notify("Test & Target: Initializing",1),this.initializeTargetPageParams(),this.load()},initializeTargetPageParams:function(){t.targetPageParams&&this.updateTargetPageParams(this.parseTargetPageParamsResult(t.targetPageParams())),this.updateTargetPageParams(this.settings.pageParams),this.setTargetPageParamsFunction()},load:function(){var t=this.getMboxURL(this.settings.mboxURL);this.settings.initTool!==!1?this.settings.loadSync?(S.loadScriptSync(t),this.onScriptLoaded()):(S.loadScript(t,S.bind(this.onScriptLoaded,this)),this.initializing=!0):this.initialized=!0},getMboxURL:function(e){var n=e;return S.isObject(e)&&(n="https:"===t.location.protocol?e.https:e.http),n.match(/^https?:/)?n:S.basePath()+n},onScriptLoaded:function(){S.notify("Test & Target: loaded.",1),this.flushQueue(),this.initialized=!0,this.initializing=!1},$addMbox:function(t,e,n){var i=n.mboxGoesAround,a=i+"{visibility: hidden;}",r=this.appendStyle(a);i in this.styleElements||(this.styleElements[i]=r),this.initialized?this.$addMBoxStep2(null,null,n):this.initializing&&this.queueCommand({command:"addMBoxStep2",arguments:[n]},t,e)},$addMBoxStep2:function(n,i,a){var r=this.generateID(),s=this;S.addEventHandler(t,"load",S.bind(function(){S.cssQuery(a.mboxGoesAround,function(n){var i=n[0];if(i){var o=e.createElement("div");o.id=r,i.parentNode.replaceChild(o,i),o.appendChild(i),t.mboxDefine(r,a.mboxName);var c=[a.mboxName];a.arguments&&(c=c.concat(a.arguments)),t.mboxUpdate.apply(null,c),s.reappearWhenCallComesBack(i,r,a.timeout,a)}})},this)),this.lastMboxID=r},$addTargetPageParams:function(t,e,n){this.updateTargetPageParams(n)},generateID:function(){var t="_sdsat_mbox_"+String(Math.random()).substring(2)+"_";return t},appendStyle:function(t){var n=e.getElementsByTagName("head")[0],i=e.createElement("style");return i.type="text/css",i.styleSheet?i.styleSheet.cssText=t:i.appendChild(e.createTextNode(t)),n.appendChild(i),i},reappearWhenCallComesBack:function(t,e,n,i){function a(){var t=r.styleElements[i.mboxGoesAround];t&&(t.parentNode.removeChild(t),delete r.styleElements[i.mboxGoesAround])}var r=this;S.cssQuery('script[src*="omtrdc.net"]',function(t){var e=t[0];if(e){S.scriptOnLoad(e.src,e,function(){S.notify("Test & Target: request complete",1),a(),clearTimeout(i)});var i=setTimeout(function(){S.notify("Test & Target: bailing after "+n+"ms",1),a()},n)}else S.notify("Test & Target: failed to find T&T ajax call, bailing",1),a()})},updateTargetPageParams:function(t){var e={};for(var n in t)t.hasOwnProperty(n)&&(e[S.replace(n)]=S.replace(t[n]));S.extend(this.targetPageParamsStore,e)},getTargetPageParams:function(){return this.targetPageParamsStore},setTargetPageParamsFunction:function(){t.targetPageParams=S.bind(this.getTargetPageParams,this)},parseTargetPageParamsResult:function(t){var e=t;return S.isArray(t)&&(t=t.join("&")),S.isString(t)&&(e=S.parseQueryParams(t)),e}}),S.availableTools.tnt=m,S.inherit(v,S.BaseTool),S.extend(v.prototype,{initialize:function(){var t=this.settings;if(this.settings.initTool!==!1){var e=t.url;e="string"==typeof e?S.basePath()+e:S.isHttps()?e.https:e.http,S.loadScript(e,S.bind(this.onLoad,this)),this.initializing=!0}else this.initialized=!0},isQueueAvailable:function(){return!this.initialized},onLoad:function(){this.initialized=!0,this.initializing=!1,this.settings.initialBeacon&&this.settings.initialBeacon(),this.flushQueue()},endPLPhase:function(t){var e=this.settings.loadOn;t===e&&(S.notify(this.name+": Initializing at "+t,1),this.initialize())},$fire:function(t,e,n){return this.initializing?void this.queueCommand({command:"fire",arguments:[n]},t,e):void n.call(this.settings,t,e)}}),S.availableTools.am=v,S.availableTools.adlens=v,S.availableTools.__basic=v,S.ecommerce={addItem:function(){var t=[].slice.call(arguments);S.onEvent({type:"ecommerce.additem",target:t})},addTrans:function(){var t=[].slice.call(arguments);S.data.saleData.sale={orderId:t[0],revenue:t[2]},S.onEvent({type:"ecommerce.addtrans",target:t})},trackTrans:function(){S.onEvent({type:"ecommerce.tracktrans",target:[]})}},_satellite.init({tools:{},pageLoadRules:[{name:"Krux: MyAJC",trigger:[{command:"loadBlockingScript",arguments:[{sequential:!0,scripts:[{src:"satellite-55a8422d35396100170005b6.js",data:[]}]}]}],scope:{domains:[/myajc\.com$/i]},event:"pagetop"},{name:"Retargeting: MyAJC - Entertainment Section",trigger:[{command:"writeHTML",arguments:[{html:"<script type=\"text/javascript\">var ssaUrl = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'pixel.programmatictrader.com/iap/b0ac9d4595c50bda';new Image().src = ssaUrl;</script>"}]}],scope:{URI:{include:["/entertainment/"]},domains:[/myajc\.com$/i]},event:"pagetop"},{name:"Retargeting: MyAJC - Homepage",trigger:[{command:"writeHTML",arguments:[{html:"<script type=\"text/javascript\">var ssaUrl = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'pixel.programmatictrader.com/iap/3c9a890e07c1801c';new Image().src = ssaUrl;</script>"}]}],scope:{URI:{exclude:[/\/[A-z]/i]},domains:[/myajc\.com$/i]},event:"pagetop"},{name:"Retargeting: MyAJC - Lifestyles Events Section",trigger:[{command:"writeHTML",arguments:[{html:"<script type=\"text/javascript\">var ssaUrl = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'pixel.programmatictrader.com/iap/51b02dd7b8a17d48';new Image().src = ssaUrl;</script>"}]}],scope:{URI:{include:["/news/events/","/living-entertainment/"]},domains:[/myajc\.com$/i]},event:"pagetop"},{name:"Retargeting: MyAJC - News  Section",trigger:[{command:"writeHTML",arguments:[{html:"<script type=\"text/javascript\">var ssaUrl = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'pixel.programmatictrader.com/iap/b3184554d046df9f';new Image().src = ssaUrl;</script>"}]}],scope:{URI:{include:["news/local/","/news/news/","/ap/","/news/business/","/gallery/news/","/feed/news/"]},domains:[/myajc\.com$/i]},event:"pagetop"},{name:"Retargeting: MyAJC - Sports Section",trigger:[{command:"writeHTML",arguments:[{html:"<script type=\"text/javascript\">var ssaUrl = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'pixel.programmatictrader.com/iap/5ca9466da6d4aa0b';new Image().src = ssaUrl;</script>"}]}],scope:{URI:{include:["sports","/news/sports/"]},domains:[/myajc\.com$/i]},event:"pagetop"},{name:"Retargeting: MyDaytonDailyNews",trigger:[{command:"writeHTML",arguments:[{html:"<script type=\"text/javascript\">var ssaUrl = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'pixel.programmatictrader.com/iap/cf3d1955cedf2c46';new Image().src = ssaUrl;</script>"}]}],scope:{URI:{exclude:[/\/[A-z]/i]},domains:[/mydaytondailynews\.com$/i]},event:"pagetop"},{name:"Retargeting: MyPBP",trigger:[{command:"writeHTML",arguments:[{html:"<script type=\"text/javascript\">var ssaUrl = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'pixel.programmatictrader.com/iap/b9fd17938fc05529';new Image().src = ssaUrl;</script>"}]}],scope:{URI:{exclude:[/\/[A-z]/i]},domains:[/mypalmbeachpost\.com$/i]},event:"pagetop"},{name:"Retargeting: MySite - Subscriber Pixel",trigger:[{command:"loadScript",arguments:[{sequential:!1,scripts:[{src:"satellite-55c3692f65333600140002a3.js",data:[]}]}]}],scope:{domains:[/myajc\.com$/i,/mydaytondailynews\.com$/i,/mypalmbeachpost\.com$/i,/mystatesman\.com$/i]},event:"pagebottom"},{name:"Retargeting: MyStatesman",trigger:[{command:"writeHTML",arguments:[{html:"<script type=\"text/javascript\">var ssaUrl = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'pixel.programmatictrader.com/iap/ae7644bf103752d0';new Image().src = ssaUrl;</script>"}]}],scope:{URI:{exclude:[/\/[A-z]/i]},domains:[/mystatesman\.com$/i]},event:"pagetop"},{name:"Retartgeting: MyAJC-GetCollegeFootball Flat Page",trigger:[{command:"writeHTML",arguments:[{html:"<script type=\"text/javascript\">var ssaUrl = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'pixel.programmatictrader.com/iap/7660879a5965574b';new Image().src = ssaUrl;</script>"}]}],scope:{URI:{include:["/getcollegefootball/"]},domains:[/myajc\.com$/i]},event:"pagetop"}],rules:[],directCallRules:[],settings:{trackInternalLinks:!0,libraryName:"satelliteLib-b390ecb549d616b2fefbb125cce0fa0c7637ad42",isStaging:!1,allowGATTcalls:!1,downloadExtensions:/\.(?:doc|docx|eps|jpg|png|svg|xls|ppt|pptx|pdf|xlsx|tab|csv|zip|txt|vsd|vxd|xml|js|css|rar|exe|wma|mov|avi|wmv|mp3|wav|m4v)($|\&|\?)/i,notifications:!1,utilVisible:!1,domainList:["myajc.com","mydaytondailynews.com","mypalmbeachpost.com","mystatesman.com"],scriptDir:"20d5deb47c9e7fe47a9f969db01578a739d7179d/scripts/",tagTimeout:3e3},data:{URI:e.location.pathname+e.location.search,browser:{},cartItems:[],revenue:"",host:{http:"assets.adobedtm.com",https:"assets.adobedtm.com"}},dataElements:{},appVersion:"56N",buildDate:"2015-08-07 18:30:41 UTC",publishDate:"2015-08-07 18:30:41 UTC"})}(window,document);;
/*!
 * jQuery JavaScript Library v1.7.1
 * http://jquery.com/
 *
 * Copyright 2011, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 * Copyright 2011, The Dojo Foundation
 * Released under the MIT, BSD, and GPL Licenses.
 *
 * Date: Mon Nov 21 21:11:03 2011 -0500
 */
(function(bc,M){var aw=bc.document,bv=bc.navigator,bm=bc.location;var c=(function(){var bG=function(b1,b2){return new bG.fn.init(b1,b2,bE)},bV=bc.jQuery,bI=bc.$,bE,bZ=/^(?:[^#<]*(<[\w\W]+>)[^>]*$|#([\w\-]*)$)/,bN=/\S/,bJ=/^\s+/,bF=/\s+$/,bB=/^<(\w+)\s*\/?>(?:<\/\1>)?$/,bO=/^[\],:{}\s]*$/,bX=/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,bQ=/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,bK=/(?:^|:|,)(?:\s*\[)+/g,bz=/(webkit)[ \/]([\w.]+)/,bS=/(opera)(?:.*version)?[ \/]([\w.]+)/,bR=/(msie) ([\w.]+)/,bT=/(mozilla)(?:.*? rv:([\w.]+))?/,bC=/-([a-z]|[0-9])/ig,b0=/^-ms-/,bU=function(b1,b2){return(b2+"").toUpperCase()},bY=bv.userAgent,bW,bD,e,bM=Object.prototype.toString,bH=Object.prototype.hasOwnProperty,bA=Array.prototype.push,bL=Array.prototype.slice,bP=String.prototype.trim,bw=Array.prototype.indexOf,by={};bG.fn=bG.prototype={constructor:bG,init:function(b1,b5,b4){var b3,b6,b2,b7;if(!b1){return this}if(b1.nodeType){this.context=this[0]=b1;this.length=1;return this}if(b1==="body"&&!b5&&aw.body){this.context=aw;this[0]=aw.body;this.selector=b1;this.length=1;return this}if(typeof b1==="string"){if(b1.charAt(0)==="<"&&b1.charAt(b1.length-1)===">"&&b1.length>=3){b3=[null,b1,null]}else{b3=bZ.exec(b1)}if(b3&&(b3[1]||!b5)){if(b3[1]){b5=b5 instanceof bG?b5[0]:b5;b7=(b5?b5.ownerDocument||b5:aw);b2=bB.exec(b1);if(b2){if(bG.isPlainObject(b5)){b1=[aw.createElement(b2[1])];bG.fn.attr.call(b1,b5,true)}else{b1=[b7.createElement(b2[1])]}}else{b2=bG.buildFragment([b3[1]],[b7]);b1=(b2.cacheable?bG.clone(b2.fragment):b2.fragment).childNodes}return bG.merge(this,b1)}else{b6=aw.getElementById(b3[2]);if(b6&&b6.parentNode){if(b6.id!==b3[2]){return b4.find(b1)}this.length=1;this[0]=b6}this.context=aw;this.selector=b1;return this}}else{if(!b5||b5.jquery){return(b5||b4).find(b1)}else{return this.constructor(b5).find(b1)}}}else{if(bG.isFunction(b1)){return b4.ready(b1)}}if(b1.selector!==M){this.selector=b1.selector;this.context=b1.context}return bG.makeArray(b1,this)},selector:"",jquery:"1.7.1",length:0,size:function(){return this.length},toArray:function(){return bL.call(this,0)},get:function(b1){return b1==null?this.toArray():(b1<0?this[this.length+b1]:this[b1])},pushStack:function(b2,b4,b1){var b3=this.constructor();if(bG.isArray(b2)){bA.apply(b3,b2)}else{bG.merge(b3,b2)}b3.prevObject=this;b3.context=this.context;if(b4==="find"){b3.selector=this.selector+(this.selector?" ":"")+b1}else{if(b4){b3.selector=this.selector+"."+b4+"("+b1+")"}}return b3},each:function(b2,b1){return bG.each(this,b2,b1)},ready:function(b1){bG.bindReady();bD.add(b1);return this},eq:function(b1){b1=+b1;return b1===-1?this.slice(b1):this.slice(b1,b1+1)},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},slice:function(){return this.pushStack(bL.apply(this,arguments),"slice",bL.call(arguments).join(","))},map:function(b1){return this.pushStack(bG.map(this,function(b3,b2){return b1.call(b3,b2,b3)}))},end:function(){return this.prevObject||this.constructor(null)},push:bA,sort:[].sort,splice:[].splice};bG.fn.init.prototype=bG.fn;bG.extend=bG.fn.extend=function(){var ca,b3,b1,b2,b7,b8,b6=arguments[0]||{},b5=1,b4=arguments.length,b9=false;if(typeof b6==="boolean"){b9=b6;b6=arguments[1]||{};b5=2}if(typeof b6!=="object"&&!bG.isFunction(b6)){b6={}}if(b4===b5){b6=this;--b5}for(;b5<b4;b5++){if((ca=arguments[b5])!=null){for(b3 in ca){b1=b6[b3];b2=ca[b3];if(b6===b2){continue}if(b9&&b2&&(bG.isPlainObject(b2)||(b7=bG.isArray(b2)))){if(b7){b7=false;b8=b1&&bG.isArray(b1)?b1:[]}else{b8=b1&&bG.isPlainObject(b1)?b1:{}}b6[b3]=bG.extend(b9,b8,b2)}else{if(b2!==M){b6[b3]=b2}}}}}return b6};bG.extend({noConflict:function(b1){if(bc.$===bG){bc.$=bI}if(b1&&bc.jQuery===bG){bc.jQuery=bV}return bG},isReady:false,readyWait:1,holdReady:function(b1){if(b1){bG.readyWait++}else{bG.ready(true)}},ready:function(b1){if((b1===true&&!--bG.readyWait)||(b1!==true&&!bG.isReady)){if(!aw.body){return setTimeout(bG.ready,1)}bG.isReady=true;if(b1!==true&&--bG.readyWait>0){return}bD.fireWith(aw,[bG]);if(bG.fn.trigger){bG(aw).trigger("ready").off("ready")}}},bindReady:function(){if(bD){return}bD=bG.Callbacks("once memory");if(aw.readyState==="complete"){return setTimeout(bG.ready,1)}if(aw.addEventListener){aw.addEventListener("DOMContentLoaded",e,false);bc.addEventListener("load",bG.ready,false)}else{if(aw.attachEvent){aw.attachEvent("onreadystatechange",e);bc.attachEvent("onload",bG.ready);var b1=false;try{b1=bc.frameElement==null}catch(b2){}if(aw.documentElement.doScroll&&b1){bx()}}}},isFunction:function(b1){return bG.type(b1)==="function"},isArray:Array.isArray||function(b1){return bG.type(b1)==="array"},isWindow:function(b1){return b1&&typeof b1==="object"&&"setInterval" in b1},isNumeric:function(b1){return !isNaN(parseFloat(b1))&&isFinite(b1)},type:function(b1){return b1==null?String(b1):by[bM.call(b1)]||"object"},isPlainObject:function(b3){if(!b3||bG.type(b3)!=="object"||b3.nodeType||bG.isWindow(b3)){return false}try{if(b3.constructor&&!bH.call(b3,"constructor")&&!bH.call(b3.constructor.prototype,"isPrototypeOf")){return false}}catch(b2){return false}var b1;for(b1 in b3){}return b1===M||bH.call(b3,b1)},isEmptyObject:function(b2){for(var b1 in b2){return false}return true},error:function(b1){throw new Error(b1)},parseJSON:function(b1){if(typeof b1!=="string"||!b1){return null}b1=bG.trim(b1);if(bc.JSON&&bc.JSON.parse){return bc.JSON.parse(b1)}if(bO.test(b1.replace(bX,"@").replace(bQ,"]").replace(bK,""))){return(new Function("return "+b1))()}bG.error("Invalid JSON: "+b1)},parseXML:function(b3){var b1,b2;try{if(bc.DOMParser){b2=new DOMParser();b1=b2.parseFromString(b3,"text/xml")}else{b1=new ActiveXObject("Microsoft.XMLDOM");b1.async="false";b1.loadXML(b3)}}catch(b4){b1=M}if(!b1||!b1.documentElement||b1.getElementsByTagName("parsererror").length){bG.error("Invalid XML: "+b3)}return b1},noop:function(){},globalEval:function(b1){if(b1&&bN.test(b1)){(bc.execScript||function(b2){bc["eval"].call(bc,b2)})(b1)}},camelCase:function(b1){return b1.replace(b0,"ms-").replace(bC,bU)},nodeName:function(b2,b1){return b2.nodeName&&b2.nodeName.toUpperCase()===b1.toUpperCase()},each:function(b4,b7,b3){var b2,b5=0,b6=b4.length,b1=b6===M||bG.isFunction(b4);if(b3){if(b1){for(b2 in b4){if(b7.apply(b4[b2],b3)===false){break}}}else{for(;b5<b6;){if(b7.apply(b4[b5++],b3)===false){break}}}}else{if(b1){for(b2 in b4){if(b7.call(b4[b2],b2,b4[b2])===false){break}}}else{for(;b5<b6;){if(b7.call(b4[b5],b5,b4[b5++])===false){break}}}}return b4},trim:bP?function(b1){return b1==null?"":bP.call(b1)}:function(b1){return b1==null?"":b1.toString().replace(bJ,"").replace(bF,"")},makeArray:function(b4,b2){var b1=b2||[];if(b4!=null){var b3=bG.type(b4);if(b4.length==null||b3==="string"||b3==="function"||b3==="regexp"||bG.isWindow(b4)){bA.call(b1,b4)}else{bG.merge(b1,b4)}}return b1},inArray:function(b3,b4,b2){var b1;if(b4){if(bw){return bw.call(b4,b3,b2)}b1=b4.length;b2=b2?b2<0?Math.max(0,b1+b2):b2:0;for(;b2<b1;b2++){if(b2 in b4&&b4[b2]===b3){return b2}}}return -1},merge:function(b5,b3){var b4=b5.length,b2=0;if(typeof b3.length==="number"){for(var b1=b3.length;b2<b1;b2++){b5[b4++]=b3[b2]}}else{while(b3[b2]!==M){b5[b4++]=b3[b2++]}}b5.length=b4;return b5},grep:function(b2,b7,b1){var b3=[],b6;b1=!!b1;for(var b4=0,b5=b2.length;b4<b5;b4++){b6=!!b7(b2[b4],b4);if(b1!==b6){b3.push(b2[b4])}}return b3},map:function(b1,b8,b9){var b6,b7,b5=[],b3=0,b2=b1.length,b4=b1 instanceof bG||b2!==M&&typeof b2==="number"&&((b2>0&&b1[0]&&b1[b2-1])||b2===0||bG.isArray(b1));if(b4){for(;b3<b2;b3++){b6=b8(b1[b3],b3,b9);if(b6!=null){b5[b5.length]=b6}}}else{for(b7 in b1){b6=b8(b1[b7],b7,b9);if(b6!=null){b5[b5.length]=b6}}}return b5.concat.apply([],b5)},guid:1,proxy:function(b5,b4){if(typeof b4==="string"){var b3=b5[b4];b4=b5;b5=b3}if(!bG.isFunction(b5)){return M}var b1=bL.call(arguments,2),b2=function(){return b5.apply(b4,b1.concat(bL.call(arguments)))};b2.guid=b5.guid=b5.guid||b2.guid||bG.guid++;return b2},access:function(b1,b9,b7,b3,b6,b8){var b2=b1.length;if(typeof b9==="object"){for(var b4 in b9){bG.access(b1,b4,b9[b4],b3,b6,b7)}return b1}if(b7!==M){b3=!b8&&b3&&bG.isFunction(b7);for(var b5=0;b5<b2;b5++){b6(b1[b5],b9,b3?b7.call(b1[b5],b5,b6(b1[b5],b9)):b7,b8)}return b1}return b2?b6(b1[0],b9):M},now:function(){return(new Date()).getTime()},uaMatch:function(b2){b2=b2.toLowerCase();var b1=bz.exec(b2)||bS.exec(b2)||bR.exec(b2)||b2.indexOf("compatible")<0&&bT.exec(b2)||[];return{browser:b1[1]||"",version:b1[2]||"0"}},sub:function(){function b1(b4,b5){return new b1.fn.init(b4,b5)}bG.extend(true,b1,this);b1.superclass=this;b1.fn=b1.prototype=this();b1.fn.constructor=b1;b1.sub=this.sub;b1.fn.init=function b3(b4,b5){if(b5&&b5 instanceof bG&&!(b5 instanceof b1)){b5=b1(b5)}return bG.fn.init.call(this,b4,b5,b2)};b1.fn.init.prototype=b1.fn;var b2=b1(aw);return b1},browser:{}});bG.each("Boolean Number String Function Array Date RegExp Object".split(" "),function(b2,b1){by["[object "+b1+"]"]=b1.toLowerCase()});bW=bG.uaMatch(bY);if(bW.browser){bG.browser[bW.browser]=true;bG.browser.version=bW.version}if(bG.browser.webkit){bG.browser.safari=true}if(bN.test("\xA0")){bJ=/^[\s\xA0]+/;bF=/[\s\xA0]+$/}bE=bG(aw);if(aw.addEventListener){e=function(){aw.removeEventListener("DOMContentLoaded",e,false);bG.ready()}}else{if(aw.attachEvent){e=function(){if(aw.readyState==="complete"){aw.detachEvent("onreadystatechange",e);bG.ready()}}}}function bx(){if(bG.isReady){return}try{aw.documentElement.doScroll("left")}catch(b1){setTimeout(bx,1);return}bG.ready()}return bG})();var a3={};function Y(e){var bw=a3[e]={},bx,by;e=e.split(/\s+/);for(bx=0,by=e.length;bx<by;bx++){bw[e[bx]]=true}return bw}c.Callbacks=function(bx){bx=bx?(a3[bx]||Y(bx)):{};var bC=[],bD=[],by,bz,bw,bA,bB,bF=function(bG){var bH,bK,bJ,bI,bL;for(bH=0,bK=bG.length;bH<bK;bH++){bJ=bG[bH];bI=c.type(bJ);if(bI==="array"){bF(bJ)}else{if(bI==="function"){if(!bx.unique||!bE.has(bJ)){bC.push(bJ)}}}}},e=function(bH,bG){bG=bG||[];by=!bx.memory||[bH,bG];bz=true;bB=bw||0;bw=0;bA=bC.length;for(;bC&&bB<bA;bB++){if(bC[bB].apply(bH,bG)===false&&bx.stopOnFalse){by=true;break}}bz=false;if(bC){if(!bx.once){if(bD&&bD.length){by=bD.shift();bE.fireWith(by[0],by[1])}}else{if(by===true){bE.disable()}else{bC=[]}}}},bE={add:function(){if(bC){var bG=bC.length;bF(arguments);if(bz){bA=bC.length}else{if(by&&by!==true){bw=bG;e(by[0],by[1])}}}return this},remove:function(){if(bC){var bG=arguments,bI=0,bJ=bG.length;for(;bI<bJ;bI++){for(var bH=0;bH<bC.length;bH++){if(bG[bI]===bC[bH]){if(bz){if(bH<=bA){bA--;if(bH<=bB){bB--}}}bC.splice(bH--,1);if(bx.unique){break}}}}}return this},has:function(bH){if(bC){var bG=0,bI=bC.length;for(;bG<bI;bG++){if(bH===bC[bG]){return true}}}return false},empty:function(){bC=[];return this},disable:function(){bC=bD=by=M;return this},disabled:function(){return !bC},lock:function(){bD=M;if(!by||by===true){bE.disable()}return this},locked:function(){return !bD},fireWith:function(bH,bG){if(bD){if(bz){if(!bx.once){bD.push([bH,bG])}}else{if(!(bx.once&&by)){e(bH,bG)}}}return this},fire:function(){bE.fireWith(this,arguments);return this},fired:function(){return !!by}};return bE};var aK=[].slice;c.extend({Deferred:function(bz){var by=c.Callbacks("once memory"),bx=c.Callbacks("once memory"),bw=c.Callbacks("memory"),e="pending",bB={resolve:by,reject:bx,notify:bw},bD={done:by.add,fail:bx.add,progress:bw.add,state:function(){return e},isResolved:by.fired,isRejected:bx.fired,then:function(bF,bE,bG){bC.done(bF).fail(bE).progress(bG);return this},always:function(){bC.done.apply(bC,arguments).fail.apply(bC,arguments);return this},pipe:function(bG,bF,bE){return c.Deferred(function(bH){c.each({done:[bG,"resolve"],fail:[bF,"reject"],progress:[bE,"notify"]},function(bJ,bM){var bI=bM[0],bL=bM[1],bK;if(c.isFunction(bI)){bC[bJ](function(){bK=bI.apply(this,arguments);if(bK&&c.isFunction(bK.promise)){bK.promise().then(bH.resolve,bH.reject,bH.notify)}else{bH[bL+"With"](this===bC?bH:this,[bK])}})}else{bC[bJ](bH[bL])}})}).promise()},promise:function(bF){if(bF==null){bF=bD}else{for(var bE in bD){bF[bE]=bD[bE]}}return bF}},bC=bD.promise({}),bA;for(bA in bB){bC[bA]=bB[bA].fire;bC[bA+"With"]=bB[bA].fireWith}bC.done(function(){e="resolved"},bx.disable,bw.lock).fail(function(){e="rejected"},by.disable,bw.lock);if(bz){bz.call(bC,bC)}return bC},when:function(bB){var by=aK.call(arguments,0),bw=0,e=by.length,bC=new Array(e),bx=e,bz=e,bD=e<=1&&bB&&c.isFunction(bB.promise)?bB:c.Deferred(),bF=bD.promise();function bE(bG){return function(bH){by[bG]=arguments.length>1?aK.call(arguments,0):bH;if(!(--bx)){bD.resolveWith(bD,by)}}}function bA(bG){return function(bH){bC[bG]=arguments.length>1?aK.call(arguments,0):bH;bD.notifyWith(bF,bC)}}if(e>1){for(;bw<e;bw++){if(by[bw]&&by[bw].promise&&c.isFunction(by[bw].promise)){by[bw].promise().then(bE(bw),bD.reject,bA(bw))}else{--bx}}if(!bx){bD.resolveWith(bD,by)}}else{if(bD!==bB){bD.resolveWith(bD,e?[bB]:[])}}return bF}});c.support=(function(){var bK,bJ,bG,bH,by,bF,bB,bE,bA,bL,bC,bz,bx,bw=aw.createElement("div"),bI=aw.documentElement;bw.setAttribute("className","t");bw.innerHTML="   <link/><table></table><a href='/a' style='top:1px;float:left;opacity:.55;'>a</a><input type='checkbox'/>";bJ=bw.getElementsByTagName("*");bG=bw.getElementsByTagName("a")[0];if(!bJ||!bJ.length||!bG){return{}}bH=aw.createElement("select");by=bH.appendChild(aw.createElement("option"));bF=bw.getElementsByTagName("input")[0];bK={leadingWhitespace:(bw.firstChild.nodeType===3),tbody:!bw.getElementsByTagName("tbody").length,htmlSerialize:!!bw.getElementsByTagName("link").length,style:/top/.test(bG.getAttribute("style")),hrefNormalized:(bG.getAttribute("href")==="/a"),opacity:/^0.55/.test(bG.style.opacity),cssFloat:!!bG.style.cssFloat,checkOn:(bF.value==="on"),optSelected:by.selected,getSetAttribute:bw.className!=="t",enctype:!!aw.createElement("form").enctype,html5Clone:aw.createElement("nav").cloneNode(true).outerHTML!=="<:nav></:nav>",submitBubbles:true,changeBubbles:true,focusinBubbles:false,deleteExpando:true,noCloneEvent:true,inlineBlockNeedsLayout:false,shrinkWrapBlocks:false,reliableMarginRight:true};bF.checked=true;bK.noCloneChecked=bF.cloneNode(true).checked;bH.disabled=true;bK.optDisabled=!by.disabled;try{delete bw.test}catch(bD){bK.deleteExpando=false}if(!bw.addEventListener&&bw.attachEvent&&bw.fireEvent){bw.attachEvent("onclick",function(){bK.noCloneEvent=false});bw.cloneNode(true).fireEvent("onclick")}bF=aw.createElement("input");bF.value="t";bF.setAttribute("type","radio");bK.radioValue=bF.value==="t";bF.setAttribute("checked","checked");bw.appendChild(bF);bE=aw.createDocumentFragment();bE.appendChild(bw.lastChild);bK.checkClone=bE.cloneNode(true).cloneNode(true).lastChild.checked;bK.appendChecked=bF.checked;bE.removeChild(bF);bE.appendChild(bw);bw.innerHTML="";if(bc.getComputedStyle){bB=aw.createElement("div");bB.style.width="0";bB.style.marginRight="0";bw.style.width="2px";bw.appendChild(bB);bK.reliableMarginRight=(parseInt((bc.getComputedStyle(bB,null)||{marginRight:0}).marginRight,10)||0)===0}if(bw.attachEvent){for(bz in {submit:1,change:1,focusin:1}){bC="on"+bz;bx=(bC in bw);if(!bx){bw.setAttribute(bC,"return;");bx=(typeof bw[bC]==="function")}bK[bz+"Bubbles"]=bx}}bE.removeChild(bw);bE=bH=by=bB=bw=bF=null;c(function(){var bN,bV,bW,bU,bO,bP,bM,bT,bS,e,bQ,bR=aw.getElementsByTagName("body")[0];if(!bR){return}bM=1;bT="position:absolute;top:0;left:0;width:1px;height:1px;margin:0;";bS="visibility:hidden;border:0;";e="style='"+bT+"border:5px solid #000;padding:0;'";bQ="<div "+e+"><div></div></div><table "+e+" cellpadding='0' cellspacing='0'><tr><td></td></tr></table>";bN=aw.createElement("div");bN.style.cssText=bS+"width:0;height:0;position:static;top:0;margin-top:"+bM+"px";bR.insertBefore(bN,bR.firstChild);bw=aw.createElement("div");bN.appendChild(bw);bw.innerHTML="<table><tr><td style='padding:0;border:0;display:none'></td><td>t</td></tr></table>";bA=bw.getElementsByTagName("td");bx=(bA[0].offsetHeight===0);bA[0].style.display="";bA[1].style.display="none";bK.reliableHiddenOffsets=bx&&(bA[0].offsetHeight===0);bw.innerHTML="";bw.style.width=bw.style.paddingLeft="1px";c.boxModel=bK.boxModel=bw.offsetWidth===2;if(typeof bw.style.zoom!=="undefined"){bw.style.display="inline";bw.style.zoom=1;bK.inlineBlockNeedsLayout=(bw.offsetWidth===2);bw.style.display="";bw.innerHTML="<div style='width:4px;'></div>";bK.shrinkWrapBlocks=(bw.offsetWidth!==2)}bw.style.cssText=bT+bS;bw.innerHTML=bQ;bV=bw.firstChild;bW=bV.firstChild;bO=bV.nextSibling.firstChild.firstChild;bP={doesNotAddBorder:(bW.offsetTop!==5),doesAddBorderForTableAndCells:(bO.offsetTop===5)};bW.style.position="fixed";bW.style.top="20px";bP.fixedPosition=(bW.offsetTop===20||bW.offsetTop===15);bW.style.position=bW.style.top="";bV.style.overflow="hidden";bV.style.position="relative";bP.subtractsBorderForOverflowNotVisible=(bW.offsetTop===-5);bP.doesNotIncludeMarginInBodyOffset=(bR.offsetTop!==bM);bR.removeChild(bN);bw=bN=null;c.extend(bK,bP)});return bK})();var aT=/^(?:\{.*\}|\[.*\])$/,aB=/([A-Z])/g;c.extend({cache:{},uuid:0,expando:"jQuery"+(c.fn.jquery+Math.random()).replace(/\D/g,""),noData:{embed:true,object:"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000",applet:true},hasData:function(e){e=e.nodeType?c.cache[e[c.expando]]:e[c.expando];return !!e&&!T(e)},data:function(by,bw,bA,bz){if(!c.acceptData(by)){return}var bH,bB,bE,bF=c.expando,bD=typeof bw==="string",bG=by.nodeType,e=bG?c.cache:by,bx=bG?by[bF]:by[bF]&&bF,bC=bw==="events";if((!bx||!e[bx]||(!bC&&!bz&&!e[bx].data))&&bD&&bA===M){return}if(!bx){if(bG){by[bF]=bx=++c.uuid}else{bx=bF}}if(!e[bx]){e[bx]={};if(!bG){e[bx].toJSON=c.noop}}if(typeof bw==="object"||typeof bw==="function"){if(bz){e[bx]=c.extend(e[bx],bw)}else{e[bx].data=c.extend(e[bx].data,bw)}}bH=bB=e[bx];if(!bz){if(!bB.data){bB.data={}}bB=bB.data}if(bA!==M){bB[c.camelCase(bw)]=bA}if(bC&&!bB[bw]){return bH.events}if(bD){bE=bB[bw];if(bE==null){bE=bB[c.camelCase(bw)]}}else{bE=bB}return bE},removeData:function(by,bw,bz){if(!c.acceptData(by)){return}var bC,bB,bA,bD=c.expando,bE=by.nodeType,e=bE?c.cache:by,bx=bE?by[bD]:bD;if(!e[bx]){return}if(bw){bC=bz?e[bx]:e[bx].data;if(bC){if(!c.isArray(bw)){if(bw in bC){bw=[bw]}else{bw=c.camelCase(bw);if(bw in bC){bw=[bw]}else{bw=bw.split(" ")}}}for(bB=0,bA=bw.length;bB<bA;bB++){delete bC[bw[bB]]}if(!(bz?T:c.isEmptyObject)(bC)){return}}}if(!bz){delete e[bx].data;if(!T(e[bx])){return}}if(c.support.deleteExpando||!e.setInterval){delete e[bx]}else{e[bx]=null}if(bE){if(c.support.deleteExpando){delete by[bD]}else{if(by.removeAttribute){by.removeAttribute(bD)}else{by[bD]=null}}}},_data:function(bw,e,bx){return c.data(bw,e,bx,true)},acceptData:function(bw){if(bw.nodeName){var e=c.noData[bw.nodeName.toLowerCase()];if(e){return !(e===true||bw.getAttribute("classid")!==e)}}return true}});c.fn.extend({data:function(bz,bB){var bC,e,bx,bA=null;if(typeof bz==="undefined"){if(this.length){bA=c.data(this[0]);if(this[0].nodeType===1&&!c._data(this[0],"parsedAttrs")){e=this[0].attributes;for(var by=0,bw=e.length;by<bw;by++){bx=e[by].name;if(bx.indexOf("data-")===0){bx=c.camelCase(bx.substring(5));a6(this[0],bx,bA[bx])}}c._data(this[0],"parsedAttrs",true)}}return bA}else{if(typeof bz==="object"){return this.each(function(){c.data(this,bz)})}}bC=bz.split(".");bC[1]=bC[1]?"."+bC[1]:"";if(bB===M){bA=this.triggerHandler("getData"+bC[1]+"!",[bC[0]]);if(bA===M&&this.length){bA=c.data(this[0],bz);bA=a6(this[0],bz,bA)}return bA===M&&bC[1]?this.data(bC[0]):bA}else{return this.each(function(){var bD=c(this),bE=[bC[0],bB];bD.triggerHandler("setData"+bC[1]+"!",bE);c.data(this,bz,bB);bD.triggerHandler("changeData"+bC[1]+"!",bE)})}},removeData:function(e){return this.each(function(){c.removeData(this,e)})}});function a6(by,bx,bz){if(bz===M&&by.nodeType===1){var bw="data-"+bx.replace(aB,"-$1").toLowerCase();bz=by.getAttribute(bw);if(typeof bz==="string"){try{bz=bz==="true"?true:bz==="false"?false:bz==="null"?null:c.isNumeric(bz)?parseFloat(bz):aT.test(bz)?c.parseJSON(bz):bz}catch(bA){}c.data(by,bx,bz)}else{bz=M}}return bz}function T(bw){for(var e in bw){if(e==="data"&&c.isEmptyObject(bw[e])){continue}if(e!=="toJSON"){return false}}return true}function bj(bz,by,bB){var bx=by+"defer",bw=by+"queue",e=by+"mark",bA=c._data(bz,bx);if(bA&&(bB==="queue"||!c._data(bz,bw))&&(bB==="mark"||!c._data(bz,e))){setTimeout(function(){if(!c._data(bz,bw)&&!c._data(bz,e)){c.removeData(bz,bx,true);bA.fire()}},0)}}c.extend({_mark:function(bw,e){if(bw){e=(e||"fx")+"mark";c._data(bw,e,(c._data(bw,e)||0)+1)}},_unmark:function(bz,by,bw){if(bz!==true){bw=by;by=bz;bz=false}if(by){bw=bw||"fx";var e=bw+"mark",bx=bz?0:((c._data(by,e)||1)-1);if(bx){c._data(by,e,bx)}else{c.removeData(by,e,true);bj(by,bw,"mark")}}},queue:function(bw,e,by){var bx;if(bw){e=(e||"fx")+"queue";bx=c._data(bw,e);if(by){if(!bx||c.isArray(by)){bx=c._data(bw,e,c.makeArray(by))}else{bx.push(by)}}return bx||[]}},dequeue:function(bz,by){by=by||"fx";var bw=c.queue(bz,by),bx=bw.shift(),e={};if(bx==="inprogress"){bx=bw.shift()}if(bx){if(by==="fx"){bw.unshift("inprogress")}c._data(bz,by+".run",e);bx.call(bz,function(){c.dequeue(bz,by)},e)}if(!bw.length){c.removeData(bz,by+"queue "+by+".run",true);bj(bz,by,"queue")}}});c.fn.extend({queue:function(e,bw){if(typeof e!=="string"){bw=e;e="fx"}if(bw===M){return c.queue(this[0],e)}return this.each(function(){var bx=c.queue(this,e,bw);if(e==="fx"&&bx[0]!=="inprogress"){c.dequeue(this,e)}})},dequeue:function(e){return this.each(function(){c.dequeue(this,e)})},delay:function(bw,e){bw=c.fx?c.fx.speeds[bw]||bw:bw;e=e||"fx";return this.queue(e,function(by,bx){var bz=setTimeout(by,bw);bx.stop=function(){clearTimeout(bz)}})},clearQueue:function(e){return this.queue(e||"fx",[])},promise:function(bE,bx){if(typeof bE!=="string"){bx=bE;bE=M}bE=bE||"fx";var e=c.Deferred(),bw=this,bz=bw.length,bC=1,bA=bE+"defer",bB=bE+"queue",bD=bE+"mark",by;function bF(){if(!(--bC)){e.resolveWith(bw,[bw])}}while(bz--){if((by=c.data(bw[bz],bA,M,true)||(c.data(bw[bz],bB,M,true)||c.data(bw[bz],bD,M,true))&&c.data(bw[bz],bA,c.Callbacks("once memory"),true))){bC++;by.add(bF)}}bF();return e.promise()}});var aQ=/[\n\t\r]/g,ag=/\s+/,aV=/\r/g,h=/^(?:button|input)$/i,E=/^(?:button|input|object|select|textarea)$/i,m=/^a(?:rea)?$/i,ap=/^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i,G=c.support.getSetAttribute,bf,aZ,aG;c.fn.extend({attr:function(e,bw){return c.access(this,e,bw,true,c.attr)},removeAttr:function(e){return this.each(function(){c.removeAttr(this,e)})},prop:function(e,bw){return c.access(this,e,bw,true,c.prop)},removeProp:function(e){e=c.propFix[e]||e;return this.each(function(){try{this[e]=M;delete this[e]}catch(bw){}})},addClass:function(bz){var bB,bx,bw,by,bA,bC,e;if(c.isFunction(bz)){return this.each(function(bD){c(this).addClass(bz.call(this,bD,this.className))})}if(bz&&typeof bz==="string"){bB=bz.split(ag);for(bx=0,bw=this.length;bx<bw;bx++){by=this[bx];if(by.nodeType===1){if(!by.className&&bB.length===1){by.className=bz}else{bA=" "+by.className+" ";for(bC=0,e=bB.length;bC<e;bC++){if(!~bA.indexOf(" "+bB[bC]+" ")){bA+=bB[bC]+" "}}by.className=c.trim(bA)}}}}return this},removeClass:function(bA){var bB,bx,bw,bz,by,bC,e;if(c.isFunction(bA)){return this.each(function(bD){c(this).removeClass(bA.call(this,bD,this.className))})}if((bA&&typeof bA==="string")||bA===M){bB=(bA||"").split(ag);for(bx=0,bw=this.length;bx<bw;bx++){bz=this[bx];if(bz.nodeType===1&&bz.className){if(bA){by=(" "+bz.className+" ").replace(aQ," ");for(bC=0,e=bB.length;bC<e;bC++){by=by.replace(" "+bB[bC]+" "," ")}bz.className=c.trim(by)}else{bz.className=""}}}}return this},toggleClass:function(by,bw){var bx=typeof by,e=typeof bw==="boolean";if(c.isFunction(by)){return this.each(function(bz){c(this).toggleClass(by.call(this,bz,this.className,bw),bw)})}return this.each(function(){if(bx==="string"){var bB,bA=0,bz=c(this),bC=bw,bD=by.split(ag);while((bB=bD[bA++])){bC=e?bC:!bz.hasClass(bB);bz[bC?"addClass":"removeClass"](bB)}}else{if(bx==="undefined"||bx==="boolean"){if(this.className){c._data(this,"__className__",this.className)}this.className=this.className||by===false?"":c._data(this,"__className__")||""}}})},hasClass:function(e){var by=" "+e+" ",bx=0,bw=this.length;for(;bx<bw;bx++){if(this[bx].nodeType===1&&(" "+this[bx].className+" ").replace(aQ," ").indexOf(by)>-1){return true}}return false},val:function(by){var e,bw,bz,bx=this[0];if(!arguments.length){if(bx){e=c.valHooks[bx.nodeName.toLowerCase()]||c.valHooks[bx.type];if(e&&"get" in e&&(bw=e.get(bx,"value"))!==M){return bw}bw=bx.value;return typeof bw==="string"?bw.replace(aV,""):bw==null?"":bw}return}bz=c.isFunction(by);return this.each(function(bB){var bA=c(this),bC;if(this.nodeType!==1){return}if(bz){bC=by.call(this,bB,bA.val())}else{bC=by}if(bC==null){bC=""}else{if(typeof bC==="number"){bC+=""}else{if(c.isArray(bC)){bC=c.map(bC,function(bD){return bD==null?"":bD+""})}}}e=c.valHooks[this.nodeName.toLowerCase()]||c.valHooks[this.type];if(!e||!("set" in e)||e.set(this,bC,"value")===M){this.value=bC}})}});c.extend({valHooks:{option:{get:function(e){var bw=e.attributes.value;return !bw||bw.specified?e.value:e.text}},select:{get:function(e){var bB,bw,bA,by,bz=e.selectedIndex,bC=[],bD=e.options,bx=e.type==="select-one";if(bz<0){return null}bw=bx?bz:0;bA=bx?bz+1:bD.length;for(;bw<bA;bw++){by=bD[bw];if(by.selected&&(c.support.optDisabled?!by.disabled:by.getAttribute("disabled")===null)&&(!by.parentNode.disabled||!c.nodeName(by.parentNode,"optgroup"))){bB=c(by).val();if(bx){return bB}bC.push(bB)}}if(bx&&!bC.length&&bD.length){return c(bD[bz]).val()}return bC},set:function(bw,bx){var e=c.makeArray(bx);c(bw).find("option").each(function(){this.selected=c.inArray(c(this).val(),e)>=0});if(!e.length){bw.selectedIndex=-1}return e}}},attrFn:{val:true,css:true,html:true,text:true,data:true,width:true,height:true,offset:true},attr:function(bB,by,bC,bA){var bx,e,bz,bw=bB.nodeType;if(!bB||bw===3||bw===8||bw===2){return}if(bA&&by in c.attrFn){return c(bB)[by](bC)}if(typeof bB.getAttribute==="undefined"){return c.prop(bB,by,bC)}bz=bw!==1||!c.isXMLDoc(bB);if(bz){by=by.toLowerCase();e=c.attrHooks[by]||(ap.test(by)?aZ:bf)}if(bC!==M){if(bC===null){c.removeAttr(bB,by);return}else{if(e&&"set" in e&&bz&&(bx=e.set(bB,bC,by))!==M){return bx}else{bB.setAttribute(by,""+bC);return bC}}}else{if(e&&"get" in e&&bz&&(bx=e.get(bB,by))!==null){return bx}else{bx=bB.getAttribute(by);return bx===null?M:bx}}},removeAttr:function(by,bA){var bz,bB,bw,e,bx=0;if(bA&&by.nodeType===1){bB=bA.toLowerCase().split(ag);e=bB.length;for(;bx<e;bx++){bw=bB[bx];if(bw){bz=c.propFix[bw]||bw;c.attr(by,bw,"");by.removeAttribute(G?bw:bz);if(ap.test(bw)&&bz in by){by[bz]=false}}}}},attrHooks:{type:{set:function(e,bw){if(h.test(e.nodeName)&&e.parentNode){c.error("type property can't be changed")}else{if(!c.support.radioValue&&bw==="radio"&&c.nodeName(e,"input")){var bx=e.value;e.setAttribute("type",bw);if(bx){e.value=bx}return bw}}}},value:{get:function(bw,e){if(bf&&c.nodeName(bw,"button")){return bf.get(bw,e)}return e in bw?bw.value:null},set:function(bw,bx,e){if(bf&&c.nodeName(bw,"button")){return bf.set(bw,bx,e)}bw.value=bx}}},propFix:{tabindex:"tabIndex",readonly:"readOnly","for":"htmlFor","class":"className",maxlength:"maxLength",cellspacing:"cellSpacing",cellpadding:"cellPadding",rowspan:"rowSpan",colspan:"colSpan",usemap:"useMap",frameborder:"frameBorder",contenteditable:"contentEditable"},prop:function(bA,by,bB){var bx,e,bz,bw=bA.nodeType;if(!bA||bw===3||bw===8||bw===2){return}bz=bw!==1||!c.isXMLDoc(bA);if(bz){by=c.propFix[by]||by;e=c.propHooks[by]}if(bB!==M){if(e&&"set" in e&&(bx=e.set(bA,bB,by))!==M){return bx}else{return(bA[by]=bB)}}else{if(e&&"get" in e&&(bx=e.get(bA,by))!==null){return bx}else{return bA[by]}}},propHooks:{tabIndex:{get:function(bw){var e=bw.getAttributeNode("tabindex");return e&&e.specified?parseInt(e.value,10):E.test(bw.nodeName)||m.test(bw.nodeName)&&bw.href?0:M}}}});c.attrHooks.tabindex=c.propHooks.tabIndex;aZ={get:function(bw,e){var by,bx=c.prop(bw,e);return bx===true||typeof bx!=="boolean"&&(by=bw.getAttributeNode(e))&&by.nodeValue!==false?e.toLowerCase():M},set:function(bw,by,e){var bx;if(by===false){c.removeAttr(bw,e)}else{bx=c.propFix[e]||e;if(bx in bw){bw[bx]=true}bw.setAttribute(e,e.toLowerCase())}return e}};if(!G){aG={name:true,id:true};bf=c.valHooks.button={get:function(bx,bw){var e;e=bx.getAttributeNode(bw);return e&&(aG[bw]?e.nodeValue!=="":e.specified)?e.nodeValue:M},set:function(bx,by,bw){var e=bx.getAttributeNode(bw);if(!e){e=aw.createAttribute(bw);bx.setAttributeNode(e)}return(e.nodeValue=by+"")}};c.attrHooks.tabindex.set=bf.set;c.each(["width","height"],function(bw,e){c.attrHooks[e]=c.extend(c.attrHooks[e],{set:function(bx,by){if(by===""){bx.setAttribute(e,"auto");return by}}})});c.attrHooks.contenteditable={get:bf.get,set:function(bw,bx,e){if(bx===""){bx="false"}bf.set(bw,bx,e)}}}if(!c.support.hrefNormalized){c.each(["href","src","width","height"],function(bw,e){c.attrHooks[e]=c.extend(c.attrHooks[e],{get:function(by){var bx=by.getAttribute(e,2);return bx===null?M:bx}})})}if(!c.support.style){c.attrHooks.style={get:function(e){return e.style.cssText.toLowerCase()||M},set:function(e,bw){return(e.style.cssText=""+bw)}}}if(!c.support.optSelected){c.propHooks.selected=c.extend(c.propHooks.selected,{get:function(bw){var e=bw.parentNode;if(e){e.selectedIndex;if(e.parentNode){e.parentNode.selectedIndex}}return null}})}if(!c.support.enctype){c.propFix.enctype="encoding"}if(!c.support.checkOn){c.each(["radio","checkbox"],function(){c.valHooks[this]={get:function(e){return e.getAttribute("value")===null?"on":e.value}}})}c.each(["radio","checkbox"],function(){c.valHooks[this]=c.extend(c.valHooks[this],{set:function(e,bw){if(c.isArray(bw)){return(e.checked=c.inArray(c(e).val(),bw)>=0)}}})});var be=/^(?:textarea|input|select)$/i,o=/^([^\.]*)?(?:\.(.+))?$/,K=/\bhover(\.\S+)?\b/,aP=/^key/,bg=/^(?:mouse|contextmenu)|click/,U=/^(?:focusinfocus|focusoutblur)$/,V=/^(\w*)(?:#([\w\-]+))?(?:\.([\w\-]+))?$/,Z=function(e){var bw=V.exec(e);if(bw){bw[1]=(bw[1]||"").toLowerCase();bw[3]=bw[3]&&new RegExp("(?:^|\\s)"+bw[3]+"(?:\\s|$)")}return bw},k=function(bx,e){var bw=bx.attributes||{};return((!e[1]||bx.nodeName.toLowerCase()===e[1])&&(!e[2]||(bw.id||{}).value===e[2])&&(!e[3]||e[3].test((bw["class"]||{}).value)))},bu=function(e){return c.event.special.hover?e:e.replace(K,"mouseenter$1 mouseleave$1")};c.event={add:function(by,bD,bK,bB,bz){var bE,bC,bL,bJ,bI,bG,e,bH,bw,bA,bx,bF;if(by.nodeType===3||by.nodeType===8||!bD||!bK||!(bE=c._data(by))){return}if(bK.handler){bw=bK;bK=bw.handler}if(!bK.guid){bK.guid=c.guid++}bL=bE.events;if(!bL){bE.events=bL={}}bC=bE.handle;if(!bC){bE.handle=bC=function(bM){return typeof c!=="undefined"&&(!bM||c.event.triggered!==bM.type)?c.event.dispatch.apply(bC.elem,arguments):M};bC.elem=by}bD=c.trim(bu(bD)).split(" ");for(bJ=0;bJ<bD.length;bJ++){bI=o.exec(bD[bJ])||[];bG=bI[1];e=(bI[2]||"").split(".").sort();bF=c.event.special[bG]||{};bG=(bz?bF.delegateType:bF.bindType)||bG;bF=c.event.special[bG]||{};bH=c.extend({type:bG,origType:bI[1],data:bB,handler:bK,guid:bK.guid,selector:bz,quick:Z(bz),namespace:e.join(".")},bw);bx=bL[bG];if(!bx){bx=bL[bG]=[];bx.delegateCount=0;if(!bF.setup||bF.setup.call(by,bB,e,bC)===false){if(by.addEventListener){by.addEventListener(bG,bC,false)}else{if(by.attachEvent){by.attachEvent("on"+bG,bC)}}}}if(bF.add){bF.add.call(by,bH);if(!bH.handler.guid){bH.handler.guid=bK.guid}}if(bz){bx.splice(bx.delegateCount++,0,bH)}else{bx.push(bH)}c.event.global[bG]=true}by=null},global:{},remove:function(bK,bF,bw,bI,bC){var bJ=c.hasData(bK)&&c._data(bK),bG,by,bA,bM,bD,bB,bH,bx,bz,bL,bE,e;if(!bJ||!(bx=bJ.events)){return}bF=c.trim(bu(bF||"")).split(" ");for(bG=0;bG<bF.length;bG++){by=o.exec(bF[bG])||[];bA=bM=by[1];bD=by[2];if(!bA){for(bA in bx){c.event.remove(bK,bA+bF[bG],bw,bI,true)}continue}bz=c.event.special[bA]||{};bA=(bI?bz.delegateType:bz.bindType)||bA;bE=bx[bA]||[];bB=bE.length;bD=bD?new RegExp("(^|\\.)"+bD.split(".").sort().join("\\.(?:.*\\.)?")+"(\\.|$)"):null;for(bH=0;bH<bE.length;bH++){e=bE[bH];if((bC||bM===e.origType)&&(!bw||bw.guid===e.guid)&&(!bD||bD.test(e.namespace))&&(!bI||bI===e.selector||bI==="**"&&e.selector)){bE.splice(bH--,1);if(e.selector){bE.delegateCount--}if(bz.remove){bz.remove.call(bK,e)}}}if(bE.length===0&&bB!==bE.length){if(!bz.teardown||bz.teardown.call(bK,bD)===false){c.removeEvent(bK,bA,bJ.handle)}delete bx[bA]}}if(c.isEmptyObject(bx)){bL=bJ.handle;if(bL){bL.elem=null}c.removeData(bK,["events","handle"],true)}},customEvent:{getData:true,setData:true,changeData:true},trigger:function(bw,bE,bB,bK){if(bB&&(bB.nodeType===3||bB.nodeType===8)){return}var bH=bw.type||bw,by=[],e,bx,bD,bI,bA,bz,bG,bF,bC,bJ;if(U.test(bH+c.event.triggered)){return}if(bH.indexOf("!")>=0){bH=bH.slice(0,-1);bx=true}if(bH.indexOf(".")>=0){by=bH.split(".");bH=by.shift();by.sort()}if((!bB||c.event.customEvent[bH])&&!c.event.global[bH]){return}bw=typeof bw==="object"?bw[c.expando]?bw:new c.Event(bH,bw):new c.Event(bH);bw.type=bH;bw.isTrigger=true;bw.exclusive=bx;bw.namespace=by.join(".");bw.namespace_re=bw.namespace?new RegExp("(^|\\.)"+by.join("\\.(?:.*\\.)?")+"(\\.|$)"):null;bz=bH.indexOf(":")<0?"on"+bH:"";if(!bB){e=c.cache;for(bD in e){if(e[bD].events&&e[bD].events[bH]){c.event.trigger(bw,bE,e[bD].handle.elem,true)}}return}bw.result=M;if(!bw.target){bw.target=bB}bE=bE!=null?c.makeArray(bE):[];bE.unshift(bw);bG=c.event.special[bH]||{};if(bG.trigger&&bG.trigger.apply(bB,bE)===false){return}bC=[[bB,bG.bindType||bH]];if(!bK&&!bG.noBubble&&!c.isWindow(bB)){bJ=bG.delegateType||bH;bI=U.test(bJ+bH)?bB:bB.parentNode;bA=null;for(;bI;bI=bI.parentNode){bC.push([bI,bJ]);bA=bI}if(bA&&bA===bB.ownerDocument){bC.push([bA.defaultView||bA.parentWindow||bc,bJ])}}for(bD=0;bD<bC.length&&!bw.isPropagationStopped();bD++){bI=bC[bD][0];bw.type=bC[bD][1];bF=(c._data(bI,"events")||{})[bw.type]&&c._data(bI,"handle");if(bF){bF.apply(bI,bE)}bF=bz&&bI[bz];if(bF&&c.acceptData(bI)&&bF.apply(bI,bE)===false){bw.preventDefault()}}bw.type=bH;if(!bK&&!bw.isDefaultPrevented()){if((!bG._default||bG._default.apply(bB.ownerDocument,bE)===false)&&!(bH==="click"&&c.nodeName(bB,"a"))&&c.acceptData(bB)){if(bz&&bB[bH]&&((bH!=="focus"&&bH!=="blur")||bw.target.offsetWidth!==0)&&!c.isWindow(bB)){bA=bB[bz];if(bA){bB[bz]=null}c.event.triggered=bH;bB[bH]();c.event.triggered=M;if(bA){bB[bz]=bA}}}}return bw.result},dispatch:function(e){e=c.event.fix(e||bc.event);var bA=((c._data(this,"events")||{})[e.type]||[]),bB=bA.delegateCount,bH=[].slice.call(arguments,0),bz=!e.exclusive&&!e.namespace,bI=[],bD,bC,bL,by,bG,bF,bw,bE,bJ,bx,bK;bH[0]=e;e.delegateTarget=this;if(bB&&!e.target.disabled&&!(e.button&&e.type==="click")){by=c(this);by.context=this.ownerDocument||this;for(bL=e.target;bL!=this;bL=bL.parentNode||this){bF={};bE=[];by[0]=bL;for(bD=0;bD<bB;bD++){bJ=bA[bD];bx=bJ.selector;if(bF[bx]===M){bF[bx]=(bJ.quick?k(bL,bJ.quick):by.is(bx))}if(bF[bx]){bE.push(bJ)}}if(bE.length){bI.push({elem:bL,matches:bE})}}}if(bA.length>bB){bI.push({elem:this,matches:bA.slice(bB)})}for(bD=0;bD<bI.length&&!e.isPropagationStopped();bD++){bw=bI[bD];e.currentTarget=bw.elem;for(bC=0;bC<bw.matches.length&&!e.isImmediatePropagationStopped();bC++){bJ=bw.matches[bC];if(bz||(!e.namespace&&!bJ.namespace)||e.namespace_re&&e.namespace_re.test(bJ.namespace)){e.data=bJ.data;e.handleObj=bJ;bG=((c.event.special[bJ.origType]||{}).handle||bJ.handler).apply(bw.elem,bH);if(bG!==M){e.result=bG;if(bG===false){e.preventDefault();e.stopPropagation()}}}}}return e.result},props:"attrChange attrName relatedNode srcElement altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(bw,e){if(bw.which==null){bw.which=e.charCode!=null?e.charCode:e.keyCode}return bw}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(by,bx){var bz,bA,e,bw=bx.button,bB=bx.fromElement;if(by.pageX==null&&bx.clientX!=null){bz=by.target.ownerDocument||aw;bA=bz.documentElement;e=bz.body;by.pageX=bx.clientX+(bA&&bA.scrollLeft||e&&e.scrollLeft||0)-(bA&&bA.clientLeft||e&&e.clientLeft||0);by.pageY=bx.clientY+(bA&&bA.scrollTop||e&&e.scrollTop||0)-(bA&&bA.clientTop||e&&e.clientTop||0)}if(!by.relatedTarget&&bB){by.relatedTarget=bB===by.target?bx.toElement:bB}if(!by.which&&bw!==M){by.which=(bw&1?1:(bw&2?3:(bw&4?2:0)))}return by}},fix:function(bx){if(bx[c.expando]){return bx}var bw,bA,e=bx,by=c.event.fixHooks[bx.type]||{},bz=by.props?this.props.concat(by.props):this.props;bx=c.Event(e);for(bw=bz.length;bw;){bA=bz[--bw];bx[bA]=e[bA]}if(!bx.target){bx.target=e.srcElement||aw}if(bx.target.nodeType===3){bx.target=bx.target.parentNode}if(bx.metaKey===M){bx.metaKey=bx.ctrlKey}return by.filter?by.filter(bx,e):bx},special:{ready:{setup:c.bindReady},load:{noBubble:true},focus:{delegateType:"focusin"},blur:{delegateType:"focusout"},beforeunload:{setup:function(bx,bw,e){if(c.isWindow(this)){this.onbeforeunload=e}},teardown:function(bw,e){if(this.onbeforeunload===e){this.onbeforeunload=null}}}},simulate:function(bx,bz,by,bw){var bA=c.extend(new c.Event(),by,{type:bx,isSimulated:true,originalEvent:{}});if(bw){c.event.trigger(bA,null,bz)}else{c.event.dispatch.call(bz,bA)}if(bA.isDefaultPrevented()){by.preventDefault()}}};c.event.handle=c.event.dispatch;c.removeEvent=aw.removeEventListener?function(bw,e,bx){if(bw.removeEventListener){bw.removeEventListener(e,bx,false)}}:function(bw,e,bx){if(bw.detachEvent){bw.detachEvent("on"+e,bx)}};c.Event=function(bw,e){if(!(this instanceof c.Event)){return new c.Event(bw,e)}if(bw&&bw.type){this.originalEvent=bw;this.type=bw.type;this.isDefaultPrevented=(bw.defaultPrevented||bw.returnValue===false||bw.getPreventDefault&&bw.getPreventDefault())?j:bl}else{this.type=bw}if(e){c.extend(this,e)}this.timeStamp=bw&&bw.timeStamp||c.now();this[c.expando]=true};function bl(){return false}function j(){return true}c.Event.prototype={preventDefault:function(){this.isDefaultPrevented=j;var bw=this.originalEvent;if(!bw){return}if(bw.preventDefault){bw.preventDefault()}else{bw.returnValue=false}},stopPropagation:function(){this.isPropagationStopped=j;var bw=this.originalEvent;if(!bw){return}if(bw.stopPropagation){bw.stopPropagation()}bw.cancelBubble=true},stopImmediatePropagation:function(){this.isImmediatePropagationStopped=j;this.stopPropagation()},isDefaultPrevented:bl,isPropagationStopped:bl,isImmediatePropagationStopped:bl};c.each({mouseenter:"mouseover",mouseleave:"mouseout"},function(bw,e){c.event.special[bw]={delegateType:e,bindType:e,handle:function(bA){var bC=this,bB=bA.relatedTarget,bz=bA.handleObj,bx=bz.selector,by;if(!bB||(bB!==bC&&!c.contains(bC,bB))){bA.type=bz.origType;by=bz.handler.apply(this,arguments);bA.type=e}return by}}});if(!c.support.submitBubbles){c.event.special.submit={setup:function(){if(c.nodeName(this,"form")){return false}c.event.add(this,"click._submit keypress._submit",function(by){var bx=by.target,bw=c.nodeName(bx,"input")||c.nodeName(bx,"button")?bx.form:M;if(bw&&!bw._submit_attached){c.event.add(bw,"submit._submit",function(e){if(this.parentNode&&!e.isTrigger){c.event.simulate("submit",this.parentNode,e,true)}});bw._submit_attached=true}})},teardown:function(){if(c.nodeName(this,"form")){return false}c.event.remove(this,"._submit")}}}if(!c.support.changeBubbles){c.event.special.change={setup:function(){if(be.test(this.nodeName)){if(this.type==="checkbox"||this.type==="radio"){c.event.add(this,"propertychange._change",function(e){if(e.originalEvent.propertyName==="checked"){this._just_changed=true}});c.event.add(this,"click._change",function(e){if(this._just_changed&&!e.isTrigger){this._just_changed=false;c.event.simulate("change",this,e,true)}})}return false}c.event.add(this,"beforeactivate._change",function(bx){var bw=bx.target;if(be.test(bw.nodeName)&&!bw._change_attached){c.event.add(bw,"change._change",function(e){if(this.parentNode&&!e.isSimulated&&!e.isTrigger){c.event.simulate("change",this.parentNode,e,true)}});bw._change_attached=true}})},handle:function(bw){var e=bw.target;if(this!==e||bw.isSimulated||bw.isTrigger||(e.type!=="radio"&&e.type!=="checkbox")){return bw.handleObj.handler.apply(this,arguments)}},teardown:function(){c.event.remove(this,"._change");return be.test(this.nodeName)}}}if(!c.support.focusinBubbles){c.each({focus:"focusin",blur:"focusout"},function(by,e){var bw=0,bx=function(bz){c.event.simulate(e,bz.target,c.event.fix(bz),true)};c.event.special[e]={setup:function(){if(bw++===0){aw.addEventListener(by,bx,true)}},teardown:function(){if(--bw===0){aw.removeEventListener(by,bx,true)}}}})}c.fn.extend({on:function(bx,e,bA,bz,bw){var bB,by;if(typeof bx==="object"){if(typeof e!=="string"){bA=e;e=M}for(by in bx){this.on(by,e,bA,bx[by],bw)}return this}if(bA==null&&bz==null){bz=e;bA=e=M}else{if(bz==null){if(typeof e==="string"){bz=bA;bA=M}else{bz=bA;bA=e;e=M}}}if(bz===false){bz=bl}else{if(!bz){return this}}if(bw===1){bB=bz;bz=function(bC){c().off(bC);return bB.apply(this,arguments)};bz.guid=bB.guid||(bB.guid=c.guid++)}return this.each(function(){c.event.add(this,bx,bz,bA,e)})},one:function(bw,e,by,bx){return this.on.call(this,bw,e,by,bx,1)},off:function(bx,e,bz){if(bx&&bx.preventDefault&&bx.handleObj){var bw=bx.handleObj;c(bx.delegateTarget).off(bw.namespace?bw.type+"."+bw.namespace:bw.type,bw.selector,bw.handler);return this}if(typeof bx==="object"){for(var by in bx){this.off(by,e,bx[by])}return this}if(e===false||typeof e==="function"){bz=e;e=M}if(bz===false){bz=bl}return this.each(function(){c.event.remove(this,bx,bz,e)})},bind:function(e,bx,bw){return this.on(e,null,bx,bw)},unbind:function(e,bw){return this.off(e,null,bw)},live:function(e,bx,bw){c(this.context).on(e,this.selector,bx,bw);return this},die:function(e,bw){c(this.context).off(e,this.selector||"**",bw);return this},delegate:function(e,bw,by,bx){return this.on(bw,e,by,bx)},undelegate:function(e,bw,bx){return arguments.length==1?this.off(e,"**"):this.off(bw,e,bx)},trigger:function(e,bw){return this.each(function(){c.event.trigger(e,bw,this)})},triggerHandler:function(e,bw){if(this[0]){return c.event.trigger(e,bw,this[0],true)}},toggle:function(by){var bw=arguments,e=by.guid||c.guid++,bx=0,bz=function(bA){var bB=(c._data(this,"lastToggle"+by.guid)||0)%bx;c._data(this,"lastToggle"+by.guid,bB+1);bA.preventDefault();return bw[bB].apply(this,arguments)||false};bz.guid=e;while(bx<bw.length){bw[bx++].guid=e}return this.click(bz)},hover:function(e,bw){return this.mouseenter(e).mouseleave(bw||e)}});c.each(("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu").split(" "),function(bw,e){c.fn[e]=function(by,bx){if(bx==null){bx=by;by=null}return arguments.length>0?this.on(e,null,by,bx):this.trigger(e)};if(c.attrFn){c.attrFn[e]=true}if(aP.test(e)){c.event.fixHooks[e]=c.event.keyHooks}if(bg.test(e)){c.event.fixHooks[e]=c.event.mouseHooks}});
/*!
 * Sizzle CSS Selector Engine
 *  Copyright 2011, The Dojo Foundation
 *  Released under the MIT, BSD, and GPL Licenses.
 *  More information: http://sizzlejs.com/
 */
(function(){var bI=/((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,bD="sizcache"+(Math.random()+"").replace(".",""),bJ=0,bM=Object.prototype.toString,bC=false,bB=true,bL=/\\/g,bP=/\r\n/g,bR=/\W/;[0,0].sort(function(){bB=false;return 0});var bz=function(bW,e,bZ,b0){bZ=bZ||[];e=e||aw;var b2=e;if(e.nodeType!==1&&e.nodeType!==9){return[]}if(!bW||typeof bW!=="string"){return bZ}var bT,b4,b7,bS,b3,b6,b5,bY,bV=true,bU=bz.isXML(e),bX=[],b1=bW;do{bI.exec("");bT=bI.exec(b1);if(bT){b1=bT[3];bX.push(bT[1]);if(bT[2]){bS=bT[3];break}}}while(bT);if(bX.length>1&&bE.exec(bW)){if(bX.length===2&&bF.relative[bX[0]]){b4=bN(bX[0]+bX[1],e,b0)}else{b4=bF.relative[bX[0]]?[e]:bz(bX.shift(),e);while(bX.length){bW=bX.shift();if(bF.relative[bW]){bW+=bX.shift()}b4=bN(bW,b4,b0)}}}else{if(!b0&&bX.length>1&&e.nodeType===9&&!bU&&bF.match.ID.test(bX[0])&&!bF.match.ID.test(bX[bX.length-1])){b3=bz.find(bX.shift(),e,bU);e=b3.expr?bz.filter(b3.expr,b3.set)[0]:b3.set[0]}if(e){b3=b0?{expr:bX.pop(),set:bG(b0)}:bz.find(bX.pop(),bX.length===1&&(bX[0]==="~"||bX[0]==="+")&&e.parentNode?e.parentNode:e,bU);b4=b3.expr?bz.filter(b3.expr,b3.set):b3.set;if(bX.length>0){b7=bG(b4)}else{bV=false}while(bX.length){b6=bX.pop();b5=b6;if(!bF.relative[b6]){b6=""}else{b5=bX.pop()}if(b5==null){b5=e}bF.relative[b6](b7,b5,bU)}}else{b7=bX=[]}}if(!b7){b7=b4}if(!b7){bz.error(b6||bW)}if(bM.call(b7)==="[object Array]"){if(!bV){bZ.push.apply(bZ,b7)}else{if(e&&e.nodeType===1){for(bY=0;b7[bY]!=null;bY++){if(b7[bY]&&(b7[bY]===true||b7[bY].nodeType===1&&bz.contains(e,b7[bY]))){bZ.push(b4[bY])}}}else{for(bY=0;b7[bY]!=null;bY++){if(b7[bY]&&b7[bY].nodeType===1){bZ.push(b4[bY])}}}}}else{bG(b7,bZ)}if(bS){bz(bS,b2,bZ,b0);bz.uniqueSort(bZ)}return bZ};bz.uniqueSort=function(bS){if(bK){bC=bB;bS.sort(bK);if(bC){for(var e=1;e<bS.length;e++){if(bS[e]===bS[e-1]){bS.splice(e--,1)}}}}return bS};bz.matches=function(e,bS){return bz(e,null,null,bS)};bz.matchesSelector=function(e,bS){return bz(bS,null,null,[e]).length>0};bz.find=function(bY,e,bZ){var bX,bT,bV,bU,bW,bS;if(!bY){return[]}for(bT=0,bV=bF.order.length;bT<bV;bT++){bW=bF.order[bT];if((bU=bF.leftMatch[bW].exec(bY))){bS=bU[1];bU.splice(1,1);if(bS.substr(bS.length-1)!=="\\"){bU[1]=(bU[1]||"").replace(bL,"");bX=bF.find[bW](bU,e,bZ);if(bX!=null){bY=bY.replace(bF.match[bW],"");break}}}}if(!bX){bX=typeof e.getElementsByTagName!=="undefined"?e.getElementsByTagName("*"):[]}return{set:bX,expr:bY}};bz.filter=function(b2,b1,b5,bV){var bX,e,b0,b7,b4,bS,bU,bW,b3,bT=b2,b6=[],bZ=b1,bY=b1&&b1[0]&&bz.isXML(b1[0]);while(b2&&b1.length){for(b0 in bF.filter){if((bX=bF.leftMatch[b0].exec(b2))!=null&&bX[2]){bS=bF.filter[b0];bU=bX[1];e=false;bX.splice(1,1);if(bU.substr(bU.length-1)==="\\"){continue}if(bZ===b6){b6=[]}if(bF.preFilter[b0]){bX=bF.preFilter[b0](bX,bZ,b5,b6,bV,bY);if(!bX){e=b7=true}else{if(bX===true){continue}}}if(bX){for(bW=0;(b4=bZ[bW])!=null;bW++){if(b4){b7=bS(b4,bX,bW,bZ);b3=bV^b7;if(b5&&b7!=null){if(b3){e=true}else{bZ[bW]=false}}else{if(b3){b6.push(b4);e=true}}}}}if(b7!==M){if(!b5){bZ=b6}b2=b2.replace(bF.match[b0],"");if(!e){return[]}break}}}if(b2===bT){if(e==null){bz.error(b2)}else{break}}bT=b2}return bZ};bz.error=function(e){throw new Error("Syntax error, unrecognized expression: "+e)};var bx=bz.getText=function(bV){var bT,bU,e=bV.nodeType,bS="";if(e){if(e===1||e===9){if(typeof bV.textContent==="string"){return bV.textContent}else{if(typeof bV.innerText==="string"){return bV.innerText.replace(bP,"")}else{for(bV=bV.firstChild;bV;bV=bV.nextSibling){bS+=bx(bV)}}}}else{if(e===3||e===4){return bV.nodeValue}}}else{for(bT=0;(bU=bV[bT]);bT++){if(bU.nodeType!==8){bS+=bx(bU)}}}return bS};var bF=bz.selectors={order:["ID","NAME","TAG"],match:{ID:/#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,CLASS:/\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,NAME:/\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/,ATTR:/\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(?:(['"])(.*?)\3|(#?(?:[\w\u00c0-\uFFFF\-]|\\.)*)|)|)\s*\]/,TAG:/^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,CHILD:/:(only|nth|last|first)-child(?:\(\s*(even|odd|(?:[+\-]?\d+|(?:[+\-]?\d*)?n\s*(?:[+\-]\s*\d+)?))\s*\))?/,POS:/:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,PSEUDO:/:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/},leftMatch:{},attrMap:{"class":"className","for":"htmlFor"},attrHandle:{href:function(e){return e.getAttribute("href")},type:function(e){return e.getAttribute("type")}},relative:{"+":function(bX,bS){var bU=typeof bS==="string",bW=bU&&!bR.test(bS),bY=bU&&!bW;if(bW){bS=bS.toLowerCase()}for(var bT=0,e=bX.length,bV;bT<e;bT++){if((bV=bX[bT])){while((bV=bV.previousSibling)&&bV.nodeType!==1){}bX[bT]=bY||bV&&bV.nodeName.toLowerCase()===bS?bV||false:bV===bS}}if(bY){bz.filter(bS,bX,true)}},">":function(bX,bS){var bW,bV=typeof bS==="string",bT=0,e=bX.length;if(bV&&!bR.test(bS)){bS=bS.toLowerCase();for(;bT<e;bT++){bW=bX[bT];if(bW){var bU=bW.parentNode;bX[bT]=bU.nodeName.toLowerCase()===bS?bU:false}}}else{for(;bT<e;bT++){bW=bX[bT];if(bW){bX[bT]=bV?bW.parentNode:bW.parentNode===bS}}if(bV){bz.filter(bS,bX,true)}}},"":function(bU,bS,bW){var bV,bT=bJ++,e=bO;if(typeof bS==="string"&&!bR.test(bS)){bS=bS.toLowerCase();bV=bS;e=bw}e("parentNode",bS,bT,bU,bV,bW)},"~":function(bU,bS,bW){var bV,bT=bJ++,e=bO;if(typeof bS==="string"&&!bR.test(bS)){bS=bS.toLowerCase();bV=bS;e=bw}e("previousSibling",bS,bT,bU,bV,bW)}},find:{ID:function(bS,bT,bU){if(typeof bT.getElementById!=="undefined"&&!bU){var e=bT.getElementById(bS[1]);return e&&e.parentNode?[e]:[]}},NAME:function(bT,bW){if(typeof bW.getElementsByName!=="undefined"){var bS=[],bV=bW.getElementsByName(bT[1]);for(var bU=0,e=bV.length;bU<e;bU++){if(bV[bU].getAttribute("name")===bT[1]){bS.push(bV[bU])}}return bS.length===0?null:bS}},TAG:function(e,bS){if(typeof bS.getElementsByTagName!=="undefined"){return bS.getElementsByTagName(e[1])}}},preFilter:{CLASS:function(bU,bS,bT,e,bX,bY){bU=" "+bU[1].replace(bL,"")+" ";if(bY){return bU}for(var bV=0,bW;(bW=bS[bV])!=null;bV++){if(bW){if(bX^(bW.className&&(" "+bW.className+" ").replace(/[\t\n\r]/g," ").indexOf(bU)>=0)){if(!bT){e.push(bW)}}else{if(bT){bS[bV]=false}}}}return false},ID:function(e){return e[1].replace(bL,"")},TAG:function(bS,e){return bS[1].replace(bL,"").toLowerCase()},CHILD:function(e){if(e[1]==="nth"){if(!e[2]){bz.error(e[0])}e[2]=e[2].replace(/^\+|\s*/g,"");var bS=/(-?)(\d*)(?:n([+\-]?\d*))?/.exec(e[2]==="even"&&"2n"||e[2]==="odd"&&"2n+1"||!/\D/.test(e[2])&&"0n+"+e[2]||e[2]);e[2]=(bS[1]+(bS[2]||1))-0;e[3]=bS[3]-0}else{if(e[2]){bz.error(e[0])}}e[0]=bJ++;return e},ATTR:function(bV,bS,bT,e,bW,bX){var bU=bV[1]=bV[1].replace(bL,"");if(!bX&&bF.attrMap[bU]){bV[1]=bF.attrMap[bU]}bV[4]=(bV[4]||bV[5]||"").replace(bL,"");if(bV[2]==="~="){bV[4]=" "+bV[4]+" "}return bV},PSEUDO:function(bV,bS,bT,e,bW){if(bV[1]==="not"){if((bI.exec(bV[3])||"").length>1||/^\w/.test(bV[3])){bV[3]=bz(bV[3],null,null,bS)}else{var bU=bz.filter(bV[3],bS,bT,true^bW);if(!bT){e.push.apply(e,bU)}return false}}else{if(bF.match.POS.test(bV[0])||bF.match.CHILD.test(bV[0])){return true}}return bV},POS:function(e){e.unshift(true);return e}},filters:{enabled:function(e){return e.disabled===false&&e.type!=="hidden"},disabled:function(e){return e.disabled===true},checked:function(e){return e.checked===true},selected:function(e){if(e.parentNode){e.parentNode.selectedIndex}return e.selected===true},parent:function(e){return !!e.firstChild},empty:function(e){return !e.firstChild},has:function(bT,bS,e){return !!bz(e[3],bT).length},header:function(e){return(/h\d/i).test(e.nodeName)},text:function(bT){var e=bT.getAttribute("type"),bS=bT.type;return bT.nodeName.toLowerCase()==="input"&&"text"===bS&&(e===bS||e===null)},radio:function(e){return e.nodeName.toLowerCase()==="input"&&"radio"===e.type},checkbox:function(e){return e.nodeName.toLowerCase()==="input"&&"checkbox"===e.type},file:function(e){return e.nodeName.toLowerCase()==="input"&&"file"===e.type},password:function(e){return e.nodeName.toLowerCase()==="input"&&"password"===e.type},submit:function(bS){var e=bS.nodeName.toLowerCase();return(e==="input"||e==="button")&&"submit"===bS.type},image:function(e){return e.nodeName.toLowerCase()==="input"&&"image"===e.type},reset:function(bS){var e=bS.nodeName.toLowerCase();return(e==="input"||e==="button")&&"reset"===bS.type},button:function(bS){var e=bS.nodeName.toLowerCase();return e==="input"&&"button"===bS.type||e==="button"},input:function(e){return(/input|select|textarea|button/i).test(e.nodeName)},focus:function(e){return e===e.ownerDocument.activeElement}},setFilters:{first:function(bS,e){return e===0},last:function(bT,bS,e,bU){return bS===bU.length-1},even:function(bS,e){return e%2===0},odd:function(bS,e){return e%2===1},lt:function(bT,bS,e){return bS<e[3]-0},gt:function(bT,bS,e){return bS>e[3]-0},nth:function(bT,bS,e){return e[3]-0===bS},eq:function(bT,bS,e){return e[3]-0===bS}},filter:{PSEUDO:function(bT,bY,bX,bZ){var e=bY[1],bS=bF.filters[e];if(bS){return bS(bT,bX,bY,bZ)}else{if(e==="contains"){return(bT.textContent||bT.innerText||bx([bT])||"").indexOf(bY[3])>=0}else{if(e==="not"){var bU=bY[3];for(var bW=0,bV=bU.length;bW<bV;bW++){if(bU[bW]===bT){return false}}return true}else{bz.error(e)}}}},CHILD:function(bT,bV){var bU,b1,bX,b0,e,bW,bZ,bY=bV[1],bS=bT;switch(bY){case"only":case"first":while((bS=bS.previousSibling)){if(bS.nodeType===1){return false}}if(bY==="first"){return true}bS=bT;case"last":while((bS=bS.nextSibling)){if(bS.nodeType===1){return false}}return true;case"nth":bU=bV[2];b1=bV[3];if(bU===1&&b1===0){return true}bX=bV[0];b0=bT.parentNode;if(b0&&(b0[bD]!==bX||!bT.nodeIndex)){bW=0;for(bS=b0.firstChild;bS;bS=bS.nextSibling){if(bS.nodeType===1){bS.nodeIndex=++bW}}b0[bD]=bX}bZ=bT.nodeIndex-b1;if(bU===0){return bZ===0}else{return(bZ%bU===0&&bZ/bU>=0)}}},ID:function(bS,e){return bS.nodeType===1&&bS.getAttribute("id")===e},TAG:function(bS,e){return(e==="*"&&bS.nodeType===1)||!!bS.nodeName&&bS.nodeName.toLowerCase()===e},CLASS:function(bS,e){return(" "+(bS.className||bS.getAttribute("class"))+" ").indexOf(e)>-1},ATTR:function(bW,bU){var bT=bU[1],e=bz.attr?bz.attr(bW,bT):bF.attrHandle[bT]?bF.attrHandle[bT](bW):bW[bT]!=null?bW[bT]:bW.getAttribute(bT),bX=e+"",bV=bU[2],bS=bU[4];return e==null?bV==="!=":!bV&&bz.attr?e!=null:bV==="="?bX===bS:bV==="*="?bX.indexOf(bS)>=0:bV==="~="?(" "+bX+" ").indexOf(bS)>=0:!bS?bX&&e!==false:bV==="!="?bX!==bS:bV==="^="?bX.indexOf(bS)===0:bV==="$="?bX.substr(bX.length-bS.length)===bS:bV==="|="?bX===bS||bX.substr(0,bS.length+1)===bS+"-":false},POS:function(bV,bS,bT,bW){var e=bS[2],bU=bF.setFilters[e];if(bU){return bU(bV,bT,bS,bW)}}}};var bE=bF.match.POS,by=function(bS,e){return"\\"+(e-0+1)};for(var bA in bF.match){bF.match[bA]=new RegExp(bF.match[bA].source+(/(?![^\[]*\])(?![^\(]*\))/.source));bF.leftMatch[bA]=new RegExp(/(^(?:.|\r|\n)*?)/.source+bF.match[bA].source.replace(/\\(\d+)/g,by))}var bG=function(bS,e){bS=Array.prototype.slice.call(bS,0);if(e){e.push.apply(e,bS);return e}return bS};try{Array.prototype.slice.call(aw.documentElement.childNodes,0)[0].nodeType}catch(bQ){bG=function(bV,bU){var bT=0,bS=bU||[];if(bM.call(bV)==="[object Array]"){Array.prototype.push.apply(bS,bV)}else{if(typeof bV.length==="number"){for(var e=bV.length;bT<e;bT++){bS.push(bV[bT])}}else{for(;bV[bT];bT++){bS.push(bV[bT])}}}return bS}}var bK,bH;if(aw.documentElement.compareDocumentPosition){bK=function(bS,e){if(bS===e){bC=true;return 0}if(!bS.compareDocumentPosition||!e.compareDocumentPosition){return bS.compareDocumentPosition?-1:1}return bS.compareDocumentPosition(e)&4?-1:1}}else{bK=function(bZ,bY){if(bZ===bY){bC=true;return 0}else{if(bZ.sourceIndex&&bY.sourceIndex){return bZ.sourceIndex-bY.sourceIndex}}var bW,bS,bT=[],e=[],bV=bZ.parentNode,bX=bY.parentNode,b0=bV;if(bV===bX){return bH(bZ,bY)}else{if(!bV){return -1}else{if(!bX){return 1}}}while(b0){bT.unshift(b0);b0=b0.parentNode}b0=bX;while(b0){e.unshift(b0);b0=b0.parentNode}bW=bT.length;bS=e.length;for(var bU=0;bU<bW&&bU<bS;bU++){if(bT[bU]!==e[bU]){return bH(bT[bU],e[bU])}}return bU===bW?bH(bZ,e[bU],-1):bH(bT[bU],bY,1)};bH=function(bS,e,bT){if(bS===e){return bT}var bU=bS.nextSibling;while(bU){if(bU===e){return -1}bU=bU.nextSibling}return 1}}(function(){var bS=aw.createElement("div"),bT="script"+(new Date()).getTime(),e=aw.documentElement;bS.innerHTML="<a name='"+bT+"'/>";e.insertBefore(bS,e.firstChild);if(aw.getElementById(bT)){bF.find.ID=function(bV,bW,bX){if(typeof bW.getElementById!=="undefined"&&!bX){var bU=bW.getElementById(bV[1]);return bU?bU.id===bV[1]||typeof bU.getAttributeNode!=="undefined"&&bU.getAttributeNode("id").nodeValue===bV[1]?[bU]:M:[]}};bF.filter.ID=function(bW,bU){var bV=typeof bW.getAttributeNode!=="undefined"&&bW.getAttributeNode("id");return bW.nodeType===1&&bV&&bV.nodeValue===bU}}e.removeChild(bS);e=bS=null})();(function(){var e=aw.createElement("div");e.appendChild(aw.createComment(""));if(e.getElementsByTagName("*").length>0){bF.find.TAG=function(bS,bW){var bV=bW.getElementsByTagName(bS[1]);if(bS[1]==="*"){var bU=[];for(var bT=0;bV[bT];bT++){if(bV[bT].nodeType===1){bU.push(bV[bT])}}bV=bU}return bV}}e.innerHTML="<a href='#'></a>";if(e.firstChild&&typeof e.firstChild.getAttribute!=="undefined"&&e.firstChild.getAttribute("href")!=="#"){bF.attrHandle.href=function(bS){return bS.getAttribute("href",2)}}e=null})();if(aw.querySelectorAll){(function(){var e=bz,bU=aw.createElement("div"),bT="__sizzle__";bU.innerHTML="<p class='TEST'></p>";if(bU.querySelectorAll&&bU.querySelectorAll(".TEST").length===0){return}bz=function(b5,bW,b0,b4){bW=bW||aw;if(!b4&&!bz.isXML(bW)){var b3=/^(\w+$)|^\.([\w\-]+$)|^#([\w\-]+$)/.exec(b5);if(b3&&(bW.nodeType===1||bW.nodeType===9)){if(b3[1]){return bG(bW.getElementsByTagName(b5),b0)}else{if(b3[2]&&bF.find.CLASS&&bW.getElementsByClassName){return bG(bW.getElementsByClassName(b3[2]),b0)}}}if(bW.nodeType===9){if(b5==="body"&&bW.body){return bG([bW.body],b0)}else{if(b3&&b3[3]){var bZ=bW.getElementById(b3[3]);if(bZ&&bZ.parentNode){if(bZ.id===b3[3]){return bG([bZ],b0)}}else{return bG([],b0)}}}try{return bG(bW.querySelectorAll(b5),b0)}catch(b1){}}else{if(bW.nodeType===1&&bW.nodeName.toLowerCase()!=="object"){var bX=bW,bY=bW.getAttribute("id"),bV=bY||bT,b7=bW.parentNode,b6=/^\s*[+~]/.test(b5);if(!bY){bW.setAttribute("id",bV)}else{bV=bV.replace(/'/g,"\\$&")}if(b6&&b7){bW=bW.parentNode}try{if(!b6||b7){return bG(bW.querySelectorAll("[id='"+bV+"'] "+b5),b0)}}catch(b2){}finally{if(!bY){bX.removeAttribute("id")}}}}}return e(b5,bW,b0,b4)};for(var bS in e){bz[bS]=e[bS]}bU=null})()}(function(){var e=aw.documentElement,bT=e.matchesSelector||e.mozMatchesSelector||e.webkitMatchesSelector||e.msMatchesSelector;if(bT){var bV=!bT.call(aw.createElement("div"),"div"),bS=false;try{bT.call(aw.documentElement,"[test!='']:sizzle")}catch(bU){bS=true}bz.matchesSelector=function(bX,bZ){bZ=bZ.replace(/\=\s*([^'"\]]*)\s*\]/g,"='$1']");if(!bz.isXML(bX)){try{if(bS||!bF.match.PSEUDO.test(bZ)&&!/!=/.test(bZ)){var bW=bT.call(bX,bZ);if(bW||!bV||bX.document&&bX.document.nodeType!==11){return bW}}}catch(bY){}}return bz(bZ,null,null,[bX]).length>0}}})();(function(){var e=aw.createElement("div");e.innerHTML="<div class='test e'></div><div class='test'></div>";if(!e.getElementsByClassName||e.getElementsByClassName("e").length===0){return}e.lastChild.className="e";if(e.getElementsByClassName("e").length===1){return}bF.order.splice(1,0,"CLASS");bF.find.CLASS=function(bS,bT,bU){if(typeof bT.getElementsByClassName!=="undefined"&&!bU){return bT.getElementsByClassName(bS[1])}};e=null})();function bw(bS,bX,bW,b0,bY,bZ){for(var bU=0,bT=b0.length;bU<bT;bU++){var e=b0[bU];if(e){var bV=false;e=e[bS];while(e){if(e[bD]===bW){bV=b0[e.sizset];break}if(e.nodeType===1&&!bZ){e[bD]=bW;e.sizset=bU}if(e.nodeName.toLowerCase()===bX){bV=e;break}e=e[bS]}b0[bU]=bV}}}function bO(bS,bX,bW,b0,bY,bZ){for(var bU=0,bT=b0.length;bU<bT;bU++){var e=b0[bU];if(e){var bV=false;e=e[bS];while(e){if(e[bD]===bW){bV=b0[e.sizset];break}if(e.nodeType===1){if(!bZ){e[bD]=bW;e.sizset=bU}if(typeof bX!=="string"){if(e===bX){bV=true;break}}else{if(bz.filter(bX,[e]).length>0){bV=e;break}}}e=e[bS]}b0[bU]=bV}}}if(aw.documentElement.contains){bz.contains=function(bS,e){return bS!==e&&(bS.contains?bS.contains(e):true)}}else{if(aw.documentElement.compareDocumentPosition){bz.contains=function(bS,e){return !!(bS.compareDocumentPosition(e)&16)}}else{bz.contains=function(){return false}}}bz.isXML=function(e){var bS=(e?e.ownerDocument||e:0).documentElement;return bS?bS.nodeName!=="HTML":false};var bN=function(bT,e,bX){var bW,bY=[],bV="",bZ=e.nodeType?[e]:e;while((bW=bF.match.PSEUDO.exec(bT))){bV+=bW[0];bT=bT.replace(bF.match.PSEUDO,"")}bT=bF.relative[bT]?bT+"*":bT;for(var bU=0,bS=bZ.length;bU<bS;bU++){bz(bT,bZ[bU],bY,bX)}return bz.filter(bV,bY)};bz.attr=c.attr;bz.selectors.attrMap={};c.find=bz;c.expr=bz.selectors;c.expr[":"]=c.expr.filters;c.unique=bz.uniqueSort;c.text=bz.getText;c.isXMLDoc=bz.isXML;c.contains=bz.contains})();var ac=/Until$/,ar=/^(?:parents|prevUntil|prevAll)/,ba=/,/,bq=/^.[^:#\[\.,]*$/,Q=Array.prototype.slice,I=c.expr.match.POS,az={children:true,contents:true,next:true,prev:true};c.fn.extend({find:function(e){var bx=this,bz,bw;if(typeof e!=="string"){return c(e).filter(function(){for(bz=0,bw=bx.length;bz<bw;bz++){if(c.contains(bx[bz],this)){return true}}})}var by=this.pushStack("","find",e),bB,bC,bA;for(bz=0,bw=this.length;bz<bw;bz++){bB=by.length;c.find(e,this[bz],by);if(bz>0){for(bC=bB;bC<by.length;bC++){for(bA=0;bA<bB;bA++){if(by[bA]===by[bC]){by.splice(bC--,1);break}}}}}return by},has:function(bw){var e=c(bw);return this.filter(function(){for(var by=0,bx=e.length;by<bx;by++){if(c.contains(this,e[by])){return true}}})},not:function(e){return this.pushStack(aH(this,e,false),"not",e)},filter:function(e){return this.pushStack(aH(this,e,true),"filter",e)},is:function(e){return !!e&&(typeof e==="string"?I.test(e)?c(e,this.context).index(this[0])>=0:c.filter(e,this).length>0:this.filter(e).length>0)},closest:function(bz,by){var bw=[],bx,e,bA=this[0];if(c.isArray(bz)){var bC=1;while(bA&&bA.ownerDocument&&bA!==by){for(bx=0;bx<bz.length;bx++){if(c(bA).is(bz[bx])){bw.push({selector:bz[bx],elem:bA,level:bC})}}bA=bA.parentNode;bC++}return bw}var bB=I.test(bz)||typeof bz!=="string"?c(bz,by||this.context):0;for(bx=0,e=this.length;bx<e;bx++){bA=this[bx];while(bA){if(bB?bB.index(bA)>-1:c.find.matchesSelector(bA,bz)){bw.push(bA);break}else{bA=bA.parentNode;if(!bA||!bA.ownerDocument||bA===by||bA.nodeType===11){break}}}}bw=bw.length>1?c.unique(bw):bw;return this.pushStack(bw,"closest",bz)},index:function(e){if(!e){return(this[0]&&this[0].parentNode)?this.prevAll().length:-1}if(typeof e==="string"){return c.inArray(this[0],c(e))}return c.inArray(e.jquery?e[0]:e,this)},add:function(e,bw){var by=typeof e==="string"?c(e,bw):c.makeArray(e&&e.nodeType?[e]:e),bx=c.merge(this.get(),by);return this.pushStack(D(by[0])||D(bx[0])?bx:c.unique(bx))},andSelf:function(){return this.add(this.prevObject)}});function D(e){return !e||!e.parentNode||e.parentNode.nodeType===11}c.each({parent:function(bw){var e=bw.parentNode;return e&&e.nodeType!==11?e:null},parents:function(e){return c.dir(e,"parentNode")},parentsUntil:function(bw,e,bx){return c.dir(bw,"parentNode",bx)},next:function(e){return c.nth(e,2,"nextSibling")},prev:function(e){return c.nth(e,2,"previousSibling")},nextAll:function(e){return c.dir(e,"nextSibling")},prevAll:function(e){return c.dir(e,"previousSibling")},nextUntil:function(bw,e,bx){return c.dir(bw,"nextSibling",bx)},prevUntil:function(bw,e,bx){return c.dir(bw,"previousSibling",bx)},siblings:function(e){return c.sibling(e.parentNode.firstChild,e)},children:function(e){return c.sibling(e.firstChild)},contents:function(e){return c.nodeName(e,"iframe")?e.contentDocument||e.contentWindow.document:c.makeArray(e.childNodes)}},function(e,bw){c.fn[e]=function(bz,bx){var by=c.map(this,bw,bz);if(!ac.test(e)){bx=bz}if(bx&&typeof bx==="string"){by=c.filter(bx,by)}by=this.length>1&&!az[e]?c.unique(by):by;if((this.length>1||ba.test(bx))&&ar.test(e)){by=by.reverse()}return this.pushStack(by,e,Q.call(arguments).join(","))}});c.extend({filter:function(bx,e,bw){if(bw){bx=":not("+bx+")"}return e.length===1?c.find.matchesSelector(e[0],bx)?[e[0]]:[]:c.find.matches(bx,e)},dir:function(bx,bw,bz){var e=[],by=bx[bw];while(by&&by.nodeType!==9&&(bz===M||by.nodeType!==1||!c(by).is(bz))){if(by.nodeType===1){e.push(by)}by=by[bw]}return e},nth:function(bz,e,bx,by){e=e||1;var bw=0;for(;bz;bz=bz[bx]){if(bz.nodeType===1&&++bw===e){break}}return bz},sibling:function(bx,bw){var e=[];for(;bx;bx=bx.nextSibling){if(bx.nodeType===1&&bx!==bw){e.push(bx)}}return e}});function aH(by,bx,e){bx=bx||0;if(c.isFunction(bx)){return c.grep(by,function(bA,bz){var bB=!!bx.call(bA,bz,bA);return bB===e})}else{if(bx.nodeType){return c.grep(by,function(bA,bz){return(bA===bx)===e})}else{if(typeof bx==="string"){var bw=c.grep(by,function(bz){return bz.nodeType===1});if(bq.test(bx)){return c.filter(bx,bw,!e)}else{bx=c.filter(bx,bw)}}}}return c.grep(by,function(bA,bz){return(c.inArray(bA,bx)>=0)===e})}function b(e){var bx=aS.split("|"),bw=e.createDocumentFragment();if(bw.createElement){while(bx.length){bw.createElement(bx.pop())}}return bw}var aS="abbr|article|aside|audio|canvas|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",ah=/ jQuery\d+="(?:\d+|null)"/g,at=/^\s+/,S=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,f=/<([\w:]+)/,x=/<tbody/i,X=/<|&#?\w+;/,af=/<(?:script|style)/i,P=/<(?:script|object|embed|option|style)/i,ai=new RegExp("<(?:"+aS+")","i"),p=/checked\s*(?:[^=]|=\s*.checked.)/i,bn=/\/(java|ecma)script/i,aO=/^\s*<!(?:\[CDATA\[|\-\-)/,ay={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],area:[1,"<map>","</map>"],_default:[0,"",""]},ad=b(aw);ay.optgroup=ay.option;ay.tbody=ay.tfoot=ay.colgroup=ay.caption=ay.thead;ay.th=ay.td;if(!c.support.htmlSerialize){ay._default=[1,"div<div>","</div>"]}c.fn.extend({text:function(e){if(c.isFunction(e)){return this.each(function(bx){var bw=c(this);bw.text(e.call(this,bx,bw.text()))})}if(typeof e!=="object"&&e!==M){return this.empty().append((this[0]&&this[0].ownerDocument||aw).createTextNode(e))}return c.text(this)},wrapAll:function(e){if(c.isFunction(e)){return this.each(function(bx){c(this).wrapAll(e.call(this,bx))})}if(this[0]){var bw=c(e,this[0].ownerDocument).eq(0).clone(true);if(this[0].parentNode){bw.insertBefore(this[0])}bw.map(function(){var bx=this;while(bx.firstChild&&bx.firstChild.nodeType===1){bx=bx.firstChild}return bx}).append(this)}return this},wrapInner:function(e){if(c.isFunction(e)){return this.each(function(bw){c(this).wrapInner(e.call(this,bw))})}return this.each(function(){var bw=c(this),bx=bw.contents();if(bx.length){bx.wrapAll(e)}else{bw.append(e)}})},wrap:function(e){var bw=c.isFunction(e);return this.each(function(bx){c(this).wrapAll(bw?e.call(this,bx):e)})},unwrap:function(){return this.parent().each(function(){if(!c.nodeName(this,"body")){c(this).replaceWith(this.childNodes)}}).end()},append:function(){return this.domManip(arguments,true,function(e){if(this.nodeType===1){this.appendChild(e)}})},prepend:function(){return this.domManip(arguments,true,function(e){if(this.nodeType===1){this.insertBefore(e,this.firstChild)}})},before:function(){if(this[0]&&this[0].parentNode){return this.domManip(arguments,false,function(bw){this.parentNode.insertBefore(bw,this)})}else{if(arguments.length){var e=c.clean(arguments);e.push.apply(e,this.toArray());return this.pushStack(e,"before",arguments)}}},after:function(){if(this[0]&&this[0].parentNode){return this.domManip(arguments,false,function(bw){this.parentNode.insertBefore(bw,this.nextSibling)})}else{if(arguments.length){var e=this.pushStack(this,"after",arguments);e.push.apply(e,c.clean(arguments));return e}}},remove:function(e,by){for(var bw=0,bx;(bx=this[bw])!=null;bw++){if(!e||c.filter(e,[bx]).length){if(!by&&bx.nodeType===1){c.cleanData(bx.getElementsByTagName("*"));c.cleanData([bx])}if(bx.parentNode){bx.parentNode.removeChild(bx)}}}return this},empty:function(){for(var e=0,bw;(bw=this[e])!=null;e++){if(bw.nodeType===1){c.cleanData(bw.getElementsByTagName("*"))}while(bw.firstChild){bw.removeChild(bw.firstChild)}}return this},clone:function(bw,e){bw=bw==null?false:bw;e=e==null?bw:e;return this.map(function(){return c.clone(this,bw,e)})},html:function(by){if(by===M){return this[0]&&this[0].nodeType===1?this[0].innerHTML.replace(ah,""):null}else{if(typeof by==="string"&&!af.test(by)&&(c.support.leadingWhitespace||!at.test(by))&&!ay[(f.exec(by)||["",""])[1].toLowerCase()]){by=by.replace(S,"<$1></$2>");try{for(var bx=0,bw=this.length;bx<bw;bx++){if(this[bx].nodeType===1){c.cleanData(this[bx].getElementsByTagName("*"));this[bx].innerHTML=by}}}catch(bz){this.empty().append(by)}}else{if(c.isFunction(by)){this.each(function(bA){var e=c(this);e.html(by.call(this,bA,e.html()))})}else{this.empty().append(by)}}}return this},replaceWith:function(e){if(this[0]&&this[0].parentNode){if(c.isFunction(e)){return this.each(function(by){var bx=c(this),bw=bx.html();bx.replaceWith(e.call(this,by,bw))})}if(typeof e!=="string"){e=c(e).detach()}return this.each(function(){var bx=this.nextSibling,bw=this.parentNode;c(this).remove();if(bx){c(bx).before(e)}else{c(bw).append(e)}})}else{return this.length?this.pushStack(c(c.isFunction(e)?e():e),"replaceWith",e):this}},detach:function(e){return this.remove(e,true)},domManip:function(bC,bG,bF){var by,bz,bB,bE,bD=bC[0],bw=[];if(!c.support.checkClone&&arguments.length===3&&typeof bD==="string"&&p.test(bD)){return this.each(function(){c(this).domManip(bC,bG,bF,true)})}if(c.isFunction(bD)){return this.each(function(bI){var bH=c(this);bC[0]=bD.call(this,bI,bG?bH.html():M);bH.domManip(bC,bG,bF)})}if(this[0]){bE=bD&&bD.parentNode;if(c.support.parentNode&&bE&&bE.nodeType===11&&bE.childNodes.length===this.length){by={fragment:bE}}else{by=c.buildFragment(bC,this,bw)}bB=by.fragment;if(bB.childNodes.length===1){bz=bB=bB.firstChild}else{bz=bB.firstChild}if(bz){bG=bG&&c.nodeName(bz,"tr");for(var bx=0,e=this.length,bA=e-1;bx<e;bx++){bF.call(bG?bb(this[bx],bz):this[bx],by.cacheable||(e>1&&bx<bA)?c.clone(bB,true,true):bB)}}if(bw.length){c.each(bw,bp)}}return this}});function bb(e,bw){return c.nodeName(e,"table")?(e.getElementsByTagName("tbody")[0]||e.appendChild(e.ownerDocument.createElement("tbody"))):e}function u(bC,bw){if(bw.nodeType!==1||!c.hasData(bC)){return}var bz,by,e,bB=c._data(bC),bA=c._data(bw,bB),bx=bB.events;if(bx){delete bA.handle;bA.events={};for(bz in bx){for(by=0,e=bx[bz].length;by<e;by++){c.event.add(bw,bz+(bx[bz][by].namespace?".":"")+bx[bz][by].namespace,bx[bz][by],bx[bz][by].data)}}}if(bA.data){bA.data=c.extend({},bA.data)}}function aj(bw,e){var bx;if(e.nodeType!==1){return}if(e.clearAttributes){e.clearAttributes()}if(e.mergeAttributes){e.mergeAttributes(bw)}bx=e.nodeName.toLowerCase();if(bx==="object"){e.outerHTML=bw.outerHTML}else{if(bx==="input"&&(bw.type==="checkbox"||bw.type==="radio")){if(bw.checked){e.defaultChecked=e.checked=bw.checked}if(e.value!==bw.value){e.value=bw.value}}else{if(bx==="option"){e.selected=bw.defaultSelected}else{if(bx==="input"||bx==="textarea"){e.defaultValue=bw.defaultValue}}}}e.removeAttribute(c.expando)}c.buildFragment=function(bA,by,bw){var bz,e,bx,bB,bC=bA[0];if(by&&by[0]){bB=by[0].ownerDocument||by[0]}if(!bB.createDocumentFragment){bB=aw}if(bA.length===1&&typeof bC==="string"&&bC.length<512&&bB===aw&&bC.charAt(0)==="<"&&!P.test(bC)&&(c.support.checkClone||!p.test(bC))&&(c.support.html5Clone||!ai.test(bC))){e=true;bx=c.fragments[bC];if(bx&&bx!==1){bz=bx}}if(!bz){bz=bB.createDocumentFragment();c.clean(bA,bB,bz,bw)}if(e){c.fragments[bC]=bx?bz:1}return{fragment:bz,cacheable:e}};c.fragments={};c.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(e,bw){c.fn[e]=function(bx){var bA=[],bD=c(bx),bC=this.length===1&&this[0].parentNode;if(bC&&bC.nodeType===11&&bC.childNodes.length===1&&bD.length===1){bD[bw](this[0]);return this}else{for(var bB=0,by=bD.length;bB<by;bB++){var bz=(bB>0?this.clone(true):this).get();c(bD[bB])[bw](bz);bA=bA.concat(bz)}return this.pushStack(bA,e,bD.selector)}}});function bh(e){if(typeof e.getElementsByTagName!=="undefined"){return e.getElementsByTagName("*")}else{if(typeof e.querySelectorAll!=="undefined"){return e.querySelectorAll("*")}else{return[]}}}function aA(e){if(e.type==="checkbox"||e.type==="radio"){e.defaultChecked=e.checked}}function F(e){var bw=(e.nodeName||"").toLowerCase();if(bw==="input"){aA(e)}else{if(bw!=="script"&&typeof e.getElementsByTagName!=="undefined"){c.grep(e.getElementsByTagName("input"),aA)}}}function am(e){var bw=aw.createElement("div");ad.appendChild(bw);bw.innerHTML=e.outerHTML;return bw.firstChild}c.extend({clone:function(bz,bB,bx){var e,bw,by,bA=c.support.html5Clone||!ai.test("<"+bz.nodeName)?bz.cloneNode(true):am(bz);if((!c.support.noCloneEvent||!c.support.noCloneChecked)&&(bz.nodeType===1||bz.nodeType===11)&&!c.isXMLDoc(bz)){aj(bz,bA);e=bh(bz);bw=bh(bA);for(by=0;e[by];++by){if(bw[by]){aj(e[by],bw[by])}}}if(bB){u(bz,bA);if(bx){e=bh(bz);bw=bh(bA);for(by=0;e[by];++by){u(e[by],bw[by])}}}e=bw=null;return bA},clean:function(bx,bz,bI,bB){var bG;bz=bz||aw;if(typeof bz.createElement==="undefined"){bz=bz.ownerDocument||bz[0]&&bz[0].ownerDocument||aw}var bJ=[],bC;for(var bF=0,bA;(bA=bx[bF])!=null;bF++){if(typeof bA==="number"){bA+=""}if(!bA){continue}if(typeof bA==="string"){if(!X.test(bA)){bA=bz.createTextNode(bA)}else{bA=bA.replace(S,"<$1></$2>");var bL=(f.exec(bA)||["",""])[1].toLowerCase(),by=ay[bL]||ay._default,bE=by[0],bw=bz.createElement("div");if(bz===aw){ad.appendChild(bw)}else{b(bz).appendChild(bw)}bw.innerHTML=by[1]+bA+by[2];while(bE--){bw=bw.lastChild}if(!c.support.tbody){var e=x.test(bA),bD=bL==="table"&&!e?bw.firstChild&&bw.firstChild.childNodes:by[1]==="<table>"&&!e?bw.childNodes:[];for(bC=bD.length-1;bC>=0;--bC){if(c.nodeName(bD[bC],"tbody")&&!bD[bC].childNodes.length){bD[bC].parentNode.removeChild(bD[bC])}}}if(!c.support.leadingWhitespace&&at.test(bA)){bw.insertBefore(bz.createTextNode(at.exec(bA)[0]),bw.firstChild)}bA=bw.childNodes}}var bH;if(!c.support.appendChecked){if(bA[0]&&typeof(bH=bA.length)==="number"){for(bC=0;bC<bH;bC++){F(bA[bC])}}else{F(bA)}}if(bA.nodeType){bJ.push(bA)}else{bJ=c.merge(bJ,bA)}}if(bI){bG=function(bM){return !bM.type||bn.test(bM.type)};for(bF=0;bJ[bF];bF++){if(bB&&c.nodeName(bJ[bF],"script")&&(!bJ[bF].type||bJ[bF].type.toLowerCase()==="text/javascript")){bB.push(bJ[bF].parentNode?bJ[bF].parentNode.removeChild(bJ[bF]):bJ[bF])}else{if(bJ[bF].nodeType===1){var bK=c.grep(bJ[bF].getElementsByTagName("script"),bG);bJ.splice.apply(bJ,[bF+1,0].concat(bK))}bI.appendChild(bJ[bF])}}}return bJ},cleanData:function(bw){var bz,bx,e=c.cache,bC=c.event.special,bB=c.support.deleteExpando;for(var bA=0,by;(by=bw[bA])!=null;bA++){if(by.nodeName&&c.noData[by.nodeName.toLowerCase()]){continue}bx=by[c.expando];if(bx){bz=e[bx];if(bz&&bz.events){for(var bD in bz.events){if(bC[bD]){c.event.remove(by,bD)}else{c.removeEvent(by,bD,bz.handle)}}if(bz.handle){bz.handle.elem=null}}if(bB){delete by[c.expando]}else{if(by.removeAttribute){by.removeAttribute(c.expando)}}delete e[bx]}}}});function bp(e,bw){if(bw.src){c.ajax({url:bw.src,async:false,dataType:"script"})}else{c.globalEval((bw.text||bw.textContent||bw.innerHTML||"").replace(aO,"/*$0*/"))}if(bw.parentNode){bw.parentNode.removeChild(bw)}}var al=/alpha\([^)]*\)/i,av=/opacity=([^)]*)/,A=/([A-Z]|^ms)/g,bd=/^-?\d+(?:px)?$/i,bo=/^-?\d/,J=/^([\-+])=([\-+.\de]+)/,a8={position:"absolute",visibility:"hidden",display:"block"},ao=["Left","Right"],a2=["Top","Bottom"],aa,aJ,aY;c.fn.css=function(e,bw){if(arguments.length===2&&bw===M){return this}return c.access(this,e,bw,true,function(by,bx,bz){return bz!==M?c.style(by,bx,bz):c.css(by,bx)})};c.extend({cssHooks:{opacity:{get:function(bx,bw){if(bw){var e=aa(bx,"opacity","opacity");return e===""?"1":e}else{return bx.style.opacity}}}},cssNumber:{fillOpacity:true,fontWeight:true,lineHeight:true,opacity:true,orphans:true,widows:true,zIndex:true,zoom:true},cssProps:{"float":c.support.cssFloat?"cssFloat":"styleFloat"},style:function(by,bx,bE,bz){if(!by||by.nodeType===3||by.nodeType===8||!by.style){return}var bC,bD,bA=c.camelCase(bx),bw=by.style,bF=c.cssHooks[bA];bx=c.cssProps[bA]||bA;if(bE!==M){bD=typeof bE;if(bD==="string"&&(bC=J.exec(bE))){bE=(+(bC[1]+1)*+bC[2])+parseFloat(c.css(by,bx));bD="number"}if(bE==null||bD==="number"&&isNaN(bE)){return}if(bD==="number"&&!c.cssNumber[bA]){bE+="px"}if(!bF||!("set" in bF)||(bE=bF.set(by,bE))!==M){try{bw[bx]=bE}catch(bB){}}}else{if(bF&&"get" in bF&&(bC=bF.get(by,false,bz))!==M){return bC}return bw[bx]}},css:function(bz,by,bw){var bx,e;by=c.camelCase(by);e=c.cssHooks[by];by=c.cssProps[by]||by;if(by==="cssFloat"){by="float"}if(e&&"get" in e&&(bx=e.get(bz,true,bw))!==M){return bx}else{if(aa){return aa(bz,by)}}},swap:function(by,bx,bz){var e={};for(var bw in bx){e[bw]=by.style[bw];by.style[bw]=bx[bw]}bz.call(by);for(bw in bx){by.style[bw]=e[bw]}}});c.curCSS=c.css;c.each(["height","width"],function(bw,e){c.cssHooks[e]={get:function(bz,by,bx){var bA;if(by){if(bz.offsetWidth!==0){return q(bz,e,bx)}else{c.swap(bz,a8,function(){bA=q(bz,e,bx)})}return bA}},set:function(bx,by){if(bd.test(by)){by=parseFloat(by);if(by>=0){return by+"px"}}else{return by}}}});if(!c.support.opacity){c.cssHooks.opacity={get:function(bw,e){return av.test((e&&bw.currentStyle?bw.currentStyle.filter:bw.style.filter)||"")?(parseFloat(RegExp.$1)/100)+"":e?"1":""},set:function(bz,bA){var by=bz.style,bw=bz.currentStyle,e=c.isNumeric(bA)?"alpha(opacity="+bA*100+")":"",bx=bw&&bw.filter||by.filter||"";by.zoom=1;if(bA>=1&&c.trim(bx.replace(al,""))===""){by.removeAttribute("filter");if(bw&&!bw.filter){return}}by.filter=al.test(bx)?bx.replace(al,e):bx+" "+e}}}c(function(){if(!c.support.reliableMarginRight){c.cssHooks.marginRight={get:function(bx,bw){var e;c.swap(bx,{display:"inline-block"},function(){if(bw){e=aa(bx,"margin-right","marginRight")}else{e=bx.style.marginRight}});return e}}}});if(aw.defaultView&&aw.defaultView.getComputedStyle){aJ=function(bz,bx){var bw,by,e;bx=bx.replace(A,"-$1").toLowerCase();if((by=bz.ownerDocument.defaultView)&&(e=by.getComputedStyle(bz,null))){bw=e.getPropertyValue(bx);if(bw===""&&!c.contains(bz.ownerDocument.documentElement,bz)){bw=c.style(bz,bx)}}return bw}}if(aw.documentElement.currentStyle){aY=function(bA,bx){var bB,e,bz,bw=bA.currentStyle&&bA.currentStyle[bx],by=bA.style;if(bw===null&&by&&(bz=by[bx])){bw=bz}if(!bd.test(bw)&&bo.test(bw)){bB=by.left;e=bA.runtimeStyle&&bA.runtimeStyle.left;if(e){bA.runtimeStyle.left=bA.currentStyle.left}by.left=bx==="fontSize"?"1em":(bw||0);bw=by.pixelLeft+"px";by.left=bB;if(e){bA.runtimeStyle.left=e}}return bw===""?"auto":bw}}aa=aJ||aY;function q(bz,bx,bw){var bB=bx==="width"?bz.offsetWidth:bz.offsetHeight,bA=bx==="width"?ao:a2,by=0,e=bA.length;if(bB>0){if(bw!=="border"){for(;by<e;by++){if(!bw){bB-=parseFloat(c.css(bz,"padding"+bA[by]))||0}if(bw==="margin"){bB+=parseFloat(c.css(bz,bw+bA[by]))||0}else{bB-=parseFloat(c.css(bz,"border"+bA[by]+"Width"))||0}}}return bB+"px"}bB=aa(bz,bx,bx);if(bB<0||bB==null){bB=bz.style[bx]||0}bB=parseFloat(bB)||0;if(bw){for(;by<e;by++){bB+=parseFloat(c.css(bz,"padding"+bA[by]))||0;if(bw!=="padding"){bB+=parseFloat(c.css(bz,"border"+bA[by]+"Width"))||0}if(bw==="margin"){bB+=parseFloat(c.css(bz,bw+bA[by]))||0}}}return bB+"px"}if(c.expr&&c.expr.filters){c.expr.filters.hidden=function(bx){var bw=bx.offsetWidth,e=bx.offsetHeight;return(bw===0&&e===0)||(!c.support.reliableHiddenOffsets&&((bx.style&&bx.style.display)||c.css(bx,"display"))==="none")};c.expr.filters.visible=function(e){return !c.expr.filters.hidden(e)}}var l=/%20/g,aq=/\[\]$/,bt=/\r?\n/g,br=/#.*$/,aE=/^(.*?):[ \t]*([^\r\n]*)\r?$/mg,a0=/^(?:color|date|datetime|datetime-local|email|hidden|month|number|password|range|search|tel|text|time|url|week)$/i,aN=/^(?:about|app|app\-storage|.+\-extension|file|res|widget):$/,aR=/^(?:GET|HEAD)$/,d=/^\/\//,N=/\?/,a7=/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,r=/^(?:select|textarea)/i,i=/\s+/,bs=/([?&])_=[^&]*/,L=/^([\w\+\.\-]+:)(?:\/\/([^\/?#:]*)(?::(\d+))?)?/,B=c.fn.load,ab={},s={},aF,t,aW=["*/"]+["*"];try{aF=bm.href}catch(ax){aF=aw.createElement("a");aF.href="";aF=aF.href}t=L.exec(aF.toLowerCase())||[];function g(e){return function(bz,bB){if(typeof bz!=="string"){bB=bz;bz="*"}if(c.isFunction(bB)){var by=bz.toLowerCase().split(i),bx=0,bA=by.length,bw,bC,bD;for(;bx<bA;bx++){bw=by[bx];bD=/^\+/.test(bw);if(bD){bw=bw.substr(1)||"*"}bC=e[bw]=e[bw]||[];bC[bD?"unshift":"push"](bB)}}}}function aX(bw,bF,bA,bE,bC,by){bC=bC||bF.dataTypes[0];by=by||{};by[bC]=true;var bB=bw[bC],bx=0,e=bB?bB.length:0,bz=(bw===ab),bD;for(;bx<e&&(bz||!bD);bx++){bD=bB[bx](bF,bA,bE);if(typeof bD==="string"){if(!bz||by[bD]){bD=M}else{bF.dataTypes.unshift(bD);bD=aX(bw,bF,bA,bE,bD,by)}}}if((bz||!bD)&&!by["*"]){bD=aX(bw,bF,bA,bE,"*",by)}return bD}function an(bx,by){var bw,e,bz=c.ajaxSettings.flatOptions||{};for(bw in by){if(by[bw]!==M){(bz[bw]?bx:(e||(e={})))[bw]=by[bw]}}if(e){c.extend(true,bx,e)}}c.fn.extend({load:function(bx,bA,bB){if(typeof bx!=="string"&&B){return B.apply(this,arguments)}else{if(!this.length){return this}}var bz=bx.indexOf(" ");if(bz>=0){var e=bx.slice(bz,bx.length);bx=bx.slice(0,bz)}var by="GET";if(bA){if(c.isFunction(bA)){bB=bA;bA=M}else{if(typeof bA==="object"){bA=c.param(bA,c.ajaxSettings.traditional);by="POST"}}}var bw=this;c.ajax({url:bx,type:by,dataType:"html",data:bA,complete:function(bD,bC,bE){bE=bD.responseText;if(bD.isResolved()){bD.done(function(bF){bE=bF});bw.html(e?c("<div>").append(bE.replace(a7,"")).find(e):bE)}if(bB){bw.each(bB,[bE,bC,bD])}}});return this},serialize:function(){return c.param(this.serializeArray())},serializeArray:function(){return this.map(function(){return this.elements?c.makeArray(this.elements):this}).filter(function(){return this.name&&!this.disabled&&(this.checked||r.test(this.nodeName)||a0.test(this.type))}).map(function(e,bw){var bx=c(this).val();return bx==null?null:c.isArray(bx)?c.map(bx,function(bz,by){return{name:bw.name,value:bz.replace(bt,"\r\n")}}):{name:bw.name,value:bx.replace(bt,"\r\n")}}).get()}});c.each("ajaxStart ajaxStop ajaxComplete ajaxError ajaxSuccess ajaxSend".split(" "),function(e,bw){c.fn[bw]=function(bx){return this.on(bw,bx)}});c.each(["get","post"],function(e,bw){c[bw]=function(bx,bz,bA,by){if(c.isFunction(bz)){by=by||bA;bA=bz;bz=M}return c.ajax({type:bw,url:bx,data:bz,success:bA,dataType:by})}});c.extend({getScript:function(e,bw){return c.get(e,M,bw,"script")},getJSON:function(e,bw,bx){return c.get(e,bw,bx,"json")},ajaxSetup:function(bw,e){if(e){an(bw,c.ajaxSettings)}else{e=bw;bw=c.ajaxSettings}an(bw,e);return bw},ajaxSettings:{url:aF,isLocal:aN.test(t[1]),global:true,type:"GET",contentType:"application/x-www-form-urlencoded",processData:true,async:true,accepts:{xml:"application/xml, text/xml",html:"text/html",text:"text/plain",json:"application/json, text/javascript","*":aW},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText"},converters:{"* text":bc.String,"text html":true,"text json":c.parseJSON,"text xml":c.parseXML},flatOptions:{context:true,url:true}},ajaxPrefilter:g(ab),ajaxTransport:g(s),ajax:function(bA,by){if(typeof bA==="object"){by=bA;bA=M}by=by||{};var bE=c.ajaxSetup({},by),bT=bE.context||bE,bH=bT!==bE&&(bT.nodeType||bT instanceof c)?c(bT):c.event,bS=c.Deferred(),bO=c.Callbacks("once memory"),bC=bE.statusCode||{},bD,bI={},bP={},bR,bz,bM,bF,bJ,bB=0,bx,bL,bK={readyState:0,setRequestHeader:function(bU,bV){if(!bB){var e=bU.toLowerCase();bU=bP[e]=bP[e]||bU;bI[bU]=bV}return this},getAllResponseHeaders:function(){return bB===2?bR:null},getResponseHeader:function(bU){var e;if(bB===2){if(!bz){bz={};while((e=aE.exec(bR))){bz[e[1].toLowerCase()]=e[2]}}e=bz[bU.toLowerCase()]}return e===M?null:e},overrideMimeType:function(e){if(!bB){bE.mimeType=e}return this},abort:function(e){e=e||"abort";if(bM){bM.abort(e)}bG(0,e);return this}};function bG(b0,bV,b1,bX){if(bB===2){return}bB=2;if(bF){clearTimeout(bF)}bM=M;bR=bX||"";bK.readyState=b0>0?4:0;var bU,b5,b4,bY=bV,bZ=b1?bk(bE,bK,b1):M,bW,b3;if(b0>=200&&b0<300||b0===304){if(bE.ifModified){if((bW=bK.getResponseHeader("Last-Modified"))){c.lastModified[bD]=bW}if((b3=bK.getResponseHeader("Etag"))){c.etag[bD]=b3}}if(b0===304){bY="notmodified";bU=true}else{try{b5=H(bE,bZ);bY="success";bU=true}catch(b2){bY="parsererror";b4=b2}}}else{b4=bY;if(!bY||b0){bY="error";if(b0<0){b0=0}}}bK.status=b0;bK.statusText=""+(bV||bY);if(bU){bS.resolveWith(bT,[b5,bY,bK])}else{bS.rejectWith(bT,[bK,bY,b4])}bK.statusCode(bC);bC=M;if(bx){bH.trigger("ajax"+(bU?"Success":"Error"),[bK,bE,bU?b5:b4])}bO.fireWith(bT,[bK,bY]);if(bx){bH.trigger("ajaxComplete",[bK,bE]);if(!(--c.active)){c.event.trigger("ajaxStop")}}}bS.promise(bK);bK.success=bK.done;bK.error=bK.fail;bK.complete=bO.add;bK.statusCode=function(bU){if(bU){var e;if(bB<2){for(e in bU){bC[e]=[bC[e],bU[e]]}}else{e=bU[bK.status];bK.then(e,e)}}return this};bE.url=((bA||bE.url)+"").replace(br,"").replace(d,t[1]+"//");bE.dataTypes=c.trim(bE.dataType||"*").toLowerCase().split(i);if(bE.crossDomain==null){bJ=L.exec(bE.url.toLowerCase());bE.crossDomain=!!(bJ&&(bJ[1]!=t[1]||bJ[2]!=t[2]||(bJ[3]||(bJ[1]==="http:"?80:443))!=(t[3]||(t[1]==="http:"?80:443))))}if(bE.data&&bE.processData&&typeof bE.data!=="string"){bE.data=c.param(bE.data,bE.traditional)}aX(ab,bE,by,bK);if(bB===2){return false}bx=bE.global;bE.type=bE.type.toUpperCase();bE.hasContent=!aR.test(bE.type);if(bx&&c.active++===0){c.event.trigger("ajaxStart")}if(!bE.hasContent){if(bE.data){bE.url+=(N.test(bE.url)?"&":"?")+bE.data;delete bE.data}bD=bE.url;if(bE.cache===false){var bw=c.now(),bQ=bE.url.replace(bs,"$1_="+bw);bE.url=bQ+((bQ===bE.url)?(N.test(bE.url)?"&":"?")+"_="+bw:"")}}if(bE.data&&bE.hasContent&&bE.contentType!==false||by.contentType){bK.setRequestHeader("Content-Type",bE.contentType)}if(bE.ifModified){bD=bD||bE.url;if(c.lastModified[bD]){bK.setRequestHeader("If-Modified-Since",c.lastModified[bD])}if(c.etag[bD]){bK.setRequestHeader("If-None-Match",c.etag[bD])}}bK.setRequestHeader("Accept",bE.dataTypes[0]&&bE.accepts[bE.dataTypes[0]]?bE.accepts[bE.dataTypes[0]]+(bE.dataTypes[0]!=="*"?", "+aW+"; q=0.01":""):bE.accepts["*"]);for(bL in bE.headers){bK.setRequestHeader(bL,bE.headers[bL])}if(bE.beforeSend&&(bE.beforeSend.call(bT,bK,bE)===false||bB===2)){bK.abort();return false}for(bL in {success:1,error:1,complete:1}){bK[bL](bE[bL])}bM=aX(s,bE,by,bK);if(!bM){bG(-1,"No Transport")}else{bK.readyState=1;if(bx){bH.trigger("ajaxSend",[bK,bE])}if(bE.async&&bE.timeout>0){bF=setTimeout(function(){bK.abort("timeout")},bE.timeout)}try{bB=1;bM.send(bI,bG)}catch(bN){if(bB<2){bG(-1,bN)}else{throw bN}}}return bK},param:function(e,bx){var bw=[],bz=function(bA,bB){bB=c.isFunction(bB)?bB():bB;bw[bw.length]=encodeURIComponent(bA)+"="+encodeURIComponent(bB)};if(bx===M){bx=c.ajaxSettings.traditional}if(c.isArray(e)||(e.jquery&&!c.isPlainObject(e))){c.each(e,function(){bz(this.name,this.value)})}else{for(var by in e){w(by,e[by],bx,bz)}}return bw.join("&").replace(l,"+")}});function w(bx,bz,bw,by){if(c.isArray(bz)){c.each(bz,function(bB,bA){if(bw||aq.test(bx)){by(bx,bA)}else{w(bx+"["+(typeof bA==="object"||c.isArray(bA)?bB:"")+"]",bA,bw,by)}})}else{if(!bw&&bz!=null&&typeof bz==="object"){for(var e in bz){w(bx+"["+e+"]",bz[e],bw,by)}}else{by(bx,bz)}}}c.extend({active:0,lastModified:{},etag:{}});function bk(bE,bD,bA){var bw=bE.contents,bC=bE.dataTypes,bx=bE.responseFields,bz,bB,by,e;for(bB in bx){if(bB in bA){bD[bx[bB]]=bA[bB]}}while(bC[0]==="*"){bC.shift();if(bz===M){bz=bE.mimeType||bD.getResponseHeader("content-type")}}if(bz){for(bB in bw){if(bw[bB]&&bw[bB].test(bz)){bC.unshift(bB);break}}}if(bC[0] in bA){by=bC[0]}else{for(bB in bA){if(!bC[0]||bE.converters[bB+" "+bC[0]]){by=bB;break}if(!e){e=bB}}by=by||e}if(by){if(by!==bC[0]){bC.unshift(by)}return bA[by]}}function H(bI,bA){if(bI.dataFilter){bA=bI.dataFilter(bA,bI.dataType)}var bE=bI.dataTypes,bH={},bB,bF,bx=bE.length,bC,bD=bE[0],by,bz,bG,bw,e;for(bB=1;bB<bx;bB++){if(bB===1){for(bF in bI.converters){if(typeof bF==="string"){bH[bF.toLowerCase()]=bI.converters[bF]}}}by=bD;bD=bE[bB];if(bD==="*"){bD=by}else{if(by!=="*"&&by!==bD){bz=by+" "+bD;bG=bH[bz]||bH["* "+bD];if(!bG){e=M;for(bw in bH){bC=bw.split(" ");if(bC[0]===by||bC[0]==="*"){e=bH[bC[1]+" "+bD];if(e){bw=bH[bw];if(bw===true){bG=e}else{if(e===true){bG=bw}}break}}}}if(!(bG||e)){c.error("No conversion from "+bz.replace(" "," to "))}if(bG!==true){bA=bG?bG(bA):e(bw(bA))}}}}return bA}var aD=c.now(),v=/(\=)\?(&|$)|\?\?/i;c.ajaxSetup({jsonp:"callback",jsonpCallback:function(){return c.expando+"_"+(aD++)}});c.ajaxPrefilter("json jsonp",function(bE,bB,bD){var by=bE.contentType==="application/x-www-form-urlencoded"&&(typeof bE.data==="string");if(bE.dataTypes[0]==="jsonp"||bE.jsonp!==false&&(v.test(bE.url)||by&&v.test(bE.data))){var bC,bx=bE.jsonpCallback=c.isFunction(bE.jsonpCallback)?bE.jsonpCallback():bE.jsonpCallback,bA=bc[bx],e=bE.url,bz=bE.data,bw="$1"+bx+"$2";if(bE.jsonp!==false){e=e.replace(v,bw);if(bE.url===e){if(by){bz=bz.replace(v,bw)}if(bE.data===bz){e+=(/\?/.test(e)?"&":"?")+bE.jsonp+"="+bx}}}bE.url=e;bE.data=bz;bc[bx]=function(bF){bC=[bF]};bD.always(function(){bc[bx]=bA;if(bC&&c.isFunction(bA)){bc[bx](bC[0])}});bE.converters["script json"]=function(){if(!bC){c.error(bx+" was not called")}return bC[0]};bE.dataTypes[0]="json";return"script"}});c.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/javascript|ecmascript/},converters:{"text script":function(e){c.globalEval(e);return e}}});c.ajaxPrefilter("script",function(e){if(e.cache===M){e.cache=false}if(e.crossDomain){e.type="GET";e.global=false}});c.ajaxTransport("script",function(bx){if(bx.crossDomain){var e,bw=aw.head||aw.getElementsByTagName("head")[0]||aw.documentElement;return{send:function(by,bz){e=aw.createElement("script");e.async="async";if(bx.scriptCharset){e.charset=bx.scriptCharset}e.src=bx.url;e.onload=e.onreadystatechange=function(bB,bA){if(bA||!e.readyState||/loaded|complete/.test(e.readyState)){e.onload=e.onreadystatechange=null;if(bw&&e.parentNode){bw.removeChild(e)}e=M;if(!bA){bz(200,"success")}}};bw.insertBefore(e,bw.firstChild)},abort:function(){if(e){e.onload(0,1)}}}}});var C=bc.ActiveXObject?function(){for(var e in O){O[e](0,1)}}:false,z=0,O;function aM(){try{return new bc.XMLHttpRequest()}catch(bw){}}function ak(){try{return new bc.ActiveXObject("Microsoft.XMLHTTP")}catch(bw){}}c.ajaxSettings.xhr=bc.ActiveXObject?function(){return !this.isLocal&&aM()||ak()}:aM;(function(e){c.extend(c.support,{ajax:!!e,cors:!!e&&("withCredentials" in e)})})(c.ajaxSettings.xhr());if(c.support.ajax){c.ajaxTransport(function(e){if(!e.crossDomain||c.support.cors){var bw;return{send:function(bC,bx){var bB=e.xhr(),bA,bz;if(e.username){bB.open(e.type,e.url,e.async,e.username,e.password)}else{bB.open(e.type,e.url,e.async)}if(e.xhrFields){for(bz in e.xhrFields){bB[bz]=e.xhrFields[bz]}}if(e.mimeType&&bB.overrideMimeType){bB.overrideMimeType(e.mimeType)}if(!e.crossDomain&&!bC["X-Requested-With"]){bC["X-Requested-With"]="XMLHttpRequest"}try{for(bz in bC){bB.setRequestHeader(bz,bC[bz])}}catch(by){}bB.send((e.hasContent&&e.data)||null);bw=function(bL,bF){var bG,bE,bD,bJ,bI;try{if(bw&&(bF||bB.readyState===4)){bw=M;if(bA){bB.onreadystatechange=c.noop;if(C){delete O[bA]}}if(bF){if(bB.readyState!==4){bB.abort()}}else{bG=bB.status;bD=bB.getAllResponseHeaders();bJ={};bI=bB.responseXML;if(bI&&bI.documentElement){bJ.xml=bI}bJ.text=bB.responseText;try{bE=bB.statusText}catch(bK){bE=""}if(!bG&&e.isLocal&&!e.crossDomain){bG=bJ.text?200:404}else{if(bG===1223){bG=204}}}}}catch(bH){if(!bF){bx(-1,bH)}}if(bJ){bx(bG,bE,bJ,bD)}};if(!e.async||bB.readyState===4){bw()}else{bA=++z;if(C){if(!O){O={};c(bc).unload(C)}O[bA]=bw}bB.onreadystatechange=bw}},abort:function(){if(bw){bw(0,1)}}}}})}var R={},a9,n,aC=/^(?:toggle|show|hide)$/,aU=/^([+\-]=)?([\d+.\-]+)([a-z%]*)$/i,a4,aI=[["height","marginTop","marginBottom","paddingTop","paddingBottom"],["width","marginLeft","marginRight","paddingLeft","paddingRight"],["opacity"]],a5;c.fn.extend({show:function(by,bB,bA){var bx,bz;if(by||by===0){return this.animate(a1("show",3),by,bB,bA)}else{for(var bw=0,e=this.length;bw<e;bw++){bx=this[bw];if(bx.style){bz=bx.style.display;if(!c._data(bx,"olddisplay")&&bz==="none"){bz=bx.style.display=""}if(bz===""&&c.css(bx,"display")==="none"){c._data(bx,"olddisplay",y(bx.nodeName))}}}for(bw=0;bw<e;bw++){bx=this[bw];if(bx.style){bz=bx.style.display;if(bz===""||bz==="none"){bx.style.display=c._data(bx,"olddisplay")||""}}}return this}},hide:function(by,bB,bA){if(by||by===0){return this.animate(a1("hide",3),by,bB,bA)}else{var bx,bz,bw=0,e=this.length;for(;bw<e;bw++){bx=this[bw];if(bx.style){bz=c.css(bx,"display");if(bz!=="none"&&!c._data(bx,"olddisplay")){c._data(bx,"olddisplay",bz)}}}for(bw=0;bw<e;bw++){if(this[bw].style){this[bw].style.display="none"}}return this}},_toggle:c.fn.toggle,toggle:function(bx,bw,by){var e=typeof bx==="boolean";if(c.isFunction(bx)&&c.isFunction(bw)){this._toggle.apply(this,arguments)}else{if(bx==null||e){this.each(function(){var bz=e?bx:c(this).is(":hidden");c(this)[bz?"show":"hide"]()})}else{this.animate(a1("toggle",3),bx,bw,by)}}return this},fadeTo:function(e,by,bx,bw){return this.filter(":hidden").css("opacity",0).show().end().animate({opacity:by},e,bx,bw)},animate:function(bA,bx,bz,by){var e=c.speed(bx,bz,by);if(c.isEmptyObject(bA)){return this.each(e.complete,[false])}bA=c.extend({},bA);function bw(){if(e.queue===false){c._mark(this)}var bF=c.extend({},e),bL=this.nodeType===1,bJ=bL&&c(this).is(":hidden"),bC,bG,bE,bK,bI,bD,bH,bM,bB;bF.animatedProperties={};for(bE in bA){bC=c.camelCase(bE);if(bE!==bC){bA[bC]=bA[bE];delete bA[bE]}bG=bA[bC];if(c.isArray(bG)){bF.animatedProperties[bC]=bG[1];bG=bA[bC]=bG[0]}else{bF.animatedProperties[bC]=bF.specialEasing&&bF.specialEasing[bC]||bF.easing||"swing"}if(bG==="hide"&&bJ||bG==="show"&&!bJ){return bF.complete.call(this)}if(bL&&(bC==="height"||bC==="width")){bF.overflow=[this.style.overflow,this.style.overflowX,this.style.overflowY];if(c.css(this,"display")==="inline"&&c.css(this,"float")==="none"){if(!c.support.inlineBlockNeedsLayout||y(this.nodeName)==="inline"){this.style.display="inline-block"}else{this.style.zoom=1}}}}if(bF.overflow!=null){this.style.overflow="hidden"}for(bE in bA){bK=new c.fx(this,bF,bE);bG=bA[bE];if(aC.test(bG)){bB=c._data(this,"toggle"+bE)||(bG==="toggle"?bJ?"show":"hide":0);if(bB){c._data(this,"toggle"+bE,bB==="show"?"hide":"show");bK[bB]()}else{bK[bG]()}}else{bI=aU.exec(bG);bD=bK.cur();if(bI){bH=parseFloat(bI[2]);bM=bI[3]||(c.cssNumber[bE]?"":"px");if(bM!=="px"){c.style(this,bE,(bH||1)+bM);bD=((bH||1)/bK.cur())*bD;c.style(this,bE,bD+bM)}if(bI[1]){bH=((bI[1]==="-="?-1:1)*bH)+bD}bK.custom(bD,bH,bM)}else{bK.custom(bD,bG,"")}}}return true}return e.queue===false?this.each(bw):this.queue(e.queue,bw)},stop:function(bx,bw,e){if(typeof bx!=="string"){e=bw;bw=bx;bx=M}if(bw&&bx!==false){this.queue(bx||"fx",[])}return this.each(function(){var by,bz=false,bB=c.timers,bA=c._data(this);if(!e){c._unmark(true,this)}function bC(bF,bG,bE){var bD=bG[bE];c.removeData(bF,bE,true);bD.stop(e)}if(bx==null){for(by in bA){if(bA[by]&&bA[by].stop&&by.indexOf(".run")===by.length-4){bC(this,bA,by)}}}else{if(bA[by=bx+".run"]&&bA[by].stop){bC(this,bA,by)}}for(by=bB.length;by--;){if(bB[by].elem===this&&(bx==null||bB[by].queue===bx)){if(e){bB[by](true)}else{bB[by].saveState()}bz=true;bB.splice(by,1)}}if(!(e&&bz)){c.dequeue(this,bx)}})}});function bi(){setTimeout(au,0);return(a5=c.now())}function au(){a5=M}function a1(bw,e){var bx={};c.each(aI.concat.apply([],aI.slice(0,e)),function(){bx[this]=bw});return bx}c.each({slideDown:a1("show",1),slideUp:a1("hide",1),slideToggle:a1("toggle",1),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(e,bw){c.fn[e]=function(bx,bz,by){return this.animate(bw,bx,bz,by)}});c.extend({speed:function(bx,by,bw){var e=bx&&typeof bx==="object"?c.extend({},bx):{complete:bw||!bw&&by||c.isFunction(bx)&&bx,duration:bx,easing:bw&&by||by&&!c.isFunction(by)&&by};e.duration=c.fx.off?0:typeof e.duration==="number"?e.duration:e.duration in c.fx.speeds?c.fx.speeds[e.duration]:c.fx.speeds._default;if(e.queue==null||e.queue===true){e.queue="fx"}e.old=e.complete;e.complete=function(bz){if(c.isFunction(e.old)){e.old.call(this)}if(e.queue){c.dequeue(this,e.queue)}else{if(bz!==false){c._unmark(this)}}};return e},easing:{linear:function(bx,by,e,bw){return e+bw*bx},swing:function(bx,by,e,bw){return((-Math.cos(bx*Math.PI)/2)+0.5)*bw+e}},timers:[],fx:function(bw,e,bx){this.options=e;this.elem=bw;this.prop=bx;e.orig=e.orig||{}}});c.fx.prototype={update:function(){if(this.options.step){this.options.step.call(this.elem,this.now,this)}(c.fx.step[this.prop]||c.fx.step._default)(this)},cur:function(){if(this.elem[this.prop]!=null&&(!this.elem.style||this.elem.style[this.prop]==null)){return this.elem[this.prop]}var e,bw=c.css(this.elem,this.prop);return isNaN(e=parseFloat(bw))?!bw||bw==="auto"?0:bw:e},custom:function(bA,bz,by){var e=this,bx=c.fx;this.startTime=a5||bi();this.end=bz;this.now=this.start=bA;this.pos=this.state=0;this.unit=by||this.unit||(c.cssNumber[this.prop]?"":"px");function bw(bB){return e.step(bB)}bw.queue=this.options.queue;bw.elem=this.elem;bw.saveState=function(){if(e.options.hide&&c._data(e.elem,"fxshow"+e.prop)===M){c._data(e.elem,"fxshow"+e.prop,e.start)}};if(bw()&&c.timers.push(bw)&&!a4){a4=setInterval(bx.tick,bx.interval)}},show:function(){var e=c._data(this.elem,"fxshow"+this.prop);this.options.orig[this.prop]=e||c.style(this.elem,this.prop);this.options.show=true;if(e!==M){this.custom(this.cur(),e)}else{this.custom(this.prop==="width"||this.prop==="height"?1:0,this.cur())}c(this.elem).show()},hide:function(){this.options.orig[this.prop]=c._data(this.elem,"fxshow"+this.prop)||c.style(this.elem,this.prop);this.options.hide=true;this.custom(this.cur(),0)},step:function(bz){var bB,bC,bw,by=a5||bi(),e=true,bA=this.elem,bx=this.options;if(bz||by>=bx.duration+this.startTime){this.now=this.end;this.pos=this.state=1;this.update();bx.animatedProperties[this.prop]=true;for(bB in bx.animatedProperties){if(bx.animatedProperties[bB]!==true){e=false}}if(e){if(bx.overflow!=null&&!c.support.shrinkWrapBlocks){c.each(["","X","Y"],function(bD,bE){bA.style["overflow"+bE]=bx.overflow[bD]})}if(bx.hide){c(bA).hide()}if(bx.hide||bx.show){for(bB in bx.animatedProperties){c.style(bA,bB,bx.orig[bB]);c.removeData(bA,"fxshow"+bB,true);c.removeData(bA,"toggle"+bB,true)}}bw=bx.complete;if(bw){bx.complete=false;bw.call(bA)}}return false}else{if(bx.duration==Infinity){this.now=by}else{bC=by-this.startTime;this.state=bC/bx.duration;this.pos=c.easing[bx.animatedProperties[this.prop]](this.state,bC,0,1,bx.duration);this.now=this.start+((this.end-this.start)*this.pos)}this.update()}return true}};c.extend(c.fx,{tick:function(){var bx,bw=c.timers,e=0;for(;e<bw.length;e++){bx=bw[e];if(!bx()&&bw[e]===bx){bw.splice(e--,1)}}if(!bw.length){c.fx.stop()}},interval:13,stop:function(){clearInterval(a4);a4=null},speeds:{slow:600,fast:200,_default:400},step:{opacity:function(e){c.style(e.elem,"opacity",e.now)},_default:function(e){if(e.elem.style&&e.elem.style[e.prop]!=null){e.elem.style[e.prop]=e.now+e.unit}else{e.elem[e.prop]=e.now}}}});c.each(["width","height"],function(e,bw){c.fx.step[bw]=function(bx){c.style(bx.elem,bw,Math.max(0,bx.now)+bx.unit)}});if(c.expr&&c.expr.filters){c.expr.filters.animated=function(e){return c.grep(c.timers,function(bw){return e===bw.elem}).length}}function y(by){if(!R[by]){var e=aw.body,bw=c("<"+by+">").appendTo(e),bx=bw.css("display");bw.remove();if(bx==="none"||bx===""){if(!a9){a9=aw.createElement("iframe");a9.frameBorder=a9.width=a9.height=0}e.appendChild(a9);if(!n||!a9.createElement){n=(a9.contentWindow||a9.contentDocument).document;n.write((aw.compatMode==="CSS1Compat"?"<!doctype html>":"")+"<html><body>");n.close()}bw=n.createElement(by);n.body.appendChild(bw);bx=c.css(bw,"display");e.removeChild(a9)}R[by]=bx}return R[by]}var W=/^t(?:able|d|h)$/i,ae=/^(?:body|html)$/i;if("getBoundingClientRect" in aw.documentElement){c.fn.offset=function(bJ){var bz=this[0],bC;if(bJ){return this.each(function(e){c.offset.setOffset(this,bJ,e)})}if(!bz||!bz.ownerDocument){return null}if(bz===bz.ownerDocument.body){return c.offset.bodyOffset(bz)}try{bC=bz.getBoundingClientRect()}catch(bG){}var bI=bz.ownerDocument,bx=bI.documentElement;if(!bC||!c.contains(bx,bz)){return bC?{top:bC.top,left:bC.left}:{top:0,left:0}}var bD=bI.body,bE=aL(bI),bB=bx.clientTop||bD.clientTop||0,bF=bx.clientLeft||bD.clientLeft||0,bw=bE.pageYOffset||c.support.boxModel&&bx.scrollTop||bD.scrollTop,bA=bE.pageXOffset||c.support.boxModel&&bx.scrollLeft||bD.scrollLeft,bH=bC.top+bw-bB,by=bC.left+bA-bF;return{top:bH,left:by}}}else{c.fn.offset=function(bG){var bA=this[0];if(bG){return this.each(function(bH){c.offset.setOffset(this,bG,bH)})}if(!bA||!bA.ownerDocument){return null}if(bA===bA.ownerDocument.body){return c.offset.bodyOffset(bA)}var bD,bx=bA.offsetParent,bw=bA,bF=bA.ownerDocument,by=bF.documentElement,bB=bF.body,bC=bF.defaultView,e=bC?bC.getComputedStyle(bA,null):bA.currentStyle,bE=bA.offsetTop,bz=bA.offsetLeft;while((bA=bA.parentNode)&&bA!==bB&&bA!==by){if(c.support.fixedPosition&&e.position==="fixed"){break}bD=bC?bC.getComputedStyle(bA,null):bA.currentStyle;bE-=bA.scrollTop;bz-=bA.scrollLeft;if(bA===bx){bE+=bA.offsetTop;bz+=bA.offsetLeft;if(c.support.doesNotAddBorder&&!(c.support.doesAddBorderForTableAndCells&&W.test(bA.nodeName))){bE+=parseFloat(bD.borderTopWidth)||0;bz+=parseFloat(bD.borderLeftWidth)||0}bw=bx;bx=bA.offsetParent}if(c.support.subtractsBorderForOverflowNotVisible&&bD.overflow!=="visible"){bE+=parseFloat(bD.borderTopWidth)||0;bz+=parseFloat(bD.borderLeftWidth)||0}e=bD}if(e.position==="relative"||e.position==="static"){bE+=bB.offsetTop;bz+=bB.offsetLeft}if(c.support.fixedPosition&&e.position==="fixed"){bE+=Math.max(by.scrollTop,bB.scrollTop);bz+=Math.max(by.scrollLeft,bB.scrollLeft)}return{top:bE,left:bz}}}c.offset={bodyOffset:function(e){var bx=e.offsetTop,bw=e.offsetLeft;if(c.support.doesNotIncludeMarginInBodyOffset){bx+=parseFloat(c.css(e,"marginTop"))||0;bw+=parseFloat(c.css(e,"marginLeft"))||0}return{top:bx,left:bw}},setOffset:function(by,bH,bB){var bC=c.css(by,"position");if(bC==="static"){by.style.position="relative"}var bA=c(by),bw=bA.offset(),e=c.css(by,"top"),bF=c.css(by,"left"),bG=(bC==="absolute"||bC==="fixed")&&c.inArray("auto",[e,bF])>-1,bE={},bD={},bx,bz;if(bG){bD=bA.position();bx=bD.top;bz=bD.left}else{bx=parseFloat(e)||0;bz=parseFloat(bF)||0}if(c.isFunction(bH)){bH=bH.call(by,bB,bw)}if(bH.top!=null){bE.top=(bH.top-bw.top)+bx}if(bH.left!=null){bE.left=(bH.left-bw.left)+bz}if("using" in bH){bH.using.call(by,bE)}else{bA.css(bE)}}};c.fn.extend({position:function(){if(!this[0]){return null}var bx=this[0],bw=this.offsetParent(),by=this.offset(),e=ae.test(bw[0].nodeName)?{top:0,left:0}:bw.offset();by.top-=parseFloat(c.css(bx,"marginTop"))||0;by.left-=parseFloat(c.css(bx,"marginLeft"))||0;e.top+=parseFloat(c.css(bw[0],"borderTopWidth"))||0;e.left+=parseFloat(c.css(bw[0],"borderLeftWidth"))||0;return{top:by.top-e.top,left:by.left-e.left}},offsetParent:function(){return this.map(function(){var e=this.offsetParent||aw.body;while(e&&(!ae.test(e.nodeName)&&c.css(e,"position")==="static")){e=e.offsetParent}return e})}});c.each(["Left","Top"],function(bw,e){var bx="scroll"+e;c.fn[bx]=function(bA){var by,bz;if(bA===M){by=this[0];if(!by){return null}bz=aL(by);return bz?("pageXOffset" in bz)?bz[bw?"pageYOffset":"pageXOffset"]:c.support.boxModel&&bz.document.documentElement[bx]||bz.document.body[bx]:by[bx]}return this.each(function(){bz=aL(this);if(bz){bz.scrollTo(!bw?bA:c(bz).scrollLeft(),bw?bA:c(bz).scrollTop())}else{this[bx]=bA}})}});function aL(e){return c.isWindow(e)?e:e.nodeType===9?e.defaultView||e.parentWindow:false}c.each(["Height","Width"],function(bw,e){var bx=e.toLowerCase();c.fn["inner"+e]=function(){var by=this[0];return by?by.style?parseFloat(c.css(by,bx,"padding")):this[bx]():null};c.fn["outer"+e]=function(bz){var by=this[0];return by?by.style?parseFloat(c.css(by,bx,bz?"margin":"border")):this[bx]():null};c.fn[bx]=function(bA){var bB=this[0];if(!bB){return bA==null?null:this}if(c.isFunction(bA)){return this.each(function(bF){var bE=c(this);bE[bx](bA.call(this,bF,bE[bx]()))})}if(c.isWindow(bB)){var bC=bB.document.documentElement["client"+e],by=bB.document.body;return bB.document.compatMode==="CSS1Compat"&&bC||by&&by["client"+e]||bC}else{if(bB.nodeType===9){return Math.max(bB.documentElement["client"+e],bB.body["scroll"+e],bB.documentElement["scroll"+e],bB.body["offset"+e],bB.documentElement["offset"+e])}else{if(bA===M){var bD=c.css(bB,bx),bz=parseFloat(bD);return c.isNumeric(bz)?bz:bD}else{return this.css(bx,typeof bA==="string"?bA:bA+"px")}}}}});bc.jQuery=bc.$=c;if(typeof define==="function"&&define.amd&&define.amd.jQuery){define("jquery",[],function(){return c})}})(window);
/*!
 * https://github.com/es-shims/es5-shim
 * @license es5-shim Copyright 2009-2014 by contributors, MIT License
 * see https://github.com/es-shims/es5-shim/blob/master/LICENSE
 */
;(function(b,c){if(typeof define==="function"&&define.amd){define(c)}else{if(typeof exports==="object"){module.exports=c()}else{b.returnExports=c()}}}(this,function(){var ay=Array.prototype;var aW=Object.prototype;var aQ=Function.prototype;var an=String.prototype;var V=Number.prototype;var az=ay.slice;var F=ay.splice;var am=ay.push;var al=ay.unshift;var W=aQ.call;var aj=aW.toString;var d=Array.isArray||function d(e){return aj.call(e)==="[object Array]"};var y=typeof Symbol==="function"&&typeof Symbol.toStringTag==="symbol";var K;var b=Function.prototype.toString,ao=function ao(aY){try{b.call(aY);return true}catch(aZ){return false}},aJ="[object Function]",s="[object GeneratorFunction]";K=function K(e){if(typeof e!=="function"){return false}if(y){return ao(e)}var aY=aj.call(e);return aY===aJ||aY===s};var v;var ab=RegExp.prototype.exec,w=function w(aY){try{ab.call(aY);return true}catch(aZ){return false}},I="[object RegExp]";v=function v(e){if(typeof e!=="object"){return false}return y?w(e):aj.call(e)===I};var aP;var A=String.prototype.valueOf,aU=function aU(aY){try{A.call(aY);return true}catch(aZ){return false}},aa="[object String]";aP=function aP(e){if(typeof e==="string"){return true}if(typeof e!=="object"){return false}return y?aU(e):aj.call(e)===aa};var f=function f(aY){var aZ=aj.call(aY);var e=aZ==="[object Arguments]";if(!e){e=!d(aY)&&aY!==null&&typeof aY==="object"&&typeof aY.length==="number"&&aY.length>=0&&K(aY.callee)}return e};var l=(function(aZ){var a0=Object.defineProperty&&(function(){try{Object.defineProperty({},"x",{});return true}catch(a1){return false}}());var e;if(a0){e=function(a2,a1,a4,a3){if(!a3&&(a1 in a2)){return}Object.defineProperty(a2,a1,{configurable:true,enumerable:false,writable:true,value:a4})}}else{e=function(a2,a1,a4,a3){if(!a3&&(a1 in a2)){return}a2[a1]=a4}}return function aY(a2,a4,a3){for(var a1 in a4){if(aZ.call(a4,a1)){e(a2,a1,a4[a1],a3)}}}}(aW.hasOwnProperty));function ad(e){var aY=typeof e;return e===null||aY==="undefined"||aY==="boolean"||aY==="number"||aY==="string"}var Q={ToInteger:function aF(e){var aY=+e;if(aY!==aY){aY=0}else{if(aY!==0&&aY!==(1/0)&&aY!==-(1/0)){aY=(aY>0||-1)*Math.floor(Math.abs(aY))}}return aY},ToPrimitive:function q(aY){var a0,e,aZ;if(ad(aY)){return aY}e=aY.valueOf;if(K(e)){a0=e.call(aY);if(ad(a0)){return a0}}aZ=aY.toString;if(K(aZ)){a0=aZ.call(aY);if(ad(a0)){return a0}}throw new TypeError()},ToObject:function(e){if(e==null){throw new TypeError("can't convert "+e+" to object")}return Object(e)},ToUint32:function ag(e){return e>>>0}};var aK=function aK(){};l(aQ,{bind:function aM(a2){var a3=this;if(!K(a3)){throw new TypeError("Function.prototype.bind called on incompatible "+a3)}var aZ=az.call(arguments,1);var a1;var aY=function(){if(this instanceof a1){var a5=a3.apply(this,aZ.concat(az.call(arguments)));if(Object(a5)===a5){return a5}return this}else{return a3.apply(a2,aZ.concat(az.call(arguments)))}};var e=Math.max(0,a3.length-aZ.length);var a4=[];for(var a0=0;a0<e;a0++){a4.push("$"+a0)}a1=Function("binder","return function ("+a4.join(",")+"){ return binder.apply(this, arguments); }")(aY);if(a3.prototype){aK.prototype=a3.prototype;a1.prototype=new aK();aK.prototype=null}return a1}});var ar=W.bind(aW.hasOwnProperty);var h=(function(){var aY=[1,2];var e=aY.splice();return aY.length===2&&d(e)&&e.length===0}());l(ay,{splice:function ax(aY,e){if(arguments.length===0){return[]}else{return F.apply(this,arguments)}}},!h);var aA=(function(){var e={};ay.splice.call(e,0,0,1);return e.length===1}());l(ay,{splice:function ax(aZ,aY){if(arguments.length===0){return[]}var e=arguments;this.length=Math.max(Q.ToInteger(this.length),0);if(arguments.length>0&&typeof aY!=="number"){e=az.call(arguments);if(e.length<2){e.push(this.length-aZ)}else{e[1]=Q.ToInteger(aY)}}return F.apply(this,e)}},!aA);var aR=[].unshift(0)!==1;l(ay,{unshift:function(){al.apply(this,arguments);return this.length}},aR);l(Array,{isArray:d});var L=Object("a");var aX=L[0]!=="a"||!(0 in L);var aD=function ae(aZ){var aY=true;var e=true;if(aZ){aZ.call("foo",function(a0,a2,a1){if(typeof a1!=="object"){aY=false}});aZ.call([1],function(){e=typeof this==="string"},"x")}return !!aZ&&aY&&e};l(ay,{forEach:function aB(e){var aZ=Q.ToObject(this),aY=aX&&aP(this)?this.split(""):aZ,a1=arguments[1],a0=-1,a2=aY.length>>>0;if(!K(e)){throw new TypeError()}while(++a0<a2){if(a0 in aY){e.call(a1,aY[a0],a0,aZ)}}}},!aD(ay.forEach));l(ay,{map:function G(aY){var a0=Q.ToObject(this),aZ=aX&&aP(this)?this.split(""):a0,a3=aZ.length>>>0,e=Array(a3),a2=arguments[1];if(!K(aY)){throw new TypeError(aY+" is not a function")}for(var a1=0;a1<a3;a1++){if(a1 in aZ){e[a1]=aY.call(a2,aZ[a1],a1,a0)}}return e}},!aD(ay.map));l(ay,{filter:function O(aY){var a0=Q.ToObject(this),aZ=aX&&aP(this)?this.split(""):a0,a3=aZ.length>>>0,e=[],a4,a2=arguments[1];if(!K(aY)){throw new TypeError(aY+" is not a function")}for(var a1=0;a1<a3;a1++){if(a1 in aZ){a4=aZ[a1];if(aY.call(a2,a4,a1,a0)){e.push(a4)}}}return e}},!aD(ay.filter));l(ay,{every:function at(e){var aZ=Q.ToObject(this),aY=aX&&aP(this)?this.split(""):aZ,a2=aY.length>>>0,a1=arguments[1];if(!K(e)){throw new TypeError(e+" is not a function")}for(var a0=0;a0<a2;a0++){if(a0 in aY&&!e.call(a1,aY[a0],a0,aZ)){return false}}return true}},!aD(ay.every));l(ay,{some:function N(e){var aZ=Q.ToObject(this),aY=aX&&aP(this)?this.split(""):aZ,a2=aY.length>>>0,a1=arguments[1];if(!K(e)){throw new TypeError(e+" is not a function")}for(var a0=0;a0<a2;a0++){if(a0 in aY&&e.call(a1,aY[a0],a0,aZ)){return true}}return false}},!aD(ay.some));var ah=false;if(ay.reduce){ah=typeof ay.reduce.call("es5",function(aY,aZ,e,a0){return a0})==="object"}l(ay,{reduce:function o(aY){var a0=Q.ToObject(this),aZ=aX&&aP(this)?this.split(""):a0,a2=aZ.length>>>0;if(!K(aY)){throw new TypeError(aY+" is not a function")}if(!a2&&arguments.length===1){throw new TypeError("reduce of empty array with no initial value")}var a1=0;var e;if(arguments.length>=2){e=arguments[1]}else{do{if(a1 in aZ){e=aZ[a1++];break}if(++a1>=a2){throw new TypeError("reduce of empty array with no initial value")}}while(true)}for(;a1<a2;a1++){if(a1 in aZ){e=aY.call(void 0,e,aZ[a1],a1,a0)}}return e}},!ah);var aq=false;if(ay.reduceRight){aq=typeof ay.reduceRight.call("es5",function(aY,aZ,e,a0){return a0})==="object"}l(ay,{reduceRight:function ai(aY){var a0=Q.ToObject(this),aZ=aX&&aP(this)?this.split(""):a0,a2=aZ.length>>>0;if(!K(aY)){throw new TypeError(aY+" is not a function")}if(!a2&&arguments.length===1){throw new TypeError("reduceRight of empty array with no initial value")}var e,a1=a2-1;if(arguments.length>=2){e=arguments[1]}else{do{if(a1 in aZ){e=aZ[a1--];break}if(--a1<0){throw new TypeError("reduceRight of empty array with no initial value")}}while(true)}if(a1<0){return e}do{if(a1 in aZ){e=aY.call(void 0,e,aZ[a1],a1,a0)}}while(a1--);return e}},!aq);var ap=Array.prototype.indexOf&&[0,1].indexOf(1,2)!==-1;l(ay,{indexOf:function t(aY){var e=aX&&aP(this)?this.split(""):Q.ToObject(this),a0=e.length>>>0;if(!a0){return -1}var aZ=0;if(arguments.length>1){aZ=Q.ToInteger(arguments[1])}aZ=aZ>=0?aZ:Math.max(0,a0+aZ);for(;aZ<a0;aZ++){if(aZ in e&&e[aZ]===aY){return aZ}}return -1}},ap);var aS=Array.prototype.lastIndexOf&&[0,1].lastIndexOf(0,-3)!==-1;l(ay,{lastIndexOf:function aE(aY){var e=aX&&aP(this)?this.split(""):Q.ToObject(this),a0=e.length>>>0;if(!a0){return -1}var aZ=a0-1;if(arguments.length>1){aZ=Math.min(aZ,Q.ToInteger(arguments[1]))}aZ=aZ>=0?aZ:a0-Math.abs(aZ);for(;aZ>=0;aZ--){if(aZ in e&&aY===e[aZ]){return aZ}}return -1}},aS);var ac=!({toString:null}).propertyIsEnumerable("toString"),af=function(){}.propertyIsEnumerable("prototype"),D=!ar("x","0"),n=["toString","toLocaleString","valueOf","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","constructor"],S=n.length;l(Object,{keys:function R(a0){var a5=K(a0),aY=f(a0),a8=a0!==null&&typeof a0==="object",a6=a8&&aP(a0);if(!a8&&!a5&&!aY){throw new TypeError("Object.keys called on a non-object")}var a3=[];var a9=af&&a5;if((a6&&D)||aY){for(var a4=0;a4<a0.length;++a4){a3.push(String(a4))}}if(!aY){for(var e in a0){if(!(a9&&e==="prototype")&&ar(a0,e)){a3.push(String(e))}}}if(ac){var a7=a0.constructor,aZ=a7&&a7.prototype===a0;for(var a2=0;a2<S;a2++){var a1=n[a2];if(!(aZ&&a1==="constructor")&&ar(a0,a1)){a3.push(a1)}}}return a3}});var aV=Object.keys&&(function(){return Object.keys(arguments).length===2}(1,2));var r=Object.keys;l(Object,{keys:function R(e){if(f(e)){return r(ay.slice.call(e))}else{return r(e)}}},!aV);var E=-62198755200000;var z="-000001";var P=Date.prototype.toISOString&&new Date(E).toISOString().indexOf(z)===-1;l(Date.prototype,{toISOString:function au(){var e,aZ,a0,aY,a1;if(!isFinite(this)){throw new RangeError("Date.prototype.toISOString called on non-finite value.")}aY=this.getUTCFullYear();a1=this.getUTCMonth();aY+=Math.floor(a1/12);a1=(a1%12+12)%12;e=[a1+1,this.getUTCDate(),this.getUTCHours(),this.getUTCMinutes(),this.getUTCSeconds()];aY=((aY<0?"-":(aY>9999?"+":""))+("00000"+Math.abs(aY)).slice((0<=aY&&aY<=9999)?-4:-6));aZ=e.length;while(aZ--){a0=e[aZ];if(a0<10){e[aZ]="0"+a0}}return(aY+"-"+e.slice(0,2).join("-")+"T"+e.slice(2).join(":")+"."+("000"+this.getUTCMilliseconds()).slice(-3)+"Z")}},P);var k=false;try{k=(Date.prototype.toJSON&&new Date(NaN).toJSON()===null&&new Date(E).toJSON().indexOf(z)!==-1&&Date.prototype.toJSON.call({toISOString:function(){return true}}))}catch(X){}if(!k){Date.prototype.toJSON=function J(aZ){var a0=Object(this),aY=Q.ToPrimitive(a0),e;if(typeof aY==="number"&&!isFinite(aY)){return null}e=a0.toISOString;if(typeof e!=="function"){throw new TypeError("toISOString property is not callable")}return e.call(a0)}}var aC=Date.parse("+033658-09-27T01:46:40.000Z")===1000000000000000;var p=!isNaN(Date.parse("2012-04-04T24:00:00.500Z"))||!isNaN(Date.parse("2012-11-31T23:59:59.000Z"));var M=isNaN(Date.parse("2000-01-01T00:00:00.000Z"));if(!Date.parse||M||p||!aC){Date=(function(a1){function aY(a7,bc,a5,bb,ba,bd,a6){var a8=arguments.length;if(this instanceof a1){var a9=a8===1&&String(a7)===a7?new a1(aY.parse(a7)):a8>=7?new a1(a7,bc,a5,bb,ba,bd,a6):a8>=6?new a1(a7,bc,a5,bb,ba,bd):a8>=5?new a1(a7,bc,a5,bb,ba):a8>=4?new a1(a7,bc,a5,bb):a8>=3?new a1(a7,bc,a5):a8>=2?new a1(a7,bc):a8>=1?new a1(a7):new a1();a9.constructor=aY;return a9}return a1.apply(this,arguments)}var a3=new RegExp("^(\\d{4}|[+-]\\d{6})(?:-(\\d{2})(?:-(\\d{2})(?:T(\\d{2}):(\\d{2})(?::(\\d{2})(?:(\\.\\d{1,}))?)?(Z|(?:([-+])(\\d{2}):(\\d{2})))?)?)?)?$");var e=[0,31,59,90,120,151,181,212,243,273,304,334,365];function a2(a6,a7){var a5=a7>1?1:0;return(e[a7]+Math.floor((a6-1969+a5)/4)-Math.floor((a6-1901+a5)/100)+Math.floor((a6-1601+a5)/400)+365*(a6-1970))}function aZ(a5){return Number(new a1(1970,0,1,0,0,0,a5))}for(var a0 in a1){aY[a0]=a1[a0]}aY.now=a1.now;aY.UTC=a1.UTC;aY.prototype=a1.prototype;aY.prototype.constructor=aY;aY.parse=function a4(bd){var bc=a3.exec(bd);if(bc){var bf=Number(bc[1]),be=Number(bc[2]||1)-1,bg=Number(bc[3]||1)-1,a9=Number(bc[4]||0),a8=Number(bc[5]||0),a5=Number(bc[6]||0),bi=Math.floor(Number(bc[7]||0)*1000),a7=Boolean(bc[4]&&!bc[8]),bb=bc[9]==="-"?1:-1,a6=Number(bc[10]||0),ba=Number(bc[11]||0),bh;if(a9<(a8>0||a5>0||bi>0?24:25)&&a8<60&&a5<60&&bi<1000&&be>-1&&be<12&&a6<24&&ba<60&&bg>-1&&bg<(a2(bf,be+1)-a2(bf,be))){bh=((a2(bf,be)+bg)*24+a9+a6*bb)*60;bh=((bh+a8+ba*bb)*60+a5)*1000+bi;if(a7){bh=aZ(bh)}if(-8640000000000000<=bh&&bh<=8640000000000000){return bh}}return NaN}return a1.parse.apply(this,arguments)};return aY}(Date))}if(!Date.now){Date.now=function aO(){return new Date().getTime()}}var j=V.toFixed&&((0.00008).toFixed(3)!=="0.000"||(0.9).toFixed(0)!=="1"||(1.255).toFixed(2)!=="1.25"||(1000000000000000100).toFixed(0)!=="1000000000000000128");var C={base:10000000,size:6,data:[0,0,0,0,0,0],multiply:function c(aZ,aY){var e=-1;while(++e<C.size){aY+=aZ*C.data[e];C.data[e]=aY%C.base;aY=Math.floor(aY/C.base)}},divide:function aG(aZ){var e=C.size,aY=0;while(--e>=0){aY+=C.data[e];C.data[e]=Math.floor(aY/aZ);aY=(aY%aZ)*C.base}},numToString:function x(){var aY=C.size;var aZ="";while(--aY>=0){if(aZ!==""||aY===0||C.data[aY]!==0){var e=String(C.data[aY]);if(aZ===""){aZ=e}else{aZ+="0000000".slice(0,7-e.length)+e}}}return aZ},pow:function aI(e,aZ,aY){return(aZ===0?aY:(aZ%2===1?aI(e,aZ-1,aY*e):aI(e*e,aZ/2,aY)))},log:function i(e){var aY=0;while(e>=4096){aY+=12;e/=4096}while(e>=2){aY+=1;e/=2}return aY}};l(V,{toFixed:function Y(a5){var a1,a4,a6,aY,a2,a3,a0,aZ;a1=Number(a5);a1=a1!==a1?0:Math.floor(a1);if(a1<0||a1>20){throw new RangeError("Number.toFixed called with invalid number of decimals")}a4=Number(this);if(a4!==a4){return"NaN"}if(a4<=-1e+21||a4>=1e+21){return String(a4)}a6="";if(a4<0){a6="-";a4=-a4}aY="0";if(a4>1e-21){a2=C.log(a4*C.pow(2,69,1))-69;a3=(a2<0?a4*C.pow(2,-a2,1):a4/C.pow(2,a2,1));a3*=4503599627370496;a2=52-a2;if(a2>0){C.multiply(0,a3);a0=a1;while(a0>=7){C.multiply(10000000,0);a0-=7}C.multiply(C.pow(10,a0,1),0);a0=a2-1;while(a0>=23){C.divide(1<<23);a0-=23}C.divide(1<<a0);C.multiply(1,1);C.divide(2);aY=C.numToString()}else{C.multiply(0,a3);C.multiply(1<<(-a2),0);aY=C.numToString()+"0.00000000000000000000".slice(2,2+a1)}}if(a1>0){aZ=aY.length;if(aZ<=a1){aY=a6+"0.0000000000000000000".slice(0,a1-aZ+2)+aY}else{aY=a6+aY.slice(0,aZ-a1)+"."+aY.slice(aZ-a1)}}else{aY=a6+aY}return aY}},j);var aw=an.split;if("ab".split(/(?:ab)*/).length!==2||".".split(/(.?)(.?)/).length!==4||"tesst".split(/(s)*/)[1]==="t"||"test".split(/(?:)/,-1).length!==4||"".split(/.?/).length||".".split(/()()/).length>1){(function(){var e=typeof(/()??/).exec("")[1]==="undefined";an.split=function(a3,a2){var a6=this;if(typeof a3==="undefined"&&a2===0){return[]}if(!v(a3)){return aw.call(this,a3,a2)}var a0=[],a1=(a3.ignoreCase?"i":"")+(a3.multiline?"m":"")+(a3.extended?"x":"")+(a3.sticky?"y":""),aY=0,aZ,a4,a5,a7;a3=new RegExp(a3.source,a1+"g");a6+="";if(!e){aZ=new RegExp("^"+a3.source+"$(?!\\s)",a1)}a2=typeof a2==="undefined"?-1>>>0:Q.ToUint32(a2);a4=a3.exec(a6);while(a4){a5=a4.index+a4[0].length;if(a5>aY){a0.push(a6.slice(aY,a4.index));if(!e&&a4.length>1){a4[0].replace(aZ,function(){for(var a8=1;a8<arguments.length-2;a8++){if(typeof arguments[a8]==="undefined"){a4[a8]=void 0}}})}if(a4.length>1&&a4.index<a6.length){am.apply(a0,a4.slice(1))}a7=a4[0].length;aY=a5;if(a0.length>=a2){break}}if(a3.lastIndex===a4.index){a3.lastIndex++}a4=a3.exec(a6)}if(aY===a6.length){if(a7||!a3.test("")){a0.push("")}}else{a0.push(a6.slice(aY))}return a0.length>a2?a0.slice(0,a2):a0}}())}else{if("0".split(void 0,0).length){an.split=function B(aY,e){if(typeof aY==="undefined"&&e===0){return[]}return aw.call(this,aY,e)}}}var g=an.replace;var av=(function(){var e=[];"x".replace(/x(.)?/g,function(aY,aZ){e.push(aZ)});return e.length===1&&typeof e[0]==="undefined"}());if(!av){an.replace=function Z(a1,aZ){var aY=K(aZ);var e=v(a1)&&(/\)[*?]/).test(a1.source);if(!aY||!e){return g.call(this,a1,aZ)}else{var a0=function(a4){var a5=arguments.length;var a2=a1.lastIndex;a1.lastIndex=0;var a3=a1.exec(a4)||[];a1.lastIndex=a2;a3.push(arguments[a5-2],arguments[a5-1]);return aZ.apply(this,a3)};return g.call(this,a1,a0)}}}var aL=an.substr;var ak="".substr&&"0b".substr(-1)!=="b";l(an,{substr:function T(aY,e){return aL.call(this,aY<0?((aY=this.length+aY)<0?0:aY):aY,e)}},ak);var m="\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF";var u="\u200b";var H="["+m+"]";var aN=new RegExp("^"+H+H+"*");var U=new RegExp(H+H+"*$");var aT=an.trim&&(m.trim()||!u.trim());l(an,{trim:function aH(){if(typeof this==="undefined"||this===null){throw new TypeError("can't convert "+this+" to object")}return String(this).replace(aN,"").replace(U,"")}},aT);if(parseInt(m+"08")!==8||parseInt(m+"0x16")!==22){parseInt=(function(e){var aY=/^0[xX]/;return function aZ(a1,a0){a1=String(a1).trim();if(!Number(a0)){a0=aY.test(a1)?16:10}return e(a1,a0)}}(parseInt))}}));if(typeof JSON!=="object"){JSON={}}(function(){function f(n){return n<10?"0"+n:n}function this_value(){return this.valueOf()}if(typeof Date.prototype.toJSON!=="function"){Date.prototype.toJSON=function(){return isFinite(this.valueOf())?this.getUTCFullYear()+"-"+f(this.getUTCMonth()+1)+"-"+f(this.getUTCDate())+"T"+f(this.getUTCHours())+":"+f(this.getUTCMinutes())+":"+f(this.getUTCSeconds())+"Z":null};Boolean.prototype.toJSON=this_value;Number.prototype.toJSON=this_value;String.prototype.toJSON=this_value}var cx,escapable,gap,indent,meta,rep;function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==="string"?c:"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})+'"':'"'+string+'"'}function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==="object"&&typeof value.toJSON==="function"){value=value.toJSON(key)}if(typeof rep==="function"){value=rep.call(holder,key,value)}switch(typeof value){case"string":return quote(value);case"number":return isFinite(value)?String(value):"null";case"boolean":case"null":return String(value);case"object":if(!value){return"null"}gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==="[object Array]"){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||"null"}v=partial.length===0?"[]":gap?"[\n"+gap+partial.join(",\n"+gap)+"\n"+mind+"]":"["+partial.join(",")+"]";gap=mind;return v}if(rep&&typeof rep==="object"){length=rep.length;for(i=0;i<length;i+=1){if(typeof rep[i]==="string"){k=rep[i];v=str(k,value);if(v){partial.push(quote(k)+(gap?": ":":")+v)}}}}else{for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?": ":":")+v)}}}}v=partial.length===0?"{}":gap?"{\n"+gap+partial.join(",\n"+gap)+"\n"+mind+"}":"{"+partial.join(",")+"}";gap=mind;return v}}if(typeof JSON.stringify!=="function"){escapable=/[\\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;meta={"\b":"\\b","\t":"\\t","\n":"\\n","\f":"\\f","\r":"\\r",'"':'\\"',"\\":"\\\\"};JSON.stringify=function(value,replacer,space){var i;gap="";indent="";if(typeof space==="number"){for(i=0;i<space;i+=1){indent+=" "}}else{if(typeof space==="string"){indent=space}}rep=replacer;if(replacer&&typeof replacer!=="function"&&(typeof replacer!=="object"||typeof replacer.length!=="number")){throw new Error("JSON.stringify")}return str("",{"":value})}}if(typeof JSON.parse!=="function"){cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==="object"){for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v}else{delete value[k]}}}}return reviver.call(holder,key,value)}text=String(text);cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return"\\u"+("0000"+a.charCodeAt(0).toString(16)).slice(-4)})}if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,"@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,"]").replace(/(?:^|:|,)(?:\s*\[)+/g,""))){j=eval("("+text+")");return typeof reviver==="function"?walk({"":j},""):j}throw new SyntaxError("JSON.parse")}}}());!function(d){if("object"==typeof exports&&"undefined"!=typeof module){module.exports=d()}else{if("function"==typeof define&&define.amd){define([],d)}else{var c;c="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,c.Lumberjack=d()}}}(function(){return function b(h,m,l){function k(n,f){if(!m[n]){if(!h[n]){var e="function"==typeof require&&require;if(!f&&e){return e(n,!0)}if(j){return j(n,!0)}var d=new Error("Cannot find module '"+n+"'");throw d.code="MODULE_NOT_FOUND",d}var c=m[n]={exports:{}};h[n][0].call(c.exports,function(g){var o=h[n][1][g];return k(o?o:g)},c,c.exports,b,h,m,l)}return m[n].exports}for(var j="function"==typeof require&&require,i=0;i<l.length;i++){k(l[i])}return k}({1:[function(e,d,f){(function(c){d.exports=function(h){var m,l={},k={},j=[],i=c.localStorage||{};return m=function(o,t){var s,r,o,q,p="string"==typeof o,n=typeof t,g="undefined"!==n&&"function"!==n;if("on"===i.lumberjack||h){if(!p||!g){throw Error("Lumberjack Error: log(channel, data) requires an channel {String} and a payload {String|Object|Number|Boolean}.")}for(q={time:new Date,data:t,channel:o,id:j.length},l[o]=l[o]||[],l[o].push(q),j.push(q),k[o]=k[o]||[],r=k[o].length,s=0;r>s;s+=1){k[o][s](t)}}},m.clear=function(g){g?l[g]=[]:(l={},j=[])},m.readback=function(n,g){var o="string"==typeof n;if(o){return g?JSON.stringify(l[n],null,4):l[n]||[]}throw Error("log.readback(channel, pretty) requires an channel {String}.")},m.readback.master=function(g){return g?JSON.stringify(j,null,4):j},m.readback.channels=function(n){var g=Object.keys(l);return n?JSON.stringify(g):g},m.flush=function(n){var g;return n?(g=l[n],l[n]=[]):(l={},j=[],g=[]),g},m.on=function(n,g){var p="string"==typeof n,o="function"==typeof g;if(!p||!o){throw Error("log.on(channel, cb) requires an channel {String} and a callback {Function}.")}k[n]=k[n]||[],k[n].push(g)},m.off=function(n){var g="string"==typeof n;if(!g){throw Error("log.off(channel) requires an channel {String}.")}k[n]=[]},m.enable=function(){h=!0},m.disable=function(){h=!1},m}}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}]},{},[1])(1)});window.console=window.console||{log:function(b){}};var tsCreate=new Date();var log=Lumberjack();window.Adgeletti={log:log,data:{positions:{},showing:{},displayed:{},keywords:{}},add_keywords:function(c){for(var b in c){if(c.hasOwnProperty(b)){this.data.keywords[b]=c[b]}}},position:function(c){log("event","Slot "+c.slot+" defined.");var b=this.data.positions[c.breakpoint]=this.data.positions[c.breakpoint]||[];b.push({ad_unit_code:c.ad_unit_code,sizes:c.sizes,div_id:c.div_id,slot:c.slot,is_companion:c.is_companion})},display:function(h){console.log('Displaying ads for breakpoint "'+h+'"');var b=this.data.displayed[h]=this.data.displayed[h]||[];var g=this.data.showing[h]=this.data.showing[h]||[];var e=this.data.positions[h]||[];for(var d=0;d<e.length;++d){var k=e[d];g.push(k);if(k.isHidden){console.log("Showing ad div #"+k.div_id);document.getElementById(k.div_id).style.display="block";k.isHidden=false}var l=false;for(var c=0;c<b.length;c++){if(b[c].div_id==k.div_id){console.log("Ad "+k.ad_unit_code+' already displayed for breakpoint "'+h+'"');l=true;break}}if(!l){b.push(k);var m=this;function f(o,j){var i=function(){var q=googletag.defineSlot(o.ad_unit_code,o.sizes,o.div_id);googletag.pubads().addEventListener("slotRenderEnded",function(s){if(s.slot===q){log("event","slotRenderEnded for "+o.slot);var r=new Date();log("metric",{event:"Total load time",slot:o.slot,value:r-tsCreate})}});if(o.is_companion){console.log("Configuring companion ad in position for div ID `"+o.div_id+"`");q.addService(googletag.companionAds())}q.addService(googletag.pubads());for(var p in j.data.keywords){if(j.data.keywords.hasOwnProperty(p)){q.setTargeting(p,j.data.keywords[p])}}q.setTargeting("ad_slot",o.slot);q.setTargeting("adposition",o.slot);o.ad=q;googletag.display(o.div_id)};return i}console.log("Displaying ad "+k.ad_unit_code+' for breakpoint "'+h+'"');var n=f(k,m);n()}}},hide:function(b){console.log('Hiding ads for breakpoint "'+b+'"');var d=this.data.showing[b]||[];for(var c=0;c<d.length;++c){var e=d[c];console.log("Hiding ad div #"+e.div_id);document.getElementById(e.div_id).style.display="none";e.isHidden=true}this.data.showing[b]=[]},refresh:function(){var e=[];for(var d in this.data.showing){if(this.data.showing.hasOwnProperty(d)){var b=this.data.showing[d];for(var c=0;c<b.length;c++){e.push(b[c].ad)}}}googletag.pubads().refresh(e)}};log("event","Adgeletti defined.");!function(d){if("object"==typeof exports&&"undefined"!=typeof module){module.exports=d()}else{if("function"==typeof define&&define.amd){define([],d)}else{var c;c="undefined"!=typeof window?window:"undefined"!=typeof global?global:"undefined"!=typeof self?self:this,c.Harmony=d()}}}(function(){return function b(h,m,l){function k(n,f){if(!m[n]){if(!h[n]){var e="function"==typeof require&&require;if(!f&&e){return e(n,!0)}if(j){return j(n,!0)}var d=new Error("Cannot find module '"+n+"'");throw d.code="MODULE_NOT_FOUND",d}var c=m[n]={exports:{}};h[n][0].call(c.exports,function(g){var o=h[n][1][g];return k(o?o:g)},c,c.exports,b,h,m,l)}return m[n].exports}for(var j="function"==typeof require&&require,i=0;i<l.length;i++){k(l[i])}return k}({1:[function(d,c){c.exports=function(){throw Error("[BaseClass] Abstract method was called without definition.")}},{}],2:[function(f,e){function h(c){return c.extend=function(d){var j,i={base:c.base};d=d||{};for(j in c){"function"==typeof c[j]&&(i[j]=c[j].bind(c))}for(j in d){c[j]="function"==typeof d[j]?g(j,c,i,d):d[j]}return c.base=i,c},c.implement=function(){var d,i=arguments.length;for(d=0;i>d;d+=1){arguments[d](c)}return c},c}var g=f("./rebind.js");h.Abstract=f("./abstract.js"),h.Stub=f("./stub.js"),h.Interface=f("./interface.js"),e.exports=h},{"./abstract.js":1,"./interface.js":3,"./rebind.js":4,"./stub.js":5}],3:[function(d,c){c.exports=function(e){return function(f){var g;for(g in e){f[g]=e[g]}return f}}},{}],4:[function(d,c){c.exports=function(f,e,h,g){return function(){var j,i=e.base;return e.base=h,e.self=g,j=g[f].apply(e,arguments),e.base=i,j}}},{}],5:[function(d,c){c.exports=function(){}},{}],6:[function(d,c){(function(e){c.exports=function(h){var m,l={},k={},j=[],i=e.localStorage||{};return m=function(n,s){var r,q,n,p,o="string"==typeof n,g=typeof s,f="undefined"!==g&&"function"!==g;if("on"===i.lumberjack||h){if(!o||!f){throw Error("Lumberjack Error: log(channel, data) requires an channel {String} and a payload {String|Object|Number|Boolean}.")}for(p={time:new Date,data:s,channel:n,id:j.length},l[n]=l[n]||[],l[n].push(p),j.push(p),k[n]=k[n]||[],q=k[n].length,r=0;q>r;r+=1){k[n][r](s)}}},m.clear=function(f){f?l[f]=[]:(l={},j=[])},m.readback=function(g,f){var n="string"==typeof g;if(n){return f?JSON.stringify(l[g],null,4):l[g]||[]}throw Error("log.readback(channel, pretty) requires an channel {String}.")},m.readback.master=function(f){return f?JSON.stringify(j,null,4):j},m.readback.channels=function(g){var f=Object.keys(l);return g?JSON.stringify(f):f},m.on=function(g,f){var o="string"==typeof g,n="function"==typeof f;if(!o||!n){throw Error("log.on(channel, cb) requires an channel {String} and a callback {Function}.")}k[g]=k[g]||[],k[g].push(f)},m.off=function(g){var f="string"==typeof g;if(!f){throw Error("log.off(channel) requires an channel {String}.")}k[g]=[]},m.enable=function(){h=!0},m.disable=function(){h=!1},m}}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{}],7:[function(d,c){(function(l){var k=d("./log.js"),j=d("./slotset.js"),i=d("baseclassjs"),h=d("./event-handler.js");c.exports=function(t,s){var r,q,p,o=Date.now(),g=s.mapping||[],f=s.companion||!1,e=(s.interstitial||!1,s.targeting||{});if(!l.document.getElementById(s.id)){throw Error("Ad slot container was not found in the DOM.")}r=s.interstitial?l.googletag.defineOutOfPageSlot(s.adunit,s.id):l.googletag.defineSlot(s.adunit,s.sizes,s.id),p=j.cached.callbacks(s.name),s.on=s.on||[];for(q in s.on){p.events[q]=p.events[q]||[],p.events[q]=[].concat(p.events[q],s.on[q])}s.one=s.one||[];for(q in s.one){p.singles[q]=p.singles[q]||[],p.singles[q]=[].concat(p.singles[q],s.one[q])}i(r).implement(h(p)),r.divId=s.id,r.name=s.name,r.breakpoint=s.breakpoint,r.sizes=s.sizes,r.adunit=s.adunit;for(q in e){r.setTargeting(q,e[q])}e=j.cached.targeting(s.name);for(q in e){r.setTargeting(q,e[q])}return r.defineSizeMapping(g),"function"==typeof s.callback&&r.on("slotRenderEnded",s.callback),t.addEventListener("slotRenderEnded",function(m){m.slot===r&&(k("metric",{event:"Total load time",slot:s.name,value:Date.now()-o}),r.trigger("slotRenderEnded",m))}),f&&r.addService(l.googletag.companionAds()),r.addService(t),r}}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{"./event-handler.js":9,"./log.js":11,"./slotset.js":12,baseclassjs:2}],8:[function(e,d){var f=(e("./util.js"),{});d.exports={get:function(c){return f[c]||[]},add:function(g,c){return f[g]=f[g]||[],f[g].push(c),f[g]},clear:function(){f={}}}},{"./util.js":13}],9:[function(e,d){var f=e("baseclassjs");d.exports=function(g){var c,j={},i={},h={};g=g||{};for(c in g.events){j[c]=[].concat(g.events[c]||[])}for(c in g.singles){i[c]=[].concat(g.singles[c]||[])}return f.Interface({on:function(l,k,m){!m&&l in h&&k.call(this,h[l].data),j[l]=j[l]||[],j[l].push(k)},one:function(l,k,m){!m&&l in h?k.call(this,h[l].data):(i[l]=i[l]||[],i[l].push(k))},off:function(k){j[k]=[],i[k]=[]},trigger:function(l,k){var m=this;l in j&&j[l].forEach(function(n){n.call(m,k)}),l in i&&(i[l].forEach(function(n){n.call(m,k)}),i[l]=[]),h[l]={data:k}}})}},{baseclassjs:2}],10:[function(d,c){(function(r){var q=d("./util.js"),p=d("./adslot.js"),o=d("./log.js"),n=d("./slotset.js"),m=d("./bpset.js"),l=d("baseclassjs"),k=d("./event-handler.js");c.exports=function(e){return e=e||{},e.forceLog&&o.enable(),o("init","Harmony defined."),l({load:function(y){var x=r.googletag.pubads();y=y||{},y.slots=y.slots||[];var w,v,u,t=y.slots.length;for(o("load","Generating ad slots."),w=0;t>w;w+=1){u=y.slots[w];try{v=p(x,q.scrubConf(u)),n.add(v),m.add(v.breakpoint,v)}catch(s){o("error",{msg:"Slot failed to load during call to load().",conf:u,err:s})}}var h,g,f=y.targeting||{};o("load","Applying pubads targeting.");for(h in f){g=f[h],o("load","- "+h+" = "+g),x.setTargeting(h,g)}o("load","Harmony config loaded.")},log:o,slot:n.get,hasSlot:n.has,breakpoint:m.get,defineSlot:function(g){var f;try{f=p(r.googletag.pubads(),q.scrubConf(g)),n.add(f),m.add(g.breakpoint,f)}catch(h){o("error",{msg:"Slot failed to load during call to defineSlot()",conf:g,err:h})}},show:{breakpoint:function(h){var f,w,v,u=m.get(h),t=u.length;o("show",{msg:"Showing ads at breakpoint",breakpoint:h});try{for(f=0;t>f;f+=1){w=u[f],r.googletag.display(w.divId),v=document.getElementById(w.divId),v?v.style.display="block":o("error",{msg:"Failed to show slot for breakpoint",breakpoint:h,reason:"Slot was missing from the DOM",slot:w})}}catch(s){o("error",{msg:"Failed to show breakpoint",breakpoint:h,err:s})}},slot:function(g){var f,i;o("show",{msg:"Showing slot",name:g});try{f=n.get(g),r.googletag.display(f.divId),i=document.getElementById(f.divId),i.style.display="block"}catch(h){o("error",{msg:"Failed to show slot",name:g,err:h})}}},hide:{breakpoint:function(g){var f,j,i=m.get(g),h=i.length;for(o("hide","Hiding ads at breakpoint "+g),f=0;h>f;f+=1){j=document.getElementById(i[f].divId),j?j.style.display="none":o("error",{msg:"Failed to hide slot for breakpoint",breakpoint:g,reason:"Slot was missing from the DOM",id:i[f].divId})}},slot:function(g){var f,i=n.get(g);o("hide",{msg:"Hiding slot",name:g});try{f=document.getElementById(i.divId),f.style.display="none"}catch(h){o("error",{msg:"Failed to hide slot",name:g,err:h})}}}}).implement(k())}}).call(this,"undefined"!=typeof global?global:"undefined"!=typeof self?self:"undefined"!=typeof window?window:{})},{"./adslot.js":7,"./bpset.js":8,"./event-handler.js":9,"./log.js":11,"./slotset.js":12,"./util.js":13,baseclassjs:2}],11:[function(d,c){var e=d("lumberjackjs");c.exports=e()},{lumberjackjs:6}],12:[function(g,f){var j=g("./util.js"),i={},h={events:{},singles:{},targ:{}};f.exports={cached:{callbacks:function(c){return{events:h.events[c]||{},singles:h.singles[c]||{}}},targeting:function(c){return h.targ[c]||{}}},get:function(c){return i[c]||{on:function(d,e){h.events[c]=h.events[c]||{},h.events[c][d]=[].concat(h.events[c][d]||[],e)},one:function(d,e){h.singles[c]=h.singles[c]||{},h.singles[c][d]=[].concat(h.singles[c][d]||[],e)},setTargeting:function(d,e){h.targ[c]=h.targ[c]||{},h.targ[c][d]=e},trigger:j.noop,off:j.noop,mock:!0}},add:function(c){i[c.name]=c},has:function(c){return c in i},clear:function(){i={},h.events={},h.singles={},h.targ={}}}},{"./util.js":13}],13:[function(e,d){var f=e("./slotset.js");d.exports={noop:function(){},slotCount:0,scrubConf:function(g){var c,i,h={el:{}};if(g.drone||f.has(g.name)){do{if(i=document.getElementById(g.id)){if(!i.innerHTML){return this.slotCount+=1,c="-h"+this.slotCount,i.id+=c,h.el.id=h.id,g.id=i.id,g.name+=c,g}h.el=i,h.id=i.id,i.id="h-temp"}}while(i);throw Error("Ad slot container was not found in the DOM.")}return g}}},{"./slotset.js":12}]},{},[10])(10)});(function(){var v=this;var l=v._;var I=Array.prototype,h=Object.prototype,o=Function.prototype;var L=I.push,m=I.slice,d=h.toString,k=h.hasOwnProperty;var t=Array.isArray,f=Object.keys,J=o.bind,B=Object.create;var E=function(){};var N=function(O){if(O instanceof N){return O}if(!(this instanceof N)){return new N(O)}this._wrapped=O};if(typeof exports!=="undefined"){if(typeof module!=="undefined"&&module.exports){exports=module.exports=N}exports._=N}else{v._=N}N.VERSION="1.8.2";var c=function(P,O,Q){if(O===void 0){return P}switch(Q==null?3:Q){case 1:return function(R){return P.call(O,R)};case 2:return function(S,R){return P.call(O,S,R)};case 3:return function(S,R,T){return P.call(O,S,R,T)};case 4:return function(R,T,S,U){return P.call(O,R,T,S,U)}}return function(){return P.apply(O,arguments)}};var F=function(P,O,Q){if(P==null){return N.identity}if(N.isFunction(P)){return c(P,O,Q)}if(N.isObject(P)){return N.matcher(P)}return N.property(P)};N.iteratee=function(P,O){return F(P,O,Infinity)};var q=function(P,O){return function(X){var V=arguments.length;if(V<2||X==null){return X}for(var R=1;R<V;R++){var W=arguments[R],U=P(W),Q=U.length;for(var T=0;T<Q;T++){var S=U[T];if(!O||X[S]===void 0){X[S]=W[S]}}}return X}};var C=function(P){if(!N.isObject(P)){return{}}if(B){return B(P)}E.prototype=P;var O=new E;E.prototype=null;return O};var K=Math.pow(2,53)-1;var D=function(P){var O=P&&P.length;return typeof O=="number"&&O>=0&&O<=K};N.each=N.forEach=function(S,T,P){T=c(T,P);var O,R;if(D(S)){for(O=0,R=S.length;O<R;O++){T(S[O],O,S)}}else{var Q=N.keys(S);for(O=0,R=Q.length;O<R;O++){T(S[Q[O]],Q[O],S)}}return S};N.map=N.collect=function(T,V,Q){V=F(V,Q);var S=!D(T)&&N.keys(T),R=(S||T).length,P=Array(R);for(var O=0;O<R;O++){var U=S?S[O]:O;P[O]=V(T[U],U,T)}return P};function z(O){function P(U,W,Q,T,R,S){for(;R>=0&&R<S;R+=O){var V=T?T[R]:R;Q=W(Q,U[V],V,U)}return Q}return function(V,W,Q,S){W=c(W,S,4);var U=!D(V)&&N.keys(V),T=(U||V).length,R=O>0?0:T-1;if(arguments.length<3){Q=V[U?U[R]:R];R+=O}return P(V,W,Q,U,R,T)}}N.reduce=N.foldl=N.inject=z(1);N.reduceRight=N.foldr=z(-1);N.find=N.detect=function(R,O,Q){var P;if(D(R)){P=N.findIndex(R,O,Q)}else{P=N.findKey(R,O,Q)}if(P!==void 0&&P!==-1){return R[P]}};N.filter=N.select=function(R,O,Q){var P=[];O=F(O,Q);N.each(R,function(U,S,T){if(O(U,S,T)){P.push(U)}});return P};N.reject=function(Q,O,P){return N.filter(Q,N.negate(F(O)),P)};N.every=N.all=function(T,O,Q){O=F(O,Q);var S=!D(T)&&N.keys(T),R=(S||T).length;for(var P=0;P<R;P++){var U=S?S[P]:P;if(!O(T[U],U,T)){return false}}return true};N.some=N.any=function(T,O,Q){O=F(O,Q);var S=!D(T)&&N.keys(T),R=(S||T).length;for(var P=0;P<R;P++){var U=S?S[P]:P;if(O(T[U],U,T)){return true}}return false};N.contains=N.includes=N.include=function(Q,P,O){if(!D(Q)){Q=N.values(Q)}return N.indexOf(Q,P,typeof O=="number"&&O)>=0};N.invoke=function(Q,R){var O=m.call(arguments,2);var P=N.isFunction(R);return N.map(Q,function(T){var S=P?R:T[R];return S==null?S:S.apply(T,O)})};N.pluck=function(P,O){return N.map(P,N.property(O))};N.where=function(P,O){return N.filter(P,N.matcher(O))};N.findWhere=function(P,O){return N.find(P,N.matcher(O))};N.max=function(R,T,O){var W=-Infinity,U=-Infinity,V,Q;if(T==null&&R!=null){R=D(R)?R:N.values(R);for(var S=0,P=R.length;S<P;S++){V=R[S];if(V>W){W=V}}}else{T=F(T,O);N.each(R,function(Z,X,Y){Q=T(Z,X,Y);if(Q>U||Q===-Infinity&&W===-Infinity){W=Z;U=Q}})}return W};N.min=function(R,T,O){var W=Infinity,U=Infinity,V,Q;if(T==null&&R!=null){R=D(R)?R:N.values(R);for(var S=0,P=R.length;S<P;S++){V=R[S];if(V<W){W=V}}}else{T=F(T,O);N.each(R,function(Z,X,Y){Q=T(Z,X,Y);if(Q<U||Q===Infinity&&W===Infinity){W=Z;U=Q}})}return W};N.shuffle=function(S){var T=D(S)?S:N.values(S);var R=T.length;var O=Array(R);for(var P=0,Q;P<R;P++){Q=N.random(0,P);if(Q!==P){O[P]=O[Q]}O[Q]=T[P]}return O};N.sample=function(P,Q,O){if(Q==null||O){if(!D(P)){P=N.values(P)}return P[N.random(P.length-1)]}return N.shuffle(P).slice(0,Math.max(0,Q))};N.sortBy=function(P,Q,O){Q=F(Q,O);return N.pluck(N.map(P,function(T,R,S){return{value:T,index:R,criteria:Q(T,R,S)}}).sort(function(U,T){var S=U.criteria;var R=T.criteria;if(S!==R){if(S>R||S===void 0){return 1}if(S<R||R===void 0){return -1}}return U.index-T.index}),"value")};var r=function(O){return function(R,S,Q){var P={};S=F(S,Q);N.each(R,function(V,T){var U=S(V,T,R);O(P,V,U)});return P}};N.groupBy=r(function(O,Q,P){if(N.has(O,P)){O[P].push(Q)}else{O[P]=[Q]}});N.indexBy=r(function(O,Q,P){O[P]=Q});N.countBy=r(function(O,Q,P){if(N.has(O,P)){O[P]++}else{O[P]=1}});N.toArray=function(O){if(!O){return[]}if(N.isArray(O)){return m.call(O)}if(D(O)){return N.map(O,N.identity)}return N.values(O)};N.size=function(O){if(O==null){return 0}return D(O)?O.length:N.keys(O).length};N.partition=function(S,O,Q){O=F(O,Q);var R=[],P=[];N.each(S,function(U,T,V){(O(U,T,V)?R:P).push(U)});return[R,P]};N.first=N.head=N.take=function(Q,P,O){if(Q==null){return void 0}if(P==null||O){return Q[0]}return N.initial(Q,Q.length-P)};N.initial=function(Q,P,O){return m.call(Q,0,Math.max(0,Q.length-(P==null||O?1:P)))};N.last=function(Q,P,O){if(Q==null){return void 0}if(P==null||O){return Q[Q.length-1]}return N.rest(Q,Math.max(0,Q.length-P))};N.rest=N.tail=N.drop=function(Q,P,O){return m.call(Q,P==null||O?1:P)};N.compact=function(O){return N.filter(O,N.identity)};var w=function(U,Q,V,Y){var P=[],X=0;for(var S=Y||0,O=U&&U.length;S<O;S++){var W=U[S];if(D(W)&&(N.isArray(W)||N.isArguments(W))){if(!Q){W=w(W,Q,V)}var R=0,T=W.length;P.length+=T;while(R<T){P[X++]=W[R++]}}else{if(!V){P[X++]=W}}}return P};N.flatten=function(P,O){return w(P,O,false)};N.without=function(O){return N.difference(O,m.call(arguments,1))};N.uniq=N.unique=function(V,R,U,P){if(V==null){return[]}if(!N.isBoolean(R)){P=U;U=R;R=false}if(U!=null){U=F(U,P)}var X=[];var O=[];for(var T=0,Q=V.length;T<Q;T++){var W=V[T],S=U?U(W,T,V):W;if(R){if(!T||O!==S){X.push(W)}O=S}else{if(U){if(!N.contains(O,S)){O.push(S);X.push(W)}}else{if(!N.contains(X,W)){X.push(W)}}}}return X};N.union=function(){return N.uniq(w(arguments,true,true))};N.intersection=function(U){if(U==null){return[]}var O=[];var T=arguments.length;for(var Q=0,S=U.length;Q<S;Q++){var R=U[Q];if(N.contains(O,R)){continue}for(var P=1;P<T;P++){if(!N.contains(arguments[P],R)){break}}if(P===T){O.push(R)}}return O};N.difference=function(P){var O=w(arguments,true,true,1);return N.filter(P,function(Q){return !N.contains(O,Q)})};N.zip=function(){return N.unzip(arguments)};N.unzip=function(R){var Q=R&&N.max(R,"length").length||0;var O=Array(Q);for(var P=0;P<Q;P++){O[P]=N.pluck(R,P)}return O};N.object=function(S,P){var O={};for(var Q=0,R=S&&S.length;Q<R;Q++){if(P){O[S[Q]]=P[Q]}else{O[S[Q][0]]=S[Q][1]}}return O};N.indexOf=function(S,Q,R){var O=0,P=S&&S.length;if(typeof R=="number"){O=R<0?Math.max(0,P+R):R}else{if(R&&P){O=N.sortedIndex(S,Q);return S[O]===Q?O:-1}}if(Q!==Q){return N.findIndex(m.call(S,O),N.isNaN)}for(;O<P;O++){if(S[O]===Q){return O}}return -1};N.lastIndexOf=function(R,P,Q){var O=R?R.length:0;if(typeof Q=="number"){O=Q<0?O+Q+1:Math.min(O,Q+1)}if(P!==P){return N.findLastIndex(m.call(R,0,O),N.isNaN)}while(--O>=0){if(R[O]===P){return O}}return -1};function g(O){return function(T,P,R){P=F(P,R);var S=T!=null&&T.length;var Q=O>0?0:S-1;for(;Q>=0&&Q<S;Q+=O){if(P(T[Q],Q,T)){return Q}}return -1}}N.findIndex=g(1);N.findLastIndex=g(-1);N.sortedIndex=function(V,T,U,Q){U=F(U,Q,1);var S=U(T);var O=0,R=V.length;while(O<R){var P=Math.floor((O+R)/2);if(U(V[P])<S){O=P+1}else{R=P}}return O};N.range=function(T,Q,S){if(arguments.length<=1){Q=T||0;T=0}S=S||1;var R=Math.max(Math.ceil((Q-T)/S),0);var P=Array(R);for(var O=0;O<R;O++,T+=S){P[O]=T}return P};var y=function(T,Q,S,U,R){if(!(U instanceof Q)){return T.apply(S,R)}var P=C(T.prototype);var O=T.apply(P,R);if(N.isObject(O)){return O}return P};N.bind=function(R,P){if(J&&R.bind===J){return J.apply(R,m.call(arguments,1))}if(!N.isFunction(R)){throw new TypeError("Bind must be called on a function")}var O=m.call(arguments,2);var Q=function(){return y(R,Q,P,this,O.concat(m.call(arguments)))};return Q};N.partial=function(P){var Q=m.call(arguments,1);var O=function(){var R=0,U=Q.length;var S=Array(U);for(var T=0;T<U;T++){S[T]=Q[T]===N?arguments[R++]:Q[T]}while(R<arguments.length){S.push(arguments[R++])}return y(P,O,this,this,S)};return O};N.bindAll=function(R){var P,Q=arguments.length,O;if(Q<=1){throw new Error("bindAll must be passed function names")}for(P=1;P<Q;P++){O=arguments[P];R[O]=N.bind(R[O],R)}return R};N.memoize=function(P,O){var Q=function(T){var S=Q.cache;var R=""+(O?O.apply(this,arguments):T);if(!N.has(S,R)){S[R]=P.apply(this,arguments)}return S[R]};Q.cache={};return Q};N.delay=function(P,Q){var O=m.call(arguments,2);return setTimeout(function(){return P.apply(null,O)},Q)};N.defer=N.partial(N.delay,N,1);N.throttle=function(P,R,V){var O,T,W;var U=null;var S=0;if(!V){V={}}var Q=function(){S=V.leading===false?0:N.now();U=null;W=P.apply(O,T);if(!U){O=T=null}};return function(){var X=N.now();if(!S&&V.leading===false){S=X}var Y=R-(X-S);O=this;T=arguments;if(Y<=0||Y>R){if(U){clearTimeout(U);U=null}S=X;W=P.apply(O,T);if(!U){O=T=null}}else{if(!U&&V.trailing!==false){U=setTimeout(Q,Y)}}return W}};N.debounce=function(Q,S,P){var V,U,O,T,W;var R=function(){var X=N.now()-T;if(X<S&&X>=0){V=setTimeout(R,S-X)}else{V=null;if(!P){W=Q.apply(O,U);if(!V){O=U=null}}}};return function(){O=this;U=arguments;T=N.now();var X=P&&!V;if(!V){V=setTimeout(R,S)}if(X){W=Q.apply(O,U);O=U=null}return W}};N.wrap=function(O,P){return N.partial(P,O)};N.negate=function(O){return function(){return !O.apply(this,arguments)}};N.compose=function(){var O=arguments;var P=O.length-1;return function(){var R=P;var Q=O[P].apply(this,arguments);while(R--){Q=O[R].call(this,Q)}return Q}};N.after=function(P,O){return function(){if(--P<1){return O.apply(this,arguments)}}};N.before=function(Q,P){var O;return function(){if(--Q>0){O=P.apply(this,arguments)}if(Q<=1){P=null}return O}};N.once=N.partial(N.before,2);var G=!{toString:null}.propertyIsEnumerable("toString");var b=["valueOf","isPrototypeOf","toString","propertyIsEnumerable","hasOwnProperty","toLocaleString"];function e(S,R){var O=b.length;var P=S.constructor;var Q=(N.isFunction(P)&&P.prototype)||h;var T="constructor";if(N.has(S,T)&&!N.contains(R,T)){R.push(T)}while(O--){T=b[O];if(T in S&&S[T]!==Q[T]&&!N.contains(R,T)){R.push(T)}}}N.keys=function(Q){if(!N.isObject(Q)){return[]}if(f){return f(Q)}var P=[];for(var O in Q){if(N.has(Q,O)){P.push(O)}}if(G){e(Q,P)}return P};N.allKeys=function(Q){if(!N.isObject(Q)){return[]}var P=[];for(var O in Q){P.push(O)}if(G){e(Q,P)}return P};N.values=function(S){var R=N.keys(S);var Q=R.length;var O=Array(Q);for(var P=0;P<Q;P++){O[P]=S[R[P]]}return O};N.mapObject=function(T,V,Q){V=F(V,Q);var S=N.keys(T),R=S.length,P={},U;for(var O=0;O<R;O++){U=S[O];P[U]=V(T[U],U,T)}return P};N.pairs=function(S){var Q=N.keys(S);var P=Q.length;var R=Array(P);for(var O=0;O<P;O++){R[O]=[Q[O],S[Q[O]]]}return R};N.invert=function(S){var O={};var R=N.keys(S);for(var P=0,Q=R.length;P<Q;P++){O[S[R[P]]]=R[P]}return O};N.functions=N.methods=function(Q){var P=[];for(var O in Q){if(N.isFunction(Q[O])){P.push(O)}}return P.sort()};N.extend=q(N.allKeys);N.extendOwn=N.assign=q(N.keys);N.findKey=function(U,O,R){O=F(O,R);var T=N.keys(U),Q;for(var P=0,S=T.length;P<S;P++){Q=T[P];if(O(U[Q],Q,U)){return Q}}};N.pick=function(Q,U,O){var Y={},R=Q,T,X;if(R==null){return Y}if(N.isFunction(U)){X=N.allKeys(R);T=c(U,O)}else{X=w(arguments,false,false,1);T=function(aa,Z,ab){return Z in ab};R=Object(R)}for(var S=0,P=X.length;S<P;S++){var W=X[S];var V=R[W];if(T(V,W,R)){Y[W]=V}}return Y};N.omit=function(Q,R,O){if(N.isFunction(R)){R=N.negate(R)}else{var P=N.map(w(arguments,false,false,1),String);R=function(T,S){return !N.contains(P,S)}}return N.pick(Q,R,O)};N.defaults=q(N.allKeys,true);N.clone=function(O){if(!N.isObject(O)){return O}return N.isArray(O)?O.slice():N.extend({},O)};N.tap=function(P,O){O(P);return P};N.isMatch=function(P,O){var T=N.keys(O),S=T.length;if(P==null){return !S}var U=Object(P);for(var R=0;R<S;R++){var Q=T[R];if(O[Q]!==U[Q]||!(Q in U)){return false}}return true};var M=function(W,V,P,R){if(W===V){return W!==0||1/W===1/V}if(W==null||V==null){return W===V}if(W instanceof N){W=W._wrapped}if(V instanceof N){V=V._wrapped}var T=d.call(W);if(T!==d.call(V)){return false}switch(T){case"[object RegExp]":case"[object String]":return""+W===""+V;case"[object Number]":if(+W!==+W){return +V!==+V}return +W===0?1/+W===1/V:+W===+V;case"[object Date]":case"[object Boolean]":return +W===+V}var Q=T==="[object Array]";if(!Q){if(typeof W!="object"||typeof V!="object"){return false}var U=W.constructor,S=V.constructor;if(U!==S&&!(N.isFunction(U)&&U instanceof U&&N.isFunction(S)&&S instanceof S)&&("constructor" in W&&"constructor" in V)){return false}}P=P||[];R=R||[];var O=P.length;while(O--){if(P[O]===W){return R[O]===V}}P.push(W);R.push(V);if(Q){O=W.length;if(O!==V.length){return false}while(O--){if(!M(W[O],V[O],P,R)){return false}}}else{var Y=N.keys(W),X;O=Y.length;if(N.keys(V).length!==O){return false}while(O--){X=Y[O];if(!(N.has(V,X)&&M(W[X],V[X],P,R))){return false}}}P.pop();R.pop();return true};N.isEqual=function(P,O){return M(P,O)};N.isEmpty=function(O){if(O==null){return true}if(D(O)&&(N.isArray(O)||N.isString(O)||N.isArguments(O))){return O.length===0}return N.keys(O).length===0};N.isElement=function(O){return !!(O&&O.nodeType===1)};N.isArray=t||function(O){return d.call(O)==="[object Array]"};N.isObject=function(P){var O=typeof P;return O==="function"||O==="object"&&!!P};N.each(["Arguments","Function","String","Number","Date","RegExp","Error"],function(O){N["is"+O]=function(P){return d.call(P)==="[object "+O+"]"}});if(!N.isArguments(arguments)){N.isArguments=function(O){return N.has(O,"callee")}}if(typeof/./!="function"&&typeof Int8Array!="object"){N.isFunction=function(O){return typeof O=="function"||false}}N.isFinite=function(O){return isFinite(O)&&!isNaN(parseFloat(O))};N.isNaN=function(O){return N.isNumber(O)&&O!==+O};N.isBoolean=function(O){return O===true||O===false||d.call(O)==="[object Boolean]"};N.isNull=function(O){return O===null};N.isUndefined=function(O){return O===void 0};N.has=function(P,O){return P!=null&&k.call(P,O)};N.noConflict=function(){v._=l;return this};N.identity=function(O){return O};N.constant=function(O){return function(){return O}};N.noop=function(){};N.property=function(O){return function(P){return P==null?void 0:P[O]}};N.propertyOf=function(O){return O==null?function(){}:function(P){return O[P]}};N.matcher=N.matches=function(O){O=N.extendOwn({},O);return function(P){return N.isMatch(P,O)}};N.times=function(S,R,Q){var O=Array(Math.max(0,S));R=c(R,Q,1);for(var P=0;P<S;P++){O[P]=R(P)}return O};N.random=function(P,O){if(O==null){O=P;P=0}return P+Math.floor(Math.random()*(O-P+1))};N.now=Date.now||function(){return new Date().getTime()};var s={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","`":"&#x60;"};var n=N.invert(s);var x=function(S){var P=function(T){return S[T]};var R="(?:"+N.keys(S).join("|")+")";var Q=RegExp(R);var O=RegExp(R,"g");return function(T){T=T==null?"":""+T;return Q.test(T)?T.replace(O,P):T}};N.escape=x(s);N.unescape=x(n);N.result=function(O,Q,R){var P=O==null?void 0:O[Q];if(P===void 0){P=R}return N.isFunction(P)?P.call(O):P};var A=0;N.uniqueId=function(O){var P=++A+"";return O?O+P:P};N.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,escape:/<%-([\s\S]+?)%>/g};var u=/(.)^/;var i={"'":"'","\\":"\\","\r":"r","\n":"n","\u2028":"u2028","\u2029":"u2029"};var j=/\\|'|\r|\n|\u2028|\u2029/g;var H=function(O){return"\\"+i[O]};N.template=function(X,R,U){if(!R&&U){R=U}R=N.defaults({},R,N.templateSettings);var S=RegExp([(R.escape||u).source,(R.interpolate||u).source,(R.evaluate||u).source].join("|")+"|$","g");var T=0;var O="__p+='";X.replace(S,function(Z,aa,Y,ac,ab){O+=X.slice(T,ab).replace(j,H);T=ab+Z.length;if(aa){O+="'+\n((__t=("+aa+"))==null?'':_.escape(__t))+\n'"}else{if(Y){O+="'+\n((__t=("+Y+"))==null?'':__t)+\n'"}else{if(ac){O+="';\n"+ac+"\n__p+='"}}}return Z});O+="';\n";if(!R.variable){O="with(obj||{}){\n"+O+"}\n"}O="var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};\n"+O+"return __p;\n";try{var Q=new Function(R.variable||"obj","_",O)}catch(V){V.source=O;throw V}var W=function(Y){return Q.call(this,Y,N)};var P=R.variable||"obj";W.source="function("+P+"){\n"+O+"}";return W};N.chain=function(P){var O=N(P);O._chain=true;return O};var p=function(O,P){return O._chain?N(P).chain():P};N.mixin=function(O){N.each(N.functions(O),function(P){var Q=N[P]=O[P];N.prototype[P]=function(){var R=[this._wrapped];L.apply(R,arguments);return p(this,Q.apply(N,R))}})};N.mixin(N);N.each(["pop","push","reverse","shift","sort","splice","unshift"],function(O){var P=I[O];N.prototype[O]=function(){var Q=this._wrapped;P.apply(Q,arguments);if((O==="shift"||O==="splice")&&Q.length===0){delete Q[0]}return p(this,Q)}});N.each(["concat","join","slice"],function(O){var P=I[O];N.prototype[O]=function(){return p(this,P.apply(this._wrapped,arguments))}});N.prototype.value=function(){return this._wrapped};N.prototype.valueOf=N.prototype.toJSON=N.prototype.value;N.prototype.toString=function(){return""+this._wrapped};if(typeof define==="function"&&define.amd){define("underscore",[],function(){return N})}}.call(this));(function(){var u=(function(){if(typeof window!=="undefined"&&window&&window.window===window){return window}if(typeof global!=="undefined"&&global&&global.global===global){return global}throw new Error("Unable to determine global object")})();if(typeof u.Promise==="function"){return}var p=(function(){if(u.process&&typeof process.version==="string"){return u.setImmediate?function(ab){setImmediate(ab)}:function(ab){process.nextTick(ab)}}var Y=u.MutationObserver||u.WebKitMutationObserver;if(Y){var aa=document.createElement("div"),Z=void 0;var X=new Y(function(){var ab=Z;Z=void 0;ab()});X.observe(aa,{attributes:true});return function(ab){if(Z!==void 0){throw new Error("Only one function can be queued at a time")}Z=ab;aa.classList.toggle("x")}}return function(ab){setTimeout(ab,0)}})();var V=(function(){var Y=null;function X(){var ab=Y;Y=null;for(var aa=0;aa<ab.length;++aa){ab[aa]()}}return function Z(aa){if(!Y){Y=[];p(X)}Y.push(aa)}})();function T(X,Z,Y){X[Z]=Y}function L(X,Y){return X[Y]}function d(X){return typeof X==="function"}function H(X){return X===Object(X)}function c(X,Y){return Y in X}function S(X){return X===void 0}function Q(X){return new TypeError(X)}var P=Object.defineProperties&&Object.defineProperty;function W(Z,X,Y){if(!P){Z[X]=Y;return}P(Z,X,{configurable:true,writable:true,enumerable:false,value:Y})}function j(aa,X,Z){for(var Y=0;Y<Z.length;Y+=2){W(aa,Z[Y],Z[Y+1])}}var n=Array.isArray||(function(){var X=Object.prototype.toString;return function(Y){return X.call(Y)==="[object Array]"}})();var A,q,g=Array;var M;var k;var I;var y;var J;var B;var K;var e="Promise#status";var N="Promise#value";var f="Promise#onResolve";var m="Promise#onReject";var z={};var E="Promise#hasHandler";var U=0;var s=function C(Z){if(Z===z){return}if(!d(Z)){throw Q("resolver_not_a_function",[Z])}var Y=h(this);try{Z(function(aa){I(Y,aa)},function(aa){y(Y,aa)})}catch(X){y(Y,X)}};function x(aa,X,Y,Z,ab){T(aa,e,X);T(aa,N,Y);T(aa,f,Z);T(aa,m,ab);return aa}function h(X){return x(X,0,A,new g,new g)}function v(aa,X,Z,Y){if(L(aa,e)===0){t(Z,L(aa,Y),X);x(aa,X,Z)}}function D(Z,X){if(!M(X)&&H(X)){var ab;try{ab=X.then}catch(aa){return l.call(Z,aa)}if(d(ab)){var Y=w.call(Z);try{ab.call(X,Y.resolve,Y.reject)}catch(aa){Y.reject(aa)}return Y.promise}}return X}function r(ab,aa,Y){try{var X=aa(ab);if(X===Y.promise){throw Q("promise_cyclic",[X])}else{if(M(X)){J.call(X,Y.resolve,Y.reject)}else{Y.resolve(X)}}}catch(Z){try{Y.reject(Z)}catch(ac){}}}function t(Y,Z,X){V(function(){for(var aa=0;aa<Z.length;aa+=2){r(Y,Z[aa],Z[aa+1])}})}function b(X){return X}function G(X){throw X}function O(){}M=function M(X){return H(X)&&c(X,e)};k=function k(){return new s(O)};I=function I(Y,X){v(Y,+1,X,f)};y=function y(Y,X){v(Y,-1,X,m)};function w(){if(this===s){var Y=h(new s(z));return{promise:Y,resolve:function(Z){I(Y,Z)},reject:function(Z){y(Y,Z)}}}else{var X={};X.promise=new this(function(aa,Z){X.resolve=aa;X.reject=Z});return X}}function F(X){if(this===s){return x(new s(z),+1,X)}else{return new this(function(Z,Y){Z(X)})}}function l(X){var Y;if(this===s){Y=x(new s(z),-1,X)}else{Y=new this(function(aa,Z){Z(X)})}return Y}J=function J(Y,Z){Y=S(Y)?b:Y;Z=S(Z)?G:Z;var X=w.call(this.constructor);switch(L(this,e)){case A:throw Q("not_a_promise",[this]);case 0:L(this,f).push(Y,X);L(this,m).push(Z,X);break;case +1:t(L(this,N),[Y,X],+1);break;case -1:t(L(this,N),[Z,X],-1);break}T(this,E,true);return X.promise};B=function B(X){return this.then(A,X)};K=function K(Z,aa){Z=d(Z)?Z:b;aa=d(aa)?aa:G;var Y=this;var X=this.constructor;return J.call(this,function(ab){ab=D(X,ab);return ab===Y?aa(Q("promise_cyclic",[ab])):M(ab)?ab.then(Z,aa):Z(ab)},aa)};function R(X){return M(X)?X:new this(function(Y){Y(X)})}function o(Z){var Y=w.call(this);var X=[];if(!n(Z)){Y.reject(Q("invalid_argument"));return Y.promise}try{var ab=Z.length;if(ab===0){Y.resolve(X)}else{for(var aa=0;aa<Z.length;++aa){this.resolve(Z[aa]).then((function(){var ad=aa;return function(ae){X[ad]=ae;if(--ab===0){Y.resolve(X)}}})(),function(ad){Y.reject(ad)})}}}catch(ac){Y.reject(ac)}return Y.promise}function i(Y){var X=w.call(this);if(!n(Y)){X.reject(Q("invalid_argument"));return X.promise}try{for(var Z=0;Z<Y.length;++Z){this.resolve(Y[Z]).then(function(ab){X.resolve(ab)},function(ab){X.reject(ab)})}}catch(aa){X.reject(aa)}return X.promise}W(u,"Promise",s,q);j(s,q,["defer",w,"accept",F,"reject",l,"all",o,"race",i,"resolve",R]);j(s.prototype,q,["chain",J,"then",K,"catch",B])})();!function(){jQuery.fn.refresh=function(){return jQuery(this.selector)},jQuery.fn.renderWithAd=function(e,d){var f=this;return d=d||{},d.empty=d.empty||jQuery.noop,d.full=d.full||jQuery.noop,this.hide(),cmg.harmony.slot(e).on("slotRenderEnded",function(b){b.isEmpty?d.empty(b):(f.show(),d.full(b))}),this}}();
/*!
 * jQuery Cookie Plugin v1.2
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2011, Klaus Hartl
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.opensource.org/licenses/GPL-2.0
 */
(function(f,c,g){var b=/\+/g;function e(h){return h}function d(h){return decodeURIComponent(h.replace(b," "))}f.cookie=function(m,l,q){if(l!==g&&!/Object/.test(Object.prototype.toString.call(l))){q=f.extend({},f.cookie.defaults,q);if(l===null){q.expires=-1}if(typeof q.expires==="number"){var n=q.expires,p=q.expires=new Date();p.setDate(p.getDate()+n)}l=String(l);return(c.cookie=[encodeURIComponent(m),"=",q.raw?l:encodeURIComponent(l),q.expires?"; expires="+q.expires.toUTCString():"",q.path?"; path="+q.path:"",q.domain?"; domain="+q.domain:"",q.secure?"; secure":""].join(""))}q=l||f.cookie.defaults||{};var h=q.raw?e:d;var o=c.cookie.split("; ");for(var k=0,j;(j=o[k]&&o[k].split("="));k++){if(h(j.shift())===m){return h(j.join("="))}}return null};f.cookie.defaults={};f.removeCookie=function(i,h){if(f.cookie(i,h)!==null){f.cookie(i,null,h);return true}return false}})(jQuery,document);!function(){function t(j,i){var z=void 0!==window.pageYOffset?window.pageYOffset:(document.documentElement||document.body.parentNode||document.body).scrollTop,y=document.documentElement.clientHeight,x=z+y;i=i||0;var w=j.getBoundingClientRect(),v=w.top+z-i,u=w.bottom+z+i;return u>z&&x>v}function s(d,c){return c.handler="function"==typeof c.handler?c.handler:k,c.enabled="undefined"==typeof c.enabled?!0:c.enabled,c.scroll=c.scroll||{},c.scroll.onscreen="function"==typeof c.scroll.onscreen?c.scroll.onscreen:k,c.scroll.offscreen="function"==typeof c.scroll.offscreen?c.scroll.offscreen:k,d.jb_wasOnscreen=!1,d.jb_range=c.range,d.jb_destroy=function(){var e,f=l.length;for(e=0;f>e;e+=1){l[e]===d&&(l.splice(e,1),e-=1,f-=1)}},d.jb_handler=function(){var b=jQuery(d);c.handler.call(b,d),c.runOnce&&d.jb_destroy(),b.trigger("beacon/activate")},d.jb_onscreen=function(){var b=jQuery(d);c.scroll.onscreen.call(b,d),b.trigger("beacon/scroll/onscreen")},d.jb_offscreen=function(){var b=jQuery(d);c.scroll.offscreen.call(b,d),b.trigger("beacon/scroll/offscreen")},c.enabled&&(d.jb_active=!0),d}jQuery.beacons=function(f){var c,h,g=l.length;if("destroy"===f){m=!1,l=[]}else{if("enable"===f){for(h=0;g>h;h+=1){l[h].jb_active=!0}r()}else{if("disable"===f){for(h=0;g>h;h+=1){l[h].jb_active=!1}m=!1}else{if("fetch"===f){return l}if("activate"===f){for(h=0;g>h;h+=1){c=l[h],c.jb_active&&c.jb_handler()}}else{if("settings"===f){return{range:n,throttle:o}}"object"==typeof f&&(n="number"==typeof f.range?f.range:n,o="number"==typeof f.throttle?f.throttle:o)}}}}return this};var r=function(){q(),m||(m=!0,p=window.setInterval(function(){q(),m||window.clearInterval(p)},o))},q=function(){var f,i,h,g=l.length;for(f=0;g>f;f+=1){i=l[f],h="number"==typeof i.jb_range?i.jb_range:n,i.jb_active&&(t(i,h)?(i.jb_handler(),i.jb_wasOnscreen||(i.jb_wasOnscreen=!0,i.jb_onscreen())):i.jb_wasOnscreen&&(i.jb_wasOnscreen=!1,i.jb_offscreen()))}};jQuery.fn.beacon=function(b){return this.each(function(h,g){var c;"function"==typeof b?(c=s(g,{handler:b}),l.push(c),r()):"activate"===b?g.jb_active&&g.jb_handler():"enable"===b?g.jb_active=!0:"disable"===b?g.jb_active=!1:"destroy"===b?g.jb_destroy():"object"==typeof b&&(c=s(g,b),l.push(c),r())}),this};var p=!1,o=80,n=0,m=!1,l=[],k=function(){}}();!function(){window.cmg={query:jQuery.noConflict(),log:{ads:Lumberjack()},_:window._,unveil:function(){var b=cmg.query;b("img").unveil(50,function(){b(this).load(function(){this.style.opacity=1})})}},cmg.query.beacons({range:15}),function(){var e=function(){},d=["assert","clear","count","debug","dir","dirxml","error","exception","group","groupCollapsed","groupEnd","info","log","markTimeline","profile","profileEnd","table","time","timeEnd","timeStamp","trace","warn"],f=window.console||(window.console={});d.forEach(function(c){f[c]||(f[c]=e)})}(),cmg.localCache={cacheKey:function(b){return"cm-"+b},load:function(f){var e;try{e=JSON.parse(localStorage.getItem(this.cacheKey(f)))}catch(h){}if(!Array.isArray(e)||0===e.length){return null}if(e.length>1){var g=e[1];if("number"==typeof g&&g<Date.now()){return null}}return e[0]},store:function(i,h,n){n=n||{};var m=null;if("number"==typeof n.expires){var l=new Date;l.setSeconds(l.getSeconds()+n.expires),m=l.getTime()}var k=JSON.stringify([h,m]);try{localStorage.setItem(this.cacheKey(i),k)}catch(j){}},remove:function(b){localStorage.removeItem(this.cacheKey(b))},clear:function(){for(var f,e=this.cacheKey(""),h=[],g=0;g<localStorage.length;g+=1){f=localStorage.key(g),0===f.indexOf(e)&&h.push(f)}h.forEach(function(b){localStorage.removeItem(b)})}}}();cmg.utility={getMetaKeywords:function(){try{var b=cmg.query("meta[name=keywords]").attr("content");var d=b.split(",");return d.map(function(e){return e.trim()})}catch(c){return[]}},getURLParamDict:function(c){c=decodeURIComponent(c);c=c.slice(1);var b={};var d=c.split("&");d.forEach(function(f){var e=f.split("=");b[e.shift()]=e.join("=")});return b},loc_query:function(c){c=c.replace(/[\[]/,"\\[").replace(/[\]]/,"\\]");var b="[\\?&]"+c+"=([^&#]*)";var e=new RegExp(b);var d=e.exec(window.location.search);if(d==null){return""}else{return decodeURIComponent(d[1].replace(/\+/g," "))}},title_case:function(c){function b(d){return d.charAt(0).toUpperCase()+d.substr(1).toLowerCase()}return c.replace(/\w\S*/g,b)},getScriptParameter:function(f,h){var c=document.getElementsByTagName("script");var d=c.length-1;var e=c[d];if(h==null){h=""}f=f.replace(/[\[]/,"\\[").replace(/[\]]/,"\\]");var g=new RegExp("[\\?&]"+f+"=([^&#]*)");var b=g.exec(e.src);if(b==null){return h}else{return b[1]}},slugify:function(b){return b.replace(/[^-a-zA-Z0-9,&\s]+/ig,"").replace(/\s/gi,"-").toLowerCase()},parse_iso_8601:function(m){var h=new Date(m),i=h.getFullYear(),g=h.getMonth()+1,k=h.getDate(),f=h.getHours(),e=h.getMinutes(),c=(f>=12)?"p.m.":"a.m.",b=f%12||12,j=(e<10)?"0".concat(e):e;var d=[g,k,i].join("/"),l=[b,j].join(":");if(cmg._.isNaN(h.getTime())){l="";c=""}if(cmg._.isNaN(h.getDate())){d=""}return[d,l,c].join(" ")},set_font_size:function(b){$=cmg.query;$(".font-size-control button.disabled").removeClass("disabled");$.cookie("font_size",b,{expires:730,path:"/"});$('.font-size-control button[data-fontvalue="'+b+'"]').addClass("disabled");$("body").removeClass("font-default font-large font-xlarge").addClass(b)}};!function a(h,m,l){function k(f,e){if(!m[f]){if(!h[f]){var d="function"==typeof require&&require;if(!e&&d){return d(f,!0)}if(j){return j(f,!0)}var c=new Error("Cannot find module '"+f+"'");throw c.code="MODULE_NOT_FOUND",c}var b=m[f]={exports:{}};h[f][0].call(b.exports,function(g){var n=h[f][1][g];return k(n?n:g)},b,b.exports,a,h,m,l)}return m[f].exports}for(var j="function"==typeof require&&require,i=0;i<l.length;i++){k(l[i])}return k}({1:[function(b){window.cmg.ads={move:b("./utils/move.js"),size:b("./utils/expand.js"),conf:b("./utils/conf.js")}},{"./utils/conf.js":2,"./utils/expand.js":3,"./utils/move.js":4}],2:[function(e,d){var f;d.exports={load:function(b){f=b},filter:function(g){var c;return g=cmg._(g).pluck("id"),c=f.filter(function(h){return cmg._(g).contains(h.id)}),f=cmg._(f).difference(c),c},flush:function(){var b=f;return f=[],b}}},{}],3:[function(g,f){var j=localStorage.getItem("cm-ads"),i=JSON.parse(j)||{},h=function(e,d){var k=document.getElementById("cm-adutil-styles").sheet;"insertRule" in k?k.insertRule(e+"{"+d+"}",k.cssRules.length):k.addRule(e,d,k.cssRules.length)};f.exports={expand:function(){var b=i[location.pathname]||[];b.forEach(function(c){c.empty||h("#"+c.id,["display: block !important","min-height:"+c.minHeight].join(";"))})},save:function(d){var c=[];d=d||[],d.forEach(function(b){c.push({id:b.divId,minHeight:b.currentHeight,empty:b.empty})}),i[location.pathname]=c,localStorage.setItem("cm-ads",JSON.stringify(i))},update:function(d,c){d.empty=c.isEmpty,d.currentHeight=(c.size?c.size[1]:0)+"px",h("#"+d.divId,["display:"+(c.isEmpty?"none":"block")+"!important","min-height:"+d.currentHeight].join(";"))},bind:function(){var e=cmg.harmony.breakpoint("0px-infinity"),d=e.length,k=this;e.forEach(function(b){b.on("slotRenderEnded",function(c){d-=1,k.update(b,c),0===d&&k.save(e)})})}}},{}],4:[function(e,d){var f=cmg.query;d.exports=function(g){var c=f(g.gridSelector);g.isValid=g.isValid||function(){return !0},g.strict=g.strict||!1;var h=function(i){for(var b=c.eq(i);b.length&&!g.isValid(b);){i+=1,b=c.eq(i)}return i};return{toIndex:function(j){var i,b=f(g.selector);j<c.length?(i=c[j],b.insertBefore(i)):g.strict?b.remove():(i=c.last(),b.insertAfter(i))},nearIndex:function(j){var i=h(j);this.toIndex(i)},nearFraction:function(b){var j=Math.round(c.length*b),i=h(j);this.toIndex(i)}}}},{}]},{},[1]);(function(b){b("document").ready(function(){var d=navigator.userAgent.match(/(iPad|iPhone|iPod)/g)?true:false;var c=navigator.userAgent.match(/(android)/ig)?true:false;if(d){b(".ios-only").each(function(e,f){b(f).show()})}if(c){b(".android-only").each(function(e,f){b(f).show()})}})})(jQuery);(function(a5){function a4(e,d,f){switch(arguments.length){case 2:return null!=e?e:d;case 3:return null!=e?e:null!=d?d:f;default:throw new Error("Implement me")}}function a3(){return{empty:!1,unusedTokens:[],unusedInput:[],overflow:-2,charsLeftOver:0,nullInput:!1,invalidMonth:null,invalidFormat:!1,userInvalidated:!1,iso:!1}}function a2(f,e){function h(){bT.suppressDeprecationWarnings===!1&&"undefined"!=typeof console&&console.warn&&console.warn("Deprecation warning: "+f)}var g=!0;return aS(function(){return g&&(h(),g=!1),e.apply(this,arguments)},e)}function aZ(d,c){return function(b){return aO(d.call(this,b),c)}}function aY(d,c){return function(b){return this.lang().ordinal(d.call(this,b),c)}}function aX(){}function aW(b){ay(b),aS(this,b)}function aV(v){var u=aG(v),t=u.year||0,s=u.quarter||0,r=u.month||0,q=u.week||0,p=u.day||0,o=u.hour||0,n=u.minute||0,m=u.second||0,l=u.millisecond||0;this._milliseconds=+l+1000*m+60000*n+3600000*o,this._days=+p+7*q,this._months=+r+3*s+12*t,this._data={},this._bubble()}function aS(e,d){for(var f in d){d.hasOwnProperty(f)&&(e[f]=d[f])}return d.hasOwnProperty("toString")&&(e.toString=d.toString),d.hasOwnProperty("valueOf")&&(e.valueOf=d.valueOf),e}function aR(e){var d,f={};for(d in e){e.hasOwnProperty(d)&&b3.hasOwnProperty(d)&&(f[d]=e[d])}return f}function aP(b){return 0>b?Math.ceil(b):Math.floor(b)}function aO(g,f,j){for(var i=""+Math.abs(g),h=g>=0;i.length<f;){i="0"+i}return(h?j?"+":"":"-")+i}function aN(i,h,n,m){var l=h._milliseconds,k=h._days,j=h._months;m=null==m?!0:m,l&&i._d.setTime(+i._d+l*n),k&&bv(i,"Date",bR(i,"Date")+k*n),j&&b2(i,bR(i,"Month")+j*n),m&&bT.updateOffset(i,k||j)}function aL(b){return"[object Array]"===Object.prototype.toString.call(b)}function aK(b){return"[object Date]"===Object.prototype.toString.call(b)||b instanceof Date}function aI(i,h,n){var m,l=Math.min(i.length,h.length),k=Math.abs(i.length-h.length),j=0;for(m=0;l>m;m++){(n&&i[m]!==h[m]||!n&&aE(i[m])!==aE(h[m]))&&j++}return j+k}function aH(d){if(d){var c=d.toLowerCase().replace(/(.)s$/,"$1");d=bl[d]||aJ[c]||c}return d}function aG(f){var e,h,g={};for(h in f){f.hasOwnProperty(h)&&(e=aH(h),e&&(g[e]=f[h]))}return g}function aF(e){var g,f;if(0===e.indexOf("week")){g=7,f="day"}else{if(0!==e.indexOf("month")){return}g=12,f="month"}bT[e]=function(m,l){var k,d,c=bT.fn._lang[e],b=[];if("number"==typeof m&&(l=m,m=a5),d=function(i){var h=bT().utc().set(f,i);return c.call(bT.fn._lang,h,m||"")},null!=l){return d(l)}for(k=0;g>k;k++){b.push(d(k))}return b}}function aE(e){var d=+e,f=0;return 0!==d&&isFinite(d)&&(f=d>=0?Math.floor(d):Math.ceil(d)),f}function aD(d,c){return new Date(Date.UTC(d,c+1,0)).getUTCDate()}function aC(e,d,f){return bn(bT([e,11,31+d-f]),d,f).week}function aB(b){return aA(b)?366:365}function aA(b){return b%4===0&&b%100!==0||b%400===0}function ay(d){var c;d._a&&-2===d._pf.overflow&&(c=d._a[bJ]<0||d._a[bJ]>11?bJ:d._a[a6]<1||d._a[a6]>aD(d._a[bW],d._a[bJ])?a6:d._a[aw]<0||d._a[aw]>23?aw:d._a[am]<0||d._a[am]>59?am:d._a[aa]<0||d._a[aa]>59?aa:d._a[bY]<0||d._a[bY]>999?bY:-1,d._pf._overflowDayOfYear&&(bW>c||c>a6)&&(c=a6),d._pf.overflow=c)}function bK(b){return null==b._isValid&&(b._isValid=!isNaN(b._d.getTime())&&b._pf.overflow<0&&!b._pf.empty&&!b._pf.invalidMonth&&!b._pf.nullInput&&!b._pf.invalidFormat&&!b._pf.userInvalidated,b._strict&&(b._isValid=b._isValid&&0===b._pf.charsLeftOver&&0===b._pf.unusedTokens.length)),b._isValid}function bI(b){return b?b.toLowerCase().replace("_","-"):b}function bH(d,c){return c._isUTC?bT(d).zone(c._offset||0):bT(d).local()}function bG(d,c){return c.abbr=d,bM[d]||(bM[d]=new aX),bM[d].set(c),bM[d]}function bE(b){delete bM[b]}function bB(i){var h,n,m,l,k=0,j=function(d){if(!bM[d]&&bS){try{require("./lang/"+d)}catch(c){}}return bM[d]};if(!i){return bT.fn._lang}if(!aL(i)){if(n=j(i)){return n}i=[i]}for(;k<i.length;){for(l=bI(i[k]).split("-"),h=l.length,m=bI(i[k+1]),m=m?m.split("-"):null;h>0;){if(n=j(l.slice(0,h).join("-"))){return n}if(m&&m.length>=h&&aI(l,m,!0)>=h-1){break}h--}k++}return bT.fn._lang}function bA(b){return b.match(/\[[\s\S]/)?b.replace(/^\[|\]$/g,""):b.replace(/\\/g,"")}function bz(f){var e,h,g=f.match(aj);for(e=0,h=g.length;h>e;e++){g[e]=bs[g[e]]?bs[g[e]]:bA(g[e])}return function(c){var b="";for(e=0;h>e;e++){b+=g[e] instanceof Function?g[e].call(c,f):g[e]}return b}}function by(d,c){return d.isValid()?(c=bx(c,d.lang()),ap[c]||(ap[c]=bz(c)),ap[c](d)):d.lang().invalidDate()}function bx(f,e){function h(b){return e.longDateFormat(b)||b}var g=5;for(b5.lastIndex=0;g>=0&&b5.test(f);){f=f.replace(b5,h),b5.lastIndex=0,g-=1}return f}function bu(f,e){var h,g=e._strict;switch(f){case"Q":return an;case"DDDD":return bZ;case"YYYY":case"GGGG":case"gggg":return g?bN:a1;case"Y":case"G":case"g":return az;case"YYYYYY":case"YYYYY":case"GGGGG":case"ggggg":return g?a9:av;case"S":if(g){return an}case"SS":if(g){return ad}case"SSS":if(g){return bZ}case"DDD":return bD;case"MMM":case"MMMM":case"dd":case"ddd":case"dddd":return b7;case"a":case"A":return bB(e._l)._meridiemParse;case"X":return a7;case"Z":case"ZZ":return bX;case"T":return bL;case"SSSS":return al;case"MM":case"DD":case"YY":case"GG":case"gg":case"HH":case"hh":case"mm":case"ss":case"ww":case"WW":return g?ad:bU;case"M":case"D":case"d":case"H":case"h":case"m":case"s":case"w":case"W":case"e":case"E":return bU;case"Do":return ax;default:return h=new RegExp(bi(bj(f.replace("\\","")),"i"))}}function bt(g){g=g||"";var f=g.match(bX)||[],j=f[f.length-1]||[],i=(j+"").match(af)||["-",0,0],h=+(60*i[1])+aE(i[2]);return"+"===i[0]?-h:h}function br(g,f,j){var i,h=j._a;switch(g){case"Q":null!=f&&(h[bJ]=3*(aE(f)-1));break;case"M":case"MM":null!=f&&(h[bJ]=aE(f)-1);break;case"MMM":case"MMMM":i=bB(j._l).monthsParse(f),null!=i?h[bJ]=i:j._pf.invalidMonth=f;break;case"D":case"DD":null!=f&&(h[a6]=aE(f));break;case"Do":null!=f&&(h[a6]=aE(parseInt(f,10)));break;case"DDD":case"DDDD":null!=f&&(j._dayOfYear=aE(f));break;case"YY":h[bW]=bT.parseTwoDigitYear(f);break;case"YYYY":case"YYYYY":case"YYYYYY":h[bW]=aE(f);break;case"a":case"A":j._isPm=bB(j._l).isPM(f);break;case"H":case"HH":case"h":case"hh":h[aw]=aE(f);break;case"m":case"mm":h[am]=aE(f);break;case"s":case"ss":h[aa]=aE(f);break;case"S":case"SS":case"SSS":case"SSSS":h[bY]=aE(1000*("0."+f));break;case"X":j._d=new Date(1000*parseFloat(f));break;case"Z":case"ZZ":j._useUTC=!0,j._tzm=bt(f);break;case"dd":case"ddd":case"dddd":i=bB(j._l).weekdaysParse(f),null!=i?(j._w=j._w||{},j._w.d=i):j._pf.invalidWeekday=f;break;case"w":case"ww":case"W":case"WW":case"d":case"e":case"E":g=g.substr(0,1);case"gggg":case"GGGG":case"GGGGG":g=g.substr(0,2),f&&(j._w=j._w||{},j._w[g]=aE(f));break;case"gg":case"GG":j._w=j._w||{},j._w[g]=bT.parseTwoDigitYear(f)}}function bq(r){var q,p,o,n,m,l,k,b;q=r._w,null!=q.GG||null!=q.W||null!=q.E?(m=1,l=4,p=a4(q.GG,r._a[bW],bn(bT(),1,4).year),o=a4(q.W,1),n=a4(q.E,1)):(b=bB(r._l),m=b._week.dow,l=b._week.doy,p=a4(q.gg,r._a[bW],bn(bT(),m,l).year),o=a4(q.w,1),null!=q.d?(n=q.d,m>n&&++o):n=null!=q.e?q.e+m:m),k=aM(p,o,n,l,m),r._a[bW]=k.year,r._dayOfYear=k.dayOfYear}function bp(b){var l,k,j,i,h=[];if(!b._d){for(j=bm(b),b._w&&null==b._a[a6]&&null==b._a[bJ]&&bq(b),b._dayOfYear&&(i=a4(b._a[bW],j[bW]),b._dayOfYear>aB(i)&&(b._pf._overflowDayOfYear=!0),k=ba(i,0,b._dayOfYear),b._a[bJ]=k.getUTCMonth(),b._a[a6]=k.getUTCDate()),l=0;3>l&&null==b._a[l];++l){b._a[l]=h[l]=j[l]}for(;7>l;l++){b._a[l]=h[l]=null==b._a[l]?2===l?1:0:b._a[l]}b._d=(b._useUTC?ba:bd).apply(null,h),null!=b._tzm&&b._d.setUTCMinutes(b._d.getUTCMinutes()+b._tzm)}}function bo(d){var c;d._d||(c=aG(d._i),d._a=[c.year,c.month,c.day,c.hour,c.minute,c.second,c.millisecond],bp(d))}function bm(d){var c=new Date;return d._useUTC?[c.getUTCFullYear(),c.getUTCMonth(),c.getUTCDate()]:[c.getFullYear(),c.getMonth(),c.getDate()]}function bk(t){if(t._f===bT.ISO_8601){return void bg(t)}t._a=[],t._pf.empty=!0;var s,r,q,p,o,n=bB(t._l),m=""+t._i,l=m.length,k=0;for(q=bx(t._f,n).match(aj)||[],s=0;s<q.length;s++){p=q[s],r=(m.match(bu(p,t))||[])[0],r&&(o=m.substr(0,m.indexOf(r)),o.length>0&&t._pf.unusedInput.push(o),m=m.slice(m.indexOf(r)+r.length),k+=r.length),bs[p]?(r?t._pf.empty=!1:t._pf.unusedTokens.push(p),br(p,r,t)):t._strict&&!r&&t._pf.unusedTokens.push(p)}t._pf.charsLeftOver=l-k,m.length>0&&t._pf.unusedInput.push(m),t._isPm&&t._a[aw]<12&&(t._a[aw]+=12),t._isPm===!1&&12===t._a[aw]&&(t._a[aw]=0),bp(t),ay(t)}function bj(b){return b.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g,function(g,f,j,i,h){return f||j||i||h})}function bi(b){return b.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&")}function bh(h){var c,l,k,j,i;if(0===h._f.length){return h._pf.invalidFormat=!0,void (h._d=new Date(0/0))}for(j=0;j<h._f.length;j++){i=0,c=aS({},h),c._pf=a3(),c._f=h._f[j],bk(c),bK(c)&&(i+=c._pf.charsLeftOver,i+=10*c._pf.unusedTokens.length,c._pf.score=i,(null==k||k>i)&&(k=i,l=c))}aS(h,l||c)}function bg(g){var f,j,i=g._i,h=ao.exec(i);if(h){for(g._pf.iso=!0,f=0,j=b0.length;j>f;f++){if(b0[f][1].exec(i)){g._f=b0[f][0]+(h[6]||" ");break}}for(f=0,j=bF.length;j>f;f++){if(bF[f][1].exec(i)){g._f+=bF[f][0];break}}i.match(bX)&&(g._f+="Z"),bk(g)}else{g._isValid=!1}}function bf(b){bg(b),b._isValid===!1&&(delete b._isValid,bT.createFromInputFallback(b))}function be(e){var g=e._i,f=bw.exec(g);g===a5?e._d=new Date:f?e._d=new Date(+f[1]):"string"==typeof g?bf(e):aL(g)?(e._a=g.slice(0),bp(e)):aK(g)?e._d=new Date(+g):"object"==typeof g?bo(e):"number"==typeof g?e._d=new Date(g):bT.createFromInputFallback(e)}function bd(j,i,p,o,n,m,l){var k=new Date(j,i,p,o,n,m,l);return 1970>j&&k.setFullYear(j),k}function ba(d){var c=new Date(Date.UTC.apply(null,arguments));return 1970>d&&c.setUTCFullYear(d),c}function bV(d,c){if("string"==typeof d){if(isNaN(d)){if(d=c.weekdaysParse(d),"number"!=typeof d){return null}}else{d=parseInt(d,10)}}return d}function a8(g,f,j,i,h){return h.relativeTime(f||1,!!j,g,i)}function bP(r,q,p){var o=b6(Math.abs(r)/1000),n=b6(o/60),m=b6(n/60),l=b6(m/24),k=b6(l/365),j=o<ag.s&&["s",o]||1===n&&["m"]||n<ag.m&&["mm",n]||1===m&&["h"]||m<ag.h&&["hh",m]||1===l&&["d"]||l<=ag.dd&&["dd",l]||l<=ag.dm&&["M"]||l<ag.dy&&["MM",b6(l/30)]||1===k&&["y"]||["yy",k];return j[2]=q,j[3]=r>0,j[4]=p,a8.apply({},j)}function bn(h,g,l){var k,j=l-g,i=l-h.day();return i>j&&(i-=7),j-7>i&&(i+=7),k=bT(h).add("d",i),{week:Math.ceil(k.dayOfYear()/7),year:k.year()}}function aM(j,i,p,o,n){var m,l,k=ba(j,0,1).getUTCDay();return k=0===k?7:k,p=null!=p?p:n,m=n-k+(k>o?7:0)-(n>k?7:0),l=7*(i-1)+(p-n)+m+1,{year:l>0?j:j-1,dayOfYear:l>0?l:aB(j-1)+l}}function aq(e){var g=e._i,f=e._f;return null===g||f===a5&&""===g?bT.invalid({nullInput:!0}):("string"==typeof g&&(e._i=g=bB().preparse(g)),bT.isMoment(g)?(e=aR(g),e._d=new Date(+g._d)):f?aL(f)?bh(e):bk(e):be(e),new aW(e))}function ah(f,e){var h,g;if(1===e.length&&aL(e[0])&&(e=e[0]),!e.length){return bT()}for(h=e[0],g=1;g<e.length;++g){e[g][f](h)&&(h=e[g])}return h}function b2(e,d){var f;return"string"==typeof d&&(d=e.lang().monthsParse(d),"number"!=typeof d)?e:(f=Math.min(e.date(),aD(e.year(),d)),e._d["set"+(e._isUTC?"UTC":"")+"Month"](d,f),e)}function bR(d,c){return d._d["get"+(d._isUTC?"UTC":"")+c]()}function bv(e,d,f){return"Month"===d?b2(e,f):e._d["set"+(e._isUTC?"UTC":"")+d](f)}function aT(d,c){return function(b){return null!=b?(bv(this,d,b),bT.updateOffset(this,c),this):bR(this,d)}}function ar(b){bT.duration.fn[b]=function(){return this._data[b]}}function ai(d,c){bT.duration.fn["as"+d]=function(){return +this/c}}function b4(b){"undefined"==typeof ender&&(bC=ak.moment,ak.moment=b?a2("Accessing Moment through the global scope is deprecated, and will be removed in an upcoming release.",bT):bT)}for(var bT,bC,a0,au="2.7.0",ak="undefined"!=typeof global?global:this,b6=Math.round,bW=0,bJ=1,a6=2,aw=3,am=4,aa=5,bY=6,bM={},b3={_isAMomentObject:null,_i:null,_f:null,_l:null,_strict:null,_tzm:null,_isUTC:null,_offset:null,_pf:null,_lang:null},bS="undefined"!=typeof module&&module.exports,bw=/^\/?Date\((\-?\d+)/i,aU=/(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,at=/^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/,aj=/(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Q|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|X|zz?|ZZ?|.)/g,b5=/(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g,bU=/\d\d?/,bD=/\d{1,3}/,a1=/\d{1,4}/,av=/[+\-]?\d{1,6}/,al=/\d+/,b7=/[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i,bX=/Z|[\+\-]\d\d:?\d\d/gi,bL=/T/i,a7=/[\+\-]?\d+(\.\d{1,3})?/,ax=/\d{1,2}/,an=/\d/,ad=/\d\d/,bZ=/\d{3}/,bN=/\d{4}/,a9=/[+-]?\d{6}/,az=/[+-]?\d+/,ao=/^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,ae="YYYY-MM-DDTHH:mm:ssZ",b0=[["YYYYYY-MM-DD",/[+-]\d{6}-\d{2}-\d{2}/],["YYYY-MM-DD",/\d{4}-\d{2}-\d{2}/],["GGGG-[W]WW-E",/\d{4}-W\d{2}-\d/],["GGGG-[W]WW",/\d{4}-W\d{2}/],["YYYY-DDD",/\d{4}-\d{3}/]],bF=[["HH:mm:ss.SSSS",/(T| )\d\d:\d\d:\d\d\.\d+/],["HH:mm:ss",/(T| )\d\d:\d\d:\d\d/],["HH:mm",/(T| )\d\d:\d\d/],["HH",/(T| )\d\d/]],af=/([\+\-]|\d\d)/gi,bO=("Date|Hours|Minutes|Seconds|Milliseconds".split("|"),{Milliseconds:1,Seconds:1000,Minutes:60000,Hours:3600000,Days:86400000,Months:2592000000,Years:31536000000}),bl={ms:"millisecond",s:"second",m:"minute",h:"hour",d:"day",D:"date",w:"week",W:"isoWeek",M:"month",Q:"quarter",y:"year",DDD:"dayOfYear",e:"weekday",E:"isoWeekday",gg:"weekYear",GG:"isoWeekYear"},aJ={dayofyear:"dayOfYear",isoweekday:"isoWeekday",isoweek:"isoWeek",weekyear:"weekYear",isoweekyear:"isoWeekYear"},ap={},ag={s:45,m:45,h:22,dd:25,dm:45,dy:345},b1="DDD w W M D d".split(" "),bQ="M D H h m s w W".split(" "),bs={M:function(){return this.month()+1},MMM:function(b){return this.lang().monthsShort(this,b)},MMMM:function(b){return this.lang().months(this,b)},D:function(){return this.date()},DDD:function(){return this.dayOfYear()},d:function(){return this.day()},dd:function(b){return this.lang().weekdaysMin(this,b)},ddd:function(b){return this.lang().weekdaysShort(this,b)},dddd:function(b){return this.lang().weekdays(this,b)},w:function(){return this.week()},W:function(){return this.isoWeek()},YY:function(){return aO(this.year()%100,2)},YYYY:function(){return aO(this.year(),4)},YYYYY:function(){return aO(this.year(),5)},YYYYYY:function(){var d=this.year(),c=d>=0?"+":"-";return c+aO(Math.abs(d),6)},gg:function(){return aO(this.weekYear()%100,2)},gggg:function(){return aO(this.weekYear(),4)},ggggg:function(){return aO(this.weekYear(),5)},GG:function(){return aO(this.isoWeekYear()%100,2)},GGGG:function(){return aO(this.isoWeekYear(),4)},GGGGG:function(){return aO(this.isoWeekYear(),5)},e:function(){return this.weekday()},E:function(){return this.isoWeekday()},a:function(){return this.lang().meridiem(this.hours(),this.minutes(),!0)},A:function(){return this.lang().meridiem(this.hours(),this.minutes(),!1)},H:function(){return this.hours()},h:function(){return this.hours()%12||12},m:function(){return this.minutes()},s:function(){return this.seconds()},S:function(){return aE(this.milliseconds()/100)},SS:function(){return aO(aE(this.milliseconds()/10),2)},SSS:function(){return aO(this.milliseconds(),3)},SSSS:function(){return aO(this.milliseconds(),3)},Z:function(){var d=-this.zone(),c="+";return 0>d&&(d=-d,c="-"),c+aO(aE(d/60),2)+":"+aO(aE(d)%60,2)},ZZ:function(){var d=-this.zone(),c="+";return 0>d&&(d=-d,c="-"),c+aO(aE(d/60),2)+aO(aE(d)%60,2)},z:function(){return this.zoneAbbr()},zz:function(){return this.zoneName()},X:function(){return this.unix()},Q:function(){return this.quarter()}},aQ=["months","monthsShort","weekdays","weekdaysShort","weekdaysMin"];b1.length;){a0=b1.pop(),bs[a0+"o"]=aY(bs[a0],a0)}for(;bQ.length;){a0=bQ.pop(),bs[a0+a0]=aZ(bs[a0],2)}for(bs.DDDD=aZ(bs.DDD,3),aS(aX.prototype,{set:function(e){var d,f;for(f in e){d=e[f],"function"==typeof d?this[f]=d:this["_"+f]=d}},_months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_"),months:function(b){return this._months[b.month()]},_monthsShort:"Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),monthsShort:function(b){return this._monthsShort[b.month()]},monthsParse:function(f){var e,h,g;for(this._monthsParse||(this._monthsParse=[]),e=0;12>e;e++){if(this._monthsParse[e]||(h=bT.utc([2000,e]),g="^"+this.months(h,"")+"|^"+this.monthsShort(h,""),this._monthsParse[e]=new RegExp(g.replace(".",""),"i")),this._monthsParse[e].test(f)){return e}}},_weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),weekdays:function(b){return this._weekdays[b.day()]},_weekdaysShort:"Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),weekdaysShort:function(b){return this._weekdaysShort[b.day()]},_weekdaysMin:"Su_Mo_Tu_We_Th_Fr_Sa".split("_"),weekdaysMin:function(b){return this._weekdaysMin[b.day()]},weekdaysParse:function(f){var e,h,g;for(this._weekdaysParse||(this._weekdaysParse=[]),e=0;7>e;e++){if(this._weekdaysParse[e]||(h=bT([2000,1]).day(e),g="^"+this.weekdays(h,"")+"|^"+this.weekdaysShort(h,"")+"|^"+this.weekdaysMin(h,""),this._weekdaysParse[e]=new RegExp(g.replace(".",""),"i")),this._weekdaysParse[e].test(f)){return e}}},_longDateFormat:{LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D YYYY",LLL:"MMMM D YYYY LT",LLLL:"dddd, MMMM D YYYY LT"},longDateFormat:function(d){var c=this._longDateFormat[d];return !c&&this._longDateFormat[d.toUpperCase()]&&(c=this._longDateFormat[d.toUpperCase()].replace(/MMMM|MM|DD|dddd/g,function(b){return b.slice(1)}),this._longDateFormat[d]=c),c},isPM:function(b){return"p"===(b+"").toLowerCase().charAt(0)},_meridiemParse:/[ap]\.?m?\.?/i,meridiem:function(e,d,f){return e>11?f?"pm":"PM":f?"am":"AM"},_calendar:{sameDay:"[Today at] LT",nextDay:"[Tomorrow at] LT",nextWeek:"dddd [at] LT",lastDay:"[Yesterday at] LT",lastWeek:"[Last] dddd [at] LT",sameElse:"L"},calendar:function(e,d){var f=this._calendar[e];return"function"==typeof f?f.apply(d):f},_relativeTime:{future:"in %s",past:"%s ago",s:"a few seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",M:"a month",MM:"%d months",y:"a year",yy:"%d years"},relativeTime:function(g,f,j,i){var h=this._relativeTime[j];return"function"==typeof h?h(g,f,j,i):h.replace(/%d/i,g)},pastFuture:function(e,d){var f=this._relativeTime[e>0?"future":"past"];return"function"==typeof f?f(d):f.replace(/%s/i,d)},ordinal:function(b){return this._ordinal.replace("%d",b)},_ordinal:"%d",preparse:function(b){return b},postformat:function(b){return b},week:function(b){return bn(b,this._week.dow,this._week.doy).week},_week:{dow:0,doy:6},_invalidDate:"Invalid date",invalidDate:function(){return this._invalidDate}}),bT=function(c,k,j,i){var h;return"boolean"==typeof j&&(i=j,j=a5),h={},h._isAMomentObject=!0,h._i=c,h._f=k,h._l=j,h._strict=i,h._isUTC=!1,h._pf=a3(),aq(h)},bT.suppressDeprecationWarnings=!1,bT.createFromInputFallback=a2("moment construction falls back to js Date. This is discouraged and will be removed in upcoming major release. Please refer to https://github.com/moment/moment/issues/1407 for more info.",function(b){b._d=new Date(b._i)}),bT.min=function(){var b=[].slice.call(arguments,0);return ah("isBefore",b)},bT.max=function(){var b=[].slice.call(arguments,0);return ah("isAfter",b)},bT.utc=function(c,k,j,i){var h;return"boolean"==typeof j&&(i=j,j=a5),h={},h._isAMomentObject=!0,h._useUTC=!0,h._isUTC=!0,h._l=j,h._i=c,h._f=k,h._strict=i,h._pf=a3(),aq(h).utc()},bT.unix=function(b){return bT(1000*b)},bT.duration=function(i,h){var n,m,l,k=i,j=null;return bT.isDuration(i)?k={ms:i._milliseconds,d:i._days,M:i._months}:"number"==typeof i?(k={},h?k[h]=i:k.milliseconds=i):(j=aU.exec(i))?(n="-"===j[1]?-1:1,k={y:0,d:aE(j[a6])*n,h:aE(j[aw])*n,m:aE(j[am])*n,s:aE(j[aa])*n,ms:aE(j[bY])*n}):(j=at.exec(i))&&(n="-"===j[1]?-1:1,l=function(d){var c=d&&parseFloat(d.replace(",","."));return(isNaN(c)?0:c)*n},k={y:l(j[2]),M:l(j[3]),d:l(j[4]),h:l(j[5]),m:l(j[6]),s:l(j[7]),w:l(j[8])}),m=new aV(k),bT.isDuration(i)&&i.hasOwnProperty("_lang")&&(m._lang=i._lang),m},bT.version=au,bT.defaultFormat=ae,bT.ISO_8601=function(){},bT.momentProperties=b3,bT.updateOffset=function(){},bT.relativeTimeThreshold=function(d,e){return ag[d]===a5?!1:(ag[d]=e,!0)},bT.lang=function(e,d){var f;return e?(d?bG(bI(e),d):null===d?(bE(e),e="en"):bM[e]||bB(e),f=bT.duration.fn._lang=bT.fn._lang=bB(e),f._abbr):bT.fn._lang._abbr},bT.langData=function(b){return b&&b._lang&&b._lang._abbr&&(b=b._lang._abbr),bB(b)},bT.isMoment=function(b){return b instanceof aW||null!=b&&b.hasOwnProperty("_isAMomentObject")},bT.isDuration=function(b){return b instanceof aV},a0=aQ.length-1;a0>=0;--a0){aF(aQ[a0])}bT.normalizeUnits=function(b){return aH(b)},bT.invalid=function(d){var c=bT.utc(0/0);return null!=d?aS(c._pf,d):c._pf.userInvalidated=!0,c},bT.parseZone=function(){return bT.apply(null,arguments).parseZone()},bT.parseTwoDigitYear=function(b){return aE(b)+(aE(b)>68?1900:2000)},aS(bT.fn=aW.prototype,{clone:function(){return bT(this)},valueOf:function(){return +this._d+60000*(this._offset||0)},unix:function(){return Math.floor(+this/1000)},toString:function(){return this.clone().lang("en").format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ")},toDate:function(){return this._offset?new Date(+this):this._d},toISOString:function(){var b=bT(this).utc();return 0<b.year()&&b.year()<=9999?by(b,"YYYY-MM-DD[T]HH:mm:ss.SSS[Z]"):by(b,"YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]")},toArray:function(){var b=this;return[b.year(),b.month(),b.date(),b.hours(),b.minutes(),b.seconds(),b.milliseconds()]},isValid:function(){return bK(this)},isDSTShifted:function(){return this._a?this.isValid()&&aI(this._a,(this._isUTC?bT.utc(this._a):bT(this._a)).toArray())>0:!1},parsingFlags:function(){return aS({},this._pf)},invalidAt:function(){return this._pf.overflow},utc:function(){return this.zone(0)},local:function(){return this.zone(0),this._isUTC=!1,this},format:function(d){var c=by(this,d||bT.defaultFormat);return this.lang().postformat(c)},add:function(e,d){var f;return f="string"==typeof e&&"string"==typeof d?bT.duration(isNaN(+d)?+e:+d,isNaN(+d)?d:e):"string"==typeof e?bT.duration(+d,e):bT.duration(e,d),aN(this,f,1),this},subtract:function(e,d){var f;return f="string"==typeof e&&"string"==typeof d?bT.duration(isNaN(+d)?+e:+d,isNaN(+d)?d:e):"string"==typeof e?bT.duration(+d,e):bT.duration(e,d),aN(this,f,-1),this},diff:function(i,h,n){var m,l,k=bH(i,this),j=60000*(this.zone()-k.zone());return h=aH(h),"year"===h||"month"===h?(m=43200000*(this.daysInMonth()+k.daysInMonth()),l=12*(this.year()-k.year())+(this.month()-k.month()),l+=(this-bT(this).startOf("month")-(k-bT(k).startOf("month")))/m,l-=60000*(this.zone()-bT(this).startOf("month").zone()-(k.zone()-bT(k).startOf("month").zone()))/m,"year"===h&&(l/=12)):(m=this-k,l="second"===h?m/1000:"minute"===h?m/60000:"hour"===h?m/3600000:"day"===h?(m-j)/86400000:"week"===h?(m-j)/604800000:m),n?l:aP(l)},from:function(d,c){return bT.duration(this.diff(d)).lang(this.lang()._abbr).humanize(!c)},fromNow:function(b){return this.from(bT(),b)},calendar:function(g){var f=g||bT(),j=bH(f,this).startOf("day"),i=this.diff(j,"days",!0),h=-6>i?"sameElse":-1>i?"lastWeek":0>i?"lastDay":1>i?"sameDay":2>i?"nextDay":7>i?"nextWeek":"sameElse";return this.format(this.lang().calendar(h,this))},isLeapYear:function(){return aA(this.year())},isDST:function(){return this.zone()<this.clone().month(0).zone()||this.zone()<this.clone().month(5).zone()},day:function(d){var c=this._isUTC?this._d.getUTCDay():this._d.getDay();return null!=d?(d=bV(d,this.lang()),this.add({d:d-c})):c},month:aT("Month",!0),startOf:function(b){switch(b=aH(b)){case"year":this.month(0);case"quarter":case"month":this.date(1);case"week":case"isoWeek":case"day":this.hours(0);case"hour":this.minutes(0);case"minute":this.seconds(0);case"second":this.milliseconds(0)}return"week"===b?this.weekday(0):"isoWeek"===b&&this.isoWeekday(1),"quarter"===b&&this.month(3*Math.floor(this.month()/3)),this},endOf:function(b){return b=aH(b),this.startOf(b).add("isoWeek"===b?"week":b,1).subtract("ms",1)},isAfter:function(d,c){return c="undefined"!=typeof c?c:"millisecond",+this.clone().startOf(c)>+bT(d).startOf(c)},isBefore:function(d,c){return c="undefined"!=typeof c?c:"millisecond",+this.clone().startOf(c)<+bT(d).startOf(c)},isSame:function(d,c){return c=c||"ms",+this.clone().startOf(c)===+bH(d,this).startOf(c)},min:a2("moment().min is deprecated, use moment.min instead. https://github.com/moment/moment/issues/1548",function(b){return b=bT.apply(null,arguments),this>b?this:b}),max:a2("moment().max is deprecated, use moment.max instead. https://github.com/moment/moment/issues/1548",function(b){return b=bT.apply(null,arguments),b>this?this:b}),zone:function(e,d){var f=this._offset||0;return null==e?this._isUTC?f:this._d.getTimezoneOffset():("string"==typeof e&&(e=bt(e)),Math.abs(e)<16&&(e=60*e),this._offset=e,this._isUTC=!0,f!==e&&(!d||this._changeInProgress?aN(this,bT.duration(f-e,"m"),1,!1):this._changeInProgress||(this._changeInProgress=!0,bT.updateOffset(this,!0),this._changeInProgress=null)),this)},zoneAbbr:function(){return this._isUTC?"UTC":""},zoneName:function(){return this._isUTC?"Coordinated Universal Time":""},parseZone:function(){return this._tzm?this.zone(this._tzm):"string"==typeof this._i&&this.zone(this._i),this},hasAlignedHourOffset:function(b){return b=b?bT(b).zone():0,(this.zone()-b)%60===0},daysInMonth:function(){return aD(this.year(),this.month())},dayOfYear:function(d){var c=b6((bT(this).startOf("day")-bT(this).startOf("year"))/86400000)+1;return null==d?c:this.add("d",d-c)},quarter:function(b){return null==b?Math.ceil((this.month()+1)/3):this.month(3*(b-1)+this.month()%3)},weekYear:function(d){var c=bn(this,this.lang()._week.dow,this.lang()._week.doy).year;return null==d?c:this.add("y",d-c)},isoWeekYear:function(d){var c=bn(this,1,4).year;return null==d?c:this.add("y",d-c)},week:function(d){var c=this.lang().week(this);return null==d?c:this.add("d",7*(d-c))},isoWeek:function(d){var c=bn(this,1,4).week;return null==d?c:this.add("d",7*(d-c))},weekday:function(d){var c=(this.day()+7-this.lang()._week.dow)%7;return null==d?c:this.add("d",d-c)},isoWeekday:function(b){return null==b?this.day()||7:this.day(this.day()%7?b:b-7)},isoWeeksInYear:function(){return aC(this.year(),1,4)},weeksInYear:function(){var b=this._lang._week;return aC(this.year(),b.dow,b.doy)},get:function(b){return b=aH(b),this[b]()},set:function(d,c){return d=aH(d),"function"==typeof this[d]&&this[d](c),this},lang:function(c){return c===a5?this._lang:(this._lang=bB(c),this)}}),bT.fn.millisecond=bT.fn.milliseconds=aT("Milliseconds",!1),bT.fn.second=bT.fn.seconds=aT("Seconds",!1),bT.fn.minute=bT.fn.minutes=aT("Minutes",!1),bT.fn.hour=bT.fn.hours=aT("Hours",!0),bT.fn.date=aT("Date",!0),bT.fn.dates=a2("dates accessor is deprecated. Use date instead.",aT("Date",!0)),bT.fn.year=aT("FullYear",!0),bT.fn.years=a2("years accessor is deprecated. Use year instead.",aT("FullYear",!0)),bT.fn.days=bT.fn.day,bT.fn.months=bT.fn.month,bT.fn.weeks=bT.fn.week,bT.fn.isoWeeks=bT.fn.isoWeek,bT.fn.quarters=bT.fn.quarter,bT.fn.toJSON=bT.fn.toISOString,aS(bT.duration.fn=aV.prototype,{_bubble:function(){var j,i,p,o,n=this._milliseconds,m=this._days,l=this._months,k=this._data;k.milliseconds=n%1000,j=aP(n/1000),k.seconds=j%60,i=aP(j/60),k.minutes=i%60,p=aP(i/60),k.hours=p%24,m+=aP(p/24),k.days=m%30,l+=aP(m/30),k.months=l%12,o=aP(l/12),k.years=o},weeks:function(){return aP(this.days()/7)},valueOf:function(){return this._milliseconds+86400000*this._days+this._months%12*2592000000+31536000000*aE(this._months/12)},humanize:function(e){var d=+this,f=bP(d,!e,this.lang());return e&&(f=this.lang().pastFuture(d,f)),this.lang().postformat(f)},add:function(e,d){var f=bT.duration(e,d);return this._milliseconds+=f._milliseconds,this._days+=f._days,this._months+=f._months,this._bubble(),this},subtract:function(e,d){var f=bT.duration(e,d);return this._milliseconds-=f._milliseconds,this._days-=f._days,this._months-=f._months,this._bubble(),this},get:function(b){return b=aH(b),this[b.toLowerCase()+"s"]()},as:function(b){return b=aH(b),this["as"+b.charAt(0).toUpperCase()+b.slice(1)+"s"]()},lang:bT.fn.lang,toIsoString:function(){var h=Math.abs(this.years()),g=Math.abs(this.months()),l=Math.abs(this.days()),k=Math.abs(this.hours()),j=Math.abs(this.minutes()),i=Math.abs(this.seconds()+this.milliseconds()/1000);return this.asSeconds()?(this.asSeconds()<0?"-":"")+"P"+(h?h+"Y":"")+(g?g+"M":"")+(l?l+"D":"")+(k||j||i?"T":"")+(k?k+"H":"")+(j?j+"M":"")+(i?i+"S":""):"P0D"}});for(a0 in bO){bO.hasOwnProperty(a0)&&(ai(a0,bO[a0]),ar(a0.toLowerCase()))}ai("Weeks",604800000),bT.duration.fn.asMonths=function(){return(+this-31536000000*this.years())/2592000000+12*this.years()},bT.lang("en",{ordinal:function(e){var d=e%10,f=1===aE(e%100/10)?"th":1===d?"st":2===d?"nd":3===d?"rd":"th";return e+f}}),bS?module.exports=bT:"function"==typeof define&&define.amd?(define("moment",function(e,d,f){return f.config&&f.config()&&f.config().noGlobal===!0&&(ak.moment=bC),bT}),b4(!0)):b4()}).call(this);var ns_=ns_||{};ns_.StreamSense=ns_.StreamSense||function(){function m(f,c){var i=new Image;i.src=f,c&&setTimeout(c,0)}function w(f,c,i){i&&setTimeout(i,0)}function g(C,i){var c=C||"",D=j,e="undefined",B=window.comScore||window.sitestat||function(G){var K="comScore=",I=document,N=I.cookie,H="",F="indexOf",U="substring",Q="length",M=2048,S,O="&ns_",J="&",R,E,L,P,o=window,T=o.encodeURIComponent||escape;if(N[F](K)+1){for(L=0,E=N.split(";"),P=E[Q];L<P;L++){R=E[L][F](K),R+1&&(H=J+unescape(E[L][U](R+K[Q])))}}G+=O+"_t="+(new Date)+O+"c="+(I.characterSet||I.defaultCharset||"")+"&c8="+T(I.title)+H+"&c7="+T(I.URL)+"&c9="+T(I.referrer),G[Q]>M&&G[F](J)>0&&(S=G[U](0,M-8).lastIndexOf(J),G=(G[U](0,S)+O+"cut="+T(G[U](S+1)))[U](0,M)),m(G),typeof ns_p===e&&(ns_p={src:G}),ns_p.lastMeasurement=G};if(typeof i!==e){var A=[],z=window.encodeURIComponent||escape;for(var y in i){i.hasOwnProperty(y)&&A.push(z(y)+"="+z(i[y]))}c+="&"+A.join("&")}return B(c)}function b(P,D){var I,F=2048,L=document,E=window,H=E.encodeURIComponent||escape,C=[],O=q.LABELS_ORDER,K=P.split("?"),R=K[0],M=K[1],G=M.split("&");for(var Q=0,B=G.length;Q<B;Q++){var J=G[Q].split("="),N=unescape(J[0]),z=unescape(J[1]);D[N]=z}var S={};for(var Q=0,B=O.length;Q<B;Q++){var A=O[Q];D.hasOwnProperty(A)&&(S[A]=!0,C.push(H(A)+"="+H(D[A])))}for(var A in D){if(S[A]){continue}D.hasOwnProperty(A)&&C.push(H(A)+"="+H(D[A]))}return I=R+"?"+C.join("&"),I=I+(I.indexOf("&c8=")<0?"&c8="+H(L.title):"")+(I.indexOf("&c7=")<0?"&c7="+H(L.URL):"")+(I.indexOf("&c9=")<0?"&c9="+H(L.referrer):""),I.length>F&&I.indexOf("&")>0&&(last=I.substr(0,F-8).lastIndexOf("&"),I=(I.substring(0,last)+"&ns_cut="+H(I.substring(last+1))).substr(0,F)),I}var j=function(){var c={uid:function(){var f=1;return function(){return +(new Date)+"_"+f++}}(),filter:function(l,f){var o={};for(var i in f){f.hasOwnProperty(i)&&l(f[i])&&(o[i]=f[i])}return o},extend:function(s){var l=arguments.length,u;s=s||{};for(var o=1;o<l;o++){u=arguments[o];if(!u){continue}for(var f in u){u.hasOwnProperty(f)&&(s[f]=u[f])}}return s},getLong:function(i,f){var l=Number(i);return i==null||isNaN(l)?f||0:l},getInteger:function(i,f){var l=Number(i);return i==null||isNaN(l)?f||0:l},getBoolean:function(i,f){var l=String(i).toLowerCase()=="true";return i==null?f||!1:l},isNotEmpty:function(f){return f!=null&&f.length>0},regionMatches:function(z,l,B,y,f){if(l<0||y<0||l+f>z.length||y+f>B.length){return !1}while(--f>=0){var u=z.charAt(l++),A=B.charAt(y++);if(u!=A){return !1}}return !0}};return c.filterMap=function(i,f){for(var l in i){f.indexOf(l)==-1&&delete i[l]}},c}(),x=function(){var c=["play","pause","end","buffer","keep-alive","hb","custom","ad_play","ad_pause","ad_end","ad_click"];return{PLAY:0,PAUSE:1,END:2,BUFFER:3,KEEP_ALIVE:4,HEART_BEAT:5,CUSTOM:6,AD_PLAY:7,AD_PAUSE:8,AD_END:9,AD_CLICK:10,toString:function(e){return c[e]}}}(),d=function(){var c=[x.END,x.PLAY,x.PAUSE,x.BUFFER];return{IDLE:0,PLAYING:1,PAUSED:2,BUFFERING:3,toEventType:function(e){return c[e]}}}(),v={ADPLAY:x.AD_PLAY,ADPAUSE:x.AD_PAUSE,ADEND:x.AD_END,ADCLICK:x.AD_CLICK},q={STREAMSENSE_VERSION:"4.1309.13",STREAMSENSEMEDIAPLAYER_VERSION:"4.1309.13",STREAMSENSEVIDEOVIEW_VERSION:"4.1309.13",DEFAULT_HEARTBEAT_INTERVAL:[{playingtime:60000,interval:10000},{playingtime:null,interval:60000}],KEEP_ALIVE_PERIOD:1200000,PAUSED_ON_BUFFERING_PERIOD:500,PAUSE_PLAY_SWITCH_DELAY:500,DEFAULT_PLAYERNAME:"streamsense",C1_VALUE:"19",C10_VALUE:"js",NS_AP_C12M_VALUE:"1",NS_NC_VALUE:"1",PAGE_NAME_LABEL:"name",LABELS_ORDER:["c1","c2","ns_site","ns_vsite","ns_ap_an","ns_ap_pn","ns_ap_pv","c12","name","ns_ak","ns_ap_ec","ns_ap_ev","ns_ap_device","ns_ap_id","ns_ap_csf","ns_ap_bi","ns_ap_pfm","ns_ap_pfv","ns_ap_ver","ns_ap_sv","ns_type","ns_radio","ns_nc","ns_ap_ui","ns_ap_gs","ns_st_sv","ns_st_pv","ns_st_it","ns_st_id","ns_st_ec","ns_st_sp","ns_st_sq","ns_st_cn","ns_st_ev","ns_st_po","ns_st_cl","ns_st_el","ns_st_pb","ns_st_hc","ns_st_mp","ns_st_mv","ns_st_pn","ns_st_tp","ns_st_pt","ns_st_pa","ns_st_ad","ns_st_li","ns_st_ci","ns_ap_jb","ns_ap_res","ns_ap_c12m","ns_ap_install","ns_ap_updated","ns_ap_lastrun","ns_ap_cs","ns_ap_runs","ns_ap_usage","ns_ap_fg","ns_ap_ft","ns_ap_dft","ns_ap_bt","ns_ap_dbt","ns_ap_dit","ns_ap_as","ns_ap_das","ns_ap_it","ns_ap_uc","ns_ap_aus","ns_ap_daus","ns_ap_us","ns_ap_dus","ns_ap_ut","ns_ap_oc","ns_ap_uxc","ns_ap_uxs","ns_ap_lang","ns_ap_miss","ns_ts","ns_st_ca","ns_st_cp","ns_st_er","ns_st_pe","ns_st_ui","ns_st_bc","ns_st_bt","ns_st_bp","ns_st_pc","ns_st_pp","ns_st_br","ns_st_ub","ns_st_vo","ns_st_ws","ns_st_pl","ns_st_pr","ns_st_ep","ns_st_ty","ns_st_cs","ns_st_ge","ns_st_st","ns_st_dt","ns_st_ct","ns_st_de","ns_st_pu","ns_st_cu","ns_st_fee","c7","c8","c9"]},k=function(){var c=function(){function y(l,f){var r=f[l];r!=null&&(B[l]=r)}var A=this,E=0,o=0,i=0,D=0,C=0,z=0,s,B;j.extend(this,{reset:function(e){e!=null&&e.length>0?j.filterMap(B,e):B={},B.ns_st_cl="0",B.ns_st_pn="1",B.ns_st_tp="1",A.setClipId("1"),A.setPauses(0),A.setStarts(0),A.setBufferingTime(0),A.setBufferingTimestamp(-1),A.setPlaybackTime(0),A.setPlaybackTimestamp(-1)},setLabels:function(e,f){e!=null&&j.extend(B,e),A.setRegisters(B,f)},getLabels:function(){return B},setLabel:function(e,l){var f={};f[e]=l,A.setLabels(f,null)},getLabel:function(f){return B[f]},getClipId:function(){return s},setClipId:function(f){s=f},setRegisters:function(n,f){var l=n.ns_st_cn;l!=null&&(s=l,delete n.ns_st_cn),l=n.ns_st_bt,l!=null&&(i=Number(l),delete n.ns_st_bt),y("ns_st_cl",n),y("ns_st_pn",n),y("ns_st_tp",n),y("ns_st_ub",n),y("ns_st_br",n);if(f==d.PLAYING||f==null){l=n.ns_st_sq,l!=null&&(o=Number(l),delete n.ns_st_sq)}f!=d.BUFFERING&&(l=n.ns_st_pt,l!=null&&(C=Number(l),delete n.ns_st_pt));if(f==d.PAUSED||f==d.IDLE||f==null){l=n.ns_st_pc,l!=null&&(E=Number(l),delete n.ns_st_pc)}},createLabels:function(f,l){var e=l||{};e.ns_st_cn=A.getClipId(),e.ns_st_bt=String(A.getBufferingTime());if(f==x.PLAY||f==null){e.ns_st_sq=String(o)}if(f==x.PAUSE||f==x.END||f==x.KEEP_ALIVE||f==x.HEART_BEAT||f==null){e.ns_st_pt=String(A.getPlaybackTime()),e.ns_st_pc=String(E)}return j.extend(e,A.getLabels()),e},incrementPauses:function(){E++},incrementStarts:function(){o++},getBufferingTime:function(){var f=i;return D>=0&&(f+=+(new Date)-D),f},setBufferingTime:function(f){i=f},getPlaybackTime:function(){var f=C;return z>=0&&(f+=+(new Date)-z),f},setPlaybackTime:function(f){C=f},getPlaybackTimestamp:function(){return z},setPlaybackTimestamp:function(f){z=f},getBufferingTimestamp:function(){return D},setBufferingTimestamp:function(f){D=f},getPauses:function(){return E},setPauses:function(f){E=f},getStarts:function(){return o},setStarts:function(f){o=f}}),B={},A.reset()};return c}(),h=function(){var c=function(){var z=this,E=null,o,f=0,D=0,C=0,s=0,B=0,y,i=0,A=!1;j.extend(this,{reset:function(e){e!=null&&e.length>0?j.filterMap(y,e):y={},z.setPlaylistId(+(new Date)+"_"+i),z.setBufferingTime(0),z.setPlaybackTime(0),z.setPauses(0),z.setStarts(0),z.setRebufferCount(0),A=!1},setLabels:function(e,l){e!=null&&j.extend(y,e),z.setRegisters(y,l)},getLabels:function(){return y},setLabel:function(e,u){var l={};l[e]=u,z.setLabels(l,null)},getLabel:function(l){return y[l]},getClip:function(){return E},getPlaylistId:function(){return o},setPlaylistId:function(l){o=l},setRegisters:function(r,n){var l=r.ns_st_sp;l!=null&&(f=Number(l),delete r.ns_st_sp),l=r.ns_st_bc,l!=null&&(C=Number(l),delete r.ns_st_bc),l=r.ns_st_bp,l!=null&&(s=Number(l),delete r.ns_st_bp),l=r.ns_st_id,l!=null&&(o=l,delete r.ns_st_id),n!=d.BUFFERING&&(l=r.ns_st_pa,l!=null&&(B=Number(l),delete r.ns_st_pa));if(n==d.PAUSED||n==d.IDLE||n==null){l=r.ns_st_pp,l!=null&&(D=Number(l),delete r.ns_st_pp)}},createLabels:function(e,n){var l=n||{};l.ns_st_bp=String(z.getBufferingTime()),l.ns_st_sp=String(f),l.ns_st_id=String(o),C>0&&(l.ns_st_bc=String(C));if(e==x.PAUSE||e==x.END||e==x.KEEP_ALIVE||e==x.HEART_BEAT||e==null){l.ns_st_pa=String(z.getPlaybackTime()),l.ns_st_pp=String(D)}if(e==x.PLAY||e==null){z.didFirstPlayOccurred()||(l.ns_st_pb="1",z.setFirstPlayOccurred(!0))}return j.extend(l,z.getLabels()),l},incrementStarts:function(){f++},incrementPauses:function(){D++,E.incrementPauses()},setPlaylistCounter:function(l){i=l},incrementPlaylistCounter:function(){i++},addPlaybackTime:function(l){if(E.getPlaybackTimestamp()>=0){var e=l-E.getPlaybackTimestamp();E.setPlaybackTimestamp(-1),E.setPlaybackTime(E.getPlaybackTime()+e),z.setPlaybackTime(z.getPlaybackTime()+e)}},addBufferingTime:function(l){if(E.getBufferingTimestamp()>=0){var e=l-E.getBufferingTimestamp();E.setBufferingTimestamp(-1),E.setBufferingTime(E.getBufferingTime()+e),z.setBufferingTime(z.getBufferingTime()+e)}},getBufferingTime:function(){var l=s;return E.getBufferingTimestamp()>=0&&(l+=+(new Date)-E.getBufferingTimestamp()),l},setBufferingTime:function(l){s=l},getPlaybackTime:function(){var l=B;return E.getPlaybackTimestamp()>=0&&(l+=+(new Date)-E.getPlaybackTimestamp()),l},setPlaybackTime:function(l){B=l},getStarts:function(){return f},setStarts:function(l){f=l},getPauses:function(){return D},setPauses:function(l){D=l},getRebufferCount:function(){return C},incrementRebufferCount:function(){C++},setRebufferCount:function(l){C=l},didFirstPlayOccurred:function(){return A},setFirstPlayOccurred:function(l){A=l}}),E=new k,y={},z.reset()};return c}(),p=function(){var c=function(aO,aN){function ay(f){ah=f}function aW(z){var u=0;if(ah!=null){for(var A=0;A<ah.length;A++){var y=ah[A],f=y.playingtime;if(!f||z<f){u=y.interval;break}}}return u}function ar(){r();var u=aW(aY.getClip().getPlaybackTime());if(u>0){var f=ax>0?ax:u;s=setTimeout(ac,f)}ax=0}function an(){r();var f=aW(aY.getClip().getPlaybackTime());ax=f-aY.getClip().getPlaybackTime()%f,s!=null&&r()}function aP(){ax=0,aj=0,aU=0}function ac(){aU++;var f=aA(x.HEART_BEAT,null);aR(f),ax=0,ar()}function r(){s!=null&&(clearTimeout(s),s=null)}function aI(){l(),aa=setTimeout(n,q.KEEP_ALIVE_PERIOD)}function n(){var f=aA(x.KEEP_ALIVE,null);aR(f),aT++,aI()}function l(){aa!=null&&(clearTimeout(aa),aa=null)}function o(){al(),aZ.isPauseOnBufferingEnabled()&&ap(d.PAUSED)&&(aL=setTimeout(aH,q.PAUSED_ON_BUFFERING_PERIOD))}function aH(){if(ag==d.PLAYING){aY.incrementRebufferCount(),aY.incrementPauses();var f=aA(x.PAUSE,null);aR(f),aT++,ag=d.PAUSED}}function al(){aL!=null&&(clearTimeout(aL),aL=null)}function ak(){aK!=null&&(clearTimeout(aK),aK=null)}function ae(f){return f==d.PLAYING||f==d.PAUSED}function aq(f){return f==x.PLAY?d.PLAYING:f==x.PAUSE?d.PAUSED:f==x.BUFFER?d.BUFFERING:f==x.END?d.IDLE:null}function i(C,G,z){ak();if(ab(C)){if(z){setTimeout(function(){i(C,G)},z)}else{var y=aD(),H=aQ,F=aG(G),E=H>=0?F-H:0;aF(aD(),G),aC(C,G),aB(C);for(var B=0,A=af.length;B<A;B++){af[B](y,C,G,E)}e(G),aY.setRegisters(G,C),aY.getClip().setRegisters(G,C);var D=aA(d.toEventType(C),G);j.extend(D,G),ap(aM)&&(aR(D),ag=aM,aT++)}}}function e(u){var f=u.ns_st_mp;f!=null&&(ai=f,delete u.ns_st_mp),f=u.ns_st_mv,f!=null&&(a4=f,delete u.ns_st_mv),f=u.ns_st_ec,f!=null&&(aT=Number(f),delete u.ns_st_ec)}function aR(z,C){C===undefined&&(C=!0),C&&aV(z);var y=aZ.getPixelURL();if(aJ){if(!a0()){var A=ao.am,B=ao.et,f=A.newApplicationMeasurement(aJ,B.HIDDEN,z,y);aJ.getQueue().offer(f)}}else{y&&m(b(y,z))}}function a0(){var u=aJ.getAppContext(),f=aJ.getSalt(),y=aJ.getPixelURL();return u==null||f==null||f.length==0||y==null||y.length==0}function aV(f){aw=aA(null),j.extend(aw,f)}function aF(u,f){var y=aG(f);u==d.PLAYING?(aY.addPlaybackTime(y),an(),l()):u==d.BUFFERING&&(aY.addBufferingTime(y),al())}function aC(y,f){var z=aG(f),u=aE(f);a1=u,y==d.PLAYING?(ar(),aI(),aY.getClip().setPlaybackTimestamp(z),ap(y)&&(aY.getClip().incrementStarts(),aY.getStarts()<1&&aY.setStarts(1))):y==d.PAUSED?ap(y)&&aY.incrementPauses():y==d.BUFFERING?(aY.getClip().setBufferingTimestamp(z),au&&o()):y==d.IDLE&&aP()}function ap(f){return f!=d.PAUSED||ag!=d.IDLE&&ag!=null?f!=d.BUFFERING&&ag!=f:!1}function aE(u){var f=-1;return u.hasOwnProperty("ns_st_po")&&(f=Number(u.ns_st_po)),f}function aG(u){var f=-1;return u.hasOwnProperty("ns_ts")&&(f=Number(u.ns_ts)),f}function ab(f){return f!=null&&aD()!=f}function aB(f){aM=f,aQ=+(new Date)}function aD(){return aM}function aA(){var u,f;arguments.length==1?(u=d.toEventType(aM),f=arguments[0]):(u=arguments[0],f=arguments[1]);var y={};return f!=null&&j.extend(y,f),y.hasOwnProperty("ns_ts")||(y.ns_ts=String(+(new Date))),u!=null&&!y.hasOwnProperty("ns_st_ev")&&(y.ns_st_ev=x.toString(u)),aZ.isPersistentLabelsShared()&&aJ&&j.extend(y,aJ.getLabels()),j.extend(y,aZ.getLabels()),aS(u,y),aY.createLabels(u,y),aY.getClip().createLabels(u,y),y.hasOwnProperty("ns_st_mp")||(y.ns_st_mp=ai),y.hasOwnProperty("ns_st_mv")||(y.ns_st_mv=a4),y.hasOwnProperty("ns_st_ub")||(y.ns_st_ub="0"),y.hasOwnProperty("ns_st_br")||(y.ns_st_br="0"),y.hasOwnProperty("ns_st_pn")||(y.ns_st_pn="1"),y.hasOwnProperty("ns_st_tp")||(y.ns_st_tp="1"),y.hasOwnProperty("ns_st_it")||(y.ns_st_it="c"),y.ns_st_sv=q.STREAMSENSE_VERSION,y.ns_type="hidden",y}function aS(z,u){var A=u||{};A.ns_st_ec=String(aT);if(!A.hasOwnProperty("ns_st_po")){var y=a1,f=aG(A);if(z==x.PLAY||z==x.KEEP_ALIVE||z==x.HEART_BEAT||z==null&&aM==d.PLAYING){y+=f-aY.getClip().getPlaybackTimestamp()}A.ns_st_po=String(y)}return z==x.HEART_BEAT&&(A.ns_st_hc=String(aU)),A}function am(u){var f=aG(u);f<0&&(u.ns_ts=String(+(new Date)))}function ad(u,f,y){f=f||{},f.ns_st_ad=1,u>=x.AD_PLAY&&u<=x.AD_CLICK&&aZ.notify(u,f,y)}function av(u,f){aZ.notify(x.CUSTOM,u,f)}var aZ=this,a2,aX=null,aQ=0,a1=0,aM,aT=0,aY=null,aJ,a3=!0,aL,au=!0,aa,aK,s,ah=q.DEFAULT_HEARTBEAT_INTERVAL,ax=0,aU=0,aj=0,az=!1,ag,ai,a4,aw,af,ao={};j.extend(this,{reset:function(f){aY.reset(f),aY.setPlaylistCounter(0),aY.setPlaylistId(+(new Date)+"_1"),aY.getClip().reset(f),f!=null&&!f.isEmpty()?j.filterMap(a2,f):a2={},aT=1,aU=0,an(),aP(),l(),al(),ak(),aM=d.IDLE,aQ=-1,ag=null,ai=q.DEFAULT_PLAYERNAME,a4=q.STREAMSENSE_VERSION,aw=null},notify:function(){var A,y,C,z;y=arguments[0],arguments.length==3?(C=arguments[1],z=arguments[2]):(C={},z=arguments[1]),A=aq(y);var B=j.extend({},C);am(B),B.hasOwnProperty("ns_st_po")||(B.ns_st_po=String(z));if(y==x.PLAY||y==x.PAUSE||y==x.BUFFER||y==x.END){aZ.isPausePlaySwitchDelayEnabled()&&ab(A)&&ae(aM)&&ae(A)?i(A,B,q.PAUSE_PLAY_SWITCH_DELAY):i(A,B)}else{var f=aA(y,B);j.extend(f,B),aR(f,!1),aT++}},getLabels:function(){return a2},setLabels:function(f){f!=null&&(a2==null?a2=f:j.extend(a2,f))},getLabel:function(f){return a2[f]},setLabel:function(u,f){f==null?delete a2[u]:a2[u]=f},setPixelURL:function(A){if(A==null||A.length==0){return null}var u=A.indexOf("?");if(u>=0){if(u<A.length-1){var C=A.substring(u+1).split("&");for(var z=0,f=C.length;z<f;z++){var y=C[z],B=y.split("=");B.length==2?aZ.setLabel(B[0],B[1]):B.length==1&&aZ.setLabel(q.PAGE_NAME_LABEL,B[0])}A=A.substring(0,u+1)}}else{A+="?"}return aX=A,aX},getPixelURL:function(){return aX?aX:typeof ns_p!="undefined"&&typeof ns_p.src=="string"?aX=ns_p.src.replace(/&amp;/,"&").replace(/&ns__t=\d+/,""):typeof ns_pixelUrl=="string"?aX.replace(/&amp;/,"&").replace(/&ns__t=\d+/,""):null},isPersistentLabelsShared:function(){return a3},setPersistentLabelsShared:function(f){a3=f},isPauseOnBufferingEnabled:function(){return au},setPauseOnBufferingEnabled:function(f){au=f},isPausePlaySwitchDelayEnabled:function(){return az},setPausePlaySwitchDelayEnabled:function(f){az=f},setClip:function(u,f){aM==d.IDLE&&(aY.getClip().reset(),aY.getClip().setLabels(u,null),f&&aY.incrementStarts())},setPlaylist:function(f){aM==d.IDLE&&(aY.incrementPlaylistCounter(),aY.reset(),aY.getClip().reset(),aY.setLabels(f,null))},importState:function(u){reset();var f=j.extend({},u);aY.setRegisters(f,null),aY.getClip().setRegisters(f,null),e(f),aT++},exportState:function(){return aw},getVersion:function(){return q.STREAMSENSE_VERSION},addListener:function(f){af.push(f)},removeListener:function(f){af.splice(af.indexOf(f),1)},getClip:function(){return aY.getClip()},getPlaylist:function(){return aY}}),j.extend(this,{adNotify:ad,customNotify:av,viewNotify:function(u,f){u=u||aZ.getPixelURL(),u&&g(u,f)}}),ns_.comScore&&(ao=ns_.comScore.exports,aJ=ao.c()),a2={},aT=1,aM=d.IDLE,aY=new h,aL=null,au=!0,s=null,aU=0,aP(),aa=null,aK=null,az=!1,ag=null,a1=0,af=[],aZ.reset(),aO&&aZ.setLabels(aO),aN&&aZ.setPixelURL(aN)};return function(U){function I(f,l){return G[J]||F(f,l)}function L(){J=-1;for(var f=0;f<=M;f++){if(G.hasOwnProperty(f)){J=f;break}}return ns_.StreamSense.activeIndex=J,J}function F(l,f){return l=l||null,f=f||null,l&&typeof l=="object"&&(f=l,l=null),G[++M]=new ns_.StreamSense(f,l),L(),G[M]}function Y(){var l=!1,o=J;if(typeof arguments[0]=="number"&&isFinite(arguments[0])){o=arguments[0]}else{if(arguments[0] instanceof ns_.StreamSense){for(var f in G){if(G[f]===arguments[0]){o=f;break}}}}return G.hasOwnProperty(o)&&(l=G[o],delete G[o],l.reset(),L()),l}function R(f){return f=f||{},I().setPlaylist(f),I().getPlaylist()}function O(l,f,o){return l=l||{},typeof f=="number"&&(l.ns_st_cn=f),I().setClip(l,o),I().getClip()}function W(l,f,o){return typeof l=="undefined"?!1:(o=o||null,f=f||{},I().notify(l,f,o))}function P(f){typeof f!="undefined"&&I().setLabels(f)}function K(){return I().getLabels()}function V(f){typeof f!="undefined"&&I().getPlaylist().setLabels(f)}function D(){return I().getPlaylist().getLabels()}function N(f){typeof f!="undefined"&&I().getClip().setLabels(f)}function Q(){return I().getClip().getLabels()}function A(f){return I().reset(f||{})}function X(f){return I().getPlaylist().reset(f||{})}function C(f){return I().getClip().reset(f||{})}function H(f){return f=f||{},I().viewNotify(null,f)}function z(l,f){return arguments.length>2&&(l=arguments[1],f=arguments[2]),l=l||{},typeof f=="number"&&(l.ns_st_po=f),I().customNotify(l,f)}function B(){return I().exportState()}function i(f){I().importState(f)}var G={},M=-1,J=-1;j.extend(U,{activeIndex:J,newInstance:F,"new":F,destroyInstance:Y,destroy:Y,newPlaylist:R,newClip:O,notify:W,setLabels:P,getLabels:K,setPlaylistLabels:V,getPlaylistLabels:D,setClipLabels:N,getClipLabels:Q,resetInstance:A,resetPlaylist:X,resetClip:C,viewEvent:H,customEvent:z,exportState:B,importState:i})}(c),c}();return p.AdEvents=v,p.PlayerEvents=x,p}();function CMGcomScore(c,b){var d={experience_id:c,player:null,ss:null,mod_vp:null,mod_exp:null,mod_con:null,mod_ad:null,current_media:null,current_ad:null,ad_start_time:null,ss_is_clip_initialized:false,ss_clip_end_reached:false,ss_is_clip_playing:false,ss_clip_position:0,ss_clip:null,bc_content_id:b,clips_played:[],on_template_loaded:function(e){d.player=brightcove.api.getExperience(e);d.mod_vp=d.player.getModule(brightcove.api.modules.APIModules.VIDEO_PLAYER);d.mod_exp=d.player.getModule(brightcove.api.modules.APIModules.EXPERIENCE);d.mod_con=d.player.getModule(brightcove.api.modules.APIModules.CONTENT);d.mod_ad=d.player.getModule(brightcove.api.modules.APIModules.ADVERTISING)},on_template_ready:function(e){d.mod_vp.addEventListener(brightcove.api.events.MediaEvent.ERROR,d.onMediaEventFired);d.mod_vp.addEventListener(brightcove.api.events.MediaEvent.PLAY,d.event_play);d.mod_vp.addEventListener(brightcove.api.events.MediaEvent.PROGRESS,d.event_progress);d.mod_vp.addEventListener(brightcove.api.events.MediaEvent.STOP,d.event_stop);d.mod_vp.addEventListener(brightcove.api.events.MediaEvent.CHANGE,d.event_change);if(d.player.type==brightcove.playerType.HTML){d.mod_vp.addEventListener(brightcove.api.events.MediaEvent.SEEK_NOTIFY,d.event_seek_notify)}d.mod_ad.addEventListener(brightcove.api.events.AdEvent.START,d.event_ad_start);d.mod_ad.addEventListener(brightcove.api.events.AdEvent.COMPLETE,d.event_ad_complete);d.ss_init()},ss_init:function(){d.ss=new ns_.StreamSense({},"http://b.scorecardresearch.com/p?c1=2&c2=6035944");d.ss_reset_playlist()},ss_reset_playlist:function(){d.ss.setPlaylist();d.clips_played=[]},bc_media_event:function(e){d.current_ad=null;d.current_media=e.media},ss_notify:function(f,e){d.ss_current_clip();if(e!=null){d.ss.notify(f,{},e);d.ss_clip_position=e}else{d.mod_vp.getVideoPosition(false,function(g){var h=parseInt(1000*g);d.ss.notify(f,{},h);d.ss_clip_position=h})}},track_current_video_played:function(e){var g=e.media.id.toString();for(var f=0;f<d.clips_played.length;f++){if(d.clips_played[f]==g){return}}d.clips_played.push(g)},current_clip_num:function(){if(d.current_media!=null){var f=d.current_media.id.toString();for(var e=0;e<d.clips_played.length;e++){if(d.clips_played[e]==f){return e+1}}}return d.clips_played.length},event_play:function(e){d.track_current_video_played(e);var f=d.current_ad!=null&&d.ss_is_clip_initialized;d.bc_media_event(e);if(f){var g=(new Date).getTime()-d.ad_start_time;d.ss_notify(ns_.StreamSense.PlayerEvents.END,g);d.ss_is_clip_initialized=false;d.ss_notify(ns_.StreamSense.PlayerEvents.PLAY,0)}else{d.ss_notify(ns_.StreamSense.PlayerEvents.PLAY)}d.ss_is_clip_playing=true},event_stop:function(e){if(!d.ss_is_clip_playing){return}d.bc_media_event(e);d.ss_notify(ns_.StreamSense.PlayerEvents.PAUSE);d.ss_is_clip_playing=false},event_complete:function(e){d.bc_media_event(e);d.ss_notify(ns_.StreamSense.PlayerEvents.END);d.ss_is_clip_initialized=false},event_seek_notify:function(e){if(d.ss_is_clip_playing){d.bc_media_event(e);d.ss_notify(ns_.StreamSense.PlayerEvents.PAUSE,d.ss_clip_position);d.ss_notify(ns_.StreamSense.PlayerEvents.PLAY)}},bc_ad_event:function(e){d.current_ad=e;d.current_media=null},event_ad_start:function(e){d.ss_reset_playlist();d.clips_played.push("ad clip");d.ss_clip_end_reached=false;d.bc_ad_event(e);d.ss_notify(ns_.StreamSense.PlayerEvents.PLAY);d.ad_start_time=(new Date).getTime()},event_ad_complete:function(e){if(d.current_media!=null){return}d.bc_ad_event(e);var f=(new Date).getTime()-d.ad_start_time;d.ss_notify(ns_.StreamSense.PlayerEvents.END,f);d.ss_is_clip_initialized=false},event_progress:function(e){d.ss_clip_position=parseInt(e.position*1000);if(d.ss_clip.ns_st_cl-d.ss_clip_position<1000&&!d.ss_clip_end_reached){d.ss_notify(ns_.StreamSense.PlayerEvents.END);d.ss_is_clip_initialized=false;d.ss_is_clip_playing=false;d.ss_clip_end_reached=true}},event_change:function(e){if(d.ss_is_clip_initialized){if(d.current_ad!=null){d.bc_ad_event(e);var f=(new Date).getTime()-d.ad_start_time;d.ss_notify(ns_.StreamSense.PlayerEvents.END,f)}else{if(d.current_media!=null){d.bc_media_event(e);d.ss_notify(ns_.StreamSense.PlayerEvents.END)}}d.ss_is_clip_initialized=false;d.ss_clip_end_reached=true;d.ss_is_clip_playing=false}},site_name:function(g){var f;if("undefined"===typeof g){f=window.document.location.href}else{f=g}var e=document.createElement("a");e.href=f;var i=e.hostname.split(".");var j=i.length;if(j>2){i=[i[j-2],i[j-1]]}return i.join(".").toLowerCase()},ss_default_clip:function(){return{ns_st_cn:d.current_clip_num(),ns_st_ci:d.bc_content_id,ns_st_pn:1,ns_st_tp:0,ns_st_cl:0,ns_st_pu:d.site_name(),ns_st_pr:"",ns_st_ep:"",ns_st_cu:"none",ns_st_ad:0,ns_st_ct:"vc11",ns_st_de:d.site_name(),c3:"cmg",c4:d.c4_value(),c6:d.site_name()}},ss_current_clip:function(){if(d.ss_is_clip_initialized){return}d.ss_clip=d.ss_default_clip();if(d.current_media!=null){d.ss_clip.ns_st_ci=d.current_media.id.toString();d.ss_clip.ns_st_ad=0;d.ss_clip.ns_st_cl=d.current_media.length;d.ss_clip.ns_st_ct="vc11"}else{if(d.current_ad!=null){d.ss_clip.ns_st_ad=1;d.ss_clip.ns_st_ct="va11"}}d.ss.setClip(d.ss_clip);d.ss_is_clip_initialized=true;d.ss_clip_end_reached=false},c4_value:function(){if(typeof cmg==="undefined"||typeof cmg.site_meta==="undefined"){return"unknown"}return cmg.site_meta.media_type}};this.o=d}(function(b,g){if(!g){return console.log("janus-auth.js requires jQuery to be defined first.")}var e=b.authorization||(b.authorization={}),c={},d={},f="janus.authorization";e.check=function(p,q){var o=b.query.cookie(f);if(o){var l=/^"\w+:\w+:[\w-]+"$/;if(l.test(o)){q({authorized:true});return}console.log("Invalid cookie. Deleting "+o);var n=location.hostname.split(".").slice(-2).join(".");b.query.removeCookie(f,{path:"/"});b.query.removeCookie(f,{path:"/",domain:n})}var r,h,k,m=true,j=p;r=c[j]||(c[j]=g.ajax({url:p,type:"get",dataType:"jsonp"}));h=d[p]||(d[p]=[]);if(typeof h.indexOf==="function"&&h.indexOf(q)>-1){m=false}else{for(k=0;k<h.length;k++){if(h[k]===q){m=false;break}}}if(m){h.push(q)}r.done(q);r.error(q)};e.refresh=function(){var j,m,n,k=0,h;c={};for(j in d){m=d[j];k=0;for(h=m.length;k<h;k++){n=m[k];e.check(j,n)}}};e.auth_type=function(){var h=b.query.cookie("janus.authorization")||"";return h.replace(/^\s*"|"\s*$|backend|:[\s\S]*/gi,"").toLowerCase()};if(window.janrain&&typeof window.janrain.on==="function"){window.janrain.on("cmg_login_complete",e.refresh)}else{g(function(){if(window.janrain&&typeof window.janrain.on==="function"){window.janrain.on("cmg_login_complete",e.refresh)}})}})((window.cmg||(window.cmg={})),cmg.query||window.jQuery);(function(b){b.fn.cmgImageSlider=function(y){var z=this;var q=z.find(".cmImageSliderList").children().length;if(q==1){return}var n=q;var o=true;var v=true;var x=0;var m="";var h;var f=b(".cmImageSliderControls",z);var k=b("ul.cmImageSliderList",z);var w={slider_speed:6000};var d=b.extend(w,y);var e=function(){h=setTimeout(function(){l();e()},d.slider_speed)};e();b("ul.cmImageSliderList li:first",z).before(b("ul.cmImageSliderList li:last",z));var p=function(){x=b("ul.cmImageSliderControls li a span.cmImageSliderIndicatorActive",z).data("set");return x};for(var t=0;t<n;t++){var u='<li class="cmImageSliderIndicator"><a class="cmImageSliderListIndicator cmSet'+t+'"><span class="icon-circle cmImageSliderIndicatorInactive" data-set="'+t+'"></span></a></li>';m+=u}f.html(m);f.find("li a.cmSet0 span").toggleClass("icon-circle-blank icon-circle").toggleClass("cmImageSliderIndicatorInactive cmImageSliderIndicatorActive");f.show();var g=function(C,B,i,A){if(B=="forward"&&q===2){b("ul.cmImageSliderList li:last",z).after(b("ul.cmImageSliderList li:first",z).clone(true));k.animate({left:i},A,function(){b("ul.cmImageSliderList li:first",z).remove();b("ul.cmImageSliderList",z).css({left:"-615px"});o=true})}else{if(B=="forward"){k.animate({left:i},A,function(){b("ul.cmImageSliderList li:last",z).after(b("ul.cmImageSliderList li:first",z));b("ul.cmImageSliderList",z).css({left:"-615px"});o=true})}else{if(B=="backwards"){k.animate({left:i},A,function(){b("ul.cmImageSliderList li:first",z).before(b("ul.cmImageSliderList li:last",z));b("ul.cmImageSliderList",z).css({left:"-615px"});o=true})}}}};b("ul.cmImageSliderControls li a.cmImageSliderListIndicator",z).click(function(){var A=b(this).find("span").data("set");var E=f.find("li a span.cmImageSliderIndicatorActive").data("set");var D=Math.abs(A-E);var F=500/D;if(A>E){var B=parseInt(b("ul.cmImageSliderList",z).css("left"))-615;for(var C=0;C<D;C++){g((E+C),"forward",B,F)}}else{if(A<E){var B=parseInt(b("ul.cmImageSliderList",z).css("left"))+615;for(var C=0;C<D;C++){g((E-C),"backwards",B,F)}}}f.find("li a span.cmImageSliderIndicatorActive").toggleClass("cmImageSliderIndicatorActive cmImageSliderIndicatorInactive").toggleClass("icon-circle icon-circle-blank");b(this).find("span").toggleClass("cmImageSliderIndicatorInactive cmImageSliderIndicatorActive").toggleClass("icon-circle-blank icon-circle");s()});z.find(".cmImageSliderPrevArrow").click(function c(){var B;if(!o){return}o=false;x=p();z.find("ul.cmImageSliderControls li a.cmSet"+x+" span").toggleClass("cmImageSliderIndicatorActive cmImageSliderIndicatorInactive").toggleClass("icon-circle icon-circle-blank");if(x===0){B=q-1}else{B=x-1}z.find("ul.cmImageSliderControls li a.cmSet"+(B)+" span").toggleClass("cmImageSliderIndicatorInactive cmImageSliderIndicatorActive").toggleClass("icon-circle-blank icon-circle");var A=parseInt(b("ul.cmImageSliderList").css("left"))+615;var C="backwards";g(x,C,A,500);s()});function l(){var B;if(!o){return}o=false;x=p();z.find("ul.cmImageSliderControls li a.cmSet"+x+" span").toggleClass("cmImageSliderIndicatorActive cmImageSliderIndicatorInactive").toggleClass("icon-circle icon-circle-blank");if(x==q-1){B=0}else{B=x+1}z.find("ul.cmImageSliderControls li a.cmSet"+(B)+" span").toggleClass("cmImageSliderIndicatorInactive cmImageSliderIndicatorActive").toggleClass("icon-circle-blank icon-circle");var A=parseInt(b("ul.cmImageSliderList").css("left"))-615;var C="forward";g(x,C,A,500)}z.find(".cmImageSliderNextArrow").click(function(){s();l()});function s(){if(!v){return}clearTimeout(h);e()}function r(){v=false;clearTimeout(h)}function j(){if(v){return}e()}z.find("ul.cmImageSliderList, .cmImageSliderIndicator, .cmImageSliderPrevArrow, .cmImageSliderNextArrow").mouseenter(r).mouseleave(j)}}(cmg.query));cmg.henka=(function henka(){var b={options:{client_timeout:"100"},default_match_provider:"view-port"};henka.props={switches:[],last_width:0};henka.tools={is_mobile_device:function(){var f=0,g=["iPad","iPhone","iPod","Android","webOS","BlackBerry","Windows Phone"];for(;f<g.length;f++){if(navigator.platform===g[f]){return true}}return false}};henka.core={match_manager:{match:function(f){var g=henka.providers[b.default_match_provider].provideMatch({query:f.query});return g}},update_manager:{update:{one:function(f){henka.core.update_manager.update.all({current_pos:f.switch_index,single:true})},all:function e(h){var g=h||{};var f=g.current_pos||0;if(f==(henka.props.switches.length)){return false}var i=f+1;setTimeout(function(){var j=henka.core.match_manager.match({query:henka.props.switches[f].query});henka.core.update_manager.run({"switch":henka.props.switches[f],matched:j});if(!g.single){e({current_pos:i})}},0)}},run:function d(h){var f=h.matched;var g=h["switch"];var i=function(){var j=g.data;if(typeof(g.data)=="function"){j=g.data(g)}return j};if(g.init){if(!g.init.didRun){g.init(i(g.data));g.init.didRun=true}}if(f){if(g.resize){g.resize(i(g.data))}if(g.on){if(!g.wasMatched){g.wasMatched=true;g.on(i(g.data))}}}if(!f&&g.wasMatched){g.wasMatched=false;if(g.off){g.off(i(g.data))}}}}};henka.providers={"view-port":{provideMatch:function(g){var f=window.innerWidth||document.documentElement.clientWidth;if(g.query.min!=undefined&&g.query.max==undefined){return(f>=g.query.min)}if(g.query.max!=undefined&&g.query.min==undefined){return(f<=g.query.max)}if(g.query.min!=undefined&&g.query.max!=undefined){return(f>=g.query.min&&f<=g.query.max)}return false}}};henka.platform={attach_listener:function(i){var m=new Date("2000-01-01T12:00:00.000Z"),h=false,l=b.options.client_timeout,j=false,k=function(){if(j==false){j=true;setTimeout(function(){henka.core.update_manager.update.all()},0)}},g=function(){if(new Date()-m<l){setTimeout(g,0)}else{h=false;j=false;if(!henka.tools.is_mobile_device()){k()}}},f=function(){var n=window.innerWidth;if(henka.props.last_width!=n){if(henka.tools.is_mobile_device()){k()}m=new Date();if(h===false){h=true;setTimeout(g,l)}}henka.props.last_width=n};if(window.addEventListener){window.addEventListener("resize",f,false)}else{window.attachEvent("onresize",f)}},boot_henka:function(f){henka.props.last_width=window.innerWidth;henka.platform.attach_listener()}};henka.run_result=henka.platform.boot_henka();return function c(h,g){var f=function(j){if(!typeof(j)=="function"){return undefined}return j};if(h){var i=henka.props.switches.push({})-1;c._switch=henka.props.switches[i];c._switch.query=h;c._switch.data=g}c.init=function(j){c._switch.init=f(j);return c};c.on=function(j){c._switch.on=f(j);return c};c.off=function(j){c._switch.off=f(j);return c};c.data=function(j){c._switch.data=j;return c};c.resize=function(j){c._switch.resize=f(j);return c};c.update=function(j){if(j){henka.core.update_manager.update.one({switch_index:i,single:true})}else{henka.props.switches[i]=c._switch.update(j,c._switch)}return c};c.$=henka;return c}}());cmg.query(document).ready(function(){cmg.query(".list-item-timestamp").each(function(){var d=cmg.query(this),c=d.attr("updated_date"),b=d.attr("pub_date");pub_date=c?c:b,content_posted=b?"Posted: ":"",content_updated=c?"Updated: ":"";if(moment().diff(moment(pub_date,"YYYYMDHHmmss"),"months")<1){d.text(content_posted+content_updated+moment(pub_date,"YYYY-M-D-HH-mm-ss").fromNow())}})});window.Modernizr=function(aA,az,ay){function W(b){aq.cssText=b}function V(d,c){return W(am.join(d+";")+(c||""))}function U(d,c){return typeof d===c}function T(d,c){return !!~(""+d).indexOf(c)}function S(e,c){for(var f in e){if(aq[e[f]]!==ay){return c=="pfx"?e[f]:!0}}return !1}function R(g,c,j){for(var i in g){var h=c[g[i]];if(h!==ay){return j===!1?g[i]:U(h,"function")?h.bind(j||c):h}}return !1}function Q(g,f,j){var i=g.charAt(0).toUpperCase()+g.substr(1),h=(g+" "+ak.join(i+" ")+i).split(" ");return U(f,"string")||U(f,"undefined")?S(h,f):(h=(g+" "+aj.join(i+" ")+i).split(" "),R(h,f,j))}function O(){aw.input=function(g){for(var f=0,b=g.length;f<b;f++){af[g[f]]=g[f] in ap}return af.list&&(af.list=!!az.createElement("datalist")&&!!aA.HTMLDataListElement),af}("autocomplete autofocus list placeholder max min multiple pattern required step".split(" ")),aw.inputtypes=function(b){for(var l=0,k,j,g,c=b.length;l<c;l++){ap.setAttribute("type",j=b[l]),k=ap.type!=="text",k&&(ap.value=ao,ap.style.cssText="position:absolute;visibility:hidden;",/^range$/.test(j)&&ap.style.WebkitAppearance!==ay?(au.appendChild(ap),g=az.defaultView,k=g.getComputedStyle&&g.getComputedStyle(ap,null).WebkitAppearance!=="textfield"&&ap.offsetHeight!==0,au.removeChild(ap)):/^(search|tel)$/.test(j)||(/^(url|email)$/.test(j)?k=ap.checkValidity&&ap.checkValidity()===!1:/^color$/.test(j)?(au.appendChild(ap),au.offsetWidth,k=ap.value!=ao,au.removeChild(ap)):k=ap.value!=ao)),ag[b[l]]=!!k}return ag}("search tel url email datetime date month week time datetime-local number range color".split(" "))}var ax="2.5.3",aw={},av=!0,au=az.documentElement,at="modernizr",ar=az.createElement(at),aq=ar.style,ap=az.createElement("input"),ao=":)",an={}.toString,am=" -webkit- -moz- -o- -ms- ".split(" "),al="Webkit Moz O ms",ak=al.split(" "),aj=al.toLowerCase().split(" "),ai={svg:"http://www.w3.org/2000/svg"},ah={},ag={},af={},ae=[],ad=ae.slice,ac,ab=function(t,s,r,q){var p,o,n,h=az.createElement("div"),g=az.body,b=g?g:az.createElement("body");if(parseInt(r,10)){while(r--){n=az.createElement("div"),n.id=q?q[r]:at+(r+1),h.appendChild(n)}}return p=["&#173;","<style>",t,"</style>"].join(""),h.id=at,(g?h:b).innerHTML+=p,b.appendChild(h),g||(b.style.background="",au.appendChild(b)),o=s(h,t),g?h.parentNode.removeChild(h):b.parentNode.removeChild(b),!!o},aa=function(e){var g=aA.matchMedia||aA.msMatchMedia;if(g){return g(e).matches}var f;return ab("@media "+e+" { #"+at+" { position: absolute; } }",function(c){f=(aA.getComputedStyle?getComputedStyle(c,null):c.currentStyle)["position"]=="absolute"}),f},Z=function(){function c(i,h){h=h||az.createElement(b[i]||"div"),i="on"+i;var g=i in h;return g||(h.setAttribute||(h=az.createElement("div")),h.setAttribute&&h.removeAttribute&&(h.setAttribute(i,""),g=U(h[i],"function"),U(h[i],"undefined")||(h[i]=ay),h.removeAttribute(i))),h=null,g}var b={select:"input",change:"input",submit:"form",reset:"form",error:"img",load:"img",abort:"img"};return c}(),Y={}.hasOwnProperty,X;!U(Y,"undefined")&&!U(Y.call,"undefined")?X=function(d,c){return Y.call(d,c)}:X=function(d,c){return c in d&&U(d.constructor.prototype[c],"undefined")},Function.prototype.bind||(Function.prototype.bind=function(f){var i=this;if(typeof i!="function"){throw new TypeError}var h=ad.call(arguments,1),g=function(){if(this instanceof g){var b=function(){};b.prototype=i.prototype;var d=new b,c=i.apply(d,h.concat(ad.call(arguments)));return Object(c)===c?c:d}return i.apply(f,h.concat(ad.call(arguments)))};return g});var P=function(i,h){var e=i.join(""),b=h.length;ab(e,function(o,n){var m=az.styleSheets[az.styleSheets.length-1],l=m?m.cssRules&&m.cssRules[0]?m.cssRules[0].cssText:m.cssText||"":"",k=o.childNodes,g={};while(b--){g[k[b].id]=k[b]}aw.touch="ontouchstart" in aA||aA.DocumentTouch&&az instanceof DocumentTouch||(g.touch&&g.touch.offsetTop)===9,aw.csstransforms3d=(g.csstransforms3d&&g.csstransforms3d.offsetLeft)===9&&g.csstransforms3d.offsetHeight===3,aw.generatedcontent=(g.generatedcontent&&g.generatedcontent.offsetHeight)>=1,aw.fontface=/src/i.test(l)&&l.indexOf(n.split(" ")[0])===0},b,h)}(['@font-face {font-family:"font";src:url("https://")}',["@media (",am.join("touch-enabled),("),at,")","{#touch{top:9px;position:absolute}}"].join(""),["@media (",am.join("transform-3d),("),at,")","{#csstransforms3d{left:9px;position:absolute;height:3px;}}"].join(""),['#generatedcontent:after{content:"',ao,'";visibility:hidden}'].join("")],["fontface","touch","csstransforms3d","generatedcontent"]);ah.flexbox=function(){return Q("flexOrder")},ah["flexbox-legacy"]=function(){return Q("boxDirection")},ah.canvas=function(){var b=az.createElement("canvas");return !!b.getContext&&!!b.getContext("2d")},ah.canvastext=function(){return !!aw.canvas&&!!U(az.createElement("canvas").getContext("2d").fillText,"function")},ah.webgl=function(){try{var g=az.createElement("canvas"),c;c=!(!aA.WebGLRenderingContext||!g.getContext("experimental-webgl")&&!g.getContext("webgl")),g=ay}catch(b){c=!1}return c},ah.touch=function(){return aw.touch},ah.geolocation=function(){return !!navigator.geolocation},ah.postmessage=function(){return !!aA.postMessage},ah.websqldatabase=function(){return !!aA.openDatabase},ah.indexedDB=function(){return !!Q("indexedDB",aA)},ah.hashchange=function(){return Z("hashchange",aA)&&(az.documentMode===ay||az.documentMode>7)},ah.history=function(){return !!aA.history&&!!history.pushState},ah.draganddrop=function(){var b=az.createElement("div");return"draggable" in b||"ondragstart" in b&&"ondrop" in b},ah.websockets=function(){for(var d=-1,e=ak.length;++d<e;){if(aA[ak[d]+"WebSocket"]){return !0}}return"WebSocket" in aA},ah.rgba=function(){return W("background-color:rgba(150,255,150,.5)"),T(aq.backgroundColor,"rgba")},ah.hsla=function(){return W("background-color:hsla(120,40%,100%,.5)"),T(aq.backgroundColor,"rgba")||T(aq.backgroundColor,"hsla")},ah.multiplebgs=function(){return W("background:url(https://),url(https://),red url(https://)"),/(url\s*\(.*?){3}/.test(aq.background)},ah.backgroundsize=function(){return Q("backgroundSize")},ah.borderimage=function(){return Q("borderImage")},ah.borderradius=function(){return Q("borderRadius")},ah.boxshadow=function(){return Q("boxShadow")},ah.textshadow=function(){return az.createElement("div").style.textShadow===""},ah.opacity=function(){return V("opacity:.55"),/^0.55$/.test(aq.opacity)},ah.cssanimations=function(){return Q("animationName")},ah.csscolumns=function(){return Q("columnCount")},ah.cssgradients=function(){var e="background-image:",d="gradient(linear,left top,right bottom,from(#9f9),to(white));",f="linear-gradient(left top,#9f9, white);";return W((e+"-webkit- ".split(" ").join(d+e)+am.join(f+e)).slice(0,-e.length)),T(aq.backgroundImage,"gradient")},ah.cssreflections=function(){return Q("boxReflect")},ah.csstransforms=function(){return !!Q("transform")},ah.csstransforms3d=function(){var b=!!Q("perspective");return b&&"webkitPerspective" in au.style&&(b=aw.csstransforms3d),b},ah.csstransitions=function(){return Q("transition")},ah.fontface=function(){return aw.fontface},ah.generatedcontent=function(){return aw.generatedcontent},ah.video=function(){var b=az.createElement("video"),f=!1;try{if(f=!!b.canPlayType){f=new Boolean(f),f.ogg=b.canPlayType('video/ogg; codecs="theora"').replace(/^no$/,""),f.h264=b.canPlayType('video/mp4; codecs="avc1.42E01E"').replace(/^no$/,""),f.webm=b.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/^no$/,"")}}catch(e){}return f},ah.audio=function(){var b=az.createElement("audio"),f=!1;try{if(f=!!b.canPlayType){f=new Boolean(f),f.ogg=b.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,""),f.mp3=b.canPlayType("audio/mpeg;").replace(/^no$/,""),f.wav=b.canPlayType('audio/wav; codecs="1"').replace(/^no$/,""),f.m4a=(b.canPlayType("audio/x-m4a;")||b.canPlayType("audio/aac;")).replace(/^no$/,"")}}catch(e){}return f},ah.localstorage=function(){try{return localStorage.setItem(at,at),localStorage.removeItem(at),!0}catch(b){return !1}},ah.sessionstorage=function(){try{return sessionStorage.setItem(at,at),sessionStorage.removeItem(at),!0}catch(b){return !1}},ah.webworkers=function(){return !!aA.Worker},ah.applicationcache=function(){return !!aA.applicationCache},ah.svg=function(){return !!az.createElementNS&&!!az.createElementNS(ai.svg,"svg").createSVGRect},ah.inlinesvg=function(){var b=az.createElement("div");return b.innerHTML="<svg/>",(b.firstChild&&b.firstChild.namespaceURI)==ai.svg},ah.smil=function(){return !!az.createElementNS&&/SVGAnimate/.test(an.call(az.createElementNS(ai.svg,"animate")))},ah.svgclippaths=function(){return !!az.createElementNS&&/SVGClipPath/.test(an.call(az.createElementNS(ai.svg,"clipPath")))};for(var N in ah){X(ah,N)&&(ac=N.toLowerCase(),aw[ac]=ah[N](),ae.push((aw[ac]?"":"no-")+ac))}return aw.input||O(),aw.addTest=function(e,c){if(typeof e=="object"){for(var f in e){X(e,f)&&aw.addTest(f,e[f])}}else{e=e.toLowerCase();if(aw[e]!==ay){return aw}c=typeof c=="function"?c():c,au.className+=" "+(c?"":"no-")+e,aw[e]=c}return aw},W(""),ar=ap=null,function(v,u){function p(f,e){var h=f.createElement("p"),g=f.getElementsByTagName("head")[0]||f.documentElement;return h.innerHTML="x<style>"+e+"</style>",g.insertBefore(h.lastChild,g.firstChild)}function o(){var b=l.elements;return typeof b=="string"?b.split(" "):b}function n(g){var d={},j=g.createElement,i=g.createDocumentFragment,h=i();g.createElement=function(b){var c=(d[b]||(d[b]=j(b))).cloneNode();return l.shivMethods&&c.canHaveChildren&&!s.test(b)?h.appendChild(c):c},g.createDocumentFragment=Function("h,f","return function(){var n=f.cloneNode(),c=n.createElement;h.shivMethods&&("+o().join().replace(/\w+/g,function(b){return d[b]=j(b),h.createElement(b),'c("'+b+'")'})+");return n}")(l,h)}function m(d){var c;return d.documentShived?d:(l.shivCSS&&!r&&(c=!!p(d,"article,aside,details,figcaption,figure,footer,header,hgroup,nav,section{display:block}audio{display:none}canvas,video{display:inline-block;*display:inline;*zoom:1}[hidden]{display:none}audio[controls]{display:inline-block;*display:inline;*zoom:1}mark{background:#FF0;color:#000}")),q||(c=!n(d)),c&&(d.documentShived=c),d)}var t=v.html5||{},s=/^<|^(?:button|form|map|select|textarea)$/i,r,q;(function(){var b=u.createElement("a");b.innerHTML="<xyz></xyz>",r="hidden" in b,q=b.childNodes.length==1||function(){try{u.createElement("a")}catch(d){return !0}var e=u.createDocumentFragment();return typeof e.cloneNode=="undefined"||typeof e.createDocumentFragment=="undefined"||typeof e.createElement=="undefined"}()})();var l={elements:t.elements||"abbr article aside audio bdi canvas data datalist details figcaption figure footer header hgroup mark meter nav output progress section summary time video",shivCSS:t.shivCSS!==!1,shivMethods:t.shivMethods!==!1,type:"default",shivDocument:m};v.html5=l,m(u)}(this,az),aw._version=ax,aw._prefixes=am,aw._domPrefixes=aj,aw._cssomPrefixes=ak,aw.mq=aa,aw.hasEvent=Z,aw.testProp=function(b){return S([b])},aw.testAllProps=Q,aw.testStyles=ab,au.className=au.className.replace(/(^|\s)no-js(\s|$)/,"$1$2")+(av?" js "+ae.join(" "):""),aw}(this,this.document),function(ad,ac,ab){function aa(b){return P.call(b)=="[object Function]"}function Z(b){return typeof b=="string"}function Y(){}function X(b){return !b||b=="loaded"||b=="complete"||b=="uninitialized"}function W(){var b=O.shift();M=1,b?b.t?R(function(){(b.t=="c"?L.injectCss:L.injectJs)(b.s,0,b.a,b.x,b.e,1)},0):(b(),W()):M=0}function V(w,v,t,s,q,p,n){function m(c){if(!g&&X(h.readyState)&&(x.r=g=1,!M&&W(),h.onload=h.onreadystatechange=null,c)){w!="img"&&R(function(){I.removeChild(h)},50);for(var e in D[v]){D[v].hasOwnProperty(e)&&D[v][e].onload()}}}var n=n||L.errorTimeout,h={},g=0,b=0,x={t:t,s:v,e:q,a:p,x:n};D[v]===1&&(b=1,D[v]=[],h=ac.createElement(w)),w=="object"?h.data=v:(h.src=v,h.type=w),h.width=h.height="0",h.onerror=h.onload=h.onreadystatechange=function(){m.call(this,b)},O.splice(s,0,x),w!="img"&&(b||D[v]===2?(I.insertBefore(h,J?null:Q),R(m,n)):D[v].push(h))}function U(g,e,j,i,h){return M=0,e=e||"j",Z(g)?V(e=="c"?G:H,g,e,this.i++,j,i,h):(O.splice(this.i++,0,g),O.length==1&&W()),this}function T(){var b=L;return b.loader={load:U,i:0},b}var S=ac.documentElement,R=ad.setTimeout,Q=ac.getElementsByTagName("script")[0],P={}.toString,O=[],M=0,K="MozAppearance" in S.style,J=K&&!!ac.createRange().compareNode,I=J?S:Q.parentNode,S=ad.opera&&P.call(ad.opera)=="[object Opera]",S=!!ac.attachEvent&&!S,H=K?"object":S?"script":"img",G=S?"script":H,F=Array.isArray||function(b){return P.call(b)=="[object Array]"},E=[],D={},C={timeout:function(d,c){return c.length&&(d.timeout=c[0]),d}},N,L;L=function(f){function d(j){var j=j.split("!"),i=E.length,q=j.pop(),p=j.length,q={url:q,origUrl:q,prefixes:j},o,m,l;for(m=0;m<p;m++){l=j[m].split("="),(o=C[l.shift()])&&(q=o(q,l))}for(m=0;m<i;m++){q=E[m](q)}return q}function n(m,s,r,q,p){var o=d(m),b=o.autoCallback;o.url.split(".").pop().split("?").shift(),o.bypass||(s&&(s=aa(s)?s:s[m]||s[q]||s[m.split("/").pop().split("?")[0]]||W),o.instead?o.instead(m,s,r,q,p):(D[o.url]?o.noexec=!0:D[o.url]=1,r.load(o.url,o.forceCSS||!o.forceJS&&"css"==o.url.split(".").pop().split("?").shift()?"c":ab,o.noexec,o.attrs,o.timeout),(aa(s)||aa(b))&&r.load(function(){T(),s&&s(o.origUrl,p,q),b&&b(o.origUrl,p,q),D[o.url]=2})))}function k(w,v){function u(b,i){if(b){if(Z(b)){i||(r=function(){var j=[].slice.call(arguments);q.apply(this,j),p()}),n(b,r,v,0,t)}else{if(Object(b)===b){for(g in o=function(){var j=0,l;for(l in b){b.hasOwnProperty(l)&&j++}return j}(),b){b.hasOwnProperty(g)&&(!i&&!--o&&(aa(r)?r=function(){var j=[].slice.call(arguments);q.apply(this,j),p()}:r[g]=function(j){return function(){var l=[].slice.call(arguments);j&&j.apply(this,l),p()}}(q[g])),n(b[g],r,v,g,t))}}}}else{!i&&p()}}var t=!!w.test,s=w.load||w.both,r=w.callback||Y,q=r,p=w.complete||Y,o,g;u(t?w.yep:w.nope,!!s),s&&u(s)}var h,e,c=this.yepnope.loader;if(Z(f)){n(f,0,c,0)}else{if(F(f)){for(h=0;h<f.length;h++){e=f[h],Z(e)?n(e,0,c,0):F(e)?L(e):Object(e)===e&&k(e,c)}}else{Object(f)===f&&k(f,c)}}},L.addPrefix=function(d,c){C[d]=c},L.addFilter=function(b){E.push(b)},L.errorTimeout=10000,ac.readyState==null&&ac.addEventListener&&(ac.readyState="loading",ac.addEventListener("DOMContentLoaded",N=function(){ac.removeEventListener("DOMContentLoaded",N,0),ac.readyState="complete"},0)),ad.yepnope=T(),ad.yepnope.executeStack=W,ad.yepnope.injectJs=function(r,q,p,n,m,h){var g=ac.createElement("script"),f,b,n=n||L.errorTimeout;g.src=r;for(b in p){g.setAttribute(b,p[b])}q=h?W:q||Y,g.onreadystatechange=g.onload=function(){!f&&X(g.readyState)&&(f=1,q(),g.onload=g.onreadystatechange=null)},R(function(){f||(f=1,q(1))},n),m?g.onload():Q.parentNode.insertBefore(g,Q)},ad.yepnope.injectCss=function(b,n,m,l,k,h){var l=ac.createElement("link"),f,n=h?W:n||Y;l.href=b,l.rel="stylesheet",l.type="text/css";for(f in m){l.setAttribute(f,m[f])}k||(Q.parentNode.insertBefore(l,Q),R(n,0))}}(this,document),Modernizr.load=function(){yepnope.apply(window,[].slice.call(arguments,0))},Modernizr.addTest("mediaqueries",Modernizr.mq("only all"));Modernizr.addTest("iswindows",function(){return !!navigator.platform.match(/Win/i)});cmg.query(window).on("ads/ready",function(){cmg.henka({min:768}).on(function(){cmg.harmony.show.breakpoint("972px-infinity")}).off(function(){cmg.harmony.hide.breakpoint("972px-infinity")}).update(true);cmg.henka({max:767}).on(function(){cmg.harmony.show.breakpoint("1px-479px")}).off(function(){cmg.harmony.hide.breakpoint("1px-479px")}).update(true)});cmg.query(document).ready(function(d){Modernizr.touch=Modernizr.touch||window.navigator.msMaxTouchPoints;if(Modernizr.touch&&d("html.no-touch").length){d("html").removeClass("no-touch").addClass("touch")}if(Modernizr.iswindows){d("html").addClass("iswindows")}if(window.addEventListener){if(!location.hash){setTimeout(function(){scrollTo(0,1)},0)}}d(".section-nav-collapse").bind("click",function(){d(this).toggleClass("nav-collapse-open");var k=d(this).find("i");d(".section-nav-collapse i","#section-nav").not(k).removeClass("icon-minus");k.toggleClass("icon-minus")});d(".dropdown",d(".main-nav")).wrapInner(d("<div/>",{"class":"table-cell-container"}));if(Modernizr.touch){var h,j,b,e=10;d(".dropdown").on("touchstart","a.dropdown-toggle",function(k){var m=d(this);if((m.parent(".open").length)&&(!m.next(".accordion-toggle").is(":visible"))){var l=d(this).attr("href");if(l){window.location.href=l}}else{h=k.originalEvent.touches[0].pageY}});d(".dropdown").on("touchend","a.dropdown-toggle",function(k){var m=d(this);j=k.originalEvent.changedTouches[0].pageY;b=Math.abs(j-h);if(m.next(".accordion-toggle").is(":visible")&&(b<e)){var l=d(this).attr("href");if(l){window.location.href=l}}})}else{setTimeout(function(){d("body").off("click.dropdown");d(".dropdown").on("hover",function(k){d(this).children(".table-cell-container").toggleClass("open",k.type==="mouseenter")})},50)}var c=d(".form-search");var g=c.clone(true);var i=d(".main-nav .nav");cmg.henka({max:599}).on(function(){if(Modernizr.mq("max-width: 479px")){g.removeClass("pull-right");d(".navbar-container a.btn").removeClass("btn-navbar")}if(!d(".main-nav .form-search").length){d(".main-nav .btn-navbar").after(g)}d(".weather-cond").remove();var k=d(".masthead-info .datetime");d(".brand.logo h1").before(k.clone());k.first().remove();i.removeClass("nav-stretch");d("> li",i).addClass("accordion-group");d(" li",i).removeClass("dropdown");d(" li ul",i).removeClass("dropdown-menu").addClass("accordion-body").addClass("collapse");d(".dropdown-toggle",i).removeClass("prevent").attr("data-toggle","")}).update(true);cmg.henka({min:600,max:767}).on(function(){if(!d(".main-nav .form-search").length){d(".main-nav .btn-navbar").after(g)}i.removeClass("nav-stretch");d("> li",i).addClass("accordion-group");d(" li",i).removeClass("dropdown");d(" li ul",i).removeClass("dropdown-menu").addClass("accordion-body").addClass("collapse");d(".dropdown-toggle",i).removeClass("prevent").attr("data-toggle","")}).update(true);cmg.henka({min:768}).on(function(){cmg.query(".main-nav .form-search").remove();i.addClass("nav-stretch");d("> li",i).removeClass("accordion-group");d(" li",i).addClass("dropdown");d(" li ul",i).addClass("dropdown-menu").removeClass("accordion-body").removeClass("collapse");d(".dropdown-toggle",i).addClass("prevent").attr("data-toggle","dropdown")}).update(true);var f=d(".mastfoot").clone();cmg.henka({max:768}).on(function(){var k=d(".mastfoot");var l=d(".row h5",k).siblings();l.each(function(){$this=d(this);$subcolumns=$this.children(".span2");if($subcolumns.length==1){var m=d("<ul/>",{"class":"unstyled"});var n=d("ul li",$subcolumns);n.slice((n.length/2)+(n.length%2?1:0),n.length).appendTo(m);d("<div/>",{"class":"span2"}).append(m).appendTo($this)}})}).off(function(){d(".mastfoot").html(f.html())}).update(true);cmg.henka({max:480}).on(function(){d(".time-stamp span").html("<br>")}).off(function(){d(".time-stamp span").html("&nbsp;&nbsp;&#124;&nbsp;&nbsp;")}).update(true);d(window).on("orientationchange",function(k){if(window.scrollTo&&window.scrollX!==0){window.scrollTo(0,window.scrollY)}});d("#article-related").on("click",'a:not([href~="'+location.hostname+'"])',function(k){if(!~this.href.indexOf(location.hostname)){this.target="_blank"}});(function(){var k=function(m){var l=d(".modal");l.each(function(n,q){var o=d(q);var p=d(".modal-content img",o);if(m!="auto"){m=parseInt(m)>p.data("ltmaxwidth")?p.data("ltmaxwidth"):parseInt(m)}o.css("left",m==="auto"?"5%":"50%");o.css("right",m==="auto"?"5%":"50%");o.css("width",m);if(o.data().modal){o.data().modal.layout()}})};cmg.henka({max:480}).on(function(){k("auto")}).update(true);cmg.henka({min:481,max:600}).on(function(){k("auto")}).update(true);cmg.henka({min:601,max:768}).on(function(){k("560px")}).update(true);cmg.henka({min:769}).on(function(){k("715px")}).update(true)}());d(".breaking-news").bind("click",".breaking-news-headline a",function(k){k.stopPropagation();if(k.which<=2){if(flipper.is_active("DTMmetrics_Enable")){cmg.DDO.action("breakingNews")}else{fire_omniture_event.call(this,cmg.s_coxnews,"event35","breaking news",k)}}});d(".searchtoggle .locationlink").click(function(){d(".cmWeatherSearchForm .searchform").toggle();return false});if(d("#cmWeather").length){cmg.henka({max:600}).on(function(){d(".cmWeatherHourbyHour table tr").each(function(){d(this).find("td, th").show().slice(4).hide()});d("div.row").slice(0,2).show();d("#cmWeatherAd .ad-warning").hide();cmg.harmony.hide.breakpoint("600px-infinity");cmg.harmony.show.breakpoint("1px-599px")}).update(true);cmg.henka({max:480}).on(function(){d(".cmWeatherHourbyHour table tr").each(function(){d(this).find("td, th").slice(3).hide()});d("#cmWeatherAd .ad-warning").hide();d("div.row").slice(0,2).show();cmg.harmony.hide.breakpoint("600px-infinity");cmg.harmony.show.breakpoint("1px-599px")}).update(true);cmg.henka({min:765}).on(function(){d(".cmWeatherHourbyHour table tr").each(function(){d(this).find("td, th").show()});d("#cmWeatherAd .ad-warning").show();d("div.row").slice(0,2).hide();cmg.harmony.show.breakpoint("600px-infinity");cmg.harmony.hide.breakpoint("1px-599px");var l=d(".cmWeatherFiveDayForecastBox .cmWeatherDescription");var k=Math.max.apply(Math,d.map(l,function(m){return d(m).height()}));l.height(k)}).update(true);cmg.henka({min:601,max:764}).on(function(){d(".cmWeatherHourbyHour table tr").each(function(){d(this).find("td, th").show()});d("#cmWeatherAd .ad-warning").hide();d("div.row").show(0,2).hide();cmg.harmony.hide.breakpoint("600px-infinity");cmg.harmony.show.breakpoint("1px-599px")}).update(true)}});;


    var has_local_storage = (function () {
        // source:
        // https://mathiasbynens.be/notes/localstorage-pattern

        var test_token = (new Date()).toString();
        var result;
        try {
            localStorage.setItem(test_token, test_token);
            result = localStorage.getItem(test_token) === test_token;
            localStorage.removeItem(test_token);
            return !!(result && localStorage);
        } catch (exception) {
            return false;
        }
    })();

    cmg._logger = new function() {
        var storage_logs_name = "cmg_logger";

        var that = this;

        if (has_local_storage) {
            this.storage_logs = JSON.parse(
                localStorage.getItem(storage_logs_name) || "[]"
            );
            if (this.storage_logs.length > 30) {
                this.storage_logs.length = [];
            }
        } else {
            this.storage_logs = [];
        }

        this.log = function (source, msg, info) {

            var info = info || {};
            var signin_selector = "#cmJanrainAuthLinks .cmUserAuthed a";

            function save_logs (janrain_session_info) {
                that.storage_logs.push({
                    timestamp: (new Date()).toUTCString(),
                    source: source,
                    msg: msg,
                    path: window.location.href,
                    janus_auth_cookie: cmg.query.cookie(
                        'janus.authorization'),
                    janrain_session_info: janrain_session_info,
                    info: info,
                });

                if (has_local_storage) {
                    localStorage.setItem(storage_logs_name,
                                         JSON.stringify(that.storage_logs));
                } else {
                    console.log(
                        "LOG Info not saved to storage because localStorage is not available")
                }
                console.log("LOGS:  ", msg, info,
                            "For details look in cmg._logger.storage_logs");
            }

            if (typeof(janrain) !== "undefined") {
                // We're interested in instances where the user has signed in to Janrain

                if (typeof(janrain.capture) === "undefined") {
                    janrain.on("cmg_ready", function () {
                        janrain.events.onCaptureSessionFound.addHandler(function (result){
                            save_logs({
                                token: result,
                                signin: cmg.query(signin_selector).eq(0).text(),
                            });
                        });
                    });
                } else if (janrain.capture.ui.hasActiveSession()) {
                    save_logs({
                        has_active_session: true,
                        signin: cmg.query(signin_selector).eq(0).text(),
                    });
                }
            } else {
                save_logs("janrain not defined at log time");
            }
        }
    };

    function premium_failed_fetch_handler_after_janrain_session(log_source, log_msg, log_info) {
        cmg._logger.log(log_source, log_msg, log_info);

        
    }

    

    cmg.mediaurl = 'http://media.cmgdigital.com/shared/media/2015-08-18-11-55-07/web/common/';
    cmg.site_meta = {
        domain: 'www.mystatesman.com',
        media_type: 'premium',
        site_name: 'myaas',
        premium_status: ''
    };
    
    cmg.parse_qs = function parse_qs(str) {
        if (!str) { return {}; }
        if (str[0] === '?') { str = str.slice(1); }
        var ret = {};
        var query_args = str.split('&');
        for (var key in query_args) {
            if (!query_args.hasOwnProperty(key)) { continue; }
            var tuple = query_args[key].split('=');
            ret[tuple[0]] = tuple[1];
        }
        return ret;
    };

    cmg.update_auth_message = function() {
        var id = '#cmJanrainAuthLinks';
        var cookie = cmg.query.cookie('ur_name', {path:'/'});
        if (typeof cookie === 'string') {
            if (cookie.length > 14) {
                cookie = cookie.slice(0,11) + '...';
            }

            
            
                this.query(id+' .cmUserAuthed a:first-child').text(cookie);
            
            this.query(id+' .cmUserAuthed').show();
            this.query(id+' .cmUserAnonymous').hide();
        } else {
            this.query(id+' .cmUserAuthed').hide();
            this.query(id+' .cmUserAnonymous').show();
        }
        this.query('#cmHeaderUserRegistration').css('visibility', 'visible');
    }

    var metrics_signin = 0;

    
    cmg.query.ajaxSetup({ cache: true });

    
    

    
try { localStorage.test = 2; } catch(error) {
    cmg.query(document).ready(function(){
        
        janrain.on("cmg_ready", function () {
            cmg.query('body').undelegate('.cmOpenJanrainModal', 'click');
            cmg.query('.cmOpenJanrainModal').unbind('click');
            cmg.query('body').delegate('.cmOpenJanrainModal', 'click', function(e){
                e.preventDefault();
                e.stopPropagation();
                alert("Did you know Private Browsing is turned on?\n\nTo log in to " + cmg.site_meta.site_name + ", please turn Private Browsing off in your browser settings, reload the page, and try again.");
            });
        });
    });
}

;
/*!
 * hoverIntent v1.8.0 // 2014.06.29 // jQuery v1.9.1+
 * http://cherne.net/brian/resources/jquery.hoverIntent.html
 *
 * You may use hoverIntent under the terms of the MIT license. Basically that
 * means you are free to use hoverIntent as long as this header is left intact.
 * Copyright 2007, 2014 Brian Cherne
 */
(function($){$.fn.hoverIntent=function(handlerIn,handlerOut,selector){var cfg={interval:100,sensitivity:6,timeout:0};if(typeof handlerIn==="object"){cfg=$.extend(cfg,handlerIn)}else{if($.isFunction(handlerOut)){cfg=$.extend(cfg,{over:handlerIn,out:handlerOut,selector:selector})}else{cfg=$.extend(cfg,{over:handlerIn,out:handlerIn,selector:handlerOut})}}var cX,cY,pX,pY;var track=function(ev){cX=ev.pageX;cY=ev.pageY};var compare=function(ev,ob){ob.hoverIntent_t=clearTimeout(ob.hoverIntent_t);if(Math.sqrt((pX-cX)*(pX-cX)+(pY-cY)*(pY-cY))<cfg.sensitivity){$(ob).off("mousemove.hoverIntent",track);ob.hoverIntent_s=true;return cfg.over.apply(ob,[ev])}else{pX=cX;pY=cY;ob.hoverIntent_t=setTimeout(function(){compare(ev,ob)},cfg.interval)}};var delay=function(ev,ob){ob.hoverIntent_t=clearTimeout(ob.hoverIntent_t);ob.hoverIntent_s=false;return cfg.out.apply(ob,[ev])};var handleHover=function(e){var ev=$.extend({},e);var ob=this;if(ob.hoverIntent_t){ob.hoverIntent_t=clearTimeout(ob.hoverIntent_t)}if(e.type==="mouseenter"){pX=ev.pageX;pY=ev.pageY;$(ob).on("mousemove.hoverIntent",track);if(!ob.hoverIntent_s){ob.hoverIntent_t=setTimeout(function(){compare(ev,ob)},cfg.interval)}}else{$(ob).off("mousemove.hoverIntent",track);if(ob.hoverIntent_s){ob.hoverIntent_t=setTimeout(function(){delay(ev,ob)},cfg.timeout)}}};return this.on({"mouseenter.hoverIntent":handleHover,"mouseleave.hoverIntent":handleHover},cfg.selector)}})(jQuery);;
(function(e){function p(){var e=s();if(e!==o){o=e;r.trigger("orientationchange")}}function w(t,n,r,i){var s=r.type;r.type=n;e.event.dispatch.call(t,r,i);r.type=s}e.attrFn=e.attrFn||{};var t=navigator.userAgent.toLowerCase().indexOf("chrome")>-1&&(navigator.userAgent.toLowerCase().indexOf("windows")>-1||navigator.userAgent.toLowerCase().indexOf("macintosh")>-1||navigator.userAgent.toLowerCase().indexOf("linux")>-1);var n={swipe_h_threshold:50,swipe_v_threshold:50,taphold_threshold:750,doubletap_int:500,touch_capable:"ontouchstart"in document.documentElement&&!t,orientation_support:"orientation"in window&&"onorientationchange"in window,startevent:"ontouchstart"in document.documentElement&&!t?"touchstart":"mousedown",endevent:"ontouchstart"in document.documentElement&&!t?"touchend":"mouseup",moveevent:"ontouchstart"in document.documentElement&&!t?"touchmove":"mousemove",tapevent:"ontouchstart"in document.documentElement&&!t?"tap":"click",scrollevent:"ontouchstart"in document.documentElement&&!t?"touchmove":"scroll",hold_timer:null,tap_timer:null};e.each("tapstart tapend tap singletap doubletap taphold swipe swipeup swiperight swipedown swipeleft swipeend scrollstart scrollend orientationchange".split(" "),function(t,n){e.fn[n]=function(e){return e?this.bind(n,e):this.trigger(n)};e.attrFn[n]=true});e.event.special.tapstart={setup:function(){var t=this,r=e(t);r.bind(n.startevent,function(e){if(e.which&&e.which!==1){return false}else{var r=e.originalEvent;var i={position:{x:n.touch_capable?r.touches[0].screenX:e.screenX,y:n.touch_capable?r.touches[0].screenY:e.screenY},offset:{x:n.touch_capable?r.touches[0].pageX-r.touches[0].target.offsetLeft:e.offsetX,y:n.touch_capable?r.touches[0].pageY-r.touches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};w(t,"tapstart",e,i);return true}})}};e.event.special.tapend={setup:function(){var t=this,r=e(t);r.bind(n.endevent,function(e){var r=e.originalEvent;var i={position:{x:n.touch_capable?r.changedTouches[0].screenX:e.screenX,y:n.touch_capable?r.changedTouches[0].screenY:e.screenY},offset:{x:n.touch_capable?r.changedTouches[0].pageX-r.changedTouches[0].target.offsetLeft:e.offsetX,y:n.touch_capable?r.changedTouches[0].pageY-r.changedTouches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};w(t,"tapend",e,i);return true})}};e.event.special.taphold={setup:function(){var t=this,r=e(t),i,s,o={x:0,y:0};r.bind(n.startevent,function(e){if(e.which&&e.which!==1){return false}else{r.data("tapheld",false);i=e.target;var s=e.originalEvent;var u=(new Date).getTime(),a={x:n.touch_capable?s.touches[0].screenX:e.screenX,y:n.touch_capable?s.touches[0].screenY:e.screenY},f={x:n.touch_capable?s.touches[0].pageX-s.touches[0].target.offsetLeft:e.offsetX,y:n.touch_capable?s.touches[0].pageY-s.touches[0].target.offsetTop:e.offsetY};o.x=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageX:e.pageX;o.y=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageY:e.pageY;n.hold_timer=window.setTimeout(function(){var l=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageX:e.pageX,c=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageY:e.pageY;if(e.target==i&&o.x==l&&o.y==c){r.data("tapheld",true);var h=(new Date).getTime(),p={x:n.touch_capable?s.touches[0].screenX:e.screenX,y:n.touch_capable?s.touches[0].screenY:e.screenY},d={x:n.touch_capable?s.touches[0].pageX-s.touches[0].target.offsetLeft:e.offsetX,y:n.touch_capable?s.touches[0].pageY-s.touches[0].target.offsetTop:e.offsetY};duration=h-u;var v={startTime:u,endTime:h,startPosition:a,startOffset:f,endPosition:p,endOffset:d,duration:duration,target:e.target};w(t,"taphold",e,v)}},n.taphold_threshold);return true}}).bind(n.endevent,function(){r.data("tapheld",false);window.clearTimeout(n.hold_timer)})}};e.event.special.doubletap={setup:function(){var t=this,r=e(t),i,s,o;r.bind(n.startevent,function(e){if(e.which&&e.which!==1){return false}else{r.data("doubletapped",false);i=e.target;var t=e.originalEvent;o={position:{x:n.touch_capable?t.touches[0].screenX:e.screenX,y:n.touch_capable?t.touches[0].screenY:e.screenY},offset:{x:n.touch_capable?t.touches[0].pageX-t.touches[0].target.offsetLeft:e.offsetX,y:n.touch_capable?t.touches[0].pageY-t.touches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};return true}}).bind(n.endevent,function(e){var u=(new Date).getTime();var a=r.data("lastTouch")||u+1;var f=u-a;window.clearTimeout(s);if(f<n.doubletap_int&&f>0&&e.target==i&&f>100){r.data("doubletapped",true);window.clearTimeout(n.tap_timer);var l={position:{x:n.touch_capable?origEvent.touches[0].screenX:e.screenX,y:n.touch_capable?origEvent.touches[0].screenY:e.screenY},offset:{x:n.touch_capable?origEvent.touches[0].pageX-origEvent.touches[0].target.offsetLeft:e.offsetX,y:n.touch_capable?origEvent.touches[0].pageY-origEvent.touches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};var c={firstTap:o,secondTap:l,interval:l.time-o.time};w(t,"doubletap",e,c)}else{r.data("lastTouch",u);s=window.setTimeout(function(e){window.clearTimeout(s)},n.doubletap_int,[e])}r.data("lastTouch",u)})}};e.event.special.singletap={setup:function(){var t=this,r=e(t),i=null,s=null,o={x:0,y:0};r.bind(n.startevent,function(e){if(e.which&&e.which!==1){return false}else{s=(new Date).getTime();i=e.target;o.x=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageX:e.pageX;o.y=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageY:e.pageY;return true}}).bind(n.endevent,function(e){if(e.target==i){end_pos_x=e.originalEvent.changedTouches?e.originalEvent.changedTouches[0].pageX:e.pageX;end_pos_y=e.originalEvent.changedTouches?e.originalEvent.changedTouches[0].pageY:e.pageY;n.tap_timer=window.setTimeout(function(){if(!r.data("doubletapped")&&!r.data("tapheld")&&o.x==end_pos_x&&o.y==end_pos_y){var i=e.originalEvent;var s={position:{x:n.touch_capable?i.changedTouches[0].screenX:e.screenX,y:n.touch_capable?i.changedTouches[0].screenY:e.screenY},offset:{x:n.touch_capable?i.changedTouches[0].pageX-i.changedTouches[0].target.offsetLeft:e.offsetX,y:n.touch_capable?i.changedTouches[0].pageY-i.changedTouches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};w(t,"singletap",e,s)}},n.doubletap_int)}})}};e.event.special.tap={setup:function(){var t=this,r=e(t),i=false,s=null,o,u={x:0,y:0};r.bind(n.startevent,function(e){if(e.which&&e.which!==1){return false}else{i=true;u.x=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageX:e.pageX;u.y=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageY:e.pageY;o=(new Date).getTime();s=e.target;return true}}).bind(n.endevent,function(e){var r=e.originalEvent.targetTouches?e.originalEvent.changedTouches[0].pageX:e.pageX,a=e.originalEvent.targetTouches?e.originalEvent.changedTouches[0].pageY:e.pageY;if(s==e.target&&i&&(new Date).getTime()-o<n.taphold_threshold&&u.x==r&&u.y==a){var f=e.originalEvent;var l={position:{x:n.touch_capable?f.changedTouches[0].screenX:e.screenX,y:n.touch_capable?f.changedTouches[0].screenY:e.screenY},offset:{x:n.touch_capable?f.changedTouches[0].pageX-f.changedTouches[0].target.offsetLeft:e.offsetX,y:n.touch_capable?f.changedTouches[0].pageY-f.changedTouches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};w(t,"tap",e,l)}})}};e.event.special.swipe={setup:function(){function f(e){o.x=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageX:e.pageX;o.y=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageY:e.pageY;u.x=o.x;u.y=o.y;i=true;var t=e.originalEvent;a={position:{x:n.touch_capable?t.touches[0].screenX:e.screenX,y:n.touch_capable?t.touches[0].screenY:e.screenY},offset:{x:n.touch_capable?t.touches[0].pageX-t.touches[0].target.offsetLeft:e.offsetX,y:n.touch_capable?t.touches[0].pageY-t.touches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};var r=new Date;while(new Date-r<100){}}function l(e){u.x=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageX:e.pageX;u.y=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageY:e.pageY;window.clearTimeout(n.hold_timer);var t;var f=r.attr("data-xthreshold"),l=r.attr("data-ythreshold"),c=typeof f!=="undefined"&&f!==false&&parseInt(f)?parseInt(f):n.swipe_h_threshold,h=typeof l!=="undefined"&&l!==false&&parseInt(l)?parseInt(l):n.swipe_v_threshold;if(o.y>u.y&&o.y-u.y>h){t="swipeup"}if(o.x<u.x&&u.x-o.x>c){t="swiperight"}if(o.y<u.y&&u.y-o.y>h){t="swipedown"}if(o.x>u.x&&o.x-u.x>c){t="swipeleft"}if(t!=undefined&&i){o.x=0;o.y=0;u.x=0;u.y=0;i=false;var p=e.originalEvent;endEvnt={position:{x:n.touch_capable?p.touches[0].screenX:e.screenX,y:n.touch_capable?p.touches[0].screenY:e.screenY},offset:{x:n.touch_capable?p.touches[0].pageX-p.touches[0].target.offsetLeft:e.offsetX,y:n.touch_capable?p.touches[0].pageY-p.touches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};var d=Math.abs(a.position.x-endEvnt.position.x),v=Math.abs(a.position.y-endEvnt.position.y);var m={startEvnt:a,endEvnt:endEvnt,direction:t.replace("swipe",""),xAmount:d,yAmount:v,duration:endEvnt.time-a.time};s=true;r.trigger("swipe",m).trigger(t,m)}}function c(e){if(s){var t=r.attr("data-xthreshold"),o=r.attr("data-ythreshold"),u=typeof t!=="undefined"&&t!==false&&parseInt(t)?parseInt(t):n.swipe_h_threshold,f=typeof o!=="undefined"&&o!==false&&parseInt(o)?parseInt(o):n.swipe_v_threshold;var l=e.originalEvent;endEvnt={position:{x:n.touch_capable?l.changedTouches[0].screenX:e.screenX,y:n.touch_capable?l.changedTouches[0].screenY:e.screenY},offset:{x:n.touch_capable?l.changedTouches[0].pageX-l.changedTouches[0].target.offsetLeft:e.offsetX,y:n.touch_capable?l.changedTouches[0].pageY-l.changedTouches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};if(a.position.y>endEvnt.position.y&&a.position.y-endEvnt.position.y>f){swipedir="swipeup"}if(a.position.x<endEvnt.position.x&&endEvnt.position.x-a.position.x>u){swipedir="swiperight"}if(a.position.y<endEvnt.position.y&&endEvnt.position.y-a.position.y>f){swipedir="swipedown"}if(a.position.x>endEvnt.position.x&&a.position.x-endEvnt.position.x>u){swipedir="swipeleft"}var c=Math.abs(a.position.x-endEvnt.position.x),h=Math.abs(a.position.y-endEvnt.position.y);var p={startEvnt:a,endEvnt:endEvnt,direction:swipedir.replace("swipe",""),xAmount:c,yAmount:h,duration:endEvnt.time-a.time};r.trigger("swipeend",p)}i=false;s=false}var t=this,r=e(t),i=false,s=false,o={x:0,y:0},u={x:0,y:0},a;r.bind(n.startevent,f);r.bind(n.moveevent,l);r.bind(n.endevent,c)}};e.event.special.scrollstart={setup:function(){function o(e,n){i=n;w(t,i?"scrollstart":"scrollend",e)}var t=this,r=e(t),i,s;r.bind(n.scrollevent,function(e){if(!i){o(e,true)}clearTimeout(s);s=setTimeout(function(){o(e,false)},50)})}};var r=e(window),i,s,o,u,a,f={0:true,180:true};if(n.orientation_support){var l=window.innerWidth||e(window).width(),c=window.innerHeight||e(window).height(),h=50;u=l>c&&l-c>h;a=f[window.orientation];if(u&&a||!u&&!a){f={"-90":true,90:true}}}e.event.special.orientationchange=i={setup:function(){if(n.orientation_support){return false}o=s();r.bind("throttledresize",p);return true},teardown:function(){if(n.orientation_support){return false}r.unbind("throttledresize",p);return true},add:function(e){var t=e.handler;e.handler=function(e){e.orientation=s();return t.apply(this,arguments)}}};e.event.special.orientationchange.orientation=s=function(){var e=true,t=document.documentElement;if(n.orientation_support){e=f[window.orientation]}else{e=t&&t.clientWidth/t.clientHeight<1.1}return e?"portrait":"landscape"};e.event.special.throttledresize={setup:function(){e(this).bind("resize",v)},teardown:function(){e(this).unbind("resize",v)}};var d=250,v=function(){y=(new Date).getTime();b=y-m;if(b>=d){m=y;e(this).trigger("throttledresize")}else{if(g){window.clearTimeout(g)}g=window.setTimeout(p,d-b)}},m=0,g,y,b;e.each({scrollend:"scrollstart",swipeup:"swipe",swiperight:"swipe",swipedown:"swipe",swipeleft:"swipe",swipeend:"swipe"},function(t,n,r){e.event.special[t]={setup:function(){e(this).bind(n,e.noop)}}})})(jQuery);
;
// Object polyfills are from mozilla dev network
if (!Object.create) {
    Object.create = function (o) {
        if (arguments.length > 1) {
            throw new Error('Object.create implementation only accepts the first parameter.')
        }
        function F() {}
        F.prototype = o
        return new F()
    }
}
if(!Object.keys) Object.keys = function(o){
    if (o !== Object(o))
        throw new TypeError('Object.keys called on non-object')
    var ret=[],p
    for(p in o) if(Object.prototype.hasOwnProperty.call(o,p)) ret.push(p)
    return ret
}

// "polyfill" for console
if (!window.console) {
    window.console = {
        log: function() {},
        info: function() {},
        error: function() {}
    }
}

var marimo = {
    /* this namespace stores the general marimo state (widget requests, live
       widgets, an event registry), acts as an event transport for widgets, and
       houses "widgetlib," a collection of widgets that can either be used or
       extended.
    */
    // batch request objects that widgets use to get fresh data about themselves
    requests: {},
    // live widgets on the page
    widgets: {},
    // an event registry for tracking events that have occurred
    events: {},
    init: function init($) {
        /*  initialize marimo with some framework object. You must do this.
            Currently only jQuery is supported (sorry).
        */
        // TODO eliminate dependence on jQuery
        this.$ = $

        this.$(document).ready(function() { marimo.emit('documentready') })

        return this
    },
    add_widget: function add_widget(widget_args) {
        /*  add a widget to marimo.widgets. widget_args is an object that
            contains data that will be fed to the resulting widget's .init().
            marimo will look for widget_prototype is a string that corresponds
            to an object in marimo.widgetlib. If this key does not exist marimo
            will fall back to base_widget (this is probably not what you want).
        */
       var widget_prototype = this.widgetlib[widget_args['widget_prototype']]
       if (!widget_prototype) {
           if (widget_args['widget_prototype']) {
             console.log('Could not find widget_protoype: ' + widget_args['widget_prototype'] + ', falling back to base_widget')
           }
           widget_prototype = this.widgetlib.base_widget
       }
       var w = Object.create(widget_prototype)
       this.widgets[widget_args.id] = w
       this.widgets[widget_args.id].init(widget_args)
    },
    add_widgets: function add_widgets(widgets) {
        /* a simple wrapper around this.add_widget() */
        for (var key in widgets) {
            if (!widgets.hasOwnProperty(key)){return}
            this.add_widget(widgets[key])
        }
    },
    make_request: function make_request() {
        /* tell all the batched requests in this.requests to make their
           requests to their murls.

           This method will do nothing if there is nothing in this.requests.
        */
        for (var key in this.requests) {
            if (!this.requests.hasOwnProperty(key)) { return }
            var batch = this.requests[key]
            var that = this
            batch.make_request(function(data) { that.handle_response(batch.url, data) })
        }
    },
    handle_response: function handle_response(url, data) {
        /* handle a bulked response to this.make_request. use the id property
           in each response object to route the data.
        */
        delete this.requests[url]
        for (var datum in data) {
            if (!data.hasOwnProperty(datum)) {return}
            var widget_data = data[datum]
            this.widgets[widget_data.id].update(widget_data)
            this.widgets[widget_data.id].render()
        }
    },
    emit: function emit(evnt) {
        /* emit an event into the marimo event pool for widgets to hear */
        this.events[evnt] = true
        this.$(document).trigger(evnt)
    },
    printf: function printf(str, args) {
        /* purely a convenience function.

           var formatted = marimo.printf('hello there %s are you %s', ['nate', 'blue'])
        */
        marimo.$.each(args, function(k, v) {
            str = str.replace('%s', v)
        })
        return str
    },
    extend: function extend(obj, ex) {
        /* given some existing object, clone it with Object.create() and add
           the new behavior described by the ex object.

           the new object is returned.

           var mywidget = marimo.extend(marimo.widgetlib.base_widget, {
               thing: function() { do_stuff() },
               ...
           }

           functions in the new object will have their names set appropriately
           using their key in the ex object.
        */
        var new_obj = Object.create(obj)
        for (var key in ex) {
            if (!ex.hasOwnProperty(key)) continue
            var val = ex[key]
            new_obj[key] = val
            if (typeof(val) === 'function') new_obj[key].name = key
        }
        return new_obj
    }
}

marimo.batch_request = {
    /* an object for representing a single url and the requests that will go to
       that url.
    */
    init: function init(url, options) {
        /* initialize this batch request with some endpoint URL */
        this.payloads = []
        if (!url) {
            console.error('batch_request needs a url')
            return
        }
        this.options = options || {};

        this.url = url
        return this
    },
    add: function add(payload) {
        /* add a widget's request data to our yet-to-be-transferred payloads */
        if (!payload || typeof payload !== 'object') {
            console.error('batch_request got a strange payload:')
            console.error(payload)
            return
        }
        this.payloads.push(payload)
    },
    make_request: function make_request(cb) {
        var self = this
        // TODO implement retries
        marimo.$.ajax({
            url: this.url,
            data: {bulk:JSON.stringify(this.payloads)},
            dataType: 'json',
            success: function(data) {
                if (typeof self.options.callback === 'function') {
                    self.options.callback(data, cb);
                } else {
                    cb(data)
                }
            },
            error: function() {
                var msg = marimo.printf('bulk request to %s failed with json %s', [self.url, JSON.stringify(self.payloads)])
                console.error(msg)
            }
        })
    }
}

// widgetlib holds raw objects that can be used with Object.create().
marimo.widgetlib = {}

marimo.widgetlib.base_widget = {
    /* this widget doesn't do much. It is here to be extended. */
    init: function(data) {
        /* basic init function for widgets. sets this.id and the rest of the
           argument object to this.data
        */
        this.id = data.id
        this.data = data
        return this
    },
    update: function(data) {
        /* to be implemented */
    },
    render: function() {
        /* to be implemented */
    },
    // set up an event listener. such events will be later emitted by marimo.
    // check to see if designated event has already been emitted so we can fire
    // synchronously. Optionally pass a list of events; once all of them have
    // been fired the callback will be run.
    on: function(evnt, cb, context) {
        /* call cb given event evnt. Optionally pass a context for cb to be
           called within. context defaults to the current context.

           evnt can either be a string or an array. If it is an array, cb will
           be called once every event named in the array has fired.
        */
        if (!context) context = this

        var wrapped_cb = function(){cb.apply(context,Array.prototype.slice.call(arguments))}
        if (typeof evnt === 'object' && typeof evnt.length !== 'undefined') {
            context._onlist.call(context, evnt, wrapped_cb)
            return
        }
        if (marimo.events[evnt]) {
             wrapped_cb()
             return
        }
        marimo.$(document).bind(evnt, function() { wrapped_cb() })
    },
    emit: function(evnt) {
        /* emit an event into marimo's event pool this is a wrapper around
           marimo.event for now.
        */
        marimo.emit(evnt)
    },
    _onlist: function(evntlist, cb) {
        /* wait on multiple events to do something. this is NOT intended to be
           called. so don't call it. use .on(), and pass
           an array instead of a string. you've been warned.
        */
        if (evntlist.length > 0) {
            var evnt = evntlist.pop()
            var that = this
            this.on(evnt, function() { that._onlist(evntlist, cb)}, this)
        }
        else {
            cb()
        }
    },
    // map DOM events to selectors and functions
    domwire: function wire(mapping) {
        /* map DOM events to selectors and functions. This is essentially a
           large wrapper around calls to marimo.$(selector).bind(event, cb)

           this.domwire([{
               selector: marimo.printf('#%s button:first', [this.id]),
               event: 'click',
               cb: this.make_request
           }, {
               selector: marimo.printf('#%s form', [this.id]),
               event: 'submit',
               cb: this.submit_form
           }])
        */
        var widget = this
        marimo.$.each(mapping, function(k,v) {
            marimo.$(v.selector).bind(v.event, function(e) {
                e.preventDefault()
                v.cb.call(widget, e)
            })
        })
    }
}

// ### request_widget
// this is a requestful widget that uses network calls to get templates/info to
// render. it funnels requests through batch_request objects.
marimo.widgetlib.request_widget = marimo.extend(marimo.widgetlib.base_widget, {
    /* a widget that asks for data and, optionally, a mustache template from
       some url endpoint.
    */
    init: function (data) {
        /* initialize this widget with an id and murl. the data object argument
           will be assigned to this.data (as in base_widget).
        */
        this.id = data.id
        this.murl = data.murl
        this.data = data

        if (!this.data.template) {
            // if we received no template, try and find one in the DOM.
            var template = marimo.$('#'+this.id).html()
            if (template) {
                this.data.template = template
                marimo.$('#'+this.id).html('').show()
            }
        }

        return this
    },
    add_request: function (options) {
        /* submit a request to be batched and bulked by marimo using a
           batch_request. No requests will be made until a call to
           marimo.make_request.

           callback option takes a function with the signature:
           `function (data, req, cb) {}`
           data = the data returned by a request
           req = the request itself
           cb = the callback to call like so: cb(data, req.url)
           having an intermediary callback allows us to make additional
           asynchronous requests related to our widget
        */
        options = options || {}
        var request_data = {
            id: this.data.id,
            args: this.data.args,
            kwargs: this.data.kwargs,
            widget_name: this.data.widget_name
        }
        if (options.cache_bust) {
            request_data.__cache_bust = String(Math.random()).substr(3,5)
        }
        if (!marimo.requests[this.murl]) {
            marimo.requests[this.murl] = Object.create(marimo.batch_request).init(this.murl, options)
        }
        marimo.requests[this.murl].add(request_data)
    },
    make_request: function (cb) {
        /* make a one off request to this widget's murl. upon a successful
           response, the update and render methods of this widget are called.
           an error will call this.handle_ajax_error.
        */
        marimo.$.ajax({
            url: this.murl,
            type: 'GET',
            data: {kwargs:this.kwargs, args:this.args},
            dataType:'json',
            context:this,
            success: (typeof cb === 'function') ? cb : function (data) {
                this.update(data)
                this.render()
            },
            error: this.handle_ajax_error
        })
    },
    transform: function (data) {
        /* optionally mutate data into a form consumable by this.data.template.
           transform will be called before any invocation of
           update. Override in clones; this version is just a passthrough that
           returns data.

           Your most frequent use case will be to turn data into something that
           looks like this (given, say, the response from twitter's public
           timeline API):

           {
               context: {tweets: data}
           }

           the context property of this.data is what is used to render
           this.data.template.
        */
        return data
    },
    update: function (data) {
        /* given some new widget data update this.data, overriding as
           necessary. this is called automatically by .make_request() and in
           turn calls .transform(data).
        */
        if (this.transform) {
            data = this.transform(data);
        }
        for (var key in data) {
            if (!data.hasOwnProperty(key)) { return }
            this.data[key] = data[key]
        }
    },
    render: function () {
        /* combine this.data.context with this.data.template. Currently this
           relies on Mustache. HTML will be painted to the DOM on the page's
           onload event.

           This will be split out into render and draw phases like
           writecapture_widget. It will also use render_events and draw_events
           in the same way instead of relying on onload.
        */
        // TODO split this into render, draw methods attentive to render_events and draw_events
        // TODO support a template_url (distinct from data api)
        // TODO make not-mustache-specific
        var html = Mustache.to_html(this.data.template, this.data.context)

        var that = this
        marimo.$(function() {
            marimo.$('#'+that.id).html(html).show()
        })
    },
    handle_ajax_error: function(data) {
        /* basic handler for ajax requests made by .make_request().
           simply uses console.error.
        */
        var status = data.status
        try {
            var msg = JSON.parse(data.responseText).error
            console.error(marimo.printf('%s: %s', [status, msg]))
            return {status:status, msg:msg}
        } catch (e) {
            // don't want to error out of our error handler, so use bare
            // try/catch
            console.error(data)
        }
    }
})
marimo.widgetlib.premium_content_widget = Object.create(marimo.widgetlib.request_widget);
marimo.widgetlib.premium_content_widget.make_request = function(){
    marimo.$.ajax({
        url: this.murl,
        type: 'GET',
        data: {bulk:JSON.stringify([{id:this.id, widget_name:this.data.widget_name,
               args:this.data.args, kwargs:this.data.kwargs }])},
        dataType: 'json',
        cache: false,
        context: this,
        success: function (data) {
            this.update(data)
            this.render()
            // if authorized, show hidden sections on premium stories
            if (data[0].context.premium_content){
                marimo.$(".premium-auth-hidden").show();
            }
        },
        error: this.handle_ajax_error
    })
}
marimo.widgetlib.premium_content_widget.update = function (data) {
    var data0 = data[0];
    if (this.transform) data0 = this.transform(data0)
    for (var key in data0) {
        if (data0.hasOwnProperty(key)) {
            this.data[key] = data0[key];
        }
    }
}
marimo.widgetlib.premium_content_widget.init = function (data) {
    widgetlib.request_widget.init(data);
    this.make_request();
    return this;
}

marimo.widgetlib.writecapture_widget = marimo.extend(marimo.widgetlib.base_widget, {
    /* a widget for handling html with potentially horrible javascript.
       sandboxes, sanitizes, and background-renders the html provided in
       .init().
    */
    default_render_events: [],
    init: function (data) {
        marimo.widgetlib.base_widget.init.call(this, data)
        this.render_events = this.default_render_events.concat((data.render_events || []))
        this.draw_events = (data.draw_events || [this.id+'_ready'])
        this.wc_compatibility_mode = false
        if (typeof data.wc_compatibility_mode !== 'undefined') {
            this.wc_compatibility_mode = data.wc_compatibility_mode
        }

        var self = this
        setTimeout(function() { self.render.call(self) }, 1)

        return this
    },
    render: function () {
        /* prepare this.data.html. waits until all events in this.render_events
           have fired.
        */
        var options = {writeOnGetElementById:this.wc_compatibility_mode}
        this.on(this.render_events, function() {
            this.safe_html = marimo.$.writeCapture.sanitize(this.decode(this.data.html), options)
            this.draw()
        }, this)
    },
    draw: function () {
        /* actually write sanitized html out into the DOM. waits until all
           events in this.draw_events have fired.
        */
        this.on(this.draw_events, function() {
            marimo.$('#'+this.id).html(this.safe_html)
        }, this)
    },
    decode: function (html) {
        /* this utterly painful method decodes an html hunk with script tags
           and newlines escaped.
        */
        return html.replace(/\$BEGINSCRIPT/g, "\x3Cscript").replace(/\$ENDSCRIPT/g, "</script>").replace(/\$NEWLINE/g, '\n');
    }
});
;
marimo.init(cmg.query);;

    cmg.janrain_capture_server = 'https://users.cmgdigital.com';
    cmg.janrain_js_url = 'widget-cdn.rpxnow.com/load/login.cmgdigital.com';
    cmg.janrain_app_id = '6z4jnndkpe6dmfx7vdg4c7hkmz';
    cmg.janrain_federate_server = 'https://sso.cmgdigital.com';
    cmg.janrain_client_id = "3ccxh4jypd44k8qdmg2asu3hwy9ddqpx" || 'qyynzpmgrk4kgx5yg2kfurbnk639qfcf';
;
/*
 * Janrain encapsulation
 *
 * This module wraps janrain's capture widget javascript to provide custom
 * events, conditional loading, and easier unit testing.
 *
 */
(function(cmg) {
    var protocol = window.location.protocol,
        hostname = window.location.hostname;

    window.janrain = {
        init: function() {
            /* This function takes care of  loading janrain's widget js,
             * initialize this object's state, and setting up the events for
             * signalling the readiness of janrain/the dom. We also enumerate our stylesheets here.
             */
            if (!janrain.settings.capture.appId || !janrain.settings.capture.clientId) {
                console.error("Janrain settings have not been configured");
            }
            if (!cmg._ || !cmg.query) { return console.error('janrain module requires jquery and underscore.'); }
            var _ = cmg._,
                $ = cmg.query;
            this._events = {};
            window.janrainCaptureWidgetOnLoad = _(this.on_widget_load).bind(this);
            var ready_states = ['complete', 'loaded', 'interactive'];
            if (_(ready_states).indexOf(document.readyState) > -1 && $('#signIn').length > 0) {
                janrain.ready = true;
            }
            else {
                function isReady() { janrain.ready = true; }
                if (document.addEventListener) {
                    document.addEventListener("DOMContentLoaded", isReady, false);
                }
                else {
                   window.attachEvent('onload', isReady);
                }
            }

            /* why not just enumerate these in the object literal in settings?
             * Because we need to get cmg.mediaurl. An object property lookup
             * is a side-effect and no side-effects should trigger when a
             * module is loaded so this must happen in .init().
             */
            this.settings.capture.stylesheets.push(cmg.mediaurl+'css/vendor/janrain.css');
            /* disabled this because all the styles from janrain.css work
             * across browsers.
             */
            // this.settings.capture.mobileStylesheets.push(cmg.mediaurl+'css/vendor/janrain-mobile.css');

            this.load_janrain_js();

            return this;
        },
        medleySession:true,
        settings: {
            // deprecated and now set on server:
            // these are kept around in case we have to overwrite the server
            // settings in an emergency.
            //format: 'two column',
            //providers: ['facebook', 'google', 'twitter', 'yahoo'],
            //providersPerPage: '6',
            //actionText: ' ',
            //borderColor: '#ffffff',
            //width:300,
            //backgroundColor: '#ffffff',
            //language: 'en',
            //appUrl: 'https://cmg-dev.rpxnow.com',
            cmg: {
                // where to load their javascript from
                js_url: (protocol === 'https:'?'https://':'http://') + cmg.janrain_js_url
            },
            capture: {
                // refer to official janrain docs for explanation of these.
                redirectUri: protocol+'//'+hostname, // a mostly unused fallback url
                appId: cmg.janrain_app_id,
                clientId: cmg.janrain_client_id,
                captureServer: cmg.janrain_capture_server,
                responseType: 'token',
                dataDefaults: {registrationUrl: window.location.href},
                registerFlow: 'socialRegistration',
                flowVersion: 'HEAD',
                flowName: 'signIn',
                recaptchaPublicKey: '6LeVKb4SAAAAAGv-hg5i6gtiOV4XrLuCDsJOnYoP',
                setProfileData: '',
                stylesheets: [],
                mobileStylesheets: [],
                confirmModalClose: '',
                noModalBorderInlineCss: true,
                modalBorderColor: '#7AB433',
                modalBorderRadius: 5,
                modalBorderWidth: 5,
                modalBorderOpacity: 1,
                modalCloseHtml: '<span class="janrain-icon-16 janrain-icon-ex2"></span>',
                returnExperienceUserData: ['displayName', 'uuid'],
                // federate settings
                federate: true,
                federateServer: cmg.janrain_federate_server,
                federateXdReceiver: protocol+'//'+hostname+'/auth/federate_xd',
                federateLogoutUri: protocol + '//' + hostname + '/auth/federate-logout',
                federateLogoutCallback: function() {
                    cmg.localCache.clear();
                    window.location = cmg.query('.cmLogout').attr('href');
                },
                federateEnableSafari: true
            },
            share: {
                message : "",
                title : "",
                url : "",
                description : "",
                attributionDisplay : false,
                previewMode : 0,
                shortenUrl : false,
                bodyBackgroundColor : "#FFFFFF",
                bodyBackgroundColorOverride : true,
                bodyColor : "#333",
                bodyContentBackgroundColor : "#ffffff",
                bodyFontFamily : "Helvetica",
                bodyTabBackgroundColor : "#FFFFFF",
                elementBackgroundColor : "#ffffff",
                elementBorderColor : "#ccc",
                elementBorderRadius : "3",
                elementButtonBorderRadius : "3",
                elementButtonBoxShadow : "0",
                elementColor : "#333333",
                elementHoverBackgroundColor : "#333333",
                elementLinkColor : "#173951"
            },
            type: 'embed',
            tokenUrl: 'http://www.coxmediagroup.com/',
            tokenAction: 'event',
            packages: ['login', 'capture','share']
        },
        on: function(evnt, cb) {
            /* wrap janrain's event handler code to provide custom events. uses
             * a helper method depending on what kind of event is being
             * listened to.
             */
            // TODO BUG:
            // if on is called with a janrain event before janrain js is loaded
            // it will go into custom events. i'm too burned out to fix that
            // right now.
            if (this.events && this.events[evnt]) {
                this._janrain_on(evnt, cb);
            }
            else { this._custom_on(evnt, cb); }
       },
       _custom_on: function(evnt, cb) {
            var _ = cmg._;
            if (!_(this._events).has(evnt)) {
                this._events[evnt] = {
                    triggered: false,
                    handlers: [],
                    add_handler: function(cb) {
                        this.handlers.push(cb);
                    },
                    trigger: function() {
                        this.triggered = true;
                        var list = this.handlers, i = 0;
                        function runHandlers() {
                            try {
                                while (i < list.length) {
                                    list[i++]();
                                }
                            } finally {
                                if (i < list.length) {
                                    setTimeout(runHandlers, 0);
                                }
                            }
                        }
                        runHandlers();
                    }
                };
            }
            var evnt_obj = this._events[evnt];
            evnt_obj.add_handler(cb);
            if (evnt_obj.triggered) {
                cb();
            }
       },
       _janrain_on: function(evnt, cb) {
            // call janrain's event handler
            this.events[evnt].addHandler(cb);
        },
        trigger: function(evnt) {
            // trigger a custom event
            if (cmg._(this._events).has(evnt)) {
                this._events[evnt].trigger();
            }
        },
        on_widget_load: function() {
            /* This function is what is called when the janrain js is done
             * loading. It means we now have full access to all of janrain's js
             * api and can start its ui.
             */
            var $ = cmg.query;
            var _ = cmg._;

            // We need to decide which screen and/or flow to use. Sadly the
            // only way we can figure this out is by examining the URL.
            // each individual page *should* be able to call ui.start on its
            // own. however since we need the signIn screen to show on nearly
            // every page we'd have to do some synchronous trickery to be able
            // to switch the screenToRender/flow before needing to call
            // ui.start. I don't like that this code is tied to the URL of the
            // page but it seemed like the alternative was far more confusing
            // and potentially even harder to maintain. I'd love someone to
            // disagree with me and make this better.
            // (this code is awful)
            var path = window.location.pathname;
            var matches = _(path.match).bind(path);
            var screen;
            if (matches('verify-email')) {
                this.settings.capture.screenToRender = 'verifyEmail';
            }
            else if (matches('change-password')) {
                this.settings.capture.screenToRender = 'changePassword';
                this.on('onCaptureProfileSaveSuccess', function(data) {
                    //The following query string parameter is provided by janraincapture.com.
                    //You need to log into the admin to set it.
                    var next_url = cmg.parse_qs(window.location.search)['next'];
                    if (next_url) {
                        // redirect to the url found in the 'next' parameter.
                        window.location = decodeURIComponent(next_url);
                    } else {
                        // fallback to the default
                        window.location = '/auth/signin';
                    }
                });
            }
            else if (matches('profile/edit/private')) {
                this.settings.capture.flowName = 'editProfile';
                this.on('onCaptureProfileSaveSuccess', _(function() {
                    // send the new profile to medley for processing. Medley
                    // returns with the potentially updated displayName of the
                    // user; update the UI with that name.
                    var views_total_count = $.cookie('ur_views_total_count', {path:'/'});
                    if (!views_total_count) { return console.error('panic: cannot find ur_views_total_count cookie'); }
                    $.ajax({
                        url: '/auth/ajax/handle-profile-save',
                        data: {views_total_count:views_total_count},
                        dataType:'json',
                        type: 'post',
                        context: this,
                        success: function(data) {
                            if (!data || !data.display_name) {
                                return console.error('panic: cannot find display_name in response');
                            }
                            var display_name = data.display_name;
                            $.cookie('ur_name', '', {expires:-2, path:'/'});
                            $.cookie('ur_name', display_name, {path:'/'});
                            cmg.update_auth_message();
                        }
                    });
                }).bind(this));
                this.on('onCaptureSessionNotFound', function() {
                    // handle case where janrain's cookie timed out before
                    // medley's. send user to standalone signin page with a
                    // return redirect to here.
                    window.location = '/auth/signin?return='+window.location;
                });
            }
            else { janrain.settings.capture.screenToRender = 'signIn'; }

            ///// copypasta from janrain devs with tweaks
            // we may be called upon to update/merge this with new code from
            // them. Or fix it ourselves.
            function _addListener(element, type, listener) {
                if (!element) {
                    return false;
                }
                if (typeof window.attachEvent === 'object') {
                    element.attachEvent('on' + type, listener);
                } else {
                    element.addEventListener(type, listener, false);
                }
            }
            janrain.capture.ui.registerFunction('displayNameValidation', function(name, value, validation) {
                   var displayNameRegex = /^[a-zA-Z0-9_-]+$/;
                   if (displayNameRegex.test(value)) {
                       var whitespace = /\s/;
                       if (whitespace.test(value)) {
                           //console.log("displayNameValidation false");
                           return false;
                       } else {
                           //console.log("displayNameValidation true");
                           return true;
                       }
                   } else {
                       //console.log("displayNameValidation false");
                       return false;
                   }
            });
            janrain.capture.ui.registerFunction('zipCodeValidation', function(name, value, validation) {
                   var zipCodeRegex = /^[0-9]{5}(?:-[0-9]{4})?$/;
                   return Boolean(zipCodeRegex.test(value));
            });
            janrain.capture.ui.registerFunction('phoneNumberValidation', function(name, value, validation) {
                   var phoneNumberRegex = /^\D?(\d{3})\D?\D?(\d{3})\D?(\d{4})$/;
                   return Boolean(phoneNumberRegex.test(value));
            });
            var emailValue;
            janrain.on('onCaptureRenderComplete', function(result){
                if (result.screen === 'signIn') {
                    _addListener(document.getElementById('forgotPasswordLink'), 'click', function(){
                        emailValue = document.getElementById('capture_signIn_traditionalSignIn_emailAddress').value;
                    });
                }
                if (result.screen === 'forgotPassword') {
                    if (emailValue) {
                        document.getElementById('capture_forgotPassword_forgotPassword_emailAddress').value = emailValue;
                    }
                }
            });
            // TODO here may be a bug, this will possibly run before the logging in event is done.
            // but it hasn't come up yet sooooo....
            janrain.on('onCaptureEmailVerificationSuccess', function(result){
                janrain.on('cmg_login_complete', function() {
                    if(result.userData && result.userData.registrationUrl) {
                        window.location = result.userData.registrationUrl;
                    }
                });
            });
            /////// end

            // start janrain's ui magic. this is required to use/do anything
            // besides configure settings and events.
            janrain.capture.ui.start();

            var login = _(function(data) {
                cmg.localCache.clear();
                // handle a janrain login in medley. This callback logs the
                // user into medley and updates the UI.
                // It also updates the token cookie.
                if (!(data && data.userData && data.accessToken)) {
                    this.trigger('cmg_login_failed');
                    console.error('got bad data from janrain: '+data);
                    return;
                }
                // We define `expire_days` here to be 90 days, which is not ideal :(
                // The '90 days' value should come from `SESSION_COOKIE_AGE` defined in conf/settings.py. However, if we want to use `SESSION_COOKIE_AGE`,
                // then one way to address this issue is to define `expire_days` in the templates that call `janrain.js`,
                // which are at least 6 places atm (ie. common/web/includes/auth/janrain/scripts.html, v2newspaper/web/includes/scripts.html, etc)
                var views_total_count = data.accessToken,
                    expire_days = 90;  // expire 90 days from now
                $.cookie('ur_views_total_count', views_total_count, {path:'/', expires: expire_days});
                var login_complete = function(){
                    janrain.capture.ui.modal.close();
                    cmg.update_auth_message();
                    janrain.trigger('cmg_login_complete');
                };
                if(janrain.medleySession){
                    this.login_xhr = $.ajax({
                        url: '/auth/ajax/handle-auth',
                        data: {views_total_count:views_total_count},
                        type:'post',
                        context: this,
                        success: function() {
                            login_complete();
                        },
                        error: _(this.trigger).bind(this, 'cmg_login_failed')
                    });
                }else{
                    $.cookie('ur_name', data.userData.displayName, {path:'/'});
                    login_complete();
                }
            }).bind(this);

            var register = _(function(data) {
                // If this was a social login then log the user in
                // automatically. OW do nothing.
                if (!(data && data.action)) {
                    console.error('panic: register callback got strange object');
                    this.trigger('cmg_registration_failed');
                    return;
                }
                if (data.action !== 'traditionalRegister') { login(data); }
            }).bind(this);

            var checkSession = function() {
              // call ajax endpoint to verify that our sessions are synced
              // and correct the issues if they are not

              if (flipper.is_active("disable_auth_recovery")) {
                  return;
              }

              var js = janrain.capture.ui.hasActiveSession();
              var recovery_xhr = $.ajax({
                url: '/auth/ajax/recover-auth',
                data: JSON.stringify({
                  janrain_status: js
                }),
                type: 'post',
                context: this,
                dataType: 'json',
                contentType: 'application/json'
              });

              recovery_xhr.done(function(data) {
                cmg.update_auth_message();
                if(data.do_janrain_logout) {
                  console.log('Recovery Failed. Logging out.');
                  janrain.capture.ui.endCaptureSession();
                } else {
                  console.log('Recovery Succeeded!');
                }
              });

              recovery_xhr.fail(function() {
                console.log('Recovery Failed');
              });

            };

            // omniture tracking
            var omni = {
                fire: function(evnt, msg, data) {
                    if (!flipper.is_active('DTMmetrics_Enable')) {
                        if (data && data.userData) {
                            omni.userDataHandler(data, true);
                        }
                        cmg.s_coxnews.linkTrackVars = 'events,' + omni.userDataTrackVars();
                        cmg.s_coxnews.linkTrackEvents = evnt;
                        cmg.s_coxnews.events = evnt;
                        cmg.s_coxnews.tl(document, 'o', msg);
                    }
                }
            };
            omni.onProviderLoginStart = _(omni.fire).bind(omni, 'event48', 'Login popup opened');
            omni.onProviderLoginStart = _.once(omni.onProviderLoginStart);
            omni.onProviderLoginError = _(omni.fire).bind(omni, 'event49', 'Error in login popup');
            omni.onProviderLoginSuccess = _(omni.fire).bind(omni, 'event50', 'Login Success');
            omni.onReturnExperienceFound = _(omni.fire).bind(omni, 'event52', 'Logged in via cookie');
            omni.onReturnExperienceFound = _.once(omni.onReturnExperienceFound);

            if (!flipper.is_active('DTMmetrics_Enable')) {
                omni.userDataHandler = cmg.s_coxnews.utilities.userdata.transformer;

                omni.userDataTrackVars = cmg.s_coxnews.utilities.userdata.track_vars;
            }

            // this is a custome event. we trigger it ourselves in the login callback.
            this.on('cmg_login_complete', _(omni.fire).bind(omni, 'event51', 'Login Completed'));

            this.omni = omni;

            this.on('onCaptureLoginSuccess', login);
            this.on('onCaptureRegistrationSuccess', register);
            this.on('onCaptureEmailVerificationSuccess', login);
            // we want checkSession to fire exactly once, immediately after
            // Janrain checks for the session, regardless of outcome of the check
            this.on('onCaptureSessionFound', checkSession);
            this.on('onCaptureSessionNotFound', checkSession);

            this.on('onCaptureScreenShow', omni.onProviderLoginStart);
            this.on('onCaptureLoginSuccess', omni.onProviderLoginSuccess);
            this.on('onCaptureProfileSaveFailed', omni.onProviderLoginError);
            this.on('onCaptureSaveFailed', omni.onProviderLoginError);
            this.on('onCaptureRegistrationFailed', omni.onProviderLoginError);
            this.on('onCaptureFederateLogin', omni.onReturnExperienceFound);
            // end of metrics

            // Error handling; these errors are PANIC errors after which the
            // user just has to refresh the page.
            _([
                'cmg_login_failed',
                'cmg_registration_failed'
            ]).each(_(function(x) {
                this.on(x, function() {
                    console.error(x);
                    cmg.error_dialog();
                });
            }).bind(this));

            // These errors are recoverable and just need to be reported to the console.
            _([
                'onCaptureSaveFailed',
                'onCaptureRegistrationFailed',
                'onCaptureLoginFailed',
                'onCaptureLinkAccountError'
            ]).each(_(function(x) {
                this.on(x, function() {
                    console.log(x);
                });
            }).bind(this));

            this.on('onCaptureScreenShow', _(function() {
                if (cmg.refresh_timer) {
                    clearTimeout(cmg.refresh_timer);
                }
            }).once());

            // set up the mobile/newsletter signup redirects
            // they use the same login flow but when the user is done they need
            // to be shuttled off to special places.
            var redirect = _(function(e) {
                e.preventDefault();
                var href = $(e.target).attr('href'),
                    do_redirect = function() { window.location = href; };
                if (this.capture.ui.hasActiveSession()) {
                    return do_redirect();
                }
                this.capture.ui.modal.open();
                this.on('cmg_login_complete', do_redirect);
            }).bind(this);

            var $body = $('body');
            var delegate = _($body.delegate).bind($body);
            // mogreet, favorites
            _([
                '.cmFeedUtilities .sprite.iconMobile a',
                'span.favorite a'
            ]).each(function(selector) { delegate(selector, 'click', redirect); });

            // logging out
            delegate('.cmLogout', 'click', _(function(e) {
                $.cookie('ur_name', '', {expires:-2, path:'/'});
                $.cookie('ur_metrics', '', {expires:-2, path:'/'});
            }).bind(this));

            // modal opener
            delegate('.cmOpenJanrainModal', 'click', _(function(e) {
                e.preventDefault();
                e.stopPropagation();
                this.capture.ui.modal.open('signIn');
                janrain.settings.capture.federate = true;
            }).bind(this));

            // all done; pages that need to set up additional behaviors can
            // listen for this event.
            this.trigger('cmg_ready');
        },
        _fired_janrain_events: function() {
            // really just for debugging in the console
            var e = this.events;
            return cmg._(e).chain()
                .keys()
                .filter(function(x) { return e[x].firedEvents && e[x].firedEvents.length > 0; })
                .value();
        },
        load_janrain_js: function() { cmg.query.getScript(this.settings.cmg.js_url); }
    };
})(window.cmg);
;

    janrain.init();
    janrain.on('cmg_ready', function(){ cmg.update_auth_message(); });
;
/*!
 * jQuery UI 1.8.16
 *
 * Copyright 2011, AUTHORS.txt (http://jqueryui.com/about)
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 *
 * http://docs.jquery.com/UI
 */
(function(c,j){function k(a,b){var d=a.nodeName.toLowerCase();if("area"===d){b=a.parentNode;d=b.name;if(!a.href||!d||b.nodeName.toLowerCase()!=="map")return false;a=c("img[usemap=#"+d+"]")[0];return!!a&&l(a)}return(/input|select|textarea|button|object/.test(d)?!a.disabled:"a"==d?a.href||b:b)&&l(a)}function l(a){return!c(a).parents().andSelf().filter(function(){return c.curCSS(this,"visibility")==="hidden"||c.expr.filters.hidden(this)}).length}c.ui=c.ui||{};if(!c.ui.version){c.extend(c.ui,{version:"1.8.16",
keyCode:{ALT:18,BACKSPACE:8,CAPS_LOCK:20,COMMA:188,COMMAND:91,COMMAND_LEFT:91,COMMAND_RIGHT:93,CONTROL:17,DELETE:46,DOWN:40,END:35,ENTER:13,ESCAPE:27,HOME:36,INSERT:45,LEFT:37,MENU:93,NUMPAD_ADD:107,NUMPAD_DECIMAL:110,NUMPAD_DIVIDE:111,NUMPAD_ENTER:108,NUMPAD_MULTIPLY:106,NUMPAD_SUBTRACT:109,PAGE_DOWN:34,PAGE_UP:33,PERIOD:190,RIGHT:39,SHIFT:16,SPACE:32,TAB:9,UP:38,WINDOWS:91}});c.fn.extend({propAttr:c.fn.prop||c.fn.attr,_focus:c.fn.focus,focus:function(a,b){return typeof a==="number"?this.each(function(){var d=
this;setTimeout(function(){c(d).focus();b&&b.call(d)},a)}):this._focus.apply(this,arguments)},scrollParent:function(){var a;a=c.browser.msie&&/(static|relative)/.test(this.css("position"))||/absolute/.test(this.css("position"))?this.parents().filter(function(){return/(relative|absolute|fixed)/.test(c.curCSS(this,"position",1))&&/(auto|scroll)/.test(c.curCSS(this,"overflow",1)+c.curCSS(this,"overflow-y",1)+c.curCSS(this,"overflow-x",1))}).eq(0):this.parents().filter(function(){return/(auto|scroll)/.test(c.curCSS(this,
"overflow",1)+c.curCSS(this,"overflow-y",1)+c.curCSS(this,"overflow-x",1))}).eq(0);return/fixed/.test(this.css("position"))||!a.length?c(document):a},zIndex:function(a){if(a!==j)return this.css("zIndex",a);if(this.length){a=c(this[0]);for(var b;a.length&&a[0]!==document;){b=a.css("position");if(b==="absolute"||b==="relative"||b==="fixed"){b=parseInt(a.css("zIndex"),10);if(!isNaN(b)&&b!==0)return b}a=a.parent()}}return 0},disableSelection:function(){return this.bind((c.support.selectstart?"selectstart":
"mousedown")+".ui-disableSelection",function(a){a.preventDefault()})},enableSelection:function(){return this.unbind(".ui-disableSelection")}});c.each(["Width","Height"],function(a,b){function d(f,g,m,n){c.each(e,function(){g-=parseFloat(c.curCSS(f,"padding"+this,true))||0;if(m)g-=parseFloat(c.curCSS(f,"border"+this+"Width",true))||0;if(n)g-=parseFloat(c.curCSS(f,"margin"+this,true))||0});return g}var e=b==="Width"?["Left","Right"]:["Top","Bottom"],h=b.toLowerCase(),i={innerWidth:c.fn.innerWidth,innerHeight:c.fn.innerHeight,
outerWidth:c.fn.outerWidth,outerHeight:c.fn.outerHeight};c.fn["inner"+b]=function(f){if(f===j)return i["inner"+b].call(this);return this.each(function(){c(this).css(h,d(this,f)+"px")})};c.fn["outer"+b]=function(f,g){if(typeof f!=="number")return i["outer"+b].call(this,f);return this.each(function(){c(this).css(h,d(this,f,true,g)+"px")})}});c.extend(c.expr[":"],{data:function(a,b,d){return!!c.data(a,d[3])},focusable:function(a){return k(a,!isNaN(c.attr(a,"tabindex")))},tabbable:function(a){var b=c.attr(a,
"tabindex"),d=isNaN(b);return(d||b>=0)&&k(a,!d)}});c(function(){var a=document.body,b=a.appendChild(b=document.createElement("div"));c.extend(b.style,{minHeight:"100px",height:"auto",padding:0,borderWidth:0});c.support.minHeight=b.offsetHeight===100;c.support.selectstart="onselectstart"in b;a.removeChild(b).style.display="none"});c.extend(c.ui,{plugin:{add:function(a,b,d){a=c.ui[a].prototype;for(var e in d){a.plugins[e]=a.plugins[e]||[];a.plugins[e].push([b,d[e]])}},call:function(a,b,d){if((b=a.plugins[b])&&
a.element[0].parentNode)for(var e=0;e<b.length;e++)a.options[b[e][0]]&&b[e][1].apply(a.element,d)}},contains:function(a,b){return document.compareDocumentPosition?a.compareDocumentPosition(b)&16:a!==b&&a.contains(b)},hasScroll:function(a,b){if(c(a).css("overflow")==="hidden")return false;b=b&&b==="left"?"scrollLeft":"scrollTop";var d=false;if(a[b]>0)return true;a[b]=1;d=a[b]>0;a[b]=0;return d},isOverAxis:function(a,b,d){return a>b&&a<b+d},isOver:function(a,b,d,e,h,i){return c.ui.isOverAxis(a,d,h)&&
c.ui.isOverAxis(b,e,i)}})}})(cmg.query);
;
cmg.share = {
    isValidShareCode: function(shareCode){
        if(flipper.is_active('check_sharecode_simple')){
            return shareCode != '';
        }else{
            var pattern = /^#?[a-z0-9]{8}\.(\d+|unknown)\.\d{6,}$/i;
            return pattern.test(shareCode);
        }
    }
};
;
(function(){var $jsi={};if(flipper.is_active('yieldbot')){window.ybotq=window.ybotq||[];}else{window.ybotq={push:function(cb){cb();}};}}());;
cmg.query(document).ready(function () {
    if (cmg.query('.ndn_embed').length) {
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.async = true;
        script.src = 'http://launch.newsinc.com/js/embed.js';
        script.id = '_nw2e-js';
        head.appendChild(script);
    }
});
;

    (function (cmg, $, janrain, plate) {

        var root_domain = (function () {
            var segments = window.location.hostname.split('.');
            return segments.length > 1 ? segments.slice(-2).join('.') : null;
        })();

        var has_local_storage = (function () {
            // source:
            // https://mathiasbynens.be/notes/localstorage-pattern

            var test_token = (new Date()).toString();
            var result;
            try {
                localStorage.setItem(test_token, test_token);
                result = localStorage.getItem(test_token) === test_token;
                localStorage.removeItem(test_token);
                return !!(result && localStorage);
            } catch (exception) {
                console.error("PassageQuota: localStorage error was thrown", exception);
                return false;
            }
        })();

        var search_referrer = (function () {
            var whitelist = ["news.google.com",
                             "www.google.com",
                             "www.bing.com"];
            var checked_value;
            return {
                check: function () {
                    if (typeof(checked_value) !== "undefined") {
                        return checked_value;
                    } else {
                        if (document.referrer) {
                            for (var i=0; i < whitelist.length; i++) {
                                if (
                                    document.referrer.match(new RegExp(
                                        "^http[s]?://" + whitelist[i])) !== null
                                ) {
                                    checked_value = true;
                                    return checked_value;
                                }
                            }
                        }
                        checked_value = false;
                        return checked_value;
                    }
                }
            };
        })();

        var PassageQuota = function (quota_params) {
            

            var max_visits = quota_params['max_visits'];
            var period_length = quota_params['period_length'];
            var rolling_period = quota_params['rolling_period'];
            var max_visit_conditions = quota_params['max_visit_conditions'];
            var callbacks_for_visits_left = quota_params['callbacks_for_visits_left'];

            var that = this;
            var saved_post_check_callback = {callback: [],
                                             returned: []};

            this.quota_params = quota_params;
            this.internal_data = {};
            this.allow = false;

            

            var quota_storage_name = "cmg-quota";
            var quota_xdomain_split_cookie_name = "cmg-quota-xdomain";
            var path = window.location.pathname;

            this.check = function(user_status_pq_authorized, referrer_authorized, metered_object) {
                

                if (!user_status_pq_authorized) {
                    if (!referrer_authorized) {

                        var visits_obj = get_visits_obj(),
                            visited_paths = visits_obj.visited_paths,
                            max_visits_reached = check_max_visits(visited_paths),
                            callback, visits_left;

                        if (path_has_been_visited(path, visited_paths) ||
                            !max_visits_reached ||
                            !metered_object) {

                                if (metered_object) {
                                    

                                    console.info("Passage Quota: PATH INCLUDED");
                                    include_path_visit(path, visited_paths);
                                    pq_metrics.track_meter_count(
                                        count_visited_paths(visited_paths),
                                        get_current_max_visits()
                                    );
                                }

                                that.allow_passage(true);
                                console.info("Passage Quota: VISIT ALLOWED");

                        } else {
                            pq_metrics.track_meter_count(
                                "maxmet",
                                get_current_max_visits()
                            );
                            that.allow_passage(false);
                            console.info("Passage Quota: MAX VISITS REACHED");
                        }

                        console.log(visited_paths.visited);
                        console.log(visited_paths.metered);

                        save_visits_obj(visits_obj);

                        if (metered_object) {
                            console.info("Passage Quota: content type:", metered_object);
                            that.internal_data['metered_object_type'] = metered_object;
                            visits_left = get_visits_left(visited_paths);
                            var current_post_check_callback = callbacks_for_visits_left[visits_left];
                            var returned;

                            $(function () {
                                
                                apply_previous_post_check_callback();

                                if (typeof(current_post_check_callback) !== "undefined") {
                                    returned = current_post_check_callback(
                                        [],
                                        {visits_so_far: count_visited_paths(visited_paths),
                                         visits_left: visits_left,
                                         allow_passage: that.allow_passage
                                        },
                                        that.modal_handler
                                    );
                                    save_post_check_callback(current_post_check_callback,
                                                             returned);
                                }
                            });
                        }

                    } else {
                        console.info("Passage Quota: REFERRED VISIT ALLOWED");
                        that.allow_passage(true);
                    }

                } else {
                    console.info("Passage Quota: USER PQ AUTHORIZED VISIT ALLOWED");
                    that.allow_passage(true);
                    $(function () {
                        
                        apply_previous_post_check_callback();
                    });
                    that.clear_meter();
                }
            };

            this.allow_passage = function(allow) {
                if (typeof(allow) !== "undefined") {
                    that.allow = allow;
                } else {
                    return that.allow;
                }
            };

            this.clear_meter = function () {
                $.removeCookie(quota_storage_name,
                               {path: '/',
                                domain: root_domain});
                if (has_local_storage) {
                    localStorage.removeItem(quota_storage_name);
                }
                $.removeCookie(quota_xdomain_split_cookie_name,
                               {path: '/',
                                domain: '.' + root_domain});
            };

            this.get_pq_cookie_expiry_date = function (period_start) {
                

                if (typeof(period_start) !== "undefined") {
                    var cookie_expiry_date = new Date();

                    if (period_length === "first_of_month") {
                        cookie_expiry_date = new Date(period_start.getFullYear(),
                                                      period_start.getMonth()+1,
                                                      1);
                    } else if (period_length === "first_of_week") {
                        cookie_expiry_date.setTime(period_start.getTime() + 1000*60*60*24*7);

                    } else if (typeof(period_length) === "number") {
                        cookie_expiry_date.setTime(period_start.getTime() + 1000*60*60*24*period_length);
                    }
                    that.cookie_expiry_date = cookie_expiry_date;

                } else if (typeof(that.cookie_expiry_date) === "undefined") {
                    console.error("PassageQuota: error setting cookie expiry date given period_start:",
                                  period_start);
                }

                return that.cookie_expiry_date;
            };

            this.modal_handler = {
                janrain_modal_selector: "#janrainModal",
                janrain_modal_pq_class: "pq-fixed-janrain-modal",
                activate_roadblock_modal: function (pq_modal, allow_passage) {
                    var handle_pq_modal_visibility = function (janrain_modal_open) {
                        if (!allow_passage()) {
                            if (janrain_modal_open) {
                                pq_modal.hide();
                            } else {
                                pq_modal.show();
                            }
                        }
                    };
                    var verify_correct_visibility = function (janrain_modal_selector) {
                        var pq_modal_visibility = pq_modal.is(":visible");
                        var janrain_modal_visibility = $(janrain_modal_selector).is(":visible");

                        if (pq_modal_visibility === janrain_modal_visibility) {
                            location.reload();
                        }
                    };

                    if (this.modal_found(pq_modal, "roadblock")) {
                        return this.complete_modal_presentation(pq_modal,
                                                                handle_pq_modal_visibility,
                                                                verify_correct_visibility);
                    }
                },
                activate_upsell_modal: function (pq_modal, data_viewed_key, close_modal_selector) {
                    var handle_pq_modal_visibility = function (janrain_modal_open) {
                        if (janrain_modal_open) {
                            pq_modal.hide();
                        } else if (!pq_modal.data(data_viewed_key)) {
                            pq_modal.show();
                        }
                    }

                    var verify_correct_visibility = function (janrain_modal_selector)  {
                        var pq_modal_visibility = pq_modal.is(":visible");
                        var janrain_modal_visibility = $(janrain_modal_selector).is(":visible");

                        if (pq_modal_visibility === true &&
                            pq_modal_visibility === janrain_modal_visibility) {
                                location.reload();
                        }
                    }

                    $(close_modal_selector).click(function (e) {
                        e.preventDefault();
                        pq_modal.data(data_viewed_key, true);
                        pq_modal.hide();
                    });

                    if (this.modal_found(pq_modal, "upsell")) {
                        return this.complete_modal_presentation(pq_modal,
                                                                handle_pq_modal_visibility,
                                                                verify_correct_visibility);
                    }
                },
                complete_modal_presentation: function(pq_modal,
                                                      handle_pq_modal_visibility,
                                                      verify_correct_visibility)
                {
                    this.link_janrain_with_pq_modal(handle_pq_modal_visibility, verify_correct_visibility);
                    this.pre_show_changes(pq_modal);
                    pq_modal.show();
                    return pq_modal;
                },
                link_janrain_with_pq_modal: function (handle_pq_modal_visibility, verify_correct_visibility) {
                    var modal_handler = this;
                    janrain.events.onModalOpen.addHandler(function () {
                        handle_pq_modal_visibility(true);
                        verify_correct_visibility(modal_handler.janrain_modal_selector);
                    });
                    janrain.events.onModalClose.addHandler(function () {
                        handle_pq_modal_visibility(false);
                        verify_correct_visibility(modal_handler.janrain_modal_selector);
                    });
                    janrain.events.onCaptureRenderComplete.addHandler(function () {
                        var janrain_modal = $(modal_handler.janrain_modal_selector);
                        var modal_height = janrain_modal.outerHeight(true);
                        if (modal_height) {
                            if (modal_height < $(window).height()) {
                                janrain_modal.addClass(modal_handler.janrain_modal_pq_class);
                            } else {
                                janrain_modal.removeClass(modal_handler.janrain_modal_pq_class);
                            }
                        }
                    });
                },
                pre_show_changes: function(pq_modal) {
                    var subscriber_link = pq_modal.find(
                        "." + backend_facade.modal_content_names.SUBSCRIBER_LINK);
                    var view_offers = backend_facade.modal_content_names.VIEW_OFFERS;

                    pq_modal.find("." + view_offers).click(function () {
                        pq_metrics.track_converted_users(
                            view_offers,
                            pq_modal.attr("id")
                        );
                    });

                    if (janrain.capture.ui.hasActiveSession()) {
                        subscriber_link.hide();
                    } else {
                        subscriber_link.show();
                    }

                    janrain.events.onCaptureLoginSuccess.addHandler(function () {
                        subscriber_link.hide();
                    });

                    janrain.events.onCaptureRegistrationSuccess.addHandler(function () {
                        subscriber_link.hide();
                    });
                },
                modal_found: function(pq_modal, modal_name) {
                    if (pq_modal.length) {
                        return true;
                    }
                    console.error("PassageQuota: " + modal_name + " modal not found");
                    return false;
                },
                fetch_modal: function(modal_selector) {
                    var pq_modal = $("body > " + modal_selector);
                    if (!pq_modal.length) {
                        pq_modal = $(modal_selector);
                        pq_modal.appendTo("body");
                    }
                    if (plate.premium) {
                        var img_placeholder = pq_modal.find(".pq-access-limit-hero-img-hidden");
                        if (img_placeholder.length) {
                            pq_modal.find(".pq-access-limit-hero").css(
                                "background-image",
                                img_placeholder.attr("src")
                            );
                        }
                    }
                    return pq_modal;
                }
            };

            function get_visits_obj() {
                

                if (that.visits_obj) {
                    that.visits_obj['period_start'] = new Date(that.visits_obj['period_start']);
                    inject_xdomain_visits(that.visits_obj.visited_paths);
                    return that.visits_obj;
                }

                var visits_obj = {};
                var stored_visits, period_start;
                var get_updated_period_start = get_updated_period_start_in_days;

                if (has_local_storage) {
                    visits_obj['type'] = 'local_storage';
                    stored_visits = localStorage.getItem(quota_storage_name);
                } else {
                    visits_obj['type'] = 'cookie';
                    stored_visits = $.cookie(quota_storage_name,
                                             {path: '/',
                                              domain: root_domain});
                }

                if (stored_visits) {
                    stored_value = JSON.parse(stored_visits);
                    visits_obj['visited_paths'] = stored_value.visited_paths;

                    period_start = get_updated_period_start(period_length,
                                                            new Date(stored_value.period_start));
                } else {
                    

                    visits_obj['visited_paths'] = {metered: {},
                                                   visited: {}};
                    period_start = get_updated_period_start(period_length);

                }

                inject_xdomain_visits(visits_obj.visited_paths);

                visits_obj['period_start'] = period_start;

                

                update_path_visits_wrt_period_start(visits_obj.visited_paths,
                                                    period_start);

                

                that.get_pq_cookie_expiry_date(period_start);

                return visits_obj;
            }

            function save_visits_obj(visits_obj) {
                

                visits_obj['period_start'] = visits_obj['period_start'].getTime();

                
                var visited_paths = visits_obj.visited_paths;

                
                var visited_paths_wo_xdomain_visits = extract_and_save_xdomain_visits(
                    visited_paths);
                visits_obj.visited_paths = visited_paths_wo_xdomain_visits;

                if (visits_obj['type'] === 'local_storage') {
                    localStorage.setItem(quota_storage_name,
                                         JSON.stringify(visits_obj));

                } else if (visits_obj['type'] === 'cookie') {
                    $.cookie(quota_storage_name,
                             JSON.stringify(visits_obj),
                             {expires: that.get_pq_cookie_expiry_date(),
                              path: '/',
                              domain: root_domain});
                }

                
                visits_obj.visited_paths = visited_paths;
                that.visits_obj = visits_obj;
            }

            function check_max_visits(visited_paths) {
                return count_visited_paths(visited_paths) >= get_current_max_visits();
            }

            function get_visits_left(visited_paths) {
                return Math.max(get_current_max_visits() - count_visited_paths(visited_paths),
                                0);
            }

            function get_current_max_visits() {
                

                var current_max_visits;
                if (typeof(max_visits) === "number") {
                    current_max_visits = max_visits;
                } else {
                    $.each(max_visits, function (i, m) {
                        if ( ( typeof(max_visit_conditions[i]) === "undefined" ) ||
                             max_visit_conditions[i]() ) {
                                 current_max_visits = m;
                                 return false; // break forloop
                        }
                    });
                }
                that.internal_data["current_max_visits"] = current_max_visits;
                return current_max_visits;
            }

            function count_visited_paths(visited_paths) {
                return _.size(visited_paths.metered);
            }

            function path_has_been_visited(path, visited_paths) {
                return path in visited_paths.visited;
            }

            function include_path_visit(path, visited_paths) {
                

                if (path in visited_paths.visited) {
                    visited_paths.visited[path]++;

                } else {
                    visited_paths.visited[path] = 1;
                    visited_paths.metered[path] = (new Date()).getTime();
                }
            }

            function update_path_visits_wrt_period_start(visited_paths, period_start) {
                var updated_metered = {},
                    updated_visted = {},
                    original_visited = visited_paths.visited;

                $.each(visited_paths.metered,
                       function(k, v) {
                           if (period_start <= new Date(v)) {
                               updated_metered[k] = v;
                               updated_visted[k] = original_visited[k];
                           }
                       });
                visited_paths.metered = updated_metered;
                visited_paths.visited = updated_visted;
            }

            function inject_xdomain_visits(visited_paths) {
                

                var xdomain_stored_visits = $.cookie(quota_xdomain_split_cookie_name,
                                                     {path: '/',
                                                      domain: '.' + root_domain});
                

                var xdomain_visits = {cookie: {},
                                      keys: []};
                if (xdomain_stored_visits) {
                    xdomain_visits.cookie = JSON.parse(xdomain_stored_visits);
                    $.each(xdomain_visits.cookie, function (domain, timestamps) {
                        var key;
                        if (domain !== document.domain) {
                            for (var i=0; i < timestamps.length; i++) {
                                key = domain + "+" + timestamps[i];
                                visited_paths.visited[key] = 0;
                                visited_paths.metered[key] = timestamps[i];
                                xdomain_visits.keys.push(key);
                            }
                        }
                    });
                }
                that.xdomain_visits = xdomain_visits;
            }

            function extract_and_save_xdomain_visits(visited_paths) {
                

                var xdomain_visits = that.xdomain_visits;

                visited_paths_wo_xdomain_visits = remove_xdomain_visits(visited_paths);

                xdomain_visits.cookie[document.domain] = [];

                $.each(visited_paths_wo_xdomain_visits.metered,
                       function (url, timestamp) {
                           xdomain_visits.cookie[document.domain].push(timestamp);
                });

                $.cookie(quota_xdomain_split_cookie_name,
                         JSON.stringify(xdomain_visits.cookie),
                         {expires: that.get_pq_cookie_expiry_date(),
                          path: '/',
                          domain: '.' + root_domain});

                return visited_paths_wo_xdomain_visits;
            }

            function remove_xdomain_visits(visited_paths) {
                var updated_visited_paths = JSON.parse(JSON.stringify(visited_paths));
                $.each(that.xdomain_visits.keys, function (i, key) {
                    delete updated_visited_paths.visited[key];
                    delete updated_visited_paths.metered[key];
                });
                return updated_visited_paths;
            }

            function get_updated_period_start_in_days(period_start, stored_period_start) {
                

                var initial_date = new Date();
                initial_date.setHours(0,0,0,0);

                if (rolling_period) {
                    if (typeof(period_start) === "number") {
                        initial_date.setDate(initial_date.getDate() - period_start);
                        return initial_date;
                    }

                } else {
                    if (period_start === "first_of_month") {
                        return new Date(initial_date.getFullYear(), initial_date.getMonth(), 1);

                    } else if (period_start === "first_of_week") {
                        initial_date.setDate(initial_date.getDate() - initial_date.getDay());
                        return initial_date;

                    } else if (typeof(period_start) === "number") {

                        if (stored_period_start) {
                            initial_date.setDate(initial_date.getDate() - period_start);

                            if (stored_period_start <= initial_date) {

                                // Basically, if reader hasn't been away for too long
                                // i.e. less than twice the period_length
                                if ( ( (initial_date-stored_period_start) / (24*60*60*1000) )
                                        <= period_start - 1 ) {
                                    stored_period_start.setDate(stored_period_start.getDate() + period_start);
                                } else {
                                    stored_period_start = new Date();
                                    stored_period_start.setHours(0,0,0,0);
                                }
                            }
                            return stored_period_start;

                        } else {
                            return initial_date;
                        }
                    }

                }

                console.error("Error while getting quota period start");
                return initial_date;
            }

            function apply_previous_post_check_callback() {
                

                var callback = saved_post_check_callback.callback.pop();
                if (typeof(callback) !== "undefined") {
                    callback(saved_post_check_callback.returned.pop(),
                             {allow_passage: that.allow_passage});
                }
            }

            function save_post_check_callback(callback, returned) {
                if (typeof(callback) !== "undefined" &&
                    typeof(returned) !== "undefined") {
                        saved_post_check_callback.callback.push(callback);
                        saved_post_check_callback.returned.push(returned);
                }
            }
        };

        var UserStatusPQ = function(backend_facade) {
            

            var that = this;
            var get_auth_type = backend_facade.get_auth_type;
            var open_house_req_registration = backend_facade.site_settings.open_house_req_registration;
            var open_house_enabled = backend_facade.site_settings.open_house_enabled;
            var crisis_enabled = backend_facade.site_settings.crisis_enabled;

            this.authorized = function (backend_authorized, callback) {
                event_consolidator.apply_on_ready('auth_check',
                                                  {callback: callback,
                                                   backend_authorized: backend_authorized});
            };

            janrain.on('cmg_ready', function () {
                

                if (typeof(janrain.capture) !== "undefined" &&
                    janrain.capture.ui.hasActiveSession()) {
                        event_consolidator.apply_on_ready('session-found',
                                                          {janrain_session_found: true});
                } else {
                    janrain.events.onCaptureSessionFound.addHandler(function () {
                        event_consolidator.apply_on_ready('session-found',
                                                          {janrain_session_found: true});
                    });
                }
                janrain.events.onCaptureSessionNotFound.addHandler(function () {
                    event_consolidator.apply_on_ready('no-session-found',
                                                      {janrain_session_found: false});
                });


                janrain.on('cmg_login_complete', function () {
                    event_consolidator.apply_on_ready('login-complete',
                                                      {janrain_session_found: true});
                });
            });

            var event_consolidator = (function () {
                

                var auth_check = false;
                var other_event = false;
                var applied = false;
                var called_events = {};
                var full_args = {};

                function reset_events () {
                    auth_check = false;
                    other_event = false;
                    full_args = {};
                }

                function ensure_event_consolidator_completed () {
                    

                    setTimeout(function () {
                        if (applied) {
                            console.info("UserStatusPQ: event consolidator successfully completed");
                        } else {
                            console.error("UserStatusPQ: event consolidator did not complete after the expected time",
                                          { auth_check: auth_check,
                                            other_event: other_event,
                                            applied: applied }
                            );
                        }
                    }, 15000);
                }

                return {
                    apply_on_ready: function (event, partial_args) {
                        var partial_args = partial_args || {};

                        if (event === 'auth_check') {
                            ensure_event_consolidator_completed();
                            auth_check = true;
                        } else {
                            if ((event === "no-session-found" || event === "session-found") &&
                                event in called_events) {
                                    return;
                            } else {
                                other_event = event;
                                called_events[event] = 1;
                            }
                        }

                        for (var a in partial_args) {
                            full_args[a] = partial_args[a];
                        }

                        if (auth_check &&
                            other_event) {
                                apply_pq_given_auth_status(full_args);
                                applied = true;
                                reset_events();
                        } else {
                            applied = false;
                        }
                    }
                };
            })();

            function apply_pq_given_auth_status(args) {
                var backend_authorized = args["backend_authorized"];
                var pq_callback = args["callback"];
                that.janrain_session_found = args["janrain_session_found"];

                if (typeof(pq_callback) !== "undefined") {
                    if ( backend_authorized &&
                        ( crisis_enabled || !open_house_req_registration )) {
                        

                        pq_callback(true);

                    } else {
                        var auth_type = get_auth_type();

                        if (!verify_soundness(auth_type)) {
                            console.error("UserStatusPQ: exiting due to unsound status");
                            return;
                        }

                        

                        if (open_house_req_registration) {
                            pq_callback(!status_is("anonymous", auth_type));

                        } else {
                            if (open_house_enabled) {
                                pq_callback(true);
                            } else {
                                pq_callback( status_is("subscribed", auth_type) ||
                                             status_is("admin", auth_type) );
                            }
                        }
                    }
                } else {
                    console.error("UserStatus has no callback to apply.");
                }
            }

            var status_is = function (status, auth_type) {
                if (status in check_status_from_auth_type) {
                    return check_status_from_auth_type[status](auth_type);
                }
            }

            var check_status_from_auth_type = {
                anonymous: function (auth_type) {
                    return (
                        !(check_status_from_auth_type["registered"](auth_type) ||
                          check_status_from_auth_type["admin"](auth_type)) &&
                        (!auth_type || auth_type === "openhousereg")
                    );
                },
                registered: function (auth_type) {
                    return (
                        typeof(that.janrain_session_found) !== "undefined" &&
                        that.janrain_session_found
                    );
                },
                subscribed: function (auth_type) {
                    return (
                        check_status_from_auth_type["registered"](auth_type) &&
                        !!auth_type && auth_type === "mg2"
                    );
                },
                admin: function (auth_type) {
                    return (
                        !!auth_type && auth_type === "staff"
                    );
                },
            }

            function verify_soundness (auth_type) {
                function assert(condition, message) {
                    if (!condition) {
                        message = typeof(message) !== "undefined" ? ", " + message : "";
                        message = message + " conditions=[" + status_conditions.toString() + "]";
                        sound = false;
                        console.error("UserStatusPQ Error: soundness verification failed" + message);
                    }
                }

                var sound = true;
                var is_anonymous = status_is("anonymous", auth_type),
                    is_registered = status_is("registered", auth_type),
                    is_subscribed = status_is("subscribed", auth_type),
                    is_admin = status_is("admin", auth_type);

                var status_conditions = [is_anonymous, is_registered, is_subscribed, is_admin];

                assert(status_conditions.every(function (v) {
                    return !(v === null || typeof(v) === "undefined");
                }),
                       "at least one status condition is still unassigned.");

                assert(
                    // is_anonymous <==> ( !is_registered && !is_subscribed && !is_admin)
                    !( is_anonymous && (is_registered || is_subscribed || is_admin) ) &&
                    ( is_registered || is_subscribed || is_anonymous || is_admin ),
                    "anonymous status out of sync with registered, subscribed and admin."
                );

                assert(
                    // is_subscribed ==> is_registered
                    !is_subscribed || is_registered,
                    "subscribed but not registered."
                );

                return sound;
            }
        };

        var backend_facade = (function () {
            

            var auth_types = ['openhousereg', 'staff', 'mg2'];
            var auth_url = 'http://www.mystatesman.com/profile/janus-auth/';

            
            var metered_object_types = {
                "weblogs.medleyblog": 1, "feed_importer.importedfeeditem": 1, "photos.medleygallery": 1, "news.medleydocument": 1, "overrides.myflatpage": 1, "weblogs.medleyentry": 1, "videos.vendorvideo": 1, "apjobs.apstory": 1, "apjobs.apphoto": 1, "news.medleystory": 1, "maps.staticmap": 1, "photos.medleyphoto": 1, 
            };
            

            
            var modal_content_names = {
                
                "VISITS_COUNT": "pq-passage-quota-count",
                
                "STICKY_MODAL": "pq-passage-quota-sticky",
                
                "ROADBLOCK_MODAL": "pq-passage-quota-block",
                
                "SUBSCRIBER_LINK": "pq-modal-subscriber-link",
                
                "VIEW_OFFERS": "pq-passage-quota-view-offers",
                
                "MAX_VISITS": "pq-passage-quota-max",
                
                "WELCOME_MODAL": "pq-passage-quota-welcome",
                
            };
            

            var get_auth_type_from_source = function () {
                return cmg.authorization.auth_type();
            };

            var site_settings = {
                open_house_req_registration: "" === "true",
                reg_visits_threshold: parseInt("5"),
                open_house_enabled: "false" === "true",
                crisis_enabled: "false" === "true",
            }

            if (
                isNaN(site_settings.reg_visits_threshold) &&
                !site_settings.crisis_enabled &&
                ( site_settings.open_house_req_registration ||
                  !site_settings.open_house_enabled )
            ) {
                site_settings.open_house_enabled = true;
                console.error("Site Setting Error: site setting reg_visits_threshold is either missing or is not a number. All visits are allowed until the issue is fixed.");
            }

            return {
                site_settings: site_settings,
                modal_content_names: modal_content_names,
                get_auth_type: function () {
                    var current_type = get_auth_type_from_source();
                    var return_type;
                    for (var i=0; i < auth_types.length; i++) {
                        return_type = auth_types[i];
                        if (typeof(return_type) === "string" &&
                            current_type.toLowerCase().match(return_type)) {
                                return return_type;
                        }
                    }
                },
                metered_object_type: function (callback) {
                    

                    if (plate.premium){
                        apply_pq_callback(callback, 'plate.wrap');
                        return;
                    }

                    if (typeof(backend_facade.object_type) !== "undefined") {
                        callback(backend_facade.object_type);
                        return;
                    }

                    var object_type, x_object_type,
                        json_return = {};

                    if (typeof(json_return.type_set) !== "undefined") {
                        object_type = json_return.object_type;

                        if (object_type) {
                            apply_pq_callback(callback, object_type);
                        } else {
                            
                            console.info(
                                "Passage Quota: exiting because object type is not metered as determined by json");
                        }
                    } else {
                        var _jqxhr;

                        $.get(location.pathname)
                         .done(function (data, textStatus, jqxhr) {
                             _jqxhr = jqxhr;
                         })
                         .fail(function (jqxhr) {
                             _jqxhr = jqxhr;
                         })
                         .always(function () {
                             x_object_type = _jqxhr.getResponseHeader('x-object-type');

                             if (x_object_type in metered_object_types) {
                                 apply_pq_callback(callback, x_object_type);
                             } else {
                                 
                                 console.info(
                                     "Passage Quota: exiting because object type is not metered as determined by ajax call");
                             }
                         });
                    }

                    function apply_pq_callback(callback, object_type) {
                        backend_facade.object_type = object_type;
                        callback(object_type);
                    }
                }
            };
        })();

        var pq_metrics = (function (cmg) {
            cmg.metrics_consolidator = metrics_consolidator(
                ["meter_count/meter_max", "content_view_type"],
                10000
            );

            var cookie_name_prefix = 'cmg-quota-metrics-';
            var metrics_interface, metrics_obj, metrics_obj_name;
            var captured_metrics = {};

            if (flipper.is_active("DTMmetrics_Enable")) {
                

                metrics_obj_name = "cmg.DDO";

                metrics_interface = {
                    track_converted_users: function(elem, modal_value) {
                        if (has_metrics_obj()) {
                            metrics_obj.action(
                                "accessMeter",
                                { site_element_name: modal_value,
                                  site_element_action: "click" });
                        }
                    },
                    track_meter_count: function(count, max) {
                        if (has_metrics_obj()) {
                            metrics_obj.accessMeterData.meter_count = count.toString();
                            metrics_obj.accessMeterData.meter_max = max.toString();
                        }
                    },
                    track_content_view_type: function (metered) {
                        if (has_metrics_obj()) {
                            var view_type_value;
                            if (metered) {
                                view_type_value = "metered";
                            } else {
                                view_type_value = "non-metered";
                            }
                            metrics_obj.accessMeterData.meter_content_view_type = view_type_value;
                        }
                    }
                }

            } else {
                

                var view_offers = {
                    eVar: 'eVar71',
                    prop: 'prop71',
                    event: '75',
                    desc: "Meter Interaction",
                    other_metrics: ['2', '48']
                };
                var meter_count = {
                    eVar: 'eVar72',
                    prop: 'prop72',
                    desc: "Current Page #",
                    cookie: 'pq-count',
                    default_val: '0',
                    maxmet: "maxmet",
                    pre_cookie: function (value) {
                        if (captured_metrics[this.prop] === this.maxmet &&
                            captured_metrics[this.eVar] === this.maxmet &&
                            captured_metrics[meter_max.prop] === value &&
                            captured_metrics[meter_max.eVar] === value) {
                                value = this.maxmet;
                        }
                        return value;
                    },
                    pre_capture: function (value) {
                        if (search_referrer.check()) {
                            value += ":search";
                        }
                        return value;
                    }
                };
                var meter_max = {
                    eVar: 'eVar73',
                    prop: 'prop73',
                    desc: "Max Page #",
                    cookie: 'pq-max',
                    default_val: backend_facade.site_settings.reg_visits_threshold.toString()
                };
                var meter_content_view_type = {
                    eVar: 'eVar52',
                    prop: 'prop52',
                    desc: "Content View Type",
                    default_val: "non-metered"
                };

                metrics_obj_name = "cmg.s_coxnews";

                function track_event(params, elem, value) {
                    if (has_metrics_obj()) {
                        var other;
                        var payload = [params.event,
                                       elem,
                                       [params.eVar, params.prop, value]];
                        for (var i=0; i < params.other_metrics.length; i++) {
                            other = params.other_metrics[i];
                            payload.push(['eVar' + other, 'prop' + other,
                                          metrics_obj['eVar' + other]]);
                        }
                        payload.push(params.desc);
                        metrics_obj.utilities.track_event.apply(null, payload);
                        captured_metrics[params.eVar] = captured_metrics[params.prop] = value;
                    }
                }

                function track_non_event(params, value) {
                    if (has_metrics_obj()) {
                        if (typeof(params.pre_cookie) === "function") {
                            

                            value = params.pre_cookie(value);
                        }

                        value = check_with_cookie(params.cookie, value);
                        if (typeof(value) === "undefined" || value === null) {
                            value = params.default_val;
                        }

                        if (typeof(params.pre_capture) === "function") {
                            

                            value = params.pre_capture(value);
                        }
                        metrics_obj[params.eVar] = metrics_obj[params.prop] = value;
                        captured_metrics[params.eVar] = captured_metrics[params.prop] = value;
                    }
                }

                metrics_interface = {
                    track_converted_users: function(elem, modal_value) {
                        

                        track_event(view_offers, elem, modal_value);
                    },
                    track_meter_count: function (count, max) {
                        if (typeof(count) !== "undefined" &&
                            typeof(max) !== "undefined") {
                                cmg.metrics_consolidator.apply_on_ready(
                                    function (count_value, max_value) {
                                        track_non_event(meter_count, count_value);
                                        track_non_event(meter_max, max_value);
                                    },
                                    "meter_count/meter_max",
                                    [count.toString(), max.toString()]
                                );
                        } else {
                            track_non_event(meter_count);
                            track_non_event(meter_max);
                        }
                    },
                    track_content_view_type: function (metered) {
                        if (typeof(metered) !== "undefined") {
                            var view_type_value;
                            if (metered) {
                                view_type_value = "metered";
                            } else {
                                view_type_value = "non-metered";
                            }
                            cmg.metrics_consolidator.apply_on_ready(
                                track_non_event,
                                "content_view_type",
                                [meter_content_view_type, view_type_value]
                            );
                        } else {
                            track_non_event(meter_content_view_type);
                        }
                    }
                }
            }

            return {
                track_converted_users: function (elem, modal_id) {
                    var modal_value;
                    if (modal_id === backend_facade.modal_content_names.STICKY_MODAL) {
                        modal_value = "view all offers: sticky";
                    } else if (
                        modal_id === backend_facade.modal_content_names.ROADBLOCK_MODAL) {
                            modal_value = "view all offers: roadblock";
                    }
                    metrics_interface.track_converted_users(elem, modal_value);
                },
                track_meter_count: metrics_interface.track_meter_count,
                track_content_view_type: metrics_interface.track_content_view_type
            }

            function check_with_cookie(cookie_name, value) {
                if (typeof(cookie_name) !== "undefined") {
                    cookie_name = cookie_name_prefix + cookie_name;

                    if (typeof(value) !== "undefined") {
                        $.cookie(cookie_name, value,
                                 {expires: cmg.passage_quota.get_pq_cookie_expiry_date(),
                                  path: '/',
                                  domain: '.' + root_domain,
                                 });
                    } else {
                        value = $.cookie(cookie_name,
                                         {path: '/',
                                          domain: '.' + root_domain});
                    }
                }
                return value;
            }

            function has_metrics_obj () {
                metrics_obj = metrics_obj || eval(metrics_obj_name);

                if (typeof(metrics_obj) !== "undefined") {
                    return true
                } else {
                    console.error("PQ Metrics: metrics not captured because " +
                                  metrics_obj_name + " is undefined");
                    return false
                }
            }

            function metrics_consolidator (expected_other_metrics, base_metric_timeout) {
                   /*
                    * This metric consolidator delays sending the page's metrics until
                    * the Access Meter has its metrics tagged on to the metrics.
                    * Once the Access Meter metrics are tagged, then the
                    * main metrics call is finally applied.
                    *
                    * If the Access Meter fails to provide its side of metrics, then after
                    * a timeout, the main call is applied anyway.
                    *
                    * This is currently working with omniture. It is yet to be determined
                    * whether this will be needed when omniture is replaced with DTM.
                    */

                var other_metrics = {};
                reset_other_metrics();

                var applied = false;
                var metrics_base_call = false;

                return {
                    apply_on_ready: function(metric_callback, metric, args) {
                        args = args || {};

                        if (metric === "base") {
                            ensure_metrics_base_applied(base_metric_timeout);
                            metrics_base_call = metric_callback;

                        } else if (metric in other_metrics) {
                            metric_callback.apply(null, args);
                            other_metrics[metric] = true

                        } else {
                            console.warn("PQ Metrics: metric callback was not included in the initial setup, metric:",
                                         metric, "other metrics:", other_metrics);
                        }

                        if (metrics_base_call && all_other_metrics_applied()) {
                            applied = true;
                            metrics_base_call();
                            reset_metrics();
                        } else {
                            applied = false;
                        }
                    }
                };

                function reset_metrics() {
                    metrics_base_call = false;
                    reset_other_metrics();
                }

                function reset_other_metrics() {
                    $.each(expected_other_metrics, function (i, metric) {
                        other_metrics[metric] = false;
                    });
                }

                function ensure_metrics_base_applied(timeout) {
                    setTimeout(function () {
                        if (applied) {
                            console.info("PQ Metrics: metrics fired successfully with passage quota metrics consolidator");
                        } else {
                            metrics_base_call();
                            console.info("PQ Metrics: metrics fired w/o metrics consolidator");
                        }
                    }, timeout);
                }

                function all_other_metrics_applied() {
                    var all_applied = true;
                    $.each(other_metrics, function (metric, metric_applied) {
                        if (!metric_applied) {
                            all_applied = false;
                            return false; // break loop
                        }
                    });
                    return all_applied;
                }
            }
        })(cmg);

        cmg.passage_quota = new PassageQuota({
            max_visits: backend_facade.site_settings.reg_visits_threshold,
            period_length: "first_of_month",
            rolling_period: false,
            max_visit_conditions: [],
            
            callbacks_for_visits_left: {0: max_reached,
                                        1: upsell,
                                        4: welcome},
        });

        function max_reached(prev_return, visits_info, modal_handler) {
            if (prev_return.length) {
                prev_return.hide();

            } else {
                var allow_passage = visits_info.allow_passage;

                if (!allow_passage()) {
                    var element_names = backend_facade.modal_content_names;
                    var pq_modal = modal_handler.fetch_modal("#" + element_names.ROADBLOCK_MODAL);
                    var max_visits_elem = pq_modal.find("." + element_names.MAX_VISITS);

                    max_visits_elem.text(visits_info.visits_so_far + visits_info.visits_left);

                    return modal_handler.activate_roadblock_modal(pq_modal, allow_passage);
                }
                
            }
        }

        function upsell(prev_return, visits_info, modal_handler) {
            if (prev_return.length) {
                prev_return.hide();

            } else {
                var element_names = backend_facade.modal_content_names;
                var pq_modal = modal_handler.fetch_modal("#" + element_names.STICKY_MODAL);
                var max_visits_elem = pq_modal.find("." + element_names.MAX_VISITS);
                var visits_count_elem = pq_modal.find("." + element_names.VISITS_COUNT);

                max_visits_elem.text(visits_info.visits_so_far + visits_info.visits_left);
                visits_count_elem.text(visits_info.visits_so_far);

                if (visits_info.allow_passage())  {
                    return modal_handler.activate_upsell_modal(pq_modal, "viewed", ".pq-close-modal");
                }
            }
        }

        function welcome(prev_return, visits_info, modal_handler) {
            if (prev_return.length) {
                prev_return.hide();

            } else {
                var element_names = backend_facade.modal_content_names;
                var pq_modal = modal_handler.fetch_modal("#" + element_names.WELCOME_MODAL);
                var max_visits_elem = pq_modal.find("." + element_names.MAX_VISITS);

                max_visits_elem.text(visits_info.visits_so_far + visits_info.visits_left);

                if (visits_info.allow_passage())  {
                    return modal_handler.activate_upsell_modal(pq_modal, "viewed", ".pq-close-modal");
                }
            }
        }

        var user_status_pq = new UserStatusPQ(backend_facade);
        var auth_url = 'http://www.mystatesman.com/profile/janus-auth/';

        $(function () {
            
            pq_metrics.track_meter_count();

            pq_metrics.track_content_view_type();
        });

        if (plate.authorizationCheck) {
            plate.authorizationCheck(activate_pq);
        } else {
            cmg.authorization.check(auth_url, function(data) {
                activate_pq(data.authorized);
            });
        }

        function activate_pq(authorized) {
            

            user_status_pq.authorized(authorized, function(user_status_pq_authorized) {
                backend_facade.metered_object_type(function(object_type) {
                    pq_metrics.track_content_view_type(!!object_type);
                    cmg.passage_quota.check(user_status_pq_authorized,
                                            search_referrer.check(),
                                            object_type);
                });
            });
        }

    })((window.cmg || (window.cmg = {})), cmg.query || window.jQuery, window.janrain, window.plate || {});
;

      var _comscore = _comscore || [];
      _comscore.push({ c1: "2", c2: "6035944" });
      (function() {
        var s = document.createElement("script"), el = document.getElementsByTagName("script")[0]; s.async = true;
        s.src = (document.location.protocol == "https:" ? "https://sb" : "http://b") + ".scorecardresearch.com/beacon.js";
        el.parentNode.insertBefore(s, el);
      })();
    ;

      var _gaq = _gaq || [];
      _gaq.push(['_setAccount', "UA-12967861-32"]);
      _gaq.push(['_trackPageview']);
      (function() {
        var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
        ga.src = ('https:' == document.location.protocol ? 'https://' : 'http://') + 'stats.g.doubleclick.net/dc.js';
        var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
      })();
    ;
//create holder for qualtrics objects
cmg.cmg_qualtrics = {};

cmg.cmg_qualtrics.load = function(){
    //slightly modified zone loading script
    var cmg_qualtrics_zid = cmg.cmg_qualtrics.getMyQueryString("zid");
    if(cmg_qualtrics_zid != ""){
    var cmg_qualtrics_ed = '';
    var cmg_qualtrics_url='https://siteintercept.qualtrics.com/WRSiteInterceptEngine/?Q_ZID=' + cmg_qualtrics_zid  + cmg_qualtrics_ed;
    var cmg_qualtrics_sampleRate=parseInt(cmg.cmg_qualtrics.getMyQueryString("rate"));
    var q_si_f = function(){
        if (Math.random() >= cmg_qualtrics_sampleRate/100)
            return;
    var s=document.createElement('script');
        s.type='text/javascript';
        s.src=cmg_qualtrics_url+'&Q_LOC='+encodeURIComponent(window.location.href);
        if(document.body)document.body.appendChild(s);};
        try{if (window.addEventListener){
            window.addEventListener('load',q_si_f,false);
        }else if (window.attachEvent){
            r=window.attachEvent('onload',q_si_f);}
        else {}
        }catch(e){};
    }
}

cmg.cmg_qualtrics.getMyQueryString = function(key, default_) {
    //get the query string items for the current script
    //is there a utility object that may hold this?
    var scripts = document.getElementsByTagName('script');
    var index = scripts.length - 1;
    var myScript = scripts[index];
        if (default_ == null) default_ = "";
            key = key.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regex = new RegExp("[\\?&]" + key + "=([^&#]*)");
    var qs = regex.exec(myScript.src);
        if (qs == null)
            return default_;
        else
            return qs[1];
}
//load qualtrics zone
cmg.cmg_qualtrics.load();
;
cmg.update_auth_message = function() {
    var $ = cmg.query || jQuery;
    var cookie = $.cookie('ur_name', {path:'/'});
    if (typeof cookie === 'string' && cookie) {
        /* replace profile image, ajc is used because we need jp2 images currently */
        var profileURL = 'http://www.ajc.com/profile/avatar_jp2/' + cookie + '/';
        $('.profile-authed').attr('src', profileURL);
        $('.cmUserAuthed').show();
        $('.cmUserAnonymous').hide();
    } else {
        $('.cmUserAuthed').hide();
        $('.cmUserAnonymous').show();
    }
    $('#cmHeaderUserRegistration').css('visibility', 'visible');
};
cmg.query(document).ready(function(){
    var $ = cmg.query || jQuery;
    /* Larger mobile devices should be bigger, but still need to match our
     * breakpoints. There does not appear to be a @media @viewport query. */
    if(screen.width >= 768)
        $('#viewport').attr('content', 'width=600');
    /* Logout needs to occur on 'parent' domain, since wraps dont host auth */
    $('.prepend-site').each(function(){
        if($(this).attr('href').indexOf(cmg.site_meta.domain) == -1){
            $(this).attr('href', location.protocol + '//' + cmg.site_meta.domain + '/' + $(this).attr('data-href'));
        }
    });
    /* fix IE svg bug by setting width. first check ie<11, then 11, then 12 */
    var ua = window.navigator.userAgent;
    if(ua.indexOf("MSIE ") > -1 || ua.indexOf('Trident/') > -1 || ua.indexOf('Edge/') > -1){
        cmg.query.get(cmg.query('.header-logo')[0].src, function(svgxml){
            var svgWidth = svgxml.documentElement.attributes.width.value;
            cmg.query('.header-logo').width(svgWidth);
        });
    }
    /* Update twitter/facebook links */
    cmg.query('.facebook-link').attr('href', 'https://www.facebook.com/sharer/sharer.php?u=' + location.href);
    var twitterViaMap = {'myajc':'myajctweets', 'myaas':'statesman', 'mypbp':'pbpost', 'myddn':'daytondailynews'};
    var twitterLink = 'https://twitter.com/intent/tweet?url=' + location.href,
        title = cmg.query('meta[property="og:title"]').attr('content'),
        description = cmg.query('meta[property="og:description"]').attr('content');
    /* if og title or description are undefined, use page title. unsure if this fallback would happen. */
    var text = (!title || !description ? cmg.query('title').text() : title + ': ' + description);
    /* truncate text that would make link > 140 chars. Space, href=22, via */
    var textMaxLength = 140 - 1 - 22 -  6 - twitterViaMap[cmg.site_meta.site_name].length;
    if(text.length > textMaxLength){
        text = text.substr(0, textMaxLength - 3) + '...';
    }
    twitterLink += '&text=' + text +  '&via=' + twitterViaMap[cmg.site_meta.site_name];
    cmg.query('.twitter-link').attr('href', twitterLink);
    /* make twitter/facebook popups */
    cmg.query('.popup').click(function(event) {
        var width = 575,
            height = 400,
            left = (cmg.query(window).width() - width)  / 2,
            top = (cmg.query(window).height() - height) / 2,
            opts = 'status=1,width=' + width + ',height=' + height + ',top=' + top + ',left=' + left +
                "toolbar=no,menubar=no,scrollbars=no,resizable=no,location=no,directories=no,status=no";
        window.open(this.href, '', opts);
        return false;
    });
});
;
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'//www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WMW6FK');;

!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','//connect.facebook.net/en_US/fbevents.js');

fbq('init', '1039650726068308');
fbq('track', 'PageView');
;
plate.premium = true;;
//<![CDATA[
            
            
            

            
            var cx_siteName = "mystatesman";
            var cx_rsID = "coxstatesman";
            var cx_marketpath = "tx: austin";
            var cx_medium = "newspaper";

            var s_account = cx_rsID;

            
            if (("prod" == "prod") &&
                (!((/www.prod.mystatesman/.test(window.location.host))
                || (/m.prod.mystatesman/.test(window.location.host))))) {
                    if (cx_medium == "radio" || cx_medium == "tv" || cx_medium == "newspaper" ) {
                        s_account = s_account+",coxglobal";
                    }
                }
            else {
                
                s_account = "coxradiodev,coxnewspaperdev,coxtvdev";
            }
        //]]>;
/*
 *  ADOBE APPMEASUREMENT
 *  VERSION: 20141202
 *
 */


/*  Configuration  */
(function(){
	'use strict';
	window.Configuration = {
		PLAYER: {},
		VISITOR_API: {
			MARKETING_CLOUD_ORG_ID: '146234B8527835E10A490D44@AdobeOrg',
			NAMESPACE: 'coxnet',
			TRACKING_SERVER: 'coxnet.112.2o7.net'
		},
		APP_MEASUREMENT: {
			DEBUG: (document.cookie.match('(^|; )am_debug=([^;]*)')||0)[2],
			RSID: window.s_account,
			TRACKING_SERVER: 'coxnet.112.2o7.net'
		},
		HEARTBEAT: {}
	};
})();

/*  Adobe Visitor API for JavaScript version: 1.3.3  */
function Visitor(k,s){if(!k)throw"Visitor requires Adobe Marketing Cloud Org ID";var a=this;a.version="1.3.3";var h=window,m=h.Visitor;h.s_c_in||(h.s_c_il=[],h.s_c_in=0);a._c="Visitor";a._il=h.s_c_il;a._in=h.s_c_in;a._il[a._in]=a;h.s_c_in++;var x=h.document,j=h.O;j||(j=null);var i=h.P;i||(i=!0);var p=h.N;p||(p=!1);a.C=function(a){var c=0,b,e;if(a)for(b=0;b<a.length;b++)e=a.charCodeAt(b),c=(c<<5)-c+e,c&=c;return c};a.m=function(a){var c="0123456789",b="",e="",f,g=8,h=10,i=10;if(1==a){c+="ABCDEF";for(a=
0;16>a;a++)f=Math.floor(Math.random()*g),b+=c.substring(f,f+1),f=Math.floor(Math.random()*g),e+=c.substring(f,f+1),g=16;return b+"-"+e}for(a=0;19>a;a++)f=Math.floor(Math.random()*h),b+=c.substring(f,f+1),0==a&&9==f?h=3:(1==a||2==a)&&10!=h&&2>f?h=10:2<a&&(h=10),f=Math.floor(Math.random()*i),e+=c.substring(f,f+1),0==a&&9==f?i=3:(1==a||2==a)&&10!=i&&2>f?i=10:2<a&&(i=10);return b+e};a.I=function(){var a;!a&&h.location&&(a=h.location.hostname);if(a)if(/^[0-9.]+$/.test(a))a="";else{var c=a.split("."),b=
c.length-1,e=b-1;1<b&&2>=c[b].length&&(2==c[b-1].length||0>",ac,ad,ae,af,ag,ai,al,am,an,ao,aq,ar,as,at,au,aw,ax,az,ba,bb,be,bf,bg,bh,bi,bj,bm,bo,br,bs,bt,bv,bw,by,bz,ca,cc,cd,cf,cg,ch,ci,cl,cm,cn,co,cr,cu,cv,cw,cx,cz,de,dj,dk,dm,do,dz,ec,ee,eg,es,eu,fi,fm,fo,fr,ga,gb,gd,ge,gf,gg,gh,gi,gl,gm,gn,gp,gq,gr,gs,gt,gw,gy,hk,hm,hn,hr,ht,hu,id,ie,im,in,io,iq,ir,is,it,je,jo,jp,kg,ki,km,kn,kp,kr,ky,kz,la,lb,lc,li,lk,lr,ls,lt,lu,lv,ly,ma,mc,md,me,mg,mh,mk,ml,mn,mo,mp,mq,mr,ms,mt,mu,mv,mw,mx,my,na,nc,ne,nf,ng,nl,no,nr,nu,nz,om,pa,pe,pf,ph,pk,pl,pm,pn,pr,ps,pt,pw,py,qa,re,ro,rs,ru,rw,sa,sb,sc,sd,se,sg,sh,si,sj,sk,sl,sm,sn,so,sr,st,su,sv,sx,sy,sz,tc,td,tf,tg,th,tj,tk,tl,tm,tn,to,tp,tt,tv,tw,tz,ua,ug,uk,us,uy,uz,va,vc,ve,vg,vi,vn,vu,wf,ws,yt,nd,".indexOf(","+
c[b]+","))&&e--;if(0<e)for(a="";b>=e;)a=c[b]+(a?".":"")+a,b--}return a};a.cookieRead=function(a){var a=encodeURIComponent(a),c=(";"+x.cookie).split(" ").join(";"),b=c.indexOf(";"+a+"="),e=0>b?b:c.indexOf(";",b+1);return 0>b?"":decodeURIComponent(c.substring(b+2+a.length,0>e?c.length:e))};a.cookieWrite=function(d,c,b){var e=a.cookieLifetime,f,c=""+c,e=e?(""+e).toUpperCase():"";b&&"SESSION"!=e&&"NONE"!=e?(f=""!=c?parseInt(e?e:0):-60)?(b=new Date,b.setTime(b.getTime()+1E3*f)):1==b&&(b=new Date,f=b.getYear(),
b.setYear(f+2+(1900>f?1900:0))):b=0;return d&&"NONE"!=e?(x.cookie=encodeURIComponent(d)+"="+encodeURIComponent(c)+"; path=/;"+(b?" expires="+b.toGMTString()+";":"")+(a.cookieDomain?" domain="+a.cookieDomain+";":""),a.cookieRead(d)==c):0};a.e=j;a.w=function(a,c){try{"function"==typeof a?a.apply(h,c):a[1].apply(a[0],c)}catch(b){}};a.L=function(d,c){c&&(a.e==j&&(a.e={}),void 0==a.e[d]&&(a.e[d]=[]),a.e[d].push(c))};a.l=function(d,c){if(a.e!=j){var b=a.e[d];if(b)for(;0<b.length;)a.w(b.shift(),c)}};a.j=
j;a.J=function(d,c,b){!c&&b&&b();var e=x.getElementsByTagName("HEAD")[0],f=x.createElement("SCRIPT");f.type="text/javascript";f.setAttribute("async","async");f.src=c;e.firstChild?e.insertBefore(f,e.firstChild):e.appendChild(f);b&&(a.j==j&&(a.j={}),a.j[d]=setTimeout(b,a.loadTimeout))};a.H=function(d){a.j!=j&&a.j[d]&&(clearTimeout(a.j[d]),a.j[d]=0)};a.D=p;a.F=p;a.isAllowed=function(){if(!a.D&&(a.D=i,a.cookieRead(a.cookieName)||a.cookieWrite(a.cookieName,"T",1)))a.F=i;return a.F};a.a=j;a.c=j;var v=a.V;
v||(v="MC");var n=a.Y;n||(n="MCMID");var w=a.X;w||(w="MCCIDH");var y=a.W;y||(y="MCAS");var t=a.T;t||(t="A");var l=a.Q;l||(l="MCAID");var u=a.U;u||(u="AAM");var r=a.S;r||(r="MCAAMLH");var o=a.R;o||(o="MCAAMB");var q=a.Z;q||(q="NONE");a.t=0;a.B=function(){if(!a.t){var d=a.version;a.audienceManagerServer&&(d+="|"+a.audienceManagerServer);a.audienceManagerServerSecure&&(d+="|"+a.audienceManagerServerSecure);if(a.audienceManagerCustomerIDDPIDs)for(var c in a.audienceManagerCustomerIDDPIDs)!Object.prototype[c]&&
a.audienceManagerCustomerIDDPIDs[c]&&(d+=c+"="+a.audienceManagerCustomerIDDPIDs[c]);a.t=a.C(d)}return a.t};a.G=p;a.h=function(){if(!a.G){a.G=i;var d=a.B(),c=p,b=a.cookieRead(a.cookieName),e,f,g,h=new Date;a.a==j&&(a.a={});if(b&&"T"!=b){b=b.split("|");b[0].match(/^[\-0-9]+$/)&&(parseInt(b[0])!=d&&(c=i),b.shift());1==b.length%2&&b.pop();for(d=0;d<b.length;d+=2)e=b[d].split("-"),f=e[0],g=b[d+1],e=1<e.length?parseInt(e[1]):0,c&&(f==w&&(g=""),0<e&&(e=h.getTime()/1E3-60)),f&&g&&(a.d(f,g,1),0<e&&(a.a["expire"+
f]=e,h.getTime()>=1E3*e&&(a.c||(a.c={}),a.c[f]=i)))}if(!a.b(l)&&(b=a.cookieRead("s_vi")))b=b.split("|"),1<b.length&&0<=b[0].indexOf("v1")&&(g=b[1],d=g.indexOf("["),0<=d&&(g=g.substring(0,d)),g&&g.match(/^[0-9a-fA-F\-]+$/)&&a.d(l,g))}};a.M=function(){var d=a.B(),c,b;for(c in a.a)!Object.prototype[c]&&a.a[c]&&"expire"!=c.substring(0,6)&&(b=a.a[c],d+=(d?"|":"")+c+(a.a["expire"+c]?"-"+a.a["expire"+c]:"")+"|"+b);a.cookieWrite(a.cookieName,d,1)};a.b=function(d,c){return a.a!=j&&(c||!a.c||!a.c[d])?a.a[d]:
j};a.d=function(d,c,b){a.a==j&&(a.a={});a.a[d]=c;b||a.M()};a.p=function(d,c){var b=new Date;b.setTime(b.getTime()+1E3*c);a.a==j&&(a.a={});a.a["expire"+d]=Math.floor(b.getTime()/1E3);0>c?(a.c||(a.c={}),a.c[d]=i):a.c&&(a.c[d]=p)};a.A=function(a){if(a&&("object"==typeof a&&(a=a.d_mid?a.d_mid:a.visitorID?a.visitorID:a.id?a.id:a.uuid?a.uuid:""+a),a&&(a=a.toUpperCase(),"NOTARGET"==a&&(a=q)),!a||a!=q&&!a.match(/^[0-9a-fA-F\-]+$/)))a="";return a};a.i=function(d,c){a.H(d);a.g!=j&&(a.g[d]=p);if(d==v){var b=
a.b(n);if(!b){b="object"==typeof c&&c.mid?c.mid:a.A(c);if(!b){if(a.r){a.getAnalyticsVisitorID(null,!1,!0);return}b=a.m()}a.d(n,b)}if(!b||b==q)b="";"object"==typeof c&&((c.d_region||c.dcs_region||c.d_blob||c.blob)&&a.i(u,c),a.r&&c.mid&&a.i(t,{id:c.id}));a.l(n,[b])}if(d==u&&"object"==typeof c){b=604800;void 0!=c.id_sync_ttl&&c.id_sync_ttl&&(b=parseInt(c.id_sync_ttl));var e=a.b(r);e||((e=c.d_region)||(e=c.dcs_region),e&&(a.p(r,b),a.d(r,e)));e||(e="");a.l(r,[e]);e=a.b(o);if(c.d_blob||c.blob)(e=c.d_blob)||
(e=c.blob),a.p(o,b),a.d(o,e);e||(e="");a.l(o,[e]);!c.error_msg&&a.o&&a.d(w,a.o)}if(d==t){b=a.b(l);b||((b=a.A(c))?a.p(o,-1):b=q,a.d(l,b));if(!b||b==q)b="";a.l(l,[b])}};a.g=j;a.n=function(d,c,b,e){var f="",g;if(a.isAllowed()&&(a.h(),f=a.b(d),!f&&(d==n?g=v:d==r||d==o?g=u:d==l&&(g=t),g))){if(c&&(a.g==j||!a.g[g]))a.g==j&&(a.g={}),a.g[g]=i,a.J(g,c,function(){if(!a.b(d)){var b="";d==n&&(b=a.m());a.i(g,b)}});a.L(d,b);c||a.i(g,{id:q});return""}if((d==n||d==l)&&f==q)f="",e=i;b&&e&&a.w(b,[f]);return f};a._setMarketingCloudFields=
function(d){a.h();a.i(v,d)};a.setMarketingCloudVisitorID=function(d){a._setMarketingCloudFields(d)};a.r=p;a.getMarketingCloudVisitorID=function(d,c){return a.isAllowed()?(a.marketingCloudServer&&0>a.marketingCloudServer.indexOf(".demdex.net")&&(a.r=i),a.n(n,a.s("_setMarketingCloudFields"),d,c)):""};a.K=function(){a.getAudienceManagerBlob()};a.f={};a.z=p;a.o="";a.setCustomerIDs=function(d){a.f=d;if(a.isAllowed()){a.h();var d=a.b(w),c="",b,e;d||(d=0);for(b in a.f)e=a.f[b],!Object.prototype[b]&&e&&(c+=
(c?"|":"")+b+"|"+e);a.o=a.C(c);a.o!=d&&(a.z=i,a.K())}};a.getCustomerIDs=function(){return a.f};a._setAnalyticsFields=function(d){a.h();a.i(t,d)};a.setAnalyticsVisitorID=function(d){a._setAnalyticsFields(d)};a.getAnalyticsVisitorID=function(d,c,b){if(a.isAllowed()){var e="";b||(e=a.getMarketingCloudVisitorID(function(){a.getAnalyticsVisitorID(d,i)}));if(e||b){var f=b?a.marketingCloudServer:a.trackingServer,g="";a.loadSSL&&(b?a.marketingCloudServerSecure&&(f=a.marketingCloudServerSecure):a.trackingServerSecure&&
(f=a.trackingServerSecure));f&&(g="http"+(a.loadSSL?"s":"")+"://"+f+"/id?callback=s_c_il%5B"+a._in+"%5D._set"+(b?"MarketingCloud":"Analytics")+"Fields&mcorgid="+encodeURIComponent(a.marketingCloudOrgID)+(e?"&mid="+e:""));return a.n(b?n:l,g,d,c)}}return""};a._setAudienceManagerFields=function(d){a.h();a.i(u,d)};a.s=function(d){var c=a.audienceManagerServer,b="",e=a.b(n),f=a.b(o,i),g=a.b(l),g=g&&g!=q?"&d_cid_ic=AVID%01"+encodeURIComponent(g):"",h="",j,k;a.loadSSL&&a.audienceManagerServerSecure&&(c=
a.audienceManagerServerSecure);if(c){if(a.f)for(j in a.f)if(!Object.prototype[j]&&(b=a.f[j]))g+="&d_cid_ic="+encodeURIComponent(j)+"%01"+encodeURIComponent(b),a.audienceManagerCustomerIDDPIDs&&(k=a.audienceManagerCustomerIDDPIDs[j])&&(h+="&d_cid="+k+"%01"+encodeURIComponent(b));d||(d="_setAudienceManagerFields");b="http"+(a.loadSSL?"s":"")+"://"+c+"/id?d_rtbd=json&d_ver=2"+(!e&&a.r?"&d_verify=1":"")+"&d_orgid="+encodeURIComponent(a.marketingCloudOrgID)+(e?"&d_mid="+e:"")+(f?"&d_blob="+encodeURIComponent(f):
"")+g+h+"&d_cb=s_c_il%5B"+a._in+"%5D."+d}return b};a.getAudienceManagerLocationHint=function(d,c){if(a.isAllowed()&&a.getMarketingCloudVisitorID(function(){a.getAudienceManagerLocationHint(d,i)})){var b=a.b(l);b||(b=a.getAnalyticsVisitorID(function(){a.getAudienceManagerLocationHint(d,i)}));if(b)return a.n(r,a.s(),d,c)}return""};a.getAudienceManagerBlob=function(d,c){if(a.isAllowed()&&a.getMarketingCloudVisitorID(function(){a.getAudienceManagerBlob(d,i)})){var b=a.b(l);b||(b=a.getAnalyticsVisitorID(function(){a.getAudienceManagerBlob(d,
i)}));if(b)return b=a.s(),a.z&&a.p(o,-1),a.n(o,b,d,c)}return""};m.AUTH_STATE_UNAUTHENTICATED=0;m.AUTH_STATE_AUTHENTICATED=1;m.AUTH_STATE_ASSUMED_AUTHENTICATED=2;m.AUTH_STATE_LOGGEDOUT=3;a.setAuthState=function(d){a.isAllowed()&&(a.h(),a.d(y,d))};a.getAuthState=function(){return a.isAllowed()?(a.h(),a.b(y)):0};a.k="";a.q={};a.u="";a.v={};a.getSupplementalDataID=function(d,c){!a.k&&!c&&(a.k=a.m(1));var b=a.k;a.u&&!a.v[d]?(b=a.u,a.v[d]=i):b&&(a.q[d]&&(a.u=a.k,a.v=a.q,a.k=b=!c?a.m(1):"",a.q={}),b&&(a.q[d]=
i));return b};0>k.indexOf("@")&&(k+="@AdobeOrg");a.marketingCloudOrgID=k;a.namespace=s;a.cookieName="AMCV_"+k;a.cookieDomain=a.I();a.cookieDomain==h.location.hostname&&(a.cookieDomain="");if(s){var m="AMCV_"+s,A=a.cookieRead(a.cookieName),z=a.cookieRead(m);!A&&z&&(a.cookieWrite(a.cookieName,z,1),a.cookieWrite(m,"",-60))}a.loadSSL=0<=h.location.protocol.toLowerCase().indexOf("https");a.loadTimeout=500;a.marketingCloudServer=a.audienceManagerServer="dpm.demdex.net"}
Visitor.getInstance=function(k,s){var a,h=window.s_c_il,m;0>k.indexOf("@")&&(k+="@AdobeOrg");if(h)for(m=0;m<h.length;m++)if((a=h[m])&&"Visitor"==a._c&&(a.marketingCloudOrgID==k||s&&a.namespace==s))return a;return new Visitor(k,s)};

/*  AppMeasurement for JavaScript version: 1.4.1  */
function AppMeasurement(){var s=this;s.version="1.4.1";var w=window;if(!w.s_c_in)w.s_c_il=[],w.s_c_in=0;s._il=w.s_c_il;s._in=w.s_c_in;s._il[s._in]=s;w.s_c_in++;s._c="s_c";var k=w.sb;k||(k=null);var m=w,i,o;try{i=m.parent;for(o=m.location;i&&i.location&&o&&""+i.location!=""+o&&m.location&&""+i.location!=""+m.location&&i.location.host==o.host;)m=i,i=m.parent}catch(p){}s.eb=function(s){try{console.log(s)}catch(a){}};s.ta=function(s){return""+parseInt(s)==""+s};s.replace=function(s,a,c){if(!s||s.indexOf(a)<
0)return s;return s.split(a).join(c)};s.escape=function(b){var a,c;if(!b)return b;b=encodeURIComponent(b);for(a=0;a<7;a++)c="+~!*()'".substring(a,a+1),b.indexOf(c)>=0&&(b=s.replace(b,c,"%"+c.charCodeAt(0).toString(16).toUpperCase()));return b};s.unescape=function(b){if(!b)return b;b=b.indexOf("+")>=0?s.replace(b,"+"," "):b;try{return decodeURIComponent(b)}catch(a){}return unescape(b)};s.Va=function(){var b=w.location.hostname,a=s.fpCookieDomainPeriods,c;if(!a)a=s.cookieDomainPeriods;if(b&&!s.cookieDomain&&
!/^[0-9.]+$/.test(b)&&(a=a?parseInt(a):2,a=a>2?a:2,c=b.lastIndexOf("."),c>=0)){for(;c>=0&&a>1;)c=b.lastIndexOf(".",c-1),a--;s.cookieDomain=c>0?b.substring(c):b}return s.cookieDomain};s.c_r=s.cookieRead=function(b){b=s.escape(b);var a=" "+s.d.cookie,c=a.indexOf(" "+b+"="),e=c<0?c:a.indexOf(";",c);b=c<0?"":s.unescape(a.substring(c+2+b.length,e<0?a.length:e));return b!="[[B]]"?b:""};s.c_w=s.cookieWrite=function(b,a,c){var e=s.Va(),d=s.cookieLifetime,f;a=""+a;d=d?(""+d).toUpperCase():"";c&&d!="SESSION"&&
d!="NONE"&&((f=a!=""?parseInt(d?d:0):-60)?(c=new Date,c.setTime(c.getTime()+f*1E3)):c==1&&(c=new Date,f=c.getYear(),c.setYear(f+5+(f<1900?1900:0))));if(b&&d!="NONE")return s.d.cookie=b+"="+s.escape(a!=""?a:"[[B]]")+"; path=/;"+(c&&d!="SESSION"?" expires="+c.toGMTString()+";":"")+(e?" domain="+e+";":""),s.cookieRead(b)==a;return 0};s.C=[];s.B=function(b,a,c){if(s.ma)return 0;if(!s.maxDelay)s.maxDelay=250;var e=0,d=(new Date).getTime()+s.maxDelay,f=s.d.qb,g=["webkitvisibilitychange","visibilitychange"];
if(!f)f=s.d.rb;if(f&&f=="prerender"){if(!s.X){s.X=1;for(c=0;c<g.length;c++)s.d.addEventListener(g[c],function(){var a=s.d.qb;if(!a)a=s.d.rb;if(a=="visible")s.X=0,s.delayReady()})}e=1;d=0}else c||s.q("_d")&&(e=1);e&&(s.C.push({m:b,a:a,t:d}),s.X||setTimeout(s.delayReady,s.maxDelay));return e};s.delayReady=function(){var b=(new Date).getTime(),a=0,c;for(s.q("_d")&&(a=1);s.C.length>0;){c=s.C.shift();if(a&&!c.t&&c.t>b){s.C.unshift(c);setTimeout(s.delayReady,parseInt(s.maxDelay/2));break}s.ma=1;s[c.m].apply(s,
c.a);s.ma=0}};s.setAccount=s.sa=function(b){var a,c;if(!s.B("setAccount",arguments))if(s.account=b,s.allAccounts){a=s.allAccounts.concat(b.split(","));s.allAccounts=[];a.sort();for(c=0;c<a.length;c++)(c==0||a[c-1]!=a[c])&&s.allAccounts.push(a[c])}else s.allAccounts=b.split(",")};s.foreachVar=function(b,a){var c,e,d,f,g="";d=e="";if(s.lightProfileID)c=s.H,(g=s.lightTrackVars)&&(g=","+g+","+s.ba.join(",")+",");else{c=s.c;if(s.pe||s.linkType)if(g=s.linkTrackVars,e=s.linkTrackEvents,s.pe&&(d=s.pe.substring(0,
1).toUpperCase()+s.pe.substring(1),s[d]))g=s[d].pb,e=s[d].ob;g&&(g=","+g+","+s.z.join(",")+",");e&&g&&(g+=",events,")}a&&(a=","+a+",");for(e=0;e<c.length;e++)d=c[e],(f=s[d])&&(!g||g.indexOf(","+d+",")>=0)&&(!a||a.indexOf(","+d+",")>=0)&&b(d,f)};s.J=function(b,a,c,e,d){var f="",g,j,w,q,i=0;b=="contextData"&&(b="c");if(a){for(g in a)if(!Object.prototype[g]&&(!d||g.substring(0,d.length)==d)&&a[g]&&(!c||c.indexOf(","+(e?e+".":"")+g+",")>=0)){w=!1;if(i)for(j=0;j<i.length;j++)g.substring(0,i[j].length)==
i[j]&&(w=!0);if(!w&&(f==""&&(f+="&"+b+"."),j=a[g],d&&(g=g.substring(d.length)),g.length>0))if(w=g.indexOf("."),w>0)j=g.substring(0,w),w=(d?d:"")+j+".",i||(i=[]),i.push(w),f+=s.J(j,a,c,e,w);else if(typeof j=="boolean"&&(j=j?"true":"false"),j){if(e=="retrieveLightData"&&d.indexOf(".contextData.")<0)switch(w=g.substring(0,4),q=g.substring(4),g){case "transactionID":g="xact";break;case "channel":g="ch";break;case "campaign":g="v0";break;default:s.ta(q)&&(w=="prop"?g="c"+q:w=="eVar"?g="v"+q:w=="list"?
g="l"+q:w=="hier"&&(g="h"+q,j=j.substring(0,255)))}f+="&"+s.escape(g)+"="+s.escape(j)}}f!=""&&(f+="&."+b)}return f};s.Xa=function(){var b="",a,c,e,d,f,g,j,w,i="",k="",m=c="";if(s.lightProfileID)a=s.H,(i=s.lightTrackVars)&&(i=","+i+","+s.ba.join(",")+",");else{a=s.c;if(s.pe||s.linkType)if(i=s.linkTrackVars,k=s.linkTrackEvents,s.pe&&(c=s.pe.substring(0,1).toUpperCase()+s.pe.substring(1),s[c]))i=s[c].pb,k=s[c].ob;i&&(i=","+i+","+s.z.join(",")+",");k&&(k=","+k+",",i&&(i+=",events,"));s.events2&&(m+=(m!=
""?",":"")+s.events2)}s.AudienceManagement&&s.AudienceManagement.isReady()&&(b+=s.J("d",s.AudienceManagement.getEventCallConfigParams()));for(c=0;c<a.length;c++){d=a[c];f=s[d];e=d.substring(0,4);g=d.substring(4);!f&&d=="events"&&m&&(f=m,m="");if(f&&(!i||i.indexOf(","+d+",")>=0)){switch(d){case "supplementalDataID":d="sdid";break;case "timestamp":d="ts";break;case "dynamicVariablePrefix":d="D";break;case "visitorID":d="vid";break;case "marketingCloudVisitorID":d="mid";break;case "analyticsVisitorID":d=
"aid";break;case "audienceManagerLocationHint":d="aamlh";break;case "audienceManagerBlob":d="aamb";break;case "authState":d="as";break;case "pageURL":d="g";if(f.length>255)s.pageURLRest=f.substring(255),f=f.substring(0,255);break;case "pageURLRest":d="-g";break;case "referrer":d="r";break;case "vmk":case "visitorMigrationKey":d="vmt";break;case "visitorMigrationServer":d="vmf";s.ssl&&s.visitorMigrationServerSecure&&(f="");break;case "visitorMigrationServerSecure":d="vmf";!s.ssl&&s.visitorMigrationServer&&
(f="");break;case "charSet":d="ce";break;case "visitorNamespace":d="ns";break;case "cookieDomainPeriods":d="cdp";break;case "cookieLifetime":d="cl";break;case "variableProvider":d="vvp";break;case "currencyCode":d="cc";break;case "channel":d="ch";break;case "transactionID":d="xact";break;case "campaign":d="v0";break;case "latitude":d="lat";break;case "longitude":d="lon";break;case "resolution":d="s";break;case "colorDepth":d="c";break;case "javascriptVersion":d="j";break;case "javaEnabled":d="v";
break;case "cookiesEnabled":d="k";break;case "browserWidth":d="bw";break;case "browserHeight":d="bh";break;case "connectionType":d="ct";break;case "homepage":d="hp";break;case "events":m&&(f+=(f!=""?",":"")+m);if(k){g=f.split(",");f="";for(e=0;e<g.length;e++)j=g[e],w=j.indexOf("="),w>=0&&(j=j.substring(0,w)),w=j.indexOf(":"),w>=0&&(j=j.substring(0,w)),k.indexOf(","+j+",")>=0&&(f+=(f?",":"")+g[e])}break;case "events2":f="";break;case "contextData":b+=s.J("c",s[d],i,d);f="";break;case "lightProfileID":d=
"mtp";break;case "lightStoreForSeconds":d="mtss";s.lightProfileID||(f="");break;case "lightIncrementBy":d="mti";s.lightProfileID||(f="");break;case "retrieveLightProfiles":d="mtsr";break;case "deleteLightProfiles":d="mtsd";break;case "retrieveLightData":s.retrieveLightProfiles&&(b+=s.J("mts",s[d],i,d));f="";break;default:s.ta(g)&&(e=="prop"?d="c"+g:e=="eVar"?d="v"+g:e=="list"?d="l"+g:e=="hier"&&(d="h"+g,f=f.substring(0,255)))}f&&(b+="&"+d+"="+(d.substring(0,3)!="pev"?s.escape(f):f))}d=="pev3"&&s.g&&
(b+=s.g)}return b};s.u=function(s){var a=s.tagName;if(""+s.wb!="undefined"||""+s.ib!="undefined"&&(""+s.ib).toUpperCase()!="HTML")return"";a=a&&a.toUpperCase?a.toUpperCase():"";a=="SHAPE"&&(a="");a&&((a=="INPUT"||a=="BUTTON")&&s.type&&s.type.toUpperCase?a=s.type.toUpperCase():!a&&s.href&&(a="A"));return a};s.oa=function(s){var a=s.href?s.href:"",c,e,d;c=a.indexOf(":");e=a.indexOf("?");d=a.indexOf("/");if(a&&(c<0||e>=0&&c>e||d>=0&&c>d))e=s.protocol&&s.protocol.length>1?s.protocol:l.protocol?l.protocol:
"",c=l.pathname.lastIndexOf("/"),a=(e?e+"//":"")+(s.host?s.host:l.host?l.host:"")+(h.substring(0,1)!="/"?l.pathname.substring(0,c<0?0:c)+"/":"")+a;return a};s.D=function(b){var a=s.u(b),c,e,d="",f=0;if(a){c=b.protocol;e=b.onclick;if(b.href&&(a=="A"||a=="AREA")&&(!e||!c||c.toLowerCase().indexOf("javascript")<0))d=s.oa(b);else if(e)d=s.replace(s.replace(s.replace(s.replace(""+e,"\r",""),"\n",""),"\t","")," ",""),f=2;else if(a=="INPUT"||a=="SUBMIT"){if(b.value)d=b.value;else if(b.innerText)d=b.innerText;
else if(b.textContent)d=b.textContent;f=3}else if(b.src&&a=="IMAGE")d=b.src;if(d)return{id:d.substring(0,100),type:f}}return 0};s.tb=function(b){for(var a=s.u(b),c=s.D(b);b&&!c&&a!="BODY";)if(b=b.parentElement?b.parentElement:b.parentNode)a=s.u(b),c=s.D(b);if(!c||a=="BODY")b=0;if(b&&(a=b.onclick?""+b.onclick:"",a.indexOf(".tl(")>=0||a.indexOf(".trackLink(")>=0))b=0;return b};s.hb=function(){var b,a,c=s.linkObject,e=s.linkType,d=s.linkURL,f,g;s.ca=1;if(!c)s.ca=0,c=s.clickObject;if(c){b=s.u(c);for(a=
s.D(c);c&&!a&&b!="BODY";)if(c=c.parentElement?c.parentElement:c.parentNode)b=s.u(c),a=s.D(c);if(!a||b=="BODY")c=0;if(c){var j=c.onclick?""+c.onclick:"";if(j.indexOf(".tl(")>=0||j.indexOf(".trackLink(")>=0)c=0}}else s.ca=1;!d&&c&&(d=s.oa(c));d&&!s.linkLeaveQueryString&&(f=d.indexOf("?"),f>=0&&(d=d.substring(0,f)));if(!e&&d){var i=0,k=0,m;if(s.trackDownloadLinks&&s.linkDownloadFileTypes){j=d.toLowerCase();f=j.indexOf("?");g=j.indexOf("#");f>=0?g>=0&&g<f&&(f=g):f=g;f>=0&&(j=j.substring(0,f));f=s.linkDownloadFileTypes.toLowerCase().split(",");
for(g=0;g<f.length;g++)(m=f[g])&&j.substring(j.length-(m.length+1))=="."+m&&(e="d")}if(s.trackExternalLinks&&!e&&(j=d.toLowerCase(),s.ra(j))){if(!s.linkInternalFilters)s.linkInternalFilters=w.location.hostname;f=0;s.linkExternalFilters?(f=s.linkExternalFilters.toLowerCase().split(","),i=1):s.linkInternalFilters&&(f=s.linkInternalFilters.toLowerCase().split(","));if(f){for(g=0;g<f.length;g++)m=f[g],j.indexOf(m)>=0&&(k=1);k?i&&(e="e"):i||(e="e")}}}s.linkObject=c;s.linkURL=d;s.linkType=e;if(s.trackClickMap||
s.trackInlineStats)if(s.g="",c){e=s.pageName;d=1;c=c.sourceIndex;if(!e)e=s.pageURL,d=0;if(w.s_objectID)a.id=w.s_objectID,c=a.type=1;if(e&&a&&a.id&&b)s.g="&pid="+s.escape(e.substring(0,255))+(d?"&pidt="+d:"")+"&oid="+s.escape(a.id.substring(0,100))+(a.type?"&oidt="+a.type:"")+"&ot="+b+(c?"&oi="+c:"")}};s.Ya=function(){var b=s.ca,a=s.linkType,c=s.linkURL,e=s.linkName;if(a&&(c||e))a=a.toLowerCase(),a!="d"&&a!="e"&&(a="o"),s.pe="lnk_"+a,s.pev1=c?s.escape(c):"",s.pev2=e?s.escape(e):"",b=1;s.abort&&(b=
0);if(s.trackClickMap||s.trackInlineStats){a={};c=0;var d=s.cookieRead("s_sq"),f=d?d.split("&"):0,g,j,w;d=0;if(f)for(g=0;g<f.length;g++)j=f[g].split("="),e=s.unescape(j[0]).split(","),j=s.unescape(j[1]),a[j]=e;e=s.account.split(",");if(b||s.g){b&&!s.g&&(d=1);for(j in a)if(!Object.prototype[j])for(g=0;g<e.length;g++){d&&(w=a[j].join(","),w==s.account&&(s.g+=(j.charAt(0)!="&"?"&":"")+j,a[j]=[],c=1));for(f=0;f<a[j].length;f++)w=a[j][f],w==e[g]&&(d&&(s.g+="&u="+s.escape(w)+(j.charAt(0)!="&"?"&":"")+j+
"&u=0"),a[j].splice(f,1),c=1)}b||(c=1);if(c){d="";g=2;!b&&s.g&&(d=s.escape(e.join(","))+"="+s.escape(s.g),g=1);for(j in a)!Object.prototype[j]&&g>0&&a[j].length>0&&(d+=(d?"&":"")+s.escape(a[j].join(","))+"="+s.escape(j),g--);s.cookieWrite("s_sq",d)}}}return b};s.Za=function(){if(!s.nb){var b=new Date,a=m.location,c,e,d=e=c="",f="",g="",w="1.2",i=s.cookieWrite("s_cc","true",0)?"Y":"N",k="",n="";if(b.setUTCDate&&(w="1.3",(0).toPrecision&&(w="1.5",b=[],b.forEach))){w="1.6";e=0;c={};try{e=new Iterator(c),
e.next&&(w="1.7",b.reduce&&(w="1.8",w.trim&&(w="1.8.1",Date.parse&&(w="1.8.2",Object.create&&(w="1.8.5")))))}catch(o){}}c=screen.width+"x"+screen.height;d=navigator.javaEnabled()?"Y":"N";e=screen.pixelDepth?screen.pixelDepth:screen.colorDepth;f=s.w.innerWidth?s.w.innerWidth:s.d.documentElement.offsetWidth;g=s.w.innerHeight?s.w.innerHeight:s.d.documentElement.offsetHeight;try{s.b.addBehavior("#default#homePage"),k=s.b.ub(a)?"Y":"N"}catch(p){}try{s.b.addBehavior("#default#clientCaps"),n=s.b.connectionType}catch(r){}s.resolution=
c;s.colorDepth=e;s.javascriptVersion=w;s.javaEnabled=d;s.cookiesEnabled=i;s.browserWidth=f;s.browserHeight=g;s.connectionType=n;s.homepage=k;s.nb=1}};s.I={};s.loadModule=function(b,a){var c=s.I[b];if(!c){c=w["AppMeasurement_Module_"+b]?new w["AppMeasurement_Module_"+b](s):{};s.I[b]=s[b]=c;c.Fa=function(){return c.Ja};c.Ka=function(a){if(c.Ja=a)s[b+"_onLoad"]=a,s.B(b+"_onLoad",[s,c],1)||a(s,c)};try{Object.defineProperty?Object.defineProperty(c,"onLoad",{get:c.Fa,set:c.Ka}):c._olc=1}catch(e){c._olc=
1}}a&&(s[b+"_onLoad"]=a,s.B(b+"_onLoad",[s,c],1)||a(s,c))};s.q=function(b){var a,c;for(a in s.I)if(!Object.prototype[a]&&(c=s.I[a])){if(c._olc&&c.onLoad)c._olc=0,c.onLoad(s,c);if(c[b]&&c[b]())return 1}return 0};s.bb=function(){var b=Math.floor(Math.random()*1E13),a=s.visitorSampling,c=s.visitorSamplingGroup;c="s_vsn_"+(s.visitorNamespace?s.visitorNamespace:s.account)+(c?"_"+c:"");var e=s.cookieRead(c);if(a){e&&(e=parseInt(e));if(!e){if(!s.cookieWrite(c,b))return 0;e=b}if(e%1E4>v)return 0}return 1};
s.K=function(b,a){var c,e,d,f,g,w;for(c=0;c<2;c++){e=c>0?s.ia:s.c;for(d=0;d<e.length;d++)if(f=e[d],(g=b[f])||b["!"+f]){if(!a&&(f=="contextData"||f=="retrieveLightData")&&s[f])for(w in s[f])g[w]||(g[w]=s[f][w]);s[f]=g}}};s.Aa=function(b,a){var c,e,d,f;for(c=0;c<2;c++){e=c>0?s.ia:s.c;for(d=0;d<e.length;d++)f=e[d],b[f]=s[f],!a&&!b[f]&&(b["!"+f]=1)}};s.Ua=function(s){var a,c,e,d,f,g=0,w,i="",k="";if(s&&s.length>255&&(a=""+s,c=a.indexOf("?"),c>0&&(w=a.substring(c+1),a=a.substring(0,c),d=a.toLowerCase(),
e=0,d.substring(0,7)=="http://"?e+=7:d.substring(0,8)=="https://"&&(e+=8),c=d.indexOf("/",e),c>0&&(d=d.substring(e,c),f=a.substring(c),a=a.substring(0,c),d.indexOf("google")>=0?g=",q,ie,start,search_key,word,kw,cd,":d.indexOf("yahoo.co")>=0&&(g=",p,ei,"),g&&w)))){if((s=w.split("&"))&&s.length>1){for(e=0;e<s.length;e++)d=s[e],c=d.indexOf("="),c>0&&g.indexOf(","+d.substring(0,c)+",")>=0?i+=(i?"&":"")+d:k+=(k?"&":"")+d;i&&k?w=i+"&"+k:k=""}c=253-(w.length-k.length)-a.length;s=a+(c>0?f.substring(0,c):
"")+"?"+w}return s};s.U=!1;s.O=!1;s.Ia=function(b){s.marketingCloudVisitorID=b;s.O=!0;s.k()};s.R=!1;s.L=!1;s.Ca=function(b){s.analyticsVisitorID=b;s.L=!0;s.k()};s.T=!1;s.N=!1;s.Ea=function(b){s.audienceManagerLocationHint=b;s.N=!0;s.k()};s.S=!1;s.M=!1;s.Da=function(b){s.audienceManagerBlob=b;s.M=!0;s.k()};s.isReadyToTrack=function(){var b=!0,a=s.visitor;if(a&&a.isAllowed()){if(!s.U&&!s.marketingCloudVisitorID&&a.getMarketingCloudVisitorID&&(s.U=!0,s.marketingCloudVisitorID=a.getMarketingCloudVisitorID([s,
s.Ia]),s.marketingCloudVisitorID))s.O=!0;if(!s.R&&!s.analyticsVisitorID&&a.getAnalyticsVisitorID&&(s.R=!0,s.analyticsVisitorID=a.getAnalyticsVisitorID([s,s.Ca]),s.analyticsVisitorID))s.L=!0;if(!s.T&&!s.audienceManagerLocationHint&&a.getAudienceManagerLocationHint&&(s.T=!0,s.audienceManagerLocationHint=a.getAudienceManagerLocationHint([s,s.Ea]),s.audienceManagerLocationHint))s.N=!0;if(!s.S&&!s.audienceManagerBlob&&a.getAudienceManagerBlob&&(s.S=!0,s.audienceManagerBlob=a.getAudienceManagerBlob([s,
s.Da]),s.audienceManagerBlob))s.M=!0;if(s.U&&!s.O&&!s.marketingCloudVisitorID||s.R&&!s.L&&!s.analyticsVisitorID||s.T&&!s.N&&!s.audienceManagerLocationHint||s.S&&!s.M&&!s.audienceManagerBlob)b=!1}return b};s.j=k;s.l=0;s.callbackWhenReadyToTrack=function(b,a,c){var e;e={};e.Oa=b;e.Na=a;e.La=c;if(s.j==k)s.j=[];s.j.push(e);if(s.l==0)s.l=setInterval(s.k,100)};s.k=function(){var b;if(s.isReadyToTrack()){if(s.l)clearInterval(s.l),s.l=0;if(s.j!=k)for(;s.j.length>0;)b=s.j.shift(),b.Na.apply(b.Oa,b.La)}};s.Ga=
function(b){var a,c,e=k,d=k;if(!s.isReadyToTrack()){a=[];if(b!=k)for(c in e={},b)e[c]=b[c];d={};s.Aa(d,!0);a.push(e);a.push(d);s.callbackWhenReadyToTrack(s,s.track,a);return!0}return!1};s.Wa=function(){var b=s.cookieRead("s_fid"),a="",c="",e;e=8;var d=4;if(!b||b.indexOf("-")<0){for(b=0;b<16;b++)e=Math.floor(Math.random()*e),a+="0123456789ABCDEF".substring(e,e+1),e=Math.floor(Math.random()*d),c+="0123456789ABCDEF".substring(e,e+1),e=d=16;b=a+"-"+c}s.cookieWrite("s_fid",b,1)||(b=0);return b};s.t=s.track=
function(b,a){var c,e=new Date,d="s"+Math.floor(e.getTime()/108E5)%10+Math.floor(Math.random()*1E13),f=e.getYear();f="t="+s.escape(e.getDate()+"/"+e.getMonth()+"/"+(f<1900?f+1900:f)+" "+e.getHours()+":"+e.getMinutes()+":"+e.getSeconds()+" "+e.getDay()+" "+e.getTimezoneOffset());if(s.visitor){if(s.visitor.getAuthState)s.authState=s.visitor.getAuthState();if(!s.supplementalDataID&&s.visitor.getSupplementalDataID)s.supplementalDataID=s.visitor.getSupplementalDataID("AppMeasurement:"+s._in,s.expectSupplementalData?
!1:!0)}s.q("_s");if(!s.B("track",arguments)){if(!s.Ga(b)){a&&s.K(a);b&&(c={},s.Aa(c,0),s.K(b));if(s.bb()){if(!s.analyticsVisitorID&&!s.marketingCloudVisitorID)s.fid=s.Wa();s.hb();s.usePlugins&&s.doPlugins&&s.doPlugins(s);if(s.account){if(!s.abort){if(s.trackOffline&&!s.timestamp)s.timestamp=Math.floor(e.getTime()/1E3);e=w.location;if(!s.pageURL)s.pageURL=e.href?e.href:e;if(!s.referrer&&!s.Ba)s.referrer=m.document.referrer,s.Ba=1;s.referrer=s.Ua(s.referrer);s.q("_g")}if(s.Ya()&&!s.abort)s.Za(),f+=
s.Xa(),s.gb(d,f),s.q("_t"),s.referrer=""}}b&&s.K(c,1)}s.abort=s.supplementalDataID=s.timestamp=s.pageURLRest=s.linkObject=s.clickObject=s.linkURL=s.linkName=s.linkType=w.vb=s.pe=s.pev1=s.pev2=s.pev3=s.g=0}};s.tl=s.trackLink=function(b,a,c,e,d){s.linkObject=b;s.linkType=a;s.linkName=c;if(d)s.i=b,s.p=d;return s.track(e)};s.trackLight=function(b,a,c,e){s.lightProfileID=b;s.lightStoreForSeconds=a;s.lightIncrementBy=c;return s.track(e)};s.clearVars=function(){var b,a;for(b=0;b<s.c.length;b++)if(a=s.c[b],
a.substring(0,4)=="prop"||a.substring(0,4)=="eVar"||a.substring(0,4)=="hier"||a.substring(0,4)=="list"||a=="channel"||a=="events"||a=="eventList"||a=="products"||a=="productList"||a=="purchaseID"||a=="transactionID"||a=="state"||a=="zip"||a=="campaign")s[a]=void 0};s.tagContainerMarker="";s.gb=function(b,a){var c,e=s.trackingServer;c="";var d=s.dc,f="sc.",w=s.visitorNamespace;if(e){if(s.trackingServerSecure&&s.ssl)e=s.trackingServerSecure}else{if(!w)w=s.account,e=w.indexOf(","),e>=0&&(w=w.substring(0,
e)),w=w.replace(/[^A-Za-z0-9]/g,"");c||(c="2o7.net");d=d?(""+d).toLowerCase():"d1";c=="2o7.net"&&(d=="d1"?d="112":d=="d2"&&(d="122"),f="");e=w+"."+d+"."+f+c}c=s.ssl?"https://":"http://";d=s.AudienceManagement&&s.AudienceManagement.isReady();c+=e+"/b/ss/"+s.account+"/"+(s.mobile?"5.":"")+(d?"10":"1")+"/JS-"+s.version+(s.mb?"T":"")+(s.tagContainerMarker?"-"+s.tagContainerMarker:"")+"/"+b+"?AQB=1&ndh=1&pf=1&"+(d?"callback=s_c_il["+s._in+"].AudienceManagement.passData&":"")+a+"&AQE=1";s.Sa(c);s.Y()};
s.Sa=function(b){s.e||s.$a();s.e.push(b);s.aa=s.r();s.za()};s.$a=function(){s.e=s.cb();if(!s.e)s.e=[]};s.cb=function(){var b,a;if(s.fa()){try{(a=w.localStorage.getItem(s.da()))&&(b=w.JSON.parse(a))}catch(c){}return b}};s.fa=function(){var b=!0;if(!s.trackOffline||!s.offlineFilename||!w.localStorage||!w.JSON)b=!1;return b};s.pa=function(){var b=0;if(s.e)b=s.e.length;s.v&&b++;return b};s.Y=function(){if(!s.v)if(s.qa=k,s.ea)s.aa>s.G&&s.xa(s.e),s.ha(500);else{var b=s.Ma();if(b>0)s.ha(b);else if(b=s.na())s.v=
1,s.fb(b),s.jb(b)}};s.ha=function(b){if(!s.qa)b||(b=0),s.qa=setTimeout(s.Y,b)};s.Ma=function(){var b;if(!s.trackOffline||s.offlineThrottleDelay<=0)return 0;b=s.r()-s.wa;if(s.offlineThrottleDelay<b)return 0;return s.offlineThrottleDelay-b};s.na=function(){if(s.e.length>0)return s.e.shift()};s.fb=function(b){if(s.debugTracking){var a="AppMeasurement Debug: "+b;b=b.split("&");var c;for(c=0;c<b.length;c++)a+="\n\t"+s.unescape(b[c]);s.eb(a)}};s.Ha=function(){return s.marketingCloudVisitorID||s.analyticsVisitorID};
s.Q=!1;var n;try{n=JSON.parse('{"x":"y"}')}catch(r){n=null}n&&n.x=="y"?(s.Q=!0,s.P=function(s){return JSON.parse(s)}):w.$&&w.$.parseJSON?(s.P=function(s){return w.$.parseJSON(s)},s.Q=!0):s.P=function(){return null};s.jb=function(b){var a,c,e;if(s.Ha()&&b.length>2047&&(typeof XMLHttpRequest!="undefined"&&(a=new XMLHttpRequest,"withCredentials"in a?c=1:a=0),!a&&typeof XDomainRequest!="undefined"&&(a=new XDomainRequest,c=2),a&&s.AudienceManagement&&s.AudienceManagement.isReady()))s.Q?a.ja=!0:a=0;!a&&
s.ab&&(b=b.substring(0,2047));if(!a&&s.d.createElement&&s.AudienceManagement&&s.AudienceManagement.isReady()&&(a=s.d.createElement("SCRIPT"))&&"async"in a)(e=(e=s.d.getElementsByTagName("HEAD"))&&e[0]?e[0]:s.d.body)?(a.type="text/javascript",a.setAttribute("async","async"),c=3):a=0;if(!a)a=new Image,a.alt="";a.la=function(){try{if(s.ga)clearTimeout(s.ga),s.ga=0;if(a.timeout)clearTimeout(a.timeout),a.timeout=0}catch(b){}};a.onload=a.lb=function(){a.la();s.Ra();s.V();s.v=0;s.Y();if(a.ja){a.ja=!1;try{var b=
s.P(a.responseText);AudienceManagement.passData(b)}catch(c){}}};a.onabort=a.onerror=a.Ta=function(){a.la();(s.trackOffline||s.ea)&&s.v&&s.e.unshift(s.Qa);s.v=0;s.aa>s.G&&s.xa(s.e);s.V();s.ha(500)};a.onreadystatechange=function(){a.readyState==4&&(a.status==200?a.lb():a.Ta())};s.wa=s.r();if(c==1||c==2){var d=b.indexOf("?");e=b.substring(0,d);d=b.substring(d+1);d=d.replace(/&callback=[a-zA-Z0-9_.\[\]]+/,"");c==1?(a.open("POST",e,!0),a.send(d)):c==2&&(a.open("POST",e),a.send(d))}else if(a.src=b,c==3){if(s.ua)try{e.removeChild(s.ua)}catch(f){}e.firstChild?
e.insertBefore(a,e.firstChild):e.appendChild(a);s.ua=s.Pa}if(a.abort)s.ga=setTimeout(a.abort,5E3);s.Qa=b;s.Pa=w["s_i_"+s.replace(s.account,",","_")]=a;if(s.useForcedLinkTracking&&s.A||s.p){if(!s.forcedLinkTrackingTimeout)s.forcedLinkTrackingTimeout=250;s.W=setTimeout(s.V,s.forcedLinkTrackingTimeout)}};s.Ra=function(){if(s.fa()&&!(s.va>s.G))try{w.localStorage.removeItem(s.da()),s.va=s.r()}catch(b){}};s.xa=function(b){if(s.fa()){s.za();try{w.localStorage.setItem(s.da(),w.JSON.stringify(b)),s.G=s.r()}catch(a){}}};
s.za=function(){if(s.trackOffline){if(!s.offlineLimit||s.offlineLimit<=0)s.offlineLimit=10;for(;s.e.length>s.offlineLimit;)s.na()}};s.forceOffline=function(){s.ea=!0};s.forceOnline=function(){s.ea=!1};s.da=function(){return s.offlineFilename+"-"+s.visitorNamespace+s.account};s.r=function(){return(new Date).getTime()};s.ra=function(s){s=s.toLowerCase();if(s.indexOf("#")!=0&&s.indexOf("about:")!=0&&s.indexOf("opera:")!=0&&s.indexOf("javascript:")!=0)return!0;return!1};s.setTagContainer=function(b){var a,
c,e;s.mb=b;for(a=0;a<s._il.length;a++)if((c=s._il[a])&&c._c=="s_l"&&c.tagContainerName==b){s.K(c);if(c.lmq)for(a=0;a<c.lmq.length;a++)e=c.lmq[a],s.loadModule(e.n);if(c.ml)for(e in c.ml)if(s[e])for(a in b=s[e],e=c.ml[e],e)if(!Object.prototype[a]&&(typeof e[a]!="function"||(""+e[a]).indexOf("s_c_il")<0))b[a]=e[a];if(c.mmq)for(a=0;a<c.mmq.length;a++)e=c.mmq[a],s[e.m]&&(b=s[e.m],b[e.f]&&typeof b[e.f]=="function"&&(e.a?b[e.f].apply(b,e.a):b[e.f].apply(b)));if(c.tq)for(a=0;a<c.tq.length;a++)s.track(c.tq[a]);
c.s=s;break}};s.Util={urlEncode:s.escape,urlDecode:s.unescape,cookieRead:s.cookieRead,cookieWrite:s.cookieWrite,getQueryParam:function(b,a,c){var e;a||(a=s.pageURL?s.pageURL:w.location);c||(c="&");if(b&&a&&(a=""+a,e=a.indexOf("?"),e>=0&&(a=c+a.substring(e+1)+c,e=a.indexOf(c+b+"="),e>=0&&(a=a.substring(e+c.length+b.length+1),e=a.indexOf(c),e>=0&&(a=a.substring(0,e)),a.length>0))))return s.unescape(a);return""}};s.z=["supplementalDataID","timestamp","dynamicVariablePrefix","visitorID","marketingCloudVisitorID",
"analyticsVisitorID","audienceManagerLocationHint","authState","fid","vmk","visitorMigrationKey","visitorMigrationServer","visitorMigrationServerSecure","charSet","visitorNamespace","cookieDomainPeriods","fpCookieDomainPeriods","cookieLifetime","pageName","pageURL","referrer","contextData","currencyCode","lightProfileID","lightStoreForSeconds","lightIncrementBy","retrieveLightProfiles","deleteLightProfiles","retrieveLightData","pe","pev1","pev2","pev3","pageURLRest"];s.c=s.z.concat(["purchaseID",
"variableProvider","channel","server","pageType","transactionID","campaign","state","zip","events","events2","products","audienceManagerBlob","tnt"]);s.ba=["timestamp","charSet","visitorNamespace","cookieDomainPeriods","cookieLifetime","contextData","lightProfileID","lightStoreForSeconds","lightIncrementBy"];s.H=s.ba.slice(0);s.ia=["account","allAccounts","debugTracking","visitor","trackOffline","offlineLimit","offlineThrottleDelay","offlineFilename","usePlugins","doPlugins","configURL","visitorSampling",
"visitorSamplingGroup","linkObject","clickObject","linkURL","linkName","linkType","trackDownloadLinks","trackExternalLinks","trackClickMap","trackInlineStats","linkLeaveQueryString","linkTrackVars","linkTrackEvents","linkDownloadFileTypes","linkExternalFilters","linkInternalFilters","useForcedLinkTracking","forcedLinkTrackingTimeout","trackingServer","trackingServerSecure","ssl","abort","mobile","dc","lightTrackVars","maxDelay","expectSupplementalData","AudienceManagement"];for(i=0;i<=250;i++)i<76&&
(s.c.push("prop"+i),s.H.push("prop"+i)),s.c.push("eVar"+i),s.H.push("eVar"+i),i<6&&s.c.push("hier"+i),i<4&&s.c.push("list"+i);i=["latitude","longitude","resolution","colorDepth","javascriptVersion","javaEnabled","cookiesEnabled","browserWidth","browserHeight","connectionType","homepage"];s.c=s.c.concat(i);s.z=s.z.concat(i);s.ssl=w.location.protocol.toLowerCase().indexOf("https")>=0;s.charSet="UTF-8";s.contextData={};s.offlineThrottleDelay=0;s.offlineFilename="AppMeasurement.offline";s.wa=0;s.aa=0;
s.G=0;s.va=0;s.linkDownloadFileTypes="exe,zip,wav,mp3,mov,mpg,avi,wmv,pdf,doc,docx,xls,xlsx,ppt,pptx";s.w=w;s.d=w.document;try{s.ab=navigator.appName=="Microsoft Internet Explorer"}catch(t){}s.V=function(){if(s.W)w.clearTimeout(s.W),s.W=k;s.i&&s.A&&s.i.dispatchEvent(s.A);if(s.p)if(typeof s.p=="function")s.p();else if(s.i&&s.i.href)s.d.location=s.i.href;s.i=s.A=s.p=0};s.ya=function(){s.b=s.d.body;if(s.b)if(s.o=function(b){var a,c,e,d,f;if(!(s.d&&s.d.getElementById("cppXYctnr")||b&&b["s_fe_"+s._in])){if(s.ka)if(s.useForcedLinkTracking)s.b.removeEventListener("click",
s.o,!1);else{s.b.removeEventListener("click",s.o,!0);s.ka=s.useForcedLinkTracking=0;return}else s.useForcedLinkTracking=0;s.clickObject=b.srcElement?b.srcElement:b.target;try{if(s.clickObject&&(!s.F||s.F!=s.clickObject)&&(s.clickObject.tagName||s.clickObject.parentElement||s.clickObject.parentNode)){var g=s.F=s.clickObject;if(s.Z)clearTimeout(s.Z),s.Z=0;s.Z=setTimeout(function(){if(s.F==g)s.F=0},1E4);e=s.pa();s.track();if(e<s.pa()&&s.useForcedLinkTracking&&b.target){for(d=b.target;d&&d!=s.b&&d.tagName.toUpperCase()!=
"A"&&d.tagName.toUpperCase()!="AREA";)d=d.parentNode;if(d&&(f=d.href,s.ra(f)||(f=0),c=d.target,b.target.dispatchEvent&&f&&(!c||c=="_self"||c=="_top"||c=="_parent"||w.name&&c==w.name))){try{a=s.d.createEvent("MouseEvents")}catch(i){a=new w.MouseEvent}if(a){try{a.initMouseEvent("click",b.bubbles,b.cancelable,b.view,b.detail,b.screenX,b.screenY,b.clientX,b.clientY,b.ctrlKey,b.altKey,b.shiftKey,b.metaKey,b.button,b.relatedTarget)}catch(k){a=0}if(a)a["s_fe_"+s._in]=a.s_fe=1,b.stopPropagation(),b.kb&&b.kb(),
b.preventDefault(),s.i=b.target,s.A=a}}}}else s.clickObject=0}catch(m){s.clickObject=0}}},s.b&&s.b.attachEvent)s.b.attachEvent("onclick",s.o);else{if(s.b&&s.b.addEventListener){if(navigator&&(navigator.userAgent.indexOf("WebKit")>=0&&s.d.createEvent||navigator.userAgent.indexOf("Firefox/2")>=0&&w.MouseEvent))s.ka=1,s.useForcedLinkTracking=1,s.b.addEventListener("click",s.o,!0);s.b.addEventListener("click",s.o,!1)}}else setTimeout(s.ya,30)};s.ya()}
function s_gi(s){var w,k=window.s_c_il,m,i,o=s.split(","),p,n,r=0;if(k)for(m=0;!r&&m<k.length;){w=k[m];if(w._c=="s_c"&&(w.account||w.oun))if(w.account&&w.account==s)r=1;else{i=w.account?w.account:w.oun;i=w.allAccounts?w.allAccounts:i.split(",");for(p=0;p<o.length;p++)for(n=0;n<i.length;n++)o[p]==i[n]&&(r=1)}m++}r||(w=new AppMeasurement);w.setAccount?w.setAccount(s):w.sa&&w.sa(s);return w}AppMeasurement.getInstance=s_gi;window.s_objectID||(window.s_objectID=0);
function s_pgicq(){var s=window,w=s.s_giq,k,m,i;if(w)for(k=0;k<w.length;k++)m=w[k],i=s_gi(m.oun),i.setAccount(m.un),i.setTagContainer(m.tagContainerName);s.s_giq=0}s_pgicq();

/*  Adobe Analytics  */
var s = s_gi(Configuration.APP_MEASUREMENT.RSID);
s.charSet = "UTF-8";
s.currencyCode = "USD";
s.trackDownloadLinks = true;
s.trackExternalLinks = true;
s.trackInlineStats = true;
s.linkDownloadFileTypes = "exe,zip,wav,mp3,mov,mpg,avi,wmv,pdf,doc,docx,xls,xlsx,ppt,pptx";
s.linkLeaveQueryString = false;
s.linkTrackVars = "None";
s.linkTrackEvents = "None";
s.usePlugins = true;
s.trackingServer = Configuration.APP_MEASUREMENT.TRACKING_SERVER;
s.debugTracking = Configuration.APP_MEASUREMENT.DEBUG;
s.visitor = Visitor.getInstance(Configuration.VISITOR_API.MARKETING_CLOUD_ORG_ID,[Configuration.VISITOR_API.NAMESPACE]);

function s_doPlugins(s) {

	/* Page View Event */
	s.events = s.apl(s.events,'event1',',',2);

	/* Days Since Last Visit */
	s.prop18 = s.getDaysSinceLastVisit('s_lv');
	s.eVar18 = s.prop18?s.prop18:"";

	/* Visit Number */
	s.prop20 = s.getVisitNum();
	s.eVar20 = s.prop20?s.prop20:"";

	/* New or Repeat Visit */
	s.prop19 = (s.prop20=="1")?"new":"repeat";
	s.eVar19 = s.prop19?s.prop19:"";

	/* Set Home Page Defaults */
    if(s.pageName=="/")cmg.s_coxnews.pageName=cmg.s_coxnews.eVar55=s.eVar55=s.pageName="/homepage/";

	/* Site Search */
    if (!s.eVar1) {
		s.eVar1 = s.Util.getQueryParam('q').toLowerCase();
		s.prop44 = s.eVar1?"D=v1":"";
    }
	s.gvo_search==s.getValOnce(s.eVar1,'ev1',0);
	if(s.gvo_search==""){
		var a = s.split(s.events,',');
		var e = "";
		for(var i=0;i<a.length;i++){
			if(a[i]=='event13')continue;
			else if(a[i]=='event14')continue;
			else
				e+=a[i]?a[i]+',':a[i];
		}
		s.events = e.substring(0,e.length-1);
	}

	/* Internal Campaigns */
    if(!s.eVar15)s.eVar15 = s.Util.getQueryParam('icmp');

	/* External Campaigns */
    if(!s.campaign)s.campaign = s.Util.getQueryParam('ecmp');

	/* Previous Page Name */
	s.prop57 = s.getPreviousValue(s.pageName,'gpv_p57','');
	s.eVar57 = s.prop57?s.prop57:"";

};
s.doPlugins = s_doPlugins;

/*  Append To List v1.1  */
s.apl=new Function("L","v","d","u","var s=this,m=0;if(!L)L='';if(u){var i,n,a=s.split(L,d);for(i=0;i<a.length;i++){n=a[i];m=m||(u==1?(n==v):(n.toLowerCase()==v.toLowerCase()));}}if(!m)L=L?L+d+v:v;return L");

/*  Days Since Last Visit v1.1.H  */
s.getDaysSinceLastVisit=new Function("c","var s=this,e=new Date(),es=new Date(),cval,cval_s,cval_ss,ct=e.getTime(),day=24*60*60*1000,f1,f2,f3,f4,f5;e.setTime(ct+3*365*day);es.setTime(ct+30*60*1000);f0='cookies not supported';f1='first visit';f2='more than 30 days';f3='more than 7 days';f4='less than 7 days';f5='less than 1 day';cval=s.c_r(c);if(cval.length==0){s.c_w(c,ct,e);s.c_w(c+'_s',f1,es);}else{var d=ct-cval;if(d>30*60*1000){if(d>30*day){s.c_w(c,ct,e);s.c_w(c+'_s',f2,es);}else if(d<30*day+1 && d>7*day){s.c_w(c,ct,e);s.c_w(c+'_s',f3,es);}else if(d<7*day+1 && d>day){s.c_w(c,ct,e);s.c_w(c+'_s',f4,es);}else if(d<day+1){s.c_w(c,ct,e);s.c_w(c+'_s',f5,es);}}else{s.c_w(c,ct,e);cval_ss=s.c_r(c+'_s');s.c_w(c+'_s',cval_ss,es);}}cval_s=s.c_r(c+'_s');if(cval_s.length==0) return f0;else if(cval_s!=f1&&cval_s!=f2&&cval_s!=f3&&cval_s!=f4&&cval_s!=f5) return '';else return cval_s;");

/*  Visit Number v3.6k  */
s.getVisitNum=new Function("c","v","x",""
+"var s=this,a,b,d=new Date,t=d.getTime();c=c?c:'s_vnum';v=v?v:'s_invisit';x=x?864E5*x:31536E6;d.setTime(t+18E5);a=parseInt(s.c_r(c));b=s.c_r(v);s.c_w(v,1,d);if(a){if(b)return a;d.setTime(t+x);s.c_w(c,a+1,d);return a+1}d.setTime(t+x);s.c_w(c,1,d);return 1");

/*  Split v1.5  */
s.split=new Function("l","d","var i,x=0,a=new Array;while(l){i=l.indexOf(d);i=i>-1?i:l.length;a[x++]=l.substring(0,i);l=l.substring(i+d.length);}return a");

/*  Get Previous Value v2.2k  */
s.getPreviousValue=new Function("v","c","e","m","var s=this,t=new Date,i,j,r,x,y;t.setTime(t.getTime()+18E5);c=c?c:'s_gpv';m=m?m:'no value';if(e){if(s.events){i=s.split(e,',');j=s.split(s.events,',');for(x in i){for(y in j){if(i[x]==j[y]){if(s.c_r(c)){r=s.c_r(c)}else{r=m}v?s.c_w(c,v,t):s.c_w(c,m,t);return r}}}}}else{if(s.c_r(c)){r=s.c_r(c)}else{r=m}v?s.c_w(c,v,t):s.c_w(c,m,t);return r}");

/*  Get Value Once v2.1k  */
s.getValOnce=new Function("v","c","e","t","var s=this,a=new Date,v=v?v:'',c=c?c:'s_gvo',e=e?e:0,i=t=='m'?6E4:864E5;k=s.c_r(c);if(v){a.setTime(a.getTime()+e*i);s.c_w(c,v,e==0?0:a);}return v==k?'':v");

cmg.s_coxnews = s;

/*  omniture_event.js  */
if(typeof fire_omniture_event!=='function'){function fire_omniture_event(s_node,event,event_name,event_data){if(!!event_data&&event_data.type==='click'&&!!event_data.namespace){return;}s_node.linkTrackVars='events';s_node.linkTrackEvents=event;s_node.events=event;s_node.tl(this,'o',event_name);};}

/*  Removes all the eVars/props/hier values set in the cmg.s_coxnews object  */
s.clear=function(){var patt=new RegExp(/prop|eVar|hier/);for(var key in cmg.s_coxnews){if(patt.test(key)){if(key){cmg.s_coxnews[key]=null;}}}cmg.s_coxnews.pageName=null;cmg.s_coxnews.channel=null;cmg.s_coxnews.linkTrackVars=null;cmg.s_coxnews.linkTrackEvents=null;cmg.s_coxnews.events=null;};

/*  Clones all the eVars/props/hier values from the current s_coxnews object  */
s.clone=function(){var clone={},patt=new RegExp(/prop|eVar|hier/);for(var key in cmg.s_coxnews){if(patt.test(key)){if(key){clone[key]=cmg.s_coxnews[key];}cmg.s_coxnews[key]=cmg.s_coxnews[key].toLowerCase();}}clone.pageName=cmg.s_coxnews.eVar55;clone.channel=cmg.s_coxnews.eVar56;clone.linkTrackVars=cmg.s_coxnews.linkTrackVars;cmg.linkTrackEvents=cmg.s_coxnews.linkTrackEvents;cmg.events=cmg.s_coxnews.events;return clone;};

/*  Document.Ready Calls  */
jQuery(document).ready(function($) {
	window.visitor = new Visitor(Configuration.VISITOR_API.MARKETING_CLOUD_ORG_ID, Configuration.VISITOR_API.NAMESPACE);
	visitor.trackingServer = Configuration.VISITOR_API.TRACKING_SERVER;

	// Set-up the AppMeasurement component for the Video Measurement
	if(typeof videometrics == 'object'){
		window.appMeasurement = new AppMeasurement();
		appMeasurement.visitorNamespace = Configuration.VISITOR_API.NAMESPACE;
		appMeasurement.trackingServer = Configuration.APP_MEASUREMENT.TRACKING_SERVER;
		appMeasurement.account = Configuration.APP_MEASUREMENT.RSID;
		appMeasurement.visitor = visitor;
		appMeasurement.debugTracking = Configuration.APP_MEASUREMENT.DEBUG;
	}
});
;
!function a(b,c,d){function e(g,h){if(!c[g]){if(!b[g]){var i="function"==typeof require&&require;if(!h&&i)return i(g,!0);if(f)return f(g,!0);throw new Error("Cannot find module '"+g+"'")}var j=c[g]={exports:{}};b[g][0].call(j.exports,function(a){var c=b[g][1][a];return e(c?c:a)},j,j.exports,a,b,c,d)}return c[g].exports}for(var f="function"==typeof require&&require,g=0;g<d.length;g++)e(d[g]);return e}({1:[function(a,b,c){var d="undefined"!=typeof cmg?cmg.s_coxnews:{tl:function(){}},e=Array.prototype.shift;b.exports={track_event:function(){for(var a,b,c,f=e.call(arguments),g=e.call(arguments),h=Array.prototype.pop.call(arguments),i=["events"];arguments.length;)for(a=e.apply(arguments).slice(0),c=a.pop();a.length;)b=a.shift(),d[b]=c,i.push(b);d.linkTrackVars=i.join(","),d.linkTrackEvents="event"+f,d.events="event"+f,d.tl(g,"o",h)},sc:d}},{}],2:[function(a,b,c){function d(a,b){var c,d=e(a)||{};for(c in b)b.hasOwnProperty(c)&&(d[c]=b[c]);g&&g.setItem(f+":"+a,JSON.stringify(d))}function e(a,b){var c=g?g.getItem(f+":"+a):null;return null!==c&&"undefined"!=typeof c&&(c=JSON.parse(c)),b&&b(c),c}var f="cmg_sc",g="undefined"!=typeof localStorage?localStorage:{};b.exports={store:d,restore:e,storage:g}},{}],3:[function(a,b,c){var d=a("./utilities"),e=a("./storage"),f=a("./events");c={userdata:{}};var g=[[12,1,function(a){return a.registered?2316:1057}],[2,2,"uuid"],[6,6,"authProvider"],[7,7,function(a,b){var c;if(b){var e=d.resolver("action",b)||"",f=d.resolver("status",b)||"";c=-1!==e.indexOf("Signin")&&"success"===f}else c=janrain.capture.ui.hasActiveSession();return c?78:24}],[3,3,"gender"],[4,4,"age"],[5,5,"zip"],[42,42,function(){return d.resolver("siteName",f.sc||{})}]],h=[["userData.uuid","uuid"],["userData.gender","gender"],["userData.birthday","age",function(a){return Math.floor((Date.now()-Date.parse(a))/315576e5)}],["userData.primaryAddress.zip","zip"],["userData.emailVerified","registered",function(a){return!!a}],["authProvider"]];c.userdata.track_vars=d.track_vars(g),c.userdata.setup=d.var_setup(g,!0),c.userdata.transformer=d.transformer(h,"userdata",function(a){var b=c.userdata.setup(a);cmg&&cmg.s_coxnews&&cmg.query?cmg.query.extend(cmg.s_coxnews,b):console&&console.error&&console.error("Unable to set SC eVar/prop values. SC or jQuery missing.")}),cmg&&cmg.query&&(cmg.query.extend(c,d,window&&window.localStorage?e:{store:function(){},restore:function(){}}),c.track_event=f.track_event,cmg.s_coxnews&&(cmg.s_coxnews.utilities=c)),e.restore("userdata",c.setup)},{"./events":1,"./storage":2,"./utilities":4}],4:[function(a,b,c){function d(a,b){var c=Object.prototype.toString.call(b);return c.match(/(\w+)\]$/)[1].toLowerCase()===a.toLowerCase()}function e(a,b){if(null==b||-1===a.indexOf("."))return b?b[a]:void 0;var c,d,e=a.split("."),f=e.length,g=b;for(c=0;f>c;c++)if(d=e[c],g=g[d],void 0===g)return void 0;return g}{var f=a("./storage"),g=(a("./events"),g||{}),h=(g.s_coxnews||(g.s_coxnews={}),{});h.transforms||(h.transforms={}),h.var_configs||(h.var_configs={})}c.resolver=e,c.var_setup=function(a){return function(b,c,f){if(b){for(var g,h,i,j,k,l,m={},n=a.length;n--;)if(g=a[n],3===g.length){if(h=g[0],i=g[1],j=d("function",g[2])&&g[2],k=d("string",g[2])&&g[2],l=j?j(b,c):e(k,b),void 0===l)continue;h&&(m["eVar"+h]=l),i&&(m["prop"+i]=l)}return f&&f(m),m}}},c.track_vars=function(a,b){var c=function(){for(var d,e,f,g="",h=(b||[]).slice(),i=a.length;i--;)d=a[i],e=d[0],f=d[1],e&&h.push("eVar"+e),f&&h.push("prop"+f);return g=h.join(","),c=function(){return g},g};return function(a){return a===c()?a:(a="None"!==a?a:"",a?a+","+c():c())}},c.transformer=function(a,b,c){return function(g,h){if(g){var i={};if(a)for(var j=0,k=a.length;k>j;j++){var l=a[j];if(l&&l.length){var m,n=l[0],o=d("string",l[1])?l[1]:n,p=d("function",l[2])?l[2]:d("function",l[1])&&l[1];m=e(n,g),void 0!==m&&p&&(m=p(m)),i[o]=m}}else i=g;return c&&c(i,g),h&&f.store(b,i),i}}}},{"./events":1,"./storage":2}]},{},[3]);;
//<![CDATA[

        (function() { "use strict";

            
            cmg.s_coxnews.siteName=cx_siteName;
            cmg.s_coxnews.linkInternalFilters = "javascript:,doubleclick.net,alt.coxnewsweb.com,legacy.com,uclick.com,signin.cmgdigital.com,www.mystatesman.com,outbrain.com";
            cmg.s_coxnews.server = window.location.host;
            cmg.s_coxnews.prop13 = cmg.s_coxnews.eVar13 = document.title.replace("| www.mystatesman.com", "");

            if (metrics_signin == 1) {
                cmg.s_coxnews.prop22 = cmg.s_coxnews.eVar22 = "gur";
            }

            
            cmg.s_coxnews.prop63 = cmg.s_coxnews.eVar63 = location.protocol + '//' + location.host + location.pathname + location.search;

            
            if (cmg.s_coxnews.prop13.length == 0) {
                cmg.s_coxnews.prop13 = cmg.s_coxnews.eVar13 = "no page title available";
            }
            cmg.s_coxnews.hier3 = cmg.s_coxnews.channel = cmg.s_coxnews.eVar56 = "no category";

            

            
            if(cx_medium=="radio" || cx_medium=="tv" || cx_medium=="newspaper") {
                cmg.s_coxnews.hier1 = cx_marketpath+"|"+cx_medium+"|"+cx_siteName;
                cmg.s_coxnews.hier2 = cx_medium+"|"+cx_marketpath+"|"+cx_siteName;
                
                var search_page_re = new RegExp(cmg.s_coxnews.server+"\/search");
                var search_match = search_page_re.exec(window.location);
                
                if (cmg.s_coxnews.hasOwnProperty('getQueryParam')) {
                    var queryParam = cmg.s_coxnews.getQueryParam;
                } else {
                    var queryParam = cmg.s_coxnews.Util.getQueryParam;
                }
                if(search_match !== null && typeof cx_no_results !== 'undefined'){
                    cmg.s_coxnews.eVar1 = queryParam('q');
                    if(cx_no_results){
                        cmg.s_coxnews.events = "event13,event14";
                        cmg.s_coxnews.prop46 = "no";
                    } else {
                        cmg.s_coxnews.events = "event13";
                        cmg.s_coxnews.prop46 = "yes";
                    }
                    if (queryParam("searchType") == "web") {
                        cmg.s_coxnews.eVar45=cmg.s_coxnews.prop45 = "web";
                    } else {
                        cmg.s_coxnews.eVar45=cmg.s_coxnews.prop45 = "site";
                    }
                }
                if (cx_medium == "radio") {
                    cmg.s_coxnews.eVar43=cmg.s_coxnews.prop43 = "";
                }
                else if (cx_medium == "tv") {
                    cmg.s_coxnews.eVar43=cmg.s_coxnews.prop43 = "tv";
                }
                else if (cx_medium == "newspaper") {
                   cmg.s_coxnews.eVar43=cmg.s_coxnews.prop43 = "newspaper";
                }
            }

            
            
cmg.s_coxnews.prop4 = "";
cmg.s_coxnews.eVar4 = "";
cmg.s_coxnews.prop5 = "";
cmg.s_coxnews.eVar5 = "";
cmg.s_coxnews.prop6 = "";
cmg.s_coxnews.eVar6 = "";
cmg.s_coxnews.prop7 = "24";
cmg.s_coxnews.eVar7 = "24";
cmg.s_coxnews.prop1 = "1057";
cmg.s_coxnews.eVar12 = "1057";
cmg.s_coxnews.prop2 = "";
cmg.s_coxnews.eVar2 = "";
cmg.s_coxnews.prop3 = "";
cmg.s_coxnews.eVar3 = "";
cmg.s_coxnews.prop42 = "mystatesman";
cmg.s_coxnews.eVar42 = "mystatesman";
cmg.s_coxnews.prop16 = "non-mobile site";
cmg.s_coxnews.eVar16 = "non-mobile site";

            var revpathArray = document.getElementsByName("cmg_revpath");
            var pathNameStr = "";
            if(revpathArray.length > 0 && revpathArray[0].content !== ""){
                pathNameStr = revpathArray[0].content;
            } else {
                pathNameStr = window.location.pathname.split(/[#?]/)[0];
                if(pathNameStr === "/"){
                    pathNameStr = "/homepage/";
                }
            }
            if(cmg.s_coxnews.prop22 == "404 page"){
                pathNameStr = "/404_page" + pathNameStr;
            }

            if(pathNameStr.length > 99){
                pathNameStr = pathNameStr.substr(0,98) + "/";
            }

            
                cmg.s_coxnews.pageName = cmg.s_coxnews.eVar55 = pathNameStr.toLowerCase();
            

            

            var authPromise = null;

            function authType(status) {
                if (!status) {
                    return "non-subscriber";
                }

                var type = cmg.authorization.auth_type();
                var map = {
                    staff: "staff user",
                    medleyopenhouse: "open house subscriber",
                    mg2: "subscriber"
                };

                return map[type] || type;
            }

            if (cmg.site_meta && cmg.site_meta.media_type === 'premium') {

                authPromise = new Promise(function(resolve) {
                    var auth_url = 'http://www.mystatesman.com/profile/janus-auth/';
                    cmg.authorization.check(auth_url, function(json) {
                        resolve();
                        var auth = json && json.authorized;

                        if (cmg.site_meta.premium_status === 'premium') {
                            cmg.s_coxnews.eVar52 = cmg.s_coxnews.prop52 = auth ? "full page" : "stubbed";
                        }

                        cmg.s_coxnews.eVar48 = cmg.s_coxnews.prop48 = authType(auth);
                    });
                });

                authPromise = Promise.race([
                    authPromise,
                    new Promise(function(resolve) { setTimeout(resolve, 5000); })
                ]);

            } else {
                
                if (cmg.site_meta && cmg.site_meta.premium_status === 'premium') {
                    cmg.s_coxnews.eVar52=cmg.s_coxnews.prop52 = "stubbed";
                }
            }
            
            
            

            
            var cookie = cmg.query.cookie('ur_metrics');
            if (cookie) {
                
                if (cookie.charAt(0) === '"') {
                    cookie = cookie.slice(1, -1);
                }
                
                var cpp = {"prop2": {"start": 25, "length": 50}, "eVar2": {"start": 25, "length": 50}, "eVar12": {"start": 0, "length": 4}, "prop6": {"start": 18, "length": 5}, "prop4": {"start": 8, "length": 5}, "prop5": {"start": 13, "length": 5}, "eVar3": {"start": 4, "length": 4}, "prop7": {"start": 23, "length": 2}, "eVar5": {"start": 13, "length": 5}, "prop1": {"start": 0, "length": 4}, "eVar7": {"start": 23, "length": 2}, "eVar6": {"start": 18, "length": 5}, "eVar4": {"start": 8, "length": 5}, "prop3": {"start": 4, "length": 4}};
                for (var prop in cpp) {
                    cmg.s_coxnews[prop] = cmg.query.trim(cookie.substr(cpp[prop].start, cpp[prop].length));
                }
            }

            
            for (var key in cmg.s_coxnews) {
                if (cmg.s_coxnews[key] && key.match(/prop|eVar|hier/) !== null) {
                    cmg.s_coxnews[key] = cmg.s_coxnews[key].toLowerCase();
                }
            }

            Promise.resolve(authPromise).then(function() {
                cmg.query(document).ready(function () {
                    if (typeof(cmg.metrics_consolidator) !== "undefined") {
                        

                        cmg.metrics_consolidator.apply_on_ready(cmg_t, 'base');
                    } else {
                        cmg_t();
                    }

                    function cmg_t() {
                        
                        var s_code = cmg.s_coxnews.t();
                        if (s_code) { cmg.query('#cm_s_code').text(s_code); }
                    }
                });
            });

        })();

        //]]>;

        var _qevents = _qevents || [];

        (function() {
            var elem = document.createElement('script');
            elem.src = (document.location.protocol == "https:" ? "https://secure" : "http://edge") + ".quantserve.com/quant.js";
            elem.async = true;
            elem.type = "text/javascript";
            var scpt = document.getElementsByTagName('script')[0];
            scpt.parentNode.insertBefore(elem, scpt);
        })();

        _qevents.push({
            qacct:"p-38KriKc8Foyx-",
            labels:".newspaper"
        });
    ;

            if (window._satellite) {
                _satellite.pageBottom();
            }
        ;
if(window.plate && plate.premium){
    /* If a plate wrap, add premium auth handler */
    plate.generateShareCode = function(authorized){
        if(!authorized) return;
        var alias = plate.getAliasParameters();
        var user_id = cmg.query.cookie('medley_id') || alias.u.substring(0,8);
        var params = {"call":"generate", "path":location.pathname, "user_id":user_id};
        cmg.query.get("/auth/api/share-code/", params, function(data){
            location.hash = data.share_code;
            plate.onReady();
        });
    };
    plate.shareCodeAuthHandler = function(){
        var share_code = location.hash.replace('#', '');
        if(share_code){
            if(flipper.is_active('plate_share_code_simple')){
                plate.setAuthorized(true);
            }else{
                var params = {"call":"validate", "path":location.pathname,
                              "share_code":share_code};
                cmg.query.get("/auth/api/share-code/", params, function(data){
                    plate.setAuthorized(data.validated);
                });
            }
        }else if(cmg.query.cookie('alias')){
            plate.setAuthorized(false);
            if(flipper.is_active('B-01290')){
                var alias = plate.getAliasParameters();
                plate.authorizeUUID(alias.u, plate.generateShareCode);
            }else{
                plate.generateShareCode(true);
            }
        }
    };
    if(flipper.is_active('plate_share_code_active'))
        plate.authHandlers.push(plate.shareCodeAuthHandler);
}
if( typeof window.plate !== 'undefined' ) {
  // Override the togglePremium handler to better align with our
  // markup, styles
  plate.togglePremium = function( authorized ){
    if( authorized ) {
      cmg.query('body').addClass('cmg-authed');
    }
    else {
      cmg.query('body').removeClass('cmg-authed');
    }
    if( authorized || !plate.premium ) {
      cmg.query('body').removeClass('roadblocked');
      cmg.query('.invitation_chunk, .janusNotAuthorized').hide();
      //cmg.query('#flatpage_frame').remove();
    } else{
      cmg.query('body').addClass('roadblocked');
      cmg.query('.invitation_chunk, .janusNotAuthorized').show();
      //cmg.query('#flatpage_frame, .janusNotAuthorized').fadeIn();
    }
  };

  // Override the logout handler so it doesn't bounce to MyStatesman.com
  plate.logoutSuccessHandler = function(){
    if(janrain === undefined){
      setTimeout(plate.logoutSuccessHandler, 100);
    }
    else{
      janrain.on('cmg_ready', function(){
        // This logout handler is the only thing we're really overriding
        var logout = function(){
          /* the alias cookie can only be on root domain, but ur_name+
           ur_uuid can be on root domain or subdomain: carpet bomb */
          ['ur_name', 'ur_uuid', 'alias'].forEach(function(e, i, a){
              document.cookie=e + '=""; path=/;expires=' + plate.cookieExpiration(-2);
              document.cookie=e + '=""; path=/;expires=' + plate.cookieExpiration(-2) + '; domain=.' + plate.rootDomain();
          });
          document.location.reload();
        };
        janrain.settings.capture.federateLogoutCallback = logout;
        // Unbind the old logout handler
        cmg.query(document).undelegate('.cmLogout');
        // Replace it with our custom one
        cmg.query('.cmLogout').on('touchstart click', function(e){
          logout();
        });
      });
    }
  };
}

// Ensure that the premium setting from Wordpress overrides the
// one in the minimalist wrap
if(typeof plate !== 'undefined' && typeof plate._premium !== 'undefined') {
  plate.premium = wrap.premium;
}
cmg.query.holdReady(true);cmg.query("body").append('<!-- Begin CMG wrap --> <div id="cmg-wrap-aas"> <div style="display:none" id="returnSocial"><div class="capture_header"><h1>Sign In / Register</h1></div><div class="capture_signin"><h2>Welcome Back {* welcomeName *}</h2> {* loginWidget *} <div class="capture_centerText switchLink"><a href="#" data-cancelcapturereturnexperience="true">Use another account</a></div></div></div> <div style="display:none" id="returnTraditional"><div class="capture_header"><h1>Sign In / Register</h1></div><div class="capture_backgroundColor"><div class="capture_signin"><h2>Welcome back. Please sign in</h2> {* #userInformationForm *} {* traditionalSignIn_emailAddress *} {* traditionalSignIn_password *} <div class="capture_form_item"> {* traditionalSignIn_signInButton *} <a href="#" data-capturescreen="forgotPassword" id="forgotPasswordLink">Forgot your password?</a></div><div class="capture_centerText switchLink"><a href="#" data-cancelcapturereturnexperience="true">Use another account</a></div> {* /userInformationForm *} </div></div></div> <div style="display:none" id="socialRegistration" class="capture_lrg_footer"><div class="capture_header"><h1>You&apos;re Almost Done!</h1></div><div class="capture_signup"><h2>Select a display name and password</h2> {* #socialRegistrationForm *} {* socialRegistration_displayName *} {* socialRegistration_emailAddress *} {* traditionalRegistration_password *} {* traditionalRegistration_passwordConfirm *} <h2>Tell us about yourself</h2> {* registration_firstName *} {* registration_lastName *} {* registration_postalZip *} {* registration_birthday *} {* registration_gender *} <div class="capture_form_item"><label>*Indicates Required Field</label></div> {* agreeToTerms *} <div class="capture_footer"><div class="capture_left"> {* backButton *} </div><div class="capture_right"> {* socialRegistration_signInButton *} </div></div> {* /socialRegistrationForm *} </div></div> <div style="display:none" id="traditionalRegistration"><div class="capture_header"><h1>Create a New Account</h1></div><div class="capture_signup"><h2>Select a display name and password</h2><p>Already have an account? <a href="#" data-capturescreen="signIn">Sign In</a></p> {* #registrationForm *} {* traditionalRegistration_displayName *} {* traditionalRegistration_emailAddress *} {* traditionalRegistration_password *} {* traditionalRegistration_passwordConfirm *} <h2>Tell us about yourself</h2> {* registration_firstName *} {* registration_lastName *} {* registration_postalZip *} {* registration_birthday *} {* registration_gender *} <div class="capture_form_item"><label>*Indicates Required Field</label></div> {* agreeToTerms *} <div class="capture_footer"><div class="capture_left"> {* createAccountButton *} </div></div> {* /registrationForm *} </div></div> <div style="display:none" id="traditionalRegistrationBlank"><div class="capture_header"><h1>Create a New Account</h1></div><div class="capture_signup"><p>Already have an account? <a href="#" data-capturescreen="signIn">Sign In</a></p> {* #registrationFormBlank *} {* registration_firstName *} {* registration_lastName *} {* traditionalRegistration_displayName *} {* traditionalRegistration_emailAddressBlank *} {* registration_birthday *} {* registration_gender *} {* registration_postalZip *} {* traditionalRegistration_passwordBlank *} {* traditionalRegistration_passwordConfirmBlank *} <div class="capture_form_item"><label>*Indicates Required Field</label></div> {* agreeToTerms *} <div class="capture_footer"><div class="capture_left"> {* backButton *} </div><div class="capture_right"> {* createAccountButton *} </div></div> {* /registrationForm *} </div></div> <div style="display:none" id="registrationSuccess"><div class="capture_header"><h1>Thank you for registering!</h1></div><div class="capture_success"><p>We have sent you a confirmation email. Please check your email and click on the link to activate your account.</p><div class="capture_footer"><span onclick="janrain.capture.ui.modal.close()" class="capture_btn capture_primary">Close</span></div></div></div> <div style="display:none" id="registrationSuccessConfirmed"><div class="capture_header"><h1>Thank you for registering!</h1></div><div class="capture_success"><p>We look forward to seeing you frequently. Visit us and sign in to update your profile, receive the latest news and keep up to date with mobile alerts.</p><div class="capture_footer"><span onclick="janrain.capture.ui.modal.close()" class="capture_btn capture_primary">Close</span></div></div></div> <div style="display:none" id="forgotPassword"><div class="capture_header"><h1>Create a new password</h1></div><div class="retrieve_password"><p>Don&apos;t worry, it happens. We&apos;ll send you a link to create a new password.</p> {* #forgotPasswordForm *} {* forgotPassword_emailAddress *} <div class="capture_footer"><div class="capture_left"> {* backButton *} </div><div class="capture_right"> {* forgotPassword_sendButton *} </div></div> {* /forgotPasswordForm *} </div></div> <div style="display:none" id="forgotPasswordSuccess"><div class="capture_header"><h1>Email sent</h1></div><div class="retrieve_password"><p>We have sent you an email with a link to change your password.</p><div class="capture_footer"><a href="#" onclick="janrain.capture.ui.modal.close()" class="capture_btn capture_primary">Close</a></div></div></div><div style="display:none" id="forgotPasswordSuccess"><div class="capture_header"><h1>Create a new password</h1></div><div class="retrieve_password"><p>We&apos;ve sent an email with instructions to create a new password. Your existing password has not been changed.</p><div class="capture_footer"><a href="#" onclick="janrain.capture.ui.modal.close()" class="capture_btn capture_primary">Close</a></div></div></div> <div style="display:none" id="mergeAccounts"> {* mergeAccounts *} </div> <div style="display:none" id="traditionalAuthenticateMerge"><div class="capture_header"><h1>Sign in to complete account merge</h1></div><div class="capture_signin"> {* #tradAuthenticateMergeForm *} {* traditionalSignIn_emailAddress *} {* mergePassword *} <div class="capture_footer"><div class="capture_left"> {* backButton *} </div><div class="capture_right"> {* traditionalSignIn_signInButton *} </div></div> {* /tradAuthenticateMergeForm *} </div></div> <div style="display:none" id="resendVerification"><div class="capture_header"><h1>Resend Email Verification</h1></div><div class="retrieve_password"><p>To sign in you must verify your email address. Fill out the form below and we&apos;ll send you an email to verify.</p> {* #resendVerificationForm *} {* resendVerification_emailAddress *} <div class="capture_fox_buttoncol"> {* newPasswordFormButton *} </div> {* /resendVerificationForm *} </div></div> <div style="display:none" id="resendVerificationSuccess"><div class="capture_header"><h1>Your Verification Email Has Been Sent</h1></div><div class="retrieve_password"><p>Check your email for a link to verify your email address.</p><div class="capture_footer"><a href="#" data-capturescreen="signIn" class="capture_btn capture_primary">Sign in</a></div></div></div> <div style="display:none" id="signIn"><div class="capture_header"><h1>Sign In / Register</h1></div><div class="capture_signin"><h2>Sign in with your existing account</h2> {* loginWidget *} <br></div><div class="capture_backgroundColor"><div class="capture_signin"><h2>Sign in with your email</h2> {* #userInformationForm *} {* traditionalSignIn_emailAddress *} {* traditionalSignIn_password *} <div class="capture_form_item"> {* traditionalSignIn_signInButton *} <a href="#" data-capturescreen="forgotPassword" id="forgotPasswordLink">Forgot your password?</a></div> {* /userInformationForm *} </div></div><div class="capture_newUser capture_signin"><h2>New User?</h2><a href="#" class="capture_btn capture_primary" data-capturescreen="traditionalRegistration">Create a New Account</a></div></div> </div> <!-- End CMG wrap -->');cmg.query.holdReady(false);