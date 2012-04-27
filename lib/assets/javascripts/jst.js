define({
  load: function (name, req, load, config) {
    req(['requirejs.mustache', 'text!templates/'+name+'.mustache'], function (Mustache, html) {
      load(function(obj){
        return Mustache.render(html, obj);
      });
    });
  }
});
