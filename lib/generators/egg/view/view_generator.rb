module Egg
  class ViewGenerator < ::Rails::Generators::NamedBase
    source_root File.expand_path('../templates', __FILE__)

    argument :name, :type => :string

    def create_stuff
      template "view.coffee.erb",       "app/assets/javascripts/views/#{view_name}.coffee"
      template "presenter.coffee.erb",  "app/assets/javascripts/presenters/#{presenter_name}.coffee"
      template "handler.coffee.erb",    "app/assets/javascripts/handlers/#{handler_name}.coffee"
      template "template.mustache.erb", "app/assets/javascripts/templates/#{underscore_name}.mustache"
      template "view.css.scss.erb",     "app/assets/stylesheets/views/#{underscore_name}.css.scss"
    end

    private
  
    def underscore_name
      name.underscore.sub(/_view$/, '')
    end

    def view_name
      "#{underscore_name}_view"
    end

    def presenter_name
      "#{underscore_name}_presenter"
    end

    def handler_name
      "#{underscore_name}_handler"
    end

  end
end
