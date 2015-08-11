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