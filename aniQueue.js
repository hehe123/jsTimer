(function() {
	/**
	 * 
	 * @param {Object} opts
	 * 		fnStart:  {Function}, before you run the queue you want to do
	 * 		fnEnd:    {Function}, after the queue is end you want to do.
	 * 
	 * This function is use for init.
	 */
	function aniQueue(opts) {
		this.queue = [];
			this.idx = 0;
			this.status_play = 'wait';
			this.data_recName = 'aniQueue_' + (+ new Date());
			this.timeline = 0;
			(opts && opts.fnStart) && (this.fnStart = opts.fnStart);
			(opts && opts.fnEnd) && (this.fnEnd = opts.fnEnd);
	}
	aniQueue.prototype = {
		/**
		 * 
		 * @param {Object} o
		 * 			o is a element of queue.
		 * This function is use for check if this element can run.
		 */
		checkCanPlay: function(o){
			if (o.status_isStart && !o.status_isEnd) {
				if (!o.time) {
					return true;
				}
				
				o._ndidx++;
				if (o._ndidx > o.time) {
					o.status_isEnd = true;
					o.fnStop();
					return false;
				}
				return true;
			}
			if (o.depend === '') {
				if (!o.delay && !o.status_isEnd) {
					o.status_isStart = true;
					return true;
				} else if (o.delay && !o.status_isEnd) {
					o._ndidx++;
					if (o._ndidx === o.delay) {
						delete o.delay;
						o._ndidx = 0;
						o.status_isStart = true;
						return true;
					}
					return false;
				}
			}
			var that = this;
			var dependObj = that.find('name', o.depend);
			if (dependObj && dependObj.status_isEnd && !o.status_isEnd) {
				if (!o.delay) {
					o.status_isStart = true;
					return true;
				}
				o._ndidx++;
				if (o._ndidx === o.delay) {
					delete o.delay;
					o._ndidx = 0;
					o.status_isStart = true;
					return true;
				}
				return false;
			}
			return false;
		},
		
		/**
		 * 
		 * @param {String} key
		 * @param {Object} value
		 * 
		 * return {Bloean}
		 * 
		 * find a element in queue.
		 */
		find: function(key, value){
			var i = 0, arr = this.queue, ni = arr.length;
			for (; i < ni; i++) {
				var _ = arr[i];
				if (_[key] && _[key] === value) {
					return _;
				}
			}
			return false;
		},
		/**
		 * 
		 * @param {Object} opts
		 * 			* name:		is the one, can't duplicate.
		 * 			* fn:		the function every time on active to do.
		 * 			depend:		after the depend element action is over, then this will begin to run.
		 * 			time:		run time.
		 * return 
		 * 		{Object} the queue
		 */
		add: function(opts){
			var that = this;
			if (that.find('name', opts.name)) {
				return;
			}
			var nObj = {};
			nObj.name = opts.name;
			nObj.fn = opts.fn;
			nObj.depend = opts.depend || '';
			nObj.delay = opts.delay;
			nObj.time = opts.time || 1;
			nObj.status_isStart = false;
			nObj.status_isEnd = false;
			nObj._ndidx = 0;
			nObj.find = function(name){
				return that.find('name', name);
			};
			nObj.fnStop = that.fnStop(nObj, that);
			if (opts.init) {
				opts.init.call(nObj);
			}
			if (opts.fnEnd) {
				nObj.fnEnd = opts.fnEnd;
			}
			that.queue.push(nObj);
			return that;
		},
		
		fnStop: function(o, p){
			return function(){
				o.status_isStart = false;
				o.status_isEnd = true;
				var i = 0, queue = p.queue, ni = queue.length, isAllEnd = true;
				
				for (; i < ni; i++) {
					if (!queue[i].status_isEnd) {
						isAllEnd = false;
						break;
					}
				}
				if (isAllEnd) {
					p.status_play = 'stop';
				}
				o.fnEnd && o.fnEnd(o);
			};
		},
		/**
		 * stop that queue. can't return
		 */
		stop: function(){
			var that = this;
			that.status_isStart = false;
			that.idx = 0;
			that.queue = [];
			timer && timer.detach(that.data_recName)
			that.fnEnd && that.fnEnd();
		},
		/**
		 * pause the queue, can continue play.
		 * return that queue.
		 */
		pause: function(){
			this.status_play = 'pause';
			return this;
		},
		/**
		 * continue play the queue.
		 * return that queue.
		 */
		play: function(){
			this.status_play = 'play';
			return this;
		},
		/**
		 * queue start to play.
		 * return that queue.
		 */
		start: function(){
			if (this.status_isStart) {
				return;
			}
			var that = this;
			that.status_isStart = true;
			that.fnStart && that.fnStart();
			timer && timer.attach(that.data_recName, function() {
				if (that.status_play === 'stop') {
					that.stop();
					return;
				}
				if (that.status_play === 'pause') {
					return;
				}
				var i = 0, arr = that.queue, ni = arr.length;
				for (; i < ni; i++) {
					var _ = arr[i];
					if (that.checkCanPlay(_)) {
						_.fn && _.fn(_._ndidx, _.time !== undefined ? _.time : undefined, that.timeline);
					}
				}
				that.timeline ++;
			}, null, 2);
			return that;
		}
	};
	window.aniQueue  = aniQueue;
})();
