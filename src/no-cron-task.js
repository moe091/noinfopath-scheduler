var moment = require("moment");

module.exports = (function () {

	function NoCronJob(name, schedule, jobFn) {
		if (typeof (schedule) !== "object") throw new Error("[NoCronTask] `schedule` is a required parameter");

		function properties(obj) {
			var out = {};
			Object.keys(obj).forEach(function (k) {
				out[k] = obj[k];
			});

			return out;
		}

		this.reset = function () {
			this.promise = null;
			this.skipped = true;
			this.message = "";

			this._name = name;
			this._schedule = schedule;
			this._jobFn = jobFn;
			this._duration = moment.duration(schedule.duration, schedule.unit);
			this._durationMilliseconds = this._duration.asMilliseconds();
			this._lastRun = null;
			this._running = false;
		}


		this.reset();

		this.run = function () {
			var _now = moment();
			// Note: _lastRun can be a future date, e.g. when the user adjusted the clock of the device.
			var diff = (this._lastRun && this._lastRun < _now) ? _now - this._lastRun : this._durationMilliseconds;
			// var result = {
			// 	skipped: false,
			// 	promise: null,
			// 	message: "",
			// 	lastRun: _lastRun,
			// 	duration: _durationMilliseconds,
			// 	diff: _lastRun ? Date.now() - _lastRun.valueOf() : _durationMilliseconds,
			// 	running: _running
			// };

			if (diff >= this._duration && !this._running) {
				this.message = "[NoCronTask] Starting " + this._name + ", last run " + (this._lastRun ? moment(this._lastRun).toString() : "never");

				var r = this._jobFn();
				this._running = true;

				if (r && r.then) {
					console.log(this.message);
					this.promise = r.then(function () {
							this._lastRun = moment(new Date()); //move this to after successful run.
							this._running = false;
							console.log("[NoCronTask] Ran " + this._name + ", next check in " + this._duration.humanize());
						}.bind(this))
						.catch(function (err) {
							this._running = false;
							throw err;
						}.bind(this));

					this._skipped = !!this._schedule.parallel;
				} else {
					this.promise = null;
					this.skipped = true;
					this.message = '[NoCronTask] ' + this._name + " not run, next check in " + this._duration.humanize();
				}
			} else {
				this.promise = null;
				this.skipped = true;
			}

			//return properties(this);

		}
	}
	return NoCronJob;
})();
