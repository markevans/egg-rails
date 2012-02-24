module Egg
  module Rails
    module ViewHelpers

      def egg_mustache_templates
        Dir[::Rails.root.join('app/assets/javascripts/shared/templates/*.mustache')].map do |path|
          egg_mustache_template(File.basename(path, '.mustache'))
        end.join("\n").html_safe
      end

      def egg_mustache_template(path)
        content = ::Rails.root.join('app/assets/javascripts/shared/templates', "#{path}.mustache").read.html_safe
        content_tag(:script, content, :type => "text/x-mustache-template", :id => "#{path}-template") +
        javascript_tag("""
          window.JST = window.JST || {}
          window.JST['#{path}'] = function(obj){
            if(!obj) obj = {}
            return Mustache.render($('##{path}-template').html(), obj)
          }
        """)
      end

    end
  end
end
