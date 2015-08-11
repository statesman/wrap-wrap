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
// Ensure that the premium setting from the
// head overrides the one in the body
if(typeof plate !== 'undefined' && typeof plate._premium !== 'undefined') {
  plate.premium = plate._premium;
}

// Add-in access meter code
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
        /*
         *  This function manages and runs all that has to do with
         *  access metering.
         *
         *  An instance of PassageQuota (AccessMetering) is initialized with the following params:
         *
         *  - max_visits:
         *  Max allowed visits before a user is presented with a sign-in form.
         *  This value can be an integer or an array of integers (max visits).
         *  If an array is passed, then the `max_visit_conditions` can be used to set
         *  conditions for when each max setting value is relevant.
         *
         *  - period_length:
         *  The period length after which the meter resets and the visitor is allowed
         *  more visits.
         *
         *  - rolling_period:
         *  Whether the meter should use a rolling perioud, meaning that the page visits are
         *  "rolled" off the meter depending on how long ago they were visited, thus making
         *  room for more allowed visits.
         *
         *  - max_visit_conditions:
         *  An array to be used together with an array type `max_visits`.
         *  If the callback at index i of `max_visit_conditions` returns/evaluates to true,
         *  then the corresponding max visits integer in `max_visits` is used to set the
         *  current max visits allowed.
         *  This param can be used to determine the current max visits based on the visitor's
         *  type of login.
         *
         *  - callbacks_for_visits_left:
         *  An object that maps the number of visits left to a callback that is called
         *  when, after the current page visit, the given number of visits are left for the
         *  visitor.
         */

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

        // // The backend cookie is not currently consumed by the
        // // backend. It may be used in future user stories.
        // var backend_cookie_name = "backend-quota";

        var quota_storage_name = "cmg-quota";
        var quota_xdomain_split_cookie_name = "cmg-quota-xdomain";
        var path = window.location.pathname;

        this.check = function(user_status_pq_authorized, referrer_authorized, metered_object) {
            /*
             * This is the main entry point to the PassageQuota (AccessMetering) instance.
             *
             * - user_status_pq_authorized: a boolean that's passed from the UserStatusPQ instance
             *   to determine whether the current visitor is authorized to view the current
             *   content.
             *
             * - referrer_authorized: a boolean that determines whether the current page visit was
             *   redirected from a search engine.
             *
             * - metered_object: a string that represents the current object type if this type
             *   is metered, and a falsey otherwise.
             *
             *   NOTE that, in the current setup, (i.e. inside backend_facade.metered_object_type)
             *   if the object is either unknown or not metered, then this 'check' function is
             *   skipped. This means that in such cases, the page is loaded w/o the Access Meter
             *   being activated. The reason this param is passed is to allow for the future
             *   possibility of performing Access Meter related actions in cases where an object
             *   type is either unkown or not metered.
             */

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
                            // paths to non-metered objects are never
                            // included in visited paths.

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
                            // If current max changes after user signs in
                            // apply previous callbacks to remove the Access Meter
                            // modal etc.
                            // In this case, page view is still being metered,
                            // but max visits has changed dynamically.

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
                    // If user status is changed after user signs in,
                    // i.e, user is now allowed full access without limits,
                    // then apply previous callbacks to remove the Access Meter
                    // modal etc.
                    // In this case, page view is no longer metered,
                    // and there's no max visits.

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
            // This may not work well when rolling_period=true.
            // For now, it's unlikely that rolling_period will ever be used.

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
            /*
             * This function fetches the visits object that contains all the information
             * about this visitor's past visits from storage. If none exsists in the storage
             * then return a new one.
             */

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
                // The main structure for keeping track of the metering data:

                visits_obj['visited_paths'] = {metered: {},
                                               visited: {}};
                period_start = get_updated_period_start(period_length);

            }

            inject_xdomain_visits(visits_obj.visited_paths);

            visits_obj['period_start'] = period_start;

            // Do some house cleaning on list of metered paths
            // if a path has rolled off the policy meter, then
            // remove it.

            update_path_visits_wrt_period_start(visits_obj.visited_paths,
                                                period_start);

            // Set the cookie expiry date now for later uses.

            that.get_pq_cookie_expiry_date(period_start);

            return visits_obj;
        }

        function save_visits_obj(visits_obj) {
            /*
             * Save the current visit and metering info about this visitor
             * in a visits object in storage.
             */

            visits_obj['period_start'] = visits_obj['period_start'].getTime();

            // Save the full list of this domain's and other domain's paths
            // for later use.

            var visited_paths = visits_obj.visited_paths;

            // Extract other domain's paths and store them in the cross domain
            // cookie. Then, fetch and temporarily attach only this domain's list
            // of paths for the purpose of storing this domain's path visits.

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

            // Reattach the full list of this and other domain's paths to
            // include together in the metering logic later on.

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
            /*
             * Determine the current max visits based on `max_visit_conditions` and
             * `max_visits`.
             *
             * If the callback at index i of `max_visit_conditions` returns true,
             * then the corresponding max visits integer in `max_visits` is used to set the
             * current max visits allowed.
             */

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
            /*
             * Include the current visit in the visits object, i.e.
             * "meter" the current visit.
             */

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
            /*
             * The cross domain split cookie is a cookie at the e.g. ".myajc.com"
             * level that keeps track of all the visits that happen on different
             * domains such as "games.myajc.com", "blogs.myajc.com" and "www.myajc.com".
             * This cookie is meant to be small, so it doesn't store urls. It only stores
             * timestamps. E.g.
             * {"www.myajc.com" : [1234344453, 454534534],
             *  "blogs.myajc.com": [34534555, 456456546546]}
             */

            var xdomain_stored_visits = $.cookie(quota_xdomain_split_cookie_name,
                                                 {path: '/',
                                                  domain: '.' + root_domain});
            /*
             * For each site visit that happened on a different domain, include
             * the visit here with the rest of the visits. Since we're not storing
             * urls in the cross domain split cookie, we only include its timestamp
             * and in place of its url, we use a combination of the visits domain
             * and timestamp as the key. E.g.
             * {"blogs.myajc.com+234435435": 234435435}
             */

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
            /*
             * Save the current metered visits in the cross domain split cookie so
             * that these visits are counted for when the user visits other
             * domians such as "games.myajc.com".
             */

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
            /*
             * The following is how expiry of a metered page is deteremined:
             *
             *     The beginning of each metering period is recorded everytime the
             * Access Meter is checked. Every page view's first view is recorded for
             * the page the first time the page is viewed in include_path_visit().
             *
             * Everytime the Access Meter is checked, the beginning of metering period
             * is updated and each recorded page view is compared against this updated
             * date. If the page view's date is no longer within the current metering
             * period (i.e. page view's date is before current metering period's
             * beginning), then the page is removed from the list of metered pages.
             */

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
            /*
             * Apply callback for when the state of the user's login status
             * changes dynamically and thus requires the access meter to respond
             * accordingly, e.g. when an anonymous visitor changes login status by
             * signing in.
             */

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
        /*
         * An instance of UserStatusPQ (PQ: Passage Quota aka Access Meter) is used by the
         * access meter to determine current visitor's login status.
         *
         * It interfaces Janrain's login status along with any authentication backends
         * i.e. janus-auth.
         *
         * It is initialized with an instance of the backend_facade from which the following
         * are used:
         * - get_auth_type: a function that returns an auth type that is mapped
         * in `check_status_from_auth_type` to user statuses that are relevant to the
         * access meter.
         * - site_settings: a mapping that returns current site setting values.
         */

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
            /*
             * We check for a Janrain session and whether an active session has
             * been found. This info is used to determine if the visitor
             * is registered as a user or not.
             */

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
            /*
             * The reason this is necessary is that in order to fully determine
             * user status, we need all the info gathered from several events (e.g.
             * janrain SessionFound, or cmg_login_complete) and callbacks (e.g.
             * authorization.check). But the order these events/callbacks are called is
             * not guaranteed and when for example authorization.check is complete, janrain
             * may not be ready (i.e. no janrain.events has been set up yet).
             *
             * The apply_on_ready function here allows the Access Meter to wait until all
             * relevant events/callbacks have been completed, and only then will it
             * continue with the Metering policy.
             */

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
                // This is to verify that the event consolidator completed in the alotted time.
                // This setTimeout block does not play any part in the Access Meter and is for
                // logging purposes only.

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
                    /*
                     * If authorization.check returned data.authorized=true, then
                     * allow access without further delay considering the following:
                     *
                     * - If site setting crisis_enabled=TRUE, then there should be
                     * no Access Meter blocking the view.
                     *
                     * - If open_house_req_registration=TRUE, then all visits are authorized
                     * by the backend, however, we still need to meter the visits. So in this case
                     * there's need for more Access Metering logic.
                     *   Otherwise, if we're not requiring open house registration, then allow
                     * the visit without further metering logic.
                     */

                    pq_callback(true);

                } else {
                    var auth_type = get_auth_type();

                    if (!verify_soundness(auth_type)) {
                        console.error("UserStatusPQ: exiting due to unsound status");
                        return;
                    }

                    /*
                     * In Open House Registration mode we authorize all non-anonymous visitors, i.e.:
                     * - authorized: registered, subscribed and staff users,
                     * - NOT authorized: anonymous visitors
                     * Note that in this case, the backend authorized all visits. So it's up to the
                     * Access Meter to further allow/block a visit.
                     *
                     * Otherwise the Access Meter only authorizes subscribed users, i.e.:
                     * - authorized: subscribed and staff users,
                     * - NOT authorized: anonymous visitors, registered users.
                     */

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
        /*
         * This object interfaces janus's backend settings.
         * Its purpose is to decouple the access meter from janus, so that
         * all the django template tags and janus/medley communications
         * are placed here.
         */

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
            open_house_req_registration: false,
            reg_visits_threshold: 5,
            open_house_enabled: false,
            crisis_enabled: false,
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
                /*
                 * This function uses the `metered_object_type` django tag to check
                 * current page's content type. If unsuccessful (in case of documents
                 * and maps), then it makes an AJAX GET call to extract the
                 * current page's object type from the response header.
                 * Once the object type is retrieved successfully, then the callback
                 * is called with the object type as an arg.
                 */

                if (plate.premium){
                    apply_pq_callback(callback, 'plate.wrap');
                    return;
                }

               /*
                * This block is commented out as it pertains to non-wrapped (plate-less) pages
                *

                if (typeof(backend_facade.object_type) !== "undefined") {
                    callback(backend_facade.object_type);
                    return;
                }

                var object_type, x_object_type,
                json_return = {% metered_object_type %};

                if (typeof(json_return.type_set) !== "undefined") {
                    object_type = json_return.object_type;

                    if (object_type) {
                        apply_pq_callback(callback, object_type);
                    } else {
                        // else, we don't activate the Access Meter at all
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
                                // else, we don't activate the Access Meter at all
                                console.info(
                                    "Passage Quota: exiting because object type is not metered as determined by ajax call");
                            }
                        });
                }
                ************************************** */

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
            /*
             * The following DDO variable names are not yet official.
             * TODO: Finalize DDO variables for the Access Meter
             */

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
            /*
             * All code encapsulated within this feature flag block should be able
             * to be deleted with no effect on DTM's functionality, and no
             * references to omniture of any kind should be outside of this block.
             */

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
                        // What happens inside pre_cookie will be saved
                        // in the metrics cookie.

                        value = params.pre_cookie(value);
                    }

                    value = check_with_cookie(params.cookie, value);
                    if (typeof(value) === "undefined" || value === null) {
                        value = params.default_val;
                    }

                    if (typeof(params.pre_capture) === "function") {
                        // What happens inside pre_capture stays in pre_capture and
                        // is NOT saved in the metrics cookie.

                        value = params.pre_capture(value);
                    }
                    metrics_obj[params.eVar] = metrics_obj[params.prop] = value;
                    captured_metrics[params.eVar] = captured_metrics[params.prop] = value;
                }
            }

            metrics_interface = {
                track_converted_users: function(elem, modal_value) {
                    // Note:  Dependent on the new "User Type" variable planned to be
                    // added to the standard metrics block:  User Type prop48=eVar48
                    // the user type prop/eVar is used in:
                    // medley-templates/templates/common/web/analytics/omniture_page_base.html

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
        // Note that the visits left mapping below is for number of
        // visits left AFTER the current visit was metered and counted.
        // So "4: welcome" is really counting 4 + current visit,
        // i.e. 5 visits till we hit the roadblock.
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
        // Track saved meter count metric from cookie, to be overwritten by
        // the Access Meter later in the call stack if an update is available.
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
        // Note: this callback is called again once user logs in.
        // Callbacks that are included with authorization.check
        // are cached and called again after user changes login status.

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