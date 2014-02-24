(function() {
	/**
	 *  Timer module
	 *  Timer will run every 16ms.
	 */
	var requestAFrame = (function() {
		return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame ||
		function(callback) {
			return window.setTimeout(callback, 16);
		};

	})(), cancelAFrame = (function() {
		return window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.oCancelAnimationFrame ||
		function(rid) {
			window.clearTimeout(rid);
		};
	})();
	window.timer = {
		fnList : [],
		_status_play: 'ready',
		_data_recWorks : null,
		_data_recTime : null,
		_data_baseTime : 16,
		
		/**
		 * push a new event to timer
		 * @param {String} name
		 * @param {Function} fn
		 * @param {Number} idx
		 * @param {Number} time
		 */
		_push : function(name, fn, idx, time) {
			var P = this, fnList = P.fnList;
			var nameList = name.split('.');
			var i = 0, ni = nameList.length;
			var j, nj;

			var getPushs = function(tName, tFn, tIdx, tTime, tIsRoot) {
				return tIsRoot ? {
					name : tName,
					fn : tFn,
					idx : tIdx,
					time : tTime || 4,
					frame : 0,
					arr : []
				} : {
					name : tName,
					fn : tFn,
					idx : tIdx,
					arr : []
				};
			};
			var getIdx = function(idx, cArr, isLast) {
				if (isLast) {
					if (idx !== null && idx !== undefined) {
						return idx;
					} else {
						return cArr.length;
					}
				} else {
					return cArr.length;
				}
			};
			var sortDatas = function(arr, isLast, idx) {
				if (isLast && idx !== null && idx !== undefined) {
					arr = arr.sort(function(a, b) {
						return a.idx - b.idx;
					});
				}
			};
			var isLast, isRoot, thisName, thisFind, he, thisPushs;
			for (; i < ni; i++) {
				isLast = i + 1 === ni;
				isRoot = i === 0;
				thisName = nameList[i];
				if (fnList.length === 0) {
					thisPushs = getPushs(thisName, isLast ? fn : null, getIdx(idx, fnList, isLast, isRoot), time, isRoot);
					fnList.push(thisPushs);
					sortDatas(fnList, isLast, idx);
					fnList = thisPushs.arr;
					continue;
				}
				thisFind = false;
				for ( j = 0, nj = fnList.length; j < nj; j++) {
					he = fnList[j];
					if (he.name !== thisName) {
						continue;
					}
					thisFind = true;
					fnList = he.arr;
					break;
				}
				if (!thisFind) {
					thisPushs = getPushs(thisName, isLast ? fn : null, getIdx(idx, fnList, isLast, isRoot), time, isRoot);
					fnList.push(thisPushs);
					sortDatas(fnList, isLast, idx);
					fnList = thisPushs.arr;
				}
			}
			return P;
		},
		/**
		 * remove a event from timer by name.
		 * @param {String} name
		 */
		_remove : function(name) {
			var P = this, he = P.getObj(name, true);
			if (he.objParent && he.objIdx !== null && he.obj) {
				he.objParent.splice(he.objIdx, 1);
			}
		},
		/**
		 * Check if the event is exist by name.
		 * @param {String} name
		 */
		_checkExist : function(name) {
			var P = this, obj = P.getObj(name);
			return obj ? true : false;
		},
		/**
		 * get the child fn list.
		 */
		_getChildFnList: function(oparent) {
			var arr = [], he,
				_gcfl = function(li) {
					var i = 0, ni = li.length;
					for (; i < ni; i++) {
						he = li[i];
						if (!he || !he.arr) {
							continue;
						}
						he.fn && arr.push(he);
						if (he.arr.length !== 0) {
							_gcfl(he.arr);
						}
					}
				};
			_gcfl(oparent.arr);
			return arr;
		},
		/**
		 * loop the fn list. 
		 */
		_round : function() {
			var P = timer, fnList = P.fnList, time = new Date();
			if (P._status_play === 'stop') {
				cancelAFrame(P._data_recWorks);
				return;
			}
			if (time - P._data_recTime < P._data_baseTime) {
				P._data_recWorks = requestAFrame(P._round);
				return;
			}
			
			P._data_recTime = time;
			if (P._status_play !== 'pause') {
				var i = 0, ni = fnList.length, he, hisFn, fns, j, nj;
				for (; i < ni; i++) {
					var he = fnList[i];
					if (!he) {
						continue;
					}
					he.frame++;
					if (he.frame < he.time) {
						continue;
					}
					if (he.arr && he.arr.length !== 0) {
						fns = P._getChildFnList(he);
						j = 0;
						nj = fns.length;;
						for (; j < nj; j++) {
							hisFn = fns[j];
							hisFn.fn && hisFn.fn();
						}
					} else {
						he.fn && he.fn();
					}
					he.frame = 0;
				}
			}
			P._data_recWorks = requestAFrame(P._round);
		},
		/**
		 * attach function, which add a new event to timer 
		 * @param {String} name
		 * @param {Function} fn
		 * @param {Number} idx
		 * @param {Number} time
		 */
		attach : function(name, fn, idx, time) {
			if (this._status_play === 'ready') {
				this.init();
			}
			var P = this, fnList = P.fnList, isEmpty = fnList.length === 0;
			if (isEmpty || !P._checkExist(name)) {
				P._push(name, fn, idx, time);
			} else {
				var he = P.getObj(name);
				if (he && he.fn === null) {
					he.fn = fn;
				}
			}
			return P;
		},
		/**
		 * detach, to remove a timer event by name
		 * @param {String} name
		 */
		detach : function(name) {
			var P = this, fnList = P.fnList, isEmpty = fnList.length === 0;

			if (!isEmpty) {
				P._remove(name);
			}
			return P;
		},
		/**
		 * detach all events (clear the fnList)
		 */
		detachAll : function() {
			var P = this, fnList = P.fnList;
			fnList.length = 0;
			return P;
		},
		/**
		 * set the frame of a event
		 * @param {String} name
		 * @param {Number} frame
		 */
		setFrame : function(name, frame) {
			var P = this, he = P.getObj(name);
			if (he && he.frame) {
				he.frame = frame;
			}
			return P;
		},
		/**
		 * set the idx of a event
		 * @param {String} name
		 * @param {Number} idx
		 */
		setIdx : function(name, idx) {
			var P = this, he = P.getObj(name, true);
			if (he && he.obj.idx !== null) {
				he.obj.idx = idx;
				he.objParent.sort(function(a, b) {
					return a.idx - b.idx;
				});
			}
			return P;
		},
		/**
		 * set the time of a event
		 * @param {String} name
		 * @param {Number} time
		 */
		setTime : function(name, time) {
			var P = this, he = P.getObj(name);
			if (he && he.time) {
				he.time = time;
			}
			return P;
		},
		/**
		 * re-set the function of a event
		 * @param {String} name
		 * @param {Function} fn
		 */
		setFn : function(name, fn) {
			var P = this, he = P.getObj(name);
			if (he && he.fn) {
				he.fn = fn;
			}
			return P;
		},
		/**
		 * to get a event from fnList
		 * @param {String} name
		 * @param {Bloone} doNeedMoreInfo  true/false
		 */
		getObj : function(name, doNeedMoreInfo) {
			var P = this, fnList = P.fnList, isExist = false, obj = null, objParent, objIdx;
			var i = 0, nameList = name.split('.'), ni = nameList.length;
			var j, nj, parentNotFind = false;
			var isLast, thisName, thisFind, he;
			for (; i < ni; i++) {
				isLast = i + 1 === ni;
				thisName = nameList[i];
				if (fnList.length === 0 || parentNotFind) {
					isExist = false;
					objIdx = null;
					objParent = null;
					break;
				}
				thisFind = false;
				for ( j = 0, nj = fnList.length; j < nj; j++) {
					he = fnList[j];
					if (he.name === thisName) {
						if (isLast) {
							objParent = fnList;
							objIdx = j;
							obj = he;
						}
						thisFind = true;
						fnList = he.arr;
						break;
					} else if (he.name !== thisName && j + 1 === nj) {
						parentNotFind = true;
						break;
					}
				}
				if (!thisFind) {
					isExist = false;
				} else if (thisFind && isLast) {
					isExist = true;
				}
			}
			return doNeedMoreInfo ? {
				objParent : objParent,
				objIdx : objIdx,
				obj : obj
			} : obj;
		},
		/**
		 * get a frame of a event by name
		 * @param {String} name
		 */
		getFrame : function(name) {
			var P = this, he = P.getObj(name);
			if (he) {
				return he.frame || false;
			} else {
				return false;
			}
		},
		/**
		 * get a idx of a event by name
		 * @param {String} name
		 */
		getIdx : function(name) {
			var P = this, he = P.getObj(name);
			if (he) {
				return he.idx || false;
			} else {
				return false;
			}
		},
		/**
		 * get a time of a event by name
		 * @param {String} name
		 */
		getTime : function(name) {
			var P = this, he = P.getObj(name);
			if (he) {
				return he.time || false;
			} else {
				return false;
			}
		},
		/**
		 * stop the whole timer at a time/now
		 * @param {Number} time
		 */
		stop : function(time) {
			var P = this;
			if (time) {
				setTimeout(function() {
					P._status_play = 'stop';
				}, time);
			} else {
				P._status_play = 'stop';
			}
			return P;
		},
		/**
		 * Pause the timer at a time/now
		 * @param {Number} time
		 */
		pause : function(time) {
			var P = this;
			if (time) {
				setTimeout(function() {
					P._status_play = 'pause';
				}, time);
			} else {
				P._status_play = 'pause';
			}
			return P;
		},
		/**
		 * continue run the timer at a time/now
		 * @param {Number} time
		 */
		goon : function(time) {
			var P = this;
			if (time) {
				setTimeout(function() {
					P._status_play = 'run';
					P._round();
				}, time);
			} else {
				P._status_play = 'run';
				P._round();
			}
			return P;
		},
		init : function(baseTime) {
			if (this._status_play !== 'ready') {
				return;
			}
			var P = this;
			if (baseTime) {
				P._data_baseTime = baseTime;
			}
			P._data_recTime = new Date();
			P._round();
			P._status_play = 'run';
			return P;
		}
	}
})();
