! function() {
    "use strict";
    angular.module("angularjs-datetime-picker", []);
    var e = function(e) {
            "string" == typeof e && (e = new Date(e));
            var t = new Date(e.getFullYear(), 0, 1),
                a = new Date(e.getFullYear(), 6, 1),
                n = Math.max(t.getTimezoneOffset(), a.getTimezoneOffset()),
                l = e.getTimezoneOffset() < n,
                i = l ? n - 60 : n,
                r = i >= 0 ? "-" : "+";
            return r + ("0" + i / 60).slice(-2) + ":" + ("0" + i % 60).slice(-2)
        },
        t = function(e, t, a) {
            var n = a("DatetimePickerCtrl");
            return {
                open: function(e) {
                    n.openDatetimePicker(e)
                },
                close: function() {
                    n.closeDatetimePicker()
                }
            }
        };
    t.$inject = ["$compile", "$document", "$controller"], angular.module("angularjs-datetime-picker").factory("DatetimePicker", t);
    var a = function(e, t) {
        var a, n = this,
            l = function(e) {
                e && e.remove(), t[0].body.removeEventListener("click", n.closeDatetimePicker)
            };
        this.openDatetimePicker = function(n) {
            this.closeDatetimePicker();
            var l = angular.element("<div datetime-picker-popup ng-cloak></div>");
            n.dateFormat && l.attr("date-format", n.dateFormat), n.ngModel && l.attr("ng-model", n.ngModel), n.year && l.attr("year", parseInt(n.year)), n.month && l.attr("month", parseInt(n.month)), n.day && l.attr("day", parseInt(n.day)), n.hour && l.attr("hour", parseInt(n.hour)), n.minute && l.attr("minute", parseInt(n.minute)), ("" === n.dateOnly || n.dateOnly === !0) && l.attr("date-only", "true"), "false" === n.closeOnSelect && l.attr("close-on-select", "false");
            var i = n.triggerEl;
            n.scope = n.scope || angular.element(i).scope(), a = e(l)(n.scope)[0], a.triggerEl = n.triggerEl, t[0].body.appendChild(a);
            var r = i.getBoundingClientRect();
            n.scope.$apply();
            var o = a.getBoundingClientRect();
            a.style.position = "absolute", a.style.left = r.width > o.width ? r.left + r.width - o.width + window.scrollX + "px" : r.left + window.scrollX + "px", a.style.top = r.top < 300 || window.innerHeight - r.bottom > 300 ? r.bottom + window.scrollY + "px" : r.top - o.height + window.scrollY + "px", t[0].body.addEventListener("click", this.closeDatetimePicker)
        }, this.closeDatetimePicker = function(e) {
            var a = e && e.target,
                n = t[0].querySelector("div[datetime-picker-popup]");
            e && a ? a.hasAttribute("datetime-picker") || n && n.contains(a) || l(n) : l(n)
        }
    };
    a.$inject = ["$compile", "$document"], angular.module("angularjs-datetime-picker").controller("DatetimePickerCtrl", a);
    var n = ['<div class="angularjs-datetime-picker">', '  <div class="adp-month">', '    <button type="button" class="adp-prev" ng-click="addMonth(-1)">&laquo;</button>', '    <span title="{{months[mv.month].fullName}}">{{months[mv.month].shortName}}</span> {{mv.year}}', '    <button type="button" class="adp-next" ng-click="addMonth(1)">&raquo;</button>', "  </div>", '  <div class="adp-days" ng-click="setDate($event)">', '    <div class="adp-day-of-week" ng-repeat="dayOfWeek in ::daysOfWeek" title="{{dayOfWeek.fullName}}">{{::dayOfWeek.firstLetter}}</div>', '    <div class="adp-day" ng-show="mv.leadingDays.length < 7" ng-repeat="day in mv.leadingDays">{{::day}}</div>', '    <div class="adp-day selectable" ng-repeat="day in mv.days" ', "      today=\"{{today}}\" d2=\"{{mv.year + '-' + (mv.month + 1) + '-' + day}}\"", '      ng-class="{', "        selected: (day == selectedDay),", "        today: (today == (mv.year + '-' + (mv.month + 1) + '-' + day)),", "        weekend: (mv.leadingDays.length + day)%7 == 1 || (mv.leadingDays.length + day)%7 == 0", '      }">', "      {{::day}}", "    </div>", '    <div class="adp-day" ng-show="mv.trailingDays.length < 7" ng-repeat="day in mv.trailingDays">{{::day}}</div>', "  </div>", '  <div class="adp-days" id="adp-time"> ', '    <label class="timeLabel">Time:</label> <span class="timeValue">{{("0"+inputHour).slice(-2)}} : {{("0"+inputMinute).slice(-2)}}</span><br/>', '    <label class="hourLabel">Hour:</label> <input class="hourInput" type="range" min="0" max="23" ng-model="inputHour" ng-change="updateNgModel()" />', '    <label class="minutesLabel">Min:</label> <input class="minutesInput" type="range" min="0" max="59" ng-model="inputMinute"  ng-change="updateNgModel()"/> ', "  </div> ", "</div>"].join("\n"),
        l = function(t, a) {
            var l, i, r, o, d = function() {
                    l = [], i = [], r = [], o = 0;
                    for (var e = 1; 31 >= e; e++) l.push(e);
                    for (var e = 0; 12 > e; e++) i.push({
                        fullName: t.DATETIME_FORMATS.MONTH[e],
                        shortName: t.DATETIME_FORMATS.SHORTMONTH[e]
                    });
                    for (var e = 0; 7 > e; e++) {
                        var a = t.DATETIME_FORMATS.DAY[(e + o) % 7];
                        r.push({
                            fullName: a,
                            firstLetter: a.substr(0, 1)
                        })
                    }
                    o = 0
                },
                s = function(e, t) {
                    t > 11 ? e++ : 0 > t && e--, t = (t + 12) % 12;
                    var a = new Date(e, t, 1),
                        n = new Date(e, t + 1, 0),
                        i = new Date(e, t, 0),
                        r = n.getDate(),
                        d = i.getDate(),
                        s = a.getDay(),
                        c = (s - o + 7) % 7 || 7,
                        u = l.slice(0, 42 - (c + r));
                    return u.length > 7 && (u = u.slice(0, u.length - 7)), {
                        year: e,
                        month: t,
                        days: l.slice(0, r),
                        leadingDays: l.slice(-c - (31 - d), d),
                        trailingDays: u
                    }
                },
                c = function(t, n, l, o) {
                    d();
                    var c = l.dateFormat || "short";
                    t.months = i, t.daysOfWeek = r, t.inputHour, t.inputMinute, t.dateOnly === !0 && (n[0].querySelector("#adp-time").style.display = "none"), t.$applyAsync(function() {
                        if (o.triggerEl = angular.element(n[0].triggerEl), l.ngModel) {
                            var i = "" + o.triggerEl.scope().$eval(l.ngModel);
                            if (i) {
                                i.match(/[0-9]{2}:/) || (i += " 00:00:00"), i = i.replace(/([0-9]{2}-[0-9]{2})-([0-9]{4})/, "$2-$1"), i = i.replace(/([\/-][0-9]{2,4})\ ([0-9]{2}\:[0-9]{2}\:)/, "$1T$2"), i = i.replace(/EDT|EST|CDT|CST|MDT|PDT|PST|UT|GMT/g, ""), i = i.replace(/\s*\(\)\s*/, ""), i = i.replace(/[\-\+][0-9]{2}:?[0-9]{2}$/, ""), i += e(i);
                                var r = new Date(i);
                                t.selectedDate = new Date(r.getFullYear(), r.getMonth(), r.getDate(), r.getHours(), r.getMinutes(), r.getSeconds())
                            }
                        }
                        if (!t.selectedDate || isNaN(t.selectedDate.getTime())) {
                            var d = new Date,
                                c = t.year || d.getFullYear(),
                                u = t.month ? t.month - 1 : d.getMonth(),
                                m = t.day || d.getDate(),
                                g = t.hour || d.getHours(),
                                p = t.minute || d.getMinutes();
                            t.selectedDate = new Date(c, u, m, g, p, 0)
                        }
                        t.inputHour = t.selectedDate.getHours(), t.inputMinute = t.selectedDate.getMinutes(), t.mv = s(t.selectedDate.getFullYear(), t.selectedDate.getMonth()), t.today = a(new Date, "yyyy-M-d"), t.selectedDay = t.mv.year == t.selectedDate.getFullYear() && t.mv.month == t.selectedDate.getMonth() ? t.selectedDate.getDate() : null
                    }), t.addMonth = function(e) {
                        t.mv = s(t.mv.year, t.mv.month + e)
                    }, t.setDate = function(e) {
                        var a = angular.element(e.target)[0]; - 1 !== a.className.indexOf("selectable") && (t.updateNgModel(parseInt(a.innerHTML)), t.closeOnSelect !== !1 && o.closeDatetimePicker())
                    }, t.updateNgModel = function(e) {
                        if (e = e ? e : t.selectedDate.getDate(), t.selectedDate = new Date(t.mv.year, t.mv.month, e, t.inputHour, t.inputMinute, 0), t.selectedDay = t.selectedDate.getDate(), l.ngModel) {
                            var n, i = o.triggerEl.scope();
                            n = i.$eval(l.ngModel) && "Date" === i.$eval(l.ngModel).constructor.name ? new Date(a(t.selectedDate, c)) : a(t.selectedDate, c), i.$eval(l.ngModel + "= date", {
                                date: n
                            })
                        }
                    }, t.$on("$destroy", o.closeDatetimePicker)
                };
            return {
                restrict: "A",
                template: n,
                controller: "DatetimePickerCtrl",
                replace: !0,
                scope: {
                    year: "=",
                    month: "=",
                    day: "=",
                    hour: "=",
                    minute: "=",
                    dateOnly: "=",
                    closeOnSelect: "="
                },
                link: c
            }
        };
    l.$inject = ["$locale", "dateFilter"], angular.module("angularjs-datetime-picker").directive("datetimePickerPopup", l);
    var i = function(e, t) {
        return {
            require: "ngModel",
            link: function(e, a, n, l) {
                e.$watch(n.ngModel, function(e) {
                    if (e && "" != e) {
                        var t = new Date(e);
                        l.$setValidity("date", t ? !0 : !1);
                        var a = new Date;
                        n.hasOwnProperty("futureOnly") && l.$setValidity("future-only", a > t ? !1 : !0)
                    }
                }), a[0].addEventListener("click", function() {
                    t.open({
                        triggerEl: a[0],
                        dateFormat: n.dateFormat,
                        ngModel: n.ngModel,
                        year: n.year,
                        month: n.month,
                        day: n.day,
                        hour: n.hour,
                        minute: n.minute,
                        dateOnly: n.dateOnly,
                        futureOnly: n.futureOnly,
                        closeOnSelect: n.closeOnSelect
                    })
                })
            }
        }
    };
    i.$inject = ["$parse", "DatetimePicker"], angular.module("angularjs-datetime-picker").directive("datetimePicker", i)
}();