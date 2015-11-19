
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
                console.error("Passage Quota: localStorage error was thrown", exception);
                return false;
            }
        })();

        var device_is = (function () {
            var user_agent = navigator.userAgent || "";
            return {
                "iPad": user_agent.match(/iPad/i) !== null
            }
        })();

        var WhiteListPQ = function (whitelisted_urls, whitelisted_searches) {
            var search_referrer = SearchReferrer(whitelisted_searches);
            var checked_whitelist;

            return {
                search_referrer: search_referrer,
                check: function () {
                    if (typeof(checked_whitelist) !== "undefined") {
                        return checked_whitelist;
                    } else {
                        if (search_referrer.check()) {
                            checked_whitelist = "referrer";
                            return checked_whitelist;
                        } else {
                            var whitelisted, no_wild,
                                current = add_trailing_slash(window.location.pathname);

                            for (var i=0; i < whitelisted_urls.length; i++) {
                                whitelisted = "^" + whitelisted_urls[i];
                                no_wild = whitelisted.replace(/\*\/?$/, '');
                                if (no_wild === whitelisted) {
                                    whitelisted = add_trailing_slash(whitelisted) + "$";
                                } else {
                                    whitelisted = no_wild;
                                }

                                if (current.match(new RegExp(whitelisted)) !== null) {
                                    checked_whitelist = "white list";
                                    return checked_whitelist;
                                }
                            }
                        }
                        checked_whitelist = false;
                        return checked_whitelist;
                    }
                }
            };

            function SearchReferrer(whitelisted_searches) {
                var checked_search;
                return {
                    check: function () {
                        if (typeof(checked_search) === "undefined") {
                            checked_search = false;
                            if (document.referrer) {
                                var whitelisted, current = add_trailing_slash(document.referrer);
                                for (var i=0; i < whitelisted_searches.length; i++) {
                                    whitelisted = "^http[s]?://" +
                                                  drop_trailing_slash(whitelisted_searches[i]);

                                    if (current.match(new RegExp(whitelisted)) !== null) {
                                        checked_search = true;
                                        break;
                                    }
                                }
                            }
                        }
                        return checked_search;
                    }
                };
            }

            function drop_trailing_slash(url) {
                return url.replace(/\/$/, '');
            }

            function add_trailing_slash(url) {
                return url === "" ? "/" : url.replace(/([^/]$)/, "$1/");
            }
        };

        var PassageQuota = function (quota_params) {
            

            var max_visits = quota_params['max_visits'];
            var period_length = quota_params['period_length'];
            var rolling_period = quota_params['rolling_period'];
            var max_visit_conditions = quota_params['max_visit_conditions'];
            var callbacks_for_current_visit = quota_params['callbacks_for_current_visit'];

            var that = this;
            var saved_post_check_callback = {callback: [],
                                             returned: []};

            this.quota_params = quota_params;
            this.internal_data = {};
            this.allow = false;

            var quota_storage_name = "cmg-quota";
            var quota_xdomain_split_cookie_name = "cmg-quota-xdomain";
            var path = window.location.pathname;

            this.check = function(user_status_pq_authorized, metered_object) {
                

                if (!user_status_pq_authorized) {

                    var visits_obj = get_visits_obj(),
                        visited_paths = visits_obj.visited_paths,
                        max_visits_reached = check_max_visits(visited_paths),
                        callback, visits_left, visits_so_far;

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
                        visits_so_far = count_visited_paths(visited_paths);

                        var current_post_check_callback = get_callback_for_current_visit(visits_left,
                                                                                         visits_so_far);
                        var returned;

                        $(function () {
                            
                            apply_previous_post_check_callback();

                            if (typeof(current_post_check_callback) !== "undefined") {
                                returned = current_post_check_callback(
                                    [],
                                    {visits_so_far: visits_so_far,
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
                    console.error("Passage Quota: error setting cookie expiry date given period_start:",
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
                        if (device_is.iPad) {
                            window.scrollTo(0, 0);
                        }
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
                    var dss_match_link = pq_modal.find(
                        "." + backend_facade.modal_content_names.DSS_MATCH_LINK);
                    var view_offers = backend_facade.modal_content_names.VIEW_OFFERS;

                    pq_modal.find("." + view_offers).click(function () {
                        pq_metrics.track_converted_users(
                            view_offers,
                            pq_modal.attr("id")
                        );
                    });

                    var hide_subscriber_link_and_match_dss = function (profile) {
                        subscriber_link.hide();

                        var user_email;
                        if (profile && profile.userData && profile.userData.email) {
                            user_email = profile.userData.email;
                        } else {
                            user_email = janrain.capture.ui.getReturnExperienceData("email");
                        }

                        if (user_email) {
                            dss_match_link.attr('href', function(i, href) {
                                return href + '&em=' + user_email;
                            });
                        }
                    };

                    
                    if (janrain.has_active_session_strict()) {
                        hide_subscriber_link_and_match_dss();
                    } else {
                        subscriber_link.show();
                    }

                    janrain.events.onCaptureLoginSuccess.addHandler(function(profile) {
                        hide_subscriber_link_and_match_dss(profile);
                    });

                    janrain.events.onCaptureRegistrationSuccess.addHandler(function() {
                        hide_subscriber_link_and_match_dss();
                    });
                },
                modal_found: function(pq_modal, modal_name) {
                    if (pq_modal.length) {
                        return true;
                    }
                    console.error("Passage Quota: " + modal_name + " modal not found");
                    return false;
                },
                fetch_modal: function(modal_selector) {
                    var pq_modal = $("body > " + modal_selector);
                    if (!pq_modal.length) {
                        pq_modal = $(modal_selector);
                        pq_modal.appendTo("body");
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

            function get_callback_for_current_visit(visits_left, visits_so_far) {
                return (callbacks_for_current_visit[visits_left + "-"] ||
                        callbacks_for_current_visit[visits_so_far + "+"]);

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
                
                "ROADBLOCK_MODAL": "pq-passage-quota-block",
                
                "VISITS_COUNT": "pq-passage-quota-count",
                
                "SUBSCRIBER_LINK": "pq-modal-subscriber-link",
                
                "STICKY_MODAL": "pq-passage-quota-sticky",
                
                "VIEW_OFFERS": "pq-passage-quota-view-offers",
                
                "MAX_VISITS": "pq-passage-quota-max",
                
                "WELCOME_MODAL": "pq-passage-quota-welcome",
                
                "DSS_MATCH_LINK": "pq-dss-match",
                
            };
            

            var get_auth_type_from_source = function () {
                return cmg.authorization.auth_type();
            };

            var site_settings = {
                open_house_req_registration: "" === "true",
                reg_visits_threshold: parseInt("5"),
                open_house_enabled: "false" === "true",
                crisis_enabled: "false" === "true",
                whitelisted_urls: "/,\u000D\u000A/services/*, \u000D\u000A/visitor_agreement/, \u000D\u000A/privacy_policy/, \u000D\u000A/weather/, \u000D\u000A/sports/scores/, \u000D\u000A/news/online/faqs\u002Dday\u002Dpass/nZnWy/,\u000D\u000A/category/*,\u000D\u000A/author/*,\u000D\u000A/99\u002Dcent\u002Doffer\u002Dnewsletter/,\u000D\u000A/99\u002Dcent\u002Doffer\u002Dnewsletter\u002Dround\u002D2/,\u000D\u000A/digitalsubscription/",
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

            var whitelisted_urls;
            if (site_settings.whitelisted_urls !== "") {
                whitelisted_urls = site_settings.whitelisted_urls
                                                .replace(/\n/g, '')
                                                .split(",");
                site_settings.whitelisted_urls = [];
                whitelisted_urls.forEach(function (w) {
                    if (w !== "") {
                        site_settings.whitelisted_urls.push(w.trim());
                    }
                });
            } else {
                site_settings.whitelisted_urls = [];
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
                metered_object_type: function (whitelisted, referred, callback) {
                    

                    if(apply_pq_callback(callback, referred)) {
                        return;
                    }

                    if (whitelisted && !referred) {
                        log_exit_reason("visit", whitelisted);
                        return;
                    }

                    if (plate.premium){
                        apply_pq_callback(callback, referred, 'plate.wrap');
                        return;
                    }

                    var object_type, x_object_type,
                        json_return = {};

                    if (typeof(json_return.type_set) !== "undefined") {
                        object_type = json_return.object_type;

                        if (object_type) {
                            apply_pq_callback(callback, referred, object_type);
                        } else {
                            
                            log_exit_reason("object type", "json");
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
                                 apply_pq_callback(callback, referred, x_object_type);
                             } else {
                                 
                                 log_exit_reason("object type", "ajax response header");
                             }
                         });
                    }

                    function apply_pq_callback(callback, referred, object_type) {
                        if (typeof(backend_facade.object_type) === "undefined") {
                            if (typeof(object_type) !== "undefined") {
                                backend_facade.object_type = object_type;
                                apply_if_not_referred(callback, referred, object_type);
                            } else {
                                return false;
                            }
                        } else {
                            apply_if_not_referred(callback, referred, object_type);
                        }
                        return true;
                    }

                    function apply_if_not_referred(callback, referred, object_type) {
                        pq_metrics.track_content_view_type(!!object_type);
                        if (referred) {
                            log_exit_reason("visit", "referrer");
                        } else {
                            callback(object_type);
                        }
                    }

                    function log_exit_reason(subject, reason) {
                        console.info("Passage Quota: exiting because " + subject +
                                     " is not metered as determined by " + reason);
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
                        if (whitelist_pq.search_referrer.check()) {
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
                var meter_janrain_id = {
                    eVar: 'eVar2',
                    prop: 'prop2',
                    desc: "Janrain ID",
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
                    },
                    track_janrain_id: function (janrain_id) {
                        track_non_event(meter_janrain_id, janrain_id);
                    },
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
                track_content_view_type: metrics_interface.track_content_view_type,
                track_janrain_id: metrics_interface.track_janrain_id
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

            
            callbacks_for_current_visit: {"0-": max_reached,
                                          "1-": upsell,
                                          "1+": welcome},
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

        var whitelist_pq = new WhiteListPQ(
            backend_facade.site_settings.whitelisted_urls,
            ["news.google.com", "www.google.com", "www.bing.com"]
        );
        var user_status_pq = new UserStatusPQ(backend_facade);
        var auth_url = 'http://www.mystatesman.com/profile/janus-auth/';

        $(function () {
            
            pq_metrics.track_meter_count();

            pq_metrics.track_content_view_type();

            if (plate.getAliasParameters) {
                var alias = plate.getAliasParameters();
                if (alias && alias.u) {
                    pq_metrics.track_janrain_id(alias.u);
                }
            }
        });

        cmg.authorization.check(auth_url, function(data) {
            activate_pq(data.authorized);
        });

        function activate_pq(authorized) {
            

            user_status_pq.authorized(authorized, function(user_status_pq_authorized) {
                backend_facade.metered_object_type(
                    whitelist_pq.check(),
                    whitelist_pq.search_referrer.check(),
                    function(object_type) {
                        cmg.passage_quota.check(user_status_pq_authorized,
                                                object_type);
                    });
            });
        }

    })((window.cmg || (window.cmg = {})), cmg.query || window.jQuery, window.janrain, window.plate || {});

if(typeof window.plate !== 'undefined' && typeof wrap !== 'undefined' && wrap.hasOwnProperty('premium')) {
  /**
   * Use our own wrap object to set the premium status on pages
   */
  window.plate.premium = wrap.premium;
}
