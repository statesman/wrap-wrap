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
        if(janrain === undefined || janrain.capture === undefined || janrain.capture.ui === undefined){
            setTimeout(plate.loginSuccessHandler, 100);
        }else{
            janrain.on('onCaptureLoginSuccess', plate.wrapLogin);
            janrain.medleySession = false;
        }
    },
    logoutSuccessHandler:function(){
        if(janrain === undefined){
            setTimeout(plate.logoutSuccessHandler, 100);
        }else{
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
        if(typeof cmg !== "undefined"){
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
(window.NREUM||(NREUM={})).loader_config={xpid:"UA8DVFJACgQIXVlSAw=="};window.NREUM||(NREUM={}),__nr_require=function(t,e,n){function r(n){if(!e[n]){var o=e[n]={exports:{}};t[n][0].call(o.exports,function(e){var o=t[n][1][e];return r(o?o:e)},o,o.exports)}return e[n].exports}if("function"==typeof __nr_require)return __nr_require;for(var o=0;o<n.length;o++)r(n[o]);return r}({QJf3ax:[function(t,e){function n(t){function e(e,n,a){t&&t(e,n,a),a||(a={});for(var c=s(e),f=c.length,u=i(a,o,r),d=0;f>d;d++)c[d].apply(u,n);return u}function a(t,e){f[t]=s(t).concat(e)}function s(t){return f[t]||[]}function c(){return n(e)}var f={};return{on:a,emit:e,create:c,listeners:s,_events:f}}function r(){return{}}var o="nr@context",i=t("gos");e.exports=n()},{gos:"7eSDFh"}],ee:[function(t,e){e.exports=t("QJf3ax")},{}],3:[function(t){function e(t){try{i.console&&console.log(t)}catch(e){}}var n,r=t("ee"),o=t(1),i={};try{n=localStorage.getItem("__nr_flags").split(","),console&&"function"==typeof console.log&&(i.console=!0,-1!==n.indexOf("dev")&&(i.dev=!0),-1!==n.indexOf("nr_dev")&&(i.nrDev=!0))}catch(a){}i.nrDev&&r.on("internal-error",function(t){e(t.stack)}),i.dev&&r.on("fn-err",function(t,n,r){e(r.stack)}),i.dev&&(e("NR AGENT IN DEVELOPMENT MODE"),e("flags: "+o(i,function(t){return t}).join(", ")))},{1:23,ee:"QJf3ax"}],4:[function(t){function e(t,e,n,i,s){try{c?c-=1:r("err",[s||new UncaughtException(t,e,n)])}catch(f){try{r("ierr",[f,(new Date).getTime(),!0])}catch(u){}}return"function"==typeof a?a.apply(this,o(arguments)):!1}function UncaughtException(t,e,n){this.message=t||"Uncaught error with no additional information",this.sourceURL=e,this.line=n}function n(t){r("err",[t,(new Date).getTime()])}var r=t("handle"),o=t(6),i=t("ee"),a=window.onerror,s=!1,c=0;t("loader").features.err=!0,t(5),window.onerror=e;try{throw new Error}catch(f){"stack"in f&&(t(1),t(2),"addEventListener"in window&&t(3),window.XMLHttpRequest&&XMLHttpRequest.prototype&&XMLHttpRequest.prototype.addEventListener&&window.XMLHttpRequest&&XMLHttpRequest.prototype&&XMLHttpRequest.prototype.addEventListener&&!/CriOS/.test(navigator.userAgent)&&t(4),s=!0)}i.on("fn-start",function(){s&&(c+=1)}),i.on("fn-err",function(t,e,r){s&&(this.thrown=!0,n(r))}),i.on("fn-end",function(){s&&!this.thrown&&c>0&&(c-=1)}),i.on("internal-error",function(t){r("ierr",[t,(new Date).getTime(),!0])})},{1:10,2:9,3:7,4:11,5:3,6:24,ee:"QJf3ax",handle:"D5DuLP",loader:"G9z0Bl"}],5:[function(t){t("loader").features.ins=!0},{loader:"G9z0Bl"}],6:[function(t){function e(){}if(window.performance&&window.performance.timing&&window.performance.getEntriesByType){var n=t("ee"),r=t("handle"),o=t(1),i=t(2);t("loader").features.stn=!0,t(3),n.on("fn-start",function(t){var e=t[0];e instanceof Event&&(this.bstStart=Date.now())}),n.on("fn-end",function(t,e){var n=t[0];n instanceof Event&&r("bst",[n,e,this.bstStart,Date.now()])}),o.on("fn-start",function(t,e,n){this.bstStart=Date.now(),this.bstType=n}),o.on("fn-end",function(t,e){r("bstTimer",[e,this.bstStart,Date.now(),this.bstType])}),i.on("fn-start",function(){this.bstStart=Date.now()}),i.on("fn-end",function(t,e){r("bstTimer",[e,this.bstStart,Date.now(),"requestAnimationFrame"])}),n.on("pushState-start",function(){this.time=Date.now(),this.startPath=location.pathname+location.hash}),n.on("pushState-end",function(){r("bstHist",[location.pathname+location.hash,this.startPath,this.time])}),"addEventListener"in window.performance&&(window.performance.addEventListener("webkitresourcetimingbufferfull",function(){r("bstResource",[window.performance.getEntriesByType("resource")]),window.performance.webkitClearResourceTimings()},!1),window.performance.addEventListener("resourcetimingbufferfull",function(){r("bstResource",[window.performance.getEntriesByType("resource")]),window.performance.clearResourceTimings()},!1)),document.addEventListener("scroll",e,!1),document.addEventListener("keypress",e,!1),document.addEventListener("click",e,!1)}},{1:10,2:9,3:8,ee:"QJf3ax",handle:"D5DuLP",loader:"G9z0Bl"}],7:[function(t,e){function n(t){i.inPlace(t,["addEventListener","removeEventListener"],"-",r)}function r(t){return t[1]}var o=(t(1),t("ee").create()),i=t(2)(o),a=t("gos");if(e.exports=o,n(window),"getPrototypeOf"in Object){for(var s=document;s&&!s.hasOwnProperty("addEventListener");)s=Object.getPrototypeOf(s);s&&n(s);for(var c=XMLHttpRequest.prototype;c&&!c.hasOwnProperty("addEventListener");)c=Object.getPrototypeOf(c);c&&n(c)}else XMLHttpRequest.prototype.hasOwnProperty("addEventListener")&&n(XMLHttpRequest.prototype);o.on("addEventListener-start",function(t){if(t[1]){var e=t[1];"function"==typeof e?this.wrapped=t[1]=a(e,"nr@wrapped",function(){return i(e,"fn-",null,e.name||"anonymous")}):"function"==typeof e.handleEvent&&i.inPlace(e,["handleEvent"],"fn-")}}),o.on("removeEventListener-start",function(t){var e=this.wrapped;e&&(t[1]=e)})},{1:24,2:25,ee:"QJf3ax",gos:"7eSDFh"}],8:[function(t,e){var n=(t(2),t("ee").create()),r=t(1)(n);e.exports=n,r.inPlace(window.history,["pushState"],"-")},{1:25,2:24,ee:"QJf3ax"}],9:[function(t,e){var n=(t(2),t("ee").create()),r=t(1)(n);e.exports=n,r.inPlace(window,["requestAnimationFrame","mozRequestAnimationFrame","webkitRequestAnimationFrame","msRequestAnimationFrame"],"raf-"),n.on("raf-start",function(t){t[0]=r(t[0],"fn-")})},{1:25,2:24,ee:"QJf3ax"}],10:[function(t,e){function n(t,e,n){t[0]=o(t[0],"fn-",null,n)}var r=(t(2),t("ee").create()),o=t(1)(r);e.exports=r,o.inPlace(window,["setTimeout","setInterval","setImmediate"],"setTimer-"),r.on("setTimer-start",n)},{1:25,2:24,ee:"QJf3ax"}],11:[function(t,e){function n(){f.inPlace(this,p,"fn-")}function r(t,e){f.inPlace(e,["onreadystatechange"],"fn-")}function o(t,e){return e}function i(t,e){for(var n in t)e[n]=t[n];return e}var a=t("ee").create(),s=t(1),c=t(2),f=c(a),u=c(s),d=window.XMLHttpRequest,p=["onload","onerror","onabort","onloadstart","onloadend","onprogress","ontimeout"];e.exports=a,window.XMLHttpRequest=function(t){var e=new d(t);try{a.emit("new-xhr",[],e),u.inPlace(e,["addEventListener","removeEventListener"],"-",o),e.addEventListener("readystatechange",n,!1)}catch(r){try{a.emit("internal-error",[r])}catch(i){}}return e},i(d,XMLHttpRequest),XMLHttpRequest.prototype=d.prototype,f.inPlace(XMLHttpRequest.prototype,["open","send"],"-xhr-",o),a.on("send-xhr-start",r),a.on("open-xhr-start",r)},{1:7,2:25,ee:"QJf3ax"}],12:[function(t){function e(t){var e=this.params,r=this.metrics;if(!this.ended){this.ended=!0;for(var i=0;c>i;i++)t.removeEventListener(s[i],this.listener,!1);if(!e.aborted){if(r.duration=(new Date).getTime()-this.startTime,4===t.readyState){e.status=t.status;var a=t.responseType,f="arraybuffer"===a||"blob"===a||"json"===a?t.response:t.responseText,u=n(f);if(u&&(r.rxSize=u),this.sameOrigin){var d=t.getResponseHeader("X-NewRelic-App-Data");d&&(e.cat=d.split(", ").pop())}}else e.status=0;r.cbTime=this.cbTime,o("xhr",[e,r,this.startTime])}}}function n(t){if("string"==typeof t&&t.length)return t.length;if("object"!=typeof t)return void 0;if("undefined"!=typeof ArrayBuffer&&t instanceof ArrayBuffer&&t.byteLength)return t.byteLength;if("undefined"!=typeof Blob&&t instanceof Blob&&t.size)return t.size;if("undefined"!=typeof FormData&&t instanceof FormData)return void 0;try{return JSON.stringify(t).length}catch(e){return void 0}}function r(t,e){var n=i(e),r=t.params;r.host=n.hostname+":"+n.port,r.pathname=n.pathname,t.sameOrigin=n.sameOrigin}if(window.XMLHttpRequest&&XMLHttpRequest.prototype&&XMLHttpRequest.prototype.addEventListener&&!/CriOS/.test(navigator.userAgent)){t("loader").features.xhr=!0;var o=t("handle"),i=t(2),a=t("ee"),s=["load","error","abort","timeout"],c=s.length,f=t(1);t(4),t(3),a.on("new-xhr",function(){this.totalCbs=0,this.called=0,this.cbTime=0,this.end=e,this.ended=!1,this.xhrGuids={}}),a.on("open-xhr-start",function(t){this.params={method:t[0]},r(this,t[1]),this.metrics={}}),a.on("open-xhr-end",function(t,e){"loader_config"in NREUM&&"xpid"in NREUM.loader_config&&this.sameOrigin&&e.setRequestHeader("X-NewRelic-ID",NREUM.loader_config.xpid)}),a.on("send-xhr-start",function(t,e){var r=this.metrics,o=t[0],i=this;if(r&&o){var f=n(o);f&&(r.txSize=f)}this.startTime=(new Date).getTime(),this.listener=function(t){try{"abort"===t.type&&(i.params.aborted=!0),("load"!==t.type||i.called===i.totalCbs&&(i.onloadCalled||"function"!=typeof e.onload))&&i.end(e)}catch(n){try{a.emit("internal-error",[n])}catch(r){}}};for(var u=0;c>u;u++)e.addEventListener(s[u],this.listener,!1)}),a.on("xhr-cb-time",function(t,e,n){this.cbTime+=t,e?this.onloadCalled=!0:this.called+=1,this.called!==this.totalCbs||!this.onloadCalled&&"function"==typeof n.onload||this.end(n)}),a.on("xhr-load-added",function(t,e){var n=""+f(t)+!!e;this.xhrGuids&&!this.xhrGuids[n]&&(this.xhrGuids[n]=!0,this.totalCbs+=1)}),a.on("xhr-load-removed",function(t,e){var n=""+f(t)+!!e;this.xhrGuids&&this.xhrGuids[n]&&(delete this.xhrGuids[n],this.totalCbs-=1)}),a.on("addEventListener-end",function(t,e){e instanceof XMLHttpRequest&&"load"===t[0]&&a.emit("xhr-load-added",[t[1],t[2]],e)}),a.on("removeEventListener-end",function(t,e){e instanceof XMLHttpRequest&&"load"===t[0]&&a.emit("xhr-load-removed",[t[1],t[2]],e)}),a.on("fn-start",function(t,e,n){e instanceof XMLHttpRequest&&("onload"===n&&(this.onload=!0),("load"===(t[0]&&t[0].type)||this.onload)&&(this.xhrCbStart=(new Date).getTime()))}),a.on("fn-end",function(t,e){this.xhrCbStart&&a.emit("xhr-cb-time",[(new Date).getTime()-this.xhrCbStart,this.onload,e],e)})}},{1:"XL7HBI",2:13,3:11,4:7,ee:"QJf3ax",handle:"D5DuLP",loader:"G9z0Bl"}],13:[function(t,e){e.exports=function(t){var e=document.createElement("a"),n=window.location,r={};e.href=t,r.port=e.port;var o=e.href.split("://");return!r.port&&o[1]&&(r.port=o[1].split("/")[0].split("@").pop().split(":")[1]),r.port&&"0"!==r.port||(r.port="https"===o[0]?"443":"80"),r.hostname=e.hostname||n.hostname,r.pathname=e.pathname,r.protocol=o[0],"/"!==r.pathname.charAt(0)&&(r.pathname="/"+r.pathname),r.sameOrigin=!e.hostname||e.hostname===document.domain&&e.port===n.port&&e.protocol===n.protocol,r}},{}],14:[function(t,e){function n(t){return function(){r(t,[(new Date).getTime()].concat(i(arguments)))}}var r=t("handle"),o=t(1),i=t(2);"undefined"==typeof window.newrelic&&(newrelic=window.NREUM);var a=["setPageViewName","addPageAction","setCustomAttribute","finished","addToTrace","inlineHit","noticeError"];o(a,function(t,e){window.NREUM[e]=n("api-"+e)}),e.exports=window.NREUM},{1:23,2:24,handle:"D5DuLP"}],"7eSDFh":[function(t,e){function n(t,e,n){if(r.call(t,e))return t[e];var o=n();if(Object.defineProperty&&Object.keys)try{return Object.defineProperty(t,e,{value:o,writable:!0,enumerable:!1}),o}catch(i){}return t[e]=o,o}var r=Object.prototype.hasOwnProperty;e.exports=n},{}],gos:[function(t,e){e.exports=t("7eSDFh")},{}],handle:[function(t,e){e.exports=t("D5DuLP")},{}],D5DuLP:[function(t,e){function n(t,e,n){return r.listeners(t).length?r.emit(t,e,n):(o[t]||(o[t]=[]),void o[t].push(e))}var r=t("ee").create(),o={};e.exports=n,n.ee=r,r.q=o},{ee:"QJf3ax"}],id:[function(t,e){e.exports=t("XL7HBI")},{}],XL7HBI:[function(t,e){function n(t){var e=typeof t;return!t||"object"!==e&&"function"!==e?-1:t===window?0:i(t,o,function(){return r++})}var r=1,o="nr@id",i=t("gos");e.exports=n},{gos:"7eSDFh"}],G9z0Bl:[function(t,e){function n(){var t=p.info=NREUM.info,e=f.getElementsByTagName("script")[0];if(t&&t.licenseKey&&t.applicationID&&e){s(d,function(e,n){e in t||(t[e]=n)});var n="https"===u.split(":")[0]||t.sslForHttp;p.proto=n?"https://":"http://",a("mark",["onload",i()]);var r=f.createElement("script");r.src=p.proto+t.agent,e.parentNode.insertBefore(r,e)}}function r(){"complete"===f.readyState&&o()}function o(){a("mark",["domContent",i()])}function i(){return(new Date).getTime()}var a=t("handle"),s=t(1),c=(t(2),window),f=c.document,u=(""+location).split("?")[0],d={beacon:"bam.nr-data.net",errorBeacon:"bam.nr-data.net",agent:"js-agent.newrelic.com/nr-632.min.js"},p=e.exports={offset:i(),origin:u,features:{}};f.addEventListener?(f.addEventListener("DOMContentLoaded",o,!1),c.addEventListener("load",n,!1)):(f.attachEvent("onreadystatechange",r),c.attachEvent("onload",n)),a("mark",["firstbyte",i()])},{1:23,2:14,handle:"D5DuLP"}],loader:[function(t,e){e.exports=t("G9z0Bl")},{}],23:[function(t,e){function n(t,e){var n=[],o="",i=0;for(o in t)r.call(t,o)&&(n[i]=e(o,t[o]),i+=1);return n}var r=Object.prototype.hasOwnProperty;e.exports=n},{}],24:[function(t,e){function n(t,e,n){e||(e=0),"undefined"==typeof n&&(n=t?t.length:0);for(var r=-1,o=n-e||0,i=Array(0>o?0:o);++r<o;)i[r]=t[e+r];return i}e.exports=n},{}],25:[function(t,e){function n(t){return!(t&&"function"==typeof t&&t.apply&&!t[i])}var r=t("ee"),o=t(1),i="nr@wrapper",a=Object.prototype.hasOwnProperty;e.exports=function(t){function e(t,e,r,a){function nrWrapper(){var n,i,s,f;try{i=this,n=o(arguments),s=r&&r(n,i)||{}}catch(d){u([d,"",[n,i,a],s])}c(e+"start",[n,i,a],s);try{return f=t.apply(i,n)}catch(p){throw c(e+"err",[n,i,p],s),p}finally{c(e+"end",[n,i,f],s)}}return n(t)?t:(e||(e=""),nrWrapper[i]=!0,f(t,nrWrapper),nrWrapper)}function s(t,r,o,i){o||(o="");var a,s,c,f="-"===o.charAt(0);for(c=0;c<r.length;c++)s=r[c],a=t[s],n(a)||(t[s]=e(a,f?s+o:o,i,s))}function c(e,n,r){try{t.emit(e,n,r)}catch(o){u([o,e,n,r])}}function f(t,e){if(Object.defineProperty&&Object.keys)try{var n=Object.keys(t);return n.forEach(function(n){Object.defineProperty(e,n,{get:function(){return t[n]},set:function(e){return t[n]=e,e}})}),e}catch(r){u([r])}for(var o in t)a.call(t,o)&&(e[o]=t[o]);return e}function u(e){try{t.emit("internal-error",e)}catch(n){}}return t||(t=r),e.inPlace=s,e.flag=i,e}},{1:24,ee:"QJf3ax"}]},{},["G9z0Bl",4,12,6,5]);;
window.NREUM||(NREUM={});NREUM.info={"beacon":"bam.nr-data.net","queueTime":0,"licenseKey":"aaf23b031f","agent":"js-agent.newrelic.com/nr-632.min.js","transactionName":"MQYHNRZYCkZVBxcKVghMIxQKWhBcWwpMAVwSFwATB1gHXVFKFQpcERBfIwFNEFBGMgoGTkgEABU=","applicationID":"2789804","errorBeacon":"bam.nr-data.net","applicationTime":5};
flipper = new Object();
flipper.active_flags = {"active_flags": ["JANUS-127", "GoogleAnalytics_Enable", "CMSTC-969", "CMSAP-1119-visible", "CMSSAI-858", "twitter_card", "disable_auth_recovery", "mobile_image_slider", "JANUS-1572", "JANUS-141", "JANUS-1627", "CMSTC-1011", "new_event_urls", "channel-premium-grid-template", "JANUS-1244", "JANUS-64", "JANUS-1266", "JANUS-1264", "CMSSAI-1343", "Chartbeat_Enable", "HYBRID_LISTS", "JANUS-1520", "JANUS-4777", "CMSAM-408", "ComScore_Enable", "qualtrics_enable", "Quantcast_Enable", "JANUS-2856", "VisualRevenue_Enable", "JANUS-1686", "MaxMapRadar_Enable", "JANUS-4778", "AppMeasurement_Enable", "JANUS-4779", "MaxMapRadarWired_Enable", "B-04471", "D-01426", "SchoolClosingsKeywordSearch_Disable", "jquery-2", "CMSTC-1192", "D-01463", "B-02762", "B-03926"]}.active_flags;
flipper.is_active = function(key) {
    for (var i = 0; i < flipper.active_flags.length; i++) {
        if ( flipper.active_flags[i] == key ) return true;
    }
    return false;
}
;
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
(function(f,c,g){var b=/\+/g;function e(h){return h}function d(h){return decodeURIComponent(h.replace(b," "))}f.cookie=function(m,l,q){if(l!==g&&!/Object/.test(Object.prototype.toString.call(l))){q=f.extend({},f.cookie.defaults,q);if(l===null){q.expires=-1}if(typeof q.expires==="number"){var n=q.expires,p=q.expires=new Date();p.setDate(p.getDate()+n)}l=String(l);return(c.cookie=[encodeURIComponent(m),"=",q.raw?l:encodeURIComponent(l),q.expires?"; expires="+q.expires.toUTCString():"",q.path?"; path="+q.path:"",q.domain?"; domain="+q.domain:"",q.secure?"; secure":""].join(""))}q=l||f.cookie.defaults||{};var h=q.raw?e:d;var o=c.cookie.split("; ");for(var k=0,j;(j=o[k]&&o[k].split("="));k++){if(h(j.shift())===m){return h(j.join("="))}}return null};f.cookie.defaults={};f.removeCookie=function(i,h){if(f.cookie(i,h)!==null){f.cookie(i,null,h);return true}return false}})(jQuery,document);!function(){function t(j,i){var z=void 0!==window.pageYOffset?window.pageYOffset:(document.documentElement||document.body.parentNode||document.body).scrollTop,y=document.documentElement.clientHeight,x=z+y;i=i||0;var w=j.getBoundingClientRect(),v=w.top+z-i,u=w.bottom+z+i;return u>z&&x>v}function s(d,c){return c.handler="function"==typeof c.handler?c.handler:k,c.enabled="undefined"==typeof c.enabled?!0:c.enabled,c.scroll=c.scroll||{},c.scroll.onscreen="function"==typeof c.scroll.onscreen?c.scroll.onscreen:k,c.scroll.offscreen="function"==typeof c.scroll.offscreen?c.scroll.offscreen:k,d.jb_wasOnscreen=!1,d.jb_range=c.range,d.jb_destroy=function(){var e,f=l.length;for(e=0;f>e;e+=1){l[e]===d&&(l.splice(e,1),e-=1,f-=1)}},d.jb_handler=function(){var b=jQuery(d);c.handler.call(b,d),c.runOnce&&d.jb_destroy(),b.trigger("beacon/activate")},d.jb_onscreen=function(){var b=jQuery(d);c.scroll.onscreen.call(b,d),b.trigger("beacon/scroll/onscreen")},d.jb_offscreen=function(){var b=jQuery(d);c.scroll.offscreen.call(b,d),b.trigger("beacon/scroll/offscreen")},c.enabled&&(d.jb_active=!0),d}jQuery.beacons=function(f){var c,h,g=l.length;if("destroy"===f){m=!1,l=[]}else{if("enable"===f){for(h=0;g>h;h+=1){l[h].jb_active=!0}r()}else{if("disable"===f){for(h=0;g>h;h+=1){l[h].jb_active=!1}m=!1}else{if("fetch"===f){return l}if("activate"===f){for(h=0;g>h;h+=1){c=l[h],c.jb_active&&c.jb_handler()}}else{if("settings"===f){return{range:n,throttle:o}}"object"==typeof f&&(n="number"==typeof f.range?f.range:n,o="number"==typeof f.throttle?f.throttle:o)}}}}return this};var r=function(){q(),m||(m=!0,p=window.setInterval(function(){q(),m||window.clearInterval(p)},o))},q=function(){var f,i,h,g=l.length;for(f=0;g>f;f+=1){i=l[f],h="number"==typeof i.jb_range?i.jb_range:n,i.jb_active&&(t(i,h)?(i.jb_handler(),i.jb_wasOnscreen||(i.jb_wasOnscreen=!0,i.jb_onscreen())):i.jb_wasOnscreen&&(i.jb_wasOnscreen=!1,i.jb_offscreen()))}};jQuery.fn.beacon=function(b){return this.each(function(h,g){var c;"function"==typeof b?(c=s(g,{handler:b}),l.push(c),r()):"activate"===b?g.jb_active&&g.jb_handler():"enable"===b?g.jb_active=!0:"disable"===b?g.jb_active=!1:"destroy"===b?g.jb_destroy():"object"==typeof b&&(c=s(g,b),l.push(c),r())}),this};var p=!1,o=80,n=0,m=!1,l=[],k=function(){}}();!function(){window.cmg={query:jQuery.noConflict(),log:{ads:Lumberjack()},_:window._,unveil:function(){var b=cmg.query;b("img").unveil(50,function(){b(this).load(function(){this.style.opacity=1})})}},cmg.query.beacons({range:15}),function(){var e=function(){},d=["assert","clear","count","debug","dir","dirxml","error","exception","group","groupCollapsed","groupEnd","info","log","markTimeline","profile","profileEnd","table","time","timeEnd","timeStamp","trace","warn"],f=window.console||(window.console={});d.forEach(function(c){f[c]||(f[c]=e)})}()}();cmg.utility={getMetaKeywords:function(){try{var b=cmg.query("meta[name=keywords]").attr("content");var d=b.split(",");return d.map(function(e){return e.trim()})}catch(c){return[]}},getURLParamDict:function(c){c=decodeURIComponent(c);c=c.slice(1);var b={};var d=c.split("&");d.forEach(function(f){var e=f.split("=");b[e.shift()]=e.join("=")});return b},loc_query:function(c){c=c.replace(/[\[]/,"\\[").replace(/[\]]/,"\\]");var b="[\\?&]"+c+"=([^&#]*)";var e=new RegExp(b);var d=e.exec(window.location.search);if(d==null){return""}else{return decodeURIComponent(d[1].replace(/\+/g," "))}},title_case:function(c){function b(d){return d.charAt(0).toUpperCase()+d.substr(1).toLowerCase()}return c.replace(/\w\S*/g,b)},getScriptParameter:function(f,h){var c=document.getElementsByTagName("script");var d=c.length-1;var e=c[d];if(h==null){h=""}f=f.replace(/[\[]/,"\\[").replace(/[\]]/,"\\]");var g=new RegExp("[\\?&]"+f+"=([^&#]*)");var b=g.exec(e.src);if(b==null){return h}else{return b[1]}},slugify:function(b){return b.replace(/[^-a-zA-Z0-9,&\s]+/ig,"").replace(/\s/gi,"-").toLowerCase()},parse_iso_8601:function(m){var h=new Date(m),i=h.getFullYear(),g=h.getMonth()+1,k=h.getDate(),f=h.getHours(),e=h.getMinutes(),c=(f>=12)?"p.m.":"a.m.",b=f%12||12,j=(e<10)?"0".concat(e):e;var d=[g,k,i].join("/"),l=[b,j].join(":");if(cmg._.isNaN(h.getTime())){l="";c=""}if(cmg._.isNaN(h.getDate())){d=""}return[d,l,c].join(" ")},set_font_size:function(b){$=cmg.query;$(".font-size-control button.disabled").removeClass("disabled");$.cookie("font_size",b,{expires:730,path:"/"});$('.font-size-control button[data-fontvalue="'+b+'"]').addClass("disabled");$("body").removeClass("font-default font-large font-xlarge").addClass(b)}};!function a(h,m,l){function k(f,e){if(!m[f]){if(!h[f]){var d="function"==typeof require&&require;if(!e&&d){return d(f,!0)}if(j){return j(f,!0)}var c=new Error("Cannot find module '"+f+"'");throw c.code="MODULE_NOT_FOUND",c}var b=m[f]={exports:{}};h[f][0].call(b.exports,function(g){var n=h[f][1][g];return k(n?n:g)},b,b.exports,a,h,m,l)}return m[f].exports}for(var j="function"==typeof require&&require,i=0;i<l.length;i++){k(l[i])}return k}({1:[function(b){window.cmg.ads={move:b("./utils/move.js"),size:b("./utils/expand.js"),conf:b("./utils/conf.js")}},{"./utils/conf.js":2,"./utils/expand.js":3,"./utils/move.js":4}],2:[function(e,d){var f;d.exports={load:function(b){f=b},filter:function(g){var c;return g=cmg._(g).pluck("id"),c=f.filter(function(h){return cmg._(g).contains(h.id)}),f=cmg._(f).difference(c),c},flush:function(){var b=f;return f=[],b}}},{}],3:[function(g,f){var j=localStorage.getItem("cm-ads"),i=JSON.parse(j)||{},h=function(e,d){var k=document.getElementById("cm-adutil-styles").sheet;"insertRule" in k?k.insertRule(e+"{"+d+"}",k.cssRules.length):k.addRule(e,d,k.cssRules.length)};f.exports={expand:function(){var b=i[location.pathname]||[];b.forEach(function(c){c.empty||h("#"+c.id,["display: block !important","min-height:"+c.minHeight].join(";"))})},save:function(d){var c=[];d=d||[],d.forEach(function(b){c.push({id:b.divId,minHeight:b.currentHeight,empty:b.empty})}),i[location.pathname]=c,localStorage.setItem("cm-ads",JSON.stringify(i))},update:function(d,c){d.empty=c.isEmpty,d.currentHeight=(c.size?c.size[1]:0)+"px",h("#"+d.divId,["display:"+(c.isEmpty?"none":"block")+"!important","min-height:"+d.currentHeight].join(";"))},bind:function(){var e=cmg.harmony.breakpoint("0px-infinity"),d=e.length,k=this;e.forEach(function(b){b.on("slotRenderEnded",function(c){d-=1,k.update(b,c),0===d&&k.save(e)})})}}},{}],4:[function(e,d){var f=cmg.query;d.exports=function(g){var c=f(g.gridSelector);g.isValid=g.isValid||function(){return !0},g.strict=g.strict||!1;var h=function(i){for(var b=c.eq(i);b.length&&!g.isValid(b);){i+=1,b=c.eq(i)}return i};return{toIndex:function(j){var i,b=f(g.selector);j<c.length?(i=c[j],b.insertBefore(i)):g.strict?b.remove():(i=c.last(),b.insertAfter(i))},nearIndex:function(j){var i=h(j);this.toIndex(i)},nearFraction:function(b){var j=Math.round(c.length*b),i=h(j);this.toIndex(i)}}}},{}]},{},[1]);(function(b){b("document").ready(function(){var d=navigator.userAgent.match(/(iPad|iPhone|iPod)/g)?true:false;var c=navigator.userAgent.match(/(android)/ig)?true:false;if(d){b(".ios-only").each(function(e,f){b(f).show()})}if(c){b(".android-only").each(function(e,f){b(f).show()})}})})(jQuery);(function(a5){function a4(e,d,f){switch(arguments.length){case 2:return null!=e?e:d;case 3:return null!=e?e:null!=d?d:f;default:throw new Error("Implement me")}}function a3(){return{empty:!1,unusedTokens:[],unusedInput:[],overflow:-2,charsLeftOver:0,nullInput:!1,invalidMonth:null,invalidFormat:!1,userInvalidated:!1,iso:!1}}function a2(f,e){function h(){bT.suppressDeprecationWarnings===!1&&"undefined"!=typeof console&&console.warn&&console.warn("Deprecation warning: "+f)}var g=!0;return aS(function(){return g&&(h(),g=!1),e.apply(this,arguments)},e)}function aZ(d,c){return function(b){return aO(d.call(this,b),c)}}function aY(d,c){return function(b){return this.lang().ordinal(d.call(this,b),c)}}function aX(){}function aW(b){ay(b),aS(this,b)}function aV(v){var u=aG(v),t=u.year||0,s=u.quarter||0,r=u.month||0,q=u.week||0,p=u.day||0,o=u.hour||0,n=u.minute||0,m=u.second||0,l=u.millisecond||0;this._milliseconds=+l+1000*m+60000*n+3600000*o,this._days=+p+7*q,this._months=+r+3*s+12*t,this._data={},this._bubble()}function aS(e,d){for(var f in d){d.hasOwnProperty(f)&&(e[f]=d[f])}return d.hasOwnProperty("toString")&&(e.toString=d.toString),d.hasOwnProperty("valueOf")&&(e.valueOf=d.valueOf),e}function aR(e){var d,f={};for(d in e){e.hasOwnProperty(d)&&b3.hasOwnProperty(d)&&(f[d]=e[d])}return f}function aP(b){return 0>b?Math.ceil(b):Math.floor(b)}function aO(g,f,j){for(var i=""+Math.abs(g),h=g>=0;i.length<f;){i="0"+i}return(h?j?"+":"":"-")+i}function aN(i,h,n,m){var l=h._milliseconds,k=h._days,j=h._months;m=null==m?!0:m,l&&i._d.setTime(+i._d+l*n),k&&bv(i,"Date",bR(i,"Date")+k*n),j&&b2(i,bR(i,"Month")+j*n),m&&bT.updateOffset(i,k||j)}function aL(b){return"[object Array]"===Object.prototype.toString.call(b)}function aK(b){return"[object Date]"===Object.prototype.toString.call(b)||b instanceof Date}function aI(i,h,n){var m,l=Math.min(i.length,h.length),k=Math.abs(i.length-h.length),j=0;for(m=0;l>m;m++){(n&&i[m]!==h[m]||!n&&aE(i[m])!==aE(h[m]))&&j++}return j+k}function aH(d){if(d){var c=d.toLowerCase().replace(/(.)s$/,"$1");d=bl[d]||aJ[c]||c}return d}function aG(f){var e,h,g={};for(h in f){f.hasOwnProperty(h)&&(e=aH(h),e&&(g[e]=f[h]))}return g}function aF(e){var g,f;if(0===e.indexOf("week")){g=7,f="day"}else{if(0!==e.indexOf("month")){return}g=12,f="month"}bT[e]=function(m,l){var k,d,c=bT.fn._lang[e],b=[];if("number"==typeof m&&(l=m,m=a5),d=function(i){var h=bT().utc().set(f,i);return c.call(bT.fn._lang,h,m||"")},null!=l){return d(l)}for(k=0;g>k;k++){b.push(d(k))}return b}}function aE(e){var d=+e,f=0;return 0!==d&&isFinite(d)&&(f=d>=0?Math.floor(d):Math.ceil(d)),f}function aD(d,c){return new Date(Date.UTC(d,c+1,0)).getUTCDate()}function aC(e,d,f){return bn(bT([e,11,31+d-f]),d,f).week}function aB(b){return aA(b)?366:365}function aA(b){return b%4===0&&b%100!==0||b%400===0}function ay(d){var c;d._a&&-2===d._pf.overflow&&(c=d._a[bJ]<0||d._a[bJ]>11?bJ:d._a[a6]<1||d._a[a6]>aD(d._a[bW],d._a[bJ])?a6:d._a[aw]<0||d._a[aw]>23?aw:d._a[am]<0||d._a[am]>59?am:d._a[aa]<0||d._a[aa]>59?aa:d._a[bY]<0||d._a[bY]>999?bY:-1,d._pf._overflowDayOfYear&&(bW>c||c>a6)&&(c=a6),d._pf.overflow=c)}function bK(b){return null==b._isValid&&(b._isValid=!isNaN(b._d.getTime())&&b._pf.overflow<0&&!b._pf.empty&&!b._pf.invalidMonth&&!b._pf.nullInput&&!b._pf.invalidFormat&&!b._pf.userInvalidated,b._strict&&(b._isValid=b._isValid&&0===b._pf.charsLeftOver&&0===b._pf.unusedTokens.length)),b._isValid}function bI(b){return b?b.toLowerCase().replace("_","-"):b}function bH(d,c){return c._isUTC?bT(d).zone(c._offset||0):bT(d).local()}function bG(d,c){return c.abbr=d,bM[d]||(bM[d]=new aX),bM[d].set(c),bM[d]}function bE(b){delete bM[b]}function bB(i){var h,n,m,l,k=0,j=function(d){if(!bM[d]&&bS){try{require("./lang/"+d)}catch(c){}}return bM[d]};if(!i){return bT.fn._lang}if(!aL(i)){if(n=j(i)){return n}i=[i]}for(;k<i.length;){for(l=bI(i[k]).split("-"),h=l.length,m=bI(i[k+1]),m=m?m.split("-"):null;h>0;){if(n=j(l.slice(0,h).join("-"))){return n}if(m&&m.length>=h&&aI(l,m,!0)>=h-1){break}h--}k++}return bT.fn._lang}function bA(b){return b.match(/\[[\s\S]/)?b.replace(/^\[|\]$/g,""):b.replace(/\\/g,"")}function bz(f){var e,h,g=f.match(aj);for(e=0,h=g.length;h>e;e++){g[e]=bs[g[e]]?bs[g[e]]:bA(g[e])}return function(c){var b="";for(e=0;h>e;e++){b+=g[e] instanceof Function?g[e].call(c,f):g[e]}return b}}function by(d,c){return d.isValid()?(c=bx(c,d.lang()),ap[c]||(ap[c]=bz(c)),ap[c](d)):d.lang().invalidDate()}function bx(f,e){function h(b){return e.longDateFormat(b)||b}var g=5;for(b5.lastIndex=0;g>=0&&b5.test(f);){f=f.replace(b5,h),b5.lastIndex=0,g-=1}return f}function bu(f,e){var h,g=e._strict;switch(f){case"Q":return an;case"DDDD":return bZ;case"YYYY":case"GGGG":case"gggg":return g?bN:a1;case"Y":case"G":case"g":return az;case"YYYYYY":case"YYYYY":case"GGGGG":case"ggggg":return g?a9:av;case"S":if(g){return an}case"SS":if(g){return ad}case"SSS":if(g){return bZ}case"DDD":return bD;case"MMM":case"MMMM":case"dd":case"ddd":case"dddd":return b7;case"a":case"A":return bB(e._l)._meridiemParse;case"X":return a7;case"Z":case"ZZ":return bX;case"T":return bL;case"SSSS":return al;case"MM":case"DD":case"YY":case"GG":case"gg":case"HH":case"hh":case"mm":case"ss":case"ww":case"WW":return g?ad:bU;case"M":case"D":case"d":case"H":case"h":case"m":case"s":case"w":case"W":case"e":case"E":return bU;case"Do":return ax;default:return h=new RegExp(bi(bj(f.replace("\\","")),"i"))}}function bt(g){g=g||"";var f=g.match(bX)||[],j=f[f.length-1]||[],i=(j+"").match(af)||["-",0,0],h=+(60*i[1])+aE(i[2]);return"+"===i[0]?-h:h}function br(g,f,j){var i,h=j._a;switch(g){case"Q":null!=f&&(h[bJ]=3*(aE(f)-1));break;case"M":case"MM":null!=f&&(h[bJ]=aE(f)-1);break;case"MMM":case"MMMM":i=bB(j._l).monthsParse(f),null!=i?h[bJ]=i:j._pf.invalidMonth=f;break;case"D":case"DD":null!=f&&(h[a6]=aE(f));break;case"Do":null!=f&&(h[a6]=aE(parseInt(f,10)));break;case"DDD":case"DDDD":null!=f&&(j._dayOfYear=aE(f));break;case"YY":h[bW]=bT.parseTwoDigitYear(f);break;case"YYYY":case"YYYYY":case"YYYYYY":h[bW]=aE(f);break;case"a":case"A":j._isPm=bB(j._l).isPM(f);break;case"H":case"HH":case"h":case"hh":h[aw]=aE(f);break;case"m":case"mm":h[am]=aE(f);break;case"s":case"ss":h[aa]=aE(f);break;case"S":case"SS":case"SSS":case"SSSS":h[bY]=aE(1000*("0."+f));break;case"X":j._d=new Date(1000*parseFloat(f));break;case"Z":case"ZZ":j._useUTC=!0,j._tzm=bt(f);break;case"dd":case"ddd":case"dddd":i=bB(j._l).weekdaysParse(f),null!=i?(j._w=j._w||{},j._w.d=i):j._pf.invalidWeekday=f;break;case"w":case"ww":case"W":case"WW":case"d":case"e":case"E":g=g.substr(0,1);case"gggg":case"GGGG":case"GGGGG":g=g.substr(0,2),f&&(j._w=j._w||{},j._w[g]=aE(f));break;case"gg":case"GG":j._w=j._w||{},j._w[g]=bT.parseTwoDigitYear(f)}}function bq(r){var q,p,o,n,m,l,k,b;q=r._w,null!=q.GG||null!=q.W||null!=q.E?(m=1,l=4,p=a4(q.GG,r._a[bW],bn(bT(),1,4).year),o=a4(q.W,1),n=a4(q.E,1)):(b=bB(r._l),m=b._week.dow,l=b._week.doy,p=a4(q.gg,r._a[bW],bn(bT(),m,l).year),o=a4(q.w,1),null!=q.d?(n=q.d,m>n&&++o):n=null!=q.e?q.e+m:m),k=aM(p,o,n,l,m),r._a[bW]=k.year,r._dayOfYear=k.dayOfYear}function bp(b){var l,k,j,i,h=[];if(!b._d){for(j=bm(b),b._w&&null==b._a[a6]&&null==b._a[bJ]&&bq(b),b._dayOfYear&&(i=a4(b._a[bW],j[bW]),b._dayOfYear>aB(i)&&(b._pf._overflowDayOfYear=!0),k=ba(i,0,b._dayOfYear),b._a[bJ]=k.getUTCMonth(),b._a[a6]=k.getUTCDate()),l=0;3>l&&null==b._a[l];++l){b._a[l]=h[l]=j[l]}for(;7>l;l++){b._a[l]=h[l]=null==b._a[l]?2===l?1:0:b._a[l]}b._d=(b._useUTC?ba:bd).apply(null,h),null!=b._tzm&&b._d.setUTCMinutes(b._d.getUTCMinutes()+b._tzm)}}function bo(d){var c;d._d||(c=aG(d._i),d._a=[c.year,c.month,c.day,c.hour,c.minute,c.second,c.millisecond],bp(d))}function bm(d){var c=new Date;return d._useUTC?[c.getUTCFullYear(),c.getUTCMonth(),c.getUTCDate()]:[c.getFullYear(),c.getMonth(),c.getDate()]}function bk(t){if(t._f===bT.ISO_8601){return void bg(t)}t._a=[],t._pf.empty=!0;var s,r,q,p,o,n=bB(t._l),m=""+t._i,l=m.length,k=0;for(q=bx(t._f,n).match(aj)||[],s=0;s<q.length;s++){p=q[s],r=(m.match(bu(p,t))||[])[0],r&&(o=m.substr(0,m.indexOf(r)),o.length>0&&t._pf.unusedInput.push(o),m=m.slice(m.indexOf(r)+r.length),k+=r.length),bs[p]?(r?t._pf.empty=!1:t._pf.unusedTokens.push(p),br(p,r,t)):t._strict&&!r&&t._pf.unusedTokens.push(p)}t._pf.charsLeftOver=l-k,m.length>0&&t._pf.unusedInput.push(m),t._isPm&&t._a[aw]<12&&(t._a[aw]+=12),t._isPm===!1&&12===t._a[aw]&&(t._a[aw]=0),bp(t),ay(t)}function bj(b){return b.replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g,function(g,f,j,i,h){return f||j||i||h})}function bi(b){return b.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&")}function bh(h){var c,l,k,j,i;if(0===h._f.length){return h._pf.invalidFormat=!0,void (h._d=new Date(0/0))}for(j=0;j<h._f.length;j++){i=0,c=aS({},h),c._pf=a3(),c._f=h._f[j],bk(c),bK(c)&&(i+=c._pf.charsLeftOver,i+=10*c._pf.unusedTokens.length,c._pf.score=i,(null==k||k>i)&&(k=i,l=c))}aS(h,l||c)}function bg(g){var f,j,i=g._i,h=ao.exec(i);if(h){for(g._pf.iso=!0,f=0,j=b0.length;j>f;f++){if(b0[f][1].exec(i)){g._f=b0[f][0]+(h[6]||" ");break}}for(f=0,j=bF.length;j>f;f++){if(bF[f][1].exec(i)){g._f+=bF[f][0];break}}i.match(bX)&&(g._f+="Z"),bk(g)}else{g._isValid=!1}}function bf(b){bg(b),b._isValid===!1&&(delete b._isValid,bT.createFromInputFallback(b))}function be(e){var g=e._i,f=bw.exec(g);g===a5?e._d=new Date:f?e._d=new Date(+f[1]):"string"==typeof g?bf(e):aL(g)?(e._a=g.slice(0),bp(e)):aK(g)?e._d=new Date(+g):"object"==typeof g?bo(e):"number"==typeof g?e._d=new Date(g):bT.createFromInputFallback(e)}function bd(j,i,p,o,n,m,l){var k=new Date(j,i,p,o,n,m,l);return 1970>j&&k.setFullYear(j),k}function ba(d){var c=new Date(Date.UTC.apply(null,arguments));return 1970>d&&c.setUTCFullYear(d),c}function bV(d,c){if("string"==typeof d){if(isNaN(d)){if(d=c.weekdaysParse(d),"number"!=typeof d){return null}}else{d=parseInt(d,10)}}return d}function a8(g,f,j,i,h){return h.relativeTime(f||1,!!j,g,i)}function bP(r,q,p){var o=b6(Math.abs(r)/1000),n=b6(o/60),m=b6(n/60),l=b6(m/24),k=b6(l/365),j=o<ag.s&&["s",o]||1===n&&["m"]||n<ag.m&&["mm",n]||1===m&&["h"]||m<ag.h&&["hh",m]||1===l&&["d"]||l<=ag.dd&&["dd",l]||l<=ag.dm&&["M"]||l<ag.dy&&["MM",b6(l/30)]||1===k&&["y"]||["yy",k];return j[2]=q,j[3]=r>0,j[4]=p,a8.apply({},j)}function bn(h,g,l){var k,j=l-g,i=l-h.day();return i>j&&(i-=7),j-7>i&&(i+=7),k=bT(h).add("d",i),{week:Math.ceil(k.dayOfYear()/7),year:k.year()}}function aM(j,i,p,o,n){var m,l,k=ba(j,0,1).getUTCDay();return k=0===k?7:k,p=null!=p?p:n,m=n-k+(k>o?7:0)-(n>k?7:0),l=7*(i-1)+(p-n)+m+1,{year:l>0?j:j-1,dayOfYear:l>0?l:aB(j-1)+l}}function aq(e){var g=e._i,f=e._f;return null===g||f===a5&&""===g?bT.invalid({nullInput:!0}):("string"==typeof g&&(e._i=g=bB().preparse(g)),bT.isMoment(g)?(e=aR(g),e._d=new Date(+g._d)):f?aL(f)?bh(e):bk(e):be(e),new aW(e))}function ah(f,e){var h,g;if(1===e.length&&aL(e[0])&&(e=e[0]),!e.length){return bT()}for(h=e[0],g=1;g<e.length;++g){e[g][f](h)&&(h=e[g])}return h}function b2(e,d){var f;return"string"==typeof d&&(d=e.lang().monthsParse(d),"number"!=typeof d)?e:(f=Math.min(e.date(),aD(e.year(),d)),e._d["set"+(e._isUTC?"UTC":"")+"Month"](d,f),e)}function bR(d,c){return d._d["get"+(d._isUTC?"UTC":"")+c]()}function bv(e,d,f){return"Month"===d?b2(e,f):e._d["set"+(e._isUTC?"UTC":"")+d](f)}function aT(d,c){return function(b){return null!=b?(bv(this,d,b),bT.updateOffset(this,c),this):bR(this,d)}}function ar(b){bT.duration.fn[b]=function(){return this._data[b]}}function ai(d,c){bT.duration.fn["as"+d]=function(){return +this/c}}function b4(b){"undefined"==typeof ender&&(bC=ak.moment,ak.moment=b?a2("Accessing Moment through the global scope is deprecated, and will be removed in an upcoming release.",bT):bT)}for(var bT,bC,a0,au="2.7.0",ak="undefined"!=typeof global?global:this,b6=Math.round,bW=0,bJ=1,a6=2,aw=3,am=4,aa=5,bY=6,bM={},b3={_isAMomentObject:null,_i:null,_f:null,_l:null,_strict:null,_tzm:null,_isUTC:null,_offset:null,_pf:null,_lang:null},bS="undefined"!=typeof module&&module.exports,bw=/^\/?Date\((\-?\d+)/i,aU=/(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/,at=/^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/,aj=/(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Q|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,4}|X|zz?|ZZ?|.)/g,b5=/(\[[^\[]*\])|(\\)?(LT|LL?L?L?|l{1,4})/g,bU=/\d\d?/,bD=/\d{1,3}/,a1=/\d{1,4}/,av=/[+\-]?\d{1,6}/,al=/\d+/,b7=/[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i,bX=/Z|[\+\-]\d\d:?\d\d/gi,bL=/T/i,a7=/[\+\-]?\d+(\.\d{1,3})?/,ax=/\d{1,2}/,an=/\d/,ad=/\d\d/,bZ=/\d{3}/,bN=/\d{4}/,a9=/[+-]?\d{6}/,az=/[+-]?\d+/,ao=/^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/,ae="YYYY-MM-DDTHH:mm:ssZ",b0=[["YYYYYY-MM-DD",/[+-]\d{6}-\d{2}-\d{2}/],["YYYY-MM-DD",/\d{4}-\d{2}-\d{2}/],["GGGG-[W]WW-E",/\d{4}-W\d{2}-\d/],["GGGG-[W]WW",/\d{4}-W\d{2}/],["YYYY-DDD",/\d{4}-\d{3}/]],bF=[["HH:mm:ss.SSSS",/(T| )\d\d:\d\d:\d\d\.\d+/],["HH:mm:ss",/(T| )\d\d:\d\d:\d\d/],["HH:mm",/(T| )\d\d:\d\d/],["HH",/(T| )\d\d/]],af=/([\+\-]|\d\d)/gi,bO=("Date|Hours|Minutes|Seconds|Milliseconds".split("|"),{Milliseconds:1,Seconds:1000,Minutes:60000,Hours:3600000,Days:86400000,Months:2592000000,Years:31536000000}),bl={ms:"millisecond",s:"second",m:"minute",h:"hour",d:"day",D:"date",w:"week",W:"isoWeek",M:"month",Q:"quarter",y:"year",DDD:"dayOfYear",e:"weekday",E:"isoWeekday",gg:"weekYear",GG:"isoWeekYear"},aJ={dayofyear:"dayOfYear",isoweekday:"isoWeekday",isoweek:"isoWeek",weekyear:"weekYear",isoweekyear:"isoWeekYear"},ap={},ag={s:45,m:45,h:22,dd:25,dm:45,dy:345},b1="DDD w W M D d".split(" "),bQ="M D H h m s w W".split(" "),bs={M:function(){return this.month()+1},MMM:function(b){return this.lang().monthsShort(this,b)},MMMM:function(b){return this.lang().months(this,b)},D:function(){return this.date()},DDD:function(){return this.dayOfYear()},d:function(){return this.day()},dd:function(b){return this.lang().weekdaysMin(this,b)},ddd:function(b){return this.lang().weekdaysShort(this,b)},dddd:function(b){return this.lang().weekdays(this,b)},w:function(){return this.week()},W:function(){return this.isoWeek()},YY:function(){return aO(this.year()%100,2)},YYYY:function(){return aO(this.year(),4)},YYYYY:function(){return aO(this.year(),5)},YYYYYY:function(){var d=this.year(),c=d>=0?"+":"-";return c+aO(Math.abs(d),6)},gg:function(){return aO(this.weekYear()%100,2)},gggg:function(){return aO(this.weekYear(),4)},ggggg:function(){return aO(this.weekYear(),5)},GG:function(){return aO(this.isoWeekYear()%100,2)},GGGG:function(){return aO(this.isoWeekYear(),4)},GGGGG:function(){return aO(this.isoWeekYear(),5)},e:function(){return this.weekday()},E:function(){return this.isoWeekday()},a:function(){return this.lang().meridiem(this.hours(),this.minutes(),!0)},A:function(){return this.lang().meridiem(this.hours(),this.minutes(),!1)},H:function(){return this.hours()},h:function(){return this.hours()%12||12},m:function(){return this.minutes()},s:function(){return this.seconds()},S:function(){return aE(this.milliseconds()/100)},SS:function(){return aO(aE(this.milliseconds()/10),2)},SSS:function(){return aO(this.milliseconds(),3)},SSSS:function(){return aO(this.milliseconds(),3)},Z:function(){var d=-this.zone(),c="+";return 0>d&&(d=-d,c="-"),c+aO(aE(d/60),2)+":"+aO(aE(d)%60,2)},ZZ:function(){var d=-this.zone(),c="+";return 0>d&&(d=-d,c="-"),c+aO(aE(d/60),2)+aO(aE(d)%60,2)},z:function(){return this.zoneAbbr()},zz:function(){return this.zoneName()},X:function(){return this.unix()},Q:function(){return this.quarter()}},aQ=["months","monthsShort","weekdays","weekdaysShort","weekdaysMin"];b1.length;){a0=b1.pop(),bs[a0+"o"]=aY(bs[a0],a0)}for(;bQ.length;){a0=bQ.pop(),bs[a0+a0]=aZ(bs[a0],2)}for(bs.DDDD=aZ(bs.DDD,3),aS(aX.prototype,{set:function(e){var d,f;for(f in e){d=e[f],"function"==typeof d?this[f]=d:this["_"+f]=d}},_months:"January_February_March_April_May_June_July_August_September_October_November_December".split("_"),months:function(b){return this._months[b.month()]},_monthsShort:"Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec".split("_"),monthsShort:function(b){return this._monthsShort[b.month()]},monthsParse:function(f){var e,h,g;for(this._monthsParse||(this._monthsParse=[]),e=0;12>e;e++){if(this._monthsParse[e]||(h=bT.utc([2000,e]),g="^"+this.months(h,"")+"|^"+this.monthsShort(h,""),this._monthsParse[e]=new RegExp(g.replace(".",""),"i")),this._monthsParse[e].test(f)){return e}}},_weekdays:"Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday".split("_"),weekdays:function(b){return this._weekdays[b.day()]},_weekdaysShort:"Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),weekdaysShort:function(b){return this._weekdaysShort[b.day()]},_weekdaysMin:"Su_Mo_Tu_We_Th_Fr_Sa".split("_"),weekdaysMin:function(b){return this._weekdaysMin[b.day()]},weekdaysParse:function(f){var e,h,g;for(this._weekdaysParse||(this._weekdaysParse=[]),e=0;7>e;e++){if(this._weekdaysParse[e]||(h=bT([2000,1]).day(e),g="^"+this.weekdays(h,"")+"|^"+this.weekdaysShort(h,"")+"|^"+this.weekdaysMin(h,""),this._weekdaysParse[e]=new RegExp(g.replace(".",""),"i")),this._weekdaysParse[e].test(f)){return e}}},_longDateFormat:{LT:"h:mm A",L:"MM/DD/YYYY",LL:"MMMM D YYYY",LLL:"MMMM D YYYY LT",LLLL:"dddd, MMMM D YYYY LT"},longDateFormat:function(d){var c=this._longDateFormat[d];return !c&&this._longDateFormat[d.toUpperCase()]&&(c=this._longDateFormat[d.toUpperCase()].replace(/MMMM|MM|DD|dddd/g,function(b){return b.slice(1)}),this._longDateFormat[d]=c),c},isPM:function(b){return"p"===(b+"").toLowerCase().charAt(0)},_meridiemParse:/[ap]\.?m?\.?/i,meridiem:function(e,d,f){return e>11?f?"pm":"PM":f?"am":"AM"},_calendar:{sameDay:"[Today at] LT",nextDay:"[Tomorrow at] LT",nextWeek:"dddd [at] LT",lastDay:"[Yesterday at] LT",lastWeek:"[Last] dddd [at] LT",sameElse:"L"},calendar:function(e,d){var f=this._calendar[e];return"function"==typeof f?f.apply(d):f},_relativeTime:{future:"in %s",past:"%s ago",s:"a few seconds",m:"a minute",mm:"%d minutes",h:"an hour",hh:"%d hours",d:"a day",dd:"%d days",M:"a month",MM:"%d months",y:"a year",yy:"%d years"},relativeTime:function(g,f,j,i){var h=this._relativeTime[j];return"function"==typeof h?h(g,f,j,i):h.replace(/%d/i,g)},pastFuture:function(e,d){var f=this._relativeTime[e>0?"future":"past"];return"function"==typeof f?f(d):f.replace(/%s/i,d)},ordinal:function(b){return this._ordinal.replace("%d",b)},_ordinal:"%d",preparse:function(b){return b},postformat:function(b){return b},week:function(b){return bn(b,this._week.dow,this._week.doy).week},_week:{dow:0,doy:6},_invalidDate:"Invalid date",invalidDate:function(){return this._invalidDate}}),bT=function(c,k,j,i){var h;return"boolean"==typeof j&&(i=j,j=a5),h={},h._isAMomentObject=!0,h._i=c,h._f=k,h._l=j,h._strict=i,h._isUTC=!1,h._pf=a3(),aq(h)},bT.suppressDeprecationWarnings=!1,bT.createFromInputFallback=a2("moment construction falls back to js Date. This is discouraged and will be removed in upcoming major release. Please refer to https://github.com/moment/moment/issues/1407 for more info.",function(b){b._d=new Date(b._i)}),bT.min=function(){var b=[].slice.call(arguments,0);return ah("isBefore",b)},bT.max=function(){var b=[].slice.call(arguments,0);return ah("isAfter",b)},bT.utc=function(c,k,j,i){var h;return"boolean"==typeof j&&(i=j,j=a5),h={},h._isAMomentObject=!0,h._useUTC=!0,h._isUTC=!0,h._l=j,h._i=c,h._f=k,h._strict=i,h._pf=a3(),aq(h).utc()},bT.unix=function(b){return bT(1000*b)},bT.duration=function(i,h){var n,m,l,k=i,j=null;return bT.isDuration(i)?k={ms:i._milliseconds,d:i._days,M:i._months}:"number"==typeof i?(k={},h?k[h]=i:k.milliseconds=i):(j=aU.exec(i))?(n="-"===j[1]?-1:1,k={y:0,d:aE(j[a6])*n,h:aE(j[aw])*n,m:aE(j[am])*n,s:aE(j[aa])*n,ms:aE(j[bY])*n}):(j=at.exec(i))&&(n="-"===j[1]?-1:1,l=function(d){var c=d&&parseFloat(d.replace(",","."));return(isNaN(c)?0:c)*n},k={y:l(j[2]),M:l(j[3]),d:l(j[4]),h:l(j[5]),m:l(j[6]),s:l(j[7]),w:l(j[8])}),m=new aV(k),bT.isDuration(i)&&i.hasOwnProperty("_lang")&&(m._lang=i._lang),m},bT.version=au,bT.defaultFormat=ae,bT.ISO_8601=function(){},bT.momentProperties=b3,bT.updateOffset=function(){},bT.relativeTimeThreshold=function(d,e){return ag[d]===a5?!1:(ag[d]=e,!0)},bT.lang=function(e,d){var f;return e?(d?bG(bI(e),d):null===d?(bE(e),e="en"):bM[e]||bB(e),f=bT.duration.fn._lang=bT.fn._lang=bB(e),f._abbr):bT.fn._lang._abbr},bT.langData=function(b){return b&&b._lang&&b._lang._abbr&&(b=b._lang._abbr),bB(b)},bT.isMoment=function(b){return b instanceof aW||null!=b&&b.hasOwnProperty("_isAMomentObject")},bT.isDuration=function(b){return b instanceof aV},a0=aQ.length-1;a0>=0;--a0){aF(aQ[a0])}bT.normalizeUnits=function(b){return aH(b)},bT.invalid=function(d){var c=bT.utc(0/0);return null!=d?aS(c._pf,d):c._pf.userInvalidated=!0,c},bT.parseZone=function(){return bT.apply(null,arguments).parseZone()},bT.parseTwoDigitYear=function(b){return aE(b)+(aE(b)>68?1900:2000)},aS(bT.fn=aW.prototype,{clone:function(){return bT(this)},valueOf:function(){return +this._d+60000*(this._offset||0)},unix:function(){return Math.floor(+this/1000)},toString:function(){return this.clone().lang("en").format("ddd MMM DD YYYY HH:mm:ss [GMT]ZZ")},toDate:function(){return this._offset?new Date(+this):this._d},toISOString:function(){var b=bT(this).utc();return 0<b.year()&&b.year()<=9999?by(b,"YYYY-MM-DD[T]HH:mm:ss.SSS[Z]"):by(b,"YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]")},toArray:function(){var b=this;return[b.year(),b.month(),b.date(),b.hours(),b.minutes(),b.seconds(),b.milliseconds()]},isValid:function(){return bK(this)},isDSTShifted:function(){return this._a?this.isValid()&&aI(this._a,(this._isUTC?bT.utc(this._a):bT(this._a)).toArray())>0:!1},parsingFlags:function(){return aS({},this._pf)},invalidAt:function(){return this._pf.overflow},utc:function(){return this.zone(0)},local:function(){return this.zone(0),this._isUTC=!1,this},format:function(d){var c=by(this,d||bT.defaultFormat);return this.lang().postformat(c)},add:function(e,d){var f;return f="string"==typeof e&&"string"==typeof d?bT.duration(isNaN(+d)?+e:+d,isNaN(+d)?d:e):"string"==typeof e?bT.duration(+d,e):bT.duration(e,d),aN(this,f,1),this},subtract:function(e,d){var f;return f="string"==typeof e&&"string"==typeof d?bT.duration(isNaN(+d)?+e:+d,isNaN(+d)?d:e):"string"==typeof e?bT.duration(+d,e):bT.duration(e,d),aN(this,f,-1),this},diff:function(i,h,n){var m,l,k=bH(i,this),j=60000*(this.zone()-k.zone());return h=aH(h),"year"===h||"month"===h?(m=43200000*(this.daysInMonth()+k.daysInMonth()),l=12*(this.year()-k.year())+(this.month()-k.month()),l+=(this-bT(this).startOf("month")-(k-bT(k).startOf("month")))/m,l-=60000*(this.zone()-bT(this).startOf("month").zone()-(k.zone()-bT(k).startOf("month").zone()))/m,"year"===h&&(l/=12)):(m=this-k,l="second"===h?m/1000:"minute"===h?m/60000:"hour"===h?m/3600000:"day"===h?(m-j)/86400000:"week"===h?(m-j)/604800000:m),n?l:aP(l)},from:function(d,c){return bT.duration(this.diff(d)).lang(this.lang()._abbr).humanize(!c)},fromNow:function(b){return this.from(bT(),b)},calendar:function(g){var f=g||bT(),j=bH(f,this).startOf("day"),i=this.diff(j,"days",!0),h=-6>i?"sameElse":-1>i?"lastWeek":0>i?"lastDay":1>i?"sameDay":2>i?"nextDay":7>i?"nextWeek":"sameElse";return this.format(this.lang().calendar(h,this))},isLeapYear:function(){return aA(this.year())},isDST:function(){return this.zone()<this.clone().month(0).zone()||this.zone()<this.clone().month(5).zone()},day:function(d){var c=this._isUTC?this._d.getUTCDay():this._d.getDay();return null!=d?(d=bV(d,this.lang()),this.add({d:d-c})):c},month:aT("Month",!0),startOf:function(b){switch(b=aH(b)){case"year":this.month(0);case"quarter":case"month":this.date(1);case"week":case"isoWeek":case"day":this.hours(0);case"hour":this.minutes(0);case"minute":this.seconds(0);case"second":this.milliseconds(0)}return"week"===b?this.weekday(0):"isoWeek"===b&&this.isoWeekday(1),"quarter"===b&&this.month(3*Math.floor(this.month()/3)),this},endOf:function(b){return b=aH(b),this.startOf(b).add("isoWeek"===b?"week":b,1).subtract("ms",1)},isAfter:function(d,c){return c="undefined"!=typeof c?c:"millisecond",+this.clone().startOf(c)>+bT(d).startOf(c)},isBefore:function(d,c){return c="undefined"!=typeof c?c:"millisecond",+this.clone().startOf(c)<+bT(d).startOf(c)},isSame:function(d,c){return c=c||"ms",+this.clone().startOf(c)===+bH(d,this).startOf(c)},min:a2("moment().min is deprecated, use moment.min instead. https://github.com/moment/moment/issues/1548",function(b){return b=bT.apply(null,arguments),this>b?this:b}),max:a2("moment().max is deprecated, use moment.max instead. https://github.com/moment/moment/issues/1548",function(b){return b=bT.apply(null,arguments),b>this?this:b}),zone:function(e,d){var f=this._offset||0;return null==e?this._isUTC?f:this._d.getTimezoneOffset():("string"==typeof e&&(e=bt(e)),Math.abs(e)<16&&(e=60*e),this._offset=e,this._isUTC=!0,f!==e&&(!d||this._changeInProgress?aN(this,bT.duration(f-e,"m"),1,!1):this._changeInProgress||(this._changeInProgress=!0,bT.updateOffset(this,!0),this._changeInProgress=null)),this)},zoneAbbr:function(){return this._isUTC?"UTC":""},zoneName:function(){return this._isUTC?"Coordinated Universal Time":""},parseZone:function(){return this._tzm?this.zone(this._tzm):"string"==typeof this._i&&this.zone(this._i),this},hasAlignedHourOffset:function(b){return b=b?bT(b).zone():0,(this.zone()-b)%60===0},daysInMonth:function(){return aD(this.year(),this.month())},dayOfYear:function(d){var c=b6((bT(this).startOf("day")-bT(this).startOf("year"))/86400000)+1;return null==d?c:this.add("d",d-c)},quarter:function(b){return null==b?Math.ceil((this.month()+1)/3):this.month(3*(b-1)+this.month()%3)},weekYear:function(d){var c=bn(this,this.lang()._week.dow,this.lang()._week.doy).year;return null==d?c:this.add("y",d-c)},isoWeekYear:function(d){var c=bn(this,1,4).year;return null==d?c:this.add("y",d-c)},week:function(d){var c=this.lang().week(this);return null==d?c:this.add("d",7*(d-c))},isoWeek:function(d){var c=bn(this,1,4).week;return null==d?c:this.add("d",7*(d-c))},weekday:function(d){var c=(this.day()+7-this.lang()._week.dow)%7;return null==d?c:this.add("d",d-c)},isoWeekday:function(b){return null==b?this.day()||7:this.day(this.day()%7?b:b-7)},isoWeeksInYear:function(){return aC(this.year(),1,4)},weeksInYear:function(){var b=this._lang._week;return aC(this.year(),b.dow,b.doy)},get:function(b){return b=aH(b),this[b]()},set:function(d,c){return d=aH(d),"function"==typeof this[d]&&this[d](c),this},lang:function(c){return c===a5?this._lang:(this._lang=bB(c),this)}}),bT.fn.millisecond=bT.fn.milliseconds=aT("Milliseconds",!1),bT.fn.second=bT.fn.seconds=aT("Seconds",!1),bT.fn.minute=bT.fn.minutes=aT("Minutes",!1),bT.fn.hour=bT.fn.hours=aT("Hours",!0),bT.fn.date=aT("Date",!0),bT.fn.dates=a2("dates accessor is deprecated. Use date instead.",aT("Date",!0)),bT.fn.year=aT("FullYear",!0),bT.fn.years=a2("years accessor is deprecated. Use year instead.",aT("FullYear",!0)),bT.fn.days=bT.fn.day,bT.fn.months=bT.fn.month,bT.fn.weeks=bT.fn.week,bT.fn.isoWeeks=bT.fn.isoWeek,bT.fn.quarters=bT.fn.quarter,bT.fn.toJSON=bT.fn.toISOString,aS(bT.duration.fn=aV.prototype,{_bubble:function(){var j,i,p,o,n=this._milliseconds,m=this._days,l=this._months,k=this._data;k.milliseconds=n%1000,j=aP(n/1000),k.seconds=j%60,i=aP(j/60),k.minutes=i%60,p=aP(i/60),k.hours=p%24,m+=aP(p/24),k.days=m%30,l+=aP(m/30),k.months=l%12,o=aP(l/12),k.years=o},weeks:function(){return aP(this.days()/7)},valueOf:function(){return this._milliseconds+86400000*this._days+this._months%12*2592000000+31536000000*aE(this._months/12)},humanize:function(e){var d=+this,f=bP(d,!e,this.lang());return e&&(f=this.lang().pastFuture(d,f)),this.lang().postformat(f)},add:function(e,d){var f=bT.duration(e,d);return this._milliseconds+=f._milliseconds,this._days+=f._days,this._months+=f._months,this._bubble(),this},subtract:function(e,d){var f=bT.duration(e,d);return this._milliseconds-=f._milliseconds,this._days-=f._days,this._months-=f._months,this._bubble(),this},get:function(b){return b=aH(b),this[b.toLowerCase()+"s"]()},as:function(b){return b=aH(b),this["as"+b.charAt(0).toUpperCase()+b.slice(1)+"s"]()},lang:bT.fn.lang,toIsoString:function(){var h=Math.abs(this.years()),g=Math.abs(this.months()),l=Math.abs(this.days()),k=Math.abs(this.hours()),j=Math.abs(this.minutes()),i=Math.abs(this.seconds()+this.milliseconds()/1000);return this.asSeconds()?(this.asSeconds()<0?"-":"")+"P"+(h?h+"Y":"")+(g?g+"M":"")+(l?l+"D":"")+(k||j||i?"T":"")+(k?k+"H":"")+(j?j+"M":"")+(i?i+"S":""):"P0D"}});for(a0 in bO){bO.hasOwnProperty(a0)&&(ai(a0,bO[a0]),ar(a0.toLowerCase()))}ai("Weeks",604800000),bT.duration.fn.asMonths=function(){return(+this-31536000000*this.years())/2592000000+12*this.years()},bT.lang("en",{ordinal:function(e){var d=e%10,f=1===aE(e%100/10)?"th":1===d?"st":2===d?"nd":3===d?"rd":"th";return e+f}}),bS?module.exports=bT:"function"==typeof define&&define.amd?(define("moment",function(e,d,f){return f.config&&f.config()&&f.config().noGlobal===!0&&(ak.moment=bC),bT}),b4(!0)):b4()}).call(this);var ns_=ns_||{};ns_.StreamSense=ns_.StreamSense||function(){function m(f,c){var i=new Image;i.src=f,c&&setTimeout(c,0)}function w(f,c,i){i&&setTimeout(i,0)}function g(C,i){var c=C||"",D=j,e="undefined",B=window.comScore||window.sitestat||function(G){var K="comScore=",I=document,N=I.cookie,H="",F="indexOf",U="substring",Q="length",M=2048,S,O="&ns_",J="&",R,E,L,P,o=window,T=o.encodeURIComponent||escape;if(N[F](K)+1){for(L=0,E=N.split(";"),P=E[Q];L<P;L++){R=E[L][F](K),R+1&&(H=J+unescape(E[L][U](R+K[Q])))}}G+=O+"_t="+(new Date)+O+"c="+(I.characterSet||I.defaultCharset||"")+"&c8="+T(I.title)+H+"&c7="+T(I.URL)+"&c9="+T(I.referrer),G[Q]>M&&G[F](J)>0&&(S=G[U](0,M-8).lastIndexOf(J),G=(G[U](0,S)+O+"cut="+T(G[U](S+1)))[U](0,M)),m(G),typeof ns_p===e&&(ns_p={src:G}),ns_p.lastMeasurement=G};if(typeof i!==e){var A=[],z=window.encodeURIComponent||escape;for(var y in i){i.hasOwnProperty(y)&&A.push(z(y)+"="+z(i[y]))}c+="&"+A.join("&")}return B(c)}function b(P,D){var I,F=2048,L=document,E=window,H=E.encodeURIComponent||escape,C=[],O=q.LABELS_ORDER,K=P.split("?"),R=K[0],M=K[1],G=M.split("&");for(var Q=0,B=G.length;Q<B;Q++){var J=G[Q].split("="),N=unescape(J[0]),z=unescape(J[1]);D[N]=z}var S={};for(var Q=0,B=O.length;Q<B;Q++){var A=O[Q];D.hasOwnProperty(A)&&(S[A]=!0,C.push(H(A)+"="+H(D[A])))}for(var A in D){if(S[A]){continue}D.hasOwnProperty(A)&&C.push(H(A)+"="+H(D[A]))}return I=R+"?"+C.join("&"),I=I+(I.indexOf("&c8=")<0?"&c8="+H(L.title):"")+(I.indexOf("&c7=")<0?"&c7="+H(L.URL):"")+(I.indexOf("&c9=")<0?"&c9="+H(L.referrer):""),I.length>F&&I.indexOf("&")>0&&(last=I.substr(0,F-8).lastIndexOf("&"),I=(I.substring(0,last)+"&ns_cut="+H(I.substring(last+1))).substr(0,F)),I}var j=function(){var c={uid:function(){var f=1;return function(){return +(new Date)+"_"+f++}}(),filter:function(l,f){var o={};for(var i in f){f.hasOwnProperty(i)&&l(f[i])&&(o[i]=f[i])}return o},extend:function(s){var l=arguments.length,u;s=s||{};for(var o=1;o<l;o++){u=arguments[o];if(!u){continue}for(var f in u){u.hasOwnProperty(f)&&(s[f]=u[f])}}return s},getLong:function(i,f){var l=Number(i);return i==null||isNaN(l)?f||0:l},getInteger:function(i,f){var l=Number(i);return i==null||isNaN(l)?f||0:l},getBoolean:function(i,f){var l=String(i).toLowerCase()=="true";return i==null?f||!1:l},isNotEmpty:function(f){return f!=null&&f.length>0},regionMatches:function(z,l,B,y,f){if(l<0||y<0||l+f>z.length||y+f>B.length){return !1}while(--f>=0){var u=z.charAt(l++),A=B.charAt(y++);if(u!=A){return !1}}return !0}};return c.filterMap=function(i,f){for(var l in i){f.indexOf(l)==-1&&delete i[l]}},c}(),x=function(){var c=["play","pause","end","buffer","keep-alive","hb","custom","ad_play","ad_pause","ad_end","ad_click"];return{PLAY:0,PAUSE:1,END:2,BUFFER:3,KEEP_ALIVE:4,HEART_BEAT:5,CUSTOM:6,AD_PLAY:7,AD_PAUSE:8,AD_END:9,AD_CLICK:10,toString:function(e){return c[e]}}}(),d=function(){var c=[x.END,x.PLAY,x.PAUSE,x.BUFFER];return{IDLE:0,PLAYING:1,PAUSED:2,BUFFERING:3,toEventType:function(e){return c[e]}}}(),v={ADPLAY:x.AD_PLAY,ADPAUSE:x.AD_PAUSE,ADEND:x.AD_END,ADCLICK:x.AD_CLICK},q={STREAMSENSE_VERSION:"4.1309.13",STREAMSENSEMEDIAPLAYER_VERSION:"4.1309.13",STREAMSENSEVIDEOVIEW_VERSION:"4.1309.13",DEFAULT_HEARTBEAT_INTERVAL:[{playingtime:60000,interval:10000},{playingtime:null,interval:60000}],KEEP_ALIVE_PERIOD:1200000,PAUSED_ON_BUFFERING_PERIOD:500,PAUSE_PLAY_SWITCH_DELAY:500,DEFAULT_PLAYERNAME:"streamsense",C1_VALUE:"19",C10_VALUE:"js",NS_AP_C12M_VALUE:"1",NS_NC_VALUE:"1",PAGE_NAME_LABEL:"name",LABELS_ORDER:["c1","c2","ns_site","ns_vsite","ns_ap_an","ns_ap_pn","ns_ap_pv","c12","name","ns_ak","ns_ap_ec","ns_ap_ev","ns_ap_device","ns_ap_id","ns_ap_csf","ns_ap_bi","ns_ap_pfm","ns_ap_pfv","ns_ap_ver","ns_ap_sv","ns_type","ns_radio","ns_nc","ns_ap_ui","ns_ap_gs","ns_st_sv","ns_st_pv","ns_st_it","ns_st_id","ns_st_ec","ns_st_sp","ns_st_sq","ns_st_cn","ns_st_ev","ns_st_po","ns_st_cl","ns_st_el","ns_st_pb","ns_st_hc","ns_st_mp","ns_st_mv","ns_st_pn","ns_st_tp","ns_st_pt","ns_st_pa","ns_st_ad","ns_st_li","ns_st_ci","ns_ap_jb","ns_ap_res","ns_ap_c12m","ns_ap_install","ns_ap_updated","ns_ap_lastrun","ns_ap_cs","ns_ap_runs","ns_ap_usage","ns_ap_fg","ns_ap_ft","ns_ap_dft","ns_ap_bt","ns_ap_dbt","ns_ap_dit","ns_ap_as","ns_ap_das","ns_ap_it","ns_ap_uc","ns_ap_aus","ns_ap_daus","ns_ap_us","ns_ap_dus","ns_ap_ut","ns_ap_oc","ns_ap_uxc","ns_ap_uxs","ns_ap_lang","ns_ap_miss","ns_ts","ns_st_ca","ns_st_cp","ns_st_er","ns_st_pe","ns_st_ui","ns_st_bc","ns_st_bt","ns_st_bp","ns_st_pc","ns_st_pp","ns_st_br","ns_st_ub","ns_st_vo","ns_st_ws","ns_st_pl","ns_st_pr","ns_st_ep","ns_st_ty","ns_st_cs","ns_st_ge","ns_st_st","ns_st_dt","ns_st_ct","ns_st_de","ns_st_pu","ns_st_cu","ns_st_fee","c7","c8","c9"]},k=function(){var c=function(){function y(l,f){var r=f[l];r!=null&&(B[l]=r)}var A=this,E=0,o=0,i=0,D=0,C=0,z=0,s,B;j.extend(this,{reset:function(e){e!=null&&e.length>0?j.filterMap(B,e):B={},B.ns_st_cl="0",B.ns_st_pn="1",B.ns_st_tp="1",A.setClipId("1"),A.setPauses(0),A.setStarts(0),A.setBufferingTime(0),A.setBufferingTimestamp(-1),A.setPlaybackTime(0),A.setPlaybackTimestamp(-1)},setLabels:function(e,f){e!=null&&j.extend(B,e),A.setRegisters(B,f)},getLabels:function(){return B},setLabel:function(e,l){var f={};f[e]=l,A.setLabels(f,null)},getLabel:function(f){return B[f]},getClipId:function(){return s},setClipId:function(f){s=f},setRegisters:function(n,f){var l=n.ns_st_cn;l!=null&&(s=l,delete n.ns_st_cn),l=n.ns_st_bt,l!=null&&(i=Number(l),delete n.ns_st_bt),y("ns_st_cl",n),y("ns_st_pn",n),y("ns_st_tp",n),y("ns_st_ub",n),y("ns_st_br",n);if(f==d.PLAYING||f==null){l=n.ns_st_sq,l!=null&&(o=Number(l),delete n.ns_st_sq)}f!=d.BUFFERING&&(l=n.ns_st_pt,l!=null&&(C=Number(l),delete n.ns_st_pt));if(f==d.PAUSED||f==d.IDLE||f==null){l=n.ns_st_pc,l!=null&&(E=Number(l),delete n.ns_st_pc)}},createLabels:function(f,l){var e=l||{};e.ns_st_cn=A.getClipId(),e.ns_st_bt=String(A.getBufferingTime());if(f==x.PLAY||f==null){e.ns_st_sq=String(o)}if(f==x.PAUSE||f==x.END||f==x.KEEP_ALIVE||f==x.HEART_BEAT||f==null){e.ns_st_pt=String(A.getPlaybackTime()),e.ns_st_pc=String(E)}return j.extend(e,A.getLabels()),e},incrementPauses:function(){E++},incrementStarts:function(){o++},getBufferingTime:function(){var f=i;return D>=0&&(f+=+(new Date)-D),f},setBufferingTime:function(f){i=f},getPlaybackTime:function(){var f=C;return z>=0&&(f+=+(new Date)-z),f},setPlaybackTime:function(f){C=f},getPlaybackTimestamp:function(){return z},setPlaybackTimestamp:function(f){z=f},getBufferingTimestamp:function(){return D},setBufferingTimestamp:function(f){D=f},getPauses:function(){return E},setPauses:function(f){E=f},getStarts:function(){return o},setStarts:function(f){o=f}}),B={},A.reset()};return c}(),h=function(){var c=function(){var z=this,E=null,o,f=0,D=0,C=0,s=0,B=0,y,i=0,A=!1;j.extend(this,{reset:function(e){e!=null&&e.length>0?j.filterMap(y,e):y={},z.setPlaylistId(+(new Date)+"_"+i),z.setBufferingTime(0),z.setPlaybackTime(0),z.setPauses(0),z.setStarts(0),z.setRebufferCount(0),A=!1},setLabels:function(e,l){e!=null&&j.extend(y,e),z.setRegisters(y,l)},getLabels:function(){return y},setLabel:function(e,u){var l={};l[e]=u,z.setLabels(l,null)},getLabel:function(l){return y[l]},getClip:function(){return E},getPlaylistId:function(){return o},setPlaylistId:function(l){o=l},setRegisters:function(r,n){var l=r.ns_st_sp;l!=null&&(f=Number(l),delete r.ns_st_sp),l=r.ns_st_bc,l!=null&&(C=Number(l),delete r.ns_st_bc),l=r.ns_st_bp,l!=null&&(s=Number(l),delete r.ns_st_bp),l=r.ns_st_id,l!=null&&(o=l,delete r.ns_st_id),n!=d.BUFFERING&&(l=r.ns_st_pa,l!=null&&(B=Number(l),delete r.ns_st_pa));if(n==d.PAUSED||n==d.IDLE||n==null){l=r.ns_st_pp,l!=null&&(D=Number(l),delete r.ns_st_pp)}},createLabels:function(e,n){var l=n||{};l.ns_st_bp=String(z.getBufferingTime()),l.ns_st_sp=String(f),l.ns_st_id=String(o),C>0&&(l.ns_st_bc=String(C));if(e==x.PAUSE||e==x.END||e==x.KEEP_ALIVE||e==x.HEART_BEAT||e==null){l.ns_st_pa=String(z.getPlaybackTime()),l.ns_st_pp=String(D)}if(e==x.PLAY||e==null){z.didFirstPlayOccurred()||(l.ns_st_pb="1",z.setFirstPlayOccurred(!0))}return j.extend(l,z.getLabels()),l},incrementStarts:function(){f++},incrementPauses:function(){D++,E.incrementPauses()},setPlaylistCounter:function(l){i=l},incrementPlaylistCounter:function(){i++},addPlaybackTime:function(l){if(E.getPlaybackTimestamp()>=0){var e=l-E.getPlaybackTimestamp();E.setPlaybackTimestamp(-1),E.setPlaybackTime(E.getPlaybackTime()+e),z.setPlaybackTime(z.getPlaybackTime()+e)}},addBufferingTime:function(l){if(E.getBufferingTimestamp()>=0){var e=l-E.getBufferingTimestamp();E.setBufferingTimestamp(-1),E.setBufferingTime(E.getBufferingTime()+e),z.setBufferingTime(z.getBufferingTime()+e)}},getBufferingTime:function(){var l=s;return E.getBufferingTimestamp()>=0&&(l+=+(new Date)-E.getBufferingTimestamp()),l},setBufferingTime:function(l){s=l},getPlaybackTime:function(){var l=B;return E.getPlaybackTimestamp()>=0&&(l+=+(new Date)-E.getPlaybackTimestamp()),l},setPlaybackTime:function(l){B=l},getStarts:function(){return f},setStarts:function(l){f=l},getPauses:function(){return D},setPauses:function(l){D=l},getRebufferCount:function(){return C},incrementRebufferCount:function(){C++},setRebufferCount:function(l){C=l},didFirstPlayOccurred:function(){return A},setFirstPlayOccurred:function(l){A=l}}),E=new k,y={},z.reset()};return c}(),p=function(){var c=function(aO,aN){function ay(f){ah=f}function aW(z){var u=0;if(ah!=null){for(var A=0;A<ah.length;A++){var y=ah[A],f=y.playingtime;if(!f||z<f){u=y.interval;break}}}return u}function ar(){r();var u=aW(aY.getClip().getPlaybackTime());if(u>0){var f=ax>0?ax:u;s=setTimeout(ac,f)}ax=0}function an(){r();var f=aW(aY.getClip().getPlaybackTime());ax=f-aY.getClip().getPlaybackTime()%f,s!=null&&r()}function aP(){ax=0,aj=0,aU=0}function ac(){aU++;var f=aA(x.HEART_BEAT,null);aR(f),ax=0,ar()}function r(){s!=null&&(clearTimeout(s),s=null)}function aI(){l(),aa=setTimeout(n,q.KEEP_ALIVE_PERIOD)}function n(){var f=aA(x.KEEP_ALIVE,null);aR(f),aT++,aI()}function l(){aa!=null&&(clearTimeout(aa),aa=null)}function o(){al(),aZ.isPauseOnBufferingEnabled()&&ap(d.PAUSED)&&(aL=setTimeout(aH,q.PAUSED_ON_BUFFERING_PERIOD))}function aH(){if(ag==d.PLAYING){aY.incrementRebufferCount(),aY.incrementPauses();var f=aA(x.PAUSE,null);aR(f),aT++,ag=d.PAUSED}}function al(){aL!=null&&(clearTimeout(aL),aL=null)}function ak(){aK!=null&&(clearTimeout(aK),aK=null)}function ae(f){return f==d.PLAYING||f==d.PAUSED}function aq(f){return f==x.PLAY?d.PLAYING:f==x.PAUSE?d.PAUSED:f==x.BUFFER?d.BUFFERING:f==x.END?d.IDLE:null}function i(C,G,z){ak();if(ab(C)){if(z){setTimeout(function(){i(C,G)},z)}else{var y=aD(),H=aQ,F=aG(G),E=H>=0?F-H:0;aF(aD(),G),aC(C,G),aB(C);for(var B=0,A=af.length;B<A;B++){af[B](y,C,G,E)}e(G),aY.setRegisters(G,C),aY.getClip().setRegisters(G,C);var D=aA(d.toEventType(C),G);j.extend(D,G),ap(aM)&&(aR(D),ag=aM,aT++)}}}function e(u){var f=u.ns_st_mp;f!=null&&(ai=f,delete u.ns_st_mp),f=u.ns_st_mv,f!=null&&(a4=f,delete u.ns_st_mv),f=u.ns_st_ec,f!=null&&(aT=Number(f),delete u.ns_st_ec)}function aR(z,C){C===undefined&&(C=!0),C&&aV(z);var y=aZ.getPixelURL();if(aJ){if(!a0()){var A=ao.am,B=ao.et,f=A.newApplicationMeasurement(aJ,B.HIDDEN,z,y);aJ.getQueue().offer(f)}}else{y&&m(b(y,z))}}function a0(){var u=aJ.getAppContext(),f=aJ.getSalt(),y=aJ.getPixelURL();return u==null||f==null||f.length==0||y==null||y.length==0}function aV(f){aw=aA(null),j.extend(aw,f)}function aF(u,f){var y=aG(f);u==d.PLAYING?(aY.addPlaybackTime(y),an(),l()):u==d.BUFFERING&&(aY.addBufferingTime(y),al())}function aC(y,f){var z=aG(f),u=aE(f);a1=u,y==d.PLAYING?(ar(),aI(),aY.getClip().setPlaybackTimestamp(z),ap(y)&&(aY.getClip().incrementStarts(),aY.getStarts()<1&&aY.setStarts(1))):y==d.PAUSED?ap(y)&&aY.incrementPauses():y==d.BUFFERING?(aY.getClip().setBufferingTimestamp(z),au&&o()):y==d.IDLE&&aP()}function ap(f){return f!=d.PAUSED||ag!=d.IDLE&&ag!=null?f!=d.BUFFERING&&ag!=f:!1}function aE(u){var f=-1;return u.hasOwnProperty("ns_st_po")&&(f=Number(u.ns_st_po)),f}function aG(u){var f=-1;return u.hasOwnProperty("ns_ts")&&(f=Number(u.ns_ts)),f}function ab(f){return f!=null&&aD()!=f}function aB(f){aM=f,aQ=+(new Date)}function aD(){return aM}function aA(){var u,f;arguments.length==1?(u=d.toEventType(aM),f=arguments[0]):(u=arguments[0],f=arguments[1]);var y={};return f!=null&&j.extend(y,f),y.hasOwnProperty("ns_ts")||(y.ns_ts=String(+(new Date))),u!=null&&!y.hasOwnProperty("ns_st_ev")&&(y.ns_st_ev=x.toString(u)),aZ.isPersistentLabelsShared()&&aJ&&j.extend(y,aJ.getLabels()),j.extend(y,aZ.getLabels()),aS(u,y),aY.createLabels(u,y),aY.getClip().createLabels(u,y),y.hasOwnProperty("ns_st_mp")||(y.ns_st_mp=ai),y.hasOwnProperty("ns_st_mv")||(y.ns_st_mv=a4),y.hasOwnProperty("ns_st_ub")||(y.ns_st_ub="0"),y.hasOwnProperty("ns_st_br")||(y.ns_st_br="0"),y.hasOwnProperty("ns_st_pn")||(y.ns_st_pn="1"),y.hasOwnProperty("ns_st_tp")||(y.ns_st_tp="1"),y.hasOwnProperty("ns_st_it")||(y.ns_st_it="c"),y.ns_st_sv=q.STREAMSENSE_VERSION,y.ns_type="hidden",y}function aS(z,u){var A=u||{};A.ns_st_ec=String(aT);if(!A.hasOwnProperty("ns_st_po")){var y=a1,f=aG(A);if(z==x.PLAY||z==x.KEEP_ALIVE||z==x.HEART_BEAT||z==null&&aM==d.PLAYING){y+=f-aY.getClip().getPlaybackTimestamp()}A.ns_st_po=String(y)}return z==x.HEART_BEAT&&(A.ns_st_hc=String(aU)),A}function am(u){var f=aG(u);f<0&&(u.ns_ts=String(+(new Date)))}function ad(u,f,y){f=f||{},f.ns_st_ad=1,u>=x.AD_PLAY&&u<=x.AD_CLICK&&aZ.notify(u,f,y)}function av(u,f){aZ.notify(x.CUSTOM,u,f)}var aZ=this,a2,aX=null,aQ=0,a1=0,aM,aT=0,aY=null,aJ,a3=!0,aL,au=!0,aa,aK,s,ah=q.DEFAULT_HEARTBEAT_INTERVAL,ax=0,aU=0,aj=0,az=!1,ag,ai,a4,aw,af,ao={};j.extend(this,{reset:function(f){aY.reset(f),aY.setPlaylistCounter(0),aY.setPlaylistId(+(new Date)+"_1"),aY.getClip().reset(f),f!=null&&!f.isEmpty()?j.filterMap(a2,f):a2={},aT=1,aU=0,an(),aP(),l(),al(),ak(),aM=d.IDLE,aQ=-1,ag=null,ai=q.DEFAULT_PLAYERNAME,a4=q.STREAMSENSE_VERSION,aw=null},notify:function(){var A,y,C,z;y=arguments[0],arguments.length==3?(C=arguments[1],z=arguments[2]):(C={},z=arguments[1]),A=aq(y);var B=j.extend({},C);am(B),B.hasOwnProperty("ns_st_po")||(B.ns_st_po=String(z));if(y==x.PLAY||y==x.PAUSE||y==x.BUFFER||y==x.END){aZ.isPausePlaySwitchDelayEnabled()&&ab(A)&&ae(aM)&&ae(A)?i(A,B,q.PAUSE_PLAY_SWITCH_DELAY):i(A,B)}else{var f=aA(y,B);j.extend(f,B),aR(f,!1),aT++}},getLabels:function(){return a2},setLabels:function(f){f!=null&&(a2==null?a2=f:j.extend(a2,f))},getLabel:function(f){return a2[f]},setLabel:function(u,f){f==null?delete a2[u]:a2[u]=f},setPixelURL:function(A){if(A==null||A.length==0){return null}var u=A.indexOf("?");if(u>=0){if(u<A.length-1){var C=A.substring(u+1).split("&");for(var z=0,f=C.length;z<f;z++){var y=C[z],B=y.split("=");B.length==2?aZ.setLabel(B[0],B[1]):B.length==1&&aZ.setLabel(q.PAGE_NAME_LABEL,B[0])}A=A.substring(0,u+1)}}else{A+="?"}return aX=A,aX},getPixelURL:function(){return aX?aX:typeof ns_p!="undefined"&&typeof ns_p.src=="string"?aX=ns_p.src.replace(/&amp;/,"&").replace(/&ns__t=\d+/,""):typeof ns_pixelUrl=="string"?aX.replace(/&amp;/,"&").replace(/&ns__t=\d+/,""):null},isPersistentLabelsShared:function(){return a3},setPersistentLabelsShared:function(f){a3=f},isPauseOnBufferingEnabled:function(){return au},setPauseOnBufferingEnabled:function(f){au=f},isPausePlaySwitchDelayEnabled:function(){return az},setPausePlaySwitchDelayEnabled:function(f){az=f},setClip:function(u,f){aM==d.IDLE&&(aY.getClip().reset(),aY.getClip().setLabels(u,null),f&&aY.incrementStarts())},setPlaylist:function(f){aM==d.IDLE&&(aY.incrementPlaylistCounter(),aY.reset(),aY.getClip().reset(),aY.setLabels(f,null))},importState:function(u){reset();var f=j.extend({},u);aY.setRegisters(f,null),aY.getClip().setRegisters(f,null),e(f),aT++},exportState:function(){return aw},getVersion:function(){return q.STREAMSENSE_VERSION},addListener:function(f){af.push(f)},removeListener:function(f){af.splice(af.indexOf(f),1)},getClip:function(){return aY.getClip()},getPlaylist:function(){return aY}}),j.extend(this,{adNotify:ad,customNotify:av,viewNotify:function(u,f){u=u||aZ.getPixelURL(),u&&g(u,f)}}),ns_.comScore&&(ao=ns_.comScore.exports,aJ=ao.c()),a2={},aT=1,aM=d.IDLE,aY=new h,aL=null,au=!0,s=null,aU=0,aP(),aa=null,aK=null,az=!1,ag=null,a1=0,af=[],aZ.reset(),aO&&aZ.setLabels(aO),aN&&aZ.setPixelURL(aN)};return function(U){function I(f,l){return G[J]||F(f,l)}function L(){J=-1;for(var f=0;f<=M;f++){if(G.hasOwnProperty(f)){J=f;break}}return ns_.StreamSense.activeIndex=J,J}function F(l,f){return l=l||null,f=f||null,l&&typeof l=="object"&&(f=l,l=null),G[++M]=new ns_.StreamSense(f,l),L(),G[M]}function Y(){var l=!1,o=J;if(typeof arguments[0]=="number"&&isFinite(arguments[0])){o=arguments[0]}else{if(arguments[0] instanceof ns_.StreamSense){for(var f in G){if(G[f]===arguments[0]){o=f;break}}}}return G.hasOwnProperty(o)&&(l=G[o],delete G[o],l.reset(),L()),l}function R(f){return f=f||{},I().setPlaylist(f),I().getPlaylist()}function O(l,f,o){return l=l||{},typeof f=="number"&&(l.ns_st_cn=f),I().setClip(l,o),I().getClip()}function W(l,f,o){return typeof l=="undefined"?!1:(o=o||null,f=f||{},I().notify(l,f,o))}function P(f){typeof f!="undefined"&&I().setLabels(f)}function K(){return I().getLabels()}function V(f){typeof f!="undefined"&&I().getPlaylist().setLabels(f)}function D(){return I().getPlaylist().getLabels()}function N(f){typeof f!="undefined"&&I().getClip().setLabels(f)}function Q(){return I().getClip().getLabels()}function A(f){return I().reset(f||{})}function X(f){return I().getPlaylist().reset(f||{})}function C(f){return I().getClip().reset(f||{})}function H(f){return f=f||{},I().viewNotify(null,f)}function z(l,f){return arguments.length>2&&(l=arguments[1],f=arguments[2]),l=l||{},typeof f=="number"&&(l.ns_st_po=f),I().customNotify(l,f)}function B(){return I().exportState()}function i(f){I().importState(f)}var G={},M=-1,J=-1;j.extend(U,{activeIndex:J,newInstance:F,"new":F,destroyInstance:Y,destroy:Y,newPlaylist:R,newClip:O,notify:W,setLabels:P,getLabels:K,setPlaylistLabels:V,getPlaylistLabels:D,setClipLabels:N,getClipLabels:Q,resetInstance:A,resetPlaylist:X,resetClip:C,viewEvent:H,customEvent:z,exportState:B,importState:i})}(c),c}();return p.AdEvents=v,p.PlayerEvents=x,p}();function CMGcomScore(c,b){var d={experience_id:c,player:null,ss:null,mod_vp:null,mod_exp:null,mod_con:null,mod_ad:null,current_media:null,current_ad:null,ad_start_time:null,ss_is_clip_initialized:false,ss_clip_end_reached:false,ss_is_clip_playing:false,ss_clip_position:0,ss_clip:null,bc_content_id:b,clips_played:[],on_template_loaded:function(e){d.player=brightcove.api.getExperience(e);d.mod_vp=d.player.getModule(brightcove.api.modules.APIModules.VIDEO_PLAYER);d.mod_exp=d.player.getModule(brightcove.api.modules.APIModules.EXPERIENCE);d.mod_con=d.player.getModule(brightcove.api.modules.APIModules.CONTENT);d.mod_ad=d.player.getModule(brightcove.api.modules.APIModules.ADVERTISING)},on_template_ready:function(e){d.mod_vp.addEventListener(brightcove.api.events.MediaEvent.ERROR,d.onMediaEventFired);d.mod_vp.addEventListener(brightcove.api.events.MediaEvent.PLAY,d.event_play);d.mod_vp.addEventListener(brightcove.api.events.MediaEvent.PROGRESS,d.event_progress);d.mod_vp.addEventListener(brightcove.api.events.MediaEvent.STOP,d.event_stop);d.mod_vp.addEventListener(brightcove.api.events.MediaEvent.CHANGE,d.event_change);if(d.player.type==brightcove.playerType.HTML){d.mod_vp.addEventListener(brightcove.api.events.MediaEvent.SEEK_NOTIFY,d.event_seek_notify)}d.mod_ad.addEventListener(brightcove.api.events.AdEvent.START,d.event_ad_start);d.mod_ad.addEventListener(brightcove.api.events.AdEvent.COMPLETE,d.event_ad_complete);d.ss_init()},ss_init:function(){d.ss=new ns_.StreamSense({},"http://b.scorecardresearch.com/p?c1=2&c2=6035944");d.ss_reset_playlist()},ss_reset_playlist:function(){d.ss.setPlaylist();d.clips_played=[]},bc_media_event:function(e){d.current_ad=null;d.current_media=e.media},ss_notify:function(f,e){d.ss_current_clip();if(e!=null){d.ss.notify(f,{},e);d.ss_clip_position=e}else{d.mod_vp.getVideoPosition(false,function(g){var h=parseInt(1000*g);d.ss.notify(f,{},h);d.ss_clip_position=h})}},track_current_video_played:function(e){var g=e.media.id.toString();for(var f=0;f<d.clips_played.length;f++){if(d.clips_played[f]==g){return}}d.clips_played.push(g)},current_clip_num:function(){if(d.current_media!=null){var f=d.current_media.id.toString();for(var e=0;e<d.clips_played.length;e++){if(d.clips_played[e]==f){return e+1}}}return d.clips_played.length},event_play:function(e){d.track_current_video_played(e);var f=d.current_ad!=null&&d.ss_is_clip_initialized;d.bc_media_event(e);if(f){var g=(new Date).getTime()-d.ad_start_time;d.ss_notify(ns_.StreamSense.PlayerEvents.END,g);d.ss_is_clip_initialized=false;d.ss_notify(ns_.StreamSense.PlayerEvents.PLAY,0)}else{d.ss_notify(ns_.StreamSense.PlayerEvents.PLAY)}d.ss_is_clip_playing=true},event_stop:function(e){if(!d.ss_is_clip_playing){return}d.bc_media_event(e);d.ss_notify(ns_.StreamSense.PlayerEvents.PAUSE);d.ss_is_clip_playing=false},event_complete:function(e){d.bc_media_event(e);d.ss_notify(ns_.StreamSense.PlayerEvents.END);d.ss_is_clip_initialized=false},event_seek_notify:function(e){if(d.ss_is_clip_playing){d.bc_media_event(e);d.ss_notify(ns_.StreamSense.PlayerEvents.PAUSE,d.ss_clip_position);d.ss_notify(ns_.StreamSense.PlayerEvents.PLAY)}},bc_ad_event:function(e){d.current_ad=e;d.current_media=null},event_ad_start:function(e){d.ss_reset_playlist();d.clips_played.push("ad clip");d.ss_clip_end_reached=false;d.bc_ad_event(e);d.ss_notify(ns_.StreamSense.PlayerEvents.PLAY);d.ad_start_time=(new Date).getTime()},event_ad_complete:function(e){if(d.current_media!=null){return}d.bc_ad_event(e);var f=(new Date).getTime()-d.ad_start_time;d.ss_notify(ns_.StreamSense.PlayerEvents.END,f);d.ss_is_clip_initialized=false},event_progress:function(e){d.ss_clip_position=parseInt(e.position*1000);if(d.ss_clip.ns_st_cl-d.ss_clip_position<1000&&!d.ss_clip_end_reached){d.ss_notify(ns_.StreamSense.PlayerEvents.END);d.ss_is_clip_initialized=false;d.ss_is_clip_playing=false;d.ss_clip_end_reached=true}},event_change:function(e){if(d.ss_is_clip_initialized){if(d.current_ad!=null){d.bc_ad_event(e);var f=(new Date).getTime()-d.ad_start_time;d.ss_notify(ns_.StreamSense.PlayerEvents.END,f)}else{if(d.current_media!=null){d.bc_media_event(e);d.ss_notify(ns_.StreamSense.PlayerEvents.END)}}d.ss_is_clip_initialized=false;d.ss_clip_end_reached=true;d.ss_is_clip_playing=false}},site_name:function(g){var f;if("undefined"===typeof g){f=window.document.location.href}else{f=g}var e=document.createElement("a");e.href=f;var i=e.hostname.split(".");var j=i.length;if(j>2){i=[i[j-2],i[j-1]]}return i.join(".").toLowerCase()},ss_default_clip:function(){return{ns_st_cn:d.current_clip_num(),ns_st_ci:d.bc_content_id,ns_st_pn:1,ns_st_tp:0,ns_st_cl:0,ns_st_pu:d.site_name(),ns_st_pr:"",ns_st_ep:"",ns_st_cu:"none",ns_st_ad:0,ns_st_ct:"vc11",ns_st_de:d.site_name(),c3:"cmg",c4:d.c4_value(),c6:d.site_name()}},ss_current_clip:function(){if(d.ss_is_clip_initialized){return}d.ss_clip=d.ss_default_clip();if(d.current_media!=null){d.ss_clip.ns_st_ci=d.current_media.id.toString();d.ss_clip.ns_st_ad=0;d.ss_clip.ns_st_cl=d.current_media.length;d.ss_clip.ns_st_ct="vc11"}else{if(d.current_ad!=null){d.ss_clip.ns_st_ad=1;d.ss_clip.ns_st_ct="va11"}}d.ss.setClip(d.ss_clip);d.ss_is_clip_initialized=true;d.ss_clip_end_reached=false},c4_value:function(){if(typeof cmg==="undefined"||typeof cmg.site_meta==="undefined"){return"unknown"}return cmg.site_meta.media_type}};this.o=d}(function(b,g){if(!g){return console.log("janus-auth.js requires jQuery to be defined first.")}var e=b.authorization||(b.authorization={}),c={},d={},f="janus.authorization";e.check=function(p,q){var o=b.query.cookie(f);if(o){var l=/^"\w+:\w+:[\w-]+"$/;if(l.test(o)){q({authorized:true});return}console.log("Invalid cookie. Deleting "+o);var n=location.hostname.split(".").slice(-2).join(".");b.query.removeCookie(f,{path:"/"});b.query.removeCookie(f,{path:"/",domain:n})}var r,h,k,m=true,j=p;r=c[j]||(c[j]=g.ajax({url:p,type:"get",dataType:"jsonp"}));h=d[p]||(d[p]=[]);if(typeof h.indexOf==="function"&&h.indexOf(q)>-1){m=false}else{for(k=0;k<h.length;k++){if(h[k]===q){m=false;break}}}if(m){h.push(q)}r.done(q);r.error(q)};e.refresh=function(){var j,m,n,k=0,h;c={};for(j in d){m=d[j];k=0;for(h=m.length;k<h;k++){n=m[k];e.check(j,n)}}};e.auth_type=function(){var h=b.query.cookie("janus.authorization")||"";return h.replace(/^\s*"|"\s*$|backend|:[\s\S]*/gi,"").toLowerCase()};if(window.janrain&&typeof window.janrain.on==="function"){window.janrain.on("cmg_login_complete",e.refresh)}else{g(function(){if(window.janrain&&typeof window.janrain.on==="function"){window.janrain.on("cmg_login_complete",e.refresh)}})}})((window.cmg||(window.cmg={})),cmg.query||window.jQuery);(function(b){b.fn.cmgImageSlider=function(y){var z=this;var q=z.find(".cmImageSliderList").children().length;if(q==1){return}var n=q;var o=true;var v=true;var x=0;var m="";var h;var f=b(".cmImageSliderControls",z);var k=b("ul.cmImageSliderList",z);var w={slider_speed:6000};var d=b.extend(w,y);var e=function(){h=setTimeout(function(){l();e()},d.slider_speed)};e();b("ul.cmImageSliderList li:first",z).before(b("ul.cmImageSliderList li:last",z));var p=function(){x=b("ul.cmImageSliderControls li a span.cmImageSliderIndicatorActive",z).data("set");return x};for(var t=0;t<n;t++){var u='<li class="cmImageSliderIndicator"><a class="cmImageSliderListIndicator cmSet'+t+'"><span class="icon-circle cmImageSliderIndicatorInactive" data-set="'+t+'"></span></a></li>';m+=u}f.html(m);f.find("li a.cmSet0 span").toggleClass("icon-circle-blank icon-circle").toggleClass("cmImageSliderIndicatorInactive cmImageSliderIndicatorActive");f.show();var g=function(C,B,i,A){if(B=="forward"&&q===2){b("ul.cmImageSliderList li:last",z).after(b("ul.cmImageSliderList li:first",z).clone(true));k.animate({left:i},A,function(){b("ul.cmImageSliderList li:first",z).remove();b("ul.cmImageSliderList",z).css({left:"-615px"});o=true})}else{if(B=="forward"){k.animate({left:i},A,function(){b("ul.cmImageSliderList li:last",z).after(b("ul.cmImageSliderList li:first",z));b("ul.cmImageSliderList",z).css({left:"-615px"});o=true})}else{if(B=="backwards"){k.animate({left:i},A,function(){b("ul.cmImageSliderList li:first",z).before(b("ul.cmImageSliderList li:last",z));b("ul.cmImageSliderList",z).css({left:"-615px"});o=true})}}}};b("ul.cmImageSliderControls li a.cmImageSliderListIndicator",z).click(function(){var A=b(this).find("span").data("set");var E=f.find("li a span.cmImageSliderIndicatorActive").data("set");var D=Math.abs(A-E);var F=500/D;if(A>E){var B=parseInt(b("ul.cmImageSliderList",z).css("left"))-615;for(var C=0;C<D;C++){g((E+C),"forward",B,F)}}else{if(A<E){var B=parseInt(b("ul.cmImageSliderList",z).css("left"))+615;for(var C=0;C<D;C++){g((E-C),"backwards",B,F)}}}f.find("li a span.cmImageSliderIndicatorActive").toggleClass("cmImageSliderIndicatorActive cmImageSliderIndicatorInactive").toggleClass("icon-circle icon-circle-blank");b(this).find("span").toggleClass("cmImageSliderIndicatorInactive cmImageSliderIndicatorActive").toggleClass("icon-circle-blank icon-circle");s()});z.find(".cmImageSliderPrevArrow").click(function c(){var B;if(!o){return}o=false;x=p();z.find("ul.cmImageSliderControls li a.cmSet"+x+" span").toggleClass("cmImageSliderIndicatorActive cmImageSliderIndicatorInactive").toggleClass("icon-circle icon-circle-blank");if(x===0){B=q-1}else{B=x-1}z.find("ul.cmImageSliderControls li a.cmSet"+(B)+" span").toggleClass("cmImageSliderIndicatorInactive cmImageSliderIndicatorActive").toggleClass("icon-circle-blank icon-circle");var A=parseInt(b("ul.cmImageSliderList").css("left"))+615;var C="backwards";g(x,C,A,500);s()});function l(){var B;if(!o){return}o=false;x=p();z.find("ul.cmImageSliderControls li a.cmSet"+x+" span").toggleClass("cmImageSliderIndicatorActive cmImageSliderIndicatorInactive").toggleClass("icon-circle icon-circle-blank");if(x==q-1){B=0}else{B=x+1}z.find("ul.cmImageSliderControls li a.cmSet"+(B)+" span").toggleClass("cmImageSliderIndicatorInactive cmImageSliderIndicatorActive").toggleClass("icon-circle-blank icon-circle");var A=parseInt(b("ul.cmImageSliderList").css("left"))-615;var C="forward";g(x,C,A,500)}z.find(".cmImageSliderNextArrow").click(function(){s();l()});function s(){if(!v){return}clearTimeout(h);e()}function r(){v=false;clearTimeout(h)}function j(){if(v){return}e()}z.find("ul.cmImageSliderList, .cmImageSliderIndicator, .cmImageSliderPrevArrow, .cmImageSliderNextArrow").mouseenter(r).mouseleave(j)}}(cmg.query));cmg.henka=(function henka(){var b={options:{client_timeout:"100"},default_match_provider:"view-port"};henka.props={switches:[],last_width:0};henka.tools={is_mobile_device:function(){var f=0,g=["iPad","iPhone","iPod","Android","webOS","BlackBerry","Windows Phone"];for(;f<g.length;f++){if(navigator.platform===g[f]){return true}}return false}};henka.core={match_manager:{match:function(f){var g=henka.providers[b.default_match_provider].provideMatch({query:f.query});return g}},update_manager:{update:{one:function(f){henka.core.update_manager.update.all({current_pos:f.switch_index,single:true})},all:function e(h){var g=h||{};var f=g.current_pos||0;if(f==(henka.props.switches.length)){return false}var i=f+1;setTimeout(function(){var j=henka.core.match_manager.match({query:henka.props.switches[f].query});henka.core.update_manager.run({"switch":henka.props.switches[f],matched:j});if(!g.single){e({current_pos:i})}},0)}},run:function d(h){var f=h.matched;var g=h["switch"];var i=function(){var j=g.data;if(typeof(g.data)=="function"){j=g.data(g)}return j};if(g.init){if(!g.init.didRun){g.init(i(g.data));g.init.didRun=true}}if(f){if(g.resize){g.resize(i(g.data))}if(g.on){if(!g.wasMatched){g.wasMatched=true;g.on(i(g.data))}}}if(!f&&g.wasMatched){g.wasMatched=false;if(g.off){g.off(i(g.data))}}}}};henka.providers={"view-port":{provideMatch:function(g){var f=window.innerWidth||document.documentElement.clientWidth;if(g.query.min!=undefined&&g.query.max==undefined){return(f>=g.query.min)}if(g.query.max!=undefined&&g.query.min==undefined){return(f<=g.query.max)}if(g.query.min!=undefined&&g.query.max!=undefined){return(f>=g.query.min&&f<=g.query.max)}return false}}};henka.platform={attach_listener:function(i){var m=new Date("2000-01-01T12:00:00.000Z"),h=false,l=b.options.client_timeout,j=false,k=function(){if(j==false){j=true;setTimeout(function(){henka.core.update_manager.update.all()},0)}},g=function(){if(new Date()-m<l){setTimeout(g,0)}else{h=false;j=false;if(!henka.tools.is_mobile_device()){k()}}},f=function(){var n=window.innerWidth;if(henka.props.last_width!=n){if(henka.tools.is_mobile_device()){k()}m=new Date();if(h===false){h=true;setTimeout(g,l)}}henka.props.last_width=n};if(window.addEventListener){window.addEventListener("resize",f,false)}else{window.attachEvent("onresize",f)}},boot_henka:function(f){henka.props.last_width=window.innerWidth;henka.platform.attach_listener()}};henka.run_result=henka.platform.boot_henka();return function c(h,g){var f=function(j){if(!typeof(j)=="function"){return undefined}return j};if(h){var i=henka.props.switches.push({})-1;c._switch=henka.props.switches[i];c._switch.query=h;c._switch.data=g}c.init=function(j){c._switch.init=f(j);return c};c.on=function(j){c._switch.on=f(j);return c};c.off=function(j){c._switch.off=f(j);return c};c.data=function(j){c._switch.data=j;return c};c.resize=function(j){c._switch.resize=f(j);return c};c.update=function(j){if(j){henka.core.update_manager.update.one({switch_index:i,single:true})}else{henka.props.switches[i]=c._switch.update(j,c._switch)}return c};c.$=henka;return c}}());cmg.query(document).ready(function(){cmg.query(".list-item-timestamp").each(function(){var d=cmg.query(this),c=d.attr("updated_date"),b=d.attr("pub_date");pub_date=c?c:b,content_posted=b?"Posted: ":"",content_updated=c?"Updated: ":"";if(moment().diff(moment(pub_date,"YYYYMDHHmmss"),"months")<1){d.text(content_posted+content_updated+moment(pub_date,"YYYY-M-D-HH-mm-ss").fromNow())}})});window.Modernizr=function(aA,az,ay){function W(b){aq.cssText=b}function V(d,c){return W(am.join(d+";")+(c||""))}function U(d,c){return typeof d===c}function T(d,c){return !!~(""+d).indexOf(c)}function S(e,c){for(var f in e){if(aq[e[f]]!==ay){return c=="pfx"?e[f]:!0}}return !1}function R(g,c,j){for(var i in g){var h=c[g[i]];if(h!==ay){return j===!1?g[i]:U(h,"function")?h.bind(j||c):h}}return !1}function Q(g,f,j){var i=g.charAt(0).toUpperCase()+g.substr(1),h=(g+" "+ak.join(i+" ")+i).split(" ");return U(f,"string")||U(f,"undefined")?S(h,f):(h=(g+" "+aj.join(i+" ")+i).split(" "),R(h,f,j))}function O(){aw.input=function(g){for(var f=0,b=g.length;f<b;f++){af[g[f]]=g[f] in ap}return af.list&&(af.list=!!az.createElement("datalist")&&!!aA.HTMLDataListElement),af}("autocomplete autofocus list placeholder max min multiple pattern required step".split(" ")),aw.inputtypes=function(b){for(var l=0,k,j,g,c=b.length;l<c;l++){ap.setAttribute("type",j=b[l]),k=ap.type!=="text",k&&(ap.value=ao,ap.style.cssText="position:absolute;visibility:hidden;",/^range$/.test(j)&&ap.style.WebkitAppearance!==ay?(au.appendChild(ap),g=az.defaultView,k=g.getComputedStyle&&g.getComputedStyle(ap,null).WebkitAppearance!=="textfield"&&ap.offsetHeight!==0,au.removeChild(ap)):/^(search|tel)$/.test(j)||(/^(url|email)$/.test(j)?k=ap.checkValidity&&ap.checkValidity()===!1:/^color$/.test(j)?(au.appendChild(ap),au.offsetWidth,k=ap.value!=ao,au.removeChild(ap)):k=ap.value!=ao)),ag[b[l]]=!!k}return ag}("search tel url email datetime date month week time datetime-local number range color".split(" "))}var ax="2.5.3",aw={},av=!0,au=az.documentElement,at="modernizr",ar=az.createElement(at),aq=ar.style,ap=az.createElement("input"),ao=":)",an={}.toString,am=" -webkit- -moz- -o- -ms- ".split(" "),al="Webkit Moz O ms",ak=al.split(" "),aj=al.toLowerCase().split(" "),ai={svg:"http://www.w3.org/2000/svg"},ah={},ag={},af={},ae=[],ad=ae.slice,ac,ab=function(t,s,r,q){var p,o,n,h=az.createElement("div"),g=az.body,b=g?g:az.createElement("body");if(parseInt(r,10)){while(r--){n=az.createElement("div"),n.id=q?q[r]:at+(r+1),h.appendChild(n)}}return p=["&#173;","<style>",t,"</style>"].join(""),h.id=at,(g?h:b).innerHTML+=p,b.appendChild(h),g||(b.style.background="",au.appendChild(b)),o=s(h,t),g?h.parentNode.removeChild(h):b.parentNode.removeChild(b),!!o},aa=function(e){var g=aA.matchMedia||aA.msMatchMedia;if(g){return g(e).matches}var f;return ab("@media "+e+" { #"+at+" { position: absolute; } }",function(c){f=(aA.getComputedStyle?getComputedStyle(c,null):c.currentStyle)["position"]=="absolute"}),f},Z=function(){function c(i,h){h=h||az.createElement(b[i]||"div"),i="on"+i;var g=i in h;return g||(h.setAttribute||(h=az.createElement("div")),h.setAttribute&&h.removeAttribute&&(h.setAttribute(i,""),g=U(h[i],"function"),U(h[i],"undefined")||(h[i]=ay),h.removeAttribute(i))),h=null,g}var b={select:"input",change:"input",submit:"form",reset:"form",error:"img",load:"img",abort:"img"};return c}(),Y={}.hasOwnProperty,X;!U(Y,"undefined")&&!U(Y.call,"undefined")?X=function(d,c){return Y.call(d,c)}:X=function(d,c){return c in d&&U(d.constructor.prototype[c],"undefined")},Function.prototype.bind||(Function.prototype.bind=function(f){var i=this;if(typeof i!="function"){throw new TypeError}var h=ad.call(arguments,1),g=function(){if(this instanceof g){var b=function(){};b.prototype=i.prototype;var d=new b,c=i.apply(d,h.concat(ad.call(arguments)));return Object(c)===c?c:d}return i.apply(f,h.concat(ad.call(arguments)))};return g});var P=function(i,h){var e=i.join(""),b=h.length;ab(e,function(o,n){var m=az.styleSheets[az.styleSheets.length-1],l=m?m.cssRules&&m.cssRules[0]?m.cssRules[0].cssText:m.cssText||"":"",k=o.childNodes,g={};while(b--){g[k[b].id]=k[b]}aw.touch="ontouchstart" in aA||aA.DocumentTouch&&az instanceof DocumentTouch||(g.touch&&g.touch.offsetTop)===9,aw.csstransforms3d=(g.csstransforms3d&&g.csstransforms3d.offsetLeft)===9&&g.csstransforms3d.offsetHeight===3,aw.generatedcontent=(g.generatedcontent&&g.generatedcontent.offsetHeight)>=1,aw.fontface=/src/i.test(l)&&l.indexOf(n.split(" ")[0])===0},b,h)}(['@font-face {font-family:"font";src:url("https://")}',["@media (",am.join("touch-enabled),("),at,")","{#touch{top:9px;position:absolute}}"].join(""),["@media (",am.join("transform-3d),("),at,")","{#csstransforms3d{left:9px;position:absolute;height:3px;}}"].join(""),['#generatedcontent:after{content:"',ao,'";visibility:hidden}'].join("")],["fontface","touch","csstransforms3d","generatedcontent"]);ah.flexbox=function(){return Q("flexOrder")},ah["flexbox-legacy"]=function(){return Q("boxDirection")},ah.canvas=function(){var b=az.createElement("canvas");return !!b.getContext&&!!b.getContext("2d")},ah.canvastext=function(){return !!aw.canvas&&!!U(az.createElement("canvas").getContext("2d").fillText,"function")},ah.webgl=function(){try{var g=az.createElement("canvas"),c;c=!(!aA.WebGLRenderingContext||!g.getContext("experimental-webgl")&&!g.getContext("webgl")),g=ay}catch(b){c=!1}return c},ah.touch=function(){return aw.touch},ah.geolocation=function(){return !!navigator.geolocation},ah.postmessage=function(){return !!aA.postMessage},ah.websqldatabase=function(){return !!aA.openDatabase},ah.indexedDB=function(){return !!Q("indexedDB",aA)},ah.hashchange=function(){return Z("hashchange",aA)&&(az.documentMode===ay||az.documentMode>7)},ah.history=function(){return !!aA.history&&!!history.pushState},ah.draganddrop=function(){var b=az.createElement("div");return"draggable" in b||"ondragstart" in b&&"ondrop" in b},ah.websockets=function(){for(var d=-1,e=ak.length;++d<e;){if(aA[ak[d]+"WebSocket"]){return !0}}return"WebSocket" in aA},ah.rgba=function(){return W("background-color:rgba(150,255,150,.5)"),T(aq.backgroundColor,"rgba")},ah.hsla=function(){return W("background-color:hsla(120,40%,100%,.5)"),T(aq.backgroundColor,"rgba")||T(aq.backgroundColor,"hsla")},ah.multiplebgs=function(){return W("background:url(https://),url(https://),red url(https://)"),/(url\s*\(.*?){3}/.test(aq.background)},ah.backgroundsize=function(){return Q("backgroundSize")},ah.borderimage=function(){return Q("borderImage")},ah.borderradius=function(){return Q("borderRadius")},ah.boxshadow=function(){return Q("boxShadow")},ah.textshadow=function(){return az.createElement("div").style.textShadow===""},ah.opacity=function(){return V("opacity:.55"),/^0.55$/.test(aq.opacity)},ah.cssanimations=function(){return Q("animationName")},ah.csscolumns=function(){return Q("columnCount")},ah.cssgradients=function(){var e="background-image:",d="gradient(linear,left top,right bottom,from(#9f9),to(white));",f="linear-gradient(left top,#9f9, white);";return W((e+"-webkit- ".split(" ").join(d+e)+am.join(f+e)).slice(0,-e.length)),T(aq.backgroundImage,"gradient")},ah.cssreflections=function(){return Q("boxReflect")},ah.csstransforms=function(){return !!Q("transform")},ah.csstransforms3d=function(){var b=!!Q("perspective");return b&&"webkitPerspective" in au.style&&(b=aw.csstransforms3d),b},ah.csstransitions=function(){return Q("transition")},ah.fontface=function(){return aw.fontface},ah.generatedcontent=function(){return aw.generatedcontent},ah.video=function(){var b=az.createElement("video"),f=!1;try{if(f=!!b.canPlayType){f=new Boolean(f),f.ogg=b.canPlayType('video/ogg; codecs="theora"').replace(/^no$/,""),f.h264=b.canPlayType('video/mp4; codecs="avc1.42E01E"').replace(/^no$/,""),f.webm=b.canPlayType('video/webm; codecs="vp8, vorbis"').replace(/^no$/,"")}}catch(e){}return f},ah.audio=function(){var b=az.createElement("audio"),f=!1;try{if(f=!!b.canPlayType){f=new Boolean(f),f.ogg=b.canPlayType('audio/ogg; codecs="vorbis"').replace(/^no$/,""),f.mp3=b.canPlayType("audio/mpeg;").replace(/^no$/,""),f.wav=b.canPlayType('audio/wav; codecs="1"').replace(/^no$/,""),f.m4a=(b.canPlayType("audio/x-m4a;")||b.canPlayType("audio/aac;")).replace(/^no$/,"")}}catch(e){}return f},ah.localstorage=function(){try{return localStorage.setItem(at,at),localStorage.removeItem(at),!0}catch(b){return !1}},ah.sessionstorage=function(){try{return sessionStorage.setItem(at,at),sessionStorage.removeItem(at),!0}catch(b){return !1}},ah.webworkers=function(){return !!aA.Worker},ah.applicationcache=function(){return !!aA.applicationCache},ah.svg=function(){return !!az.createElementNS&&!!az.createElementNS(ai.svg,"svg").createSVGRect},ah.inlinesvg=function(){var b=az.createElement("div");return b.innerHTML="<svg/>",(b.firstChild&&b.firstChild.namespaceURI)==ai.svg},ah.smil=function(){return !!az.createElementNS&&/SVGAnimate/.test(an.call(az.createElementNS(ai.svg,"animate")))},ah.svgclippaths=function(){return !!az.createElementNS&&/SVGClipPath/.test(an.call(az.createElementNS(ai.svg,"clipPath")))};for(var N in ah){X(ah,N)&&(ac=N.toLowerCase(),aw[ac]=ah[N](),ae.push((aw[ac]?"":"no-")+ac))}return aw.input||O(),aw.addTest=function(e,c){if(typeof e=="object"){for(var f in e){X(e,f)&&aw.addTest(f,e[f])}}else{e=e.toLowerCase();if(aw[e]!==ay){return aw}c=typeof c=="function"?c():c,au.className+=" "+(c?"":"no-")+e,aw[e]=c}return aw},W(""),ar=ap=null,function(v,u){function p(f,e){var h=f.createElement("p"),g=f.getElementsByTagName("head")[0]||f.documentElement;return h.innerHTML="x<style>"+e+"</style>",g.insertBefore(h.lastChild,g.firstChild)}function o(){var b=l.elements;return typeof b=="string"?b.split(" "):b}function n(g){var d={},j=g.createElement,i=g.createDocumentFragment,h=i();g.createElement=function(b){var c=(d[b]||(d[b]=j(b))).cloneNode();return l.shivMethods&&c.canHaveChildren&&!s.test(b)?h.appendChild(c):c},g.createDocumentFragment=Function("h,f","return function(){var n=f.cloneNode(),c=n.createElement;h.shivMethods&&("+o().join().replace(/\w+/g,function(b){return d[b]=j(b),h.createElement(b),'c("'+b+'")'})+");return n}")(l,h)}function m(d){var c;return d.documentShived?d:(l.shivCSS&&!r&&(c=!!p(d,"article,aside,details,figcaption,figure,footer,header,hgroup,nav,section{display:block}audio{display:none}canvas,video{display:inline-block;*display:inline;*zoom:1}[hidden]{display:none}audio[controls]{display:inline-block;*display:inline;*zoom:1}mark{background:#FF0;color:#000}")),q||(c=!n(d)),c&&(d.documentShived=c),d)}var t=v.html5||{},s=/^<|^(?:button|form|map|select|textarea)$/i,r,q;(function(){var b=u.createElement("a");b.innerHTML="<xyz></xyz>",r="hidden" in b,q=b.childNodes.length==1||function(){try{u.createElement("a")}catch(d){return !0}var e=u.createDocumentFragment();return typeof e.cloneNode=="undefined"||typeof e.createDocumentFragment=="undefined"||typeof e.createElement=="undefined"}()})();var l={elements:t.elements||"abbr article aside audio bdi canvas data datalist details figcaption figure footer header hgroup mark meter nav output progress section summary time video",shivCSS:t.shivCSS!==!1,shivMethods:t.shivMethods!==!1,type:"default",shivDocument:m};v.html5=l,m(u)}(this,az),aw._version=ax,aw._prefixes=am,aw._domPrefixes=aj,aw._cssomPrefixes=ak,aw.mq=aa,aw.hasEvent=Z,aw.testProp=function(b){return S([b])},aw.testAllProps=Q,aw.testStyles=ab,au.className=au.className.replace(/(^|\s)no-js(\s|$)/,"$1$2")+(av?" js "+ae.join(" "):""),aw}(this,this.document),function(ad,ac,ab){function aa(b){return P.call(b)=="[object Function]"}function Z(b){return typeof b=="string"}function Y(){}function X(b){return !b||b=="loaded"||b=="complete"||b=="uninitialized"}function W(){var b=O.shift();M=1,b?b.t?R(function(){(b.t=="c"?L.injectCss:L.injectJs)(b.s,0,b.a,b.x,b.e,1)},0):(b(),W()):M=0}function V(w,v,t,s,q,p,n){function m(c){if(!g&&X(h.readyState)&&(x.r=g=1,!M&&W(),h.onload=h.onreadystatechange=null,c)){w!="img"&&R(function(){I.removeChild(h)},50);for(var e in D[v]){D[v].hasOwnProperty(e)&&D[v][e].onload()}}}var n=n||L.errorTimeout,h={},g=0,b=0,x={t:t,s:v,e:q,a:p,x:n};D[v]===1&&(b=1,D[v]=[],h=ac.createElement(w)),w=="object"?h.data=v:(h.src=v,h.type=w),h.width=h.height="0",h.onerror=h.onload=h.onreadystatechange=function(){m.call(this,b)},O.splice(s,0,x),w!="img"&&(b||D[v]===2?(I.insertBefore(h,J?null:Q),R(m,n)):D[v].push(h))}function U(g,e,j,i,h){return M=0,e=e||"j",Z(g)?V(e=="c"?G:H,g,e,this.i++,j,i,h):(O.splice(this.i++,0,g),O.length==1&&W()),this}function T(){var b=L;return b.loader={load:U,i:0},b}var S=ac.documentElement,R=ad.setTimeout,Q=ac.getElementsByTagName("script")[0],P={}.toString,O=[],M=0,K="MozAppearance" in S.style,J=K&&!!ac.createRange().compareNode,I=J?S:Q.parentNode,S=ad.opera&&P.call(ad.opera)=="[object Opera]",S=!!ac.attachEvent&&!S,H=K?"object":S?"script":"img",G=S?"script":H,F=Array.isArray||function(b){return P.call(b)=="[object Array]"},E=[],D={},C={timeout:function(d,c){return c.length&&(d.timeout=c[0]),d}},N,L;L=function(f){function d(j){var j=j.split("!"),i=E.length,q=j.pop(),p=j.length,q={url:q,origUrl:q,prefixes:j},o,m,l;for(m=0;m<p;m++){l=j[m].split("="),(o=C[l.shift()])&&(q=o(q,l))}for(m=0;m<i;m++){q=E[m](q)}return q}function n(m,s,r,q,p){var o=d(m),b=o.autoCallback;o.url.split(".").pop().split("?").shift(),o.bypass||(s&&(s=aa(s)?s:s[m]||s[q]||s[m.split("/").pop().split("?")[0]]||W),o.instead?o.instead(m,s,r,q,p):(D[o.url]?o.noexec=!0:D[o.url]=1,r.load(o.url,o.forceCSS||!o.forceJS&&"css"==o.url.split(".").pop().split("?").shift()?"c":ab,o.noexec,o.attrs,o.timeout),(aa(s)||aa(b))&&r.load(function(){T(),s&&s(o.origUrl,p,q),b&&b(o.origUrl,p,q),D[o.url]=2})))}function k(w,v){function u(b,i){if(b){if(Z(b)){i||(r=function(){var j=[].slice.call(arguments);q.apply(this,j),p()}),n(b,r,v,0,t)}else{if(Object(b)===b){for(g in o=function(){var j=0,l;for(l in b){b.hasOwnProperty(l)&&j++}return j}(),b){b.hasOwnProperty(g)&&(!i&&!--o&&(aa(r)?r=function(){var j=[].slice.call(arguments);q.apply(this,j),p()}:r[g]=function(j){return function(){var l=[].slice.call(arguments);j&&j.apply(this,l),p()}}(q[g])),n(b[g],r,v,g,t))}}}}else{!i&&p()}}var t=!!w.test,s=w.load||w.both,r=w.callback||Y,q=r,p=w.complete||Y,o,g;u(t?w.yep:w.nope,!!s),s&&u(s)}var h,e,c=this.yepnope.loader;if(Z(f)){n(f,0,c,0)}else{if(F(f)){for(h=0;h<f.length;h++){e=f[h],Z(e)?n(e,0,c,0):F(e)?L(e):Object(e)===e&&k(e,c)}}else{Object(f)===f&&k(f,c)}}},L.addPrefix=function(d,c){C[d]=c},L.addFilter=function(b){E.push(b)},L.errorTimeout=10000,ac.readyState==null&&ac.addEventListener&&(ac.readyState="loading",ac.addEventListener("DOMContentLoaded",N=function(){ac.removeEventListener("DOMContentLoaded",N,0),ac.readyState="complete"},0)),ad.yepnope=T(),ad.yepnope.executeStack=W,ad.yepnope.injectJs=function(r,q,p,n,m,h){var g=ac.createElement("script"),f,b,n=n||L.errorTimeout;g.src=r;for(b in p){g.setAttribute(b,p[b])}q=h?W:q||Y,g.onreadystatechange=g.onload=function(){!f&&X(g.readyState)&&(f=1,q(),g.onload=g.onreadystatechange=null)},R(function(){f||(f=1,q(1))},n),m?g.onload():Q.parentNode.insertBefore(g,Q)},ad.yepnope.injectCss=function(b,n,m,l,k,h){var l=ac.createElement("link"),f,n=h?W:n||Y;l.href=b,l.rel="stylesheet",l.type="text/css";for(f in m){l.setAttribute(f,m[f])}k||(Q.parentNode.insertBefore(l,Q),R(n,0))}}(this,document),Modernizr.load=function(){yepnope.apply(window,[].slice.call(arguments,0))},Modernizr.addTest("mediaqueries",Modernizr.mq("only all"));Modernizr.addTest("iswindows",function(){return !!navigator.platform.match(/Win/i)});cmg.query(window).on("ads/ready",function(){cmg.henka({min:768}).on(function(){cmg.harmony.show.breakpoint("972px-infinity")}).off(function(){cmg.harmony.hide.breakpoint("972px-infinity")}).update(true);cmg.henka({max:767}).on(function(){cmg.harmony.show.breakpoint("1px-479px")}).off(function(){cmg.harmony.hide.breakpoint("1px-479px")}).update(true)});cmg.query(document).ready(function(d){Modernizr.touch=Modernizr.touch||window.navigator.msMaxTouchPoints;if(Modernizr.touch&&d("html.no-touch").length){d("html").removeClass("no-touch").addClass("touch")}if(Modernizr.iswindows){d("html").addClass("iswindows")}if(window.addEventListener){if(!location.hash){setTimeout(function(){scrollTo(0,1)},0)}}d(".section-nav-collapse").bind("click",function(){d(this).toggleClass("nav-collapse-open");var k=d(this).find("i");d(".section-nav-collapse i","#section-nav").not(k).removeClass("icon-minus");k.toggleClass("icon-minus")});d(".dropdown",d(".main-nav")).wrapInner(d("<div/>",{"class":"table-cell-container"}));if(Modernizr.touch){var h,j,b,e=10;d(".dropdown").on("touchstart","a.dropdown-toggle",function(k){var m=d(this);if((m.parent(".open").length)&&(!m.next(".accordion-toggle").is(":visible"))){var l=d(this).attr("href");if(l){window.location.href=l}}else{h=k.originalEvent.touches[0].pageY}});d(".dropdown").on("touchend","a.dropdown-toggle",function(k){var m=d(this);j=k.originalEvent.changedTouches[0].pageY;b=Math.abs(j-h);if(m.next(".accordion-toggle").is(":visible")&&(b<e)){var l=d(this).attr("href");if(l){window.location.href=l}}})}else{setTimeout(function(){d("body").off("click.dropdown");d(".dropdown").on("hover",function(k){d(this).children(".table-cell-container").toggleClass("open",k.type==="mouseenter")})},50)}var c=d(".form-search");var g=c.clone(true);var i=d(".main-nav .nav");cmg.henka({max:599}).on(function(){if(Modernizr.mq("max-width: 479px")){g.removeClass("pull-right");d(".navbar-container a.btn").removeClass("btn-navbar")}if(!d(".main-nav .form-search").length){d(".main-nav .btn-navbar").after(g)}d(".weather-cond").remove();var k=d(".masthead-info .datetime");d(".brand.logo h1").before(k.clone());k.first().remove();i.removeClass("nav-stretch");d("> li",i).addClass("accordion-group");d(" li",i).removeClass("dropdown");d(" li ul",i).removeClass("dropdown-menu").addClass("accordion-body").addClass("collapse");d(".dropdown-toggle",i).removeClass("prevent").attr("data-toggle","")}).update(true);cmg.henka({min:600,max:767}).on(function(){if(!d(".main-nav .form-search").length){d(".main-nav .btn-navbar").after(g)}i.removeClass("nav-stretch");d("> li",i).addClass("accordion-group");d(" li",i).removeClass("dropdown");d(" li ul",i).removeClass("dropdown-menu").addClass("accordion-body").addClass("collapse");d(".dropdown-toggle",i).removeClass("prevent").attr("data-toggle","")}).update(true);cmg.henka({min:768}).on(function(){cmg.query(".main-nav .form-search").remove();i.addClass("nav-stretch");d("> li",i).removeClass("accordion-group");d(" li",i).addClass("dropdown");d(" li ul",i).addClass("dropdown-menu").removeClass("accordion-body").removeClass("collapse");d(".dropdown-toggle",i).addClass("prevent").attr("data-toggle","dropdown")}).update(true);var f=d(".mastfoot").clone();cmg.henka({max:768}).on(function(){var k=d(".mastfoot");var l=d(".row h5",k).siblings();l.each(function(){$this=d(this);$subcolumns=$this.children(".span2");if($subcolumns.length==1){var m=d("<ul/>",{"class":"unstyled"});var n=d("ul li",$subcolumns);n.slice((n.length/2)+(n.length%2?1:0),n.length).appendTo(m);d("<div/>",{"class":"span2"}).append(m).appendTo($this)}})}).off(function(){d(".mastfoot").html(f.html())}).update(true);cmg.henka({max:480}).on(function(){d(".time-stamp span").html("<br>")}).off(function(){d(".time-stamp span").html("&nbsp;&nbsp;&#124;&nbsp;&nbsp;")}).update(true);d(window).on("orientationchange",function(k){if(window.scrollTo&&window.scrollX!==0){window.scrollTo(0,window.scrollY)}});d("#article-related").on("click",'a:not([href~="'+location.hostname+'"])',function(k){if(!~this.href.indexOf(location.hostname)){this.target="_blank"}});(function(){var k=function(m){var l=d(".modal");l.each(function(n,q){var o=d(q);var p=d(".modal-content img",o);if(m!="auto"){m=parseInt(m)>p.data("ltmaxwidth")?p.data("ltmaxwidth"):parseInt(m)}o.css("left",m==="auto"?"5%":"50%");o.css("right",m==="auto"?"5%":"50%");o.css("width",m);if(o.data().modal){o.data().modal.layout()}})};cmg.henka({max:480}).on(function(){k("auto")}).update(true);cmg.henka({min:481,max:600}).on(function(){k("auto")}).update(true);cmg.henka({min:601,max:768}).on(function(){k("560px")}).update(true);cmg.henka({min:769}).on(function(){k("715px")}).update(true)}());d(".breaking-news").bind("click",".breaking-news-headline a",function(k){k.stopPropagation();if(k.which<=2){if(flipper.is_active("DTMmetrics_Enable")){cmg.DDO.action("breakingNews")}else{fire_omniture_event.call(this,cmg.s_coxnews,"event35","breaking news",k)}}});d(".searchtoggle .locationlink").click(function(){d(".cmWeatherSearchForm .searchform").toggle();return false});if(d("#cmWeather").length){cmg.henka({max:600}).on(function(){d(".cmWeatherHourbyHour table tr").each(function(){d(this).find("td, th").show().slice(4).hide()});d("div.row").slice(0,2).show();d("#cmWeatherAd .ad-warning").hide();cmg.harmony.hide.breakpoint("600px-infinity");cmg.harmony.show.breakpoint("1px-599px")}).update(true);cmg.henka({max:480}).on(function(){d(".cmWeatherHourbyHour table tr").each(function(){d(this).find("td, th").slice(3).hide()});d("#cmWeatherAd .ad-warning").hide();d("div.row").slice(0,2).show();cmg.harmony.hide.breakpoint("600px-infinity");cmg.harmony.show.breakpoint("1px-599px")}).update(true);cmg.henka({min:765}).on(function(){d(".cmWeatherHourbyHour table tr").each(function(){d(this).find("td, th").show()});d("#cmWeatherAd .ad-warning").show();d("div.row").slice(0,2).hide();cmg.harmony.show.breakpoint("600px-infinity");cmg.harmony.hide.breakpoint("1px-599px");var l=d(".cmWeatherFiveDayForecastBox .cmWeatherDescription");var k=Math.max.apply(Math,d.map(l,function(m){return d(m).height()}));l.height(k)}).update(true);cmg.henka({min:601,max:764}).on(function(){d(".cmWeatherHourbyHour table tr").each(function(){d(this).find("td, th").show()});d("#cmWeatherAd .ad-warning").hide();d("div.row").show(0,2).hide();cmg.harmony.hide.breakpoint("600px-infinity");cmg.harmony.show.breakpoint("1px-599px")}).update(true)}});;
// Backbone.js 0.9.2

// (c) 2010-2012 Jeremy Ashkenas, DocumentCloud Inc.
// Backbone may be freely distributed under the MIT license.
// For all details and documentation:
// http://backbonejs.org
(function(){var l=this,y=l.Backbone,z=Array.prototype.slice,A=Array.prototype.splice,g;g="undefined"!==typeof exports?exports:l.Backbone={};g.VERSION="0.9.2";var f=l._;!f&&"undefined"!==typeof require&&(f=require("underscore"));var i=l.jQuery||l.Zepto||l.ender;g.setDomLibrary=function(a){i=a};g.noConflict=function(){l.Backbone=y;return this};g.emulateHTTP=!1;g.emulateJSON=!1;var p=/\s+/,k=g.Events={on:function(a,b,c){var d,e,f,g,j;if(!b)return this;a=a.split(p);for(d=this._callbacks||(this._callbacks=
{});e=a.shift();)f=(j=d[e])?j.tail:{},f.next=g={},f.context=c,f.callback=b,d[e]={tail:g,next:j?j.next:f};return this},off:function(a,b,c){var d,e,h,g,j,q;if(e=this._callbacks){if(!a&&!b&&!c)return delete this._callbacks,this;for(a=a?a.split(p):f.keys(e);d=a.shift();)if(h=e[d],delete e[d],h&&(b||c))for(g=h.tail;(h=h.next)!==g;)if(j=h.callback,q=h.context,b&&j!==b||c&&q!==c)this.on(d,j,q);return this}},trigger:function(a){var b,c,d,e,f,g;if(!(d=this._callbacks))return this;f=d.all;a=a.split(p);for(g=
z.call(arguments,1);b=a.shift();){if(c=d[b])for(e=c.tail;(c=c.next)!==e;)c.callback.apply(c.context||this,g);if(c=f){e=c.tail;for(b=[b].concat(g);(c=c.next)!==e;)c.callback.apply(c.context||this,b)}}return this}};k.bind=k.on;k.unbind=k.off;var o=g.Model=function(a,b){var c;a||(a={});b&&b.parse&&(a=this.parse(a));if(c=n(this,"defaults"))a=f.extend({},c,a);b&&b.collection&&(this.collection=b.collection);this.attributes={};this._escapedAttributes={};this.cid=f.uniqueId("c");this.changed={};this._silent=
{};this._pending={};this.set(a,{silent:!0});this.changed={};this._silent={};this._pending={};this._previousAttributes=f.clone(this.attributes);this.initialize.apply(this,arguments)};f.extend(o.prototype,k,{changed:null,_silent:null,_pending:null,idAttribute:"id",initialize:function(){},toJSON:function(){return f.clone(this.attributes)},get:function(a){return this.attributes[a]},escape:function(a){var b;if(b=this._escapedAttributes[a])return b;b=this.get(a);return this._escapedAttributes[a]=f.escape(null==
b?"":""+b)},has:function(a){return null!=this.get(a)},set:function(a,b,c){var d,e;f.isObject(a)||null==a?(d=a,c=b):(d={},d[a]=b);c||(c={});if(!d)return this;d instanceof o&&(d=d.attributes);if(c.unset)for(e in d)d[e]=void 0;if(!this._validate(d,c))return!1;this.idAttribute in d&&(this.id=d[this.idAttribute]);var b=c.changes={},h=this.attributes,g=this._escapedAttributes,j=this._previousAttributes||{};for(e in d){a=d[e];if(!f.isEqual(h[e],a)||c.unset&&f.has(h,e))delete g[e],(c.silent?this._silent:
b)[e]=!0;c.unset?delete h[e]:h[e]=a;!f.isEqual(j[e],a)||f.has(h,e)!=f.has(j,e)?(this.changed[e]=a,c.silent||(this._pending[e]=!0)):(delete this.changed[e],delete this._pending[e])}c.silent||this.change(c);return this},unset:function(a,b){(b||(b={})).unset=!0;return this.set(a,null,b)},clear:function(a){(a||(a={})).unset=!0;return this.set(f.clone(this.attributes),a)},fetch:function(a){var a=a?f.clone(a):{},b=this,c=a.success;a.success=function(d,e,f){if(!b.set(b.parse(d,f),a))return!1;c&&c(b,d)};
a.error=g.wrapError(a.error,b,a);return(this.sync||g.sync).call(this,"read",this,a)},save:function(a,b,c){var d,e;f.isObject(a)||null==a?(d=a,c=b):(d={},d[a]=b);c=c?f.clone(c):{};if(c.wait){if(!this._validate(d,c))return!1;e=f.clone(this.attributes)}a=f.extend({},c,{silent:!0});if(d&&!this.set(d,c.wait?a:c))return!1;var h=this,i=c.success;c.success=function(a,b,e){b=h.parse(a,e);if(c.wait){delete c.wait;b=f.extend(d||{},b)}if(!h.set(b,c))return false;i?i(h,a):h.trigger("sync",h,a,c)};c.error=g.wrapError(c.error,
h,c);b=this.isNew()?"create":"update";b=(this.sync||g.sync).call(this,b,this,c);c.wait&&this.set(e,a);return b},destroy:function(a){var a=a?f.clone(a):{},b=this,c=a.success,d=function(){b.trigger("destroy",b,b.collection,a)};if(this.isNew())return d(),!1;a.success=function(e){a.wait&&d();c?c(b,e):b.trigger("sync",b,e,a)};a.error=g.wrapError(a.error,b,a);var e=(this.sync||g.sync).call(this,"delete",this,a);a.wait||d();return e},url:function(){var a=n(this,"urlRoot")||n(this.collection,"url")||t();
return this.isNew()?a:a+("/"==a.charAt(a.length-1)?"":"/")+encodeURIComponent(this.id)},parse:function(a){return a},clone:function(){return new this.constructor(this.attributes)},isNew:function(){return null==this.id},change:function(a){a||(a={});var b=this._changing;this._changing=!0;for(var c in this._silent)this._pending[c]=!0;var d=f.extend({},a.changes,this._silent);this._silent={};for(c in d)this.trigger("change:"+c,this,this.get(c),a);if(b)return this;for(;!f.isEmpty(this._pending);){this._pending=
{};this.trigger("change",this,a);for(c in this.changed)!this._pending[c]&&!this._silent[c]&&delete this.changed[c];this._previousAttributes=f.clone(this.attributes)}this._changing=!1;return this},hasChanged:function(a){return!arguments.length?!f.isEmpty(this.changed):f.has(this.changed,a)},changedAttributes:function(a){if(!a)return this.hasChanged()?f.clone(this.changed):!1;var b,c=!1,d=this._previousAttributes,e;for(e in a)if(!f.isEqual(d[e],b=a[e]))(c||(c={}))[e]=b;return c},previous:function(a){return!arguments.length||
!this._previousAttributes?null:this._previousAttributes[a]},previousAttributes:function(){return f.clone(this._previousAttributes)},isValid:function(){return!this.validate(this.attributes)},_validate:function(a,b){if(b.silent||!this.validate)return!0;var a=f.extend({},this.attributes,a),c=this.validate(a,b);if(!c)return!0;b&&b.error?b.error(this,c,b):this.trigger("error",this,c,b);return!1}});var r=g.Collection=function(a,b){b||(b={});b.model&&(this.model=b.model);b.comparator&&(this.comparator=b.comparator);
this._reset();this.initialize.apply(this,arguments);a&&this.reset(a,{silent:!0,parse:b.parse})};f.extend(r.prototype,k,{model:o,initialize:function(){},toJSON:function(a){return this.map(function(b){return b.toJSON(a)})},add:function(a,b){var c,d,e,g,i,j={},k={},l=[];b||(b={});a=f.isArray(a)?a.slice():[a];c=0;for(d=a.length;c<d;c++){if(!(e=a[c]=this._prepareModel(a[c],b)))throw Error("Can't add an invalid model to a collection");g=e.cid;i=e.id;j[g]||this._byCid[g]||null!=i&&(k[i]||this._byId[i])?
l.push(c):j[g]=k[i]=e}for(c=l.length;c--;)a.splice(l[c],1);c=0;for(d=a.length;c<d;c++)(e=a[c]).on("all",this._onModelEvent,this),this._byCid[e.cid]=e,null!=e.id&&(this._byId[e.id]=e);this.length+=d;A.apply(this.models,[null!=b.at?b.at:this.models.length,0].concat(a));this.comparator&&this.sort({silent:!0});if(b.silent)return this;c=0;for(d=this.models.length;c<d;c++)if(j[(e=this.models[c]).cid])b.index=c,e.trigger("add",e,this,b);return this},remove:function(a,b){var c,d,e,g;b||(b={});a=f.isArray(a)?
a.slice():[a];c=0;for(d=a.length;c<d;c++)if(g=this.getByCid(a[c])||this.get(a[c]))delete this._byId[g.id],delete this._byCid[g.cid],e=this.indexOf(g),this.models.splice(e,1),this.length--,b.silent||(b.index=e,g.trigger("remove",g,this,b)),this._removeReference(g);return this},push:function(a,b){a=this._prepareModel(a,b);this.add(a,b);return a},pop:function(a){var b=this.at(this.length-1);this.remove(b,a);return b},unshift:function(a,b){a=this._prepareModel(a,b);this.add(a,f.extend({at:0},b));return a},
shift:function(a){var b=this.at(0);this.remove(b,a);return b},get:function(a){return null==a?void 0:this._byId[null!=a.id?a.id:a]},getByCid:function(a){return a&&this._byCid[a.cid||a]},at:function(a){return this.models[a]},where:function(a){return f.isEmpty(a)?[]:this.filter(function(b){for(var c in a)if(a[c]!==b.get(c))return!1;return!0})},sort:function(a){a||(a={});if(!this.comparator)throw Error("Cannot sort a set without a comparator");var b=f.bind(this.comparator,this);1==this.comparator.length?
this.models=this.sortBy(b):this.models.sort(b);a.silent||this.trigger("reset",this,a);return this},pluck:function(a){return f.map(this.models,function(b){return b.get(a)})},reset:function(a,b){a||(a=[]);b||(b={});for(var c=0,d=this.models.length;c<d;c++)this._removeReference(this.models[c]);this._reset();this.add(a,f.extend({silent:!0},b));b.silent||this.trigger("reset",this,b);return this},fetch:function(a){a=a?f.clone(a):{};void 0===a.parse&&(a.parse=!0);var b=this,c=a.success;a.success=function(d,
e,f){b[a.add?"add":"reset"](b.parse(d,f),a);c&&c(b,d)};a.error=g.wrapError(a.error,b,a);return(this.sync||g.sync).call(this,"read",this,a)},create:function(a,b){var c=this,b=b?f.clone(b):{},a=this._prepareModel(a,b);if(!a)return!1;b.wait||c.add(a,b);var d=b.success;b.success=function(e,f){b.wait&&c.add(e,b);d?d(e,f):e.trigger("sync",a,f,b)};a.save(null,b);return a},parse:function(a){return a},chain:function(){return f(this.models).chain()},_reset:function(){this.length=0;this.models=[];this._byId=
{};this._byCid={}},_prepareModel:function(a,b){b||(b={});a instanceof o?a.collection||(a.collection=this):(b.collection=this,a=new this.model(a,b),a._validate(a.attributes,b)||(a=!1));return a},_removeReference:function(a){this==a.collection&&delete a.collection;a.off("all",this._onModelEvent,this)},_onModelEvent:function(a,b,c,d){("add"==a||"remove"==a)&&c!=this||("destroy"==a&&this.remove(b,d),b&&a==="change:"+b.idAttribute&&(delete this._byId[b.previous(b.idAttribute)],this._byId[b.id]=b),this.trigger.apply(this,
arguments))}});f.each("forEach,each,map,reduce,reduceRight,find,detect,filter,select,reject,every,all,some,any,include,contains,invoke,max,min,sortBy,sortedIndex,toArray,size,first,initial,rest,last,without,indexOf,shuffle,lastIndexOf,isEmpty,groupBy".split(","),function(a){r.prototype[a]=function(){return f[a].apply(f,[this.models].concat(f.toArray(arguments)))}});var u=g.Router=function(a){a||(a={});a.routes&&(this.routes=a.routes);this._bindRoutes();this.initialize.apply(this,arguments)},B=/:\w+/g,
C=/\*\w+/g,D=/[-[\]{}()+?.,\\^$|#\s]/g;f.extend(u.prototype,k,{initialize:function(){},route:function(a,b,c){g.history||(g.history=new m);f.isRegExp(a)||(a=this._routeToRegExp(a));c||(c=this[b]);g.history.route(a,f.bind(function(d){d=this._extractParameters(a,d);c&&c.apply(this,d);this.trigger.apply(this,["route:"+b].concat(d));g.history.trigger("route",this,b,d)},this));return this},navigate:function(a,b){g.history.navigate(a,b)},_bindRoutes:function(){if(this.routes){var a=[],b;for(b in this.routes)a.unshift([b,
this.routes[b]]);b=0;for(var c=a.length;b<c;b++)this.route(a[b][0],a[b][1],this[a[b][1]])}},_routeToRegExp:function(a){a=a.replace(D,"\\$&").replace(B,"([^/]+)").replace(C,"(.*?)");return RegExp("^"+a+"$")},_extractParameters:function(a,b){return a.exec(b).slice(1)}});var m=g.History=function(){this.handlers=[];f.bindAll(this,"checkUrl")},s=/^[#\/]/,E=/msie [\w.]+/;m.started=!1;f.extend(m.prototype,k,{interval:50,getHash:function(a){return(a=(a?a.location:window.location).href.match(/#(.*)$/))?a[1]:
""},getFragment:function(a,b){if(null==a)if(this._hasPushState||b){var a=window.location.pathname,c=window.location.search;c&&(a+=c)}else a=this.getHash();a.indexOf(this.options.root)||(a=a.substr(this.options.root.length));return a.replace(s,"")},start:function(a){if(m.started)throw Error("Backbone.history has already been started");m.started=!0;this.options=f.extend({},{root:"/"},this.options,a);this._wantsHashChange=!1!==this.options.hashChange;this._wantsPushState=!!this.options.pushState;this._hasPushState=
!(!this.options.pushState||!window.history||!window.history.pushState);var a=this.getFragment(),b=document.documentMode;if(b=E.exec(navigator.userAgent.toLowerCase())&&(!b||7>=b))this.iframe=i('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo("body")[0].contentWindow,this.navigate(a);this._hasPushState?i(window).bind("popstate",this.checkUrl):this._wantsHashChange&&"onhashchange"in window&&!b?i(window).bind("hashchange",this.checkUrl):this._wantsHashChange&&(this._checkUrlInterval=setInterval(this.checkUrl,
this.interval));this.fragment=a;a=window.location;b=a.pathname==this.options.root;if(this._wantsHashChange&&this._wantsPushState&&!this._hasPushState&&!b)return this.fragment=this.getFragment(null,!0),window.location.replace(this.options.root+"#"+this.fragment),!0;this._wantsPushState&&this._hasPushState&&b&&a.hash&&(this.fragment=this.getHash().replace(s,""),window.history.replaceState({},document.title,a.protocol+"//"+a.host+this.options.root+this.fragment));if(!this.options.silent)return this.loadUrl()},
stop:function(){i(window).unbind("popstate",this.checkUrl).unbind("hashchange",this.checkUrl);clearInterval(this._checkUrlInterval);m.started=!1},route:function(a,b){this.handlers.unshift({route:a,callback:b})},checkUrl:function(){var a=this.getFragment();a==this.fragment&&this.iframe&&(a=this.getFragment(this.getHash(this.iframe)));if(a==this.fragment)return!1;this.iframe&&this.navigate(a);this.loadUrl()||this.loadUrl(this.getHash())},loadUrl:function(a){var b=this.fragment=this.getFragment(a);return f.any(this.handlers,
function(a){if(a.route.test(b))return a.callback(b),!0})},navigate:function(a,b){if(!m.started)return!1;if(!b||!0===b)b={trigger:b};var c=(a||"").replace(s,"");this.fragment!=c&&(this._hasPushState?(0!=c.indexOf(this.options.root)&&(c=this.options.root+c),this.fragment=c,window.history[b.replace?"replaceState":"pushState"]({},document.title,c)):this._wantsHashChange?(this.fragment=c,this._updateHash(window.location,c,b.replace),this.iframe&&c!=this.getFragment(this.getHash(this.iframe))&&(b.replace||
this.iframe.document.open().close(),this._updateHash(this.iframe.location,c,b.replace))):window.location.assign(this.options.root+a),b.trigger&&this.loadUrl(a))},_updateHash:function(a,b,c){c?a.replace(a.toString().replace(/(javascript:|#).*$/,"")+"#"+b):a.hash=b}});var v=g.View=function(a){this.cid=f.uniqueId("view");this._configure(a||{});this._ensureElement();this.initialize.apply(this,arguments);this.delegateEvents()},F=/^(\S+)\s*(.*)$/,w="model,collection,el,id,attributes,className,tagName".split(",");
f.extend(v.prototype,k,{tagName:"div",$:function(a){return this.$el.find(a)},initialize:function(){},render:function(){return this},remove:function(){this.$el.remove();return this},make:function(a,b,c){a=document.createElement(a);b&&i(a).attr(b);c&&i(a).html(c);return a},setElement:function(a,b){this.$el&&this.undelegateEvents();this.$el=a instanceof i?a:i(a);this.el=this.$el[0];!1!==b&&this.delegateEvents();return this},delegateEvents:function(a){if(a||(a=n(this,"events"))){this.undelegateEvents();
for(var b in a){var c=a[b];f.isFunction(c)||(c=this[a[b]]);if(!c)throw Error('Method "'+a[b]+'" does not exist');var d=b.match(F),e=d[1],d=d[2],c=f.bind(c,this),e=e+(".delegateEvents"+this.cid);""===d?this.$el.bind(e,c):this.$el.delegate(d,e,c)}}},undelegateEvents:function(){this.$el.unbind(".delegateEvents"+this.cid)},_configure:function(a){this.options&&(a=f.extend({},this.options,a));for(var b=0,c=w.length;b<c;b++){var d=w[b];a[d]&&(this[d]=a[d])}this.options=a},_ensureElement:function(){if(this.el)this.setElement(this.el,
!1);else{var a=n(this,"attributes")||{};this.id&&(a.id=this.id);this.className&&(a["class"]=this.className);this.setElement(this.make(this.tagName,a),!1)}}});o.extend=r.extend=u.extend=v.extend=function(a,b){var c=G(this,a,b);c.extend=this.extend;return c};var H={create:"POST",update:"PUT","delete":"DELETE",read:"GET"};g.sync=function(a,b,c){var d=H[a];c||(c={});var e={type:d,dataType:"json"};c.url||(e.url=n(b,"url")||t());if(!c.data&&b&&("create"==a||"update"==a))e.contentType="application/json",
e.data=JSON.stringify(b.toJSON());g.emulateJSON&&(e.contentType="application/x-www-form-urlencoded",e.data=e.data?{model:e.data}:{});if(g.emulateHTTP&&("PUT"===d||"DELETE"===d))g.emulateJSON&&(e.data._method=d),e.type="POST",e.beforeSend=function(a){a.setRequestHeader("X-HTTP-Method-Override",d)};"GET"!==e.type&&!g.emulateJSON&&(e.processData=!1);return i.ajax(f.extend(e,c))};g.wrapError=function(a,b,c){return function(d,e){e=d===b?e:d;a?a(b,e,c):b.trigger("error",b,e,c)}};var x=function(){},G=function(a,
b,c){var d;d=b&&b.hasOwnProperty("constructor")?b.constructor:function(){a.apply(this,arguments)};f.extend(d,a);x.prototype=a.prototype;d.prototype=new x;b&&f.extend(d.prototype,b);c&&f.extend(d,c);d.prototype.constructor=d;d.__super__=a.prototype;return d},n=function(a,b){return!a||!a[b]?null:f.isFunction(a[b])?a[b]():a[b]},t=function(){throw Error('A "url" property or function must be specified');}}).call(this);;


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

    

    cmg.mediaurl = 'http://media.cmgdigital.com/shared/media/2015-07-21-11-51-44/web/common/';
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

    
    
;
(function ($) {
    $.fn.cmgsubnavify = function () {
        var active_item,
            $this = this,
            $subnav_content = $('div.nav-bar-subnav-content'),
            timeout = null,
            delta = 500, //mouse movement timeout
            tapped = null,
            tapped_times = 0,
            section_nav_height = 24,
            subnav_ad_height = 50,
            hide_me = function () {
                clearTimeout(timeout);
                $('div.nav-bar-subnav-ad').hide(0, function () {
                    $('a.dropdown-toggle').not($('a.dropdown-toggle', this)).removeClass('active');
                    $('div.nav-bar-subnav-content').hide();
                    $('div.nav-bar-subnav').addClass('hide');
                });
                active_item = undefined;
            };

        cmg.henka({
            min: 767
        }).init(function () {
        }).off(function () {
            $this.find('li').each(function () {
                var $this = $(this);

                $this.unbind('mouseover.cmgSubNavify touchstart.cmgSubNavify');
                $this.find('ul.subnav-sections').unwrap();
                if ($this.find('i.icon-minus').length > 0) {
                    $this.find('ul.subnav-sections').css('height', 'auto');
                } else {
                    $this.find('ul.subnav-sections').css('height', '0');
                }
            });
        }).on(function () {
            $this.find('li').each(function () {
                var $li = $(this),
                    normal_height;

                //copy bootstrap subnav without event bindings
                var _subnav = $li.find('.dropdown-menu'),
                    $subnav = _subnav.clone().removeClass('dropdown-menu'),
                    subnav_html = $subnav.html(); //needed for IE8 handling

                _subnav = $li.find('ul.subnav-sections');

                if (_subnav.parent().is('div.cmgBlockDisplay')) {
                    _subnav.unwrap();
                }

                _subnav.wrap('<div class="cmgBlockDisplay" style="display:none;overflow:hidden;visibility:hidden;" />');

                $li.on('mouseover.cmgSubNavify touchstart.cmgSubNavify', function (e) {
                    if (timeout !== null) {
                        clearTimeout(timeout);
                    }

                    timeout = setTimeout(function () {
                        if (active_item == $li) {
                            return;
                        }
                        active_item = $li;

                        $('a.dropdown-toggle').not($('a.dropdown-toggle', active_item)).removeClass('active');
                        $('a', active_item).addClass('active');

                        var menu_url = 'http://' + cmg.site_meta.domain + '/treemenus/menu/' + $li.data('menu') + '/';

                        $subnav_content.html('')
                            .append($('<i/>', {
                                'class': 'icon-spinner'
                            }))
                            .show()
                            .load(menu_url, function (responseText) {
                                var $this = $(this);

                                if ($subnav.length > 0) {
                                    if ($subnav.html().length < subnav_html.length) {
                                      //ie8 fix
                                      $subnav.html(subnav_html);
                                    }
                                }

                                $this.prepend($subnav);
                                $('div.nav-bar-subnav').removeClass('hide');

                                if (responseText.trim().length > 0) {
                                    // Adjust heights
                                    if (normal_height === undefined || normal_height === 0 || normal_height === 74) {
                                        normal_height = Math.max.apply(Math, $.map($('ul.subnav-sections, div.subnav-list-latest, div.subnav-list-more-in', $this), function (el) {
                                            return $(el).outerHeight(true);
                                        }));
                                    }

                                    var height = normal_height + section_nav_height + subnav_ad_height + 'px';
                                    $('ul.subnav-sections, div.subnav-list-latest, div.subnav-list-more-in').height(height);
                                    setTimeout(function () {
                                        $(this).css('height', height);
                                        $('div.nav-bar-subnav-ad').css('top', normal_height + section_nav_height + 'px').show();
                                    }, 0);

                                    // For subnav on higher breakpoints, add a query string to text links to track what's clicked
                                    $('.subnav-list-latest a').each(function () {
                                        var href = $(this).attr('href');
                                        $(this).attr('href', href + subnav_url);
                                    });

                                    // For subnav on higher breakpoints, add a query string to image links to track what's clicked
                                    $('.subnav-list-more-in a').each(function () {
                                        var href = $(this).attr('href');
                                        $(this).attr('href', href + subnav_image);
                                    });
                                } else {
                                    hide_me(); //hide submenu if if there is no content
                                }
                            });
                    }, delta);

                    if (e.type === 'touchstart') {
                        tapped_times += 1;
                        if (tapped_times <= 1) {
                            $(document).on('touchstart.cmgSubNavify', function (e) {
                                if (!$(e.target).parent().is('div.nav-bar-subnav-content, div.subnav-list-latest')) {
                                    $(this).unbind('touchstart.cmgSubNavify');
                                    hide_me(); //hide submenu on a touch to close menu
                                    e.preventDefault();
                                }

                                if ($(e.target).is('a, img', 'figcaption')) {
                                  location.href = $(e.target).is('img') ? $(e.target).parent('a').attr('href') : $(e.target).attr('href');
                                  $(e.target).addClass('active');
                               }
                            });
                            e.preventDefault();
                        }

                        if (tapped_times <= 3) {
                            //a timeout to clear the double tap timer
                            tapped = setTimeout(function () {
                                tapped_times = 0;
                            }, delta);
                        }

                        if (tapped_times > 2) {
                            e.preventDefault();
                            location.href = $('a', this).attr('href');
                        }
                    }
                }) //end here
                .parent().on('mouseleave', hide_me);
            });
        }).update(true);
    };
}(cmg.query));
;
var lazythumbs = {
    FETCH_STEP_MIN: 50
};
(function(lazythumbs){

    function bind_event(eventname, callback) {
        if (window.addEventListener) {
            window.addEventListener(eventname, callback, false);
        } else {
            window.attachEvent('on' + eventname, callback);
        }
    }

    function data(el, name, value) {
        if (!!el.dataset) {
            if (typeof value !== 'undefined') {
                el.dataset[name] = value;
            } else {
                return el.dataset[name]
            }
        } else {
            if (typeof value !== 'undefined') {
                el.setAttribute('data-' + name, value);
            } else {
                return el.getAttribute('data-' + name);
            }
        }
    }

    function update_responsive_images(e) {

        var responsive_images = document.querySelectorAll('.lt-responsive-img');
        var img, i, width, height, needs_loaded, url_template, old_ratio, new_ratio, wdelta, hdelta, roundedsize, matches;

        for (i=0; i < responsive_images.length; i++) {
            img = responsive_images[i];
            width = img.clientWidth;
            height = img.clientHeight;
            allow_undersized = false;

            aspectratio = data(img, 'aspectratio');
            if (aspectratio) {
                matches = /(\d+):(\d+)/.exec(aspectratio);
                old_ratio = matches[1] / matches[2];
                // We're not going to allow the aspect ratio to change.
                new_ratio = old_ratio;
                height = width * (1/old_ratio);
                allow_undersized = true;
            } else if (data(img, 'action') == 'matte') {
                // Since 'matte' will *probably* be requesting an image that's
                // larger than the underlying image (that's what the black
                // matte is for), we should not consult the image's maximum
                // dimensions before requesting a new image.
                allow_undersized = true;
            } else {
                old_ratio = data(img, 'ltwidth') / data(img, 'ltheight');
                new_ratio = width / height;
            }

            if (width===0 || height===0) {
                // The image is currently hidden
                continue;
            }

            // We want to load the image if this is the page load event
            // or if the image has increased in size.
            if (!data(img, 'ltmaxwidth')) {
                needs_loaded = true;
                data(img, 'ltmaxwidth', img.getAttribute('width'));
                data(img, 'ltmaxheight', img.getAttribute('height'));
            }

            roundedsize = round_size_up(
                {width: width, height: height},
                {width: data(img, 'ltmaxwidth'), height: data(img, 'ltmaxheight')},
                allow_undersized
            );
            width = roundedsize.width;
            height = roundedsize.height;

            if (e.type !== 'load') {
                // Check if we're using a defined aspect ratio, if we aren't,
                // we need to make sure that we don't request an image that's
                // larger than the image actually is.
                if(! allow_undersized) {
                    width = Math.min(width, data(img, 'ltmaxwidth'));
                    height = Math.min(height, data(img, 'ltmaxheight'));
                }
                wdelta = Math.abs(width - data(img, 'ltwidth'));
                hdelta = Math.abs(height - data(img, 'ltheight'));

                // Load new images when increasing by a large enough delta
                if (wdelta > lazythumbs.FETCH_STEP_MIN || hdelta > lazythumbs.FETCH_STEP_MIN) {
                    needs_loaded = true;
                }

                // Load new images when changing ratio
                if (Math.abs(old_ratio - new_ratio) > 0.1 && data(img, 'action') != 'resize') {
                    needs_loaded = true;
                }
            }

            if (needs_loaded) {
                url_template = data(img, 'urltemplate');
                url_template = url_template.replace('{{ action }}', data(img, 'action'));
                if (data(img, 'action') === 'thumbnail') {
                    url_template = url_template.replace('{{ dimensions }}', width);
                } else {
                    url_template = url_template.replace('{{ dimensions }}', width + '/' + height);
                }

                (function(existing_img) {
                    var new_image = new Image();
                    new_image.onload = function() {
                        existing_img.src = new_image.src;
                    }
                    new_image.src = url_template;
                })(img);

                data(img, 'ltwidth', width);
                data(img, 'ltheight', height);
            }
        }
    };

    bind_event('load', setup_responsive_images, false);
    function setup_responsive_images() {
        if (this.removeEventListener) {
            this.removeEventListener('load', arguments.callee);
        } else if (this.detachEvent) {
            this.detachEvent('onload', arguments.callee);
        }

        var r = update_responsive_images.apply(this, arguments);
        bind_event("resize", debounce(update_responsive_images, 500));
        return r;
    }

    /* Prevents execution of a function more than once per `wait` ms.
     *
     * Note:
     *   This is lifted directly from http://davidwalsh.name/function-debounce,
     *   which itself lifted this code from an earlier version of Underscore.js
     *
     * func         The function to debounce.
     * wait         The size of the window (in milliseconds) during which only
     *              the *last* call of `func` will be executed.
     * immediate    Instead of executing only the *last* call of `func` during
     *              the `wait` window, execute the *first* call, and drop all
     *              other executions during the window.
     */
    function debounce(func, wait, immediate) {
        var timeout;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
                if (!immediate) {
                    func.apply(context, args);
                }
            }
            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) {
                func.apply(context, args);
            }
        };
    };

    function scale_size(size, scale) {
        return {
            width: parseInt(size.width / scale),
            height: parseInt(size.height / scale)
        }
    }

    /* scale_from_step(size, step)
     *
     * size     {width, height} of the image.
     * step     the step size by which the image should grow.
     *
     * Using an image's size, calculate the coefficient that one would
     * need to multiply the existing image's size by in order to grow
     * an image by `step` pixels.
     */
    function scale_from_step(size, step) {
        var d = Math.min(size.width, size.height);
        return (d + step) / d;
    }

    function get_first_candidate(size, origsize, allow_undersized) {
        var height = origsize.height;
        var width = origsize.width;
        var ratio = size.width / size.height;

        // The largest size we would allow, in the ratio requested
        if(allow_undersized) {
            // Continually increase our candidate image's dimensions
            // until the candidate is larger than our requested size.
            // The remainder will be filled with a black background.

            var current = origsize;
            var multiplier = 1;
            var scale = scale_from_step(origsize, lazythumbs.FETCH_STEP_MIN);

            while(
                current.width < size.width || current.height < size.height
            ) {
                // Note: Must use the reciprocal of the actual scale to
                // *increase* the image's size rather than decrease.
                current = scale_size(current, 1/Math.pow(scale, multiplier));
                multiplier++;
            }

            height = current.height
            width = current.width
        }

        return {
            width: (
                size.width < size.height ? width : parseInt(height * ratio)
            ),
            height: (
                size.height < size.width ? height : parseInt(width / ratio)
            )
        };
    }

    function round_size_up(size, origsize, allow_undersized) {
        if (flipper.is_active("D-01463")) {
            return round_size_up_without_multiplier(size, origsize, allow_undersized);
        }
        return round_size_up_with_multiplier(size, origsize, allow_undersized);
    }

    /* round_size_up(size, origsize)
     *
     * size     {width, height} of the requested image size
     * origsize  {width, height} or the original image size
     *
     * Produces a {width, height} result that is at least `size`, and
     * rounded up by the step value so that multiple requests for similar
     * sizes can request the same, cached size.
     */
    function round_size_up_with_multiplier(size, origsize, allow_undersized) {
        var candidate = get_first_candidate(size, origsize, allow_undersized);
        var scale = scale_from_step(origsize, lazythumbs.FETCH_STEP_MIN);
        var current = candidate;
        var final_size = candidate;
        var multiplier = 1;

        // Overview:
        //   Starting from the image's current size, scale down in steps
        //   (using lazythumbs.FETCH_STEP_MIN) until we've found an image that
        //   is just barely *larger* than the size we need.
        while (current.width >= size.width && current.height >= size.height) {
            // We want to keep the size *right* *before* the last size we
            // encounter in this while loop; once the while loop breaks,
            // current will be *too* *small*, so let's save the previous value.
            final_size = current;
            // The one we're looking at is still larger, so step down
            current = scale_size(candidate, Math.pow(scale, multiplier));
            multiplier++;
        }
        return final_size;
    }

    function round_size_up_without_multiplier(size, origsize, allow_undersized) {
        var candidate = get_first_candidate(size, origsize, allow_undersized);
        var scale = scale_from_step(origsize, lazythumbs.FETCH_STEP_MIN);
        var current = candidate;

        while (current.width >= size.width && current.height >= size.height) {
            // with_multiplier's version ends up parseInt'ing the width and height
            // of the final return size (through the call to scale_size),
            // whereas this version ...
            // parseInt's the width and height of the size at each call
            // to scale_size.
            // This version is similar to the one in commit: d8c543 (lazythumbs repo)
            // before the next commit introduced the black matte borders in tease
            // images.
            candidate = current;
            current = scale_size(current, scale);
        }
        return candidate;
    }

    lazythumbs.scale_size = scale_size;
    lazythumbs.scale_from_step = scale_from_step;
    lazythumbs.round_size_up = round_size_up;

})(lazythumbs);
;
(function(e){function p(){var e=s();if(e!==o){o=e;r.trigger("orientationchange")}}function w(t,n,r,i){var s=r.type;r.type=n;e.event.dispatch.call(t,r,i);r.type=s}e.attrFn=e.attrFn||{};var t=navigator.userAgent.toLowerCase().indexOf("chrome")>-1&&(navigator.userAgent.toLowerCase().indexOf("windows")>-1||navigator.userAgent.toLowerCase().indexOf("macintosh")>-1||navigator.userAgent.toLowerCase().indexOf("linux")>-1);var n={swipe_h_threshold:50,swipe_v_threshold:50,taphold_threshold:750,doubletap_int:500,touch_capable:"ontouchstart"in document.documentElement&&!t,orientation_support:"orientation"in window&&"onorientationchange"in window,startevent:"ontouchstart"in document.documentElement&&!t?"touchstart":"mousedown",endevent:"ontouchstart"in document.documentElement&&!t?"touchend":"mouseup",moveevent:"ontouchstart"in document.documentElement&&!t?"touchmove":"mousemove",tapevent:"ontouchstart"in document.documentElement&&!t?"tap":"click",scrollevent:"ontouchstart"in document.documentElement&&!t?"touchmove":"scroll",hold_timer:null,tap_timer:null};e.each("tapstart tapend tap singletap doubletap taphold swipe swipeup swiperight swipedown swipeleft swipeend scrollstart scrollend orientationchange".split(" "),function(t,n){e.fn[n]=function(e){return e?this.bind(n,e):this.trigger(n)};e.attrFn[n]=true});e.event.special.tapstart={setup:function(){var t=this,r=e(t);r.bind(n.startevent,function(e){if(e.which&&e.which!==1){return false}else{var r=e.originalEvent;var i={position:{x:n.touch_capable?r.touches[0].screenX:e.screenX,y:n.touch_capable?r.touches[0].screenY:e.screenY},offset:{x:n.touch_capable?r.touches[0].pageX-r.touches[0].target.offsetLeft:e.offsetX,y:n.touch_capable?r.touches[0].pageY-r.touches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};w(t,"tapstart",e,i);return true}})}};e.event.special.tapend={setup:function(){var t=this,r=e(t);r.bind(n.endevent,function(e){var r=e.originalEvent;var i={position:{x:n.touch_capable?r.changedTouches[0].screenX:e.screenX,y:n.touch_capable?r.changedTouches[0].screenY:e.screenY},offset:{x:n.touch_capable?r.changedTouches[0].pageX-r.changedTouches[0].target.offsetLeft:e.offsetX,y:n.touch_capable?r.changedTouches[0].pageY-r.changedTouches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};w(t,"tapend",e,i);return true})}};e.event.special.taphold={setup:function(){var t=this,r=e(t),i,s,o={x:0,y:0};r.bind(n.startevent,function(e){if(e.which&&e.which!==1){return false}else{r.data("tapheld",false);i=e.target;var s=e.originalEvent;var u=(new Date).getTime(),a={x:n.touch_capable?s.touches[0].screenX:e.screenX,y:n.touch_capable?s.touches[0].screenY:e.screenY},f={x:n.touch_capable?s.touches[0].pageX-s.touches[0].target.offsetLeft:e.offsetX,y:n.touch_capable?s.touches[0].pageY-s.touches[0].target.offsetTop:e.offsetY};o.x=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageX:e.pageX;o.y=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageY:e.pageY;n.hold_timer=window.setTimeout(function(){var l=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageX:e.pageX,c=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageY:e.pageY;if(e.target==i&&o.x==l&&o.y==c){r.data("tapheld",true);var h=(new Date).getTime(),p={x:n.touch_capable?s.touches[0].screenX:e.screenX,y:n.touch_capable?s.touches[0].screenY:e.screenY},d={x:n.touch_capable?s.touches[0].pageX-s.touches[0].target.offsetLeft:e.offsetX,y:n.touch_capable?s.touches[0].pageY-s.touches[0].target.offsetTop:e.offsetY};duration=h-u;var v={startTime:u,endTime:h,startPosition:a,startOffset:f,endPosition:p,endOffset:d,duration:duration,target:e.target};w(t,"taphold",e,v)}},n.taphold_threshold);return true}}).bind(n.endevent,function(){r.data("tapheld",false);window.clearTimeout(n.hold_timer)})}};e.event.special.doubletap={setup:function(){var t=this,r=e(t),i,s,o;r.bind(n.startevent,function(e){if(e.which&&e.which!==1){return false}else{r.data("doubletapped",false);i=e.target;var t=e.originalEvent;o={position:{x:n.touch_capable?t.touches[0].screenX:e.screenX,y:n.touch_capable?t.touches[0].screenY:e.screenY},offset:{x:n.touch_capable?t.touches[0].pageX-t.touches[0].target.offsetLeft:e.offsetX,y:n.touch_capable?t.touches[0].pageY-t.touches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};return true}}).bind(n.endevent,function(e){var u=(new Date).getTime();var a=r.data("lastTouch")||u+1;var f=u-a;window.clearTimeout(s);if(f<n.doubletap_int&&f>0&&e.target==i&&f>100){r.data("doubletapped",true);window.clearTimeout(n.tap_timer);var l={position:{x:n.touch_capable?origEvent.touches[0].screenX:e.screenX,y:n.touch_capable?origEvent.touches[0].screenY:e.screenY},offset:{x:n.touch_capable?origEvent.touches[0].pageX-origEvent.touches[0].target.offsetLeft:e.offsetX,y:n.touch_capable?origEvent.touches[0].pageY-origEvent.touches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};var c={firstTap:o,secondTap:l,interval:l.time-o.time};w(t,"doubletap",e,c)}else{r.data("lastTouch",u);s=window.setTimeout(function(e){window.clearTimeout(s)},n.doubletap_int,[e])}r.data("lastTouch",u)})}};e.event.special.singletap={setup:function(){var t=this,r=e(t),i=null,s=null,o={x:0,y:0};r.bind(n.startevent,function(e){if(e.which&&e.which!==1){return false}else{s=(new Date).getTime();i=e.target;o.x=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageX:e.pageX;o.y=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageY:e.pageY;return true}}).bind(n.endevent,function(e){if(e.target==i){end_pos_x=e.originalEvent.changedTouches?e.originalEvent.changedTouches[0].pageX:e.pageX;end_pos_y=e.originalEvent.changedTouches?e.originalEvent.changedTouches[0].pageY:e.pageY;n.tap_timer=window.setTimeout(function(){if(!r.data("doubletapped")&&!r.data("tapheld")&&o.x==end_pos_x&&o.y==end_pos_y){var i=e.originalEvent;var s={position:{x:n.touch_capable?i.changedTouches[0].screenX:e.screenX,y:n.touch_capable?i.changedTouches[0].screenY:e.screenY},offset:{x:n.touch_capable?i.changedTouches[0].pageX-i.changedTouches[0].target.offsetLeft:e.offsetX,y:n.touch_capable?i.changedTouches[0].pageY-i.changedTouches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};w(t,"singletap",e,s)}},n.doubletap_int)}})}};e.event.special.tap={setup:function(){var t=this,r=e(t),i=false,s=null,o,u={x:0,y:0};r.bind(n.startevent,function(e){if(e.which&&e.which!==1){return false}else{i=true;u.x=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageX:e.pageX;u.y=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageY:e.pageY;o=(new Date).getTime();s=e.target;return true}}).bind(n.endevent,function(e){var r=e.originalEvent.targetTouches?e.originalEvent.changedTouches[0].pageX:e.pageX,a=e.originalEvent.targetTouches?e.originalEvent.changedTouches[0].pageY:e.pageY;if(s==e.target&&i&&(new Date).getTime()-o<n.taphold_threshold&&u.x==r&&u.y==a){var f=e.originalEvent;var l={position:{x:n.touch_capable?f.changedTouches[0].screenX:e.screenX,y:n.touch_capable?f.changedTouches[0].screenY:e.screenY},offset:{x:n.touch_capable?f.changedTouches[0].pageX-f.changedTouches[0].target.offsetLeft:e.offsetX,y:n.touch_capable?f.changedTouches[0].pageY-f.changedTouches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};w(t,"tap",e,l)}})}};e.event.special.swipe={setup:function(){function f(e){o.x=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageX:e.pageX;o.y=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageY:e.pageY;u.x=o.x;u.y=o.y;i=true;var t=e.originalEvent;a={position:{x:n.touch_capable?t.touches[0].screenX:e.screenX,y:n.touch_capable?t.touches[0].screenY:e.screenY},offset:{x:n.touch_capable?t.touches[0].pageX-t.touches[0].target.offsetLeft:e.offsetX,y:n.touch_capable?t.touches[0].pageY-t.touches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};var r=new Date;while(new Date-r<100){}}function l(e){u.x=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageX:e.pageX;u.y=e.originalEvent.targetTouches?e.originalEvent.targetTouches[0].pageY:e.pageY;window.clearTimeout(n.hold_timer);var t;var f=r.attr("data-xthreshold"),l=r.attr("data-ythreshold"),c=typeof f!=="undefined"&&f!==false&&parseInt(f)?parseInt(f):n.swipe_h_threshold,h=typeof l!=="undefined"&&l!==false&&parseInt(l)?parseInt(l):n.swipe_v_threshold;if(o.y>u.y&&o.y-u.y>h){t="swipeup"}if(o.x<u.x&&u.x-o.x>c){t="swiperight"}if(o.y<u.y&&u.y-o.y>h){t="swipedown"}if(o.x>u.x&&o.x-u.x>c){t="swipeleft"}if(t!=undefined&&i){o.x=0;o.y=0;u.x=0;u.y=0;i=false;var p=e.originalEvent;endEvnt={position:{x:n.touch_capable?p.touches[0].screenX:e.screenX,y:n.touch_capable?p.touches[0].screenY:e.screenY},offset:{x:n.touch_capable?p.touches[0].pageX-p.touches[0].target.offsetLeft:e.offsetX,y:n.touch_capable?p.touches[0].pageY-p.touches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};var d=Math.abs(a.position.x-endEvnt.position.x),v=Math.abs(a.position.y-endEvnt.position.y);var m={startEvnt:a,endEvnt:endEvnt,direction:t.replace("swipe",""),xAmount:d,yAmount:v,duration:endEvnt.time-a.time};s=true;r.trigger("swipe",m).trigger(t,m)}}function c(e){if(s){var t=r.attr("data-xthreshold"),o=r.attr("data-ythreshold"),u=typeof t!=="undefined"&&t!==false&&parseInt(t)?parseInt(t):n.swipe_h_threshold,f=typeof o!=="undefined"&&o!==false&&parseInt(o)?parseInt(o):n.swipe_v_threshold;var l=e.originalEvent;endEvnt={position:{x:n.touch_capable?l.changedTouches[0].screenX:e.screenX,y:n.touch_capable?l.changedTouches[0].screenY:e.screenY},offset:{x:n.touch_capable?l.changedTouches[0].pageX-l.changedTouches[0].target.offsetLeft:e.offsetX,y:n.touch_capable?l.changedTouches[0].pageY-l.changedTouches[0].target.offsetTop:e.offsetY},time:(new Date).getTime(),target:e.target};if(a.position.y>endEvnt.position.y&&a.position.y-endEvnt.position.y>f){swipedir="swipeup"}if(a.position.x<endEvnt.position.x&&endEvnt.position.x-a.position.x>u){swipedir="swiperight"}if(a.position.y<endEvnt.position.y&&endEvnt.position.y-a.position.y>f){swipedir="swipedown"}if(a.position.x>endEvnt.position.x&&a.position.x-endEvnt.position.x>u){swipedir="swipeleft"}var c=Math.abs(a.position.x-endEvnt.position.x),h=Math.abs(a.position.y-endEvnt.position.y);var p={startEvnt:a,endEvnt:endEvnt,direction:swipedir.replace("swipe",""),xAmount:c,yAmount:h,duration:endEvnt.time-a.time};r.trigger("swipeend",p)}i=false;s=false}var t=this,r=e(t),i=false,s=false,o={x:0,y:0},u={x:0,y:0},a;r.bind(n.startevent,f);r.bind(n.moveevent,l);r.bind(n.endevent,c)}};e.event.special.scrollstart={setup:function(){function o(e,n){i=n;w(t,i?"scrollstart":"scrollend",e)}var t=this,r=e(t),i,s;r.bind(n.scrollevent,function(e){if(!i){o(e,true)}clearTimeout(s);s=setTimeout(function(){o(e,false)},50)})}};var r=e(window),i,s,o,u,a,f={0:true,180:true};if(n.orientation_support){var l=window.innerWidth||e(window).width(),c=window.innerHeight||e(window).height(),h=50;u=l>c&&l-c>h;a=f[window.orientation];if(u&&a||!u&&!a){f={"-90":true,90:true}}}e.event.special.orientationchange=i={setup:function(){if(n.orientation_support){return false}o=s();r.bind("throttledresize",p);return true},teardown:function(){if(n.orientation_support){return false}r.unbind("throttledresize",p);return true},add:function(e){var t=e.handler;e.handler=function(e){e.orientation=s();return t.apply(this,arguments)}}};e.event.special.orientationchange.orientation=s=function(){var e=true,t=document.documentElement;if(n.orientation_support){e=f[window.orientation]}else{e=t&&t.clientWidth/t.clientHeight<1.1}return e?"portrait":"landscape"};e.event.special.throttledresize={setup:function(){e(this).bind("resize",v)},teardown:function(){e(this).unbind("resize",v)}};var d=250,v=function(){y=(new Date).getTime();b=y-m;if(b>=d){m=y;e(this).trigger("throttledresize")}else{if(g){window.clearTimeout(g)}g=window.setTimeout(p,d-b)}},m=0,g,y,b;e.each({scrollend:"scrollstart",swipeup:"swipe",swiperight:"swipe",swipedown:"swipe",swipeleft:"swipe",swipeend:"swipe"},function(t,n,r){e.event.special[t]={setup:function(){e(this).bind(n,e.noop)}}})})(jQuery);
;
/*! http://mths.be/placeholder v2.0.7 by @mathias */
;(function(f,h,$){var a='placeholder' in h.createElement('input'),d='placeholder' in h.createElement('textarea'),i=$.fn,c=$.valHooks,k,j;if(a&&d){j=i.placeholder=function(){return this};j.input=j.textarea=true}else{j=i.placeholder=function(){var l=this;l.filter((a?'textarea':':input')+'[placeholder]').not('.placeholder').bind({'focus.placeholder':b,'blur.placeholder':e}).data('placeholder-enabled',true).trigger('blur.placeholder');return l};j.input=a;j.textarea=d;k={get:function(m){var l=$(m);return l.data('placeholder-enabled')&&l.hasClass('placeholder')?'':m.value},set:function(m,n){var l=$(m);if(!l.data('placeholder-enabled')){return m.value=n}if(n==''){m.value=n;if(m!=h.activeElement){e.call(m)}}else{if(l.hasClass('placeholder')){b.call(m,true,n)||(m.value=n)}else{m.value=n}}return l}};a||(c.input=k);d||(c.textarea=k);$(function(){$(h).delegate('form','submit.placeholder',function(){var l=$('.placeholder',this).each(b);setTimeout(function(){l.each(e)},10)})});$(f).bind('beforeunload.placeholder',function(){$('.placeholder').each(function(){this.value=''})})}function g(m){var l={},n=/^jQuery\d+$/;$.each(m.attributes,function(p,o){if(o.specified&&!n.test(o.name)){l[o.name]=o.value}});return l}function b(m,n){var l=this,o=$(l);if(l.value==o.attr('placeholder')&&o.hasClass('placeholder')){if(o.data('placeholder-password')){o=o.hide().next().show().attr('id',o.removeAttr('id').data('placeholder-id'));if(m===true){return o[0].value=n}o.focus()}else{l.value='';o.removeClass('placeholder');l==h.activeElement&&l.select()}}}function e(){var q,l=this,p=$(l),m=p,o=this.id;if(l.value==''){if(l.type=='password'){if(!p.data('placeholder-textinput')){try{q=p.clone().attr({type:'text'})}catch(n){q=$('<input>').attr($.extend(g(this),{type:'text'}))}q.removeAttr('name').data({'placeholder-password':true,'placeholder-id':o}).bind('focus.placeholder',b);p.data({'placeholder-textinput':q,'placeholder-id':o}).before(q)}p=p.removeAttr('id').hide().prev().attr('id',o).show()}p.addClass('placeholder');p[0].value=p.attr('placeholder')}else{p.removeClass('placeholder')}}}(this,document,jQuery));;
/**
 * writeCapture.js v1.0.5
 *
 * @author noah <noah.sloan@gmail.com>
 *
 */
(function($,global) {
    var doc = global.document;
    function doEvil(code) {
        var div = doc.createElement('div');
        doc.body.insertBefore(div,null);
        $.replaceWith(div,'<script type="text/javascript">'+code+'</script>');
    }
    // ensure we have our support functions
    $ = $ || (function(jQuery) {
        /**
         * @name writeCaptureSupport
         *
         * The support functions writeCapture needs.
         */
        return {
            /**
             * Takes an options parameter that must support the following:
             * {
             *  url: url,
             *  type: 'GET', // all requests are GET
             *  dataType: "script", // it this is set to script, script tag injection is expected, otherwise, treat as plain text
             *  async: true/false, // local scripts are loaded synchronously by default
             *  success: callback(text,status), // must not pass a truthy 3rd parameter
             *  error: callback(xhr,status,error) // must pass truthy 3rd parameter to indicate error
             * }
             */
            ajax: jQuery.ajax,
            /**
             * @param {String Element} selector an Element or selector
             * @return {Element} the first element matching selector
             */
            $: function(s) { return jQuery(s)[0]; },
            /**
             * @param {String jQuery Element} selector the element to replace.
             * writeCapture only needs the first matched element to be replaced.
             * @param {String} content the content to replace
             * the matched element with. script tags must be evaluated/loaded
             * and executed if present.
             */
            replaceWith: function(selector,content) {
                // jQuery 1.4? has a bug in replaceWith so we can't use it directly
                var el = jQuery(selector)[0];
                var next = el.nextSibling, parent = el.parentNode;

                jQuery(el).remove();

                if ( next ) {
                    jQuery(next).before( content );
                } else {
                    jQuery(parent).append( content );
                }
            },

            onLoad: function(fn) {
                jQuery(fn);
            },
            copyAttrs: function(src,dest) {
                var el = jQuery(dest), attrs = src.attributes;
                for (var i = 0, len = attrs.length; i < len; i++) {
                    if(attrs[i] && attrs[i].value) {
                        try {
                            el.attr(attrs[i].name,attrs[i].value);
                        } catch(e) { }
                    }
                }
            }
        };
    })(cmg.query);

    $.copyAttrs = $.copyAttrs || function() {};
    $.onLoad = $.onLoad || function() {
        throw "error: autoAsync cannot be used without jQuery " +
            "or defining writeCaptureSupport.onLoad";
    };

    // utilities
    function each(array,fn) {
        for(var i =0, len = array.length; i < len; i++) {
            if( fn(array[i]) === false) return;
        }
    }
    function isFunction(o) {
        return Object.prototype.toString.call(o) === "[object Function]";
    }
    function isString(o) {
        return Object.prototype.toString.call(o) === "[object String]";
    }
    function slice(array,start,end) {
        return Array.prototype.slice.call(array,start || 0,end || array && array.length);
    }
    function any(array,fn) {
        var result = false;
        each(array,check);
        function check(it) {
            return !(result = fn(it));
        }
        return result;
    }
    function SubQ(parent) {
        this._queue = [];
        this._children = [];
        this._parent = parent;
        if(parent) parent._addChild(this);
    }
    SubQ.prototype = {
        _addChild: function(q) {
            this._children.push(q);
        },
        push: function (task) {
            this._queue.push(task);
            this._bubble('_doRun');
        },
        pause: function() {
            this._bubble('_doPause');
        },
        resume: function() {
            this._bubble('_doResume');
        },
        _bubble: function(name) {
            var root = this;
            while(!root[name]) {
                root = root._parent;
            }
            return root[name]();
        },
        _next: function() {
            if(any(this._children,runNext)) return true;
            function runNext(c) {
                return c._next();
            }
            var task = this._queue.shift();
            if(task) {
                task();
            }
            return !!task;
        }
    };
    /**
     * Provides a task queue for ensuring that scripts are run in order.
     *
     * The only public methods are push, pause and resume.
     */
    function Q(parent) {
        if(parent) {
            return new SubQ(parent);
        }
        SubQ.call(this);
        this.paused = 0;
    }
    Q.prototype = (function() {
        function f() {}
        f.prototype = SubQ.prototype;
        return new f();
    })();
    Q.prototype._doRun = function() {
        if(!this.running) {
            this.running = true;
            try {
                // just in case there is a bug, always resume
                // if paused is less than 1
                while(this.paused < 1 && this._next()){}
            } finally {
                this.running = false;
            }
        }
    };
    Q.prototype._doPause= function() {
        this.paused++;
    };
    Q.prototype._doResume = function() {
        this.paused--;
        this._doRun();
    };
    // TODO unit tests...
    function MockDocument() { }
    MockDocument.prototype = {
        _html: '',
        open: function( ) {
            this._opened = true;
            if(this._delegate) {
                this._delegate.open();
            }
        },
        write: function(s) {
            if(this._closed) return;
            this._written = true;
            if(this._delegate) {
                this._delegate.write(s);
            } else {
                this._html += s;
            }
        },
        writeln: function(s) {
            this.write(s + '\n');
        },
        close: function( ) {
            this._closed = true;
            if(this._delegate) {
                this._delegate.close();
            }
        },
        copyTo: function(d) {
            this._delegate = d;
            d.foobar = true;
            if(this._opened) {
                d.open();
            }
            if(this._written) {
                d.write(this._html);
            }
            if(this._closed) {
                d.close();
            }
        }
    };
    // test for IE 6/7 issue (issue 6) that prevents us from using call
    var canCall = (function() {
        var f = { f: doc.getElementById };
        try {
            f.f.call(doc,'abc');
            return true;
        } catch(e) {
            return false;
        }
    })();
    function unProxy(elements) {
        each(elements,function(it) {
            var real = doc.getElementById(it.id);
            if(!real) {
                logError('<proxyGetElementById - finish>',
                    'no element in writen markup with id ' + it.id);
                return;
            }

            each(it.el.childNodes,function(it) {
                real.appendChild(it);
            });

            if(real.contentWindow) {
                // TODO why is the setTimeout necessary?
                global.setTimeout(function() {
                    it.el.contentWindow.document.
                        copyTo(real.contentWindow.document);
                },1);
            }
            $.copyAttrs(it.el,real);
        });
    }
    function getOption(name,options) {
        if(options && options[name] === false) {
            return false;
        }
        return options && options[name] || self[name];
    }
    function capture(context,options) {
        var tempEls = [],
            proxy = getOption('proxyGetElementById',options),
            forceLast = getOption('forceLastScriptTag',options),
            writeOnGet = getOption('writeOnGetElementById',options),
            immediate = getOption('immediateWrites', options),
            state = {
                write: doc.write,
                writeln: doc.writeln,
                finish: function() {},
                out: ''
            };
        context.state = state;
        doc.write = immediate ? immediateWrite : replacementWrite;
        doc.writeln = immediate ? immediateWriteln : replacementWriteln;
        if(proxy || writeOnGet) {
            state.getEl = doc.getElementById;
            doc.getElementById = getEl;
            if(writeOnGet) {
                findEl = writeThenGet;
            } else {
                findEl = makeTemp;
                state.finish = function() {
                    unProxy(tempEls);
                };
            }
        }
        if(forceLast) {
            state.getByTag = doc.getElementsByTagName;
            doc.getElementsByTagName = function(name) {
                var result = slice(canCall ? state.getByTag.call(doc,name) :
                    state.getByTag(name));
                if(name === 'script') {
                    result.push( $.$(context.target) );
                }
                return result;
            };
            var f = state.finish;
            state.finish = function() {
                f();
                doc.getElementsByTagName = state.getByTag;
            };
        }
        function replacementWrite(s) {
            state.out +=  s;
        }
        function replacementWriteln(s) {
            state.out +=  s + '\n';
        }
        function immediateWrite(s) {
            var target = $.$(context.target);
            var div = doc.createElement('div');
            target.parentNode.insertBefore(div,target);
            $.replaceWith(div,sanitize(s));
        }
        function immediateWriteln(s) {
            var target = $.$(context.target);
            var div = doc.createElement('div');
            target.parentNode.insertBefore(div,target);
            $.replaceWith(div,sanitize(s) + '\n');
        }
        function makeTemp(id) {
            var t = doc.createElement('div');
            tempEls.push({id:id,el:t});
            // mock contentWindow in case it's supposed to be an iframe
            t.contentWindow = { document: new MockDocument() };
            return t;
        }
        function writeThenGet(id) {
            var target = $.$(context.target);
            var div = doc.createElement('div');
            target.parentNode.insertBefore(div,target);
            $.replaceWith(div,state.out);
            state.out = '';
            return canCall ? state.getEl.call(doc,id) :
                state.getEl(id);
        }
        function getEl(id) {
            var result = canCall ? state.getEl.call(doc,id) :
                state.getEl(id);
            return result || findEl(id);
        }
        return state;
    }
    function uncapture(state) {
        doc.write = state.write;
        doc.writeln = state.writeln;
        if(state.getEl) {
            doc.getElementById = state.getEl;
        }
        return state.out;
    }
    function clean(code) {
        // IE will execute inline scripts with <!-- (uncommented) on the first
        // line, but will not eval() them happily
        return code && code.replace(/^\s*<!(\[CDATA\[|--)/,'').replace(/(\]\]|--)>\s*$/,'');
    }
    function ignore() {}
    function doLog(code,error) {
        console.error("Error",error,"executing code:",code);
    }
    var logError = isFunction(global.console && console.error) ?
            doLog : ignore;
    function captureWrite(code,context,options) {
        var state = capture(context,options);
        try {
            doEvil(clean(code));
        } catch(e) {
            logError(code,e);
        } finally {
            uncapture(state);
        }
        return state;
    }
    // copied from jQuery
    function isXDomain(src) {
        var parts = /^(\w+:)?\/\/([^\/?#]+)/.exec(src);
        return parts && ( parts[1] && parts[1] != location.protocol || parts[2] != location.host );
    }
    function attrPattern(name) {
        return new RegExp('\\b'+name+'[\\s\\r\\n]*=[\\s\\r\\n]*(?:(["\'])([\\s\\S]*?)\\1|([^\\s>]+))','i');
    }
    function matchAttr(name) {
        var regex = attrPattern(name);
        return function(tag) {
            var match = regex.exec(tag) || [];
            return match[2] || match[3];
        };
    }

    var SCRIPT_TAGS = /(<script[^>]*>)([\s\S]*?)<\/script>/ig,
        SCRIPT_2 = /<script[^>]*\/>/ig,
        SRC_REGEX = attrPattern('src'),
        SRC_ATTR = matchAttr('src'),
        TYPE_ATTR = matchAttr('type'),
        LANG_ATTR = matchAttr('language'),
        GLOBAL = "__document_write_ajax_callbacks__",
        DIV_PREFIX = "__document_write_ajax_div-",
        TEMPLATE = "window['"+GLOBAL+"']['%d']();",
        callbacks = global[GLOBAL] = {},
        TEMPLATE_TAG = '<script type="text/javascript">' + TEMPLATE + '</script>',
        global_id = 0;
    function nextId() {
        return (++global_id).toString();
    }
    function normalizeOptions(options,callback) {
        var done;
        if(isFunction(options)) {
            done = options;
            options = null;
        }
        options = options || {};
        done = done || options && options.done;
        options.done = callback ? function() {
            callback(done);
        } : done;
        return options;
    }
    // The global Q synchronizes all sanitize operations.
    // The only time this synchronization is really necessary is when two or
    // more consecutive sanitize operations make async requests. e.g.,
    // sanitize call A requests foo, then sanitize B is called and bar is
    // requested. document.write was replaced by B, so if A returns first, the
    // content will be captured by B, then when B returns, document.write will
    // be the original document.write, probably messing up the page. At the
    // very least, A will get nothing and B will get the wrong content.
    var GLOBAL_Q = new Q();
    var debug = [];
    var logDebug = window._debugWriteCapture ? function() {} :
        function (type,src,data) {
            debug.push({type:type,src:src,data:data});
        };
    var logString = window._debugWriteCapture ? function() {} :
        function () {
            debug.push(arguments);
        };
    function newCallback(fn) {
        var id = nextId();
        callbacks[id] = function() {
            fn();
            delete callbacks[id];
        };
        return id;
    }
    function newCallbackTag(fn) {
        return TEMPLATE_TAG.replace(/%d/,newCallback(fn));
    }
    /**
     * Sanitize the given HTML so that the scripts will execute with a modified
     * document.write that will capture the output and append it in the
     * appropriate location.
     *
     * @param {String} html
     * @param {Object Function} [options]
     * @param {Function} [options.done] Called when all the scripts in the
     * sanitized HTML have run.
     * @param {boolean} [options.asyncAll] If true, scripts loaded from the
     * same domain will be loaded asynchronously. This can improve UI
     * responsiveness, but will delay completion of the scripts and may
     * cause problems with some scripts, so it defaults to false.
     */
    function sanitize(html,options,parentQ,parentContext) {
        // each HTML fragment has it's own queue
        var queue = parentQ && new Q(parentQ) || GLOBAL_Q;
        options = normalizeOptions(options);
        var done = getOption('done',options);
        var doneHtml = '';
        var fixUrls = getOption('fixUrls',options);
        if(!isFunction(fixUrls)) {
            fixUrls = function(src) { return src; };
        }
        // if a done callback is passed, append a script to call it
        if(isFunction(done)) {
            // no need to proxy the call to done, so we can append this to the
            // filtered HTML
            doneHtml = newCallbackTag(function() {
                queue.push(done);
            });
        }
        // for each tag, generate a function to load and eval the code and queue
        // themselves
        return html.replace(SCRIPT_TAGS,proxyTag).replace(SCRIPT_2,proxyBodyless) + doneHtml;
        function proxyBodyless(tag) {
            // hack in a bodyless tag...
            return proxyTag(tag,tag.substring(0,tag.length-2)+'>','');
        }
        function proxyTag(element,openTag,code) {
            var src = SRC_ATTR(openTag),
                type = TYPE_ATTR(openTag) || '',
                lang = LANG_ATTR(openTag) || '',
                isJs = (!type && !lang) || // no type or lang assumes JS
                    type.toLowerCase().indexOf('javascript') !== -1 ||
                    lang.toLowerCase().indexOf('javascript') !== -1;
            logDebug('replace',src,element);
            if(!isJs) {
                return element;
            }
            // RP06/7 hack
            // why? some scripts require an id'd script tag to target.
            // writecapture preserves this but jquery, which inserts the
            // writecapture tags, does not. so use raw dom to stick such
            // scripts in. this only came up for rich media ads in RP06/07
            // which have no physical placement in the page.
            var scriptid = matchAttr('id')(openTag);
            if (scriptid) {
                var script = document.createElement('script');
                script.id = scriptid;
                document.body.appendChild(script);
            }
            // end hack
            var id = newCallback(queueScript), divId = DIV_PREFIX + id,
                run, context = { target: '#' + divId, parent: parentContext };
            function queueScript() {
                queue.push(run);
            }
            if(src) {
                // fix for the inline script that writes a script tag with encoded
                // ampersands hack (more comon than you'd think)
                src = fixUrls(src);
                openTag = openTag.replace(SRC_REGEX, '');
                if(isXDomain(src)) {
                    // will load async via script tag injection (eval()'d on
                    // it's own)
                    run = loadXDomain;
                } else {
                    // can be loaded then eval()d
                    if(getOption('asyncAll',options)) {
                        run = loadAsync();
                    } else {
                        run = loadSync;
                    }
                }
            } else {
                // just eval code and be done
                run = runInline;
            }
            function runInline() {
                captureHtml(code);
            }
            function loadSync() {
                $.ajax({
                    url: src,
                    type: 'GET',
                    dataType: 'text',
                    async: false,
                    success: function(html) {
                        captureHtml(html);
                    }
                });
            }
            function logAjaxError(xhr,status,error) {
                logError("<XHR for "+src+">",error);
                queue.resume();
            }
            function setupResume() {
                // TODO: Remove this massive flush when we figure out why some wrap ads are failing
                return newCallbackTag(function() {
                    queue.resume();
                });
            }
            function loadAsync() {
                var ready, scriptText;
                function captureAndResume(script,status) {
                    if(!ready) {
                        // loaded before queue run, cache text
                        scriptText = script;
                        return;
                    }
                    try {
                        captureHtml(script, setupResume());
                    } catch(e) {
                        logError(script,e);
                    }
                }
                // start loading the text
                $.ajax({
                    url: src,
                    type: 'GET',
                    dataType: 'text',
                    async: true,
                    success: captureAndResume,
                    error: logAjaxError
                });
                return function() {
                    ready = true;
                    if(scriptText) {
                        // already loaded, so don't pause the queue and don't resume!
                        captureHtml(scriptText);
                    } else {
                        queue.pause();
                    }
                };
            }
            function loadXDomain(cb) {
                var state = capture(context,options);
                queue.pause(); // pause the queue while the script loads
                logDebug('pause',src);

                doXDomainLoad(context.target,src,captureAndResume);

                function captureAndResume(xhr,st,error) {
                    logDebug('out', src, state.out);
                    html(uncapture(state),
                        newCallbackTag(state.finish) + setupResume());
                    logDebug('resume',src);
                }
            }
            function captureHtml(script, cb) {
                var state = captureWrite(script,context,options);
                cb = newCallbackTag(state.finish) + (cb || '');
                html(state.out,cb);
            }
            function safeOpts(options) {
                var copy = {};
                for(var i in options) {
                    if(options.hasOwnProperty(i)) {
                        copy[i] = options[i];
                    }
                }
                delete copy.done;
                return copy;
            }
            function html(markup,cb) {
                $.replaceWith(context.target,sanitize(markup,safeOpts(options),queue,context) + (cb || ''));
            }
            return '<div style="display: none" id="'+divId+'"></div>' + openTag +
                TEMPLATE.replace(/%d/,id) + '</script>';
        }
    }

    function doXDomainLoad(target,url,success) {
        // TODO what about scripts that fail to load? bad url, etc.?
        var script = document.createElement("script");
        script.src = url;

        target = $.$(target);

        var done = false, parent = target.parentNode;

        // Attach handlers for all browsers
        script.onload = script.onreadystatechange = function(){
            if ( !done && (!this.readyState ||
                    this.readyState == "loaded" || this.readyState == "complete") ) {
                done = true;
                success();

                // Handle memory leak in IE
                script.onload = script.onreadystatechange = null;
                parent.removeChild( script );
            }
        };

        parent.insertBefore(script,target);
    }

    /**
     * Sanitizes all the given fragments and calls action with the HTML.
     * The next fragment is not started until the previous fragment
     * has executed completely.
     *
     * @param {Array} fragments array of objects like this:
     * {
     *   html: '<p>My html with a <script...',
     *   action: function(safeHtml,frag) { doSomethingToInject(safeHtml); },
     *   options: {} // optional, see #sanitize
     * }
     * Where frag is the object.
     *
     * @param {Function} [done] Optional. Called when all fragments are done.
     */
    function sanitizeSerial(fragments,done) {
        // create a queue for these fragments and make it the parent of each
        // sanitize call
        var queue = GLOBAL_Q;
        each(fragments, function (f) {
            queue.push(run);
            function run() {
                f.action(sanitize(f.html,f.options,queue),f);
            }
        });
        if(done) {
            queue.push(done);
        }
    }
    function findLastChild(el) {
        var n = el;
        while(n && n.nodeType === 1) {
            el = n;
            n = n.lastChild;
            // last child may not be an element
            while(n && n.nodeType !== 1) {
                n = n.previousSibling;
            }
        }
        return el;
    }
    /**
      * Experimental - automatically captures document.write calls and
      * defers them untill after page load.
      * @param {Function} [done] optional callback for when all the
      * captured content has been loaded.
      */
    function autoCapture(done) {
        var write = doc.write,
            writeln = doc.writeln,
            currentScript,
            autoQ = [];
        doc.writeln = function(s) {
            doc.write(s+'\n');
        };
        var state;
        doc.write = function(s) {
            var scriptEl = findLastChild(doc.body);
            if(scriptEl !== currentScript) {
                currentScript = scriptEl;
                autoQ.push(state = {
                    el: scriptEl,
                    out: []
                });
            }
            state.out.push(s);
        };
        $.onLoad(function() {
            // for each script, append a div immediately after it,
            // then replace the div with the sanitized output
            var el, div, out, safe, doneFn;
            done = normalizeOptions(done);
            doneFn = done.done;
            done.done = function() {
                doc.write = write;
                doc.writeln = writeln;
                if(doneFn) doneFn();
            };
            for(var i = 0, len = autoQ.length; i < len; i++ ) {
                el = autoQ[i].el;
                div = doc.createElement('div');
                el.parentNode.insertBefore( div, el.nextSibling );
                out = autoQ[i].out.join('');
                // only the last snippet gets passed the callback
                safe = len - i === 1 ? sanitize(out,done) : sanitize(out);
                $.replaceWith(div,safe);
            }
        });
    }

    function extsrc(cb) {
        var scripts = document.getElementsByTagName('script'),
            s,o, html, q, ext, async, doneCount = 0,
            done = cb ? newCallbackTag(function() {
                if(++doneCount >= exts.length) {
                    cb();
                }
            }) : '',
            exts = [];

        for(var i = 0, len = scripts.length; i < len; i++) {
            s = scripts[i];
            ext = s.getAttribute('extsrc');
            async = s.getAttribute('asyncsrc');
            if(ext || async) {
                exts.push({ext:ext,async:async,s:s});
            }
        }

        for(i = 0, len = exts.length; i < len; i++) {
            o = exts[i];
            if(o.ext) {
                html = '<script type="text/javascript" src="'+o.ext+'"> </script>';
                $.replaceWith(o.s,sanitize(html) + done);
            } else if(o.async) {
                html = '<script type="text/javascript" src="'+o.async+'"> </script>';
                $.replaceWith(o.s,sanitize(html,{asyncAll:true}, new Q()) + done);
            }
        }
    }

    var name = 'writeCapture';
    var self = global[name] = {
        _original: global[name],
        support: $,
        /**
         */
        fixUrls: function(src) {
            return src.replace(/&amp;/g,'&');
        },
        noConflict: function() {
            global[name] = this._original;
            return this;
        },
        debug: debug,
        /**
         * Enables a fun little hack that replaces document.getElementById and
         * creates temporary elements for the calling code to use.
         */
        proxyGetElementById: false,
        // this is only for testing, please don't use these
        _forTest: {
            Q: Q,
            GLOBAL_Q: GLOBAL_Q,
            $: $,
            matchAttr: matchAttr,
            slice: slice,
            capture: capture,
            uncapture: uncapture,
            captureWrite: captureWrite
        },
        replaceWith: function(selector,content,options) {
            $.replaceWith(selector,sanitize(content,options));
        },
        html: function(selector,content,options) {
            var el = $.$(selector);
            el.innerHTML ='<span/>';
            $.replaceWith(el.firstChild,sanitize(content,options));
        },
        load: function(selector,url,options) {
            $.ajax({
                url: url,
                dataType: 'text',
                type: "GET",
                success: function(content) {
                    self.html(selector,content,options);
                }
            });
        },
        extsrc: extsrc,
        autoAsync: autoCapture,
        sanitize: sanitize,
        sanitizeSerial: sanitizeSerial
    };
})(this.writeCaptureSupport,this);
;
/**
 * jquery.writeCapture.js
 *
 * Note that this file only provides the jQuery plugin functionality, you still
 * need writeCapture.js. The compressed version will contain both as as single
 * file.
 *
 * @author noah <noah.sloan@gmail.com>
 *
 */
(function($,wc,noop) {
    // methods that take HTML content (according to API)
    var methods = {
        html: html
    };
    // TODO wrap domManip instead?
    cmg.query.each(['append', 'prepend', 'after', 'before', 'wrap', 'wrapAll', 'replaceWith',
        'wrapInner'],function() { methods[this] = makeMethod(this); });
    function isString(s) {
        return Object.prototype.toString.call(s) == "[object String]";
    }
    function executeMethod(method,content,options,cb) {
        if(arguments.length == 0) return proxyMethods.call(this);
        var m = methods[method];
        if(method == 'load') {
            return load.call(this,content,options,cb);
        }
        if(!m) error(method);
        return doEach.call(this,content,options,m);
    }
    cmg.query.fn.writeCapture = executeMethod;
    var PROXIED = '__writeCaptureJsProxied-fghebd__';
    // inherit from the jQuery instance, proxying the HTML injection methods
    // so that the HTML is sanitized
    function proxyMethods() {
        if(this[PROXIED]) return this;
        var jq = this;
        function F() {
            var _this = this, sanitizing = false;
            this[PROXIED] = true;
            cmg.query.each(methods,function(method) {
                var _super = jq[method];
                if(!_super) return;
                _this[method] = function(content,options,cb) {
                    // if it's unsanitized HTML, proxy it
                    if(!sanitizing && isString(content)) {
                        try {
                            sanitizing = true;
                            return executeMethod.call(_this,method,content,
                                options,cb);
                        } finally {
                            sanitizing = false;
                        }
                    }
                    return _super.apply(_this,arguments); // else delegate
                };
            });
            // wrap pushStack so that the new jQuery instance is also wrapped
            this.pushStack = function() {
                return proxyMethods.call(jq.pushStack.apply(_this,arguments));
            };
            this.endCapture = function() { return jq; };
        }
        F.prototype = jq;
        return new F();
    }
    function doEach(content,options,action) {
        var done, self = this;
        if(options && options.done) {
            done = options.done;
            delete options.done;
        } else if(cmg.query.isFunction(options)) {
            done = options;
            options = null;
        }
        wc.sanitizeSerial(cmg.query.map(this,function(el) {
            return {
                html: content,
                options: options,
                action: function(text) {
                    action.call(el,text);
                }
            };
        }),done && function() { done.call(self); } || done);
        return this;
    }
    function html(safe) {
        cmg.query(this).html(safe);
    }
    function makeMethod(method) {
        return function(safe) {
            cmg.query(this)[method](safe);
        };
    }
    function load(url,options,callback) {
        var self = this,  selector, off = url.indexOf(' ');
        if ( off >= 0 ) {
            selector = url.slice(off, url.length);
            url = url.slice(0, off);
        }
        if(cmg.query.isFunction(callback)) {
            options = options || {};
            options.done = callback;
        }
        return cmg.query.ajax({
            url: url,
            type:  options && options.type || "GET",
            dataType: "html",
            data: options && options.params,
            complete: loadCallback(self,options,selector)
        });
    }
    function loadCallback(self,options,selector) {
        return function(res,status) {
            if ( status == "success" || status == "notmodified" ) {
                var text = getText(res.responseText,selector);
                doEach.call(self,text,options,html);
            }
        };
    }
    var PLACEHOLDER = /jquery-writeCapture-script-placeholder-(\d+)-wc/g;
    function getText(text,selector) {
        if(!selector || !text) return text;
        var id = 0, scripts = {};
        return cmg.query('<div/>').append(
            text.replace(/<script(.|\s)*?\/script>/g, function(s) {
                scripts[id] = s;
                return "jquery-writeCapture-script-placeholder-"+(id++)+'-wc';
            })
        ).find(selector).html().replace(PLACEHOLDER,function(all,id) {
            return scripts[id];
        });
    }
    function error(method) {
        throw "invalid method parameter "+method;
    }
    // expose core
    $.writeCapture = wc;
})(cmg.query,writeCapture.noConflict());
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
/* ===================================================
 * bootstrap-transition.js v2.1.0
 * http://twitter.github.com/bootstrap/javascript.html#transitions
 * ===================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

  $(function () {

    "use strict"; // jshint ;_;


    /* CSS TRANSITION SUPPORT (http://www.modernizr.com/)
     * ======================================================= */

    $.support.transition = (function () {

      var transitionEnd = (function () {

        var el = document.createElement('bootstrap')
          , transEndEventNames = {
               'WebkitTransition' : 'webkitTransitionEnd'
            ,  'MozTransition'    : 'transitionend'
            ,  'OTransition'      : 'oTransitionEnd otransitionend'
            ,  'transition'       : 'transitionend'
            }
          , name

        for (name in transEndEventNames){
          if (el.style[name] !== undefined) {
            return transEndEventNames[name]
          }
        }

      }())

      return transitionEnd && {
        end: transitionEnd
      }

    })()

  })

}(window.jQuery);;
/* ===========================================================
 * bootstrap-modalmanager.js v2.1
 * ===========================================================
 * Copyright 2012 Jordan Schroter.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */

!function ($) {

    "use strict"; // jshint ;_;

    /* MODAL MANAGER CLASS DEFINITION
    * ====================== */

    var ModalManager = function (element, options) {
        this.init(element, options);
    };

    ModalManager.prototype = {

        constructor: ModalManager,

        init: function (element, options) {
            this.$element = $(element);
            this.options = $.extend({}, $.fn.modalmanager.defaults, this.$element.data(), typeof options == 'object' && options);
            this.stack = [];
            this.backdropCount = 0;

            if (this.options.resize) {
                var resizeTimeout,
                    that = this;

                $(window).on('resize.modal', function(){
                    resizeTimeout && clearTimeout(resizeTimeout);
                    resizeTimeout = setTimeout(function(){
                        for (var i = 0; i < that.stack.length; i++){
                            that.stack[i].isShown && that.stack[i].layout();
                        }
                    }, 10);
                });
            }
        },

        createModal: function (element, options) {
            $(element).modal($.extend({ manager: this }, options));
        },

        appendModal: function (modal) {
            this.stack.push(modal);

            var that = this;

            modal.$element.on('show.modalmanager', targetIsSelf(function (e) {

                var showModal = function(){
                    modal.isShown = true;

                    var transition = $.support.transition && modal.$element.hasClass('fade');

                    that.$element.parent() // Target html instead
                        .toggleClass('modal-open', that.hasOpenModal())
                        .toggleClass('page-overflow', $(window).height() < that.$element.height());

                    modal.$parent = modal.$element.parent();

                    modal.$container = that.createContainer(modal);

                    modal.$element.appendTo(modal.$container);

                    that.backdrop(modal, function () {

                        modal.$element.show();

                        if (transition) {
                            //modal.$element[0].style.display = 'run-in';
                            modal.$element[0].offsetWidth;
                            //modal.$element.one($.support.transition.end, function () { modal.$element[0].style.display = 'block' });
                        }

                        modal.layout();

                        modal.$element
                            .addClass('in')
                            .attr('aria-hidden', false);

                        var complete = function () {
                            that.setFocus();
                            modal.$element.trigger('shown');
                        };

                        transition ?
                            modal.$element.one($.support.transition.end, complete) :
                            complete();
                    });
                };

                modal.options.replace ?
                    that.replace(showModal) :
                    showModal();
            }));

            modal.$element.on('hidden.modalmanager', targetIsSelf(function (e) {

                that.backdrop(modal);

                if (modal.$backdrop){
                    $.support.transition && modal.$element.hasClass('fade') ?
                        modal.$backdrop.one($.support.transition.end, function () { that.destroyModal(modal) }) :
                        that.destroyModal(modal);
                } else {
                    that.destroyModal(modal);
                }

            }));

            modal.$element.on('destroy.modalmanager', targetIsSelf(function (e) {
                that.removeModal(modal);
            }));

        },

        destroyModal: function (modal) {

            modal.destroy();

            var hasOpenModal = this.hasOpenModal();

            this.$element.parent().toggleClass('modal-open', hasOpenModal);

            if (!hasOpenModal){
                this.$element.parent().removeClass('page-overflow');
            }

            this.removeContainer(modal);

            this.setFocus();
        },

        hasOpenModal: function () {
            for (var i = 0; i < this.stack.length; i++){
                if (this.stack[i].isShown) return true;
            }

            return false;
        },

        setFocus: function () {
            var topModal;

            for (var i = 0; i < this.stack.length; i++){
                if (this.stack[i].isShown) topModal = this.stack[i];
            }

            if (!topModal) return;

            topModal.focus();

        },

        removeModal: function (modal) {
            modal.$element.off('.modalmanager');
            if (modal.$backdrop) this.removeBackdrop.call(modal);
            this.stack.splice(this.getIndexOfModal(modal), 1);
        },

        getModalAt: function (index) {
            return this.stack[index];
        },

        getIndexOfModal: function (modal) {
            for (var i = 0; i < this.stack.length; i++){
                if (modal === this.stack[i]) return i;
            }
        },

        replace: function (callback) {
            var topModal;

            for (var i = 0; i < this.stack.length; i++){
                if (this.stack[i].isShown) topModal = this.stack[i];
            }

            if (topModal) {
                this.$backdropHandle = topModal.$backdrop;
                topModal.$backdrop = null;

                callback && topModal.$element.one('hidden',
                    targetIsSelf( $.proxy(callback, this) ));

                topModal.hide();
            } else if (callback) {
                callback();
            }
        },

        removeBackdrop: function (modal) {
            modal.$backdrop.remove();
            modal.$backdrop = null;
        },

        createBackdrop: function (animate) {
            var $backdrop;

            if (!this.$backdropHandle) {
                $backdrop = $('<div class="modal-backdrop ' + animate + '" />')
                    .appendTo(this.$element);
            } else {
                $backdrop = this.$backdropHandle;
                $backdrop.off('.modalmanager');
                this.$backdropHandle = null;
                this.isLoading && this.removeSpinner();
            }

            return $backdrop
        },

        removeContainer: function (modal) {
            modal.$container.remove();
            modal.$container = null;
        },

        createContainer: function (modal) {
            var $container;

            $container = $('<div class="modal-scrollable">')
                .css('z-index', getzIndex( 'modal',
                    modal ? this.getIndexOfModal(modal) : this.stack.length ))
                .appendTo(this.$element);

            if (modal && modal.options.backdrop != 'static') {
                $container.on('click.modal', targetIsSelf(function (e) {
                    modal.hide();
                }));
            } else if (modal) {
                $container.on('click.modal', targetIsSelf(function (e) {
                    modal.attention();
                }));
            }

            return $container;

        },

        backdrop: function (modal, callback) {
            var animate = modal.$element.hasClass('fade') ? 'fade' : '',
                showBackdrop = modal.options.backdrop &&
                    this.backdropCount < this.options.backdropLimit;

            if (modal.isShown && showBackdrop) {
                var doAnimate = $.support.transition && animate && !this.$backdropHandle;

                modal.$backdrop = this.createBackdrop(animate);

                modal.$backdrop.css('z-index', getzIndex( 'backdrop', this.getIndexOfModal(modal) ));

                if (doAnimate) modal.$backdrop[0].offsetWidth; // force reflow

                modal.$backdrop.addClass('in');

                this.backdropCount += 1;

                doAnimate ?
                    modal.$backdrop.one($.support.transition.end, callback) :
                    callback();

            } else if (!modal.isShown && modal.$backdrop) {
                modal.$backdrop.removeClass('in');

                this.backdropCount -= 1;

                var that = this;

                $.support.transition && modal.$element.hasClass('fade')?
                    modal.$backdrop.one($.support.transition.end, function () { that.removeBackdrop(modal) }) :
                    that.removeBackdrop(modal);

            } else if (callback) {
                callback();
            }
        },

        removeSpinner: function(){
            this.$spinner && this.$spinner.remove();
            this.$spinner = null;
            this.isLoading = false;
        },

        removeLoading: function () {
            this.$backdropHandle && this.$backdropHandle.remove();
            this.$backdropHandle = null;
            this.removeSpinner();
        },

        loading: function (callback) {
            callback = callback || function () { };

            this.$element.parent() // Target html instead
                .toggleClass('modal-open', !this.isLoading || this.hasOpenModal())
                .toggleClass('page-overflow', $(window).height() < this.$element.height());

            if (!this.isLoading) {

                this.$backdropHandle = this.createBackdrop('fade');

                this.$backdropHandle[0].offsetWidth; // force reflow

                this.$backdropHandle
                    .css('z-index', getzIndex('backdrop', this.stack.length))
                    .addClass('in');

                var $spinner = $(this.options.spinner)
                    .css('z-index', getzIndex('modal', this.stack.length))
                    .appendTo(this.$element)
                    .addClass('in');

                this.$spinner = $(this.createContainer())
                    .append($spinner)
                    .on('click.modalmanager', $.proxy(this.loading, this));

                this.isLoading = true;

                $.support.transition ?
                    this.$backdropHandle.one($.support.transition.end, callback) :
                    callback();

            } else if (this.isLoading && this.$backdropHandle) {
                this.$backdropHandle.removeClass('in');

                var that = this;
                $.support.transition ?
                    this.$backdropHandle.one($.support.transition.end, function () { that.removeLoading() }) :
                    that.removeLoading();

            } else if (callback) {
                callback(this.isLoading);
            }
        }
    };

    /* PRIVATE METHODS
    * ======================= */

    // computes and caches the zindexes
    var getzIndex = (function () {
        var zIndexFactor,
            baseIndex = {};

        return function (type, pos) {

            if (typeof zIndexFactor === 'undefined'){
                var $baseModal = $('<div class="modal hide" />').appendTo('body'),
                    $baseBackdrop = $('<div class="modal-backdrop hide" />').appendTo('body');

                baseIndex['modal'] = +$baseModal.css('z-index');
                baseIndex['backdrop'] = +$baseBackdrop.css('z-index');
                zIndexFactor = baseIndex['modal'] - baseIndex['backdrop'];

                $baseModal.remove();
                $baseBackdrop.remove();
                $baseBackdrop = $baseModal = null;
            }

            return baseIndex[type] + (zIndexFactor * pos);

        }
    }());

    // make sure the event target is the modal itself in order to prevent
    // other components such as tabsfrom triggering the modal manager.
    // if Boostsrap namespaced events, this would not be needed.
    function targetIsSelf(callback){
        return function (e) {
            if (this === e.target){
                return callback.apply(this, arguments);
            }
        }
    }


    /* MODAL MANAGER PLUGIN DEFINITION
    * ======================= */

    $.fn.modalmanager = function (option, args) {
        return this.each(function () {
            var $this = $(this),
                data = $this.data('modalmanager');

            if (!data) $this.data('modalmanager', (data = new ModalManager(this, option)));
            if (typeof option === 'string') data[option].apply(data, [].concat(args))
        })
    };

    $.fn.modalmanager.defaults = {
        backdropLimit: 999,
        resize: true,
        spinner: '<div class="loading-spinner fade" style="width: 200px; margin-left: -100px;"><div class="progress progress-striped active"><div class="bar" style="width: 100%;"></div></div></div>'
    };

    $.fn.modalmanager.Constructor = ModalManager

}(jQuery);
;
/* ===========================================================
 * bootstrap-modal.js v2.1
 * ===========================================================
 * Copyright 2012 Jordan Schroter
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

    "use strict"; // jshint ;_;

    /* MODAL CLASS DEFINITION
    * ====================== */

    var Modal = function (element, options) {
        this.init(element, options);
    };

    Modal.prototype = {

        constructor: Modal,

        init: function (element, options) {
            this.options = options;

            this.$element = $(element)
                .delegate('[data-dismiss="modal"]', 'click.dismiss.modal', $.proxy(this.hide, this));

            this.options.remote && this.$element.find('.modal-body').load(this.options.remote);

            var manager = typeof this.options.manager === 'function' ?
                this.options.manager.call(this) : this.options.manager;

            manager = manager.appendModal ?
                manager : $(manager).modalmanager().data('modalmanager');

            manager.appendModal(this);
        },

        toggle: function () {
            return this[!this.isShown ? 'show' : 'hide']();
        },

        show: function () {
            var e = $.Event('show');

            if (this.isShown) return;

            this.$element.trigger(e);

            if (e.isDefaultPrevented()) return;

            this.escape();

            this.tab();

            this.options.loading && this.loading();
        },

        hide: function (e) {
            e && e.preventDefault();

            e = $.Event('hide');

            this.$element.trigger(e);

            if (!this.isShown || e.isDefaultPrevented()) return (this.isShown = false);

            this.isShown = false;

            this.escape();

            this.tab();

            this.isLoading && this.loading();

            $(document).off('focusin.modal');

            this.$element
                .removeClass('in')
                .removeClass('animated')
                .removeClass(this.options.attentionAnimation)
                .removeClass('modal-overflow')
                .attr('aria-hidden', true);

            $.support.transition && this.$element.hasClass('fade') ?
                this.hideWithTransition() :
                this.hideModal();
        },

        layout: function () {
            var prop = this.options.height ? 'height' : 'max-height',
                value = this.options.height || this.options.maxHeight;

            if (this.options.width){
                this.$element.css('width', this.options.width);

                var that = this;
                this.$element.css('margin-left', function () {
                    if (/%/ig.test(that.options.width)){
                        return -(parseInt(that.options.width) / 2) + '%';
                    } else {
                        return -($(this).width() / 2) + 'px';
                    }
                });
            } else {
                this.$element.css('width', '');
                this.$element.css('margin-left', '');
            }

            this.$element.find('.modal-body')
                .css('overflow', '')
                .css(prop, '');

            var modalOverflow = $(window).height() - 10 < this.$element.height();

            if (value){
                this.$element.find('.modal-body')
                    .css('overflow', 'auto')
                    .css(prop, value);
            }

            if (modalOverflow || this.options.modalOverflow) {
                this.$element
                    .css('margin-top', 0)
                    .addClass('modal-overflow');
            } else {
                this.$element
                    .css('margin-top', 0 - this.$element.height() / 2)
                    .removeClass('modal-overflow');
            }
        },

        tab: function () {
            var that = this;

            if (this.isShown && this.options.consumeTab) {
                this.$element.on('keydown.tabindex.modal', '[data-tabindex]', function (e) {
                    if (e.keyCode && e.keyCode == 9){
                        var $next = $(this),
                            $rollover = $(this);

                        that.$element.find('[data-tabindex]:enabled:not([readonly])').each(function (e) {
                            if (!e.shiftKey){
                                $next = $next.data('tabindex') < $(this).data('tabindex') ?
                                    $next = $(this) :
                                    $rollover = $(this);
                            } else {
                                $next = $next.data('tabindex') > $(this).data('tabindex') ?
                                    $next = $(this) :
                                    $rollover = $(this);
                            }
                        });

                        $next[0] !== $(this)[0] ?
                            $next.focus() : $rollover.focus();

                        e.preventDefault();
                    }
                });
            } else if (!this.isShown) {
                this.$element.off('keydown.tabindex.modal');
            }
        },

        escape: function () {
            var that = this;
            if (this.isShown && this.options.keyboard) {
                if (!this.$element.attr('tabindex')) this.$element.attr('tabindex', -1);

                this.$element.on('keyup.dismiss.modal', function (e) {
                    e.which == 27 && that.hide();
                });
            } else if (!this.isShown) {
                this.$element.off('keyup.dismiss.modal')
            }
        },

        hideWithTransition: function () {
            var that = this
                , timeout = setTimeout(function () {
                    that.$element.off($.support.transition.end);
                    that.hideModal();
                }, 500);

            this.$element.one($.support.transition.end, function () {
                clearTimeout(timeout);
                that.hideModal();
            });
        },

        hideModal: function () {
            this.$element
                .hide()
                .trigger('hidden');

            var prop = this.options.height ? 'height' : 'max-height';
            var value = this.options.height || this.options.maxHeight;

            if (value){
                this.$element.find('.modal-body')
                    .css('overflow', '')
                    .css(prop, '');
            }

        },

        removeLoading: function () {
            this.$loading.remove();
            this.$loading = null;
            this.isLoading = false;
        },

        loading: function (callback) {
            callback = callback || function () {};

            var animate = this.$element.hasClass('fade') ? 'fade' : '';

            if (!this.isLoading) {
                var doAnimate = $.support.transition && animate;

                this.$loading = $('<div class="loading-mask ' + animate + '">')
                    .append(this.options.spinner)
                    .appendTo(this.$element);

                if (doAnimate) this.$loading[0].offsetWidth; // force reflow

                this.$loading.addClass('in');

                this.isLoading = true;

                doAnimate ?
                    this.$loading.one($.support.transition.end, callback) :
                    callback();

            } else if (this.isLoading && this.$loading) {
                this.$loading.removeClass('in');

                var that = this;
                $.support.transition && this.$element.hasClass('fade')?
                    this.$loading.one($.support.transition.end, function () { that.removeLoading() }) :
                    that.removeLoading();

            } else if (callback) {
                callback(this.isLoading);
            }
        },

        focus: function () {
            var $focusElem = this.$element.find(this.options.focusOn);

            $focusElem = $focusElem.length ? $focusElem : this.$element;

            $focusElem.focus();
        },

        attention: function (){
            // NOTE: transitionEnd with keyframes causes odd behaviour

            if (this.options.attentionAnimation){
                this.$element
                    .removeClass('animated')
                    .removeClass(this.options.attentionAnimation);

                var that = this;

                setTimeout(function () {
                    that.$element
                        .addClass('animated')
                        .addClass(that.options.attentionAnimation);
                }, 0);
            }


            this.focus();
        },


        destroy: function () {
            var e = $.Event('destroy');
            this.$element.trigger(e);
            if (e.isDefaultPrevented()) return;

            this.teardown();
        },

        teardown: function () {
            if (!this.$parent.length){
                this.$element.remove();
                this.$element = null;
                return;
            }

            if (this.$parent !== this.$element.parent()){
                this.$element.appendTo(this.$parent);
            }

            this.$element.off('.modal');
            this.$element.removeData('modal');
            this.$element
                .removeClass('in')
                .attr('aria-hidden', true);
        }
    };


    /* MODAL PLUGIN DEFINITION
    * ======================= */

    $.fn.modal = function (option, args) {
        return this.each(function () {
            var $this = $(this),
                data = $this.data('modal'),
                options = $.extend({}, $.fn.modal.defaults, $this.data(), typeof option == 'object' && option);

            if (!data) $this.data('modal', (data = new Modal(this, options)));
            if (typeof option == 'string') data[option].apply(data, [].concat(args));
            else if (options.show) data.show()
        })
    };

    $.fn.modal.defaults = {
        keyboard: true,
        backdrop: true,
        loading: false,
        show: true,
        width: null,
        height: null,
        maxHeight: null,
        modalOverflow: false,
        consumeTab: true,
        focusOn: null,
        replace: false,
        resize: false,
        attentionAnimation: 'shake',
        manager: 'body',
        spinner: '<div class="loading-spinner" style="width: 200px; margin-left: -100px;"><div class="progress progress-striped active"><div class="bar" style="width: 100%;"></div></div></div>'
    };

    $.fn.modal.Constructor = Modal;


    /* MODAL DATA-API
    * ============== */

    $(function () {
        $(document).off('click.modal').on('click.modal.data-api', '[data-toggle="modal"]', function ( e ) {
            var $this = $(this),
                href = $this.attr('href'),
                $target = $($this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, ''))), //strip for ie7
                option = $target.data('modal') ? 'toggle' : $.extend({ remote: !/#/.test(href) && href }, $target.data(), $this.data());

            e.preventDefault();
            $target
                .modal(option)
                .one('hide', function () {
                    $this.focus();
                })
        });
    });

}(window.jQuery);
;
/* ============================================================
 * bootstrap-dropdown.js v2.1.0
 * http://twitter.github.com/bootstrap/javascript.html#dropdowns
 * ============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


!function ($) {

  "use strict"; // jshint ;_;


 /* DROPDOWN CLASS DEFINITION
  * ========================= */

  var toggle = '[data-toggle=dropdown]'
    , Dropdown = function (element) {
        var $el = $(element).on('click.dropdown.data-api', this.toggle)
        $('html').on('click.dropdown.data-api', function () {
          $el.parent().removeClass('open')
        })
      }

  Dropdown.prototype = {

    constructor: Dropdown

  , toggle: function (e) {
      var $this = $(this)
        , $parent
        , isActive

      if ($this.is('.disabled, :disabled')) return

      $parent = getParent($this)

      isActive = $parent.hasClass('open')

      clearMenus()

      if (!isActive) {
        $parent.toggleClass('open')
        $this.focus()
      }

      return false
    }

  , keydown: function (e) {
      var $this
        , $items
        , $active
        , $parent
        , isActive
        , index

      if (!/(38|40|27)/.test(e.keyCode)) return

      $this = $(this)

      e.preventDefault()
      e.stopPropagation()

      if ($this.is('.disabled, :disabled')) return

      $parent = getParent($this)

      isActive = $parent.hasClass('open')

      if (!isActive || (isActive && e.keyCode == 27)) return $this.click()

      $items = $('[role=menu] li:not(.divider) a', $parent)

      if (!$items.length) return

      index = $items.index($items.filter(':focus'))

      if (e.keyCode == 38 && index > 0) index--                                        // up
      if (e.keyCode == 40 && index < $items.length - 1) index++                        // down
      if (!~index) index = 0

      $items
        .eq(index)
        .focus()
    }

  }

  function clearMenus() {
    getParent($(toggle))
      .removeClass('open')
  }

  function getParent($this) {
    var selector = $this.attr('data-target')
      , $parent

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
    }

    $parent = $(selector)
    $parent.length || ($parent = $this.parent())

    return $parent
  }


  /* DROPDOWN PLUGIN DEFINITION
   * ========================== */

  $.fn.dropdown = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('dropdown')
      if (!data) $this.data('dropdown', (data = new Dropdown(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  $.fn.dropdown.Constructor = Dropdown


  /* APPLY TO STANDARD DROPDOWN ELEMENTS
   * =================================== */

  $(function () {
    $('html')
      .on('click.dropdown.data-api touchstart.dropdown.data-api', clearMenus)
    $('body')
      .on('click.dropdown touchstart.dropdown.data-api', '.dropdown', function (e) { e.stopPropagation() })
      .on('click.dropdown.data-api touchstart.dropdown.data-api'  , toggle, Dropdown.prototype.toggle)
      .on('keydown.dropdown.data-api touchstart.dropdown.data-api', toggle + ', [role=menu]' , Dropdown.prototype.keydown)
  })

}(window.jQuery);;
/* =============================================================
 * bootstrap-collapse.js v2.1.0
 * http://twitter.github.com/bootstrap/javascript.html#collapse
 * =============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


!function ($) {

  "use strict"; // jshint ;_;


 /* COLLAPSE PUBLIC CLASS DEFINITION
  * ================================ */

  var Collapse = function (element, options) {
    this.$element = $(element)
    this.options = $.extend({}, $.fn.collapse.defaults, options)

    if (this.options.parent) {
      this.$parent = $(this.options.parent)
    }

    this.options.toggle && this.toggle()
  }

  Collapse.prototype = {

    constructor: Collapse

  , dimension: function () {
      var hasWidth = this.$element.hasClass('width')
      return hasWidth ? 'width' : 'height'
    }

  , show: function () {
      var dimension
        , scroll
        , actives
        , hasData

      if (this.transitioning) return

      dimension = this.dimension()
      scroll = $.camelCase(['scroll', dimension].join('-'))
      actives = this.$parent && this.$parent.find('> .accordion-group > .in')

      if (actives && actives.length) {
        hasData = actives.data('collapse')
        if (hasData && hasData.transitioning) return
        actives.collapse('hide')
        hasData || actives.data('collapse', null)
      }

      this.$element[dimension](0)
      this.transition('addClass', $.Event('show'), 'shown')
      $.support.transition && this.$element[dimension](this.$element[0][scroll])
    }

  , hide: function () {
      var dimension
      if (this.transitioning) return
      dimension = this.dimension()
      this.reset(this.$element[dimension]())
      this.transition('removeClass', $.Event('hide'), 'hidden')
      this.$element[dimension](0)
    }

  , reset: function (size) {
      var dimension = this.dimension()

      this.$element
        .removeClass('collapse')
        [dimension](size || 'auto')
        [0].offsetWidth

      this.$element[size !== null ? 'addClass' : 'removeClass']('collapse')

      return this
    }

  , transition: function (method, startEvent, completeEvent) {
      var that = this
        , complete = function () {
            if (startEvent.type == 'show') that.reset()
            that.transitioning = 0
            that.$element.trigger(completeEvent)
          }

      this.$element.trigger(startEvent)

      if (startEvent.isDefaultPrevented()) return

      this.transitioning = 1

      this.$element[method]('in')

      $.support.transition && this.$element.hasClass('collapse') ?
        this.$element.one($.support.transition.end, complete) :
        complete()
    }

  , toggle: function () {
      this[this.$element.hasClass('in') ? 'hide' : 'show']()
    }

  }


 /* COLLAPSIBLE PLUGIN DEFINITION
  * ============================== */

  $.fn.collapse = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('collapse')
        , options = typeof option == 'object' && option
      if (!data) $this.data('collapse', (data = new Collapse(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.collapse.defaults = {
    toggle: true
  }

  $.fn.collapse.Constructor = Collapse


 /* COLLAPSIBLE DATA-API
  * ==================== */

  $(function () {
    $('body').on('click.collapse.data-api', '[data-toggle=collapse]', function (e) {
      var $this = $(this), href
        , target = $this.attr('data-target')
          || e.preventDefault()
          || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '') //strip for ie7
        , option = $(target).data('collapse') ? 'toggle' : $this.data()
      $this[$(target).hasClass('in') ? 'addClass' : 'removeClass']('collapsed')
      $(target).collapse(option)
    })
  })

}(window.jQuery);;

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
                // federate settings
                federate: true,
                federateServer: cmg.janrain_federate_server,
                federateXdReceiver: protocol+'//'+hostname+'/auth/federate_xd',
                federateLogoutUri: protocol + '//' + hostname + '/auth/federate-logout',
                federateLogoutCallback: function() {
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
(function(){var e,h=this,aa=function(a){var b=typeof a;if("object"==b)if(a){if(a instanceof Array)return"array";if(a instanceof Object)return b;var c=Object.prototype.toString.call(a);if("[object Window]"==c)return"object";if("[object Array]"==c||"number"==typeof a.length&&"undefined"!=typeof a.splice&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("splice"))return"array";if("[object Function]"==c||"undefined"!=typeof a.call&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("call"))return"function"}else return"null";
else if("function"==b&&"undefined"==typeof a.call)return"object";return b},k=function(a){return"array"==aa(a)},ba=function(a){var b=aa(a);return"array"==b||"object"==b&&"number"==typeof a.length},m=function(a){return"string"==typeof a},n=function(a){return"boolean"==typeof a},p=function(a){return"number"==typeof a},ca=function(a){var b=typeof a;return"object"==b&&null!=a||"function"==b},da="closure_uid_"+(1E9*Math.random()>>>0),ea=0,fa=function(a,b,c){return a.call.apply(a.bind,arguments)},ga=function(a,
b,c){if(!a)throw Error();if(2<arguments.length){var d=Array.prototype.slice.call(arguments,2);return function(){var c=Array.prototype.slice.call(arguments);Array.prototype.unshift.apply(c,d);return a.apply(b,c)}}return function(){return a.apply(b,arguments)}},ha=function(a,b,c){ha=Function.prototype.bind&&-1!=Function.prototype.bind.toString().indexOf("native code")?fa:ga;return ha.apply(null,arguments)},ja=function(a){var b=ia;function c(){}c.prototype=b.prototype;a.Ca=b.prototype;a.prototype=new c;
a.prototype.constructor=a;a.Ba=function(a,c,g){for(var l=Array(arguments.length-2),u=2;u<arguments.length;u++)l[u-2]=arguments[u];return b.prototype[c].apply(a,l)}};var q=function(a,b){var c=parseFloat(a);return isNaN(c)||1<c||0>c?b:c},ka=function(a,b){var c=parseInt(a,10);return isNaN(c)?b:c},la=/^([\w-]+\.)*([\w-]{2,})(\:[0-9]+)?$/,ma=function(a,b){if(!a)return b;var c=a.match(la);return c?c[0]:b};var na=q("0.02",0),oa=q("0.0",0);var pa=q("0.005",0),qa=q("0",0),ra=q("0.001",0),sa=ka("1500",1500),ta=q("0.01",0),ua=q("1.0",0),va=q("0.5",0),wa=q("",.001),xa=ka("",200),ya=q("0.01",
0),za=/^true$/.test("")?!0:!1,Aa=q("0.5",0),Ba=q("0.01",0),Ca=q("0.01",0),Da=q("0.01",0),Ea=q("1",0),Fa=q("",.001),Ga=q("0.01",0),Ha=q("0.0",0),Ia=q("0.05",0),Ja=q("0.5",0),Ka=
q("0.0",0),La=q("0.5",0),Ma=q("0.0",0),Na=q("0.0001",0),Oa=q("0.0001",0);var Pa=/^true$/.test("false")?!0:!1;var Qa=function(a,b){if(!(1E-4>Math.random())){var c=Math.random();if(c<b){try{var d=new Uint16Array(1);window.crypto.getRandomValues(d);c=d[0]/65536}catch(f){c=Math.random()}return a[Math.floor(c*a.length)]}}return null},r=function(a,b,c){for(var d in a)Object.prototype.hasOwnProperty.call(a,d)&&b.call(c,a[d],d,a)},Ra=function(a){var b=window;b.addEventListener?b.addEventListener("message",a,!1):b.attachEvent&&b.attachEvent("onmessage",a)},Sa=function(a){try{for(var b=null;b!=a;b=a,a=a.parent)switch(a.location.protocol){case "https:":return!0;
case "http:":case "file:":return!1}}catch(c){}return!0};var t=function(){return h.googletag||(h.googletag={})},v=function(a,b){var c=t();c.hasOwnProperty(a)||(c[a]=b)},Ta=function(a,b){a.addEventListener?a.addEventListener("load",b,!1):a.attachEvent&&a.attachEvent("onload",b)};var w={};w["#1#"]=ma("","pagead2.googlesyndication.com");w["#2#"]=ma("","pubads.g.doubleclick.net");w["#3#"]=ma("","securepubads.g.doubleclick.net");w["#4#"]=ma("","partner.googleadservices.com");w["#6#"]=Sa(window);w["#7#"]=na;w["#10#"]=qa;w["#11#"]=ra;w["#12#"]=pa;w["#13#"]=sa;w["#16#"]=ta;w["#17#"]=ua;w["#18#"]=va;w["#20#"]=oa;w["#23#"]=wa;w["#24#"]=xa;w["#27#"]=ya;w["#28#"]=Aa;w["#29#"]=Ba;w["#31#"]=Ca;
w["#33#"]=ma("","pagead2.googlesyndication.com");w["#34#"]=Ea;w["#36#"]=za;w["#37#"]=Da;w["#38#"]=Fa;w["#39#"]="";w["#40#"]=Ga;w["#41#"]=Ha;w["#50#"]=Ia;w["#42#"]=Ja;w["#43#"]=Ka;w["#44#"]=La;w["#45#"]=Ma;w["#46#"]=Pa;w["#47#"]=Na;w["#48#"]=Oa;w["#49#"]=0;v("_vars_",w);var x=function(a){return/^[\s\xa0]*$/.test(a)},y=function(a){return null==a?"":String(a)},Ua=function(a,b){return a<b?-1:a>b?1:0};var Va=Array.prototype,z=function(a,b){if(m(a))return m(b)&&1==b.length?a.indexOf(b,0):-1;for(var c=0;c<a.length;c++)if(c in a&&a[c]===b)return c;return-1},Wa=function(a,b,c){for(var d=a.length,f=m(a)?a.split(""):a,g=0;g<d;g++)g in f&&b.call(c,f[g],g,a)},Xa=function(a,b){for(var c=a.length,d=Array(c),f=m(a)?a.split(""):a,g=0;g<c;g++)g in f&&(d[g]=b.call(void 0,f[g],g,a));return d},Ya=function(a,b){for(var c=a.length,d=m(a)?a.split(""):a,f=0;f<c;f++)if(f in d&&b.call(void 0,d[f],f,a))return!0;return!1},
Za=function(a,b){var c;a:{c=a.length;for(var d=m(a)?a.split(""):a,f=0;f<c;f++)if(f in d&&b.call(void 0,d[f],f,a)){c=f;break a}c=-1}return 0>c?null:m(a)?a.charAt(c):a[c]},$a=function(a,b){0<=z(a,b)||a.push(b)},ab=function(a){var b=a.length;if(0<b){for(var c=Array(b),d=0;d<b;d++)c[d]=a[d];return c}return[]},bb=function(a,b,c){return 2>=arguments.length?Va.slice.call(a,b):Va.slice.call(a,b,c)},cb=function(a){for(var b={},c=0,d=0;d<a.length;){var f=a[d++],g;g=f;g=ca(g)?"o"+(g[da]||(g[da]=++ea)):(typeof g).charAt(0)+
g;Object.prototype.hasOwnProperty.call(b,g)||(b[g]=!0,a[c++]=f)}a.length=c},eb=function(a,b){a.sort(b||db)},gb=function(a){for(var b=fb,c=0;c<a.length;c++)a[c]={index:c,value:a[c]};var d=b||db;eb(a,function(a,b){return d(a.value,b.value)||a.index-b.index});for(c=0;c<a.length;c++)a[c]=a[c].value},db=function(a,b){return a>b?1:a<b?-1:0};var hb=function(a){return p(a)&&isFinite(a)&&0==a%1&&0<=a},ib=function(a){return a.replace(/[^a-zA-Z0-9]/g,function(a){return"&#"+a.charCodeAt()+";"})},jb=function(){return A("#6#")?"https:":"http:"},kb=function(a){var b=a.split("/");return"/"==a.charAt(0)&&2<=b.length?b[1]:"/"!=a.charAt(0)&&1<=b.length?b[0]:""},lb=function(a){var b=[],b=Xa(a,function(a){return kb(a.getAdUnitPath())});cb(b);return b},A=function(a){return t()._vars_[a]};var mb=A("#36#");var B=function(a,b){this.b=a;this.a=b||[]};B.prototype.getMessageId=function(){return this.b};B.prototype.getMessageArgs=function(){return this.a};var nb=function(a,b,c,d,f){this.b=new Date;this.h=d||null;this.g=c||null;this.c=a;this.f=b;this.a=f||null};e=nb.prototype;e.getSlot=function(){return this.h};e.getService=function(){return this.g};e.getLevel=function(){return this.c};e.getTimestamp=function(){return this.b};e.getMessage=function(){return this.f};e.getReference=function(){return this.a};var ob=["Debug","Info","Warning","Error","Fatal"];
nb.prototype.toString=function(){var a=this.b.toTimeString()+": "+ob[this.c]+": "+this.f;this.a&&(a+=" Duration: "+(this.b.getTime()-this.a.getTimestamp().getTime())+"ms.");return a};var pb=function(){this.a=[]};pb.prototype.getAllEvents=function(){return this.a};pb.prototype.getEventsByService=function(a){return qb(this,function(b){return b.getService()===a})};pb.prototype.getEventsBySlot=function(a){return qb(this,function(b){return b.getSlot()===a})};pb.prototype.getEventsByLevel=function(a){return qb(this,function(b){return b.getLevel()>=a})};var qb=function(a,b){for(var c=[],d=0;d<a.a.length;++d)b(a.a[d])&&c.push(a.a[d]);return c};
pb.prototype.log=function(a,b,c,d,f){a=new nb(a,b,c,d,f);this.a.push(a);return a};var C=function(a,b,c,d,f){return a.log(1,b,c,d,f)},D=function(a,b,c,d){a.log(2,b,c,d,void 0)},F=function(a,b,c,d){a.log(3,b,c,d,void 0)},I=function(){var a=t();return a.debug_log||(a.debug_log=new pb)};v("getEventLog",I);var J=function(a){return function(){return new B(a,[])}},K=function(a){return function(b){return new B(a,[b])}},L=function(a){return function(b,c){return new B(a,[b,c])}},M=function(a){return function(b,c,d){return new B(a,[b,c,d])}},rb=function(a){return"["+Xa(a,function(a){return m(a)?"'"+a+"'":k(a)?rb(a):String(a)}).join(", ")+"]"},sb=J(1),tb=K(2),ub=K(3),vb=K(4),wb=K(5),xb=K(6),yb=J(8),zb=M(9),Ab=M(10),Bb=L(12),Cb=K(13),Db=K(14),Eb=J(16),Fb=M(17),Gb=J(19),Hb=K(20),Ib=K(21),Jb=L(22),Kb=L(23),Lb=
K(26),Mb=K(27),Nb=K(28),Ob=K(30),Pb=L(31),Qb=J(34),Rb=K(35),Sb=M(36),Tb=M(37),Ub=J(38),Vb=K(39),Wb=L(40),Xb=J(42),Yb=L(43),Zb=J(44),$b=J(45),ac=K(46),bc=K(47),cc=K(48),dc=J(49),ec=J(50),fc=J(52),gc=L(53),hc=L(54),kc=K(55),lc=L(57),mc=M(58),nc=K(59),oc=K(60),pc=L(61),qc=L(62),rc=K(63),sc=L(64),tc=K(65),uc=J(66),vc=J(67),wc=J(68),xc=J(69),yc=J(70),zc=J(71),Ac=J(72),Bc=K(75),Cc=M(77),Dc=K(78),Ec=J(79),Fc=K(80),Gc=L(82),Hc=L(84),Ic=K(85),Jc=J(87),Kc=M(88),Lc=K(90),Mc=K(92),Nc=K(93),Oc=K(94),Pc=K(95),
N=function(a,b){var c=rb(ab(b)),c=c.substring(1,c.length-1);return new B(96,[a,c])},Qc=K(97),Rc=K(98);v("getVersion",function(){return"68"});var Tc=function(){this.a=Sc+"/pagead/gen_204?id="+encodeURIComponent("gpt_exception")},Sc=A("#6#")?"https://"+A("#33#"):"http://"+A("#33#"),Uc=function(a,b,c){b&&b.match(/^\w+$/)&&c&&(a.a+="&"+b+"="+encodeURIComponent(c))},Vc=function(a,b){if(void 0===b||0>b||1<b)b=A("#23#");if(Math.random()<b&&a.a){var c=a.a,d=window;d.google_image_requests||(d.google_image_requests=[]);var f=d.document.createElement("img");f.src=c;d.google_image_requests.push(f)}},Xc=function(a){var b=Wc;Uc(a,"vrg","68");b=lb(b);
3>=b.length||(b=bb(b,0,3),b.push("__extra__"));Uc(a,"nw_id",b.join(","))};var Yc=A("#38#"),Wc=[],Zc=function(a,b){var c={methodId:a};b.name&&(c.name=b.name);b.message&&(c.message=b.message.substring(0,512));b.fileName&&(c.fileName=b.fileName);b.lineNumber&&(c.lineNumber=b.lineNumber);if(b.stack){var d;var f=b.stack;try{-1==f.indexOf("")&&(f="\n"+f);for(var g;f!=g;)g=f,f=f.replace(/((https?:\/..*\/)[^\/:]*:\d+(?:.|\n)*)\2/,"$1");d=f.replace(/\n */g,"\n")}catch(l){d=""}c.stack=d}return c},O=function(a,b){$c(a,b,void 0);throw b;},$c=function(a,b,c){if(!b.Y)try{b.Y=!0;var d=
Yc;void 0!==c&&0<=c&&1>=c&&(d=c);var f=Zc(a,b),g=new Tc;try{Xc(g)}catch(l){}r(f,function(a,b){Uc(g,b,a)});Vc(g,d)}catch(u){}};var ad=function(){this.b=this.a=0};ad.prototype.push=function(a){try{for(var b=I(),c=0;c<arguments.length;++c)try{"function"==aa(arguments[c])&&(arguments[c](),this.a++)}catch(d){this.b++,F(b,Ob(String(d.message)))}C(b,Pb(String(this.a),String(this.b)));return this.a}catch(f){O(1001,f)}};(function(){function a(a){this.t={};this.tick=function(a,b,c){this.t[a]=[void 0!=c?c:(new Date).getTime(),b];if(void 0==c)try{window.console.timeStamp("CSI/"+a)}catch(d){}};this.tick("start",null,a)}var b;window.performance&&(b=window.performance.timing);var c=b?new a(b.responseStart):new a;window.GPT_jstiming={Timer:a,load:c};b&&(c=b.navigationStart,b=b.responseStart,0<c&&b>=c&&(window.GPT_jstiming.srt=b-c));try{b=null,window.chrome&&window.chrome.csi&&(b=Math.floor(window.chrome.csi().pageT)),null==
b&&window.gtbExternal&&(b=window.gtbExternal.pageT()),null==b&&window.external&&(b=window.external.pageT),b&&(window.GPT_jstiming.pt=b)}catch(d){}})();if(window.GPT_jstiming){window.GPT_jstiming.W={};window.GPT_jstiming.Z=1;var bd=function(a,b,c){var d=a.t[b],f=a.t.start;if(d&&(f||c))return d=a.t[b][0],void 0!=c?f=c:f=f[0],Math.round(d-f)};window.GPT_jstiming.getTick=bd;var cd=function(a,b,c){var d="";window.GPT_jstiming.srt&&(d+="&srt="+window.GPT_jstiming.srt);window.GPT_jstiming.pt&&(d+="&tbsrt="+window.GPT_jstiming.pt);try{window.external&&window.external.tran?d+="&tran="+window.external.tran:window.gtbExternal&&window.gtbExternal.tran?d+="&tran="+
window.gtbExternal.tran():window.chrome&&window.chrome.csi&&(d+="&tran="+window.chrome.csi().tran)}catch(f){}var g=window.chrome;if(g&&(g=g.loadTimes)){g().wasFetchedViaSpdy&&(d+="&p=s");if(g().wasNpnNegotiated){var d=d+"&npn=1",l=g().npnNegotiatedProtocol;l&&(d+="&npnv="+(encodeURIComponent||escape)(l))}g().wasAlternateProtocolAvailable&&(d+="&apa=1")}var u=a.t,R=u.start,g=[],l=[],E;for(E in u)if("start"!=E&&0!=E.indexOf("_")){var G=u[E][1];G?u[G]&&l.push(E+"."+bd(a,E,u[G][0])):R&&g.push(E+"."+bd(a,
E))}if(b)for(var H in b)d+="&"+H+"="+b[H];(b=c)||(b="https:"==document.location.protocol?"https://csi.gstatic.com/csi":"http://csi.gstatic.com/csi");return[b,"?v=3","&s="+(window.GPT_jstiming.sn||"gpt")+"&action=",a.name,l.length?"&it="+l.join(","):"",d,"&rt=",g.join(",")].join("")},dd=function(a,b,c){a=cd(a,b,c);if(!a)return"";b=new Image;var d=window.GPT_jstiming.Z++;window.GPT_jstiming.W[d]=b;b.onload=b.onerror=function(){window.GPT_jstiming&&delete window.GPT_jstiming.W[d]};b.src=a;b=null;return a};
window.GPT_jstiming.report=function(a,b,c){if("prerender"==document.webkitVisibilityState){var d=!1,f=function(){if(!d){b?b.prerender="1":b={prerender:"1"};var g;"prerender"==document.webkitVisibilityState?g=!1:(dd(a,b,c),g=!0);g&&(d=!0,document.removeEventListener("webkitvisibilitychange",f,!1))}};document.addEventListener("webkitvisibilitychange",f,!1);return""}return dd(a,b,c)}};var ed=function(a,b){for(var c in a)if(b.call(void 0,a[c],c,a))return!0;return!1},fd=function(a,b){for(var c in a)if(a[c]==b)return!0;return!1},gd=function(a){var b=arguments.length;if(1==b&&k(arguments[0]))return gd.apply(null,arguments[0]);for(var c={},d=0;d<b;d++)c[arguments[d]]=!0;return c};gd("area base br col command embed hr img input keygen link meta param source track wbr".split(" "));var hd=function(a,b){this.b=a;this.a=b};e=hd.prototype;e.clone=function(){return new hd(this.b,this.a)};e.isEmpty=function(){return!(this.b*this.a)};e.ceil=function(){this.b=Math.ceil(this.b);this.a=Math.ceil(this.a);return this};e.floor=function(){this.b=Math.floor(this.b);this.a=Math.floor(this.a);return this};e.round=function(){this.b=Math.round(this.b);this.a=Math.round(this.a);return this};var P;a:{var id=h.navigator;if(id){var jd=id.userAgent;if(jd){P=jd;break a}}P=""};var kd=-1!=P.indexOf("Opera")||-1!=P.indexOf("OPR"),ld=-1!=P.indexOf("Trident")||-1!=P.indexOf("MSIE"),md=-1!=P.indexOf("Edge"),nd=-1!=P.indexOf("Gecko")&&!(-1!=P.toLowerCase().indexOf("webkit")&&-1==P.indexOf("Edge"))&&!(-1!=P.indexOf("Trident")||-1!=P.indexOf("MSIE"))&&-1==P.indexOf("Edge"),od=-1!=P.toLowerCase().indexOf("webkit")&&-1==P.indexOf("Edge"),pd=function(){var a=P;if(nd)return/rv\:([^\);]+)(\)|;)/.exec(a);if(md)return/Edge\/([\d\.]+)/.exec(a);if(ld)return/\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/.exec(a);
if(od)return/WebKit\/(\S+)/.exec(a)},qd=function(){var a=h.document;return a?a.documentMode:void 0},rd=function(){if(kd&&h.opera){var a=h.opera.version;return"function"==aa(a)?a():a}var a="",b=pd();b&&(a=b?b[1]:"");return ld&&(b=qd(),b>parseFloat(a))?String(b):a}(),sd={},td=function(a){if(!sd[a]){for(var b=0,c=String(rd).replace(/^[\s\xa0]+|[\s\xa0]+$/g,"").split("."),d=String(a).replace(/^[\s\xa0]+|[\s\xa0]+$/g,"").split("."),f=Math.max(c.length,d.length),g=0;0==b&&g<f;g++){var l=c[g]||"",u=d[g]||
"",R=RegExp("(\\d*)(\\D*)","g"),E=RegExp("(\\d*)(\\D*)","g");do{var G=R.exec(l)||["","",""],H=E.exec(u)||["","",""];if(0==G[0].length&&0==H[0].length)break;b=Ua(0==G[1].length?0:parseInt(G[1],10),0==H[1].length?0:parseInt(H[1],10))||Ua(0==G[2].length,0==H[2].length)||Ua(G[2],H[2])}while(0==b)}sd[a]=0<=b}},ud=h.document,vd=ud&&ld?qd()||("CSS1Compat"==ud.compatMode?parseInt(rd,10):5):void 0;var wd;if(!(wd=!nd&&!ld)){var xd;if(xd=ld)xd=9<=vd;wd=xd}wd||nd&&td("1.9.1");ld&&td("9");var yd={Aa:"slotRenderEnded"},zd=function(a,b,c,d){this.slot=a;this.isEmpty=b;this.size=c;this.lineItemId=this.creativeId=null;this.serviceName=d};var ia=function(){this.N=[];this.S={};this.b=!1;this.v={};this.log=I();C(this.log,Rb(this.getName()),this)};e=ia.prototype;e.getName=function(){return"unknown"};e.getVersion=function(){return"unversioned"};e.getSlots=function(){return this.N};e.getSlotIdMap=function(){return this.S};e.enable=function(){if(this.b)C(this.log,Ub(),this);else{this.b=!0;try{this.I()}catch(a){$c(1402,a),F(this.log,Vb(String(a)),this)}}};
e.J=function(a){this.N.push(a);this.S[a.getSlotId().getId()]=a;C(this.log,Wb(this.getName(),a.getAdUnitPath()),this,a)};e.addEventListener=function(a,b){try{if("function"!=aa(b)||!m(a)){var c=N("Service.addEventListener",arguments);D(this.log,c,this);return this}if(!fd(yd,a))return D(this.log,Nc(a),this),this;c=a;k(this.v[c])||(this.v[c]=[]);this.v[c].push(b);return this}catch(d){O(1401,d)}};
var Ad=function(a,b){var c=a.v.slotRenderEnded;k(c)&&Wa(c,function(a){try{a(b)}catch(c){a=c&&m(c.name)?c.name:null;var g=c&&m(c.message)?c.message:null,l="";a&&g?l=a+": "+g:a?l=a:g&&(l=g);D(this.log,Mc(l),this)}},a)};var Bd={ba:"start_first_ad_fetch_period",aa:"start_ad_fetch_period",$:"ad_fetch_period",ja:"start_ad_render_period",ia:"ad_render_period",ea:"page_load_time",fa:"page_load_time_nw",ca:"loader_loaded_instant",da:"loader_loaded_instant_nw",ha:"_start_pubads_load_period",ga:"pubads_load_period",va:"_rt_st_ref",ua:"rt_st_instant",pa:"_rt_fs_ref",oa:"rt_fs_instant",la:"_rt_dns_ref",ka:"rt_dns_period",xa:"_rt_tcp_ref",wa:"rt_tcp_period",ta:"_rt_ssl_ref",sa:"rt_ssl_period",ra:"_rt_rtt_ref",qa:"rt_rtt_period",
za:"_rt_tft_ref",ya:"rt_tft_period",na:"_rt_duration_ref",ma:"rt_duration_period"};var Cd={page_load_time:!0,loader_loaded_instant:!0,page_load_time_nw:!0,loader_loaded_instant_nw:!0,_start_pubads_load_period:!0,pubads_load_period:!0,_rt_st_ref:!0,rt_st_instant:!0,_rt_fs_ref:!0,rt_fs_instant:!0,_rt_dns_ref:!0,rt_dns_period:!0,_rt_tcp_ref:!0,rt_tcp_period:!0,_rt_ssl_ref:!0,rt_ssl_period:!0,_rt_rtt_ref:!0,rt_rtt_period:!0,_rt_tft_ref:!0,rt_tft_period:!0,_rt_duration_ref:!0,rt_duration_period:!0},Dd={start_ad_fetch_period:!0,start_ad_render_period:!0},Ed={pubads_load_period:"_start_pubads_load_period",
ad_fetch_period:"start_ad_fetch_period",ad_render_period:"start_ad_render_period",rt_st_instant:"_rt_st_ref",rt_fs_instant:"_rt_fs_ref",rt_dns_period:"_rt_dns_ref",rt_tcp_period:"_rt_tcp_ref",rt_ssl_period:"_rt_ssl_ref",rt_rtt_period:"_rt_rtt_ref",rt_tft_period:"_rt_tft_ref",rt_duration_period:"_rt_duration_ref"},Fd={},Gd=function(){this.j=!1;h.GPT_jstiming&&h.GPT_jstiming.load&&("http:"==h.location.protocol||"https:"==h.location.protocol)&&Math.random()<A("#37#")&&(this.j=!0);this.f=this.c=this.i=
null;this.u=this.s=this.o=!1;this.h=window.GPT_jstiming.getTick(window.GPT_jstiming.load,"start",0);this.b=window.GPT_jstiming.load;this.b.name="global";this.a={};this.l=500;this.v=[];this.m={};this.B=this.w=!1;this.C=this.A=0;this.g=!1},Id=function(a,b,c,d,f,g){if(c){a.b||(a.b=new h.GPT_jstiming.Timer(a.h),a.b.name="global");c="_"==b[0];if(f||c||window.performance&&window.performance.timing)a.b.tick(b,f,g),c||(a.s=!0);"loader_loaded_instant"==b&&(a.g?a.tick("loader_loaded_instant_nw"):a.A=(new Date).getTime());
"page_load_time"==b&&(a.g?a.tick("page_load_time_nw"):a.C=(new Date).getTime());a.B||Hd(a,!0)}else d?(a.f||(a.f=new h.GPT_jstiming.Timer(a.h),a.f.name="ad_events_psbk"),a.f.tick(b,f,g),0!=b.indexOf("_")&&(a.u=!0)):(a.c||(a.c=new h.GPT_jstiming.Timer(a.h),a.c.name="ad_events"),a.c.tick(b,f,g),0!=b.indexOf("_")&&(a.o=!0))};Gd.prototype.tick=function(a,b,c){try{if(this.j){var d=Cd.hasOwnProperty(a),f=Ed[a];d&&(this.a[a]=!0);Id(this,a,d,b||!1,f,c)}}catch(g){O(2601,g)}};
var Jd=function(a){var b=null!=a.b&&a.s&&(a.a.page_load_time||"complete"==document.readyState)&&a.a.loader_loaded_instant;b&&r(Bd,function(a){var d=Ed[a];Cd.hasOwnProperty(a)&&d&&(b=b&&this.a[a]==this.a[d])},a);return b},Kd=function(a){window.setTimeout(ha(function(){try{Hd(this,!1)&&(this.l=32E3<2*this.l?32E3:2*this.l),Kd(this)}catch(a){O(2602,a)}},a),a.l)},Hd=function(a,b){if(!a.j)return!1;var c="https:"==h.location.protocol?"https://www.google.com/csi":"http://csi.gstatic.com/csi",d={vrg:"68"};
a.v.length&&(d.e=a.v.join());var f=!1;a.b&&Jd(a)&&(h.GPT_jstiming.report(a.b,d,c),a.B=!0,a.s=!1,a.b=null,f=!0);b||(a.c&&a.o&&(h.GPT_jstiming.report(a.c,d,c),a.c=null,a.o=!1,f=!0),a.f&&a.u&&(h.GPT_jstiming.report(a.f,d,c),a.f=null,a.u=!1,f=!0));return f};
Gd.prototype.tickRepeated=function(a,b,c){if(this.j&&!(1E3<b)){var d=Ed[a],f=Cd.hasOwnProperty(a),g=a,l=d;d&&(l=this.i&&Fd[d]?l+".sra":l+("."+b));g=this.i&&Fd[a]?g+".sra":g+("."+b);l&&this.m.hasOwnProperty("_"+l)&&(l="_"+l,Id(this,l,!1,c||!1,void 0,this.m[l]+this.h),delete this.m[l]);Id(this,g,f,c||!1,l);b=c?this.f:this.c;f||"start_ad_fetch_period"!=a||this.w||(Id(this,"start_first_ad_fetch_period",!1,c||!1,void 0,window.GPT_jstiming.getTick(b,g)+this.h),this.w=!0);Dd.hasOwnProperty(a)&&(a=window.GPT_jstiming.getTick(b,
g),this.m["_"+g]=a)}};Gd.prototype.addFeature=function(a){0<a.length&&$a(this.v,a)};Gd.prototype.setSraMode=function(a){null===this.i&&((this.i=a)?this.addFeature("sra"):this.addFeature("non-sra"))};var Q=function(){return t()._tmanager_||Ld()},Ld=function(){var a=new Gd;v("_tmanager_",a);Kd(a);Md(a);Ta(window,function(){a.tick("page_load_time")});a.addFeature("v68");return a},Md=function(a){r(Bd,function(a){Cd.hasOwnProperty(a)&&(this.a[a]=!1)},a)};
Gd.prototype.tickValueAsInterval=function(a,b,c){var d=Ed[a];d&&(this.tick(d,c,0),this.tick(a,c,b))};var Nd=function(a){a.a.loader_loaded_instant&&!a.a.loader_loaded_instant_nw&&a.tick("loader_loaded_instant_nw",!1,a.A);a.a.page_load_time&&!a.a.page_load_time_nw&&a.tick("page_load_time_nw",!1,a.C)};var Od=function(){this.a={};this.b=!1;this.c=I();this.g=C(this.c,yb());Ta(window,ha(Od.prototype.f,this))},Pd=function(a,b){var c=null;b in a.a&&(c=a.a[b]);return c},Qd=function(){var a=S();r(a.a,function(a,c){a.enable();Q().addFeature(c)})};Od.prototype.f=function(){try{this.b=!0,C(this.c,sb(),null,null,this.g)}catch(a){O(1802,a)}};var S=function(){var a=t();return a.service_manager_instance||(a.service_manager_instance=new Od)};v("enableServices",function(){try{Qd()}catch(a){O(1801,a)}});var Rd=function(a){return k(a)&&2==a.length&&hb(a[0])&&hb(a[1])},Sd=function(a){return k(a)&&1<a.length&&p(a[0])&&p(a[1])};var Td=function(a,b){this.b=a;this.a=b};Td.prototype.getWidth=function(){return this.b};Td.prototype.getHeight=function(){return this.a};var Ud=function(a){var b=[];if(k(a))if(Sd(a))b.push(new Td(a[0],a[1]));else for(var c=0;c<a.length;++c){var d=a[c];Sd(d)&&b.push(new Td(d[0],d[1]))}return b};var Vd=function(a,b){this.a=a;this.b=b};Vd.prototype.clone=function(){return new Vd(this.a,this.b)};var Wd=function(a){this.a=a},Xd=function(a,b){var c=Za(a.a,function(a){a=a.a;return a.b<=b.b&&a.a<=b.a});return null==c?null:c.b},Yd=function(a){if(!k(a)||2!=a.length)throw Error("Each mapping entry has to be an array of size 2");var b;b=a[0];if(!Rd(b))throw Error("Size has to be an array of two non-negative integers");b=new hd(b[0],b[1]);if(k(a[1])&&0==a[1].length)a=[];else if(a=Ud(a[1]),0==a.length)throw Error("At least one slot size must be present");return new Vd(b,a)};var Zd=function(a,b,c){this.a=a;this.c=p(b)?b:0;this.b=this.a+"_"+this.c;this.f=c||"gpt_unit_"+this.b};e=Zd.prototype;e.getId=function(){return this.b};e.getAdUnitPath=function(){return this.a};e.getName=function(){return this.a};e.getInstance=function(){return this.c};e.toString=Zd.prototype.getId;e.getDomId=function(){return this.f};var $d=function(a,b,c,d){this.i=a;this.H=Ud(c);this.v=null;this.b=new Zd(a,b,d);this.c=[];this.g={};this.j=null;this.a=I();C(this.a,tb(this.b.toString()),null,this);this.h=this.m=null;this.w=this.B="";this.o=!0;this.f={};this.l=[];this.F=!1;this.C=this.A=null;this.u=0;this.s=-1;this.D=0;this.G=!1};e=$d.prototype;
e.set=function(a,b){try{if(!m(a)||!b)return D(this.a,N("Slot.set",arguments),null,this),this;var c=this.getAdUnitPath();this.g[a]=b;this.m||this.h?D(this.a,Ab(a,String(b),c),null,this):C(this.a,zb(a,String(b),c),null,this);return this}catch(d){O(201,d)}};e.get=function(a){try{return m(a)?this.g.hasOwnProperty(a)?this.g[a]:null:(D(this.a,N("Slot.get",arguments),null,this),null)}catch(b){O(202,b)}};
e.getAttributeKeys=function(){try{var a=[];r(this.g,function(b,d){a.push(d)});return a}catch(b){O(203,b)}};e.addService=function(a){try{var b=S();if(!fd(b.a,a))return D(this.a,Oc(this.b.toString()),null,this),this;for(b=0;b<this.c.length;++b)if(a==this.c[b])return D(this.a,Bb(a.getName(),this.b.toString()),a,this),this;this.c.push(a);a.J(this);return this}catch(c){O(204,c)}};e.getName=function(){return this.i};e.getAdUnitPath=function(){try{return this.i}catch(a){O(215,a)}};e.getSlotElementId=function(){return this.b.getDomId()};
e.getSlotId=function(){return this.b};e.getServices=function(){return this.c};e.getSizes=function(a,b){return p(a)&&p(b)&&this.v?Xd(this.v,new hd(a,b)):this.H};e.defineSizeMapping=function(a){try{if(!k(a))throw Error("Size mapping has to be an array");var b=Xa(a,Yd);this.v=new Wd(b)}catch(c){$c(205,c),D(this.a,Cb(c.message),null,this)}return this};e.hasWrapperDiv=function(){return!!document.getElementById(this.b.getDomId())};
e.setClickUrl=function(a){try{if(!m(a))return D(this.a,N("Slot.setClickUrl",arguments),null,this),this;this.w=a;return this}catch(b){O(206,b)}};e.getClickUrl=function(){return this.w};e.setCategoryExclusion=function(a){try{return m(a)&&!x(y(a))?($a(this.l,a),C(this.a,Db(a),null,this)):D(this.a,N("Slot.setCategoryExclusion",arguments),null,this),this}catch(b){O(207,b)}};e.clearCategoryExclusions=function(){try{return C(this.a,Eb(),null,this),this.l=[],this}catch(a){O(208,a)}};
e.getCategoryExclusions=function(){try{return ab(this.l)}catch(a){O(209,a)}};e.setTargeting=function(a,b){try{var c=[];k(b)?c=b:b&&c.push(b.toString());m(a)?(C(this.a,Fb(a,c.join(),this.getAdUnitPath()),null,this),this.f[a]=c):D(this.a,N("Slot.setTargeting",arguments),null,this);return this}catch(d){O(210,d)}};e.clearTargeting=function(){try{return C(this.a,Gb(),null,this),this.f={},this}catch(a){O(211,a)}};e.getTargetingMap=function(){var a=this.f,b={},c;for(c in a)b[c]=a[c];return b};
e.getTargeting=function(a){try{return m(a)?this.f.hasOwnProperty(a)?ab(this.f[a]):[]:(D(this.a,N("Slot.getTargeting",arguments),null,this),[])}catch(b){O(212,b)}};e.getTargetingKeys=function(){try{var a=[];r(this.f,function(b,d){a.push(d)});return a}catch(b){O(213,b)}};e.getOutOfPage=function(){return this.F};e.getAudExtId=function(){return this.u};e.setTagForChildDirectedTreatment=function(a){if(0===a||1===a)this.s=a};e.gtfcd=function(){return this.s};
e.setCollapseEmptyDiv=function(a,b){try{if(!n(a)||b&&!n(b))return D(this.a,N("Slot.setCollapseEmptyDiv",arguments),null,this),this;this.C=(this.A=a)&&Boolean(b);b&&!a&&D(this.a,Hb(this.b.toString()),null,this);return this}catch(c){O(214,c)}};e.getCollapseEmptyDiv=function(){return this.A};e.getDivStartsCollapsed=function(){return this.C};
var ae=function(a,b){if(!a.hasWrapperDiv())return F(a.a,Ib(a.b.toString()),null,a),!1;var c=h.document,d=a.b.getDomId(),c=c&&c.getElementById(d);if(!c)return F(a.a,Jb(d,a.b.toString()),null,a),!1;d=a.j;return m(d)&&0<d.length?(a.renderStarted(),c.innerHTML=d,a.renderEnded(b),!0):!1};e=$d.prototype;e.fetchStarted=function(a){this.m=C(this.a,ub(this.getAdUnitPath()),null,this);this.B=a};e.getContentUrl=function(){return this.B};e.fetchEnded=function(){C(this.a,vb(this.getAdUnitPath()),null,this,this.m)};
e.renderStarted=function(){this.h=C(this.a,wb(this.getAdUnitPath()),null,this)};e.renderEnded=function(a){C(this.a,xb(this.getAdUnitPath()),null,this,this.h);Wa(this.c,function(b){b.getName()==a.serviceName&&Ad(b,a)})};e.setFirstLook=function(a){if(!n(a))return D(this.a,N("Slot.setFirstLook",arguments),null,this),this;this.D=a?1:2;return this};e.getFirstLook=function(){return this.D};var be=function(){this.a={};this.b={};this.c=I()},ce=function(a,b,c,d){if(!m(b)||0>=b.length||!c)return null;b in a.a||(a.a[b]=[]);c=new $d(b,a.a[b].length,c,d);d=c.getSlotId().getDomId();if(a.b[d])return F(a.c,Nb(d)),null;a.a[b].push(c);a.b[c.getSlotId().getDomId()]=c;Wc.push(c);a=lb([c])[0];b=Q();b.g||(b.g=!0,b.addFeature("n"+a));Nd(b);return c};be.prototype.f=function(a,b){var c=b||0,d=m(a)&&this.a[a]||[];return 0<=c&&c<d.length&&(d=d[c],d.getSlotId().getInstance()==c)?d:null};
var de=function(a,b){return ed(a.a,function(a){return 0<=z(a,b)})},T=function(){var a=t();return a.slot_manager_instance||(a.slot_manager_instance=new be)},U=function(a,b,c){try{var d=T();return d&&ce(d,a,b,c)}catch(f){O(802,f)}};v("defineOutOfPageSlot",function(a,b){try{var c=T();if(!c)return null;var d=ce(c,a,[1,1],b);return d?(d.F=!0,d):null}catch(f){O(801,f)}});v("defineSlot",U);v("defineUnit",U);be.prototype.find=be.prototype.f;be.getInstance=T;var ee=function(a){try{var b=I();if(m(a)){var c,d=T();if(c=d.b[a]?d.b[a]:null)if(c.o&&!c.hasWrapperDiv())D(c.a,Kb(c.i,c.b.getDomId()),null,c);else for(a=0;a<c.c.length;++a)c.c[a].b&&c.c[a].w(c);else F(b,Mb(String(a)))}else F(b,Lb(String(a)))}catch(f){O(2201,f)}};v("display",ee);var fe=/#|$/,ge=function(a,b){var c=a.search(fe),d;a:{d=0;for(var f=b.length;0<=(d=a.indexOf(b,d))&&d<c;){var g=a.charCodeAt(d-1);if(38==g||63==g)if(g=a.charCodeAt(d+f),!g||61==g||38==g||35==g)break a;d+=f+1}d=-1}if(0>d)return null;f=a.indexOf("&",d);if(0>f||f>c)f=c;d+=b.length+1;return decodeURIComponent(a.substr(d,f-d).replace(/\+/g," "))};var he=null,ie=nd||od||kd||"function"==typeof h.atob;var ke=function(a,b,c){var d=je++;this.a=new $d(a,d,b);this.a.G=!0;this.a.addService(c);this.b=c},je=1;e=ke.prototype;e.setClickUrl=function(a){try{return this.a.setClickUrl(a),this}catch(b){O(1202,b)}};e.setTargeting=function(a,b){try{return this.a.setTargeting(a,b),this}catch(c){O(1204,c)}};e.setAudExtId=function(a){try{return hb(a)&&(this.a.u=a),this}catch(b){O(1205,b)}};e.setTagForChildDirectedTreatment=function(a){try{return this.a.setTagForChildDirectedTreatment(a),this}catch(b){O(1203,b)}};
e.display=function(){try{le(this.b,this.a)}catch(a){O(1201,a)}};var me=function(a,b){this.a=a;this.b=b||{changeCorrelator:!0}},V=function(){ia.call(this);this.g=!1;this.a=null;this.K=0;this.B=-1;this.M=0;this.A={};this.l={};this.G=[];this.P=this.F="";this.i=this.L=this.R=this.O=!1;this.c=mb?!1:!0;this.H=mb;this.C=this.m=!1;this.h=[];this.u=[];this.j=[];this.T={};this.D=!1;this.o=-1;this.U=this.V="";this.f=[];null!==ge(window.location.href,"google_force_safeframe_image")&&this.f.push("108809020");null!==ge(window.location.href,"google_force_sra")&&this.f.push("108809056");
"undefined"!=typeof window.google_experimental_delay?this.s=window.google_experimental_delay:(this.s=Qa([0,100,200,400],4*A("#48#")),window.google_experimental_delay=this.s);var a=Qa(["108809043","108809044"],2*A("#40#"));x(y(a))||this.forceExperiment(a);a=Qa(["108809047","108809048"],2*A("#42#"));x(y(a))||this.forceExperiment(a);a=Qa(["108809055","108809056","108809057"],3*A("#47#"));x(y(a))||this.forceExperiment(a);0<=z(this.f,"108809056")&&(this.i=!0)};ja(V);
var ne={adsense_ad_format:"google_ad_format",adsense_ad_types:"google_ad_type",adsense_allow_expandable_ads:"google_allow_expandable_ads",adsense_background_color:"google_color_bg",adsense_bid:"google_bid",adsense_border_color:"google_color_border",adsense_channel_ids:"google_ad_channel",adsense_content_section:"google_ad_section",adsense_cpm:"google_cpm",adsense_ed:"google_ed",adsense_encoding:"google_encoding",adsense_family_safe:"google_safe",adsense_feedback:"google_feedback",adsense_flash_version:"google_flash_version",
adsense_font_face:"google_font_face",adsense_font_size:"google_font_size",adsense_hints:"google_hints",adsense_host:"google_ad_host",adsense_host_channel:"google_ad_host_channel",adsense_host_tier_id:"google_ad_host_tier_id",adsense_keyword_type:"google_kw_type",adsense_keywords:"google_kw",adsense_line_color:"google_line_color",adsense_link_color:"google_color_link",adsense_relevant_content:"google_contents",adsense_reuse_colors:"google_reuse_colors",adsense_targeting:"google_targeting",adsense_targeting_types:"google_targeting",
adsense_test_mode:"google_adtest",adsense_text_color:"google_color_text",adsense_ui_features:"google_ui_features",adsense_ui_version:"google_ui_version",adsense_url_color:"google_color_url",alternate_ad_iframe_color:"google_alternate_color",alternate_ad_url:"google_alternate_ad_url",demographic_age:"google_cust_age",demographic_ch:"google_cust_ch",demographic_gender:"google_cust_gender",demographic_interests:"google_cust_interests",demographic_job:"google_cust_job",demographic_l:"google_cust_l",demographic_lh:"google_cust_lh",
demographic_u_url:"google_cust_u_url",demographic_unique_id:"google_cust_id",document_language:"google_language",geography_override_city:"google_city",geography_override_country:"google_country",geography_override_region:"google_region",page_url:"google_page_url"};e=V.prototype;e.set=function(a,b){try{if(!(m(a)&&0<a.length))return D(this.log,N("PubAdsService.set",arguments),this,null),this;this.A[a]=b;C(this.log,Sb(a,String(b),this.getName()),this,null);return this}catch(c){O(21,c)}};
e.get=function(a){try{return this.A[a]}catch(b){O(22,b)}};e.getAttributeKeys=function(){try{var a=[];r(this.A,function(b,d){a.push(d)});return a}catch(b){O(23,b)}};e.display=function(a,b,c,d){try{this.enable();var f=c?U(a,b,c):U(a,b);f.addService(this);d&&f.setClickUrl(d);ee(f.getSlotId().getDomId())}catch(g){O(24,g)}};
e.I=function(){if(this.c){if(!this.g){var a=document,b=a.createElement("script");S();b.async=!0;b.type="text/javascript";b.src=oe();(a=a.getElementsByTagName("head")[0]||a.getElementsByTagName("body")[0])?(C(this.log,ac("GPT PubAds"),this),Q().tick("_start_pubads_load_period"),a.appendChild(b),this.g=!0):F(this.log,bc("GPT PubAds"),this)}}else pe(this);this.a&&0<=z(this.f,"108809044")&&qe(this)};e.getName=function(){return"publisher_ads"};
var oe=function(){return jb()+"//partner.googleadservices.com/gpt/pubads_impl_68.js"},pe=function(a){var b=S();a.g||b.b||(b=document,a.g=!0,Q().tick("_start_pubads_load_period"),b.write('<script type="text/javascript" src="'+ib(oe())+'">\x3c/script>'))};
V.prototype.fillSlot=function(a){C(this.log,ec());this.a.fillSlot(a);this.T[a.getAdUnitPath()]=!0;if(this.a)for(a=0;a<this.j.length;a++){var b=this.j[a];b.a[0].getAdUnitPath()in this.T&&(this.refresh(b.a,b.b),Va.splice.call(this.j,a,1),a--)}else F(this.log,dc(),this)};
V.prototype.onGoogleAdsJsLoad=function(a){if(!this.a){this.a=a;C(this.log,cc("GPT"),this);this.a.setCookieOptions(this.K);this.a.setTagForChildDirectedTreatment(this.B);this.a.setKidsFriendlyAds(this.M);null===this.s||this.a.setApiExperiment(re(this));Wa(this.f,function(a){this.a.setApiExperiment(a)},this);this.a.setCenterAds(this.H);mb&&(this.i=!1,this.a.setMobilePlatform());this.m&&this.a.collapseEmptyDivs(this.C);0<=z(this.f,"108809044")?se(this)&&qe(this):qe(this);if(0<this.h.length)for(a=0;a<
this.h.length;++a)this.w(this.h[a]);if(0<this.u.length)for(a=0;a<this.u.length;++a)le(this,this.u[a]);v("pubadsReady",!0)}};V.prototype.J=function(a){this.c||(a.o=!1);ia.prototype.J.call(this,a)};
V.prototype.w=function(a){if(S().b&&!this.c)F(this.log,fc(),this);else if(this.a)0<=z(this.f,"108809044")&&qe(this),te(this),ue(this,a)&&this.fillSlot(a);else if(this.c||this.g&&0==this.h.length){for(var b=!1,c=0;c<this.h.length;++c)a===this.h[c]&&(b=!0);b||(C(this.log,gc(a.getAdUnitPath(),"GPT"),this,a),this.h.push(a))}else F(this.log,kc(a.getAdUnitPath()),this,a)};
var ue=function(a,b){if(a.a&&null==a.a.addSlot(b))return F(a.log,Rc(b.getAdUnitPath()),a,b),!1;for(var c=b.getAttributeKeys(),d=0;d<c.length;++d)c[d]in ne?a.a.addAdSenseSlotAttribute(b,ne[c[d]],String(b.get(c[d]))):D(a.log,mc(String(c[d]),String(b.get(c[d])),b.getAdUnitPath()),a,b);return!0},se=function(a){return Ya(a.getSlots(),function(a){return!a.G})},qe=function(a){if(!a.R&&a.a){a.R=!0;if(a.i){a.c?a.a.enableAsyncSingleRequest():a.a.enableSingleRequest();te(a);for(var b=a.getSlots(),c=0;c<b.length;++c)ue(a,
b[c])}else a.c&&a.a.enableAsyncRendering();a.L&&a.a.disableInitialLoad();ve(a);we(a)}},te=function(a){if(!a.O){a.O=!0;for(var b=a.getAttributeKeys(),c=0;c<b.length;++c)b[c]in ne?a.a.addAdSensePageAttribute(ne[b[c]],String(a.get(b[c]))):D(a.log,lc(String(b[c]),String(a.get(b[c]))),a);a.a.addAdSensePageAttribute("google_tag_info","v2");r(a.l,function(a,b){if(k(a))for(var c=0;c<a.length;++c)this.a.addAttribute(b,a[c])},a);Wa(a.G,function(a){this.a.addPageCategoryExclusion(a)},a);a.a.setPublisherProvidedId(a.P);
a.F&&a.a.setLocation(a.F)}};e=V.prototype;e.setCookieOptions=function(a){try{if(!p(a)||!hb(a))return D(this.log,nc(String(a)),this),this;this.K=a;this.a&&this.a.setCookieOptions(a);return this}catch(b){O(17,b)}};e.setTagForChildDirectedTreatment=function(a){try{if(0!==a&&1!==a)return D(this.log,Lc(String(a)),this),this;this.B=a;this.a&&this.a.setTagForChildDirectedTreatment(a);return this}catch(b){O(18,b)}};
e.clearTagForChildDirectedTreatment=function(){try{return this.B=-1,this.a&&this.a.setTagForChildDirectedTreatment(-1),this}catch(a){O(19,a)}};e.setKidsFriendlyAds=function(a){try{if(0!==a&&1!==a)return D(this.log,Qc(String(a)),this),this;this.M=a;this.a&&this.a.setKidsFriendlyAds(a);return this}catch(b){O(18,b)}};
e.setTargeting=function(a,b){try{var c=null;m(b)?c=[b]:k(b)?c=b:ba(b)&&(c=ab(b));var d=c?c.join():String(b);if(!m(a)||x(y(a))||!c)return D(this.log,N("PubAdsService.setTargeting",arguments),this),this;this.l[a]=c;C(this.log,Kc(a,d,this.getName()),this);if(this.a)for(this.a.clearAttribute(a),d=0;d<c.length;++d)this.a.addAttribute(a,c[d]);return this}catch(f){O(1,f)}};
e.clearTargeting=function(a){try{if(!m(a)||x(y(a)))return D(this.log,N("PubAdsService.clearTargeting",arguments),this),this;if(!this.l[a])return D(this.log,Hc(a,this.getName()),this),this;delete this.l[a];C(this.log,Gc(a,this.getName()),this);this.a&&this.a.clearAttribute(a);return this}catch(b){O(2,b)}};
e.setCategoryExclusion=function(a){try{if(!m(a)||x(y(a)))return D(this.log,N("PubAdsService.setCategoryExclusion",arguments),this),this;$a(this.G,a);C(this.log,Ic(a),this);this.a&&this.a.addPageCategoryExclusion(a);return this}catch(b){O(3,b)}};e.clearCategoryExclusions=function(){try{return this.G=[],C(this.log,Jc(),this),this.a&&this.a.clearPageCategoryExclusions(),this}catch(a){O(4,a)}};
e.disableInitialLoad=function(){try{this.a?D(this.log,pc("disableInitialLoad","pubads"),this):this.L=!0}catch(a){O(5,a)}};e.enableSingleRequest=function(){try{return this.b&&!this.i?D(this.log,oc("enableSingleRequest"),this):0<=z(this.f,"108809057")||0<=z(this.f,"108809056")||(C(this.log,rc("single request"),this),this.i=!0),this.i}catch(a){O(6,a)}};
e.enableAsyncRendering=function(){try{return this.b&&!this.c?D(this.log,oc("enableAsyncRendering"),this):(C(this.log,rc("asynchronous rendering"),this),this.c=!0),this.c}catch(a){O(7,a)}};e.enableSyncRendering=function(){try{if(this.b&&this.c)D(this.log,oc("enableSyncRendering"),this);else{C(this.log,rc("synchronous rendering"),this);this.c=!1;for(var a=this.getSlots(),b=0;b<a.length;++b)a[b].o=!1}return!this.c}catch(c){O(8,c)}};
e.setCentering=function(a){try{C(this.log,sc("centering",String(a)),this),this.H=a}catch(b){O(9,b)}};e.setPublisherProvidedId=function(a){try{return this.b?D(this.log,qc("setPublisherProvidedId",a),this):(C(this.log,sc("PPID",a),this),this.P=a),this}catch(b){O(20,b)}};
e.definePassback=function(a,b){try{if(!m(a)||0>=a.length||!Boolean(b))return F(this.log,N("PubAdsService.definePassback",arguments)),null;var c=kb(a),d=Q(),f=d;f.g||(f.g=!0,f.addFeature("n"+c));Nd(d);return new ke(a,b,this)}catch(g){O(10,g)}};
var le=function(a,b){if(0<=z(a.f,"108809048")){var c=S();a.a||c.b||(a.g||Q().tick("_start_pubads_load_period"),a.g=!0,document.write('<script type="text/javascript" src="'+ib(oe())+'">\x3c/script>'))}else pe(a);a.a?a.a.passback(b):(C(a.log,hc(b.getAdUnitPath(),"GPT"),a,b),a.u.push(b))};e=V.prototype;
e.refresh=function(a,b){try{if(a&&!k(a)||b&&(!ca(b)||b.changeCorrelator&&!n(b.changeCorrelator)))D(this.log,N("PubAdsService.refresh",arguments),this);else{var c=null;if(a&&(c=xe(this,a),!c.length)){D(this.log,N("PubAdsService.refresh",arguments),this);return}if(this.a){C(this.log,yc(),this);var d=!0;void 0!==b&&void 0!==b.changeCorrelator&&(d=b.changeCorrelator);this.a.refresh(c,{changeCorrelator:d})}else this.i?(C(this.log,xc(),this),c?$a(this.j,new me(c,b)):$a(this.j,new me(this.getSlots(),b))):
D(this.log,uc(),this)}}catch(f){O(11,f)}};
e.X=function(a,b){if(a&&!k(a)||b.videoStreamCorrelator&&!p(b.videoStreamCorrelator)||b.videoPodNumber&&!p(b.videoPodNumber)||b.videoPodPosition&&!p(b.videoPodPosition)||b.persistentRoadblocksOnly&&!n(b.persistentRoadblocksOnly)||b.clearUnfilledSlots&&!n(b.clearUnfilledSlots))D(this.log,N("PubAdsService.internalVideoRefresh",arguments),this);else if(this.a){var c=null;if(a&&(c=xe(this,a),!c.length)){F(this.log,tc("internalVideoRefresh"),this);return}C(this.log,yc(),this);this.a.refresh(c,b)}else D(this.log,
uc(),this)};e.enableVideoAds=function(){try{this.D=!0,ve(this)}catch(a){O(12,a)}};e.setVideoContent=function(a,b){try{this.D=!0,this.V=a,this.U=b,ve(this)}catch(c){O(13,c)}};e.getVideoContent=function(){try{return this.a?this.a.getVideoContentInformation():null}catch(a){O(30,a)}};var ve=function(a){a.D&&a.a&&a.a.setVideoContentInformation(a.V,a.U)},we=function(a){a.a&&a.a.setCorrelator(-1==a.o?void 0:a.o)};e=V.prototype;
e.getCorrelator=function(){try{return 0==this.getSlots().length?"not_available":this.a?this.a.getCorrelator():"not_loaded"}catch(a){O(27,a)}};e.setCorrelator=function(a){try{var b=window;if(b.top==b)return this;if(!hb(a)||0===a)return D(this.log,Pc(String(a)),this),this;this.o=a;we(this);return this}catch(c){O(28,c)}};e.updateCorrelator=function(){try{return this.o=-1,we(this),this}catch(a){O(25,a)}};
e.getVideoStreamCorrelator=function(){if(!this.a)return 0;var a=this.a.getVideoStreamCorrelator();return isNaN(a)?0:a};e.isAdRequestFinished=function(){try{return this.a?this.a.isAdRequestFinished():!1}catch(a){O(29,a)}};e.isSlotAPersistentRoadblock=function(a){return this.a?this.a.isSlotAPersistentRoadblock(a):!1};
e.collapseEmptyDivs=function(a){try{return this.m?D(this.log,Ec(),this):this.b?D(this.log,oc("collapseEmptyDivs"),this):(this.C=Boolean(a),C(this.log,Dc(String(this.C)),this),this.m=!0),this.m}catch(b){O(14,b)}};e.clear=function(a){try{if(!this.a)return D(this.log,wc(),this),!1;var b=null;if(a&&(b=xe(this,a),0==b.length))return D(this.log,N("PubAdsService.clear",arguments),this),!1;C(this.log,zc(),this);return this.a.clearSlotContents(b)}catch(c){O(15,c)}};
e.clearNoRefreshState=function(){this.a?(C(this.log,Ac(),this),this.a.clearNoRefreshState()):D(this.log,vc(),this)};
e.setLocation=function(a,b,c){try{var d="role:1 producer:12";if(void 0!==b){if(!p(a))return D(this.log,Bc("Latitude")),this;if(!p(b))return D(this.log,Bc("Longitude")),this;d+=" latlng{ latitude_e7: "+Math.round(1E7*a)+" longitude_e7: "+Math.round(1E7*b)+"}";if(void 0!==c){if(isNaN(c))return D(this.log,Bc("Radius")),this;d+=" radius:"+Math.round(c)}}else{if(50<a.length){var f=a.substring(0,50);D(this.log,Cc(String(a),"50",f));a=f}d+=' loc:"'+a+'"'}var f=d,g;if(ie)g=h.btoa(f);else{d=[];for(b=a=0;b<
f.length;b++){for(var l=f.charCodeAt(b);255<l;)d[a++]=l&255,l>>=8;d[a++]=l}if(!ba(d))throw Error("encodeByteArray takes an array as a parameter");if(!he)for(he={},l=0;65>l;l++)he[l]="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=".charAt(l);l=he;f=[];for(a=0;a<d.length;a+=3){var u=d[a],R=a+1<d.length,E=R?d[a+1]:0,G=a+2<d.length,H=G?d[a+2]:0;b=u>>2;c=(u&3)<<4|E>>4;var ic=(E&15)<<2|H>>6,jc=H&63;G||(jc=64,R||(ic=64));f.push(l[b],l[c],l[ic],l[jc])}g=f.join("")}this.F="a "+g;return this}catch(Ve){O(16,
Ve)}};e.getVersion=function(){return this.a?this.a.getVersion():void 0};e.forceExperiment=function(a){this.b?D(this.log,qc("forceExperiment",a),this):this.f.push(a)};
var W=function(){try{var a=S(),b=Pd(a,"publisher_ads");if(!b){var c=b=new V;a.a[c.getName()]=c}return b}catch(d){O(26,d)}},xe=function(a,b){for(var c=[],d=0;d<b.length;++d){var f=b[d];f instanceof $d?c.push(f):D(a.log,Fc(String(d)),a)}return c},re=function(a){var b=a.c;switch(a.s){case 100:return b?"108809063":"108809066";case 200:return b?"108809064":"108809067";case 400:return b?"108809065":"108809068";default:return b?"108809062":"108809079"}};v("pubads",W);var X=function(){ia.call(this);this.s=!0;this.f=this.o=!1;this.i=0;this.h=this.g=void 0;this.u=this.m=!1;this.l={};this.c={};this.a=!1;this.j={}};ja(X);e=X.prototype;e.set=function(a,b){m(a)&&0<a.length?(this.j[a]=b,C(this.log,Sb(a,String(b),this.getName()),this,null)):D(this.log,Tb(String(a),String(b),this.getName()),this,null);return this};e.get=function(a){return this.j[a]};e.getAttributeKeys=function(){var a=[];r(this.j,function(b,c){a.push(c)});return a};
e.display=function(a,b,c,d){this.enable();a=c?U(a,b,c):U(a,b);a.addService(this);d&&a.setClickUrl(d);ee(a.getSlotId().getDomId())};
e.I=function(){if(this.s){if(!this.u){var a=document,b=document.createElement("script");b.async=!0;b.type="text/javascript";b.src=ye();try{var c=a.getElementsByTagName("script")[0];C(this.log,ac("GPT CompanionAds"),this);this.u=!0;c.parentNode&&c.parentNode.insertBefore(b,c)}catch(d){$c(414,d),F(this.log,bc("GPT CompanionAds"),this)}}}else this.m||(h.document.write('<script type="text/javascript" src="'+ib(ye())+'">\x3c/script>'),this.m=!0)};
e.enableSyncLoading=function(){try{this.s=!1}catch(a){O(402,a)}};e.setRefreshUnfilledSlots=function(a){try{n(a)&&(this.o=a)}catch(b){O(403,b)}};e.setClearUnfilledSlots=function(a){try{n(a)&&(this.f=a)}catch(b){O(412,b)}};e.notifyUnfilledSlots=function(a){try{if(this.o)ze(this,Ae(this,a));else if(this.f){var b=Ae(this,a),c=W();if(c.b)for(c.clear(b),a=0;a<b.length;++a){var d=new zd(b[a],!0,null,c.getName());Ad(c,d)}else F(this.log,Yb("PubAds","clear"))}}catch(f){O(413,f)}};
e.isRoadblockingSupported=function(){var a=W();if(!a.b)return!1;var a=a.getSlots(),b=this.getSlots();if(a.length!=b.length)return!1;for(var c=0;c<b.length;++c){for(var d=!1,f=0;f<a.length;++f)if(b[c]===a[f]){d=!0;break}if(!d)return!1}return!0};e.refreshAllSlots=function(){try{this.o&&ze(this,null)}catch(a){O(404,a)}};e.setVideoSession=function(a,b,c,d){try{this.a=!1,this.i=0,this.h=this.g=void 0,this.i=a,this.g=b,this.h=c,this.a=d}catch(f){O(405,f)}};
e.getDisplayAdsCorrelator=function(){try{return W().getCorrelator()}catch(a){O(406,a)}};e.getVideoStreamCorrelator=function(){try{return W().getVideoStreamCorrelator()}catch(a){O(407,a)}};
var ze=function(a,b){var c=W();if(c.b){if(a.a){if(!a.isRoadblockingSupported()){D(a.log,Xb());return}c.clearNoRefreshState();c.clear()}var d={isVideoRefresh:!0};void 0!==a.i&&(d.videoStreamCorrelator=a.i);a.g&&(d.videoPodNumber=a.g);a.h&&(d.videoPodPosition=a.h);a.a&&(d.persistentRoadblocksOnly=a.a);a.f&&(d.clearUnfilledSlots=a.f);c.X(b,d)}else F(a.log,Yb("PubAds","refresh"))};
X.prototype.isSlotAPersistentRoadblock=function(a){try{var b=W();if(b.b&&de(T(),a))return b.isSlotAPersistentRoadblock(a);F(this.log,Zb());return!1}catch(c){O(408,c)}};var Ae=function(a,b){for(var c=a.getSlotIdMap(),d=[],f=0;f<b.length;++f){var g=b[f];g in c?d.push(c[g]):D(a.log,$b(),a)}return d};X.prototype.getName=function(){return"companion_ads"};var ye=function(){return jb()+"//pagead2.googlesyndication.com/pagead/show_companion_ad.js"};
X.prototype.onImplementationLoaded=function(){try{C(this.log,cc("GPT CompanionAds"),this),this.m=!0}catch(a){O(409,a)}};var Be=function(a,b){var c=b&&b.getSlotId().getId();if(c&&c in a.l&&b.hasWrapperDiv()&&a.b&&!a.isSlotAPersistentRoadblock(b)){b.j=a.l[c];var d=null;a.c.hasOwnProperty(c)&&(d=a.c[c],delete a.c[c]);c=new zd(b,!1,d,a.getName());return ae(b,c)}return!1};X.prototype.w=function(a){Be(this,a)};
X.prototype.fillSlot=function(a,b,c,d){try{return de(T(),a)&&m(b)&&0<b.length?(this.l[a.getSlotId().getId()]=b,null!=c&&null!=d&&(this.c[a.getSlotId().getId()]=[c,d]),Be(this,a)):!1}catch(f){O(410,f)}};X.prototype.slotRenderEnded=function(a,b,c){try{var d=null;null!=b&&null!=c&&(d=[b,c]);var f=new zd(a,!1,d,this.getName());Ad(this,f)}catch(g){O(411,g)}};v("companionAds",function(){try{var a=S(),b=Pd(a,"companion_ads");if(!b){var c=b=new X;a.a[c.getName()]=c}return b}catch(d){O(401,d)}});var Ce=function(){ia.call(this);this.a={};this.c={}};ja(Ce);e=Ce.prototype;e.getName=function(){return"content"};e.set=function(a,b){m(a)&&0<a.length?(this.a[a]=b,C(this.log,Sb(a,String(b),this.getName()),this,null)):D(this.log,Tb(String(a),String(b),this.getName()),this,null);return this};e.get=function(a){return this.a[a]};e.getAttributeKeys=function(){var a=[];r(this.a,function(b,c){a.push(c)});return a};
e.display=function(a,b,c,d){this.enable();a=c?U(a,b,c):U(a,b);a.addService(this);d&&a.setClickUrl(d);ee(a.getSlotId().getDomId())};var De=function(a,b){var c=b&&b.getSlotId().getId();c in a.c&&a.b&&b.hasWrapperDiv()&&!b.h&&(b.j=a.c[c],c=new zd(b,!1,null,a.getName()),ae(b,c))};Ce.prototype.I=function(){for(var a=this.getSlots(),b=0;b<a.length;++b)De(this,a[b])};Ce.prototype.w=function(a){De(this,a)};
Ce.prototype.setContent=function(a,b){try{de(T(),a)&&m(b)&&0<b.length&&(this.c[a.getSlotId().getId()]=b,De(this,a))}catch(c){O(602,c)}};v("content",function(){try{var a=S(),b=Pd(a,"content");if(!b){var c=b=new Ce;a.a[c.getName()]=c}return b}catch(d){O(601,d)}});var Ee=null,Fe=function(){var a=document,b=a.createElement("script");b.type="text/javascript";b.src=jb()+"//publisherconsole.appspot.com/js/loader.js";b.async=!0;(a=a.getElementsByTagName("script")[0])&&a.parentNode&&a.parentNode.insertBefore(b,a)},Ge=function(){var a=window,b=document;if(t()._pubconsole_disable_)return!1;var c;c=document.cookie.split("google_pubconsole=");if(c=2==c.length?c[1].split(";")[0]:"")if(c=c.split("|"),0<c.length&&("1"==c[0]||"0"==c[0]))return!0;S();c=!1;try{c=a.top.document.URL===
b.URL}catch(d){}a=c?b.URL:b.referrer;return null!==ge(a,"google_debug")||null!==ge(a,"google_console")||null!==ge(a,"google_force_console")||null!==ge(a,"googfc")},Ie=function(){try{Ge()&&Fe(),He()}catch(a){O(2002,a)}},He=function(){Ra(function(a){a.source==window&&"gpt_open_pubconsole"==a.data.type&&(a=a.data.slotDomId)&&(googletag&&googletag.console?googletag.console.openConsole(a):(Ee=a,Fe()))})};"complete"===document.readyState?Ie():Ta(window,Ie);
v("disablePublisherConsole",function(){try{t()._pubconsole_disable_=!0}catch(a){O(2001,a)}});v("onPubConsoleJsLoad",function(){Ee&&(googletag.console.openConsole(Ee),Ee=null)});var Je=function(){this.a=[];this.c=!1;this.b=I()};Je.prototype.addSize=function(a,b){try{var c;if(!(c=!Rd(a))){var d=b,f;if(!(f=Rd(d))){var g;if(k(d))a:{for(var l=d.length,u=m(d)?d.split(""):d,d=0;d<l;d++)if(d in u&&!Rd.call(void 0,u[d])){g=!1;break a}g=!0}else g=!1;f=g}c=!f}if(c)return this.c=!0,D(this.b,N("SizeMappingBuilder.addSize",arguments)),this;this.a.push([a,b]);return this}catch(R){O(1601,R)}};
Je.prototype.build=function(){try{if(this.c)return D(this.b,Qb()),null;gb(this.a);return this.a}catch(a){O(1602,a)}};var fb=function(a,b){var c;a:{c=b[0];for(var d=a[0],f=db,g=Math.min(c.length,d.length),l=0;l<g;l++){var u=f(c[l],d[l]);if(0!=u){c=u;break a}}c=db(c.length,d.length)}return c};v("sizeMapping",function(){try{return new Je}catch(a){O(1603,a)}});function Ke(){Wa(document.getElementsByTagName("script"),function(a){var b=a.src;b&&(0<=b.indexOf("/tag/js/gpt.js")||0<=b.indexOf("/tag/js/gpt_mobile.js"))&&a.innerHTML&&!a.googletag_executed&&(a.googletag_executed=!0,eval(a.innerHTML))})}function Le(a,b){var c=a.getElementsByTagName("script");0<c.length&&(c=c[c.length-1],c.parentNode&&c.parentNode.insertBefore(b,c.nextSibling))}
try{var Me=Q();v("apiReady",!0);var Ne=t().cmd;if(!Ne||k(Ne)){var Oe=t().cmd=new ad;Ne&&0<Ne.length&&Oe.push.apply(Oe,Ne)}Ke();var Pe=A("#34#");if(Math.random()<Pe){var Qe=document,Re=Qe.createElement("iframe"),Se;Se=Qe?Qe.parentWindow||Qe.defaultView:window;for(var Te="//tpc.googlesyndication.com/safeframe/1-0-2/html/container.html",Ue,We=Se,Xe=0;We!=We.parent;)Xe++,We=We.parent;(Ue=Xe)&&(Te+="?n="+Ue);Re.src=(Sa(Se)?"https:":"http:")+Te;Re.style.visibility="hidden";Re.style.display="none";Le(Qe,
Re)}var Ye=A("#43#");if(Math.random()<Ye){var Ze=document,$e=Ze.createElement("script");$e.async=!0;$e.type="text/javascript";$e.src=jb()+"//www.googletagservices.com/tag/js/check_359604.js";Le(Ze,$e)}Me.tick("loader_loaded_instant");var Y=Q();if(window.performance&&window.performance.getEntriesByName){var af=jb(),Z=window.performance.getEntriesByName(af+"//www.googletagservices.com/tag/js/gpt.js")[0];Z||(Z=window.performance.getEntriesByName(af+"//www.googletagservices.com/tag/js/gpt_mobile.js")[0]);
Z&&(Y.tickValueAsInterval("rt_st_instant",Z.startTime),Y.tickValueAsInterval("rt_fs_instant",Z.fetchStart),Y.tickValueAsInterval("rt_dns_period",Z.domainLookupEnd-Z.domainLookupStart),Y.tickValueAsInterval("rt_tcp_period",Z.connectEnd-Z.connectStart),Z.secureConnectionStart&&Y.tickValueAsInterval("rt_ssl_period",Z.connectEnd-Z.secureConnectionStart),Y.tickValueAsInterval("rt_rtt_period",Z.responseStart-Z.fetchStart),Y.tickValueAsInterval("rt_tft_period",Z.responseEnd-Z.responseStart),Y.tickValueAsInterval("rt_duration_period",
Z.duration))}}catch(bf){O(2801,bf)};})()
;

    var googletag = googletag || {},
        ybotq = ybotq || [];

    googletag.cmd = googletag.cmd || [];
    cmg.harmony = Harmony();
    cmg.ads.size.expand();

    ybotq.push(function () {
        googletag.cmd.push(function () {
            var urlparams,
                pubads = googletag.pubads();

            pubads.set('page_url', location.href);
            pubads.collapseEmptyDivs(true);

            
                urlparams = cmg.utility.getURLParamDict(location.search);
                cmg.harmony.load({
                    targeting: {
                        wrap_token: location.pathname.split('/'),
                        wrap_url: location.hostname,
                        wrap_key: cmg._(urlparams).keys(),
                        wrap_value: cmg._(urlparams).values(),
                        wrap_meta: cmg.utility.getMetaKeywords()
                    }
                });
            
        });
    });
;
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
    var id = '#cmJanrainAuthLinks';
    var cookie = cmg.query.cookie('ur_name', {path:'/'});
    if (typeof cookie === 'string' && cookie) {
        /* replace profile image, ajc is used because we need jp2 images currently */
        var profileURL = 'http://www.ajc.com/profile/avatar_jp2/' + cookie + '/';
        this.query('.profile-authed').attr('src', profileURL);
        this.query(id+' .cmUserAuthed').show();
        this.query(id+' .cmUserAnonymous').hide();
    } else {
        this.query(id+' .cmUserAuthed').hide();
        this.query(id+' .cmUserAnonymous').show();
    }
    this.query('#cmHeaderUserRegistration').css('visibility', 'visible');
}
cmg.query(document).ready(function(){
    /* Larger mobile devices should be bigger, but still need to match our
     * breakpoints. There does not appear to be a @media @viewport query. */
    if(screen.width >= 768)
        cmg.query('#viewport').attr('content', 'width=600');
    /* fix IE svg bug by setting width. first check ie<11, then 11, then 12 */
    var ua = window.navigator.userAgent;
    if(ua.indexOf("MSIE ") > -1 || ua.indexOf('Trident/') > -1 || ua.indexOf('Edge/') > -1){
        cmg.query.get(cmg.query('.header-logo')[0].src, function(svgxml){
            var svgWidth = svgxml.documentElement.attributes.width.value;
            cmg.query('.header-logo').width(svgWidth);
        });
    }
});
if( typeof window.plate !== 'undefined' ) {
  window.plate.togglePremium = function( authorized ){
    if( authorized || !plate.premium ) {
      cmg.query('.invitation_chunk, .janusNotAuthorized').hide();
      cmg.query('.premium-content').removeClass('premium-content');
    } else{
      cmg.query('.invitation_chunk, .janusNotAuthorized').show();
    }
  };
}