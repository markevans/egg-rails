(function() {
  var ancestorChain, delegate, eggIDCounter, instanceMethods, rootKeyFor,
    __slice = Array.prototype.slice,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = Object.prototype.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; };

  Object.extend = function() {
    var key, obj, otherObj, otherObjs, value, _i, _len;
    obj = arguments[0], otherObjs = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    for (_i = 0, _len = otherObjs.length; _i < _len; _i++) {
      otherObj = otherObjs[_i];
      for (key in otherObj) {
        value = otherObj[key];
        obj[key] = value;
      }
    }
    return obj;
  };

  Object.slice = function(obj, keys) {
    var key, newObj, _i, _len;
    newObj = {};
    for (_i = 0, _len = keys.length; _i < _len; _i++) {
      key = keys[_i];
      newObj[key] = obj[key];
    }
    return newObj;
  };

  this.egg = {};

  ancestorChain = function(obj) {
    if (obj.constructor.ancestors) {
      return [obj].concat(__slice.call(obj.constructor.ancestors()));
    } else {
      return [obj];
    }
  };

  egg.Subscription = (function() {

    function Subscription(eventChannel, callback, filter) {
      this.eventChannel = eventChannel;
      this.callback = callback;
      this.filter = filter;
      this.index = eventChannel.length;
      this.enable();
    }

    Subscription.prototype.enable = function() {
      return this.eventChannel[this.index] = this;
    };

    Subscription.prototype.cancel = function() {
      return delete this.eventChannel[this.index];
    };

    return Subscription;

  })();

  egg.Event = (function() {

    function Event(name, params, sender) {
      this.name = name;
      this.params = params;
      this.sender = sender;
      this.shouldBubble = true;
    }

    Event.prototype.preventBubbling = function() {
      return this.shouldBubble = false;
    };

    return Event;

  })();

  egg.Publisher = (function() {

    function Publisher() {
      this.on = __bind(this.on, this);
      this.emit = __bind(this.emit, this);
      this.silently = __bind(this.silently, this);      this.globalChannel = {};
      this.channels = {};
      this.silent = false;
    }

    Publisher.prototype.silently = function(callback, context) {
      this.silent = true;
      callback.call(context);
      return this.silent = false;
    };

    Publisher.prototype.emit = function(name, params, sender) {
      var event, obj, _i, _len, _ref;
      if (this.silent) {
        return false;
      } else {
        event = new egg.Event(name, params, sender);
        if (sender) {
          _ref = ancestorChain(sender);
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            obj = _ref[_i];
            if (!event.shouldBubble) break;
            this.runChannelCallbacks(this.channels[obj.eggID()], event);
          }
        }
        if (event.shouldBubble) {
          this.runChannelCallbacks(this.globalChannel, event);
        }
        return true;
      }
    };

    Publisher.prototype.on = function(name, callback, filter, sender) {
      var channel, _base, _name, _ref;
      channel = sender ? (_ref = (_base = this.channels)[_name = sender.eggID()]) != null ? _ref : _base[_name] = {} : this.globalChannel;
      if (channel[name] == null) channel[name] = [];
      return new egg.Subscription(channel[name], callback, filter);
    };

    Publisher.prototype.runChannelCallbacks = function(channel, event) {
      if (channel) {
        this.runCallbacks(channel[event.name], event);
        return this.runCallbacks(channel['*'], event);
      }
    };

    Publisher.prototype.runCallbacks = function(subscriptions, event) {
      var sub, _i, _len, _results;
      if (subscriptions) {
        _results = [];
        for (_i = 0, _len = subscriptions.length; _i < _len; _i++) {
          sub = subscriptions[_i];
          if (sub && (!sub.filter || sub.filter(event))) {
            _results.push(sub.callback(event.params, event, sub));
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      }
    };

    return Publisher;

  })();

  egg.publisher = new egg.Publisher;

  egg.emit = egg.publisher.emit;

  egg.on = egg.publisher.on;

  egg.silently = egg.publisher.silently;

  instanceMethods = {
    emit: function(name, params) {
      return egg.publisher.emit(name, params, this);
    },
    on: function() {
      var args, callback, filter, name, _ref, _results;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (args.length === 1) {
        _ref = args[0];
        _results = [];
        for (name in _ref) {
          callback = _ref[name];
          _results.push(egg.publisher.on(name, callback, null, this));
        }
        return _results;
      } else {
        name = args[0], callback = args[1], filter = args[2];
        return egg.publisher.on(name, callback, filter, this);
      }
    },
    silently: function(callback) {
      return egg.silently(callback, this);
    }
  };

  egg.Events = function(klass) {
    klass.include(instanceMethods);
    return klass.extend(instanceMethods);
  };

  eggIDCounter = 0;

  delegate = function(object, ownMethod, methods) {
    var method, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = methods.length; _i < _len; _i++) {
      method = methods[_i];
      _results.push((function() {
        var meth;
        meth = method;
        return object[meth] = function() {
          var args, _ref;
          args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
          return (_ref = this[ownMethod]())[meth].apply(_ref, args);
        };
      })());
    }
    return _results;
  };

  egg.Base = (function() {

    Base.include = function(obj) {
      return Object.extend(this.prototype, obj);
    };

    Base.extend = function(obj) {
      return Object.extend(this, obj);
    };

    Base.use = function() {
      var args, plugin;
      plugin = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      return plugin.apply(null, [this].concat(__slice.call(args)));
    };

    Base.use(egg.Events);

    Base.sub = function(name, definition) {
      if (!name.match(/^[A-Z]\w+$/)) throw "invalid class name '" + name + "'";
      eval("var childClass = function " + name + "(){ " + name + ".__super__.constructor.apply(this, arguments) }");
      __extends(childClass, this);
      if (definition) definition.call(childClass, childClass);
      return childClass;
    };

    Base.parentClass = function() {
      var _ref;
      return (_ref = this.__super__) != null ? _ref.constructor : void 0;
    };

    Base.allClassInstanceVars = {};

    Base.classInstanceVars = function() {
      var _base, _name, _ref;
      return (_ref = (_base = this.allClassInstanceVars)[_name = this.name]) != null ? _ref : _base[_name] = {};
    };

    Base.ancestors = function() {
      var parent, _base, _ref;
      return (_ref = (_base = this.classInstanceVars()).ancestors) != null ? _ref : _base.ancestors = (parent = this.parentClass(), parent ? [this].concat(parent.ancestors()) : [this]);
    };

    Base.delegateInstanceMethodsTo = function(ownMethod, methods) {
      return delegate(this.prototype, ownMethod, methods);
    };

    Base.delegateTo = function(ownMethod, methods) {
      return delegate(this, ownMethod, methods);
    };

    Base.create = function(opts) {
      if (opts == null) opts = {};
      return new this(opts);
    };

    Base.init = function(callback) {
      return this.on('init', function(params) {
        return callback.call(params.instance, params.opts);
      });
    };

    Base.destroy = function(callback) {
      return this.on('destroy', function(params) {
        return callback.call(params.instance, params.opts);
      });
    };

    function Base(opts) {
      if (opts == null) opts = {};
      this.emit('init', {
        opts: opts,
        instance: this
      });
    }

    Base.prototype.destroy = function(opts) {
      if (opts == null) opts = {};
      return this.emit('destroy', {
        opts: opts,
        instance: this
      });
    };

    Base.prototype.className = function() {
      return this.constructor.name;
    };

    Base.eggID = function() {
      return this.name;
    };

    Base.prototype.eggID = function() {
      var _ref;
      return (_ref = this._eggID) != null ? _ref : this._eggID = "" + this.constructor.name + "-" + (eggIDCounter++);
    };

    return Base;

  })();

  egg.Set = (function() {

    function Set(opts) {
      var item, _i, _len, _ref;
      if (opts == null) opts = {};
      this.items = {};
      if (opts.items) {
        _ref = opts.items;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          item = _ref[_i];
          this.items[item.eggID()] = item;
        }
      }
      this.sorter = opts.sorter;
    }

    Set.prototype.add = function(item) {
      var id;
      id = item.eggID();
      if (!this.items[id]) {
        this.items[id] = item;
        return delete this.array;
      }
    };

    Set.prototype.remove = function(item) {
      var id;
      id = item.eggID();
      if (this.items[id]) {
        delete this.items[id];
        return delete this.array;
      }
    };

    Set.prototype.count = function() {
      return this.toArray().length;
    };

    Set.prototype.has = function(item) {
      return item.eggID && (item.eggID() in this.items);
    };

    Set.prototype.filter = function(callback) {
      var set,
        _this = this;
      set = new this.constructor;
      this.forEach(function(item) {
        if (callback(item)) return set.add(item);
      });
      return set;
    };

    Set.prototype.asc = function(attr) {
      return new this.constructor({
        items: this.toArray(),
        sorter: function(a, b) {
          if (a.get(attr) > b.get(attr)) {
            return 1;
          } else {
            return -1;
          }
        }
      });
    };

    Set.prototype.desc = function(attr) {
      return new this.constructor({
        items: this.toArray(),
        sorter: function(a, b) {
          if (a.get(attr) < b.get(attr)) {
            return 1;
          } else {
            return -1;
          }
        }
      });
    };

    Set.prototype.sort = function(sorter) {
      return new this.constructor({
        items: this.toArray(),
        sorter: sorter
      });
    };

    Set.prototype.toArray = function() {
      var array, k, v, _ref;
      if (this.array) return this.array;
      array = [];
      _ref = this.items;
      for (k in _ref) {
        v = _ref[k];
        array.push(v);
      }
      return this.array = this.sorter ? array.sort(this.sorter) : array;
    };

    Set.prototype.forEach = function(callback) {
      var array, i, item, _len, _ref, _results;
      array = this.toArray();
      _ref = this.toArray();
      _results = [];
      for (i = 0, _len = _ref.length; i < _len; i++) {
        item = _ref[i];
        _results.push(callback(item, i, array));
      }
      return _results;
    };

    Set.prototype.first = function() {
      return this.toArray()[0];
    };

    Set.prototype.pluck = function(attr) {
      var array, model, _i, _len, _ref, _results;
      array = [];
      _ref = this.toArray();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        model = _ref[_i];
        _results.push(array.push(model.get(attr)));
      }
      return _results;
    };

    Set.prototype.sample = function(attr) {
      var array, index, model;
      array = this.toArray();
      index = Math.floor(Math.random() * array.length);
      model = array[index];
      if (attr) {
        return model.get(attr);
      } else {
        return model;
      }
    };

    Set.prototype.toJSON = function() {
      var array;
      array = [];
      this.forEach(function(model) {
        return array.push(model.toJSON());
      });
      return array;
    };

    return Set;

  })();

  egg.RestApi = (function(_super) {

    __extends(RestApi, _super);

    function RestApi() {
      RestApi.__super__.constructor.apply(this, arguments);
    }

    RestApi.prototype.commonAjaxOpts = {
      dataType: 'json'
    };

    RestApi.init(function(opts) {
      return this.commonAjaxOpts = Object.extend({
        headers: opts.headers
      }, this.commonAjaxOpts);
    });

    RestApi.prototype.load = function(klass, opts) {
      var url;
      if (opts == null) opts = {};
      url = opts.url || klass.url();
      return this.get(url, opts.params, function(data) {
        var attrs, models, _i, _len, _results;
        models = [];
        _results = [];
        for (_i = 0, _len = data.length; _i < _len; _i++) {
          attrs = data[_i];
          _results.push(models.push(klass.create({
            attrs: attrs
          })));
        }
        return _results;
      }, 'load');
    };

    RestApi.prototype.save = function(model, opts) {
      if (opts == null) opts = {};
      if (model.isPersisted()) {
        return this.update(model, opts);
      } else {
        return this.create(model, opts);
      }
    };

    RestApi.prototype.sync = function(model, opts) {
      var params, url;
      if (opts == null) opts = {};
      url = opts.url || (typeof model.syncUrl === "function" ? model.syncUrl() : void 0) || (typeof model.url === "function" ? model.url() : void 0) || (function() {
        throw "" + (model.className()) + " needs a syncUrl or url method";
      })();
      params = opts.params || (typeof model.syncParams === "function" ? model.syncParams() : void 0) || (typeof model.params === "function" ? model.params() : void 0);
      return this.get(url, params, function(data) {
        return model.set(data);
      }, 'sync');
    };

    RestApi.prototype.create = function(model, opts) {
      var params, url;
      if (opts == null) opts = {};
      url = opts.url || (typeof model.createUrl === "function" ? model.createUrl() : void 0) || (typeof model.url === "function" ? model.url() : void 0) || (function() {
        throw "" + (model.className()) + " needs a createUrl or url method";
      })();
      params = opts.params || (typeof model.createParams === "function" ? model.createParams() : void 0) || (typeof model.params === "function" ? model.params() : void 0);
      return this.post(url, params, function(data) {
        return model.set(data);
      }, 'create');
    };

    RestApi.prototype.update = function(model, opts) {
      var params, url;
      if (opts == null) opts = {};
      url = opts.url || (typeof model.updateUrl === "function" ? model.updateUrl() : void 0) || (typeof model.url === "function" ? model.url() : void 0) || (function() {
        throw "" + (model.className()) + " needs an updateUrl or url method";
      })();
      params = opts.params || (typeof model.updateParams === "function" ? model.updateParams() : void 0) || (typeof model.params === "function" ? model.params() : void 0);
      return this.put(url, params, function(data) {
        return model.set(data);
      }, 'update');
    };

    RestApi.prototype.destroy = function(model, opts) {
      var params, url;
      if (opts == null) opts = {};
      url = opts.url || (typeof model.destroyUrl === "function" ? model.destroyUrl() : void 0) || (typeof model.url === "function" ? model.url() : void 0) || (function() {
        throw "" + (model.className()) + " needs a destroyUrl or url method";
      })();
      params = opts.params || (typeof model.destroyParams === "function" ? model.destroyParams() : void 0) || (typeof model.params === "function" ? model.params() : void 0);
      return this["delete"](url, params, null, 'destroy');
    };

    RestApi.prototype.get = function(url, params, callback, eventPrefix) {
      if (eventPrefix == null) eventPrefix = 'get';
      return this._ajax(url, {
        type: 'GET',
        data: params
      }, callback, eventPrefix);
    };

    RestApi.prototype.post = function(url, params, callback, eventPrefix) {
      if (eventPrefix == null) eventPrefix = 'post';
      return this._ajax(url, {
        type: 'POST',
        data: params
      }, callback, eventPrefix);
    };

    RestApi.prototype.put = function(url, params, callback, eventPrefix) {
      if (eventPrefix == null) eventPrefix = 'put';
      return this._ajax(url, {
        type: 'PUT',
        data: params
      }, callback, eventPrefix);
    };

    RestApi.prototype["delete"] = function(url, params, callback, eventPrefix) {
      if (eventPrefix == null) eventPrefix = 'delete';
      return this._ajax(url, {
        type: 'DELETE',
        data: params
      }, callback, eventPrefix);
    };

    RestApi.prototype._ajax = function(url, opts, successCallback, eventPrefix) {
      var deferred,
        _this = this;
      if (opts == null) opts = {};
      if (eventPrefix == null) eventPrefix = 'request';
      deferred = $.Deferred();
      $.ajax(url, Object.extend({}, opts, this.commonAjaxOpts)).done(function(data) {
        if (successCallback) successCallback(data);
        deferred.resolve({
          data: data
        });
        _this.emit("" + eventPrefix + ".success", {
          data: data
        });
        return _this.emit("request.success", {
          type: eventPrefix,
          data: data
        });
      }).fail(function(jqXhr, status, errors) {
        deferred.reject({
          status: status,
          errors: errors
        });
        _this.emit("" + eventPrefix + ".error", {
          status: status,
          errors: errors
        });
        return _this.emit("request.error", {
          type: eventPrefix,
          status: status,
          errors: errors
        });
      });
      return deferred.promise();
    };

    return RestApi;

  })(egg.Base);

  egg.model = function(klass) {
    klass.init(function(opts) {
      this._attrs = opts.attrs || {};
      klass.instances().add(this);
      return klass.emit('add', {
        instance: this
      });
    });
    klass.destroy(function(opts) {
      klass.instances().remove(this);
      return klass.emit('remove', {
        instance: this
      });
    });
    klass.extend({
      instances: function() {
        var _base, _ref;
        return (_ref = (_base = this.classInstanceVars()).instances) != null ? _ref : _base.instances = new egg.Set;
      },
      loadFrom: function(storage, opts) {
        var _this = this;
        if (opts == null) opts = {};
        return storage.load(this, opts).done(function(instances) {
          return _this.emit('load', {
            from: storage,
            instances: instances,
            opts: opts
          });
        });
      },
      where: function(attrs) {
        var index;
        index = egg.Index["for"](this, Object.keys(attrs));
        if (index) {
          return index.where(attrs);
        } else {
          return this.filter(function(model) {
            var key, value;
            for (key in attrs) {
              value = attrs[key];
              if (model.get(key) !== value) return false;
            }
            return true;
          });
        }
      },
      find: function(attrs) {
        return this.where(attrs).first();
      },
      findOrCreate: function(attrs) {
        return this.find(attrs) || this.create({
          attrs: attrs
        });
      },
      all: function() {
        var _base, _ref;
        return (_ref = (_base = this.classInstanceVars()).all) != null ? _ref : _base.all = egg.Scope.create({
          parent: this
        });
      },
      destroyAll: function() {
        return this.instances().forEach(function(model) {
          return model.destroy();
        });
      },
      index: function() {
        var attrNames;
        attrNames = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        return egg.Index.create({
          modelClass: this,
          attrNames: attrNames
        });
      }
    });
    klass.delegateTo('instances', ['filter', 'sample', 'count']);
    return klass.include({
      get: function(attr) {
        return this._attrs[attr];
      },
      attrs: function() {
        var keys;
        keys = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        if (keys.length) {
          return Object.slice(this._attrs, keys);
        } else {
          return Object.extend({}, this._attrs);
        }
      },
      set: function() {
        var args, attr, from, to, value, _ref;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        from = this.attrs();
        if (args.length === 1) {
          _ref = args[0];
          for (attr in _ref) {
            value = _ref[attr];
            this.setOne(attr, value);
          }
        } else {
          attr = args[0], value = args[1];
          this.setOne(attr, value);
        }
        to = this.attrs();
        return this.emit('change', {
          instance: this,
          from: from,
          to: to
        });
      },
      setOne: function(attr, value) {
        var from;
        from = this.get(attr);
        this._attrs[attr] = value;
        return this.emit("change." + attr, {
          instance: this,
          from: from,
          to: value
        });
      },
      update: function() {
        var args;
        args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
        this.set.apply(this, args);
        return this.save();
      },
      save: function() {
        return this.emit('save', {
          instance: this
        });
      },
      toJSON: function() {
        return Object.extend({}, this._attrs);
      }
    });
  };

  egg.activeRecord = function(klass, opts) {
    var baseUrl, paramsNamespace;
    if (opts == null) opts = {};
    baseUrl = opts.url || (function() {
      throw "activeRecord plugin needs a url opt";
    })();
    paramsNamespace = opts.paramsNamespace;
    return klass.include({
      isPersisted: function() {
        return !!this.get('id');
      },
      createUrl: function() {
        return baseUrl;
      },
      url: function() {
        return "" + baseUrl + "/" + (this.get('id'));
      },
      params: function() {
        var params;
        if (paramsNamespace) {
          params = {};
          params[paramsNamespace] = this.attrs();
          return params;
        } else {
          return this.attrs();
        }
      }
    });
  };

  egg.Scope = (function(_super) {

    __extends(Scope, _super);

    function Scope() {
      Scope.__super__.constructor.apply(this, arguments);
    }

    Scope.init(function(opts) {
      var _this = this;
      if (opts == null) opts = {};
      this.sorter = opts.sorter;
      this.filter = opts.filter || function() {
        return true;
      };
      this.parent = opts.parent;
      if (!this.parent) throw "Scope needs a parent";
      this._instances = new egg.Set;
      this._populateInstances();
      this.subs = [];
      this.subs.push(this.parent.on('add', function(params) {
        if (_this.filter(params.instance)) return _this._add(params.instance);
      }));
      this.subs.push(this.parent.on('change', function(params) {
        var instance;
        instance = params.instance;
        if (_this.filter(instance)) {
          if (_this.has(instance)) {
            return _this.emit('change', params);
          } else {
            return _this._add(instance);
          }
        } else {
          if (_this.has(instance)) return _this._remove(instance);
        }
      }));
      return this.subs.push(this.parent.on('remove', function(params) {
        if (_this.has(params.instance)) return _this._remove(params.instance);
      }));
    });

    Scope.destroy(function() {
      var sub, _i, _len, _ref, _results;
      _ref = this.subs;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        sub = _ref[_i];
        _results.push(sub.cancel());
      }
      return _results;
    });

    Scope.prototype.instances = function() {
      return this._instances;
    };

    Scope.prototype._populateInstances = function() {
      var _this = this;
      return this.parent.instances().forEach(function(instance) {
        if (_this.filter(instance)) return _this.instances().add(instance);
      });
    };

    Scope.prototype._add = function(instance) {
      if (this.instances().add(instance)) {
        return this.emit('add', {
          instance: instance
        });
      }
    };

    Scope.prototype._remove = function(instance) {
      if (this.instances().remove(instance)) {
        return this.emit('remove', {
          instance: instance
        });
      }
    };

    Scope.delegateInstanceMethodsTo('instances', ['has', 'toArray', 'count', 'forEach', 'first', 'pluck', 'sample', 'toJSON', 'asc', 'desc']);

    return Scope;

  })(egg.Base);

  rootKeyFor = function(attrNames) {
    return attrNames.sort().join('-');
  };

  egg.Index = (function(_super) {

    __extends(Index, _super);

    function Index() {
      Index.__super__.constructor.apply(this, arguments);
    }

    Index.indexes = {};

    Index["for"] = function(modelClass, attrNames) {
      var _ref;
      return (_ref = this.indexes[modelClass.name]) != null ? _ref[rootKeyFor(attrNames)] : void 0;
    };

    Index.init(function(opts) {
      var _base, _name,
        _this = this;
      this.modelClass = opts.modelClass;
      this.attrNames = opts.attrNames.sort();
      this.models = {};
      if ((_base = this.constructor.indexes)[_name = this.modelClass.name] == null) {
        _base[_name] = {};
      }
      this.constructor.indexes[this.modelClass.name][rootKeyFor(this.attrNames)] = this;
      this.modelClass.on('add', function(params) {
        return _this.add(params.instance, params.instance.attrs());
      });
      this.modelClass.on('change', function(params) {
        _this.remove(params.instance, params.from);
        return _this.add(params.instance, params.to);
      });
      return this.modelClass.on('remove', function(params) {
        return _this.remove(params.instance, params.instance.attrs());
      });
    });

    Index.prototype.modelKey = function(attrs) {
      var key, values, _i, _len, _ref;
      values = [];
      _ref = this.attrNames;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        key = _ref[_i];
        values.push(attrs[key]);
      }
      return values.join('-');
    };

    Index.prototype.find = function(attrs) {
      return this.where(attrs).first();
    };

    Index.prototype.where = function(attrs) {
      var _base, _name, _ref;
      return (_ref = (_base = this.models)[_name = this.modelKey(attrs)]) != null ? _ref : _base[_name] = new egg.Set;
    };

    Index.prototype.add = function(model, attrs) {
      var set, _base, _name, _ref;
      set = (_ref = (_base = this.models)[_name = this.modelKey(attrs)]) != null ? _ref : _base[_name] = new egg.Set;
      return set.add(model);
    };

    Index.prototype.remove = function(model, attrs) {
      var set;
      set = this.models[this.modelKey(attrs)];
      if (set) return set.remove(model);
    };

    return Index;

  })(egg.Base);

  egg.view = function(klass) {
    klass.extend({
      onDOM: function(selector, domEvent, eventName, paramsFunc) {
        return this.delegatedEvents()["" + domEvent + "-" + selector] = {
          domEvent: domEvent,
          selector: selector,
          eventName: eventName,
          paramsFunc: paramsFunc
        };
      },
      delegatedEvents: function() {
        var _ref;
        return (_ref = this._delegatedEvents) != null ? _ref : this._delegatedEvents = {};
      },
      onObj: function(eventName, callback) {
        return this.objectSubscriptionSpecs()[eventName] = {
          eventName: eventName,
          callback: callback
        };
      },
      objectSubscriptionSpecs: function() {
        var _ref;
        return (_ref = this._objectSubscriptionSpecs) != null ? _ref : this._objectSubscriptionSpecs = {};
      }
    });
    klass.init(function(opts) {
      this.elem = (function() {
        if (opts.elem) {
          return $(opts.elem)[0];
        } else {
          throw "Missing elem!";
        }
      })();
      this.obj = opts.obj;
      this.delegateEvents();
      if (this.obj) this.subscribeToObj();
      return this.setClassName();
    });
    klass.destroy(function(opts) {
      this.unsetClassName();
      if (this.obj) this.unsubscribeToObj();
      return this.undelegateEvents();
    });
    return klass.include({
      $: function(selector) {
        return $(this.elem).find(selector);
      },
      destroyWithElem: function() {
        this.destroy();
        return $(this.elem).remove();
      },
      delegateEvents: function() {
        var d, key, _ref, _results,
          _this = this;
        this.delegatedEventsEnabled = true;
        _ref = this.constructor.delegatedEvents();
        _results = [];
        for (key in _ref) {
          d = _ref[key];
          _results.push($(this.elem).on(d.domEvent, d.selector, d, function(e) {
            var params;
            if (_this.delegatedEventsEnabled) {
              params = {
                obj: _this.obj
              };
              if (e.data.paramsFunc) {
                Object.extend(params, e.data.paramsFunc.call(_this, e));
              }
              _this.emit(e.data.eventName, params);
              e.stopPropagation();
              return e.preventDefault();
            }
          }));
        }
        return _results;
      },
      undelegateEvents: function() {
        return this.delegatedEventsEnabled = false;
      },
      subscribeToObj: function() {
        var f, key, s, _ref, _results;
        _ref = this.constructor.objectSubscriptionSpecs();
        _results = [];
        for (key in _ref) {
          s = _ref[key];
          f = function() {
            var callback, cb,
              _this = this;
            cb = s.callback;
            callback = typeof cb === 'string' ? function() {
              var args;
              args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
              return _this[cb].apply(_this, args);
            } : function() {
              var args;
              args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
              return cb.apply(_this, args);
            };
            return this.objectSubscriptions().push(this.obj.on(s.eventName, callback));
          };
          _results.push(f.call(this));
        }
        return _results;
      },
      unsubscribeToObj: function() {
        var sub, _i, _len, _ref, _results;
        _ref = this.objectSubscriptions();
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          sub = _ref[_i];
          _results.push(sub.cancel());
        }
        return _results;
      },
      objectSubscriptions: function() {
        var _ref;
        return (_ref = this._objectSubscriptions) != null ? _ref : this._objectSubscriptions = [];
      },
      setClassName: function() {
        if (this.constructor.className) {
          return $(this.elem).addClass(this.constructor.className);
        }
      },
      unsetClassName: function() {
        if (this.constructor.className) {
          return $(this.elem).removeClass(this.constructor.className);
        }
      }
    });
  };

  egg.jsModelView = function(klass) {
    klass.use(egg.view);
    return klass.include({
      subscribeToObj: function() {
        var callback, eventName, key, s, _ref, _results,
          _this = this;
        _ref = this.constructor.objectSubscriptionSpecs();
        _results = [];
        for (key in _ref) {
          s = _ref[key];
          eventName = s.eventName;
          callback = function() {
            var args;
            args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            return _this[s.method].apply(_this, args);
          };
          this.obj.bind(eventName, callback);
          _results.push(this.objectSubscriptions().push({
            eventName: eventName,
            callback: callback
          }));
        }
        return _results;
      },
      unsubscribeToObj: function() {
        var sub, _i, _len, _ref, _results;
        _ref = this.objectSubscriptions();
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          sub = _ref[_i];
          _results.push(this.obj.unbind(sub.eventName, sub.callback));
        }
        return _results;
      }
    });
  };

}).call(this);
